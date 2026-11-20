/**
 * Populate RS Prints parent products only.
 *
 * Run from apps/server:
 *   node --env-file=.env catalogue/populate-parent-products.mjs
 *
 * Creates/reuses parent products, attaches existing shared option groups,
 * assigns catalogue-supported product facets, and configures the existing
 * collection hierarchy using Vendure's built-in productIdCollectionFilter.
 * DOES NOT create variants, prices, stock, assets, or images.
 */
import fs from 'node:fs';
import path from 'node:path';

if ((process.env.APP_ENV || '').toLowerCase() !== 'dev') {
  throw new Error('Blocked: APP_ENV must be dev in apps/server/.env.');
}
if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL. Run with --env-file=.env.');
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) {
  throw new Error('Missing Vendure superadmin credentials in .env.');
}

const endpoint = process.env.VENDURE_ADMIN_API_URL ||
  `http://localhost:${process.env.VENDURE_SERVER_PORT || 3000}/admin-api`;
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(endpoint)) {
  throw new Error('Blocked: this importer only permits a localhost Vendure Admin API.');
}

const planPath = path.resolve(process.cwd(), 'catalogue', 'normalized-catalogue-plan.json');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const languageCode = 'en';
const slugify = value => value.toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const codeOf = value => slugify(value).replace(/-/g, '_').toUpperCase();
const unique = values => [...new Set(values)];
const errors = [];

if (plan.sourceItems.length !== 147 || plan.productModels.length !== 132) {
  throw new Error(`Unexpected plan size: ${plan.sourceItems.length} source items / ${plan.productModels.length} models. No API calls made.`);
}

const sourceCodes = plan.sourceItems.map(item => item.sourceCode);
const mappedCodes = plan.productModels.flatMap(model => model.sourceCodes || []);
const duplicates = values => unique(values.filter((value, i) => values.indexOf(value) !== i));
for (const code of duplicates(sourceCodes)) errors.push(`Duplicate source item ${code}`);
for (const code of duplicates(mappedCodes)) errors.push(`Source item mapped more than once: ${code}`);
for (const code of sourceCodes) if (!mappedCodes.includes(code)) errors.push(`Unmapped source item: ${code}`);
for (const code of mappedCodes) if (!sourceCodes.includes(code)) errors.push(`Unknown source item: ${code}`);

const sourceByCode = new Map(plan.sourceItems.map(item => [item.sourceCode, item]));
for (const model of plan.productModels) {
  if (!model.productCode || !model.name || !model.collectionSlug) errors.push(`Incomplete product model: ${JSON.stringify(model)}`);
  for (const group of model.optionGroups || []) {
    if (!group.name || !Array.isArray(group.values) || !group.values.length) {
      errors.push(`Invalid option group in ${model.productCode}`);
    }
  }
}
if (errors.length) throw new Error(`Catalogue plan validation failed before login:\n${errors.join('\n')}`);

async function request(query, variables = {}, token = '') {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) {
    throw new Error(JSON.stringify(body.errors || body, null, 2));
  }
  return { data: body.data, headers: response.headers };
}

const login = await request(`mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    ... on CurrentUser { id identifier }
    ... on ErrorResult { errorCode message }
  }
}`, {
  username: process.env.SUPERADMIN_USERNAME,
  password: process.env.SUPERADMIN_PASSWORD,
});
if (!login.data.login?.id) throw new Error(`Vendure login failed: ${JSON.stringify(login.data.login)}`);
const token = login.headers.get('vendure-auth-token');
if (!token) throw new Error('Vendure did not return an auth token.');

const snapshot = await request(`query ParentProductImportPreflight {
  products(options: { take: 1000 }) {
    items { id name slug enabled facetValues { id code name facet { code } } optionGroups { id code name } }
  }
  facets(options: { take: 200 }) {
    items { id code name isPrivate values { id code name } }
  }
  productOptionGroups(options: { take: 200 }) {
    items { id code name options { id code name } }
  }
  collections(options: { take: 250 }) {
    items { id name slug parent { id slug } }
  }
  collectionFilters { code args { name type list } }
  createProductInput: __type(name: "CreateProductInput") {
    inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
  updateProductInput: __type(name: "UpdateProductInput") {
    inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
  updateCollectionInput: __type(name: "UpdateCollectionInput") {
    inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
}`, {}, token);

const products = snapshot.data.products.items || [];
const facets = snapshot.data.facets.items || [];
const groups = snapshot.data.productOptionGroups.items || [];
const collections = snapshot.data.collections.items || [];
const bySlug = new Map(products.map(product => [product.slug, product]));
const facetByCode = new Map(facets.map(facet => [facet.code, facet]));
const groupByCode = new Map(groups.map(group => [group.code, group]));
const collectionBySlug = new Map(collections.map(collection => [collection.slug, collection]));
const collectionFilterDefs = snapshot.data.collectionFilters || [];

const requiredCollectionSlugs = unique(plan.productModels.map(model => model.collectionSlug));
for (const slug of requiredCollectionSlugs) {
  if (!collectionBySlug.has(slug)) errors.push(`Missing existing child collection: ${slug}`);
}
for (const code of unique(plan.productModels.flatMap(model => (model.optionGroups || []).map(group => codeOf(group.name))))) {
  if (!groupByCode.has(code)) errors.push(`Missing shared option group: ${code}`);
}
for (const model of plan.productModels) {
  for (const group of model.optionGroups || []) {
    const existing = groupByCode.get(codeOf(group.name));
    const optionNames = new Set((existing?.options || []).map(option => option.name));
    for (const value of group.values) {
      if (!optionNames.has(value)) errors.push(`Missing shared option value: ${group.name} / ${value} (product ${model.productCode})`);
    }
  }
}
for (const code of ['material', 'capacity', 'dimensions']) {
  if (!facetByCode.has(code)) errors.push(`Missing expected facet: ${code}`);
}
const createFields = new Set((snapshot.data.createProductInput?.inputFields || []).map(field => field.name));
const updateFields = new Set((snapshot.data.updateProductInput?.inputFields || []).map(field => field.name));
const collectionUpdateFields = new Set((snapshot.data.updateCollectionInput?.inputFields || []).map(field => field.name));
for (const field of ['translations', 'enabled', 'facetValueIds']) {
  if (!createFields.has(field)) errors.push(`CreateProductInput.${field} is unavailable`);
}
for (const field of ['translations', 'facetValueIds', 'enabled']) {
  if (!updateFields.has(field)) errors.push(`UpdateProductInput.${field} is unavailable`);
}
if (!collectionUpdateFields.has('filters')) errors.push('UpdateCollectionInput.filters is unavailable');

const productIdFilter = collectionFilterDefs.find(filter => filter.code === 'product-id-filter' ||
  filter.code === 'productIdCollectionFilter' || filter.code === 'product-id-collection-filter');
if (!productIdFilter) errors.push('Vendure product-ID collection filter is not registered.');
const productIdsArg = productIdFilter?.args?.find(arg => /product.?ids/i.test(arg.name));
if (!productIdsArg) errors.push('Could not identify the product ID list argument for the built-in collection filter.');

if (errors.length) {
  throw new Error(`Preflight stopped before product writes. Fix the listed setup issue(s):\n- ${errors.join('\n- ')}`);
}

// The plan only supplies fixed product-level specifications where they are
// explicit. Selectable attributes remain option groups and are not duplicated
// as fixed product facets.
const materialByCollection = {
  'ceramic-mugs': 'Ceramic',
  'glass-mugs': 'Glass',
  'glass-drinkware': 'Glass',
  'aluminium-bottles': 'Aluminium',
  'stainless-steel-bottles-drinkware': 'Stainless Steel',
  'mdf-products': 'MDF',
  'mdf-collage-frames': 'MDF',
  'hard-board-products': 'MDF',
  'glass-frames': 'Glass',
};
const facetValue = (facetCode, valueName) => {
  const facet = facetByCode.get(facetCode);
  return facet?.values.find(value => value.name === valueName);
};

function descriptionFor(model) {
  const sources = model.sourceCodes.map(code => sourceByCode.get(code)).filter(Boolean);
  const specs = unique(sources.map(item => item.sourceSpecification).filter(Boolean));
  const bullets = [
    `Product: ${model.name}.`,
    `Category: ${collectionBySlug.get(model.collectionSlug).name}.`,
    'Made for custom-printing and personalized gifting applications.',
    `RS Prints catalogue reference: ${model.sourceCodes.join(', ')}.`,
  ];
  if (specs.length === 1) bullets.push(`Catalogue specification: ${specs[0]}.`);
  else if (specs.length > 1) bullets.push(`Catalogue specifications by reference: ${sources.filter(item => item.sourceSpecification).map(item => `${item.sourceCode}: ${item.sourceSpecification}`).join('; ')}.`);
  return `<ul>${bullets.map(bullet => `<li>${bullet.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}</ul>`;
}

function facetIdsFor(model) {
  const ids = [];
  const groups = model.optionGroups || [];
  const selectableCapacity = groups.some(group => group.name === 'Capacity');
  const fixedMaterial = materialByCollection[model.collectionSlug];
  if (fixedMaterial) {
    const value = facetValue('material', fixedMaterial);
    if (!value) throw new Error(`Missing Material facet value ${fixedMaterial}`);
    ids.push(value.id);
  }
  if (!selectableCapacity) {
    const sourceSpecs = unique(model.sourceCodes.map(code => sourceByCode.get(code)?.sourceSpecification).filter(Boolean));
    if (sourceSpecs.length === 1) {
      const capacity = facetValue('capacity', sourceSpecs[0]);
      if (capacity) ids.push(capacity.id);
    }
  }
  const sourceSpecs = unique(model.sourceCodes.map(code => sourceByCode.get(code)?.sourceSpecification).filter(Boolean));
  if (sourceSpecs.length === 1) {
    const dimensionMatch = sourceSpecs[0].match(/^\d+\s*[×x]\s*\d+\s*(?:in|cm)$/i);
    if (dimensionMatch) {
      const dimension = facetValue('dimensions', sourceSpecs[0]);
      if (dimension) ids.push(dimension.id);
    }
  }
  return unique(ids);
}

let createdProducts = 0;
let reusedProducts = 0;
let updatedProducts = 0;
let productsEnabled = 0;
let attachedOptionGroups = 0;
let unchangedOptionGroups = 0;
const productIdsByCollection = new Map();

for (const model of plan.productModels) {
  const slug = slugify(model.productCode);
  const expectedFacetIds = facetIdsFor(model);
  let product = bySlug.get(slug);
  let productId;

  if (!product) {
    const result = await request(`mutation CreateParentProduct($input: CreateProductInput!) {
      createProduct(input: $input) { id name slug enabled }
    }`, { input: {
      enabled: true,
      facetValueIds: expectedFacetIds,
      translations: [{ languageCode, name: model.name, slug, description: descriptionFor(model) }],
    } }, token);
    product = result.data.createProduct;
    productId = product.id;
    createdProducts++;
    productsEnabled++;
  } else {
    productId = product.id;
    reusedProducts++;
    const existingFacetIds = new Set((product.facetValues || []).map(value => value.id));
    const mergedFacetIds = unique([...(product.facetValues || []).map(value => value.id), ...expectedFacetIds]);
    const needsFacetUpdate = mergedFacetIds.length !== existingFacetIds.size;
    const needsEnable = product.enabled !== true;
    if (needsFacetUpdate || needsEnable) {
      await request(`mutation UpdateParentProduct($input: UpdateProductInput!) {
        updateProduct(input: $input) { id slug enabled }
      }`, { input: { id: productId, enabled: true, facetValueIds: mergedFacetIds } }, token);
      updatedProducts++;
    }
    if (needsEnable) productsEnabled++;
  }

  const currentGroupIds = new Set((product.optionGroups || []).map(group => group.id));
  for (const groupDefinition of model.optionGroups || []) {
    const sharedGroup = groupByCode.get(codeOf(groupDefinition.name));
    if (!currentGroupIds.has(sharedGroup.id)) {
      await request(`mutation AttachSharedOptionGroup($productId: ID!, $optionGroupId: ID!) {
        addOptionGroupToProduct(productId: $productId, optionGroupId: $optionGroupId) { id }
      }`, { productId, optionGroupId: sharedGroup.id }, token);
      attachedOptionGroups++;
      currentGroupIds.add(sharedGroup.id);
    } else {
      unchangedOptionGroups++;
    }
  }

  if (!productIdsByCollection.has(model.collectionSlug)) productIdsByCollection.set(model.collectionSlug, []);
  productIdsByCollection.get(model.collectionSlug).push(productId);
}

// Configure exact product membership for all child collections and aggregate
// membership for each parent. Existing collection hierarchy is preserved.
const parentChildren = new Map();
for (const collection of collections) {
  if (collection.parent?.slug) {
    if (!parentChildren.has(collection.parent.slug)) parentChildren.set(collection.parent.slug, []);
    parentChildren.get(collection.parent.slug).push(collection.slug);
  }
}
const collectionProducts = new Map();
for (const [slug, ids] of productIdsByCollection) collectionProducts.set(slug, unique(ids));
for (const [parentSlug, children] of parentChildren) {
  const ids = children.flatMap(childSlug => collectionProducts.get(childSlug) || []);
  collectionProducts.set(parentSlug, unique(ids));
}

let updatedCollections = 0;
for (const [slug, ids] of collectionProducts) {
  const collection = collectionBySlug.get(slug);
  if (!collection) continue;
  const filterInput = {
    code: productIdFilter.code,
    arguments: [{ name: productIdsArg.name, value: JSON.stringify(ids) }],
  };
  await request(`mutation SetCatalogueCollectionProducts($input: UpdateCollectionInput!) {
    updateCollection(input: $input) { id slug }
  }`, { input: { id: collection.id, filters: [filterInput] } }, token);
  updatedCollections++;
}

console.log(JSON.stringify({
  status: 'PARENT_PRODUCTS_POPULATED',
  authenticatedAs: login.data.login.identifier,
  sourceItems: plan.sourceItems.length,
  parentProductsInPlan: plan.productModels.length,
  createdProducts,
  reusedProducts,
  productsUpdatedWithAdditionalFacets: updatedProducts,
  optionGroupsAttached: attachedOptionGroups,
  existingOptionGroupAttachmentsReused: unchangedOptionGroups,
  variantsCreated: 0,
  productsEnabled,
  collectionFiltersUpdated: updatedCollections,
  collectionsPreserved: true,
  pricesStockAssetsImagesChanged: false,
  descriptions: '4-5 catalogue-grounded bullet points per product',
  reviewQueue: plan.reviewQueue.length,
  note: 'Parent products are enabled as requested. No product variants, prices or stock were created, so products are not yet purchasable.',
}, null, 2));
