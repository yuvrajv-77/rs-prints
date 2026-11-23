import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import type { Product, ProductVariant } from "@/types/product"
import { addToCart } from "@/stores/cart"
import { toast, Toaster } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Image as ImageIcon,
  Type,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Move,
  Trash2,
  Download,
  ShoppingBag,
  Check,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  Palette,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Shirt,
  Coffee,
  MessageCircle,
  Maximize2,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  HelpCircle,
  ArrowRight,
  Info
} from "lucide-react"

export interface ProductCustomizerProps {
  product?: Product
  defaultCategory?: "tshirt" | "mug"
}

// Available Product Presets for Quick Switch
interface ProductPreset {
  id: string
  name: string
  type: "tshirt" | "mug"
  basePrice: number
  description: string
  slug: string
  views: {
    id: string
    name: string
    printArea: { x: number; y: number; width: number; height: number; label: string }
  }[]
  colors: { name: string; hex: string; isLight?: boolean }[]
}

const PRODUCT_PRESETS: ProductPreset[] = [
  {
    id: "preset-tshirt",
    name: "Classic Unisex Cotton T-Shirt",
    type: "tshirt",
    basePrice: 299,
    description: "100% Ring-spun Combed Cotton (180 GSM), Bio-washed with premium DTF printability.",
    slug: "white-t-shirt-a086",
    views: [
      {
        id: "front",
        name: "Chest (Front)",
        printArea: { x: 195, y: 155, width: 210, height: 260, label: "10″ × 12″ Chest Area" }
      },
      {
        id: "back",
        name: "Back View",
        printArea: { x: 195, y: 145, width: 210, height: 275, label: "11″ × 14″ Upper Back Area" }
      }
    ],
    colors: [
      { name: "Crisp White", hex: "#FFFFFF", isLight: true },
      { name: "Pitch Black", hex: "#1A1A1A" },
      { name: "Navy Blue", hex: "#1E293B" },
      { name: "Heather Grey", hex: "#94A3B8" },
      { name: "Royal Blue", hex: "#2563EB" },
      { name: "Crimson Red", hex: "#DC2626" },
      { name: "Forest Green", hex: "#166534" },
      { name: "Pastel Pink", hex: "#FBCFE8", isLight: true }
    ]
  },
  {
    id: "preset-mug",
    name: "Standard Ceramic Mug (11 oz)",
    type: "mug",
    basePrice: 149,
    description: "Glossy white ceramic with AAA grade sublimation coating for vivid photo reproduction.",
    slug: "white-mug-a001",
    views: [
      {
        id: "front",
        name: "Front Facing",
        printArea: { x: 180, y: 140, width: 200, height: 250, label: "3.5″ × 3.5″ Front Center" }
      },
      {
        id: "wrap",
        name: "Panoramic Wrap",
        printArea: { x: 150, y: 135, width: 260, height: 260, label: "8.5″ × 3.5″ Full Wrap" }
      }
    ],
    colors: [
      { name: "Classic White", hex: "#FFFFFF", isLight: true },
      { name: "Inner Black", hex: "#262626" },
      { name: "Inner Red", hex: "#B91C1C" },
      { name: "Inner Blue", hex: "#1D4ED8" },
      { name: "Golden Handle", hex: "#EAB308" }
    ]
  }
]

const FONT_OPTIONS = [
  { name: "Modern Sans", family: "sans-serif" },
  { name: "Bold Impact", family: "Impact, sans-serif" },
  { name: "Classic Serif", family: "Georgia, serif" },
  { name: "Sport Athletic", family: "'Readex Pro', sans-serif" },
  { name: "Playful Script", family: "cursive" },
  { name: "Clean Monospace", family: "monospace" }
]

const TEXT_COLOR_OPTIONS = [
  "#000000",
  "#FFFFFF",
  "#DC2626",
  "#2563EB",
  "#16A34A",
  "#EAB308",
  "#9333EA",
  "#F97316",
  "#06B6D4",
  "#EC4899"
]

const SAMPLE_STICKERS = [
  {
    name: "Geometric Wolf",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='black'><polygon points='50,10 30,40 40,40 20,60 45,60 50,90 55,60 80,60 60,40 70,40'/></svg>"
  },
  {
    name: "RS Emblem",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='black' stroke-width='6'><circle cx='50' cy='50' r='42'/><path d='M35,32 L55,32 C62,32 66,37 66,43 C66,49 61,54 53,54 L35,54 Z'/><path d='M47,54 L65,75'/><path d='M35,32 L35,75'/></svg>"
  },
  {
    name: "Vintage Star",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23DC2626'><polygon points='50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36'/></svg>"
  },
  {
    name: "Coffee Lover",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='black' stroke-width='5' stroke-linecap='round'><path d='M25,35 L75,35 L70,75 C70,82 64,88 56,88 L44,88 C36,88 30,82 30,75 Z'/><path d='M75,45 C83,45 88,50 88,58 C88,66 83,71 74,71'/><path d='M38,20 Q40,12 44,20'/><path d='M50,18 Q52,10 56,18'/><path d='M62,20 Q64,12 68,20'/></svg>"
  }
]

export default function ProductCustomizer({ product, defaultCategory }: ProductCustomizerProps) {
  // 1. Resolve Active Preset based on prop or default
  const initialPreset = useMemo(() => {
    if (product) {
      const isMug =
        (product.category || "").toLowerCase().includes("mug") ||
        product.slug.includes("mug")
      return isMug ? PRODUCT_PRESETS[1] : PRODUCT_PRESETS[0]
    }
    if (defaultCategory === "mug") return PRODUCT_PRESETS[1]
    return PRODUCT_PRESETS[0]
  }, [product, defaultCategory])

  const [activePreset, setActivePreset] = useState<ProductPreset>(initialPreset)
  const [selectedViewId, setSelectedViewId] = useState<string>(activePreset.views[0].id)
  const [selectedColor, setSelectedColor] = useState(activePreset.colors[0])
  const [selectedSize, setSelectedSize] = useState<string>("L")
  const [quantity, setQuantity] = useState<number>(1)

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<"image" | "text" | "product">("image")

  // Uploaded Image State
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null)
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 })
  const [imageScale, setImageScale] = useState<number>(1)
  const [imageRotation, setImageRotation] = useState<number>(0)
  const [imageFlipH, setImageFlipH] = useState<boolean>(false)
  const [imageFlipV, setImageFlipV] = useState<boolean>(false)
  const [imageOpacity, setImageOpacity] = useState<number>(1)

  // Custom Text State
  const [customText, setCustomText] = useState<string>("Your Custom Brand")
  const [showText, setShowText] = useState<boolean>(true)
  const [fontFamily, setFontFamily] = useState<string>(FONT_OPTIONS[0].family)
  const [textColor, setTextColor] = useState<string>("#000000")
  const [fontSize, setFontSize] = useState<number>(24)
  const [isBold, setIsBold] = useState<boolean>(true)
  const [isItalic, setIsItalic] = useState<boolean>(false)
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center")
  const [textPos, setTextPos] = useState({ x: 0, y: 80 })
  const [textRotation, setTextRotation] = useState<number>(0)

  // Canvas / Dragging State
  const [showGuides, setShowGuides] = useState<boolean>(true)
  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false)
  const [isDraggingText, setIsDraggingText] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Processing & Export State
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [isAddingCart, setIsAddingCart] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Current Print Zone definition
  const currentView = useMemo(() => {
    return (
      activePreset.views.find((v) => v.id === selectedViewId) ||
      activePreset.views[0]
    )
  }, [activePreset, selectedViewId])

  // Sync preset if product prop changes
  useEffect(() => {
    if (product) {
      const isMug =
        (product.category || "").toLowerCase().includes("mug") ||
        product.slug.includes("mug")
      const matched = isMug ? PRODUCT_PRESETS[1] : PRODUCT_PRESETS[0]
      setActivePreset(matched)
      setSelectedViewId(matched.views[0].id)
      setSelectedColor(matched.colors[0])
    }
  }, [product])

  // Reset transforms when switching presets
  const handleSwitchPreset = (preset: ProductPreset) => {
    setActivePreset(preset)
    setSelectedViewId(preset.views[0].id)
    setSelectedColor(preset.colors[0])
    setImagePos({ x: 0, y: 0 })
    setImageScale(1)
    setTextPos({ x: 0, y: 70 })
  }

  // Handle Image File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.add({
        title: "Invalid file format",
        description: "Please upload a PNG, JPEG, SVG or WebP image file.",
        type: "error"
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setUploadedImageSrc(result)
      setImagePos({ x: 0, y: 0 })
      setImageScale(1)
      setImageRotation(0)
      setActiveTab("image")
      toast.add({
        title: "Artwork Uploaded!",
        description: "You can drag, resize, rotate and align your artwork on the product.",
        type: "success"
      })
    }
    reader.readAsDataURL(file)
  }

  // Handle Preset Sticker Selection
  const handleSelectSampleSticker = (url: string) => {
    setUploadedImageSrc(url)
    setImagePos({ x: 0, y: 0 })
    setImageScale(1)
    setImageRotation(0)
  }

  // --------------------------------------------------------------------------
  // Canvas Rendering Loop
  // --------------------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = 600
    const height = 600
    canvas.width = width
    canvas.height = height

    // 1. Background fill
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = "#F8FAFC"
    ctx.fillRect(0, 0, width, height)

    // 2. Draw Realistic Product Vector Mockup (T-Shirt or Mug)
    if (activePreset.type === "tshirt") {
      drawTShirtMockup(ctx, selectedColor.hex, selectedViewId === "back")
    } else {
      drawMugMockup(ctx, selectedColor.hex, selectedViewId === "wrap")
    }

    // 3. Define Printable Area Center
    const pa = currentView.printArea
    const paCenterX = pa.x + pa.width / 2
    const paCenterY = pa.y + pa.height / 2

    // 4. Draw Guide Outline if enabled
    if (showGuides) {
      ctx.save()
      ctx.strokeStyle = "rgba(59, 130, 246, 0.75)"
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 6])
      ctx.strokeRect(pa.x, pa.y, pa.width, pa.height)

      // Print area label badge
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)"
      ctx.fillRect(pa.x + 4, pa.y + 4, 130, 20)
      ctx.fillStyle = "#1E40AF"
      ctx.font = "bold 10px 'Readex Pro', sans-serif"
      ctx.fillText(pa.label, pa.x + 8, pa.y + 18)
      ctx.restore()
    }

    // 5. Draw Custom Uploaded Image
    if (uploadedImageSrc) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = uploadedImageSrc
      if (img.complete) {
        drawImageOnCanvas(ctx, img, paCenterX, paCenterY, pa)
      } else {
        img.onload = () => {
          renderCanvas()
        }
      }
    }

    // 6. Draw Custom Text
    if (showText && customText.trim().length > 0) {
      ctx.save()
      const textX = paCenterX + textPos.x
      const textY = paCenterY + textPos.y

      ctx.translate(textX, textY)
      ctx.rotate((textRotation * Math.PI) / 180)

      ctx.fillStyle = textColor
      ctx.font = `${isItalic ? "italic " : ""}${isBold ? "bold " : ""}${fontSize}px ${fontFamily}`
      ctx.textAlign = textAlign
      ctx.textBaseline = "middle"

      // Multi-line support
      const lines = customText.split("\n")
      const lineHeight = fontSize * 1.2
      const startY = -((lines.length - 1) * lineHeight) / 2

      lines.forEach((line, idx) => {
        ctx.fillText(line, 0, startY + idx * lineHeight)
      })

      ctx.restore()
    }

    // 7. Realistic Fabric Shading / Mug Cylindrical Glaze Overlay
    if (activePreset.type === "tshirt") {
      drawTShirtFabricShading(ctx)
    } else {
      drawMugSpecularHighlights(ctx)
    }
  }, [
    activePreset,
    selectedColor,
    selectedViewId,
    currentView,
    showGuides,
    uploadedImageSrc,
    imagePos,
    imageScale,
    imageRotation,
    imageFlipH,
    imageFlipV,
    imageOpacity,
    customText,
    showText,
    textColor,
    fontSize,
    fontFamily,
    isBold,
    isItalic,
    textAlign,
    textPos,
    textRotation
  ])

  // Helper: Draw image on canvas
  const drawImageOnCanvas = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    centerX: number,
    centerY: number,
    pa: { x: number; y: number; width: number; height: number }
  ) => {
    ctx.save()

    // Position center relative to printable area
    const targetX = centerX + imagePos.x
    const targetY = centerY + imagePos.y

    ctx.translate(targetX, targetY)
    ctx.rotate((imageRotation * Math.PI) / 180)
    ctx.scale(imageFlipH ? -1 : 1, imageFlipV ? -1 : 1)
    ctx.globalAlpha = imageOpacity

    // Aspect ratio scaled to fit comfortably inside printable area
    const maxBound = Math.min(pa.width, pa.height) * 0.75
    const ratio = img.width / img.height
    let drawW = maxBound
    let drawH = maxBound
    if (ratio > 1) {
      drawH = maxBound / ratio
    } else {
      drawW = maxBound * ratio
    }

    drawW *= imageScale
    drawH *= imageScale

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()
  }

  // Draw T-Shirt Silhouette Vector
  const drawTShirtMockup = (
    ctx: CanvasRenderingContext2D,
    colorHex: string,
    isBack: boolean
  ) => {
    ctx.save()

    // Subtle drop shadow under shirt
    ctx.shadowColor = "rgba(0, 0, 0, 0.12)"
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 14

    // Shirt Body Path
    ctx.beginPath()
    ctx.moveTo(200, 100) // Left neck point
    if (!isBack) {
      // Front collar curve
      ctx.quadraticCurveTo(300, 150, 400, 100)
    } else {
      // Back collar curve (higher)
      ctx.quadraticCurveTo(300, 120, 400, 100)
    }
    // Right shoulder
    ctx.lineTo(520, 160)
    // Right sleeve outer
    ctx.lineTo(560, 260)
    // Right sleeve cuff
    ctx.lineTo(480, 290)
    // Right armpit
    ctx.lineTo(460, 240)
    // Right torso down to hem
    ctx.lineTo(465, 520)
    // Bottom hem
    ctx.quadraticCurveTo(300, 535, 135, 520)
    // Left torso
    ctx.lineTo(140, 240)
    // Left armpit to cuff
    ctx.lineTo(120, 290)
    // Left sleeve cuff
    ctx.lineTo(40, 260)
    // Left shoulder
    ctx.lineTo(80, 160)
    ctx.closePath()

    // Fill Shirt Base Color
    ctx.fillStyle = colorHex
    ctx.fill()

    // Reset shadow
    ctx.shadowColor = "transparent"

    // Collar Ribbing Line
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)"
    ctx.lineWidth = 3
    ctx.beginPath()
    if (!isBack) {
      ctx.moveTo(198, 98)
      ctx.quadraticCurveTo(300, 152, 402, 98)
      ctx.quadraticCurveTo(300, 115, 198, 98)
    } else {
      ctx.moveTo(198, 98)
      ctx.quadraticCurveTo(300, 122, 402, 98)
      ctx.quadraticCurveTo(300, 110, 198, 98)
    }
    ctx.stroke()

    // Inner collar tag (front view only)
    if (!isBack) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)"
      ctx.beginPath()
      ctx.moveTo(270, 115)
      ctx.lineTo(330, 115)
      ctx.lineTo(325, 140)
      ctx.lineTo(275, 140)
      ctx.closePath()
      ctx.fill()
    }

    ctx.restore()
  }

  // Draw Realistic Fabric Shading / Wrinkles
  const drawTShirtFabricShading = (ctx: CanvasRenderingContext2D) => {
    ctx.save()
    // Sleeve seam shadows
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)"
    ctx.lineWidth = 2.5
    // Left sleeve seam
    ctx.beginPath()
    ctx.moveTo(140, 240)
    ctx.quadraticCurveTo(120, 190, 80, 160)
    ctx.stroke()

    // Right sleeve seam
    ctx.beginPath()
    ctx.moveTo(460, 240)
    ctx.quadraticCurveTo(480, 190, 520, 160)
    ctx.stroke()

    // Subtle side torso contour gradients
    const leftShadow = ctx.createLinearGradient(135, 300, 190, 300)
    leftShadow.addColorStop(0, "rgba(0, 0, 0, 0.12)")
    leftShadow.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = leftShadow
    ctx.fillRect(135, 230, 60, 290)

    const rightShadow = ctx.createLinearGradient(465, 300, 410, 300)
    rightShadow.addColorStop(0, "rgba(0, 0, 0, 0.12)")
    rightShadow.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = rightShadow
    ctx.fillRect(405, 230, 60, 290)

    // Center chest highlight for 3D body depth
    const chestHighlight = ctx.createRadialGradient(300, 300, 20, 300, 300, 160)
    chestHighlight.addColorStop(0, "rgba(255, 255, 255, 0.12)")
    chestHighlight.addColorStop(1, "rgba(255, 255, 255, 0)")
    ctx.fillStyle = chestHighlight
    ctx.fillRect(150, 150, 300, 300)

    ctx.restore()
  }

  // Draw Realistic Mug Vector Mockup
  const drawMugMockup = (
    ctx: CanvasRenderingContext2D,
    colorHex: string,
    isWrap: boolean
  ) => {
    ctx.save()

    // Drop shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.18)"
    ctx.shadowBlur = 28
    ctx.shadowOffsetY = 20

    // Mug Handle (drawn behind on right side)
    ctx.fillStyle = colorHex
    ctx.beginPath()
    ctx.moveTo(430, 180)
    ctx.bezierCurveTo(560, 180, 560, 390, 430, 390)
    ctx.lineTo(430, 340)
    ctx.bezierCurveTo(510, 340, 510, 230, 430, 230)
    ctx.closePath()
    ctx.fill()

    // Handle outline/shadow
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)"
    ctx.lineWidth = 3
    ctx.stroke()

    // Mug Cylinder Body
    ctx.beginPath()
    ctx.moveTo(170, 130) // top left
    ctx.lineTo(430, 130) // top right
    ctx.lineTo(425, 450) // bottom right
    ctx.quadraticCurveTo(300, 480, 175, 450) // bottom curved bevel
    ctx.lineTo(170, 130)
    ctx.closePath()

    ctx.fillStyle = colorHex
    ctx.fill()

    // Reset shadow
    ctx.shadowColor = "transparent"

    // Top Rim Oval
    ctx.beginPath()
    ctx.ellipse(300, 130, 130, 22, 0, 0, Math.PI * 2)
    ctx.fillStyle = selectedColor.isLight ? "#E2E8F0" : "rgba(255, 255, 255, 0.2)"
    ctx.fill()
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)"
    ctx.lineWidth = 2
    ctx.stroke()

    // Interior cup depth shadow
    ctx.beginPath()
    ctx.ellipse(300, 132, 120, 16, 0, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)"
    ctx.fill()

    ctx.restore()
  }

  // Draw Mug Specular Glaze & Cylindrical Lighting
  const drawMugSpecularHighlights = (ctx: CanvasRenderingContext2D) => {
    ctx.save()

    // Left edge curved shadow
    const leftCurve = ctx.createLinearGradient(170, 300, 230, 300)
    leftCurve.addColorStop(0, "rgba(0, 0, 0, 0.25)")
    leftCurve.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = leftCurve
    ctx.fillRect(170, 130, 60, 330)

    // Right edge curved shadow
    const rightCurve = ctx.createLinearGradient(430, 300, 370, 300)
    rightCurve.addColorStop(0, "rgba(0, 0, 0, 0.25)")
    rightCurve.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = rightCurve
    ctx.fillRect(370, 130, 60, 330)

    // Vertical gloss shine reflection strip
    const glossReflection = ctx.createLinearGradient(235, 130, 275, 130)
    glossReflection.addColorStop(0, "rgba(255, 255, 255, 0)")
    glossReflection.addColorStop(0.5, "rgba(255, 255, 255, 0.45)")
    glossReflection.addColorStop(1, "rgba(255, 255, 255, 0)")
    ctx.fillStyle = glossReflection
    ctx.fillRect(235, 140, 40, 310)

    ctx.restore()
  }

  // Trigger render on any relevant state update
  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  // --------------------------------------------------------------------------
  // Interactive Canvas Mouse / Touch Dragging
  // --------------------------------------------------------------------------
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)
    const pa = currentView.printArea
    const paCenterX = pa.x + pa.width / 2
    const paCenterY = pa.y + pa.height / 2

    // Check if clicked near text
    const textTargetX = paCenterX + textPos.x
    const textTargetY = paCenterY + textPos.y
    const distText = Math.hypot(coords.x - textTargetX, coords.y - textTargetY)

    if (distText < 50 && showText) {
      setIsDraggingText(true)
      setDragStart({ x: coords.x - textPos.x, y: coords.y - textPos.y })
      return
    }

    // Otherwise drag image if present
    if (uploadedImageSrc) {
      setIsDraggingImage(true)
      setDragStart({ x: coords.x - imagePos.x, y: coords.y - imagePos.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingImage && !isDraggingText) return
    const coords = getCanvasCoordinates(e)

    if (isDraggingText) {
      setTextPos({
        x: coords.x - dragStart.x,
        y: coords.y - dragStart.y
      })
    } else if (isDraggingImage) {
      setImagePos({
        x: coords.x - dragStart.x,
        y: coords.y - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDraggingImage(false)
    setIsDraggingText(false)
  }

  // --------------------------------------------------------------------------
  // Export Actions: Download Mockup & Print Artwork
  // --------------------------------------------------------------------------
  const handleDownloadMockup = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsExporting(true)

    try {
      // Temporarily hide guides for export
      setShowGuides(false)
      setTimeout(() => {
        const dataUrl = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.download = `rs-prints-${activePreset.type}-mockup.png`
        link.href = dataUrl
        link.click()

        setShowGuides(true)
        setIsExporting(false)
        toast.add({
          title: "Mockup Downloaded!",
          description: "High-resolution mockup image ready for proofing and sharing.",
          type: "success"
        })
      }, 100)
    } catch (err) {
      setIsExporting(false)
      setShowGuides(true)
      toast.add({
        title: "Export failed",
        description: "Could not export mockup. Please try again.",
        type: "error"
      })
    }
  }

  const handleDownloadPrintFile = () => {
    // Generates a clean 300 DPI high-res transparent artwork of just the customer's design
    const pa = currentView.printArea
    const exportCanvas = document.createElement("canvas")
    const scaleFactor = 4 // 4x for high-res print output
    exportCanvas.width = pa.width * scaleFactor
    exportCanvas.height = pa.height * scaleFactor
    const ctx = exportCanvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height)

    const paCenterX = exportCanvas.width / 2
    const paCenterY = exportCanvas.height / 2

    // Draw Image
    if (uploadedImageSrc) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = uploadedImageSrc
      img.onload = () => {
        ctx.save()
        ctx.translate(paCenterX + imagePos.x * scaleFactor, paCenterY + imagePos.y * scaleFactor)
        ctx.rotate((imageRotation * Math.PI) / 180)
        ctx.scale(imageFlipH ? -1 : 1, imageFlipV ? -1 : 1)
        ctx.globalAlpha = imageOpacity

        const maxBound = Math.min(pa.width, pa.height) * 0.75 * scaleFactor
        const ratio = img.width / img.height
        let drawW = maxBound
        let drawH = maxBound
        if (ratio > 1) {
          drawH = maxBound / ratio
        } else {
          drawW = maxBound * ratio
        }
        drawW *= imageScale
        drawH *= imageScale

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
        ctx.restore()

        // Draw Text
        if (showText && customText.trim().length > 0) {
          ctx.save()
          ctx.translate(paCenterX + textPos.x * scaleFactor, paCenterY + textPos.y * scaleFactor)
          ctx.rotate((textRotation * Math.PI) / 180)
          ctx.fillStyle = textColor
          ctx.font = `${isItalic ? "italic " : ""}${isBold ? "bold " : ""}${fontSize * scaleFactor}px ${fontFamily}`
          ctx.textAlign = textAlign
          ctx.textBaseline = "middle"

          const lines = customText.split("\n")
          const lineHeight = fontSize * scaleFactor * 1.2
          const startY = -((lines.length - 1) * lineHeight) / 2
          lines.forEach((line, idx) => {
            ctx.fillText(line, 0, startY + idx * lineHeight)
          })
          ctx.restore()
        }

        const dataUrl = exportCanvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.download = `rs-prints-print-ready-artwork-${Date.now()}.png`
        link.href = dataUrl
        link.click()

        toast.add({
          title: "Print File Ready!",
          description: "Transparent, 300-DPI high-res production file saved.",
          type: "success"
        })
      }
    }
  }

  // --------------------------------------------------------------------------
  // Cart & WhatsApp Order Handlers
  // --------------------------------------------------------------------------
  const unitPrice = activePreset.basePrice
  const subtotal = unitPrice * quantity

  const handleAddToCartCustomized = async () => {
    setIsAddingCart(true)

    // If product has real Vendure variants, pick the matching one
    const variantId =
      product?.variants?.[0]?.id || `mock-${activePreset.slug}-${selectedColor.name}`

    const customizationDetails = [
      `Color: ${selectedColor.name}`,
      activePreset.type === "tshirt" ? `Size: ${selectedSize}` : `Style: 11 oz Ceramic`,
      uploadedImageSrc ? "Custom Photo Uploaded" : null,
      showText && customText ? `Custom Text: "${customText}"` : null
    ]
      .filter(Boolean)
      .join(" | ")

    try {
      const success = await addToCart(variantId, quantity, {
        productName: activePreset.name,
        variantDetails: customizationDetails
      })

      if (success) {
        toast.add({
          title: "Customized Item Added!",
          description: `${quantity} × ${activePreset.name} (${customizationDetails}) added to your shopping bag.`,
          type: "success"
        })
      }
    } catch (err: any) {
      toast.add({
        title: "Could not add to cart",
        description: err?.message || "Please check connection or order via WhatsApp.",
        type: "error"
      })
    } finally {
      setIsAddingCart(false)
    }
  }

  const whatsappMessage = encodeURIComponent(
    `Hello RS Prints!\n\nI want to place an order for a custom printed ${activePreset.name}:\n` +
      `• Base Color: ${selectedColor.name}\n` +
      (activePreset.type === "tshirt" ? `• Garment Size: ${selectedSize}\n` : "") +
      `• Quantity: ${quantity} Pcs\n` +
      `• Unit Price: ₹${unitPrice} (Estimated Total: ₹${subtotal})\n` +
      (uploadedImageSrc ? "• Artwork: Custom Image Uploaded\n" : "") +
      (showText && customText ? `• Custom Text: "${customText}"\n` : "") +
      `\nPlease approve my design preview and confirm production timeline.`
  )

  const whatsappUrl = `https://wa.me/919876543210?text=${whatsappMessage}`

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      {/* Top Header & Product Preset Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Sparkles className="size-3 mr-1" /> Interactive Studio
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              Live Mockup & Print Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Custom Product Designer
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Upload your logo, custom photos, or branding. Adjust placement on realistic T-shirts
            or mugs and preview in real time before printing.
          </p>
        </div>

        {/* Quick Switcher: T-Shirt vs Mug */}
        <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-2xl border border-border/80 shrink-0">
          {PRODUCT_PRESETS.map((preset) => {
            const isSelected = activePreset.id === preset.id
            const Icon = preset.type === "tshirt" ? Shirt : Coffee
            return (
              <button
                key={preset.id}
                onClick={() => handleSwitchPreset(preset)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-background text-foreground shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4 text-primary" />
                <span>{preset.type === "tshirt" ? "T-Shirt" : "Ceramic Mug"}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Studio Workspace: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Mockup Viewport */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full bg-card rounded-3xl border border-border/80 p-4 sm:p-6 shadow-sm relative overflow-hidden">
            {/* Viewport Top Bar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              {/* Product View Switcher (Front / Back / Wrap) */}
              <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/60">
                {activePreset.views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setSelectedViewId(view.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedViewId === view.id
                        ? "bg-background text-foreground shadow-2xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {view.name}
                  </button>
                ))}
              </div>

              {/* Viewport Controls: Guides & Reset */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGuides(!showGuides)}
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  {showGuides ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  <span>{showGuides ? "Hide Guides" : "Show Guides"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImagePos({ x: 0, y: 0 })
                    setImageScale(1)
                    setImageRotation(0)
                    setTextPos({ x: 0, y: 70 })
                    toast.add({
                      title: "Artwork Centered",
                      description: "Reset position to default center coordinates.",
                      type: "info"
                    })
                  }}
                  className="h-8 gap-1.5 text-xs"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Center</span>
                </Button>
              </div>
            </div>

            {/* Interactive Canvas Element */}
            <div className="relative w-full aspect-square max-w-[540px] mx-auto rounded-2xl overflow-hidden border border-border/40 bg-slate-50 flex items-center justify-center cursor-grab active:cursor-grabbing select-none">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-full object-contain"
              />

              {/* Floating Helper Pill */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/85 backdrop-blur-md px-3 py-1 rounded-full border border-border/60 text-[11px] text-muted-foreground flex items-center gap-1.5 shadow-2xs pointer-events-none">
                <Move className="size-3 text-primary" />
                <span>Drag artwork or text directly to reposition</span>
              </div>
            </div>

            {/* Color Swatches Bar */}
            <div className="mt-6 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Palette className="size-3.5 text-primary" />
                  <span>Garment / Product Color:</span>
                  <span className="text-muted-foreground font-normal">{selectedColor.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {activePreset.colors.map((color) => {
                  const isCurrent = selectedColor.name === color.name
                  return (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      title={color.name}
                      className={`size-7 rounded-full transition-all border relative flex items-center justify-center ${
                        isCurrent
                          ? "ring-2 ring-primary ring-offset-2 scale-110 border-foreground/30"
                          : "border-border/80 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {isCurrent && (
                        <Check
                          className={`size-3.5 ${
                            color.isLight ? "text-slate-900" : "text-white"
                          }`}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customization Controls & Tool Tabs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card rounded-3xl border border-border/80 p-5 sm:p-6 shadow-sm space-y-6">
            {/* Tool Mode Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border/60">
              <button
                onClick={() => setActiveTab("image")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "image"
                    ? "bg-background text-foreground shadow-2xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ImageIcon className="size-4 text-primary" />
                <span>Custom Image</span>
              </button>

              <button
                onClick={() => setActiveTab("text")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "text"
                    ? "bg-background text-foreground shadow-2xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Type className="size-4 text-primary" />
                <span>Custom Text</span>
              </button>

              <button
                onClick={() => setActiveTab("product")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "product"
                    ? "bg-background text-foreground shadow-2xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sliders className="size-4 text-primary" />
                <span>Options & Qty</span>
              </button>
            </div>

            {/* TAB 1: CUSTOM IMAGE CONTROLS */}
            {activeTab === "image" && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                {/* Upload Button & Dropzone */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Upload Your Custom Artwork</span>
                    <span className="text-[11px] font-normal lowercase text-muted-foreground">
                      png, jpg, svg, webp
                    </span>
                  </Label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-muted/30 group"
                  >
                    <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
                      <Upload className="size-5" />
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      Click to Browse or Drop Photo Here
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Supports transparent PNGs up to 25MB for crisp 300 DPI prints
                    </div>
                  </div>
                </div>

                {/* Sample Artworks / Badges */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Or Try Sample Graphics
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {SAMPLE_STICKERS.map((sticker) => (
                      <button
                        key={sticker.name}
                        onClick={() => handleSelectSampleSticker(sticker.url)}
                        className="p-2.5 rounded-xl border border-border/70 hover:border-primary/60 hover:bg-muted/40 transition-all flex flex-col items-center gap-1 text-[11px] font-medium"
                      >
                        <img
                          src={sticker.url}
                          alt={sticker.name}
                          className="size-8 object-contain"
                        />
                        <span className="truncate w-full text-center text-muted-foreground">
                          {sticker.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Image Controls (Scale, Rotate, Flip, Opacity) */}
                {uploadedImageSrc && (
                  <div className="space-y-4 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Artwork Adjustment
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadedImageSrc(null)}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1 px-2"
                      >
                        <Trash2 className="size-3" />
                        <span>Remove</span>
                      </Button>
                    </div>

                    {/* Scale Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Size / Scale</span>
                        <span className="font-mono font-medium">{Math.round(imageScale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.3"
                        max="2.5"
                        step="0.05"
                        value={imageScale}
                        onChange={(e) => setImageScale(parseFloat(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Rotation Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Rotation Angle</span>
                        <span className="font-mono font-medium">{imageRotation}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="5"
                        value={imageRotation}
                        onChange={(e) => setImageRotation(parseInt(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Quick Flip & Rotate Actions */}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                        className="h-9 gap-1 text-xs"
                      >
                        <RotateCw className="size-3.5" />
                        <span>+90°</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImageRotation((prev) => (prev - 90 + 360) % 360)}
                        className="h-9 gap-1 text-xs"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>-90°</span>
                      </Button>

                      <Button
                        variant={imageFlipH ? "default" : "outline"}
                        size="sm"
                        onClick={() => setImageFlipH(!imageFlipH)}
                        className="h-9 gap-1 text-xs"
                      >
                        <FlipHorizontal className="size-3.5" />
                        <span>Flip H</span>
                      </Button>

                      <Button
                        variant={imageFlipV ? "default" : "outline"}
                        size="sm"
                        onClick={() => setImageFlipV(!imageFlipV)}
                        className="h-9 gap-1 text-xs"
                      >
                        <FlipVertical className="size-3.5" />
                        <span>Flip V</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CUSTOM TEXT CONTROLS */}
            {activeTab === "text" && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Custom Text / Tagline
                    </Label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showText}
                        onChange={(e) => setShowText(e.target.checked)}
                        className="rounded border-border accent-primary cursor-pointer"
                      />
                      <span>Enable Text Layer</span>
                    </label>
                  </div>
                  <Input
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Enter custom slogan, name, or quote..."
                    className="h-11 text-sm font-medium"
                  />
                </div>

                {/* Font Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Typography Style
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => setFontFamily(f.family)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                          fontFamily === f.family
                            ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                            : "border-border/80 hover:bg-muted/40 text-muted-foreground"
                        }`}
                        style={{ fontFamily: f.family }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Color Swatches */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Print Ink Color
                  </Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {TEXT_COLOR_OPTIONS.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => setTextColor(hex)}
                        className={`size-7 rounded-full border transition-all ${
                          textColor === hex
                            ? "ring-2 ring-primary ring-offset-2 scale-110"
                            : "border-border/80 hover:scale-105"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Font Size & Weight Controls */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Font Size</span>
                      <span className="font-mono font-medium">{fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="14"
                      max="48"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={isBold ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsBold(!isBold)}
                      className="h-9 gap-1.5 text-xs flex-1"
                    >
                      <Bold className="size-3.5" />
                      <span>Bold</span>
                    </Button>

                    <Button
                      variant={isItalic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsItalic(!isItalic)}
                      className="h-9 gap-1.5 text-xs flex-1"
                    >
                      <Italic className="size-3.5" />
                      <span>Italic</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTextRotation((prev) => (prev + 45) % 360)}
                      className="h-9 gap-1.5 text-xs flex-1"
                    >
                      <RotateCw className="size-3.5" />
                      <span>Rotate</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PRODUCT OPTIONS & VOLUME PRICING */}
            {activeTab === "product" && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                {/* Size Selector for Apparel */}
                {activePreset.type === "tshirt" && (
                  <div className="space-y-2.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Garment Size
                    </Label>
                    <div className="grid grid-cols-5 gap-2">
                      {["S", "M", "L", "XL", "2XL"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                            selectedSize === size
                              ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                              : "border-border/80 hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Quantity Required
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 5, 10, 25, 50, 100].map((qty) => (
                      <button
                        key={qty}
                        onClick={() => setQuantity(qty)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          quantity === qty
                            ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                            : "border-border/80 hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {qty} {qty === 1 ? "Pc" : "Pcs"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Production & Print Notes */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1.5 text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Info className="size-3.5 text-primary" />
                    <span>Print Quality Guarantee</span>
                  </div>
                  <p>
                    All merchandise is printed using high-definition DTF / Sublimation with wash-tested
                    durability (up to 50+ washes). Color fastness and edge sharpness assured.
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Price & Summary */}
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Customized Price
                </span>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">
                  ₹{subtotal.toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-muted-foreground">
                  ₹{unitPrice} / piece × {quantity} {quantity === 1 ? "piece" : "pieces"}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadMockup}
                  disabled={isExporting}
                  className="h-10 text-xs gap-1.5"
                  title="Download composited mockup image"
                >
                  <Download className="size-3.5" />
                  <span>Mockup</span>
                </Button>

                {uploadedImageSrc && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPrintFile}
                    className="h-10 text-xs gap-1.5"
                    title="Export 300 DPI transparent production file"
                  >
                    <Layers className="size-3.5" />
                    <span>Print File</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Action Buttons: Add to Cart & WhatsApp */}
            <div className="flex flex-col gap-2.5 pt-1">
              <Button
                size="lg"
                onClick={handleAddToCartCustomized}
                disabled={isAddingCart}
                className="w-full gap-2.5 h-12 text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all cursor-pointer"
              >
                <ShoppingBag className="size-4.5" />
                <span>
                  {isAddingCart
                    ? "Adding to Cart..."
                    : `Add to Cart • ₹${subtotal.toLocaleString("en-IN")}`}
                </span>
              </Button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 h-11 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                >
                  <MessageCircle className="size-4" />
                  Order / Approve Design via WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
