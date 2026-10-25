(() => {
  const MAX_INPUT_LENGTH = 100000;
  const core = globalThis.MarkBenchCharacterReferenceCore;
  const escapeMap = Object.freeze({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '\u00a0': '&nbsp;',
  });

  const normalizeOptions = (options = {}) => Object.freeze({
    context: options.context === 'text' ? 'text' : 'attribute',
    encodeNbsp: options.encodeNbsp !== false,
  });

  const escape = (value, options = {}) => {
    const settings = normalizeOptions(options);
    const pattern = settings.context === 'text'
      ? settings.encodeNbsp ? /[&<>\u00a0]/gu : /[&<>]/gu
      : settings.encodeNbsp ? /[&<>"'\u00a0]/gu : /[&<>"']/gu;
    let replacements = 0;
    const output = value.replace(pattern, (character) => {
      replacements += 1;
      return escapeMap[character];
    });
    return { output, replacements, warnings: Object.freeze([]) };
  };

  const unescape = (value) => {
    if (!core) return { output: value, replacements: 0, warnings: Object.freeze([]) };
    return core.decodeHtmlReferences(value);
  };

  const convert = (input = '', mode = 'escape', options = {}) => {
    const source = String(input);
    const direction = mode === 'unescape' ? 'unescape' : 'escape';
    const settings = normalizeOptions(options);
    if (!source) {
      return Object.freeze({
        status: 'empty',
        mode: direction,
        ...settings,
        output: '',
        replacements: 0,
        warningCount: 0,
        warnings: Object.freeze([]),
        inputLength: 0,
        outputLength: 0,
      });
    }

    const result = direction === 'unescape' ? unescape(source) : escape(source, settings);
    const warningCount = result.warnings?.length || 0;
    return Object.freeze({
      status: warningCount ? 'warning' : result.replacements ? 'converted' : 'no-match',
      mode: direction,
      ...settings,
      output: result.output,
      replacements: result.replacements,
      warningCount,
      warnings: result.warnings || Object.freeze([]),
      inputLength: source.length,
      outputLength: result.output.length,
    });
  };

  globalThis.MarkBenchHtmlEscapeConverter = Object.freeze({
    MAX_INPUT_LENGTH,
    normalizeOptions,
    convert,
  });
})();
