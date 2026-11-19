/**
 * Create shared Vendure product option groups and their values from the
 * normalized RS Prints catalogue plan.
 *
 * Run from apps/server:
 *   node catalogue/populate-option-groups.mjs
 *
 * Loads ONLY .env.test. Talks to localhost Admin API only.
 * Creates missing groups/options; never deletes or edits existing ones.
 * Does not create products, variants, facets, collections, prices, or stock.
 */
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env.test');
if (!fs.existsSync(envPath)) throw new Error('Missing apps/server/.env.test. No API calls made.');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const index = trimmed.indexOf('=');
  if (index < 1) continue;
  const key = trimmed.slice(0, index).trim();
  const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
  if (key && process.env[key] === undefined) process.env[key] = value;
}

if ((process.env.CATALOGUE_IMPORT_ENV || '').toLowerCase() !== 'development') {
  throw new Error('Blocked: .env.test must contain CATALOGUE_IMPORT_ENV=development.');
}
if (process.env.CATALOGUE_TEST_DATABASE_CONFIRMATION !== 'I_CONFIRM_THIS_IS_THE_RS_PRINTS_TEST_DATABASE') {
  throw new Error('Blocked: .env.test must contain the explicit test database confirmation.');
}
if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL in .env.test.');

const endpoint = process.env.VENDURE_ADMIN_API_URL ||
  \`http://localhost:\${process.env.VENDURE_SERVER_PORT || 3000}/admin-api\`;
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(endpoint)) {
  throw new Error('Blocked: this script only permits a localhost Vendure Admin API.');
}
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) {
  throw new Error('Missing superadmin credentials in .env.test.');
}

const planPath = path.resolve(process.cwd(), 'catalogue', 'normalized-catalogue-plan.json');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const languageCode = 'en';
const slugify = value => value.toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase();
const optionCode = value => slugify(value).toLowerCase();

const definitions = new Map();
for (const product of plan.productModels) {
  for (const group of product.optionGroups || []) {
    const code = slugify(group.name);
    if (!definitions.has(code)) definitions.set(code, { code, name: group.name, values: new Set() });
    for (const value of group.values || []) definitions.get(code).values.add(value);
  }
}

// Shared colour vocabulary: include catalogue-supported colour names even if
// a colour is not currently used by a multi-variant model in this plan.
// Products only receive values explicitly assigned in their own plan entry.
const colour = definitions.get('COLOUR');
if (colour) {
  for (const value of ['Light Green', 'Neon Green', 'Rose Gold']) colour.values.add(value);
}

const expected = [...definitions.values()].map(group => ({
  ...group,
  values: [...group.values].sort((a, b) => a.localeCompare(b)),
})).sort((a, b) => a.code.localeCompare(b.code));

async function request(query, variables = {}, token = '') {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: \`Bearer \${token}\` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) {
    throw new Error(JSON.stringify(body.errors || body, null, 2));
  }
  return { data: body.data, headers: response.headers };
}

const login = await request(\`mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    ... on CurrentUser { id identifier }
    ... on ErrorResult { errorCode message }
  }
}\`, {
  username: process.env.SUPERADMIN_USERNAME,
  password: process.env.SUPERADMIN_PASSWORD,
});
if (!login.data.login?.id) throw new Error(\`Vendure login failed: \${JSON.stringify(login.data.login)}\`);
const token = login.headers.get('vendure-auth-token');
if (!token) throw new Error('Vendure did not return an auth token.');

const snapshot = await request(\`query OptionGroupPreflight {
  productOptionGroups(options: { take: 200 }) {
    items { id code name options { id code name } }
  }
  groupInput: __type(name: "CreateProductOptionGroupInput") {
    inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
  optionInput: __type(name: "CreateProductOptionInput") {
    inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
}\`, {}, token);

const groupFields = new Set((snapshot.data.groupInput?.inputFields || []).map(field => field.name));
const optionFields = new Set((snapshot.data.optionInput?.inputFields || []).map(field => field.name));
for (const field of ['code', 'translations', 'options']) {
  if (!groupFields.has(field)) throw new Error(\`CreateProductOptionGroupInput.\${field} unavailable. No writes made.\`);
}
for (const field of ['productOptionGroupId', 'code', 'translations']) {
  if (!optionFields.has(field)) throw new Error(\`CreateProductOptionInput.\${field} unavailable. No writes made.\`);
}

const existing = snapshot.data.productOptionGroups.items || [];
const byCode = new Map(existing.map(group => [group.code, group]));
const duplicates = existing.map(group => group.code).filter((code, index, all) => all.indexOf(code) !== index);
if (duplicates.length) throw new Error(\`Duplicate existing option group codes: \${[...new Set(duplicates)].join(', ')}. No writes made.\`);

const missingGroups = [];
const missingOptions = [];
for (const definition of expected) {
  const group = byCode.get(definition.code);
  if (!group) {
    missingGroups.push(definition);
    continue;
  }
  const existingOptions = new Set(group.options.map(option => option.code));
  for (const value of definition.values) {
    const code = optionCode(value);
    if (!existingOptions.has(code)) missingOptions.push({
      groupId: group.id,
      groupCode: group.code,
      value,
      code,
    });
  }
}

const plannedWrites = missingGroups.length + missingOptions.length;
console.log(JSON.stringify({
  mode: 'CREATE_MISSING_OPTION_GROUPS_AND_VALUES_ONLY',
  endpoint,
  expectedSharedGroups: expected.length,
  existingSharedGroups: existing.length,
  groupsToCreate: missingGroups.length,
  optionValuesToCreate: missingGroups.reduce((sum, group) => sum + group.values.length, 0) +
    missingOptions.length,
  existingOptionValuesReused: expected.reduce((sum, definition) => {
    const group = byCode.get(definition.code);
    if (!group) return sum;
    const codes = new Set(group.options.map(option => option.code));
    return sum + definition.values.filter(value => codes.has(optionCode(value))).length;
  }, 0),
  groupNames: expected.map(group => ({ name: group.name, values: group.values.length })),
  databaseWrites: plannedWrites,
  note: 'No product, variant, facet, collection, asset, price, or stock records are changed.',
}, null, 2));

if (missingGroups.length || missingOptions.length) {
  const declarations = [];
  const selections = [];
  const variables = {};

  missingGroups.forEach((group, index) => {
    const key = \`g\${index}\`;
    declarations.push(\`$\${key}: CreateProductOptionGroupInput!\`);
    selections.push(\`\${key}: createProductOptionGroup(input: $\${key}) { id code name options { id code name } }\`);
    variables[key] = {
      code: group.code,
      translations: [{ languageCode, name: group.name }],
      options: group.values.map(value => ({
        code: optionCode(value),
        translations: [{ languageCode, name: value }],
      })),
    };
  });

  missingOptions.forEach((option, index) => {
    const key = \`o\${index}\`;
    declarations.push(\`$\${key}: CreateProductOptionInput!\`);
    selections.push(\`\${key}: createProductOption(input: $\${key}) { id code name }\`);
    variables[key] = {
      productOptionGroupId: option.groupId,
      code: option.code,
      translations: [{ languageCode, name: option.value }],
    };
  });

  const mutation = \`mutation EnsureSharedOptionGroups(\${declarations.join(', ')}) { \${selections.join(' ')} }\`;
  await request(mutation, variables, token);
}

const verification = await request(\`query VerifyOptionGroups {
  productOptionGroups(options: { take: 200 }) {
    items { id code name options { id code name } }
  }
}\`, {}, token);

const finalGroups = verification.data.productOptionGroups.items || [];
const finalByCode = new Map(finalGroups.map(group => [group.code, group]));
const problems = [];
for (const definition of expected) {
  const group = finalByCode.get(definition.code);
  if (!group) {
    problems.push(\`Missing group: \${definition.code}\`);
    continue;
  }
  const actualOptions = new Set(group.options.map(option => option.code));
  for (const value of definition.values) {
    if (!actualOptions.has(optionCode(value))) problems.push(\`Missing value: \${definition.name} / \${value}\`);
  }
}

console.log(JSON.stringify({
  status: problems.length ? 'OPTION_GROUP_VERIFICATION_FAILED' : 'OPTION_GROUPS_READY',
  expectedSharedGroups: expected.length,
  expectedOptionValues: expected.reduce((sum, group) => sum + group.values.length, 0),
  verifiedSharedGroups: expected.filter(group => finalByCode.has(group.code)).length,
  verifiedOptionValues: expected.reduce((sum, definition) => {
    const group = finalByCode.get(definition.code);
    if (!group) return sum;
    const actual = new Set(group.options.map(option => option.code));
    return sum + definition.values.filter(value => actual.has(optionCode(value))).length;
  }, 0),
  problems,
  databaseWrites: plannedWrites,
  note: 'Shared option groups and values only. They are not yet attached to products; no products or variants were created.',
}, null, 2));
if (problems.length) process.exitCode = 1;
