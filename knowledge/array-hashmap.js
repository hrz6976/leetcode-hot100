// 知识文章：数组、哈希表与前缀和
export default {
  "slug": "array-hashmap",
  "title": "数组、哈希表与前缀和",
  "intro": "从两数之和出发，学会记录位置、次数与前缀和，减少重复查找。",
  "tags": ["数组","哈希表","前缀和"],
  "relatedProblems": [
    {
      "id": 1,
      "stage": "core",
      "reason": "先查后存，避免重复使用当前位置"
    },
    {
      "id": 49,
      "stage": "core",
      "reason": "选择能代表一组单词的键"
    },
    {
      "id": 128,
      "stage": "practice",
      "reason": "只从连续序列起点开始扫描"
    },
    {
      "id": 560,
      "stage": "practice",
      "reason": "用前缀和统计子数组"
    }
  ],
  content: `
做数组题时，先区分两个问题：“第几个元素是什么”和“某个值出现过没有”。数组擅长前者，哈希表擅长后者。选对结构，往往就能省掉反复查找的循环。

读这篇之前，先知道下标从 0 开始，以及 O(n²) 和 O(n) 的区别。

### 从两数之和开始

给你 nums = [2, 7, 11, 15]，要求两个不同位置上的数相加等于 9，返回它们的下标。

最直接的写法是枚举所有数对。这能算对，但最坏要检查 O(n²) 对。重复工作出在这里：每遇到一个数，你都重新去找它需要的另一个数。

读到 7 时，我们要找的是 9−7=2。如果已经记下“2 出现在下标 0”，就能直接得到答案。

因此，让哈希表保存“已经读过的值 → 它的下标”。每读一个新数 x，先查 target−x 是否在表中，没有再把 x 记进去。

| 当前元素 | 要找的值 | 查找前的表 | 操作 |
| --- | --- | --- | --- |
| 下标 0，值 2 | 7 | 空 | 没找到，保存 2 → 0 |
| 下标 1，值 7 | 2 | 2 → 0 | 找到，返回 [0, 1] |

顺序不能随便调换。如果先保存当前元素，nums=[3,4]、target=6 时，可能把下标 0 用两次。先查再存保证表里只包含当前位置之前的元素。

### 为什么这个办法不会漏答案

假设答案的两个下标是 i 和 j，且 i<j。读到 j 时，i 已经处理过，nums[i] 必然在表里；而 target−nums[j] 正好是 nums[i]，所以会找到。

这段理由比“哈希表很快”更重要：它说明我们只查前面出现过的数，仍然覆盖了所有可能的答案。

每个元素查找一次、保存一次，哈希操作按平均 O(1) 估算，总时间 O(n)，额外空间 O(n)。哈希表的最坏情况受碰撞和实现影响；字符串键的计算、比较也可能依赖字符串长度。

\`\`\`run-py#array-hashmap-v2-demo
def two_sum(nums, target):
    seen = {}  # 值 -> 之前出现的下标
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []

print(*two_sum([2, 7, 11, 15], 9))
\`\`\`

\`\`\`run-js#array-hashmap-v2-demo
function twoSum(nums, target) {
  const seen = new Map(); // 值 -> 之前出现的下标
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
console.log(twoSum([2, 7, 11, 15], 9).join(' '));
\`\`\`

\`\`\`run-cpp#array-hashmap-v2-demo
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        auto it = seen.find(target - nums[i]);
        if (it != seen.end()) return {it->second, i};
        seen[nums[i]] = i;
    }
    return {};
}
int main() {
    auto answer = twoSum({2, 7, 11, 15}, 9);
    cout << answer[0] << ' ' << answer[1] << '\\n';
}
\`\`\`

### 表里到底应该存什么

同样是哈希表，不同问题需要保存不同的信息：

- 只关心有没有出现过：用集合。Python 是 set，JavaScript 是 Set，C++ 是 unordered_set。
- 需要找原来的位置：值映射到下标，例如两数之和。
- 需要统计出现次数：值映射到计数，例如异位词或前缀和计数。
- 需要把同类元素放一起：特征映射到列表，例如把排序后相同的单词分到一组。

不要把“哈希表”理解成某段固定代码。先把你想快速回答的问题写成一句话，再确定键和值。

### 前缀和：把一段的和变成两个数相减

定义 prefix[0]=0，prefix[i+1]=prefix[i]+nums[i]。那么下标从 l 到 r 的和就是 prefix[r+1]−prefix[l]。

第 560 题问有多少个连续子数组的和等于 k。当前前缀和是 s 时，要找之前出现过多少个 s−k。因此表里保存的是“前缀和 → 出现次数”。

以 nums=[1,−1,1]、k=1 为例，初始表必须是 {0:1}：还没读任何元素时，已经有一个和为 0 的空前缀。三个位置的当前前缀和依次是 1、0、1，分别找到 1、0、2 个符合条件的旧前缀，总计 3 个子数组。

这里也要先计答案，再登记当前前缀。否则 k=0 时，会把当前前缀和自己相减，错误地计入一个长度为 0 的子数组。

前缀和办法允许数组里有负数；“和太大就缩小窗口”在含负数时则不一定成立。

### 写代码时容易踩的坑

JavaScript 要用 seen.has(key) 判断是否存在。seen.get(key) 可能返回下标 0，直接用它做真假判断会误认为没找到。数字排序要写比较函数，默认 sort() 按字符串顺序排。

Python 的 x in list 是线性查找，x in dict/set 才通常是平均常数时间查找。别看到同一个 in 就以为代价相同。

第 128 题“最长连续序列”可以把值放进集合，只从没有前驱 x−1 的数开始向后数。每段连续序列只被完整数一次，才得到平均 O(n)；从每个数都重新向后数会重复工作。

### 练习顺序

先做第 1 题，能解释“先查后存”；接着做第 49 题，练习选择分组的键；再做第 128 题，练习避免重复扫描；最后做第 560 题，把前缀和与计数结合起来。

做完后问自己：我保存的是“有没有”“在哪”还是“有几个”？如果答不清楚，先别急着写表的更新代码。
`,
};
