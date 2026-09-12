import { problems } from '../problems/index.js';
import { STATIC_SITE } from './runtime-mode.js';
import { exportAll, importAll, flushDrafts, problemStatus } from './store.js';
let token = '';
let goAvailable = false;
let saveToFile = null;
export async function flushLocalProgress() {
  return saveToFile ? saveToFile() : { ok: true, browserOnly: true };
}
export function localGoAvailable() { return goAvailable; }
export async function localHeaders() {
  if (!token) {
    const response = await fetch('/api/session', { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error('请用 Node.js 一键启动，才能使用本地保存和 OpenCode Go');
    const session = await response.json();
    token = session.token;
    goAvailable = session.openCodeGoAvailable === true;
    if (!token) throw new Error('本地服务版本不匹配，请重新启动');
  }
  return { 'Content-Type': 'application/json', 'x-hot100-token': token };
}
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
const fingerprint = payload => JSON.stringify(canonical(payload.data));
const meaningful = p => ['progress', 'drafts', 'mistakes', 'customInputs'].some(k => Object.keys(p.data[k] || {}).length) || Object.keys(p.data.learning.problems).length;
export async function initLocalProgress() {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'progress-tab'; toggle.innerHTML = '<span>进<br>度</span>';
  toggle.setAttribute('aria-label', '打开保存与备份');
  toggle.setAttribute('aria-controls', 'local-progress-panel');
  const panel = document.createElement('aside');
  panel.id = 'local-progress-panel'; panel.className = 'progress-panel';
  panel.setAttribute('aria-label', '保存与备份');
  const head = document.createElement('div'); head.className = 'progress-head';
  const title = document.createElement('strong'); title.textContent = '保存与备份';
  const close = document.createElement('button'); close.className = 'ai-icon-btn';
  close.textContent = '×'; close.setAttribute('aria-label', '收起保存与备份');
  head.append(title, close);
  const intro = document.createElement('p'); intro.className = 'progress-intro';
  intro.textContent = '学习记录会自动保存，无需每次手动操作。';
  const bar = document.createElement('div'); bar.className = 'local-progress';
  const summary = document.createElement('div'); summary.className = 'progress-summary';
  summary.innerHTML = '<div class="progress-summary-label"><span>已通过</span><span class="progress-summary-count"></span></div><div class="bar" role="progressbar" aria-label="已通过进度" aria-valuemin="0"><div></div></div>';
  const meter = summary.querySelector('.bar');
  const count = summary.querySelector('.progress-summary-count');
  let summaryTimer = null;
  function updateSummary() {
    const total = problems.length;
    const solved = problems.filter(problem => problemStatus(problem.id) === 'solved').length;
    const text = `${solved} / ${total}`;
    if (count.textContent === text) return;
    count.textContent = text;
    meter.setAttribute('aria-valuemax', String(total));
    meter.setAttribute('aria-valuenow', String(solved));
    meter.firstElementChild.style.width = `${total ? Math.round(solved / total * 100) : 0}%`;
  }
  panel.append(head, summary, intro, bar);
  function setOpen(open, restoreFocus = false) {
    clearInterval(summaryTimer);
    if (open) { updateSummary(); summaryTimer = setInterval(updateSummary, 1000); }
    panel.hidden = !open;
    toggle.hidden = open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      document.dispatchEvent(new CustomEvent('hot100-panel-open', { detail: 'progress' }));
      close.focus();
    } else if (restoreFocus) toggle.focus();
  }
  setOpen(false);
  toggle.onclick = () => setOpen(panel.hidden);
  close.onclick = () => setOpen(false, true);
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false, true);
  });
  document.addEventListener('hot100-panel-open', event => {
    if (event.detail !== 'progress') setOpen(false);
  });
  const label = document.createElement('span'); label.setAttribute('role', 'status');
  const save = document.createElement('button'); save.className = 'btn'; save.textContent = '立即保存';
  const backup = document.createElement('button'); backup.className = 'btn'; backup.textContent = '导出浏览器备份';
  backup.onclick = () => {
    flushDrafts(); const url = URL.createObjectURL(new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'hot100-browser-backup.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  bar.append(label, save, backup); document.body.append(toggle, panel);
  function showStatus(message, attention = false) {
    label.textContent = message;
    toggle.classList.toggle('needs-attention', attention);
    toggle.setAttribute('aria-label', attention ? '保存与备份：需要处理' : '打开保存与备份');
    toggle.title = message;
  }
  if (STATIC_SITE) {
    intro.textContent = '进度自动保存在当前浏览器。换设备或清理浏览器前，请导出备份；可在题库页导入。';
    save.hidden = true;
    showStatus('浏览器保存已启用 · 不会自动同步到其他设备或电脑文件');
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushDrafts(); });
    window.addEventListener('beforeunload', () => flushDrafts());
    return;
  }
  let revision = null, last = '', paused = true;
  let saving = Promise.resolve();
  const marker = 'hot100_local_file_base';
  const checksum = async text => {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
  };
  const remember = async () => { try { localStorage.setItem(marker, await checksum(last)); } catch {} };
  function persist(force = false) {
    saving = saving.then(() => writeCurrent(force));
    return saving;
  }
  async function writeCurrent(force = false) {
    if (paused) return { ok: false };
    try {
      const flushed = flushDrafts(); if (!flushed.ok) throw flushed.error;
      const payload = exportAll(); const next = fingerprint(payload);
      if (!force && next === last) return { ok: true };
      showStatus('正在保存到本地…');
      const response = await fetch('/api/progress', { method: 'PUT', headers: await localHeaders(), body: JSON.stringify({ revision, payload }), signal: AbortSignal.timeout(10000) });
      const result = await response.json();
      if (!response.ok) { if (response.status === 409) { paused = true; save.disabled = true; } throw new Error(result.error); }
      revision = result.revision; last = next; await remember();
      showStatus(`已保存到 progress/learning.json · ${new Date().toLocaleTimeString()}`);
      return { ok: true };
    } catch (error) {
      showStatus(`本地文件未保存：${error.message}`, true);
      return { ok: false, error: error.message };
    }
  }
  save.onclick = () => persist(true);
  showStatus('正在读取本地进度…');
  try {
    const response = await fetch('/api/progress', { headers: await localHeaders(), signal: AbortSignal.timeout(5000) });
    const disk = await response.json(); if (!response.ok) throw new Error(disk.error);
    revision = disk.revision;
    const browser = exportAll(); const browserPrint = fingerprint(browser);
    let base = null; try { base = localStorage.getItem(marker); } catch {}
    if (disk.payload && meaningful(browser) && browserPrint !== fingerprint(disk.payload) && await checksum(browserPrint) !== base) {
      showStatus('浏览器与进度文件不同。请先导出备份，再选择本次使用的数据：', true);
      save.hidden = true;
      await new Promise(resolve => {
        for (const [text, useDisk] of [['使用文件中的进度', true], ['将浏览器进度保存到文件', false]]) {
          const button = document.createElement('button'); button.className = 'btn'; button.textContent = text;
          button.onclick = () => {
            try {
              if (useDisk) importAll(disk.payload, { mode: 'replace', preserveSecrets: true });
              resolve();
            } catch (error) { showStatus(`恢复失败：${error.message}。原数据已保留，请先导出备份。`, true); }
          };
          bar.append(button);
        }
      });
      while (bar.children.length > 3) bar.lastChild.remove(); save.hidden = false;
    } else if (disk.payload) importAll(disk.payload, { mode: 'replace', preserveSecrets: true });
    const firstVisit = !disk.payload && !meaningful(browser);
    last = disk.payload ? fingerprint(disk.payload) : firstVisit ? browserPrint : '';
    paused = false;
    saveToFile = () => persist(true);
    if (fingerprint(exportAll()) !== last) await persist();
    else {
      await remember();
      showStatus(firstVisit ? '本地保存已就绪 · 开始练习后自动写入文件' : '本地进度已载入 · 修改后自动保存');
    }
    setInterval(() => persist(), 1200);
    document.addEventListener('visibilitychange', () => { if (document.hidden) void persist(); });
    window.addEventListener('beforeunload', event => {
      flushDrafts();
      if (!paused && fingerprint(exportAll()) !== last) { void persist(); event.preventDefault(); event.returnValue = ''; }
    });
  } catch (error) { showStatus(`当前仅保存在浏览器：${error.message}`, true); save.disabled = true; }
}
