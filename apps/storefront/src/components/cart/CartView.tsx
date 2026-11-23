"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  $cart,
  $cartCount,
  fetchActiveOrder,
  updateLineQuantity,
  removeLineItem,
  type ActiveOrderLine,
} from "@/stores/cart";
import { $currentUser, fetchCurrentUser } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Toaster } from "@/components/ui/toast";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  FileText,
  MessageCircle,
  Tag,
  CheckCircle2,
  HelpCircle,
  Package,
  Truck,
  UserPlus,
  User,
} from "lucide-react";

/**
 * Format integer paise into Indian Rupee format (₹)
 */
function formatRupees(amountInPaise: number | unknown): string {
  const num = typeof amountInPaise === "number" ? amountInPaise : 0;
  const rupees = Math.round(num / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export default function CartView() {
  const cartState = useStore($cart);
  const cartCount = useStore($cartCount);
  const { customer, initialized: authInitialized } = useStore($currentUser);

  const [updatingLineId, setUpdatingLineId] = useState<string | null>(null);

  useEffect(() => {
    if (!cartState.initialized) {
      fetchActiveOrder();
    }
  }, [cartState.initialized]);

  useEffect(() => {
    if (!authInitialized) {
      fetchCurrentUser();
    }
  }, [authInitialized]);

  const handleUpdateQty = async (lineId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    setUpdatingLineId(lineId);
    try {
      await updateLineQuantity(lineId, newQty);
    } finally {
      setUpdatingLineId(null);
    }
  };

  const handleRemove = async (lineId: string) => {
    setUpdatingLineId(lineId);
    try {
      await removeLineItem(lineId);
    } finally {
      setUpdatingLineId(null);
    }
  };

  // 1. Initial Loading Skeleton
  if (!cartState.initialized || (cartState.loading && !cartState.order)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="h-6 w-48 mb-6">
          <Skeleton className="h-4 w-36 rounded-md" />
        </div>
        <div className="h-10 w-64 mb-8">
          <Skeleton className="h-8 w-56 rounded-md" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4 p-5 rounded-2xl border bg-card">
                <Skeleton className="size-24 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/3 rounded-md" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-8 w-28 rounded-lg" />
                    <Skeleton className="h-6 w-20 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <div className="p-6 rounded-2xl border bg-card space-y-4">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Separator />
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const order = cartState.order;
  const lines: ActiveOrderLine[] = order?.lines ?? [];

  // 2. Empty Cart State
  if (!order || cartCount === 0 || lines.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
        {/* Breadcrumb Navigation */}
        <div className="flex justify-center mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Shopping Cart</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border border-dashed border-border/70 bg-card/50 shadow-xs  mx-auto">
          <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner">
            <ShoppingBag className="size-9" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-2">
            Your Shopping Bag is Empty
          </h1>

          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
            You haven't added any customized printed merchandise to your bag yet. Explore our curated collections to start personalizing.
          </p>

          {/* Action Buttons: Explore Products, Track Package, Sign Up */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full mb-6">
            <a href="/categories" className="flex-1">
              <Button size="lg" className="w-full h-11 sm:h-12 px-5 gap-2 font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all">
                <ShoppingBag className="size-4 shrink-0" />
                <span>Explore Categories</span>
                <ArrowRight className="size-4 shrink-0" />
              </Button>
            </a>

            <a href="/account/orders" className="flex-1">
              <Button size="lg" variant="outline" className="w-full h-11 sm:h-12 px-4 gap-2 font-semibold border-border/80 hover:bg-muted/70 hover:border-primary/40 transition-all">
                <Truck className="size-4 text-primary shrink-0" />
                <span>Track Package</span>
              </Button>
            </a>

            {customer ? (
              <a href="/account/profile" className="flex-1 sm:flex-none">
                <Button size="lg" variant="outline" className="w-full h-11 sm:h-12 px-4 gap-2 font-semibold border-border/80 hover:bg-muted/70 hover:border-primary/40 transition-all">
                  <User className="size-4 text-primary shrink-0" />
                  <span>My Account</span>
                </Button>
              </a>
            ) : (
              <a href="/auth?tab=signup" className="flex-1 sm:flex-none">
                <Button size="lg" variant="outline" className="w-full h-11 sm:h-12 px-4 gap-2 font-semibold border-border/80 hover:bg-muted/70 hover:border-primary/40 transition-all">
                  <UserPlus className="size-4 text-primary shrink-0" />
                  <span>Sign Up</span>
                </Button>
              </a>
            )}
          </div>

      
        </div>

    

        <Toaster />
      </div>
    );
  }

  // 3. Populated Cart View
  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Shopping Cart</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header Title with Item Badge */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Shopping Cart
            </h1>
            <Badge variant="secondary" className="text-xs font-bold px-2.5 py-0.5">
              {cartCount} {cartCount === 1 ? "Piece" : "Pieces"}
            </Badge>
          </div>

          <a
            href="/categories"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="size-3.5" />
          </a>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {lines.map((line) => {
              const variant = line.productVariant;
              const product = variant.product;
              const productUrl = product?.slug ? `/products/${product.slug}` : "/products";
              const isLineUpdating = updatingLineId === line.id;
              const imageUrl =
                line.featuredAsset?.preview ||
                variant.featuredAsset?.preview ||
                product?.featuredAsset?.preview ||
                "/placeholder-product.png";

              const options = variant.options || [];

              return (
                <div
                  key={line.id}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl border bg-card text-card-foreground shadow-xs transition-all hover:border-border"
                >
                  {/* Product Thumbnail */}
                  <a
                    href={productUrl}
                    className="relative size-24 sm:size-28 rounded-xl overflow-hidden bg-muted/30 border shrink-0 flex items-center justify-center hover:opacity-85 transition-opacity"
                    title={`View ${product?.name || variant.name}`}
                  >
                    <img
                      src={imageUrl}
                      alt={product?.name || variant.name}
                      className="size-full object-cover object-center"
                      loading="lazy"
                    />
                  </a>

                  {/* Line Details */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <a
                            href={productUrl}
                            className="font-bold text-base sm:text-lg text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {product?.name || variant.name}
                          </a>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            SKU: {variant.sku}
                          </p>
                        </div>

                        {/* Remove Action Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove item"
                          disabled={isLineUpdating}
                          onClick={() => handleRemove(line.id)}
                          className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 cursor-pointer"
                        >
                          {isLineUpdating ? (
                            <Spinner className="size-3.5" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>

                      {/* Selected Options / Variant Badges */}
                      {options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {options.map((opt) => (
                            <Badge
                              key={opt.id}
                              variant="outline"
                              className="text-[11px] font-medium px-2 py-0.5 bg-muted/40"
                            >
                              <span className="text-muted-foreground mr-1">
                                {opt.group?.name || opt.group?.code}:
                              </span>
                              <span>{opt.name}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quantity Stepper & Price Row */}
                    <div className="flex items-end justify-between gap-4 mt-4 pt-3 border-t border-border/40">
                      {/* Quantity Controls Stepper */}
                      <div className="flex items-center gap-1 border border-border/80 rounded-xl p-0.5 bg-muted/20">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLineUpdating || line.quantity <= 1}
                          onClick={() => handleUpdateQty(line.id, line.quantity, -1)}
                          className="size-7 rounded-lg text-foreground hover:bg-muted"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </Button>

                        <span className="w-9 text-center text-xs font-bold font-mono">
                          {isLineUpdating ? <Spinner className="size-3 mx-auto" /> : line.quantity}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLineUpdating}
                          onClick={() => handleUpdateQty(line.id, line.quantity, 1)}
                          className="size-7 rounded-lg text-foreground hover:bg-muted"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>

                      {/* Line Subtotal and Unit Price */}
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-extrabold text-foreground tracking-tight">
                          {formatRupees(line.linePriceWithTax)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          ({formatRupees(line.unitPriceWithTax)} / pc)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Reassurance Callout */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                All orders are inspected for color alignment and print fidelity before shipment.
              </span>
            </div>
          </div>

          {/* Right Column: Sticky Order Summary Card */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24 border shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-lg font-bold">Order Summary</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 pt-4 text-sm">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal ({cartCount} pieces)</span>
                  <span className="font-semibold text-foreground">
                    {formatRupees(order.subTotalWithTax)}
                  </span>
                </div>

                {/* Discounts (if any active) */}
                {order.discounts && order.discounts.length > 0 && (
                  <div className="space-y-1.5 py-1">
                    {order.discounts.map((disc, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Tag className="size-3.5" />
                          <span>{disc.description || "Discount Applied"}</span>
                        </span>
                        <span>-{formatRupees(disc.amountWithTax)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Taxes & GST */}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span>GST (Tax Included)</span>
                    <Tooltip>
                      <TooltipTrigger className="inline-flex items-center text-muted-foreground/80 hover:text-foreground cursor-pointer">
                        <HelpCircle className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>
                        All product prices already include 18% GST. Tax invoices are provided upon order confirmation.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Included
                  </span>
                </div>

                {/* Shipping */}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    Calculated at Checkout
                  </span>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-base font-bold text-foreground">Estimated Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-foreground tracking-tight">
                      {formatRupees(order.totalWithTax)}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      (Net Payable Amount)
                    </span>
                  </div>
                </div>

                {/* Proceed to Checkout CTA */}
                <Button
                  size="lg"
                  className="w-full h-12 text-sm font-semibold gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer mt-2"
                  onClick={() => {
                    if (authInitialized && !customer) {
                      window.location.href = "/auth?tab=signin&redirect=/checkout";
                    } else {
                      window.location.href = "/checkout";
                    }
                  }}
                >
                  <span>{customer ? "Proceed to Checkout" : "Sign In to Checkout"}</span>
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>

              {/* Trust Guarantees */}
              <CardFooter className="flex flex-col gap-2 pt-0 pb-4 text-[11px] text-muted-foreground border-t border-border/40 mt-3 pt-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-primary shrink-0" />
                  <span>256-Bit SSL Encrypted Secure Checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="size-3.5 text-primary shrink-0" />
                  <span>GST Compliant Invoicing Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-3.5 text-emerald-600 shrink-0" />
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-foreground/80"
                  >
                    Need bulk artwork assistance? WhatsApp Support
                  </a>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>

        <Toaster />
      </div>
    </TooltipProvider>
  );
}
