export const DATASET = { version: 'merchant-orders-v1', rowsPerTable: 1000, merchants: 10,
  seedHash: '37ac57dfb3cf24b7be3f1b9e4e08617f018957cc02d68ed0d610ff0bcbf038fe' } as const;

export type Order = { order_id: number; merchant_id: number; created_at: number; total_cents: number };

export function fixtureRows(): Order[] {
  return Array.from({ length: DATASET.rowsPerTable }, (_, i) => ({
    order_id: i + 1,
    merchant_id: (i % DATASET.merchants) + 1,
    created_at: 1735689600 + Math.floor(i / 3) * 60,
    total_cents: 500 + ((i * 137) % 15000),
  }));
}

export function expectedOrders(): Order[] {
  return fixtureRows().filter(row => row.merchant_id === 1)
    .sort((a, b) => b.created_at - a.created_at || b.order_id - a.order_id).slice(0, 20);
}
