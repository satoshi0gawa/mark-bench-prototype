import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { siteConfig } from '../../site.config.mjs';
import { assetUrl, breadcrumbsForPage, pageUrl } from '../site-pages.mjs';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const escapeAttribute = escapeHtml;
const twoDigits = (value) => String(value).padStart(2, '0');

const formatDate = (value) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return {
    machine: `${part('year')}-${part('month')}-${part('day')}`,
    display: `${part('year')}.${part('month')}.${part('day')}`,
  };
};

const wrapTables = (html, heading) => html.replace(/<table\b[\s\S]*?<\/table>/gi, (table) => {
  const withCaption = /<caption\b/i.test(table)
    ? table
    : table.replace(/(<table\b[^>]*>)/i, `$1<caption class="visually-hidden">${escapeHtml(heading)}</caption>`);
  return `<div class="article-table-wrap" tabindex="0" role="region" aria-label="表を横にスクロールできます">${withCaption}</div>`;
});

const renderMetaBlock = (htmlFile, article) => {
  const title = `${article.seo.title} | ${siteConfig.name}`;
  const description = article.seo.description;
  const canonical = pageUrl(htmlFile);
  const ogImage = article.seo.ogImage?.url || assetUrl(siteConfig.defaultOgImage);
  const ogWidth = article.seo.ogImage?.width || 1200;
  const ogHeight = article.seo.ogImage?.height || 630;
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbsForPage(htmlFile, article.title).map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  }, null, 2).replaceAll('<', '\\u003c').split('\n').map((line) => `      ${line}`).join('\n');

  return `    <!-- site-meta:start -->
    <link rel="canonical" href="${escapeAttribute(canonical)}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${siteConfig.name}" />
    <meta property="og:title" content="${escapeAttribute(title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:url" content="${escapeAttribute(canonical)}" />
    <meta property="og:image" content="${escapeAttribute(ogImage)}" />
    <meta property="og:image:width" content="${ogWidth}" />
    <meta property="og:image:height" content="${ogHeight}" />
    <meta property="og:locale" content="${siteConfig.locale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(title)}" />
    <meta name="twitter:description" content="${escapeAttribute(description)}" />
    <meta name="twitter:image" content="${escapeAttribute(ogImage)}" />
    <link rel="icon" href="../../assets/icons/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="../../assets/icons/favicon-32.png" type="image/png" sizes="32x32" />
    <link rel="apple-touch-icon" href="../../assets/icons/apple-touch-icon.png" sizes="180x180" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${escapeAttribute(siteConfig.googleFontsUrl)}" />
    <script type="application/ld+json" data-site-structured-data>
${jsonLd}
    </script>
    <!-- site-meta:end -->`;
};

const renderReferences = (references) => {
  if (!references.length) return '';
  const items = references.map((reference) =>
    `              <li><a href="${escapeAttribute(reference.url)}">${escapeHtml(reference.label)}</a></li>`).join('\n');
  return `
          <div class="article-toc__references">
            <p>REFERENCES</p>
            <ul>
${items}
            </ul>
          </div>`;
};

const renderRelatedTool = (tool) => {
  if (!tool) return '';
  return `
            <aside class="article-callout article-callout--cta" aria-label="関連ツール">
              <strong>RELATED TOOL</strong>
              <p>${escapeHtml(tool.description)}</p>
              <a class="button" href="../../tools/${escapeAttribute(tool.toolId)}.html"><span>${escapeHtml(tool.label)}</span> <i aria-hidden="true">→</i></a>
            </aside>`;
};

const renderRelatedWebPart = (webPart) => {
  if (!webPart) return '';
  return `
            <aside class="article-callout article-callout--cta" aria-label="関連WEB PARTS">
              <strong>RELATED WEB PART</strong>
              <p>${escapeHtml(webPart.description)}</p>
              <a class="button" href="../../web-parts/${escapeAttribute(webPart.partId)}.html"><span>${escapeHtml(webPart.label)}</span> <i aria-hidden="true">→</i></a>
            </aside>`;
};

const renderSection = (section, index, article) => {
  const label = section.label ? ` / ${escapeHtml(section.label)}` : '';
  const callout = section.calloutBody
    ? `
            <div class="article-callout"><strong>${escapeHtml(section.calloutLabel)}</strong>${section.calloutBody}</div>`
    : '';
  const relatedCta = index === article.sections.length - 1
    ? renderRelatedTool(article.relatedTool) || renderRelatedWebPart(article.relatedWebPart)
    : '';
  return `          <section class="article-section reveal" id="${section.id}" aria-labelledby="${section.id}-title" data-reveal-threshold="0.01">
            <p class="section-index">${section.number}${label}</p>
            <h2 id="${section.id}-title">${escapeHtml(section.heading)}</h2>
            ${wrapTables(section.body, section.heading)}${callout}${relatedCta}
          </section>`;
};

const renderDetailPage = (article) => {
  const htmlFile = article.outputPath;
  const title = `${article.seo.title} | ${siteConfig.name}`;
  const date = formatDate(article.publishedAt);
  const tocItems = article.sections.map((section) =>
    `            <li><a href="#${section.id}">${escapeHtml(section.heading)}</a></li>`).join('\n');
  const sections = article.sections.map((section, index) => renderSection(section, index, article)).join('\n\n');

  return `<!doctype html>
<html lang="ja" class="no-js">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeAttribute(article.seo.description)}" />
    <meta name="theme-color" content="${siteConfig.themeColor}" />
    <title>${escapeHtml(title)}</title>
${renderMetaBlock(htmlFile, article)}
    <script>document.documentElement.classList.replace('no-js', 'js');</script>
    <link rel="stylesheet" href="../../css/foundation.css" />
    <link rel="stylesheet" href="../../css/components.css" />
    <link rel="stylesheet" href="../../css/pages.css" />
  </head>
  <body data-site="coding-note" data-page="blog">
    <a class="skip-link" href="#main">本文へ移動</a>
    <header class="site-header">
      <div class="site-header__bar">
        <nav class="site-breadcrumb-logo" aria-label="パンくずリスト">
          <a class="site-logo" href="../../index.html">HOME</a>
          <span class="site-breadcrumb-logo__separator" aria-hidden="true">/</span>
          <a class="site-breadcrumb-logo__parent" href="../">BUILD NOTES</a>
          <span class="site-breadcrumb-logo__separator" aria-hidden="true">/</span>
          <a class="site-breadcrumb-logo__parent" href="./">NOTE to SELF</a>
          <span class="site-breadcrumb-logo__separator" aria-hidden="true">/</span>
          <span class="site-breadcrumb-logo__current" aria-current="page">${escapeHtml(article.title)}</span>
        </nav>
      </div>
    </header>

    <nav class="site-rail-navigation" aria-label="主要ナビゲーション">
      <a href="../../tools/"><strong>TOOLS</strong></a>
      <a href="../../web-parts/"><strong>WEB PARTS</strong></a>
      <a href="../" aria-current="location"><strong>BUILD NOTES</strong></a>
      <a href="../../about.html"><strong>ABOUT</strong></a>
    </nav>

    <main id="main" tabindex="-1">
      <article class="article-layout" aria-labelledby="article-title">
        <header class="article-header reveal" data-reveal-order="0">
          <p class="section-index">${escapeHtml(article.themeLabel)}</p>
          <h1 id="article-title">${escapeHtml(article.title)}</h1>
          <p class="article-header__lead">${escapeHtml(article.summary)}</p>
          <div class="note-meta"><time datetime="${date.machine}">${date.display}</time></div>
        </header>

        <aside class="article-toc reveal" data-reveal-order="1" data-reveal-threshold="0.01" aria-label="目次">
          <p>CONTENTS</p>
          <ol>
${tocItems}
          </ol>${renderReferences(article.references)}
        </aside>

        <div class="article-body">
${sections}
        </div>
      </article>
      <footer class="page-footer" aria-label="ページナビゲーション">
        <a class="page-footer__back" href="./"><span class="page-footer__icon" aria-hidden="true">←</span><span>BACK TO NOTE to SELF</span></a>
        <a class="page-footer__top" href="#main"><span>PAGE TOP</span><span class="page-footer__icon" aria-hidden="true">↑</span></a>
      </footer>
    </main>

    <script src="../../js/main.js" defer></script>
  </body>
</html>
`;
};

const renderRow = (article, href) => {
  const date = formatDate(article.publishedAt);
  return `          <li>
            <a class="note-row" href="${href}"><span>${escapeHtml(article.category)}</span><strong>${escapeHtml(article.title)}</strong><time datetime="${date.machine}">${date.display}</time><i aria-hidden="true">→</i></a>
          </li>`;
};

const replaceNoteList = (html, rows, className) => {
  const pattern = new RegExp(`(<ol class="${className.replaceAll(' ', '\\s+')}"[^>]*>)[\\s\\S]*?(<\\/ol>)`);
  if (!pattern.test(html)) throw new Error(`NOTE to SELF list not found: ${className}`);
  return html.replace(pattern, (_match, opening, closing) => `${opening}\n${rows}\n        ${closing}`);
};

const countCodingNotes = async (output) => {
  const file = join(output, 'build-notes/coding-note/index.html');
  const html = await readFile(file, 'utf8');
  return [...html.matchAll(/<a\b[^>]*class="[^"]*\bcoding-note-card\b[^"]*"[^>]*>/g)].length;
};

const updateHomeIndex = async (output, codingNoteCount, noteToSelfCount) => {
  const file = join(output, 'index.html');
  let html = await readFile(file, 'utf8');
  const total = codingNoteCount + noteToSelfCount;
  const pattern = /(<span class="home-tree__status" data-build-notes-count\s*>)[^<]*(<\/span\s*>)/;
  if (!pattern.test(html)) throw new Error('HOME BUILD NOTES count target not found');
  html = html.replace(pattern, `$1${twoDigits(total)} NOTES$2`);
  await writeFile(file, html);
};

const updateNoteArchive = async (output, entries) => {
  const file = join(output, 'build-notes/note-to-self/index.html');
  let html = await readFile(file, 'utf8');
  const rows = entries.map((entry) => renderRow(entry, `./${escapeAttribute(entry.slug)}.html`)).join('\n');
  html = replaceNoteList(html, rows, 'note-list reveal');
  html = html.replace(
    /<div class="page-heading__meta reveal">[\s\S]*?<\/div>/,
    `<div class="page-heading__meta reveal"><span>ALL: ${twoDigits(entries.length)}</span><span>PUBLISHED: ${twoDigits(entries.length)}</span></div>`,
  );
  html = html.replace(
    /<div class="directory-status"[\s\S]*?<\/div>/,
    `<div class="directory-status" aria-live="polite"><p><span>${twoDigits(entries.length)}</span> NOTES FOUND</p><p>NOTE to SELF</p></div>`,
  );
  await writeFile(file, html);
};

const updateBuildNotesIndex = async (output, entries, codingNoteCount) => {
  const file = join(output, 'build-notes/index.html');
  let html = await readFile(file, 'utf8');
  html = html.replace(/CODING NOTE: \d+/, `CODING NOTE: ${twoDigits(codingNoteCount)}`);
  html = html.replace(/NOTE to SELF: \d+/, `NOTE to SELF: ${twoDigits(entries.length)}`);
  html = html.replace(
    /(<span>CODING_NOTE_ARCHIVE<\/span><span>)\d+ NOTES/,
    `$1${twoDigits(codingNoteCount)} NOTES`,
  );

  const start = html.indexOf('<section class="build-log-overview build-log-overview--note-to-self');
  const end = html.indexOf('</section>', start);
  if (start < 0 || end < 0) throw new Error('BUILD NOTES NOTE to SELF section not found');
  const before = html.slice(0, start);
  let section = html.slice(start, end + '</section>'.length);
  const after = html.slice(end + '</section>'.length);
  const latest = entries.slice(0, 5);
  const rows = latest.map((entry) => renderRow(entry, `./note-to-self/${escapeAttribute(entry.slug)}.html`)).join('\n');
  section = replaceNoteList(section, rows, 'note-list');
  section = section.replace(
    /<div class="build-log-overview__meta">[\s\S]*?<\/div>/,
    `<div class="build-log-overview__meta"><span>DISPLAY: LATEST ${twoDigits(Math.min(entries.length, 5))}</span><span>PUBLISHED: ${twoDigits(entries.length)}</span></div>`,
  );
  await writeFile(file, before + section + after);
};

export const renderNotePages = async ({ output, entries }) => {
  const codingNoteCount = await countCodingNotes(output);
  for (const article of entries) {
    await writeFile(join(output, article.outputPath), renderDetailPage(article));
  }
  await updateNoteArchive(output, entries);
  await updateBuildNotesIndex(output, entries, codingNoteCount);
  await updateHomeIndex(output, codingNoteCount, entries.length);
  return entries.map((entry) => entry.outputPath);
};
