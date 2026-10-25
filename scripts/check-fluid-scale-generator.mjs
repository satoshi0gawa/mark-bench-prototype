import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/fluid-scale-generator.js');

const generator = globalThis.MarkBenchFluidScaleGenerator;
assert.ok(generator, 'Fluid Scale Generator module should be available');

const defaults = generator.cloneDefaultConfig();
const result = generator.generate(defaults);
assert.equal(result.valid, true);
assert.equal(result.mode, 'system');
assert.equal(result.tokens.length, 19);
assert.equal(result.metrics.fluidCount, 19);
assert.equal(result.metrics.fixedCount, 0);
assert.equal(result.metrics.viewportRange, '360–1440px');

const fontBase = result.tokens.find((token) => token.name === '--font-base');
assert.ok(fontBase);
assert.equal(fontBase.minValue, '1rem');
assert.equal(fontBase.maxValue, '1.125rem');
assert.equal(fontBase.currentValue, '1.063rem');
assert.equal(fontBase.cssValue, 'clamp(1rem, 0.958rem + 0.185vi, 1.125rem)');

const spaceFour = result.tokens.find((token) => token.name === '--space-4');
assert.ok(spaceFour);
assert.equal(spaceFour.minPx, 16);
assert.equal(spaceFour.maxPx, 20);
assert.equal(spaceFour.currentPx, 18);

assert.match(result.css, /^:root \{/u);
assert.match(result.css, /--font-base: clamp\(/u);
assert.match(result.css, /--space-16: clamp\(/u);
assert.match(result.css, /--size-control: clamp\(/u);
assert.match(result.usage, /font-size: var\(--font-lg\)/u);
assert.match(result.usage, /gap: var\(--space-4\)/u);

const single = generator.generate({
  ...defaults,
  mode: 'single',
  currentWidth: 900,
  single: { name: '--fluid-heading', min: 16, max: 48, preview: 'font' },
});
assert.equal(single.valid, true);
assert.equal(single.tokens.length, 1);
assert.equal(single.tokens[0].currentPx, 32);
assert.equal(single.tokens[0].cssValue, 'clamp(1rem, 0.333rem + 2.963vi, 3rem)');

const fixed = generator.generate({
  ...defaults,
  mode: 'single',
  single: { name: '--fixed-space', min: 24, max: 24, preview: 'spacing' },
});
assert.equal(fixed.valid, true);
assert.equal(fixed.tokens[0].kind, 'fixed');
assert.equal(fixed.tokens[0].cssValue, '1.5rem');
assert.ok(fixed.warnings.some((warning) => warning.type === 'FIXED_VALUE'));

const cqiPx = generator.generate({ ...defaults, unit: 'px', basis: 'cqi' });
assert.equal(cqiPx.valid, true);
assert.match(cqiPx.tokens[2].cssValue, /cqi/u);
assert.ok(cqiPx.warnings.some((warning) => warning.type === 'PX_OUTPUT'));
assert.ok(cqiPx.warnings.some((warning) => warning.type === 'CQI_SCOPE'));

const invalidViewport = generator.generate({ ...defaults, viewportMin: 1000, viewportMax: 1050 });
assert.equal(invalidViewport.valid, false);
assert.ok(invalidViewport.errors.some((error) => error.type === 'VIEWPORT_GAP'));
assert.equal(invalidViewport.tokens.length, 0);

const invalidToken = generator.generate({
  ...defaults,
  sizes: [{ name: 'size-control', min: 40, max: 48 }],
});
assert.equal(invalidToken.valid, false);
assert.ok(invalidToken.errors.some((error) => error.type === 'TOKEN_NAME'));

const duplicateToken = generator.generate({
  ...defaults,
  sizes: [{ name: '--font-base', min: 40, max: 48 }],
});
assert.equal(duplicateToken.valid, false);
assert.ok(duplicateToken.errors.some((error) => error.type === 'DUPLICATE_TOKEN'));

const page = await readFile(new URL('../tools/fluid-scale-generator.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="fluid-scale-generator"/u);
assert.match(page, /js\/fluid-scale-generator\.js/u);
assert.match(page, /js\/fluid-scale-generator-ui\.js/u);
assert.match(page, /data-tool-workspace/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
assert.match(directory, /AVAILABLE: 16/u);
assert.match(directory, /data-filter="all">ALL <span>16<\/span>/u);
assert.match(directory, /data-filter="css">CSS <span>04<\/span>/u);
assert.match(directory, /data-id="fluid-scale-generator"/u);
assert.match(directory, /href="\.\/fluid-scale-generator\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /16 TOOLS/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /kind: 'fluid-scale'/u);
assert.match(controller, /renderFluidScaleGenerator/u);
assert.doesNotMatch(controller, /css-clamp-calculator/u);

const ui = await readFile(new URL('../js/fluid-scale-generator-ui.js', import.meta.url), 'utf8');
assert.match(ui, /SCALE SYSTEM/u);
assert.match(ui, /SINGLE VALUE/u);
assert.match(ui, /DOWNLOAD CSS/u);
assert.match(ui, /ダウンロードが完了しました。/u);
assert.match(ui, /fluid-scale__preview-pane/u);
assert.match(ui, /fluid-scale__token-pane/u);
assert.match(ui, /fluid-scale__source-pane/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.fluid-scale__mode-tabs/u);
assert.match(styles, /\.workspace-grid--fluid-scale/u);
assert.match(styles, /\.fluid-scale__token-table/u);
assert.match(styles, /\.fluid-scale__data-pane/u);

console.log('Fluid Scale Generator checks passed.');
