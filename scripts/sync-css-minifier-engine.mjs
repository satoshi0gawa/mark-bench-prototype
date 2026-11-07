import { mkdir, copyFile } from 'node:fs/promises';
const target = new URL('../js/vendor/', import.meta.url);
await mkdir(target, { recursive: true });
await copyFile(new URL('../node_modules/css-tree/dist/csstree.js', import.meta.url), new URL('csstree.js', target));
await copyFile(new URL('../node_modules/css-tree/LICENSE', import.meta.url), new URL('css-tree-LICENSE.txt', target));
console.log('CSS minifier engine and MIT license synced from pinned css-tree package.');
