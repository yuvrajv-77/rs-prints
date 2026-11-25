import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import type { Product, ProductVariant } from "@/types/product"
import { addToCart, updateLineQuantity, fetchActiveOrder, $cart } from "@/stores/cart"
import { getProductBySlug, getProducts } from "@/lib/vendure/queries/products"
import { mapVendureProductToStorefrontProduct } from "@/lib/vendure/mappers"
import { uploadCustomizationArtwork, type UploadedVendureAsset } from "@/lib/vendure/mutations/customization"
import { toast, Toaster } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { resolveCustomizerProfile, type CustomizerProductProfile } from "./config/product-registry"
import {
  FabricManager,
  type ArtworkLayerInfo,
  type SerializedArtwork,
  type UploadedArtworkSummary
} from "./core/fabric-manager"
import { CustomizerLeftSidebar } from "./ui/CustomizerLeftSidebar"
import { CustomizerRightSidebar } from "./ui/CustomizerRightSidebar"
import { CustomizerViewport } from "./ui/CustomizerViewport"
import { SizeQuantityTable } from "./ui/SizeQuantityTable"
import { DirectQuantitySelector } from "./ui/DirectQuantitySelector"
import { MobileColorSheet } from "./ui/MobileColorSheet"
import { MobilePlacementSheet } from "./ui/MobilePlacementSheet"
import { MobileUploadSheet } from "./ui/MobileUploadSheet"
import {
  saveCustomizationForCart,
  linkCustomizationToOrderLine,
  parseOrderLineCustomization,
  saveDesignDraft,
  loadDesignDraft,
  clearDesignDraft,
  type ProductDesignDraft
} from "@/stores/customization"
import {
  Upload,
  Sliders,
  Download,
  Layers,
  ShoppingBag,
  RotateCcw,
  Maximize2,
  ChevronDown,
  SlidersHorizontal,
  ChevronRight,
  FileText,
  X
} from "lucide-react"

export interface ProductCustomizerProps {
  product?: Product
  defaultCategory?: "tshirt" | "mug"
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"]

// Helper to normalize size parameter from URL
function normalizeSizeParam(param: string | null): string | null {
  if (!param) return null
  const clean = param.trim().toUpperCase()
  if (clean === "S" || clean === "SMALL") return "S"
  if (clean === "M" || clean === "MEDIUM") return "M"
  if (clean === "L" || clean === "LARGE") return "L"
  if (clean === "XL" || clean === "EXTRA LARGE" || clean === "X-LARGE") return "XL"
  if (clean === "2XL" || clean === "XXL" || clean === "2-XL" || clean === "DOUBLE LARGE" || clean === "XX-LARGE") return "2XL"
  if (["S", "M", "L", "XL", "2XL"].includes(clean)) return clean
  return null
}

/**
 * Resolves the best matching Vendure ProductVariant for the user's current
 * customizer selections (color/finish, garment size, and custom attributes).
 */
function resolveMatchingVariant(
  variants: ProductVariant[] | undefined,
  selection: {
    colorId: string
    colorName: string
    sizeId?: string
    customAttributes?: Record<string, string>
  }
): ProductVariant | null {
  if (!variants || variants.length === 0) return null
  if (variants.length === 1) return variants[0]

  const norm = (s: string) => s.toLowerCase().trim()
  const colorIdNorm = norm(selection.colorId).replace(/-/g, " ")
  const colorNameNorm = norm(selection.colorName)
  const sizeNorm = selection.sizeId ? norm(selection.sizeId) : ""

  let bestVariant: ProductVariant = variants[0]
  let bestScore = -Infinity

  for (const variant of variants) {
    let score = 0
    const opts = variant.options || []

    // 1. Match garment size if requested
    if (sizeNorm) {
      const sizeOpt = opts.find((o) => {
        const g = norm(o.group?.name || o.group?.code || "")
        return g.includes("size")
      })
      if (sizeOpt) {
        const optName = norm(sizeOpt.name)
        const optCode = norm(sizeOpt.code || "")
        if (optName === sizeNorm || optCode === sizeNorm) {
          score += 100
        } else {
          score -= 1000
        }
      }
    }

    // 2. Match colour / finish / handle option
    const colorOpt = opts.find((o) => {
      const g = norm(o.group?.name || o.group?.code || "")
      return (
        g.includes("color") ||
        g.includes("colour") ||
        g.includes("finish") ||
        g.includes("handle") ||
        g.includes("style")
      )
    })
    if (colorOpt) {
      const optName = norm(colorOpt.name)
      const optCode = norm(colorOpt.code || "").replace(/[_-]/g, " ")
      if (
        optName === colorNameNorm ||
        optName === colorIdNorm ||
        optCode === colorIdNorm ||
        colorNameNorm.includes(optName) ||
        optName.includes(colorIdNorm)
      ) {
        score += 50
      } else {
        score -= 50
      }
    } else if (colorIdNorm) {
      // Fallback: match against any option or variant name
      const vName = norm(variant.name)
      if (vName.includes(colorIdNorm) || vName.includes(colorNameNorm)) {
        score += 20
      }
    }

    // 3. Match custom URL attributes (e.g. material=cotton) or prefer Cotton by default
    const attrEntries = Object.entries(selection.customAttributes || {})
    for (const [k, v] of attrEntries) {
      const valNorm = norm(v)
      const keyNorm = norm(k)
      const matchedAttr = opts.some((o) => {
        const g = norm(o.group?.name || o.group?.code || "")
        const oVal = norm(o.name)
        return (g.includes(keyNorm) || keyNorm.includes(g)) && oVal === valNorm
      })
      if (matchedAttr) score += 30
    }

    if (!selection.customAttributes?.material) {
      const hasCotton = opts.some((o) => norm(o.name) === "cotton")
      if (hasCotton) score += 5
    }

    // 4. Prefer in-stock variants
    if (variant.stockLevel && variant.stockLevel !== "OUT_OF_STOCK") {
      score += 10
    }

    if (score > bestScore) {
      bestScore = score
      bestVariant = variant
    }
  }

  return bestVariant
}

export default function ProductCustomizer({ product }: ProductCustomizerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricManagerRef = useRef<FabricManager | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [resolvedProduct, setResolvedProduct] = useState<Product | undefined>(product)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [showGuides, setShowGuides] = useState<boolean>(true)

  useEffect(() => {
    setResolvedProduct(product)
  }, [product])

  // Resolve product profile dynamically (T-shirt vs Mug vs Bottle vs Bag)
  const profile: CustomizerProductProfile = useMemo(() => {
    let sp: URLSearchParams | null = null
    if (typeof window !== "undefined") {
      sp = new URLSearchParams(window.location.search)
    }
    return resolveCustomizerProfile(resolvedProduct || product, sp)
  }, [resolvedProduct, product])

  const activeConfig = profile.config

  // Product-specific draft keys so customizations are isolated per product & restored on return
  const draftPrimaryKey = useMemo(
    () =>
      resolvedProduct?.slug ||
      product?.slug ||
      resolvedProduct?.id ||
      product?.id ||
      activeConfig.productId,
    [resolvedProduct?.slug, product?.slug, resolvedProduct?.id, product?.id, activeConfig.productId]
  )

  const draftSecondaryKeys = useMemo(
    () =>
      [resolvedProduct?.id, product?.id, activeConfig.productId].filter(
        (k): k is string => Boolean(k && k !== draftPrimaryKey)
      ),
    [resolvedProduct?.id, product?.id, activeConfig.productId, draftPrimaryKey]
  )

  const editingOrderLineId = useMemo(() => {
    if (typeof window === "undefined") return null
    return new URLSearchParams(window.location.search).get("orderLineId")
  }, [])

  // When arriving from a Product Detail page (?fresh=1 and no orderLineId), start a fresh customization
  // instead of loading a previous cart item's saved customization.
  const isFreshStartRef = useRef<boolean>(false)
  const freshClearedRef = useRef<boolean>(false)
  if (!freshClearedRef.current && typeof window !== "undefined") {
    freshClearedRef.current = true
    const sp = new URLSearchParams(window.location.search)
    if (sp.get("fresh") === "1" && !sp.get("orderLineId")) {
      isFreshStartRef.current = true
      clearDesignDraft(draftPrimaryKey, draftSecondaryKeys)
    }
  }

  const isRestoringRef = useRef<boolean>(true)

  // Ensure Vendure product with variants is loaded (important for /customize landing or mock fallbacks)
  const ensureVendureProduct = useCallback(async (): Promise<Product | undefined> => {
    const existing = resolvedProduct || product
    if (existing?.variants && existing.variants.length > 0) {
      return existing
    }

    const fallbackSlug =
      existing?.slug ||
      (profile.productType === "mug"
        ? "rs-ceramic-mugs-a001"
        : profile.productType === "bottle"
        ? "alu-bottle-bb5-bb6"
        : profile.productType === "bag"
        ? "rs-custom-tote-bags-app-tote-blended-plush"
        : "app-round-tshirt")

    try {
      const vp = await getProductBySlug(fallbackSlug)
      if (vp && vp.variants && vp.variants.length > 0) {
        const mapped = mapVendureProductToStorefrontProduct(vp)
        setResolvedProduct(mapped)
        return mapped
      }

      const items = await getProducts()
      const keyword =
        profile.productType === "mug"
          ? "mug"
          : profile.productType === "bottle"
          ? "bottle"
          : profile.productType === "bag"
          ? "bag"
          : "tshirt"
      const match =
        items.find((it) => it.slug === fallbackSlug) ||
        items.find((it) => it.slug.toLowerCase().includes(keyword) || it.name.toLowerCase().includes(keyword)) ||
        items[0]

      if (match?.slug) {
        const fullVp = await getProductBySlug(match.slug)
        if (fullVp) {
          const mapped = mapVendureProductToStorefrontProduct(fullVp)
          setResolvedProduct(mapped)
          return mapped
        }
      }
    } catch (err) {
      console.warn("Could not fetch fallback Vendure product for customizer:", err)
    }

    return existing
  }, [resolvedProduct, product, profile.productType])

  useEffect(() => {
    if (!resolvedProduct?.variants?.length) {
      void ensureVendureProduct()
    }
  }, [resolvedProduct?.variants?.length, ensureVendureProduct])

  // Helper to normalize color parameter from URL against active configuration
  const normalizeColorParam = useCallback((param: string | null): string | null => {
    if (!param) return null
    const clean = param.toLowerCase().trim().replace(/[_\s]+/g, "-")
    if (clean === "black" || clean === "pitch-black" || clean === "pitchblack" || clean.includes("black")) return "black"
    if (clean === "white" || clean === "crisp-white" || clean === "crispwhite" || clean.includes("white")) return "white"
    if (clean in activeConfig.colors) return clean
    return null
  }, [activeConfig.colors])

  // Product Title from URL parameter, prop, or fallback
  const [productTitle, setProductTitle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const p = sp.get("product")
      if (p) return p
    }
    if (product?.title) return product.title
    return activeConfig.name
  })

  // Additional custom attributes from URL (e.g. capacity, material, method)
  const [customAttributes] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {}
    const sp = new URLSearchParams(window.location.search)
    const attrs: Record<string, string> = {}
    for (const [key, val] of sp.entries()) {
      const lower = key.toLowerCase()
      if (
        ![
          "product",
          "color",
          "size",
          "quantity",
          "type",
          "category",
          "notes",
          "instructions",
          "description",
          "orderlineid",
          "fresh"
        ].includes(lower) &&
        val
      ) {
        attrs[lower] = val
      }
    }
    return attrs
  })

  // Unit price from resolved product prop or default 299
  const unitPrice = useMemo(() => {
    const target = resolvedProduct || product
    if (target?.startingPriceNumber) return Math.round(target.startingPriceNumber)
    return 299
  }, [resolvedProduct, product])

  // Determine initial color: saved product customization (if artworks/notes exist) -> URL parameter -> default
  const [selectedColorId, setSelectedColorId] = useState<string>(() => {
    const draft = loadDesignDraft(draftPrimaryKey, draftSecondaryKeys)
    const hasSavedWork =
      Boolean(draft) &&
      ((draft?.viewArtworks?.front?.length || 0) > 0 ||
        (draft?.viewArtworks?.back?.length || 0) > 0 ||
        Boolean(draft?.notes))
    if (hasSavedWork && draft?.colorId && activeConfig.colors[draft.colorId]) {
      return draft.colorId
    }
    if (profile.hasDynamicColors && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const c = normalizeColorParam(sp.get("color"))
      if (c && activeConfig.colors[c]) return c
    }
    if (draft?.colorId && activeConfig.colors[draft.colorId]) return draft.colorId
    return activeConfig.defaultColorId
  })

  // Size & Multi-quantity selection state (for apparel)
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>(() => {
    const draft = loadDesignDraft(draftPrimaryKey, draftSecondaryKeys)
    if (draft?.sizeQuantities && Object.values(draft.sizeQuantities).some((q) => q > 0)) {
      return draft.sizeQuantities
    }

    const defaultSizes: Record<string, number> = {
      S: 0,
      M: 0,
      L: 1,
      XL: 0,
      "2XL": 0
    }

    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const sizeParam = normalizeSizeParam(sp.get("size"))
      const rawQty = parseInt(sp.get("quantity") || "", 10)
      const validQty = isNaN(rawQty) || rawQty < 1 ? 1 : Math.min(50, rawQty)

      if (sizeParam && sizeParam in defaultSizes) {
        return {
          S: 0,
          M: 0,
          L: 0,
          XL: 0,
          "2XL": 0,
          [sizeParam]: validQty
        }
      } else if (!isNaN(rawQty) && rawQty >= 1) {
        return {
          ...defaultSizes,
          L: validQty
        }
      }
    }

    return defaultSizes
  })

  // Direct quantity state (for mugs, drinkware, and bags)
  const [directQuantity, setDirectQuantity] = useState<number>(() => {
    const draft = loadDesignDraft(draftPrimaryKey, draftSecondaryKeys)
    if (draft?.directQuantity && draft.directQuantity >= 1) {
      return Math.min(500, draft.directQuantity)
    }
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const rawQty = parseInt(sp.get("quantity") || "", 10)
      if (!isNaN(rawQty) && rawQty >= 1) return Math.min(500, rawQty)
    }
    return 1
  })

  const totalQuantity = useMemo(() => {
    if (profile.hasGarmentSizes) {
      return Object.values(sizeQuantities).reduce((sum, qty) => sum + qty, 0)
    }
    return directQuantity
  }, [profile.hasGarmentSizes, sizeQuantities, directQuantity])

  // Sync product name, color, size, and custom configuration to URL parameters
  const syncUrlParams = useCallback(
    (colorId: string, title?: string, sizes?: Record<string, number>, directQty?: number) => {
      if (typeof window === "undefined") return
      const activeTitle = title || productTitle
      const url = new URL(window.location.href)
      url.searchParams.delete("fresh")
      url.searchParams.set("product", activeTitle)
      if (profile.hasDynamicColors) {
        url.searchParams.set("color", colorId)
      } else {
        url.searchParams.delete("color")
      }

      // Retain custom attributes from URL (e.g. capacity, material, method)
      for (const [k, v] of Object.entries(customAttributes)) {
        if (v) url.searchParams.set(k, v)
      }

      if (profile.hasGarmentSizes) {
        const currentSizes = sizes || sizeQuantities
        const activeSizeEntries = Object.entries(currentSizes).filter(([_, q]) => q > 0)
        if (activeSizeEntries.length === 1) {
          url.searchParams.set("size", activeSizeEntries[0][0])
          if (activeSizeEntries[0][1] > 1) {
            url.searchParams.set("quantity", activeSizeEntries[0][1].toString())
          } else {
            url.searchParams.delete("quantity")
          }
        } else if (activeSizeEntries.length > 1) {
          url.searchParams.delete("size")
          const total = activeSizeEntries.reduce((acc, [_, q]) => acc + q, 0)
          url.searchParams.set("quantity", total.toString())
        }
      } else {
        url.searchParams.delete("size")
        const currentDirectQty = directQty !== undefined ? directQty : directQuantity
        if (currentDirectQty > 1) {
          url.searchParams.set("quantity", currentDirectQty.toString())
        } else {
          url.searchParams.delete("quantity")
        }
      }

      window.history.replaceState({}, "", url.toString())
    },
    [productTitle, customAttributes, profile.hasDynamicColors, profile.hasGarmentSizes, sizeQuantities, directQuantity]
  )

  const handleQuantityChange = useCallback((sizeId: string, qty: number) => {
    const clamped = Math.max(0, Math.min(50, qty))
    setSizeQuantities((prev) => {
      const next = {
        ...prev,
        [sizeId]: clamped
      }
      syncUrlParams(selectedColorId, productTitle, next)
      return next
    })
  }, [selectedColorId, productTitle, syncUrlParams])

  const handleDirectQuantityChange = useCallback((qty: number) => {
    const clamped = Math.max(1, Math.min(500, qty))
    setDirectQuantity(clamped)
    syncUrlParams(selectedColorId, productTitle, sizeQuantities, clamped)
  }, [selectedColorId, productTitle, sizeQuantities, syncUrlParams])

  const [selectedViewId, setSelectedViewId] = useState<"front" | "back">(activeConfig.defaultViewId)

  const currentColor =
    activeConfig.colors[selectedColorId] ||
    activeConfig.colors[activeConfig.defaultColorId] ||
    Object.values(activeConfig.colors)[0]
  const currentView =
    currentColor.views[selectedViewId] ||
    currentColor.views.front ||
    Object.values(currentColor.views)[0]

  const [selectedPositionId, setSelectedPositionId] = useState<string>(currentView.defaultPositionId)
  const currentPosition = currentView.positions[selectedPositionId] || Object.values(currentView.positions)[0]

  // Artwork layers state
  const [artworkLayers, setArtworkLayers] = useState<ArtworkLayerInfo[]>([])
  const [selectedLayer, setSelectedLayer] = useState<ArtworkLayerInfo | null>(null)
  const [allUploadedArtworks, setAllUploadedArtworks] = useState<UploadedArtworkSummary[]>([])
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false)

  // Modal & Bottom Sheet States
  const [isMobileColorSheetOpen, setIsMobileColorSheetOpen] = useState<boolean>(false)
  const [isMobilePlacementSheetOpen, setIsMobilePlacementSheetOpen] = useState<boolean>(false)
  const [isMobileUploadSheetOpen, setIsMobileUploadSheetOpen] = useState<boolean>(false)

  // Customer description / special printing instructions
  const [customerNotes, setCustomerNotes] = useState<string>(() => {
    const draft = loadDesignDraft(draftPrimaryKey, draftSecondaryKeys)
    if (draft?.notes) return draft.notes
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const paramNote = sp.get("notes") || sp.get("instructions") || sp.get("description")
      if (paramNote) return paramNote
    }
    return ""
  })

  // Initial URL synchronization on mount
  useEffect(() => {
    syncUrlParams(selectedColorId, productTitle, sizeQuantities, directQuantity)
  }, [selectedColorId, productTitle, syncUrlParams, sizeQuantities, directQuantity])

  // Auto-save helper keyed by specific product
  const saveCurrentDraft = useCallback(
    (overrides?: Partial<ProductDesignDraft>) => {
      if (!fabricManagerRef.current) return
      const allArtworks = fabricManagerRef.current.getAllViewArtworks()
      const hasArtworks =
        (allArtworks.front?.length || 0) > 0 || (allArtworks.back?.length || 0) > 0
      const activeNotes = overrides?.notes !== undefined ? overrides.notes : customerNotes
      // Avoid overwriting an existing saved draft with an empty canvas during initial mount
      if (isRestoringRef.current && !hasArtworks && !activeNotes) return

      saveDesignDraft(
        draftPrimaryKey,
        {
          productId: resolvedProduct?.id || product?.id || activeConfig.productId,
          productSlug: resolvedProduct?.slug || product?.slug,
          productName: productTitle || resolvedProduct?.title || product?.title || activeConfig.name,
          productType: profile.productType,
          colorId: overrides?.colorId ?? selectedColorId,
          selectedViewId: overrides?.selectedViewId ?? selectedViewId,
          selectedPositionId: overrides?.selectedPositionId ?? selectedPositionId,
          viewArtworks: overrides?.viewArtworks ?? allArtworks,
          sizeQuantities: profile.hasGarmentSizes ? overrides?.sizeQuantities ?? sizeQuantities : undefined,
          directQuantity: !profile.hasGarmentSizes ? overrides?.directQuantity ?? directQuantity : undefined,
          notes: activeNotes,
          customAttributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
        },
        draftSecondaryKeys
      )
    },
    [
      draftPrimaryKey,
      draftSecondaryKeys,
      resolvedProduct,
      product,
      productTitle,
      profile.productType,
      profile.hasGarmentSizes,
      activeConfig.productId,
      activeConfig.name,
      selectedColorId,
      selectedViewId,
      selectedPositionId,
      sizeQuantities,
      directQuantity,
      customerNotes,
      customAttributes
    ]
  )

  const saveCurrentDraftRef = useRef(saveCurrentDraft)
  useEffect(() => {
    saveCurrentDraftRef.current = saveCurrentDraft
  }, [saveCurrentDraft])

  // Initialize Fabric Canvas and restore drafts (from local draft or Vendure ActiveOrder)
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    let cancelled = false
    isRestoringRef.current = true
    setIsLoading(true)

    const draft = loadDesignDraft(draftPrimaryKey, draftSecondaryKeys)
    const hasSavedDraftWork =
      Boolean(draft) &&
      ((draft?.viewArtworks?.front?.length || 0) > 0 ||
        (draft?.viewArtworks?.back?.length || 0) > 0 ||
        Boolean(draft?.notes))

    let urlColorId: string | null = null
    if (profile.hasDynamicColors && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      urlColorId = normalizeColorParam(sp.get("color"))
    }

    const initialColorId =
      hasSavedDraftWork && draft?.colorId && activeConfig.colors[draft.colorId]
        ? draft.colorId
        : urlColorId && activeConfig.colors[urlColorId]
        ? urlColorId
        : draft?.colorId && activeConfig.colors[draft.colorId]
        ? draft.colorId
        : activeConfig.defaultColorId

    const initialViewId: "front" | "back" =
      draft?.selectedViewId && activeConfig.colors[initialColorId]?.views?.[draft.selectedViewId]
        ? draft.selectedViewId
        : activeConfig.defaultViewId || "front"
    const initialColor =
      activeConfig.colors[initialColorId] ||
      activeConfig.colors[activeConfig.defaultColorId] ||
      Object.values(activeConfig.colors)[0]
    const initialView =
      initialColor.views[initialViewId] ||
      initialColor.views.front ||
      Object.values(initialColor.views)[0]
    const initialPosition =
      (draft?.selectedPositionId && initialView.positions[draft.selectedPositionId]) ||
      initialView.positions[initialView.defaultPositionId] ||
      Object.values(initialView.positions)[0]

    setSelectedColorId(initialColorId)
    setSelectedViewId(initialViewId)
    setSelectedPositionId(initialPosition.id)

    const manager = new FabricManager({
      canvasEl: canvasRef.current,
      containerEl: containerRef.current,
      baseWidth: initialView.originalWidth,
      baseHeight: initialView.originalHeight,
      currentViewId: initialViewId,
      printPosition: initialPosition,
      mockupImageUrl: initialView.image,
      onSelectionChange: (layer) => {
        setSelectedLayer(layer)
      },
      onLayersChange: (layers) => {
        setArtworkLayers(layers)
        if (!isRestoringRef.current) {
          saveCurrentDraftRef.current()
        }
      },
      onAllArtworksChange: (artworks) => {
        setAllUploadedArtworks(artworks)
      },
      onTriggerUpload: () => {
        fileInputRef.current?.click()
      },
      onError: (msg) => {
        toast.add({
          title: "Editor Error",
          description: msg,
          type: "error"
        })
      }
    })

    fabricManagerRef.current = manager

    const applyRestoredArtworks = async (
      artworks: Record<"front" | "back", SerializedArtwork[]>,
      restoredColorId?: string,
      restoredViewId?: "front" | "back",
      restoredPosId?: string,
      restoredNotes?: string,
      restoredSizes?: Record<string, number>,
      restoredDirectQty?: number
    ) => {
      if (cancelled) return

      if (restoredColorId && activeConfig.colors[restoredColorId] && restoredColorId !== initialColorId) {
        setSelectedColorId(restoredColorId)
        const targetColor = activeConfig.colors[restoredColorId]
        const targetView = targetColor.views[restoredViewId || initialViewId] || targetColor.views.front
        if (profile.productType === "tshirt" && targetView) {
          await manager.switchColor(targetView.image)
        }
      }

      if (restoredViewId && restoredViewId !== initialViewId) {
        const targetColor = activeConfig.colors[restoredColorId || initialColorId] || initialColor
        const targetView = targetColor.views[restoredViewId]
        if (targetView) {
          const pos =
            (restoredPosId && targetView.positions[restoredPosId]) ||
            targetView.positions[targetView.defaultPositionId] ||
            Object.values(targetView.positions)[0]
          setSelectedViewId(restoredViewId)
          setSelectedPositionId(pos.id)
          await manager.switchView(restoredViewId, targetView.image, pos)
        }
      } else if (restoredPosId && initialView.positions[restoredPosId] && restoredPosId !== initialPosition.id) {
        setSelectedPositionId(restoredPosId)
        manager.setupPrintableArea(initialView.positions[restoredPosId], false)
      }

      if (restoredNotes !== undefined) setCustomerNotes(restoredNotes)
      if (restoredSizes && Object.values(restoredSizes).some((q) => q > 0)) {
        setSizeQuantities(restoredSizes)
      }
      if (restoredDirectQty && restoredDirectQty >= 1) {
        setDirectQuantity(restoredDirectQty)
      }

      await manager.loadFromSerializedState(artworks)
      isRestoringRef.current = false
    }

    const restoreSession = async () => {
      try {
        // Skip restoring previous cart customizations when starting fresh from a product detail page
        if (isFreshStartRef.current && !editingOrderLineId) {
          return
        }

        // 1. Check local saved draft for this product
        if (
          draft?.viewArtworks &&
          ((draft.viewArtworks.front?.length || 0) > 0 || (draft.viewArtworks.back?.length || 0) > 0)
        ) {
          await applyRestoredArtworks(draft.viewArtworks)
          if (!cancelled) {
            toast.add({
              title: "Customization Restored",
              description: `Loaded your saved ${profile.productType} design.`,
              type: "info"
            })
          }
          return
        }

        // 2. Otherwise hydrate from Vendure activeOrder customFields (persists across browsers/devices)
        const order = $cart.get().order || (await fetchActiveOrder())
        const lines = order?.lines || []
        const matchingLine =
          (editingOrderLineId && lines.find((l) => l.id === editingOrderLineId)) ||
          lines.find((l) => {
            const p = l.productVariant?.product
            const slugMatch = resolvedProduct?.slug && p?.slug === resolvedProduct.slug
            const idMatch = resolvedProduct?.id && p?.id === resolvedProduct.id
            return Boolean((slugMatch || idMatch) && l.customFields?.customizationData)
          })

        if (matchingLine) {
          const parsed = parseOrderLineCustomization(matchingLine)
          if (parsed && (parsed.front?.artworks?.length || parsed.back?.artworks?.length)) {
            await applyRestoredArtworks(
              {
                front: parsed.front?.artworks || [],
                back: parsed.back?.artworks || [],
              },
              parsed.colorId,
              parsed.selectedViewId,
              parsed.selectedPositionId || parsed.front?.positionId || parsed.back?.positionId,
              parsed.notes,
              parsed.sizeQuantities,
              parsed.directQuantity ?? matchingLine.quantity
            )
            if (!cancelled) {
              saveCurrentDraftRef.current()
              toast.add({
                title: "Customization Loaded from Cart",
                description: `Restored your saved ${profile.productType} design from Vendure.`,
                type: "info"
              })
            }
            return
          }
        }
      } finally {
        isRestoringRef.current = false
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      cancelled = true
      manager.destroy()
      fabricManagerRef.current = null
    }
  }, [activeConfig.productId, draftPrimaryKey])

  // Auto-save draft whenever layers, view or notes change
  const triggerAutoSave = useCallback(() => {
    saveCurrentDraft()
  }, [saveCurrentDraft])

  // Auto-save whenever notes, quantities, color, view, or position change
  useEffect(() => {
    if (!fabricManagerRef.current || isRestoringRef.current) return
    saveCurrentDraft()
  }, [
    customerNotes,
    sizeQuantities,
    directQuantity,
    selectedColorId,
    selectedViewId,
    selectedPositionId,
    saveCurrentDraft
  ])

  // Garment / Product Color change
  const handleSelectColor = useCallback(async (colorId: string) => {
    setSelectedColorId(colorId)
    syncUrlParams(colorId, productTitle)
    const newColor = activeConfig.colors[colorId]
    if (!newColor) return

    // ONLY T-shirts dynamically swap canvas mockup images (White <-> Black).
    // Mugs, drinkware, and bags keep their mockup 100% static on canvas.
    if (profile.productType === "tshirt") {
      const targetView = newColor.views[selectedViewId] || newColor.views.front
      if (fabricManagerRef.current && targetView) {
        setIsLoading(true)
        try {
          await fabricManagerRef.current.switchColor(targetView.image)
          toast.add({
            title: "Colour Updated",
            description: `Switched garment to ${newColor.name}.`,
            type: "info"
          })
          triggerAutoSave()
        } catch (err) {
          console.error("Failed to switch color:", err)
        } finally {
          setIsLoading(false)
        }
      }
    } else {
      // For mugs, drinkware, and bags: purely select the product variant color without altering canvas mockup
      toast.add({
        title: "Colour Selected",
        description: `Selected ${newColor.name} for this item.`,
        type: "info"
      })
      triggerAutoSave()
    }
  }, [profile.productType, selectedViewId, triggerAutoSave, syncUrlParams, productTitle, activeConfig.colors])

  // View Angle change (Front <-> Back)
  const handleSelectView = useCallback(async (viewId: "front" | "back") => {
    if (viewId === selectedViewId) return

    setSelectedViewId(viewId)
    const targetView = currentColor.views[viewId] || currentColor.views.front
    const defaultPos = targetView.positions[targetView.defaultPositionId] || Object.values(targetView.positions)[0]
    setSelectedPositionId(defaultPos.id)

    if (fabricManagerRef.current) {
      setIsLoading(true)
      try {
        await fabricManagerRef.current.switchView(viewId, targetView.image, defaultPos)
        toast.add({
          title: `Switched to ${targetView.name}`,
          description: "Artwork for each view is automatically preserved.",
          type: "info"
        })
        triggerAutoSave()
      } catch (err) {
        console.error("Failed to switch view:", err)
        toast.add({
          title: "View Switch Failed",
          description: "Could not switch garment view angle.",
          type: "error"
        })
      } finally {
        setIsLoading(false)
      }
    }
  }, [selectedViewId, currentColor, triggerAutoSave])

  // Handle Position Switching
  const handleSelectPosition = useCallback((positionId: string) => {
    setSelectedPositionId(positionId)
    const newPos = currentView.positions[positionId]
    if (newPos && fabricManagerRef.current) {
      fabricManagerRef.current.setupPrintableArea(newPos, true)
      toast.add({
        title: "Print Position Changed",
        description: `Now editing ${newPos.name} (${newPos.physicalSizeLabel}).`,
        type: "info"
      })
      triggerAutoSave()
    }
  }, [currentView, triggerAutoSave])

  // Upload artwork image
  const handleUploadImage = useCallback((file: File) => {
    if (fabricManagerRef.current && fabricManagerRef.current.getTotalArtworkCount() >= 2) {
      toast.add({
        title: "Maximum Images Reached",
        description: "You can upload a maximum of 2 designs only. Please delete an image first.",
        type: "warning"
      })
      return
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.add({
        title: "Unsupported File Format",
        description: "Please upload a PNG, JPEG, or WEBP image file.",
        type: "error"
      })
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      toast.add({
        title: "File Too Large",
        description: `Your file is ${sizeMB}MB. The maximum allowed upload size is 25MB.`,
        type: "error"
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (!dataUrl) return

      const testImg = new Image()
      testImg.onload = () => {
        if (testImg.naturalWidth < 50 || testImg.naturalHeight < 50) {
          toast.add({
            title: "Low Resolution Warning",
            description: "Image dimensions are too small (<50px) for high quality printing.",
            type: "warning"
          })
          return
        }

        fabricManagerRef.current?.addArtworkImage(dataUrl, file.name)
        toast.add({
          title: "Artwork Added!",
          description: `Loaded ${file.name}. Drag or resize inside the printable area.`,
          type: "success"
        })
        triggerAutoSave()
      }
      testImg.onerror = () => {
        toast.add({
          title: "Invalid Image",
          description: "Could not decode the uploaded image file.",
          type: "error"
        })
      }
      testImg.src = dataUrl
    }
    reader.readAsDataURL(file)
  }, [triggerAutoSave])

  const handleTriggerUpload = useCallback(() => {
    if (allUploadedArtworks.length >= 2 || (fabricManagerRef.current && fabricManagerRef.current.getTotalArtworkCount() >= 2)) {
      toast.add({
        title: "Maximum Images Reached",
        description: "You can upload a maximum of 2 designs only. Please delete an image first.",
        type: "warning"
      })
      return
    }
    fileInputRef.current?.click()
  }, [allUploadedArtworks.length])

  const handleThumbnailClick = useCallback((art: UploadedArtworkSummary) => {
    if (selectedViewId !== art.view) {
      handleSelectView(art.view)
    }
    fabricManagerRef.current?.selectArtwork(art.id)
  }, [selectedViewId, handleSelectView])

  // Canvas Zoom Controls
  const [zoomLevel, setZoomLevel] = useState<number>(1.0)

  const handleZoomIn = useCallback(() => {
    if (!fabricManagerRef.current) return
    const next = fabricManagerRef.current.zoomIn(0.2)
    setZoomLevel(next)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!fabricManagerRef.current) return
    const next = fabricManagerRef.current.zoomOut(0.2)
    setZoomLevel(next)
  }, [])

  // Guide Toggle
  const handleToggleGuides = useCallback(() => {
    setShowGuides((prev) => {
      const next = !prev
      fabricManagerRef.current?.setGuideVisible(next)
      return next
    })
  }, [])

  // Artwork Transformations
  const handleRotateDelta = useCallback((delta: number) => {
    fabricManagerRef.current?.rotateActiveObject(delta)
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleRotateImage = useCallback(() => {
    if (!fabricManagerRef.current) return
    const targetId = selectedLayer?.id || artworkLayers[artworkLayers.length - 1]?.id
    if (targetId) {
      fabricManagerRef.current.selectArtwork(targetId)
    }
    fabricManagerRef.current.rotateActiveObject(90)
    triggerAutoSave()
  }, [selectedLayer, artworkLayers, triggerAutoSave])

  const handleSetRotation = useCallback((angle: number) => {
    fabricManagerRef.current?.setActiveObjectAngle(angle)
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleSetScale = useCallback((scale: number) => {
    fabricManagerRef.current?.setActiveObjectScale(scale)
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleCenterArtwork = useCallback(() => {
    fabricManagerRef.current?.centerActiveObject()
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleFlipH = useCallback(() => {
    fabricManagerRef.current?.flipActiveObjectH()
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleFlipV = useCallback(() => {
    fabricManagerRef.current?.flipActiveObjectV()
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleSelectLayer = useCallback((layerId: string) => {
    fabricManagerRef.current?.selectArtwork(layerId)
  }, [])

  const handleRemoveLayer = useCallback((layerId: string) => {
    fabricManagerRef.current?.removeArtwork(layerId)
    toast.add({
      title: "Layer Removed",
      description: "Artwork layer deleted from canvas.",
      type: "info"
    })
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleBringForward = useCallback((layerId: string) => {
    fabricManagerRef.current?.bringForward(layerId)
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleSendBackward = useCallback((layerId: string) => {
    fabricManagerRef.current?.sendBackward(layerId)
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleBringToFront = useCallback((layerId: string) => {
    fabricManagerRef.current?.bringToFront(layerId)
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleSendToBack = useCallback((layerId: string) => {
    fabricManagerRef.current?.sendToBack(layerId)
    triggerAutoSave()
  }, [triggerAutoSave])

  // Clear design draft
  const handleClearDesign = useCallback(() => {
    fabricManagerRef.current?.clearAllArtworks()
    fabricManagerRef.current?.resetZoom()
    setZoomLevel(1.0)
    setAllUploadedArtworks([])
    clearDesignDraft(draftPrimaryKey, draftSecondaryKeys)
    toast.add({
      title: "Design Cleared",
      description: "Reset canvas and cleared design draft.",
      type: "info"
    })
  }, [draftPrimaryKey, draftSecondaryKeys])

  // Export Mockup Preview
  const handleDownloadMockup = useCallback(() => {
    if (!fabricManagerRef.current) return
    const dataUrl = fabricManagerRef.current.exportMockupPreview()
    if (!dataUrl) return

    const link = document.createElement("a")
    link.download = `rs-prints-${selectedColorId}-${selectedViewId}-mockup.png`
    link.href = dataUrl
    link.click()

    toast.add({
      title: "Mockup Preview Saved",
      description: `${currentView.name} mockup proof downloaded as PNG.`,
      type: "success"
    })
  }, [selectedColorId, selectedViewId, currentView])

  // Export Production Artwork (Transparent 300 DPI)
  const handleDownloadPrintFile = useCallback(() => {
    if (!fabricManagerRef.current) return
    const dataUrl = fabricManagerRef.current.exportProductionArtwork()
    if (!dataUrl) {
      toast.add({
        title: "No Artwork to Export",
        description: `Please upload artwork on ${currentView.name} before downloading print files.`,
        type: "warning"
      })
      return
    }

    const link = document.createElement("a")
    link.download = `rs-prints-print-ready-${selectedViewId}-${currentPosition.id}.png`
    link.href = dataUrl
    link.click()

    toast.add({
      title: "Production Print File Ready",
      description: "Transparent, 300-DPI high-res file saved (no shirt background).",
      type: "success"
    })
  }, [currentView, selectedViewId, currentPosition])

  // Add to Cart workflow
  const handleAddToCart = useCallback(async () => {
    if (!fabricManagerRef.current) return

    if (profile.hasGarmentSizes) {
      const selectedSizesList = Object.entries(sizeQuantities).filter(([_, qty]) => qty > 0)
      if (selectedSizesList.length === 0) {
        toast.add({
          title: "No Size Selected",
          description: "Please select at least 1 item in any size before adding to cart.",
          type: "warning"
        })
        return
      }
    } else {
      if (directQuantity < 1) {
        toast.add({
          title: "Invalid Quantity",
          description: "Please select at least 1 piece before adding to cart.",
          type: "warning"
        })
        return
      }
    }

    const totalArtworks = fabricManagerRef.current.getTotalArtworkCount()
    if (totalArtworks === 0) {
      toast.add({
        title: "No Artwork Uploaded",
        description: "Please upload at least one image before adding to cart.",
        type: "warning"
      })
      return
    }

    setIsAddingToCart(true)
    let isRedirecting = false

    try {
      const activeProduct = await ensureVendureProduct()
      const variants = activeProduct?.variants || []
      if (variants.length === 0) {
        toast.add({
          title: "Product Unavailable",
          description: "Could not resolve a purchasable variant for this product. Please try opening Customize from the product page.",
          type: "error"
        })
        return
      }

      const frontPosId =
        selectedViewId === "front"
          ? selectedPositionId
          : currentColor.views.front?.defaultPositionId
      const backPosId =
        selectedViewId === "back"
          ? selectedPositionId
          : currentColor.views.back?.defaultPositionId

      const frontPos =
        currentColor.views.front &&
        (currentColor.views.front.positions[frontPosId] ||
          Object.values(currentColor.views.front.positions)[0])
      const backPos =
        currentColor.views.back &&
        (currentColor.views.back.positions[backPosId] ||
          Object.values(currentColor.views.back.positions)[0])

      const exportPkg = await fabricManagerRef.current.exportAllViewsPackage({
        front: currentColor.views.front && frontPos
          ? { image: currentColor.views.front.image, printPosition: frontPos }
          : undefined,
        back: currentColor.views.back && backPos
          ? { image: currentColor.views.back.image, printPosition: backPos }
          : undefined
      })

      const allArtworks = fabricManagerRef.current.getAllViewArtworks()
      const uploadedSummaries = fabricManagerRef.current.getAllUploadedArtworks()
      const resolvedName = productTitle || activeProduct?.title || activeConfig.name
      const resolvedSlug = activeProduct?.slug
      const currentCustomizeUrl =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : resolvedSlug
          ? `/customize/${resolvedSlug}`
          : "/customize"

      // Upload raw artwork images, preview mockups, and production PNGs to Vendure Asset storage
      const uploadCache = new Map<string, UploadedVendureAsset | null>()
      const uploadOnce = async (
        dataUrl: string | undefined,
        fileName: string,
        tags: string[]
      ): Promise<UploadedVendureAsset | null> => {
        if (!dataUrl || !dataUrl.startsWith("data:")) return null
        if (uploadCache.has(dataUrl)) return uploadCache.get(dataUrl) ?? null
        const res = await uploadCustomizationArtwork(dataUrl, fileName, tags)
        uploadCache.set(dataUrl, res)
        return res
      }

      const enrichArtworksWithVendureAssets = async (
        list: SerializedArtwork[],
        viewLabel: "front" | "back"
      ): Promise<SerializedArtwork[]> => {
        const enriched: SerializedArtwork[] = []
        for (const art of list) {
          if (art.assetUrl && art.assetId) {
            enriched.push(art)
            continue
          }
          const uploaded = await uploadOnce(
            art.dataUrl,
            `${resolvedSlug || activeConfig.productId}-${viewLabel}-${art.name}`,
            ["custom-artwork", viewLabel]
          )
          enriched.push({
            ...art,
            assetId: uploaded?.id || art.assetId,
            assetUrl: uploaded?.source || art.assetUrl
          })
        }
        return enriched
      }

      const enrichedFrontArtworks = await enrichArtworksWithVendureAssets(allArtworks.front || [], "front")
      const enrichedBackArtworks = await enrichArtworksWithVendureAssets(allArtworks.back || [], "back")

      const frontPreviewAsset = exportPkg.front
        ? await uploadOnce(
            exportPkg.front.preview,
            `${resolvedSlug || activeConfig.productId}-front-preview.png`,
            ["custom-preview", "front"]
          )
        : null
      const frontProdAsset = exportPkg.front
        ? await uploadOnce(
            exportPkg.front.production,
            `${resolvedSlug || activeConfig.productId}-front-print.png`,
            ["custom-production", "front"]
          )
        : null

      const backPreviewAsset = exportPkg.back
        ? await uploadOnce(
            exportPkg.back.preview,
            `${resolvedSlug || activeConfig.productId}-back-preview.png`,
            ["custom-preview", "back"]
          )
        : null
      const backProdAsset = exportPkg.back
        ? await uploadOnce(
            exportPkg.back.production,
            `${resolvedSlug || activeConfig.productId}-back-print.png`,
            ["custom-production", "back"]
          )
        : null

      const frontViewData = exportPkg.front && frontPos
        ? {
            positionId: frontPos.id,
            positionName: frontPos.name,
            physicalSizeLabel: frontPos.physicalSizeLabel,
            previewDataUrl: exportPkg.front.preview,
            productionDataUrl: exportPkg.front.production,
            previewAssetId: frontPreviewAsset?.id,
            previewAssetUrl: frontPreviewAsset?.preview || frontPreviewAsset?.source,
            productionAssetId: frontProdAsset?.id,
            productionAssetUrl: frontProdAsset?.source,
            artworks: enrichedFrontArtworks
          }
        : undefined

      const backViewData = exportPkg.back && backPos
        ? {
            positionId: backPos.id,
            positionName: backPos.name,
            physicalSizeLabel: backPos.physicalSizeLabel,
            previewDataUrl: exportPkg.back.preview,
            productionDataUrl: exportPkg.back.production,
            previewAssetId: backPreviewAsset?.id,
            previewAssetUrl: backPreviewAsset?.preview || backPreviewAsset?.source,
            productionAssetId: backProdAsset?.id,
            productionAssetUrl: backProdAsset?.source,
            artworks: enrichedBackArtworks
          }
        : undefined

      // Persist full product draft (with Vendure asset URLs) so clicking Customize again restores everything
      saveCurrentDraft({
        viewArtworks: {
          front: enrichedFrontArtworks,
          back: enrichedBackArtworks
        }
      })

      // Compact payload stored on Vendure OrderLine.customFields.customizationData
      const buildOrderLineCustomFields = (
        customizationId: string,
        meta: {
          variantId: string
          sku?: string
          size?: string
          quantity: number
          unitPrice: number
        }
      ) => {
        const serializeViewForVendure = (view: typeof frontViewData) => {
          if (!view) return undefined
          return {
            positionId: view.positionId,
            positionName: view.positionName,
            physicalSizeLabel: view.physicalSizeLabel,
            previewAssetId: view.previewAssetId,
            previewAssetUrl: view.previewAssetUrl,
            productionAssetId: view.productionAssetId,
            productionAssetUrl: view.productionAssetUrl,
            // Only keep inline preview if Vendure Asset upload was unavailable
            previewDataUrl: view.previewAssetUrl ? "" : view.previewDataUrl,
            productionDataUrl: "",
            artworks: view.artworks.map((a) => ({
              ...a,
              dataUrl: a.assetUrl ? "" : a.dataUrl
            }))
          }
        }

        const payload = {
          id: customizationId,
          productId: activeProduct?.id || activeConfig.productId,
          productSlug: resolvedSlug,
          productName: resolvedName,
          productType: profile.productType,
          variantId: meta.variantId,
          sku: meta.sku,
          colorId: selectedColorId,
          colorName: currentColor.name,
          size: meta.size,
          quantity: meta.quantity,
          sizeQuantities: profile.hasGarmentSizes ? sizeQuantities : undefined,
          directQuantity: !profile.hasGarmentSizes ? directQuantity : undefined,
          unitPrice: meta.unitPrice,
          customAttributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
          customizeUrl: currentCustomizeUrl,
          selectedViewId,
          selectedPositionId,
          notes: customerNotes.trim() || undefined,
          front: serializeViewForVendure(frontViewData),
          back: serializeViewForVendure(backViewData),
          timestamp: Date.now()
        }

        return {
          customizationId,
          customizationData: JSON.stringify(payload)
        }
      }

      const productDetailUrl = resolvedSlug ? `/products/${resolvedSlug}` : "/products"

      if (profile.hasGarmentSizes) {
        const selectedSizesList = Object.entries(sizeQuantities).filter(([_, qty]) => qty > 0)
        const addedItemsLog: Array<Record<string, any>> = []
        let allSucceeded = true

        for (const [sizeId, qty] of selectedSizesList) {
          const matchedVariant = resolveMatchingVariant(variants, {
            colorId: selectedColorId,
            colorName: currentColor.name,
            sizeId,
            customAttributes
          })

          if (!matchedVariant?.id) {
            allSucceeded = false
            continue
          }

          const itemUnitPrice = Math.round(
            matchedVariant.priceWithTax ?? matchedVariant.price ?? unitPrice
          )

          const customizationId = saveCustomizationForCart({
            orderLineId: editingOrderLineId || undefined,
            productId: activeProduct?.id || activeConfig.productId,
            productSlug: resolvedSlug,
            productName: resolvedName,
            productType: profile.productType,
            variantId: matchedVariant.id,
            sku: matchedVariant.sku,
            colorId: selectedColorId,
            colorName: currentColor.name,
            size: sizeId,
            quantity: qty,
            sizeQuantities,
            unitPrice: itemUnitPrice,
            customAttributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
            customizeUrl: currentCustomizeUrl,
            selectedViewId,
            selectedPositionId,
            notes: customerNotes.trim() || undefined,
            front: frontViewData,
            back: backViewData
          })

          const detailsList = [
            ...Object.entries(customAttributes).map(
              ([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`
            ),
            `Colour: ${currentColor.name}`,
            `Size: ${sizeId}`,
            customerNotes.trim() ? `Instructions: ${customerNotes.trim()}` : null,
            `Qty: ${qty}`,
            exportPkg.front ? `Front: Customized` : null,
            exportPkg.back ? `Back: Customized` : null,
            `ID: ${customizationId}`
          ].filter(Boolean).join(" | ")

          const customFields = buildOrderLineCustomFields(customizationId, {
            variantId: matchedVariant.id,
            sku: matchedVariant.sku,
            size: sizeId,
            quantity: qty,
            unitPrice: itemUnitPrice
          })

          const existingMatchingLine = editingOrderLineId
            ? $cart
                .get()
                .order?.lines?.find(
                  (l) => l.id === editingOrderLineId && l.productVariant.id === matchedVariant.id
                )
            : undefined

          let ok = false
          let resolvedOrderLineId: string | undefined = existingMatchingLine?.id

          if (existingMatchingLine) {
            ok = await updateLineQuantity(existingMatchingLine.id, qty, customFields)
          } else {
            const addResult = await addToCart(matchedVariant.id, qty, {
              productName: resolvedName,
              variantDetails: detailsList,
              suppressToast: true,
              customFields
            })
            ok = addResult.success
            const matchingOrderLine = addResult.order?.lines?.find(
              (l) =>
                l.customFields?.customizationId === customizationId ||
                l.productVariant.id === matchedVariant.id
            )
            resolvedOrderLineId = matchingOrderLine?.id
          }

          if (resolvedOrderLineId) {
            linkCustomizationToOrderLine(customizationId, resolvedOrderLineId)
          }

          if (!ok) {
            allSucceeded = false
          }

          addedItemsLog.push({
            customizationId,
            orderLineId: resolvedOrderLineId,
            addedToCart: ok,
            size: sizeId,
            quantity: qty,
            unitPrice: itemUnitPrice,
            subtotal: itemUnitPrice * qty,
            variant: {
              id: matchedVariant.id,
              sku: matchedVariant.sku,
              name: matchedVariant.name,
              options: matchedVariant.options
            }
          })
        }

        console.log("[RS Prints Customizer] Customized Product Data:", {
          timestamp: new Date().toISOString(),
          product: {
            id: activeProduct?.id || activeConfig.productId,
            slug: resolvedSlug,
            name: resolvedName,
            type: profile.productType,
            category: activeProduct?.category
          },
          selection: {
            colorId: selectedColorId,
            colorName: currentColor.name,
            attributeName: profile.attributeName,
            sizeQuantities,
            totalQuantity,
            customAttributes
          },
          notes: customerNotes.trim() || null,
          views: {
            front: frontViewData,
            back: backViewData
          },
          uploadedArtworks: uploadedSummaries,
          customizeUrl: currentCustomizeUrl,
          items: addedItemsLog
        })

        if (allSucceeded && addedItemsLog.length > 0) {
          isRedirecting = true
          const sizeSummary = selectedSizesList.map(([s, q]) => `${s}: ${q}`).join(", ")
          toast.add({
            title: "Added to Cart!",
            description: `${currentColor.name} • ${totalQuantity} piece(s) (${sizeSummary}) added to your cart.`,
            type: "success"
          })
          setTimeout(() => {
            window.location.href = productDetailUrl
          }, 450)
        } else {
          toast.add({
            title: "Could not add all items to cart",
            description: "One or more selected variants could not be added. Please check availability and try again.",
            type: "error"
          })
        }
      } else {
        // Direct quantity for Mugs, Bottles, Bags
        const matchedVariant = resolveMatchingVariant(variants, {
          colorId: selectedColorId,
          colorName: currentColor.name,
          customAttributes
        })

        if (!matchedVariant?.id) {
          toast.add({
            title: "Variant Not Found",
            description: "Could not find a matching product variant to add to cart.",
            type: "error"
          })
          return
        }

        const itemUnitPrice = Math.round(
          matchedVariant.priceWithTax ?? matchedVariant.price ?? unitPrice
        )

        const customizationId = saveCustomizationForCart({
          orderLineId: editingOrderLineId || undefined,
          productId: activeProduct?.id || activeConfig.productId,
          productSlug: resolvedSlug,
          productName: resolvedName,
          productType: profile.productType,
          variantId: matchedVariant.id,
          sku: matchedVariant.sku,
          colorId: selectedColorId,
          colorName: currentColor.name,
          quantity: directQuantity,
          directQuantity,
          unitPrice: itemUnitPrice,
          customAttributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
          customizeUrl: currentCustomizeUrl,
          selectedViewId,
          selectedPositionId,
          notes: customerNotes.trim() || undefined,
          front: frontViewData,
          back: backViewData
        })

        const detailsList = [
          ...Object.entries(customAttributes).map(
            ([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`
          ),
          profile.hasDynamicColors ? `${profile.attributeName || "Option"}: ${currentColor.name}` : null,
          customerNotes.trim() ? `Instructions: ${customerNotes.trim()}` : null,
          `Qty: ${directQuantity}`,
          exportPkg.front ? `Print: Customized` : null,
          exportPkg.back ? `Back: Customized` : null,
          `ID: ${customizationId}`
        ].filter(Boolean).join(" | ")

        const customFields = buildOrderLineCustomFields(customizationId, {
          variantId: matchedVariant.id,
          sku: matchedVariant.sku,
          quantity: directQuantity,
          unitPrice: itemUnitPrice
        })

        const existingMatchingLine = editingOrderLineId
          ? $cart
              .get()
              .order?.lines?.find(
                (l) => l.id === editingOrderLineId && l.productVariant.id === matchedVariant.id
              )
          : undefined

        let ok = false
        let resolvedOrderLineId: string | undefined = existingMatchingLine?.id

        if (existingMatchingLine) {
          ok = await updateLineQuantity(existingMatchingLine.id, directQuantity, customFields)
        } else {
          const addResult = await addToCart(matchedVariant.id, directQuantity, {
            productName: resolvedName,
            variantDetails: detailsList,
            suppressToast: true,
            customFields
          })
          ok = addResult.success
          const matchingOrderLine = addResult.order?.lines?.find(
            (l) =>
              l.customFields?.customizationId === customizationId ||
              l.productVariant.id === matchedVariant.id
          )
          resolvedOrderLineId = matchingOrderLine?.id
        }

        if (resolvedOrderLineId) {
          linkCustomizationToOrderLine(customizationId, resolvedOrderLineId)
        }

        console.log("[RS Prints Customizer] Customized Product Data:", {
          timestamp: new Date().toISOString(),
          customizationId,
          orderLineId: resolvedOrderLineId,
          addedToCart: ok,
          product: {
            id: activeProduct?.id || activeConfig.productId,
            slug: resolvedSlug,
            name: resolvedName,
            type: profile.productType,
            category: activeProduct?.category
          },
          variant: {
            id: matchedVariant.id,
            sku: matchedVariant.sku,
            name: matchedVariant.name,
            options: matchedVariant.options
          },
          selection: {
            colorId: selectedColorId,
            colorName: currentColor.name,
            attributeName: profile.attributeName,
            quantity: directQuantity,
            unitPrice: itemUnitPrice,
            totalPrice: itemUnitPrice * directQuantity,
            customAttributes
          },
          notes: customerNotes.trim() || null,
          views: {
            front: frontViewData,
            back: backViewData
          },
          uploadedArtworks: uploadedSummaries,
          customizeUrl: currentCustomizeUrl
        })

        if (ok) {
          isRedirecting = true
          toast.add({
            title: "Added to Cart!",
            description: `${resolvedName} • ${directQuantity} piece(s) added to your cart.`,
            type: "success"
          })
          setTimeout(() => {
            window.location.href = productDetailUrl
          }, 450)
        } else {
          toast.add({
            title: "Cart Error",
            description: "Could not add customized item to cart. Please try again.",
            type: "error"
          })
        }
      }
    } catch (err: any) {
      console.error("Failed to add customized item to cart:", err)
      toast.add({
        title: "Could not add to cart",
        description: err?.message || "Please check connection.",
        type: "error"
      })
    } finally {
      if (!isRedirecting) {
        setIsAddingToCart(false)
      }
    }
  }, [
    ensureVendureProduct,
    saveCurrentDraft,
    editingOrderLineId,
    productTitle,
    customAttributes,
    selectedColorId,
    selectedViewId,
    selectedPositionId,
    currentColor,
    sizeQuantities,
    directQuantity,
    totalQuantity,
    unitPrice,
    customerNotes,
    profile,
    activeConfig
  ])

  return (
    <div className="w-full h-full min-h-0 flex flex-col px-2 sm:px-6 py-2 overflow-y-auto lg:overflow-hidden relative">
     
      {/* ========================================================================= */}
      {/* MAIN RESPONSIVE WORKSPACE                                                 */}
      {/* - Desktop: 3-Column (Left Sidebar + Center Canvas + Right Sidebar)        */}
      {/* - Mobile: Column Stack (Canvas + Tabs + Cards + In-flow Checkout)        */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-5 items-stretch overflow-visible lg:overflow-hidden">
        {/* 1. Left Sidebar (Visible on Desktop lg+) */}
        <div className="hidden lg:flex lg:col-span-3 xl:col-span-3 h-full min-h-0 flex-col overflow-hidden">
          <CustomizerLeftSidebar
            colors={activeConfig.colors}
            selectedColorId={selectedColorId}
            onSelectColor={handleSelectColor}
            selectedViewId={selectedViewId}
            onSelectView={handleSelectView}
            availablePositions={currentView.positions}
            selectedPositionId={selectedPositionId}
            onSelectPosition={handleSelectPosition}
            showGuides={showGuides}
            onToggleGuides={handleToggleGuides}
            onClearDesign={handleClearDesign}
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            hasDynamicColors={profile.hasDynamicColors}
            attributeName={profile.attributeName}
            attributeType={profile.attributeType}
            notes={customerNotes}
            onNotesChange={setCustomerNotes}
          />
        </div>

        {/* 2. Unified Canvas Viewport (Center column on desktop, Hero on mobile) */}
        <div className="w-full h-[400px] sm:h-[480px] lg:h-full lg:col-span-6 xl:col-span-6 shrink-0 lg:shrink min-h-0 flex flex-col items-center justify-center relative overflow-hidden bg-card/40 rounded-3xl border border-border/60 p-3 sm:p-4 shadow-xs">
          <CustomizerViewport
            containerRef={containerRef}
            canvasRef={canvasRef}
            selectedPositionName={
              Object.keys(currentView.positions).length > 1
                ? `${currentView.name} • ${currentPosition.name}`
                : `${currentPosition.name} (${currentPosition.physicalSizeLabel})`
            }
            showGuides={showGuides}
            onToggleGuides={handleToggleGuides}
            isLoading={isLoading}
            selectedViewId={selectedViewId}
            onSelectView={handleSelectView}
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            hasBackView={Boolean(currentColor.views?.back)}
          />
        </div>

        {/* 3. Right Sidebar (Visible on Desktop lg+) */}
        <div className="hidden lg:flex lg:col-span-3 xl:col-span-3 h-full min-h-0 flex-col overflow-hidden">
          <CustomizerRightSidebar
            artworkLayers={artworkLayers}
            selectedLayer={selectedLayer}
            onSelectLayer={handleSelectLayer}
            onRemoveLayer={handleRemoveLayer}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            onUploadImage={handleUploadImage}
            onRotateDelta={handleRotateDelta}
            onSetRotation={handleSetRotation}
            onSetScale={handleSetScale}
            onCenterArtwork={handleCenterArtwork}
            onFlipH={handleFlipH}
            onFlipV={handleFlipV}
            onDownloadMockup={handleDownloadMockup}
            onDownloadPrintFile={handleDownloadPrintFile}
            onRequestAddToCart={handleAddToCart}
            isAddingToCart={isAddingToCart}
            unitPrice={unitPrice}
            sizeQuantities={sizeQuantities}
            onQuantityChange={handleQuantityChange}
            totalQuantity={totalQuantity}
            hasGarmentSizes={profile.hasGarmentSizes}
            directQuantity={directQuantity}
            onDirectQuantityChange={handleDirectQuantityChange}
            materialSubtitle={
              profile.productType === "mug"
                ? "Ceramic 11oz • 7 cm × 17.2 cm"
                : profile.productType === "bottle"
                ? "304 Stainless Steel • 750ml"
                : profile.productType === "bag"
                ? "Heavy Canvas / Poly"
                : "Bio-washed 180 GSM"
            }
          />
        </div>

        {/* 4. Mobile Column Controls (Visible on Mobile below lg) */}
        <div className="lg:hidden flex flex-col w-full space-y-3 pb-32 sm:pb-36 pt-1">
          {/* Mobile Selection Tabs: Colour & Print Placement Buttons side-by-side */}
          {(() => {
            const hasMultiplePositions = Object.keys(currentView.positions).length > 1
            const hasColorSelection = profile.hasDynamicColors && Object.keys(activeConfig.colors).length > 1
            const colsClass =
              hasColorSelection && hasMultiplePositions
                ? "grid-cols-4"
                : hasColorSelection || hasMultiplePositions
                ? "grid-cols-3"
                : "grid-cols-2"

            return (
              <div className={`bg-card rounded-2xl border border-border/80 shadow-xs grid ${colsClass} gap-3`}>
                {/* Button 1: Colour Selection Button (Only shown if dynamic colors supported) */}
                {hasColorSelection && (
                  <button
                    type="button"
                    onClick={() => setIsMobileColorSheetOpen(true)}
                    className="flex flex-col items-center justify-center p-3 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group bg-muted/10"
                    title={`Select ${profile.attributeName || "colour"}`}
                  >
                    <div
                      className="size-11 rounded-2xl border-2 border-primary ring-2 ring-primary/30 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 relative"
                      style={{ backgroundColor: currentColor.hex }}
                    >
                      <span
                        className={`size-2 rounded-full ${currentColor.isLight ? "bg-black" : "bg-white"}`}
                      />
                    </div>
                    <span className="text-xs flex items-center gap-1 font-bold text-foreground mt-2 truncate max-w-full">
                      {profile.attributeName ? profile.attributeName.split(" ")[0] : "Color"} <ChevronRight className="size-3" />
                    </span>
                  </button>
                )}

                {/* Button 2: Print Placement Selection Button (Only when multiple positions exist) */}
                {hasMultiplePositions && (
                  <button
                    type="button"
                    onClick={() => setIsMobilePlacementSheetOpen(true)}
                    className="flex flex-col items-center justify-center p-3 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group bg-muted/10"
                    title="Select print placement"
                  >
                    <div className="size-11 rounded-2xl border border-border/80 bg-muted/60 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                      <Maximize2 className="size-5" />
                    </div>
                    <span className="text-xs line-clamp-2 flex justify-center items-center gap-1 font-bold text-foreground mt-2 truncate">
                      {currentPosition.name} <ChevronRight className="size-3" />
                    </span>
                  </button>
                )}

                {/* Button 3: Rotate Placement Selection Button */}
                <button
                  type="button"
                  onClick={handleRotateImage}
                  className="flex flex-col items-center justify-center p-3 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group bg-muted/10"
                  title="Rotate artwork"
                >
                  <div className="size-11 rounded-2xl border border-border/80 bg-muted/60 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                    <RotateCcw className="size-5" />
                  </div>
                  <span className="text-xs line-clamp-2 flex justify-center items-center gap-1 font-bold text-foreground mt-2 truncate">
                    Rotate
                  </span>
                </button>

                {/* Button 4: Download Placement Selection Button */}
                <button
                  type="button"
                  onClick={handleDownloadMockup}
                  className="flex flex-col items-center justify-center p-3 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group bg-muted/10"
                  title="Preview and download mockup"
                >
                  <div className="size-11 rounded-2xl border border-border/80 bg-muted/60 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                    <Download className="size-5" />
                  </div>
                  <span className="text-xs text-wrap flex justify-center items-center gap-1 font-bold text-foreground mt-2 truncate">
                    Preview
                  </span>
                </button>
              </div>
            )
          })()}

          {/* Card B: Upload Design / Artwork Controls */}
          <div className="bg-card rounded-2xl border border-border/80 p-3 shadow-xs">
            {allUploadedArtworks.length === 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleTriggerUpload}
                className="w-full h-14 rounded-xl text-xs font-bold gap-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 cursor-pointer flex items-center justify-center transition-all"
              >
                <Upload className="size-4 text-primary" />
                <span>Upload Design</span>
              </Button>
            ) : (
              <div className="flex items-center gap-3 w-full">
                {/* Uploaded image thumbnails (up to 2 maximum) */}
                {allUploadedArtworks.map((art) => (
                  <div key={art.id} className="flex flex-col items-center shrink-0">
                    <div
                      onClick={() => handleThumbnailClick(art)}
                      className={`relative size-14 rounded-xl border p-1 bg-background flex items-center justify-center cursor-pointer transition-all shadow-2xs ${
                        selectedViewId === art.view
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border/80 hover:border-primary/50"
                      }`}
                      title={`Click to view ${art.view} design (${art.name})`}
                    >
                      <img
                        src={art.url}
                        alt={art.name}
                        className="w-full h-full object-contain rounded-lg"
                      />
                      {/* Cross button on top right corner to delete image */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveLayer(art.id)
                        }}
                        className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center shadow-xs cursor-pointer z-10 transition-transform active:scale-90"
                        title="Delete image"
                      >
                        <X className="size-3 stroke-[3]" />
                      </button>
                    </div>
                    {/* Label below image for front or back */}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1 text-center">
                      {art.view === "front" ? "Front" : "Back"}
                    </span>
                  </div>
                ))}

                {/* Upload button taking remaining space (when under maximum of 2) */}
                {allUploadedArtworks.length < 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTriggerUpload}
                    className="flex-1 h-14 rounded-xl text-xs font-bold gap-1.5 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 cursor-pointer flex items-center justify-center transition-all min-w-0"
                  >
                    <Upload className="size-4 text-primary shrink-0" />
                    <span className="truncate">Upload Design</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Card C: Size & Quantity Minimal Table OR Direct Quantity Selector */}
          <div className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs">
            {profile.hasGarmentSizes ? (
              <SizeQuantityTable
                quantities={sizeQuantities}
                onQuantityChange={handleQuantityChange}
                totalQuantity={totalQuantity}
                unitPrice={unitPrice}
              />
            ) : (
              <DirectQuantitySelector
                quantity={directQuantity}
                onQuantityChange={handleDirectQuantityChange}
                unitPrice={unitPrice}
              />
            )}
          </div>

          {/* Card D: Custom Instructions / Description Input Box (Mobile) */}
          <div className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3.5" />
                <span>Custom Instructions</span>
              </span>
              {customerNotes && customerNotes.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {customerNotes.length}/250
                </span>
              )}
            </div>
            <div className="relative">
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value.slice(0, 250))}
                placeholder="Add special printing instructions, text to write, or custom requests..."
                rows={2}
                className="w-full text-xs p-3 rounded-xl bg-muted/40 border border-border/80 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all placeholder:text-muted-foreground/60 custom-scrollbar leading-relaxed"
              />
              {customerNotes && customerNotes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCustomerNotes("")}
                  className="absolute right-2.5 top-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                  title="Clear instructions"
                  aria-label="Clear instructions"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* In-Flow Add to Cart Section (NOT fixed to bottom on mobile, direct without bottom sheet) */}
          <div className="bg-card rounded-2xl border border-border/80 p-4 mb-40 shadow-xs flex items-center justify-between gap-4 mt-1">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {totalQuantity > 1 ? `Total (${totalQuantity} pcs)` : "Price per piece"}
              </span>
              <div className="text-2xl font-black text-foreground">
                ₹{unitPrice * Math.max(1, totalQuantity)}
              </div>
              {totalQuantity > 1 && (
                <div className="text-[10px] text-muted-foreground">₹{unitPrice} / piece</div>
              )}
            </div>

            {/* Direct Add to Cart without bottom sheet */}
            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={isAddingToCart || totalQuantity === 0}
              className="h-12 px-7 font-bold text-sm shadow-md shadow-primary/20 cursor-pointer"
            >
              <ShoppingBag className="size-4.5 mr-2" />
              <span>
                {isAddingToCart
                  ? "Adding..."
                  : totalQuantity === 0
                  ? "Select Qty"
                  : `Add to Cart • ₹${unitPrice * totalQuantity}`}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALS & BOTTOM SHEETS                                                 */}
      {/* ========================================================================= */}

      {/* Mobile Colour Bottom Sheet (Only for profiles with dynamic colors) */}
      {profile.hasDynamicColors && (
        <MobileColorSheet
          isOpen={isMobileColorSheetOpen}
          onClose={() => setIsMobileColorSheetOpen(false)}
          colors={activeConfig.colors}
          selectedColorId={selectedColorId}
          onSelectColor={handleSelectColor}
          attributeName={profile.attributeName}
          attributeType={profile.attributeType}
        />
      )}

      {/* Mobile Print Placement Bottom Sheet */}
      <MobilePlacementSheet
        isOpen={isMobilePlacementSheetOpen}
        onClose={() => setIsMobilePlacementSheetOpen(false)}
        availablePositions={currentView.positions}
        selectedPositionId={selectedPositionId}
        onSelectPosition={handleSelectPosition}
      />

      {/* Mobile Upload Design & Transform Bottom Sheet */}
      <MobileUploadSheet
        isOpen={isMobileUploadSheetOpen}
        onClose={() => setIsMobileUploadSheetOpen(false)}
        artworkLayers={artworkLayers}
        selectedLayer={selectedLayer}
        onSelectLayer={handleSelectLayer}
        onRemoveLayer={handleRemoveLayer}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onUploadImage={handleUploadImage}
        onRotateDelta={handleRotateDelta}
        onSetRotation={handleSetRotation}
        onSetScale={handleSetScale}
        onCenterArtwork={handleCenterArtwork}
        onFlipH={handleFlipH}
        onDownloadMockup={handleDownloadMockup}
        onDownloadPrintFile={handleDownloadPrintFile}
      />

      {/* Hidden file input triggered by on-canvas placeholder click */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleUploadImage(file)
            e.target.value = ""
          }
        }}
      />

      {/* Blocking Overlay Loading State while Add to Cart is in progress */}
      {isAddingToCart && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          role="status"
          aria-live="polite"
          aria-label="Adding customized product to cart"
        >
          <div className="bg-card border border-border/80 shadow-2xl rounded-3xl px-8 py-7 max-w-sm w-full text-center space-y-3">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Spinner className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Adding to Cart...
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Uploading your artwork and saving your custom design. Please wait.
              </p>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  )
}
