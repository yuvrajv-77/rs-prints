import type {
  NormalizedRect,
  PrintPositionConfig,
  MockupViewConfig,
  TShirtColorConfig,
  ProductCustomizerConfig
} from "./tshirt-mockups"

// ============================================================================
// 1. WHITE CERAMIC MUG CONFIGURATION
// Dimensions: 1024 x 523 (matches the 7 cm x 17.2 cm panoramic wrap layout)
// Size holder: 7 cm x 17.2 cm wrap template with green dashed outline
// ============================================================================

export const MUG_POSITIONS: Record<string, PrintPositionConfig> = {
  wrap: {
    id: "wrap",
    name: "Panoramic Wrap",
    description: "7 cm × 17.2 cm full panoramic wrap area",
    physicalSizeLabel: "7 cm × 17.2 cm",
    printArea: {
      x: 0.046875, // 48 / 1024
      y: 0.19694,  // 103 / 523
      width: 0.7832, // 802 / 1024
      height: 0.57744 // 302 / 523
    }
  }
}

export const MUG_CONFIG: ProductCustomizerConfig & { productType: "mug" } = {
  productId: "white-ceramic-mug-a001",
  name: "Classic Ceramic Mug (11oz)",
  productType: "mug",
  defaultColorId: "white",
  defaultViewId: "front",
  colors: {
    white: {
      id: "white",
      name: "Glossy White",
      hex: "#FFFFFF",
      isLight: true,
      views: {
        front: {
          id: "front",
          name: "Front View",
          image: "/mockups/mockup-white-mug-wrap.png",
          originalWidth: 1024,
          originalHeight: 523,
          defaultPositionId: "wrap",
          positions: MUG_POSITIONS
        }
      }
    }
  }
}

// ============================================================================
// 2. WHITE STAINLESS BOTTLE CONFIGURATION
// Dimensions: 1024 x 1536
// Single print area (no multiple positions)
// ============================================================================

export const BOTTLE_POSITIONS: Record<string, PrintPositionConfig> = {
  print_area: {
    id: "print_area",
    name: "Print Area",
    description: "Vertical cylindrical imprint zone",
    physicalSizeLabel: "3.2\" × 7.5\"",
    printArea: {
      x: 0.3418, // 350 / 1024
      y: 0.3580, // 550 / 1536
      width: 0.3164, // 324 / 1024
      height: 0.5208 // 800 / 1536
    }
  }
}

export const BOTTLE_CONFIG: ProductCustomizerConfig & { productType: "bottle" } = {
  productId: "white-stainless-bottle-loop",
  name: "White Stainless Bottle with Loop Cap",
  productType: "bottle",
  defaultColorId: "white",
  defaultViewId: "front",
  colors: {
    white: {
      id: "white",
      name: "Powder White",
      hex: "#FFFFFF",
      isLight: true,
      views: {
        front: {
          id: "front",
          name: "Front View",
          image: "/mockups/White Stainless Bottle with Black Loop Cap.png",
          originalWidth: 1024,
          originalHeight: 1536,
          defaultPositionId: "print_area",
          positions: BOTTLE_POSITIONS
        }
      }
    }
  }
}
