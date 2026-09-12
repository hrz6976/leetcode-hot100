import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { articles, loadArticle } from '../knowledge/index.js';
import { relatedProblems } from '../js/views/knowledge.js';
import { md } from '../js/md.js';
const expected = { complexity:'6', 'array-hashmap':'0 1', 'two-pointers':'1 3 12 0 0', 'sliding-window':'2', 'linked-list':'3 2 1', 'stack-queue':'3 1 1 0', 'binary-tree':'3', 'graph-dfs-bfs':'2', 'binary-search':'1', backtracking:'[]\n[1]\n[1,2]\n[2]', 'dynamic-programming':'12', 'heap-greedy':'5', 'bit-tricks':'4' };
let hasCpp = true;
try { execFileSync('g++', ['--version'], { stdio: 'ignore' }); } catch { hasCpp = false; }
for (const item of articles) {
  test(`知识文章 ${item.slug}：推荐题与三语言示例`, async t => {
    const article = await loadArticle(item.slug);
    assert.deepEqual(relatedProblems(article).map(p => p.id), article.relatedProblems.map(p => p.id));
    assert.ok(article.relatedProblems.every(p => p.reason));
    const examples = [...article.content.matchAll(/```run-(py|js|cpp)#([\w-]+)\n([\s\S]*?)```/g)];
    assert.equal(examples.length, 3);
    assert.equal(new Set(examples.map(example => example[2])).size, 1);
    const html = md(article.content);
    assert.equal((html.match(/data-run=/g) || []).length, 3);
    const dir = await mkdtemp(join(tmpdir(), 'hot100-example-'));
    t.after(() => rm(dir, { recursive:true, force:true }));
    for (const [, lang, id, code] of examples) {
      await t.test(lang, child => {
        let output;
        if (lang === 'js') {
          const lines = [];
          vm.runInNewContext(code, { console: { log: (...args) => lines.push(args.join(' ')) } }, { timeout: 2000 });
          output = lines.join('\n');
        } else if (lang === 'py') output = execFileSync('python3', ['-c', code], { encoding:'utf8', timeout: 5000 });
        else {
          if (!hasCpp) return child.skip('未安装 g++');
          const path = join(dir, id);
          execFileSync('g++', ['-std=c++17', '-x', 'c++', '-o', path, '-'], { input:code, timeout:30000 });
          output = execFileSync(path, [], { encoding:'utf8', timeout:5000 });
        }
        assert.equal(output.trim(), expected[item.slug]);
      });
    }
  });
}
