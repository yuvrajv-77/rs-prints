"use client";

import React, { useEffect, useState } from "react";
import { getOrderByCode } from "@/lib/vendure/queries/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import {
  CheckCircle2,
  Package,
  Truck,
  Copy,
  Printer,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Clock,
  Calendar,
  MapPin,
  CreditCard,
  Banknote,
  Sparkles,
} from "lucide-react";

interface OrderSuccessProps {
  orderCode?: string;
}

function formatRupees(amountInPaise?: number | null): string {
  if (typeof amountInPaise !== "number") return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amountInPaise / 100));
}

export default function OrderSuccessView({ orderCode: propCode }: OrderSuccessProps) {
  const [code, setCode] = useState<string>(propCode || "");
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Read from window location if prop not supplied
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const queryCode = urlParams.get("code") || propCode || "";
      setCode(queryCode);

      if (queryCode) {
        getOrderByCode(queryCode)
          .then((res) => {
            setOrder(res);
          })
          .catch((err) => {
            console.error("Failed to load order confirmation details:", err);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, [propCode]);

  function handleCopyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.add({
      title: "Order Code Copied",
      description: `${code} copied to clipboard.`,
      type: "info",
    });
    setTimeout(() => setCopied(false), 2500);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Spinner className="size-10 text-primary mb-4" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading order confirmation receipt...
        </p>
      </div>
    );
  }

  const shippingAddress = order?.shippingAddress;
  const payments = order?.payments || [];
  const primaryPayment = payments[0];
  const isCod = primaryPayment?.method === "cash-on-delivery" || !primaryPayment;
  const lines = order?.lines || [];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      {/* Celebration Header */}
      <div className="text-center space-y-4 mb-10">
        <div className="relative mx-auto flex size-20 sm:size-24 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 ring-8 ring-emerald-500/5">
          <CheckCircle2 className="size-10 sm:size-12 stroke-[2.2]" />
          <div className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-white text-xs shadow-md">
            <Sparkles className="size-3.5 fill-current" />
          </div>
        </div>

        <div>
          <Badge
            variant="secondary"
            className="mb-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-3 py-1"
          >
            Payment & Order Confirmed
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
            Thank You for Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-2">
            Your customized print order has been received and queued into our production pipeline.
          </p>
        </div>

        {/* Order Code Banner */}
        {code && (
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-card border shadow-2xs">
            <span className="text-xs text-muted-foreground font-medium">Order Reference:</span>
            <span className="font-mono text-sm sm:text-base font-bold text-foreground">
              {code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy Order Code"
            >
              <Copy className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Production & Delivery Progress Timeline */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs mb-8">
        <h2 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <span>Fulfillment Status</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative">
          {/* Step 1: Placed */}
          <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
            <div className="size-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Order Placed</div>
              <div className="text-[11px] text-muted-foreground">Payment verified</div>
            </div>
          </div>

          {/* Step 2: In Production */}
          <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
            <div className="size-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <Package className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-primary">In Production</div>
              <div className="text-[11px] text-muted-foreground">Print calibration</div>
            </div>
          </div>

          {/* Step 3: Dispatched */}
          <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 opacity-60">
            <div className="size-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <Truck className="size-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">Shipped</div>
              <div className="text-[11px] text-muted-foreground">Courier handover</div>
            </div>
          </div>

          {/* Step 4: Delivered */}
          <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 opacity-60">
            <div className="size-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">Delivered</div>
              <div className="text-[11px] text-muted-foreground">At your doorstep</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Summary: Items Breakdown & Delivery Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* Left: Ordered Items */}
        <div className="md:col-span-7 rounded-2xl border bg-card p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b pb-3 flex items-center justify-between">
            <span>Ordered Items ({lines.length})</span>
            {order?.totalQuantity && (
              <Badge variant="outline" className="text-xs font-normal">
                {order.totalQuantity} items total
              </Badge>
            )}
          </h3>

          <div className="divide-y divide-border/40">
            {lines.map((line: any) => {
              const variant = line.productVariant;
              const imageUrl =
                line.featuredAsset?.preview ||
                variant?.featuredAsset?.preview ||
                variant?.product?.featuredAsset?.preview ||
                "/placeholder-product.png";

              return (
                <div key={line.id} className="flex items-center gap-4 py-3 first:pt-0">
                  <div className="size-14 rounded-xl border bg-muted/30 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt={variant?.name || "Product"}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                      {variant?.product?.name || variant?.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Qty: {line.quantity} × {formatRupees(line.unitPriceWithTax)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-foreground">
                      {formatRupees(line.linePriceWithTax)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Pricing breakdown */}
          <div className="space-y-2 text-xs pt-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Items Subtotal</span>
              <span className="font-semibold text-foreground">
                {formatRupees(order?.subTotalWithTax)}
              </span>
            </div>

            {order?.discounts && order.discounts.length > 0 && (
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Discount Applied</span>
                <span>
                  -{formatRupees(order.discounts.reduce((a: number, d: any) => a + d.amountWithTax, 0))}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-muted-foreground">
              <span>Shipping Fee</span>
              <span className="font-semibold text-foreground">
                {order?.shippingWithTax === 0 ? "FREE" : formatRupees(order?.shippingWithTax)}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm font-bold text-foreground pt-1">
              <span>Total Paid</span>
              <span className="text-lg text-primary">{formatRupees(order?.totalWithTax)}</span>
            </div>
          </div>
        </div>

        {/* Right: Shipping & Payment Meta */}
        <div className="md:col-span-5 space-y-6">
          {/* Shipping Address */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MapPin className="size-3.5 text-primary" />
              <span>Delivery Destination</span>
            </h3>

            {shippingAddress ? (
              <div className="text-xs text-foreground space-y-1">
                <div className="font-bold text-sm text-foreground">{shippingAddress.fullName}</div>
                <div className="text-muted-foreground">{shippingAddress.streetLine1}</div>
                {shippingAddress.streetLine2 && (
                  <div className="text-muted-foreground">{shippingAddress.streetLine2}</div>
                )}
                <div className="text-muted-foreground">
                  {shippingAddress.city}, {shippingAddress.province} - {shippingAddress.postalCode}
                </div>
                {shippingAddress.phoneNumber && (
                  <div className="text-muted-foreground pt-1 font-mono">
                    Phone: +91 {shippingAddress.phoneNumber}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Address provided at checkout will receive courier tracking via SMS.
              </div>
            )}
          </div>

          {/* Payment Method Details */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CreditCard className="size-3.5 text-primary" />
              <span>Payment Details</span>
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isCod ? (
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    <Banknote className="size-4" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CreditCard className="size-4" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {isCod ? "Cash on Delivery" : "Razorpay Online (UPI/Cards)"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {isCod ? "Pay upon receipt" : "Paid & Verified Instantly"}
                  </div>
                </div>
              </div>

              <Badge
                variant="secondary"
                className={`text-[10px] font-semibold ${
                  isCod
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {isCod ? "Pending Delivery" : "Settled"}
              </Badge>
            </div>
          </div>

          {/* WhatsApp Support CTA */}
          <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-background to-emerald-500/5 p-5 shadow-xs border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <MessageCircle className="size-4" />
              <span>Get WhatsApp Updates</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Have questions about your custom artwork preview or delivery timeline? Our support team is ready to assist on WhatsApp.
            </p>
            <a
              href={`https://wa.me/919876543210?text=${encodeURIComponent(
                `Hi RS Prints team! I recently placed order #${code || ""}. Could you give me an update on its production status?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <MessageCircle className="size-3.5 fill-current" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer Navigation Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 cursor-pointer text-xs"
          onClick={() => window.print()}
        >
          <Printer className="size-3.5" />
          <span>Print Receipt</span>
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 cursor-pointer text-xs"
            onClick={() => (window.location.href = "/account/orders")}
          >
            <span>View All Orders</span>
          </Button>
          <Button
            size="sm"
            className="gap-2 cursor-pointer text-xs font-semibold"
            onClick={() => (window.location.href = "/products")}
          >
            <ShoppingBag className="size-3.5" />
            <span>Continue Shopping</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
