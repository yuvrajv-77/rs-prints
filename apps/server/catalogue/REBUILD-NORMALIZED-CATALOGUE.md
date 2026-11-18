# Normalized catalogue rebuild

The old `import-catalogue.mjs` imports the first-pass one-row-per-product manifest. Do not use it for the corrected catalogue.

## What the new rebuild does

`rebuild-normalized-catalogue.mjs` is intended for the local Vendure instance connected to the test database only.

- Default mode is read-only preview. It does not log in to Vendure or write to the database.
- Apply mode first checks the legacy imported product slugs against the old manifest.
- It deletes only those exact legacy product records, then creates the normalized parent products and their variants.
- It does not delete, update, or recreate collections.
- New products and variants are disabled and use a zero placeholder price until pricing and stock are confirmed.
- Option groups are shared Vendure option groups. Their value vocabulary is merged globally, while each product's variants use only values in that product's own model.
- It refuses to apply while multi-option models lack explicit valid variant combinations.

## Step 1: pull the branch

From the repository root:

```powershell
git pull origin catalogue-setup
```

## Step 2: verify the test environment

Open `apps/server/.env.test` and independently verify that `DATABASE_URL` points to the disposable/test database, not production. Do not paste the connection string into chat.

The rebuild also requires these environment values in `.env.test`:

```dotenv
CATALOGUE_IMPORT_ALLOW=true
CATALOGUE_IMPORT_ENV=development
CATALOGUE_TEST_DATABASE_CONFIRMATION=I_CONFIRM_THIS_IS_THE_RS_PRINTS_TEST_DATABASE
```

Keep the existing Vendure credentials in that file. The Admin API must be local (default `http://localhost:3000/admin-api`).

## Step 3: run the read-only preview

From `apps/server`:

```powershell
node --env-file=.env.test catalogue/rebuild-normalized-catalogue.mjs
```

This is the only command to run at this stage. It must not change the database.

## Apply mode is not ready yet

The current plan intentionally blocks five multi-option product models until their valid combinations are explicitly specified:

- Round-neck T-shirts
- Collar T-shirts
- Flip-sequin square pillows
- Flip-sequin heart pillows
- MDF coasters

Do not run with `--apply` until those combination rules have been reviewed and the dry-run report shows zero blockers. The apply command, once approved, will be:

```powershell
node --env-file=.env.test catalogue/rebuild-normalized-catalogue.mjs --apply
```

Never run this script with production credentials or a production database URL.
