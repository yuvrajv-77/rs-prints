/**
 * Product Highlights
 * Bullet points displayed on the product detail page summarizing key selling points
 * (e.g. "Fast Turnaround", "High-Definition Print").
 */
export interface ProductHighlight {
  /** Short headline title of the highlight */
  title: string
  /** Detailed 1-2 sentence description */
  desc: string
  /** Optional icon identifier or Lucide icon name */
  icon?: string
}

/**
 * Product Frequently Asked Questions (FAQ)
 * Rendered in an accordion or FAQ section on product detail pages.
 */
export interface ProductFaq {
  /** The question asked by customers */
  q: string
  /** The detailed answer */
  a: string
}

/**
 * Bulk Volume Pricing Tier
 * Used for volume discount calculations and pricing tables.
 */
export interface PricingTier {
  /** Human-readable quantity range label (e.g. "10 - 49 Pcs") */
  quantityRange: string
  /** Minimum quantity threshold required to activate this price tier */
  minQty: number
  /** Formatted price string (e.g. "₹224") */
  price: string
  /** Optional discount badge label (e.g. "10% OFF" or "Standard") */
  discountPercent?: string
  /** Savings callout text (e.g. "Bulk Saver", "Wholesale") */
  savingsLabel?: string
}

/**
 * Grouped Technical Specifications
 * Displayed in the specifications tab/table on the product page.
 */
export interface ProductSpecGroup {
  /** Name of the specification section (e.g. "Dimensions", "Material") */
  groupName: string
  /** Key-value list of specifications within this group */
  items: {
    label: string
    value: string
  }[]
}

/**
 * Vendure Product Option Value
 * Represents a single selectable option choice within an OptionGroup (e.g. 'Red', 'XL').
 */
export interface ProductOptionValue {
  /** Vendure ID of the option */
  id?: string
  /** System identifier code for the option (e.g. "red", "xl") */
  code: string
  /** Human-readable display label (e.g. "Flame Red", "Extra Large") */
  name: string
}

/**
 * Vendure Product Option Group
 * Represents an axis of variation for a product (e.g. "Size", "Color", "Finish").
 */
export interface ProductOptionGroup {
  /** Vendure ID of the option group */
  id?: string
  /** Machine-readable code (e.g. "color", "size") */
  code?: string
  /** Display title for the group */
  name: string
  /** String array of option names (kept for simple listing) */
  values?: string[]
  /** Structured option choices with IDs and codes */
  options?: ProductOptionValue[]
}

/**
 * Product Variant Option Link
 * Connects a specific ProductVariant to its selected option value and parent group.
 */
export interface ProductVariantOption {
  /** Option code (e.g. "black", "large") */
  code: string
  /** Display name of the option */
  name: string
  /** The parent option group this option belongs to (e.g. group.code = "color") */
  group?: {
    code: string
    name?: string
  }
}

/**
 * Vendure Product Variant
 * Represents a purchasable SKU with its own price, stock, and combination of options.
 */
export interface ProductVariant {
  /** Unique Vendure variant ID (used when adding to cart / creating orders) */
  id: string
  /** Display name for the variant (often "Product Name - Option1, Option2") */
  name: string
  /** Stock Keeping Unit code */
  sku?: string
  /** Base unit price without tax in major currency units (e.g., INR) */
  price?: number
  /** Gross unit price including applicable taxes (e.g., GST) */
  priceWithTax?: number
  /** ISO Currency code (e.g., "INR") */
  currencyCode?: string
  /** Inventory availability status (e.g., "IN_STOCK", "OUT_OF_STOCK") */
  stockLevel?: string
  /** Variant-specific image (e.g., photo of the black shirt instead of white) */
  featuredAsset?: {
    id?: string
    preview: string
  }
  /** The specific combination of options that defines this variant */
  options: ProductVariantOption[]
}

/**
 * Color Swatch Representation
 * Convenience structure for rendering color picker buttons/chips in the UI.
 */
export interface ProductColor {
  /** Name of the color (e.g. "Navy Blue") */
  name: string
  /** CSS Hex color string or gradient (e.g. "#1E3A8A") */
  hex: string
}

/**
 * Unified Storefront Product Model
 * Normalized product structure consumed across Astro pages and React UI components.
 * Blends Vendure GraphQL product data with custom storefront metadata.
 */
export interface Product {
  /** Vendure Product ID */
  id: string
  /** URL slug for routing (e.g. /products/custom-round-neck-tshirt) */
  slug: string
  /** Primary category / collection title */
  category: string
  /** Full product title */
  title: string
  /** Short summary tagline (typically first sentence or snippet of description) */
  tagline: string
  /** Full product description (supports HTML or plain text) */
  description?: string
  /** Formatted starting price string with currency symbol (e.g. "₹249") */
  startingPrice: string
  /** Numerical minimum price among variants for calculations and sorting */
  startingPriceNumber: number
  /** Minimum order quantity text (e.g. "1 Piece") */
  minOrder: string
  /** Typical production & dispatch timeline (e.g. "24-48 Hours") */
  turnaround: string
  /** Promotional or status pill (e.g. "Best Seller", "Custom Printed") */
  badge?: string
  /** Internal catalogue / SKU code used for print inventory reference */
  catalogueCode?: string
  /** Average customer rating score (1.0 to 5.0) */
  rating?: number
  /** Total count of customer reviews */
  reviewCount?: number
  /** Extracted color swatch options */
  colors?: ProductColor[]
  /** Material/fabric choices available for printing */
  materials?: string[]
  /** Supported print technologies (e.g. "DTF", "Screen Printing", "Sublimation") */
  printMethods?: string[]
  /** Simple list of option names for fallback displays */
  options?: string[]
  /** Full Vendure option groups (Size, Color, etc.) for interactive configurators */
  optionGroups?: ProductOptionGroup[]
  /** List of purchasable product variants associated with this product */
  variants?: ProductVariant[]
  /** Main primary image asset from Vendure */
  featuredAsset?: {
    id?: string
    preview: string
  }
  /** Key selling point highlights */
  highlights: ProductHighlight[]
  /** FAQ items displayed on the detail page */
  faqs: ProductFaq[]
  /** Tiered wholesale / bulk pricing table */
  pricingTiers?: PricingTier[]
  /** Structured technical specifications */
  specifications?: ProductSpecGroup[]
  /** Feature bullet points */
  features?: string[]
  /** Gallery images (primary image + variant assets + extra uploaded photos) */
  images: {
    url: string
    alt: string
    isPrimary?: boolean
  }[]
}

/**
 * Subcategory (Vendure Child Collection)
 * Groups related products within a broader parent category.
 */
export interface SubCategory {
  /** Collection ID */
  id: string
  /** Subcategory title (e.g. "Round Neck T-Shirts") */
  title: string
  /** Optional description text */
  description?: string
  /** Product slugs belonging to this subcategory */
  slugs: string[]
}

/**
 * Parent Category (Vendure Root Collection)
 * Top-level grouping (e.g. "Apparel", "Drinkware", "Corporate Gifts").
 */
export interface ParentCategory {
  /** Collection ID */
  id: string
  /** Category display title */
  title: string
  /** Optional summary description */
  description?: string
  /** Child subcategories nested under this collection */
  subcategories: SubCategory[]
}

/**
 * SubCategory populated with resolved Product entities for catalog grids
 */
export interface PopulatedSubCategory extends SubCategory {
  /** List of fully mapped Product objects in this subcategory */
  products: Product[]
}

/**
 * Categorized Section
 * High-level collection structure used for rendering categorized home/shop pages.
 */
export interface CategorizedSection extends ParentCategory {
  /** Total count of products across all subcategories */
  totalCount: number
  /** Populated subcategories with their respective products */
  subcategories: PopulatedSubCategory[]
  /** Direct list of products in the section */
  products: Product[]
}

/** Kept for backward compatibility with earlier navigation modules */
export type CategoryGroup = ParentCategory
