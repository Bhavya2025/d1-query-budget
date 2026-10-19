# Release verification — October 19, 2026

- Public demo: https://d1-query-budget.bhavyakumar-bkb.workers.dev
- Public source: https://github.com/Bhavya2025/d1-query-budget
- First successful CI run: https://github.com/Bhavya2025/d1-query-budget/actions/runs/39324281511
- Typechecking and all 36 automated tests passed locally. CI also performs a dry-run Worker build without Cloudflare credentials.
- Three repeated remote D1 measurements reproduced 20 indexed reads versus 1,100 unindexed reads for the same 20 orders. Full-table bidirectional EXCEPT checks found no differences. Raw evidence is in evidence/.
- Live browser checks verified missing-index (budget failure), unchanged (pass), and wrong-result (correctness failure). All reported zero writes.
- The recorded-example control visibly labels the historical capture time. The mobile interface was inspected at 390 × 844, with no measured horizontal overflow; the viewport override was then reset.
- Live invalid-input requests were rejected. Automated endpoint tests additionally cover cross-origin requests, throttling, unexpected fields, bodies, methods, and provider errors.
- Report files and CLI exit codes were verified. The browser export button was exercised, but the automation download event timed out, so saving a file through that button is not independently confirmed. The same JSON remains inspectable in the page and the captured examples are available in public/reports/.
- The Cloudflare dashboard showed the Free plan. No plan upgrade was performed. The rate limiter is approximate and per location, not a global quota reservation.

![Desktop demo with a recorded remote measurement](../evidence/demo-desktop.jpg)

This release is a fixed-scenario demonstrator with a saved-report checker. It does not automatically benchmark arbitrary pull-request queries. The walkthrough is in demo-walkthrough.md.
