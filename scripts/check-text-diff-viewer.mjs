import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/text-diff-viewer.js');

const diffViewer = globalThis.MarkBenchTextDiffViewer;
assert.ok(diffViewer, 'Text Diff Viewer module should be available');
assert.equal(diffViewer.MAX_INPUT_LENGTH, 100000);
assert.equal(diffViewer.MAX_RENDER_ROWS, 1000);
assert.equal(diffViewer.normalizeNewlines('a\r\nb\rc'), 'a\nb\nc');
assert.deepEqual(diffViewer.splitLines('a\nb\n'), ['a', 'b', '']);

const identical = diffViewer.compare('alpha\nbeta', 'alpha\nbeta');
assert.equal(identical.isEqual, true);
assert.equal(identical.metrics.unchanged, 2);
assert.equal(identical.metrics.differenceCount, 0);

const changed = diffViewer.compare('alpha\nbeta\ngamma', 'alpha\ndelta\ngamma');
assert.equal(changed.isEqual, false);
assert.deepEqual(
  {
    additions: changed.metrics.additions,
    deletions: changed.metrics.deletions,
    changes: changed.metrics.changes,
    unchanged: changed.metrics.unchanged,
  },
  { additions: 0, deletions: 0, changes: 1, unchanged: 2 },
);
assert.deepEqual(changed.rows.map(({ type, oldLine, newLine }) => ({ type, oldLine, newLine })), [
  { type: 'equal', oldLine: 1, newLine: 1 },
  { type: 'delete', oldLine: 2, newLine: null },
  { type: 'insert', oldLine: null, newLine: 2 },
  { type: 'equal', oldLine: 3, newLine: 3 },
]);
assert.match(changed.plainText, /^--- ORIGINAL\n\+\+\+ MODIFIED/mu);
assert.match(changed.plainText, /^- beta$/mu);
assert.match(changed.plainText, /^\+ delta$/mu);

const inserted = diffViewer.compare('alpha\ngamma', 'alpha\nbeta\ngamma');
assert.equal(inserted.metrics.additions, 1);
assert.equal(inserted.rows[1].newLine, 2);

const deleted = diffViewer.compare('alpha\nbeta\ngamma', 'alpha\ngamma');
assert.equal(deleted.metrics.deletions, 1);
assert.equal(deleted.rows[1].oldLine, 2);

const wordDiff = diffViewer.compare('The quick brown fox', 'The quick red fox', { mode: 'word' });
assert.equal(wordDiff.metrics.changes, 1);
assert.ok(wordDiff.rows[0].fragments.some((fragment) => fragment.type === 'change' && fragment.value === 'brown'));
assert.ok(wordDiff.rows[1].fragments.some((fragment) => fragment.type === 'change' && fragment.value === 'red'));

const whitespaceIgnored = diffViewer.compare('alpha   beta', ' alpha beta ', { ignoreWhitespace: true });
assert.equal(whitespaceIgnored.isEqual, true);

const truncated = diffViewer.compare('a'.repeat(diffViewer.MAX_INPUT_LENGTH + 1), 'a');
assert.equal(truncated.truncated, true);
assert.equal(truncated.metrics.originalCharacters, diffViewer.MAX_INPUT_LENGTH);

const variants = ['', 'a', 'b', 'a\nb', 'b\na', 'a\nb\nc'];
for (const original of variants) {
  for (const modified of variants) {
    const result = diffViewer.compare(original, modified);
    const rebuiltOriginal = result.rows.filter((row) => row.type !== 'insert').map((row) => row.value);
    const rebuiltModified = result.rows.filter((row) => row.type !== 'delete').map((row) => row.value);
    assert.deepEqual(rebuiltOriginal, diffViewer.splitLines(original), `original reconstruction failed: ${original} -> ${modified}`);
    assert.deepEqual(rebuiltModified, diffViewer.splitLines(modified), `modified reconstruction failed: ${original} -> ${modified}`);
  }
}

const page = await readFile(new URL('../tools/text-diff-viewer.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="text-diff-viewer"/u);
assert.match(page, /js\/text-diff-viewer\.js/u);
assert.match(page, /data-tool-workspace/u);
assert.match(page, /class="page-footer"/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
// Directory counts are checked centrally by check:tools-count.
assert.match(directory, /data-keyword="差分"/u);
assert.match(directory, /data-id="text-diff-viewer"/u);
assert.match(directory, /href="\.\/text-diff-viewer\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /data-tools-count/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /kind: 'diff'/u);
assert.match(controller, /renderTextDiffViewer/u);
assert.match(controller, /data-diff-ignore-whitespace/u);
assert.match(controller, /data-copy-diff/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.workspace-grid--text-diff/u);
assert.match(styles, /\.diff-viewer__row--delete/u);
assert.match(styles, /\.diff-viewer__fragment--change/u);

console.log('Text Diff Viewer checks passed.');
