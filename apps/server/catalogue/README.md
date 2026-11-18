# RS Prints catalogue import

This folder contains the first transcription of the 17-page RS Prints supplier catalogue and a guarded Vendure Admin API importer.

## Contents

- `rs-prints-catalogue.json`: 138 product records, source page references, visible specifications, category assignments and review notes.
- `import-catalogue.mjs`: creates facets, a shared apparel size option group, products, variants and category collections.

## Catalogue modelling

- **Collections:** one top-level collection per catalogue category.
- **Facets:** `Catalogue category` for product grouping and `Material` where the PDF explicitly states a material.
- **Options:** `Size` is a product option group on the two cotton T-shirt listings where XS through 2XL is legible. Those become six explicit variants per product.
- **SKUs:** printed supplier codes are retained where legible. Identifiers labelled `internal_provisional` or `provisional_sequence` are internal working identifiers and must not be mistaken for supplier codes.
- **Pricing and visibility:** no prices are present in the PDF. The importer creates variants with a zero placeholder price and leaves both products and variants disabled. Add real prices and enable products only after review.
- **Images:** the PDF is image-only. Each record has an `imageSource.pdfPage` reference, but individual product crops and Vendure Asset uploads are not yet included. Do not use a full catalogue page as a product thumbnail.

## Important review items

1. Check all entries marked `needs_review`, especially the generic products on pages 9, 10 and 14, and the size/code readings on page 15.
2. Confirm the provisional IDs before using them as customer-facing SKUs or printing labels.
3. Crop the individual product photographs from the referenced PDF pages, then upload them to Vendure Assets and assign them to the corresponding products/variants.
4. Enter the actual selling prices and stock quantities. Neither is supplied by this catalogue.

## Safe import procedure

Do not run this against the production database. First create a separate disposable/staging Vendure database and verify the Admin API endpoint points to it.

From `apps/server`:

```bash
# Use your separate test environment file, never the production .env.
# The importer defaults to a 3-product pilot. Do not use --all yet.
export CATALOGUE_IMPORT_ALLOW=true
export CATALOGUE_IMPORT_ENV=staging
export VENDURE_ADMIN_API_URL=http://localhost:3000/admin-api

node --env-file=.env.test catalogue/import-catalogue.mjs --limit=3
```

The script requires `SUPERADMIN_USERNAME` and `SUPERADMIN_PASSWORD` from the environment file. It refuses to run unless both safety switches are set and the target environment is explicitly marked local, development or staging. It authenticates once, defaults to a 3-product pilot, and skips products whose slug already exists. It does not delete or overwrite catalogue records. Only use `--all` after the pilot has been reviewed. Variants use a zero placeholder price because Vendure requires a price when creating variants; products and variants remain disabled until real prices are entered.

After import, inspect the products, variants, facets and collection variant counts in the Vendure Dashboard. Reindex search if required by the deployment.

## Security

Never commit `.env`, database URLs, admin passwords, API keys or storage credentials. A database URL committed to a public repository must be treated as compromised and rotated.
