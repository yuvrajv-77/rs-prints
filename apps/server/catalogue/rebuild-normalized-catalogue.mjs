/**
 * Rebuild the RS Prints test catalogue using normalized parent products and variants.
 *
 * Safe by default:
 *   node --env-file=.env.test catalogue/rebuild-normalized-catalogue.mjs
 *
 * This performs a read-only preview. No database writes occur without --apply.
 *
 * Apply requires ALL of:
 *   CATALOGUE_IMPORT_ALLOW=true
 *   CATALOGUE_IMPORT_ENV=development
 *   CATALOGUE_TEST_DATABASE_CONFIRMATION=I_CONFIRM_THIS_IS_THE_RS_PRINTS_TEST_DATABASE
 *   SUPERADMIN_USERNAME and SUPERADMIN_PASSWORD
 *   --apply
 *
 * The script only deletes products whose exact legacy slugs appear in the old
 * import manifest. It never deletes, updates, or recreates collections.
 * It refuses to apply while any multi-option product lacks explicit valid
 * variantCombinations in the normalized plan.
 */
import fs from 'node:fs';
import path from 'node:path';

const readJson = name => JSON.parse(fs.readFileSync(path.join(import.meta.dirname, name), 'utf8'));
const legacy = readJson('rs-prints-catalogue.json');
const plan = readJson('normalized-catalogue-plan.json');
const apply = process.argv.includes('--apply');
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
  if (groups.length === 0) {
    combinations = [{}];
  } else if (groups.length === 1) {
    combinations = groups[0].values.map(value => ({ [groups[0].name]: value }));
  } else if (Array.isArray(model.variantCombinations) && model.variantCombinations.length) {
    combinations = model.variantCombinations;
  } else {
    blockers.push({ productCode: model.productCode, name: model.name, optionGroups: groups, reason: 'Explicit valid combinations are required; Cartesian combinations are not inferred.' });
    continue;
  }

  const variants = combinations.map(options => {
    const optionParts = groups.map(group => skuPart(options[group.name]));
    const sku = groups.length ? `${model.productCode}-${optionParts.join('-')}` : `${model.productCode}-DEFAULT`;
    if (groups.some(group => !group.values.includes(options[group.name]))) {
      errors.push(`Invalid option combination in ${model.productCode}: ${JSON.stringify(options)}`);
    }
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

const legacySlugs = legacy.products.map(item => item.slug || `${slugify(item.name)}-${slugify(item.code)}`);
const report = {
  mode: apply ? 'APPLY' : 'DRY_RUN',
  endpoint,
  legacyProductsEligibleForExactSlugDeletion: legacySlugs.length,
  normalizedSourceItems: plan.sourceItems.length,
  normalizedParentProducts: plan.productModels.length,
  readyParentProducts: prepared.length,
  optionBearingProductsReady: prepared.filter(product => product.optionGroups.length).length,
  plannedVariants: prepared.reduce((sum, product) => sum + product.variants.length, 0),
  blockedProducts: blockers,
  errors,
  collections: 'PRESERVED: this script does not call any collection mutation.',
};
console.log(JSON.stringify(report, null, 2));

if (errors.length) throw new Error('Catalogue validation failed. No database changes were made.');
if (blockers.length) {
  if (apply) throw new Error('Apply refused: resolve every blocked multi-option product first. No database changes were made.');
  process.exitCode = 1;
}
if (!apply) {
  console.log('DRY RUN ONLY. No Vendure login or database writes were performed.');
  process.exit(0);
}

if (process.env.CATALOGUE_IMPORT_ALLOW !== 'true') throw new Error('Blocked: set CATALOGUE_IMPORT_ALLOW=true explicitly.');
if ((process.env.CATALOGUE_IMPORT_ENV || '').toLowerCase() !== 'development') throw new Error('Blocked: CATALOGUE_IMPORT_ENV must be development.');
if (process.env.CATALOGUE_TEST_DATABASE_CONFIRMATION !== 'I_CONFIRM_THIS_IS_THE_RS_PRINTS_TEST_DATABASE') {
  throw new Error('Blocked: confirm the .env.test database using CATALOGUE_TEST_DATABASE_CONFIRMATION.');
}
if (!process.env.DATABASE_URL) throw new Error('Blocked: DATABASE_URL is missing. Verify that .env.test is loaded.');
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(endpoint)) {
  throw new Error('Blocked: Admin API must be localhost for this test-only rebuild.');
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

const snapshot = await gql(`
  query RebuildPreflight {
    products(options: { take: 1000 }) { items { id slug name } }
    facets(options: { take: 100 }) { items { id code name values { id code name } } }
    productOptionGroups(options: { take: 100 }) { items { id code name options { id code name } } }
  }
`);
const productsBySlug = new Map(snapshot.products.items.map(product => [product.slug, product]));
const missingLegacy = legacySlugs.filter(slug => !productsBySlug.has(slug));
if (missingLegacy.length) throw new Error(`Refusing to delete: expected legacy products are missing: ${missingLegacy.join(', ')}. No writes performed.`);
const oldMatches = legacySlugs.map(slug => productsBySlug.get(slug));
const legacyIdSet = new Set(oldMatches.map(product => product.id));
const unexpectedProductSlugs = snapshot.products.items
  .filter(product => !legacyIdSet.has(product.id) && prepared.some(item => item.slug === product.slug))
  .map(product => product.slug);
if (unexpectedProductSlugs.length) throw new Error(`New product slug collision: ${unexpectedProductSlugs.join(', ')}. No writes performed.`);

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
      // Vendure option groups are global. Merge the vocabulary across products;
      // each product still attaches only the group and its own variants use only
      // the values declared in that product's normalized model.
      values: [...new Set([...(existing?.values || []), ...group.values])],
    });
  }
}

// Preflight is complete. From this point the script performs the explicit test reset.
for (const product of oldMatches) {
  const result = await gql(`mutation DeleteLegacyCatalogueProduct($id: ID!) { deleteProduct(id: $id) { result message } }`, { id: product.id });
  if (result.deleteProduct.result !== 'DELETED') throw new Error(`Could not delete legacy product ${product.slug}: ${JSON.stringify(result.deleteProduct)}`);
}

for (const [code, definition] of optionGroupsToEnsure) {
  let group = groupByCode.get(code);
  if (!group) {
    const result = await gql(`
      mutation CreateOptionGroup($input: CreateProductOptionGroupInput!) {
        createProductOptionGroup(input: $input) { id code name options { id code name } }
      }
    `, { input: {
      code,
      translations: [{ languageCode, name: definition.name }],
      options: definition.values.map(value => ({ code: codeOf(value).toLowerCase(), translations: [{ languageCode, name: value }] })),
    }});
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

let createdProducts = 0;
let createdVariants = 0;
for (const product of prepared) {
  const collectionValue = collectionValues.get(product.collectionSlug);
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
      description: `RS Prints internal product code: ${product.productCode}\\nSource catalogue references: ${product.sourceCodes.join(', ')}\\nPrice and stock pending confirmation.`,
    }],
  }});
  const productId = created.createProduct.id;
  createdProducts++;

  for (const optionGroup of product.optionGroups) {
    const group = groupByCode.get(codeOf(optionGroup.name));
    await gql(`
      mutation AttachOptionGroup($productId: ID!, $optionGroupId: ID!) {
        addOptionGroupToProduct(productId: $productId, optionGroupId: $optionGroupId) { id }
      }
    `, { productId, optionGroupId: group.id });
  }

  const variantInputs = product.variants.map(variant => ({
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
  const variants = await gql(`
    mutation CreateNormalizedVariants($input: [CreateProductVariantInput!]!) {
      createProductVariants(input: $input) { id sku enabled }
    }
  `, { input: variantInputs });
  createdVariants += variants.createProductVariants.length;
}

console.log(JSON.stringify({
  status: 'REBUILD_COMPLETED',
  deletedLegacyProducts: oldMatches.length,
  createdProducts,
  createdVariants,
  collectionsModified: 0,
  enabledProducts: 0,
}, null, 2));
