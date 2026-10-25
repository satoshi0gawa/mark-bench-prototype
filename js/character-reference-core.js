(() => {
  const MAX_CODE_POINT = 0x10ffff;
  const namedEntities = Object.freeze({
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00a0',
  });

  const isSurrogate = (codePoint) => codePoint >= 0xd800 && codePoint <= 0xdfff;
  const isNoncharacter = (codePoint) => (
    (codePoint >= 0xfdd0 && codePoint <= 0xfdef)
    || (codePoint & 0xffff) === 0xfffe
    || (codePoint & 0xffff) === 0xffff
  );
  const isControl = (codePoint) => (
    (codePoint >= 0x01 && codePoint <= 0x08)
    || codePoint === 0x0b
    || (codePoint >= 0x0e && codePoint <= 0x1f)
    || (codePoint >= 0x7f && codePoint <= 0x9f)
  );
  const isWhitespace = (character) => /[\t\n\f\r ]/u.test(character);
  const formatCodePoint = (codePoint) => `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;

  const inspectCodePoint = (codePoint) => {
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > MAX_CODE_POINT) {
      return Object.freeze({ valid: false, warning: 'OUT_OF_RANGE', message: 'Unicodeの有効範囲外です。' });
    }
    if (codePoint === 0) {
      return Object.freeze({ valid: false, warning: 'NULL', message: 'NULL文字は変換せず保持しました。' });
    }
    if (isSurrogate(codePoint)) {
      return Object.freeze({ valid: false, warning: 'SURROGATE', message: 'サロゲート領域はUnicodeスカラー値ではありません。' });
    }
    if (isNoncharacter(codePoint)) {
      return Object.freeze({ valid: true, warning: 'NONCHARACTER', message: 'Unicode非文字コードポイントです。' });
    }
    if (isControl(codePoint)) {
      return Object.freeze({ valid: true, warning: 'CONTROL', message: '制御文字が含まれています。' });
    }
    return Object.freeze({ valid: true, warning: '', message: '' });
  };

  const parseNumericToken = (token) => {
    const source = String(token || '').toLowerCase();
    const format = source.startsWith('x') ? 'hex' : 'decimal';
    const digits = format === 'hex' ? source.slice(1) : source;
    if (!digits || !(format === 'hex' ? /^[0-9a-f]+$/u : /^\d+$/u).test(digits)) return null;
    const codePoint = Number.parseInt(digits, format === 'hex' ? 16 : 10);
    return Object.freeze({ codePoint, format });
  };

  const decodeNumericReferences = (value = '') => {
    const source = String(value);
    const warnings = [];
    let replacements = 0;
    let decimalCount = 0;
    let hexCount = 0;
    const output = source.replace(/&#([^;\s]{1,64});/giu, (reference, token, offset) => {
      const parsed = parseNumericToken(token);
      if (!parsed) {
        warnings.push(Object.freeze({
          type: 'MALFORMED',
          index: offset,
          reference,
          codePoint: '—',
          message: '10進または16進の数値文字参照として解釈できません。',
        }));
        return reference;
      }
      const inspection = inspectCodePoint(parsed.codePoint);
      if (!inspection.valid || inspection.warning) {
        warnings.push(Object.freeze({
          type: inspection.warning || 'INVALID',
          index: offset,
          reference,
          codePoint: formatCodePoint(parsed.codePoint),
          message: inspection.message,
        }));
      }
      if (!inspection.valid) return reference;
      replacements += 1;
      if (parsed.format === 'hex') hexCount += 1;
      else decimalCount += 1;
      return String.fromCodePoint(parsed.codePoint);
    });
    return Object.freeze({ output, replacements, decimalCount, hexCount, warnings: Object.freeze(warnings) });
  };

  const decodeHtmlReferences = (value = '') => {
    const source = String(value);
    const numeric = decodeNumericReferences(source);
    let namedCount = 0;
    const output = numeric.output.replace(/&(amp|lt|gt|quot|apos|nbsp);/giu, (reference, name) => {
      const decoded = namedEntities[String(name).toLowerCase()];
      if (decoded === undefined) return reference;
      namedCount += 1;
      return decoded;
    });
    return Object.freeze({
      output,
      replacements: numeric.replacements + namedCount,
      namedCount,
      decimalCount: numeric.decimalCount,
      hexCount: numeric.hexCount,
      warnings: numeric.warnings,
    });
  };

  const encodeNumericReferences = (value = '', options = {}) => {
    const source = String(value);
    const format = options.format === 'hex' ? 'hex' : 'decimal';
    const scope = options.scope === 'all' ? 'all' : 'non-ascii';
    const preserveWhitespace = options.preserveWhitespace !== false;
    const warnings = [];
    let replacements = 0;
    let output = '';
    let utf16Offset = 0;

    for (const character of source) {
      const codePoint = character.codePointAt(0);
      const inspection = inspectCodePoint(codePoint);
      if (!inspection.valid || inspection.warning) {
        warnings.push(Object.freeze({
          type: inspection.warning || 'INVALID',
          index: utf16Offset,
          reference: character,
          codePoint: formatCodePoint(codePoint),
          message: inspection.message,
        }));
      }
      const shouldEncode = inspection.valid
        && !(preserveWhitespace && isWhitespace(character))
        && (scope === 'all' || codePoint > 0x7f);
      if (shouldEncode) {
        const digits = format === 'hex' ? codePoint.toString(16).toUpperCase() : String(codePoint);
        output += format === 'hex' ? `&#x${digits};` : `&#${digits};`;
        replacements += 1;
      } else {
        output += character;
      }
      utf16Offset += character.length;
    }

    return Object.freeze({ output, replacements, warnings: Object.freeze(warnings) });
  };

  globalThis.MarkBenchCharacterReferenceCore = Object.freeze({
    MAX_CODE_POINT,
    namedEntities,
    inspectCodePoint,
    parseNumericToken,
    decodeNumericReferences,
    decodeHtmlReferences,
    encodeNumericReferences,
    formatCodePoint,
  });
})();
