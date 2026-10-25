(() => {
  const MAX_INPUT_LENGTH = 100000;
  const MAX_RESULTS = 300;
  const encoder = new TextEncoder();
  const blockRanges = globalThis.MarkBenchUnicodeBlocks || [];

  const categoryDefinitions = [
    ['Cc', 'Control', 'Cc'],
    ['Cf', 'Format', 'Cf'],
    ['Cn', 'Unassigned', 'Cn'],
    ['Co', 'Private Use', 'Co'],
    ['Cs', 'Surrogate', 'Cs'],
    ['Ll', 'Lowercase Letter', 'Ll'],
    ['Lm', 'Modifier Letter', 'Lm'],
    ['Lo', 'Other Letter', 'Lo'],
    ['Lt', 'Titlecase Letter', 'Lt'],
    ['Lu', 'Uppercase Letter', 'Lu'],
    ['Mc', 'Spacing Mark', 'Mc'],
    ['Me', 'Enclosing Mark', 'Me'],
    ['Mn', 'Nonspacing Mark', 'Mn'],
    ['Nd', 'Decimal Number', 'Nd'],
    ['Nl', 'Letter Number', 'Nl'],
    ['No', 'Other Number', 'No'],
    ['Pc', 'Connector Punctuation', 'Pc'],
    ['Pd', 'Dash Punctuation', 'Pd'],
    ['Pe', 'Close Punctuation', 'Pe'],
    ['Pf', 'Final Punctuation', 'Pf'],
    ['Pi', 'Initial Punctuation', 'Pi'],
    ['Po', 'Other Punctuation', 'Po'],
    ['Ps', 'Open Punctuation', 'Ps'],
    ['Sc', 'Currency Symbol', 'Sc'],
    ['Sk', 'Modifier Symbol', 'Sk'],
    ['Sm', 'Math Symbol', 'Sm'],
    ['So', 'Other Symbol', 'So'],
    ['Zl', 'Line Separator', 'Zl'],
    ['Zp', 'Paragraph Separator', 'Zp'],
    ['Zs', 'Space Separator', 'Zs'],
  ].map(([code, label, property]) => Object.freeze({
    code,
    label,
    pattern: new RegExp(`^\\p{${property}}$`, 'u'),
  }));

  const specialCharacters = new Map([
    [0x0000, ['NUL', 'control', true]],
    [0x0008, ['BACKSPACE', 'control', true]],
    [0x0009, ['TAB', 'whitespace', false]],
    [0x000A, ['LF', 'whitespace', false]],
    [0x000B, ['VERTICAL TAB', 'control', true]],
    [0x000C, ['FORM FEED', 'control', true]],
    [0x000D, ['CR', 'whitespace', false]],
    [0x001B, ['ESC', 'control', true]],
    [0x0020, ['SPACE', 'whitespace', false]],
    [0x007F, ['DELETE', 'control', true]],
    [0x0085, ['NEXT LINE', 'control', true]],
    [0x00A0, ['NBSP', 'whitespace', true]],
    [0x00AD, ['SOFT HYPHEN', 'format', true]],
    [0x034F, ['COMBINING GRAPHEME JOINER', 'combining', true]],
    [0x061C, ['ARABIC LETTER MARK', 'bidi', true]],
    [0x1680, ['OGHAM SPACE MARK', 'whitespace', true]],
    [0x180E, ['MONGOLIAN VOWEL SEPARATOR', 'zero-width', true]],
    [0x2000, ['EN QUAD', 'whitespace', true]],
    [0x2001, ['EM QUAD', 'whitespace', true]],
    [0x2002, ['EN SPACE', 'whitespace', true]],
    [0x2003, ['EM SPACE', 'whitespace', true]],
    [0x2004, ['THREE-PER-EM SPACE', 'whitespace', true]],
    [0x2005, ['FOUR-PER-EM SPACE', 'whitespace', true]],
    [0x2006, ['SIX-PER-EM SPACE', 'whitespace', true]],
    [0x2007, ['FIGURE SPACE', 'whitespace', true]],
    [0x2008, ['PUNCTUATION SPACE', 'whitespace', true]],
    [0x2009, ['THIN SPACE', 'whitespace', true]],
    [0x200A, ['HAIR SPACE', 'whitespace', true]],
    [0x200B, ['ZWSP', 'zero-width', true]],
    [0x200C, ['ZWNJ', 'zero-width', true]],
    [0x200D, ['ZWJ', 'zero-width', true]],
    [0x200E, ['LEFT-TO-RIGHT MARK', 'bidi', true]],
    [0x200F, ['RIGHT-TO-LEFT MARK', 'bidi', true]],
    [0x2028, ['LINE SEPARATOR', 'whitespace', true]],
    [0x2029, ['PARAGRAPH SEPARATOR', 'whitespace', true]],
    [0x202A, ['LEFT-TO-RIGHT EMBEDDING', 'bidi', true]],
    [0x202B, ['RIGHT-TO-LEFT EMBEDDING', 'bidi', true]],
    [0x202C, ['POP DIRECTIONAL FORMATTING', 'bidi', true]],
    [0x202D, ['LEFT-TO-RIGHT OVERRIDE', 'bidi', true]],
    [0x202E, ['RIGHT-TO-LEFT OVERRIDE', 'bidi', true]],
    [0x202F, ['NARROW NBSP', 'whitespace', true]],
    [0x205F, ['MEDIUM MATHEMATICAL SPACE', 'whitespace', true]],
    [0x2060, ['WORD JOINER', 'zero-width', true]],
    [0x2061, ['FUNCTION APPLICATION', 'format', true]],
    [0x2062, ['INVISIBLE TIMES', 'format', true]],
    [0x2063, ['INVISIBLE SEPARATOR', 'format', true]],
    [0x2064, ['INVISIBLE PLUS', 'format', true]],
    [0x2066, ['LEFT-TO-RIGHT ISOLATE', 'bidi', true]],
    [0x2067, ['RIGHT-TO-LEFT ISOLATE', 'bidi', true]],
    [0x2068, ['FIRST STRONG ISOLATE', 'bidi', true]],
    [0x2069, ['POP DIRECTIONAL ISOLATE', 'bidi', true]],
    [0x3000, ['IDEOGRAPHIC SPACE', 'whitespace', true]],
    [0xFEFF, ['BOM / ZWNBSP', 'zero-width', true]],
  ]);

  const findBlock = (codePoint) => {
    let low = 0;
    let high = blockRanges.length - 1;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      const [start, end, name] = blockRanges[middle];
      if (codePoint < start) high = middle - 1;
      else if (codePoint > end) low = middle + 1;
      else return name;
    }
    return 'No Block';
  };

  const getCategory = (character) => {
    const category = categoryDefinitions.find(({ pattern }) => pattern.test(character));
    return category
      ? Object.freeze({ code: category.code, label: category.label })
      : Object.freeze({ code: 'Cn', label: 'Unassigned' });
  };

  const getSpecialInfo = (character, codePoint, category) => {
    const known = specialCharacters.get(codePoint);
    if (known) return Object.freeze({ label: known[0], kind: known[1], suspicious: known[2] });
    if (codePoint >= 0xFE00 && codePoint <= 0xFE0F) {
      return Object.freeze({ label: `VS${codePoint - 0xFE00 + 1}`, kind: 'variation', suspicious: true });
    }
    if (codePoint >= 0xE0100 && codePoint <= 0xE01EF) {
      return Object.freeze({ label: `VS${codePoint - 0xE0100 + 17}`, kind: 'variation', suspicious: true });
    }
    if (codePoint >= 0xE0000 && codePoint <= 0xE007F) {
      return Object.freeze({ label: codePoint === 0xE007F ? 'CANCEL TAG' : 'TAG CHARACTER', kind: 'tag', suspicious: true });
    }
    if (category.code.startsWith('M')) {
      return Object.freeze({ label: 'COMBINING MARK', kind: 'combining', suspicious: true });
    }
    if (category.code === 'Cc') {
      return Object.freeze({ label: 'CONTROL', kind: 'control', suspicious: true });
    }
    if (category.code === 'Cf') {
      return Object.freeze({ label: 'FORMAT', kind: 'format', suspicious: true });
    }
    if (category.code.startsWith('Z')) {
      return Object.freeze({ label: 'SEPARATOR', kind: 'whitespace', suspicious: true });
    }
    return null;
  };

  const toCodePointLabel = (codePoint) => `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
  const toHexUnits = (values) => values.map((value) => value.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  const toUtf16Units = (character) => Array.from({ length: character.length }, (_, index) => character.charCodeAt(index).toString(16).toUpperCase().padStart(4, '0')).join(' ');
  const toDisplay = (character, special) => {
    if (!special) return character;
    if (special.kind === 'combining') return `◌${character}`;
    return special.label;
  };

  const inspectCharacter = (character, index, line, column) => {
    const codePoint = character.codePointAt(0);
    const codePointLabel = toCodePointLabel(codePoint);
    const category = getCategory(character);
    const special = getSpecialInfo(character, codePoint, category);
    const hex = codePoint.toString(16).toUpperCase();
    return Object.freeze({
      index,
      line,
      column,
      character,
      display: toDisplay(character, special),
      codePoint,
      codePointLabel,
      decimal: codePoint,
      categoryCode: category.code,
      category: category.label,
      block: findBlock(codePoint),
      utf8: toHexUnits([...encoder.encode(character)]),
      utf16: toUtf16Units(character),
      htmlEscape: `&#x${hex};`,
      cssEscape: `\\${hex} `,
      javascriptEscape: codePoint <= 0xFFFF ? `\\u${hex.padStart(4, '0')}` : `\\u{${hex}}`,
      isInvisible: Boolean(special),
      isSuspicious: Boolean(special?.suspicious),
      flag: special?.label || '',
      kind: special?.kind || '',
    });
  };

  const countGraphemes = (value) => {
    if (!value) return 0;
    if (typeof Intl.Segmenter === 'function') {
      return [...new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(value)].length;
    }
    return [...value].length;
  };

  const analyze = (input = '') => {
    const rawValue = String(input);
    const value = rawValue.slice(0, MAX_INPUT_LENGTH);
    const characters = [...value];
    const items = [];
    const invisibleItems = [];
    let invisibleCount = 0;
    let suspiciousCount = 0;
    let line = 1;
    let column = 1;

    characters.forEach((character, offset) => {
      const item = inspectCharacter(character, offset + 1, line, column);
      if (items.length < MAX_RESULTS) items.push(item);
      if (item.isInvisible) {
        invisibleCount += 1;
        if (invisibleItems.length < MAX_RESULTS) invisibleItems.push(item);
      }
      if (item.isSuspicious) suspiciousCount += 1;

      const codePoint = item.codePoint;
      const nextCodePoint = characters[offset + 1]?.codePointAt(0);
      if (codePoint === 0x0D) {
        if (nextCodePoint === 0x0A) column += 1;
        else {
          line += 1;
          column = 1;
        }
      } else if (codePoint === 0x0A || codePoint === 0x2028 || codePoint === 0x2029) {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
    });

    return Object.freeze({
      value,
      inputLength: rawValue.length,
      inputTruncated: rawValue.length > value.length,
      codePoints: characters.length,
      graphemes: countGraphemes(value),
      utf16Units: value.length,
      utf8Bytes: encoder.encode(value).length,
      invisibleCount,
      suspiciousCount,
      displayedCount: items.length,
      invisibleDisplayedCount: invisibleItems.length,
      resultsTruncated: characters.length > items.length,
      invisibleResultsTruncated: invisibleCount > invisibleItems.length,
      items: Object.freeze(items),
      invisibleItems: Object.freeze(invisibleItems),
    });
  };

  const formatReport = (analysis) => {
    const header = [
      'MARK BENCH / UNICODE INSPECTOR',
      `CODE POINTS\t${analysis.codePoints}`,
      `GRAPHEMES\t${analysis.graphemes}`,
      `UTF-16 UNITS\t${analysis.utf16Units}`,
      `UTF-8 BYTES\t${analysis.utf8Bytes}`,
      `INVISIBLE / SPECIAL\t${analysis.invisibleCount}`,
      '',
      'INDEX\tLINE\tCOLUMN\tDISPLAY\tCODE POINT\tDECIMAL\tCATEGORY\tBLOCK\tUTF-8\tUTF-16\tHTML\tCSS\tJAVASCRIPT\tFLAG',
    ];
    const rows = analysis.items.map((item) => [
      item.index,
      item.line,
      item.column,
      item.isInvisible ? `[${item.display}]` : item.display,
      item.codePointLabel,
      item.decimal,
      `${item.categoryCode} ${item.category}`,
      item.block,
      item.utf8,
      item.utf16,
      item.htmlEscape,
      item.cssEscape,
      item.javascriptEscape,
      item.flag || '—',
    ].join('\t'));
    if (analysis.resultsTruncated) rows.push(`… FIRST ${analysis.displayedCount} OF ${analysis.codePoints} CODE POINTS`);
    return [...header, ...rows].join('\n');
  };

  globalThis.MarkBenchUnicodeInspector = Object.freeze({
    MAX_INPUT_LENGTH,
    MAX_RESULTS,
    analyze,
    formatReport,
  });
})();
