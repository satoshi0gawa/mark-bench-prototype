import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/color-format-converter.js');

const converter = globalThis.MarkBenchColorFormatConverter;
assert.ok(converter, 'Color Format Converter module should be available');

assert.deepEqual({ ...converter.parseHex('#fff') }, { r: 255, g: 255, b: 255, a: 1 });
assert.deepEqual({ ...converter.parseHex('000000') }, { r: 0, g: 0, b: 0, a: 1 });
assert.deepEqual({ ...converter.parseHex('#33669980') }, { r: 51, g: 102, b: 153, a: 0.502 });
assert.equal(converter.parseHex('#12'), null);
assert.equal(converter.rgbToHex({ r: 51, g: 102, b: 153, a: 0.5 }), '#336699');
assert.equal(converter.rgbToHex({ r: 51, g: 102, b: 153, a: 0.5 }, true), '#33669980');

const redHsl = converter.rgbToHsl({ r: 255, g: 0, b: 0, a: 1 });
assert.deepEqual({ ...redHsl }, { h: 0, s: 100, l: 50, a: 1 });
assert.deepEqual({ ...converter.hslToRgb({ h: 0, s: 100, l: 50, a: 1 }) }, { r: 255, g: 0, b: 0, a: 1 });
assert.deepEqual({ ...converter.rgbToHsv({ r: 255, g: 0, b: 0, a: 1 }) }, { h: 0, s: 100, v: 100, a: 1 });
assert.deepEqual({ ...converter.hsvToRgb({ h: 120, s: 100, v: 100, a: 1 }) }, { r: 0, g: 255, b: 0, a: 1 });

for (const color of [
  { r: 74, g: 111, b: 165, a: 1 },
  { r: 12, g: 230, b: 90, a: 0.4 },
  { r: 245, g: 148, b: 38, a: 0.75 },
]) {
  const hslRoundTrip = converter.hslToRgb(converter.rgbToHsl(color));
  const hsvRoundTrip = converter.hsvToRgb(converter.rgbToHsv(color));
  for (const channel of ['r', 'g', 'b']) {
    assert.ok(Math.abs(hslRoundTrip[channel] - color[channel]) <= 1, `HSL round trip should preserve ${channel}`);
    assert.ok(Math.abs(hsvRoundTrip[channel] - color[channel]) <= 1, `HSV round trip should preserve ${channel}`);
  }
}

assert.equal(converter.parseAlpha('50%'), 0.5);
assert.equal(converter.parseAlpha('0.25'), 0.25);
assert.equal(converter.parseAlpha('101%'), null);
assert.equal(converter.parseAlpha('-0.1'), null);

const rgbResult = converter.convert('rgb', { r: 74, g: 111, b: 165, alpha: '50%' });
assert.equal(rgbResult.valid, true);
assert.equal(rgbResult.outputs.hex, '#4A6FA5');
assert.equal(rgbResult.outputs.hexAlpha, '#4A6FA580');
assert.equal(rgbResult.outputs.rgb, 'rgb(74 111 165 / 0.5)');
assert.match(rgbResult.outputs.hsl, /^hsl\(215\.6 38\.1% 46\.9% \/ 0\.5\)$/u);
assert.match(rgbResult.outputs.hsv, /^hsv\(215\.6 55\.1% 64\.7% \/ 0\.5\)$/u);
assert.equal(rgbResult.outputs.cssVariable, '--color-custom: #4A6FA580;');

const embeddedAlpha = converter.convert('hex', { hex: '#ff000080', alpha: '1' });
assert.equal(embeddedAlpha.color.a, 0.502);
assert.equal(embeddedAlpha.outputs.hexAlpha, '#FF000080');
const invalid = converter.convert('hsl', { h: 0, s: 101, l: 50, alpha: 1 });
assert.equal(invalid.valid, false);
assert.ok(invalid.errors.some((error) => error.type === 'VALUE_RANGE' && error.field === 's'));

assert.equal(Number(converter.getContrastRatio(converter.WHITE, converter.BLACK).toFixed(2)), 21);
const translucentRed = converter.compositeOver({ r: 255, g: 0, b: 0, a: 0.5 }, converter.WHITE);
assert.deepEqual({ ...translucentRed }, { r: 255, g: 128, b: 128, a: 1 });
assert.equal(converter.createResult(converter.DEFAULT_COLOR).metrics.bestText, 'WHITE');
assert.equal(converter.createResult(converter.WHITE).metrics.normalText, 'AA PASS');

let history = [];
for (let index = 0; index < 10; index += 1) history = converter.addToHistory(history, { r: index, g: index, b: index, a: 1 });
assert.equal(history.length, converter.HISTORY_LIMIT);
const deduplicated = converter.addToHistory(history, { r: 9, g: 9, b: 9, a: 1 });
assert.equal(deduplicated.length, converter.HISTORY_LIMIT);
assert.equal(deduplicated[0], '#090909FF');
assert.equal(deduplicated.filter((value) => value === '#090909FF').length, 1);

const page = await readFile(new URL('../tools/color-format-converter.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="color-format-converter"/u);
assert.match(page, /js\/color-format-converter\.js/u);
assert.match(page, /data-tool-workspace/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
assert.match(directory, /AVAILABLE: 16/u);
assert.match(directory, /data-filter="all">ALL <span>16<\/span>/u);
assert.match(directory, /data-filter="css">CSS <span>04<\/span>/u);
assert.match(directory, /data-id="color-format-converter"/u);
assert.match(directory, /href="\.\/color-format-converter\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /16 TOOLS/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /kind: 'color'/u);
assert.match(controller, /renderColorFormatConverter/u);
assert.match(controller, /data-copy-color/u);

console.log('Color Format Converter checks passed.');
