import assert from 'node:assert/strict';

import fixture from '../content/blog.fixture.mjs';
import { fetchBlogEntries, normalizeServiceDomain } from './content/fetch-microcms.mjs';
import { loadBlogEntries } from './content/load-blog-entries.mjs';

const response = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => payload,
});

assert.equal(normalizeServiceDomain('mark-bench'), 'mark-bench.microcms.io');
assert.equal(normalizeServiceDomain('MARK-BENCH.MICROCMS.IO'), 'mark-bench.microcms.io');
assert.throws(() => normalizeServiceDomain('https://mark-bench.microcms.io'), /valid microCMS service ID/);

const pagedRequests = [];
const pagedEntries = await fetchBlogEntries({
  serviceDomain: 'mark-bench',
  apiKey: 'test-get-only-key',
  pageLimit: 2,
  waitImpl: async () => {},
  fetchImpl: async (url, options) => {
    pagedRequests.push({ url: new URL(url), options });
    const offset = Number(new URL(url).searchParams.get('offset'));
    return response(200, {
      contents: fixture.slice(offset, offset + 2),
      totalCount: fixture.length,
      offset,
      limit: 2,
    });
  },
});
assert.equal(pagedEntries.length, fixture.length);
assert.equal(pagedRequests.length, 2);
assert.deepEqual(pagedRequests.map(({ url }) => url.searchParams.get('offset')), ['0', '2']);
assert.ok(pagedRequests.every(({ url }) => url.pathname === '/api/v1/blog'));
assert.ok(pagedRequests.every(({ options }) => options.headers['X-MICROCMS-API-KEY'] === 'test-get-only-key'));

let retryAttempts = 0;
const retryWaits = [];
const retriedEntries = await fetchBlogEntries({
  serviceDomain: 'mark-bench',
  apiKey: 'test-get-only-key',
  maxAttempts: 3,
  retryBaseDelayMs: 10,
  waitImpl: async (delay) => retryWaits.push(delay),
  fetchImpl: async () => {
    retryAttempts += 1;
    if (retryAttempts === 1) return response(500, {});
    if (retryAttempts === 2) return response(429, {});
    return response(200, { contents: fixture, totalCount: fixture.length });
  },
});
assert.equal(retriedEntries.length, fixture.length);
assert.equal(retryAttempts, 3);
assert.deepEqual(retryWaits, [10, 20]);

let clientErrorAttempts = 0;
await assert.rejects(
  fetchBlogEntries({
    serviceDomain: 'mark-bench',
    apiKey: 'test-get-only-key',
    waitImpl: async () => {},
    fetchImpl: async () => {
      clientErrorAttempts += 1;
      return response(401, {});
    },
  }),
  /HTTP 401/,
);
assert.equal(clientErrorAttempts, 1);

await assert.rejects(
  fetchBlogEntries({
    serviceDomain: 'mark-bench',
    apiKey: 'test-get-only-key',
    waitImpl: async () => {},
    fetchImpl: async () => response(200, { contents: [], totalCount: 1 }),
  }),
  /pagination was incomplete/,
);

await assert.rejects(
  fetchBlogEntries({
    serviceDomain: 'mark-bench',
    apiKey: 'test-get-only-key',
    waitImpl: async () => {},
    fetchImpl: async () => response(200, { items: fixture, totalCount: fixture.length }),
  }),
  /unexpected list response/,
);

const secretValue = 'must-not-appear-in-errors';
await assert.rejects(
  fetchBlogEntries({
    serviceDomain: 'mark-bench',
    apiKey: secretValue,
    maxAttempts: 1,
    waitImpl: async () => {},
    fetchImpl: async () => response(500, {}),
  }),
  (error) => error.message.includes('HTTP 500') && !error.message.includes(secretValue),
);

await assert.rejects(
  fetchBlogEntries({
    serviceDomain: 'mark-bench',
    apiKey: 'test-get-only-key',
    timeoutMs: 5,
    maxAttempts: 1,
    waitImpl: async () => {},
    fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }),
  }),
  /timed out after 5ms/,
);

await assert.rejects(loadBlogEntries({ source: 'unknown' }), /Unsupported content source/);
await assert.rejects(
  loadBlogEntries({ source: 'microcms', env: {}, fetchImpl: async () => response(200, {}) }),
  /MICROCMS_SERVICE_DOMAIN is required/,
);
assert.equal((await loadBlogEntries({ source: 'fixture' })).length, fixture.length);

console.log('microCMS fetch validation passed: pagination, retry, credentials, and response checks.');
