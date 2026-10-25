import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/bem-class-builder.js');

const builder = globalThis.MarkBenchBemClassBuilder;
assert.ok(builder, 'BEM Class Builder module should be available');
assert.equal(Object.keys(builder.CATEGORY_DEFINITIONS).length, 11);

assert.equal(builder.normalizeToken('SiteHeader'), 'site-header');
assert.equal(builder.normalizeToken('site_header'), 'site-header');
assert.equal(builder.normalizeToken('  site   header  '), 'site-header');
assert.equal(builder.normalizeToken('.Site@Header!'), 'site-header');

const block = builder.generate({ block: 'card' });
assert.equal(block.structure, 'BLOCK');
assert.equal(block.classList, 'card');
assert.equal(block.selector, '.card');
assert.equal(block.attribute, 'class="card"');
assert.match(block.css, /^\.card \{/u);
assert.equal(block.isValid, true);

const element = builder.generate({ block: 'card', element: 'title' });
assert.equal(element.structure, 'ELEMENT');
assert.equal(element.className, 'card__title');
assert.equal(element.classList, 'card__title');

const modifier = builder.generate({ block: 'card', element: 'title', modifier: 'featured' });
assert.equal(modifier.structure, 'MODIFIER');
assert.equal(modifier.selector, '.card__title--featured');
assert.equal(modifier.classList, 'card__title card__title--featured');
assert.equal(modifier.attribute, 'class="card__title card__title--featured"');
assert.match(modifier.css, /\.card__title \{/u);
assert.match(modifier.css, /\.card__title--featured \{/u);
assert.equal(modifier.classCount, 2);
assert.equal(modifier.status, 'READY');

const normalized = builder.generate({ block: 'SiteCard', element: 'card_title', modifier: 'Is Featured' });
assert.deepEqual({ ...normalized.parts }, { block: 'site-card', element: 'card-title', modifier: 'is-featured' });
assert.equal(normalized.normalized, true);

const missing = builder.inspect({ element: 'title' });
assert.equal(missing.isValid, false);
assert.ok(missing.warnings.some((warning) => warning.type === 'BLOCK_REQUIRED'));

const invalid = builder.inspect({ block: '01-card', element: 'body__text', modifier: 'red' });
assert.ok(invalid.warnings.some((warning) => warning.type === 'LEADING_DIGIT'));
assert.ok(invalid.warnings.some((warning) => warning.type === 'BEM_DELIMITER'));
assert.ok(invalid.warnings.some((warning) => warning.type === 'NESTED_ELEMENT'));
assert.ok(invalid.warnings.some((warning) => warning.type === 'PRESENTATIONAL_MODIFIER'));
assert.equal(invalid.isValid, false);

const invalidCharacters = builder.inspect({ block: 'カード' });
assert.ok(invalidCharacters.warnings.some((warning) => warning.type === 'BLOCK_INVALID'));
assert.ok(invalidCharacters.warnings.some((warning) => warning.type === 'INVALID_CHARACTERS'));

const longName = builder.inspect({ block: 'component', element: 'very-long-structural-element-name-for-the-main-content-area', modifier: 'featured-state' });
assert.ok(longName.warnings.some((warning) => warning.type === 'CLASS_TOO_LONG'));

const japaneseSearch = builder.searchSuggestions('section', '見出し');
assert.ok(japaneseSearch.elements.some((item) => item.value === 'heading'));
const englishSearch = builder.searchSuggestions('card', 'title');
assert.ok(englishSearch.elements.some((item) => item.value === 'title'));
assert.equal(builder.getCategory('unknown'), builder.CATEGORY_DEFINITIONS.header);

const page = await readFile(new URL('../tools/bem-class-builder.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="bem-class-builder"/u);
assert.match(page, /js\/bem-class-builder\.js/u);
assert.match(page, /data-tool-workspace/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
assert.match(directory, /AVAILABLE: 16/u);
assert.match(directory, /data-filter="all">ALL <span>16<\/span>/u);
assert.match(directory, /data-filter="css">CSS <span>04<\/span>/u);
assert.match(directory, /href="\.\/bem-class-builder\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /16 TOOLS/u);

console.log('BEM Class Builder checks passed.');
