import { vendureClient, formatAssetUrl } from "../client";
import { graphql } from "../generated/gql";
import { SUBCATEGORY_IMAGE_MAP, CATEGORY_IMAGE_MAP } from "@/lib/catalog";

/**
 * GraphQL Query: Get all active products with basic variant pricing.
 * Used for listing pages, search indexes, and static path generation.
 */
export const GET_PRODUCTS = graphql(`
  query GetProducts {
    products {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
        variants {
          id
          name
          price
          priceWithTax
        }
      }
    }
  }
`);

/**
 * GraphQL Query: Fetch full product details by URL slug.
 * Retrieves all gallery assets, option groups, and variants with their option combinations.
 */
export const GET_PRODUCT_BY_SLUG = graphql(`
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      featuredAsset {
        id
        preview
      }
      assets {
        id
        preview
        name
      }
      variants {
        id
        name
        sku
        price
        priceWithTax
        currencyCode
        stockLevel
        featuredAsset {
          id
          preview
        }
        options {
          id
          code
          name
          group {
            id
            code
            name
          }
        }
      }
      optionGroups {
        id
        code
        name
        options {
          id
          code
          name
        }
      }
      collections {
        id
        name
        slug
        breadcrumbs {
          id
          name
          slug
        }
        parent {
          id
          name
          slug
        }
        featuredAsset {
          id
          preview
        }
      }
    }
  }
`);

/** Fetches a simple list of products from the Shop API */
export async function getProducts() {
  const data = await vendureClient.request(GET_PRODUCTS);
  return data.products.items;
}

/** Fetches full product entity by its slug for detail page rendering */
export async function getProductBySlug(slug: string) {
  const data = await vendureClient.request(GET_PRODUCT_BY_SLUG, { slug });
  return data.product;
}

/**
 * GraphQL Query: Fetch products specifically belonging to a collection.
 * Uses Vendure's indexed Search API with `collectionSlug` and `groupByProduct: true`.
 * Transfers < 3 KB of data compared to full-catalog scans, preserving Neon DB network quota.
 */
/**
 * Resolves an item's specific subcategory slug (e.g. "ceramic-mug", "t-shirt", "stone-frame")
 * from its local mock metadata or keywords in its slug, ensuring card fallbacks render accurately.
 */
function resolveItemCategorySlug(itemSlug: string, localCategory?: string): string {
  if (localCategory) {
    const hyphenated = localCategory.toLowerCase().trim().replace(/\s+/g, "-");
    if (SUBCATEGORY_IMAGE_MAP[hyphenated] || CATEGORY_IMAGE_MAP[hyphenated]) {
      return hyphenated;
    }
  }

  const slugLower = itemSlug.toLowerCase();
  if (slugLower.includes("mug")) return "ceramic-mug";
  if (slugLower.includes("bottle") || slugLower.includes("flask") || slugLower.includes("sipper"))
    return "aluminium-bottles";
  if (slugLower.includes("drinkware") || slugLower.includes("steel") || slugLower.includes("tumbler"))
    return "stainless-steel-drinkware";
  if (slugLower.includes("t-shirt") || slugLower.includes("tee") || slugLower.includes("shirt"))
    return "t-shirt";
  if (slugLower.includes("tote") || slugLower.includes("bag")) return "tote-bag";
  if (slugLower.includes("pillow") || slugLower.includes("cushion")) return "flip-sequin-pillow-cover";
  if (slugLower.includes("stone")) return "stone-frame";
  if (slugLower.includes("frame") || slugLower.includes("collage")) return "mdf-collage-frame";
  if (
    slugLower.includes("keychain") ||
    slugLower.includes("magnet") ||
    slugLower.includes("coaster") ||
    slugLower.includes("mdf") ||
    slugLower.includes("gift")
  )
    return "mdf-products";
  if (slugLower.includes("cap")) return "custom-caps";

  return "ceramic-mug";
}

/**
 * GraphQL Query: Fetch full product entities belonging to a collection directly via collection().
 * Uses Vendure's collection API with productVariants { items { product { ... } } }.
 * Guarantees that every product has complete asset, price, variant and option data identical to category pages.
 */
export const GET_COLLECTION_PRODUCTS_DETAILED_QUERY = `
  query GetCollectionProductsDetailed($slug: String!) {
    collection(slug: $slug) {
      id
      name
      slug
      productVariants(options: { take: 50 }) {
        items {
          product {
            id
            name
            slug
            description
            featuredAsset {
              id
              preview
            }
            assets {
              id
              preview
            }
            variants {
              id
              name
              price
              priceWithTax
              featuredAsset {
                id
                preview
              }
            }
            collections {
              id
              slug
              name
            }
          }
        }
      }
    }
  }
`;

/**
 * GraphQL Query: Fetch products specifically belonging to a collection.
 * Uses Vendure's indexed Search API with `collectionSlug` and `groupByProduct: true`.
 * Requests both productAsset and productVariantAsset to cover all asset assignment patterns.
 * Transfers < 3 KB of data compared to full-catalog scans, preserving Neon DB network quota.
 */
export const GET_COLLECTION_PRODUCTS_SEARCH_QUERY = `
  query GetCollectionProductsSearch($collectionSlug: String, $take: Int) {
    search(input: { collectionSlug: $collectionSlug, groupByProduct: true, take: $take }) {
      totalItems
      items {
        productId
        slug
        productName
        description
        productAsset {
          id
          preview
        }
        productVariantAsset {
          id
          preview
        }
        priceWithTax {
          ... on SinglePrice {
            value
          }
          ... on PriceRange {
            min
            max
          }
        }
      }
    }
  }
`;

// In-memory cache for collection carousel queries (5 minutes TTL)
const collectionCache = new Map<string, { data: Array<{ product: any; categorySlug: string }>; expiresAt: number }>();
const COLLECTION_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fetches products in a specific collection by slug (or list of candidate slugs).
 * Caches the result in memory for 5 minutes to prevent redundant database traffic.
 */
export async function getCollectionProducts(
  slugOrSlugs: string | string[],
  take = 10
): Promise<Array<{ product: any; categorySlug: string }>> {
  const rawSlugs = Array.isArray(slugOrSlugs) ? slugOrSlugs : [slugOrSlugs];
  // Expand slug variations (singular/plural, customers/customer, favorites/favourites)
  const expandedSlugs = new Set<string>();
  for (const s of rawSlugs) {
    const trimmed = s.toLowerCase().trim();
    expandedSlugs.add(trimmed);
    if (trimmed.startsWith("customer-")) {
      expandedSlugs.add(trimmed.replace(/^customer-/, "customers-"));
    }
    if (trimmed.startsWith("customers-")) {
      expandedSlugs.add(trimmed.replace(/^customers-/, "customer-"));
    }
    if (trimmed.includes("favorite")) {
      expandedSlugs.add(trimmed.replace("favorite", "favourite"));
    }
    if (trimmed.includes("favourite")) {
      expandedSlugs.add(trimmed.replace("favourite", "favorite"));
    }
    if (trimmed.endsWith("s")) {
      expandedSlugs.add(trimmed.slice(0, -1));
    } else {
      expandedSlugs.add(`${trimmed}s`);
    }
  }
  const slugs = Array.from(expandedSlugs);
  const primarySlug = slugs[0];
  const cacheKey = `${primarySlug}:${take}`;
  const now = Date.now();

  const cached = collectionCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  const { mapVendureProductToStorefrontProduct } = await import("../mappers");
  const { getProductBySlug } = await import("@/data/products");

  // 1. Tier 1: Direct Collection API (exact same product model and images as category pages)
  for (const slug of slugs) {
    try {
      const colData = await vendureClient.request<{
        collection?: {
          id: string;
          name: string;
          slug: string;
          productVariants?: {
            items: Array<{
              product?: any;
            }>;
          };
        };
      }>(GET_COLLECTION_PRODUCTS_DETAILED_QUERY, { slug });

      const rawVariants = colData.collection?.productVariants?.items || [];
      if (rawVariants.length > 0) {
        const seenIds = new Set<string>();
        const uniqueProducts: any[] = [];
        for (const v of rawVariants) {
          if (v.product && !seenIds.has(String(v.product.id))) {
            seenIds.add(String(v.product.id));
            uniqueProducts.push(v.product);
          }
        }

        if (uniqueProducts.length > 0) {
          const mapped = uniqueProducts.map((p) => {
            const storefrontProd = mapVendureProductToStorefrontProduct(p);
            const catSlug = resolveItemCategorySlug(p.slug, storefrontProd.category || p.collections?.[0]?.slug);
            return {
              product: storefrontProd,
              categorySlug: catSlug,
            };
          });

          // Prioritize products with uploaded images so cards show real photos first
          mapped.sort((a, b) => {
            const aHas = (a.product.images?.length > 0 && Boolean(a.product.images[0]?.url)) ? 1 : 0;
            const bHas = (b.product.images?.length > 0 && Boolean(b.product.images[0]?.url)) ? 1 : 0;
            return bHas - aHas;
          });

          const sliced = mapped.slice(0, take);
          collectionCache.set(cacheKey, { data: sliced, expiresAt: now + COLLECTION_CACHE_TTL_MS });
          return sliced;
        }
      }
    } catch {
      // Continue to next candidate slug or Tier 2 Search API
    }
  }

  // 2. Tier 2: Search API fallback
  for (const slug of slugs) {
    try {
      const data = await vendureClient.request<{
        search?: {
          totalItems: number;
          items: Array<{
            productId: string;
            slug: string;
            productName: string;
            description: string;
            productAsset?: { id: string; preview: string } | null;
            productVariantAsset?: { id: string; preview: string } | null;
            priceWithTax: { value?: number; min?: number; max?: number };
          }>;
        };
      }>(GET_COLLECTION_PRODUCTS_SEARCH_QUERY, { collectionSlug: slug, take });

      const searchItems = data.search?.items || [];
      if (searchItems.length > 0) {
        const mappedItems = searchItems.map((item) => {
          const pricePaise = item.priceWithTax?.value ?? item.priceWithTax?.min ?? 19900;
          const priceNumber = Math.round(pricePaise / 100);
          const rawPreview = item.productAsset?.preview || item.productVariantAsset?.preview || "";
          const previewUrl = formatAssetUrl(rawPreview);

          // Check if local catalogue has rich details for this slug
          const localMock = getProductBySlug(item.slug);
          const itemCategorySlug = resolveItemCategorySlug(item.slug, localMock?.category);

          let product: any;
          if (localMock) {
            product = {
              ...localMock,
              title: item.productName || localMock.title,
              startingPrice: `₹${priceNumber}`,
              startingPriceNumber: priceNumber,
              featuredAsset: previewUrl
                ? { id: item.productAsset?.id || item.productVariantAsset?.id, preview: previewUrl }
                : localMock.featuredAsset,
              images: previewUrl
                ? [{ url: previewUrl, alt: item.productName, isPrimary: true }, ...(localMock.images || [])]
                : localMock.images,
            };
          } else {
            product = {
              id: String(item.productId),
              slug: item.slug,
              category: itemCategorySlug,
              title: item.productName,
              tagline: item.description
                ? item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100)
                : "Custom printed personalized merchandise.",
              description: item.description || "",
              startingPrice: `₹${priceNumber}`,
              startingPriceNumber: priceNumber,
              minOrder: "1 Piece",
              rating: 4.9,
              reviewCount: 36,
              images: previewUrl ? [{ url: previewUrl, alt: item.productName, isPrimary: true }] : [],
              featuredAsset: previewUrl
                ? { id: item.productAsset?.id || item.productVariantAsset?.id, preview: previewUrl }
                : undefined,
              highlights: [],
              faqs: [],
            };
          }

          return {
            product,
            categorySlug: itemCategorySlug,
          };
        });

        // Prioritize products with images
        mappedItems.sort((a, b) => {
          const aHas = (a.product.images?.length > 0 && Boolean(a.product.images[0]?.url)) ? 1 : 0;
          const bHas = (b.product.images?.length > 0 && Boolean(b.product.images[0]?.url)) ? 1 : 0;
          return bHas - aHas;
        });

        const sliced = mappedItems.slice(0, take);
        collectionCache.set(cacheKey, { data: sliced, expiresAt: now + COLLECTION_CACHE_TTL_MS });
        return sliced;
      }
    } catch (err) {
      console.warn(`[Vendure] Search query failed for collection slug "${slug}":`, err);
    }
  }

  // 3. Tier 3: Secondary fallback: check products list matching collection slug
  try {
    const data = await vendureClient.request<{
      products: {
        items: Array<{
          id: string;
          name: string;
          slug: string;
          description: string;
          featuredAsset: { id: string; preview: string } | null;
          variants: Array<{ id: string; name: string; price: number; priceWithTax: number }>;
          collections: Array<{ id: string; slug: string }>;
        }>;
      };
    }>(GET_FEATURED_PRODUCTS_QUERY, { take: 40 });

    const matching = (data.products?.items || []).filter((p) =>
      p.collections?.some((c) => slugs.includes(c.slug.toLowerCase()))
    );

    if (matching.length > 0) {
      const mapped = matching.slice(0, take).map((p) => {
        const localMock = getProductBySlug(p.slug);
        const itemCategorySlug = resolveItemCategorySlug(p.slug, localMock?.category);
        return {
          product: mapVendureProductToStorefrontProduct(p),
          categorySlug: itemCategorySlug,
        };
      });
      collectionCache.set(cacheKey, { data: mapped, expiresAt: now + COLLECTION_CACHE_TTL_MS });
      return mapped;
    }
  } catch {
    // Silent catch, fall back to empty
  }

  return [];
}

/**
 * Lightweight featured products query for the homepage carousel.
 * Limits database queries with `options: { take: $take }`, preventing full-catalog over-fetching
 * and saving Neon database network egress.
 */
export const GET_FEATURED_PRODUCTS_QUERY = `
  query GetFeaturedProducts($take: Int) {
    products(options: { take: $take }) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
        variants {
          id
          name
          price
          priceWithTax
        }
        collections {
          id
          slug
        }
      }
    }
  }
`;

export async function getFeaturedProducts(take = 8) {
  // Alias to customer-favorites collection
  const collectionItems = await getCollectionProducts(
    [
      "customers-favourite",
      "customers-favourites",
      "customer-favourites",
      "customer-favourite",
      "customers-favorites",
      "customers-favorite",
      "customer-favorites",
      "customer-favorite",
      "featured",
    ],
    take
  );
  if (collectionItems.length > 0) {
    return collectionItems;
  }

  try {
    const data = await vendureClient.request<{
      products: {
        items: Array<{
          id: string;
          name: string;
          slug: string;
          description: string;
          featuredAsset: { id: string; preview: string } | null;
          variants: Array<{ id: string; name: string; price: number; priceWithTax: number }>;
          collections: Array<{ id: string; slug: string }>;
        }>;
      };
    }>(GET_FEATURED_PRODUCTS_QUERY, { take });

    const { mapVendureProductToStorefrontProduct } = await import("../mappers");
    return (data.products?.items || []).map((p) => ({
      product: mapVendureProductToStorefrontProduct(p),
      categorySlug: p.collections?.[0]?.slug || "products",
    }));
  } catch (error) {
    console.warn("Could not fetch featured products from Vendure:", error);
    return [];
  }
}

/**
 * GraphQL Query: Complete catalog snapshot.
 * Fetches all collections (hierarchical categories), products, and facet filters
 * in a single round-trip to build categorized shop pages.
 */
export const GET_VENDURE_CATALOGUE = graphql(`
  query GetVendureCatalogue {
    collections {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
        parent {
          id
          name
          slug
        }
        children {
          id
          name
          slug
          description
        }
      }
    }
    products {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
        assets {
          id
          preview
          name
        }
        variants {
          id
          name
          price
          priceWithTax
        }
        collections {
          id
          name
          slug
          parent {
            id
            name
            slug
          }
        }
        facetValues {
          id
          name
          code
          facet {
            id
            name
            code
          }
        }
      }
    }
    facets {
      items {
        id
        name
        code
        values {
          id
          name
          code
        }
      }
    }
  }
`);

/**
 * Groups all products into hierarchical categories & subcategories based on Vendure collections.
 * 
 * Logic:
 * 1. Identifies top-level parent collections (those attached to __root_collection__ or id=1).
 * 2. Groups child subcollections under their respective parent.
 * 3. Associates products matching each collection's id or slug.
 * 4. Catches unassigned products and places them under an "Other Products" fallback section.
 */
export async function getVendureGroupedSections() {
  const data = await vendureClient.request(GET_VENDURE_CATALOGUE);
  const allCollections = data.collections.items;
  const allProducts = data.products.items;
  const allFacets = data.facets.items;

  const { mapVendureProductToStorefrontProduct } = await import("../mappers");

  // Top-level collections are those whose parent is __root_collection__ (or id === '1')
  const topLevel = allCollections.filter(
    (c) => !c.parent || c.parent.name === "__root_collection__" || c.parent.id === "1"
  );

  const sections = topLevel.map((parentCol) => {
    // Child subcollections for this parent
    const children = allCollections.filter(
      (c) => c.parent && String(c.parent.id) === String(parentCol.id)
    );

    const subcategoryDefs =
      children.length > 0
        ? children
        : [parentCol];

    const subcategories = subcategoryDefs.map((sub) => {
      const matchingProducts = allProducts.filter((p) =>
        p.collections.some(
          (c) => String(c.id) === String(sub.id) || c.slug === sub.slug
        )
      );

      return {
        id: sub.slug,
        title: sub.name,
        description: sub.description || `${sub.name} printing collection.`,
        products: matchingProducts.map(mapVendureProductToStorefrontProduct),
      };
    });

    const parentProducts = subcategories.flatMap((s) => s.products);

    return {
      id: parentCol.slug,
      title: parentCol.name,
      description: parentCol.description || `Explore our custom ${parentCol.name.toLowerCase()} range.`,
      totalCount: parentProducts.length,
      products: parentProducts,
      subcategories,
    };
  });

  // Handle any products not assigned to top-level collections
  const assignedProductIds = new Set(
    sections.flatMap((s) => s.products.map((p) => p.id))
  );
  const unassigned = allProducts
    .filter((p) => !assignedProductIds.has(p.id))
    .map(mapVendureProductToStorefrontProduct);

  if (unassigned.length > 0) {
    sections.push({
      id: "other-products",
      title: "Other Products",
      description: "Additional custom printed products available in our shop.",
      totalCount: unassigned.length,
      products: unassigned,
      subcategories: [
        {
          id: "general",
          title: "All Products",
          description: "Assorted merchandise and custom items.",
          products: unassigned,
        },
      ],
    });
  }

  return {
    groupedSections: sections,
    facets: allFacets,
    totalProducts: allProducts.length,
  };
}