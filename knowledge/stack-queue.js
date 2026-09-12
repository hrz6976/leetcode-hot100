// 知识文章：栈、队列与单调结构
export default {
  "slug": "stack-queue",
  "title": "栈、队列与单调结构",
  "intro": "从括号匹配到每日温度，理解哪些元素还需要等待处理。",
  "tags": ["栈","队列","单调栈","单调队列"],
  "relatedProblems": [
    {
      "id": 20,
      "stage": "core",
      "reason": "最近打开的括号先匹配"
    },
    {
      "id": 155,
      "stage": "core",
      "reason": "保存每一步的最小值"
    },
    {
      "id": 739,
      "stage": "practice",
      "reason": "找到最近的更大元素"
    },
    {
      "id": 239,
      "stage": "practice",
      "reason": "维护窗口内尚未过期的最大值候选"
    },
    {
      "id": 84,
      "stage": "practice",
      "reason": "根据更小的柱子确定边界"
    }
  ],
  content: `
栈和队列都用来保存暂时还没处理完的东西。区别在于处理顺序：栈先取出最后放入的元素，队列先取出最早放入的元素。

选结构时，先问“下一个应该处理谁”，比先背方法名更有用。

### 括号匹配为什么用栈

读到 "([" 时，接下来若出现右括号，必须先匹配最近的左括号 [。外层的 ( 要等里面的括号结束后才能匹配。这正好符合后进先出的顺序。

因此读到左括号就入栈，读到右括号就检查栈顶是否匹配。栈为空或类型不对，立刻失败。读完后栈也必须为空，否则还有左括号没有闭合。

")(" 可以检查空栈，"([)]" 可以检查类型顺序，"((" 可以检查结尾是否有剩余。算法遍历一遍，时间 O(n)，最坏额外空间 O(n)。

### 队列适合按到达顺序处理

层序遍历二叉树时，先处理父节点，再处理它们的孩子。把孩子放到队尾，从队头依次取出，节点就会按层出现。

Python 用 collections.deque 的 popleft()；C++ 用 queue；JavaScript 可以用数组加一个 head 下标向前读。反复调用数组的 shift() 可能产生搬移开销，不应默认它是常数时间。

### 每日温度：谁还在等一个更大的数

第 739 题给出每天的温度，问每一天还要等几天才会更暖。

如果对每一天都向后找，会反复检查相同的位置。换个方向思考：读到今天的温度时，哪些以前的日子终于等到了更暖的一天？

用栈保存尚未找到答案的日期下标，栈里的温度从底到顶保持不增。读到新的温度，只要比栈顶那天暖，就弹出栈顶，并记录两个日期的下标差。

以 [73,71,72,75] 为例：

| 今天 | 处理等待中的日期 | 栈中的下标 |
| --- | --- | --- |
| 0，73 度 | 暂时没有答案 | [0] |
| 1，71 度 | 71 不比 73 高 | [0,1] |
| 2，72 度 | 第 1 天等了 1 天 | [0,2] |
| 3，75 度 | 第 2 天等了 1 天，第 0 天等了 3 天 | [3] |

结果是 [3,1,1,0]。最后还留在栈里的日子，再也没有更暖的后续日子，答案保持 0。

\`\`\`run-py#stack-queue-v2-demo
def daily_temperatures(temps):
    answer = [0] * len(temps)
    waiting = []  # 保存日期下标，不是温度值
    for today, temp in enumerate(temps):
        while waiting and temps[waiting[-1]] < temp:
            day = waiting.pop()
            answer[day] = today - day
        waiting.append(today)
    return answer

print(*daily_temperatures([73, 71, 72, 75]))
\`\`\`

\`\`\`run-js#stack-queue-v2-demo
function dailyTemperatures(temps) {
  const answer = Array(temps.length).fill(0), waiting = [];
  for (let today = 0; today < temps.length; today++) {
    while (waiting.length && temps[waiting[waiting.length - 1]] < temps[today]) {
      const day = waiting.pop();
      answer[day] = today - day;
    }
    waiting.push(today);
  }
  return answer;
}
console.log(dailyTemperatures([73, 71, 72, 75]).join(' '));
\`\`\`

\`\`\`run-cpp#stack-queue-v2-demo
#include <iostream>
#include <vector>
using namespace std;
vector<int> dailyTemperatures(const vector<int>& temps) {
    vector<int> answer(temps.size(), 0), waiting;
    for (int today = 0; today < (int)temps.size(); ++today) {
        while (!waiting.empty() && temps[waiting.back()] < temps[today]) {
            int day = waiting.back(); waiting.pop_back();
            answer[day] = today - day;
        }
        waiting.push_back(today);
    }
    return answer;
}
int main() {
    auto answer = dailyTemperatures({73, 71, 72, 75});
    for (int i = 0; i < (int)answer.size(); ++i) cout << (i ? " " : "") << answer[i];
    cout << '\\n';
}
\`\`\`

### 为什么弹出时就是最近的更暖日期

栈里的日期都是之前没有找到答案的日期。如果在今天之前出现过更暖的温度，它早就会被弹出了。因此今天第一次使它出栈，今天就是它要找的最近日期。

每个下标最多入栈一次、出栈一次。虽然代码有嵌套循环，总操作次数仍然是 O(n)，额外空间 O(n)。

温度相等不能弹出，因为题目要的是“更暖”。换成“下一个大于等于”的题目时，比较符号也要相应改变。

### 单调队列与滑动窗口最大值

第 239 题的窗口不断右移，除了维护大小顺序，还要丢掉已经离开窗口的元素。

用双端队列保存候选下标，温度类比成数值，从队头到队尾保持不增。新数进来时，把队尾比它小的候选删除：新数更大、出现更晚，以后只要旧数还在窗口里，新数也在，旧数不可能再成为最大值。

队头若已过期就移除，剩下的队头就是最大值。保存下标能判断过期，也能正确处理重复值。相等时保留较新的一个也是可行的，但要与自己的比较条件保持一致。

### 练习顺序

先做第 20 题“有效的括号”，再做第 155 题“最小栈”，练习额外保存每一步的最小值。然后做第 739 题，最后做第 239 题与第 84 题“柱状图中最大的矩形”。

单调结构的重点不是记“递增还是递减”，而是说清：里面保留的元素还可能贡献什么答案，删掉的元素为什么永远用不上了。
`,
};
