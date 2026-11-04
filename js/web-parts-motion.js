(() => {
  const root = document.querySelector('.c-motion--sort');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const animate = (element, frames, duration = 550) => {
    if (reduce.matches || !element.animate) return null;
    return element.animate(frames, { duration, easing: 'cubic-bezier(.2,.75,.3,1)' });
  };
  const list = root.querySelector('ul');
  root.querySelectorAll('[data-order]').forEach(button => button.addEventListener('click', () => {
    const items = [...list.children];
    const before = new Map(items.map(el => [el, el.getBoundingClientRect()]));
    items.forEach(el => el.getAnimations?.().forEach(a => a.cancel()));
    items.sort((a,b) => button.dataset.order === 'asc' ? Number(a.dataset.key) - Number(b.dataset.key) : Number(b.dataset.key) - Number(a.dataset.key));
    list.append(...items);
    items.forEach(el => {
      const after = el.getBoundingClientRect(); const old = before.get(el);
      animate(el, [{ transform: 'translate(' + (old.left-after.left) + 'px,' + (old.top-after.top) + 'px)' }, { transform: 'none' }]);
    });
    root.querySelector('[data-status]').textContent = button.dataset.order === 'asc' ? '番号順に並び替えました。' : '逆順に並び替えました。';
  }));
})();

(() => {
  const root = document.querySelector('.c-motion--height');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const animate = (element, frames, duration = 550) => {
    if (reduce.matches || !element.animate) return null;
    return element.animate(frames, { duration, easing: 'cubic-bezier(.2,.75,.3,1)' });
  };
  const panel = root.querySelector('.c-motion__content');
  root.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
    const before = panel.getBoundingClientRect().height;
    panel.getAnimations?.().forEach(a => a.cancel());
    panel.querySelector('p').textContent = button.dataset.size === 'short' ? '構造を小さく保つ。' : '基本となる構造を揃え、用途に応じた差分を設定に集約します。内容が増えたときにも外枠が自然に追従するため、前後のコンテンツとの関係を見失いにくくなります。画面幅や文字サイズが変わっても、実際の高さを計測して切り替えます。';
    const after = panel.getBoundingClientRect().height;
    animate(panel, [{ height: before + 'px' }, { height: after + 'px' }]);
    root.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    root.querySelector('[data-status]').textContent = button.textContent + 'を表示しています。';
  }));
})();

(() => {
  const root = document.querySelector('.c-motion--shared');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const animate = (element, frames, duration = 550) => {
    if (reduce.matches || !element.animate) return null;
    return element.animate(frames, { duration, easing: 'cubic-bezier(.2,.75,.3,1)' });
  };
  const tile = root.querySelector('.c-motion__tile');
  const source = root.querySelector('.c-motion__source');
  const detail = root.querySelector('.c-motion__detail');
  const move = open => {
    const before = tile.getBoundingClientRect();
    tile.getAnimations?.().forEach(a => a.cancel());
    source.hidden = open; detail.hidden = !open;
    (open ? root.querySelector('[data-destination]') : source).prepend(tile);
    tile.setAttribute('aria-expanded', String(open));
    const after = tile.getBoundingClientRect();
    animate(tile, [{ transformOrigin: 'top left', transform: 'translate(' + (before.left-after.left) + 'px,' + (before.top-after.top) + 'px) scale(' + before.width/after.width + ',' + before.height/after.height + ')' }, { transformOrigin: 'top left', transform: 'none' }]);
    tile.focus(); root.querySelector('[data-status]').textContent = open ? '詳細を表示しています。' : '一覧に戻りました。';
  };
  tile.addEventListener('click', () => { if (tile.getAttribute('aria-expanded') === 'false') move(true); });
  root.querySelector('[data-back]').addEventListener('click', () => move(false));
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && !detail.hidden) move(false); });
})();

(() => {
  const root = document.querySelector('.c-motion--filter');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const animate = (element, frames, duration = 550) => {
    if (reduce.matches || !element.animate) return null;
    return element.animate(frames, { duration, easing: 'cubic-bezier(.2,.75,.3,1)' });
  };
  const items = [...root.querySelectorAll('[data-category]')];
  const buttons = [...root.querySelectorAll('[data-filter]')];
  const wait = animation => animation ? animation.finished.catch(() => {}) : Promise.resolve();
  buttons.forEach(button => button.addEventListener('click', async () => {
    buttons.forEach(b => { b.disabled = true; b.setAttribute('aria-pressed', String(b === button)); });
    const before = new Map(items.filter(el => !el.hidden).map(el => [el, el.getBoundingClientRect()]));
    const matches = el => button.dataset.filter === 'all' || el.dataset.category === button.dataset.filter;
    await Promise.all(items.filter(el => !el.hidden && !matches(el)).map(el => wait(animate(el, [{ opacity: 1 }, { opacity: 0, transform: 'scale(.9)' }], 200))));
    items.forEach(el => { el.hidden = !matches(el); });
    let count = 0;
    const animations = items.filter(el => !el.hidden).map(el => {
      count++; const after = el.getBoundingClientRect(); const old = before.get(el);
      return wait(animate(el, old ? [{ transform: 'translate(' + (old.left-after.left) + 'px,' + (old.top-after.top) + 'px)' }, { transform: 'none' }] : [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], 400));
    });
    root.querySelector('[data-empty]').hidden = count !== 0;
    root.querySelector('[data-status]').textContent = count + '件を表示しています。';
    await Promise.all(animations); buttons.forEach(b => { b.disabled = false; }); button.focus();
  }));
})();

(() => {
  const root = document.querySelector('.c-motion--draw');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const animate = (element, frames, duration = 550) => {
    if (reduce.matches || !element.animate) return null;
    return element.animate(frames, { duration, easing: 'cubic-bezier(.2,.75,.3,1)' });
  };
  const path = root.querySelector('.c-motion__ink');
  const length = path.getTotalLength();
  let current = null;
  path.style.strokeDasharray = String(length); path.style.strokeDashoffset = String(length);
  root.querySelector('[data-play]').addEventListener('click', () => {
    current?.cancel(); path.style.strokeDashoffset = '0';
    current = animate(path, [{ strokeDashoffset: String(length) }, { strokeDashoffset: '0' }], 1300);
    root.querySelector('[data-status]').textContent = reduce.matches ? '動きを抑えて完成形を表示しています。' : '線を描画しています。';
    current?.finished.then(() => { root.querySelector('[data-status]').textContent = '描画が完了しました。'; }).catch(() => {});
  });
  root.querySelector('[data-reset]').addEventListener('click', () => {
    current?.cancel(); path.style.strokeDashoffset = String(length);
    root.querySelector('[data-status]').textContent = 'リセットしました。再生できます。';
  });
})();

(() => {
  const root = document.querySelector('.c-motion--path');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const animate = (element, frames, duration = 550) => {
    if (reduce.matches || !element.animate) return null;
    return element.animate(frames, { duration, easing: 'cubic-bezier(.2,.75,.3,1)' });
  };
  const path = root.querySelector('path');
  const marker = root.querySelector('circle');
  const play = root.querySelector('[data-play]');
  const pause = root.querySelector('[data-pause]');
  const output = root.querySelector('[data-status]');
  const length = path.getTotalLength();
  let elapsed = 0; let previous = null; let frame = 0;
  const position = () => { const p = path.getPointAtLength(length * elapsed / 2800); marker.setAttribute('cx', p.x); marker.setAttribute('cy', p.y); };
  const stop = () => { cancelAnimationFrame(frame); previous = null; pause.disabled = true; play.disabled = false; };
  const tick = time => {
    if (previous !== null) elapsed = Math.min(2800, elapsed + time - previous);
    previous = time; position();
    if (elapsed < 2800) frame = requestAnimationFrame(tick);
    else { stop(); play.textContent = 'もう一度再生'; output.textContent = '終点に到着しました。'; }
  };
  play.addEventListener('click', () => {
    if (elapsed >= 2800) elapsed = 0;
    if (reduce.matches) { elapsed = 2800; position(); output.textContent = '動きを抑えて終点を表示しています。'; return; }
    play.disabled = true; pause.disabled = false; previous = null;
    frame = requestAnimationFrame(tick); output.textContent = '経路に沿って移動しています。';
  });
  pause.addEventListener('click', () => { stop(); play.textContent = '続きから再生'; output.textContent = '一時停止しました。'; play.focus(); });
  root.querySelector('[data-reset]').addEventListener('click', () => { stop(); elapsed = 0; position(); play.textContent = '再生'; output.textContent = '始点に戻しました。'; });
  reduce.addEventListener('change', () => { if (reduce.matches) { stop(); elapsed = 2800; position(); output.textContent = '動きを抑えて終点を表示しています。'; } });
})();
