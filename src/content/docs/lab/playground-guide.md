---
title: Playground 使用指南
description: 使用自己的 API Key 在线运行 JevCN 试验场，了解缓存与结果导出。
---

[进入独立 Playground 工作台](/playground/)

## 从中文示例开始

工作台提供 9 个原创示例，可按 Choice、Noul、Score 筛选：趣味判断包括汤圆分类、雨天出行、小诗评价与反讽识别；开发实践包括提问路由、证据检查、教程评价、Issue 分类与更新说明评价。

点击卡片会载入输入、问题和判断标准，不会自动发送请求。每个示例附有“换一个条件再试”的提示，可以修改定义、上下文或评分标准来比较结果。场景均为学习用的虚构材料，没有预设模型答案。

## 在线运行

在 Playground 填入自己的 API Key，选择示例并点击“运行 1 次请求”。Key 和输入通过本站 Cloudflare Worker 转发给固定的官方 API，接口不保存 Key、不记录请求内容，响应不缓存。文档页面仍为静态页面。

本站接口按 IP 设置每分钟 10 次的边缘限流（非严格全局配额）；官方额度另计。不会自动运行或重试。也可以不填 Key，仅预览请求。

## 关于 Key 与结果

- 默认不保存 Key；勾选“在此浏览器记住 Key”后保存于本网站的 `localStorage`。不同浏览器、设备或域名之间不共享。
- 在线版 Key 经 JevCN 的 Cloudflare Worker 转发给官方 API。接口固定官方地址，不接受自定义第三方转发地址。
- 浏览器本地存储不是加密凭证库，网页脚本和有权限的扩展可能读取。请使用可撤销的个人试验 Key，共用电脑不要保存。
- 输出仅代表当前输入和模型版本的结果。置信度不等于正确率；端到端耗时包含网络时间，不等于模型推理耗时。

官方同时提供 [HTTP API](https://docs.typesafe.ai/api) 与 [JavaScript SDK](https://github.com/typesafe-ai/typesafe-sdk-js)。SDK 封装同一个 API；浏览器能否直连还取决于官方跨域策略。模型与额度以[官方文档](https://docs.typesafe.ai/models)为准。

取消或超时只停止等待，不保证官方服务端没有处理或计费。
