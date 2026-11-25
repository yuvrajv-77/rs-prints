import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import type { Product } from "@/types/product"
import { addToCart } from "@/stores/cart"
import { toast, Toaster } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { resolveCustomizerProfile, type CustomizerProductProfile } from "./config/product-registry"
import { FabricManager, type ArtworkLayerInfo, type UploadedArtworkSummary } from "./core/fabric-manager"
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
  saveDesignDraft,
  loadDesignDraft,
  clearDesignDraft
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

export default function ProductCustomizer({ product }: ProductCustomizerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricManagerRef = useRef<FabricManager | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [showGuides, setShowGuides] = useState<boolean>(true)

  // Resolve product profile dynamically (T-shirt vs Mug vs Bottle vs Bag)
  const profile: CustomizerProductProfile = useMemo(() => {
    let sp: URLSearchParams | null = null
    if (typeof window !== "undefined") {
      sp = new URLSearchParams(window.location.search)
    }
    return resolveCustomizerProfile(product, sp)
  }, [product])

  const activeConfig = profile.config

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
      if (!["product", "color", "size", "quantity", "type", "category"].includes(lower) && val) {
        attrs[lower] = val
      }
    }
    return attrs
  })

  // Unit price from product prop or default 299
  const unitPrice = useMemo(() => {
    if (product?.startingPriceNumber) return Math.round(product.startingPriceNumber)
    return 299
  }, [product?.startingPriceNumber])

  // Determine initial color: URL parameter -> saved draft -> default
  const [selectedColorId, setSelectedColorId] = useState<string>(() => {
    if (profile.hasDynamicColors && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const c = normalizeColorParam(sp.get("color"))
      if (c && activeConfig.colors[c]) return c
    }
    const draft = loadDesignDraft(activeConfig.productId)
    if (draft?.colorId && activeConfig.colors[draft.colorId]) return draft.colorId
    return activeConfig.defaultColorId
  })

  // Size & Multi-quantity selection state (for apparel)
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>(() => {
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

  // Initial URL synchronization on mount
  useEffect(() => {
    syncUrlParams(selectedColorId, productTitle, sizeQuantities, directQuantity)
  }, [selectedColorId, productTitle, syncUrlParams, sizeQuantities, directQuantity])

  // Initialize Fabric Canvas and restore drafts if available
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    setIsLoading(true)

    // Check for existing saved draft or URL parameter override
    const draft = loadDesignDraft(activeConfig.productId)

    let urlColorId: string | null = null
    if (profile.hasDynamicColors && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      urlColorId = normalizeColorParam(sp.get("color"))
    }

    const initialColorId =
      urlColorId && activeConfig.colors[urlColorId]
        ? urlColorId
        : draft?.colorId && activeConfig.colors[draft.colorId]
        ? draft.colorId
        : activeConfig.defaultColorId

    // Always default to front view when customizer loads
    const initialViewId: "front" | "back" = activeConfig.defaultViewId || "front"
    const initialColor =
      activeConfig.colors[initialColorId] ||
      activeConfig.colors[activeConfig.defaultColorId] ||
      Object.values(activeConfig.colors)[0]
    const initialView =
      initialColor.views[initialViewId] ||
      initialColor.views.front ||
      Object.values(initialColor.views)[0]
    const initialPosition =
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

    // If draft had artwork objects, restore them
    if (draft?.viewArtworks) {
      manager.loadFromSerializedState(draft.viewArtworks).then(() => {
        toast.add({
          title: "Draft Restored",
          description: `Resumed your previous customized ${profile.productType} design session.`,
          type: "info"
        })
      })
    }

    setIsLoading(false)

    return () => {
      manager.destroy()
      fabricManagerRef.current = null
    }
  }, [activeConfig.productId])

  // Auto-save draft whenever layers or view change
  const triggerAutoSave = useCallback(() => {
    if (!fabricManagerRef.current) return
    const allArtworks = fabricManagerRef.current.getAllViewArtworks()
    saveDesignDraft(activeConfig.productId, {
      colorId: selectedColorId,
      selectedViewId,
      selectedPositionId,
      viewArtworks: allArtworks
    })
  }, [selectedColorId, selectedViewId, selectedPositionId])

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
    clearDesignDraft(activeConfig.productId)
    toast.add({
      title: "Design Cleared",
      description: "Reset canvas and cleared design draft.",
      type: "info"
    })
  }, [activeConfig.productId])

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

    try {
      const exportPkg = await fabricManagerRef.current.exportAllViewsPackage({
        front: currentColor.views.front ? {
          image: currentColor.views.front.image,
          printPosition: currentColor.views.front.positions[currentColor.views.front.defaultPositionId] || Object.values(currentColor.views.front.positions)[0]
        } : undefined,
        back: currentColor.views.back ? {
          image: currentColor.views.back.image,
          printPosition: currentColor.views.back.positions[currentColor.views.back.defaultPositionId] || Object.values(currentColor.views.back.positions)[0]
        } : undefined
      })

      const allArtworks = fabricManagerRef.current.getAllViewArtworks()
      const baseVariantId = product?.variants?.[0]?.id || `mock-variant-${selectedColorId}-${profile.productType}`

      if (profile.hasGarmentSizes) {
        const selectedSizesList = Object.entries(sizeQuantities).filter(([_, qty]) => qty > 0)
        for (const [sizeId, qty] of selectedSizesList) {
          const sizeVariantId = `${baseVariantId}-${sizeId}`

          const customizationId = saveCustomizationForCart({
            productId: product?.id || activeConfig.productId,
            productName: productTitle || product?.title || activeConfig.name,
            variantId: sizeVariantId,
            colorId: selectedColorId,
            colorName: currentColor.name,
            size: sizeId,
            front: exportPkg.front ? {
              positionId: currentColor.views.front.defaultPositionId,
              positionName: currentColor.views.front.positions[currentColor.views.front.defaultPositionId]?.name || "Front",
              previewDataUrl: exportPkg.front.preview,
              productionDataUrl: exportPkg.front.production,
              artworks: allArtworks.front || []
            } : undefined,
            back: exportPkg.back ? {
              positionId: currentColor.views.back.defaultPositionId,
              positionName: currentColor.views.back.positions[currentColor.views.back.defaultPositionId]?.name || "Back",
              previewDataUrl: exportPkg.back.preview,
              productionDataUrl: exportPkg.back.production,
              artworks: allArtworks.back || []
            } : undefined
          })

          const detailsList = [
            ...Object.entries(customAttributes).map(
              ([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`
            ),
            `Colour: ${currentColor.name}`,
            `Size: ${sizeId}`,
            `Qty: ${qty}`,
            exportPkg.front ? `Front: Customized` : null,
            exportPkg.back ? `Back: Customized` : null,
            `ID: ${customizationId}`
          ].filter(Boolean).join(" | ")

          await addToCart(sizeVariantId, qty, {
            productName: productTitle || product?.title || activeConfig.name,
            variantDetails: detailsList
          })
        }

        const sizeSummary = selectedSizesList.map(([s, q]) => `${s}: ${q}`).join(", ")
        toast.add({
          title: "Added to Cart!",
          description: `${currentColor.name} • ${totalQuantity} piece(s) (${sizeSummary}) added to your cart.`,
          type: "success"
        })
      } else {
        // Direct quantity for Mugs, Bottles, Bags
        const itemVariantId = `${baseVariantId}-qty-${directQuantity}`

        const customizationId = saveCustomizationForCart({
          productId: product?.id || activeConfig.productId,
          productName: productTitle || product?.title || activeConfig.name,
          variantId: itemVariantId,
          colorId: selectedColorId,
          colorName: currentColor.name,
          front: exportPkg.front ? {
            positionId: currentColor.views.front.defaultPositionId,
            positionName: currentColor.views.front.positions[currentColor.views.front.defaultPositionId]?.name || "Front",
            previewDataUrl: exportPkg.front.preview,
            productionDataUrl: exportPkg.front.production,
            artworks: allArtworks.front || []
          } : undefined,
          back: exportPkg.back ? {
            positionId: currentColor.views.back.defaultPositionId,
            positionName: currentColor.views.back.positions[currentColor.views.back.defaultPositionId]?.name || "Back",
            previewDataUrl: exportPkg.back.preview,
            productionDataUrl: exportPkg.back.production,
            artworks: allArtworks.back || []
          } : undefined
        })

        const detailsList = [
          ...Object.entries(customAttributes).map(
            ([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`
          ),
          `Qty: ${directQuantity}`,
          exportPkg.front ? `Print: Customized` : null,
          exportPkg.back ? `Back: Customized` : null,
          `ID: ${customizationId}`
        ].filter(Boolean).join(" | ")

        await addToCart(itemVariantId, directQuantity, {
          productName: productTitle || product?.title || activeConfig.name,
          variantDetails: detailsList
        })

        toast.add({
          title: "Added to Cart!",
          description: `${productTitle || activeConfig.name} • ${directQuantity} piece(s) added to your cart.`,
          type: "success"
        })
      }
    } catch (err: any) {
      console.error("Failed to add customized item to cart:", err)
      toast.add({
        title: "Could not add to cart",
        description: err?.message || "Please check connection.",
        type: "error"
      })
    } finally {
      setIsAddingToCart(false)
    }
  }, [product, productTitle, customAttributes, selectedColorId, currentColor, currentView, sizeQuantities, directQuantity, totalQuantity, profile, activeConfig])

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
                    title="Select colour"
                  >
                    <div
                      className="size-11 rounded-2xl border-2 border-primary ring-2 ring-primary/30 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 relative"
                      style={{ backgroundColor: currentColor.hex }}
                    >
                      <span
                        className={`size-2 rounded-full ${currentColor.id === "white" ? "bg-black" : "bg-white"}`}
                      />
                    </div>
                    <span className="text-xs flex items-center gap-1 font-bold text-foreground mt-2 truncate max-w-full">
                      Color <ChevronRight className="size-3" />
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
    </div>
  )
}
