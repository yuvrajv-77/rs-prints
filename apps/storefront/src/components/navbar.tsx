"use client"

import React, { useState, useRef, useEffect } from "react"
import { cn } from "cn"
import {
  NAVIGATION_CATEGORIES,
  type NavigationCategory,
  type NavigationSubcategory,
} from "./navigation/navigationData"

const MAX_PRODUCTS = 6

const CATEGORY_SPOTLIGHTS: Record<
  string,
  { image: string; tag: string; description: string }
> = {
  mugs: {
    image: "/categories/mugs.jpg",
    tag: "Customer Favorite",
    description:
      "Personalized ceramic, magic, and frosted glass mugs for daily coffee & special gifts.",
  },
  clothing: {
    image: "/categories/clothing.jpg",
    tag: "Custom Apparel",
    description:
      "Premium round-neck & polo t-shirts with vibrant, long-lasting custom prints.",
  },
  bags: {
    image: "/categories/bags.jpg",
    tag: "Eco-Friendly",
    description:
      "Durable custom tote bags and plush carry bags tailored with your designs.",
  },
  "home-living": {
    image: "/categories/home-living.jpg",
    tag: "Home Décor",
    description:
      "Cozy LED & magic sequin custom pillows that brighten up any living space.",
  },
}

export default function Navbar() {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (categoryId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setActiveCategoryId(categoryId)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveCategoryId(null)
    }, 180)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const activeCategory = NAVIGATION_CATEGORIES.find(
    (c) => c.id === activeCategoryId
  )

  const renderSubcategoryColumn = (subcat: NavigationSubcategory) => {
    const displayedItems = subcat.items.slice(0, MAX_PRODUCTS)
    const hasMore = subcat.items.length > MAX_PRODUCTS

    return (
      <div key={subcat.id} className="flex flex-col min-w-0">
        {/* Subcategory Heading */}
        <a
          href={subcat.href}
          onClick={() => setActiveCategoryId(null)}
          className="text-[15px] font-bold text-foreground hover:text-primary transition-colors block mb-3 tracking-tight truncate"
          title={subcat.title}
        >
          {subcat.title}
        </a>

        {/* Product Items (Capped at MAX_PRODUCTS for perfect vertical symmetry) */}
        <ul className="flex flex-col gap-1.5">
          {displayedItems.map((item, idx) => (
            <li key={idx}>
              <a
                href={item.href}
                onClick={() => setActiveCategoryId(null)}
                className="text-[14px] text-foreground/75 hover:text-foreground hover:underline transition-colors block leading-snug truncate"
                title={item.title}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>

        {/* Subcategory Action Link */}
        <div className="mt-3 pt-1">
          <a
            href={subcat.href}
            onClick={() => setActiveCategoryId(null)}
            className="text-[13px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            {hasMore ? (
              <span>View all {subcat.items.length} products &rarr;</span>
            ) : (
              <span>Shop all {subcat.title} &rarr;</span>
            )}
          </a>
        </div>
      </div>
    )
  }

  const renderCategoryContent = (category: NavigationCategory) => {
    const spotlight = CATEGORY_SPOTLIGHTS[category.id]

    // 1. Drinkware (4 subcategories) -> 4 clean equal columns across the full width
    if (category.id === "drinkware") {
      return (
        <div className="grid grid-cols-4 gap-10 items-start w-full">
          {category.subcategories.map(renderSubcategoryColumn)}
        </div>
      )
    }

    // 2. Gifts & Accessories (6 subcategories) -> 5 balanced columns
    // (MDF Collage Frames, Glass Frames, Stone & Wooden, Hard Board, plus stacked small accessories)
    if (category.id === "gifts-accessories") {
      const mainCols = category.subcategories.filter(
        (s) => s.id !== "mdf-products" && s.id !== "sublimation-accessories"
      )
      const smallCols = category.subcategories.filter(
        (s) => s.id === "mdf-products" || s.id === "sublimation-accessories"
      )

      return (
        <div className="grid grid-cols-5 gap-8 items-start w-full">
          {mainCols.map(renderSubcategoryColumn)}
          {/* Column 5: Stacked Accessories */}
          <div className="flex flex-col gap-6 min-w-0">
            {smallCols.map(renderSubcategoryColumn)}
          </div>
        </div>
      )
    }

    // 3. 2-Subcategory Categories (Mugs, Clothing, Bags, Home & Living)
    // 2 columns on the left + Spotlight Card on the right for balanced composition
    return (
      <div className="flex justify-between items-start gap-12 w-full">
        <div className="grid grid-cols-2 gap-12 flex-1 max-w-2xl">
          {category.subcategories.map(renderSubcategoryColumn)}
        </div>

        {spotlight && (
          <a
            href={category.href}
            onClick={() => setActiveCategoryId(null)}
            className="group/card w-80 shrink-0 rounded-2xl bg-muted/40 border border-border/60 p-4 flex flex-col justify-between hover:border-primary/40 hover:bg-muted/60 transition-all overflow-hidden"
          >
            <div>
              <div className="overflow-hidden rounded-xl mb-3.5 aspect-video w-full bg-muted">
                <img
                  src={spotlight.image}
                  alt={category.title}
                  className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {spotlight.tag}
              </span>
              <h4 className="text-sm font-bold text-foreground mt-0.5">
                Custom {category.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {spotlight.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Explore Collection</span>
              <span
                className="transition-transform group-hover/card:translate-x-1"
                aria-hidden="true"
              >
                &rarr;
              </span>
            </div>
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center h-20" onMouseLeave={handleMouseLeave}>
      {/* Top Navigation Links Bar */}
      <nav className="flex items-center gap-1 xl:gap-2 h-full">
        {NAVIGATION_CATEGORIES.map((category) => {
          const isActive = activeCategoryId === category.id

          return (
            <div
              key={category.id}
              className="relative h-20 flex items-center"
              onMouseEnter={() => handleMouseEnter(category.id)}
            >
              <a
                href={category.href}
                className={cn(
                  "relative flex items-center px-3.5 py-2 text-[15px] transition-colors cursor-pointer select-none",
                  isActive
                    ? "text-foreground font-bold"
                    : "text-foreground/80 font-medium hover:text-foreground"
                )}
              >
                {category.title}

                {/* Solid active underline indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-foreground rounded-full transition-all duration-150" />
                )}
              </a>
            </div>
          )
        })}
      </nav>

      {/* Full-width Mega Menu Dropdown */}
      {activeCategory && (
        <>
          {/* Subtle Dimming Backdrop */}
          <div
            className="fixed inset-x-0 top-20 bottom-0 bg-black/25 z-40 animate-in fade-in duration-150"
            onClick={() => setActiveCategoryId(null)}
          />

          {/* Full-Width Dropdown Container */}
          <div
            className="fixed left-0 top-20 w-screen bg-background border-b border-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            onMouseEnter={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
              }
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-7xl mx-auto px-8 lg:px-12 pt-8 pb-7">
              {/* Content Grid */}
              {renderCategoryContent(activeCategory)}

              {/* Bottom Vistaprint-style Footer Bar */}
              <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-between">
                <a
                  href={activeCategory.href}
                  onClick={() => setActiveCategoryId(null)}
                  className="text-[15px] font-bold text-foreground hover:text-primary hover:underline flex items-center gap-2 group"
                >
                  <span>See All {activeCategory.title}</span>
                  <span
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    &rarr;
                  </span>
                </a>

                <span className="text-xs text-muted-foreground font-mono">
                  {activeCategory.subcategories.reduce(
                    (acc, sub) => acc + sub.items.length,
                    0
                  )}{" "}
                  total products
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
