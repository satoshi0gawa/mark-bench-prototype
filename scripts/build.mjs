import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { loadBuildLogs } from './lib/build-log-content.mjs';
import {
  renderBuildLogDetail,
  renderBuildLogIndex,
  renderHomeWithCount,
} from './templates/build-log-pages.mjs';

const root = process.cwd();
const output = join(root, 'dist');
const sourceArgument = process.argv.find((argument) => argument.startsWith('--source='));
const contentSource = sourceArgument?.split('=')[1] || 'fixture';
const buildLogs = await loadBuildLogs({ source: contentSource });

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const htmlFiles = (await readdir(root)).filter((file) => extname(file) === '.html');
for (const file of htmlFiles) await cp(join(root, file), join(output, file));

for (const directory of ['css', 'js', 'tools']) {
  await cp(join(root, directory), join(output, directory), { recursive: true });
}

const buildLogsOutput = join(output, 'build-logs');
await mkdir(buildLogsOutput, { recursive: true });
await writeFile(
  join(buildLogsOutput, 'index.html'),
  renderBuildLogIndex(buildLogs, { source: contentSource }),
);

const publishedLogs = buildLogs.filter((entry) => entry.displayStatus === 'published');
for (const entry of publishedLogs) {
  await writeFile(join(buildLogsOutput, `${entry.slug}.html`), renderBuildLogDetail(entry));
}

const homePath = join(output, 'index.html');
const homeHtml = await readFile(homePath, 'utf8');
await writeFile(homePath, renderHomeWithCount(homeHtml, buildLogs.length));
await writeFile(join(output, '.nojekyll'), '');

console.log(
  `Static build created: ${output} (${publishedLogs.length} published, ${buildLogs.length - publishedLogs.length} planned, source: ${contentSource})`,
);
