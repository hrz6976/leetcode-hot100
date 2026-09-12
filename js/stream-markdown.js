// 仅提交完整行；最后一个尚未换行的片段留到下一行或回复结束。
export function createLineBuffer(render) {
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
      if (end >= 0) commit(text.slice(0, end + 1));
    },
    finish() { commit(text); },
  };
}
