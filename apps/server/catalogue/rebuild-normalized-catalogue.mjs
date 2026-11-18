/**
 * Safely populate the RS Prints TEST catalogue with normalized products.
 *
 * Default: read-only preview.
 * Apply: node --env-file=.env.test catalogue/rebuild-normalized-catalogue.mjs --apply
 *
 * Default: read-only preview.
 * --apply: additive import (preserves existing products).
 * --apply --reset-test: DESTRUCTIVE test-catalogue reset, then rebuild.
 * Collections are never deleted or modified. Shared option groups are ensured
 * before any product deletion or creation.
 */
import fs from 'node:fs';
import path from 'node:path';

const readJson = name => JSON.parse(fs.readFileSync(path.join(import.meta.dirname, name), 'utf8'));
const plan = readJson('normalized-catalogue-plan.json');
const apply = process.argv.includes('--apply');
const resetTest = process.argv.includes('--reset-test');
if (resetTest && !apply) throw new Error('--reset-test requires --apply.');
const endpoint = process.env.VENDURE_ADMIN_API_URL || `http://localhost:${process.env.VENDURE_SERVER_PORT || 3000}/admin-api`;
const languageCode = 'en';
const slugify = value => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const codeOf = value => slugify(value).replace(/-/g, '_').toUpperCase();
const skuPart = value => String(value).normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();

const sourceCodes = plan.sourceItems.map(item => item.sourceCode);
const mappedCodes = plan.productModels.flatMap(model => model.sourceCodes || []);
const duplicate = values => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const errors = [];
const blockers = [];
const skuSet = new Set();
const prepared = [];

for (const code of duplicate(sourceCodes)) errors.push(`Duplicate source item: ${code}`);
for (const code of duplicate(mappedCodes)) errors.push(`Source item mapped more than once: ${code}`);
for (const code of sourceCodes) if (!mappedCodes.includes(code)) errors.push(`Unmapped source item: ${code}`);
for (const code of mappedCodes) if (!sourceCodes.includes(code)) errors.push(`Unknown source reference: ${code}`);

for (const model of plan.productModels) {
  const groups = model.optionGroups || [];
  let combinations = [];
  if (groups.length === 0) combinations = [{}];
  else if (groups.length === 1) combinations = groups[0].values.map(value => ({ [groups[0].name]: value }));
  else if (Array.isArray(model.variantCombinations) && model.variantCombinations.length) combinations = model.variantCombinations;
  else {
    blockers.push({ productCode: model.productCode, name: model.name, reason: 'Explicit valid combinations are required; Cartesian combinations are not inferred.' });
    continue;
  }

  const variants = combinations.map(options => {
    const optionParts = groups.map(group => skuPart(options[group.name]));
    const sku = groups.length ? `${model.productCode}-${optionParts.join('-')}` : `${model.productCode}-DEFAULT`;
    if (groups.some(group => !group.values.includes(options[group.name]))) errors.push(`Invalid option combination in ${model.productCode}: ${JSON.stringify(options)}`);
    if (skuSet.has(sku)) errors.push(`Duplicate generated SKU: ${sku}`);
    skuSet.add(sku);
    return { sku, options };
  });

  prepared.push({
    productCode: model.productCode,
    name: model.name,
    slug: slugify(model.productCode),
    collectionSlug: model.collectionSlug,
    sourceCodes: model.sourceCodes,
    optionGroups: groups,
    variants,
    enabled: false,
    price: 0,
    review: model.review || null,
    confidence: model.confidence,
  });
}

const report = {
  mode: resetTest ? 'APPLY_DESTRUCTIVE_TEST_RESET_AND_REBUILD' : apply ? 'APPLY_ADDITIVE_RESUMABLE' : 'DRY_RUN',
  endpoint,
  normalizedSourceItems: plan.sourceItems.length,
  normalizedParentProducts: plan.productModels.length,
  readyParentProducts: prepared.length,
  optionBearingProductsReady: prepared.filter(product => product.optionGroups.length).length,
  plannedVariants: prepared.reduce((sum, product) => sum + product.variants.length, 0),
  blockedProducts: blockers,
  errors,
  existingProducts: resetTest ? 'ALL TEST DATABASE PRODUCTS WILL BE DELETED BEFORE REBUILD' : 'PRESERVED',
  collections: 'PRESERVED: no collection mutation is performed.',
  pricingAndStock: 'Products and variants remain disabled; price placeholder is 0 until confirmed.',
};
console.log(JSON.stringify(report, null, 2));

if (errors.length) throw new Error('Catalogue validation failed. No database changes were made.');
if (blockers.length) {
  if (apply) throw new Error('Apply refused: resolve every blocked model first. No database changes were made.');
  process.exitCode = 1;
}
if (!apply) {
  console.log('DRY RUN ONLY. No Vendure login or database writes were performed.');
  process.exit(0);
}

if (process.env.CATALOGUE_IMPORT_ALLOW !== 'true') throw new Error('Blocked: set CATALOGUE_IMPORT_ALLOW=true explicitly.');
if (resetTest && process.env.CATALOGUE_ALLOW_TEST_PRODUCT_RESET !== 'YES_DELETE_ALL_TEST_PRODUCTS') {
  throw new Error('Blocked: destructive reset requires CATALOGUE_ALLOW_TEST_PRODUCT_RESET=YES_DELETE_ALL_TEST_PRODUCTS in .env.test.');
}
if ((process.env.CATALOGUE_IMPORT_ENV || '').toLowerCase() !== 'development') throw new Error('Blocked: CATALOGUE_IMPORT_ENV must be development.');
if (process.env.CATALOGUE_TEST_DATABASE_CONFIRMATION !== 'I_CONFIRM_THIS_IS_THE_RS_PRINTS_TEST_DATABASE') {
  throw new Error('Blocked: confirm the .env.test database using CATALOGUE_TEST_DATABASE_CONFIRMATION.');
}
if (!process.env.DATABASE_URL) throw new Error('Blocked: DATABASE_URL is missing. Verify that .env.test is loaded.');
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(endpoint)) {
  throw new Error('Blocked: Admin API must be localhost for this test-only import.');
}
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) throw new Error('Missing Vendure superadmin credentials.');

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
if (!token) throw new Error('Vendure login returned no auth token.');

const introspection = await gql(`query RebuildInputTypes {
  groupOption: __type(name: "CreateGroupOptionInput") { inputFields { name type { kind name ofType { kind name ofType { kind name } } } } }
  groupInput: __type(name: "CreateProductOptionGroupInput") { inputFields { name type { kind name ofType { kind name ofType { kind name } } } } }
}`);
const groupOptionFields = introspection.groupOption?.inputFields || [];
const requiredGroupOptionFields = groupOptionFields.filter(field => field.type.kind === 'NON_NULL').map(field => field.name);
for (const field of ['code', 'translations']) {
  if (!groupOptionFields.some(item => item.name === field)) throw new Error(`Vendure schema does not support CreateGroupOptionInput.${field}. No writes performed.`);
}
if (requiredGroupOptionFields.some(field => !['code', 'translations'].includes(field))) {
  throw new Error(`CreateGroupOptionInput has unsupported required fields: ${requiredGroupOptionFields.join(', ')}. No writes performed.`);
}
const groupInputFields = introspection.groupInput?.inputFields || [];
if (!groupInputFields.some(field => field.name === 'options')) throw new Error('CreateProductOptionGroupInput.options is unavailable. No writes performed.');

const snapshot = await gql(`
  query CatalogueRebuildPreflight {
    products(options: { take: 1000 }) {
      items {
        id slug name
        variants { id sku }
        optionGroups { id code }
        facetValues { id code }
      }
    }
    facets(options: { take: 100 }) { items { id code name values { id code name } } }
    productOptionGroups(options: { take: 100 }) { items { id code name options { id code name } } }
  }
`);
const productsBySlug = new Map(snapshot.products.items.map(product => [product.slug, product]));
const collectionFacet = snapshot.facets.items.find(facet => facet.code === 'catalogue_collection');
if (!collectionFacet) throw new Error('Missing catalogue_collection facet. No writes performed.');
const collectionValues = new Map(collectionFacet.values.map(value => [value.code.toLowerCase().replace(/_/g, '-'), value]));
for (const product of prepared) {
  if (!collectionValues.has(product.collectionSlug)) throw new Error(`Missing collection facet value "${product.collectionSlug}". No writes performed.`);
}

const groupByCode = new Map(snapshot.productOptionGroups.items.map(group => [group.code, group]));
const optionGroupsToEnsure = new Map();
for (const product of prepared) {
  for (const group of product.optionGroups) {
    const code = codeOf(group.name);
    const existing = optionGroupsToEnsure.get(code);
    optionGroupsToEnsure.set(code, {
      name: group.name,
      values: [...new Set([...(existing?.values || []), ...group.values])],
    });
  }
}


// Build every shared option group before product creation. Colour is a shared
// vocabulary; specialised groups (Handle Colour, Base Colour, etc.) remain
// separate so product choices retain their actual meaning.
const colourVocabulary = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Dark Green', 'Light Green',
  'Neon Green', 'Pink', 'Purple', 'Yellow', 'Light Yellow', 'Orange',
  'Brown', 'Gold', 'Silver', 'Rose Gold', 'Light Blue',
];
if (optionGroupsToEnsure.has('COLOUR')) {
  const colour = optionGroupsToEnsure.get('COLOUR');
  colour.values = [...new Set([...colour.values, ...colourVocabulary])];
}

// Ensure every shared option group and every required option value exists.
for (const [code, definition] of optionGroupsToEnsure) {
  let group = groupByCode.get(code);
  if (!group) {
    const options = definition.values.map(value => ({
      code: codeOf(value).toLowerCase(),
      translations: [{ languageCode, name: value }],
    }));
    const result = await gql(`
      mutation CreateOptionGroup($input: CreateProductOptionGroupInput!) {
        createProductOptionGroup(input: $input) { id code name options { id code name } }
      }
    `, { input: { code, translations: [{ languageCode, name: definition.name }], options } });
    group = result.createProductOptionGroup;
  } else {
    const existingOptions = new Set(group.options.map(option => option.code));
    for (const value of definition.values.filter(value => !existingOptions.has(codeOf(value).toLowerCase()))) {
      const result = await gql(`
        mutation CreateProductOption($input: CreateProductOptionInput!) {
          createProductOption(input: $input) { id code name }
        }
      `, { input: {
        productOptionGroupId: group.id,
        code: codeOf(value).toLowerCase(),
        translations: [{ languageCode, name: value }],
      }});
      group.options.push(result.createProductOption);
    }
  }
  groupByCode.set(code, group);
}


if (resetTest) {
  // The local Admin API + explicit .env.test confirmations are mandatory.
  // Delete products only. Facets, facet values, collections, assets,
  // option groups, and their option values are intentionally preserved.
  const productIds = snapshot.products.items.map(product => product.id);
  console.log(JSON.stringify({
    destructiveAction: 'DELETE_ALL_PRODUCTS_IN_CONFIRMED_TEST_DATABASE',
    productsToDelete: productIds.length,
    collectionsToPreserve: snapshot.facets.items.find(f => f.code === 'catalogue_collection')?.values.length ?? null,
    sharedOptionGroupsReady: groupByCode.size,
  }, null, 2));
  for (const id of productIds) {
    const result = await gql(`
      mutation DeleteTestCatalogueProduct($id: ID!) {
        deleteProduct(id: $id) { result message }
      }
    `, { id });
    if (result.deleteProduct.result !== 'DELETED') {
      throw new Error(`Product deletion stopped for id ${id}: ${result.deleteProduct.message || result.deleteProduct.result}. No new products have been imported yet; rerun after resolving the issue.`);
    }
  }
  // The preflight map contains now-deleted records. Clear it so the rebuild
  // creates fresh parent products instead of reusing stale database IDs.
  productsBySlug.clear();
  console.log(`Deleted ${productIds.length} existing test-database products. Collections and shared option groups were preserved.`);
}

let createdProducts = 0;
let reusedProducts = 0;
let createdVariants = 0;
let reusedVariants = 0;
for (const product of prepared) {
  const collectionValue = collectionValues.get(product.collectionSlug);
  let existingProduct = productsBySlug.get(product.slug);
  let productId;

  if (existingProduct) {
    productId = existingProduct.id;
    reusedProducts++;
    const assigned = new Set(existingProduct.facetValues.map(value => value.id));
    if (!assigned.has(collectionValue.id)) {
      throw new Error(`Existing product slug "${product.slug}" is already in use but lacks its expected collection assignment. Stopped without changing that product.`);
    }
  } else {
    const created = await gql(`
      mutation CreateNormalizedProduct($input: CreateProductInput!) {
        createProduct(input: $input) { id name slug }
      }
    `, { input: {
      enabled: false,
      facetValueIds: [collectionValue.id],
      translations: [{
        languageCode,
        name: product.name,
        slug: product.slug,
        description: `RS Prints internal product code: ${product.productCode}\nSource catalogue references: ${product.sourceCodes.join(', ')}\nPrice and stock pending confirmation.`,
      }],
    }});
    existingProduct = { id: created.createProduct.id, slug: product.slug, variants: [], optionGroups: [], facetValues: [{ id: collectionValue.id }] };
    productsBySlug.set(product.slug, existingProduct);
    productId = existingProduct.id;
    createdProducts++;
  }

  const attachedGroupIds = new Set((existingProduct.optionGroups || []).map(group => group.id));
  for (const optionGroup of product.optionGroups) {
    const group = groupByCode.get(codeOf(optionGroup.name));
    if (!attachedGroupIds.has(group.id)) {
      await gql(`
        mutation AttachOptionGroup($productId: ID!, $optionGroupId: ID!) {
          addOptionGroupToProduct(productId: $productId, optionGroupId: $optionGroupId) { id }
        }
      `, { productId, optionGroupId: group.id });
      attachedGroupIds.add(group.id);
    }
  }

  const existingSkus = new Set((existingProduct.variants || []).map(variant => variant.sku));
  const missingVariants = product.variants.filter(variant => !existingSkus.has(variant.sku));
  const variantInputs = missingVariants.map(variant => ({
    productId,
    enabled: false,
    sku: variant.sku,
    price: 0,
    optionIds: product.optionGroups.map(group => {
      const optionGroup = groupByCode.get(codeOf(group.name));
      const option = optionGroup.options.find(item => item.name === variant.options[group.name]);
      if (!option) throw new Error(`Missing option ID for ${product.productCode} / ${group.name} / ${variant.options[group.name]}`);
      return option.id;
    }),
    translations: [{ languageCode, name: product.optionGroups.length
      ? `${product.name} - ${product.optionGroups.map(group => variant.options[group.name]).join(' / ')}`
      : product.name }],
  }));

  if (variantInputs.length) {
    const variants = await gql(`
      mutation CreateNormalizedVariants($input: [CreateProductVariantInput!]!) {
        createProductVariants(input: $input) { id sku enabled }
      }
    `, { input: variantInputs });
    createdVariants += variants.createProductVariants.length;
  }
  reusedVariants += product.variants.length - missingVariants.length;
}

console.log(JSON.stringify({
  status: 'ADDITIVE_IMPORT_COMPLETED',
  createdProducts,
  reusedProducts,
  createdVariants,
  reusedVariants,
  collectionsModified: 0,
  oldProductsDeleted: 0,
  enabledProducts: 0,
  note: resetTest
    ? 'Existing test-database products were deleted; collections and shared option groups were preserved. Imported products and variants remain disabled.'
    : 'Existing products and collections were preserved. All imported products and variants remain disabled.',
}, null, 2));
