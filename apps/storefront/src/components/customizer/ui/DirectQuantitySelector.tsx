import React from "react"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem
} from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

export interface DirectQuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  unitPrice: number
  label?: string
  className?: string
}

// Preset popular quantities for corporate gifts & merchandise
const BULK_PRESETS = ["1", "5", "10", "25", "50", "100", "250", "500"]

export const DirectQuantitySelector: React.FC<DirectQuantitySelectorProps> = ({
  quantity,
  onQuantityChange,
  unitPrice,
  label = "Order Quantity",
  className = ""
}) => {
  const handleDecrement = () => {
    if (quantity > 1) onQuantityChange(quantity - 1)
  }

  const handleIncrement = () => {
    if (quantity < 500) onQuantityChange(quantity + 1)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <p className="text-[10px] text-muted-foreground">Min 1 piece • Wholesale tiers available</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
            {quantity} {quantity === 1 ? "piece" : "pieces"}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 p-3 bg-card/60 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="size-8 rounded-xl cursor-pointer"
            aria-label="Decrease quantity"
          >
            <Minus className="size-3.5" />
          </Button>

          <div className="w-20">
            <Combobox
              items={BULK_PRESETS}
              value={String(quantity)}
              onValueChange={(val) => {
                if (val !== null && val !== undefined) {
                  const num = parseInt(String(val), 10)
                  if (!isNaN(num) && num >= 1) onQuantityChange(num)
                }
              }}
              onInputValueChange={(inputVal) => {
                const num = parseInt(inputVal, 10)
                if (!isNaN(num) && num >= 1 && num <= 500) {
                  onQuantityChange(num)
                }
              }}
            >
              <ComboboxInput
                className="w-full h-8 text-xs font-bold text-center"
                placeholder="1"
                showTrigger={false}
              />
              <ComboboxContent align="center" className="min-w-24 max-h-48 z-50">
                <ComboboxList>
                  {BULK_PRESETS.map((qty) => (
                    <ComboboxItem key={qty} value={qty} className="text-xs py-1">
                      {qty} pcs
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={quantity >= 500}
            className="size-8 rounded-xl cursor-pointer"
            aria-label="Increase quantity"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        <div className="text-right">
          <div className="text-sm font-bold text-foreground">
            ₹{(unitPrice * quantity).toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] text-muted-foreground">
            ₹{unitPrice} / piece
          </div>
        </div>
      </div>
    </div>
  )
}
