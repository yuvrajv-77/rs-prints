/**
 * Populate enabled RS Prints variants in the local development database.
 * Run from apps/server: node --env-file=.env catalogue/populate-product-variants.mjs
 * Prices and stock are development estimates, not confirmed commercial data.
 */
import fs from 'node:fs';
import path from 'node:path';

if ((process.env.APP_ENV || '').toLowerCase() !== 'dev') throw new Error('Blocked: APP_ENV must be dev.');
if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL. Load .env with --env-file=.env.');
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) throw new Error('Missing Vendure superadmin credentials.');
const endpoint = process.env.VENDURE_ADMIN_API_URL || 'http://localhost:' + (process.env.VENDURE_SERVER_PORT || 3000) + '/admin-api';
const endpointUrl = new URL(endpoint);
if (!['localhost','127.0.0.1'].includes(endpointUrl.hostname) || endpointUrl.pathname !== '/admin-api') throw new Error('Only the localhost /admin-api endpoint is allowed.');

const plan = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'catalogue', 'normalized-catalogue-plan.json'), 'utf8'));
if (plan.currency !== 'INR' || plan.sourceItems.length !== 147 || plan.productModels.length !== 132) throw new Error('Unexpected catalogue plan or currency. No writes made.');
const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const codeOf = s => slugify(s).replace(/-/g, '_').toUpperCase();
const skuPart = s => String(s).normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();
const held = {
  'MUG-MAGIC-GLOSS-MATTE':'Glossy/matte body-style mapping needs confirmation.',
  'APP-COLLAR-TSHIRT':'Catalogue size labels need verification.',
  'MDF-KEYCHAIN':'Shape-to-source-code mapping needs high-resolution verification.',
  'FUR-SQUARE-PILLOW':'Red and pink need confirmation of matching dimensions/construction.',
  'ALU-BOTTLE-BB28-750':'Lid/body presentations need confirmation as selectable choices.',
  'ALU-BOTTLE-BB12-BB32':'BB12 and BB32 need confirmation as one selectable product.',
  'FUR-HEART-PILLOW':'Red and pink need confirmation of matching dimensions/construction.',
  'RS-MDF_PRODUCTS-A051':'Coaster shape/backing availability needs confirmation.'
};
const basePrice = {
  'ceramic-mugs':249,'glass-mugs':299,'glass-drinkware':249,'aluminium-bottles':399,
  'stainless-steel-bottles-drinkware':699,'kids-bottles':399,'custom-t-shirts':399,
  'custom-polo-t-shirts':499,'mdf-products':149,'mdf-collage-frames':599,'fur-pillows':499,
  'flip-sequin':599,'sublimation-accessories':149,'hard-board-products':249,
  'custom-bags':299,'custom-tote-bags':349,'glass-frames':499,'stone-wooden-frames':599
};
const errors = [], heldReport = [], prepared = [], skuSet = new Set();
for (const model of plan.productModels) {
  if (held[model.productCode]) { heldReport.push({productCode:model.productCode,reason:held[model.productCode]}); continue; }
  const groups = model.optionGroups || [];
  let combos = groups.length === 0 ? [{}] :
    groups.length === 1 ? groups[0].values.map(v => ({[groups[0].name]:v})) :
    Array.isArray(model.variantCombinations) ? model.variantCombinations.map(c => ({...c})) : [];
  if (!combos.length) { heldReport.push({productCode:model.productCode,reason:'Explicit multi-option combinations are missing.'}); continue; }
  if (model.productCode === 'APP-ROUND-TSHIRT') combos = combos.filter(c => !(c.Colour === 'White' && c.Material === 'Polyester'));
  for (const combo of combos) {
    if (Object.hasOwn(combo,'Size') && groups.some(g => g.name === 'Apparel Size')) { combo['Apparel Size'] = combo.Size; delete combo.Size; }
    if (Object.keys(combo).sort().join('|') !== groups.map(g=>g.name).sort().join('|')) { errors.push('Option key mismatch: '+model.productCode+' '+JSON.stringify(combo)); continue; }
    for (const g of groups) if (!g.values.includes(combo[g.name])) errors.push('Invalid option: '+model.productCode+' '+g.name+'='+combo[g.name]);
    const sku = groups.length ? model.productCode+'-'+groups.map(g=>skuPart(combo[g.name])).join('-') : model.productCode+'-DEFAULT';
    if (sku.length > 100 || skuSet.has(sku)) errors.push('Invalid or duplicate planned SKU: '+sku);
    skuSet.add(sku);
    let rupees = basePrice[model.collectionSlug] || 299;
    if (combo['Apparel Size'] === '2XL') rupees += 50;
    if (combo.Material === 'Polyester') rupees += 30;
    prepared.push({
      productCode:model.productCode, slug:slugify(model.productCode), productName:model.name,
      groups, combo, sku, price:rupees*100, stockOnHand:10
    });
  }
}
if (errors.length) throw new Error('Plan validation failed before login/writes:\n'+errors.join('\n'));
if (prepared.length !== 210) throw new Error('Expected 210 variants but prepared '+prepared.length+'. No writes made.');

async function gql(query, variables={}, token='') {
  const response = await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify({query,variables})});
  const body = await response.json();
  if (!response.ok || body.errors?.length) throw new Error(JSON.stringify(body.errors || body,null,2));
  return {data:body.data,headers:response.headers};
}
const login = await gql('mutation Login($username:String!,$password:String!){login(username:$username,password:$password){... on CurrentUser{id identifier} ... on ErrorResult{errorCode message}}}',{
  username:process.env.SUPERADMIN_USERNAME,password:process.env.SUPERADMIN_PASSWORD
});
if (!login.data.login?.id) throw new Error('Vendure login failed: '+JSON.stringify(login.data.login));
const token = login.headers.get('vendure-auth-token');
if (!token) throw new Error('Vendure did not return an auth token.');

const snap = await gql(`
query VariantPreflight {
 products(options:{take:200}) {
  items { id slug enabled optionGroups { id code name } variants { id sku enabled price stockOnHand } }
 }
 productOptionGroups(options:{take:200}) { items { id code name options { id code name } } }
 createVariantInput: __type(name:"CreateProductVariantInput") {
  inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
 }
 globalFlag: __type(name:"GlobalFlag") { enumValues { name }
 }
}`,{},token);
const products = snap.data.products.items || [];
const bySlug = new Map(products.map(p=>[p.slug,p]));
const optionGroups = snap.data.productOptionGroups.items || [];
const byGroupCode = new Map(optionGroups.map(g=>[g.code,g]));
const fields = new Set((snap.data.createVariantInput?.inputFields || []).map(f=>f.name));
for (const field of ['productId','sku','price','enabled','optionIds','translations','stockOnHand','trackInventory']) {
 if (!fields.has(field)) errors.push('CreateProductVariantInput.'+field+' is unavailable.');
}
for (const v of prepared) {
 const p = bySlug.get(v.slug);
 if (!p) { errors.push('Missing parent product '+v.productCode); continue; }
 if (p.enabled !== true) errors.push('Parent product is not enabled: '+v.productCode);
 for (const definition of v.groups) {
  const group = byGroupCode.get(codeOf(definition.name));
  if (!group) { errors.push('Missing shared option group '+definition.name); continue; }
  if (!(p.optionGroups||[]).some(g=>g.id===group.id)) errors.push('Option group not attached: '+v.productCode+' / '+definition.name);
  if (!(group.options||[]).some(o=>o.name===v.combo[definition.name])) errors.push('Missing option value: '+definition.name+' / '+v.combo[definition.name]);
 }
}
const globalFlags = new Set((snap.data.globalFlag?.enumValues || []).map(v=>v.name));
if (!globalFlags.has('TRUE')) errors.push('Vendure GlobalFlag.TRUE is unavailable; inventory tracking cannot be explicitly enabled.');
if (errors.length) throw new Error('Vendure preflight stopped before writes:\n'+errors.join('\n'));

const skuOwners = new Map();
for (const p of products) for (const variant of p.variants||[]) {
 if (skuOwners.has(variant.sku)) errors.push('Duplicate existing SKU '+variant.sku);
 else skuOwners.set(variant.sku,{productId:p.id,slug:p.slug,variant});
}
for (const v of prepared) {
 const owner=skuOwners.get(v.sku), product=bySlug.get(v.slug);
 if (owner && owner.productId!==product.id) errors.push('SKU belongs to another product: '+v.sku);
 if (owner && (owner.variant.enabled!==true || owner.variant.price!==v.price || owner.variant.stockOnHand!==v.stockOnHand)) {
  errors.push('Existing SKU has different enabled/price/stock; not overwriting: '+v.sku);
 }
}
if (errors.length) throw new Error('SKU checks stopped before writes:\n'+errors.join('\n'));

const inputs = prepared.map(v=>{
 const p=bySlug.get(v.slug);
 const optionIds=v.groups.map(def=>{
  const group=byGroupCode.get(codeOf(def.name));
  return group.options.find(o=>o.name===v.combo[def.name]).id;
 });
 return {
  productId:p.id, enabled:true, sku:v.sku, price:v.price, stockOnHand:v.stockOnHand, trackInventory:'TRUE', optionIds,
  translations:[{languageCode:'en',name:v.groups.length?v.productName+' - '+v.groups.map(g=>v.combo[g.name]).join(' / '):v.productName}]
 };
});
const missing=inputs.filter(v=>!skuOwners.has(v.sku));
let created=0;
for(let i=0;i<missing.length;i+=10){
 const batch=missing.slice(i,i+10);
 const result=await gql('mutation CreateEnabledVariants($input:[CreateProductVariantInput!]!){createProductVariants(input:$input){id sku enabled price stockOnHand}}',{input:batch},token);
 const rows=result.data.createProductVariants||[];
 if(rows.length!==batch.length) throw new Error('Vendure returned an unexpected variant count. Stop and inspect before rerunning.');
 created+=rows.length;
}
console.log(JSON.stringify({
 status:'PRODUCT_VARIANTS_POPULATED', authenticatedAs:login.data.login.identifier,
 plannedVariants:prepared.length, createdVariants:created, reusedVariants:prepared.length-missing.length,
 parentProductsUsed:new Set(prepared.map(v=>v.productCode)).size,
 optionBearingProducts:new Set(prepared.filter(v=>v.groups.length).map(v=>v.productCode)).size,
 enabledVariants:prepared.length, provisionalCurrency:'INR',
 provisionalPriceRangeINR:{min:Math.min(...prepared.map(v=>v.price))/100,max:Math.max(...prepared.map(v=>v.price))/100},
 developmentStockPerVariant:10, heldProducts:heldReport,
 note:'Prices are estimates for development only. Stock is test inventory, not a physical stock count. Replace both before launch.'
},null,2));
