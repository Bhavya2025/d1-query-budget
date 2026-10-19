# A 60-second walkthrough

1. Open the live site and choose **Missing index**. Explain: “These tables contain identical synthetic orders. One has a composite lookup index.”
2. Click **Run on D1**. Read the actual result, not a memorized timing: “Both returned 20 orders. This run read 20 rows with the index and 1,100 without it.”
3. Point to the 100-row budget: “Correct output passes the first check, but the extra database work fails the budget.”
4. Choose **Unchanged query** and run it: “This is the passing control.”
5. Choose **Cheap but wrong**: “Returning just one order is cheap but changes the answer, so it fails correctness.”
6. Expand evidence and download the report: “The same evaluator runs in the Worker and CLI. It recomputes the result comparison rather than trusting the displayed verdict.”
7. Explain the boundary: “This version is a fixed-scenario demonstrator with report verification. It doesn't automatically benchmark arbitrary PR queries. CI checks the evaluator and captured reports offline.”

## Concepts to explain in your own words

- **Index:** an additional lookup structure that helps locate relevant rows. Maintaining it adds work to writes and consumes storage.
- **Rows returned:** the records sent back as the answer. **Rows read:** the work D1 reports doing to find that answer. These need not be equal.
- **Budget:** our chosen test threshold of 100 reads, not a Cloudflare bill cap.
- **Correctness:** every expected field and row order matters; comparing only result length is insufficient.
- **Fixture:** reproducible synthetic data. Our conclusions apply to it, not all possible customer workloads.
- **Provenance:** where and when the measurement came from, along with dataset identity and deployed Worker version. JSON can still be edited; this isn't a signed attestation.

## Résumé wording supported by this implementation

Built a TypeScript query-budget demonstrator on Cloudflare Workers and D1, detecting a 55× increase in rows read on a 1,000-order synthetic workload while checking result correctness; added a report-verification CLI and automated tests.

Use “demonstrator” or “prototype” when discussing scope. Do not claim customer savings, production adoption, or automatic arbitrary-PR benchmarking.
