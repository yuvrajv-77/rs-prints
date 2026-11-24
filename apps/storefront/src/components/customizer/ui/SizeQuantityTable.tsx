import React from "react"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem
} from "@/components/ui/combobox"

export interface SizeConfig {
  id: string
  name: string
  chest: string
  desc: string
}

export const TSHIRT_SIZES: SizeConfig[] = [
  { id: "S", name: "S", chest: "38 in", desc: "Slim / Fitted" },
  { id: "M", name: "M", chest: "40 in", desc: "Regular Fit" },
  { id: "L", name: "L", chest: "42 in", desc: "Standard Comfort" },
  { id: "XL", name: "XL", chest: "44 in", desc: "Relaxed Fit" },
  { id: "2XL", name: "2XL", chest: "46 in", desc: "Plus / Oversized" }
]

// Array of options from 0 to 50
const QUANTITY_OPTIONS = Array.from({ length: 51 }, (_, i) => String(i))

export interface SizeQuantityTableProps {
  quantities: Record<string, number>
  onQuantityChange: (sizeId: string, quantity: number) => void
  totalQuantity: number
  unitPrice?: number
  className?: string
}

export const SizeQuantityTable: React.FC<SizeQuantityTableProps> = ({
  quantities,
  onQuantityChange,
  totalQuantity,
  unitPrice = 299,
  className = ""
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Sizes & Quantities
          </span>
          <p className="text-[10px] text-muted-foreground">Min 1 across sizes, max 50 per size</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
            {totalQuantity} {totalQuantity === 1 ? "pc" : "pcs"}
          </span>
        </div>
      </div>

      {/* Minimal Table */}
      <div className="rounded-2xl border border-border/80 overflow-hidden bg-card/60 shadow-xs">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
              <th className="py-2 px-3 text-left">Size</th>
              <th className="py-2 px-2 text-left">Chest</th>
              <th className="py-2 px-3 text-right">Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {TSHIRT_SIZES.map((size) => {
              const currentQty = quantities[size.id] ?? 0
              return (
                <tr
                  key={size.id}
                  className={`transition-colors ${
                    currentQty > 0 ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/20"
                  }`}
                >
                  <td className="py-2 px-3 font-black text-foreground">
                    <span className="inline-flex items-center justify-center size-6 rounded-md bg-muted text-foreground text-xs font-black">
                      {size.name}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-muted-foreground text-[11px]">
                    {size.chest}
                  </td>
                  <td className="py-1.5 px-3 text-right">
                    <div className="flex justify-end">
                      <Combobox
                        items={QUANTITY_OPTIONS}
                        value={String(currentQty)}
                        onValueChange={(val) => {
                          if (val !== null && val !== undefined) {
                            const num = parseInt(String(val), 10)
                            if (!isNaN(num)) onQuantityChange(size.id, num)
                          }
                        }}
                        onInputValueChange={(inputVal) => {
                          const num = parseInt(inputVal, 10)
                          if (!isNaN(num) && num >= 0 && num <= 50) {
                            onQuantityChange(size.id, num)
                          }
                        }}
                      >
                        <ComboboxInput
                          className="w-20 h-7 text-xs font-bold"
                          placeholder="0"
                          showTrigger={true}
                        />
                        <ComboboxContent align="end" className="min-w-20 max-h-48 z-50">
                          <ComboboxList>
                            {QUANTITY_OPTIONS.map((qty) => (
                              <ComboboxItem key={qty} value={qty} className="text-xs py-1">
                                {qty}
                              </ComboboxItem>
                            ))}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Helper text or warning if 0 selected */}
      {totalQuantity === 0 && (
        <p className="text-[11px] font-semibold text-destructive px-1">
          * Please select at least 1 item in any size to proceed
        </p>
      )}
    </div>
  )
}
