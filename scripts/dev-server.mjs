import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { renderHomeToolsCount } from './content/render-home-tools-count.mjs';
import { renderHomeWebPartsCount } from './content/render-home-web-parts-count.mjs';

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host}`);
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const relativePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]/, '');
    let filePath = join(root, relativePath);
    let info = await stat(filePath);
    if (info.isDirectory()) {
      filePath = join(filePath, 'index.html');
      info = await stat(filePath);
    }
    if (!info.isFile()) throw new Error('Not a file');
    let content = await readFile(filePath);
    if (filePath === join(root, 'index.html')) {
      const [toolsDirectory, partsDirectory] = await Promise.all([
        readFile(join(root, 'tools/index.html'), 'utf8'),
        readFile(join(root, 'web-parts/index.html'), 'utf8'),
      ]);
      content = renderHomeToolsCount(content.toString('utf8'), toolsDirectory);
      content = renderHomeWebPartsCount(content, partsDirectory);
    }
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('404 / File not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`MARK BENCH is running at http://localhost:${port}`);
});
