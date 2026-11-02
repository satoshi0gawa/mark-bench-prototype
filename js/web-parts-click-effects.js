(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const removeAfterAnimation = (node, fallback = 900) => {
    const timer = window.setTimeout(() => node.remove(), fallback);
    node.addEventListener('animationend', () => {
      window.clearTimeout(timer);
      node.remove();
    }, { once: true });
  };
  const pointIn = (element, event) => {
    const rect = element.getBoundingClientRect();
    const keyboard = event.detail === 0 || (!event.clientX && !event.clientY);
    return {
      x: keyboard ? rect.width / 2 : event.clientX - rect.left,
      y: keyboard ? rect.height / 2 : event.clientY - rect.top
    };
  };

  document.querySelectorAll('[data-click-ripple]').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (reduceMotion) return;
      const point = pointIn(button, event);
      const ripple = document.createElement('span');
      ripple.className = 'c-click-effect__ripple';
      ripple.style.left = `${point.x}px`;
      ripple.style.top = `${point.y}px`;
      ripple.setAttribute('aria-hidden', 'true');
      button.append(ripple);
      removeAfterAnimation(ripple, 750);
    });
  });

  document.querySelectorAll('[data-click-like]').forEach((button) => {
    const count = button.querySelector('[data-like-count]');
    const initial = Number(count.textContent);
    button.addEventListener('click', () => {
      const active = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
      count.textContent = String(initial + (active ? 1 : 0));
      if (reduceMotion || !active) return;
      for (let index = 0; index < 5; index += 1) {
        const heart = document.createElement('span');
        heart.className = 'c-click-effect__heart-particle';
        heart.textContent = '♥';
        heart.style.setProperty('--x', `${(index - 2) * 18}px`);
        heart.style.setProperty('--delay', `${index * 35}ms`);
        heart.setAttribute('aria-hidden', 'true');
        button.append(heart);
        removeAfterAnimation(heart, 1000);
      }
    });
  });

  document.querySelectorAll('[data-click-badge]').forEach((button) => {
    const output = button.querySelector('[data-badge-count]');
    button.addEventListener('click', () => {
      output.textContent = String(Number(output.textContent) + 1);
      output.classList.remove('is-pop');
      void output.offsetWidth;
      if (!reduceMotion) output.classList.add('is-pop');
    });
  });

  document.querySelectorAll('[data-click-success]').forEach((button) => {
    const label = button.querySelector('[data-success-label]');
    let timer = 0;
    button.addEventListener('click', () => {
      if (button.disabled) return;
      window.clearTimeout(timer);
      button.disabled = true;
      button.classList.add('is-loading');
      label.textContent = '送信中';
      const complete = () => {
        button.classList.remove('is-loading');
        button.classList.add('is-complete');
        label.textContent = '送信完了';
        timer = window.setTimeout(() => {
          button.classList.remove('is-complete');
          button.disabled = false;
          label.textContent = '送信する';
        }, reduceMotion ? 900 : 1600);
      };
      timer = window.setTimeout(complete, reduceMotion ? 0 : 650);
    });
  });

  document.querySelectorAll('[data-click-shake]').forEach((root) => {
    const input = root.querySelector('input');
    const message = root.querySelector('[data-shake-message]');
    let timer = 0;
    root.querySelector('[data-shake-trigger]').addEventListener('click', () => {
      window.clearTimeout(timer);
      root.classList.remove('is-error');
      void root.offsetWidth;
      root.classList.add('is-error');
      input.setAttribute('aria-invalid', 'true');
      message.hidden = false;
      input.focus({ preventScroll: true });
      timer = window.setTimeout(() => root.classList.remove('is-error'), 850);
    });
    input.addEventListener('input', () => {
      input.setAttribute('aria-invalid', 'false');
      message.hidden = true;
      root.classList.remove('is-error');
    });
  });

  document.querySelectorAll('[data-click-confetti]').forEach((root) => {
    root.querySelector('button').addEventListener('click', () => {
      if (reduceMotion) return;
      for (let index = 0; index < 18; index += 1) {
        const piece = document.createElement('span');
        piece.className = 'c-click-effect__confetti';
        piece.style.setProperty('--x', `${(Math.random() - 0.5) * 220}px`);
        piece.style.setProperty('--r', `${Math.random() * 480 - 240}deg`);
        piece.style.setProperty('--delay', `${Math.random() * 120}ms`);
        piece.style.setProperty('--color', ['#18243b', '#315a9b', '#ff0', '#d9485f'][index % 4]);
        piece.setAttribute('aria-hidden', 'true');
        root.append(piece);
        removeAfterAnimation(piece, 1300);
      }
    });
  });

  document.querySelectorAll('[data-click-burst]').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (reduceMotion) return;
      const point = pointIn(button, event);
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        const star = document.createElement('span');
        star.className = 'c-click-effect__star';
        star.textContent = '✦';
        star.style.left = `${point.x}px`;
        star.style.top = `${point.y}px`;
        star.style.setProperty('--x', `${Math.cos(angle) * 64}px`);
        star.style.setProperty('--y', `${Math.sin(angle) * 64}px`);
        star.setAttribute('aria-hidden', 'true');
        button.append(star);
        removeAfterAnimation(star, 850);
      }
    });
  });

  document.querySelectorAll('[data-click-hold]').forEach((button) => {
    const label = button.querySelector('[data-hold-label]');
    let timer = 0;
    let holding = false;
    const cancel = () => {
      if (!holding) return;
      holding = false;
      window.clearTimeout(timer);
      button.classList.remove('is-holding');
    };
    const complete = () => {
      holding = false;
      button.classList.remove('is-holding');
      button.classList.add('is-complete');
      label.textContent = '削除を確定しました';
      window.setTimeout(() => {
        button.classList.remove('is-complete');
        label.textContent = '長押しで削除';
      }, 1600);
    };
    const start = () => {
      if (holding || button.classList.contains('is-complete')) return;
      holding = true;
      button.classList.add('is-holding');
      timer = window.setTimeout(complete, reduceMotion ? 500 : 1000);
    };
    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', cancel);
    button.addEventListener('pointercancel', cancel);
    button.addEventListener('pointerleave', cancel);
    button.addEventListener('keydown', (event) => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
        event.preventDefault();
        start();
      }
    });
    button.addEventListener('keyup', (event) => {
      if (event.key === ' ' || event.key === 'Enter') cancel();
    });
  });

  document.querySelectorAll('[data-click-combo]').forEach((root) => {
    const output = root.querySelector('[data-combo-output]');
    let count = 0;
    let timer = 0;
    root.querySelector('button').addEventListener('click', () => {
      count += 1;
      output.textContent = `${count} COMBO`;
      output.classList.remove('is-pop');
      void output.offsetWidth;
      if (!reduceMotion) output.classList.add('is-pop');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        count = 0;
        output.textContent = 'READY';
      }, Number(root.dataset.wait || 1200));
    });
  });

  document.querySelectorAll('[data-click-copy]').forEach((button) => {
    const label = button.querySelector('[data-copy-label]');
    const value = button.dataset.copyValue || '';
    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (!copied) throw new Error('Copy failed');
    };
    button.addEventListener('click', async () => {
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
        else fallbackCopy();
        button.classList.add('is-complete');
        label.textContent = 'コピーしました';
      } catch {
        try {
          fallbackCopy();
          button.classList.add('is-complete');
          label.textContent = 'コピーしました';
        } catch {
          label.textContent = 'コピーできませんでした';
        }
      }
      window.setTimeout(() => {
        button.classList.remove('is-complete');
        label.textContent = 'URLをコピー';
      }, 1600);
    });
  });

  document.querySelectorAll('[data-click-confirm]').forEach((button) => {
    const label = button.querySelector('[data-confirm-label]');
    let armed = false;
    let timer = 0;
    button.addEventListener('click', () => {
      window.clearTimeout(timer);
      if (!armed) {
        armed = true;
        button.classList.add('is-armed');
        label.textContent = 'もう一度押して削除';
        timer = window.setTimeout(() => {
          armed = false;
          button.classList.remove('is-armed');
          label.textContent = '削除する';
        }, 3000);
        return;
      }
      armed = false;
      button.classList.remove('is-armed');
      button.classList.add('is-complete');
      button.disabled = true;
      label.textContent = '削除しました';
      timer = window.setTimeout(() => {
        button.classList.remove('is-complete');
        button.disabled = false;
        label.textContent = '削除する';
      }, 1600);
    });
  });

  document.querySelectorAll('[data-click-cooldown]').forEach((button) => {
    const label = button.querySelector('[data-cooldown-label]');
    const duration = Number(button.dataset.seconds || 3);
    button.addEventListener('click', () => {
      if (button.disabled) return;
      let remaining = duration;
      button.disabled = true;
      button.classList.add('is-cooling');
      label.textContent = `再送まで ${remaining}秒`;
      const timer = window.setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          label.textContent = `再送まで ${remaining}秒`;
          return;
        }
        window.clearInterval(timer);
        button.disabled = false;
        button.classList.remove('is-cooling');
        label.textContent = '認証コードを送信';
      }, 1000);
    });
  });

  document.querySelectorAll('[data-click-save]').forEach((root) => {
    const button = root.querySelector('button');
    const status = root.querySelector('[data-save-status]');
    let timer = 0;
    root.querySelector('input').addEventListener('input', () => {
      window.clearTimeout(timer);
      root.classList.remove('is-complete');
      status.textContent = '未保存の変更';
    });
    button.addEventListener('click', () => {
      if (button.disabled) return;
      button.disabled = true;
      root.classList.add('is-saving');
      status.textContent = '保存中…';
      timer = window.setTimeout(() => {
        button.disabled = false;
        root.classList.remove('is-saving');
        root.classList.add('is-complete');
        status.textContent = '保存しました';
      }, reduceMotion ? 0 : 700);
    });
  });

  document.querySelectorAll('[data-click-cart]').forEach((root) => {
    const button = root.querySelector('button');
    const count = root.querySelector('[data-cart-count]');
    button.addEventListener('click', () => {
      const finish = () => {
        count.textContent = String(Number(count.textContent) + 1);
        count.classList.remove('is-pop');
        void count.offsetWidth;
        if (!reduceMotion) count.classList.add('is-pop');
      };
      if (reduceMotion) {
        finish();
        return;
      }
      const item = document.createElement('span');
      item.className = 'c-click-effect__cart-fly';
      item.textContent = '＋';
      item.setAttribute('aria-hidden', 'true');
      root.append(item);
      item.addEventListener('animationend', () => {
        item.remove();
        finish();
      }, { once: true });
    });
  });

  document.querySelectorAll('[data-click-undo]').forEach((root) => {
    const item = root.querySelector('[data-undo-item]');
    const bar = root.querySelector('[data-undo-bar]');
    const status = root.querySelector('[data-undo-status]');
    let timer = 0;
    const restore = () => {
      window.clearTimeout(timer);
      item.hidden = false;
      bar.hidden = true;
      status.textContent = '項目を元に戻しました';
    };
    root.querySelector('[data-undo-delete]').addEventListener('click', () => {
      item.hidden = true;
      bar.hidden = false;
      status.textContent = '項目を削除しました。取り消せます';
      timer = window.setTimeout(() => {
        bar.hidden = true;
        status.textContent = '削除を確定しました';
      }, 4000);
    });
    root.querySelector('[data-undo-restore]').addEventListener('click', restore);
  });

  if (!reduceMotion && finePointer) {
    document.querySelectorAll('[data-click-stalker]').forEach((root) => {
      const follower = root.querySelector('[data-stalker-follower]');
      let frame = 0;
      root.addEventListener('pointermove', (event) => {
        const rect = root.getBoundingClientRect();
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(() => {
          follower.style.transform = `translate3d(${event.clientX - rect.left}px, ${event.clientY - rect.top}px, 0)`;
          follower.classList.add('is-visible');
        });
      });
      root.addEventListener('pointerleave', () => follower.classList.remove('is-visible'));
      root.querySelectorAll('[data-stalker-target]').forEach((target) => {
        target.addEventListener('pointerenter', () => follower.classList.add('is-active'));
        target.addEventListener('pointerleave', () => follower.classList.remove('is-active'));
      });
    });

    document.querySelectorAll('[data-click-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(700px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    document.querySelectorAll('[data-click-magnet]').forEach((root) => {
      const button = root.querySelector('button');
      root.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.22;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.22;
        button.style.transform = `translate(${x}px, ${y}px)`;
      });
      root.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }
})();
