import { STATIC_SITE, CLOUD_PROXY } from './runtime-mode.js';
import { localHeaders, localGoAvailable } from './local-progress.js';
// AI 助手纯逻辑层（无 DOM，可在 Node 下测试）：
// - OpenAI 兼容 API 预设与流式（SSE）调用
// - 页面上下文注册表（当前题目 / 知识文章 / 草稿代码）
// - 内存中的对话历史（不落盘，刷新即清空）

export const PRESETS = [
  { id: 'opencode-go', label: 'OpenCode Go 订阅', baseUrl: 'https://opencode.ai/zen/go/v1', model: 'kimi-k2.6' },
  { id: 'kimi-coding', label: 'Kimi Coding Plan', baseUrl: 'https://api.kimi.com/coding/v1', model: 'kimi-for-coding' },
  { id: 'moonshot', label: 'Kimi (Moonshot)', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { id: 'custom', label: '自定义（OpenAI 兼容）', baseUrl: '', model: '' },
];

const SYSTEM_PROMPT = [
  '你是一个算法刷题助手，在一个 LeetCode Hot 100 本地刷题网页里回答用户的问题。',
  '要求：用简体中文回答；简洁聚焦，先讲思路再给代码；代码用 fenced code block 并标注语言。',
  '如果用户附带了当前题目或文章，优先结合该内容作答；用户贴出的代码有问题时先指出关键错误。',
].join('\n');

// 发送时最多携带的历史消息条数，防止 token 无限增长。
const MAX_HISTORY_MESSAGES = 20;
// 附带上下文与草稿的长度上限，避免把超长内容整个塞进请求。
const MAX_CONTEXT_CHARS = 8000;
const MAX_DRAFT_CHARS = 6000;

// ---------- 页面上下文注册表 ----------
// ctx = { kind: 'problem' | 'article', title: string, body: string } | null
let pageContext = null;
// draftProvider = () => ({ lang: string, mode: string, code: string } | null)
let draftProvider = null;
// 上下文在路由异步加载完成后才被设置，通过监听器通知 UI 刷新
let contextListener = null;

export function setAssistantContext(ctx) {
  pageContext = ctx && typeof ctx === 'object' && typeof ctx.title === 'string' && typeof ctx.body === 'string'
    ? { kind: ctx.kind === 'article' ? 'article' : 'problem', title: ctx.title, body: ctx.body }
    : null;
  if (contextListener) {
    try {
      contextListener(pageContext);
    } catch {
      // 监听器异常不影响路由
    }
  }
}

export function setContextListener(fn) {
  contextListener = typeof fn === 'function' ? fn : null;
}

export function getAssistantContext() {
  return pageContext;
}

export function registerDraftProvider(fn) {
  draftProvider = typeof fn === 'function' ? fn : null;
}

export function getDraft() {
  if (!draftProvider) return null;
  try {
    const draft = draftProvider();
    return draft && typeof draft.code === 'string' && draft.code.trim() ? draft : null;
  } catch {
    return null;
  }
}

// ---------- 对话历史（仅内存） ----------
const history = [];
const newSessionId = () => globalThis.crypto?.randomUUID?.() || `hot100-${Date.now()}-${Math.random().toString(36).slice(2)}`;
let sessionId = newSessionId();

export function getHistory() {
  return [...history];
}

export function appendHistory(role, content) {
  history.push({ role, content });
}

export function clearHistory() {
  history.length = 0;
  sessionId = newSessionId();
}

function clip(text, max) {
  return text.length > max ? `${text.slice(0, max)}\n……（内容过长已截断）` : text;
}

// 拼装一次请求的消息：system + 裁剪后的历史 + 当前问题（可携带页面上下文与草稿）。
export function buildMessages({ question, context = null, draft = null, history: past = [] } = {}) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  messages.push(...past.slice(-MAX_HISTORY_MESSAGES));
  let content = question;
  if (context) {
    const label = context.kind === 'article' ? '当前知识文章' : '当前题目';
    content = `【${label}】${context.title}\n${clip(context.body, MAX_CONTEXT_CHARS)}\n\n${content}`;
  }
  if (draft) {
    content += `\n\n【我的代码（${draft.lang} / ${draft.mode}）】\n\`\`\`\n${clip(draft.code, MAX_DRAFT_CHARS)}\n\`\`\``;
  }
  messages.push({ role: 'user', content });
  return messages;
}

// ---------- SSE 流式解析 ----------
// 返回一个增量解析器：feed(chunkText) 处理数据，回调 onDelta(content) 逐段输出，
// 兼容跨 chunk 断行、`data: [DONE]`、空行与注释行。
export function createSseParser(onDelta) {
  let buffer = '';
  const state = { content: false, reasoning: false, finishReason: null, done: false };
  const handleLine = (line) => {
    if (!line.startsWith('data:')) return;
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') { state.done = true; return; }
    if (!payload) return;
    let json;
    try { json = JSON.parse(payload); } catch { return; }
    if (json.error) throw new Error(json.error.message || '模型返回了错误，请检查订阅状态后重试');
    for (const choice of json.choices || []) {
      if (choice.finish_reason) state.finishReason = choice.finish_reason;
      if (choice.delta?.reasoning || choice.delta?.reasoning_content) state.reasoning = true;
      const delta = choice?.delta?.content;
      if (typeof delta === 'string' && delta) { state.content = true; onDelta(delta); }
    }
  };
  return {
    state,
    feed(text) {
      buffer += text;
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 最后一段可能是不完整的行，留给下一次
      for (const line of lines) handleLine(line.replace(/\r$/, ''));
    },
    flush() {
      if (buffer) {
        handleLine(buffer.replace(/\r$/, ''));
        buffer = '';
      }
    },
  };
}

// ---------- API 调用 ----------
// 已知不支持浏览器跨域直连的端点：命中时自动改走本地 CORS 代理（tools/cors-proxy.mjs）。
// bare：用户只填到 match、没带版本路径（/v1）时的补全路径。
const LOCAL_PROXY_BASE = 'http://127.0.0.1:8966';
const PROXY_ROUTES = [
  { match: 'https://api.kimi.com/coding', bare: '/v1' },
];

export function proxyUrlFor(baseUrl) {
  for (const route of PROXY_ROUTES) {
    if (baseUrl === route.match) return LOCAL_PROXY_BASE + route.bare;
    if (baseUrl.startsWith(`${route.match}/`)) return LOCAL_PROXY_BASE + baseUrl.slice(route.match.length);
  }
  return null;
}

export function resolveConfig(cfg) {
  const preset = PRESETS.find((p) => p.id === cfg?.preset) || PRESETS.find((p) => p.id === 'custom');
  const direct = (cfg?.baseUrl || preset.baseUrl).replace(/\/+$/, '');
  const proxied = CLOUD_PROXY ? '/api/ai' : STATIC_SITE ? null : direct === 'https://opencode.ai/zen/go/v1' ? '/api/go' : proxyUrlFor(direct);
  return {
    baseUrl: proxied || direct,
    ...(CLOUD_PROXY ? { upstreamBaseUrl: direct } : {}),
    apiKey: cfg?.apiKey || '',
    model: direct === 'https://opencode.ai/zen/go/v1'
      ? (cfg?.model || preset.model).replace(/^opencode-go\//, '') : cfg?.model || preset.model,
    viaProxy: proxied !== null,
  };
}

export async function chat({ config, messages, signal, onToken }) {
  const { baseUrl, upstreamBaseUrl, apiKey, model, viaProxy } = resolveConfig(config);
  if (!baseUrl || (baseUrl === '/api/ai' && !upstreamBaseUrl)) throw new Error('尚未配置 API 接口地址');
  if (STATIC_SITE && baseUrl === 'https://opencode.ai/zen/go/v1') throw new Error('OpenCode Go 当前不支持浏览器跨域直连。请使用本地版本，或配置支持浏览器跨域的 AI 接口。');
  const goHeaders = baseUrl === '/api/go' ? await localHeaders() : null;
  if (!apiKey && !(goHeaders && localGoAvailable())) throw new Error(STATIC_SITE ? '请在 AI 设置中填写对应服务的 API Key' : '尚未配置 API Key；也可以先在本机 OpenCode 中连接 Go 订阅');
  if (!model) throw new Error('尚未配置模型名');
  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...(baseUrl === '/api/ai' ? { 'x-hot100-base-url': upstreamBaseUrl, 'x-opencode-session': sessionId } : {}),
        ...(goHeaders ? { ...goHeaders, 'x-opencode-session': sessionId } : {}),
      },
      body: JSON.stringify({ model, messages, stream: true }),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    if (baseUrl === '/api/go') throw new Error(`OpenCode Go 连接失败：${error.message}`);
    if (baseUrl === '/api/ai') throw new Error('无法连接 AI 转发接口，请检查网络后重试');
    if (viaProxy) {
      throw new Error('无法连接本地代理（127.0.0.1:8966）：该接口不支持浏览器直连，需要本地代理转发。请用一键启动脚本启动，或手动运行 node tools/cors-proxy.mjs');
    }
    throw new Error(`无法连接 API（可能是网络或跨域问题）：${error?.message || error}`);
  }
  if (!response.ok || !response.body) {
    const detail = (await response.text().catch(() => '')).slice(0, 300);
    throw new Error(`API 返回错误（HTTP ${response.status}）${detail ? `：${detail}` : ''}`);
  }
  // 有些兼容接口即使请求 stream，也会返回普通 JSON。
  if (response.headers.get('Content-Type')?.includes('application/json')) {
    const result = await response.json();
    if (result.error) throw new Error(result.error.message || '模型返回了错误');
    const choice = result.choices?.[0];
    const content = choice?.message?.content;
    if (typeof content === 'string' && content.trim()) { onToken(content); return; }
    throw new Error(emptyReplyMessage({ finishReason: choice?.finish_reason,
      reasoning: Boolean(choice?.message?.reasoning || choice?.message?.reasoning_content) }));
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser(onToken);
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.feed(decoder.decode(value, { stream: true }));
      if (parser.state.done) { await reader.cancel(); break; }
    }
    parser.feed(decoder.decode());
    parser.flush();
    if (!parser.state.content) throw new Error(emptyReplyMessage(parser.state));
    if (parser.state.finishReason === 'length') throw new Error('回复达到模型输出上限，内容可能不完整。可以继续追问。');
    if (!parser.state.done && !parser.state.finishReason) throw new Error('连接在回复完成前结束，请重试。');
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

// 评审固定绑定一次提交，避免用户后来编辑代码或切题后上下文串题。
export function buildReviewRequest({ problem, code, lang, mode, verdict }) {
  const cases = verdict.cases || [];
  const passed = cases.filter(item => item.pass).length;
  const failed = cases.filter(item => !item.pass);
  const summary = cases.length ? `测试通过 ${passed}/${cases.length} 个用例。` : `执行状态：${verdict.status}。`;
  const evidence = [summary];
  if (verdict.error) evidence.push(`执行错误：${clip(String(verdict.error), 1500)}`);
  for (const item of failed.slice(0, 3)) {
    evidence.push(`失败用例 ${item.index + 1}：\n输入：${clip(String(item.input), 1200)}\n期望：${clip(String(item.expected), 600)}\n实际：${clip(String(item.got ?? item.error ?? '无输出'), 600)}`);
  }
  if (failed.length > 3) evidence.push(`另有 ${failed.length - 3} 个失败用例未附带。`);
  return {
    question: `${summary}请帮我评审这次提交：解释错误和具体反例，再分析时间与空间复杂度。先给修改提示，暂时不要直接给完整答案。即使测试通过，也请检查边界条件。`,
    context: { kind: 'problem', title: `${problem.id}. ${problem.title}`, body: `${problem.description}\n\n【这次提交的测试结果】\n${evidence.join('\n\n')}` },
    draft: { lang, mode, code },
  };
}

function emptyReplyMessage({ reasoning, finishReason } = {}) {
  if (finishReason === 'length') return '模型达到输出上限，但尚未生成正文。请缩短问题或更换模型后重试。';
  if (finishReason === 'content_filter') return '模型服务未提供正文（content_filter），请调整问题后重试。';
  if (reasoning) return '模型只返回了思考数据，没有生成正文。请重试或更换模型。';
  return '接口没有返回可用正文。请重试，并检查 API 地址、模型和服务状态。';
}
