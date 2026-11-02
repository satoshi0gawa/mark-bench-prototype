import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/regex-tester-replacer.js');

const regexTool = globalThis.MarkBenchRegexTesterReplacer;
assert.ok(regexTool, 'Regex Tester & Replacer module should be available');
assert.equal(regexTool.MAX_INPUT_LENGTH, 100000);
assert.equal(regexTool.MAX_PATTERN_LENGTH, 2000);
assert.equal(regexTool.MAX_MATCHES, 1000);
assert.deepEqual(regexTool.SUPPORTED_FLAGS, ['g', 'i', 'm', 's', 'u']);
assert.equal(regexTool.normalizeFlags('uiggx'), 'giu');
assert.equal(regexTool.formatLiteral('a/b', 'ig'), '/a\\/b/gi');

const empty = regexTool.analyze('', 'g', 'alpha', 'beta');
assert.equal(empty.isEmpty, true);
assert.equal(empty.isValid, false);
assert.equal(empty.output, 'alpha');

const invalid = regexTool.analyze('(', 'g', 'alpha', 'beta');
assert.equal(invalid.isValid, false);
assert.ok(invalid.error);
assert.equal(invalid.output, 'alpha');

const basic = regexTool.analyze('cat', 'gi', 'Cat cat dog', 'fox');
assert.equal(basic.isValid, true);
assert.equal(basic.metrics.matches, 2);
assert.equal(basic.metrics.matchedCharacters, 6);
assert.equal(basic.output, 'fox fox dog');
assert.deepEqual(basic.matches.map(({ index, line, column }) => ({ index, line, column })), [
  { index: 0, line: 1, column: 1 },
  { index: 4, line: 1, column: 5 },
]);

const firstOnly = regexTool.analyze('a', '', 'a a a', 'x');
assert.equal(firstOnly.metrics.matches, 1);
assert.equal(firstOnly.output, 'x a a');

const grouped = regexTool.analyze('(?<name>[A-Z][a-z]+)\\s+(\\d+)', 'g', 'Alpha 12\nBeta 34', '$<name>[$2]');
assert.equal(grouped.metrics.matches, 2);
assert.equal(grouped.metrics.captureGroups, 2);
assert.equal(grouped.matches[1].line, 2);
assert.equal(grouped.matches[1].column, 1);
assert.deepEqual(grouped.matches[0].groups.map(({ value }) => value), ['Alpha', '12']);
assert.deepEqual(grouped.matches[0].namedGroups, [{ name: 'name', value: 'Alpha' }]);
assert.equal(grouped.output, 'Alpha[12]\nBeta[34]');

const zeroWidth = regexTool.analyze('(?=a)', 'g', 'aaa', '-');
assert.equal(zeroWidth.metrics.matches, 3);
assert.ok(zeroWidth.matches.every((match) => match.value === ''));
assert.equal(zeroWidth.output, '-a-a-a');
assert.equal(zeroWidth.segments.filter((segment) => segment.zeroWidth).length, 3);

const multiline = regexTool.analyze('^item', 'gmi', 'ITEM one\nitem two\nnone', 'row');
assert.equal(multiline.metrics.matches, 2);
assert.equal(multiline.output, 'row one\nrow two\nnone');

const many = regexTool.analyze('.', 'g', 'a'.repeat(regexTool.MAX_MATCHES + 5), 'b');
assert.equal(many.metrics.matches, regexTool.MAX_MATCHES);
assert.equal(many.truncated, true);
assert.equal(many.output, 'b'.repeat(regexTool.MAX_MATCHES + 5));

const page = await readFile(new URL('../tools/regex-tester-replacer.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="regex-tester-replacer"/u);
assert.match(page, /js\/regex-tester-replacer\.js/u);
assert.match(page, /privacy-note__body/u);
assert.match(page, /data-tool-steps/u);
assert.match(page, /page-footer/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
assert.match(directory, /TOOLS: 25/u);
assert.match(directory, /data-filter="all">ALL <span>25<\/span>/u);
assert.match(directory, /data-filter="text">TEXT <span>09<\/span>/u);
assert.match(directory, /data-keyword="正規表現"/u);
assert.match(directory, /data-id="regex-tester-replacer"/u);
assert.match(directory, /href="\.\/regex-tester-replacer\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /25 TOOLS/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /'regex-tester-replacer'/u);
assert.match(controller, /kind: 'regex'/u);
assert.match(controller, /renderRegexTesterReplacer/u);

const moduleSource = await readFile(new URL('../js/regex-tester-replacer.js', import.meta.url), 'utf8');
assert.match(moduleSource, /data-regex-pattern/u);
assert.match(moduleSource, /data-copy-regex-output/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.workspace-grid--regex/u);
assert.match(styles, /\.regex-tester__preview/u);
assert.match(styles, /\.regex-tester__match-row/u);

console.log('Regex Tester & Replacer checks passed.');
