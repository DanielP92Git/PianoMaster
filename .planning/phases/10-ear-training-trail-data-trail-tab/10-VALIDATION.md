---
phase: 10
slug: ear-training-trail-data-trail-tab
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 10-01-01 | 01 | 1 | EAR-01 | build | `npm run verify:trail` | ✅ | ⬜ pending |
| 10-01-02 | 01 | 1 | EAR-02 | build | `npm run verify:trail` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 1 | EAR-03 | build | `npm run build` | ✅ | ⬜ pending |
| 10-03-01 | 03 | 2 | EAR-04 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 10-04-01 | 04 | 2 | EAR-05 | migration | `psql` | ❌ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

- `scripts/validateTrail.mjs` — validates node prerequisites, cycles, duplicate IDs, exercise types, XP
- `npm run build` — runs trail validation as prebuild hook

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ear tab visible on TrailMap with cyan palette | EAR-01 | Visual rendering | Open TrailMap, tap Ear tab, verify cyan/teal colors |
| Paywall shown for premium ear nodes | EAR-04 | Requires Supabase auth state | Log in as free user, tap premium ear node, verify paywall |
| Boss node completable end-to-end | EAR-05 | Full game session flow | Start boss_ear_1, complete exercises, verify VictoryScreen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
