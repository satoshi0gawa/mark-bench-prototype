(() => {
  const MAX_PROPERTIES = 100;
  const MAX_INPUT_LENGTH = 10000;
  const CATEGORIES = Object.freeze(['COLOR', 'TYPOGRAPHY', 'SPACING', 'SIZE', 'BORDER', 'SHADOW', 'MOTION', 'OTHER']);
  const SAMPLE_PROPERTIES = Object.freeze([
    { category: 'COLOR', name: '--color-primary', value: '#18243b', fallback: '#111827', themeValue: '#e5e7eb', description: 'Primary text and navigation color' },
    { category: 'COLOR', name: '--color-accent', value: '#ffd51b', fallback: '#facc15', themeValue: '#ffe45c', description: 'Accent and focus color' },
    { category: 'COLOR', name: '--color-surface', value: '#ffffff', fallback: '#fff', themeValue: '#111827', description: 'Page surface color' },
    { category: 'TYPOGRAPHY', name: '--font-body', value: '"BIZ UDPGothic", sans-serif', fallback: 'sans-serif', themeValue: '', description: 'Body font stack' },
    { category: 'SPACING', name: '--space-page', value: 'clamp(1rem, 4vw, 3rem)', fallback: '1.5rem', themeValue: '', description: 'Responsive page gutter' },
    { category: 'SIZE', name: '--content-width', value: '75rem', fallback: '1200px', themeValue: '', description: 'Maximum content width' },
    { category: 'BORDER', name: '--border-default', value: '1px solid rgb(24 36 59 / 18%)', fallback: '1px solid #d1d5db', themeValue: '1px solid rgb(229 231 235 / 24%)', description: 'Default divider' },
    { category: 'MOTION', name: '--duration-fast', value: '180ms', fallback: '0.18s', themeValue: '', description: 'Fast interaction duration' },
  ]);

  const normalizePropertyName = (value = '') => {
    const name = String(value).trim().replace(/\s+/gu, '-');
    if (!name) return '';
    return `--${name.replace(/^-+/u, '')}`;
  };
  const isValidPropertyName = (value = '') => /^--(?:[A-Za-z_]|[^\u0000-\u007f])(?:[A-Za-z0-9_-]|[^\u0000-\u007f])*$/u.test(String(value));
  const isValidScope = (value = '') => {
    const selector = String(value).trim();
    return Boolean(selector) && !/[{};]/u.test(selector);
  };
  const escapeCssComment = (value = '') => String(value).replace(/\*\//gu, '* /').replace(/[\r\n]+/gu, ' ').trim();
  const normalizeRow = (row = {}) => ({
    category: CATEGORIES.includes(row.category) ? row.category : 'OTHER',
    name: normalizePropertyName(row.name),
    value: String(row.value || '').trim(),
    fallback: String(row.fallback || '').trim(),
    themeValue: String(row.themeValue || '').trim(),
    description: String(row.description || '').trim(),
  });
  const hasRowContent = (row) => Boolean(row.name || row.value || row.fallback || row.themeValue || row.description);
  const usageForRow = (row) => `var(${row.name}${row.fallback ? `, ${row.fallback}` : ''})`;
  const looksLikeColor = (value = '') => /^(?:#[\da-f]{3,8}|(?:rgb|hsl|hwb|lab|lch|oklab|oklch|color)\(|(?:transparent|currentcolor|black|white|red|blue|green|yellow|gray|grey)\b)/iu.test(String(value).trim());

  const generate = (input = {}) => {
    const scope = String(input.scope || ':root').trim();
    const themeScope = String(input.themeScope || '[data-theme="dark"]').trim();
    const includeComments = input.includeComments !== false;
    const indentSize = Number(input.indentSize) === 4 ? 4 : 2;
    const indent = ' '.repeat(indentSize);
    const rows = (Array.isArray(input.rows) ? input.rows : []).slice(0, MAX_PROPERTIES).map(normalizeRow).filter(hasRowContent);
    const warnings = [];
    if (!isValidScope(scope)) warnings.push({ level: 'error', code: 'SCOPE_INVALID', message: 'DEFAULT SCOPEへ有効なCSSセレクターを入力してください。' });
    if (rows.some((row) => row.themeValue) && !isValidScope(themeScope)) warnings.push({ level: 'error', code: 'THEME_SCOPE_INVALID', message: 'テーマ上書き用の有効なCSSセレクターを入力してください。' });
    if (!rows.length) warnings.push({ level: 'warning', code: 'PROPERTY_EMPTY', message: 'カスタムプロパティを追加してください。' });
    const names = new Map();
    rows.forEach((row, index) => {
      const rowNumber = index + 1;
      if (!row.name) warnings.push({ level: 'error', code: 'NAME_REQUIRED', message: `PROPERTY ${rowNumber}: 名前を入力してください。` });
      else if (!isValidPropertyName(row.name)) warnings.push({ level: 'error', code: 'NAME_INVALID', message: `PROPERTY ${rowNumber}: ${row.name} は有効なカスタムプロパティ名ではありません。` });
      if (row.name && names.has(row.name)) warnings.push({ level: 'error', code: 'NAME_DUPLICATE', message: `PROPERTY ${rowNumber}: ${row.name} がPROPERTY ${names.get(row.name)}と重複しています。` });
      if (row.name) names.set(row.name, rowNumber);
      if (!row.value) warnings.push({ level: 'error', code: 'VALUE_REQUIRED', message: `PROPERTY ${rowNumber}: デフォルト値を入力してください。` });
      if (/[{}]/u.test(row.value) || /[{}]/u.test(row.themeValue)) warnings.push({ level: 'error', code: 'VALUE_INVALID', message: `PROPERTY ${rowNumber}: 値にブロック用の波括弧は使用できません。` });
      if (row.name.length > 200 || row.value.length > MAX_INPUT_LENGTH || row.fallback.length > MAX_INPUT_LENGTH || row.themeValue.length > MAX_INPUT_LENGTH) warnings.push({ level: 'error', code: 'VALUE_LENGTH', message: `PROPERTY ${rowNumber}: 入力文字数が上限を超えています。` });
      if (row.value && row.value.endsWith(';')) warnings.push({ level: 'warning', code: 'TRAILING_SEMICOLON', message: `PROPERTY ${rowNumber}: 値末尾のセミコロンは省略できます。` });
    });

    const validRows = rows.filter((row) => row.name && isValidPropertyName(row.name) && row.value && !/[{}]/u.test(row.value));
    const declarationLines = [];
    validRows.forEach((row) => {
      if (includeComments && row.description) declarationLines.push(`${indent}/* ${escapeCssComment(row.description)} */`);
      declarationLines.push(`${indent}${row.name}: ${row.value};`);
    });
    const cssSections = [];
    if (validRows.length && isValidScope(scope)) cssSections.push(`${scope} {\n${declarationLines.join('\n')}\n}`);
    const themedRows = validRows.filter((row) => row.themeValue && !/[{}]/u.test(row.themeValue));
    if (themedRows.length && isValidScope(themeScope)) {
      const themedLines = [];
      themedRows.forEach((row) => {
        if (includeComments && row.description) themedLines.push(`${indent}/* ${escapeCssComment(row.description)} */`);
        themedLines.push(`${indent}${row.name}: ${row.themeValue};`);
      });
      cssSections.push(`${themeScope} {\n${themedLines.join('\n')}\n}`);
    }
    const css = cssSections.join('\n\n');
    const usage = validRows.map((row) => `${row.name}: ${usageForRow(row)};`).join('\n');
    const jsonObject = {
      default: Object.fromEntries(validRows.map((row) => [row.name, row.value])),
      theme: Object.fromEntries(themedRows.map((row) => [row.name, row.themeValue])),
    };
    const json = validRows.length ? JSON.stringify(jsonObject, null, indentSize) : '';
    const hasErrors = warnings.some((warning) => warning.level === 'error');
    return {
      scope,
      themeScope,
      includeComments,
      indentSize,
      rows,
      validRows,
      themedRows,
      warnings,
      hasErrors,
      css,
      usage,
      json,
      metrics: {
        properties: validRows.length,
        themed: themedRows.length,
        categories: new Set(validRows.map((row) => row.category)).size,
        colors: validRows.filter((row) => looksLikeColor(row.value)).length,
        errors: warnings.filter((warning) => warning.level === 'error').length,
        lines: css ? css.split('\n').length : 0,
      },
    };
  };

  const mount = ({ workspace, copyText, showToast, escapeMarkup }) => {
    workspace.innerHTML = `
      <div class="custom-property-builder">
        <div class="workspace-grid workspace-grid--custom-properties">
          <section class="custom-property-builder__settings" aria-labelledby="custom-property-settings-title">
            <div class="workspace-panel__header"><span id="custom-property-settings-title">BUILDER SETTINGS</span><div class="workspace-actions"><button class="workspace-action" type="button" data-property-sample>SAMPLE</button><button class="workspace-action" type="button" data-property-reset disabled>RESET</button></div></div>
            <div class="custom-property-builder__settings-body">
              <label><span>DEFAULT SCOPE</span><input type="text" maxlength="500" value=":root" spellcheck="false" data-property-setting="scope"></label>
              <label><span>THEME SCOPE</span><input type="text" maxlength="500" value="[data-theme=&quot;dark&quot;]" spellcheck="false" data-property-setting="themeScope"></label>
              <fieldset><legend>INDENT</legend><label><input type="radio" name="property-indent" value="2" data-property-indent checked><i>2 SPACES</i></label><label><input type="radio" name="property-indent" value="4" data-property-indent><i>4 SPACES</i></label></fieldset>
              <label class="custom-property-builder__check"><input type="checkbox" data-property-comments checked><i>INCLUDE DESCRIPTION COMMENTS</i></label>
            </div>
          </section>

          <section class="custom-property-builder__properties" aria-labelledby="custom-property-list-title">
            <div class="workspace-panel__header"><span id="custom-property-list-title">CUSTOM PROPERTIES</span><button class="workspace-action" type="button" data-property-add>ADD PROPERTY</button></div>
            <div class="custom-property-builder__list" data-property-list><p class="custom-property-builder__empty-list" data-property-empty>ADD PROPERTYまたはSAMPLEから変数を追加してください。</p></div>
            <div class="workspace-panel__footer"><span data-property-count>0 / ${MAX_PROPERTIES} PROPERTIES</span><span>CASE-SENSITIVE NAMES</span></div>
          </section>

          <section class="custom-property-builder__preview" aria-labelledby="custom-property-preview-title">
            <div class="workspace-panel__header"><span id="custom-property-preview-title">TOKEN PREVIEW</span><span data-property-preview-state>NO TOKENS</span></div>
            <div class="custom-property-builder__preview-grid" data-property-preview><p>色・値・テーマ上書きの概要を表示します。</p></div>
          </section>

          <section class="custom-property-builder__output custom-property-builder__output--css" aria-labelledby="custom-property-css-title">
            <div class="workspace-panel__header"><span id="custom-property-css-title">GENERATED CSS</span><button class="workspace-action workspace-action--copy" type="button" data-property-copy="css" disabled>COPY CSS</button></div>
            <pre><code data-property-output="css"><span class="custom-property-builder__empty-output">/* Add custom properties */</span></code></pre>
          </section>

          <section class="custom-property-builder__output custom-property-builder__output--usage" aria-labelledby="custom-property-usage-title">
            <div class="workspace-panel__header"><span id="custom-property-usage-title">VAR() USAGE</span><button class="workspace-action workspace-action--copy" type="button" data-property-copy="usage" disabled>COPY USAGE</button></div>
            <pre><code data-property-output="usage"><span class="custom-property-builder__empty-output">/* var() references */</span></code></pre>
          </section>

          <section class="custom-property-builder__output custom-property-builder__output--json" aria-labelledby="custom-property-json-title">
            <div class="workspace-panel__header"><span id="custom-property-json-title">TOKEN JSON</span><button class="workspace-action workspace-action--copy" type="button" data-property-copy="json" disabled>COPY JSON</button></div>
            <pre><code data-property-output="json"><span class="custom-property-builder__empty-output">{}</span></code></pre>
          </section>

          <section class="custom-property-builder__validation" aria-labelledby="custom-property-validation-title">
            <div class="workspace-panel__header"><span id="custom-property-validation-title">VALIDATION</span><span data-property-validation-state>INPUT REQUIRED</span></div>
            <ul data-property-warnings><li class="custom-property-builder__valid"><strong>WAITING</strong><span>カスタムプロパティの検証結果を表示します。</span></li></ul>
          </section>

          <dl class="custom-property-builder__metrics" aria-label="CSSカスタムプロパティの集計結果"><div><dt>PROPERTIES</dt><dd data-property-metric="properties">0</dd></div><div><dt>THEMED</dt><dd data-property-metric="themed">0</dd></div><div><dt>CATEGORIES</dt><dd data-property-metric="categories">0</dd></div><div><dt>COLORS</dt><dd data-property-metric="colors">0</dd></div><div><dt>ERRORS</dt><dd data-property-metric="errors">0</dd></div><div><dt>CSS LINES</dt><dd data-property-metric="lines">0</dd></div></dl>
        </div>
      </div>`;

    const list = workspace.querySelector('[data-property-list]');
    const emptyList = workspace.querySelector('[data-property-empty]');
    const resetButton = workspace.querySelector('[data-property-reset]');
    let rowSequence = 0;
    let currentResult = generate();

    const addRow = (data = {}) => {
      if (list.querySelectorAll('[data-property-row]').length >= MAX_PROPERTIES) return;
      rowSequence += 1;
      const normalized = normalizeRow(data);
      const row = document.createElement('article');
      row.className = 'custom-property-builder__row';
      row.dataset.propertyRow = String(rowSequence);
      row.innerHTML = `<div class="custom-property-builder__row-header"><strong>PROPERTY_${String(rowSequence).padStart(2, '0')}</strong><button type="button" data-property-remove>REMOVE</button></div><div class="custom-property-builder__row-fields"><label><span>CATEGORY</span><select data-property-field="category">${CATEGORIES.map((category) => `<option value="${category}"${category === normalized.category ? ' selected' : ''}>${category}</option>`).join('')}</select></label><label class="custom-property-builder__name"><span>NAME</span><input type="text" maxlength="200" placeholder="--color-primary" value="${escapeMarkup(normalized.name)}" spellcheck="false" data-property-field="name"></label><label class="custom-property-builder__value"><span>DEFAULT VALUE</span><input type="text" maxlength="${MAX_INPUT_LENGTH}" placeholder="#18243b / 1rem / clamp(...)" value="${escapeMarkup(normalized.value)}" spellcheck="false" data-property-field="value"></label><label><span>VAR() FALLBACK <small>OPTIONAL</small></span><input type="text" maxlength="${MAX_INPUT_LENGTH}" placeholder="#111827" value="${escapeMarkup(normalized.fallback)}" spellcheck="false" data-property-field="fallback"></label><label><span>THEME OVERRIDE <small>OPTIONAL</small></span><input type="text" maxlength="${MAX_INPUT_LENGTH}" placeholder="#e5e7eb" value="${escapeMarkup(normalized.themeValue)}" spellcheck="false" data-property-field="themeValue"></label><label class="custom-property-builder__description"><span>DESCRIPTION <small>OPTIONAL COMMENT</small></span><input type="text" maxlength="500" placeholder="Primary text color" value="${escapeMarkup(normalized.description)}" data-property-field="description"></label></div>`;
      list.append(row);
      emptyList.hidden = true;
    };

    const collect = () => ({
      scope: workspace.querySelector('[data-property-setting="scope"]').value,
      themeScope: workspace.querySelector('[data-property-setting="themeScope"]').value,
      indentSize: Number(workspace.querySelector('[data-property-indent]:checked')?.value || 2),
      includeComments: workspace.querySelector('[data-property-comments]').checked,
      rows: [...list.querySelectorAll('[data-property-row]')].map((row) => {
        const data = {};
        row.querySelectorAll('[data-property-field]').forEach((field) => { data[field.dataset.propertyField] = field.value; });
        return data;
      }),
    });

    const renderPreview = () => {
      const preview = workspace.querySelector('[data-property-preview]');
      preview.innerHTML = '';
      if (!currentResult.validRows.length) {
        preview.innerHTML = '<p>色・値・テーマ上書きの概要を表示します。</p>';
        workspace.querySelector('[data-property-preview-state]').textContent = 'NO TOKENS';
        return;
      }
      currentResult.validRows.forEach((row) => {
        const card = document.createElement('article');
        card.className = 'custom-property-builder__token';
        const visual = document.createElement('div');
        visual.className = 'custom-property-builder__token-visual';
        const canColor = typeof CSS !== 'undefined' && CSS.supports('color', row.value);
        if (canColor) {
          const defaultColor = document.createElement('span');
          defaultColor.style.background = row.value;
          defaultColor.title = 'DEFAULT';
          visual.append(defaultColor);
          if (row.themeValue && CSS.supports('color', row.themeValue)) {
            const themeColor = document.createElement('span');
            themeColor.style.background = row.themeValue;
            themeColor.title = 'THEME';
            visual.append(themeColor);
          }
        } else {
          visual.textContent = row.category === 'TYPOGRAPHY' ? 'Aa' : '{ }';
        }
        const body = document.createElement('div');
        body.innerHTML = `<span>${escapeMarkup(row.category)}</span><strong>${escapeMarkup(row.name)}</strong><code>${escapeMarkup(row.value)}</code>${row.themeValue ? `<small>THEME: ${escapeMarkup(row.themeValue)}</small>` : ''}`;
        card.append(visual, body);
        preview.append(card);
      });
      workspace.querySelector('[data-property-preview-state]').textContent = `${currentResult.validRows.length} TOKEN${currentResult.validRows.length === 1 ? '' : 'S'}`;
    };

    const update = () => {
      currentResult = generate(collect());
      ['css', 'usage', 'json'].forEach((type) => {
        const value = currentResult[type];
        workspace.querySelector(`[data-property-output="${type}"]`).textContent = value || (type === 'json' ? '{}' : type === 'usage' ? '/* var() references */' : '/* Add custom properties */');
        workspace.querySelector(`[data-property-copy="${type}"]`).disabled = !value || currentResult.hasErrors;
      });
      const warnings = workspace.querySelector('[data-property-warnings]');
      warnings.innerHTML = currentResult.warnings.length
        ? currentResult.warnings.map((warning) => `<li data-level="${warning.level}"><strong>${escapeMarkup(warning.code)}</strong><span>${escapeMarkup(warning.message)}</span></li>`).join('')
        : '<li class="custom-property-builder__valid"><strong>VALID</strong><span>使用可能なカスタムプロパティです。</span></li>';
      const state = workspace.querySelector('[data-property-validation-state]');
      const errors = currentResult.metrics.errors;
      state.textContent = errors ? `${errors} ERROR${errors === 1 ? '' : 'S'}` : currentResult.warnings.length ? `${currentResult.warnings.length} RECOMMENDATION${currentResult.warnings.length === 1 ? '' : 'S'}` : 'VALID';
      state.dataset.state = errors ? 'invalid' : 'valid';
      Object.entries(currentResult.metrics).forEach(([key, value]) => { workspace.querySelector(`[data-property-metric="${key}"]`).textContent = value; });
      const count = list.querySelectorAll('[data-property-row]').length;
      workspace.querySelector('[data-property-count]').textContent = `${count} / ${MAX_PROPERTIES} PROPERTIES`;
      workspace.querySelector('[data-property-add]').disabled = count >= MAX_PROPERTIES;
      emptyList.hidden = count > 0;
      resetButton.disabled = count === 0 && collect().scope === ':root' && collect().themeScope === '[data-theme="dark"]';
      renderPreview();
    };

    const reset = () => {
      list.querySelectorAll('[data-property-row]').forEach((row) => row.remove());
      rowSequence = 0;
      workspace.querySelector('[data-property-setting="scope"]').value = ':root';
      workspace.querySelector('[data-property-setting="themeScope"]').value = '[data-theme="dark"]';
      workspace.querySelector('[data-property-indent][value="2"]').checked = true;
      workspace.querySelector('[data-property-comments]').checked = true;
      update();
    };

    workspace.querySelector('[data-property-add]').addEventListener('click', () => { addRow(); update(); });
    workspace.querySelector('[data-property-sample]').addEventListener('click', () => {
      list.querySelectorAll('[data-property-row]').forEach((row) => row.remove());
      rowSequence = 0;
      workspace.querySelector('[data-property-setting="scope"]').value = ':root';
      workspace.querySelector('[data-property-setting="themeScope"]').value = '[data-theme="dark"]';
      workspace.querySelector('[data-property-indent][value="2"]').checked = true;
      workspace.querySelector('[data-property-comments]').checked = true;
      SAMPLE_PROPERTIES.forEach(addRow);
      update();
    });
    resetButton.addEventListener('click', reset);
    list.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-property-remove]');
      if (!remove) return;
      remove.closest('[data-property-row]').remove();
      update();
    });
    workspace.addEventListener('input', (event) => { if (event.target.matches('input, select')) update(); });
    workspace.addEventListener('change', (event) => { if (event.target.matches('input, select')) update(); });
    workspace.addEventListener('focusout', (event) => {
      if (!event.target.matches('[data-property-field="name"]')) return;
      event.target.value = normalizePropertyName(event.target.value);
      update();
    });
    workspace.querySelectorAll('[data-property-copy]').forEach((button) => button.addEventListener('click', () => copyText(currentResult[button.dataset.propertyCopy], `${button.dataset.propertyCopy.toUpperCase()}をコピーしました。`)));
    update();
  };

  const api = { MAX_PROPERTIES, MAX_INPUT_LENGTH, CATEGORIES, SAMPLE_PROPERTIES, normalizePropertyName, isValidPropertyName, isValidScope, escapeCssComment, normalizeRow, usageForRow, looksLikeColor, generate, mount };
  if (typeof window !== 'undefined') window.MarkBenchCssCustomPropertyBuilder = api;
  if (typeof globalThis !== 'undefined') globalThis.MarkBenchCssCustomPropertyBuilder = api;
})();
