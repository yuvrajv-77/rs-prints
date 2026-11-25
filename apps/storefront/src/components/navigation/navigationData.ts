export interface NavigationItem {
  title: string
  href: string
  isNew?: boolean
  badge?: string
}

export interface NavigationSubcategory {
  id: string
  title: string
  href: string
  isNew?: boolean
  items: NavigationItem[]
}

export interface NavigationCategory {
  id: string
  title: string
  href: string
  seeAllHref: string
  subcategories: NavigationSubcategory[]
}

function slugMatchesActiveSet(slug: string, activeSet: Set<string>): boolean {
  const clean = slug.toLowerCase().trim()
  if (activeSet.has(clean)) return true
  if (clean.endsWith("s") && activeSet.has(clean.slice(0, -1))) return true
  if (!clean.endsWith("s") && activeSet.has(`${clean}s`)) return true
  return false
}

/**
 * Filters static navigation categories & subcategories against active public
 * Vendure collection slugs so collections marked Private in Admin are hidden.
 * When `activeSlugs` is null/empty (e.g. backend offline), returns the full list.
 */
export function filterNavigationCategories(
  categories: NavigationCategory[],
  activeSlugs?: string[] | null
): NavigationCategory[] {
  if (!activeSlugs || activeSlugs.length === 0) {
    return categories
  }

  const activeSet = new Set(activeSlugs.map((s) => s.toLowerCase().trim()))

  return categories
    .filter((cat) => slugMatchesActiveSet(cat.id, activeSet))
    .map((cat) => {
      const visibleSubs = cat.subcategories.filter((sub) =>
        slugMatchesActiveSet(sub.id, activeSet)
      )
      return {
        ...cat,
        subcategories: visibleSubs.length > 0 ? visibleSubs : cat.subcategories,
      }
    })
}

export const NAVIGATION_CATEGORIES: NavigationCategory[] = [
  {
    "id": "mugs",
    "title": "Mugs",
    "href": "/categories/mugs",
    "subcategories": [
      {
        "id": "ceramic-mugs",
        "title": "Ceramic Mugs",
        "href": "/categories/mugs/ceramic-mugs",
        "items": [
          {
            "title": "3 Tone Heart Handle Mug",
            "href": "/products/mug-3tone-heart"
          },
          {
            "title": "3 Tone Mug",
            "href": "/products/mug-3tone"
          },
          {
            "title": "3 Tone Tea Mug",
            "href": "/products/mug-3tone-tea"
          },
          {
            "title": "Blue Berry Mug",
            "href": "/products/rs-ceramic-mugs-a144"
          },
          {
            "title": "Coco Milk White Mug",
            "href": "/products/rs-ceramic-mugs-a145"
          },
          {
            "title": "Color Patch Mug",
            "href": "/products/mug-color-patch"
          },
          {
            "title": "Cone Mug",
            "href": "/products/rs-ceramic-mugs-a003"
          },
          {
            "title": "Cork Base Mug",
            "href": "/products/rs-ceramic-mugs-a148"
          },
          {
            "title": "Electro Plated Mug",
            "href": "/products/mug-electro-plated"
          },
          {
            "title": "German Beer Stein Mug",
            "href": "/products/rs-ceramic-mugs-a010"
          },
          {
            "title": "Golden Handle Mug",
            "href": "/products/rs-ceramic-mugs-a113"
          },
          {
            "title": "Heart Cut Magic Mug",
            "href": "/products/rs-ceramic-mugs-a013m"
          },
          {
            "title": "Heart Cut Mug",
            "href": "/products/rs-ceramic-mugs-a013"
          },
          {
            "title": "Merry Gold Mug",
            "href": "/products/rs-ceramic-mugs-a146"
          },
          {
            "title": "Metallic Finish Mug",
            "href": "/products/mug-metallic"
          },
          {
            "title": "Motto Ceramic Mug",
            "href": "/products/rs-ceramic-mugs-a111"
          },
          {
            "title": "Neon Mug",
            "href": "/products/mug-neon"
          },
          {
            "title": "Rose Gold Mug",
            "href": "/products/rs-ceramic-mugs-a147"
          },
          {
            "title": "White Heart Handle Mug",
            "href": "/products/rs-ceramic-mugs-a004"
          },
          {
            "title": "White Mug",
            "href": "/products/rs-ceramic-mugs-a001"
          },
          {
            "title": "White Tea Mug",
            "href": "/products/rs-ceramic-mugs-a002"
          }
        ]
      },
      {
        "id": "glass-mugs",
        "title": "Glass Mugs",
        "href": "/categories/mugs/glass-mugs",
        "items": [
          {
            "title": "Borosilicate Glass Mug, Clear Color Handle",
            "href": "/products/rs-glass-mugs-a115"
          },
          {
            "title": "Borosilicate Glass Mug, Frosted Color Handle",
            "href": "/products/rs-glass-mugs-a116"
          },
          {
            "title": "Clear Glass Mug",
            "href": "/products/rs-glass-mugs-a016"
          },
          {
            "title": "Color Glass Mug",
            "href": "/products/glass-mug-color"
          },
          {
            "title": "Frosted Glass Mug",
            "href": "/products/rs-glass-mugs-a015"
          },
          {
            "title": "Full Color Glass Mug (Frosted)",
            "href": "/products/glass-mug-full-color-frosted"
          },
          {
            "title": "Gradient Color Glass Mug (Frosted)",
            "href": "/products/glass-mug-gradient-frosted"
          }
        ]
      }
    ],
    "seeAllHref": "/categories/mugs"
  },
  {
    "id": "drinkware",
    "title": "Drinkware",
    "href": "/categories/drinkware",
    "subcategories": [
      {
        "id": "aluminium-bottles",
        "title": "Aluminium Bottles",
        "href": "/categories/drinkware/aluminium-bottles",
        "items": [
          {
            "title": "Aluminium Bottle BB09 / BB10",
            "href": "/products/alu-bottle-bb09-bb10"
          },
          {
            "title": "Aluminium Bottle BB13",
            "href": "/products/alu-bottle-bb13"
          },
          {
            "title": "Aluminium Bottle BB26",
            "href": "/products/alu-bottle-bb26"
          },
          {
            "title": "Aluminium Bottle BB28",
            "href": "/products/alu-bottle-bb28"
          },
          {
            "title": "Aluminium Bottle BB5 / BB6",
            "href": "/products/alu-bottle-bb5-bb6"
          },
          {
            "title": "Aluminium Bottle BB7 / BB8",
            "href": "/products/alu-bottle-bb7-bb8"
          }
        ]
      },
      {
        "id": "stainless-steel-bottles-drinkware",
        "title": "Stainless Steel Bottles & Drinkware",
        "href": "/categories/drinkware/stainless-steel-bottles-drinkware",
        "items": [
          {
            "title": "Big Mouth Bottle BB12",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a029"
          },
          {
            "title": "Bottle BB17",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a035"
          },
          {
            "title": "Cola Bottle BB16",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a027"
          },
          {
            "title": "Double Wall Coke Can BB25",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a033"
          },
          {
            "title": "Double Wall Stainless Steel Cap Vacuum Bottle BB27",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a131"
          },
          {
            "title": "Pink Skinny Tumbler BB21",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a109"
          },
          {
            "title": "Skinny Tumbler BB21",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a037"
          },
          {
            "title": "Stainless Steel Cap Vacuum Bottle BB30",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a130"
          },
          {
            "title": "Stainless Steel Mug with Handle & Side Lid BB31",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a132"
          },
          {
            "title": "Stainless Steel Tumbler BB29",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a134"
          },
          {
            "title": "Starbucks Tumbler BB14",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a030"
          },
          {
            "title": "Temperature Bottle BB19",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a151"
          },
          {
            "title": "Travel Mug BB20",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a036"
          },
          {
            "title": "Travel Mug BB20",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a038"
          },
          {
            "title": "Tumbler with Lid & Straw BB14",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a031"
          },
          {
            "title": "Wine Cup BB18",
            "href": "/products/rs-stainless-steel-bottles-drinkware-a034"
          }
        ]
      },
      {
        "id": "kids-bottles",
        "title": "Kids Bottles",
        "href": "/categories/drinkware/kids-bottles",
        "items": [
          {
            "title": "Kids Water Bottle",
            "href": "/products/rs-kids-bottles-a135"
          },
          {
            "title": "Kids Water Bottle",
            "href": "/products/rs-kids-bottles-a136"
          }
        ]
      },
      {
        "id": "glass-drinkware",
        "title": "Glass Drinkware",
        "href": "/categories/drinkware/glass-drinkware",
        "items": [
          {
            "title": "Clear Beer Glass",
            "href": "/products/rs-glass-drinkware-a019"
          },
          {
            "title": "Clear Mason Jar with Lid",
            "href": "/products/rs-glass-drinkware-a021"
          },
          {
            "title": "Color Beer Glass",
            "href": "/products/glass-beer-color"
          },
          {
            "title": "Frosted Beer Glass",
            "href": "/products/rs-glass-drinkware-a018"
          },
          {
            "title": "Frosted Mason Jar",
            "href": "/products/rs-glass-drinkware-a020"
          },
          {
            "title": "Frosted Skinny Tumbler with Bamboo Lid",
            "href": "/products/frosted-skinny-tumbler-with-bamboo-lid"
          },
          {
            "title": "Gradient Color Glass Tumbler with Bamboo Lid (Frosted)",
            "href": "/products/rs-glass-drinkware-a142"
          },
          {
            "title": "Gradient Color Glass Tumbler with Plastic Lid",
            "href": "/products/gradient-color-glass-tumbler-with-plastic-lid"
          },
          {
            "title": "Gradient Color Jar (Clear)",
            "href": "/products/rs-glass-drinkware-a119"
          },
          {
            "title": "Gradient Color Jar with Bamboo Lid",
            "href": "/products/rs-glass-drinkware-a122"
          },
          {
            "title": "Mason Jar without Lid",
            "href": "/products/rs-glass-drinkware-a117"
          },
          {
            "title": "Shooter Glass",
            "href": "/products/rs-glass-drinkware-a022"
          },
          {
            "title": "Shot Glass with Patch",
            "href": "/products/rs-glass-drinkware-a023"
          },
          {
            "title": "Shot Glass, Clear",
            "href": "/products/rs-glass-drinkware-a025"
          },
          {
            "title": "Shot Glass, Gold Rim",
            "href": "/products/rs-glass-drinkware-a024"
          }
        ]
      }
    ],
    "seeAllHref": "/categories/drinkware"
  },
  {
    "id": "clothing",
    "title": "Clothing",
    "href": "/categories/clothing",
    "subcategories": [
      {
        "id": "custom-t-shirts",
        "title": "Custom T-Shirts",
        "href": "/categories/clothing/custom-t-shirts",
        "items": [
          {
            "title": "Interactive T-Shirt Customizer",
            "href": "/customize",
            "badge": "Studio"
          },
          {
            "title": "Custom Round-Neck T-Shirt",
            "href": "/products/app-round-tshirt"
          }
        ]
      },
      {
        "id": "custom-polo-t-shirts",
        "title": "Custom Polo T-Shirts",
        "href": "/categories/clothing/custom-polo-t-shirts",
        "items": [
          {
            "title": "Custom Collar T-Shirt",
            "href": "/products/app-collar-tshirt"
          }
        ]
      }
    ],
    "seeAllHref": "/categories/clothing"
  },
  {
    "id": "bags",
    "title": "Bags",
    "href": "/categories/bags",
    "subcategories": [
      {
        "id": "custom-bags",
        "title": "Custom Bags",
        "href": "/categories/bags/custom-bags",
        "items": [
          {
            "title": "Blended Plush Tote Bag",
            "href": "/products/rs-custom-tote-bags-app-tote-blended-plush"
          }
        ]
      },
      {
        "id": "custom-tote-bags",
        "title": "Custom Tote Bags",
        "href": "/categories/bags/custom-tote-bags",
        "items": [
          {
            "title": "Blended Plush Tote Bag",
            "href": "/products/rs-custom-tote-bags-app-tote-blended-plush"
          }
        ]
      }
    ],
    "seeAllHref": "/categories/bags"
  },
  {
    "id": "home-living",
    "title": "Home & Living",
    "href": "/categories/home-living",
    "subcategories": [
      {
        "id": "fur-pillows",
        "title": "Fur Pillows",
        "href": "/categories/home-living/fur-pillows",
        "items": [
          {
            "title": "LED Heart Pillow",
            "href": "/products/rs-fur-pillows-a074"
          },
          {
            "title": "LED Square Pillow",
            "href": "/products/rs-fur-pillows-a073"
          },
          {
            "title": "Long Fur Heart Pillow",
            "href": "/products/rs-fur-pillows-a072"
          },
          {
            "title": "Long Fur Square Pillow, Red",
            "href": "/products/rs-fur-pillows-a068"
          }
        ]
      },
      {
        "id": "flip-sequin",
        "title": "Flip Sequin",
        "href": "/categories/home-living/flip-sequin",
        "items": [
          {
            "title": "Magic Heart Sequin Pillow",
            "href": "/products/flip-sequin-heart"
          },
          {
            "title": "Magic Square Sequin Pillow",
            "href": "/products/flip-sequin-square"
          },
          {
            "title": "Square with Magic Patch (Heart Emboss)",
            "href": "/products/rs-flip-sequin-a077"
          },
          {
            "title": "Square with Magic Patch (Love Emboss)",
            "href": "/products/rs-flip-sequin-a078"
          }
        ]
      }
    ],
    "seeAllHref": "/categories/home-living"
  },
  {
    "id": "gifts-accessories",
    "title": "Gifts & Accessories",
    "href": "/categories/gifts-accessories",
    "subcategories": [
      {
        "id": "mdf-products",
        "title": "MDF Products",
        "href": "/categories/gifts-accessories/mdf-products",
        "items": [
          {
            "title": "Sublimation Fridge Magnet",
            "href": "/products/sublimation-fridge-magnet"
          }
        ]
      },
      {
        "id": "mdf-collage-frames",
        "title": "MDF Collage Frames",
        "href": "/categories/gifts-accessories/mdf-collage-frames",
        "items": [
          {
            "title": "Birthday MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-07"
          },
          {
            "title": "Family MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-02"
          },
          {
            "title": "Family MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-06"
          },
          {
            "title": "Forever MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-11"
          },
          {
            "title": "Friends MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-05"
          },
          {
            "title": "Happy Birthday MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-09"
          },
          {
            "title": "Love MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-03"
          },
          {
            "title": "Love MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-04"
          },
          {
            "title": "Number Clock MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-10"
          },
          {
            "title": "Number Clock MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-13"
          },
          {
            "title": "Photo Clock MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-12"
          },
          {
            "title": "Photo Clock MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-14"
          },
          {
            "title": "Sweet Heart MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-01"
          },
          {
            "title": "Sweet Home MDF Collage Frame",
            "href": "/products/rs-mdf-collage-frames-mdf-collage-08"
          }
        ]
      },
      {
        "id": "glass-frames",
        "title": "Glass Frames",
        "href": "/categories/gifts-accessories/glass-frames",
        "items": [
          {
            "title": "Sublimation Glass Frame BL-01",
            "href": "/products/rs-glass-frames-a090b"
          },
          {
            "title": "Sublimation Glass Frame BL-03",
            "href": "/products/rs-glass-frames-a091"
          },
          {
            "title": "Sublimation Glass Frame BL-04",
            "href": "/products/rs-glass-frames-a092"
          },
          {
            "title": "Sublimation Glass Frame BL-11",
            "href": "/products/rs-glass-frames-a093"
          },
          {
            "title": "Sublimation Glass Frame BL-14",
            "href": "/products/rs-glass-frames-a094"
          },
          {
            "title": "Sublimation Glass Frame BL-28",
            "href": "/products/rs-glass-frames-a095"
          },
          {
            "title": "Sublimation Glass Frame BL-29",
            "href": "/products/rs-glass-frames-a096"
          },
          {
            "title": "Sublimation Glass Frame BL-31",
            "href": "/products/rs-glass-frames-a097"
          },
          {
            "title": "Sublimation Glass Frame BL-48",
            "href": "/products/rs-glass-frames-a098"
          },
          {
            "title": "Sublimation Glass Frame BL-50",
            "href": "/products/rs-glass-frames-a099"
          }
        ]
      },
      {
        "id": "stone-wooden-frames",
        "title": "Stone & Wooden Frames",
        "href": "/categories/gifts-accessories/stone-wooden-frames",
        "items": [
          {
            "title": "Stone Frame, Natural Edge",
            "href": "/products/rs-stone-wooden-frames-sh-03"
          },
          {
            "title": "Stone Frame, Natural Edge",
            "href": "/products/rs-stone-wooden-frames-sh-04"
          },
          {
            "title": "Stone Frame, Right Open",
            "href": "/products/rs-stone-wooden-frames-sh-11"
          },
          {
            "title": "Stone Frame, Semicircle",
            "href": "/products/rs-stone-wooden-frames-sh-01"
          },
          {
            "title": "Stone Frame, Semicircle",
            "href": "/products/rs-stone-wooden-frames-sh-02"
          },
          {
            "title": "Stone Frame, Square",
            "href": "/products/rs-stone-wooden-frames-sh-19"
          },
          {
            "title": "Stone Frame, Up Opening",
            "href": "/products/rs-stone-wooden-frames-sh-05"
          },
          {
            "title": "Wooden Frame",
            "href": "/products/rs-stone-wooden-frames-sh-38"
          },
          {
            "title": "Wooden Frame",
            "href": "/products/rs-stone-wooden-frames-sh-39"
          }
        ]
      },
      {
        "id": "sublimation-accessories",
        "title": "Sublimation Accessories",
        "href": "/categories/gifts-accessories/sublimation-accessories",
        "items": [
          {
            "title": "Magnet 58 mm",
            "href": "/products/rs-sublimation-accessories-a083"
          },
          {
            "title": "Pin Badge",
            "href": "/products/pin-badge"
          },
          {
            "title": "Sublimation Mouse Pad",
            "href": "/products/rs-sublimation-accessories-a081"
          }
        ]
      },
      {
        "id": "hard-board-products",
        "title": "Hard Board Products",
        "href": "/categories/gifts-accessories/hard-board-products",
        "items": [
          {
            "title": "Hard Board Sublimation Product",
            "href": "/products/rs-hard-board-products-a084"
          },
          {
            "title": "Hard Board Sublimation Product AC-HB-013",
            "href": "/products/rs-hard-board-ac-hb-013"
          },
          {
            "title": "Hard Board Sublimation Product AC-HB-014",
            "href": "/products/rs-hard-board-ac-hb-014"
          },
          {
            "title": "Hard Board Sublimation Product AC-HB-015",
            "href": "/products/rs-hard-board-ac-hb-015"
          },
          {
            "title": "Hard Board Sublimation Product AC-HB-016",
            "href": "/products/rs-hard-board-ac-hb-016"
          },
          {
            "title": "Hard Board Sublimation Product AC-HB-017",
            "href": "/products/rs-hard-board-ac-hb-017"
          },
          {
            "title": "Hard Board Sublimation Product AC-HB-018",
            "href": "/products/rs-hard-board-ac-hb-018"
          },
          {
            "title": "Hard Board Sublimation Product AC-HB-019",
            "href": "/products/rs-hard-board-ac-hb-019"
          },
          {
            "title": "Hard Board Sublimation Product AC-HB-020",
            "href": "/products/rs-hard-board-ac-hb-020"
          },
          {
            "title": "Hard Board Sublimation Product AC-HB-021",
            "href": "/products/rs-hard-board-ac-hb-021"
          }
        ]
      }
    ],
    "seeAllHref": "/categories/gifts-accessories"
  }
];
