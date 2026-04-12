---
phase: 22-service-layer-trail-wiring
verified: 2026-04-12T14:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "PulseQuestion: Play through Unit 1 Node 1 and confirm the pulsing circle appears without any staff lines or notation, and that tapping with the beat records on-time taps"
    expected: "Child sees a pulsing circle that beats at 65 BPM; tapping anywhere on screen during PLAYING phase registers taps; onComplete fires with (number, number) at end of 16 beats"
    why_human: "Audio timing, visual animation, and tap-detection require a running browser with Web Audio API — cannot be verified by static analysis or test mocks"
  - test: "MixedLessonGame: Play a pulse question followed by a rhythm_tap question and confirm state advances correctly between them"
    expected: "After pulse question completes, the rhythm_tap question loads without any double-advance or missed animation. Score accumulates correctly across both question types."
    why_human: "The code review (22-REVIEW.md HR-01) flagged a potential stale-closure bug in handleRhythmTapComplete that may cause wrong question advancement under specific timing conditions — cannot be exercised by unit tests"
  - test: "ArcadeRhythmGame: Play a speed-round node and confirm the end-of-pattern score does not exceed 100"
    expected: "Pattern score is between 0 and 100 (inclusive), not inflated by rest tiles being counted as hits"
    why_human: "22-REVIEW.md HR-02 flagged an over-counting bug where rest tiles in scoredRef inflate hitCount above nonRestCount. Score cap behavior requires a live game session to reproduce."
---

# Phase 22: Service Layer & Trail Wiring Verification Report

**Phase Goal:** Wire the Phase 21 curated pattern library into all 56 rhythm nodes via a new RhythmPatternGenerator module, replace duration allowlists with pattern tags, add a pulse exercise to Unit 1 Node 1, convert all node exercise types to match the Phase 20 audit, and extend the build validator to enforce pattern correctness and game-type policy.
**Verified:** 2026-04-12T14:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                                                       | Status   | Evidence                                                                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `RhythmPatternGenerator.js` exposes `resolveByTags()` and `resolveByIds()` and all 56 rhythm node configs use `patternTags` instead of `rhythmPatterns` duration allowlists | VERIFIED | `src/data/patterns/RhythmPatternGenerator.js` exports all 3 functions (lines 34, 156, 186). All 8 unit files have exactly 7 `patternTags:` entries (56 total). Zero `patterns:` fields remain in any unit file.                                        |
| 2   | Unit 1 Node 1 delivers a pulse exercise where the child taps with the metronome beat and sees no music notation                                                             | VERIFIED | `rhythmUnit1Redesigned.js` lines 72-73 show `{ type: "pulse" }, { type: "pulse" }` at start of question sequence. `PulseQuestion.jsx` (480 lines) has no VexFlow/Stave/Renderer import. File comment: "No music notation, no staff lines, no VexFlow." |
| 3   | A child playing a Discovery node only ever encounters patterns containing durations they have already learned (enforced at build time)                                      | VERIFIED | `validateDurationSafety()` runs in `verify:trail` and calls `resolveByTags([tag], rc.durations, {timeSignature})` for every node. Output: "Duration safety: OK". Build passes cleanly.                                                                 |
| 4   | Running `npm run build` fails with a clear error if any node config references a pattern tag that does not exist in `rhythmPatterns.js`                                     | VERIFIED | `validatePatternTagExistence()` function exists in `validateTrail.mjs` (line 452), imports `RHYTHM_PATTERNS`, checks all patternTags. "Pattern tag existence: OK" in verify:trail output. Build fails on bad tags per Plan 05 design.                  |
| 5   | Running `npm run build` passes cleanly when all pattern references are valid                                                                                                | VERIFIED | `npm run build` exits 0 (confirmed). `npm run verify:trail` exits 0 with all four new checks showing OK.                                                                                                                                               |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                                                                       | Expected                                          | Status   | Details                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/patterns/RhythmPatternGenerator.js`                                  | resolveByTags, resolveByIds, binaryToVexDurations | VERIFIED | 199 lines, all 3 functions exported, imports only `./rhythmPatterns.js`, Node-safe (confirmed via `node --input-type=module`)                                                                                                                            |
| `src/data/patterns/RhythmPatternGenerator.test.js`                             | Unit tests, min 100 lines                         | VERIFIED | 209 lines, 27 tests across 3 describe blocks, all passing                                                                                                                                                                                                |
| `src/components/games/rhythm-games/renderers/PulseQuestion.jsx`                | Pulse renderer, min 100 lines                     | VERIFIED | 480 lines, exports `PulseQuestion`, glass card styling, pulsing circle (`rounded-full`), audio engine wired, `onComplete` called with (number, number)                                                                                                   |
| `src/components/games/rhythm-games/renderers/__tests__/PulseQuestion.test.jsx` | PulseQuestion tests, min 40 lines                 | VERIFIED | 195 lines, 9 tests, all passing                                                                                                                                                                                                                          |
| `src/data/units/rhythmUnit1Redesigned.js`                                      | 7 migrated nodes with patternTags                 | VERIFIED | 7 patternTags, 0 old patterns fields, 0 rhythmPatterns fields, pulse questions confirmed                                                                                                                                                                 |
| `src/data/units/rhythmUnit2Redesigned.js`                                      | 7 migrated nodes with patternTags                 | VERIFIED | 7 patternTags, 0 old patterns fields                                                                                                                                                                                                                     |
| `src/data/units/rhythmUnit3Redesigned.js`                                      | 7 migrated nodes with patternTags                 | VERIFIED | 7 patternTags, 0 old patterns fields                                                                                                                                                                                                                     |
| `src/data/units/rhythmUnit4Redesigned.js`                                      | 7 migrated nodes with patternTags                 | VERIFIED | 7 patternTags, 0 old patterns fields                                                                                                                                                                                                                     |
| `src/data/units/rhythmUnit5Redesigned.js`                                      | 7 migrated nodes with patternTags                 | VERIFIED | 7 patternTags, 0 old patterns fields. `three-four` tag only on rhythm_5_3 which has `timeSignature: '3/4'` (correct).                                                                                                                                    |
| `src/data/units/rhythmUnit6Redesigned.js`                                      | 7 migrated nodes with patternTags                 | VERIFIED | 7 patternTags, 0 old patterns fields. `boss_rhythm_6` retains ARCADE_RHYTHM (correct per audit).                                                                                                                                                         |
| `src/data/units/rhythmUnit7Redesigned.js`                                      | 7 migrated nodes with patternTags                 | VERIFIED | 7 patternTags, 0 old patterns fields. `rhythm_7_4` `focusDurations: []` at line 211. `contextDurations: ['qd', 'q', '8']` confirmed.                                                                                                                     |
| `src/data/units/rhythmUnit8Redesigned.js`                                      | 7 migrated nodes with patternTags                 | VERIFIED | 7 patternTags, 0 old patterns fields. `boss_rhythm_8` retains 3x ARCADE_RHYTHM. `six-eight` tag correctly removed.                                                                                                                                       |
| `scripts/validateTrail.mjs`                                                    | 4 new check functions                             | VERIFIED | `validatePatternTagExistence`, `validatePatternTagCoverage`, `validateDurationSafety`, `validateGameTypePolicy` all present. Both new imports (`RHYTHM_PATTERNS`, `resolveByTags`) at lines 17-18. All 4 called in main execution block (lines 601-604). |

### Key Link Verification

| From                                                     | To                                                                  | Via                                                                         | Status | Details                                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `src/data/patterns/RhythmPatternGenerator.js`            | `src/data/patterns/rhythmPatterns.js`                               | `import { RHYTHM_PATTERNS }`                                                | WIRED  | Line 9: `import { RHYTHM_PATTERNS } from './rhythmPatterns.js'`                                               |
| `src/components/games/rhythm-games/MixedLessonGame.jsx`  | `src/components/games/rhythm-games/renderers/PulseQuestion.jsx`     | import + case 'pulse' in renderQuestion switch                              | WIRED  | Line 18: import; line 167: `entry.type === "pulse"`; line 389: `case "pulse":` rendering `<PulseQuestion>`    |
| `src/data/constants.js`                                  | `scripts/validateTrail.mjs`                                         | PULSE: "pulse"                                                              | WIRED  | `constants.js` line 43: `PULSE: "pulse"`. Validator imports EXERCISE_TYPES (line 15 of validateTrail.mjs).    |
| `scripts/validateTrail.mjs`                              | `src/data/patterns/rhythmPatterns.js`                               | `import { RHYTHM_PATTERNS }`                                                | WIRED  | Line 17 of validateTrail.mjs                                                                                  |
| `scripts/validateTrail.mjs`                              | `src/data/patterns/RhythmPatternGenerator.js`                       | `import { resolveByTags }`                                                  | WIRED  | Line 18 of validateTrail.mjs                                                                                  |
| `src/components/games/rhythm-games/MixedLessonGame.jsx`  | `src/components/games/rhythm-games/RhythmPatternGenerator.js` (old) | VEX_TO_OLD_NAME bridge; buildRhythmTapConfig maps durations to legacy names | WIRED  | Line 32: `VEX_TO_OLD_NAME` constant; line 145: translation for backward compat with RhythmTapQuestion         |
| `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` | `src/data/skillTrail.js`                                            | `getNodeById` reads `node.rhythmConfig.durations`                           | WIRED  | Line 15: `import { getNodeById }`; line 129: `const durations = node?.rhythmConfig?.durations` inside useMemo |

### Behavioral Spot-Checks

| Behavior                                      | Command                                                           | Result                                                                                                     | Status |
| --------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| All new validator checks pass                 | `npm run verify:trail`                                            | All 4 new checks show "OK"; exits 0                                                                        | PASS   |
| All 27 RhythmPatternGenerator unit tests pass | `npx vitest run src/data/patterns/RhythmPatternGenerator.test.js` | 27/27 passed                                                                                               | PASS   |
| All 9 PulseQuestion unit tests pass           | `npx vitest run .../renderers/__tests__/PulseQuestion.test.jsx`   | 9/9 passed                                                                                                 | PASS   |
| Full test suite (1579 tests, 57 files) passes | `npm run test:run`                                                | 57 passed, 0 failed (8 pre-existing unhandled errors from ArcadeRhythmGame audio mock — predates phase 22) | PASS   |
| Production build completes                    | `npm run build`                                                   | Exits 0; prebuild validator passes; Vite build completes in ~72s                                           | PASS   |
| RhythmPatternGenerator is Node-safe           | `node --input-type=module`                                        | Loads cleanly; exports [binaryToVexDurations, resolveByIds, resolveByTags] as functions                    | PASS   |

### Requirements Coverage

| Requirement | Source Plan  | Description                                                                                                              | Status    | Evidence                                                                                                                                                                                                                                                                                                                      |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CURR-05     | 22-02        | Unit 1 Node 1 includes a pulse exercise (tap with beat, no notation)                                                     | SATISFIED | `PULSE: "pulse"` in constants.js; PulseQuestion renderer created with no notation; rhythm_1_1 starts with 2x pulse questions; MixedLessonGame routes "pulse" to PulseQuestion                                                                                                                                                 |
| PAT-03      | 22-03, 22-04 | Node configs use `patternTags` instead of `rhythmPatterns` duration allowlist                                            | SATISFIED | All 56 rhythm nodes across 8 unit files have `patternTags:`, zero `patterns:` fields remain, zero exercise-level `rhythmPatterns:` fields remain                                                                                                                                                                              |
| PAT-04      | 22-01        | `resolveByTags()`/`resolveByIds()` resolve curated patterns by tags/IDs via synchronous JS import (not async JSON fetch) | SATISFIED | `src/data/patterns/RhythmPatternGenerator.js` is synchronous, Node-safe, imports only `./rhythmPatterns.js`. Note: `RhythmTapQuestion` continues to use the old async `getPattern()` via VEX_TO_OLD_NAME bridge — this is the intentional backward-compat design documented in RESEARCH.md ("Old generator: Existing (keep)") |
| PAT-05      | 22-01, 22-05 | Children only see patterns containing durations they have already learned                                                | SATISFIED | Duration safety check in `validateDurationSafety()` calls `resolveByTags([tag], rc.durations)` for each node and fails the build if null is returned. "Duration safety: OK" confirmed. At runtime, VEX_TO_OLD_NAME bridge passes only the node's allowed durations to the old generator's `allowedPatterns` constraint.       |
| PAT-06      | 22-05        | `validateTrail.mjs` checks pattern ID/tag existence, tag coverage, and complexity bounds at build time                   | SATISFIED | Four new functions: `validatePatternTagExistence` (hard error), `validatePatternTagCoverage` (warning), `validateDurationSafety` (hard error), `validateGameTypePolicy` (hard error). All registered in main execution block. All pass with current codebase.                                                                 |

### Anti-Patterns Found

| File                                                     | Line    | Pattern                                                                                                           | Severity | Impact                                                                                                                                                                                                                                   |
| -------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/games/rhythm-games/MixedLessonGame.jsx`  | 289-305 | `handleRhythmTapComplete` reads `currentIndex` from stale closure; no `gameState` guard at entry point            | Warning  | Potential wrong-question-advancement if PulseQuestion fires onComplete twice or renders stale index. See 22-REVIEW.md HR-01. Bug exists in pre-phase-22 code; phase 22 added pulse which surfaces the risk more.                         |
| `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` | 617-624 | `scoredRef.current.size` includes rest tiles; `hitCount` can exceed `nonRestCount` → score > 100                  | Warning  | Inflated scores in arcade mode. See 22-REVIEW.md HR-02. Pre-existing bug made more likely by migration since all arcade nodes now always have duration lists.                                                                            |
| `scripts/validateTrail.mjs`                              | 562     | `validateGameTypePolicy` filters `if (node.category !== 'rhythm') continue` — skips boss-category mini-boss nodes | Warning  | `boss_rhythm_1` through `boss_rhythm_7` (category: 'boss', nodeType: MINI_BOSS) are not checked by game-type policy. Currently they all use MIXED_LESSON correctly, but a future regression would not be caught. See 22-REVIEW.md MD-01. |
| `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` | 46-57   | `VEX_TO_OLD_NAME` duplicated identically in ArcadeRhythmGame and MixedLessonGame                                  | Info     | DRY violation. No functional impact now; future drift risk. See 22-REVIEW.md LW-01.                                                                                                                                                      |
| `src/data/patterns/RhythmPatternGenerator.js`            | 57-117  | `binaryToVexDurations` maps `qd` rest to `hr` (8 slots) not `qdr` (6 slots) — approximate rest                    | Info     | Slot-sum drift for dotted-quarter patterns. Covered by slot-sum invariant tests but dotted-quarter rest accuracy not exact. See 22-REVIEW.md MD-04.                                                                                      |

### Human Verification Required

**1. PulseQuestion: Live beat-tap test**

**Test:** Open app, navigate to Trail, start Unit 1 Node 1. Confirm the question screen shows a large pulsing circle (no staff lines, no notation). Tap repeatedly with the metronome beat during the 16-beat PLAYING phase.
**Expected:** Circle pulses visually on each beat. Taps within timing threshold are counted as on-time. After 16 beats, onComplete fires and the next question (rhythm_tap) appears.
**Why human:** Audio timing, CSS animation sync, and tap-detection via Web Audio API timestamps cannot be exercised by JSDOM test mocks. The 9 unit tests cover render contract only.

**2. MixedLessonGame: pulse→rhythm_tap question advance**

**Test:** Play Unit 1 Node 1 through both pulse questions and confirm the first rhythm_tap question loads correctly afterward.
**Expected:** State advances cleanly: pulse (×2) → rhythm_tap appears with correct question. No double-advance, no freeze.
**Why human:** Code review HR-01 flagged a stale-closure risk in `handleRhythmTapComplete`. While the bug requires specific timing conditions (double onComplete call), it cannot be ruled out without a real audio context and React render cycle.

**3. ArcadeRhythmGame: score cap check**

**Test:** Play any speed-round (arcade) node (e.g., rhythm_1_6). Let a full pattern complete — including rest tiles passing the hit zone.
**Expected:** The end-of-pattern score displayed is between 0 and 100 (not e.g. 267 or 300).
**Why human:** Code review HR-02 identified that rest tiles are added to `scoredRef` and counted in `hitCount`, which can exceed `nonRestCount`. Live play is needed to observe whether the score display exceeds 100%.

### Gaps Summary

No structural gaps blocking phase goal achievement. All 5 ROADMAP success criteria are satisfied. The three human verification items relate to runtime behavior that automated checks cannot cover:

1. Live audio/tap interaction in PulseQuestion (functional but untestable without a browser)
2. Potential stale-closure bug in pulse→rhythm_tap question transition (code review finding HR-01, risk low but unverified at runtime)
3. Potential score-inflation bug in ArcadeRhythmGame after rest-tile counting (code review finding HR-02, pre-existing issue)

If all three human tests pass, phase status upgrades to `passed`. If HR-01 or HR-02 manifests, they should be filed as bugs against phase 23 or as hotfixes — they are pre-existing implementation risks that Phase 22 surfaced, not newly introduced regressions from Phase 22 changes.

---

_Verified: 2026-04-12T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
