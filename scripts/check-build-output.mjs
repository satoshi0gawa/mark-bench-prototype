import { access, readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd(), process.argv[2] || 'dist');
const failures = [];
const read = (path) => readFile(join(root, path), 'utf8');

const indexHtml = await read('build-logs/index.html');
const homeHtml = await read('index.html');
const publishedRows = [...indexHtml.matchAll(/<li data-log-status="published">/g)].length;
const plannedRows = [...indexHtml.matchAll(/<li data-log-status="planned">/g)].length;
const totalRows = publishedRows + plannedRows;
const countMatch = indexHtml.match(/data-log-counts><span>ALL: (\d+)<\/span><span>PUBLISHED: (\d+)<\/span><span>PLANNED: (\d+)<\/span>/);
const statusMatch = indexHtml.match(/<span data-log-total>(\d+)<\/span> LOGS FOUND/);
const homeMatch = homeHtml.match(/data-build-log-count>(\d+) LOGS<\/span>/);

if (!countMatch) failures.push('BUILD LOGS count metadata is missing');
if (!statusMatch) failures.push('BUILD LOGS status count is missing');
if (!homeMatch) failures.push('HOME build log count is missing');
if (countMatch) {
  const [, all, published, planned] = countMatch.map(Number);
  if (all !== totalRows) failures.push(`ALL count is ${all}; expected ${totalRows}`);
  if (published !== publishedRows) failures.push(`PUBLISHED count is ${published}; expected ${publishedRows}`);
  if (planned !== plannedRows) failures.push(`PLANNED count is ${planned}; expected ${plannedRows}`);
}
if (statusMatch && Number(statusMatch[1]) !== totalRows) failures.push('Directory total does not match rows');
if (homeMatch && Number(homeMatch[1]) !== totalRows) failures.push('HOME count does not match BUILD LOGS');

const detailLinks = [...indexHtml.matchAll(/<a class="note-row" href="\.\/([^"/]+\.html)">/g)]
  .map((match) => match[1]);
if (detailLinks.length !== publishedRows) failures.push('Published row count does not match detail links');

for (const file of detailLinks) {
  const relativePath = join('build-logs', file);
  try {
    await access(join(root, relativePath));
  } catch {
    failures.push(`${relativePath}: generated detail page is missing`);
    continue;
  }

  const html = await read(relativePath);
  const toc = html.match(/<aside class="article-toc[\s\S]*?<\/aside>/)?.[0] || '';
  const tocTargets = [...toc.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  const sectionIds = [...html.matchAll(/<section class="article-section[^>]+id="([^"]+)"/g)]
    .map((match) => match[1]);
  if (!tocTargets.length) failures.push(`${relativePath}: table of contents is empty`);
  if (JSON.stringify(tocTargets) !== JSON.stringify(sectionIds)) {
    failures.push(`${relativePath}: table of contents does not match article sections`);
  }
  const ctaType = html.match(/<article class="article-layout"[^>]+data-cta-type="(tool|link|none)"/)?.[1];
  const hasCta = html.includes('article-callout article-callout--cta');
  if (!ctaType) failures.push(`${relativePath}: CTA type metadata is missing`);
  if (ctaType === 'none' && hasCta) failures.push(`${relativePath}: CTA must be omitted when its type is none`);
  if ((ctaType === 'tool' || ctaType === 'link') && !hasCta) {
    failures.push(`${relativePath}: ${ctaType} CTA is missing`);
  }
}

const scanFiles = async (directory = root) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await scanFiles(path));
    else files.push(path);
  }
  return files;
};

for (const file of await scanFiles()) {
  const content = await readFile(file, 'utf8').catch(() => '');
  if (/X-MICROCMS-API-KEY|MICROCMS_API_KEY/.test(content)) {
    failures.push(`${file}: microCMS secret identifier leaked into the build`);
  }
  if (process.env.MICROCMS_API_KEY && content.includes(process.env.MICROCMS_API_KEY)) {
    failures.push(`${file}: microCMS API key leaked into the build`);
  }
}

if (failures.length) {
  console.error(`Generated build validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log(`Generated build validation passed: ${publishedRows} published and ${plannedRows} planned BUILD LOGS.`);
