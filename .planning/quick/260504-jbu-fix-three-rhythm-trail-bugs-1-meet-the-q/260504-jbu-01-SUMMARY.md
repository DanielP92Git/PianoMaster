---
phase: 260504-jbu
plan: 01
subsystem: rhythm-games
tags: [bug-fix, mobile-landscape, audio, metronome, kodaly-syllables, i18n]
requirements:
  - BUG-1 (mobile-landscape "Meet the X" intro card overflow)
  - BUG-2 (syllable-matching renders two "ta" cards on q-correct quizzes)
  - BUG-3 (notation tap metronome silent + visual beat stuck on 1)
key-files:
  modified:
    - src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx
    - src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx
    - src/components/games/rhythm-games/utils/durationInfo.js
    - src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx
  created:
    - src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx (regression test added inline)
decisions:
  - Re-declared Hebrew Nikud syllable strings inline in durationInfo.js rather than importing from rhythmVexflowHelpers.js (which imports VexFlow and is browser-only). Kept durationInfo.js Node-safe for scripts/validateTrail.mjs.
  - Hebrew "ti-ti" falls back to the English override; flagged for follow-up Nikud confirmation per memory.md.
  - Mirrored MetronomeTrainer's exact metronome pattern (50ms cadence + setTimeout-deferred visual loop + isReady() polling) rather than refactoring to share code, to keep the fix narrow.
metrics:
  duration: ~30min
  completed: 2026-05-04
  commits: 4
  tests_added: 1
  tests_passing: 44/44 rhythm-games suite
---

# Plan 260504-jbu-01: Fix Three Rhythm Trail Bugs Summary

Three localized rhythm-trail UX bugs fixed: a mobile-landscape layout overflow on the "Meet the X" intro card, a syllable-collision rendering bug producing two identical "ta" cards on quarter-note quizzes, and a silent/stuck metronome on the notation tap game. All three fixes are in-place edits with no new dependencies and no architectural changes — the metronome fix mirrors an already-working sibling (MetronomeTrainer).

## Commits

| #   | Hash      | Message                                                                                 |
| --- | --------- | --------------------------------------------------------------------------------------- |
| 1   | `363648b` | fix(260504-jbu): make DiscoveryIntroQuestion landscape-aware (bug 1)                    |
| 2   | `b80e3e5` | test(260504-jbu): add failing test for syllable-matching '8_pair' collision (bug 2 RED) |
| 3   | `cbab10c` | fix(260504-jbu): unify syllable lookup so 8_pair never collides with ta (bug 2 GREEN)   |
| 4   | `ecc1e64` | fix(260504-jbu): mirror MetronomeTrainer's metronome flow in RhythmTapQuestion (bug 3)  |

Bug 2 followed TDD (RED → GREEN). Bug 1 and Bug 3 were single-commit fixes (existing tests cover behavior; lint-staged auto-formatted on each commit).

## What Changed

### Bug 1 — DiscoveryIntroQuestion landscape-aware

`src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx`

The renderer was destructuring `isLandscape: _isLandscape` (alias to underscore meant "ignored"). Renamed to `isLandscape` and applied conditional Tailwind classes:

- **Portrait (unchanged):** `max-w-sm`, `flex-col`, `gap-5`, `px-8 py-10`, SVG `h-40 w-28`, `text-xl` title, `text-2xl` name, `py-4 text-lg` Got it button.
- **Landscape (new):** `max-w-2xl`, `flex-row`, `gap-6`, `px-6 py-4`, SVG `h-24 w-16` on the left, right column flex-stack with `text-lg` title, `text-xl` name, `py-2.5 text-base` Got it. Listen button drops to `px-4 py-2 self-start`.

Used `display: contents` (Tailwind `contents`) on the right-column wrapper in portrait mode so children participate directly in the parent flex column — keeps both modes from a single component without duplicating the JSX tree. The title is built before the SVG block so screen-reader DOM order is `<h2>` → name → syllable → buttons in both layouts.

No logic changes (`playDemo`, `handleGotIt`, `useAudioEngine` setup, `info`/`SvgIcon` derivations, the `if (!info || !SvgIcon) return null` guard — all untouched).

### Bug 2 — Unified syllable lookup

Two divergent `getSyllable` implementations had drifted:

- `durationInfo.getSyllable()` honored `info.syllable = "ti-ti"` on the `8_pair` entry.
- `SyllableMatchingQuestion`'s inline lookup keyed only on `info.durationUnits`. Since `8_pair` has `durationUnits: 4`, it rendered as `SYLLABLE_MAP_EN[4] = "ta"` — colliding with `q`'s "ta" when both were on screen.

Fix:

`src/components/games/rhythm-games/utils/durationInfo.js`

- Extended `getSyllable(code, language = "en")` to accept a language.
- Added inline `SYLLABLE_BY_UNITS_HE` and `REST_HE = "הָס"` (re-declared verbatim from `rhythmVexflowHelpers.SYLLABLE_MAP_HE` / `REST_SYLLABLE_HE`). Did NOT import — `rhythmVexflowHelpers` imports VexFlow (browser-only), and `durationInfo.js` is consumed by `scripts/validateTrail.mjs` in Node.
- Resolution order: rest → REST map; per-entry `info.syllable` override (with `info.syllableHe` if present); otherwise `SYLLABLE_BY_UNITS[He]` by `durationUnits`.
- Hebrew fallback: when `language === "he"` and `info.syllable` exists but `info.syllableHe` is absent, returns the English override. This is intentional: prevents `8_pair` from rendering as `"טָה"` (Hebrew "ta", colliding with the correct answer).

`src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx`

- Imports `getSyllable as getDurationSyllable` from `utils/durationInfo`.
- Inline `getSyllable` is now a thin wrapper: `getDurationSyllable(code, i18n.language) || code`.
- Removed unused imports of `SYLLABLE_MAP_EN/HE`, `REST_SYLLABLE_EN/HE` from `rhythmVexflowHelpers`.

`generateQuestions` signature unchanged — its dedup pass uses English keys (a stable uniqueness check, not a display check), which is correct.

Regression test added in `SyllableMatchingQuestion.test.jsx`:

- Asserts `8_pair` distractor renders as `"ti-ti"` (not `"ta"`) when correct is `"q"`.
- Asserts all four cards have distinct text.
  Confirmed RED (failed before fix) → GREEN (passes after fix).

### Bug 3 — Mirror MetronomeTrainer in RhythmTapQuestion

`src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx`

Two coupled root causes:

1. **Visual beat stuck on 1.** The visual `setInterval` ran immediately while `metronomeStartTimeRef.current = audioCtx.currentTime + 0.3`. For ~300ms `timeSinceStart` was negative; `Math.floor(-x) = -1`, `(-1 % 4) = -1`, `beatInMeasure = 0` → `MetronomeDisplay` rendered no highlighted circle.
2. **Silent count-in.** `createClickSound` early-returns when `audioContextRef`/`gainNodeRef` aren't set. `useAudioEngine.initializeAudioContext` is async, so the first scheduled clicks could be silently dropped before the engine reached ready state.

Fix mirrors `MetronomeTrainer.startContinuousMetronome` (lines 359–516):

- **`startFlow`:**
  - Explicitly `await audioEngine.initializeAudioContext?.()` before `resumeAudioContext()` (idempotent — the hook checks the ref first, but guarantees `gainNodeRef` is set).
  - Poll briefly (`10 × 20ms`) for `audioEngine.isReady()` after the warmup oscillator block. If still not ready, fail soft with `onComplete(0, 1)` rather than letting the lesson silently hang.
  - `countInStartTime`: `+ 0.3s` → `+ 0.1s` (matches `MetronomeTrainer`; the larger gap was needlessly enlarging the negative-`timeSinceStart` window).
- **`startContinuousMetronome`:**
  - Audio scheduling cadence: `200ms` → `50ms` (matches `MetronomeTrainer`; better stop responsiveness).
  - Visual loop deferred via `setTimeout(firstBeatDelay, …)` so `updateVisualBeat` first runs once `startTime` has arrived. Belt-and-braces `Math.max(0, timeSinceStart)` clamp guarantees `beatInMeasure ≥ 1` even if `setTimeout` fires a hair early.
  - Inside the deferred `setTimeout`, bail if `continuousMetronomeRef.current === null` (i.e., cleanup already ran during count-in). Prevents stray visual loops when the user backs out of the question.

External contract of `startContinuousMetronome` unchanged. `createClickSound`, `evaluatePerformance`, `handleTap`, `handlePressStart`/`handlePressEnd`, `registerFirstOnset`, the hold-mechanic logic, and pattern-playback piano scheduling are all untouched.

Sanity greps (post-commit):

- `+ 0.3` in `RhythmTapQuestion.jsx`: 0 matches ✓
- `, 200)` in `startContinuousMetronome`: 0 matches (one match remains in `setIsHoldComplete` setTimeout — unrelated to scheduler) ✓
- `firstBeatDelay`: 2 matches (definition + use) ✓

## Test Results

```
npx vitest run src/components/games/rhythm-games/renderers
  → 5 files, 37 tests passed

npx vitest run src/components/games/rhythm-games/__tests__/SyllableMatchingGame.test.jsx
  → 1 file, 7 tests passed

Total rhythm-games suite: 44/44 passing
```

```
npm run verify:trail  → PASS (durationInfo.js stayed Node-safe; no VexFlow leak)
npm run lint           → 1 pre-existing parse error in ParentZoneEntryCard.test.jsx (out-of-scope, deferred)
                          0 new warnings/errors in modified files
```

## Deviations from Plan

### None — plan executed exactly as written.

The TDD cycle for Bug 2 produced the expected RED → GREEN sequence. Bug 1 and Bug 3 implementations matched the plan's specs verbatim.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access, or trust-boundary schema changes.

## Follow-ups

1. **Hebrew "ti-ti" Nikud (deferred per memory.md).** `getSyllable("8_pair", "he")` currently returns the English `"ti-ti"` because Hebrew Nikud diacritics require user-confirmed strings before being added. When approved (likely something like `"טִי-טִי"` with proper Nikud), add `syllableHe: "..."` to the `8_pair` entry in `durationInfo.js`. Logged in `deferred-items.md`.

2. **Pre-existing lint error (out-of-scope).** `src/components/settings/ParentZoneEntryCard.test.jsx:32:42` has a pre-existing `await outside async function` parse error unrelated to this plan. Logged in `deferred-items.md` for next milestone's quality pass.

## Self-Check: PASSED

- File `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx`: FOUND
- File `src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx`: FOUND
- File `src/components/games/rhythm-games/utils/durationInfo.js`: FOUND
- File `src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx`: FOUND
- File `src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx`: FOUND
- Commit `363648b`: FOUND in git log
- Commit `b80e3e5`: FOUND in git log
- Commit `cbab10c`: FOUND in git log
- Commit `ecc1e64`: FOUND in git log
- 44/44 rhythm-games tests passing
- `verify:trail` passes (durationInfo.js still Node-safe)
- No deletions in `git diff e5465d1..HEAD`
