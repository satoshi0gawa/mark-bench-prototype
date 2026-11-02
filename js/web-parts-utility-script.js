(() => {
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Storage can be unavailable. */ } }
  };

  document.querySelectorAll('[data-utility-theme]').forEach((root) => {
    const button = root.querySelector('[data-theme-toggle]');
    let dark = storage.get('markbench-utility-theme') === 'dark';
    const apply = () => { root.classList.toggle('is-dark', dark); button.setAttribute('aria-pressed', String(dark)); };
    button.addEventListener('click', () => { dark = !dark; storage.set('markbench-utility-theme', dark ? 'dark' : 'light'); apply(); });
    apply();
  });

  document.querySelectorAll('[data-utility-font]').forEach((root) => {
    const sample = root.querySelector('[data-font-sample]');
    const buttons = [...root.querySelectorAll('[data-font-size]')];
    const sizes = { s: '87.5%', m: '100%', l: '112.5%' };
    const apply = (size) => {
      const selected = sizes[size] ? size : 'm';
      sample.style.setProperty('--utility-font-size', sizes[selected]);
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.fontSize === selected)));
      storage.set('markbench-utility-font', selected);
    };
    buttons.forEach((button) => button.addEventListener('click', () => apply(button.dataset.fontSize)));
    apply(storage.get('markbench-utility-font') || 'm');
  });

  document.querySelectorAll('[data-utility-more]').forEach((root) => {
    const show = Number(root.dataset.show || 3);
    const items = [...root.querySelectorAll('li')];
    const button = root.querySelector('[data-more-button]');
    const rest = Math.max(0, items.length - show);
    items.forEach((item, index) => { item.hidden = index >= show; });
    button.hidden = rest === 0;
    button.textContent = `もっと見る（残り${rest}件）`;
    button.addEventListener('click', () => { items.forEach((item) => { item.hidden = false; }); button.hidden = true; });
  });

  document.querySelectorAll('[data-utility-filter]').forEach((root) => {
    const buttons = [...root.querySelectorAll('[data-filter]')];
    const cards = [...root.querySelectorAll('[data-category]')];
    buttons.forEach((button) => button.addEventListener('click', () => {
      const category = button.dataset.filter;
      buttons.forEach((control) => control.setAttribute('aria-pressed', String(control === button)));
      cards.forEach((card) => { card.hidden = category !== 'all' && !card.dataset.category.split(' ').includes(category); });
    }));
  });

  document.querySelectorAll('[data-utility-highlight]').forEach((root) => {
    const input = root.querySelector('input[type="search"]');
    const items = [...root.querySelectorAll('li')];
    const originals = items.map((item) => item.textContent);
    input.addEventListener('input', () => {
      const query = input.value.trim().toLocaleLowerCase('ja');
      items.forEach((item, index) => {
        const text = originals[index];
        item.replaceChildren();
        if (!query) { item.textContent = text; return; }
        const lower = text.toLocaleLowerCase('ja');
        let from = 0;
        let match = lower.indexOf(query, from);
        while (match !== -1) {
          item.append(document.createTextNode(text.slice(from, match)));
          const mark = document.createElement('mark');
          mark.textContent = text.slice(match, match + query.length);
          item.append(mark);
          from = match + query.length;
          match = lower.indexOf(query, from);
        }
        item.append(document.createTextNode(text.slice(from)));
      });
    });
  });

  document.querySelectorAll('[data-utility-sort]').forEach((root) => {
    const select = root.querySelector('select');
    const list = root.querySelector('ul');
    select.addEventListener('change', () => {
      const items = [...list.children];
      items.sort((a, b) => select.value === 'name' ? a.dataset.name.localeCompare(b.dataset.name, 'ja') : (Number(a.dataset.price) - Number(b.dataset.price)) * (select.value === 'price-desc' ? -1 : 1));
      items.forEach((item) => list.append(item));
    });
  });

  document.querySelectorAll('[data-utility-table-sort]').forEach((table) => {
    const heads = [...table.querySelectorAll('th')];
    const body = table.tBodies[0];
    heads.forEach((head, index) => head.querySelector('button').addEventListener('click', () => {
      const ascending = head.getAttribute('aria-sort') !== 'ascending';
      heads.forEach((cell) => cell.removeAttribute('aria-sort'));
      head.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
      const rows = [...body.rows];
      rows.sort((a, b) => {
        const x = a.cells[index].textContent.trim();
        const y = b.cells[index].textContent.trim();
        const nx = parseFloat(x.replace(/[^0-9.-]/g, ''));
        const ny = parseFloat(y.replace(/[^0-9.-]/g, ''));
        const result = Number.isNaN(nx) || Number.isNaN(ny) ? x.localeCompare(y, 'ja') : nx - ny;
        return ascending ? result : -result;
      });
      rows.forEach((row) => body.append(row));
    }));
  });

  document.querySelectorAll('[data-utility-table-card]').forEach((root) => {
    const button = root.querySelector('[data-table-card-toggle]');
    button.addEventListener('click', () => {
      const cards = root.classList.toggle('is-cards');
      button.setAttribute('aria-pressed', String(cards));
      button.textContent = cards ? '表に戻す' : 'カード表示にする';
    });
  });

  document.querySelectorAll('[data-utility-smooth]').forEach((root) => {
    const frame = root.querySelector('[data-scroll-frame]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
      const target = root.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      frame.scrollTo({ top: target.offsetTop - Number(root.dataset.offset || 0), behavior: reduced ? 'auto' : 'smooth' });
    }));
  });

  document.querySelectorAll('[data-utility-links]').forEach((root) => {
    root.querySelectorAll('a[href^="http"]').forEach((link) => {
      if (link.host === location.host) return;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (!link.querySelector('.c-utility-script__external-icon')) {
        const icon = document.createElement('span');
        icon.className = 'c-utility-script__external-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '↗';
        link.append(icon);
      }
    });
  });

  document.querySelectorAll('[data-utility-year]').forEach((element) => { element.textContent = String(new Date().getFullYear()); });
  document.querySelectorAll('[data-utility-print]').forEach((button) => button.addEventListener('click', () => window.print()));
})();
