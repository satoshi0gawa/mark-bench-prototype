(() => {
  function mountPagination(root) {
    const mode = root.dataset.pagination;
    const total = Number(root.dataset.total);
    const size = Number(root.dataset.size);
    const pages = Math.ceil(total / size);
    const initial = Number(root.dataset.initial);
    const key = root.id;
    const controls = root.querySelector('[data-controls]');
    const content = root.querySelector('[data-content]');
    const titles = ['現在地が伝わるUI', '操作の状態を整える', '小さな画面で読みやすく'];
    let current = initial;

    function readPage() {
      const raw = new URL(location.href).searchParams.get(key);
      if (raw === null) return initial;
      const value = Number(raw);
      return Number.isSafeInteger(value) && value >= 1 && value <= pages ? value : 1;
    }

    function make(tag, className, text) {
      const element = document.createElement(tag);
      element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    }

    function control(page, text, label, relation, isNumber = false) {
      const valid = page >= 1 && page <= pages && (isNumber || page !== current);
      const selected = isNumber && page === current;
      const element = make(valid && !selected ? 'a' : 'span', 'c-pagination__control', text);
      element.setAttribute('aria-label', label);
      if (!valid) element.setAttribute('aria-disabled', 'true');
      if (selected) {
        element.setAttribute('aria-current', 'page');
        element.tabIndex = -1;
      } else if (valid) {
        const url = new URL(location.href);
        url.searchParams.set(key, String(page));
        url.hash = key;
        element.href = url.href;
        element.dataset.page = String(page);
        if (relation) element.rel = relation;
      }
      return element;
    }

    function numbers(compact) {
      const list = make('ul', 'c-pagination__pages' + (mode === 'ellipsis' ? compact ? ' c-pagination__pages--small' : ' c-pagination__pages--wide' : ''));
      list.setAttribute('role', 'list');
      const selected = mode === 'ellipsis'
        ? [...new Set([1, pages, current, ...(compact ? [] : [current - 1, current + 1])])].filter(page => page >= 1 && page <= pages).sort((a, b) => a - b)
        : Array.from({ length: pages }, (_, index) => index + 1);
      let previous = 0;
      selected.forEach(page => {
        if (previous && page - previous > 1) {
          const gap = make('li', 'c-pagination__gap', '…');
          gap.setAttribute('aria-label', '中間のページを省略');
          list.append(gap);
        }
        const item = make('li', 'c-pagination__item');
        item.append(control(page, String(page), page + 'ページ' + (page === current ? '（現在のページ）' : 'へ'), undefined, true));
        list.append(item);
        previous = page;
      });
      return list;
    }

    function position() {
      const element = make('span', 'c-pagination__position', current + ' / ' + pages);
      element.setAttribute('aria-label', '全' + pages + 'ページ中' + current + 'ページ目');
      element.setAttribute('aria-current', 'page');
      element.tabIndex = -1;
      return element;
    }

    function render(page, focus = false) {
      current = page;
      const first = (page - 1) * size + 1;
      const last = Math.min(page * size, total);
      content.textContent = mode === 'article'
        ? page + ' / ' + pages + '　' + titles[page - 1]
        : 'DEMO / 項目 ' + first + '–' + last;
      controls.replaceChildren();
      if (mode === 'article') {
        controls.append(
          control(page - 1, '← 前の記事' + (page > 1 ? '\n' + titles[page - 2] : ''), '前の記事' + (page > 1 ? '：' + titles[page - 2] : ''), 'prev'),
          control(page + 1, '次の記事 →' + (page < pages ? '\n' + titles[page] : ''), '次の記事' + (page < pages ? '：' + titles[page] : ''), 'next'),
        );
      } else {
        if (mode === 'jump') controls.append(control(1, '«', '先頭のページへ'));
        controls.append(control(page - 1, '←', '前のページへ', 'prev'));
        if (mode === 'numbers' || mode === 'ellipsis') {
          controls.append(numbers(false));
          if (mode === 'ellipsis') controls.append(numbers(true));
        } else {
          controls.append(position());
        }
        controls.append(control(page + 1, '→', '次のページへ', 'next'));
        if (mode === 'jump') controls.append(control(pages, '»', '最後のページへ'));
      }
      if (mode === 'range') root.querySelector('[data-range]').textContent = '全' + total + '件中 ' + first + '–' + last + '件';
      if (focus) {
        const target = [...controls.querySelectorAll('[aria-current="page"]')].find(element => element.getClientRects().length) || content;
        target.focus({ preventScroll: true });
      }
    }

    controls.addEventListener('click', event => {
      const link = event.target.closest('a[data-page]');
      if (!link || !controls.contains(link) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      const page = Number(link.dataset.page);
      try {
        const url = new URL(location.href);
        url.searchParams.set(key, String(page));
        url.hash = key;
        history.pushState(null, '', url.href);
        window.dispatchEvent(new Event('pagination:change'));
      } catch {
        // The demo still works when a local file cannot update browser history.
      }
      render(page, true);
    });
    window.addEventListener('popstate', () => render(readPage()));
    window.addEventListener('pagination:change', () => render(readPage()));
    render(readPage());
  }

  document.querySelectorAll('[data-pagination]').forEach(mountPagination);
})();
