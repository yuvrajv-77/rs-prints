/**
 * Reusable Mockup & Printable Area Configuration System
 *
 * Coordinates are normalized from 0.0 to 1.0 relative to the original
 * mockup image dimensions. This decouples the printable region from
 * CSS pixels, viewport zoom, and canvas display scaling.
 */

export interface NormalizedRect {
  /** Normalized X position of top-left corner (0.0 to 1.0) */
  x: number
  /** Normalized Y position of top-left corner (0.0 to 1.0) */
  y: number
  /** Normalized width (0.0 to 1.0) */
  width: number
  /** Normalized height (0.0 to 1.0) */
  height: number
}

export interface PrintPositionConfig {
  id: string
  name: string
  description: string
  physicalSizeLabel: string
  printArea: NormalizedRect
}

export interface MockupViewConfig {
  id: "front" | "back"
  name: string
  image: string
  originalWidth: number
  originalHeight: number
  positions: Record<string, PrintPositionConfig>
  defaultPositionId: string
}

export interface TShirtColorConfig {
  id: string
  name: string
  hex: string
  isLight?: boolean
  views: {
    front: MockupViewConfig
    back: MockupViewConfig
  }
}

export interface ProductCustomizerConfig {
  productId: string
  name: string
  defaultColorId: string
  defaultViewId: "front" | "back"
  colors: Record<string, TShirtColorConfig>
}

// Standard positions for front view calibrated to exact 610px torso center axis on 1229x1280 mockup
const FRONT_POSITIONS: Record<string, PrintPositionConfig> = {
  center_chest: {
    id: "center_chest",
    name: "Center Chest",
    description: "Standard chest graphic placement (10″ × 12″)",
    physicalSizeLabel: "10″ × 12″ (Standard)",
    printArea: {
      x: 0.342,
      y: 0.230,
      width: 0.309,
      height: 0.356
    }
  },
  left_chest: {
    id: "left_chest",
    name: "Left Chest (Pocket)",
    description: "Subtle emblem or badge placement (4″ × 4″)",
    physicalSizeLabel: "4″ × 4″ (Pocket)",
    printArea: {
      x: 0.570,
      y: 0.235,
      width: 0.110,
      height: 0.105
    }
  },
  full_front: {
    id: "full_front",
    name: "Full Front",
    description: "Oversized full torso artwork (12″ × 16″)",
    physicalSizeLabel: "12″ × 16″ (Oversized)",
    printArea: {
      x: 0.301,
      y: 0.180,
      width: 0.390,
      height: 0.531
    }
  }
}

// Standard positions for back view calibrated to exact 610px torso center axis on 1229x1280 mockup
const BACK_POSITIONS: Record<string, PrintPositionConfig> = {
  upper_back: {
    id: "upper_back",
    name: "Upper Back",
    description: "Shoulder-blade graphic or slogan (11″ × 14″)",
    physicalSizeLabel: "11″ × 14″ (Standard)",
    printArea: {
      x: 0.342,
      y: 0.180,
      width: 0.309,
      height: 0.356
    }
  },
  full_back: {
    id: "full_back",
    name: "Full Back",
    description: "Full-bleed poster graphic across entire back (12″ × 16″)",
    physicalSizeLabel: "12″ × 16″ (Oversized)",
    printArea: {
      x: 0.301,
      y: 0.156,
      width: 0.390,
      height: 0.531
    }
  },
  nape_neck: {
    id: "nape_neck",
    name: "Nape of Neck",
    description: "Small collar brandmark / tag placement (3.5″ × 3.5″)",
    physicalSizeLabel: "3.5″ × 3.5″ (Brandmark)",
    printArea: {
      x: 0.439,
      y: 0.102,
      width: 0.114,
      height: 0.109
    }
  }
}

/**
 * Standard RS Prints Cotton T-Shirt Configuration
 * Calibrated against actual mockup assets in /public/mockups/
 */
export const TSHIRT_CONFIG: ProductCustomizerConfig = {
  productId: "basic-cotton-tshirt",
  name: "Classic Unisex Cotton T-Shirt",
  defaultColorId: "black",
  defaultViewId: "front",
  colors: {
    black: {
      id: "black",
      name: "Pitch Black",
      hex: "#1A1A1A",
      views: {
        front: {
          id: "front",
          name: "Front View",
          image: "/mockups/mockup-black-tshirt-round.png",
          originalWidth: 1229,
          originalHeight: 1280,
          defaultPositionId: "center_chest",
          positions: FRONT_POSITIONS
        },
        back: {
          id: "back",
          name: "Back View",
          image: "/mockups/mockup-black-tshirt-round-backside.png",
          originalWidth: 1229,
          originalHeight: 1280,
          defaultPositionId: "upper_back",
          positions: BACK_POSITIONS
        }
      }
    },
    white: {
      id: "white",
      name: "Crisp White",
      hex: "#FFFFFF",
      isLight: true,
      views: {
        front: {
          id: "front",
          name: "Front View",
          image: "/mockups/mockup-white-tshirt-round.png",
          originalWidth: 1229,
          originalHeight: 1280,
          defaultPositionId: "center_chest",
          positions: FRONT_POSITIONS
        },
        back: {
          id: "back",
          name: "Back View",
          image: "/mockups/mockup-white-tshirt-round-backside.png",
          originalWidth: 1229,
          originalHeight: 1280,
          defaultPositionId: "upper_back",
          positions: BACK_POSITIONS
        }
      }
    }
  }
}

/**
 * Helper to compute absolute pixel dimensions of print area
 * given the base mockup dimensions.
 */
export function getAbsolutePrintArea(
  normalized: NormalizedRect,
  baseWidth: number,
  baseHeight: number
) {
  return {
    left: Math.round(normalized.x * baseWidth),
    top: Math.round(normalized.y * baseHeight),
    width: Math.round(normalized.width * baseWidth),
    height: Math.round(normalized.height * baseHeight)
  }
}
