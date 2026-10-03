import { atom } from "nanostores";

/**
 * Shared Reactive Image Store (Nanostores)
 * Bridges state between `ProductConfigurator` and `ProductGallery` on the product detail page.
 * When a user selects an option combination (e.g. Color = 'Black') in the configurator,
 * this store is updated with that variant's image URL so the gallery updates instantaneously.
 * Conversely, clicking a thumbnail in `ProductGallery` pushes that image here to trigger
 * matching option selections.
 */
export const activeVariantImageStore = atom<string | null>(null);
