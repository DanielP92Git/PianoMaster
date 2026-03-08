---
phase: 03-game-layout-optimization
plan: 01
subsystem: game-ui
tags: [responsive-design, tailwind-css, landscape-optimization, wcag]
dependency_graph:
  requires: [phase-02-orientation-detection]
  provides: [landscape-css-modifiers, game-landscape-layouts]
  affects: [all-game-components, tailwind-config]
tech_stack:
  added: []
  patterns: [tailwind-orientation-modifiers, landscape-first-enhancement]
key_files:
  created: []
  modified:
    - path: tailwind.config.js
      impact: Added landscape/portrait screen modifiers to theme.extend.screens
    - path: src/components/games/notes-master-games/NotesRecognitionGame.jsx
      impact: Landscape-optimized horizontal grid layout with compact spacing
    - path: src/components/games/sight-reading-game/components/SightReadingLayout.jsx
      impact: Landscape header compacting and horizontal padding adjustments
    - path: src/components/games/rhythm-games/MetronomeTrainer.jsx
      impact: Forced horizontal flex layout in landscape orientation
    - path: src/components/games/notes-master-games/MemoryGame.jsx
      impact: Increased grid columns (6-8) in landscape for better space usage
decisions:
  - key: orientation-modifier-implementation
    decision: Use Tailwind custom screens with raw media queries
    rationale: No games have text input fields, so keyboard-triggered landscape pitfall (from research) does not apply. Simpler implementation than aspect-ratio guards.
    alternatives: [aspect-ratio-based-modifiers, landscape-stable-variant]
  - key: landscape-design-philosophy
    decision: Portrait as baseline, landscape as enhancement
    rationale: WCAG 1.3.4 requires portrait to remain functional. Mobile-first Tailwind defaults align with this requirement.
    alternatives: [landscape-first-design, separate-orientation-codebases]
  - key: grid-column-scaling
    decision: Scale MemoryGame grid from 3-4 cols to 6-8 cols in landscape
    rationale: Landscape provides abundant horizontal space; more columns reduce vertical scrolling and improve glanceability.
    alternatives: [keep-same-columns, dynamic-js-calculation]
metrics:
  duration_minutes: 6
  tasks_completed: 2
  files_modified: 5
  commits: 2
  lines_changed: 89
  build_status: passed
  completed_at: 2026-02-15T17:28Z
---

# Phase 03 Plan 01: Landscape-Optimized CSS Layouts

**One-liner:** Added Tailwind orientation modifiers and landscape-responsive CSS to all 4 game modes for horizontal space optimization.

## Summary

This plan implements CSS-based landscape layout optimization for all game modes using Tailwind's custom screen modifiers. Games now display horizontal side-by-side layouts in landscape orientation while preserving the existing vertical portrait layout. The implementation is purely CSS-driven with zero JavaScript logic changes, ensuring smooth orientation transitions without re-renders.

**Outcome:** All 4 games (NotesRecognitionGame, SightReadingGame, MetronomeTrainer, MemoryGame) now utilize horizontal space in landscape orientation through Tailwind `landscape:` modifiers. Portrait mode remains fully functional per WCAG 1.3.4 requirements.

## Changes Made

### Task 1: Tailwind Orientation Modifiers (Commit: 8c80581)

Added custom screen modifiers to `tailwind.config.js`:

```javascript
screens: {
  'portrait': { 'raw': '(orientation: portrait)' },
  'landscape': { 'raw': '(orientation: landscape)' },
}
```

**Location:** `theme.extend.screens` (new object at top of extend)

**Impact:**
- Enables `landscape:` and `portrait:` prefixes in all component className strings
- Build passes with zero breaking errors
- Tailwind warning about min/max variants with object screens is expected and non-breaking

### Task 2: Landscape Layouts for All 4 Games (Commit: a2fa9e5)

**NotesRecognitionGame.jsx:**
- Header compacting: `landscape:pt-1`, `landscape:py-1`
- Main game area: `landscape:mt-2`, `landscape:gap-2`, `landscape:pb-2`
- Existing `landscape:grid` and `landscape:grid-cols-[0.95fr_1.05fr]` preserved

**SightReadingLayout.jsx:**
- Header: Added `landscape:py-1`
- Main content: Added `landscape:px-4`
- Staff padding: Added `landscape:py-1`

**MetronomeTrainer.jsx:**
- Header: Added `landscape:py-1`
- Main game area: Added `landscape:flex-row landscape:gap-2` (complements existing `sm:flex-row`)

**MemoryGame.jsx:**
- Header: Added `landscape:p-1 landscape:gap-1`
- Grid scaling:
  - 3X4 (Easy): `landscape:grid-cols-6 landscape:gap-2`
  - 3X6 (Medium): `landscape:grid-cols-6 landscape:gap-1.5`
  - 3X8 (Hard): `landscape:grid-cols-8 landscape:gap-1.5`

**Pattern:** All changes follow the "mobile-first, landscape-enhancement" pattern:
1. Keep existing classes as portrait baseline
2. Add `landscape:` modifiers for horizontal optimization
3. Reduce vertical padding (`py-2` → `landscape:py-1`)
4. Increase horizontal columns/flex ratios

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

### Created Files
None (plan only modified existing files)

### Modified Files
```bash
$ ls -l tailwind.config.js src/components/games/notes-master-games/NotesRecognitionGame.jsx src/components/games/sight-reading-game/components/SightReadingLayout.jsx src/components/games/rhythm-games/MetronomeTrainer.jsx src/components/games/notes-master-games/MemoryGame.jsx
```
All files exist: PASSED

### Commits
```bash
$ git log --oneline --grep="03-01"
a2fa9e5 feat(03-01): add landscape-optimized layouts to all 4 game modes
8c80581 feat(03-01): add landscape and portrait orientation modifiers to Tailwind config
```
Both commits exist: PASSED

### Build Verification
```bash
$ npm run build
✓ built in 1m
```
Build passes with zero new errors: PASSED

### Verification Criteria (from plan)

- [x] `npm run build` passes with zero new errors
- [x] All 4 game files contain `landscape:` class modifiers
- [x] tailwind.config.js contains `portrait` and `landscape` screen entries
- [x] No game logic was modified (only className strings changed)

## Self-Check: PASSED

All files created, all commits exist, build passes, verification criteria met.

## Technical Notes

**Orientation Media Query:**
The plan used `(orientation: portrait)` and `(orientation: landscape)` raw media queries without aspect-ratio guards. This is safe because none of the 4 game components have text input fields, so the "keyboard triggering landscape styles in portrait" pitfall documented in the research does not apply.

**Tailwind Warning:**
Build shows warning: "The `min-*` and `max-*` variants are not supported with a `screens` configuration containing objects." This is expected when using raw media queries in custom screens. It does not break functionality - min/max modifiers just won't work with the custom orientation screens (which is acceptable, as games don't need min-landscape/max-portrait).

**Layout Technique:**
All implementations use CSS-only Tailwind modifiers. No JS orientation detection hooks were added to these components (useOrientation is used only for the RotatePromptOverlay, which is separate). This ensures:
- Zero re-renders on orientation change
- Smooth CSS transitions
- No layout thrashing

**WCAG 1.3.4 Compliance:**
Portrait layouts remain unchanged and fully functional. Landscape modifiers are purely enhancements. Users can dismiss the rotate prompt (added in Phase 02) and continue playing in portrait mode.

## Next Steps

Plan 02 will integrate the debounced ResizeObserver hook (`useVexFlowResize.js`, already created) into VexFlowStaffDisplay for smooth VexFlow re-rendering on orientation changes.

Plan 03 will optimize VictoryScreen and UnifiedGameSettings modals for landscape orientation.

---

**Execution time:** 6 minutes
**Commits:** 2 (8c80581, a2fa9e5)
**Files modified:** 5
**Lines changed:** 89 (insertions + deletions)
**Build status:** Passed
**Verification:** All criteria met
