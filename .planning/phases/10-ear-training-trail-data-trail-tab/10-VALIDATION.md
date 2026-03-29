---
phase: 10
slug: ear-training-trail-data-trail-tab
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-29
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.js` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm run test:run && npm run verify:trail` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npm run test:run && npm run verify:trail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-T1 | 01 | 1 | EAR-01, EAR-03, EAR-05 | build | `npm run verify:trail` | N/A (build gate) | pending |
| 10-01-T2 | 01 | 1 | EAR-01, EAR-02 | build | `npm run build` | N/A (build gate) | pending |
| 10-02-T1 | 02 | 2 | EAR-04 | build | `npm run build` | N/A (build gate) | pending |
| 10-02-T2 | 02 | 2 | EAR-01, EAR-03, EAR-04, EAR-05 | unit | `npx vitest run src/data/earTraining.test.js src/config/subscriptionConfig.test.js` | Created by this task | pending |

*Status: pending / green / red / flaky*

### Requirement Coverage

| Requirement | Description | Task(s) | Verification Type |
|-------------|-------------|---------|-------------------|
| EAR-01 | 12-15 ear training nodes across 2 units | 10-01-T1 (authoring), 10-01-T2 (registration), 10-02-T2 (tests) | build + unit |
| EAR-02 | Ear tab visible with distinct color palette | 10-01-T2 (UNITS map registration) | build + manual (pre-wired by TRAIL_TAB_CONFIGS) |
| EAR-03 | Nodes use PITCH_COMPARISON and INTERVAL_ID | 10-01-T1 (authoring), 10-02-T2 (tests) | build + unit |
| EAR-04 | Free tier gating (JS + Postgres) | 10-02-T1 (config + migration), 10-02-T2 (tests) | build + unit |
| EAR-05 | Boss nodes combining ear training skills | 10-01-T1 (authoring), 10-02-T2 (tests) | build + unit |

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

- `scripts/validateTrail.mjs` — validates node prerequisites, cycles, duplicate IDs, exercise types, XP
- `npm run build` — runs trail validation as prebuild hook
- `src/data/constants.test.js` — already verifies ear_training tab in TRAIL_TAB_CONFIGS (line 88-93)

No new test scaffolding needed before Wave 1 execution.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ear tab visible on TrailMap with cyan palette | EAR-02 | Visual rendering (tab is pre-wired via TRAIL_TAB_CONFIGS; data presence triggers display) | Open TrailMap, tap Ear tab, verify cyan/teal colors and unit headers |
| Paywall shown for premium ear nodes | EAR-04 | Requires Supabase auth state | Log in as free user, tap premium ear node, verify paywall |
| Boss node completable end-to-end | EAR-05 | Full game session flow | Start boss_ear_1, complete exercises, verify VictoryScreen |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
