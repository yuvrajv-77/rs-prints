"use client"

import React, { useState, useMemo } from "react"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Toaster, toast } from "@/components/ui/toast"
import { PARENT_CATEGORIES, getAllProducts } from "@/data/products"
import brandConfig from "@/data/brandConfig.json"
import {
  Send,
  Building2,
  User,
  Phone,
  Mail,
  Package,
  Layers,
  Calendar,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
} from "lucide-react"

export default function BulkOrderForm() {
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [selectedTimeline, setSelectedTimeline] = useState<string>("Standard (5-7 business days)")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Catalog products for dynamic selection
  const allProducts = useMemo(() => getAllProducts(), [])

  // Filter products matching currently selected category
  const availableProducts = useMemo(() => {
    if (!selectedCategory) return []
    const parent = PARENT_CATEGORIES.find((c) => c.id === selectedCategory)
    if (!parent) return []

    // Gather slugs from parent's subcategories
    const allSlugs = parent.subcategories.flatMap((sub) => sub.slugs)
    return allProducts.filter((p) => allSlugs.includes(p.slug))
  }, [selectedCategory, allProducts])

  // Bulk discount tier calculation
  const getDiscountTier = (qty: number) => {
    if (qty >= 500) return { label: "45% Mega Bulk Discount", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" }
    if (qty >= 250) return { label: "35% Bulk Discount", color: "bg-primary/10 text-primary border-primary/30" }
    if (qty >= 100) return { label: "25% Volume Discount", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" }
    if (qty >= 40) return { label: "15% Tier-1 Discount", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" }
    return { label: "Min 40 units required", color: "bg-destructive/10 text-destructive border-destructive/30" }
  }

  // TanStack Form Setup
  const form = useForm({
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      companyName: "",
      category: "",
      product: "",
      customProduct: "",
      quantity: 50,
      timeline: "Standard (5-7 business days)",
      message: "",
    },
    onSubmit: async ({ value }) => {
      // Validate minimum quantity
      if (value.quantity < 40) {
        toast.add({
          title: "Minimum Quantity Not Met",
          description: "Bulk orders require a minimum of 40 units.",
          type: "error",
        })
        return
      }

      if (!value.category) {
        toast.add({
          title: "Category Required",
          description: "Please select a product category for your bulk order.",
          type: "error",
        })
        return
      }

      if (!value.product && !value.customProduct) {
        toast.add({
          title: "Product Required",
          description: "Please select or specify a product.",
          type: "error",
        })
        return
      }

      setIsSubmitting(true)

      try {
        // Resolve category title
        const catObj = PARENT_CATEGORIES.find((c) => c.id === value.category)
        const categoryTitle = catObj ? catObj.title : value.category

        // Resolve product title
        let productTitle = value.product
        if (value.product === "other" || !value.product) {
          productTitle = value.customProduct ? `Custom: ${value.customProduct}` : "Custom Specified Product"
        } else {
          const matchedProd = allProducts.find((p) => p.slug === value.product)
          if (matchedProd) productTitle = matchedProd.title
        }

        // WhatsApp number from config
        const whatsappNumber =  "917905146108"

        // Format professional WhatsApp message with clean markdown & universal emojis
        const messageLines = [
          "📦 *NEW BULK ORDER INQUIRY - RS PRINTS*",
          "----------------------------------------",
          "👤 *Client Details:*",
          `- *Name:* ${value.fullName.trim()}`,
          `- *Phone:* ${value.phone.trim()}`,
          `- *Email:* ${value.email.trim()}`,
          `- *Company:* ${value.companyName.trim() || "Individual / Not specified"}`,
          "",
          "📋 *Order Requirements:*",
          `- *Category:* ${categoryTitle}`,
          `- *Product:* ${productTitle}`,
          `- *Quantity:* ${value.quantity} units`,
          `- *Delivery Timeline:* ${value.timeline}`,
          "",
          "💬 *Customization & Printing Details:*",
          `${value.message.trim()}`,
          "----------------------------------------",
          "_Sent via RS Prints Bulk Order Portal (rsprints.in)_",
        ]

        const formattedText = messageLines.join("\n")
        // Use api.whatsapp.com/send directly to avoid wa.me 302 redirect header encoding corruption
        const waUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(formattedText)}`

        toast.add({
          title: "Opening WhatsApp...",
          description: "Your bulk inquiry has been formatted. Sending via WhatsApp.",
          type: "success",
        })

        // Give toast time to show, then open WhatsApp
        setTimeout(() => {
          window.open(waUrl, "_blank")
          setIsSubmitting(false)
        }, 300)
      } catch (err) {
        setIsSubmitting(false)
        toast.add({
          title: "Error Sending Request",
          description: "Something went wrong formatting your order. Please try again.",
          type: "error",
        })
      }
    },
  })

  return (
    <div className="w-full">
      <Toaster />

      <Card className="p-6 sm:p-8 md:p-10 border-border/80 shadow-md bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-8"
        >
          {/* ======================================================== */}
          {/* SECTION 1: CLIENT & COMPANY INFORMATION                 */}
          {/* ======================================================== */}
          <FieldSet>
            <FieldLegend className="text-lg font-bold text-foreground flex items-center gap-2">
              <User className="size-5 text-primary" />
              <span>Contact &amp; Business Information</span>
            </FieldLegend>
            <FieldDescription>
              We'll use these details to share your digital mockups, quotation, and dispatch updates.
            </FieldDescription>

            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Full Name */}
              <form.Field
                name="fullName"
                validators={{
                  onChange: ({ value }) =>
                    !value.trim() ? "Full name is required." : undefined,
                }}
              >
                {(field) => {
                  const error = field.state.meta.isTouched && field.state.meta.errors[0]
                  return (
                    <Field data-invalid={!!error}>
                      <FieldLabel htmlFor={field.name}>
                        Full Name <span className="text-destructive">*</span>
                      </FieldLabel>
                      <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                        <InputGroupAddon align="inline-start">
                          <User className="size-4 text-muted-foreground" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g. Vikram Sharma"
                          aria-invalid={!!error}
                        />
                      </InputGroup>
                      {error && <FieldError>{error}</FieldError>}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Phone Number */}
              <form.Field
                name="phone"
                validators={{
                  onChange: ({ value }) => {
                    const cleaned = value.replace(/\D/g, "")
                    if (!value.trim()) return "Phone / WhatsApp number is required."
                    if (cleaned.length < 10) return "Please enter a valid 10-digit mobile number."
                    return undefined
                  },
                }}
              >
                {(field) => {
                  const error = field.state.meta.isTouched && field.state.meta.errors[0]
                  return (
                    <Field data-invalid={!!error}>
                      <FieldLabel htmlFor={field.name}>
                        Phone / WhatsApp Number <span className="text-destructive">*</span>
                      </FieldLabel>
                      <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                        <InputGroupAddon align="inline-start">
                          <span className="text-xs font-mono font-medium text-muted-foreground">+91</span>
                        </InputGroupAddon>
                        <InputGroupInput
                          id={field.name}
                          name={field.name}
                          type="tel"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="98765 43210"
                          aria-invalid={!!error}
                          maxLength={10}
                          
                          inputMode="numeric"
                        />
                      </InputGroup>
                      {error && <FieldError>{error}</FieldError>}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Email Address */}
              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return "Email address is required."
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                      return "Please enter a valid email address (e.g. name@domain.com)."
                    }
                    return undefined
                  },
                }}
              >
                {(field) => {
                  const error = field.state.meta.isTouched && field.state.meta.errors[0]
                  return (
                    <Field data-invalid={!!error}>
                      <FieldLabel htmlFor={field.name}>
                        Email Address <span className="text-destructive">*</span>
                      </FieldLabel>
                      <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                        <InputGroupAddon align="inline-start">
                          <Mail className="size-4 text-muted-foreground" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="vikram@company.com"
                          aria-invalid={!!error}
                        />
                      </InputGroup>
                      {error && <FieldError>{error}</FieldError>}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Company / Brand Name (Optional) */}
              <form.Field name="companyName">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Company / Brand Name <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                    </FieldLabel>
                    <InputGroup className="h-10 rounded-xl bg-input/40 border border-border/80">
                      <InputGroupAddon align="inline-start">
                        <Building2 className="size-4 text-muted-foreground" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        type="text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Acme Tech / Studio 9"
                      />
                    </InputGroup>
                    <FieldDescription>For GST invoice &amp; corporate branding.</FieldDescription>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </FieldSet>

          {/* ======================================================== */}
          {/* SECTION 2: PRODUCT SELECTION & QUANTITY                 */}
          {/* ======================================================== */}
          <FieldSet>
            <FieldLegend className="text-lg font-bold text-foreground flex items-center gap-2 pt-2 border-t border-border/60">
              <Package className="size-5 text-primary" />
              <span>Order Specifications</span>
            </FieldLegend>
            <FieldDescription>
              Select your desired category, target product, and volume. Bulk discounts apply automatically.
            </FieldDescription>

            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Category Select */}
              <form.Field
                name="category"
                validators={{
                  onChange: ({ value }) => (!value ? "Please select a product category." : undefined),
                }}
              >
                {(field) => {
                  const error = field.state.meta.isTouched && field.state.meta.errors[0]
                  return (
                    <Field data-invalid={!!error}>
                      <FieldLabel htmlFor={field.name}>
                        Product Category <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(val) => {
                          const nextVal = val ?? ""
                          field.handleChange(nextVal)
                          setSelectedCategory(nextVal)
                          // Reset product selection on category change
                          form.setFieldValue("product", "")
                          setSelectedProduct("")
                        }}
                      >
                        <SelectTrigger className="w-full h-10 rounded-xl bg-input/40 border border-border/80">
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Catalog Categories</SelectLabel>
                            {PARENT_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.title}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {error && <FieldError>{error}</FieldError>}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Product Select (Dynamically Populated) */}
              <form.Field
                name="product"
                validators={{
                  onChange: ({ value }) => {
                    const custom = form.getFieldValue("customProduct")
                    if (!value && !custom) return "Please choose or specify a product."
                    return undefined
                  },
                }}
              >
                {(field) => {
                  const error = field.state.meta.isTouched && field.state.meta.errors[0]
                  return (
                    <Field data-invalid={!!error}>
                      <FieldLabel htmlFor={field.name}>
                        Product Selection <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(val) => {
                          const nextVal = val ?? ""
                          field.handleChange(nextVal)
                          setSelectedProduct(nextVal)
                        }}
                        disabled={!selectedCategory}
                      >
                        <SelectTrigger className="w-full h-10 rounded-xl bg-input/40 border border-border/80">
                          <SelectValue
                            placeholder={
                              selectedCategory
                                ? "Select specific product..."
                                : "Choose category first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Available Products</SelectLabel>
                            {availableProducts.map((p) => (
                              <SelectItem key={p.slug} value={p.slug}>
                                {p.title}
                              </SelectItem>
                            ))}
                            <SelectItem value="other">
                              Other / Custom Specification
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {error && <FieldError>{error}</FieldError>}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Custom Product Specification if 'other' is selected */}
              {selectedProduct === "other" && (
                <div className="md:col-span-2 animate-in fade-in duration-200">
                  <form.Field name="customProduct">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Specify Your Desired Custom Item <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g. 24oz Stainless Steel Tumbler with Matte Black Powder Coating"
                          className="h-10 rounded-xl bg-input/40 border border-border/80"
                        />
                      </Field>
                    )}
                  </form.Field>
                </div>
              )}

              {/* Quantity Field (MUST BE >= 40) */}
              <form.Field
                name="quantity"
                validators={{
                  onChange: ({ value }) => {
                    const num = Number(value)
                    if (isNaN(num) || num < 40) {
                      return "Bulk orders require a minimum of 40 units."
                    }
                    return undefined
                  },
                }}
              >
                {(field) => {
                  const error = field.state.meta.isTouched && field.state.meta.errors[0]
                  const tier = getDiscountTier(Number(field.state.value) || 0)
                  return (
                    <Field data-invalid={!!error}>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor={field.name}>
                          Quantity (Min. 40 units) <span className="text-destructive">*</span>
                        </FieldLabel>
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${tier.color}`}>
                          {tier.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-10 shrink-0 rounded-xl border border-border/80"
                          onClick={() => {
                            const current = Number(field.state.value) || 40
                            const next = Math.max(40, current - 10)
                            field.handleChange(next)
                          }}
                        >
                          <Minus className="size-4" />
                        </Button>

                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          min={40}
                          step={5}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                          aria-invalid={!!error}
                          className="h-10 rounded-xl bg-input/40 border border-border/80 text-center font-mono font-bold text-base"
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-10 shrink-0 rounded-xl border border-border/80"
                          onClick={() => {
                            const current = Number(field.state.value) || 40
                            field.handleChange(current + 10)
                          }}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>

                      {error ? (
                        <FieldError>{error}</FieldError>
                      ) : (
                        <FieldDescription>
                          Use -/+ buttons or enter any quantity of 40 or higher.
                        </FieldDescription>
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Delivery Timeline / Expected Date */}
              <form.Field name="timeline">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Desired Delivery Timeline</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => {
                        const nextVal = val ?? "Standard (5-7 business days)"
                        field.handleChange(nextVal)
                        setSelectedTimeline(nextVal)
                      }}
                    >
                      <SelectTrigger className="w-full h-10 rounded-xl bg-input/40 border border-border/80">
                        <SelectValue placeholder="Select timeline..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Options</SelectLabel>
                          <SelectItem value="Standard (5-7 business days)">
                            Standard (5-7 business days)
                          </SelectItem>
                          <SelectItem value="Urgent (2-3 business days)">
                            Urgent Express (2-3 business days)
                          </SelectItem>
                          <SelectItem value="Within 2-3 weeks">
                            Planned Event (2-3 weeks)
                          </SelectItem>
                          <SelectItem value="Flexible / Just inquiring">
                            Flexible / Planning stage
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>Fast express dispatch options available.</FieldDescription>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </FieldSet>

          {/* ======================================================== */}
          {/* SECTION 3: PRINTING DETAILS & CUSTOM MESSAGE            */}
          {/* ======================================================== */}
          <FieldSet>
            <FieldLegend className="text-lg font-bold text-foreground flex items-center gap-2 pt-2 border-t border-border/60">
              <MessageSquare className="size-5 text-primary" />
              <span>Customization Requirements &amp; Notes</span>
            </FieldLegend>
            <FieldDescription>
              Describe your logo placement, print style, size distributions (S/M/L/XL), or any special packaging needs.
            </FieldDescription>

            <FieldGroup className="pt-2">
              <form.Field
                name="message"
                validators={{
                  onChange: ({ value }) =>
                    !value.trim()
                      ? "Please provide brief details about your printing needs."
                      : value.trim().length < 10
                      ? "Please provide a little more detail (at least 10 characters)."
                      : undefined,
                }}
              >
                {(field) => {
                  const error = field.state.meta.isTouched && field.state.meta.errors[0]
                  return (
                    <Field data-invalid={!!error}>
                      <FieldLabel htmlFor={field.name}>
                        Project Specifications &amp; Instructions <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        rows={4}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. We need 100 black cotton round neck t-shirts with our company logo embroidered on the left chest and full color printed graphic on the back. Sizing: 25 M, 50 L, 25 XL. Need sample mockup before production."
                        aria-invalid={!!error}
                        className="rounded-xl bg-input/40 border border-border/80 p-3 min-h-28 text-sm"
                      />
                      {error && <FieldError>{error}</FieldError>}
                    </Field>
                  )
                }}
              </form.Field>
            </FieldGroup>
          </FieldSet>

          {/* Value Reminder Banner */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span>Includes Free Digital Mockup &amp; Priority Production Scheduling</span>
            </div>
            <div className="text-muted-foreground">
              WhatsApp Instant Quotation &bull; No Obligation
            </div>
          </div>

          {/* ======================================================== */}
          {/* SUBMIT BUTTON WITH WHATSAPP DISPATCH                    */}
          {/* ======================================================== */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl text-base font-semibold shadow-md flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-all hover:shadow-lg active:scale-[0.99]"
            >
              <Send className="size-4" />
              <span>{isSubmitting ? "Opening WhatsApp..." : "Send Bulk Inquiry on WhatsApp"}</span>
            </Button>
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              Clicking will format all inquiry details and open our official WhatsApp studio line (+91 98765 43210).
            </p>
          </div>
        </form>
      </Card>
    </div>
  )
}
