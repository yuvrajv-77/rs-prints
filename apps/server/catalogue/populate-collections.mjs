/**
 * Idempotently create the RS Prints Vendure collection hierarchy.
 * Run from apps/server:
 *   node catalogue/populate-collections.mjs
 *
 * Localhost only. Creates missing collections; never deletes or edits existing
 * collections, products, variants, facets, assets, or option groups.
 */
import fs from 'node:fs';
import path from 'node:path';

// Automatically load .env.test or .env if environment variables are not already present
const candidateEnvFiles = ['.env.test', '.env', '../.env.test', '../.env', 'apps/server/.env.test', 'apps/server/.env'];
for (const relPath of candidateEnvFiles) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (fs.existsSync(fullPath)) {
    const raw = fs.readFileSync(fullPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    }
    break;
  }
}

const endpoint = process.env.VENDURE_ADMIN_API_URL ||
  `http://localhost:${process.env.VENDURE_SERVER_PORT || 3000}/admin-api`;
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(endpoint)) {
  throw new Error('Blocked: only a localhost Vendure Admin API is allowed.');
}
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) {
  throw new Error('Missing Vendure superadmin credentials in .env.test.');
}

const hierarchy = [
  { name: 'Mugs', slug: 'mugs', children: [
    ['Ceramic Mugs', 'ceramic-mugs'], ['Glass Mugs', 'glass-mugs'],
  ]},
  { name: 'Drinkware', slug: 'drinkware', children: [
    ['Aluminium Bottles', 'aluminium-bottles'],
    ['Stainless Steel Bottles & Drinkware', 'stainless-steel-bottles-drinkware'],
    ['Kids Bottles', 'kids-bottles'], ['Glass Drinkware', 'glass-drinkware'],
  ]},
  { name: 'Clothing', slug: 'clothing', children: [
    ['Custom T-Shirts', 'custom-t-shirts'], ['Custom Polo T-Shirts', 'custom-polo-t-shirts'],
  ]},
  { name: 'Bags', slug: 'bags', children: [
    ['Custom Bags', 'custom-bags'], ['Custom Tote Bags', 'custom-tote-bags'],
  ]},
  { name: 'Home & Living', slug: 'home-living', children: [
    ['Fur Pillows', 'fur-pillows'], ['Flip Sequin', 'flip-sequin'],
  ]},
  { name: 'Gifts & Accessories', slug: 'gifts-accessories', children: [
    ['MDF Products', 'mdf-products'], ['MDF Collage Frames', 'mdf-collage-frames'],
    ['Glass Frames', 'glass-frames'], ['Stone & Wooden Frames', 'stone-wooden-frames'],
    ['Sublimation Accessories', 'sublimation-accessories'], ['Hard Board Products', 'hard-board-products'],
  ]},
];

async function request(query, variables = {}, token = '') {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) throw new Error(JSON.stringify(body.errors || body, null, 2));
  return { data: body.data, headers: response.headers };
}

const login = await request(`mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    ... on CurrentUser { id identifier }
    ... on ErrorResult { errorCode message }
  }
}`, { username: process.env.SUPERADMIN_USERNAME, password: process.env.SUPERADMIN_PASSWORD });
if (!login.data.login?.id) throw new Error(`Vendure login failed: ${JSON.stringify(login.data.login)}`);
const token = login.headers.get('vendure-auth-token');
if (!token) throw new Error('No Vendure bearer token returned.');

const preflight = await request(`query CollectionSetupPreflight {
  collections(options: { take: 250 }) { items { id name slug parent { id } } }
  collectionInput: __type(name: "CreateCollectionInput") {
    inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
}`, {}, token);

const fields = preflight.data.collectionInput?.inputFields || [];
if (!fields.length) throw new Error('CreateCollectionInput unavailable; no collections created.');
const fieldNames = new Set(fields.map(field => field.name));
const required = fields.filter(field => field.type.kind === 'NON_NULL').map(field => field.name);
const unsupported = required.filter(name => !['translations', 'filters'].includes(name));
if (unsupported.length) throw new Error(`Unsupported required collection input fields: ${unsupported.join(', ')}. No collections created.`);
if (!fieldNames.has('translations')) throw new Error('Collection translations input unavailable.');

const makeInput = (name, slug, parentId, description = '') => {
  const input = { translations: [{ languageCode: 'en', name, slug, description: description || `${name} collection.` }] };
  if (fieldNames.has('filters')) input.filters = [];
  if (parentId) {
    if (!fieldNames.has('parentId')) throw new Error('parentId input unavailable; no child collections created.');
    input.parentId = parentId;
  }
  return input;
};

const initial = preflight.data.collections.items || [];
const bySlug = new Map(initial.map(item => [item.slug, item]));
const duplicateSlugs = initial.map(item => item.slug).filter((slug, i, all) => all.indexOf(slug) !== i);
if (duplicateSlugs.length) throw new Error(`Duplicate existing collection slugs: ${[...new Set(duplicateSlugs)].join(', ')}`);

const missingParents = hierarchy.filter(parent => !bySlug.has(parent.slug));
const parentIds = new Map(hierarchy.filter(parent => bySlug.has(parent.slug)).map(parent => [parent.slug, bySlug.get(parent.slug).id]));

if (missingParents.length) {
  const declarations = [], selections = [], variables = {};
  missingParents.forEach((parent, i) => {
    const key = `p${i}`;
    declarations.push(`$${key}: CreateCollectionInput!`);
    selections.push(`${key}: createCollection(input: $${key}) { id name slug }`);
    variables[key] = makeInput(parent.name, parent.slug);
  });
  const result = await request(`mutation CreateParents(${declarations.join(', ')}) { ${selections.join(' ')} }`, variables, token);
  missingParents.forEach((parent, i) => {
    const created = result.data[`p${i}`];
    parentIds.set(parent.slug, created.id);
    bySlug.set(parent.slug, created);
  });
}

const missingChildren = [];
for (const parent of hierarchy) {
  const parentId = parentIds.get(parent.slug);
  if (!parentId) throw new Error(`Parent ${parent.slug} could not be resolved.`);
  for (const [name, slug] of parent.children) {
    const found = bySlug.get(slug);
    if (found && found.parent?.id !== parentId) {
      throw new Error(`Existing collection ${slug} is not under expected parent ${parent.slug}. Existing data was not modified.`);
    }
    if (!found) missingChildren.push({ name, slug, parentId });
  }
}

if (missingChildren.length) {
  const declarations = [], selections = [], variables = {};
  missingChildren.forEach((child, i) => {
    const key = `c${i}`;
    declarations.push(`$${key}: CreateCollectionInput!`);
    selections.push(`${key}: createCollection(input: $${key}) { id name slug parent { id } }`);
    variables[key] = makeInput(child.name, child.slug, child.parentId);
  });
  const result = await request(`mutation CreateChildren(${declarations.join(', ')}) { ${selections.join(' ')} }`, variables, token);
  missingChildren.forEach((child, i) => bySlug.set(child.slug, result.data[`c${i}`]));
}

const verify = await request(`query VerifyCollections {
  collections(options: { take: 250 }) { items { id name slug parent { id } } }
}`, {}, token);
const all = verify.data.collections.items || [];
const finalBySlug = new Map(all.map(item => [item.slug, item]));
const problems = [];
for (const parent of hierarchy) {
  const actualParent = finalBySlug.get(parent.slug);
  if (!actualParent) problems.push(`Missing parent: ${parent.slug}`);
  for (const [name, slug] of parent.children) {
    const child = finalBySlug.get(slug);
    if (!child) problems.push(`Missing child: ${slug}`);
    else if (actualParent && child.parent?.id !== actualParent.id) problems.push(`Wrong parent: ${slug}`);
  }
}
const expected = hierarchy.length + hierarchy.reduce((sum, parent) => sum + parent.children.length, 0);
console.log(JSON.stringify({
  status: problems.length ? 'VERIFICATION_FAILED' : 'COLLECTIONS_READY',
  authenticatedAs: login.data.login.identifier,
  expectedCollections: expected,
  totalCollectionsFound: all.length,
  parents: hierarchy.length,
  children: expected - hierarchy.length,
  createdParents: missingParents.length,
  createdChildren: missingChildren.length,
  existingCollectionsReused: expected - missingParents.length - missingChildren.length,
  unexpectedExistingCollections: all.length - expected,
  problems,
  databaseWrites: missingParents.length + missingChildren.length,
  note: 'Only missing collections were created. No products, variants, facets, assets, or existing collections were changed.',
}, null, 2));
if (problems.length) process.exitCode = 1;
