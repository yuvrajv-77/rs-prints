import React from "react"
import { Button } from "@/components/ui/button"
import { X, Palette, Shirt, Maximize2, RotateCcw } from "lucide-react"
import type { PrintPositionConfig, TShirtColorConfig } from "../config/tshirt-mockups"

export interface MobileColorSheetProps {
  isOpen: boolean
  onClose: () => void
  colors: Record<string, TShirtColorConfig>
  selectedColorId: string
  onSelectColor: (colorId: string) => void
  selectedViewId: "front" | "back"
  onSelectView: (viewId: "front" | "back") => void
  availablePositions: Record<string, PrintPositionConfig>
  selectedPositionId: string
  onSelectPosition: (positionId: string) => void
  onClearDesign?: () => void
}

export const MobileColorSheet: React.FC<MobileColorSheetProps> = ({
  isOpen,
  onClose,
  colors,
  selectedColorId,
  onSelectColor,
  selectedViewId,
  onSelectView,
  availablePositions,
  selectedPositionId,
  onSelectPosition,
  onClearDesign
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
      <div className="relative z-10 w-full max-h-[85vh] bg-card rounded-t-3xl border-t border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Palette className="size-4" />
            </div>
            <span className="font-black text-sm text-foreground">Colour & View Angle</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            title="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar">
          {/* 1. T-Shirt Colour (Pure swatches, strictly NO text label on them) */}
          <div className="space-y-3">
            <div className="flex items-center gap-4 pt-1">
              {Object.values(colors).map((color) => {
                const isSelected = selectedColorId === color.id
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => onSelectColor(color.id)}
                    title={color.name}
                    aria-label={color.name}
                    className={`size-14 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center relative shadow-sm ${
                      isSelected
                        ? "ring-4 ring-primary ring-offset-2 ring-offset-background scale-110 border-primary"
                        : "border-border/80 opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <span
                        className={`size-2.5 rounded-full ${
                          color.id === "white" ? "bg-black" : "bg-white"
                        }`}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. View Angle Switcher */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              View Angle
            </span>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => onSelectView("front")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedViewId === "front"
                    ? "bg-background text-foreground shadow-2xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shirt className="size-3.5" />
                <span>Front View</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectView("back")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedViewId === "back"
                    ? "bg-background text-foreground shadow-2xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shirt className="size-3.5 rotate-180" />
                <span>Back View</span>
              </button>
            </div>
          </div>

          {/* 3. Print Positions */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Print Placement
            </span>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(availablePositions).map((pos) => {
                const isSelected = selectedPositionId === pos.id
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => {
                      onSelectPosition(pos.id)
                      onClose()
                    }}
                    className={`px-3.5 py-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-2xs"
                        : "border-border/80 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-foreground">{pos.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {pos.physicalSizeLabel}
                      </div>
                    </div>
                    <Maximize2 className={`size-3.5 ${isSelected ? "text-primary" : "text-muted-foreground/40"}`} />
                  </button>
                )
              })}
            </div>
          </div>

          {onClearDesign && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  onClearDesign()
                  onClose()
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Reset Design & Artwork</span>
              </button>
            </div>
          )}
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
