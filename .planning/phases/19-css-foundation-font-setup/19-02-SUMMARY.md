---
phase: 19-css-foundation-font-setup
plan: 02
subsystem: presentation
tags: [trail-page, background, starfield, glow-orbs, quicksand, accessibility]
requires: [19-01]
provides: [enchanted-forest-background, starfield, glow-orbs, reduced-motion-integration]
affects: [phase-20, phase-21, phase-22]
tech-stack:
  added: []
  patterns: [deterministic-starfield, css-custom-property-animation, reduced-motion-css-only]
key-files:
  modified:
    - src/pages/TrailMapPage.jsx
    - src/styles/trail-effects.css
decisions:
  - id: TRAIL-BG-01
    decision: Use flat solid background instead of multi-stop gradient
    rationale: Linear gradient with 3 stops created visible color band at transition point; solid color eliminates the artifact
    impact: Background is uniform #1a1040 with no gradient banding
  - id: TRAIL-BG-02
    decision: Remove radial gradient overlays from ::before pseudo-element
    rationale: Radial gradients at 30%/80% and 70%/20% positions created visible color variation that appeared as a horizontal band
    impact: ::before pseudo-element kept but set to transparent for future use
metrics:
  duration: ~15 minutes (including visual debugging with user)
  completed: 2026-02-10
---

# Phase 19 Plan 02: Apply Enchanted Forest Background Summary

**One-liner:** TrailMapPage updated with enchanted forest background, 20-star deterministic starfield, 3 ambient glow orbs, Quicksand font scoping, and reduced-motion integration via AccessibilityContext.

## Overview

Applied the CSS foundation from Plan 01 to TrailMapPage.jsx, transforming it from a flat slate gradient into an immersive enchanted forest backdrop. During visual verification, discovered and fixed a gradient banding issue by simplifying the background to a solid color.

**Why this matters:** This establishes the visual canvas that Phase 20-22 components render on. The dark forest background provides contrast for the glowing 3D nodes, glass panels, and SVG path connectors coming in later phases.

## Tasks Completed

### Task 1: Apply Enchanted Forest Background to TrailMapPage (Commit: 2cea494)

**What was done:**
- Added imports for `useAccessibility` hook and `trail-effects.css` module
- Added `reducedMotion` hook call for future Phase 20 use
- Replaced outer wrapper div classes:
  - Removed: `bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900`
  - Added: `trail-page trail-forest-bg font-quicksand` + conditional `reduced-motion` class
- Replaced 8 random stars (using Math.random) with 20 deterministic stars using `trail-star` CSS class
- Added 3 ambient glow orbs (purple, blue, green) at bottom of viewport
- Removed inline `<style>` block with `@keyframes twinkle` (now handled by trail-effects.css)

**Files modified:**
- `src/pages/TrailMapPage.jsx` - Complete visual overhaul of wrapper and decorative elements

### Checkpoint: Visual Verification (User-Verified)

**Issue discovered:** User reported a visible horizontal band in the background at approximately the 40% viewport mark.

**Root cause investigation:**
1. First identified the 3-stop linear gradient on `.trail-forest-bg` as the cause
2. Changed to solid `var(--trail-forest-mid)` background - band persisted
3. Identified the `::before` pseudo-element's radial gradients as the true cause
4. Radial gradients at `30% 80%` and `70% 20%` with 50% spread created visible color boundaries

**Fix applied (Commit: ce4c577):**
- Removed radial gradient overlays from `.trail-forest-bg::before`
- Set `::before` background to `transparent` (pseudo-element kept for future use)
- Result: Uniform flat background with no visible banding

**Files modified:**
- `src/styles/trail-effects.css` - Simplified forest background to flat color, removed radial gradient overlays

## Decisions Made

### Decision 1: Flat Solid Background (TRAIL-BG-01)

**Context:** The original plan specified a multi-layer gradient background with radial gradient overlays for visual depth.

**Options considered:**
1. 3-stop linear gradient (base → mid → base) with radial overlays
2. Solid background color with radial overlays
3. Solid background color only (no overlays)

**Decision:** Option 3 - Solid background with no gradient overlays.

**Rationale:** Both the linear gradient transitions and radial gradient boundaries created visible color bands on screen. The `bg-white/5 backdrop-blur-sm` on TrailSection components combined with the fixed background creates enough visual depth without needing gradient overlays.

**Impact:** Simpler CSS, no visual artifacts, uniform background that works well with the semi-transparent section overlays.

### Decision 2: Keep ::before Pseudo-Element as Transparent (TRAIL-BG-02)

**Context:** After removing the radial gradients, the `::before` pseudo-element serves no visual purpose.

**Decision:** Keep the pseudo-element but set to transparent, preserving the CSS structure for Phase 20-22 use.

**Rationale:** Future phases may add subtle environmental effects (particle layers, seasonal themes) that benefit from a pre-positioned overlay element with `pointer-events: none` and `z-index: 0`.

## Deviations from Plan

1. **Background simplified from gradient to solid** - Original plan specified "deep purple/navy gradient background." Final result uses solid `#1a1040` (trail-forest-mid) instead. This is visually acceptable because the semi-transparent trail sections and glow orbs provide sufficient visual variation.

2. **Radial gradient overlays removed** - Plan specified radial gradient overlays on `::before` for ambient purple/blue glow. Removed because they caused visible banding artifact.

## Testing & Verification

**Build verification:**
- `npm run build` passed with zero errors (verified after each commit)

**Visual verification (user-confirmed):**
- Enchanted forest background displays without banding
- Stars twinkle with varied timing across the page
- Ambient glow orbs visible at bottom of viewport
- Quicksand font renders on trail page
- Dashboard and other pages visually unchanged

**Code verification:**
- `trail-forest-bg` in TrailMapPage.jsx: 1 occurrence
- `font-quicksand` in TrailMapPage.jsx: 1 occurrence
- `trail-star` in TrailMapPage.jsx: 1 occurrence
- `trail-glow-orb` in TrailMapPage.jsx: 3 occurrences
- `@keyframes` in TrailMapPage.jsx: 0 occurrences (inline style removed)
- `useAccessibility` import present
- `trail-effects.css` import present

## Technical Debt

None created.

## Files Changed

### Modified
- `src/pages/TrailMapPage.jsx` - Applied forest background, starfield, glow orbs, Quicksand font, reduced-motion
- `src/styles/trail-effects.css` - Simplified `.trail-forest-bg` to solid background, removed radial gradient overlays

## Metrics

- **Duration:** ~15 minutes (including visual debugging)
- **Tasks completed:** 1/1 + 1 checkpoint
- **Commits:** 2 (2cea494, ce4c577)
- **Files modified:** 2
- **Deviations:** 2 (background simplified, gradients removed)

---

**Plan complete:** 2026-02-10
**Execution time:** ~15 minutes
**Commits:** 2cea494, ce4c577
