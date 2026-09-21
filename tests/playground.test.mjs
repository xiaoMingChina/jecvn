import { examples } from '../src/lib/playground-examples.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { once } from 'node:events';
import { makePayload, presets, requestDecision, redact, API_URL } from '../src/lib/playground.mjs';
import { createHandler, HOST, ORIGIN } from '../scripts/playground-server.mjs';
const payload = type => makePayload({ type, model: 'jev-latest', ...presets[type], criteria: JSON.stringify(presets[type].criteria) });
test('三种问题生成官方格式；无效标准被拒绝', () => {
  for (const type of Object.keys(presets)) assert.equal(payload(type).questions.result.type, type);
  for (const [type, criteria] of [['choice','{}'],['score','["one"]'],['noul','{"other":"x"}']]) assert.throws(() => makePayload({type,model:'jev-latest',state:'输入',instructions:'问题',criteria}));
});
test('认证只在请求头；不带 cookie、不跟随跳转、结果隐藏密钥', async () => {
  let calls = 0;
  const result = await requestDecision({ key:'test-only-key',payload:payload('choice'),fetcher: async (url, options) => {
    calls++; assert.equal(url,API_URL); assert.equal(options.credentials,'omit'); assert.equal(options.redirect,'error');
    assert.equal(options.headers.Authorization,'Bearer test-only-key'); assert.ok(!options.body.includes('test-only-key'));
    return new Response(JSON.stringify({model:'test',answers:{result:{choice:'test-only-key'}}}));
  }});
  assert.equal(calls,1); assert.equal(result.answers.result.choice,'[已隐藏密钥]');
  assert.equal(redact('x secret secret','secret'),'x [已隐藏密钥] [已隐藏密钥]');
});
test('限流不重试，不显示上游可能回显的凭据', async () => {
  let calls=0;
  await assert.rejects(requestDecision({key:'test-only-key',payload:payload('noul'),fetcher:async()=>{ calls++; return new Response('test-only-key',{status:429}); }}),error=>error.message.includes('429')&&!error.message.includes('test-only-key'));
  assert.equal(calls,1);
});
test('本地服务仅接受同源请求，参数验证后调用一次且保留中文', async () => {
  let calls=0;
  const server=createServer(createHandler(async (key,body)=>{calls++;assert.equal(key,'test-only-key');assert.equal(body.state,presets.choice.state);return {model:'fixture',answers:{result:{choice:'故障反馈'}}};}));
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const send=(headers,body=payload('choice'))=>new Promise((resolve,reject)=>{
    const req=request({host:'127.0.0.1',port:server.address().port,path:'/api/systemone',method:'POST',headers:{Host:HOST,Origin:ORIGIN,'Content-Type':'application/json',Authorization:'Bearer test-only-key',...headers}},res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,body:text}));});req.on('error',reject);req.end(JSON.stringify(body));
  });
  try {
    assert.equal((await send({Origin:'https://untrusted.example'})).status,403);
    assert.equal((await send({Host:'untrusted.example'})).status,403);
    assert.equal((await send({Authorization:''})).status,401);
    assert.equal((await send({},{})).status,400);
    assert.equal(calls,0);
    const success=await send({});assert.equal(success.status,200);assert.ok(success.body.includes('故障反馈'));assert.equal(calls,1);
  } finally { server.close();await once(server,'close'); }
});

test('示例库 ID 唯一，所有场景满足 API 输入约束并覆盖三种类型', () => {
  assert.equal(new Set(examples.map(item => item.id)).size, examples.length);
  assert.deepEqual(new Set(examples.map(item => item.type)), new Set(['choice', 'noul', 'score']));
  for (const item of examples) {
    const body = makePayload({ ...item, model: 'jev-latest', criteria: JSON.stringify(item.criteria) });
    assert.equal(body.questions.result.type, item.type, item.id);
    assert.ok(item.tip && item.title && item.description, item.id);
  }
});
