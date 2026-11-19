/**
 * Read-only dry-run for the normalized RS Prints catalogue.
 * Does not connect to Vendure and does not modify any database.
 *
 * Run from apps/server:
 *   node catalogue/dry-run-normalized-catalogue.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(import.meta.dirname, 'normalized-catalogue-plan.json');
const plan = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
const warnings = [];
const sourceCodes = plan.sourceItems.map(item => item.sourceCode);
const productCodes = plan.productModels.map(model => model.productCode);
const mappedCodes = plan.productModels.flatMap(model => model.sourceCodes || []);

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}
const sourceSet = new Set(sourceCodes);
const mappedSet = new Set(mappedCodes);

for (const code of duplicates(sourceCodes)) errors.push(`Duplicate source inventory code: ${code}`);
for (const code of duplicates(productCodes)) errors.push(`Duplicate internal product code: ${code}`);
for (const code of duplicates(mappedCodes)) errors.push(`Source item mapped more than once: ${code}`);
for (const code of sourceCodes) if (!mappedSet.has(code)) errors.push(`Unmapped source item: ${code}`);
for (const code of mappedCodes) if (!sourceSet.has(code)) errors.push(`Unknown source reference: ${code}`);

const proposedProducts = [];
const blockedProducts = [];

for (const model of plan.productModels) {
  if (!model.productCode || !model.name || !model.collectionSlug) {
    errors.push(`Missing product identity fields: ${model.productCode || '(unknown)'}`);
    continue;
  }
  const groups = model.optionGroups || [];
  const groupNames = groups.map(group => group.name.trim().toLowerCase());
  for (const name of duplicates(groupNames)) errors.push(`Duplicate option group "${name}" in ${model.productCode}`);
  for (const group of groups) {
    const values = (group.values || []).map(value => String(value).trim());
    if (!values.length) errors.push(`Empty option group "${group.name}" in ${model.productCode}`);
    for (const value of duplicates(values.map(value => value.toLowerCase()))) {
      errors.push(`Duplicate option "${value}" in ${model.productCode} / ${group.name}`);
    }
  }

  let variants = [];
  if (groups.length === 0) {
    variants = [{ sku: `${model.productCode}-DEFAULT`, options: {} }];
  } else if (groups.length === 1) {
    variants = groups[0].values.map(value => ({
      sku: `${model.productCode}-${String(value).normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase()}`,
      options: { [groups[0].name]: value },
    }));
  } else if (Array.isArray(model.variantCombinations) && model.variantCombinations.length) {
    variants = model.variantCombinations.map((combination, index) => {
      for (const group of groups) {
        const value = combination[group.name];
        if (!group.values.includes(value)) {
          errors.push(`Invalid ${group.name}="${value}" combination in ${model.productCode}`);
        }
      }
      const optionParts = groups.map(group => String(combination[group.name] ?? '').normalize('NFKD')
        .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase());
      return { sku: `${model.productCode}-${optionParts.join('-') || index + 1}`, options: combination };
    });
  } else {
    blockedProducts.push({
      productCode: model.productCode,
      name: model.name,
      reason: 'Multiple option groups but no explicit valid variantCombinations. Cartesian combinations are deliberately not generated.',
      optionGroups: groups.map(group => ({ name: group.name, values: group.values })),
    });
  }

  if (model.confidence !== 'high' || model.review) {
    warnings.push({ productCode: model.productCode, confidence: model.confidence, review: model.review || null });
  }
  if (variants.length) {
    proposedProducts.push({
      productCode: model.productCode,
      name: model.name,
      collectionSlug: model.collectionSlug,
      sourceCodes: model.sourceCodes,
      optionGroups: groups,
      variants,
      enabled: false,
      price: 0,
    });
  }
}

const allSkus = proposedProducts.flatMap(product => product.variants.map(variant => variant.sku));
for (const sku of duplicates(allSkus)) errors.push(`Duplicate generated SKU: ${sku}`);

const report = {
  status: errors.length ? 'FAILED' : blockedProducts.length ? 'BLOCKED_REVIEW_REQUIRED' : 'DRY_RUN_READY',
  sourceItems: plan.sourceItems.length,
  productModels: plan.productModels.length,
  optionBearingModels: plan.productModels.filter(model => (model.optionGroups || []).length).length,
  proposedProducts: proposedProducts.length,
  proposedVariants: proposedProducts.reduce((count, product) => count + product.variants.length, 0),
  blockedProducts: blockedProducts.length,
  reviewWarnings: warnings.length,
  duplicateSourceMappings: duplicates(mappedCodes),
  errors,
  blockedProductsDetail: blockedProducts,
  reviewWarningsDetail: warnings,
  // Kept in output for inspection. This is a plan only, not an import payload.
  proposedProductsPreview: proposedProducts,
};
console.log(JSON.stringify(report, null, 2));
if (errors.length || blockedProducts.length) process.exitCode = 1;
