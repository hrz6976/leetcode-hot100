// 知识文章轻量索引（由 tools/generate-manifests.mjs 生成，请勿手改）

export const articles = [
  {"slug":"complexity","title":"时间与空间复杂度","intro":"输入变大后，代码要多做多少工作？从循环次数开始估算。","tags":["时间复杂度","空间复杂度"],"relatedProblems":[{"id":1,"stage":"core","reason":"比较枚举与查表"},{"id":35,"stage":"core","reason":"观察范围减半"},{"id":78,"stage":"practice","reason":"计算输出本身的规模"}]},
  {"slug":"array-hashmap","title":"数组、哈希表与前缀和","intro":"从两数之和出发，学会记录位置、次数与前缀和，减少重复查找。","tags":["数组","哈希表","前缀和"],"relatedProblems":[{"id":1,"stage":"core","reason":"先查后存，避免重复使用当前位置"},{"id":49,"stage":"core","reason":"选择能代表一组单词的键"},{"id":128,"stage":"practice","reason":"只从连续序列起点开始扫描"},{"id":560,"stage":"practice","reason":"用前缀和统计子数组"}]},
  {"slug":"two-pointers","title":"双指针","intro":"每次移动一个位置，都要说明为什么不会漏掉答案。","tags":["双指针","数组"],"relatedProblems":[{"id":283,"stage":"core","reason":"用读写位置保持非零数顺序"},{"id":11,"stage":"core","reason":"解释为什么可以排除短边"},{"id":15,"stage":"practice","reason":"固定一个数，再用双指针和去重"},{"id":141,"stage":"practice","reason":"在链表上比较快慢指针"}]},
  {"slug":"sliding-window","title":"滑动窗口","intro":"维护连续的一段数据，弄清什么时候扩张、什么时候缩小。","tags":["滑动窗口","字符串"],"relatedProblems":[{"id":3,"stage":"core","reason":"重复时连续缩小窗口"},{"id":438,"stage":"core","reason":"维护固定长度的字符计数"},{"id":76,"stage":"practice","reason":"满足覆盖后尝试缩小"}]},
  {"slug":"linked-list","title":"链表与指针修改","intro":"先保留未处理部分，再改连接；把头节点和空节点处理清楚。","tags":["链表","双指针"],"relatedProblems":[{"id":206,"stage":"core","reason":"保存后继后逐个反转"},{"id":21,"stage":"core","reason":"连接两条有序链表"},{"id":19,"stage":"practice","reason":"用临时头节点统一删除操作"},{"id":141,"stage":"practice","reason":"判断有没有环"},{"id":142,"stage":"practice","reason":"由相遇点推导环入口"},{"id":24,"stage":"practice","reason":"交换一对节点并接回"},{"id":25,"stage":"practice","reason":"检查长度后反转一组"}]},
  {"slug":"stack-queue","title":"栈、队列与单调结构","intro":"从括号匹配到每日温度，理解哪些元素还需要等待处理。","tags":["栈","队列","单调栈","单调队列"],"relatedProblems":[{"id":20,"stage":"core","reason":"最近打开的括号先匹配"},{"id":155,"stage":"core","reason":"保存每一步的最小值"},{"id":739,"stage":"practice","reason":"找到最近的更大元素"},{"id":239,"stage":"practice","reason":"维护窗口内尚未过期的最大值候选"},{"id":84,"stage":"practice","reason":"根据更小的柱子确定边界"}]},
  {"slug":"binary-tree","title":"二叉树与递归","intro":"说清一次递归返回什么，再用左右子树的结果处理当前节点。","tags":["二叉树","递归","二叉搜索树"],"relatedProblems":[{"id":104,"stage":"core","reason":"定义子树深度"},{"id":226,"stage":"core","reason":"分别处理左右孩子"},{"id":94,"stage":"practice","reason":"辨认访问节点的时机"},{"id":102,"stage":"practice","reason":"按队列当前长度处理一层"},{"id":98,"stage":"practice","reason":"验证整棵子树的范围"},{"id":543,"stage":"practice","reason":"区分向上返回值与全局答案"},{"id":236,"stage":"practice","reason":"判断祖先与两侧子树的关系"},{"id":124,"stage":"practice","reason":"计算路径贡献并处理负数"}]},
  {"slug":"graph-dfs-bfs","title":"图、网格与搜索","intro":"先确定节点和相邻关系，再用 DFS、BFS 或拓扑排序处理。","tags":["图","深度优先搜索","广度优先搜索","拓扑排序","矩阵"],"relatedProblems":[{"id":200,"stage":"core","reason":"标记一整片相连陆地"},{"id":994,"stage":"core","reason":"从多个起点同时逐层扩张"},{"id":207,"stage":"practice","reason":"用入度处理先修依赖"},{"id":79,"stage":"practice","reason":"区分全局访问与当前路径访问"}]},
  {"slug":"binary-search","title":"二分查找","intro":"用一个明确的区间约定，找到第一个满足条件的位置。","tags":["二分查找"],"relatedProblems":[{"id":35,"stage":"core","reason":"找第一个大于等于目标的位置"},{"id":34,"stage":"core","reason":"用两个分界点得到重复值范围"},{"id":74,"stage":"practice","reason":"把整体有序矩阵映射为一维"},{"id":153,"stage":"practice","reason":"判断最小值位于哪一侧"},{"id":33,"stage":"practice","reason":"先找到有序的一半"},{"id":4,"stage":"practice","reason":"进阶：两个有序数组的划分"}]},
  {"slug":"backtracking","title":"回溯：有次序地尝试所有选择","intro":"明确选择范围、结束条件和撤销操作，避免漏解与重复。","tags":["回溯","递归"],"relatedProblems":[{"id":78,"stage":"core","reason":"用起始下标生成子集"},{"id":46,"stage":"core","reason":"用使用状态生成排列"},{"id":39,"stage":"practice","reason":"重复选取与剩余目标"},{"id":22,"stage":"practice","reason":"提前排除非法括号前缀"},{"id":131,"stage":"practice","reason":"按回文片段继续搜索"},{"id":79,"stage":"practice","reason":"失败后恢复访问标记"},{"id":51,"stage":"practice","reason":"记录列与对角线限制"}]},
  {"slug":"dynamic-programming","title":"动态规划","intro":"从打家劫舍推导状态，再理解初始化、计算顺序和空间压缩。","tags":["动态规划","记忆化搜索"],"relatedProblems":[{"id":70,"stage":"core","reason":"从最后一步推导依赖"},{"id":198,"stage":"core","reason":"枚举选或不选当前房间"},{"id":62,"stage":"practice","reason":"累加到达一格的方案数"},{"id":322,"stage":"practice","reason":"区分不可达状态与最少硬币数"},{"id":416,"stage":"practice","reason":"通过倒序避免重复使用当前数"},{"id":1143,"stage":"practice","reason":"定义两个前缀的公共子序列"},{"id":72,"stage":"practice","reason":"比较编辑操作的代价"}]},
  {"slug":"heap-greedy","title":"堆与贪心选择","intro":"用堆保留当前最值；用具体理由判断一次贪心选择是否可靠。","tags":["堆（优先队列）","贪心"],"relatedProblems":[{"id":215,"stage":"core","reason":"用小顶堆保留最大的 k 个数"},{"id":347,"stage":"core","reason":"按出现频次维护候选"},{"id":295,"stage":"practice","reason":"用两个堆分开较小和较大的一半"},{"id":55,"stage":"practice","reason":"维护最远可达位置"},{"id":45,"stage":"practice","reason":"按可达范围计算跳跃层数"},{"id":763,"stage":"practice","reason":"到达字符最后位置后切分"}]},
  {"slug":"bit-tricks","title":"位运算、投票与原地处理","intro":"理解技巧依赖的题目条件，同时留意整数范围与重复元素。","tags":["位运算","数组","计数"],"relatedProblems":[{"id":136,"stage":"core","reason":"用异或消去成对出现的值"},{"id":169,"stage":"core","reason":"证明多数元素抵消后仍会留下"},{"id":75,"stage":"practice","reason":"区分已分类部分与未知部分"},{"id":41,"stage":"practice","reason":"把合法值放到对应位置"}]},
];

const articleLoaders = new Map([
  ["complexity", () => import('./complexity.js')],
  ["array-hashmap", () => import('./array-hashmap.js')],
  ["two-pointers", () => import('./two-pointers.js')],
  ["sliding-window", () => import('./sliding-window.js')],
  ["linked-list", () => import('./linked-list.js')],
  ["stack-queue", () => import('./stack-queue.js')],
  ["binary-tree", () => import('./binary-tree.js')],
  ["graph-dfs-bfs", () => import('./graph-dfs-bfs.js')],
  ["binary-search", () => import('./binary-search.js')],
  ["backtracking", () => import('./backtracking.js')],
  ["dynamic-programming", () => import('./dynamic-programming.js')],
  ["heap-greedy", () => import('./heap-greedy.js')],
  ["bit-tricks", () => import('./bit-tricks.js')],
]);

export async function loadArticle(slug) {
  const loader = articleLoaders.get(slug);
  if (!loader) throw new Error(`知识文章不存在: ${slug}`);
  return (await loader()).default;
}
