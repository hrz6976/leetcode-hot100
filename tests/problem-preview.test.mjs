import test from 'node:test';
import assert from 'node:assert/strict';
import { articles, loadArticle } from '../knowledge/index.js';
import { loadProblem } from '../problems/index.js';
import { problemReferences } from '../js/problem-preview.js';

test('所有知识文章引用的题目都有可预览的题意', async () => {
  let count = 0;
  for (const summary of articles) {
    const article = await loadArticle(summary.slug);
    const matches = [...article.content.matchAll(/第\s*(\d+)\s*题/g)];
    const references = problemReferences(article.content);
    assert.equal(references.length, matches.length, `${article.slug} 引用了未知题目`);
    for (const reference of references) {
      const problem = await loadProblem(reference.problem.id);
      assert.ok(problem.description.trim().length > 20, `第 ${problem.id} 题没有题意`);
      count++;
    }
  }
  assert.ok(count > 50);
});

test('引用保留原文位置，支持带空格和连续出现的多个题号', () => {
  const text='先看第74题，再看第 240 题；第99999题尚未收录。';
  const refs=problemReferences(text);
  assert.deepEqual(refs.map(r=>r.problem.id),[74,240]);
  for(const ref of refs) assert.equal(text.slice(ref.index,ref.index+ref.text.length),ref.text);
  assert.equal(problemReferences('做了 74 次循环，时间是 O(n²)').length,0);
});
