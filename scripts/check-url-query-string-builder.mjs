import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/url-query-string-builder.js');

const builder = globalThis.MarkBenchUrlQueryStringBuilder;
assert.ok(builder, 'URL / Query String Builder module should be available');
assert.equal(builder.MAX_URL_LENGTH, 10000);
assert.equal(builder.MAX_PARAM_LENGTH, 2000);
assert.equal(builder.MAX_PARAMS, 100);
assert.equal(builder.safeDecode('web+accessibility'), 'web accessibility');
assert.equal(builder.safeDecode('%E3%81%82'), 'あ');
assert.equal(builder.safeDecode('%E0%A4%A'), '%E0%A4%A');
assert.equal(builder.encodeComponent('web accessibility', 'plus'), 'web+accessibility');
assert.equal(builder.encodeComponent('web accessibility', 'percent'), 'web%20accessibility');
assert.equal(builder.encodeComponent("!'()*", 'percent'), '%21%27%28%29%2A');

assert.deepEqual(builder.splitUrl('https://example.com/path?a=1#results'), {
  source: 'https://example.com/path?a=1#results',
  base: 'https://example.com/path',
  query: 'a=1',
  fragment: 'results',
  hasQuery: true,
  hasFragment: true,
});

const parsedQuery = builder.parseQuery('?q=web+accessibility&tag=html&tag=css&empty&encoded=%E3%81%82');
assert.deepEqual(parsedQuery.map(({ key, value, hasEquals }) => ({ key, value, hasEquals })), [
  { key: 'q', value: 'web accessibility', hasEquals: true },
  { key: 'tag', value: 'html', hasEquals: true },
  { key: 'tag', value: 'css', hasEquals: true },
  { key: 'empty', value: '', hasEquals: false },
  { key: 'encoded', value: 'あ', hasEquals: true },
]);

const parsedUrl = builder.parseUrl('/search?q=web+tools&tag=html&tag=css#result%20list');
assert.equal(parsedUrl.valid, true);
assert.equal(parsedUrl.base, '/search');
assert.equal(parsedUrl.fragment, 'result list');
assert.deepEqual(parsedUrl.params.map(({ key, value }) => [key, value]), [
  ['q', 'web tools'],
  ['tag', 'html'],
  ['tag', 'css'],
]);
assert.equal(builder.validateBase('https://example.com/path').valid, true);
assert.equal(builder.validateBase('../relative/path').valid, true);
assert.equal(builder.validateBase('https://example.com/bad path').valid, false);

const params = [
  { key: 'q', value: 'web accessibility', enabled: true },
  { key: 'tag', value: 'html', enabled: true },
  { key: 'tag', value: 'css', enabled: true },
  { key: 'disabled', value: 'skip', enabled: false },
  { key: 'empty', value: '', enabled: true },
];
const plusResult = builder.build('https://example.com/search', params, 'result list', { spaceEncoding: 'plus', emptyStyle: 'equals' });
assert.equal(plusResult.valid, true);
assert.equal(plusResult.query, 'q=web+accessibility&tag=html&tag=css&empty=');
assert.equal(plusResult.url, 'https://example.com/search?q=web+accessibility&tag=html&tag=css&empty=#result%20list');
assert.equal(plusResult.metrics.enabledParams, 4);
assert.equal(plusResult.metrics.duplicateKeys, 1);

const percentResult = builder.build('/search?old=value#old', params, '', { spaceEncoding: 'percent', emptyStyle: 'key-only' });
assert.equal(percentResult.hasEmbeddedParts, true);
assert.equal(percentResult.query, 'q=web%20accessibility&tag=html&tag=css&empty');
assert.equal(percentResult.url, '/search?q=web%20accessibility&tag=html&tag=css&empty');

const invalid = builder.build('https://example.com/bad path', params, 'result');
assert.equal(invalid.valid, false);
assert.ok(invalid.error);

const limitedParams = Array.from({ length: builder.MAX_PARAMS + 5 }, (_, index) => ({ key: `key${index}`, value: String(index), enabled: true }));
assert.equal(builder.buildQuery(limitedParams).split('&').length, builder.MAX_PARAMS);

const page = await readFile(new URL('../tools/url-query-string-builder.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="url-query-string-builder"/u);
assert.match(page, /js\/url-query-string-builder\.js/u);
assert.match(page, /privacy-note__body/u);
assert.match(page, /data-tool-steps/u);
assert.match(page, /page-footer/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
// Directory counts are checked centrally by check:tools-count.
assert.match(directory, /data-keyword="URL"/u);
assert.match(directory, /data-id="url-query-string-builder"/u);
assert.match(directory, /href="\.\/url-query-string-builder\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /data-tools-count/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /'url-query-string-builder'/u);
assert.match(controller, /kind: 'url-builder'/u);
assert.match(controller, /renderUrlQueryStringBuilder/u);

const moduleSource = await readFile(new URL('../js/url-query-string-builder.js', import.meta.url), 'utf8');
assert.match(moduleSource, /data-url-param-list/u);
assert.match(moduleSource, /data-copy-built-url/u);
assert.match(moduleSource, /data-copy-query-string/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.workspace-grid--url-builder/u);
assert.match(styles, /\.url-builder__param-row/u);
assert.match(styles, /\.url-builder__metrics/u);

console.log('URL / Query String Builder checks passed.');
