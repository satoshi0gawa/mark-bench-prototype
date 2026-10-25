import assert from 'node:assert/strict';

import fixture from '../content/build-logs.fixture.mjs';
import { loadBuildLogs, normalizeBuildLogs, sanitizeRichText } from './lib/build-log-content.mjs';
import { renderBuildLogDetail, renderBuildLogIndex } from './templates/build-log-pages.mjs';

const normalized = normalizeBuildLogs(structuredClone(fixture));
assert.equal(normalized.length, 4);
assert.equal(normalized[0].logNumber, 'BUILD_LOG_004');
assert.equal(normalized.at(-1).displayStatus, 'planned');

const unsafe = '<p onclick="alert(1)">safe</p><script>alert(1)</script><a href="javascript:alert(1)">link</a>';
const sanitized = sanitizeRichText(unsafe);
assert.equal(sanitized.includes('onclick'), false);
assert.equal(sanitized.includes('<script'), false);
assert.equal(sanitized.includes('javascript:'), false);
assert.equal(sanitized.includes('<p>safe</p>'), true);

const indexHtml = renderBuildLogIndex(normalized, { source: 'fixture' });
assert.equal(indexHtml.includes('ALL: 04'), true);
assert.equal(indexHtml.includes('PUBLISHED: 02'), true);
assert.equal(indexHtml.includes('BUILD_NOTE_XXX'), true);

const detailHtml = renderBuildLogDetail(normalized[0]);
assert.equal(detailHtml.includes('class="article-layout"'), true);
assert.equal(detailHtml.includes('class="article-toc reveal"'), true);
assert.equal(detailHtml.includes('../tools/px-rem-converter.html'), true);

const duplicate = structuredClone(fixture);
duplicate[1].slug = duplicate[0].slug;
assert.throws(() => normalizeBuildLogs(duplicate), /slugs must be unique/);

const previousDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const previousApiKey = process.env.MICROCMS_API_KEY;
delete process.env.MICROCMS_SERVICE_DOMAIN;
delete process.env.MICROCMS_API_KEY;
await assert.rejects(() => loadBuildLogs({ source: 'microcms' }), /MICROCMS_SERVICE_DOMAIN is required/);
if (previousDomain) process.env.MICROCMS_SERVICE_DOMAIN = previousDomain;
if (previousApiKey) process.env.MICROCMS_API_KEY = previousApiKey;

console.log('BUILD LOG content, sanitization, and template tests passed.');
