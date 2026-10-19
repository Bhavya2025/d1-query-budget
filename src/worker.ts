import { DATASET, type Order } from "./fixture.ts";
import { evaluate, type Observation, type Report } from "./evaluate.ts";
import {
  BASELINE_SQL,
  candidateSQL,
  isScenario,
  ROW_BUDGET,
} from "./scenarios.ts";

export interface Env {
  DB: D1Database;
  EXECUTION_MODE: string;
  DEMO_LIMITER: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
  VERSION?: { id: string };
}
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const json = (body: unknown, status = 200, extra = {}) =>
  Response.json(body, { status, headers: { ...headers, ...extra } });

async function hasBody(request: Request): Promise<boolean> {
  if (!request.body) return false;
  const reader = request.body.getReader();
  try {
    return !(await reader.read()).done;
  } finally {
    await reader.cancel();
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/api/run") return json({ error: "Not found." }, 404);
    if (request.method !== "POST")
      return json(
        { error: "Use POST with a fixed scenario and no body." },
        405,
        { Allow: "POST" },
      );
    const scenario = url.searchParams.get("scenario");
    if (
      (await hasBody(request)) ||
      !isScenario(scenario) ||
      [...url.searchParams.keys()].length !== 1
    ) {
      return json(
        {
          error:
            "Choose one supported scenario. SQL, parameters, and request bodies are not accepted.",
        },
        400,
      );
    }
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin)
      return json(
        { error: "Cross-origin browser requests are not supported." },
        403,
      );
    try {
      if (env.EXECUTION_MODE !== "local" && env.EXECUTION_MODE !== "remote")
        throw new Error("Missing mode");
      // Shared per-location throttle, not a global usage cap.
      if (
        !(await env.DEMO_LIMITER.limit({ key: "d1-query-budget-demo" })).success
      ) {
        return json(
          {
            error:
              "The demo is taking a breather. Try again in a minute or view a recorded run.",
          },
          429,
          { "Retry-After": "60" },
        );
      }
      const candidate = candidateSQL(scenario);
      const result = await env.DB.batch([
        env.DB.prepare(BASELINE_SQL).bind(1),
        env.DB.prepare(candidate).bind(1),
        env.DB.prepare(`EXPLAIN QUERY PLAN ${BASELINE_SQL}`).bind(1),
        env.DB.prepare(`EXPLAIN QUERY PLAN ${candidate}`).bind(1),
        env.DB.prepare(
          "SELECT version, seed_hash, row_count FROM fixture_manifest LIMIT 1",
        ),
      ]);
      if (result.length !== 5 || result.some((r) => !r.success))
        throw new Error("Incomplete measurement");
      const manifest = result[4].results[0] as
        | Record<string, unknown>
        | undefined;
      if (
        manifest?.version !== DATASET.version ||
        manifest.seed_hash !== DATASET.seedHash ||
        manifest.row_count !== DATASET.rowsPerTable
      )
        throw new Error("Fixture mismatch");
      function observation(index: number, sql: string): Observation {
        return {
          sql,
          params: [1],
          results: result[index].results as Order[],
          meta: result[index].meta,
          plan: result[index + 2].results,
        };
      }
      const report: Report = {
        version: 1,
        scenario,
        measuredAt: new Date().toISOString(),
        mode: env.EXECUTION_MODE,
        revision: env.VERSION?.id || "local-development",
        dataset: DATASET,
        policy: { maxRowsRead: ROW_BUDGET },
        baseline: observation(0, BASELINE_SQL),
        candidate: observation(1, candidate),
      };
      const verdict = evaluate(report);
      if (verdict.status === "error") throw new Error("Invalid measurement");
      return json({ ...report, verdict });
    } catch {
      return json(
        {
          error:
            "D1 measurement is unavailable. The fixture or free allowance may be unavailable; no result was substituted.",
        },
        503,
      );
    }
  },
};
