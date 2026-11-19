/**
 * Repair only the T-shirt variants from the RS Prints catalogue.
 * Run from apps/server:
 *   node --env-file=.env catalogue/populate-tshirt-variants.mjs
 *
 * Source: RS Prints Product Catalogue (1).pdf, page 15.
 * Prices and stock are development estimates, not confirmed commercial data.
 */
import fs from 'node:fs';
import path from 'node:path';

if ((process.env.APP_ENV || '').toLowerCase() !== 'dev') throw new Error('Blocked: APP_ENV must be dev.');
if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL. Load .env with --env-file=.env.');
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) throw new Error('Missing Vendure superadmin credentials.');

const endpoint = process.env.VENDURE_ADMIN_API_URL || 'http://localhost:' + (process.env.VENDURE_SERVER_PORT || 3000) + '/admin-api';
const endpointUrl = new URL(endpoint);
if (!['localhost', '127.0.0.1'].includes(endpointUrl.hostname) || endpointUrl.pathname !== '/admin-api') {
  throw new Error('Only the localhost /admin-api endpoint is allowed.');
}

const planPath = path.resolve(process.cwd(), 'catalogue', 'normalized-catalogue-plan.json');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
if (plan.currency !== 'INR' || plan.source?.file !== 'RS Prints Product Catalogue (1).pdf') {
  throw new Error('Unexpected catalogue plan/source. No writes made.');
}

const targetCodes = new Set(['APP-ROUND-TSHIRT', 'APP-COLLAR-TSHIRT']);
const models = plan.productModels.filter(model => targetCodes.has(model.productCode));
if (models.length !== 2) throw new Error('Expected both T-shirt parent models in the plan. No writes made.');

const slugify = value => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const codeOf = value => slugify(value).replace(/-/g, '_').toUpperCase();
const skuPart = value => String(value).normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();

const expectedByCode = {
  'APP-ROUND-TSHIRT': 24,
  'APP-COLLAR-TSHIRT': 24
};
const requestedOptions = {
  Colour: ['Black', 'White'],
  Material: ['Cotton', 'Polyester'],
  'Apparel Size': ['XS', 'S', 'M', 'L', 'XL', '2XL']
};
const basePriceINR = 399;
const stockOnHand = 10;
const errors = [];
const prepared = [];

for (const model of models) {
  const groups = model.optionGroups || [];
  if (groups.map(group => group.name).join('|') !== 'Colour|Material|Apparel Size') {
    errors.push('Unexpected option-group order/names for ' + model.productCode + ': ' + groups.map(g => g.name).join(', '));
    continue;
  }
  // Owner-approved rule: generate the full 2 x 2 x 6 combination set for BOTH T-shirt types.
  // The owner will manage supplier availability later in the Vendure dashboard.
  for (const group of groups) {
    const requested = requestedOptions[group.name];
    if (!requested || requested.length !== group.values.length || requested.some(value => !group.values.includes(value))) {
      errors.push('Shared option values do not match the agreed T-shirt options for ' + group.name + '. Expected ' + JSON.stringify(requested) + ', found ' + JSON.stringify(group.values));
    }
  }

  const combos = [];
  for (const colour of requestedOptions.Colour) {
    for (const material of requestedOptions.Material) {
      for (const size of requestedOptions['Apparel Size']) {
        combos.push({ Colour: colour, Material: material, 'Apparel Size': size });
      }
    }
  }

  if (combos.length !== expectedByCode[model.productCode]) {
    errors.push(model.productCode + ' expected ' + expectedByCode[model.productCode] + ' combinations, found ' + combos.length);
  }

  for (const combo of combos) {
    const sku = model.productCode + '-' + [combo.Colour, combo.Material, combo['Apparel Size']].map(skuPart).join('-');
    let priceINR = basePriceINR;
    if (combo['Apparel Size'] === '2XL') priceINR += 50;
    if (combo.Material === 'Polyester') priceINR += 30;

    prepared.push({
      productCode: model.productCode,
      slug: slugify(model.productCode),
      productName: model.name,
      groups,
      combo,
      sku,
      price: priceINR * 100,
      stockOnHand
    });
  }
}

if (errors.length) throw new Error('Catalogue validation failed before login/writes:\n' + errors.join('\n'));
if (prepared.length !== 48) throw new Error('Expected exactly 48 T-shirt variants, prepared ' + prepared.length + '. No writes made.');

async function gql(query, variables = {}, token = '') {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify({ query, variables })
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) throw new Error(JSON.stringify(body.errors || body, null, 2));
  return { data: body.data, headers: response.headers };
}

const login = await gql(
  'mutation Login($username:String!,$password:String!){login(username:$username,password:$password){... on CurrentUser{id identifier} ... on ErrorResult{errorCode message}}}',
  { username: process.env.SUPERADMIN_USERNAME, password: process.env.SUPERADMIN_PASSWORD }
);
if (!login.data.login?.id) throw new Error('Vendure login failed: ' + JSON.stringify(login.data.login));
const token = login.headers.get('vendure-auth-token');
if (!token) throw new Error('Vendure did not return an auth token.');

const snapshot = await gql(`
query TshirtVariantPreflight {
  products(options:{take:200}) {
    items { id slug enabled optionGroups { id code name } variants { id sku enabled price stockOnHand } }
  }
  productOptionGroups(options:{take:200}) {
    items { id code name options { id code name } }
  }
  createVariantInput: __type(name:"CreateProductVariantInput") {
    inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
  globalFlag: __type(name:"GlobalFlag") { enumValues { name } }
}`, {}, token);

const products = snapshot.data.products?.items || [];
const productBySlug = new Map(products.map(product => [product.slug, product]));
const optionGroups = snapshot.data.productOptionGroups?.items || [];
const groupByCode = new Map(optionGroups.map(group => [group.code, group]));
const inputFields = new Set((snapshot.data.createVariantInput?.inputFields || []).map(field => field.name));

for (const field of ['productId', 'sku', 'price', 'enabled', 'optionIds', 'translations', 'stockOnHand', 'trackInventory']) {
  if (!inputFields.has(field)) errors.push('CreateProductVariantInput.' + field + ' is unavailable.');
}
const globalFlags = new Set((snapshot.data.globalFlag?.enumValues || []).map(value => value.name));
if (!globalFlags.has('TRUE')) errors.push('Vendure GlobalFlag.TRUE is unavailable; inventory tracking cannot be enabled.');

for (const variant of prepared) {
  const product = productBySlug.get(variant.slug);
  if (!product) {
    errors.push('Missing parent product ' + variant.productCode + ' (slug ' + variant.slug + ').');
    continue;
  }
  if (product.enabled !== true) errors.push('Parent product is disabled: ' + variant.productCode);

  for (const definition of variant.groups) {
    const group = groupByCode.get(codeOf(definition.name));
    if (!group) {
      errors.push('Missing shared option group ' + definition.name);
      continue;
    }
    if (!(product.optionGroups || []).some(attached => attached.id === group.id)) {
      errors.push('Option group is not attached to ' + variant.productCode + ': ' + definition.name);
    }
    if (!(group.options || []).some(option => option.name === variant.combo[definition.name])) {
      errors.push('Missing option value ' + definition.name + '=' + variant.combo[definition.name]);
    }
  }
}

const skuOwners = new Map();
for (const product of products) {
  for (const variant of product.variants || []) {
    if (skuOwners.has(variant.sku)) errors.push('Duplicate existing SKU in Vendure: ' + variant.sku);
    else skuOwners.set(variant.sku, { productId: product.id, productSlug: product.slug, variant });
  }
}

for (const variant of prepared) {
  const owner = skuOwners.get(variant.sku);
  const product = productBySlug.get(variant.slug);
  if (!product) continue;
  if (owner && owner.productId !== product.id) errors.push('SKU belongs to another product: ' + variant.sku);
  if (owner && (
    owner.variant.enabled !== true ||
    owner.variant.price !== variant.price ||
    owner.variant.stockOnHand !== variant.stockOnHand
  )) {
    errors.push('Existing SKU has different enabled/price/stock; not overwriting: ' + variant.sku);
  }
}

if (errors.length) throw new Error('Vendure preflight stopped before writes:\n' + errors.join('\n'));

const inputs = prepared.map(variant => {
  const product = productBySlug.get(variant.slug);
  const optionIds = variant.groups.map(definition => {
    const group = groupByCode.get(codeOf(definition.name));
    return group.options.find(option => option.name === variant.combo[definition.name]).id;
  });
  return {
    productId: product.id,
    enabled: true,
    sku: variant.sku,
    price: variant.price,
    stockOnHand: variant.stockOnHand,
    trackInventory: 'TRUE',
    optionIds,
    translations: [{
      languageCode: 'en',
      name: variant.productName + ' - ' + [variant.combo.Colour, variant.combo.Material, variant.combo['Apparel Size']].join(' / ')
    }]
  };
});

const missing = inputs.filter(input => !skuOwners.has(input.sku));
let created = 0;
for (let index = 0; index < missing.length; index += 10) {
  const batch = missing.slice(index, index + 10);
  const result = await gql(
    'mutation CreateTshirtVariants($input:[CreateProductVariantInput!]!){createProductVariants(input:$input){id sku enabled price stockOnHand}}',
    { input: batch },
    token
  );
  const rows = result.data.createProductVariants || [];
  if (rows.length !== batch.length) {
    throw new Error('Vendure returned an unexpected variant count. Stop and inspect before rerunning.');
  }
  created += rows.length;
}

const byProduct = {};
for (const variant of prepared) byProduct[variant.productCode] = (byProduct[variant.productCode] || 0) + 1;

console.log(JSON.stringify({
  status: 'TSHIRT_VARIANTS_REPAIRED',
  authenticatedAs: login.data.login.identifier,
  source: 'Owner-approved full option matrix for both T-shirt types',
  plannedVariants: prepared.length,
  expectedPerProduct: 24,
  agreedOptions: requestedOptions,
  createdVariants: created,
  alreadyMatchingVariants: prepared.length - missing.length,
  products: byProduct,
  enabled: true,
  inventoryTracking: true,
  developmentStockPerVariant: stockOnHand,
  provisionalPriceINR: {
    base: basePriceINR,
    polyesterSurcharge: 30,
    size2XLSurcharge: 50
  },
  note: 'Prices are development estimates and stock is test inventory, not confirmed supplier pricing or physical stock.'
}, null, 2));
