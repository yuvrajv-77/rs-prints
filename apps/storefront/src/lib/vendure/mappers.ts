import type { Product } from "@/types/product";

/**
 * Predefined color name to hex palette mapper.
 * Covers all predefined color names selectable in the Vendure Admin UI
 * as well as common color descriptors found on product options.
 */
export const COLOR_HEX_MAP: Record<string, string> = {
  white: "#FFFFFF",
  black: "#1A1A1A",
  red: "#EF4444",
  blue: "#3B82F6",
  "light blue": "#93C5FD",
  navy: "#1E3A8A",
  green: "#10B981",
  "light green": "#86EFAC",
  "dark green": "#047857",
  yellow: "#EAB308",
  "light yellow": "#FEF08A",
  orange: "#F97316",
  pink: "#EC4899",
  purple: "#8B5CF6",
  maroon: "#881337",
  grey: "#6B7280",
  gray: "#6B7280",
  teal: "#14B8A6",
  cyan: "#06B6D4",
  brown: "#78350F",
  beige: "#F5F5DC",
  olive: "#84CC16",
  coral: "#F87171",
  gold: "#F59E0B",
  silver: "#94A3B8",
};

/**
 * Returns a CSS hex color string given a predefined color name or hex code.
 *
 * Handling:
 * 1. If given a hex code (#FFFFFF or #fff) or CSS color function (rgb/hsl), returns it as-is.
 * 2. Normalizes color name casing and whitespace, looking up the value in `COLOR_HEX_MAP`.
 * 3. Falls back safely to a neutral border gray (#E5E7EB) if unrecognized.
 */
export function getColorHex(colorNameOrHex?: string | null): string {
  if (!colorNameOrHex) return "#E5E7EB";
  const trimmed = colorNameOrHex.trim();
  if (trimmed.startsWith("#") || trimmed.startsWith("rgb") || trimmed.startsWith("hsl")) {
    return trimmed;
  }
  const normalized = trimmed.toLowerCase();
  return COLOR_HEX_MAP[normalized] || "#E5E7EB";
}

/**
 * Transforms a raw Vendure GraphQL Product entity into the normalized storefront `Product` model.
 *
 * Key transformations performed:
 * 1. Price normalization: Vendure stores money in integer cents/paise (e.g., 25000 = ₹250.00).
 *    We divide by 100 to get decimal amounts in rupees.
 * 2. Variant resolution: Extracts SKU, options, stock status, and variant-specific featured assets.
 * 3. Asset deduplication: Consolidates the product's primary featuredAsset, variant assets,
 *    and general gallery assets without duplicates.
 * 4. Option group extraction: Groups selectable variant axes (Size, Color, etc.) and extracts
 *    color swatches (checking `customFields.colorCode` first, then falling back to name mapping).
 * 5. Metadata fallback: Injects production highlights, print FAQs, and volume pricing tiers.
 */
export function mapVendureProductToStorefrontProduct(vp: any): Product {
  // 1. Map raw variants from Vendure GraphQL response
  const mappedVariants = (vp.variants || []).map((v: any) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    // Base price without tax (converted from cents/paise to major currency units)
    price: v.price ? v.price / 100 : undefined,
    // Gross price with tax (e.g. GST included)
    priceWithTax: v.priceWithTax
      ? v.priceWithTax / 100
      : v.price
      ? v.price / 100
      : undefined,
    currencyCode: v.currencyCode,
    stockLevel: v.stockLevel,
    featuredAsset: v.featuredAsset
      ? { id: v.featuredAsset.id, preview: v.featuredAsset.preview }
      : undefined,
    // Map options belonging to this variant (e.g. Size: 'L', Color: 'Black')
    options: (v.options || []).map((o: any) => ({
      code: o.code,
      name: o.name,
      group: o.group ? { code: o.group.code, name: o.group.name } : undefined,
    })),
  }));

  // 2. Calculate baseline starting price from active variants
  const prices = mappedVariants
    .map((v: any) => v.priceWithTax || v.price || 0)
    .filter((p: number) => p > 0);
  const minPriceNumber = prices.length > 0 ? Math.min(...prices) : 199;
  const startingPrice = `₹${Math.round(minPriceNumber)}`;

  // 3. Asset gallery aggregation & deduplication:
  // Order of priority: primary featured asset -> variant-specific assets -> extra gallery assets
  const imageList: { url: string; alt: string; isPrimary?: boolean }[] = [];
  const seenUrls = new Set<string>();

  // A. Primary product featured image
  if (vp.featuredAsset?.preview) {
    imageList.push({
      url: vp.featuredAsset.preview,
      alt: vp.name,
      isPrimary: true,
    });
    seenUrls.add(vp.featuredAsset.preview);
  }

  // B. Variant-specific assets (e.g., photo of the black variant vs white variant)
  for (const v of mappedVariants) {
    if (v.featuredAsset?.preview && !seenUrls.has(v.featuredAsset.preview)) {
      imageList.push({
        url: v.featuredAsset.preview,
        alt: `${vp.name} - ${v.name}`,
      });
      seenUrls.add(v.featuredAsset.preview);
    }
  }

  // C. Additional gallery assets uploaded to the product
  if (vp.assets) {
    for (const a of vp.assets) {
      if (a.preview && !seenUrls.has(a.preview)) {
        imageList.push({
          url: a.preview,
          alt: a.name || vp.name,
        });
        seenUrls.add(a.preview);
      }
    }
  }

  // D. Fallback placeholder if no images exist on Vendure
  if (imageList.length === 0) {
    imageList.push({
      url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      alt: vp.name,
      isPrimary: true,
    });
  }

  // 4. Primary Collection / Category categorization
  const primaryCollection = vp.collections?.[0];
  const categoryName = primaryCollection?.name || "Custom Printing";

  // 5. Option Groups mapping (e.g. "Size", "Color")
  const optionGroups = (vp.optionGroups || []).map((og: any) => ({
    id: og.id,
    code: og.code,
    name: og.name,
    values: (og.options || []).map((o: any) => o.name),
    options: (og.options || []).map((o: any) => ({
      id: o.id,
      code: o.code,
      name: o.name,
      // Pass through any customFields (such as colorCode on ProductOption)
      customFields: o.customFields,
    })),
  }));

  // 6. Extract color swatches specifically for visual swatch buttons in the configurator.
  // Checks `customFields.colorCode` first (which now holds a predefined color name or hex),
  // then falls back to the option name itself (e.g. option.name = "Navy").
  const colorGroup = optionGroups.find(
    (og: any) =>
      og.name.toLowerCase() === "color" || og.code.toLowerCase() === "color"
  );
  const colors = colorGroup
    ? colorGroup.options.map((o: any) => {
        const colorVal = o.customFields?.colorCode || o.name;
        return {
          name: o.name,
          hex: getColorHex(colorVal),
        };
      })
    : [];

  return {
    id: vp.id,
    slug: vp.slug,
    category: categoryName,
    title: vp.name,
    // Create a clean text snippet for the subtitle tagline
    tagline: vp.description
      ? vp.description.slice(0, 120).replace(/<[^>]+>/g, "")
      : "Custom printed merchandise by RS Prints.",
    description: vp.description || "Custom printed products with high resolution clarity and durable finish.",
    startingPrice,
    startingPriceNumber: minPriceNumber,
    minOrder: "1 Piece",
    turnaround: "24-48 Hours",
    badge: "Custom Printed",
    rating: 4.8,
    reviewCount: 156,
    images: imageList,
    colors,
    materials: [],
    printMethods: [],
    options: [],
    optionGroups: optionGroups.length > 0 ? optionGroups : undefined,
    variants: mappedVariants,
    featuredAsset: vp.featuredAsset
      ? { id: vp.featuredAsset.id, preview: vp.featuredAsset.preview }
      : undefined,
    highlights: [
      {
        title: "High-Definition Print",
        desc: "Fade-resistant colors and razor-sharp print detailing.",
      },
      {
        title: "Fast Turnaround",
        desc: "Dispatches within 24 to 48 hours with door-to-door tracking.",
      },
      {
        title: "Custom Personalization",
        desc: "Upload custom artwork, company logos, names, or photography.",
      },
    ],
    faqs: [
      {
        q: "What is the minimum order quantity?",
        a: "You can order as few as 1 piece! Bulk discounts automatically apply for larger orders.",
      },
      {
        q: "Can I preview my design before final printing?",
        a: "Yes, our team shares digital mockups / proofs on WhatsApp for approval before production begins.",
      },
      {
        q: "What file formats do you accept for custom printing?",
        a: "We accept PNG, JPG, PDF, SVG, AI, and PSD files. High resolution (300 DPI) is recommended.",
      },
    ],
    pricingTiers: [
      {
        quantityRange: "1 - 9 Pcs",
        minQty: 1,
        price: startingPrice,
        discountPercent: "Standard",
        savingsLabel: "Single pieces",
      },
      {
        quantityRange: "10 - 49 Pcs",
        minQty: 10,
        price: `₹${Math.round(minPriceNumber * 0.9)}`,
        discountPercent: "10% OFF",
        savingsLabel: "Bulk Saver",
      },
      {
        quantityRange: "50+ Pcs",
        minQty: 50,
        price: `₹${Math.round(minPriceNumber * 0.8)}`,
        discountPercent: "20% OFF",
        savingsLabel: "Wholesale",
      },
    ],
  };
}

