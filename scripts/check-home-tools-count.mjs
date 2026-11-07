import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sanitizeHtml from 'sanitize-html';
import { countToolCards, renderHomeToolsCount, writeHomeToolsCount, checkHomeToolsCount } from './content/render-home-tools-count.mjs';

const home = '<main><span class="home-tree__status" data-tools-count>25 TOOLS</span><p>Other content</p></main>';
const card = id => `<article class="tool-card" data-tool-card data-id="${id}"></article>`;
const directory = card('one') + card('two');
const rendered = renderHomeToolsCount(home, directory);
assert.equal(rendered, home.replace('25 TOOLS', '02 TOOLS'));
assert.equal(renderHomeToolsCount(rendered, directory + card('three')), home.replace('25 TOOLS', '03 TOOLS'));
assert.equal(renderHomeToolsCount(rendered, card('one')), home.replace('25 TOOLS', '01 TOOLS'));
assert.equal(renderHomeToolsCount(rendered, ''), home.replace('25 TOOLS', '00 TOOLS'));
assert.equal(renderHomeToolsCount(rendered, directory), rendered);
assert.equal(countToolCards(`<!-- ${card('comment')} --><script>${JSON.stringify(card('script'))}</script>${directory}`), 2);
assert.equal(countToolCards('<article data-tool-card="" hidden></article><article></article>'), 1);
assert.throws(() => renderHomeToolsCount('<main></main>', directory), /exactly one/);
assert.throws(() => renderHomeToolsCount(home + home, directory), /exactly one/);

// Keep directory summary checks in one place, derived from actual cards.
const sourceDirectory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
const sourceHome = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sourceCount = countToolCards(sourceDirectory);
assert.ok(sourceDirectory.includes(`TOOLS: ${String(sourceCount).padStart(2, '0')}`));
assert.ok(sourceDirectory.includes(`data-filter="all">ALL <span>${String(sourceCount).padStart(2, '0')}</span>`));
const categories = new Map();
sanitizeHtml(sourceDirectory, {
  allowedTags: ['article'], allowedAttributes: {},
  transformTags: {
    article: (tagName, attributes) => {
      if (Object.hasOwn(attributes, 'data-tool-card')) {
        const category = attributes['data-category'];
        categories.set(category, (categories.get(category) || 0) + 1);
      }
      return { tagName, attribs: {} };
    },
  },
});
for (const [category, count] of categories) {
  assert.ok(sourceDirectory.includes(`data-filter="${category}">${category.toUpperCase()} <span>${String(count).padStart(2, '0')}</span>`));
}
assert.ok(renderHomeToolsCount(sourceHome, sourceDirectory).includes(`>${String(sourceCount).padStart(2, '0')} TOOLS</span>`));

const fixture = await mkdtemp(join(tmpdir(), 'mark-bench-home-count-'));
try {
  await mkdir(join(fixture, 'tools'));
  await writeFile(join(fixture, 'index.html'), home);
  await writeFile(join(fixture, 'tools/index.html'), directory);
  await writeHomeToolsCount(fixture);
  await checkHomeToolsCount(fixture);
  await writeFile(join(fixture, 'tools/index.html'), directory + card('three'));
  await assert.rejects(checkHomeToolsCount(fixture), /does not match/);
  await writeHomeToolsCount(fixture);
  await checkHomeToolsCount(fixture);
  assert.equal(await readFile(join(fixture, 'index.html'), 'utf8'), home.replace('25 TOOLS', '03 TOOLS'));
} finally {
  await rm(fixture, { recursive: true, force: true });
}
console.log('HOME tools count checks passed: card additions, removals, empty list, inert HTML and marker validation.');
