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
  CheckIcon,
  ShoppingBag,
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Toaster } from "@/components/ui/toast"
import { addToCart } from "@/stores/cart"

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

  // Helper: Case-insensitive fuzzy group name matcher
  const isMatchingGroup = (groupCandidate: string, targetGroup: string): boolean => {
    const g1 = groupCandidate.trim().toLowerCase()
    const g2 = targetGroup.trim().toLowerCase()
    return g1 === g2 || g1.includes(g2) || g2.includes(g1)
  }

  // 2. Selection state per option group - initialized from first active variant to ensure valid combination
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}

    // First initialize from active variant[0] options if present
    if (variants.length > 0 && variants[0].options && variants[0].options.length > 0) {
      for (const opt of variants[0].options) {
        const groupName = opt.group?.name || opt.group?.code
        if (groupName) {
          const matchedGroup = optionGroups.find(
            (og) =>
              isMatchingGroup(og.name, groupName) ||
              isMatchingGroup(og.code || "", groupName)
          )
          const targetKey = matchedGroup?.name || groupName
          initial[targetKey] = opt.name
        }
      }
    }

    // Fill in any option group not covered by variants[0]
    for (const og of optionGroups) {
      if (!initial[og.name]) {
        const firstOpt = og.options[0]?.name || ""
        if (firstOpt) {
          initial[og.name] = firstOpt
        }
      }
    }
    return initial
  })

  // 2b. Compatibility helper: checks if optionName in groupName is available
  // given currently selected options in all other groups.
  const checkOptionAvailability = (
    groupName: string,
    optionName: string,
    currentSelections: Record<string, string>
  ): boolean => {
    if (variants.length === 0) return true

    return variants.some((variant) => {
      // 1. Variant must contain optionName in groupName
      const hasTargetOption = variant.options.some((opt) => {
        const gName = opt.group?.name || opt.group?.code || ""
        return (
          isMatchingGroup(gName, groupName) &&
          opt.name.toLowerCase() === optionName.toLowerCase()
        )
      })
      if (!hasTargetOption) return false

      // 2. Variant must also satisfy all other currently selected groups
      return Object.entries(currentSelections).every(
        ([otherGroup, selectedVal]) => {
          if (otherGroup.toLowerCase() === groupName.toLowerCase()) return true

          return variant.options.some((opt) => {
            const gName = opt.group?.name || opt.group?.code || ""
            return (
              isMatchingGroup(gName, otherGroup) &&
              opt.name.toLowerCase() === selectedVal.toLowerCase()
            )
          })
        }
      )
    })
  }

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

  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleAddToCart = async () => {
    if (!currentVariant?.id) return
    setIsAddingToCart(true)
    try {
      const variantDetails = Object.entries(selectedOptions)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")

      await addToCart(currentVariant.id, quantity, {
        productName: product.title,
        variantDetails: variantDetails || undefined,
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

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
    setSelectedOptions((prev) => {
      const next: Record<string, string> = {
        ...prev,
        [groupName]: value,
      }

      // Check if any other option group became invalid with this new selection
      for (const group of optionGroups) {
        if (group.name.toLowerCase() === groupName.toLowerCase()) continue

        const currentVal = next[group.name]
        if (!currentVal) continue

        // Check if currentVal is still available given new selections
        const isStillValid = checkOptionAvailability(group.name, currentVal, next)
        if (!isStillValid) {
          // Auto-reconcile to the first available option in this group
          const firstAvailable = group.options.find((opt) =>
            checkOptionAvailability(group.name, opt.name, next)
          )
          if (firstAvailable) {
            next[group.name] = firstAvailable.name
          }
        }
      }

      return next
    })
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
                  const isAvailable = checkOptionAvailability(group.name, opt.name, selectedOptions)
                  const hex = getColorHex(opt.name)

                  return (
                    <button
                      key={opt.name}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => isAvailable && handleOptionChange(group.name, opt.name)}
                      title={!isAvailable ? `${opt.name} (Unavailable with current selections)` : opt.name}
                      className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                        !isAvailable
                          ? "opacity-40 cursor-not-allowed border-dashed border-border/60 bg-muted/20 text-muted-foreground/50"
                          : isSelected
                          ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/30 shadow-xs cursor-pointer"
                          : "border-border/80 bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground cursor-pointer"
                      }`}
                    >
                      <span
                        className="relative size-4 rounded-full border border-black/20 shrink-0 shadow-xs overflow-hidden"
                        style={{ backgroundColor: hex }}
                      >
                        {!isAvailable && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-full h-0.5 bg-destructive rotate-45 transform" />
                          </span>
                        )}
                      </span>
                      <span className={`capitalize ${!isAvailable ? "line-through text-muted-foreground/60" : ""}`}>
                        {opt.name}
                      </span>
                      {isSelected && isAvailable && <CheckIcon className="size-3 text-primary ml-0.5" />}
                    </button>
                  )
                })}
              </div>
            ) : isSizeGroup ? (
              /* SIZE GROUP: Clean segmented button row */
              <div className="flex flex-wrap gap-2">
                {groupOptions.map((opt) => {
                  const isSelected = activeValue.toLowerCase() === opt.name.toLowerCase()
                  const isAvailable = checkOptionAvailability(group.name, opt.name, selectedOptions)

                  return (
                    <button
                      key={opt.name}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => isAvailable && handleOptionChange(group.name, opt.name)}
                      title={!isAvailable ? `${opt.name} (Unavailable with current selections)` : opt.name}
                      className={`relative min-w-11 px-3.5 py-2 rounded-xl border text-xs font-bold uppercase transition-all overflow-hidden ${
                        !isAvailable
                          ? "opacity-40 cursor-not-allowed border-dashed border-border/60 bg-muted/20 text-muted-foreground/50 line-through"
                          : isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-xs cursor-pointer"
                          : "border-border/80 bg-card text-foreground hover:border-foreground/40 cursor-pointer"
                      }`}
                    >
                      <span>{opt.name}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              /* ANY OTHER GROUP (e.g. Material, Finish, Capacity): Distinct chips */
              <div className="flex flex-wrap gap-2">
                {groupOptions.map((opt) => {
                  const isSelected = activeValue.toLowerCase() === opt.name.toLowerCase()
                  const isAvailable = checkOptionAvailability(group.name, opt.name, selectedOptions)

                  return (
                    <button
                      key={opt.name}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => isAvailable && handleOptionChange(group.name, opt.name)}
                      title={!isAvailable ? `${opt.name} (Unavailable with current selections)` : opt.name}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                        !isAvailable
                          ? "opacity-40 cursor-not-allowed border-dashed border-border/60 bg-muted/20 text-muted-foreground/50 line-through"
                          : isSelected
                          ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/30 shadow-xs cursor-pointer"
                          : "border-border/80 bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground cursor-pointer"
                      }`}
                    >
                      <span>{opt.name}</span>
                      {!isAvailable && (
                        <span className="text-[10px] text-muted-foreground/70 font-normal no-underline ml-0.5">
                          (Unavailable)
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Material Selection: ONLY shown if product has legacy materials array and no Material OptionGroup */}
      {product.materials &&
        product.materials.length > 0 &&
        !optionGroups.some((og) => og.name.toLowerCase().includes("material")) && (
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
        {/* Primary Add to Cart Button */}
        <Button
          size="lg"
          className="w-full gap-2.5 h-13 text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer"
          disabled={isAddingToCart || currentVariant?.stockLevel === "OUT_OF_STOCK"}
          onClick={handleAddToCart}
        >
          {isAddingToCart ? (
            <>
              <Spinner className="size-4" />
              <span>Adding to Cart...</span>
            </>
          ) : (
            <>
              <ShoppingBag className="size-4.5" />
              <span>
                Add to Cart • ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </>
          )}
        </Button>

        {/* Secondary: WhatsApp Consultation & Bulk Quote Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 h-11 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <UploadIcon className="size-3.5" />
              Order via WhatsApp
            </Button>
          </a>

          <a href="/contact" className="w-full">
            <Button variant="outline" size="lg" className="w-full gap-2 h-11 text-xs font-semibold">
              <SendIcon className="size-3.5" />
              Request Bulk Quote
            </Button>
          </a>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
