/**
 * Destructively reset ONLY the RS Prints catalogue pilot records in the configured
 * non-production Vendure database, then create the finalized collection tree.
 * Run only with .env.test and after verifying DATABASE_URL.
 */
import fs from 'node:fs';
import path from 'node:path';

const catalogue = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'rs-prints-catalogue.json'), 'utf8'));
const endpoint = process.env.VENDURE_ADMIN_API_URL || 'http://localhost:3000/admin-api';
if (process.env.CATALOGUE_IMPORT_ALLOW !== 'true') throw new Error('Set CATALOGUE_IMPORT_ALLOW=true to confirm this destructive test reset.');
if (!['local','staging','development'].includes((process.env.CATALOGUE_IMPORT_ENV || '').toLowerCase())) throw new Error('Refusing to run outside local/staging/development.');
if (!process.env.SUPERADMIN_USERNAME || !process.env.SUPERADMIN_PASSWORD) throw new Error('Missing Vendure superadmin credentials.');
if (!process.env.DATABASE_URL || !/neon|localhost|127\\.0\\.0\\.1/i.test(process.env.DATABASE_URL)) throw new Error('DATABASE_URL does not look like the expected test database. Verify .env.test.');

let token='';
async function gql(query, variables={}) {
  const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify({query,variables})});
  const body=await response.json();
  if(!response.ok || body.errors?.length) throw new Error(JSON.stringify(body.errors||body,null,2));
  return body.data;
}
const login=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:`mutation Login($username:String!,$password:String!){login(username:$username,password:$password){... on CurrentUser{id} ... on ErrorResult{message}}}`,variables:{username:process.env.SUPERADMIN_USERNAME,password:process.env.SUPERADMIN_PASSWORD}})});
const loginBody=await login.json();
if(!login.ok||loginBody.errors?.length||!loginBody.data?.login?.id) throw new Error('Vendure login failed: '+JSON.stringify(loginBody));
token=login.headers.get('vendure-auth-token')||'';
if(!token) throw new Error('No Vendure auth token returned.');

const existing=await gql(`query ResetList {
 products(options:{take:1000}){items{id slug name}}
 collections(options:{take:500}){items{id slug name parent{id}}}
 facets(options:{take:100}){items{id code name values{id code name}}}
}`);
const pilotSlugs=["white-mug-a001","motto-ceramic-mug-a111","cone-mug-a003"];
const targetProductSlugs=new Set(pilotSlugs);
let deletedProducts=0;
for(const p of existing.products.items.filter(p=>targetProductSlugs.has(p.slug))){
 const r=await gql(`mutation DeletePilotProduct($id:ID!){deleteProduct(id:$id){result message}}`,{id:p.id});
 if(r.deleteProduct.result!=='DELETED') throw new Error('Could not delete pilot product '+p.slug+': '+JSON.stringify(r.deleteProduct));
 deletedProducts++;
}
const oldCollectionSlugs=new Set(["ceramic-mugs","glass-drinkware","aluminium-bottles","stainless-steel-drinkware","mdf-products","mdf-collage-frames","fur-pillows","flip-sequin","sublimation-products","hard-board","apparel","glass-frames","stone-frames","kids-water-bottles","mugs","drinkware","clothing","bags","home-living","gifts-accessories","glass-mugs","stainless-steel-bottles-drinkware","kids-bottles","custom-t-shirts","custom-polo-t-shirts","custom-bags","custom-tote-bags","stone-wooden-frames","sublimation-accessories","hard-board-products"]);
let deletedCollections=0;
const targets=existing.collections.items.filter(c=>oldCollectionSlugs.has(c.slug));
targets.sort((a,b)=>Number(Boolean(b.parent?.id))-Number(Boolean(a.parent?.id)));
for(const c of targets){
 const r=await gql(`mutation DeleteOldCollection($id:ID!){deleteCollection(id:$id){result message}}`,{id:c.id});
 if(r.deleteCollection.result!=='DELETED') throw new Error('Could not delete collection '+c.slug+': '+JSON.stringify(r.deleteCollection));
 deletedCollections++;
}
const languageCode='en';
const codeOf=s=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').toUpperCase();
let facet=existing.facets.items.find(f=>f.code==='catalogue_collection');
const leaves=catalogue.collectionTree.flatMap(p=>p.children);
if(!facet){
 const r=await gql(`mutation CreateCollectionFacet($input:CreateFacetInput!){createFacet(input:$input){id code name values{id code name}}}`,{input:{code:'catalogue_collection',isPrivate:false,translations:[{languageCode,name:'Catalogue collection'}],values:leaves.map(x=>({code:codeOf(x.slug),translations:[{languageCode,name:x.slug}]}))}});
 facet=r.createFacet;
}else{
 const have=new Set(facet.values.map(v=>v.code));
 const missing=leaves.filter(x=>!have.has(codeOf(x.slug)));
 if(missing.length){
  const r=await gql(`mutation AddCollectionFacetValues($input:[CreateFacetValueInput!]!){createFacetValues(input:$input){id code name}}`,{input:missing.map(x=>({facetId:facet.id,code:codeOf(x.slug),translations:[{languageCode,name:x.slug}]}))});
  facet.values.push(...r.createFacetValues);
 }
}
const values=new Map(facet.values.map(v=>[v.code.toLowerCase().replace(/_/g,'-'),v]));
const filter=ids=>[{code:'facet-value-filter',arguments:[{name:'facetValueIds',value:JSON.stringify(ids)},{name:'containsAny',value:'true'}]}];
const createdParents=[];
for(const parent of catalogue.collectionTree){
 const childIds=parent.children.map(c=>values.get(c.slug)?.id).filter(Boolean);
 const p=await gql(`mutation CreateParent($input:CreateCollectionInput!){createCollection(input:$input){id name slug}}`,{input:{inheritFilters:false,filters:filter(childIds),translations:[{languageCode,name:parent.name,slug:parent.slug,description:'RS Prints catalogue: '+parent.name}]}});
 createdParents.push({name:p.createCollection.name,slug:p.createCollection.slug,children:[]});
 for(const child of parent.children){
  const v=values.get(child.slug);
  if(!v) throw new Error('Missing facet value '+child.slug);
  const c=await gql(`mutation CreateChild($input:CreateCollectionInput!){createCollection(input:$input){id name slug parent{id}}}`,{input:{parentId:p.createCollection.id,inheritFilters:true,filters:filter([v.id]),translations:[{languageCode,name:child.name,slug:child.slug,description:'RS Prints catalogue: '+parent.name+' / '+child.name}]}});
  createdParents.at(-1).children.push(c.createCollection.name);
 }
}
console.log(JSON.stringify({deletedPilotProducts:deletedProducts,deletedOldCollections:deletedCollections,createdParentCollections:createdParents.length,createdSubcollections:createdParents.reduce((n,p)=>n+p.children.length,0),tree:createdParents},null,2));
