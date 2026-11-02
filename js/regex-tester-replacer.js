(() => {
  const MAX_INPUT_LENGTH = 100000;
  const MAX_PATTERN_LENGTH = 2000;
  const MAX_REPLACEMENT_LENGTH = 10000;
  const MAX_MATCHES = 1000;
  const SUPPORTED_FLAGS = ['g', 'i', 'm', 's', 'u'];

  const normalizeFlags = (flags = '') => SUPPORTED_FLAGS.filter((flag) => String(flags).includes(flag)).join('');

  const advanceStringIndex = (value, index, unicode) => {
    if (!unicode || index + 1 >= value.length) return index + 1;
    const first = value.charCodeAt(index);
    if (first < 0xd800 || first > 0xdbff) return index + 1;
    const second = value.charCodeAt(index + 1);
    return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
  };

  const createLineStarts = (value) => {
    const starts = [0];
    for (let index = 0; index < value.length; index += 1) {
      if (value[index] === '\n') starts.push(index + 1);
    }
    return starts;
  };

  const findLineColumn = (lineStarts, index) => {
    let low = 0;
    let high = lineStarts.length;
    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2);
      if (lineStarts[middle] <= index) low = middle;
      else high = middle;
    }
    return { line: low + 1, column: index - lineStarts[low] + 1 };
  };

  const compile = (pattern, flags = '') => {
    const source = String(pattern ?? '').slice(0, MAX_PATTERN_LENGTH);
    const normalizedFlags = normalizeFlags(flags);
    if (!source) return { regex: null, source, flags: normalizedFlags, error: null };
    try {
      return { regex: new RegExp(source, normalizedFlags), source, flags: normalizedFlags, error: null };
    } catch (error) {
      return {
        regex: null,
        source,
        flags: normalizedFlags,
        error: error instanceof Error ? error.message.replace(/^Invalid regular expression:\s*/u, '') : 'Invalid regular expression',
      };
    }
  };

  const createSegments = (text, matches) => {
    const segments = [];
    let cursor = 0;
    matches.forEach((match) => {
      if (match.index > cursor) segments.push({ type: 'text', value: text.slice(cursor, match.index) });
      if (match.value.length === 0) segments.push({ type: 'match', value: '', zeroWidth: true, number: match.number });
      else segments.push({ type: 'match', value: match.value, zeroWidth: false, number: match.number });
      cursor = Math.max(cursor, match.index + match.value.length);
    });
    if (cursor < text.length) segments.push({ type: 'text', value: text.slice(cursor) });
    return segments;
  };

  const analyze = (pattern, flags, input, replacement = '') => {
    const text = String(input ?? '').slice(0, MAX_INPUT_LENGTH);
    const replacementText = String(replacement ?? '').slice(0, MAX_REPLACEMENT_LENGTH);
    const compiled = compile(pattern, flags);
    const base = {
      pattern: compiled.source,
      flags: compiled.flags,
      input: text,
      replacement: replacementText,
      matches: [],
      segments: text ? [{ type: 'text', value: text }] : [],
      output: text,
      error: compiled.error,
      isEmpty: !compiled.source,
      isValid: !compiled.error && Boolean(compiled.source),
      truncated: false,
      metrics: {
        matches: 0,
        matchedCharacters: 0,
        captureGroups: 0,
        inputCharacters: text.length,
        outputCharacters: text.length,
      },
    };
    if (!compiled.regex || compiled.error) return base;

    const lineStarts = createLineStarts(text);
    const matches = [];
    const regex = compiled.regex;
    let captureGroups = 0;
    let matchedCharacters = 0;
    let truncated = false;

    while (matches.length < MAX_MATCHES) {
      const found = regex.exec(text);
      if (!found) break;
      const position = findLineColumn(lineStarts, found.index);
      const groups = found.slice(1).map((value, index) => ({
        name: String(index + 1),
        value: value ?? null,
      }));
      const namedGroups = Object.entries(found.groups || {}).map(([name, value]) => ({ name, value: value ?? null }));
      matches.push({
        number: matches.length + 1,
        value: found[0],
        index: found.index,
        end: found.index + found[0].length,
        line: position.line,
        column: position.column,
        groups,
        namedGroups,
      });
      captureGroups = Math.max(captureGroups, groups.length);
      matchedCharacters += found[0].length;
      if (!regex.global) break;
      if (found[0].length === 0) regex.lastIndex = advanceStringIndex(text, regex.lastIndex, regex.unicode);
    }

    if (regex.global && matches.length === MAX_MATCHES) truncated = regex.exec(text) !== null;
    const replacementRegex = new RegExp(compiled.source, compiled.flags);
    const output = text.replace(replacementRegex, replacementText);

    return {
      ...base,
      matches,
      segments: createSegments(text, matches),
      output,
      truncated,
      metrics: {
        matches: matches.length,
        matchedCharacters,
        captureGroups,
        inputCharacters: text.length,
        outputCharacters: output.length,
      },
    };
  };

  const formatLiteral = (pattern, flags = '') => `/${String(pattern).replaceAll('/', '\\/')}/${normalizeFlags(flags)}`;

  const mount = ({ workspace, copyText, showToast, escapeMarkup }) => {
    workspace.innerHTML = `
      <div class="regex-tester">
        <div class="workspace-grid workspace-grid--regex">
          <section class="regex-tester__config" aria-labelledby="regex-config-title">
            <div class="workspace-panel__header"><span id="regex-config-title">REGULAR EXPRESSION</span><div class="workspace-actions"><button class="workspace-action" type="button" data-regex-sample>SAMPLE</button><button class="workspace-action" type="button" data-regex-clear disabled>CLEAR</button></div></div>
            <div class="regex-tester__pattern-row">
              <span aria-hidden="true">/</span>
              <label class="visually-hidden" for="regex-pattern">正規表現パターン</label>
              <input id="regex-pattern" type="text" maxlength="${MAX_PATTERN_LENGTH}" placeholder="例：(?&lt;name&gt;[a-z-]+)\\s*:\\s*(?&lt;value&gt;[^;]+)" spellcheck="false" autocapitalize="off" autocomplete="off" data-regex-pattern>
              <span aria-hidden="true">/</span>
              <output aria-label="有効なフラグ" data-regex-flags-output>g</output>
              <button class="workspace-action" type="button" data-copy-regex disabled>COPY REGEX</button>
            </div>
            <fieldset class="regex-tester__flags">
              <legend>FLAGS</legend>
              <label><input type="checkbox" value="g" data-regex-flag checked><span>g <small>GLOBAL</small></span></label>
              <label><input type="checkbox" value="i" data-regex-flag><span>i <small>IGNORE CASE</small></span></label>
              <label><input type="checkbox" value="m" data-regex-flag><span>m <small>MULTILINE</small></span></label>
              <label><input type="checkbox" value="s" data-regex-flag><span>s <small>DOT ALL</small></span></label>
              <label><input type="checkbox" value="u" data-regex-flag><span>u <small>UNICODE</small></span></label>
            </fieldset>
            <div class="regex-tester__replacement-field">
              <label for="regex-replacement">REPLACEMENT <small>$&amp; / $1 / $&lt;name&gt; / $$</small></label>
              <input id="regex-replacement" type="text" maxlength="${MAX_REPLACEMENT_LENGTH}" placeholder="置換後の文字列を入力してください。" spellcheck="false" data-regex-replacement>
            </div>
            <div class="workspace-panel__footer"><span data-regex-state data-state="empty" aria-live="polite">PATTERN EMPTY</span><span data-regex-pattern-limit>0 / ${MAX_PATTERN_LENGTH.toLocaleString('en-US')} PATTERN LIMIT</span></div>
          </section>

          <section class="workspace-panel regex-tester__input-pane" aria-label="テスト対象テキスト">
            <div class="workspace-panel__header"><span>TEST STRING / INPUT</span><span>LOCAL PROCESSING</span></div>
            <label class="visually-hidden" for="regex-input">テスト対象のテキスト</label>
            <textarea id="regex-input" maxlength="${MAX_INPUT_LENGTH}" placeholder="正規表現を試すテキストを入力してください。" spellcheck="false" data-regex-input></textarea>
            <div class="workspace-panel__footer"><span data-regex-input-state data-state="empty">INPUT EMPTY</span><span data-regex-input-limit>0 / ${MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT</span></div>
          </section>

          <section class="regex-tester__result-pane" aria-labelledby="regex-preview-title">
            <div class="workspace-panel__header"><span id="regex-preview-title">MATCH PREVIEW</span><span data-regex-match-summary>0 MATCHES</span></div>
            <pre class="regex-tester__preview" data-regex-preview><span class="regex-tester__empty">[ WAITING_FOR_PATTERN ]</span></pre>
            <div class="workspace-panel__footer"><span data-regex-preview-state data-state="empty">ADD A PATTERN</span><span data-regex-scope>GLOBAL ON</span></div>
          </section>

          <section class="regex-tester__replace-pane" aria-labelledby="regex-output-title">
            <div class="workspace-panel__header"><span id="regex-output-title">REPLACEMENT OUTPUT</span><button class="workspace-action" type="button" data-copy-regex-output disabled>COPY OUTPUT</button></div>
            <pre class="regex-tester__output" data-regex-output><span class="regex-tester__empty">[ OUTPUT_EMPTY ]</span></pre>
            <div class="workspace-panel__footer"><span data-regex-output-state>OUTPUT EMPTY</span><span data-regex-output-count>0 CHARS</span></div>
          </section>

          <section class="regex-tester__matches" aria-labelledby="regex-matches-title">
            <div class="workspace-panel__header"><span id="regex-matches-title">MATCH DETAILS</span><span>FIRST ${MAX_MATCHES.toLocaleString('en-US')}</span></div>
            <div class="regex-tester__match-table" data-regex-match-list></div>
          </section>

          <dl class="regex-tester__metrics" aria-label="正規表現の集計結果">
            <div><dt>MATCHES</dt><dd data-regex-metric="matches">0</dd></div>
            <div><dt>MATCHED CHARS</dt><dd data-regex-metric="matchedCharacters">0</dd></div>
            <div><dt>CAPTURE GROUPS</dt><dd data-regex-metric="captureGroups">0</dd></div>
            <div><dt>INPUT</dt><dd data-regex-metric="inputCharacters">0 CHARS</dd></div>
            <div><dt>OUTPUT</dt><dd data-regex-metric="outputCharacters">0 CHARS</dd></div>
          </dl>
        </div>
      </div>`;

    const patternInput = workspace.querySelector('[data-regex-pattern]');
    const textInput = workspace.querySelector('[data-regex-input]');
    const replacementInput = workspace.querySelector('[data-regex-replacement]');
    const preview = workspace.querySelector('[data-regex-preview]');
    const output = workspace.querySelector('[data-regex-output]');
    const matchList = workspace.querySelector('[data-regex-match-list]');
    const patternState = workspace.querySelector('[data-regex-state]');
    const previewState = workspace.querySelector('[data-regex-preview-state]');
    const inputState = workspace.querySelector('[data-regex-input-state]');
    const clearButton = workspace.querySelector('[data-regex-clear]');
    const copyRegexButton = workspace.querySelector('[data-copy-regex]');
    const copyOutputButton = workspace.querySelector('[data-copy-regex-output]');
    let currentResult = analyze('', 'g', '', '');
    let renderFrame = 0;

    const getFlags = () => [...workspace.querySelectorAll('[data-regex-flag]:checked')].map((control) => control.value).join('');
    const renderPreview = () => {
      if (currentResult.error) {
        preview.innerHTML = `<span class="regex-tester__error">${escapeMarkup(currentResult.error)}</span>`;
        return;
      }
      if (currentResult.isEmpty) {
        preview.innerHTML = '<span class="regex-tester__empty">[ WAITING_FOR_PATTERN ]</span>';
        return;
      }
      if (!currentResult.input) {
        preview.innerHTML = '<span class="regex-tester__empty">[ WAITING_FOR_INPUT ]</span>';
        return;
      }
      preview.innerHTML = currentResult.segments.map((segment) => {
        if (segment.type === 'text') return escapeMarkup(segment.value);
        if (segment.zeroWidth) return `<mark class="regex-tester__zero-match" title="Zero-width match ${segment.number}" aria-label="空文字一致 ${segment.number}"></mark>`;
        return `<mark title="Match ${segment.number}">${escapeMarkup(segment.value)}</mark>`;
      }).join('');
    };
    const renderMatches = () => {
      if (!currentResult.matches.length) {
        const label = currentResult.error ? 'FIX THE REGULAR EXPRESSION' : currentResult.isEmpty ? 'ADD A PATTERN' : 'NO MATCHES FOUND';
        matchList.innerHTML = `<div class="regex-tester__matches-empty">[ ${label} ]</div>`;
        return;
      }
      const rows = currentResult.matches.map((match) => {
        const groups = [
          ...match.groups.map((group) => `$${group.name}: ${group.value === null ? '[UNMATCHED]' : escapeMarkup(group.value)}`),
          ...match.namedGroups.map((group) => `$&lt;${escapeMarkup(group.name)}&gt;: ${group.value === null ? '[UNMATCHED]' : escapeMarkup(group.value)}`),
        ];
        return `<div class="regex-tester__match-row" role="row">
          <span role="cell">${match.number}</span>
          <code role="cell">${match.value ? escapeMarkup(match.value) : '[ZERO-WIDTH]'}</code>
          <span role="cell">L${match.line}:C${match.column} / ${match.index}–${match.end}</span>
          <span role="cell">${groups.length ? groups.join('<br>') : '—'}</span>
        </div>`;
      }).join('');
      matchList.innerHTML = `<div class="regex-tester__match-row regex-tester__match-row--heading" role="row"><span role="columnheader">#</span><span role="columnheader">MATCH</span><span role="columnheader">POSITION</span><span role="columnheader">GROUPS</span></div>${rows}${currentResult.truncated ? `<div class="regex-tester__truncated">MORE THAN ${MAX_MATCHES.toLocaleString('en-US')} MATCHES / DISPLAY TRUNCATED</div>` : ''}`;
    };
    const render = () => {
      const flags = getFlags();
      currentResult = analyze(patternInput.value, flags, textInput.value, replacementInput.value);
      const hasValues = Boolean(patternInput.value || textInput.value || replacementInput.value || flags !== 'g');
      const matchLabel = `${currentResult.metrics.matches.toLocaleString('en-US')}${currentResult.truncated ? '+' : ''} MATCH${currentResult.metrics.matches === 1 ? '' : 'ES'}`;
      const stateLabel = currentResult.error ? 'PATTERN ERROR' : currentResult.isEmpty ? 'PATTERN EMPTY' : 'PATTERN VALID';
      const previewLabel = currentResult.error ? 'INVALID PATTERN' : currentResult.isEmpty ? 'ADD A PATTERN' : currentResult.metrics.matches ? 'MATCH FOUND' : 'NO MATCH';

      patternState.textContent = stateLabel;
      patternState.dataset.state = currentResult.error ? 'invalid' : currentResult.isEmpty ? 'empty' : 'ready';
      patternInput.setAttribute('aria-invalid', currentResult.error ? 'true' : 'false');
      inputState.textContent = textInput.value ? 'INPUT READY' : 'INPUT EMPTY';
      inputState.dataset.state = textInput.value ? 'ready' : 'empty';
      previewState.textContent = previewLabel;
      previewState.dataset.state = currentResult.error ? 'invalid' : currentResult.metrics.matches ? 'ready' : 'empty';
      workspace.querySelector('[data-regex-flags-output]').textContent = flags || '—';
      workspace.querySelector('[data-regex-pattern-limit]').textContent = `${patternInput.value.length.toLocaleString('en-US')} / ${MAX_PATTERN_LENGTH.toLocaleString('en-US')} PATTERN LIMIT`;
      workspace.querySelector('[data-regex-input-limit]').textContent = `${textInput.value.length.toLocaleString('en-US')} / ${MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT`;
      workspace.querySelector('[data-regex-match-summary]').textContent = matchLabel;
      workspace.querySelector('[data-regex-scope]').textContent = flags.includes('g') ? 'GLOBAL ON' : 'GLOBAL OFF / FIRST MATCH';
      output.textContent = currentResult.input ? currentResult.output : '';
      if (!currentResult.input) output.innerHTML = '<span class="regex-tester__empty">[ OUTPUT_EMPTY ]</span>';
      workspace.querySelector('[data-regex-output-state]').textContent = currentResult.input ? currentResult.metrics.matches ? 'REPLACEMENT READY' : 'SOURCE UNCHANGED' : 'OUTPUT EMPTY';
      workspace.querySelector('[data-regex-output-count]').textContent = `${currentResult.metrics.outputCharacters.toLocaleString('en-US')} CHARS`;
      clearButton.disabled = !hasValues;
      copyRegexButton.disabled = currentResult.isEmpty || Boolean(currentResult.error);
      copyOutputButton.disabled = !currentResult.input || Boolean(currentResult.error);

      Object.entries(currentResult.metrics).forEach(([name, value]) => {
        const metric = workspace.querySelector(`[data-regex-metric="${name}"]`);
        if (metric) metric.textContent = ['inputCharacters', 'outputCharacters'].includes(name) ? `${value.toLocaleString('en-US')} CHARS` : value.toLocaleString('en-US');
      });
      renderPreview();
      renderMatches();
    };
    const scheduleRender = () => {
      window.cancelAnimationFrame(renderFrame);
      renderFrame = window.requestAnimationFrame(render);
    };

    [patternInput, textInput, replacementInput].forEach((control) => control.addEventListener('input', scheduleRender));
    workspace.querySelectorAll('[data-regex-flag]').forEach((control) => control.addEventListener('change', render));
    workspace.querySelector('[data-regex-sample]').addEventListener('click', () => {
      patternInput.value = '(?<property>--[a-z][\\w-]*)\\s*:\\s*(?<value>[^;]+);';
      textInput.value = ':root {\n  --color-primary: #18243b;\n  --space-unit: 1rem;\n}\n.card { color: var(--color-primary); }';
      replacementInput.value = '$<property>: var($<property>, $<value>);';
      workspace.querySelectorAll('[data-regex-flag]').forEach((control) => { control.checked = control.value === 'g'; });
      render();
      patternInput.focus();
    });
    clearButton.addEventListener('click', () => {
      patternInput.value = '';
      textInput.value = '';
      replacementInput.value = '';
      workspace.querySelectorAll('[data-regex-flag]').forEach((control) => { control.checked = control.value === 'g'; });
      render();
      patternInput.focus();
    });
    copyRegexButton.addEventListener('click', () => copyText(formatLiteral(patternInput.value, getFlags())));
    copyOutputButton.addEventListener('click', () => copyText(currentResult.output));
    render();
    window.addEventListener('pageshow', render, { once: true });
  };

  const api = {
    MAX_INPUT_LENGTH,
    MAX_PATTERN_LENGTH,
    MAX_REPLACEMENT_LENGTH,
    MAX_MATCHES,
    SUPPORTED_FLAGS,
    normalizeFlags,
    compile,
    analyze,
    formatLiteral,
    mount,
  };

  if (typeof window !== 'undefined') window.MarkBenchRegexTesterReplacer = api;
  if (typeof globalThis !== 'undefined') globalThis.MarkBenchRegexTesterReplacer = api;
})();
