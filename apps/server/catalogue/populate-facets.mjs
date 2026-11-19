/**
 * Create conservative, shared catalogue facets for RS Prints.
 * Run from apps/server:
 *   node --env-file=.env catalogue/populate-facets.mjs
 *
 * Creates missing facets/values only. Never changes products, variants,
 * collections, option groups, prices, stock, or assets.
 */
if ((process.env.APP_ENV || 'development').toLowerCase() !== 'development') {
  throw new Error('Blocked: APP_ENV must be development.');
}
if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL. Run with --env-file=.env.');
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) {
  throw new Error('Missing Vendure superadmin credentials in .env.');
}
const endpoint = process.env.VENDURE_ADMIN_API_URL ||
  \`http://localhost:\${process.env.VENDURE_SERVER_PORT || 3000}/admin-api\`;
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(endpoint)) {
  throw new Error('Blocked: only a localhost Vendure Admin API is permitted.');
}

// Values are intentionally conservative. Variant-selectable attributes such as
// colour, size, finish, capacity, shape and material remain Product Options.
const definitions = [
  {
    name: 'Material',
    code: 'material',
    values: [
      'Ceramic', 'Glass', 'Stainless Steel', 'Aluminium',
      'Cotton', 'Polyester', 'MDF', 'Wood', 'Stone',
    ],
  },
];

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

const snapshot = await request(\`query FacetPreflight {
  facets(options: { take: 200 }) {
    items { id code name values { id code name } }
  }
  facetInput: __type(name: "CreateFacetInput") {
    inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
  facetValueInput: __type(name: "CreateFacetValueInput") {
    inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
}\`, {}, token);

const facetFields = new Set((snapshot.data.facetInput?.inputFields || []).map(field => field.name));
const valueFields = new Set((snapshot.data.facetValueInput?.inputFields || []).map(field => field.name));
for (const field of ['code', 'translations', 'values']) {
  if (!facetFields.has(field)) throw new Error(\`CreateFacetInput.\${field} unavailable. No writes made.\`);
}
for (const field of ['code', 'translations']) {
  if (!valueFields.has(field)) throw new Error(\`CreateFacetValueInput.\${field} unavailable. No writes made.\`);
}

const existing = snapshot.data.facets.items || [];
const byCode = new Map(existing.map(facet => [facet.code, facet]));
const duplicateCodes = existing.map(facet => facet.code).filter((code, i, all) => all.indexOf(code) !== i);
if (duplicateCodes.length) throw new Error(\`Duplicate existing facet codes: \${[...new Set(duplicateCodes)].join(', ')}\`);

const missingFacets = [];
const missingValues = [];
for (const definition of definitions) {
  const facet = byCode.get(definition.code);
  if (!facet) {
    missingFacets.push(definition);
    continue;
  }
  const existingValues = new Set(facet.values.map(value => value.code));
  for (const value of definition.values) {
    const code = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!existingValues.has(code)) missingValues.push({ facetId: facet.id, facetCode: facet.code, value, code });
  }
}

const writes = missingFacets.length + missingValues.length;
console.log(JSON.stringify({
  mode: 'CREATE_MISSING_FACETS_AND_VALUES_ONLY',
  endpoint,
  facetsToCreate: missingFacets.map(facet => ({ name: facet.name, values: facet.values })),
  existingFacetsReused: definitions.length - missingFacets.length,
  missingValuesToAdd: missingValues.length,
  databaseWrites: writes,
  note: 'Only the Material facet is included. Colour, Size, Finish, Capacity and other customer-selectable variant choices remain option groups.',
}, null, 2));

if (missingFacets.length) {
  const declarations = [], selections = [], variables = {};
  missingFacets.forEach((facet, i) => {
    const key = \`f\${i}\`;
    declarations.push(\`$\${key}: CreateFacetInput!\`);
    selections.push(\`\${key}: createFacet(input: $\${key}) { id code name values { id code name } }\`);
    variables[key] = {
      code: facet.code,
      translations: [{ languageCode: 'en', name: facet.name }],
      values: facet.values.map(value => ({
        code: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        translations: [{ languageCode: 'en', name: value }],
      })),
    };
  });
  await request(\`mutation CreateFacets(\${declarations.join(', ')}) { \${selections.join(' ')} }\`, variables, token);
}

if (missingValues.length) {
  const declarations = [], selections = [], variables = {};
  missingValues.forEach((value, i) => {
    const key = \`v\${i}\`;
    declarations.push(\`$\${key}: CreateFacetValueInput!\`);
    selections.push(\`\${key}: createFacetValue(input: $\${key}) { id code name }\`);
    variables[key] = {
      facetId: value.facetId,
      code: value.code,
      translations: [{ languageCode: 'en', name: value.value }],
    };
  });
  await request(\`mutation CreateFacetValues(\${declarations.join(', ')}) { \${selections.join(' ')} }\`, variables, token);
}

const verification = await request(\`query VerifyFacets {
  facets(options: { take: 200 }) { items { id code name values { id code name } } }
}\`, {}, token);
const finalFacets = new Map((verification.data.facets.items || []).map(facet => [facet.code, facet]));
const problems = [];
for (const definition of definitions) {
  const facet = finalFacets.get(definition.code);
  if (!facet) {
    problems.push(\`Missing facet: \${definition.code}\`);
    continue;
  }
  const values = new Set(facet.values.map(value => value.code));
  for (const value of definition.values) {
    const code = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!values.has(code)) problems.push(\`Missing value: \${definition.name} / \${value}\`);
  }
}
console.log(JSON.stringify({
  status: problems.length ? 'FACET_VERIFICATION_FAILED' : 'FACETS_READY',
  expectedFacets: definitions.length,
  verifiedFacets: definitions.filter(definition => finalFacets.has(definition.code)).length,
  expectedFacetValues: definitions.reduce((sum, definition) => sum + definition.values.length, 0),
  verifiedFacetValues: definitions.reduce((sum, definition) => {
    const facet = finalFacets.get(definition.code);
    if (!facet) return sum;
    const values = new Set(facet.values.map(value => value.code));
    return sum + definition.values.filter(value => values.has(
      value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    )).length;
  }, 0),
  problems,
  databaseWrites: writes,
  note: 'No products, variants, collections, option groups, prices, stock, or assets were changed.',
}, null, 2));
if (problems.length) process.exitCode = 1;
