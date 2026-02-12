---
phase: 13-celebration-foundation-accessibility
plan: 01
subsystem: ui
tags: [accessibility, animations, css, react-hooks, context]

# Dependency graph
requires:
  - phase: existing
    provides: AccessibilityContext with reducedMotion and extendedTimeouts settings
provides:
  - Celebration duration constants (standard: 500ms, level-up: 1000ms, boss: 3000ms)
  - useCelebrationDuration hook for accessibility-aware duration calculation
  - CelebrationWrapper component with skip functionality and auto-dismiss
  - CSS animations with reduced-motion alternatives
affects: [14-confetti-animations, 15-node-celebrations, 17-xp-animations, celebration-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Accessibility-first animation wrapper pattern
    - Duration calculation based on tier + accessibility settings
    - Skip functionality via click/keyboard (ESC/Enter)
    - CSS variable for dynamic animation duration control

key-files:
  created:
    - src/utils/celebrationConstants.js
    - src/components/celebrations/useCelebrationDuration.js
    - src/components/celebrations/CelebrationWrapper.jsx
    - src/components/celebrations/CelebrationWrapper.css
  modified: []

key-decisions:
  - "Standard celebrations: 500ms, level-up: 1000ms, boss: 3000ms based on 8-year-old attention research"
  - "Extended timeouts multiply duration by 1.5x for cognitive accessibility"
  - "Reduced motion uses 100ms opacity-only transitions (no transforms)"
  - "Skip functionality excludes interactive elements (buttons, links) to prevent accidental dismissal"
  - "Visible 'Tap to continue' hint for 8-year-olds with pulse animation (disabled in reduced-motion)"

patterns-established:
  - "CelebrationWrapper pattern: All future celebrations wrap content with this component to automatically respect accessibility settings"
  - "Duration tier system: Use named tiers ('standard', 'level-up', 'boss') instead of raw milliseconds for consistency"
  - "CSS variable pattern: --celebration-duration set via inline style for dynamic timing"
  - "Media query fallback: prefers-reduced-motion as CSS-level fallback before AccessibilityContext loads"

# Metrics
duration: 6min
completed: 2026-02-05
---

# Phase 13 Plan 01: Celebration Foundation & Accessibility Summary

**Accessibility-first celebration infrastructure with duration tiers (500ms/1000ms/3000ms), skip functionality (click/ESC/Enter), and reduced-motion alternatives**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-05T19:09:45Z
- **Completed:** 2026-02-05T19:15:25Z
- **Tasks:** 2
- **Files modified:** 4 created

## Accomplishments

- Created celebration constants with three duration tiers and accessibility multipliers
- Built useCelebrationDuration hook that calculates duration from tier + accessibility settings
- Implemented CelebrationWrapper component with auto-dismiss, click-to-skip, and keyboard shortcuts
- Created CSS animations with full-motion (bounce-and-glow) and reduced-motion (fade-in) variants
- Added visible "Tap to continue" hint appropriate for 8-year-old learners

## Task Commits

Each task was committed atomically:

1. **Task 1: Create celebration constants and duration hook** - `84ce2c5` (feat)
2. **Task 2: Create CelebrationWrapper component with CSS** - `686db69` (feat)

## Files Created/Modified

- `src/utils/celebrationConstants.js` - Duration tiers (500ms/1000ms/3000ms), extended timeout multiplier (1.5x), reduced motion duration (100ms), skip keys (Escape/Enter)
- `src/components/celebrations/useCelebrationDuration.js` - Hook that calculates celebration duration based on tier and accessibility settings (reducedMotion returns 100ms, extendedTimeouts multiplies by 1.5x)
- `src/components/celebrations/CelebrationWrapper.jsx` - Wrapper component with accessibility integration, auto-dismiss timer, skip-on-click (excluding interactive elements), skip-on-keyboard (ESC/Enter), and visible "Tap to continue" hint
- `src/components/celebrations/CelebrationWrapper.css` - Full-animation styles (bounce-and-glow keyframe with scale/translateY/opacity), reduced-motion styles (fade-in with opacity-only), skip hint with pulse animation, media query fallback for prefers-reduced-motion

## Decisions Made

**Duration tiers chosen based on 8-year-old attention research:**
- Standard celebrations (star awards, XP gains): 500ms for quick feedback
- Level-up celebrations: 1000ms for notable milestones
- Boss celebrations: 3000ms for major achievements

**Extended timeouts multiply by 1.5x:**
- Standard 500ms → 750ms when extended timeouts enabled
- Provides additional processing time for cognitive accessibility
- 1.5x chosen as balance between accommodation and engagement retention

**Reduced motion returns 100ms minimal duration:**
- Even in reduced-motion mode, need some visual feedback
- 100ms provides enough time for users to notice the change without complex animations
- Opacity-only transitions (no transforms, scale, or bounce)

**Skip functionality excludes interactive elements:**
- Click handler checks if target is closest to button/link
- Prevents "Next Exercise" or "Back to Trail" buttons from triggering skip
- Important for post-celebration navigation in VictoryScreen

**Visible skip hint for 8-year-olds:**
- Fixed bottom-right "Tap to continue" text
- Pulse animation draws attention (disabled in reduced-motion)
- Makes skip functionality discoverable for young users

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly with clear requirements.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 14 (Confetti Animations):**
- CelebrationWrapper foundation established
- All future celebration features should wrap content with CelebrationWrapper
- Duration hook available for timing coordination
- CSS animation patterns established for full-motion and reduced-motion variants

**Ready for Phase 15 (Node-Type Celebrations):**
- Duration tiers available (standard/level-up/boss)
- Skip functionality prevents celebration blocking progression
- Accessibility settings automatically respected

**Ready for Phase 17 (XP Animations):**
- Standard tier (500ms) appropriate for frequent XP gains
- Extended timeouts support for users needing more processing time

**No blockers or concerns:**
- Zero new dependencies added
- Build passes with no errors
- Lint shows only pre-existing warnings
- All key_links verified (useAccessibility, useCelebrationDuration, celebrationConstants imports)

---
*Phase: 13-celebration-foundation-accessibility*
*Completed: 2026-02-05*
