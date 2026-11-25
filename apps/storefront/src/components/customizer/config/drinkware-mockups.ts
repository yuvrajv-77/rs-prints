import type {
  NormalizedRect,
  PrintPositionConfig,
  MockupViewConfig,
  TShirtColorConfig,
  ProductCustomizerConfig
} from "./tshirt-mockups"

// ============================================================================
// 1. WHITE CERAMIC MUG CONFIGURATION
// Dimensions: 1536 x 1024
// Cylinder Body: x: 321 to 1037 (w: 716), y: 66 to 963 (h: 897)
// ============================================================================

export const MUG_POSITIONS: Record<string, PrintPositionConfig> = {
  center_face: {
    id: "center_face",
    name: "Front Center",
    description: "Centered artwork on mug face (opposite handle)",
    physicalSizeLabel: "3.5\" × 3.5\"",
    printArea: {
      x: 0.2955, // 454 / 1536
      y: 0.2089, // 214 / 1024
      width: 0.2930, // 450 / 1536
      height: 0.5859 // 600 / 1024
    }
  },
  left_handle: {
    id: "left_handle",
    name: "Left of Handle",
    description: "Artwork facing outward when held in left hand",
    physicalSizeLabel: "3.0\" × 3.5\"",
    printArea: {
      x: 0.2474, // 380 / 1536
      y: 0.2089,
      width: 0.2474, // 380 / 1536
      height: 0.5859
    }
  },
  right_handle: {
    id: "right_handle",
    name: "Right of Handle",
    description: "Artwork facing outward when held in right hand",
    physicalSizeLabel: "3.0\" × 3.5\"",
    printArea: {
      x: 0.4231, // 650 / 1536
      y: 0.2089,
      width: 0.2474,
      height: 0.5859
    }
  },
  panoramic_wrap: {
    id: "panoramic_wrap",
    name: "Full Wrap",
    description: "Wide panoramic sublimation wrap around mug",
    physicalSizeLabel: "8.5\" × 3.5\"",
    printArea: {
      x: 0.2213, // 340 / 1536
      y: 0.1855, // 190 / 1024
      width: 0.4427, // 680 / 1536
      height: 0.6250 // 640 / 1024
    }
  }
}

export const MUG_CONFIG: ProductCustomizerConfig & { productType: "mug" } = {
  productId: "white-ceramic-mug-a001",
  name: "Classic White Ceramic Mug",
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
          image: "/mockups/mockup-white-mug.png",
          originalWidth: 1536,
          originalHeight: 1024,
          defaultPositionId: "center_face",
          positions: MUG_POSITIONS
        },
        back: {
          id: "back",
          name: "Handle View",
          image: "/mockups/mockup-white-mug.png",
          originalWidth: 1536,
          originalHeight: 1024,
          defaultPositionId: "panoramic_wrap",
          positions: MUG_POSITIONS
        }
      }
    }
  }
}

// ============================================================================
// 2. WHITE STAINLESS BOTTLE CONFIGURATION
// Dimensions: 1024 x 1536
// Cylinder Body: x: 309 to 712 (w: 403), y: 500 to 1420 (h: 920)
// ============================================================================

export const BOTTLE_POSITIONS: Record<string, PrintPositionConfig> = {
  center_body: {
    id: "center_body",
    name: "Center Body",
    description: "Centered artwork on bottle cylinder",
    physicalSizeLabel: "3.0\" × 4.5\"",
    printArea: {
      x: 0.3515, // 360 / 1024
      y: 0.4622, // 710 / 1536
      width: 0.2930, // 300 / 1024
      height: 0.3255 // 500 / 1536
    }
  },
  full_vertical: {
    id: "full_vertical",
    name: "Full Vertical",
    description: "Tall vertical print along bottle cylinder",
    physicalSizeLabel: "3.2\" × 7.5\"",
    printArea: {
      x: 0.3418, // 350 / 1024
      y: 0.3580, // 550 / 1536
      width: 0.3164, // 324 / 1024
      height: 0.5208 // 800 / 1536
    }
  },
  upper_badge: {
    id: "upper_badge",
    name: "Upper Badge",
    description: "Compact logo placed below bottle shoulder",
    physicalSizeLabel: "2.5\" × 2.5\"",
    printArea: {
      x: 0.3633, // 372 / 1024
      y: 0.3646, // 560 / 1536
      width: 0.2734, // 280 / 1024
      height: 0.1823 // 280 / 1536
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
          defaultPositionId: "center_body",
          positions: BOTTLE_POSITIONS
        },
        back: {
          id: "back",
          name: "Reverse View",
          image: "/mockups/White Stainless Bottle with Black Loop Cap.png",
          originalWidth: 1024,
          originalHeight: 1536,
          defaultPositionId: "full_vertical",
          positions: BOTTLE_POSITIONS
        }
      }
    }
  }
}
