import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/code-block-generator.js');

const generator = globalThis.MarkBenchCodeBlockGenerator;
assert.ok(generator, 'Code Block Generator module should be available');
assert.deepEqual(Object.keys(generator.LANGUAGES), ['html', 'css', 'scss', 'javascript', 'php']);

const html = generator.generate('<section class="card">\n  <h2>A & B</h2>\n</section>', {
  language: 'html',
  title: 'card.html',
});
assert.equal(html.status, 'ready');
assert.equal(html.lineCount, 3);
assert.match(html.markup, /^<figure class="code-block">/u);
assert.match(html.markup, /<figcaption class="code-block__caption">card\.html<\/figcaption>/u);
assert.match(html.markup, /<pre class="code-block__pre" tabindex="0">/u);
assert.match(html.markup, /<code class="language-html">&lt;section class="card"&gt;/u);
assert.match(html.markup, /A &amp; B/u);
assert.doesNotMatch(html.markup, /<section class="card">/u);

const javascript = generator.generate('const ready = true;', { language: 'javascript', title: '<script> & "test"' });
assert.match(javascript.markup, /class="language-javascript"/u);
assert.match(javascript.markup, /&lt;script&gt; &amp; &quot;test&quot;/u);

const minimal = generator.generate('.card {}', {
  language: 'css',
  includeCaption: false,
  includeLanguageClass: false,
  focusable: false,
});
assert.equal(minimal.markup, '<pre class="code-block"><code>.card {}</code></pre>');

const fallback = generator.generate('<?php echo "ok"; ?>', { language: 'unknown' });
assert.equal(fallback.language, 'html');
assert.match(fallback.markup, /language-html/u);

const normalized = generator.generate('a\r\nb\rc', { language: 'scss' });
assert.equal(normalized.source, 'a\nb\nc');
assert.equal(normalized.lineCount, 3);

const empty = generator.generate('', { language: 'php' });
assert.equal(empty.status, 'empty');
assert.equal(empty.markup, '');
assert.equal(empty.lineCount, 0);

const truncated = generator.generate('x'.repeat(generator.MAX_INPUT_LENGTH + 10));
assert.equal(truncated.inputLength, generator.MAX_INPUT_LENGTH);
assert.equal(truncated.truncated, true);

const page = await readFile(new URL('../tools/code-block-generator.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../js/code-block-generator.js', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="code-block-generator"/u);
assert.match(page, /<script src="\.\.\/js\/code-block-generator\.js" defer><\/script>/u);
assert.match(page, /class="privacy-note__body"/u);
assert.match(page, /<footer class="page-footer"/u);
assert.doesNotMatch(page, /<section class="code-block-patterns"/u);
assert.match(page, /<div class="code-block-pattern-modal" id="code-block-pattern-modal" role="dialog" aria-modal="true" aria-labelledby="code-block-patterns-title" hidden data-code-block-pattern-modal>/u);
assert.match(page, /<h2 id="code-block-patterns-title">選択パターン別の出力例<\/h2>/u);
assert.equal((page.match(/class="code-block-pattern"/gu) || []).length, 4);
assert.equal((page.match(/class="code-block-patterns__row"/gu) || []).length, 2);
assert.match(page, /PATTERN 01[\s\S]*?標準のコード例/u);
assert.match(page, /PATTERN 02[\s\S]*?ファイル名・用途付き/u);
assert.match(page, /PATTERN 03[\s\S]*?キャプションなし/u);
assert.match(page, /PATTERN 04[\s\S]*?最小構成/u);
assert.match(script, /class="code-block-generator__patterns-button"[^>]*aria-haspopup="dialog"[^>]*aria-controls="code-block-pattern-modal"/u);
assert.match(script, /patternsModal\.hidden = false;/u);
assert.match(script, /patternsModal\.hidden = true;/u);
assert.match(script, /patternsModal\.classList\.add\('is-open'\);/u);
assert.match(script, /patternsModal\.classList\.add\('is-closing'\);/u);
assert.match(script, /reduceMotion \? 0 : modalDuration/u);
assert.match(script, /event\.key === 'Escape'/u);
assert.match(script, /patternsButton\?\.focus\(\{ preventScroll: true \}\);/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.workspace-grid--code-block/u);
assert.match(styles, /\.code-block-generator__preview pre \{[^}]*overflow: auto;/u);
assert.match(styles, /@media \(max-width: 640px\) \{[\s\S]*?\.code-block-generator__metrics \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/u);
assert.match(styles, /\.code-block-patterns__grid \{[^}]*grid-auto-rows: 1fr;/u);
assert.match(styles, /\.code-block-patterns__row \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/u);
assert.match(styles, /@supports \(grid-template-rows: subgrid\) \{[\s\S]*?\.code-block-pattern \{ grid-row: 1 \/ -1; grid-template-rows: subgrid; \}/u);
assert.match(styles, /\.code-block-pattern pre \{[^}]*overflow: auto;/u);
assert.match(styles, /\.code-block-pattern-modal \{[^}]*position: fixed;[^}]*inset: 0 var\(--site-rail-width\);[^}]*place-items: center;/u);
assert.match(styles, /\.code-block-pattern-modal__panel \{[^}]*max-height: calc\(100svh - 2rem\);[^}]*overflow: auto;/u);
assert.match(styles, /\.code-block-pattern-modal__panel \{[^}]*opacity: 0;[^}]*transform: translateY\(1\.5rem\);[^}]*transition: opacity 180ms ease, transform 180ms ease;/u);
assert.match(styles, /\.code-block-pattern-modal\.is-open \.code-block-pattern-modal__panel \{ opacity: 1; transform: translateY\(0\); \}/u);
assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.code-block-pattern-modal__panel \{ transition: none; \}/u);
assert.match(styles, /\.code-block-generator__patterns-button \{[^}]*transition: color var\(--transition-fast\), background-color var\(--transition-fast\), border-color var\(--transition-fast\);/u);
assert.match(styles, /\.code-block-generator__patterns-button > span:last-child \{ transform: none; transition: none; \}/u);

console.log('Code Block Generator checks passed.');
