(() => {
  const focusableSelector = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

  const createController = (root) => {
    const layer = root.querySelector('[data-modal-layer]');
    if (!layer) return null;

    let returnFocus = null;
    let closeTimer = 0;
    let isClosing = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        close();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = [...layer.querySelectorAll(focusableSelector)].filter((element) => !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const open = (opener) => {
      window.clearTimeout(closeTimer);
      isClosing = false;
      returnFocus = opener || document.activeElement;
      layer.dataset.modalVariant = opener?.dataset.modalVariant || 'fade';
      layer.hidden = false;
      layer.classList.remove('is-closing');
      layer.classList.add('is-open');
      document.addEventListener('keydown', onKeydown);
      const initialFocus = layer.querySelector('[data-initial-focus]') || layer.querySelector(focusableSelector);
      initialFocus?.focus({ preventScroll: true });
    };

    const close = () => {
      if (layer.hidden || isClosing) return;
      isClosing = true;
      document.removeEventListener('keydown', onKeydown);
      layer.classList.add('is-closing');

      const finish = () => {
        layer.classList.remove('is-open', 'is-closing');
        layer.hidden = true;
        isClosing = false;
        returnFocus?.focus({ preventScroll: true });
      };

      closeTimer = window.setTimeout(finish, reduceMotion ? 0 : 200);
    };

    root.querySelectorAll('[data-modal-open]').forEach((button) => {
      button.addEventListener('click', () => open(button));
    });

    layer.addEventListener('click', (event) => {
      if (event.target.closest('[data-modal-close]')) close();
    });

    return { open, close, layer };
  };

  document.querySelectorAll('[data-modal-demo]').forEach((root) => {
    root.modalController = createController(root);
  });

  document.querySelectorAll('[data-confirm-demo]').forEach((root) => {
    const result = root.querySelector('[data-confirm-output]');
    root.querySelectorAll('[data-confirm-result]').forEach((button) => {
      button.addEventListener('click', () => {
        result.textContent = button.dataset.confirmResult === 'ok' ? 'OKを選択しました' : 'キャンセルしました';
      });
    });
  });

  document.querySelectorAll('[data-lightbox-demo]').forEach((root) => {
    const image = root.querySelector('[data-lightbox-image]');
    const caption = root.querySelector('[data-lightbox-caption]');

    root.querySelectorAll('[data-lightbox-open]').forEach((button) => {
      button.addEventListener('click', () => {
        image.dataset.theme = button.dataset.theme;
        caption.textContent = button.dataset.caption;
        root.modalController?.open(button);
      });
    });
  });

  document.querySelectorAll('[data-native-dialog]').forEach((root) => {
    const dialog = root.querySelector('dialog');
    const opener = root.querySelector('[data-dialog-open]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let closeTimer = 0;

    const openDialog = () => {
      window.clearTimeout(closeTimer);
      root.classList.remove('is-closing');
      root.classList.add('is-open');
      dialog.classList.remove('is-closing');
      dialog.show();
      dialog.querySelector('[data-dialog-close]')?.focus();
    };

    const closeDialog = () => {
      if (!dialog.open || root.classList.contains('is-closing')) return;
      root.classList.add('is-closing');
      closeTimer = window.setTimeout(() => {
        dialog.close();
      }, reduceMotion ? 0 : 200);
    };

    opener?.addEventListener('click', openDialog);
    root.querySelectorAll('[data-dialog-close], [data-dialog-backdrop]').forEach((control) => {
      control.addEventListener('click', closeDialog);
    });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog();
      }
    });
    dialog?.addEventListener('close', () => {
      root.classList.remove('is-open', 'is-closing');
      opener?.focus();
    });
  });

  document.querySelectorAll('[data-delayed-demo]').forEach((root) => {
    const trigger = root.querySelector('[data-delay-open]');
    const status = root.querySelector('[data-delay-status]');
    let timer;

    trigger?.addEventListener('click', () => {
      window.clearTimeout(timer);
      status.textContent = '600ms後に表示します…';
      timer = window.setTimeout(() => {
        status.textContent = '表示しました';
        root.modalController?.open(trigger);
      }, 600);
    });
  });

  document.querySelectorAll('[data-exit-demo]').forEach((root) => {
    const trigger = root.querySelector('[data-exit-open]');
    trigger?.addEventListener('click', () => root.modalController?.open(trigger));
  });

  document.querySelectorAll('[data-wizard-demo]').forEach((root) => {
    const steps = [...root.querySelectorAll('[data-wizard-step]')];
    const dots = [...root.querySelectorAll('[data-wizard-dot]')];
    const back = root.querySelector('[data-wizard-back]');
    const next = root.querySelector('[data-wizard-next]');
    const opener = root.querySelector('[data-wizard-open]');
    let current = 0;

    const render = () => {
      steps.forEach((step, index) => { step.hidden = index !== current; });
      dots.forEach((dot, index) => dot.classList.toggle('is-active', index <= current));
      back.disabled = current === 0;
      next.textContent = current === steps.length - 1 ? '完了' : '次へ';
    };

    opener?.addEventListener('click', () => {
      current = 0;
      render();
    });
    back?.addEventListener('click', () => {
      current = Math.max(0, current - 1);
      render();
    });
    next?.addEventListener('click', () => {
      if (current === steps.length - 1) root.modalController?.close();
      else {
        current += 1;
        render();
      }
    });
    render();
  });

  document.querySelectorAll('[data-form-modal]').forEach((root) => {
    const form = root.querySelector('form');
    const thanks = root.querySelector('[data-form-thanks]');
    const opener = root.querySelector('[data-form-open]');

    opener?.addEventListener('click', () => {
      form.hidden = false;
      thanks.hidden = true;
    });

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      form.hidden = true;
      thanks.hidden = false;
      thanks.querySelector('button')?.focus({ preventScroll: true });
    });
  });
})();
