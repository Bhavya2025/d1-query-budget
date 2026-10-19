import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DATASET, fixtureRows } from '../src/fixture.ts';

const rows = fixtureRows();
const hash = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
const schema = '(order_id INTEGER PRIMARY KEY, merchant_id INTEGER NOT NULL, created_at INTEGER NOT NULL, total_cents INTEGER NOT NULL)';
// Dedicated fixture tables only. This script must never target a production database.
const statements = [
  'DROP TABLE IF EXISTS orders_indexed;',
  'DROP TABLE IF EXISTS orders_unindexed;',
  'DROP TABLE IF EXISTS fixture_manifest;',
  `CREATE TABLE orders_indexed ${schema};`,
  `CREATE TABLE orders_unindexed ${schema};`,
  'CREATE TABLE fixture_manifest (version TEXT NOT NULL, seed_hash TEXT NOT NULL, row_count INTEGER NOT NULL);',
];
for (let start = 0; start < rows.length; start += 50) {
  statements.push('INSERT INTO orders_indexed VALUES ' + rows.slice(start, start + 50)
    .map(r => `(${r.order_id},${r.merchant_id},${r.created_at},${r.total_cents})`).join(',') + ';');
}
statements.push(
  'INSERT INTO orders_unindexed SELECT * FROM orders_indexed;',
  'CREATE INDEX idx_merchant_recent ON orders_indexed(merchant_id, created_at DESC, order_id DESC);',
  `INSERT INTO fixture_manifest VALUES ('${DATASET.version}', '${hash}', ${rows.length});`,
  'ANALYZE;',
);
mkdirSync('.data', { recursive: true });
writeFileSync('.data/seed.sql', statements.join('\n') + '\n');
console.log(`Generated ${rows.length} identical synthetic rows per table. SHA-256: ${hash}`);
