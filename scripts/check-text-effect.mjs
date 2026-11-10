import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../js/web-parts-text-effect.js', import.meta.url), 'utf8');
class Element {
  constructor(text = '') {
    this.value = text;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.handlers = new Map();
    this.disabled = false;
    this.style = { setProperty(name, value) { this[name] = value; } };
    const classes = new Set();
    this.classList = { add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name) };
  }
  get textContent() { return this.children.length ? this.children.map(child => child.textContent).join('') : this.value; }
  set textContent(value) { this.value = value; this.children = []; }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(child) { this.children.push(child); }
  get offsetWidth() { return 200; }
  addEventListener(type, handler) { this.handlers.set(type, handler); }
  click() { if (!this.disabled) this.handlers.get('click')?.(); }
  querySelector(selector) { return this.fields?.[selector] || null; }
}

function setup({ reduced = false, observer = true, code = source } = {}) {
  const roots = Object.fromEntries(['scramble', 'reveal', 'sweep', 'assemble', 'typewriter', 'lines'].map(name => [name, new Element('TEXT')]));
  const output = new Element();
  const replay = new Element('REPLAY');
  roots.typewriter.dataset.text = 'TYPE';
  roots.typewriter.fields = { '[data-typewriter-output]': output, '[data-typewriter-replay]': replay };
  roots.lines.fields = { '[data-lines-replay]': new Element('REPLAY') };
  const observers = [], frames = [], timers = new Map(), intervals = new Map();
  let nextTimer = 0;
  const context = {
    document: {
      querySelectorAll: selector => {
        const name = selector.match(/^\[data-text-effect-([^\]]+)\]$/u)?.[1];
        return roots[name] ? [roots[name]] : [];
      },
      createElement: () => new Element(),
    },
    matchMedia: () => ({ matches: reduced }),
    requestAnimationFrame: callback => frames.push(callback),
    setTimeout: callback => { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout: id => timers.delete(id),
    setInterval: callback => { intervals.set(++nextTimer, callback); return nextTimer; },
    clearInterval: id => intervals.delete(id),
  };
  if (observer) context.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
  };
  context.window = context;
  vm.runInNewContext(code, context);
  const enter = (element, ratio, intersecting = true) => observers.filter(item => item.targets.has(element)).forEach(item => item.callback([
    { target: element, isIntersecting: intersecting, intersectionRatio: ratio },
    { target: element, isIntersecting: intersecting, intersectionRatio: ratio },
  ]));
  return { roots, output, replay, observers, frames, timers, intervals, enter };
}

const normal = setup();
assert.equal(normal.observers.length, 6);
assert.equal(normal.timers.size + normal.intervals.size + normal.frames.length, 0, 'Offscreen demos must not start on page load.');
for (const name of ['reveal', 'sweep', 'lines']) assert.equal(normal.roots[name].classList.contains('is-active'), false);
assert.equal(normal.output.textContent, '');
normal.enter(normal.roots.reveal, .1);
normal.enter(normal.roots.reveal, .5, false);
assert.equal(normal.frames.length, 0, 'Tiny intersections and exits must not start playback.');
for (const root of Object.values(normal.roots)) normal.enter(root, .5);
assert.equal(normal.frames.length, 6, 'Each demo starts once even if multiple observer entries are queued.');
normal.frames.splice(0).forEach(callback => callback());
for (const name of ['reveal', 'sweep', 'lines']) assert.equal(normal.roots[name].classList.contains('is-active'), true);
assert.equal(normal.roots.reveal.children[2].style.transitionDelay, '90ms');
assert.equal(normal.roots.sweep.children[2].style.transitionDelay, '110ms');
assert.equal(normal.roots.assemble.children[2].style.transitionDelay, '70ms');
assert.ok(normal.roots.assemble.children[0].style['--scatter-x']);
assert.equal(normal.roots.assemble.classList.contains('is-resetting'), false);
assert.equal(normal.output.textContent, 'T');
assert.equal(normal.replay.disabled, true);
assert.equal(normal.intervals.size, 1);
for (let limit = 0; normal.timers.size && limit < 10; limit++) {
  const [id, callback] = normal.timers.entries().next().value;
  normal.timers.delete(id);
  callback();
}
assert.equal(normal.output.textContent, 'TYPE');
assert.equal(normal.replay.disabled, false);
normal.replay.click();
assert.equal(normal.output.textContent, 'T', 'Manual replay must restart after completion.');
for (const root of Object.values(normal.roots)) normal.enter(root, .5);
assert.equal(normal.frames.length, 0, 'Completed initial playback must not repeat on re-entry.');

const reduced = setup({ reduced: true });
assert.equal(reduced.observers.length, 0);
assert.equal(reduced.timers.size + reduced.intervals.size, 0);
assert.equal(reduced.output.textContent, 'TYPE');
for (const name of ['reveal', 'sweep', 'lines']) assert.equal(reduced.roots[name].classList.contains('is-active'), true);
const fallback = setup({ observer: false });
assert.equal(fallback.observers.length, 0);
assert.equal(fallback.roots.reveal.classList.contains('is-active'), true);
assert.equal(fallback.output.textContent, 'T');

const html = await readFile(new URL('../web-parts/text-effect.html', import.meta.url), 'utf8');
const decode = text => text.replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
const snippets = [...html.matchAll(/<span>JAVASCRIPT<\/span>[\s\S]*?<code>([\s\S]*?)<\/code>/gu)];
assert.equal(snippets.length, 14);
snippets.forEach(([, code]) => new vm.Script(decode(code)));
let portable = 0;
for (const [section] of html.matchAll(/<section class="part-example[^"]*" data-pattern[\s\S]*?<\/section>/gu)) {
  const preview = section.match(/<div class="part-example__preview">([\s\S]*?)<\/div>\s*<div class="part-example__code-grid/u)[1];
  const key = ['scramble', 'reveal', 'sweep', 'assemble', 'typewriter', 'lines'].find(name => preview.includes('data-text-effect-' + name));
  if (!key) continue;
  const blocks = [...section.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/gu)].map(([, code]) => decode(code));
  const normalize = text => text.replace(/\s+/gu, ' ').trim();
  assert.equal(normalize(blocks[0]), normalize(preview), key + ': copied HTML must match the demo.');
  const standalone = setup({ code: blocks[2] });
  assert.equal(standalone.observers.length, 1, key + ': snippet must initialize without site helpers.');
  assert.equal(standalone.timers.size + standalone.intervals.size + standalone.frames.length, 0);
  standalone.enter(standalone.roots[key], .5);
  assert.equal(standalone.frames.length, 1);
  standalone.frames[0]();
  portable++;
}
assert.equal(portable, 6);
console.log('TEXT EFFECT checks passed: offscreen start prevention, first-view playback, replay, reduced motion, fallback, 14 JS snippets and 6 standalone demos.');
