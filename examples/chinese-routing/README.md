# 中文提问分流：本地评估基线

状态：规则基线已运行，Jev 模型未运行。16 条原创合成教学样例，不是真实用户记录或独立测试集。

Node.js 22.12+，无额外依赖、无网络请求：

```sh
node examples/chinese-routing/evaluate.mjs
node --test examples/chinese-routing/evaluate.test.mjs
```

`baseline-report.json` 是关键词规则的可复现结果。报告带有数据 SHA-256。数据与规则同时设计，9/16 的结果仅用于教学，不代表总体准确率。

外部预测格式及误判分析见 [社区实践文章](https://jevcn.com/lab/chinese-routing/)。传入预测 JSON 路径可生成 `report.local.json`；缺失与请求失败计入分母。原始响应、提示、SDK 和实际模型版本应另外保留，并在投稿前脱敏。

本目录的原创代码与合成数据由 JevCN 以 CC0-1.0 贡献至公共领域；该声明不适用于仓库其他文件或外部资料。许可文本：https://creativecommons.org/publicdomain/zero/1.0/legalcode
