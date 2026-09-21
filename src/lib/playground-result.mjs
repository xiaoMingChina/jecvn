const probability = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
export function resultView(answer) {
  if (!answer || typeof answer !== 'object') return null;
  const confidence = probability(answer.confidence) ? answer.confidence : null;
  if (answer.type === 'noul' && probability(answer.noul)) return { headline: `“是”的概率 ${(answer.noul * 100).toFixed(1)}%`, confidence: null, rows: [['是', answer.noul], ['否', 1 - answer.noul]] };
  const entries = Object.entries(answer.probabilities ?? {}).filter(([, value]) => probability(value));
  if (answer.type === 'choice' && typeof answer.choice === 'string') return { headline: answer.choice, confidence, rows: entries.sort((a,b) => b[1]-a[1]) };
  if (answer.type === 'score' && Number.isFinite(answer.score)) return { headline: `评分 ${answer.score.toFixed(2)}`, confidence, rows: entries.sort((a,b) => Number(a[0])-Number(b[0])).map(([level,value]) => [`${level} · ${answer.legend?.[level] ?? '档位'}`,value]) };
  return null;
}
export function renderResult(container, answer) {
  container.replaceChildren();
  const view = resultView(answer);
  if (!view) { container.textContent = '此结果暂不支持图表，请展开原始 JSON。'; return; }
  const title = document.createElement('h3'); title.textContent = view.headline; container.append(title);
  for (const [label,value] of view.rows) {
    const row = document.createElement('div'); row.className = 'pg-probability';
    const name = document.createElement('span'); name.textContent = label;
    const number = document.createElement('strong'); number.textContent = `${(value*100).toFixed(1)}%`;
    const bar = document.createElement('progress'); bar.max = 1; bar.value = value; bar.setAttribute('aria-label', `${label}：${number.textContent}`);
    row.append(name,number,bar); container.append(row);
  }
  const note = document.createElement('p'); note.className = 'pg-help';
  note.textContent = view.confidence === null ? '概率代表模型判断，不等于事实正确率。' : `模型置信度 ${(view.confidence*100).toFixed(1)}% · 不等于正确率`;
  container.append(note);
}
