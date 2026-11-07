import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/width-converter.js');

const converter = globalThis.MarkBenchWidthConverter;
assert.ok(converter, 'Width Converter module should be available');
assert.equal(converter.MAX_INPUT_LENGTH, 100000);
assert.deepEqual(converter.CATEGORY_ORDER, ['latin', 'digits', 'katakana', 'ascii-symbols', 'japanese-symbols', 'space']);

const empty = converter.convert('');
assert.equal(empty.status, 'empty');
assert.equal(empty.output, '');
assert.equal(empty.replacements, 0);

const toHalf = converter.convert('ＡＢＣ１２３！　カタカナ。「」￥');
assert.equal(toHalf.output, 'ABC123! ｶﾀｶﾅ｡｢｣¥');
assert.equal(toHalf.replacements, 16);
assert.deepEqual(toHalf.categoryCounts, {
  latin: 3,
  digits: 3,
  katakana: 4,
  'ascii-symbols': 1,
  'japanese-symbols': 4,
  space: 1,
});

const toFull = converter.convert('ABC 123! ｶﾞｯﾂ｡｢｣¥', { direction: 'to-full' });
assert.equal(toFull.output, 'ＡＢＣ　１２３！　ガッツ。「」￥');
assert.equal(toFull.categoryCounts.katakana, 3);
assert.equal(toFull.categoryCounts['japanese-symbols'], 4);

const decomposed = converter.convert(`カ\u3099`, { direction: 'to-half', targets: ['katakana'] });
assert.equal(decomposed.output, 'ｶﾞ');
assert.equal(converter.convert('ｶﾞ', { direction: 'to-full', targets: ['katakana'] }).output, 'ガ');

const webRules = converter.convert('ＡB１2！!　ｶﾅ', { mode: 'custom', rules: converter.RULE_PRESETS.web });
assert.equal(webRules.output, 'AB12!! カナ');
assert.equal(converter.convert('Ａ１！　ｶ', { mode: 'custom', rules: converter.RULE_PRESETS.keep }).status, 'unchanged');

const protectedCompatibilityCharacters = converter.convert('①Ⅰ㌀¼あ漢😀');
assert.equal(protectedCompatibilityCharacters.output, '①Ⅰ㌀¼あ漢😀');

const inspection = converter.inspect('AＡ １！\n　※', {
  targets: converter.CHECK_DEFAULTS,
  customSymbols: '※',
});
assert.equal(inspection.status, 'found');
assert.equal(inspection.totalMatches, 5);
assert.deepEqual(inspection.matches.map(({ character, line, column, category }) => ({ character, line, column, category })), [
  { character: 'Ａ', line: 1, column: 2, category: 'latin' },
  { character: '１', line: 1, column: 4, category: 'digits' },
  { character: '！', line: 1, column: 5, category: 'ascii-symbols' },
  { character: '　', line: 2, column: 1, category: 'space' },
  { character: '※', line: 2, column: 2, category: 'custom' },
]);
assert.equal(inspection.matches[0].codePoint, 'U+FF21');
assert.equal(converter.inspect('￥。', { targets: ['japanese-symbols'] }).totalMatches, 2);
assert.equal(converter.inspect('ABC 123').status, 'clear');

const highlightSegments = converter.buildHighlightSegments(inspection.source, inspection.matches);
assert.equal(highlightSegments.filter((segment) => segment.match).length, 5);
assert.match(converter.formatInspectionReport(inspection), /WIDTH CHECK \/ 5 MATCHES/u);
assert.match(converter.formatInspectionReport(inspection), /2:2\tU\+203B\t※\tCUSTOM/u);

const truncated = converter.convert('Ａ'.repeat(converter.MAX_INPUT_LENGTH + 1));
assert.equal(truncated.truncated, true);
assert.equal(truncated.output.length, converter.MAX_INPUT_LENGTH);

const page = await readFile(new URL('../tools/width-converter.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="width-converter"/u);
assert.match(page, /js\/width-converter\.js/u);
assert.match(page, /js\/width-converter-ui\.js/u);
assert.match(page, /全角・半角を変換・検査/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
// Directory counts are checked centrally by check:tools-count.
assert.match(directory, /data-id="width-converter"/u);
assert.match(directory, /href="\.\/width-converter\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /data-tools-count/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /kind: 'width'/u);
assert.match(controller, /renderWidthConverter/u);

const ui = await readFile(new URL('../js/width-converter-ui.js', import.meta.url), 'utf8');
assert.match(ui, /BATCH CONVERT/u);
assert.match(ui, /CUSTOM RULES/u);
assert.match(ui, /WIDTH CHECK/u);
assert.match(ui, /COPY REPORT/u);
assert.match(ui, /USE OUTPUT AS INPUT/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.width-converter__mode-tabs/u);
assert.match(styles, /\.workspace-grid--width-converter/u);
assert.match(styles, /\.width-converter__match-list/u);
assert.match(styles, /\.width-converter__metrics \{[^}]*border-top: 1px solid #374151; border-bottom: 1px solid #374151; \}/u);
assert.match(styles, /\.width-converter__actions \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/u);
assert.match(styles, /\.width-converter__actions \[data-width-copy\] \{ grid-column: 1 \/ -1; \}/u);
assert.match(styles, /@media \(max-width: 640px\)[\s\S]*?\.width-converter__actions \{ grid-template-columns: 1fr; \}[\s\S]*?\.width-converter__actions \[data-width-copy\] \{ grid-column: auto; \}/u);
assert.match(styles, /data-tool-id="width-converter"[^}]*button\[data-width-copy\] \{\s*font-size: 0\.75rem;\s*font-weight: 700;\s*border: 0;/u);
assert.match(styles, /data-tool-id="width-converter"[^}]*\.width-converter__actions :is\(button\[data-width-apply\], button\[data-width-reset\]\) \{\s*color: #e5e7eb;/u);
assert.match(styles, /:is\(button\[data-width-apply\], button\[data-width-reset\]\):not\(:disabled\):hover \{\s*color: var\(--color-primary\);\s*background: #e5e7eb;/u);

console.log('Width Converter checks passed.');
