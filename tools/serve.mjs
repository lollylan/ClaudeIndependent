// Kleiner statischer Server für die lokale Vorschau: `npm start`, dann http://localhost:4173
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT) || 4173;
const typen = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (anfrage, antwort) => {
  try {
    let pfad = decodeURIComponent(new URL(anfrage.url, 'http://localhost').pathname);
    if (pfad.endsWith('/')) pfad += 'index.html';
    const datei = normalize(join(wurzel, pfad));
    if (datei !== wurzel && !datei.startsWith(wurzel + sep)) throw new Error('außerhalb');
    const inhalt = await readFile(datei);
    antwort.writeHead(200, { 'Content-Type': typen[extname(datei)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    antwort.end(inhalt);
  } catch {
    antwort.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    antwort.end('Nicht gefunden');
  }
}).listen(port, '127.0.0.1', () => console.log(`Stichtag läuft auf http://localhost:${port}`));
