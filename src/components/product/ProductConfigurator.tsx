import { useState, useMemo } from "react"
import type { Product } from "@/types/product"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle
} from "@/components/ui/field"
import {
  SendIcon,
  PercentIcon,
  ClockIcon,
  UploadIcon
} from "lucide-react"

interface ProductConfiguratorProps {
  product: Product
}

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function ProductConfigurator({ product }: ProductConfiguratorProps) {
  // State for option selection
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0]?.name || "")
  const [selectedMaterial, setSelectedMaterial] = useState<string>(product.materials[0] || "")
  const [selectedOption, setSelectedOption] = useState<string>(product.options[0] || "")
  const [selectedMethod, setSelectedMethod] = useState<string>(product.printMethods[0] || "")
  const [quantity, setQuantity] = useState<number>(1)

  // Calculate active pricing tier
  const activeTier = useMemo(() => {
    if (!product.pricingTiers || product.pricingTiers.length === 0) {
      return null
    }
    const sorted = [...product.pricingTiers].sort((a, b) => b.minQty - a.minQty)
    return sorted.find((tier) => quantity >= tier.minQty) || sorted[sorted.length - 1]
  }, [product.pricingTiers, quantity])

  // Extract base numerical unit price
  const unitPrice = useMemo(() => {
    if (activeTier?.price) {
      const parsed = parseInt(activeTier.price.replace(/[^\d]/g, ""), 10)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    return product.startingPriceNumber || 299
  }, [activeTier, product.startingPriceNumber])

  const subtotal = unitPrice * quantity

  // Formatted WhatsApp order link
  const whatsappUrl = useMemo(() => {
    const text = encodeURIComponent(
      `Hi RS Prints, I'd like to order:\n` +
      `Product: ${product.title}\n` +
      `Quantity: ${quantity}\n` +
      (selectedColor ? `Color: ${selectedColor}\n` : "") +
      `Material: ${selectedMaterial || "Standard"}\n` +
      `Option/Size: ${selectedOption || "Default"}\n` +
      `Print Method: ${selectedMethod || "Standard"}\n` +
      `Total: ₹${subtotal.toLocaleString("en-IN")}\n` +
      `Please provide mockup approval details.`
    )
    return `https://wa.me/919876543210?text=${text}`
  }, [product.title, quantity, selectedColor, selectedMaterial, selectedOption, selectedMethod, subtotal])

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

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          {product.title}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {product.description || product.tagline}
        </p>

        {/* Specs in description style directly below description */}
        {((product.features && product.features.length > 0) || (product.specifications && product.specifications.length > 0)) && (
          <ul className="list-disc pl-4 space-y-1 text-xs md:text-sm text-foreground pt-1">
            {(product.features || product.specifications?.flatMap((g) => g.items).slice(0, 5).map((i) => `${i.label}: ${i.value}`) || []).map((feat, idx) => (
              <li key={idx} className="leading-relaxed">
                {feat}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator />

      {/* Material Selection using RadioGroup Choice Cards */}
      {product.materials.length > 0 && (
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Material / Fabric
          </Label>
          <RadioGroup
            value={selectedMaterial}
            onValueChange={(val) => {
              if (val) setSelectedMaterial(val as string)
            }}
          >
            {product.materials.map((mat) => (
              <FieldLabel key={mat} htmlFor={`mat-${mat}`} className="cursor-pointer">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle className="font-normal text-sm">{mat}</FieldTitle>
                  </FieldContent>
                  <RadioGroupItem value={mat} id={`mat-${mat}`} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Color Selection using ToggleGroup UI Component */}
      {product.colors && product.colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Color
            </Label>
            <span className="text-xs font-medium text-foreground">
              {selectedColor}
            </span>
          </div>
          <ToggleGroup
            variant="outline"
            value={[selectedColor]}
            onValueChange={(val) => {
              if (val && val.length > 0 && val[0]) setSelectedColor(val[0])
            }}
            className="flex-wrap"
          >
            {product.colors.map((c) => (
              <ToggleGroupItem key={c.name} value={c.name} className="gap-2">
                <span
                  className="size-4 rounded-full border border-black/15 shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <span>{c.name}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {/* Style / Size using ToggleGroup UI Component */}
      {product.options.length > 0 && (
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider  text-muted-foreground">
            Style / Size / Model
          </Label>
          <ToggleGroup
            variant="outline"
            value={[selectedOption]}
            onValueChange={(val) => {
              if (val && val.length > 0 && val[0]) setSelectedOption(val[0])
            }}
            className="flex-wrap"
          >
            {product.options.map((opt) => (
              <ToggleGroupItem key={opt} value={opt}>
                {opt}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {/* Print Methods using RadioGroup UI Component */}
      {product.printMethods.length > 0 && (
        <div className="space-y-3">
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
                <Label htmlFor={`pm-${pm}`} className="text-sm font-normal cursor-pointer">
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
        <div className="space-y-2 flex-1 min-w-[180px] max-w-xs">
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
            <SelectTrigger size="sm" className="w-full py-5">
              <SelectValue placeholder="Select quantity" />
            </SelectTrigger>
            <SelectContent className="p-4">
              {QUANTITY_OPTIONS.map((qty) => (
                <SelectItem key={qty} value={String(qty)}>
                  {qty} {qty === 1 ? "Piece" : "Pieces"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Bulk volume discounts auto-calculated
          </p>
        </div>

        {/* Dynamic Price right side of quantity */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Price
          </span>
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            ₹{subtotal.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {quantity > 1 ? (
              <span>(₹{unitPrice} / piece)</span>
            ) : (
              <span>/ piece</span>
            )}
            {activeTier?.discountPercent && activeTier.discountPercent !== "Standard" && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                <PercentIcon className="size-2.5 mr-0.5" />
                {activeTier.discountPercent}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button size="lg" className="w-full gap-2 h-14">
            <UploadIcon className="size-4" />
            Upload Your Image
          </Button>
        </a>

        <a href="/contact" className="w-full">
          <Button variant="outline" size="lg" className="w-full gap-2">
            <SendIcon className="size-4" />
            Send Inquiry / Custom Artwork
          </Button>
        </a>
      </div>
    </div>
  )
}
