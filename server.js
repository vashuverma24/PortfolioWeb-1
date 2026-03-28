const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const askAiHandler = require('./api/ask-ai');

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 3000);
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

const loadEnvFile = async (fileName) => {
  const filePath = path.join(ROOT, fileName);

  try {
    const content = await fs.readFile(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) return;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch {
    // Ignore missing env files.
  }
};

const getSafeFilePath = (pathname) => {
  const rawPath = pathname === '/' ? '/index.html' : pathname;
  const relativePath = decodeURIComponent(rawPath).replace(/^\/+/, '');
  const normalizedPath = path.normalize(relativePath);

  if (normalizedPath.startsWith('..')) {
    return null;
  }

  return path.join(ROOT, normalizedPath);
};

const serveStaticFile = async (req, res, pathname) => {
  const filePath = getSafeFilePath(pathname);

  if (!filePath) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME_TYPES[extension] || 'application/octet-stream');
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
};

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });

    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });

const startServer = async () => {
  await loadEnvFile('.env.local');
  await loadEnvFile('.env');

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);

    if (url.pathname === '/api/ask-ai') {
      try {
        req.body = await readRequestBody(req);
        await askAiHandler(req, res);
      } catch {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Local server request failed' }));
      }
      return;
    }

    await serveStaticFile(req, res, url.pathname);
  });

  server.listen(PORT, () => {
    console.log(`Portfolio running at http://localhost:${PORT}`);
  });
};

startServer();
