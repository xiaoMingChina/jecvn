---
title: Choice / Noul / Score 原理
description: Jev 只有三种输出类型——搞清它们各自的语义、返回结构、适用边界与反模式，就掌握了这个模型的全部表达力。
---

Jev 的表达力被**刻意限制**在三种原子操作上。这不是能力不足，而是设计选择：正因为输出空间是封闭的、预先定义的，模型才**不可能**产生语法破损的 JSON，也**不可能**自由发挥地胡说八道。

三种类型对应的 SDK 助手函数：`choice` / `noul` / `score`。

---

## 总览

| 原子操作 | 语义 | 返回核心字段 | 典型场景 |
| --- | --- | --- | --- |
| **Choice** | 有限单选枚举 | `choice`（命中标签）+ `confidence` + `probabilities` | 分类、路由、意图识别、元素选择 |
| **Noul** | 是非判断 | `noul`（0~1 校准概率） | 风控拦截、是否升级、是否需要人工 |
| **Score** | 有序区间打分 | `score`（期望分，可为小数）+ `legend` + `probabilities` | 紧急度、意向度、流失风险、质量评分 |

三者都返回**完整的概率分布**，而不只是一个答案——这是 Jev 与"让 LLM 输出一个标签"最本质的区别。

---

## 一、Choice：有限单选枚举

### 语义

从一组**预先命名的标签**中选出一个。标签数量上限为 **255**。

### SDK 写法

```ts
import { choice } from '@typesafe-ai/sdk';

const category = choice('What is this ticket about?', {
  billing: 'Payment, invoice, refund or charge issues.',
  technical: 'Bugs, crashes, errors or broken features.',
  account: 'Login, password, profile or permission issues.',
  other: null, // 描述可以传 null —— 表示"不给额外说明"
});
```

第一个参数是问题本身（`instructions`），第二个参数是 `标签 → 描述` 的映射（`criteria`）。

### 返回结构

```ts
const res = await client.systemOne({
  state: 'I was charged twice for the same order.',
  questions: { category },
});

res.answers.category;
// {
//   type: 'choice',
//   choice: 'billing',            // ← 命中项（字符串字面量，TypeScript 会推导出联合类型）
//   confidence: 0.97,             // ← 对命中项的置信度
//   probabilities: {              // ← 完整概率分布，各项之和为 1
//     billing: 0.97,
//     technical: 0.01,
//     account: 0.01,
//     other: 0.01,
//   },
// }
```

### 工程要点

- **`confidence` 是设置阈值的关键**。生产环境不要无条件信任 `choice`，而是：

  ```ts
  const { choice: label, confidence } = res.answers.category;
  if (confidence < 0.85) {
    // 低置信度 → 降级到人工，或升级给更贵的通用 LLM
  }
  ```

- **标签描述（description）显著影响准确率**。写清每个标签的边界，尤其是容易混淆的相邻标签（如 `billing` vs `refund`）。传 `null` 只适合含义不言自明的标签。
- **超过 255 项怎么办？** 官方给出的方案是**两阶段流程**：先用 `score` 把候选粗筛到一小组，再用 `choice` 在小集合里做精确选择。不要试图塞进 300 个标签。

### 反模式

:::danger[不要这样用]
- ❌ 把 Choice 当"多选题"用——它**只能选一个**。需要多标签请定义多个独立的 `noul` 问题。
- ❌ 用 Choice 输出自由文本——标签必须是你预先定义的固定集合。
- ❌ 忽略 `probabilities` 只取 `choice`——概率分布才是做阈值与降级决策的依据。
:::

---

## 二、Noul：是非判断（校准概率）

### 语义

回答一个**是 / 否**问题，输出 `0 ~ 1` 之间的**真值校准概率**。

关键在于**校准（calibrated）**：如果模型说"70% 是"，那么在大量同类样本中，实际确实约有 70% 为真。这意味着返回的数值可以直接参与阈值判断，而不是一个无法解释的分数。

### SDK 写法

```ts
import { noul } from '@typesafe-ai/sdk';

// 最简形式：只给问题
const isSpam = noul('Is this message spam or promotional noise?');

// 完整形式：额外描述"真 / 假"各自的含义，帮助模型校准
const isUrgent = noul('Does this require immediate human attention?', {
  true: 'Customer is blocked, losing money, or at churn risk.',
  false: 'Can be handled in the normal queue.',
});
```

`criteria` 是可选参数，含 `true` / `false` 两个字段，都可以是文本、JSON 对象或数组。

### 返回结构

```ts
res.answers.isUrgent;
// {
//   type: 'noul',
//   noul: 0.82,   // ← 0~1 的"是"的概率，已做真值校准
// }
```

注意：**Noul 不返回 `confidence`**，因为概率本身就是全部信息。

### 工程要点

- **天然适合做守门员（Guardrail）**。这是 Jev 最有价值的用法——在调用昂贵模型或执行敏感动作之前先问一句：

  ```ts
  // 1) 先花 70ms、零输出成本判断这条消息值不值得处理
  const spam = await client.systemOne({
    state: { document: msg },
    questions: { isSpam: noul('Is this spam or pure chitchat?') },
  });

  // 2) 只有非垃圾消息才唤起通用 LLM（贵的那个）
  if (spam.answers.isSpam.noul < 0.8) {
    await expensiveLLM(msg);
  }
  // → 约 80% 的垃圾流量在这条线之前就被拦下了
  ```

  > 注：这里用 `< 0.8` 而非 `< 0.5` —— Jev 给的是**校准概率**，你可以按业务误杀/漏放的代价来自由选阈值，而不是死守 0.5。

- **阈值应当由业务代价决定**：误杀的代价高 → 调高阈值；漏放的代价高 → 调低阈值。

### 反模式

:::danger[不要这样用]
- ❌ 用 Noul 做三分类——它是二值的。三分类请用 `choice`。
- ❌ 把 `0.5` 当作唯一分界线——校准概率的意义就在于你可以按代价函数选阈值。
:::

---

## 三、Score：有序区间打分

### 语义

按一个**有序的评分标准（rubric）**打分，输出**期望分值**。评分标准从 **0** 开始编号，至少需要两项。

与 Choice 的区别：Choice 的标签是**无序**的（billing 和 technical 谁在前都行），Score 的档位**有严格顺序**，且返回的 `score` 是期望值，**可能落在两个整数档位之间**（例如 `3.4`）。

### SDK 写法

```ts
import { score } from '@typesafe-ai/sdk';

// 第二个参数是【从 0 开始编号】的档位描述数组，至少两项
const priority = score('How urgent is this ticket?', [
  'No action needed.',                 // 0
  'Low — handle within a week.',       // 1
  'Medium — handle within 2 days.',    // 2
  'High — handle within 24 hours.',    // 3
  'Critical — drop everything now.',   // 4
]);
```

数组下标即分数档位，描述项可以是文本、JSON 对象或数组。

### 返回结构

```ts
res.answers.priority;
// {
//   type: 'score',
//   score: 3.4,                    // ← 期望分，可以是小数
//   confidence: 0.88,              // ← 对该分数的置信度
//   legend: {                      // ← 你传入的档位描述，按分数回显
//     0: 'No action needed.',
//     1: 'Low — handle within a week.',
//     2: 'Medium — handle within 2 days.',
//     3: 'High — handle within 24 hours.',
//     4: 'Critical — drop everything now.',
//   },
//   probabilities: {               // ← 每个档位的概率
//     0: 0.01,
//     1: 0.03,
//     2: 0.11,
//     3: 0.62,
//     4: 0.23,
//   },
// }
```

### 为什么返回小数而不是整数？

因为 `3.4` 比 `3` 携带更多信息：它说明模型认为"介于 High 与 Critical 之间，偏向 High"。这个连续量非常适合：

- **排序**（按紧急度给队列排序）
- **加权计算**（`意向度 × 客单价` 得到预期收益）
- **动态阈值**（Top 10% 自动升级，无需固定 cutoff）

### 工程要点

- **档位描述要写出"可判定的边界"**。反面例子：`['低', '中', '高']` —— 模型无从判断"中"和"高"的界线在哪。正面例子：把时间/金额/后果写进描述里。
- **需要"意向度"这类连续指标时，Score 优于 Choice**：Choice 只能给你 `high/medium/low` 三档，Score 给你 `2.7`，后者可直接参与数值运算。

### 反模式

:::danger[不要这样用]
- ❌ 档位少于 2 项——SDK 会抛 `TypeSafeError`（服务端则返回 422）。
- ❌ 把无序标签塞进 Score——顺序即语义，顺序错了分数就失去意义。
- ❌ 只取 `score` 而丢掉 `probabilities`——当分布很平坦（如各档位都接近 0.25）时，说明模型其实拿不准，此时应当降级处理。
:::

---

## 组合使用：一次请求，多个决策

三种类型可以**在同一个请求里混用**，共享同一份 `state`，一次往返全部拿到答案：

```ts
const res = await client.systemOne({
  state: { document: ticketBody, customer: { plan: 'pro', tenureMonths: 26 } },
  questions: {
    category: choice('What is this about?', { billing: null, technical: null, other: null }),
    isUrgent: noul('Does this need immediate human attention?'),
    priority: score('How urgent?', ['None', 'Low', 'Medium', 'High', 'Critical']),
    churnRisk: score('How likely is this customer to churn?', [
      'No risk',
      'Slight risk',
      'Moderate risk',
      'High risk',
      'Already gone',
    ]),
  },
});

// 全部答案都带完整类型推导
res.answers.category.choice;   // 'billing'
res.answers.isUrgent.noul;     // 0.82
res.answers.priority.score;    // 3.4
res.answers.churnRisk.score;   // 1.2
```

**决策组合示例**——用多个原子信号合成一个工程动作：

```ts
const { category } = res.answers.category;
const urgent = res.answers.isUrgent.noul;
const priority = res.answers.priority.score;
const churn = res.answers.churnRisk.score;

if (urgent > 0.7 || priority >= 3.5) {
  await escalateToHuman(ticket);
} else if (churn > 2.5) {
  await routeToRetentionTeam(ticket);
} else {
  await autoReply(category);
}
```

这段 `if-else` 就是 Jev 的定位：**代码负责确定性的流转逻辑，Jev 负责提供快速直觉**。

---

## 下一步

- [系统一 vs 通用 LLM 对比](/primitives/comparison/) —— 判断某个任务到底该用哪种模型
- [SaaS / SCRM 决策实战](/ecosystem/saas-scrm/) —— 把这三个原子操作组装成生产级流水线
