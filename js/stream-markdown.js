// 完整行交给 Markdown；未换行的尾部仅更新纯文本预览。
export function createLineBuffer(render, preview = () => {}) {
  let text = '', rendered = '';
  function commit(value) {
    if (value === rendered) return;
    rendered = value;
    render(value);
  }
  return {
    push(delta) {
      text += delta;
      const end = text.lastIndexOf('\n');
      const complete = text.slice(0, end + 1);
      if (end >= 0) commit(complete);
      preview(text.slice(end + 1), complete);
    },
    finish() { commit(text); preview('', text); },
  };
}
