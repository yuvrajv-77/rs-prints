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
  ZoomOut,
  FileText,
  X
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
  attributeName?: string
  attributeType?: "color" | "finish" | "pill"
  notes?: string
  onNotesChange?: (notes: string) => void
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
  hasDynamicColors = true,
  attributeName = "Colour",
  attributeType = "color",
  notes = "",
  onNotesChange
}) => {
  return (
    <div className="bg-card rounded-3xl border border-border/80 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      {/* Scrollable Setup Controls */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
        {/* 1. Dynamic Attribute Selector (Colour, Finish, Handle Colour, Body Colour, etc.) */}
        {hasDynamicColors && Object.keys(colors).length > 1 && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Palette className="size-3.5" />
                  <span>{attributeName}</span>
                </span>
                <span className="text-xs font-bold text-foreground truncate max-w-[130px]">
                  {colors[selectedColorId]?.name}
                </span>
              </div>

              {attributeType === "pill" ? (
                /* Pill buttons for Finishes (Glossy vs Matte, Gold vs Silver, etc.) */
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-2xl border border-border/60">
                  {Object.values(colors).map((opt) => {
                    const isSelected = selectedColorId === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSelectColor(opt.id)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? "bg-background text-foreground shadow-2xs border border-primary/60 ring-2 ring-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                        }`}
                      >
                        <span
                          className="size-2.5 rounded-full border border-border/80"
                          style={{ backgroundColor: opt.hex }}
                        />
                        <span className="truncate">{opt.name}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                /* Swatches for Colors, Neon Colors, Handle Colors, Body Colors */
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  {Object.values(colors).map((color) => {
                    const isSelected = selectedColorId === color.id
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => onSelectColor(color.id)}
                        title={color.name}
                        aria-label={color.name}
                        className={`size-11 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center relative shadow-sm ${
                          isSelected
                            ? "ring-3 ring-primary ring-offset-2 ring-offset-background scale-110 border-primary"
                            : "border-border/80 hover:scale-105 hover:border-foreground/30 opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && (
                          <span
                            className={`size-2 rounded-full ${
                              color.isLight ? "bg-black" : "bg-white"
                            }`}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* 2. View Angle Switcher (Front View <-> Back View, shown only if back view is present) */}
        {Boolean(colors[selectedColorId]?.views?.back) && (
          <>
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
          </>
        )}

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

        {/* 4. Placement Zones (Rendered ONLY if multiple print positions exist) */}
        {Object.keys(availablePositions).length > 1 && (
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Maximize2 className="size-3.5" />
              <span>Print Placement</span>
            </span>
            <div className="grid grid-cols-1 gap-2 pt-1">
              {Object.values(availablePositions).map((pos) => {
                const isSelected = selectedPositionId === pos.id
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => onSelectPosition(pos.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40"
                        : "border-border/70 hover:border-foreground/30 hover:bg-muted/40"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-foreground">{pos.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {pos.physicalSizeLabel}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="size-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 5. Custom Description / Printing Notes Input Box */}
        {onNotesChange && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3.5" />
                <span>Custom Instructions</span>
              </span>
              {notes && notes.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {notes.length}/250
                </span>
              )}
            </div>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value.slice(0, 250))}
                placeholder="Add instructions (e.g. text to write, custom alignment, or special printing notes)..."
                rows={3}
                className="w-full text-xs p-3 rounded-2xl bg-muted/40 border border-border/80 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all placeholder:text-muted-foreground/60 custom-scrollbar leading-relaxed"
              />
              {notes && notes.length > 0 && (
                <button
                  type="button"
                  onClick={() => onNotesChange("")}
                  className="absolute right-2.5 top-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                  title="Clear instructions"
                  aria-label="Clear instructions"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Visual Guides & Canvas Reset Footer */}
      <div className="p-4 border-t border-border/80 bg-muted/20 space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleGuides}
          className="w-full justify-between h-9 text-xs rounded-xl cursor-pointer hover:bg-muted"
        >
          <span className="flex items-center gap-2">
            {showGuides ? (
              <Eye className="size-3.5 text-primary" />
            ) : (
              <EyeOff className="size-3.5 text-muted-foreground" />
            )}
            <span>Print Area Guides</span>
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            {showGuides ? "ON" : "OFF"}
          </span>
        </Button>

        {onClearDesign && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearDesign}
            className="w-full justify-start h-8 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer transition-colors"
          >
            <RotateCcw className="size-3 mr-2" />
            <span>Reset Active Canvas</span>
          </Button>
        )}
      </div>
    </div>
  )
}
