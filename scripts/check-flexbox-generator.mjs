import assert from 'node:assert/strict';
await import('../js/flexbox-generator.js');
const { generate, defaults, ranges, choices, presets } = globalThis.MarkBenchFlexboxGenerator;
const standard = generate();
assert.equal(standard.valid, true);
assert.equal((standard.html.match(/class="c-flex-layout__item"/g) || []).length, 6);
assert.match(standard.css, /flex: 0 1 120px/);
for (const [key, [min, max]] of Object.entries(ranges)) {
  for (const value of [min, max, String(min), String(max)]) assert.equal(generate({ [key]: value }).valid, true, `${key}: ${value}`);
  for (const value of ['', ' ', NaN, Infinity, min - 1, max + 1, min + 0.5, 'invalid', null]) {
    const result = generate({ [key]: value });
    assert.equal(result.valid, false, `${key}: ${value}`);
    assert.equal(result.css, '');
    assert.equal(result.html, '');
  }
}
for (const [key, values] of Object.entries(choices)) {
  for (const value of values) assert.equal(generate({ [key]: value }).valid, true);
  assert.equal(generate({ [key]: 'invalid' }).valid, false);
}
for (const preset of Object.values(presets)) assert.equal(generate(preset).valid, true);
assert.match(generate({ direction: 'column', grow: 2, shrink: 0, basis: 48 }).css, /flex: 2 0 48px/);
assert.equal((generate({ count: 24 }).html.match(/class="c-flex-layout__item"/g) || []).length, 24);
const original = { ...defaults };
generate(original);
assert.deepEqual(original, defaults);
for (let i = 0; i < 100; i += 1) assert.deepEqual(generate(defaults), standard);
console.log('Flexbox Generator: presets, output, invalid values, limits and repeated generation passed.');
