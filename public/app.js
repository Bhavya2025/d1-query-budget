const $ = (id) => document.getElementById(id);
const descriptions = {
  "missing-index":
    "Fetch merchant #1’s latest 20 orders, with and without a composite index.",
  unchanged:
    "Run the same indexed query twice. This control should return the same orders within budget.",
  "wrong-result":
    "Change LIMIT 20 to LIMIT 1. Less work, but an incomplete answer must still fail.",
};
let report = null;
let busy = false;
const selected = () =>
  document.querySelector('input[name="scenario"]:checked').value;
function clearResult() {
  report = null;
  $("download").disabled = true;
  for (const key of [
    "baseline-reads",
    "candidate-reads",
    "baseline-returned",
    "candidate-returned",
    "baseline-written",
    "candidate-written",
  ])
    $(key).textContent = "—";
  $("baseline-bar").style.transform = "scaleX(0)";
  $("candidate-bar").style.transform = "scaleX(0)";
  $("results").dataset.state = "empty";
  $("scale-label").textContent = "Shared scale · awaiting data";
  $("source-label").textContent = "Ready to Measure";
  $("source-label").className = "source-label";
  $("time-label").textContent = "No measurement yet";
  $("time-label").removeAttribute("datetime");
  $("verdict").className = "verdict";
  $("verdict-symbol").textContent = "○";
  $("verdict-title").textContent = "Ready When You Are";
  $("verdict-message").textContent =
    "Run the experiment to check the answer and the work behind it.";
  $("comparison-note").textContent = "Measured results will appear here.";
  $("inspection-content").hidden = true;
  $("inspection-empty").hidden = false;
  $("error").hidden = true;
}
function changeScenario(updateUrl = true) {
  clearResult();
  $("scenario-description").textContent = descriptions[selected()];
  $("candidate-label").textContent = {
    "missing-index": "No index",
    unchanged: "Indexed",
    "wrong-result": "LIMIT 1",
  }[selected()];
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set("scenario", selected());
    history.replaceState(null, "", url);
  }
}
document
  .querySelectorAll('input[name="scenario"]')
  .forEach((input) => input.addEventListener("change", () => changeScenario()));
function setBusy(value) {
  busy = value;
  $("run").disabled = value;
  $("recorded").disabled = value;
  document
    .querySelectorAll('input[name="scenario"]')
    .forEach((input) => (input.disabled = value));
  $("results").setAttribute("aria-busy", String(value));
  $("run-label").textContent = value ? "Measuring…" : "Run on D1";
  $("run").classList.toggle("loading", value);
  if (value) {
    $("source-label").textContent = "Measurement in Progress";
    $("verdict-title").textContent = "Checking the Query…";
    $("verdict-message").textContent =
      "Waiting for the report. Measurements will appear when all checks are complete.";
  }
}
function render(data, recorded) {
  if (
    !data ||
    data.version !== 1 ||
    !data.verdict ||
    !data.baseline ||
    !data.candidate ||
    !Array.isArray(data.baseline.results) ||
    !Array.isArray(data.candidate.results) ||
    !Number.isFinite(data.baseline.meta?.rows_read) ||
    !Number.isFinite(data.candidate.meta?.rows_read) ||
    !Number.isFinite(data.policy?.maxRowsRead)
  )
    throw new Error("The server returned an incomplete report.");
  report = data;
  const { baseline: a, candidate: b, verdict } = data;
  $("source-label").textContent = recorded
    ? "RECORDED REMOTE D1 RUN"
    : data.mode === "remote"
      ? "LIVE CLOUDFLARE D1"
      : "LOCAL EMULATOR";
  $("source-label").className =
    `source-label ${recorded ? "recorded" : "live"}`;
  $("time-label").textContent = new Date(data.measuredAt).toLocaleString(
    undefined,
    { dateStyle: "medium", timeStyle: "medium" },
  );
  $("time-label").dateTime = data.measuredAt;
  for (const [key, value] of Object.entries({
    "baseline-reads": a.meta.rows_read,
    "candidate-reads": b.meta.rows_read,
    "baseline-returned": a.results.length,
    "candidate-returned": b.results.length,
    "baseline-written": a.meta.rows_written,
    "candidate-written": b.meta.rows_written,
  }))
    $(key).textContent = value.toLocaleString();
  const max = Math.max(
    a.meta.rows_read,
    b.meta.rows_read,
    data.policy.maxRowsRead,
    1,
  );
  $("baseline-bar").style.transform = `scaleX(${a.meta.rows_read / max})`;
  $("candidate-bar").style.transform = `scaleX(${b.meta.rows_read / max})`;
  $("results").style.setProperty(
    "--budget-position",
    `${(data.policy.maxRowsRead / max) * 100}%`,
  );
  $("results").dataset.state = "measured";
  $("scale-label").textContent =
    `Shared scale: 0–${max.toLocaleString()} reads`;
  $("verdict").className = `verdict ${verdict.status}`;
  $("verdict-symbol").textContent = verdict.status === "pass" ? "✓" : "×";
  $("verdict-title").textContent =
    {
      "within-budget": "Passed. Same Answer, Within Budget.",
      "budget-exceeded": "Over Budget. The Answer Still Matches.",
      "results-changed": "Rejected. Cheaper, but Incorrect.",
    }[verdict.code] || "Measurement could not be verified.";
  $("verdict-message").textContent = verdict.message;
  const ratio =
    verdict.readRatio == null
      ? "Read ratio unavailable."
      : `${Number(verdict.readRatio.toFixed(2)).toLocaleString()}× candidate / baseline reads.`;
  $("comparison-note").textContent =
    `${ratio} ${verdict.resultsEqual ? "Full ordered results match." : "Returned orders differ."}`;
  $("download").disabled = false;
  $("inspection-empty").hidden = true;
  $("inspection-content").hidden = false;
  $("baseline-sql").textContent = a.sql;
  $("candidate-sql").textContent = b.sql;
  $("baseline-plan").textContent = JSON.stringify(a.plan, null, 2);
  $("candidate-plan").textContent = JSON.stringify(b.plan, null, 2);
  $("returned-orders").textContent = JSON.stringify(
    { baseline: a.results, candidate: b.results },
    null,
    2,
  );
  $("raw-report").textContent = JSON.stringify(data, null, 2);
}
async function run(recorded = false) {
  if (busy) return;
  const trigger = recorded ? $("recorded") : $("run");
  const restoreFocus = document.activeElement === trigger;
  clearResult();
  setBusy(true);
  try {
    const url = recorded
      ? `/reports/${selected()}.json`
      : `/api/run?scenario=${encodeURIComponent(selected())}`;
    const response = await fetch(url, {
      method: recorded ? "GET" : "POST",
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "The measurement could not be loaded.");
    render(data, recorded);
  } catch (error) {
    clearResult();
    $("error").hidden = false;
    $("error").textContent =
      error.name === "TimeoutError"
        ? "The live request timed out. Try again or view a recorded run."
        : `${error.message} Retry the request or view a recorded run.`;
    $("source-label").textContent = "NO MEASUREMENT";
    $("verdict-title").textContent = "No Result to Evaluate";
    $("verdict-message").textContent =
      "Retry the request or use the recorded example below.";
  } finally {
    setBusy(false);
    if (restoreFocus && document.activeElement === document.body)
      trigger.focus({ preventScroll: true });
  }
}
$("run").addEventListener("click", () => run());
$("recorded").addEventListener("click", () => run(true));
$("download").addEventListener("click", () => {
  if (!report) return;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2) + "\n"], {
      type: "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `d1-query-budget-${report.scenario}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function restoreScenario() {
  const scenario = new URL(location.href).searchParams.get("scenario");
  const input = [...document.querySelectorAll('input[name="scenario"]')].find(
    (input) =>
      input.value ===
      (Object.hasOwn(descriptions, scenario) ? scenario : "missing-index"),
  );
  if (input) input.checked = true;
  changeScenario(false);
}
restoreScenario();
window.addEventListener("popstate", () => {
  if (!busy) restoreScenario();
});
