(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const splitCharacters = (element) => {
    const text = element.textContent.trim();
    element.textContent = '';
    element.setAttribute('aria-label', text);
    const spans = [...text].map((character) => {
      const span = document.createElement('span');
      span.textContent = character === ' ' ? '\u00a0' : character;
      span.setAttribute('aria-hidden', 'true');
      element.append(span);
      return span;
    });
    return { text, spans };
  };

  const replayClass = (element, className = 'is-active') => {
    element.classList.add('is-resetting');
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.remove('is-resetting');
    element.classList.add(className);
  };

  const playOnFirstView = (element, play) => {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      play();
      return;
    }
    let started = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (started || !entry.isIntersecting || entry.intersectionRatio < 0.35) return;
        started = true;
        observer.unobserve(element);
        requestAnimationFrame(play);
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -10% 0px' });
    observer.observe(element);
  };

  document.querySelectorAll('[data-text-effect-scramble]').forEach((element) => {
    const original = element.textContent.trim();
    element.setAttribute('aria-label', original);
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&+*';
    let timer = 0;
    const play = () => {
      window.clearInterval(timer);
      if (reduceMotion) { element.textContent = original; return; }
      let frame = 0;
      timer = window.setInterval(() => {
        const fixed = Math.floor(frame / 3);
        element.textContent = [...original].map((character, index) => {
          if (character === ' ' || index < fixed) return character;
          return characters[Math.floor(Math.random() * characters.length)];
        }).join('');
        frame += 1;
        if (fixed >= original.length) {
          window.clearInterval(timer);
          element.textContent = original;
        }
      }, 38);
    };
    element.addEventListener('click', play);
    playOnFirstView(element, play);
  });

  document.querySelectorAll('[data-text-effect-reveal]').forEach((element) => {
    const { spans } = splitCharacters(element);
    spans.forEach((span, index) => { span.style.transitionDelay = `${index * 45}ms`; });
    const play = () => replayClass(element);
    element.addEventListener('click', play);
    playOnFirstView(element, play);
  });

  document.querySelectorAll('[data-text-effect-sweep]').forEach((element) => {
    const { spans } = splitCharacters(element);
    spans.forEach((span, index) => { span.style.transitionDelay = `${index * 55}ms`; });
    const play = () => replayClass(element);
    element.addEventListener('click', play);
    playOnFirstView(element, play);
  });

  document.querySelectorAll('[data-text-effect-rotate]').forEach((element) => {
    const words = (element.dataset.words || element.textContent).split(',').map((word) => word.trim()).filter(Boolean);
    if (reduceMotion || words.length < 2) return;
    let index = 0;
    window.setInterval(() => {
      element.classList.add('is-out');
      window.setTimeout(() => {
        index = (index + 1) % words.length;
        element.textContent = words[index];
        element.classList.remove('is-out');
      }, 220);
    }, 2200);
  });

  document.querySelectorAll('[data-text-effect-wave]').forEach((element) => {
    const { spans } = splitCharacters(element);
    spans.forEach((span, index) => { span.style.animationDelay = `${index * 90}ms`; });
  });

  document.querySelectorAll('[data-text-effect-marquee]').forEach((element) => {
    const track = element.querySelector('[data-marquee-track]');
    const unit = track?.firstElementChild;
    if (!track || !unit || reduceMotion) return;
    const speed = Number(element.dataset.speed) || 42;
    const size = () => {
      const unitWidth = unit.getBoundingClientRect().width;
      if (!unitWidth) return;
      while (track.scrollWidth < element.clientWidth + unitWidth) track.append(unit.cloneNode(true));
      track.style.setProperty('--marquee-distance', `${unitWidth}px`);
      track.style.setProperty('--marquee-duration', `${unitWidth / speed}s`);
    };
    size();
    document.fonts?.ready.then(size);
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(element);
    else window.addEventListener('resize', size);
  });

  document.querySelectorAll('[data-text-effect-hover-shuffle]').forEach((element) => {
    const original = element.textContent.trim();
    element.setAttribute('aria-label', original);
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let timer = 0;
    const start = () => {
      if (reduceMotion || timer) return;
      timer = window.setInterval(() => {
        element.textContent = [...original].map((character) => character === ' '
          ? ' '
          : characters[Math.floor(Math.random() * characters.length)]).join('');
      }, 58);
    };
    const stop = () => { window.clearInterval(timer); timer = 0; element.textContent = original; };
    element.addEventListener('pointerenter', start);
    element.addEventListener('pointerleave', stop);
    element.addEventListener('focus', start);
    element.addEventListener('blur', stop);
  });

  document.querySelectorAll('[data-text-effect-near]').forEach((element) => {
    const { spans } = splitCharacters(element);
    if (reduceMotion) return;
    element.addEventListener('pointermove', (event) => {
      spans.forEach((span) => {
        const rect = span.getBoundingClientRect();
        const distance = Math.abs(event.clientX - (rect.left + rect.width / 2));
        const lift = Math.max(0, 1 - distance / 60) * 12;
        span.style.transform = lift > 0.5 ? `translateY(-${lift.toFixed(1)}px)` : '';
      });
    });
    element.addEventListener('pointerleave', () => spans.forEach((span) => { span.style.transform = ''; }));
  });

  document.querySelectorAll('[data-text-effect-spotlight]').forEach((element) => {
    const text = element.textContent.trim();
    const span = document.createElement('span');
    span.textContent = text;
    element.textContent = '';
    element.append(span);
    if (reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    element.addEventListener('pointerenter', () => element.classList.add('is-active'));
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
      element.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    });
    element.addEventListener('pointerleave', () => element.classList.remove('is-active'));
  });

  document.querySelectorAll('[data-text-effect-glitch]').forEach((element) => {
    const original = element.textContent.trim();
    element.setAttribute('aria-label', original);
    const noise = '#$%&@!?<>*+=';
    let busy = false;
    const burst = () => {
      if (busy || reduceMotion) return;
      busy = true;
      element.classList.add('is-active');
      let frame = 0;
      const timer = window.setInterval(() => {
        element.textContent = [...original].map((character) => Math.random() < 0.16
          ? noise[Math.floor(Math.random() * noise.length)]
          : character).join('');
        frame += 1;
        if (frame >= 6) {
          window.clearInterval(timer);
          element.textContent = original;
          element.classList.remove('is-active');
          busy = false;
        }
      }, 52);
    };
    element.addEventListener('click', burst);
    if (!reduceMotion) window.setInterval(burst, 3200);
  });

  document.querySelectorAll('[data-text-effect-assemble]').forEach((element) => {
    const { spans } = splitCharacters(element);
    const play = () => {
      if (reduceMotion) return;
      spans.forEach((span, index) => {
        span.style.setProperty('--scatter-x', `${(Math.random() * 140 - 70).toFixed(1)}px`);
        span.style.setProperty('--scatter-y', `${(Math.random() * 80 - 40).toFixed(1)}px`);
        span.style.setProperty('--scatter-rotate', `${(Math.random() * 160 - 80).toFixed(1)}deg`);
        span.style.transitionDelay = `${index * 35}ms`;
      });
      element.classList.add('is-resetting', 'is-scattered');
      void element.offsetWidth;
      element.classList.remove('is-resetting', 'is-scattered');
    };
    element.addEventListener('click', play);
    playOnFirstView(element, play);
  });

  document.querySelectorAll('[data-text-effect-typewriter]').forEach((root) => {
    const text = root.dataset.text || '';
    const output = root.querySelector('[data-typewriter-output]');
    const replay = root.querySelector('[data-typewriter-replay]');
    let timer = 0;

    const play = () => {
      window.clearTimeout(timer);
      output.textContent = '';
      if (reduceMotion) { output.textContent = text; return; }
      replay.disabled = true;
      let index = 0;
      const type = () => {
        output.textContent = text.slice(0, index + 1);
        index += 1;
        if (index < text.length) timer = window.setTimeout(type, 72);
        else replay.disabled = false;
      };
      type();
    };

    replay.addEventListener('click', play);
    playOnFirstView(root, play);
  });

  document.querySelectorAll('[data-text-effect-lines]').forEach((root) => {
    const replay = root.querySelector('[data-lines-replay]');
    const play = () => replayClass(root);
    replay.addEventListener('click', play);

    playOnFirstView(root, play);
  });

  document.querySelectorAll('[data-text-effect-neon]').forEach((element) => {
    const { spans } = splitCharacters(element);
    if (reduceMotion || !spans.length) return;
    const flicker = () => {
      const span = spans[Math.floor(Math.random() * spans.length)];
      let count = 0;
      const timer = window.setInterval(() => {
        span.classList.toggle('is-dim');
        count += 1;
        if (count >= 4) {
          window.clearInterval(timer);
          span.classList.remove('is-dim');
        }
      }, 70);
      window.setTimeout(flicker, 600 + Math.random() * 1800);
    };
    flicker();
  });
})();
