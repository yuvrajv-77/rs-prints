import React, { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Image as ImageIcon,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Download,
  ShoppingBag,
  Sparkles,
  Layers,
  Check,
  Maximize2,
  Info,
  Sliders,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Palette,
  Eye
} from "lucide-react"
import type { ArtworkLayerInfo } from "../core/fabric-manager"
import type { PrintPositionConfig, TShirtColorConfig } from "../config/tshirt-mockups"

export interface CustomizerSidebarProps {
  colors: Record<string, TShirtColorConfig>
  selectedColorId: string
  onSelectColor: (colorId: string) => void

  selectedSize: string
  onSelectSize: (size: string) => void

  selectedViewId: "front" | "back"
  onSelectView: (viewId: "front" | "back") => void

  availablePositions: Record<string, PrintPositionConfig>
  selectedPositionId: string
  onSelectPosition: (positionId: string) => void

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
  onFlipV: () => void

  onClearDesign?: () => void
  onDownloadMockup: () => void
  onDownloadPrintFile: () => void
  onAddToCart: () => void
  isAddingToCart?: boolean
  unitPrice?: number
}

export const CustomizerSidebar: React.FC<CustomizerSidebarProps> = ({
  colors,
  selectedColorId,
  onSelectColor,
  selectedSize,
  onSelectSize,
  selectedViewId,
  onSelectView,
  availablePositions,
  selectedPositionId,
  onSelectPosition,
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
  onFlipV,
  onClearDesign,
  onDownloadMockup,
  onDownloadPrintFile,
  onAddToCart,
  isAddingToCart = false,
  unitPrice = 299
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUploadImage(file)
      e.target.value = ""
    }
  }

  const selectedColor = colors[selectedColorId] || Object.values(colors)[0]

  return (
    <div className="bg-card rounded-3xl border border-border/80 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      {/* Scrollable Configuration Controls */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5 pr-3.5 custom-scrollbar">
        {/* 1. T-Shirt Colour Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Palette className="size-3.5 text-primary" />
            <span>Garment Colour</span>
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{selectedColor?.name}</span>
            {onClearDesign && (
              <button
                type="button"
                onClick={onClearDesign}
                className="text-[11px] text-muted-foreground hover:text-destructive underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {Object.values(colors).map((color) => {
            const isSelected = selectedColorId === color.id
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onSelectColor(color.id)}
                title={color.name}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-2xs"
                    : "border-border/80 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <span
                  className="size-3.5 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 1b. Garment Size Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Garment Size
          </Label>
          <span className="text-xs font-semibold text-foreground">{selectedSize}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {["S", "M", "L", "XL", "2XL"].map((sz) => {
            const isSelected = selectedSize === sz
            return (
              <button
                key={sz}
                type="button"
                onClick={() => onSelectSize(sz)}
                className={`py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-2xs"
                    : "border-border/80 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                {sz}
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* 2. View Switcher (Front <-> Back) */}
      <div className="space-y-2.5">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          View Angle
        </Label>
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border/60">
          <button
            type="button"
            onClick={() => onSelectView("front")}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              selectedViewId === "front"
                ? "bg-background text-foreground shadow-2xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Front View
          </button>
          <button
            type="button"
            onClick={() => onSelectView("back")}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              selectedViewId === "back"
                ? "bg-background text-foreground shadow-2xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Back View
          </button>
        </div>
      </div>

      {/* 3. Print Position Selector */}
      <div className="space-y-2.5">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Printing Position</span>
          <span className="text-[11px] font-mono font-medium text-primary">
            {availablePositions[selectedPositionId]?.physicalSizeLabel}
          </span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {Object.values(availablePositions).map((pos) => {
            const isSelected = selectedPositionId === pos.id
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => onSelectPosition(pos.id)}
                className={`px-3 py-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-2xs"
                    : "border-border/80 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="truncate">{pos.name}</div>
                <div className="text-[10px] font-normal text-muted-foreground mt-0.5">
                  {pos.physicalSizeLabel}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* 4. Upload Artwork Section */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Upload Customer Artwork</span>
          <span className="text-[11px] font-normal lowercase text-muted-foreground">
            PNG, JPEG, WEBP (Max 25MB)
          </span>
        </Label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-5 text-center cursor-pointer transition-all hover:bg-muted/30 group"
        >
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <Upload className="size-5" />
          </div>
          <div className="text-sm font-bold text-foreground">
            Click to Browse or Drop Photo
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Supports multiple images • Clamped strictly to print region
          </div>
        </div>
      </div>

      {/* 5. Uploaded Artwork Layers List & Layer Ordering */}
      {artworkLayers.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              <span>Layers ({artworkLayers.length})</span>
            </Label>
            <span className="text-[10px] text-muted-foreground">Top to bottom order</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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

                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Layer re-ordering */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onBringForward(layer.id)
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
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
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
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
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                      title="Remove artwork"
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

      {/* 6. Selected Artwork Transform Controls */}
      {selectedLayer && (
        <div className="space-y-4 pt-2 border-t border-border/50 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Sliders className="size-3.5 text-primary" />
              <span>Layer: {selectedLayer.name}</span>
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onBringToFront(selectedLayer.id)}
                className="h-6 text-[10px] px-1.5"
                title="Bring to absolute front"
              >
                Top
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSendToBack(selectedLayer.id)}
                className="h-6 text-[10px] px-1.5"
                title="Send to bottom layer"
              >
                Bottom
              </Button>
            </div>
          </div>

          {/* Scale Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Scale Size</span>
              <span className="font-mono font-medium">
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

          {/* Rotation Controls: Slider + Degree Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs items-center">
              <span className="text-muted-foreground">Rotation Angle</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="-180"
                  max="180"
                  value={Math.round(selectedLayer.angle || 0)}
                  onChange={(e) => onSetRotation(parseInt(e.target.value) || 0)}
                  className="w-14 h-6 text-center text-xs font-mono border rounded px-1"
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

          {/* Quick Preset Rotation & Alignment Actions */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRotateDelta(90)}
              className="h-9 gap-1 text-xs"
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw className="size-3.5" />
              <span>+90°</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRotateDelta(-90)}
              className="h-9 gap-1 text-xs"
              title="Rotate 90 degrees counter-clockwise"
            >
              <RotateCcw className="size-3.5" />
              <span>-90°</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onFlipH}
              className="h-9 gap-1 text-xs"
              title="Flip horizontally"
            >
              <FlipHorizontal className="size-3.5" />
              <span>Flip H</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCenterArtwork}
              className="h-9 gap-1 text-xs"
              title="Center inside print area"
            >
              <Maximize2 className="size-3.5" />
              <span>Center</span>
            </Button>
          </div>
        </div>
      )}
      </div>

      {/* Pinned Bottom Actions & Pricing */}
      <div className="shrink-0 p-4 border-t border-border/60 bg-muted/20 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Price per Piece
            </span>
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              ₹{unitPrice}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Bio-washed 180 GSM Cotton • DTF Print
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDownloadMockup}
              className="h-8 text-xs gap-1.5"
              title="Download composited mockup preview"
            >
              <Download className="size-3.5" />
              <span>Mockup</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDownloadPrintFile}
              className="h-8 text-xs gap-1.5"
              title="Download transparent production print file"
            >
              <Layers className="size-3.5" />
              <span>Print File</span>
            </Button>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={onAddToCart}
          disabled={isAddingToCart}
          className="w-full gap-2.5 h-11 text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all cursor-pointer"
        >
          <ShoppingBag className="size-4.5" />
          <span>{isAddingToCart ? "Adding to Cart..." : `Add to Cart • ₹${unitPrice}`}</span>
        </Button>
      </div>
    </div>
  )
}
