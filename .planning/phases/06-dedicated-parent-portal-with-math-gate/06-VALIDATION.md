---
phase: 6
slug: dedicated-parent-portal-with-math-gate
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
nyquist_audited: 2026-03-26
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.js` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File | Status |
|---------|------|------|-------------|-----------|-------------------|------|--------|
| 01-T1 | 01 | 1 | D-01, REQ-01 | Unit | `npx vitest run src/components/layout/appNavigationConfig.test.js` | `src/components/layout/appNavigationConfig.test.js` | ✅ green |
| 01-T2 | 01 | 1 | D-02, D-03, REQ-02 | Unit | `npx vitest run src/components/settings/ParentZoneEntryCard.test.jsx` | `src/components/settings/ParentZoneEntryCard.test.jsx` | ✅ green |
| 02-T1 | 02 | 1 | D-08, REQ-04 | Unit | `npx vitest run src/components/parent/QuickStatsGrid.test.jsx` | `src/components/parent/QuickStatsGrid.test.jsx` | ✅ green |
| 02-T2 | 02 | 1 | D-04, D-05, D-06, D-07, D-09, D-10, D-11, D-13, REQ-03, REQ-05, REQ-06 | Integration | `npx vitest run src/pages/ParentPortalPage.test.jsx` | `src/pages/ParentPortalPage.test.jsx` | ✅ green |
| 03-T1 | 03 | 2 | D-12, D-14, REQ-07, REQ-08 | Integration | `npx vitest run src/pages/AppSettings.cleanup.test.jsx` | `src/pages/AppSettings.cleanup.test.jsx` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Math gate re-appears on navigation away and back | D-04 | Component mount/unmount requires browser | Navigate to /parent-portal, solve gate, navigate away, return — gate must re-appear |
| Desktop sidebar shows Parent Zone between Achievements and Settings | D-01 | Visual layout verification | Check sidebar on desktop viewport has ShieldCheck icon entry |
| Mobile Settings has Parent Zone card (visual position) | D-02 | Visual layout verification | Check Settings page on mobile viewport has prominent entry card after Language Selector |
| Portal sections render after gate (full scroll) | D-07 | Visual integration test | Solve gate, verify all 4 sections visible and scrollable |
| Quick Stats data loading → real values | D-08 | Requires live Supabase connection | Observe skeletons → values transition for Level, Stars, Nodes, Streak |
| Weekend Pass toggle works without sub-gate | D-13 | Requires live streakService | Toggle weekend pass in portal, confirm no gate overlay appears |

---

## Nyquist Audit Results (2026-03-26)

**Auditor:** gsd-nyquist-auditor
**Tests created:** 5 files, 34 total test cases
**All tests:** passing

### Tests Created

| File | Type | Requirements | Tests |
|------|------|--------------|-------|
| `src/components/settings/ParentZoneEntryCard.test.jsx` | Unit | D-02, D-03, REQ-02 | 5 |
| `src/components/layout/appNavigationConfig.test.js` | Unit | D-01, REQ-01 | 7 |
| `src/components/parent/QuickStatsGrid.test.jsx` | Unit | D-08, REQ-04 | 9 |
| `src/pages/ParentPortalPage.test.jsx` | Integration | D-04, D-05, D-06, D-07, D-09, D-10, D-11, D-13, REQ-03, REQ-05, REQ-06 | 12 |
| `src/pages/AppSettings.cleanup.test.jsx` | Integration | D-12, D-14, REQ-07, REQ-08 | 6 |

### Pre-existing Failure (unrelated)

`src/components/auth/ParentEmailStep.test.jsx` — `i18n.dir is not a function` — documented in all 3 phase SUMMARYs as pre-dating Phase 06. Not a regression.

---

## Validation Sign-Off

- [x] All tasks have automated verify commands
- [x] Sampling continuity: all tasks covered
- [x] Wave 0 covers all phase requirements
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** nyquist-auditor 2026-03-26
