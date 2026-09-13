import { createProvider, openAICompletionsApi } from '../vendor/pi-ai.js';

const zeroUsage = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } });

// Provider identity follows the upstream, even when the URL points to our proxy.
export function piModel({ baseUrl, upstreamBaseUrl, model }) {
  const upstream = upstreamBaseUrl || baseUrl;
  const provider = /opencode.ai\/zen\/go|^\/api\/go/.test(upstream) ? 'opencode-go'
    : /deepseek/.test(upstream) ? 'deepseek'
    : /moonshot|kimi/.test(upstream) ? 'moonshotai'
    : /api.openai.com/.test(upstream) ? 'openai' : 'custom';
  return { id: model, name: model, api: 'openai-completions', provider,
    baseUrl: new URL(baseUrl, globalThis.location?.origin || 'http://localhost').href.replace(/\/+$/, ''),
    reasoning: true, input: ['text'], contextWindow: 131072, maxTokens: 8192,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: 'max_tokens',
      supportsReasoningEffort: false },
  };
}

export async function streamPiChat({ model, messages, apiKey, headers, signal, onToken, onThinking, fetch: fetchImpl }) {
  const provider = createProvider({ id: model.provider, name: model.provider, baseUrl: model.baseUrl,
    auth: { apiKey: { name: 'API Key', login: async () => { throw new Error('请在 API 设置中配置密钥'); }, resolve: async () => undefined } },
    models: [], api: openAICompletionsApi() });
  const context = {
    systemPrompt: messages.filter(m => m.role === 'system').map(m => m.content).join('\n'),
    messages: messages.filter(m => m.role !== 'system').map(m => m.role === 'user'
      ? { role: 'user', content: m.content, timestamp: Date.now() }
      : { role: 'assistant', content: [{ type: 'text', text: m.content }], api: model.api,
          provider: model.provider, model: model.id, usage: zeroUsage(), stopReason: 'stop', timestamp: Date.now() }),
  };
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  let idle, timedOut = false, text = '', thinking = '';
  const resetIdle = () => { clearTimeout(idle); idle = setTimeout(() => { timedOut = true; controller.abort(); }, 45000); };
  resetIdle();
  try {
    const stream = provider.stream(model, context, { apiKey: apiKey || 'local-proxy', headers,
      signal: controller.signal, fetch: fetchImpl || globalThis.fetch, maxRetries: 0, timeoutMs: 120000 });
    for await (const event of stream) {
      resetIdle();
      if (event.type === 'text_delta') { text += event.delta; onToken?.(event.delta); }
      if (event.type === 'thinking_delta') { thinking += event.delta; onThinking?.(event.delta); }
      if (event.type === 'error') {
        if (timedOut) throw new Error('AI 服务已 45 秒没有返回新内容，请重试。');
        if (signal?.aborted) throw new DOMException('已停止', 'AbortError');
        const detail = event.error.errorMessage || 'AI 请求失败';
        throw new Error(detail.includes('without finish_reason')
          ? `${thinking && !text ? '模型仅返回思考内容，尚未生成正文；' : ''}连接在回复完成前结束，请重试。`
          : detail);
      }
      if (event.type === 'done') {
        if (event.reason === 'length') throw new Error('回复达到输出上限，内容可能不完整。可以继续追问。');
        if (!text.trim()) throw new Error(thinking ? '模型只返回了思考内容，没有生成正文，请重试。' : '模型没有返回正文，请检查模型与服务状态。');
      }
    }
  } finally {
    clearTimeout(idle);
    signal?.removeEventListener('abort', abort);
    controller.abort();
  }
}
