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
