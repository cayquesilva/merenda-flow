import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const VERSION = process.env.APP_VERSION || '2.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // 1. Protocolo office-health/1: Manifesto
  if (urlPath === '/.well-known/office-health') {
    const manifestPath = path.join(DIST_DIR, '.well-known', 'office-health');
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    });
    if (fs.existsSync(manifestPath)) {
      return fs.createReadStream(manifestPath).pipe(res);
    }
    return res.end(
      JSON.stringify({
        protocol: 'office-health/1',
        name: 'Merenda Flow Frontend',
        kind: 'web',
        endpoints: {
          liveness: '/healthz',
          version: '/version.json',
        },
        performance: [{ path: '/' }],
        related: ['https://api.merenda.portaleducampina.com.br'],
      })
    );
  }

  // 2. Protocolo office-health/1: Liveness
  if (urlPath === '/healthz' || urlPath === '/health') {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    return res.end('healthy\n');
  }

  // 3. Protocolo office-health/1: Versão
  if (urlPath === '/version.json') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    const versionPath = path.join(DIST_DIR, 'version.json');
    if (fs.existsSync(versionPath)) {
      return fs.createReadStream(versionPath).pipe(res);
    }
    return res.end(JSON.stringify({ version: VERSION }));
  }

  // 4. Arquivos estáticos físicos do dist
  const normalizedPath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(DIST_DIR, normalizedPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const cacheControl = ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    });
    return fs.createReadStream(filePath).pipe(res);
  }

  // 5. Fallback SPA (todas as rotas da aplicação caem no index.html)
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend Merenda Flow ouvindo na porta ${PORT}`);
});
