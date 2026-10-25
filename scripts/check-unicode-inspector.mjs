import assert from 'node:assert/strict';

await import('../js/unicode-blocks.js');
await import('../js/unicode-inspector.js');

const inspector = globalThis.MarkBenchUnicodeInspector;
assert.ok(inspector, 'Unicode Inspector module should be available');

const basic = inspector.analyze('Aあ😀');
assert.deepEqual(
  {
    codePoints: basic.codePoints,
    graphemes: basic.graphemes,
    utf16Units: basic.utf16Units,
    utf8Bytes: basic.utf8Bytes,
    invisibleCount: basic.invisibleCount,
  },
  { codePoints: 3, graphemes: 3, utf16Units: 4, utf8Bytes: 8, invisibleCount: 0 },
);

assert.deepEqual(
  {
    codePoint: basic.items[0].codePointLabel,
    decimal: basic.items[0].decimal,
    category: basic.items[0].categoryCode,
    block: basic.items[0].block,
    utf8: basic.items[0].utf8,
    utf16: basic.items[0].utf16,
    html: basic.items[0].htmlEscape,
    css: basic.items[0].cssEscape,
    javascript: basic.items[0].javascriptEscape,
  },
  {
    codePoint: 'U+0041',
    decimal: 65,
    category: 'Lu',
    block: 'Basic Latin',
    utf8: '41',
    utf16: '0041',
    html: '&#x41;',
    css: '\\41 ',
    javascript: '\\u0041',
  },
);

assert.equal(basic.items[1].codePointLabel, 'U+3042');
assert.equal(basic.items[1].block, 'Hiragana');
assert.equal(basic.items[1].utf8, 'E3 81 82');
assert.equal(basic.items[2].codePointLabel, 'U+1F600');
assert.equal(basic.items[2].block, 'Emoticons');
assert.equal(basic.items[2].utf16, 'D83D DE00');
assert.equal(basic.items[2].javascriptEscape, '\\u{1F600}');

const combined = inspector.analyze('e\u0301');
assert.equal(combined.codePoints, 2);
assert.equal(combined.graphemes, 1);
assert.equal(combined.invisibleCount, 1);
assert.equal(combined.items[1].flag, 'COMBINING MARK');
assert.equal(combined.items[1].kind, 'combining');

const invisible = inspector.analyze('\u200B\u00A0\u3000\uFEFF');
assert.equal(invisible.invisibleCount, 4);
assert.equal(invisible.suspiciousCount, 4);
assert.deepEqual(invisible.invisibleItems.map((item) => item.flag), ['ZWSP', 'NBSP', 'IDEOGRAPHIC SPACE', 'BOM / ZWNBSP']);

const whitespace = inspector.analyze(' \t\n\r');
assert.equal(whitespace.invisibleCount, 4);
assert.equal(whitespace.suspiciousCount, 0);
assert.deepEqual(whitespace.items.map((item) => [item.line, item.column]), [[1, 1], [1, 2], [1, 3], [2, 1]]);

const family = inspector.analyze('👨‍👩‍👧‍👦');
assert.equal(family.codePoints, 7);
assert.equal(family.graphemes, 1);
assert.equal(family.invisibleCount, 3);
assert.ok(family.items.filter((item) => item.flag === 'ZWJ').length === 3);

const longInput = inspector.analyze('A'.repeat(inspector.MAX_RESULTS + 1));
assert.equal(longInput.codePoints, inspector.MAX_RESULTS + 1);
assert.equal(longInput.items.length, inspector.MAX_RESULTS);
assert.equal(longInput.resultsTruncated, true);

const longInvisible = inspector.analyze(`A${'\u200B'.repeat(inspector.MAX_RESULTS + 1)}`);
assert.equal(longInvisible.invisibleCount, inspector.MAX_RESULTS + 1);
assert.equal(longInvisible.invisibleItems.length, inspector.MAX_RESULTS);
assert.equal(longInvisible.invisibleResultsTruncated, true);

const overLimit = inspector.analyze('A'.repeat(inspector.MAX_INPUT_LENGTH + 1));
assert.equal(overLimit.inputLength, inspector.MAX_INPUT_LENGTH + 1);
assert.equal(overLimit.codePoints, inspector.MAX_INPUT_LENGTH);
assert.equal(overLimit.inputTruncated, true);

const report = inspector.formatReport(invisible);
assert.match(report, /CODE POINTS\t4/u);
assert.match(report, /U\+200B/u);
assert.match(report, /ZERO WIDTH SPACE|ZWSP/u);
assert.match(report, /\\u200B/u);

assert.equal(inspector.MAX_INPUT_LENGTH, 100000);
assert.equal(inspector.MAX_RESULTS, 300);

console.log('Unicode Inspector checks passed.');
