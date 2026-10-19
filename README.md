# D1 Query Budget

**Same results. Very different database work.**

[Live experiment](https://d1.bhavyakumar.ca) · [How it works](docs/architecture.md) · [Measured evidence](evidence/README.md)

A TypeScript experiment that measures Cloudflare D1 row reads, checks full result correctness, and rejects queries that exceed a declared budget. Run three scenarios in the browser, inspect the SQL and query plans, then download a report and verify it with the CLI.

| Actual remote D1 run | Baseline reads | Candidate reads | Result |
| --- | ---: | ---: | --- |
| Missing composite index | 20 | 1,100 | Same 20 orders; budget exceeded |
| Unchanged query | 20 | 20 | Same orders; passes |
| `LIMIT 20` changed to `LIMIT 1` | 20 | 1 | Cheaper, but incorrect; rejected |

Measured October 19, 2026 on 1,000 synthetic orders across 10 merchants. The missing-index comparison reproduced across three remote runs. These are rows read, **not claimed cost savings or production performance**. The 100-row limit is an explicit testing policy, chosen to give the indexed fixture 5× headroom.

## Try it

1. Open the [demo](https://d1.bhavyakumar.ca).
2. Run **Missing index**. Both versions return the same orders, but the unindexed query exceeds the budget.
3. Run **Unchanged query** to see the passing control.
4. Run **Cheap but wrong** to see why fewer reads alone cannot earn a pass.
5. Expand the evidence or download the JSON report.

Recorded runs are available without querying D1; the UI labels their original capture time explicitly. Live requests are throttled to protect the Free-plan demo.

## Run locally

Requires Node.js 24+ and npm. No Cloudflare login is needed for local development or tests.

```sh
npm ci
npm run seed:local
npm run dev
```

Open the localhost URL printed by Wrangler. Local measurements are labeled **LOCAL EMULATOR**; they are not described as remote D1 measurements.

```sh
npm run typecheck
npm test
npm run check -- public/reports/unchanged.json
npm run check -- public/reports/missing-index.json
```

The checker exits **0** for pass, **1** for a rejected comparison, and **2** for an invalid or incomplete report. The missing-index command deliberately exits 1. It recomputes correctness and the budget decision from the result arrays and counters; exported verdict flags are ignored.

## Deploy your own

1. Log in with `npx wrangler login`.
2. Create your own dedicated database with `npx wrangler d1 create d1-query-budget-demo`.
3. Replace `database_id` in `wrangler.jsonc` with **your** new database ID. Remove `routes` to use only your workers.dev address, or replace its hostname with a domain in your Cloudflare account. Choose a unique Worker name and rate-limiter namespace if needed.
4. Run `npm run seed:remote`, then `npm run deploy`.

**Seed only the dedicated demo database.** The seed script replaces its three fixture tables. Never target a production database. Seeding uses roughly 3,014 written rows in our captured setup, plus reads. Account allowances are shared; check your available Free-plan limits before seeding repeatedly. No paid product is required.

The repository's recorded examples are this project's historical captures. After deploying your copy, capture your own reports if you want examples reflecting your deployment.

## What CI proves

CI installs dependencies, typechecks, tests decision logic and endpoint boundaries, validates the CLI against captured reports, and performs a dry-run Worker build. It uses no Cloudflare credentials.

**This first release compares predefined scenarios and verifies saved reports. It does not automatically benchmark arbitrary PR SQL/schema changes.** General query catalogs and remote pre-merge comparisons are future work.

## Design choices and limits

- Fixed parameterized SELECT queries; no arbitrary visitor SQL, public migrations, or user database credentials.
- Identical deterministic table contents, stable ordering, known expected results and seed hash.
- Full bounded result arrays are compared, not just counts. Correctness applies to these fixtures, not all possible inputs.
- Raw D1 counters decide the budget; query-plan text only helps explain it.
- Indexes improve this read workload but add write and storage work.
- The shared limiter is approximate and per Cloudflare location, not a global spending cap. Free quota exhaustion returns an error; no saved result is substituted silently.
- Captured JSON is reproducible evidence, not a cryptographically signed provider attestation.
- Only synthetic data. No ToadEx code or customer records are used.

## Repository map

- `src/worker.ts` — bounded measurement endpoint and error handling.
- `src/evaluate.ts` — report validation, correctness and budget evaluation.
- `src/fixture.ts`, `src/scenarios.ts` — deterministic data and fixed SQL catalog.
- `scripts/seed.ts`, `scripts/check.ts` — seed generation and report CLI.
- `public/` — dependency-free interface and captured remote reports.
- `tests/` — behavior, request-boundary and CLI checks.
- `research/` — source-backed user and competitor research; hypotheses are labeled.

Built by [Bhavya Kumar](https://bhavyakumar.ca). Independent project, not affiliated with or endorsed by Cloudflare.
