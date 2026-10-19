import { DATASET, expectedOrders, type Order } from './fixture.ts';
import { BASELINE_SQL, candidateSQL, isScenario, ROW_BUDGET, type Scenario } from './scenarios.ts';

export interface Observation {
  sql: string;
  params: number[];
  results: Order[];
  meta: { rows_read: number; rows_written: number; [key: string]: unknown };
  plan: unknown[];
}
export interface Report {
  version: 1;
  scenario: Scenario;
  measuredAt: string;
  mode: 'local' | 'remote';
  revision: string;
  dataset: typeof DATASET;
  policy: { maxRowsRead: number };
  baseline: Observation;
  candidate: Observation;
}
export interface Verdict {
  status: 'pass' | 'fail' | 'error';
  code: 'within-budget' | 'budget-exceeded' | 'results-changed' | 'invalid-report';
  message: string;
  resultsEqual: boolean | null;
  readRatio: number | null;
}

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const columns = ['order_id', 'merchant_id', 'created_at', 'total_cents'] as const;
function validDataset(value: unknown): boolean {
  return object(value) && Object.entries(DATASET).every(([key, expected]) => value[key] === expected);
}
function validRows(rows: unknown): rows is Order[] {
  return Array.isArray(rows) && rows.length <= 20 && rows.every(row => object(row) &&
    Object.keys(row).length === columns.length && columns.every(key => count(row[key])));
}
export function equalRows(left: Order[], right: Order[]): boolean {
  return left.length === right.length && left.every((row, i) => columns.every(key => row[key] === right[i][key]));
}
function validObservation(value: unknown, sql: string): value is Observation {
  return object(value) && value.sql === sql && Array.isArray(value.params) && value.params.length === 1 &&
    value.params[0] === 1 && validRows(value.results) && Array.isArray(value.plan) && value.plan.length <= 20 &&
    object(value.meta) && count(value.meta.rows_read) && count(value.meta.rows_written) && value.meta.rows_written === 0;
}

// Validate this demo's explicit contract, not arbitrary SQL or arbitrary report policies.
// Exported decision flags are intentionally ignored; all decisions are recomputed.
export function evaluate(input: unknown): Verdict {
  const invalid = (message: string): Verdict => ({ status: 'error', code: 'invalid-report', message, resultsEqual: null, readRatio: null });
  if (!object(input) || input.version !== 1 || !isScenario(input.scenario) ||
      !['local', 'remote'].includes(String(input.mode)) || typeof input.measuredAt !== 'string' ||
      !Number.isFinite(Date.parse(input.measuredAt)) || typeof input.revision !== 'string' || !input.revision ||
      !validDataset(input.dataset) ||
      !object(input.policy) || input.policy.maxRowsRead !== ROW_BUDGET) {
    return invalid('Report provenance, dataset, or policy is missing or does not match this demo.');
  }
  if (!validObservation(input.baseline, BASELINE_SQL) || !validObservation(input.candidate, candidateSQL(input.scenario))) {
    return invalid('Expected read-only query results and valid D1 counters for both versions.');
  }
  const { baseline, candidate } = input;
  if (input.mode === 'remote' && [baseline, candidate].some(o => String(o.meta.served_by).includes('miniflare'))) {
    return invalid('Local emulator measurements cannot be labeled remote.');
  }
  if (!equalRows(baseline.results, expectedOrders())) return invalid('Baseline does not match the known synthetic fixture. Reseed before comparing.');
  const readRatio = baseline.meta.rows_read > 0 ? candidate.meta.rows_read / baseline.meta.rows_read : null;
  const resultsEqual = equalRows(baseline.results, candidate.results);
  if (!resultsEqual) return { status: 'fail', code: 'results-changed', message: 'Cheaper is not correct: the candidate changed the returned orders.', resultsEqual, readRatio };
  if (candidate.meta.rows_read > ROW_BUDGET) return { status: 'fail', code: 'budget-exceeded', message: `Same results, but the candidate exceeds the ${ROW_BUDGET}-row read budget.`, resultsEqual, readRatio };
  return { status: 'pass', code: 'within-budget', message: 'The results match and the candidate stays within the row-read budget.', resultsEqual, readRatio };
}
