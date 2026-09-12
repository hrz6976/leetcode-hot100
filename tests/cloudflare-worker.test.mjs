import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleRequest } from '../tools/cloudflare-worker.mjs';
const origin = 'https://hot100.1919114.xyz';
function req({ base = 'https://api.kimi.com/coding/v1', key = 'Bearer test-only-key', source = origin, body = { model:'kimi-for-coding', messages:[{role:'user',content:'test'}], stream:true }, method='POST' } = {}) {
  return new Request(origin+'/api/ai/chat/completions', { method, headers: { Origin:source, Authorization:key, 'Content-Type':'application/json', 'X-Hot100-Base-Url':base, Cookie:'never-forward=this' }, ...(method==='POST'?{body:JSON.stringify(body)}:{}) });
}
test('static assets are served without invoking AI upstream', async () => {
  const r = await worker.fetch(new Request(origin+'/index.html'), { ASSETS:{fetch:async()=>new Response('page')} }, {});
  assert.equal(await r.text(),'page');
});
test('rejects foreign origin, missing keys, unknown targets and malformed bodies before fetch', async () => {
  for(const [input,status] of [[{source:'https://other.example'},403],[{key:''},401],[{base:'https://example.org'},400],[{body:{}},400],[{body:{text:'x'.repeat(1024*1024)}},413]]) {
    const r=await handleRequest(req(input),{},()=>{throw new Error('must not fetch');});
    assert.equal(r.status,status);
  }
});
test('preflight permits only this site and required headers', async () => {
  const r=await handleRequest(req({method:'OPTIONS'}),{});
  assert.equal(r.status,204); assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);
});
test('preserves SSE and strips cookies, uses honest client identity', async () => {
  const r=await handleRequest(req(),{},async(url,opts)=>{
    assert.equal(url,'https://api.kimi.com/coding/v1/chat/completions');
    assert.equal(opts.headers.Authorization,'Bearer test-only-key');
    assert.equal(opts.headers.Cookie,undefined); assert.equal(opts.headers.Origin,undefined);
    assert.equal(opts.headers['User-Agent'],'hot100-learning-assistant/2.0');
    assert.equal(opts.redirect,'manual');
    return new Response('data: {"choices":[{"delta":{"content":"你好"}}]}\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream','Set-Cookie':'upstream=private'}});
  });
  assert.match(await r.text(),/你好/); assert.equal(r.headers.get('Set-Cookie'),null); assert.equal(r.headers.get('Cache-Control'),'no-store');
});
test('keeps upstream authentication errors and blocks redirects', async () => {
  let r=await handleRequest(req(),{},async()=>new Response('{"error":"bad key"}',{status:401}));
  assert.equal(r.status,401); assert.match(await r.text(),/bad key/);
  r=await handleRequest(req(),{},async()=>new Response(null,{status:302,headers:{Location:'https://other.example'}}));
  assert.equal(r.status,502);
});
test('Go receives a session id; custom targets require explicit server configuration', async () => {
  const go=await handleRequest(req({base:'https://opencode.ai/zen/go/v1'}),{},async(url,opts)=>{
    assert.ok(opts.headers['x-opencode-session']);return new Response('ok');
  }); assert.equal(await go.text(),'ok');
  const custom=await handleRequest(req({base:'https://custom.example/v1'}),{AI_ALLOWED_BASE_URLS:'https://custom.example/v1'},async()=>new Response('ok'));
  assert.equal(await custom.text(),'ok');
});
