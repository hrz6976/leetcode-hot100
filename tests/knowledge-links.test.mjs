import test from 'node:test';
import assert from 'node:assert/strict';
import { problems } from '../problems/index.js';
import { articlesForProblem, articleForTag } from '../js/knowledge-links.js';
test('知识推荐优先使用明确关联，不能因为数组标签推荐动态规划', () => {
  const problem = problems.find(p => p.id === 1);
  assert.deepEqual(articlesForProblem(problem).map(a => a.slug), ['array-hashmap']);
  assert.equal(articleForTag('哈希表', problem), 'array-hashmap');
});
test('树的搜索标签指向树，未明确关联的动态规划题仍有相关讲解', () => {
  const tree = problems.find(p => p.id === 105);
  assert.equal(articleForTag('深度优先搜索', tree), 'binary-tree');
  const dp = problems.find(p => p.id === 152);
  assert.equal(articlesForProblem(dp)[0].slug, 'dynamic-programming');
});
