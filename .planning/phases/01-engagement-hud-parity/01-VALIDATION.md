---
phase: 01
slug: engagement-hud-parity
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-09
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                          |
| ---------------------- | ---------------------------------------------- |
| **Framework**          | vitest (JSDOM, @testing-library/react)         |
| **Config file**        | vite.config.js (setup: src/test/setupTests.js) |
| **Quick run command**  | `npx vitest run <changed test file>`           |
| **Full suite command** | `npm run test:run`                             |
| **Estimated runtime**  | ~120 seconds (full suite)                      |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <touched test files>`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement             | Threat Ref | Secure Behavior                                          | Test Type   | Automated Command                                                                                                             | File Exists   | Status     |
| -------- | ---- | ---- | ----------------------- | ---------- | -------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------- |
| 01-01-01 | 01   | 1    | HUD-01                  | —          | N/A (client display-only, no trust boundary)             | unit        | `npx vitest run src/contexts/SightReadingSessionContext.test.jsx` (RED — targets unimplemented combo)                         | ❌ W0         | ⬜ pending |
| 01-01-02 | 01   | 1    | HUD-01                  | T-01-01    | Combo is non-authoritative client state; tamper accepted | unit        | `npx vitest run src/contexts/SightReadingSessionContext.test.jsx` (GREEN)                                                     | ✅ (01-01-01) | ⬜ pending |
| 01-01-03 | 01   | 1    | HUD-01 (HUD-02 doc)     | —          | N/A (planning doc edit)                                  | doc/grep    | `grep -n "HUD-02" .planning/REQUIREMENTS.md` (DEFERRED + D-01 rationale present)                                              | n/a           | ⬜ pending |
| 01-02-01 | 02   | 2    | HUD-01, HUD-03          | —          | N/A (test scaffold)                                      | integration | `npx vitest run src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx ...micRestart.test.jsx` (RED + green) | ❌ W0         | ⬜ pending |
| 01-02-02 | 02   | 2    | HUD-01, HUD-03, I18N-01 | T-01-03/04 | Event-driven resetCombo (no 60Hz setState); display-only | integration | `npx vitest run ...SightReadingGame.combo.test.jsx ...micRestart.test.jsx && npm run test:run` (GREEN)                        | ✅ (01-02-01) | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

New test files that must be authored before (or as the RED step of) their implementation task — no
existing coverage exists for these behaviors:

- [ ] `src/contexts/SightReadingSessionContext.test.jsx` — NEW. Context has zero existing tests. Covers
      combo lifecycle (start 0/false, increment, on-fire at 5, reset) + session-boundary reset semantics
      (startSession/resetSession reset; goToNextExercise preserves). Authored in Plan 01 Task 1 (RED).
- [ ] `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx` — NEW. Covers live
      increment on correct note, reset on window-close miss (fake-timer driven), session-wide persistence,
      on-fire render. Authored in Plan 02 Task 1 (RED).
- [ ] `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx` — MODIFY. Extend the
      `useSightReadingSession` mock (lines 61-78) with `combo`/`isOnFire`/`incrementCombo`/`resetCombo`
      so the component destructures real values, not `undefined`. Done in Plan 02 Task 1.
- [ ] Framework install: none — Vitest / @testing-library/react already fully configured.

---

## Manual-Only Verifications

| Behavior                                                      | Requirement          | Why Manual                                                                           | Test Instructions                                                                                                                                                                           |
| ------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| On-fire threshold of 5 "feels right" under session-wide scope | HUD-03 (D-06 tuning) | Empirical UX judgment; can't be resolved by static tests                             | Play a full sight-reading session; confirm combo reaches on-fire on sustained focus without feeling trivially easy. Re-tune `ON_FIRE_THRESHOLD` (one-line) only if owner judges it trivial. |
| Hebrew RTL rendering of combo/on-fire aria-labels             | I18N-01              | Screen-reader/RTL presentation is a device/AT concern (keys already parity-verified) | With app locale = he, confirm combo/on-fire HUD reads correctly (labels reuse existing translated `games.engagement.*` keys — parity is structural).                                        |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
