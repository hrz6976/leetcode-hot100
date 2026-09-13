import test from 'node:test';
import assert from 'node:assert/strict';
import { md } from '../js/md.js';
import { createLineBuffer } from '../js/stream-markdown.js';
test('标题、分隔线、列表和代码安全渲染', () => {
  const html = md('## 思路\n\n---\n\n1. **第一步**\n2. *第二步*\n\n+ 补充\n\n`**不加粗**`\n\n<script>alert(1)</script>');
  assert.match(html, /<h2>思路<\/h2>/);
  assert.match(html, /<hr>/);
  assert.match(html, /<ol start="1"><li><strong>第一步<\/strong><\/li><li><em>第二步<\/em><\/li><\/ol>/);
  assert.match(html, /<ul><li>补充<\/li><\/ul>/);
  assert.match(html, /<code>\*\*不加粗\*\*<\/code>/);
  assert.ok(!html.includes('<script>'));
  assert.match(md('```run-js#example\nconsole.log(1)\n```'), /data-run="javascript" data-example-id="example"/);
});
test('逐 token 不重排，换行只提交完整行，结束提交末尾', () => {
  const renders=[]; const buffer=createLineBuffer(value=>renders.push(value));
  buffer.push('## 标');buffer.push('题');assert.equal(renders.length,0);
  buffer.push('\n下一');assert.deepEqual(renders,['## 标题\n']);
  buffer.push('行');assert.equal(renders.length,1);
  buffer.push('\n---\n尾');assert.equal(renders.at(-1),'## 标题\n下一行\n---\n');
  buffer.finish();assert.equal(renders.at(-1),'## 标题\n下一行\n---\n尾');
  const count=renders.length;buffer.finish();assert.equal(renders.length,count);
});

test('未完成行立即预览，换行替换预览，结束不重复尾部', () => {
  const renders = [], previews = [];
  const buffer = createLineBuffer(t => renders.push(t), (tail, complete) => previews.push({tail, complete}));
  buffer.push('**半');
  assert.deepEqual(previews.at(-1), {tail:'**半',complete:''});
  assert.equal(renders.length,0);
  buffer.push('行**\n下一行');
  assert.deepEqual(renders,['**半行**\n']);
  assert.deepEqual(previews.at(-1),{tail:'下一行',complete:'**半行**\n'});
  buffer.finish();
  assert.equal(renders.at(-1),'**半行**\n下一行');
  assert.equal(previews.at(-1).tail,'');
});

test('跨片段代码围栏及 HTML 尾部保持原文交给安全文本预览', () => {
  let tail, complete;
  const buffer = createLineBuffer(()=>{},(t,c)=>{tail=t;complete=c;});
  buffer.push('``'); buffer.push('`js\nconst x = "<img>";');
  assert.equal(complete,'```js\n');
  assert.equal(tail,'const x = "<img>";');
  buffer.push('\n```\n**末');
  assert.equal(tail,'**末');
  assert.equal(complete,'```js\nconst x = "<img>";\n```\n');
});
