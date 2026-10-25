import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';

const root = resolve(process.cwd(), process.argv[2] || '.');
const pageDirectories = ['.', 'tools', 'build-logs'];
const htmlFiles = [];

for (const directory of pageDirectories) {
  const files = (await readdir(join(root, directory))).filter((file) => extname(file) === '.html');
  htmlFiles.push(...files.map((file) => join(directory, file)));
}
const missing = [];

for (const htmlFile of htmlFiles) {
  const html = await readFile(join(root, htmlFile), 'utf8');
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
