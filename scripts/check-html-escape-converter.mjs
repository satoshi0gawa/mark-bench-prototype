import assert from 'node:assert/strict';

await import('../js/character-reference-core.js');
await import('../js/html-escape-converter.js');

const converter = globalThis.MarkBenchHtmlEscapeConverter;
assert.ok(converter, 'HTML Escape Converter module should be available');

assert.deepEqual(converter.convert(''), {
  status: 'empty',
  mode: 'escape',
  context: 'attribute',
  encodeNbsp: true,
  output: '',
  replacements: 0,
  warningCount: 0,
  warnings: [],
  inputLength: 0,
  outputLength: 0,
});

const html = '<button title="Save & Go">It\'s ready</button>';
const escaped = converter.convert(html, 'escape');
assert.equal(escaped.output, '&lt;button title=&quot;Save &amp; Go&quot;&gt;It&#39;s ready&lt;/button&gt;');
assert.equal(escaped.replacements, 8);
assert.equal(escaped.outputLength, escaped.output.length);

const unescaped = converter.convert(escaped.output, 'unescape');
assert.equal(unescaped.output, html);
assert.equal(unescaped.replacements, 8);

assert.equal(converter.convert('&#65; &#x1F600;', 'unescape').output, 'A 😀');
assert.equal(converter.convert('&#65; &#x1F600;', 'unescape').replacements, 2);
assert.equal(converter.convert('&amp;lt;', 'unescape').output, '&lt;');
assert.equal(converter.convert('&unknown;', 'unescape').output, '&unknown;');
assert.equal(converter.convert('&#0; &#xD800;', 'unescape').output, '&#0; &#xD800;');
assert.equal(converter.convert('&#0; &#xD800;', 'unescape').warningCount, 2);
assert.equal(converter.convert('MARK BENCH', 'escape').replacements, 0);
assert.equal(converter.convert('A\u00a0B', 'escape').output, 'A&nbsp;B');
assert.equal(converter.convert('A\u00a0B', 'escape', { encodeNbsp: false }).output, 'A\u00a0B');
assert.equal(converter.convert('"MARK" & <BENCH>', 'escape', { context: 'text' }).output, '"MARK" &amp; &lt;BENCH&gt;');
assert.equal(converter.MAX_INPUT_LENGTH, 100000);

console.log('HTML Escape Converter checks passed.');
