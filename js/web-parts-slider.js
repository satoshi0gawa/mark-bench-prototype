(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clampIndex = (index, total) => (index + total) % total;

  const updateSlides = (root, slides, index) => {
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    const status = root.querySelector('[data-slider-status]');
    if (status) status.textContent = `${index + 1} / ${slides.length}`;
  };

  const mountTrackSlider = (root) => {
    const track = root.querySelector('[data-slider-track]');
    const slides = [...track.children];
    const dots = [...root.querySelectorAll('[data-slider-dot]')];
    let index = 0;
    let startX = 0;
    let deltaX = 0;

    const show = (nextIndex) => {
      index = clampIndex(nextIndex, slides.length);
      root.style.setProperty('--slider-index', index);
      dots.forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === index)));
      updateSlides(root, slides, index);
    };

    root.querySelector('[data-slider-prev]')?.addEventListener('click', () => show(index - 1));
    root.querySelector('[data-slider-next]')?.addEventListener('click', () => show(index + 1));
    dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => show(dotIndex)));
    root.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
    });

    if (root.matches('[data-drag-slider]')) {
      const viewport = root.querySelector('.c-slider__viewport');
      viewport.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        startX = event.clientX;
        deltaX = 0;
        viewport.classList.add('is-dragging');
        viewport.setPointerCapture(event.pointerId);
      });
      viewport.addEventListener('pointermove', (event) => {
        if (!viewport.classList.contains('is-dragging')) return;
        deltaX = event.clientX - startX;
        track.style.transition = 'none';
        track.style.transform = `translateX(calc(${-index * 100}% + ${deltaX}px))`;
      });
      const release = () => {
        if (!viewport.classList.contains('is-dragging')) return;
        viewport.classList.remove('is-dragging');
        track.style.transition = '';
        track.style.transform = '';
        if (Math.abs(deltaX) > viewport.clientWidth * .2) show(index + (deltaX < 0 ? 1 : -1));
      };
      viewport.addEventListener('pointerup', release);
      viewport.addEventListener('pointercancel', release);
      viewport.addEventListener('lostpointercapture', release);
    }

    let timer = 0;
    const interval = Number(root.dataset.autoplay || 0);
    const toggle = root.querySelector('[data-slider-toggle]');
    let playing = Boolean(interval) && !reduceMotion;
    const stop = () => { window.clearInterval(timer); timer = 0; };
    const start = () => {
      stop();
      if (playing) timer = window.setInterval(() => show(index + 1), interval);
    };
    const renderToggle = () => {
      if (!toggle) return;
      toggle.textContent = playing ? '一時停止' : '再生';
      toggle.setAttribute('aria-pressed', String(!playing));
    };
    toggle?.addEventListener('click', () => { playing = !playing; renderToggle(); start(); });
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', () => { if (playing) start(); });
    show(0);
    renderToggle();
    start();
  };

  document.querySelectorAll('[data-track-slider]').forEach(mountTrackSlider);

  document.querySelectorAll('[data-thumb-slider]').forEach((root) => {
    const slides = [...root.querySelectorAll('.c-slider__slide')];
    const thumbs = [...root.querySelectorAll('[data-slider-thumb]')];
    const show = (index) => {
      updateSlides(root, slides, index);
      thumbs.forEach((thumb, thumbIndex) => thumb.setAttribute('aria-pressed', String(thumbIndex === index)));
    };
    thumbs.forEach((thumb, index) => thumb.addEventListener('click', () => show(index)));
    show(0);
  });

  document.querySelectorAll('[data-fade-slider]').forEach((root) => {
    const slides = [...root.querySelectorAll('.c-slider__slide')];
    const dots = [...root.querySelectorAll('[data-slider-dot]')];
    let index = 0;
    let timer = 0;
    let playing = !reduceMotion;
    const show = (nextIndex) => {
      index = clampIndex(nextIndex, slides.length);
      updateSlides(root, slides, index);
      dots.forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === index)));
    };
    const start = () => {
      window.clearInterval(timer);
      if (playing) timer = window.setInterval(() => show(index + 1), Number(root.dataset.interval || 3600));
    };
    dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => { show(dotIndex); start(); }));
    root.querySelector('[data-slider-toggle]')?.addEventListener('click', (event) => {
      playing = !playing;
      event.currentTarget.textContent = playing ? '一時停止' : '再生';
      event.currentTarget.setAttribute('aria-pressed', String(!playing));
      start();
    });
    show(0);
    if (reduceMotion) root.querySelector('[data-slider-toggle]').textContent = '再生';
    start();
  });

  document.querySelectorAll('[data-compare-slider]').forEach((root) => {
    const range = root.querySelector('input[type="range"]');
    const output = root.querySelector('[data-compare-output]');
    const update = () => {
      root.style.setProperty('--compare-position', `${range.value}%`);
      output.textContent = `${range.value}%`;
    };
    range.addEventListener('input', update);
    update();
  });

  document.querySelectorAll('[data-infinite-slider]').forEach((root) => {
    const track = root.querySelector('[data-slider-track]');
    const originals = [...track.children];
    track.prepend(originals.at(-1).cloneNode(true));
    track.append(originals[0].cloneNode(true));
    const slides = [...track.children];
    let index = 1;
    let busy = false;
    const apply = (animate = true) => {
      track.style.transition = animate ? '' : 'none';
      track.style.transform = `translateX(${-index * 100}%)`;
      slides.forEach((slide, slideIndex) => slide.setAttribute('aria-hidden', String(slideIndex !== index)));
      if (!animate) requestAnimationFrame(() => { track.style.transition = ''; });
      const status = root.querySelector('[data-slider-status]');
      if (status) status.textContent = `${clampIndex(index - 1, originals.length) + 1} / ${originals.length}`;
    };
    const move = (step) => { if (!busy) { busy = true; index += step; apply(); } };
    root.querySelector('[data-slider-prev]').addEventListener('click', () => move(-1));
    root.querySelector('[data-slider-next]').addEventListener('click', () => move(1));
    track.addEventListener('transitionend', () => {
      if (index === 0) { index = originals.length; apply(false); }
      if (index === originals.length + 1) { index = 1; apply(false); }
      busy = false;
    });
    apply(false);
  });

  document.querySelectorAll('[data-progress-slider]').forEach((root) => {
    const track = root.querySelector('[data-slider-track]');
    const slides = [...track.children];
    const bar = root.querySelector('[data-progress-bar]');
    const duration = Number(root.dataset.interval || 4000);
    let index = 0;
    let startTime = 0;
    const frame = (time) => {
      if (!startTime) startTime = time;
      let progress = Math.min((time - startTime) / duration, 1);
      bar.style.transform = `scaleX(${progress})`;
      if (progress === 1) {
        index = clampIndex(index + 1, slides.length);
        root.style.setProperty('--slider-index', index);
        updateSlides(root, slides, index);
        startTime = time;
      }
      if (!reduceMotion) requestAnimationFrame(frame);
    };
    updateSlides(root, slides, index);
    if (!reduceMotion) requestAnimationFrame(frame);
  });

  document.querySelectorAll('[data-zoom-slider]').forEach((root) => {
    const source = root.querySelector('[data-zoom-source]');
    const lens = root.querySelector('[data-zoom-lens]');
    source.addEventListener('pointermove', (event) => {
      const rect = source.getBoundingClientRect();
      lens.style.left = `${event.clientX - rect.left}px`;
      lens.style.top = `${event.clientY - rect.top}px`;
    });
    source.addEventListener('pointerenter', () => lens.classList.add('is-visible'));
    source.addEventListener('pointerleave', () => lens.classList.remove('is-visible'));
    source.addEventListener('focus', () => lens.classList.add('is-visible'));
    source.addEventListener('blur', () => lens.classList.remove('is-visible'));
  });

  document.querySelectorAll('[data-center-slider]').forEach((root) => {
    const viewport = root.querySelector('.c-slider__viewport');
    const track = root.querySelector('[data-slider-track]');
    const slides = [...track.children];
    let index = 0;
    const show = (nextIndex) => {
      index = clampIndex(nextIndex, slides.length);
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === index);
        slide.setAttribute('aria-current', String(slideIndex === index));
      });
      const current = slides[index];
      const shift = viewport.clientWidth / 2 - current.offsetLeft - current.offsetWidth / 2;
      root.style.setProperty('--center-shift', `${shift}px`);
      root.querySelector('[data-slider-status]').textContent = `${index + 1} / ${slides.length}`;
    };
    root.querySelector('[data-slider-prev]').addEventListener('click', () => show(index - 1));
    root.querySelector('[data-slider-next]').addEventListener('click', () => show(index + 1));
    slides.forEach((slide, slideIndex) => slide.addEventListener('click', () => show(slideIndex)));
    window.addEventListener('resize', () => show(index));
    show(0);
  });

  document.querySelectorAll('[data-story-slider]').forEach((root) => {
    const slides = [...root.querySelectorAll('.c-slider__slide')];
    const bars = [...root.querySelectorAll('.c-slider__story-bar')];
    const viewport = root.querySelector('.c-slider__viewport');
    let index = 0;
    const show = (nextIndex) => {
      index = clampIndex(nextIndex, slides.length);
      updateSlides(root, slides, index);
      bars.forEach((bar, barIndex) => {
        bar.classList.toggle('is-done', barIndex < index);
        bar.classList.toggle('is-active', barIndex === index && !reduceMotion);
        const fill = bar.firstElementChild;
        fill.style.animation = 'none';
        void fill.offsetWidth;
        fill.style.animation = '';
      });
    };
    bars.forEach((bar) => bar.addEventListener('animationend', () => { if (bar.classList.contains('is-active')) show(index + 1); }));
    viewport.addEventListener('click', () => show(index + 1));
    viewport.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(index + 1); } });
    show(0);
  });
})();
