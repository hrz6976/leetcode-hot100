# 交接记录 — 121545 · gpt · added-preview-ci

## 用户目标
1. 把已有改动合入 main，配置 Cloudflare 或 GitHub Actions 自动部署。
2. 文章引用题目时能了解题意；用户允许一句话概括或预览 UI，本次选择预览 UI。

## 已完成
- main 已 fast-forward 到 9a81401 并推送，包含全部前序重构和本次 UI/CI。
- 13 篇文章正文的「第 N 题」均生成预览按钮，文末练习列表也提供预览。
- 原生 dialog 按需载入题目 description（含示例）；Esc/关闭/背景返回原文、焦点恢复、去做这题可跳转。仅转换正文文本节点，排除代码和既有交互元素。
- 新增 tests/problem-preview.test.mjs，检查所有引用均有对应题意。
- GitHub 工作流 .github/workflows/deploy.yml：PR/main 索引检查、Node 测试、静态构建；main 或手动运行时部署，production 并发串行；进度、交接记录、Markdown-only 提交不触发。
- 仓库变量 CLOUDFLARE_ACCOUNT_ID 已设置；Actions 已启用。
- 已用本机 Wrangler 发布当前功能，CF 版本 19916fa7-893b-41dc-8459-271981add644。

## 验证
本地 137 项测试通过。浏览器验证第 74 题全文、示例、Escape 与焦点恢复，手机 390px 布局正常；正式域名已确认内容加载。
GitHub run 34681474482 的 check job 全部成功。deploy job 因缺少 CLOUDFLARE_API_TOKEN 明确失败，尚未完成自动部署端到端验证。

## 唯一待办：自动部署凭据
本机 Wrangler OAuth 调用 /user/tokens 与 Builds tokens API 返回 403，不能创建专用 CI 凭据。已请用户在 Cloudflare 创建限定当前账号及 1919114.xyz 的 Edit Cloudflare Workers API Token，并在仓库 Settings → Secrets and variables → Actions 中添加 CLOUDFLARE_API_TOKEN；无需发聊天。
用户配置后，用 gh secret list 确认存在，然后 gh run rerun 34681474482 --failed --repo hrz6976/leetcode-hot100，查看部署和公开 URL 检查均通过。若 run 已过期则手动触发 deploy.yml main。

## 本地状态
当前分支 main。progress/learning.json 有未提交的本地学习进度，切换分支时暂存后完整恢复，没有合入此次代码提交；不要覆盖。此次说明记录单独提交并推送（文档改动不触发部署）。
