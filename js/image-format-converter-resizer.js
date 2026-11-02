(() => {
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const MAX_OUTPUT_DIMENSION = 8192;
  const MAX_OUTPUT_PIXELS = 50_000_000;
  const SUPPORTED_INPUT_TYPES = Object.freeze(['image/png', 'image/jpeg', 'image/webp']);
  const OUTPUT_FORMATS = Object.freeze({
    png: { mime: 'image/png', extension: 'png', label: 'PNG' },
    jpeg: { mime: 'image/jpeg', extension: 'jpg', label: 'JPEG' },
    webp: { mime: 'image/webp', extension: 'webp', label: 'WebP' },
  });

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const parseDimension = (value, fallback = 1) => {
    const number = Number.parseInt(String(value), 10);
    return Number.isFinite(number) ? clamp(number, 1, MAX_OUTPUT_DIMENSION) : fallback;
  };
  const normalizeOutputFormat = (value) => Object.hasOwn(OUTPUT_FORMATS, value) ? value : 'webp';
  const formatBytes = (bytes = 0) => {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 ** 2) return `${(value / 1024).toFixed(value < 10 * 1024 ? 1 : 0)} KB`;
    return `${(value / 1024 ** 2).toFixed(2)} MB`;
  };
  const createOutputName = (inputName, width, height, format) => {
    const base = String(inputName || 'image').replace(/\.[^.]+$/u, '').replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/gu, '') || 'image';
    const normalizedFormat = normalizeOutputFormat(format);
    return `${base}-${width}x${height}.${OUTPUT_FORMATS[normalizedFormat].extension}`;
  };
  const calculateDimensions = (originalWidth, originalHeight, targetWidth, targetHeight, options = {}) => {
    const sourceWidth = Math.max(1, Number(originalWidth) || 1);
    const sourceHeight = Math.max(1, Number(originalHeight) || 1);
    const lockAspect = options.lockAspect !== false;
    const changedAxis = options.changedAxis === 'height' ? 'height' : 'width';
    let width = parseDimension(targetWidth, Math.min(sourceWidth, MAX_OUTPUT_DIMENSION));
    let height = parseDimension(targetHeight, Math.min(sourceHeight, MAX_OUTPUT_DIMENSION));
    if (lockAspect) {
      const ratio = sourceWidth / sourceHeight;
      if (changedAxis === 'height') width = clamp(Math.round(height * ratio), 1, MAX_OUTPUT_DIMENSION);
      else height = clamp(Math.round(width / ratio), 1, MAX_OUTPUT_DIMENSION);
    }
    return { width, height, ratio: width / height, pixels: width * height };
  };
  const fitWithinLimit = (width, height) => {
    const dimensionScale = Math.min(1, MAX_OUTPUT_DIMENSION / width, MAX_OUTPUT_DIMENSION / height);
    const pixelScale = Math.min(1, Math.sqrt(MAX_OUTPUT_PIXELS / (width * height)));
    const scale = Math.min(dimensionScale, pixelScale);
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
  };
  const validateFile = (file) => {
    if (!file) return { valid: false, error: '画像ファイルを選択してください。' };
    if (!SUPPORTED_INPUT_TYPES.includes(file.type)) return { valid: false, error: 'PNG・JPEG・WebP画像を選択してください。' };
    if (file.size > MAX_FILE_SIZE) return { valid: false, error: `ファイルサイズは${formatBytes(MAX_FILE_SIZE)}以下にしてください。` };
    return { valid: true, error: null };
  };
  const validateOutputDimensions = (width, height) => {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) return { valid: false, error: '幅と高さは1以上の整数で入力してください。' };
    if (width > MAX_OUTPUT_DIMENSION || height > MAX_OUTPUT_DIMENSION) return { valid: false, error: `出力サイズは各辺${MAX_OUTPUT_DIMENSION.toLocaleString('en-US')}px以下にしてください。` };
    if (width * height > MAX_OUTPUT_PIXELS) return { valid: false, error: `出力画素数は${MAX_OUTPUT_PIXELS.toLocaleString('en-US')}px以下にしてください。` };
    return { valid: true, error: null };
  };

  const canvasToBlob = (canvas, mime, quality) => new Promise((resolve) => canvas.toBlob(resolve, mime, quality));

  const mount = ({ workspace, showToast, escapeMarkup }) => {
    workspace.innerHTML = `
      <div class="image-converter">
        <div class="workspace-grid workspace-grid--image-converter">
          <section class="image-converter__upload" aria-labelledby="image-upload-title">
            <div class="workspace-panel__header"><span id="image-upload-title">SOURCE IMAGE</span><div class="workspace-actions"><button class="workspace-action" type="button" data-image-reset disabled>RESET</button></div></div>
            <div class="image-converter__drop-zone" tabindex="0" role="button" aria-describedby="image-drop-help" data-image-drop-zone>
              <input class="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" data-image-file>
              <strong>DROP IMAGE HERE</strong><span>OR CLICK TO SELECT</span><small id="image-drop-help">PNG / JPEG / WebP · MAX ${formatBytes(MAX_FILE_SIZE)}</small>
            </div>
            <div class="workspace-panel__footer"><span data-image-source-state data-state="empty" aria-live="polite">NO IMAGE</span><span data-image-source-name>WAITING FOR FILE</span></div>
          </section>

          <section class="image-converter__preview image-converter__preview--source" aria-labelledby="image-source-preview-title">
            <div class="workspace-panel__header"><span id="image-source-preview-title">INPUT PREVIEW</span><span data-image-input-type>—</span></div>
            <div class="image-converter__stage"><div class="image-converter__empty" data-image-source-empty><span>[ NO_SOURCE_IMAGE ]</span></div><img alt="変換元画像のプレビュー" data-image-source-preview hidden></div>
            <dl class="image-converter__image-info"><div><dt>DIMENSIONS</dt><dd data-image-input-dimensions>—</dd></div><div><dt>FILE SIZE</dt><dd data-image-input-size>—</dd></div></dl>
          </section>

          <section class="image-converter__settings" aria-labelledby="image-settings-title">
            <div class="workspace-panel__header"><span id="image-settings-title">OUTPUT SETTINGS</span><span data-image-settings-state>ADD IMAGE FIRST</span></div>
            <div class="image-converter__settings-body">
              <fieldset class="image-converter__format"><legend>FORMAT</legend><label><input type="radio" name="image-format" value="png" data-image-format><span>PNG</span></label><label><input type="radio" name="image-format" value="jpeg" data-image-format><span>JPEG</span></label><label><input type="radio" name="image-format" value="webp" data-image-format checked><span>WebP</span></label></fieldset>
              <div class="image-converter__dimensions"><label><span>WIDTH / PX</span><input type="number" min="1" max="${MAX_OUTPUT_DIMENSION}" value="1" disabled data-image-width></label><button type="button" aria-pressed="true" disabled data-image-lock><span aria-hidden="true">↔</span> LOCK RATIO</button><label><span>HEIGHT / PX</span><input type="number" min="1" max="${MAX_OUTPUT_DIMENSION}" value="1" disabled data-image-height></label></div>
              <div class="image-converter__scale"><span>SCALE PRESET</span><div><button type="button" data-image-scale="0.25" disabled>25%</button><button type="button" data-image-scale="0.5" disabled>50%</button><button type="button" data-image-scale="0.75" disabled>75%</button><button type="button" data-image-scale="1" disabled>100%</button></div></div>
              <label class="image-converter__quality"><span>QUALITY <output data-image-quality-output>85%</output></span><input type="range" min="10" max="100" step="1" value="85" data-image-quality></label>
              <label class="image-converter__background"><span>JPEG BACKGROUND</span><span><input type="color" value="#ffffff" data-image-background-color><input type="text" maxlength="7" value="#ffffff" pattern="#[0-9a-fA-F]{6}" spellcheck="false" data-image-background-text></span></label>
            </div>
            <button class="image-converter__convert" type="button" data-image-convert disabled>CONVERT IMAGE</button>
          </section>

          <section class="image-converter__preview image-converter__preview--output" aria-labelledby="image-output-preview-title">
            <div class="workspace-panel__header"><span id="image-output-preview-title">OUTPUT PREVIEW</span></div>
            <div class="image-converter__stage"><div class="image-converter__empty" data-image-output-empty><span>[ NOT_CONVERTED ]</span></div><img alt="変換後画像のプレビュー" data-image-output-preview hidden></div>
            <dl class="image-converter__image-info"><div><dt>DIMENSIONS</dt><dd data-image-output-dimensions>—</dd></div><div><dt>FILE SIZE</dt><dd data-image-output-size>—</dd></div></dl>
          </section>

          <section class="image-converter__status" aria-live="polite"><strong data-image-output-state>WAITING FOR IMAGE</strong><span data-image-output-message>画像を選択すると変換設定を利用できます。</span></section>

          <dl class="image-converter__metrics" aria-label="画像変換の集計結果">
            <div><dt>INPUT FORMAT</dt><dd data-image-metric="inputFormat">—</dd></div>
            <div><dt>OUTPUT FORMAT</dt><dd data-image-metric="outputFormat">WEBP</dd></div>
            <div><dt>INPUT PIXELS</dt><dd data-image-metric="inputPixels">0</dd></div>
            <div><dt>OUTPUT PIXELS</dt><dd data-image-metric="outputPixels">0</dd></div>
            <div><dt>SIZE CHANGE</dt><dd data-image-metric="sizeChange">—</dd></div>
            <div><dt>METADATA</dt><dd>REMOVED</dd></div>
          </dl>
          <a class="workspace-action image-converter__download" href="#" download hidden data-image-download>DOWNLOAD IMAGE</a>
        </div>
      </div>`;

    const fileInput = workspace.querySelector('[data-image-file]');
    const dropZone = workspace.querySelector('[data-image-drop-zone]');
    const sourcePreview = workspace.querySelector('[data-image-source-preview]');
    const outputPreview = workspace.querySelector('[data-image-output-preview]');
    const widthInput = workspace.querySelector('[data-image-width]');
    const heightInput = workspace.querySelector('[data-image-height]');
    const lockButton = workspace.querySelector('[data-image-lock]');
    const qualityInput = workspace.querySelector('[data-image-quality]');
    const backgroundColor = workspace.querySelector('[data-image-background-color]');
    const backgroundText = workspace.querySelector('[data-image-background-text]');
    const convertButton = workspace.querySelector('[data-image-convert]');
    const resetButton = workspace.querySelector('[data-image-reset]');
    const downloadLink = workspace.querySelector('[data-image-download]');
    const statusPanel = workspace.querySelector('.image-converter__status');
    let currentFile = null;
    let sourceUrl = '';
    let outputUrl = '';
    let outputBlob = null;
    let originalWidth = 0;
    let originalHeight = 0;
    let aspectLocked = true;
    let loadToken = 0;

    const selectedFormat = () => normalizeOutputFormat(workspace.querySelector('[data-image-format]:checked')?.value);
    const setStatus = (state, message, status = 'empty') => {
      workspace.querySelector('[data-image-output-state]').textContent = state;
      workspace.querySelector('[data-image-output-message]').textContent = message;
      statusPanel.dataset.state = status;
    };
    const revokeUrl = (url) => { if (url) URL.revokeObjectURL(url); };
    const clearOutput = () => {
      revokeUrl(outputUrl);
      outputUrl = '';
      outputBlob = null;
      outputPreview.removeAttribute('src');
      outputPreview.hidden = true;
      workspace.querySelector('[data-image-output-empty]').hidden = false;
      workspace.querySelector('[data-image-output-dimensions]').textContent = '—';
      workspace.querySelector('[data-image-output-size]').textContent = '—';
      downloadLink.hidden = true;
      downloadLink.removeAttribute('href');
      workspace.querySelector('[data-image-metric="sizeChange"]').textContent = '—';
    };
    const updateSettings = () => {
      const format = selectedFormat();
      const hasImage = Boolean(currentFile && originalWidth && originalHeight);
      workspace.querySelector('[data-image-metric="outputFormat"]').textContent = OUTPUT_FORMATS[format].label.toUpperCase();
      workspace.querySelector('[data-image-settings-state]').textContent = hasImage ? `${widthInput.value} × ${heightInput.value} PX` : 'ADD IMAGE FIRST';
      workspace.querySelectorAll('[data-image-scale]').forEach((button) => { button.disabled = !hasImage; });
      widthInput.disabled = !hasImage;
      heightInput.disabled = !hasImage;
      lockButton.disabled = !hasImage;
      convertButton.disabled = !hasImage;
      qualityInput.disabled = format === 'png';
      workspace.querySelector('.image-converter__quality').classList.toggle('is-disabled', format === 'png');
      workspace.querySelector('.image-converter__background').classList.toggle('is-disabled', format !== 'jpeg');
      backgroundColor.disabled = format !== 'jpeg';
      backgroundText.disabled = format !== 'jpeg';
    };
    const markSettingsChanged = () => {
      clearOutput();
      updateSettings();
      if (currentFile) setStatus('SETTINGS CHANGED', 'CONVERT IMAGEを押して出力を更新してください。', 'ready');
    };
    const syncDimension = (changedAxis) => {
      if (!currentFile) return;
      const dimensions = calculateDimensions(originalWidth, originalHeight, widthInput.value, heightInput.value, { lockAspect: aspectLocked, changedAxis });
      widthInput.value = dimensions.width;
      heightInput.value = dimensions.height;
      workspace.querySelector('[data-image-settings-state]').textContent = `${dimensions.width} × ${dimensions.height} PX`;
      workspace.querySelector('[data-image-metric="outputPixels"]').textContent = dimensions.pixels.toLocaleString('en-US');
      markSettingsChanged();
    };

    const reset = () => {
      loadToken += 1;
      revokeUrl(sourceUrl);
      sourceUrl = '';
      clearOutput();
      currentFile = null;
      originalWidth = 0;
      originalHeight = 0;
      aspectLocked = true;
      fileInput.value = '';
      sourcePreview.removeAttribute('src');
      sourcePreview.hidden = true;
      workspace.querySelector('[data-image-source-empty]').hidden = false;
      workspace.querySelector('[data-image-source-state]').textContent = 'NO IMAGE';
      workspace.querySelector('[data-image-source-state]').dataset.state = 'empty';
      workspace.querySelector('[data-image-source-name]').textContent = 'WAITING FOR FILE';
      workspace.querySelector('[data-image-input-type]').textContent = '—';
      workspace.querySelector('[data-image-input-dimensions]').textContent = '—';
      workspace.querySelector('[data-image-input-size]').textContent = '—';
      workspace.querySelector('[data-image-metric="inputFormat"]').textContent = '—';
      workspace.querySelector('[data-image-metric="inputPixels"]').textContent = '0';
      workspace.querySelector('[data-image-metric="outputPixels"]').textContent = '0';
      widthInput.value = '1';
      heightInput.value = '1';
      lockButton.setAttribute('aria-pressed', 'true');
      workspace.querySelectorAll('[data-image-format]').forEach((control) => { control.checked = control.value === 'webp'; });
      qualityInput.value = '85';
      workspace.querySelector('[data-image-quality-output]').textContent = '85%';
      backgroundColor.value = '#ffffff';
      backgroundText.value = '#ffffff';
      resetButton.disabled = true;
      updateSettings();
      setStatus('WAITING FOR IMAGE', '画像を選択すると変換設定を利用できます。');
    };

    const loadFile = async (file) => {
      const token = ++loadToken;
      const validation = validateFile(file);
      if (!validation.valid) {
        workspace.querySelector('[data-image-source-state]').textContent = 'FILE ERROR';
        workspace.querySelector('[data-image-source-state]').dataset.state = 'invalid';
        setStatus('FILE ERROR', validation.error, 'invalid');
        showToast(validation.error);
        return;
      }
      revokeUrl(sourceUrl);
      clearOutput();
      sourceUrl = URL.createObjectURL(file);
      sourcePreview.src = sourceUrl;
      try {
        await sourcePreview.decode();
      } catch {
        if (token !== loadToken) return;
        setStatus('DECODE ERROR', '画像を読み込めませんでした。別のファイルを選択してください。', 'invalid');
        return;
      }
      if (token !== loadToken) return;
      currentFile = file;
      originalWidth = sourcePreview.naturalWidth;
      originalHeight = sourcePreview.naturalHeight;
      const initial = fitWithinLimit(originalWidth, originalHeight);
      widthInput.value = initial.width;
      heightInput.value = initial.height;
      sourcePreview.hidden = false;
      workspace.querySelector('[data-image-source-empty]').hidden = true;
      workspace.querySelector('[data-image-source-state]').textContent = 'IMAGE READY';
      workspace.querySelector('[data-image-source-state]').dataset.state = 'ready';
      workspace.querySelector('[data-image-source-name]').textContent = file.name;
      workspace.querySelector('[data-image-input-type]').textContent = file.type.replace('image/', '').toUpperCase();
      workspace.querySelector('[data-image-input-dimensions]').textContent = `${originalWidth.toLocaleString('en-US')} × ${originalHeight.toLocaleString('en-US')} PX`;
      workspace.querySelector('[data-image-input-size]').textContent = formatBytes(file.size);
      workspace.querySelector('[data-image-metric="inputFormat"]').textContent = file.type.replace('image/', '').toUpperCase();
      workspace.querySelector('[data-image-metric="inputPixels"]').textContent = (originalWidth * originalHeight).toLocaleString('en-US');
      workspace.querySelector('[data-image-metric="outputPixels"]').textContent = (initial.width * initial.height).toLocaleString('en-US');
      resetButton.disabled = false;
      updateSettings();
      setStatus('IMAGE READY', '出力設定を確認してCONVERT IMAGEを押してください。', 'ready');
    };

    const convert = async () => {
      if (!currentFile) return;
      const width = Number.parseInt(widthInput.value, 10);
      const height = Number.parseInt(heightInput.value, 10);
      const validation = validateOutputDimensions(width, height);
      if (!validation.valid) { setStatus('SIZE ERROR', validation.error, 'invalid'); return; }
      const format = selectedFormat();
      const { mime } = OUTPUT_FORMATS[format];
      const quality = Number(qualityInput.value) / 100;
      convertButton.disabled = true;
      convertButton.textContent = 'CONVERTING...';
      setStatus('CONVERTING', 'ブラウザ内で画像を処理しています。', 'ready');
      await new Promise((resolve) => requestAnimationFrame(resolve));
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { alpha: format !== 'jpeg' });
        if (!context) throw new Error('Canvas context unavailable');
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        if (format === 'jpeg') {
          context.fillStyle = /^#[\da-f]{6}$/iu.test(backgroundText.value) ? backgroundText.value : '#ffffff';
          context.fillRect(0, 0, width, height);
        }
        context.drawImage(sourcePreview, 0, 0, width, height);
        const blob = await canvasToBlob(canvas, mime, quality);
        if (!blob || blob.type !== mime) throw new Error('Requested format unsupported');
        clearOutput();
        outputBlob = blob;
        outputUrl = URL.createObjectURL(blob);
        outputPreview.src = outputUrl;
        await outputPreview.decode();
        outputPreview.hidden = false;
        workspace.querySelector('[data-image-output-empty]').hidden = true;
        workspace.querySelector('[data-image-output-dimensions]').textContent = `${width.toLocaleString('en-US')} × ${height.toLocaleString('en-US')} PX`;
        workspace.querySelector('[data-image-output-size]').textContent = formatBytes(blob.size);
        const change = currentFile.size ? ((blob.size - currentFile.size) / currentFile.size) * 100 : 0;
        workspace.querySelector('[data-image-metric="sizeChange"]').textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        downloadLink.href = outputUrl;
        downloadLink.download = createOutputName(currentFile.name, width, height, format);
        downloadLink.hidden = false;
        setStatus('CONVERSION COMPLETE', `${OUTPUT_FORMATS[format].label} / ${formatBytes(blob.size)} / ${downloadLink.download}`, 'ready');
      } catch {
        clearOutput();
        setStatus('CONVERSION ERROR', 'このブラウザでは指定形式へ変換できませんでした。', 'invalid');
      } finally {
        convertButton.disabled = false;
        convertButton.textContent = 'CONVERT IMAGE';
      }
    };

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); }
    });
    ['dragenter', 'dragover'].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
    ['dragleave', 'drop'].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
    dropZone.addEventListener('drop', (event) => loadFile(event.dataTransfer?.files?.[0]));
    fileInput.addEventListener('change', () => loadFile(fileInput.files?.[0]));
    widthInput.addEventListener('change', () => syncDimension('width'));
    heightInput.addEventListener('change', () => syncDimension('height'));
    lockButton.addEventListener('click', () => {
      aspectLocked = !aspectLocked;
      lockButton.setAttribute('aria-pressed', String(aspectLocked));
      if (aspectLocked) syncDimension('width');
      else markSettingsChanged();
    });
    workspace.querySelectorAll('[data-image-scale]').forEach((button) => button.addEventListener('click', () => {
      if (!currentFile) return;
      const scale = Number(button.dataset.imageScale);
      const fitted = fitWithinLimit(Math.max(1, Math.round(originalWidth * scale)), Math.max(1, Math.round(originalHeight * scale)));
      widthInput.value = fitted.width;
      heightInput.value = fitted.height;
      workspace.querySelector('[data-image-metric="outputPixels"]').textContent = (fitted.width * fitted.height).toLocaleString('en-US');
      markSettingsChanged();
    }));
    workspace.querySelectorAll('[data-image-format]').forEach((control) => control.addEventListener('change', markSettingsChanged));
    qualityInput.addEventListener('input', () => { workspace.querySelector('[data-image-quality-output]').textContent = `${qualityInput.value}%`; markSettingsChanged(); });
    const syncBackground = (value) => {
      const normalized = /^#[\da-f]{6}$/iu.test(value) ? value.toLowerCase() : '#ffffff';
      backgroundColor.value = normalized;
      backgroundText.value = normalized;
      markSettingsChanged();
    };
    backgroundColor.addEventListener('input', () => syncBackground(backgroundColor.value));
    backgroundText.addEventListener('change', () => syncBackground(backgroundText.value));
    convertButton.addEventListener('click', convert);
    resetButton.addEventListener('click', reset);
    window.addEventListener('pagehide', () => { revokeUrl(sourceUrl); revokeUrl(outputUrl); }, { once: true });
    updateSettings();
  };

  const api = {
    MAX_FILE_SIZE,
    MAX_OUTPUT_DIMENSION,
    MAX_OUTPUT_PIXELS,
    SUPPORTED_INPUT_TYPES,
    OUTPUT_FORMATS,
    parseDimension,
    normalizeOutputFormat,
    formatBytes,
    createOutputName,
    calculateDimensions,
    fitWithinLimit,
    validateFile,
    validateOutputDimensions,
    mount,
  };

  if (typeof window !== 'undefined') window.MarkBenchImageFormatConverterResizer = api;
  if (typeof globalThis !== 'undefined') globalThis.MarkBenchImageFormatConverterResizer = api;
})();
