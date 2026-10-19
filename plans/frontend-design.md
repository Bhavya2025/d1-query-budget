# Frontend redesign contract

User authorized a frontend redesign using their frontend-design guidance and fresh Vercel Web Interface Guidelines. Audience: developers and recruiters exploring the query-budget prototype. Primary job: choose a fixed scenario, run a real D1 measurement, understand correctness and database work, inspect the evidence.

Direction: an industrial database workbench with ink-blue surfaces, warm white type, lime controls, mint baseline and coral candidate. Self-hosted Space Grotesk and IBM Plex Mono with OFL licenses. Memorable detail: measured row-read tracks with a shared scale and an explicit budget marker. Native HTML, CSS and JavaScript; no framework or runtime dependencies.

Local reference: the previous screenshot evidence/custom-domain-live.jpg shows an oversized introductory area, broad empty margins, and comparison controls below the first viewport. Move the tool higher, put scenarios beside measurements on desktop, and stack them on narrow screens. Keep raw evidence below the primary decision. Show fixture size as context, never as a measured result.

Checkable hierarchy: compact navigation → short purpose and measurement flow → scenario selector + run controls → measured rows and decision → expandable evidence → explanation and limits. At 1440x900 the run controls and core results should be visible without scrolling. At 390x844 all controls must fit without horizontal page overflow, with results following controls. At 200% zoom content must reflow.

States:
- Empty: blank metrics, ready status, run and recorded actions available.
- Loading: stable workspace, disabled scenario/run controls, progress announcement; bounded request timeout.
- Success: provider counters, full-result decision, source and timestamp, JSON export.
- Error: no stale metrics, actionable retry/recorded recovery, alert, controls restored. Exercise locally with a controlled 503 response.
- Partial: not applicable; the endpoint validates all five query results and rejects incomplete measurements. UI must not present incomplete output as success.
- Permission: not applicable to visitors; the public fixed-query endpoint requires no login and has no credential input.

Accessibility: native radio group, buttons and disclosures; visible keyboard focus; minimum 44px actions; readable contrast; semantic headings; skip link; localized numbers/dates; polite atomic decision announcements; reduced-motion override. Animate only opacity/transform and avoid persistent decorative loops. Scenario choice lives in the URL without auto-running D1 requests.

Verification: typecheck, existing tests, Worker dry-run; browser checks for all three scenarios, recorded mode, loading, failure/recovery, keyboard, deep links, desktop/mobile/zoom and evidence panels. Save screenshots and a truthful local evidence record under evidence/frontend/. Deploy and repeat live scenario checks. No backend, SQL or budget changes.
