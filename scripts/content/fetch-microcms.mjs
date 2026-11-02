import { BLOG_ENDPOINT } from './blog-model.mjs';

const DEFAULT_PAGE_LIMIT = 100;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 300;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const normalizeServiceDomain = (value) => {
  const input = String(value || '').trim().toLowerCase();
  if (!input) throw new Error('MICROCMS_SERVICE_DOMAIN is required for a microCMS build');
  const domain = input.endsWith('.microcms.io') ? input : `${input}.microcms.io`;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.microcms\.io$/.test(domain)) {
    throw new Error('MICROCMS_SERVICE_DOMAIN must be a valid microCMS service ID or domain');
  }
  return domain;
};

const requireApiKey = (value) => {
  const apiKey = String(value || '').trim();
  if (!apiKey) throw new Error('MICROCMS_API_KEY is required for a microCMS build');
  return apiKey;
};

const fetchPage = async ({
  url,
  apiKey,
  fetchImpl,
  timeoutMs,
  maxAttempts,
  retryBaseDelayMs,
  waitImpl,
}) => {
  let lastError = new Error('microCMS request could not be completed');

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        headers: {
          'X-MICROCMS-API-KEY': apiKey,
          Accept: 'application/json',
          'User-Agent': 'mark-bench-static-build',
        },
        signal: controller.signal,
      });

      if (response.ok) {
        try {
          return await response.json();
        } catch {
          lastError = new Error('microCMS returned invalid JSON');
        }
      } else {
        const statusError = new Error(`microCMS request failed with HTTP ${response.status}`);
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable) {
          statusError.retryable = false;
          throw statusError;
        }
        lastError = statusError;
      }
    } catch (error) {
      if (error?.retryable === false) throw error;
      lastError = controller.signal.aborted
        ? new Error(`microCMS request timed out after ${timeoutMs}ms`)
        : new Error('microCMS request could not be completed');
    } finally {
      clearTimeout(timer);
    }

    if (attempt < maxAttempts) {
      await waitImpl(retryBaseDelayMs * (2 ** (attempt - 1)));
    }
  }

  throw lastError;
};

const validateListPayload = (payload) => {
  if (!Array.isArray(payload?.contents) || !Number.isInteger(payload?.totalCount) || payload.totalCount < 0) {
    throw new Error('microCMS returned an unexpected list response');
  }
  return payload;
};

export const fetchBlogEntries = async ({
  serviceDomain,
  apiKey,
  fetchImpl = globalThis.fetch,
  pageLimit = DEFAULT_PAGE_LIMIT,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  retryBaseDelayMs = DEFAULT_RETRY_BASE_DELAY_MS,
  waitImpl = wait,
} = {}) => {
  const domain = normalizeServiceDomain(serviceDomain);
  const key = requireApiKey(apiKey);
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');
  if (!Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 100) {
    throw new Error('microCMS pageLimit must be an integer from 1 to 100');
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5) {
    throw new Error('microCMS maxAttempts must be an integer from 1 to 5');
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error('microCMS timeoutMs must be a positive integer');
  }
  if (!Number.isInteger(retryBaseDelayMs) || retryBaseDelayMs < 0) {
    throw new Error('microCMS retryBaseDelayMs must be a non-negative integer');
  }

  const entries = [];
  let offset = 0;
  let totalCount = Number.POSITIVE_INFINITY;

  while (offset < totalCount) {
    const url = new URL(`https://${domain}/api/v1/${BLOG_ENDPOINT}`);
    url.searchParams.set('limit', String(pageLimit));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('orders', '-publishedAt,-updatedAt,slug');
    const payload = validateListPayload(await fetchPage({
      url,
      apiKey: key,
      fetchImpl,
      timeoutMs,
      maxAttempts,
      retryBaseDelayMs,
      waitImpl,
    }));

    if (totalCount === Number.POSITIVE_INFINITY) totalCount = payload.totalCount;
    if (payload.totalCount !== totalCount) throw new Error('microCMS totalCount changed during pagination');
    entries.push(...payload.contents);
    if (!payload.contents.length) break;
    offset += payload.contents.length;
  }

  if (entries.length !== totalCount) {
    throw new Error(`microCMS pagination was incomplete: expected ${totalCount}, received ${entries.length}`);
  }
  const ids = entries.map((entry) => entry?.id).filter(Boolean);
  if (new Set(ids).size !== ids.length) throw new Error('microCMS returned duplicate content IDs');
  return entries;
};
