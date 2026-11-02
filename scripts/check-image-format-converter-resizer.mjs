import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/image-format-converter-resizer.js');

const converter = globalThis.MarkBenchImageFormatConverterResizer;
assert.ok(converter, 'Image Format Converter & Resizer module should be available');
assert.equal(converter.MAX_FILE_SIZE, 25 * 1024 * 1024);
assert.equal(converter.MAX_OUTPUT_DIMENSION, 8192);
assert.equal(converter.MAX_OUTPUT_PIXELS, 50_000_000);
assert.deepEqual(converter.SUPPORTED_INPUT_TYPES, ['image/png', 'image/jpeg', 'image/webp']);
assert.equal(converter.normalizeOutputFormat('png'), 'png');
assert.equal(converter.normalizeOutputFormat('gif'), 'webp');
assert.equal(converter.formatBytes(512), '512 B');
assert.equal(converter.formatBytes(1536), '1.5 KB');
assert.equal(converter.formatBytes(25 * 1024 * 1024), '25.00 MB');
assert.equal(converter.createOutputName('Photo Test.JPG', 800, 450, 'webp'), 'Photo-Test-800x450.webp');

assert.deepEqual(
  converter.calculateDimensions(1600, 900, 800, 900, { lockAspect: true, changedAxis: 'width' }),
  { width: 800, height: 450, ratio: 16 / 9, pixels: 360000 },
);
assert.deepEqual(
  converter.calculateDimensions(1600, 900, 1600, 225, { lockAspect: true, changedAxis: 'height' }),
  { width: 400, height: 225, ratio: 16 / 9, pixels: 90000 },
);
assert.deepEqual(
  converter.calculateDimensions(1600, 900, 640, 640, { lockAspect: false }),
  { width: 640, height: 640, ratio: 1, pixels: 409600 },
);
assert.deepEqual(converter.fitWithinLimit(16000, 8000), { width: 8192, height: 4096 });

assert.equal(converter.validateFile({ type: 'image/png', size: 1024 }).valid, true);
assert.match(converter.validateFile({ type: 'image/gif', size: 1024 }).error, /PNG・JPEG・WebP/u);
assert.match(converter.validateFile({ type: 'image/jpeg', size: converter.MAX_FILE_SIZE + 1 }).error, /25\.00 MB/u);
assert.equal(converter.validateOutputDimensions(800, 450).valid, true);
assert.match(converter.validateOutputDimensions(8193, 450).error, /8,192px/u);
assert.match(converter.validateOutputDimensions(8000, 8000).error, /50,000,000px/u);

const page = await readFile(new URL('../tools/image-format-converter-resizer.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="image-format-converter-resizer"/u);
assert.match(page, /js\/image-format-converter-resizer\.js/u);
assert.match(page, /privacy-note__body/u);
assert.match(page, /data-tool-steps/u);
assert.match(page, /page-footer/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
assert.match(directory, /TOOLS: 25/u);
assert.match(directory, /data-filter="all">ALL <span>25<\/span>/u);
assert.match(directory, /data-filter="image">IMAGE <span>02<\/span>/u);
assert.match(directory, /data-keyword="画像変換"/u);
assert.match(directory, /data-id="image-format-converter-resizer"/u);
assert.match(directory, /href="\.\/image-format-converter-resizer\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /25 TOOLS/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /'image-format-converter-resizer'/u);
assert.match(controller, /kind: 'image-converter'/u);
assert.match(controller, /renderImageFormatConverterResizer/u);

const moduleSource = await readFile(new URL('../js/image-format-converter-resizer.js', import.meta.url), 'utf8');
assert.match(moduleSource, /data-image-drop-zone/u);
assert.match(moduleSource, /data-image-download/u);
assert.match(moduleSource, /<div class="workspace-panel__header"><span id="image-output-preview-title">OUTPUT PREVIEW<\/span><\/div>/u);
assert.match(moduleSource, /data-image-output-size>—<\/dd><\/div><\/dl>/u);
assert.match(moduleSource, /<\/dl>\s*<a[^>]*class="workspace-action image-converter__download"[^>]*data-image-download>DOWNLOAD IMAGE<\/a>/u);
assert.doesNotMatch(moduleSource, /image-converter__download-cell/u);
assert.doesNotMatch(moduleSource, /image-converter__download-row/u);
assert.doesNotMatch(moduleSource, /image-output-preview-title">OUTPUT PREVIEW<\/span><a[^>]*data-image-download/u);
assert.match(moduleSource, /canvasToBlob/u);
assert.match(moduleSource, /imageSmoothingQuality = 'high'/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.workspace-grid--image-converter/u);
assert.match(styles, /\.image-converter__drop-zone/u);
assert.match(styles, /\.image-converter__metrics/u);
assert.match(styles, /\.image-converter__metrics \{[^}]*border-top: 1px solid #374151; border-bottom: 1px solid #374151;/u);
assert.match(styles, /\.image-converter__quality input \{ width: 100%; accent-color: #e5e7eb; \}/u);
assert.match(styles, /\.image-converter__convert \{[^}]*color: var\(--color-accent-yellow\);[^}]*background: var\(--color-primary\);/u);
assert.match(styles, /\.image-converter__download \{ display: flex; width: auto; min-height: 4rem; grid-column: 1 \/ -1;/u);
assert.match(styles, /data-tool-id="image-format-converter-resizer"[^}]*a\.image-converter__download\[data-image-download\] \{\s*--image-download-gutter: 0\.5rem;[\s\S]*?margin: var\(--image-download-gutter\);[\s\S]*?font-size: 0\.9rem;[\s\S]*?background: var\(--color-primary\);[\s\S]*?background-clip: padding-box;[\s\S]*?border-color: transparent;[\s\S]*?border-style: solid;[\s\S]*?box-shadow: 0 0 0 var\(--image-download-gutter\) var\(--color-primary\);/u);
assert.match(styles, /:is\(\.image-converter__convert, \.image-converter__download\):not\(:disabled\):hover \{\s*color: var\(--color-primary\);\s*background: var\(--color-accent-yellow\);/u);
assert.match(styles, /a\.image-converter__download\[data-image-download\]:hover \{\s*background-clip: padding-box;\s*border-color: transparent;\s*box-shadow: 0 0 0 var\(--image-download-gutter\) var\(--color-primary\);/u);
assert.doesNotMatch(styles, /--image-download-gutter: (?:1|0\.75)rem;/u);
assert.doesNotMatch(styles, /\.image-converter__preview--output \.image-converter__image-info/u);

console.log('Image Format Converter & Resizer checks passed.');
