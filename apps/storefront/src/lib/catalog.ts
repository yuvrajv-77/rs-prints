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

export const FALLBACK_IMAGE_URL = "/image-not-available.svg"

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  mugs: "/categories/mugs.jpg",
  drinkware: "/categories/drinkware.jpg",
  clothing: "/categories/clothing.jpg",
  "clothing-bags": "/categories/clothing.jpg",
  bags: "/categories/bags.jpg",
  "photo-frames": FALLBACK_IMAGE_URL,
  "pillows-cushions": "/categories/home-living.jpg",
  "home-living": "/categories/home-living.jpg",
  "mdf-gifts": "/categories/gifts-accessories.jpg",
  "gifts-accessories": "/categories/gifts-accessories.jpg",
  "marketing-cards": FALLBACK_IMAGE_URL,
}

export const SUBCATEGORY_IMAGE_MAP: Record<string, string> = {
  "ceramic-mug": FALLBACK_IMAGE_URL,
  "ceramic-mugs": FALLBACK_IMAGE_URL,
  "glass-mug": FALLBACK_IMAGE_URL,
  "glass-tumblers": FALLBACK_IMAGE_URL,
  "glass-mug-tumbler": FALLBACK_IMAGE_URL,
  "magic-neon-mugs": FALLBACK_IMAGE_URL,
  "aluminium-water-bottle": FALLBACK_IMAGE_URL,
  "aluminium-bottles": FALLBACK_IMAGE_URL,
  "stainless-steel-drinkware": FALLBACK_IMAGE_URL,
  "stainless-steel": FALLBACK_IMAGE_URL,
  "kids-water-bottle": FALLBACK_IMAGE_URL,
  "kids-water-bottles": FALLBACK_IMAGE_URL,
  "fur-pillow": FALLBACK_IMAGE_URL,
  "fur-pillows": FALLBACK_IMAGE_URL,
  "flip-sequin-pillow-cover": FALLBACK_IMAGE_URL,
  "magic-sequin": FALLBACK_IMAGE_URL,
  "mdf-collage-frame": FALLBACK_IMAGE_URL,
  "mdf-collage": FALLBACK_IMAGE_URL,
  "sublimation-glass-frame": FALLBACK_IMAGE_URL,
  "stone-frame": FALLBACK_IMAGE_URL,
  "glass-stone-frames": FALLBACK_IMAGE_URL,
  "mdf-products": FALLBACK_IMAGE_URL,
  "keychains-keepsakes": FALLBACK_IMAGE_URL,
  "hard-board": FALLBACK_IMAGE_URL,
  "desktop-plaques": FALLBACK_IMAGE_URL,
  "sublimation-products": FALLBACK_IMAGE_URL,
  "promotional-supplies": FALLBACK_IMAGE_URL,
  "t-shirt": FALLBACK_IMAGE_URL,
  "custom-t-shirts": FALLBACK_IMAGE_URL,
  "custom-polo-t-shirts": FALLBACK_IMAGE_URL,
  "tote-bag": FALLBACK_IMAGE_URL,
  "custom-bags-totes": FALLBACK_IMAGE_URL,
  "custom-caps": FALLBACK_IMAGE_URL,
  "custom-activewear": FALLBACK_IMAGE_URL,
  "business-cards": FALLBACK_IMAGE_URL,
  "stationery-office": FALLBACK_IMAGE_URL,
  "stickers-labels": FALLBACK_IMAGE_URL,
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
  return FALLBACK_IMAGE_URL
}

export function getSubcategoryCoverImage(subSlug: string, parentSlug?: string): string {
  const normalized = subSlug.toLowerCase().trim()
  if (SUBCATEGORY_IMAGE_MAP[normalized]) {
    return SUBCATEGORY_IMAGE_MAP[normalized]
  }
  if (parentSlug && CATEGORY_IMAGE_MAP[parentSlug.toLowerCase().trim()]) {
    return CATEGORY_IMAGE_MAP[parentSlug.toLowerCase().trim()]
  }
  return FALLBACK_IMAGE_URL
}

export function getProductFallbackImage(
  _categorySlug?: string,
  _parentCategorySlug?: string,
  _fallbackHint?: string
): string {
  return FALLBACK_IMAGE_URL
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

const FULL_CATALOG_CACHE_TTL_MS = 5 * 60 * 1000

interface FullCatalogDataResult {
  groupedSections: CatalogParentCategory[]
  facets: any[]
  totalProducts: number
}

let fullCatalogCache: { data: FullCatalogDataResult; expiresAt: number } | null = null
let fullCatalogPending: Promise<FullCatalogDataResult> | null = null

/**
 * Returns the cached catalog sections if warm in memory, avoiding network calls.
 */
function getWarmCatalogSections(): CatalogParentCategory[] | null {
  if (fullCatalogCache && Date.now() < fullCatalogCache.expiresAt) {
    return fullCatalogCache.data.groupedSections
  }
  return null
}

/**
 * Loads all catalog sections with parent categories and subcategories (cached 5 min + deduplicated)
 */
export async function getFullCatalogData(): Promise<FullCatalogDataResult> {
  if (fullCatalogCache && Date.now() < fullCatalogCache.expiresAt) {
    return fullCatalogCache.data
  }

  if (fullCatalogPending) {
    return fullCatalogPending
  }

  fullCatalogPending = (async (): Promise<FullCatalogDataResult> => {
    let rawSections: any[] = []
    let facets: any[] = []
    let totalProducts = 0
    let loadedFromVendure = false

    try {
      const result = await getVendureGroupedSections()
      if (result && result.groupedSections && result.groupedSections.length > 0) {
        rawSections = result.groupedSections
        facets = result.facets || []
        totalProducts = result.totalProducts || 0
        loadedFromVendure = true
      } else {
        const { getCategorizedProducts } = await import("@/data/products")
        rawSections = getCategorizedProducts()
        totalProducts = rawSections.reduce((acc, g) => acc + (g.products?.length || 0), 0)
      }
    } catch {
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

    const payload: FullCatalogDataResult = { groupedSections, facets, totalProducts }
    if (loadedFromVendure && groupedSections.length > 0) {
      fullCatalogCache = { data: payload, expiresAt: Date.now() + FULL_CATALOG_CACHE_TTL_MS }
    }

    return payload
  })().finally(() => {
    fullCatalogPending = null
  })

  return fullCatalogPending
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

  // 0. Fast path: reuse already-warm in-memory catalog cache with zero network requests
  const warmSections = getWarmCatalogSections()
  if (warmSections && targetCandidates.length > 0) {
    for (const candidate of targetCandidates) {
      for (const parent of warmSections) {
        const subMatch = parent.subcategories.find((s) => normalizeSlugMatch(s.id, candidate))
        if (subMatch) {
          const filtered = subMatch.products.filter((p) => p && p.slug !== currentSlug)
          if (filtered.length > 0) {
            return filtered.slice(0, limit)
          }
        }
        if (normalizeSlugMatch(parent.id, candidate)) {
          const filtered = parent.products.filter((p) => p && p.slug !== currentSlug)
          if (filtered.length > 0) {
            return filtered.slice(0, limit)
          }
        }
      }
    }
  }

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

