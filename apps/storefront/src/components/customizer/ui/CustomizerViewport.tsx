import React from "react"
import { Eye, EyeOff, Sparkles, Shirt, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"

export interface CustomizerViewportProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  selectedPositionName: string
  showGuides: boolean
  onToggleGuides: () => void
  isLoading?: boolean
  selectedViewId?: "front" | "back"
  onSelectView?: (viewId: "front" | "back") => void
  zoomLevel?: number
  onZoomIn?: () => void
  onZoomOut?: () => void
}

export const CustomizerViewport: React.FC<CustomizerViewportProps> = ({
  containerRef,
  canvasRef,
  selectedPositionName,
  showGuides,
  onToggleGuides,
  isLoading = false,
  selectedViewId,
  onSelectView,
  zoomLevel = 1.0,
  onZoomIn,
  onZoomOut
}) => {
  return (
    <div className="w-full h-full min-h-0 flex flex-col items-center justify-between relative overflow-hidden">
      {/* Top indicator & boundary toggle - clean, unboxed */}
      <div className="w-full shrink-0 hidden lg:flex items-center justify-between mb-1 px-1.5 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/80 flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />
          <span>{selectedPositionName}</span>
        </span>

        <button
          type="button"
          onClick={onToggleGuides}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {showGuides ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          <span>{showGuides ? "Hide Boundary" : "Show Boundary"}</span>
        </button>
      </div>

      {/* Main Canvas Host Container - flexible, perfectly contained */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 min-h-0 flex items-center justify-center select-none overflow-hidden"
      >
        <canvas ref={canvasRef} className="block" />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
            <div className="text-xs font-medium text-muted-foreground animate-pulse">
              Loading Fabric Canvas...
            </div>
          </div>
        )}
      </div>

      {/* Mobile Fixed Zoom Controls on Left of Mockup */}
      {onZoomIn && onZoomOut && (
        <div className="lg:hidden absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 z-20">
          <ButtonGroup orientation="vertical" className="bg-background/90 backdrop-blur-md shadow-md rounded-2xl border border-border/80 overflow-hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onZoomIn}
              disabled={zoomLevel >= 2.2}
              className="size-9 p-0 rounded-b-none border-b border-border/60 cursor-pointer hover:bg-muted/60 flex items-center justify-center"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="size-4.5 text-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onZoomOut}
              disabled={zoomLevel <= 0.6}
              className="size-9 p-0 rounded-t-none cursor-pointer hover:bg-muted/60 flex items-center justify-center"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="size-4.5 text-foreground" />
            </Button>
          </ButtonGroup>
        </div>
      )}

      {/* Front / Back selector in mockup box below mockup - only on mobile screens */}
      {selectedViewId && onSelectView && (
        <div className="lg:hidden mt-2 shrink-0 flex items-center justify-center z-10">
          <div className="inline-flex items-center gap-1 bg-background/90 backdrop-blur-md p-1 rounded-full border border-border shadow-xs">
            <button
              type="button"
              onClick={() => onSelectView("front")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedViewId === "front"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shirt className="size-4.5" />
              <span>Front</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView("back")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedViewId === "back"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shirt className="size-4.5 rotate-180" />
              <span>Back</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
