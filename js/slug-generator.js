(() => {
  const MAX_INPUT_LENGTH = 200;
  const MAX_SLUG_LENGTH = 80;
  const graphemeSegmenter = typeof Intl?.Segmenter === 'function'
    ? new Intl.Segmenter('ja', { granularity: 'grapheme' })
    : null;

  const splitGraphemes = (value) => graphemeSegmenter
    ? [...graphemeSegmenter.segment(value)].map((segment) => segment.segment)
    : [...value];

  const trimSeparator = (value, separator) => separator === '_'
    ? value.replace(/^_+|_+$/gu, '')
    : value.replace(/^-+|-+$/gu, '');

  const generate = (input = '', options = {}) => {
    const value = String(input);
    const separator = options.separator === '_' ? '_' : '-';
    const lowercase = options.lowercase !== false;
    let slug = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/gu, '')
      .normalize('NFC')
      .replace(/['’]/gu, '')
      .replace(/[^\p{L}\p{N}]+/gu, separator);

    slug = separator === '_'
      ? slug.replace(/_+/gu, '_')
      : slug.replace(/-+/gu, '-');
    slug = trimSeparator(slug, separator);
    if (lowercase) slug = slug.toLocaleLowerCase('en-US');

    const segments = splitGraphemes(slug);
    const truncated = segments.length > MAX_SLUG_LENGTH;
    if (truncated) {
      slug = trimSeparator(segments.slice(0, MAX_SLUG_LENGTH).join(''), separator);
    }

    return Object.freeze({
      slug,
      encoded: slug ? encodeURIComponent(slug) : '',
      length: splitGraphemes(slug).length,
      inputLength: value.length,
      truncated,
    });
  };

  const getResultEntries = (result) => [
    { key: 'slug', label: 'SLUG', value: result.slug },
    { key: 'encoded', label: 'URL ENCODED', value: result.encoded },
  ];

  globalThis.MarkBenchSlugGenerator = Object.freeze({
    MAX_INPUT_LENGTH,
    MAX_SLUG_LENGTH,
    generate,
    getResultEntries,
  });
})();
