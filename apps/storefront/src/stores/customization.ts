import { atom } from "nanostores"
import type { SerializedArtwork } from "../components/customizer/core/fabric-manager"

export interface ViewCustomizationData {
  positionId: string
  positionName: string
  previewDataUrl: string
  productionDataUrl: string
  artworks: SerializedArtwork[]
}

export interface CustomizationMetadata {
  id: string
  productId: string
  productName: string
  variantId: string
  colorId: string
  colorName: string
  size: string
  front?: ViewCustomizationData
  back?: ViewCustomizationData
  timestamp: number
}

const STORAGE_KEY_CUSTOMIZATIONS = "rs_prints_cart_customizations"
const STORAGE_KEY_DRAFT_PREFIX = "rs_prints_draft_"

// Atom holding map of customizationId -> CustomizationMetadata
export const $customizations = atom<Record<string, CustomizationMetadata>>({})

// Initialize from localStorage in browser
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMIZATIONS)
    if (raw) {
      $customizations.set(JSON.parse(raw))
    }
  } catch (err) {
    console.error("Failed to load cart customizations from storage:", err)
  }
}

/**
 * Save customization data for a cart item
 */
export function saveCustomizationForCart(data: Omit<CustomizationMetadata, "id" | "timestamp">): string {
  const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const record: CustomizationMetadata = {
    ...data,
    id,
    timestamp: Date.now()
  }

  const current = $customizations.get()
  const updated = {
    ...current,
    [id]: record,
    [record.variantId]: record // Index by variantId as secondary lookup key
  }

  $customizations.set(updated)

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMIZATIONS, JSON.stringify(updated))
    } catch (e) {
      console.warn("Storage quota exceeded or unavailable:", e)
    }
  }

  return id
}

/**
 * Lookup customization for a specific cart line or variant
 */
export function getCustomizationForLine(lineOrVariantId: string): CustomizationMetadata | null {
  const current = $customizations.get()
  return current[lineOrVariantId] || null
}

/**
 * Save active design draft so user work is never lost on refresh
 */
export function saveDesignDraft(productId: string, draft: {
  colorId: string
  selectedViewId: "front" | "back"
  selectedPositionId: string
  viewArtworks: Record<"front" | "back", SerializedArtwork[]>
}) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(`${STORAGE_KEY_DRAFT_PREFIX}${productId}`, JSON.stringify(draft))
  } catch (e) {
    console.warn("Could not save design draft:", e)
  }
}

/**
 * Load saved design draft for a product
 */
export function loadDesignDraft(productId: string): {
  colorId: string
  selectedViewId: "front" | "back"
  selectedPositionId: string
  viewArtworks: Record<"front" | "back", SerializedArtwork[]>
} | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_DRAFT_PREFIX}${productId}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

/**
 * Clear design draft
 */
export function clearDesignDraft(productId: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(`${STORAGE_KEY_DRAFT_PREFIX}${productId}`)
  } catch (e) {
    // ignore
  }
}
