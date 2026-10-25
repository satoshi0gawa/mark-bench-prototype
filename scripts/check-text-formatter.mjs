import assert from 'node:assert/strict';

await import('../js/text-formatter.js');

const formatter = globalThis.MarkBenchTextFormatter;
assert.ok(formatter, 'Text Formatter module should be available');

assert.equal(formatter.normalizeNewlines('A\r\nB\rC'), 'A\nB\nC');
assert.deepEqual(formatter.analyze('A😀\n B'), { lines: 2, characters: 5, nonWhitespaceCharacters: 3 });
assert.deepEqual(formatter.analyze(''), { lines: 0, characters: 0, nonWhitespaceCharacters: 0 });

assert.equal(formatter.apply('A\nB\nA\nC\nB', 'deduplicate-lines').output, 'A\nB\nC');
assert.equal(formatter.apply('A\n \n\t\nB', 'remove-empty-lines').output, 'A\nB');
assert.equal(formatter.apply('A\n\n \n\nB', 'collapse-empty-lines').output, 'A\n\nB');
assert.equal(formatter.apply('  A  \n\tB\t', 'trim-lines').output, 'A\nB');
assert.equal(formatter.apply('項目10\n項目2\n項目1', 'sort-ascending').output, '項目1\n項目2\n項目10');
assert.equal(formatter.apply('項目1\n項目10\n項目2', 'sort-descending').output, '項目10\n項目2\n項目1');
assert.equal(formatter.apply('A\nB\nC', 'reverse-lines').output, 'C\nB\nA');
assert.equal(formatter.apply('A\nB\nC', 'shuffle-lines', { random: () => 0 }).output, 'B\nC\nA');
assert.equal(formatter.apply('A\nB', 'number-lines').output, '1. A\n2. B');
assert.equal(formatter.apply('A   B\t\tC', 'collapse-spaces').output, 'A B C');
assert.equal(formatter.apply('A　B', 'fullwidth-space-to-half').output, 'A B');
assert.equal(formatter.apply(' A\tB　C\nD E ', 'remove-horizontal-space').output, 'ABC\nDE');
assert.equal(formatter.apply('Mark Bench', 'uppercase').output, 'MARK BENCH');
assert.equal(formatter.apply('MARK BENCH', 'lowercase').output, 'mark bench');
assert.equal(formatter.apply('ＡＢＣ１２３　ガパ。', 'fullwidth-to-halfwidth').output, 'ABC123 ｶﾞﾊﾟ｡');
assert.equal(formatter.apply('ABC 123 ｶﾞﾊﾟ｡', 'halfwidth-to-fullwidth').output, 'ＡＢＣ　１２３　ガパ。');
assert.equal(formatter.apply('ｳﾞ ﾞﾟ', 'halfwidth-to-fullwidth').output, 'ヴ　゛゜');

const unchanged = formatter.apply('A\nB', 'deduplicate-lines');
assert.equal(unchanged.status, 'unchanged');
assert.deepEqual(unchanged.before, unchanged.after);
assert.throws(() => formatter.apply('A', 'unknown-operation'), /Unknown formatter operation/u);
assert.equal(formatter.OPERATION_GROUPS.flatMap((group) => group.operations).length, 16);
assert.equal(formatter.MAX_INPUT_LENGTH, 100000);
assert.equal(formatter.MAX_HISTORY, 50);

console.log('Text Formatter checks passed.');
