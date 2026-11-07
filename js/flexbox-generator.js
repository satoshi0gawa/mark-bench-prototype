(() => {
  'use strict';
  const choices = {
    direction: ['row', 'row-reverse', 'column', 'column-reverse'],
    justify: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
    align: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
    wrap: ['nowrap', 'wrap', 'wrap-reverse'],
    content: ['stretch', 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
  };
  const ranges = { gap: [0, 128], padding: [0, 64], count: [1, 24], basis: [0, 480], grow: [0, 10], shrink: [0, 10], height: [160, 640] };
  const defaults = { direction: 'row', justify: 'flex-start', align: 'stretch', wrap: 'wrap', content: 'stretch', gap: 16, padding: 16, count: 6, basis: 120, grow: 0, shrink: 1, height: 320 };
  const presets = {
    cards: { ...defaults },
    center: { ...defaults, justify: 'center', align: 'center', wrap: 'nowrap', count: 3, basis: 80 },
    header: { ...defaults, justify: 'space-between', align: 'center', wrap: 'nowrap', count: 3, basis: 64 },
    stack: { ...defaults, direction: 'column', wrap: 'nowrap', count: 4, basis: 48, gap: 12 },
  };
  const generate = (input = defaults) => {
    const state = { ...defaults, ...input };
    const errors = {};
    for (const [key, values] of Object.entries(choices)) {
      if (!values.includes(state[key])) errors[key] = '選択肢から指定してください。';
    }
    for (const [key, [min, max]] of Object.entries(ranges)) {
      const raw = state[key];
      const value = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
      if (!Number.isInteger(value) || value < min || value > max) errors[key] = `${min}〜${max}の整数を入力してください。`;
      else state[key] = value;
    }
    if (Object.keys(errors).length) return { valid: false, errors, css: '', html: '' };
    const css = `.flex-layout {\n  display: flex;\n  flex-direction: ${state.direction};\n  justify-content: ${state.justify};\n  align-items: ${state.align};\n  flex-wrap: ${state.wrap};\n  align-content: ${state.content};\n  gap: ${state.gap}px;\n  padding: ${state.padding}px;\n  height: ${state.height}px;\n  box-sizing: border-box;\n}\n\n.flex-layout__item {\n  flex: ${state.grow} ${state.shrink} ${state.basis}px;\n  min-width: 0;\n  min-height: 0;\n  box-sizing: border-box;\n}`;
    const html = `<div class="flex-layout">\n${Array.from({ length: state.count }, (_, i) => `  <div class="flex-layout__item">Item ${i + 1}</div>`).join('\n')}\n</div>`;
    return { valid: true, errors, state, css, html };
  };
  const mount = ({ workspace, copyText, showToast }) => {
    const selectLabels = { direction: 'flex-direction', justify: 'justify-content', align: 'align-items', wrap: 'flex-wrap', content: 'align-content' };
    const numberLabels = { gap: 'gap (px)', padding: 'padding (px)', count: 'アイテム数', basis: 'flex-basis (px／主軸)', grow: 'flex-grow', shrink: 'flex-shrink', height: 'コンテナ高さ (px)' };
    workspace.innerHTML = `<div class="flex-generator">
      <div class="flex-generator__toolbar"><span class="section-index">LAYOUT SETTINGS</span><div class="workspace-actions"><button class="workspace-action" type="button" data-flex-sample>SAMPLE</button><button class="workspace-action" type="button" data-flex-clear>CLEAR</button></div></div>
      <div class="flex-generator__presets" role="group" aria-label="レイアウトプリセット">${Object.entries({ cards: 'CARDS', center: 'CENTER', header: 'HEADER', stack: 'STACK' }).map(([key, label]) => `<button type="button" data-flex-preset="${key}">${label}</button>`).join('')}</div>
      <div class="flex-generator__layout"><section class="flex-generator__settings" aria-label="Flexbox設定">
      ${Object.entries(choices).map(([key, values]) => `<div class="flex-generator__field"><label for="flex-${key}">${selectLabels[key]}</label><select id="flex-${key}" data-flex-field="${key}" aria-describedby="flex-error-${key}">${values.map((value) => `<option>${value}</option>`).join('')}</select><span class="flex-generator__error" id="flex-error-${key}"></span></div>`).join('')}
      ${Object.entries(ranges).map(([key, [min, max]]) => `<div class="flex-generator__field"><label for="flex-${key}">${numberLabels[key]} <small>${min}–${max}</small></label><input id="flex-${key}" data-flex-field="${key}" type="number" min="${min}" max="${max}" step="1" required aria-describedby="flex-error-${key}" /><span class="flex-generator__error" id="flex-error-${key}"></span></div>`).join('')}
      </section><section class="flex-generator__preview" aria-labelledby="flex-preview-title"><div class="workspace-panel__header"><h3 id="flex-preview-title">LIVE PREVIEW</h3></div><p data-flex-axis></p><div class="flex-generator__stage" role="region" aria-label="Flexboxプレビュー・矢印キーでスクロール" tabindex="0"><div data-flex-preview></div></div><p>プレビューは現在の表示幅に追従します。縦方向ではflex-basisが高さに作用します。align-contentは折り返した複数行に作用します。固定高さを含む配置CSSを出力し、背景・番号の装飾は含みません。</p><p>逆順表示でもDOM・読み上げ順は変わりません。実際のコンテンツでは、はみ出しと読み順を確認してください。</p></section></div>
      <p class="flex-generator__status" role="status" aria-live="polite" data-flex-status></p>
      <div class="flex-generator__outputs">${['css', 'html'].map((type) => `<section><div class="workspace-panel__header"><label for="flex-output-${type}">OUTPUT / ${type.toUpperCase()}</label><button type="button" data-flex-copy="${type}">COPY ${type.toUpperCase()}</button></div><textarea id="flex-output-${type}" readonly spellcheck="false" aria-label="生成${type.toUpperCase()}" data-flex-output="${type}"></textarea></section>`).join('')}</div>
    </div>`;
    const fields = [...workspace.querySelectorAll('[data-flex-field]')];
    const preview = workspace.querySelector('[data-flex-preview]');
    let result;
    const render = () => {
      result = generate(Object.fromEntries(fields.map((field) => [field.dataset.flexField, field.value])));
      fields.forEach((field) => {
        const key = field.dataset.flexField;
        field.setAttribute('aria-invalid', String(Boolean(result.errors[key])));
        workspace.querySelector(`#flex-error-${key}`).textContent = result.errors[key] || '';
      });
      workspace.querySelector('[data-flex-status]').textContent = result.valid ? `READY / ${result.state.count} ITEMS / CSS + HTML` : `INVALID INPUT / ${Object.keys(result.errors).length} ERRORS — 設定を確認してください。`;
      for (const type of ['css', 'html']) {
        workspace.querySelector(`[data-flex-output="${type}"]`).value = result[type];
        workspace.querySelector(`[data-flex-copy="${type}"]`).disabled = !result.valid;
      }
      preview.hidden = !result.valid;
      workspace.querySelector('[data-flex-axis]').textContent = result.valid ? `主軸：${result.state.direction.startsWith('row') ? '横' : '縦'} / 交差軸：${result.state.direction.startsWith('row') ? '縦' : '横'} / ${result.state.direction}` : '無効な設定のためプレビューを停止しています。';
      if (!result.valid) return;
      const s = result.state;
      Object.assign(preview.style, { display: 'flex', flexDirection: s.direction, justifyContent: s.justify, alignItems: s.align, flexWrap: s.wrap, alignContent: s.content, gap: `${s.gap}px`, padding: `${s.padding}px`, height: `${s.height}px` });
      preview.replaceChildren(...Array.from({ length: s.count }, (_, i) => {
        const item = document.createElement('div');
        item.textContent = `Item ${i + 1}`;
        item.style.flex = `${s.grow} ${s.shrink} ${s.basis}px`;
        return item;
      }));
    };
    const apply = (state) => {
      fields.forEach((field) => { field.value = state[field.dataset.flexField]; });
      render();
    };
    fields.forEach((field) => field.addEventListener('input', render));
    workspace.querySelector('[data-flex-sample]').addEventListener('click', () => apply({ ...presets.cards, grow: 1, count: 8, gap: 24 }));
    workspace.querySelector('[data-flex-clear]').addEventListener('click', () => {
      apply(defaults);
      fields[0].focus();
      showToast('表示内容をリセットしました。', 'reset');
    });
    workspace.querySelectorAll('[data-flex-preset]').forEach((button) => button.addEventListener('click', () => apply(presets[button.dataset.flexPreset])));
    workspace.querySelectorAll('[data-flex-copy]').forEach((button) => button.addEventListener('click', () => { if (result.valid) copyText(result[button.dataset.flexCopy]); }));
    apply(defaults);
  };
  globalThis.MarkBenchFlexboxGenerator = { choices, ranges, defaults, presets, generate, mount };
})();
