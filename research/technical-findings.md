# Technical findings

Research date: October 19, 2026. This document records documentation research, not completed experiments.

## Conclusions

The basic mechanism is documented and feasible enough to justify a short implementation spike. The hardest early question is whether our chosen queries produce useful, stable row-read differences on deployed D1. Prove that before polishing the interface.

The project should report measured work and correctness, not claimed dollar savings. A narrow public demonstration is achievable with much less infrastructure than a general regression service. Feasibility within the user's few-hours deadline remains conditional on authentication, toolchain readiness, and the first remote experiment.

## Verified facts and design implications

| Evidence | Implication for this project |
| --- | --- |
| [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/): reads, writes and storage contribute to usage. Free allowance is 5 million rows read and 100,000 rows written per day, shared at account level. Seeding and index creation consume usage too. | Begin with two 1,000-row tables; enlarge to 10,000 rows each only if needed and allowance permits. No paid upgrade. Avoid monthly-savings claims. |
| [D1 return objects](https://developers.cloudflare.com/d1/worker-api/return-object/): query results expose `rows_read`, `rows_written`, duration and execution metadata. SQL duration excludes network time. | Capture raw metadata with results and timestamp. Label elapsed HTTP time separately, if shown. Reject missing or invalid counters rather than treating them as zero. |
| [Index guidance](https://developers.cloudflare.com/d1/best-practices/use-indexes/): appropriate composite indexes reduce scanned rows; indexes also add write and storage work. | Demonstrate one controlled missing-index regression. Explain the read/write tradeoff. No automatic index creation in the public endpoint. |
| [D1 insights](https://developers.cloudflare.com/d1/observability/metrics-analytics/): dashboard, GraphQL and Wrangler already expose query analytics. | Differentiate through controlled comparisons and test decisions, not another monitoring dashboard. |
| [Local development](https://developers.cloudflare.com/d1/best-practices/local-development/): Wrangler/Miniflare provide local D1 simulation. | Local tests are useful for behavior. Public claims about deployed D1 require a remote run; local values must remain labeled local. |
| [SQLite query-plan documentation](https://www.sqlite.org/eqp.html): EXPLAIN output can change between releases. | Preserve raw plans as explanatory evidence. Decide pass/fail from validated metrics and result comparison, not brittle text parsing. |
| [D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/): parameter binding and result retrieval are supported. | Fix SQL on the server and bind allowed parameters; never accept visitor-provided SQL. |
| [Wrangler D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/): local and remote execution are distinct and JSON output is supported. | Make deployment and seeding targets explicit. Record tool version in captured evidence. |
| [D1 REST query API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/): REST query metadata includes read/write counters. | A direct remote CLI is possible future work. Do not build it alongside a Worker endpoint under this deadline. |
| [Free-plan limit enforcement](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/): queries fail at daily account limits. | Handle exhausted allowance visibly; never replace a failed live run with an unlabeled saved result. |
| [GitHub Actions security](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target): untrusted PR code must not execute with repository secrets. | Initial CI runs offline tests and saved-report checks without Cloudflare secrets. Remote CI for arbitrary contributions is deferred. |
| [Budget alerts](https://developers.cloudflare.com/billing/manage/budget-alerts/): alerts do not stop usage. | Do not describe our query thresholds or demo throttling as a billing cap. |

## Questions that require implementation, not more browsing

1. Does the indexed fixture use the intended index on remote D1, with equivalent ordered results?
2. Are counters present, finite and repeatable across three remote runs? Does index removal actually cross a sensible threshold?
3. Do local counters differ materially from remote counters? Keep modes distinct either way.
4. Can we deploy with the current account/toolchain without paying? Git currently hits an Xcode-license issue; GitHub CLI is installed and authenticated. No account settings were changed.
5. What dataset and threshold produce a clear demonstration without excessive seeding or query usage?

## Fairness and provenance

Use identical deterministic seed rows, fixed timestamps, explicit ordering including an ID tie-breaker, and identical selected columns. Both table copies must have matching content, not merely equal row counts. Record a seed version/hash, actual dataset size, SQL/parameters, schema/index variant, execution mode, timestamp, application revision and raw metadata. Compare full bounded result arrays, not just lengths. A matching hash is a compact display of a comparison, not a substitute for comparing the returned values.

The comparison establishes equivalence for the tested fixtures only. It does not prove all possible inputs equivalent. Zero rows, missing metrics, query errors and nonzero writes need explicit handling. Query errors are inconclusive failures, not successful cheap queries.

## Research method and confidence

Four technical search queries were followed by direct reading of Cloudflare and SQLite documentation, with targeted retrieval of pricing, metadata, local execution, CLI, REST, query plans, and GitHub trust boundaries. Parallel user/competitor research is recorded separately. The deep-research skill's preferred Firecrawl/Exa providers were unavailable; available web search was used instead. No outreach, production access, or benchmarks occurred.

Confidence: high for documented mechanisms; medium for the proposed architecture; untested for actual benchmark differences, deployment readiness and time estimates. Recruiter appeal is a design objective, not a validated outcome.
