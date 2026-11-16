(() => {
  'use strict';
  const MAX_EDGE = 4096;
  const MAX_PIXELS = 8_388_608;
  const MAX_TEXT = 120;
  const formats = Object.freeze({
    png: { mime: 'image/png', extension: 'png', label: 'PNG' },
    jpeg: { mime: 'image/jpeg', extension: 'jpg', label: 'JPEG', lossy: true },
    svg: { mime: 'image/svg+xml', extension: 'svg', label: 'SVG' },
    webp: { mime: 'image/webp', extension: 'webp', label: 'WebP', lossy: true },
    avif: { mime: 'image/avif', extension: 'avif', label: 'AVIF', lossy: true },
  });
  const defaults = Object.freeze({ width: 800, height: 450, fontSize: '', background: '#e5e7eb', foreground: '#18243b', text: '', hideText: false, format: 'png', quality: 90 });
  const fontFamily = 'sans-serif';
  const integer = (value, min, max) => {
    const string = String(value);
    return /^\d+$/u.test(string) && Number(string) >= min && Number(string) <= max;
  };
  const escapeXml = value => value.replace(/[&<>"']/gu, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]);

  const validate = (settings, supported) => {
    const { width, height, text, fontSize, background, foreground, quality, format, hideText } = settings;
    const errors = {};
    for (const [key, label, value] of [['width', '幅', width], ['height', '高さ', height]]) {
      if (!integer(value, 1, MAX_EDGE)) errors[key] = `${label}は1〜4,096pxの整数で入力してください。`;
    }
    if (!errors.width && !errors.height && Number(width) * Number(height) > MAX_PIXELS) {
      errors.width = errors.height = '幅×高さを8,388,608px以下にしてください。';
    }
    if (!hideText) {
      if (fontSize !== '' && !integer(fontSize, 1, 512)) errors.fontSize = '文字サイズは空欄（自動）または1〜512pxの整数で入力してください。';
      if (text.length > MAX_TEXT) errors.text = 'テキストは120文字以内で入力してください。';
      else if (/[^\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u.test(text)) errors.text = 'テキストには改行や制御文字を含めないでください。';
      if (!/^#[\da-f]{6}$/iu.test(foreground)) errors.foreground = '文字色は#から始まる6桁のHEXで入力してください。';
    }
    if (!/^#[\da-f]{6}$/iu.test(background)) errors.background = '背景色は#から始まる6桁のHEXで入力してください。';
    if (!Object.hasOwn(formats, format) || !supported.has(format)) errors.format = 'このブラウザでは選択した形式に書き出せません。';
    if (Object.hasOwn(formats, format) && formats[format].lossy && !integer(quality, 10, 100)) errors.quality = '品質は10〜100の整数で入力してください。';
    return { errors, valid: Object.keys(errors).length === 0 };
  };

  const createSvg = ({ width, height, text, hideText, fontSize, background, foreground }, measure) => {
    const label = hideText ? '' : text.trim() || `${width} × ${height}`;
    let textElement = '';
    if (label) {
      const maximum = Math.min(Number(fontSize) || Math.max(10, Math.round(Math.min(width, height) * 0.14)), height * 0.8);
      const naturalWidth = measure(label, maximum);
      const size = Math.min(maximum, maximum * width * 0.88 / (naturalWidth || 1));
      textElement = `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="${fontFamily}" font-weight="700" font-size="${size}" fill="${foreground}" xml:space="preserve">${escapeXml(label)}</text>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${background}"/>${textElement}</svg>`;
  };
  const filename = ({ width, height, format }) => `placeholder-${width}x${height}.${formats[format].extension}`;
  const toBlob = (canvas, mime, quality) => new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob || !blob.size || blob.type !== mime) reject(new Error('Unexpected image format or empty result'));
      else resolve(blob);
    }, mime, quality);
  });

  const mount = ({ workspace, copyText, showToast }) => {
    const numeric = (key, label, min, max, extra = '') => `<label for="placeholder-${key}">${label}<input type="number" id="placeholder-${key}" data-placeholder-setting="${key}" min="${min}" max="${max}" step="1" inputmode="numeric" aria-describedby="placeholder-status" ${extra}></label>`;
    const color = (key, label) => `<div class="placeholder-image__field"><label for="placeholder-${key}">${label}</label><div class="placeholder-image__color"><input type="color" data-placeholder-color="${key}" aria-label="${label}を選択"><input type="text" id="placeholder-${key}" data-placeholder-setting="${key}" aria-describedby="placeholder-status" spellcheck="false" maxlength="7" autocapitalize="off"></div></div>`;
    workspace.innerHTML = `
      <div class="placeholder-image">
        <section class="placeholder-image__settings" aria-labelledby="placeholder-settings-title">
          <div class="workspace-panel__header"><span id="placeholder-settings-title">IMAGE SETTINGS</span><div class="workspace-actions"><button class="workspace-action" type="button" data-placeholder-sample>SAMPLE</button><button class="workspace-action" type="button" data-placeholder-clear>CLEAR</button></div></div>
          <div class="placeholder-image__fields">
            <label class="placeholder-image__wide" for="placeholder-preset">サイズプリセット
              <select id="placeholder-preset" data-placeholder-preset>
                <option value="">CUSTOM</option>
                <option value="800x450">800 × 450 / 16:9</option>
                <option value="600x600">600 × 600 / SQUARE</option>
                <option value="1080x1080">1080 × 1080 / スクエア</option>
                <option value="728x90">728 × 90 / BANNER</option>
                <option value="1200x630">1200 × 630 / OGP</option>
                <option value="1080x1350">1080 × 1350 / PORTRAIT</option>
                <option value="1920x1080">1920 × 1080 / FULL HD</option>
              </select>
            </label>
            ${numeric('width', '幅（px）', 1, MAX_EDGE)}${numeric('height', '高さ（px）', 1, MAX_EDGE)}
            <label class="placeholder-image__wide" for="placeholder-text">表示テキスト<input type="text" id="placeholder-text" data-placeholder-setting="text" maxlength="${MAX_TEXT}" placeholder="空欄なら幅 × 高さ" aria-describedby="placeholder-status" autocapitalize="off" spellcheck="false"></label>
            ${numeric('fontSize', '文字サイズ（px）', 1, 512, 'placeholder="AUTO"')}
            <label class="placeholder-image__toggle"><input type="checkbox" data-placeholder-setting="hideText">テキストなし</label>
            ${color('background', '背景色')}${color('foreground', '文字色')}
            <label for="placeholder-format">出力形式<select id="placeholder-format" data-placeholder-setting="format" aria-describedby="placeholder-status placeholder-format-help">${Object.entries(formats).map(([key, { label }]) => `<option value="${key}">${label}</option>`).join('')}</select></label>
            ${numeric('quality', '品質（%）', 10, 100)}
            <div class="placeholder-image__wide placeholder-image__help" id="placeholder-format-help">
              <p>モックにはPNGがおすすめです。</p>
              <p>SVGは拡大縮小向け、WebP・AVIFは容量を抑えたいとき、JPEGは既存環境との互換性が必要なときに使えます。</p>
              <p>書き出せない形式は選択できません。</p>
            </div>
          </div>
        </section>
        <section class="placeholder-image__output" aria-labelledby="placeholder-preview-title">
          <div class="workspace-panel__header"><span id="placeholder-preview-title">LIVE PREVIEW</span><span data-placeholder-format>—</span></div>
          <div class="image-converter__stage placeholder-image__stage"><span data-placeholder-empty>[ NO PREVIEW ]</span><img alt="ダミー画像のプレビュー" data-placeholder-preview hidden></div>
          <p class="placeholder-image__status" id="placeholder-status" role="status" aria-live="polite" data-placeholder-status></p>
          <dl class="placeholder-image__metrics"><div><dt>DIMENSIONS</dt><dd data-placeholder-dimensions>—</dd></div><div><dt>FILE SIZE</dt><dd data-placeholder-size>—</dd></div></dl>
          <div class="placeholder-image__actions"><button type="button" class="workspace-action" data-copy-value data-placeholder-copy disabled>COPY HTML</button><a class="workspace-action" download data-placeholder-download hidden>DOWNLOAD IMAGE</a></div>
        </section>
      </div>`;

    const find = name => workspace.querySelector(`[data-placeholder-${name}]`);
    const controls = [...workspace.querySelectorAll('[data-placeholder-setting]')];
    const colors = [...workspace.querySelectorAll('[data-placeholder-color]')];
    const byKey = Object.fromEntries(controls.map(control => [control.dataset.placeholderSetting, control]));
    const preset = find('preset');
    const preview = find('preview');
    const copy = find('copy');
    const download = find('download');
    const status = find('status');
    const probe = document.createElement('canvas');
    probe.width = probe.height = 1;
    const measureContext = probe.getContext('2d');
    const supported = new Set(['png', 'svg']);
    for (const option of byKey.format.options) option.disabled = !supported.has(option.value);
    let activeUrl;
    let markup = '';
    let revision = 0;
    let timer;
    let rendering = false;
    let pending = false;

    const discard = () => {
      preview.hidden = true;
      preview.removeAttribute('src');
      find('empty').hidden = false;
      download.hidden = true;
      download.removeAttribute('href');
      if (activeUrl) URL.revokeObjectURL(activeUrl);
      activeUrl = undefined;
      markup = '';
      copy.disabled = true;
      for (const metric of ['format', 'dimensions', 'size']) find(metric).textContent = '—';
    };
    const settings = () => Object.fromEntries(controls.map(control => [control.dataset.placeholderSetting, control.type === 'checkbox' ? control.checked : control.value]));
    const makeImage = async (svg, values) => {
      const vector = new Blob([svg], { type: formats.svg.mime });
      if (values.format === 'svg') return vector;
      const source = URL.createObjectURL(vector);
      const canvas = document.createElement('canvas');
      try {
        const image = new Image();
        image.src = source;
        await image.decode();
        canvas.width = Number(values.width);
        canvas.height = Number(values.height);
        canvas.getContext('2d').drawImage(image, 0, 0);
        return await toBlob(canvas, formats[values.format].mime, Number(values.quality) / 100);
      } finally {
        URL.revokeObjectURL(source);
        canvas.width = canvas.height = 0;
      }
    };
    const render = async () => {
      if (rendering) { pending = true; return; }
      const values = settings();
      const current = revision;
      const result = validate(values, supported);
      if (!values.hideText && byKey.fontSize.validity.badInput) {
        result.errors.fontSize = '文字サイズは空欄（自動）または1〜512pxの整数で入力してください。';
        result.valid = false;
      }
      for (const control of controls) control.setAttribute('aria-invalid', String(Boolean(result.errors[control.dataset.placeholderSetting])));
      const message = [...new Set(Object.values(result.errors))].join(' ');
      status.dataset.state = result.valid ? 'processing' : 'invalid';
      if (!result.valid) { status.textContent = message; return; }
      rendering = true;
      let candidate;
      try {
        values.width = Number(values.width);
        values.height = Number(values.height);
        const svg = createSvg(values, (label, size) => {
          if (!measureContext) throw new Error('Canvas is unavailable');
          measureContext.font = `700 ${size}px ${fontFamily}`;
          return measureContext.measureText(label).width;
        });
        const blob = await makeImage(svg, values);
        if (current !== revision) return;
        candidate = URL.createObjectURL(blob);
        preview.src = candidate;
        await preview.decode();
        if (current !== revision) return;
        activeUrl = candidate;
        download.href = activeUrl;
        download.download = filename(values);
        markup = `<img src="${download.download}" width="${values.width}" height="${values.height}" alt="">`;
        find('empty').hidden = true;
        preview.hidden = download.hidden = copy.disabled = false;
        find('format').textContent = formats[values.format].label;
        find('dimensions').textContent = `${values.width} × ${values.height}px`;
        find('size').textContent = blob.size < 1024 ? `${blob.size} B` : `${(blob.size / 1024).toLocaleString('en-US', { maximumFractionDigits: 1 })} KiB`;
        status.dataset.state = 'ready';
        status.textContent = 'READY / 画像を保存できます。';
      } catch {
        if (current === revision) {
          discard();
          status.dataset.state = 'invalid';
          status.textContent = '画像を生成できませんでした。寸法を小さくするか、別の形式を選択してください。';
        }
      } finally {
        if (candidate && candidate !== activeUrl) URL.revokeObjectURL(candidate);
        rendering = false;
        if (pending) { pending = false; void render(); }
      }
    };
    const schedule = (isComposing = false) => {
      revision += 1;
      clearTimeout(timer);
      pending = false;
      discard();
      const values = settings();
      const lossy = formats[values.format]?.lossy === true;
      byKey.quality.closest('label').hidden = !lossy;
      byKey.quality.disabled = !lossy;
      byKey.text.disabled = byKey.foreground.disabled = byKey.fontSize.disabled = values.hideText;
      for (const picker of colors) {
        const key = picker.dataset.placeholderColor;
        if (/^#[\da-f]{6}$/iu.test(values[key])) picker.value = values[key];
        picker.disabled = key === 'foreground' && values.hideText;
      }
      const size = `${values.width}x${values.height}`;
      preset.value = [...preset.options].some(option => option.value === size) ? size : '';
      status.dataset.state = 'processing';
      status.textContent = isComposing ? 'EDITING / テキストを入力中。' : 'PROCESSING / 画像を生成中。';
      if (!isComposing) timer = setTimeout(render, 160);
    };
    const apply = values => {
      for (const [key, control] of Object.entries(byKey)) {
        if (control.type === 'checkbox') control.checked = values[key];
        else control.value = values[key];
      }
      schedule();
    };

    for (const control of controls) control.addEventListener('input', event => schedule(event.isComposing));
    byKey.text.addEventListener('compositionend', () => schedule());
    for (const picker of colors) picker.addEventListener('input', () => {
      byKey[picker.dataset.placeholderColor].value = picker.value;
      schedule();
    });
    preset.addEventListener('change', () => {
      if (!preset.value) { byKey.width.focus(); return; }
      [byKey.width.value, byKey.height.value] = preset.value.split('x');
      schedule();
    });
    find('sample').addEventListener('click', () => apply({ ...defaults, width: 1200, height: 630, text: 'MARK BENCH / OGP', background: '#18243b', foreground: '#e5e7eb' }));
    find('clear').addEventListener('click', () => {
      apply(defaults);
      byKey.width.focus();
      showToast('表示内容をリセットしました。', 'reset');
    });
    copy.addEventListener('click', () => copyText(markup));
    download.addEventListener('click', () => {
      if (activeUrl) showToast('ダウンロードを実行しました。', 'download');
    });
    apply(defaults);
    for (const format of ['jpeg', 'webp', 'avif']) {
      const option = byKey.format.querySelector(`option[value="${format}"]`);
      toBlob(probe, formats[format].mime, 0.9).then(() => {
        supported.add(format);
        option.disabled = false;
      }, () => { option.textContent = `${formats[format].label}（未対応）`; });
    }
    window.addEventListener('pagehide', event => {
      if (event.persisted) return;
      clearTimeout(timer);
      revision += 1;
      pending = false;
      discard();
    });
  };

  globalThis.MarkBenchPlaceholderImageGenerator = { MAX_EDGE, MAX_PIXELS, MAX_TEXT, defaults, formats, validate, createSvg, filename, toBlob, mount };
})();
