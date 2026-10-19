import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DATASET, fixtureRows, expectedOrders } from '../src/fixture.ts';
import { evaluate, type Report } from '../src/evaluate.ts';
import { BASELINE_SQL, candidateSQL, ROW_BUDGET, type Scenario } from '../src/scenarios.ts';

function sample(scenario: Scenario = 'unchanged'): Report {
  const observation = { sql: BASELINE_SQL, params: [1], results: expectedOrders(), meta: { rows_read: 20, rows_written: 0 }, plan: [] };
  return { version: 1, scenario, measuredAt: '2026-10-19T20:00:00.000Z', mode: 'local', revision: 'test-fixture', dataset: DATASET,
    policy: { maxRowsRead: ROW_BUDGET }, baseline: structuredClone(observation),
    candidate: { ...structuredClone(observation), sql: candidateSQL(scenario) } };
}
test('fixture hash pins all synthetic rows', () => assert.equal(createHash('sha256').update(JSON.stringify(fixtureRows())).digest('hex'), DATASET.seedHash));
test('unchanged results within budget pass', () => assert.equal(evaluate(sample()).status, 'pass'));
test('equal results over budget fail with measured ratio', () => {
  const r = sample('missing-index'); r.candidate.meta.rows_read = 1100;
  assert.deepEqual([evaluate(r).code, evaluate(r).readRatio], ['budget-exceeded', 55]);
});
test('cheaper wrong result fails', () => {
  const r = sample('wrong-result'); r.candidate.results = r.candidate.results.slice(0, 1); r.candidate.meta.rows_read = 1;
  assert.equal(evaluate(r).code, 'results-changed');
});
test('equal length but changed content fails', () => {
  const r = sample(); r.candidate.results[0].total_cents++; assert.equal(evaluate(r).code, 'results-changed');
});
test('result ordering matters; object key order does not', () => {
  const r = sample(); r.candidate.results.reverse(); assert.equal(evaluate(r).status, 'fail');
  r.candidate.results = expectedOrders().map(({ total_cents, created_at, merchant_id, order_id }) => ({ total_cents, created_at, merchant_id, order_id }));
  assert.equal(evaluate(r).status, 'pass');
});
test('empty or incorrect baselines do not pass by matching candidates', () => {
  const r = sample(); r.baseline.results = []; r.candidate.results = []; assert.equal(evaluate(r).status, 'error');
  const s = sample(); s.baseline.results[0].order_id++; s.candidate.results = structuredClone(s.baseline.results); assert.equal(evaluate(s).status, 'error');
});
for (const bad of [undefined, null, -1, NaN, Infinity, '20', 1.5]) {
  test(`invalid counter ${String(bad)} returns error`, () => {
    const r = sample(); (r.candidate.meta as Record<string, unknown>).rows_read = bad; assert.equal(evaluate(r).status, 'error');
  });
}
test('nonzero writes are rejected', () => { const r = sample(); r.candidate.meta.rows_written = 1; assert.equal(evaluate(r).status, 'error'); });
test('zero baseline cannot produce Infinity', () => { const r = sample(); r.baseline.meta.rows_read = 0; assert.equal(evaluate(r).readRatio, null); });
test('budget boundary is inclusive', () => {
  const r = sample(); r.candidate.meta.rows_read = ROW_BUDGET; assert.equal(evaluate(r).status, 'pass');
  r.candidate.meta.rows_read++; assert.equal(evaluate(r).status, 'fail');
});
test('forged decision flags are ignored', () => {
  const r = sample('missing-index'); r.candidate.meta.rows_read = 1100;
  assert.equal(evaluate({ ...r, verdict: { status: 'pass' }, correct: true }).status, 'fail');
});
test('policy and dataset tampering return error', () => {
  const r = sample(); r.policy.maxRowsRead = 999999; assert.equal(evaluate(r).status, 'error');
  assert.equal(evaluate({ ...sample(), dataset: {} }).status, 'error');
});
test('local provider metadata cannot be labeled remote', () => {
  const r = sample(); r.mode = 'remote'; r.baseline.meta.served_by = 'miniflare.db'; assert.equal(evaluate(r).status, 'error');
});
test('unknown SQL, params, and provider-error payload rejected', () => {
  const r = sample(); r.candidate.sql = 'SELECT 1'; assert.equal(evaluate(r).status, 'error');
  const s = sample(); s.candidate.params = [2]; assert.equal(evaluate(s).status, 'error');
  assert.equal(evaluate({ error: 'unavailable' }).status, 'error');
});
