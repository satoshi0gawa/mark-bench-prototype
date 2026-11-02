(() => {
  const MAX_URL_LENGTH = 10000;
  const MAX_PARAM_LENGTH = 2000;
  const MAX_PARAMS = 100;
  const MAX_FRAGMENT_LENGTH = 2000;

  const safeDecode = (value, plusAsSpace = true) => {
    const source = plusAsSpace ? String(value).replaceAll('+', ' ') : String(value);
    try {
      return decodeURIComponent(source);
    } catch {
      return source;
    }
  };

  const encodeComponent = (value, spaceEncoding = 'plus') => {
    const encoded = encodeURIComponent(String(value))
      .replace(/[!'()*]/gu, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return spaceEncoding === 'plus' ? encoded.replaceAll('%20', '+') : encoded;
  };

  const splitUrl = (input = '') => {
    const source = String(input).trim().slice(0, MAX_URL_LENGTH);
    const hashIndex = source.indexOf('#');
    const beforeHash = hashIndex >= 0 ? source.slice(0, hashIndex) : source;
    const fragment = hashIndex >= 0 ? source.slice(hashIndex + 1) : '';
    const queryIndex = beforeHash.indexOf('?');
    return {
      source,
      base: queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash,
      query: queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : '',
      fragment,
      hasQuery: queryIndex >= 0,
      hasFragment: hashIndex >= 0,
    };
  };

  const parseQuery = (query = '') => {
    const source = String(query).replace(/^\?/u, '');
    if (!source) return [];
    return source.split('&').filter((segment) => segment !== '').slice(0, MAX_PARAMS).map((segment) => {
      const equalsIndex = segment.indexOf('=');
      const rawKey = equalsIndex >= 0 ? segment.slice(0, equalsIndex) : segment;
      const rawValue = equalsIndex >= 0 ? segment.slice(equalsIndex + 1) : '';
      return {
        key: safeDecode(rawKey).slice(0, MAX_PARAM_LENGTH),
        value: safeDecode(rawValue).slice(0, MAX_PARAM_LENGTH),
        enabled: true,
        hasEquals: equalsIndex >= 0,
      };
    });
  };

  const validateBase = (base = '') => {
    const source = String(base).trim();
    if (!source) return { valid: true, error: null };
    if (/[\u0000-\u001f\u007f]/u.test(source)) return { valid: false, error: '制御文字はURLに使用できません。' };
    if (/\s/u.test(source)) return { valid: false, error: 'URL内の空白は%20などへエンコードしてください。' };
    try {
      new URL(source, 'https://mark-bench.invalid/');
      return { valid: true, error: null };
    } catch {
      return { valid: false, error: 'URLの形式を確認してください。' };
    }
  };

  const parseUrl = (input = '') => {
    const parts = splitUrl(input);
    const validation = validateBase(parts.base);
    const params = parseQuery(parts.query);
    return {
      ...parts,
      fragment: safeDecode(parts.fragment, false).slice(0, MAX_FRAGMENT_LENGTH),
      params,
      valid: validation.valid,
      error: validation.error,
      truncated: params.length >= MAX_PARAMS && parts.query.split('&').length > MAX_PARAMS,
    };
  };

  const buildQuery = (params = [], options = {}) => {
    const spaceEncoding = options.spaceEncoding === 'percent' ? 'percent' : 'plus';
    const emptyStyle = options.emptyStyle === 'key-only' ? 'key-only' : 'equals';
    return params.slice(0, MAX_PARAMS)
      .filter((param) => param?.enabled !== false && (String(param?.key ?? '') !== '' || String(param?.value ?? '') !== ''))
      .map((param) => {
        const key = encodeComponent(String(param.key ?? '').slice(0, MAX_PARAM_LENGTH), spaceEncoding);
        const valueSource = String(param.value ?? '').slice(0, MAX_PARAM_LENGTH);
        if (!valueSource && emptyStyle === 'key-only') return key;
        return `${key}=${encodeComponent(valueSource, spaceEncoding)}`;
      })
      .join('&');
  };

  const build = (base, params = [], fragment = '', options = {}) => {
    const parts = splitUrl(base);
    const cleanBase = parts.base;
    const validation = validateBase(cleanBase);
    const query = buildQuery(params, options);
    const fragmentSource = String(fragment ?? '').replace(/^#/u, '').slice(0, MAX_FRAGMENT_LENGTH);
    const encodedFragment = fragmentSource ? encodeComponent(fragmentSource, 'percent') : '';
    const url = `${cleanBase}${query ? `?${query}` : ''}${encodedFragment ? `#${encodedFragment}` : ''}`;
    const activeParams = params.filter((param) => param?.enabled !== false && (String(param?.key ?? '') !== '' || String(param?.value ?? '') !== ''));
    const enabledParams = activeParams.length;
    return {
      base: cleanBase,
      query,
      queryString: query ? `?${query}` : '',
      fragment: encodedFragment,
      url,
      valid: validation.valid,
      error: validation.error,
      hasEmbeddedParts: parts.hasQuery || parts.hasFragment,
      metrics: {
        rows: params.length,
        enabledParams,
        duplicateKeys: Math.max(0, enabledParams - new Set(activeParams.map((param) => String(param.key ?? ''))).size),
        queryCharacters: query.length,
        urlCharacters: url.length,
      },
    };
  };

  const mount = ({ workspace, copyText, showToast, escapeMarkup }) => {
    workspace.innerHTML = `
      <div class="url-builder">
        <div class="workspace-grid workspace-grid--url-builder">
          <section class="url-builder__source" aria-labelledby="url-builder-source-title">
            <div class="workspace-panel__header"><span id="url-builder-source-title">BASE URL / FULL URL</span><div class="workspace-actions"><button class="workspace-action" type="button" data-url-sample>SAMPLE</button><button class="workspace-action" type="button" data-url-clear disabled>CLEAR</button></div></div>
            <div class="url-builder__source-fields">
              <label for="url-builder-source"><span>URL</span><input id="url-builder-source" type="text" maxlength="${MAX_URL_LENGTH}" placeholder="https://example.com/search?query=web#results" spellcheck="false" autocapitalize="off" autocomplete="off" data-url-source></label>
              <button class="workspace-action url-builder__parse" type="button" data-url-parse disabled>PARSE URL</button>
              <label for="url-builder-fragment"><span>FRAGMENT</span><span class="url-builder__fragment-input"><i aria-hidden="true">#</i><input id="url-builder-fragment" type="text" maxlength="${MAX_FRAGMENT_LENGTH}" placeholder="results" spellcheck="false" data-url-fragment></span></label>
            </div>
            <div class="workspace-panel__footer"><span data-url-state data-state="empty" aria-live="polite">URL EMPTY</span><span data-url-limit>0 / ${MAX_URL_LENGTH.toLocaleString('en-US')} LIMIT</span></div>
          </section>

          <section class="url-builder__params" aria-labelledby="url-builder-params-title">
            <div class="workspace-panel__header"><span id="url-builder-params-title">QUERY PARAMETERS</span><div class="workspace-actions"><button class="workspace-action" type="button" data-url-add-param>ADD PARAM</button><button class="workspace-action" type="button" data-url-clear-params disabled>CLEAR PARAMS</button></div></div>
            <div class="url-builder__param-heading" aria-hidden="true"><span>USE</span><span>KEY</span><span>VALUE</span><span>REMOVE</span></div>
            <div class="url-builder__param-list" data-url-param-list></div>
            <div class="workspace-panel__footer"><span data-url-param-state>0 ACTIVE PARAMS</span><span>MAX ${MAX_PARAMS}</span></div>
          </section>

          <section class="url-builder__options" aria-label="URL生成設定">
            <fieldset>
              <legend>SPACE ENCODING</legend>
              <label><input type="radio" name="url-space" value="plus" data-url-space checked><span>+ <small>FORM STYLE</small></span></label>
              <label><input type="radio" name="url-space" value="percent" data-url-space><span>%20 <small>URI STYLE</small></span></label>
            </fieldset>
            <fieldset>
              <legend>EMPTY VALUE</legend>
              <label><input type="radio" name="url-empty" value="equals" data-url-empty checked><span>key=</span></label>
              <label><input type="radio" name="url-empty" value="key-only" data-url-empty><span>key</span></label>
            </fieldset>
          </section>

          <section class="url-builder__output" aria-labelledby="url-builder-output-title">
            <div class="workspace-panel__header"><span id="url-builder-output-title">BUILT URL</span><button class="workspace-action" type="button" data-copy-built-url disabled>COPY URL</button></div>
            <pre data-url-output><span class="url-builder__empty">[ OUTPUT_EMPTY ]</span></pre>
            <div class="workspace-panel__footer"><span data-url-output-state>OUTPUT EMPTY</span><span data-url-output-count>0 CHARS</span></div>
          </section>

          <section class="url-builder__query-output" aria-labelledby="url-builder-query-title">
            <div class="workspace-panel__header"><span id="url-builder-query-title">QUERY STRING</span><button class="workspace-action" type="button" data-copy-query-string disabled>COPY QUERY</button></div>
            <pre data-url-query-output><span class="url-builder__empty">[ QUERY_EMPTY ]</span></pre>
          </section>

          <dl class="url-builder__metrics" aria-label="URLの集計結果">
            <div><dt>ROWS</dt><dd data-url-metric="rows">1</dd></div>
            <div><dt>ACTIVE PARAMS</dt><dd data-url-metric="enabledParams">0</dd></div>
            <div><dt>DUPLICATE KEYS</dt><dd data-url-metric="duplicateKeys">0</dd></div>
            <div><dt>QUERY</dt><dd data-url-metric="queryCharacters">0 CHARS</dd></div>
            <div><dt>URL</dt><dd data-url-metric="urlCharacters">0 CHARS</dd></div>
          </dl>
        </div>
      </div>`;

    const sourceInput = workspace.querySelector('[data-url-source]');
    const fragmentInput = workspace.querySelector('[data-url-fragment]');
    const paramList = workspace.querySelector('[data-url-param-list]');
    const output = workspace.querySelector('[data-url-output]');
    const queryOutput = workspace.querySelector('[data-url-query-output]');
    const state = workspace.querySelector('[data-url-state]');
    const clearButton = workspace.querySelector('[data-url-clear]');
    const parseButton = workspace.querySelector('[data-url-parse]');
    const addButton = workspace.querySelector('[data-url-add-param]');
    const clearParamsButton = workspace.querySelector('[data-url-clear-params]');
    const copyUrlButton = workspace.querySelector('[data-copy-built-url]');
    const copyQueryButton = workspace.querySelector('[data-copy-query-string]');
    let nextId = 2;
    let params = [{ id: 1, key: '', value: '', enabled: true }];
    let currentResult = build('', params, '');
    let renderFrame = 0;

    const getOptions = () => ({
      spaceEncoding: workspace.querySelector('[data-url-space]:checked')?.value || 'plus',
      emptyStyle: workspace.querySelector('[data-url-empty]:checked')?.value || 'equals',
    });
    const renderParamRows = () => {
      paramList.innerHTML = params.map((param, index) => `<div class="url-builder__param-row" data-url-param-row data-param-id="${param.id}">
        <label class="url-builder__param-toggle"><span class="visually-hidden">パラメータ${index + 1}を使用</span><input type="checkbox" data-param-field="enabled" ${param.enabled ? 'checked' : ''}><i aria-hidden="true"></i></label>
        <label><span class="visually-hidden">パラメータ${index + 1}のキー</span><input type="text" maxlength="${MAX_PARAM_LENGTH}" value="${escapeMarkup(param.key)}" placeholder="key" spellcheck="false" data-param-field="key"></label>
        <label><span class="visually-hidden">パラメータ${index + 1}の値</span><input type="text" maxlength="${MAX_PARAM_LENGTH}" value="${escapeMarkup(param.value)}" placeholder="value" spellcheck="false" data-param-field="value"></label>
        <button type="button" aria-label="パラメータ${index + 1}を削除" data-remove-param>×</button>
      </div>`).join('');
    };
    const renderResult = () => {
      currentResult = build(sourceInput.value, params, fragmentInput.value, getOptions());
      const hasValues = Boolean(sourceInput.value || fragmentInput.value || params.some((param) => param.key || param.value) || params.length > 1);
      const parsedSource = splitUrl(sourceInput.value);
      const stateLabel = !sourceInput.value ? 'URL EMPTY' : !currentResult.valid ? 'URL ERROR' : parsedSource.hasQuery || parsedSource.hasFragment ? 'FULL URL DETECTED / PARSE AVAILABLE' : 'URL READY';

      state.textContent = stateLabel;
      state.dataset.state = !sourceInput.value ? 'empty' : !currentResult.valid ? 'invalid' : parsedSource.hasQuery || parsedSource.hasFragment ? 'changed' : 'ready';
      sourceInput.setAttribute('aria-invalid', currentResult.valid ? 'false' : 'true');
      workspace.querySelector('[data-url-limit]').textContent = `${sourceInput.value.length.toLocaleString('en-US')} / ${MAX_URL_LENGTH.toLocaleString('en-US')} LIMIT`;
      workspace.querySelector('[data-url-param-state]').textContent = `${currentResult.metrics.enabledParams.toLocaleString('en-US')} ACTIVE PARAM${currentResult.metrics.enabledParams === 1 ? '' : 'S'}`;
      workspace.querySelector('[data-url-output-state]').textContent = !currentResult.valid ? currentResult.error : currentResult.url ? 'URL READY' : 'OUTPUT EMPTY';
      workspace.querySelector('[data-url-output-count]').textContent = `${currentResult.metrics.urlCharacters.toLocaleString('en-US')} CHARS`;
      output.textContent = currentResult.valid ? currentResult.url : currentResult.error;
      queryOutput.textContent = currentResult.valid ? currentResult.queryString : '';
      if (!output.textContent) output.innerHTML = '<span class="url-builder__empty">[ OUTPUT_EMPTY ]</span>';
      if (!queryOutput.textContent) queryOutput.innerHTML = '<span class="url-builder__empty">[ QUERY_EMPTY ]</span>';

      clearButton.disabled = !hasValues;
      parseButton.disabled = !sourceInput.value || !currentResult.valid;
      addButton.disabled = params.length >= MAX_PARAMS;
      clearParamsButton.disabled = params.length === 1 && !params[0].key && !params[0].value;
      copyUrlButton.disabled = !currentResult.valid || !currentResult.url;
      copyQueryButton.disabled = !currentResult.valid || !currentResult.queryString;
      Object.entries(currentResult.metrics).forEach(([name, value]) => {
        const metric = workspace.querySelector(`[data-url-metric="${name}"]`);
        if (metric) metric.textContent = ['queryCharacters', 'urlCharacters'].includes(name) ? `${value.toLocaleString('en-US')} CHARS` : value.toLocaleString('en-US');
      });
    };
    const scheduleRender = () => {
      window.cancelAnimationFrame(renderFrame);
      renderFrame = window.requestAnimationFrame(renderResult);
    };
    const reset = () => {
      sourceInput.value = '';
      fragmentInput.value = '';
      params = [{ id: nextId++, key: '', value: '', enabled: true }];
      workspace.querySelectorAll('[data-url-space]').forEach((control) => { control.checked = control.value === 'plus'; });
      workspace.querySelectorAll('[data-url-empty]').forEach((control) => { control.checked = control.value === 'equals'; });
      renderParamRows();
      renderResult();
    };

    sourceInput.addEventListener('input', scheduleRender);
    fragmentInput.addEventListener('input', scheduleRender);
    workspace.querySelectorAll('[data-url-space], [data-url-empty]').forEach((control) => control.addEventListener('change', renderResult));
    paramList.addEventListener('input', (event) => {
      const row = event.target.closest('[data-url-param-row]');
      const field = event.target.dataset.paramField;
      if (!row || !field) return;
      const param = params.find((item) => item.id === Number(row.dataset.paramId));
      if (!param) return;
      param[field] = field === 'enabled' ? event.target.checked : event.target.value;
      scheduleRender();
    });
    paramList.addEventListener('change', (event) => {
      if (event.target.dataset.paramField !== 'enabled') return;
      const row = event.target.closest('[data-url-param-row]');
      const param = params.find((item) => item.id === Number(row?.dataset.paramId));
      if (param) param.enabled = event.target.checked;
      renderResult();
    });
    paramList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-param]');
      if (!button) return;
      const row = button.closest('[data-url-param-row]');
      params = params.filter((item) => item.id !== Number(row.dataset.paramId));
      if (!params.length) params = [{ id: nextId++, key: '', value: '', enabled: true }];
      renderParamRows();
      renderResult();
    });
    addButton.addEventListener('click', () => {
      if (params.length >= MAX_PARAMS) return;
      params.push({ id: nextId++, key: '', value: '', enabled: true });
      renderParamRows();
      renderResult();
      paramList.querySelector('[data-url-param-row]:last-child [data-param-field="key"]')?.focus();
    });
    clearParamsButton.addEventListener('click', () => {
      params = [{ id: nextId++, key: '', value: '', enabled: true }];
      renderParamRows();
      renderResult();
    });
    parseButton.addEventListener('click', () => {
      const parsed = parseUrl(sourceInput.value);
      if (!parsed.valid) return;
      sourceInput.value = parsed.base;
      fragmentInput.value = parsed.fragment;
      params = (parsed.params.length ? parsed.params : [{ key: '', value: '', enabled: true }]).map((param) => ({ ...param, id: nextId++ }));
      renderParamRows();
      renderResult();
      showToast(parsed.truncated ? `先頭${MAX_PARAMS}件を読み込みました。` : 'URLをパラメータへ展開しました。');
    });
    workspace.querySelector('[data-url-sample]').addEventListener('click', () => {
      sourceInput.value = 'https://example.com/search';
      fragmentInput.value = 'results';
      params = [
        { id: nextId++, key: 'q', value: 'web accessibility', enabled: true },
        { id: nextId++, key: 'category', value: 'tools', enabled: true },
        { id: nextId++, key: 'tag', value: 'html', enabled: true },
        { id: nextId++, key: 'tag', value: 'css', enabled: true },
        { id: nextId++, key: 'page', value: '1', enabled: true },
      ];
      renderParamRows();
      renderResult();
      sourceInput.focus();
    });
    clearButton.addEventListener('click', () => {
      reset();
      sourceInput.focus();
    });
    copyUrlButton.addEventListener('click', () => copyText(currentResult.url));
    copyQueryButton.addEventListener('click', () => copyText(currentResult.queryString));

    renderParamRows();
    renderResult();
    window.addEventListener('pageshow', renderResult, { once: true });
  };

  const api = {
    MAX_URL_LENGTH,
    MAX_PARAM_LENGTH,
    MAX_PARAMS,
    MAX_FRAGMENT_LENGTH,
    safeDecode,
    encodeComponent,
    splitUrl,
    parseQuery,
    validateBase,
    parseUrl,
    buildQuery,
    build,
    mount,
  };

  if (typeof window !== 'undefined') window.MarkBenchUrlQueryStringBuilder = api;
  if (typeof globalThis !== 'undefined') globalThis.MarkBenchUrlQueryStringBuilder = api;
})();
