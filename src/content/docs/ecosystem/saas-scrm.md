---
title: SaaS / SCRM 决策实战
description: 在 SaaS、SCRM 与跨境电商客户支持场景中，用 Jev 构建工单路由、风险打分与前置拦截三条生产级流水线。
---

本页是一个**落地指南**：不讲原理，只讲怎么把 Jev 装进一个真实的客户支持系统里。

场景设定：一个跨境电商 / SaaS 客服中台，每天收到数万条来自邮件、站内信、IM 与评论区的用户消息。团队已经接了通用 LLM 做自动回复，但账单和延迟都开始失控。

下面三条流水线可以独立上线，也可以叠成一条完整链路。

---

## 流水线一：垃圾与闲聊前置拦截（省下 80% 的昂贵调用）

### 问题

客服系统里大量消息是"谢谢"、"在吗"、"666"、营销广告、机器人灌水。这些消息**根本不需要**唤起通用 LLM——但如果不拦，每一条都在烧钱。

### 方案：用 `noul` 做第一道闸门

```ts
import { noul, TypeSafeClient } from '@typesafe-ai/sdk';

const client = new TypeSafeClient();

/** 前置拦截：返回 true 表示这条消息不值得进入后续昂贵流程 */
async function shouldDrop(text: string): Promise<boolean> {
  const res = await client.systemOne({
    state: { document: text },
    questions: {
      // 用 noul 描述清楚"什么算垃圾"，帮助模型校准
      isNoise: noul('Is this message spam, pure chitchat, or promotional noise?', {
        true: 'Ads, bot spam, greetings only ("hi", "在吗"), thanks-only, emoji-only, or content with no actionable request.',
        false: 'Contains a real question, complaint, order issue, or any request needing a human or system action.',
      }),
    },
  });

  // 校准概率 + 业务阈值：误杀真实用户的代价高，所以阈值取高一些
  return res.answers.isNoise.noul >= 0.8;
}

// —— 接入主流程 ——
if (await shouldDrop(msg)) {
  await archive(msg); // 归档，零 LLM 成本
} else {
  await expensiveLLM(msg); // 只有真实诉求才唤起系统二
}
```

### 收益

| 指标 | 拦截前 | 拦截后 |
| --- | --- | --- |
| 进入通用 LLM 的消息量 | 100% | ~20% |
| 前置判断耗时 | — | ~70ms |
| 前置判断输出成本 | — | **$0** |
| 前置判断输入成本 | — | 按 $0.042/MTok 计，可忽略 |

**约 80% 的昂贵 LLM 调用被消除**，而用户侧的感知延迟反而降低了——因为简单消息在 70ms 内就被确定性处理完了。

:::tip[阈值为什么要调高？]
`noul` 返回的是**校准概率**，不是"随便一个分数"。阈值应当由业务代价决定：误杀一个真实客户投诉的代价，远高于多放几条垃圾消息进去。所以这里取 `0.8` 而非 `0.5`。上线后请基于真实样本做一次阈值回归。
:::

---

## 流水线二：消息分类与智能工单路由（100ms 确定部门与风险）

### 问题

工单需要被分派到正确的部门（账单 / 技术 / 物流 / 账号……），并且要标出风险等级。人工分派慢且不一致。

### 方案：`choice` 定部门 + `score` 定紧急度 + `noul` 定风险

**一次请求拿到全部路由信号**，而不是串行调三次：

```ts
import { choice, noul, score, TypeSafeClient } from '@typesafe-ai/sdk';

const client = new TypeSafeClient();

interface Routing {
  department: string;
  urgency: number;
  needsHuman: boolean;
  confidence: number;
}

async function routeTicket(ticket: {
  body: string;
  plan: string;
  tenureMonths: number;
  ltvUsd: number;
}): Promise<Routing> {
  const res = await client.systemOne({
    // state 写成「简短、密集、信息量高」的结构化描述 —— 官方推荐的做法
    state: {
      document: ticket.body,
      customer: {
        plan: ticket.plan,
        tenureMonths: ticket.tenureMonths,
        lifetimeValueUsd: ticket.ltvUsd,
      },
    },
    questions: {
      // ① 部门路由：标签描述写清边界，尤其要区分易混淆的相邻类目
      department: choice('Which team should handle this ticket?', {
        billing: 'Payment failures, duplicate charges, invoices, refund requests.',
        technical: 'App crashes, bugs, errors, broken features, integration failures.',
        logistics: 'Shipping delays, lost packages, customs, delivery address changes.',
        account: 'Login, password reset, profile edits, permissions, account deletion.',
        other: 'None of the above, or genuinely ambiguous.',
      }),

      // ② 紧急度：有序档位，描述里写进可判定的时间边界
      urgency: score('How urgent is this ticket?', [
        'No action needed.',
        'Low — handle within a week.',
        'Medium — handle within 2 days.',
        'High — handle within 24 hours.',
        'Critical — customer is blocked or losing money now.',
      ]),

      // ③ 是否需要人工：高风险信号
      needsHuman: noul('Does this require a human agent rather than an automated reply?', {
        true: 'Legal threats, chargebacks, public complaints, safety issues, or an angry high-value customer.',
        false: 'Routine request that a templated or generated reply can resolve.',
      }),
    },
  });

  const { department, confidence } = res.answers.department;
  const { urgency } = res.answers;
  const { needsHuman } = res.answers;

  return {
    // 低置信度 → 落到人工分诊队列，而不是硬猜一个部门
    department: confidence >= 0.85 ? department : 'triage',
    urgency: urgency.score,           // 可能是 3.4 这样的连续值
    needsHuman: needsHuman.noul >= 0.6,
    confidence,
  };
}
```

### 用连续分数做优先级队列

`score` 返回的是**期望分而非整数档位**，这个细节在排序时非常有用：

```ts
const routing = await routeTicket(ticket);

// 用连续分数构建加权优先级，而不是粗暴的三档
const priorityScore =
  routing.urgency * 1.0 +
  (routing.needsHuman ? 2.0 : 0) +
  (ticket.ltvUsd > 1000 ? 1.5 : 0);

await queue.push(ticket, { priority: priorityScore, ...routing });
```

**为什么不直接人工写规则？** 因为规则会长成几百行脆弱的 `if-else`：`if (body.includes('退款') && plan === 'pro')`。Jev 的价值就在于把这类判断从"硬编码规则"变成"可校准的概率信号"，同时保留代码对确定性流转的控制权。

---

## 流水线三：买家差评与退单风险打分（Lead / Churn Scoring）

### 问题

在 SCRM / 跨境电商场景中，最值钱的能力是**在客户流失之前识别出来**。差评、退货、取消订阅都是"已经发生"的结果——你需要的是先导信号。

### 方案 A：Churn Scoring（流失风险打分）

```ts
import { noul, score, TypeSafeClient } from '@typesafe-ai/sdk';

const client = new TypeSafeClient();

async function scoreChurnRisk(customer: {
  recentMessages: string[];
  plan: string;
  tenureMonths: number;
  ltvUsd: number;
  daysSinceLastOrder: number;
}) {
  const res = await client.systemOne({
    state: {
      // state 可以传数组 —— 把最近的对话历史整体作为一段密集上下文
      recentMessages: customer.recentMessages.slice(-10),
      profile: {
        plan: customer.plan,
        tenureMonths: customer.tenureMonths,
        lifetimeValueUsd: customer.ltvUsd,
        daysSinceLastOrder: customer.daysSinceLastOrder,
      },
    },
    questions: {
      churnIntent: score('How likely is this customer to churn or cancel?', [
        'No signal of churn.',
        'Slight dissatisfaction, likely recoverable.',
        'Moderate risk — actively comparing alternatives.',
        'High risk — has mentioned cancelling, refunding or leaving.',
        'Already churning — requested cancellation or filed a dispute.',
      ]),

      // 用 noul 补充一个可解释的强信号
      hasNegativeSentiment: noul('Is the recent tone explicitly negative, angry or disappointed?'),
    },
  });

  const risk = res.answers.churnIntent.score;      // 例如 3.2
  const negative = res.answers.hasNegativeSentiment.noul; // 例如 0.88

  return {
    risk,
    // 组合信号：分数高 或 情绪明确负面
    shouldEscalate: risk >= 2.5 || negative >= 0.8,
    // 预期挽回价值 = 风险 × 客户价值，用于排优先级
    expectedLostValue: (risk / 4) * customer.ltvUsd,
  };
}
```

**关键点**：`expectedLostValue` 把概率信号和商业价值乘在一起，直接产出一个**可以排序、可以定 SLA 的金额**。这比"高风险/中风险/低风险"有用得多。

### 方案 B：Lead Scoring（销售意向度打分）

同一套模式换个 `state` 与问题即可用于获客侧：

```ts
const res = await client.systemOne({
  state: {
    conversation: leadMessages.slice(-15),
    firmographics: { companySize: lead.companySize, industry: lead.industry },
    behavior: { pageViews: lead.pageViews, pricingPageVisits: lead.pricingVisits },
  },
  questions: {
    intent: score('How strong is this lead’s purchase intent?', [
      'Browsing only, no signal.',
      'Researching — early stage.',
      'Evaluating — comparing vendors or features.',
      'Strong — asked about pricing, contracts or timelines.',
      'Ready to buy — requested a quote, demo or trial extension.',
    ]),
    isDecisionMaker: noul('Is the person speaking likely a decision maker or budget holder?'),
  },
});
```

### 方案 C：差评与退单前置干预

跨境电商最常见的损失是"买家留下差评或发起退单（chargeback）"。这类行为通常**在发生前有明确的语言先导信号**：

```ts
const res = await client.systemOne({
  state: { messages: buyerMessages.slice(-8), order: { amountUsd, daysSinceDelivery, status } },
  questions: {
    chargebackRisk: noul('Is this buyer likely to file a chargeback or dispute?', {
      true: 'Explicit threats to dispute, contact bank/PayPal, "never received", or repeated unresolved complaints about the same order.',
      false: 'Normal inquiry, or an issue that is being actively resolved.',
    }),
    dissatisfaction: score('How dissatisfied is this buyer?', [
      'Satisfied.',
      'Minor issue, easily resolved.',
      'Unhappy — waiting for a resolution.',
      'Very unhappy — threatening negative review.',
      'Furious — threatening dispute, chargeback or public complaint.',
    ]),
  },
});

if (res.answers.chargebackRisk.noul >= 0.6 || res.answers.dissatisfaction.score >= 3) {
  // 在差评/退单发生【之前】触发人工介入或补偿
  await triggerRetentionPlaybook(orderId);
}
```

**这正是 Jev 相对于"事后风控规则"的价值**：风控规则只能在退单发生后统计，而 Jev 能在对话文本里读出**尚未兑现的意图**。

---

## 完整链路：三条流水线的组装

```
                           用户消息
                              │
                              ▼
              ┌───────────────────────────────┐
  流水线一     │ Jev · noul   ~70ms  $0 out     │
  前置拦截     │ 是垃圾/闲聊吗？                │
              └───────┬───────────────┬───────┘
                      │ >= 0.8        │ < 0.8
                 归档丢弃          继续处理
                 （省 80% 成本）        │
                                        ▼
              ┌───────────────────────────────┐
  流水线二     │ Jev · systemOne  一次请求三答案 │
  分类路由     │ choice 部门 + score 紧急度      │
              │ + noul 是否需人工               │
              └───────┬───────────────┬───────┘
            conf>=.85 │               │ conf<.85
                      │            人工分诊队列
                      ▼
              ┌───────────────────────────────┐
  流水线三     │ Jev · score + noul             │
  风险打分     │ 流失风险 / 退单风险 / 意向度     │
              └───────┬───────────────┬───────┘
             高风险   │               │ 低风险
        ┌─────────────┘               └────────────┐
        ▼                                          ▼
  人工介入 / 挽回剧本                    【系统二】通用 LLM
  （在损失发生前）                        生成自动回复
```

**这条链路的核心特征**：通用 LLM 只在最后一步、只对约 20% 的消息、且在风险已被评估过之后才被唤起。前面所有判断都由 Jev 在百毫秒内以近乎零成本完成。

---

## 上线检查清单

- [ ] **阈值回归**：不要直接用 `0.5`。用一批真实标注样本，按业务代价（误杀 vs 漏放）选择每个 `noul` 的阈值。
- [ ] **置信度监控**：把 `choice.confidence` 与 `noul` 概率做时间序列监控。整体分布漂移 = 数据分布变化，是最早的预警信号。
- [ ] **降级路径**：`confidence < 阈值` 时必须有明确的兜底动作（转人工 / 升级模型），不能硬用低置信度结果。
- [ ] **限流与并发**：批量扇出时加并发上限（如 `p-limit`），并对 `RateLimitError` 的 `retryAfterMs` 做退避。
- [ ] **API Key 安全**：仅服务端持有 `TYPESAFE_API_KEY`，不要设 `dangerouslyAllowBrowser`。
- [ ] **`state` 写法**：保持简短、密集、结构化；把最近 N 条对话切片 + 关键业务字段一起放入，效果通常优于塞入完整历史。
- [ ] **标签描述质量**：`choice` 的每个标签都要写清边界，这直接决定准确率。

---

## 下一步

- [Choice / Noul / Score 原理](/primitives/types/) —— 回到原子操作细节
- [系统一 vs 通用 LLM 对比](/primitives/comparison/) —— 复核任务分工是否合理
- [全球开源项目收录](/ecosystem/showcase/) —— 看看别人怎么做的
