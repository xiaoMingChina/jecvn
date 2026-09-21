import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

test('workerd forwards exactly once and refuses upstream redirects', async () => {
  const bundle = await build({ stdin: { contents: `
    import worker from './worker/index.js';
    export default { fetch(request) {
      return worker.fetch(request, { PLAYGROUND_RATE_LIMITER: {limit: async () => ({success:true})} });
    } };`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'browser' });
  for (const status of [200, 401, 302]) {
    const mf = new Miniflare(convertV4MiniflareOptions({ workers: [
      { name: 'relay', modules: true, compatibilityDate: '2026-09-01', script: bundle.outputFiles[0].text, outboundService: 'upstream' },
      { name: 'upstream', modules: true, compatibilityDate: '2026-09-01', script: `
        let calls=0;
        export default {async fetch(request){
          calls++;
          if (calls !== 1 || request.url !== 'https://api.typesafe.ai/v1/systemone' || request.headers.get('Authorization') !== 'Bearer runtime-test-key') return new Response('unexpected request', {status:500});
          return new Response(JSON.stringify({answers:{result:{type:'noul',noul:0.9}}}), {status:${status},headers:{'Content-Type':'application/json',Location:'https://untrusted.example/'}});
        }};` }
    ] }));
    try {
      const response = await mf.dispatchFetch('https://jevcn.com/api/systemone', {
        method: 'POST', headers: { Origin: 'https://jevcn.com', 'Content-Type': 'application/json', Authorization: 'Bearer runtime-test-key', 'CF-Connecting-IP': '192.0.2.1' },
        body: JSON.stringify({model:'jev-latest',state:'test',questions:{result:{type:'noul',instructions:'Is this a test?',criteria:{true:'yes',false:'no'}}}}),
      });
      assert.equal(response.status, status === 302 ? 502 : status);
      const data=await response.json();
      if(status===200) assert.equal(data.answers.result.noul,0.9);
      if(status===302) assert.equal(data.error,'upstream_redirect_rejected');
    } finally { await mf.dispose(); }
  }
});
