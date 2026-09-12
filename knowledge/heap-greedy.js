// 知识文章：堆与贪心选择
export default {
  "slug": "heap-greedy",
  "title": "堆与贪心选择",
  "intro": "用堆保留当前最值；用具体理由判断一次贪心选择是否可靠。",
  "tags": ["堆（优先队列）","贪心"],
  "relatedProblems": [
    {
      "id": 215,
      "stage": "core",
      "reason": "用小顶堆保留最大的 k 个数"
    },
    {
      "id": 347,
      "stage": "core",
      "reason": "按出现频次维护候选"
    },
    {
      "id": 295,
      "stage": "practice",
      "reason": "用两个堆分开较小和较大的一半"
    },
    {
      "id": 55,
      "stage": "practice",
      "reason": "维护最远可达位置"
    },
    {
      "id": 45,
      "stage": "practice",
      "reason": "按可达范围计算跳跃层数"
    },
    {
      "id": 763,
      "stage": "practice",
      "reason": "到达字符最后位置后切分"
    }
  ],
  content: `
堆是一种数据结构，贪心是一种选择策略。它们有时一起出现，但各自解决的问题不同：堆让你快速取出当前最小或最大的元素；贪心需要证明，眼前做出的选择不会妨碍得到整体最优答案。

### 已经排序的数组为什么还不够

如果所有数据一次给出，排序后取第 k 大很直接。但若数据不断加入，你需要反复获取最值，每次重新排序就可能浪费工作。

小顶堆让最小元素位于堆顶。读取堆顶 O(1)，插入或删除堆顶 O(log n)。堆内部只保证父子之间的大小关系，不保证整个数组从小到大排列，所以不能拿堆数组的第 k 个位置当第 k 小。

Python 提供 heapq，默认小顶堆。C++ 的 priority_queue 默认大顶堆，使用 greater 可以改为小顶堆。JavaScript 没有通用内置优先队列，需要自己实现或使用明确提供此功能的库。

### 用大小为 k 的小顶堆找第 k 大

第 215 题可以始终保留“目前见过的最大的 k 个数”。这 k 个数里最小的一个，就是当前第 k 大。

读入新数时：如果还没满 k 个，直接加入；如果已经满了，只有新数大于堆顶，才需要替换堆顶。更小的数不可能进入最大的 k 个数。

以 nums=[3,2,1,5,6,4]、k=2 为例，候选集合依次是 {3}、{2,3}、{2,3}、{3,5}、{5,6}、{5,6}。最后堆顶是 5。这里把候选写成集合便于阅读，实际堆数组并不是完整排序。

每次最多一次堆调整，总时间 O(n log k)，额外空间 O(k)。k=1 时退化成维护一个最大值，可按 O(n) 理解。相等元素按不同位置参与排名，第 k 大不等于第 k 个不同的值。

\`\`\`run-py#heap-greedy-v2-demo
import heapq

def kth_largest(nums, k):
    if not 1 <= k <= len(nums):
        raise ValueError('k 超出范围')
    heap = []
    for x in nums:
        if len(heap) < k:
            heapq.heappush(heap, x)
        elif x > heap[0]:
            heapq.heapreplace(heap, x)
    return heap[0]

print(kth_largest([3, 2, 1, 5, 6, 4], 2))
\`\`\`

\`\`\`run-js#heap-greedy-v2-demo
function kthLargest(nums, k) {
  if (!Number.isInteger(k) || k < 1 || k > nums.length) throw new Error('k 超出范围');
  const heap = [];
  // 插入后向上调整，直到父节点不大于当前节点。
  function push(x) {
    heap.push(x);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (heap[parent] <= heap[i]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  }
  function replaceTop(x) {
    heap[0] = x;
    let i = 0;
    while (2 * i + 1 < heap.length) {
      let child = 2 * i + 1;
      if (child + 1 < heap.length && heap[child + 1] < heap[child]) child++;
      if (heap[i] <= heap[child]) break;
      [heap[i], heap[child]] = [heap[child], heap[i]];
      i = child;
    }
  }
  for (const x of nums) {
    if (heap.length < k) push(x);
    else if (x > heap[0]) replaceTop(x);
  }
  return heap[0];
}
console.log(kthLargest([3, 2, 1, 5, 6, 4], 2));
\`\`\`

\`\`\`run-cpp#heap-greedy-v2-demo
#include <iostream>
#include <vector>
#include <queue>
#include <functional>
#include <stdexcept>
using namespace std;
int kthLargest(const vector<int>& nums, int k) {
    if (k < 1 || k > (int)nums.size()) throw invalid_argument("k 超出范围");
    priority_queue<int, vector<int>, greater<int>> heap;
    for (int x : nums) {
        if ((int)heap.size() < k) heap.push(x);
        else if (x > heap.top()) { heap.pop(); heap.push(x); }
    }
    return heap.top();
}
int main() { cout << kthLargest({3, 2, 1, 5, 6, 4}, 2) << '\\n'; }
\`\`\`

### 前 k 个高频元素和数据流中位数

第 347 题先用哈希表统计频次，再按频次维护 k 个候选。这里比较的是出现次数，不是元素数值。

第 295 题可以用两个堆：较小的一半放大顶堆，较大的一半放小顶堆。始终保持左边所有数不大于右边，且两边数量相差不超过一个。这样中位数就在一个或两个堆顶上。

每插入一个数，除了按数值选边，还需要调整两边的大小。只维持数量平衡、不维持数值分区，会得到错误的中位数。

### 跳跃游戏：贪心保存最远能到哪里

第 55 题中 nums[i] 是从位置 i 最多能向前跳多少步。维护 far，表示已经处理过的可达位置能到达的最远下标。

从左往右扫描。如果 i>far，说明连当前位置都到不了，后面的数再大也无济于事。否则用 max(far,i+nums[i]) 更新最远距离。

[3,2,1,0,4] 中，前四个位置最多只能到下标 3，跨不过 0，所以到不了最后一个位置。

这个策略不需要决定具体每次跳几步，因为只要某个范围可达，范围里每个位置都会被扫描，它们能提供的更远距离都会纳入 far。时间 O(n)，额外空间 O(1)。

第 45 题求最少跳跃次数还要记录“当前这一跳能覆盖的右边界”。扫描这一层内所有位置，求下一层最远边界，越过当前层前才把跳数加一。不能把每次 far 变大都当成多跳了一步。

### 划分字母区间：等这一段的字符都结束

第 763 题要求同一个字母只出现在一个片段。先记录每个字母最后出现的位置。扫描当前片段时，把片段必须延伸到的右端更新为所见字符最后位置的最大值。

到达这个右端时，当前片段的所有字符都不会再出现，可以切开。更早切会违反条件，更晚切只会少得到片段。因此这里的尽早切分有具体依据。

### 贪心最容易犯的错

“每次挑最大的”本身不是理由。零钱面额 [1,3,4]，金额为 6 时，先取最大面额会得到 4+1+1，共 3 枚；最优是 3+3，共 2 枚。这也是一般零钱兑换常用动态规划的原因。

练习先做第 215 题理解堆，再做第 347 题与第 295 题；贪心部分按第 55 题、第 45 题、第 763 题推进。每次都把“维护什么信息”和“为什么不会丢掉最优答案”分别说明。
`,
};
