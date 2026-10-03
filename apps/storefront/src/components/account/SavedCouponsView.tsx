"use client"

import React, { useState } from "react"
import { Percent, Copy, Check, Tag } from "lucide-react"

interface Coupon {
  id: string
  code: string
  title: string
  discount: string
  minOrder: string
  expiresOn: string
  description: string
}

const AVAILABLE_COUPONS: Coupon[] = [
  {
    id: "c1",
    code: "WELCOME10",
    title: "New Customer Special",
    discount: "10% OFF",
    minOrder: "₹499",
    expiresOn: "Oct 31, 2026",
    description: "Applicable on your first order across all merchandise and print categories.",
  },
  {
    id: "c2",
    code: "BULKPRINT25",
    title: "Bulk Printing Saver",
    discount: "25% OFF",
    minOrder: "₹2,500",
    expiresOn: "Nov 15, 2026",
    description: "Save big on bulk orders of custom apparel, photo frames, and office merchandise.",
  },
  {
    id: "c3",
    code: "FREESHIP",
    title: "Free Express Shipping",
    discount: "FREE DELIVERY",
    minOrder: "₹999",
    expiresOn: "Dec 31, 2026",
    description: "Get free doorstep delivery on all orders anywhere in India.",
  },
]

export default function SavedCouponsView() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => {
      setCopiedCode(null)
    }, 2500)
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-heading sm:font-sans">
          Saved Coupon
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Exclusive discounts and active promo codes ready to apply at checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AVAILABLE_COUPONS.map((coupon) => (
          <div
            key={coupon.id}
            className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:border-neutral-300"
          >
            {/* Top decorative badge */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Tag className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">{coupon.title}</h4>
                  <span className="text-[11px] text-neutral-400">Expires: {coupon.expiresOn}</span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#f0643b] bg-[#f0643b]/10 px-2.5 py-1 rounded-md">
                {coupon.discount}
              </span>
            </div>

            <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
              {coupon.description}
            </p>

            {/* Coupon Code Strip */}
            <div className="flex items-center justify-between gap-3 p-2 pl-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-neutral-900 tracking-wider">
                  {coupon.code}
                </span>
                <span className="text-[11px] text-neutral-400">• Min: {coupon.minOrder}</span>
              </div>
              <button
                onClick={() => handleCopy(coupon.code)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                {copiedCode === coupon.code ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
