(() => {
  const workspace = document.querySelector('[data-tool-workspace]');
  if (!workspace || workspace.dataset.toolWorkspaceInitialized === 'true') return;
  workspace.dataset.toolWorkspaceInitialized = 'true';

  const definitions = {
    'text-case-converter': {
      number: 'TEXT_TOOLS',
      title: 'Text Case Converter',
      summary: '入力した文字列を複数の命名規則へまとめて変換します。',
      status: 'READY',
      version: '0.2.0',
      kind: 'case',
      steps: ['入力欄へ変換したい文字列を入力します。', '入力内容に合わせて変換結果が自動的に更新されます。', '必要な形式のコピーボタンを押して使用します。'],
      specs: [['INPUT', 'Plain Text'], ['OUTPUT', '9 Styles'], ['DEPENDENCY', 'None'], ['STORAGE', 'None']],
    },
    'character-counter': {
      number: 'TEXT_TOOLS',
      title: 'Character Counter',
      summary: '文字数・単語数・行数・UTF-8バイト数をリアルタイムで確認します。',
      status: 'READY',
      version: '0.2.0',
      kind: 'counter',
      steps: ['入力欄へ確認したい文章を入力します。', '6種類の集計結果がリアルタイムで更新されます。', 'COPY SUMMARYで集計結果をまとめてコピーできます。', 'CLEARで入力内容と集計結果をリセットできます。'],
      specs: [['INPUT', 'Plain Text'], ['OUTPUT', '6 Metrics'], ['LIMIT', '100,000 Input Units'], ['DEPENDENCY', 'None'], ['STORAGE', 'None']],
    },
    'text-formatter': {
      number: 'TEXT_TOOLS',
      title: 'Text Formatter',
      summary: '行・空白・文字種を目的に合わせて段階的に整形します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'formatter',
      steps: ['CMS原稿や商品情報など、整理したいテキストを入力します。', '行・空白・文字変換から必要な処理を順番に実行します。', '結果を確認し、必要に応じてUNDOまたはRESET TO SOURCEで戻します。', 'COPY OUTPUTを押して整形済みテキストを使用します。'],
      specs: [['INPUT', 'Plain Text'], ['ACTIONS', '16 Operations'], ['HISTORY', '50 Steps'], ['SORT', 'Japanese Locale'], ['LIMIT', '100,000 Input Units'], ['STORAGE', 'None']],
    },
    'width-converter': {
      number: 'TEXT_TOOLS',
      title: 'Width Converter',
      summary: '文字種別ごとのルールで全角・半角を変換し、表記の混在を検出します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'width',
      steps: ['一括変換・個別変換・文字チェックから目的に合うモードを選択します。', '変換または検出する文字種とルールを設定します。', '入力と結果、変更箇所または検出位置を確認します。', '結果をコピーするか、出力を次の入力として反映します。'],
      specs: [['MODES', 'Batch / Custom / Check'], ['TYPES', '6 Character Groups'], ['KANA', 'Dakuten Composition'], ['CHECK', 'Line + Column'], ['LIMIT', '100,000 Input Units'], ['STORAGE', 'None']],
    },
    'unicode-inspector': {
      number: 'TEXT_TOOLS',
      title: 'Unicode Inspector',
      summary: '文字コードと不可視文字をコードポイント単位で確認します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'unicode',
      steps: ['調査したいテキストを入力または貼り付けます。', '全体の文字数と不可視・特殊文字の検出結果を確認します。', '各文字のコードポイント、符号化結果、エスケープ表記を確認します。', '必要に応じてコードポイントまたは解析レポートをコピーします。'],
      specs: [['UNIT', 'Code Point'], ['ENCODING', 'UTF-8 / UTF-16'], ['ESCAPE', 'HTML / CSS / JS'], ['DISPLAY', 'First 300'], ['LIMIT', '100,000 Input Units'], ['STORAGE', 'None']],
    },
    'directory-tree-generator': {
      number: 'CODE_TOOLS',
      title: 'Directory Tree Generator',
      summary: 'インデント付きの一覧から共有用のディレクトリツリーを生成します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'tree',
      steps: ['ディレクトリとファイルを1行ずつ入力します。', '半角スペースまたはタブで階層を表します。', '入力形式と出力オプションを調整し、警告があれば対象行を確認します。', 'COPY OUTPUTを押してREADMEや仕様書へ貼り付けます。'],
      specs: [['INPUT', 'Indented Lines'], ['OUTPUT', 'Unicode Tree'], ['INDENT', 'Auto / 2 / 4 / Tab'], ['LIMIT', '100,000 Input Units'], ['NODES', 'First 10,000'], ['STORAGE', 'None']],
    },
    'markdown-preview-editor': {
      number: 'TEXT_TOOLS',
      title: 'Markdown Preview Editor',
      summary: 'Markdownを編集しながら、安全なHTMLプレビューと文書構造を確認します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'markdown',
      steps: ['左側の入力欄へMarkdownを入力します。', '右側でレンダリング結果または生成HTMLを確認します。', '見出し構造やリンクなどの警告を確認します。', 'MarkdownまたはHTMLをコピーして制作環境で使用します。'],
      specs: [['INPUT', 'Markdown'], ['OUTPUT', 'Preview + HTML'], ['CHECK', 'Structure + Safe URL'], ['LIMIT', '100,000 Input Units'], ['HTML', 'Escaped'], ['STORAGE', 'None']],
    },
    'html-table-builder': {
      number: 'CODE_TOOLS',
      title: 'HTML Table Builder',
      summary: 'セルを編集し、見出し構造と表示設定を反映したアクセシブルなHTMLテーブルを生成します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'table',
      steps: ['テンプレートまたは行数・列数を選び、セル内容を入力します。', '表計算ソフトの複数セルは、そのままセルへ貼り付けられます。', '見出し・キャプション・整列と、色・罫線・余白・交互行を設定します。', 'プレビューと警告を確認し、HTMLまたはCSSをコピーします。'],
      specs: [['INPUT', 'Editable Grid / TSV'], ['OUTPUT', 'HTML + CSS'], ['STRUCTURE', 'Caption / Scope'], ['STYLE', 'Header / Border / Stripe'], ['LIMIT', '20 Rows × 12 Columns'], ['MODES', 'Class / Inline'], ['STORAGE', 'None']],
    },
    'bem-class-builder': {
      number: 'CSS_TOOLS',
      title: 'BEM Class Builder',
      summary: 'サイトパーツの候補から、構造が伝わるBEMクラス名を構築・検証します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'bem',
      steps: ['対象パーツに近いカテゴリーを選び、候補を検索します。', 'BLOCK・ELEMENT・MODIFIERへ名前を入力するか、候補を選択します。', '正規化された構造と命名上の警告を確認します。', 'クラス一覧・セレクター・class属性・CSS雛形から必要な形式をコピーします。'],
      specs: [['INPUT', 'Block / Element / Modifier'], ['OUTPUT', 'Class / Selector / HTML / CSS'], ['RULE', 'block__element--modifier'], ['CATEGORIES', '11 Site Parts'], ['CHECK', 'Structure + Semantics'], ['LIMIT', '80 Characters / Part'], ['STORAGE', 'None']],
    },
    'color-format-converter': {
      number: 'CSS_TOOLS',
      title: 'Color Format Converter',
      summary: 'HEX・RGB・HSL・HSVを相互変換し、透明度とテキストコントラストを確認します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'color',
      steps: ['カラーピッカーまたはいずれかの形式へ色を入力します。', '有効な入力は他形式とプレビューへリアルタイム反映されます。', '黒・白文字のコントラストとAA判定を確認します。', '必要なカラー形式またはCSS変数をコピーします。'],
      specs: [['INPUT', 'HEX / RGB / HSL / HSV'], ['OUTPUT', 'CSS Color + Token'], ['ALPHA', '0–1 / 0–100%'], ['CONTRAST', 'WCAG AA / White Canvas'], ['HISTORY', '8 Colors / Session'], ['COLOR SPACE', 'sRGB'], ['STORAGE', 'None']],
    },
    'slug-generator': {
      number: 'TEXT_TOOLS',
      title: 'Slug Generator',
      summary: 'タイトルや文字列からURLに使用しやすいスラッグを生成します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'slug',
      steps: ['入力欄へタイトルや文字列を入力します。', '区切り文字と英字の小文字化を選択します。', 'スラッグとURLエンコード結果を確認します。', '必要な結果のCOPYを押して使用します。'],
      specs: [['INPUT', 'Title Text'], ['OUTPUT', 'Slug + Encoded'], ['LIMIT', '200 Input / 80 Output'], ['NORMALIZE', 'Unicode NFKD'], ['STORAGE', 'None']],
    },
    'json-formatter': {
      number: 'CODE_TOOLS',
      title: 'JSON Formatter',
      summary: 'JSONデータを整形し、構文エラーを確認するためのツールです。',
      status: 'READY',
      version: '0.1.0',
      kind: 'json',
      steps: ['入力欄へJSONデータを入力します。', '整形または圧縮の出力モードとインデントを選択します。', '構文チェックの結果と、エラー時は位置情報を確認します。', '有効な結果のCOPY OUTPUTを押して使用します。'],
      specs: [['INPUT', 'JSON'], ['OUTPUT', 'Pretty + Minified'], ['INDENT', '2 / 4 / Tab'], ['LIMIT', '100,000 Input Units'], ['PARSER', 'JSON.parse'], ['STORAGE', 'None']],
    },
    'html-escape-converter': {
      number: 'CODE_TOOLS',
      title: 'HTML Escape Converter',
      summary: 'HTMLで構文上の意味を持つ文字を用途に合わせてエスケープし、元の文字列へ戻します。',
      status: 'READY',
      version: '0.2.0',
      kind: 'html',
      steps: ['入力欄へHTMLまたは文字参照を入力します。', '変換方向とHTML内で使用するコンテキストを選択します。', '変換結果・置換数・警告を確認します。', 'COPY OUTPUTを押して結果を使用します。'],
      specs: [['INPUT', 'HTML + Entity Text'], ['OUTPUT', 'Escaped + Unescaped'], ['CONTEXT', 'Text + Attribute'], ['ENTITIES', '& < > " \' NBSP'], ['LIMIT', '100,000 Input Units'], ['STORAGE', 'None']],
    },
    'numeric-character-reference-converter': {
      number: 'CODE_TOOLS',
      title: 'Numeric Character Reference Converter',
      summary: 'Unicode文字を10進・16進の数値文字参照へ変換し、元の文字列へ復元します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'numeric-reference',
      steps: ['変換する文字列または数値文字参照を入力します。', '変換方向・数値表記・変換範囲を選択します。', '変換数と警告を確認し、必要に応じて入力と出力を入れ替えます。', 'COPY OUTPUTを押して結果を使用します。'],
      specs: [['INPUT', 'Unicode + Numeric Reference'], ['OUTPUT', 'Decimal + Hex'], ['UNIT', 'Unicode Code Point'], ['SCOPE', 'Non-ASCII + All'], ['LIMIT', '100,000 Input Units'], ['STORAGE', 'None']],
    },
    'px-rem-converter': {
      number: 'CSS_TOOLS',
      title: 'PX / REM Converter',
      summary: 'ルートフォントサイズを基準に、pxとremを双方向変換します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'unit',
      steps: ['変換する数値とルートフォントサイズを入力します。', 'PX → REMまたはREM → PXの変換方向を選択します。', '必要に応じて小数点以下の丸め精度を選択します。', '計算式を確認し、COPY OUTPUTを押して結果を使用します。'],
      specs: [['INPUT', 'px / rem'], ['OUTPUT', 'rem / px'], ['ROOT SIZE', '1–256px'], ['PRECISION', 'Auto / 2 / 4'], ['RANGE', '±1,000,000'], ['STORAGE', 'None']],
    },
    'fluid-scale-generator': {
      number: 'CSS_TOOLS',
      title: 'Fluid Scale Generator',
      summary: 'モバイル・デスクトップの基準値から、タイポグラフィ・余白・UIサイズの流体トークンを一括生成します。',
      status: 'READY',
      version: '0.1.0',
      kind: 'fluid-scale',
      steps: ['共通の最小・最大ビューポートと出力単位を指定します。', 'SCALE SYSTEMで文字・余白・UIサイズの基準値と比率を設定します。', '任意の画面幅で各トークンの現在値と視覚的な変化を確認します。', 'CSSトークンまたは使用例をコピーし、必要に応じてCSSファイルを保存します。'],
      specs: [['MODES', 'Scale System / Single'], ['OUTPUT', 'CSS Custom Properties'], ['UNITS', 'rem + vi / px + vi / cqi'], ['TYPE', '5 / 8 / 10 Steps'], ['SIZE TOKENS', 'Up to 12'], ['VIEWPORT', '240–3840px'], ['STORAGE', 'None']],
    },
  };

  const params = new URLSearchParams(window.location.search);
  const pathKey = window.location.pathname.split('/').pop()?.replace(/\.html$/, '');
  const key = document.body.dataset.toolId || params.get('tool') || pathKey || 'text-case-converter';
  const tool = definitions[key] || definitions['text-case-converter'];
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };

  document.title = `${tool.title} | MARK BENCH`;
  setText('[data-tool-title]', tool.title);
  setText('[data-site-breadcrumb-current]', tool.title);
  setText('[data-tool-number]', tool.number);
  setText('[data-tool-summary]', tool.summary);
  setText('[data-tool-status]', tool.status);
  setText('[data-tool-version]', tool.version);

  const statusElement = document.querySelector('[data-tool-status]');
  if (statusElement) {
    statusElement.className = `badge ${tool.status === 'TESTING' ? 'badge--testing' : tool.status === 'PLANNED' ? 'badge--planned' : ''}`;
  }

  const steps = document.querySelector('[data-tool-steps]');
  if (steps && tool.steps) steps.innerHTML = tool.steps.map((step) => `<li>${step}</li>`).join('');
  const specs = document.querySelector('[data-tool-specs]');
  if (specs && tool.specs) specs.innerHTML = tool.specs.map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');

  const toast = document.querySelector('[data-toast]');
  const RESET_TOAST_MESSAGE = '表示内容をリセットしました。';
  let toastTimer;
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 1800);
  };

  const copyText = async (value) => {
    if (!value) return false;
    let copied = false;
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch {
      try {
        const input = document.createElement('textarea');
        input.value = value;
        input.className = 'visually-hidden';
        document.body.append(input);
        input.select();
        copied = document.execCommand('copy');
        input.remove();
      } catch {
        copied = false;
      }
    }
    showToast(copied ? 'コピーが完了しました。' : 'コピーに失敗しました。');
    return copied;
  };

  const escapeMarkup = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const renderCaseConverter = () => {
    workspace.innerHTML = `
      <div class="workspace-grid">
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>INPUT / PLAIN TEXT</span><div class="workspace-actions"><button class="workspace-action" type="button" data-sample>SAMPLE</button><button class="workspace-action" type="button" data-clear>CLEAR</button></div></div>
          <label class="visually-hidden" for="case-input">変換する文字列</label>
          <textarea id="case-input" placeholder="例：Mark Bench Web Tool" data-case-input></textarea>
        </div>
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>OUTPUT / 9 STYLES</span><span>AUTO CONVERT</span></div>
          <div class="result-list" data-case-results></div>
        </div>
      </div>`;

    const input = workspace.querySelector('[data-case-input]');
    const results = workspace.querySelector('[data-case-results]');
    const renderResults = () => {
      const converted = window.CodingNoteTextCase.convertCases(input.value);
      results.innerHTML = converted.map(({ label, value }) => `
        <div class="result-row"><span class="result-row__label">${label}</span><output>${value || '—'}</output><button type="button" data-copy-value="${encodeURIComponent(value)}" ${value ? '' : 'disabled'}>COPY</button></div>`).join('');
    };
    input.addEventListener('input', renderResults);
    workspace.querySelector('[data-sample]').addEventListener('click', () => { input.value = 'Mark Bench Web Tool'; renderResults(); input.focus(); });
    workspace.querySelector('[data-clear]').addEventListener('click', () => { input.value = ''; renderResults(); input.focus(); showToast(RESET_TOAST_MESSAGE); });
    results.addEventListener('click', (event) => {
      const button = event.target.closest('[data-copy-value]');
      if (button) copyText(decodeURIComponent(button.dataset.copyValue));
    });
    renderResults();
  };

  const renderCounter = () => {
    const counter = window.MarkBenchCharacterCounter;
    if (!counter) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; character counter module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    workspace.innerHTML = `
      <div class="workspace-grid">
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>INPUT / PLAIN TEXT</span><div class="workspace-actions"><button class="workspace-action" type="button" data-sample>SAMPLE</button><button class="workspace-action" type="button" data-clear>CLEAR</button></div></div>
          <label class="visually-hidden" for="counter-input">数える文章</label>
          <textarea id="counter-input" maxlength="${counter.MAX_INPUT_LENGTH}" aria-describedby="counter-input-status" placeholder="文字数を確認したい文章を入力してください。" data-counter-input></textarea>
          <div class="workspace-panel__footer" id="counter-input-status"><span data-counter-input-state data-state="empty" aria-live="polite">INPUT EMPTY</span><span data-counter-input-limit>0 / ${counter.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT</span></div>
        </div>
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>OUTPUT / 6 METRICS</span><button class="workspace-action" type="button" data-copy-summary disabled>COPY SUMMARY</button></div>
          <div class="counter-results" data-counter-results></div>
        </div>
      </div>`;

    const input = workspace.querySelector('[data-counter-input]');
    const results = workspace.querySelector('[data-counter-results]');
    const inputState = workspace.querySelector('[data-counter-input-state]');
    const inputLimit = workspace.querySelector('[data-counter-input-limit]');
    const clearButton = workspace.querySelector('[data-clear]');
    const copyButton = workspace.querySelector('[data-copy-summary]');
    let currentMetrics = counter.analyze('');

    const renderResults = () => {
      const value = input.value;
      currentMetrics = counter.analyze(value);
      const isEmpty = value.length === 0;
      const isAtLimit = currentMetrics.inputLength >= counter.MAX_INPUT_LENGTH;
      const state = isAtLimit ? 'limit' : isEmpty ? 'empty' : 'counting';
      const stateLabel = isAtLimit ? 'INPUT LIMIT' : isEmpty ? 'INPUT EMPTY' : 'COUNTING';

      results.innerHTML = counter.getMetricEntries(currentMetrics).map(({ key: metricKey, label, value: count }) => `
        <div class="counter-stat"><span id="counter-metric-${metricKey}">${label}</span><output aria-labelledby="counter-metric-${metricKey}">${count.toLocaleString('en-US')}</output></div>`).join('');
      inputState.textContent = stateLabel;
      inputState.dataset.state = state;
      inputLimit.textContent = `${currentMetrics.inputLength.toLocaleString('en-US')} / ${counter.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT`;
      clearButton.disabled = isEmpty;
      copyButton.disabled = isEmpty;
    };

    input.addEventListener('input', renderResults);
    workspace.querySelector('[data-sample]').addEventListener('click', () => {
      input.value = 'MARK BENCHは、Web制作で使う小さなツールと\n実装の知識を記録するワークベンチです。\n\n入力内容はブラウザ内だけで処理されます。';
      renderResults();
      input.focus();
    });
    clearButton.addEventListener('click', () => { input.value = ''; renderResults(); input.focus(); showToast(RESET_TOAST_MESSAGE); });
    copyButton.addEventListener('click', () => copyText(counter.formatSummary(currentMetrics)));
    renderResults();
  };

  const renderSlugGenerator = () => {
    const generator = window.MarkBenchSlugGenerator;
    if (!generator) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; slug generator module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    workspace.innerHTML = `
      <div class="workspace-grid">
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>INPUT / TITLE TEXT</span><div class="workspace-actions"><button class="workspace-action" type="button" data-sample>SAMPLE</button><button class="workspace-action" type="button" data-clear disabled>CLEAR</button></div></div>
          <label class="visually-hidden" for="slug-input">スラッグに変換する文字列</label>
          <textarea class="workspace-panel__input--compact" id="slug-input" maxlength="${generator.MAX_INPUT_LENGTH}" aria-describedby="slug-input-status" placeholder="例：MARK BENCH Web制作ツール" data-slug-input></textarea>
          <div class="slug-options" aria-label="変換オプション">
            <fieldset class="slug-option-group">
              <legend>SEPARATOR</legend>
              <label><input type="radio" name="slug-separator" value="-" data-slug-separator checked><span>HYPHEN -</span></label>
              <label><input type="radio" name="slug-separator" value="_" data-slug-separator><span>UNDERSCORE _</span></label>
            </fieldset>
            <label class="slug-lowercase"><input type="checkbox" data-slug-lowercase checked><span>LOWERCASE A→a</span></label>
          </div>
          <div class="workspace-panel__footer" id="slug-input-status"><span data-slug-input-state data-state="empty" aria-live="polite">INPUT EMPTY</span><span data-slug-input-limit>0 / ${generator.MAX_INPUT_LENGTH} LIMIT</span></div>
        </div>
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>OUTPUT / 2 FORMATS</span><span>AUTO GENERATE</span></div>
          <div class="result-list slug-results" data-slug-results></div>
          <div class="workspace-panel__footer"><span data-slug-output-state>OUTPUT EMPTY</span><span data-slug-output-limit>0 / ${generator.MAX_SLUG_LENGTH} LIMIT</span></div>
        </div>
      </div>`;

    const input = workspace.querySelector('[data-slug-input]');
    const results = workspace.querySelector('[data-slug-results]');
    const inputState = workspace.querySelector('[data-slug-input-state]');
    const inputLimit = workspace.querySelector('[data-slug-input-limit]');
    const outputState = workspace.querySelector('[data-slug-output-state]');
    const outputLimit = workspace.querySelector('[data-slug-output-limit]');
    const lowercase = workspace.querySelector('[data-slug-lowercase]');
    const clearButton = workspace.querySelector('[data-clear]');
    let currentResult = generator.generate('');

    const getOptions = () => ({
      separator: workspace.querySelector('[data-slug-separator]:checked')?.value || '-',
      lowercase: lowercase.checked,
    });

    const renderResults = () => {
      const value = input.value;
      currentResult = generator.generate(value, getOptions());
      const isEmpty = value.length === 0;
      const isInvalid = !isEmpty && !currentResult.slug;
      const isAtLimit = currentResult.inputLength >= generator.MAX_INPUT_LENGTH;
      const state = isAtLimit ? 'limit' : currentResult.truncated ? 'truncated' : isInvalid ? 'invalid' : isEmpty ? 'empty' : 'ready';
      const stateLabel = isAtLimit ? 'INPUT LIMIT' : currentResult.truncated ? 'OUTPUT TRUNCATED' : isInvalid ? 'NO VALID CHARACTERS' : isEmpty ? 'INPUT EMPTY' : 'READY';

      results.innerHTML = generator.getResultEntries(currentResult).map(({ key: resultKey, label, value: resultValue }) => `
        <div class="result-row slug-result-row"><span class="result-row__label" id="slug-result-${resultKey}">${label}</span><output aria-labelledby="slug-result-${resultKey}">${resultValue || '—'}</output><button type="button" data-copy-slug="${resultKey}" ${resultValue ? '' : 'disabled'}>COPY</button></div>`).join('');
      inputState.textContent = stateLabel;
      inputState.dataset.state = state;
      inputLimit.textContent = `${currentResult.inputLength} / ${generator.MAX_INPUT_LENGTH} LIMIT`;
      outputState.textContent = currentResult.slug ? (currentResult.truncated ? 'TRUNCATED' : 'GENERATED') : 'OUTPUT EMPTY';
      outputState.dataset.state = currentResult.truncated ? 'truncated' : currentResult.slug ? 'ready' : 'empty';
      outputLimit.textContent = `${currentResult.length} / ${generator.MAX_SLUG_LENGTH} LIMIT`;
      clearButton.disabled = isEmpty;
    };

    input.addEventListener('input', renderResults);
    workspace.querySelectorAll('[data-slug-separator]').forEach((control) => control.addEventListener('change', renderResults));
    lowercase.addEventListener('change', renderResults);
    workspace.querySelector('[data-sample]').addEventListener('click', () => {
      input.value = 'MARK BENCH：Web制作ツールを整理する';
      renderResults();
      input.focus();
    });
    clearButton.addEventListener('click', () => {
      input.value = '';
      renderResults();
      input.focus();
      showToast(RESET_TOAST_MESSAGE);
    });
    results.addEventListener('click', (event) => {
      const button = event.target.closest('[data-copy-slug]');
      if (!button) return;
      const value = currentResult[button.dataset.copySlug];
      copyText(value);
    });
    renderResults();
  };

  const renderJsonFormatter = () => {
    const formatter = window.MarkBenchJsonFormatter;
    if (!formatter) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; json formatter module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    workspace.innerHTML = `
      <div class="workspace-grid workspace-grid--json">
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>INPUT / JSON</span><div class="workspace-actions"><button class="workspace-action" type="button" data-sample>SAMPLE</button><button class="workspace-action" type="button" data-clear disabled>CLEAR</button></div></div>
          <label class="visually-hidden" for="json-input">整形するJSON</label>
          <textarea id="json-input" maxlength="${formatter.MAX_INPUT_LENGTH}" aria-describedby="json-input-status" placeholder='{"project":"MARK BENCH","status":"ready"}' spellcheck="false" autocapitalize="off" data-json-input></textarea>
          <div class="json-options" aria-label="整形オプション">
            <fieldset class="json-option-group">
              <legend>OUTPUT MODE</legend>
              <label><input type="radio" name="json-mode" value="pretty" data-json-mode checked><span>FORMAT</span></label>
              <label><input type="radio" name="json-mode" value="minify" data-json-mode><span>MINIFY</span></label>
            </fieldset>
            <fieldset class="json-option-group" data-json-indent-group>
              <legend>INDENT</legend>
              <label><input type="radio" name="json-indent" value="2" data-json-indent checked><span>2 SPACES</span></label>
              <label><input type="radio" name="json-indent" value="4" data-json-indent><span>4 SPACES</span></label>
              <label><input type="radio" name="json-indent" value="tab" data-json-indent><span>TAB</span></label>
            </fieldset>
          </div>
          <div class="workspace-panel__footer" id="json-input-status"><span data-json-input-state data-state="empty" aria-live="polite">INPUT EMPTY</span><span data-json-input-limit>0 / ${formatter.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT</span></div>
        </div>
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>OUTPUT / JSON</span><button class="workspace-action" type="button" data-copy-json disabled>COPY OUTPUT</button></div>
          <label class="visually-hidden" for="json-output">整形されたJSON</label>
          <textarea id="json-output" placeholder="整形結果がここに表示されます。" spellcheck="false" readonly data-json-output></textarea>
          <div class="json-error" role="status" aria-live="polite" data-json-error hidden><strong data-json-error-location>SYNTAX ERROR</strong><p data-json-error-message></p></div>
          <div class="workspace-panel__footer"><span data-json-output-state data-state="empty">OUTPUT EMPTY</span><span data-json-output-length>0 CHARS</span></div>
        </div>
      </div>`;

    const input = workspace.querySelector('[data-json-input]');
    const output = workspace.querySelector('[data-json-output]');
    const inputState = workspace.querySelector('[data-json-input-state]');
    const inputLimit = workspace.querySelector('[data-json-input-limit]');
    const outputState = workspace.querySelector('[data-json-output-state]');
    const outputLength = workspace.querySelector('[data-json-output-length]');
    const errorPanel = workspace.querySelector('[data-json-error]');
    const errorLocation = workspace.querySelector('[data-json-error-location]');
    const errorMessage = workspace.querySelector('[data-json-error-message]');
    const indentGroup = workspace.querySelector('[data-json-indent-group]');
    const clearButton = workspace.querySelector('[data-clear]');
    const copyButton = workspace.querySelector('[data-copy-json]');
    let currentResult = formatter.format('');

    const getOptions = () => ({
      mode: workspace.querySelector('[data-json-mode]:checked')?.value || 'pretty',
      indent: workspace.querySelector('[data-json-indent]:checked')?.value || '2',
    });

    const renderResult = () => {
      const options = getOptions();
      currentResult = formatter.format(input.value, options);
      const hasInput = input.value.length > 0;
      const isEmpty = currentResult.status === 'empty';
      const isInvalid = currentResult.status === 'invalid';
      const isAtLimit = currentResult.inputLength >= formatter.MAX_INPUT_LENGTH;
      const state = isInvalid ? 'invalid' : isAtLimit ? 'limit' : isEmpty ? 'empty' : 'valid';
      const stateLabel = isInvalid ? 'INVALID JSON' : isAtLimit ? 'VALID / INPUT LIMIT' : isEmpty ? 'INPUT EMPTY' : 'VALID JSON';

      output.value = currentResult.output;
      output.hidden = isInvalid;
      errorPanel.hidden = !isInvalid;
      if (isInvalid) {
        const { line, column, message } = currentResult.error;
        errorLocation.textContent = line && column ? `LINE ${line} / COLUMN ${column}` : 'SYNTAX ERROR';
        errorMessage.textContent = message;
      } else {
        errorLocation.textContent = 'SYNTAX ERROR';
        errorMessage.textContent = '';
      }

      inputState.textContent = stateLabel;
      inputState.dataset.state = state;
      inputLimit.textContent = `${currentResult.inputLength.toLocaleString('en-US')} / ${formatter.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT`;
      outputState.textContent = currentResult.summary;
      outputState.dataset.state = state;
      outputLength.textContent = `${currentResult.outputLength.toLocaleString('en-US')} CHARS`;
      indentGroup.disabled = options.mode === 'minify';
      clearButton.disabled = !hasInput;
      copyButton.disabled = currentResult.status !== 'valid';
    };

    input.addEventListener('input', renderResult);
    workspace.querySelectorAll('[data-json-mode], [data-json-indent]').forEach((control) => control.addEventListener('change', renderResult));
    workspace.querySelector('[data-sample]').addEventListener('click', () => {
      input.value = '{"project":"MARK BENCH","tool":"JSON Formatter","status":"ready","options":{"indent":2,"local":true},"tags":["JSON","format","validate"]}';
      renderResult();
      input.focus();
    });
    clearButton.addEventListener('click', () => {
      input.value = '';
      renderResult();
      input.focus();
      showToast(RESET_TOAST_MESSAGE);
    });
    copyButton.addEventListener('click', () => copyText(currentResult.output));
    renderResult();
  };

  const renderHtmlEscapeConverter = () => {
    const converter = window.MarkBenchHtmlEscapeConverter;
    if (!converter) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; html escape converter module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    workspace.innerHTML = `
      <div class="workspace-grid workspace-grid--html">
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>INPUT / HTML OR ENTITY TEXT</span><div class="workspace-actions"><button class="workspace-action" type="button" data-sample>SAMPLE</button><button class="workspace-action" type="button" data-clear disabled>CLEAR</button></div></div>
          <label class="visually-hidden" for="html-escape-input">変換するHTMLまたは文字参照</label>
          <textarea id="html-escape-input" maxlength="${converter.MAX_INPUT_LENGTH}" aria-describedby="html-escape-input-status" placeholder='<button aria-label="MARK &amp; BENCH">保存</button>' spellcheck="false" autocapitalize="off" data-html-input></textarea>
          <div class="html-options" aria-label="変換オプション">
            <fieldset class="html-option-group">
              <legend>CONVERSION</legend>
              <label><input type="radio" name="html-mode" value="escape" data-html-mode checked><span>ESCAPE</span></label>
              <label><input type="radio" name="html-mode" value="unescape" data-html-mode><span>UNESCAPE</span></label>
            </fieldset>
            <fieldset class="html-option-group" data-html-escape-options>
              <legend>ESCAPE CONTEXT</legend>
              <label><input type="radio" name="html-context" value="text" data-html-context><span>TEXT CONTENT</span></label>
              <label><input type="radio" name="html-context" value="attribute" data-html-context checked><span>ATTRIBUTE VALUE</span></label>
            </fieldset>
            <label class="html-option-toggle"><input type="checkbox" data-html-nbsp checked><span>ENCODE NBSP</span></label>
          </div>
          <div class="workspace-panel__footer" id="html-escape-input-status"><span data-html-input-state data-state="empty" aria-live="polite">INPUT EMPTY</span><span data-html-input-limit>0 / ${converter.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT</span></div>
        </div>
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>OUTPUT / CONVERTED TEXT</span><button class="workspace-action" type="button" data-copy-html disabled>COPY OUTPUT</button></div>
          <label class="visually-hidden" for="html-escape-output">変換結果</label>
          <textarea id="html-escape-output" placeholder="変換結果がここに表示されます。" spellcheck="false" readonly data-html-output></textarea>
          <div class="reference-warnings" role="status" aria-live="polite" data-html-warnings hidden></div>
          <div class="workspace-panel__footer"><span data-html-output-state data-state="empty">OUTPUT EMPTY</span><span data-html-output-length>0 CHARS</span></div>
        </div>
      </div>`;

    const input = workspace.querySelector('[data-html-input]');
    const output = workspace.querySelector('[data-html-output]');
    const inputState = workspace.querySelector('[data-html-input-state]');
    const inputLimit = workspace.querySelector('[data-html-input-limit]');
    const outputState = workspace.querySelector('[data-html-output-state]');
    const outputLength = workspace.querySelector('[data-html-output-length]');
    const clearButton = workspace.querySelector('[data-clear]');
    const copyButton = workspace.querySelector('[data-copy-html]');
    const escapeOptions = workspace.querySelector('[data-html-escape-options]');
    const encodeNbsp = workspace.querySelector('[data-html-nbsp]');
    const warnings = workspace.querySelector('[data-html-warnings]');
    let currentResult = converter.convert('');

    const getMode = () => workspace.querySelector('[data-html-mode]:checked')?.value || 'escape';
    const getOptions = () => ({
      context: workspace.querySelector('[data-html-context]:checked')?.value || 'attribute',
      encodeNbsp: encodeNbsp.checked,
    });

    const renderResult = () => {
      const mode = getMode();
      currentResult = converter.convert(input.value, mode, getOptions());
      const isEmpty = currentResult.status === 'empty';
      const isAtLimit = currentResult.inputLength >= converter.MAX_INPUT_LENGTH;
      const hasMatches = currentResult.replacements > 0;
      const operation = currentResult.mode === 'unescape' ? 'UNESCAPED' : 'ESCAPED';
      const state = isAtLimit ? 'limit' : currentResult.warningCount ? 'invalid' : isEmpty ? 'empty' : hasMatches ? 'converted' : 'no-match';
      const stateLabel = isAtLimit ? 'INPUT LIMIT' : currentResult.warningCount ? `${currentResult.warningCount} WARNINGS` : isEmpty ? 'INPUT EMPTY' : hasMatches ? operation : 'NO MATCHES';

      output.value = currentResult.output;
      inputState.textContent = stateLabel;
      inputState.dataset.state = state;
      inputLimit.textContent = `${currentResult.inputLength.toLocaleString('en-US')} / ${converter.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT`;
      outputState.textContent = isEmpty ? 'OUTPUT EMPTY' : `${operation} / ${currentResult.replacements.toLocaleString('en-US')} REPLACEMENTS`;
      outputState.dataset.state = state;
      outputLength.textContent = `${currentResult.outputLength.toLocaleString('en-US')} CHARS`;
      warnings.hidden = currentResult.warningCount === 0;
      warnings.innerHTML = currentResult.warningCount
        ? `<strong>CHECK CHARACTER REFERENCES</strong><ul>${currentResult.warnings.map((warning) => `<li><code>${escapeMarkup(warning.reference)}</code><span>${escapeMarkup(warning.message)}</span></li>`).join('')}</ul>`
        : '';
      escapeOptions.disabled = mode === 'unescape';
      encodeNbsp.disabled = mode === 'unescape';
      encodeNbsp.closest('label')?.classList.toggle('is-disabled', mode === 'unescape');
      clearButton.disabled = isEmpty;
      copyButton.disabled = isEmpty;
    };

    input.addEventListener('input', renderResult);
    workspace.querySelectorAll('[data-html-mode], [data-html-context], [data-html-nbsp]').forEach((control) => control.addEventListener('change', renderResult));
    workspace.querySelector('[data-sample]').addEventListener('click', () => {
      input.value = getMode() === 'unescape'
        ? '&lt;button class=&quot;tool&quot; aria-label=&quot;MARK &amp; BENCH&quot;&gt;保存&lt;/button&gt;'
        : '<button class="tool" aria-label="MARK & BENCH">保存</button>';
      renderResult();
      input.focus();
    });
    clearButton.addEventListener('click', () => {
      input.value = '';
      renderResult();
      input.focus();
      showToast(RESET_TOAST_MESSAGE);
    });
    copyButton.addEventListener('click', () => copyText(currentResult.output));
    renderResult();
  };

  const renderNumericCharacterReferenceConverter = () => {
    const converter = window.MarkBenchNumericCharacterReferenceConverter;
    if (!converter) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; numeric character reference converter module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    workspace.innerHTML = `
      <div class="workspace-grid workspace-grid--numeric-reference">
        <div class="workspace-panel numeric-reference__input-pane">
          <div class="workspace-panel__header"><span>INPUT / UNICODE OR NUMERIC REFERENCE</span><div class="workspace-actions"><button class="workspace-action" type="button" data-numeric-sample>SAMPLE</button><button class="workspace-action" type="button" data-numeric-clear disabled>CLEAR</button></div></div>
          <label class="visually-hidden" for="numeric-reference-input">変換する文字列または数値文字参照</label>
          <textarea id="numeric-reference-input" maxlength="${converter.MAX_INPUT_LENGTH}" aria-describedby="numeric-reference-input-status numeric-reference-warnings" placeholder="例：MARK BENCH 日本語 😀" spellcheck="false" autocapitalize="off" data-numeric-input></textarea>
          <div class="numeric-reference__options" aria-label="数値文字参照の変換設定">
            <fieldset class="numeric-reference__option-group">
              <legend>CONVERSION</legend>
              <label><input type="radio" name="numeric-mode" value="encode" data-numeric-mode checked><span>ENCODE</span></label>
              <label><input type="radio" name="numeric-mode" value="decode" data-numeric-mode><span>DECODE</span></label>
            </fieldset>
            <fieldset class="numeric-reference__option-group" data-numeric-format-group>
              <legend>NOTATION</legend>
              <label><input type="radio" name="numeric-format" value="decimal" data-numeric-format checked><span>DECIMAL</span></label>
              <label><input type="radio" name="numeric-format" value="hex" data-numeric-format><span>HEXADECIMAL</span></label>
            </fieldset>
            <fieldset class="numeric-reference__option-group" data-numeric-scope-group>
              <legend>ENCODE SCOPE</legend>
              <label><input type="radio" name="numeric-scope" value="non-ascii" data-numeric-scope checked><span>NON-ASCII</span></label>
              <label><input type="radio" name="numeric-scope" value="all" data-numeric-scope><span>ALL CHARACTERS</span></label>
            </fieldset>
            <label class="numeric-reference__toggle" data-numeric-whitespace-label><input type="checkbox" data-numeric-whitespace checked><span>PRESERVE WHITESPACE</span></label>
          </div>
          <div class="workspace-panel__footer" id="numeric-reference-input-status"><span data-numeric-input-state data-state="empty" aria-live="polite">INPUT EMPTY</span><span data-numeric-input-limit>0 / ${converter.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT</span></div>
        </div>
        <div class="workspace-panel numeric-reference__output-pane">
          <div class="workspace-panel__header"><span>OUTPUT / CONVERTED TEXT</span><div class="workspace-actions"><button class="workspace-action" type="button" data-numeric-swap disabled>SWAP</button><button class="workspace-action" type="button" data-copy-numeric disabled>COPY OUTPUT</button></div></div>
          <label class="visually-hidden" for="numeric-reference-output">変換結果</label>
          <textarea id="numeric-reference-output" placeholder="変換結果がここに表示されます。" spellcheck="false" readonly data-numeric-output></textarea>
          <div class="workspace-panel__footer"><span data-numeric-output-state data-state="empty">OUTPUT EMPTY</span><span data-numeric-output-length>0 CODE POINTS</span></div>
        </div>
        <dl class="numeric-reference__metrics" aria-label="変換結果の集計">
          <div><dt>INPUT POINTS</dt><dd data-numeric-metric="input">0</dd></div>
          <div><dt>OUTPUT POINTS</dt><dd data-numeric-metric="output">0</dd></div>
          <div><dt>CONVERTED</dt><dd data-numeric-metric="converted">0</dd></div>
          <div><dt>DECIMAL</dt><dd data-numeric-metric="decimal">0</dd></div>
          <div><dt>HEXADECIMAL</dt><dd data-numeric-metric="hex">0</dd></div>
          <div><dt>WARNINGS</dt><dd data-numeric-metric="warnings">0</dd></div>
        </dl>
        <div class="reference-warnings numeric-reference__warnings" id="numeric-reference-warnings" role="status" aria-live="polite" data-numeric-warnings hidden></div>
      </div>`;

    const input = workspace.querySelector('[data-numeric-input]');
    const output = workspace.querySelector('[data-numeric-output]');
    const inputState = workspace.querySelector('[data-numeric-input-state]');
    const inputLimit = workspace.querySelector('[data-numeric-input-limit]');
    const outputState = workspace.querySelector('[data-numeric-output-state]');
    const outputLength = workspace.querySelector('[data-numeric-output-length]');
    const clearButton = workspace.querySelector('[data-numeric-clear]');
    const swapButton = workspace.querySelector('[data-numeric-swap]');
    const copyButton = workspace.querySelector('[data-copy-numeric]');
    const formatGroup = workspace.querySelector('[data-numeric-format-group]');
    const scopeGroup = workspace.querySelector('[data-numeric-scope-group]');
    const whitespace = workspace.querySelector('[data-numeric-whitespace]');
    const whitespaceLabel = workspace.querySelector('[data-numeric-whitespace-label]');
    const warningPanel = workspace.querySelector('[data-numeric-warnings]');
    let currentResult = converter.convert('');

    const getMode = () => workspace.querySelector('[data-numeric-mode]:checked')?.value || 'encode';
    const getOptions = () => ({
      format: workspace.querySelector('[data-numeric-format]:checked')?.value || 'decimal',
      scope: workspace.querySelector('[data-numeric-scope]:checked')?.value || 'non-ascii',
      preserveWhitespace: whitespace.checked,
    });

    const renderWarnings = () => {
      warningPanel.hidden = currentResult.warningCount === 0;
      warningPanel.innerHTML = currentResult.warningCount
        ? `<strong>CHECK CHARACTER REFERENCES / ${currentResult.warningCount}</strong><ul>${currentResult.warnings.map((warning) => `<li><code>${escapeMarkup(warning.reference || warning.codePoint)}</code><span>${escapeMarkup(`${warning.codePoint} / ${warning.message}`)}</span></li>`).join('')}</ul>`
        : '';
    };

    const renderResult = () => {
      const mode = getMode();
      currentResult = converter.convert(input.value, mode, getOptions());
      const isEmpty = currentResult.status === 'empty';
      const isAtLimit = currentResult.inputLength >= converter.MAX_INPUT_LENGTH;
      const hasWarnings = currentResult.warningCount > 0;
      const operation = mode === 'decode' ? 'DECODED' : 'ENCODED';
      const state = isAtLimit ? 'limit' : hasWarnings ? 'invalid' : isEmpty ? 'empty' : currentResult.replacements ? 'converted' : 'no-match';
      const stateLabel = isAtLimit ? 'INPUT LIMIT' : hasWarnings ? `${currentResult.warningCount} WARNINGS` : isEmpty ? 'INPUT EMPTY' : currentResult.replacements ? operation : 'NO MATCHES';

      output.value = currentResult.output;
      inputState.textContent = stateLabel;
      inputState.dataset.state = state;
      inputLimit.textContent = `${currentResult.inputLength.toLocaleString('en-US')} / ${converter.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT`;
      outputState.textContent = isEmpty ? 'OUTPUT EMPTY' : hasWarnings ? `${currentResult.warningCount} WARNINGS / ${currentResult.replacements} CONVERTED` : `${operation} / ${currentResult.replacements.toLocaleString('en-US')} CONVERTED`;
      outputState.dataset.state = state;
      outputLength.textContent = `${currentResult.outputCodePoints.toLocaleString('en-US')} CODE POINTS`;
      const metrics = {
        input: currentResult.inputCodePoints,
        output: currentResult.outputCodePoints,
        converted: currentResult.replacements,
        decimal: currentResult.decimalCount,
        hex: currentResult.hexCount,
        warnings: currentResult.warningCount,
      };
      Object.entries(metrics).forEach(([keyName, value]) => {
        const target = workspace.querySelector(`[data-numeric-metric="${keyName}"]`);
        if (target) target.textContent = value.toLocaleString('en-US');
      });
      formatGroup.disabled = mode === 'decode';
      scopeGroup.disabled = mode === 'decode';
      whitespace.disabled = mode === 'decode';
      whitespaceLabel.classList.toggle('is-disabled', mode === 'decode');
      clearButton.disabled = isEmpty;
      swapButton.disabled = isEmpty || !currentResult.output;
      copyButton.disabled = isEmpty || !currentResult.output;
      renderWarnings();
    };

    input.addEventListener('input', renderResult);
    workspace.querySelectorAll('[data-numeric-mode], [data-numeric-format], [data-numeric-scope], [data-numeric-whitespace]').forEach((control) => control.addEventListener('change', renderResult));
    workspace.querySelector('[data-numeric-sample]').addEventListener('click', () => {
      input.value = getMode() === 'decode'
        ? 'MARK BENCH &#26085;&#26412;&#35486; &#x1F600;'
        : 'MARK BENCH 日本語 😀';
      renderResult();
      input.focus();
    });
    clearButton.addEventListener('click', () => {
      input.value = '';
      renderResult();
      input.focus();
      showToast(RESET_TOAST_MESSAGE);
    });
    swapButton.addEventListener('click', () => {
      input.value = currentResult.output;
      const nextMode = currentResult.mode === 'encode' ? 'decode' : 'encode';
      const nextControl = workspace.querySelector(`[data-numeric-mode][value="${nextMode}"]`);
      if (nextControl) nextControl.checked = true;
      renderResult();
      input.focus();
      showToast('INPUT / OUTPUT SWAPPED');
    });
    copyButton.addEventListener('click', () => copyText(currentResult.output));
    renderResult();
  };

  const renderTextFormatter = () => {
    const formatter = window.MarkBenchTextFormatter;
    if (!formatter) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; text formatter module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    const operationGroups = formatter.OPERATION_GROUPS.map((group) => `
      <section class="formatter-action-group" aria-labelledby="formatter-group-${group.id}">
        <h3 id="formatter-group-${group.id}">${group.label}</h3>
        <div class="formatter-action-grid">
          ${group.operations.map((operation) => `<button type="button" data-formatter-operation="${operation.id}" disabled><span>${operation.label}</span><small>${operation.shortLabel}</small></button>`).join('')}
        </div>
      </section>`).join('');

    workspace.innerHTML = `
      <div class="workspace-grid workspace-grid--formatter">
        <div class="workspace-panel formatter-source">
          <div class="workspace-panel__header"><span>INPUT / SOURCE</span><div class="workspace-actions"><button class="workspace-action" type="button" data-sample>SAMPLE</button><button class="workspace-action" type="button" data-clear disabled>CLEAR</button></div></div>
          <label class="visually-hidden" for="formatter-input">整形するテキスト</label>
          <textarea id="formatter-input" maxlength="${formatter.MAX_INPUT_LENGTH}" aria-describedby="formatter-input-status" placeholder="CMS原稿、商品情報、リストなどを入力してください。" spellcheck="false" data-formatter-input></textarea>
          <div class="workspace-panel__footer" id="formatter-input-status"><span data-formatter-input-state data-state="empty" aria-live="polite">INPUT EMPTY</span><span data-formatter-input-metrics>0 LINES / 0 CHARS</span></div>
        </div>
        <div class="formatter-actions">
          <div class="formatter-actions__header"><span>FORMAT ACTIONS / APPLY IN ORDER</span><div class="workspace-actions"><button class="workspace-action" type="button" data-formatter-undo disabled>UNDO</button><button class="workspace-action" type="button" data-formatter-reset disabled>RESET TO SOURCE</button></div></div>
          <div class="formatter-actions__groups">${operationGroups}</div>
          <div class="workspace-panel__footer"><span data-formatter-action-state data-state="empty" aria-live="polite">READY / SELECT AN ACTION</span><span data-formatter-history>0 / ${formatter.MAX_HISTORY} HISTORY</span></div>
        </div>
        <div class="workspace-panel formatter-output">
          <div class="workspace-panel__header"><span>OUTPUT / FORMATTED</span><button class="workspace-action" type="button" data-copy-formatter disabled>COPY OUTPUT</button></div>
          <label class="visually-hidden" for="formatter-output">整形結果</label>
          <textarea id="formatter-output" placeholder="整形結果がここに表示されます。" spellcheck="false" readonly data-formatter-output></textarea>
          <div class="workspace-panel__footer"><span data-formatter-output-state data-state="empty">OUTPUT EMPTY</span><span data-formatter-output-metrics>0 LINES / 0 CHARS</span></div>
        </div>
      </div>`;

    const input = workspace.querySelector('[data-formatter-input]');
    const output = workspace.querySelector('[data-formatter-output]');
    const inputState = workspace.querySelector('[data-formatter-input-state]');
    const inputMetrics = workspace.querySelector('[data-formatter-input-metrics]');
    const outputState = workspace.querySelector('[data-formatter-output-state]');
    const outputMetrics = workspace.querySelector('[data-formatter-output-metrics]');
    const actionState = workspace.querySelector('[data-formatter-action-state]');
    const historyState = workspace.querySelector('[data-formatter-history]');
    const clearButton = workspace.querySelector('[data-clear]');
    const undoButton = workspace.querySelector('[data-formatter-undo]');
    const resetButton = workspace.querySelector('[data-formatter-reset]');
    const copyButton = workspace.querySelector('[data-copy-formatter]');
    const operationButtons = [...workspace.querySelectorAll('[data-formatter-operation]')];
    const history = [];
    let lastAction = 'READY / SELECT AN ACTION';
    let lastActionState = 'empty';

    const formatMetrics = (metrics) => `${metrics.lines.toLocaleString('en-US')} LINES / ${metrics.characters.toLocaleString('en-US')} CHARS / ${metrics.nonWhitespaceCharacters.toLocaleString('en-US')} NON-SPACE`;
    const pushSnapshot = (actionLabel) => {
      history.push({ source: input.value, output: output.value, actionLabel });
      if (history.length > formatter.MAX_HISTORY) history.shift();
    };
    const describeChange = (result) => {
      const lineDelta = result.after.lines - result.before.lines;
      const characterDelta = result.after.characters - result.before.characters;
      if (lineDelta < 0) return `${Math.abs(lineDelta)} LINES REMOVED`;
      if (lineDelta > 0) return `${lineDelta} LINES ADDED`;
      if (characterDelta < 0) return `${Math.abs(characterDelta)} CHARS REMOVED`;
      if (characterDelta > 0) return `${characterDelta} CHARS ADDED`;
      return 'CONTENT UPDATED';
    };

    const renderState = () => {
      const normalizedSource = formatter.normalizeNewlines(input.value);
      const sourceMetrics = formatter.analyze(normalizedSource);
      const resultMetrics = formatter.analyze(output.value);
      const hasSource = normalizedSource.length > 0;
      const hasOutput = output.value.length > 0;
      const isAtLimit = input.value.length >= formatter.MAX_INPUT_LENGTH;
      const isModified = output.value !== normalizedSource;

      inputState.textContent = isAtLimit ? 'INPUT LIMIT' : hasSource ? 'SOURCE READY' : 'INPUT EMPTY';
      inputState.dataset.state = isAtLimit ? 'limit' : hasSource ? 'ready' : 'empty';
      inputMetrics.textContent = formatMetrics(sourceMetrics);
      outputState.textContent = hasOutput ? (isModified ? 'FORMATTED OUTPUT' : 'SOURCE SYNCED') : 'OUTPUT EMPTY';
      outputState.dataset.state = hasOutput ? (isModified ? 'converted' : 'ready') : 'empty';
      outputMetrics.textContent = formatMetrics(resultMetrics);
      actionState.textContent = lastAction;
      actionState.dataset.state = lastActionState;
      historyState.textContent = `${history.length} / ${formatter.MAX_HISTORY} HISTORY`;
      clearButton.disabled = !hasSource && !hasOutput;
      undoButton.disabled = history.length === 0;
      resetButton.disabled = !isModified;
      copyButton.disabled = !hasOutput;
      operationButtons.forEach((button) => { button.disabled = !hasOutput; });
    };

    input.addEventListener('input', () => {
      output.value = formatter.normalizeNewlines(input.value);
      history.length = 0;
      lastAction = input.value ? 'SOURCE UPDATED / HISTORY RESET' : 'READY / SELECT AN ACTION';
      lastActionState = input.value ? 'ready' : 'empty';
      renderState();
    });

    workspace.querySelector('[data-sample]').addEventListener('click', () => {
      if (input.value || output.value) pushSnapshot('LOAD SAMPLE');
      input.value = '　商品A  \n商品B\n商品A\n商品　C\n\nﾃｽﾄ  123';
      output.value = formatter.normalizeNewlines(input.value);
      lastAction = 'SAMPLE LOADED';
      lastActionState = 'ready';
      renderState();
      input.focus();
    });

    clearButton.addEventListener('click', () => {
      pushSnapshot('CLEAR');
      input.value = '';
      output.value = '';
      lastAction = 'CLEARED / UNDO AVAILABLE';
      lastActionState = 'changed';
      renderState();
      input.focus();
      showToast(RESET_TOAST_MESSAGE);
    });

    workspace.querySelector('.formatter-actions__groups').addEventListener('click', (event) => {
      const button = event.target.closest('[data-formatter-operation]');
      if (!button || button.disabled) return;
      const result = formatter.apply(output.value, button.dataset.formatterOperation);
      if (result.status === 'unchanged') {
        lastAction = `NO CHANGES / ${result.shortLabel}`;
        lastActionState = 'unchanged';
      } else {
        pushSnapshot(result.shortLabel);
        output.value = result.output;
        lastAction = `${result.shortLabel} / ${describeChange(result)}`;
        lastActionState = 'changed';
      }
      renderState();
    });

    undoButton.addEventListener('click', () => {
      const snapshot = history.pop();
      if (!snapshot) return;
      input.value = snapshot.source;
      output.value = snapshot.output;
      lastAction = `UNDONE / ${snapshot.actionLabel}`;
      lastActionState = 'changed';
      renderState();
    });

    resetButton.addEventListener('click', () => {
      pushSnapshot('RESET TO SOURCE');
      output.value = formatter.normalizeNewlines(input.value);
      lastAction = 'RESET / SOURCE RESTORED';
      lastActionState = 'changed';
      renderState();
    });

    copyButton.addEventListener('click', () => copyText(output.value));
    renderState();
    window.addEventListener('pageshow', () => {
      if (input.value && !output.value) output.value = formatter.normalizeNewlines(input.value);
      renderState();
    }, { once: true });
  };

  const renderUnicodeInspector = () => {
    const inspector = window.MarkBenchUnicodeInspector;
    if (!inspector) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; unicode inspector module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    workspace.innerHTML = `
      <div class="workspace-grid workspace-grid--unicode">
        <div class="workspace-panel unicode-source">
          <div class="workspace-panel__header"><span>INPUT / UNICODE TEXT</span><div class="workspace-actions"><button class="workspace-action" type="button" data-sample>LOAD SAMPLE</button><button class="workspace-action" type="button" data-clear disabled>CLEAR</button></div></div>
          <label class="visually-hidden" for="unicode-input">解析する文字列</label>
          <textarea id="unicode-input" maxlength="${inspector.MAX_INPUT_LENGTH}" aria-describedby="unicode-input-status unicode-alert" placeholder="文字化けや不可視文字を調査したいテキストを入力してください。" spellcheck="false" data-unicode-input></textarea>
          <div class="workspace-panel__footer" id="unicode-input-status"><span data-unicode-input-state data-state="empty" aria-live="polite">INPUT EMPTY</span><span data-unicode-input-limit>0 / ${inspector.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT</span></div>
        </div>
        <div class="workspace-panel unicode-summary-panel">
          <div class="workspace-panel__header"><span>SUMMARY / TEXT UNITS</span><button class="workspace-action" type="button" data-copy-unicode-report disabled>COPY REPORT</button></div>
          <div class="unicode-summary" data-unicode-summary></div>
          <div class="unicode-alert" id="unicode-alert" role="status" aria-live="polite" hidden><strong>CHECK INVISIBLE CHARACTERS</strong><p data-unicode-alert-text></p></div>
          <div class="workspace-panel__footer"><span data-unicode-summary-state data-state="empty">WAITING FOR INPUT</span><span>UCD BLOCKS 18.0.0</span></div>
        </div>
        <section class="unicode-results-panel" aria-labelledby="unicode-results-title">
          <div class="unicode-results-header">
            <div><span>OUTPUT / CODE POINTS</span><h3 id="unicode-results-title">CHARACTER INSPECTION</h3></div>
            <div class="unicode-filter" role="group" aria-label="解析結果の表示条件">
              <button type="button" aria-pressed="true" data-unicode-filter="all">ALL <span data-unicode-all-count>0</span></button>
              <button type="button" aria-pressed="false" data-unicode-filter="invisible" disabled>INVISIBLE <span data-unicode-invisible-count>0</span></button>
            </div>
          </div>
          <ol class="unicode-result-list" data-unicode-results></ol>
          <div class="workspace-panel__footer"><span data-unicode-result-state data-state="empty" aria-live="polite">READY / TYPE OR PASTE TEXT</span><span data-unicode-result-count>0 RESULTS</span></div>
        </section>
      </div>`;

    const input = workspace.querySelector('[data-unicode-input]');
    const inputState = workspace.querySelector('[data-unicode-input-state]');
    const inputLimit = workspace.querySelector('[data-unicode-input-limit]');
    const summary = workspace.querySelector('[data-unicode-summary]');
    const summaryState = workspace.querySelector('[data-unicode-summary-state]');
    const alert = workspace.querySelector('.unicode-alert');
    const alertText = workspace.querySelector('[data-unicode-alert-text]');
    const results = workspace.querySelector('[data-unicode-results]');
    const resultState = workspace.querySelector('[data-unicode-result-state]');
    const resultCount = workspace.querySelector('[data-unicode-result-count]');
    const allCount = workspace.querySelector('[data-unicode-all-count]');
    const invisibleCount = workspace.querySelector('[data-unicode-invisible-count]');
    const clearButton = workspace.querySelector('[data-clear]');
    const copyReportButton = workspace.querySelector('[data-copy-unicode-report]');
    const filterButtons = [...workspace.querySelectorAll('[data-unicode-filter]')];
    let activeFilter = 'all';
    let currentAnalysis = inspector.analyze('');

    const renderSummary = () => {
      const metrics = [
        ['CODE POINTS', currentAnalysis.codePoints],
        ['GRAPHEMES', currentAnalysis.graphemes],
        ['UTF-16 UNITS', currentAnalysis.utf16Units],
        ['UTF-8 BYTES', currentAnalysis.utf8Bytes],
        ['INVISIBLE / SPECIAL', currentAnalysis.invisibleCount],
      ];
      summary.innerHTML = metrics.map(([label, value]) => `<div><span>${label}</span><output>${value.toLocaleString('en-US')}</output></div>`).join('');
    };

    const renderItems = () => {
      const selectedItems = activeFilter === 'invisible' ? currentAnalysis.invisibleItems : currentAnalysis.items;
      if (!selectedItems.length) {
        const message = currentAnalysis.codePoints === 0
          ? '解析する文字を入力してください。'
          : '表示範囲に不可視・特殊文字はありません。';
        results.innerHTML = `<li class="unicode-empty"><span>[ NO_RESULTS ]</span><p>${message}</p></li>`;
      } else {
        results.innerHTML = selectedItems.map((item) => `
          <li class="unicode-result-card${item.isInvisible ? ' is-invisible' : ''}" data-kind="${escapeMarkup(item.kind || 'visible')}">
            <div class="unicode-result-card__visual">
              <span class="unicode-result-card__glyph" aria-hidden="true">${escapeMarkup(item.display)}</span>
              <div><span>#${String(item.index).padStart(3, '0')} / L${item.line}:C${item.column}</span><strong>${item.codePointLabel}</strong>${item.flag ? `<small>${escapeMarkup(item.flag)}</small>` : ''}</div>
            </div>
            <dl class="unicode-result-card__details">
              <div><dt>DECIMAL</dt><dd>${item.decimal}</dd></div>
              <div><dt>CATEGORY</dt><dd>${item.categoryCode} / ${escapeMarkup(item.category)}</dd></div>
              <div><dt>BLOCK</dt><dd>${escapeMarkup(item.block)}</dd></div>
              <div><dt>UTF-8</dt><dd>${item.utf8}</dd></div>
              <div><dt>UTF-16</dt><dd>${item.utf16}</dd></div>
              <div><dt>HTML</dt><dd>${escapeMarkup(item.htmlEscape)}</dd></div>
              <div><dt>CSS</dt><dd>${escapeMarkup(item.cssEscape)}</dd></div>
              <div><dt>JAVASCRIPT</dt><dd>${escapeMarkup(item.javascriptEscape)}</dd></div>
            </dl>
            <button class="unicode-copy-button" type="button" data-copy-unicode-index="${item.index}" aria-label="${item.codePointLabel}をコピー">COPY ${item.codePointLabel}</button>
          </li>`).join('');
      }

      const isInvisibleFilter = activeFilter === 'invisible';
      const total = isInvisibleFilter ? currentAnalysis.invisibleCount : currentAnalysis.codePoints;
      const shown = selectedItems.length;
      const truncated = isInvisibleFilter ? currentAnalysis.invisibleResultsTruncated : currentAnalysis.resultsTruncated;
      resultState.textContent = currentAnalysis.codePoints === 0
        ? 'READY / TYPE OR PASTE TEXT'
        : truncated
          ? `DISPLAYING FIRST ${shown.toLocaleString('en-US')} OF ${total.toLocaleString('en-US')}`
          : `${isInvisibleFilter ? 'INVISIBLE' : 'ALL'} / ANALYSIS COMPLETE`;
      resultState.dataset.state = currentAnalysis.codePoints === 0 ? 'empty' : truncated ? 'truncated' : 'ready';
      resultCount.textContent = `${shown.toLocaleString('en-US')} / ${total.toLocaleString('en-US')} RESULTS`;
    };

    const render = () => {
      currentAnalysis = inspector.analyze(input.value);
      const isEmpty = currentAnalysis.codePoints === 0;
      const isAtLimit = input.value.length >= inspector.MAX_INPUT_LENGTH;
      if (activeFilter === 'invisible' && currentAnalysis.invisibleCount === 0) activeFilter = 'all';

      inputState.textContent = isAtLimit ? 'INPUT LIMIT' : isEmpty ? 'INPUT EMPTY' : 'ANALYZING';
      inputState.dataset.state = isAtLimit ? 'limit' : isEmpty ? 'empty' : 'ready';
      inputLimit.textContent = `${input.value.length.toLocaleString('en-US')} / ${inspector.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT`;
      summaryState.textContent = isEmpty
        ? 'WAITING FOR INPUT'
        : currentAnalysis.suspiciousCount
          ? `${currentAnalysis.suspiciousCount.toLocaleString('en-US')} SUSPICIOUS`
          : 'ANALYSIS COMPLETE';
      summaryState.dataset.state = currentAnalysis.suspiciousCount ? 'invalid' : isEmpty ? 'empty' : 'ready';

      alert.hidden = currentAnalysis.suspiciousCount === 0;
      alertText.textContent = currentAnalysis.suspiciousCount
        ? `${currentAnalysis.suspiciousCount.toLocaleString('en-US')}件の注意が必要な不可視・特殊文字を検出しました。`
        : '';
      allCount.textContent = currentAnalysis.codePoints.toLocaleString('en-US');
      invisibleCount.textContent = currentAnalysis.invisibleCount.toLocaleString('en-US');
      clearButton.disabled = isEmpty;
      copyReportButton.disabled = isEmpty;
      filterButtons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.unicodeFilter === activeFilter));
        if (button.dataset.unicodeFilter === 'invisible') button.disabled = currentAnalysis.invisibleCount === 0;
      });

      renderSummary();
      renderItems();
    };

    input.addEventListener('input', render);
    workspace.querySelector('[data-sample]').addEventListener('click', () => {
      input.value = 'A あ 漢 → 𩸽\nNBSP:\u00A0 / ZWSP:\u200B\n結合: e\u0301 / FAMILY: 👨‍👩‍👧‍👦';
      render();
      input.focus();
    });
    clearButton.addEventListener('click', () => {
      input.value = '';
      activeFilter = 'all';
      render();
      input.focus();
      showToast(RESET_TOAST_MESSAGE);
    });
    copyReportButton.addEventListener('click', () => copyText(inspector.formatReport(currentAnalysis)));
    filterButtons.forEach((button) => button.addEventListener('click', () => {
      activeFilter = button.dataset.unicodeFilter;
      render();
    }));
    results.addEventListener('click', (event) => {
      const button = event.target.closest('[data-copy-unicode-index]');
      if (!button) return;
      const index = Number(button.dataset.copyUnicodeIndex);
      const item = [...currentAnalysis.items, ...currentAnalysis.invisibleItems].find((candidate) => candidate.index === index);
      if (item) copyText(item.codePointLabel);
    });
    render();
    window.addEventListener('pageshow', render, { once: true });
  };

  const renderDirectoryTreeGenerator = () => {
    const generator = window.MarkBenchDirectoryTreeGenerator;
    if (!generator) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; directory tree generator module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    workspace.innerHTML = `
      <div class="workspace-grid workspace-grid--tree">
        <div class="workspace-panel tree-source">
          <div class="workspace-panel__header"><span>INPUT / INDENTED LIST</span><div class="workspace-actions"><button class="workspace-action" type="button" data-sample>SAMPLE</button><button class="workspace-action" type="button" data-clear disabled>CLEAR</button></div></div>
          <label class="visually-hidden" for="tree-input">ディレクトリとファイルの一覧</label>
          <textarea id="tree-input" maxlength="${generator.MAX_INPUT_LENGTH}" aria-describedby="tree-input-status tree-warnings" placeholder="project&#10;  src&#10;    index.js&#10;  README.md" spellcheck="false" data-tree-input></textarea>
          <div class="workspace-panel__footer" id="tree-input-status"><span data-tree-input-state data-state="empty" aria-live="polite">INPUT EMPTY</span><span data-tree-input-limit>0 / ${generator.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT</span></div>
        </div>
        <div class="workspace-panel tree-output">
          <div class="workspace-panel__header"><span>OUTPUT / DIRECTORY TREE</span><button class="workspace-action" type="button" data-copy-tree disabled>COPY OUTPUT</button></div>
          <label class="visually-hidden" for="tree-output">生成されたディレクトリツリー</label>
          <textarea id="tree-output" placeholder="ツリー図がここに表示されます。" spellcheck="false" readonly data-tree-output></textarea>
          <div class="workspace-panel__footer"><span data-tree-output-state data-state="empty">OUTPUT EMPTY</span><span data-tree-output-summary>0 NODES / 0 LEVELS</span></div>
        </div>
        <div class="tree-options">
          <div class="tree-options__controls" aria-label="ツリー生成オプション">
            <fieldset class="tree-option-group">
              <legend>INPUT INDENT</legend>
              <label><input type="radio" name="tree-indent" value="auto" data-tree-indent checked><span>AUTO</span></label>
              <label><input type="radio" name="tree-indent" value="spaces-2" data-tree-indent><span>2 SPACES</span></label>
              <label><input type="radio" name="tree-indent" value="spaces-4" data-tree-indent><span>4 SPACES</span></label>
              <label><input type="radio" name="tree-indent" value="tab" data-tree-indent><span>TAB</span></label>
            </fieldset>
            <fieldset class="tree-option-group tree-option-group--checks">
              <legend>OUTPUT OPTIONS</legend>
              <label><input type="checkbox" data-tree-root><span>SHOW ./ ROOT</span></label>
              <label><input type="checkbox" data-tree-slash checked><span>DIRECTORY /</span></label>
              <label><input type="checkbox" data-tree-ignore-blank checked><span>IGNORE BLANK</span></label>
            </fieldset>
          </div>
          <dl class="tree-summary" aria-label="生成結果の概要">
            <div><dt>NODES</dt><dd data-tree-nodes>0</dd></div>
            <div><dt>LEVELS</dt><dd data-tree-levels>0</dd></div>
            <div><dt>ROOTS</dt><dd data-tree-roots>0</dd></div>
            <div><dt>INDENT</dt><dd data-tree-detected-indent>AUTO</dd></div>
          </dl>
          <div class="tree-warnings" id="tree-warnings" aria-live="polite" data-tree-warnings hidden></div>
        </div>
      </div>`;

    const input = workspace.querySelector('[data-tree-input]');
    const output = workspace.querySelector('[data-tree-output]');
    const inputState = workspace.querySelector('[data-tree-input-state]');
    const inputLimit = workspace.querySelector('[data-tree-input-limit]');
    const outputState = workspace.querySelector('[data-tree-output-state]');
    const outputSummary = workspace.querySelector('[data-tree-output-summary]');
    const nodeCount = workspace.querySelector('[data-tree-nodes]');
    const levelCount = workspace.querySelector('[data-tree-levels]');
    const rootCount = workspace.querySelector('[data-tree-roots]');
    const detectedIndent = workspace.querySelector('[data-tree-detected-indent]');
    const warnings = workspace.querySelector('[data-tree-warnings]');
    const clearButton = workspace.querySelector('[data-clear]');
    const copyButton = workspace.querySelector('[data-copy-tree]');
    let currentResult = generator.generate('');
    let composing = false;
    let renderFrame = 0;

    const getOptions = () => ({
      indentMode: workspace.querySelector('[data-tree-indent]:checked')?.value || 'auto',
      showRoot: workspace.querySelector('[data-tree-root]').checked,
      trailingSlash: workspace.querySelector('[data-tree-slash]').checked,
      ignoreBlankLines: workspace.querySelector('[data-tree-ignore-blank]').checked,
    });

    const renderWarnings = () => {
      if (currentResult.warnings.length === 0) {
        warnings.hidden = true;
        warnings.innerHTML = '';
        return;
      }
      const visibleWarnings = currentResult.warnings.slice(0, 8);
      warnings.hidden = false;
      warnings.innerHTML = `
        <div class="tree-warnings__heading"><strong>INPUT WARNINGS</strong><span>${currentResult.warnings.length.toLocaleString('en-US')} FOUND</span></div>
        <ul>${visibleWarnings.map((warning) => `<li><span>${warning.line ? `LINE ${warning.line}` : 'LIMIT'}</span><p>${escapeMarkup(warning.message)}</p></li>`).join('')}</ul>
        ${currentResult.warnings.length > visibleWarnings.length ? `<p class="tree-warnings__more">+ ${currentResult.warnings.length - visibleWarnings.length} MORE WARNINGS</p>` : ''}`;
    };

    const renderResult = () => {
      currentResult = generator.generate(input.value, getOptions());
      const isEmpty = input.value.length === 0;
      const hasOutput = currentResult.output.length > 0;
      const isAtLimit = input.value.length >= generator.MAX_INPUT_LENGTH;
      const hasWarnings = currentResult.warnings.length > 0;

      output.value = currentResult.output;
      inputState.textContent = isAtLimit
        ? 'INPUT LIMIT'
        : isEmpty
          ? 'INPUT EMPTY'
          : hasWarnings
            ? `${currentResult.warnings.length} WARNINGS`
            : 'TREE READY';
      inputState.dataset.state = isAtLimit ? 'limit' : isEmpty ? 'empty' : hasWarnings ? 'invalid' : 'ready';
      inputLimit.textContent = `${input.value.length.toLocaleString('en-US')} / ${generator.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT`;
      outputState.textContent = hasOutput ? 'TREE GENERATED' : 'OUTPUT EMPTY';
      outputState.dataset.state = hasOutput ? 'ready' : 'empty';
      outputSummary.textContent = `${currentResult.nodeCount.toLocaleString('en-US')} NODES / ${currentResult.maxDepth.toLocaleString('en-US')} LEVELS`;
      nodeCount.textContent = currentResult.nodeCount.toLocaleString('en-US');
      levelCount.textContent = currentResult.maxDepth.toLocaleString('en-US');
      rootCount.textContent = currentResult.rootCount.toLocaleString('en-US');
      detectedIndent.textContent = currentResult.indent.label;
      clearButton.disabled = isEmpty;
      copyButton.disabled = !hasOutput;
      renderWarnings();
    };

    const scheduleRender = () => {
      window.cancelAnimationFrame(renderFrame);
      renderFrame = window.requestAnimationFrame(() => {
        renderFrame = 0;
        renderResult();
      });
    };

    const getInsertIndent = () => {
      const mode = getOptions().indentMode;
      if (mode === 'tab') return '\t';
      if (mode === 'spaces-4') return '    ';
      if (mode === 'spaces-2') return '  ';
      return currentResult.indent.insertText || '  ';
    };

    const editSelectedLines = (removeIndent) => {
      const value = input.value;
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;
      const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
      let lineEnd = value.indexOf('\n', selectionEnd);
      if (lineEnd === -1) lineEnd = value.length;
      const indentText = getInsertIndent();
      const replacement = value.slice(lineStart, lineEnd).split('\n').map((line) => {
        if (!removeIndent) return `${indentText}${line}`;
        if (line.startsWith(indentText)) return line.slice(indentText.length);
        if (line.startsWith('\t')) return line.slice(1);
        const removable = line.match(/^[ \u3000]{1,4}/u)?.[0] ?? '';
        return line.slice(removable.length);
      }).join('\n');
      input.setRangeText(replacement, lineStart, lineEnd, 'select');
      scheduleRender();
    };

    input.addEventListener('compositionstart', () => {
      composing = true;
      inputState.textContent = 'COMPOSING / IME';
      inputState.dataset.state = 'ready';
    });
    input.addEventListener('compositionend', () => {
      composing = false;
      scheduleRender();
    });
    input.addEventListener('input', (event) => {
      if (!composing && !event.isComposing) scheduleRender();
    });
    input.addEventListener('keydown', (event) => {
      if (generator.isCompositionKey(event, composing)) return;

      if (event.key === 'Tab') {
        event.preventDefault();
        const hasMultipleLines = input.value.slice(input.selectionStart, input.selectionEnd).includes('\n');
        if (event.shiftKey || hasMultipleLines) {
          editSelectedLines(event.shiftKey);
        } else {
          input.setRangeText(getInsertIndent(), input.selectionStart, input.selectionEnd, 'end');
          scheduleRender();
        }
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const indentation = generator.getCurrentLineIndent(input.value, input.selectionStart);
        input.setRangeText(`\n${indentation}`, input.selectionStart, input.selectionEnd, 'end');
        scheduleRender();
      }
    });

    workspace.querySelectorAll('[data-tree-indent], [data-tree-root], [data-tree-slash], [data-tree-ignore-blank]').forEach((control) => control.addEventListener('change', renderResult));
    workspace.querySelector('[data-sample]').addEventListener('click', () => {
      input.value = ['mark-bench', '  css', '    foundation.css', '    pages.css', '  js', '    main.js', '    tool.js', '  tools', '    index.html', '    directory-tree-generator.html', '  README.md'].join('\n');
      renderResult();
      input.focus();
    });
    clearButton.addEventListener('click', () => {
      input.value = '';
      renderResult();
      input.focus();
      showToast(RESET_TOAST_MESSAGE);
    });
    copyButton.addEventListener('click', () => copyText(currentResult.output));
    renderResult();
    window.addEventListener('pageshow', renderResult, { once: true });
  };

  const renderMarkdownPreviewEditor = () => {
    const editor = window.MarkBenchMarkdownPreviewEditor;
    if (!editor) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; markdown preview editor module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    workspace.innerHTML = `
      <div class="markdown-workspace" data-markdown-mobile-view="editor">
        <div class="markdown-mobile-tabs" role="group" aria-label="表示するパネル">
          <button type="button" aria-pressed="true" data-markdown-view="editor">EDITOR</button>
          <button type="button" aria-pressed="false" data-markdown-view="preview">PREVIEW</button>
          <button type="button" aria-pressed="false" data-markdown-view="html">HTML</button>
        </div>
        <div class="workspace-grid workspace-grid--markdown">
          <section class="workspace-panel markdown-source" data-markdown-pane="editor" aria-label="Markdown入力">
            <div class="workspace-panel__header"><span>INPUT / MARKDOWN</span><div class="workspace-actions"><button class="workspace-action" type="button" data-markdown-sample>SAMPLE</button><button class="workspace-action" type="button" data-markdown-clear disabled>CLEAR</button></div></div>
            <div class="markdown-toolbar" role="toolbar" aria-label="Markdown編集ツール">
              <button type="button" data-markdown-command="undo" aria-label="元に戻す" title="元に戻す" disabled>UNDO</button>
              <button type="button" data-markdown-command="redo" aria-label="やり直す" title="やり直す" disabled>REDO</button>
              <span aria-hidden="true"></span>
              <button type="button" data-markdown-command="h2" aria-label="見出し2" title="見出し2">H2</button>
              <button type="button" data-markdown-command="h3" aria-label="見出し3" title="見出し3">H3</button>
              <button type="button" data-markdown-command="bold" aria-label="太字" title="太字"><strong>B</strong></button>
              <button type="button" data-markdown-command="italic" aria-label="斜体" title="斜体"><em>I</em></button>
              <button type="button" data-markdown-command="strike" aria-label="取り消し線" title="取り消し線"><del>S</del></button>
              <button type="button" data-markdown-command="link" aria-label="リンク" title="リンク">LINK</button>
              <button type="button" data-markdown-command="image" aria-label="画像" title="画像">IMAGE</button>
              <button type="button" data-markdown-command="code" aria-label="コード" title="コード">CODE</button>
              <button type="button" data-markdown-command="quote" aria-label="引用" title="引用">QUOTE</button>
              <button type="button" data-markdown-command="ul" aria-label="箇条書き" title="箇条書き">UL</button>
              <button type="button" data-markdown-command="ol" aria-label="番号付きリスト" title="番号付きリスト">OL</button>
              <button type="button" data-markdown-command="task" aria-label="タスクリスト" title="タスクリスト">TASK</button>
              <button type="button" data-markdown-command="table" aria-label="テーブル" title="テーブル">TABLE</button>
            </div>
            <label class="visually-hidden" for="markdown-input">編集するMarkdown</label>
            <textarea id="markdown-input" maxlength="${editor.MAX_INPUT_LENGTH}" aria-describedby="markdown-input-status markdown-warnings" placeholder="# ページタイトル&#10;&#10;Markdownを入力してください。" spellcheck="true" data-markdown-input></textarea>
            <div class="workspace-panel__footer" id="markdown-input-status"><span data-markdown-input-state data-state="empty" aria-live="polite">INPUT EMPTY</span><span data-markdown-input-limit>0 / ${editor.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT</span></div>
          </section>
          <section class="workspace-panel markdown-output" data-markdown-pane="output" aria-label="Markdown出力">
            <div class="workspace-panel__header markdown-output__header"><span>OUTPUT</span><div class="markdown-output-tabs" role="group" aria-label="出力形式"><button type="button" aria-pressed="true" data-markdown-view="preview">PREVIEW</button><button type="button" aria-pressed="false" data-markdown-view="html">HTML SOURCE</button></div></div>
            <div class="markdown-preview-stage" data-markdown-output="preview" data-preview-width="auto">
              <iframe title="Markdownのレンダリングプレビュー" sandbox referrerpolicy="no-referrer" data-markdown-preview></iframe>
            </div>
            <pre class="markdown-html-source" data-markdown-output="html" hidden><code data-markdown-html></code></pre>
            <div class="workspace-panel__footer"><span data-markdown-output-state data-state="empty">OUTPUT EMPTY</span><span data-markdown-output-summary>0 HEADINGS / 0 LINKS</span></div>
          </section>
          <div class="markdown-controls">
            <div class="markdown-controls__settings">
              <fieldset class="markdown-option-group">
                <legend>PREVIEW WIDTH</legend>
                <label><input type="radio" name="markdown-preview-width" value="auto" data-markdown-width checked><span>AUTO</span></label>
                <label><input type="radio" name="markdown-preview-width" value="article" data-markdown-width><span>ARTICLE 720</span></label>
                <label><input type="radio" name="markdown-preview-width" value="mobile" data-markdown-width><span>MOBILE 375</span></label>
              </fieldset>
              <label class="markdown-remote-media"><input type="checkbox" data-markdown-remote-media><span>LOAD REMOTE IMAGES</span></label>
            </div>
            <dl class="markdown-metrics" aria-label="文書の集計結果">
              <div><dt>CHARACTERS</dt><dd data-markdown-metric="characters">0</dd></div>
              <div><dt>WORDS</dt><dd data-markdown-metric="words">0</dd></div>
              <div><dt>LINES</dt><dd data-markdown-metric="lines">0</dd></div>
              <div><dt>HEADINGS</dt><dd data-markdown-metric="headings">0</dd></div>
              <div><dt>LINKS</dt><dd data-markdown-metric="links">0</dd></div>
              <div><dt>WARNINGS</dt><dd data-markdown-metric="warnings">0</dd></div>
            </dl>
            <div class="markdown-copy-actions">
              <button type="button" data-copy-markdown disabled>COPY MARKDOWN</button>
              <button type="button" data-copy-markdown-html disabled>COPY HTML</button>
              <button type="button" data-download-markdown disabled>DOWNLOAD .MD</button>
            </div>
          </div>
          <div class="markdown-warnings" id="markdown-warnings" aria-live="polite" data-markdown-warnings hidden></div>
        </div>
      </div>`;

    const root = workspace.querySelector('.markdown-workspace');
    const input = workspace.querySelector('[data-markdown-input]');
    const preview = workspace.querySelector('[data-markdown-preview]');
    const previewStage = workspace.querySelector('[data-markdown-output="preview"]');
    const htmlSource = workspace.querySelector('[data-markdown-output="html"]');
    const htmlCode = workspace.querySelector('[data-markdown-html]');
    const inputState = workspace.querySelector('[data-markdown-input-state]');
    const inputLimit = workspace.querySelector('[data-markdown-input-limit]');
    const outputState = workspace.querySelector('[data-markdown-output-state]');
    const outputSummary = workspace.querySelector('[data-markdown-output-summary]');
    const warnings = workspace.querySelector('[data-markdown-warnings]');
    const clearButton = workspace.querySelector('[data-markdown-clear]');
    const copyMarkdownButton = workspace.querySelector('[data-copy-markdown]');
    const copyHtmlButton = workspace.querySelector('[data-copy-markdown-html]');
    const downloadButton = workspace.querySelector('[data-download-markdown]');
    const remoteMedia = workspace.querySelector('[data-markdown-remote-media]');
    const undoButton = workspace.querySelector('[data-markdown-command="undo"]');
    const redoButton = workspace.querySelector('[data-markdown-command="redo"]');
    let currentResult = editor.analyze('');
    let outputView = 'preview';
    let composing = false;
    let renderTimer = 0;
    let history = [{ value: '', start: 0, end: 0 }];
    let historyIndex = 0;

    const updateHistoryButtons = () => {
      undoButton.disabled = historyIndex <= 0;
      redoButton.disabled = historyIndex >= history.length - 1;
    };

    const captureHistory = () => {
      const snapshot = { value: input.value, start: input.selectionStart, end: input.selectionEnd };
      if (history[historyIndex]?.value === snapshot.value) {
        history[historyIndex] = snapshot;
        updateHistoryButtons();
        return;
      }
      history = history.slice(0, historyIndex + 1);
      history.push(snapshot);
      if (history.length > editor.MAX_HISTORY) history.shift();
      historyIndex = history.length - 1;
      updateHistoryButtons();
    };

    const restoreHistory = (nextIndex) => {
      if (nextIndex < 0 || nextIndex >= history.length) return;
      historyIndex = nextIndex;
      const snapshot = history[historyIndex];
      input.value = snapshot.value;
      input.focus();
      input.setSelectionRange(snapshot.start, snapshot.end);
      renderResult();
      updateHistoryButtons();
    };

    const renderWarnings = () => {
      if (currentResult.warnings.length === 0) {
        warnings.hidden = true;
        warnings.innerHTML = '';
        return;
      }
      const visibleWarnings = currentResult.warnings.slice(0, 10);
      warnings.hidden = false;
      warnings.innerHTML = `
        <div class="markdown-warnings__heading"><strong>DOCUMENT WARNINGS</strong><span>${currentResult.warningCount.toLocaleString('en-US')} FOUND</span></div>
        <ul>${visibleWarnings.map((warning) => `<li><span>${warning.line ? `LINE ${warning.line}` : 'DOCUMENT'}</span><p>${escapeMarkup(warning.message)}</p></li>`).join('')}</ul>
        ${currentResult.warningCount > visibleWarnings.length ? `<p class="markdown-warnings__more">+ ${currentResult.warningCount - visibleWarnings.length} MORE WARNINGS</p>` : ''}`;
    };

    const renderMetrics = () => {
      const metrics = {
        characters: currentResult.inputLength,
        words: currentResult.wordCount,
        lines: currentResult.lineCount,
        headings: currentResult.headingCount,
        links: currentResult.linkCount,
        warnings: currentResult.warningCount,
      };
      Object.entries(metrics).forEach(([keyName, value]) => {
        const target = workspace.querySelector(`[data-markdown-metric="${keyName}"]`);
        if (target) target.textContent = value.toLocaleString('en-US');
      });
    };

    const renderResult = () => {
      window.clearTimeout(renderTimer);
      renderTimer = 0;
      const isEmpty = input.value.length === 0;
      currentResult = editor.analyze(input.value, { allowRemoteImages: remoteMedia.checked });
      htmlCode.textContent = currentResult.html;
      preview.srcdoc = editor.createPreviewDocument(currentResult.html, { allowRemoteImages: remoteMedia.checked });
      inputState.textContent = isEmpty ? 'INPUT EMPTY' : currentResult.warningCount ? `${currentResult.warningCount} WARNINGS` : 'DOCUMENT READY';
      inputState.dataset.state = isEmpty ? 'empty' : currentResult.warningCount ? 'invalid' : 'ready';
      inputLimit.textContent = `${input.value.length.toLocaleString('en-US')} / ${editor.MAX_INPUT_LENGTH.toLocaleString('en-US')} LIMIT`;
      outputState.textContent = isEmpty ? 'OUTPUT EMPTY' : outputView === 'html' ? 'HTML READY' : 'PREVIEW READY';
      outputState.dataset.state = isEmpty ? 'empty' : currentResult.warningCount ? 'invalid' : 'ready';
      outputSummary.textContent = `${currentResult.headingCount.toLocaleString('en-US')} HEADINGS / ${currentResult.linkCount.toLocaleString('en-US')} LINKS`;
      clearButton.disabled = isEmpty;
      copyMarkdownButton.disabled = isEmpty;
      copyHtmlButton.disabled = !currentResult.html;
      downloadButton.disabled = isEmpty;
      renderMetrics();
      renderWarnings();
    };

    const scheduleRender = () => {
      window.clearTimeout(renderTimer);
      renderTimer = window.setTimeout(renderResult, 90);
    };

    const setOutputView = (view) => {
      if (view !== 'preview' && view !== 'html') return;
      outputView = view;
      previewStage.hidden = view !== 'preview';
      htmlSource.hidden = view !== 'html';
      workspace.querySelectorAll('.markdown-output-tabs [data-markdown-view]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.markdownView === view));
      });
      if (input.value) outputState.textContent = currentResult.warningCount
        ? `${currentResult.warningCount} WARNINGS`
        : view === 'html'
          ? 'HTML READY'
          : 'PREVIEW READY';
    };

    const setMobileView = (view) => {
      if (!['editor', 'preview', 'html'].includes(view)) return;
      root.dataset.markdownMobileView = view;
      workspace.querySelectorAll('.markdown-mobile-tabs [data-markdown-view]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.markdownView === view));
      });
      if (view !== 'editor') setOutputView(view);
    };

    const replaceSelection = (before, after, placeholder) => {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const selected = input.value.slice(start, end) || placeholder;
      const replacement = `${before}${selected}${after}`;
      input.setRangeText(replacement, start, end, 'select');
      const selectionStart = start + before.length;
      input.setSelectionRange(selectionStart, selectionStart + selected.length);
      captureHistory();
      renderResult();
      input.focus();
    };

    const prefixSelectedLines = (createPrefix, placeholder) => {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const lineStart = input.value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      let lineEnd = input.value.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = input.value.length;
      const selected = input.value.slice(lineStart, lineEnd) || placeholder;
      const replacement = selected.split('\n').map((line, index) => `${createPrefix(index)}${line}`).join('\n');
      input.setRangeText(replacement, lineStart, lineEnd, 'select');
      captureHistory();
      renderResult();
      input.focus();
    };

    const applyCommand = (command) => {
      if (command === 'undo') return restoreHistory(historyIndex - 1);
      if (command === 'redo') return restoreHistory(historyIndex + 1);
      if (command === 'h2') return prefixSelectedLines(() => '## ', '見出し');
      if (command === 'h3') return prefixSelectedLines(() => '### ', '見出し');
      if (command === 'bold') return replaceSelection('**', '**', '太字');
      if (command === 'italic') return replaceSelection('*', '*', '斜体');
      if (command === 'strike') return replaceSelection('~~', '~~', '取り消し線');
      if (command === 'link') return replaceSelection('[', '](https://example.com)', 'リンクテキスト');
      if (command === 'image') return replaceSelection('![', '](https://example.com/image.jpg)', '代替テキスト');
      if (command === 'quote') return prefixSelectedLines(() => '> ', '引用文');
      if (command === 'ul') return prefixSelectedLines(() => '- ', '項目');
      if (command === 'ol') return prefixSelectedLines((index) => `${index + 1}. `, '項目');
      if (command === 'task') return prefixSelectedLines(() => '- [ ] ', 'タスク');
      if (command === 'table') {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const table = '| 項目 | 内容 |\n| :--- | :--- |\n| Sample | Ready |';
        input.setRangeText(table, start, end, 'select');
        captureHistory();
        renderResult();
        input.focus();
        return undefined;
      }
      if (command === 'code') {
        const selected = input.value.slice(input.selectionStart, input.selectionEnd);
        return selected.includes('\n')
          ? replaceSelection('```\n', '\n```', 'コード')
          : replaceSelection('`', '`', 'code');
      }
      return undefined;
    };

    const downloadMarkdown = () => {
      if (!input.value) return;
      const blob = new Blob([input.value], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'mark-bench-document.md';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      showToast('ダウンロードが完了しました。');
    };

    input.addEventListener('compositionstart', () => {
      composing = true;
      inputState.textContent = 'COMPOSING / IME';
      inputState.dataset.state = 'ready';
    });
    input.addEventListener('compositionend', () => {
      composing = false;
      captureHistory();
      scheduleRender();
    });
    input.addEventListener('input', (event) => {
      if (composing || event.isComposing) return;
      captureHistory();
      scheduleRender();
    });
    input.addEventListener('keydown', (event) => {
      if (editor.isCompositionKey(event, composing)) return;
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        restoreHistory(historyIndex + (event.shiftKey ? 1 : -1));
      } else if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        restoreHistory(historyIndex + 1);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        input.setRangeText('  ', input.selectionStart, input.selectionEnd, 'end');
        captureHistory();
        scheduleRender();
      }
    });

    workspace.querySelector('.markdown-toolbar').addEventListener('mousedown', (event) => {
      if (event.target.closest('button')) event.preventDefault();
    });
    workspace.querySelector('.markdown-toolbar').addEventListener('click', (event) => {
      const button = event.target.closest('[data-markdown-command]');
      if (button && !button.disabled) applyCommand(button.dataset.markdownCommand);
    });
    workspace.querySelectorAll('[data-markdown-view]').forEach((button) => button.addEventListener('click', () => {
      if (button.closest('.markdown-mobile-tabs')) setMobileView(button.dataset.markdownView);
      else setOutputView(button.dataset.markdownView);
    }));
    workspace.querySelectorAll('[data-markdown-width]').forEach((control) => control.addEventListener('change', () => {
      previewStage.dataset.previewWidth = workspace.querySelector('[data-markdown-width]:checked')?.value || 'auto';
    }));
    remoteMedia.addEventListener('change', renderResult);
    workspace.querySelector('[data-markdown-sample]').addEventListener('click', () => {
      input.value = editor.SAMPLE;
      input.setSelectionRange(0, 0);
      captureHistory();
      renderResult();
      input.focus();
    });
    clearButton.addEventListener('click', () => {
      input.value = '';
      input.setSelectionRange(0, 0);
      captureHistory();
      renderResult();
      input.focus();
      showToast(RESET_TOAST_MESSAGE);
    });
    copyMarkdownButton.addEventListener('click', () => copyText(input.value));
    copyHtmlButton.addEventListener('click', () => copyText(currentResult.html));
    downloadButton.addEventListener('click', downloadMarkdown);

    setOutputView('preview');
    renderResult();
    updateHistoryButtons();
    window.addEventListener('pageshow', renderResult, { once: true });
  };

  const renderHtmlTableBuilder = () => {
    const builder = window.MarkBenchHtmlTableBuilder;
    if (!builder) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; html table builder module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    workspace.innerHTML = `
      <div class="table-builder" data-table-mobile-view="editor">
        <div class="table-builder__mobile-tabs" role="group" aria-label="表示するパネル">
          <button type="button" aria-pressed="true" data-table-view="editor">EDITOR</button>
          <button type="button" aria-pressed="false" data-table-view="preview">PREVIEW</button>
          <button type="button" aria-pressed="false" data-table-view="html">HTML</button>
          <button type="button" aria-pressed="false" data-table-view="css">CSS</button>
        </div>
        <div class="workspace-grid workspace-grid--table-builder">
          <section class="workspace-panel table-builder__editor-pane" data-table-pane="editor" aria-label="テーブル編集">
            <div class="workspace-panel__header"><span>INPUT / EDITABLE GRID</span><div class="workspace-actions"><button class="workspace-action" type="button" data-table-sample>SAMPLE</button><button class="workspace-action" type="button" data-table-clear>CLEAR</button></div></div>
            <div class="table-builder__templates" aria-label="テーブルテンプレート">
              ${Object.entries(builder.TEMPLATE_DEFINITIONS).map(([keyName, template]) => `<button type="button" data-table-template="${keyName}" aria-label="${template.label} / ${template.labelJa}"><span class="table-builder__template-label table-builder__template-label--en">${template.label}</span><span class="table-builder__template-label table-builder__template-label--ja" aria-hidden="true">${template.labelJa}</span></button>`).join('')}
            </div>
            <div class="table-builder__dimensions">
              <label>ROWS<input type="number" min="${builder.MIN_ROWS}" max="${builder.MAX_ROWS}" value="${builder.DEFAULT_ROWS}" inputmode="numeric" data-table-rows></label>
              <label>COLUMNS<input type="number" min="${builder.MIN_COLS}" max="${builder.MAX_COLS}" value="${builder.DEFAULT_COLS}" inputmode="numeric" data-table-cols></label>
              <button type="button" data-table-resize>APPLY SIZE</button>
            </div>
            <div class="table-builder__actions" aria-label="テーブル操作">
              <button type="button" data-table-action="add-row">+ ROW</button>
              <button type="button" data-table-action="remove-row">− ROW</button>
              <button type="button" data-table-action="add-col">+ COLUMN</button>
              <button type="button" data-table-action="remove-col">− COLUMN</button>
              <button type="button" data-table-history="undo" disabled>UNDO</button>
              <button type="button" data-table-history="redo" disabled>REDO</button>
            </div>
            <p class="table-builder__paste-help" id="table-grid-help">ExcelやGoogle Sheetsの複数セルは、任意のセルへそのまま貼り付けできます。</p>
            <div class="table-builder__grid" data-table-grid></div>
            <div class="workspace-panel__footer"><span data-table-input-state data-state="invalid" aria-live="polite">EMPTY TABLE</span><span data-table-dimensions>4 ROWS × 4 COLUMNS</span></div>
          </section>
          <section class="workspace-panel table-builder__output-pane" data-table-pane="output" aria-label="テーブル出力">
            <div class="workspace-panel__header table-builder__output-header"><span>OUTPUT</span><div class="table-builder__output-tabs" role="group" aria-label="出力形式"><button type="button" aria-pressed="true" data-table-view="preview">PREVIEW</button><button type="button" aria-pressed="false" data-table-view="html">HTML</button><button type="button" aria-pressed="false" data-table-view="css">CSS</button></div></div>
            <div class="table-builder__preview" data-table-output="preview" data-preview-width="auto"><iframe title="生成したHTMLテーブルのプレビュー" sandbox referrerpolicy="no-referrer" data-table-preview></iframe></div>
            <pre class="table-builder__source" data-table-output="source" hidden><code data-table-source></code></pre>
            <div class="workspace-panel__footer"><span data-table-output-state data-state="invalid">3 WARNINGS</span><span data-table-output-summary>0 / 16 CELLS</span></div>
          </section>
          <div class="table-builder__settings">
            <div class="table-builder__caption-settings">
              <label for="table-caption">CAPTION<input id="table-caption" type="text" maxlength="${builder.MAX_CAPTION_LENGTH}" placeholder="例：商品仕様" data-table-caption></label>
              <fieldset class="table-builder__option-group">
                <legend>CAPTION DISPLAY</legend>
                <label><input type="radio" name="table-caption-visibility" value="visible" data-table-caption-visibility checked><span>VISIBLE</span></label>
                <label><input type="radio" name="table-caption-visibility" value="visually-hidden" data-table-caption-visibility><span>SCREEN READER</span></label>
                <label><input type="radio" name="table-caption-visibility" value="none" data-table-caption-visibility><span>NONE</span></label>
              </fieldset>
            </div>
            <div class="table-builder__setting-grid">
              <fieldset class="table-builder__option-group">
                <legend>HEADERS</legend>
                <label><input type="radio" name="table-header-mode" value="top-left" data-table-header-mode checked><span>TOP + LEFT</span></label>
                <label><input type="radio" name="table-header-mode" value="top" data-table-header-mode><span>TOP</span></label>
                <label><input type="radio" name="table-header-mode" value="left" data-table-header-mode><span>LEFT</span></label>
                <label><input type="radio" name="table-header-mode" value="none" data-table-header-mode><span>NONE</span></label>
              </fieldset>
              <fieldset class="table-builder__option-group">
                <legend>ALIGNMENT</legend>
                <label><input type="radio" name="table-alignment" value="left" data-table-alignment checked><span>LEFT</span></label>
                <label><input type="radio" name="table-alignment" value="center" data-table-alignment><span>CENTER</span></label>
                <label><input type="radio" name="table-alignment" value="right" data-table-alignment><span>RIGHT</span></label>
              </fieldset>
              <fieldset class="table-builder__option-group">
                <legend>OUTPUT MODE</legend>
                <label><input type="radio" name="table-output-mode" value="class" data-table-output-mode checked><span>CLASS + CSS</span></label>
                <label><input type="radio" name="table-output-mode" value="inline" data-table-output-mode><span>CMS INLINE</span></label>
              </fieldset>
              <fieldset class="table-builder__option-group">
                <legend>PREVIEW WIDTH</legend>
                <label><input type="radio" name="table-preview-width" value="auto" data-table-preview-width checked><span>AUTO</span></label>
                <label><input type="radio" name="table-preview-width" value="article" data-table-preview-width><span>ARTICLE 720</span></label>
                <label><input type="radio" name="table-preview-width" value="mobile" data-table-preview-width><span>MOBILE 375</span></label>
              </fieldset>
            </div>
            <label class="table-builder__responsive"><input type="checkbox" data-table-responsive checked><span>RESPONSIVE SCROLL WRAPPER</span></label>
            <section class="table-builder__style-section" aria-labelledby="table-style-title">
              <div class="table-builder__style-header">
                <strong id="table-style-title">TABLE STYLE</strong>
                <button type="button" data-table-style-reset>RESET STYLE</button>
              </div>
              <div class="table-builder__style-grid">
                <fieldset class="table-builder__style-group">
                  <legend>TH STYLE</legend>
                  <div class="table-builder__color-fields">
                    <label class="table-builder__color-field">
                      <span>BACKGROUND</span>
                      <span class="table-builder__color-control"><input type="color" value="#f5f7fa" aria-label="見出しセルの背景色" data-table-color-picker="headerBackground"><input type="text" value="#f5f7fa" maxlength="7" spellcheck="false" aria-label="見出しセルの背景色コード" data-table-color-text="headerBackground"></span>
                    </label>
                    <label class="table-builder__color-field">
                      <span>TEXT</span>
                      <span class="table-builder__color-control"><input type="color" value="#1c2430" aria-label="見出しセルの文字色" data-table-color-picker="headerText"><input type="text" value="#1c2430" maxlength="7" spellcheck="false" aria-label="見出しセルの文字色コード" data-table-color-text="headerText"></span>
                    </label>
                  </div>
                  <fieldset class="table-builder__style-choice">
                    <legend>FONT WEIGHT</legend>
                    <label><input type="radio" name="table-header-weight" value="regular" data-table-header-weight><span>REGULAR</span></label>
                    <label><input type="radio" name="table-header-weight" value="bold" data-table-header-weight checked><span>BOLD</span></label>
                  </fieldset>
                </fieldset>
                <fieldset class="table-builder__style-group">
                  <legend>BORDER</legend>
                  <label class="table-builder__color-field">
                    <span>COLOR</span>
                    <span class="table-builder__color-control"><input type="color" value="#d9dfe8" aria-label="罫線の色" data-table-color-picker="borderColor"><input type="text" value="#d9dfe8" maxlength="7" spellcheck="false" aria-label="罫線の色コード" data-table-color-text="borderColor"></span>
                  </label>
                  <div class="table-builder__select-grid">
                    <label><span>WIDTH</span><select data-table-border-width><option value="0">0 PX</option><option value="1" selected>1 PX</option><option value="2">2 PX</option><option value="3">3 PX</option></select></label>
                    <label><span>STYLE</span><select data-table-border-style><option value="none">NONE</option><option value="solid" selected>SOLID</option><option value="dashed">DASHED</option><option value="dotted">DOTTED</option><option value="double">DOUBLE</option></select></label>
                  </div>
                </fieldset>
                <fieldset class="table-builder__style-group">
                  <legend>CELL</legend>
                  <fieldset class="table-builder__style-choice">
                    <legend>PADDING</legend>
                    <label><input type="radio" name="table-cell-padding" value="compact" data-table-cell-padding><span>COMPACT</span></label>
                    <label><input type="radio" name="table-cell-padding" value="standard" data-table-cell-padding checked><span>STANDARD</span></label>
                    <label><input type="radio" name="table-cell-padding" value="wide" data-table-cell-padding><span>WIDE</span></label>
                  </fieldset>
                  <label class="table-builder__responsive table-builder__stripe-toggle"><input type="checkbox" data-table-striped-rows><span>ROW STRIPE</span></label>
                  <label class="table-builder__color-field">
                    <span>STRIPE COLOR</span>
                    <span class="table-builder__color-control"><input type="color" value="#f8fafc" aria-label="交互行の背景色" data-table-color-picker="stripeBackground"><input type="text" value="#f8fafc" maxlength="7" spellcheck="false" aria-label="交互行の背景色コード" data-table-color-text="stripeBackground"></span>
                  </label>
                </fieldset>
              </div>
            </section>
          </div>
          <dl class="table-builder__metrics" aria-label="テーブルの集計結果">
            <div><dt>ROWS</dt><dd data-table-metric="rows">4</dd></div>
            <div><dt>COLUMNS</dt><dd data-table-metric="cols">4</dd></div>
            <div><dt>CELLS</dt><dd data-table-metric="cells">16</dd></div>
            <div><dt>HEADERS</dt><dd data-table-metric="headers">7</dd></div>
            <div><dt>CHARACTERS</dt><dd data-table-metric="characters">0</dd></div>
            <div><dt>WARNINGS</dt><dd data-table-metric="warnings">3</dd></div>
          </dl>
          <div class="table-builder__copy-actions">
            <button type="button" data-copy-table-html>COPY HTML</button>
            <button type="button" data-copy-table-css>COPY CSS</button>
            <button type="button" data-copy-table-all>COPY HTML + CSS</button>
          </div>
          <div class="table-builder__warnings" id="table-builder-warnings" aria-live="polite" data-table-warnings></div>
        </div>
      </div>`;

    const root = workspace.querySelector('.table-builder');
    const grid = workspace.querySelector('[data-table-grid]');
    const rowsInput = workspace.querySelector('[data-table-rows]');
    const colsInput = workspace.querySelector('[data-table-cols]');
    const captionInput = workspace.querySelector('[data-table-caption]');
    const preview = workspace.querySelector('[data-table-preview]');
    const previewStage = workspace.querySelector('[data-table-output="preview"]');
    const sourceStage = workspace.querySelector('[data-table-output="source"]');
    const sourceCode = workspace.querySelector('[data-table-source]');
    const inputState = workspace.querySelector('[data-table-input-state]');
    const dimensions = workspace.querySelector('[data-table-dimensions]');
    const outputState = workspace.querySelector('[data-table-output-state]');
    const outputSummary = workspace.querySelector('[data-table-output-summary]');
    const warnings = workspace.querySelector('[data-table-warnings]');
    const copyCssButton = workspace.querySelector('[data-copy-table-css]');
    const undoButton = workspace.querySelector('[data-table-history="undo"]');
    const redoButton = workspace.querySelector('[data-table-history="redo"]');
    let tableState = builder.createState();
    let settings = { ...builder.DEFAULT_SETTINGS };
    let currentResult = builder.generate(tableState, settings);
    let outputView = 'preview';
    let composingCell = null;
    let historyTimer = 0;
    let history = [];
    let historyIndex = -1;

    const snapshot = () => ({
      state: builder.cloneState(tableState),
      settings: { ...settings },
    });
    const snapshotKey = (item) => JSON.stringify([item.state.cells, item.settings]);
    const updateHistoryButtons = () => {
      undoButton.disabled = historyIndex <= 0;
      redoButton.disabled = historyIndex >= history.length - 1;
    };
    const captureHistory = () => {
      window.clearTimeout(historyTimer);
      historyTimer = 0;
      const next = snapshot();
      if (historyIndex >= 0 && snapshotKey(history[historyIndex]) === snapshotKey(next)) {
        updateHistoryButtons();
        return;
      }
      history = history.slice(0, historyIndex + 1);
      history.push(next);
      if (history.length > 50) history.shift();
      historyIndex = history.length - 1;
      updateHistoryButtons();
    };
    const scheduleHistory = () => {
      window.clearTimeout(historyTimer);
      historyTimer = window.setTimeout(captureHistory, 350);
    };

    const getSettings = () => ({
      headerMode: workspace.querySelector('[data-table-header-mode]:checked')?.value || 'top-left',
      caption: captionInput.value,
      captionVisibility: workspace.querySelector('[data-table-caption-visibility]:checked')?.value || 'visible',
      alignment: workspace.querySelector('[data-table-alignment]:checked')?.value || 'left',
      outputMode: workspace.querySelector('[data-table-output-mode]:checked')?.value || 'class',
      responsive: workspace.querySelector('[data-table-responsive]').checked,
      headerBackground: workspace.querySelector('[data-table-color-text="headerBackground"]').value,
      headerText: workspace.querySelector('[data-table-color-text="headerText"]').value,
      headerWeight: workspace.querySelector('[data-table-header-weight]:checked')?.value || 'bold',
      borderColor: workspace.querySelector('[data-table-color-text="borderColor"]').value,
      borderWidth: Number(workspace.querySelector('[data-table-border-width]').value),
      borderStyle: workspace.querySelector('[data-table-border-style]').value,
      cellPadding: workspace.querySelector('[data-table-cell-padding]:checked')?.value || 'standard',
      stripedRows: workspace.querySelector('[data-table-striped-rows]').checked,
      stripeBackground: workspace.querySelector('[data-table-color-text="stripeBackground"]').value,
    });

    const syncSettings = () => {
      captionInput.value = settings.caption;
      const selectors = [
        ['data-table-header-mode', settings.headerMode],
        ['data-table-caption-visibility', settings.captionVisibility],
        ['data-table-alignment', settings.alignment],
        ['data-table-output-mode', settings.outputMode],
        ['data-table-header-weight', settings.headerWeight],
        ['data-table-cell-padding', settings.cellPadding],
      ];
      selectors.forEach(([name, value]) => {
        const target = workspace.querySelector(`[${name}][value="${value}"]`);
        if (target) target.checked = true;
      });
      workspace.querySelector('[data-table-responsive]').checked = settings.responsive;
      workspace.querySelector('[data-table-striped-rows]').checked = settings.stripedRows;
      workspace.querySelector('[data-table-border-width]').value = String(settings.borderWidth);
      workspace.querySelector('[data-table-border-style]').value = settings.borderStyle;
      ['headerBackground', 'headerText', 'borderColor', 'stripeBackground'].forEach((keyName) => {
        const picker = workspace.querySelector(`[data-table-color-picker="${keyName}"]`);
        const textInput = workspace.querySelector(`[data-table-color-text="${keyName}"]`);
        picker.value = settings[keyName];
        textInput.value = settings[keyName];
        textInput.setAttribute('aria-invalid', 'false');
      });
    };

    const renderGrid = () => {
      rowsInput.value = tableState.rows;
      colsInput.value = tableState.cols;
      dimensions.textContent = `${tableState.rows} ROWS × ${tableState.cols} COLUMNS`;
      grid.style.setProperty('--table-cols', tableState.cols);
      grid.innerHTML = `<table class="table-builder__edit-table"><thead><tr><th scope="col"><span class="visually-hidden">行番号</span></th>${Array.from({ length: tableState.cols }, (_, colIndex) => `<th scope="col">${String(colIndex + 1).padStart(2, '0')}</th>`).join('')}</tr></thead><tbody>${tableState.cells.map((row, rowIndex) => `<tr><th scope="row">${String(rowIndex + 1).padStart(2, '0')}</th>${row.map((cell, colIndex) => `<td><label class="visually-hidden" for="table-cell-${rowIndex}-${colIndex}">${rowIndex + 1}行${colIndex + 1}列</label><input id="table-cell-${rowIndex}-${colIndex}" type="text" maxlength="${builder.MAX_CELL_LENGTH}" value="${escapeMarkup(cell)}" aria-describedby="table-grid-help" data-table-cell data-row="${rowIndex}" data-col="${colIndex}"></td>`).join('')}</tr>`).join('')}</tbody></table>`;
    };

    const renderWarnings = () => {
      if (currentResult.warningCount === 0) {
        warnings.hidden = true;
        warnings.innerHTML = '';
        return;
      }
      warnings.hidden = false;
      warnings.innerHTML = `<div class="table-builder__warnings-heading"><strong>TABLE WARNINGS</strong><span>${currentResult.warningCount} FOUND</span></div><ul>${currentResult.warnings.map((warning) => `<li><span>${escapeMarkup(warning.location)}</span><p>${escapeMarkup(warning.message)}</p></li>`).join('')}</ul>`;
    };

    const renderSource = () => {
      sourceCode.textContent = outputView === 'css' ? (currentResult.css || '/* CMS INLINEモードでは追加CSSは不要です。 */') : currentResult.html;
    };

    const renderOutput = () => {
      settings = { ...builder.normalizeSettings(getSettings()) };
      currentResult = builder.generate(tableState, settings);
      preview.srcdoc = builder.createPreviewDocument(currentResult);
      renderSource();
      const hasWarnings = currentResult.warningCount > 0;
      const isEmpty = currentResult.nonEmptyCellCount === 0;
      inputState.textContent = isEmpty ? 'EMPTY TABLE' : hasWarnings ? `${currentResult.warningCount} WARNINGS` : 'TABLE READY';
      inputState.dataset.state = isEmpty || hasWarnings ? 'invalid' : 'ready';
      outputState.textContent = hasWarnings ? `${currentResult.warningCount} WARNINGS` : outputView === 'preview' ? 'PREVIEW READY' : `${outputView.toUpperCase()} READY`;
      outputState.dataset.state = hasWarnings ? 'invalid' : 'ready';
      outputSummary.textContent = `${currentResult.nonEmptyCellCount} / ${tableState.rows * tableState.cols} CELLS`;
      const metrics = {
        rows: tableState.rows,
        cols: tableState.cols,
        cells: tableState.rows * tableState.cols,
        headers: currentResult.headerCount,
        characters: currentResult.characterCount,
        warnings: currentResult.warningCount,
      };
      Object.entries(metrics).forEach(([keyName, value]) => {
        const target = workspace.querySelector(`[data-table-metric="${keyName}"]`);
        if (target) target.textContent = value.toLocaleString('en-US');
      });
      copyCssButton.disabled = !currentResult.css;
      renderWarnings();
    };

    const renderAll = () => {
      syncSettings();
      renderGrid();
      renderOutput();
      updateHistoryButtons();
    };

    const setOutputView = (view) => {
      if (!['preview', 'html', 'css'].includes(view)) return;
      outputView = view;
      previewStage.hidden = view !== 'preview';
      sourceStage.hidden = view === 'preview';
      workspace.querySelectorAll('.table-builder__output-tabs [data-table-view]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.tableView === view)));
      renderSource();
      outputState.textContent = currentResult.warningCount ? `${currentResult.warningCount} WARNINGS` : view === 'preview' ? 'PREVIEW READY' : `${view.toUpperCase()} READY`;
    };

    const setMobileView = (view) => {
      if (!['editor', 'preview', 'html', 'css'].includes(view)) return;
      root.dataset.tableMobileView = view;
      workspace.querySelectorAll('.table-builder__mobile-tabs [data-table-view]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.tableView === view)));
      if (view !== 'editor') setOutputView(view);
    };

    const applyState = (nextState, nextSettings = settings, message = '') => {
      tableState = builder.cloneState(nextState);
      settings = { ...builder.normalizeSettings(nextSettings) };
      captureHistory();
      renderAll();
      if (message) showToast(message);
    };

    const restoreHistory = (nextIndex) => {
      window.clearTimeout(historyTimer);
      historyTimer = 0;
      if (nextIndex < 0 || nextIndex >= history.length) return;
      historyIndex = nextIndex;
      const item = history[historyIndex];
      tableState = builder.cloneState(item.state);
      settings = { ...item.settings };
      renderAll();
    };

    grid.addEventListener('compositionstart', (event) => {
      const cell = event.target.closest('[data-table-cell]');
      if (cell) composingCell = cell;
    });
    grid.addEventListener('compositionend', (event) => {
      const cell = event.target.closest('[data-table-cell]');
      if (!cell) return;
      composingCell = null;
      tableState = builder.setCell(tableState, Number(cell.dataset.row), Number(cell.dataset.col), cell.value);
      renderOutput();
      scheduleHistory();
    });
    grid.addEventListener('input', (event) => {
      const cell = event.target.closest('[data-table-cell]');
      if (!cell || composingCell === cell || event.isComposing) return;
      tableState = builder.setCell(tableState, Number(cell.dataset.row), Number(cell.dataset.col), cell.value);
      renderOutput();
      scheduleHistory();
    });
    grid.addEventListener('paste', (event) => {
      const cell = event.target.closest('[data-table-cell]');
      const text = event.clipboardData?.getData('text/plain') || '';
      if (!cell || !/[\t\r\n]/u.test(text)) return;
      event.preventDefault();
      const pasted = builder.applyGridPaste(tableState, Number(cell.dataset.row), Number(cell.dataset.col), text);
      tableState = pasted.state;
      captureHistory();
      renderGrid();
      renderOutput();
      workspace.querySelector(`[data-table-cell][data-row="${cell.dataset.row}"][data-col="${cell.dataset.col}"]`)?.focus();
      showToast(pasted.truncated ? 'PASTE TRUNCATED AT LIMIT' : `${pasted.appliedCells} CELLS PASTED`);
    });

    workspace.querySelector('[data-table-resize]').addEventListener('click', () => {
      applyState(builder.resizeState(tableState, rowsInput.value, colsInput.value), settings, 'TABLE SIZE UPDATED');
    });
    workspace.querySelector('[data-table-sample]').addEventListener('click', () => {
      const template = builder.getTemplate('size');
      applyState(template.state, template.settings, 'SAMPLE LOADED');
    });
    workspace.querySelector('[data-table-clear]').addEventListener('click', () => applyState(builder.clearState(tableState), settings, RESET_TOAST_MESSAGE));
    workspace.querySelectorAll('[data-table-template]').forEach((button) => button.addEventListener('click', () => {
      const template = builder.getTemplate(button.dataset.tableTemplate);
      applyState(template.state, template.settings, `${template.label} LOADED`);
    }));
    workspace.querySelectorAll('[data-table-action]').forEach((button) => button.addEventListener('click', () => {
      const actions = {
        'add-row': builder.addRow,
        'remove-row': builder.removeRow,
        'add-col': builder.addColumn,
        'remove-col': builder.removeColumn,
      };
      const action = actions[button.dataset.tableAction];
      if (action) applyState(action(tableState), settings, 'TABLE STRUCTURE UPDATED');
    }));
    workspace.querySelectorAll('[data-table-history]').forEach((button) => button.addEventListener('click', () => {
      if (historyTimer) captureHistory();
      restoreHistory(historyIndex + (button.dataset.tableHistory === 'undo' ? -1 : 1));
    }));
    captionInput.addEventListener('input', () => {
      settings = { ...builder.normalizeSettings(getSettings()) };
      renderOutput();
      scheduleHistory();
    });
    workspace.querySelectorAll('[data-table-header-mode], [data-table-caption-visibility], [data-table-alignment], [data-table-output-mode], [data-table-responsive], [data-table-header-weight], [data-table-border-width], [data-table-border-style], [data-table-cell-padding], [data-table-striped-rows]').forEach((control) => control.addEventListener('change', () => {
      settings = { ...builder.normalizeSettings(getSettings()) };
      syncSettings();
      captureHistory();
      renderOutput();
    }));
    workspace.querySelectorAll('[data-table-color-picker]').forEach((input) => {
      input.addEventListener('input', () => {
        const textInput = workspace.querySelector(`[data-table-color-text="${input.dataset.tableColorPicker}"]`);
        textInput.value = input.value;
        textInput.setAttribute('aria-invalid', 'false');
        settings = { ...builder.normalizeSettings(getSettings()) };
        renderOutput();
        scheduleHistory();
      });
    });
    workspace.querySelectorAll('[data-table-color-text]').forEach((input) => {
      input.addEventListener('input', () => {
        const isValid = builder.isValidHexColor(input.value);
        input.setAttribute('aria-invalid', String(!isValid));
        if (!isValid) return;
        const picker = workspace.querySelector(`[data-table-color-picker="${input.dataset.tableColorText}"]`);
        picker.value = builder.normalizeHexColor(input.value);
        settings = { ...builder.normalizeSettings(getSettings()) };
        renderOutput();
        scheduleHistory();
      });
      input.addEventListener('change', () => {
        if (!builder.isValidHexColor(input.value)) {
          syncSettings();
          return;
        }
        settings = { ...builder.normalizeSettings(getSettings()) };
        syncSettings();
        captureHistory();
        renderOutput();
      });
    });
    workspace.querySelector('[data-table-style-reset]').addEventListener('click', () => {
      settings = { ...builder.normalizeSettings({ ...getSettings(), ...builder.DEFAULT_STYLE_SETTINGS }) };
      syncSettings();
      captureHistory();
      renderOutput();
      showToast('スタイルを初期化しました。');
    });
    workspace.querySelectorAll('[data-table-preview-width]').forEach((control) => control.addEventListener('change', () => {
      previewStage.dataset.previewWidth = workspace.querySelector('[data-table-preview-width]:checked')?.value || 'auto';
    }));
    workspace.querySelectorAll('[data-table-view]').forEach((button) => button.addEventListener('click', () => {
      if (button.closest('.table-builder__mobile-tabs')) setMobileView(button.dataset.tableView);
      else setOutputView(button.dataset.tableView);
    }));
    workspace.querySelector('[data-copy-table-html]').addEventListener('click', () => copyText(currentResult.html));
    copyCssButton.addEventListener('click', () => copyText(currentResult.css));
    workspace.querySelector('[data-copy-table-all]').addEventListener('click', () => copyText(currentResult.combined));

    captureHistory();
    setOutputView('preview');
    renderAll();
    window.addEventListener('pageshow', renderOutput, { once: true });
  };

  const renderBemClassBuilder = () => {
    const builder = window.MarkBenchBemClassBuilder;
    if (!builder) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; bem class builder module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    const categoryOptions = Object.entries(builder.CATEGORY_DEFINITIONS)
      .map(([categoryKey, item]) => `<option value="${categoryKey}">${item.label} / ${item.labelJa}</option>`)
      .join('');

    workspace.innerHTML = `
      <div class="bem-builder">
        <div class="workspace-grid workspace-grid--bem-builder">
          <section class="workspace-panel bem-builder__input-pane" aria-label="BEMクラス名入力">
            <div class="workspace-panel__header"><span>INPUT / BEM PARTS</span><div class="workspace-actions"><button class="workspace-action" type="button" data-bem-sample>SAMPLE</button><button class="workspace-action" type="button" data-bem-clear disabled>CLEAR</button></div></div>
            <div class="bem-builder__discovery">
              <label class="bem-builder__select" for="bem-category"><span>CATEGORY</span><select id="bem-category" data-bem-category>${categoryOptions}</select></label>
              <label class="bem-builder__search" for="bem-search"><span>SEARCH CANDIDATES</span><input id="bem-search" type="search" maxlength="80" autocomplete="off" placeholder="例：見出し / title" data-bem-search></label>
            </div>
            <div class="bem-builder__fields">
              <label for="bem-block"><span>BLOCK <b>REQUIRED</b></span><input id="bem-block" type="text" maxlength="160" autocomplete="off" placeholder="card" data-bem-input="block"></label>
              <label for="bem-element"><span>ELEMENT <b>OPTIONAL</b></span><input id="bem-element" type="text" maxlength="160" autocomplete="off" placeholder="title" data-bem-input="element"></label>
              <label for="bem-modifier"><span>MODIFIER <b>OPTIONAL</b></span><input id="bem-modifier" type="text" maxlength="160" autocomplete="off" placeholder="featured" data-bem-input="modifier"></label>
            </div>
            <div class="bem-builder__suggestions" data-bem-suggestions></div>
            <div class="workspace-panel__footer"><span data-bem-input-state data-state="empty" aria-live="polite">BLOCK REQUIRED</span><span data-bem-candidate-count>0 CANDIDATES</span></div>
          </section>
          <section class="workspace-panel bem-builder__output-pane" aria-label="BEMクラス名出力">
            <div class="workspace-panel__header"><span>OUTPUT / BEM PREVIEW</span><span data-bem-output-heading>EMPTY</span></div>
            <div class="bem-builder__structure" aria-label="BEM構造" data-bem-structure>
              <span class="bem-builder__structure-empty">BLOCKを入力してください。</span>
            </div>
            <dl class="bem-builder__outputs">
              <div><dt>CLASS LIST</dt><dd><code data-bem-output="classList">—</code></dd></div>
              <div><dt>SELECTOR</dt><dd><code data-bem-output="selector">—</code></dd></div>
              <div><dt>CLASS ATTRIBUTE</dt><dd><code data-bem-output="attribute">—</code></dd></div>
              <div class="bem-builder__output-css"><dt>CSS SKELETON</dt><dd><pre><code data-bem-output="css">—</code></pre></dd></div>
            </dl>
            <div class="workspace-panel__footer"><span data-bem-output-state data-state="empty" aria-live="polite">EMPTY</span><span data-bem-output-summary>0 CLASSES / 0 CHARACTERS</span></div>
          </section>
          <dl class="bem-builder__metrics" aria-label="BEM命名の集計結果">
            <div><dt>STRUCTURE</dt><dd data-bem-metric="structure">EMPTY</dd></div>
            <div><dt>CLASS COUNT</dt><dd data-bem-metric="classCount">0</dd></div>
            <div><dt>CHAR COUNT</dt><dd data-bem-metric="characterCount">0</dd></div>
            <div><dt>NORMALIZED</dt><dd data-bem-metric="normalized">NO</dd></div>
            <div><dt>WARNINGS</dt><dd data-bem-metric="warnings">0</dd></div>
            <div><dt>STATUS</dt><dd data-bem-metric="status">EMPTY</dd></div>
          </dl>
          <div class="bem-builder__copy-actions" aria-label="BEM出力のコピー操作">
            <button type="button" data-copy-bem="classList" disabled>COPY CLASS</button>
            <button type="button" data-copy-bem="selector" disabled>COPY SELECTOR</button>
            <button type="button" data-copy-bem="attribute" disabled>COPY ATTRIBUTE</button>
            <button type="button" data-copy-bem="css" disabled>COPY CSS</button>
          </div>
          <section class="bem-builder__warnings" data-bem-warnings hidden aria-labelledby="bem-warnings-title">
            <div class="bem-builder__warnings-heading"><strong id="bem-warnings-title">NAMING REVIEW</strong><span data-bem-warning-count>0 ISSUES</span></div>
            <ul data-bem-warning-list></ul>
          </section>
        </div>
      </div>`;

    const categorySelect = workspace.querySelector('[data-bem-category]');
    const searchInput = workspace.querySelector('[data-bem-search]');
    const inputs = Object.fromEntries([...workspace.querySelectorAll('[data-bem-input]')].map((input) => [input.dataset.bemInput, input]));
    const suggestionRoot = workspace.querySelector('[data-bem-suggestions]');
    const inputState = workspace.querySelector('[data-bem-input-state]');
    const candidateCount = workspace.querySelector('[data-bem-candidate-count]');
    const outputState = workspace.querySelector('[data-bem-output-state]');
    const outputSummary = workspace.querySelector('[data-bem-output-summary]');
    const outputHeading = workspace.querySelector('[data-bem-output-heading]');
    const structure = workspace.querySelector('[data-bem-structure]');
    const warningsRoot = workspace.querySelector('[data-bem-warnings]');
    const warningList = workspace.querySelector('[data-bem-warning-list]');
    const warningCount = workspace.querySelector('[data-bem-warning-count]');
    const clearButton = workspace.querySelector('[data-bem-clear]');
    const copyButtons = [...workspace.querySelectorAll('[data-copy-bem]')];
    let currentResult = builder.generate({});

    const getInput = () => ({
      block: inputs.block.value,
      element: inputs.element.value,
      modifier: inputs.modifier.value,
    });

    const renderSuggestions = () => {
      const suggestions = builder.searchSuggestions(categorySelect.value, searchInput.value);
      const groups = [
        ['block', 'BLOCK', suggestions.blocks],
        ['element', 'ELEMENT', suggestions.elements],
        ['modifier', 'MODIFIER', suggestions.modifiers],
      ];
      const count = groups.reduce((sum, [, , items]) => sum + items.length, 0);
      suggestionRoot.innerHTML = groups.map(([kind, label, items]) => `
        <section class="bem-builder__suggestion-group" aria-labelledby="bem-suggestions-${kind}">
          <div class="bem-builder__suggestion-heading"><h3 id="bem-suggestions-${kind}">${label}</h3><span>${String(items.length).padStart(2, '0')}</span></div>
          <div class="bem-builder__suggestion-list">${items.length ? items.map((item) => `<button type="button" data-bem-suggestion="${kind}" data-bem-value="${item.value}">${item.value}</button>`).join('') : '<p>NO MATCH</p>'}</div>
        </section>`).join('');
      candidateCount.textContent = `${String(count).padStart(2, '0')} CANDIDATES`;
    };

    const renderResult = () => {
      currentResult = builder.generate(getInput());
      const issueParts = new Set(currentResult.warnings.filter((warning) => warning.severity === 'error').map((warning) => warning.part.toLowerCase()));
      Object.entries(inputs).forEach(([part, input]) => input.setAttribute('aria-invalid', String(issueParts.has(part))));

      const outputMap = {
        classList: currentResult.classList,
        selector: currentResult.selector,
        attribute: currentResult.attribute,
        css: currentResult.css,
      };
      Object.entries(outputMap).forEach(([name, value]) => {
        const element = workspace.querySelector(`[data-bem-output="${name}"]`);
        if (element) element.textContent = value || '—';
      });

      structure.innerHTML = currentResult.parts.block ? `
        <span class="bem-builder__structure-part"><small>BLOCK</small>${escapeMarkup(currentResult.parts.block)}</span>
        ${currentResult.parts.element ? `<span class="bem-builder__delimiter" aria-hidden="true">__</span><span class="bem-builder__structure-part"><small>ELEMENT</small>${escapeMarkup(currentResult.parts.element)}</span>` : ''}
        ${currentResult.parts.modifier ? `<span class="bem-builder__delimiter" aria-hidden="true">--</span><span class="bem-builder__structure-part"><small>MODIFIER</small>${escapeMarkup(currentResult.parts.modifier)}</span>` : ''}` : '<span class="bem-builder__structure-empty">BLOCKを入力してください。</span>';

      const displayStatus = currentResult.errorCount ? 'INVALID' : currentResult.warningCount ? `${currentResult.warningCount} WARNING${currentResult.warningCount === 1 ? '' : 'S'}` : currentResult.status;
      const state = currentResult.errorCount ? 'invalid' : currentResult.className ? 'ready' : 'empty';
      inputState.textContent = currentResult.errorCount ? `${currentResult.errorCount} INPUT ERROR${currentResult.errorCount === 1 ? '' : 'S'}` : currentResult.className ? 'INPUT READY' : 'BLOCK REQUIRED';
      inputState.dataset.state = state;
      outputState.textContent = displayStatus;
      outputState.dataset.state = state;
      outputHeading.textContent = currentResult.structure;
      outputSummary.textContent = `${currentResult.classCount} CLASS${currentResult.classCount === 1 ? '' : 'ES'} / ${currentResult.characterCount} CHARACTERS`;

      const metrics = {
        structure: currentResult.structure,
        classCount: currentResult.classCount,
        characterCount: currentResult.characterCount,
        normalized: currentResult.normalized ? 'YES' : 'NO',
        warnings: currentResult.warnings.length,
        status: currentResult.status,
      };
      Object.entries(metrics).forEach(([name, value]) => {
        const element = workspace.querySelector(`[data-bem-metric="${name}"]`);
        if (element) element.textContent = String(value);
      });

      copyButtons.forEach((button) => { button.disabled = !currentResult.isValid || !outputMap[button.dataset.copyBem]; });
      clearButton.disabled = !inputs.block.value && !inputs.element.value && !inputs.modifier.value && !searchInput.value;

      warningsRoot.hidden = currentResult.warnings.length === 0;
      warningCount.textContent = `${currentResult.warnings.length} ISSUE${currentResult.warnings.length === 1 ? '' : 'S'}`;
      warningList.innerHTML = currentResult.warnings.map((warning) => `<li><span>${warning.severity.toUpperCase()} / ${escapeMarkup(warning.part)}</span><p>${escapeMarkup(warning.message)}</p></li>`).join('');
    };

    const renderAll = () => {
      renderSuggestions();
      renderResult();
    };

    Object.values(inputs).forEach((input) => input.addEventListener('input', renderResult));
    categorySelect.addEventListener('change', renderSuggestions);
    searchInput.addEventListener('input', () => {
      renderSuggestions();
      clearButton.disabled = !inputs.block.value && !inputs.element.value && !inputs.modifier.value && !searchInput.value;
    });
    suggestionRoot.addEventListener('click', (event) => {
      const button = event.target.closest('[data-bem-suggestion]');
      if (!button) return;
      const input = inputs[button.dataset.bemSuggestion];
      input.value = button.dataset.bemValue;
      renderResult();
      input.focus();
    });
    workspace.querySelector('[data-bem-sample]').addEventListener('click', () => {
      categorySelect.value = 'card';
      searchInput.value = '';
      inputs.block.value = 'card';
      inputs.element.value = 'title';
      inputs.modifier.value = 'featured';
      renderAll();
      inputs.block.focus();
    });
    clearButton.addEventListener('click', () => {
      Object.values(inputs).forEach((input) => { input.value = ''; });
      searchInput.value = '';
      renderAll();
      inputs.block.focus();
      showToast(RESET_TOAST_MESSAGE);
    });
    copyButtons.forEach((button) => button.addEventListener('click', () => copyText(currentResult[button.dataset.copyBem])));

    renderAll();
    window.addEventListener('pageshow', renderResult, { once: true });
  };

  const renderColorFormatConverter = () => {
    const converter = window.MarkBenchColorFormatConverter;
    if (!converter) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; color format converter module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    workspace.innerHTML = `
      <div class="color-converter">
        <div class="workspace-grid workspace-grid--color-converter">
          <section class="workspace-panel color-converter__input-pane" aria-label="カラー形式入力">
            <div class="workspace-panel__header"><span>INPUT / COLOR</span><div class="workspace-actions"><button class="workspace-action" type="button" data-color-sample>SAMPLE</button><button class="workspace-action" type="button" data-color-clear>CLEAR</button></div></div>
            <div class="color-converter__picker">
              <label for="color-native-picker"><span>COLOR PICKER</span><input id="color-native-picker" type="color" value="#4a6fa5" data-color-picker></label>
              <div class="color-converter__picker-value"><span>CURRENT COLOR</span><strong data-color-picker-value>#4A6FA5</strong></div>
            </div>
            <div class="color-converter__fields">
              <fieldset class="color-converter__field-group color-converter__field-group--hex">
                <legend>HEX</legend>
                <label for="color-hex"><span>HEX / HEX+A</span><input id="color-hex" type="text" value="#4A6FA5" inputmode="text" autocomplete="off" spellcheck="false" data-color-source="hex" data-color-field="hex"></label>
              </fieldset>
              <fieldset class="color-converter__field-group">
                <legend>RGB</legend>
                <label for="color-r"><span>R</span><input id="color-r" type="number" min="0" max="255" step="1" data-color-source="rgb" data-color-field="r"></label>
                <label for="color-g"><span>G</span><input id="color-g" type="number" min="0" max="255" step="1" data-color-source="rgb" data-color-field="g"></label>
                <label for="color-b"><span>B</span><input id="color-b" type="number" min="0" max="255" step="1" data-color-source="rgb" data-color-field="b"></label>
              </fieldset>
              <fieldset class="color-converter__field-group">
                <legend>HSL</legend>
                <label for="color-hsl-h"><span>H</span><input id="color-hsl-h" type="number" min="0" max="360" step="0.1" data-color-source="hsl" data-color-field="h"></label>
                <label for="color-hsl-s"><span>S %</span><input id="color-hsl-s" type="number" min="0" max="100" step="0.1" data-color-source="hsl" data-color-field="s"></label>
                <label for="color-hsl-l"><span>L %</span><input id="color-hsl-l" type="number" min="0" max="100" step="0.1" data-color-source="hsl" data-color-field="l"></label>
              </fieldset>
              <fieldset class="color-converter__field-group">
                <legend>HSV / HSB</legend>
                <label for="color-hsv-h"><span>H</span><input id="color-hsv-h" type="number" min="0" max="360" step="0.1" data-color-source="hsv" data-color-field="h"></label>
                <label for="color-hsv-s"><span>S %</span><input id="color-hsv-s" type="number" min="0" max="100" step="0.1" data-color-source="hsv" data-color-field="s"></label>
                <label for="color-hsv-v"><span>V %</span><input id="color-hsv-v" type="number" min="0" max="100" step="0.1" data-color-source="hsv" data-color-field="v"></label>
              </fieldset>
            </div>
            <div class="color-converter__alpha">
              <label for="color-alpha"><span>ALPHA / 0–1 OR 0–100%</span><input id="color-alpha" type="text" inputmode="decimal" value="1" autocomplete="off" spellcheck="false" data-color-alpha></label>
              <input type="range" min="0" max="1" step="0.01" value="1" aria-label="透明度" data-color-alpha-range>
              <output data-color-alpha-percent>100%</output>
            </div>
            <div class="workspace-panel__footer"><span data-color-input-state data-state="ready" aria-live="polite">INPUT READY</span><span data-color-source-label>SOURCE / SAMPLE</span></div>
          </section>
          <section class="workspace-panel color-converter__output-pane" aria-label="カラー変換結果">
            <div class="workspace-panel__header"><span>OUTPUT / FORMATS</span><span data-color-output-heading>READY</span></div>
            <div class="color-converter__preview">
              <div class="color-converter__swatch" data-color-swatch><span data-color-swatch-label>#4A6FA5</span></div>
              <div class="color-converter__contrast-grid">
                <div data-color-contrast="black"><span>BLACK TEXT</span><strong>Sample Aa あ</strong><small data-color-contrast-ratio="black">—</small></div>
                <div data-color-contrast="white"><span>WHITE TEXT</span><strong>Sample Aa あ</strong><small data-color-contrast-ratio="white">—</small></div>
              </div>
            </div>
            <dl class="color-converter__outputs">
              <div><dt>HEX</dt><dd data-color-output="hex">—</dd></div>
              <div><dt>HEX + ALPHA</dt><dd data-color-output="hexAlpha">—</dd></div>
              <div><dt>RGB(A)</dt><dd data-color-output="rgb">—</dd></div>
              <div><dt>HSL(A)</dt><dd data-color-output="hsl">—</dd></div>
              <div><dt>HSV / HSB</dt><dd data-color-output="hsv">—</dd></div>
              <div><dt>CSS VARIABLE</dt><dd data-color-output="cssVariable">—</dd></div>
            </dl>
            <div class="workspace-panel__footer"><span data-color-output-state data-state="ready" aria-live="polite">READY</span><span data-color-output-summary>WCAG / WHITE CANVAS</span></div>
          </section>
          <dl class="color-converter__metrics" aria-label="カラー変換の集計結果">
            <div><dt>SOURCE FORMAT</dt><dd data-color-metric="source">SAMPLE</dd></div>
            <div><dt>HEX</dt><dd data-color-metric="hex">#4A6FA5</dd></div>
            <div><dt>ALPHA</dt><dd data-color-metric="alpha">1</dd></div>
            <div><dt>LUMINANCE</dt><dd data-color-metric="luminance">—</dd></div>
            <div><dt>BEST TEXT</dt><dd data-color-metric="bestText">—</dd></div>
            <div><dt>STATUS</dt><dd data-color-metric="status">READY</dd></div>
          </dl>
          <section class="color-converter__history" aria-labelledby="color-history-title">
            <div class="color-converter__history-heading"><h3 id="color-history-title">RECENT COLORS</h3><span>SESSION ONLY / MAX 08</span></div>
            <div class="color-converter__history-list" data-color-history></div>
          </section>
          <div class="color-converter__copy-actions" aria-label="カラー形式のコピー操作">
            <button type="button" data-copy-color="hex">COPY HEX</button>
            <button type="button" data-copy-color="rgb">COPY RGB</button>
            <button type="button" data-copy-color="hsl">COPY HSL</button>
            <button type="button" data-copy-color="cssVariable">COPY CSS VARIABLE</button>
          </div>
          <section class="color-converter__errors" data-color-errors hidden aria-labelledby="color-errors-title">
            <div class="color-converter__errors-heading"><strong id="color-errors-title">INPUT REVIEW</strong><span data-color-error-count>0 ISSUES</span></div>
            <ul data-color-error-list></ul>
          </section>
        </div>
      </div>`;

    const sourceInputs = [...workspace.querySelectorAll('[data-color-source]')];
    const sourceGroups = sourceInputs.reduce((groups, input) => {
      const source = input.dataset.colorSource;
      groups[source] = [...(groups[source] || []), input];
      return groups;
    }, {});
    const alphaInput = workspace.querySelector('[data-color-alpha]');
    const alphaRange = workspace.querySelector('[data-color-alpha-range]');
    const alphaPercent = workspace.querySelector('[data-color-alpha-percent]');
    const picker = workspace.querySelector('[data-color-picker]');
    const pickerValue = workspace.querySelector('[data-color-picker-value]');
    const swatch = workspace.querySelector('[data-color-swatch]');
    const swatchLabel = workspace.querySelector('[data-color-swatch-label]');
    const inputState = workspace.querySelector('[data-color-input-state]');
    const sourceLabel = workspace.querySelector('[data-color-source-label]');
    const outputState = workspace.querySelector('[data-color-output-state]');
    const outputHeading = workspace.querySelector('[data-color-output-heading]');
    const outputSummary = workspace.querySelector('[data-color-output-summary]');
    const clearButton = workspace.querySelector('[data-color-clear]');
    const copyButtons = [...workspace.querySelectorAll('[data-copy-color]')];
    const errorsRoot = workspace.querySelector('[data-color-errors]');
    const errorList = workspace.querySelector('[data-color-error-list]');
    const errorCount = workspace.querySelector('[data-color-error-count]');
    const historyRoot = workspace.querySelector('[data-color-history]');
    let currentResult = converter.createResult(converter.DEFAULT_COLOR, 'SAMPLE');
    let history = converter.addToHistory([], converter.DEFAULT_COLOR);
    let hasColor = true;

    const fieldsFor = (source) => Object.fromEntries((sourceGroups[source] || []).map((input) => [input.dataset.colorField, input]));
    const fieldGroups = {
      hex: fieldsFor('hex'),
      rgb: fieldsFor('rgb'),
      hsl: fieldsFor('hsl'),
      hsv: fieldsFor('hsv'),
    };

    const getValues = (source) => ({
      ...Object.fromEntries(Object.entries(fieldGroups[source] || {}).map(([name, input]) => [name, input.value])),
      alpha: alphaInput.value,
    });

    const setGroupValues = (source, values) => {
      if (!fieldGroups[source]) return;
      Object.entries(values).forEach(([name, value]) => {
        if (fieldGroups[source][name]) fieldGroups[source][name].value = value;
      });
    };

    const syncInputs = (skipSource = '') => {
      const { color, hsl, hsv, outputs } = currentResult;
      if (skipSource !== 'hex') setGroupValues('hex', { hex: color.a < 1 ? outputs.hexAlpha : outputs.hex });
      if (skipSource !== 'rgb') setGroupValues('rgb', { r: color.r, g: color.g, b: color.b });
      if (skipSource !== 'hsl') setGroupValues('hsl', { h: converter.formatNumber(hsl.h), s: converter.formatNumber(hsl.s), l: converter.formatNumber(hsl.l) });
      if (skipSource !== 'hsv') setGroupValues('hsv', { h: converter.formatNumber(hsv.h), s: converter.formatNumber(hsv.s), v: converter.formatNumber(hsv.v) });
      alphaInput.value = converter.formatNumber(color.a, 3);
      alphaRange.value = String(color.a);
      alphaPercent.value = `${Math.round(color.a * 100)}%`;
      picker.value = outputs.hex.toLowerCase();
      pickerValue.textContent = outputs.hex;
    };

    const setCopyState = (enabled) => copyButtons.forEach((button) => { button.disabled = !enabled; });

    const clearInvalidState = () => {
      sourceInputs.forEach((input) => input.setAttribute('aria-invalid', 'false'));
      alphaInput.setAttribute('aria-invalid', 'false');
      errorsRoot.hidden = true;
      errorList.innerHTML = '';
    };

    const renderErrors = (errors, source = '') => {
      clearInvalidState();
      errors.forEach((error) => {
        const matchingInputs = sourceInputs.filter((input) => input.dataset.colorField === error.field && (!source || input.dataset.colorSource === source.toLowerCase()));
        matchingInputs.forEach((input) => input.setAttribute('aria-invalid', 'true'));
        if (error.field === 'alpha') alphaInput.setAttribute('aria-invalid', 'true');
      });
      errorsRoot.hidden = errors.length === 0;
      errorCount.textContent = `${errors.length} ISSUE${errors.length === 1 ? '' : 'S'}`;
      errorList.innerHTML = errors.map((error) => `<li><span>${escapeMarkup(error.type)}</span><p>${escapeMarkup(error.message)}</p></li>`).join('');
    };

    const renderHistory = () => {
      historyRoot.innerHTML = history.map((value) => {
        const color = converter.parseHex(value);
        return `<button type="button" data-color-history-value="${value}" aria-label="${value}を使用"><i style="--history-color: rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})"></i><span>${value}</span></button>`;
      }).join('');
    };

    const renderValid = () => {
      clearInvalidState();
      hasColor = true;
      const { color, outputs, metrics, source } = currentResult;
      const composite = converter.compositeOver(color, converter.WHITE);
      const background = `rgb(${composite.r} ${composite.g} ${composite.b})`;
      swatch.style.setProperty('--swatch-color', `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`);
      swatchLabel.textContent = color.a < 1 ? outputs.hexAlpha : outputs.hex;
      workspace.querySelectorAll('[data-color-contrast]').forEach((tile) => {
        tile.style.backgroundColor = background;
        tile.style.color = tile.dataset.colorContrast === 'black' ? '#000000' : '#ffffff';
      });
      const contrastValues = { black: metrics.blackContrast, white: metrics.whiteContrast };
      Object.entries(contrastValues).forEach(([name, ratio]) => {
        const element = workspace.querySelector(`[data-color-contrast-ratio="${name}"]`);
        element.textContent = `${ratio}:1 / ${ratio >= 4.5 ? 'AA PASS' : 'AA FAIL'}`;
      });
      Object.entries(outputs).forEach(([name, value]) => {
        const output = workspace.querySelector(`[data-color-output="${name}"]`);
        if (output) output.textContent = value;
      });
      const metricValues = {
        source,
        hex: color.a < 1 ? outputs.hexAlpha : outputs.hex,
        alpha: metrics.alpha,
        luminance: metrics.luminance,
        bestText: `${metrics.bestText} / ${metrics.bestContrast}:1`,
        status: metrics.normalText,
      };
      Object.entries(metricValues).forEach(([name, value]) => {
        const element = workspace.querySelector(`[data-color-metric="${name}"]`);
        if (element) element.textContent = String(value);
      });
      inputState.textContent = 'INPUT READY';
      inputState.dataset.state = 'ready';
      sourceLabel.textContent = `SOURCE / ${source}`;
      outputState.textContent = 'READY';
      outputState.dataset.state = 'ready';
      outputHeading.textContent = 'READY';
      outputSummary.textContent = `${metrics.bestText} TEXT / ${metrics.normalText} / WHITE CANVAS`;
      clearButton.disabled = false;
      setCopyState(true);
    };

    const renderInvalid = (result) => {
      renderErrors(result.errors, result.source);
      inputState.textContent = `${result.errors.length} INPUT ERROR${result.errors.length === 1 ? '' : 'S'}`;
      inputState.dataset.state = 'invalid';
      sourceLabel.textContent = `SOURCE / ${result.source || 'UNKNOWN'}`;
      outputState.textContent = 'INVALID';
      outputState.dataset.state = 'invalid';
      outputHeading.textContent = 'INVALID';
      outputSummary.textContent = 'FIX INPUT TO CONTINUE';
      workspace.querySelector('[data-color-metric="status"]').textContent = 'INVALID';
      setCopyState(false);
    };

    const renderEmpty = () => {
      clearInvalidState();
      currentResult = converter.createResult({ ...converter.DEFAULT_COLOR, a: 1 }, 'EMPTY');
      hasColor = false;
      sourceInputs.forEach((input) => { input.value = ''; });
      alphaInput.value = '1';
      alphaRange.value = '1';
      alphaPercent.value = '100%';
      picker.value = '#000000';
      pickerValue.textContent = '—';
      swatch.style.setProperty('--swatch-color', 'transparent');
      swatchLabel.textContent = 'NO COLOR';
      workspace.querySelectorAll('[data-color-output]').forEach((output) => { output.textContent = '—'; });
      workspace.querySelectorAll('[data-color-contrast-ratio]').forEach((output) => { output.textContent = '—'; });
      workspace.querySelectorAll('[data-color-metric]').forEach((output) => { output.textContent = output.dataset.colorMetric === 'status' ? 'EMPTY' : '—'; });
      inputState.textContent = 'COLOR REQUIRED';
      inputState.dataset.state = 'empty';
      sourceLabel.textContent = 'SOURCE / NONE';
      outputState.textContent = 'EMPTY';
      outputState.dataset.state = 'empty';
      outputHeading.textContent = 'EMPTY';
      outputSummary.textContent = 'ENTER A COLOR';
      clearButton.disabled = true;
      setCopyState(false);
    };

    const updateFromSource = (source, commit = false) => {
      const result = converter.convert(source, getValues(source));
      if (!result.valid) {
        renderInvalid(result);
        return;
      }
      currentResult = result;
      syncInputs(source);
      renderValid();
      if (commit) {
        history = converter.addToHistory(history, currentResult.color);
        renderHistory();
      }
    };

    const updateAlpha = (value, commit = false) => {
      const parsedAlpha = converter.parseAlpha(value);
      if (parsedAlpha === null || !hasColor) {
        renderInvalid({ source: currentResult.source, errors: [{ type: 'ALPHA_RANGE', field: 'alpha', message: 'ALPHAは0〜1、または0〜100%で入力してください。' }] });
        return;
      }
      currentResult = converter.createResult({ ...currentResult.color, a: parsedAlpha }, 'ALPHA');
      syncInputs();
      renderValid();
      if (commit) {
        history = converter.addToHistory(history, currentResult.color);
        renderHistory();
      }
    };

    sourceInputs.forEach((input) => {
      input.addEventListener('input', () => updateFromSource(input.dataset.colorSource));
      input.addEventListener('change', () => updateFromSource(input.dataset.colorSource, true));
    });
    alphaInput.addEventListener('input', () => updateAlpha(alphaInput.value));
    alphaInput.addEventListener('change', () => updateAlpha(alphaInput.value, true));
    alphaRange.addEventListener('input', () => {
      alphaInput.value = alphaRange.value;
      updateAlpha(alphaRange.value);
    });
    alphaRange.addEventListener('change', () => updateAlpha(alphaRange.value, true));
    picker.addEventListener('input', () => {
      currentResult = converter.createResult({ ...converter.parseHex(picker.value), a: currentResult.color.a }, 'PICKER');
      syncInputs();
      renderValid();
    });
    picker.addEventListener('change', () => {
      history = converter.addToHistory(history, currentResult.color);
      renderHistory();
    });
    workspace.querySelector('[data-color-sample]').addEventListener('click', () => {
      currentResult = converter.createResult(converter.DEFAULT_COLOR, 'SAMPLE');
      syncInputs();
      renderValid();
      history = converter.addToHistory(history, currentResult.color);
      renderHistory();
      fieldGroups.hex.hex.focus();
    });
    clearButton.addEventListener('click', () => {
      renderEmpty();
      fieldGroups.hex.hex.focus();
      showToast(RESET_TOAST_MESSAGE);
    });
    historyRoot.addEventListener('click', (event) => {
      const button = event.target.closest('[data-color-history-value]');
      if (!button) return;
      currentResult = converter.createResult(converter.parseHex(button.dataset.colorHistoryValue), 'HISTORY');
      syncInputs();
      renderValid();
      history = converter.addToHistory(history, currentResult.color);
      renderHistory();
    });
    copyButtons.forEach((button) => button.addEventListener('click', () => {
      const name = button.dataset.copyColor;
      const value = name === 'hex' && currentResult.color.a < 1 ? currentResult.outputs.hexAlpha : currentResult.outputs[name];
      copyText(value);
    }));

    syncInputs();
    renderValid();
    renderHistory();
    window.addEventListener('pageshow', () => {
      if (hasColor) {
        syncInputs();
        renderValid();
      }
    }, { once: true });
  };

  const renderUnitConverter = () => {
    const converter = window.MarkBenchPxRemConverter;
    if (!converter) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; px / rem converter module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }

    workspace.innerHTML = `
      <div class="workspace-grid workspace-grid--unit">
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>INPUT / CSS VALUE</span><div class="workspace-actions"><button class="workspace-action" type="button" data-sample>SAMPLE</button><button class="workspace-action" type="button" data-clear disabled>CLEAR</button></div></div>
          <div class="unit-fields">
            <label class="unit-field" for="unit-value"><span>VALUE</span><span class="unit-field__control"><input id="unit-value" type="text" inputmode="decimal" maxlength="24" autocomplete="off" placeholder="32" aria-describedby="unit-input-status" data-unit-value><i data-unit-input-suffix>PX</i></span></label>
            <label class="unit-field" for="unit-root"><span>ROOT FONT SIZE</span><span class="unit-field__control"><input id="unit-root" type="text" inputmode="decimal" maxlength="8" autocomplete="off" value="${converter.DEFAULT_ROOT_SIZE}" aria-describedby="unit-input-status" data-unit-root><i>PX</i></span></label>
          </div>
          <div class="unit-options" aria-label="変換オプション">
            <fieldset class="unit-option-group">
              <legend>CONVERSION</legend>
              <label><input type="radio" name="unit-direction" value="px-to-rem" data-unit-direction checked><span>PX → REM</span></label>
              <label><input type="radio" name="unit-direction" value="rem-to-px" data-unit-direction><span>REM → PX</span></label>
            </fieldset>
            <fieldset class="unit-option-group">
              <legend>PRECISION</legend>
              <label><input type="radio" name="unit-precision" value="auto" data-unit-precision checked><span>AUTO</span></label>
              <label><input type="radio" name="unit-precision" value="2" data-unit-precision><span>2 DEC</span></label>
              <label><input type="radio" name="unit-precision" value="4" data-unit-precision><span>4 DEC</span></label>
            </fieldset>
          </div>
          <div class="workspace-panel__footer" id="unit-input-status"><span data-unit-input-state data-state="empty" aria-live="polite">INPUT EMPTY</span><span>RANGE ±${converter.MAX_ABSOLUTE_VALUE.toLocaleString('en-US')}</span></div>
        </div>
        <div class="workspace-panel">
          <div class="workspace-panel__header"><span>OUTPUT / CONVERTED VALUE</span><button class="workspace-action" type="button" data-copy-unit disabled>COPY OUTPUT</button></div>
          <div class="unit-result" data-unit-result data-state="empty"><output aria-live="polite" data-unit-output>—</output><p data-unit-formula>数値を入力すると計算式を表示します。</p></div>
          <div class="workspace-panel__footer"><span data-unit-output-state data-state="empty">OUTPUT EMPTY</span><span data-unit-summary>ROOT 16PX / AUTO</span></div>
        </div>
      </div>`;

    const valueInput = workspace.querySelector('[data-unit-value]');
    const rootInput = workspace.querySelector('[data-unit-root]');
    const inputSuffix = workspace.querySelector('[data-unit-input-suffix]');
    const inputState = workspace.querySelector('[data-unit-input-state]');
    const result = workspace.querySelector('[data-unit-result]');
    const output = workspace.querySelector('[data-unit-output]');
    const formula = workspace.querySelector('[data-unit-formula]');
    const outputState = workspace.querySelector('[data-unit-output-state]');
    const summary = workspace.querySelector('[data-unit-summary]');
    const clearButton = workspace.querySelector('[data-clear]');
    const copyButton = workspace.querySelector('[data-copy-unit]');
    let currentResult = converter.convert('');

    const getOptions = () => ({
      direction: workspace.querySelector('[data-unit-direction]:checked')?.value || 'px-to-rem',
      precision: workspace.querySelector('[data-unit-precision]:checked')?.value || 'auto',
      rootSize: rootInput.value,
    });

    const renderResult = () => {
      const options = getOptions();
      currentResult = converter.convert(valueInput.value, options);
      const directionLabel = options.direction === 'rem-to-px' ? 'REM → PX' : 'PX → REM';
      const precisionLabel = options.precision === 'auto' ? 'AUTO' : `${options.precision} DEC`;
      const rootLabel = rootInput.value.trim() || '—';
      const isValid = currentResult.status === 'valid';
      const isEmpty = currentResult.status === 'empty';
      const stateLabel = isValid
        ? 'READY'
        : isEmpty
          ? 'INPUT EMPTY'
          : currentResult.status === 'invalid-root'
            ? 'ROOT SIZE OUT OF RANGE'
            : 'INVALID VALUE';
      const helpText = currentResult.status === 'invalid-root'
        ? `ルートフォントサイズは${converter.MIN_ROOT_SIZE}〜${converter.MAX_ROOT_SIZE}pxで入力してください。`
        : currentResult.status === 'invalid-value'
          ? `数値は±${converter.MAX_ABSOLUTE_VALUE.toLocaleString('en-US')}以内で入力してください。`
          : '数値を入力すると計算式を表示します。';

      inputSuffix.textContent = options.direction === 'rem-to-px' ? 'REM' : 'PX';
      valueInput.setAttribute('aria-invalid', currentResult.status === 'invalid-value' ? 'true' : 'false');
      rootInput.setAttribute('aria-invalid', currentResult.status === 'invalid-root' ? 'true' : 'false');
      inputState.textContent = stateLabel;
      inputState.dataset.state = isValid ? 'ready' : isEmpty ? 'empty' : 'invalid';
      result.dataset.state = isValid ? 'valid' : isEmpty ? 'empty' : 'invalid';
      output.textContent = isValid ? currentResult.output : '—';
      formula.textContent = isValid ? currentResult.formula : helpText;
      outputState.textContent = isValid ? `${directionLabel} / CONVERTED` : 'OUTPUT EMPTY';
      outputState.dataset.state = isValid ? 'ready' : isEmpty ? 'empty' : 'invalid';
      summary.textContent = `ROOT ${rootLabel}PX / ${precisionLabel}`;
      clearButton.disabled = !valueInput.value && rootInput.value === String(converter.DEFAULT_ROOT_SIZE);
      copyButton.disabled = !isValid;
    };

    valueInput.addEventListener('input', renderResult);
    rootInput.addEventListener('input', renderResult);
    workspace.querySelectorAll('[data-unit-direction], [data-unit-precision]').forEach((control) => control.addEventListener('change', renderResult));
    workspace.querySelector('[data-sample]').addEventListener('click', () => {
      const direction = workspace.querySelector('[data-unit-direction]:checked')?.value || 'px-to-rem';
      valueInput.value = direction === 'rem-to-px' ? '2' : '32';
      rootInput.value = String(converter.DEFAULT_ROOT_SIZE);
      renderResult();
      valueInput.focus();
    });
    clearButton.addEventListener('click', () => {
      valueInput.value = '';
      rootInput.value = String(converter.DEFAULT_ROOT_SIZE);
      renderResult();
      valueInput.focus();
      showToast(RESET_TOAST_MESSAGE);
    });
    copyButton.addEventListener('click', () => copyText(currentResult.output));
    renderResult();
    window.addEventListener('pageshow', renderResult, { once: true });
  };

  const renderFluidScaleGenerator = () => {
    const ui = window.MarkBenchFluidScaleGeneratorUI;
    if (!ui) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; fluid scale generator module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }
    ui.mount({ workspace, copyText, showToast, escapeMarkup });
  };

  const renderWidthConverter = () => {
    const ui = window.MarkBenchWidthConverterUI;
    if (!ui) {
      workspace.innerHTML = '<div class="tool-workspace__loading"><p>&gt; width converter module unavailable<span class="terminal-cursor">_</span></p></div>';
      return;
    }
    ui.mount({ workspace, copyText, showToast, escapeMarkup });
  };

  const renderPlaceholder = () => {
    workspace.innerHTML = `<div class="placeholder-workspace"><p class="section-index">PROTOTYPE STATUS / ${tool.status}</p><h3>${tool.title}</h3><p>${tool.summary}</p><div class="placeholder-progress"><span></span></div><p class="section-index">MODULE IS CURRENTLY UNDER CONSTRUCTION.</p><a class="button button--inverse" href="./">BACK TO TOOLS <span>→</span></a></div>`;
  };

  if (tool.kind === 'case') renderCaseConverter();
  else if (tool.kind === 'counter') renderCounter();
  else if (tool.kind === 'slug') renderSlugGenerator();
  else if (tool.kind === 'json') renderJsonFormatter();
  else if (tool.kind === 'html') renderHtmlEscapeConverter();
  else if (tool.kind === 'numeric-reference') renderNumericCharacterReferenceConverter();
  else if (tool.kind === 'formatter') renderTextFormatter();
  else if (tool.kind === 'unicode') renderUnicodeInspector();
  else if (tool.kind === 'tree') renderDirectoryTreeGenerator();
  else if (tool.kind === 'markdown') renderMarkdownPreviewEditor();
  else if (tool.kind === 'table') renderHtmlTableBuilder();
  else if (tool.kind === 'bem') renderBemClassBuilder();
  else if (tool.kind === 'color') renderColorFormatConverter();
  else if (tool.kind === 'unit') renderUnitConverter();
  else if (tool.kind === 'fluid-scale') renderFluidScaleGenerator();
  else if (tool.kind === 'width') renderWidthConverter();
  else renderPlaceholder();
})();
