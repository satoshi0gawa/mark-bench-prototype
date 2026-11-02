(() => {
  const MAX_TITLE_LENGTH = 200;
  const MAX_DESCRIPTION_LENGTH = 500;
  const MAX_URL_LENGTH = 2000;
  const MAX_TEXT_LENGTH = 300;

  const DEFAULT_VALUES = Object.freeze({
    title: '',
    description: '',
    canonical: '',
    robotsIndex: true,
    robotsFollow: true,
    robotsNoarchive: false,
    themeColor: '',
    ogTitle: '',
    ogDescription: '',
    ogType: 'website',
    ogUrl: '',
    siteName: '',
    locale: 'ja_JP',
    image: '',
    imageAlt: '',
    twitterCard: 'summary_large_image',
    twitterSite: '',
    twitterCreator: '',
  });

  const escapeAttribute = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  const isAbsoluteHttpUrl = (value = '') => {
    if (!value) return true;
    try {
      const url = new URL(String(value));
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const isThemeColor = (value = '') => !value || /^#[\da-f]{3}(?:[\da-f]{3})?$/iu.test(String(value));
  const normalizeHandle = (value = '') => {
    const source = String(value).trim();
    if (!source) return '';
    return source.startsWith('@') ? source : `@${source}`;
  };

  const createTag = (attribute, name, content) => content
    ? `<meta ${attribute}="${escapeAttribute(name)}" content="${escapeAttribute(content)}">`
    : '';

  const getWarnings = (values) => {
    const warnings = [];
    const add = (level, code, message) => warnings.push({ level, code, message });
    if (!values.title) add('error', 'TITLE_REQUIRED', 'titleを入力してください。');
    else if (values.title.length > 60) add('warning', 'TITLE_LENGTH', 'titleは検索結果で省略される可能性があります（推奨60文字以内）。');
    if (!values.description) add('warning', 'DESCRIPTION_EMPTY', 'meta descriptionが未入力です。');
    else if (values.description.length > 160) add('warning', 'DESCRIPTION_LENGTH', 'descriptionは検索結果で省略される可能性があります（推奨160文字以内）。');
    if (values.canonical && !isAbsoluteHttpUrl(values.canonical)) add('error', 'CANONICAL_URL', 'canonical URLはhttpまたはhttpsの絶対URLで入力してください。');
    if (values.ogUrl && !isAbsoluteHttpUrl(values.ogUrl)) add('error', 'OG_URL', 'og:urlはhttpまたはhttpsの絶対URLで入力してください。');
    if (values.canonical && values.ogUrl && values.canonical !== values.ogUrl) add('warning', 'URL_MISMATCH', 'canonical URLとog:urlが異なります。意図した設定か確認してください。');
    if (!values.image) add('warning', 'IMAGE_EMPTY', 'OGP画像が未設定です。');
    else if (!isAbsoluteHttpUrl(values.image)) add('error', 'IMAGE_URL', 'OGP画像はhttpまたはhttpsの絶対URLで入力してください。');
    else if (!values.imageAlt) add('warning', 'IMAGE_ALT', 'OGP画像の代替テキストを入力してください。');
    if (!isThemeColor(values.themeColor)) add('error', 'THEME_COLOR', 'テーマカラーは#RGBまたは#RRGGBB形式で入力してください。');
    return warnings;
  };

  const generate = (input = {}) => {
    const values = {
      ...DEFAULT_VALUES,
      ...input,
      title: String(input.title ?? '').slice(0, MAX_TITLE_LENGTH),
      description: String(input.description ?? '').slice(0, MAX_DESCRIPTION_LENGTH),
      canonical: String(input.canonical ?? '').trim().slice(0, MAX_URL_LENGTH),
      themeColor: String(input.themeColor ?? '').trim().slice(0, 7),
      ogTitle: String(input.ogTitle ?? '').slice(0, MAX_TITLE_LENGTH),
      ogDescription: String(input.ogDescription ?? '').slice(0, MAX_DESCRIPTION_LENGTH),
      ogUrl: String(input.ogUrl ?? '').trim().slice(0, MAX_URL_LENGTH),
      siteName: String(input.siteName ?? '').slice(0, MAX_TEXT_LENGTH),
      locale: String(input.locale ?? 'ja_JP').slice(0, 20),
      image: String(input.image ?? '').trim().slice(0, MAX_URL_LENGTH),
      imageAlt: String(input.imageAlt ?? '').slice(0, MAX_TEXT_LENGTH),
      twitterSite: normalizeHandle(input.twitterSite).slice(0, 50),
      twitterCreator: normalizeHandle(input.twitterCreator).slice(0, 50),
    };
    const resolved = {
      ogTitle: values.ogTitle || values.title,
      ogDescription: values.ogDescription || values.description,
      ogUrl: values.ogUrl || values.canonical,
    };
    const robots = [values.robotsIndex ? 'index' : 'noindex', values.robotsFollow ? 'follow' : 'nofollow'];
    if (values.robotsNoarchive) robots.push('noarchive');

    const basicTags = [
      values.title ? `<title>${escapeAttribute(values.title)}</title>` : '',
      createTag('name', 'description', values.description),
      values.canonical ? `<link rel="canonical" href="${escapeAttribute(values.canonical)}">` : '',
      createTag('name', 'robots', robots.join(', ')),
      isThemeColor(values.themeColor) ? createTag('name', 'theme-color', values.themeColor) : '',
    ].filter(Boolean);
    const ogTags = [
      createTag('property', 'og:title', resolved.ogTitle),
      createTag('property', 'og:description', resolved.ogDescription),
      createTag('property', 'og:type', values.ogType || 'website'),
      createTag('property', 'og:url', resolved.ogUrl),
      createTag('property', 'og:site_name', values.siteName),
      createTag('property', 'og:locale', values.locale),
      createTag('property', 'og:image', values.image),
      values.image ? createTag('property', 'og:image:alt', values.imageAlt) : '',
    ].filter(Boolean);
    const twitterTags = [
      createTag('name', 'twitter:card', values.twitterCard || 'summary_large_image'),
      createTag('name', 'twitter:title', resolved.ogTitle),
      createTag('name', 'twitter:description', resolved.ogDescription),
      createTag('name', 'twitter:image', values.image),
      values.image ? createTag('name', 'twitter:image:alt', values.imageAlt) : '',
      createTag('name', 'twitter:site', values.twitterSite),
      createTag('name', 'twitter:creator', values.twitterCreator),
    ].filter(Boolean);
    const sections = [basicTags, ogTags, twitterTags].filter((section) => section.length);
    const html = sections.map((section) => section.join('\n')).join('\n\n');
    const warnings = getWarnings(values);
    return {
      values,
      resolved,
      robots: robots.join(', '),
      basicTags,
      ogTags,
      twitterTags,
      html,
      warnings,
      hasErrors: warnings.some((warning) => warning.level === 'error'),
      metrics: {
        tags: basicTags.length + ogTags.length + twitterTags.length,
        basicTags: basicTags.length,
        ogTags: ogTags.length,
        twitterTags: twitterTags.length,
        titleCharacters: values.title.length,
        descriptionCharacters: values.description.length,
      },
    };
  };

  const mount = ({ workspace, copyText, showToast, escapeMarkup }) => {
    workspace.innerHTML = `
      <div class="meta-builder">
        <div class="workspace-grid workspace-grid--meta-builder">
          <section class="meta-builder__panel meta-builder__seo" aria-labelledby="meta-seo-title">
            <div class="workspace-panel__header"><span id="meta-seo-title">SEO / BASIC META</span><div class="workspace-actions"><button class="workspace-action" type="button" data-meta-sample>SAMPLE</button><button class="workspace-action" type="button" data-meta-clear disabled>CLEAR</button></div></div>
            <div class="meta-builder__fields">
              <label><span>TITLE <small data-meta-count="title">0 / 60 RECOMMENDED</small></span><input type="text" maxlength="${MAX_TITLE_LENGTH}" placeholder="ページタイトル" data-meta-field="title"></label>
              <label><span>DESCRIPTION <small data-meta-count="description">0 / 160 RECOMMENDED</small></span><textarea maxlength="${MAX_DESCRIPTION_LENGTH}" placeholder="検索結果やSNSで表示するページの説明" data-meta-field="description"></textarea></label>
              <label><span>CANONICAL URL</span><input type="url" maxlength="${MAX_URL_LENGTH}" placeholder="https://example.com/page" spellcheck="false" data-meta-field="canonical"></label>
              <div class="meta-builder__inline-fields">
                <label><span>THEME COLOR</span><input type="text" maxlength="7" placeholder="#18243b" spellcheck="false" data-meta-field="themeColor"></label>
                <div class="meta-builder__robots"><span>ROBOTS</span><label><input type="checkbox" data-meta-check="robotsIndex" checked><i>INDEX</i></label><label><input type="checkbox" data-meta-check="robotsFollow" checked><i>FOLLOW</i></label><label><input type="checkbox" data-meta-check="robotsNoarchive"><i>NOARCHIVE</i></label></div>
              </div>
            </div>
          </section>

          <section class="meta-builder__panel meta-builder__og" aria-labelledby="meta-og-title">
            <div class="workspace-panel__header"><span id="meta-og-title">OPEN GRAPH / OGP</span><span>EMPTY FIELDS USE SEO VALUES</span></div>
            <div class="meta-builder__fields">
              <label><span>OG TITLE <small>OPTIONAL OVERRIDE</small></span><input type="text" maxlength="${MAX_TITLE_LENGTH}" placeholder="titleを使用" data-meta-field="ogTitle"></label>
              <label><span>OG DESCRIPTION <small>OPTIONAL OVERRIDE</small></span><textarea maxlength="${MAX_DESCRIPTION_LENGTH}" placeholder="descriptionを使用" data-meta-field="ogDescription"></textarea></label>
              <div class="meta-builder__inline-fields">
                <label><span>TYPE</span><select data-meta-field="ogType"><option value="website">website</option><option value="article">article</option><option value="profile">profile</option><option value="product">product</option></select></label>
                <label><span>LOCALE</span><input type="text" maxlength="20" value="ja_JP" placeholder="ja_JP" data-meta-field="locale"></label>
              </div>
              <label><span>OG URL <small>EMPTY = CANONICAL</small></span><input type="url" maxlength="${MAX_URL_LENGTH}" placeholder="canonical URLを使用" spellcheck="false" data-meta-field="ogUrl"></label>
              <label><span>SITE NAME</span><input type="text" maxlength="${MAX_TEXT_LENGTH}" placeholder="サイト名" data-meta-field="siteName"></label>
              <label><span>IMAGE URL</span><input type="url" maxlength="${MAX_URL_LENGTH}" placeholder="https://example.com/ogp.jpg" spellcheck="false" data-meta-field="image"></label>
              <label><span>IMAGE ALT</span><input type="text" maxlength="${MAX_TEXT_LENGTH}" placeholder="OGP画像の内容" data-meta-field="imageAlt"></label>
            </div>
          </section>

          <section class="meta-builder__twitter" aria-labelledby="meta-twitter-title">
            <div class="workspace-panel__header"><span id="meta-twitter-title">TWITTER CARD</span><span>USES OGP TITLE / DESCRIPTION / IMAGE</span></div>
            <div class="meta-builder__twitter-fields">
              <label><span>CARD</span><select data-meta-field="twitterCard"><option value="summary_large_image">summary_large_image</option><option value="summary">summary</option></select></label>
              <label><span>SITE ACCOUNT</span><input type="text" maxlength="50" placeholder="@example" spellcheck="false" data-meta-field="twitterSite"></label>
              <label><span>CREATOR</span><input type="text" maxlength="50" placeholder="@creator" spellcheck="false" data-meta-field="twitterCreator"></label>
            </div>
          </section>

          <section class="meta-builder__previews" aria-labelledby="meta-preview-title">
            <div class="workspace-panel__header"><span id="meta-preview-title">PREVIEW</span><span>APPROXIMATE DISPLAY</span></div>
            <div class="meta-builder__preview-grid">
              <article class="meta-builder__search-preview"><span>SEARCH RESULT</span><p data-meta-preview-url>example.com</p><h3 data-meta-preview-title>ページタイトル</h3><p data-meta-preview-description>ページの説明がここに表示されます。</p></article>
              <article class="meta-builder__social-preview"><div class="meta-builder__image-placeholder" data-meta-preview-image><span>OGP IMAGE</span></div><div><span data-meta-preview-domain>example.com</span><h3 data-meta-social-title>ページタイトル</h3><p data-meta-social-description>ページの説明がここに表示されます。</p></div></article>
            </div>
          </section>

          <section class="meta-builder__output" aria-labelledby="meta-output-title">
            <div class="workspace-panel__header"><span id="meta-output-title">GENERATED HEAD TAGS</span><button class="workspace-action" type="button" data-copy-meta-tags disabled>COPY TAGS</button></div>
            <pre data-meta-output><span class="meta-builder__empty">[ OUTPUT_EMPTY ]</span></pre>
            <div class="workspace-panel__footer"><span data-meta-output-state data-state="empty">ADD A TITLE</span><span data-meta-output-summary>0 TAGS</span></div>
          </section>

          <section class="meta-builder__warnings" aria-labelledby="meta-warning-title">
            <div class="workspace-panel__header"><span id="meta-warning-title">VALIDATION</span><span data-meta-warning-count>0 ISSUES</span></div>
            <ul data-meta-warnings></ul>
          </section>

          <dl class="meta-builder__metrics" aria-label="メタタグの集計結果">
            <div><dt>ALL TAGS</dt><dd data-meta-metric="tags">0</dd></div>
            <div><dt>BASIC</dt><dd data-meta-metric="basicTags">0</dd></div>
            <div><dt>OPEN GRAPH</dt><dd data-meta-metric="ogTags">0</dd></div>
            <div><dt>TWITTER</dt><dd data-meta-metric="twitterTags">0</dd></div>
            <div><dt>TITLE</dt><dd data-meta-metric="titleCharacters">0 CHARS</dd></div>
            <div><dt>DESCRIPTION</dt><dd data-meta-metric="descriptionCharacters">0 CHARS</dd></div>
          </dl>
        </div>
      </div>`;

    const fieldElements = [...workspace.querySelectorAll('[data-meta-field]')];
    const checkElements = [...workspace.querySelectorAll('[data-meta-check]')];
    const output = workspace.querySelector('[data-meta-output]');
    const warnings = workspace.querySelector('[data-meta-warnings]');
    const clearButton = workspace.querySelector('[data-meta-clear]');
    const copyButton = workspace.querySelector('[data-copy-meta-tags]');
    let currentResult = generate();
    let renderFrame = 0;

    const getValues = () => {
      const values = {};
      fieldElements.forEach((element) => { values[element.dataset.metaField] = element.value; });
      checkElements.forEach((element) => { values[element.dataset.metaCheck] = element.checked; });
      return values;
    };
    const setValues = (values) => {
      fieldElements.forEach((element) => {
        const value = values[element.dataset.metaField];
        element.value = value === undefined ? '' : String(value);
      });
      checkElements.forEach((element) => {
        element.checked = Boolean(values[element.dataset.metaCheck]);
      });
    };
    const getDomain = (urlValue) => {
      try { return new URL(urlValue).hostname; } catch { return urlValue || 'example.com'; }
    };
    const render = () => {
      currentResult = generate(getValues());
      const { values, resolved, metrics } = currentResult;
      const hasValues = fieldElements.some((element) => element.value !== String(DEFAULT_VALUES[element.dataset.metaField] ?? ''))
        || checkElements.some((element) => element.checked !== Boolean(DEFAULT_VALUES[element.dataset.metaCheck]));
      const domain = getDomain(resolved.ogUrl || values.canonical);
      const title = resolved.ogTitle || 'ページタイトル';
      const description = resolved.ogDescription || 'ページの説明がここに表示されます。';

      workspace.querySelector('[data-meta-count="title"]').textContent = `${metrics.titleCharacters} / 60 RECOMMENDED`;
      workspace.querySelector('[data-meta-count="description"]').textContent = `${metrics.descriptionCharacters} / 160 RECOMMENDED`;
      workspace.querySelector('[data-meta-preview-url]').textContent = values.canonical || 'example.com';
      workspace.querySelector('[data-meta-preview-title]').textContent = values.title || 'ページタイトル';
      workspace.querySelector('[data-meta-preview-description]').textContent = values.description || 'ページの説明がここに表示されます。';
      workspace.querySelector('[data-meta-preview-domain]').textContent = domain;
      workspace.querySelector('[data-meta-social-title]').textContent = title;
      workspace.querySelector('[data-meta-social-description]').textContent = description;
      workspace.querySelector('[data-meta-preview-image]').innerHTML = values.image
        ? `<span>IMAGE URL</span><small>${escapeMarkup(values.image)}</small>`
        : '<span>OGP IMAGE</span><small>1200 × 630 RECOMMENDED</small>';

      output.textContent = currentResult.html;
      if (!currentResult.html) output.innerHTML = '<span class="meta-builder__empty">[ OUTPUT_EMPTY ]</span>';
      const outputState = !values.title ? 'ADD A TITLE' : currentResult.hasErrors ? 'CHECK REQUIRED' : 'TAGS READY';
      workspace.querySelector('[data-meta-output-state]').textContent = outputState;
      workspace.querySelector('[data-meta-output-state]').dataset.state = !values.title ? 'empty' : currentResult.hasErrors ? 'invalid' : 'ready';
      workspace.querySelector('[data-meta-output-summary]').textContent = `${metrics.tags} TAGS / ${currentResult.warnings.length} ISSUES`;
      workspace.querySelector('[data-meta-warning-count]').textContent = `${currentResult.warnings.length} ISSUE${currentResult.warnings.length === 1 ? '' : 'S'}`;
      warnings.innerHTML = currentResult.warnings.length
        ? currentResult.warnings.map((warning) => `<li data-level="${warning.level}"><strong>${warning.code}</strong><span>${escapeMarkup(warning.message)}</span></li>`).join('')
        : '<li class="meta-builder__warnings-empty"><strong>VALID</strong><span>必須項目と推奨設定を満たしています。</span></li>';
      clearButton.disabled = !hasValues;
      copyButton.disabled = !currentResult.html || !values.title;

      ['canonical', 'ogUrl', 'image', 'themeColor'].forEach((field) => {
        const element = workspace.querySelector(`[data-meta-field="${field}"]`);
        const invalid = currentResult.warnings.some((warning) => ({ canonical: 'CANONICAL_URL', ogUrl: 'OG_URL', image: 'IMAGE_URL', themeColor: 'THEME_COLOR' })[field] === warning.code);
        element?.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      });
      Object.entries(metrics).forEach(([name, value]) => {
        const metric = workspace.querySelector(`[data-meta-metric="${name}"]`);
        if (metric) metric.textContent = ['titleCharacters', 'descriptionCharacters'].includes(name) ? `${value} CHARS` : String(value);
      });
    };
    const scheduleRender = () => {
      window.cancelAnimationFrame(renderFrame);
      renderFrame = window.requestAnimationFrame(render);
    };

    fieldElements.forEach((element) => {
      element.addEventListener('input', scheduleRender);
      element.addEventListener('change', render);
    });
    checkElements.forEach((element) => element.addEventListener('change', render));
    workspace.querySelector('[data-meta-sample]').addEventListener('click', () => {
      setValues({
        ...DEFAULT_VALUES,
        title: 'MARK BENCH | Web制作ツールと実装ノート',
        description: 'Web制作で繰り返し使えるツール、UIパーツ、実装ノートをまとめたローカルワークベンチです。',
        canonical: 'https://example.com/tools/meta-tags-ogp-builder',
        themeColor: '#18243b',
        ogType: 'website',
        siteName: 'MARK BENCH',
        locale: 'ja_JP',
        image: 'https://example.com/assets/ogp/mark-bench.jpg',
        imageAlt: 'MARK BENCHのWeb制作ツール一覧',
        twitterCard: 'summary_large_image',
        twitterSite: '@markbench',
      });
      render();
      workspace.querySelector('[data-meta-field="title"]')?.focus();
    });
    clearButton.addEventListener('click', () => {
      setValues(DEFAULT_VALUES);
      render();
      workspace.querySelector('[data-meta-field="title"]')?.focus();
    });
    copyButton.addEventListener('click', () => copyText(currentResult.html));
    render();
    window.addEventListener('pageshow', render, { once: true });
  };

  const api = {
    MAX_TITLE_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    MAX_URL_LENGTH,
    MAX_TEXT_LENGTH,
    DEFAULT_VALUES,
    escapeAttribute,
    isAbsoluteHttpUrl,
    isThemeColor,
    normalizeHandle,
    getWarnings,
    generate,
    mount,
  };

  if (typeof window !== 'undefined') window.MarkBenchMetaTagsOgpBuilder = api;
  if (typeof globalThis !== 'undefined') globalThis.MarkBenchMetaTagsOgpBuilder = api;
})();
