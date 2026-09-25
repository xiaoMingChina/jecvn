# jevcn

Jev 中文社区 · 面向软件工程决策的 System 1 强类型毫秒级模型中文指南

> 站点域名：[jevcn.com](https://jevcn.com)

## 这是什么

[Jev](https://typesafe.ai) 是 TypeSafe AI 推出的 System 1（系统一）决策模型：输入非结构化的 `state`，输出**强类型的概率化决策**。它不生成文本，只回答你预先定义好的问题，并在 70–500ms 内返回带校准概率的答案。

本项目是它的**中文开发者门户**，基于 Astro + Starlight 构建，包含：

| 章节 | 内容 |
| --- | --- |
| 快速开始 | 核心概念（杰文斯悖论 / 卡尼曼系统一）、SDK 三分钟上手 |
| 核心原子机制 | `Choice` / `Noul` / `Score` 三大原子操作详解；系统一与通用 LLM 的对比与分工 |
| 前沿生态与案例 | 全球开源项目收录；中文社区与贡献指南 |

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

## Cloudflare Workers 部署

- Root Directory：留空（项目位于仓库根目录）。
- Build command：`npm run build`。
- Deploy command：`npx wrangler deploy`。静态资源目录由 `wrangler.jsonc` 指向 `dist`。
- Node.js：根目录的 `.nvmrc` 和 `.node-version` 均指定 `22`；如控制台配置了 `NODE_VERSION`，请同步设置为 `22`。
- 依赖由已提交的 `package-lock.json` 锁定，本地使用 `npm ci` 安装。

Playground 仅提供线上运行：`/api/systemone` 由 `worker/index.js` 处理，其他页面继续使用 Astro 静态资源。不需要配置 TypeSafe Key 环境变量；每位用户自带 Key，通过 Authorization 请求头转发至固定官方 API。接口不存储密钥或输入、不输出请求内容日志、响应不缓存；不要在 Cloudflare 添加记录认证头或请求体的日志处理器。

限流绑定 `PLAYGROUND_RATE_LIMITER` 由 Wrangler 配置，按 IP 每分钟 10 次（边缘限流，不是严格的全局配额）。允许的站点为 `https://jevcn.com` 和 `https://www.jevcn.com`。不支持其他预览域名调用。

验证：`npm run test:playground`、`npm run build`、`npx wrangler deploy --dry-run`。前两者和打包验证不调用收费 API；使用真实 Key 的端到端验证需在部署后手动运行一次。

## 目录结构

```
.
├── astro.config.mjs          # 站点配置：site / 中文 locale / 侧边栏
├── src/
│   ├── data/                 # Labs / Patterns 注册表与社区更新
│   ├── components/           # Starlight 与实验室界面
│   ├── assets/               # 图片资源
│   ├── content.config.ts     # 内容集合定义
│   └── content/docs/         # 所有文档页面（.md / .mdx）
│       ├── index.mdx         # splash 首页
│       ├── getting-started/  # 快速开始
│       ├── primitives/       # 核心原子机制
│       ├── labs/             # 开放实验
│       ├── patterns/         # 设计模式与验证状态
│       └── ecosystem/        # 全球生态与案例
├── worker/                   # Cloudflare Worker API
└── public/                   # 静态资源（favicon 等）
```

侧边栏在 `astro.config.mjs` 的 `sidebar` 字段中维护；`src/content/docs/` 下的每个 `.md` / `.mdx` 文件按路径自动成为一个路由。

## 社区 × 开放实验室

Playground 用来观察 `State → Choice / Noul / Score → Typed Decision + Probability`；Labs 用来探索这些原语进入完整软件后的行为。Labs 的类型化元数据位于 `src/data/labs.mjs`，Patterns 位于 `src/data/patterns.mjs`，关联由 Registry 推导。状态包括原型、实验中和已验证；未经验证的结论保持假设，不将示意分布标成实时调用。

新增 Lab：在 Registry 增加元数据（假设、设置、数据、结果、失败、延迟、成本、局限和结论），创建内容页并链接现有实验或源码。新增 Pattern：增加原语、验证状态、适用边界与相关 Lab ID，再创建内容页。没有实际内容的分类不建空页面。

原有 `/getting-started/`、`/primitives/`、`/lab/`、`/ecosystem/` 和 `/playground/` 路径继续保留；`/learn/*` 与 `/labs/chinese-routing` 提供兼容入口。

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
