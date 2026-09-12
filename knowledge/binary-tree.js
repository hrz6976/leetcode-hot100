// 知识文章：二叉树与递归
export default {
  "slug": "binary-tree",
  "title": "二叉树与递归",
  "intro": "说清一次递归返回什么，再用左右子树的结果处理当前节点。",
  "tags": ["二叉树","递归","二叉搜索树"],
  "relatedProblems": [
    {
      "id": 104,
      "stage": "core",
      "reason": "定义子树深度"
    },
    {
      "id": 226,
      "stage": "core",
      "reason": "分别处理左右孩子"
    },
    {
      "id": 94,
      "stage": "practice",
      "reason": "辨认访问节点的时机"
    },
    {
      "id": 102,
      "stage": "practice",
      "reason": "按队列当前长度处理一层"
    },
    {
      "id": 98,
      "stage": "practice",
      "reason": "验证整棵子树的范围"
    },
    {
      "id": 543,
      "stage": "practice",
      "reason": "区分向上返回值与全局答案"
    },
    {
      "id": 236,
      "stage": "practice",
      "reason": "判断祖先与两侧子树的关系"
    },
    {
      "id": 124,
      "stage": "practice",
      "reason": "计算路径贡献并处理负数"
    }
  ],
  content: `
二叉树的每个节点最多有左、右两个孩子。很多树题的做法是：先说明“给我一棵以 node 为根的树，这个函数返回什么”，再用左右子树的结果计算当前结果。

递归不是让你在脑中同时追踪几十次调用。先确定一次调用的约定，再检查空节点和当前节点这两种情况。

### 例子：求最大深度

规定 depth(node) 返回“以 node 为根的树，有多少层”。空树没有节点，深度是 0。非空树的深度，则是左右子树较大深度再加 1。

例如根节点 1，左孩子 2，右孩子 3，且 2 还有左孩子 4。节点 4 和 3 的深度都是 1；节点 2 的深度是 2；根节点 1 的深度就是 3。

递归函数里只要拿到 depth(node.left) 和 depth(node.right)，就能按照定义组合答案。左右子树都比当前树小，并最终到达空节点，所以递归可以结束。

\`\`\`run-py#binary-tree-v2-demo
class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def depth(node):
    if node is None:
        return 0
    return 1 + max(depth(node.left), depth(node.right))

root = Node(1, Node(2, Node(4)), Node(3))
print(depth(root))
\`\`\`

\`\`\`run-js#binary-tree-v2-demo
class Node {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}
function depth(node) {
  if (node === null) return 0;
  return 1 + Math.max(depth(node.left), depth(node.right));
}
const root = new Node(1, new Node(2, new Node(4)), new Node(3));
console.log(depth(root));
\`\`\`

\`\`\`run-cpp#binary-tree-v2-demo
#include <iostream>
#include <algorithm>
using namespace std;
struct Node { int val; Node* left = nullptr; Node* right = nullptr; };
int depth(Node* node) {
    if (node == nullptr) return 0;
    return 1 + max(depth(node->left), depth(node->right));
}
int main() {
    Node d{4}, b{2, &d}, c{3}, root{1, &b, &c};
    cout << depth(&root) << '\\n';
}
\`\`\`

每个节点只访问一次，时间 O(n)。递归栈保存当前路径上的调用，额外空间 O(h)，其中 h 是树高。平衡树通常是 O(log n)，只有单边的树则是 O(n)，也可能超过语言的递归深度限制。

### 前序、中序、后序究竟差在哪

它们的区别是处理当前节点的时机：

- 前序：当前节点、左子树、右子树。适合从根往下传信息，例如记录当前路径。
- 中序：左子树、当前节点、右子树。二叉搜索树按此顺序访问，能得到有序序列。
- 后序：左子树、右子树、当前节点。适合先拿到孩子的结果，再计算父节点，例如深度与直径。

“处理节点”不一定是打印值，也可以是更新答案、构造结构或比较信息。一个函数先递归两边，最后才计算当前节点，就属于后序处理。

### 返回给父节点的值，未必是题目的答案

第 543 题求树的直径，直径按边数计算。对于一个节点，若左右子树深度为 L 和 R，经过它的最长路径有 L+R 条边。

但返回父节点时，不能把左右两条路都交出去。父节点经过当前节点继续走，只能选择一边，所以返回 1+max(L,R)。用另一个变量记录所有节点处 L+R 的最大值。

第 124 题最大路径和也有类似区别：更新全局答案时可以连接左右两边，向父节点返回时只能提供一条向下路径。负贡献可以不选；全局答案应考虑全负数的树，不能随手初始化为 0。

### 二叉搜索树需要检查整条路径的范围

二叉搜索树要求：左子树所有值小于当前值，右子树所有值大于当前值。只比较当前节点与两个孩子不够。

例如根为 10，右孩子为 15，而 15 的左孩子为 6。6<15 满足局部关系，但 6 位于 10 的右子树，又小于 10，整棵树仍然非法。

第 98 题可以给递归调用传递允许范围 (low,high)。走左边时缩小上界，走右边时提高下界。也可以中序遍历并检查值严格递增。题目是否允许重复值，会决定比较是否严格。

### 按层遍历用队列

第 102 题每次先记住队列当前长度，再处理这么多个节点，把他们的孩子加入队尾。这一批就是同一层。不能一边加入孩子，一边用不断变大的队列长度当本层终点。

层序遍历额外空间由最大层宽决定，最坏 O(n)。第 199 题右视图可以取每层最后一个节点。

### 练习与自查

依次做第 104 题、第 226 题、第 94 题、第 102 题、第 98 题，再做第 543 题。后面再看第 236 题最近公共祖先和第 124 题。

每次写递归前，写一句函数定义，明确空节点返回什么。再检查单节点树、只有左孩子的树、值相同但节点不同的情况。能分别解释“返回值”和“答案”，很多看起来复杂的树题就会清楚很多。
`,
};
