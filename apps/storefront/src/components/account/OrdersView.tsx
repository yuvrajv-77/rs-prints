"use client"

import React, { useState } from "react"
import { Package, Truck, CheckCircle2, Clock, ChevronRight, ExternalLink, ShoppingBag } from "lucide-react"

interface OrderItem {
  id: string
  name: string
  variant: string
  price: number
  quantity: number
  image: string
}

interface Order {
  id: string
  orderNumber: string
  date: string
  status: "processing" | "shipped" | "delivered" | "cancelled"
  total: number
  items: OrderItem[]
  trackingNumber?: string
}

const MOCK_ORDERS: Order[] = [
  {
    id: "ord-1",
    orderNumber: "RSP-2026-8912",
    date: "Sep 18, 2026",
    status: "processing",
    total: 1499,
    trackingNumber: "DTDC-8849102",
    items: [
      {
        id: "item-1",
        name: "Custom Classic Cotton T-Shirt",
        variant: "Black / Size L / Front Print",
        price: 799,
        quantity: 1,
        image: "/favicon.png",
      },
      {
        id: "item-2",
        name: "Premium Ceramic Photo Mug",
        variant: "White / 350ml / Dual Sided",
        price: 350,
        quantity: 2,
        image: "/favicon.png",
      },
    ],
  },
  {
    id: "ord-2",
    orderNumber: "RSP-2026-7451",
    date: "Aug 29, 2026",
    status: "delivered",
    total: 899,
    items: [
      {
        id: "item-3",
        name: "Acrylic Glossy Photo Frame Clock",
        variant: "12x12 inch / Square",
        price: 899,
        quantity: 1,
        image: "/favicon.png",
      },
    ],
  },
]

export default function OrdersView() {
  const [filter, setFilter] = useState<"all" | "processing" | "delivered">("all")

  const filteredOrders = MOCK_ORDERS.filter((order) => {
    if (filter === "all") return true
    return order.status === filter
  })

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="size-3.5" />
            Processing
          </span>
        )
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="size-3.5" />
            Shipped
          </span>
        )
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="size-3.5" />
            Delivered
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="w-full">
      {/* Section Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-heading sm:font-sans">
          Order History
        </h2>

        <div className="flex items-center gap-1 rounded-xl bg-neutral-100 p-1 border border-neutral-200/60 text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === "all"
                ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            All ({MOCK_ORDERS.length})
          </button>
          <button
            onClick={() => setFilter("processing")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === "processing"
                ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Processing (1)
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === "delivered"
                ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Delivered (1)
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-4">
            <Package className="size-7" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">No orders found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
            You don't have any orders under this filter. Explore our personalized printing collection!
          </p>
          <a
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#f0643b] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#df562f] transition-all"
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
              className="rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-sm"
            >
              {/* Order Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold text-neutral-900">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs text-neutral-500">{order.date}</span>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Order Items */}
              <div className="divide-y divide-neutral-100 py-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="size-14 rounded-xl border border-neutral-200/80 bg-neutral-50 flex items-center justify-center p-2 shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="size-8 object-contain opacity-70"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-neutral-500">{item.variant}</p>
                        <p className="text-xs text-neutral-600 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-neutral-900">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 pt-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">Total Amount:</span>
                  <span className="text-base font-bold text-neutral-900">₹{order.total}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  {order.trackingNumber && (
                    <button
                      onClick={() => alert(`Tracking package: ${order.trackingNumber}`)}
                      className="px-3.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                    >
                      Track Shipment
                    </button>
                  )}
                  <button
                    onClick={() => alert(`Downloading Invoice for ${order.orderNumber}`)}
                    className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
