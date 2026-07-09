---
phase: 01-engagement-hud-parity
verified: 2026-07-09T20:38:20Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Trigger an on-fire streak (5 consecutive correct notes) in the live sight-reading game and observe the OnFireBadge + OnFireSplash celebration"
    expected: "Flame badge appears next to ComboPill in the header, and a full-screen flame splash briefly overlays the game (1.5s), matching NotesRecognitionGame's on-fire feel"
    why_human: "Visual/animation appearance and timing feel cannot be verified via static analysis; the new integration test (SightReadingGame.combo.test.jsx) asserts the badge but never asserts the OnFireSplash overlay actually renders (see WR-03 below)"
  - test: "Enable OS/in-app prefers-reduced-motion and repeat the on-fire trigger"
    expected: "OnFireBadge/OnFireSplash/ComboPill show state changes without motion (pulse/scale/shake animations suppressed) per the shared components' dual-source reduced-motion handling"
    why_human: "Real reduced-motion behavior requires a live browser/OS setting toggle; cannot be grepped, only that the self-contained hooks are called was confirmed statically"
  - test: "Switch to Hebrew (he) locale and play through a combo/on-fire sequence"
    expected: '"קומבו" and "מדהים!" render correctly with RTL layout, no truncation/clipping in the header pill row'
    why_human: "RTL visual layout and truncation cannot be verified by grep; only string presence in locale JSON was confirmed"
  - test: "Deliberately trigger the anti-cheat guess-penalty flow (rapid wrong keyboard/mic inputs) after building a combo of 5+ (on-fire), then observe the HUD immediately after the penalty modal appears"
    expected: "Reviewer expectation (WR-01, unresolved): combo/isOnFire should reset to be consistent with the score deduction the penalty applies. Confirm whether the shipped behavior (combo/on-fire NOT reset, `resetCombo()` not called in `abortPerformanceForPenalty`) is acceptable for this phase or needs a follow-up fix."
    why_human: "This is a judgment call on scope/severity flagged by code review (01-REVIEW.md WR-01) that was never patched or overridden; needs an explicit accept/fix decision, not a hard grep/existence check"
---

# Phase 01: Engagement HUD Parity Verification Report

**Phase Goal:** Sight-reading players get the same combo / lives / on-fire engagement feedback loop as the sibling games (Notes Recognition, Arcade Rhythm), by reusing the shared HUD components already extracted in v3.6 (`src/components/games/shared/hud/`) — no new mechanics invented, just parity. Scope note: Phase 01 is positive-only — HUD-02 (lives + GameOverScreen) was deferred (documented rationale in 01-CONTEXT.md); combo is session-wide and live note-by-note.
**Verified:** 2026-07-09T20:38:20Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                                                    | Status                                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Player sees a live combo counter (`ComboPill`) that increments on consecutive correct notes and visibly resets on a miss; session-wide, live note-by-note (SC-1, HUD-01) | ✓ VERIFIED                             | `SightReadingSessionContext.jsx` L27-48 implements ref+state `incrementCombo`/`resetCombo`; `SightReadingGame.jsx` L1882 calls `incrementCombo()` at the correct-note record site, L2161 calls `resetCombo()` at the miss-record site inside the RAF `tick()`. `startSession`/`resetSession` reset combo (L50-68); `goToNextExercise` does not touch it. 6/6 context unit tests + 4/4 combo integration tests pass; full suite 1975 passed/0 failed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2   | Lives / game-over (`LivesDisplay`/`GameOverScreen`) — deferred, documented rationale (SC-2, HUD-02)                                                                      | ✓ VERIFIED (deferral honored)          | `grep -c "GameOverScreen\|LivesDisplay" SightReadingGame.jsx` = 0. REQUIREMENTS.md HUD-02 struck through, marked **DEFERRED**, cross-references `01-CONTEXT.md` D-01/D-02; Traceability table shows `Phase —` / `Deferred`; Coverage counts it as the 1 deferred item. Matches 01-CONTEXT.md D-01/D-02/D-03 exactly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 3   | On-fire badge/splash celebration (`OnFireBadge`/`OnFireSplash`) at combo threshold, suppressed under `prefers-reduced-motion` (SC-3, HUD-03)                             | ✓ VERIFIED (with test-coverage caveat) | `OnFireBadge`/`OnFireSplash` imported and rendered (`SightReadingGame.jsx` L58-60, L3639-3646, L3877); one-shot `false->true` splash effect at L248-258 matches plan verbatim; both shared components read `useMotionTokens().reduce` (and `OnFireBadge` also `useAccessibility().reducedMotion`) internally — no reduced-motion prop passed from the game (`grep -c "reduced"` near the three HUD renders = 0). `OnFireSplash` placed at L3877, after the `<div className="relative">` (L3850) that wraps `SightReadingLayout` closes at L3875 — correctly a root-level sibling, not clipped inside the layout (D-08). **Caveat:** the integration test named "renders ComboPill + OnFireBadge + OnFireSplash…" (L318) never actually asserts the `OnFireSplash` element — only `ComboPill` text and `OnFireBadge`'s aria-label are checked (confirmed 01-REVIEW.md WR-03, still present). Functional wiring is present and logically sound by code inspection; the splash's actual on-screen appearance is unverified by any automated test. |
| 4   | All new HUD strings (combo, on-fire) render in Hebrew with RTL, 1:1 EN/HE parity, reusing `games.engagement` keys (SC-4, I18N-01)                                        | ✓ VERIFIED                             | `games.engagement.combo`/`onFire` present in both `src/locales/en/common.json` (L686, L693: "Combo"/"ON FIRE!") and `src/locales/he/common.json` (L686, L693: "קומבו"/"מדהים!"). No new locale keys added (`grep -q "games.engagement.combo"` and `"games.engagement.onFire"` both present in `SightReadingGame.jsx`, reusing existing keys only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

**Score:** 4/4 truths verified (1 with a test-coverage caveat noted above; deferral of SC-2/HUD-02 honored, not a failure)

### Required Artifacts

| Artifact                                                                  | Expected                                                            | Status                         | Details                                                                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `src/contexts/SightReadingSessionContext.jsx`                             | session-wide combo/isOnFire state + incrementCombo/resetCombo       | ✓ VERIFIED                     | Exists, substantive, wired (exported via memoized context value, consumed by `SightReadingGame.jsx`)                |
| `src/contexts/SightReadingSessionContext.test.jsx`                        | unit coverage of combo lifecycle + session-boundary reset semantics | ✓ VERIFIED                     | 6 test cases, all passing (`npx vitest run` confirmed)                                                              |
| `src/components/games/sight-reading-game/SightReadingGame.jsx`            | combo/on-fire HUD wiring + render                                   | ✓ VERIFIED                     | Imports, destructure, two record-site calls, HUD header render, root splash render all present and correctly placed |
| `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx` | integration coverage for live increment/reset + on-fire render      | ✓ VERIFIED (partial gap noted) | 4 test cases, all passing; on-fire render case does not assert `OnFireSplash` presence (WR-03)                      |

### Key Link Verification

| From                                                                                           | To                  | Via                                          | Status  | Details                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SightReadingSessionContext.jsx` `startSession`/`resetSession`                                 | combo reset         | `comboRef.current = 0` + `setCombo(0)`       | ✓ WIRED | Confirmed by direct read, L50-68; automated `verify.key-links` tool reported a false "Source file not found" (path-resolution issue in the tool, not a real gap) — manually confirmed via `Read` |
| `SightReadingGame.jsx handleNoteDetected` correct branch (~L1858, actual L1858-1882)           | `incrementCombo()`  | call after `recordPerformanceResult(result)` | ✓ WIRED | Confirmed L1881-1882; `incrementCombo` present in `handleNoteDetected` deps (L1969)                                                                                                              |
| `SightReadingGame.jsx schedulePerformanceTimeline` `tick()` miss branch (~L2135, actual L2160) | `resetCombo()`      | call after `recordPerformanceResult(missed)` | ✓ WIRED | Confirmed L2160-2161; `resetCombo` present in deps (L2212)                                                                                                                                       |
| context `isOnFire` false->true                                                                 | `OnFireSplash` show | local `showFireSplash` `useEffect`           | ✓ WIRED | Confirmed L248-258 and L3877 render                                                                                                                                                              |

(Note: `gsd-sdk query verify.key-links` returned `verified: false` / "Source file not found" for all 4 links above — this is a tool-path-resolution artifact, not a real defect. All 4 were manually confirmed WIRED via direct file reads.)

### Data-Flow Trace (Level 4)

| Artifact                     | Data Variable               | Source                                                                                                     | Produces Real Data                                                                                                                  | Status    |
| ---------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `ComboPill` (header)         | `combo`                     | `useSightReadingSession().combo`, driven by `incrementCombo()`/`resetCombo()` at live note-detection sites | Yes — combo increments/resets in response to real per-note scoring events (`recordPerformanceResult`), not a static/hardcoded value | ✓ FLOWING |
| `OnFireBadge`/`OnFireSplash` | `isOnFire`/`showFireSplash` | Same context `isOnFire`, derived from `comboRef.current >= ON_FIRE_THRESHOLD`                              | Yes — threshold-gated real transition, single-fire effect confirmed by code read                                                    | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior                                                                                                                     | Command                                                                                       | Result                                                                         | Status |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------ |
| Context combo lifecycle (init/increment/threshold/reset/session-boundary/persistence)                                        | `npx vitest run src/contexts/SightReadingSessionContext.test.jsx`                             | 6/6 passed                                                                     | ✓ PASS |
| Game-level combo/on-fire integration (correct-note increment, miss-window reset, cross-exercise persistence, on-fire render) | `npx vitest run src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx`      | 4/4 passed                                                                     | ✓ PASS |
| Mic-restart regression (unaffected by combo mock extension)                                                                  | `npx vitest run src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx` | 1/1 passed                                                                     | ✓ PASS |
| Full project suite regression                                                                                                | `npm run test:run`                                                                            | 89 files passed / 2 skipped (91), 1975 tests passed / 13 todo (1988), 0 failed | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan                  | Description                                        | Status                                    | Evidence                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| HUD-01      | 01-01-PLAN.md, 01-02-PLAN.md | Live session-wide combo counter, increments/resets | ✓ SATISFIED                               | Context state + wiring + tests confirmed above                                                     |
| HUD-02      | (none — deferred)            | Lives + GameOverScreen                             | ✓ SATISFIED (correctly deferred)          | REQUIREMENTS.md deferred entry matches 01-CONTEXT.md D-01/D-02; no lives/GameOverScreen code added |
| HUD-03      | 01-02-PLAN.md                | On-fire badge/splash, reduced-motion respected     | ✓ SATISFIED (test-coverage caveat, WR-03) | Wiring/placement confirmed; splash render itself untested                                          |
| I18N-01     | 01-02-PLAN.md                | EN+HE parity for new HUD strings                   | ✓ SATISFIED                               | Locale files confirmed both languages present, reused keys only                                    |

No orphaned requirements found: REQUIREMENTS.md's Phase 01 rows (HUD-01, HUD-02 deferred, HUD-03, I18N-01) all match the `requirements:` fields declared across both plans.

### Anti-Patterns Found

(Carried forward from `01-REVIEW.md`, cross-checked against current code — all three remain unresolved as of the latest commit `40da8294`, which is the review report itself with no follow-up fix commit.)

| File                              | Line      | Pattern                                                                                                                | Severity   | Impact                                                                                                                                                                                                                                                                                                           |
| --------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SightReadingGame.jsx`            | 726-752   | `abortPerformanceForPenalty()` never calls `resetCombo()` despite deducting `guessPenaltyRef` from score               | ⚠️ Warning | Combo/on-fire HUD can show an inflated/stale streak through and after an anti-cheat penalty modal, inconsistent with the score-side penalty. Not covered by any documented must-have/success-criteria, so not phase-blocking, but is a real state-consistency defect flagged by review and left unfixed (WR-01). |
| `SightReadingGame.jsx`            | 3639-3642 | `OnFireBadge` wrapper `<div aria-label=...>` has no `role` (unlike the adjacent `ComboPill` wrapper's `role="status"`) | ⚠️ Warning | A plain `<div>` (implicit role `generic`) is not guaranteed to expose `aria-label` to real assistive tech, undermining the HUD-03 "on-fire state should be announced" intent for screen-reader users, though Testing Library's `getByLabelText` still passes (WR-02).                                            |
| `SightReadingGame.combo.test.jsx` | 318-333   | Test named "renders ComboPill + OnFireBadge + OnFireSplash…" never queries for `OnFireSplash`                          | ⚠️ Warning | Test-quality gap — the splash-trigger code path (state + one-shot effect) is exercised by no automated assertion, so a future regression in the splash render/timeout would not be caught (WR-03).                                                                                                               |
| `SightReadingSessionContext.jsx`  | 12        | `ON_FIRE_THRESHOLD = 5` not exported via `SIGHT_READING_SESSION_CONSTANTS`; tests hardcode literal `5`                 | ℹ️ Info    | Low risk — if threshold changes, tests would silently assert the old value rather than fail loudly (IN-01).                                                                                                                                                                                                      |

No blocker-level anti-patterns found (matches 01-REVIEW.md's own `critical: 0` classification).

### Human Verification Required

### 1. On-fire splash visual/animation check

**Test:** Play sight-reading, build a 5-note correct combo, observe the HUD.
**Expected:** `OnFireBadge` flame icon appears next to `ComboPill`; a brief (1.5s) full-screen flame splash overlays the game.
**Why human:** Visual rendering/animation timing and feel are not verifiable by static analysis; the only automated test that claims to cover this (combo.test.jsx L318) does not actually assert the splash element (WR-03).

### 2. Reduced-motion suppression check

**Test:** Toggle OS `prefers-reduced-motion` (and/or the in-app accessibility toggle) and repeat the on-fire trigger.
**Expected:** Animations (pulse/scale/shake) are suppressed on `ComboPill`/`OnFireBadge`/`OnFireSplash`, matching the components' documented dual-source reduced-motion behavior.
**Why human:** Requires a live browser/OS setting; only the presence of the internal hook calls (`useMotionTokens`, `useAccessibility`) was confirmed statically.

### 3. Hebrew RTL layout check

**Test:** Switch locale to Hebrew and observe the combo/on-fire HUD pills in the header.
**Expected:** "קומבו" / "מדהים!" render correctly with no RTL clipping/truncation in the compact header row.
**Why human:** RTL visual layout cannot be verified via grep; only string presence in the locale JSON files was confirmed.

### 4. Anti-cheat penalty combo-reset decision (WR-01)

**Test:** Build a 5+ combo (on-fire active), then deliberately trigger the anti-cheat guess-penalty flow (rapid wrong inputs) and observe the HUD immediately after.
**Expected (per reviewer):** Combo/on-fire should reset to stay consistent with the score-side penalty; currently it does not (`resetCombo()` is not called in `abortPerformanceForPenalty`).
**Why human:** This is an explicit, still-open code review finding (01-REVIEW.md WR-01) that was never fixed or overridden. It doesn't fail any of the phase's four documented success criteria (none reference anti-cheat interaction), so it does not block the phase goal by the letter of the roadmap — but it is a real, reviewer-identified defect that needs an explicit accept/fix decision before considering the HUD "done," rather than being silently carried forward.

### Gaps Summary

No must-have truths failed. All four ROADMAP success criteria for Phase 01 are met by the codebase: live session-wide combo counter (SC-1), correctly deferred lives/game-over (SC-2/HUD-02), on-fire badge/splash with self-contained reduced-motion handling (SC-3), and EN/HE i18n parity via reused keys (SC-4). The full automated test suite is green (1975 passed, 0 failed) and the two new integration/unit test files exercise the described behaviors.

However, three code-review warnings (WR-01, WR-02, WR-03 in `01-REVIEW.md`) remain unresolved in the current commit and were not overridden — most notably WR-01, a real state-consistency defect (combo/on-fire not reset when the anti-cheat penalty flow aborts a performance). None of these fail a documented must-have, so this phase is not classified as `gaps_found`. But combined with three items that inherently require human/visual verification (splash appearance, reduced-motion feel, RTL layout), the phase is classified `human_needed` rather than a clean `passed`. A developer decision is requested on WR-01 specifically: accept as out-of-scope (and optionally add a verification override), or open a quick follow-up fix before closing the phase.

---

_Verified: 2026-07-09T20:38:20Z_
_Verifier: Claude (gsd-verifier)_
