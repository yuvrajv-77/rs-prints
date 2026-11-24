import React from "react"
import { X, Palette, Check } from "lucide-react"
import type { TShirtColorConfig } from "../config/tshirt-mockups"

export interface MobileColorSheetProps {
  isOpen: boolean
  onClose: () => void
  colors: Record<string, TShirtColorConfig>
  selectedColorId: string
  onSelectColor: (colorId: string) => void
}

export const MobileColorSheet: React.FC<MobileColorSheetProps> = ({
  isOpen,
  onClose,
  colors,
  selectedColorId,
  onSelectColor
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-h-[80vh] bg-card rounded-t-3xl border-t border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Palette className="size-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-foreground">Select Garment Colour</h3>
              <p className="text-[11px] text-muted-foreground">Pick a colour for your custom t-shirt</p>
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

        {/* Available Colours List */}
        <div className="p-4 space-y-2.5 overflow-y-auto custom-scrollbar">
          {Object.values(colors).map((color) => {
            const isSelected = selectedColorId === color.id
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => {
                  onSelectColor(color.id)
                  onClose()
                }}
                className={`w-full px-4 py-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs"
                    : "border-border/80 hover:bg-muted/40 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`size-10 rounded-xl border-2 flex items-center justify-center shadow-2xs ${
                      isSelected ? "border-primary" : "border-border/80"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <span
                        className={`size-2 rounded-full ${
                          color.id === "white" ? "bg-black" : "bg-white"
                        }`}
                      />
                    )}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-foreground">{color.name}</div>
                    <div className="text-[10px] text-muted-foreground">100% Bio-Washed Cotton</div>
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
      </div>
    </div>
  )
}
