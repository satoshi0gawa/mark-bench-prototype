import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { siteConfig, isArticlePage, isNoindexPage } from '../site.config.mjs';
import {
  assetUrl,
  breadcrumbsForPage,
  collectHtmlFiles,
  pageUrl,
  relativeAssetPath,
} from './site-pages.mjs';

const root = process.cwd();
const markerPattern = /\n\s*<!-- site-meta:start -->[\s\S]*?<!-- site-meta:end -->\n?/;
const iconPattern = /\n?\s*<link\b[^>]*\brel="(?:shortcut icon|icon|apple-touch-icon)"[^>]*\/?\s*>/gi;

const decodeHtml = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');

const escapeAttribute = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

const normalizeTitle = (htmlFile, currentTitle) => {
  if (htmlFile === 'index.html') return siteConfig.name;
  if (htmlFile === 'tools/index.html') return `TOOLS | ${siteConfig.name}`;
  return currentTitle.replace(` | WEB PARTS | ${siteConfig.name}`, ` | ${siteConfig.name}`);
};

const structuredData = (htmlFile, title, description) => {
  if (htmlFile === 'index.html') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.baseUrl,
      description,
      inLanguage: siteConfig.language,
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbsForPage(htmlFile, title).map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
};

const createMetaBlock = (htmlFile, title, description) => {
  const canonical = pageUrl(htmlFile);
  const ogImage = assetUrl(siteConfig.defaultOgImage);
  const faviconSvg = relativeAssetPath(htmlFile, siteConfig.faviconSvg);
  const faviconPng = relativeAssetPath(htmlFile, siteConfig.faviconPng);
  const appleTouchIcon = relativeAssetPath(htmlFile, siteConfig.appleTouchIcon);
  const robots = isNoindexPage(htmlFile)
    ? '    <meta name="robots" content="noindex,follow" />\n'
    : '';
  const pageName = decodeHtml(title).replace(new RegExp(` \\| ${siteConfig.name}$`), '');
  const jsonLd = JSON.stringify(structuredData(htmlFile, pageName, decodeHtml(description)), null, 2)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n');

  return `    <!-- site-meta:start -->
${robots}    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="${isArticlePage(htmlFile) ? 'article' : 'website'}" />
    <meta property="og:site_name" content="${siteConfig.name}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="${siteConfig.locale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />
    <link rel="icon" href="${faviconSvg}" type="image/svg+xml" />
    <link rel="icon" href="${faviconPng}" type="image/png" sizes="32x32" />
    <link rel="apple-touch-icon" href="${appleTouchIcon}" sizes="180x180" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${escapeAttribute(siteConfig.googleFontsUrl)}" />
    <script type="application/ld+json" data-site-structured-data>
${jsonLd}
    </script>
    <!-- site-meta:end -->`;
};

const htmlFiles = await collectHtmlFiles(root);
let changedCount = 0;

for (const htmlFile of htmlFiles) {
  const fullPath = join(root, htmlFile);
  const original = await readFile(fullPath, 'utf8');
  let html = original.replace(markerPattern, '\n').replace(iconPattern, '');
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
  const descriptionMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/);

  if (!titleMatch || !descriptionMatch) {
    throw new Error(`${htmlFile}: title or meta description is missing.`);
  }

  const currentTitle = titleMatch[1].replace(/\s+/g, ' ').trim();
  const title = normalizeTitle(htmlFile, currentTitle);
  const description = descriptionMatch[1];
  html = html.replace(titleMatch[0], `<title>${title}</title>`);
  html = html.replace(
    /(<title>[\s\S]*?<\/title>)/,
    `$1\n${createMetaBlock(htmlFile, title, description)}`,
  );

  if (html !== original) {
    await writeFile(fullPath, html);
    changedCount += 1;
  }
}

console.log(`Head metadata synchronized: ${changedCount}/${htmlFiles.length} HTML pages updated.`);
