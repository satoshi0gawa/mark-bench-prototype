import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

import fixture from '../content/blog.fixture.mjs';
import { BLOG_OUTPUT_DIRECTORY, normalizeBlogEntries } from './content/blog-model.mjs';

const normalized = normalizeBlogEntries(fixture);
assert.equal(normalized.length, 3);
assert.equal(normalized[0].slug, 'github-pages-terms');
assert.equal(normalized[0].sections[0].id, 'section-1');
assert.equal(normalized[0].sections[0].number, '01');
assert.equal(normalized[0].references.length, 2);
assert.equal(normalized[0].relatedTool.toolId, 'html-table-builder');
assert.equal(normalized[1].references.length, 0);
assert.equal(normalized[1].relatedTool, null);
assert.equal(normalized[2].outputPath, 'build-notes/note-to-self/github-pages-troubleshooting.html');
assert.equal(normalized[2].seo.title, normalized[2].title);
assert.equal(normalized[2].seo.description, normalized[2].summary);
assert.ok(normalized.every((entry) => entry.outputPath.startsWith(`${BLOG_OUTPUT_DIRECTORY}/`)));
assert.ok(normalized.every((entry) => !Object.hasOwn(entry, 'articleType')));

const blankRelatedTool = structuredClone(fixture);
blankRelatedTool[1].relatedTool = {
  fieldId: 'relatedTool',
  toolId: '',
  label: '',
  description: '',
};
assert.equal(normalizeBlogEntries(blankRelatedTool)[1].relatedTool, null);

const invalidFixture = (mutate) => {
  const copy = structuredClone(fixture);
  mutate(copy);
  return copy;
};

assert.throws(
  () => normalizeBlogEntries(invalidFixture((entries) => { entries[1].slug = entries[0].slug; })),
  /slug values must be unique/,
);
assert.throws(
  () => normalizeBlogEntries(invalidFixture((entries) => { entries[0].sections = []; })),
  /sections must contain at least one item/,
);
assert.throws(
  () => normalizeBlogEntries(invalidFixture((entries) => { entries[0].sections[0].body = '<h1>Invalid</h1>'; })),
  /disallowed element/,
);
assert.throws(
  () => normalizeBlogEntries(invalidFixture((entries) => { entries[0].references[0].url = 'javascript:alert(1)'; })),
  /HTTP or HTTPS/,
);
assert.throws(
  () => normalizeBlogEntries(invalidFixture((entries) => { delete entries[0].relatedTool.label; })),
  /toolId, label, and description must be supplied together/,
);
assert.throws(
  () => normalizeBlogEntries(invalidFixture((entries) => {
    entries[0].seo.ogImage = { url: 'not-a-url', width: 1200, height: 630 };
  })),
  /ogImage URL must be valid/,
);

for (const entry of normalized) {
  if (!entry.relatedTool) continue;
  await access(new URL(`../tools/${entry.relatedTool.toolId}.html`, import.meta.url));
}

const schemaUrl = new URL('../microcms/blog-schema.json', import.meta.url);
const schema = JSON.parse(await readFile(schemaUrl, 'utf8'));
assert.ok(Array.isArray(schema.apiFields) && schema.apiFields.length > 0);
assert.ok(Array.isArray(schema.customFields) && schema.customFields.length > 0);

const apiFieldIds = schema.apiFields.map((field) => field.fieldId);
const customFieldIds = schema.customFields.map((field) => field.fieldId);
assert.equal(new Set(apiFieldIds).size, apiFieldIds.length, 'API field IDs must be unique');
assert.equal(new Set(customFieldIds).size, customFieldIds.length, 'Custom field IDs must be unique');

for (const field of schema.apiFields) {
  if (field.kind === 'custom') assert.ok(customFieldIds.includes(field.customFieldId));
  if (field.kind === 'repeater') {
    assert.ok(field.customFieldIds.length > 0);
    field.customFieldIds.forEach((fieldId) => assert.ok(customFieldIds.includes(fieldId)));
  }
}

for (const customField of schema.customFields) {
  const fieldIds = customField.fields.map((field) => field.fieldId);
  assert.equal(new Set(fieldIds).size, fieldIds.length, `${customField.fieldId} field IDs must be unique`);
  assert.deepEqual(customField.fieldOrderByColumn.flat().sort(), [...fieldIds].sort());
}

assert.equal(schema.apiFields.some((field) => field.fieldId === 'articleType'), false);

const slugField = schema.apiFields.find((field) => field.fieldId === 'slug');
assert.equal(slugField.required, true);
assert.equal(slugField.isUnique, true);
assert.equal(slugField.patternMatchValidation.regexp.pattern, '^[a-z0-9]+(?:-[a-z0-9]+)*$');

const sectionsField = schema.apiFields.find((field) => field.fieldId === 'sections');
assert.equal(sectionsField.required, true);
assert.equal(sectionsField.repeaterCountLimitValidation.repeatCount.min, 1);

const relatedToolField = schema.customFields.find((field) => field.fieldId === 'relatedTool');
assert.ok(relatedToolField.fields.every((field) => field.required === false));

console.log(`NOTE to SELF content validation passed: ${normalized.length} fixture entries and microCMS schema.`);
