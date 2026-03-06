---
phase: quick-fix
plan: 1
subsystem: sight-reading-game
tags: [layout, spacing, ui-fix]
key-files:
  modified:
    - src/components/games/sight-reading-game/components/SightReadingLayout.jsx
decisions:
  - "px-2 sm:px-0 landscape:px-4 padding on dock wrapper matches card container padding for consistent alignment"
  - "max-w-5xl on dock inner wrapper matches notation card max-width constraint"
  - "0.5rem gap via calc() in paddingBottom -- minimal visible gap without wasting vertical space on mobile"
metrics:
  duration: 1m 8s
  completed: 2026-03-06
---

# Quick Fix 1: Sight Reading Feedback Panel Spacing Summary

Width-constrained feedback dock to max-w-5xl with centered alignment and 0.5rem vertical gap from notation card.

## What Changed

The feedback panel (and keyboard) in the Sight Reading game's bottom dock previously spanned the full viewport width while the notation card above was constrained to `max-w-5xl`. This created a visual mismatch.

### Changes Made

**SightReadingLayout.jsx** -- two modifications:

1. **Width-constrained dock content** (lines 183-190): Replaced the full-width inner wrapper with a flex centering container (`flex items-center justify-center`) and a `max-w-5xl` inner div. Added `px-2 sm:px-0 landscape:px-4` padding to match the card container's horizontal padding.

2. **Added vertical gap** (line 124): Appended `+ 0.5rem` to the main content area's `paddingBottom` calc, creating a visible gap between the notation card bottom edge and the docked feedback panel top edge.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Constrain feedback dock width and add gap | 652d46d | SightReadingLayout.jsx |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- Build: PASSED (npm run build succeeds, no new warnings)
- Visual: Feedback dock now has max-w-5xl matching notation card, with 0.5rem gap separating them

## Self-Check: PASSED
