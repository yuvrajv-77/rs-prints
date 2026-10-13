"use client"

import React, { useState, useEffect } from "react"
import { useStore } from "@nanostores/react"
import { $currentUser, fetchCurrentUser, signOut } from "@/stores/auth"
import { $cartCount } from "@/stores/cart"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import {
  Menu,
  Search,
  HelpCircle,
  User,
  ShoppingBag,
  ChevronRight,
  ArrowLeft,
  X,
} from "lucide-react"
import BrandLogo from "@/components/BrandLogo"
import {
  NAVIGATION_CATEGORIES,
  type NavigationCategory,
} from "./navigationData"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "../ui/input-group"

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<NavigationCategory | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { customer, initialized } = useStore($currentUser)
  const cartCount = useStore($cartCount)

  useEffect(() => {
    if (!initialized) {
      fetchCurrentUser()
    }
  }, [initialized])

  // Reset category drill-down when sheet closes
  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setTimeout(() => {
        setActiveCategory(null)
      }, 200)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  return (
    <>
      {/* Mobile Top Navbar Bar (Screenshot 1) */}
      <div className="flex h-16 w-full items-center justify-between px-3 sm:px-4 bg-background border-b border-border/40">
        {/* Left Side: Hamburger & Search */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Sheet Drawer Trigger */}
          <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label="Open navigation menu"
                  className="flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              }
            >
              <Menu className="size-6 text-foreground" />
            </SheetTrigger>

            {/* Sheet Drawer Content */}
            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-[88vw] max-w-[360px] p-0 flex flex-col h-full bg-background border-r border-border/60 shadow-2xl"
            >
              {/* LEVEL 0: ROOT MENU (Screenshot 2) */}
              {!activeCategory ? (
                <div className="flex flex-col h-full">
                  {/* Top Bar with Close Button */}
                  <div className="flex h-14 items-center justify-end px-4 border-b border-border/40">
                    <SheetClose
                      render={
                        <button
                          type="button"
                          aria-label="Close menu"
                          className="flex size-9 items-center justify-center rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                        />
                      }
                    >
                      <X className="size-5" />
                    </SheetClose>
                  </div>

                  {/* Scrollable Navigation Body */}
                  <div className="flex-1 overflow-y-auto overscroll-contain py-2">
                    {/* User Account Shortcuts Section */}
                    <div className="px-2 space-y-0.5">
                      <a
                        href={customer ? "/account/profile" : "/auth?tab=signin"}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/70 transition-colors group"
                      >
                        <span className="font-semibold text-foreground">
                          {customer
                            ? customer.firstName
                              ? `Hi, ${customer.firstName}`
                              : "Account"
                            : "Account"}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </a>

                      <a
                        href="/account/creations"
                        className="flex items-center px-3 py-2 rounded-lg text-sm text-foreground/85 hover:text-foreground hover:bg-muted/70 transition-colors"
                      >
                        My Favorites
                      </a>

                      <a
                        href="/account/orders"
                        className="flex items-center px-3 py-2 rounded-lg text-sm text-foreground/85 hover:text-foreground hover:bg-muted/70 transition-colors"
                      >
                        My Projects
                      </a>

                      <a
                        href="/contact"
                        className="flex items-center px-3 py-2 rounded-lg text-sm text-foreground/85 hover:text-foreground hover:bg-muted/70 transition-colors"
                      >
                        Help is here
                      </a>

                      {customer ? (
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full text-left flex items-center px-3 py-2 rounded-lg text-sm text-foreground/85 hover:text-foreground hover:bg-muted/70 transition-colors"
                        >
                          Sign out
                        </button>
                      ) : (
                        <a
                          href="/auth?tab=signin"
                          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          Sign in
                        </a>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="my-2 border-b border-border/60 mx-4" />

                    {/* Main Categories Navigation List */}
                    <div className="px-2 space-y-0.5">
                      <a
                        href="/products"
                        className="flex items-center px-3 py-2.5 rounded-lg text-sm font-bold text-foreground hover:bg-muted/70 transition-colors"
                      >
                        View All
                      </a>

                      {NAVIGATION_CATEGORIES.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setActiveCategory(category)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-foreground hover:bg-muted/70 transition-colors text-left group"
                        >
                          <span>{category.title}</span>
                          <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                        </button>
                      ))}

                      {/* Additional Links */}
                      <a
                        href="/bulk-order"
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-foreground hover:bg-muted/70 transition-colors"
                      >
                        <span>Bulk Orders</span>
                        <span className="rounded-full bg-primary/15 text-primary text-[10px] px-2 py-0.5 font-mono">
                          Min 40
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                /* LEVEL 1: CATEGORY SUBMENU (Screenshot 3) */
                <div className="flex flex-col h-full">
                  {/* Submenu Top Header: Back Button & Close Button */}
                  <div className="flex h-14 items-center justify-between px-3 border-b border-border/60 bg-muted/20">
                    <button
                      type="button"
                      onClick={() => setActiveCategory(null)}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors py-1.5 px-1 rounded-md"
                    >
                      <ArrowLeft className="size-4 shrink-0 text-foreground" />
                      <span className="truncate max-w-[240px]">
                        {activeCategory.title}
                      </span>
                    </button>

                    <SheetClose
                      render={
                        <button
                          type="button"
                          aria-label="Close menu"
                          className="flex size-9 items-center justify-center rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted transition-colors shrink-0"
                        />
                      }
                    >
                      <X className="size-5" />
                    </SheetClose>
                  </div>

                  {/* Submenu Navigation with Accordion */}
                  <div className="flex-1 overflow-y-auto overscroll-contain py-2">
                    <Accordion
                      defaultValue={activeCategory.subcategories[0]?.id ? [activeCategory.subcategories[0].id] : undefined}
                      className="w-full border-0 rounded-none shadow-none divide-y-0"
                    >
                      {activeCategory.subcategories.map((subcat) => (
                        <AccordionItem
                          key={subcat.id}
                          value={subcat.id}
                          className="border-0 not-last:border-0 data-open:bg-transparent"
                        >
                          <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-foreground hover:no-underline hover:bg-muted/40 transition-colors">
                            <span className="text-left">{subcat.title}</span>
                          </AccordionTrigger>

                          <AccordionContent className="p-0 pb-1">
                            <ul className="flex flex-col py-1">
                              {subcat.items.map((item, idx) => (
                                <li key={idx}>
                                  <a
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-between pl-7 pr-4 py-2 text-sm text-foreground/85 hover:text-foreground hover:bg-muted/50 transition-colors"
                                  >
                                    <span className="truncate">{item.title}</span>
                                    {item.isNew && (
                                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#38bdf8] text-white uppercase tracking-wider shrink-0 shadow-xs">
                                        NEW
                                      </span>
                                    )}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    {/* Bottom: See All Link */}
                    <div className="pt-4 px-4 pb-6">
                      <a
                        href={activeCategory.seeAllHref}
                        onClick={() => setIsOpen(false)}
                        className="block text-sm font-semibold text-foreground hover:text-primary transition-colors py-2"
                      >
                        See All
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Search Trigger Button */}
          <button
            type="button"
            aria-label="Search products"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className="flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <Search className="size-5 text-foreground" />
          </button>
        </div>

        {/* Center: Brand Logo */}
        <div className="flex items-center justify-center">
          <BrandLogo />
        </div>

        {/* Right Side: Help, User Profile & Cart with Badge */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/*  */}

          {/* User Profile Button */}
          <a
            href={customer ? "/account/profile" : "/auth?tab=signin"}
            aria-label="User Account"
            className="flex size-9 items-center justify-center rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <User className="size-5" />
          </a>

          {/* Shopping Bag Button with Badge */}
          <a
            href="/cart"
            aria-label="Shopping Cart"
            className="relative flex size-9 items-center justify-center rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <ShoppingBag className="size-5" />
            {/* Pill Notification Badge */}
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50 duration-200">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </a>
        </div>
      </div>

      {/* Expandable Mobile Search Bar Dropdown */}
      {isSearchOpen && (
        <div className="px-4 py-2.5 bg-background border-b border-border/50 animate-in fade-in slide-in-from-top-2 duration-150">
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
    </>
  )
}
