(() => {
  'use strict';
  const choices = {
    columnMode: ['equal', 'fixed', 'auto-fit', 'auto-fill'],
    rowMode: ['minmax', 'fixed', 'equal'],
    flow: ['row', 'column', 'row dense', 'column dense'],
    justifyItems: ['stretch', 'start', 'center', 'end'],
    alignItems: ['stretch', 'start', 'center', 'end'],
    justifyContent: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
    alignContent: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
  };
  const ranges = { columns: [1, 12], rows: [1, 12], columnGap: [0, 128], rowGap: [0, 128], count: [1, 48], minWidth: [40, 480], columnWidth: [40, 480], rowHeight: [40, 240], height: [160, 640], padding: [0, 64], columnSpan: [1, 12], rowSpan: [1, 12] };
  const defaults = { columnMode: 'equal', rowMode: 'minmax', columns: 3, rows: 2, columnGap: 16, rowGap: 16, count: 6, minWidth: 160, columnWidth: 120, rowHeight: 80, height: 320, padding: 16, flow: 'row', justifyItems: 'stretch', alignItems: 'stretch', justifyContent: 'start', alignContent: 'start', columnSpan: 1, rowSpan: 1 };
  const presets = {
    cards: { ...defaults },
    responsive: { ...defaults, columnMode: 'auto-fit', count: 8, minWidth: 140 },
    dashboard: { ...defaults, count: 8, rows: 3, columnSpan: 2, rowSpan: 2, flow: 'row dense' },
    centered: { ...defaults, columnMode: 'fixed', columns: 2, rows: 2, count: 4, columnWidth: 80, rowMode: 'fixed', rowHeight: 60, justifyContent: 'center', alignContent: 'center', justifyItems: 'center', alignItems: 'center' },
  };
  const inactive = (state, key) => (key === 'columns' || key === 'columnSpan') && state.columnMode.startsWith('auto-')
    || key === 'minWidth' && !state.columnMode.startsWith('auto-')
    || key === 'columnWidth' && state.columnMode !== 'fixed' && !state.flow.startsWith('column')
    || key === 'rowHeight' && state.rowMode === 'equal';
  const generate = (input = defaults) => {
    const state = { ...defaults, ...input };
    const errors = {};
    for (const [key, values] of Object.entries(choices)) {
      if (!values.includes(state[key])) errors[key] = '選択肢から指定してください。';
    }
    // Validate enums first so untrusted values cannot reach string operations.
    if (Object.keys(errors).length) return { valid: false, errors, css: '', html: '' };
    for (const [key, [min, max]] of Object.entries(ranges)) {
      if (inactive(state, key)) { state[key] = defaults[key]; continue; }
      const raw = state[key];
      const value = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
      if (!Number.isInteger(value) || value < min || value > max) errors[key] = `${min}〜${max}の整数を入力してください。`;
      else state[key] = value;
    }
    if (!errors.columnSpan && !errors.columns && state.columnSpan > state.columns) errors.columnSpan = '列spanは列数以下にしてください。';
    if (!errors.rowSpan && !errors.rows && state.rowSpan > state.rows) errors.rowSpan = '行spanは行数以下にしてください。';
    if (Object.keys(errors).length) return { valid: false, errors, css: '', html: '' };
    const columns = state.columnMode === 'equal' ? `repeat(${state.columns}, minmax(0, 1fr))`
      : state.columnMode === 'fixed' ? `repeat(${state.columns}, ${state.columnWidth}px)`
        : `repeat(${state.columnMode}, minmax(min(${state.minWidth}px, 100%), 1fr))`;
    const rowTrack = state.rowMode === 'equal' ? 'minmax(0, 1fr)' : state.rowMode === 'fixed' ? `${state.rowHeight}px` : `minmax(${state.rowHeight}px, auto)`;
    const properties = {
      display: 'grid', 'grid-template-columns': columns,
      'grid-template-rows': `repeat(${state.rows}, ${rowTrack})`,
      'grid-auto-rows': rowTrack, 'grid-auto-columns': `${state.columnWidth}px`,
      'grid-auto-flow': state.flow, 'column-gap': `${state.columnGap}px`, 'row-gap': `${state.rowGap}px`,
      'justify-items': state.justifyItems, 'align-items': state.alignItems,
      'justify-content': state.justifyContent, 'align-content': state.alignContent,
      padding: `${state.padding}px`, height: `${state.height}px`, 'box-sizing': 'border-box',
    };
    let css = `.grid-layout {\n${Object.entries(properties).map(([key, value]) => `  ${key}: ${value};`).join('\n')}\n}\n\n.grid-layout__item {\n  min-width: 0;\n  min-height: 0;\n  box-sizing: border-box;\n}`;
    if (state.columnSpan > 1 || state.rowSpan > 1) css += `\n\n.grid-layout__item:first-child {\n  grid-column: span ${state.columnSpan};\n  grid-row: span ${state.rowSpan};\n}`;
    const html = `<div class="grid-layout">\n${Array.from({ length: state.count }, (_, i) => `  <div class="grid-layout__item">Item ${i + 1}</div>`).join('\n')}\n</div>`;
    return { valid: true, errors, state, properties, css, html };
  };
  const mount = ({ workspace, copyText, showToast }) => {
    const selectLabels = { columnMode: '列の指定方式', rowMode: '行の指定方式', flow: 'grid-auto-flow', justifyItems: 'justify-items（セル内・横）', alignItems: 'align-items（セル内・縦）', justifyContent: 'justify-content（全体・横）', alignContent: 'align-content（全体・縦）' };
    const numberLabels = { columns: '明示的な列数', rows: '明示的な行数', columnGap: 'column-gap (px)', rowGap: 'row-gap (px)', count: 'アイテム数', minWidth: '自動列の最小幅 (px)', columnWidth: '固定列・暗黙列の幅 (px)', rowHeight: '行高／最小行高 (px)', height: 'コンテナ高さ (px)', padding: 'padding (px)', columnSpan: '先頭アイテムの列span', rowSpan: '先頭アイテムの行span' };
    const names = { equal: 'equal / 均等分割', fixed: 'fixed / 固定px', minmax: 'minmax / 最小px＋auto' };
    workspace.innerHTML = `<div class="grid-generator">
      <div class="grid-generator__toolbar"><span class="section-index">LAYOUT SETTINGS</span><div class="workspace-actions"><button class="workspace-action" type="button" data-grid-sample>SAMPLE</button><button class="workspace-action" type="button" data-grid-clear>CLEAR</button></div></div>
      <div class="grid-generator__presets" role="group" aria-label="レイアウトプリセット">${Object.entries({ cards: 'CARDS', responsive: 'AUTO FIT', dashboard: 'DASHBOARD', centered: 'CENTER' }).map(([key, label]) => `<button type="button" data-grid-preset="${key}">${label}</button>`).join('')}</div>
      <div class="grid-generator__layout"><section class="grid-generator__settings" aria-label="CSS Grid設定">
      ${Object.entries(choices).map(([key, values]) => `<div class="grid-generator__field"><label for="grid-${key}">${selectLabels[key]}</label><select id="grid-${key}" data-grid-field="${key}" aria-describedby="grid-error-${key}">${values.map(value => `<option value="${value}">${names[value] || value}</option>`).join('')}</select><span class="grid-generator__error" id="grid-error-${key}"></span></div>`).join('')}
      ${Object.entries(ranges).map(([key, [min, max]]) => `<div class="grid-generator__field"><label for="grid-${key}">${numberLabels[key]} <small>${min}–${max}</small></label><input id="grid-${key}" data-grid-field="${key}" type="number" min="${min}" max="${max}" step="1" required aria-describedby="grid-error-${key}" /><span class="grid-generator__error" id="grid-error-${key}"></span></div>`).join('')}
      </section><section class="grid-generator__preview" aria-labelledby="grid-preview-title"><div class="workspace-panel__header"><h3 id="grid-preview-title">LIVE PREVIEW</h3></div><p data-grid-summary></p><div class="grid-generator__stage" role="region" aria-label="Gridプレビュー・矢印キーでスクロール" tabindex="0"><div data-grid-preview></div></div>
      <p>列と行を持つ2次元レイアウトです。セル内の整列はitems、トラック全体の配置はcontentで調整します。均等なfr列は横幅を使い切るため、justify-contentの差は固定px列で確認できます。</p>
      <p>auto-fitは空の列を折りたたみ、auto-fillは空の列も確保します。自動列では列数と列spanを無効にし、最小幅で列数を決めます。min(最小幅, 100%)で狭い領域でも収まる列を生成します。</p>
      <p>行・列が不足すると暗黙トラックが追加されます。固定幅・多数のアイテム・大きなgapではプレビュー内にスクロールが発生します。固定高さはCSSに含め、黄色背景などの見本装飾は含めません。</p>
      <p data-grid-warning></p></section></div>
      <p class="grid-generator__status" role="status" aria-live="polite" data-grid-status></p>
      <div class="grid-generator__outputs">${['css', 'html'].map(type => `<section><div class="workspace-panel__header"><label for="grid-output-${type}">OUTPUT / ${type.toUpperCase()}</label><button type="button" data-grid-copy="${type}">COPY ${type.toUpperCase()}</button></div><textarea id="grid-output-${type}" readonly spellcheck="false" aria-label="生成${type.toUpperCase()}" data-grid-output="${type}"></textarea></section>`).join('')}</div>
    </div>`;
    const fields = [...workspace.querySelectorAll('[data-grid-field]')];
    const preview = workspace.querySelector('[data-grid-preview]');
    let result;
    const render = () => {
      const raw = Object.fromEntries(fields.map(field => [field.dataset.gridField, field.value]));
      fields.forEach(field => { field.disabled = inactive(raw, field.dataset.gridField); });
      result = generate(raw);
      fields.forEach(field => {
        const key = field.dataset.gridField;
        field.setAttribute('aria-invalid', String(Boolean(result.errors[key])));
        workspace.querySelector(`#grid-error-${key}`).textContent = result.errors[key] || '';
      });
      workspace.querySelector('[data-grid-status]').textContent = result.valid ? `READY / ${result.state.count} ITEMS / CSS + HTML` : `INVALID INPUT / ${Object.keys(result.errors).length} ERRORS — 設定を確認してください。`;
      for (const type of ['css', 'html']) {
        workspace.querySelector(`[data-grid-output="${type}"]`).value = result[type];
        workspace.querySelector(`[data-grid-copy="${type}"]`).disabled = !result.valid;
      }
      preview.hidden = !result.valid;
      workspace.querySelector('[data-grid-summary]').textContent = result.valid ? `${result.state.columnMode.startsWith('auto-') ? result.state.columnMode : result.state.columns + ' COLUMNS'} / ${result.state.rows} EXPLICIT ROWS / ${result.state.flow}` : '無効な設定のためプレビューを停止しています。';
      workspace.querySelector('[data-grid-warning]').textContent = raw.flow.includes('dense') ? 'DENSE：隙間を埋めるため、見た目の順序がDOM・読み上げ・Tab順と異なる場合があります。順序に意味があるコンテンツでは使用を慎重に判断してください。' : '列優先配置やspan指定でもDOM・読み上げ・Tab順は変わりません。出力先で内容の読み順を確認してください。';
      if (!result.valid) return;
      for (const [property, value] of Object.entries(result.properties)) preview.style.setProperty(property, value);
      preview.replaceChildren(...Array.from({ length: result.state.count }, (_, i) => {
        const item = document.createElement('div');
        item.textContent = `Item ${i + 1}`;
        if (i === 0) {
          item.style.gridColumn = `span ${result.state.columnSpan}`;
          item.style.gridRow = `span ${result.state.rowSpan}`;
        }
        return item;
      }));
    };
    const apply = state => { fields.forEach(field => { field.value = state[field.dataset.gridField]; }); render(); };
    fields.forEach(field => field.addEventListener('input', render));
    workspace.querySelector('[data-grid-sample]').addEventListener('click', () => apply(presets.dashboard));
    workspace.querySelector('[data-grid-clear]').addEventListener('click', () => { apply(defaults); fields[0].focus(); showToast('表示内容をリセットしました。', 'reset'); });
    workspace.querySelectorAll('[data-grid-preset]').forEach(button => button.addEventListener('click', () => apply(presets[button.dataset.gridPreset])));
    workspace.querySelectorAll('[data-grid-copy]').forEach(button => button.addEventListener('click', () => { if (result.valid) copyText(result[button.dataset.gridCopy]); }));
    apply(defaults);
  };
  globalThis.MarkBenchCssGridGenerator = { choices, ranges, defaults, presets, inactive, generate, mount };
})();
