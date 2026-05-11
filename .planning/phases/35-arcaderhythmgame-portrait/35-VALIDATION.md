---
phase: 35
slug: arcaderhythmgame-portrait
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-12
---

# Phase 35 — Validation Strategy (Retroactive)

> Validation contract authored after phase completion to close the nyquist gap identified in v3.4-MILESTONE-AUDIT.md (STATE.md Deferred Items). Phase 35 already passed `/gsd-verify-work` (35-VERIFICATION.md: 8/8 must-haves, all 3 ROADMAP SCs satisfied) on 2026-05-12T00:55:00Z; this document records the validation surface retroactively.

---

## Test Infrastructure

| Property               | Value                                                                       |
| ---------------------- | --------------------------------------------------------------------------- |
| **Framework**          | Vitest 3.x (JSDOM)                                                          |
| **Config file**        | `vite.config.js` (`test` block)                                             |
| **Quick run command**  | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame.test.js` |
| **Full suite command** | `npm run test:run`                                                          |
| **Estimated runtime**  | ~3.3s (scoped) / ~60s (full suite)                                          |

---

## Sampling Rate

- **After every task commit:** Run scoped command (12 tests, ~3.3s)
- **After every plan wave:** Run full suite (`npm run test:run`)
- **Before `/gsd-verify-work`:** Full suite green (1634 passed at phase close; 4 pre-existing worktree-env failures noted in STATE.md, unrelated to Phase 35)

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type     | Automated Command                                                                                                                                                                                                                                           | Status   |
| -------- | ---- | ---- | ----------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 35-01-01 | 01   | 1    | ARCADE-02   | docs (grep)   | `grep -c "single vertical-lane layout" .planning/ROADMAP.md` → ≥1                                                                                                                                                                                           | ✅ green |
| 35-02-01 | 02   | 1    | ARCADE-01   | dev-only      | (instrument removed in Plan 04 — no surviving test target)                                                                                                                                                                                                  | ✅ N/A   |
| 35-03-01 | 03   | 1    | ARCADE-01   | docs (struct) | `35-SPIKE.md` 5-section structure + verdict header (verified in 35-VERIF)                                                                                                                                                                                   | ✅ green |
| 35-04-01 | 04   | 1    | ARCADE-02   | unit + grep   | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame.test.js` (12/12) + `grep -c "spike-portrait\|spikePortraitEnabled\|needsLandscapeValue\|TODO(Phase 35)\|import.meta.env.DEV" src/components/games/rhythm-games/ArcadeRhythmGame.jsx` → 0 | ✅ green |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

### Coverage Rationale

**ARCADE-02 (viewport-aware needsLandscape declaration):** Covered by the 12-test `ArcadeRhythmGame.test.js` suite (all green) plus the grep-based source-of-truth check that asserts the dev spike instrument is fully removed. The component renders cleanly under JSDOM with mocked `useLandscapeLock`/`useRotatePrompt`; any crash in the `useMemo`-cached `isPhoneViewport` branch would fail Test 3 ("renders without crashing"). The matchMedia-driven viewport branch is a 3-line `useMemo` whose two outcomes are documented in 35-VERIFICATION.md Behavioral Spot-Checks and Data-Flow Trace.

**ARCADE-01 (spike requirement):** Inherently manual — the requirement is "feel-test portrait playability and record a verdict." No automated test can substitute for owner subjective judgment. The deliverable artifact (`35-SPIKE.md` with parseable verdict header + 5 structured sections) is verified by 35-VERIFICATION.md Required Artifacts (`grep -cE "^## Verdict: (SHIP-VERTICAL|ROTATE-PROMPT)"` → 1, `grep -cE "^## (Verdict|Test Surface|Observations|Decision Criteria Check|Next Step)"` → 5).

---

## Wave 0 Requirements

_Existing infrastructure covers all phase requirements._

No new test files added — Phase 35 is a one-line viewport branch on top of Phase 34's `NeedsLandscapeContext` infra (which has its own tests). The 12 existing `ArcadeRhythmGame.test.js` tests continue to exercise the component end-to-end with the new declaration.

---

## Manual-Only Verifications

| Behavior                                     | Requirement | Why Manual                                                                                                                                  | Test Instructions                                                                                                                                                                               |
| -------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portrait spike feel-test (verdict authoring) | ARCADE-01   | Subjective playability judgment; no oracle for "feels good on phone-portrait." Spike outcome routes via D-07 tie-break to authored verdict. | Owner runs `npm run dev` on phone-portrait viewport (real device or Chrome DevTools emulation), exercises the spike instrument, and authors `35-SPIKE.md` with verdict + 5 structured sections. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or are spike/manual by nature
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — existing infra sufficient)
- [x] No watch-mode flags
- [x] Feedback latency < 10s for scoped, < 60s full suite
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-05-12 (retroactive — closes 35-VALIDATION.md gap from v3.4-MILESTONE-AUDIT.md)

---

## Validation Audit 2026-05-12

| Metric             | Count                 |
| ------------------ | --------------------- |
| Requirements       | 2                     |
| Automated coverage | 1 (ARCADE-02)         |
| Manual-only        | 1 (ARCADE-01 — spike) |
| Gaps found         | 0                     |
| Resolved           | 0                     |
| Escalated          | 0                     |
