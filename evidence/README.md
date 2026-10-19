# Measured evidence

Captured October 19, 2026 against the dedicated remote Cloudflare D1 demo database. No customer data.

`spike-remote-1.json` through `spike-remote-3.json` contain raw Wrangler results. In each run, the indexed query read 20 rows and the unindexed query read 1,100; both returned the same ordered 20 records. Bidirectional `EXCEPT` queries found zero differences between the complete fixture tables.

The UI-compatible reports are in [`public/reports`](../public/reports). They contain full bounded results, SQL, parameters, metadata, query plans, fixture identity, timestamps and Worker version IDs. The CLI validates this demo's report contract and recomputes decisions.

The snapshot used to seed the database has 1,000 rows in each table across 10 merchants. Its canonical SHA-256 is `37ac57dfb3cf24b7be3f1b9e4e08617f018957cc02d68ed0d610ff0bcbf038fe`. The seed hash is checked by tests. The database manifest identifies the seeded fixture; it is not a continuously recomputed content checksum. Deployment verification establishes table equality, and public endpoints cannot mutate the data.

The initial remote seed ran 30 statements and reported 8,018 rows read and 3,014 written, separate from the SELECT measurements. Local Wrangler measurements matched the read counters, but are not used as proof of remote behavior.

Timings can vary. The 55× observed read ratio is specific to this fixture and query, not a promise about all D1 workloads. Saved report contents can be edited; the validator is not a provider signature verifier.
