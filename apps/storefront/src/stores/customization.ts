import { atom } from "nanostores"
import type { SerializedArtwork } from "../components/customizer/core/fabric-manager"
import type { ActiveOrderLine } from "../lib/vendure/queries/orders"
import { formatAssetUrl } from "../lib/vendure/client"

export interface ViewCustomizationData {
  positionId: string
  positionName: string
  physicalSizeLabel?: string
  previewDataUrl: string
  productionDataUrl: string
  previewAssetId?: string
  previewAssetUrl?: string
  productionAssetId?: string
  productionAssetUrl?: string
  artworks: SerializedArtwork[]
}

export interface CustomizationMetadata {
  id: string
  orderLineId?: string
  productId: string
  productSlug?: string
  productName: string
  productType?: string
  variantId: string
  sku?: string
  colorId: string
  colorName: string
  size?: string
  quantity?: number
  sizeQuantities?: Record<string, number>
  directQuantity?: number
  unitPrice?: number
  customAttributes?: Record<string, string>
  customizeUrl?: string
  selectedViewId?: "front" | "back"
  selectedPositionId?: string
  notes?: string
  front?: ViewCustomizationData
  back?: ViewCustomizationData
  timestamp: number
}

export interface ProductDesignDraft {
  productId?: string
  productSlug?: string
  productName?: string
  productType?: string
  colorId: string
  selectedViewId: "front" | "back"
  selectedPositionId: string
  viewArtworks: Record<"front" | "back", SerializedArtwork[]>
  sizeQuantities?: Record<string, number>
  directQuantity?: number
  notes?: string
  customAttributes?: Record<string, string>
  updatedAt?: number
}

const STORAGE_KEY_CUSTOMIZATIONS = "rs_prints_cart_customizations"
const STORAGE_KEY_DRAFT_PREFIX = "rs_prints_draft_"

// Atom holding map of customizationId / orderLineId / variantId -> CustomizationMetadata
export const $customizations = atom<Record<string, CustomizationMetadata>>({})

// Atom holding map of productKey -> ProductDesignDraft (reactive for Product Detail / Cart / Customizer)
export const $savedDrafts = atom<Record<string, ProductDesignDraft>>({})

function loadInitialFromStorage() {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMIZATIONS)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, CustomizationMetadata>
      const hydrated: Record<string, CustomizationMetadata> = {}
      for (const record of Object.values(parsed)) {
        if (!record) continue
        if (record.id) hydrated[record.id] = record
        if (record.orderLineId) hydrated[record.orderLineId] = record
        if (record.variantId) hydrated[record.variantId] = record
      }
      $customizations.set(hydrated)
    }
  } catch (err) {
    console.error("Failed to load cart customizations from storage:", err)
  }

  try {
    const drafts: Record<string, ProductDesignDraft> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(STORAGE_KEY_DRAFT_PREFIX)) {
        const productKey = k.slice(STORAGE_KEY_DRAFT_PREFIX.length)
        const rawDraft = localStorage.getItem(k)
        if (rawDraft) {
          drafts[productKey] = JSON.parse(rawDraft)
        }
      }
    }
    $savedDrafts.set(drafts)
  } catch (err) {
    console.error("Failed to load product design drafts from storage:", err)
  }
}

loadInitialFromStorage()

/**
 * Persist customizations map to localStorage with automatic quota eviction fallback.
 */
function persistCustomizations(map: Record<string, CustomizationMetadata>) {
  if (typeof window === "undefined") return

  // Deduplicate by record.id so we don't store redundant copies in localStorage
  const deduped: Record<string, CustomizationMetadata> = {}
  for (const record of Object.values(map)) {
    if (record?.id) {
      deduped[record.id] = record
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMIZATIONS, JSON.stringify(deduped))
    return
  } catch {
    // Evict older entries or strip heavy inline base64 strings when Vendure asset URLs exist
  }

  const compactRecords = (items: CustomizationMetadata[]) => {
    const obj: Record<string, CustomizationMetadata> = {}
    for (const item of items) {
      obj[item.id] = {
        ...item,
        front: item.front
          ? {
              ...item.front,
              previewDataUrl: item.front.previewAssetUrl || item.front.previewDataUrl,
              productionDataUrl: item.front.productionAssetUrl || "",
              artworks: item.front.artworks.map((a) => ({
                ...a,
                dataUrl: a.assetUrl || a.dataUrl,
              })),
            }
          : undefined,
        back: item.back
          ? {
              ...item.back,
              previewDataUrl: item.back.previewAssetUrl || item.back.previewDataUrl,
              productionDataUrl: item.back.productionAssetUrl || "",
              artworks: item.back.artworks.map((a) => ({
                ...a,
                dataUrl: a.assetUrl || a.dataUrl,
              })),
            }
          : undefined,
      }
    }
    return obj
  }

  const sorted = Object.values(deduped).sort((a, b) => b.timestamp - a.timestamp)
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMIZATIONS, JSON.stringify(compactRecords(sorted)))
    return
  } catch {
    // Try keeping fewer items
  }

  for (let keep = Math.max(1, sorted.length - 1); keep >= 1; keep--) {
    try {
      localStorage.setItem(
        STORAGE_KEY_CUSTOMIZATIONS,
        JSON.stringify(compactRecords(sorted.slice(0, keep)))
      )
      return
    } catch {
      // Continue shrinking
    }
  }
}

/**
 * Save customization data for a cart item (and optional OrderLine ID).
 */
export function saveCustomizationForCart(
  data: Omit<CustomizationMetadata, "id" | "timestamp">,
  explicitId?: string
): string {
  const id = explicitId || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const record: CustomizationMetadata = {
    ...data,
    id,
    timestamp: Date.now(),
  }

  const current = $customizations.get()
  const updated: Record<string, CustomizationMetadata> = {
    ...current,
    [id]: record,
    [record.variantId]: record,
  }
  if (record.orderLineId) {
    updated[record.orderLineId] = record
  }

  $customizations.set(updated)
  persistCustomizations(updated)

  return id
}

/**
 * Associate an existing customization record with a Vendure OrderLine ID once returned from the API.
 */
export function linkCustomizationToOrderLine(customizationId: string, orderLineId: string) {
  if (!customizationId || !orderLineId) return
  const current = $customizations.get()
  const record = current[customizationId]
  if (!record) return

  const updatedRecord: CustomizationMetadata = {
    ...record,
    orderLineId,
  }
  const updated: Record<string, CustomizationMetadata> = {
    ...current,
    [customizationId]: updatedRecord,
    [orderLineId]: updatedRecord,
    [updatedRecord.variantId]: updatedRecord,
  }
  $customizations.set(updated)
  persistCustomizations(updated)
}

/**
 * Lookup customization for a specific cart line (`line.id` or `line.productVariant.id`)
 */
export function getCustomizationForLine(
  lineOrVariantId: string,
  orderLineId?: string
): CustomizationMetadata | null {
  const current = $customizations.get()
  if (orderLineId && current[orderLineId]) {
    return current[orderLineId]
  }
  if (current[lineOrVariantId]) {
    return current[lineOrVariantId]
  }
  const matches = Object.values(current)
    .filter(
      (item) =>
        (orderLineId && item.orderLineId === orderLineId) ||
        item.variantId === lineOrVariantId ||
        item.id === lineOrVariantId
    )
    .sort((a, b) => b.timestamp - a.timestamp)
  return matches[0] || null
}

/**
 * Parse CustomizationMetadata stored on a Vendure OrderLine's `customFields.customizationData`
 */
export function parseOrderLineCustomization(line: ActiveOrderLine): CustomizationMetadata | null {
  const raw = line.customFields?.customizationData
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CustomizationMetadata
      const normalizeView = (view?: ViewCustomizationData): ViewCustomizationData | undefined => {
        if (!view) return undefined
        return {
          ...view,
          previewAssetUrl: view.previewAssetUrl ? formatAssetUrl(view.previewAssetUrl) : undefined,
          productionAssetUrl: view.productionAssetUrl ? formatAssetUrl(view.productionAssetUrl) : undefined,
          previewDataUrl:
            view.previewDataUrl ||
            (view.previewAssetUrl ? formatAssetUrl(view.previewAssetUrl) : ""),
          productionDataUrl:
            view.productionDataUrl ||
            (view.productionAssetUrl ? formatAssetUrl(view.productionAssetUrl) : ""),
          artworks: (view.artworks || []).map((art) => {
            const formattedAssetUrl = art.assetUrl ? formatAssetUrl(art.assetUrl) : undefined
            return {
              ...art,
              assetUrl: formattedAssetUrl,
              dataUrl: art.dataUrl || formattedAssetUrl || "",
            }
          }),
        }
      }

      return {
        ...parsed,
        id: parsed.id || line.customFields?.customizationId || `custom-line-${line.id}`,
        orderLineId: line.id,
        variantId: line.productVariant.id,
        productId: parsed.productId || line.productVariant.product?.id || "",
        productSlug: parsed.productSlug || line.productVariant.product?.slug,
        productName: parsed.productName || line.productVariant.product?.name || line.productVariant.name,
        front: normalizeView(parsed.front),
        back: normalizeView(parsed.back),
      }
    } catch (err) {
      console.warn("Failed to parse OrderLine customizationData:", err)
    }
  }
  return getCustomizationForLine(line.productVariant.id, line.id)
}

/**
 * Hydrate local customization store & product design drafts from Vendure's ActiveOrder lines.
 * Ensures saved customizations persist across refreshes, devices, and navigation back to the product page.
 */
export function hydrateCustomizationsFromOrder(lines: ActiveOrderLine[] | undefined | null) {
  if (!lines || lines.length === 0) return

  const current = { ...$customizations.get() }
  let changed = false

  for (const line of lines) {
    if (!line.customFields?.customizationData) continue
    const parsed = parseOrderLineCustomization(line)
    if (!parsed) continue

    const existing = current[line.id] || current[parsed.id]
    // Preserve inline base64 dataUrls if we already have them locally
    const merged: CustomizationMetadata = existing
      ? {
          ...parsed,
          front: parsed.front
            ? {
                ...parsed.front,
                previewDataUrl: existing.front?.previewDataUrl || parsed.front.previewDataUrl,
                productionDataUrl: existing.front?.productionDataUrl || parsed.front.productionDataUrl,
              }
            : existing.front,
          back: parsed.back
            ? {
                ...parsed.back,
                previewDataUrl: existing.back?.previewDataUrl || parsed.back.previewDataUrl,
                productionDataUrl: existing.back?.productionDataUrl || parsed.back.productionDataUrl,
              }
            : existing.back,
        }
      : parsed

    current[merged.id] = merged
    current[line.id] = merged
    current[line.productVariant.id] = merged
    changed = true

    // Also hydrate the product design draft if none exists locally yet
    const productKey = merged.productSlug || merged.productId
    if (productKey && !loadDesignDraft(productKey)) {
      saveDesignDraft(
        productKey,
        {
          productId: merged.productId,
          productSlug: merged.productSlug,
          productName: merged.productName,
          productType: merged.productType,
          colorId: merged.colorId,
          selectedViewId: merged.selectedViewId || "front",
          selectedPositionId:
            merged.selectedPositionId ||
            merged.front?.positionId ||
            merged.back?.positionId ||
            "center_chest",
          viewArtworks: {
            front: merged.front?.artworks || [],
            back: merged.back?.artworks || [],
          },
          sizeQuantities: merged.sizeQuantities,
          directQuantity: merged.directQuantity ?? line.quantity,
          notes: merged.notes,
          customAttributes: merged.customAttributes,
          updatedAt: merged.timestamp,
        },
        merged.productId && merged.productId !== productKey ? [merged.productId] : undefined
      )
    }
  }

  if (changed) {
    $customizations.set(current)
    persistCustomizations(current)
  }
}

/**
 * Save active design draft keyed by specific product (slug / id) so user work is always restored
 * when returning to the product detail page and clicking Customize again.
 */
export function saveDesignDraft(
  productKey: string,
  draft: ProductDesignDraft,
  secondaryKeys?: string[]
) {
  if (!productKey) return
  const payload: ProductDesignDraft = {
    ...draft,
    updatedAt: draft.updatedAt || Date.now(),
  }

  const allKeys = Array.from(new Set([productKey, ...(secondaryKeys || [])].filter(Boolean)))
  const currentDrafts = { ...$savedDrafts.get() }
  for (const key of allKeys) {
    currentDrafts[key] = payload
  }
  $savedDrafts.set(currentDrafts)

  if (typeof window === "undefined") return

  const persistDraftKey = (key: string, data: ProductDesignDraft) => {
    try {
      localStorage.setItem(`${STORAGE_KEY_DRAFT_PREFIX}${key}`, JSON.stringify(data))
      return true
    } catch {
      // Fallback: if dataUrls exceed quota and assetUrls exist, store assetUrls only
      const compact: ProductDesignDraft = {
        ...data,
        viewArtworks: {
          front: (data.viewArtworks.front || []).map((a) => ({
            ...a,
            dataUrl: a.assetUrl || a.dataUrl,
          })),
          back: (data.viewArtworks.back || []).map((a) => ({
            ...a,
            dataUrl: a.assetUrl || a.dataUrl,
          })),
        },
      }
      try {
        localStorage.setItem(`${STORAGE_KEY_DRAFT_PREFIX}${key}`, JSON.stringify(compact))
        return true
      } catch (e) {
        console.warn("Could not save design draft:", e)
        return false
      }
    }
  }

  persistDraftKey(productKey, payload)
  for (const sec of secondaryKeys || []) {
    if (sec && sec !== productKey) {
      persistDraftKey(sec, payload)
    }
  }
}

/**
 * Load saved design draft for a specific product (checking primary & secondary keys).
 */
export function loadDesignDraft(
  productKey: string,
  secondaryKeys?: string[]
): ProductDesignDraft | null {
  const keys = Array.from(new Set([productKey, ...(secondaryKeys || [])].filter(Boolean)))
  const inMemory = $savedDrafts.get()

  for (const k of keys) {
    if (inMemory[k]) return inMemory[k]
  }

  if (typeof window === "undefined") return null
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_DRAFT_PREFIX}${k}`)
      if (raw) {
        const parsed = JSON.parse(raw) as ProductDesignDraft
        $savedDrafts.set({ ...$savedDrafts.get(), [k]: parsed })
        return parsed
      }
    } catch {
      // continue
    }
  }
  return null
}

/**
 * Clear design draft for a product.
 */
export function clearDesignDraft(productKey: string, secondaryKeys?: string[]) {
  const keys = Array.from(new Set([productKey, ...(secondaryKeys || [])].filter(Boolean)))
  const currentDrafts = { ...$savedDrafts.get() }
  for (const k of keys) {
    delete currentDrafts[k]
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(`${STORAGE_KEY_DRAFT_PREFIX}${k}`)
      } catch {
        // ignore
      }
    }
  }
  $savedDrafts.set(currentDrafts)
}

/**
 * Check if a product currently has a saved customization (in local draft or active Vendure cart lines).
 */
export function hasSavedCustomizationForProduct(
  productSlug?: string,
  productId?: string,
  cartLines?: ActiveOrderLine[]
): boolean {
  const draft = loadDesignDraft(productSlug || productId || "", productId ? [productId] : undefined)
  if (draft && ((draft.viewArtworks?.front?.length || 0) > 0 || (draft.viewArtworks?.back?.length || 0) > 0)) {
    return true
  }

  if (cartLines && cartLines.length > 0) {
    for (const line of cartLines) {
      const p = line.productVariant?.product
      const matchesProduct =
        (productSlug && p?.slug === productSlug) ||
        (productId && p?.id === productId)
      if (matchesProduct) {
        const cust = parseOrderLineCustomization(line)
        if (cust) return true
      }
    }
  }

  return false
}

/**
 * Clear saved customizations and product drafts ONLY for products whose order has been placed.
 * Leaves customizations for any other un-ordered products untouched.
 */
export function clearCustomizationsForOrder(lines: ActiveOrderLine[] | undefined | null) {
  if (!lines || lines.length === 0) return

  const current = { ...$customizations.get() }
  const variantIdsToClear = new Set<string>()
  const lineIdsToClear = new Set<string>()
  const customIdsToClear = new Set<string>()
  const draftKeysToClear = new Set<string>()

  for (const line of lines) {
    lineIdsToClear.add(line.id)
    variantIdsToClear.add(line.productVariant.id)

    if (line.customFields?.customizationId) {
      customIdsToClear.add(line.customFields.customizationId)
    }
    if (line.productVariant.product?.slug) {
      draftKeysToClear.add(line.productVariant.product.slug)
    }
    if (line.productVariant.product?.id) {
      draftKeysToClear.add(line.productVariant.product.id)
    }

    const cust = parseOrderLineCustomization(line)
    if (cust) {
      customIdsToClear.add(cust.id)
      if (cust.productSlug) draftKeysToClear.add(cust.productSlug)
      if (cust.productId) draftKeysToClear.add(cust.productId)
      if (cust.productType === "tshirt") draftKeysToClear.add("basic-cotton-tshirt")
      if (cust.productType === "mug") draftKeysToClear.add("white-ceramic-mug-a001")
      if (cust.productType === "bottle") draftKeysToClear.add("white-stainless-bottle-loop")
      if (cust.productType === "bag") {
        draftKeysToClear.add("canvas-tote-bag")
        draftKeysToClear.add("laptop-briefcase-bag")
      }
    }
  }

  for (const [key, record] of Object.entries(current)) {
    if (
      lineIdsToClear.has(key) ||
      variantIdsToClear.has(key) ||
      customIdsToClear.has(key) ||
      (record &&
        (customIdsToClear.has(record.id) ||
          variantIdsToClear.has(record.variantId) ||
          (record.orderLineId && lineIdsToClear.has(record.orderLineId)) ||
          (record.productSlug && draftKeysToClear.has(record.productSlug)) ||
          (record.productId && draftKeysToClear.has(record.productId))))
    ) {
      delete current[key]
    }
  }

  $customizations.set(current)
  persistCustomizations(current)

  for (const draftKey of draftKeysToClear) {
    clearDesignDraft(draftKey)
  }
}
