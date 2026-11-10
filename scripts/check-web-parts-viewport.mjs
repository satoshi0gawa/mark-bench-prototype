import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as csstree from 'css-tree';

class Element {
  constructor(text = '') {
    this.textContent = text;
    this.dataset = {};
    this.children = [];
    this.fields = {};
    this.attributes = {};
    this.handlers = new Map();
    this.style = { setProperty(name, value) { this[name] = value; } };
    const classes = new Set();
    this.classList = { add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name) };
  }
  appendChild(child) { this.children.push(child); }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] || null; }
  addEventListener(type, handler) { this.handlers.set(type, handler); }
  click() { this.handlers.get('click')?.({ currentTarget: this }); }
  querySelector(selector) { return this.fields[selector] || null; }
  querySelectorAll(selector) { const result = this.fields[selector]; return Array.isArray(result) ? result : result ? [result] : []; }
  matches(selector) { return selector === '[data-scroll-lazy]' && this.lazy; }
  get offsetWidth() { return 200; }
  scrollTo(options) { this.scrollTop = options.top; }
}

const counterSource = await readFile(new URL('../js/web-parts-counter.js', import.meta.url), 'utf8');
const scrollSource = await readFile(new URL('../js/web-parts-scroll-reveal.js', import.meta.url), 'utf8');
function setup(code, { reduced = false, observer = true } = {}) {
  const count = new Element(), comma = new Element(), ring = new Element(), roll = new Element();
  for (const root of [count, comma, ring, roll]) {
    root.dataset.to = '1280'; root.dataset.duration = '1400';
    root.fields['[data-counter-replay]'] = new Element();
    root.fields['[data-counter-output]'] = new Element('0');
  }
  comma.dataset.format = 'comma'; comma.dataset.to = '128540';
  ring.dataset.to = '82'; ring.fields['[data-counter-ring-graphic]'] = new Element();
  ring.fields['[data-counter-ring-output]'] = new Element('0');
  roll.dataset.to = '2,489'; roll.fields['[data-counter-roll-digits]'] = new Element();
  const demos = Array.from({ length: 9 }, (_, index) => {
    const demo = new Element(), target = new Element();
    demo.dataset.once = 'false'; target.lazy = index === 7;
    if (target.lazy) {
      const image = new Element(); image.dataset.src = 'test.svg'; image.complete = true;
      target.fields['img[data-src]'] = image;
    }
    demo.fields = {
      '[data-scroll-viewport]': new Element(), '[data-scroll-target]': [target],
      '[data-scroll-lazy]': target.lazy ? [target] : [],
      '[data-scroll-reset]': new Element(), '[data-scroll-mode]': new Element(),
    };
    return demo;
  });
  const observers = [], frames = new Map(), timers = new Map();
  let id = 0;
  const context = {
    document: {
      createElement: () => new Element(),
      querySelectorAll: selector => ({
        '[data-counter-value]': [count, comma], '[data-counter-ring]': [ring], '[data-counter-roll]': [roll],
        '[data-scroll-demo="reveal"]': demos,
      })[selector] || [],
    },
    matchMedia: () => ({ matches: reduced }), performance: { now: () => 0 },
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: frame => frames.delete(frame),
    setTimeout: callback => { timers.set(++id, callback); return id; }, clearTimeout: timer => timers.delete(timer),
  };
  if (observer) context.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
  };
  context.window = context;
  vm.runInNewContext(code, context);
  const enter = (target, ratio = .8, intersecting = true) => {
    for (const item of observers.filter(item => item.targets.has(target))) item.callback([
      { target, intersectionRatio: ratio, isIntersecting: intersecting },
      { target, intersectionRatio: ratio, isIntersecting: intersecting },
    ]);
  };
  const flushFrames = time => {
    const batch = [...frames.values()]; frames.clear(); batch.forEach(callback => callback(time));
  };
  return { count, comma, ring, roll, demos, observers, frames, timers, enter, flushFrames };
}

function checkCounter(code, expectedObservers = 4) {
  const state = setup(code);
  assert.equal(state.observers.length, expectedObservers);
  assert.equal(state.frames.size + state.timers.size, 0, 'Counters must wait offscreen.');
  const roots = state.observers.map(item => [...item.targets][0]);
  roots.forEach(root => state.enter(root, .1));
  assert.equal(state.frames.size, 0, 'A sliver of the demo must not start playback.');
  roots.forEach(root => state.enter(root));
  assert.equal(state.frames.size, expectedObservers, 'Multiple queued entries must start each demo only once.');
  state.flushFrames(0);
  state.flushFrames(500);
  if (roots.includes(state.count)) {
    const value = Number(state.count.fields['[data-counter-output]'].textContent);
    assert.ok(value > 0 && value < 1280, 'A visible counter must have intermediate frames.');
  }
  state.flushFrames(2000);
  if (roots.includes(state.ring)) assert.equal(state.ring.fields['[data-counter-ring-output]'].textContent, '82');
  if (roots.includes(state.comma)) assert.equal(state.comma.fields['[data-counter-output]'].textContent, '128,540');
  if (roots.includes(state.roll)) {
    state.roll.fields['[data-counter-replay]'].click();
    assert.equal(state.timers.size, 4, 'Replay must replace pending roll timers.');
    const callbacks = [...state.timers.values()]; state.timers.clear(); callbacks.forEach(callback => callback());
    assert.equal(state.roll.fields['[data-counter-roll-digits]'].children[0].children[0].style.transform, 'translateY(-2em)');
  }
  roots.forEach(root => state.enter(root));
  assert.equal(state.frames.size, 0, 'Initial playback must not repeat on re-entry.');
  roots.forEach(root => root.fields['[data-counter-replay]'].click());
  assert.ok(state.frames.size + state.timers.size > 0, 'Manual replay must remain available.');
  const reduced = setup(code, { reduced: true });
  assert.equal(reduced.observers.length + reduced.frames.size + reduced.timers.size, 0);
  if (roots.includes(state.count)) assert.equal(reduced.count.fields['[data-counter-output]'].textContent, '1280');
  if (roots.includes(state.ring)) assert.equal(reduced.ring.fields['[data-counter-ring-output]'].textContent, '82');
  if (roots.includes(state.roll)) assert.equal(reduced.roll.fields['[data-counter-roll-digits]'].children[0].children[0].style.transform, 'translateY(-2em)');
  const fallback = setup(code, { observer: false });
  assert.equal(fallback.observers.length, 0);
  assert.ok(fallback.frames.size + fallback.timers.size > 0);
}

function checkScroll(code) {
  const state = setup(code);
  assert.equal(state.observers.length, 9);
  for (const item of state.observers) assert.equal(item.options.root, undefined, 'Use the document viewport so both page and inner scroll clipping count.');
  const demo = state.demos[0], target = demo.fields['[data-scroll-target]'][0];
  state.enter(target, .1);
  assert.equal(target.classList.contains('is-revealed'), false);
  state.enter(target);
  assert.equal(target.classList.contains('is-revealed'), true);
  state.enter(target, 0, false);
  assert.equal(target.classList.contains('is-revealed'), false);
  demo.fields['[data-scroll-mode]'].click();
  state.enter(target);
  state.enter(target, 0, false);
  assert.equal(target.classList.contains('is-revealed'), true, 'ONCE must stay complete.');
  demo.fields['[data-scroll-reset]'].click();
  assert.equal(target.classList.contains('is-revealed'), false);
  assert.ok(state.observers[0].targets.has(target), 'REPLAY must re-arm a completed ONCE observer.');
  state.enter(target);
  assert.equal(target.classList.contains('is-revealed'), true);
  const lazy = state.demos[7].fields['[data-scroll-target]'][0];
  assert.equal(lazy.fields['img[data-src]'].src, undefined, 'Offscreen lazy media must not start fading.');
  state.enter(lazy);
  assert.equal(lazy.fields['img[data-src]'].src, 'test.svg');
  assert.equal(lazy.classList.contains('is-loaded'), true);
  for (const options of [{ reduced: true }, { observer: false }]) {
    const fallback = setup(code, options);
    assert.equal(fallback.observers.length, 0);
    fallback.demos.forEach(item => assert.equal(item.fields['[data-scroll-target]'][0].classList.contains('is-revealed'), true));
    fallback.demos[0].fields['[data-scroll-reset]'].click();
    assert.equal(fallback.demos[0].fields['[data-scroll-target]'][0].classList.contains('is-revealed'), true);
  }
}
checkCounter(counterSource);
checkScroll(scrollSource);
const decode = value => value.replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
let portable = 0;
for (const page of ['counter', 'scroll-reveal']) {
  const html = await readFile(new URL(`../web-parts/${page}.html`, import.meta.url), 'utf8');
  for (const [section] of html.matchAll(/<section class="part-example[^"]*" data-pattern[\s\S]*?<\/section>/gu)) {
    const blocks = [...section.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/gu)].map(([, code]) => decode(code));
    new vm.Script(blocks[2]);
    csstree.parse(blocks[1]);
    const preview = section.split('<div class="part-example__preview">')[1].split('<div class="part-example__code-grid')[0].trim().replace(/<\/div>$/u, '').trim();
    const counter = page === 'counter' && /data-counter-(?:value|ring|roll)(?:\s|>)/u.test(preview);
    const scroll = page === 'scroll-reveal' && preview.includes('data-scroll-demo="reveal"');
    if (!counter && !scroll) continue;
    assert.equal(blocks[0], preview, 'Copied HTML must match the actual demo.');
    if (counter) checkCounter(blocks[2], preview.includes('data-counter-value') ? 2 : 1);
    else checkScroll(blocks[2]);
    portable++;
  }
}
assert.equal(portable, 13);
console.log('WEB PARTS viewport checks passed: counter start/replay, nested scroll clipping, ONCE replay, reduced motion, fallback and 13 standalone snippets.');
