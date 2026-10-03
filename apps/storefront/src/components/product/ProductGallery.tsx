import { useState, useEffect } from "react"
import { useStore } from "@nanostores/react"
import { activeVariantImageStore } from "@/stores/product"
import { Badge } from "@/components/ui/badge"
import { SparklesIcon, ShieldCheckIcon } from "lucide-react"

interface ProductGalleryProps {
  /** Array of product images, including primary, variant-specific, and secondary gallery shots */
  images: {
    url: string
    alt: string
    isPrimary?: boolean
  }[]
  /** Promotional badge text (e.g. "Best Seller", "Custom Printed") */
  badge?: string
  /** Turnaround speed badge text (e.g. "24-48 Hours") */
  turnaround?: string
}

/**
 * ProductGallery Component
 *
 * Renders the main product image viewport and a row of selectable thumbnails.
 *
 * Synchronization:
 * - Subscribes to `activeVariantImageStore` (Nanostores).
 * - When the customer changes a variant option (like Color) in `ProductConfigurator`,
 *   the store updates and this gallery automatically highlights and displays that variant's photo.
 * - When a customer clicks any thumbnail directly, it updates the store to notify the configurator.
 */
export default function ProductGallery({
  images,
  badge = "Custom Printed",
  turnaround = "Fast Dispatch"
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const activeVariantImage = useStore(activeVariantImageStore)

  // When active variant image changes in the configurator, sync local selected thumbnail index
  useEffect(() => {
    if (activeVariantImage) {
      const matchIndex = images.findIndex((img) => img.url === activeVariantImage)
      if (matchIndex !== -1) {
        setSelectedIndex(matchIndex)
      }
    }
  }, [activeVariantImage, images])

  // Handles clicking a thumbnail image
  const handleSelectThumbnail = (idx: number) => {
    setSelectedIndex(idx)
    if (images[idx]?.url) {
      activeVariantImageStore.set(images[idx].url)
    }
  }

  const currentImage = images[selectedIndex] || images[0]
  const displayImageUrl = currentImage?.url || activeVariantImage

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div className="relative overflow-hidden rounded-2xl bg-muted/30 aspect-4/3 sm:aspect-square flex items-center justify-center">
        {/* Floating Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
          {badge && (
            <Badge variant="default">
              <SparklesIcon className="size-3 mr-1" />
              {badge}
            </Badge>
          )}
          <Badge variant="secondary">
            <ShieldCheckIcon className="size-3 mr-1" />
            {turnaround}
          </Badge>
        </div>

        {/* Primary Preview */}
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={currentImage?.alt || "Product image"}
            className="w-full h-full object-cover object-center transition-transform duration-300"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/40 text-muted-foreground p-6 text-center">
            <span className="text-4xl mb-2">🎁</span>
            <p className="text-xs font-medium text-foreground/80">Custom Personalized Merchandise</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">High-definition print sample</p>
          </div>
        )}
      </div>

      {/* Thumbnails list (if multiple) */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectThumbnail(idx)}
                className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? "border-primary"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
                aria-label={`Select photo ${idx + 1}`}
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
