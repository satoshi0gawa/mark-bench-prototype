(() => {
  const directory = document.querySelector('[data-parts-directory]');
  if (!directory) return;

  const search = directory.querySelector('[data-parts-search]');
  const categoryButtons = [...directory.querySelectorAll('[data-parts-category]')];
  const cards = [...directory.querySelectorAll('[data-part-category]')];
  const count = directory.querySelector('[data-parts-count]');
  const empty = directory.querySelector('[data-parts-empty]');
  let activeCategory = '';

  const normalize = (value) => value.trim().toLocaleLowerCase('ja');

  const update = () => {
    const query = normalize(search?.value || '');
    let visibleCount = 0;

    cards.forEach((card) => {
      const cardCategory = normalize(card.querySelector('h3')?.textContent || '');
      const matchesCategory = !activeCategory || cardCategory === activeCategory;
      const searchableText = normalize(`${card.dataset.search || ''} ${card.textContent || ''}`);
      const matchesQuery = !query || searchableText.includes(query);
      const isVisible = matchesCategory && matchesQuery;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (count) count.textContent = String(visibleCount).padStart(2, '0');
    if (empty) empty.hidden = visibleCount !== 0;
  };

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedCategory = normalize(button.dataset.partsCategory || '');
      activeCategory = activeCategory === selectedCategory ? '' : selectedCategory;
      categoryButtons.forEach((categoryButton) => {
        categoryButton.setAttribute('aria-pressed', String(normalize(categoryButton.dataset.partsCategory || '') === activeCategory));
      });
      update();
    });
  });

  search?.addEventListener('input', update);
  update();
})();
