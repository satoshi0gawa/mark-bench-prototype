import assert from 'node:assert/strict';
await import('../js/placeholder-image-generator.js');

const { defaults, formats, validate, createSvg, filename, toBlob } = globalThis.MarkBenchPlaceholderImageGenerator;
const supported = new Set(['png', 'jpeg', 'svg', 'webp']);
const check = values => validate({ ...defaults, ...values }, supported);
assert.equal(check({}).valid, true);
for (const width of ['', '0', '-1', '1.5', '1e3', '4097']) assert.ok(check({ width }).errors.width, width);
assert.equal(check({ width: 1, height: 1 }).valid, true);
assert.equal(check({ width: 4096, height: 2048 }).valid, true);
assert.ok(check({ width: 4096, height: 2049 }).errors.height);
assert.ok(check({ fontSize: '513' }).errors.fontSize);
assert.ok(check({ text: 'a'.repeat(121) }).errors.text);
assert.ok(check({ text: 'line\nbreak' }).errors.text);
assert.ok(check({ text: '\ud800' }).errors.text);
assert.ok(check({ foreground: '#fff' }).errors.foreground);
assert.ok(check({ background: 'url(example)' }).errors.background);
assert.ok(check({ format: 'avif' }).errors.format);
assert.equal(validate({ ...defaults, format: 'avif' }, new Set(['avif'])).valid, true);
assert.ok(check({ format: 'jpeg', quality: 9 }).errors.quality);
assert.equal(check({ format: 'jpeg', quality: 10 }).valid, true);
assert.equal(check({ format: 'jpeg', quality: 100 }).valid, true);
assert.equal(check({ format: 'png', quality: '', hideText: true, fontSize: 'bad', foreground: 'bad' }).valid, true);

const svg = values => createSvg({ ...defaults, ...values }, (label, size) => label.length * size);
assert.match(svg({}), /viewBox="0 0 800 450"[\s\S]*>800 × 450<\/text>/u);
assert.match(svg({ text: '<文&画像> "quote" ' }), /&lt;文&amp;画像&gt; &quot;quote&quot;/u);
assert.doesNotMatch(svg({ hideText: true }), /<text/u);
const fitted = svg({ width: 100, fontSize: 80, text: 'wide text' }).match(/font-size="([^"]+)"/u);
assert.ok(Number(fitted[1]) < 80);
assert.equal(filename({ ...defaults, format: 'jpeg' }), 'placeholder-800x450.jpg');
assert.equal(filename({ ...defaults, format: 'svg' }), 'placeholder-800x450.svg');

const mockCanvas = blob => ({ toBlob(resolve) { resolve(blob); } });
const png = new Blob(['image'], { type: formats.png.mime });
assert.equal(await toBlob(mockCanvas(png), formats.png.mime), png);
await assert.rejects(toBlob(mockCanvas(png), formats.avif.mime), /Unexpected image format/u);
await assert.rejects(toBlob(mockCanvas(null), formats.jpeg.mime), /empty result/u);
console.log('Placeholder Image Generator checks passed: input limits, SVG output and MIME fallback.');
