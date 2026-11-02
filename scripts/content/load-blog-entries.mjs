import fixture from '../../content/blog.fixture.mjs';
import { normalizeBlogEntries } from './blog-model.mjs';
import { fetchBlogEntries } from './fetch-microcms.mjs';

export const CONTENT_SOURCES = Object.freeze(['fixture', 'microcms']);

export const loadBlogEntries = async ({
  source = 'fixture',
  env = process.env,
  fetchImpl = globalThis.fetch,
  fetchOptions = {},
} = {}) => {
  if (!CONTENT_SOURCES.includes(source)) {
    throw new Error(`Unsupported content source: ${source}`);
  }
  if (source === 'fixture') return normalizeBlogEntries(fixture);

  const entries = await fetchBlogEntries({
    serviceDomain: env.MICROCMS_SERVICE_DOMAIN,
    apiKey: env.MICROCMS_API_KEY,
    fetchImpl,
    ...fetchOptions,
  });
  return normalizeBlogEntries(entries);
};
