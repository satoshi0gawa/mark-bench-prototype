(() => {
  const MAX_SOURCES = 8;
  const MAX_INPUT_LENGTH = 10000;
  const IMAGE_TYPES = Object.freeze(['image/avif', 'image/webp', 'image/jpeg', 'image/png']);
  const SAMPLE = Object.freeze({
    fallbackSrc: '/images/hero-1280.jpg',
    fallbackSrcset: '/images/hero-480.jpg 480w, /images/hero-768.jpg 768w, /images/hero-1280.jpg 1280w',
    sizes: '(max-width: 767px) 100vw, min(1200px, 80vw)',
    alt: '制作環境のデスクとモニター',
    width: '1280',
    height: '720',
    loading: 'lazy',
    decoding: 'async',
    fetchpriority: 'auto',
    decorative: false,
    sources: [
      { type: 'image/avif', media: '', srcset: '/images/hero-480.avif 480w, /images/hero-768.avif 768w, /images/hero-1280.avif 1280w', sizes: '' },
      { type: 'image/webp', media: '', srcset: '/images/hero-480.webp 480w, /images/hero-768.webp 768w, /images/hero-1280.webp 1280w', sizes: '' },
    ],
  });

  const escapeAttribute = (value = '') => String(value)
    .replace(/&/gu, '&amp;')
    .replace(/"/gu, '&quot;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;');
  const toPositiveInteger = (value) => {
    const number = Number.parseInt(String(value), 10);
    return Number.isInteger(number) && number > 0 ? number : null;
  };
  const isSafeImageUrl = (value) => {
    const url = String(value || '').trim();
    if (!url || /[\u0000-\u001f\u007f]/u.test(url)) return false;
    return !/^(?:javascript|vbscript|data):/iu.test(url);
  };
  const parseSrcset = (value = '') => {
    const input = String(value).trim();
    if (!input) return { candidates: [], errors: [], warnings: [], descriptorType: 'none', valid: true };
    const errors = [];
    const warnings = [];
    const candidates = [];
    const descriptorTypes = new Set();
    const descriptors = new Set();
    input.split(',').forEach((rawCandidate, index) => {
      const candidate = rawCandidate.trim();
      if (!candidate) {
        errors.push(`候補${index + 1}: URLが空です。`);
        return;
      }
      const parts = candidate.split(/\s+/u);
      if (parts.length > 2) {
        errors.push(`候補${index + 1}: URLとディスクリプターの間だけに空白を使用してください。`);
        return;
      }
      const [url, descriptor = ''] = parts;
      if (!isSafeImageUrl(url)) errors.push(`候補${index + 1}: 画像URLを確認してください。`);
      let descriptorType = 'density';
      let descriptorValue = 1;
      if (descriptor) {
        const widthMatch = descriptor.match(/^([1-9]\d*)w$/u);
        const densityMatch = descriptor.match(/^(?:(\d+(?:\.\d+)?)|(\.\d+))x$/u);
        if (widthMatch) {
          descriptorType = 'width';
          descriptorValue = Number(widthMatch[1]);
        } else if (densityMatch && Number(densityMatch[1] || densityMatch[2]) > 0) {
          descriptorValue = Number(densityMatch[1] || densityMatch[2]);
        } else {
          errors.push(`候補${index + 1}: ${descriptor} は有効なw／xディスクリプターではありません。`);
        }
      }
      const descriptorKey = descriptor || '1x';
      if (descriptors.has(descriptorKey)) warnings.push(`ディスクリプター ${descriptorKey} が重複しています。`);
      descriptors.add(descriptorKey);
      descriptorTypes.add(descriptorType);
      candidates.push({ url, descriptor, descriptorType, value: descriptorValue });
    });
    if (descriptorTypes.size > 1) errors.push('wディスクリプターとxディスクリプターは同じsrcset内で混在できません。');
    const descriptorType = descriptorTypes.size === 1 ? [...descriptorTypes][0] : descriptorTypes.size > 1 ? 'mixed' : 'none';
    return { candidates, errors, warnings, descriptorType, valid: errors.length === 0 };
  };

  const normalizeValues = (values = {}) => ({
    fallbackSrc: String(values.fallbackSrc || '').trim(),
    fallbackSrcset: String(values.fallbackSrcset || '').trim(),
    sizes: String(values.sizes || '').trim(),
    alt: String(values.alt || ''),
    width: String(values.width || '').trim(),
    height: String(values.height || '').trim(),
    loading: ['lazy', 'eager'].includes(values.loading) ? values.loading : 'lazy',
    decoding: ['async', 'sync', 'auto'].includes(values.decoding) ? values.decoding : 'async',
    fetchpriority: ['auto', 'high', 'low'].includes(values.fetchpriority) ? values.fetchpriority : 'auto',
    decorative: Boolean(values.decorative),
    sources: Array.isArray(values.sources) ? values.sources.slice(0, MAX_SOURCES).map((source) => ({
      type: IMAGE_TYPES.includes(source.type) ? source.type : 'image/webp',
      media: String(source.media || '').trim(),
      srcset: String(source.srcset || '').trim(),
      sizes: String(source.sizes || '').trim(),
    })) : [],
  });

  const buildAttribute = (name, value, allowEmpty = false) => value === null || value === undefined || (!allowEmpty && value === '') ? '' : ` ${name}="${escapeAttribute(value)}"`;
  const generateMarkup = (input = {}) => {
    const values = normalizeValues(input);
    const warnings = [];
    const fallbackAnalysis = parseSrcset(values.fallbackSrcset);
    if (!values.fallbackSrc) warnings.push({ level: 'error', code: 'SRC_REQUIRED', message: 'フォールバック画像のsrcを入力してください。' });
    else if (!isSafeImageUrl(values.fallbackSrc)) warnings.push({ level: 'error', code: 'SRC_INVALID', message: 'フォールバック画像のURLを確認してください。' });
    if (values.fallbackSrc.length > MAX_INPUT_LENGTH) warnings.push({ level: 'error', code: 'SRC_LENGTH', message: `srcは${MAX_INPUT_LENGTH.toLocaleString('en-US')}文字以内にしてください。` });
    fallbackAnalysis.errors.forEach((message) => warnings.push({ level: 'error', code: 'IMG_SRCSET_INVALID', message }));
    fallbackAnalysis.warnings.forEach((message) => warnings.push({ level: 'warning', code: 'IMG_SRCSET_WARNING', message }));
    if (fallbackAnalysis.descriptorType === 'width' && !values.sizes) warnings.push({ level: 'warning', code: 'IMG_SIZES_EMPTY', message: 'フォールバックsrcsetがw指定のためsizesの設定を推奨します。' });
    if (!values.decorative && !values.alt.trim()) warnings.push({ level: 'error', code: 'ALT_REQUIRED', message: '画像の内容を表すaltを入力するか、装飾画像を選択してください。' });
    const width = toPositiveInteger(values.width);
    const height = toPositiveInteger(values.height);
    if ((values.width && !width) || (values.height && !height)) warnings.push({ level: 'error', code: 'DIMENSION_INVALID', message: 'widthとheightは1以上の整数で入力してください。' });
    if ((width && !height) || (!width && height)) warnings.push({ level: 'warning', code: 'DIMENSION_PAIR', message: 'レイアウトシフト抑制のためwidthとheightは両方指定してください。' });
    if (!width && !height) warnings.push({ level: 'warning', code: 'DIMENSION_EMPTY', message: 'レイアウトシフト抑制のためwidthとheightの指定を推奨します。' });

    let candidateCount = fallbackAnalysis.candidates.length;
    const descriptorTypes = new Set(fallbackAnalysis.candidates.length ? [fallbackAnalysis.descriptorType] : []);
    const sourceLines = [];
    values.sources.forEach((source, index) => {
      const isConfigured = source.srcset || source.media;
      if (!isConfigured) return;
      if (!source.srcset) {
        warnings.push({ level: 'error', code: 'SOURCE_SRCSET_REQUIRED', message: `SOURCE ${index + 1}: srcsetを入力してください。` });
        return;
      }
      const analysis = parseSrcset(source.srcset);
      analysis.errors.forEach((message) => warnings.push({ level: 'error', code: 'SOURCE_SRCSET_INVALID', message: `SOURCE ${index + 1}: ${message}` }));
      analysis.warnings.forEach((message) => warnings.push({ level: 'warning', code: 'SOURCE_SRCSET_WARNING', message: `SOURCE ${index + 1}: ${message}` }));
      if (analysis.descriptorType === 'width' && !(source.sizes || values.sizes)) warnings.push({ level: 'warning', code: 'SOURCE_SIZES_EMPTY', message: `SOURCE ${index + 1}: w指定のためsizesの設定を推奨します。` });
      if (source.media && !/^\(.+\)$/u.test(source.media)) warnings.push({ level: 'warning', code: 'MEDIA_SYNTAX', message: `SOURCE ${index + 1}: media条件は括弧で囲んでください。` });
      candidateCount += analysis.candidates.length;
      if (analysis.candidates.length) descriptorTypes.add(analysis.descriptorType);
      if (analysis.valid) {
        sourceLines.push(`  <source${buildAttribute('type', source.type)}${buildAttribute('media', source.media)}${buildAttribute('srcset', source.srcset)}${buildAttribute('sizes', source.sizes || values.sizes)}>`);
      }
    });

    const imageAttributes = [
      buildAttribute('src', values.fallbackSrc),
      buildAttribute('srcset', fallbackAnalysis.valid ? values.fallbackSrcset : ''),
      buildAttribute('sizes', values.fallbackSrcset ? values.sizes : ''),
      buildAttribute('alt', values.decorative ? '' : values.alt, true),
      buildAttribute('width', width),
      buildAttribute('height', height),
      buildAttribute('loading', values.loading),
      buildAttribute('decoding', values.decoding),
      buildAttribute('fetchpriority', values.fetchpriority),
    ].join('');
    const imageLine = `<img${imageAttributes}>`;
    const usePicture = sourceLines.length > 0;
    const html = values.fallbackSrc
      ? usePicture ? ['<picture>', ...sourceLines, `  ${imageLine}`, '</picture>'].join('\n') : imageLine
      : '';
    const hasErrors = warnings.some((warning) => warning.level === 'error');
    const descriptorMode = descriptorTypes.size === 0 ? 'NONE' : descriptorTypes.size === 1 ? [...descriptorTypes][0].toUpperCase() : 'MIXED';
    return {
      values,
      html,
      warnings,
      hasErrors,
      sourceLines,
      fallbackAnalysis,
      metrics: {
        sources: sourceLines.length,
        candidates: candidateCount,
        descriptorMode,
        fallback: values.fallbackSrc ? 'READY' : 'EMPTY',
        alt: values.decorative ? 'DECORATIVE' : values.alt.trim() ? 'DEFINED' : 'MISSING',
        lines: html ? html.split('\n').length : 0,
      },
    };
  };

  const mount = ({ workspace, copyText, showToast, escapeMarkup }) => {
    workspace.innerHTML = `
      <div class="responsive-image-builder">
        <div class="workspace-grid workspace-grid--responsive-image">
          <section class="responsive-image-builder__panel responsive-image-builder__base" aria-labelledby="responsive-image-base-title">
            <div class="workspace-panel__header"><span id="responsive-image-base-title">FALLBACK IMAGE / IMG</span><div class="workspace-actions"><button class="workspace-action" type="button" data-responsive-image-sample>SAMPLE</button><button class="workspace-action" type="button" data-responsive-image-clear disabled>CLEAR</button></div></div>
            <div class="responsive-image-builder__fields">
              <label><span>SRC <small>REQUIRED</small></span><input type="text" maxlength="${MAX_INPUT_LENGTH}" placeholder="/images/hero-1280.jpg" spellcheck="false" data-responsive-image-field="fallbackSrc"></label>
              <label><span>SRCSET <small>COMMA-SEPARATED</small></span><textarea maxlength="${MAX_INPUT_LENGTH}" placeholder="/images/hero-480.jpg 480w, /images/hero-1280.jpg 1280w" spellcheck="false" data-responsive-image-field="fallbackSrcset"></textarea></label>
              <label><span>SIZES <small>USED BY WIDTH DESCRIPTORS</small></span><input type="text" maxlength="${MAX_INPUT_LENGTH}" placeholder="(max-width: 767px) 100vw, 1200px" spellcheck="false" data-responsive-image-field="sizes"></label>
              <label><span>ALT TEXT <small>REQUIRED UNLESS DECORATIVE</small></span><input type="text" maxlength="1000" placeholder="画像の内容を簡潔に説明" data-responsive-image-field="alt"></label>
              <div class="responsive-image-builder__dimensions"><label><span>WIDTH / PX</span><input type="number" min="1" max="99999" inputmode="numeric" placeholder="1280" data-responsive-image-field="width"></label><label><span>HEIGHT / PX</span><input type="number" min="1" max="99999" inputmode="numeric" placeholder="720" data-responsive-image-field="height"></label><label class="responsive-image-builder__check"><input type="checkbox" data-responsive-image-check="decorative"><i>DECORATIVE / ALT=""</i></label></div>
            </div>
          </section>

          <section class="responsive-image-builder__panel responsive-image-builder__delivery" aria-labelledby="responsive-image-delivery-title">
            <div class="workspace-panel__header"><span id="responsive-image-delivery-title">DELIVERY OPTIONS</span><span>IMG ATTRIBUTES</span></div>
            <div class="responsive-image-builder__selects"><label><span>LOADING</span><select data-responsive-image-field="loading"><option value="lazy">lazy</option><option value="eager">eager</option></select></label><label><span>DECODING</span><select data-responsive-image-field="decoding"><option value="async">async</option><option value="auto">auto</option><option value="sync">sync</option></select></label><label><span>FETCH PRIORITY</span><select data-responsive-image-field="fetchpriority"><option value="auto">auto</option><option value="high">high</option><option value="low">low</option></select></label></div>
            <div class="responsive-image-builder__delivery-note"><strong>PERFORMANCE NOTE</strong><span>LCP画像では loading="eager" と fetchpriority="high"、画面外画像では lazy を目安に設定します。</span></div>
          </section>

          <section class="responsive-image-builder__panel responsive-image-builder__sources" aria-labelledby="responsive-image-sources-title">
            <div class="workspace-panel__header"><span id="responsive-image-sources-title">PICTURE SOURCES / ART DIRECTION</span><button class="workspace-action" type="button" data-responsive-image-add>ADD SOURCE</button></div>
            <div class="responsive-image-builder__source-list" data-responsive-image-sources><p class="responsive-image-builder__source-empty" data-responsive-image-source-empty>ADD SOURCEでAVIF・WebP・画面幅別画像を追加できます。</p></div>
            <div class="workspace-panel__footer"><span data-responsive-image-source-count>0 / ${MAX_SOURCES} SOURCES</span><span>TOP TO BOTTOM PRIORITY</span></div>
          </section>

          <section class="responsive-image-builder__panel responsive-image-builder__preview" aria-labelledby="responsive-image-preview-title">
            <div class="workspace-panel__header"><span id="responsive-image-preview-title">SELECTION PREVIEW</span><span data-responsive-image-viewport>VIEWPORT —</span></div>
            <div class="responsive-image-builder__preview-body">
              <div class="responsive-image-builder__picture-diagram" data-responsive-image-diagram><span>[ NO_IMAGE_MARKUP ]</span></div>
              <dl><div><dt>ACTIVE SOURCE</dt><dd data-responsive-image-active-source>—</dd></div><div><dt>MEDIA</dt><dd data-responsive-image-active-media>FALLBACK</dd></div><div><dt>CANDIDATES</dt><dd data-responsive-image-active-candidates>0</dd></div></dl>
            </div>
          </section>

          <section class="responsive-image-builder__panel responsive-image-builder__output" aria-labelledby="responsive-image-output-title">
            <div class="workspace-panel__header"><span id="responsive-image-output-title">GENERATED HTML</span><button class="workspace-action workspace-action--copy" type="button" data-responsive-image-copy disabled>COPY MARKUP</button></div>
            <pre><code data-responsive-image-output><span class="responsive-image-builder__empty">&lt;!-- Enter fallback image src --&gt;</span></code></pre>
          </section>

          <section class="responsive-image-builder__panel responsive-image-builder__warnings" aria-labelledby="responsive-image-warnings-title">
            <div class="workspace-panel__header"><span id="responsive-image-warnings-title">VALIDATION</span><span data-responsive-image-validation-state>INPUT REQUIRED</span></div>
            <ul data-responsive-image-warnings><li class="responsive-image-builder__warnings-empty"><strong>WAITING</strong><span>入力内容の検証結果を表示します。</span></li></ul>
          </section>

          <dl class="responsive-image-builder__metrics" aria-label="レスポンシブ画像マークアップの集計結果">
            <div><dt>SOURCES</dt><dd data-responsive-image-metric="sources">0</dd></div><div><dt>CANDIDATES</dt><dd data-responsive-image-metric="candidates">0</dd></div><div><dt>DESCRIPTORS</dt><dd data-responsive-image-metric="descriptorMode">NONE</dd></div><div><dt>FALLBACK</dt><dd data-responsive-image-metric="fallback">EMPTY</dd></div><div><dt>ALT</dt><dd data-responsive-image-metric="alt">MISSING</dd></div><div><dt>HTML LINES</dt><dd data-responsive-image-metric="lines">0</dd></div>
          </dl>
        </div>
      </div>`;

    const sourceList = workspace.querySelector('[data-responsive-image-sources]');
    const sourceEmpty = workspace.querySelector('[data-responsive-image-source-empty]');
    const copyButton = workspace.querySelector('[data-responsive-image-copy]');
    const clearButton = workspace.querySelector('[data-responsive-image-clear]');
    let currentResult = generateMarkup();
    let sourceId = 0;

    const renderSource = (source = {}) => {
      if (sourceList.querySelectorAll('[data-responsive-image-source]').length >= MAX_SOURCES) return;
      sourceId += 1;
      const row = document.createElement('article');
      row.className = 'responsive-image-builder__source';
      row.dataset.responsiveImageSource = String(sourceId);
      row.innerHTML = `<div class="responsive-image-builder__source-header"><strong>SOURCE_${String(sourceId).padStart(2, '0')}</strong><button type="button" data-responsive-image-remove>REMOVE</button></div><div class="responsive-image-builder__source-fields"><label><span>TYPE</span><select data-source-field="type">${IMAGE_TYPES.map((type) => `<option value="${type}"${type === (source.type || 'image/webp') ? ' selected' : ''}>${type}</option>`).join('')}</select></label><label><span>MEDIA <small>OPTIONAL</small></span><input type="text" maxlength="500" placeholder="(max-width: 767px)" value="${escapeMarkup(source.media || '')}" spellcheck="false" data-source-field="media"></label><label class="responsive-image-builder__source-srcset"><span>SRCSET</span><textarea maxlength="${MAX_INPUT_LENGTH}" placeholder="/images/hero-480.webp 480w, /images/hero-1280.webp 1280w" spellcheck="false" data-source-field="srcset">${escapeMarkup(source.srcset || '')}</textarea></label><label class="responsive-image-builder__source-sizes"><span>SIZES <small>EMPTY = GLOBAL SIZES</small></span><input type="text" maxlength="${MAX_INPUT_LENGTH}" placeholder="(max-width: 767px) 100vw, 1200px" value="${escapeMarkup(source.sizes || '')}" spellcheck="false" data-source-field="sizes"></label></div>`;
      sourceList.append(row);
      sourceEmpty.hidden = true;
    };

    const collect = () => {
      const values = {};
      workspace.querySelectorAll('[data-responsive-image-field]').forEach((field) => { values[field.dataset.responsiveImageField] = field.value; });
      values.decorative = workspace.querySelector('[data-responsive-image-check="decorative"]').checked;
      values.sources = [...sourceList.querySelectorAll('[data-responsive-image-source]')].map((row) => {
        const source = {};
        row.querySelectorAll('[data-source-field]').forEach((field) => { source[field.dataset.sourceField] = field.value; });
        return source;
      });
      return values;
    };

    const activeSource = (result) => {
      const configured = result.values.sources.filter((source) => source.srcset);
      const matched = configured.find((source) => !source.media || (() => { try { return window.matchMedia(source.media).matches; } catch { return false; } })());
      if (matched) return { label: matched.type.toUpperCase().replace('IMAGE/', ''), media: matched.media || 'ALL VIEWPORTS', analysis: parseSrcset(matched.srcset) };
      return { label: result.values.fallbackSrc ? 'IMG / FALLBACK' : '—', media: 'FALLBACK', analysis: result.fallbackAnalysis };
    };

    const update = () => {
      currentResult = generateMarkup(collect());
      workspace.querySelector('[data-responsive-image-output]').textContent = currentResult.html || '<!-- Enter fallback image src -->';
      copyButton.disabled = !currentResult.html || currentResult.hasErrors;
      const hasInput = Boolean(currentResult.values.fallbackSrc || currentResult.values.fallbackSrcset || currentResult.values.alt || currentResult.values.sources.length);
      clearButton.disabled = !hasInput;
      const warnings = workspace.querySelector('[data-responsive-image-warnings]');
      warnings.innerHTML = currentResult.warnings.length
        ? currentResult.warnings.map((warning) => `<li data-level="${warning.level}"><strong>${escapeMarkup(warning.code)}</strong><span>${escapeMarkup(warning.message)}</span></li>`).join('')
        : '<li class="responsive-image-builder__warnings-empty"><strong>VALID</strong><span>使用可能なマークアップです。</span></li>';
      const validationState = workspace.querySelector('[data-responsive-image-validation-state]');
      const errorCount = currentResult.warnings.filter((warning) => warning.level === 'error').length;
      validationState.textContent = errorCount ? `${errorCount} ERROR${errorCount === 1 ? '' : 'S'}` : currentResult.warnings.length ? `${currentResult.warnings.length} RECOMMENDATION${currentResult.warnings.length === 1 ? '' : 'S'}` : 'VALID';
      validationState.dataset.state = errorCount ? 'invalid' : 'valid';
      Object.entries(currentResult.metrics).forEach(([key, value]) => { workspace.querySelector(`[data-responsive-image-metric="${key}"]`).textContent = value; });
      const active = activeSource(currentResult);
      workspace.querySelector('[data-responsive-image-active-source]').textContent = active.label;
      workspace.querySelector('[data-responsive-image-active-media]').textContent = active.media;
      workspace.querySelector('[data-responsive-image-active-candidates]').textContent = active.analysis.candidates.length;
      workspace.querySelector('[data-responsive-image-viewport]').textContent = `VIEWPORT ${window.innerWidth} PX`;
      workspace.querySelector('[data-responsive-image-diagram]').innerHTML = currentResult.html
        ? `<strong>&lt;${currentResult.sourceLines.length ? 'picture' : 'img'}&gt;</strong><span>${currentResult.sourceLines.length} SOURCE${currentResult.sourceLines.length === 1 ? '' : 'S'} → ${active.label}</span><small>${active.analysis.candidates.map((candidate) => candidate.descriptor || '1x').join(' / ') || 'SRC ONLY'}</small>`
        : '<span>[ NO_IMAGE_MARKUP ]</span>';
      const sourceCount = sourceList.querySelectorAll('[data-responsive-image-source]').length;
      workspace.querySelector('[data-responsive-image-source-count]').textContent = `${sourceCount} / ${MAX_SOURCES} SOURCES`;
      workspace.querySelector('[data-responsive-image-add]').disabled = sourceCount >= MAX_SOURCES;
      sourceEmpty.hidden = sourceCount > 0;
      const decorative = currentResult.values.decorative;
      const altField = workspace.querySelector('[data-responsive-image-field="alt"]');
      altField.disabled = decorative;
      if (decorative) altField.value = '';
    };

    const setValues = (values) => {
      workspace.querySelectorAll('[data-responsive-image-field]').forEach((field) => {
        if (Object.hasOwn(values, field.dataset.responsiveImageField)) field.value = values[field.dataset.responsiveImageField];
      });
      workspace.querySelector('[data-responsive-image-check="decorative"]').checked = Boolean(values.decorative);
      sourceList.querySelectorAll('[data-responsive-image-source]').forEach((row) => row.remove());
      (values.sources || []).forEach(renderSource);
      update();
    };

    workspace.addEventListener('input', (event) => { if (event.target.matches('input, textarea, select')) update(); });
    workspace.addEventListener('change', (event) => { if (event.target.matches('input, textarea, select')) update(); });
    sourceList.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-responsive-image-remove]');
      if (!remove) return;
      remove.closest('[data-responsive-image-source]').remove();
      update();
    });
    workspace.querySelector('[data-responsive-image-add]').addEventListener('click', () => { renderSource(); update(); });
    workspace.querySelector('[data-responsive-image-sample]').addEventListener('click', () => { setValues(SAMPLE); });
    workspace.querySelector('[data-responsive-image-clear]').addEventListener('click', () => { setValues({ fallbackSrc: '', fallbackSrcset: '', sizes: '', alt: '', width: '', height: '', loading: 'lazy', decoding: 'async', fetchpriority: 'auto', decorative: false, sources: [] }); });
    copyButton.addEventListener('click', () => copyText(currentResult.html, 'マークアップをコピーしました。'));
    window.addEventListener('resize', update);
    update();
  };

  const api = { MAX_SOURCES, MAX_INPUT_LENGTH, IMAGE_TYPES, SAMPLE, escapeAttribute, toPositiveInteger, isSafeImageUrl, parseSrcset, normalizeValues, generateMarkup, mount };
  if (typeof window !== 'undefined') window.MarkBenchResponsiveImageMarkupBuilder = api;
  if (typeof globalThis !== 'undefined') globalThis.MarkBenchResponsiveImageMarkupBuilder = api;
})();
