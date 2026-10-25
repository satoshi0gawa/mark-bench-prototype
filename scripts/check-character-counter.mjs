import assert from 'node:assert/strict';

await import('../js/character-counter.js');

const counter = globalThis.MarkBenchCharacterCounter;
assert.ok(counter, 'Character Counter module should be available');

assert.deepEqual(counter.analyze(''), {
  characters: 0,
  charactersNoWhitespace: 0,
  words: 0,
  lines: 0,
  bytes: 0,
  paragraphs: 0,
  inputLength: 0,
});

const latin = counter.analyze('MARK BENCH');
assert.equal(latin.characters, 10);
assert.equal(latin.charactersNoWhitespace, 9);
assert.equal(latin.words, 2);
assert.equal(latin.lines, 1);
assert.equal(latin.bytes, 10);
assert.equal(latin.paragraphs, 1);

const japanese = counter.analyze('こんにちは');
assert.equal(japanese.characters, 5);
assert.equal(japanese.bytes, 15);

const multiline = counter.analyze('one two\n\nthree');
assert.equal(multiline.words, 3);
assert.equal(multiline.lines, 3);
assert.equal(multiline.paragraphs, 2);

if (typeof Intl.Segmenter === 'function') {
  assert.equal(counter.analyze('👨‍👩‍👧‍👦').characters, 1);
}

assert.match(counter.formatSummary(latin), /CHARACTERS: 10/);
assert.equal(counter.MAX_INPUT_LENGTH, 100000);

console.log('Character Counter checks passed.');
