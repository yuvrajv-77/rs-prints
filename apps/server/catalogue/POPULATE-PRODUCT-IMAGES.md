# Populate RS Prints Product Images

Assigns at least 1 image to every product in the Vendure catalogue through the Admin GraphQL API.

## Features

- **Safe by default**: Runs in `--dry-run` preview mode unless `--apply` is specified.
- **Dedicated custom image mapping**: If you drop real product photos into `apps/server/catalogue/images/`, it matches them by product slug, code, or SKU (e.g. `white-mug-a001.png`, `MUG-3TONE-HEART.jpg`, `A001.jpg`).
- **Smart category fallbacks**: For any product without a specific photo, it automatically assigns high-quality category placeholders (`mugs.png`, `drinkware.png`, `clothing.png`, `bags.png`, `home-living.png`, `gifts-accessories.png`).
- **Asset deduplication (near-zero bandwidth)**: Fallback images are uploaded to Vendure / S3 **only once**, and their asset IDs are reused across all matching products.
- **Non-destructive**: Products that already have an image are skipped by default. Pass `--force` to reassign.

---

## Network & Bandwidth Impact Summary

| Network Layer | Egress / Transfer Impact | Why? |
|---|---|---|
| **Neon PostgreSQL Database** | **< 1 - 2 MB total** | Binary images are **NEVER** stored in PostgreSQL. Vendure only stores small metadata rows (file name, width, height) and an ID link in Postgres. |
| **Neon S3 Object Storage (Upload)** | **< 500 KB** (with placeholders)<br>**~10 - 25 MB** (with 130 real compressed photos) | Reusing category assets means only ~6 files are uploaded to S3. If uploading real photos, compressing them to 80-150 KB WebP/JPEG keeps upload usage minimal. |
| **Storefront & Visitors** | **Very low** | Vendure's `AssetServerPlugin` serves dynamically resized preview thumbnails (`?w=300`), and Cloudflare Edge Caching caches image and page responses. |

---

## How to Run

### 1. Dry Run (Preview Only)
Inspect what images will be assigned without modifying the database or uploading files:
```powershell
cd apps/server
node --env-file=.env catalogue/populate-product-images.mjs
```

### 2. Pilot Test (Apply to First 5 Products)
```powershell
node --env-file=.env catalogue/populate-product-images.mjs --apply --limit=5
```

### 3. Apply to All Products
```powershell
node --env-file=.env catalogue/populate-product-images.mjs --apply --all
```

### 4. Custom Image Directory
If you have a folder of product photos:
```powershell
node --env-file=.env catalogue/populate-product-images.mjs --apply --all --images-dir="D:/Photos"
```

### 5. Overwrite Existing Images
```powershell
node --env-file=.env catalogue/populate-product-images.mjs --apply --all --force
```
