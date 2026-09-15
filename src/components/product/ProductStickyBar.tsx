import { useState, useEffect } from "react"
import type { Product } from "@/types/product"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircleIcon } from "lucide-react"

interface ProductStickyBarProps {
  product: Product
}

export default function ProductStickyBar({ product }: ProductStickyBarProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show bar after scrolling down 450px
      if (window.scrollY > 450) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isVisible) return null

  const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
    `Hi RS Prints, I'm viewing ${product.title} and want to place a quick order.`
  )}`

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-foreground truncate block">
              {product.title}
            </span>
            <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary/40 shrink-0">
              {product.turnaround}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            From <span className="text-sm font-extrabold text-foreground">{product.startingPrice}</span>
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button size="sm" className="font-bold text-xs gap-1.5 shadow-sm">
            <MessageCircleIcon className="size-3.5" />
            Instant Order
          </Button>
        </a>
      </div>
    </div>
  )
}
