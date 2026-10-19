# Proposed Matt Pocock skill configuration

The user chose local Markdown tracking and AGENTS.md. There is no existing repository configuration to merge. Triage is not installed, so no triage labels or label configuration are needed. This is a single-context project.

The setup skill asks to show these contents for review before writing the active configuration. The user approved these exact contents on October 19, 2026; they have now been applied as active configuration. Implementation still awaits plan approval.

## AGENTS.md

```markdown
# D1 Query Budget

Read README.md and plans/mvp-plan.md before implementation. Until the user approves the plan, make research and planning changes only.

Keep the first release small. Use synthetic data, remain on Cloudflare's Free plan, explain meaningful decisions, and verify reported results. Never describe local emulation or recorded measurements as a fresh remote D1 run.

## Agent skills

### Issue tracker

Tasks and specs live as local Markdown under .scratch/. See docs/agents/issue-tracker.md.

### Domain docs

Use a single root GLOSSARY.md and docs/adr/ when domain documentation becomes necessary. See docs/agents/domain.md.
```

## docs/agents/issue-tracker.md

```markdown
# Issue tracker: Local Markdown

Issues and specs live under .scratch/<feature-slug>/.

- Spec: .scratch/<feature-slug>/spec.md.
- One file per task: .scratch/<feature-slug>/issues/NN-slug.md.
- Each task records Status: open, in-progress, or done, plus dependencies and acceptance criteria.
- Append progress and decisions under a Comments heading.
- Publishing to the issue tracker means creating these local files; it does not authorize posting to GitHub.

The agreed construction plan is plans/mvp-plan.md. Create task files when implementation is approved; avoid copying the full plan into every ticket. A future switch to GitHub Issues should update this document explicitly.
```

## docs/agents/domain.md

```markdown
# Domain docs

This is a single-context repository.

When present, read root GLOSSARY.md and relevant docs/adr/ entries before exploring or changing the domain. If absent, proceed without creating empty placeholders.

Use defined domain terms consistently. Note conflicts with prior architecture decisions instead of silently changing them.

Research evidence lives in research/. Current scope and implementation decisions live in plans/mvp-plan.md.
```

Installing the setup skill did not install all other Matt Pocock engineering skills. This configuration only prepares their expected project conventions; additional skills are not claimed as available.
