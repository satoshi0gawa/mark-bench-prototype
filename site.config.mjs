import { basename } from 'node:path';

export const siteConfig = Object.freeze({
  name: 'MARK BENCH',
  baseUrl: 'https://satoshi0gawa.github.io/mark-bench-prototype/',
  defaultDescription: 'MARK BENCHのツール、再利用するWEB PARTS、制作記録、サイト案内への入口。',
  language: 'ja',
  locale: 'ja_JP',
  themeColor: '#18243b',
  defaultOgImage: 'assets/og/og-default.png',
  faviconSvg: 'assets/icons/favicon.svg',
  faviconPng: 'assets/icons/favicon-32.png',
  appleTouchIcon: 'assets/icons/apple-touch-icon.png',
  googleFontsUrl:
    'https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Space+Mono:wght@400;700&display=swap',
});

export const isNoindexPage = (htmlFile) => basename(htmlFile).startsWith('test-');

export const isArticlePage = (htmlFile) =>
  htmlFile.startsWith('build-notes/') && !htmlFile.endsWith('/index.html');
