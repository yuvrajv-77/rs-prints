/**
 * Cloudflare Edge Caching Utilities for Astro SSR
 *
 * Cloudflare Workers SSR renders pages dynamically on the edge. Without Cache-Control
 * headers, every single visitor request executes the page SSR script and re-queries
 * the backend (Vendure & Neon PostgreSQL), consuming database network traffic.
 *
 * Directives breakdown:
 * - `public`: Instructs shared caches (Cloudflare Edge CDN) that the HTML may be cached.
 * - `max-age=<browserSeconds>`: Duration the visitor's local browser can cache the page.
 *   Kept modest (e.g. 60s) so navigations back/forward are snappy without locking in old state.
 * - `s-maxage=<edgeSeconds>`: Duration Cloudflare Edge nodes cache the rendered HTML.
 *   During this window, thousands of visitors hitting this page receive it directly from
 *   the nearest Cloudflare edge node in ~15ms, with ZERO database queries made to Vendure / Neon.
 * - `stale-while-revalidate=<swrSeconds>`: When s-maxage expires, Cloudflare serves the cached
 *   page to the visitor with zero latency, while concurrently fetching a fresh copy from
 *   the origin in the background. Subsequent visitors immediately receive the fresh copy.
 */

export interface CacheOptions {
  /** Browser cache in seconds. Default: 60 (1 min) */
  browserMaxAge?: number;
  /** Cloudflare Edge cache in seconds. Default: 300 (5 min) */
  edgeMaxAge?: number;
  /** Background revalidation window in seconds. Default: 86400 (24 hrs) */
  staleWhileRevalidate?: number;
}

/**
 * Standard edge cache presets for different types of pages
 */
export const CACHE_PRESETS = {
  /**
   * Catalog & Directory Pages (Homepage, /products, /categories)
   * - Edge cache: 5 minutes (300s) -> Drastically reduces Neon database hits
   * - Browser cache: 1 minute (60s) -> Fast back/forward navigation
   * - SWR: 24 hours -> Background revalidation eliminates cold-start delay
   */
  CATALOG: {
    browserMaxAge: 60,
    edgeMaxAge: 300,
    staleWhileRevalidate: 86400,
  },

  /**
   * Product Details (/products/[slug])
   * - Edge cache: 10 minutes (600s) -> Product specs and images rarely change by the minute
   * - Browser cache: 2 minutes (120s)
   * - SWR: 24 hours
   */
  PRODUCT_DETAIL: {
    browserMaxAge: 120,
    edgeMaxAge: 600,
    staleWhileRevalidate: 86400,
  },

  /**
   * Static Marketing & Legal Pages (About, Contact, Terms, Policies)
   * - Edge cache: 1 hour (3600s)
   * - Browser cache: 10 minutes (600s)
   * - SWR: 7 days
   */
  MARKETING: {
    browserMaxAge: 600,
    edgeMaxAge: 3600,
    staleWhileRevalidate: 604800,
  },
} as const;

/**
 * Applies Cloudflare Edge Cache-Control headers to an Astro SSR response.
 *
 * @example
 * ```astro
 * ---
 * import { setEdgeCache, CACHE_PRESETS } from "@/lib/cache";
 * setEdgeCache(Astro.response, CACHE_PRESETS.CATALOG);
 * ---
 * ```
 */
export function setEdgeCache(
  response: { headers: Headers },
  options: CacheOptions = CACHE_PRESETS.CATALOG
): void {
  const browser = options.browserMaxAge ?? 60;
  const edge = options.edgeMaxAge ?? 300;
  const swr = options.staleWhileRevalidate ?? 86400;

  response.headers.set(
    "Cache-Control",
    `public, max-age=${browser}, s-maxage=${edge}, stale-while-revalidate=${swr}`
  );
}

/**
 * Explicitly disables caching for private, dynamic, or authenticated pages
 * (e.g. Account Dashboard, Authentication, Cart, Checkout).
 *
 * Ensures customer personal data and active sessions are NEVER cached on CDN edge nodes.
 */
export function setPrivateNoCache(response: { headers: Headers }): void {
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );
}
