# 交接记录 — 121447 · gpt · refactored-progress-sidebar

## 继承的上下文
见 121441-gpt-refactored-learning.md。用户追加要求：保存记录设计成类似 AI 助手的侧栏，不遮挡阅读。

## 本次完成
- [x] 顶部保存栏移入右侧「进度」侧栏，默认收起；错误与冲突显示提醒点。
- [x] 立即保存、导出备份及原有冲突选择保留。支持点击外部、关闭按钮、Escape 收起。
- [x] AI 与进度侧栏互斥，右侧留出按钮空间供直接切换。
- [x] README 和题库页提示更新。

## 验证与当前状态
33 项存储和服务测试通过；浏览器验证手动落盘、侧栏切换、Escape 收起及 390px 手机布局。正式服务上的跨页面冲突提示亦正确显示，未覆盖文件。
改动涉及 js/local-progress.js、js/views/assistant.js、js/views/list.js、css/views-extras.css、README.md。
原有无关未提交修改保留。progress/learning.json 当前存在，未纳入代码提交，也未删除；可能由打开正式页面时其他页面的自动保存创建。

## 后续任务与阻塞
无。继续使用即可。
