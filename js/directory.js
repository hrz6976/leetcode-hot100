// 左侧跳转目录（题目页 / 知识页共用）：
// - 题目页：全部 100 题，排版跟随题库列表页的视图偏好（按难度 / 平铺 / 按分类）
// - 知识页：全部知识文章，按学习路径顺序平铺
// - 分组可折叠（状态持久化）；打开时自动展开当前所在组并滚动定位到当前项
// - fixed 悬浮不占位；点击条目跳转并自动收起；点击面板外任意处或 Esc 收起
// - 开合状态存 localStorage（默认收起）

import { problems } from '../problems/index.js';
import { articles } from '../knowledge/index.js';
import { getListView, problemStatus } from './store.js';
import { primaryCategory, TOPIC_RANK, TOPIC_ORDER } from './views/list.js';

const OPEN_KEY = 'hot100_dir_open_v1';
const COLLAPSED_KEY = 'hot100_dir_collapsed_v1';
const DIFF_LABEL = { easy: '简单', medium: '中等', hard: '困难' };
const DIFF_ORDER = ['easy', 'medium', 'hard'];
const DIFF_RANK = { easy: 0, medium: 1, hard: 2 };

function readJson(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 忽略存储失败
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusIcon(id) {
  const st = problemStatus(id);
  if (st === 'solved') return '<span class="solved" title="已通过">✓</span>';
  if (st === 'attempted') return '<span class="attempted" title="已尝试">◐</span>';
  return '<span title="未开始">—</span>';
}

// 分组数据：{ key, label, list }；平铺视图返回空 key 的单组（不渲染组头、不可折叠）
function problemGroups(currentId) {
  const view = getListView();
  if (view === 'flat') {
    return [{ key: '', label: '', list: problems }];
  }
  if (view === 'tags') {
    const map = new Map();
    for (const p of problems) {
      const cat = primaryCategory(p);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(p);
    }
    return [...map.entries()]
      .map(([t, list]) => ({ key: `tag:${t}`, label: t, list: list.sort((x, y) => DIFF_RANK[x.difficulty] - DIFF_RANK[y.difficulty] || x.id - y.id) }))
      .sort((a, b) => (TOPIC_RANK.get(a.label) ?? TOPIC_ORDER.length) - (TOPIC_RANK.get(b.label) ?? TOPIC_ORDER.length));
  }
  return DIFF_ORDER.map((d) => ({
    key: `diff:${d}`,
    label: DIFF_LABEL[d],
    list: problems.filter((p) => p.difficulty === d),
  }));
}

function articleRows(currentSlug) {
  return articles
    .map(
      (a) => `
    <button type="button" class="dir-row${a.slug === currentSlug ? ' active' : ''}" data-hash="#/knowledge/${escapeHtml(a.slug)}">
      <span class="ptitle">${escapeHtml(a.title)}</span>
      <span class="dir-intro">${escapeHtml(a.intro || '')}</span>
    </button>`
    )
    .join('');
}

// kind: 'problems'（题目页，currentId 为题号）| 'articles'（知识页，currentId 为 slug）
export function mountDirectory({ kind, currentId }) {
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'dir-tab';
  tab.textContent = '目录';
  tab.setAttribute('aria-label', '打开跳转目录');

  const panel = document.createElement('nav');
  panel.className = 'dir-panel';
  panel.setAttribute('aria-label', '跳转目录');
  panel.hidden = true;

  document.body.append(tab, panel);

  const title = kind === 'problems' ? '全部题目' : '全部知识';
  panel.innerHTML = `
    <div class="dir-head"><span>${title}</span><button type="button" class="dir-close" aria-label="收起目录">×</button></div>
    <div class="dir-body"></div>
  `;
  const body = panel.querySelector('.dir-body');

  // 分组折叠状态：localStorage 里的已折叠 key 集合；null = 尚未初始化（默认只展开当前所在组）
  const groups = kind === 'problems' ? problemGroups(currentId) : [];
  const currentGroupKey = kind === 'problems'
    ? (groups.find((g) => g.key && g.list.some((p) => p.id === currentId))?.key ?? null)
    : null;
  let collapsed = readJson(COLLAPSED_KEY, null);
  if (!Array.isArray(collapsed)) {
    collapsed = groups.filter((g) => g.key && g.key !== currentGroupKey).map((g) => g.key);
  }
  const collapsedSet = new Set(collapsed);

  function persistCollapsed() {
    writeJson(COLLAPSED_KEY, [...collapsedSet]);
  }

  function problemRowHtml(p) {
    return `
      <button type="button" class="dir-row${p.id === currentId ? ' active' : ''}" data-hash="#/problem/${p.id}">
        <span class="status">${statusIcon(p.id)}</span>
        <span class="pid">${p.id}</span>
        <span class="ptitle">${escapeHtml(p.title)}</span>
        <span class="diff ${p.difficulty}">${DIFF_LABEL[p.difficulty]}</span>
      </button>`;
  }

  function render() {
    if (kind === 'articles') {
      body.innerHTML = `<div class="dir-group">${articleRows(currentId)}</div>`;
      return;
    }
    body.innerHTML = groups
      .map((g) => {
        if (!g.key) return `<div class="dir-group">${g.list.map(problemRowHtml).join('')}</div>`;
        const solved = g.list.filter((p) => problemStatus(p.id) === 'solved').length;
        const isCollapsed = collapsedSet.has(g.key);
        return `
          <div class="dir-group" data-group="${escapeHtml(g.key)}">
            <button type="button" class="dir-group-head" aria-expanded="${!isCollapsed}">
              <span class="dir-group-arrow" aria-hidden="true">${isCollapsed ? '▸' : '▾'}</span>
              <span>${escapeHtml(g.label)}</span>
              <span class="dir-group-count">${solved}/${g.list.length}</span>
            </button>
            <div class="dir-group-body"${isCollapsed ? ' hidden' : ''}>${g.list.map(problemRowHtml).join('')}</div>
          </div>`;
      })
      .join('');
  }

  function setOpen(open, { persist = true } = {}) {
    panel.hidden = !open;
    tab.hidden = open;
    if (persist) writeJson(OPEN_KEY, open);
  }

  // 打开时：展开当前所在组（若被折叠）并把当前项滚到可视区域
  function locateCurrent() {
    if (currentGroupKey && collapsedSet.has(currentGroupKey)) {
      collapsedSet.delete(currentGroupKey);
      persistCollapsed();
      render();
    }
    panel.querySelector('.dir-row.active')?.scrollIntoView({ block: 'center' });
  }

  tab.addEventListener('click', () => {
    setOpen(true);
    locateCurrent();
  });
  panel.querySelector('.dir-close').addEventListener('click', () => setOpen(false));

  panel.addEventListener('click', (e) => {
    // 组头折叠/展开
    const head = e.target.closest('.dir-group-head');
    if (head) {
      const key = head.closest('.dir-group').dataset.group;
      if (collapsedSet.has(key)) collapsedSet.delete(key);
      else collapsedSet.add(key);
      persistCollapsed();
      render();
      return;
    }
    // 条目跳转并自动收起
    const row = e.target.closest('.dir-row');
    if (!row) return;
    setOpen(false);
    location.hash = row.dataset.hash;
  });

  // 点击面板外任意处 / Esc 自动收起
  const onDocClick = (e) => {
    if (panel.hidden) return;
    if (panel.contains(e.target) || tab.contains(e.target)) return;
    setOpen(false);
  };
  const onKeydown = (e) => {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  };
  document.addEventListener('click', onDocClick, true);
  document.addEventListener('keydown', onKeydown);

  render();
  setOpen(readJson(OPEN_KEY, false) === true, { persist: false });
  if (!panel.hidden) locateCurrent();

  return {
    dispose() {
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onKeydown);
      tab.remove();
      panel.remove();
    },
  };
}
