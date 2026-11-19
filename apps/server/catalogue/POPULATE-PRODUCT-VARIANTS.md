# Populate RS Prints product variants

Run only against the local Vendure instance connected to the Neon development branch.

## What it creates

- 210 enabled variants across 124 existing parent products.
- Uses existing shared option groups, including Apparel Size.
- Uses only catalogue-listed combinations. Round-neck T-shirts include black cotton and white cotton sizes; white polyester sizes are held because availability is unclear.
- Creates one default variant for products without selectable options.
- Generates unique SKUs from product codes and option combinations.
- Adds provisional INR development prices and 10 units of test stock per variant.

## Provisional development prices

These are testing estimates, not supplier quotations or approved selling prices. Vendure stores INR prices in paise.

| Collection | Test price |
|---|---:|
| Ceramic mugs | ₹249 |
| Glass mugs | ₹299 |
| Glass drinkware | ₹249 |
| Aluminium bottles | ₹399 |
| Stainless-steel bottles | ₹699 |
| Kids bottles | ₹399 |
| Round-neck T-shirts | ₹399 |
| Polo T-shirts | ₹499 |
| MDF products | ₹149 |
| MDF collage frames | ₹599 |
| Fur pillows | ₹499 |
| Flip-sequin products | ₹599 |
| Sublimation accessories | ₹149 |
| Hard-board products | ₹249 |
| Custom bags | ₹299 |
| Tote bags | ₹349 |
| Glass frames | ₹499 |
| Stone / wooden frames | ₹599 |

2XL apparel gets a ₹50 test surcharge; polyester gets a ₹30 test surcharge.

## Products held back

The importer holds glossy/matte magic mugs, collar T-shirts, MDF keychains, fur pillows, aluminium BB28 750 ml lid presentations, BB12 / BB32, and MDF coaster A051 until their option mapping is confirmed.

## Safety

- Requires APP_ENV=dev, DATABASE_URL and Vendure superadmin credentials from .env.
- Uses only a localhost Admin API.
- Validates parent products, option groups, option values, input schema and SKU collisions before writes.
- Creates only missing variants in batches of 10. Reruns reuse matching variants.
- Does not change parent products, collections, facets, shared option groups, assets or images.
- Does not delete anything or overwrite conflicting existing variants.

## Run

From the repository root:

```powershell
git pull origin catalogue-setup
cd apps/server
node --env-file=.env catalogue/populate-product-variants.mjs
```

The local Vendure server must already be running and connected to the same Neon development branch configured in .env.

Before launch, replace estimated prices with approved selling prices and test stock with verified physical inventory.