import { readdir } from 'node:fs/promises';
import { dirname, extname, join, posix, relative } from 'node:path';
import { siteConfig } from '../site.config.mjs';

const pageDirectories = ['.', 'tools', 'web-parts', 'build-notes'];

const normalizePath = (value) => value.split('\\').join('/').replace(/^\.\//, '');

export const collectHtmlFiles = async (root) => {
  const htmlFiles = [];

  const collect = async (directory, recursive = false) => {
    const entries = await readdir(join(root, directory), { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = join(directory, entry.name);
      if (entry.isFile() && extname(entry.name) === '.html') {
        htmlFiles.push(normalizePath(relativePath));
      }
      if (recursive && entry.isDirectory()) await collect(relativePath, true);
    }
  };

  for (const directory of pageDirectories) await collect(directory, directory !== '.');
  return [...new Set(htmlFiles)].sort();
};

export const pageRoute = (htmlFile) => {
  const normalized = normalizePath(htmlFile);
  if (normalized === 'index.html') return '';
  if (normalized.endsWith('/index.html')) return normalized.slice(0, -'index.html'.length);
  return normalized;
};

export const pageUrl = (htmlFile) => new URL(pageRoute(htmlFile), siteConfig.baseUrl).href;

export const assetUrl = (assetPath) => new URL(assetPath, siteConfig.baseUrl).href;

export const relativeAssetPath = (htmlFile, assetPath) => {
  const fromDirectory = dirname(normalizePath(htmlFile));
  const result = normalizePath(relative(fromDirectory, assetPath));
  return result.startsWith('.') ? result : `./${result}`;
};

const breadcrumbLabels = {
  tools: 'TOOLS',
  'web-parts': 'WEB PARTS',
  'build-notes': 'BUILD NOTES',
  'coding-note': 'CODING NOTE',
  'note-to-self': 'NOTE to SELF',
};

export const breadcrumbsForPage = (htmlFile, pageTitle) => {
  const normalized = normalizePath(htmlFile);
  const crumbs = [{ name: 'HOME', item: siteConfig.baseUrl }];
  if (normalized === 'index.html') return crumbs;

  const directory = posix.dirname(normalized);
  const directoryParts = directory === '.' ? [] : directory.split('/');
  directoryParts.forEach((part, index) => {
    const route = `${directoryParts.slice(0, index + 1).join('/')}/`;
    crumbs.push({
      name: breadcrumbLabels[part] || part,
      item: new URL(route, siteConfig.baseUrl).href,
    });
  });

  if (!normalized.endsWith('/index.html')) {
    crumbs.push({ name: pageTitle, item: pageUrl(normalized) });
  }

  return crumbs;
};
