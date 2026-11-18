/**
 * Read-only input-shape check for the normalized catalogue rebuild.
 * Logs in to local Vendure and introspects GraphQL input types only.
 * No mutations are executed.
 */
const endpoint = process.env.VENDURE_ADMIN_API_URL || `http://localhost:${process.env.VENDURE_SERVER_PORT || 3000}/admin-api`;
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(endpoint)) throw new Error('Only localhost Admin API is allowed.');
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) throw new Error('Missing superadmin credentials.');
async function post(query, variables = {}, token) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) throw new Error(JSON.stringify(body.errors || body, null, 2));
  return { data: body.data, headers: response.headers };
}
const login = await post(`mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    ... on CurrentUser { id }
    ... on ErrorResult { errorCode message }
  }
}`, { username: process.env.SUPERADMIN_USERNAME, password: process.env.SUPERADMIN_PASSWORD });
if (!login.data.login?.id) throw new Error(`Login failed: ${JSON.stringify(login.data.login)}`);
const token = login.headers.get('vendure-auth-token');
if (!token) throw new Error('No bearer token returned.');
const result = await post(`query InputShapeCheck {
  __schema {
    mutationType {
      fields {
        name
        args { name type { kind name ofType { kind name ofType { kind name } } } }
        type { kind name ofType { kind name } }
      }
    }
    types {
      kind
      name
      inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
    }
  }
}`, {}, token);
const schema = result.data.__schema;
const wantedInputs = [
  'CreateProductOptionGroupInput',
  'CreateGroupOptionInput',
  'CreateProductOptionInput',
  'CreateProductInput',
  'CreateProductVariantInput',
];
const inputNames = new Set([
  ...wantedInputs,
  ...schema.types.filter(item => item.kind === 'INPUT_OBJECT' && /TranslationInput$/.test(item.name)).map(item => item.name),
]);
const inputs = Object.fromEntries([...inputNames].sort().map(name => {
  const type = schema.types.find(item => item.name === name);
  return [name, type ? type.inputFields : null];
}));
const wantedMutations = [
  'createProductOptionGroup',
  'createProductOption',
  'createProduct',
  'addOptionGroupToProduct',
  'createProductVariants',
  'deleteProduct',
];
const mutations = Object.fromEntries(wantedMutations.map(name => {
  const field = schema.mutationType.fields.find(item => item.name === name);
  return [name, field ? { args: field.args, returns: field.type } : null];
}));
console.log(JSON.stringify({
  status: 'READ_ONLY_INPUT_SHAPE_CHECK',
  endpoint,
  inputs,
  mutations,
  note: 'Introspection only. No product, variant, option, or collection data was changed.',
}, null, 2));
