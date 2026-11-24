import React, { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Upload,
  Image as ImageIcon,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Trash2,
  X,
  Sliders,
  Maximize2,
  Layers,
  ChevronUp,
  ChevronDown,
  Download
} from "lucide-react"
import type { ArtworkLayerInfo } from "../core/fabric-manager"

export interface MobileUploadSheetProps {
  isOpen: boolean
  onClose: () => void
  artworkLayers: ArtworkLayerInfo[]
  selectedLayer: ArtworkLayerInfo | null
  onSelectLayer: (layerId: string) => void
  onRemoveLayer: (layerId: string) => void

  onBringForward: (layerId: string) => void
  onSendBackward: (layerId: string) => void
  onBringToFront: (layerId: string) => void
  onSendToBack: (layerId: string) => void

  onUploadImage: (file: File) => void
  onRotateDelta: (delta: number) => void
  onSetRotation: (angle: number) => void
  onSetScale: (scale: number) => void
  onCenterArtwork: () => void
  onFlipH: () => void

  onDownloadMockup: () => void
  onDownloadPrintFile: () => void
}

export const MobileUploadSheet: React.FC<MobileUploadSheetProps> = ({
  isOpen,
  onClose,
  artworkLayers,
  selectedLayer,
  onSelectLayer,
  onRemoveLayer,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onUploadImage,
  onRotateDelta,
  onSetRotation,
  onSetScale,
  onCenterArtwork,
  onFlipH,
  onDownloadMockup,
  onDownloadPrintFile
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUploadImage(file)
      e.target.value = ""
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-h-[85vh] bg-card rounded-t-3xl border-t border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Upload className="size-4" />
            </div>
            <span className="font-black text-sm text-foreground truncate">
              {selectedLayer ? `Edit: ${selectedLayer.name}` : "Upload Customer Design"}
            </span>
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

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 rounded-2xl p-4 text-center cursor-pointer transition-all"
          >
            <Upload className="size-6 text-primary mx-auto mb-1" />
            <div className="text-xs font-bold text-foreground">
              {artworkLayers.length > 0 ? "+ Add Another Artwork" : "Tap to Browse or Drop Photo"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Supports PNG, JPEG, WEBP (Max 25MB)
            </div>
          </div>

          {/* Active Layer Transform Controls */}
          {selectedLayer && (
            <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sliders className="size-3.5 text-primary" />
                  <span className="truncate max-w-[140px]">{selectedLayer.name}</span>
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onBringToFront(selectedLayer.id)}
                    className="h-6 text-[10px] px-1.5 cursor-pointer"
                    title="Bring to absolute front"
                  >
                    Top
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSendToBack(selectedLayer.id)}
                    className="h-6 text-[10px] px-1.5 cursor-pointer"
                    title="Send to bottom"
                  >
                    Bottom
                  </Button>
                </div>
              </div>

              {/* Scale Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Scale Size</span>
                  <span className="font-mono font-bold text-primary">
                    {Math.round((selectedLayer.scaleX || 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="4.0"
                  step="0.05"
                  value={selectedLayer.scaleX || 1}
                  onChange={(e) => onSetScale(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Rotation Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs items-center">
                  <span className="text-muted-foreground">Rotation</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="-180"
                      max="180"
                      value={Math.round(selectedLayer.angle || 0)}
                      onChange={(e) => onSetRotation(parseInt(e.target.value) || 0)}
                      className="w-12 h-6 text-center text-xs font-mono border rounded px-1"
                    />
                    <span className="text-xs text-muted-foreground">°</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={selectedLayer.angle || 0}
                  onChange={(e) => onSetRotation(parseInt(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRotateDelta(90)}
                  className="h-8 gap-1 text-[11px] cursor-pointer"
                >
                  <RotateCw className="size-3" />
                  <span>+90°</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRotateDelta(-90)}
                  className="h-8 gap-1 text-[11px] cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  <span>-90°</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onFlipH}
                  className="h-8 gap-1 text-[11px] cursor-pointer"
                >
                  <FlipHorizontal className="size-3" />
                  <span>Flip H</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCenterArtwork}
                  className="h-8 gap-1 text-[11px] cursor-pointer"
                >
                  <Maximize2 className="size-3" />
                  <span>Center</span>
                </Button>
              </div>
            </div>
          )}

          {/* Uploaded Layers List */}
          {artworkLayers.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                <span>Layers ({artworkLayers.length})</span>
              </span>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {artworkLayers.map((layer) => {
                  const isSelected = selectedLayer?.id === layer.id
                  return (
                    <div
                      key={layer.id}
                      onClick={() => onSelectLayer(layer.id)}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground font-semibold shadow-2xs"
                          : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {layer.url ? (
                          <img
                            src={layer.url}
                            alt={layer.name}
                            className="size-7 rounded-lg object-contain bg-background border border-border/60 shrink-0"
                          />
                        ) : (
                          <ImageIcon className="size-4 shrink-0 text-primary" />
                        )}
                        <span className="truncate">{layer.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onBringForward(layer.id)
                          }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Bring forward"
                        >
                          <ChevronUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSendBackward(layer.id)
                          }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Send backward"
                        >
                          <ChevronDown className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveLayer(layer.id)
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5 cursor-pointer"
                          title="Remove layer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Previews / Downloads */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDownloadMockup}
              className="h-9 text-xs gap-1.5 cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>Mockup Preview</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDownloadPrintFile}
              className="h-9 text-xs gap-1.5 cursor-pointer"
            >
              <Layers className="size-3.5" />
              <span>DTF Print File</span>
            </Button>
          </div>
        </div>

        {/* Footer Done Button */}
        <div className="p-4 border-t border-border/60 bg-muted/20">
          <Button
            type="button"
            size="lg"
            onClick={onClose}
            className="w-full h-11 text-xs font-bold"
          >
            Apply & Close
          </Button>
        </div>
      </div>
    </div>
  )
}
