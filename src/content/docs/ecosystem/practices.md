---
title: 中文实践路线
description: 从公开 Jev 项目与官方 cookbook 出发，设计中文检索、工具选择、上下文压缩和人工复核实验。
---

**整理日期：2026-09-21。** 这些是 JevCN 根据公开资源整理的学习路线，不是本站的生产案例或已验证收益。先完成[SDK 快速开始](/getting-started/quickstart/)，再选择一个边界明确的任务。

## 路线一：中文检索与证据筛选

**阅读入口：** 官方 [RAG 段落分类](https://docs.typesafe.ai/cookbooks/classifying_rag_passages)、[引用检查](https://docs.typesafe.ai/cookbooks/citation_check)，以及[独立重排实验](https://github.com/zhuyansen/jev-search-rerank-eval)。

1. 准备一组公开且可使用的中文文档和人工编写的问题，先保存原始检索结果。
2. 让 Jev 判断候选段落的相关性；回答生成与引用核验分别记录，不混成一个分数。
3. 对比原始排序、单独重排和融合排序，人工检查被降权但实际相关的段落。
4. 保留无相关证据、相互矛盾、中文简称与中英混写的样例。

**应交付：** 查询集、相关性标签、对照结果和失败案例。若候选集合里根本没有正确材料，重排无法补回缺失的证据。

## 路线二：有限动作与工具选择

**阅读入口：** [jev-browser](https://github.com/jkudish/jev-browser)、[jev-guard](https://github.com/leepokai/jev-guard)。

把任务缩小到只读浏览或模拟工具：程序列出当前可用选项，Jev 选择下一步，程序在执行前再次检查状态和权限。增加“停止 / 信息不足”的路径，并记录意图理解错误、选项缺失与执行失败这三种不同问题。

**应交付：** 每步状态与候选动作、模型选择、执行结果及预期结果。使用离线回放先评估，不从项目演示直接推断可无人值守运行。

## 路线三：上下文压缩是否值得

**阅读入口：** [fast-jev-compaction](https://github.com/tamaratran/fast-jev-compaction)。

用脱敏的公开示例构造一段工具调用历史，标注后续任务必须保留的信息。比较不压缩、简单截断和按相关性筛选后的任务完成情况，同时记录输入量和新增判断开销。

**应交付：** 压缩比例、最终任务质量、遗失信息清单。字符减少是过程指标，不能替代任务是否完成。

## 路线四：评价标准与人工复核

**阅读入口：** [jev-align](https://github.com/sutro-sh/jev-align)、[jev-benchmarks](https://github.com/AbdelStark/jev-benchmarks)。

从公开文本分类或审核练习开始，写出明确标准，保留随机抽样复核；不要只复核低置信度样本，否则看不到高置信度误判。把标准修改记录为版本，在独立留出集上比较变化。

**应交付：** 标准版本、人工标签、误判类型和不同阈值下的自动处理覆盖率。

## 共同的记录习惯

每条路线都应固定版本、保留失败、说明数据来源。完整模板见[公开评测怎么读](/ecosystem/benchmarks/)。涉及算术、日期或硬性权限条件时，优先由代码计算与校验；模型能力边界请以[官方局限说明](https://docs.typesafe.ai/model-jaggedness/jev-1.13)为准。

欢迎分享小而完整的复现，而不必先做出大型应用。仅收录可以公开的材料，不要求贡献者披露自己的业务实现。
