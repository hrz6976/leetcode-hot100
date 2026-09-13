# pi-ai 接入与 thinking UI

用户要求参考 ~/Documents/GitHub/deepseek-harness-on-vue 使用成熟连接器，避免自造轮子，并显示 thinking。阅读 src/shared/pi-engine.ts，使用相同 @earendil-works/pi-ai 0.84.2、createProvider、openAICompletionsApi。沿用前序安全代理和按行 Markdown 设计。

删除 js/assistant.js 手写 SSE 和 fetch 解析，js/pi-chat.js 仅转换上下文/代理配置及 SDK 事件。SDK 管理正文/thinking/错误/取消；45 秒无事件中止请求，不自动重试。Provider 身份按 upstream 保留，避免代理 URL 破坏兼容检测。thinking 按文本节点实时显示，正文仍按完整行渲染；独立 details 保留折叠状态；错误/停止保留已有正文与 thinking。重新打开流式面板不重建活动气泡。thinking 仅内存历史，未纳入持久进度。

npm 固定 SDK、esbuild 版本并添加 lockfile，build:ai 生成按需加载 vendor/pi-ai.js（约177K），纳入仓库保证本地无 npm 也可启动。Actions 两个 job 加 npm ci，static build 重建 SDK。补充 pi-ai/OpenAI/partial-json 许可证。

140 项测试通过，包括真实 SDK 的中文逐字节分片、thinking 与正文、断流、429不重试、取消、代理头。隔离本地服务浏览器验证 thinking 实时出现、正文标题渲染。真实 Go 请求经正式 Worker 与新 SDK 返回“测试成功”，收到156字符 thinking。待推送后确认 Actions 和线上 UI。

用户 progress/learning.json 原有修改保留，未纳入提交。参考仓库未修改。

## 完成
提交 b744ac8、ba93774 均已推送，最新 Actions 34747898774 测试/构建/部署成功（新增兼容检查后共141项测试）。线上真实浏览器完成一轮对话：2179字符 thinking、671字符正文、发送按钮恢复；thinking 折叠验证通过。隔离 UI 手动停止验证通过。Go 新SDK直测也成功。补充 thinkingLevelMap.off=null，避免 SDK 主动关闭上游默认思考；OpenAI 使用 max_completion_tokens。
