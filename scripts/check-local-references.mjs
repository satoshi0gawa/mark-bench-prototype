import assert from 'node:assert/strict';

import { collectLocalReferences } from './local-references.mjs';

const html = `
  <link rel="stylesheet" href="./css/page.css?v=1" />
  <a href="../index.html#main">HOME</a>
  <img src="./images/example.png" alt="" />
  <pre><code>&lt;script src="./assets/js/articles.js" defer&gt;&lt;/script&gt;</code></pre>
  <p><code>href="./sample.html"</code> is an example.</p>
  <a href="https://example.com/">External</a>
`;

assert.deepEqual(collectLocalReferences(html), [
  './css/page.css',
  '../index.html',
  './images/example.png',
]);

console.log('Local reference parsing validation passed.');
