(() => {
  'use strict';
  const MAX_INPUT_LENGTH = 100_000;
  const MAX_DEPTH = 128;
  const defaults = { keepLicense: true, omitSemicolon: true };
  const SAMPLE = `/*! MARK BENCH sample */
/* Layout */
.card {
  display: grid;
  gap: 16px;
  padding: 24px;
  width: calc(100% - 32px);
  background: linear-gradient(135deg, #ffffff, #e5e7eb);
}
.card .title { color: #18243b; }
@media (width >= 640px) {
  .card { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}`;
  const bytes = value => new TextEncoder().encode(value).length;
  const errorAt = (message, offset) => Object.assign(new Error(message), { offset });
  let semicolonSyntax;
  let parserSyntax;

  // Adapt CSSTree's MIT-licensed Block parser to retry a qualified nested rule
  // when declaration parsing fails (including nesting without an & selector).
  const createParser = engine => engine.fork({ node: { Block: { parse(isStyleBlock) {
    const t = engine.tokenTypes;
    const start = this.tokenStart;
    const children = this.createList();
    this.eat(t.LeftCurlyBracket);
    while (!this.eof && this.tokenType !== t.RightCurlyBracket) {
      if ([t.WhiteSpace, t.Comment, t.Semicolon].includes(this.tokenType)) { this.next(); continue; }
      if (this.tokenType === t.AtKeyword) { children.push(this.Atrule(isStyleBlock)); continue; }
      if (!isStyleBlock) { children.push(this.Rule()); continue; }
      const tokenIndex = this.tokenIndex;
      let node;
      try { node = this.Declaration(); }
      catch {
        this.skip(tokenIndex - this.tokenIndex);
        node = this.Rule();
      }
      children.push(node);
      if (this.tokenType === t.Semicolon) this.next();
    }
    this.eat(t.RightCurlyBracket);
    return { type: 'Block', loc: this.getLocation(start, this.tokenStart), children };
  } } } });

  // Tokenization catches truncated constructs which CSS parsers normally recover.
  const inspectTokens = (source, engine) => {
    const t = engine.tokenTypes;
    const stack = [];
    const comments = [];
    const openings = new Map([[t.Function, t.RightParenthesis], [t.LeftParenthesis, t.RightParenthesis], [t.LeftSquareBracket, t.RightSquareBracket], [t.LeftCurlyBracket, t.RightCurlyBracket]]);
    const closings = new Set([t.RightParenthesis, t.RightSquareBracket, t.RightCurlyBracket]);
    engine.tokenize(source, (type, start, end) => {
      const value = source.slice(start, end);
      if (type === t.BadString || type === t.BadUrl) throw errorAt('文字列またはurl()の構文を確認してください。', start);
      if (type === t.Comment) {
        if (!value.endsWith('*/')) throw errorAt('コメントが閉じられていません。', start);
        comments.push({ start, end, value });
      }
      if (type === t.String) {
        const trailingSlashes = value.slice(0, -1).match(/\\+$/u)?.[0].length || 0;
        if (value.length < 2 || value.at(-1) !== value[0] || trailingSlashes % 2) throw errorAt('引用符が閉じられていません。', start);
      }
      if (type === t.Url && !value.endsWith(')')) throw errorAt('url()が閉じられていません。', start);
      if (openings.has(type)) {
        stack.push({ expected: openings.get(type), start });
        if (stack.length > MAX_DEPTH) throw errorAt(`ネストは${MAX_DEPTH}段までにしてください。`, start);
      } else if (closings.has(type) && stack.pop()?.expected !== type) {
        throw errorAt('括弧の対応を確認してください。', start);
      }
    });
    if (stack.length) throw errorAt('括弧が閉じられていません。', stack.at(-1).start);
    return comments;
  };

  const minify = (input, options = {}) => {
    const source = String(input ?? '');
    const settings = { ...defaults, ...options };
    const base = { output: '', inputLength: source.length, inputBytes: source.length > MAX_INPUT_LENGTH ? null : bytes(source), outputLength: 0, outputBytes: 0, savedBytes: 0, reduction: 0 };
    if (source.length > MAX_INPUT_LENGTH) return { ...base, state: 'invalid', error: `入力は${MAX_INPUT_LENGTH.toLocaleString('en-US')}文字以内にしてください。` };
    if (!source.trim()) return { ...base, state: 'empty', error: '' };
    try {
      const engine = globalThis.csstree;
      if (!engine) throw new Error('圧縮モジュールを読み込めませんでした。ページを再読み込みしてください。');
      const comments = inspectTokens(source, engine);
      parserSyntax ||= createParser(engine);
      const ast = parserSyntax.parse(source, { positions: true, onParseError(error) { throw error; } });
      const rawRanges = [];
      engine.walk(ast, {
        enter(node, item, list) {
          if (node.type === 'Comment') list.remove(item);
          if (node.type === 'Raw') rawRanges.push([node.loc.start.offset, node.loc.end.offset]);
        },
      });
      let generator = engine;
      if (!settings.omitSemicolon) {
        semicolonSyntax ||= engine.fork({ node: { Block: { generate(node) {
          this.token(engine.tokenTypes.LeftCurlyBracket, '{');
          this.children(node, previous => { if (previous.type === 'Declaration') this.token(engine.tokenTypes.Semicolon, ';'); });
          if (node.children.last?.type === 'Declaration') this.token(engine.tokenTypes.Semicolon, ';');
          this.token(engine.tokenTypes.RightCurlyBracket, '}');
        } } } });
        generator = semicolonSyntax;
      }
      let output = generator.generate(ast);
      const license = settings.keepLicense ? comments.filter(comment => comment.value.startsWith('/*!') && !rawRanges.some(([start, end]) => comment.start >= start && comment.end <= end)).map(comment => comment.value).join('') : '';
      // Keep @charset first when present; license text is copied verbatim.
      const charsetLength = output.match(/^@charset\s*(?:"[^"\n]*"|'[^'\n]*');/iu)?.[0].length || 0;
      output = output.slice(0, charsetLength) + license + output.slice(charsetLength);
      const outputBytes = bytes(output);
      return { ...base, state: 'ready', error: '', output, outputLength: output.length, outputBytes, savedBytes: base.inputBytes - outputBytes, reduction: (1 - outputBytes / base.inputBytes) * 100 };
    } catch (error) {
      const offset = Number.isInteger(error.offset) ? error.offset : 0;
      const prefix = source.slice(0, offset);
      const line = prefix.split('\n').length;
      const column = offset - prefix.lastIndexOf('\n');
      return { ...base, state: 'invalid', error: `${line}行 ${column}列：${error.message}`, line, column };
    }
  };

  const mount = ({ workspace, copyText, showToast }) => {
    workspace.innerHTML = `<div class="css-minifier">
      <fieldset class="css-minifier__options"><legend>COMPRESSION OPTIONS</legend>
        <label><input type="checkbox" data-minifier-option="keepLicense" checked> /*! ライセンスコメントを保持</label>
        <label><input type="checkbox" data-minifier-option="omitSemicolon" checked> 最後のセミコロンを省略</label>
      </fieldset>
      <div class="css-minifier__editors">
        <section class="css-minifier__panel" aria-labelledby="minifier-input-title"><div class="workspace-panel__header"><label id="minifier-input-title" for="minifier-input">INPUT / CSS</label><div class="workspace-actions"><button class="workspace-action" type="button" data-minifier-sample>SAMPLE</button><button class="workspace-action" type="button" data-minifier-clear>CLEAR</button></div></div>
          <textarea id="minifier-input" data-minifier-input spellcheck="false" autocapitalize="off" aria-describedby="minifier-limit minifier-error" placeholder=".card { color: #18243b; padding: 24px; }"></textarea>
          <p class="css-minifier__limit" id="minifier-limit" data-minifier-limit>0 / 100,000 CHARACTERS</p>
        </section>
        <section class="css-minifier__panel" aria-labelledby="minifier-output-title"><div class="workspace-panel__header"><label id="minifier-output-title" for="minifier-output">OUTPUT / MINIFIED CSS</label><button class="workspace-action" type="button" data-copy-minified disabled>COPY CSS</button></div>
          <textarea id="minifier-output" data-minifier-output readonly spellcheck="false" aria-describedby="minifier-status" placeholder="圧縮結果がここに表示されます。"></textarea><p class="css-minifier__limit">AUTO MINIFY / LOCAL PROCESSING</p>
        </section>
      </div>
      <p class="css-minifier__error" id="minifier-error" role="alert" data-minifier-error hidden></p>
      <p class="css-minifier__status" id="minifier-status" role="status" aria-live="polite" data-minifier-status>EMPTY / CSSを入力してください。</p>
      <dl class="css-minifier__metrics" aria-label="圧縮結果の集計">${[['input', 'INPUT / UTF-8'], ['output', 'OUTPUT / UTF-8'], ['saved', 'SAVED / BYTES'], ['rate', 'REDUCTION']].map(([key, label]) => `<div><dt>${label}</dt><dd data-minifier-metric="${key}">—</dd></div>`).join('')}</dl>
      <p class="css-minifier__note">通常のコメントと余分な空白を削減します。CSS変数など未解析の値は、空白・コメントを含めて保持します。数値・色の短縮やルールの統合は行いません。</p>
    </div>`;
    const input = workspace.querySelector('[data-minifier-input]');
    const output = workspace.querySelector('[data-minifier-output]');
    const copy = workspace.querySelector('[data-copy-minified]');
    const error = workspace.querySelector('[data-minifier-error]');
    const status = workspace.querySelector('[data-minifier-status]');
    const controls = [...workspace.querySelectorAll('[data-minifier-option]')];
    let timer;
    let revision = 0;
    let composing = false;
    const render = () => {
      clearTimeout(timer);
      const result = minify(input.value, Object.fromEntries(controls.map(control => [control.dataset.minifierOption, control.checked])));
      output.value = result.output;
      copy.disabled = result.state !== 'ready' || !result.output;
      input.setAttribute('aria-invalid', String(result.state === 'invalid'));
      error.textContent = result.error;
      error.hidden = !result.error;
      status.textContent = result.state === 'ready' ? `READY / ${result.outputLength.toLocaleString('en-US')} CHARACTERS / ${result.output ? 'COPY AVAILABLE' : 'EMPTY OUTPUT'}` : result.state === 'invalid' ? 'INVALID INPUT / 入力を確認してください。' : 'EMPTY / CSSを入力してください。';
      workspace.querySelector('[data-minifier-limit]').textContent = `${input.value.length.toLocaleString('en-US')} / 100,000 CHARACTERS`;
      const metrics = { input: result.inputBytes === null ? '—' : `${result.inputBytes.toLocaleString('en-US')} B`, output: result.state === 'ready' ? `${result.outputBytes.toLocaleString('en-US')} B` : '—', saved: result.state === 'ready' ? `${result.savedBytes.toLocaleString('en-US')} B` : '—', rate: result.state === 'ready' ? `${result.reduction.toFixed(1)}%` : '—' };
      for (const [key, value] of Object.entries(metrics)) workspace.querySelector(`[data-minifier-metric="${key}"]`).textContent = value;
    };
    const schedule = () => {
      clearTimeout(timer);
      revision += 1;
      output.value = '';
      copy.disabled = true;
      status.textContent = composing ? 'COMPOSING / 入力中' : 'PROCESSING / 圧縮中';
      if (!composing) timer = setTimeout(render, 180);
    };
    input.addEventListener('input', schedule);
    input.addEventListener('compositionstart', () => { composing = true; schedule(); });
    input.addEventListener('compositionend', () => { composing = false; schedule(); });
    controls.forEach(control => control.addEventListener('change', () => { revision += 1; render(); }));
    workspace.querySelector('[data-minifier-sample]').addEventListener('click', () => { revision += 1; input.value = SAMPLE; render(); input.focus(); });
    workspace.querySelector('[data-minifier-clear]').addEventListener('click', () => {
      revision += 1;
      composing = false;
      input.value = '';
      controls.forEach(control => { control.checked = defaults[control.dataset.minifierOption]; });
      render();
      input.focus();
      showToast('表示内容をリセットしました。', 'reset');
    });
    copy.addEventListener('click', async () => {
      const value = output.value;
      const currentRevision = revision;
      copy.disabled = true;
      await copyText(value);
      if (currentRevision === revision) copy.disabled = !output.value;
    });
    render();
  };
  globalThis.MarkBenchCssMinifier = { MAX_INPUT_LENGTH, MAX_DEPTH, defaults, SAMPLE, minify, mount };
})();
