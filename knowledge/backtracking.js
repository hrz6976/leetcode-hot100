// 知识文章：回溯：有次序地尝试所有选择
export default {
  "slug": "backtracking",
  "title": "回溯：有次序地尝试所有选择",
  "intro": "明确选择范围、结束条件和撤销操作，避免漏解与重复。",
  "tags": ["回溯","递归"],
  "relatedProblems": [
    {
      "id": 78,
      "stage": "core",
      "reason": "用起始下标生成子集"
    },
    {
      "id": 46,
      "stage": "core",
      "reason": "用使用状态生成排列"
    },
    {
      "id": 39,
      "stage": "practice",
      "reason": "重复选取与剩余目标"
    },
    {
      "id": 22,
      "stage": "practice",
      "reason": "提前排除非法括号前缀"
    },
    {
      "id": 131,
      "stage": "practice",
      "reason": "按回文片段继续搜索"
    },
    {
      "id": 79,
      "stage": "practice",
      "reason": "失败后恢复访问标记"
    },
    {
      "id": 51,
      "stage": "practice",
      "reason": "记录列与对角线限制"
    }
  ],
  content: `
有些题要求列出所有子集、排列或合法摆法。答案本来就可能很多，这时可以系统地尝试每一种选择，走不下去或得到一个答案后，再返回上一步继续尝试。

回溯里最值得先想清楚的是：这一步可以选什么，已经选了什么，什么时候算完成，以及返回后要恢复哪些状态。

### 子集：每次只往后选择

第 78 题给出互不相同的数组，要求所有子集。对 [1,2]，答案是 []、[1]、[1,2]、[2]，顺序不重要。

维护 path 表示当前已经选中的元素，再用 start 表示下一次允许从哪个下标开始选。每次调用先保存 path，因为任何已选择的组合都是一个子集。

从 start 开始逐个尝试 nums[i]：加入 path，递归处理 i+1 之后的元素，递归返回后弹出刚加入的元素。

| 当前 path | 下一步 |
| --- | --- |
| [] | 保存空集，先尝试 1 |
| [1] | 保存它，再尝试 2 |
| [1,2] | 保存它，无元素可选，退回 [1] |
| [1] | 结束当前分支，退回 [] |
| [] | 尝试 2，得到并保存 [2] |

限制只能选后面的元素，就不会把 [1,2] 和 [2,1] 当成两种不同子集，也不会重复使用同一个位置。

\`\`\`run-py#backtracking-v2-demo
def subsets(nums):
    answer, path = [], []
    def search(start):
        answer.append(path.copy())
        for i in range(start, len(nums)):
            path.append(nums[i])
            search(i + 1)
            path.pop()
    search(0)
    return answer

for subset in subsets([1, 2]):
    print('[' + ','.join(map(str, subset)) + ']')
\`\`\`

\`\`\`run-js#backtracking-v2-demo
function subsets(nums) {
  const answer = [], path = [];
  function search(start) {
    answer.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      search(i + 1);
      path.pop();
    }
  }
  search(0);
  return answer;
}
for (const subset of subsets([1, 2])) console.log(JSON.stringify(subset));
\`\`\`

\`\`\`run-cpp#backtracking-v2-demo
#include <iostream>
#include <vector>
#include <functional>
using namespace std;
vector<vector<int>> subsets(const vector<int>& nums) {
    vector<vector<int>> answer;
    vector<int> path;
    function<void(int)> search = [&](int start) {
        answer.push_back(path);
        for (int i = start; i < (int)nums.size(); ++i) {
            path.push_back(nums[i]); search(i + 1); path.pop_back();
        }
    };
    search(0);
    return answer;
}
int main() {
    for (const auto& subset : subsets({1,2})) {
        cout << '[';
        for (int i = 0; i < (int)subset.size(); ++i) cout << (i ? "," : "") << subset[i];
        cout << "]\\n";
    }
}
\`\`\`

### 为什么保存答案时必须复制

path 在后续搜索中会继续被加入和删除。若直接把同一个列表对象放进答案，多个答案可能都指向它，最后一起变成空列表或相同内容。

Python 用 path.copy()，JavaScript 用 [...path]，C++ 的 vector 按值放入另一个 vector 时会复制。

这是保存结果的问题，与回退时的 pop 不能互相替代：复制保证已经保存的答案不变，pop 保证下一个分支从正确状态开始。

### 子集、组合、排列的选择范围不同

子集和不考虑顺序的组合，通常让下一次从 i+1 开始，避免重复选择前面的位置。

第 39 题允许同一个候选数使用多次，选中 nums[i] 后，下次仍从 i 开始。题目保证候选数是正整数，所以剩余目标会不断减小。若允许 0 或负数，照此递归可能无法结束。

第 46 题排列考虑顺序，下一步可以选任何尚未使用的位置。因此不能用 start 把前面的位置全排除，而要维护 used。

### 剪枝是提前排除不可能完成的分支

生成括号时，若已经使用的右括号比左括号多，后面再添加字符也无法修复这个前缀，所以不要继续。左括号已经用满 n 个时，也不能再添加左括号。

组合总和里，如果候选数已经排序，且 nums[i] 大于剩余目标，那么 i 后面的数只会更大，可以结束当前循环。这个结论依赖正整数与排序条件。

剪枝不能只靠“看起来不太像答案”。每个被剪掉的分支，都应该有一个无法完成的具体理由。

### 重复输入怎样去重

假设输入允许重复值，排序后常用条件 i>start 且 nums[i]==nums[i−1] 来跳过同一层的重复选择。

i>start 很重要：它只跳过本轮同一选择位置上的重复值，不会禁止在更深一层使用第二个相同元素。例如输入 [1,1]，子集 [1,1] 仍然应该允许。

排列的重复值去重还要结合 used 判断，不能原样复制组合的条件。

### 时间和空间不要只数递归深度

n 个不同元素有 2ⁿ 个子集。保存每个答案需要复制 path，总时间与输出空间按 O(n·2ⁿ) 分析；不计输出时，递归栈和当前路径是 O(n)。

全排列有 n! 个答案，复制输出使时间达到 O(n·n!)。剪枝能减少某些输入上的实际工作量，但不意味着最坏情况自动变成多项式时间。

### 练习顺序

第 78 题练选择范围与复制；第 46 题练 used；第 39 题练重复选取与剪枝；第 22 题练合法前缀；再做第 131 题、第 79 题与第 51 题。

调试时先把输入缩到两三个元素，逐步写出 path。返回上一层以后，如果 path、used 或棋盘没有恢复到进入前的状态，下一个分支就会带着上一个分支的错误继续运行。
`,
};
