---
title: Playground 使用指南
description: 启动 JevCN 本地试验场，使用自己的 API Key，并了解缓存、结果导出与线上预览模式。
---

[进入独立 Playground 工作台](/playground/)

## 启动本地版

2026-09-22 核查：官方 API 的跨域预检拒绝 `https://jevcn.com`。因此线上页面仅用于编辑和预览，本地版使用官方 `@typesafe-ai/sdk` 0.6.0 完成真实调用。网站仍然是纯静态站，不部署密钥转发服务。

准备 Node.js 22.12.0 或更高的 22.x，在自己的电脑执行：

```bash
git clone https://github.com/xiaoMingChina/jevcn.git
cd jevcn
npm ci
npm run build
npm run playground
```

已有仓库可先更新，再执行后面三步。在浏览器打开 [本地 Playground](http://127.0.0.1:4322/playground/)，填入你自己的 Key，选择是否记住，然后运行。保持终端开启；按 Ctrl+C 停止服务。

服务仅监听本机 `127.0.0.1`，只向官方 API 转发一次请求，关闭 SDK 自动重试与日志。取消或超时只停止等待，不保证服务端没有处理或计费。不要将本地服务通过公网隧道共享。

## 关于 Key 与结果

- 默认不保存 Key；勾选“在此浏览器记住 Key”后保存于本网站的 `localStorage`。不同浏览器、设备或域名之间不共享。
- 真实调用的 Key 只经过本机服务和 TypeSafe 官方 API；本机服务使用官方 SDK，固定官方地址，不接受自定义第三方转发地址。线上预览不会接收你的 Key。
- 浏览器本地存储不是加密凭证库，网页脚本和有权限的扩展可能读取。请使用可撤销的个人试验 Key，共用电脑不要保存。
- 输出仅代表当前输入和模型版本的结果。置信度不等于正确率；端到端耗时包含网络时间，不等于模型推理耗时。

官方同时提供 [HTTP API](https://docs.typesafe.ai/api) 与 [JavaScript SDK](https://github.com/typesafe-ai/typesafe-sdk-js)。SDK 封装同一个 API；浏览器能否直连还取决于官方跨域策略。模型与额度以[官方文档](https://docs.typesafe.ai/models)为准。
