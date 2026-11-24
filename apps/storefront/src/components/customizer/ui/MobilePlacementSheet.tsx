import React from "react"
import { X, Maximize2, Check } from "lucide-react"
import type { PrintPositionConfig } from "../config/tshirt-mockups"

export interface MobilePlacementSheetProps {
  isOpen: boolean
  onClose: () => void
  availablePositions: Record<string, PrintPositionConfig>
  selectedPositionId: string
  onSelectPosition: (positionId: string) => void
}

export const MobilePlacementSheet: React.FC<MobilePlacementSheetProps> = ({
  isOpen,
  onClose,
  availablePositions,
  selectedPositionId,
  onSelectPosition
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
              <Maximize2 className="size-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-foreground">Print Placement</h3>
              <p className="text-[11px] text-muted-foreground">Select print area dimensions</p>
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

        {/* Placement Options List */}
        <div className="p-4 pb-14 sm:pb-10 space-y-2 overflow-y-auto custom-scrollbar">
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
                className={`w-full px-4 py-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs"
                    : "border-border/80 hover:bg-muted/40 hover:border-border"
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-foreground">{pos.name}</div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                    {pos.physicalSizeLabel}
                  </div>
                </div>

                {isSelected ? (
                  <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                ) : (
                  <Maximize2 className="size-4 text-muted-foreground/40" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
