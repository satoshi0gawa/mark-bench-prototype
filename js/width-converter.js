(() => {
  const MAX_INPUT_LENGTH = 100000;
  const MAX_HIGHLIGHT_MATCHES = 2000;

  const CATEGORY_ORDER = Object.freeze([
    'latin',
    'digits',
    'katakana',
    'ascii-symbols',
    'japanese-symbols',
    'space',
  ]);

  const CATEGORY_DEFINITIONS = Object.freeze({
    latin: Object.freeze({ label: '英字', shortLabel: 'LATIN' }),
    digits: Object.freeze({ label: '数字', shortLabel: 'DIGITS' }),
    katakana: Object.freeze({ label: 'カタカナ', shortLabel: 'KATAKANA' }),
    'ascii-symbols': Object.freeze({ label: 'ASCII記号', shortLabel: 'ASCII SYMBOLS' }),
    'japanese-symbols': Object.freeze({ label: '日本語・幅記号', shortLabel: 'JP / WIDTH SYMBOLS' }),
    space: Object.freeze({ label: '空白', shortLabel: 'SPACE' }),
    custom: Object.freeze({ label: '指定記号', shortLabel: 'CUSTOM' }),
  });

  const BATCH_TARGETS = Object.freeze([...CATEGORY_ORDER]);
  const CHECK_TARGETS = Object.freeze(['latin', 'digits', 'ascii-symbols', 'japanese-symbols', 'space']);
  const CHECK_DEFAULTS = Object.freeze(['latin', 'digits', 'ascii-symbols', 'space']);
  const ACTIONS = Object.freeze(['to-full', 'to-half', 'keep']);

  const DEFAULT_RULES = Object.freeze({
    latin: 'to-half',
    digits: 'to-half',
    katakana: 'to-full',
    'ascii-symbols': 'to-half',
    'japanese-symbols': 'to-full',
    space: 'to-half',
  });

  const RULE_PRESETS = Object.freeze({
    web: DEFAULT_RULES,
    full: Object.freeze(Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 'to-full']))),
    half: Object.freeze(Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 'to-half']))),
    keep: Object.freeze(Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 'keep']))),
  });

  const HALF_KATAKANA = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
  const HALF_MARKS = Object.freeze(['ﾞ', 'ﾟ']);
  const FULL_TO_HALF_KATAKANA = new Map();
  const HALF_TO_FULL_KATAKANA = new Map();

  [...HALF_KATAKANA].forEach((halfCharacter) => {
    const fullCharacter = halfCharacter.normalize('NFKC');
    FULL_TO_HALF_KATAKANA.set(fullCharacter, halfCharacter);
    HALF_TO_FULL_KATAKANA.set(halfCharacter, fullCharacter);
    HALF_MARKS.forEach((mark) => {
      const halfPair = `${halfCharacter}${mark}`;
      const fullPair = halfPair.normalize('NFKC');
      if ([...fullPair].length === 1) {
        FULL_TO_HALF_KATAKANA.set(fullPair, halfPair);
        HALF_TO_FULL_KATAKANA.set(halfPair, fullPair);
      }
    });
  });
  FULL_TO_HALF_KATAKANA.set('゛', 'ﾞ');
  FULL_TO_HALF_KATAKANA.set('゜', 'ﾟ');
  FULL_TO_HALF_KATAKANA.set('\u3099', 'ﾞ');
  FULL_TO_HALF_KATAKANA.set('\u309A', 'ﾟ');
  HALF_TO_FULL_KATAKANA.set('ﾞ', '゛');
  HALF_TO_FULL_KATAKANA.set('ﾟ', '゜');

  const JAPANESE_SYMBOL_PAIRS = Object.freeze([
    Object.freeze(['。', '｡']),
    Object.freeze(['「', '｢']),
    Object.freeze(['」', '｣']),
    Object.freeze(['、', '､']),
    Object.freeze(['・', '･']),
    Object.freeze(['￥', '¥']),
    Object.freeze(['￦', '₩']),
    Object.freeze(['￠', '¢']),
    Object.freeze(['￡', '£']),
    Object.freeze(['￢', '¬']),
    Object.freeze(['￣', '¯']),
    Object.freeze(['￤', '¦']),
  ]);
  const FULL_TO_HALF_JAPANESE_SYMBOL = new Map(JAPANESE_SYMBOL_PAIRS);
  const HALF_TO_FULL_JAPANESE_SYMBOL = new Map(JAPANESE_SYMBOL_PAIRS.map(([full, half]) => [half, full]));

  const isCodePointBetween = (character, start, end) => {
    const codePoint = character?.codePointAt(0);
    return Number.isInteger(codePoint) && codePoint >= start && codePoint <= end;
  };
  const isHalfLatin = (character) => /[A-Za-z]/u.test(character);
  const isFullLatin = (character) => isCodePointBetween(character, 0xFF21, 0xFF3A) || isCodePointBetween(character, 0xFF41, 0xFF5A);
  const isHalfDigit = (character) => /[0-9]/u.test(character);
  const isFullDigit = (character) => isCodePointBetween(character, 0xFF10, 0xFF19);
  const isHalfAsciiSymbol = (character) => /[!-/:-@[-`{-~]/u.test(character);
  const isFullAsciiSymbol = (character) => (
    isCodePointBetween(character, 0xFF01, 0xFF0F)
    || isCodePointBetween(character, 0xFF1A, 0xFF20)
    || isCodePointBetween(character, 0xFF3B, 0xFF40)
    || isCodePointBetween(character, 0xFF5B, 0xFF5E)
  );
  const toFullAscii = (character) => String.fromCodePoint(character.codePointAt(0) + 0xFEE0);
  const toHalfAscii = (character) => String.fromCodePoint(character.codePointAt(0) - 0xFEE0);

  const sourceCategory = (character) => {
    if (isHalfLatin(character) || isFullLatin(character)) return 'latin';
    if (isHalfDigit(character) || isFullDigit(character)) return 'digits';
    if (FULL_TO_HALF_KATAKANA.has(character) || HALF_TO_FULL_KATAKANA.has(character)) return 'katakana';
    if (isHalfAsciiSymbol(character) || isFullAsciiSymbol(character)) return 'ascii-symbols';
    if (FULL_TO_HALF_JAPANESE_SYMBOL.has(character) || HALF_TO_FULL_JAPANESE_SYMBOL.has(character)) return 'japanese-symbols';
    if (character === ' ' || character === '\u3000') return 'space';
    return null;
  };

  const normalizeTargets = (targets, fallback = BATCH_TARGETS) => {
    const values = Array.isArray(targets) ? targets : fallback;
    return [...new Set(values)].filter((category) => CATEGORY_ORDER.includes(category));
  };

  const normalizeRules = (rules = DEFAULT_RULES) => Object.freeze(Object.fromEntries(CATEGORY_ORDER.map((category) => {
    const action = rules?.[category];
    return [category, ACTIONS.includes(action) ? action : 'keep'];
  })));

  const rulesFromBatch = (direction = 'to-half', targets = BATCH_TARGETS) => {
    const action = direction === 'to-full' ? 'to-full' : 'to-half';
    const selected = new Set(normalizeTargets(targets));
    return normalizeRules(Object.fromEntries(CATEGORY_ORDER.map((category) => [category, selected.has(category) ? action : 'keep'])));
  };

  const convertAscii = (character, category, action) => {
    if (action === 'to-half') {
      if ((category === 'latin' && isFullLatin(character)) || (category === 'digits' && isFullDigit(character)) || (category === 'ascii-symbols' && isFullAsciiSymbol(character))) return toHalfAscii(character);
    }
    if (action === 'to-full') {
      if ((category === 'latin' && isHalfLatin(character)) || (category === 'digits' && isHalfDigit(character)) || (category === 'ascii-symbols' && isHalfAsciiSymbol(character))) return toFullAscii(character);
    }
    return character;
  };

  const readKatakanaToken = (source, index, action) => {
    const character = String.fromCodePoint(source.codePointAt(index));
    const nextIndex = index + character.length;
    const next = nextIndex < source.length ? String.fromCodePoint(source.codePointAt(nextIndex)) : '';
    if (action === 'to-full' && HALF_TO_FULL_KATAKANA.has(character)) {
      const pair = `${character}${next}`;
      if (HALF_TO_FULL_KATAKANA.has(pair)) return { source: pair, output: HALF_TO_FULL_KATAKANA.get(pair) };
      return { source: character, output: HALF_TO_FULL_KATAKANA.get(character) };
    }
    if (action === 'to-half') {
      const composed = next === '\u3099' || next === '\u309A' ? `${character}${next}`.normalize('NFC') : '';
      if (composed && FULL_TO_HALF_KATAKANA.has(composed)) return { source: `${character}${next}`, output: FULL_TO_HALF_KATAKANA.get(composed) };
      if (FULL_TO_HALF_KATAKANA.has(character)) return { source: character, output: FULL_TO_HALF_KATAKANA.get(character) };
    }
    return null;
  };

  const convertToken = (source, index, rules) => {
    const character = String.fromCodePoint(source.codePointAt(index));
    const category = sourceCategory(character);
    const action = category ? rules[category] : 'keep';
    if (!category || action === 'keep') return { source: character, output: character, category: null };

    if (category === 'katakana') {
      const katakana = readKatakanaToken(source, index, action);
      if (katakana) return { ...katakana, category };
    }
    if (category === 'space') {
      const output = action === 'to-full' && character === ' '
        ? '\u3000'
        : action === 'to-half' && character === '\u3000'
          ? ' '
          : character;
      return { source: character, output, category };
    }
    if (category === 'japanese-symbols') {
      const output = action === 'to-full'
        ? HALF_TO_FULL_JAPANESE_SYMBOL.get(character) || character
        : FULL_TO_HALF_JAPANESE_SYMBOL.get(character) || character;
      return { source: character, output, category };
    }
    return { source: character, output: convertAscii(character, category, action), category };
  };

  const pushSegment = (segments, segment) => {
    const changed = segment.source !== segment.output;
    const category = changed ? segment.category : null;
    const previous = segments.at(-1);
    if (previous && previous.changed === changed && previous.category === category) {
      previous.source += segment.source;
      previous.output += segment.output;
      return;
    }
    segments.push({ source: segment.source, output: segment.output, changed, category });
  };

  const analyze = (value = '') => Object.freeze({
    codeUnits: String(value).length,
    characters: [...String(value)].length,
    lines: value === '' ? 0 : String(value).split(/\r\n?|\n/u).length,
  });

  const convert = (input = '', options = {}) => {
    const original = String(input);
    const source = original.slice(0, MAX_INPUT_LENGTH);
    const mode = options.mode === 'custom' ? 'custom' : 'batch';
    const direction = options.direction === 'to-full' ? 'to-full' : 'to-half';
    const rules = mode === 'custom' ? normalizeRules(options.rules) : rulesFromBatch(direction, options.targets);
    const categoryCounts = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 0]));
    const segments = [];
    let output = '';
    let replacements = 0;

    for (let index = 0; index < source.length;) {
      const token = convertToken(source, index, rules);
      output += token.output;
      if (token.source !== token.output) {
        replacements += 1;
        categoryCounts[token.category] += 1;
      }
      pushSegment(segments, token);
      index += token.source.length;
    }

    return Object.freeze({
      status: source === '' ? 'empty' : replacements ? 'changed' : 'unchanged',
      mode,
      direction,
      source,
      output,
      rules,
      replacements,
      categoryCounts: Object.freeze({ ...categoryCounts }),
      changedCategories: Object.freeze(CATEGORY_ORDER.filter((category) => categoryCounts[category] > 0)),
      segments: Object.freeze(segments.map((segment) => Object.freeze({ ...segment }))),
      input: analyze(source),
      result: analyze(output),
      truncated: original.length > MAX_INPUT_LENGTH,
    });
  };

  const fullwidthCheckCategory = (character) => {
    if (isFullLatin(character)) return 'latin';
    if (isFullDigit(character)) return 'digits';
    if (isFullAsciiSymbol(character)) return 'ascii-symbols';
    if (FULL_TO_HALF_JAPANESE_SYMBOL.has(character)) return 'japanese-symbols';
    if (character === '\u3000') return 'space';
    return null;
  };

  const inspect = (input = '', options = {}) => {
    const original = String(input);
    const source = original.slice(0, MAX_INPUT_LENGTH);
    const targets = normalizeTargets(options.targets, CHECK_DEFAULTS).filter((category) => CHECK_TARGETS.includes(category));
    const targetSet = new Set(targets);
    const customCharacters = new Set([...String(options.customSymbols || '').replace(/[\r\n]/gu, '')]);
    const counts = Object.fromEntries([...CHECK_TARGETS, 'custom'].map((category) => [category, 0]));
    const unique = new Map();
    const matches = [];
    let totalMatches = 0;
    let line = 1;
    let column = 1;

    for (let index = 0; index < source.length;) {
      const character = String.fromCodePoint(source.codePointAt(index));
      if (character === '\n') {
        line += 1;
        column = 1;
        index += character.length;
        continue;
      }
      const naturalCategory = fullwidthCheckCategory(character);
      const category = naturalCategory && targetSet.has(naturalCategory)
        ? naturalCategory
        : customCharacters.has(character)
          ? 'custom'
          : null;
      if (category) {
        totalMatches += 1;
        counts[category] += 1;
        unique.set(character, (unique.get(character) || 0) + 1);
        if (matches.length < MAX_HIGHLIGHT_MATCHES) {
          matches.push(Object.freeze({
            character,
            category,
            index,
            end: index + character.length,
            line,
            column,
            codePoint: `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
          }));
        }
      }
      column += 1;
      index += character.length;
    }

    const activeCategories = [...CHECK_TARGETS, 'custom'].filter((category) => counts[category] > 0);
    return Object.freeze({
      status: source === '' ? 'empty' : totalMatches ? 'found' : 'clear',
      source,
      output: source,
      targets: Object.freeze(targets),
      customSymbols: [...customCharacters].join(''),
      matches: Object.freeze(matches),
      totalMatches,
      displayedMatches: matches.length,
      truncatedMatches: totalMatches > matches.length,
      counts: Object.freeze({ ...counts }),
      activeCategories: Object.freeze(activeCategories),
      unique: Object.freeze([...unique.entries()].map(([character, count]) => Object.freeze({ character, count }))),
      input: analyze(source),
      result: analyze(source),
      truncated: original.length > MAX_INPUT_LENGTH,
    });
  };

  const buildHighlightSegments = (source = '', matches = []) => {
    const segments = [];
    let cursor = 0;
    matches.forEach((match) => {
      if (match.index > cursor) segments.push(Object.freeze({ text: source.slice(cursor, match.index), match: false, category: null }));
      segments.push(Object.freeze({ text: source.slice(match.index, match.end), match: true, category: match.category }));
      cursor = match.end;
    });
    if (cursor < source.length) segments.push(Object.freeze({ text: source.slice(cursor), match: false, category: null }));
    return Object.freeze(segments);
  };

  const formatInspectionReport = (result) => {
    if (!result || result.status === 'empty') return '';
    const lines = [
      `WIDTH CHECK / ${result.totalMatches} MATCHES`,
      ...result.activeCategories.map((category) => `${CATEGORY_DEFINITIONS[category].shortLabel}: ${result.counts[category]}`),
      '',
      ...result.matches.map((match) => `${match.line}:${match.column}\t${match.codePoint}\t${match.character}\t${CATEGORY_DEFINITIONS[match.category].shortLabel}`),
    ];
    if (result.truncatedMatches) lines.push('', `DISPLAY LIMITED TO ${MAX_HIGHLIGHT_MATCHES} MATCHES`);
    return lines.join('\n');
  };

  globalThis.MarkBenchWidthConverter = Object.freeze({
    MAX_INPUT_LENGTH,
    MAX_HIGHLIGHT_MATCHES,
    CATEGORY_ORDER,
    CATEGORY_DEFINITIONS,
    BATCH_TARGETS,
    CHECK_TARGETS,
    CHECK_DEFAULTS,
    ACTIONS,
    DEFAULT_RULES,
    RULE_PRESETS,
    normalizeRules,
    rulesFromBatch,
    analyze,
    convert,
    inspect,
    buildHighlightSegments,
    formatInspectionReport,
  });
})();
