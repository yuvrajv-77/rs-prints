import React, { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  SlidersHorizontal,
  Maximize2,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Trash2,
  X,
  Upload,
  Layers,
  Check
} from "lucide-react"
import type { ArtworkLayerInfo } from "../core/fabric-manager"

export interface MobileSlidersSheetProps {
  isOpen: boolean
  onClose: () => void
  artworkLayers: ArtworkLayerInfo[]
  selectedLayer: ArtworkLayerInfo | null
  onSelectLayer: (layerId: string) => void
  onRemoveLayer: (layerId: string) => void
  onRotateDelta: (delta: number) => void
  onSetRotation: (angle: number) => void
  onSetScale: (scale: number) => void
  onCenterArtwork: () => void
  onFlipH: () => void
  onBringToFront?: (layerId: string) => void
  onSendToBack?: (layerId: string) => void
  onOpenUploadSheet?: () => void
}

export const MobileSlidersSheet: React.FC<MobileSlidersSheetProps> = ({
  isOpen,
  onClose,
  artworkLayers,
  selectedLayer,
  onSelectLayer,
  onRemoveLayer,
  onRotateDelta,
  onSetRotation,
  onSetScale,
  onCenterArtwork,
  onFlipH,
  onBringToFront,
  onSendToBack,
  onOpenUploadSheet
}) => {
  // Auto-select first layer if none active but layers exist
  useEffect(() => {
    if (isOpen && !selectedLayer && artworkLayers.length > 0) {
      onSelectLayer(artworkLayers[0].id)
    }
  }, [isOpen, selectedLayer, artworkLayers, onSelectLayer])

  if (!isOpen) return null

  const activeLayer = selectedLayer || (artworkLayers.length > 0 ? artworkLayers[0] : null)
  const currentScale = activeLayer ? Math.round((activeLayer.scaleX || 1) * 100) : 100
  const currentAngle = activeLayer ? Math.round(activeLayer.angle || 0) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-h-[85vh] bg-card rounded-t-3xl border-t border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <SlidersHorizontal className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm text-foreground truncate">
                Adjust Artwork
              </h3>
              <p className="text-[11px] text-muted-foreground truncate">
                {activeLayer ? activeLayer.name : "Fine-tune scale, rotation & position"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer shrink-0"
            title="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body with generous bottom padding */}
        <div className="p-4 pb-14 sm:pb-10 space-y-4 overflow-y-auto custom-scrollbar">
          {!activeLayer ? (
            /* Empty State: No artwork uploaded yet */
            <div className="p-6 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 space-y-3">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Upload className="size-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">No Artwork to Adjust</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Upload an image or logo first to scale and rotate it on your t-shirt.
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onClose()
                  onOpenUploadSheet?.()
                }}
                className="mt-2 font-bold cursor-pointer"
              >
                <Upload className="size-4 mr-1.5" />
                Upload Design
              </Button>
            </div>
          ) : (
            <>
              {/* Multiple Layers Selector (if more than 1 artwork) */}
              {artworkLayers.length > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Layers className="size-3 text-primary" />
                      Select Artwork Layer
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {artworkLayers.length} layers
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {artworkLayers.map((layer) => {
                      const isSelected = activeLayer.id === layer.id
                      return (
                        <button
                          key={layer.id}
                          type="button"
                          onClick={() => onSelectLayer(layer.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40 shadow-2xs"
                              : "border-border/70 bg-card hover:bg-muted/40 text-foreground"
                          }`}
                        >
                          {layer.url && (
                            <img
                              src={layer.url}
                              alt=""
                              className="size-4 rounded object-contain bg-background"
                            />
                          )}
                          <span className="truncate max-w-[100px]">{layer.name}</span>
                          {isSelected && <Check className="size-3" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 1. Scale Size Slider Card */}
              <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Maximize2 className="size-3.5 text-primary" />
                    Scale Size
                  </span>
                  <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                    {currentScale}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="3.0"
                  step="0.05"
                  value={activeLayer.scaleX || 1}
                  onChange={(e) => onSetScale(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-2 bg-muted rounded-lg"
                />
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = Math.max(0.1, Number(((activeLayer.scaleX || 1) - 0.1).toFixed(2)))
                      onSetScale(next)
                    }}
                    className="h-8 text-xs font-semibold cursor-pointer"
                  >
                    -10%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSetScale(1.0)}
                    className="h-8 text-xs font-semibold cursor-pointer"
                  >
                    Reset (100%)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = Math.min(3.0, Number(((activeLayer.scaleX || 1) + 0.1).toFixed(2)))
                      onSetScale(next)
                    }}
                    className="h-8 text-xs font-semibold cursor-pointer"
                  >
                    +10%
                  </Button>
                </div>
              </div>

              {/* 2. Rotation Angle Slider Card */}
              <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <RotateCw className="size-3.5 text-primary" />
                    Rotation Angle
                  </span>
                  <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                    {currentAngle}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={currentAngle}
                  onChange={(e) => onSetRotation(parseInt(e.target.value) || 0)}
                  className="w-full accent-primary cursor-pointer h-2 bg-muted rounded-lg"
                />
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRotateDelta(-90)}
                    className="h-8 text-xs font-semibold gap-1 cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    -90°
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSetRotation(0)}
                    className="h-8 text-xs font-semibold cursor-pointer"
                  >
                    Reset (0°)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRotateDelta(90)}
                    className="h-8 text-xs font-semibold gap-1 cursor-pointer"
                  >
                    <RotateCw className="size-3" />
                    +90°
                  </Button>
                </div>
              </div>

              {/* 3. Alignment & Transformations Quick Tools */}
              <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/10 space-y-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                  Alignment & Position
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCenterArtwork}
                    className="h-9 text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Maximize2 className="size-3.5" />
                    <span>Center in Area</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onFlipH}
                    className="h-9 text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <FlipHorizontal className="size-3.5" />
                    <span>Flip Horizontal</span>
                  </Button>
                </div>

                {/* Layer order if multiple layers */}
                {artworkLayers.length > 1 && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onBringToFront?.(activeLayer.id)}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Bring to Front
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSendToBack?.(activeLayer.id)}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Send to Back
                    </Button>
                  </div>
                )}

                {/* Delete artwork action */}
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRemoveLayer(activeLayer.id)
                      if (artworkLayers.length <= 1) {
                        onClose()
                      }
                    }}
                    className="w-full h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 hover:border-destructive/60 cursor-pointer gap-1.5"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete Artwork</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with generous padding */}
        <div className="p-4 pb-12 sm:pb-8 border-t border-border/60 bg-muted/20">
          <Button
            type="button"
            size="lg"
            onClick={onClose}
            className="w-full h-11 text-xs font-bold cursor-pointer"
          >
            Apply & Close
          </Button>
        </div>
      </div>
    </div>
  )
}
