import type { Product } from "@/types/product"
import { getVendureGroupedSections, getCollectionProducts } from "@/lib/vendure/queries/products"

export interface CatalogSubcategory {
  id: string
  title: string
  description?: string
  image?: string
  count: number
  products: Product[]
}

export interface CatalogParentCategory {
  id: string
  title: string
  description: string
  image: string
  totalCount: number
  subcategories: CatalogSubcategory[]
  products: Product[]
}

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  mugs: "/categories/mugs.jpg",
  drinkware: "/categories/drinkware.jpg",
  clothing: "/categories/clothing.jpg",
  "clothing-bags": "/categories/clothing.jpg",
  bags: "/categories/bags.jpg",
  "photo-frames": "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=1000&q=80",
  "pillows-cushions": "/categories/home-living.jpg",
  "mdf-gifts": "/categories/gifts-accessories.jpg",
  "marketing-cards": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1000&q=80",
}

export const SUBCATEGORY_IMAGE_MAP: Record<string, string> = {
  "ceramic-mug": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  "ceramic-mugs": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  "glass-mug": "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80",
  "glass-tumblers": "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80",
  "glass-mug-tumbler": "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80",
  "magic-neon-mugs": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  "aluminium-water-bottle": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
  "aluminium-bottles": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
  "stainless-steel-drinkware": "https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&w=800&q=80",
  "stainless-steel": "https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&w=800&q=80",
  "kids-water-bottle": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
  "kids-water-bottles": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
  "fur-pillow": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
  "fur-pillows": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
  "flip-sequin-pillow-cover": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
  "magic-sequin": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
  "mdf-collage-frame": "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=800&q=80",
  "mdf-collage": "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=800&q=80",
  "sublimation-glass-frame": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
  "stone-frame": "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80",
  "glass-stone-frames": "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80",
  "mdf-products": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
  "keychains-keepsakes": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
  "hard-board": "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80",
  "desktop-plaques": "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80",
  "sublimation-products": "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=800&q=80",
  "promotional-supplies": "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=800&q=80",
  "t-shirt": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
  "custom-t-shirts": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
  "custom-polo-t-shirts": "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80",
  "tote-bag": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
  "custom-bags-totes": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
  "custom-caps": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",
  "custom-activewear": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
  "business-cards": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80",
  "stationery-office": "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80",
  "stickers-labels": "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=800&q=80",
}

export function getCategoryCoverImage(slug: string): string {
  const normalized = slug.toLowerCase().trim()
  if (CATEGORY_IMAGE_MAP[normalized]) {
    return CATEGORY_IMAGE_MAP[normalized]
  }
  // Try subcategory fallback
  if (SUBCATEGORY_IMAGE_MAP[normalized]) {
    return SUBCATEGORY_IMAGE_MAP[normalized]
  }
  return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80"
}

export function getSubcategoryCoverImage(subSlug: string, parentSlug?: string): string {
  const normalized = subSlug.toLowerCase().trim()
  if (SUBCATEGORY_IMAGE_MAP[normalized]) {
    return SUBCATEGORY_IMAGE_MAP[normalized]
  }
  if (parentSlug && CATEGORY_IMAGE_MAP[parentSlug.toLowerCase().trim()]) {
    return CATEGORY_IMAGE_MAP[parentSlug.toLowerCase().trim()]
  }
  return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
}

export function getProductFallbackImage(
  categorySlug?: string,
  parentCategorySlug?: string,
  fallbackHint?: string
): string {
  const candidates = [categorySlug, parentCategorySlug, fallbackHint].filter(Boolean) as string[];

  for (const raw of candidates) {
    const norm = raw.toLowerCase().trim().replace(/_/g, "-");
    if (SUBCATEGORY_IMAGE_MAP[norm]) return SUBCATEGORY_IMAGE_MAP[norm];
    if (CATEGORY_IMAGE_MAP[norm]) return CATEGORY_IMAGE_MAP[norm];

    // Normalize spaces to hyphens: e.g. "Ceramic Mug" -> "ceramic-mug"
    const hyphenated = norm.replace(/\s+/g, "-");
    if (SUBCATEGORY_IMAGE_MAP[hyphenated]) return SUBCATEGORY_IMAGE_MAP[hyphenated];
    if (CATEGORY_IMAGE_MAP[hyphenated]) return CATEGORY_IMAGE_MAP[hyphenated];

    // Keyword detection
    if (norm.includes("mug")) return SUBCATEGORY_IMAGE_MAP["ceramic-mug"];
    if (norm.includes("bottle") || norm.includes("flask") || norm.includes("sipper"))
      return SUBCATEGORY_IMAGE_MAP["aluminium-bottles"];
    if (norm.includes("drinkware") || norm.includes("steel") || norm.includes("tumbler"))
      return SUBCATEGORY_IMAGE_MAP["stainless-steel-drinkware"];
    if (norm.includes("shirt") || norm.includes("tee") || norm.includes("apparel") || norm.includes("clothing"))
      return SUBCATEGORY_IMAGE_MAP["t-shirt"];
    if (norm.includes("tote") || norm.includes("bag")) return SUBCATEGORY_IMAGE_MAP["tote-bag"];
    if (norm.includes("pillow") || norm.includes("cushion"))
      return SUBCATEGORY_IMAGE_MAP["flip-sequin-pillow-cover"];
    if (norm.includes("stone")) return SUBCATEGORY_IMAGE_MAP["stone-frame"];
    if (norm.includes("frame") || norm.includes("collage"))
      return SUBCATEGORY_IMAGE_MAP["mdf-collage-frame"];
    if (
      norm.includes("keychain") ||
      norm.includes("magnet") ||
      norm.includes("coaster") ||
      norm.includes("mdf") ||
      norm.includes("gift")
    )
      return SUBCATEGORY_IMAGE_MAP["mdf-products"];
    if (norm.includes("cap")) return SUBCATEGORY_IMAGE_MAP["custom-caps"];
  }

  return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";
}

// Maps common URL slug variations to normalized canonical slug
function normalizeSlugMatch(slugA: string, slugB: string): boolean {
  const a = slugA.toLowerCase().replace(/[-_]/g, "")
  const b = slugB.toLowerCase().replace(/[-_]/g, "")
  if (a === b) return true
  // Plural / singular checks
  if (a.endsWith("s") && a.slice(0, -1) === b) return true
  if (b.endsWith("s") && b.slice(0, -1) === a) return true
  // Common aliases
  if ((a === "clothing" || a === "bags" || a === "clothingbags") && (b === "clothing" || b === "bags" || b === "clothingbags")) return true
  if ((a === "tshirt" || a === "customtshirts") && (b === "tshirt" || b === "customtshirts")) return true
  if ((a === "totebag" || a === "custombagstotes") && (b === "totebag" || b === "custombagstotes")) return true
  if ((a === "ceramicmug" || a === "ceramicmugs") && (b === "ceramicmug" || b === "ceramicmugs")) return true
  return false
}

/**
 * Loads all catalog sections with parent categories and subcategories
 */
export async function getFullCatalogData(): Promise<{
  groupedSections: CatalogParentCategory[]
  facets: any[]
  totalProducts: number
}> {
  let rawSections: any[] = []
  let facets: any[] = []
  let totalProducts = 0

  try {
    const result = await getVendureGroupedSections()
    if (result && result.groupedSections && result.groupedSections.length > 0) {
      rawSections = result.groupedSections
      facets = result.facets || []
      totalProducts = result.totalProducts || 0
    } else {
      const { getCategorizedProducts } = await import("@/data/products")
      rawSections = getCategorizedProducts()
      totalProducts = rawSections.reduce((acc, g) => acc + (g.products?.length || 0), 0)
    }
  } catch (err) {
    const { getCategorizedProducts } = await import("@/data/products")
    rawSections = getCategorizedProducts()
    totalProducts = rawSections.reduce((acc, g) => acc + (g.products?.length || 0), 0)
  }

  const groupedSections: CatalogParentCategory[] = rawSections
    .filter((sec) => sec.products && sec.products.length > 0)
    .map((sec) => {
      const subs: CatalogSubcategory[] = (sec.subcategories || [])
        .filter((sub: any) => sub.products && sub.products.length > 0)
        .map((sub: any) => ({
          id: sub.id,
          title: sub.title || sub.name,
          description: sub.description,
          image: getSubcategoryCoverImage(sub.id, sec.id),
          count: sub.products.length,
          products: sub.products,
        }))

      return {
        id: sec.id,
        title: sec.title,
        description: sec.description || `Explore custom ${sec.title.toLowerCase()} collection.`,
        image: getCategoryCoverImage(sec.id),
        totalCount: sec.products.length,
        subcategories: subs,
        products: sec.products,
      }
    })

  return { groupedSections, facets, totalProducts }
}

/**
 * Returns all parent categories with counts and subcategories for the /categories directory
 */
export async function getAllCategories(): Promise<CatalogParentCategory[]> {
  const { groupedSections } = await getFullCatalogData()
  return groupedSections
}

/**
 * Returns a single parent category with all its products and subcategories
 */
export async function getCategoryBySlug(slug: string): Promise<{
  category: CatalogParentCategory
  allCategories: CatalogParentCategory[]
  facets: any[]
} | null> {
  const { groupedSections, facets } = await getFullCatalogData()
  const matched = groupedSections.find((cat) => normalizeSlugMatch(cat.id, slug))
  if (!matched) return null

  return {
    category: matched,
    allCategories: groupedSections,
    facets,
  }
}

/**
 * Returns a specific subcategory with its products, parent, and sibling subcategories
 */
export async function getSubcategoryBySlug(
  parentSlug: string,
  subSlug: string
): Promise<{
  parentCategory: CatalogParentCategory
  subcategory: CatalogSubcategory
  siblingSubcategories: CatalogSubcategory[]
  allCategories: CatalogParentCategory[]
  facets: any[]
} | null> {
  const { groupedSections, facets } = await getFullCatalogData()
  const parent = groupedSections.find((cat) => normalizeSlugMatch(cat.id, parentSlug))
  if (!parent) return null

  const sub = parent.subcategories.find((s) => normalizeSlugMatch(s.id, subSlug))
  if (!sub) {
    // If not found in parent, check if subSlug matches any subcategory across all parent categories
    for (const otherParent of groupedSections) {
      const fallbackSub = otherParent.subcategories.find((s) => normalizeSlugMatch(s.id, subSlug))
      if (fallbackSub) {
        return {
          parentCategory: otherParent,
          subcategory: fallbackSub,
          siblingSubcategories: otherParent.subcategories,
          allCategories: groupedSections,
          facets,
        }
      }
    }
    return null
  }

  return {
    parentCategory: parent,
    subcategory: sub,
    siblingSubcategories: parent.subcategories,
    allCategories: groupedSections,
    facets,
  }
}

/**
 * Fetches related products specifically from the same collection or category.
 * Highly optimized: uses Vendure's collection-scoped search query (take: limit + 2, <3 KB payload)
 * with in-memory caching to avoid full-catalog downloads or database egress spikes.
 * Falls back safely to collection-matched mock data.
 */
export async function getRelatedProductsFromCollection({
  currentSlug,
  subcollectionSlug,
  parentCollectionSlug,
  categoryName,
  limit = 4,
}: {
  currentSlug: string
  subcollectionSlug?: string
  parentCollectionSlug?: string
  categoryName?: string
  limit?: number
}): Promise<Product[]> {
  const targetCandidates = [subcollectionSlug, parentCollectionSlug, categoryName].filter(
    (s): s is string => Boolean(s && s.trim().length > 0)
  )

  // 1. Try fetching via Vendure collection search API (lightweight, scoped, cached 5 min)
  if (targetCandidates.length > 0) {
    try {
      const collectionItems = await getCollectionProducts(targetCandidates, limit + 2)
      if (collectionItems && collectionItems.length > 0) {
        const filtered = collectionItems
          .map((item) => item.product)
          .filter((p: Product) => p && p.slug !== currentSlug)

        if (filtered.length > 0) {
          return filtered.slice(0, limit)
        }
      }
    } catch {
      // Fallback to local catalog below
    }
  }

  // 2. Fallback to mock catalog using collection/category matching
  const { getRelatedProducts } = await import("@/data/products")
  return getRelatedProducts(
    currentSlug,
    subcollectionSlug || parentCollectionSlug || categoryName,
    limit
  )
}

