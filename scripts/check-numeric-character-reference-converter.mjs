import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/character-reference-core.js');
await import('../js/numeric-character-reference-converter.js');

const core = globalThis.MarkBenchCharacterReferenceCore;
const converter = globalThis.MarkBenchNumericCharacterReferenceConverter;
assert.ok(core, 'Character Reference Core module should be available');
assert.ok(converter, 'Numeric Character Reference Converter module should be available');

assert.deepEqual(converter.convert(''), {
  status: 'empty',
  mode: 'encode',
  format: 'decimal',
  scope: 'non-ascii',
  preserveWhitespace: true,
  output: '',
  replacements: 0,
  decimalCount: 0,
  hexCount: 0,
  warningCount: 0,
  warnings: [],
  inputLength: 0,
  inputCodePoints: 0,
  outputLength: 0,
  outputCodePoints: 0,
});

const decimal = converter.convert('MARK 日本語 😀', 'encode');
assert.equal(decimal.output, 'MARK &#26085;&#26412;&#35486; &#128512;');
assert.equal(decimal.replacements, 4);
assert.equal(decimal.decimalCount, 4);
assert.equal(decimal.hexCount, 0);
assert.equal(decimal.inputCodePoints, 10);

const hexadecimal = converter.convert('あ😀', 'encode', { format: 'hex' });
assert.equal(hexadecimal.output, '&#x3042;&#x1F600;');
assert.equal(hexadecimal.hexCount, 2);

const allCharacters = converter.convert('A B', 'encode', { scope: 'all', preserveWhitespace: true });
assert.equal(allCharacters.output, '&#65; &#66;');
assert.equal(converter.convert('A B', 'encode', { scope: 'all', preserveWhitespace: false }).output, '&#65;&#32;&#66;');

const decoded = converter.convert('&#26085;&#x672C; &#x1F600;', 'decode');
assert.equal(decoded.output, '日本 😀');
assert.equal(decoded.decimalCount, 1);
assert.equal(decoded.hexCount, 2);
assert.equal(decoded.replacements, 3);

const invalid = converter.convert('&#0; &#xD800; &#x110000; &#wat;', 'decode');
assert.equal(invalid.output, '&#0; &#xD800; &#x110000; &#wat;');
assert.equal(invalid.warningCount, 4);
assert.deepEqual(invalid.warnings.map((warning) => warning.type), ['NULL', 'SURROGATE', 'OUT_OF_RANGE', 'MALFORMED']);

const control = converter.convert('&#1;', 'decode');
assert.equal(control.output, '\u0001');
assert.equal(control.warningCount, 1);
assert.equal(control.warnings[0].type, 'CONTROL');

const roundTripSource = 'MARK BENCH / 日本語 / 😀';
const roundTripEncoded = converter.convert(roundTripSource, 'encode', { format: 'hex', scope: 'all' });
const roundTripDecoded = converter.convert(roundTripEncoded.output, 'decode');
assert.equal(roundTripDecoded.output, roundTripSource);
assert.equal(converter.MAX_INPUT_LENGTH, 100000);

const page = await readFile(new URL('../tools/numeric-character-reference-converter.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="numeric-character-reference-converter"/u);
assert.match(page, /js\/character-reference-core\.js/u);
assert.match(page, /js\/numeric-character-reference-converter\.js/u);
assert.match(page, /data-tool-workspace/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
assert.match(directory, /AVAILABLE: 16/u);
assert.match(directory, /data-filter="all">ALL <span>16<\/span>/u);
assert.match(directory, /data-filter="code">CODE <span>05<\/span>/u);
assert.match(directory, /data-id="numeric-character-reference-converter"/u);
assert.match(directory, /href="\.\/numeric-character-reference-converter\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /16 TOOLS/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /kind: 'numeric-reference'/u);
assert.match(controller, /renderNumericCharacterReferenceConverter/u);
assert.match(controller, /data-copy-numeric/u);

console.log('Numeric Character Reference Converter checks passed.');
