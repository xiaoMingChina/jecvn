import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './evaluate.mjs';
const data = { labels: ['a', 'b'], cases: [
  { id: '1', group: 'x', expected: 'a' },
  { id: '2', group: 'y', expected: 'b' },
  { id: '3', group: 'y', expected: 'b' },
] };
test('失败和缺失保留在分母中', () => {
  const result = evaluate(data, [{ id: '1', label: 'a' }, { id: '2', error: 'timeout' }]);
  assert.equal(result.accuracy, 1 / 3);
  assert.equal(result.errors, 2);
  assert.deepEqual(result.byGroup.y, { total: 2, correct: 0 });
});
test('拒绝重复、未知 ID 以及非法标签，避免静默覆盖', () => {
  for (const predictions of [
    [{ id: '1', label: 'a' }, { id: '1', label: 'b' }],
    [{ id: '4', label: 'a' }], [{ id: '1', label: 'c' }],
    [{ id: '1', label: 'a', error: 'timeout' }],
  ]) assert.throws(() => evaluate(data, predictions));
});
test('错误预测和执行失败分别记录', () => {
  const result = evaluate(data, [{ id: '1', label: 'b' }, { id: '2', label: 'b' }, { id: '3', label: 'b' }]);
  assert.equal(result.correct, 2);
  assert.equal(result.errors, 0);
  assert.equal(result.rows[0].correct, false);
});
