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
  Download,
  ShoppingBag,
  Layers,
  Maximize2,
  Sliders,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { SizeQuantityTable } from "./SizeQuantityTable"
import { DirectQuantitySelector } from "./DirectQuantitySelector"
import type { ArtworkLayerInfo } from "../core/fabric-manager"

export interface CustomizerRightSidebarProps {
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
  onFlipV?: () => void

  onDownloadMockup: () => void
  onDownloadPrintFile: () => void

  onRequestAddToCart: () => void
  isAddingToCart?: boolean
  unitPrice?: number

  sizeQuantities: Record<string, number>
  onQuantityChange: (sizeId: string, quantity: number) => void
  totalQuantity: number
  hasGarmentSizes?: boolean
  directQuantity?: number
  onDirectQuantityChange?: (quantity: number) => void
  materialSubtitle?: string
}

export const CustomizerRightSidebar: React.FC<CustomizerRightSidebarProps> = ({
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
  onDownloadPrintFile,
  onRequestAddToCart,
  isAddingToCart = false,
  unitPrice = 299,
  sizeQuantities,
  onQuantityChange,
  totalQuantity,
  hasGarmentSizes = true,
  directQuantity = 1,
  onDirectQuantityChange,
  materialSubtitle
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUploadImage(file)
      e.target.value = ""
    }
  }

  return (
    <div className="bg-card rounded-3xl border border-border/80 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Scrollable Artwork Studio Controls */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
        {/* 1. Upload Artwork Dropzone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Customer Artwork
            </span>
            <span className="text-[10px] text-muted-foreground">PNG, JPG (Max 25MB)</span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-4 text-center cursor-pointer transition-all hover:bg-muted/30 group"
          >
            <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
              <Upload className="size-4.5" />
            </div>
            <div className="text-xs font-bold text-foreground">
              Click to Upload or Drop File
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Instant print alignment • High-resolution DTF
            </div>
          </div>
        </div>

     

        {/* 3. Layers List (if multiple layers) */}
        {artworkLayers.length > 0 && (
          <div className="space-y-2 pt-1">
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                <span>Layers ({artworkLayers.length})</span>
              </span>
              <span className="text-[10px] text-muted-foreground">Order</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
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
                          className="size-6 rounded-lg object-contain bg-background border border-border/60 shrink-0"
                        />
                      ) : (
                        <ImageIcon className="size-3.5 shrink-0 text-primary" />
                      )}
                      <span className="truncate">{layer.name}</span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onBringForward(layer.id)
                        }}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Bring forward"
                      >
                        <ChevronUp className="size-3" />
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
                        <ChevronDown className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveLayer(layer.id)
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5 cursor-pointer"
                        title="Remove artwork"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 4. Sizes & Quantities Minimal Table or Direct Quantity Selector */}
        <div className="pt-1">
          <Separator className="mb-4" />
          {hasGarmentSizes ? (
            <SizeQuantityTable
              quantities={sizeQuantities}
              onQuantityChange={onQuantityChange}
              totalQuantity={totalQuantity}
              unitPrice={unitPrice}
            />
          ) : (
            <DirectQuantitySelector
              quantity={directQuantity}
              onQuantityChange={onDirectQuantityChange ?? (() => {})}
              unitPrice={unitPrice}
            />
          )}
        </div>

        {/* 5. Previews & Downloads */}
        <div className="space-y-2 pt-1">
          <Separator />
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDownloadMockup}
              className="h-8 text-xs gap-1.5 cursor-pointer"
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
              className="h-8 text-xs gap-1.5 cursor-pointer"
              title="Download transparent production print file"
            >
              <Layers className="size-3.5" />
              <span>Print File</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Pinned Bottom Actions & Pricing */}
      <div className="shrink-0 p-4 border-t border-border/60 bg-muted/20 space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {totalQuantity > 1 ? `Total (${totalQuantity} pcs)` : "Price per Piece"}
            </span>
            <div className="text-2xl font-black text-foreground tracking-tight">
              ₹{unitPrice * Math.max(1, totalQuantity)}
            </div>
            {totalQuantity > 1 && (
              <div className="text-[10px] text-muted-foreground">
                ₹{unitPrice} / piece
              </div>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground text-right">
            {materialSubtitle || (hasGarmentSizes ? "Bio-washed 180 GSM" : "Premium Custom Print")}
          </div>
        </div>

        {/* Add to Cart button */}
        <Button
          type="button"
          size="lg"
          onClick={onRequestAddToCart}
          disabled={isAddingToCart || totalQuantity === 0}
          className="w-full gap-2.5 h-12 text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all cursor-pointer"
        >
          <ShoppingBag className="size-4.5" />
          <span>
            {isAddingToCart
              ? "Adding..."
              : totalQuantity === 0
              ? "Select Quantity"
              : `Add to Cart • ₹${unitPrice * totalQuantity}`}
          </span>
        </Button>
      </div>
    </div>
  )
}
