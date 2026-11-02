import assert from 'node:assert/strict';

import fixture from '../content/blog.fixture.mjs';
import { normalizeBlogEntries } from './content/blog-model.mjs';
import { sanitizeRichText } from './content/sanitize-rich-text.mjs';

const allowed = sanitizeRichText(`
  <h3>見出し</h3>
  <p><strong>本文</strong> <code class="language-js unknown">const value = 1;</code></p>
  <table><caption>仕様</caption><tbody><tr><th scope="row" colspan="2">項目</th></tr></tbody></table>
  <a href="https://example.com/" target="_blank" rel="opener">参照</a>
  <img src="https://images.microcms-assets.io/example.png" alt="例" width="640" />
`);

assert.match(allowed, /<h3>見出し<\/h3>/);
assert.match(allowed, /class="language-js"/);
assert.doesNotMatch(allowed, /unknown/);
assert.match(allowed, /scope="row" colspan="2"/);
assert.match(allowed, /target="_blank" rel="noopener noreferrer"/);
assert.match(allowed, /loading="lazy" decoding="async"/);

const stripped = sanitizeRichText(`
  <script>alert(1)</script>
  <iframe src="https://example.com"></iframe>
  <p style="color:red" onclick="alert(1)">安全な本文</p>
  <a href="javascript:alert(1)" target="evil">危険なリンク</a>
  <img src="http://example.com/image.png" onerror="alert(1)">
`);

assert.doesNotMatch(stripped, /<(?:script|iframe)\b/i);
assert.doesNotMatch(stripped, /\s(?:style|onclick|onerror)=/i);
assert.doesNotMatch(stripped, /javascript:|src="http:/i);
assert.doesNotMatch(stripped, /target=|rel=/i);
assert.doesNotMatch(stripped, /<img\b/i);
assert.match(stripped, /安全な本文/);

const invalidFixture = structuredClone(fixture);
invalidFixture[0].sections[0].body = '<p onclick="alert(1)">本文</p>';
assert.throws(() => normalizeBlogEntries(invalidFixture), /dangerous attribute or URL/);

console.log('Rich-text sanitizer validation passed: allowlist, URL schemes, and dangerous markup checked.');
