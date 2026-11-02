(() => {
  const MAX_TEXT_LENGTH = 1_000_000;
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const BYTE_CHUNK_SIZE = 0x8000;
  const encoder = new TextEncoder();

  const formatBytes = (bytes = 0) => {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 ** 2) return `${(value / 1024).toFixed(value < 10 * 1024 ? 1 : 0)} KB`;
    return `${(value / 1024 ** 2).toFixed(2)} MB`;
  };
  const bytesToBase64 = (input) => {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input || 0);
    let binary = '';
    for (let index = 0; index < bytes.length; index += BYTE_CHUNK_SIZE) {
      binary += String.fromCharCode(...bytes.subarray(index, index + BYTE_CHUNK_SIZE));
    }
    return btoa(binary);
  };
  const normalizeBase64 = (value = '') => {
    const compact = String(value).replace(/\s+/gu, '').replace(/-/gu, '+').replace(/_/gu, '/');
    if (!compact) return '';
    if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(compact) || compact.length % 4 === 1) throw new Error('Base64の文字列またはパディングを確認してください。');
    return compact.padEnd(Math.ceil(compact.length / 4) * 4, '=');
  };
  const base64ToBytes = (value = '') => {
    const normalized = normalizeBase64(value);
    if (!normalized) return new Uint8Array();
    let binary;
    try { binary = atob(normalized); } catch { throw new Error('Base64をデコードできませんでした。'); }
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  };
  const toBase64Url = (value = '') => String(value).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/gu, '');
  const encodeText = (value = '') => bytesToBase64(encoder.encode(String(value)));
  const decodeBytesToText = (bytes, charset = 'utf-8', fatal = true) => {
    try { return new TextDecoder(charset || 'utf-8', { fatal }).decode(bytes); }
    catch { throw new Error(`${charset || 'utf-8'}のテキストとしてデコードできませんでした。`); }
  };
  const decodeBase64ToText = (value = '', charset = 'utf-8') => decodeBytesToText(base64ToBytes(value), charset);
  const isTextMime = (mime = '') => /^(?:text\/|application\/(?:json|ld\+json|javascript|xml|xhtml\+xml)|image\/svg\+xml)/iu.test(String(mime));
  const buildDataUrl = (mime = 'text/plain', base64 = '', options = {}) => {
    const normalizedMime = String(mime || 'application/octet-stream').trim().toLowerCase();
    const charset = options.charset && isTextMime(normalizedMime) ? `;charset=${String(options.charset).toLowerCase()}` : '';
    return `data:${normalizedMime}${charset};base64,${String(base64)}`;
  };
  const percentPayloadToBytes = (payload = '') => {
    const bytes = [];
    for (let index = 0; index < payload.length;) {
      if (payload[index] === '%' && /^[\da-f]{2}$/iu.test(payload.slice(index + 1, index + 3))) {
        bytes.push(Number.parseInt(payload.slice(index + 1, index + 3), 16));
        index += 3;
      } else {
        const codePoint = String.fromCodePoint(payload.codePointAt(index));
        bytes.push(...encoder.encode(codePoint));
        index += codePoint.length;
      }
    }
    return Uint8Array.from(bytes);
  };
  const parseDataUrl = (value = '') => {
    const input = String(value).trim();
    const match = input.match(/^data:([^,]*),(.*)$/isu);
    if (!match) throw new Error('data:で始まる有効なData URLを入力してください。');
    const metadata = match[1];
    const payload = match[2];
    const tokens = metadata ? metadata.split(';') : [];
    let mime = 'text/plain';
    if (tokens[0]?.includes('/')) mime = tokens.shift().toLowerCase();
    const base64 = tokens.some((token) => token.toLowerCase() === 'base64');
    const parameters = {};
    tokens.forEach((token) => {
      if (token.toLowerCase() === 'base64') return;
      const separator = token.indexOf('=');
      if (separator > 0) parameters[token.slice(0, separator).toLowerCase()] = token.slice(separator + 1);
    });
    let bytes;
    try { bytes = base64 ? base64ToBytes(payload) : percentPayloadToBytes(payload); }
    catch (error) { throw new Error(`Data URLのペイロードが不正です。${error.message}`); }
    return { mime, charset: parameters.charset || (isTextMime(mime) ? 'utf-8' : ''), base64, parameters, payload, bytes };
  };
  const decodeInput = (value = '') => {
    const input = String(value).trim();
    if (!input) throw new Error('デコードするBase64またはData URLを入力してください。');
    if (input.startsWith('data:')) {
      const parsed = parseDataUrl(input);
      const text = isTextMime(parsed.mime) ? decodeBytesToText(parsed.bytes, parsed.charset || 'utf-8') : null;
      return { ...parsed, text, sourceType: 'DATA URL' };
    }
    const bytes = base64ToBytes(input);
    let text = null;
    try { text = decodeBytesToText(bytes); } catch { /* Binary Base64 without MIME metadata. */ }
    return { mime: text === null ? 'application/octet-stream' : 'text/plain', charset: text === null ? '' : 'utf-8', base64: true, parameters: {}, payload: input, bytes, text, sourceType: /[-_]/u.test(input) ? 'BASE64URL' : 'BASE64' };
  };
  const extensionForMime = (mime = '') => ({
    'text/plain': 'txt', 'text/html': 'html', 'text/css': 'css', 'text/csv': 'csv', 'application/json': 'json', 'application/javascript': 'js', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/avif': 'avif', 'image/svg+xml': 'svg', 'application/pdf': 'pdf',
  })[mime.toLowerCase()] || 'bin';

  const mount = ({ workspace, copyText, showToast, escapeMarkup }) => {
    workspace.innerHTML = `
      <div class="base64-converter" data-base64-mode="text">
        <div class="workspace-grid workspace-grid--base64-converter">
          <section class="base64-converter__modes" aria-labelledby="base64-mode-title">
            <div class="workspace-panel__header"><span id="base64-mode-title">CONVERSION MODE</span><div class="workspace-actions"><button class="workspace-action" type="button" data-base64-sample>SAMPLE</button><button class="workspace-action" type="button" data-base64-reset disabled>RESET</button></div></div>
            <div class="base64-converter__mode-list" role="tablist" aria-label="変換モード"><button type="button" role="tab" aria-selected="true" data-base64-mode-button="text">TEXT ENCODE</button><button type="button" role="tab" aria-selected="false" data-base64-mode-button="decode">BASE64 DECODE</button><button type="button" role="tab" aria-selected="false" data-base64-mode-button="file">FILE → DATA URL</button></div>
          </section>

          <section class="base64-converter__panel base64-converter__input" aria-labelledby="base64-input-title">
            <div class="workspace-panel__header"><span id="base64-input-title" data-base64-input-title>TEXT INPUT</span><span data-base64-input-state>INPUT EMPTY</span></div>
            <div class="base64-converter__text-input" data-base64-input-pane="text"><textarea maxlength="${MAX_TEXT_LENGTH}" placeholder="Base64へ変換するテキストを入力" spellcheck="false" data-base64-text></textarea></div>
            <div class="base64-converter__text-input" data-base64-input-pane="decode" hidden><textarea maxlength="${MAX_TEXT_LENGTH}" placeholder="Base64・Base64URL・Data URLを入力" spellcheck="false" data-base64-decode></textarea></div>
            <div class="base64-converter__file-input" data-base64-input-pane="file" hidden><div class="base64-converter__drop-zone" role="button" tabindex="0" data-base64-drop-zone><input class="visually-hidden" type="file" data-base64-file><strong>DROP FILE HERE</strong><span>OR CLICK TO SELECT</span><small>ANY FILE · MAX ${formatBytes(MAX_FILE_SIZE)}</small></div><div class="base64-converter__file-meta"><span data-base64-file-name>NO FILE</span><span data-base64-file-size>—</span></div></div>
          </section>

          <section class="base64-converter__panel base64-converter__settings" aria-labelledby="base64-settings-title">
            <div class="workspace-panel__header"><span id="base64-settings-title">OUTPUT SETTINGS</span><span data-base64-settings-state>ENCODE</span></div>
            <div class="base64-converter__settings-body">
              <fieldset class="base64-converter__format" data-base64-format-options><legend>FORMAT</legend><label><input type="radio" name="base64-format" value="base64" data-base64-format checked><span>BASE64</span></label><label><input type="radio" name="base64-format" value="base64url" data-base64-format><span>BASE64URL</span></label><label><input type="radio" name="base64-format" value="dataurl" data-base64-format><span>DATA URL</span></label></fieldset>
              <label class="base64-converter__mime"><span>MIME TYPE</span><input type="text" maxlength="200" value="text/plain" placeholder="text/plain" spellcheck="false" data-base64-mime></label>
              <label class="base64-converter__charset"><span>TEXT CHARSET</span><select data-base64-charset><option value="utf-8">UTF-8</option></select></label>
              <div class="base64-converter__settings-note"><strong data-base64-settings-note-title>UTF-8 SAFE</strong><span data-base64-settings-note>日本語や絵文字をバイト列へ変換してからエンコードします。</span></div>
            </div>
          </section>

          <section class="base64-converter__panel base64-converter__output" aria-labelledby="base64-output-title">
            <div class="workspace-panel__header"><span id="base64-output-title">CONVERSION OUTPUT</span><div class="workspace-actions"><a class="workspace-action base64-converter__download" href="#" download hidden data-base64-download>DOWNLOAD</a><button class="workspace-action workspace-action--copy" type="button" data-base64-copy disabled>COPY OUTPUT</button></div></div>
            <textarea readonly aria-label="変換結果" data-base64-output placeholder="変換結果を表示します"></textarea>
            <div class="workspace-panel__footer"><span data-base64-output-state data-state="empty">OUTPUT EMPTY</span><span data-base64-output-summary>0 CHARACTERS</span></div>
          </section>

          <section class="base64-converter__panel base64-converter__preview" aria-labelledby="base64-preview-title">
            <div class="workspace-panel__header"><span id="base64-preview-title">DATA INSPECTOR</span><span data-base64-detection>WAITING</span></div>
            <div class="base64-converter__preview-body"><div class="base64-converter__visual" data-base64-visual><span>[ NO_DATA ]</span><img alt="Data URL画像プレビュー" data-base64-image-preview hidden></div><dl><div><dt>CONTENT TYPE</dt><dd data-base64-info="mime">—</dd></div><div><dt>CHARSET</dt><dd data-base64-info="charset">—</dd></div><div><dt>TRANSFER</dt><dd data-base64-info="transfer">—</dd></div><div><dt>PREVIEW</dt><dd data-base64-info="preview">EMPTY</dd></div></dl></div>
          </section>

          <section class="base64-converter__status" aria-live="polite" data-state="empty"><strong data-base64-status>WAITING FOR INPUT</strong><span data-base64-message>モードを選択して変換するデータを入力してください。</span></section>
          <dl class="base64-converter__metrics" aria-label="Base64変換の集計結果"><div><dt>INPUT CHARS</dt><dd data-base64-metric="inputChars">0</dd></div><div><dt>INPUT BYTES</dt><dd data-base64-metric="inputBytes">0 B</dd></div><div><dt>OUTPUT CHARS</dt><dd data-base64-metric="outputChars">0</dd></div><div><dt>DATA BYTES</dt><dd data-base64-metric="dataBytes">0 B</dd></div><div><dt>MIME</dt><dd data-base64-metric="mime">—</dd></div><div><dt>ENCODING</dt><dd data-base64-metric="encoding">—</dd></div></dl>
        </div>
      </div>`;

    const root = workspace.querySelector('.base64-converter');
    const textInput = workspace.querySelector('[data-base64-text]');
    const decodeInputField = workspace.querySelector('[data-base64-decode]');
    const fileInput = workspace.querySelector('[data-base64-file]');
    const dropZone = workspace.querySelector('[data-base64-drop-zone]');
    const mimeInput = workspace.querySelector('[data-base64-mime]');
    const formatOptions = workspace.querySelector('[data-base64-format-options]');
    const output = workspace.querySelector('[data-base64-output]');
    const copyButton = workspace.querySelector('[data-base64-copy]');
    const resetButton = workspace.querySelector('[data-base64-reset]');
    const downloadLink = workspace.querySelector('[data-base64-download]');
    const previewImage = workspace.querySelector('[data-base64-image-preview]');
    const visual = workspace.querySelector('[data-base64-visual]');
    let mode = 'text';
    let file = null;
    let fileBytes = null;
    let objectUrl = '';
    let outputValue = '';
    let renderToken = 0;

    const selectedFormat = () => workspace.querySelector('[data-base64-format]:checked')?.value || 'base64';
    const revokeObjectUrl = () => { if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = ''; };
    const setStatus = (state, message, status = 'ready') => {
      workspace.querySelector('[data-base64-status]').textContent = state;
      workspace.querySelector('[data-base64-message]').textContent = message;
      workspace.querySelector('.base64-converter__status').dataset.state = status;
    };
    const updateMetrics = (values) => Object.entries(values).forEach(([key, value]) => { workspace.querySelector(`[data-base64-metric="${key}"]`).textContent = value; });
    const setInfo = ({ mime = '—', charset = '—', transfer = '—', preview = 'EMPTY' } = {}) => {
      workspace.querySelector('[data-base64-info="mime"]').textContent = mime;
      workspace.querySelector('[data-base64-info="charset"]').textContent = charset;
      workspace.querySelector('[data-base64-info="transfer"]').textContent = transfer;
      workspace.querySelector('[data-base64-info="preview"]').textContent = preview;
    };
    const clearPreview = () => {
      revokeObjectUrl();
      previewImage.hidden = true;
      previewImage.removeAttribute('src');
      visual.querySelector('span').hidden = false;
      visual.querySelector('span').textContent = '[ NO_PREVIEW ]';
      downloadLink.hidden = true;
      downloadLink.removeAttribute('href');
    };
    const setOutput = (value, options = {}) => {
      outputValue = value;
      output.value = value;
      copyButton.disabled = !value || options.binary;
      workspace.querySelector('[data-base64-output-state]').textContent = value ? options.binary ? 'BINARY READY' : 'OUTPUT READY' : 'OUTPUT EMPTY';
      workspace.querySelector('[data-base64-output-state]').dataset.state = value ? 'ready' : 'empty';
      workspace.querySelector('[data-base64-output-summary]').textContent = `${value.length.toLocaleString('en-US')} CHARACTERS`;
    };
    const showImagePreview = (blob, label) => {
      revokeObjectUrl();
      objectUrl = URL.createObjectURL(blob);
      previewImage.src = objectUrl;
      previewImage.hidden = false;
      visual.querySelector('span').hidden = true;
      workspace.querySelector('[data-base64-info="preview"]').textContent = label;
    };
    const setDownload = (blob, name) => {
      if (!objectUrl) objectUrl = URL.createObjectURL(blob);
      downloadLink.href = objectUrl;
      downloadLink.download = name;
      downloadLink.hidden = false;
    };

    const render = async () => {
      const token = ++renderToken;
      clearPreview();
      const format = selectedFormat();
      try {
        if (mode === 'text') {
          const text = textInput.value;
          if (!text) {
            setOutput(''); setInfo(); setStatus('WAITING FOR TEXT', 'テキストを入力すると自動的に変換します。', 'empty');
            updateMetrics({ inputChars: 0, inputBytes: '0 B', outputChars: 0, dataBytes: '0 B', mime: mimeInput.value || 'text/plain', encoding: format.toUpperCase() });
            resetButton.disabled = true; return;
          }
          const bytes = encoder.encode(text);
          const base64 = bytesToBase64(bytes);
          const value = format === 'base64url' ? toBase64Url(base64) : format === 'dataurl' ? buildDataUrl(mimeInput.value || 'text/plain', base64, { charset: 'utf-8' }) : base64;
          setOutput(value);
          setInfo({ mime: mimeInput.value || 'text/plain', charset: 'UTF-8', transfer: format.toUpperCase(), preview: 'TEXT' });
          visual.querySelector('span').textContent = text.slice(0, 160) || '[ EMPTY_TEXT ]';
          setStatus('ENCODE COMPLETE', `${format.toUpperCase()}へ${formatBytes(bytes.length)}のテキストを変換しました。`);
          updateMetrics({ inputChars: text.length.toLocaleString('en-US'), inputBytes: formatBytes(bytes.length), outputChars: value.length.toLocaleString('en-US'), dataBytes: formatBytes(bytes.length), mime: mimeInput.value || 'text/plain', encoding: format.toUpperCase() });
          resetButton.disabled = false;
        } else if (mode === 'decode') {
          const input = decodeInputField.value;
          if (!input.trim()) {
            setOutput(''); setInfo(); setStatus('WAITING FOR BASE64', 'Base64・Base64URL・Data URLを入力してください。', 'empty');
            updateMetrics({ inputChars: 0, inputBytes: '0 B', outputChars: 0, dataBytes: '0 B', mime: '—', encoding: 'AUTO' });
            resetButton.disabled = true; return;
          }
          const decoded = decodeInput(input);
          if (token !== renderToken) return;
          const blob = new Blob([decoded.bytes], { type: decoded.mime });
          const binary = decoded.text === null;
          const value = binary ? `[ BINARY_DATA / ${decoded.mime} / ${formatBytes(decoded.bytes.length)} ]` : decoded.text;
          setOutput(value, { binary });
          setInfo({ mime: decoded.mime, charset: decoded.charset || 'BINARY', transfer: decoded.sourceType, preview: binary ? 'BINARY' : 'TEXT' });
          workspace.querySelector('[data-base64-detection]').textContent = decoded.sourceType;
          visual.querySelector('span').textContent = binary ? `[ ${decoded.mime.toUpperCase()} ]` : decoded.text.slice(0, 160) || '[ EMPTY_TEXT ]';
          if (decoded.mime.startsWith('image/')) showImagePreview(blob, 'IMAGE');
          setDownload(blob, `decoded.${extensionForMime(decoded.mime)}`);
          setStatus('DECODE COMPLETE', `${decoded.sourceType}から${formatBytes(decoded.bytes.length)}を復元しました。`);
          updateMetrics({ inputChars: input.length.toLocaleString('en-US'), inputBytes: formatBytes(encoder.encode(input).length), outputChars: value.length.toLocaleString('en-US'), dataBytes: formatBytes(decoded.bytes.length), mime: decoded.mime, encoding: decoded.sourceType });
          resetButton.disabled = false;
        } else {
          if (!file || !fileBytes) {
            setOutput(''); setInfo(); setStatus('WAITING FOR FILE', `最大${formatBytes(MAX_FILE_SIZE)}のファイルを選択してください。`, 'empty');
            updateMetrics({ inputChars: 0, inputBytes: '0 B', outputChars: 0, dataBytes: '0 B', mime: '—', encoding: format.toUpperCase() });
            resetButton.disabled = true; return;
          }
          const base64 = bytesToBase64(fileBytes);
          const value = format === 'base64url' ? toBase64Url(base64) : format === 'dataurl' ? buildDataUrl(mimeInput.value || file.type || 'application/octet-stream', base64) : base64;
          setOutput(value);
          const mime = mimeInput.value || file.type || 'application/octet-stream';
          setInfo({ mime, charset: isTextMime(mime) ? 'UTF-8' : 'BINARY', transfer: format.toUpperCase(), preview: mime.startsWith('image/') ? 'IMAGE' : 'FILE' });
          if (file.type.startsWith('image/')) showImagePreview(file, 'IMAGE');
          else visual.querySelector('span').textContent = `[ ${file.name} ]`;
          setStatus('FILE ENCODE COMPLETE', `${file.name}を${format.toUpperCase()}へ変換しました。`);
          updateMetrics({ inputChars: '—', inputBytes: formatBytes(fileBytes.length), outputChars: value.length.toLocaleString('en-US'), dataBytes: formatBytes(fileBytes.length), mime, encoding: format.toUpperCase() });
          resetButton.disabled = false;
        }
        workspace.querySelector('[data-base64-input-state]').textContent = 'INPUT READY';
        workspace.querySelector('[data-base64-detection]').textContent = mode === 'decode' ? workspace.querySelector('[data-base64-detection]').textContent : format.toUpperCase();
      } catch (error) {
        setOutput(''); setInfo(); setStatus('CONVERSION ERROR', error.message, 'invalid');
        workspace.querySelector('[data-base64-input-state]').textContent = 'INPUT ERROR';
        workspace.querySelector('[data-base64-detection]').textContent = 'INVALID';
        resetButton.disabled = false;
      }
    };

    const loadFile = async (nextFile) => {
      if (!nextFile) return;
      if (nextFile.size > MAX_FILE_SIZE) { setStatus('FILE TOO LARGE', `ファイルサイズは${formatBytes(MAX_FILE_SIZE)}以下にしてください。`, 'invalid'); showToast(`ファイルサイズは${formatBytes(MAX_FILE_SIZE)}以下にしてください。`); return; }
      const token = ++renderToken;
      const bytes = new Uint8Array(await nextFile.arrayBuffer());
      if (token !== renderToken) return;
      file = nextFile;
      fileBytes = bytes;
      mimeInput.value = file.type || 'application/octet-stream';
      workspace.querySelector('[data-base64-file-name]').textContent = file.name;
      workspace.querySelector('[data-base64-file-size]').textContent = formatBytes(file.size);
      render();
    };
    const reset = () => {
      renderToken += 1;
      textInput.value = '';
      decodeInputField.value = '';
      fileInput.value = '';
      file = null;
      fileBytes = null;
      mimeInput.value = 'text/plain';
      workspace.querySelector('[data-base64-format][value="base64"]').checked = true;
      workspace.querySelector('[data-base64-file-name]').textContent = 'NO FILE';
      workspace.querySelector('[data-base64-file-size]').textContent = '—';
      workspace.querySelector('[data-base64-input-state]').textContent = 'INPUT EMPTY';
      workspace.querySelector('[data-base64-detection]').textContent = 'WAITING';
      render();
    };
    const setMode = (nextMode) => {
      mode = ['text', 'decode', 'file'].includes(nextMode) ? nextMode : 'text';
      root.dataset.base64Mode = mode;
      workspace.querySelectorAll('[data-base64-mode-button]').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.base64ModeButton === mode)));
      workspace.querySelectorAll('[data-base64-input-pane]').forEach((pane) => { pane.hidden = pane.dataset.base64InputPane !== mode; });
      workspace.querySelector('[data-base64-input-title]').textContent = mode === 'text' ? 'TEXT INPUT' : mode === 'decode' ? 'BASE64 / DATA URL INPUT' : 'FILE INPUT';
      workspace.querySelector('[data-base64-settings-state]').textContent = mode === 'decode' ? 'AUTO DETECT' : 'ENCODE';
      formatOptions.disabled = mode === 'decode';
      mimeInput.disabled = mode === 'decode';
      workspace.querySelector('[data-base64-charset]').disabled = mode !== 'text';
      workspace.querySelector('[data-base64-settings-note-title]').textContent = mode === 'decode' ? 'AUTO DETECT' : mode === 'file' ? 'BINARY SAFE' : 'UTF-8 SAFE';
      workspace.querySelector('[data-base64-settings-note]').textContent = mode === 'decode' ? 'Data URLのMIME・charset・転送方式を解析し、Base64URLも自動判別します。' : mode === 'file' ? 'ファイルをバイト列のまま変換し、画像はローカルプレビューを表示します。' : '日本語や絵文字をバイト列へ変換してからエンコードします。';
      reset();
    };

    workspace.querySelectorAll('[data-base64-mode-button]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.base64ModeButton)));
    textInput.addEventListener('input', render);
    decodeInputField.addEventListener('input', render);
    workspace.querySelectorAll('[data-base64-format]').forEach((control) => control.addEventListener('change', render));
    mimeInput.addEventListener('input', render);
    fileInput.addEventListener('change', () => loadFile(fileInput.files?.[0]));
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); } });
    ['dragenter', 'dragover'].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
    ['dragleave', 'drop'].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
    dropZone.addEventListener('drop', (event) => loadFile(event.dataTransfer?.files?.[0]));
    copyButton.addEventListener('click', () => copyText(outputValue, '変換結果をコピーしました。'));
    resetButton.addEventListener('click', reset);
    workspace.querySelector('[data-base64-sample]').addEventListener('click', () => {
      if (mode === 'text') { textInput.value = 'MARK BENCH\nWeb制作を、速く正確に。 🚀'; render(); }
      else if (mode === 'decode') { decodeInputField.value = buildDataUrl('text/plain', encodeText('Responsive images & accessible markup. 日本語OK'), { charset: 'utf-8' }); render(); }
      else {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#18243b"/><text x="160" y="98" text-anchor="middle" fill="#ffd51b" font-family="monospace" font-size="22">MARK BENCH</text></svg>';
        loadFile(new File([svg], 'mark-bench-sample.svg', { type: 'image/svg+xml' }));
      }
    });
    window.addEventListener('pagehide', revokeObjectUrl, { once: true });
    render();
  };

  const api = { MAX_TEXT_LENGTH, MAX_FILE_SIZE, formatBytes, bytesToBase64, normalizeBase64, base64ToBytes, toBase64Url, encodeText, decodeBytesToText, decodeBase64ToText, isTextMime, buildDataUrl, percentPayloadToBytes, parseDataUrl, decodeInput, extensionForMime, mount };
  if (typeof window !== 'undefined') window.MarkBenchBase64DataUrlConverter = api;
  if (typeof globalThis !== 'undefined') globalThis.MarkBenchBase64DataUrlConverter = api;
})();
