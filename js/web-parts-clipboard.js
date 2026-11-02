(() => {
  const copyText = async (text) => {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText = 'position:fixed;inset:-9999px auto auto -9999px;opacity:0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  };

  const showFeedback = (button, feedback, message = 'コピーしました') => {
    window.clearTimeout(button._clipboardTimer);
    button.classList.add('is-done');
    if (feedback) feedback.textContent = message;
    button._clipboardTimer = window.setTimeout(() => {
      button.classList.remove('is-done');
      if (feedback) feedback.textContent = '';
    }, 1600);
  };

  document.querySelectorAll('[data-clipboard-text]').forEach((root) => {
    const button = root.querySelector('[data-copy-trigger]');
    const feedback = root.querySelector('[data-copy-feedback]');
    button?.addEventListener('click', async () => {
      await copyText(button.dataset.copyValue || '');
      showFeedback(button, feedback);
    });
  });

  document.querySelectorAll('[data-clipboard-url]').forEach((root) => {
    const button = root.querySelector('[data-copy-trigger]');
    const feedback = root.querySelector('[data-copy-feedback]');
    button?.addEventListener('click', async () => {
      await copyText(location.href);
      showFeedback(button, feedback);
    });
  });

  document.querySelectorAll('[data-clipboard-input]').forEach((root) => {
    const input = root.querySelector('input');
    const button = root.querySelector('[data-copy-trigger]');
    const label = button?.querySelector('[data-button-label]');
    button?.addEventListener('click', async () => {
      input.select();
      await copyText(input.value);
      const original = label.textContent;
      label.textContent = 'COPIED';
      showFeedback(button);
      window.setTimeout(() => { label.textContent = original; }, 1600);
    });
  });

  document.querySelectorAll('[data-clipboard-code]').forEach((root) => {
    const code = root.querySelector('pre');
    const button = root.querySelector('[data-copy-trigger]');
    button?.addEventListener('click', async () => {
      await copyText(code.textContent.trim());
      showFeedback(button, null);
    });
  });

  document.querySelectorAll('[data-clipboard-colors]').forEach((root) => {
    root.querySelectorAll('[data-color-value]').forEach((button) => {
      const label = button.querySelector('[data-color-label]');
      const value = button.dataset.colorValue;
      button.addEventListener('click', async () => {
        await copyText(value);
        const original = label.textContent;
        label.textContent = 'COPIED';
        showFeedback(button);
        window.setTimeout(() => { label.textContent = original; }, 1600);
      });
    });
  });

  document.querySelectorAll('[data-clipboard-template]').forEach((root) => {
    const template = root.querySelector('[data-template-text]');
    const button = root.querySelector('[data-copy-trigger]');
    const feedback = root.querySelector('[data-copy-feedback]');
    button?.addEventListener('click', async () => {
      await copyText(template.textContent.trim());
      showFeedback(button, feedback);
    });
  });

  document.querySelectorAll('[data-clipboard-table]').forEach((root) => {
    const table = root.querySelector('table');
    const button = root.querySelector('[data-copy-trigger]');
    const feedback = root.querySelector('[data-copy-feedback]');
    button?.addEventListener('click', async () => {
      const tsv = [...table.rows].map((row) => [...row.cells]
        .map((cell) => cell.textContent.replace(/\s+/g, ' ').trim()).join('\t')).join('\n');
      await copyText(tsv);
      showFeedback(button, feedback);
    });
  });

  document.querySelectorAll('[data-clipboard-image]').forEach((root) => {
    const canvas = root.querySelector('canvas');
    const button = root.querySelector('[data-copy-trigger]');
    const feedback = root.querySelector('[data-copy-feedback]');
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#18243b');
    gradient.addColorStop(1, '#315a9b');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffff00';
    context.font = '700 18px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('MARK BENCH', canvas.width / 2, canvas.height / 2);

    button?.addEventListener('click', () => {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          if (!navigator.clipboard?.write || !window.ClipboardItem || !window.isSecureContext) throw new Error('Image clipboard unavailable');
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showFeedback(button, feedback, '画像をコピーしました');
        } catch {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'mark-bench.png';
          link.click();
          window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
          showFeedback(button, feedback, 'PNGをダウンロードしました');
        }
      }, 'image/png');
    });
  });

  document.querySelectorAll('[data-clipboard-json]').forEach((root) => {
    const source = root.querySelector('[data-json-source]');
    const button = root.querySelector('[data-copy-trigger]');
    const feedback = root.querySelector('[data-copy-feedback]');
    button?.addEventListener('click', async () => {
      try {
        const formatted = JSON.stringify(JSON.parse(source.value), null, 2);
        await copyText(formatted);
        showFeedback(button, feedback, '整形したJSONをコピーしました');
      } catch {
        feedback.textContent = 'JSONの形式を確認してください';
      }
    });
  });

  document.querySelectorAll('[data-clipboard-bulk]').forEach((root) => {
    const items = [...root.querySelectorAll('[data-copy-item]')];
    const button = root.querySelector('[data-copy-trigger]');
    const count = root.querySelector('[data-copy-count]');
    const feedback = root.querySelector('[data-copy-feedback]');
    const update = () => {
      const selected = items.filter((item) => item.checked);
      count.textContent = String(selected.length);
      button.disabled = selected.length === 0;
      return selected;
    };
    root.addEventListener('change', update);
    button?.addEventListener('click', async () => {
      const selected = update();
      if (!selected.length) return;
      await copyText(selected.map((item) => item.value).join('\n'));
      showFeedback(button, feedback, `${selected.length}件をコピーしました`);
    });
    update();
  });

  document.querySelectorAll('[data-clipboard-share]').forEach((root) => {
    const button = root.querySelector('[data-share-trigger]');
    const feedback = root.querySelector('[data-copy-feedback]');
    button?.addEventListener('click', async () => {
      const data = { title: document.title, text: 'MARK BENCHのUIパーツ', url: location.href };
      if (navigator.share) {
        try {
          await navigator.share(data);
          feedback.textContent = '共有しました';
        } catch (error) {
          if (error.name !== 'AbortError') feedback.textContent = '共有できませんでした';
        }
      } else {
        await copyText(data.url);
        showFeedback(button, feedback, 'URLをコピーしました');
      }
    });
  });

  document.querySelectorAll('[data-clipboard-sns]').forEach((root) => {
    const button = root.querySelector('[data-share-trigger]');
    const feedback = root.querySelector('[data-copy-feedback]');
    button?.addEventListener('click', () => {
      const text = encodeURIComponent('MARK BENCHのUIパーツ');
      const url = encodeURIComponent(location.href);
      window.open(`https://x.com/intent/post?text=${text}&url=${url}`, '_blank', 'noopener,width=560,height=640');
      feedback.textContent = '投稿画面を開きました';
    });
  });

  document.querySelectorAll('[data-clipboard-format]').forEach((root) => {
    const modes = [...root.querySelectorAll('[data-copy-mode]')];
    const button = root.querySelector('[data-copy-trigger]');
    const feedback = root.querySelector('[data-copy-feedback]');
    let mode = 'markdown';
    modes.forEach((modeButton) => {
      modeButton.addEventListener('click', () => {
        mode = modeButton.dataset.copyMode;
        modes.forEach((item) => item.setAttribute('aria-pressed', String(item === modeButton)));
      });
    });
    button?.addEventListener('click', async () => {
      const text = mode === 'markdown'
        ? `[${document.title}](${location.href})`
        : `${document.title} ${location.href}`;
      await copyText(text);
      showFeedback(button, feedback);
    });
  });

  document.querySelectorAll('[data-clipboard-quote]').forEach((root) => {
    const quote = root.querySelector('[data-quote-source]');
    const button = root.querySelector('[data-copy-trigger]');
    const feedback = root.querySelector('[data-copy-feedback]');
    button?.addEventListener('click', async () => {
      const selection = getSelection();
      const selectedInside = selection && selection.rangeCount > 0 && quote.contains(selection.anchorNode);
      const source = selectedInside && selection.toString().trim() ? selection.toString().trim() : quote.textContent.trim();
      await copyText(`「${source}」 — ${document.title} (${location.href})`);
      showFeedback(button, feedback, selectedInside ? '選択範囲をコピーしました' : '文章全体をコピーしました');
    });
  });
})();
