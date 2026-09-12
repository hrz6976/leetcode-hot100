// 知识文章：链表与指针修改
export default {
  "slug": "linked-list",
  "title": "链表与指针修改",
  "intro": "先保留未处理部分，再改连接；把头节点和空节点处理清楚。",
  "tags": ["链表","双指针"],
  "relatedProblems": [
    {
      "id": 206,
      "stage": "core",
      "reason": "保存后继后逐个反转"
    },
    {
      "id": 21,
      "stage": "core",
      "reason": "连接两条有序链表"
    },
    {
      "id": 19,
      "stage": "practice",
      "reason": "用临时头节点统一删除操作"
    },
    {
      "id": 141,
      "stage": "practice",
      "reason": "判断有没有环"
    },
    {
      "id": 142,
      "stage": "practice",
      "reason": "由相遇点推导环入口"
    },
    {
      "id": 24,
      "stage": "practice",
      "reason": "交换一对节点并接回"
    },
    {
      "id": 25,
      "stage": "practice",
      "reason": "检查长度后反转一组"
    }
  ],
  content: `
链表由一个个节点组成。每个节点保存数据，还保存下一个节点的位置。你通常只拿到头节点 head，想访问后面的节点，要沿 next 一步步走。

数组按下标访问通常是 O(1)，链表找第 k 个节点要 O(k)。链表的优势是：已经拿到相关节点时，改变几个 next 就能插入或删除节点。找到插入位置的时间仍然要另外计算。

### 先区分节点与节点中的值

两个节点都存 5，它们仍然可以是两个不同的对象。判断链表是否相交、是否有环，要比较是不是同一个节点。

JavaScript 用 a === b 比较对象身份；Python 可以用 a is b；C++ 比较节点指针。不要拿 a.val == b.val 代替。

### 反转链表：先保存原来的后继

第 206 题要把 1 → 2 → 3 → 空，改成 3 → 2 → 1 → 空。

每次只处理一个节点。prev 指向已经反转好的部分，cur 指向下一个要处理的节点。开始时 prev 为空，cur 指向 1。

| 本轮处理 | 先记住的 next | 改完方向后 | 下一轮 |
| --- | --- | --- | --- |
| 1 | 2 | 1 → 空 | prev=1，cur=2 |
| 2 | 3 | 2 → 1 → 空 | prev=2，cur=3 |
| 3 | 空 | 3 → 2 → 1 → 空 | prev=3，cur=空 |

如果先写 cur.next=prev，再去读 cur.next，就已经读不到原来的后继了。所以顺序是：保存后继、改方向、移动 prev、移动 cur。

循环结束时，cur 为空，说明所有节点都处理过；prev 就是新头节点。每个节点只处理一次，时间 O(n)，额外空间 O(1)。递归反转也能做到，但递归调用栈是 O(n)。

\`\`\`run-py#linked-list-v2-demo
class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

def reverse(head):
    prev, cur = None, head
    while cur is not None:
        following = cur.next  # 改方向前，保留未处理部分
        cur.next = prev
        prev, cur = cur, following
    return prev

head = Node(1, Node(2, Node(3)))
cur = reverse(head)
values = []
while cur is not None:
    values.append(cur.val)
    cur = cur.next
print(*values)
\`\`\`

\`\`\`run-js#linked-list-v2-demo
class Node {
  constructor(val, next = null) { this.val = val; this.next = next; }
}
function reverse(head) {
  let prev = null, cur = head;
  while (cur !== null) {
    const following = cur.next; // 改方向前，保留未处理部分
    cur.next = prev;
    prev = cur;
    cur = following;
  }
  return prev;
}
const head = new Node(1, new Node(2, new Node(3)));
const values = [];
for (let cur = reverse(head); cur !== null; cur = cur.next) values.push(cur.val);
console.log(values.join(' '));
\`\`\`

\`\`\`run-cpp#linked-list-v2-demo
#include <iostream>
using namespace std;
struct Node { int val; Node* next = nullptr; };
Node* reverse(Node* head) {
    Node* prev = nullptr;
    Node* cur = head;
    while (cur != nullptr) {
        Node* following = cur->next;
        cur->next = prev;
        prev = cur;
        cur = following;
    }
    return prev;
}
int main() {
    Node c{3}, b{2, &c}, a{1, &b};
    bool first = true;
    for (Node* cur = reverse(&a); cur; cur = cur->next) {
        cout << (first ? "" : " ") << cur->val;
        first = false;
    }
    cout << '\\n';
}
\`\`\`

### 为什么经常加一个 dummy 节点

删除普通节点时，可以修改它前一个节点的 next。删除头节点时却没有“前一个节点”，常常要写特殊分支。

在 head 前加一个临时节点 dummy，并让 dummy.next=head，头节点也就有了前驱。最后返回 dummy.next 即可。这个节点不属于答案，也不靠它的数值判断逻辑。

第 19 题删除倒数第 n 个节点时，可以让快指针从 dummy 先走 n+1 步，再让快慢指针一起走。快指针到空时，慢指针就在要删节点的前面。这个写法以题目保证 1≤n≤链表长度为前提。

也可以使用别的起点与间隔，但要整套保持一致。别把“从 head 开始”的循环条件和“从 dummy 开始”的步数拼在一起。

### 合并与分组反转

合并两条有序链表时，每次接上较小的头节点，再把对应链表向前推进。dummy 方便记住结果入口，tail 指向当前结果尾部。不要只移动 tail，却忘了推进取出节点的那条链表。

第 25 题每 k 个节点反转一组，要先确认剩余节点至少有 k 个，再动指针；不足一组时按题意保留原样。先记住这一组之后的节点，反转后再接回去，能避免把后半条链表弄丢。

### 快慢指针与环

第 141 题里，快指针每次走两步，慢指针每次走一步。无环时快指针会到空；有环时，进入环后的相对位置每轮变化一步，最终相遇。读取 fast.next.next 前，先确认 fast 和 fast.next 都非空。

第 142 题还要求环入口。设头到入口距离为 a，入口到相遇点距离为 b，环长为 c。相遇时快指针比慢指针多走整数圈，因此 a+b 是 c 的整数倍。把一个指针放回头部，两个都每次走一步，经过 a 步后会在入口相遇。

### 做完后怎样检查

用空链表、单节点、两个节点检查头尾；用重复值检查你比较的是节点还是值；修改 next 后检查是否还保留着未处理部分的入口。

练习顺序是第 206 题、第 21 题、第 19 题、第 141 题、第 142 题，再尝试第 24 题与第 25 题。画图时给节点标 A、B、C，比只写数值更容易看清连接关系。
`,
};
