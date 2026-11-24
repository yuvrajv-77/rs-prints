import React from "react"
import { Eye, EyeOff, Sparkles } from "lucide-react"

export interface CustomizerViewportProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  selectedPositionName: string
  showGuides: boolean
  onToggleGuides: () => void
  isLoading?: boolean
}

export const CustomizerViewport: React.FC<CustomizerViewportProps> = ({
  containerRef,
  canvasRef,
  selectedPositionName,
  showGuides,
  onToggleGuides,
  isLoading = false
}) => {
  return (
    <div className="w-full h-full min-h-0 flex flex-col items-center justify-between relative overflow-hidden">
      {/* Top indicator & boundary toggle - clean, unboxed */}
      <div className="w-full shrink-0 flex items-center justify-between mb-1 px-1.5 text-xs text-muted-foreground">
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
        <canvas ref={canvasRef} className="block max-w-full max-h-full" />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
            <div className="text-xs font-medium text-muted-foreground animate-pulse">
              Loading Fabric Canvas...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
