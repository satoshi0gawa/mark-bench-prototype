(() => {
  const MIN_ROWS = 1;
  const MIN_COLS = 1;
  const MAX_ROWS = 20;
  const MAX_COLS = 12;
  const MAX_CELL_LENGTH = 5000;
  const MAX_CAPTION_LENGTH = 200;
  const DEFAULT_ROWS = 4;
  const DEFAULT_COLS = 4;
  const DEFAULT_STYLE_SETTINGS = Object.freeze({
    headerBackground: '#f5f7fa',
    headerText: '#1c2430',
    headerWeight: 'bold',
    borderColor: '#d9dfe8',
    borderWidth: 1,
    borderStyle: 'solid',
    cellPadding: 'standard',
    stripedRows: false,
    stripeBackground: '#f8fafc',
  });
  const DEFAULT_SETTINGS = Object.freeze({
    headerMode: 'top-left',
    caption: '',
    captionVisibility: 'visible',
    alignment: 'left',
    outputMode: 'class',
    responsive: true,
    ...DEFAULT_STYLE_SETTINGS,
  });

  const TEMPLATE_DEFINITIONS = Object.freeze({
    size: Object.freeze({
      label: 'SIZE CHART',
      labelJa: 'サイズ表',
      caption: 'サイズ表',
      alignment: 'center',
      cells: Object.freeze([
        Object.freeze(['サイズ', '肩幅', '身幅', '着丈', '袖丈']),
        Object.freeze(['M', '54', '68', '74', '27']),
        Object.freeze(['L', '56', '70', '76', '28']),
        Object.freeze(['XL', '58', '72', '78', '29']),
      ]),
    }),
    spec: Object.freeze({
      label: 'PRODUCT SPEC',
      labelJa: '商品仕様',
      caption: '商品仕様',
      alignment: 'left',
      cells: Object.freeze([
        Object.freeze(['項目', '内容']),
        Object.freeze(['素材', 'コットン 100%']),
        Object.freeze(['原産国', '日本']),
        Object.freeze(['カラー', 'BLACK / WHITE']),
      ]),
    }),
    price: Object.freeze({
      label: 'PRICE COMPARISON',
      labelJa: '料金比較',
      caption: '料金プラン比較',
      alignment: 'center',
      cells: Object.freeze([
        Object.freeze(['プラン', '月額', '容量', 'サポート']),
        Object.freeze(['BASIC', '¥980', '10 GB', 'EMAIL']),
        Object.freeze(['STANDARD', '¥1,980', '50 GB', 'CHAT']),
        Object.freeze(['PRO', '¥3,980', '200 GB', 'PRIORITY']),
      ]),
    }),
    schedule: Object.freeze({
      label: 'SCHEDULE',
      labelJa: '営業時間',
      caption: '営業時間',
      alignment: 'center',
      cells: Object.freeze([
        Object.freeze(['曜日', '営業時間', '備考']),
        Object.freeze(['月–金', '10:00–18:00', '通常営業']),
        Object.freeze(['土', '10:00–15:00', '短縮営業']),
        Object.freeze(['日・祝', '休業', '']),
      ]),
    }),
    delivery: Object.freeze({
      label: 'DELIVERY',
      labelJa: '配送情報',
      caption: '配送情報',
      alignment: 'left',
      cells: Object.freeze([
        Object.freeze(['配送項目', '内容']),
        Object.freeze(['発送目安', 'ご注文から2〜4営業日']),
        Object.freeze(['配送方法', '宅配便']),
        Object.freeze(['注意事項', '地域により到着日が異なります']),
      ]),
    }),
    blank: Object.freeze({
      label: 'BLANK',
      labelJa: '空のテーブル',
      caption: '',
      alignment: 'left',
      cells: Object.freeze(Array.from({ length: DEFAULT_ROWS }, () => Object.freeze(Array(DEFAULT_COLS).fill('')))),
    }),
  });

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const normalizeNewlines = (value = '') => String(value).replace(/\r\n?/gu, '\n').replaceAll('\0', '\uFFFD');
  const clamp = (value, minimum, maximum) => Math.min(Math.max(Math.trunc(Number(value)) || minimum, minimum), maximum);
  const normalizeCell = (value = '') => normalizeNewlines(value).replace(/\n/gu, ' ').slice(0, MAX_CELL_LENGTH);
  const normalizeHexColor = (value, fallback = '#000000') => {
    const source = String(value || '').trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/u.test(source)) return source;
    if (/^#[0-9a-f]{3}$/u.test(source)) return `#${[...source.slice(1)].map((character) => character.repeat(2)).join('')}`;
    return fallback;
  };
  const isValidHexColor = (value) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/iu.test(String(value || '').trim());
  const hexToRgb = (value) => {
    const normalized = normalizeHexColor(value);
    return [1, 3, 5].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16));
  };
  const getRelativeLuminance = (value) => {
    const channels = hexToRgb(value).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
  };
  const getContrastRatio = (foreground, background) => {
    const first = getRelativeLuminance(foreground);
    const second = getRelativeLuminance(background);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  };
  const getCellPadding = (value) => ({ compact: 8, standard: 12, wide: 16 }[value] || 12);

  const createState = (rows = DEFAULT_ROWS, cols = DEFAULT_COLS, sourceCells) => {
    const rowCount = clamp(rows, MIN_ROWS, MAX_ROWS);
    const colCount = clamp(cols, MIN_COLS, MAX_COLS);
    const cells = Array.from({ length: rowCount }, (_, rowIndex) => Array.from(
      { length: colCount },
      (_, colIndex) => normalizeCell(sourceCells?.[rowIndex]?.[colIndex] ?? ''),
    ));
    return Object.freeze({ rows: rowCount, cols: colCount, cells: Object.freeze(cells.map((row) => Object.freeze(row))) });
  };

  const cloneState = (state) => createState(state?.rows, state?.cols, state?.cells);

  const resizeState = (state, rows, cols) => createState(rows, cols, state?.cells);

  const setCell = (state, rowIndex, colIndex, value) => {
    const current = cloneState(state);
    if (rowIndex < 0 || rowIndex >= current.rows || colIndex < 0 || colIndex >= current.cols) return current;
    const cells = current.cells.map((row) => [...row]);
    cells[rowIndex][colIndex] = normalizeCell(value);
    return createState(current.rows, current.cols, cells);
  };

  const addRow = (state) => resizeState(state, Math.min((state?.rows || DEFAULT_ROWS) + 1, MAX_ROWS), state?.cols || DEFAULT_COLS);
  const removeRow = (state) => resizeState(state, Math.max((state?.rows || DEFAULT_ROWS) - 1, MIN_ROWS), state?.cols || DEFAULT_COLS);
  const addColumn = (state) => resizeState(state, state?.rows || DEFAULT_ROWS, Math.min((state?.cols || DEFAULT_COLS) + 1, MAX_COLS));
  const removeColumn = (state) => resizeState(state, state?.rows || DEFAULT_ROWS, Math.max((state?.cols || DEFAULT_COLS) - 1, MIN_COLS));
  const clearState = (state) => createState(state?.rows, state?.cols);

  const parseGridText = (value = '') => {
    const rows = normalizeNewlines(value).split('\n');
    if (rows.length > 1 && rows.at(-1) === '') rows.pop();
    return rows.map((row) => row.split('\t').map(normalizeCell));
  };

  const applyGridPaste = (state, startRow, startCol, value = '') => {
    const parsed = parseGridText(value);
    const source = cloneState(state);
    const targetRows = Math.min(MAX_ROWS, Math.max(source.rows, startRow + parsed.length));
    const pastedCols = parsed.reduce((maximum, row) => Math.max(maximum, row.length), 0);
    const targetCols = Math.min(MAX_COLS, Math.max(source.cols, startCol + pastedCols));
    const cells = resizeState(source, targetRows, targetCols).cells.map((row) => [...row]);
    let appliedCells = 0;
    let truncated = false;

    parsed.forEach((row, rowOffset) => {
      row.forEach((cell, colOffset) => {
        const rowIndex = startRow + rowOffset;
        const colIndex = startCol + colOffset;
        if (rowIndex >= MAX_ROWS || colIndex >= MAX_COLS) {
          truncated = true;
          return;
        }
        cells[rowIndex][colIndex] = normalizeCell(cell);
        appliedCells += 1;
      });
    });

    return Object.freeze({
      state: createState(targetRows, targetCols, cells),
      appliedCells,
      truncated,
      sourceRows: parsed.length,
      sourceCols: pastedCols,
    });
  };

  const getTemplate = (name = 'blank') => {
    const template = TEMPLATE_DEFINITIONS[name] || TEMPLATE_DEFINITIONS.blank;
    const state = createState(template.cells.length, template.cells[0]?.length || 1, template.cells);
    return Object.freeze({
      name: TEMPLATE_DEFINITIONS[name] ? name : 'blank',
      label: template.label,
      labelJa: template.labelJa,
      state,
      settings: Object.freeze({ ...DEFAULT_SETTINGS, caption: template.caption, alignment: template.alignment }),
    });
  };

  const normalizeSettings = (settings = {}) => {
    const next = { ...DEFAULT_SETTINGS, ...settings };
    if (!['top-left', 'top', 'left', 'none'].includes(next.headerMode)) next.headerMode = DEFAULT_SETTINGS.headerMode;
    if (!['visible', 'visually-hidden', 'none'].includes(next.captionVisibility)) next.captionVisibility = DEFAULT_SETTINGS.captionVisibility;
    if (!['left', 'center', 'right'].includes(next.alignment)) next.alignment = DEFAULT_SETTINGS.alignment;
    if (!['class', 'inline'].includes(next.outputMode)) next.outputMode = DEFAULT_SETTINGS.outputMode;
    if (!['regular', 'bold'].includes(next.headerWeight)) next.headerWeight = DEFAULT_SETTINGS.headerWeight;
    if (!['none', 'solid', 'dashed', 'dotted', 'double'].includes(next.borderStyle)) next.borderStyle = DEFAULT_SETTINGS.borderStyle;
    if (!['compact', 'standard', 'wide'].includes(next.cellPadding)) next.cellPadding = DEFAULT_SETTINGS.cellPadding;
    next.headerBackground = normalizeHexColor(next.headerBackground, DEFAULT_SETTINGS.headerBackground);
    next.headerText = normalizeHexColor(next.headerText, DEFAULT_SETTINGS.headerText);
    next.borderColor = normalizeHexColor(next.borderColor, DEFAULT_SETTINGS.borderColor);
    next.stripeBackground = normalizeHexColor(next.stripeBackground, DEFAULT_SETTINGS.stripeBackground);
    next.borderWidth = [0, 1, 2, 3].includes(Number(next.borderWidth)) ? Number(next.borderWidth) : DEFAULT_SETTINGS.borderWidth;
    if (next.borderStyle === 'double' && next.borderWidth < 3) next.borderWidth = 3;
    next.caption = normalizeCell(next.caption).slice(0, MAX_CAPTION_LENGTH);
    next.responsive = Boolean(next.responsive);
    next.stripedRows = Boolean(next.stripedRows);
    return Object.freeze(next);
  };

  const createWarning = (type, location, message) => Object.freeze({ type, location, message });

  const getHeaderCoordinates = (state, headerMode) => {
    const coordinates = [];
    if (headerMode === 'top' || headerMode === 'top-left') {
      for (let colIndex = 0; colIndex < state.cols; colIndex += 1) coordinates.push([0, colIndex]);
    }
    if (headerMode === 'left' || headerMode === 'top-left') {
      const startRow = headerMode === 'top-left' ? 1 : 0;
      for (let rowIndex = startRow; rowIndex < state.rows; rowIndex += 1) coordinates.push([rowIndex, 0]);
    }
    return coordinates;
  };

  const inspect = (stateInput, settingsInput = {}) => {
    const state = cloneState(stateInput);
    const settings = normalizeSettings(settingsInput);
    const warnings = [];
    const allCells = state.cells.flat();
    const nonEmptyCells = allCells.filter((cell) => cell.trim());
    const headerCoordinates = getHeaderCoordinates(state, settings.headerMode);
    const emptyHeaderCount = headerCoordinates.filter(([row, col]) => !state.cells[row][col].trim()).length;

    if (!settings.caption.trim()) warnings.push(createWarning('MISSING_CAPTION', 'TABLE', 'テーブルの内容を示すキャプションがありません。'));
    if (settings.headerMode === 'none') warnings.push(createWarning('NO_HEADERS', 'TABLE', '見出しセルが設定されていません。'));
    if (emptyHeaderCount > 0) warnings.push(createWarning('EMPTY_HEADERS', 'HEADERS', `空の見出しセルが${emptyHeaderCount}件あります。`));
    if (nonEmptyCells.length === 0) warnings.push(createWarning('EMPTY_TABLE', 'TABLE', 'すべてのセルが空です。'));

    const emptyRows = state.cells.filter((row) => row.every((cell) => !cell.trim())).length;
    const emptyColumns = Array.from({ length: state.cols }, (_, colIndex) => state.cells.every((row) => !row[colIndex].trim())).filter(Boolean).length;
    if (nonEmptyCells.length > 0 && emptyRows > 0) warnings.push(createWarning('EMPTY_ROWS', 'ROWS', `内容が空の行が${emptyRows}件あります。`));
    if (nonEmptyCells.length > 0 && emptyColumns > 0) warnings.push(createWarning('EMPTY_COLUMNS', 'COLUMNS', `内容が空の列が${emptyColumns}件あります。`));

    if (settings.headerMode === 'top' || settings.headerMode === 'top-left') {
      const labels = state.cells[0].map((cell) => cell.trim().toLocaleLowerCase('ja')).filter(Boolean);
      const duplicateCount = labels.filter((label, index) => labels.indexOf(label) !== index).length;
      if (duplicateCount > 0) warnings.push(createWarning('DUPLICATE_HEADERS', 'HEADERS', `重複する列見出しが${duplicateCount}件あります。`));
    }

    const headerContrast = getContrastRatio(settings.headerText, settings.headerBackground);
    if (settings.headerMode !== 'none' && headerContrast < 4.5) {
      warnings.push(createWarning('LOW_HEADER_CONTRAST', 'TH STYLE', `見出しのコントラスト比が${headerContrast.toFixed(2)}:1です。4.5:1以上を推奨します。`));
    }

    return Object.freeze({
      state,
      settings,
      warnings: Object.freeze(warnings),
      warningCount: warnings.length,
      nonEmptyCellCount: nonEmptyCells.length,
      emptyCellCount: allCells.length - nonEmptyCells.length,
      headerCount: headerCoordinates.length,
      headerContrast,
      characterCount: allCells.reduce((total, cell) => total + [...cell].length, 0),
    });
  };

  const getCellKind = (rowIndex, colIndex, settings) => {
    const topHeader = rowIndex === 0 && (settings.headerMode === 'top' || settings.headerMode === 'top-left');
    const leftHeader = colIndex === 0 && (settings.headerMode === 'left' || settings.headerMode === 'top-left');
    if (topHeader) return Object.freeze({ tag: 'th', scope: 'col' });
    if (leftHeader) return Object.freeze({ tag: 'th', scope: 'row' });
    return Object.freeze({ tag: 'td', scope: '' });
  };

  const getClassCss = (state, settings) => {
    const minWidth = Math.max(320, state.cols * 120);
    return `.mb-table-scroll {
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}

.mb-table {
  --mb-table-header-background: ${settings.headerBackground};
  --mb-table-header-text: ${settings.headerText};
  --mb-table-border: ${settings.borderWidth}px ${settings.borderStyle} ${settings.borderColor};
  --mb-table-cell-padding: ${getCellPadding(settings.cellPadding)}px;
  --mb-table-stripe-background: ${settings.stripeBackground};
  width: 100%;
  min-width: ${minWidth}px;
  border-collapse: collapse;
  table-layout: fixed;
}

.mb-table caption {
  margin-bottom: 0.75rem;
  font-weight: 700;
  text-align: left;
}

.mb-table__caption--sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.mb-table th,
.mb-table td {
  padding: var(--mb-table-cell-padding);
  border: var(--mb-table-border);
  text-align: ${settings.alignment};
  vertical-align: middle;
}

.mb-table th {
  color: var(--mb-table-header-text);
  font-weight: ${settings.headerWeight === 'bold' ? 700 : 400};
  background: var(--mb-table-header-background);
}${settings.stripedRows ? `

.mb-table tbody tr:nth-child(even) td {
  background: var(--mb-table-stripe-background);
}` : ''}`;
  };

  const getInlineStyles = (state, settings) => Object.freeze({
    wrapper: 'width: 100%; overflow-x: auto; overscroll-behavior-inline: contain;',
    table: `width: 100%; min-width: ${Math.max(320, state.cols * 120)}px; border-collapse: collapse; table-layout: fixed;`,
    caption: 'margin-bottom: 12px; font-weight: 700; text-align: left;',
    captionHidden: 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;',
    cell: `padding: ${getCellPadding(settings.cellPadding)}px; border: ${settings.borderWidth}px ${settings.borderStyle} ${settings.borderColor}; text-align: ${settings.alignment}; vertical-align: middle;`,
    heading: `padding: ${getCellPadding(settings.cellPadding)}px; border: ${settings.borderWidth}px ${settings.borderStyle} ${settings.borderColor}; color: ${settings.headerText}; text-align: ${settings.alignment}; vertical-align: middle; font-weight: ${settings.headerWeight === 'bold' ? 700 : 400}; background: ${settings.headerBackground};`,
    stripe: ` background: ${settings.stripeBackground};`,
  });

  const buildHtml = (state, settings) => {
    const inline = settings.outputMode === 'inline';
    const styles = getInlineStyles(state, settings);
    const captionText = settings.caption.trim();
    let caption = '';
    if (settings.captionVisibility !== 'none' && captionText) {
      const hidden = settings.captionVisibility === 'visually-hidden';
      const attributes = inline
        ? ` style="${hidden ? styles.captionHidden : styles.caption}"`
        : hidden
          ? ' class="mb-table__caption--sr-only"'
          : '';
      caption = `  <caption${attributes}>${escapeHtml(captionText)}</caption>\n`;
    }

    const hasTopHeader = settings.headerMode === 'top' || settings.headerMode === 'top-left';
    const buildRow = (row, rowIndex) => {
      const bodyRowIndex = hasTopHeader ? rowIndex - 1 : rowIndex;
      const stripeRow = settings.stripedRows && bodyRowIndex >= 0 && bodyRowIndex % 2 === 1;
      const cells = row.map((cell, colIndex) => {
        const kind = getCellKind(rowIndex, colIndex, settings);
        const scope = kind.scope ? ` scope="${kind.scope}"` : '';
        const className = inline ? '' : ` class="mb-table__${kind.tag === 'th' ? 'heading' : 'cell'}"`;
        const inlineStyle = kind.tag === 'th' ? styles.heading : `${styles.cell}${stripeRow ? styles.stripe : ''}`;
        const style = inline ? ` style="${inlineStyle}"` : '';
        return `      <${kind.tag}${scope}${className}${style}>${escapeHtml(cell)}</${kind.tag}>`;
      }).join('\n');
      return `    <tr>\n${cells}\n    </tr>`;
    };

    const tableAttributes = inline ? ` style="${styles.table}"` : ' class="mb-table"';
    const parts = [`<table${tableAttributes}>`, caption.trimEnd()];
    if (hasTopHeader) {
      parts.push('  <thead>', buildRow(state.cells[0], 0), '  </thead>', '  <tbody>');
      state.cells.slice(1).forEach((row, rowIndex) => parts.push(buildRow(row, rowIndex + 1)));
      parts.push('  </tbody>');
    } else {
      parts.push('  <tbody>');
      state.cells.forEach((row, rowIndex) => parts.push(buildRow(row, rowIndex)));
      parts.push('  </tbody>');
    }
    parts.push('</table>');
    const table = parts.filter(Boolean).join('\n');
    if (!settings.responsive) return table;
    const label = escapeHtml(captionText || '生成したテーブル');
    if (inline) return `<div role="region" aria-label="${label}" tabindex="0" style="${styles.wrapper}">\n${table.split('\n').map((line) => `  ${line}`).join('\n')}\n</div>`;
    return `<div class="mb-table-scroll" role="region" aria-label="${label}" tabindex="0">\n${table.split('\n').map((line) => `  ${line}`).join('\n')}\n</div>`;
  };

  const generate = (stateInput, settingsInput = {}) => {
    const inspection = inspect(stateInput, settingsInput);
    const html = buildHtml(inspection.state, inspection.settings);
    const css = inspection.settings.outputMode === 'class' ? getClassCss(inspection.state, inspection.settings) : '';
    const combined = css ? `<style>\n${css}\n</style>\n\n${html}` : html;
    return Object.freeze({ ...inspection, html, css, combined, outputLength: combined.length });
  };

  const createPreviewDocument = (result) => `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><style>:root{color-scheme:light;font-family:"BIZ UDPGothic",system-ui,sans-serif;color:#1c2430;background:#fff}*{box-sizing:border-box}body{margin:0;padding:clamp(1rem,4vw,2.5rem);font-size:16px;line-height:1.7}${result.css || ''}</style></head><body>${result.html}</body></html>`;

  globalThis.MarkBenchHtmlTableBuilder = Object.freeze({
    MIN_ROWS,
    MIN_COLS,
    MAX_ROWS,
    MAX_COLS,
    MAX_CELL_LENGTH,
    MAX_CAPTION_LENGTH,
    DEFAULT_ROWS,
    DEFAULT_COLS,
    DEFAULT_STYLE_SETTINGS,
    DEFAULT_SETTINGS,
    TEMPLATE_DEFINITIONS,
    escapeHtml,
    normalizeNewlines,
    normalizeHexColor,
    isValidHexColor,
    getContrastRatio,
    getCellPadding,
    createState,
    cloneState,
    resizeState,
    setCell,
    addRow,
    removeRow,
    addColumn,
    removeColumn,
    clearState,
    parseGridText,
    applyGridPaste,
    getTemplate,
    normalizeSettings,
    getHeaderCoordinates,
    inspect,
    generate,
    createPreviewDocument,
  });
})();
