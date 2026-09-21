import { API_URL, makePayload, redact } from '../src/lib/playground.mjs';

const origins = new Set(['https://jevcn.com', 'https://www.jevcn.com']);
const json = (status, data) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});
async function readLimited(stream, limit) {
  if (!stream) throw new Error('empty_body');
  const reader = stream.getReader();
  const chunks = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error('body_too_large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export function createWorker(fetcher = fetch, timeoutMs = 25000) {
  return { async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (url.pathname !== '/api/systemone') return json(404, { error: 'not_found' });
    if (url.search) return json(400, { error: 'query_not_allowed' });
    if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });
    if (!origins.has(url.origin) || request.headers.get('Origin') !== url.origin ||
      (request.headers.has('Sec-Fetch-Site') && request.headers.get('Sec-Fetch-Site') !== 'same-origin')) return json(403, { error: 'invalid_origin' });
    if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') return json(415, { error: 'json_required' });
    const auth = request.headers.get('Authorization') ?? '';
    if (!/^Bearer [^\s]+$/.test(auth) || auth.length > 4096) return json(401, { error: 'key_required' });
    let body;
    try {
      const incoming = await readLimited(request.body, 100000);
      const q = incoming.questions?.result;
      body = makePayload({ model: incoming.model, state: incoming.state, type: q?.type, instructions: q?.instructions, criteria: JSON.stringify(q?.criteria) });
    } catch (error) { return json(error.message === 'body_too_large' ? 413 : 400, { error: 'invalid_request' }); }
    try {
      // Cloudflare provides this header. Origin checking is not authentication.
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip || !env.PLAYGROUND_RATE_LIMITER) return json(503, { error: 'relay_unavailable' });
      if (!(await env.PLAYGROUND_RATE_LIMITER.limit({ key: `playground:${ip}` })).success) return json(429, { error: 'rate_limited' });
    } catch { return json(503, { error: 'relay_unavailable' }); }
    const controller = new AbortController();
    const cancel = () => controller.abort();
    request.signal.addEventListener('abort', cancel, { once: true });
    if (request.signal.aborted) cancel();
    const timer = setTimeout(cancel, timeoutMs);
    try {
      const response = await fetcher(API_URL, {
        method: 'POST', redirect: 'manual', signal: controller.signal,
        headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      // workerd rejects redirect: 'error'; manual never follows a Location with credentials.
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        return json(502, { error: 'upstream_redirect_rejected' });
      }
      if (!response.ok) {
        await response.body?.cancel();
        return json([401, 403, 422, 429].includes(response.status) ? response.status : 502, { error: 'upstream_request_failed' });
      }
      const data = await readLimited(response.body, 1000000);
      if (!data?.answers?.result) return json(502, { error: 'invalid_upstream_response' });
      return json(200, JSON.parse(redact(JSON.stringify(data), auth.slice(7))));
    } catch { return json(controller.signal.aborted ? 504 : 502, { error: 'upstream_request_failed' }); }
    finally { clearTimeout(timer); request.signal.removeEventListener('abort', cancel); }
  } };
}
export default createWorker();
