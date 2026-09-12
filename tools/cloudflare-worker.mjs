import { CLOUD_BASE_URLS } from '../js/cloud-providers.js';

const MAX_BODY = 1024 * 1024;
const error = (message, status, headers = {}) => Response.json({ error: { message } }, {
  status, headers: { 'Cache-Control': 'no-store', ...headers },
});

export async function handleRequest(request, env, upstreamFetch = fetch) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
  if (url.pathname !== '/api/ai/chat/completions') return error('接口不存在', 404);
  // 只供本站使用。上游凭据由调用者提供，Worker 不保存也不提供共享密钥。
  if (request.headers.get('Origin') !== url.origin) return error('仅允许本站发起请求', 403);
  const cors = {
    'Access-Control-Allow-Origin': url.origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Hot100-Base-Url, X-Opencode-Session',
    'Vary': 'Origin',
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return error('仅支持 POST', 405, cors);
  const authorization = request.headers.get('Authorization');
  if (!/^Bearer \S+$/.test(authorization || '')) return error('请在 AI 设置中填写对应服务的 API Key', 401, cors);
  const base = (request.headers.get('X-Hot100-Base-Url') || '').replace(/\/+$/, '');
  const allowed = [...CLOUD_BASE_URLS, ...(env.AI_ALLOWED_BASE_URLS || '').split(',').map(v => v.trim().replace(/\/+$/, '')).filter(Boolean)];
  if (!allowed.includes(base)) return error('此 Base URL 尚未允许转发。请在 Cloudflare 配置 AI_ALLOWED_BASE_URLS 后重试。', 400, cors);
  let target;
  try {
    target = new URL(base);
    if (target.protocol !== 'https:' || target.username || target.password || target.search || target.hash) throw new Error();
  } catch { return error('Base URL 必须是无账号、查询参数或片段的 HTTPS 地址', 400, cors); }
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return error('仅支持 JSON 请求', 415, cors);
  if (Number(request.headers.get('Content-Length')) > MAX_BODY) return error('请求内容过大', 413, cors);
  let body;
  try {
    const reader = request.body?.getReader();
    if (!reader) return error('请求为空', 400, cors);
    const chunks = []; let total = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY) { await reader.cancel(); return error('请求内容过大', 413, cors); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    body = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof body.model !== 'string' || !body.model.trim() || !Array.isArray(body.messages) || !body.messages.length) throw new Error();
  } catch { return error('请求需要有效的 model 和 messages', 400, cors); }
  const headers = {
    'Content-Type': 'application/json', Authorization: authorization,
    'User-Agent': 'hot100-learning-assistant/2.0',
  };
  if (base === 'https://opencode.ai/zen/go/v1') {
    headers['x-opencode-session'] = request.headers.get('x-opencode-session') || crypto.randomUUID();
  }
  const aborter = new AbortController();
  const timeout = setTimeout(() => aborter.abort(), 120000);
  request.signal.addEventListener('abort', () => aborter.abort(), { once: true });
  try {
    const response = await upstreamFetch(`${base}/chat/completions`, {
      method: 'POST', headers, body: JSON.stringify(body), redirect: 'manual', signal: aborter.signal,
    });
    if (response.status >= 300 && response.status < 400) {
      clearTimeout(timeout);
      await response.body?.cancel();
      return error('上游返回重定向，请检查 Base URL', 502, cors);
    }
    const reader = response.body?.getReader();
    const stream = reader ? new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) { clearTimeout(timeout); controller.close(); }
          else controller.enqueue(value);
        } catch (err) { clearTimeout(timeout); controller.error(err); }
      },
      async cancel(reason) { clearTimeout(timeout); aborter.abort(); await reader.cancel(reason); },
    }) : null;
    if (!reader) clearTimeout(timeout);
    return new Response(stream, {
      status: response.status,
      headers: { ...cors, 'Content-Type': response.headers.get('Content-Type') || 'text/event-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    clearTimeout(timeout);
    return error('AI 服务连接失败或超时，请检查接口地址后重试', 502, cors);
  }
}

export default { fetch(request, env) { return handleRequest(request, env); } };
