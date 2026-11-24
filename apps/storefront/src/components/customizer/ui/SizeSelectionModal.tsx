import React from "react"
import { Button } from "@/components/ui/button"
import { ShoppingBag, X, Sparkles, Check } from "lucide-react"

export interface SizeSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedSize: string
  onSelectSize: (size: string) => void
  onConfirmAddToCart: () => void
  isAddingToCart?: boolean
  unitPrice?: number
}

const SIZES = [
  { id: "S", name: "S", chest: "38 in", desc: "Slim / Fitted" },
  { id: "M", name: "M", chest: "40 in", desc: "Regular Fit" },
  { id: "L", name: "L", chest: "42 in", desc: "Standard Comfort" },
  { id: "XL", name: "XL", chest: "44 in", desc: "Relaxed Fit" },
  { id: "2XL", name: "2XL", chest: "46 in", desc: "Plus / Oversized" }
]

export const SizeSelectionModal: React.FC<SizeSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedSize,
  onSelectSize,
  onConfirmAddToCart,
  isAddingToCart = false,
  unitPrice = 299
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet Box */}
      <div className="relative z-10 w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-foreground">Select Garment Size</h3>
              <p className="text-[11px] text-muted-foreground">Pick your fit before adding to cart</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            title="Close"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Content: Size Grid */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {SIZES.map((sz) => {
              const isSelected = selectedSize === sz.id
              return (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => onSelectSize(sz.id)}
                  className={`px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs"
                      : "border-border/80 hover:bg-muted/40 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`size-9 rounded-xl flex items-center justify-center text-sm font-black ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {sz.name}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-foreground">{sz.desc}</div>
                      <div className="text-[11px] text-muted-foreground">Chest: {sz.chest}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="text-[11px] text-center text-muted-foreground pt-1">
            100% Super-combed Bio-washed Cotton • Pre-shrunk Fabric
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 pb-12 sm:pb-8 border-t border-border/60 bg-muted/20">
          <Button
            type="button"
            size="lg"
            onClick={onConfirmAddToCart}
            disabled={isAddingToCart}
            className="w-full gap-2 h-12 text-sm font-bold shadow-md shadow-primary/20 cursor-pointer"
          >
            <ShoppingBag className="size-4" />
            <span>
              {isAddingToCart ? "Adding..." : `Confirm Size (${selectedSize}) • Add to Cart ₹${unitPrice}`}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
