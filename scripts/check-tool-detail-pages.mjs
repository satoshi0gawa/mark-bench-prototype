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
const componentStyles = await readFile(new URL('../css/components.css', import.meta.url), 'utf8');
const toolsDirectory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
const partsDirectory = await readFile(new URL('../web-parts/index.html', import.meta.url), 'utf8');

assert.match(toolScript, /setText\('\[data-site-breadcrumb-current\]', tool\.title\);/u);
assert.doesNotMatch(toolScript, /tool\.title\.toUpperCase\(\)/u);
assert.equal((toolScript.match(/updated: '2026\.11\.01',/gu) || []).length, 26);
assert.match(toolScript, /setText\('\[data-tool-updated\]', tool\.updated\);/u);
assert.doesNotMatch(toolScript, /version: '0\.[12]\.0'/u);
assert.match(toolScript, /const RESET_TOAST_MESSAGE = '表示をリセットしました。';/u);
assert.match(toolScript, /const CLEAR_TOAST_MESSAGE = '表示をクリアしました。';/u);
assert.match(toolScript, /const DOWNLOAD_TOAST_MESSAGE = 'ダウンロードを実行しました。';/u);
assert.match(toolScript, /const DOWNLOAD_ACTION_SELECTOR = '\[data-download-markdown\], \[data-image-download\], \[data-fluid-download\], \[data-base64-download\]';/u);
assert.match(toolScript, /const isStateToast = message === RESET_TOAST_MESSAGE \|\| message === CLEAR_TOAST_MESSAGE;/u);
assert.match(toolScript, /const isActionToast = tone === 'copy' \|\| tone === 'download';/u);
assert.match(toolScript, /if \(!toast \|\| \(!isStateToast && !isActionToast && !isSettingsReset\)\) return;/u);
assert.match(toolScript, /const TOAST_FADE_DURATION = 200;/u);
assert.match(toolScript, /toast\.classList\.add\('is-visible'\);/u);
assert.match(toolScript, /toast\.classList\.remove\('is-visible'\);/u);
assert.match(toolScript, /showToast\(copied \? 'コピーが完了しました。' : 'コピーに失敗しました。', 'copy'\);/u);
assert.match(toolScript, /showToast\(DOWNLOAD_TOAST_MESSAGE, 'download'\);/u);
assert.match(toolScript, /\^RESET\(\?:\\s\|\$\)\/u\.test/u);
assert.match(toolScript, /\^CLEAR\(\?:\\s\|\$\)\/u\.test/u);
assert.match(toolScript, /if \(isResetAction\) showToast\(RESET_TOAST_MESSAGE\);/u);
assert.match(toolScript, /else if \(isClearAction\) showToast\(CLEAR_TOAST_MESSAGE\);/u);
assert.doesNotMatch(toolScript, /INPUT RESET|INPUT CLEARED|TABLE CLEARED/u);
assert.doesNotMatch(widthUi, /showToast\('表示内容をリセットしました。'\);/u);
assert.match(styles, /\.markdown-preview-stage iframe \{[^}]*height: 100%;[^}]*align-self: stretch;/u);
assert.match(styles, /\.privacy-note__body \{ grid-column: 1 \/ -1; line-height: 1\.7; \}/u);
assert.match(styles, /\.tool-documentation ol \{[^}]*padding-inline-start: 2rem;/u);
assert.match(styles, /\.tool-documentation li \{[^}]*padding-left: 0;/u);
assert.match(styles, /body\[data-page="tools"\]\[data-tool-id="text-case-converter"\] \.tool-workspace button\[data-copy-value\] \{\s*border: 0;\s*\}/u);
const borderlessCopyBlock = styles.match(/body\[data-page="tools"\]\[data-tool-id="markdown-preview-editor"\][\s\S]*?body\[data-page="tools"\]\[data-tool-id="slug-generator"\][^{]*\{\s*border: 0;\s*\}/u)?.[0] ?? '';
for (const borderlessCopySelector of [
  'data-tool-id="markdown-preview-editor"',
  'data-tool-id="bem-class-builder"',
  'data-tool-id="fluid-scale-generator"',
  'data-tool-id="html-table-builder"',
  'data-tool-id="color-format-converter"',
  'data-tool-id="unicode-inspector"',
  'data-tool-id="slug-generator"',
]) {
  assert.ok(borderlessCopyBlock.includes(borderlessCopySelector), `${borderlessCopySelector} should have a borderless copy action override`);
}
assert.match(styles, /button\.unicode-copy-button,\s*body\[data-page="tools"\]\[data-tool-id="slug-generator"\][^{]*\{\s*border: 0;/u);
assert.match(styles, /Shared copy and download action treatment for every tool detail workspace\./u);
assert.match(styles, /body\[data-page="tools"\]\[data-tool-id\] \.tool-workspace :is\(button, a\):is\([\s\S]*?\) \{\s*color: var\(--color-accent-yellow\);\s*background: transparent;\s*border: 1px solid var\(--color-accent-yellow\);/u);
assert.match(styles, /:is\(button, a\):is\([\s\S]*?\):not\(:disabled\):hover \{\s*color: var\(--color-primary\);\s*background: var\(--color-accent-yellow\);\s*border-color: var\(--color-accent-yellow\);/u);
for (const actionAttribute of [
  'data-copy-value',
  'data-base64-copy',
  'data-fluid-copy',
  'data-property-copy',
  'data-responsive-image-copy',
  'data-width-copy',
  'data-download-markdown',
  'data-image-download',
  'data-fluid-download',
  'data-base64-download',
]) {
  assert.match(styles, new RegExp(`\\[${actionAttribute}\\]`, 'u'), `${actionAttribute} should use the shared tool action treatment`);
}
assert.match(styles, /data-tool-id="markdown-preview-editor"[^}]*button\[data-download-markdown\] \{\s*--markdown-download-gutter: 0\.5rem;[\s\S]*?min-height: 4rem;[\s\S]*?margin: var\(--markdown-download-gutter\);[\s\S]*?font-size: 0\.58rem;[\s\S]*?background: var\(--color-primary\);[\s\S]*?box-shadow: 0 0 0 var\(--markdown-download-gutter\) var\(--color-primary\);/u);
assert.match(styles, /button\[data-download-markdown\]:not\(:disabled\):hover \{\s*color: var\(--color-primary\);\s*background: var\(--color-accent-yellow\);/u);
assert.match(componentStyles, /body\[data-page="tools"\]\[data-tool-id\] \.site-breadcrumb-logo__current/u);
assert.match(componentStyles, /\.toast:is\(\[data-toast-tone="copy"\], \[data-toast-tone="download"\]\) \{\s*color: var\(--color-accent-yellow\);\s*font-weight: 700;/u);
assert.match(componentStyles, /body\[data-page="tools"\]\[data-tool-id\] \.toast \{\s*text-align: center;\s*\}/u);
assert.match(componentStyles, /\.toast\.is-visible \{\s*opacity: 1;\s*visibility: visible;\s*transform: translateY\(0\);/u);
assert.match(componentStyles, /opacity var\(--transition-fast\),\s*transform var\(--transition-fast\),\s*visibility 0s linear 180ms;/u);
assert.match(componentStyles, /--breadcrumb-font-size: 0\.875rem;/u);
assert.match(componentStyles, /body\[data-page="blog"\]:has\(\.article-layout\) \.site-breadcrumb-logo__current/u);
assert.doesNotMatch(componentStyles, /body\[data-page="(?:tools|blog)"\][^{]*\.site-breadcrumb-logo[^{}]*\{[^}]*font-size:/u);
assert.match(toolsDirectory, /<div class="page-heading__main reveal">\s*<h1>TOOLS<\/h1>\s*<p class="visually-hidden">[^<]+<\/p>/u);
assert.match(toolsDirectory, /<div class="page-heading__meta reveal"><span>CATEGORIES: 04<\/span><span>TOOLS: 27<\/span><span>STATUS: 27 READY \/ 00 PLANNED<\/span><\/div>/u);
assert.match(toolsDirectory, /<footer class="page-footer" aria-label="ページナビゲーション">[\s\S]*?BACK TO HOME[\s\S]*?PAGE TOP[\s\S]*?<\/footer>/u);
assert.match(partsDirectory, /<div class="page-heading__main reveal">\s*<h1>WEB PARTS<\/h1>\s*<p class="visually-hidden">[^<]+<\/p>/u);
assert.doesNotMatch(toolsDirectory, /tool-card__category|TOOL_\d{3}/u);
assert.doesNotMatch(componentStyles, /\.tool-card__category/u);
assert.match(componentStyles, /\.tool-card__body h3 \{[\s\S]*?font-size: clamp\(1\.5rem, 2\.2vw, 2rem\);\s*line-height: 1\.25;/u);
assert.match(componentStyles, /\.tool-card__body > p:last-child \{[\s\S]*?font-size: 0\.78rem;/u);
assert.match(componentStyles, /@supports \(grid-template-rows: subgrid\) \{[\s\S]*?\.tool-grid--directory \.tool-card \{[\s\S]*?grid-row: span 5;[\s\S]*?grid-template-rows: subgrid;[\s\S]*?\.tool-grid--directory \.tool-card__body \{[\s\S]*?grid-row: 2 \/ span 3;[\s\S]*?grid-template-rows: subgrid;/u);
assert.match(componentStyles, /\.tool-grid--directory \.tool-card__symbol \{\s*align-self: start;\s*margin-bottom: clamp\(2rem, 2\.5vw, 2\.75rem\);/u);
assert.match(componentStyles, /\.tool-grid--directory \.tool-card__body h3 \{\s*align-self: end;\s*margin-block: 0 0\.5rem;/u);
assert.match(styles, /\.tool-grid--directory \.tool-card:nth-child\(2n of :not\(\[hidden\]\)\) \{\s*border-right: 0;/u);
assert.doesNotMatch(styles, /\.tool-grid--directory \.tool-card:nth-child\(2n\) \{/u);

const expectedToolIndex = { text: 'TEXT_TOOLS', code: 'CODE_TOOLS', css: 'CSS_TOOLS', image: 'IMAGE_TOOLS' };
const directoryCards = [...toolsDirectory.matchAll(/<article class="tool-card"[^>]*data-category="([^"]+)"[^>]*>\s*<div class="tool-card__meta"><span>([^<]+)<\/span>/gu)];
assert.equal(directoryCards.length, 27);
directoryCards.forEach(([, category, index]) => {
  assert.equal(index, expectedToolIndex[category], `${category} cards should expose the detail page section index`);
});

const expectedDirectoryOrder = [
  'text-case-converter',
  'directory-tree-generator',
  'markdown-preview-editor',
  'code-block-generator',
  'bem-class-builder',
  'image-format-converter-resizer',
  'text-diff-viewer',
  'regex-tester-replacer',
  'width-converter',
  'text-formatter',
  'character-counter',
  'unicode-inspector',
  'slug-generator',
  'url-query-string-builder',
  'meta-tags-ogp-builder',
  'base64-data-url-converter',
  'html-table-builder',
  'html-escape-converter',
  'numeric-character-reference-converter',
  'json-formatter',
  'flexbox-generator',
  'fluid-scale-generator',
  'css-specificity-calculator',
  'css-custom-property-builder',
  'color-format-converter',
  'px-rem-converter',
  'responsive-image-markup-builder',
];
const orderedDirectoryCards = [...toolsDirectory.matchAll(/data-tool-card data-id="([^"]+)" data-category="([^"]+)"/gu)]
  .map(([, id, category]) => ({ id, category }));
assert.deepEqual(orderedDirectoryCards.map(({ id }) => id), expectedDirectoryOrder);
assert.deepEqual([...new Set(orderedDirectoryCards.slice(6).map(({ category }) => category))], ['text', 'code', 'css', 'image']);

const breadcrumbTitles = {
  'flexbox-generator.html': 'Flexbox Generator',
  'text-case-converter.html': 'Text Case Converter',
  'text-diff-viewer.html': 'Text Diff Viewer',
  'regex-tester-replacer.html': 'Regex Tester &amp; Replacer',
  'url-query-string-builder.html': 'URL / Query String Builder',
  'meta-tags-ogp-builder.html': 'Meta Tags &amp; OGP Builder',
  'css-specificity-calculator.html': 'CSS Specificity Calculator',
  'image-format-converter-resizer.html': 'Image Format Converter &amp; Resizer',
  'responsive-image-markup-builder.html': 'Responsive Image Markup Builder',
  'base64-data-url-converter.html': 'Base64 / Data URL Converter',
  'css-custom-property-builder.html': 'CSS Custom Property Builder',
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
  'code-block-generator.html': 'Code Block Generator',
  'bem-class-builder.html': 'BEM Class Builder',
  'color-format-converter.html': 'Color Format Converter',
  'fluid-scale-generator.html': 'Fluid Scale Generator',
  'width-converter.html': 'Width Converter',
};

for (const [file, title] of Object.entries(breadcrumbTitles)) {
  const page = await readFile(new URL(`../tools/${file}`, import.meta.url), 'utf8');
  const match = page.match(/data-site-breadcrumb-current[^>]*>([^<]*)</u);
  assert.equal(match?.[1], title, `${file} should use its page title in the current breadcrumb`);
  assert.match(page, /class="privacy-note__body"/u, `${file} should wrap the privacy note body for the mobile layout`);
  assert.ok(page.includes(`<dt>LAST UPDATED</dt><dd data-tool-updated>${file === 'flexbox-generator.html' ? '2026.11.07' : '2026.11.01'}</dd>`), `${file} should expose the current update date`);
  assert.match(page, /data-tool-version>0\.[12]\.1<\/dd>/u, `${file} should expose the incremented patch version`);
  assert.doesNotMatch(page, /<dt>UPDATED<\/dt>/u, `${file} should use the LAST UPDATED label`);
}

console.log('Tool detail page adjustment checks passed.');
