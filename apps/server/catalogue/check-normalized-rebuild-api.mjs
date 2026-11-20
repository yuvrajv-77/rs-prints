/**
 * Read-only Vendure Admin API compatibility check for the normalized catalogue rebuild.
 * This script logs in and reads GraphQL schema metadata only. It performs no mutations.
 *
 * Run from apps/server:
 *   node --env-file=.env.test catalogue/check-normalized-rebuild-api.mjs
 */
const endpoint = process.env.VENDURE_ADMIN_API_URL || `http://localhost:${process.env.VENDURE_SERVER_PORT || 3000}/admin-api`;
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(endpoint)) {
  throw new Error('Blocked: this read-only probe only permits a localhost Admin API endpoint.');
}
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) {
  throw new Error('Missing SUPERADMIN_USERNAME or SUPERADMIN_PASSWORD in .env.test.');
}
async function request(query, variables = {}, token) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
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
if (!login.data.login?.id) throw new Error(`Admin login failed: ${JSON.stringify(login.data.login)}`);
const token = login.headers.get('vendure-auth-token');
if (!token) throw new Error('No vendure-auth-token returned. Confirm authOptions.tokenMethod includes bearer.');
const schema = await request(`query CatalogueRebuildSchemaCheck {
  __schema {
    queryType { fields { name } }
    mutationType { fields { name args { name type { kind name ofType { kind name ofType { kind name } } } } } }
  }
}`, {}, token);
const queryFields = new Set(schema.data.__schema.queryType.fields.map(field => field.name));
const mutationFields = new Map(schema.data.__schema.mutationType.fields.map(field => [field.name, field]));
const requiredQueries = ['products', 'facets', 'productOptionGroups'];
const requiredMutations = ['deleteProduct', 'createProductOptionGroup', 'createProductOption', 'createProduct', 'addOptionGroupToProduct', 'createProductVariants'];
const missingQueries = requiredQueries.filter(name => !queryFields.has(name));
const missingMutations = requiredMutations.filter(name => !mutationFields.has(name));
const requiredArgs = {
  deleteProduct: ['id'],
  createProductOptionGroup: ['input'],
  createProductOption: ['input'],
  createProduct: ['input'],
  addOptionGroupToProduct: ['productId', 'optionGroupId'],
  createProductVariants: ['input'],
};
const argumentMismatches = [];
for (const [fieldName, expected] of Object.entries(requiredArgs)) {
  const actual = new Set((mutationFields.get(fieldName)?.args || []).map(arg => arg.name));
  for (const arg of expected) if (!actual.has(arg)) argumentMismatches.push(`${fieldName} missing argument ${arg}`);
}
const report = {
  status: missingQueries.length || missingMutations.length || argumentMismatches.length ? 'INCOMPATIBLE' : 'API_SCHEMA_COMPATIBLE',
  endpoint,
  authenticatedAs: login.data.login.identifier,
  authMode: 'bearer token confirmed',
  missingQueries,
  missingMutations,
  argumentMismatches,
  note: 'Read-only schema introspection only. No products, variants, options, or collections were changed.',
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'API_SCHEMA_COMPATIBLE') process.exitCode = 1;
