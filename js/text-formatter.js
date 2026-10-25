(() => {
  const MAX_INPUT_LENGTH = 100000;
  const MAX_HISTORY = 50;
  const collator = new Intl.Collator('ja', { numeric: true, sensitivity: 'base' });

  const normalizeNewlines = (value = '') => String(value).replace(/\r\n?/gu, '\n');
  const toLines = (value) => value === '' ? [] : value.split('\n');
  const fromLines = (lines) => lines.join('\n');

  const halfKanaCharacters = '｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
  const fullToHalfKanaMap = new Map();
  [...halfKanaCharacters].forEach((halfCharacter) => {
    fullToHalfKanaMap.set(halfCharacter.normalize('NFKC'), halfCharacter);
    ['ﾞ', 'ﾟ'].forEach((mark) => {
      const normalized = `${halfCharacter}${mark}`.normalize('NFKC');
      if ([...normalized].length === 1) fullToHalfKanaMap.set(normalized, `${halfCharacter}${mark}`);
    });
  });
  fullToHalfKanaMap.set('゛', 'ﾞ');
  fullToHalfKanaMap.set('゜', 'ﾟ');

  const fullwidthToHalfwidth = (value) => [...value].map((character) => {
    if (fullToHalfKanaMap.has(character)) return fullToHalfKanaMap.get(character);
    if (character === '\u3000') return ' ';
    const codePoint = character.codePointAt(0);
    if (codePoint >= 0xff01 && codePoint <= 0xff5e) return String.fromCodePoint(codePoint - 0xfee0);
    return character;
  }).join('');

  const normalizeHalfKanaSegment = (segment) => {
    const characters = [...segment];
    const converted = [];
    for (let index = 0; index < characters.length; index += 1) {
      const character = characters[index];
      if (character === 'ﾞ' || character === 'ﾟ') {
        converted.push(character === 'ﾞ' ? '゛' : '゜');
        continue;
      }
      const mark = characters[index + 1];
      if (mark === 'ﾞ' || mark === 'ﾟ') {
        const combined = `${character}${mark}`.normalize('NFKC');
        if ([...combined].length === 1) {
          converted.push(combined);
          index += 1;
          continue;
        }
      }
      converted.push(character.normalize('NFKC'));
    }
    return converted.join('');
  };

  const halfwidthToFullwidth = (value) => value
    .replace(/[｡-ﾟ]+/gu, normalizeHalfKanaSegment)
    .replace(/[!-~]/gu, (character) => String.fromCodePoint(character.codePointAt(0) + 0xfee0))
    .replace(/ /gu, '\u3000');

  const sortLines = (value, direction) => fromLines(toLines(value)
    .map((line, index) => ({ line, index }))
    .sort((left, right) => {
      const result = collator.compare(left.line, right.line) * direction;
      return result || left.index - right.index;
    })
    .map(({ line }) => line));

  const transformations = {
    'deduplicate-lines': (value) => fromLines([...new Set(toLines(value))]),
    'remove-empty-lines': (value) => fromLines(toLines(value).filter((line) => line.trim() !== '')),
    'collapse-empty-lines': (value) => {
      const lines = [];
      let previousWasEmpty = false;
      toLines(value).forEach((line) => {
        const isEmpty = line.trim() === '';
        if (isEmpty && previousWasEmpty) return;
        lines.push(isEmpty ? '' : line);
        previousWasEmpty = isEmpty;
      });
      return fromLines(lines);
    },
    'trim-lines': (value) => fromLines(toLines(value).map((line) => line.trim())),
    'sort-ascending': (value) => sortLines(value, 1),
    'sort-descending': (value) => sortLines(value, -1),
    'reverse-lines': (value) => fromLines(toLines(value).reverse()),
    'shuffle-lines': (value, options = {}) => {
      const random = typeof options.random === 'function' ? options.random : Math.random;
      const lines = toLines(value);
      for (let index = lines.length - 1; index > 0; index -= 1) {
        const target = Math.floor(random() * (index + 1));
        [lines[index], lines[target]] = [lines[target], lines[index]];
      }
      return fromLines(lines);
    },
    'number-lines': (value) => fromLines(toLines(value).map((line, index) => `${index + 1}. ${line}`)),
    'collapse-spaces': (value) => value.replace(/[ \t]{2,}/gu, ' '),
    'fullwidth-space-to-half': (value) => value.replace(/\u3000/gu, ' '),
    'remove-horizontal-space': (value) => value.replace(/[ \t\u3000]/gu, ''),
    uppercase: (value) => value.toUpperCase(),
    lowercase: (value) => value.toLowerCase(),
    'fullwidth-to-halfwidth': fullwidthToHalfwidth,
    'halfwidth-to-fullwidth': halfwidthToFullwidth,
  };

  const OPERATION_GROUPS = Object.freeze([
    Object.freeze({
      id: 'lines', label: 'LINE / 行の操作', operations: Object.freeze([
        Object.freeze({ id: 'deduplicate-lines', label: '重複行を削除', shortLabel: 'DEDUPLICATE' }),
        Object.freeze({ id: 'remove-empty-lines', label: '空行を削除', shortLabel: 'REMOVE EMPTY' }),
        Object.freeze({ id: 'collapse-empty-lines', label: '連続空行を1行に', shortLabel: 'COLLAPSE EMPTY' }),
        Object.freeze({ id: 'trim-lines', label: '各行をトリム', shortLabel: 'TRIM LINES' }),
        Object.freeze({ id: 'sort-ascending', label: '昇順に並べ替え', shortLabel: 'SORT ASC' }),
        Object.freeze({ id: 'sort-descending', label: '降順に並べ替え', shortLabel: 'SORT DESC' }),
        Object.freeze({ id: 'reverse-lines', label: '行を逆順に', shortLabel: 'REVERSE' }),
        Object.freeze({ id: 'shuffle-lines', label: 'ランダムに並べ替え', shortLabel: 'SHUFFLE' }),
        Object.freeze({ id: 'number-lines', label: '行番号を付ける', shortLabel: 'NUMBER LINES' }),
      ]),
    }),
    Object.freeze({
      id: 'spaces', label: 'SPACE / 空白', operations: Object.freeze([
        Object.freeze({ id: 'collapse-spaces', label: '連続スペースを1つに', shortLabel: 'COLLAPSE SPACES' }),
        Object.freeze({ id: 'fullwidth-space-to-half', label: '全角スペースを半角に', shortLabel: 'SPACE TO HALF' }),
        Object.freeze({ id: 'remove-horizontal-space', label: '空白をすべて削除', shortLabel: 'REMOVE SPACES' }),
      ]),
    }),
    Object.freeze({
      id: 'characters', label: 'CONVERT / 文字変換', operations: Object.freeze([
        Object.freeze({ id: 'uppercase', label: '英字を大文字に', shortLabel: 'UPPERCASE' }),
        Object.freeze({ id: 'lowercase', label: '英字を小文字に', shortLabel: 'LOWERCASE' }),
        Object.freeze({ id: 'fullwidth-to-halfwidth', label: '全角から半角に', shortLabel: 'TO HALFWIDTH' }),
        Object.freeze({ id: 'halfwidth-to-fullwidth', label: '半角から全角に', shortLabel: 'TO FULLWIDTH' }),
      ]),
    }),
  ]);

  const operations = new Map(OPERATION_GROUPS.flatMap((group) => group.operations.map((operation) => [operation.id, operation])));

  const analyze = (input = '') => {
    const value = normalizeNewlines(input);
    return Object.freeze({
      lines: value === '' ? 0 : value.split('\n').length,
      characters: [...value].length,
      nonWhitespaceCharacters: [...value].filter((character) => !/\s/u.test(character)).length,
    });
  };

  const apply = (input = '', operationId, options = {}) => {
    const operation = operations.get(operationId);
    if (!operation || !transformations[operationId]) throw new TypeError(`Unknown formatter operation: ${operationId}`);
    const source = normalizeNewlines(input);
    const output = transformations[operationId](source, options);
    const before = analyze(source);
    const after = analyze(output);
    return Object.freeze({
      status: output === source ? 'unchanged' : 'changed',
      operation: operationId,
      label: operation.label,
      shortLabel: operation.shortLabel,
      output,
      before,
      after,
    });
  };

  globalThis.MarkBenchTextFormatter = Object.freeze({
    MAX_INPUT_LENGTH,
    MAX_HISTORY,
    OPERATION_GROUPS,
    normalizeNewlines,
    analyze,
    apply,
  });
})();
