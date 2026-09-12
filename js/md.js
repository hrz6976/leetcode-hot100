// 极简 Markdown 渲染，支持的语法：
// - ``` 代码块（首行可带语言标记：js/python/cpp/run/run-js/run-py/run-cpp；可运行块用 #id 提供稳定 ID）
// - `行内代码`、**加粗**、1–6 级标题、分隔线、有序和无序列表、空行分段
// - | 表格 |（第二行 --- 分隔）
// - > 提示框（首词为 注意/提示/重点/例子 时着色，否则默认样式）
// 代码块会嗅探语言并打上 data-lang 标记，可运行示例打 data-run 标记。

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInline(s) {
  // 先隔离行内代码，避免代码中的星号被当作强调语法。
  return s.split(/(`+[^`]+`+)/g).map(part => {
    if (/^(`+)([^`]+)\1$/.test(part)) return `<code>${escapeHtml(part.replace(/^`+|`+$/g, ''))}</code>`;
    return escapeHtml(part)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  }).join('');
}

// 根据代码块内容嗅探语言：优先显式标记（// JavaScript / # Python），其次语法特征；识别不了返回空串（始终展示）
function detectLang(code) {
  const first = (code.split('\n').find((l) => l.trim() !== '') || '').trim();
  if (!first) return '';
  if (/^\/\/\s*(javascript|js)\b/i.test(first)) return 'javascript';
  if (/^#\s*python\b/i.test(first)) return 'python';
  if (/^\/\/\s*(c\+\+|cpp)(?![a-z])/i.test(first)) return 'cpp';
  // 注释里仅提 C++（未提 JavaScript）也视为 C++，如 "// ===== C++ ====="
  if (/^\/\/.*(c\+\+|\bcpp\b)/i.test(first) && !/javascript|\bjs\b/i.test(first)) return 'cpp';
  // C++ 特征（须在 JS 之前判断：// 注释与行尾 { 与 JS 撞车）
  if (first.startsWith('#include')) return 'cpp';
  if (/\bstd::/.test(first)) return 'cpp';
  if (/^(int|void|auto|template|using)\b.*[({;]/.test(first) && /\b(main|namespace)\b|>>?/.test(first)) return 'cpp';
  // JS 特征：// 注释、function/const/let/var/new、class X {、行尾 {
  if (first.startsWith('//')) return 'javascript';
  if (/\b(function|const|let|var|new)\b/.test(first)) return 'javascript';
  if (/^class\s+\w+\s*\{/.test(first)) return 'javascript';
  if (first.endsWith('{')) return 'javascript';
  // Python 特征：def/import/from/class X:/装饰器、# 注释、行尾 :
  if (/^(def |import |from |class \w+:|@|print\()/.test(first)) return 'python';
  if (/(^|\s)#/.test(first)) return 'python';
  if (first.endsWith(':')) return 'python';
  return '';
}

// 解析代码围栏首行信息：'' | 语言名 | run 系列；run-js#demo-id 提供稳定示例 ID。
function parseFenceInfo(block) {
  const nl = block.indexOf('\n');
  const firstLine = (nl === -1 ? block : block.slice(0, nl)).trim();
  const match = firstLine.match(/^([a-zA-Z-]*)(?:#([a-z0-9][a-z0-9-]*))?$/);
  if (match) {
    return { info: match[1], exampleId: match[2] || '', code: nl === -1 ? '' : block.slice(nl + 1) };
  }
  return { info: '', exampleId: '', code: block };
}

const CALLOUT_TYPES = { 注意: 'warn', 提示: 'tip', 重点: 'important', 例子: 'example' };

function renderTable(tbl) {
  const rows = tbl.map((r) =>
    r
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())
  );
  if (!rows.length) return '';
  const isSep = (row) => row.every((c) => /^:?-{2,}:?$/.test(c));
  const header = rows[0];
  // 第二行是分隔行（|---|---|）时跳过
  const bodyRows = rows.length > 1 && isSep(rows[1]) ? rows.slice(2) : rows.slice(1);
  return (
    `<table><thead><tr>${header.map((c) => `<th>${renderInline(c)}</th>`).join('')}</tr></thead>` +
    `<tbody>${bodyRows.map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  );
}

function renderCallout(lines) {
  const first = lines[0].replace(/^>\s?/, '');
  const m = first.match(/^(注意|提示|重点|例子)[：:](.*)$/);
  const type = m ? CALLOUT_TYPES[m[1]] : 'tip';
  const title = m ? m[1] : '提示';
  const contentLines = m ? [m[2].trim(), ...lines.slice(1).map((l) => l.replace(/^>\s?/, ''))] : lines.map((l) => l.replace(/^>\s?/, ''));
  const inner = contentLines.filter((l) => l !== '').map(renderInline).join('<br>');
  return `<div class="callout callout-${type}"><div class="callout-title">${title}</div><div class="callout-body">${inner}</div></div>`;
}

export function md(src) {
  const blocks = String(src).replace(/\r\n?/g, '\n').split(/```/);
  let html = '';
  blocks.forEach((block, i) => {
    if (i % 2 === 1) {
      // 代码块
      const { info, exampleId, code: rawCode } = parseFenceInfo(block);
      const code = rawCode.replace(/\n$/, '');
      let lang = '';
      let run = '';
      if (info === 'run' || info === 'run-js' || info === 'run-py' || info === 'run-cpp') {
        lang = info === 'run-js' ? 'javascript' : info === 'run-py' ? 'python' : info === 'run-cpp' ? 'cpp' : detectLang(code);
        run = lang || 'javascript';
      } else if (info === 'js' || info === 'javascript') {
        lang = 'javascript';
      } else if (info === 'py' || info === 'python') {
        lang = 'python';
      } else if (info === 'cpp' || info === 'c++') {
        lang = 'cpp';
      } else {
        lang = detectLang(code);
      }
      html += `<pre${lang ? ` data-lang="${lang}"` : ''}${run ? ` data-run="${run}"` : ''}${exampleId ? ` data-example-id="${exampleId}"` : ''}><code>${escapeHtml(code)}</code></pre>`;
      return;
    }
    const lines = block.split('\n');
    let para = [];
    let list = [];
    let listType = 'ul';
    let listStart = 1;
    let tbl = [];
    let quote = [];
    const flushPara = () => {
      if (para.length) {
        html += `<p>${para.map(renderInline).join('<br>')}</p>`;
        para = [];
      }
    };
    const flushList = () => {
      if (list.length) {
        html += `<${listType}${listType === 'ol' ? ` start="${listStart}"` : ''}>${list.map((li) => `<li>${renderInline(li)}</li>`).join('')}</${listType}>`;
        list = [];
      }
    };
    const flushTable = () => {
      if (tbl.length) {
        html += renderTable(tbl);
        tbl = [];
      }
    };
    const flushQuote = () => {
      if (quote.length) {
        html += renderCallout(quote);
        quote = [];
      }
    };
    const flushAll = () => {
      flushPara();
      flushList();
      flushTable();
      flushQuote();
    };
    for (const line of lines) {
      const trimmed = line.trim();
      const heading = trimmed.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
      const bullet = trimmed.match(/^([-+*])\s+(.+)$/);
      const ordered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
      if (heading) {
        flushAll();
        const level = heading[1].length;
        html += `<h${level}>${renderInline(heading[2])}</h${level}>`;
      } else if (/^(?:-\s*){3,}$|^(?:\*\s*){3,}$|^(?:_\s*){3,}$/.test(trimmed)) {
        flushAll(); html += '<hr>';

      } else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushPara();
        flushList();
        flushQuote();
        tbl.push(trimmed);
      } else if (trimmed.startsWith('>')) {
        flushPara();
        flushList();
        flushTable();
        quote.push(trimmed);
      } else if (bullet || ordered) {
        flushPara();
        flushTable();
        flushQuote();
        const type = ordered ? 'ol' : 'ul';
        if (list.length && listType !== type) flushList();
        if (!list.length) listStart = ordered ? Number(ordered[1]) : 1;
        listType = type;
        list.push(ordered ? ordered[2] : bullet[2]);
      } else if (trimmed === '') {
        flushAll();
      } else {
        flushList();
        flushTable();
        flushQuote();
        para.push(trimmed);
      }
    }
    flushAll();
  });
  return html;
}
