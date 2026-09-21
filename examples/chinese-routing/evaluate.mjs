import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// Intentionally simple baseline. No model API or network request is made.
export function baseline(text) {
  if (/安装|API key|环境/i.test(text)) return '环境接入';
  if (/报错|错误/.test(text)) return '故障反馈';
  if (/文档|概念/.test(text)) return '概念文档';
  return '需要澄清';
}

export function evaluate(dataset, predictions) {
  const ids = new Set(dataset.cases.map(item => item.id));
  if (ids.size !== dataset.cases.length || !ids.size) throw new Error('样例 ID 必须唯一且样例不能为空');
  const byId = new Map();
  for (const prediction of predictions) {
    if (!ids.has(prediction.id) || byId.has(prediction.id)) throw new Error(`未知或重复 ID：${prediction.id}`);
    if (prediction.error !== undefined && (typeof prediction.error !== 'string' || !prediction.error.trim())) throw new Error('error 必须为非空文字');
    if (prediction.error && prediction.label !== undefined) throw new Error('不能同时提供 label 与 error');
    if (!prediction.error && !dataset.labels.includes(prediction.label)) throw new Error(`无效标签：${prediction.id}`);
    byId.set(prediction.id, prediction);
  }
  const rows = dataset.cases.map(item => {
    if (!dataset.labels.includes(item.expected)) throw new Error(`无效预期标签：${item.id}`);
    const prediction = byId.get(item.id);
    const error = prediction?.error ?? (!prediction ? '缺失预测' : null);
    const actual = error ? null : prediction.label;
    return { ...item, actual, error, correct: !error && actual === item.expected };
  });
  const correct = rows.filter(item => item.correct).length;
  return {
    total: rows.length, correct, accuracy: correct / rows.length,
    errors: rows.filter(item => item.error).length,
    byGroup: Object.fromEntries([...new Set(rows.map(item => item.group))].map(group => {
      const subset = rows.filter(item => item.group === group);
      return [group, { total: subset.length, correct: subset.filter(item => item.correct).length }];
    })),
    rows,
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) throw new Error('用法：node evaluate.mjs [predictions.json]');
  const raw = await readFile(new URL('./cases.json', import.meta.url), 'utf8');
  const dataset = JSON.parse(raw);
  const run = args[0] ? JSON.parse(await readFile(args[0], 'utf8')) : {
    metadata: { engine: 'keyword-baseline-v1', model: null, description: '本地关键词规则，未调用 Jev' },
    predictions: dataset.cases.map(item => ({ id: item.id, label: baseline(item.text) })),
  };
  if (typeof run.metadata?.engine !== 'string' || !run.metadata.engine.trim() || !Array.isArray(run.predictions)) throw new Error('需要 metadata.engine 和 predictions 数组');
  const report = {
    datasetVersion: dataset.version,
    datasetSha256: createHash('sha256').update(raw).digest('hex'),
    metadata: run.metadata,
    ...evaluate(dataset, run.predictions),
  };
  // External results stay local; only the reproducible baseline is published.
  const output = new URL(args[0] ? './report.local.json' : './baseline-report.json', import.meta.url);
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.metadata.engine}: ${report.correct}/${report.total} (${(report.accuracy * 100).toFixed(2)}%), 失败/缺失 ${report.errors}`);
  console.log(`报告：${output.pathname}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
