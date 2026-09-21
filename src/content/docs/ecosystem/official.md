---
title: 官方资料与动态
description: Jev 官方文档、SDK、模型局限与发布日期索引，以及 JevCN 的资料核查和更新约定。
---

**最近核查：2026-09-21。** 本页是人工整理的资料快照，不是实时公告流。JevCN 是独立中文社区；产品变更以原始公告、版本说明和官方文档为准。

## 官方资料入口

| 来源 | 用途 |
| --- | --- |
| [TypeSafe 文档](https://docs.typesafe.ai/introduction) | 理解 System 1、请求结构与概率类型 |
| [模型列表](https://docs.typesafe.ai/models) | 核对可用模型与别名指向 |
| [Jev 1.13 局限说明](https://docs.typesafe.ai/model-jaggedness/jev-1.13) | 了解算术、日期、复杂状态和对抗内容等边界 |
| [JavaScript / TypeScript SDK](https://github.com/typesafe-ai/typesafe-sdk-js) | 阅读官方接口、示例与版本变化 |
| [Python SDK](https://github.com/typesafe-ai/typesafe-sdk-python) | 阅读同步与异步接入方式 |
| [官方 Agent Skills](https://github.com/typesafe-ai/skills) | 参考围绕 System 1 的开发与评估工作流 |
| [Python System One Adapter](https://github.com/typesafe-ai/system-one-adapter-python) | 用其他模型 API 提供兼容接口，辅助对照实验 |
| [官方 Evals](https://evals.typesafe.ai/) | 查看特定工作流的测量和评判方法 |

核查时，模型文档将 `jev-latest` 与 `jev-preview` 指向 `jev-1.13.0`。别名可能移动，复现报告应记录响应返回的实际模型版本。当前文档说明模型接收文本输入；图像、音频等需要先转成合适的文本状态，不能从浏览器或游戏演示推断原生视觉能力。

## 已核实的公开动态

日期为来源标注的发布日期，不是本站抓取时间。

| 日期 | 来源类别 | 动态与原始链接 |
| --- | --- | --- |
| 2026-09-18 | 官方 SDK | [Python SDK v0.7.0](https://github.com/typesafe-ai/typesafe-sdk-python/releases/tag/v0.7.0)：涉及序列化从 msgspec 迁移至 pydantic，并增加 `response_model` 参数；升级前查看破坏性变更。 |
| 2026-09-16 | 平台公告 | [Vercel AI Gateway 接入 Jev](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway)：通过其评估接口使用模型；公告中的实验性接口需结合平台版本核对。 |
| 2026-09-15 | 官方发布 | [Introducing System One Models and Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)：介绍以状态为输入、以带类型的概率决策为输出的产品方向。 |

另有 [Cloudflare Jev 模型文档](https://developers.cloudflare.com/ai/models/typesafe/jev/)可供平台接入参考。平台模型入口与本网站的静态托管配置是不同事项。

## 我们如何维护资料

1. **先看上游：** 核对官方文档、SDK Release 和发布文章；平台支持信息回到对应平台公告确认。
2. **再补上下文：** 写明变化影响哪个接口或示例，不把模型别名更新等同于所有 SDK 同时升级。
3. **保留可核查来源：** 条目标注日期，链接原始页面；性能资料同时记录版本、条件及是否已复现。
4. **及时更正：** 发现断链、归档或结论变化时修正文案；旧版本资料保留其适用范围。

目前通过人工核查与社区投稿更新，未启用自动新闻采集。你可以在官方仓库关注 Releases，也可以通过 [JevCN Issues](https://github.com/xiaoMingChina/jevcn/issues)提交值得翻译、复现或纠正的资料。

发现社区项目请看[项目精选](/ecosystem/showcase/)和[资源导航](/ecosystem/rankings/)。
