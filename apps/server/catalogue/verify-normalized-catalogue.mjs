/**
 * Read-only verification of the imported RS Prints catalogue.
 * Run from apps/server:
 *   node --env-file=.env.test catalogue/verify-normalized-catalogue.mjs
 * No mutations are performed.
 */
import fs from 'node:fs';
import path from 'node:path';

const plan = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'normalized-catalogue-plan.json'), 'utf8'));
const endpoint = process.env.VENDURE_ADMIN_API_URL || `http://localhost:${process.env.VENDURE_SERVER_PORT || 3000}/admin-api`;
if (!/^https?:\\/\\/(localhost|127\\.0\\.0\\.1)(:\\d+)?\\//i.test(endpoint)) {
  throw new Error('Blocked: verification is restricted to a localhost Admin API endpoint.');
}
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) {
  throw new Error('Missing SUPERADMIN_USERNAME or SUPERADMIN_PASSWORD in .env.test.');
}
let token = '';
async function gql(query, variables = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) throw new Error(JSON.stringify(body.errors || body, null, 2));
  return body.data;
}
const loginResponse = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    query: `mutation Login($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        ... on CurrentUser { id }
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
token = loginResponse.headers.get('vendure-auth-token') || '';
if (!token) throw new Error('Vendure login returned no bearer token.');

const data = await gql(`
  query VerifyNormalizedCatalogue {
    products(options: { take: 1000 }) {
      totalItems
      items {
        id slug name enabled
        variants { id sku enabled }
        optionGroups { id code }
        facetValues { id code }
      }
    }
    facets(options: { take: 100 }) {
      items { id code values { id code name } }
    }
    productOptionGroups(options: { take: 100 }) {
      items { id code options { id code name } }
    }
  }
`);

const products = data.products.items;
const bySlug = new Map(products.map(p => [p.slug, p]));
const facet = data.facets.items.find(f => f.code === 'catalogue_collection');
if (!facet) throw new Error('Could not find catalogue_collection facet. This check made no changes.');
const collectionValues = new Map(facet.values.map(v => [v.code.toLowerCase().replace(/_/g, '-'), v]));
const globalGroups = new Map(data.productOptionGroups.items.map(g => [g.code, g]));
const missingProducts = [];
const missingVariants = [];
const missingOptionGroups = [];
const wrongCollections = [];
const enabledProducts = [];
const enabledVariants = [];
const expectedVariantCount = plan.productModels.reduce((sum, model) => {
  const groups = model.optionGroups || [];
  if (!groups.length) return sum + 1;
  if (groups.length === 1) return sum + groups[0].values.length;
  return sum + (model.variantCombinations || []).length;
}, 0);

for (const model of plan.productModels) {
  const slug = model.productCode.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const product = bySlug.get(slug);
  if (!product) {
    missingProducts.push({ productCode: model.productCode, slug });
    continue;
  }
  if (product.enabled) enabledProducts.push({ productCode: model.productCode, name: product.name });
  const expectedCollection = collectionValues.get(model.collectionSlug);
  if (!expectedCollection || !product.facetValues.some(v => v.id === expectedCollection.id)) {
    wrongCollections.push({ productCode: model.productCode, expectedCollection: model.collectionSlug });
  }
  const attached = new Set(product.optionGroups.map(g => g.code));
  for (const group of model.optionGroups || []) {
    const groupCode = group.name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase();
    if (!attached.has(groupCode)) missingOptionGroups.push({ productCode: model.productCode, optionGroup: group.name, expectedCode: groupCode });
  }
  const groups = model.optionGroups || [];
  let combinations = [];
  if (!groups.length) combinations = [{}];
  else if (groups.length === 1) combinations = groups[0].values.map(value => ({ [groups[0].name]: value }));
  else combinations = model.variantCombinations || [];
  const skus = new Set(product.variants.map(v => v.sku));
  for (const options of combinations) {
    const skuPart = value => String(value).normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();
    const sku = groups.length
      ? `${model.productCode}-${groups.map(g => skuPart(options[g.name])).join('-')}`
      : `${model.productCode}-DEFAULT`;
    if (!skus.has(sku)) missingVariants.push({ productCode: model.productCode, sku });
  }
  for (const variant of product.variants) {
    if (variant.enabled) enabledVariants.push({ productCode: model.productCode, sku: variant.sku });
  }
}

const importedProductsFound = plan.productModels.filter(model => {
  const slug = model.productCode.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return bySlug.has(slug);
}).length;
const importedVariantsFound = plan.productModels.reduce((sum, model) => {
  const slug = model.productCode.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const product = bySlug.get(slug);
  return sum + (product ? product.variants.length : 0);
}, 0);
const report = {
  status: missingProducts.length || missingVariants.length || missingOptionGroups.length || wrongCollections.length
    ? 'REVIEW_REQUIRED' : 'STRUCTURE_CHECK_PASSED',
  endpoint,
  totalVendureProducts: data.products.totalItems,
  importedParentProductsFound: importedProductsFound,
  expectedParentProducts: plan.productModels.length,
  importedVariantsFound,
  expectedVariants: expectedVariantCount,
  missingProducts,
  missingVariants,
  missingOptionGroups,
  wrongCollections,
  enabledImportedProducts: enabledProducts,
  enabledImportedVariants: enabledVariants,
  globalOptionGroupsFound: data.productOptionGroups.items.length,
  note: 'Read-only verification. No products, variants, options, collections, prices, or stock were changed.',
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'STRUCTURE_CHECK_PASSED') process.exitCode = 1;
