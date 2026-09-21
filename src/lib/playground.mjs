export const API_URL = 'https://api.typesafe.ai/v1/systemone';
export const STORAGE_KEY = 'jevcn.playground.api-key.v1';
export const presets = {
  choice: { state: '不是安装问题，是运行时一直报错。', instructions: '将开发者提问分流；考虑否定表达。如果信息不足或多个诉求无法确定优先级，选择需要澄清。', criteria: { '环境接入': '安装、凭据或首次接入步骤', '故障反馈': '明确报告运行异常并寻求排查', '概念文档': '概念含义、机制或文档位置', '需要澄清': '信息不足、无具体任务或多个诉求无法确定优先级' } },
  noul: { state: '段落：Jev 的 Choice 在预先定义的候选项中进行选择。\n问题：Choice 是否需要提前给定候选项？', instructions: '段落是否包含回答问题所需要的证据？仅根据给定段落判断。', criteria: { true: '段落直接支持回答', false: '段落缺少相关信息或与问题无关' } },
  score: { state: '教程包含安装步骤和示例代码，但没有写明版本，也没有错误处理说明。', instructions: '根据提供的信息，评价教程的可复现程度。', criteria: ['无法判断如何运行', '只有思路，缺少具体步骤', '有步骤与代码，但环境或异常说明不完整', '环境、步骤与异常说明齐全'] },
};
export function makePayload({ type, model, state, instructions, criteria }) {
  if (!Object.hasOwn(presets, type)) throw new Error('请选择有效的问题类型。');
  if (!model.trim() || model.length > 100) throw new Error('请填写模型名称（最多 100 字符）。');
  if (!state.trim() || state.length > 20000) throw new Error('请填写输入状态（最多 20,000 字符）。');
  if (!instructions.trim() || instructions.length > 5000) throw new Error('请填写判断问题（最多 5,000 字符）。');
  if (criteria.length > 20000) throw new Error('评价标准最多 20,000 字符。');
  let parsed;
  try { parsed = JSON.parse(criteria); } catch { throw new Error('评价标准不是有效 JSON，请检查引号和逗号。'); }
  const object = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
  const description = value => value === null || typeof value === 'string';
  if (type === 'choice' && (!object || Object.keys(parsed).length < 2 || Object.keys(parsed).length > 50 || Object.keys(parsed).some(key => !key.trim()) || !Object.values(parsed).every(description))) throw new Error('Choice 请提供 2–50 个选项，描述使用文字或 null。');
  if (type === 'noul' && (!object || Object.keys(parsed).some(key => !['true', 'false'].includes(key)) || !Object.values(parsed).every(description))) throw new Error('Noul 标准只接受 true / false 字段，描述使用文字或 null。');
  if (type === 'score' && (!Array.isArray(parsed) || parsed.length < 2 || parsed.length > 10 || !parsed.every(value => typeof value === 'string'))) throw new Error('Score 请提供 2–10 项文字的数组，按低到高排列。');
  return { model: model.trim(), state, questions: { result: { type, instructions, criteria: parsed } } };
}
export function redact(text, secret) {
  return secret ? text.split(secret).join('[已隐藏密钥]') : text;
}
export async function requestDecision({ key, payload, signal, fetcher = fetch, endpoint = API_URL }) {
  if (!key.trim() || /[\r\n]/.test(key)) throw new Error('请填写有效的 API Key。');
  const response = await fetcher(endpoint, {
    method: 'POST', mode: 'cors', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer',
    headers: { Authorization: `Bearer ${key.trim()}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload), signal,
  });
  if (!response.ok) {
    // Do not display arbitrary upstream error bodies, which might echo credentials.
    const message = { 401: 'Key 无效或已失效。', 403: '权限不足或访问被拒绝。', 429: '已限流或额度受限，请稍后手动重试。', 422: '参数不符合模型要求，请检查标准或模型名称。' }[response.status] ?? '官方 API 返回错误，请稍后手动重试。';
    throw new Error(`HTTP ${response.status}：${message}`);
  }
  const data = await response.json();
  if (!data || typeof data !== 'object' || !data.answers || typeof data.answers !== 'object' || !data.answers.result) throw new Error('返回格式与预期不符，未作为成功结果展示。');
  return JSON.parse(redact(JSON.stringify(data), key.trim()));
}
