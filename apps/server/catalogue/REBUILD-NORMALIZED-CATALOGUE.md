# Normalized catalogue import

Use `rebuild-normalized-catalogue.mjs` for the corrected catalogue. Do not use the old `import-catalogue.mjs`.

## Safety behaviour

- Default mode is read-only preview.
- Apply mode is **additive**: it creates the normalized products and variants alongside existing products.
- It does not delete existing products or modify, delete, or recreate collections.
- It reuses matching normalized products, option groups, and SKUs on a rerun, so an interrupted import can resume.
- New products and variants remain disabled with a zero placeholder price until prices and stock are confirmed.
- It refuses to apply if source mappings, SKUs, or explicit multi-option combinations fail validation.
- It only permits a localhost Admin API and requires explicit test-database confirmation.

## 1. Pull the latest branch

From the repository root:

```powershell
git pull origin catalogue-setup
```

## 2. Confirm the test database

Open `apps/server/.env.test` and independently verify that `DATABASE_URL` points to the test database, not production. Never paste the connection string into chat.

Ensure these values exist in `.env.test`:

```dotenv
CATALOGUE_IMPORT_ALLOW=true
CATALOGUE_IMPORT_ENV=development
CATALOGUE_TEST_DATABASE_CONFIRMATION=I_CONFIRM_THIS_IS_THE_RS_PRINTS_TEST_DATABASE
```

Keep the existing Vendure superadmin credentials in that file. Start the local Vendure server connected to `.env.test`.

## 3. Run the preview

From `apps/server`:

```powershell
node --env-file=.env.test catalogue/rebuild-normalized-catalogue.mjs
```

Expected plan: 132 parent products and 252 variants, with zero blockers and zero errors. This command does not write to the database.

## 4. Apply to the test database

Only after checking the preview and independently confirming that the local server is connected to the test database:

```powershell
node --env-file=.env.test catalogue/rebuild-normalized-catalogue.mjs --apply
```

The script reports created/reused products and variants. If it stops partway through, fix the reported issue and rerun the same command. It is designed to reuse already-created normalized records.

## Important

The import intentionally does not delete the old 138 products. Once the new catalogue has been checked in the Vendure dashboard, the old test products can be cleaned up separately. Do not run this against production.
