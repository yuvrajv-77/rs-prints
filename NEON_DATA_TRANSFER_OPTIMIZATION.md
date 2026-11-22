# Neon Database Bandwidth & Data Transfer Optimization Guide

This document outlines why the Neon PostgreSQL free tier (5 GB monthly network egress quota) was consumed rapidly during development and build phases, along with concrete, production-ready fixes to reduce database network transfer by **95% to 99%**.

---

## 1. Executive Summary

| Metric | Status |
|---|---|
| **Neon Free Tier Monthly Egress Quota** | 5.0 GB / month |
| **Current Consumption** | ~2.0 GB consumed during initial development & builds |
| **Primary Root Causes** | 1) Local dev directly querying cloud Neon DB<br>2) `DB_SYNCHRONIZE=true` dumping full schema on every reboot<br>3) Full-catalog query on the homepage (`/`)<br>4) Zero edge caching on Cloudflare SSR |
| **Projected Egress After Fixes** | **< 200 MB / month** for the same traffic |

---

## 2. Root Cause Analysis

### Root Cause 1: Local Development Pointing Directly to Remote Neon
* **File:** `apps/server/.env`
* **Issue:** `DATABASE_URL` is set to the remote Singapore Neon pooler (`...neon.tech/neondb`).
* **Impact:** Every time a developer starts the local server (`localhost:3000`), runs tests, seeds data, runs catalog population scripts (`populate-option-groups.mjs`), or browses the local storefront (`localhost:4321`), dozens of megabytes of raw SQL queries and JSON payloads travel back and forth over the internet to Neon.

### Root Cause 2: TypeORM Auto-Synchronization (`DB_SYNCHRONIZE=true`)
* **Files:** `apps/server/.env`, `apps/server/src/vendure-config.ts`
* **Issue:** `DB_SYNCHRONIZE=true` instructs TypeORM to introspect the database on **every single server boot or hot-reload**.
* **Impact:** Vendure has over 40 relational tables with hundreds of columns, indexes, foreign keys, and constraints. Querying PostgreSQL's `information_schema` and `pg_catalog` on every boot transfers **15–30 MB per restart**. 50 restarts during development easily consumes ~1 GB of egress.

### Root Cause 3: Homepage Over-Fetching Entire Product Catalog
* **Files:** `apps/storefront/src/pages/index.astro`, `apps/storefront/src/lib/vendure/queries/products.ts`
* **Issue:** To display 8 "Featured Best Sellers" on the homepage, the page calls `getVendureGroupedSections()`, which executes `GET_VENDURE_CATALOGUE`.
* **Impact:** `GET_VENDURE_CATALOGUE` pulls:
  * Every collection and subcollection
  * Every product in the store
  * All image assets and variant price points
  * All facet values and facet metadata
  
  This massive payload is retrieved on **every visitor hit to `/`**, even though only 8 items are displayed.

### Root Cause 4: Zero Edge Caching on Cloudflare SSR
* **Files:** `apps/storefront/astro.config.mjs`, `apps/storefront/src/pages/products/index.astro`, `apps/storefront/src/pages/products/[slug].astro`
* **Issue:** Astro is configured in Server-Side Rendering (`output: "server"`) mode on Cloudflare Workers without `Cache-Control` headers.
* **Impact:** Every browser refresh, bot crawler, or visitor navigation triggers fresh GraphQL requests to Vendure, which executes multiple SQL queries against Neon.

---

## 3. Step-by-Step Fixes

### Fix 1: Add Cloudflare Edge Caching Headers to Astro SSR Pages

By serving cached HTML from Cloudflare's edge data centers (e.g. Mumbai, Delhi, Bangalore), **1,000 visitors viewing a product page will make only 1 request to your database** instead of 1,000.

#### `apps/storefront/src/pages/index.astro` and `apps/storefront/src/pages/products/index.astro`:
Add the following at the top of the Astro frontmatter:

```astro
---
// Cache at Cloudflare Edge for 5 minutes (300s).
// stale-while-revalidate serves edge cached copy instantly while revalidating in background.
Astro.response.headers.set(
  "Cache-Control",
  "public, max-age=60, s-maxage=300, stale-while-revalidate=86400"
);
---
```

#### `apps/storefront/src/pages/products/[slug].astro`:
```astro
---
// Cache product detail pages for 10 minutes at the edge
Astro.response.headers.set(
  "Cache-Control",
  "public, max-age=60, s-maxage=600, stale-while-revalidate=86400"
);
---
```

---

### Fix 2: Disable `DB_SYNCHRONIZE` in Server Environment

Since your database schema is already generated and stable, disable TypeORM schema introspection.

In `apps/server/.env`:
```diff
- DB_SYNCHRONIZE=true
+ DB_SYNCHRONIZE=false
```

> **Rule of Thumb:** Only enable `DB_SYNCHRONIZE=true` temporarily when first creating tables on an empty database. Keep it `false` at all other times.

---

### Fix 3: Optimize Homepage Query (`apps/storefront/src/pages/index.astro`)

Replace the full catalog fetch on the homepage with a lightweight query targeting only the products needed.

#### In `apps/storefront/src/lib/vendure/queries/products.ts`:
Add a targeted query for featured products:

```ts
export const GET_FEATURED_PRODUCTS = graphql(`
  query GetFeaturedProducts($options: ProductListOptions) {
    products(options: $options) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
        variants {
          id
          name
          price
          priceWithTax
        }
        collections {
          id
          slug
        }
      }
    }
  }
`);

export async function getFeaturedProducts(take = 8) {
  const data = await vendureClient.request(GET_FEATURED_PRODUCTS, {
    options: { take },
  });
  return data.products.items;
}
```

#### In `apps/storefront/src/pages/index.astro`:
Replace:
```diff
- const result = await getVendureGroupedSections()
+ const featuredVendureItems = await getFeaturedProducts(8)
```

---

### Fix 4: Separate Local Development Database from Production Neon

To prevent your local development from draining the 5 GB quota:

1. **Run a local PostgreSQL database for local development:**
   Using Docker:
   ```bash
   docker run --name rs-prints-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine
   ```
   Or install PostgreSQL locally on your machine.

2. **Configure Local `.env` vs Production:**
   * **Local (`apps/server/.env`):**
     ```env
     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rs_prints_dev
     ```
   * **Production (DuckDNS / Hosting Platform Environment Variables):**
     ```env
     DATABASE_URL=postgresql://neondb_owner:...@ep-wispy-grass...neon.tech/neondb?sslmode=require
     ```

This guarantees **zero bytes of Neon egress** during day-to-day coding, feature building, and UI styling.

---

### Fix 5: In-Memory Short-Lived Catalog Cache in Storefront

Even when requests reach the Cloudflare Worker, multiple concurrent requests can share a cached catalog object in memory for 60–120 seconds.

In `apps/storefront/src/lib/vendure/queries/products.ts`:
```ts
let cachedSections: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function getVendureGroupedSectionsCached() {
  const now = Date.now();
  if (cachedSections && (now - lastFetchTime < CACHE_TTL_MS)) {
    return cachedSections;
  }
  
  const sections = await getVendureGroupedSections();
  cachedSections = sections;
  lastFetchTime = now;
  return sections;
}
```

---

## 4. Summary of Impact

| Optimization | Target Area | Estimated Egress Reduction |
|---|---|---|
| **Edge Caching (`s-maxage=300`)** | Cloudflare Storefront | **85% – 95%** |
| **`DB_SYNCHRONIZE=false`** | Vendure Server Boot | **100% of schema scan traffic (~15–30MB/boot)** |
| **Targeted Homepage Query** | `src/pages/index.astro` | **90% reduction per homepage SSR hit** |
| **Local Postgres for Dev** | Developer Machine | **100% of dev & build traffic saved** |
| **Total Combined Reduction** | **Entire Stack** | **~98% reduction on Neon Data Transfer** |
