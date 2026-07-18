---
phase: 2
slug: practice-tooling
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                          |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Framework**          | Vitest 3.2.4, jsdom, globals enabled                                           |
| **Config file**        | `vitest.config.js` (includes `test.env` Supabase stubs)                        |
| **Quick run command**  | `npx vitest run src/components/games/sight-reading-game src/locales/__tests__` |
| **Full suite command** | `npm run test:run`                                                             |
| **Estimated runtime**  | ~quick <15s / full ~60-90s (~1,975+ tests)                                     |

---

## Sampling Rate

- **After every task commit:** `npx vitest run src/components/games/sight-reading-game src/locales/__tests__`
- **After every plan wave:** `npm run test:run` (full suite) + `npm run lint`
- **Before `/gsd-verify-work`:** Full suite green + `npm run build` (prebuild trail validation)
- **Max feedback latency:** ~15s (quick run)

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement   | Threat Ref | Secure Behavior                                                | Test Type             | Automated Command                                                                               | File Exists | Status     |
| -------- | ---- | ---- | ------------- | ---------- | -------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 02-01-01 | 01   | 1    | PRAC-03       | T-02-02    | Leniency multipliers only widen grading; unscored under D-01   | grep/build            | `grep GRADING_MODES gradingModes.js`                                                            | ❌ W0       | ⬜ pending |
| 02-01-02 | 01   | 1    | PRAC-03       | T-02-02    | Practice widens windows incl. clamp-bound case                 | unit (renderHook)     | `npx vitest run .../hooks/useTimingAnalysis.test.js`                                            | ❌ W0       | ⬜ pending |
| 02-01-03 | 01   | 1    | PRAC-03       | —          | Practice pitch-only; Test blend unchanged                      | unit                  | `npx vitest run .../utils/scoreCalculator.test.js`                                              | ✅ extend   | ⬜ pending |
| 02-02-01 | 02   | 1    | PRAC-02       | T-02-03    | Reconstruct from in-memory results; no raw audio               | unit (pure)           | `npx vitest run .../utils/comparisonPattern.test.js`                                            | ❌ W0       | ⬜ pending |
| 02-02-02 | 02   | 1    | PRAC-02       | —          | Additive staff outline; result fills preserved                 | component (suite)     | `npx vitest run src/components/games/sight-reading-game`                                        | n/a         | ⬜ pending |
| 02-03-01 | 03   | 1    | PRAC-03       | T-02-02    | gradingMode allowlist-guarded + lockable                       | component (combo)     | `npx vitest run .../SightReadingGame.combo.test.jsx`                                            | ✅          | ⬜ pending |
| 02-03-02 | 03   | 1    | PRAC-04       | T-02-01    | Drill unscored; no combo; enharmonic advance                   | unit (renderHook)     | `npx vitest run .../hooks/useReviewDrill.test.js`                                               | ❌ W0       | ⬜ pending |
| 02-03-03 | 03   | 1    | PRAC-04       | —          | Panel i18n + conventions                                       | component (suite)     | `npx vitest run src/components/games/sight-reading-game`                                        | n/a         | ⬜ pending |
| 02-04-01 | 04   | 1    | I18N-01       | T-02-05    | EN↔HE sightReading parity (both directions)                   | unit (static)         | `npx vitest run src/locales/__tests__/sight-reading-parity.test.js`                             | ❌ W0       | ⬜ pending |
| 02-04-02 | 04   | 1    | I18N-01       | —          | All phase keys present EN+HE at parity                         | unit (static)         | `npx vitest run src/locales/__tests__/sight-reading-parity.test.js`                             | ❌ W0       | ⬜ pending |
| 02-05-01 | 05   | 1    | PRAC-03       | T-02-01    | suppressPersistence gates streak/trail/free-play XP            | component (games)     | `npx vitest run src/components/games src/hooks`                                                 | ✅          | ⬜ pending |
| 02-05-02 | 05   | 1    | PRAC-03       | T-02-01    | Daily-challenge gated; not-scored notice under suppression     | component             | `npx vitest run src/components/games`                                                           | ✅          | ⬜ pending |
| 02-06-01 | 06   | 2    | PRAC-02/03/04 | T-02-01    | Two-row D-23; review hidden on clean run; notice + bars shown  | component (suite)     | `npx vitest run src/components/games/sight-reading-game`                                        | n/a         | ⬜ pending |
| 02-06-02 | 06   | 2    | PRAC-04       | —          | Layout recognizes review phase                                 | component (suite)     | `npx vitest run src/components/games/sight-reading-game`                                        | n/a         | ⬜ pending |
| 02-07-01 | 07   | 3    | PRAC-03       | T-02-02    | Pill locks at COUNT_IN; localStorage default Test              | component             | `npx vitest run .../SightReadingGame.practiceMode.test.jsx`                                     | ❌ W0       | ⬜ pending |
| 02-07-02 | 07   | 3    | PRAC-03       | T-02-01    | Practice: no updateStudentScore; suppressPersistence forwarded | component             | `npx vitest run .../SightReadingGame.practiceMode.test.jsx`                                     | ❌ W0       | ⬜ pending |
| 02-07-03 | 07   | 3    | PRAC-03       | T-02-01    | Practice/Test divergence + delayed combo break                 | component             | `npx vitest run .../SightReadingGame.practiceMode.test.jsx .../SightReadingGame.combo.test.jsx` | ❌ W0/✅    | ⬜ pending |
| 02-08-01 | 08   | 4    | PRAC-01       | T-02-03    | Replay clears pending timeout; unlimited                       | component (faketimer) | `npx vitest run .../SightReadingGame.replay.test.jsx`                                           | ❌ W0       | ⬜ pending |
| 02-08-02 | 08   | 4    | PRAC-02       | T-02-03    | Comparison yours→correct chained on end signal; empty-yours    | component (suite)     | `npx vitest run src/components/games/sight-reading-game`                                        | n/a         | ⬜ pending |
| 02-08-03 | 08   | 4    | PRAC-01       | —          | Double-play guard; DISPLAY-only visibility                     | component (faketimer) | `npx vitest run .../SightReadingGame.replay.test.jsx`                                           | ❌ W0       | ⬜ pending |
| 02-09-01 | 09   | 5    | PRAC-04       | T-02-06    | REVIEW in activePhases/keyboard band/interruption              | component (suite)     | `npx vitest run src/components/games/sight-reading-game`                                        | n/a         | ⬜ pending |
| 02-09-02 | 09   | 5    | PRAC-04       | T-02-01    | Review routes before canScoreNow; no score/combo               | component             | `npx vitest run .../SightReadingGame.review.test.jsx`                                           | ❌ W0       | ⬜ pending |
| 02-09-03 | 09   | 5    | PRAC-04       | T-02-01    | Clean run hides review; no score/combo during review           | component             | `npx vitest run .../SightReadingGame.review.test.jsx`                                           | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

New test files created during their owning plan's first task (test-first where the task is `tdd="true"`):

- [ ] `src/locales/__tests__/sight-reading-parity.test.js` — I18N-01 (green today at 52/52; load-bearing once strings land) — Plan 02-04
- [ ] `src/components/games/sight-reading-game/utils/comparisonPattern.test.js` — PRAC-02 core — Plan 02-02
- [ ] `src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js` — PRAC-03 windows (no test exists today) — Plan 02-01
- [ ] `src/components/games/sight-reading-game/hooks/useReviewDrill.test.js` — PRAC-04 drill — Plan 02-03
- [ ] `src/components/games/sight-reading-game/SightReadingGame.practiceMode.test.jsx` — PRAC-03 integration — Plan 02-07
- [ ] `src/components/games/sight-reading-game/SightReadingGame.replay.test.jsx` — PRAC-01 integration — Plan 02-08
- [ ] `src/components/games/sight-reading-game/SightReadingGame.review.test.jsx` — PRAC-04 integration — Plan 02-09

Framework install: none needed (Vitest + RTL already configured). Existing `scoreCalculator.test.js`
and `SightReadingGame.combo.test.jsx` are extended, not created.

---

## Manual-Only Verifications

| Behavior                                                    | Requirement | Why Manual                                                                   | Test Instructions                                                                                                    |
| ----------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Audible correctness of replay timbre + comparison passes    | PRAC-01/02  | jsdom cannot assert Web Audio output beyond call-shape                       | On device, replay an exercise and trigger Compare; confirm yours-then-correct is audible and the staff outline moves |
| Practice leniency "feels" right (2x multiplier tuning)      | PRAC-03     | Subjective tuning (Assumption A1)                                            | Play eighth notes at 120bpm in Practice; confirm noticeably more forgiving than Test                                 |
| Mic-mode review does not phantom-detect the target audition | PRAC-04     | Requires real mic hardware                                                   | Enter Review in mic mode; confirm the auto-played target is not counted as the child's answer                        |
| Hebrew RTL visual mirroring of new controls                 | I18N-01     | Visual RTL layout (consistent with prior milestones' deferred device checks) | Switch to Hebrew; confirm mode pill / replay / compare / review render RTL-correct                                   |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags (all `vitest run`)
- [x] Feedback latency < 15s (quick run)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-10
