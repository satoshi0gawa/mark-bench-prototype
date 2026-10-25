import assert from 'node:assert/strict';

await import('../js/html-table-builder.js');

const builder = globalThis.MarkBenchHtmlTableBuilder;
assert.ok(builder, 'HTML Table Builder module should be available');

const initial = builder.createState();
assert.equal(initial.rows, 4);
assert.equal(initial.cols, 4);
assert.equal(initial.cells.length, 4);
assert.equal(initial.cells[0].length, 4);

const fractional = builder.createState(2.9, 3.8);
assert.equal(fractional.rows, 2);
assert.equal(fractional.cols, 3);
assert.equal(builder.createState(999, 999).rows, builder.MAX_ROWS);
assert.equal(builder.createState(999, 999).cols, builder.MAX_COLS);
assert.equal(builder.createState(-2, -3).rows, builder.MIN_ROWS);
assert.equal(builder.createState(-2, -3).cols, builder.MIN_COLS);

let state = builder.createState(2, 2, [
  ['項目', '内容'],
  ['HTML', '<script>alert("x")</script>'],
]);
state = builder.setCell(state, 1, 0, 'CODE');
assert.equal(state.cells[1][0], 'CODE');
assert.equal(builder.setCell(state, 99, 99, 'ignored').cells[1][0], 'CODE');

const generated = builder.generate(state, {
  caption: 'コード一覧',
  headerMode: 'top-left',
  outputMode: 'class',
  responsive: true,
});
assert.match(generated.html, /<caption>コード一覧<\/caption>/u);
assert.match(generated.html, /<thead>/u);
assert.match(generated.html, /<tbody>/u);
assert.match(generated.html, /<th scope="col"/u);
assert.match(generated.html, /<th scope="row"/u);
assert.match(generated.html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/u);
assert.doesNotMatch(generated.html, /<script>alert/u);
assert.match(generated.html, /class="mb-table-scroll"/u);
assert.match(generated.html, /role="region"/u);
assert.match(generated.css, /\.mb-table/u);
assert.equal(generated.warningCount, 0);

assert.equal(builder.DEFAULT_STYLE_SETTINGS.headerBackground, '#f5f7fa');
assert.equal(builder.normalizeHexColor('#abc'), '#aabbcc');
assert.equal(builder.isValidHexColor('#12abef'), true);
assert.equal(builder.isValidHexColor('navy'), false);
assert.ok(builder.getContrastRatio('#1c2430', '#f5f7fa') > 4.5);
const normalizedStyle = builder.normalizeSettings({
  headerBackground: '#abc',
  headerText: 'invalid',
  borderStyle: 'double',
  borderWidth: 1,
  cellPadding: 'compact',
  stripedRows: true,
});
assert.equal(normalizedStyle.headerBackground, '#aabbcc');
assert.equal(normalizedStyle.headerText, builder.DEFAULT_STYLE_SETTINGS.headerText);
assert.equal(normalizedStyle.borderWidth, 3);
assert.equal(normalizedStyle.cellPadding, 'compact');
assert.equal(normalizedStyle.stripedRows, true);

const styled = builder.generate(state, {
  caption: 'スタイル確認',
  headerBackground: '#123456',
  headerText: '#ffffff',
  headerWeight: 'regular',
  borderColor: '#abcdef',
  borderWidth: 2,
  borderStyle: 'dashed',
  cellPadding: 'compact',
  stripedRows: true,
  stripeBackground: '#fedcba',
});
assert.match(styled.css, /--mb-table-header-background: #123456/u);
assert.match(styled.css, /--mb-table-header-text: #ffffff/u);
assert.match(styled.css, /--mb-table-border: 2px dashed #abcdef/u);
assert.match(styled.css, /--mb-table-cell-padding: 8px/u);
assert.match(styled.css, /tbody tr:nth-child\(even\) td/u);
assert.match(styled.css, /font-weight: 400/u);

const lowContrast = builder.inspect(state, {
  caption: '低コントラスト',
  headerBackground: '#ffffff',
  headerText: '#ffffff',
});
assert.ok(lowContrast.warnings.some((warning) => warning.type === 'LOW_HEADER_CONTRAST'));
assert.equal(lowContrast.headerContrast, 1);

const topOnly = builder.generate(state, { caption: '一覧', headerMode: 'top', responsive: false });
assert.match(topOnly.html, /scope="col"/u);
assert.doesNotMatch(topOnly.html, /scope="row"/u);
assert.doesNotMatch(topOnly.html, /role="region"/u);

const leftOnly = builder.generate(state, { caption: '一覧', headerMode: 'left' });
assert.doesNotMatch(leftOnly.html, /<thead>/u);
assert.match(leftOnly.html, /scope="row"/u);
assert.doesNotMatch(leftOnly.html, /scope="col"/u);

const withoutHeaders = builder.generate(state, { caption: '一覧', headerMode: 'none' });
assert.doesNotMatch(withoutHeaders.html, /<th/u);
assert.ok(withoutHeaders.warnings.some((warning) => warning.type === 'NO_HEADERS'));

const hiddenCaption = builder.generate(state, { caption: '非表示見出し', captionVisibility: 'visually-hidden' });
assert.match(hiddenCaption.html, /class="mb-table__caption--sr-only"/u);
const omittedCaption = builder.generate(state, { caption: '削除見出し', captionVisibility: 'none' });
assert.doesNotMatch(omittedCaption.html, /<caption/u);

const inline = builder.generate(state, {
  caption: 'CMS表',
  outputMode: 'inline',
  alignment: 'center',
});
assert.equal(inline.css, '');
assert.equal(inline.combined, inline.html);
assert.match(inline.html, /style="[^"]*text-align: center/u);
assert.doesNotMatch(inline.html, /class="mb-table/u);

const styledInline = builder.generate(builder.createState(3, 2, [
  ['項目', '内容'],
  ['A', '1'],
  ['B', '2'],
]), {
  caption: 'インラインスタイル',
  outputMode: 'inline',
  headerBackground: '#112233',
  headerText: '#ffffff',
  headerWeight: 'regular',
  borderColor: '#445566',
  borderWidth: 2,
  borderStyle: 'dotted',
  cellPadding: 'wide',
  stripedRows: true,
  stripeBackground: '#eeeeee',
});
assert.match(styledInline.html, /padding: 16px; border: 2px dotted #445566/u);
assert.match(styledInline.html, /color: #ffffff/u);
assert.match(styledInline.html, /font-weight: 400/u);
assert.match(styledInline.html, /background: #112233/u);
assert.match(styledInline.html, /background: #eeeeee/u);

const sizeTemplate = builder.getTemplate('size');
assert.equal(sizeTemplate.state.rows, 4);
assert.equal(sizeTemplate.state.cols, 5);
assert.equal(sizeTemplate.settings.caption, 'サイズ表');
assert.equal(sizeTemplate.settings.alignment, 'center');
assert.equal(sizeTemplate.labelJa, 'サイズ表');
assert.equal(builder.getTemplate('unknown').name, 'blank');

const pasted = builder.applyGridPaste(builder.createState(1, 1), 0, 0, 'A\tB\nC\tD');
assert.equal(pasted.state.rows, 2);
assert.equal(pasted.state.cols, 2);
assert.deepEqual(pasted.state.cells.map((row) => [...row]), [['A', 'B'], ['C', 'D']]);
assert.equal(pasted.appliedCells, 4);
assert.equal(pasted.truncated, false);

const tooWide = Array.from({ length: builder.MAX_COLS + 2 }, (_, index) => String(index)).join('\t');
const truncatedPaste = builder.applyGridPaste(builder.createState(1, 1), 0, 0, tooWide);
assert.equal(truncatedPaste.state.cols, builder.MAX_COLS);
assert.equal(truncatedPaste.truncated, true);

assert.equal(builder.addRow(builder.createState(2, 2)).rows, 3);
assert.equal(builder.removeRow(builder.createState(2, 2)).rows, 1);
assert.equal(builder.addColumn(builder.createState(2, 2)).cols, 3);
assert.equal(builder.removeColumn(builder.createState(2, 2)).cols, 1);
assert.equal(builder.clearState(state).cells.flat().every((cell) => cell === ''), true);

const warnings = builder.inspect(builder.createState(2, 2, [
  ['名称', '名称'],
  ['', ''],
]), { caption: '', headerMode: 'top-left' }).warnings;
assert.ok(warnings.some((warning) => warning.type === 'MISSING_CAPTION'));
assert.ok(warnings.some((warning) => warning.type === 'EMPTY_HEADERS'));
assert.ok(warnings.some((warning) => warning.type === 'EMPTY_ROWS'));
assert.ok(warnings.some((warning) => warning.type === 'DUPLICATE_HEADERS'));

const emptyInspection = builder.inspect(builder.createState(), { headerMode: 'none' });
assert.ok(emptyInspection.warnings.some((warning) => warning.type === 'EMPTY_TABLE'));
assert.ok(emptyInspection.warnings.some((warning) => warning.type === 'NO_HEADERS'));

const preview = builder.createPreviewDocument(generated);
assert.match(preview, /Content-Security-Policy/u);
assert.match(preview, /default-src 'none'/u);
assert.match(preview, /<body><div class="mb-table-scroll"/u);

console.log('HTML Table Builder checks passed.');
