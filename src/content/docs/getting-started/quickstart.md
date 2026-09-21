---
title: 3 分钟上手 SDK
description: 安装 TypeSafe 官方 SDK，配置 API Key，跑通第一个强类型决策调用，并学会并行批量决策。
---

## 1. 环境要求

- **Node.js 20 或更高版本**（SDK 的 `engines` 字段硬性要求）
- 一个 TypeSafe API Key

---

## 2. 安装官方 SDK

```bash
npm install @typesafe-ai/sdk
```

当前版本 `0.6.0`，同时提供 ESM、CommonJS 与 TypeScript 类型声明，开箱即用无需额外 `@types` 包。

---

## 3. 配置 API Key

前往官方控制台 <https://console.typesafe.ai> 创建 API Key，然后写入环境变量：

```bash
# macOS / Linux —— 写入 shell 配置（zsh 默认）
echo 'export TYPESAFE_API_KEY="tsk_your_key_here"' >> ~/.zshrc
source ~/.zshrc
```

或使用项目级 `.env` 文件（推荐，记得加入 `.gitignore`）：

```bash
# .env
TYPESAFE_API_KEY=tsk_your_key_here
```

SDK 会**自动读取** `TYPESAFE_API_KEY`，因此 `new TypeSafeClient()` 可以不带任何参数。

:::caution[API Key 是服务端凭证]
SDK 默认**禁止在浏览器中运行**（`dangerouslyAllowBrowser` 默认为 `false`），这是有意为之的设计——把 Key 暴露给页面用户等于泄露凭证。请始终在 Node.js 服务端调用 Jev，前端通过你自己的后端转发。
:::

### 可选环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `TYPESAFE_API_KEY` | 无（必填） | API Key |
| `TYPESAFE_DEFAULT_MODEL` | `jev-latest` | 默认模型 |
| `TYPESAFE_BASE_URL` | `https://api.typesafe.ai` | API 根地址 |
| `TYPESAFE_LOG_LEVEL` | `warn` | `debug` / `info` / `warn` / `error` / `off` |

---

## 4. 第一个完整示例

下面是一个**可直接运行**的 TypeScript 示例，展示 `state` 传参以及三种原子问题类型：

```ts
// demo.ts
import { choice, noul, score, TypeSafeClient } from '@typesafe-ai/sdk';

// 1. 创建客户端：自动读取环境变量 TYPESAFE_API_KEY
const client = new TypeSafeClient();

// 2. 发起一次 System One 决策
const response = await client.systemOne({
  // state = 你要模型"看一眼"的非结构化状态。
  // 它可以是字符串、JSON 对象或数组 —— 这里用对象承载多条相关字段。
  // 官方建议：state 写成简短、密集、信息量高的描述段落，效果最好。
  state: {
    document: 'I was charged twice for the same order. Please fix this ASAP.',
    customer: {
      plan: 'pro',
      tenureMonths: 26,
      lifetimeValueUsd: 4820,
    },
    locale: 'zh-CN',
  },

  // questions = 你预先定义好的问题集合。
  // 所有问题在【同一次请求内并行求解】，不需要你自己并发。
  // 键名（category / isUrgent / priority）就是你之后读取答案的字段名，
  // 官方建议用可读性好的描述性键名。
  questions: {
    // —— Choice：有限单选枚举 ——
    // 第二个参数是"标签 → 描述"的映射；描述可以传 null（表示不额外说明）。
    category: choice('What is this ticket about?', {
      billing: 'Payment, invoice, refund or charge issues.',
      technical: 'Bugs, crashes, errors or broken features.',
      account: 'Login, password, profile or permission issues.',
      other: null,
    }),

    // —— Noul：是非判断 ——
    // 第二个参数可选，用来描述"是 / 否"各自的含义，帮助模型校准。
    isUrgent: noul('Does this require immediate human attention?', {
      true: 'Customer is blocked, losing money, or at churn risk.',
      false: 'Can be handled in the normal queue.',
    }),

    // —— Score：有序区间打分 ——
    // 第二个参数是一个【从 0 开始编号】的评分标准数组，至少两项。
    // 返回的 score 是期望值，可能落在两个整数档位之间（例如 2.7）。
    priority: score('How urgent is this ticket?', [
      'No action needed.',
      'Low — handle within a week.',
      'Medium — handle within 2 days.',
      'High — handle within 24 hours.',
      'Critical — drop everything now.',
    ]),
  },
});

// 3. 读取结果。
// 答案类型是【由 questions 自动推导】的 —— TypeScript 编译器完全知道
// response.answers.category 有哪些合法标签，写错标签会直接编译报错。
console.log('模型:', response.model);
console.log('Token 用量:', response.usage);
// —— Choice 的答案 ——
console.log('分类:', response.answers.category.choice);        // 'billing'
console.log('置信度:', response.answers.category.confidence);  // 0.97
console.log('完整概率分布:', response.answers.category.probabilities);
// { billing: 0.97, technical: 0.01, account: 0.01, other: 0.01 }

// —— Noul 的答案：0~1 之间的校准概率 ——
console.log('紧急概率:', response.answers.isUrgent.noul);      // 0.82

// —— Score 的答案：期望分 + 概率分布 ——
console.log('优先级:', response.answers.priority.score);       // 3.4
console.log('各档位概率:', response.answers.priority.probabilities);
```

运行：

```bash
npx tsx demo.ts
```

---

## 5. 并行批量决策

上面示例中，**同一次请求里的多个 question 已经是并行求解的**。

当你要处理**多条独立输入**（比如一批工单、一批消息）时，用 `Promise.all` 把它们扇出——这才是 Jev 真正的主场：因为单次调用只要几十到几百毫秒，批量并行的总耗时几乎是可以忽略的。

```ts
import { choice, TypeSafeClient } from '@typesafe-ai/sdk';

const client = new TypeSafeClient();

// 待处理的一批消息
const messages: string[] = [
  'I was charged twice, please refund.',
  'How do I change my avatar?',
  '你的 App 一打开就闪退，我要退款！',
  'Thanks, works great now 👍',
];

// 扇出：每条消息一次独立决策，全部并行
const results = await Promise.all(
  messages.map((text) =>
    client.systemOne({
      state: { document: text },
      questions: {
        category: choice('What is this message about?', {
          billing: 'Payment, refund or charge issues.',
          technical: 'Bugs, crashes or broken features.',
          praise: 'Positive feedback, thanks or compliments.',
          other: null,
        }),
      },
    }),
  ),
);

// 收拢结果：只有当置信度足够高时才信任它
for (const [i, res] of results.entries()) {
  const { choice: label, confidence } = res.answers.category;

  // 置信度低于阈值 → 交给更贵的通用 LLM 或人工兜底
  const verdict = confidence >= 0.9 ? `自动路由至【${label}】` : '置信度不足，转人工复核';
  console.log(`${messages[i]} → ${verdict} (${confidence.toFixed(2)})`);
}
```

:::tip[并行时注意速率限制]
批量扇出时如果用 `Promise.all` 一次发几百个请求，可能触发 `429 RateLimitError`。SDK 内置了自动重试（默认最多重试 2 次，指数退避 + 抖动），并会遵循服务端返回的 `Retry-After`。生产环境建议自行加一层并发上限（例如 `p-limit`）。
:::

---

## 6. 错误处理

SDK 导出了一组具体的错误类型，便于精准分流：

```ts
import {
  APIError,
  APIConnectionError,
  RateLimitError,
  TypeSafeClient,
} from '@typesafe-ai/sdk';

const client = new TypeSafeClient();

try {
  const res = await client.systemOne({
    state: 'user input here',
    questions: { /* ... */ },
  });
  console.log(res.answers);
} catch (err) {
  if (err instanceof RateLimitError) {
    // 限流：err.retryAfterMs 是服务端建议的等待毫秒数
    console.warn(`被限流，建议 ${err.retryAfterMs}ms 后重试`);
  } else if (err instanceof APIConnectionError) {
    // 网络不可达 / 超时（默认每次尝试 10 秒超时）
    console.error('网络问题，请求未到达');
  } else if (err instanceof APIError) {
    // 服务端返回非 2xx：err.status / err.requestId 便于排查
    console.error(`API 错误 ${err.status}`, err.requestId);
  } else {
    throw err;
  }
}
```

常用错误类型：

| 错误类 | 触发场景 |
| --- | --- |
| `AuthenticationError` (401) | API Key 缺失或无效 |
| `RateLimitError` (429) | 触发限流，带 `retryAfterMs` |
| `UnprocessableEntityError` (422) | 请求校验失败（如 score 标准少于 2 项） |
| `APITimeoutError` | 单次尝试超时（默认 10s） |
| `APIUserAbortError` | 调用方通过 `AbortSignal` 主动取消 |

---

## 下一步

- [Choice / Noul / Score 三大原子机制详解](/primitives/types/) —— 搞清每种类型的适用边界
- [系统一 vs 通用 LLM 对比](/primitives/comparison/) —— 想清楚什么该交给 Jev、什么该留给慢脑
