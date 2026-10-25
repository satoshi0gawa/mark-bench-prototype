(() => {
  const root = document.querySelector('[data-tool-directory]');
  if (!root || root.dataset.toolDirectoryInitialized === 'true') return;

  const grid = root.querySelector('[data-tool-grid]');
  const searchInput = root.querySelector('[data-tool-search]');
  const sortSelect = root.querySelector('[data-tool-sort]');
  if (!grid) return;

  root.dataset.toolDirectoryInitialized = 'true';

  const cards = [...grid.querySelectorAll('[data-tool-card]')];
  const filterButtons = [...root.querySelectorAll('[data-filter]')];
  const keywordButtons = [...root.querySelectorAll('[data-keyword]')];
  const resultCount = root.querySelector('[data-result-count]');
  const emptyState = root.querySelector('[data-empty-state]');
  const resetButton = root.querySelector('[data-reset-filters]');
  const params = new URLSearchParams(window.location.search);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let filterAnimationFrame;

  let activeFilter = params.get('category') || 'all';
  let query = params.get('q') || '';

  const normalize = (value) => value.toLocaleLowerCase('ja').trim();
  const updateKeywordButtons = () => {
    keywordButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(normalize(button.dataset.keyword) === normalize(query)));
    });
  };

  const render = () => {
    const normalizedQuery = normalize(query);
    let visible = 0;

    cards.forEach((card) => {
      const searchable = normalize(`${card.dataset.name} ${card.dataset.search}`);
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesFilter = activeFilter === 'all' || card.dataset.category === activeFilter;
      const shouldShow = matchesQuery && matchesFilter;
      card.hidden = !shouldShow;
      if (shouldShow) visible += 1;
    });

    if (resultCount) resultCount.textContent = String(visible).padStart(2, '0');
    if (emptyState) emptyState.hidden = visible !== 0;

    filterButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter));
    });

    updateKeywordButtons();
  };

  const animateVisibleCards = () => {
    window.cancelAnimationFrame(filterAnimationFrame);
    cards.forEach((card) => {
      card.classList.remove('is-filter-entering');
    });

    if (reduceMotion) return;

    filterAnimationFrame = window.requestAnimationFrame(() => {
      cards.filter((card) => !card.hidden).forEach((card, index) => {
        const delay = index * 70;

        card.style.setProperty('--filter-enter-delay', `${delay}ms`);
        card.classList.add('is-filter-entering');
      });
    });
  };

  if (searchInput) {
    searchInput.value = query;
    searchInput.addEventListener('input', (event) => {
      query = event.target.value;
      render();
      animateVisibleCards();
    });
  }

  keywordButtons.forEach((button) => {
    button.addEventListener('click', () => {
      query = normalize(query) === normalize(button.dataset.keyword) ? '' : button.dataset.keyword;
      render();
      animateVisibleCards();
    });
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      render();
      animateVisibleCards();
    });
  });

  const sortCards = () => {
    if (!sortSelect) return;
    const sorted = [...cards];
    if (sortSelect.value === 'name') {
      sorted.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name, 'en'));
    }
    if (sortSelect.value === 'status') {
      const order = { ready: 0, testing: 1, planned: 2 };
      sorted.sort((a, b) => order[a.dataset.status] - order[b.dataset.status]);
    }
    sorted.forEach((card) => grid.append(card));
  };

  sortSelect?.addEventListener('change', sortCards);

  resetButton?.addEventListener('click', () => {
    query = '';
    activeFilter = 'all';
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'status';
    sortCards();
    render();
    animateVisibleCards();
  });

  sortCards();
  render();
})();
