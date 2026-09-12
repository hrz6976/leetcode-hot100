import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalServer } from '../tools/local-server.mjs';
import { emptyLearningState } from '../js/learning.js';

const payload = () => ({ app: 'hot100', version: 2, exportedAt: '2026-09-12T00:00:00Z', data: {
  preferences: { lang: 'python', theme: 'light' }, progress: {}, mistakes: {},
  learning: emptyLearningState(), drafts: { '["1","core","python"]': '# 中文草稿\nprint(1)' }, customInputs: {},
} });
async function setup(t, options) {
  const root = await mkdtemp(join(tmpdir(), 'hot100-server-'));
  await writeFile(join(root, 'index.html'), '<h1>Hot100</h1>');
  const server = createLocalServer(root, { getGoKey: async () => null, ...options });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const { token } = await (await fetch(`${url}/api/session`)).json();
  const headers = { 'Content-Type': 'application/json', 'x-hot100-token': token };
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }); });
  return { root, url, headers };
}

test('进度保存、重读、版本冲突与密钥字段拒绝', async t => {
  const { root, url, headers } = await setup(t);
  const first = await (await fetch(`${url}/api/progress`, { headers })).json();
  assert.deepEqual(first, { revision: null, payload: null });
  const original = payload();
  const put = body => fetch(`${url}/api/progress`, { method: 'PUT', headers, body: JSON.stringify(body) });
  const response = await put({ revision: null, payload: original });
  assert.equal(response.status, 200);
  const saved = await response.json(); assert.ok(saved.revision);
  assert.deepEqual(JSON.parse(await readFile(join(root, 'progress/learning.json'), 'utf8')), original);
  assert.deepEqual((await (await fetch(`${url}/api/progress`, { headers })).json()).payload, original);
  assert.equal((await put({ revision: null, payload: original })).status, 409);
  const invalid = payload(); invalid.data.assistant = { apiKey: 'must-not-persist' };
  assert.equal((await put({ revision: saved.revision, payload: invalid })).status, 400);
  assert.equal((await readFile(join(root, 'progress/learning.json'), 'utf8')).includes('must-not-persist'), false);
  assert.deepEqual(await readdir(join(root, 'progress')), ['learning.json']);
});

test('两个页面同时保存只允许一个版本通过，损坏文件不被覆盖', async t => {
  const { root, url, headers } = await setup(t);
  const requests = [1, 2].map(id => {
    const p = payload(); p.data.progress = { [id]: { core: { solved: true, attempts: 1 } } };
    return fetch(`${url}/api/progress`, { method: 'PUT', headers, body: JSON.stringify({ revision: null, payload: p }) });
  });
  assert.deepEqual((await Promise.all(requests)).map(r => r.status).sort(), [200, 409]);
  await writeFile(join(root, 'progress/learning.json'), '{broken');
  const response = await fetch(`${url}/api/progress`, { method: 'PUT', headers, body: JSON.stringify({ revision: null, payload: payload() }) });
  assert.equal(response.status, 400);
  assert.equal(await readFile(join(root, 'progress/learning.json'), 'utf8'), '{broken');
});

test('只有本机同源和有效令牌可读写进度，私有目录不作为静态资源提供', async t => {
  const { root, url, headers } = await setup(t);
  assert.equal((await fetch(`${url}/`)).status, 200);
  assert.equal((await fetch(`${url}/api/progress`)).status, 403);
  assert.equal((await fetch(`${url}/api/session`, { headers: { Origin: 'https://example.com' } })).status, 403);
  const hostileHost = await new Promise((resolve, reject) => {
    http.get(`${url}/api/session`, { headers: { Host: 'evil.example:1234' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject);
  });
  assert.equal(hostileHost, 403);
  assert.equal((await fetch(`${url}/api/progress`, { method: 'PUT', headers: { ...headers, Origin: 'https://example.com' }, body: '{}' })).status, 403);
  await mkdir(join(root, '.git')); await writeFile(join(root, '.git/config'), 'private');
  assert.equal((await fetch(`${url}/.git/config`)).status, 403);
  assert.equal((await fetch(`${url}/progress/learning.json`)).status, 403);
  assert.equal((await fetch(`${url}/%2e%2e%2fsecret`)).status, 403);
});

test('Go 转发使用固定订阅地址、自身标识及会话编号，并保留流式响应', async t => {
  let captured;
  const { root, url, headers } = await setup(t, { upstreamFetch: async (url, init) => {
    captured = { url, init };
    return new Response('data: {"choices":[{"delta":{"content":"检查边界"}}]}\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } });
  } });
  const body = { model: 'kimi-k2.6', messages: [{ role: 'user', content: '请检查代码' }], stream: true };
  const response = await fetch(`${url}/api/go/chat/completions`, {
    method: 'POST', headers: { ...headers, Authorization: 'Bearer test-only', 'x-opencode-session': 'test-session' }, body: JSON.stringify(body),
  });
  assert.equal(response.status, 200); assert.match(await response.text(), /检查边界/);
  assert.equal(captured.url, 'https://opencode.ai/zen/go/v1/chat/completions');
  assert.equal(captured.init.headers['User-Agent'], 'hot100-learning-assistant/2.0');
  assert.equal(captured.init.headers['x-opencode-session'], 'test-session');
  assert.deepEqual(JSON.parse(captured.init.body), body);
  assert.equal((await readdir(root)).includes('progress'), false);
});

test('不同服务共享进度文件时也只有一次写入成功', async t => {
  const { root, url, headers } = await setup(t);
  const second = createLocalServer(root, { getGoKey: async () => null });
  await new Promise(resolve => second.listen(0, '127.0.0.1', resolve));
  t.after(async () => { second.closeAllConnections(); await new Promise(resolve => second.close(resolve)); });
  const secondUrl = `http://127.0.0.1:${second.address().port}`;
  const { token } = await (await fetch(`${secondUrl}/api/session`)).json();
  const p1 = payload(), p2 = payload();
  p2.data.drafts['["2","core","python"]'] = '# 第二个客户端';
  const responses = await Promise.all([
    fetch(`${url}/api/progress`, { method:'PUT', headers, body:JSON.stringify({ revision:null, payload:p1 }) }),
    fetch(`${secondUrl}/api/progress`, { method:'PUT', headers:{ ...headers, 'x-hot100-token':token }, body:JSON.stringify({ revision:null, payload:p2 }) }),
  ]);
  assert.equal(responses.filter(r => r.status === 200).length, 1);
  assert.ok(responses.some(r => r.status === 409 || r.status === 423));
  const persisted = JSON.parse(await readFile(join(root, 'progress/learning.json'), 'utf8'));
  assert.deepEqual(persisted, responses[0].status === 200 ? p1 : p2);
});

test('中文草稿跨请求数据块时仍完整保存', async t => {
  const { url, headers } = await setup(t);
  const original = payload(); original.data.drafts['["1","core","python"]'] = '# 中文👍草稿';
  const body = Buffer.from(JSON.stringify({ revision:null, payload:original }));
  const split = body.indexOf(Buffer.from('中')) + 1;
  const status = await new Promise((resolve, reject) => {
    const request = http.request(`${url}/api/progress`, { method:'PUT', headers }, response => { response.resume(); response.on('end', () => resolve(response.statusCode)); });
    request.on('error', reject);
    request.write(body.subarray(0, split));
    setImmediate(() => request.end(body.subarray(split)));
  });
  assert.equal(status, 200);
  const result = await (await fetch(`${url}/api/progress`, { headers })).json();
  assert.deepEqual(result.payload, original);
});

test('本机 Go 凭据只用于订阅转发，不返回浏览器，也不写入项目', async t => {
  let forwardedAuth;
  const secret = 'test-local-go-secret';
  const { root, url, headers } = await setup(t, {
    getGoKey: async () => secret,
    upstreamFetch: async (_url, init) => { forwardedAuth = init.headers.Authorization; return new Response('data: [DONE]\n\n'); },
  });
  const session = await (await fetch(`${url}/api/session`)).json();
  assert.equal(session.openCodeGoAvailable, true);
  assert.ok(!JSON.stringify(session).includes(secret));
  const response = await fetch(`${url}/api/go/chat/completions`, {
    method:'POST', headers:{ ...headers, 'x-opencode-session':'coding-session' },
    body:JSON.stringify({ model:'kimi-k2.6', messages:[], stream:true }),
  });
  assert.equal(response.status, 200); await response.text();
  assert.equal(forwardedAuth, `Bearer ${secret}`);
  assert.deepEqual(await readdir(root), ['index.html']);
});
