import type {
  PrintPositionConfig,
  ProductCustomizerConfig
} from "./tshirt-mockups"

// ============================================================================
// 1. TOTE BAG CONFIGURATION
// Dimensions: 1122 x 1402
// Canvas Body: x: 145 to 968 (w: 823), y: 570 to 1340 (h: 770)
// ============================================================================

export const TOTE_BAG_POSITIONS: Record<string, PrintPositionConfig> = {
  center_front: {
    id: "center_front",
    name: "Center Front",
    description: "Centered artwork on tote bag body",
    physicalSizeLabel: "10\" × 12\"",
    printArea: {
      x: 0.2643, // 296 / 1122
      y: 0.4636, // 650 / 1402
      width: 0.4635, // 520 / 1122
      height: 0.4137 // 580 / 1402
    }
  },
  lower_corner: {
    id: "lower_corner",
    name: "Lower Badge",
    description: "Corner logo placement on lower front",
    physicalSizeLabel: "4\" × 4\"",
    printArea: {
      x: 0.5200, // 583 / 1122
      y: 0.6500, // 911 / 1402
      width: 0.2200, // 246 / 1122
      height: 0.1760 // 246 / 1402
    }
  }
}

export const TOTE_BAG_CONFIG: ProductCustomizerConfig & { productType: "bag" } = {
  productId: "canvas-tote-bag",
  name: "Canvas Tote Bag",
  productType: "bag",
  defaultColorId: "natural",
  defaultViewId: "front",
  colors: {
    natural: {
      id: "natural",
      name: "Natural Canvas",
      hex: "#F5F2EB",
      isLight: true,
      views: {
        front: {
          id: "front",
          name: "Front View",
          image: "/mockups/Blank White Canvas Tote Mockup-1.png",
          originalWidth: 1122,
          originalHeight: 1402,
          defaultPositionId: "center_front",
          positions: TOTE_BAG_POSITIONS
        },
        back: {
          id: "back",
          name: "Reverse View",
          image: "/mockups/Blank White Canvas Tote Mockup-1.png",
          originalWidth: 1122,
          originalHeight: 1402,
          defaultPositionId: "center_front",
          positions: TOTE_BAG_POSITIONS
        }
      }
    }
  }
}

// ============================================================================
// 2. OFFICE LAPTOP BRIEFCASE CONFIGURATION
// Dimensions: 1536 x 1024
// Body Area: x: 180 to 1350 (w: 1170), y: 280 to 980 (h: 700)
// ============================================================================

export const OFFICE_BAG_POSITIONS: Record<string, PrintPositionConfig> = {
  center_front: {
    id: "center_front",
    name: "Center Front",
    description: "Centered print on briefcase front flap",
    physicalSizeLabel: "8\" × 6\"",
    printArea: {
      x: 0.3372, // 518 / 1536
      y: 0.4102, // 420 / 1024
      width: 0.3255, // 500 / 1536
      height: 0.3906 // 400 / 1024
    }
  },
  corner_logo: {
    id: "corner_logo",
    name: "Corner Badge",
    description: "Executive logo badge on lower corner",
    physicalSizeLabel: "3.5\" × 2.5\"",
    printArea: {
      x: 0.5800, // 890 / 1536
      y: 0.6200, // 635 / 1024
      width: 0.1600, // 245 / 1536
      height: 0.1700 // 174 / 1024
    }
  }
}

export const OFFICE_BAG_CONFIG: ProductCustomizerConfig & { productType: "bag" } = {
  productId: "laptop-briefcase-bag",
  name: "Matte Black Laptop Briefcase",
  productType: "bag",
  defaultColorId: "black",
  defaultViewId: "front",
  colors: {
    black: {
      id: "black",
      name: "Matte Black",
      hex: "#1A1A1A",
      views: {
        front: {
          id: "front",
          name: "Front View",
          image: "/mockups/Matte Black Laptop Briefcase Mockup-2.png",
          originalWidth: 1536,
          originalHeight: 1024,
          defaultPositionId: "center_front",
          positions: OFFICE_BAG_POSITIONS
        },
        back: {
          id: "back",
          name: "Reverse View",
          image: "/mockups/Matte Black Laptop Briefcase Mockup-2.png",
          originalWidth: 1536,
          originalHeight: 1024,
          defaultPositionId: "center_front",
          positions: OFFICE_BAG_POSITIONS
        }
      }
    }
  }
}
