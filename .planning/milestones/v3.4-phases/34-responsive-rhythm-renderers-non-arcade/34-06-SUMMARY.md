---
phase: 34-responsive-rhythm-renderers-non-arcade
plan: 06
status: gaps_found
verified: 2026-05-10
verification_artifact: 34-UAT.md
---

# Plan 34-06 — Manual UAT Gate (gaps found)

## Outcome

Manual UAT walkthrough was performed by the user against the dev server. Most criteria passed, but **3 distinct gap categories** prevent phase ship:

### Gap 1 — SC #1 fails in Free Game mode (passes in Trail mode)

**What:** `/rhythm-mode/rhythm-dictation-game` entered via the **Free Game** UI does NOT render the 3-card 2×2 dictation layout. It shows 3 separate stacked cards each containing its own staff (no prompt text, no Listen button, no choice grid).

**Trail entry (passes):** The same renderer correctly shows prompt + Listen button + 2×2 grid with col-span-2 third card (image-1.png).

**Free Game entry (fails):** Three vertically stacked cards, no 2×2 grid (image.png).

**Likely cause:** Free Game route bypasses the dictation question shape that Trail provides via `nodeConfig`. Either the renderer receives different props, or Free Game uses a legacy code path that was not updated in Plan 34-04.

**Screenshots:** image.png (free mode) + image-1.png (trail mode).

**Affected requirement:** CORE-01 / NOTATION-01.

### Gap 2 — Long-pattern variants cannot be exercised from the UI (UAT methodology gap)

**What:** SC #2 sub-tests `reading long → prompt`, `tap long → prompt`, `mixed-lesson swap (long↔short)` and SC #3 rows `rhythm-reading-game (long)` + `rhythm-tap-game (long)` are **all untestable** because no UI affordance forces a long pattern. Tester is at the mercy of the random pattern picker.

**Plan gap:** Plan 34-06 assumed long patterns could be loaded via "1-measure 4/4 exercise" vs "4-measure 4/4 exercise" but never specified the route/interaction to do that.

**Options for gap closure:**

- (a) Identify trail nodes that deterministically use long patterns, document them in UAT instructions
- (b) Add a dev-mode debug toggle (e.g., `?forceLongPattern=1` URL param) to force long-pattern selection
- (c) Add a Settings option for "pattern length" (full feature, larger scope)

Option (a) is the cheapest and aligns with how Phase 34 ships are validated (per RESEARCH § Validation Architecture).

**Affected requirements:** CORE-02, CORE-03, INFRA-04 (in part — short pattern path validates the helper; long pattern path is the missing leg).

### Gap 3 — RhythmGameSetup + RhythmGameSettings fail SC #5 across all 4 quadrants

**What:** User marked both components as fail at every quadrant.

- `RhythmGameSetup` was deferred per D-10 (delegates to UnifiedGameSettings) — yet it still surfaces visible quadrant issues.
- `RhythmGameSettings` was supposed to ship D-18 glass conversion in Plan 34-05 — the conversion may not be visually validated, or has rendering issues across quadrants.

**Open questions for the user / gap-closure researcher:**

- What specifically fails in each (layout overflow? glass not applied? unstyled? unreachable controls?)
- Did the Settings cog actually open the converted RhythmGameSettings, or is the user seeing the legacy Modal-style version?

**Affected requirements:** WRAPPER-02 (setup), D-18 (settings glass).

## What passed

- SC #2 short-pattern routes: phone-portrait shows NO rotate prompt overlay ✓
- SC #3 tablet rows for short/no-pattern routes: rotate overlay never appears ✓
- SC #4 tablet-landscape: dictation/syllable/visual-recognition cards fill width as real 2-col ✓
- SC #5 5 supporting overlays (CountdownOverlay, BossIntroOverlay, FloatingFeedback, MetronomeDisplay, TapArea) pass all 4 quadrants ✓
- Regression check: all 6 non-rhythm routes still surface rotate prompt on phone-portrait (Pitfall 1 honored) ✓
- Pre-UAT gate: tests 1676/1676 pass, build green, lint Phase 34 scope clean ✓

## Recommendation

Route to gap closure: `/gsd-plan-phase 34 --gaps`

Suggested gap-closure plan structure:

- **Gap-01**: Diagnose + fix Free Game dictation entry path (likely a wrapper / Setup flow that skips dictation question shape)
- **Gap-02**: Document deterministic long-pattern trail nodes in UAT instructions OR ship a dev-mode debug switch
- **Gap-03**: Diagnose RhythmGameSetup + RhythmGameSettings quadrant failures; user-supplied screenshots/notes will scope this

## Artifact

See `34-UAT.md` for the full filled walkthrough log with per-criterion results.
