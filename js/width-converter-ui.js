(() => {
  const mount = ({ workspace, copyText, showToast, escapeMarkup }) => {
    const converter = globalThis.MarkBenchWidthConverter;
    if (!workspace || !converter) return false;

    const escape = escapeMarkup || ((value = '') => String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;'));
    const categories = converter.CATEGORY_ORDER;
    const definitions = converter.CATEGORY_DEFINITIONS;
    const sample = 'ＭＡＲＫ　ＢＥＮＣＨ\n商品１２３／CSS：１２ｐｘ\nｶﾀｶﾅとカタカナ。「価格」は￥１，９８０！';

    const categoryChecks = (scope, selected) => categories.map((category) => `
      <label><input type="checkbox" value="${category}" data-width-${scope}-target ${selected.includes(category) ? 'checked' : ''}><span>${definitions[category].shortLabel}<small>${definitions[category].label}</small></span></label>`).join('');
    const checkTargets = converter.CHECK_TARGETS.map((category) => `
      <label><input type="checkbox" value="${category}" data-width-check-target ${converter.CHECK_DEFAULTS.includes(category) ? 'checked' : ''}><span>${definitions[category].shortLabel}<small>${definitions[category].label}</small></span></label>`).join('');
    const ruleRows = categories.map((category) => `
      <div class="width-converter__rule-row" data-width-rule-row="${category}">
        <div><strong>${definitions[category].shortLabel}</strong><small>${definitions[category].label}</small></div>
        ${converter.ACTIONS.map((action) => `<label><input type="radio" name="width-rule-${category}" value="${action}" data-width-rule="${category}" ${converter.DEFAULT_RULES[category] === action ? 'checked' : ''}><span>${action === 'to-full' ? 'FULL' : action === 'to-half' ? 'HALF' : 'KEEP'}</span></label>`).join('')}
      </div>`).join('');

    workspace.innerHTML = `
      <div class="width-converter" data-width-converter>
        <div class="width-converter__mode-tabs" role="group" aria-label="変換モード">
          <button type="button" aria-pressed="true" data-width-mode="batch"><span>MODE 01</span><strong>BATCH CONVERT</strong><small>一括変換</small></button>
          <button type="button" aria-pressed="false" data-width-mode="custom"><span>MODE 02</span><strong>CUSTOM RULES</strong><small>個別変換</small></button>
          <button type="button" aria-pressed="false" data-width-mode="check"><span>MODE 03</span><strong>WIDTH CHECK</strong><small>文字チェック</small></button>
        </div>

        <section class="width-converter__settings" data-width-settings="batch" aria-labelledby="width-batch-title">
          <div class="width-converter__settings-heading"><span>01 / DIRECTION</span><h3 id="width-batch-title">BATCH CONVERT</h3></div>
          <fieldset class="width-converter__direction">
            <legend>CONVERSION DIRECTION</legend>
            <label><input type="radio" name="width-direction" value="to-half" checked data-width-direction><span>FULL → HALF</span></label>
            <label><input type="radio" name="width-direction" value="to-full" data-width-direction><span>HALF → FULL</span></label>
          </fieldset>
          <fieldset class="width-converter__target-grid">
            <legend>CHARACTER TARGETS</legend>
            ${categoryChecks('batch', converter.BATCH_TARGETS)}
          </fieldset>
          <div class="width-converter__selection-actions"><button type="button" data-width-select-all>ALL SELECT</button><button type="button" data-width-clear-select>CLEAR SELECT</button></div>
        </section>

        <section class="width-converter__settings" data-width-settings="custom" aria-labelledby="width-custom-title" hidden>
          <div class="width-converter__settings-heading"><span>02 / PER CATEGORY</span><h3 id="width-custom-title">CUSTOM RULES</h3></div>
          <div class="width-converter__presets" role="group" aria-label="変換ルールのプリセット">
            <button type="button" data-width-preset="web">WEB / CMS</button>
            <button type="button" data-width-preset="full">ALL FULL</button>
            <button type="button" data-width-preset="half">ALL HALF</button>
            <button type="button" data-width-preset="keep">KEEP ALL</button>
          </div>
          <div class="width-converter__rule-matrix">
            <div class="width-converter__rule-head"><span>TYPE</span><span>FULL</span><span>HALF</span><span>KEEP</span></div>
            ${ruleRows}
          </div>
        </section>

        <section class="width-converter__settings" data-width-settings="check" aria-labelledby="width-check-title" hidden>
          <div class="width-converter__settings-heading"><span>03 / DETECTION</span><h3 id="width-check-title">WIDTH CHECK</h3></div>
          <fieldset class="width-converter__target-grid width-converter__target-grid--check">
            <legend>FULLWIDTH TARGETS</legend>
            ${checkTargets}
          </fieldset>
          <label class="width-converter__custom-symbols"><span>CUSTOM SYMBOLS<small>検出したい記号をそのまま入力</small></span><input type="text" maxlength="64" value="" placeholder="例：※〒→" spellcheck="false" data-width-custom-symbols></label>
        </section>

        <div class="workspace-grid workspace-grid--width-converter">
          <section class="workspace-panel width-converter__input-pane" aria-labelledby="width-input-title">
            <div class="workspace-panel__header"><span id="width-input-title">INPUT / SOURCE TEXT</span><div class="workspace-actions"><button class="workspace-action" type="button" data-width-sample>LOAD SAMPLE</button><button class="workspace-action" type="button" data-width-clear disabled>CLEAR</button></div></div>
            <label class="visually-hidden" for="width-input">変換または検査するテキスト</label>
            <textarea id="width-input" maxlength="${converter.MAX_INPUT_LENGTH}" placeholder="全角・半角が混在したテキストを入力してください。" spellcheck="false" data-width-input></textarea>
            <div class="workspace-panel__footer"><span data-width-input-state data-state="empty" aria-live="polite">INPUT EMPTY</span><span data-width-input-metrics>0 CHARS / 0 LINES</span></div>
          </section>

          <section class="workspace-panel width-converter__output-pane" aria-labelledby="width-output-title">
            <div class="workspace-panel__header width-converter__output-header"><span id="width-output-title" data-width-output-title>OUTPUT / CONVERTED TEXT</span><div class="width-converter__view-tabs" role="group" aria-label="出力表示"><button type="button" aria-pressed="true" data-width-view="result">RESULT</button><button type="button" aria-pressed="false" data-width-view="changes">CHANGES</button></div></div>
            <div class="width-converter__result" data-width-result-view="result">
              <label class="visually-hidden" for="width-output">変換結果</label>
              <textarea id="width-output" readonly spellcheck="false" data-width-output></textarea>
            </div>
            <div class="width-converter__comparison" data-width-result-view="changes" hidden>
              <section><header>BEFORE / SOURCE</header><pre data-width-before></pre></section>
              <section><header>AFTER / RESULT</header><pre data-width-after></pre></section>
            </div>
            <div class="width-converter__inspection" data-width-inspection hidden>
              <div class="width-converter__highlight"><pre data-width-highlight></pre></div>
              <div class="width-converter__match-list">
                <table><caption class="visually-hidden">全角文字の検出結果</caption><thead><tr><th scope="col">POS</th><th scope="col">CHAR</th><th scope="col">CODE</th><th scope="col">TYPE</th></tr></thead><tbody data-width-matches></tbody></table>
              </div>
            </div>
            <div class="workspace-panel__footer"><span data-width-output-state data-state="empty">OUTPUT EMPTY</span><span data-width-output-metrics>0 CHANGES</span></div>
          </section>

          <dl class="width-converter__metrics" aria-label="変換結果の集計">
            <div><dt>INPUT</dt><dd data-width-metric="input">0</dd></div>
            <div><dt>OUTPUT</dt><dd data-width-metric="output">0</dd></div>
            <div><dt>CHANGED</dt><dd data-width-metric="changed">0</dd></div>
            <div><dt>MATCHES</dt><dd data-width-metric="matches">0</dd></div>
            <div><dt>TYPES</dt><dd data-width-metric="types">0</dd></div>
            <div><dt>MODE</dt><dd data-width-metric="mode">BATCH</dd></div>
          </dl>

          <div class="width-converter__actions">
            <button type="button" data-width-copy disabled>COPY OUTPUT</button>
            <button type="button" data-width-apply disabled>USE OUTPUT AS INPUT</button>
            <button type="button" data-width-reset disabled>RESET TO SOURCE</button>
          </div>
        </div>
      </div>`;

    const query = (selector) => workspace.querySelector(selector);
    const queryAll = (selector) => [...workspace.querySelectorAll(selector)];
    const input = query('[data-width-input]');
    const output = query('[data-width-output]');
    const outputTitle = query('[data-width-output-title]');
    const inputState = query('[data-width-input-state]');
    const inputMetrics = query('[data-width-input-metrics]');
    const outputState = query('[data-width-output-state]');
    const outputMetrics = query('[data-width-output-metrics]');
    const highlight = query('[data-width-highlight]');
    const matchRows = query('[data-width-matches]');
    const copyButton = query('[data-width-copy]');
    const applyButton = query('[data-width-apply]');
    const resetButton = query('[data-width-reset]');
    const clearButton = query('[data-width-clear]');
    let mode = 'batch';
    let view = 'result';
    let originalSource = '';
    let currentResult = converter.convert('');

    const selectedValues = (selector) => queryAll(`${selector}:checked`).map((control) => control.value);
    const getRules = () => Object.fromEntries(categories.map((category) => [category, query(`[data-width-rule="${category}"]:checked`)?.value || 'keep']));
    const setRules = (rules) => categories.forEach((category) => {
      const control = query(`[data-width-rule="${category}"][value="${rules[category]}"]`);
      if (control) control.checked = true;
    });

    const changeMarkup = (segments, key) => segments.map((segment) => segment.changed
      ? `<mark data-category="${segment.category}">${escape(segment[key])}</mark>`
      : escape(segment[key])).join('');

    const renderConversion = () => {
      output.value = currentResult.output;
      query('[data-width-before]').innerHTML = changeMarkup(currentResult.segments, 'source');
      query('[data-width-after]').innerHTML = changeMarkup(currentResult.segments, 'output');
      queryAll('[data-width-result-view]').forEach((panel) => { panel.hidden = panel.dataset.widthResultView !== view; });
      query('[data-width-inspection]').hidden = true;
    };

    const renderInspection = () => {
      const segments = converter.buildHighlightSegments(currentResult.source, currentResult.matches);
      highlight.innerHTML = segments.map((segment) => segment.match
        ? `<mark data-category="${segment.category}">${escape(segment.text)}</mark>`
        : escape(segment.text)).join('') || '<span class="width-converter__empty">入力すると検出箇所を表示します。</span>';
      matchRows.innerHTML = currentResult.matches.length
        ? currentResult.matches.map((match) => `<tr><td>${match.line}:${match.column}</td><th scope="row">${escape(match.character)}</th><td>${match.codePoint}</td><td>${definitions[match.category].shortLabel}</td></tr>`).join('')
        : '<tr><td colspan="4">NO MATCHES</td></tr>';
      queryAll('[data-width-result-view]').forEach((panel) => { panel.hidden = true; });
      query('[data-width-inspection]').hidden = false;
      output.value = currentResult.output;
    };

    const setMetric = (name, value) => { query(`[data-width-metric="${name}"]`).textContent = String(value); };
    const render = () => {
      const source = input.value;
      if (mode === 'check') {
        currentResult = converter.inspect(source, {
          targets: selectedValues('[data-width-check-target]'),
          customSymbols: query('[data-width-custom-symbols]').value,
        });
        renderInspection();
      } else {
        currentResult = converter.convert(source, mode === 'custom'
          ? { mode: 'custom', rules: getRules() }
          : { mode: 'batch', direction: query('[data-width-direction]:checked')?.value, targets: selectedValues('[data-width-batch-target]') });
        renderConversion();
      }

      const hasInput = source.length > 0;
      const isCheck = mode === 'check';
      const changed = isCheck ? 0 : currentResult.replacements;
      const matches = isCheck ? currentResult.totalMatches : 0;
      const typeCount = isCheck ? currentResult.activeCategories.length : currentResult.changedCategories.length;
      const outputReady = isCheck ? hasInput : currentResult.output.length > 0;
      const status = !hasInput
        ? 'INPUT EMPTY'
        : isCheck
          ? matches ? `${matches} FULLWIDTH MATCH${matches === 1 ? '' : 'ES'}` : 'NO TARGET CHARACTERS'
          : changed ? `${changed} CONVERSION${changed === 1 ? '' : 'S'}` : 'NO CHANGES';

      inputState.textContent = currentResult.truncated ? 'INPUT LIMIT' : hasInput ? 'SOURCE READY' : 'INPUT EMPTY';
      inputState.dataset.state = currentResult.truncated ? 'limit' : hasInput ? 'ready' : 'empty';
      inputMetrics.textContent = `${currentResult.input.characters.toLocaleString('en-US')} CHARS / ${currentResult.input.lines.toLocaleString('en-US')} LINES`;
      outputState.textContent = status;
      outputState.dataset.state = !hasInput ? 'empty' : matches || changed ? 'changed' : 'ready';
      outputMetrics.textContent = isCheck
        ? `${currentResult.displayedMatches.toLocaleString('en-US')} SHOWN / ${matches.toLocaleString('en-US')} FOUND`
        : `${changed.toLocaleString('en-US')} CHANGES / ${currentResult.result.characters.toLocaleString('en-US')} CHARS`;
      outputTitle.textContent = isCheck ? 'CHECK / HIGHLIGHTED TEXT' : 'OUTPUT / CONVERTED TEXT';
      query('.width-converter__view-tabs').hidden = isCheck;
      copyButton.textContent = isCheck ? 'COPY REPORT' : 'COPY OUTPUT';
      copyButton.disabled = !outputReady;
      applyButton.disabled = isCheck || !hasInput || currentResult.output === source;
      resetButton.disabled = input.value === originalSource;
      clearButton.disabled = !hasInput;
      setMetric('input', currentResult.input.characters.toLocaleString('en-US'));
      setMetric('output', currentResult.result.characters.toLocaleString('en-US'));
      setMetric('changed', changed.toLocaleString('en-US'));
      setMetric('matches', matches.toLocaleString('en-US'));
      setMetric('types', typeCount.toLocaleString('en-US'));
      setMetric('mode', mode === 'batch' ? 'BATCH' : mode === 'custom' ? 'CUSTOM' : 'CHECK');
    };

    const setMode = (nextMode) => {
      mode = nextMode;
      view = 'result';
      queryAll('[data-width-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.widthMode === mode)));
      queryAll('[data-width-settings]').forEach((panel) => { panel.hidden = panel.dataset.widthSettings !== mode; });
      queryAll('[data-width-view]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.widthView === view)));
      render();
    };

    queryAll('[data-width-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.widthMode)));
    queryAll('[data-width-view]').forEach((button) => button.addEventListener('click', () => {
      view = button.dataset.widthView;
      queryAll('[data-width-view]').forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.widthView === view)));
      render();
    }));
    queryAll('[data-width-direction], [data-width-batch-target], [data-width-rule], [data-width-check-target]').forEach((control) => control.addEventListener('change', render));
    query('[data-width-custom-symbols]').addEventListener('input', render);
    input.addEventListener('input', () => {
      originalSource = input.value;
      render();
    });
    query('[data-width-select-all]').addEventListener('click', () => {
      queryAll('[data-width-batch-target]').forEach((control) => { control.checked = true; });
      render();
    });
    query('[data-width-clear-select]').addEventListener('click', () => {
      queryAll('[data-width-batch-target]').forEach((control) => { control.checked = false; });
      render();
    });
    queryAll('[data-width-preset]').forEach((button) => button.addEventListener('click', () => {
      setRules(converter.RULE_PRESETS[button.dataset.widthPreset]);
      render();
    }));
    query('[data-width-sample]').addEventListener('click', () => {
      input.value = sample;
      originalSource = sample;
      render();
      input.focus();
    });
    clearButton.addEventListener('click', () => {
      input.value = '';
      originalSource = '';
      render();
      input.focus();
      showToast('表示内容をリセットしました。');
    });
    copyButton.addEventListener('click', () => copyText(mode === 'check' ? converter.formatInspectionReport(currentResult) : currentResult.output));
    applyButton.addEventListener('click', () => {
      input.value = currentResult.output;
      render();
      input.focus();
      showToast('変換結果を入力欄へ反映しました。');
    });
    resetButton.addEventListener('click', () => {
      input.value = originalSource;
      render();
      input.focus();
      showToast('変換前のテキストへ戻しました。');
    });

    render();
    window.addEventListener('pageshow', render, { once: true });
    return true;
  };

  globalThis.MarkBenchWidthConverterUI = Object.freeze({ mount });
})();
