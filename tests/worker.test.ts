import { test } from "node:test";
import assert from "node:assert/strict";
import worker, { type Env } from "../src/worker.ts";
function environment(allowed = true) {
  let calls = 0;
  const env = {
    EXECUTION_MODE: "local",
    DEMO_LIMITER: { limit: async () => ({ success: allowed }) },
    DB: {
      prepare() {
        calls++;
        throw new Error("private-database-detail");
      },
    },
  } as unknown as Env;
  return { env, calls: () => calls };
}
for (const query of [
  "scenario=unknown",
  "scenario=unchanged&sql=DROP+TABLE",
  "scenario=unchanged&scenario=missing-index",
  "scenario=unchanged&params=2",
  "",
]) {
  test(`rejects unsupported request before D1: ${query}`, async () => {
    const { env, calls } = environment();
    const res = await worker.fetch(
      new Request(`https://example.com/api/run?${query}`, { method: "POST" }),
      env,
    );
    assert.equal(res.status, 400);
    assert.equal(calls(), 0);
  });
}
test("rejects SQL bodies before D1", async () => {
  const { env, calls } = environment();
  const res = await worker.fetch(
    new Request("https://example.com/api/run?scenario=unchanged", {
      method: "POST",
      body: '{"sql":"SELECT 1"}',
    }),
    env,
  );
  assert.equal(res.status, 400);
  assert.equal(calls(), 0);
});
test("rejects GET and unknown paths", async () => {
  const { env, calls } = environment();
  assert.equal(
    (
      await worker.fetch(
        new Request("https://example.com/api/run?scenario=unchanged"),
        env,
      )
    ).status,
    405,
  );
  assert.equal(
    (await worker.fetch(new Request("https://example.com/api/unknown"), env))
      .status,
    404,
  );
  assert.equal(calls(), 0);
});
test("rejects cross-origin browser requests", async () => {
  const { env, calls } = environment();
  const res = await worker.fetch(
    new Request("https://example.com/api/run?scenario=unchanged", {
      method: "POST",
      headers: { Origin: "https://other.example" },
    }),
    env,
  );
  assert.equal(res.status, 403);
  assert.equal(calls(), 0);
});
test("throttled requests do no database work", async () => {
  const { env, calls } = environment(false);
  const res = await worker.fetch(
    new Request("https://example.com/api/run?scenario=unchanged", {
      method: "POST",
    }),
    env,
  );
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("Retry-After"), "60");
  assert.equal(calls(), 0);
});
test("provider errors hide private details", async () => {
  const { env } = environment();
  const res = await worker.fetch(
    new Request("https://example.com/api/run?scenario=unchanged", {
      method: "POST",
    }),
    env,
  );
  assert.equal(res.status, 503);
  assert.ok(!(await res.text()).includes("private-database-detail"));
});

test("an empty request stream is accepted like an absent body", async () => {
  const { env, calls } = environment();
  const res = await worker.fetch(
    new Request("https://example.com/api/run?scenario=unchanged", {
      method: "POST",
      body: "",
    }),
    env,
  );
  assert.equal(res.status, 503);
  assert.equal(calls(), 1);
});
