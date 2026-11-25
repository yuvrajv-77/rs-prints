import React from "react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Separator } from "@/components/ui/separator"
import {
  Palette,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Shirt,
  Maximize2,
  ZoomIn,
  ZoomOut
} from "lucide-react"
import type { PrintPositionConfig, TShirtColorConfig } from "../config/tshirt-mockups"

export interface CustomizerLeftSidebarProps {
  colors: Record<string, TShirtColorConfig>
  selectedColorId: string
  onSelectColor: (colorId: string) => void
  selectedViewId: "front" | "back"
  onSelectView: (viewId: "front" | "back") => void
  availablePositions: Record<string, PrintPositionConfig>
  selectedPositionId: string
  onSelectPosition: (positionId: string) => void
  showGuides: boolean
  onToggleGuides: () => void
  onClearDesign?: () => void
  zoomLevel?: number
  onZoomIn?: () => void
  onZoomOut?: () => void
  hasDynamicColors?: boolean
}

export const CustomizerLeftSidebar: React.FC<CustomizerLeftSidebarProps> = ({
  colors,
  selectedColorId,
  onSelectColor,
  selectedViewId,
  onSelectView,
  availablePositions,
  selectedPositionId,
  onSelectPosition,
  showGuides,
  onToggleGuides,
  onClearDesign,
  zoomLevel = 1.0,
  onZoomIn,
  onZoomOut,
  hasDynamicColors = true
}) => {
  return (
    <div className="bg-card rounded-3xl border border-border/80 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      {/* Scrollable Setup Controls */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
        {/* 1. Colour Selector (Rendered only for products with dynamic color choices like T-shirts) */}
        {hasDynamicColors && Object.keys(colors).length > 1 && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-4 flex-wrap pt-1">
                {Object.values(colors).map((color) => {
                  const isSelected = selectedColorId === color.id
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => onSelectColor(color.id)}
                      title={color.name}
                      aria-label={color.name}
                      className={`size-12 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center relative shadow-sm ${
                        isSelected
                          ? "ring-3 ring-primary ring-offset-2 ring-offset-background scale-110 border-primary"
                          : "border-border/80 hover:scale-105 hover:border-foreground/30 opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {/* Subtle active indicator dot inside swatch */}
                      {isSelected && (
                        <span
                          className={`size-2 rounded-full ${
                            color.id === "white" ? "bg-black" : "bg-white"
                          }`}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* 2. View Angle Switcher (Front View <-> Back View) */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border/60">
            <button
              type="button"
              onClick={() => onSelectView("front")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedViewId === "front"
                  ? "bg-background text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shirt className="size-3.5" />
              <span>Front</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView("back")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedViewId === "back"
                  ? "bg-background text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shirt className="size-3.5 rotate-180" />
              <span>Back</span>
            </button>
          </div>
        </div>

        <Separator />

        {/* 3. Zoom Controls (Shadcn ButtonGroup with icons only) */}
        {onZoomIn && onZoomOut && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Zoom
              </span>
              <ButtonGroup>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onZoomIn}
                  disabled={zoomLevel >= 2.2}
                  className="size-8 cursor-pointer"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onZoomOut}
                  disabled={zoomLevel <= 0.6}
                  className="size-8 cursor-pointer"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="size-4" />
                </Button>
              </ButtonGroup>
            </div>
            <Separator />
          </>
        )}

        {/* 4. Print Position Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Print Placement
            </span>
            <span className="text-[10px] font-mono text-primary font-bold">
              {availablePositions[selectedPositionId]?.physicalSizeLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {Object.values(availablePositions).map((pos) => {
              const isSelected = selectedPositionId === pos.id
              return (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => onSelectPosition(pos.id)}
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
      </div>

      {/* Pinned Bottom Utility Actions */}
      <div className="shrink-0 p-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleGuides}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-muted cursor-pointer"
        >
          {showGuides ? <EyeOff className="size-3.5 text-primary" /> : <Eye className="size-3.5" />}
          <span className="text-[11px] font-medium">{showGuides ? "Hide Guide" : "Show Guide"}</span>
        </button>

        {onClearDesign && (
          <button
            type="button"
            onClick={onClearDesign}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors py-1 px-2 rounded-lg hover:bg-destructive/10 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span className="text-[11px] font-medium">Reset</span>
          </button>
        )}
      </div>
    </div>
  )
}
