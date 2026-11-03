(() => {
  const roots = [...document.querySelectorAll('[data-hamburger-demo]')];
  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let activeRoot = null;

  const elements = (root) => ({
    toggle: root.querySelector('[data-hamburger-toggle]'),
    panel: root.querySelector('[data-hamburger-panel]'),
    overlay: root.querySelector('[data-hamburger-overlay]')
  });

  const updatePageLock = () => {
    document.body.classList.toggle('is-hamburger-menu-open', Boolean(activeRoot));
  };

  const setOpen = (root, open, { restoreFocus = true } = {}) => {
    const { toggle, panel } = elements(root);
    if (!toggle || !panel) return;

    if (open && activeRoot && activeRoot !== root) {
      setOpen(activeRoot, false, { restoreFocus: false });
    }

    root.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', `${toggle.dataset.menuName}を${open ? '閉じる' : '開く'}`);
    panel.setAttribute('aria-hidden', String(!open));
    panel.inert = !open;
    toggle.querySelector('[data-menu-open-label]')?.toggleAttribute('hidden', open);
    toggle.querySelector('[data-menu-close-label]')?.toggleAttribute('hidden', !open);

    if (open) {
      activeRoot = root;
      updatePageLock();
      panel.querySelector(focusableSelector)?.focus({ preventScroll: true });
      return;
    }

    if (activeRoot === root) activeRoot = null;
    updatePageLock();
    if (restoreFocus) toggle.focus({ preventScroll: true });
  };

  const resetAll = () => {
    activeRoot = null;
    roots.forEach((root) => {
      const { toggle, panel } = elements(root);
      root.classList.remove('is-open');
      if (!toggle || !panel) return;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', `${toggle.dataset.menuName}を開く`);
      panel.setAttribute('aria-hidden', 'true');
      panel.inert = true;
      toggle.querySelector('[data-menu-open-label]')?.removeAttribute('hidden');
      toggle.querySelector('[data-menu-close-label]')?.setAttribute('hidden', '');
    });
    updatePageLock();
  };

  roots.forEach((root) => {
    const { toggle, panel, overlay } = elements(root);
    if (!toggle || !panel || !overlay) return;
    panel.inert = true;
    toggle.addEventListener('click', () => setOpen(root, !root.classList.contains('is-open')));
    overlay.addEventListener('click', () => setOpen(root, false));
    panel.querySelectorAll('a[href]').forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      setOpen(root, false);
    }));
  });

  document.addEventListener('keydown', (event) => {
    if (!activeRoot) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(activeRoot, false);
      return;
    }
    if (event.key !== 'Tab') return;

    const { toggle, panel } = elements(activeRoot);
    const focusable = [toggle, ...panel.querySelectorAll(focusableSelector)].filter((item) => !item.hidden);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('pagehide', () => document.body.classList.remove('is-hamburger-menu-open'));
  window.addEventListener('pageshow', resetAll);
  resetAll();
})();
