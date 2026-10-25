(() => {
  const site = document.querySelector('[data-site="coding-note"]');
  if (!site || site.dataset.siteInitialized === 'true') return;
  site.dataset.siteInitialized = 'true';
  let interfaceReadyAt = performance.now();

  const loader = site.querySelector('[data-loader]');
  if (loader) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let hasLoaded = false;

    try {
      hasLoaded = sessionStorage.getItem('coding-note-loaded') === 'true';
    } catch {
      hasLoaded = false;
    }

    const delay = reduceMotion || hasLoaded ? 0 : 900;
    interfaceReadyAt += delay;

    window.setTimeout(() => {
      loader.classList.add('is-complete');

      try {
        sessionStorage.setItem('coding-note-loaded', 'true');
      } catch {
        // The loader still completes when storage is unavailable.
      }
    }, delay);
  }

  const reveals = [...site.querySelectorAll('.reveal')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const typingTimers = new WeakMap();

  const typeText = (element, text, language, delay = 0, characterDelay = 32) => {
    const activeTimer = typingTimers.get(element);
    if (activeTimer) window.clearTimeout(activeTimer);

    element.classList.remove('is-typing');
    element.lang = language;
    element.setAttribute('aria-label', text);

    if (reduceMotion) {
      element.textContent = text;
      return;
    }

    const characters = [...text];
    let index = 0;
    element.textContent = '';
    element.classList.add('is-typing');

    const typeNextCharacter = () => {
      element.textContent = characters.slice(0, index + 1).join('');
      index += 1;

      if (index >= characters.length) {
        element.classList.remove('is-typing');
        typingTimers.delete(element);
        return;
      }

      typingTimers.set(element, window.setTimeout(typeNextCharacter, characterDelay));
    };

    typingTimers.set(element, window.setTimeout(typeNextCharacter, delay));
  };

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const requestedThreshold = Number.parseFloat(entry.target.dataset.revealThreshold || '');
        const revealThreshold = Number.isNaN(requestedThreshold)
          ? 0.12
          : Math.min(Math.max(requestedThreshold, 0), 1);
        if (!entry.isIntersecting || entry.intersectionRatio < revealThreshold) return;
        const revealOrder = Number.parseInt(entry.target.dataset.revealOrder || '', 10);
        const sequenceDelay = Number.isNaN(revealOrder)
          ? Math.min(reveals.indexOf(entry.target) % 4, 3) * 45
          : revealOrder * 120;
        const readyDelay = Math.max(0, interfaceReadyAt - performance.now());

        window.setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, readyDelay + sequenceDelay);
        observer.unobserve(entry.target);
      });
    }, { threshold: [0.01, 0.12], rootMargin: '0px 0px -5% 0px' });
    reveals.forEach((element) => observer.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add('is-visible'));
  }

  site.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const logoText = site.querySelector('.site-logo > span:first-child');
  const breadcrumbCurrent = site.querySelector('.site-breadcrumb-logo__current');
  const staticTypingCharacterDelay = 72;
  const logoTextValue = logoText?.textContent.trim() || '';
  const breadcrumbCurrentValue = breadcrumbCurrent?.textContent.trim() || '';
  const staticTypingTargets = [
    breadcrumbCurrent
      ? {
          element: breadcrumbCurrent,
          text: breadcrumbCurrentValue,
          language: 'en',
          startAt: performance.now() + 180,
        }
      : logoText
        ? {
            element: logoText,
            text: logoTextValue,
            language: 'en',
            startAt: interfaceReadyAt,
          }
        : null,
  ].filter(Boolean);

  const runStaticTyping = ({ element, text, language, startAt }) => {
    const delay = Math.max(0, startAt - performance.now());
    typeText(element, text, language, delay, staticTypingCharacterDelay);
  };

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const staticTypingSettings = new WeakMap(
      staticTypingTargets.map((setting) => [setting.element, setting]),
    );
    const staticTypingObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runStaticTyping(staticTypingSettings.get(entry.target));
        staticTypingObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    staticTypingTargets.forEach(({ element }) => staticTypingObserver.observe(element));
  } else {
    staticTypingTargets.forEach(runStaticTyping);
  }

})();
