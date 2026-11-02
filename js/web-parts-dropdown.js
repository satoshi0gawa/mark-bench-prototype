(() => {
  const roots = [...document.querySelectorAll('[data-dropdown]')];
  const controllers = new Map();
  const canHover = window.matchMedia('(hover: hover)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getFocusableItems = (menu) => [...menu.querySelectorAll('button:not([disabled]), input:not([disabled])')]
    .filter((item) => !item.hidden && item.offsetParent !== null);

  const createController = (root) => {
    const trigger = root.querySelector(':scope > [data-dropdown-trigger]');
    const menu = root.querySelector(':scope > [data-dropdown-menu]');
    if (!trigger || !menu) return null;

    trigger.setAttribute('aria-haspopup', trigger.getAttribute('aria-haspopup') || 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    let positionAnimation;
    let isClosing = false;

    const position = () => {
      if (menu.hidden || !root.classList.contains('is-open')) return;
      const preview = root.closest('.part-example__preview');
      if (!preview) return;

      const previewRect = preview.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const aggregateTop = Math.min(rootRect.top, triggerRect.top, menuRect.top);
      const aggregateBottom = Math.max(rootRect.bottom, triggerRect.bottom, menuRect.bottom);
      const currentOffset = Number.parseFloat(getComputedStyle(root).marginTop) || 0;
      const centerShift = (previewRect.top + previewRect.height / 2) - (aggregateTop + aggregateBottom) / 2;
      root.style.setProperty('--dropdown-open-offset', `${Math.max(0, currentOffset + centerShift)}px`);
    };

    const animateFrom = (fromTop, onFinish) => {
      positionAnimation?.cancel();
      const toTop = root.getBoundingClientRect().top;
      const distance = fromTop - toTop;

      if (reduceMotion || Math.abs(distance) < 0.5) {
        positionAnimation = undefined;
        onFinish?.();
        return;
      }

      positionAnimation = root.animate(
        [{ transform: `translateY(${distance}px)` }, { transform: 'translateY(0)' }],
        { duration: 220, easing: 'cubic-bezier(0.2, 0.75, 0.3, 1)' },
      );
      positionAnimation.addEventListener('finish', () => {
        positionAnimation = undefined;
        onFinish?.();
      }, { once: true });
    };

    const close = (restoreFocus = false) => {
      if (menu.hidden || isClosing) return;
      const fromTop = root.getBoundingClientRect().top;
      isClosing = true;
      root.classList.add('is-closing');
      root.classList.remove('is-open');
      root.style.removeProperty('--dropdown-open-offset');
      trigger.setAttribute('aria-expanded', 'false');
      root.querySelectorAll('[data-submenu]').forEach((submenu) => { submenu.hidden = true; });
      root.querySelectorAll('[data-submenu-trigger]').forEach((button) => button.setAttribute('aria-expanded', 'false'));

      animateFrom(fromTop, () => {
        menu.hidden = true;
        root.classList.remove('is-closing');
        isClosing = false;
        root.dispatchEvent(new CustomEvent('dropdown:close'));
        if (restoreFocus) trigger.focus({ preventScroll: true });
      });
    };

    const open = () => {
      if (isClosing) {
        positionAnimation?.cancel();
        positionAnimation = undefined;
        root.classList.remove('is-closing');
        root.style.removeProperty('--dropdown-open-offset');
        menu.hidden = true;
        isClosing = false;
      }
      const fromTop = root.getBoundingClientRect().top;
      controllers.forEach((controller, otherRoot) => {
        if (otherRoot !== root) controller.close(false);
      });
      menu.hidden = false;
      root.classList.add('is-open', 'is-opening');
      trigger.setAttribute('aria-expanded', 'true');
      position();
      root.classList.remove('is-opening');
      animateFrom(fromTop);
      root.dispatchEvent(new CustomEvent('dropdown:open'));
    };

    const toggle = () => {
      if (menu.hidden || isClosing) open();
      else close(false);
    };

    trigger.addEventListener('click', () => {
      if (root.hasAttribute('data-dropdown-hover') && canHover) open();
      else toggle();
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown') return;
      event.preventDefault();
      open();
      window.requestAnimationFrame(() => getFocusableItems(menu)[0]?.focus({ preventScroll: true }));
    });

    menu.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const items = getFocusableItems(menu);
      if (!items.length) return;
      event.preventDefault();
      const current = items.indexOf(document.activeElement);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const next = (current + direction + items.length) % items.length;
      items[next].focus({ preventScroll: true });
    });

    root.querySelectorAll('[data-dropdown-close]').forEach((item) => {
      item.addEventListener('click', () => close(true));
    });

    root.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (!root.contains(document.activeElement)) close(false);
      }, 0);
    });

    if (root.hasAttribute('data-dropdown-hover') && canHover) {
      const hoverSurface = root.closest('.part-example__preview');
      root.addEventListener('pointerenter', open);
      hoverSurface?.addEventListener('pointerleave', () => close(false));
      root.addEventListener('focusin', open);
    }

    return { root, trigger, menu, open, close, toggle, position };
  };

  roots.forEach((root) => {
    const controller = createController(root);
    if (controller) controllers.set(root, controller);
  });

  window.addEventListener('resize', () => {
    controllers.forEach((controller) => controller.position());
  });

  document.addEventListener('click', (event) => {
    const activeRoot = event.target.closest('[data-dropdown]');
    controllers.forEach((controller, root) => {
      if (root !== activeRoot) controller.close(false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openRoot = roots.find((root) => root.classList.contains('is-open'));
    if (openRoot) controllers.get(openRoot)?.close(true);
  });

  document.querySelectorAll('[data-dropdown-select]').forEach((root) => {
    const label = root.querySelector('[data-select-label]');
    const input = root.querySelector('[data-select-input]');
    const options = [...root.querySelectorAll('[data-select-option]')];

    options.forEach((option) => {
      option.addEventListener('click', () => {
        options.forEach((item) => item.setAttribute('aria-selected', String(item === option)));
        label.textContent = option.textContent.trim();
        input.value = option.dataset.selectOption || option.textContent.trim();
        controllers.get(root)?.close(true);
      });
    });
  });

  document.querySelectorAll('[data-action-menu]').forEach((root) => {
    const output = root.querySelector('[data-action-output]');
    root.querySelectorAll('[data-action]').forEach((item) => {
      item.addEventListener('click', () => {
        if (output) output.textContent = `${item.dataset.action}を選択しました`;
        controllers.get(root)?.close(true);
      });
    });
  });

  document.querySelectorAll('[data-check-menu]').forEach((root) => {
    const badge = root.querySelector('[data-check-count]');
    const update = () => {
      const count = root.querySelectorAll('input:checked').length;
      badge.textContent = count ? String(count) : '';
    };
    root.addEventListener('change', update);
    update();
  });

  document.querySelectorAll('[data-nested-menu]').forEach((root) => {
    const trigger = root.querySelector('[data-submenu-trigger]');
    const submenu = root.querySelector('[data-submenu]');
    trigger?.addEventListener('click', () => {
      const willOpen = submenu.hidden;
      submenu.hidden = !willOpen;
      trigger.setAttribute('aria-expanded', String(willOpen));
      controllers.get(root)?.position();
      if (willOpen) submenu.querySelector('button')?.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll('[data-search-menu]').forEach((root) => {
    const controller = controllers.get(root);
    const input = root.querySelector('[data-dropdown-search]');
    const label = root.querySelector('[data-search-label]');
    const options = [...root.querySelectorAll('[data-search-option]')];
    const empty = root.querySelector('[data-search-empty]');

    const filter = () => {
      const query = input.value.toLocaleLowerCase('ja').trim();
      let visible = 0;
      options.forEach((option) => {
        const matches = option.textContent.toLocaleLowerCase('ja').includes(query);
        option.hidden = !matches;
        if (matches) visible += 1;
      });
      empty.hidden = visible !== 0;
      controller?.position();
    };

    input.addEventListener('input', filter);
    root.addEventListener('dropdown:open', () => {
      window.requestAnimationFrame(() => input.focus({ preventScroll: true }));
    });
    options.forEach((option) => {
      option.addEventListener('click', () => {
        label.textContent = option.textContent.trim();
        input.value = '';
        filter();
        controller?.close(true);
      });
    });
  });

  document.querySelectorAll('[data-context-menu-demo]').forEach((root) => {
    const area = root.querySelector('[data-context-target]');
    const menu = root.querySelector('[data-context-menu]');
    const output = root.querySelector('[data-context-output]');

    const close = (restoreFocus = false) => {
      if (menu.hidden) return;
      menu.hidden = true;
      root.classList.remove('is-open');
      area.setAttribute('aria-expanded', 'false');
      if (restoreFocus) area.focus({ preventScroll: true });
    };

    const openAt = (clientX, clientY) => {
      menu.hidden = false;
      root.classList.add('is-open');
      area.setAttribute('aria-expanded', 'true');
      const rootRect = root.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const maxX = Math.max(0, rootRect.width - menuRect.width);
      const maxY = Math.max(0, area.offsetHeight - menuRect.height);
      const x = Math.max(0, Math.min(clientX - rootRect.left, maxX));
      const y = Math.max(0, Math.min(clientY - rootRect.top, maxY));
      root.style.setProperty('--menu-x', `${x}px`);
      root.style.setProperty('--menu-y', `${y}px`);
      menu.querySelector('button')?.focus({ preventScroll: true });
    };

    const openAtCenter = () => {
      const rect = area.getBoundingClientRect();
      openAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    };

    area.setAttribute('aria-expanded', 'false');
    area.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      openAt(event.clientX, event.clientY);
    });
    area.addEventListener('click', openAtCenter);
    area.addEventListener('keydown', (event) => {
      if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
      event.preventDefault();
      openAtCenter();
    });
    menu.querySelectorAll('[data-context-action]').forEach((item) => {
      item.addEventListener('click', () => {
        output.textContent = `${item.dataset.contextAction}を選択しました`;
        close(true);
      });
    });
    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) close(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close(true);
    });
  });

  document.querySelectorAll('[data-notification-menu]').forEach((root) => {
    const badge = root.querySelector('[data-notification-badge]');
    const notifications = [...root.querySelectorAll('[data-notification]')];
    const readAll = root.querySelector('[data-read-all]');
    const updateBadge = () => {
      const count = notifications.filter((item) => item.classList.contains('is-unread')).length;
      badge.textContent = count ? String(count) : '';
    };
    readAll?.addEventListener('click', () => {
      notifications.forEach((item) => item.classList.remove('is-unread'));
      updateBadge();
    });
    updateBadge();
  });

  document.querySelectorAll('[data-chip-menu]').forEach((root) => {
    const row = root.querySelector('[data-chip-row]');
    const options = [...root.querySelectorAll('[data-chip-option]')];
    const selected = new Set();

    const render = () => {
      row.replaceChildren();
      options.forEach((option) => {
        const value = option.textContent.trim();
        option.setAttribute('aria-pressed', String(selected.has(value)));
      });
      selected.forEach((value) => {
        const chip = document.createElement('span');
        chip.className = 'c-dropdown__chip';
        chip.append(document.createTextNode(value));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.setAttribute('aria-label', `${value}を解除`);
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          selected.delete(value);
          render();
        });
        chip.append(remove);
        row.append(chip);
      });
      controllers.get(root)?.position();
    };

    options.forEach((option) => {
      option.addEventListener('click', () => {
        const value = option.textContent.trim();
        if (selected.has(value)) selected.delete(value);
        else selected.add(value);
        render();
      });
    });
    render();
  });
})();
