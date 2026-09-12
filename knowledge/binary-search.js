// 知识文章：二分查找
export default {
  "slug": "binary-search",
  "title": "二分查找",
  "intro": "用一个明确的区间约定，找到第一个满足条件的位置。",
  "tags": ["二分查找"],
  "relatedProblems": [
    {
      "id": 35,
      "stage": "core",
      "reason": "找第一个大于等于目标的位置"
    },
    {
      "id": 34,
      "stage": "core",
      "reason": "用两个分界点得到重复值范围"
    },
    {
      "id": 74,
      "stage": "practice",
      "reason": "把整体有序矩阵映射为一维"
    },
    {
      "id": 153,
      "stage": "practice",
      "reason": "判断最小值位于哪一侧"
    },
    {
      "id": 33,
      "stage": "practice",
      "reason": "先找到有序的一半"
    },
    {
      "id": 4,
      "stage": "practice",
      "reason": "进阶：两个有序数组的划分"
    }
  ],
  content: `
二分查找每次排除一半左右的候选位置。它快的原因是：检查中间位置后，能确定答案只可能留在某一边。

最常见的条件是数组有序。更一般地，只要候选位置上的判断结果呈现“前面都不满足，后面都满足”，就可以找这个分界点。

### 先学会找第一个大于等于 target 的位置

对升序数组 [1,3,3,5]，target=3，答案是下标 1。target=4 时，答案是下标 3。target=6 时，没有元素满足要求，返回数组长度 4，正好也是应当插入的位置。

我们采用左闭右开的范围 [left,right)，初始 left=0、right=n。循环条件是 left<right。

- nums[mid]<target：mid 以及它左边都太小，令 left=mid+1。
- nums[mid]≥target：mid 可能就是第一个满足的位置，也可能还有更早的位置，令 right=mid。

以 target=3 为例：先看 mid=2，值是 3，把 right 改为 2；再看 mid=1，值是 3，把 right 改为 1；再看 mid=0，值是 1，把 left 改为 1。两边相遇，返回 1。

### 循环中始终保持什么事实

left 左边的位置都小于 target；right 及它右边的位置都大于等于 target。在尚未检查的 [left,right) 内，继续缩小范围。

left==right 时，中间已经没有未确定的位置，left 就是分界点。即使它等于 n，也有明确含义，不需要访问 nums[n]。

每轮范围都会严格变小：left 至少越过 mid，或者 right 缩到 mid。因此不会死循环。总时间 O(log n)，额外空间 O(1)。

\`\`\`run-py#binary-search-v2-demo
def lower_bound(nums, target):
    left, right = 0, len(nums)  # 待确定范围为 [left, right)
    while left < right:
        mid = left + (right - left) // 2
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid
    return left

print(lower_bound([1, 3, 3, 5], 3))
\`\`\`

\`\`\`run-js#binary-search-v2-demo
function lowerBound(nums, target) {
  let left = 0, right = nums.length;
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] < target) left = mid + 1;
    else right = mid;
  }
  return left;
}
console.log(lowerBound([1, 3, 3, 5], 3));
\`\`\`

\`\`\`run-cpp#binary-search-v2-demo
#include <iostream>
#include <vector>
using namespace std;
int lowerBound(const vector<int>& nums, int target) {
    int left = 0, right = nums.size();
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) left = mid + 1;
        else right = mid;
    }
    return left;
}
int main() { cout << lowerBound({1, 3, 3, 5}, 3) << '\\n'; }
\`\`\`

### 第一次出现和最后一次出现

第 34 题可以做两次分界查找：第一次找第一个 ≥target 的位置 L，第二次找第一个 >target 的位置 R。若 target 存在，它的下标范围就是 [L,R−1]。

第二次只需把“太小”的条件改为 nums[mid]≤target。检查 L 是否越界、nums[L] 是否等于 target，才能区分不存在的情况。

不要用 target+1 来代替“严格大于”的比较作为通用写法：在有界整数类型中可能溢出，在非整数数据中也不适用。

### 旋转数组为什么还能二分

第 33 题的数组原本有序，被从某处切开后交换两段。当前区间取一个中点后，至少有一半仍然有序。

先判断哪半边有序，再看 target 是否落在那半边的数值范围内，决定保留哪边。不能对整个旋转数组直接使用普通的“小于就往右”规则。

Hot 100 这道题给出的元素互不相同，这让判断有序侧比较明确。允许重复元素的变体可能无法一次排除半边，最坏复杂度也可能退化。

第 153 题找旋转数组最小值，可以把 nums[mid] 与右端值比较：中点比右端大，最小值在中点右侧；否则最小值可能在中点或其左侧。注意这通常使用闭区间模板，不要把它的更新方式机械地拼进上面的左闭右开写法。

### 二维矩阵先检查题目条件

第 74 题每行首元素大于上一行末元素，可以把矩阵视为一条完整有序数组，下标 i 对应 row=i/列数 向下取整、col=i%列数。

第 240 题只保证每行、每列分别升序，不能直接整体展开后二分。可以从右上角开始，当前值太大就排除这一列，太小就排除这一行。

### 常见边界错误

不要一会儿把 right 当可访问下标，一会儿又当数组长度。先选定区间定义，再决定循环和更新方式。

JavaScript 计算 mid 建议用 left+Math.floor((right-left)/2)，不要依赖位运算取整，它会转换为 32 位整数。C++ 也可用 left+(right-left)/2 避免两端相加溢出。

测试空数组、一个元素、全部小于目标、全部大于目标、重复值和目标不存在。练习按第 35 题、第 34 题、第 74 题、第 153 题、第 33 题的顺序进行；第 4 题涉及两个有序数组的划分，可以放到最后。
`,
};
