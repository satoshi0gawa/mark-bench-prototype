(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resetViewport = (demo, afterReset) => {
    const viewport = demo.querySelector('[data-scroll-viewport]');
    const targets = [...demo.querySelectorAll('[data-scroll-target]')];
    targets.forEach((target) => target.classList.remove('is-revealed'));
    demo.querySelectorAll('[data-scroll-lazy]').forEach((target) => target.classList.remove('is-loaded'));
    viewport?.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    afterReset?.();
  };

  document.querySelectorAll('[data-scroll-demo="reveal"]').forEach((demo) => {
    const viewport = demo.querySelector('[data-scroll-viewport]');
    const targets = [...demo.querySelectorAll('[data-scroll-target]')];
    if (!viewport || !targets.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target;
        if (entry.isIntersecting) {
          target.classList.add('is-revealed');
          if (target.matches('[data-scroll-lazy]')) {
            const image = target.querySelector('img[data-src]');
            if (image && !image.src) image.src = image.dataset.src;
            image?.addEventListener('load', () => target.classList.add('is-loaded'), { once: true });
            if (image?.complete) target.classList.add('is-loaded');
          }
          if (demo.dataset.once === 'true') observer.unobserve(target);
        } else if (demo.dataset.once !== 'true') {
          target.classList.remove('is-revealed');
        }
      });
    }, { root: viewport, threshold: 0.45 });

    targets.forEach((target) => observer.observe(target));
    demo.querySelector('[data-scroll-reset]')?.addEventListener('click', () => resetViewport(demo));

    demo.querySelector('[data-scroll-mode]')?.addEventListener('click', (event) => {
      const useOnce = demo.dataset.once !== 'true';
      demo.dataset.once = String(useOnce);
      event.currentTarget.textContent = useOnce ? 'MODE: ONCE' : 'MODE: REPEAT';
      event.currentTarget.setAttribute('aria-pressed', String(useOnce));
      targets.forEach((target) => observer.observe(target));
      resetViewport(demo);
    });
  });

  document.querySelectorAll('[data-scroll-demo="parallax"]').forEach((demo) => {
    const viewport = demo.querySelector('[data-scroll-viewport]');
    const box = demo.querySelector('[data-parallax-root]');
    const items = [...demo.querySelectorAll('[data-parallax-item]')];
    if (!viewport || !box || !items.length) return;
    let frame = 0;
    const render = () => {
      frame = 0;
      const boxRect = box.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      const delta = boxRect.top + boxRect.height / 2 - (viewportRect.top + viewport.clientHeight / 2);
      items.forEach((item) => {
        const speed = Number.parseFloat(item.dataset.speed || '0.2');
        item.style.transform = reduceMotion ? 'none' : `translateY(${(delta * speed).toFixed(1)}px)`;
      });
    };
    viewport.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true });
    demo.querySelector('[data-scroll-reset]')?.addEventListener('click', () => resetViewport(demo, () => {
      items.forEach((item) => { item.style.transform = 'none'; });
    }));
    render();
  });

  document.querySelectorAll('[data-scroll-demo="morph"]').forEach((demo) => {
    const viewport = demo.querySelector('[data-scroll-viewport]');
    const root = demo.querySelector('[data-morph-root]');
    const panels = [...demo.querySelectorAll('[data-morph-color]')];
    if (!viewport || !root || !panels.length) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) root.style.setProperty('--morph-color', visible.target.dataset.morphColor);
    }, { root: viewport, threshold: [0.35, 0.65] });
    panels.forEach((panel) => observer.observe(panel));
    demo.querySelector('[data-scroll-reset]')?.addEventListener('click', () => resetViewport(demo, () => {
      root.style.setProperty('--morph-color', panels[0].dataset.morphColor);
    }));
  });

  document.querySelectorAll('[data-scroll-demo="timeline"]').forEach((demo) => {
    const viewport = demo.querySelector('[data-scroll-viewport]');
    const timeline = demo.querySelector('[data-timeline]');
    const steps = [...demo.querySelectorAll('[data-timeline-step]')];
    if (!viewport || !timeline || !steps.length) return;
    let frame = 0;
    const render = () => {
      frame = 0;
      const max = Math.max(1, viewport.scrollHeight - viewport.clientHeight);
      const ratio = Math.max(0, Math.min(1, viewport.scrollTop / max));
      timeline.style.setProperty('--timeline-progress', `${Math.round(ratio * 100)}%`);
      steps.forEach((step, index) => step.classList.toggle('is-active', ratio >= index / steps.length));
    };
    viewport.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true });
    demo.querySelector('[data-scroll-reset]')?.addEventListener('click', () => resetViewport(demo, render));
    render();
  });
})();
