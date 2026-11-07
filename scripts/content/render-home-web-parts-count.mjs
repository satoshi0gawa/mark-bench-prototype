import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sanitizeHtml from 'sanitize-html';

// Count real directory cards, excluding comments, examples and inert templates.
export const countWebPartCards = html => {
  let count = 0;
  sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    nonTextTags: ['script', 'style', 'textarea', 'option', 'xmp', 'template'],
    transformTags: {
      '*': (tagName, attributes) => {
        const classes = (attributes.class || '').split(/\s+/u);
        if (Object.hasOwn(attributes, 'data-part-category') && classes.includes('parts-card')) count += 1;
        return { tagName, attribs: {} };
      },
    },
  });
  return count;
};

const markerPattern = /(<span\b[^>]*\sdata-web-parts-count(?=[\s=>])[^>]*>)[^<]*(<\/span\s*>)/giu;

export const renderHomeWebPartsCount = (home, directory) => {
  if ([...home.matchAll(markerPattern)].length !== 1) {
    throw new Error('HOME must contain exactly one span[data-web-parts-count].');
  }
  const count = countWebPartCards(directory);
  return home.replace(markerPattern, (_, start, end) => `${start}${String(count).padStart(2, '0')} CATEGORIES${end}`);
};

export const writeHomeWebPartsCount = async output => {
  const homePath = join(output, 'index.html');
  const [home, directory] = await Promise.all([
    readFile(homePath, 'utf8'), readFile(join(output, 'web-parts/index.html'), 'utf8'),
  ]);
  await writeFile(homePath, renderHomeWebPartsCount(home, directory));
  console.log(`HOME WEB PARTS count generated: ${countWebPartCards(directory)} categories.`);
};

export const checkHomeWebPartsCount = async output => {
  const [home, directory] = await Promise.all([
    readFile(join(output, 'index.html'), 'utf8'), readFile(join(output, 'web-parts/index.html'), 'utf8'),
  ]);
  if (renderHomeWebPartsCount(home, directory) !== home) throw new Error('Generated HOME WEB PARTS count does not match directory cards.');
};
