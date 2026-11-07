import assert from 'node:assert/strict';
await import('../js/border-radius-generator.js');
const { generate, defaults, choices, presets, radiusKeys, compress } = globalThis.MarkBenchBorderRadiusGenerator;
const initial = generate();
assert.equal(initial.valid, true);
assert.equal(initial.radius, '24px');
assert.match(initial.css, /^\.radius-shape \{/);
assert.equal(initial.html, '<div class="radius-shape"></div>');
assert.doesNotMatch(initial.css + initial.html, /c-radius/);
assert.match(initial.css, /background-color: #e5e7eb;/);
assert.match(generate({ shapeColor: '#123456' }).css, /background-color: #123456;/);
assert.equal(generate({ stageColor: '#ABCDEF' }).css, initial.css);
assert.deepEqual(compress([1, 1, 1, 1]), [1]);
assert.deepEqual(compress([1, 2, 1, 2]), [1, 2]);
assert.deepEqual(compress([1, 2, 3, 2]), [1, 2, 3]);
assert.deepEqual(compress([1, 2, 3, 4]), [1, 2, 3, 4]);
assert.equal(generate({ mode: 'ellipse', h0: 1, h1: 2, h2: 3, h3: 4, v0: 5, v1: 6, v2: 7, v3: 8 }).radius, '1px 2px 3px 4px / 5px 6px 7px 8px');
assert.equal(generate({ mode: 'ellipse' }).radius, '24px');
assert.equal(generate({ mode: 'uniform', uniform: 0 }).radius, '0');
assert.equal(generate(presets.circle).radius, '50%');
assert.equal(generate(presets.pill).normalized, true);
assert.equal(generate(presets.circle).normalized, false);
assert.equal(generate({ mode: 'uniform', unit: '%', uniform: 100 }).normalized, true);
for (const [key, allowed] of Object.entries(choices)) {
  for (const value of allowed) assert.equal(generate({ [key]: value }).valid, true);
  for (const value of ['', null, {}, 'invalid']) assert.equal(generate({ [key]: value }).valid, false);
}
for (const unit of ['px', '%']) for (const key of ['width', 'height', ...radiusKeys]) {
  const base = { unit, mode: key === 'uniform' ? 'uniform' : 'ellipse' };
  const [min, max] = key === 'width' || key === 'height' ? [80, 480] : [0, unit === '%' ? 100 : 500];
  for (const value of [min, max, String(min), String(max)]) assert.equal(generate({ ...base, [key]: value }).valid, true, `${key}:${value}`);
  for (const value of ['', ' ', null, NaN, Infinity, min - 1, max + 1, min + 0.5, 'bad']) {
    const result = generate({ ...base, [key]: value });
    assert.equal(result.valid, false, `${key}:${value}`);
    assert.equal(result.css, '');
    assert.equal(result.html, '');
  }
}
for (const key of ['stageColor', 'shapeColor']) {
  for (const value of ['#ABCDEF', '#000000', '#123456']) assert.equal(generate({ [key]: value }).valid, true);
  for (const value of ['red', '#abc', '#12345z', '<script>', null]) assert.equal(generate({ [key]: value }).valid, false);
}
assert.equal(generate({ mode: 'uniform', h0: '', v0: 'bad' }).valid, true);
for (const preset of Object.values(presets)) assert.equal(generate(preset).valid, true);
const source = { ...defaults };
for (let i = 0; i < 100; i++) assert.deepEqual(generate(source), initial);
assert.deepEqual(source, defaults);
console.log('Border Radius Generator: modes, shorthand, ellipse, units, limits, colors and repeated generation passed.');
