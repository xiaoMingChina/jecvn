import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import { makePayload } from '../src/lib/playground.mjs';

export const HOST = '127.0.0.1:4322';
export const ORIGIN = `http://${HOST}`;
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.wasm': 'application/wasm' };
export function createHandler(decide = async (key, body, signal) => {
  const client = new TypeSafeClient({ apiKey: key, baseURL: 'https://api.typesafe.ai', logLevel: 'off', retry: { maxRetries: 0 }, timeout: 25000 });
  return client.systemOne(body, { signal });
}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    const send = (code, body) => { if (res.destroyed) return; res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    // Fixed loopback host and same-origin POST protect the local relay from other sites.
    if (req.headers.host !== HOST) return send(403, { error: 'invalid_host' });
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, ORIGIN).pathname); } catch { return send(400, { error: 'invalid_path' }); }
    if (pathname === '/api/systemone') {
      if (req.method !== 'POST') return send(405, { error: 'method_not_allowed' });
      if (req.headers.origin !== ORIGIN || (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin')) return send(403, { error: 'invalid_origin' });
      if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'json_required' });
      const auth = req.headers.authorization ?? '';
      if (!auth.startsWith('Bearer ') || !auth.slice(7).trim() || auth.length > 4096) return send(401, { error: 'key_required' });
      const chunks = []; let bytes = 0;
      try {
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 100000) { send(413, { error: 'body_too_large' }); return; }
          chunks.push(chunk);
        }
        const incoming = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const q = incoming.questions?.result;
        const body = makePayload({ model: incoming.model, state: incoming.state, type: q?.type, instructions: q?.instructions, criteria: JSON.stringify(q?.criteria) });
        const abort = new AbortController();
        res.on('close', () => abort.abort());
        try { const data = await decide(auth.slice(7).trim(), body, abort.signal); send(200, data); }
        catch (error) { const code = [401, 403, 422, 429].includes(error.status) ? error.status : 502; send(code, { error: 'upstream_request_failed' }); }
      } catch { send(400, { error: 'invalid_request' }); }
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) return send(405, { error: 'method_not_allowed' });
    try {
      let path = resolve(root, `.${pathname}`);
      if (path !== resolve(root) && !path.startsWith(root.endsWith(sep) ? root : root + sep)) return send(404, { error: 'not_found' });
      if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
      const data = await readFile(path);
      res.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream' }); res.end(req.method === 'HEAD' ? undefined : data);
    } catch { send(404, { error: 'not_found' }); }
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { await stat(resolve(root, 'playground/index.html')); }
  catch { console.error('请先运行 npm run build，生成 Playground 静态页面。'); process.exit(1); }
  const server = createServer(createHandler());
  server.requestTimeout = 35000;
  server.on('error', () => { console.error('无法启动本地 Playground，请检查 4322 端口是否被占用。'); process.exitCode = 1; });
  server.listen(4322, '127.0.0.1', () => console.log(`本地 Playground：${ORIGIN}/playground/\n仅监听本机，不记录 Key 或请求内容。按 Ctrl+C 停止。`));
}
