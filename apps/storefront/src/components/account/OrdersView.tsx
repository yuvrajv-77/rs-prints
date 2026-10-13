"use client";

import React, { useEffect, useState } from "react";
import { getCustomerOrders } from "@/lib/vendure/queries/orders";
import { Package, Truck, CheckCircle2, Clock, ShoppingBag, ExternalLink, ArrowRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

interface VendureOrderItem {
  id: string;
  quantity: number;
  linePriceWithTax: number;
  productVariant: {
    id: string;
    name: string;
    sku: string;
    featuredAsset?: {
      preview: string;
    } | null;
  };
}

interface VendureOrder {
  id: string;
  code: string;
  state: string;
  orderPlacedAt?: string | null;
  totalQuantity: number;
  totalWithTax: number;
  lines: VendureOrderItem[];
}

function formatRupees(amountInPaise?: number | null): string {
  if (typeof amountInPaise !== "number") return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amountInPaise / 100));
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "Recent Order";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Recent Order";
  }
}

export default function OrdersView() {
  const [orders, setOrders] = useState<VendureOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<"all" | "processing" | "delivered">("all");

  useEffect(() => {
    getCustomerOrders()
      .then((data) => {
        setOrders(data as VendureOrder[]);
      })
      .catch((err) => {
        console.error("Failed to load customer orders:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getNormalizedStatus = (state: string): "processing" | "shipped" | "delivered" | "cancelled" => {
    switch (state.toLowerCase()) {
      case "shipped":
      case "partiallyshipped":
        return "shipped";
      case "delivered":
        return "delivered";
      case "cancelled":
        return "cancelled";
      default:
        return "processing";
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    const status = getNormalizedStatus(order.state);
    return status === filter;
  });

  const getStatusBadge = (state: string) => {
    const status = getNormalizedStatus(state);
    switch (status) {
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
            <Clock className="size-3.5" />
            Processing
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
            <Truck className="size-3.5" />
            Shipped
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="size-3.5" />
            Delivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {orderStateLabel(state)}
          </span>
        );
    }
  };

  const orderStateLabel = (state: string) => {
    if (state === "PaymentSettled") return "Confirmed";
    if (state === "ArrangingPayment") return "Awaiting Payment";
    return state;
  };

  if (loading) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center">
        <Spinner className="size-8 text-primary mb-3" />
        <p className="text-xs text-muted-foreground">Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Section Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-heading sm:font-sans">
            Order History
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track and review all your custom print orders placed with RS Prints.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200/60 dark:border-neutral-700 text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === "all"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilter("processing")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === "processing"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            Processing (
            {orders.filter((o) => getNormalizedStatus(o.state) === "processing").length}
            )
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === "delivered"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            Delivered (
            {orders.filter((o) => getNormalizedStatus(o.state) === "delivered").length}
            )
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mb-4">
            <Package className="size-7" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            No orders found
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
            You don't have any orders under this filter yet. Explore our customized printing collection to place your first order!
          </p>
          <a
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#f0643b] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#df562f] transition-all shadow-sm"
          >
            <ShoppingBag className="size-4" />
            Shop Now
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-sm"
            >
              {/* Order Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {order.code}
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs text-neutral-500">
                    {formatDate(order.orderPlacedAt)}
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs text-neutral-500">
                    {order.totalQuantity} {order.totalQuantity === 1 ? "item" : "items"}
                  </span>
                </div>
                <div>{getStatusBadge(order.state)}</div>
              </div>

              {/* Order Items */}
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 py-2">
                {order.lines.map((item) => {
                  const variant = item.productVariant;
                  const imageUrl = variant.featuredAsset?.preview || "/placeholder-product.png";

                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="size-14 rounded-xl border border-neutral-200/80 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={variant.name}
                            className="size-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                            {variant.name}
                          </h4>
                          <p className="text-xs text-neutral-500 font-mono">SKU: {variant.sku}</p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {formatRupees(item.linePriceWithTax)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">Total Amount:</span>
                  <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {formatRupees(order.totalWithTax)}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <a
                    href={`/checkout/success?code=${order.code}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-medium transition-colors"
                  >
                    <span>View Receipt & Tracking</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
