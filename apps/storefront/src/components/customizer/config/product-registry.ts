import type { Product } from "@/types/product"
import { TSHIRT_CONFIG, type ProductCustomizerConfig, type TShirtColorConfig, type MockupViewConfig } from "./tshirt-mockups"
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
 * Heuristic to map human-readable color names to hex codes for UI swatches
 */
function guessColorHex(name: string): string {
  const l = name.toLowerCase().trim()
  if (l.includes("neon pink") || l.includes("hot pink")) return "#FF1493"
  if (l.includes("neon green") || l.includes("lime")) return "#39FF14"
  if (l.includes("neon yellow")) return "#E7FE00"
  if (l.includes("neon orange") || l.includes("orange")) return "#FF5F1F"
  if (l.includes("neon blue") || l.includes("cyan")) return "#00F5FF"
  if (l.includes("pink")) return "#EC4899"
  if (l.includes("red") || l.includes("crimson")) return "#DC2626"
  if (l.includes("navy")) return "#1E3A8A"
  if (l.includes("royal blue") || l.includes("blue")) return "#2563EB"
  if (l.includes("green") || l.includes("emerald")) return "#16A34A"
  if (l.includes("yellow") || l.includes("gold")) return "#FACC15"
  if (l.includes("purple") || l.includes("violet")) return "#8B5CF6"
  if (l.includes("black")) return "#1A1A1A"
  if (l.includes("white")) return "#FFFFFF"
  if (l.includes("grey") || l.includes("gray")) return "#6B7280"
  if (l.includes("silver")) return "#D1D5DB"
  if (l.includes("natural") || l.includes("canvas")) return "#F5F2EB"
  return "#94A3B8"
}

function isLightHex(hex: string): boolean {
  if (hex.startsWith("#")) {
    const c = hex.slice(1)
    if (c.length === 6) {
      const r = parseInt(c.slice(0, 2), 16)
      const g = parseInt(c.slice(2, 4), 16)
      const b = parseInt(c.slice(4, 6), 16)
      return (r * 299 + g * 587 + b * 114) / 1000 > 180
    }
  }
  return false
}

/**
 * Extracts product-specific color options from the product object or URL query params.
 * For mugs, drinkware, and bags, each color points to the SAME static base mockup view.
 */
function extractProductColors(
  product?: Product,
  searchParams?: URLSearchParams | null,
  baseViewConfig?: MockupViewConfig
): Record<string, TShirtColorConfig> | null {
  const colorItems: { name: string; hex?: string }[] = []

  // 1. From product.colors
  if (product?.colors && product.colors.length > 0) {
    for (const c of product.colors) {
      if (c.name) colorItems.push({ name: c.name, hex: c.hex })
    }
  }

  // 2. From product.optionGroups (e.g. "Color" or "Colour")
  if (colorItems.length === 0 && product?.optionGroups) {
    const colorGroup = product.optionGroups.find(
      (g) => g.code?.toLowerCase() === "color" || g.name.toLowerCase().includes("color")
    )
    if (colorGroup?.options && colorGroup.options.length > 0) {
      for (const opt of colorGroup.options) {
        colorItems.push({ name: opt.name })
      }
    } else if (colorGroup?.values && colorGroup.values.length > 0) {
      for (const val of colorGroup.values) {
        colorItems.push({ name: val })
      }
    }
  }

  // 3. From URL parameters (?colors=Neon+Pink,Neon+Green or ?color=Neon+Pink)
  if (colorItems.length === 0 && searchParams) {
    const colorsParam = searchParams.get("colors")
    if (colorsParam) {
      const parts = colorsParam.split(",").map((s) => s.trim()).filter(Boolean)
      for (const p of parts) {
        colorItems.push({ name: p })
      }
    } else {
      const singleColor = searchParams.get("color")
      if (singleColor && singleColor.toLowerCase() !== "white" && singleColor.toLowerCase() !== "black") {
        colorItems.push({ name: singleColor })
      }
    }
  }

  if (colorItems.length === 0) return null

  // Deduplicate and build color dictionary pointing to the static base mockup
  const result: Record<string, TShirtColorConfig> = {}
  for (const item of colorItems) {
    const cleanId = item.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
    const cleanHex = item.hex || guessColorHex(item.name)
    result[cleanId] = {
      id: cleanId,
      name: item.name,
      hex: cleanHex,
      isLight: isLightHex(cleanHex),
      views: baseViewConfig
        ? {
            front: {
              ...baseViewConfig
            }
          }
        : ({} as any)
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

/**
 * Resolves the appropriate product customizer profile based on:
 * 1. Product category or slug
 * 2. Product-scoped color variants
 * 3. URL search parameters (?type=..., ?category=..., ?product=...)
 * 4. Fallback to T-shirt profile
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

  // 1. Mugs (Mockup stays 100% static on 7cm x 17.2cm panoramic wrap)
  if (combined.includes("mug")) {
    const baseView = MUG_CONFIG.colors[MUG_CONFIG.defaultColorId]?.views?.front
    const scopedColors = extractProductColors(product, searchParams, baseView)
    const effectiveColors = scopedColors || MUG_CONFIG.colors
    const hasMultiple = Object.keys(effectiveColors).length > 1
    const defaultColorKey = scopedColors ? Object.keys(scopedColors)[0] : MUG_CONFIG.defaultColorId

    return {
      config: {
        ...MUG_CONFIG,
        defaultColorId: defaultColorKey,
        colors: effectiveColors
      },
      productType: "mug",
      hasDynamicColors: hasMultiple,
      hasGarmentSizes: false
    }
  }

  // 2. Drinkware & Bottles (Mockup stays 100% static)
  if (
    combined.includes("bottle") ||
    combined.includes("drinkware") ||
    combined.includes("jar") ||
    combined.includes("sipper") ||
    combined.includes("tumbler") ||
    combined.includes("flask")
  ) {
    const baseView = BOTTLE_CONFIG.colors[BOTTLE_CONFIG.defaultColorId]?.views?.front
    const scopedColors = extractProductColors(product, searchParams, baseView)
    const effectiveColors = scopedColors || BOTTLE_CONFIG.colors
    const hasMultiple = Object.keys(effectiveColors).length > 1
    const defaultColorKey = scopedColors ? Object.keys(scopedColors)[0] : BOTTLE_CONFIG.defaultColorId

    return {
      config: {
        ...BOTTLE_CONFIG,
        defaultColorId: defaultColorKey,
        colors: effectiveColors
      },
      productType: "bottle",
      hasDynamicColors: hasMultiple,
      hasGarmentSizes: false
    }
  }

  // 3. Tote Bags (Mockup stays 100% static)
  if (combined.includes("tote")) {
    const baseView = TOTE_BAG_CONFIG.colors[TOTE_BAG_CONFIG.defaultColorId]?.views?.front
    const scopedColors = extractProductColors(product, searchParams, baseView)
    const effectiveColors = scopedColors || TOTE_BAG_CONFIG.colors
    const hasMultiple = Object.keys(effectiveColors).length > 1
    const defaultColorKey = scopedColors ? Object.keys(scopedColors)[0] : TOTE_BAG_CONFIG.defaultColorId

    return {
      config: {
        ...TOTE_BAG_CONFIG,
        defaultColorId: defaultColorKey,
        colors: effectiveColors
      },
      productType: "bag",
      hasDynamicColors: hasMultiple,
      hasGarmentSizes: false
    }
  }

  // 4. Office Bags / Briefcases / General Bags (Mockup stays 100% static)
  if (
    combined.includes("bag") ||
    combined.includes("briefcase") ||
    combined.includes("laptop") ||
    combined.includes("office") ||
    combined.includes("backpack")
  ) {
    const baseView = OFFICE_BAG_CONFIG.colors[OFFICE_BAG_CONFIG.defaultColorId]?.views?.front
    const scopedColors = extractProductColors(product, searchParams, baseView)
    const effectiveColors = scopedColors || OFFICE_BAG_CONFIG.colors
    const hasMultiple = Object.keys(effectiveColors).length > 1
    const defaultColorKey = scopedColors ? Object.keys(scopedColors)[0] : OFFICE_BAG_CONFIG.defaultColorId

    return {
      config: {
        ...OFFICE_BAG_CONFIG,
        defaultColorId: defaultColorKey,
        colors: effectiveColors
      },
      productType: "bag",
      hasDynamicColors: hasMultiple,
      hasGarmentSizes: false
    }
  }

  // 5. Default: Apparel / T-Shirt Profile (Supports dynamic visual mockup switching White <-> Black)
  return {
    config: TSHIRT_CONFIG,
    productType: "tshirt",
    hasDynamicColors: true,
    hasGarmentSizes: true
  }
}
