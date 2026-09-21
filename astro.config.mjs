// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://jevcn.com',
	integrations: [
		starlight({
			title: 'Jev 中文社区 (JevCN)',
			description: '面向软件工程决策的 System 1 强类型毫秒级模型中文指南',
			defaultLocale: 'root',
			locales: {
				root: {
					label: '简体中文',
					lang: 'zh-CN',
				},
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/cobanov/awesome-jev',
				},
			],
			sidebar: [
				{
					label: '快速开始',
					items: [
						{ label: '什么是 Jev (核心概念)', link: '/getting-started/introduction/' },
						{ label: '3 分钟上手 SDK', link: '/getting-started/quickstart/' },
					],
				},
				{
					label: '核心原子机制',
					items: [
						{ label: 'Choice / Noul / Score 原理', link: '/primitives/types/' },
						{ label: '系统一 vs 通用 LLM 对比', link: '/primitives/comparison/' },
					],
				},
				{
					label: '前沿生态与案例',
					items: [
						{ label: '全球开源项目收录 (Showcase)', link: '/ecosystem/showcase/' },
						{ label: 'SaaS / SCRM 决策实战', link: '/ecosystem/saas-scrm/' },
					],
				},
			],
		}),
	],
});
