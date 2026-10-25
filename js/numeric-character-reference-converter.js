(() => {
  const MAX_INPUT_LENGTH = 100000;
  const core = globalThis.MarkBenchCharacterReferenceCore;

  const countCodePoints = (value = '') => [...String(value)].length;
  const normalizeOptions = (mode = 'encode', options = {}) => Object.freeze({
    mode: mode === 'decode' ? 'decode' : 'encode',
    format: options.format === 'hex' ? 'hex' : 'decimal',
    scope: options.scope === 'all' ? 'all' : 'non-ascii',
    preserveWhitespace: options.preserveWhitespace !== false,
  });

  const convert = (input = '', mode = 'encode', options = {}) => {
    const source = String(input);
    const settings = normalizeOptions(mode, options);
    if (!source) {
      return Object.freeze({
        status: 'empty',
        ...settings,
        output: '',
        replacements: 0,
        decimalCount: 0,
        hexCount: 0,
        warningCount: 0,
        warnings: Object.freeze([]),
        inputLength: 0,
        inputCodePoints: 0,
        outputLength: 0,
        outputCodePoints: 0,
      });
    }

    if (!core) {
      return Object.freeze({
        status: 'unavailable',
        ...settings,
        output: source,
        replacements: 0,
        decimalCount: 0,
        hexCount: 0,
        warningCount: 1,
        warnings: Object.freeze([{ type: 'MODULE', index: 0, reference: '', codePoint: '—', message: '変換モジュールを読み込めませんでした。' }]),
        inputLength: source.length,
        inputCodePoints: countCodePoints(source),
        outputLength: source.length,
        outputCodePoints: countCodePoints(source),
      });
    }

    const result = settings.mode === 'decode'
      ? core.decodeNumericReferences(source)
      : core.encodeNumericReferences(source, settings);
    const decimalCount = settings.mode === 'encode' && settings.format === 'decimal' ? result.replacements : result.decimalCount || 0;
    const hexCount = settings.mode === 'encode' && settings.format === 'hex' ? result.replacements : result.hexCount || 0;
    const warningCount = result.warnings.length;
    const status = warningCount ? 'warning' : result.replacements ? 'converted' : 'no-match';

    return Object.freeze({
      status,
      ...settings,
      output: result.output,
      replacements: result.replacements,
      decimalCount,
      hexCount,
      warningCount,
      warnings: result.warnings,
      inputLength: source.length,
      inputCodePoints: countCodePoints(source),
      outputLength: result.output.length,
      outputCodePoints: countCodePoints(result.output),
    });
  };

  globalThis.MarkBenchNumericCharacterReferenceConverter = Object.freeze({
    MAX_INPUT_LENGTH,
    normalizeOptions,
    countCodePoints,
    convert,
  });
})();
