---
title: 全球项目精选
description: 按用途认识公开的 Jev 浏览器工具、模型路由、检索、评估与游戏实验，附原始仓库和阅读重点。
---

从公开代码认识 Jev 的用途：它在哪一步作判断，普通程序负责哪些约束，生成模型又承担什么工作。

**资料核查：2026-09-21。** 以下为第三方项目，依据公开 README 与仓库说明整理，尚未由 JevCN 安装运行或复现性能。收录不代表官方背书或生产可用性认证；使用与再分发前请检查各项目及依赖的许可证。

## 浏览器与移动端

| 项目 / 原始来源 | 用途 | 值得阅读的设计 |
| --- | --- | --- |
| [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast) | 浏览器自动化实验 | 将动作与目标选择交给 Jev，文本生成交给其他模型，观察两类模型如何分工。 |
| [jkudish/jev-browser](https://github.com/jkudish/jev-browser) | 浏览器 CLI、MCP 与库 | 把 DOM 中的候选元素转成有限选项；适合研究观察、决策、执行循环。 |
| [droidrun/mobile-jev](https://github.com/droidrun/mobile-jev) | Android 自动化与调试界面 | 结合 Mobilerun 查看移动端动作轨迹；需要相应平台和模型访问条件。 |

有限候选集约束输出的形式，但页面更新、元素失效、任务理解错误仍可能发生。复现时先选只读任务，记录每一步状态与执行结果。

## 智能体基础工具

| 项目 / 原始来源 | 用途 | 值得阅读的设计 |
| --- | --- | --- |
| [gargpratyush/jev-router](https://github.com/gargpratyush/jev-router) | 编程智能体模型路由 | 按当前请求选择模型档位，研究路由质量与总体成本的关系。 |
| [tamaratran/fast-jev-compaction](https://github.com/tamaratran/fast-jev-compaction) | 上下文压缩 | 对工具调用与结果评分后保留、截断或移除；保留原文不等于没有信息损失。 |
| [leepokai/jev-guard](https://github.com/leepokai/jev-guard) | 工具调用风险判断 | 把风险、用户意图和不可信来源判断转成放行、询问或拒绝建议。 |

风险模型适合作为辅助信号；执行权限、明确禁止的操作和用户授权应由宿主程序管理。不要把某个示例中的阈值当成通用安全标准。

## 检索、数据与家庭自动化

| 项目 / 原始来源 | 用途 | 值得阅读的设计 |
| --- | --- | --- |
| [superagents-lab/jev-search](https://github.com/superagents-lab/jev-search) | 结合 Search1API 的网页检索 | 观察来源选择、查询理解和相关性排序三个决策环节。 |
| [sutro-sh/jev-align](https://github.com/sutro-sh/jev-align) | 数据评估与标准迭代 | 结合不确定样本、随机抽检和人工标注改进评价标准；不是训练官方 Jev 权重。 |
| [AboveColin/HA-Jev](https://github.com/AboveColin/HA-Jev) | Home Assistant 集成 | 把模型判断接入传感器与自动化流程，区分判断信号和设备执行条件。 |

## 游戏中的小型决策循环

- [fhshaik/typesafe-mario](https://github.com/fhshaik/typesafe-mario)：从模拟器的结构化状态选择动作。这里的状态接口值得研究，不能据此认为 Jev 直接理解游戏截图。
- [sorrycc/typesafe-snake](https://github.com/sorrycc/typesafe-snake)：贪吃蛇自动游玩实验。适合观察每轮候选动作、合法移动与失败反馈如何配合。

## 独立实现与研究

这些项目可用于理解架构思路，**不是 TypeSafe 发布的模型权重，也不能直接代表官方 Jev 的能力**。

- [vinnylarouge/jevlike](https://github.com/vinnylarouge/jevlike)：探索编码器与选项评分结构，提供自己的训练和评测实验。
- [featherless-ai/simple-jev](https://github.com/featherless-ai/simple-jev)：利用开放模型的 logits 构建分类与兼容接口，适合比较不同实现路径。

## 继续探索

本页为人工精选，不按星标排序，也不追求穷尽所有仓库。项目发现参考了 [cobanov 的目录](https://github.com/cobanov/awesome-jev)和 [hellogumbo 的目录](https://github.com/hellogumbo/awesome-jev)，描述优先回溯原始仓库。

- [排行榜与资源导航](/ecosystem/rankings/)：发现更多项目，理解排名口径。
- [公开评测怎么读](/ecosystem/benchmarks/)：区分演示、测量与可推广结论。
- [中文实践路线](/ecosystem/practices/)：选择第一个可验证的小实验。
- [提交新资源](/community/contributing/#推荐公开资源)：补充仓库、文章或复现记录。
