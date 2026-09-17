import React, { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

export interface NavSubCategory {
  id: string
  title: string
  description?: string
  count: number
}

export interface NavParentCategory {
  id: string
  title: string
  description?: string
  totalCount: number
  subcategories: NavSubCategory[]
}

interface CategoryNavProps {
  categories: NavParentCategory[]
  totalProductsCount: number
}

export default function CategoryNav({ categories, totalProductsCount }: CategoryNavProps) {
  // Track which parent categories are expanded (default: all expanded for quick access)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    categories.forEach((cat) => {
      initial[cat.id] = true
    })
    return initial
  })

  const toggleExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }))
  }

  return (
    <nav className="flex flex-col gap-1">
      {/* All Products Option */}
      <a
        href="/products"
        data-filter-slug="all"
        className="aside-filter-link group flex items-center justify-between px-3 py-2 rounded-xl text-[15px] font-bold text-foreground hover:bg-muted transition-colors w-full border border-transparent hover:border-border/60"
      >
        <span>All Products</span>
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md group-hover:bg-background transition-colors">
          {totalProductsCount}
        </span>
      </a>

      <div className="my-1.5 border-b border-border/60" />

      {/* Parent Categories with Subcategories */}
      {categories.map((parent) => {
        const isExpanded = expanded[parent.id] ?? true
        const hasSubcategories = parent.subcategories && parent.subcategories.length > 0

        return (
          <div key={parent.id} className="flex flex-col gap-0.5">
            {/* Parent Category Row */}
            <div className="flex items-center group/parent">
              <a
                href={`/products?category=${parent.id}`}
                data-filter-slug={parent.id}
                className="aside-filter-link flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl text-[15px] font-semibold text-foreground/90 hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border/50"
              >
                <span className="truncate">{parent.title}</span>
                <span className="text-xs font-mono text-muted-foreground ml-2 shrink-0">
                  {parent.totalCount}
                </span>
              </a>

              {/* Subcategory Toggle Chevron (if has subcategories) */}
              {hasSubcategories && (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(parent.id, e)}
                  aria-label={`Toggle ${parent.title} subcategories`}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors ml-0.5 shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                </button>
              )}
            </div>

            {/* Subcategories List */}
            {hasSubcategories && isExpanded && (
              <div className="ml-3 pl-2.5 border-l-2 border-border/40 flex flex-col gap-0.5 my-0.5">
                {parent.subcategories.map((sub) => (
                  <a
                    key={sub.id}
                    href={`/products?category=${sub.id}`}
                    data-filter-slug={sub.id}
                    data-parent-slug={parent.id}
                    className="aside-filter-link flex items-center justify-between px-2.5 py-1 rounded-lg text-xs sm:text-[13px] text-foreground/75 hover:text-foreground hover:bg-muted transition-colors border border-transparent"
                  >
                    <span className="truncate">{sub.title}</span>
                    <span className="text-[11px] font-mono text-muted-foreground ml-2 shrink-0">
                      {sub.count}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
