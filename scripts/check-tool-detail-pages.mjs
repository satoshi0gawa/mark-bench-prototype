import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../js/text-case.js');

assert.deepEqual(
  globalThis.CodingNoteTextCase.convertCases('Mark Bench').map(({ label }) => label),
  ['SPACE CASE', 'space case', 'Space Case', 'KEBAB-CASE', 'kebab-case', 'SNAKE_CASE', 'snake_case', 'PascalCase', 'camelCase'],
);

assert.equal(
  globalThis.CodingNoteTextCase.convertCases('test text pattern').find(({ key }) => key === 'space-title')?.value,
  'Test Text Pattern',
);

const toolScript = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
const widthUi = await readFile(new URL('../js/width-converter-ui.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');

assert.match(toolScript, /setText\('\[data-site-breadcrumb-current\]', tool\.title\);/u);
assert.doesNotMatch(toolScript, /tool\.title\.toUpperCase\(\)/u);
assert.match(toolScript, /const RESET_TOAST_MESSAGE = '表示内容をリセットしました。';/u);
assert.doesNotMatch(toolScript, /INPUT RESET|INPUT CLEARED|TABLE CLEARED/u);
assert.match(widthUi, /showToast\('表示内容をリセットしました。'\);/u);
assert.match(styles, /\.markdown-preview-stage iframe \{[^}]*height: 100%;[^}]*align-self: stretch;/u);

const breadcrumbTitles = {
  'text-case-converter.html': 'Text Case Converter',
  'character-counter.html': 'Character Counter',
  'slug-generator.html': 'Slug Generator',
  'json-formatter.html': 'JSON Formatter',
  'html-escape-converter.html': 'HTML Escape Converter',
  'numeric-character-reference-converter.html': 'Numeric Character Reference Converter',
  'px-rem-converter.html': 'PX / REM Converter',
  'text-formatter.html': 'Text Formatter',
  'unicode-inspector.html': 'Unicode Inspector',
  'directory-tree-generator.html': 'Directory Tree Generator',
  'markdown-preview-editor.html': 'Markdown Preview Editor',
  'html-table-builder.html': 'HTML Table Builder',
  'bem-class-builder.html': 'BEM Class Builder',
  'color-format-converter.html': 'Color Format Converter',
  'fluid-scale-generator.html': 'Fluid Scale Generator',
  'width-converter.html': 'Width Converter',
};

for (const [file, title] of Object.entries(breadcrumbTitles)) {
  const page = await readFile(new URL(`../tools/${file}`, import.meta.url), 'utf8');
  const match = page.match(/data-site-breadcrumb-current[^>]*>([^<]*)</u);
  assert.equal(match?.[1], title, `${file} should use its page title in the current breadcrumb`);
}

console.log('Tool detail page adjustment checks passed.');
