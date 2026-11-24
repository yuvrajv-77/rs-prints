import React, { useState, useRef, useEffect, useCallback } from "react"
import type { Product } from "@/types/product"
import { addToCart } from "@/stores/cart"
import { toast, Toaster } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { TSHIRT_CONFIG } from "./config/tshirt-mockups"
import { FabricManager, type ArtworkLayerInfo } from "./core/fabric-manager"
import { CustomizerLeftSidebar } from "./ui/CustomizerLeftSidebar"
import { CustomizerRightSidebar } from "./ui/CustomizerRightSidebar"
import { CustomizerViewport } from "./ui/CustomizerViewport"
import { SizeSelectionModal } from "./ui/SizeSelectionModal"
import { MobileColorSheet } from "./ui/MobileColorSheet"
import { MobilePlacementSheet } from "./ui/MobilePlacementSheet"
import { MobileUploadSheet } from "./ui/MobileUploadSheet"
import { MobileSlidersSheet } from "./ui/MobileSlidersSheet"
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
  ChevronRight
} from "lucide-react"

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

  // Modal & Bottom Sheet States
  const [isSizeModalOpen, setIsSizeModalOpen] = useState<boolean>(false)
  const [isMobileColorSheetOpen, setIsMobileColorSheetOpen] = useState<boolean>(false)
  const [isMobilePlacementSheetOpen, setIsMobilePlacementSheetOpen] = useState<boolean>(false)
  const [isMobileUploadSheetOpen, setIsMobileUploadSheetOpen] = useState<boolean>(false)
  const [isMobileSlidersSheetOpen, setIsMobileSlidersSheetOpen] = useState<boolean>(false)

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

  // Garment Color change
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
    <div className="w-full h-full min-h-0 flex flex-col px-2 sm:px-6 py-2 overflow-y-auto lg:overflow-hidden relative">
      {/* Studio Header: Clean, bold and low-profile without product name */}
      <div className="shrink-0 h-8 flex items-center justify-between border-b border-border/40 pb-1 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-primary/10 text-primary uppercase shrink-0">
            Studio
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClearDesign}
            className="text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors px-1 cursor-pointer flex items-center gap-1"
            title="Clear all artwork and reset design"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN RESPONSIVE WORKSPACE                                                 */}
      {/* - Desktop: 3-Column (Left Sidebar + Center Canvas + Right Sidebar)        */}
      {/* - Mobile: Column Stack (Canvas + Tabs + Cards + In-flow Checkout)        */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-5 items-stretch overflow-visible lg:overflow-hidden">
        {/* 1. Left Sidebar (Visible on Desktop lg+) */}
        <div className="hidden lg:flex lg:col-span-3 xl:col-span-3 h-full min-h-0 flex-col overflow-hidden">
          <CustomizerLeftSidebar
            colors={TSHIRT_CONFIG.colors}
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
          />
        </div>

        {/* 2. Unified Canvas Viewport (Center column on desktop, Hero on mobile) */}
        <div className="w-full h-[400px] sm:h-[480px] lg:h-full lg:col-span-6 xl:col-span-6 shrink-0 lg:shrink min-h-0 flex flex-col items-center justify-center relative overflow-hidden bg-card/40 rounded-3xl border border-border/60 p-3 sm:p-4 shadow-xs">
          <CustomizerViewport
            containerRef={containerRef}
            canvasRef={canvasRef}
            selectedPositionName={`${currentView.name} • ${currentPosition.name}`}
            showGuides={showGuides}
            onToggleGuides={handleToggleGuides}
            isLoading={isLoading}
            selectedViewId={selectedViewId}
            onSelectView={handleSelectView}
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
            onRequestAddToCart={() => setIsSizeModalOpen(true)}
            isAddingToCart={isAddingToCart}
            unitPrice={299}
          />
        </div>

        {/* 4. Mobile Column Controls (Visible on Mobile below lg) */}
        <div className="lg:hidden flex flex-col w-full space-y-3 pb-32 sm:pb-36 pt-1">
          {/* Mobile Selection Tabs: Colour, Print Placement & Edit Sliders Buttons */}
          <div className="bg-card rounded-2xl border border-border/80 shadow-xs grid grid-cols-3 gap-2 sm:gap-3 p-3">
            {/* Button 1: Colour Selection Button */}
            <button
              type="button"
              onClick={() => setIsMobileColorSheetOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group bg-muted/10 border border-border/70"
              title="Select garment colour"
            >
              {/* Keep color icon as it is */}
              <div
                className="size-11 rounded-2xl border-2 border-primary ring-2 ring-primary/30 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 relative"
                style={{ backgroundColor: currentColor.hex }}
              >
                <span
                  className={`size-2 rounded-full ${
                    currentColor.id === "white" ? "bg-black" : "bg-white"
                  }`}
                />
              </div>
              {/* Just below it add the color label */}
              <span className="text-xs flex items-center justify-center gap-0.5 font-bold text-foreground mt-2 truncate w-full">
                Color <ChevronRight className="size-3 shrink-0" />
              </span>
            </button>

            {/* Button 2: Print Placement Selection Button */}
            <button
              type="button"
              onClick={() => setIsMobilePlacementSheetOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group bg-muted/10 border border-border/70"
              title="Select print placement"
            >
              {/* Simple icon for selection button */}
              <div className="size-11 rounded-2xl border border-border/80 bg-muted/60 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <Maximize2 className="size-5" />
              </div>
              {/* Just below it add the placement label */}
              <span className="text-xs line-clamp-1 flex justify-center items-center gap-0.5 font-bold text-foreground mt-2 truncate w-full">
                {currentPosition.name} <ChevronRight className="size-3 shrink-0" />
              </span>
            </button>

            {/* Button 3: Sliders Placement Selection Button */}
            <button
              type="button"
              onClick={() => setIsMobileSlidersSheetOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group bg-muted/10 border border-border/70"
              title="Adjust size, position and rotation"
            >
              {/* Simple icon for selection button */}
              <div className="size-11 rounded-2xl border border-border/80 bg-muted/60 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <SlidersHorizontal className="size-5" />
              </div>
              {/* Just below it add the placement label */}
              <span className="text-xs line-clamp-1 flex justify-center items-center gap-0.5 font-bold text-foreground mt-2 truncate w-full">
                Edit <ChevronRight className="size-3 shrink-0" />
              </span>
            </button>
          </div>

          {/* Card B: Upload Design / Artwork Controls */}
          <div className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {selectedLayer?.url ? (
                <img
                  src={selectedLayer.url}
                  alt={selectedLayer.name}
                  className="size-11 rounded-xl object-contain bg-background border border-border/60 shrink-0"
                />
              ) : (
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Upload className="size-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground truncate">
                  {selectedLayer ? selectedLayer.name : "Customer Artwork"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {selectedLayer
                    ? `${Math.round((selectedLayer.scaleX || 1) * 100)}% size • DTF Ready`
                    : "Tap to upload photo or logo"}
                </div>
              </div>
            </div>

            {/* Upload Design button opens the upload bottom sheet */}
            <Button
              variant={artworkLayers.length > 0 ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIsMobileUploadSheetOpen(true)}
              className="h-10 px-3.5 rounded-xl text-xs font-bold gap-1.5 shrink-0 cursor-pointer border-dashed border-primary/50"
            >
              <Upload className="size-4 text-primary" />
              <span>{artworkLayers.length > 0 ? "Edit Artwork" : "Upload Design"}</span>
            </Button>
          </div>

          {/* Card C: Previews & Downloads */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadMockup}
              className="h-10 text-xs font-semibold gap-1.5 rounded-xl cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>Mockup Preview</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPrintFile}
              className="h-10 text-xs font-semibold gap-1.5 rounded-xl cursor-pointer"
            >
              <Layers className="size-3.5" />
              <span>DTF Print File</span>
            </Button>
          </div>

          {/* In-Flow Add to Cart Section (NOT fixed to bottom on mobile) */}
          <div className="bg-card rounded-2xl border border-border/80 p-4 mb-40 shadow-xs flex items-center justify-between gap-4 mt-1">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Price per piece
              </span>
              <div className="text-2xl font-black text-foreground">₹299</div>
              <div className="text-[10px] text-muted-foreground">Bio-washed Cotton • DTF Print</div>
            </div>

            {/* Clicking Add to Cart opens the Size Selection Bottom Sheet */}
            <Button
              size="lg"
              onClick={() => setIsSizeModalOpen(true)}
              disabled={isAddingToCart}
              className="h-12 px-7 font-bold text-sm shadow-md shadow-primary/20 cursor-pointer"
            >
              <ShoppingBag className="size-4.5 mr-2" />
              <span>Add to Cart</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALS & BOTTOM SHEETS                                                 */}
      {/* ========================================================================= */}

      {/* Size Selection Sheet / Modal (Triggered by Add to Cart on mobile or desktop) */}
      <SizeSelectionModal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        onConfirmAddToCart={() => {
          setIsSizeModalOpen(false)
          handleAddToCart()
        }}
        isAddingToCart={isAddingToCart}
        unitPrice={299}
      />

      {/* Mobile Colour Bottom Sheet */}
      <MobileColorSheet
        isOpen={isMobileColorSheetOpen}
        onClose={() => setIsMobileColorSheetOpen(false)}
        colors={TSHIRT_CONFIG.colors}
        selectedColorId={selectedColorId}
        onSelectColor={handleSelectColor}
      />

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

      {/* Mobile Sliders / Transform Bottom Sheet */}
      <MobileSlidersSheet
        isOpen={isMobileSlidersSheetOpen}
        onClose={() => setIsMobileSlidersSheetOpen(false)}
        artworkLayers={artworkLayers}
        selectedLayer={selectedLayer}
        onSelectLayer={handleSelectLayer}
        onRemoveLayer={handleRemoveLayer}
        onRotateDelta={handleRotateDelta}
        onSetRotation={handleSetRotation}
        onSetScale={handleSetScale}
        onCenterArtwork={handleCenterArtwork}
        onFlipH={handleFlipH}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onOpenUploadSheet={() => setIsMobileUploadSheetOpen(true)}
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
