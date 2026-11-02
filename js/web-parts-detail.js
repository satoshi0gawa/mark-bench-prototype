(() => {
  const page = document.querySelector('[data-parts-detail]');
  if (!page) return;

  const examples = [...page.querySelectorAll('[data-pattern]')];
  const keywordButtons = [...page.querySelectorAll('[data-pattern-keyword]')];
  const count = page.querySelector('[data-pattern-count]');
  const empty = page.querySelector('[data-pattern-empty]');
  let activeKeyword = '';

  const normalize = (value) => value.toLocaleLowerCase('ja').trim();

  const update = () => {
    const query = normalize(activeKeyword);
    let visibleCount = 0;

    examples.forEach((example) => {
      const isVisible = !query || (example.dataset.search || '').toLocaleLowerCase('ja').includes(query);
      example.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (count) count.textContent = String(visibleCount).padStart(2, '0');
    if (empty) empty.hidden = visibleCount !== 0;

    keywordButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(normalize(button.dataset.patternKeyword) === query));
    });
  };

  const copyText = async (value) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch {
        // Continue to the selection-based fallback when permission is denied.
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Copy command was rejected');
  };

  page.querySelectorAll('[data-copy-code]').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.closest('.part-code')?.querySelector('code');
      if (!code) return;

      try {
        await copyText(code.textContent);
        button.dataset.copyState = 'copied';
        button.textContent = 'COPIED';
        window.setTimeout(() => {
          delete button.dataset.copyState;
          button.textContent = 'COPY';
        }, 1400);
      } catch {
        button.textContent = 'FAILED';
      }
    });
  });

  page.querySelectorAll('[data-demo-push]').forEach((button) => {
    let pressTimer = 0;
    button.addEventListener('click', () => {
      window.clearTimeout(pressTimer);
      button.classList.remove('is-pressed');
      void button.offsetWidth;
      button.classList.add('is-pressed');
      pressTimer = window.setTimeout(() => {
        button.classList.remove('is-pressed');
      }, 760);
    });
  });

  keywordButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const keyword = button.dataset.patternKeyword;
      activeKeyword = normalize(activeKeyword) === normalize(keyword) ? '' : keyword;
      update();
    });
  });

  update();
})();
