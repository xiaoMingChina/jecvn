import { presets } from './playground.mjs';

// Original, fictional learning scenarios. No expected model scores or API responses.
export const examples = [
  { id: 'dumpling', group: '趣味判断', type: 'noul', icon: '🥟', title: '汤圆算不算甜点？', description: '换一个定义，判断会变吗？', tip: '把“甜口小食”改成“饭后食用”，或将芝麻馅改成鲜肉馅，比较判断变化。没有预设标准答案。', state: '一碗黑芝麻馅汤圆，煮熟后带着汤一起吃。今天把它当早餐，没有在正餐后食用。', instructions: '按照本次定义，这碗汤圆是否属于甜点？只按给定标准判断。', criteria: { true: '以甜味为主要特征的小食，不要求饭后食用', false: '不以甜味为主要特征，或不属于小食' } },
  { id: 'outing', group: '趣味判断', type: 'choice', icon: '🌦️', title: '下雨天去哪儿玩？', description: '在几个有限选项里找合适去处。', tip: '删除“怕淋雨”或加入“图书馆今天闭馆”，看看选项如何变化。这里只判断文字，不查询实时天气或营业时间。', state: '周末想出门两小时。外面在下雨，我怕淋雨，喜欢安静，暂时不想花钱。附近图书馆免费开放，美术馆需要买票。', instructions: '根据这些偏好选择一个最合适的去处，只使用已提供信息。', criteria: { '图书馆': '免费、室内、适合安静阅读', '美术馆': '室内看展，需要购票', '公园散步': '户外活动，需要接受淋雨', '先问清楚': '没有足够信息来比较选项' } },
  { id: 'cat-poem', group: '趣味判断', type: 'score', icon: '🐈', title: '猫写的诗，有多像诗？', description: '评分标准比一个分数更重要。', tip: '把标准改成“节奏”“画面感”或“叙事完整度”，观察同一文本在不同标准下的得分。评分是主观练习。', state: '窗台是一艘船，\n我把尾巴收成帆。\n太阳走了，\n罐头还没有靠岸。', instructions: '按画面与意象的连贯程度评价这段虚构小诗，不评价作者身份。', criteria: ['没有可辨认的画面', '有孤立意象，联系较弱', '多个意象有联系，但部分跳跃', '多个意象形成连贯画面'] },
  { id: 'sarcasm', group: '趣味判断', type: 'noul', icon: '🙃', title: '“你可真快”是在夸我吗？', description: '同一句话，换个上下文。', tip: '将“等了两小时”改成“刚发消息就到了”，观察上下文如何影响判断。这是语气判断，不是对真实人物心理的定论。', state: '约好下午两点见面，对方四点才到。等候者说：“你可真快啊，我都快把这条街逛完了。”', instructions: '结合上下文，这句话是否在真诚称赞对方到达及时？', criteria: { true: '上下文支持真诚称赞及时到达', false: '上下文更支持反讽、抱怨或不构成称赞' } },
  { id: 'routing', group: '开发实践', type: 'choice', icon: '🧭', title: '中文提问该交给谁？', description: '别让“不是安装问题”命中安装。', tip: '试试否定、中英混写或多个诉求。可与实践 001 的关键词规则进行比较，不预设模型一定更好。', ...presets.choice },
  { id: 'evidence', group: '开发实践', type: 'noul', icon: '🔎', title: '这段材料能回答问题吗？', description: '给检索结果做一次证据检查。', tip: '把段落替换成只有关键词、却没有答案的文字，检查判断是否只靠词语匹配。', ...presets.noul },
  { id: 'tutorial', group: '开发实践', type: 'score', icon: '🧪', title: '这份教程能跑起来吗？', description: '按明确标准评价复现信息。', tip: '补上依赖版本、命令与预期输出，然后再运行。分数不能替代实际执行教程。', ...presets.score },
  { id: 'issue', group: '开发实践', type: 'choice', icon: '🏷️', title: '给 Issue 贴什么标签？', description: '区分故障、功能请求和文档问题。', tip: '将“希望增加导出”改成“已有导出按钮点了没反应”，比较功能请求与故障反馈。', state: '当前只能在页面查看结果。我希望增加下载 JSON 的按钮，便于记录实验。目前页面本身能正常使用。', instructions: '为这条虚构项目反馈选择主要标签。如果意图不明确，先澄清。', criteria: { '功能建议': '请求新增或增强能力', '故障反馈': '已有功能未按预期工作', '文档问题': '说明缺失、错误或难以理解', '需要澄清': '无法判断主要诉求' } },
  { id: 'release-note', group: '开发实践', type: 'score', icon: '📝', title: '更新说明讲清楚了吗？', description: '让评价标准变成可操作的反馈。', tip: '加入“影响哪些用户、如何迁移、如何回退”，比较说明是否更完整。这不验证发布内容的真实性。', state: '本次发布优化了性能，修复若干问题，建议升级。', instructions: '只按文本包含的信息，评价这份虚构更新说明的可操作性。', criteria: ['只有笼统表述，无法判断影响', '写明变化，但缺少适用范围', '写明变化及影响范围，缺少操作步骤', '写明变化、影响与迁移或处理步骤'] },
];
