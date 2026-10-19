# D1 Query Budget — competition and user evidence

Research date: October 19, 2026. Planning only. No tools installed, accounts connected, people contacted, or application code written.

## Finding

The defensible project is a small, reproducible **pre-deployment query regression checker using measured D1 row reads and correctness checks**. Cost monitoring, query insights, optimization advice, and runtime budgets already exist. Do not pitch this as the first D1 cost tool or a hard billing cap.

## User evidence

These are self-reported public anecdotes, not audited incidents or interviews. They support a problem hypothesis, not evidence that these people would adopt our particular solution.

| Source | What the user actually reported/requested | Product implication (our inference) |
|---|---|---|
| [D1 bill went from $0 to $1,381 in 18 days](https://www.reddit.com/r/CloudFlare/comments/1v3env9/d1_bill_went_from_0_to_1381_in_18_days/) — July 22, 2026 | A frequent routing query lacked a composite index; they reported rising charges despite normal traffic and latency. Adding an index resolved their issue. | Check row reads separately from response time. Demonstrate an index removal with unchanged results. The amount is unverified; do not reuse it as savings our tool achieved. |
| [Cloudflare D1 Row Reads Pricing](https://www.reddit.com/r/CloudFlare/comments/1ncacre/cloudflare_d1_row_reads_pricing/) — September 9, 2025 | A developer described joins/filtering that scan thousands of rows to display 20 results, worries about crawler traffic, and difficult filter combinations. | Show rows returned alongside rows read. Test multiple parameters and data distributions rather than one convenient fixture. A query test cannot protect against arbitrary traffic volume. |
| [How are you monitoring D1 usage and Worker failures?](https://www.reddit.com/r/CloudFlare/comments/1wdmwpb/how_are_you_monitoring_d1_usage_and_worker/) — displayed as about one month old | Explicitly asks for simple alerts when a deployment causes 5–10× more writes; prefers a small solution over a large observability stack. A later comment prefers earlier database warnings. | Keep setup small and report changes in developer workflow. This is demand for post-release monitoring; pre-merge checks are our proposed complementary response, not the user's explicit feature request. Writes are relevant future scope, but need separate correctness/state comparison. |

## Existing capabilities and overlap

| Source | Verified published capability | Consequence for our scope |
|---|---|---|
| [Cloudflare D1 metrics and analytics](https://developers.cloudflare.com/d1/observability/metrics-analytics/) | Per-query row counts, dashboard/GraphQL analytics, and experimental `wrangler d1 insights` with query cost/performance metrics already exist. Bound parameter values are not captured in insights. | Do not build another generic expensive-query dashboard. Use query-response metadata for controlled experiments; query catalog fixtures must supply representative parameters. |
| [littlebearapps/cf-monitor](https://github.com/littlebearapps/cf-monitor) | Repository documents runtime binding instrumentation, D1 usage, per-invocation budgets, daily/monthly budgets, circuit breakers, and cost spike monitoring. This was README research, not an implementation audit. | Avoid promising a novel runtime spending shield. Our distinction is baseline/candidate comparison before release, without instrumenting production handlers. Its safety/performance claims were not independently tested. |
| [dennisklappe/cf-ledger](https://github.com/dennisklappe/cf-ledger) | Repository documents per-application cost attribution from Cloudflare analytics, daily snapshots, and a hosted/self-hosted dashboard. It explicitly documents estimation limits. | A general billing dashboard is not distinctive. Keep our primary metric measured row usage, not estimated monthly dollars. |
| [huifer/CloudSaver](https://github.com/huifer/CloudSaver) | Repository advertises agent skills for D1 cost optimization, indexing/query rewriting, and CLI cloud-usage inspection. README review confirms overlapping intent, not the efficacy of automated advice. | Avoid an LLM SQL-advice wrapper. Favor deterministic, inspectable checks and reproducible evidence. Do not cite its marketing savings percentages as verified results. |
| [FlareBell product guide](https://flarebell.dev/guides/d1-rows-read-spikes) | Developer's own page says the product is in development, plans D1 read/write monitoring with alerts, and says sign-ups are not open. | Treat as an adjacent planned product, not a mature deployed competitor. It further weakens any novelty claim around usage alerts. |

## Prior competitor claim requiring correction

[SkillMD lists “SQL Plan Audit” attributed to mizchi](https://skillmd.com/skills/mizchi/sql-plan-audit), dated September 17, 2026. It describes SQLite/D1 query-plan snapshots and CI comparisons. However, its linked primary path `https://github.com/mizchi/skills/tree/main/sql/plan-audit` could not be verified. Direct GitHub API and raw-file requests returned HTTP 404 on this research date:

- `https://api.github.com/repos/mizchi/skills/contents/sql/plan-audit`
- `https://raw.githubusercontent.com/mizchi/skills/main/sql/plan-audit/SKILL.md`

Therefore this is an **unverified secondary listing**, not a confirmed currently available tool. Do not make technical conclusions depend on it, and do not copy/install its contents. Its existence as a listing still argues against claiming query-plan CI itself is original. Absence from accessible search results does not prove no identical D1 regression checker exists.

## Recommendations derived from the evidence

**Deadline adjustment:** the user now has a few hours. First delivery should be a narrowly scoped live Worker + D1 demonstration with an indexed/unindexed pair of synthetic merchant-order tables, measured row reads, equivalent-result comparison, a shared policy evaluator, and a CLI checking a saved report. Offline CI tests can verify the evaluator and report contract. General query discovery, arbitrary repository integration, automatic remote CI provisioning, and custom catalogs come later. Present the first release as a demonstrator, not a fully integrated production regression service.

1. Make the first demo understandable in under a minute: same orders returned; different rows read; failing CI check; restored index; passing check.
2. Use synthetic merchant data with small and large merchants, missing-result cases, and stable timestamps. The user complaints suggest parameter/data sensitivity; coverage is still finite.
3. Show raw measurements, dataset size, parameters, query text, schema change, and execution mode. Distinguish local emulation from remote D1 measurements visibly.
4. Use both an absolute row-read limit and a relative regression threshold, with a documented tolerance. Ratios alone can make tiny changes look alarming. This is our design hypothesis, not a customer-validated threshold policy.
5. Include a deliberate “efficient but wrong results” case. A tool must never reward a query rewrite merely for doing less work.
6. Explain query-plan differences as evidence, not an automatic mandate to add indexes. Some scans are reasonable and indexes have write/storage tradeoffs.
7. Keep runtime monitoring, automatic index application, arbitrary SQL execution in the public demo, billing forecasts, and multi-cloud support outside the first version.

## Open validation questions

- Will target developers maintain a small query fixture catalog, or do they expect ORM integration? Unanswered.
- Is remote CI setup acceptable, and can a local mode provide trustworthy row counters? Requires a technical feasibility spike.
- Will realistic fixture preparation cost more effort than the tool saves? Unanswered; measure onboarding effort in a small external trial later.
- How should intentionally changed query results be reviewed? Default equivalence checking only covers intended-equivalent changes; require an explicit expectation update for changed behavior.
- Can this reliably catch meaningful regressions across D1 versions and changing optimizer plans? Requires repeatable experiments; do not promise deterministic cross-version plans.

Confidence: high that the underlying usage issue and native/adjacent tooling exist; medium that pre-deployment measured regression checks are useful; low that market demand, uniqueness, or adoption has been validated. No recruiter or Cloudflare endorsement was sought or obtained.
