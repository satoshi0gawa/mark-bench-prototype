import assert from 'node:assert/strict';

await import('../js/slug-generator.js');

const generator = globalThis.MarkBenchSlugGenerator;
assert.ok(generator, 'Slug Generator module should be available');

assert.deepEqual(generator.generate(''), {
  slug: '',
  encoded: '',
  length: 0,
  inputLength: 0,
  truncated: false,
});

assert.equal(generator.generate('Hello, World!').slug, 'hello-world');
assert.equal(generator.generate('Café & Tools').slug, 'cafe-tools');
assert.equal(generator.generate('ＭＡＲＫ　ＢＥＮＣＨ').slug, 'mark-bench');
assert.equal(generator.generate('Web制作 ツール').slug, 'web制作-ツール');
assert.equal(generator.generate('Mark Bench', { separator: '_' }).slug, 'mark_bench');
assert.equal(generator.generate('Mark Bench', { lowercase: false }).slug, 'Mark-Bench');
assert.equal(generator.generate('🎉 !!!').slug, '');
assert.equal(generator.generate('日本語').encoded, '%E6%97%A5%E6%9C%AC%E8%AA%9E');

const longResult = generator.generate('word '.repeat(50));
assert.equal(longResult.truncated, true);
assert.ok(longResult.length <= generator.MAX_SLUG_LENGTH);
assert.equal(generator.MAX_INPUT_LENGTH, 200);

console.log('Slug Generator checks passed.');
