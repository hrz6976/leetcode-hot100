// 知识文章：双指针
export default {
  "slug": "two-pointers",
  "title": "双指针",
  "intro": "每次移动一个位置，都要说明为什么不会漏掉答案。",
  "tags": ["双指针","数组"],
  "relatedProblems": [
    {
      "id": 283,
      "stage": "core",
      "reason": "用读写位置保持非零数顺序"
    },
    {
      "id": 11,
      "stage": "core",
      "reason": "解释为什么可以排除短边"
    },
    {
      "id": 15,
      "stage": "practice",
      "reason": "固定一个数，再用双指针和去重"
    },
    {
      "id": 141,
      "stage": "practice",
      "reason": "在链表上比较快慢指针"
    }
  ],
  content: `
双指针就是用两个位置变量共同处理数据。难点通常不在声明 left 和 right，而在于说明：为什么移动这个位置，就能排除一些不可能的答案，而且不需要再回来检查。

先掌握数组下标和循环。链表上的快慢指针可以在读完链表一篇后再看。

### 有序数组中找两个数

假设升序数组是 [1,2,4,7]，目标和为 6。让 left 指向 1，right 指向 7。

当前和是 8，太大了。如果仍然保留 7，再把左边的 1 换成更大的数，和只会更大。因此 7 不可能参与当前范围内的答案，可以把 right 左移。

这时 1+4=5，太小了。保留 1，再把 4 换成更小的数，也不可能凑到 6。因此把 left 右移，得到 2+4=6。

这里能判断移动方向，是因为数组有序。无序数组不能照搬这套规则；如果原题要求返回原始下标，排序还会改变位置，需要额外保存原下标。

两个指针只向中间移动，总共最多移动 O(n) 次，额外空间 O(1)。

### 盛最多水的容器：为什么移动短边

第 11 题的面积是“左右距离 × 两端较低的高度”。假设左边更矮，右边不动、左边向内移动，才可能找到更高的短板，弥补宽度变小的损失。

如果反过来固定较矮的左边，只把右边往里挪，宽度会变小，高度上限仍然受左边限制，面积不可能超过当前面积。因此这些组合可以直接排除。

注意，这个论证只针对容器面积。不能因为另一个问题也用了两个端点，就照搬“移动短边”。

### 读写指针：原地移动零

另一类双指针并不向中间靠拢，而是一起向右走。第 283 题要求把 0 移到末尾，并保持非零数的相对顺序。

让 read 逐个读取原数组，write 指向下一个该放非零数的位置。读到非零数，就写到 nums[write]，然后 write 加一。读完后，把 write 之后的位置补成 0。

以 [0,1,0,3,12] 为例，依次写入 1、3、12，最后得到 [1,3,12,0,0]。

循环进行时，nums[0:write] 始终是已经读过的非零元素，顺序也没有变。write 不会跑到 read 前面，所以不会提前覆盖还没读过的数据。

下面的示例就是这个办法，时间 O(n)，额外空间 O(1)。修改一下输入，检查全是 0、没有 0、空数组三种情况。

\`\`\`run-py#two-pointers-v2-demo
def move_zeroes(nums):
    write = 0
    for read in range(len(nums)):
        if nums[read] != 0:
            nums[write] = nums[read]
            write += 1
    for i in range(write, len(nums)):
        nums[i] = 0

nums = [0, 1, 0, 3, 12]
move_zeroes(nums)
print(*nums)
\`\`\`

\`\`\`run-js#two-pointers-v2-demo
function moveZeroes(nums) {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) nums[write++] = nums[read];
  }
  for (let i = write; i < nums.length; i++) nums[i] = 0;
}
const nums = [0, 1, 0, 3, 12];
moveZeroes(nums);
console.log(nums.join(' '));
\`\`\`

\`\`\`run-cpp#two-pointers-v2-demo
#include <iostream>
#include <vector>
using namespace std;
void moveZeroes(vector<int>& nums) {
    int write = 0;
    for (int read = 0; read < (int)nums.size(); ++read)
        if (nums[read] != 0) nums[write++] = nums[read];
    for (int i = write; i < (int)nums.size(); ++i) nums[i] = 0;
}
int main() {
    vector<int> nums = {0, 1, 0, 3, 12};
    moveZeroes(nums);
    for (int i = 0; i < (int)nums.size(); ++i)
        cout << (i ? " " : "") << nums[i];
    cout << '\\n';
}
\`\`\`

### 三数之和：在双指针外固定一个数

第 15 题可以先排序，再固定 nums[i]，在它后面找和为 −nums[i] 的两个数。固定一个位置要 O(n) 次，剩下的双指针每次 O(n)，总时间 O(n²)，另加排序代价。

去重需要分两处：固定位置跳过相同的值；找到一组答案后，左右指针分别跳过已经使用过的相同值。不是一开始就把输入去重。例如 [−1,−1,2] 的两个 −1 都要保留，才能得到合法答案。

### 链表上的快慢指针

快指针每次走两步，慢指针每次走一步。找链表中点时，快指针走到尾部，慢指针大约在中间。判断有无环时，进入环后的两个指针之间的相对距离每轮变化一步，最终会相遇。

它们比较的是节点身份，不是节点值。两个节点都存 3，并不说明链表有环。

### 练习与检查

先做第 283 题，明确“已处理部分”是什么；再做第 11 题，把排除短边的理由说出来；然后做第 15 题，检查去重；学完链表后做第 141 题。

每次写 left+=1 或 right−=1 前，都问一句：被我跳过的这些位置，为什么不可能再提供一个遗漏的答案？如果只能回答“模板这么写”，说明移动规则还没有想清楚。
`,
};
