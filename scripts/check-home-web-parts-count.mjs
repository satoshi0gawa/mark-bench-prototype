import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { countWebPartCards, renderHomeWebPartsCount, writeHomeWebPartsCount, checkHomeWebPartsCount } from './content/render-home-web-parts-count.mjs';

const home = '<main><span data-tools-count>29 TOOLS</span><span class="home-tree__status" data-web-parts-count>12 CATEGORIES</span><span data-build-notes-count>07 NOTES</span></main>';
const card = (id, tag = 'a') => `<${tag} class="parts-card parts-card--link" data-part-category data-id="${id}"></${tag}>`;
const directory = card('heading') + card('button');
const rendered = renderHomeWebPartsCount(home, directory);
assert.equal(rendered, home.replace('12 CATEGORIES', '02 CATEGORIES'));
assert.equal(renderHomeWebPartsCount(rendered, directory + card('new')), home.replace('12 CATEGORIES', '03 CATEGORIES'));
assert.equal(renderHomeWebPartsCount(rendered, card('heading')), home.replace('12 CATEGORIES', '01 CATEGORIES'));
assert.equal(renderHomeWebPartsCount(rendered, ''), home.replace('12 CATEGORIES', '00 CATEGORIES'));
assert.equal(renderHomeWebPartsCount(rendered, directory), rendered);
assert.equal(countWebPartCards(card('ready') + card('planned', 'article') + card('other', 'div')), 3);
assert.equal(countWebPartCards('<a class="parts-card" data-part-category="" hidden></a><a class="parts-card"></a><a data-part-category></a><a class="parts-card-preview" data-part-category></a>'), 1);
const example = card('example');
assert.equal(countWebPartCards(`<!-- ${example} --><script>${JSON.stringify(example)}</script><style>/* ${example} */</style><textarea>${example}</textarea><template>${example}</template>&lt;a class="parts-card" data-part-category&gt;${directory}`), 2);
assert.throws(() => renderHomeWebPartsCount('<main></main>', directory), /exactly one/);
assert.throws(() => renderHomeWebPartsCount(home + home, directory), /exactly one/);
assert.throws(() => renderHomeWebPartsCount(home.replace('data-web-parts-count', 'data-web-parts-count-preview'), directory), /exactly one/);

// The card count is the source of truth; the directory's current summary must agree.
const sourceDirectory = await readFile(new URL('../web-parts/index.html', import.meta.url), 'utf8');
const sourceHome = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sourceCount = countWebPartCards(sourceDirectory);
const categorySummary = sourceDirectory.match(/<span>\s*CATEGORIES:\s*(\d+)\s*<\/span>/u);
assert.ok(categorySummary, 'WEB PARTS directory must include its CATEGORIES summary.');
assert.equal(sourceCount, Number(categorySummary[1]), 'Directory CATEGORIES must match actual cards.');
const label = count => `>${String(count).padStart(2, '0')} CATEGORIES</span>`;
assert.ok(renderHomeWebPartsCount(sourceHome, sourceDirectory).includes(label(sourceCount)));
assert.ok(renderHomeWebPartsCount(sourceHome, sourceDirectory + card('future')).includes(label(sourceCount + 1)));
const reducedDirectory = sourceDirectory.replace(/<a\b[^>]*\bdata-part-category\b[^>]*>[\s\S]*?<\/a>/u, '');
assert.equal(countWebPartCards(reducedDirectory), sourceCount - 1);
assert.ok(renderHomeWebPartsCount(sourceHome, reducedDirectory).includes(label(sourceCount - 1)));

// Exercise the same file generation and stale-output rejection used by the build.
const fixture = await mkdtemp(join(tmpdir(), 'mark-bench-home-parts-count-'));
try {
  await mkdir(join(fixture, 'web-parts'));
  await writeFile(join(fixture, 'index.html'), home);
  await writeFile(join(fixture, 'web-parts/index.html'), directory);
  await writeHomeWebPartsCount(fixture);
  await checkHomeWebPartsCount(fixture);
  await writeFile(join(fixture, 'web-parts/index.html'), directory + card('new'));
  await assert.rejects(checkHomeWebPartsCount(fixture), /does not match/);
  await writeHomeWebPartsCount(fixture);
  await checkHomeWebPartsCount(fixture);
  assert.equal(await readFile(join(fixture, 'index.html'), 'utf8'), home.replace('12 CATEGORIES', '03 CATEGORIES'));
  await writeFile(join(fixture, 'web-parts/index.html'), card('heading'));
  await assert.rejects(checkHomeWebPartsCount(fixture), /does not match/);
  await writeHomeWebPartsCount(fixture);
  await checkHomeWebPartsCount(fixture);
  assert.equal(await readFile(join(fixture, 'index.html'), 'utf8'), home.replace('12 CATEGORIES', '01 CATEGORIES'));
} finally {
  await rm(fixture, { recursive: true, force: true });
}
console.log(`HOME WEB PARTS count checks passed: ${sourceCount} cards match CATEGORIES; additions/removals, inert HTML, markers and stale output verified.`);
