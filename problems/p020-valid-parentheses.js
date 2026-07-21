// 20. 有效的括号
// 返回布尔值，compare 用 exact
// 注意：空串是合法输入（有效），ACM 读取时只对 input 按行 split 取第一行，禁止整体 trim()/strip()
export default {
  id: 20,
  title: '有效的括号',
  slug: 'valid-parentheses',
  difficulty: 'easy',
  tags: ['栈', '字符串'],
  hints: [
    '正确嵌套要求最后出现的未闭合左括号最先被匹配，正好符合栈的后进先出特性。',
    '扫描字符串时将左括号压栈，遇到右括号则通过映射表检查并弹出对应栈顶。',
    '若右括号到来时栈为空或类型不匹配立即返回 false；扫描完成后只有栈为空才返回 true。',
    '空串应判为有效；ACM 读取第一行时不要整体 trim，并显式输出小写 true 或 false。',
  ],

  description: `
给定一个只包括 \`(\`、\`)\`、\`{\`、\`}\`、\`[\`、\`]\` 的字符串 \`s\`，判断字符串是否有效。

有效字符串需满足：

- 左括号必须用相同类型的右括号闭合
- 左括号必须以正确的顺序闭合
- 每个右括号都有一个对应的相同类型的左括号

### 示例

- 输入：\`s = "()"\`，输出：\`true\`
- 输入：\`s = "()[]{}"\`，输出：\`true\`
- 输入：\`s = "(]"\`，输出：\`false\`
- 输入：\`s = "([)]"\`，输出：\`false\`

### 提示

- \`0 <= s.length <= 10^4\`
- \`s\` 仅由括号字符 \`()[]{}\` 组成（空串视为有效）

### ACM 模式输入输出格式

- 输入：一行，即括号字符串 \`s\`（可能是空行，表示空串）
- 输出：\`true\` 或 \`false\`（小写）

ACM 输入示例：
\`\`\`
()[]{}
\`\`\`
输出：\`true\`
`,

  functionName: 'isValid',
  compare: 'exact',

  tests: [
    { args: ['()'], expected: true },
    { args: ['()[]{}'], expected: true },
    { args: ['(]'], expected: false },
    { args: ['([)]'], expected: false },
    { args: [''], expected: true },
    { args: ['['], expected: false },
    {
      args: [']'],
      expected: false,
    },
    {
      args: ['{[()()]}'],
      expected: true,
    },
    {
      args: ['()('],
      expected: false,
    },
    {
      args: ['{{{{[]()}}}}[({({{([][])}[]{()}}{{([][()])}()}{[()()]})[{}]()}[{[[[[[{[{}{{()}}]()}[{}]]{}]]({{}}([])[]({[]}[]))[[()][[]]([{}])[{}][]](())][[[]]()]][]{}}{({{}}[({})[]][]){{}}}{{{()()}(([]{([]){}}()[])[[()({})]]{}){}}({[][[]{{}}[[]]]{}}{}{[]}(){[]}){}}([]())([]{[][]}[([{}])][]){}[(())]])({[][]}{}([{}])){{}{}}[[[]]{}()][]][[({[({})[{()}{{()}}][([]){}][]]()}[()[{()}()[]]{}[]])[{}({}[]){}][[[]({})][[(){}[]]({})]]({[(([]()){{}}{[()(({}))][()({})]({})[][]})[[]]()[]()][{()[][]}{}()(){[]}][{[]{(())}}[{}]]()}{[{(())}[]{[]}({})()]{()[]}}[([[]][[]]([]))[()][[]{}]{}]([({{}{}}{{}}){{}}]{}()))[{[]}[][]]()]({()[(()[])()]})[{}]]{[[([]{({[[]]{(){}}[]}([]{}[]()){{}()}(())){({()}){}}}{})[(())]{{{[]}[()[]]{()}()}}][()][][]][([[([{{()}[]()}]{{[()]()()}})()[]]]({[][()]{}[]}[({()}{})])[(())({})]){([[{()}()[]]{}])[[[]{}]]{((){}[][])[[]]}{}}[([[({}(()))]({})]{{{}}}(){[]}){()}]((()([()])[{}][])[[][]][])[(()){}]{}]{([]{{}(){}}[[]{{}}][[([()]{{}})](([])[])])(){(){}}}[{}]{}[{()}][{}]}({[][]()}{{{}}{}[[]]}())([()])'],
      expected: true,
    },
  ],

  acmTests: [
    { input: '()\n', output: 'true\n' },
    { input: '()[]{}\n', output: 'true\n' },
    { input: '(]\n', output: 'false\n' },
    { input: '([)]\n', output: 'false\n' },
    { input: '\n', output: 'true\n' },
    { input: '[\n', output: 'false\n' },
    { input: ']\n', output: 'false\n' },
    { input: '{[()()]}\n', output: 'true\n' },
    { input: '()(\n', output: 'false\n' },
    { input: '{{{{[]()}}}}[({({{([][])}[]{()}}{{([][()])}()}{[()()]})[{}]()}[{[[[[[{[{}{{()}}]()}[{}]]{}]]({{}}([])[]({[]}[]))[[()][[]]([{}])[{}][]](())][[[]]()]][]{}}{({{}}[({})[]][]){{}}}{{{()()}(([]{([]){}}()[])[[()({})]]{}){}}({[][[]{{}}[[]]]{}}{}{[]}(){[]}){}}([]())([]{[][]}[([{}])][]){}[(())]])({[][]}{}([{}])){{}{}}[[[]]{}()][]][[({[({})[{()}{{()}}][([]){}][]]()}[()[{()}()[]]{}[]])[{}({}[]){}][[[]({})][[(){}[]]({})]]({[(([]()){{}}{[()(({}))][()({})]({})[][]})[[]]()[]()][{()[][]}{}()(){[]}][{[]{(())}}[{}]]()}{[{(())}[]{[]}({})()]{()[]}}[([[]][[]]([]))[()][[]{}]{}]([({{}{}}{{}}){{}}]{}()))[{[]}[][]]()]({()[(()[])()]})[{}]]{[[([]{({[[]]{(){}}[]}([]{}[]()){{}()}(())){({()}){}}}{})[(())]{{{[]}[()[]]{()}()}}][()][][]][([[([{{()}[]()}]{{[()]()()}})()[]]]({[][()]{}[]}[({()}{})])[(())({})]){([[{()}()[]]{}])[[[]{}]]{((){}[][])[[]]}{}}[([[({}(()))]({})]{{{}}}(){[]}){()}]((()([()])[{}][])[[][]][])[(()){}]{}]{([]{{}(){}}[[]{{}}][[([()]{{}})](([])[])])(){(){}}}[{}]{}[{()}][{}]}({[][]()}{{{}}{}[[]]}())([()])\n', output: 'true\n' },
  ],

  templates: {
    core: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
    
};
`,
      python: `def isValid(s):
    # 判断括号字符串 s 是否有效，返回 True / False
    pass
`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <deque>
#include <list>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <climits>
using namespace std;

// 判断括号字符串 s 是否有效
bool isValid(string s) {
    // TODO: 在这里实现
    return false;
}
`,
    },
    acm: {
      javascript: `// ACM 模式：input 是全部输入（字符串），用 console.log 输出答案
// 输入格式：一行括号字符串（可能是空行，表示空串）；输出 true 或 false（小写）
// 注意：不要对 input 整体 trim()，用 split('\\n') 后取第一行
const s = input.split('\\n')[0];

// 在这里写你的代码，用 console.log(...) 输出 true 或 false

`,
      python: `# ACM 模式：用 input() 或 sys.stdin 读输入，用 print 输出答案
# 输入格式：一行括号字符串（可能是空行，表示空串）；输出 true 或 false（小写）
# 注意：不要对输入整体 strip()，用 split('\\n') 后取第一行
import sys

s = sys.stdin.read().split('\\n')[0]

# 在这里写你的代码，用 print(...) 输出小写的 true / false
`,
      cpp: `// ACM 模式：用 cin/cout 读写标准输入输出
// 输入格式：一行括号字符串（可能是空行，表示空串）；输出 true 或 false（小写）
// 注意：必须用 getline 读取整行；cin >> s 在空行用例下会读取失败
#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    getline(cin, s);

    // 在这里写你的代码，用 cout 输出 true 或 false（小写）

    return 0;
}
`,
    },
  },

  solutions: {
    core: {
      javascript: `var isValid = function(s) {
  const pair = { ')': '(', ']': '[', '}': '{' }; // 右括号 -> 对应的左括号
  const stack = [];
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else {
      if (stack.length === 0 || stack[stack.length - 1] !== pair[ch]) {
        return false;
      }
      stack.pop();
    }
  }
  return stack.length === 0;
};
`,
      python: `def isValid(s):
    pair = {')': '(', ']': '[', '}': '{'}  # 右括号 -> 对应的左括号
    stack = []
    for ch in s:
        if ch in '([{':
            stack.append(ch)
        else:
            if not stack or stack[-1] != pair[ch]:
                return False
            stack.pop()
    return len(stack) == 0
`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <deque>
#include <list>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <climits>
using namespace std;

bool isValid(string s) {
    unordered_map<char, char> match = {{')', '('}, {']', '['}, {'}', '{'}}; // 右括号 -> 对应的左括号
    stack<char> st;
    for (char ch : s) {
        if (ch == '(' || ch == '[' || ch == '{') {
            st.push(ch);
        } else {
            if (st.empty() || st.top() != match[ch]) return false;
            st.pop();
        }
    }
    return st.empty();
}
`,
    },
    acm: {
      javascript: `const s = input.split('\\n')[0];

const pair = { ')': '(', ']': '[', '}': '{' };
const stack = [];
let ok = true;
for (const ch of s) {
  if (ch === '(' || ch === '[' || ch === '{') {
    stack.push(ch);
  } else {
    if (stack.length === 0 || stack[stack.length - 1] !== pair[ch]) {
      ok = false;
      break;
    }
    stack.pop();
  }
}
if (stack.length !== 0) ok = false;
console.log(ok ? 'true' : 'false');
`,
      python: `import sys

s = sys.stdin.read().split('\\n')[0]

pair = {')': '(', ']': '[', '}': '{'}
stack = []
ok = True
for ch in s:
    if ch in '([{':
        stack.append(ch)
    else:
        if not stack or stack[-1] != pair[ch]:
            ok = False
            break
        stack.pop()
if stack:
    ok = False
print('true' if ok else 'false')
`,
      cpp: `#include <iostream>
#include <string>
#include <stack>
#include <unordered_map>
using namespace std;

int main() {
    // 必须用 getline 读取整行，空行即空串
    string s;
    getline(cin, s);

    unordered_map<char, char> match = {{')', '('}, {']', '['}, {'}', '{'}}; // 右括号 -> 对应的左括号
    stack<char> st;
    bool ok = true;
    for (char ch : s) {
        if (ch == '(' || ch == '[' || ch == '{') {
            st.push(ch);
        } else {
            if (st.empty() || st.top() != match[ch]) {
                ok = false;
                break;
            }
            st.pop();
        }
    }
    if (!st.empty()) ok = false;
    cout << (ok ? "true" : "false") << endl;
    return 0;
}
`,
    },
  },

  idea: `
括号的匹配是天然的「后进先出」：最后遇到的左括号必须最先被闭合，所以用**栈**。

- 遇到左括号就入栈
- 遇到右括号就看栈顶：栈为空，或栈顶不是对应的左括号，直接判无效；否则弹栈，相当于消掉一对
- 扫描结束后栈必须为空——不为空说明还有左括号没等到它的右括号

时间复杂度 O(n)，空间复杂度 O(n)。
`,

  explanation: `
- \`pair\` 映射「右括号 → 对应的左括号」，查表比对栈顶，比一串 if-else 干净
- 左括号入栈；遇到右括号先检查 \`stack\` 是否为空（如 \`"]"\`），再检查栈顶是否匹配（如 \`"(]"\`），任一不满足即无效
- 匹配则弹栈，继续扫描
- 循环结束后 \`stack\` 非空（如 \`"["\`）说明有左括号未闭合，同样无效
- 空串不进循环、栈为空，天然返回 true

ACM 版本注意两点：输入只取第一行（\`split('\\n')[0]\`，空行即空串），不能对输入整体 \`trim()\` / \`strip()\`；Python 里 \`print(True)\` 会输出大写 \`True\`，必须显式打印小写的 \`'true' / 'false'\`。
`,
};
