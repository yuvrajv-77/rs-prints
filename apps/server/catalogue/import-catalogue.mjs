/**
 * Import the RS Prints catalogue into Vendure through the Admin GraphQL API.
 *
 * Safety:
 * - Refuses to run unless explicitly pointed at a non-production environment.
 * - Creates products and variants disabled with a zero placeholder price.
 * - Never deletes or overwrites existing catalogue records.
 * - Run only against a disposable/staging database first.
 *
 * Required env:
 *   CATALOGUE_IMPORT_ALLOW=true
 *   CATALOGUE_IMPORT_ENV=staging
 *   VENDURE_ADMIN_API_URL=http://localhost:3000/admin-api
 *   SUPERADMIN_USERNAME=...
 *   SUPERADMIN_PASSWORD=...
 *
 * Run from apps/server:
 *   node --env-file=.env catalogue/import-catalogue.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.join(import.meta.dirname, 'rs-prints-catalogue.json');
const catalogue = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const allRequested = process.argv.includes('--all');
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const limit = allRequested ? catalogue.products.length : Number(limitArg?.split('=')[1] || 3);
if (!Number.isInteger(limit) || limit < 1) {
  throw new Error('Use --limit=N with a positive integer, or --all after the pilot import has been reviewed.');
}
const selectedProducts = catalogue.products.slice(0, limit);

const endpoint = process.env.VENDURE_ADMIN_API_URL || `http://localhost:${process.env.VENDURE_SERVER_PORT || 3000}/admin-api`;

if (process.env.CATALOGUE_IMPORT_ALLOW !== 'true') {
  throw new Error('Blocked. Set CATALOGUE_IMPORT_ALLOW=true only after verifying the target database.');
}
if (!['local', 'staging', 'development'].includes((process.env.CATALOGUE_IMPORT_ENV || '').toLowerCase())) {
  throw new Error('Blocked. CATALOGUE_IMPORT_ENV must be local, development, or staging. Production is not supported.');
}
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) {
  throw new Error('SUPERADMIN_USERNAME and SUPERADMIN_PASSWORD are required.');
}

let authToken = '';
async function gql(query, variables = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) {
    throw new Error(JSON.stringify(body.errors || body, null, 2));
  }
  return body.data;
}

// Authenticate once and retain the token returned by Vendure.
const loginResponse = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    query: `mutation Login($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        ... on CurrentUser { id identifier }
        ... on ErrorResult { errorCode message }
      }
    }`,
    variables: { username: process.env.SUPERADMIN_USERNAME, password: process.env.SUPERADMIN_PASSWORD },
  }),
});
const loginBody = await loginResponse.json();
if (!loginResponse.ok || loginBody.errors?.length || !loginBody.data?.login?.id) {
  throw new Error(`Vendure login failed: ${JSON.stringify(loginBody.errors || loginBody.data?.login || loginBody)}`);
}
authToken = loginResponse.headers.get('vendure-auth-token') || '';
if (!authToken) {
  throw new Error('Login succeeded but no vendure-auth-token header was returned. Check authOptions.tokenMethod in vendure-config.ts.');
}

const languageCode = 'en';
const translations = (name, description = '') => [{ languageCode, name, description }];
const slugify = value => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const codeOf = value => slugify(value).replace(/-/g, '_').toUpperCase();

async function listExisting() {
  const data = await gql(`
    query ExistingCatalogue {
      products(options: { take: 1000 }) {
        items { id name slug variants { sku } }
      }
      facets(options: { take: 100 }) {
        items { id code name values { id code name } }
      }
      productOptionGroups(options: { take: 100 }) {
        items { id code name options { id code name } }
      }
      collections(options: { take: 100 }) {
        items { id slug name }
      }
    }
  `);
  return data;
}

const existing = await listExisting();
const productBySlug = new Map(existing.products.items.map(p => [p.slug, p]));
const facetByCode = new Map(existing.facets.items.map(f => [f.code, f]));
const collectionBySlug = new Map(existing.collections.items.map(c => [c.slug, c]));
const optionGroupByCode = new Map(existing.productOptionGroups.items.map(g => [g.code, g]));

async function ensureFacet(code, name, values) {
  let facet = facetByCode.get(code);
  if (!facet) {
    const result = await gql(`
      mutation CreateFacet($input: CreateFacetInput!) {
        createFacet(input: $input) { id code name values { id code name } }
      }
    `, { input: {
      code,
      isPrivate: false,
      translations: [{ languageCode, name }],
      values: values.map(value => ({
        code: codeOf(value),
        translations: [{ languageCode, name: value }],
      })),
    }});
    facet = result.createFacet;
  } else {
    const existingValueCodes = new Set((facet.values || []).map(value => value.code));
    const missingValues = values.filter(value => !existingValueCodes.has(codeOf(value)));
    if (missingValues.length) {
      const created = await gql(`
        mutation CreateFacetValues($input: [CreateFacetValueInput!]!) {
          createFacetValues(input: $input) { id code name }
        }
      `, { input: missingValues.map(value => ({
        facetId: facet.id,
        code: codeOf(value),
        translations: [{ languageCode, name: value }],
      })) });
      facet.values = [...(facet.values || []), ...created.createFacetValues];
    }
  }
  facetByCode.set(code, facet);
  return facet;
}

const categoryFacet = await ensureFacet('catalogue_category', 'Catalogue category', catalogue.categories);
const categoryValueByName = new Map(categoryFacet.values.map(v => [v.name, v]));
const materialNames = [...new Set(catalogue.products.flatMap(p => p.material ? [p.material] : []))];
const materialFacet = materialNames.length
  ? await ensureFacet('material', 'Material', materialNames)
  : null;
const materialValueByName = new Map((materialFacet?.values || []).map(v => [v.name, v]));

const sizeGroupCode = 'apparel_size';
let sizeGroup = optionGroupByCode.get(sizeGroupCode);
const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
if (!sizeGroup) {
  const result = await gql(`
    mutation CreateOptionGroup($input: CreateProductOptionGroupInput!) {
      createProductOptionGroup(input: $input) {
        id code name options { id code name }
      }
    }
  `, { input: {
    code: sizeGroupCode,
    translations: [{ languageCode, name: 'Size' }],
    options: sizes.map(size => ({ code: size.toLowerCase(), translations: [{ languageCode, name: size }] })),
  }});
  sizeGroup = result.createProductOptionGroup;
} else {
  const existingOptionCodes = new Set((sizeGroup.options || []).map(option => option.code));
  for (const size of sizes.filter(value => !existingOptionCodes.has(value.toLowerCase()))) {
    const created = await gql(`
      mutation CreateOption($input: CreateProductOptionInput!) {
        createProductOption(input: $input) { id code name }
      }
    `, { input: {
      productOptionGroupId: sizeGroup.id,
      code: size.toLowerCase(),
      translations: [{ languageCode, name: size }],
    }});
    sizeGroup.options.push(created.createProductOption);
  }
}
optionGroupByCode.set(sizeGroupCode, sizeGroup);

let createdProducts = 0;
let resumedProducts = 0;
let skippedProducts = 0;
let createdVariants = 0;
const failures = [];

for (const item of selectedProducts) {
  const slug = item.slug || `${slugify(item.name)}-${slugify(item.code)}`;
  const existingProduct = productBySlug.get(slug);
  if (existingProduct?.variants?.length) {
    skippedProducts++;
    continue;
  }
  try {
    let product = existingProduct;
    if (!product) {
      const facetValueIds = [categoryValueByName.get(item.category)?.id].filter(Boolean);
      if (item.material && materialValueByName.has(item.material)) {
        facetValueIds.push(materialValueByName.get(item.material).id);
      }
      const description = [
        item.specification ? `Specification: ${item.specification}` : null,
        `Catalogue code: ${item.code}`,
        `Source: RS Prints catalogue, page ${item.sourcePage}`,
        'Price and stock not supplied in source catalogue.',
      ].filter(Boolean).join('\\n');

      const created = await gql(`
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) { id name slug }
        }
      `, { input: {
        enabled: false,
        facetValueIds,
        translations: [{ languageCode, name: item.name, slug, description }],
      }});
      product = created.createProduct;
      createdProducts++;
    } else {
      // The previous attempt created the product but failed before creating variants.
      resumedProducts++;
    }

    let variantInputs;
    if (item.optionGroup === 'apparel_size') {
      await gql(`
        mutation AddOptionGroup($productId: ID!, $optionGroupId: ID!) {
          addOptionGroupToProduct(productId: $productId, optionGroupId: $optionGroupId) { id }
        }
      `, { productId: product.id, optionGroupId: sizeGroup.id });
      variantInputs = sizeGroup.options.map(option => ({
        productId: product.id,
        enabled: false,
        sku: `${item.code}-${option.name}`,
        price: 0,
        optionIds: [option.id],
        translations: [{ languageCode, name: `${item.name} - ${option.name}` }],
      }));
    } else {
      variantInputs = [{
        productId: product.id,
        enabled: false,
        sku: item.code,
        price: 0,
        translations: [{ languageCode, name: item.name }],
      }];
    }

    const variantResult = await gql(`
      mutation CreateVariants($input: [CreateProductVariantInput!]!) {
        createProductVariants(input: $input) { id sku enabled }
      }
    `, { input: variantInputs });
    createdVariants += variantResult.createProductVariants.filter(Boolean).length;
    createdProducts++;
  } catch (error) {
    failures.push({ code: item.code, name: item.name, error: error.message });
  }
}

for (const category of catalogue.categories) {
  const slug = slugify(category);
  if (collectionBySlug.has(slug)) continue;
  const value = categoryValueByName.get(category);
  if (!value) continue;
  try {
    await gql(`
      mutation CreateCollection($input: CreateCollectionInput!) {
        createCollection(input: $input) { id name slug }
      }
    `, { input: {
      inheritFilters: false,
      filters: [{
        code: 'facet-value-filter',
        arguments: [
          { name: 'facetValueIds', value: JSON.stringify([value.id]) },
          { name: 'containsAny', value: 'true' },
        ],
      }],
      translations: [{
        languageCode,
        name: category,
        slug,
        description: `RS Prints catalogue: ${category}`,
      }],
    }});
  } catch (error) {
    failures.push({ collection: category, error: error.message });
  }
}

console.log(JSON.stringify({
  endpoint,
  requestedProducts: selectedProducts.length,
  createdProducts,
  resumedProducts,
  skippedProducts,
  createdVariants,
  collectionsExpected: catalogue.categories.length,
  importMode: allRequested ? 'all' : 'pilot',
  failures,
}, null, 2));
