import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { SparklesIcon, ShieldCheckIcon } from "lucide-react"

interface ProductGalleryProps {
  images: {
    url: string
    alt: string
    isPrimary?: boolean
  }[]
  badge?: string
  turnaround?: string
}

export default function ProductGallery({
  images,
  badge = "Custom Printed",
  turnaround = "Fast Dispatch"
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const currentImage = images[selectedIndex] || images[0]

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
        {currentImage?.url ? (
          <img
            src={currentImage.url}
            alt={currentImage.alt || "Product image"}
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
                onClick={() => setSelectedIndex(idx)}
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
