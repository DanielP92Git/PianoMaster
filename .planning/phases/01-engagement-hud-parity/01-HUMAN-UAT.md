---
status: partial
phase: 01-engagement-hud-parity
source: [01-VERIFICATION.md]
started: 2026-07-09T20:39:53Z
updated: 2026-07-09T20:39:53Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. On-fire splash visual/animation check

expected: `OnFireBadge` flame icon appears next to `ComboPill` in the header; a brief (1.5s) full-screen flame splash overlays the game when a 5-note correct combo is built, matching NotesRecognitionGame's on-fire feel.
result: [pending]

### 2. Reduced-motion suppression check

expected: Toggling OS/in-app `prefers-reduced-motion` and repeating the on-fire trigger suppresses pulse/scale/shake animations on `ComboPill`/`OnFireBadge`/`OnFireSplash`, per the shared components' dual-source reduced-motion handling.
result: [pending]

### 3. Hebrew RTL layout check

expected: Switching to Hebrew (he) locale and playing through a combo/on-fire sequence renders "קומבו" and "מדהים!" correctly with RTL layout, no truncation/clipping in the header pill row.
result: [pending]

### 4. Anti-cheat penalty combo-reset decision (WR-01)

expected: Building a combo of 5+ (on-fire active), then deliberately triggering the anti-cheat guess-penalty flow (rapid wrong keyboard/mic inputs) — decide whether the current shipped behavior (combo/on-fire NOT reset, since `resetCombo()` is not called in `abortPerformanceForPenalty`) is acceptable for this phase, or whether it needs a follow-up fix to stay consistent with the simultaneous score-side penalty. This is an explicit, still-open code review finding (01-REVIEW.md WR-01) that doesn't fail any documented success criterion but was flagged as a real state-consistency defect.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
