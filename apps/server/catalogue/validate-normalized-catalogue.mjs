/**
 * Validate the normalized RS Prints catalogue plan without connecting to Vendure.
 *
 * Run from apps/server:
 *   node catalogue/validate-normalized-catalogue.mjs
 *
 * Read-only: this script does not connect to a database or mutate anything.
 */
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(import.meta.dirname, 'normalized-catalogue-plan.json');
const plan = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
const warnings = [];
const sourceCodes = plan.sourceItems.map(item => item.sourceCode);
const productCodes = plan.productModels.map(model => model.productCode);
const mappedCodes = plan.productModels.flatMap(model => model.sourceCodes);

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

for (const code of duplicates(sourceCodes)) errors.push(\`Duplicate source item code: \${code}\`);
for (const code of duplicates(productCodes)) errors.push(\`Duplicate internal product code: \${code}\`);
for (const code of duplicates(mappedCodes)) errors.push(\`Source item mapped more than once: \${code}\`);

const sourceSet = new Set(sourceCodes);
const mappedSet = new Set(mappedCodes);
for (const code of sourceCodes) {
  if (!mappedSet.has(code)) errors.push(\`Source item is not mapped to a product model: \${code}\`);
}
for (const code of mappedCodes) {
  if (!sourceSet.has(code)) errors.push(\`Product model references unknown source item: \${code}\`);
}

for (const model of plan.productModels) {
  if (!model.productCode || !model.name || !model.collectionSlug) {
    errors.push(\`Product model missing required identity fields: \${JSON.stringify(model)}\`);
  }
  const groupNames = model.optionGroups.map(group => group.name.toLowerCase());
  for (const name of duplicates(groupNames)) {
    errors.push(\`Duplicate option group "\${name}" in \${model.productCode}\`);
  }
  for (const group of model.optionGroups) {
    if (!group.values?.length) errors.push(\`Empty option group "\${group.name}" in \${model.productCode}\`);
    for (const value of duplicates((group.values || []).map(v => v.toLowerCase()))) {
      errors.push(\`Duplicate option "\${value}" in \${model.productCode} / \${group.name}\`);
    }
  }
  if (model.confidence !== 'high') {
    warnings.push(\`Review required: \${model.productCode} (\${model.confidence})\`);
  }
  if (model.optionGroups.length && model.variantGeneration !== 'explicit_combinations_only') {
    errors.push(\`Option-bearing model must use explicit combinations only: \${model.productCode}\`);
  }
}

const report = {
  status: errors.length ? 'FAILED' : 'STRUCTURE_VALIDATION_PASSED',
  sourceItems: plan.sourceItems.length,
  productModels: plan.productModels.length,
  optionBearingModels: plan.productModels.filter(model => model.optionGroups.length).length,
  defaultVariantModels: plan.productModels.filter(model => !model.optionGroups.length).length,
  sourceItemsMappedExactlyOnce: errors.length === 0,
  reviewQueueItems: plan.reviewQueue.length,
  warnings: warnings.length,
  errors,
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
