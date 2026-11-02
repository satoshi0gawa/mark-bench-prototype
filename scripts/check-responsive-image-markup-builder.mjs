import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/responsive-image-markup-builder.js');

const builder = globalThis.MarkBenchResponsiveImageMarkupBuilder;
assert.ok(builder, 'Responsive Image Markup Builder module should be available');
assert.equal(builder.MAX_SOURCES, 8);
assert.equal(builder.MAX_INPUT_LENGTH, 10000);
assert.deepEqual(builder.IMAGE_TYPES, ['image/avif', 'image/webp', 'image/jpeg', 'image/png']);
assert.equal(builder.escapeAttribute('A&B"<>'), 'A&amp;B&quot;&lt;&gt;');
assert.equal(builder.toPositiveInteger('1280'), 1280);
assert.equal(builder.toPositiveInteger('0'), null);
assert.equal(builder.isSafeImageUrl('/images/hero.jpg'), true);
assert.equal(builder.isSafeImageUrl('https://example.com/hero.jpg'), true);
assert.equal(builder.isSafeImageUrl('javascript:alert(1)'), false);

const widthSrcset = builder.parseSrcset('/hero-480.jpg 480w, /hero-1280.jpg 1280w');
assert.equal(widthSrcset.valid, true);
assert.equal(widthSrcset.descriptorType, 'width');
assert.equal(widthSrcset.candidates.length, 2);
assert.deepEqual(widthSrcset.candidates.map(({ value }) => value), [480, 1280]);

const densitySrcset = builder.parseSrcset('/hero.jpg, /hero@2x.jpg 2x');
assert.equal(densitySrcset.valid, true);
assert.equal(densitySrcset.descriptorType, 'density');
assert.deepEqual(densitySrcset.candidates.map(({ value }) => value), [1, 2]);

const mixed = builder.parseSrcset('/hero-480.jpg 480w, /hero@2x.jpg 2x');
assert.equal(mixed.valid, false);
assert.ok(mixed.errors.some((message) => message.includes('混在')));
const duplicate = builder.parseSrcset('/hero.jpg 1x, /hero-copy.jpg 1x');
assert.ok(duplicate.warnings.some((message) => message.includes('重複')));
const invalidDescriptor = builder.parseSrcset('/hero.jpg 480px');
assert.equal(invalidDescriptor.valid, false);

const sample = builder.generateMarkup(builder.SAMPLE);
assert.equal(sample.hasErrors, false);
assert.equal(sample.warnings.length, 0);
assert.equal(sample.metrics.sources, 2);
assert.equal(sample.metrics.candidates, 9);
assert.equal(sample.metrics.descriptorMode, 'WIDTH');
assert.equal(sample.metrics.alt, 'DEFINED');
assert.equal(sample.metrics.lines, 5);
assert.match(sample.html, /^<picture>/u);
assert.match(sample.html, /<source type="image\/avif"/u);
assert.match(sample.html, /<source type="image\/webp"/u);
assert.match(sample.html, /srcset="\/images\/hero-480\.jpg 480w/u);
assert.match(sample.html, /sizes="\(max-width: 767px\) 100vw, min\(1200px, 80vw\)"/u);
assert.match(sample.html, /alt="制作環境のデスクとモニター"/u);
assert.match(sample.html, /width="1280" height="720"/u);
assert.match(sample.html, /loading="lazy" decoding="async" fetchpriority="auto"/u);

const decorative = builder.generateMarkup({ fallbackSrc: '/images/rule.svg', decorative: true });
assert.equal(decorative.hasErrors, false);
assert.match(decorative.html, /alt=""/u);
assert.equal(decorative.metrics.alt, 'DECORATIVE');
assert.ok(decorative.warnings.some((warning) => warning.code === 'DIMENSION_EMPTY'));

const invalid = builder.generateMarkup({
  fallbackSrc: 'javascript:alert(1)',
  fallbackSrcset: '/hero.jpg 480px',
  alt: '',
  width: '1280',
  height: 'zero',
  sources: [{ type: 'image/webp', media: 'max-width: 700px', srcset: '/hero.webp 1x' }],
});
const invalidCodes = invalid.warnings.map(({ code }) => code);
assert.equal(invalid.hasErrors, true);
assert.ok(invalidCodes.includes('SRC_INVALID'));
assert.ok(invalidCodes.includes('IMG_SRCSET_INVALID'));
assert.ok(invalidCodes.includes('ALT_REQUIRED'));
assert.ok(invalidCodes.includes('DIMENSION_INVALID'));
assert.ok(invalidCodes.includes('MEDIA_SYNTAX'));

const escaped = builder.generateMarkup({
  fallbackSrc: '/image.jpg?name=a&b=1',
  alt: 'A&B "image"',
  width: 100,
  height: 50,
});
assert.match(escaped.html, /src="\/image\.jpg\?name=a&amp;b=1"/u);
assert.match(escaped.html, /alt="A&amp;B &quot;image&quot;"/u);

const page = await readFile(new URL('../tools/responsive-image-markup-builder.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="responsive-image-markup-builder"/u);
assert.match(page, /js\/responsive-image-markup-builder\.js/u);
assert.match(page, /privacy-note__body/u);
assert.match(page, /data-tool-steps/u);
assert.match(page, /page-footer/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
assert.match(directory, /TOOLS: 25/u);
assert.match(directory, /data-filter="all">ALL <span>25<\/span>/u);
assert.match(directory, /data-filter="image">IMAGE <span>02<\/span>/u);
assert.match(directory, /data-keyword="レスポンシブ画像"/u);
assert.match(directory, /data-id="responsive-image-markup-builder"/u);
assert.match(directory, /href="\.\/responsive-image-markup-builder\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /25 TOOLS/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /'responsive-image-markup-builder'/u);
assert.match(controller, /kind: 'responsive-image-builder'/u);
assert.match(controller, /renderResponsiveImageMarkupBuilder/u);

const moduleSource = await readFile(new URL('../js/responsive-image-markup-builder.js', import.meta.url), 'utf8');
assert.match(moduleSource, /data-responsive-image-add/u);
assert.match(moduleSource, /data-responsive-image-output/u);
assert.match(moduleSource, /SELECTION PREVIEW/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.workspace-grid--responsive-image/u);
assert.match(styles, /\.responsive-image-builder__source-fields/u);
assert.match(styles, /\.responsive-image-builder__metrics/u);

console.log('Responsive Image Markup Builder checks passed.');
