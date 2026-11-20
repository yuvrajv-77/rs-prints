# RS Prints catalogue model audit

Status: first-pass structural audit. This is a planning document, not an import manifest. Do not run an importer from this file.

## Source-of-truth rules

- The supplied 17-page PDF is a visual reference for product families, options and variants, not a reliable SKU database.
- Every distinct item shown in the PDF must be represented in the final catalogue. Where a label/code is unreadable or a relationship is uncertain, retain the item and mark it for review.
- Internal product codes and variant SKUs will be generated consistently by RS Prints. Printed codes are retained only as source references.
- A Vendure Product represents a customer-facing product model. A ProductVariant represents a purchasable combination with its own SKU, price and stock.
- Never create a Cartesian product of options unless the source supports every combination. Only create supported combinations.
- No price, stock, availability, material, capacity or colour is to be invented. Inferred groupings are explicitly marked as proposed until approved.
- Existing collections are retained. Rebuild operations must target the test database only.

## Confirmed option-bearing families from visual inspection

### Ceramic mugs (PDF pages 1-3)

| Proposed parent product | Source entries | Option groups / values visible | Confidence |
|---|---|---|---|
| 3 Tone Heart Handle Mug | A004C | Handle colour: red, pink, orange, green, yellow, blue | High |
| 3 Tone Mug | A006 | Colour: red, green, blue, dark green, pink, black, yellow, orange, light blue | High |
| Neon Mug | A007 | Colour: red, blue, green, yellow, orange, pink | High |
| Gold & Silver Mug | A008 | Colour: gold, silver | High |
| Electro Plated Mug | A112, A143, A114 | Colour: silver, gold, pink | High |
| Magic Glossy & Matte Mug | A012 | Finish: glossy, matte (confirm whether both finishes are available in both shown body colours) | Medium |
| 3 Tone Tea Mug | A002C | Colour: black, pink, yellow, red, green, light blue, blue | High |
| Color Patch Mug | A005 | Handle colour: black, pink, yellow, red, green, light blue, blue | High |

Other ceramic mug entries appear to be distinct models in the source: A001 White Mug, A111 Motto Ceramic Mug, A003 Cone Mug, A004 White Heart Handle Mug, A013 Heart Cut Mug, A013M Heart Cut Magic Mug, A002 White Tea Mug, A010 German Beer Stein Mug, A144 Blue Berry Mug, A145 Coco Milk White Mug, A146 Merry Gold Mug, A147 Rose Gold Mug, A148 Cork Base Mug. Keep separate unless a later visual check proves they are the same physical model with options.

### Glass mugs and drinkware (PDF pages 4-5)

| Proposed parent product | Source entries | Option groups / values visible | Confidence |
|---|---|---|---|
| Color Glass Mug (clear) | A120 | Base colour: purple, orange, light blue, light yellow | High |
| Gradient Color Glass Mug (frosted) | A014 | Gradient colour: blue, green, pink, orange, neon green | High |
| Full Color Glass Mug (frosted) | A014C | Body colour: blue, green, pink, orange, neon green | High |
| Borosilicate Glass Mug | A115, A116 | Finish: clear/frosted; handle colour: blue/brown. Validate all combinations before generating variants. | Medium |
| Beer Glass | A018, A019, A118 | Finish/tint: frosted, clear, colour-tinted. A118 shows purple-red, orange, light blue, light yellow colour choices. | Medium |
| Gradient Color Glass Tumbler | A141, A142 | Lid type differs (plastic vs bamboo); A141 and A142 show colour choices. Confirm whether A121 (frosted bamboo-lid tumbler) belongs in this family. | Medium |

A015 Frosted Glass Mug, A016 Clear Glass Mug, A022 Gold Rim Shot Glass, A023 Clear Shot Glass, A024 Frosted Shot Glass, A025 Frosted Shooter Glass, A020 Frosted Mason Jar, A021 Clear Mason Jar with Lid, A122 Jar with Bamboo Lid, A119 Gradient Color Jar (clear), A117 Gradient Color Jar without Lid appear as distinct models for now. Do not merge merely because their names share a generic word.

### Aluminium bottles (PDF page 6)

The following source panels show one bottle model with multiple capacities and/or colour choices. Create option groups only after confirming the panel-to-product mapping:
- A039 / BB5-BB6: capacity 750 ml and 600 ml; the image shows two related bottle sizes.
- A040 / BB13: capacity 600 ml and 750 ml.
- A042 / BB7-BB8: capacity 750 ml and 600 ml.
- A043 / BB09-BB10: capacity 750 ml and 600 ml.
- A124 / BB12-BB32: panel shows two forms; 600 ml is printed for BB12. Treat shape/model as separate until confirmed.
- A150 / BB28: colour red, blue, black, pink; capacity 750 ml.
- A123 / BB26: colour red, blue, black, purple; capacity 650 ml.
- A127 / BB28: three lid/colour presentations shown; capacity 750 ml.

Important: similar silhouettes and capacities do not prove products are identical. Preserve separate parent models unless the panel itself presents choices under one model/code.

### Stainless-steel drinkware (PDF pages 7-8)

Keep distinct product models by form and printed BB model number: A130, A131, A132, A027, A109, A134, A029, A030, A031, A151, A033, A034, A035, A036, A037, A038.
Visible colour options:
- A029 Big Mouth Bottle BB12: white, silver.
- A030 Starbucks Tumbler BB14: white, silver.
- A038 Travel Mug BB20: white, silver.
- A109 is labelled Pink Skinny Tumbler; do not infer other colours.
- A037 Skinny Tumbler BB21 shows two lid/straw configurations in the image. Confirm whether these are variants or included accessories before modelling.

### MDF and accessories (PDF pages 9-10, 13)

- A044-A050 are distinct MDF keychain shapes (rectangle, circle, heart, tag, house, pentagon, oval). Proposed family: MDF Keychain, option group Shape. Keep source code per shape as reference and SKU suffix.
- A051 shows several coaster shapes/material appearances (round and square, white and brown backing). Proposed family: Sublimation Coaster, options Shape and Backing/finish, but confirm which shown forms are actual supplied options.
- A052 shows round and square sublimation fridge magnets. Proposed family: Sublimation Fridge Magnet, option Shape (round, square).
- MDF collage frames A053-A066 are different designs and dimensions. Keep each distinct as a model/design rather than treating unrelated artwork as a colour option. Dimensions are product attributes unless customer-selectable.
- A081 Sublimation Mouse Pad is distinct.
- A082 Pin Badge visibly has 44 mm and 58 mm sizes. One product with Size option.
- A083 Magnet 58 mm is distinct.

### Fur pillows and flip sequin (PDF pages 11-12)

- Fur square pillow: A067 red and A069 pink appear to be one model with Colour option (red, pink).
- Long fur square pillow A068 remains separate until another colour is shown.
- Fur heart pillow: A070 red and A072 pink appear to be one model with Colour option (red, pink).
- Long fur heart pillow A071 remains separate.
- LED square pillow A073 and LED heart pillow A074 remain separate models.
- Flip-sequin A075/A076: same square magic pillow form with white-back vs colour-back construction; proposed Backing option (white, colour).
- A077 and A078 are distinct square magic-patch designs (heart emboss vs love emboss).
- A079/A080: same magic heart form with white-back vs colour-back construction; proposed Backing option (white, colour).
- A040 printed at top of page 12 appears to be a section/banner code, not a separate product. Verify source code collision before using it.

### Hard board (PDF page 14)

The current JSON manifest is incomplete here. The PDF visibly shows:
- AC-HB-013 through AC-HB-021: nine distinct printed hard-board designs/forms.
- A084: phone stand / mobile stand shown in two presentations (printed code A084).
These must be added to the source-item inventory. Do not collapse the nine AC-HB entries into one variant family merely because they share the Hard Board heading; their shapes/designs differ.

### Apparel and bags (PDF page 15)

- Round-neck T-shirt family: black cotton, white cotton, white polyester. Proposed options: Colour, Material, Size. Sizes XS, S, M, L, XL, 2XL are visibly listed for the cotton variants. Polyester size availability is not established; do not create those combinations until confirmed.
- Collar/polo T-shirt family: white cotton and black cotton. The source indicates sizes, but exact list must be read/confirmed before variants are created.
- Blended plush tote bag: one distinct model, 37 x 42 cm.

### Glass frames and kids bottles (PDF page 16)

- Glass frame models BL-01, BL-03, BL-04, BL-11, BL-14, BL-28, BL-29, BL-31, BL-48, BL-50 are separate design/model entries. Printed code ambiguity around A090 must be resolved; don't silently change source identifiers.
- Kids water bottles A135 and A136 appear to be different bottle models. Colour swatches are shown; inspect high-resolution page for exact mapping before defining options.

### Stone and wooden frames (PDF page 17)

- Stone frame shapes/opening styles are distinct models: semicircle, natural edge, up-opening, right-open, square.
- SH-01 and SH-02 share a shape name but different dimensions. Keep as size variants only if the physical frame design is otherwise identical; otherwise separate.
- SH-03 and SH-04 appear to have the same name and dimensions. Check whether they are duplicates, different designs or source-code variants before deciding.
- SH-38 and SH-39 are wooden frames; compare the image and dimensions before grouping.

## Required next steps before any new import

1. Complete source-item inventory for every visual item, including page 14 hard-board entries omitted from the current 138-record JSON.
2. Confirm ambiguous option mappings and same-model groupings using high-resolution page images.
3. Produce a normalized master catalogue with stable internal product codes, parent product IDs, option groups and only valid variant combinations.
4. Add source references (page and printed code/label) to every normalized product/variant.
5. Build a separate test-only rebuild script that explicitly validates the test database target, backs up/exports current test catalogue state, and does not delete or modify collections.
6. Verify Vendure product/variant/option relationships against the project's actual Vendure version and GraphQL schema before running the rebuild.
7. Run a dry-run report first. Do not write to production or ask the user to run a destructive command until the dry-run is reviewed.

## Current database state

The previous import reported 138 products and 148 variants created, with no API failures. Those records are a first-pass import only and must not be treated as the final catalogue model. They are disabled. The existing collection hierarchy should be retained during correction.
