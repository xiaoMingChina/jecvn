# jecvn

Jev 中文社区 · 面向软件工程决策的 System 1 强类型毫秒级模型中文指南

> 站点域名：[jevcn.com](https://jevcn.com)

## 这是什么

[Jev](https://typesafe.ai) 是 TypeSafe AI 推出的 System 1（系统一）决策模型：输入非结构化的 `state`，输出**强类型的概率化决策**。它不生成文本，只回答你预先定义好的问题，并在 70–500ms 内返回带校准概率的答案。

本项目是它的**中文开发者门户**，基于 Astro + Starlight 构建，包含：

| 章节 | 内容 |
| --- | --- |
| 快速开始 | 核心概念（杰文斯悖论 / 卡尼曼系统一）、SDK 三分钟上手 |
| 核心原子机制 | `Choice` / `Noul` / `Score` 三大原子操作详解；系统一与通用 LLM 的对比与分工 |
| 前沿生态与案例 | 全球开源项目收录；SaaS / SCRM 决策实战指南 |

## 本地开发

需要 **Node.js 22.12.0 或更高的 22.x 版本**（与当前 Astro 版本要求一致）。

```bash
npm ci
npm run dev      # 开发服务器 → http://localhost:4321
```

用后台模式跑开发服务器（便于管理与查看日志）：

```bash
npx astro dev --background
npx astro dev status    # 查看状态
npx astro dev logs      # 查看日志
npx astro dev stop      # 停止
```

## 构建与预览

```bash
npm run build    # 产出静态站点到 ./dist/
npm run preview  # 本地预览构建结果
```

## Cloudflare Pages 部署

- Root Directory：留空（项目位于仓库根目录）。
- Build command：`npm run build`。
- Build output directory：`dist`。
- Node.js：根目录的 `.nvmrc` 和 `.node-version` 均指定 `22`；如控制台配置了 `NODE_VERSION`，请同步设置为 `22`。
- 依赖由已提交的 `package-lock.json` 锁定，本地使用 `npm ci` 安装。

## 目录结构

```
.
├── astro.config.mjs          # 站点配置：site / 中文 locale / 侧边栏
├── src/
│   ├── assets/               # 图片资源
│   ├── content.config.ts     # 内容集合定义
│   └── content/docs/         # 所有文档页面（.md / .mdx）
│       ├── index.mdx         # splash 首页
│       ├── getting-started/  # 快速开始
│       ├── primitives/       # 核心原子机制
│       └── ecosystem/        # 生态与案例
└── public/                   # 静态资源（favicon 等）
```

侧边栏在 `astro.config.mjs` 的 `sidebar` 字段中维护；`src/content/docs/` 下的每个 `.md` / `.mdx` 文件按路径自动成为一个路由。

## 内容勘误

文档中的 SDK 用法基于 `@typesafe-ai/sdk` **0.6.0** 的真实类型声明编写。若官方 API 有变更，请以 [官方文档](https://docs.typesafe.ai) 为准。

## 相关链接

- 官方博客：<https://typesafe.ai/blog/introducing-system-one-models-and-jev>
- 官方控制台：<https://console.typesafe.ai>
- 官方文档：<https://docs.typesafe.ai>
- JS/TS SDK 源码：<https://github.com/typesafe-ai/typesafe-sdk-js>
- 开源项目合集：<https://github.com/cobanov/awesome-jev>

## 许可

文档内容版权归各自作者所有；Jev 及相关商标归 TypeSafe AI 所有。
