import { createLineBuffer } from '../stream-markdown.js';
import { STATIC_SITE, CLOUD_PROXY } from '../runtime-mode.js';
import { localGoAvailable } from '../local-progress.js';
// AI 助手悬浮窗：折叠时屏幕右边缘竖条，展开为右下浮窗；配置 OpenAI 兼容 API 后即可提问。
// 在题目页 / 知识文章页默认附带当前内容作为上下文（可勾选关闭）。

import { md } from '../md.js';
import { getAssistantConfig, setAssistantConfig } from '../store.js';
import {
  PRESETS,
  resolveConfig,
  buildMessages,
  chat,
  getAssistantContext,
  getDraft,
  getHistory,
  appendHistory,
  clearHistory,
  setContextListener,
  proxyUrlFor,
} from '../assistant.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function initAssistant() {
  const hasCredentials = cfg => Boolean(cfg.apiKey || (resolveConfig(cfg).baseUrl === '/api/go' && localGoAvailable()));
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'ai-tab';
  tab.setAttribute('aria-label', '打开 AI 助手');
  tab.innerHTML = '<span>AI<br>助<br>手</span>';

  const panel = document.createElement('section');
  panel.className = 'ai-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'AI 助手对话面板');
  panel.innerHTML = `
    <header class="ai-head">
      <span class="ai-title">AI 助手</span>
      <button type="button" class="ai-icon-btn" id="ai-settings" title="API 设置" aria-label="API 设置">⚙</button>
      <button type="button" class="ai-icon-btn" id="ai-clear" title="清空对话" aria-label="清空对话">🗑</button>
      <button type="button" class="ai-icon-btn" id="ai-pin" title="固定面板：固定后点击面板外或按 Esc 不会自动收起，再点一次取消" aria-label="固定面板" aria-pressed="false">📌</button>
      <button type="button" class="ai-icon-btn" id="ai-collapse" title="收起到屏幕右边缘（未固定时也可以点击面板外任意处或按 Esc）" aria-label="收起">»</button>
    </header>
    <form class="ai-config" id="ai-config" hidden>
      <p class="ai-config-tip">${CLOUD_PROXY ? '在线版通过本站 Cloudflare Worker 转发 AI 请求。请填写自己的 API Key；它会随请求转发至所选服务，Worker 不保存 Key。' : 'OpenCode Go 可复用本机登录，也可以手动填写 Key。'}支持修改 Base URL 和模型名（OpenAI 兼容协议）。手动填写的 Key 保存在本浏览器，不写入进度备份。${localGoAvailable() ? '已检测到本机 OpenCode Go 登录，使用 Go 时可以不填 Key。' : ''}</p>
      <label>服务
        <select id="ai-preset">
          ${PRESETS.map((p) => `<option value="${p.id}">${escapeHtml(p.label)}</option>`).join('')}
        </select>
      </label>
      <label>接口地址
        <input id="ai-baseurl" type="url" placeholder="https://api.example.com/v1" autocomplete="off">
      </label>
      <p class="ai-proxy-tip" id="ai-proxy-tip" hidden>该地址不支持浏览器直连，提问时将自动通过本地代理（127.0.0.1:8966，由一键启动脚本运行）转发。</p>
      <label>API Key
        <input id="ai-apikey" type="password" placeholder="sk-..." autocomplete="off">
      </label>
      <label>模型
        <input id="ai-model" type="text" placeholder="模型名，如 moonshot-v1-8k" autocomplete="off">
      </label>
      <button type="submit" class="btn">保存配置</button>
      <p class="ai-config-msg" id="ai-config-msg" role="status" aria-live="polite"></p>
    </form>
    <div class="ai-msgs" id="ai-msgs" aria-live="polite"></div>
    <div class="ai-input">
      <label class="ai-ctx" id="ai-ctx-label">
        <input type="checkbox" id="ai-ctx" checked>
        <span id="ai-ctx-text"></span>
      </label>
      <textarea id="ai-question" rows="2" placeholder="有什么不理解的？问一问（Enter 发送，Shift+Enter 换行）"></textarea>
      <button type="button" class="btn" id="ai-send">发送</button>
    </div>
  `;

  document.body.append(tab, panel);

  const els = {
    config: panel.querySelector('#ai-config'),
    preset: panel.querySelector('#ai-preset'),
    baseUrl: panel.querySelector('#ai-baseurl'),
    apiKey: panel.querySelector('#ai-apikey'),
    model: panel.querySelector('#ai-model'),
    configMsg: panel.querySelector('#ai-config-msg'),
    msgs: panel.querySelector('#ai-msgs'),
    ctxLabel: panel.querySelector('#ai-ctx-label'),
    ctx: panel.querySelector('#ai-ctx'),
    ctxText: panel.querySelector('#ai-ctx-text'),
    question: panel.querySelector('#ai-question'),
    send: panel.querySelector('#ai-send'),
    pin: panel.querySelector('#ai-pin'),
    proxyTip: panel.querySelector('#ai-proxy-tip'),
  };

  function syncProxyTip() {
    if (CLOUD_PROXY) {
      els.proxyTip.hidden = false;
      els.proxyTip.textContent = 'Go、Kimi Coding、DeepSeek 等预设已支持转发。自定义地址需加入服务端允许列表。Coding Plan 是否可用由服务商的账号权限决定。';
      return;
    }
    els.proxyTip.hidden = !proxyUrlFor(els.baseUrl.value.trim().replace(/\/+$/, ''));
  }

  els.baseUrl.addEventListener('input', syncProxyTip);

  let aborter = null;
  let reviewRequest = null;

  function fillConfigForm() {
    const cfg = getAssistantConfig();
    els.preset.value = PRESETS.some((p) => p.id === cfg.preset) ? cfg.preset : 'custom';
    const preset = PRESETS.find(p => p.id === cfg.preset);
    els.baseUrl.value = cfg.baseUrl || preset?.baseUrl || '';
    els.apiKey.value = cfg.apiKey;
    els.model.value = cfg.model || preset?.model || '';
    syncProxyTip();
  }

  function applyPreset() {
    const preset = PRESETS.find((p) => p.id === els.preset.value);
    if (preset && preset.id !== 'custom') {
      els.baseUrl.value = preset.baseUrl;
      els.model.value = preset.model;
    }
    syncProxyTip();
  }

  // 上下文勾选框：标签跟随当前页面（题目 / 文章）；
  // 当前页面没有可附带内容时不隐藏，改为灰置并说明，避免误以为功能消失。
  function syncContextLabel() {
    const ctx = reviewRequest?.context || getAssistantContext();
    els.ctx.disabled = !ctx;
    els.ctxLabel.classList.toggle('disabled', !ctx);
    if (ctx) {
      if (reviewRequest) {
        els.ctxText.textContent = `附带这次提交的题目和代码：${ctx.title}`;
        els.ctxLabel.title = '使用点击判题时的代码；之后编辑或切换题目不会改变本次评审内容。取消勾选则仅发送问题。';
        return;
      }
      const kind = ctx.kind === 'article' ? '文章' : '题目';
      els.ctxText.textContent = `提问时带上当前${kind}：${ctx.title}`;
      els.ctxLabel.title = ctx.kind === 'article'
        ? '勾选后，发送问题时会自动附上这篇文章的内容，AI 会结合它回答；取消勾选则只发送你输入的问题。'
        : '勾选后，发送问题时会自动附上这道题的题目内容和你当前写的代码，AI 会结合它们回答；取消勾选则只发送你输入的问题。';
    } else {
      els.ctxText.textContent = '提问时带上当前页面内容（题库等页面没有可附带的内容）';
      els.ctxLabel.title = '当前页面没有可附带的题目或文章。打开某道题或某篇知识文章后，这里会自动变为可勾选。';
    }
  }

  // 固定面板：固定后点击面板外 / 按 Esc 不再自动收起（状态随配置持久化）
  let pinned = getAssistantConfig().pinned;
  function syncPinButton() {
    els.pin.classList.toggle('active', pinned);
    els.pin.setAttribute('aria-pressed', String(pinned));
  }
  els.pin.addEventListener('click', () => {
    pinned = !pinned;
    const saved = setAssistantConfig({ ...getAssistantConfig(), pinned });
    if (!saved.ok) els.configMsg.textContent = `保存固定状态失败：${saved.error.message}`;
    syncPinButton();
  });
  syncPinButton();

  function scrollMsgs() {
    els.msgs.scrollTop = els.msgs.scrollHeight;
  }

  function addBubble(role, html) {
    const div = document.createElement('div');
    div.className = `ai-msg ${role}`;
    div.innerHTML = html;
    els.msgs.appendChild(div);
    scrollMsgs();
    return div;
  }

  function renderHistory() {
    els.msgs.innerHTML = '';
    for (const m of getHistory()) {
      addBubble(m.role === 'user' ? 'user' : 'assistant', m.role === 'user' ? escapeHtml(m.content) : `${m.thinking ? `<details class="ai-thinking"><summary>思考过程</summary><div>${escapeHtml(m.thinking)}</div></details>` : ''}${md(m.content)}`);
    }
  }

  function open() {
    document.dispatchEvent(new CustomEvent('hot100-panel-open', { detail: 'assistant' }));
    panel.hidden = false;
    tab.hidden = true;
    fillConfigForm();
    // 未配置 Key 时强制展示配置表单
    els.config.hidden = !hasCredentials(getAssistantConfig()) ? false : els.config.hidden;
    syncContextLabel();
    if (!aborter) renderHistory();
    els.question.focus();
  }

  function collapse() {
    panel.hidden = true;
    tab.hidden = false;
  }

  document.addEventListener('hot100-panel-open', event => {
    if (event.detail !== 'assistant') collapse();
  });
  tab.addEventListener('click', open);
  panel.querySelector('#ai-collapse').addEventListener('click', collapse);
  panel.querySelector('#ai-settings').addEventListener('click', () => {
    els.config.hidden = !els.config.hidden;
  });
  panel.querySelector('#ai-clear').addEventListener('click', () => {
    clearHistory();
    reviewRequest = null;
    syncContextLabel();
    renderHistory();
  });
  els.preset.addEventListener('change', applyPreset);

  // 点击面板外 / 按 Esc 自动收起（流式输出不中断，重开可继续看）；固定后不自动收起
  document.addEventListener('pointerdown', (e) => {
    if (!pinned && !panel.hidden && !panel.contains(e.target) && !tab.contains(e.target)) collapse();
  });
  document.addEventListener('keydown', (e) => {
    if (!pinned && e.key === 'Escape' && !panel.hidden) collapse();
  });
  window.addEventListener('hashchange', syncContextLabel);
  // 上下文在路由异步加载完成后才就绪，通过监听器即时刷新标签
  setContextListener(syncContextLabel);

  els.config.addEventListener('submit', (e) => {
    e.preventDefault();
    const saved = setAssistantConfig({
      preset: els.preset.value,
      baseUrl: els.baseUrl.value.trim(),
      apiKey: els.apiKey.value.trim(),
      model: els.model.value.trim(),
      pinned,
    });
    if (!saved.ok) {
      els.configMsg.textContent = `保存失败：${saved.error.message}`;
      return;
    }
    els.configMsg.textContent = '已保存';
    setTimeout(() => {
      els.config.hidden = true;
      els.configMsg.textContent = '';
    }, 500);
  });

  function setStreaming(on) {
    els.send.textContent = on ? '停止' : '发送';
    els.send.classList.toggle('streaming', on);
    els.question.disabled = on;
  }

  async function send() {
    if (aborter) {
      aborter.abort();
      return;
    }
    const question = els.question.value.trim();
    if (!question) return;
    const cfg = getAssistantConfig();
    if (!hasCredentials(cfg) || (!cfg.baseUrl && cfg.preset === 'custom')) {
      els.config.hidden = false;
      els.configMsg.textContent = '请先完成 API 配置';
      return;
    }
    const useCtx = els.ctx.checked && !els.ctx.disabled;
    const context = useCtx ? (reviewRequest?.context || getAssistantContext()) : null;
    const draft = useCtx && context?.kind === 'problem' ? (reviewRequest?.draft || getDraft()) : null;
    const messages = buildMessages({ question, context, draft, history: getHistory() });

    reviewRequest = null;
    syncContextLabel();
    els.question.value = '';
    addBubble('user', escapeHtml(question));
    appendHistory('user', question);
    const bubble = addBubble('assistant', '<details class="ai-thinking" hidden open><summary>思考中…</summary><div></div></details><div class="ai-answer"><span class="ai-typing">等待回复…</span></div><div class="ai-stopped" hidden></div>');
    const thought = bubble.querySelector('.ai-thinking');
    const thoughtLabel = thought.querySelector('summary');
    const thoughtText = document.createTextNode('');
    thought.querySelector('div').appendChild(thoughtText);
    const answerEl = bubble.querySelector('.ai-answer');
    const statusEl = bubble.querySelector('.ai-stopped');
    let answer = '', thinking = '';
    let previewNode = null;
    const lineBuffer = createLineBuffer(text => {
      const follow = els.msgs.scrollHeight - els.msgs.scrollTop - els.msgs.clientHeight < 60;
      answerEl.innerHTML = md(text);
      previewNode = null;
      if (follow) scrollMsgs();
    }, (tail, complete) => {
      const follow = els.msgs.scrollHeight - els.msgs.scrollTop - els.msgs.clientHeight < 60;
      if (!tail) {
        previewNode?.remove();
        previewNode = null;
      } else {
        if (!previewNode) {
          answerEl.querySelector('.ai-typing')?.remove();
          previewNode = document.createElement('span');
          // 与现有 Markdown 解析器使用相同的代码围栏规则。
          const inCode = complete.split('```').length % 2 === 0;
          const code = inCode ? answerEl.querySelector('pre:last-child code') : null;
          previewNode.className = code ? 'ai-code-tail' : 'ai-text-tail';
          (code || answerEl).appendChild(previewNode);
          previewNode.dataset.newline = code && code.textContent ? '1' : '';
        }
        previewNode.textContent = `${previewNode.dataset.newline ? '\n' : ''}${tail}`;
      }
      if (follow) scrollMsgs();
    });

    aborter = new AbortController();
    setStreaming(true);
    try {
      await chat({
        config: cfg,
        messages,
        signal: aborter.signal,
        onThinking(delta) {
          const follow = els.msgs.scrollHeight - els.msgs.scrollTop - els.msgs.clientHeight < 60;
          thinking += delta;
          thought.hidden = false;
          thoughtText.appendData(delta);
          if (follow) scrollMsgs();
        },
        onToken(delta) {
          thoughtLabel.textContent = '思考过程';
          answer += delta;
          lineBuffer.push(delta);
        },
      });
      lineBuffer.finish();
      if (answer || thinking) appendHistory('assistant', answer, thinking);
    } catch (error) {
      lineBuffer.finish();
      if (!answer) answerEl.textContent = '';
      statusEl.hidden = false;
      statusEl.textContent = error?.name === 'AbortError' ? '已停止' : `出错了：${error?.message || error}`;
      if (answer || thinking) appendHistory('assistant', answer, thinking);
    } finally {
      thoughtLabel.textContent = '思考过程';
      aborter = null;
      setStreaming(false);
      els.question.focus();
    }
  }

  window.addEventListener('hot100-review', event => {
    if (aborter) return;
    reviewRequest = event.detail;
    els.ctx.checked = true;
    open();
    els.question.value = event.detail.question;
    els.question.focus();
  });

  els.send.addEventListener('click', send);
  els.question.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send();
    }
  });
}
