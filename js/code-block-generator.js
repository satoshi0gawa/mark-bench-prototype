(() => {
  const MAX_INPUT_LENGTH = 100000;
  const MAX_TITLE_LENGTH = 120;
  const DEFAULT_LANGUAGE = 'html';

  const LANGUAGES = Object.freeze({
    html: Object.freeze({ label: 'HTML', className: 'language-html' }),
    css: Object.freeze({ label: 'CSS', className: 'language-css' }),
    scss: Object.freeze({ label: 'SCSS', className: 'language-scss' }),
    javascript: Object.freeze({ label: 'JavaScript', className: 'language-javascript' }),
    php: Object.freeze({ label: 'PHP', className: 'language-php' }),
  });

  const SAMPLES = Object.freeze({
    html: '<article class="card">\n  <h2>MARK BENCH</h2>\n  <p>Web制作のコード例です。</p>\n</article>',
    css: '.card {\n  display: grid;\n  gap: 1rem;\n  padding: 1.5rem;\n}',
    scss: '.card {\n  padding: 1.5rem;\n\n  &__title {\n    margin-block: 0 1rem;\n  }\n}',
    javascript: "const cards = document.querySelectorAll('.card');\n\ncards.forEach((card) => {\n  card.hidden = false;\n});",
    php: '<?php\n$title = \'MARK BENCH\';\n?>\n<h2><?= htmlspecialchars($title, ENT_QUOTES, \'UTF-8\') ?></h2>',
  });

  const escapeCode = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  const escapeText = (value = '') => escapeCode(value)
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const normalizeOptions = (options = {}) => {
    const language = Object.hasOwn(LANGUAGES, options.language) ? options.language : DEFAULT_LANGUAGE;
    return Object.freeze({
      language,
      title: String(options.title || '').trim().slice(0, MAX_TITLE_LENGTH),
      includeCaption: options.includeCaption !== false,
      includeLanguageClass: options.includeLanguageClass !== false,
      focusable: options.focusable !== false,
    });
  };

  const generate = (input = '', options = {}) => {
    const settings = normalizeOptions(options);
    const original = String(input).replaceAll('\r\n', '\n').replaceAll('\r', '\n');
    const source = original.slice(0, MAX_INPUT_LENGTH);
    const truncated = source.length !== original.length;
    const language = LANGUAGES[settings.language];

    if (!source) {
      return Object.freeze({
        status: 'empty',
        source: '',
        markup: '',
        lineCount: 0,
        inputLength: 0,
        outputLength: 0,
        truncated,
        caption: settings.title || language.label,
        ...settings,
      });
    }

    const caption = settings.title || language.label;
    const codeClass = settings.includeLanguageClass ? ` class="${language.className}"` : '';
    const tabIndex = settings.focusable ? ' tabindex="0"' : '';
    const escapedSource = escapeCode(source);
    const preClass = settings.includeCaption ? 'code-block__pre' : 'code-block';
    const pre = `<pre class="${preClass}"${tabIndex}><code${codeClass}>${escapedSource}</code></pre>`;
    const markup = settings.includeCaption
      ? `<figure class="code-block">\n  <figcaption class="code-block__caption">${escapeText(caption)}</figcaption>\n  ${pre}\n</figure>`
      : pre;

    return Object.freeze({
      status: 'ready',
      source,
      markup,
      lineCount: source.split('\n').length,
      inputLength: source.length,
      outputLength: markup.length,
      truncated,
      caption,
      ...settings,
    });
  };

  const mount = ({ workspace, copyText, showToast }) => {
    workspace.innerHTML = `
      <div class="code-block-generator">
        <div class="workspace-grid workspace-grid--code-block">
          <section class="workspace-panel code-block-generator__input-pane" aria-labelledby="code-block-input-title">
            <div class="workspace-panel__header"><span id="code-block-input-title">INPUT / SOURCE CODE</span><div class="workspace-actions"><button class="workspace-action" type="button" data-code-block-sample>SAMPLE</button><button class="workspace-action" type="button" data-code-block-reset disabled>RESET</button></div></div>
            <label class="visually-hidden" for="code-block-input">コードブロックへ変換するコード</label>
            <textarea id="code-block-input" maxlength="${MAX_INPUT_LENGTH}" aria-describedby="code-block-input-status" placeholder="コードを入力または貼り付けてください。" spellcheck="false" autocapitalize="off" autocomplete="off" data-code-block-input></textarea>
            <div class="workspace-panel__footer"><span id="code-block-input-status" role="status" aria-live="polite" data-code-block-input-status>INPUT EMPTY</span><span data-code-block-input-count>0 / ${MAX_INPUT_LENGTH.toLocaleString('en-US')}</span></div>
          </section>

          <section class="workspace-panel code-block-generator__output-pane" aria-labelledby="code-block-output-title">
            <div class="workspace-panel__header"><span id="code-block-output-title">OUTPUT / HTML MARKUP</span><button class="workspace-action" type="button" data-copy-code-block disabled>COPY OUTPUT</button></div>
            <label class="visually-hidden" for="code-block-output">生成されたコードブロックHTML</label>
            <textarea id="code-block-output" class="code-block-generator__output" aria-describedby="code-block-output-status" readonly spellcheck="false" data-code-block-output></textarea>
            <div class="workspace-panel__footer"><span id="code-block-output-status" role="status" aria-live="polite" data-code-block-output-status>コードを入力するとHTMLを生成します。</span><span data-code-block-output-count>0 CHARS</span></div>
          </section>

          <section class="code-block-generator__settings" aria-labelledby="code-block-settings-title">
            <div class="workspace-panel__header"><span id="code-block-settings-title">SETTINGS / SEMANTIC MARKUP</span><span>LIVE UPDATE</span></div>
            <div class="code-block-generator__setting-grid">
              <label class="code-block-generator__field"><span>LANGUAGE</span><select data-code-block-language><option value="html">HTML</option><option value="css">CSS</option><option value="scss">SCSS</option><option value="javascript">JavaScript</option><option value="php">PHP</option></select></label>
              <label class="code-block-generator__field"><span>CAPTION TITLE (OPTIONAL)</span><input type="text" maxlength="${MAX_TITLE_LENGTH}" placeholder="例：HTML / card.html" data-code-block-title /></label>
              <fieldset class="code-block-generator__toggles"><legend>OUTPUT OPTIONS</legend><label><input type="checkbox" data-code-block-caption checked /><span>CAPTION</span></label><label><input type="checkbox" data-code-block-language-class checked /><span>LANGUAGE CLASS</span></label><label><input type="checkbox" data-code-block-focusable checked /><span>KEYBOARD SCROLL</span></label><button class="code-block-generator__patterns-button" type="button" aria-haspopup="dialog" aria-controls="code-block-pattern-modal" aria-expanded="false" data-code-block-patterns-open><span>選択パターン別の出力例</span><span aria-hidden="true">↗</span></button></fieldset>
            </div>
          </section>

          <section class="code-block-generator__preview-pane" aria-labelledby="code-block-preview-title">
            <div class="workspace-panel__header"><span id="code-block-preview-title">PREVIEW / PLAIN CODE</span><span>NO HIGHLIGHTER</span></div>
            <div class="code-block-generator__preview" data-code-block-preview><p>コードを入力するとプレビューを表示します。</p></div>
          </section>

          <dl class="code-block-generator__metrics" aria-label="生成結果の集計">
            <div><dt>LANGUAGE</dt><dd data-code-block-metric-language>HTML</dd></div>
            <div><dt>LINES</dt><dd data-code-block-metric-lines>0</dd></div>
            <div><dt>INPUT</dt><dd data-code-block-metric-input>0 CHARS</dd></div>
            <div><dt>OUTPUT</dt><dd data-code-block-metric-output>0 CHARS</dd></div>
          </dl>
        </div>
      </div>`;

    const input = workspace.querySelector('[data-code-block-input]');
    const output = workspace.querySelector('[data-code-block-output]');
    const languageSelect = workspace.querySelector('[data-code-block-language]');
    const titleInput = workspace.querySelector('[data-code-block-title]');
    const includeCaption = workspace.querySelector('[data-code-block-caption]');
    const includeLanguageClass = workspace.querySelector('[data-code-block-language-class]');
    const focusable = workspace.querySelector('[data-code-block-focusable]');
    const copyButton = workspace.querySelector('[data-copy-code-block]');
    const resetButton = workspace.querySelector('[data-code-block-reset]');
    const preview = workspace.querySelector('[data-code-block-preview]');
    const patternsButton = workspace.querySelector('[data-code-block-patterns-open]');
    const patternsModal = document.querySelector('[data-code-block-pattern-modal]');
    let currentResult = generate('');
    let patternsModalCloseTimer = 0;

    const modalFocusableSelector = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
    const modalDuration = 180;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const closePatternsModal = () => {
      if (!patternsModal || patternsModal.hidden || patternsModal.classList.contains('is-closing')) return;
      window.clearTimeout(patternsModalCloseTimer);
      patternsModal.classList.remove('is-open');
      patternsModal.classList.add('is-closing');
      patternsButton?.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onPatternsModalKeydown);
      patternsModalCloseTimer = window.setTimeout(() => {
        patternsModal.classList.remove('is-closing');
        patternsModal.hidden = true;
        document.body.classList.remove('is-code-block-pattern-modal-open');
        patternsButton?.focus({ preventScroll: true });
      }, reduceMotion ? 0 : modalDuration);
    };

    const onPatternsModalKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePatternsModal();
        return;
      }
      if (event.key !== 'Tab' || !patternsModal) return;
      const focusable = [...patternsModal.querySelectorAll(modalFocusableSelector)].filter((element) => !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const openPatternsModal = () => {
      if (!patternsModal) return;
      window.clearTimeout(patternsModalCloseTimer);
      patternsModal.hidden = false;
      patternsModal.classList.remove('is-closing');
      document.body.classList.add('is-code-block-pattern-modal-open');
      patternsButton?.setAttribute('aria-expanded', 'true');
      void patternsModal.offsetWidth;
      patternsModal.classList.add('is-open');
      document.addEventListener('keydown', onPatternsModalKeydown);
      patternsModal.querySelector('.code-block-pattern-modal__close')?.focus({ preventScroll: true });
    };

    const getOptions = () => ({
      language: languageSelect.value,
      title: titleInput.value,
      includeCaption: includeCaption.checked,
      includeLanguageClass: includeLanguageClass.checked,
      focusable: focusable.checked,
    });

    const renderPreview = () => {
      preview.replaceChildren();
      if (currentResult.status === 'empty') {
        const empty = document.createElement('p');
        empty.textContent = 'コードを入力するとプレビューを表示します。';
        preview.append(empty);
        return;
      }

      const pre = document.createElement('pre');
      const code = document.createElement('code');
      pre.tabIndex = currentResult.focusable ? 0 : -1;
      code.className = currentResult.includeLanguageClass ? LANGUAGES[currentResult.language].className : '';
      code.textContent = currentResult.source;
      pre.append(code);

      if (currentResult.includeCaption) {
        const figure = document.createElement('figure');
        const caption = document.createElement('figcaption');
        caption.textContent = currentResult.caption;
        figure.append(caption, pre);
        preview.append(figure);
      } else {
        preview.append(pre);
      }
    };

    const render = () => {
      currentResult = generate(input.value, getOptions());
      const language = LANGUAGES[currentResult.language];
      const hasOutput = currentResult.status === 'ready';
      output.value = currentResult.markup;
      copyButton.disabled = !hasOutput;
      resetButton.disabled = !input.value
        && languageSelect.value === DEFAULT_LANGUAGE
        && !titleInput.value
        && includeCaption.checked
        && includeLanguageClass.checked
        && focusable.checked;
      workspace.querySelector('[data-code-block-input-status]').textContent = hasOutput ? 'READY' : 'INPUT EMPTY';
      workspace.querySelector('[data-code-block-input-count]').textContent = `${currentResult.inputLength.toLocaleString('en-US')} / ${MAX_INPUT_LENGTH.toLocaleString('en-US')}`;
      workspace.querySelector('[data-code-block-output-status]').textContent = hasOutput ? 'READY TO COPY' : 'コードを入力するとHTMLを生成します。';
      workspace.querySelector('[data-code-block-output-count]').textContent = `${currentResult.outputLength.toLocaleString('en-US')} CHARS`;
      workspace.querySelector('[data-code-block-metric-language]').textContent = language.label;
      workspace.querySelector('[data-code-block-metric-lines]').textContent = currentResult.lineCount.toLocaleString('en-US');
      workspace.querySelector('[data-code-block-metric-input]').textContent = `${currentResult.inputLength.toLocaleString('en-US')} CHARS`;
      workspace.querySelector('[data-code-block-metric-output]').textContent = `${currentResult.outputLength.toLocaleString('en-US')} CHARS`;
      renderPreview();
    };

    input.addEventListener('input', render);
    titleInput.addEventListener('input', render);
    [languageSelect, includeCaption, includeLanguageClass, focusable].forEach((control) => control.addEventListener('change', render));
    workspace.querySelector('[data-code-block-sample]').addEventListener('click', () => {
      input.value = SAMPLES[languageSelect.value];
      render();
      input.focus();
    });
    resetButton.addEventListener('click', () => {
      input.value = '';
      languageSelect.value = DEFAULT_LANGUAGE;
      titleInput.value = '';
      includeCaption.checked = true;
      includeLanguageClass.checked = true;
      focusable.checked = true;
      render();
      showToast?.('表示をリセットしました。');
      input.focus();
    });
    copyButton.addEventListener('click', () => copyText(currentResult.markup));
    patternsButton?.addEventListener('click', openPatternsModal);
    patternsModal?.querySelectorAll('[data-code-block-patterns-close]').forEach((control) => control.addEventListener('click', closePatternsModal));
    render();
    window.addEventListener('pageshow', render, { once: true });
  };

  globalThis.MarkBenchCodeBlockGenerator = Object.freeze({
    MAX_INPUT_LENGTH,
    MAX_TITLE_LENGTH,
    DEFAULT_LANGUAGE,
    LANGUAGES,
    SAMPLES,
    escapeCode,
    normalizeOptions,
    generate,
    mount,
  });
})();
