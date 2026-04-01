import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { loadLocalEnv } from './src/utils/loadEnv.js';
import { handleGeminiRequest } from './src/routes/gemini.js';
import { handleProfileRequest } from './src/routes/profile.js';

loadLocalEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');
const shouldServeFrontend = process.env.NODE_ENV === 'production' && fs.existsSync(indexPath);
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const PORT = Number(process.env.PORT || (process.env.NODE_ENV === 'production' ? 10000 : 4000));

const requiredConfig = [
  ['SUPABASE_URL or VITE_SUPABASE_URL', process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL],
  ['SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY],
  ['API_KEY_ENCRYPTION_SECRET', process.env.API_KEY_ENCRYPTION_SECRET],
];

const missingConfig = requiredConfig
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingConfig.length > 0) {
  console.error('Server startup failed. Missing required config for encrypted key storage:');
  for (const name of missingConfig) {
    console.error(`- ${name}`);
  }
  process.exit(1);
}

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const readRequestBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error('Invalid JSON body');
  }
};

const serveStaticFile = (req, res, pathname) => {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(distPath, safePath);

  if (!filePath.startsWith(distPath) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return false;
  }

  const extension = path.extname(filePath);
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
  };

  res.writeHead(200, { 'Content-Type': contentTypes[extension] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
  return true;
};

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { error: 'Bad request' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;

  if (pathname.startsWith('/api/profile')) {
    try {
      const body = req.method === 'PUT' ? await readRequestBody(req) : {};
      await handleProfileRequest({ body, pathname, req, res });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid request';
      sendJson(res, 400, { error: message });
    }
    return;
  }

  if (pathname.startsWith('/api/gemini')) {
    try {
      const body = await readRequestBody(req);
      await handleGeminiRequest({ body, pathname, req, res });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid request';
      sendJson(res, 400, { error: message });
    }
    return;
  }

  if (shouldServeFrontend) {
    if (req.method === 'GET' && serveStaticFile(req, res, pathname)) {
      return;
    }

    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexPath).pipe(res);
      return;
    }
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
