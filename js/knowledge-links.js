import { articles } from '../knowledge/index.js';
const bySlug = new Map(articles.map(article => [article.slug, article]));
const focusedTags = new Map([
  ['链表', 'linked-list'], ['二叉树', 'binary-tree'], ['树', 'binary-tree'], ['二叉搜索树', 'binary-tree'],
  ['回溯', 'backtracking'], ['动态规划', 'dynamic-programming'], ['记忆化搜索', 'dynamic-programming'],
  ['二分查找', 'binary-search'], ['滑动窗口', 'sliding-window'],
  ['单调栈', 'stack-queue'], ['单调队列', 'stack-queue'], ['栈', 'stack-queue'], ['队列', 'stack-queue'],
  ['图', 'graph-dfs-bfs'], ['拓扑排序', 'graph-dfs-bfs'], ['并查集', 'graph-dfs-bfs'],
  ['堆（优先队列）', 'heap-greedy'], ['贪心', 'heap-greedy'], ['位运算', 'bit-tricks'],
  ['前缀和', 'array-hashmap'], ['哈希表', 'array-hashmap'], ['双指针', 'two-pointers'],
]);
export function articlesForProblem(problem) {
  const explicit = articles.filter(article => article.slug !== 'complexity' && article.relatedProblems?.some(entry => Number(entry.id ?? entry) === problem.id));
  if (explicit.length) return explicit.slice(0, 2);
  const slugs = [...focusedTags].filter(([tag]) => problem.tags.includes(tag)).map(([, slug]) => slug);
  if (!slugs.length && problem.tags.some(tag => ['深度优先搜索', '广度优先搜索'].includes(tag))) slugs.push('graph-dfs-bfs');
  if (!slugs.length && problem.tags.includes('数组')) slugs.push('array-hashmap');
  return [...new Set(slugs)].slice(0, 2).map(slug => bySlug.get(slug));
}
export function articleForTag(tag, problem) {
  if (focusedTags.has(tag)) return focusedTags.get(tag);
  if (['深度优先搜索', '广度优先搜索', '递归'].includes(tag)) {
    if (problem.tags.includes('二叉树')) return 'binary-tree';
    if (problem.tags.includes('链表')) return 'linked-list';
    return 'graph-dfs-bfs';
  }
  if (tag === '数组' || tag === '计数') return 'array-hashmap';
  return articlesForProblem(problem)[0]?.slug || null;
}
