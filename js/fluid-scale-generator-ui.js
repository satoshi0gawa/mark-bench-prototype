(() => {
  const mount = ({ workspace, copyText, showToast, escapeMarkup }) => {
    const generator = globalThis.MarkBenchFluidScaleGenerator;
    if (!workspace || !generator) return false;

    const escape = escapeMarkup || ((value = '') => String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;'));

    workspace.innerHTML = `
      <div class="fluid-scale" data-fluid-scale>
        <div class="fluid-scale__mode-tabs" role="group" aria-label="計算モード">
          <button type="button" aria-pressed="true" data-fluid-mode="system"><span>SCALE SYSTEM</span><small>TYPE / SPACE / SIZE</small></button>
          <button type="button" aria-pressed="false" data-fluid-mode="single"><span>SINGLE VALUE</span><small>ONE CLAMP TOKEN</small></button>
        </div>
        <div class="workspace-grid workspace-grid--fluid-scale">
          <section class="workspace-panel fluid-scale__control-pane" aria-labelledby="fluid-input-title">
            <div class="workspace-panel__header"><span id="fluid-input-title">INPUT / SCALE RULES</span><div class="workspace-actions"><button class="workspace-action" type="button" data-fluid-sample>SAMPLE</button><button class="workspace-action" type="button" data-fluid-reset>RESET</button></div></div>

            <div class="fluid-scale__global-settings">
              <label><span>MIN VIEWPORT</span><span class="fluid-scale__input-with-unit"><input type="number" min="${generator.MIN_VIEWPORT}" max="${generator.MAX_VIEWPORT}" step="10" value="360" data-fluid-input="viewportMin"><i>PX</i></span></label>
              <label><span>MAX VIEWPORT</span><span class="fluid-scale__input-with-unit"><input type="number" min="${generator.MIN_VIEWPORT}" max="${generator.MAX_VIEWPORT}" step="10" value="1440" data-fluid-input="viewportMax"><i>PX</i></span></label>
              <label><span>ROOT SIZE</span><span class="fluid-scale__input-with-unit"><input type="number" min="${generator.MIN_ROOT_SIZE}" max="${generator.MAX_ROOT_SIZE}" step="1" value="16" data-fluid-input="rootSize"><i>PX</i></span></label>
              <label><span>PRECISION</span><select data-fluid-input="precision"><option value="2">2 DEC</option><option value="3" selected>3 DEC</option><option value="4">4 DEC</option><option value="5">5 DEC</option></select></label>
            </div>

            <div class="fluid-scale__global-options">
              <fieldset class="fluid-scale__option-group">
                <legend>OUTPUT UNIT</legend>
                <label><input type="radio" name="fluid-unit" value="rem" checked data-fluid-unit><span>REM</span></label>
                <label><input type="radio" name="fluid-unit" value="px" data-fluid-unit><span>PX</span></label>
              </fieldset>
              <fieldset class="fluid-scale__option-group">
                <legend>FLUID BASIS</legend>
                <label><input type="radio" name="fluid-basis" value="vi" checked data-fluid-basis><span>VI</span></label>
                <label><input type="radio" name="fluid-basis" value="cqi" data-fluid-basis><span>CQI</span></label>
              </fieldset>
            </div>

            <div data-fluid-system>
              <section class="fluid-scale__family" aria-labelledby="fluid-type-title">
                <header><div><small>01 / TYPOGRAPHY</small><h3 id="fluid-type-title">TYPE SCALE</h3></div><span>MODULAR STEPS</span></header>
                <div class="fluid-scale__field-grid fluid-scale__field-grid--three">
                  <label><span>MOBILE BASE</span><span class="fluid-scale__input-with-unit"><input type="number" min="0" max="256" step="0.1" value="16" data-fluid-input="typeMinBase"><i>PX</i></span></label>
                  <label><span>DESKTOP BASE</span><span class="fluid-scale__input-with-unit"><input type="number" min="0" max="256" step="0.1" value="18" data-fluid-input="typeMaxBase"><i>PX</i></span></label>
                  <label><span>STEP PRESET</span><select data-fluid-input="typePreset"><option value="compact">COMPACT / 05</option><option value="standard" selected>STANDARD / 08</option><option value="extended">EXTENDED / 10</option></select></label>
                  <label><span>MOBILE RATIO</span><input type="number" min="1" max="2" step="0.001" value="1.2" data-fluid-input="typeMinRatio"></label>
                  <label><span>DESKTOP RATIO</span><input type="number" min="1" max="2" step="0.001" value="1.25" data-fluid-input="typeMaxRatio"></label>
                  <label><span>TOKEN PREFIX</span><input type="text" maxlength="32" value="--font" spellcheck="false" data-fluid-input="typePrefix"></label>
                </div>
              </section>

              <section class="fluid-scale__family" aria-labelledby="fluid-space-title">
                <header><div><small>02 / SPACING</small><h3 id="fluid-space-title">SPACE SCALE</h3></div><span>SHARED UNIT</span></header>
                <div class="fluid-scale__field-grid fluid-scale__field-grid--three">
                  <label><span>MOBILE UNIT</span><span class="fluid-scale__input-with-unit"><input type="number" min="0" max="128" step="0.1" value="4" data-fluid-input="spaceMinBase"><i>PX</i></span></label>
                  <label><span>DESKTOP UNIT</span><span class="fluid-scale__input-with-unit"><input type="number" min="0" max="128" step="0.1" value="5" data-fluid-input="spaceMaxBase"><i>PX</i></span></label>
                  <label><span>MULTIPLIERS</span><select data-fluid-input="spacePreset"><option value="standard" selected>1 / 2 / 3 / 4 / 6 / 8 / 12 / 16</option><option value="fibonacci">1 / 2 / 3 / 5 / 8 / 13</option></select></label>
                  <label class="fluid-scale__field--wide"><span>TOKEN PREFIX</span><input type="text" maxlength="32" value="--space" spellcheck="false" data-fluid-input="spacePrefix"></label>
                </div>
              </section>

              <section class="fluid-scale__family fluid-scale__family--sizes" aria-labelledby="fluid-size-title">
                <header><div><small>03 / SIZE</small><h3 id="fluid-size-title">CUSTOM SIZE TOKENS</h3></div><button type="button" data-fluid-add-size>+ ADD TOKEN</button></header>
                <div class="fluid-scale__size-list" data-fluid-size-list></div>
              </section>
            </div>

            <section class="fluid-scale__single" data-fluid-single hidden aria-labelledby="fluid-single-title">
              <header><div><small>SINGLE VALUE</small><h3 id="fluid-single-title">ONE CLAMP TOKEN</h3></div><span>PROPERTY NEUTRAL</span></header>
              <div class="fluid-scale__field-grid fluid-scale__field-grid--two">
                <label class="fluid-scale__field--wide"><span>TOKEN NAME</span><input type="text" maxlength="48" value="--fluid-value" spellcheck="false" data-fluid-input="singleName"></label>
                <label><span>MIN VALUE</span><span class="fluid-scale__input-with-unit"><input type="number" min="0" max="4096" step="0.1" value="16" data-fluid-input="singleMin"><i>PX</i></span></label>
                <label><span>MAX VALUE</span><span class="fluid-scale__input-with-unit"><input type="number" min="0" max="4096" step="0.1" value="48" data-fluid-input="singleMax"><i>PX</i></span></label>
                <label class="fluid-scale__field--wide"><span>PREVIEW AS</span><select data-fluid-input="singlePreview"><option value="font" selected>FONT SIZE</option><option value="spacing">SPACING</option><option value="size">SIZE</option></select></label>
              </div>
            </section>

            <div class="workspace-panel__footer"><span data-fluid-input-state data-state="ready" aria-live="polite">RULES READY</span><span data-fluid-mode-label>SCALE SYSTEM</span></div>
          </section>

          <section class="workspace-panel fluid-scale__preview-pane" aria-labelledby="fluid-preview-title">
            <div class="workspace-panel__header fluid-scale__output-header"><span id="fluid-preview-title">OUTPUT / LIVE PREVIEW</span><span>FLUID DEMO</span></div>
            <div class="fluid-scale__viewport-control">
              <label for="fluid-preview-width"><span>PREVIEW WIDTH</span><output data-fluid-preview-width-output>900PX</output></label>
              <input id="fluid-preview-width" type="range" min="360" max="1440" step="1" value="900" data-fluid-preview-width>
            </div>
            <div class="fluid-scale__preview" data-fluid-preview aria-live="polite"></div>
            <div class="workspace-panel__footer"><span data-fluid-output-state data-state="ready">TOKENS READY</span><span data-fluid-output-meta>REM + VI</span></div>
          </section>

          <section class="workspace-panel fluid-scale__data-pane fluid-scale__token-pane" aria-labelledby="fluid-token-title">
            <div class="workspace-panel__header fluid-scale__output-header"><span id="fluid-token-title">OUTPUT / SCALE TOKENS</span><span data-fluid-token-summary>19 TOKENS</span></div>
            <div class="fluid-scale__token-table-wrap">
              <table class="fluid-scale__token-table">
                <caption class="visually-hidden">生成した流体スケールトークン</caption>
                <thead><tr><th scope="col">TOKEN</th><th scope="col">MIN</th><th scope="col">CURRENT</th><th scope="col">MAX</th><th scope="col">ACTION</th></tr></thead>
                <tbody data-fluid-token-rows></tbody>
              </table>
            </div>
          </section>

          <section class="workspace-panel fluid-scale__data-pane fluid-scale__source-pane" aria-labelledby="fluid-source-title">
            <div class="workspace-panel__header fluid-scale__output-header"><span id="fluid-source-title">OUTPUT / SCALE SOURCE</span><span>CSS CUSTOM PROPERTIES</span></div>
            <div class="fluid-scale__source-tabs" role="group" aria-label="出力形式">
              <button type="button" aria-pressed="true" data-fluid-source-tab="tokens">CSS TOKENS</button>
              <button type="button" aria-pressed="false" data-fluid-source-tab="usage">USAGE SAMPLE</button>
            </div>
            <pre class="fluid-scale__source"><code data-fluid-source></code></pre>
          </section>

          <dl class="fluid-scale__metrics" aria-label="流体スケールの集計結果">
            <div><dt>TOKENS</dt><dd data-fluid-metric="tokens">19</dd></div>
            <div><dt>FLUID</dt><dd data-fluid-metric="fluid">19</dd></div>
            <div><dt>FIXED</dt><dd data-fluid-metric="fixed">0</dd></div>
            <div><dt>VIEWPORT</dt><dd data-fluid-metric="viewport">360–1440PX</dd></div>
            <div><dt>CURRENT</dt><dd data-fluid-metric="current">900PX</dd></div>
            <div><dt>WARNINGS</dt><dd data-fluid-metric="warnings">0</dd></div>
          </dl>

          <div class="fluid-scale__copy-actions">
            <button type="button" data-fluid-copy="tokens">COPY TOKENS</button>
            <button type="button" data-fluid-copy="usage">COPY USAGE</button>
            <button type="button" data-fluid-download>DOWNLOAD CSS</button>
          </div>

          <section class="fluid-scale__warnings" aria-labelledby="fluid-warnings-title" data-fluid-warnings-section hidden>
            <div class="fluid-scale__warnings-header"><span id="fluid-warnings-title">VALIDATION / NOTICES</span><span data-fluid-warning-count>0 ITEMS</span></div>
            <ul data-fluid-warnings></ul>
          </section>
        </div>
      </div>`;

    const defaultConfig = generator.cloneDefaultConfig();
    let mode = 'system';
    let sizeTokens = defaultConfig.sizes.map((token) => ({ ...token }));
    let currentResult = generator.generate(defaultConfig);
    let sourceTab = 'tokens';

    const query = (selector) => workspace.querySelector(selector);
    const queryAll = (selector) => [...workspace.querySelectorAll(selector)];
    const getInput = (name) => query(`[data-fluid-input="${name}"]`);
    const getValue = (name) => getInput(name)?.value ?? '';
    const numberValue = (name) => Number(getValue(name));
    const widthRange = query('[data-fluid-preview-width]');
    const sizeList = query('[data-fluid-size-list]');
    const source = query('[data-fluid-source]');
    const tokenRows = query('[data-fluid-token-rows]');
    const preview = query('[data-fluid-preview]');
    const systemPanel = query('[data-fluid-system]');
    const singlePanel = query('[data-fluid-single]');
    const warningsSection = query('[data-fluid-warnings-section]');
    const warningsList = query('[data-fluid-warnings]');
    const copyButtons = queryAll('[data-fluid-copy]');
    const downloadButton = query('[data-fluid-download]');

    const renderSizeRows = () => {
      sizeList.innerHTML = sizeTokens.map((token, index) => `
        <div class="fluid-scale__size-row" data-fluid-size-row="${index}">
          <span>${String(index + 1).padStart(2, '0')}</span>
          <label><span class="visually-hidden">トークン名</span><input type="text" maxlength="48" value="${escape(token.name)}" spellcheck="false" data-size-field="name"></label>
          <label><span class="visually-hidden">最小値</span><span class="fluid-scale__input-with-unit"><input type="number" min="0" max="4096" step="0.1" value="${escape(token.min)}" data-size-field="min"><i>PX</i></span></label>
          <span aria-hidden="true">→</span>
          <label><span class="visually-hidden">最大値</span><span class="fluid-scale__input-with-unit"><input type="number" min="0" max="4096" step="0.1" value="${escape(token.max)}" data-size-field="max"><i>PX</i></span></label>
          <button type="button" aria-label="${escape(token.name)}を削除" data-remove-size="${index}" ${sizeTokens.length === 1 ? 'disabled' : ''}>REMOVE</button>
        </div>`).join('');
      query('[data-fluid-add-size]').disabled = sizeTokens.length >= generator.SIZE_TOKEN_LIMIT;
    };

    const collectConfig = () => ({
      mode,
      viewportMin: numberValue('viewportMin'),
      viewportMax: numberValue('viewportMax'),
      currentWidth: Number(widthRange.value),
      rootSize: numberValue('rootSize'),
      unit: query('[data-fluid-unit]:checked')?.value || 'rem',
      basis: query('[data-fluid-basis]:checked')?.value || 'vi',
      precision: numberValue('precision'),
      type: {
        minBase: numberValue('typeMinBase'),
        maxBase: numberValue('typeMaxBase'),
        minRatio: numberValue('typeMinRatio'),
        maxRatio: numberValue('typeMaxRatio'),
        preset: getValue('typePreset'),
        prefix: getValue('typePrefix').trim(),
      },
      spacing: {
        minBase: numberValue('spaceMinBase'),
        maxBase: numberValue('spaceMaxBase'),
        preset: getValue('spacePreset'),
        prefix: getValue('spacePrefix').trim(),
      },
      sizes: sizeTokens.map((token) => ({ ...token, min: Number(token.min), max: Number(token.max) })),
      single: {
        name: getValue('singleName').trim(),
        min: numberValue('singleMin'),
        max: numberValue('singleMax'),
        preview: getValue('singlePreview'),
      },
    });

    const syncWidthRange = () => {
      const minimum = numberValue('viewportMin');
      const maximum = numberValue('viewportMax');
      if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum <= minimum) return;
      widthRange.min = String(minimum);
      widthRange.max = String(maximum);
      widthRange.value = String(Math.min(maximum, Math.max(minimum, Number(widthRange.value))));
    };

    const renderPreview = (result) => {
      if (!result.valid) {
        preview.dataset.state = 'invalid';
        preview.innerHTML = '<p class="fluid-scale__empty">入力内容を修正するとプレビューを表示します。</p>';
        return;
      }
      preview.dataset.state = 'ready';
      if (result.mode === 'single') {
        const token = result.tokens[0];
        const previewType = getValue('singlePreview');
        if (previewType === 'spacing') {
          preview.innerHTML = `<div class="fluid-scale__single-preview"><span>SINGLE / SPACING</span><div class="fluid-scale__spacing-demo"><i style="width:${Math.min(token.currentPx * 5, 360)}px"></i><strong>${escape(token.currentValue)}</strong></div></div>`;
        } else if (previewType === 'size') {
          const size = Math.min(Math.max(token.currentPx, 8), 180);
          preview.innerHTML = `<div class="fluid-scale__single-preview"><span>SINGLE / SIZE</span><div class="fluid-scale__size-demo" style="width:${size}px;height:${size}px"><strong>${escape(token.currentValue)}</strong></div></div>`;
        } else {
          const size = Math.min(Math.max(token.currentPx, 10), 128);
          preview.innerHTML = `<div class="fluid-scale__single-preview"><span>SINGLE / FONT SIZE</span><p style="font-size:${size}px">Fluid scale</p><strong>${escape(token.currentValue)}</strong></div>`;
        }
        return;
      }

      const typeTokens = result.tokens.filter((token) => token.family === 'typography');
      const spacingTokens = result.tokens.filter((token) => token.family === 'spacing');
      const sizeTokensResult = result.tokens.filter((token) => token.family === 'size');
      preview.innerHTML = `
        <section class="fluid-scale__preview-family"><header><span>TYPOGRAPHY</span><small>${typeTokens.length} TOKENS</small></header><div class="fluid-scale__type-preview">${typeTokens.map((token) => `<p style="font-size:${Math.min(token.currentPx, 112)}px"><span>${escape(token.name)}</span>Fluid scale</p>`).join('')}</div></section>
        <section class="fluid-scale__preview-family"><header><span>SPACING</span><small>${spacingTokens.length} TOKENS</small></header><div class="fluid-scale__spacing-preview">${spacingTokens.map((token) => `<div><span>${escape(token.name)}</span><i style="width:${Math.min(token.currentPx * 3, 100)}%"></i><small>${escape(token.currentValue)}</small></div>`).join('')}</div></section>
        <section class="fluid-scale__preview-family"><header><span>SIZE</span><small>${sizeTokensResult.length} TOKENS</small></header><div class="fluid-scale__size-preview">${sizeTokensResult.map((token) => `<div><i style="width:${Math.min(token.currentPx, 96)}px;height:${Math.min(token.currentPx, 96)}px"></i><span>${escape(token.name)}<small>${escape(token.currentValue)}</small></span></div>`).join('')}</div></section>`;
    };

    const renderTokenRows = (result) => {
      if (!result.valid) {
        tokenRows.innerHTML = '<tr><td colspan="5">NO VALID TOKENS</td></tr>';
        return;
      }
      tokenRows.innerHTML = result.tokens.map((token, index) => `
        <tr>
          <th scope="row"><span>${escape(token.name)}</span><small>${escape(token.family.toUpperCase())}</small></th>
          <td>${escape(token.minValue)}</td>
          <td>${escape(token.currentValue)}</td>
          <td>${escape(token.maxValue)}</td>
          <td><button type="button" data-copy-token="${index}">COPY</button></td>
        </tr>`).join('');
    };

    const renderWarnings = (result) => {
      const items = [...result.errors, ...result.warnings];
      warningsSection.hidden = items.length === 0;
      query('[data-fluid-warning-count]').textContent = `${items.length} ITEM${items.length === 1 ? '' : 'S'}`;
      warningsList.innerHTML = items.map((item) => `<li data-level="${result.errors.includes(item) ? 'error' : 'notice'}"><strong>${escape(item.type)}</strong><span>${escape(item.message)}</span></li>`).join('');
    };

    const renderMetrics = (result, config) => {
      const values = {
        tokens: result.metrics.tokenCount,
        fluid: result.metrics.fluidCount,
        fixed: result.metrics.fixedCount,
        viewport: result.metrics.viewportRange.toUpperCase(),
        current: `${config.currentWidth}PX`,
        warnings: result.errors.length + result.warnings.length,
      };
      Object.entries(values).forEach(([key, value]) => {
        const target = query(`[data-fluid-metric="${key}"]`);
        if (target) target.textContent = value;
      });
    };

    const renderResult = () => {
      syncWidthRange();
      const config = collectConfig();
      currentResult = generator.generate(config);
      const isValid = currentResult.valid;
      const outputText = sourceTab === 'usage' ? currentResult.usage : currentResult.css;
      source.textContent = outputText || '/* Fix input values to generate CSS. */';
      query('[data-fluid-preview-width-output]').textContent = `${config.currentWidth}PX`;
      query('[data-fluid-token-summary]').textContent = `${currentResult.metrics.tokenCount} TOKEN${currentResult.metrics.tokenCount === 1 ? '' : 'S'}`;
      query('[data-fluid-input-state]').textContent = isValid ? 'RULES READY' : `${currentResult.errors.length} INPUT ERROR${currentResult.errors.length === 1 ? '' : 'S'}`;
      query('[data-fluid-input-state]').dataset.state = isValid ? 'ready' : 'invalid';
      query('[data-fluid-output-state]').textContent = isValid ? 'TOKENS READY' : 'OUTPUT BLOCKED';
      query('[data-fluid-output-state]').dataset.state = isValid ? 'ready' : 'invalid';
      query('[data-fluid-output-meta]').textContent = `${config.unit.toUpperCase()} + ${config.basis.toUpperCase()}`;
      copyButtons.forEach((button) => { button.disabled = !isValid; });
      downloadButton.disabled = !isValid;
      renderPreview(currentResult);
      renderTokenRows(currentResult);
      renderWarnings(currentResult);
      renderMetrics(currentResult, config);
    };

    const setMode = (nextMode) => {
      mode = nextMode === 'single' ? 'single' : 'system';
      queryAll('[data-fluid-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.fluidMode === mode)));
      systemPanel.hidden = mode !== 'system';
      singlePanel.hidden = mode !== 'single';
      query('[data-fluid-mode-label]').textContent = mode === 'system' ? 'SCALE SYSTEM' : 'SINGLE VALUE';
      renderResult();
    };

    const setInputValue = (name, value) => {
      const input = getInput(name);
      if (input) input.value = String(value);
    };

    const setChecked = (selector, value) => {
      queryAll(selector).forEach((input) => { input.checked = input.value === value; });
    };

    const applyConfig = (config) => {
      setInputValue('viewportMin', config.viewportMin);
      setInputValue('viewportMax', config.viewportMax);
      setInputValue('rootSize', config.rootSize);
      setInputValue('precision', config.precision);
      setInputValue('typeMinBase', config.type.minBase);
      setInputValue('typeMaxBase', config.type.maxBase);
      setInputValue('typeMinRatio', config.type.minRatio);
      setInputValue('typeMaxRatio', config.type.maxRatio);
      setInputValue('typePreset', config.type.preset);
      setInputValue('typePrefix', config.type.prefix);
      setInputValue('spaceMinBase', config.spacing.minBase);
      setInputValue('spaceMaxBase', config.spacing.maxBase);
      setInputValue('spacePreset', config.spacing.preset);
      setInputValue('spacePrefix', config.spacing.prefix);
      setInputValue('singleName', config.single.name);
      setInputValue('singleMin', config.single.min);
      setInputValue('singleMax', config.single.max);
      setInputValue('singlePreview', config.single.preview);
      widthRange.value = String(config.currentWidth);
      setChecked('[data-fluid-unit]', config.unit);
      setChecked('[data-fluid-basis]', config.basis);
      sizeTokens = config.sizes.map((token) => ({ ...token }));
      renderSizeRows();
      setMode(config.mode);
    };

    workspace.addEventListener('input', (event) => {
      const sizeRow = event.target.closest('[data-fluid-size-row]');
      if (sizeRow && event.target.dataset.sizeField) {
        const index = Number(sizeRow.dataset.fluidSizeRow);
        sizeTokens[index][event.target.dataset.sizeField] = event.target.value;
      }
      renderResult();
    });
    workspace.addEventListener('change', renderResult);
    queryAll('[data-fluid-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.fluidMode)));
    queryAll('[data-fluid-source-tab]').forEach((button) => button.addEventListener('click', () => {
      sourceTab = button.dataset.fluidSourceTab;
      queryAll('[data-fluid-source-tab]').forEach((tab) => tab.setAttribute('aria-pressed', String(tab === button)));
      renderResult();
    }));
    query('[data-fluid-add-size]').addEventListener('click', () => {
      if (sizeTokens.length >= generator.SIZE_TOKEN_LIMIT) return;
      sizeTokens.push({ name: `--size-custom-${sizeTokens.length + 1}`, min: 16, max: 24 });
      renderSizeRows();
      renderResult();
      sizeList.querySelector('[data-fluid-size-row]:last-child input')?.focus();
    });
    sizeList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-size]');
      if (!button || sizeTokens.length === 1) return;
      sizeTokens.splice(Number(button.dataset.removeSize), 1);
      renderSizeRows();
      renderResult();
    });
    tokenRows.addEventListener('click', (event) => {
      const button = event.target.closest('[data-copy-token]');
      if (!button || !currentResult.valid) return;
      const token = currentResult.tokens[Number(button.dataset.copyToken)];
      copyText(`${token.name}: ${token.cssValue};`);
    });
    copyButtons.forEach((button) => button.addEventListener('click', () => {
      if (!currentResult.valid) return;
      copyText(button.dataset.fluidCopy === 'usage' ? currentResult.usage : currentResult.css);
    }));
    downloadButton.addEventListener('click', () => {
      if (!currentResult.valid) return;
      const blob = new Blob([`${currentResult.css}\n\n${currentResult.usage}\n`], { type: 'text/css;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'mark-bench-fluid-scale.css';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showToast('ダウンロードが完了しました。');
    });
    query('[data-fluid-sample]').addEventListener('click', () => {
      applyConfig(generator.cloneDefaultConfig());
      getInput('viewportMin').focus();
      showToast('MARK BENCH SAMPLE LOADED');
    });
    query('[data-fluid-reset]').addEventListener('click', () => {
      applyConfig(generator.cloneDefaultConfig());
      getInput('viewportMin').focus();
      showToast('INPUT RESET');
    });

    renderSizeRows();
    renderResult();
    window.addEventListener('pageshow', renderResult, { once: true });
    return true;
  };

  globalThis.MarkBenchFluidScaleGeneratorUI = Object.freeze({ mount });
})();
