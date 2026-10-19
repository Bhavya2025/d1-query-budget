const $ = id => document.getElementById(id);
const descriptions = {
  'missing-index': 'Fetch merchant #1’s latest 20 orders, with and without a composite index.',
  unchanged: 'Run the same indexed query twice. This control should return the same orders within budget.',
  'wrong-result': 'Change LIMIT 20 to LIMIT 1. Less work, but an incomplete answer must still fail.',
};
let report = null;
let busy = false;
const selected = () => document.querySelector('input[name="scenario"]:checked').value;
function clearResult() {
  report = null; $('download').disabled = true;
  for (const key of ['baseline-reads','candidate-reads','baseline-returned','candidate-returned','baseline-written','candidate-written']) $(key).textContent = '—';
  $('baseline-bar').style.width = '0'; $('candidate-bar').style.width = '0';
  $('source-label').textContent = 'READY TO MEASURE'; $('source-label').className = 'source-label';
  $('time-label').textContent = 'Nothing has run yet.'; $('verdict').className = 'verdict';
  $('verdict-symbol').textContent = '○'; $('verdict-title').textContent = 'The answer is only half the test.';
  $('verdict-message').textContent = 'Run a comparison to check both the returned orders and the work needed to find them.';
  $('comparison-note').textContent = 'Measurements appear after a run. No example numbers are pre-filled.';
  $('inspection-content').hidden = true; $('inspection-empty').hidden = false; $('error').hidden = true;
}
function changeScenario() {
  clearResult(); $('scenario-description').textContent = descriptions[selected()];
  $('candidate-label').textContent = ({ 'missing-index': 'No index', unchanged: 'Indexed', 'wrong-result': 'LIMIT 1' })[selected()];
}
document.querySelectorAll('input[name="scenario"]').forEach(input => input.addEventListener('change', changeScenario));
function setBusy(value) {
  busy = value; $('run').disabled = value; $('recorded').disabled = value;
  document.querySelectorAll('input[name="scenario"]').forEach(input => input.disabled = value);
  $('results').setAttribute('aria-busy', String(value)); $('run').textContent = value ? 'Measuring…' : 'Run on D1 ↗';
}
function render(data, recorded) {
  if (!data || data.version !== 1 || !data.verdict || !data.baseline || !data.candidate) throw new Error('The server returned an incomplete report.');
  report = data;
  const { baseline: a, candidate: b, verdict } = data;
  $('source-label').textContent = recorded ? 'RECORDED REMOTE D1 RUN' : data.mode === 'remote' ? 'LIVE CLOUDFLARE D1' : 'LOCAL EMULATOR';
  $('source-label').className = `source-label ${recorded ? 'recorded' : 'live'}`;
  $('time-label').textContent = new Date(data.measuredAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
  for (const [key, value] of Object.entries({ 'baseline-reads': a.meta.rows_read, 'candidate-reads': b.meta.rows_read, 'baseline-returned': a.results.length, 'candidate-returned': b.results.length, 'baseline-written': a.meta.rows_written, 'candidate-written': b.meta.rows_written })) $(key).textContent = value.toLocaleString();
  const max = Math.max(a.meta.rows_read, b.meta.rows_read, data.policy.maxRowsRead, 1);
  $('baseline-bar').style.width = `${a.meta.rows_read / max * 100}%`; $('candidate-bar').style.width = `${b.meta.rows_read / max * 100}%`;
  $('verdict').className = `verdict ${verdict.status}`;
  $('verdict-symbol').textContent = verdict.status === 'pass' ? '✓' : '×';
  $('verdict-title').textContent = ({ 'within-budget': 'Passed. Same answer, within budget.', 'budget-exceeded': 'Budget exceeded. The answer still matches.', 'results-changed': 'Rejected. Cheaper, but the answer changed.' })[verdict.code] || 'Measurement could not be verified.';
  $('verdict-message').textContent = verdict.message;
  const ratio = verdict.readRatio == null ? 'Read ratio unavailable.' : `${Number(verdict.readRatio.toFixed(2))}× candidate / baseline rows read.`;
  $('comparison-note').textContent = `${ratio} ${verdict.resultsEqual ? 'Full ordered results match.' : 'Returned orders differ.'}`;
  $('download').disabled = false; $('inspection-empty').hidden = true; $('inspection-content').hidden = false;
  $('baseline-sql').textContent = a.sql; $('candidate-sql').textContent = b.sql;
  $('baseline-plan').textContent = JSON.stringify(a.plan, null, 2); $('candidate-plan').textContent = JSON.stringify(b.plan, null, 2);
  $('returned-orders').textContent = JSON.stringify({ baseline: a.results, candidate: b.results }, null, 2);
  $('raw-report').textContent = JSON.stringify(data, null, 2);
}
async function run(recorded = false) {
  if (busy) return;
  clearResult(); setBusy(true);
  try {
    const url = recorded ? `/reports/${selected()}.json` : `/api/run?scenario=${encodeURIComponent(selected())}`;
    const response = await fetch(url, recorded ? {} : { method: 'POST', signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The measurement could not be loaded.');
    render(data, recorded);
  } catch (error) {
    $('error').hidden = false;
    $('error').textContent = error.name === 'TimeoutError' ? 'The live request timed out. Try again or view a recorded run.' : error.message;
    $('source-label').textContent = 'NO MEASUREMENT';
  } finally { setBusy(false); }
}
$('run').addEventListener('click', () => run()); $('recorded').addEventListener('click', () => run(true));
$('download').addEventListener('click', () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2) + '\n'], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `d1-query-budget-${report.scenario}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
