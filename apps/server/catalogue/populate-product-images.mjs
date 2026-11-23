/**
 * Populate RS Prints Product Images via Vendure Admin API.
 *
 * Ensures at least 1 image is assigned to every product.
 *
 * Capabilities:
 * 1. Custom Image Lookup:
 *    Scans an images directory (default: `apps/server/catalogue/images`) for files
 *    matching product slug, product code (e.g. A001, MUG-3TONE-HEART), or product name.
 * 2. Category Fallback Image:
 *    If no specific image file is present for a product, automatically assigns
 *    the corresponding category image (e.g. mugs.png, drinkware.png, clothing.png)
 *    from `apps/storefront/public/categories/`.
 * 3. Asset Deduplication / Low Network Egress:
 *    Reuses uploaded fallback assets in memory so each category placeholder is
 *    uploaded to Vendure / S3 EXACTLY ONCE.
 * 4. Safety:
 *    - Runs in --dry-run preview mode by default. Pass --apply to perform writes.
 *    - Skips products that already have an image unless --force is specified.
 *    - Supports --limit=N for pilot runs, or --all for the full catalogue.
 *
 * Usage:
 *   cd apps/server
 *   node --env-file=.env catalogue/populate-product-images.mjs              # Dry-run
 *   node --env-file=.env catalogue/populate-product-images.mjs --apply      # Apply (first 5)
 *   node --env-file=.env catalogue/populate-product-images.mjs --apply --all# Apply all products
 */

import fs from 'node:fs';
import path from 'node:path';

// --- Environment & Preflight Checks ---
if ((process.env.APP_ENV || '').toLowerCase() !== 'dev') {
  throw new Error('Blocked: APP_ENV must be "dev" in apps/server/.env.');
}
if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL. Run with --env-file=.env.');
}
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) {
  throw new Error('Missing SUPERADMIN_USERNAME or SUPERADMIN_PASSWORD in .env.');
}

const endpoint =
  process.env.VENDURE_ADMIN_API_URL ||
  `http://localhost:${process.env.VENDURE_SERVER_PORT || 3000}/admin-api`;

const endpointUrl = new URL(endpoint);
if (!['localhost', '127.0.0.1'].includes(endpointUrl.hostname) || endpointUrl.pathname !== '/admin-api') {
  throw new Error(`Blocked: only localhost /admin-api is permitted. Got: ${endpoint}`);
}

// --- CLI Arguments ---
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const force = args.includes('--force');
const allRequested = args.includes('--all');
const limitArg = args.find(a => a.startsWith('--limit='));
const customDirArg = args.find(a => a.startsWith('--images-dir='));

const limit = allRequested ? Infinity : Number(limitArg?.split('=')[1] || 5);
if (!Number.isFinite(limit) || limit < 1) {
  throw new Error('Invalid --limit parameter. Must be a positive integer.');
}

// --- Directory Paths ---
const serverDir = process.cwd();
const defaultImagesDir = path.resolve(serverDir, 'catalogue', 'images');
const imagesDir = customDirArg
  ? path.resolve(serverDir, customDirArg.split('=')[1].replace(/^["']|["']$/g, ''))
  : defaultImagesDir;

const storefrontCategoriesDir = path.resolve(serverDir, '../storefront/public/categories');

// Category slug to fallback image mapping
const COLLECTION_CATEGORY_MAP = {
  // Mugs
  'ceramic-mugs': 'mugs.png',
  'glass-mugs': 'mugs.png',

  // Drinkware
  'aluminium-bottles': 'drinkware.png',
  'stainless-steel-bottles-drinkware': 'drinkware.png',
  'kids-bottles': 'drinkware.png',
  'glass-drinkware': 'drinkware.png',

  // Clothing
  'custom-t-shirts': 'clothing.png',
  'custom-polo-t-shirts': 'clothing.png',

  // Bags
  'custom-bags': 'bags.png',
  'custom-tote-bags': 'bags.png',

  // Home & Living
  'fur-pillows': 'home-living.png',
  'flip-sequin': 'home-living.png',

  // Gifts & Accessories
  'mdf-products': 'gifts-accessories.png',
  'mdf-collage-frames': 'gifts-accessories.png',
  'glass-frames': 'gifts-accessories.png',
  'stone-wooden-frames': 'gifts-accessories.png',
  'sublimation-accessories': 'gifts-accessories.png',
  'hard-board-products': 'gifts-accessories.png',
};

const DEFAULT_FALLBACK_IMAGE = 'gifts-accessories.png';

// MIME type lookup
const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const normalizeKey = val =>
  String(val || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// --- Build Local Custom Images Index ---
const customImagesMap = new Map();
if (fs.existsSync(imagesDir)) {
  const files = fs.readdirSync(imagesDir, { withFileTypes: true });
  for (const file of files) {
    if (file.isFile()) {
      const ext = path.extname(file.name).toLowerCase();
      if (MIME_TYPES[ext]) {
        const baseName = path.basename(file.name, ext);
        const norm = normalizeKey(baseName);
        customImagesMap.set(norm, path.join(imagesDir, file.name));
      }
    }
  }
}

// Optional catalogue plan for extra code mapping
let planBySlug = new Map();
try {
  const planPath = path.resolve(serverDir, 'catalogue', 'normalized-catalogue-plan.json');
  if (fs.existsSync(planPath)) {
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    for (const model of plan.productModels || []) {
      const slug = normalizeKey(model.productCode);
      planBySlug.set(slug, model);
      if (model.name) planBySlug.set(normalizeKey(model.name), model);
    }
  }
} catch {
  // Plan is optional, continue
}

// --- Helper: Find Best Matching Image For A Product ---
function resolveProductImage(product) {
  const candidates = [
    normalizeKey(product.slug),
    normalizeKey(product.name),
  ];

  const planModel = planBySlug.get(normalizeKey(product.slug)) || planBySlug.get(normalizeKey(product.name));
  if (planModel) {
    if (planModel.productCode) candidates.push(normalizeKey(planModel.productCode));
    for (const code of planModel.sourceCodes || []) {
      candidates.push(normalizeKey(code));
    }
  }

  // 1. Check custom images directory
  for (const cand of candidates) {
    if (customImagesMap.has(cand)) {
      return {
        type: 'custom',
        filePath: customImagesMap.get(cand),
        fileName: path.basename(customImagesMap.get(cand)),
        source: 'custom_file',
      };
    }
  }

  // 2. Resolve category fallback
  const collectionSlugs = (product.collections || []).map(c => c.slug);
  let categoryImageName = DEFAULT_FALLBACK_IMAGE;

  for (const slug of collectionSlugs) {
    if (COLLECTION_CATEGORY_MAP[slug]) {
      categoryImageName = COLLECTION_CATEGORY_MAP[slug];
      break;
    }
  }

  const fallbackPath = path.join(storefrontCategoriesDir, categoryImageName);
  if (fs.existsSync(fallbackPath)) {
    return {
      type: 'category_fallback',
      filePath: fallbackPath,
      fileName: categoryImageName,
      source: `category_${categoryImageName}`,
    };
  }

  return null;
}

// --- GraphQL Helper Functions ---
let authToken = '';

async function gql(query, variables = {}) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = await res.json();
  if (!res.ok || body.errors?.length) {
    throw new Error(`GraphQL Error: ${JSON.stringify(body.errors || body, null, 2)}`);
  }
  return { data: body.data, headers: res.headers };
}

async function uploadAsset(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'image/png';
  const fileBuffer = fs.readFileSync(filePath);

  const formData = new FormData();
  const operations = {
    query: `mutation CreateAssets($input: [CreateAssetInput!]!) {
      createAssets(input: $input) {
        ... on Asset {
          id
          name
          preview
          source
        }
        ... on MimeTypeError {
          errorCode
          message
          fileName
          mimeType
        }
      }
    }`,
    variables: {
      input: [{ file: null }],
    },
  };

  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify({ '0': ['variables.input.0.file'] }));

  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append('0', blob, fileName);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
    },
    body: formData,
  });

  const body = await res.json();
  if (!res.ok || body.errors?.length) {
    throw new Error(`Asset upload HTTP error: ${JSON.stringify(body.errors || body, null, 2)}`);
  }

  const result = body.data?.createAssets?.[0];
  if (!result) {
    throw new Error(`No asset returned: ${JSON.stringify(body)}`);
  }
  if (result.errorCode) {
    throw new Error(`Asset creation error [${result.errorCode}]: ${result.message}`);
  }

  return result;
}

async function assignAssetToProduct(productId, assetId, currentAssetIds = []) {
  const assetIds = Array.from(new Set([assetId, ...currentAssetIds]));
  const query = `mutation AssignProductImage($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      name
      featuredAsset {
        id
        preview
      }
      assets {
        id
      }
    }
  }`;

  const res = await gql(query, {
    input: {
      id: productId,
      featuredAssetId: assetId,
      assetIds,
    },
  });

  return res.data.updateProduct;
}

// --- Main Execution Flow ---
async function main() {
  console.log('='.repeat(70));
  console.log('  RS PRINTS: PRODUCT IMAGE POPULATION SCRIPT');
  console.log('='.repeat(70));
  console.log(`Endpoint:           ${endpoint}`);
  console.log(`Execution Mode:     ${apply ? 'APPLY (Active writes)' : 'DRY-RUN (Preview only)'}`);
  console.log(`Overwrite Existing: ${force ? 'YES (--force)' : 'NO (Skip if image present)'}`);
  console.log(`Custom Images Dir:  ${imagesDir} (${customImagesMap.size} files indexed)`);
  console.log(`Fallback Dir:       ${storefrontCategoriesDir}`);
  console.log(`Limit:              ${Number.isFinite(limit) ? limit : 'ALL'}`);
  console.log('-'.repeat(70));

  let loginRes;
  try {
    loginRes = await gql(
      `mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          ... on CurrentUser { id identifier }
          ... on ErrorResult { errorCode message }
        }
      }`,
      {
        username: process.env.SUPERADMIN_USERNAME,
        password: process.env.SUPERADMIN_PASSWORD,
      }
    );
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED' || err.cause?.code === 'EACCES' || err.message?.includes('fetch failed')) {
      throw new Error(
        `Could not connect to Vendure server at ${endpoint}.\n` +
        `Please ensure your Vendure server is running before executing this script:\n` +
        `  cd apps/server\n` +
        `  pnpm run dev:server`
      );
    }
    throw err;
  }

  if (!loginRes.data.login?.id) {
    throw new Error(`Vendure login failed: ${JSON.stringify(loginRes.data.login)}`);
  }

  authToken = loginRes.headers.get('vendure-auth-token') || '';
  if (!authToken) {
    throw new Error('Vendure login succeeded but no auth token was returned.');
  }
  console.log(`Authenticated as:   ${loginRes.data.login.identifier}`);

  // 2. Query products from Admin API
  const productQueryRes = await gql(`
    query GetProductsForImagePopulation {
      products(options: { take: 1000 }) {
        totalItems
        items {
          id
          name
          slug
          enabled
          featuredAsset {
            id
            preview
          }
          assets {
            id
            preview
          }
          collections {
            id
            slug
            name
          }
        }
      }
    }
  `);

  const allProducts = productQueryRes.data.products.items || [];
  console.log(`Total Products in Store: ${allProducts.length}`);

  // Filter products needing images
  const targetProducts = [];
  let alreadyHasImageCount = 0;

  for (const prod of allProducts) {
    const hasImage = Boolean(prod.featuredAsset?.id || prod.assets?.length);
    if (hasImage && !force) {
      alreadyHasImageCount++;
      continue;
    }
    targetProducts.push(prod);
  }

  console.log(`Products with Existing Images: ${alreadyHasImageCount} (skipped)`);
  console.log(`Products Needing Images:       ${targetProducts.length}`);

  const productsToProcess = targetProducts.slice(0, limit);
  console.log(`Products to Process This Run:  ${productsToProcess.length}`);
  console.log('-'.repeat(70));

  if (productsToProcess.length === 0) {
    console.log('No products need images. All products are already equipped with assets!');
    return;
  }

  // Cache uploaded assets to deduplicate uploads and keep bandwidth minimal!
  // Map of filePath -> Asset object
  const uploadedAssetsCache = new Map();
  let totalBytesUploaded = 0;
  let assetsCreatedCount = 0;
  let productsUpdatedCount = 0;

  for (let i = 0; i < productsToProcess.length; i++) {
    const prod = productsToProcess[i];
    const imageMatch = resolveProductImage(prod);

    if (!imageMatch) {
      console.warn(`[${i + 1}/${productsToProcess.length}] [SKIP] No matching image found for: ${prod.name} (${prod.slug})`);
      continue;
    }

    const { filePath, fileName, type, source } = imageMatch;
    const fileSize = fs.statSync(filePath).size;

    console.log(
      `[${i + 1}/${productsToProcess.length}] Product: "${prod.name}" (${prod.slug})`
    );
    console.log(
      `   -> Image Source: [${type}] ${fileName} (${(fileSize / 1024).toFixed(1)} KB)`
    );

    if (!apply) {
      // Dry-run mode: just record planned action
      continue;
    }

    // Apply Mode:
    try {
      let asset = uploadedAssetsCache.get(filePath);
      if (!asset) {
        // Upload the asset to Vendure Admin API
        console.log(`   -> Uploading new asset: ${fileName}...`);
        asset = await uploadAsset(filePath, fileName);
        uploadedAssetsCache.set(filePath, asset);
        assetsCreatedCount++;
        totalBytesUploaded += fileSize;
        console.log(`   -> Asset created: ID ${asset.id} (Preview: ${asset.preview})`);
      } else {
        console.log(`   -> Reusing cached asset: ID ${asset.id} (Saved ${(fileSize / 1024).toFixed(1)} KB upload!)`);
      }

      // Assign the asset as featuredAsset and in assets array
      const existingAssetIds = (prod.assets || []).map(a => a.id);
      await assignAssetToProduct(prod.id, asset.id, existingAssetIds);
      productsUpdatedCount++;
      console.log(`   -> Assigned to product "${prod.name}".`);
    } catch (err) {
      console.error(`   -> ERROR processing product ${prod.id}:`, err.message);
    }
  }

  console.log('='.repeat(70));
  console.log('  SUMMARY REPORT');
  console.log('='.repeat(70));
  console.log(`Products Processed:     ${productsToProcess.length}`);
  if (apply) {
    console.log(`Products Updated:       ${productsUpdatedCount}`);
    console.log(`Unique Assets Created:  ${assetsCreatedCount}`);
    console.log(`Total Upload Traffic:   ${(totalBytesUploaded / 1024).toFixed(2)} KB (~${(totalBytesUploaded / (1024 * 1024)).toFixed(3)} MB)`);
    console.log(`Database Egress Impact: Minimal (~few KB of SQL metadata)`);
  } else {
    console.log(`Mode:                   DRY RUN (No changes made)`);
    console.log(`To execute these image updates, re-run with:`);
    console.log(`  node --env-file=.env catalogue/populate-product-images.mjs --apply ${allRequested ? '--all' : `--limit=${limit}`}`);
  }
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('\nFatal Error:', err);
  process.exit(1);
});
