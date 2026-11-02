import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/meta-tags-ogp-builder.js');

const builder = globalThis.MarkBenchMetaTagsOgpBuilder;
assert.ok(builder, 'Meta Tags & OGP Builder module should be available');
assert.equal(builder.MAX_TITLE_LENGTH, 200);
assert.equal(builder.MAX_DESCRIPTION_LENGTH, 500);
assert.equal(builder.MAX_URL_LENGTH, 2000);
assert.equal(builder.escapeAttribute('A&B"<>'), 'A&amp;B&quot;&lt;&gt;');
assert.equal(builder.isAbsoluteHttpUrl('https://example.com/page'), true);
assert.equal(builder.isAbsoluteHttpUrl('/relative/path'), false);
assert.equal(builder.isAbsoluteHttpUrl('javascript:alert(1)'), false);
assert.equal(builder.isThemeColor('#18243b'), true);
assert.equal(builder.isThemeColor('#abc'), true);
assert.equal(builder.isThemeColor('navy'), false);
assert.equal(builder.normalizeHandle('markbench'), '@markbench');
assert.equal(builder.normalizeHandle('@markbench'), '@markbench');

const empty = builder.generate();
assert.equal(empty.hasErrors, true);
assert.ok(empty.warnings.some((warning) => warning.code === 'TITLE_REQUIRED'));
assert.ok(empty.warnings.some((warning) => warning.code === 'DESCRIPTION_EMPTY'));
assert.ok(empty.warnings.some((warning) => warning.code === 'IMAGE_EMPTY'));
assert.match(empty.html, /<meta name="robots" content="index, follow">/u);
assert.match(empty.html, /<meta property="og:type" content="website">/u);

const complete = builder.generate({
  title: 'MARK BENCH | Web制作ツール',
  description: 'Web制作で繰り返し使えるツールと実装ノートをまとめています。',
  canonical: 'https://example.com/tools/meta-tags-ogp-builder',
  themeColor: '#18243b',
  ogType: 'article',
  siteName: 'MARK BENCH',
  locale: 'ja_JP',
  image: 'https://example.com/assets/ogp.jpg',
  imageAlt: 'MARK BENCHのOGP画像',
  twitterCard: 'summary_large_image',
  twitterSite: 'markbench',
});
assert.equal(complete.hasErrors, false);
assert.equal(complete.resolved.ogTitle, complete.values.title);
assert.equal(complete.resolved.ogDescription, complete.values.description);
assert.equal(complete.resolved.ogUrl, complete.values.canonical);
assert.equal(complete.values.twitterSite, '@markbench');
assert.equal(complete.metrics.basicTags, 5);
assert.equal(complete.metrics.ogTags, 8);
assert.equal(complete.metrics.twitterTags, 6);
assert.equal(complete.metrics.tags, 19);
assert.match(complete.html, /<title>MARK BENCH \| Web制作ツール<\/title>/u);
assert.match(complete.html, /<link rel="canonical" href="https:\/\/example\.com\/tools\/meta-tags-ogp-builder">/u);
assert.match(complete.html, /<meta property="og:type" content="article">/u);
assert.match(complete.html, /<meta name="twitter:site" content="@markbench">/u);

const override = builder.generate({
  title: 'SEO title',
  description: 'SEO description',
  ogTitle: 'Social title',
  ogDescription: 'Social description',
  canonical: 'https://example.com/seo',
  ogUrl: 'https://example.com/social',
  robotsIndex: false,
  robotsFollow: false,
  robotsNoarchive: true,
});
assert.equal(override.resolved.ogTitle, 'Social title');
assert.equal(override.resolved.ogDescription, 'Social description');
assert.equal(override.robots, 'noindex, nofollow, noarchive');
assert.match(override.html, /content="noindex, nofollow, noarchive"/u);
assert.ok(override.warnings.some((warning) => warning.code === 'URL_MISMATCH'));

const invalid = builder.generate({
  title: 'A'.repeat(80),
  description: 'B'.repeat(180),
  canonical: '/relative',
  ogUrl: 'ftp://example.com/page',
  image: 'image.jpg',
  themeColor: 'navy',
});
const invalidCodes = invalid.warnings.map((warning) => warning.code);
assert.ok(invalidCodes.includes('TITLE_LENGTH'));
assert.ok(invalidCodes.includes('DESCRIPTION_LENGTH'));
assert.ok(invalidCodes.includes('CANONICAL_URL'));
assert.ok(invalidCodes.includes('OG_URL'));
assert.ok(invalidCodes.includes('IMAGE_URL'));
assert.ok(invalidCodes.includes('THEME_COLOR'));
assert.doesNotMatch(invalid.html, /theme-color/u);

const escaped = builder.generate({ title: '<script>"&', description: 'A&B', siteName: '"Site"' });
assert.match(escaped.html, /<title>&lt;script&gt;&quot;&amp;<\/title>/u);
assert.match(escaped.html, /content="A&amp;B"/u);
assert.doesNotMatch(escaped.html, /<script>/u);

const page = await readFile(new URL('../tools/meta-tags-ogp-builder.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="meta-tags-ogp-builder"/u);
assert.match(page, /js\/meta-tags-ogp-builder\.js/u);
assert.match(page, /privacy-note__body/u);
assert.match(page, /data-tool-steps/u);
assert.match(page, /page-footer/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
assert.match(directory, /TOOLS: 25/u);
assert.match(directory, /data-filter="all">ALL <span>25<\/span>/u);
assert.match(directory, /data-filter="code">CODE <span>08<\/span>/u);
assert.match(directory, /data-keyword="OGP"/u);
assert.match(directory, /data-id="meta-tags-ogp-builder"/u);
assert.match(directory, /href="\.\/meta-tags-ogp-builder\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /25 TOOLS/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /'meta-tags-ogp-builder'/u);
assert.match(controller, /kind: 'meta-builder'/u);
assert.match(controller, /renderMetaTagsOgpBuilder/u);

const moduleSource = await readFile(new URL('../js/meta-tags-ogp-builder.js', import.meta.url), 'utf8');
assert.match(moduleSource, /data-meta-preview-title/u);
assert.match(moduleSource, /data-copy-meta-tags/u);
assert.match(moduleSource, /data-meta-warnings/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.workspace-grid--meta-builder/u);
assert.match(styles, /\.meta-builder__social-preview/u);
assert.match(styles, /\.meta-builder__warnings/u);

console.log('Meta Tags & OGP Builder checks passed.');
