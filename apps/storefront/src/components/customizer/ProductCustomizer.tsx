import React, { useState, useRef, useEffect, useCallback } from "react"
import type { Product } from "@/types/product"
import { addToCart } from "@/stores/cart"
import { toast, Toaster } from "@/components/ui/toast"
import { TSHIRT_CONFIG } from "./config/tshirt-mockups"
import { FabricManager, type ArtworkLayerInfo } from "./core/fabric-manager"
import { CustomizerSidebar } from "./ui/CustomizerSidebar"
import { CustomizerViewport } from "./ui/CustomizerViewport"
import {
  saveCustomizationForCart,
  saveDesignDraft,
  loadDesignDraft,
  clearDesignDraft
} from "@/stores/customization"

export interface ProductCustomizerProps {
  product?: Product
  defaultCategory?: "tshirt" | "mug"
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"]

// Helper to normalize color parameter from URL
function normalizeColorParam(param: string | null): string | null {
  if (!param) return null
  const clean = param.toLowerCase().trim().replace(/[_\s]+/g, "-")
  if (clean === "black" || clean === "pitch-black" || clean === "pitchblack") return "black"
  if (clean === "white" || clean === "crisp-white" || clean === "crispwhite") return "white"
  return null
}

export default function ProductCustomizer({ product }: ProductCustomizerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricManagerRef = useRef<FabricManager | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [showGuides, setShowGuides] = useState<boolean>(true)

  // Product Title from props or URL parameter
  const [productTitle, setProductTitle] = useState<string>(() => {
    if (product?.title) return product.title
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const p = sp.get("product")
      if (p) return p
    }
    return TSHIRT_CONFIG.name
  })

  // Determine initial color: URL parameter -> saved draft -> default
  const [selectedColorId, setSelectedColorId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const c = normalizeColorParam(sp.get("color"))
      if (c && TSHIRT_CONFIG.colors[c]) return c
    }
    const draft = loadDesignDraft(TSHIRT_CONFIG.productId)
    if (draft?.colorId && TSHIRT_CONFIG.colors[draft.colorId]) return draft.colorId
    return TSHIRT_CONFIG.defaultColorId
  })

  const [selectedSize, setSelectedSize] = useState<string>("L")
  const [selectedViewId, setSelectedViewId] = useState<"front" | "back">(TSHIRT_CONFIG.defaultViewId)

  const currentColor = TSHIRT_CONFIG.colors[selectedColorId] || TSHIRT_CONFIG.colors.black
  const currentView = currentColor.views[selectedViewId] || currentColor.views.front

  const [selectedPositionId, setSelectedPositionId] = useState<string>(currentView.defaultPositionId)
  const currentPosition = currentView.positions[selectedPositionId] || Object.values(currentView.positions)[0]

  // Artwork layers state
  const [artworkLayers, setArtworkLayers] = useState<ArtworkLayerInfo[]>([])
  const [selectedLayer, setSelectedLayer] = useState<ArtworkLayerInfo | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false)

  // Sync product name & color to URL parameters
  const syncUrlParams = useCallback((colorId: string, title?: string) => {
    if (typeof window === "undefined") return
    const activeTitle = title || productTitle
    const url = new URL(window.location.href)
    url.searchParams.set("product", activeTitle)
    url.searchParams.set("color", colorId)
    window.history.replaceState({}, "", url.toString())
  }, [productTitle])

  // Initial URL synchronization on mount
  useEffect(() => {
    syncUrlParams(selectedColorId, productTitle)
  }, [selectedColorId, productTitle, syncUrlParams])

  // Initialize Fabric Canvas and restore drafts if available
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    setIsLoading(true)

    // Check for existing saved draft
    const draft = loadDesignDraft(TSHIRT_CONFIG.productId)

    const initialColorId = draft?.colorId || TSHIRT_CONFIG.defaultColorId
    const initialViewId = draft?.selectedViewId || TSHIRT_CONFIG.defaultViewId
    const initialColor = TSHIRT_CONFIG.colors[initialColorId] || TSHIRT_CONFIG.colors.black
    const initialView = initialColor.views[initialViewId] || initialColor.views.front
    const initialPosition = initialView.positions[draft?.selectedPositionId || initialView.defaultPositionId] || Object.values(initialView.positions)[0]

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
          description: "Resumed your previous customized t-shirt design session.",
          type: "info"
        })
      })
    }

    setIsLoading(false)

    return () => {
      manager.destroy()
      fabricManagerRef.current = null
    }
  }, [])

  // Auto-save draft whenever layers or view change
  const triggerAutoSave = useCallback(() => {
    if (!fabricManagerRef.current) return
    const allArtworks = fabricManagerRef.current.getAllViewArtworks()
    saveDesignDraft(TSHIRT_CONFIG.productId, {
      colorId: selectedColorId,
      selectedViewId,
      selectedPositionId,
      viewArtworks: allArtworks
    })
  }, [selectedColorId, selectedViewId, selectedPositionId])

  // Phase 2/3: Colour Switching with URL parameter sync
  const handleSelectColor = useCallback(async (colorId: string) => {
    setSelectedColorId(colorId)
    syncUrlParams(colorId, productTitle)
    const newColor = TSHIRT_CONFIG.colors[colorId]
    if (!newColor) return

    const targetView = newColor.views[selectedViewId] || newColor.views.front
    if (fabricManagerRef.current) {
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
  }, [selectedViewId, triggerAutoSave, syncUrlParams, productTitle])

  // Phase 2/3: View Switching (Front <-> Back)
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
    clearDesignDraft(TSHIRT_CONFIG.productId)
    toast.add({
      title: "Design Cleared",
      description: "Reset canvas and cleared design draft.",
      type: "info"
    })
  }, [])

  // Phase 3: Export Mockup Preview
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

  // Phase 3: Export Production Artwork (Transparent 300 DPI, strictly print bounds)
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

  // Phase 3: Add to Cart with Complete Customization Metadata Association
  const handleAddToCart = useCallback(async () => {
    if (!fabricManagerRef.current) return

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
      // 1. Export both Front and Back packages (Mockup + Production Transparent)
      const exportPkg = await fabricManagerRef.current.exportAllViewsPackage({
        front: {
          image: currentColor.views.front.image,
          printPosition: currentColor.views.front.positions[currentColor.views.front.defaultPositionId] || Object.values(currentColor.views.front.positions)[0]
        },
        back: {
          image: currentColor.views.back.image,
          printPosition: currentColor.views.back.positions[currentColor.views.back.defaultPositionId] || Object.values(currentColor.views.back.positions)[0]
        }
      })

      const allArtworks = fabricManagerRef.current.getAllViewArtworks()

      const variantId = product?.variants?.[0]?.id || `mock-variant-${selectedColorId}-tshirt`

      // 2. Persist full customization record in client storage
      const customizationId = saveCustomizationForCart({
        productId: TSHIRT_CONFIG.productId,
        productName: TSHIRT_CONFIG.name,
        variantId,
        colorId: selectedColorId,
        colorName: currentColor.name,
        size: selectedSize,
        front: exportPkg.front ? {
          positionId: currentColor.views.front.defaultPositionId,
          positionName: currentColor.views.front.positions[currentColor.views.front.defaultPositionId]?.name || "Center Chest",
          previewDataUrl: exportPkg.front.preview,
          productionDataUrl: exportPkg.front.production,
          artworks: allArtworks.front || []
        } : undefined,
        back: exportPkg.back ? {
          positionId: currentColor.views.back.defaultPositionId,
          positionName: currentColor.views.back.positions[currentColor.views.back.defaultPositionId]?.name || "Upper Back",
          previewDataUrl: exportPkg.back.preview,
          productionDataUrl: exportPkg.back.production,
          artworks: allArtworks.back || []
        } : undefined
      })

      // 3. Format detailed order-line summary for Vendure
      const detailsList = [
        `Colour: ${currentColor.name}`,
        `Size: ${selectedSize}`,
        exportPkg.front ? `Front: ${currentView.name}` : null,
        exportPkg.back ? `Back: Customized` : null,
        `ID: ${customizationId}`
      ].filter(Boolean).join(" | ")

      const success = await addToCart(variantId, 1, {
        productName: TSHIRT_CONFIG.name,
        variantDetails: detailsList
      })

      if (success) {
        toast.add({
          title: "Customized T-Shirt Added!",
          description: `${currentColor.name} (Size: ${selectedSize}) with ${totalArtworks} layer(s) added to cart.`,
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
  }, [product, selectedColorId, currentColor, currentView, selectedSize])

  return (
    <div className="w-full h-full min-h-0 flex flex-col px-2 sm:px-6 py-1.5 sm:py-2 overflow-hidden">
      {/* Compact Studio Header (Clean title without breadcrumbs) */}
      <div className="shrink-0 h-8 sm:h-9 flex items-center justify-between border-b border-border/40 pb-1 mb-1.5 sm:mb-2">
        {/* Left: Product Title & Studio Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-foreground truncate text-sm sm:text-base">{productTitle}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary shrink-0">
            Studio
          </span>
        </div>

        {/* Right: Active Garment Color Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/60 border border-border/60 text-xs">
            <span
              className="size-2.5 rounded-full border border-black/20 shrink-0"
              style={{ backgroundColor: currentColor.hex }}
            />
            <span className="font-medium text-foreground text-[11px]">{currentColor.name}</span>
          </div>

          <button
            type="button"
            onClick={handleClearDesign}
            className="text-[11px] text-muted-foreground hover:text-destructive transition-colors px-1 cursor-pointer"
            title="Clear all artwork and reset design"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Responsive Workspace: Canvas is full flex on mobile, sidebar docks as bottom ribbon */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:gap-6 items-stretch overflow-hidden relative">
        {/* Canvas Viewport: on mobile takes flex-1 (all vertical space), on desktop takes 7-8 cols */}
        <div className="flex-1 min-h-0 w-full h-full lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center relative overflow-hidden">
          <CustomizerViewport
            containerRef={containerRef}
            canvasRef={canvasRef}
            selectedPositionName={`${currentView.name} • ${currentPosition.name}`}
            showGuides={showGuides}
            onToggleGuides={handleToggleGuides}
            isLoading={isLoading}
          />
        </div>

        {/* Customizer Sidebar / Mobile Ribbon: desktop sidebar card, mobile bottom ribbon */}
        <div className="shrink-0 lg:shrink w-full lg:h-full lg:col-span-5 xl:col-span-4 min-h-0 flex flex-col overflow-visible lg:overflow-hidden">
          <CustomizerSidebar
            colors={TSHIRT_CONFIG.colors}
            selectedColorId={selectedColorId}
            onSelectColor={handleSelectColor}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
            selectedViewId={selectedViewId}
            onSelectView={handleSelectView}
            availablePositions={currentView.positions}
            selectedPositionId={selectedPositionId}
            onSelectPosition={handleSelectPosition}
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
            onClearDesign={handleClearDesign}
            onDownloadMockup={handleDownloadMockup}
            onDownloadPrintFile={handleDownloadPrintFile}
            onAddToCart={handleAddToCart}
            isAddingToCart={isAddingToCart}
            unitPrice={299}
          />
        </div>
      </div>

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

      <Toaster />
    </div>
  )
}
