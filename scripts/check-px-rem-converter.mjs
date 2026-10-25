import assert from 'node:assert/strict';

await import('../js/px-rem-converter.js');

const converter = globalThis.MarkBenchPxRemConverter;
assert.ok(converter, 'PX / REM Converter module should be available');

assert.equal(converter.convert('').status, 'empty');
assert.equal(converter.convert('32').output, '2rem');
assert.equal(converter.convert('32').formula, '32px ÷ 16px = 2rem');
assert.equal(converter.convert('1.5', { direction: 'rem-to-px' }).output, '24px');
assert.equal(converter.convert('25', { rootSize: 10 }).output, '2.5rem');
assert.equal(converter.convert('10', { rootSize: 3, precision: 2 }).output, '3.33rem');
assert.equal(converter.convert('10', { rootSize: 3, precision: 4 }).output, '3.3333rem');
assert.equal(converter.convert('10', { rootSize: 3 }).output, '3.333333rem');
assert.equal(converter.convert('-8').output, '-0.5rem');
assert.equal(converter.convert('not-a-number').status, 'invalid-value');
assert.equal(converter.convert('10', { rootSize: 0 }).status, 'invalid-root');
assert.equal(converter.convert('10', { rootSize: 257 }).status, 'invalid-root');
assert.equal(converter.convert('1000001').status, 'invalid-value');
assert.equal(converter.DEFAULT_ROOT_SIZE, 16);
assert.equal(converter.MIN_ROOT_SIZE, 1);
assert.equal(converter.MAX_ROOT_SIZE, 256);
assert.equal(converter.MAX_ABSOLUTE_VALUE, 1000000);

console.log('PX / REM Converter checks passed.');
