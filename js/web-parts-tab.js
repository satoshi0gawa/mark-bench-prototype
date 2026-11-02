(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let instanceId = 0;

  document.querySelectorAll('[data-tab-demo]').forEach((root) => {
    if (root.dataset.tabInitialized) return;
    root.dataset.tabInitialized = 'true';

    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = [...root.querySelectorAll('[role="tabpanel"]')];
    if (!tabs.length || tabs.length !== panels.length) return;

    const id = ++instanceId;
    const list = root.querySelector('[role="tablist"]');
    const isVertical = list?.getAttribute('aria-orientation') === 'vertical';
    const isSwipe = root.hasAttribute('data-tab-swipe');
    const isFade = root.hasAttribute('data-tab-fade');
    const memoryKey = root.dataset.tabMemory || '';
    let current = Math.max(0, tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'));
    let closeTimer = 0;

    tabs.forEach((tab, index) => {
      const tabId = tab.id || `c-tab-${id}-${index + 1}`;
      const panelId = panels[index].id || `c-tab-panel-${id}-${index + 1}`;
      tab.id = tabId;
      tab.setAttribute('aria-controls', panelId);
      panels[index].id = panelId;
      panels[index].setAttribute('aria-labelledby', tabId);
      panels[index].tabIndex = 0;
    });

    const updateIndicator = () => {
      root.style.setProperty('--tab-count', String(tabs.length));
      root.style.setProperty('--tab-index', String(current));
    };

    const renderPanels = (previous) => {
      if (isSwipe) {
        panels.forEach((panel, index) => {
          panel.classList.toggle('is-active', index === current);
          panel.setAttribute('aria-hidden', String(index !== current));
        });
        return;
      }

      window.clearTimeout(closeTimer);
      panels.forEach((panel, index) => {
        const active = index === current;
        if (active) {
          panel.hidden = false;
          panel.classList.remove('is-closing');
          panel.classList.add('is-active');
        } else if (!(isFade && index === previous && previous !== current && !reduceMotion)) {
          panel.classList.remove('is-active', 'is-closing');
          panel.hidden = true;
        }
      });

      if (isFade && previous !== current && !reduceMotion) {
        const leaving = panels[previous];
        leaving.classList.remove('is-active');
        leaving.classList.add('is-closing');
        leaving.hidden = false;
        closeTimer = window.setTimeout(() => {
          leaving.classList.remove('is-closing');
          leaving.hidden = true;
        }, 200);
      }
    };

    const select = (next, options = {}) => {
      const previous = current;
      current = Math.max(0, Math.min(tabs.length - 1, next));

      tabs.forEach((tab, index) => {
        const active = index === current;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });

      renderPanels(previous);
      updateIndicator();

      if (options.focus) tabs[current].focus({ preventScroll: true });
      if (options.updateHash && root.hasAttribute('data-tab-hash')) {
        history.replaceState(null, '', `#${panels[current].id}`);
      }
      if (options.save && memoryKey) {
        try { localStorage.setItem(memoryKey, String(current)); } catch { /* Storage may be unavailable. */ }
      }
      root.dispatchEvent(new CustomEvent('tabchange', { detail: { index: current } }));
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        select(index, { updateHash: true, save: true });
      });

      tab.addEventListener('keydown', (event) => {
        let next = null;
        const previousKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
        const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
        if (event.key === previousKey) next = index === 0 ? tabs.length - 1 : index - 1;
        if (event.key === nextKey) next = index === tabs.length - 1 ? 0 : index + 1;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        select(next, { focus: true, updateHash: true, save: true });
      });
    });

    if (root.hasAttribute('data-tab-hash')) {
      const fromHash = panels.findIndex((panel) => panel.id === location.hash.slice(1));
      if (fromHash >= 0) current = fromHash;
      window.addEventListener('hashchange', () => {
        const next = panels.findIndex((panel) => panel.id === location.hash.slice(1));
        if (next >= 0) select(next);
      });
    }

    if (memoryKey) {
      try {
        const saved = Number.parseInt(localStorage.getItem(memoryKey), 10);
        if (Number.isInteger(saved) && tabs[saved]) current = saved;
      } catch { /* Storage may be unavailable. */ }
    }

    if (isSwipe) {
      const viewport = root.querySelector('[data-tab-viewport]');
      const track = root.querySelector('[data-tab-track]');
      let startX = null;

      const resetTrack = () => { track.style.transform = ''; };
      root.addEventListener('tabchange', resetTrack);
      viewport?.addEventListener('pointerdown', (event) => {
        startX = event.clientX;
        track.classList.add('is-dragging');
        viewport.setPointerCapture(event.pointerId);
      });
      viewport?.addEventListener('pointermove', (event) => {
        if (startX === null) return;
        track.style.transform = `translateX(calc(${current * -100}% + ${event.clientX - startX}px))`;
      });
      const finishSwipe = (event) => {
        if (startX === null) return;
        const distance = event.clientX - startX;
        startX = null;
        track.classList.remove('is-dragging');
        if (distance <= -40) select(current + 1);
        else if (distance >= 40) select(current - 1);
        else resetTrack();
      };
      viewport?.addEventListener('pointerup', finishSwipe);
      viewport?.addEventListener('pointercancel', finishSwipe);
    }

    if (root.hasAttribute('data-tab-auto') && !reduceMotion) {
      const interval = Number.parseInt(root.dataset.interval, 10) || 3000;
      let timer = 0;
      const stop = () => { window.clearInterval(timer); timer = 0; };
      const start = () => {
        if (timer) return;
        timer = window.setInterval(() => select((current + 1) % tabs.length), interval);
      };
      root.addEventListener('mouseenter', stop);
      root.addEventListener('mouseleave', start);
      root.addEventListener('focusin', stop);
      root.addEventListener('focusout', start);
      start();
    }

    if (root.hasAttribute('data-tab-overflow')) {
      const moreWrap = root.querySelector('[data-tab-more-wrap]');
      const more = root.querySelector('[data-tab-more]');
      const menu = root.querySelector('[data-tab-menu]');
      let lastWidth = -1;

      const closeMenu = () => {
        menu.hidden = true;
        more.setAttribute('aria-expanded', 'false');
      };
      const layout = (force = false) => {
        const width = list.clientWidth;
        if (!force && width === lastWidth) return;
        lastWidth = width;
        closeMenu();
        tabs.forEach((tab) => { tab.hidden = false; });
        menu.replaceChildren();
        moreWrap.hidden = true;

        const total = tabs.reduce((sum, tab) => sum + tab.offsetWidth, 0);
        if (total <= width) return;

        moreWrap.hidden = false;
        const available = width - moreWrap.offsetWidth;
        let used = 0;
        tabs.forEach((tab, index) => {
          used += tab.offsetWidth;
          const overflowed = used > available;
          tab.hidden = overflowed;
          if (!overflowed) return;

          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'c-tab__menu-item';
          item.classList.toggle('is-active', index === current);
          item.textContent = tab.textContent.trim();
          item.addEventListener('click', () => {
            select(index, { save: true });
            closeMenu();
          });
          menu.appendChild(item);
        });
      };

      more.addEventListener('click', () => {
        const open = menu.hidden;
        menu.hidden = !open;
        more.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', (event) => {
        if (!moreWrap.contains(event.target)) closeMenu();
      });
      more.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
      });
      root.addEventListener('tabchange', () => {
        [...menu.children].forEach((item, index) => {
          const label = item.textContent.trim();
          item.classList.toggle('is-active', label === tabs[current].textContent.trim());
        });
      });
      if ('ResizeObserver' in window) {
        new ResizeObserver(() => layout()).observe(list);
      } else {
        window.addEventListener('resize', () => layout(true));
      }
      window.setTimeout(() => layout(true), 0);
    }

    select(current);
  });
})();
