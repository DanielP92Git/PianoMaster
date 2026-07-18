---
status: resolved
phase: 01-engagement-hud-parity
source: [01-VERIFICATION.md]
started: 2026-07-09T20:39:53Z
updated: 2026-07-10T00:20:00Z
---

## Current Test

All items resolved.

## Tests

### 1. On-fire splash visual/animation check

expected: `OnFireBadge` flame icon appears next to `ComboPill` in the header; a brief (1.5s) full-screen flame splash overlays the game when a 5-note correct combo is built, matching NotesRecognitionGame's on-fire feel.
result: PASS — approved as originally shipped.

### 2. Reduced-motion suppression check

expected: Toggling OS/in-app `prefers-reduced-motion` and repeating the on-fire trigger suppresses pulse/scale/shake animations on `ComboPill`/`OnFireBadge`/`OnFireSplash`, per the shared components' dual-source reduced-motion handling.
result: ISSUE FOUND & FIXED — reviewer's actual complaint was that the full-screen `OnFireSplash` rendered in front of the staff regardless of motion setting. Removed `OnFireSplash` entirely from `SightReadingGame.jsx`; on-fire is now indicated only by `OnFireBadge` in the HUD header (commit `d06a6185`).

### 3. Hebrew RTL layout check

expected: Switching to Hebrew (he) locale and playing through a combo/on-fire sequence renders "קומבו" and "מדהים!" correctly with RTL layout, no truncation/clipping in the header pill row.
result: PASS (clarified, no change) — "קומבו"/"מדהים!" were never intended as visible on-screen text; they're only the `aria-label` on the pill wrapper (screen-reader only), matching `NotesRecognitionGame`'s identical treatment of the same shared `ComboPill` component (D-07). Not a regression from this phase. Developer confirmed: leave as aria-only, matching sibling parity — no code change.

### 4. Anti-cheat penalty combo-reset decision (WR-01)

expected: Building a combo of 5+ (on-fire active), then deliberately triggering the anti-cheat guess-penalty flow (rapid wrong keyboard/mic inputs) — decide whether the current shipped behavior (combo/on-fire NOT reset, since `resetCombo()` is not called in `abortPerformanceForPenalty`) is acceptable for this phase, or whether it needs a follow-up fix to stay consistent with the simultaneous score-side penalty. This is an explicit, still-open code review finding (01-REVIEW.md WR-01) that doesn't fail any documented success criterion but was flagged as a real state-consistency defect.
result: FIXED — added `resetCombo()` call in `abortPerformanceForPenalty()`, keeping combo/on-fire consistent with the score-side penalty (commit `d06a6185`). Full suite re-verified green (1975 passed).

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
