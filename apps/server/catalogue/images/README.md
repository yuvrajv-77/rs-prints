# Product Custom Images Directory

Place individual product image files in this directory.

## File Naming Conventions

The script `populate-product-images.mjs` matches files in this directory in the following priority:

1. **By Product Slug**: e.g., `white-mug-a001.png`, `3-tone-mug.jpg`
2. **By Product Code**: e.g., `MUG-3TONE-HEART.png`, `A001.jpg`
3. **By Normalized Product Name**: e.g., `white-mug.webp`

## Supported Formats

- `.png`
- `.jpg` / `.jpeg`
- `.webp`
- `.svg`

## Missing Images Fallback

Any product that does **not** have a matching image in this directory will automatically receive its category fallback image (e.g. Mugs, Drinkware, Clothing, Bags, Home & Living, Gifts & Accessories) from `apps/storefront/public/categories/`.
Fallback images are uploaded **only once** to the asset server and shared, minimizing network transfer and S3 storage.
