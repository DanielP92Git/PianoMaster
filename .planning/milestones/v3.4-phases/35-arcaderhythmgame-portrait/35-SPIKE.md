# Phase 35 — ArcadeRhythmGame Portrait Spike

## Verdict: ROTATE-PROMPT

**Rationale:** Spike feel-test surfaced a mid-game orientation-change regression in the existing tile renderer (cached `laneHeightRef.current` does not refresh on viewport resize, causing visual and logical hit zones to diverge after rotation). Combined with owner uncertainty on subjective playability ("not sure how to write verdict"), D-07 tie-break applies and the safer path is ROTATE-PROMPT.

**Date:** 2026-05-12

**Decided by:** Project owner (per CONTEXT.md D-05 — kid testers deferred to post-beta)

---

## Test Surface

| Device profile                          | Viewport | Method                           | Patterns tested |
| --------------------------------------- | -------- | -------------------------------- | --------------- |
| iPhone SE portrait                      | 375×667  | Chrome DevTools device emulation | n/a — see note  |
| Larger phone portrait (e.g., iPhone 14) | 390×844  | Chrome DevTools device emulation | n/a — see note  |
| iPad portrait                           | 820×1180 | Chrome DevTools device emulation | n/a — see note  |

Spike instrument: `?spike-portrait` URL flag (Plan 35-02), gated on `import.meta.env.DEV`.

**Deviation from D-03:** Owner tested with Chrome DevTools device emulation rather than physical hardware. Acceptable for this spike because the chosen verdict (ROTATE-PROMPT) deliberately avoids shipping portrait — the bar for evidence is lower than it would be for a SHIP-VERTICAL verdict, where physical-device feel would be load-bearing.

**Pattern-length test note:** Plan 35-03's call for "2-bar" vs "4-bar" pattern tests did not apply cleanly to ArcadeRhythmGame, which generates one-measure patterns and cycles through 8 per session. The `?measures` URL helper used by Phase 34's non-arcade renderers (`src/components/games/rhythm-games/utils/measuresOverride.js`) is not wired into ArcadeRhythmGame. Tile-density variation is therefore observed across a normal 8-pattern session rather than via planner-style multi-bar selection.

---

## Observations

### What worked

- The `?spike-portrait` instrument behaves as designed: visiting `/rhythm-mode/arcade-rhythm-game?spike-portrait` on a portrait viewport does NOT show the rotate prompt (Plan 03 Task 1 step 3, "test 3 approved").
- The existing single vertical-lane renderer produces a recognizable portrait playfield at all three emulated viewport widths — no horizontal-spill failure mode was observed at static load.

### What didn't work

- **Mid-game rotation breaks the hit zone (Plan 03 Task 1 step 6, "test 6").** When the device rotates during play, the visual lane resizes but the tile-target-Y math keeps using the cached `laneHeightRef.current` from pattern start. Hit detection and visual tile fall path diverge until the next pattern starts. Repro: enter the game in portrait via `?spike-portrait`, rotate to landscape mid-pattern. Root cause: `ArcadeRhythmGame.jsx:603-604` caches lane height once on pattern start and never updates it.
- Owner could not produce a confident subjective verdict on portrait playability ("test 8 — not sure how to write verdict"). Per D-07, this uncertainty itself is the verdict trigger for ROTATE-PROMPT.

### Tile density at dense patterns (UI-SPEC primary failure mode)

Not specifically rated — the pattern-length test surface didn't apply to ArcadeRhythmGame's pattern shape (see Test Surface note). No "overwhelming" feedback was reported from the partial sessions that did run.

### Hit zone tap target (UI-SPEC Spacing Scale exception)

Not specifically rated for portrait. Not relevant for the rotate-prompt path — phone always plays in landscape under this verdict, where the existing `h-12` (48px) hit zone is the proven landscape sizing.

---

## Decision Criteria Check

- **D-04 (Subjective feel-test is the primary criterion):** Confirmed — owner attempted the subjective evaluation and reported uncertainty, which D-04 explicitly allows for and D-07 routes.
- **D-07 (On-the-fence defaults to ROTATE-PROMPT):** Used — verdict is ROTATE-PROMPT because (a) owner reported uncertainty on subjective playability and (b) a real mid-game orientation regression surfaced during the spike that would need additional Plan 04 scope to fix under SHIP-VERTICAL.

---

## Next Step

Plan 35-04 ships the rotate-prompt path per CONTEXT.md D-12:

- Remove `?spike-portrait` flag from `ArcadeRhythmGame.jsx` (the dev instrument is no longer needed once the production declaration is final).
- Make `useDeclareNeedsLandscape(viewportWidth < 768)` — true on phone (<768, shows rotate prompt via Phase 34's `NeedsLandscapeContext`), false on tablet (≥768, plays in any orientation per D-09).
- Replace the Phase 35 TODO comment block at lines ~122–127 (and the related "W2 Android PWA regression guard" comment) with a permanent comment citing this 35-SPIKE.md file and the ROTATE-PROMPT decision rationale.
- Single-commit shipping change.

### Follow-up (out of scope for Plan 04)

The mid-game rotation regression (`laneHeightRef.current` not refreshing on resize) is documented here for traceability but is NOT a Phase 35 ship-blocker once ROTATE-PROMPT is in place — under the rotate-prompt path, phone players never enter the game from portrait, so the mid-game flip is far less likely to be triggered (and tablet players can already handle the wider landscape geometry). A future polish phase should still patch `ArcadeRhythmGame.jsx:603-604` to update `laneHeightRef.current` on a resize/orientationchange listener so the bug is closed off for tablet rotation too.

---

_Phase: 35-ArcadeRhythmGame Portrait_
_Spike completed: 2026-05-12_
_Plan: 35-03_
