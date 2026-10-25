import assert from 'node:assert/strict';

await import('../js/directory-tree-generator.js');

const generator = globalThis.MarkBenchDirectoryTreeGenerator;
assert.ok(generator, 'Directory Tree Generator module should be available');

const basic = generator.generate([
  'project',
  '  src',
  '    index.js',
  '    lib',
  '      util.js',
  '  README.md',
].join('\n'), { indentMode: 'spaces-2', trailingSlash: true });

assert.equal(basic.output, [
  'project/',
  '├── src/',
  '│   ├── index.js',
  '│   └── lib/',
  '│       └── util.js',
  '└── README.md',
].join('\n'));
assert.equal(basic.nodeCount, 6);
assert.equal(basic.rootCount, 1);
assert.equal(basic.maxDepth, 4);
assert.equal(basic.warningCount, 0);
assert.equal(basic.warnings.length, 0);

const wrapped = generator.generate('src\n  index.js\nREADME.md', {
  indentMode: 'spaces-2',
  showRoot: true,
  trailingSlash: false,
});
assert.equal(wrapped.output, '.\n├── src\n│   └── index.js\n└── README.md');
assert.equal(wrapped.rootCount, 2);
assert.equal(wrapped.maxDepth, 3);

const autoSpaces = generator.generate('src\n    assets\n        icon.svg', { indentMode: 'auto' });
assert.equal(autoSpaces.indent.label, 'AUTO / 4 SPACES');
assert.equal(autoSpaces.maxDepth, 3);

const autoTab = generator.generate('src\n\tassets\n\t\ticon.svg', { indentMode: 'auto' });
assert.equal(autoTab.indent.label, 'AUTO / TAB');
assert.equal(autoTab.output, 'src/\n└── assets/\n    └── icon.svg');

const fullwidth = generator.generate('src\n\u3000assets', { indentMode: 'auto' });
assert.equal(fullwidth.indent.label, 'AUTO / 2 SPACES');
assert.equal(fullwidth.output, 'src/\n└── assets');
assert.ok(fullwidth.warnings.some((warning) => warning.type === 'FULLWIDTH_INDENT' && warning.line === 2));

const mixed = generator.generate('src\n\t  assets', { indentMode: 'spaces-2' });
assert.ok(mixed.warnings.some((warning) => warning.type === 'MIXED_INDENT' && warning.line === 2));

const depthJump = generator.generate('root\n      child', { indentMode: 'spaces-2' });
assert.equal(depthJump.output, 'root/\n└── child');
assert.ok(depthJump.warnings.some((warning) => warning.type === 'DEPTH_JUMP' && warning.line === 2));

const misaligned = generator.generate('root\n   child', { indentMode: 'spaces-2' });
assert.ok(misaligned.warnings.some((warning) => warning.type === 'MISALIGNED_INDENT' && warning.line === 2));

const blankIgnored = generator.generate('root\n\n  child', { indentMode: 'spaces-2', ignoreBlankLines: true });
assert.equal(blankIgnored.output, 'root/\n└── child');

const blankPreserved = generator.generate('root\n\n  child', { indentMode: 'spaces-2', ignoreBlankLines: false });
assert.equal(blankPreserved.output, 'root/\n\n└── child');

const overInputLimit = generator.generate('a'.repeat(generator.MAX_INPUT_LENGTH + 1));
assert.equal(overInputLimit.inputTruncated, true);
assert.equal(overInputLimit.value.length, generator.MAX_INPUT_LENGTH);
assert.ok(overInputLimit.warnings.some((warning) => warning.type === 'INPUT_LIMIT'));

const overNodeLimit = generator.generate(Array.from({ length: generator.MAX_NODES + 1 }, (_, index) => `item-${index}`).join('\n'));
assert.equal(overNodeLimit.nodeCount, generator.MAX_NODES);
assert.equal(overNodeLimit.nodeLimitReached, true);
assert.ok(overNodeLimit.warnings.some((warning) => warning.type === 'NODE_LIMIT'));

assert.equal(generator.getCurrentLineIndent('root\n    child', 14), '    ');
assert.equal(generator.isCompositionKey({ isComposing: true }), true);
assert.equal(generator.isCompositionKey({ keyCode: 229 }), true);
assert.equal(generator.isCompositionKey({ key: 'Enter' }, true), true);
assert.equal(generator.isCompositionKey({ key: 'Enter' }, false), false);
assert.equal(generator.MAX_INPUT_LENGTH, 100000);
assert.equal(generator.MAX_NODES, 10000);

console.log('Directory Tree Generator checks passed.');
