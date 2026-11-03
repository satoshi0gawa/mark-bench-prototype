(() => {
  const directButton = (item) => [...item.children].find((child) => child.matches?.('.c-accordion__button'));
  const directPanel = (item) => [...item.children].find((child) => child.matches?.('.c-accordion__panel'));

  const setItem = (item, open) => {
    const button = directButton(item);
    const panel = directPanel(item);
    if (!button || !panel) return;
    item.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
  };

  const directItems = (root) => [...root.children].filter((child) => child.matches?.('.c-accordion__item'));

  document.querySelectorAll('[data-accordion]').forEach((root) => {
    directItems(root).forEach((item) => {
      const button = directButton(item);
      setItem(item, button?.getAttribute('aria-expanded') === 'true');
      button?.addEventListener('click', () => setItem(item, !item.classList.contains('is-open')));
    });
  });

  document.querySelectorAll('[data-accordion-solo]').forEach((root) => {
    const items = directItems(root);
    items.forEach((item) => {
      const button = directButton(item);
      setItem(item, button?.getAttribute('aria-expanded') === 'true');
      button?.addEventListener('click', () => {
        const next = !item.classList.contains('is-open');
        items.forEach((candidate) => setItem(candidate, candidate === item && next));
      });
    });
  });

  document.querySelectorAll('[data-native-details]').forEach((root) => {
    const status = root.querySelector('[data-details-status]');
    root.querySelectorAll('details').forEach((detail) => detail.addEventListener('toggle', () => {
      const current = root.querySelector('details[open] summary');
      status.textContent = current ? `${current.textContent}を表示中` : 'すべて閉じています';
    }));
  });

  document.querySelectorAll('[data-accordion-all]').forEach((root) => {
    const group = root.querySelector('[data-accordion-group]');
    const items = directItems(group);
    items.forEach((item) => directButton(item)?.addEventListener('click', () => setItem(item, !item.classList.contains('is-open'))));
    root.querySelector('[data-open-all]')?.addEventListener('click', () => items.forEach((item) => setItem(item, true)));
    root.querySelector('[data-close-all]')?.addEventListener('click', () => items.forEach((item) => setItem(item, false)));
    items.forEach((item) => setItem(item, false));
  });

  document.querySelectorAll('[data-accordion-filter]').forEach((root) => {
    const input = root.querySelector('[data-faq-search]');
    const count = root.querySelector('[data-faq-count]');
    const empty = root.querySelector('[data-faq-empty]');
    const group = root.querySelector('[data-accordion-group]');
    const items = directItems(group);
    items.forEach((item) => {
      setItem(item, false);
      directButton(item)?.addEventListener('click', () => setItem(item, !item.classList.contains('is-open')));
    });
    const filter = () => {
      const term = input.value.trim().toLocaleLowerCase('ja');
      let hits = 0;
      items.forEach((item) => {
        const match = !term || item.textContent.toLocaleLowerCase('ja').includes(term);
        item.hidden = !match;
        if (match) hits += 1;
      });
      count.textContent = `${hits}件`;
      empty.hidden = hits !== 0;
    };
    input.addEventListener('input', filter);
    filter();
  });

  document.querySelectorAll('[data-accordion-nested]').forEach((root) => {
    const items = [...root.querySelectorAll('.c-accordion__item')];
    items.forEach((item) => {
      setItem(item, false);
      directButton(item)?.addEventListener('click', () => {
        const next = !item.classList.contains('is-open');
        setItem(item, next);
        if (!next) item.querySelectorAll('.c-accordion__item').forEach((child) => setItem(child, false));
      });
    });
  });

  document.querySelectorAll('[data-accordion-feature]').forEach((root) => {
    const items = [...root.children].filter((child) => child.matches?.('.c-accordion__feature-item'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const duration = 260;
    const buttonFor = (item) => item.querySelector(':scope > .c-accordion__feature-heading > .c-accordion__feature-button');
    const panelFor = (item) => item.querySelector(':scope > .c-accordion__feature-panel');
    const updateLabels = (button, open) => {
      const openLabel = button.querySelector('[data-open-label]');
      const closeLabel = button.querySelector('[data-close-label]');
      if (openLabel) openLabel.hidden = open;
      if (closeLabel) closeLabel.hidden = !open;
    };
    const afterTransition = (panel) => new Promise((resolve) => {
      const fallback = window.setTimeout(resolve, duration + 80);
      panel.addEventListener('transitionend', () => {
        window.clearTimeout(fallback);
        resolve();
      }, { once: true });
    });
    const closeItem = async (item) => {
      const button = buttonFor(item);
      const panel = panelFor(item);
      if (!button || !panel || button.getAttribute('aria-expanded') !== 'true') return;
      button.setAttribute('aria-expanded', 'false');
      updateLabels(button, false);
      item.classList.remove('is-open');
      if (reduceMotion.matches) {
        panel.hidden = true;
        return;
      }
      panel.style.height = `${panel.getBoundingClientRect().height}px`;
      panel.style.transition = `height ${duration}ms cubic-bezier(.2, .8, .2, 1)`;
      panel.getBoundingClientRect();
      panel.style.height = '0px';
      await afterTransition(panel);
      if (button.getAttribute('aria-expanded') === 'false') panel.hidden = true;
      panel.style.height = '';
      panel.style.transition = '';
    };
    const openItem = async (item) => {
      const button = buttonFor(item);
      const panel = panelFor(item);
      if (!button || !panel || button.getAttribute('aria-expanded') === 'true') return;
      items.filter((candidate) => candidate !== item).forEach(closeItem);
      button.setAttribute('aria-expanded', 'true');
      updateLabels(button, true);
      item.classList.add('is-open');
      panel.hidden = false;
      if (reduceMotion.matches) return;
      panel.style.height = '0px';
      panel.style.transition = `height ${duration}ms cubic-bezier(.2, .8, .2, 1)`;
      panel.getBoundingClientRect();
      panel.style.height = `${panel.scrollHeight}px`;
      await afterTransition(panel);
      if (button.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
      panel.style.transition = '';
    };
    items.forEach((item) => {
      const button = buttonFor(item);
      const panel = panelFor(item);
      if (!button || !panel) return;
      const open = button.getAttribute('aria-expanded') === 'true';
      item.classList.toggle('is-open', open);
      panel.hidden = !open;
      updateLabels(button, open);
      button.addEventListener('click', () => {
        const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
        if (shouldOpen) openItem(item);
        else closeItem(item);
      });
    });
  });

  document.querySelectorAll('[data-accordion-hash]').forEach((root) => {
    const items = directItems(root.querySelector('[data-accordion-group]'));
    const openTarget = (id, updateHash = true) => {
      const target = items.find((item) => item.id === id);
      if (!target) return;
      items.forEach((item) => setItem(item, item === target));
      if (updateHash) history.replaceState(null, '', `#${id}`);
    };
    items.forEach((item) => {
      setItem(item, false);
      directButton(item)?.addEventListener('click', () => openTarget(item.id));
    });
    root.querySelectorAll('[data-accordion-target]').forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      openTarget(link.dataset.accordionTarget);
    }));
    const initial = location.hash.slice(1);
    if (items.some((item) => item.id === initial)) openTarget(initial, false);
  });
})();
