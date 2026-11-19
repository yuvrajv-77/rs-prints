# Populate parent products

This step creates the 132 normalized parent products only. It does not create variants.

## Before running

- Pull the latest `catalogue-setup` branch.
- Confirm `apps/server/.env` points to the NEW Neon development branch.
- Confirm `APP_ENV=dev` in that file.
- Restart the local Vendure server after changing `.env`.
- Keep `.env` private. Do not paste database credentials into chat.

## Run

From the repository root:

```powershell
git pull origin catalogue-setup
cd apps/server
node --env-file=.env catalogue/populate-parent-products.mjs
```

## What it does

- Creates/reuses the 132 parent products in the normalized catalogue plan.
- Attaches the existing shared option groups and their already-created values to the relevant products.
- Assigns product-level Material, Capacity and Dimensions facets only when supported by fixed catalogue information. Selectable choices remain option groups.
- Writes 4-5 factual bullet points in each product description using the product name, category, RS Prints catalogue references, customization context, and available source specifications.
- Configures the existing Vendure collections to include the correct products using Vendure's built-in product-ID collection filter. Parent collections include the products of their child collections.
- Enables every created or reused parent product. Existing disabled products are switched on.

## What it does NOT do

- Does not create product variants.
- Does not create prices or stock levels.
- Does not upload or change images/assets.
- Does not delete products, collections, facets, or option groups.
- Does not change the shared option group definitions.

The script checks the local Admin API, expected plan size, collection hierarchy, required option groups/values, facets, and built-in collection filter before creating products. If preflight fails, it stops before product writes.

Products will be enabled, but they will not yet be purchasable or have selectable choices until variants, prices and stock are added in the next step.
