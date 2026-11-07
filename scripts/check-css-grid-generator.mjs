import assert from 'node:assert/strict';
await import('../js/css-grid-generator.js');
const { generate, defaults, choices, ranges, presets, inactive } = globalThis.MarkBenchCssGridGenerator;
const standard = generate();
assert.equal(standard.valid, true);
assert.match(standard.css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(standard.css, /grid-template-rows: repeat\(2, minmax\(80px, auto\)\)/);
assert.equal((standard.html.match(/class="grid-layout__item"/g) || []).length, 6);
assert.doesNotMatch(standard.css + standard.html, /c-grid/);
for (const [key, values] of Object.entries(choices)) {
  for (const value of values) assert.equal(generate({ [key]: value }).valid, true, `${key}: ${value}`);
  for (const value of [null, {}, '', '<script>']) assert.equal(generate({ [key]: value }).valid, false);
}
for (const [key, [min, max]] of Object.entries(ranges)) {
  const base = { ...defaults, columns: 12, rows: 12, columnMode: key === 'minWidth' ? 'auto-fit' : 'fixed' };
  assert.equal(inactive(base, key), false);
  for (const value of [min, max, String(min), String(max)]) assert.equal(generate({ ...base, [key]: value }).valid, true, `${key}: ${value}`);
  for (const value of ['', ' ', NaN, Infinity, null, 'invalid', min - 1, max + 1, min + 0.5]) {
    const result = generate({ ...base, [key]: value });
    assert.equal(result.valid, false, `${key}: ${value}`);
    assert.equal(result.css, '');
    assert.equal(result.html, '');
  }
}
for (const [name, preset] of Object.entries(presets)) assert.equal(generate(preset).valid, true, name);
for (const mode of ['auto-fit', 'auto-fill']) {
  const result = generate({ columnMode: mode, columns: '', columnSpan: 12 });
  assert.equal(result.valid, true);
  assert.equal(result.state.columnSpan, 1);
  assert.match(result.css, new RegExp(`repeat\\(${mode}, minmax\\(min\\(160px, 100%\\), 1fr\\)\\)`));
}
assert.equal(generate({ columns: 2, columnSpan: 3 }).valid, false);
assert.equal(generate({ rows: 1, rowSpan: 2 }).valid, false);
assert.match(generate(presets.dashboard).css, /grid-column: span 2;\n  grid-row: span 2;/);
assert.equal((generate({ count: 48 }).html.match(/class="grid-layout__item"/g) || []).length, 48);
const input = { ...defaults };
for (let i = 0; i < 100; i++) assert.deepEqual(generate(input), standard);
assert.deepEqual(input, defaults);
console.log('CSS Grid Generator: tracks, auto-repeat, spans, presets, validation and repeat operations passed.');
