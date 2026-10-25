import assert from 'node:assert/strict';

await import('../js/markdown-preview-editor.js');

const editor = globalThis.MarkBenchMarkdownPreviewEditor;
assert.ok(editor, 'Markdown Preview Editor module should be available');

const sample = editor.analyze(editor.SAMPLE);
assert.equal(sample.warningCount, 0);
assert.equal(sample.h1Count, 1);
assert.equal(sample.headingCount, 3);
assert.equal(sample.linkCount, 1);
assert.match(sample.html, /<h1 id="制作メモ">制作メモ<\/h1>/u);
assert.match(sample.html, /<ul class="markdown-task-list">/u);
assert.match(sample.html, /<pre data-language="html"><code>/u);
assert.match(sample.html, /<table>/u);
assert.match(sample.html, /<blockquote>/u);

const inline = editor.analyze('# Inline\n\n**Bold** *Italic* ~~Delete~~ and `code`.');
assert.match(inline.html, /<strong>Bold<\/strong>/u);
assert.match(inline.html, /<em>Italic<\/em>/u);
assert.match(inline.html, /<del>Delete<\/del>/u);
assert.match(inline.html, /<code>code<\/code>/u);

const nestedList = editor.analyze('# List\n\n- Parent\n  1. First\n  2. Second\n- Next');
assert.match(nestedList.html, /<ul><li>Parent<ol><li>First<\/li><li>Second<\/li><\/ol><\/li><li>Next<\/li><\/ul>/u);

const headings = editor.analyze('## Start\n\n#### Jump');
assert.ok(headings.warnings.some((warning) => warning.type === 'MISSING_H1'));
assert.ok(headings.warnings.some((warning) => warning.type === 'HEADING_JUMP' && warning.line === 3));

const duplicateH1 = editor.analyze('# One\n\n# Two');
assert.ok(duplicateH1.warnings.some((warning) => warning.type === 'MULTIPLE_H1'));

const unsafe = editor.analyze('# Safety\n\n<script>alert(1)</script>\n\n[Bad](javascript:evil)\n\n![](data:text/html,bad)');
assert.doesNotMatch(unsafe.html, /<script>/u);
assert.doesNotMatch(unsafe.html, /javascript:/u);
assert.doesNotMatch(unsafe.html, /data:text\/html/u);
assert.match(unsafe.html, /&lt;script&gt;/u);
assert.ok(unsafe.warnings.some((warning) => warning.type === 'RAW_HTML_ESCAPED'));
assert.ok(unsafe.warnings.some((warning) => warning.type === 'UNSAFE_LINK_URL'));
assert.ok(unsafe.warnings.some((warning) => warning.type === 'UNSAFE_IMAGE_URL'));
assert.ok(unsafe.warnings.some((warning) => warning.type === 'MISSING_ALT'));

const remoteOff = editor.analyze('# Image\n\n![Preview](https://example.com/image.png)');
assert.match(remoteOff.html, /<img src="https:\/\/example.com\/image.png"/u);
const remoteOn = editor.analyze('# Image\n\n![Preview](https://example.com/image.png)', { allowRemoteImages: true });
assert.match(remoteOn.html, /<img src="https:\/\/example.com\/image.png"/u);

const unclosedFence = editor.analyze('# Code\n\n```js\nconst ready = true;');
assert.ok(unclosedFence.warnings.some((warning) => warning.type === 'UNCLOSED_FENCE'));

const footnote = editor.analyze('# Note\n\nReference[^1]\n\n[^1]: Note');
assert.ok(footnote.warnings.some((warning) => warning.type === 'UNSUPPORTED_FOOTNOTE'));

const limited = editor.analyze('a'.repeat(editor.MAX_INPUT_LENGTH + 1));
assert.equal(limited.inputTruncated, true);
assert.equal(limited.value.length, editor.MAX_INPUT_LENGTH);
assert.ok(limited.warnings.some((warning) => warning.type === 'INPUT_LIMIT'));

assert.equal(editor.isSafeUrl('https://example.com'), true);
assert.equal(editor.isSafeUrl('../about.html'), true);
assert.equal(editor.isSafeUrl('mailto:hello@example.com'), true);
assert.equal(editor.isSafeUrl('javascript:alert(1)'), false);
assert.equal(editor.isSafeUrl('mailto:hello@example.com', 'image'), false);
assert.equal(editor.slugifyHeading('Markdown Preview Editor'), 'markdown-preview-editor');

const preview = editor.createPreviewDocument('<h1>Safe</h1>');
assert.match(preview, /Content-Security-Policy/u);
assert.match(preview, /img-src 'none'/u);
assert.match(preview, /<main><h1>Safe<\/h1><\/main>/u);
const previewWithImages = editor.createPreviewDocument('<p>Image</p>', { allowRemoteImages: true });
assert.match(previewWithImages, /img-src https: http:/u);

assert.equal(editor.isCompositionKey({ isComposing: true }), true);
assert.equal(editor.isCompositionKey({ keyCode: 229 }), true);
assert.equal(editor.isCompositionKey({ key: 'Enter' }, false), false);
assert.equal(editor.MAX_HISTORY, 100);

console.log('Markdown Preview Editor checks passed.');
