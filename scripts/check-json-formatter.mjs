import assert from 'node:assert/strict';

await import('../js/json-formatter.js');

const formatter = globalThis.MarkBenchJsonFormatter;
assert.ok(formatter, 'JSON Formatter module should be available');

assert.deepEqual(formatter.format(''), {
  status: 'empty',
  output: '',
  error: null,
  inputLength: 0,
  outputLength: 0,
  summary: 'OUTPUT EMPTY',
});

const source = '{"project":"MARK BENCH","ready":true,"tags":["JSON","format"]}';
const pretty = formatter.format(source, { mode: 'pretty', indent: 2 });
assert.equal(pretty.status, 'valid');
assert.match(pretty.output, /\n  "project": "MARK BENCH"/u);
assert.equal(pretty.summary, 'OBJECT / 3 KEYS');
assert.equal(pretty.outputLength, pretty.output.length);

const fourSpaces = formatter.format('{"nested":{"value":1}}', { indent: 4 });
assert.match(fourSpaces.output, /\n    "nested"/u);

const tabs = formatter.format('{"nested":{"value":1}}', { indent: 'tab' });
assert.match(tabs.output, /\n\t"nested"/u);

const minified = formatter.format('{\n  "value": 1\n}', { mode: 'minify', indent: 4 });
assert.equal(minified.output, '{"value":1}');

assert.equal(formatter.format('[1,2,3]').summary, 'ARRAY / 3 ITEMS');
assert.equal(formatter.format('null').summary, 'NULL');

const invalid = formatter.format('{\n  "value": 1,\n}');
assert.equal(invalid.status, 'invalid');
assert.equal(invalid.output, '');
assert.ok(invalid.error.message);
assert.ok(invalid.error.line === null || invalid.error.line >= 1);
assert.ok(invalid.error.column === null || invalid.error.column >= 1);
assert.equal(formatter.MAX_INPUT_LENGTH, 100000);

console.log('JSON Formatter checks passed.');
