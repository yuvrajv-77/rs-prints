import * as React from "react"
import type { Product } from "@/types/product"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import ProductCard from "./ProductCard"

export interface ProductCarouselItem {
  product: Product
  categorySlug: string
  parentCategorySlug?: string
}

interface ProductCarouselProps {
  items: ProductCarouselItem[]
  title: string
  subtitle?: string
  viewAllHref?: string
  viewAllLabel?: string
}

export default function ProductCarousel({
  items,
  title,
}: ProductCarouselProps) {
  return (
    <section className="container mx-auto px-4 space-y-6">
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          containScroll: "trimSnaps",
        }}
        className="w-full relative"
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground tracking-tight">
            {title}
          </h2>

          <div className="hidden items-center gap-2 self-end sm:self-auto">
            <CarouselPrevious className="static my-0 translate-y-0 size-8 sm:size-8.5 rounded-full border border-border/80 bg-background/90 hover:bg-muted text-foreground shadow-2xs transition-all disabled:opacity-30" />
            <CarouselNext className="static my-0 translate-y-0 size-8 sm:size-8.5 rounded-full border border-border/80 bg-background/90 hover:bg-muted text-foreground shadow-2xs transition-all disabled:opacity-30" />
          </div>
        </div>

        {/* Carousel Items Track */}
        <CarouselContent className="-ml-3.5 sm:-ml-4.5">
          {items.map((item) => (
            <CarouselItem
              key={item.product.id || item.product.slug}
              className="pl-3.5 sm:pl-4.5 basis-[44%] sm:basis-[36%] md:basis-[29%] lg:basis-[19%] xl:basis-[18.5%]"
            >
              <ProductCard
                product={item.product}
                categorySlug={item.categorySlug}
                parentCategorySlug={item.parentCategorySlug}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  )
}
