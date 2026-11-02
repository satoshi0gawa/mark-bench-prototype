import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p',
  'strong',
  'em',
  'u',
  's',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'br',
  'hr',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'caption',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'figure',
  'figcaption',
  'img',
  'div',
  'span',
];

const normalizeAnchor = (_tagName, attributes) => {
  const normalized = { ...attributes };
  if (normalized.target === '_blank') {
    normalized.rel = 'noopener noreferrer';
  } else {
    delete normalized.target;
    delete normalized.rel;
  }
  return { tagName: 'a', attribs: normalized };
};

const normalizeImage = (_tagName, attributes) => ({
  tagName: 'img',
  attribs: {
    ...attributes,
    alt: attributes.alt || '',
    loading: 'lazy',
    decoding: 'async',
  },
});

export const sanitizeRichText = (html) =>
  sanitizeHtml(String(html ?? ''), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      code: ['class'],
      div: ['data-filename'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
      span: ['class'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
    },
    allowedClasses: {
      code: [/^language-[a-z0-9-]+$/],
      span: ['marker-yellow', 'marker-blue'],
    },
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: {
      a: ['http', 'https'],
      img: ['https'],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: normalizeAnchor,
      img: normalizeImage,
    },
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  }).trim();
