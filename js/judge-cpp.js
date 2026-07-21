// C++ 判题代码生成：把题目的测试数据编译期展开成 C++ harness（main 函数），
// 与 js/judge.js 的 JS/Python harness 语义对齐：
// - argSpec（plain/skip/list/cycleList/tree/treeNode/listArray/randomList/intersectLists）
// - resultKind（plain/list/tree/randomList/nodeVal/nodeIndex/inputArray/inputTree）
// - judgeContract（preserveRandomListArg/deepCopyRandomListArg/returnNodeFromTreeArg）
// 每个用例向真实 stdout 打印一行 `@@JUDGE@@{json}`，供远程/本地运行后解析。
// 本模块不依赖 DOM/Worker，浏览器（js/judge.js）与 Node（tools/validate.mjs）共用。

export const CPP_SENTINEL = '@@JUDGE@@';

// ---------- C++ 运行期 preamble：结构体 / 构造器 / 序列化器 ----------

const CPP_PREAMBLE = `#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <queue>
#include <optional>
#include <utility>
#include <stdexcept>
#include <functional>
#include <type_traits>
#include <unordered_set>
#include <cstdio>

struct ListNode {
  int val;
  ListNode* next;
  ListNode(int v = 0, ListNode* n = nullptr) : val(v), next(n) {}
};
struct TreeNode {
  int val;
  TreeNode* left;
  TreeNode* right;
  TreeNode(int v = 0, TreeNode* l = nullptr, TreeNode* r = nullptr) : val(v), left(l), right(r) {}
};
struct RandomNode {
  int val;
  RandomNode* next;
  RandomNode* random;
  explicit RandomNode(int v = 0) : val(v), next(nullptr), random(nullptr) {}
};

class __JudgeError : public std::runtime_error {
 public:
  explicit __JudgeError(const std::string& msg) : std::runtime_error(msg) {}
};

static ListNode* __buildList(const std::vector<int>& arr) {
  ListNode dummy;
  ListNode* cur = &dummy;
  for (int v : arr) { cur->next = new ListNode(v); cur = cur->next; }
  return dummy.next;
}
static ListNode* __buildCycle(const std::vector<int>& arr, int pos) {
  ListNode dummy;
  ListNode* cur = &dummy;
  std::vector<ListNode*> nodes;
  for (int v : arr) { cur->next = new ListNode(v); cur = cur->next; nodes.push_back(cur); }
  if (pos >= 0 && pos < (int)nodes.size()) cur->next = nodes[pos];
  return dummy.next;
}
static std::vector<int> __listToArray(ListNode* h) {
  std::vector<int> r;
  long long g = 0;
  while (h && g++ < 100000) { r.push_back(h->val); h = h->next; }
  return r;
}
static std::vector<ListNode*> __buildListArray(const std::vector<std::vector<int>>& arr2d) {
  std::vector<ListNode*> r;
  for (const auto& a : arr2d) r.push_back(__buildList(a));
  return r;
}
static std::pair<ListNode*, ListNode*> __buildIntersect(
    const std::vector<int>& shared, const std::vector<int>& aOnly, const std::vector<int>& bOnly) {
  ListNode* sharedHead = __buildList(shared);
  auto attach = [&](const std::vector<int>& only) -> ListNode* {
    if (only.empty()) return sharedHead;
    ListNode* h = __buildList(only);
    ListNode* t = h;
    while (t->next) t = t->next;
    t->next = sharedHead;
    return h;
  };
  return {attach(aOnly), attach(bOnly)};
}
static RandomNode* __buildRandomList(const std::vector<std::pair<int, int>>& desc) {
  std::vector<RandomNode*> nodes;
  for (const auto& p : desc) nodes.push_back(new RandomNode(p.first));
  for (size_t i = 0; i < nodes.size(); i++) {
    nodes[i]->next = i + 1 < nodes.size() ? nodes[i + 1] : nullptr;
    nodes[i]->random = desc[i].second < 0 ? nullptr : nodes[desc[i].second];
  }
  return nodes.empty() ? nullptr : nodes[0];
}
static std::vector<RandomNode*> __randomNodes(RandomNode* head) {
  std::vector<RandomNode*> nodes;
  std::unordered_set<RandomNode*> seen;
  RandomNode* cur = head;
  while (cur) {
    if (seen.count(cur) || nodes.size() >= 100000) throw __JudgeError("链表包含环或过长");
    seen.insert(cur);
    nodes.push_back(cur);
    cur = cur->next;
  }
  return nodes;
}
static int __nodeIndex(ListNode* head, ListNode* node) {
  if (!node) return -1;
  int i = 0;
  long long g = 0;
  ListNode* cur = head;
  while (cur && g++ < 100000) {
    if (cur == node) return i;
    cur = cur->next;
    i++;
  }
  return -1;
}
static TreeNode* __buildTree(const std::vector<std::optional<int>>& arr) {
  if (arr.empty() || !arr[0].has_value()) return nullptr;
  std::vector<TreeNode*> nodes(arr.size(), nullptr);
  for (size_t i = 0; i < arr.size(); i++)
    if (arr[i].has_value()) nodes[i] = new TreeNode(*arr[i]);
  size_t j = 1;
  for (size_t i = 0; i < nodes.size(); i++) {
    if (!nodes[i]) continue;
    if (j < nodes.size()) nodes[i]->left = nodes[j++];
    if (j < nodes.size()) nodes[i]->right = nodes[j++];
  }
  return nodes[0];
}
static TreeNode* __findNode(TreeNode* root, int val) {
  if (!root) return nullptr;
  std::queue<TreeNode*> q;
  q.push(root);
  while (!q.empty()) {
    TreeNode* n = q.front();
    q.pop();
    if (!n) continue;
    if (n->val == val) return n;
    q.push(n->left);
    q.push(n->right);
  }
  return nullptr;
}
static bool __treeContains(TreeNode* root, TreeNode* target) {
  if (!target) return false;
  std::queue<TreeNode*> q;
  q.push(root);
  while (!q.empty()) {
    TreeNode* n = q.front();
    q.pop();
    if (!n) continue;
    if (n == target) return true;
    q.push(n->left);
    q.push(n->right);
  }
  return false;
}

static std::string __jsonEscape(const std::string& s) {
  std::string r = "\\"";
  for (unsigned char c : s) {
    if (c == '"') r += "\\\\\\"";
    else if (c == '\\\\') r += "\\\\\\\\";
    else if (c == '\\n') r += "\\\\n";
    else if (c == '\\r') r += "\\\\r";
    else if (c == '\\t') r += "\\\\t";
    else if (c < 0x20) {
      char buf[8];
      std::snprintf(buf, sizeof(buf), "\\\\u%04x", c);
      r += buf;
    } else {
      r += (char)c;
    }
  }
  r += '"';
  return r;
}

static std::string __toJson(int v) { return std::to_string(v); }
static std::string __toJson(long v) { return std::to_string(v); }
static std::string __toJson(long long v) { return std::to_string(v); }
static std::string __toJson(unsigned v) { return std::to_string(v); }
static std::string __toJson(unsigned long v) { return std::to_string(v); }
static std::string __toJson(unsigned long long v) { return std::to_string(v); }
static std::string __toJson(bool v) { return v ? "true" : "false"; }
static std::string __toJson(double v) {
  char buf[64];
  std::snprintf(buf, sizeof(buf), "%.17g", v);
  return buf;
}
static std::string __toJson(const std::string& v) { return __jsonEscape(v); }
static std::string __toJson(const char* v) { return __jsonEscape(v ? v : ""); }
template <typename T>
static std::string __toJson(const std::vector<T>& v) {
  std::string r = "[";
  for (size_t i = 0; i < v.size(); i++) {
    if (i) r += ',';
    r += __toJson(v[i]);
  }
  r += ']';
  return r;
}
static std::string __toJson(ListNode* h) { return __toJson(__listToArray(h)); }
static std::string __treeJson(TreeNode* root) {
  if (!root) return "[]";
  std::string r = "[";
  std::queue<TreeNode*> q;
  q.push(root);
  size_t nonNull = 0;
  while (!q.empty()) {
    TreeNode* n = q.front();
    q.pop();
    if (n) {
      r += __toJson(n->val);
      q.push(n->left);
      q.push(n->right);
      nonNull = r.size();
    } else {
      r += "null";
    }
    r += ',';
  }
  r.resize(nonNull);
  r += ']';
  return r;
}
static std::string __toJson(TreeNode* root) { return __treeJson(root); }
static std::string __randomListJson(RandomNode* head) {
  std::vector<RandomNode*> nodes;
  std::unordered_set<RandomNode*> seen;
  RandomNode* cur = head;
  long long g = 0;
  while (cur && g++ < 100000) { seen.insert(cur); nodes.push_back(cur); cur = cur->next; }
  std::string r = "[";
  for (size_t i = 0; i < nodes.size(); i++) {
    if (i) r += ',';
    r += '[' + std::to_string(nodes[i]->val) + ',';
    RandomNode* rnd = nodes[i]->random;
    if (!rnd) {
      r += "null";
    } else {
      size_t idx = 0;
      while (idx < nodes.size() && nodes[idx] != rnd) idx++;
      r += idx < nodes.size() ? std::to_string(idx) : "null";
    }
    r += ']';
  }
  r += ']';
  return r;
}
static std::string __toJson(RandomNode* head) { return __randomListJson(head); }

// 设计题：void 方法记 null，其余序列化返回值
template <typename F>
static std::string __callOp(F f) {
  if constexpr (std::is_void_v<std::invoke_result_t<F>>) {
    f();
    return "null";
  } else {
    return __toJson(f());
  }
}
`;

// ---------- JSON 值 → C++ 类型推断与字面量 ----------

// 合并同位置多个样本（跨用例），解决空数组无法推断元素类型的问题
function typeOfSample(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'double';
  if (typeof v === 'string') return 'std::string';
  if (Array.isArray(v)) {
    if (v.length === 0) return null; // 空数组无法推断元素类型，交给同位置其他用例的样本
    const inner = mergeTypes(v.map(typeOfSample));
    return 'std::vector<' + (inner || 'int') + '>';
  }
  return null;
}

function unifyTypes(a, b) {
  if (a === null) return b;
  if (b === null) return a;
  if (a === b) return a;
  const nums = ['int', 'double'];
  if (nums.includes(a) && nums.includes(b)) return 'double';
  const vecA = a.match(/^std::vector<(.+)>$/);
  const vecB = b.match(/^std::vector<(.+)>$/);
  if (vecA && vecB) return 'std::vector<' + unifyTypes(vecA[1], vecB[1]) + '>';
  throw new Error(`无法为 C++ 推断一致的参数类型（${a} vs ${b}）`);
}

function mergeTypes(types) {
  let t = null;
  for (const x of types) t = unifyTypes(t, x);
  return t;
}

// 跨全部用例推断第 i 个 plain 参数的 C++ 类型
function inferPlainType(tests, getter, i) {
  const samples = [];
  for (const t of tests) {
    const arr = getter(t);
    if (arr && i < arr.length) samples.push(typeOfSample(arr[i]));
  }
  return mergeTypes(samples) || 'int';
}

function cppInt(v) {
  if (!Number.isSafeInteger(v)) throw new Error(`整数超出安全范围：${v}`);
  if (v === -2147483648) return '(-2147483647-1)'; // 字面量 2147483648 溢出 int 的写法陷阱
  return String(v);
}

function cppDouble(v) {
  if (!Number.isFinite(v)) throw new Error(`非有限浮点数：${v}`);
  const s = String(v);
  return s;
}

function cppString(s) {
  let r = '"';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (ch === '"') r += '\\"';
    else if (ch === '\\') r += '\\\\';
    else if (ch === '\n') r += '\\n';
    else if (ch === '\r') r += '\\r';
    else if (ch === '\t') r += '\\t';
    else if (c < 0x20 || c > 0x7e) {
      // 非 ASCII 走 UTF-16 码元八进制转义序列太啰嗦；直接用 \u 不安全，改为逐字节八进制
      const bytes = new TextEncoder().encode(ch);
      for (const b of bytes) r += '\\' + b.toString(8).padStart(3, '0');
    } else r += ch;
  }
  return r + '"';
}

function cppLiteral(v, type) {
  if (type === 'int') return cppInt(v);
  if (type === 'double') return cppDouble(v);
  if (type === 'bool') return v ? 'true' : 'false';
  if (type === 'std::string') return cppString(v);
  const vec = type.match(/^std::vector<(.+)>$/);
  if (vec) {
    const inner = vec[1];
    return type + '{' + v.map((x) => cppLiteral(x, inner)).join(', ') + '}';
  }
  throw new Error(`不支持的 C++ 参数类型：${type}`);
}

// ---------- core 模式 harness 生成 ----------

// 生成单个用例的参数构建代码，返回 { decls, argNames, treeVars }
// argNames：按“构建后参数”顺序的变量名（与 JS __buildArgs 的 out 对齐）
function buildArgDecls(problem, args, plainTypes) {
  const spec = problem.argSpec || null;
  const decls = [];
  const argNames = [];
  const treeVars = {}; // 原始下标 → 树变量名（treeNode 引用）
  let n = 0;
  for (let i = 0; i < args.length; i++) {
    const s = spec && spec[i];
    const kind = s ? s.kind : 'plain';
    if (kind === 'skip') continue;
    const name = `arg${n++}`;
    if (kind === 'list') {
      decls.push(`ListNode* ${name} = __buildList(${cppLiteral(args[i], 'std::vector<int>')});`);
      argNames.push(name);
    } else if (kind === 'cycleList') {
      decls.push(
        `ListNode* ${name} = __buildCycle(${cppLiteral(args[i], 'std::vector<int>')}, ${cppInt(args[s.posArg])});`
      );
      argNames.push(name);
    } else if (kind === 'tree') {
      const optVec = 'std::vector<std::optional<int>>{' +
        args[i].map((x) => (x === null ? 'std::nullopt' : cppInt(x))).join(', ') + '}';
      decls.push(`TreeNode* ${name} = __buildTree(${optVec});`);
      treeVars[i] = name;
      argNames.push(name);
    } else if (kind === 'treeNode') {
      const tv = treeVars[s.treeArg];
      if (!tv) throw new Error(`treeNode 参数引用了不存在的 tree 参数（下标 ${s.treeArg}）`);
      decls.push(`TreeNode* ${name} = __findNode(${tv}, ${cppInt(args[i])});`);
      argNames.push(name);
    } else if (kind === 'listArray') {
      decls.push(`auto ${name} = __buildListArray(${cppLiteral(args[i], 'std::vector<std::vector<int>>')});`);
      argNames.push(name);
    } else if (kind === 'randomList') {
      const pairs = 'std::vector<std::pair<int,int>>{' +
        args[i].map((p) => `{${cppInt(p[0])}, ${p[1] === null ? -1 : cppInt(p[1])}}`).join(', ') + '}';
      decls.push(`RandomNode* ${name} = __buildRandomList(${pairs});`);
      argNames.push(name);
    } else if (kind === 'intersectLists') {
      decls.push(
        `auto __pair${n} = __buildIntersect(${cppLiteral(args[i], 'std::vector<int>')}, ` +
          `${cppLiteral(args[i + 1], 'std::vector<int>')}, ${cppLiteral(args[i + 2], 'std::vector<int>')});`
      );
      const a = `arg${n++}`;
      const b = `arg${n++}`;
      decls.push(`ListNode* ${a} = __pair${n - 2}.first;`);
      decls.push(`ListNode* ${b} = __pair${n - 2}.second;`);
      argNames.push(a, b);
      i += 2; // 消耗共享段后的两个独有段
    } else {
      const type = plainTypes[i];
      decls.push(`auto ${name} = ${cppLiteral(args[i], type)};`);
      argNames.push(name);
    }
  }
  return { decls, argNames };
}

function contractChecks(problem, argNames) {
  const c = problem.judgeContract;
  if (!c) return { before: [], after: [] };
  const before = [];
  const after = [];
  if (c.preserveRandomListArg !== undefined) {
    const v = argNames[c.preserveRandomListArg];
    before.push(`std::string __snap = __randomListJson(${v});`);
    after.push(
      `if (__randomListJson(${v}) != __snap) throw __JudgeError("调用后不得修改输入链表");`
    );
  }
  if (c.deepCopyRandomListArg !== undefined) {
    const v = argNames[c.deepCopyRandomListArg];
    after.push(
      `{ std::unordered_set<RandomNode*> __orig; for (auto* p : __randomNodes(${v})) __orig.insert(p);`,
      `  for (auto* p : __randomNodes(__got)) if (__orig.count(p)) throw __JudgeError("必须返回由全新节点组成的深拷贝");`,
      `  __randomListJson(__got); }`
    );
  }
  if (c.returnNodeFromTreeArg !== undefined) {
    const v = argNames[c.returnNodeFromTreeArg];
    after.push(
      `if (!__treeContains(${v}, __got)) throw __JudgeError("必须返回输入树中的节点对象");`
    );
  }
  return { before, after };
}

function resultExpr(problem, argNames) {
  const rk = problem.resultKind || 'plain';
  const fname = problem.functionName;
  const call = `${fname}(${argNames.join(', ')})`;
  if (rk === 'inputArray') return { capture: false, body: [`${call};`, `__res = __toJson(${argNames[0]});`] };
  if (rk === 'inputTree') return { capture: false, body: [`${call};`, `__res = __treeJson(${argNames[0]});`] };
  if (rk === 'nodeIndex') {
    return { capture: true, body: [`__res = __toJson(__nodeIndex(${argNames[0]}, __got));`] };
  }
  if (rk === 'nodeVal') {
    return { capture: true, body: [`__res = __got ? __toJson(__got->val) : "null";`] };
  }
  // plain / list / tree / randomList 都由 __toJson 重载覆盖
  return { capture: true, body: [`__res = __toJson(__got);`] };
}

function caseBlock(lines, problem) {
  // 统一包裹：stdout/cerr 捕获 + 异常 → sentinel 行
  const body = [];
  body.push('{');
  body.push('std::ostringstream __cap;');
  body.push('try {');
  for (const l of lines.pre) body.push(l);
  body.push('std::streambuf* __o1 = std::cout.rdbuf(__cap.rdbuf());');
  body.push('std::streambuf* __o2 = std::cerr.rdbuf(__cap.rdbuf());');
  body.push('try {');
  for (const l of lines.call) body.push(l);
  body.push('} catch (...) {');
  body.push('std::cout.rdbuf(__o1); std::cerr.rdbuf(__o2);');
  body.push('throw;');
  body.push('}');
  body.push('std::cout.rdbuf(__o1); std::cerr.rdbuf(__o2);');
  for (const l of lines.post) body.push(l);
  body.push(
    `std::cout << "${CPP_SENTINEL}{\\"ok\\":true,\\"got\\":" << __res << ",\\"stdout\\":" << __jsonEscape(__cap.str()) << "}" << "\\n" << std::flush;`
  );
  body.push('} catch (const __JudgeError& e) {');
  body.push(
    `std::cout << "${CPP_SENTINEL}{\\"ok\\":false,\\"error\\":" << __jsonEscape(e.what()) << ",\\"stdout\\":" << __jsonEscape(__cap.str()) << "}" << "\\n" << std::flush;`
  );
  body.push('} catch (const std::exception& e) {');
  body.push(
    `std::cout << "${CPP_SENTINEL}{\\"ok\\":false,\\"error\\":" << __jsonEscape(std::string("运行时错误: ") + e.what()) << ",\\"stdout\\":" << __jsonEscape(__cap.str()) << "}" << "\\n" << std::flush;`
  );
  body.push('} catch (...) {');
  body.push(
    `std::cout << "${CPP_SENTINEL}{\\"ok\\":false,\\"error\\":\\"未知运行时错误\\",\\"stdout\\":" << __jsonEscape(__cap.str()) << "}" << "\\n" << std::flush;`
  );
  body.push('}');
  body.push('}');
  return body.join('\n');
}

function cppCoreMain(problem) {
  const cases = [];
  const tests = problem.tests || [];
  // 跨用例推断 plain 参数类型（非 plain 的 kind 无需推断，占位即可）
  const spec = problem.argSpec || null;
  const plainTypes = [];
  const maxArgs = Math.max(...tests.map((t) => (t.args || []).length), 0);
  for (let i = 0; i < maxArgs; i++) {
    const kind = spec && spec[i] ? spec[i].kind : 'plain';
    plainTypes.push(kind === 'plain' ? inferPlainType(tests, (t) => t.args, i) : 'int');
  }

  for (const t of tests) {
    const { decls, argNames } = buildArgDecls(problem, t.args, plainTypes);
    const { before, after } = contractChecks(problem, argNames);
    const res = resultExpr(problem, argNames);
    const call = [];
    if (res.capture) {
      call.push(`auto __got = ${problem.functionName}(${argNames.join(', ')});`);
      call.push(...after);
      call.push(...res.body);
    } else {
      call.push(...res.body.slice(0, 1));
      call.push(...after);
      call.push(...res.body.slice(1));
    }
    cases.push(caseBlock({ pre: [...decls, ...before, 'std::string __res;'], call, post: [] }, problem));
  }
  return 'int main() {\n' + cases.join('\n') + '\nreturn 0;\n}\n';
}

function cppDesignMain(problem) {
  const cname = problem.className;
  const tests = problem.tests || [];
  // 每个 op 的各参数位置跨用例推断类型
  const opTypes = {}; // op -> [type per param index]
  for (const t of tests) {
    t.ops.forEach((op, k) => {
      const params = t.params[k];
      if (!opTypes[op]) opTypes[op] = [];
      params.forEach((p, j) => {
        opTypes[op][j] = unifyTypes(opTypes[op][j] || null, typeOfSample(p));
      });
    });
  }
  for (const op of Object.keys(opTypes)) {
    opTypes[op] = opTypes[op].map((t) => t || 'int');
  }
  const cases = [];
  for (const t of tests) {
    const pre = [`${cname}* obj = nullptr;`, 'std::string __res = "[";', 'bool __first = true;'];
    const call = [];
    t.ops.forEach((op, k) => {
      const lits = t.params[k].map((p, j) => cppLiteral(p, opTypes[op][j])).join(', ');
      call.push('{');
      call.push('if (!__first) __res += ",";');
      call.push('__first = false;');
      if (op === cname) {
        call.push(`obj = new ${cname}(${lits});`);
        call.push('__res += "null";');
      } else {
        call.push(`__res += __callOp([&]{ return obj->${op}(${lits}); });`);
      }
      call.push('}');
    });
    cases.push(caseBlock({ pre, call, post: ['__res += "]";'] }, problem));
  }
  return 'int main() {\n' + cases.join('\n') + '\nreturn 0;\n}\n';
}

// 生成完整可编译的 C++ 源码：preamble + 用户代码 + harness main。
// 用户代码前加 #line 1 "solution"，编译报错的行号即编辑器行号。
export function cppCoreSource(problem, code) {
  const main = problem.design ? cppDesignMain(problem) : cppCoreMain(problem);
  return CPP_PREAMBLE + '\n#line 1 "solution"\n' + code + '\n#line 1 "judge_main"\n' + main;
}

// ACM 模式：用户代码即完整程序（自带 main），原样提交
export function cppAcmSource(code) {
  return code;
}

// 从程序 stdout 中解析 sentinel 行，返回 results 数组（可能少于用例数：进程中途崩溃）
export function parseCppJudgeOutput(stdout) {
  const results = [];
  for (const line of String(stdout || '').split('\n')) {
    if (!line.startsWith(CPP_SENTINEL)) continue;
    try {
      results.push(JSON.parse(line.slice(CPP_SENTINEL.length)));
    } catch {
      return { results, corrupted: true };
    }
  }
  return { results, corrupted: false };
}
