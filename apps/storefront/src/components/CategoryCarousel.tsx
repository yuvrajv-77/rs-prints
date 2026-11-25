import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import { ArrowRight } from "lucide-react"

export interface CategoryCardItem {
  id: string
  title: string
  href: string
  image: string
}

export const HOME_CATEGORIES: CategoryCardItem[] = [
  {
    id: "mugs",
    title: "Mugs",
    href: "/categories/mugs",
    image: "/categories/mugs.jpg",
  },
  {
    id: "drinkware",
    title: "Drinkware",
    href: "/categories/drinkware",
    image: "/categories/drinkware.jpg",
  },
  {
    id: "clothing",
    title: "Clothing",
    href: "/categories/clothing",
    image: "/categories/clothing.jpg",
  },
  {
    id: "bags",
    title: "Bags",
    href: "/categories/bags",
    image: "/categories/bags.jpg",
  },
  {
    id: "home-living",
    title: "Home & Living",
    href: "/categories/home-living",
    image: "/categories/home-living.jpg",
  },
  {
    id: "gifts-accessories",
    title: "Gifts & Accessories",
    href: "/categories/gifts-accessories",
    image: "/categories/gifts-accessories.jpg",
  },
]

interface CategoryCarouselProps {
  categories?: CategoryCardItem[]
  title?: string
  viewAllHref?: string
}

export default function CategoryCarousel({
  categories = HOME_CATEGORIES,
  title = "Shop by category",
  viewAllHref = "/categories",
}: CategoryCarouselProps) {
  return (
    <section className="container mx-auto px-4">
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          containScroll: "trimSnaps",
        }}
        className="w-full relative"
      >
        {/* Header with Title and Nav Controls */}
        <div className="flex items-center justify-between mb-3.5 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
            {title}
          </h2>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {viewAllHref && (
              <a
                href={viewAllHref}
                data-astro-prefetch="hover"
                className="hidden sm:inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline mr-1 transition-colors"
              >
                View all
                <ArrowRight className="size-3.5" />
              </a>
            )}
            <CarouselPrevious className="static my-0 translate-y-0 size-8 sm:size-8.5 rounded-full border border-border/80 bg-background/90 hover:bg-muted text-foreground shadow-2xs transition-all disabled:opacity-30" />
            <CarouselNext className="static my-0 translate-y-0 size-8 sm:size-8.5 rounded-full border border-border/80 bg-background/90 hover:bg-muted text-foreground shadow-2xs transition-all disabled:opacity-30" />
          </div>
        </div>

        {/* Carousel Items Track - Fractional basis so the next card peeks */}
        <CarouselContent className="-ml-3 sm:-ml-4">
          {categories.map((category) => (
            <CarouselItem
              key={category.id}
              className="pl-3 sm:pl-4 basis-[38%] sm:basis-[28%] md:basis-[22%] lg:basis-[14%] xl:basis-[13.5%]"
            >
              <a
                href={category.href}
                data-astro-prefetch="hover"
                className="group block text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
              >
                {/* Thumbnail Card */}
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl sm:rounded-2xl bg-[#f4f2ee] dark:bg-muted/40 border border-border/40 shadow-2xs transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-md group-hover:border-primary/50">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="h-full w-full object-cover object-center select-none transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                    draggable={false}
                  />
                </div>

                {/* Category Label */}
                <span className="mt-2 sm:mt-2.5 block text-sm sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1">
                  {category.title}
                </span>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  )
}
