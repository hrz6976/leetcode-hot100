// 知识文章：滑动窗口
export default {
  "slug": "sliding-window",
  "title": "滑动窗口",
  "intro": "维护连续的一段数据，弄清什么时候扩张、什么时候缩小。",
  "tags": ["滑动窗口","字符串"],
  "relatedProblems": [
    {
      "id": 3,
      "stage": "core",
      "reason": "重复时连续缩小窗口"
    },
    {
      "id": 438,
      "stage": "core",
      "reason": "维护固定长度的字符计数"
    },
    {
      "id": 76,
      "stage": "practice",
      "reason": "满足覆盖后尝试缩小"
    }
  ],
  content: `
当题目讨论连续子串或连续子数组时，可以先考虑维护一段区间。但“连续”只是线索，还要证明：一旦区间不满足要求，某个边界可以一直向前移动，不用回头。

滑动窗口通常用 left 和 right 表示区间，并维护区间里的字符次数、总和或其他信息。每次只增删边界元素，避免重新统计整段内容。

### 例子：最长无重复字符子串

第 3 题要求连续子串里没有重复字符。例如 "abba"，答案长度是 2。

右边界每次读入一个字符，把它的计数加一。如果这个字符出现了两次，就不断从左边移除字符，直到它只剩一次。

| 加入的字符 | 加入后 | 如何缩小 | 最后保留的窗口 |
| --- | --- | --- | --- |
| 第一个 a | a | 不用缩小 | a |
| 第一个 b | ab | 不用缩小 | ab |
| 第二个 b | abb | 依次移除 a 和第一个 b | b |
| 最后的 a | ba | 不用缩小 | ba |

处理第二个 b 时，只缩小一次还不够。移除 a 后仍然有两个 b，所以这里需要 while，不能写成 if。

### 为什么不会漏掉最长答案

加入 right 之前，窗口没有重复。加入一个字符后，只有这个字符的计数可能超标。我们从左边移除最少数量的字符，让窗口重新合法。

于是对每个固定的右端点，得到的是以它结尾的最长合法窗口。把这些长度取最大值，就覆盖了全局答案。

两个边界都只向右移动，每个字符最多加入和移除各一次。维护计数按平均 O(1) 估算，时间是 O(n)，额外空间是 O(字符种类数)。

\`\`\`run-py#sliding-window-v2-demo
def longest_unique(s):
    counts = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        counts[ch] = counts.get(ch, 0) + 1
        while counts[ch] > 1:
            old = s[left]
            counts[old] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best

print(longest_unique("abba"))
\`\`\`

\`\`\`run-js#sliding-window-v2-demo
function longestUnique(s) {
  const counts = new Map();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    counts.set(ch, (counts.get(ch) || 0) + 1);
    while (counts.get(ch) > 1) {
      const old = s[left++];
      counts.set(old, counts.get(old) - 1);
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
console.log(longestUnique('abba'));
\`\`\`

\`\`\`run-cpp#sliding-window-v2-demo
#include <iostream>
#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;
int longestUnique(const string& s) {
    unordered_map<char, int> counts;
    int left = 0, best = 0;
    for (int right = 0; right < (int)s.size(); ++right) {
        ++counts[s[right]];
        while (counts[s[right]] > 1) --counts[s[left++]];
        best = max(best, right - left + 1);
    }
    return best;
}
int main() { cout << longestUnique("abba") << '\\n'; }
\`\`\`

### 固定长度窗口

第 438 题要找与给定字符串 p 互为异位词的子串。候选子串长度已经确定为 p.length，所以可以维护恰好这么长的窗口。

每次加入右端字符，窗口超过指定长度时就移除左端字符。窗口长度够了，再比较字符计数。

如果字符集固定为 26 个小写字母，每次比较 26 个计数仍然是固定工作量。若字符集不固定，就应该把比较计数表的代价算进去，或者维护“有几个字符的计数不一致”。

### 最短窗口和最长窗口的区别

第 76 题“最小覆盖子串”要求窗口包含目标字符串中所有字符，而且次数也足够。先扩张右边界，直到满足要求；然后不断缩小左边界，在仍然满足要求时记录答案。

最长无重复子串是“不合法就缩小，恢复合法后记录”。最小覆盖子串是“合法时尝试缩小，每次缩小前记录”。更新答案的位置取决于你的目标，不是一个通用模板。

目标字符串若是 "AAB"，只出现一个 A 不算满足。可以记录有多少种字符达到了所需次数；计数越过要求的临界值时才更新这个统计量。

### 哪些问题不能这样缩小

“子数组和等于 k”如果允许负数，就不能只根据当前和决定方向。例如 [3,−2] 的总和为 1。读到 3 时如果因为大于 1 就把它移除，会错过整段的答案。

原因是右边再加入一个负数，和可能反而变小。此时常用前缀和加哈希表，见“数组与哈希表”。

即使全部是非负数，也要区分是在找最长、最短还是统计所有方案，零值可能让同一个右端点对应多个合法左端点。

### 写之前先说明四件事

窗口包含哪些位置，例如闭区间 [left,right]；维护哪些信息；什么时候移动左边界；什么时候更新答案。写清这四点，循环条件通常就能跟着推出来。

练习顺序建议是第 3 题、第 438 题、第 76 题。做完后，用 "abba" 检查连续缩窗，用 "AAB" 检查重复需求，并试着解释为什么第 560 题更适合前缀和。
`,
};
