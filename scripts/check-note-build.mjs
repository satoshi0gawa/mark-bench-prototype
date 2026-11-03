import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import fixture from '../content/blog.fixture.mjs';
import { normalizeBlogEntries } from './content/blog-model.mjs';

const count = (value, pattern) => [...value.matchAll(pattern)].length;

export const checkNoteBuild = async (output, sourceEntries) => {
  const entries = sourceEntries || normalizeBlogEntries(fixture);
  const archive = await readFile(join(output, 'build-notes/note-to-self/index.html'), 'utf8');
  const codingArchive = await readFile(join(output, 'build-notes/coding-note/index.html'), 'utf8');
  const buildNotes = await readFile(join(output, 'build-notes/index.html'), 'utf8');
  const home = await readFile(join(output, 'index.html'), 'utf8');
  const codingNoteCount = count(codingArchive, /<a\b[^>]*class="[^"]*\bcoding-note-card\b[^"]*"[^>]*>/g);

  assert.equal(count(archive, /<a class="note-row"/g), entries.length);
  assert.equal(count(buildNotes, /<a class="note-row"/g), Math.min(entries.length, 5));
  assert.ok(!archive.includes('test-notetoself'));
  assert.ok(!buildNotes.includes('test-notetoself'));
  assert.ok(buildNotes.includes('coding-note-blogdemo.html'), 'CODING NOTE overview must include the latest published note');
  assert.ok(buildNotes.includes(`CODING NOTE: ${String(codingNoteCount).padStart(2, '0')}`));
  assert.ok(buildNotes.includes(`CODING_NOTE_ARCHIVE</span><span>${String(codingNoteCount).padStart(2, '0')} NOTES`));
  assert.ok(
    new RegExp(`data-build-notes-count\\s*>${String(codingNoteCount + entries.length).padStart(2, '0')} NOTES<\\/span\\s*>`).test(home),
    'HOME must show the total number of visible BUILD NOTES',
  );

  for (const article of entries) {
    const file = join(output, article.outputPath);
    await access(file);
    const html = await readFile(file, 'utf8');
    assert.equal(count(html, /<h1\b/g), 1, `${article.slug}: h1 count`);
    assert.equal(count(html, /class="article-section reveal"/g), article.sections.length);
    assert.equal(count(html, /<div class="article-toc__references">/g), article.references.length ? 1 : 0);
    assert.equal(
      count(html, /class="article-callout article-callout--cta"/g),
      article.relatedTool || article.relatedWebPart ? 1 : 0,
    );
    if (article.relatedWebPart) {
      assert.ok(
        html.includes(`href="../../web-parts/${article.relatedWebPart.partId}.html"`),
        `${article.slug}: missing related WEB PARTS link`,
      );
    }

    for (const section of article.sections) {
      assert.ok(html.includes(`href="#${section.id}"`), `${article.slug}: missing TOC link ${section.id}`);
      assert.ok(html.includes(`id="${section.id}"`), `${article.slug}: missing section ${section.id}`);
    }

    const tableCount = count(article.sections.map((section) => section.body).join(''), /<table\b/g);
    assert.equal(count(html, /class="article-table-wrap"/g), tableCount, `${article.slug}: table wrappers`);
  }

  console.log(`NOTE to SELF build validation passed: ${entries.length} generated articles.`);
};

if (process.argv[1]?.endsWith('check-note-build.mjs')) {
  await checkNoteBuild(join(process.cwd(), process.argv[2] || 'dist'));
}
