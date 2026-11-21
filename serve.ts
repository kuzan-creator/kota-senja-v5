// Kota Senja v5 — server statis kecil untuk main lokal (Node 22, stdlib saja).
// Menayangkan folder game/ di http://localhost:8080 — jalankan `node serve.ts`
// lalu buka alamat itu di browser. Bukan server produksi: hanya membaca file
// di bawah game/, menolak path yang keluar dari sana, dan tidak mencatat apa pun.
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_ROOT = path.resolve(fileURLToPath(new URL('./game', import.meta.url)));

const TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.wav', 'audio/wav'],
  ['.mp3', 'audio/mpeg'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function pickPort() {
  const fromFlag = process.argv.indexOf('--port');
  const raw = fromFlag === -1 ? process.env.PORT : process.argv[fromFlag + 1];
  const n = Number(raw ?? 8080);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : 8080;
}

function safeTarget(requestPath) {
  let cleaned = requestPath;
  try {
    cleaned = decodeURIComponent(requestPath);
  } catch {
    return null;
  }
  if (cleaned.endsWith('/')) cleaned += 'index.html';
  const target = path.resolve(path.join(WEB_ROOT, path.normalize(cleaned)));
  if (target !== WEB_ROOT && !target.startsWith(WEB_ROOT + path.sep)) return null;
  return target;
}

const server = http.createServer((req, res) => {
  const where = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
  const target = safeTarget(where);
  if (target === null) {
    res.writeHead(400, { 'content-type': 'text/plain' });
    res.end('bad request');
    return;
  }
  let body;
  try {
    const info = fs.statSync(target);
    if (!info.isFile()) throw new Error('bukan file');
    body = fs.readFileSync(target);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  const kind = TYPES.get(path.extname(target).toLowerCase()) ?? 'application/octet-stream';
  res.writeHead(200, { 'content-type': kind, 'content-length': body.length, 'cache-control': 'no-store' });
  res.end(body);
});

const port = pickPort();
server.listen(port, '127.0.0.1', () => {
  console.log('Kota Senja v5 dimainkan di http://localhost:' + port + ' (root: game/)');
});
