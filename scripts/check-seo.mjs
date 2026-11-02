import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { siteConfig, isArticlePage, isNoindexPage } from '../site.config.mjs';
import { assetUrl, collectHtmlFiles, pageUrl, relativeAssetPath } from './site-pages.mjs';

const rootArgument = process.argv.slice(2).find((argument) => !argument.startsWith('-'));
const root = resolve(process.cwd(), rootArgument || '.');
const htmlFiles = await collectHtmlFiles(root);
const errors = [];
const titles = new Map();
const descriptions = new Map();
const escapedGoogleFontsUrl = siteConfig.googleFontsUrl.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

if (!siteConfig.baseUrl.startsWith('https://') || !siteConfig.baseUrl.endsWith('/')) {
  errors.push('site.config.mjs: baseUrl must be an absolute HTTPS URL ending with /.');
}
if (siteConfig.baseUrl.includes('example.com')) {
  errors.push('site.config.mjs: placeholder baseUrl must not be used for production.');
}

const count = (html, pattern) => [...html.matchAll(pattern)].length;
const value = (html, pattern) => html.match(pattern)?.[1] || '';

for (const htmlFile of htmlFiles) {
  const html = await readFile(join(root, htmlFile), 'utf8');
  const title = value(html, /<title>([\s\S]*?)<\/title>/).replace(/\s+/g, ' ').trim();
  const description = value(html, /<meta\s+name="description"\s+content="([^"]*)"/);
  const expectedCanonical = pageUrl(htmlFile);
  const expectedOgImage = assetUrl(siteConfig.defaultOgImage);
  const expectedIcons = [
    relativeAssetPath(htmlFile, siteConfig.faviconSvg),
    relativeAssetPath(htmlFile, siteConfig.faviconPng),
    relativeAssetPath(htmlFile, siteConfig.appleTouchIcon),
  ];

  if (count(html, /<title>/g) !== 1) errors.push(`${htmlFile}: expected one title.`);
  if (count(html, /<meta\s+name="description"/g) !== 1) errors.push(`${htmlFile}: expected one description.`);
  if (count(html, /<link\s+rel="canonical"/g) !== 1) errors.push(`${htmlFile}: expected one canonical.`);
  if (!html.includes(`href="${expectedCanonical}"`)) errors.push(`${htmlFile}: canonical URL is incorrect.`);
  if (!html.includes(`property="og:type" content="${isArticlePage(htmlFile) ? 'article' : 'website'}"`)) {
    errors.push(`${htmlFile}: og:type is incorrect.`);
  }

  for (const property of ['og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:locale']) {
    if (count(html, new RegExp(`<meta\\s+property="${property}"`, 'g')) !== 1) {
      errors.push(`${htmlFile}: expected one ${property}.`);
    }
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    if (count(html, new RegExp(`<meta\\s+name="${name}"`, 'g')) !== 1) {
      errors.push(`${htmlFile}: expected one ${name}.`);
    }
  }
  const ogImage = value(html, /<meta\s+property="og:image"\s+content="([^"]*)"/);
  const twitterImage = value(html, /<meta\s+name="twitter:image"\s+content="([^"]*)"/);
  if (isArticlePage(htmlFile)) {
    if (!ogImage.startsWith('https://')) errors.push(`${htmlFile}: article og:image must use HTTPS.`);
  } else if (ogImage !== expectedOgImage) {
    errors.push(`${htmlFile}: og:image URL is incorrect.`);
  }
  if (twitterImage !== ogImage) errors.push(`${htmlFile}: twitter:image must match og:image.`);
  if (!html.includes('name="twitter:card" content="summary_large_image"')) {
    errors.push(`${htmlFile}: twitter card type is incorrect.`);
  }

  const robots = value(html, /<meta\s+name="robots"\s+content="([^"]*)"/);
  if (isNoindexPage(htmlFile) && robots !== 'noindex,follow') {
    errors.push(`${htmlFile}: test page must use noindex,follow.`);
  }
  if (!isNoindexPage(htmlFile) && robots) errors.push(`${htmlFile}: public page must not be noindex.`);

  for (const icon of expectedIcons) {
    if (!html.includes(`href="${icon}"`)) errors.push(`${htmlFile}: missing icon ${icon}.`);
    try {
      await access(resolve(root, dirname(htmlFile), icon));
    } catch {
      errors.push(`${htmlFile}: icon file does not exist: ${icon}.`);
    }
  }

  if (!html.includes('rel="preconnect" href="https://fonts.googleapis.com"')) {
    errors.push(`${htmlFile}: Google Fonts preconnect is missing.`);
  }
  if (!html.includes(escapedGoogleFontsUrl)) errors.push(`${htmlFile}: Google Fonts stylesheet is missing.`);

  const jsonText = value(
    html,
    /<script\s+type="application\/ld\+json"\s+data-site-structured-data>([\s\S]*?)<\/script>/,
  );
  try {
    const json = JSON.parse(jsonText);
    const expectedType = htmlFile === 'index.html' ? 'WebSite' : 'BreadcrumbList';
    if (json['@type'] !== expectedType) errors.push(`${htmlFile}: JSON-LD type must be ${expectedType}.`);
  } catch {
    errors.push(`${htmlFile}: JSON-LD is missing or invalid.`);
  }

  if (!titles.has(title)) titles.set(title, []);
  if (!descriptions.has(description)) descriptions.set(description, []);
  titles.get(title).push(htmlFile);
  descriptions.get(description).push(htmlFile);
}

for (const [title, files] of titles) {
  if (!title) errors.push('An empty title exists.');
  if (files.length > 1) errors.push(`Duplicate title "${title}": ${files.join(', ')}`);
}
for (const [description, files] of descriptions) {
  if (!description) errors.push('An empty description exists.');
  if (files.length > 1) errors.push(`Duplicate description: ${files.join(', ')}`);
}

try {
  await access(join(root, siteConfig.defaultOgImage));
} catch {
  errors.push(`Default OGP image does not exist: ${siteConfig.defaultOgImage}.`);
}

if (errors.length) {
  console.error('SEO validation failed:\n' + errors.map((item) => `- ${item}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`SEO validation passed: ${htmlFiles.length} HTML pages.`);
}
