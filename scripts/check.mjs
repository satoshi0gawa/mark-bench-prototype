import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';

const rootArgument = process.argv.slice(2).find((argument) => !argument.startsWith('-'));
const root = resolve(process.cwd(), rootArgument || '.');
const pageDirectories = ['.', 'tools', 'web-parts', 'build-notes'];
const htmlFiles = [];
const htmlCache = new Map();

const collectHtmlFiles = async (directory, recursive = false) => {
  const entries = await readdir(join(root, directory), { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = join(directory, entry.name);
    if (entry.isFile() && extname(entry.name) === '.html') htmlFiles.push(relativePath);
    if (recursive && entry.isDirectory()) await collectHtmlFiles(relativePath, true);
  }
};

for (const directory of pageDirectories) await collectHtmlFiles(directory, directory !== '.');
const missing = [];

for (const htmlFile of htmlFiles) {
  const html = await readFile(join(root, htmlFile), 'utf8');
  htmlCache.set(resolve(root, htmlFile), html);
  const references = [...html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)]
    .map((match) => match[1])
    .filter((path) => /^\.\.?\//.test(path));

  for (const reference of references) {
    const resolvedPath = resolve(root, dirname(htmlFile), reference);
    const filePath = reference.endsWith('/') ? join(resolvedPath, 'index.html') : resolvedPath;
    try {
      await access(filePath);
    } catch {
      missing.push(`${htmlFile}: ${reference}`);
    }
  }

  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>/g)].map((match) => match[1]);
  for (const href of hrefs) {
    const hashIndex = href.indexOf('#');
    if (hashIndex < 0 || /^(?:https?:|mailto:|tel:)/.test(href)) continue;
    const pathPart = href.slice(0, hashIndex);
    const rawHash = href.slice(hashIndex + 1);
    if (!rawHash) continue;

    let hash;
    try {
      hash = decodeURIComponent(rawHash);
    } catch {
      missing.push(`${htmlFile}: invalid URL fragment "${rawHash}"`);
      continue;
    }

    const resolvedTarget = pathPart
      ? resolve(root, dirname(htmlFile), pathPart.endsWith('/') ? join(pathPart, 'index.html') : pathPart)
      : resolve(root, htmlFile);
    if (extname(resolvedTarget) !== '.html') continue;

    try {
      const targetHtml = htmlCache.get(resolvedTarget) || (await readFile(resolvedTarget, 'utf8'));
      htmlCache.set(resolvedTarget, targetHtml);
      const escapedHash = hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`\\bid="${escapedHash}"`).test(targetHtml)) {
        missing.push(`${htmlFile}: missing anchor target "${href}"`);
      }
    } catch {
      // Missing linked files are reported by the local-reference check above.
    }
  }

  for (const match of html.matchAll(/<a\b([^>]*)>/g)) {
    const attributes = match[1];
    if (!/\btarget="_blank"/.test(attributes)) continue;
    const rel = attributes.match(/\brel="([^"]*)"/)?.[1].split(/\s+/) || [];
    if (!rel.includes('noopener') || !rel.includes('noreferrer')) {
      missing.push(`${htmlFile}: target="_blank" link must use rel="noopener noreferrer"`);
    }
  }

  const mainCount = (html.match(/<main\b/g) || []).length;
  const h1Count = (html.match(/<h1\b/g) || []).length;
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

  if (mainCount !== 1) missing.push(`${htmlFile}: expected 1 main, found ${mainCount}`);
  if (h1Count !== 1) missing.push(`${htmlFile}: expected 1 h1, found ${h1Count}`);
  if (!html.includes('id="main"')) missing.push(`${htmlFile}: missing main#main`);
  if (!html.includes('class="skip-link"')) missing.push(`${htmlFile}: missing skip link`);
  if (!html.includes('data-site="coding-note"')) missing.push(`${htmlFile}: missing site root hook`);
  if (!html.includes('meta name="viewport"')) missing.push(`${htmlFile}: missing viewport meta`);
  duplicateIds.forEach((id) => missing.push(`${htmlFile}: duplicate id "${id}"`));
}

if (missing.length) {
  console.error('Validation failed:\n' + missing.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(`Validation passed: ${htmlFiles.length} HTML pages and all local references resolved in ${root}.`);

await import('./check-seo.mjs');
await import('./check-blog-content.mjs');
await import('./check-rich-text-sanitizer.mjs');
await import('./check-microcms-fetch.mjs');
await import('./check-secret-scanner.mjs');
