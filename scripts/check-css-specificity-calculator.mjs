import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/css-specificity-calculator.js');

const calculator = globalThis.MarkBenchCssSpecificityCalculator;
assert.ok(calculator, 'CSS Specificity Calculator module should be available');
assert.equal(calculator.MAX_INPUT_LENGTH, 100000);
assert.equal(calculator.MAX_SELECTORS, 200);
assert.equal(calculator.formatSpecificity([1, 2, 3]), '1-2-3');
assert.equal(calculator.compareSpecificity([1, 0, 0], [0, 99, 99]) > 0, true);
assert.deepEqual(calculator.maxSpecificity([[0, 5, 0], [1, 0, 0], [0, 9, 9]]), [1, 0, 0]);

assert.deepEqual(calculator.splitTopLevel('.a, :is(.b, #c)\n[data-value="a,b"]'), ['.a', ':is(.b, #c)', '[data-value="a,b"]']);

const cases = new Map([
  ['*', '0-0-0'],
  ['h1', '0-0-1'],
  ['.card__title:hover', '0-2-0'],
  ['#main .card[data-state="active"] > h2::before', '1-2-2'],
  [':where(.layout, #app) .button', '0-1-0'],
  [':is(.button, #submit) > span', '1-0-1'],
  ['a:not(.link, #primary)', '1-0-1'],
  ['form:has(input:invalid) .message', '0-2-2'],
  ['ul li:nth-child(2n of .item, #featured)', '1-1-2'],
  [':host(.active)', '0-2-0'],
  ['::slotted(.item#featured)', '1-1-1'],
  ['svg|a::before', '0-0-2'],
  ['[data-value="#fake.id"]', '0-1-0'],
  ['#escaped\\:id.class\\.name', '1-1-0'],
]);
for (const [selector, score] of cases) {
  const result = calculator.analyzeSelector(selector);
  assert.equal(result.valid, true, `${selector} should be valid`);
  assert.equal(result.score, score, `${selector} should have specificity ${score}`);
}

const nesting = calculator.analyzeSelector('& .child');
assert.equal(nesting.score, '0-1-0');
assert.ok(nesting.warnings.some((warning) => warning.includes('ネストセレクター')));

const invalidAttribute = calculator.analyzeSelector('.card[data-state="open"');
assert.equal(invalidAttribute.valid, false);
assert.ok(invalidAttribute.errors.some((error) => error.includes(']')));
const invalidPseudo = calculator.analyzeSelector('.card:not(.active');
assert.equal(invalidPseudo.valid, false);
assert.ok(invalidPseudo.errors.some((error) => error.includes('閉じ括弧')));

const analysis = calculator.analyzeInput('.card\n#main .item\n:where(#app) button');
assert.equal(analysis.metrics.selectors, 3);
assert.equal(analysis.metrics.valid, 3);
assert.equal(analysis.metrics.errors, 0);
assert.deepEqual(analysis.highest, [1, 1, 0]);
assert.match(calculator.formatReport(analysis), /^0-1-0\t\.card/mu);
assert.match(calculator.formatReport(analysis), /^1-1-0\t#main \.item/mu);

const many = calculator.analyzeInput(Array.from({ length: calculator.MAX_SELECTORS + 5 }, (_, index) => `.item-${index}`).join('\n'));
assert.equal(many.results.length, calculator.MAX_SELECTORS);
assert.equal(many.truncated, true);

const page = await readFile(new URL('../tools/css-specificity-calculator.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="css-specificity-calculator"/u);
assert.match(page, /js\/css-specificity-calculator\.js/u);
assert.match(page, /privacy-note__body/u);
assert.match(page, /data-tool-steps/u);
assert.match(page, /page-footer/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
assert.match(directory, /TOOLS: 25/u);
assert.match(directory, /data-filter="all">ALL <span>25<\/span>/u);
assert.match(directory, /data-filter="css">CSS <span>06<\/span>/u);
assert.match(directory, /data-keyword="詳細度"/u);
assert.match(directory, /data-id="css-specificity-calculator"/u);
assert.match(directory, /href="\.\/css-specificity-calculator\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /25 TOOLS/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /'css-specificity-calculator'/u);
assert.match(controller, /kind: 'specificity'/u);
assert.match(controller, /renderCssSpecificityCalculator/u);

const moduleSource = await readFile(new URL('../js/css-specificity-calculator.js', import.meta.url), 'utf8');
assert.match(moduleSource, /data-specificity-results/u);
assert.match(moduleSource, /data-copy-specificity/u);
assert.match(moduleSource, /MODERN PSEUDO-CLASS RULES/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.workspace-grid--specificity/u);
assert.match(styles, /\.specificity-calculator__score/u);
assert.match(styles, /\.specificity-calculator__reference/u);

console.log('CSS Specificity Calculator checks passed.');
