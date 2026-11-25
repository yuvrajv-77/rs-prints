import type { Product } from "@/types/product"
import { TSHIRT_CONFIG, type ProductCustomizerConfig, type TShirtColorConfig, type MockupViewConfig } from "./tshirt-mockups"
import { MUG_CONFIG, BOTTLE_CONFIG } from "./drinkware-mockups"
import { TOTE_BAG_CONFIG, OFFICE_BAG_CONFIG } from "./bag-mockups"
import {
  lookupCatalogueProductOptions,
  CATALOGUE_SINGLE_BASE_ITEMS,
  type CatalogueProductOptionDef
} from "./catalogue-options"

export type ResolvedProductType = "tshirt" | "mug" | "bottle" | "bag"

export interface CustomizerProductProfile {
  config: ProductCustomizerConfig
  productType: ResolvedProductType
  /** T-shirts support dynamic color switching (e.g. Black <-> White); Drinkware & Bags use static mockups */
  hasDynamicColors: boolean
  /** T-shirts use garment multi-size matrices (S, M, L, XL, 2XL); Mugs, Bottles & Bags use direct item quantities */
  hasGarmentSizes: boolean
  /** Human-readable attribute group label: e.g. "Colour", "Neon Colour", "Finish", "Handle Colour", "Body Colour" */
  attributeName?: string
  /** Presentation style: "color" (swatches) or "pill" (chip buttons for finishes like Glossy/Matte) */
  attributeType?: "color" | "finish" | "pill"
}

/**
 * Heuristic to map human-readable color names to hex codes for UI swatches
 */
export function guessColorHex(name: string): string {
  const l = name.toLowerCase().trim()
  if (l.includes("neon pink") || l.includes("hot pink")) return "#FF1493"
  if (l.includes("neon green") || l.includes("lime")) return "#39FF14"
  if (l.includes("neon yellow")) return "#E7FE00"
  if (l.includes("neon orange") || l.includes("orange")) return "#FF5F1F"
  if (l.includes("neon blue") || l.includes("cyan")) return "#00F5FF"
  if (l.includes("neon red")) return "#FF3366"
  if (l.includes("gold") || l.includes("golden")) return "#D4AF37"
  if (l.includes("silver")) return "#C0C0C0"
  if (l.includes("pink")) return "#EC4899"
  if (l.includes("red") || l.includes("crimson")) return "#DC2626"
  if (l.includes("navy")) return "#1E3A8A"
  if (l.includes("royal blue") || l.includes("blue")) return "#2563EB"
  if (l.includes("dark green")) return "#14532D"
  if (l.includes("green") || l.includes("emerald")) return "#16A34A"
  if (l.includes("yellow")) return "#FACC15"
  if (l.includes("orange")) return "#EA580C"
  if (l.includes("purple") || l.includes("violet")) return "#8B5CF6"
  if (l.includes("black")) return "#1A1A1A"
  if (l.includes("white")) return "#FFFFFF"
  if (l.includes("grey") || l.includes("gray")) return "#6B7280"
  if (l.includes("amber") || l.includes("brown")) return "#D97706"
  if (l.includes("natural") || l.includes("canvas")) return "#F5F2EB"
  if (l.includes("glossy")) return "#0F172A"
  if (l.includes("matte")) return "#475569"
  return "#94A3B8"
}

export function isLightHex(hex: string): boolean {
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

interface ExtractedVariantOptions {
  colors: Record<string, TShirtColorConfig>
  attributeName: string
  attributeType: "color" | "finish" | "pill"
  hasMultiple: boolean
  defaultColorId: string
}

/**
 * Extracts product-specific variant options from:
 * 1. Authoritative Catalogue Registry (Neon Mugs, Finishes, Handle Colours, Body Colours)
 * 2. Product object (colors / optionGroups from Vendure or mock data)
 * 3. URL query parameters (?color=..., ?finish=..., ?handle=...)
 *
 * For non-apparel (mugs, drinkware, bags), each variant points to the SAME 100% static base mockup view.
 */
function extractProductVariantOptions(
  product?: Product,
  searchParams?: URLSearchParams | null,
  baseViewConfig?: MockupViewConfig,
  fallbackColors: Record<string, TShirtColorConfig> = MUG_CONFIG.colors,
  fallbackDefaultId: string = "white"
): ExtractedVariantOptions {
  const slug = (product?.slug || product?.id || "").toLowerCase().trim()

  // 1. Check if this product is explicitly a single-base product (e.g. Classic White Mug A001)
  const isExplicitSingle =
    CATALOGUE_SINGLE_BASE_ITEMS.has(slug) ||
    Array.from(CATALOGUE_SINGLE_BASE_ITEMS).some((k) => slug.endsWith(`-${k}`))

  if (isExplicitSingle) {
    return {
      colors: fallbackColors,
      attributeName: "Colour",
      attributeType: "color",
      hasMultiple: false,
      defaultColorId: fallbackDefaultId
    }
  }

  // 2. Check Catalogue Multi-Variant Map
  const catDef = lookupCatalogueProductOptions(product, searchParams)
  if (catDef && catDef.options.length > 0) {
    const result: Record<string, TShirtColorConfig> = {}
    for (const opt of catDef.options) {
      result[opt.id] = {
        id: opt.id,
        name: opt.name,
        hex: opt.hex,
        isLight: isLightHex(opt.hex),
        views: baseViewConfig
          ? {
              front: {
                ...baseViewConfig
              }
            }
          : ({} as any)
      }
    }

    // Determine default: check URL param ?color= or ?finish= or default to first
    let defaultId = catDef.options[0].id
    if (searchParams) {
      const urlColor = searchParams.get("color")?.toLowerCase() || searchParams.get("finish")?.toLowerCase()
      if (urlColor) {
        const found = catDef.options.find(
          (o) => o.id === urlColor || o.name.toLowerCase().includes(urlColor)
        )
        if (found) defaultId = found.id
      }
    }

    return {
      colors: result,
      attributeName: catDef.attributeName,
      attributeType: catDef.attributeType,
      hasMultiple: catDef.options.length > 1,
      defaultColorId: defaultId
    }
  }

  // 3. Fallback to product.colors or product.optionGroups (e.g. Vendure or Mock)
  const colorItems: { name: string; hex?: string }[] = []

  if (product?.colors && product.colors.length > 0) {
    for (const c of product.colors) {
      if (c.name) colorItems.push({ name: c.name, hex: c.hex })
    }
  }

  if (colorItems.length === 0 && product?.optionGroups) {
    const colorGroup = product.optionGroups.find((g) => {
      const n = (g.name || g.code || "").toLowerCase()
      return n.includes("color") || n.includes("colour") || n.includes("finish") || n.includes("handle")
    })

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

  // 4. Fallback to URL searchParams if provided
  if (colorItems.length === 0 && searchParams) {
    const colorsParam = searchParams.get("colors")
    if (colorsParam) {
      const parts = colorsParam.split(",").map((s) => s.trim()).filter(Boolean)
      for (const p of parts) {
        colorItems.push({ name: p })
      }
    }
  }

  // If found options from product/URL
  if (colorItems.length > 0) {
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

    const keys = Object.keys(result)
    return {
      colors: result,
      attributeName: "Colour",
      attributeType: "color",
      hasMultiple: keys.length > 1,
      defaultColorId: keys[0] || fallbackDefaultId
    }
  }

  // 5. Single base product fallback (NO multiple options)
  return {
    colors: fallbackColors,
    attributeName: "Colour",
    attributeType: "color",
    hasMultiple: false,
    defaultColorId: fallbackDefaultId
  }
}

/**
 * Resolves the appropriate product customizer profile based on:
 * 1. Product category or slug
 * 2. Authoritative Catalogue variant definitions (Neon Mugs, Finishes, Handle Colours, Body Colours)
 * 3. URL search parameters
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
    const extracted = extractProductVariantOptions(
      product,
      searchParams,
      baseView,
      MUG_CONFIG.colors,
      MUG_CONFIG.defaultColorId
    )

    return {
      config: {
        ...MUG_CONFIG,
        defaultColorId: extracted.defaultColorId,
        colors: extracted.colors
      },
      productType: "mug",
      hasDynamicColors: extracted.hasMultiple,
      hasGarmentSizes: false,
      attributeName: extracted.attributeName,
      attributeType: extracted.attributeType
    }
  }

  // 2. Drinkware & Bottles (Mockup stays 100% static)
  if (
    combined.includes("bottle") ||
    combined.includes("drinkware") ||
    combined.includes("jar") ||
    combined.includes("sipper") ||
    combined.includes("tumbler") ||
    combined.includes("flask") ||
    combined.includes("beer glass") ||
    combined.includes("glass")
  ) {
    const baseView = BOTTLE_CONFIG.colors[BOTTLE_CONFIG.defaultColorId]?.views?.front
    const extracted = extractProductVariantOptions(
      product,
      searchParams,
      baseView,
      BOTTLE_CONFIG.colors,
      BOTTLE_CONFIG.defaultColorId
    )

    return {
      config: {
        ...BOTTLE_CONFIG,
        defaultColorId: extracted.defaultColorId,
        colors: extracted.colors
      },
      productType: "bottle",
      hasDynamicColors: extracted.hasMultiple,
      hasGarmentSizes: false,
      attributeName: extracted.attributeName,
      attributeType: extracted.attributeType
    }
  }

  // 3. Tote Bags (Mockup stays 100% static)
  if (combined.includes("tote")) {
    const baseView = TOTE_BAG_CONFIG.colors[TOTE_BAG_CONFIG.defaultColorId]?.views?.front
    const extracted = extractProductVariantOptions(
      product,
      searchParams,
      baseView,
      TOTE_BAG_CONFIG.colors,
      TOTE_BAG_CONFIG.defaultColorId
    )

    return {
      config: {
        ...TOTE_BAG_CONFIG,
        defaultColorId: extracted.defaultColorId,
        colors: extracted.colors
      },
      productType: "bag",
      hasDynamicColors: extracted.hasMultiple,
      hasGarmentSizes: false,
      attributeName: extracted.attributeName,
      attributeType: extracted.attributeType
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
    const extracted = extractProductVariantOptions(
      product,
      searchParams,
      baseView,
      OFFICE_BAG_CONFIG.colors,
      OFFICE_BAG_CONFIG.defaultColorId
    )

    return {
      config: {
        ...OFFICE_BAG_CONFIG,
        defaultColorId: extracted.defaultColorId,
        colors: extracted.colors
      },
      productType: "bag",
      hasDynamicColors: extracted.hasMultiple,
      hasGarmentSizes: false,
      attributeName: extracted.attributeName,
      attributeType: extracted.attributeType
    }
  }

  // 5. Default: Apparel / T-Shirt Profile (Supports dynamic visual mockup switching White <-> Black)
  return {
    config: TSHIRT_CONFIG,
    productType: "tshirt",
    hasDynamicColors: true,
    hasGarmentSizes: true,
    attributeName: "Colour",
    attributeType: "color"
  }
}
