import test from 'node:test';
import assert from 'node:assert/strict';

const assistant = await import('./assistant.js');

test('buildMessages：system 开头，历史裁剪，问题在末尾', () => {
  const past = Array.from({ length: 30 }, (_, i) => ({ role: 'user', content: `q${i}` }));
  const messages = assistant.buildMessages({ question: '这题怎么做？', history: past });
  assert.equal(messages[0].role, 'system');
  assert.match(messages[0].content, /刷题助手/);
  assert.equal(messages.length, 1 + 20 + 1);
  assert.equal(messages.at(-1).content, '这题怎么做？');
  assert.equal(messages[1].content, 'q10'); // 只保留最近 20 条
});

test('buildMessages：附带题目上下文与草稿', () => {
  const messages = assistant.buildMessages({
    question: '哪里错了？',
    context: { kind: 'problem', title: '1. 两数之和', body: '给定数组 nums……' },
    draft: { lang: 'python', mode: 'core', code: 'def twoSum():\n    pass' },
  });
  const last = messages.at(-1);
  assert.equal(last.role, 'user');
  assert.match(last.content, /【当前题目】1\. 两数之和/);
  assert.match(last.content, /给定数组 nums……/);
  assert.match(last.content, /【我的代码（python \/ core）】/);
  assert.ok(last.content.indexOf('给定数组') < last.content.indexOf('哪里错了？'));
});

test('buildMessages：文章上下文使用对应标签；超长内容截断', () => {
  const messages = assistant.buildMessages({
    question: '总结一下',
    context: { kind: 'article', title: '时间复杂度入门', body: 'x'.repeat(9000) },
  });
  const last = messages.at(-1);
  assert.match(last.content, /【当前知识文章】时间复杂度入门/);
  assert.match(last.content, /内容过长已截断/);
});

test('上下文注册表：读写与清空', () => {
  assistant.setAssistantContext({ kind: 'problem', title: 't', body: 'b' });
  assert.deepEqual(assistant.getAssistantContext(), { kind: 'problem', title: 't', body: 'b' });
  assistant.setAssistantContext({ kind: 'weird', title: 't', body: 'b' });
  assert.equal(assistant.getAssistantContext().kind, 'problem'); // 未知 kind 归一为 problem
  assistant.setAssistantContext(null);
  assert.equal(assistant.getAssistantContext(), null);
});

test('上下文变更时通知监听器，异常监听不影响设置', () => {
  const seen = [];
  assistant.setContextListener((ctx) => seen.push(ctx));
  assistant.setAssistantContext({ kind: 'article', title: 'a', body: 'b' });
  assistant.setAssistantContext(null);
  assert.deepEqual(seen, [{ kind: 'article', title: 'a', body: 'b' }, null]);
  assistant.setContextListener(() => { throw new Error('boom'); });
  assistant.setAssistantContext(null); // 不应抛出
  assistant.setContextListener(null);
  assistant.setAssistantContext({ kind: 'problem', title: 'x', body: 'y' });
  assert.equal(seen.length, 2); // 注销后不再通知
});

test('草稿读取器：注册、异常与注销', () => {
  assert.equal(assistant.getDraft(), null);
  assistant.registerDraftProvider(() => ({ lang: 'python', mode: 'core', code: '  ' }));
  assert.equal(assistant.getDraft(), null); // 空草稿视为无
  assistant.registerDraftProvider(() => ({ lang: 'javascript', mode: 'acm', code: 'let a = 1;' }));
  assert.equal(assistant.getDraft().code, 'let a = 1;');
  assistant.registerDraftProvider(() => { throw new Error('boom'); });
  assert.equal(assistant.getDraft(), null);
  assistant.registerDraftProvider(null);
  assert.equal(assistant.getDraft(), null);
});

test('对话历史：追加与清空', () => {
  assistant.clearHistory();
  assistant.appendHistory('user', '你好');
  assistant.appendHistory('assistant', '你好！');
  assert.deepEqual(assistant.getHistory(), [
    { role: 'user', content: '你好' },
    { role: 'assistant', content: '你好！' },
  ]);
  assistant.clearHistory();
  assert.deepEqual(assistant.getHistory(), []);
});

test('resolveConfig：预设回退与斜杠裁剪', () => {
  assert.deepEqual(assistant.resolveConfig({ preset: 'deepseek', baseUrl: '', apiKey: 'k', model: '' }), {
    baseUrl: 'https://api.deepseek.com/v1', apiKey: 'k', model: 'deepseek-chat', viaProxy: false,
  });
  const custom = assistant.resolveConfig({ preset: 'custom', baseUrl: 'http://127.0.0.1:9000/v1/', apiKey: 'k', model: 'm' });
  assert.equal(custom.baseUrl, 'http://127.0.0.1:9000/v1');
  assert.equal(custom.model, 'm');
  const unknown = assistant.resolveConfig({ preset: 'nope', baseUrl: 'https://x/v1', apiKey: '', model: '' });
  assert.equal(unknown.baseUrl, 'https://x/v1');
});

test('resolveConfig：命中不支持跨域的端点时自动改走本地代理', () => {
  const via = assistant.resolveConfig({ preset: 'custom', baseUrl: 'https://api.kimi.com/coding/v1/', apiKey: 'k', model: 'kimi-k2' });
  assert.equal(via.baseUrl, 'http://127.0.0.1:8966/v1');
  assert.equal(via.viaProxy, true);
  // 只填裸地址（没带 /v1）时自动补全；官方端点不受影响
  assert.equal(assistant.proxyUrlFor('https://api.kimi.com/coding'), 'http://127.0.0.1:8966/v1');
  assert.equal(assistant.proxyUrlFor('https://api.moonshot.cn/v1'), null);
  const official = assistant.resolveConfig({ preset: 'moonshot', baseUrl: '', apiKey: 'k', model: '' });
  assert.equal(official.viaProxy, false);
});

test('chat：缺少配置时给出明确错误', async () => {
  await assert.rejects(
    assistant.chat({ config: { preset: 'custom', baseUrl: '', apiKey: '', model: '' }, messages: [] }),
    /尚未配置 API 接口地址/
  );
  await assert.rejects(
    assistant.chat({ config: { preset: 'custom', baseUrl: 'http://x/v1', apiKey: '', model: 'm' }, messages: [] }),
    /尚未配置 API Key/
  );
});

test('Go 预设使用本地服务，控制台格式的模型名去掉提供商前缀', () => {
  const config = assistant.resolveConfig({ preset: 'opencode-go', apiKey: 'test', model: 'opencode-go/kimi-k2.6' });
  assert.equal(config.baseUrl, '/api/go');
  assert.equal(config.model, 'kimi-k2.6');
  assert.equal(config.viaProxy, true);
});

test('Go 请求保持会话编号，清空对话后更换，中文半包可完整解析', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init) => {
    if (url === '/api/session') return Response.json({ token: 'test-local-session' });
    requests.push({ url, init });
    const bytes = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"检查边界"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n');
    return new Response(new ReadableStream({ start(controller) {
      for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
      controller.close();
    } }));
  };
  try {
    let output = '';
    const run = () => assistant.chat({ config: { preset:'opencode-go', apiKey:'test-only' }, messages: [{ role:'user', content:'解释代码' }], onToken: value => { output += value; } });
    await run(); await run(); assistant.clearHistory(); await run();
    assert.equal(output, '检查边界检查边界检查边界');
    assert.equal(String(requests[0].url), 'http://localhost/api/go/chat/completions');
    assert.equal(new Headers(requests[0].init.headers).get('x-hot100-token'), 'test-local-session');
    assert.equal(new Headers(requests[0].init.headers).get('x-opencode-session'), new Headers(requests[1].init.headers).get('x-opencode-session'));
    assert.notEqual(new Headers(requests[1].init.headers).get('x-opencode-session'), new Headers(requests[2].init.headers).get('x-opencode-session'));
  } finally { globalThis.fetch = originalFetch; }
});

test('评审问题不显示原始 JSON，上下文保留原提交和首个失败证据', () => {
  const request = assistant.buildReviewRequest({
    problem:{ id:1, title:'两数之和', description:'返回两个不同位置' },
    code:'function twoSum() { return [0, 1]; }', lang:'javascript', mode:'core',
    verdict:{ status:'fail', cases:[{ index:0, pass:false, input:'[3,2,4], 6', expected:'[1,2]', got:'[0,1]' }] },
  });
  assert.match(request.question, /0\/1/);
  assert.ok(!request.question.includes('"cases"'));
  assert.match(request.context.body, /失败用例 1/);
  assert.match(request.context.body, /\[3,2,4\]/);
  assert.equal(request.draft.code, 'function twoSum() { return [0, 1]; }');
});

