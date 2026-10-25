(() => {
  const MAX_INPUT_LENGTH = 100000;
  const MAX_NODES = 10000;
  const DEFAULT_OPTIONS = Object.freeze({
    indentMode: 'auto',
    showRoot: false,
    trailingSlash: true,
    ignoreBlankLines: true,
  });

  const normalizeNewlines = (value = '') => String(value).replace(/\r\n?/gu, '\n');
  const gcd = (left, right) => {
    let a = Math.abs(left);
    let b = Math.abs(right);
    while (b) [a, b] = [b, a % b];
    return a;
  };
  const leadingWhitespace = (line) => line.match(/^[ \t\u3000]*/u)?.[0] ?? '';
  const indentColumns = (prefix) => [...prefix].reduce((total, character) => {
    if (character === '\t') return total + 4;
    if (character === '\u3000') return total + 2;
    return total + 1;
  }, 0);

  const resolveIndent = (lines, mode) => {
    if (mode === 'spaces-2') return Object.freeze({ mode, width: 2, label: '2 SPACES', insertText: '  ' });
    if (mode === 'spaces-4') return Object.freeze({ mode, width: 4, label: '4 SPACES', insertText: '    ' });
    if (mode === 'tab') return Object.freeze({ mode, width: 4, label: 'TAB', insertText: '\t' });

    const prefixes = lines
      .filter((line) => line.trim() !== '')
      .map(leadingWhitespace)
      .filter(Boolean);
    if (prefixes.length > 0 && prefixes.every((prefix) => /^\t+$/u.test(prefix))) {
      return Object.freeze({ mode: 'auto', width: 4, label: 'AUTO / TAB', insertText: '\t' });
    }

    const widths = prefixes.map(indentColumns).filter((width) => width > 0);
    const inferredWidth = widths.length ? widths.reduce(gcd) : 2;
    const width = Math.max(1, Math.min(8, inferredWidth));
    return Object.freeze({
      mode: 'auto',
      width,
      label: `AUTO / ${width} SPACE${width === 1 ? '' : 'S'}`,
      insertText: ' '.repeat(width),
    });
  };

  const createWarning = (type, line, message) => Object.freeze({ type, line, message });

  const parseLines = (input, options = {}) => {
    const settings = { ...DEFAULT_OPTIONS, ...options };
    const rawValue = normalizeNewlines(input);
    const value = rawValue.slice(0, MAX_INPUT_LENGTH);
    const lines = value.split('\n');
    const indent = resolveIndent(lines, settings.indentMode);
    const warnings = [];
    const records = [];
    let previousDepth = 0;
    let nodeLimitReached = false;
    let nodeCount = 0;

    lines.forEach((rawLine, index) => {
      const lineNumber = index + 1;
      const prefix = leadingWhitespace(rawLine);
      const name = rawLine.slice(prefix.length).trimEnd();

      if (name.trim() === '') {
        if (!settings.ignoreBlankLines) {
          const blankDepth = records.some((record) => !record.blank) ? previousDepth + 1 : 0;
          records.push(Object.freeze({ blank: true, depth: blankDepth, line: lineNumber }));
        }
        return;
      }
      if (nodeCount >= MAX_NODES) {
        nodeLimitReached = true;
        return;
      }

      const containsTab = prefix.includes('\t');
      const containsSpace = /[ \u3000]/u.test(prefix);
      if (containsTab && containsSpace) {
        warnings.push(createWarning('MIXED_INDENT', lineNumber, 'タブとスペースが同じ行で混在しています。'));
      } else if (settings.indentMode === 'tab' && containsSpace) {
        warnings.push(createWarning('EXPECTED_TAB', lineNumber, 'タブ指定ですが、スペースによるインデントを検出しました。'));
      } else if (settings.indentMode.startsWith('spaces') && containsTab) {
        warnings.push(createWarning('EXPECTED_SPACES', lineNumber, 'スペース指定ですが、タブによるインデントを検出しました。'));
      } else if (prefix.includes('\u3000')) {
        warnings.push(createWarning('FULLWIDTH_INDENT', lineNumber, '全角スペースをインデントとして解釈しました。'));
      }

      const columns = indentColumns(prefix);
      const rawDepth = settings.indentMode === 'tab' && /^\t+$/u.test(prefix)
        ? prefix.length
        : Math.floor(columns / indent.width);
      const remainder = settings.indentMode === 'tab' && /^\t+$/u.test(prefix) ? 0 : columns % indent.width;
      if (remainder > 0) {
        warnings.push(createWarning('MISALIGNED_INDENT', lineNumber, `${indent.label}の単位に揃っていないインデントです。`));
      }

      let depth = rawDepth;
      if (records.every((record) => record.blank)) depth = 0;
      if (depth > previousDepth + 1) {
        warnings.push(createWarning('DEPTH_JUMP', lineNumber, `階層${rawDepth + 1}を階層${previousDepth + 2}へ補正しました。`));
        depth = previousDepth + 1;
      }

      records.push(Object.freeze({ blank: false, depth, line: lineNumber, name }));
      previousDepth = depth;
      nodeCount += 1;
    });

    if (rawValue.length > MAX_INPUT_LENGTH) {
      warnings.unshift(createWarning('INPUT_LIMIT', 0, `入力は先頭${MAX_INPUT_LENGTH.toLocaleString('en-US')}文字まで処理しました。`));
    }
    if (nodeLimitReached) {
      warnings.push(createWarning('NODE_LIMIT', 0, `先頭${MAX_NODES.toLocaleString('en-US')}ノードまで処理しました。`));
    }

    return Object.freeze({
      inputLength: rawValue.length,
      inputTruncated: rawValue.length > MAX_INPUT_LENGTH,
      nodeLimitReached,
      value,
      lines: lines.length,
      indent,
      records: Object.freeze(records),
      warnings: Object.freeze(warnings),
    });
  };

  const buildTree = (records) => {
    const root = { children: [] };
    const stack = [root];
    let nodeCount = 0;
    let maxDepth = 0;

    records.forEach((record) => {
      const depth = Math.min(record.depth, stack.length - 1);
      if (record.blank) {
        stack[Math.max(0, depth)].children.push({ blank: true, children: [] });
        return;
      }

      while (stack.length > depth + 1) stack.pop();
      const parent = stack[depth] || root;
      const node = { name: record.name, line: record.line, depth, blank: false, children: [] };
      parent.children.push(node);
      stack[depth + 1] = node;
      stack.length = depth + 2;
      nodeCount += 1;
      maxDepth = Math.max(maxDepth, depth + 1);
    });

    return Object.freeze({ roots: root.children, nodeCount, maxDepth });
  };

  const hasRealChildren = (node) => node.children.some((child) => !child.blank);
  const renderTree = (roots, options = {}) => {
    const settings = { ...DEFAULT_OPTIONS, ...options };
    const forest = settings.showRoot
      ? [{ name: '.', blank: false, children: roots }]
      : roots;
    const output = [];
    const stack = [];

    const pushSiblings = (siblings, prefix, isTopLevel) => {
      let lastNodeIndex = -1;
      siblings.forEach((node, index) => { if (!node.blank) lastNodeIndex = index; });
      for (let index = siblings.length - 1; index >= 0; index -= 1) {
        const node = siblings[index];
        stack.push({ node, prefix, isTopLevel, isLast: index === lastNodeIndex });
      }
    };

    pushSiblings(forest, '', true);
    while (stack.length) {
      const { node, prefix, isTopLevel, isLast } = stack.pop();
      if (node.blank) {
        output.push('');
        continue;
      }

      const directorySuffix = settings.trailingSlash && hasRealChildren(node) ? '/' : '';
      const marker = isTopLevel ? '' : isLast ? '└── ' : '├── ';
      output.push(`${prefix}${marker}${node.name}${directorySuffix}`);
      const childPrefix = isTopLevel ? '' : `${prefix}${isLast ? '    ' : '│   '}`;
      pushSiblings(node.children, childPrefix, false);
    }

    return output.join('\n');
  };

  const generate = (input = '', options = {}) => {
    const settings = { ...DEFAULT_OPTIONS, ...options };
    const parsed = parseLines(input, settings);
    const tree = buildTree(parsed.records);
    return Object.freeze({
      ...parsed,
      output: renderTree(tree.roots, settings),
      nodeCount: tree.nodeCount,
      rootCount: tree.roots.filter((node) => !node.blank).length,
      maxDepth: tree.maxDepth + (settings.showRoot && tree.nodeCount > 0 ? 1 : 0),
      warningCount: parsed.warnings.length,
    });
  };

  const getCurrentLineIndent = (value, caret) => {
    const normalized = normalizeNewlines(value);
    const position = Math.max(0, Math.min(normalized.length, Number(caret) || 0));
    const lineStart = normalized.lastIndexOf('\n', Math.max(0, position - 1)) + 1;
    return leadingWhitespace(normalized.slice(lineStart, position));
  };

  const isCompositionKey = (event = {}, composing = false) => Boolean(composing || event.isComposing || event.keyCode === 229);

  globalThis.MarkBenchDirectoryTreeGenerator = Object.freeze({
    MAX_INPUT_LENGTH,
    MAX_NODES,
    DEFAULT_OPTIONS,
    normalizeNewlines,
    resolveIndent,
    parseLines,
    buildTree,
    renderTree,
    generate,
    getCurrentLineIndent,
    isCompositionKey,
  });
})();
