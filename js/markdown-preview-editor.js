(() => {
  const MAX_INPUT_LENGTH = 100000;
  const MAX_HISTORY = 100;
  const DEFAULT_OPTIONS = Object.freeze({
    allowRemoteImages: false,
  });

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const escapeAttribute = (value = '') => escapeHtml(value).replaceAll('`', '&#96;');
  const normalizeNewlines = (value = '') => String(value).replace(/\r\n?/gu, '\n').replaceAll('\0', '\uFFFD');
  const stripMarkdown = (value = '') => String(value)
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/[`*_~>#]/gu, '')
    .trim();

  const slugifyHeading = (value = '') => stripMarkdown(value)
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/gu, '') || 'section';

  const createWarning = (type, line, message) => Object.freeze({ type, line, message });

  const isSafeUrl = (value = '', type = 'link') => {
    const url = String(value).trim();
    if (!url || /[\u0000-\u001F\u007F]/u.test(url)) return false;
    if (/^(?:#|\/|\.\/|\.\.\/|\?)/u.test(url)) return true;
    if (/^https?:\/\//iu.test(url)) return true;
    return type === 'link' && /^mailto:/iu.test(url);
  };

  const countWords = (value = '') => {
    const source = String(value).trim();
    if (!source) return 0;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
      return [...segmenter.segment(source)].filter((part) => part.isWordLike).length;
    }
    return source.split(/\s+/u).filter(Boolean).length;
  };

  const splitTableRow = (line = '') => {
    let source = String(line).trim();
    if (source.startsWith('|')) source = source.slice(1);
    if (source.endsWith('|') && !source.endsWith('\\|')) source = source.slice(0, -1);
    const cells = [];
    let current = '';
    let escaped = false;
    for (const character of source) {
      if (escaped) {
        current += character;
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '|') {
        cells.push(current.trim());
        current = '';
      } else {
        current += character;
      }
    }
    if (escaped) current += '\\';
    cells.push(current.trim());
    return cells;
  };

  const parseTableDivider = (line = '') => {
    const cells = splitTableRow(line);
    if (cells.length === 0 || cells.some((cell) => !/^:?-{3,}:?$/u.test(cell.replace(/\s/gu, '')))) return null;
    return cells.map((cell) => {
      const compact = cell.replace(/\s/gu, '');
      if (compact.startsWith(':') && compact.endsWith(':')) return 'center';
      if (compact.endsWith(':')) return 'right';
      return 'left';
    });
  };

  const indentWidth = (value = '') => [...String(value)].reduce((total, character) => total + (character === '\t' ? 4 : 1), 0);
  const listMatch = (line = '') => String(line).match(/^(\s*)([-+*]|\d+[.)])\s+(.+)$/u);

  const renderInline = (value, state, lineNumber) => {
    const tokens = [];
    const token = (markup) => {
      const index = tokens.push(markup) - 1;
      return `\uE000${index}\uE001`;
    };
    let source = String(value).replaceAll('\uE000', '\uFFFD').replaceAll('\uE001', '\uFFFD');

    source = source.replace(/`([^`\n]+)`/gu, (_, code) => token(`<code>${escapeHtml(code)}</code>`));
    source = source.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/gu, (_, alt, rawUrl) => {
      state.imageCount += 1;
      const url = rawUrl.trim();
      if (!alt.trim()) state.warnings.push(createWarning('MISSING_ALT', lineNumber, '画像の代替テキストが空です。'));
      if (!isSafeUrl(url, 'image')) {
        state.warnings.push(createWarning('UNSAFE_IMAGE_URL', lineNumber, '許可されていない画像URLを無効化しました。'));
        return token(`<span class="markdown-image-placeholder">[IMAGE BLOCKED: ${escapeHtml(alt || 'NO ALT')}]</span>`);
      }
      return token(`<img src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}" loading="lazy" referrerpolicy="no-referrer">`);
    });
    source = source.replace(/\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/gu, (_, label, rawUrl) => {
      state.linkCount += 1;
      const url = rawUrl.trim();
      if (!label.trim()) state.warnings.push(createWarning('EMPTY_LINK_TEXT', lineNumber, 'リンクテキストが空です。'));
      if (!isSafeUrl(url, 'link')) {
        state.warnings.push(createWarning('UNSAFE_LINK_URL', lineNumber, '許可されていないリンクURLを無効化しました。'));
        return token(`<span class="markdown-link-blocked">${escapeHtml(label || 'BLOCKED LINK')}</span>`);
      }
      return token(`<a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
    });

    source = escapeHtml(source);
    source = source
      .replace(/\*\*([^*\n]+)\*\*/gu, '<strong>$1</strong>')
      .replace(/__([^_\n]+)__/gu, '<strong>$1</strong>')
      .replace(/~~([^~\n]+)~~/gu, '<del>$1</del>')
      .replace(/(^|[^*])\*([^*\n]+)\*/gu, '$1<em>$2</em>')
      .replace(/(^|[^_])_([^_\n]+)_/gu, '$1<em>$2</em>')
      .replace(/ {2}\n/gu, '<br>\n')
      .replace(/\n/gu, ' ');
    return source.replace(/\uE000(\d+)\uE001/gu, (_, index) => tokens[Number(index)] ?? '');
  };

  const renderListTokens = (tokens, start, levelIndent, state) => {
    let index = start;
    const ordered = tokens[start].ordered;
    const tag = ordered ? 'ol' : 'ul';
    const items = [];

    while (index < tokens.length) {
      const item = tokens[index];
      if (item.indent < levelIndent) break;
      if (item.indent > levelIndent) {
        if (items.length === 0) break;
        const nested = renderListTokens(tokens, index, item.indent, state);
        items[items.length - 1].nested += nested.html;
        index = nested.index;
        continue;
      }
      if (item.ordered !== ordered) break;
      const task = item.content.match(/^\[([ xX])\]\s*(.*)$/u);
      const content = task ? task[2] : item.content;
      const checkbox = task
        ? `<input type="checkbox" disabled${task[1].toLowerCase() === 'x' ? ' checked' : ''} aria-label="${task[1].toLowerCase() === 'x' ? '完了' : '未完了'}">`
        : '';
      items.push({ content: `${checkbox}${renderInline(content, state, item.line)}`, nested: '', task: Boolean(task) });
      index += 1;
    }

    const className = items.some((item) => item.task) ? ' class="markdown-task-list"' : '';
    return {
      html: `<${tag}${className}>${items.map((item) => `<li${item.task ? ' class="markdown-task-item"' : ''}>${item.content}${item.nested}</li>`).join('')}</${tag}>`,
      index,
    };
  };

  const isBlockStart = (lines, index) => {
    const line = lines[index] ?? '';
    if (!line.trim()) return true;
    if (/^\s{0,3}(?:#{1,6}\s+|>|```|~~~|(?:[-*_]\s*){3,}$)/u.test(line)) return true;
    if (listMatch(line)) return true;
    return Boolean(lines[index + 1] && parseTableDivider(lines[index + 1]));
  };

  const renderBlocks = (lines, state, lineOffset = 0) => {
    const output = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      const lineNumber = lineOffset + index + 1;
      if (!line.trim()) {
        index += 1;
        continue;
      }

      const fence = line.match(/^\s{0,3}(```+|~~~+)\s*([\w+-]*)\s*$/u);
      if (fence) {
        const marker = fence[1][0];
        const language = fence[2].replace(/[^\w+-]/gu, '');
        const codeLines = [];
        const startLine = lineNumber;
        index += 1;
        let closed = false;
        while (index < lines.length) {
          if (new RegExp(`^\\s{0,3}${marker}{3,}\\s*$`, 'u').test(lines[index])) {
            closed = true;
            index += 1;
            break;
          }
          codeLines.push(lines[index]);
          index += 1;
        }
        if (!closed) state.warnings.push(createWarning('UNCLOSED_FENCE', startLine, 'コードブロックが閉じられていません。'));
        output.push(`<pre${language ? ` data-language="${escapeAttribute(language)}"` : ''}><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        continue;
      }

      const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/u);
      if (heading) {
        const level = heading[1].length;
        const headingText = heading[2];
        if (state.lastHeadingLevel && level > state.lastHeadingLevel + 1) {
          state.warnings.push(createWarning('HEADING_JUMP', lineNumber, `H${state.lastHeadingLevel}からH${level}へ見出しレベルが飛んでいます。`));
        }
        state.lastHeadingLevel = level;
        state.headingCount += 1;
        if (level === 1) state.h1Count += 1;
        const baseSlug = slugifyHeading(headingText);
        const used = state.headingSlugs.get(baseSlug) ?? 0;
        state.headingSlugs.set(baseSlug, used + 1);
        const id = used ? `${baseSlug}-${used + 1}` : baseSlug;
        output.push(`<h${level} id="${escapeAttribute(id)}">${renderInline(headingText, state, lineNumber)}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^\s{0,3}(?:[-*_]\s*){3,}$/u.test(line)) {
        output.push('<hr>');
        index += 1;
        continue;
      }

      if (/^\s{0,3}>/u.test(line)) {
        const quoteLines = [];
        const start = index;
        while (index < lines.length && /^\s{0,3}>/u.test(lines[index])) {
          quoteLines.push(lines[index].replace(/^\s{0,3}>\s?/u, ''));
          index += 1;
        }
        output.push(`<blockquote>${renderBlocks(quoteLines, state, lineOffset + start)}</blockquote>`);
        continue;
      }

      const divider = lines[index + 1] ? parseTableDivider(lines[index + 1]) : null;
      if (divider) {
        const headers = splitTableRow(line);
        const columnCount = Math.max(headers.length, divider.length);
        index += 2;
        const rows = [];
        while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
          rows.push(splitTableRow(lines[index]));
          index += 1;
        }
        const cell = (tag, value, cellIndex, rowLine) => `<${tag} style="text-align:${divider[cellIndex] || 'left'}">${renderInline(value || '', state, rowLine)}</${tag}>`;
        output.push(`<div class="markdown-table-wrap"><table><thead><tr>${Array.from({ length: columnCount }, (_, cellIndex) => cell('th', headers[cellIndex], cellIndex, lineNumber)).join('')}</tr></thead><tbody>${rows.map((row, rowIndex) => `<tr>${Array.from({ length: columnCount }, (_, cellIndex) => cell('td', row[cellIndex], cellIndex, lineNumber + rowIndex + 2)).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }

      if (listMatch(line)) {
        const tokens = [];
        while (index < lines.length) {
          const match = listMatch(lines[index]);
          if (!match) break;
          tokens.push({
            indent: indentWidth(match[1]),
            ordered: /^\d/u.test(match[2]),
            content: match[3],
            line: lineOffset + index + 1,
          });
          index += 1;
        }
        let tokenIndex = 0;
        while (tokenIndex < tokens.length) {
          const rendered = renderListTokens(tokens, tokenIndex, tokens[tokenIndex].indent, state);
          output.push(rendered.html);
          tokenIndex = rendered.index > tokenIndex ? rendered.index : tokenIndex + 1;
        }
        continue;
      }

      const paragraphLines = [line];
      const startLine = lineNumber;
      index += 1;
      while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
        paragraphLines.push(lines[index]);
        index += 1;
      }
      output.push(`<p>${renderInline(paragraphLines.join('\n'), state, startLine)}</p>`);
    }
    return output.join('\n');
  };

  const analyze = (input = '', options = {}) => {
    const settings = { ...DEFAULT_OPTIONS, ...options };
    const rawValue = normalizeNewlines(input);
    const value = rawValue.slice(0, MAX_INPUT_LENGTH);
    const lines = value.split('\n');
    const state = {
      options: settings,
      warnings: [],
      h1Count: 0,
      headingCount: 0,
      lastHeadingLevel: 0,
      linkCount: 0,
      imageCount: 0,
      headingSlugs: new Map(),
    };

    if (rawValue.length > MAX_INPUT_LENGTH) {
      state.warnings.push(createWarning('INPUT_LIMIT', 0, `入力は先頭${MAX_INPUT_LENGTH.toLocaleString('en-US')}文字まで処理しました。`));
    }
    const valueWithoutFencedCode = value.replace(/(?:```+|~~~+)[\s\S]*?(?:```+|~~~+)/gu, '');
    if (/<\/?[A-Za-z][^>]*>/u.test(valueWithoutFencedCode)) {
      state.warnings.push(createWarning('RAW_HTML_ESCAPED', 0, '生HTMLは安全のため文字列として表示します。'));
    }
    if (/\[\^[^\]]+\]/u.test(value)) {
      state.warnings.push(createWarning('UNSUPPORTED_FOOTNOTE', 0, '脚注記法は現在のバージョンでは未対応です。'));
    }

    const html = renderBlocks(lines, state);
    if (value.trim()) {
      if (state.h1Count === 0) state.warnings.unshift(createWarning('MISSING_H1', 0, 'H1見出しがありません。ページタイトルを別に設定する場合は無視できます。'));
      if (state.h1Count > 1) state.warnings.unshift(createWarning('MULTIPLE_H1', 0, `H1見出しが${state.h1Count}件あります。`));
    }

    const plainText = stripMarkdown(value.replace(/```[\s\S]*?```/gu, ' '));
    return Object.freeze({
      value,
      html,
      inputLength: rawValue.length,
      inputTruncated: rawValue.length > MAX_INPUT_LENGTH,
      lineCount: value ? lines.length : 0,
      wordCount: countWords(plainText),
      headingCount: state.headingCount,
      h1Count: state.h1Count,
      linkCount: state.linkCount,
      imageCount: state.imageCount,
      warningCount: state.warnings.length,
      warnings: Object.freeze(state.warnings),
    });
  };

  const createPreviewDocument = (html = '', options = {}) => {
    const settings = { ...DEFAULT_OPTIONS, ...options };
    const imageSource = settings.allowRemoteImages ? 'https: http:' : "'none'";
    return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src ${imageSource};"><style>
      :root{color-scheme:light;font-family:"BIZ UDPGothic",system-ui,sans-serif;color:#1c2430;background:#fff}*{box-sizing:border-box}body{margin:0;padding:clamp(1.25rem,5vw,3rem);font-size:16px;line-height:1.8;overflow-wrap:anywhere}main{max-width:100%}h1,h2,h3,h4,h5,h6{margin:2em 0 .75em;line-height:1.35}h1:first-child,h2:first-child,h3:first-child{margin-top:0}h1{font-size:2.1rem}h2{font-size:1.65rem}h3{font-size:1.3rem}p,ul,ol,blockquote,pre,.markdown-table-wrap{margin:0 0 1.25rem}a{color:#203a6e;text-underline-offset:.2em}blockquote{padding:.75rem 1rem;border-left:3px solid #203a6e;background:#f5f7fa}code,pre{font-family:"Space Mono",ui-monospace,monospace}code{padding:.1em .3em;background:#eef1f6}pre{position:relative;padding:1rem;overflow:auto;color:#fff;background:#18243b}pre code{padding:0;background:none}pre[data-language]::before{content:attr(data-language);display:block;margin-bottom:.75rem;color:#aab2c0;font-size:.7rem;text-transform:uppercase}img{display:block;max-width:100%;height:auto}.markdown-image-placeholder,.markdown-link-blocked{display:inline-block;padding:.15rem .35rem;color:#667085;background:#eef1f6}.markdown-table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;border:1px solid #d9dfe8}th{background:#f5f7fa}.markdown-task-list{padding-left:0;list-style:none}.markdown-task-item input{margin-right:.5rem}hr{margin:2rem 0;border:0;border-top:1px solid #d9dfe8}
    </style></head><body><main>${html || '<p class="markdown-image-placeholder">Markdownを入力するとプレビューが表示されます。</p>'}</main></body></html>`;
  };

  const SAMPLE = [
    '# 制作メモ',
    '',
    'MARK BENCHで使用するコンテンツの**構造**と表示を確認します。',
    '',
    '## 確認項目',
    '',
    '- [x] 見出し構造',
    '- [x] リンクとリスト',
    '- [ ] モバイル幅の確認',
    '',
    '### 実装例',
    '',
    '```html',
    '<section aria-labelledby="sample-title">',
    '  <h2 id="sample-title">Sample</h2>',
    '</section>',
    '```',
    '',
    '| 項目 | 状態 |',
    '| :--- | ---: |',
    '| Preview | Ready |',
    '| HTML | Ready |',
    '',
    '> 入力内容はブラウザ内だけで処理されます。',
    '',
    '[MARK BENCH](../index.html)',
  ].join('\n');

  const isCompositionKey = (event = {}, composing = false) => Boolean(composing || event.isComposing || event.keyCode === 229);

  globalThis.MarkBenchMarkdownPreviewEditor = Object.freeze({
    MAX_INPUT_LENGTH,
    MAX_HISTORY,
    DEFAULT_OPTIONS,
    SAMPLE,
    escapeHtml,
    normalizeNewlines,
    slugifyHeading,
    isSafeUrl,
    splitTableRow,
    parseTableDivider,
    analyze,
    createPreviewDocument,
    isCompositionKey,
  });
})();
