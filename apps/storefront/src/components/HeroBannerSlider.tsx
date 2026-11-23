import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface BannerSlide {
  id: string
  image: string
  alt: string
  href: string
  title: string
  subtitle?: string
  bgClass?: string
  objectFit?: "cover" | "contain"
}

export const DEFAULT_HERO_BANNERS: BannerSlide[] = [
  {
    id: "shop-all-2",
    image: "/shop-all-banner2.png",
    alt: "RS Prints Custom Printing Studio & Personalized Merchandise",
    href: "/categories",
    title: "Custom Printing Studio",
    subtitle: "Custom printed mugs, apparel, drinkware & personalized photo gifts",
    objectFit: "cover",
  },
  {
    id: "bulk-orders",
    image: "/bulk-order-banner.png",
    alt: "RS Prints Bulk & Corporate Orders - Tiered Volume Discounts",
    href: "/bulk-order",
    title: "Bulk & Corporate Gifting",
    subtitle: "Tiered volume discounts up to 45% with free digital proofs",
    bgClass: "bg-[#18160c]",
    objectFit: "contain",
  },
  {
    id: "products-catalogue",
    image: "/products-banner.png",
    alt: "RS Prints 240+ Personalized Gifts & Custom Products Catalogue",
    href: "/categories",
    title: "Personalized Gifts Catalogue",
    subtitle: "Over 240+ custom printable items crafted with vibrant HD quality",
    bgClass: "bg-[#f7f0e9]",
    objectFit: "cover",
  },
  {
    id: "shop-all-1",
    image: "/shop-all-banner.png",
    alt: "RS Prints Premium Personalized Merchandise",
    href: "/categories",
    title: "Premium Merchandise",
    subtitle: "Fast production and pan-India safe doorstep delivery",
    bgClass: "bg-[#f9f6f0]",
    objectFit: "cover",
  },
]

interface HeroBannerSliderProps {
  slides?: BannerSlide[]
  autoPlayInterval?: number // ms, defaults to 5000
}

export default function HeroBannerSlider({
  slides = DEFAULT_HERO_BANNERS,
  autoPlayInterval = 5000,
}: HeroBannerSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: 25,
    skipSnaps: false,
  })

  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([])
  const [isPaused, setIsPaused] = React.useState(false)

  // Initialize snaps and active slide listener
  React.useEffect(() => {
    if (!emblaApi) return

    setScrollSnaps(emblaApi.scrollSnapList())
    setSelectedIndex(emblaApi.selectedScrollSnap())

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)

    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi])

  // Autoplay timer with pause on hover/interaction
  React.useEffect(() => {
    if (!emblaApi || isPaused || autoPlayInterval <= 0) return

    const timer = setInterval(() => {
      emblaApi.scrollNext()
    }, autoPlayInterval)

    return () => clearInterval(timer)
  }, [emblaApi, isPaused, autoPlayInterval])

  // Keyboard navigation support
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      emblaApi?.scrollPrev()
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      emblaApi?.scrollNext()
    }
  }

  const scrollPrev = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      emblaApi?.scrollPrev()
    },
    [emblaApi]
  )

  const scrollNext = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      emblaApi?.scrollNext()
    },
    [emblaApi]
  )

  const scrollTo = React.useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      emblaApi?.scrollTo(idx)
    },
    [emblaApi]
  )

  return (
    <div
      className="group relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:shadow-md hover:border-primary/50"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="RS Prints Featured Promotions"
    >
      {/* Embla Viewport */}
      <div ref={emblaRef} className="overflow-hidden w-full cursor-grab active:cursor-grabbing">
        <div className="flex">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0 relative"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}: ${slide.title}`}
            >
              <a
                href={slide.href}
                className={`relative block aspect-[2170/724] w-full overflow-hidden select-none ${
                  slide.bgClass || "bg-card"
                }`}
                tabIndex={selectedIndex === index ? 0 : -1}
                aria-label={slide.alt}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className={`h-full w-full select-none transition-transform duration-700 ease-out group-hover:scale-[1.008] ${
                    slide.objectFit === "contain"
                      ? "object-contain object-center"
                      : "object-cover object-center"
                  }`}
                  draggable={false}
                  width="2170"
                  height="724"
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Prev Navigation Button */}
      <button
        type="button"
        onClick={scrollPrev}
        className="absolute left-2.5 sm:left-4 md:left-5 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-10 md:size-11 rounded-full bg-background/85 dark:bg-background/90 text-foreground hover:bg-background hover:text-primary backdrop-blur-md border border-border/70 shadow-md flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Previous banner"
      >
        <ChevronLeft className="size-4 sm:size-5.5 stroke-[2.2]" />
      </button>

      {/* Next Navigation Button */}
      <button
        type="button"
        onClick={scrollNext}
        className="absolute right-2.5 sm:right-4 md:right-5 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-10 md:size-11 rounded-full bg-background/85 dark:bg-background/90 text-foreground hover:bg-background hover:text-primary backdrop-blur-md border border-border/70 shadow-md flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Next banner"
      >
        <ChevronRight className="size-4 sm:size-5.5 stroke-[2.2]" />
      </button>

      {/* Slide Indicators (Dots / Pills) */}
      <div className="absolute bottom-2.5 sm:bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/40 dark:bg-black/60 backdrop-blur-md border border-white/15 shadow-xs">
        {scrollSnaps.map((_, idx) => {
          const isActive = idx === selectedIndex
          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => scrollTo(idx, e)}
              className={`transition-all duration-300 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                isActive
                  ? "w-5 sm:w-7 h-1.5 sm:h-2 bg-white shadow-xs"
                  : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/45 hover:bg-white/80"
              }`}
              aria-label={`Slide ${idx + 1}`}
              aria-current={isActive ? "true" : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
