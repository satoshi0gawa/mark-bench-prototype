import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { extname, join } from 'node:path';
import { siteConfig, isNoindexPage } from '../site.config.mjs';
import { checkGeneratedSecrets } from './check-generated-secrets.mjs';
import { checkNoteBuild } from './check-note-build.mjs';
import { CONTENT_SOURCES, loadBlogEntries } from './content/load-blog-entries.mjs';
import { renderNotePages } from './content/render-note-pages.mjs';
import { writeHomeToolsCount, checkHomeToolsCount } from './content/render-home-tools-count.mjs';
import { collectHtmlFiles, pageUrl } from './site-pages.mjs';

await import('./check-seo.mjs');
if (process.exitCode) process.exit(process.exitCode);

const root = process.cwd();
const output = join(root, 'dist');
const sourceArgument = process.argv.find((argument) => argument.startsWith('--source='));
const contentSource = sourceArgument?.slice('--source='.length) || 'fixture';
if (!CONTENT_SOURCES.includes(contentSource)) {
  throw new Error(`Unsupported content source: ${contentSource}`);
}
const noteEntries = await loadBlogEntries({ source: contentSource });
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const htmlFiles = (await readdir(root)).filter((file) => extname(file) === '.html');
for (const file of htmlFiles) await cp(join(root, file), join(output, file));

for (const directory of ['css', 'js', 'tools', 'web-parts', 'build-notes', 'assets']) {
  await cp(join(root, directory), join(output, directory), { recursive: true });
}

for (const file of await readdir(join(output, 'build-notes/note-to-self'))) {
  if (/^test-notetoself-\d+\.html$/.test(file)) {
    await rm(join(output, 'build-notes/note-to-self', file));
  }
}

await renderNotePages({ output, entries: noteEntries });
await checkNoteBuild(output, noteEntries);
await writeHomeToolsCount(output);
await checkHomeToolsCount(output);

const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const publicPages = (await collectHtmlFiles(output)).filter((htmlFile) => !isNoindexPage(htmlFile));
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...publicPages.map((htmlFile) => `  <url><loc>${escapeXml(pageUrl(htmlFile))}</loc></url>`),
  '</urlset>',
  '',
].join('\n');
const robots = ['User-agent: *', 'Allow: /', `Sitemap: ${new URL('sitemap.xml', siteConfig.baseUrl).href}`, ''].join('\n');

await writeFile(join(output, 'sitemap.xml'), sitemap);
await writeFile(join(output, 'robots.txt'), robots);
await writeFile(join(output, '.nojekyll'), '');

const secretScan = await checkGeneratedSecrets(output);
console.log(`Secret scan passed: ${secretScan.files} generated text files checked.`);

const validation = spawnSync(process.execPath, ['scripts/check.mjs', output], {
  cwd: root,
  encoding: 'utf8',
});
if (validation.stdout) process.stdout.write(validation.stdout);
if (validation.stderr) process.stderr.write(validation.stderr);
if (validation.status !== 0) process.exit(validation.status || 1);

console.log(`Static build created: ${output} (${publicPages.length} indexable pages, source: ${contentSource})`);
