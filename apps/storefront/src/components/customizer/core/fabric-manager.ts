import { Canvas, FabricImage, Rect, FabricText, type FabricObject } from "fabric"
import type { NormalizedRect, PrintPositionConfig } from "../config/tshirt-mockups"

export interface ArtworkLayerInfo {
  id: string
  name: string
  url: string
  width: number
  height: number
  scaleX: number
  scaleY: number
  angle: number
  left: number
  top: number
  opacity: number
}

export interface SerializedArtwork {
  id: string
  name: string
  dataUrl: string
  left: number
  top: number
  scaleX: number
  scaleY: number
  angle: number
  flipX: boolean
  flipY: boolean
  opacity: number
}

export interface UploadedArtworkSummary {
  id: string
  name: string
  url: string
  view: "front" | "back"
}

export interface FabricManagerOptions {
  canvasEl: HTMLCanvasElement
  containerEl: HTMLElement
  baseWidth: number
  baseHeight: number
  currentViewId: "front" | "back"
  printPosition: PrintPositionConfig
  mockupImageUrl: string
  onSelectionChange?: (selectedLayer: ArtworkLayerInfo | null) => void
  onLayersChange?: (layers: ArtworkLayerInfo[]) => void
  onAllArtworksChange?: (artworks: UploadedArtworkSummary[]) => void
  onTriggerUpload?: () => void
  onError?: (message: string) => void
}

/**
 * FabricManager
 *
 * Encapsulates all Fabric.js canvas logic:
 * - Layer 1: Background Mockup (locked, unselectable)
 * - Layer 2: Printable Region & Clipping Path
 * - Layer 3: Customer Artwork (multi-object, boundary clamping, transforms)
 * - Per-View state preservation (Front/Back views retain separate artworks)
 * - Layer ordering (Bring Forward, Send Backward, Bring to Front, Send to Back)
 * - Responsive zoom handling (preserves original coordinates)
 */
export class FabricManager {
  private canvas: Canvas | null = null
  private containerEl: HTMLElement
  private baseWidth: number
  private baseHeight: number
  private currentViewId: "front" | "back"
  private printPosition: PrintPositionConfig
  private mockupImageUrl: string
  private onSelectionChange?: (selectedLayer: ArtworkLayerInfo | null) => void
  private onLayersChange?: (layers: ArtworkLayerInfo[]) => void
  private onAllArtworksChange?: (artworks: UploadedArtworkSummary[]) => void
  private onTriggerUpload?: () => void
  private onError?: (message: string) => void

  private guideRect: Rect | null = null
  private placeholderText: FabricText | null = null
  private clipRect: Rect | null = null
  private showGuides: boolean = true
  private resizeObserver: ResizeObserver | null = null
  private currentZoom: number = 1
  private zoomLevel: number = 1.0

  // Per-view state store for preserving artworks across front/back transitions
  private viewArtworkStore: Record<"front" | "back", SerializedArtwork[]> = {
    front: [],
    back: []
  }

  constructor(options: FabricManagerOptions) {
    this.containerEl = options.containerEl
    this.baseWidth = options.baseWidth
    this.baseHeight = options.baseHeight
    this.currentViewId = options.currentViewId
    this.printPosition = options.printPosition
    this.mockupImageUrl = options.mockupImageUrl
    this.onSelectionChange = options.onSelectionChange
    this.onLayersChange = options.onLayersChange
    this.onAllArtworksChange = options.onAllArtworksChange
    this.onTriggerUpload = options.onTriggerUpload
    this.onError = options.onError

    this.initCanvas(options.canvasEl)
  }

  private async initCanvas(canvasEl: HTMLCanvasElement) {
    // 1. Initialize Fabric Canvas with original mockup dimensions
    this.canvas = new Canvas(canvasEl, {
      width: this.baseWidth,
      height: this.baseHeight,
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      targetFindTolerance: 8
    })

    // Configure selection style
    this.canvas.selectionColor = "rgba(37, 99, 235, 0.15)"
    this.canvas.selectionBorderColor = "#2563EB"
    this.canvas.selectionLineWidth = 1.5

    // 2. Setup Layer 1: Mockup Background
    await this.loadMockupBackground(this.mockupImageUrl)

    // 3. Setup Layer 2: Printable Area & Guide
    this.setupPrintableArea()

    // 4. Attach event listeners
    this.attachEventListeners()

    // 5. Setup Responsive Scaling
    this.setupResponsiveScaling()

    this.notifyLayersChange()
  }

  /**
   * Layer 1: Load mockup background image (never selectable, draggable or editable)
   */
  public async loadMockupBackground(imageUrl: string) {
    if (!this.canvas) return
    this.mockupImageUrl = imageUrl

    try {
      const bgImg = await FabricImage.fromURL(imageUrl, {
        crossOrigin: "anonymous"
      })

      // Lock all transformations
      bgImg.set({
        originX: "left",
        originY: "top",
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true
      })

      bgImg.scaleToWidth(this.baseWidth)
      bgImg.scaleToHeight(this.baseHeight)

      this.canvas.backgroundImage = bgImg
      this.canvas.renderAll()
    } catch (err: any) {
      console.error("Failed to load mockup background:", err)
      this.onError?.("Could not load product mockup image.")
    }
  }

  /**
   * Switch View (Front <-> Back) with artwork state preservation
   */
  public async switchView(
    targetViewId: "front" | "back",
    newMockupUrl: string,
    newPrintPosition: PrintPositionConfig
  ) {
    if (!this.canvas || targetViewId === this.currentViewId) return

    // 1. Serialize current view's active artworks
    this.viewArtworkStore[this.currentViewId] = this.serializeCurrentArtworks()

    // 2. Discard selection and remove current artwork objects from canvas
    this.canvas.discardActiveObject()
    const currentArtworks = this.getArtworkObjects()
    currentArtworks.forEach((obj) => this.canvas?.remove(obj))

    // 3. Update active view state
    this.currentViewId = targetViewId
    this.printPosition = newPrintPosition

    // 4. Load new view mockup background
    await this.loadMockupBackground(newMockupUrl)

    // 5. Setup new view printable area & clipping rect
    this.setupPrintableArea(newPrintPosition)

    // 6. Restore previously saved artworks for target view (if any)
    const saved = this.viewArtworkStore[targetViewId] || []
    for (const art of saved) {
      await this.restoreArtworkObject(art)
    }

    this.canvas.renderAll()
    this.notifyLayersChange()
    this.notifySelectionChange(null)
  }

  /**
   * Switch Colour without losing currently placed artworks
   */
  public async switchColor(newMockupUrl: string) {
    await this.loadMockupBackground(newMockupUrl)
  }

  /**
   * Layer 2: Setup printable area boundary guide, placeholder, and clipping path
   */
  public setupPrintableArea(newPosition?: PrintPositionConfig, adaptArtwork: boolean = true) {
    if (!this.canvas) return
    const prevPosition = this.printPosition
    if (newPosition) {
      this.printPosition = newPosition
    }

    const { x, y, width, height } = this.printPosition.printArea
    const absLeft = Math.round(x * this.baseWidth)
    const absTop = Math.round(y * this.baseHeight)
    const absWidth = Math.round(width * this.baseWidth)
    const absHeight = Math.round(height * this.baseHeight)

    // 1. Create clipping rectangle (Layer 2 clipping mask)
    this.clipRect = new Rect({
      left: absLeft,
      top: absTop,
      width: absWidth,
      height: absHeight,
      originX: "left",
      originY: "top",
      absolutePositioned: true
    })

    // 2. Remove existing guide & placeholder
    if (this.guideRect) {
      this.canvas.remove(this.guideRect)
      this.guideRect = null
    }
    if (this.placeholderText) {
      this.canvas.remove(this.placeholderText)
      this.placeholderText = null
    }

    const hasArtwork = this.getArtworkObjects().length > 0

    // 3. Create printable region visual guide rectangle (green dashed outline matching test photo)
    this.guideRect = new Rect({
      left: absLeft,
      top: absTop,
      width: absWidth,
      height: absHeight,
      originX: "left",
      originY: "top",
      fill: hasArtwork ? "transparent" : "rgba(22, 163, 74, 0.04)",
      stroke: "#16a34a",
      strokeWidth: 2,
      strokeDashArray: [6, 4],
      selectable: false,
      evented: !hasArtwork,
      hoverCursor: !hasArtwork ? "pointer" : "default",
      hasControls: false,
      hasBorders: false,
      visible: this.showGuides
    })

    // 4. Create placeholder text
    const fontSize = Math.max(12, Math.min(Math.round(absWidth * 0.045), 18))
    this.placeholderText = new FabricText(
      `+ Upload Design\n(${this.printPosition.physicalSizeLabel})`,
      {
        left: absLeft + absWidth / 2,
        top: absTop + absHeight / 2,
        originX: "center",
        originY: "center",
        fontSize: fontSize,
        fontFamily: "sans-serif",
        fontWeight: "bold",
        fill: "#15803d",
        textAlign: "center",
        selectable: false,
        evented: !hasArtwork,
        hoverCursor: "pointer",
        visible: !hasArtwork && this.showGuides
      }
    )

    const triggerUpload = () => {
      this.onTriggerUpload?.()
    }

    this.guideRect.on("mousedown", () => {
      if (this.getArtworkObjects().length === 0) {
        triggerUpload()
      }
    })

    this.placeholderText.on("mousedown", () => {
      triggerUpload()
    })

    this.canvas.add(this.guideRect)
    this.canvas.add(this.placeholderText)
    this.canvas.bringObjectToFront(this.placeholderText)

    // 5. Adapt artwork objects if switching position
    const artworks = this.getArtworkObjects()
    if (adaptArtwork && newPosition && prevPosition && prevPosition.id !== newPosition.id && artworks.length > 0) {
      this.adaptArtworksToNewPosition(artworks, prevPosition, newPosition)
    } else {
      artworks.forEach((obj) => {
        obj.clipPath = this.clipRect
        this.clampObjectToBounds(obj)
      })
    }

    this.canvas.renderAll()
  }

  /**
   * Repositions and scales artworks seamlessly to fit the newly selected printing area
   */
  private adaptArtworksToNewPosition(
    artworks: FabricObject[],
    oldPos: PrintPositionConfig,
    newPos: PrintPositionConfig
  ) {
    const newPa = {
      left: Math.round(newPos.printArea.x * this.baseWidth),
      top: Math.round(newPos.printArea.y * this.baseHeight),
      width: Math.round(newPos.printArea.width * this.baseWidth),
      height: Math.round(newPos.printArea.height * this.baseHeight)
    }

    artworks.forEach((obj) => {
      obj.clipPath = this.clipRect

      // Center within the new print area
      const newCenterX = newPa.left + newPa.width / 2
      const newCenterY = newPa.top + newPa.height / 2

      // Fit comfortably inside 75% of new print area
      const maxW = newPa.width * 0.75
      const maxH = newPa.height * 0.75
      const origW = obj.width || 100
      const origH = obj.height || 100

      const newScale = Math.min(maxW / origW, maxH / origH, 1)

      obj.set({
        originX: "center",
        originY: "center",
        left: newCenterX,
        top: newCenterY,
        scaleX: newScale,
        scaleY: newScale,
        angle: 0
      })

      this.clampObjectToBounds(obj)
    })
  }

  public updatePlaceholderVisibility() {
    const hasArtwork = this.getArtworkObjects().length > 0
    if (this.placeholderText) {
      this.placeholderText.set({
        visible: !hasArtwork && this.showGuides,
        evented: !hasArtwork
      })
    }
    if (this.guideRect) {
      this.guideRect.set({
        fill: hasArtwork ? "transparent" : "rgba(22, 163, 74, 0.04)",
        evented: !hasArtwork,
        hoverCursor: !hasArtwork ? "pointer" : "default"
      })
      if (!hasArtwork) {
        this.canvas.bringObjectToFront(this.guideRect)
        if (this.placeholderText) {
          this.canvas.bringObjectToFront(this.placeholderText)
        }
      }
    }
  }

  /**
   * Helper to retrieve only customer artwork objects (excluding guides/placeholders)
   */
  public getArtworkObjects(): FabricObject[] {
    if (!this.canvas) return []
    return this.canvas.getObjects().filter((obj) => obj !== this.guideRect && obj !== this.placeholderText)
  }

  /**
   * Layer 3: Add Customer Artwork Image (supports multiple images)
   */
  public async addArtworkImage(dataUrl: string, fileName?: string): Promise<FabricObject | null> {
    if (!this.canvas || !this.clipRect) return null

    if (this.getTotalArtworkCount() >= 2) {
      this.onError?.("Maximum of 2 images allowed across views.")
      return null
    }

    try {
      const imgObj = await FabricImage.fromURL(dataUrl, {
        crossOrigin: "anonymous"
      })

      const pa = this.getAbsolutePrintArea()

      // Calculate initial scale to fit comfortably (70%) inside printable area
      const maxInitialWidth = pa.width * 0.75
      const maxInitialHeight = pa.height * 0.75
      const origW = imgObj.width || 100
      const origH = imgObj.height || 100

      const scale = Math.min(maxInitialWidth / origW, maxInitialHeight / origH, 1)

      // Center within printable area
      const centerX = pa.left + pa.width / 2
      const centerY = pa.top + pa.height / 2

      imgObj.set({
        originX: "center",
        originY: "center",
        left: centerX,
        top: centerY,
        scaleX: scale,
        scaleY: scale,
        clipPath: this.clipRect,
        // Selection handle aesthetics
        cornerColor: "#2563EB",
        cornerStyle: "circle",
        cornerSize: 12,
        transparentCorners: false,
        borderColor: "#2563EB",
        borderDashArray: [4, 4],
        borderScaleFactor: 1.5,
        // Custom identifier
        data: {
          id: `artwork-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: fileName || `Artwork ${this.getArtworkObjects().length + 1}`,
          originalUrl: dataUrl
        }
      })

      // Enforce uniform scaling to maintain aspect ratio
      imgObj.setControlsVisibility({
        ml: false,
        mr: false,
        mt: false,
        mb: false
      })

      this.canvas.add(imgObj)
      this.canvas.setActiveObject(imgObj)
      this.updatePlaceholderVisibility()

      // Ensure guide stays on top
      if (this.guideRect) {
        this.canvas.bringObjectToFront(this.guideRect)
      }

      this.clampObjectToBounds(imgObj)
      this.canvas.renderAll()
      this.notifyLayersChange()
      this.notifySelectionChange(imgObj)

      return imgObj
    } catch (err: any) {
      console.error("Failed to add artwork image:", err)
      this.onError?.("Failed to process uploaded image on canvas.")
      return null
    }
  }

  /**
   * Delete active or specified artwork
   */
  public removeArtwork(objectId?: string) {
    if (!this.canvas) return

    if (objectId) {
      const target = this.getArtworkObjects().find((obj) => (obj.data as any)?.id === objectId)
      if (target) {
        this.canvas.remove(target)
      } else {
        if (this.viewArtworkStore.front) {
          this.viewArtworkStore.front = this.viewArtworkStore.front.filter((art) => art.id !== objectId)
        }
        if (this.viewArtworkStore.back) {
          this.viewArtworkStore.back = this.viewArtworkStore.back.filter((art) => art.id !== objectId)
        }
      }
    } else {
      const active = this.canvas.getActiveObject()
      if (active && active !== this.guideRect && active !== this.placeholderText) {
        this.canvas.remove(active)
      }
    }

    this.updatePlaceholderVisibility()
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
    this.notifyLayersChange()
    this.notifySelectionChange(null)
  }

  /**
   * Select a specific artwork by ID
   */
  public selectArtwork(objectId: string) {
    if (!this.canvas) return
    const target = this.getArtworkObjects().find((obj) => (obj.data as any)?.id === objectId)
    if (target) {
      this.canvas.setActiveObject(target)
      this.canvas.renderAll()
      this.notifySelectionChange(target)
    }
  }

  /**
   * Layer Ordering Controls: Bring Forward, Send Backward, Bring to Front, Send to Back
   */
  public bringForward(objectId?: string) {
    if (!this.canvas) return
    const obj = objectId
      ? this.getArtworkObjects().find((o) => (o.data as any)?.id === objectId)
      : this.canvas.getActiveObject()

    if (obj && obj !== this.guideRect) {
      this.canvas.bringObjectForward(obj)
      if (this.guideRect) this.canvas.bringObjectToFront(this.guideRect)
      this.canvas.renderAll()
      this.notifyLayersChange()
    }
  }

  public sendBackward(objectId?: string) {
    if (!this.canvas) return
    const obj = objectId
      ? this.getArtworkObjects().find((o) => (o.data as any)?.id === objectId)
      : this.canvas.getActiveObject()

    if (obj && obj !== this.guideRect) {
      this.canvas.sendObjectBackwards(obj)
      this.canvas.renderAll()
      this.notifyLayersChange()
    }
  }

  public bringToFront(objectId?: string) {
    if (!this.canvas) return
    const obj = objectId
      ? this.getArtworkObjects().find((o) => (o.data as any)?.id === objectId)
      : this.canvas.getActiveObject()

    if (obj && obj !== this.guideRect) {
      this.canvas.bringObjectToFront(obj)
      if (this.guideRect) this.canvas.bringObjectToFront(this.guideRect)
      this.canvas.renderAll()
      this.notifyLayersChange()
    }
  }

  public sendToBack(objectId?: string) {
    if (!this.canvas) return
    const obj = objectId
      ? this.getArtworkObjects().find((o) => (o.data as any)?.id === objectId)
      : this.canvas.getActiveObject()

    if (obj && obj !== this.guideRect) {
      this.canvas.sendObjectToBack(obj)
      this.canvas.renderAll()
      this.notifyLayersChange()
    }
  }

  /**
   * Rotate active object by delta degrees
   */
  public rotateActiveObject(angleDelta: number) {
    const active = this.canvas?.getActiveObject()
    if (!active || active === this.guideRect) return

    const currentAngle = active.angle || 0
    active.rotate((currentAngle + angleDelta + 360) % 360)
    this.clampObjectToBounds(active)
    this.canvas?.renderAll()
    this.notifySelectionChange(active)
  }

  /**
   * Set exact rotation angle
   */
  public setActiveObjectAngle(angle: number) {
    const active = this.canvas?.getActiveObject()
    if (!active || active === this.guideRect) return

    active.rotate(angle)
    this.clampObjectToBounds(active)
    this.canvas?.renderAll()
    this.notifySelectionChange(active)
  }

  /**
   * Set exact scale multiplier
   */
  public setActiveObjectScale(scale: number) {
    const active = this.canvas?.getActiveObject()
    if (!active || active === this.guideRect) return

    active.scale(scale)
    this.clampObjectToBounds(active)
    this.canvas?.renderAll()
    this.notifySelectionChange(active)
  }

  /**
   * Center active object inside printable area
   */
  public centerActiveObject() {
    const active = this.canvas?.getActiveObject()
    if (!active || active === this.guideRect) return

    const pa = this.getAbsolutePrintArea()
    active.set({
      left: pa.left + pa.width / 2,
      top: pa.top + pa.height / 2
    })
    this.canvas?.renderAll()
    this.notifySelectionChange(active)
  }

  /**
   * Flip active object horizontally
   */
  public flipActiveObjectH() {
    const active = this.canvas?.getActiveObject()
    if (!active || active === this.guideRect) return

    active.set("flipX", !active.flipX)
    this.canvas?.renderAll()
  }

  /**
   * Flip active object vertically
   */
  public flipActiveObjectV() {
    const active = this.canvas?.getActiveObject()
    if (!active || active === this.guideRect) return

    active.set("flipY", !active.flipY)
    this.canvas?.renderAll()
  }

  /**
   * Toggle guide visibility
   */
  public setGuideVisible(visible: boolean) {
    this.showGuides = visible
    const hasArtwork = this.getArtworkObjects().length > 0
    if (this.guideRect && this.canvas) {
      this.guideRect.set("visible", visible)
    }
    if (this.placeholderText && this.canvas) {
      this.placeholderText.set("visible", !hasArtwork && visible)
    }
    this.canvas?.renderAll()
  }

  /**
   * Clamps an object's position during dragging so it cannot be dragged completely
   * off-screen or off the garment, while allowing the artwork to extend outside the
   * printable region to crop inside the placeholder box.
   */
  private clampMoving(obj: FabricObject) {
    const pa = this.getAbsolutePrintArea()
    obj.setCoords()
    const bound = obj.getBoundingRect()

    // Minimum overlap with printable box so the user never loses the artwork
    const MIN_OVERLAP = 30
    let leftDelta = 0
    let topDelta = 0

    // Right edge of object must not go left of pa.left + MIN_OVERLAP
    if (bound.left + bound.width < pa.left + MIN_OVERLAP) {
      leftDelta = (pa.left + MIN_OVERLAP) - (bound.left + bound.width)
    }
    // Left edge of object must not go right of pa.left + pa.width - MIN_OVERLAP
    else if (bound.left > pa.left + pa.width - MIN_OVERLAP) {
      leftDelta = (pa.left + pa.width - MIN_OVERLAP) - bound.left
    }

    // Bottom edge of object must not go above pa.top + MIN_OVERLAP
    if (bound.top + bound.height < pa.top + MIN_OVERLAP) {
      topDelta = (pa.top + MIN_OVERLAP) - (bound.top + bound.height)
    }
    // Top edge of object must not go below pa.top + pa.height - MIN_OVERLAP
    else if (bound.top > pa.top + pa.height - MIN_OVERLAP) {
      topDelta = (pa.top + pa.height - MIN_OVERLAP) - bound.top
    }

    if (leftDelta !== 0 || topDelta !== 0) {
      obj.set({
        left: (obj.left || 0) + leftDelta,
        top: (obj.top || 0) + topDelta
      })
      obj.setCoords()
    }
  }

  /**
   * Smooth scaling constraint:
   * Allows scaling the artwork larger than the placeholder box so it can be cropped,
   * while enforcing sensible min and max zoom limits without transform jitter.
   */
  private clampScaling(
    obj: FabricObject,
    lastValid: { scaleX: number; scaleY: number; left: number; top: number } | null
  ) {
    obj.setCoords()

    // Minimum scale safeguard (at least 20px)
    const minScale = Math.max(20 / (obj.width || 100), 0.02)
    // Maximum scale safeguard: up to 4x the canvas dimensions (allows deep zoom-in for cropping)
    const maxScale = Math.max((this.baseWidth * 4) / (obj.width || 100), 8)

    const currentScale = obj.scaleX || 1

    if (currentScale < minScale) {
      obj.set({ scaleX: minScale, scaleY: minScale })
      obj.setCoords()
    } else if (currentScale > maxScale) {
      if (lastValid) {
        obj.set({
          scaleX: lastValid.scaleX,
          scaleY: lastValid.scaleY,
          left: lastValid.left,
          top: lastValid.top
        })
      } else {
        obj.set({ scaleX: maxScale, scaleY: maxScale })
      }
      obj.setCoords()
    } else if (lastValid) {
      lastValid.scaleX = obj.scaleX || 1
      lastValid.scaleY = obj.scaleY || 1
      lastValid.left = obj.left || 0
      lastValid.top = obj.top || 0
    }
  }

  /**
   * Smooth rotation constraint:
   * Allows rotating 360 degrees freely while tracking valid transform state.
   */
  private clampRotating(
    obj: FabricObject,
    lastValid: { scaleX: number; scaleY: number; left: number; top: number; angle: number } | null
  ) {
    if (lastValid) {
      lastValid.angle = obj.angle || 0
      lastValid.left = obj.left || 0
      lastValid.top = obj.top || 0
    }
  }

  /**
   * Bounding clamp (used when placing, centering, restoring or on object:modified):
   * Ensures the artwork overlaps the printable region without forcing it to shrink smaller than the box.
   */
  public clampObjectToBounds(obj: FabricObject) {
    const pa = this.getAbsolutePrintArea()
    obj.setCoords()

    // Minimum and maximum scale safeguard
    const minScale = Math.max(20 / (obj.width || 100), 0.02)
    const maxScale = Math.max((this.baseWidth * 4) / (obj.width || 100), 8)

    if ((obj.scaleX || 1) < minScale) {
      obj.set({ scaleX: minScale, scaleY: minScale })
      obj.setCoords()
    } else if ((obj.scaleX || 1) > maxScale) {
      obj.set({ scaleX: maxScale, scaleY: maxScale })
      obj.setCoords()
    }

    const bound = obj.getBoundingRect()
    const MIN_OVERLAP = 30
    let leftDelta = 0
    let topDelta = 0

    if (bound.left + bound.width < pa.left + MIN_OVERLAP) {
      leftDelta = (pa.left + MIN_OVERLAP) - (bound.left + bound.width)
    } else if (bound.left > pa.left + pa.width - MIN_OVERLAP) {
      leftDelta = (pa.left + pa.width - MIN_OVERLAP) - bound.left
    }

    if (bound.top + bound.height < pa.top + MIN_OVERLAP) {
      topDelta = (pa.top + MIN_OVERLAP) - (bound.top + bound.height)
    } else if (bound.top > pa.top + pa.height - MIN_OVERLAP) {
      topDelta = (pa.top + pa.height - MIN_OVERLAP) - bound.top
    }

    if (leftDelta !== 0 || topDelta !== 0) {
      obj.set({
        left: (obj.left || 0) + leftDelta,
        top: (obj.top || 0) + topDelta
      })
      obj.setCoords()
    }
  }

  /**
   * Serialization & Restoration helpers for view switching
   */
  private serializeCurrentArtworks(): SerializedArtwork[] {
    return this.getArtworkObjects().map((obj) => {
      const data = (obj.data as any) || {}
      return {
        id: data.id || `art-${Date.now()}`,
        name: data.name || "Artwork",
        dataUrl: data.originalUrl || "",
        left: obj.left || 0,
        top: obj.top || 0,
        scaleX: obj.scaleX || 1,
        scaleY: obj.scaleY || 1,
        angle: obj.angle || 0,
        flipX: obj.flipX || false,
        flipY: obj.flipY || false,
        opacity: obj.opacity || 1
      }
    })
  }

  private async restoreArtworkObject(art: SerializedArtwork) {
    if (!this.canvas || !this.clipRect || !art.dataUrl) return

    try {
      const imgObj = await FabricImage.fromURL(art.dataUrl, {
        crossOrigin: "anonymous"
      })

      imgObj.set({
        originX: "center",
        originY: "center",
        left: art.left,
        top: art.top,
        scaleX: art.scaleX,
        scaleY: art.scaleY,
        angle: art.angle,
        flipX: art.flipX,
        flipY: art.flipY,
        opacity: art.opacity,
        clipPath: this.clipRect,
        cornerColor: "#2563EB",
        cornerStyle: "circle",
        cornerSize: 12,
        transparentCorners: false,
        borderColor: "#2563EB",
        borderDashArray: [4, 4],
        borderScaleFactor: 1.5,
        data: {
          id: art.id,
          name: art.name,
          originalUrl: art.dataUrl
        }
      })

      imgObj.setControlsVisibility({
        ml: false,
        mr: false,
        mt: false,
        mb: false
      })

      this.canvas.add(imgObj)
      this.clampObjectToBounds(imgObj)
    } catch (err) {
      console.error("Failed to restore artwork object:", err)
    }
  }

  /**
   * Attach Fabric canvas event listeners
   */
  private attachEventListeners() {
    if (!this.canvas) return

    let lastValidScale: {
      scaleX: number
      scaleY: number
      left: number
      top: number
    } | null = null

    let lastValidRotate: {
      scaleX: number
      scaleY: number
      left: number
      top: number
      angle: number
    } | null = null

    this.canvas.on("before:transform", (e) => {
      const target = (e as any).transform?.target || this.canvas?.getActiveObject()
      if (target && target !== this.guideRect) {
        lastValidScale = {
          scaleX: target.scaleX || 1,
          scaleY: target.scaleY || 1,
          left: target.left || 0,
          top: target.top || 0
        }
        lastValidRotate = {
          scaleX: target.scaleX || 1,
          scaleY: target.scaleY || 1,
          left: target.left || 0,
          top: target.top || 0,
          angle: target.angle || 0
        }
      }
    })

    this.canvas.on("object:moving", (e) => {
      if (e.target && e.target !== this.guideRect) {
        this.clampMoving(e.target)
      }
    })

    this.canvas.on("object:scaling", (e) => {
      if (e.target && e.target !== this.guideRect) {
        this.clampScaling(e.target, lastValidScale)
      }
    })

    this.canvas.on("object:rotating", (e) => {
      if (e.target && e.target !== this.guideRect) {
        this.clampRotating(e.target, lastValidRotate)
      }
    })

    this.canvas.on("selection:created", (e) => {
      const selected = e.selected?.[0]
      this.notifySelectionChange(selected && selected !== this.guideRect ? selected : null)
    })

    this.canvas.on("selection:updated", (e) => {
      const selected = e.selected?.[0]
      this.notifySelectionChange(selected && selected !== this.guideRect ? selected : null)
    })

    this.canvas.on("selection:cleared", () => {
      this.notifySelectionChange(null)
    })

    this.canvas.on("object:modified", (e) => {
      if (e.target && e.target !== this.guideRect) {
        this.clampObjectToBounds(e.target)
      }
      this.notifyLayersChange()
      const active = this.canvas?.getActiveObject()
      this.notifySelectionChange(active && active !== this.guideRect ? active : null)
    })
  }

  /**
   * Helper: Absolute pixel rectangle of print area
   */
  private getAbsolutePrintArea() {
    const { x, y, width, height } = this.printPosition.printArea
    return {
      left: Math.round(x * this.baseWidth),
      top: Math.round(y * this.baseHeight),
      width: Math.round(width * this.baseWidth),
      height: Math.round(height * this.baseHeight)
    }
  }

  /**
   * Zoom Controls (Zoom In, Zoom Out, Reset)
   */
  public zoomIn(step = 0.2): number {
    return this.setZoomLevel(this.zoomLevel + step)
  }

  public zoomOut(step = 0.2): number {
    return this.setZoomLevel(this.zoomLevel - step)
  }

  public resetZoom(): number {
    return this.setZoomLevel(1.0)
  }

  public getZoomLevel(): number {
    return this.zoomLevel
  }

  public setZoomLevel(level: number): number {
    this.zoomLevel = Math.max(0.6, Math.min(2.5, Math.round(level * 100) / 100))
    this.handleResize()
    return this.zoomLevel
  }

  /**
   * Responsive canvas handling:
   * Sets canvas zoom and dimensions matching the container,
   * fitting both width and height without overflowing or altering coordinates.
   */
  public handleResize() {
    if (!this.canvas || !this.containerEl) return

    const containerWidth = this.containerEl.clientWidth || 400
    const containerHeight = this.containerEl.clientHeight || 400

    // Compute scale so the mockup fits entirely within container bounds in both dimensions.
    // Apply 0.78 * zoomLevel factor to allow responsive user-controlled zoom.
    const FIT_RATIO = 0.78 * this.zoomLevel
    const scaleX = containerWidth / this.baseWidth
    const scaleY = containerHeight / this.baseHeight
    const zoom = Math.min(scaleX, scaleY) * FIT_RATIO
    this.currentZoom = zoom

    const displayWidth = Math.round(this.baseWidth * zoom)
    const displayHeight = Math.round(this.baseHeight * zoom)

    this.canvas.setDimensions({
      width: displayWidth,
      height: displayHeight
    })
    this.canvas.setZoom(zoom)
    this.canvas.renderAll()
  }

  private handleWindowResize = () => {
    this.handleResize()
  }

  private setupResponsiveScaling() {
    this.handleResize()

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize()
      })
      this.resizeObserver.observe(this.containerEl)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.handleWindowResize)
    }
  }

  private notifySelectionChange(obj: FabricObject | null) {
    if (!obj || obj === this.guideRect) {
      this.onSelectionChange?.(null)
      return
    }

    const data = (obj.data as any) || {}
    this.onSelectionChange?.({
      id: data.id || "artwork",
      name: data.name || "Uploaded Artwork",
      url: data.originalUrl || "",
      width: obj.width || 0,
      height: obj.height || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      angle: obj.angle || 0,
      left: obj.left || 0,
      top: obj.top || 0,
      opacity: obj.opacity || 1
    })
  }

  private notifyLayersChange() {
    // Return layers in top-to-bottom visual order (reverse of canvas stack)
    const layers: ArtworkLayerInfo[] = [...this.getArtworkObjects()].reverse().map((obj, idx) => {
      const data = (obj.data as any) || {}
      return {
        id: data.id || `layer-${idx}`,
        name: data.name || `Artwork ${idx + 1}`,
        url: data.originalUrl || "",
        width: obj.width || 0,
        height: obj.height || 0,
        scaleX: obj.scaleX || 1,
        scaleY: obj.scaleY || 1,
        angle: obj.angle || 0,
        left: obj.left || 0,
        top: obj.top || 0,
        opacity: obj.opacity || 1
      }
    })
    this.onLayersChange?.(layers)
    this.onAllArtworksChange?.(this.getAllUploadedArtworks())
  }

  /**
   * Export Mockup Preview (combines T-shirt background + artwork)
   */
  public exportMockupPreview(): string {
    if (!this.canvas) return ""
    const wasGuideVisible = this.showGuides
    this.setGuideVisible(false)
    this.canvas.discardActiveObject()
    this.canvas.renderAll()

    const dataUrl = this.canvas.toDataURL({
      format: "png",
      multiplier: 1 / this.currentZoom
    })

    this.setGuideVisible(wasGuideVisible)
    return dataUrl
  }

  /**
   * Export Production Artwork (Transparent, only artwork in print area, no shirt mockup)
   */
  public exportProductionArtwork(): string {
    if (!this.canvas) return ""
    const pa = this.getAbsolutePrintArea()

    const originalBg = this.canvas.backgroundImage
    this.canvas.backgroundImage = undefined
    const wasGuideVisible = this.showGuides
    this.setGuideVisible(false)
    this.canvas.discardActiveObject()
    this.canvas.renderAll()

    const dataUrl = this.canvas.toDataURL({
      format: "png",
      left: pa.left,
      top: pa.top,
      width: pa.width,
      height: pa.height,
      multiplier: 3 / this.currentZoom
    })

    this.canvas.backgroundImage = originalBg
    this.setGuideVisible(wasGuideVisible)
    this.canvas.renderAll()

    return dataUrl
  }

  /**
   * Get total count of artworks across all views (Front & Back)
   */
  public getTotalArtworkCount(): number {
    const currentCount = this.getArtworkObjects().length
    const otherViewId = this.currentViewId === "front" ? "back" : "front"
    const otherCount = (this.viewArtworkStore[otherViewId] || []).length
    return currentCount + otherCount
  }

  /**
   * Get all uploaded artworks across all views (Front & Back)
   */
  public getAllUploadedArtworks(): UploadedArtworkSummary[] {
    const list: UploadedArtworkSummary[] = []

    if (this.currentViewId === "front") {
      for (const obj of this.getArtworkObjects()) {
        const data = (obj.data as any) || {}
        list.push({
          id: data.id || `layer-${Math.random()}`,
          name: data.name || "Artwork",
          url: data.originalUrl || "",
          view: "front"
        })
      }
      for (const art of this.viewArtworkStore.back || []) {
        list.push({
          id: art.id,
          name: art.name,
          url: art.dataUrl,
          view: "back"
        })
      }
    } else {
      for (const art of this.viewArtworkStore.front || []) {
        list.push({
          id: art.id,
          name: art.name,
          url: art.dataUrl,
          view: "front"
        })
      }
      for (const obj of this.getArtworkObjects()) {
        const data = (obj.data as any) || {}
        list.push({
          id: data.id || `layer-${Math.random()}`,
          name: data.name || "Artwork",
          url: data.originalUrl || "",
          view: "back"
        })
      }
    }

    return list
  }

  /**
   * Retrieve serialized artwork objects for all views (for draft saving / cart persistence)
   */
  public getAllViewArtworks(): Record<"front" | "back", SerializedArtwork[]> {
    return {
      ...this.viewArtworkStore,
      [this.currentViewId]: this.serializeCurrentArtworks()
    }
  }

  /**
   * Restore artwork from saved draft state across both views
   */
  public async loadFromSerializedState(draft: Record<"front" | "back", SerializedArtwork[]>) {
    if (!this.canvas) return

    this.viewArtworkStore = {
      front: draft.front ? [...draft.front] : [],
      back: draft.back ? [...draft.back] : []
    }

    // Clear active canvas artworks
    this.canvas.discardActiveObject()
    this.getArtworkObjects().forEach((o) => this.canvas?.remove(o))

    // Restore current view's artworks
    const currentArtworks = this.viewArtworkStore[this.currentViewId] || []
    for (const art of currentArtworks) {
      await this.restoreArtworkObject(art)
    }

    if (this.guideRect) {
      this.canvas.bringObjectToFront(this.guideRect)
    }

    this.canvas.renderAll()
    this.notifyLayersChange()
  }

  /**
   * Reset all artworks across all views
   */
  public clearAllArtworks() {
    if (!this.canvas) return
    this.viewArtworkStore = { front: [], back: [] }
    this.canvas.discardActiveObject()
    this.getArtworkObjects().forEach((o) => this.canvas?.remove(o))
    this.updatePlaceholderVisibility()
    this.canvas.renderAll()
    this.notifyLayersChange()
    this.notifySelectionChange(null)
  }

  /**
   * Seamlessly export preview mockup and production files for both Front and Back
   */
  public async exportAllViewsPackage(viewsConfig: {
    front: { image: string; printPosition: PrintPositionConfig }
    back: { image: string; printPosition: PrintPositionConfig }
  }): Promise<{
    front?: { preview: string; production: string }
    back?: { preview: string; production: string }
  }> {
    const result: {
      front?: { preview: string; production: string }
      back?: { preview: string; production: string }
    } = {}

    const originalView = this.currentViewId
    const allArtworks = this.getAllViewArtworks()

    // 1. Export current view if it has artwork
    if (this.getArtworkObjects().length > 0) {
      result[this.currentViewId] = {
        preview: this.exportMockupPreview(),
        production: this.exportProductionArtwork()
      }
    }

    // 2. Temporarily switch to other view if it has artworks, export, then return
    const otherViewId = originalView === "front" ? "back" : "front"
    const otherArtworks = allArtworks[otherViewId] || []

    if (otherArtworks.length > 0 && viewsConfig[otherViewId]) {
      await this.switchView(
        otherViewId,
        viewsConfig[otherViewId].image,
        viewsConfig[otherViewId].printPosition
      )

      result[otherViewId] = {
        preview: this.exportMockupPreview(),
        production: this.exportProductionArtwork()
      }

      // Switch back to original view
      await this.switchView(
        originalView,
        viewsConfig[originalView].image,
        viewsConfig[originalView].printPosition
      )
    }

    return result
  }

  /**
   * Clean up canvas instance and observers
   */
  public destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.handleWindowResize)
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.canvas) {
      this.canvas.dispose()
      this.canvas = null
    }
  }
}
