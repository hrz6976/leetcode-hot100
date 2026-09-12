// 知识文章：图、网格与搜索
export default {
  "slug": "graph-dfs-bfs",
  "title": "图、网格与搜索",
  "intro": "先确定节点和相邻关系，再用 DFS、BFS 或拓扑排序处理。",
  "tags": ["图","深度优先搜索","广度优先搜索","拓扑排序","矩阵"],
  "relatedProblems": [
    {
      "id": 200,
      "stage": "core",
      "reason": "标记一整片相连陆地"
    },
    {
      "id": 994,
      "stage": "core",
      "reason": "从多个起点同时逐层扩张"
    },
    {
      "id": 207,
      "stage": "practice",
      "reason": "用入度处理先修依赖"
    },
    {
      "id": 79,
      "stage": "practice",
      "reason": "区分全局访问与当前路径访问"
    }
  ],
  content: `
图由节点和连接组成。网格里的相邻格子、课程之间的先修关系，都可以看成图。先决定哪些东西是节点、怎样才算相邻，再选择遍历方法。

和树相比，图可能有环，也可能从多条路到达同一节点，因此通常需要记录访问状态。

### 岛屿数量：一次搜索标记一整片陆地

第 200 题里，陆地是字符 '1'，水是字符 '0'，只按上下左右连接。

从左到右、从上到下扫描。遇到尚未访问的陆地，岛屿数加一，再从这里搜索，把能连通的陆地全部标记掉。以后扫描到同一片岛上的其他格子，就不会重复计数。

例如下面这个网格有两座岛。左上三个格子相连；右下那个格子虽然斜着挨近它们，但不算四方向相邻。

| 行 | 第 0 列 | 第 1 列 | 第 2 列 |
| --- | --- | --- | --- |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 2 | 0 | 0 | 1 |

深度优先搜索 DFS 会沿一条路尽量继续走，走不通再返回。可以递归，也可以用显式栈。下面用栈，避免大网格递归过深。代码会把访问过的陆地改成 '0'；若要保留输入，应复制网格或另外维护 visited。

\`\`\`run-py#graph-dfs-bfs-v2-demo
def islands(grid):
    if not grid or not grid[0]:
        return 0
    rows, cols = len(grid), len(grid[0])
    answer = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != '1':
                continue
            answer += 1
            grid[r][c] = '0'
            stack = [(r, c)]
            while stack:
                x, y = stack.pop()
                for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == '1':
                        grid[nx][ny] = '0'  # 入栈时标记，避免重复安排
                        stack.append((nx, ny))
    return answer

print(islands([list('110'), list('010'), list('001')]))
\`\`\`

\`\`\`run-js#graph-dfs-bfs-v2-demo
function islands(grid) {
  if (!grid.length || !grid[0].length) return 0;
  const rows = grid.length, cols = grid[0].length;
  let answer = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (grid[r][c] !== '1') continue;
    answer++;
    grid[r][c] = '0';
    const stack = [[r, c]];
    while (stack.length) {
      const [x, y] = stack.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] === '1') {
          grid[nx][ny] = '0';
          stack.push([nx, ny]);
        }
      }
    }
  }
  return answer;
}
console.log(islands(['110', '010', '001'].map(row => [...row])));
\`\`\`

\`\`\`run-cpp#graph-dfs-bfs-v2-demo
#include <iostream>
#include <vector>
#include <string>
#include <utility>
using namespace std;
int islands(vector<string>& grid) {
    if (grid.empty() || grid[0].empty()) return 0;
    int rows = grid.size(), cols = grid[0].size(), answer = 0;
    const vector<pair<int,int>> directions = {{1,0},{-1,0},{0,1},{0,-1}};
    for (int r = 0; r < rows; ++r) for (int c = 0; c < cols; ++c) {
        if (grid[r][c] != '1') continue;
        ++answer; grid[r][c] = '0';
        vector<pair<int,int>> stack = {{r,c}};
        while (!stack.empty()) {
            auto [x,y] = stack.back(); stack.pop_back();
            for (auto [dx,dy] : directions) {
                int nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] == '1') {
                    grid[nx][ny] = '0'; stack.push_back({nx,ny});
                }
            }
        }
    }
    return answer;
}
int main() {
    vector<string> grid = {"110", "010", "001"};
    cout << islands(grid) << '\\n';
}
\`\`\`

每个格子最多被发现一次，检查四个邻居是固定工作量，因此时间 O(行数×列数)。栈最坏也可能保存这么多位置，额外空间 O(行数×列数)。原地标记并不代表总额外空间就是 O(1)。

### 访问标记应该什么时候写

发现新节点、准备把它加入栈或队列时，就把它标为已发现。否则同一节点在真正弹出之前，可能被不同邻居反复加入。

这个标记表示“已经安排处理”，不一定表示它的所有邻居都已处理。更复杂的图算法还会区分“正在处理”和“已处理完”。

### BFS 为什么能求无权最短路

广度优先搜索 BFS 使用队列，从起点开始一层层向外扩张。第一层经过一条边，第二层经过两条边。若每条边的代价相同，第一次发现节点时，就找到了最少边数的路径。

这依赖于等代价条件。带不同权重的图不能直接拿普通 BFS 算最短路；“边数最少”不一定“总权重最小”。

第 994 题“腐烂的橘子”要把所有一开始腐烂的橘子都作为起点入队。每轮处理队列当前这一层，表示经过一分钟。它们是同时传播，不是把每个起点单独搜索的时间加起来。

### 课程表：用入度找可以先学的课

第 207 题中，[a,b] 表示学 a 之前必须学 b，所以建立有向边 b→a。入度是一个节点还剩多少个未满足的前置依赖。

把入度为 0 的课程放入队列。每取出一门课，就相当于学完它，把它后续课程的入度减一；谁变成 0，就可以入队。

如果最后处理了所有课程，就能完成；如果仍有课程没处理，剩下的依赖关系里有环。这叫拓扑排序。邻接表实现的时间与空间通常都是 O(V+E)，V 是课程数，E 是依赖边数。

### 全局访问与路径访问不能混用

岛屿计数中，访问过的格子可以永久标记，因为我们只关心它属于哪片连通区域。

第 79 题“单词搜索”却要求同一条路径不能重复使用格子。尝试失败后，这个格子仍然可能被另一条路径使用，所以要在回退时撤销标记。这是回溯，与普通的全局 visited 不同。

### 练习顺序

先做第 200 题，把网格变成图；再做第 994 题，理解多个起点同时扩张；接着做第 207 题，练习有向依赖；读完回溯后做第 79 题。

先写清节点、邻居、访问标记的含义，再选择栈或队列。这样比记一大段 DFS/BFS 模板更容易避免重复访问和错误计数。
`,
};
