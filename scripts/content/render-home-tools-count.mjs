import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sanitizeHtml from 'sanitize-html';

// Parse HTML rather than counting strings in comments or script examples.
export const countToolCards = html => {
  let count = 0;
  sanitizeHtml(html, {
    allowedTags: ['article'],
    allowedAttributes: {},
    transformTags: {
      article: (tagName, attributes) => {
        if (Object.hasOwn(attributes, 'data-tool-card')) count += 1;
        return { tagName, attribs: {} };
      },
    },
  });
  return count;
};

const markerPattern = /(<span\b[^>]*\bdata-tools-count\b[^>]*>)[^<]*(<\/span\s*>)/giu;

export const renderHomeToolsCount = (home, directory) => {
  if ([...home.matchAll(markerPattern)].length !== 1) {
    throw new Error('HOME must contain exactly one span[data-tools-count].');
  }
  const count = countToolCards(directory);
  return home.replace(markerPattern, (_, start, end) => `${start}${String(count).padStart(2, '0')} TOOLS${end}`);
};

export const writeHomeToolsCount = async output => {
  const homePath = join(output, 'index.html');
  const [home, directory] = await Promise.all([
    readFile(homePath, 'utf8'), readFile(join(output, 'tools/index.html'), 'utf8'),
  ]);
  await writeFile(homePath, renderHomeToolsCount(home, directory));
  console.log(`HOME tools count generated: ${countToolCards(directory)} tools.`);
};

export const checkHomeToolsCount = async output => {
  const [home, directory] = await Promise.all([
    readFile(join(output, 'index.html'), 'utf8'), readFile(join(output, 'tools/index.html'), 'utf8'),
  ]);
  if (renderHomeToolsCount(home, directory) !== home) throw new Error('Generated HOME tools count does not match directory cards.');
};
