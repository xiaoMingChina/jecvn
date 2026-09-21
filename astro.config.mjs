// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	site: 'https://jevcn.com',
	vite: {
		build: {
			rolldownOptions: {
				onwarn(warning, warn) {
					// Astro 7 emits this internal marker for MDX asset propagation.
					// Ignore only its known bundler warning; retain all other diagnostics.
					if (
						warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
						warning.message.includes('use astro:head-inject') &&
						warning.message.includes('?astroPropagatedAssets')
					) return;
					warn(warning);
				},
			},
		},
	},
	integrations: [
		starlight({
			title: 'JevCN / 中文社区',
			customCss: ['./src/styles/custom.css'],
			components: { Hero: './src/components/Hero.astro' },
			description: '面向软件工程决策的 System 1 强类型毫秒级模型中文指南',
			favicon: '/favicon.svg',
			editLink: { baseUrl: 'https://github.com/xiaoMingChina/jevcn/edit/main/' },
			pagefind: true,
			// The content collection supplies our localized 404 page.
			disable404Route: true,
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
					href: 'https://github.com/xiaoMingChina/jevcn',
				},
				{
					icon: 'comment',
					label: '加入 Jev 中文社区',
					href: '/community/join/',
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
					label: '观察与实践',
					items: [
						{ label: 'Playground · 中文试验场', link: '/playground/' },
						{ label: 'Jev 中文观察', link: '/updates/' },
						{ label: '001 · 项目、评测与版本', link: '/updates/001/' },
						{ label: '实践 001 · 中文提问分流', link: '/lab/chinese-routing/' },
					],
				},
				{
					label: '生态资料库',
					items: [
						{ label: '全球项目精选', link: '/ecosystem/showcase/' },
						{ label: '排行榜与资源导航', link: '/ecosystem/rankings/' },
						{ label: '公开评测怎么读', link: '/ecosystem/benchmarks/' },
						{ label: '中文实践路线', link: '/ecosystem/practices/' },
						{ label: '官方资料与动态', link: '/ecosystem/official/' },
					],
				},
				{
					label: '社区共建',
					items: [
						{ label: '加入中文社区', link: '/community/join/' },
						{ label: '贡献指南', link: '/community/contributing/' },
					],
				},
			],
		}),
	],
});
