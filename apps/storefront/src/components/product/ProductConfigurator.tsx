import { useState, useMemo, useEffect } from "react"
import { useStore } from "@nanostores/react"
import type { Product, ProductVariant } from "@/types/product"
import { activeVariantImageStore } from "@/stores/product"
import { getColorHex } from "@/lib/vendure/mappers"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import {
  SendIcon,
  ClockIcon,
  UploadIcon,
  CheckIcon
} from "lucide-react"

interface ProductConfiguratorProps {
  product: Product
}

// Preset standard quantities for custom print orders with tiered bulk savings
const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 50, 100]

/**
 * ProductConfigurator Component
 *
 * Interactive configuration panel for custom-printed merchandise.
 *
 * Key Capabilities:
 * - Option Filtering: Prunes options to only those that actually exist in active variants.
 * - Variant Resolution: Matches current user option choices (e.g. Size=M, Color=Red)
 *   against Vendure variants to compute exact price, SKU, and stock status.
 * - Bi-directional Image Sync: Coordinates with `ProductGallery` via `activeVariantImageStore`.
 *   Selecting an option changes the gallery photo; clicking a gallery thumbnail switches options.
 * - WhatsApp Lead Generation: Formats an order summary and opens WhatsApp with pre-filled message.
 */
export default function ProductConfigurator({ product }: ProductConfiguratorProps) {
  const variants = product.variants || []

  // 1. Process option groups:
  // Vendure option groups may define options not used in current variants (e.g., 3XL defined
  // in group but this product only has S, M, L). Here we filter out non-existent options
  // so customers cannot select impossible variant combinations.
  const optionGroups = useMemo(() => {
    if (!product.optionGroups || product.optionGroups.length === 0) {
      return []
    }

    return product.optionGroups.map((group) => {
      const rawOptions =
        group.options ||
        group.values?.map((v) => ({ code: v, name: v })) ||
        []

      // Find all option names that actually appear in variants for this group
      const availableOptionNames = new Set(
        variants.flatMap((v) =>
          v.options
            .filter((opt) => {
              const optGroupName = (opt.group?.name || opt.group?.code || "").toLowerCase()
              const targetGroup = group.name.toLowerCase()
              const targetCode = (group.code || "").toLowerCase()

              return (
                optGroupName === targetGroup ||
                optGroupName === targetCode ||
                optGroupName.includes(targetGroup) ||
                targetGroup.includes(optGroupName)
              )
            })
            .map((opt) => opt.name.toLowerCase())
        )
      )

      // Only keep options that exist in active variants (e.g. only White & Black for T-Shirt)
      const validOptions =
        availableOptionNames.size > 0
          ? rawOptions.filter((opt) =>
              availableOptionNames.has(opt.name.toLowerCase())
            )
          : rawOptions

      return {
        ...group,
        options: validOptions,
      }
    }).filter((g) => g.options.length > 0)
  }, [product.optionGroups, variants])

  // 2. Selection state per option group
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const og of optionGroups) {
      const firstOpt = og.options[0]?.name || ""
      if (firstOpt) {
        initial[og.name] = firstOpt
      }
    }
    return initial
  })

  // Optional Material & Print Method selections (only shown if configured on product)
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    product.materials?.[0] || ""
  )
  const [selectedMethod, setSelectedMethod] = useState<string>(
    product.printMethods?.[0] || ""
  )
  const [quantity, setQuantity] = useState<number>(1)

  // 3. Resolve active variant based on user option selections
  const currentVariant = useMemo<ProductVariant | null>(() => {
    if (variants.length === 0) return null

    const matched = variants.find((variant) => {
      return Object.entries(selectedOptions).every(([groupName, selectedVal]) => {
        return variant.options.some((opt) => {
          const groupCode = opt.group?.code?.toLowerCase() || ""
          const groupLabel = opt.group?.name?.toLowerCase() || ""
          const targetGroup = groupName.toLowerCase()

          const isGroupMatch =
            groupCode === targetGroup ||
            groupLabel === targetGroup ||
            groupLabel.includes(targetGroup) ||
            targetGroup.includes(groupLabel)

          const isValMatch = opt.name.toLowerCase() === selectedVal.toLowerCase()
          return isGroupMatch && isValMatch
        })
      })
    })

    return matched || variants[0]
  }, [variants, selectedOptions])

  const activeImage = useStore(activeVariantImageStore)

  // 4. Active image resolves to variant asset first, then falls back to product asset
  const displayImage =
    currentVariant?.featuredAsset?.preview || product.featuredAsset?.preview

  useEffect(() => {
    if (displayImage) {
      activeVariantImageStore.set(displayImage)
    }
  }, [displayImage])

  // When a thumbnail is clicked in ProductGallery, sync options if matching a variant image
  useEffect(() => {
    if (activeImage) {
      const matchVariant = variants.find(
        (v) => v.featuredAsset?.preview === activeImage
      )
      if (matchVariant) {
        setSelectedOptions((prev) => {
          const next = { ...prev }
          let changed = false
          for (const opt of matchVariant.options) {
            const groupName = opt.group?.name || opt.group?.code
            if (groupName && next[groupName] !== opt.name) {
              next[groupName] = opt.name
              changed = true
            }
          }
          return changed ? next : prev
        })
      }
    }
  }, [activeImage, variants])

  // 5. Calculate price based on the resolved variant
  const unitPrice = useMemo(() => {
    if (currentVariant?.priceWithTax) {
      return Math.round(currentVariant.priceWithTax)
    }
    if (currentVariant?.price) {
      return Math.round(currentVariant.price / 100)
    }
    return Math.round(product.startingPriceNumber || 199)
  }, [currentVariant, product.startingPriceNumber])

  const subtotal = unitPrice * quantity

  // 6. Formatted WhatsApp inquiry message with clean variant details
  const whatsappUrl = useMemo(() => {
    const optionsSummary = Object.entries(selectedOptions)
      .map(([group, val]) => `${group}: ${val}`)
      .join("\n")

    const text = encodeURIComponent(
      `Hi RS Prints, I'd like to place an order:\n` +
      `Product: ${product.title}\n` +
      (currentVariant ? `Variant: ${currentVariant.name}\n` : "") +
      (optionsSummary ? `${optionsSummary}\n` : "") +
      (selectedMaterial ? `Material: ${selectedMaterial}\n` : "") +
      (selectedMethod ? `Print Method: ${selectedMethod}\n` : "") +
      `Quantity: ${quantity}\n` +
      `Unit Price: ₹${unitPrice}\n` +
      `Total: ₹${subtotal.toLocaleString("en-IN")}\n\n` +
      `Please confirm proof approval & dispatch timelines.`
    )
    return `https://wa.me/919876543210?text=${text}`
  }, [product.title, currentVariant, selectedOptions, selectedMaterial, selectedMethod, quantity, unitPrice, subtotal])

  const handleOptionChange = (groupName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupName]: value,
    }))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Product Title & Metadata */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {product.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Min Order: <strong className="text-foreground">{product.minOrder}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5 text-primary" />
            <span>Dispatches in {product.turnaround}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
          {product.title}
        </h1>

        {product.description && (
          <div
            className="text-sm md:text-base text-muted-foreground leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}
      </div>

      <Separator />

      {/* Dynamic Option Groups (Rendered cleanly per group from Vendure) */}
      {optionGroups.map((group) => {
        const groupOptions = group.options
        if (groupOptions.length === 0) return null

        const groupNameLower = group.name.toLowerCase()
        const isColorGroup = groupNameLower.includes("color")
        const isSizeGroup = groupNameLower.includes("size")
        const activeValue = selectedOptions[group.name] || groupOptions[0]?.name

        return (
          <div key={group.name} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {group.name}
              </Label>
              <span className="text-xs font-semibold text-foreground">
                {activeValue}
              </span>
            </div>

            {/* COLOR GROUP: Clean color swatches with circle indicator */}
            {isColorGroup ? (
              <div className="flex flex-wrap gap-2.5">
                {groupOptions.map((opt) => {
                  const isSelected = activeValue.toLowerCase() === opt.name.toLowerCase()
                  const hex = getColorHex(opt.name)

                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => handleOptionChange(group.name, opt.name)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/30 shadow-xs"
                          : "border-border/80 bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      }`}
                    >
                      <span
                        className="size-4 rounded-full border border-black/20 shrink-0 shadow-xs"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="capitalize">{opt.name}</span>
                      {isSelected && <CheckIcon className="size-3 text-primary ml-0.5" />}
                    </button>
                  )
                })}
              </div>
            ) : isSizeGroup ? (
              /* SIZE GROUP: Clean segmented button row */
              <div className="flex flex-wrap gap-2">
                {groupOptions.map((opt) => {
                  const isSelected = activeValue.toLowerCase() === opt.name.toLowerCase()
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => handleOptionChange(group.name, opt.name)}
                      className={`min-w-11 px-3.5 py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/80 bg-card text-foreground hover:border-foreground/40"
                      }`}
                    >
                      {opt.name}
                    </button>
                  )
                })}
              </div>
            ) : (
              /* ANY OTHER GROUP (e.g. Model, Finish, Capacity): Distinct chips */
              <div className="flex flex-wrap gap-2">
                {groupOptions.map((opt) => {
                  const isSelected = activeValue.toLowerCase() === opt.name.toLowerCase()
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => handleOptionChange(group.name, opt.name)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/30 shadow-xs"
                          : "border-border/80 bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      }`}
                    >
                      {opt.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Material Selection: ONLY shown if product actually has materials */}
      {product.materials && product.materials.length > 0 && (
        <div className="space-y-2.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Material / Fabric
          </Label>
          <div className="flex flex-wrap gap-2">
            {product.materials.map((mat) => {
              const isSelected = selectedMaterial === mat
              return (
                <button
                  key={mat}
                  type="button"
                  onClick={() => setSelectedMaterial(mat)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                      : "border-border/80 bg-background text-muted-foreground hover:border-foreground/40"
                  }`}
                >
                  {mat}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Print Methods: ONLY shown if product actually has print methods */}
      {product.printMethods && product.printMethods.length > 0 && (
        <div className="space-y-2.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Print Method
          </Label>
          <RadioGroup
            value={selectedMethod}
            onValueChange={(val) => {
              if (val) setSelectedMethod(val as string)
            }}
          >
            {product.printMethods.map((pm) => (
              <div key={pm} className="flex items-center gap-2">
                <RadioGroupItem value={pm} id={`pm-${pm}`} />
                <Label htmlFor={`pm-${pm}`} className="text-xs font-normal cursor-pointer">
                  {pm}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      <Separator />

      {/* Quantity & Dynamic Price Side-by-Side */}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="space-y-2 flex-1 min-w-[160px] max-w-xs">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Quantity Required
          </Label>
          <Select
            value={String(quantity)}
            onValueChange={(val) => {
              if (val) setQuantity(Number(val))
            }}
            itemToStringLabel={(val) => `${val} ${val === "1" ? "Piece" : "Pieces"}`}
          >
            <SelectTrigger size="sm" className="w-full py-4.5">
              <SelectValue placeholder="Select quantity" />
            </SelectTrigger>
            <SelectContent className="p-2">
              {QUANTITY_OPTIONS.map((qty) => (
                <SelectItem key={qty} value={String(qty)}>
                  {qty} {qty === 1 ? "Piece" : "Pieces"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Price directly resolving to active variant */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Price
          </span>
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            ₹{subtotal.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>(₹{unitPrice} / piece)</span>
            {currentVariant?.stockLevel && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                {currentVariant.stockLevel}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button size="lg" className="w-full gap-2 h-13 text-sm font-semibold">
            <UploadIcon className="size-4" />
            Upload Artwork & Order via WhatsApp
          </Button>
        </a>

        <a href="/contact" className="w-full">
          <Button variant="outline" size="lg" className="w-full gap-2 text-sm">
            <SendIcon className="size-4" />
            Request Bulk Quote / Pantone Matching
          </Button>
        </a>
      </div>
    </div>
  )
}
