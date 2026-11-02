import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/base64-data-url-converter.js');

const converter = globalThis.MarkBenchBase64DataUrlConverter;
assert.ok(converter, 'Base64 / Data URL Converter module should be available');
assert.equal(converter.MAX_TEXT_LENGTH, 1_000_000);
assert.equal(converter.MAX_FILE_SIZE, 10 * 1024 * 1024);
assert.equal(converter.formatBytes(512), '512 B');
assert.equal(converter.formatBytes(1536), '1.5 KB');
assert.equal(converter.formatBytes(10 * 1024 * 1024), '10.00 MB');

assert.equal(converter.encodeText('Hello'), 'SGVsbG8=');
assert.equal(converter.decodeBase64ToText('SGVsbG8='), 'Hello');
assert.equal(converter.decodeBase64ToText('SGVsbG8'), 'Hello');
const japanese = '日本語と絵文字 🚀';
assert.equal(converter.decodeBase64ToText(converter.encodeText(japanese)), japanese);
assert.equal(converter.toBase64Url('++//AA=='), '--__AA');
assert.equal(converter.decodeBase64ToText(converter.toBase64Url(converter.encodeText(japanese))), japanese);
assert.throws(() => converter.base64ToBytes('A'), /Base64/u);
assert.throws(() => converter.base64ToBytes('%%%'), /Base64/u);

const textDataUrl = converter.buildDataUrl('text/plain', converter.encodeText('MARK BENCH'), { charset: 'utf-8' });
assert.equal(textDataUrl, 'data:text/plain;charset=utf-8;base64,TUFSSyBCRU5DSA==');
const parsedText = converter.parseDataUrl(textDataUrl);
assert.equal(parsedText.mime, 'text/plain');
assert.equal(parsedText.charset, 'utf-8');
assert.equal(parsedText.base64, true);
assert.equal(converter.decodeBytesToText(parsedText.bytes), 'MARK BENCH');

const percentDataUrl = converter.parseDataUrl('data:text/plain;charset=utf-8,Hello%20World%21');
assert.equal(percentDataUrl.base64, false);
assert.equal(converter.decodeBytesToText(percentDataUrl.bytes), 'Hello World!');
const defaultMime = converter.parseDataUrl('data:,plain%20text');
assert.equal(defaultMime.mime, 'text/plain');
assert.equal(converter.decodeBytesToText(defaultMime.bytes), 'plain text');
assert.throws(() => converter.parseDataUrl('https://example.com/image.png'), /Data URL/u);

const decodedDataUrl = converter.decodeInput(textDataUrl);
assert.equal(decodedDataUrl.sourceType, 'DATA URL');
assert.equal(decodedDataUrl.text, 'MARK BENCH');
const decodedBase64Url = converter.decodeInput(converter.toBase64Url(converter.encodeText('🚀')));
assert.equal(decodedBase64Url.sourceType, 'BASE64URL');
assert.equal(decodedBase64Url.text, '🚀');
const binary = converter.decodeInput('data:image/png;base64,iVBORw0KGgo=');
assert.equal(binary.mime, 'image/png');
assert.equal(binary.text, null);
assert.equal(binary.bytes.length, 8);
const rawBinary = converter.decodeInput('/9j/');
assert.equal(rawBinary.mime, 'application/octet-stream');
assert.equal(rawBinary.text, null);
assert.equal(converter.isTextMime('application/json'), true);
assert.equal(converter.isTextMime('image/svg+xml'), true);
assert.equal(converter.isTextMime('image/png'), false);
assert.equal(converter.extensionForMime('application/json'), 'json');
assert.equal(converter.extensionForMime('application/x-custom'), 'bin');

const page = await readFile(new URL('../tools/base64-data-url-converter.html', import.meta.url), 'utf8');
assert.match(page, /data-tool-id="base64-data-url-converter"/u);
assert.match(page, /js\/base64-data-url-converter\.js/u);
assert.match(page, /privacy-note__body/u);
assert.match(page, /data-tool-steps/u);
assert.match(page, /page-footer/u);

const directory = await readFile(new URL('../tools/index.html', import.meta.url), 'utf8');
assert.match(directory, /TOOLS: 25/u);
assert.match(directory, /data-filter="all">ALL <span>25<\/span>/u);
assert.match(directory, /data-filter="code">CODE <span>08<\/span>/u);
assert.match(directory, /data-keyword="Base64"/u);
assert.match(directory, /data-id="base64-data-url-converter"/u);
assert.match(directory, /href="\.\/base64-data-url-converter\.html"/u);

const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(home, /25 TOOLS/u);

const controller = await readFile(new URL('../js/tool.js', import.meta.url), 'utf8');
assert.match(controller, /'base64-data-url-converter'/u);
assert.match(controller, /kind: 'base64-converter'/u);
assert.match(controller, /renderBase64DataUrlConverter/u);

const moduleSource = await readFile(new URL('../js/base64-data-url-converter.js', import.meta.url), 'utf8');
assert.match(moduleSource, /data-base64-mode-button/u);
assert.match(moduleSource, /data-base64-drop-zone/u);
assert.match(moduleSource, /DATA INSPECTOR/u);

const styles = await readFile(new URL('../css/pages.css', import.meta.url), 'utf8');
assert.match(styles, /\.workspace-grid--base64-converter/u);
assert.match(styles, /\.base64-converter__drop-zone/u);
assert.match(styles, /\.base64-converter__metrics/u);
assert.match(styles, /\.base64-converter__preview \{ display: grid; grid-template-rows: auto minmax\(0, 1fr\); \}/u);
assert.match(styles, /\.base64-converter__preview-body \{[^}]*height: 100%;[^}]*grid-template-rows: minmax\(18rem, 1fr\) auto;/u);

console.log('Base64 / Data URL Converter checks passed.');
