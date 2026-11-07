(() => {
  'use strict';
  const corners = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
  const choices = { mode: ['uniform', 'corners', 'ellipse'], unit: ['px', '%'] };
  const defaults = { mode: 'corners', unit: 'px', width: 280, height: 200, uniform: 24, h0: 24, h1: 24, h2: 24, h3: 24, v0: 24, v1: 24, v2: 24, v3: 24, stageColor: '#202b40' };
  const presets = {
    card: { ...defaults },
    pill: { ...defaults, mode: 'uniform', uniform: 240, height: 96 },
    circle: { ...defaults, mode: 'uniform', unit: '%', uniform: 50, width: 240, height: 240 },
    ellipse: { ...defaults, mode: 'ellipse', h0: 90, h1: 90, h2: 90, h3: 90, v0: 40, v1: 40, v2: 40, v3: 40 },
    bubble: { ...defaults, h0: 32, h1: 32, h2: 32, h3: 0 },
    blob: { ...defaults, mode: 'ellipse', unit: '%', h0: 65, h1: 35, h2: 45, h3: 55, v0: 40, v1: 55, v2: 45, v3: 60, height: 220 },
  };
  const radiusKeys = ['uniform', ...corners.map((_, i) => `h${i}`), ...corners.map((_, i) => `v${i}`)];
  const inactive = (mode, key) => key === 'uniform' ? mode !== 'uniform' : key.startsWith('h') && /^h\d$/.test(key) ? mode === 'uniform' : /^v\d$/.test(key) ? mode !== 'ellipse' : false;
  const rangeFor = (key, unit) => key === 'width' || key === 'height' ? [80, 480] : [0, unit === '%' ? 100 : 500];
  const compress = values => values.every(v => v === values[0]) ? [values[0]]
    : values[0] === values[2] && values[1] === values[3] ? values.slice(0, 2)
      : values[1] === values[3] ? values.slice(0, 3) : values;
  const generate = (input = defaults) => {
    const state = { ...defaults, ...input };
    const errors = {};
    for (const [key, allowed] of Object.entries(choices)) if (!allowed.includes(state[key])) errors[key] = '選択肢から指定してください。';
    if (Object.keys(errors).length) return { valid: false, errors, css: '', html: '' };
    for (const key of ['width', 'height', ...radiusKeys]) {
      if (inactive(state.mode, key)) { state[key] = defaults[key]; continue; }
      const raw = state[key];
      const value = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
      const [min, max] = rangeFor(key, state.unit);
      if (!Number.isInteger(value) || value < min || value > max) errors[key] = `${min}〜${max}の整数を入力してください。`;
      else state[key] = value;
    }
    if (typeof state.stageColor !== 'string' || !/^#[\da-f]{6}$/i.test(state.stageColor)) errors.stageColor = '#から始まる6桁のHEX色を入力してください。';
    if (Object.keys(errors).length) return { valid: false, errors, css: '', html: '' };
    const horizontal = corners.map((_, i) => state.mode === 'uniform' ? state.uniform : state[`h${i}`]);
    const vertical = state.mode === 'ellipse' ? corners.map((_, i) => state[`v${i}`]) : [...horizontal];
    const format = values => compress(values).map(value => value === 0 ? '0' : `${value}${state.unit}`).join(' ');
    const radius = format(horizontal) + (horizontal.some((value, i) => value !== vertical[i]) ? ` / ${format(vertical)}` : '');
    const x = horizontal.map(value => state.unit === '%' ? value * state.width / 100 : value);
    const y = vertical.map(value => state.unit === '%' ? value * state.height / 100 : value);
    const normalized = x[0] + x[1] > state.width || x[2] + x[3] > state.width || y[0] + y[3] > state.height || y[1] + y[2] > state.height;
    const declaration = `border-radius: ${radius};`;
    const css = `.radius-shape {\n  width: ${state.width}px;\n  height: ${state.height}px;\n  ${declaration}\n  background-color: #ffff00;\n  box-sizing: border-box;\n}`;
    const html = '<div class="radius-shape"></div>';
    return { valid: true, errors, state, radius, horizontal, vertical, normalized, declaration, css, html };
  };
  const mount = ({ workspace, copyText, showToast }) => {
    const labels = { width: '幅 (px)', height: '高さ (px)', uniform: '全角統一半径', ...Object.fromEntries(corners.flatMap((corner, i) => [[`h${i}`, `${corner}／水平`], [`v${i}`, `${corner}／垂直`]])) };
    const pair = key => `<div class="radius-generator__field" data-radius-group="${key}"><label for="radius-${key}">${labels[key]} <small data-radius-limit="${key}"></small></label><div class="radius-generator__pair"><input type="range" step="1" data-radius-range="${key}" aria-label="${labels[key]}（スライダー）" /><input type="number" step="1" required id="radius-${key}" data-radius-field="${key}" aria-describedby="radius-error-${key}" /></div><span class="radius-generator__error" id="radius-error-${key}"></span></div>`;
    workspace.innerHTML = `<div class="radius-generator">
      <div class="radius-generator__toolbar"><span class="section-index">RADIUS SETTINGS</span><div class="workspace-actions"><button type="button" class="workspace-action" data-radius-sample>SAMPLE</button><button type="button" class="workspace-action" data-radius-clear>CLEAR</button></div></div>
      <div class="radius-generator__presets" role="group" aria-label="角丸プリセット">${Object.entries({ card: 'CARD', pill: 'PILL', circle: 'CIRCLE', ellipse: 'ELLIPSE', bubble: 'BUBBLE', blob: 'BLOB' }).map(([key, label]) => `<button type="button" data-radius-preset="${key}">${label}</button>`).join('')}</div>
      <div class="radius-generator__layout"><section class="radius-generator__settings" aria-label="角丸設定">
      <div class="radius-generator__field"><label for="radius-mode">指定モード</label><select id="radius-mode" data-radius-field="mode" aria-describedby="radius-error-mode"><option value="uniform">UNIFORM／全角統一</option><option value="corners">4 CORNERS／4隅個別</option><option value="ellipse">ELLIPTICAL／楕円8値</option></select><span class="radius-generator__error" id="radius-error-mode"></span></div>
      <div class="radius-generator__field"><label for="radius-unit">半径の単位</label><select id="radius-unit" data-radius-field="unit" aria-describedby="radius-error-unit"><option>px</option><option>%</option></select><span class="radius-generator__error" id="radius-error-unit"></span></div>
      ${['width', 'height', ...radiusKeys].map(pair).join('')}
      <div class="radius-generator__field radius-generator__color"><label for="radius-stageColor">プレビュー背景色（出力対象外）</label><div class="radius-generator__pair"><input type="color" aria-label="プレビュー背景色を選択" data-radius-color /><input type="text" id="radius-stageColor" data-radius-field="stageColor" maxlength="7" spellcheck="false" autocapitalize="off" aria-describedby="radius-error-stageColor" /></div><span class="radius-generator__error" id="radius-error-stageColor"></span></div>
      <p class="radius-generator__hint">半径は左上→右上→右下→左下の順です。単位・モードを切り替えても入力値は保持します。単位変更は数値を保って再解釈し、換算しません。</p>
      </section><section class="radius-generator__preview" aria-labelledby="radius-preview-title"><div class="workspace-panel__header"><h3 id="radius-preview-title">LIVE PREVIEW</h3></div><p data-radius-summary></p><div class="radius-generator__stage" tabindex="0" role="region" aria-label="角丸プレビュー・矢印キーでスクロール"><div class="radius-generator__canvas"><div data-radius-shape aria-hidden="true"></div></div></div>
      <p class="radius-generator__value"><code data-radius-value></code><button type="button" data-radius-copy="declaration">COPY VALUE</button></p><p data-radius-note></p><p>%の水平半径は要素の幅、垂直半径は高さが基準です。どちらかの半径が0の角は直角になります。寸法は縮小せず、広い図形は領域内をスクロールして確認できます。</p><p>CSSには幅・高さ・黄色背景を含めます。プレビュー背景色は含めません。border-radiusだけを使う場合はCOPY VALUEを選択してください。</p></section></div>
      <p class="radius-generator__status" role="status" aria-live="polite" data-radius-status></p>
      <div class="radius-generator__outputs">${['css', 'html'].map(type => `<section><div class="workspace-panel__header"><label for="radius-output-${type}">OUTPUT / ${type.toUpperCase()}</label><button type="button" data-radius-copy="${type}">COPY ${type.toUpperCase()}</button></div><textarea id="radius-output-${type}" data-radius-output="${type}" readonly spellcheck="false" aria-label="生成${type.toUpperCase()}"></textarea></section>`).join('')}</div></div>`;
    const fields = [...workspace.querySelectorAll('[data-radius-field]')];
    const ranges = [...workspace.querySelectorAll('[data-radius-range]')];
    const color = workspace.querySelector('[data-radius-color]');
    const shape = workspace.querySelector('[data-radius-shape]');
    let result;
    const render = () => {
      const raw = Object.fromEntries(fields.map(field => [field.dataset.radiusField, field.value]));
      result = generate(raw);
      fields.forEach(field => {
        const key = field.dataset.radiusField;
        field.disabled = inactive(raw.mode, key);
        field.setAttribute('aria-invalid', String(Boolean(result.errors[key])));
        workspace.querySelector(`#radius-error-${key}`).textContent = result.errors[key] || '';
        if (!['width', 'height', ...radiusKeys].includes(key)) return;
        const [min, max] = rangeFor(key, raw.unit);
        field.min = min; field.max = max;
        const slider = workspace.querySelector(`[data-radius-range="${key}"]`);
        slider.min = min; slider.max = max; slider.disabled = field.disabled;
        if (!result.errors[key]) slider.value = field.value;
        workspace.querySelector(`[data-radius-limit="${key}"]`).textContent = `${min}–${max}${key === 'width' || key === 'height' ? 'px' : raw.unit}`;
        workspace.querySelector(`[data-radius-group="${key}"]`).hidden = field.disabled;
      });
      if (!result.errors.stageColor) color.value = raw.stageColor;
      workspace.querySelector('[data-radius-status]').textContent = result.valid ? `READY / ${raw.mode === 'ellipse' ? '8' : raw.mode === 'uniform' ? '1' : '4'} VALUES / CSS + HTML` : `INVALID INPUT / ${Object.keys(result.errors).length} ERRORS — 設定を確認してください。`;
      workspace.querySelector('[data-radius-summary]').textContent = result.valid ? `${result.state.width} × ${result.state.height}px / ${result.state.unit} / ${result.state.mode.toUpperCase()}` : '無効な設定のためプレビューを停止しています。';
      workspace.querySelector('[data-radius-value]').textContent = result.valid ? result.declaration : '—';
      workspace.querySelector('[data-radius-note]').textContent = result.valid && result.normalized ? 'RADIUS NORMALIZATION：隣り合う半径の合計が辺の長さを超えるため、ブラウザがすべての半径を同比率で縮小して描画します。CSSには指定値を出力します。' : '半径の入力値と寸法から、ブラウザが実際の角の形を描画します。';
      for (const type of ['css', 'html']) workspace.querySelector(`[data-radius-output="${type}"]`).value = result[type];
      workspace.querySelectorAll('[data-radius-copy]').forEach(button => { button.disabled = !result.valid; });
      shape.hidden = !result.valid;
      if (!result.valid) return;
      Object.assign(shape.style, { width: `${result.state.width}px`, height: `${result.state.height}px`, borderRadius: result.radius });
      workspace.querySelector('.radius-generator__stage').style.backgroundColor = result.state.stageColor;
    };
    const apply = state => { fields.forEach(field => { field.value = state[field.dataset.radiusField]; }); render(); };
    fields.forEach(field => field.addEventListener('input', render));
    ranges.forEach(slider => slider.addEventListener('input', () => { workspace.querySelector(`[data-radius-field="${slider.dataset.radiusRange}"]`).value = slider.value; render(); }));
    color.addEventListener('input', () => { workspace.querySelector('[data-radius-field="stageColor"]').value = color.value; render(); });
    workspace.querySelector('[data-radius-sample]').addEventListener('click', () => apply(presets.blob));
    workspace.querySelector('[data-radius-clear]').addEventListener('click', () => { apply(defaults); fields[0].focus(); showToast('表示内容をリセットしました。', 'reset'); });
    workspace.querySelectorAll('[data-radius-preset]').forEach(button => button.addEventListener('click', () => apply(presets[button.dataset.radiusPreset])));
    workspace.querySelectorAll('[data-radius-copy]').forEach(button => button.addEventListener('click', () => { if (result.valid) copyText(result[button.dataset.radiusCopy]); }));
    apply(defaults);
  };
  globalThis.MarkBenchBorderRadiusGenerator = { corners, choices, defaults, presets, radiusKeys, rangeFor, inactive, compress, generate, mount };
})();
