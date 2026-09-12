import { problems, loadProblem } from '../problems/index.js';
import { md } from './md.js';

const byId = new Map(problems.map(problem => [problem.id, problem]));

export function problemReferences(text) {
  return [...text.matchAll(/第\s*(\d+)\s*题/g)].flatMap(match => {
    const problem = byId.get(Number(match[1]));
    return problem ? [{ index:match.index, text:match[0], problem }] : [];
  });
}

// 在渲染后的正文文本节点中添加入口，避免改动代码块和已有交互元素。
export function mountProblemPreviews(container) {
  const prose = container.querySelector('.karticle-main > .desc');
  const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT, {
    acceptNode: node => node.parentElement.closest('a,button,code,pre,textarea,script,style')
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const refs = problemReferences(node.textContent); if (!refs.length) continue;
    const fragment = document.createDocumentFragment(); let end = 0;
    for (const ref of refs) {
      fragment.append(node.textContent.slice(end, ref.index));
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'problem-reference';
      button.dataset.previewProblem = ref.problem.id; button.textContent = ref.text;
      button.title = `预览：${ref.problem.title}`;
      button.setAttribute('aria-label', `预览第 ${ref.problem.id} 题：${ref.problem.title}`);
      button.setAttribute('aria-haspopup', 'dialog');
      fragment.append(button); end = ref.index + ref.text.length;
    }
    fragment.append(node.textContent.slice(end)); node.replaceWith(fragment);
  }

  const dialog = document.createElement('dialog'); dialog.className = 'problem-preview';
  dialog.setAttribute('aria-labelledby', 'problem-preview-title');
  dialog.innerHTML = `<div class="problem-preview-layout">
    <header class="problem-preview-head"><div><span class="problem-preview-eyebrow">题目预览</span><h2 id="problem-preview-title"></h2></div><div class="problem-preview-actions"><a class="btn primary" href="#/knowledge">去做这题 →</a><button type="button" class="btn" aria-label="关闭题目预览" autofocus>关闭</button></div></header>
    <div class="problem-preview-body desc" aria-live="polite"></div>
  </div>`;
  document.body.append(dialog);
  const title = dialog.querySelector('h2');
  const body = dialog.querySelector('.problem-preview-body');
  const link = dialog.querySelector('a');
  const close = dialog.querySelector('button');
  let generation = 0, disposed = false, trigger = null;
  const onClose = () => { generation++; if (trigger?.isConnected) trigger.focus({ preventScroll:true }); };
  dialog.addEventListener('close', onClose);
  close.onclick = () => dialog.close();
  let backdropDown = false;
  dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog; });
  dialog.addEventListener('click', event => { if (backdropDown && event.target === dialog) dialog.close(); backdropDown = false; });

  async function open(id, button) {
    const problem = byId.get(id); if (!problem) return;
    const current = ++generation; trigger = button;
    title.textContent = `${id}. ${problem.title}`;
    link.href = `#/problem/${id}`; body.textContent = '正在加载题目…';
    if (!dialog.open) dialog.showModal();
    try {
      const full = await loadProblem(id);
      if (disposed || current !== generation || !dialog.open) return;
      body.innerHTML = md(full.description); body.scrollTop = 0;
    } catch {
      if (disposed || current !== generation || !dialog.open) return;
      body.textContent = '题目暂时加载失败。请关闭后重试，或点击下方「去做这题」。';
    }
  }
  const onClick = event => {
    const button = event.target.closest('[data-preview-problem]');
    if (!button || !container.contains(button)) return;
    event.preventDefault(); void open(Number(button.dataset.previewProblem), button);
  };
  container.addEventListener('click', onClick);
  return () => {
    disposed = true; generation++;
    container.removeEventListener('click', onClick);
    dialog.removeEventListener('close', onClose);
    dialog.close(); dialog.remove();
  };
}
