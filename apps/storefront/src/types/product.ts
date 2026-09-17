export interface ProductHighlight {
  title: string
  desc: string
  icon?: string
}

export interface ProductFaq {
  q: string
  a: string
}

export interface PricingTier {
  quantityRange: string
  minQty: number
  price: string
  discountPercent?: string
  savingsLabel?: string
}

export interface ProductSpecGroup {
  groupName: string
  items: {
    label: string
    value: string
  }[]
}

export interface ProductOptionGroup {
  name: string
  values: string[]
}

export interface ProductColor {
  name: string
  hex: string
}

export interface Product {
  id: string
  slug: string
  category: string
  title: string
  tagline: string
  description?: string
  startingPrice: string
  startingPriceNumber: number
  minOrder: string
  turnaround: string
  badge?: string
  rating?: number
  reviewCount?: number
  colors?: ProductColor[]
  materials: string[]
  printMethods: string[]
  options: string[]
  optionGroups?: ProductOptionGroup[]
  highlights: ProductHighlight[]
  faqs: ProductFaq[]
  pricingTiers?: PricingTier[]
  specifications?: ProductSpecGroup[]
  features?: string[]
  images: {
    url: string
    alt: string
    isPrimary?: boolean
  }[]
}

export interface SubCategory {
  id: string
  title: string
  description?: string
  slugs: string[]
}

export interface ParentCategory {
  id: string
  title: string
  description?: string
  subcategories: SubCategory[]
}

export interface PopulatedSubCategory extends SubCategory {
  products: Product[]
}

export interface CategorizedSection extends ParentCategory {
  totalCount: number
  subcategories: PopulatedSubCategory[]
  products: Product[]
}

// Kept for backward compatibility
export type CategoryGroup = ParentCategory
