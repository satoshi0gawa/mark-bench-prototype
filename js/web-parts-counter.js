(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (value) => String(value).padStart(2, '0');

  const whenVisible = (element, callback) => {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      callback();
      return;
    }
    let started = false;
    const observer = new IntersectionObserver((entries) => {
      if (started || !entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35)) return;
      started = true;
      observer.disconnect();
      requestAnimationFrame(callback);
    }, { threshold: 0.35, rootMargin: '0px 0px -10% 0px' });
    observer.observe(element);
  };

  document.querySelectorAll('[data-counter-value]').forEach((root) => {
    const output = root.querySelector('[data-counter-output]');
    const replay = root.querySelector('[data-counter-replay]');
    const target = Number(root.dataset.to || 0);
    const duration = Number(root.dataset.duration || 1200);
    const formatter = root.dataset.format === 'comma'
      ? (value) => value.toLocaleString('ja-JP')
      : (value) => String(value);
    let frame = 0;

    const play = () => {
      cancelAnimationFrame(frame);
      if (reduceMotion) {
        output.textContent = formatter(target);
        return;
      }
      const startedAt = performance.now();
      const step = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        output.textContent = formatter(Math.round(target * eased));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      output.textContent = '0';
      frame = requestAnimationFrame(step);
    };

    replay?.addEventListener('click', play);
    whenVisible(root, play);
  });

  document.querySelectorAll('[data-counter-ring]').forEach((root) => {
    const ring = root.querySelector('[data-counter-ring-graphic]');
    const output = root.querySelector('[data-counter-ring-output]');
    const replay = root.querySelector('[data-counter-replay]');
    const target = Math.min(100, Math.max(0, Number(root.dataset.to || 0)));
    let frame = 0;

    const play = () => {
      cancelAnimationFrame(frame);
      if (reduceMotion) {
        ring.style.setProperty('--counter-progress', target);
        output.textContent = String(target);
        return;
      }
      const startedAt = performance.now();
      const duration = 1200;
      const step = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const value = target * (1 - Math.pow(1 - progress, 3));
        ring.style.setProperty('--counter-progress', value);
        output.textContent = String(Math.round(value));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    replay?.addEventListener('click', play);
    whenVisible(root, play);
  });

  document.querySelectorAll('[data-counter-roll]').forEach((root) => {
    const digits = root.querySelector('[data-counter-roll-digits]');
    const replay = root.querySelector('[data-counter-replay]');
    const columns = [];
    let timers = [];
    String(root.dataset.to || '0').split('').forEach((character) => {
      if (/\d/.test(character)) {
        const column = document.createElement('span');
        const strip = document.createElement('span');
        column.className = 'c-counter-roll__column';
        column.setAttribute('aria-hidden', 'true');
        strip.className = 'c-counter-roll__strip';
        for (let value = 0; value <= 9; value += 1) {
          const digit = document.createElement('span');
          digit.textContent = String(value);
          strip.appendChild(digit);
        }
        column.appendChild(strip);
        digits.appendChild(column);
        columns.push({ strip, value: Number(character) });
      } else {
        const separator = document.createElement('span');
        separator.className = 'c-counter-roll__separator';
        separator.setAttribute('aria-hidden', 'true');
        separator.textContent = character;
        digits.appendChild(separator);
      }
    });

    const play = () => {
      timers.forEach(window.clearTimeout);
      timers = [];
      columns.forEach(({ strip }) => {
        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0)';
      });
      void digits.offsetWidth;
      columns.forEach(({ strip, value }, index) => {
        strip.style.transition = reduceMotion ? 'none' : '';
        if (reduceMotion) {
          strip.style.transform = `translateY(-${value}em)`;
          return;
        }
        timers.push(window.setTimeout(() => {
          strip.style.transform = `translateY(-${value}em)`;
        }, index * 100));
      });
    };

    replay?.addEventListener('click', play);
    whenVisible(root, play);
  });

  document.querySelectorAll('[data-counter-countdown]').forEach((root) => {
    const outputs = {
      days: root.querySelector('[data-countdown-days]'),
      hours: root.querySelector('[data-countdown-hours]'),
      minutes: root.querySelector('[data-countdown-minutes]'),
      seconds: root.querySelector('[data-countdown-seconds]')
    };
    const deadline = Date.now() + Number(root.dataset.seconds || 0) * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      outputs.days.textContent = String(Math.floor(remaining / 86400));
      outputs.hours.textContent = pad(Math.floor(remaining / 3600) % 24);
      outputs.minutes.textContent = pad(Math.floor(remaining / 60) % 60);
      outputs.seconds.textContent = pad(remaining % 60);
      if (remaining > 0) window.setTimeout(tick, 1000 - (Date.now() % 1000));
      else root.classList.add('is-complete');
    };
    tick();
  });

  document.querySelectorAll('[data-counter-stopwatch]').forEach((root) => {
    const output = root.querySelector('[data-stopwatch-output]');
    const start = root.querySelector('[data-stopwatch-start]');
    const stop = root.querySelector('[data-stopwatch-stop]');
    const reset = root.querySelector('[data-stopwatch-reset]');
    let accumulated = 0;
    let startedAt = null;
    let frame = 0;
    const format = (milliseconds) => `${pad(Math.floor(milliseconds / 60000))}:${pad(Math.floor(milliseconds / 1000) % 60)}.${pad(Math.floor(milliseconds / 10) % 100)}`;
    const render = () => {
      output.textContent = format(accumulated + performance.now() - startedAt);
      frame = requestAnimationFrame(render);
    };
    start.addEventListener('click', () => {
      if (startedAt !== null) return;
      startedAt = performance.now();
      root.classList.add('is-running');
      start.disabled = true;
      stop.disabled = false;
      frame = requestAnimationFrame(render);
    });
    stop.addEventListener('click', () => {
      if (startedAt === null) return;
      accumulated += performance.now() - startedAt;
      startedAt = null;
      cancelAnimationFrame(frame);
      root.classList.remove('is-running');
      start.disabled = false;
      stop.disabled = true;
    });
    reset.addEventListener('click', () => {
      accumulated = 0;
      startedAt = null;
      cancelAnimationFrame(frame);
      root.classList.remove('is-running');
      start.disabled = false;
      stop.disabled = true;
      output.textContent = '00:00.00';
    });
  });

  document.querySelectorAll('[data-counter-days]').forEach((root) => {
    const start = new Date(`${root.dataset.from}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.max(0, Math.floor((today - start) / 86400000));
    root.querySelector('[data-counter-days-output]').textContent = days.toLocaleString('ja-JP');
  });

  document.querySelectorAll('[data-counter-clock]').forEach((root) => {
    const dateOutput = root.querySelector('[data-clock-date]');
    const timeOutput = root.querySelector('[data-clock-time]');
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const tick = () => {
      const now = new Date();
      dateOutput.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${weekdays[now.getDay()]}）`;
      timeOutput.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      window.setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
  });

  document.querySelectorAll('[data-counter-business]').forEach((root) => {
    const output = root.querySelector('[data-business-output]');
    const days = (root.dataset.days || '1,2,3,4,5').split(',').map(Number);
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const update = () => {
      const now = new Date();
      const current = now.getHours() * 60 + now.getMinutes();
      const isOpen = days.includes(now.getDay()) && current >= toMinutes(root.dataset.open) && current < toMinutes(root.dataset.close);
      root.classList.toggle('is-open', isOpen);
      output.textContent = isOpen ? '営業中' : '営業時間外';
    };
    update();
    window.setInterval(update, 60000);
  });

  document.querySelectorAll('[data-counter-typewriter]').forEach((root) => {
    const output = root.querySelector('[data-typewriter-output]');
    const words = (root.dataset.words || '').split(',').filter(Boolean);
    if (!words.length) return;
    if (reduceMotion) {
      output.textContent = words[0];
      return;
    }
    let wordIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    const type = () => {
      const word = words[wordIndex];
      characterIndex += deleting ? -1 : 1;
      output.textContent = word.slice(0, characterIndex);
      if (!deleting && characterIndex === word.length) {
        deleting = true;
        window.setTimeout(type, 1200);
        return;
      }
      if (deleting && characterIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        window.setTimeout(type, 300);
        return;
      }
      window.setTimeout(type, deleting ? 45 : 90);
    };
    type();
  });

  document.querySelectorAll('[data-counter-readtime]').forEach((root) => {
    const target = document.querySelector(root.dataset.target || 'main');
    if (!target) return;
    const charactersPerMinute = Number(root.dataset.cpm || 500);
    const length = target.textContent.replace(/\s/g, '').length;
    root.querySelector('[data-readtime-output]').textContent = String(Math.max(1, Math.ceil(length / charactersPerMinute)));
  });

  document.querySelectorAll('[data-counter-visits]').forEach((root) => {
    const output = root.querySelector('[data-visits-output]');
    const message = root.querySelector('[data-visits-message]');
    const reset = root.querySelector('[data-visits-reset]');
    const key = root.dataset.key || 'markbench-counter-visits';
    const show = (count) => {
      output.textContent = count.toLocaleString('ja-JP');
      message.textContent = count === 1 ? 'はじめまして！' : 'いつもありがとうございます！';
    };
    let count = 1;
    try {
      count = Number(localStorage.getItem(key) || 0) + 1;
      localStorage.setItem(key, String(count));
    } catch {
      count = 1;
    }
    show(count);
    reset?.addEventListener('click', () => {
      try { localStorage.setItem(key, '1'); } catch { /* Storage can be unavailable. */ }
      show(1);
    });
  });
})();
