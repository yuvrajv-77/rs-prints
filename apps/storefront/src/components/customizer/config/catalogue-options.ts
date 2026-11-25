/**
 * Catalogue Variant Options Registry
 *
 * Mappings for RS Prints catalogue merchandise (mugs, drinkware, bottles, apparel)
 * ensuring that every product displays its TRUE physical variant options:
 * - Single-base products (e.g. White Mug A001, Cone Mug A003) -> 0 swatches / static base
 * - Neon Mugs (A007) -> Neon Red, Blue, Green, Yellow, Orange, Pink
 * - Metallic / Plated (A008, A112) -> Gold, Silver, Pink
 * - Finishes (A012) -> Glossy, Matte
 * - Handle Colours (A004C, A005, A115, A116) -> Red, Pink, Orange, Green, Blue, Amber, etc.
 * - Body / Rim / Gradient Colours (A006, A014, A014C, A120)
 *
 * All non-apparel mockups (mugs, bottles, bags) remain 100% static in the canvas!
 */

export interface CatalogueProductOptionItem {
  id: string
  name: string
  hex: string
  isLight?: boolean
}

export interface CatalogueProductOptionDef {
  code?: string
  name: string
  /** Human-readable attribute group label: e.g. "Colour", "Finish", "Handle Colour", "Body Colour", "Base Colour" */
  attributeName: string
  /** Presentation style: "color" (swatches) or "pill" (chip buttons for finishes like Glossy/Matte) */
  attributeType: "color" | "finish" | "pill"
  options: CatalogueProductOptionItem[]
}

/**
 * Catalogue products known to have multi-attribute options (colors, finishes, handle colors, body colors)
 */
export const CATALOGUE_MULTI_VARIANT_MAP: Record<string, CatalogueProductOptionDef> = {
  // 1. Neon Mug (A007)
  "neon-mug-a007": {
    code: "A007",
    name: "Neon Mug",
    attributeName: "Neon Colour",
    attributeType: "color",
    options: [
      { id: "neon-pink", name: "Neon Pink", hex: "#FF1493" },
      { id: "neon-green", name: "Neon Green", hex: "#39FF14" },
      { id: "neon-orange", name: "Neon Orange", hex: "#FF5F1F" },
      { id: "neon-yellow", name: "Neon Yellow", hex: "#E7FE00" },
      { id: "neon-blue", name: "Neon Blue", hex: "#00F5FF" },
      { id: "neon-red", name: "Neon Red", hex: "#FF3366" }
    ]
  },
  "a007": {
    code: "A007",
    name: "Neon Mug",
    attributeName: "Neon Colour",
    attributeType: "color",
    options: [
      { id: "neon-pink", name: "Neon Pink", hex: "#FF1493" },
      { id: "neon-green", name: "Neon Green", hex: "#39FF14" },
      { id: "neon-orange", name: "Neon Orange", hex: "#FF5F1F" },
      { id: "neon-yellow", name: "Neon Yellow", hex: "#E7FE00" },
      { id: "neon-blue", name: "Neon Blue", hex: "#00F5FF" },
      { id: "neon-red", name: "Neon Red", hex: "#FF3366" }
    ]
  },

  // 2. Golden & Silver Mug (A008)
  "golden-silver-mug-a008": {
    code: "A008",
    name: "Golden & Silver Mug",
    attributeName: "Metallic Finish",
    attributeType: "pill",
    options: [
      { id: "gold", name: "Gold", hex: "#D4AF37" },
      { id: "silver", name: "Silver", hex: "#C0C0C0" }
    ]
  },
  "a008": {
    code: "A008",
    name: "Golden & Silver Mug",
    attributeName: "Metallic Finish",
    attributeType: "pill",
    options: [
      { id: "gold", name: "Gold", hex: "#D4AF37" },
      { id: "silver", name: "Silver", hex: "#C0C0C0" }
    ]
  },

  // 3. Magic Glossy & Matte Mug (A012)
  "magic-glossy-matte-mug-a012": {
    code: "A012",
    name: "Magic Glossy & Matte Mug",
    attributeName: "Finish",
    attributeType: "pill",
    options: [
      { id: "glossy", name: "Glossy", hex: "#0F172A" },
      { id: "matte", name: "Matte", hex: "#475569" }
    ]
  },
  "a012": {
    code: "A012",
    name: "Magic Glossy & Matte Mug",
    attributeName: "Finish",
    attributeType: "pill",
    options: [
      { id: "glossy", name: "Glossy", hex: "#0F172A" },
      { id: "matte", name: "Matte", hex: "#475569" }
    ]
  },

  // 4. 3 Tone Mug (A006)
  "3-tone-mug-a006": {
    code: "A006",
    name: "3 Tone Mug",
    attributeName: "Rim & Inner Colour",
    attributeType: "color",
    options: [
      { id: "red", name: "Red", hex: "#DC2626" },
      { id: "green", name: "Green", hex: "#16A34A" },
      { id: "blue", name: "Blue", hex: "#2563EB" },
      { id: "dark-green", name: "Dark Green", hex: "#14532D" },
      { id: "pink", name: "Pink", hex: "#EC4899" },
      { id: "black", name: "Black", hex: "#1A1A1A" },
      { id: "yellow", name: "Yellow", hex: "#FACC15" },
      { id: "orange", name: "Orange", hex: "#EA580C" },
      { id: "light-blue", name: "Light Blue", hex: "#38BDF8" }
    ]
  },
  "a006": {
    code: "A006",
    name: "3 Tone Mug",
    attributeName: "Rim & Inner Colour",
    attributeType: "color",
    options: [
      { id: "red", name: "Red", hex: "#DC2626" },
      { id: "green", name: "Green", hex: "#16A34A" },
      { id: "blue", name: "Blue", hex: "#2563EB" },
      { id: "dark-green", name: "Dark Green", hex: "#14532D" },
      { id: "pink", name: "Pink", hex: "#EC4899" },
      { id: "black", name: "Black", hex: "#1A1A1A" },
      { id: "yellow", name: "Yellow", hex: "#FACC15" },
      { id: "orange", name: "Orange", hex: "#EA580C" },
      { id: "light-blue", name: "Light Blue", hex: "#38BDF8" }
    ]
  },

  // 5. 3 Tone Heart Handle Mug (A004C)
  "3-tone-heart-handle-mug-a004c": {
    code: "A004C",
    name: "3 Tone Heart Handle Mug",
    attributeName: "Handle Colour",
    attributeType: "color",
    options: [
      { id: "red", name: "Red Handle", hex: "#DC2626" },
      { id: "pink", name: "Pink Handle", hex: "#EC4899" },
      { id: "orange", name: "Orange Handle", hex: "#EA580C" },
      { id: "green", name: "Green Handle", hex: "#16A34A" },
      { id: "yellow", name: "Yellow Handle", hex: "#FACC15" },
      { id: "blue", name: "Blue Handle", hex: "#2563EB" }
    ]
  },
  "3-tone-heart-handle-a004c": {
    code: "A004C",
    name: "3 Tone Heart Handle Mug",
    attributeName: "Handle Colour",
    attributeType: "color",
    options: [
      { id: "red", name: "Red Handle", hex: "#DC2626" },
      { id: "pink", name: "Pink Handle", hex: "#EC4899" },
      { id: "orange", name: "Orange Handle", hex: "#EA580C" },
      { id: "green", name: "Green Handle", hex: "#16A34A" },
      { id: "yellow", name: "Yellow Handle", hex: "#FACC15" },
      { id: "blue", name: "Blue Handle", hex: "#2563EB" }
    ]
  },
  "a004c": {
    code: "A004C",
    name: "3 Tone Heart Handle Mug",
    attributeName: "Handle Colour",
    attributeType: "color",
    options: [
      { id: "red", name: "Red Handle", hex: "#DC2626" },
      { id: "pink", name: "Pink Handle", hex: "#EC4899" },
      { id: "orange", name: "Orange Handle", hex: "#EA580C" },
      { id: "green", name: "Green Handle", hex: "#16A34A" },
      { id: "yellow", name: "Yellow Handle", hex: "#FACC15" },
      { id: "blue", name: "Blue Handle", hex: "#2563EB" }
    ]
  },

  // 6. Color Patch Mug (A005)
  "color-patch-mug-a005": {
    code: "A005",
    name: "Color Patch Mug",
    attributeName: "Handle Colour",
    attributeType: "color",
    options: [
      { id: "black", name: "Black Handle", hex: "#1A1A1A" },
      { id: "pink", name: "Pink Handle", hex: "#EC4899" },
      { id: "yellow", name: "Yellow Handle", hex: "#FACC15" },
      { id: "red", name: "Red Handle", hex: "#DC2626" },
      { id: "green", name: "Green Handle", hex: "#16A34A" },
      { id: "light-blue", name: "Light Blue Handle", hex: "#38BDF8" },
      { id: "blue", name: "Blue Handle", hex: "#2563EB" }
    ]
  },
  "a005": {
    code: "A005",
    name: "Color Patch Mug",
    attributeName: "Handle Colour",
    attributeType: "color",
    options: [
      { id: "black", name: "Black Handle", hex: "#1A1A1A" },
      { id: "pink", name: "Pink Handle", hex: "#EC4899" },
      { id: "yellow", name: "Yellow Handle", hex: "#FACC15" },
      { id: "red", name: "Red Handle", hex: "#DC2626" },
      { id: "green", name: "Green Handle", hex: "#16A34A" },
      { id: "light-blue", name: "Light Blue Handle", hex: "#38BDF8" },
      { id: "blue", name: "Blue Handle", hex: "#2563EB" }
    ]
  },

  // 7. 3 Tone Tea Mug (A002C)
  "3-tone-tea-mug-a002c": {
    code: "A002C",
    name: "3 Tone Tea Mug",
    attributeName: "Colour",
    attributeType: "color",
    options: [
      { id: "black", name: "Black", hex: "#1A1A1A" },
      { id: "pink", name: "Pink", hex: "#EC4899" },
      { id: "yellow", name: "Yellow", hex: "#FACC15" },
      { id: "red", name: "Red", hex: "#DC2626" },
      { id: "green", name: "Green", hex: "#16A34A" },
      { id: "light-blue", name: "Light Blue", hex: "#38BDF8" },
      { id: "blue", name: "Blue", hex: "#2563EB" }
    ]
  },
  "a002c": {
    code: "A002C",
    name: "3 Tone Tea Mug",
    attributeName: "Colour",
    attributeType: "color",
    options: [
      { id: "black", name: "Black", hex: "#1A1A1A" },
      { id: "pink", name: "Pink", hex: "#EC4899" },
      { id: "yellow", name: "Yellow", hex: "#FACC15" },
      { id: "red", name: "Red", hex: "#DC2626" },
      { id: "green", name: "Green", hex: "#16A34A" },
      { id: "light-blue", name: "Light Blue", hex: "#38BDF8" },
      { id: "blue", name: "Blue", hex: "#2563EB" }
    ]
  },

  // 8. Electro Plated Mugs (A112, A143, A114)
  "electro-plated-mug-a112": {
    code: "A112",
    name: "Electro Plated Mug",
    attributeName: "Plated Finish",
    attributeType: "pill",
    options: [
      { id: "silver", name: "Silver Plated", hex: "#C0C0C0" },
      { id: "gold", name: "Gold Plated", hex: "#D4AF37" },
      { id: "pink", name: "Pink Plated", hex: "#F472B6" }
    ]
  },
  "electro-plated-mug-silver-a112": {
    code: "A112",
    name: "Electro Plated Mug",
    attributeName: "Plated Finish",
    attributeType: "pill",
    options: [
      { id: "silver", name: "Silver Plated", hex: "#C0C0C0" },
      { id: "gold", name: "Gold Plated", hex: "#D4AF37" },
      { id: "pink", name: "Pink Plated", hex: "#F472B6" }
    ]
  },
  "gold-electro-plated-mug-a143": {
    code: "A143",
    name: "Gold Electro Plated Mug",
    attributeName: "Plated Finish",
    attributeType: "pill",
    options: [
      { id: "gold", name: "Gold Plated", hex: "#D4AF37" },
      { id: "silver", name: "Silver Plated", hex: "#C0C0C0" },
      { id: "pink", name: "Pink Plated", hex: "#F472B6" }
    ]
  },
  "pink-electro-plated-mug-a114": {
    code: "A114",
    name: "Pink Electro Plated Mug",
    attributeName: "Plated Finish",
    attributeType: "pill",
    options: [
      { id: "pink", name: "Pink Plated", hex: "#F472B6" },
      { id: "gold", name: "Gold Plated", hex: "#D4AF37" },
      { id: "silver", name: "Silver Plated", hex: "#C0C0C0" }
    ]
  },
  "a112": {
    code: "A112",
    name: "Electro Plated Mug",
    attributeName: "Plated Finish",
    attributeType: "pill",
    options: [
      { id: "silver", name: "Silver Plated", hex: "#C0C0C0" },
      { id: "gold", name: "Gold Plated", hex: "#D4AF37" },
      { id: "pink", name: "Pink Plated", hex: "#F472B6" }
    ]
  },

  // 9. Full Color Glass Mug (Frosted) (A014C)
  "full-color-glass-mug-frosted-a014c": {
    code: "A014C",
    name: "Full Color Glass Mug (Frosted)",
    attributeName: "Body Colour",
    attributeType: "color",
    options: [
      { id: "blue", name: "Blue", hex: "#2563EB" },
      { id: "green", name: "Green", hex: "#16A34A" },
      { id: "pink", name: "Pink", hex: "#EC4899" },
      { id: "orange", name: "Orange", hex: "#EA580C" },
      { id: "neon-green", name: "Neon Green", hex: "#39FF14" }
    ]
  },
  "a014c": {
    code: "A014C",
    name: "Full Color Glass Mug (Frosted)",
    attributeName: "Body Colour",
    attributeType: "color",
    options: [
      { id: "blue", name: "Blue", hex: "#2563EB" },
      { id: "green", name: "Green", hex: "#16A34A" },
      { id: "pink", name: "Pink", hex: "#EC4899" },
      { id: "orange", name: "Orange", hex: "#EA580C" },
      { id: "neon-green", name: "Neon Green", hex: "#39FF14" }
    ]
  },

  // 10. Gradient Color Glass Mug (Frosted) (A014)
  "gradient-color-glass-mug-frosted-a014": {
    code: "A014",
    name: "Gradient Color Glass Mug (Frosted)",
    attributeName: "Gradient Colour",
    attributeType: "color",
    options: [
      { id: "blue", name: "Blue Gradient", hex: "#2563EB" },
      { id: "green", name: "Green Gradient", hex: "#16A34A" },
      { id: "pink", name: "Pink Gradient", hex: "#EC4899" },
      { id: "orange", name: "Orange Gradient", hex: "#EA580C" },
      { id: "neon-green", name: "Neon Green Gradient", hex: "#39FF14" }
    ]
  },
  "a014": {
    code: "A014",
    name: "Gradient Color Glass Mug (Frosted)",
    attributeName: "Gradient Colour",
    attributeType: "color",
    options: [
      { id: "blue", name: "Blue Gradient", hex: "#2563EB" },
      { id: "green", name: "Green Gradient", hex: "#16A34A" },
      { id: "pink", name: "Pink Gradient", hex: "#EC4899" },
      { id: "orange", name: "Orange Gradient", hex: "#EA580C" },
      { id: "neon-green", name: "Neon Green Gradient", hex: "#39FF14" }
    ]
  },

  // 11. Color Glass Mug (A120)
  "color-glass-mug-a120": {
    code: "A120",
    name: "Color Glass Mug",
    attributeName: "Base Colour",
    attributeType: "color",
    options: [
      { id: "purple", name: "Purple", hex: "#9333EA" },
      { id: "orange", name: "Orange", hex: "#EA580C" },
      { id: "light-blue", name: "Light Blue", hex: "#38BDF8" },
      { id: "light-yellow", name: "Light Yellow", hex: "#FEF08A" }
    ]
  },
  "a120": {
    code: "A120",
    name: "Color Glass Mug",
    attributeName: "Base Colour",
    attributeType: "color",
    options: [
      { id: "purple", name: "Purple", hex: "#9333EA" },
      { id: "orange", name: "Orange", hex: "#EA580C" },
      { id: "light-blue", name: "Light Blue", hex: "#38BDF8" },
      { id: "light-yellow", name: "Light Yellow", hex: "#FEF08A" }
    ]
  },

  // 12. Borosilicate Glass Mug with Color Handle (A115, A116)
  "borosilicate-glass-mug-clear-color-handle-a115": {
    code: "A115",
    name: "Borosilicate Glass Mug, Clear Color Handle",
    attributeName: "Handle Colour",
    attributeType: "color",
    options: [
      { id: "clear", name: "Clear Handle", hex: "#E2E8F0" },
      { id: "blue", name: "Blue Handle", hex: "#2563EB" },
      { id: "amber", name: "Amber Handle", hex: "#D97706" },
      { id: "green", name: "Green Handle", hex: "#16A34A" },
      { id: "yellow", name: "Yellow Handle", hex: "#EAB308" }
    ]
  },
  "borosilicate-glass-mug-frosted-color-handle-a116": {
    code: "A116",
    name: "Borosilicate Glass Mug, Frosted Color Handle",
    attributeName: "Handle Colour",
    attributeType: "color",
    options: [
      { id: "clear", name: "Clear Handle", hex: "#E2E8F0" },
      { id: "blue", name: "Blue Handle", hex: "#2563EB" },
      { id: "amber", name: "Amber Handle", hex: "#D97706" },
      { id: "green", name: "Green Handle", hex: "#16A34A" },
      { id: "yellow", name: "Yellow Handle", hex: "#EAB308" }
    ]
  },
  "a115": {
    code: "A115",
    name: "Borosilicate Glass Mug",
    attributeName: "Handle Colour",
    attributeType: "color",
    options: [
      { id: "clear", name: "Clear Handle", hex: "#E2E8F0" },
      { id: "blue", name: "Blue Handle", hex: "#2563EB" },
      { id: "amber", name: "Amber Handle", hex: "#D97706" },
      { id: "green", name: "Green Handle", hex: "#16A34A" },
      { id: "yellow", name: "Yellow Handle", hex: "#EAB308" }
    ]
  },
  "a116": {
    code: "A116",
    name: "Borosilicate Glass Mug",
    attributeName: "Handle Colour",
    attributeType: "color",
    options: [
      { id: "clear", name: "Clear Handle", hex: "#E2E8F0" },
      { id: "blue", name: "Blue Handle", hex: "#2563EB" },
      { id: "amber", name: "Amber Handle", hex: "#D97706" },
      { id: "green", name: "Green Handle", hex: "#16A34A" },
      { id: "yellow", name: "Yellow Handle", hex: "#EAB308" }
    ]
  },

  // 13. Color Beer Glass (A118)
  "color-beer-glass-a118": {
    code: "A118",
    name: "Color Beer Glass",
    attributeName: "Glass Tint",
    attributeType: "color",
    options: [
      { id: "purple-red", name: "Purple-Red", hex: "#991B1B" },
      { id: "orange", name: "Orange", hex: "#EA580C" },
      { id: "light-blue", name: "Light Blue", hex: "#38BDF8" },
      { id: "light-yellow", name: "Light Yellow", hex: "#FEF08A" }
    ]
  },
  "a118": {
    code: "A118",
    name: "Color Beer Glass",
    attributeName: "Glass Tint",
    attributeType: "color",
    options: [
      { id: "purple-red", name: "Purple-Red", hex: "#991B1B" },
      { id: "orange", name: "Orange", hex: "#EA580C" },
      { id: "light-blue", name: "Light Blue", hex: "#38BDF8" },
      { id: "light-yellow", name: "Light Yellow", hex: "#FEF08A" }
    ]
  },

  // 14. Aluminium Bottles with Colours (A123, A150)
  "aluminium-bottle-a123": {
    code: "A123",
    name: "Aluminium Bottle",
    attributeName: "Bottle Colour",
    attributeType: "color",
    options: [
      { id: "red", name: "Red", hex: "#DC2626" },
      { id: "blue", name: "Blue", hex: "#2563EB" },
      { id: "black", name: "Black", hex: "#1A1A1A" }
    ]
  },
  "aluminium-big-mouth-bottle-bb28-a150": {
    code: "A150",
    name: "Aluminium Big Mouth Bottle BB28",
    attributeName: "Bottle Colour",
    attributeType: "color",
    options: [
      { id: "red", name: "Red", hex: "#DC2626" },
      { id: "blue", name: "Blue", hex: "#2563EB" },
      { id: "black", name: "Black", hex: "#1A1A1A" },
      { id: "purple", name: "Purple", hex: "#9333EA" }
    ]
  },

  // 15. Tumblers with White / Silver Colours (A029, A030, A038)
  "big-mouth-tumbler-bb15-a029": {
    code: "A029",
    name: "Big Mouth Tumbler BB15",
    attributeName: "Colour / Finish",
    attributeType: "pill",
    options: [
      { id: "white", name: "White", hex: "#FFFFFF" },
      { id: "silver", name: "Silver", hex: "#D1D5DB" }
    ]
  },
  "starbucks-tumbler-bb12-a030": {
    code: "A030",
    name: "Starbucks Tumbler BB12",
    attributeName: "Colour / Finish",
    attributeType: "pill",
    options: [
      { id: "white", name: "White", hex: "#FFFFFF" },
      { id: "silver", name: "Silver", hex: "#D1D5DB" }
    ]
  },
  "yeti-coffee-mug-a038": {
    code: "A038",
    name: "Yeti Coffee Mug",
    attributeName: "Colour / Finish",
    attributeType: "pill",
    options: [
      { id: "white", name: "White", hex: "#FFFFFF" },
      { id: "silver", name: "Silver", hex: "#D1D5DB" }
    ]
  }
}

/**
 * Catalogue products that are explicitly SINGLE-BASE (e.g. Classic White Mug A001).
 * They must NEVER show color swatches or fake "black and white" selectors.
 */
export const CATALOGUE_SINGLE_BASE_ITEMS = new Set<string>([
  "a001",
  "white-mug-a001",
  "a111",
  "motto-ceramic-mug-a111",
  "a003",
  "cone-mug-a003",
  "a004",
  "white-heart-handle-mug-a004",
  "a113",
  "golden-handle-mug-a113",
  "a013",
  "heart-cut-mug-a013",
  "a013m",
  "heart-cut-magic-mug-a013m",
  "a002",
  "white-tea-mug-a002",
  "a010",
  "german-beer-stein-mug-a010",
  "a144",
  "blue-berry-mug-a144",
  "a145",
  "coco-milk-white-mug-a145",
  "a146",
  "merry-gold-mug-a146",
  "a147",
  "rose-gold-mug-a147",
  "a148",
  "cork-base-mug-a148",
  "a015",
  "frosted-glass-mug-a015",
  "a016",
  "clear-glass-mug-a016",
  "a018",
  "frosted-beer-glass-a018",
  "a019",
  "clear-beer-glass-a019",
  "a022",
  "shooter-glass-a022",
  "a023",
  "shot-glass-with-patch-a023",
  "a024",
  "shot-glass-gold-rim-a024",
  "a025",
  "shot-glass-clear-a025",
  "a141",
  "frosted-skinny-tumbler-with-plastic-lid-a141",
  "a121",
  "gradient-color-glass-tumbler-with-bamboo-lid-a121",
  "a142",
  "gradient-color-glass-tumbler-with-bamboo-lid-frosted-a142",
  "a020",
  "frosted-mason-jar-a020",
  "a021",
  "clear-mason-jar-with-lid-a021",
  "a122",
  "gradient-color-jar-with-bamboo-lid-a122",
  "a119",
  "gradient-color-jar-clear-a119",
  "a117",
  "mason-jar-without-lid-a117",
  "a130",
  "stainless-steel-cap-vacuum-bottle-bb30-a130",
  "a131",
  "double-wall-stainless-steel-cap-vacuum-bottle-bb27-a131",
  "a132",
  "stainless-steel-mug-with-handle-side-lid-bb31-a132",
  "a027",
  "cola-bottle-bb16-a027",
  "a109",
  "pink-skinny-tumbler-bb21-a109",
  "a134",
  "stainless-steel-tumbler-bb29-a134",
  "a031",
  "tumbler-with-lid-straw-bb14-a031",
  "a151",
  "temperature-bottle-bb19-a151",
  "a033",
  "double-wall-coke-can-bb25-a033",
  "a034",
  "wine-cup-bb18-a034",
  "a035",
  "bottle-bb17-a035",
  "a036",
  "travel-mug-bb20-a036",
  "a037",
  "skinny-tumbler-bb21-a037",
  "a135",
  "kids-water-bottle-a135",
  "a136",
  "kids-water-bottle-a136"
])

/**
 * Look up catalogue option definitions for a given product or URL context
 */
export function lookupCatalogueProductOptions(
  productOrSlug?: string | { slug?: string; id?: string; title?: string; category?: string } | null,
  searchParams?: URLSearchParams | null
): CatalogueProductOptionDef | null {
  const slug = (
    typeof productOrSlug === "string"
      ? productOrSlug
      : productOrSlug?.slug || productOrSlug?.id || ""
  )
    .toLowerCase()
    .trim()

  const title = (
    typeof productOrSlug === "object" ? productOrSlug?.title || "" : ""
  ).toLowerCase()

  const urlProduct = (searchParams?.get("product") || "").toLowerCase().trim()

  // 1. Check if definitely single-base product (NO multi-variant options)
  for (const singleKey of CATALOGUE_SINGLE_BASE_ITEMS) {
    if (slug === singleKey || slug.endsWith(`-${singleKey}`) || title.includes(singleKey)) {
      return null
    }
  }

  // 2. Direct slug/code match in multi-variant map
  if (slug && CATALOGUE_MULTI_VARIANT_MAP[slug]) {
    return CATALOGUE_MULTI_VARIANT_MAP[slug]
  }

  // Extract trailing code from slug (e.g. "neon-mug-a007" -> "a007", "3-tone-mug-a006" -> "a006")
  const codeMatch = slug.match(/([a-z0-9]+)$/i)
  if (codeMatch && CATALOGUE_MULTI_VARIANT_MAP[codeMatch[1].toLowerCase()]) {
    return CATALOGUE_MULTI_VARIANT_MAP[codeMatch[1].toLowerCase()]
  }

  // 3. Match from product title / URL heuristics
  const combined = `${slug} ${title} ${urlProduct}`

  if (combined.includes("neon mug") || combined.includes("a007")) {
    return CATALOGUE_MULTI_VARIANT_MAP["neon-mug-a007"]
  }
  if (combined.includes("golden & silver") || combined.includes("golden silver") || combined.includes("a008")) {
    return CATALOGUE_MULTI_VARIANT_MAP["golden-silver-mug-a008"]
  }
  if (combined.includes("magic glossy") || combined.includes("glossy & matte") || combined.includes("a012")) {
    return CATALOGUE_MULTI_VARIANT_MAP["magic-glossy-matte-mug-a012"]
  }
  if (combined.includes("3 tone heart handle") || combined.includes("a004c")) {
    return CATALOGUE_MULTI_VARIANT_MAP["3-tone-heart-handle-mug-a004c"]
  }
  if (combined.includes("3 tone mug") || combined.includes("a006")) {
    return CATALOGUE_MULTI_VARIANT_MAP["3-tone-mug-a006"]
  }
  if (combined.includes("color patch mug") || combined.includes("a005")) {
    return CATALOGUE_MULTI_VARIANT_MAP["color-patch-mug-a005"]
  }
  if (combined.includes("electro plated") || combined.includes("a112") || combined.includes("a143") || combined.includes("a114")) {
    return CATALOGUE_MULTI_VARIANT_MAP["electro-plated-mug-a112"]
  }
  if (combined.includes("gradient color glass mug") || combined.includes("a014")) {
    return CATALOGUE_MULTI_VARIANT_MAP["gradient-color-glass-mug-frosted-a014"]
  }
  if (combined.includes("full color glass mug") || combined.includes("a014c")) {
    return CATALOGUE_MULTI_VARIANT_MAP["full-color-glass-mug-frosted-a014c"]
  }
  if (combined.includes("color glass mug") || combined.includes("a120")) {
    return CATALOGUE_MULTI_VARIANT_MAP["color-glass-mug-a120"]
  }
  if (combined.includes("borosilicate") || combined.includes("a115") || combined.includes("a116")) {
    return CATALOGUE_MULTI_VARIANT_MAP["borosilicate-glass-mug-clear-color-handle-a115"]
  }
  if (combined.includes("color beer glass") || combined.includes("a118")) {
    return CATALOGUE_MULTI_VARIANT_MAP["color-beer-glass-a118"]
  }

  return null
}
