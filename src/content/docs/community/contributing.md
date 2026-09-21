---
title: 贡献指南
description: 为 JevCN 提交文档修正、中文示例与工程实践的步骤和检查清单。
---

感谢你帮助完善 Jev 中文文档！文字勘误、断链修复、可复现示例与实践案例都是有价值的贡献。

## 提交修改

1. 在 [GitHub Issues](https://github.com/xiaoMingChina/jevcn/issues) 搜索相关问题。较大的内容调整建议先说明目标，避免重复工作。
2. Fork [JevCN 仓库](https://github.com/xiaoMingChina/jevcn)，创建分支。也可以通过文档底部的“编辑此页”直接开始修改。
3. 修改 `src/content/docs/` 下的 Markdown 或 MDX 文件。新页面需要填写中文标题与描述，并在 `astro.config.mjs` 中添加合适的侧边栏入口。
4. 使用 Node.js 22.12.0 或更高的 22.x 版本，运行 `npm ci`、`npm run build`，再用 `npm run preview` 检查页面与搜索。
5. 向仓库的 `main` 分支提交 Pull Request，说明修改原因、涉及页面和验证结果。

## 内容与资源规范

- 使用清晰的中文，首次出现的专业术语可保留英文对照。
- 为产品能力、价格和性能数据注明来源与适用版本，区分测量结果和推测。
- 代码示例应可复现，不包含真实密钥、个人信息或客户数据。
- 页面内链接使用站内路径，例如 `/getting-started/quickstart/`。
- 静态图片放在 `public/images/`，使用 `/images/文件名` 引用，并提供有意义的替代文本。优先使用体积较小的 SVG 或 WebP，确认素材授权。
- 未准备好的资源使用提示文字，不引用不存在的图片。站点图标统一使用 `public/favicon.svg`。

遇到协作问题，可前往[社区交流页](/community/join/)查看反馈渠道。
