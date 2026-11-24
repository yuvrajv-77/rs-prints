import * as React from "react"
import type { Product } from "@/types/product"
import { ChevronRight, ShoppingBag } from "lucide-react"
import { cn } from "cn"
import { getProductFallbackImage } from "@/lib/catalog"

export interface ProductCardProps {
  product: Product
  categorySlug?: string
  parentCategorySlug?: string
  className?: string
  showBadge?: boolean
  showStartingPrice?: boolean
  showTagline?: boolean
  showCustomizeCta?: boolean
}

/**
 * Reusable Product Card Component (React)
 * Used across product carousels, customer favorites, and dynamic grids.
 */
export default function ProductCard({
  product,
  categorySlug = "",
  parentCategorySlug = "",
  className,
  showBadge = true,
  showStartingPrice = true,
  showTagline = true,
  showCustomizeCta = true,
}: ProductCardProps) {
  const fallbackUrl = React.useMemo(
    () =>
      getProductFallbackImage(
        categorySlug,
        parentCategorySlug,
        product.category || product.slug || product.title
      ),
    [categorySlug, parentCategorySlug, product.category, product.slug, product.title]
  )

  const primaryImage =
    (product.images && product.images.length > 0 && product.images[0]?.url) ||
    product.featuredAsset?.preview ||
    ""

  const [imgSrc, setImgSrc] = React.useState<string>(primaryImage || fallbackUrl)

  React.useEffect(() => {
    setImgSrc(primaryImage || fallbackUrl)
  }, [primaryImage, fallbackUrl])

  const handleImageError = () => {
    if (imgSrc !== fallbackUrl) {
      setImgSrc(fallbackUrl)
    }
  }

  return (
    <a
      href={`/products/${product.slug}`}
      data-product-slug={product.slug}
      data-category-slug={categorySlug}
      data-subcategory={categorySlug}
      data-parent-category={parentCategorySlug || categorySlug}
      data-product-title={product.title}
      data-product-price={product.startingPriceNumber || 0}
      data-product-rating={product.rating || 0}
      className={cn(
        "group relative flex flex-col h-full rounded-2xl border border-border/70 bg-card overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 select-none",
        className
      )}
    >
      {/* Card Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.images?.[0]?.alt || product.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-106"
            loading="lazy"
            draggable={false}
            onError={handleImageError}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
            <ShoppingBag className="size-8 opacity-40" />
          </div>
        )}

        {/* Top Badge (if present)
        {showBadge && product.badge && (
          <div className="absolute top-2.5 left-2.5">
            <span className="rounded-md bg-card/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border/60 shadow-2xs">
              {product.badge}
            </span>
          </div>
        )} */}

        {/* Starting Price Chip on Image */}
        {showStartingPrice && product.startingPrice && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="rounded-md bg-background/90 backdrop-blur-md px-2 py-0.5 text-[12px] sm:text-[13px] font-mono font-semibold text-foreground border border-border/60 shadow-2xs">
              {product.startingPrice}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 justify-between p-3.5 sm:p-4 space-y-2">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
            {product.title}
          </h3>
          {showTagline && product.tagline && (
            <p className="hidden sm:block text-[11px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {product.tagline}
            </p>
          )}
        </div>

        {showCustomizeCta && (
          <div className="pt-2 border-t border-border/40 hidden md:flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Personalized</span>
            <span
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = `/customize/${product.slug}?product=${encodeURIComponent(product.title)}&color=black`
              }}
              className="font-medium text-primary inline-flex items-center gap-0.5 hover:underline cursor-pointer group-hover:translate-x-0.5 transition-transform"
            >
              Customize <ChevronRight className="size-3" />
            </span>
          </div>
        )}
      </div>
    </a>
  )
}
