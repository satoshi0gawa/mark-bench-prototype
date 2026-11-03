(() => {
  const roots = [...document.querySelectorAll('[data-splide-demo]')];
  if (!roots.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const i18n = {
    prev: '前のスライドへ',
    next: '次のスライドへ',
    first: '最初のスライドへ',
    last: '最後のスライドへ',
    slideX: '%s枚目へ移動',
    pageX: '%sページ目へ移動',
    play: '自動再生を開始',
    pause: '自動再生を停止',
    carousel: 'カルーセル',
    slide: 'スライド',
    select: '表示するスライドを選択',
  };
  const options = {
    message: {
      type: 'slide',
      rewind: true,
      autoplay: true,
      interval: 5200,
      speed: 720,
      pauseOnHover: true,
      pauseOnFocus: true,
      pagination: true,
      arrows: true,
    },
    cards: {
      type: 'loop',
      autoplay: true,
      interval: 5200,
      speed: 720,
      perPage: 2,
      perMove: 2,
      gap: '1rem',
      pauseOnHover: true,
      pauseOnFocus: true,
      pagination: true,
      arrows: true,
      breakpoints: { 768: { perPage: 1, perMove: 1 } },
    },
    fade: {
      type: 'fade',
      rewind: true,
      autoplay: true,
      interval: 5200,
      speed: 900,
      pauseOnHover: true,
      pauseOnFocus: true,
      pagination: false,
      arrows: true,
    },
  };

  roots.forEach((root) => {
    const status = root.parentElement?.querySelector('[data-splide-status]');
    const variant = root.dataset.splideDemo;
    const variantOptions = options[variant];

    if (!variantOptions || typeof window.Splide !== 'function') {
      root.dataset.dependencyError = 'true';
      if (status) status.textContent = 'Splideを読み込めませんでした。通信状態を確認してください。';
      return;
    }

    const slider = new window.Splide(root, {
      ...variantOptions,
      autoplay: reduceMotion ? false : variantOptions.autoplay,
      speed: reduceMotion ? 0 : variantOptions.speed,
      keyboard: 'focused',
      i18n,
    });

    const progress = root.querySelector('[data-splide-progress]');
    const progressBar = root.querySelector('[data-splide-progress-bar]');

    const updateStatus = () => {
      const current = slider.index + 1;
      const total = slider.length;
      if (status) status.textContent = `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      if (!progress || !progressBar) return;
      progress.setAttribute('aria-valuemax', String(total));
      progress.setAttribute('aria-valuenow', String(current));
      progressBar.style.transform = `scaleX(${current / total})`;
    };

    slider.on('mounted moved', updateStatus);
    slider.mount();
    root.dataset.initialized = 'true';
  });

  document.querySelectorAll('[data-splide-gallery]').forEach((gallery) => {
    const mainRoot = gallery.querySelector('[data-gallery-main]');
    const thumbnailsRoot = gallery.querySelector('[data-gallery-thumbnails]');
    const status = gallery.querySelector('[data-gallery-status]');
    if (!mainRoot || !thumbnailsRoot) return;

    if (typeof window.Splide !== 'function') {
      mainRoot.dataset.dependencyError = 'true';
      if (status) status.textContent = 'Splideを読み込めませんでした。通信状態を確認してください。';
      return;
    }

    const main = new window.Splide(mainRoot, {
      type: 'slide',
      rewind: true,
      speed: reduceMotion ? 0 : 620,
      pagination: false,
      arrows: true,
      keyboard: 'focused',
      i18n,
    });
    const thumbnails = new window.Splide(thumbnailsRoot, {
      rewind: true,
      perPage: 4,
      perMove: 1,
      gap: '.5rem',
      pagination: false,
      arrows: false,
      isNavigation: true,
      keyboard: 'focused',
      i18n,
    });

    const updateStatus = () => {
      if (status) status.textContent = `${String(main.index + 1).padStart(2, '0')} / ${String(main.length).padStart(2, '0')}`;
    };

    main.sync(thumbnails);
    main.on('mounted moved', updateStatus);
    main.mount();
    thumbnails.mount();
    mainRoot.dataset.initialized = 'true';
    thumbnailsRoot.dataset.initialized = 'true';
  });
})();
