# 正文尾行纯文本预览

用户确认：未完成行先实时显示纯文本，换行或回复结束再应用 Markdown，要求修改并 push。

createLineBuffer 新增独立 preview 回调；Markdown 仍仅在完整行/结束时解析累计正文。UI 用 textContent 更新尾行 span，避免 HTML 注入；开放代码围栏中的尾行追加到现有 code 区域。thinking 独立节点不重建；保留原滚动跟随判断。停止和异常同样 finish，渲染已收到的尾行。

143 项测试通过，包括跨 chunk 围栏、未闭合强调符号、HTML 原文预览、换行替换与结束尾部不重复。用户 progress/learning.json 未修改或纳入提交。此次提交推送触发既有自动部署。
