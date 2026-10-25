(() => {
  const MAX_INPUT_LENGTH = 100000;

  const resolveIndent = (indent) => {
    if (indent === 'tab' || indent === '\t') return '\t';
    return Number(indent) === 4 ? 4 : 2;
  };

  const getRootSummary = (value) => {
    if (Array.isArray(value)) return `ARRAY / ${value.length} ITEMS`;
    if (value === null) return 'NULL';
    if (typeof value === 'object') return `OBJECT / ${Object.keys(value).length} KEYS`;
    return String(typeof value).toUpperCase();
  };

  const getErrorLocation = (source, error) => {
    const message = error instanceof Error ? error.message : String(error);
    const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/iu);
    if (lineColumnMatch) {
      return { message, line: Number(lineColumnMatch[1]), column: Number(lineColumnMatch[2]) };
    }

    const positionMatch = message.match(/position\s+(\d+)/iu);
    if (!positionMatch) return { message, line: null, column: null };

    const position = Number(positionMatch[1]);
    const lines = source.slice(0, position).split(/\r\n|\r|\n/u);
    return { message, line: lines.length, column: lines.at(-1).length + 1 };
  };

  const format = (input = '', options = {}) => {
    const source = String(input);
    if (!source.trim()) {
      return Object.freeze({
        status: 'empty',
        output: '',
        error: null,
        inputLength: source.length,
        outputLength: 0,
        summary: 'OUTPUT EMPTY',
      });
    }

    try {
      const parsed = JSON.parse(source);
      const mode = options.mode === 'minify' ? 'minify' : 'pretty';
      const output = JSON.stringify(parsed, null, mode === 'minify' ? 0 : resolveIndent(options.indent));
      return Object.freeze({
        status: 'valid',
        output,
        error: null,
        inputLength: source.length,
        outputLength: output.length,
        summary: getRootSummary(parsed),
      });
    } catch (error) {
      return Object.freeze({
        status: 'invalid',
        output: '',
        error: Object.freeze(getErrorLocation(source, error)),
        inputLength: source.length,
        outputLength: 0,
        summary: 'INVALID JSON',
      });
    }
  };

  globalThis.MarkBenchJsonFormatter = Object.freeze({
    MAX_INPUT_LENGTH,
    format,
  });
})();
