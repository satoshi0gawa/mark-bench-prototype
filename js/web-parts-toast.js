(() => {
  const roots = [...document.querySelectorAll('[data-toast-demo]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setTriggerLock = (root, locked) => {
    if (root.dataset.toastKind === 'stack' || root.dataset.toastKind === 'status') return;
    root.dataset.toastActive = String(locked);
    root.querySelectorAll('[data-toast-trigger]').forEach((button) => {
      button.disabled = locked;
    });
  };

  const icon = (label) => {
    const element = document.createElement('span');
    element.className = 'c-toast__icon';
    element.textContent = label;
    element.setAttribute('aria-hidden', 'true');
    return element;
  };

  const body = (title, text) => {
    const element = document.createElement('span');
    element.className = 'c-toast__body';
    const strong = document.createElement('strong');
    strong.textContent = title;
    element.appendChild(strong);
    if (text) {
      const small = document.createElement('small');
      small.textContent = text;
      element.appendChild(small);
    }
    return element;
  };

  const hide = (item, restoreFocus) => {
    if (!item?.isConnected || item.dataset.closing === 'true') return;
    const root = item.closest('[data-toast-demo]');
    item.dataset.closing = 'true';
    window.clearTimeout(Number(item.dataset.timer));
    item.classList.remove('is-visible');
    const remove = () => {
      item.remove();
      if (root && !root.querySelector('.c-toast__item')) setTriggerLock(root, false);
      if (restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true });
    };
    if (reduceMotion) remove();
    else window.setTimeout(remove, 260);
  };

  const mount = (root, options = {}) => {
    const region = root.querySelector('[data-toast-region]');
    if (!region) return null;
    setTriggerLock(root, true);
    if (options.replace !== false) [...region.children].forEach((item) => hide(item));

    const item = document.createElement('div');
    item.className = 'c-toast__item';
    if (options.tone) item.dataset.tone = options.tone;
    if (options.alert) item.setAttribute('role', 'alert');
    options.nodes?.forEach((node) => item.appendChild(node));
    region.appendChild(item);
    window.requestAnimationFrame(() => item.classList.add('is-visible'));

    if (options.duration) {
      const timer = window.setTimeout(() => hide(item), options.duration);
      item.dataset.timer = String(timer);
    }
    return item;
  };

  const addText = (value, className) => {
    const element = document.createElement('span');
    if (className) element.className = className;
    element.textContent = value;
    return element;
  };

  roots.forEach((root) => {
    const kind = root.dataset.toastKind;
    const duration = Number.parseInt(root.dataset.duration, 10) || 3200;
    let count = 0;

    root.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-toast-trigger]');
      if (!trigger || !root.contains(trigger)) return;
      if (kind !== 'stack' && kind !== 'status' && root.dataset.toastActive === 'true') return;
      const value = trigger.dataset.toastTrigger;

      if (kind === 'basic') {
        const dot = addText('', 'c-toast__dot');
        dot.setAttribute('aria-hidden', 'true');
        mount(root, { duration, nodes: [dot, addText('保存しました')] });
      }

      if (kind === 'status') {
        const messages = {
          success: ['✓', '保存に成功しました'],
          error: ['×', 'エラーが発生しました'],
          warning: ['!', '入力内容をご確認ください'],
          info: ['i', '新しいお知らせがあります'],
        };
        const [mark, message] = messages[value] || messages.info;
        const activeItem = root.querySelector('.c-toast__item');
        if (activeItem && activeItem.dataset.closing !== 'true') {
          window.clearTimeout(Number(activeItem.dataset.timer));
          activeItem.dataset.tone = value;
          activeItem.replaceChildren(icon(mark), addText(message));
          if (value === 'error') activeItem.setAttribute('role', 'alert');
          else activeItem.removeAttribute('role');
          const timer = window.setTimeout(() => hide(activeItem), duration);
          activeItem.dataset.timer = String(timer);
          return;
        }
        mount(root, { tone: value, alert: value === 'error', duration, nodes: [icon(mark), addText(message)] });
      }

      if (kind === 'progress') {
        const progress = addText('', 'c-toast__progress');
        const item = mount(root, { nodes: [addText('メッセージを送信しました'), progress] });
        item?.style.setProperty('--toast-life', `${duration}ms`);
        progress.addEventListener('animationend', () => hide(item), { once: true });
      }

      if (kind === 'stack') {
        count += 1;
        const badge = addText(String(count), 'c-toast__count');
        const item = mount(root, { replace: false, duration, nodes: [badge, addText('通知が届きました')] });
        const region = root.querySelector('[data-toast-region]');
        while (region.children.length > 4) region.firstElementChild.remove();
        item?.setAttribute('aria-label', `通知${count}件目`);
      }

      if (kind === 'dismiss') {
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'c-toast__close';
        close.setAttribute('aria-label', '通知を閉じる');
        close.textContent = '×';
        const item = mount(root, { nodes: [addText('手動で閉じるお知らせです'), close] });
        close.addEventListener('click', () => hide(item, trigger));
      }

      if (kind === 'undo') {
        const undo = document.createElement('button');
        undo.type = 'button';
        undo.className = 'c-toast__action';
        undo.textContent = '元に戻す';
        const item = mount(root, { duration, nodes: [addText('アイテムを削除しました'), undo] });
        undo.addEventListener('click', () => {
          window.clearTimeout(Number(item.dataset.timer));
          item.replaceChildren(addText('元に戻しました'));
          item.tabIndex = -1;
          item.focus({ preventScroll: true });
          const timer = window.setTimeout(() => hide(item), 1800);
          item.dataset.timer = String(timer);
        });
      }

      if (kind === 'topbar') {
        mount(root, { duration, nodes: [addText('設定を保存しました ✓')] });
      }

      if (kind === 'actions') {
        const actions = document.createElement('span');
        actions.className = 'c-toast__actions';
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'c-toast__action';
        close.textContent = '閉じる';
        const open = close.cloneNode();
        open.textContent = '表示';
        actions.append(close, open);
        const item = mount(root, { nodes: [body('新着メッセージ', '佐藤さんからメッセージが届いています。'), actions] });
        close.addEventListener('click', () => hide(item, trigger));
        open.addEventListener('click', () => {
          hide(item, trigger);
          root.querySelector('[data-toast-output]').textContent = 'メッセージを表示しました';
        });
      }

      if (kind === 'consent') {
        const storageKey = 'mark-bench-toast-consent-demo';
        if (value === 'reset') {
          try { localStorage.removeItem(storageKey); } catch { /* Storage may be unavailable. */ }
        }
        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'c-toast__action';
        action.textContent = '同意する';
        const message = addText('当サイトでは体験向上のためCookieを使用します。');
        const item = mount(root, { nodes: [message, action] });
        action.addEventListener('click', () => {
          try { localStorage.setItem(storageKey, '1'); } catch { /* Storage may be unavailable. */ }
          hide(item, trigger);
        });
      }

      if (kind === 'network') {
        const offline = value === 'offline';
        mount(root, {
          tone: value,
          alert: offline,
          duration,
          nodes: [icon(offline ? '!' : '✓'), addText(offline ? 'オフラインになりました' : 'オンラインに戻りました')],
        });
      }

      if (kind === 'rich') {
        mount(root, { duration, nodes: [icon('✉'), body('佐藤さんからメッセージ', '明日の打ち合わせは10時からです。')] });
      }

      if (kind === 'achievement') {
        const item = mount(root, { duration, nodes: [icon('★'), body('実績を解除しました', 'はじめての投稿を完了')] });
        const colors = ['#ff0', '#315a9b', '#fff', '#aeb8c7'];
        for (let index = 0; index < 10; index += 1) {
          const piece = addText('', 'c-toast__confetti');
          piece.style.left = `${7 + ((index * 29) % 86)}%`;
          piece.style.background = colors[index % colors.length];
          piece.style.animationDelay = `${(index % 4) * 60}ms`;
          item?.appendChild(piece);
        }
      }
    });

    if (kind === 'consent') {
      let agreed = false;
      try { agreed = localStorage.getItem('mark-bench-toast-consent-demo') === '1'; } catch { /* Storage may be unavailable. */ }
      if (!agreed) root.querySelector('[data-toast-trigger="reset"]')?.click();
    }

    if (kind === 'network') {
      window.addEventListener('offline', () => root.querySelector('[data-toast-trigger="offline"]')?.click());
      window.addEventListener('online', () => root.querySelector('[data-toast-trigger="online"]')?.click());
    }
  });
})();
