import { test } from 'node:test';
import assert from 'node:assert/strict';
import { piModel, streamPiChat } from '../js/pi-chat.js';
const model = piModel({ baseUrl: 'https://site.test/api/ai', upstreamBaseUrl: 'https://opencode.ai/zen/go/v1', model: 'kimi-k2.6' });
const chunk = (delta, finish_reason = null) => `data: ${JSON.stringify({choices:[{index:0,delta,finish_reason}]})}\n\n`;
const response = body => new Response(new ReadableStream({ start(c) {
  for (const byte of new TextEncoder().encode(body)) c.enqueue(new Uint8Array([byte]));
  c.close();
} }), { headers: { 'content-type': 'text/event-stream' } });
const run = options => streamPiChat({ model, apiKey:'test', messages:[{role:'system',content:'算法助手'},{role:'user',content:'解释'}], ...options });

test('pi-ai 真实 SDK 解析中文半包、thinking、正文和结束事件，保留代理配置', async () => {
  let text='', thinking='', request;
  await run({ headers:{'x-hot100-base-url':'https://opencode.ai/zen/go/v1'},
    fetch: async (url, init) => { request={url,init}; return response(chunk({reasoning:'先想一想'})+chunk({content:'## 解答\n正确'},'stop')+'data: [DONE]\n\n'); },
    onToken:d=>text+=d, onThinking:d=>thinking+=d });
  assert.equal(text, '## 解答\n正确'); assert.equal(thinking, '先想一想');
  assert.equal(model.provider,'opencode-go');
  assert.equal(String(request.url),'https://site.test/api/ai/chat/completions');
  assert.equal(new Headers(request.init.headers).get('x-hot100-base-url'),'https://opencode.ai/zen/go/v1');
  assert.equal(JSON.parse(request.init.body).messages[0].role,'system');
});

test('pi-ai 拒绝缺失结束原因的仅思考流，并保留已收到的 thinking', async () => {
  let thinking='';
  await assert.rejects(run({fetch:async()=>response(chunk({reasoning_content:'还在分析'})), onThinking:d=>thinking+=d}), /仅返回思考内容.*连接在回复完成前结束/);
  assert.equal(thinking,'还在分析');
});

test('pi-ai 错误保留部分正文，HTTP 错误不重试', async () => {
  let text='', calls=0;
  await assert.rejects(run({fetch:async()=>response(chunk({content:'部分正文'})),onToken:d=>text+=d}), /连接在回复完成前结束/);
  assert.equal(text,'部分正文');
  await assert.rejects(run({fetch:async()=>{calls++;return Response.json({error:{message:'额度不足'}},{status:429});}}), /额度不足/);
  assert.equal(calls,1);
});

test('pi-ai 用户停止会取消底层请求', async () => {
  const aborter = new AbortController();
  await assert.rejects(run({signal:aborter.signal,fetch:async(url,init)=>{
    aborter.abort(); init.signal.throwIfAborted();
  }}), {name:'AbortError'});
});

test('代理后仍保留模型兼容设置，不主动关闭上游 thinking', () => {
  const deepseek = piModel({baseUrl:'https://site.test/api/ai',upstreamBaseUrl:'https://api.deepseek.com/v1',model:'deepseek-reasoner'});
  assert.equal(deepseek.provider,'deepseek');
  assert.equal(deepseek.thinkingLevelMap.off,null);
  const openai = piModel({baseUrl:'https://site.test/api/ai',upstreamBaseUrl:'https://api.openai.com/v1',model:'o3'});
  assert.equal(openai.compat.maxTokensField,'max_completion_tokens');
});
