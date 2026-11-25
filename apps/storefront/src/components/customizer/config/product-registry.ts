import type { Product } from "@/types/product"
import { TSHIRT_CONFIG, type ProductCustomizerConfig } from "./tshirt-mockups"
import { MUG_CONFIG, BOTTLE_CONFIG } from "./drinkware-mockups"
import { TOTE_BAG_CONFIG, OFFICE_BAG_CONFIG } from "./bag-mockups"

export type ResolvedProductType = "tshirt" | "mug" | "bottle" | "bag"

export interface CustomizerProductProfile {
  config: ProductCustomizerConfig
  productType: ResolvedProductType
  /** T-shirts support dynamic color switching (e.g. Black <-> White); Drinkware & Bags use static mockups */
  hasDynamicColors: boolean
  /** T-shirts use garment multi-size matrices (S, M, L, XL, 2XL); Mugs, Bottles & Bags use direct item quantities */
  hasGarmentSizes: boolean
}

/**
 * Resolves the appropriate product customizer profile based on:
 * 1. Product category or slug
 * 2. URL search parameters (?type=..., ?category=..., ?product=...)
 * 3. Fallback to T-shirt profile
 */
export function resolveCustomizerProfile(
  product?: Product,
  searchParams?: URLSearchParams | null
): CustomizerProductProfile {
  const categoryStr = (product?.category || "").toLowerCase()
  const slugStr = (product?.slug || "").toLowerCase()
  const titleStr = (product?.title || "").toLowerCase()

  const urlType = searchParams?.get("type")?.toLowerCase() || ""
  const urlCategory = searchParams?.get("category")?.toLowerCase() || ""
  const urlProduct = searchParams?.get("product")?.toLowerCase() || ""

  const combined = `${categoryStr} ${slugStr} ${titleStr} ${urlType} ${urlCategory} ${urlProduct}`

  // 1. Mugs
  if (combined.includes("mug")) {
    return {
      config: MUG_CONFIG,
      productType: "mug",
      hasDynamicColors: false,
      hasGarmentSizes: false
    }
  }

  // 2. Drinkware & Bottles
  if (
    combined.includes("bottle") ||
    combined.includes("drinkware") ||
    combined.includes("jar") ||
    combined.includes("sipper") ||
    combined.includes("tumbler") ||
    combined.includes("flask")
  ) {
    return {
      config: BOTTLE_CONFIG,
      productType: "bottle",
      hasDynamicColors: false,
      hasGarmentSizes: false
    }
  }

  // 3. Tote Bags
  if (combined.includes("tote")) {
    return {
      config: TOTE_BAG_CONFIG,
      productType: "bag",
      hasDynamicColors: false,
      hasGarmentSizes: false
    }
  }

  // 4. Office Bags / Briefcases / General Bags
  if (
    combined.includes("bag") ||
    combined.includes("briefcase") ||
    combined.includes("laptop") ||
    combined.includes("office") ||
    combined.includes("backpack")
  ) {
    return {
      config: OFFICE_BAG_CONFIG,
      productType: "bag",
      hasDynamicColors: false,
      hasGarmentSizes: false
    }
  }

  // 5. Default: Apparel / T-Shirt Profile
  return {
    config: TSHIRT_CONFIG,
    productType: "tshirt",
    hasDynamicColors: true,
    hasGarmentSizes: true
  }
}
