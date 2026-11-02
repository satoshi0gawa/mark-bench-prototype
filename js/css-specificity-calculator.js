(() => {
  const MAX_INPUT_LENGTH = 100000;
  const MAX_SELECTORS = 200;
  const LEGACY_PSEUDO_ELEMENTS = new Set(['before', 'after', 'first-line', 'first-letter']);
  const SELECTOR_LIST_PSEUDOS = new Set(['is', 'not', 'has']);
  const HOST_PSEUDOS = new Set(['host', 'host-context']);
  const NTH_PSEUDOS = new Set(['nth-child', 'nth-last-child']);

  const addSpecificity = (left, right) => [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
  const compareSpecificity = (left, right) => {
    for (let index = 0; index < 3; index += 1) {
      if (left[index] !== right[index]) return left[index] - right[index];
    }
    return 0;
  };
  const maxSpecificity = (values) => values.reduce((highest, value) => compareSpecificity(value, highest) > 0 ? value : highest, [0, 0, 0]);
  const formatSpecificity = (value) => value.join('-');

  const splitTopLevel = (input, delimiters = new Set([',', '\n'])) => {
    const source = String(input);
    const parts = [];
    let start = 0;
    let parentheses = 0;
    let brackets = 0;
    let quote = '';
    let escaped = false;
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (escaped) { escaped = false; continue; }
      if (character === '\\') { escaped = true; continue; }
      if (quote) {
        if (character === quote) quote = '';
        continue;
      }
      if (character === '"' || character === "'") { quote = character; continue; }
      if (character === '(') parentheses += 1;
      else if (character === ')') parentheses -= 1;
      else if (character === '[') brackets += 1;
      else if (character === ']') brackets -= 1;
      else if (parentheses === 0 && brackets === 0 && delimiters.has(character)) {
        const part = source.slice(start, index).trim();
        if (part) parts.push(part);
        start = index + 1;
      }
    }
    const finalPart = source.slice(start).trim();
    if (finalPart) parts.push(finalPart);
    return parts;
  };

  const readIdentifier = (source, start) => {
    let index = start;
    while (index < source.length) {
      const character = source[index];
      if (character === '\\' && index + 1 < source.length) { index += 2; continue; }
      if (/[-_\p{L}\p{N}]/u.test(character)) { index += 1; continue; }
      break;
    }
    return { value: source.slice(start, index), end: index };
  };

  const readBlock = (source, start, open, close) => {
    let depth = 1;
    let quote = '';
    let escaped = false;
    for (let index = start + 1; index < source.length; index += 1) {
      const character = source[index];
      if (escaped) { escaped = false; continue; }
      if (character === '\\') { escaped = true; continue; }
      if (quote) {
        if (character === quote) quote = '';
        continue;
      }
      if (character === '"' || character === "'") { quote = character; continue; }
      if (character === open) depth += 1;
      else if (character === close) {
        depth -= 1;
        if (depth === 0) return { content: source.slice(start + 1, index), end: index + 1 };
      }
    }
    return null;
  };

  const findNthOfSelector = (content) => {
    let parentheses = 0;
    let brackets = 0;
    let quote = '';
    let escaped = false;
    for (let index = 0; index < content.length - 1; index += 1) {
      const character = content[index];
      if (escaped) { escaped = false; continue; }
      if (character === '\\') { escaped = true; continue; }
      if (quote) { if (character === quote) quote = ''; continue; }
      if (character === '"' || character === "'") { quote = character; continue; }
      if (character === '(') parentheses += 1;
      else if (character === ')') parentheses -= 1;
      else if (character === '[') brackets += 1;
      else if (character === ']') brackets -= 1;
      if (parentheses || brackets) continue;
      if ((character === 'o' || character === 'O') && (content[index + 1] === 'f' || content[index + 1] === 'F')) {
        const before = content[index - 1] || ' ';
        const after = content[index + 2] || ' ';
        if (/\s/u.test(before) && /\s/u.test(after)) return content.slice(index + 2).trim();
      }
    }
    return '';
  };

  const analyzeSelector = (selector) => {
    const source = String(selector).trim();
    const details = [];
    const warnings = [];
    const errors = [];
    let specificity = [0, 0, 0];
    let index = 0;

    const add = (token, contribution, reason) => {
      specificity = addSpecificity(specificity, contribution);
      details.push({ token, contribution, reason });
    };
    const analyzeListMax = (content) => {
      const selectors = splitTopLevel(content, new Set([',']));
      if (!selectors.length) {
        errors.push('関数内のセレクターが空です。');
        return [0, 0, 0];
      }
      const analyses = selectors.map((item) => analyzeSelector(item));
      analyses.forEach((analysis) => {
        warnings.push(...analysis.warnings);
        errors.push(...analysis.errors.map((message) => `関数内: ${message}`));
      });
      return maxSpecificity(analyses.filter((analysis) => analysis.valid).map((analysis) => analysis.specificity));
    };

    if (!source) return { selector: source, specificity, score: formatSpecificity(specificity), details, warnings, errors: ['セレクターが空です。'], valid: false };

    while (index < source.length) {
      const character = source[index];
      if (/\s/u.test(character) || character === '>' || character === '+' || character === '~' || character === ',') { index += 1; continue; }
      if (character === '|' && source[index + 1] === '|') { index += 2; continue; }
      if (character === '&') {
        details.push({ token: '&', contribution: [0, 0, 0], reason: 'NESTING SELECTOR' });
        warnings.push('ネストセレクター&自体は詳細度を追加しません。親セレクターの詳細度は別途確認してください。');
        index += 1;
        continue;
      }
      if (character === '#') {
        const identifier = readIdentifier(source, index + 1);
        if (!identifier.value) errors.push('#の後にID名がありません。');
        else add(`#${identifier.value}`, [1, 0, 0], 'ID');
        index = Math.max(identifier.end, index + 1);
        continue;
      }
      if (character === '.') {
        const identifier = readIdentifier(source, index + 1);
        if (!identifier.value) errors.push('.の後にクラス名がありません。');
        else add(`.${identifier.value}`, [0, 1, 0], 'CLASS');
        index = Math.max(identifier.end, index + 1);
        continue;
      }
      if (character === '[') {
        const block = readBlock(source, index, '[', ']');
        if (!block) { errors.push('属性セレクターの]が不足しています。'); break; }
        add(`[${block.content}]`, [0, 1, 0], 'ATTRIBUTE');
        index = block.end;
        continue;
      }
      if (character === ':') {
        const isPseudoElement = source[index + 1] === ':';
        const nameStart = index + (isPseudoElement ? 2 : 1);
        const identifier = readIdentifier(source, nameStart);
        const name = identifier.value.toLowerCase();
        if (!name) { errors.push('疑似クラスまたは疑似要素名がありません。'); index += isPseudoElement ? 2 : 1; continue; }
        const functional = source[identifier.end] === '(';
        let block = null;
        if (functional) {
          block = readBlock(source, identifier.end, '(', ')');
          if (!block) { errors.push(`:${name}()の閉じ括弧が不足しています。`); break; }
        }
        const token = `${isPseudoElement ? '::' : ':'}${name}${block ? `(${block.content})` : ''}`;
        if (isPseudoElement || LEGACY_PSEUDO_ELEMENTS.has(name)) {
          add(token, [0, 0, 1], 'PSEUDO-ELEMENT');
          if (name === 'slotted' && block) {
            const argumentSpecificity = analyzeListMax(block.content);
            if (argumentSpecificity.some(Boolean)) add(`::slotted() argument`, argumentSpecificity, 'MOST SPECIFIC ARGUMENT');
          }
        } else if (name === 'where' && block) {
          analyzeListMax(block.content);
          details.push({ token, contribution: [0, 0, 0], reason: ':where() IS ALWAYS ZERO' });
        } else if (SELECTOR_LIST_PSEUDOS.has(name) && block) {
          const argumentSpecificity = analyzeListMax(block.content);
          add(token, argumentSpecificity, 'MOST SPECIFIC ARGUMENT');
        } else if (NTH_PSEUDOS.has(name) && block) {
          add(`:${name}()`, [0, 1, 0], 'PSEUDO-CLASS');
          const ofSelector = findNthOfSelector(block.content);
          if (ofSelector) {
            const argumentSpecificity = analyzeListMax(ofSelector);
            add(`${name}() of ${ofSelector}`, argumentSpecificity, 'MOST SPECIFIC OF-SELECTOR');
          }
        } else if (HOST_PSEUDOS.has(name) && block) {
          add(`:${name}()`, [0, 1, 0], 'PSEUDO-CLASS');
          const argumentSpecificity = analyzeListMax(block.content);
          if (argumentSpecificity.some(Boolean)) add(`${name}() argument`, argumentSpecificity, 'MOST SPECIFIC ARGUMENT');
        } else {
          add(token, [0, 1, 0], 'PSEUDO-CLASS');
        }
        index = block ? block.end : identifier.end;
        continue;
      }
      if (character === '*') {
        if (source[index + 1] === '|' && source[index + 2] !== '|') {
          index += 2;
          if (source[index] === '*') { index += 1; continue; }
          const target = readIdentifier(source, index);
          if (target.value) add(`*|${target.value}`, [0, 0, 1], 'TYPE');
          index = Math.max(target.end, index + 1);
        } else {
          details.push({ token: '*', contribution: [0, 0, 0], reason: 'UNIVERSAL SELECTOR' });
          index += 1;
        }
        continue;
      }
      if (character === '%' || character === '@') {
        errors.push(`未対応の文字「${character}」があります。`);
        index += 1;
        continue;
      }
      const identifier = readIdentifier(source, index);
      if (identifier.value) {
        if (source[identifier.end] === '|' && source[identifier.end + 1] !== '|') {
          let targetStart = identifier.end + 1;
          if (source[targetStart] === '*') {
            details.push({ token: `${identifier.value}|*`, contribution: [0, 0, 0], reason: 'UNIVERSAL SELECTOR' });
            index = targetStart + 1;
          } else {
            const target = readIdentifier(source, targetStart);
            if (target.value) add(`${identifier.value}|${target.value}`, [0, 0, 1], 'TYPE');
            else errors.push('名前空間の後に要素名がありません。');
            index = Math.max(target.end, targetStart + 1);
          }
        } else {
          add(identifier.value, [0, 0, 1], 'TYPE');
          index = identifier.end;
        }
        continue;
      }
      errors.push(`解析できない文字「${character}」があります。`);
      index += 1;
    }

    return {
      selector: source,
      specificity,
      score: formatSpecificity(specificity),
      details,
      warnings: [...new Set(warnings)],
      errors: [...new Set(errors)],
      valid: errors.length === 0,
    };
  };

  const analyzeInput = (input = '') => {
    const source = String(input).slice(0, MAX_INPUT_LENGTH);
    const selectors = splitTopLevel(source).slice(0, MAX_SELECTORS);
    const results = selectors.map(analyzeSelector);
    const validResults = results.filter((result) => result.valid);
    const highest = maxSpecificity(validResults.map((result) => result.specificity));
    return {
      source,
      results,
      truncated: splitTopLevel(source).length > MAX_SELECTORS,
      highest,
      metrics: {
        selectors: results.length,
        valid: validResults.length,
        errors: results.length - validResults.length,
        ids: validResults.reduce((sum, result) => sum + result.specificity[0], 0),
        classLike: validResults.reduce((sum, result) => sum + result.specificity[1], 0),
        typeLike: validResults.reduce((sum, result) => sum + result.specificity[2], 0),
      },
    };
  };

  const formatReport = (analysis) => analysis.results.map((result) => {
    const status = result.valid ? result.score : `ERROR: ${result.errors.join(' / ')}`;
    return `${status}\t${result.selector}`;
  }).join('\n');

  const mount = ({ workspace, copyText, showToast, escapeMarkup }) => {
    workspace.innerHTML = `
      <div class="specificity-calculator">
        <div class="workspace-grid workspace-grid--specificity">
          <section class="workspace-panel specificity-calculator__source" aria-label="CSSセレクター入力">
            <div class="workspace-panel__header"><span>CSS SELECTORS / INPUT</span><div class="workspace-actions"><button class="workspace-action" type="button" data-specificity-sample>SAMPLE</button><button class="workspace-action" type="button" data-specificity-clear disabled>CLEAR</button></div></div>
            <label class="visually-hidden" for="specificity-input">詳細度を計算するCSSセレクター</label>
            <textarea id="specificity-input" maxlength="${MAX_INPUT_LENGTH}" placeholder=".card__title:hover&#10;#main .card[data-state=active]&#10;:where(.layout) :is(.button, #submit)" spellcheck="false" data-specificity-input></textarea>
            <div class="workspace-panel__footer"><span data-specificity-input-state data-state="empty">INPUT EMPTY</span><span data-specificity-input-limit>0 / ${MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT</span></div>
          </section>

          <section class="specificity-calculator__results" aria-labelledby="specificity-results-title">
            <div class="workspace-panel__header"><span id="specificity-results-title">SPECIFICITY RESULTS</span><div class="workspace-actions"><label class="specificity-calculator__sort"><input type="checkbox" data-specificity-sort><span>HIGHEST FIRST</span></label><button class="workspace-action" type="button" data-copy-specificity disabled>COPY REPORT</button></div></div>
            <div class="specificity-calculator__legend"><span><i>A</i>ID</span><span><i>B</i>CLASS / ATTRIBUTE / PSEUDO-CLASS</span><span><i>C</i>TYPE / PSEUDO-ELEMENT</span></div>
            <div class="specificity-calculator__list" data-specificity-results></div>
            <div class="workspace-panel__footer"><span data-specificity-output-state data-state="empty">ADD SELECTORS</span><span data-specificity-summary>0 SELECTORS</span></div>
          </section>

          <section class="specificity-calculator__reference" aria-labelledby="specificity-reference-title">
            <div class="workspace-panel__header"><span id="specificity-reference-title">MODERN PSEUDO-CLASS RULES</span><span>SELECTORS LEVEL 4</span></div>
            <dl><div><dt>:where()</dt><dd>常に 0-0-0</dd></div><div><dt>:is() / :not() / :has()</dt><dd>引数内で最も高い詳細度</dd></div><div><dt>:nth-child(... of S)</dt><dd>0-1-0 ＋ S内で最も高い詳細度</dd></div><div><dt>::slotted()</dt><dd>0-0-1 ＋ 引数の詳細度</dd></div></dl>
          </section>

          <dl class="specificity-calculator__metrics" aria-label="詳細度の集計結果">
            <div><dt>SELECTORS</dt><dd data-specificity-metric="selectors">0</dd></div>
            <div><dt>VALID</dt><dd data-specificity-metric="valid">0</dd></div>
            <div><dt>ERRORS</dt><dd data-specificity-metric="errors">0</dd></div>
            <div><dt>Σ ID</dt><dd data-specificity-metric="ids">0</dd></div>
            <div><dt>Σ CLASS-LIKE</dt><dd data-specificity-metric="classLike">0</dd></div>
            <div><dt>Σ TYPE-LIKE</dt><dd data-specificity-metric="typeLike">0</dd></div>
            <div><dt>HIGHEST</dt><dd data-specificity-highest>0-0-0</dd></div>
          </dl>
        </div>
      </div>`;

    const input = workspace.querySelector('[data-specificity-input]');
    const results = workspace.querySelector('[data-specificity-results]');
    const clearButton = workspace.querySelector('[data-specificity-clear]');
    const copyButton = workspace.querySelector('[data-copy-specificity]');
    const sortControl = workspace.querySelector('[data-specificity-sort]');
    let currentAnalysis = analyzeInput('');
    let renderFrame = 0;

    const renderResults = () => {
      const indexed = currentAnalysis.results.map((result, sourceIndex) => ({ result, sourceIndex }));
      if (sortControl.checked) indexed.sort((left, right) => compareSpecificity(right.result.specificity, left.result.specificity) || left.sourceIndex - right.sourceIndex);
      if (!indexed.length) {
        results.innerHTML = '<div class="specificity-calculator__empty"><span>[ WAITING_FOR_SELECTORS ]</span><p>1行ごと、またはカンマ区切りでセレクターを入力してください。</p></div>';
        return;
      }
      results.innerHTML = indexed.map(({ result, sourceIndex }) => {
        const isHighest = result.valid && compareSpecificity(result.specificity, currentAnalysis.highest) === 0;
        const detailMarkup = result.details.length
          ? result.details.map((detail) => `<span><code>${escapeMarkup(detail.token)}</code><i>${formatSpecificity(detail.contribution)}</i><small>${detail.reason}</small></span>`).join('')
          : '<span><small>NO SPECIFICITY</small></span>';
        const messageMarkup = [
          ...result.errors.map((message) => `<p data-level="error">${escapeMarkup(message)}</p>`),
          ...result.warnings.map((message) => `<p data-level="warning">${escapeMarkup(message)}</p>`),
        ].join('');
        return `<article class="specificity-calculator__result${isHighest ? ' is-highest' : ''}${result.valid ? '' : ' is-invalid'}">
          <header><span>#${String(sourceIndex + 1).padStart(2, '0')}</span><code>${escapeMarkup(result.selector)}</code><strong>${result.valid ? result.score : 'ERROR'}</strong></header>
          <div class="specificity-calculator__score" aria-label="詳細度 ${result.score}"><span><i>A</i><b>${result.specificity[0]}</b></span><span><i>B</i><b>${result.specificity[1]}</b></span><span><i>C</i><b>${result.specificity[2]}</b></span></div>
          <div class="specificity-calculator__details">${detailMarkup}</div>
          ${messageMarkup ? `<div class="specificity-calculator__messages">${messageMarkup}</div>` : ''}
        </article>`;
      }).join('') + (currentAnalysis.truncated ? `<div class="specificity-calculator__truncated">FIRST ${MAX_SELECTORS} SELECTORS DISPLAYED</div>` : '');
    };
    const render = () => {
      currentAnalysis = analyzeInput(input.value);
      const hasInput = Boolean(input.value);
      const stateLabel = !hasInput ? 'INPUT EMPTY' : currentAnalysis.metrics.errors ? 'CHECK SELECTORS' : 'CALCULATED';
      workspace.querySelector('[data-specificity-input-state]').textContent = stateLabel;
      workspace.querySelector('[data-specificity-input-state]').dataset.state = !hasInput ? 'empty' : currentAnalysis.metrics.errors ? 'invalid' : 'ready';
      workspace.querySelector('[data-specificity-input-limit]').textContent = `${input.value.length.toLocaleString('en-US')} / ${MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT`;
      workspace.querySelector('[data-specificity-output-state]').textContent = !hasInput ? 'ADD SELECTORS' : currentAnalysis.metrics.errors ? 'PARTIAL RESULT' : 'RESULT READY';
      workspace.querySelector('[data-specificity-output-state]').dataset.state = !hasInput ? 'empty' : currentAnalysis.metrics.errors ? 'invalid' : 'ready';
      workspace.querySelector('[data-specificity-summary]').textContent = `${currentAnalysis.metrics.selectors} SELECTORS / ${currentAnalysis.metrics.errors} ERRORS`;
      workspace.querySelector('[data-specificity-highest]').textContent = formatSpecificity(currentAnalysis.highest);
      clearButton.disabled = !hasInput;
      copyButton.disabled = !currentAnalysis.results.length;
      Object.entries(currentAnalysis.metrics).forEach(([name, value]) => {
        const element = workspace.querySelector(`[data-specificity-metric="${name}"]`);
        if (element) element.textContent = String(value);
      });
      renderResults();
    };
    const scheduleRender = () => {
      window.cancelAnimationFrame(renderFrame);
      renderFrame = window.requestAnimationFrame(render);
    };

    input.addEventListener('input', scheduleRender);
    sortControl.addEventListener('change', renderResults);
    workspace.querySelector('[data-specificity-sample]').addEventListener('click', () => {
      input.value = '.card__title:hover\n#main .card[data-state="active"] > h2::before\n:where(.layout, #app) .button\n:is(.button, #submit) > span\nul li:nth-child(2n of .item, #featured)\nform:has(input:invalid) .message';
      render();
      input.focus();
    });
    clearButton.addEventListener('click', () => {
      input.value = '';
      sortControl.checked = false;
      render();
      input.focus();
    });
    copyButton.addEventListener('click', () => copyText(formatReport(currentAnalysis)));
    render();
    window.addEventListener('pageshow', render, { once: true });
  };

  const api = {
    MAX_INPUT_LENGTH,
    MAX_SELECTORS,
    splitTopLevel,
    addSpecificity,
    compareSpecificity,
    maxSpecificity,
    formatSpecificity,
    analyzeSelector,
    analyzeInput,
    formatReport,
    mount,
  };

  if (typeof window !== 'undefined') window.MarkBenchCssSpecificityCalculator = api;
  if (typeof globalThis !== 'undefined') globalThis.MarkBenchCssSpecificityCalculator = api;
})();
