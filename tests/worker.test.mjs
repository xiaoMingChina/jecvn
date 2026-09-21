import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorker } from '../worker/index.js';
import { makePayload, presets, API_URL } from '../src/lib/playground.mjs';
const body = makePayload({ ...presets.choice, type: 'choice', model: 'jev-latest', criteria: JSON.stringify(presets.choice.criteria) });
const env = { PLAYGROUND_RATE_LIMITER: { limit: async () => ({ success: true }) }, ASSETS: { fetch: async () => new Response('static') } };
const req = (headers = {}, data = body, path = '/api/systemone') => new Request(`https://jevcn.com${path}`, { method: 'POST', headers: { Origin: 'https://jevcn.com', Authorization: 'Bearer test-key', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...headers }, body: typeof data === 'string' ? data : JSON.stringify(data) });
test('invalid inputs, cross-site requests and rate limits never reach upstream', async () => {
 let calls=0; const w=createWorker(async()=>{calls++;throw Error();});
 for (const [r,code] of [[req({Origin:'https://evil.example'}),403],[req({Authorization:''}),401],[req({'Content-Type':'text/plain'}),415],[req({},{}),400],[req({},'x'.repeat(100001)),413],[req({},body,'/api/other'),404],[req({},body,'/api/systemone?key=bad'),400]]) assert.equal((await w.fetch(r,env)).status,code);
 assert.equal((await w.fetch(req(),{...env,PLAYGROUND_RATE_LIMITER:{limit:async()=>({success:false})}})).status,429);
 assert.equal((await w.fetch(req(),{})).status,503); assert.equal(calls,0);
 assert.equal(await (await w.fetch(new Request('https://jevcn.com/playground/'),env)).text(),'static');
});
test('one fixed upstream request, no forwarded cookies, redacted response, no cache', async()=>{
 let calls=0;const w=createWorker(async(url,options)=>{
  calls++;assert.equal(url,API_URL);assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer test-key');assert.equal(options.headers.Cookie,undefined);assert.deepEqual(JSON.parse(options.body),body);
  return Response.json({answers:{result:{choice:'test-key'}}});
 });
 const r=await w.fetch(req({Cookie:'private-cookie'}),env);assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.ok(!(await r.text()).includes('test-key'));assert.equal(calls,1);
});
test('upstream errors and malformed responses are sanitized without retries',async()=>{
 for(const status of [401,429,500]) { let calls=0;const w=createWorker(async()=>{calls++;return new Response('test-key',{status});});const r=await w.fetch(req(),env);assert.equal(r.status,status===500?502:status);assert.ok(!(await r.text()).includes('test-key'));assert.equal(calls,1); }
 const r=await createWorker(async()=>Response.json({wrong:true})).fetch(req(),env);assert.equal(r.status,502);
});
test('upstream timeout stops waiting',async()=>{
 const w=createWorker(async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true})),5);
 assert.equal((await w.fetch(req(),env)).status,504);
});
