export const SCENARIOS = [
  "missing-index",
  "unchanged",
  "wrong-result",
] as const;
export type Scenario = (typeof SCENARIOS)[number];
export const ROW_BUDGET = 100;

const select = "SELECT order_id, merchant_id, created_at, total_cents";
export const BASELINE_SQL = `${select} FROM orders_indexed WHERE merchant_id = ? ORDER BY created_at DESC, order_id DESC LIMIT 20`;
export function candidateSQL(scenario: Scenario): string {
  if (scenario === "missing-index")
    return BASELINE_SQL.replace("orders_indexed", "orders_unindexed");
  if (scenario === "wrong-result")
    return BASELINE_SQL.replace("LIMIT 20", "LIMIT 1");
  return BASELINE_SQL;
}
export function isScenario(value: unknown): value is Scenario {
  return typeof value === "string" && SCENARIOS.includes(value as Scenario);
}
