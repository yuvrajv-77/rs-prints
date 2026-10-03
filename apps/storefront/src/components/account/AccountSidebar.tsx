"use client"

import React from "react"
import {
  FileText,
  Palette,
  User,
  Percent,
  Share2,
  Lock,
  BookOpen,
  Award,
  ChevronRight,
} from "lucide-react"

export interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
}

export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  {
    id: "orders",
    label: "Order History",
    href: "/account/orders",
    icon: FileText,
  },
  {
    id: "creations",
    label: "Saved Creation",
    href: "/account/creations",
    icon: Palette,
    badge: 0,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/account/profile",
    icon: User,
  },
  {
    id: "coupons",
    label: "Saved Coupon",
    href: "/account/coupons",
    icon: Percent,
  },
  {
    id: "connected-accounts",
    label: "Connected Accounts",
    href: "/account/connected-accounts",
    icon: Share2,
  },
  {
    id: "change-password",
    label: "Change Password",
    href: "/account/change-password",
    icon: Lock,
  },
  {
    id: "addresses",
    label: "Address Book",
    href: "/account/addresses",
    icon: BookOpen,
  },
  {
    id: "rewards",
    label: "Reward History",
    href: "/account/rewards",
    icon: Award,
  },
]

interface AccountSidebarProps {
  currentSection: string
}

export default function AccountSidebar({ currentSection }: AccountSidebarProps) {
  // Normalize section IDs (e.g. 'order-history' -> 'orders')
  const normalizeId = (id: string) => {
    if (id === "order-history") return "orders"
    if (id === "saved-creation") return "creations"
    if (id === "saved-coupon") return "coupons"
    if (id === "password") return "change-password"
    if (id === "address-book") return "addresses"
    if (id === "reward-history") return "rewards"
    return id
  }

  const activeId = normalizeId(currentSection)

  return (
    <div className="w-full">
      {/* Header matching screenshot */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-6 font-heading sm:font-sans">
        My Account
      </h1>

      {/* Navigation Card */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        <nav className="divide-y divide-neutral-100" aria-label="Account navigation">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeId === item.id

            return (
              <a
                key={item.id}
                href={item.href}
                className={`group flex items-center justify-between px-5 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-neutral-50/80 text-neutral-900 font-semibold"
                    : "text-neutral-600 hover:bg-neutral-50/50 hover:text-neutral-900"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon
                    className={`size-4.5 shrink-0 transition-colors ${
                      isActive
                        ? "text-neutral-900"
                        : "text-neutral-400 group-hover:text-neutral-600"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {item.badge !== undefined && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#f0643b] text-[11px] font-bold text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`size-4 transition-transform group-hover:translate-x-0.5 ${
                      isActive
                        ? "text-neutral-900"
                        : "text-neutral-300 group-hover:text-neutral-500"
                    }`}
                  />
                </div>
              </a>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
