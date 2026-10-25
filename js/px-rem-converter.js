(() => {
  const DEFAULT_ROOT_SIZE = 16;
  const MIN_ROOT_SIZE = 1;
  const MAX_ROOT_SIZE = 256;
  const MAX_ABSOLUTE_VALUE = 1000000;

  const normalizePrecision = (value) => {
    if (value === 2 || value === '2') return '2';
    if (value === 4 || value === '4') return '4';
    return 'auto';
  };

  const formatNumber = (value, precision) => {
    const normalized = Object.is(value, -0) ? 0 : value;
    if (precision === '2') return normalized.toFixed(2);
    if (precision === '4') return normalized.toFixed(4);
    return String(Number(normalized.toFixed(6)));
  };

  const createResult = (result) => Object.freeze(result);

  const convert = (input = '', options = {}) => {
    const source = String(input).trim();
    const direction = options.direction === 'rem-to-px' ? 'rem-to-px' : 'px-to-rem';
    const precision = normalizePrecision(options.precision);
    const rootSource = String(options.rootSize ?? DEFAULT_ROOT_SIZE).trim();
    const rootSize = Number(rootSource);

    if (!source) {
      return createResult({
        status: 'empty', direction, precision, rootSize: Number.isFinite(rootSize) ? rootSize : null,
        inputValue: null, numericResult: null, output: '', formula: '',
      });
    }

    if (!rootSource || !Number.isFinite(rootSize) || rootSize < MIN_ROOT_SIZE || rootSize > MAX_ROOT_SIZE) {
      return createResult({
        status: 'invalid-root', direction, precision, rootSize: null,
        inputValue: null, numericResult: null, output: '', formula: '',
      });
    }

    const inputValue = Number(source);
    if (!Number.isFinite(inputValue) || Math.abs(inputValue) > MAX_ABSOLUTE_VALUE) {
      return createResult({
        status: 'invalid-value', direction, precision, rootSize,
        inputValue: null, numericResult: null, output: '', formula: '',
      });
    }

    const numericResult = direction === 'rem-to-px'
      ? inputValue * rootSize
      : inputValue / rootSize;
    const formatted = formatNumber(numericResult, precision);
    const inputUnit = direction === 'rem-to-px' ? 'rem' : 'px';
    const outputUnit = direction === 'rem-to-px' ? 'px' : 'rem';
    const operator = direction === 'rem-to-px' ? '×' : '÷';

    return createResult({
      status: 'valid', direction, precision, rootSize, inputValue, numericResult,
      output: `${formatted}${outputUnit}`,
      formula: `${source}${inputUnit} ${operator} ${rootSize}px = ${formatted}${outputUnit}`,
    });
  };

  globalThis.MarkBenchPxRemConverter = Object.freeze({
    DEFAULT_ROOT_SIZE,
    MIN_ROOT_SIZE,
    MAX_ROOT_SIZE,
    MAX_ABSOLUTE_VALUE,
    convert,
  });
})();
