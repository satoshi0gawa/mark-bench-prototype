(() => {
  document.querySelectorAll('[data-form-count]').forEach((root) => {
    const field = root.querySelector('textarea, input');
    const output = root.querySelector('[data-form-count-output]');
    const max = Number(root.dataset.max) || 80;
    const update = () => {
      const remaining = max - field.value.length;
      output.textContent = remaining >= 0 ? `あと${remaining}文字` : `${Math.abs(remaining)}文字オーバー`;
      output.classList.toggle('is-error', remaining < 0);
    };
    field.addEventListener('input', update);
    update();
  });

  document.querySelectorAll('[data-form-password]').forEach((root) => {
    const field = root.querySelector('input');
    const button = root.querySelector('button');
    button.addEventListener('click', () => {
      const show = field.type === 'password';
      field.type = show ? 'text' : 'password';
      button.textContent = show ? 'HIDE' : 'SHOW';
      button.setAttribute('aria-pressed', String(show));
      button.setAttribute('aria-label', show ? 'パスワードを隠す' : 'パスワードを表示');
    });
  });

  document.querySelectorAll('[data-form-zip]').forEach((field) => {
    field.addEventListener('input', () => {
      const value = field.value.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0)).replace(/\D/g, '').slice(0, 7);
      field.value = value.length > 3 ? `${value.slice(0, 3)}-${value.slice(3)}` : value;
    });
  });

  document.querySelectorAll('[data-form-normalize]').forEach((root) => {
    const field = root.querySelector('input');
    const status = root.querySelector('[data-form-status]');
    field.addEventListener('blur', () => {
      const before = field.value;
      const after = before.replace(/[０-９Ａ-Ｚａ-ｚ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0)).replace(/[ー−―‐－]/g, '-').replace(/\s+/g, '');
      field.value = after;
      status.textContent = before !== after ? `半角へ変換しました：${after}` : '';
      status.classList.toggle('is-success', before !== after);
    });
  });

  document.querySelectorAll('[data-form-required]').forEach((form) => {
    const status = form.querySelector('[data-form-status]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const invalid = [...form.querySelectorAll('[data-required]')].filter((field) => !field.value.trim());
      form.querySelectorAll('[data-required]').forEach((field) => {
        const isInvalid = invalid.includes(field);
        field.classList.toggle('is-error', isInvalid);
        field.setAttribute('aria-invalid', String(isInvalid));
      });
      status.textContent = invalid.length ? `${invalid.map((field) => field.dataset.label).join('・')}を入力してください` : '入力内容を確認できました';
      status.className = `c-form__status ${invalid.length ? 'is-error' : 'is-success'}`;
      invalid[0]?.focus();
    });
  });

  document.querySelectorAll('[data-form-strength]').forEach((root) => {
    const field = root.querySelector('input');
    const bars = [...root.querySelectorAll('[data-strength-bar]')];
    const status = root.querySelector('[data-form-status]');
    const labels = ['', '弱い', '普通', '強い', 'とても強い'];
    const colors = ['', '#9f1d2c', '#805b00', '#315a9b', '#236b43'];
    field.addEventListener('input', () => {
      const value = field.value;
      const checks = [value.length >= 8, /[a-z]/.test(value) && /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)];
      const score = value ? Math.max(1, checks.filter(Boolean).length) : 0;
      root.style.setProperty('--meter-color', colors[score] || colors[1]);
      bars.forEach((bar, index) => bar.classList.toggle('is-active', index < score));
      status.textContent = score ? `強度：${labels[score]}` : '';
    });
  });

  document.querySelectorAll('[data-form-match]').forEach((root) => {
    const base = root.querySelector('[data-form-match-base]');
    const confirm = root.querySelector('[data-form-match-confirm]');
    const status = root.querySelector('[data-form-status]');
    const update = () => {
      const baseValue = base.value.trim();
      const confirmValue = confirm.value.trim();
      const hasValue = confirmValue.length > 0;
      const matched = hasValue && baseValue === confirmValue;
      confirm.classList.toggle('is-error', hasValue && !matched);
      confirm.setAttribute('aria-invalid', String(hasValue && !matched));
      status.textContent = !hasValue ? '確認用メールアドレスを入力してください' : matched ? 'メールアドレスが一致しました' : 'メールアドレスが一致しません';
      status.className = `c-form__status ${hasValue ? (matched ? 'is-success' : 'is-error') : ''}`;
    };
    base.addEventListener('input', update);
    confirm.addEventListener('input', update);
    update();
  });

  document.querySelectorAll('[data-form-checkall]').forEach((root) => {
    const parent = root.querySelector('[data-checkall-parent]');
    const children = [...root.querySelectorAll('[data-checkall-child]')];
    const sync = () => {
      const checked = children.filter((item) => item.checked).length;
      parent.checked = checked === children.length;
      parent.indeterminate = checked > 0 && checked < children.length;
    };
    parent.addEventListener('change', () => children.forEach((item) => { item.checked = parent.checked; }));
    children.forEach((item) => item.addEventListener('change', sync));
  });

  document.querySelectorAll('[data-form-conditional]').forEach((root) => {
    const source = root.querySelector('select');
    const update = () => root.querySelectorAll('[data-show-on]').forEach((extra) => {
      const show = extra.dataset.showOn === source.value;
      extra.hidden = !show;
      extra.querySelectorAll('input, textarea, select').forEach((field) => {
        field.required = show;
        if (!show) field.value = '';
      });
    });
    source.addEventListener('change', update);
    update();
  });

  document.querySelectorAll('[data-form-review]').forEach((root) => {
    const review = root.querySelector('[data-form-review-output]');
    root.querySelector('button').addEventListener('click', () => {
      review.replaceChildren();
      root.querySelectorAll('[data-review-label]').forEach((field) => {
        const term = document.createElement('dt');
        const value = document.createElement('dd');
        term.textContent = field.dataset.reviewLabel;
        value.textContent = field.value || '（未入力）';
        review.append(term, value);
      });
      review.hidden = false;
    });
  });

  document.querySelectorAll('[data-form-consent]').forEach((form) => {
    const check = form.querySelector('[data-form-consent-check]');
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[data-form-status]');
    const update = () => {
      button.disabled = !check.checked;
      status.textContent = check.checked ? '送信できます' : '同意すると送信できます';
      status.classList.toggle('is-success', check.checked);
    };
    check.addEventListener('change', update);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!check.checked) return;
      status.textContent = '同意内容と入力内容を送信しました';
    });
    update();
  });

  document.querySelectorAll('[data-form-once]').forEach((form) => {
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[data-form-status]');
    const label = button.textContent;
    let timer = 0;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (button.disabled) return;
      window.clearTimeout(timer);
      button.disabled = true;
      button.textContent = '送信中…';
      status.textContent = '送信処理中です';
      timer = window.setTimeout(() => {
        button.disabled = false;
        button.textContent = label;
        status.textContent = '送信が完了しました';
        status.classList.add('is-success');
      }, 1400);
    });
  });

  document.querySelectorAll('[data-form-unsaved]').forEach((root) => {
    const field = root.querySelector('input, textarea');
    const badge = root.querySelector('[data-form-dirty]');
    const link = root.querySelector('[data-form-leave]');
    const status = root.querySelector('[data-form-status]');
    let dirty = false;
    field.addEventListener('input', () => { dirty = true; badge.hidden = false; });
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (dirty && !window.confirm('変更が保存されていません。移動しますか？')) {
        status.textContent = '移動をキャンセルしました';
        return;
      }
      dirty = false;
      badge.hidden = true;
      status.textContent = '移動しました（デモ）';
    });
  });

  document.querySelectorAll('[data-form-draft]').forEach((root) => {
    const field = root.querySelector('textarea');
    const bar = root.querySelector('[data-form-draft-bar]');
    const status = root.querySelector('[data-form-status]');
    const key = root.dataset.storageKey || 'mark-bench-form-draft';
    let saved = '';
    let timer = 0;
    try { saved = localStorage.getItem(key) || ''; } catch {}
    if (saved) bar.hidden = false;
    root.querySelector('[data-draft-restore]').addEventListener('click', () => {
      field.value = saved;
      bar.hidden = true;
      status.textContent = '下書きを復元しました';
    });
    root.querySelector('[data-draft-discard]').addEventListener('click', () => {
      saved = '';
      field.value = '';
      try { localStorage.removeItem(key); } catch {}
      bar.hidden = true;
      status.textContent = '下書きを破棄しました';
    });
    field.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        saved = field.value;
        try { saved ? localStorage.setItem(key, saved) : localStorage.removeItem(key); } catch {}
        bar.hidden = !saved;
        status.textContent = saved ? '下書きを自動保存しました' : '';
      }, 400);
    });
  });
})();
