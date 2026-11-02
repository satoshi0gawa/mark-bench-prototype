import { sanitizeRichText } from './sanitize-rich-text.mjs';

export const BLOG_ENDPOINT = 'blog';
export const BLOG_OUTPUT_DIRECTORY = 'build-notes/note-to-self';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOOL_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WEB_PART_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const requireText = (value, field, context) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`${context}: ${field} is required`);
  return normalized;
};

const optionalText = (value) => String(value ?? '').trim();

const normalizeDate = (value, field, context) => {
  const date = new Date(requireText(value, field, context));
  if (Number.isNaN(date.getTime())) throw new Error(`${context}: ${field} must be a valid date`);
  return date.toISOString();
};

const validateRichText = (value, field, context) => {
  const html = requireText(value, field, context);
  if (/<\/?(?:h1|h2|script|style|iframe|object|embed|form)\b/i.test(html)) {
    throw new Error(`${context}: ${field} contains a disallowed element`);
  }
  if (/\son[a-z]+\s*=/i.test(html) || /(?:href|src)\s*=\s*["']\s*(?:javascript|data):/i.test(html)) {
    throw new Error(`${context}: ${field} contains a dangerous attribute or URL`);
  }
  const sanitized = sanitizeRichText(html);
  if (!sanitized) throw new Error(`${context}: ${field} is empty after sanitization`);
  return sanitized;
};

const validateFieldId = (value, expected, context) => {
  if (value && value !== expected) throw new Error(`${context}: fieldId must be ${expected}`);
};

const normalizeSection = (section, index, context) => {
  const sectionContext = `${context} section ${index + 1}`;
  validateFieldId(section?.fieldId, 'articleSection', sectionContext);
  const calloutLabel = optionalText(section?.calloutLabel);
  const calloutBody = optionalText(section?.calloutBody)
    ? validateRichText(section.calloutBody, 'calloutBody', sectionContext)
    : '';
  if (Boolean(calloutLabel) !== Boolean(calloutBody)) {
    throw new Error(`${sectionContext}: calloutLabel and calloutBody must be supplied together`);
  }

  return {
    id: `section-${index + 1}`,
    number: String(index + 1).padStart(2, '0'),
    label: optionalText(section?.label),
    heading: requireText(section?.heading, 'heading', sectionContext),
    body: validateRichText(section?.body, 'body', sectionContext),
    calloutLabel,
    calloutBody,
  };
};

const normalizeReferences = (references, context) => {
  if (references == null) return [];
  if (!Array.isArray(references)) throw new Error(`${context}: references must be an array`);

  const normalized = references.map((reference, index) => {
    const referenceContext = `${context} reference ${index + 1}`;
    validateFieldId(reference?.fieldId, 'referenceLink', referenceContext);
    const rawUrl = requireText(reference?.url, 'url', referenceContext);
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new Error(`${referenceContext}: url must be valid`);
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`${referenceContext}: url must use HTTP or HTTPS`);
    }
    return {
      label: requireText(reference?.label, 'label', referenceContext),
      url: url.toString(),
    };
  });

  const urls = normalized.map((reference) => reference.url);
  if (new Set(urls).size !== urls.length) throw new Error(`${context}: reference URLs must be unique`);
  return normalized;
};

const normalizeRelatedTool = (relatedTool, context) => {
  if (!relatedTool) return null;
  validateFieldId(relatedTool.fieldId, 'relatedTool', `${context} relatedTool`);
  const toolId = optionalText(relatedTool.toolId);
  const label = optionalText(relatedTool.label);
  const description = optionalText(relatedTool.description);
  if (![toolId, label, description].some(Boolean)) return null;
  if (![toolId, label, description].every(Boolean)) {
    throw new Error(`${context} relatedTool: toolId, label, and description must be supplied together`);
  }
  if (!TOOL_ID_PATTERN.test(toolId)) {
    throw new Error(`${context} relatedTool: toolId must use lowercase letters, numbers, and hyphens`);
  }
  return {
    toolId,
    label,
    description,
  };
};

const normalizeRelatedWebPart = (relatedWebPart, context) => {
  if (!relatedWebPart) return null;
  validateFieldId(relatedWebPart.fieldId, 'relatedWebPart', `${context} relatedWebPart`);
  const partId = optionalText(relatedWebPart.partId);
  const label = optionalText(relatedWebPart.label);
  const description = optionalText(relatedWebPart.description);
  if (![partId, label, description].some(Boolean)) return null;
  if (![partId, label, description].every(Boolean)) {
    throw new Error(`${context} relatedWebPart: partId, label, and description must be supplied together`);
  }
  if (!WEB_PART_ID_PATTERN.test(partId)) {
    throw new Error(`${context} relatedWebPart: partId must use lowercase letters, numbers, and hyphens`);
  }
  return {
    partId,
    label,
    description,
  };
};

const normalizeSeo = (seo, context) => {
  if (!seo || Object.keys(seo).every((key) => key === 'fieldId')) return null;
  validateFieldId(seo.fieldId, 'seoSettings', `${context} seo`);
  let ogImage = null;
  if (seo.ogImage?.url) {
    let url;
    try {
      url = new URL(seo.ogImage.url);
    } catch {
      throw new Error(`${context} seo: ogImage URL must be valid`);
    }
    if (url.protocol !== 'https:') throw new Error(`${context} seo: ogImage must use HTTPS`);
    ogImage = {
      url: url.toString(),
      width: Number(seo.ogImage.width) || null,
      height: Number(seo.ogImage.height) || null,
    };
  }
  return {
    title: optionalText(seo.seoTitle),
    description: optionalText(seo.seoDescription),
    ogImage,
  };
};

const normalizeEntry = (entry, index) => {
  const context = `blog entry ${entry?.id || index + 1}`;
  const slug = requireText(entry?.slug, 'slug', context);
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`${context}: slug must use lowercase letters, numbers, and hyphens`);
  }

  if (!Array.isArray(entry?.sections) || entry.sections.length === 0) {
    throw new Error(`${context}: sections must contain at least one item`);
  }

  const sections = entry.sections.map((section, sectionIndex) => normalizeSection(section, sectionIndex, context));
  const seo = normalizeSeo(entry.seo, context);
  const relatedTool = normalizeRelatedTool(entry.relatedTool, context);
  const relatedWebPart = normalizeRelatedWebPart(entry.relatedWebPart, context);
  if (relatedTool && relatedWebPart) {
    throw new Error(`${context}: relatedTool and relatedWebPart cannot be supplied together`);
  }

  return {
    id: requireText(entry?.id, 'id', context),
    title: requireText(entry?.title, 'title', context),
    slug,
    themeLabel: requireText(entry?.themeLabel, 'themeLabel', context),
    summary: requireText(entry?.summary, 'summary', context),
    category: requireText(entry?.category, 'category', context),
    createdAt: normalizeDate(entry?.createdAt, 'createdAt', context),
    updatedAt: normalizeDate(entry?.updatedAt, 'updatedAt', context),
    publishedAt: normalizeDate(entry?.publishedAt, 'publishedAt', context),
    revisedAt: normalizeDate(entry?.revisedAt, 'revisedAt', context),
    sections,
    references: normalizeReferences(entry.references, context),
    relatedTool,
    relatedWebPart,
    seo: {
      title: seo?.title || requireText(entry?.title, 'title', context),
      description: seo?.description || requireText(entry?.summary, 'summary', context),
      ogImage: seo?.ogImage || null,
    },
    outputPath: `${BLOG_OUTPUT_DIRECTORY}/${slug}.html`,
  };
};

export const normalizeBlogEntries = (entries) => {
  if (!Array.isArray(entries)) throw new Error('Blog source must be an array');
  const normalized = entries.map(normalizeEntry);

  for (const field of ['id', 'slug']) {
    const values = normalized.map((entry) => entry[field]);
    if (new Set(values).size !== values.length) throw new Error(`Blog ${field} values must be unique`);
  }

  return normalized.sort((left, right) => {
    const dateDifference = new Date(right.publishedAt) - new Date(left.publishedAt);
    return dateDifference || left.id.localeCompare(right.id, 'en');
  });
};
