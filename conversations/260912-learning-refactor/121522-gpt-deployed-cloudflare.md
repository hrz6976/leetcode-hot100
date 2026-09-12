# 交接记录 — 121522 · gpt · deployed-cloudflare

## 继承的上下文与用户决定
前序记录：121441-gpt-refactored-learning.md、121447-gpt-refactored-progress-sidebar.md。
用户要求部署 Cloudflare，最初询问纯前端，后续明确讨论 Worker CORS 转发；指定域名 hot100.1919114.xyz，DeepSeek 使用官方 API，优先 OpenCode Go。用户要求完成后 commit。
用户授权将自己的 Go Key 配置到线上并发测试请求；随后说明曾在在线域名填写。最终检查线上时 Key 为空、模型与 Go 不匹配，使用已授权的本机 Go 凭据填写线上 Go 配置并设为 kimi-k2.6，真实请求成功。密钥未输出、未写入仓库或部署包。用户要求保留本地进度，未迁移或清理本地进度。

## 本次完成
- [x] Cloudflare Worker leetcode-hot100-hrz 已部署，绑定 https://hot100.1919114.xyz。
- [x] 静态资源直接托管，仅 /api/* 进入 Worker；在线版浏览器保存，不依赖本地 Node。
- [x] AI 同域转发支持 Go、Kimi Coding、DeepSeek 等官方端点；预设、Base URL、模型和 Key 可配置。
- [x] 转发限制 Origin、POST、目标白名单、请求体 1 MiB，拒绝重定向；SSE 透传、取消与 120 秒超时，Key 不落盘。
- [x] 自定义 Base URL 可在 vars.AI_ALLOWED_BASE_URLS 添加并重新部署。
- [x] README、部署脚本和回归测试补齐。

## 验证
55 项 AI、存储、本地服务及 Worker 测试通过。正式域名 HTTPS 返回 200；Python wasm 可访问；progress/learning.json、.git/config 和本地 /api/session 返回 404。
Go 在正式域名真实返回 nums[0] || -1 的 [0] 反例解释与正确修复。Python、JavaScript 示例均实际输出 6。进度侧栏显示浏览器保存，自动收起。
线上 Kimi Coding、DeepSeek 尚未使用真实 Key 发请求；不能宣称订阅鉴权均验证成功。Worker 使用真实客户端标识，不伪装为其他 coding agent。

## 部署与代码状态
Worker 版本 c60eb725-9784-430e-9ce1-2b99b12a4e79。
备用域名 https://leetcode-hot100-hrz.12f23eddde.workers.dev 。
运行 npm run deploy 可重建并部署。dist/ 和 .wrangler/ 已忽略，部署白名单排除个人数据。
此次代码随本记录提交；未额外推送 GitHub。

## 后续与限制
无部署阻塞。在线域名与 localhost 存储独立；线上进度需导出备份再保存至 progress/learning.json 后 commit。Worker 只解决跨域，不改变上游订阅权限。若继续调试浏览器，本轮使用 Node REPL 的 setupBrowserRuntime 支持接口；早先的 cua 会话已失效。
