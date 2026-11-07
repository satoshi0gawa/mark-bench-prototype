import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/css-custom-property-builder.js');

const builder = globalThis.MarkBenchCssCustomPropertyBuilder;
assert.ok(builder, 'CSS Custom Property Builder module should be available');
assert.equal(builder.MAX_PROPERTIES, 100);
assert.equal(builder.MAX_INPUT_LENGTH, 10000);
assert.deepEqual(builder.CATEGORIES, ['COLOR', 'TYPOGRAPHY', 'SPACING', 'SIZE', 'BORDER', 'SHADOW', 'MOTION', 'OTHER']);
assert.equal(builder.normalizePropertyName('color primary'), '--color-primary');
assert.equal(builder.normalizePropertyName('--space-m'), '--space-m');
assert.equal(builder.normalizePropertyName('---duration'), '--duration');
assert.equal(builder.isValidPropertyName('--color-primary'), true);
assert.equal(builder.isValidPropertyName('--色'), true);
assert.equal(builder.isValidPropertyName('color-primary'), false);
assert.equal(builder.isValidPropertyName('--1-size'), false);
assert.equal(builder.isValidScope(':root'), true);
assert.equal(builder.isValidScope('[data-theme="dark"]'), true);
assert.equal(builder.isValidScope(':root; body'), false);
assert.equal(builder.escapeCssComment('Token */ break\nline'), 'Token * / break line');
assert.equal(builder.usageForRow({ name: '--space-m', fallback: '1rem' }), 'var(--space-m, 1rem)');
assert.equal(builder.looksLikeColor('#18243b'), true);
assert.equal(builder.looksLikeColor('oklch(60% 0.2 40)'), true);
assert.equal(builder.looksLikeColor('1rem'), false);

const sample = builder.generate({
  scope: ':root',
  themeScope: '[data-theme="dark"]',
  includeComments: true,
  indentSize: 2,
  rows: builder.SAMPLE_PROPERTIES,
});
assert.equal(sample.hasErrors, false);
assert.equal(sample.warnings.length, 0);
assert.equal(sample.metrics.properties, 8);
assert.equal(sample.metrics.themed, 4);
assert.equal(sample.metrics.categories, 6);
assert.equal(sample.metrics.colors, 3);
assert.equal(sample.metrics.errors, 0);
assert.equal(sample.metrics.lines, 29);
assert.match(sample.css, /^:root \{/u);
assert.match(sample.css, /\/\* Primary text and navigation color \*\//u);
assert.match(sample.css, /--color-primary: #18243b;/u);
assert.match(sample.css, /\[data-theme="dark"\] \{/u);
assert.match(sample.css, /--color-primary: #e5e7eb;/u);
assert.match(sample.usage, /--color-primary: var\(--color-primary, #111827\);/u);
const parsedJson = JSON.parse(sample.json);
assert.equal(parsedJson.default['--color-primary'], '#18243b');
assert.equal(parsedJson.theme['--color-primary'], '#e5e7eb');

const noComments = builder.generate({ rows: builder.SAMPLE_PROPERTIES.slice(0, 1), includeComments: false, indentSize: 4 });
assert.doesNotMatch(noComments.css, /\/\*/u);
assert.match(noComments.css, /^:root \{\n {4}--color-primary:/u);

const invalid = builder.generate({
  scope: ':root; body',
  themeScope: '{ dark }',
  rows: [
    { name: 'valid name', value: '' },
    { name: '--duplicate', value: '#fff', themeValue: '#000' },
    { name: '--duplicate', value: '{ color: red }' },
  ],
});
const invalidCodes = invalid.warnings.map(({ code }) => code);
assert.equal(invalid.hasErrors, true);
assert.ok(invalidCodes.includes('SCOPE_INVALID'));
assert.ok(invalidCodes.includes('THEME_SCOPE_INVALID'));
assert.ok(invalidCodes.includes('VALUE_REQUIRED'));
assert.ok(invalidCodes.includes('NAME_DUPLICATE'));
assert.ok(invalidCodes.includes('VALUE_INVALID'));

const caseSensitive = builder.generate({ rows: [{ name: '--token', value: '1rem' }, { name: '--Token', value: '2rem' }] });
assert.equal(caseSensitive.hasErrors, false);
assert.equal(caseSensitive.metrics.properties, 2);
const empty = builder.generate();
assert.equal(empty.hasErrors, false);
assert.ok(empty.warnings.some(({ code }) => code === 'PROPERTY_EMPTY'));

const page = await readFile(new URL('../tools/css-custom-property-builder.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="css-custom-property-builder"/u);
assert.match(page, /js\/css-custom-property-builder\.js/u);
assert.match(page, /privacy-note__body/u);
assert.match(page, /data-tool-steps/u);
assert.match(page, /page-footer/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
// Directory counts are checked centrally by check:tools-count.
assert.match(directory, /data-keyword="CSS変数"/u);
assert.match(directory, /data-id="css-custom-property-builder"/u);
assert.match(directory, /href="\.\/css-custom-property-builder\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /data-tools-count/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /'css-custom-property-builder'/u);
assert.match(controller, /kind: 'custom-property-builder'/u);
assert.match(controller, /renderCssCustomPropertyBuilder/u);

const moduleSource = await readFile(new URL('../js/css-custom-property-builder.js', import.meta.url), 'utf8');
assert.match(moduleSource, /data-property-add/u);
assert.match(moduleSource, /data-property-output/u);
assert.match(moduleSource, /TOKEN PREVIEW/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.workspace-grid--custom-properties/u);
assert.match(styles, /\.custom-property-builder__row-fields/u);
assert.match(styles, /\.custom-property-builder__metrics/u);

console.log('CSS Custom Property Builder checks passed.');
