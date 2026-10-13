"use client"

import React, { useState, useEffect, useRef } from "react"
import { useStore } from "@nanostores/react"
import { $currentUser, fetchCurrentUser, signOut } from "@/stores/auth"
import { $cart, $cartCount, fetchActiveOrder } from "@/stores/cart"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group"
import {
  User,
  ShoppingBag,
  Search,
  Package,
  LogOut,
  X,
  ExternalLink,
} from "lucide-react"

export default function UserNav() {
  const { customer, loading, initialized } = useStore($currentUser)
  const cartState = useStore($cart)
  const cartCount = useStore($cartCount)
  const [isUserOpen, setIsUserOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!initialized) {
      fetchCurrentUser()
    }
  }, [initialized])

  useEffect(() => {
    if (!cartState.initialized) {
      fetchActiveOrder()
    }
  }, [cartState.initialized])

  // Click outside listener for popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserOpen(false)
      }
      if (
        searchMenuRef.current &&
        !searchMenuRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserOpen(false)
        setIsSearchOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`
      setIsSearchOpen(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setIsUserOpen(false)
    window.location.href = "/"
  }

  const displayName =
    customer?.firstName ||
    customer?.emailAddress.split("@")[0] ||
    "Account"

  const initials =
    (customer?.firstName?.[0] || "") + (customer?.lastName?.[0] || "") ||
    displayName[0]?.toUpperCase() ||
    "U"

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* 1. Search Icon & Desktop Popover */}
      <div className="relative" ref={searchMenuRef}>
        <button
          type="button"
          aria-label="Search products"
          onClick={() => {
            setIsSearchOpen((prev) => !prev)
            setIsUserOpen(false)
          }}
          className={`flex size-10 items-center justify-center rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
            isSearchOpen ? "bg-muted text-foreground" : ""
          }`}
        >
          <Search className="size-5" />
        </button>

        {isSearchOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <InputGroup className="h-10 w-full rounded-xl border border-border bg-muted/40">
                <InputGroupAddon align="inline-start">
                  <Search className="size-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  autoFocus
                  placeholder="Search products, mugs, t-shirts, frames..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-sm placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      onClick={() => setSearchQuery("")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>
            </form>
          </div>
        )}
      </div>

      {/* 2. User Account Icon & Popover */}
      <div className="relative" ref={userMenuRef}>
        <button
          type="button"
          aria-label="User Account"
          onClick={() => {
            setIsUserOpen((prev) => !prev)
            setIsSearchOpen(false)
          }}
          className={`relative flex size-10 items-center justify-center rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
            isUserOpen ? "bg-muted text-foreground" : ""
          }`}
        >
          <User className="size-5" />
        </button>

        {isUserOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-border/80 bg-background/95 p-4 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150">
            {customer ? (
              /* ================= LOGGED IN VIEW ================= */
              <div className="space-y-3">
                {/* User Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground select-none shrink-0 shadow-xs">
                    {initials.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {customer.firstName
                        ? `${customer.firstName} ${customer.lastName || ""}`.trim()
                        : displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-normal">
                      {customer.emailAddress}
                    </p>
                  </div>
                </div>

                {/* Account Navigation Links */}
                <div className="space-y-1 py-1">
                  <a
                    href="/account/profile"
                    onClick={() => setIsUserOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-foreground/90 hover:text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <User className="size-4 text-muted-foreground" />
                    <span>My Account</span>
                  </a>

                  <a
                    href="/account/orders"
                    onClick={() => setIsUserOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-foreground/90 hover:text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <Package className="size-4 text-muted-foreground" />
                    <span>Order History</span>
                  </a>

                  <a
                    href="/products"
                    onClick={() => setIsUserOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-foreground/90 hover:text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <ShoppingBag className="size-4 text-muted-foreground" />
                    <span>Shop Catalog</span>
                  </a>
                </div>

                {/* Sign Out Button */}
                <div className="pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ================= NOT LOGGED IN VIEW ================= */
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-foreground">
                    Welcome to RS Prints
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Sign in to track orders, save projects, and manage designs.
                  </p>
                </div>

                {/* Google Sign-In */}
                <a
                  href="/auth?tab=signin"
                  className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/80 bg-background hover:bg-muted/60 text-xs sm:text-sm font-medium text-foreground transition-all shadow-xs"
                >
                  <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </a>

                {/* Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-border/60" />
                  <span className="absolute bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    or
                  </span>
                </div>

                {/* Sign In & Sign Up Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <a href="/auth?tab=signin" className="w-full">
                    <Button
                      size="sm"
                      className="w-full rounded-xl text-xs font-semibold"
                    >
                      Sign In
                    </Button>
                  </a>
                  <a href="/auth?tab=signup" className="w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-xl text-xs font-semibold border-border/80 hover:bg-muted/60"
                    >
                      Sign Up
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Shopping Bag Button with Badge */}
      <a
        href="/cart"
        aria-label="Shopping Cart"
        className="relative flex size-10 items-center justify-center rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted/80 transition-colors"
      >
        <ShoppingBag className="size-5" />
        {/* Pill Notification Badge */}
        {cartCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50 duration-200">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </a>
    </div>
  )
}
