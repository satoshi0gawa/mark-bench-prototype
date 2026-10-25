(() => {
  const MAX_INPUT_LENGTH = 100000;
  const graphemeSegmenter = typeof Intl?.Segmenter === 'function'
    ? new Intl.Segmenter('ja', { granularity: 'grapheme' })
    : null;
  const wordSegmenter = typeof Intl?.Segmenter === 'function'
    ? new Intl.Segmenter('ja', { granularity: 'word' })
    : null;

  const metricDefinitions = Object.freeze([
    ['characters', 'CHARACTERS'],
    ['charactersNoWhitespace', 'NO SPACES'],
    ['words', 'WORDS'],
    ['lines', 'LINES'],
    ['bytes', 'UTF-8 BYTES'],
    ['paragraphs', 'PARAGRAPHS'],
  ]);

  const countGraphemes = (value) => graphemeSegmenter
    ? [...graphemeSegmenter.segment(value)].length
    : [...value].length;

  const countWords = (value) => {
    if (!value.trim()) return 0;
    if (wordSegmenter) {
      return [...wordSegmenter.segment(value)].filter((segment) => segment.isWordLike).length;
    }
    return value.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  };

  const countParagraphs = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    return trimmed
      .split(/\r?\n(?:[^\S\r\n]*\r?\n)+/u)
      .filter((paragraph) => paragraph.trim()).length;
  };

  const countBytes = (value) => typeof TextEncoder === 'function'
    ? new TextEncoder().encode(value).length
    : new Blob([value]).size;

  const analyze = (input = '') => {
    const value = String(input);
    return Object.freeze({
      characters: countGraphemes(value),
      charactersNoWhitespace: countGraphemes(value.replace(/\s/gu, '')),
      words: countWords(value),
      lines: value ? value.split(/\r\n|\r|\n/u).length : 0,
      bytes: countBytes(value),
      paragraphs: countParagraphs(value),
      inputLength: value.length,
    });
  };

  const getMetricEntries = (metrics) => metricDefinitions.map(([key, label]) => ({
    key,
    label,
    value: metrics[key],
  }));

  const formatSummary = (metrics) => [
    'MARK BENCH / CHARACTER COUNTER',
    ...getMetricEntries(metrics).map(({ label, value }) => `${label}: ${value}`),
  ].join('\n');

  globalThis.MarkBenchCharacterCounter = Object.freeze({
    MAX_INPUT_LENGTH,
    analyze,
    formatSummary,
    getMetricEntries,
  });
})();
