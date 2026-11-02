((global) => {
  const MAX_INPUT_LENGTH = 100000;
  const MAX_RENDER_ROWS = 1000;
  const MAX_LINE_EDIT_DISTANCE = 1200;
  const MAX_WORD_EDIT_DISTANCE = 400;

  const normalizeNewlines = (value = '') => String(value).replace(/\r\n?/gu, '\n');

  const splitLines = (value = '') => {
    const normalized = normalizeNewlines(value);
    return normalized ? normalized.split('\n') : [];
  };

  const normalizeLine = (value, ignoreWhitespace) => (
    ignoreWhitespace ? value.replace(/\s+/gu, ' ').trim() : value
  );

  const fallbackDiff = (a, b, equals) => {
    const operations = [];
    const length = Math.max(a.length, b.length);

    for (let index = 0; index < length; index += 1) {
      const hasA = index < a.length;
      const hasB = index < b.length;
      if (hasA && hasB && equals(a[index], b[index])) {
        operations.push({ type: 'equal', aIndex: index, bIndex: index });
      } else {
        if (hasA) operations.push({ type: 'delete', aIndex: index, bIndex: null });
        if (hasB) operations.push({ type: 'insert', aIndex: null, bIndex: index });
      }
    }

    return { operations, approximate: true };
  };

  const backtrack = (trace, a, b, depth) => {
    const operations = [];
    let x = a.length;
    let y = b.length;

    for (let distance = depth; distance >= 0; distance -= 1) {
      const vector = trace[distance];
      const diagonal = x - y;
      const down = vector.get(diagonal + 1);
      const right = vector.get(diagonal - 1);
      const previousDiagonal = diagonal === -distance
        || (diagonal !== distance && (right ?? -1) < (down ?? -1))
        ? diagonal + 1
        : diagonal - 1;
      const previousX = vector.get(previousDiagonal) ?? 0;
      const previousY = previousX - previousDiagonal;

      while (x > previousX && y > previousY) {
        operations.push({ type: 'equal', aIndex: x - 1, bIndex: y - 1 });
        x -= 1;
        y -= 1;
      }

      if (distance === 0) break;
      if (x === previousX) {
        operations.push({ type: 'insert', aIndex: null, bIndex: y - 1 });
        y -= 1;
      } else {
        operations.push({ type: 'delete', aIndex: x - 1, bIndex: null });
        x -= 1;
      }
    }

    return operations.reverse();
  };

  const diffSequence = (a, b, equals, maxDistance) => {
    if (!a.length) {
      return {
        operations: b.map((_, bIndex) => ({ type: 'insert', aIndex: null, bIndex })),
        approximate: false,
      };
    }
    if (!b.length) {
      return {
        operations: a.map((_, aIndex) => ({ type: 'delete', aIndex, bIndex: null })),
        approximate: false,
      };
    }

    const maximum = Math.min(a.length + b.length, maxDistance);
    const vector = new Map([[1, 0]]);
    const trace = [];

    for (let distance = 0; distance <= maximum; distance += 1) {
      trace.push(new Map(vector));

      for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
        const down = vector.get(diagonal + 1);
        const right = vector.get(diagonal - 1);
        let x = diagonal === -distance
          || (diagonal !== distance && (right ?? -1) < (down ?? -1))
          ? down ?? 0
          : (right ?? 0) + 1;
        let y = x - diagonal;

        while (x < a.length && y < b.length && equals(a[x], b[y])) {
          x += 1;
          y += 1;
        }

        vector.set(diagonal, x);
        if (x >= a.length && y >= b.length) {
          return { operations: backtrack(trace, a, b, distance), approximate: false };
        }
      }
    }

    return fallbackDiff(a, b, equals);
  };

  const mergeFragments = (fragments) => fragments.reduce((merged, fragment) => {
    const previous = merged.at(-1);
    if (previous?.type === fragment.type) previous.value += fragment.value;
    else merged.push({ ...fragment });
    return merged;
  }, []);

  const tokenizeWords = (value) => (
    value.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]+/gu) || []
  );

  const diffWords = (original, modified) => {
    const originalTokens = tokenizeWords(original);
    const modifiedTokens = tokenizeWords(modified);
    const result = diffSequence(
      originalTokens,
      modifiedTokens,
      (left, right) => left === right,
      MAX_WORD_EDIT_DISTANCE,
    );

    if (result.approximate) {
      return {
        original: [{ type: 'change', value: original }],
        modified: [{ type: 'change', value: modified }],
      };
    }

    const originalFragments = [];
    const modifiedFragments = [];
    result.operations.forEach((operation) => {
      if (operation.type === 'equal') {
        const value = originalTokens[operation.aIndex];
        originalFragments.push({ type: 'equal', value });
        modifiedFragments.push({ type: 'equal', value: modifiedTokens[operation.bIndex] });
      } else if (operation.type === 'delete') {
        originalFragments.push({ type: 'change', value: originalTokens[operation.aIndex] });
      } else {
        modifiedFragments.push({ type: 'change', value: modifiedTokens[operation.bIndex] });
      }
    });

    return {
      original: mergeFragments(originalFragments),
      modified: mergeFragments(modifiedFragments),
    };
  };

  const addLineNumbers = (operations, originalLines, modifiedLines) => {
    let oldLine = 1;
    let newLine = 1;
    return operations.map((operation) => {
      if (operation.type === 'equal') {
        const item = {
          ...operation,
          value: originalLines[operation.aIndex],
          modifiedValue: modifiedLines[operation.bIndex],
          oldLine,
          newLine,
        };
        oldLine += 1;
        newLine += 1;
        return item;
      }
      if (operation.type === 'delete') {
        const item = { ...operation, value: originalLines[operation.aIndex], oldLine, newLine: null };
        oldLine += 1;
        return item;
      }
      const item = { ...operation, value: modifiedLines[operation.bIndex], oldLine: null, newLine };
      newLine += 1;
      return item;
    });
  };

  const createRows = (operations, mode, ignoreWhitespace) => {
    const rows = [];
    const metrics = { additions: 0, deletions: 0, changes: 0, unchanged: 0 };
    let index = 0;

    while (index < operations.length) {
      const operation = operations[index];
      if (operation.type === 'equal') {
        rows.push({
          type: 'equal',
          value: operation.value,
          oldLine: operation.oldLine,
          newLine: operation.newLine,
          fragments: [{ type: 'equal', value: operation.value }],
        });
        metrics.unchanged += 1;
        index += 1;
        continue;
      }

      const changeGroup = [];
      while (index < operations.length && operations[index].type !== 'equal') {
        changeGroup.push(operations[index]);
        index += 1;
      }
      const deletions = changeGroup.filter((item) => item.type === 'delete');
      const insertions = changeGroup.filter((item) => item.type === 'insert');
      const pairedCount = Math.min(deletions.length, insertions.length);
      metrics.changes += pairedCount;
      metrics.deletions += deletions.length - pairedCount;
      metrics.additions += insertions.length - pairedCount;

      deletions.forEach((item, itemIndex) => {
        const pair = insertions[itemIndex];
        const fragments = pair && mode === 'word' && !ignoreWhitespace
          ? diffWords(item.value, pair.value).original
          : [{ type: pair ? 'change' : 'delete', value: item.value }];
        rows.push({ ...item, type: 'delete', isChange: Boolean(pair), fragments });
      });
      insertions.forEach((item, itemIndex) => {
        const pair = deletions[itemIndex];
        const fragments = pair && mode === 'word' && !ignoreWhitespace
          ? diffWords(pair.value, item.value).modified
          : [{ type: pair ? 'change' : 'insert', value: item.value }];
        rows.push({ ...item, type: 'insert', isChange: Boolean(pair), fragments });
      });
    }

    return { rows, metrics };
  };

  const createPlainText = (rows) => [
    '--- ORIGINAL',
    '+++ MODIFIED',
    ...rows.map((row) => `${row.type === 'delete' ? '-' : row.type === 'insert' ? '+' : ' '} ${row.value}`),
  ].join('\n');

  const compare = (original = '', modified = '', options = {}) => {
    const normalizedOriginal = normalizeNewlines(original).slice(0, MAX_INPUT_LENGTH);
    const normalizedModified = normalizeNewlines(modified).slice(0, MAX_INPUT_LENGTH);
    const mode = options.mode === 'word' ? 'word' : 'line';
    const ignoreWhitespace = Boolean(options.ignoreWhitespace);
    const originalLines = splitLines(normalizedOriginal);
    const modifiedLines = splitLines(normalizedModified);
    const originalKeys = originalLines.map((line) => normalizeLine(line, ignoreWhitespace));
    const modifiedKeys = modifiedLines.map((line) => normalizeLine(line, ignoreWhitespace));
    const sequence = diffSequence(
      originalKeys,
      modifiedKeys,
      (left, right) => left === right,
      MAX_LINE_EDIT_DISTANCE,
    );
    const numberedOperations = addLineNumbers(sequence.operations, originalLines, modifiedLines);
    const { rows, metrics } = createRows(numberedOperations, mode, ignoreWhitespace);
    const differenceCount = metrics.additions + metrics.deletions + metrics.changes;

    return {
      original: normalizedOriginal,
      modified: normalizedModified,
      mode,
      ignoreWhitespace,
      rows,
      metrics: {
        ...metrics,
        differenceCount,
        originalLines: originalLines.length,
        modifiedLines: modifiedLines.length,
        originalCharacters: normalizedOriginal.length,
        modifiedCharacters: normalizedModified.length,
      },
      isEmpty: !normalizedOriginal && !normalizedModified,
      isEqual: differenceCount === 0,
      approximate: sequence.approximate,
      truncated: String(original).length > MAX_INPUT_LENGTH || String(modified).length > MAX_INPUT_LENGTH,
      plainText: createPlainText(rows),
    };
  };

  global.MarkBenchTextDiffViewer = Object.freeze({
    MAX_INPUT_LENGTH,
    MAX_RENDER_ROWS,
    normalizeNewlines,
    splitLines,
    compare,
  });
})(typeof window !== 'undefined' ? window : globalThis);
