export interface NavigationItem {
  title: string
  href: string
  isNew?: boolean
  badge?: string
}

export interface NavigationSubcategory {
  id: string
  title: string
  href?: string
  isNew?: boolean
  items: NavigationItem[]
}

export interface NavigationCategory {
  id: string
  title: string
  href?: string
  seeAllHref: string
  subcategories: NavigationSubcategory[]
}

export const NAVIGATION_CATEGORIES: NavigationCategory[] = [
  {
    id: "clothing-bags",
    title: "Clothing, Caps & Bags",
    seeAllHref: "/products#clothing",
    subcategories: [
      {
        id: "custom-t-shirts",
        title: "Custom T-Shirts",
        items: [
          { title: "Bio-Washed Cotton T-Shirt", href: "/products/regular-bio-wash-cotton-t-shirt" },
          { title: "Premium Round Neck Tee", href: "/products/round-neck-t-shirt" },
          { title: "Oversized Streetwear Tee", href: "/products/oversized-t-shirt", isNew: true },
          { title: "Sublimation Polyester Tee", href: "/products/sublimation-white-t-shirt" },
        ],
      },
      {
        id: "custom-polo-t-shirts",
        title: "Custom Polo T-Shirts",
        items: [
          { title: "Classic Pique Polo T-Shirt", href: "/products/classic-polo-t-shirt" },
          { title: "Embroidered Corporate Polo", href: "/products/corporate-polo-t-shirt" },
          { title: "Dry-Fit Performance Polo", href: "/products/dry-fit-polo", isNew: true },
        ],
      },
      {
        id: "custom-bags-totes",
        title: "Tote Bags",
        items: [
          { title: "Cotton Tote Bags", href: "/products/cotton-canvas-tote-bag" },
          { title: "Custom Jute Bags", href: "/products/eco-jute-tote-bag" },
          { title: "Colored Canvas Tote Bags", href: "/products/colored-canvas-tote" },
          { title: "Pocket Tote Bags", href: "/products/pocket-canvas-tote", isNew: true },
          { title: "Premium Jute Bags", href: "/products/premium-jute-carry-bag", isNew: true },
        ],
      },
      {
        id: "custom-caps",
        title: "Custom Caps & Hats",
        items: [
          { title: "Embroidered Baseball Cap", href: "/products/baseball-cap-c01" },
          { title: "Trucker Mesh Snapback", href: "/products/trucker-mesh-cap" },
          { title: "Cotton Sun Bucket Hat", href: "/products/sun-bucket-hat", isNew: true },
        ],
      },
      {
        id: "custom-activewear",
        title: "Custom Activewear & Hoodies",
        items: [
          { title: "Fleece Winter Hoodie", href: "/products/premium-fleece-hoodie" },
          { title: "Zipper Sweatshirt", href: "/products/zipper-sweatshirt" },
          { title: "Breathable Gym Vest", href: "/products/gym-activewear-vest" },
        ],
      },
    ],
  },
  {
    id: "mugs",
    title: "Mugs & Tumblers",
    seeAllHref: "/products#mugs",
    subcategories: [
      {
        id: "ceramic-mugs",
        title: "Ceramic Mugs",
        items: [
          { title: "White Ceramic Mug", href: "/products/white-mug-a001" },
          { title: "Motto Ceramic Mug", href: "/products/motto-ceramic-mug-a111" },
          { title: "Cone Ceramic Mug", href: "/products/cone-mug-a003" },
          { title: "White Heart Handle Mug", href: "/products/white-heart-handle-a004" },
          { title: "3-Tone Heart Handle Mug", href: "/products/3-tone-heart-handle-a004c" },
          { title: "Neon Vibrant Ceramic Mug", href: "/products/neon-mug-a007", isNew: true },
        ],
      },
      {
        id: "magic-neon-mugs",
        title: "Magic & Color Changing Mugs",
        items: [
          { title: "Heat Sensitive Magic Mug", href: "/products/magic-color-mug-a008", isNew: true },
          { title: "Glitter Sparkle Mug", href: "/products/glitter-sublimation-mug" },
          { title: "Matte Black Engraved Mug", href: "/products/matte-black-mug" },
        ],
      },
      {
        id: "glass-tumblers",
        title: "Glass Mugs & Tumblers",
        items: [
          { title: "Frosted Beer Mug", href: "/products/frosted-beer-glass-a009" },
          { title: "Clear Glass Coffee Mug", href: "/products/clear-glass-mug-a010" },
          { title: "Sublimation Can Glass", href: "/products/can-tumbler-b01", isNew: true },
        ],
      },
    ],
  },
  {
    id: "drinkware",
    title: "Bottles & Drinkware",
    seeAllHref: "/products#drinkware",
    subcategories: [
      {
        id: "stainless-steel",
        title: "Stainless Steel Drinkware",
        items: [
          { title: "Vacuum Insulated Flask", href: "/products/vacuum-flask-dw01" },
          { title: "Digital Temperature Flask", href: "/products/temp-led-bottle", isNew: true },
          { title: "Cola Shaped Steel Bottle", href: "/products/cola-bottle-dw02" },
          { title: "Stainless Steel Coffee Tumbler", href: "/products/travel-tumbler-dw03" },
        ],
      },
      {
        id: "aluminium-bottles",
        title: "Aluminium Water Bottles",
        items: [
          { title: "Aluminium Sports Sipper 750ml", href: "/products/aluminium-sipper-750" },
          { title: "Carabiner Trekking Bottle", href: "/products/carabiner-bottle-600" },
          { title: "Matte Finish Sipper", href: "/products/matte-aluminium-bottle" },
        ],
      },
      {
        id: "kids-water-bottles",
        title: "Kids Water Bottles",
        items: [
          { title: "Cartoon Straw Sipper Bottle", href: "/products/kids-straw-bottle", isNew: true },
          { title: "Pop-Up Lid Spill-Proof Sipper", href: "/products/kids-popup-bottle" },
        ],
      },
    ],
  },
  {
    id: "photo-frames",
    title: "Photo Frames & Wall Decor",
    seeAllHref: "/products#photo-frames",
    subcategories: [
      {
        id: "mdf-collage",
        title: "MDF Collage Frames",
        items: [
          { title: "Multi-Photo Family Wall Frame", href: "/products/family-collage-frame" },
          { title: "Heart Collage Wall Decor", href: "/products/heart-collage-frame" },
          { title: "Photo Clock Wall Frame", href: "/products/photo-wall-clock-frame", isNew: true },
        ],
      },
      {
        id: "glass-stone-frames",
        title: "Glass & Stone Rock Frames",
        items: [
          { title: "Natural Slate Stone Rock Plaque", href: "/products/rock-slate-sh01" },
          { title: "Semicircle Stone Rock Frame", href: "/products/semicircle-rock-sh02" },
          { title: "Beveled Glass Desktop Photo Stand", href: "/products/beveled-glass-stand" },
        ],
      },
    ],
  },
  {
    id: "pillows-cushions",
    title: "Pillows & Cushions",
    seeAllHref: "/products#pillows-cushions",
    subcategories: [
      {
        id: "fur-pillows",
        title: "Fur Cushions",
        items: [
          { title: "Red Heart Fur Cushion", href: "/products/red-heart-fur-cushion" },
          { title: "Pink Square Plush Fur Pillow", href: "/products/pink-fur-pillow" },
          { title: "Golden Yellow Fur Pillow", href: "/products/yellow-fur-cushion" },
        ],
      },
      {
        id: "magic-sequin",
        title: "Magic Sequin Pillows",
        items: [
          { title: "Swipe-to-Reveal Reversible Sequin Pillow", href: "/products/magic-sequin-cushion", isNew: true },
          { title: "Heart Reversible Sequin Cushion", href: "/products/heart-sequin-cushion" },
        ],
      },
    ],
  },
  {
    id: "mdf-gifts",
    title: "MDF & Personal Gifts",
    seeAllHref: "/products#mdf-gifts",
    subcategories: [
      {
        id: "keychains-keepsakes",
        title: "Keychains & Keepsakes",
        items: [
          { title: "Laser-Cut Wooden Heart Keychain", href: "/products/wooden-heart-keychain" },
          { title: "Round High-Gloss MDF Keychain", href: "/products/round-mdf-keychain" },
          { title: "Double-Sided Metal Keepsake", href: "/products/metal-keychain-premium" },
        ],
      },
      {
        id: "desktop-plaques",
        title: "Desk Plaques & Clocks",
        items: [
          { title: "High-Gloss Hardboard Desk Plaque", href: "/products/hardboard-desk-plaque" },
          { title: "Tabletop Sublimation Acrylic Stand", href: "/products/acrylic-photo-stand", isNew: true },
        ],
      },
      {
        id: "promotional-supplies",
        title: "Merchandise & Accessories",
        items: [
          { title: "Personalized Gaming Mouse Pad", href: "/products/sublimation-mousepad" },
          { title: "Corporate Pin Badges", href: "/products/button-pin-badge" },
          { title: "Custom Recognition Medals", href: "/products/custom-sports-medal", isNew: true },
        ],
      },
    ],
  },
  {
    id: "marketing-cards",
    title: "Visiting Cards & Stationery",
    seeAllHref: "/products",
    subcategories: [
      {
        id: "business-cards",
        title: "Visiting Cards",
        items: [
          { title: "Standard Matte Business Cards", href: "/products?category=cards" },
          { title: "Glossy Spot UV Visiting Cards", href: "/products?category=cards", isNew: true },
          { title: "Textured Metallic Visiting Cards", href: "/products?category=cards" },
        ],
      },
      {
        id: "stationery-office",
        title: "Stationery & Notebooks",
        items: [
          { title: "Custom Hardcover Notebooks", href: "/products?category=stationery" },
          { title: "Corporate Letterheads", href: "/products?category=stationery" },
          { title: "Branded Envelopes", href: "/products?category=stationery" },
        ],
      },
      {
        id: "stickers-labels",
        title: "Labels & Stickers",
        items: [
          { title: "Die-Cut Vinyl Stickers", href: "/products?category=stickers", isNew: true },
          { title: "Product Packaging Roll Labels", href: "/products?category=stickers" },
          { title: "Clear Transparent Labels", href: "/products?category=stickers" },
        ],
      },
    ],
  },
]
