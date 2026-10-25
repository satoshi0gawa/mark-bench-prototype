import sanitizeHtml from 'sanitize-html';

import fixture from '../../content/build-logs.fixture.mjs';
import { TOOL_CATALOG } from '../config/tools.mjs';

const ENDPOINT = 'build-logs';
const PAGE_LIMIT = 100;
const ALLOWED_STATUSES = new Set(['published', 'planned']);
const ALLOWED_CATEGORIES = new Set(['TEXT TOOLS', 'CODE TOOLS', 'CSS TOOLS', 'SITE']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOG_NUMBER_PATTERN = /^BUILD_LOG_\d{3}$/;
const SECTION_NUMBER_PATTERN = /^\d{2}$/;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const normalizeSelection = (value) => {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
};

const requireText = (value, field, context) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`${context}: ${field} is required`);
  return normalized;
};

const optionalText = (value) => String(value ?? '').trim();

const normalizeDate = (value, field, context, required = false) => {
  if (!value && !required) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${context}: ${field} must be a valid date`);
  return date.toISOString();
};

export const sanitizeRichText = (html) => sanitizeHtml(String(html ?? ''), {
  allowedTags: [
    'p', 'strong', 'em', 'u', 's', 'code', 'pre', 'ul', 'ol', 'li', 'a',
    'blockquote', 'br', 'hr', 'h3', 'h4', 'table', 'thead', 'tbody', 'tfoot',
    'tr', 'th', 'td', 'figure', 'figcaption', 'img', 'div', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    code: ['class'],
    div: ['data-filename'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
    span: ['class'],
  },
  allowedClasses: {
    code: [/^language-[a-z0-9-]+$/],
    span: ['marker-yellow', 'marker-blue'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['https'],
  },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attributes) => {
      const next = { ...attributes };
      if (next.target === '_blank') next.rel = 'noopener noreferrer';
      return { tagName, attribs: next };
    },
    img: (tagName, attributes) => ({
      tagName,
      attribs: { ...attributes, loading: 'lazy', decoding: 'async' },
    }),
  },
});

const normalizeSection = (section, index, context) => {
  const sectionContext = `${context} section ${index + 1}`;
  const sectionNumber = requireText(section?.sectionNumber, 'sectionNumber', sectionContext);
  if (!SECTION_NUMBER_PATTERN.test(sectionNumber)) {
    throw new Error(`${sectionContext}: sectionNumber must use two digits`);
  }

  const body = sanitizeRichText(requireText(section?.body, 'body', sectionContext));
  const calloutLabel = optionalText(section?.calloutLabel);
  const calloutBody = section?.calloutBody ? sanitizeRichText(section.calloutBody) : '';
  if ((calloutLabel && !calloutBody) || (!calloutLabel && calloutBody)) {
    throw new Error(`${sectionContext}: calloutLabel and calloutBody must be supplied together`);
  }

  return {
    sectionNumber,
    sectionLabel: requireText(section?.sectionLabel, 'sectionLabel', sectionContext),
    heading: requireText(section?.heading, 'heading', sectionContext),
    body,
    calloutLabel,
    calloutBody,
  };
};

const normalizeLog = (entry, index) => {
  const context = `build log ${entry?.id || index + 1}`;
  const displayStatus = normalizeSelection(entry?.displayStatus);
  if (!ALLOWED_STATUSES.has(displayStatus)) {
    throw new Error(`${context}: displayStatus must be published or planned`);
  }

  const logNumber = requireText(entry?.logNumber, 'logNumber', context);
  if (displayStatus === 'published' && !LOG_NUMBER_PATTERN.test(logNumber)) {
    throw new Error(`${context}: published logNumber must match BUILD_LOG_000`);
  }
  if (displayStatus === 'planned' && logNumber !== 'BUILD_NOTE_XXX') {
    throw new Error(`${context}: planned logNumber must be BUILD_NOTE_XXX`);
  }

  const slug = requireText(entry?.slug, 'slug', context);
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`${context}: slug must contain lowercase letters, numbers, and hyphens only`);
  }

  const category = normalizeSelection(entry?.category);
  if (!ALLOWED_CATEGORIES.has(category)) {
    throw new Error(`${context}: unsupported category ${category || '(empty)'}`);
  }

  const relatedToolId = optionalText(normalizeSelection(entry?.relatedToolId));
  if (relatedToolId && !TOOL_CATALOG[relatedToolId]) {
    throw new Error(`${context}: unknown relatedToolId ${relatedToolId}`);
  }

  const publishedAt = normalizeDate(entry?.publishedAt, 'publishedAt', context, displayStatus === 'published');
  const displayDate = normalizeDate(entry?.displayDate, 'displayDate', context) || publishedAt;
  const sections = Array.isArray(entry?.sections)
    ? entry.sections.map((section, sectionIndex) => normalizeSection(section, sectionIndex, context))
    : [];
  const sectionNumbers = sections.map((section) => section.sectionNumber);
  if (new Set(sectionNumbers).size !== sectionNumbers.length) {
    throw new Error(`${context}: sectionNumber values must be unique`);
  }

  const readingTime = entry?.readingTime == null ? null : Number(entry.readingTime);
  if (readingTime != null && (!Number.isInteger(readingTime) || readingTime < 1)) {
    throw new Error(`${context}: readingTime must be a positive integer`);
  }

  let ogImage = null;
  if (entry?.ogImage?.url) {
    const imageUrl = new URL(String(entry.ogImage.url));
    if (imageUrl.protocol !== 'https:') throw new Error(`${context}: ogImage must use HTTPS`);
    ogImage = {
      url: imageUrl.toString(),
      width: Number(entry.ogImage.width) || null,
      height: Number(entry.ogImage.height) || null,
    };
  }

  const normalized = {
    id: requireText(entry?.id, 'id', context),
    displayStatus,
    logNumber,
    title: requireText(entry?.title, 'title', context),
    slug,
    summary: optionalText(entry?.summary),
    category,
    displayDate,
    publishedAt,
    updatedAt: normalizeDate(entry?.updatedAt, 'updatedAt', context),
    readingTime,
    relatedToolId,
    ctaLabel: optionalText(entry?.ctaLabel),
    ctaDescription: optionalText(entry?.ctaDescription),
    ogImage,
    plannedOrder: Number(entry?.plannedOrder) || 0,
    sections,
  };

  if (displayStatus === 'published') {
    requireText(normalized.summary, 'summary', context);
    if (!normalized.readingTime) throw new Error(`${context}: readingTime is required`);
    if (!normalized.relatedToolId) throw new Error(`${context}: relatedToolId is required`);
    requireText(normalized.ctaLabel, 'ctaLabel', context);
    requireText(normalized.ctaDescription, 'ctaDescription', context);
    if (!normalized.sections.length) throw new Error(`${context}: at least one section is required`);
  }

  return normalized;
};

export const normalizeBuildLogs = (entries) => {
  if (!Array.isArray(entries)) throw new Error('Build log source must be an array');
  const normalized = entries.map(normalizeLog);
  const slugs = normalized.map((entry) => entry.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error('Build log slugs must be unique');

  const publishedNumbers = normalized
    .filter((entry) => entry.displayStatus === 'published')
    .map((entry) => entry.logNumber);
  if (new Set(publishedNumbers).size !== publishedNumbers.length) {
    throw new Error('Published build log numbers must be unique');
  }

  return normalized.sort((left, right) => {
    if (left.displayStatus !== right.displayStatus) {
      return left.displayStatus === 'published' ? -1 : 1;
    }
    if (left.displayStatus === 'planned') return left.plannedOrder - right.plannedOrder;
    const dateDifference = new Date(right.displayDate) - new Date(left.displayDate);
    if (dateDifference) return dateDifference;
    return right.logNumber.localeCompare(left.logNumber, 'en');
  });
};

const normalizeServiceDomain = (value) => {
  const input = String(value || '').trim().toLowerCase();
  if (!input) throw new Error('MICROCMS_SERVICE_DOMAIN is required for a microCMS build');
  const domain = input.endsWith('.microcms.io') ? input : `${input}.microcms.io`;
  if (!/^[a-z0-9-]+\.microcms\.io$/.test(domain)) {
    throw new Error('MICROCMS_SERVICE_DOMAIN must be a microCMS service ID or domain');
  }
  return domain;
};

const fetchPage = async (url, apiKey) => {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'X-MICROCMS-API-KEY': apiKey,
          Accept: 'application/json',
          'User-Agent': 'mark-bench-static-build',
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) return response.json();
      const message = `microCMS request failed with ${response.status}`;
      if (response.status < 500 && response.status !== 429) throw new Error(message);
      lastError = new Error(message);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 2) await wait(300 * (2 ** attempt));
  }
  throw lastError;
};

export const fetchBuildLogs = async ({ serviceDomain, apiKey }) => {
  const domain = normalizeServiceDomain(serviceDomain);
  if (!apiKey) throw new Error('MICROCMS_API_KEY is required for a microCMS build');

  const entries = [];
  let offset = 0;
  let totalCount = Number.POSITIVE_INFINITY;
  while (offset < totalCount) {
    const url = new URL(`https://${domain}/api/v1/${ENDPOINT}`);
    url.searchParams.set('limit', String(PAGE_LIMIT));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('orders', '-publishedAt,-updatedAt,slug');
    const payload = await fetchPage(url, apiKey);
    if (!Array.isArray(payload?.contents) || !Number.isInteger(payload?.totalCount)) {
      throw new Error('microCMS returned an unexpected list response');
    }
    entries.push(...payload.contents);
    totalCount = payload.totalCount;
    if (!payload.contents.length) break;
    offset += payload.contents.length;
  }
  if (entries.length !== totalCount) {
    throw new Error(`microCMS pagination was incomplete: expected ${totalCount}, received ${entries.length}`);
  }
  return entries;
};

export const loadBuildLogs = async ({ source = 'fixture' } = {}) => {
  if (source === 'fixture') return normalizeBuildLogs(fixture);
  if (source !== 'microcms') throw new Error(`Unsupported content source: ${source}`);
  const entries = await fetchBuildLogs({
    serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
    apiKey: process.env.MICROCMS_API_KEY,
  });
  return normalizeBuildLogs(entries);
};
