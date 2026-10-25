import { TOOL_CATALOG } from '../config/tools.mjs';

export const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const dateParts = (value) => Object.fromEntries(
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]),
);

const formatDate = (value) => {
  const { year, month, day } = dateParts(value);
  return {
    machine: `${year}-${month}-${day}`,
    display: `${year}.${month}.${day}`,
  };
};

const renderHead = ({ title, description, ogImage }) => `  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="theme-color" content="#18243b" />
    <title>${escapeHtml(title)}</title>
${ogImage ? `    <meta property="og:image" content="${escapeHtml(ogImage.url)}" />\n` : ''}    <script>document.documentElement.classList.replace('no-js', 'js');</script>
    <link rel="stylesheet" href="../css/foundation.css" />
    <link rel="stylesheet" href="../css/components.css" />
    <link rel="stylesheet" href="../css/pages.css" />
  </head>`;

const renderShellStart = ({ breadcrumbCurrent, breadcrumbParent = false }) => `<body data-site="coding-note" data-page="blog">
    <a class="skip-link" href="#main">本文へ移動</a>
    <header class="site-header">
      <div class="site-header__bar">
        <nav class="site-breadcrumb-logo" aria-label="パンくずリスト">
          <a class="site-logo" href="../index.html">MARK BENCH</a>
          <span class="site-breadcrumb-logo__separator" aria-hidden="true">/</span>
${breadcrumbParent ? `          <a class="site-breadcrumb-logo__parent" href="./">BUILD LOGS</a>\n          <span class="site-breadcrumb-logo__separator" aria-hidden="true">/</span>\n` : ''}          <span class="site-breadcrumb-logo__current" aria-current="page">${escapeHtml(breadcrumbCurrent)}</span>
        </nav>
      </div>
    </header>

    <nav class="site-rail-navigation" aria-label="主要ナビゲーション">
      <a href="../tools/"><strong>TOOLS</strong></a>
      <a href="./" aria-current="location"><strong>BUILD LOGS</strong></a>
      <a href="../about.html"><strong>ABOUT</strong></a>
    </nav>`;

const renderShellEnd = `
    <script src="../js/main.js" defer></script>
  </body>
</html>
`;

const renderLogRow = (entry) => {
  if (entry.displayStatus === 'planned') {
    return `          <li data-log-status="planned">
            <div class="note-row is-disabled"><span>${escapeHtml(entry.logNumber)}</span><strong>${escapeHtml(entry.title)}</strong><small>PLANNED</small><i aria-hidden="true">×</i></div>
          </li>`;
  }
  const date = formatDate(entry.displayDate);
  return `          <li data-log-status="published">
            <a class="note-row" href="./${escapeHtml(entry.slug)}.html"><span>${escapeHtml(entry.logNumber)}</span><strong>${escapeHtml(entry.title)}</strong><time datetime="${date.machine}">${date.display}</time><i aria-hidden="true">→</i></a>
          </li>`;
};

export const renderBuildLogIndex = (entries, { source }) => {
  const published = entries.filter((entry) => entry.displayStatus === 'published');
  const planned = entries.filter((entry) => entry.displayStatus === 'planned');
  const count = (value) => String(value).padStart(2, '0');
  const sourceLabel = source === 'microcms' ? 'MICROCMS DATA' : 'FIXTURE DATA';

  return `<!doctype html>
<html lang="ja" class="no-js">
${renderHead({
    title: 'BUILD LOGS | MARK BENCH',
    description: 'MARK BENCHの制作・検証記録を掲載するBUILD LOGSです。',
  })}
  ${renderShellStart({ breadcrumbCurrent: 'BUILD LOGS' })}

    <main id="main" tabindex="-1">
      <header class="page-heading">
        <p class="section-index reveal">LOG_ARCHIVE</p>
        <div class="page-heading__main reveal"><h1>BUILD LOGS</h1></div>
        <div class="page-heading__meta reveal" data-log-counts><span>ALL: ${count(entries.length)}</span><span>PUBLISHED: ${count(published.length)}</span><span>PLANNED: ${count(planned.length)}</span></div>
      </header>

      <section class="build-log-directory" aria-labelledby="archive-title">
        <h2 class="visually-hidden" id="archive-title">BUILD LOGS一覧</h2>
        <ol class="note-list reveal" data-reveal-threshold="0.01">
${entries.map(renderLogRow).join('\n')}
        </ol>
        <div class="directory-status" aria-live="polite"><p><span data-log-total>${count(entries.length)}</span> LOGS FOUND</p><p>${sourceLabel} / BUILD 0.2.0</p></div>
      </section>
    </main>
${renderShellEnd}`;
};

const renderCallout = (section) => {
  if (!section.calloutLabel) return '';
  return `
            <div class="article-callout"><strong>${escapeHtml(section.calloutLabel)}</strong>${section.calloutBody}</div>`;
};

const renderCta = (entry) => {
  const tool = TOOL_CATALOG[entry.relatedToolId];
  return `
            <div class="article-callout article-callout--cta">
              <strong>TRY THE TOOL</strong>
              <p>${escapeHtml(entry.ctaDescription)}</p>
              <a class="button button--primary" href="${tool.href}">${escapeHtml(entry.ctaLabel)} <span>→</span></a>
            </div>`;
};

const renderSection = (section, index, entry) => {
  const sectionId = `section-${index + 1}`;
  const isLast = index === entry.sections.length - 1;
  return `          <section class="article-section reveal" id="${sectionId}" aria-labelledby="${sectionId}-title" data-reveal-threshold="0.01">
            <p class="section-index">${escapeHtml(section.sectionNumber)} / ${escapeHtml(section.sectionLabel)}</p>
            <h2 id="${sectionId}-title">${escapeHtml(section.heading)}</h2>
            ${section.body}${renderCallout(section)}${isLast ? renderCta(entry) : ''}
          </section>`;
};

export const renderBuildLogDetail = (entry) => {
  const date = formatDate(entry.displayDate);
  return `<!doctype html>
<html lang="ja" class="no-js">
${renderHead({
    title: `${entry.title} | MARK BENCH`,
    description: entry.summary,
    ogImage: entry.ogImage,
  })}
  ${renderShellStart({ breadcrumbCurrent: entry.title, breadcrumbParent: true })}

    <main id="main" tabindex="-1">
      <article class="article-layout" aria-labelledby="article-title">
        <header class="article-header reveal" data-reveal-order="0"><p class="section-index">${escapeHtml(entry.logNumber)} / ${escapeHtml(entry.category)}</p><h1 id="article-title">${escapeHtml(entry.title)}</h1><p class="article-header__lead">${escapeHtml(entry.summary)}</p><div class="note-meta"><span>${date.display}</span><span>${entry.readingTime} MIN READ</span><span>PUBLISHED</span></div></header>

        <aside class="article-toc reveal" data-reveal-order="1" aria-label="目次"><p>CONTENTS</p><ol>${entry.sections.map((section, index) => `<li><a href="#section-${index + 1}">${escapeHtml(section.heading)}</a></li>`).join('')}</ol></aside>

        <div class="article-body">
${entry.sections.map((section, index) => renderSection(section, index, entry)).join('\n\n')}
        </div>
      </article>
    </main>
${renderShellEnd}`;
};

export const renderHomeWithCount = (html, totalCount) => {
  const count = String(totalCount).padStart(2, '0');
  const hook = /(<span class="home-tree__status" data-build-log-count>)[^<]*(<\/span>)/;
  if (!hook.test(html)) throw new Error('HOME build log count hook was not found');
  return html.replace(hook, `$1${count} LOGS$2`);
};
