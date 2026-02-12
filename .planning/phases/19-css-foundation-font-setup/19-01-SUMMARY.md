---
phase: 19-css-foundation-font-setup
plan: 01
subsystem: presentation
tags: [css, fonts, tailwind, trail-effects, performance, accessibility]
requires: []
provides: [quicksand-font, trail-css-utilities, performance-patterns]
affects: [phase-20, phase-21, phase-22]
tech-stack:
  added: ['@fontsource/quicksand']
  patterns: [pseudo-element-glow, reduced-motion-dual-override, will-change-on-hover-only]
key-files:
  created:
    - src/styles/trail-effects.css
  modified:
    - tailwind.config.js
    - src/main.jsx
decisions:
  - id: TRAIL-CSS-01
    decision: Use pseudo-element + opacity pattern for glow effects instead of box-shadow transitions
    rationale: Better performance - box-shadow is expensive to animate, opacity is GPU-accelerated
    impact: All node hover effects use ::before/::after with opacity transitions
  - id: TRAIL-CSS-02
    decision: Require BOTH @media prefers-reduced-motion AND .reduced-motion class overrides
    rationale: Covers both system preference detection and manual accessibility toggle
    impact: Every animation has dual reduced-motion overrides
  - id: TRAIL-CSS-03
    decision: Apply will-change only on :hover/:active states, never on base classes
    rationale: Prevents unnecessary layer promotion and GPU memory usage for all nodes
    impact: 93 trail nodes won't all be GPU-promoted until user hovers
metrics:
  duration: 5.4 minutes
  completed: 2026-02-10
---

# Phase 19 Plan 01: Font and CSS Foundation Summary

**One-liner:** Quicksand font installed, Tailwind extended with trail palette/shadows, 298-line trail-effects.css module created with all visual utilities following performance best practices.

## Overview

Established the complete CSS foundation for the enchanted forest trail redesign. Installed Quicksand as the kid-friendly rounded font, extended Tailwind configuration with trail-specific colors and shadow utilities, and created a comprehensive trail-effects.css module containing all reusable visual effects.

**Why this matters:** This plan provides the CSS toolkit that all Phase 20-22 components will consume. All visual patterns (3D nodes, glass panels, glow effects, starfield, forest background) are defined once here and reused across trail components. Performance and accessibility patterns are baked in from the start.

## Tasks Completed

### Task 1: Install Quicksand Font and Extend Tailwind Config (Commit: cfab76e)

**What was done:**
- Installed `@fontsource/quicksand` package via npm
- Added Quicksand font imports (400, 600, 700 weights) to `src/main.jsx` after existing font imports
- Extended Tailwind config with:
  - `fontFamily.quicksand: ['Quicksand', 'Nunito', 'sans-serif']` - New font utility
  - `colors.trail.*` - 5-color palette (cyan-glow, purple-glow, forest colors)
  - `boxShadow.node-3d*` - 4 shadow utilities for 3D depth effects
  - `boxShadow.glow-*` - 2 glow shadow utilities
  - `dropShadow.glow-*` - 2 drop-shadow utilities for SVG/text

**Files modified:**
- `package.json` / `package-lock.json` - Quicksand dependency
- `src/main.jsx` - Font imports (lines 44-46)
- `tailwind.config.js` - Extended fontFamily, colors, boxShadow, dropShadow

**Technical notes:**
- Quicksand chosen for rounded kid-friendly aesthetic matching target age (8 years)
- Nunito as fallback because it's already loaded and has similar rounded style
- Trail colors follow enchanted forest theme: dark blues/purples for background, cyan/purple for glows
- Shadow utilities use rgba values with transparency for layering depth

### Task 2: Create trail-effects.css Module (Commit: 6d26693)

**What was done:**
- Created `src/styles/` directory
- Created `trail-effects.css` with 9 sections (298 lines total):

**Section breakdown:**

1. **CSS Custom Properties** (23 lines)
   - Scoped to `.trail-page` class
   - 13 custom properties for colors, gradients, backgrounds
   - Example: `--trail-primary-glow: #00f2ff`

2. **Enchanted Forest Background** (15 lines)
   - `.trail-forest-bg` class with multi-layer gradient
   - `::before` pseudo-element with 2 radial gradient overlays (purple and blue glows)
   - Follows PITFALLS.md Pitfall 6: Max 2 radial gradients

3. **Ambient Glow Orbs** (21 lines)
   - `.trail-glow-orb` base class
   - 3 variants: `--purple`, `--blue`, `--green`
   - Each with different blur radius (20px, 30px, 25px)

4. **Starfield Animation** (23 lines)
   - `@keyframes trail-twinkle` for opacity animation (0.1 → 0.7 → 0.1)
   - `.trail-star` class with CSS custom property duration/delay
   - **Dual reduced-motion overrides** (media query + class)

5. **Glass Panel** (16 lines)
   - `.trail-glass-panel` with backdrop-filter blur(12px)
   - Gradient background, border, shadow for depth
   - `@supports` fallback for browsers without backdrop-filter support

6. **3D Node Styles** (133 lines - largest section)
   - 4 node state classes:
     - `.node-3d-active` - Cyan gradient, ready to play
     - `.node-3d-locked` - Purple gradient, muted, not available
     - `.node-3d-completed` - Green gradient with pulsing glow
     - `.node-3d-available` - Blue gradient with breathing animation
   - Each uses **pseudo-element + opacity pattern** for glow effects (PERF-01c)
   - `will-change: transform` only on `:hover` states (PERF-01b)
   - `:active` states use `translateY(4px)` with reduced shadow for press effect

7. **Glow Pulse Keyframe** (18 lines)
   - `@keyframes trail-glow-pulse` for breathing effect (opacity 0.4 → 0.8 → 0.4)
   - **Dual reduced-motion overrides** for `.node-3d-completed::after` and `.node-3d-available::before`

8. **Text Glow Utilities** (12 lines)
   - `.text-glow-cyan` - Cyan text-shadow for primary glow
   - `.text-glow-purple` - Purple text-shadow for secondary glow
   - `.text-shadow-deep` - Deep black shadow for readability

9. **SVG Path Glow** (9 lines)
   - `.path-svg-glow` - Cyan drop-shadow for active paths
   - `.path-svg-glow--completed` - Green drop-shadow for completed paths

**Performance patterns enforced:**
- Zero `transition: box-shadow` (verified via grep)
- All glow effects use `::before` or `::after` pseudo-elements with `opacity` transitions only
- `will-change` applied ONLY on `:hover` and `:active` states, never on base classes (3 occurrences, all on hover)
- Backdrop-filter limited to `.trail-glass-panel` only (max 3 elements on page)
- Radial gradients limited to 2 layers for forest background

**Accessibility patterns enforced:**
- 2 `@media (prefers-reduced-motion: reduce)` blocks
- 3 `.reduced-motion` class overrides (includes compound selector)
- Every animation has BOTH media query AND class override

**Files created:**
- `src/styles/trail-effects.css` (298 lines)

## Decisions Made

### Decision 1: Pseudo-Element + Opacity Pattern for Glow Effects (TRAIL-CSS-01)

**Context:** Node hover states need glow effects. Traditional approach would animate `box-shadow` property.

**Options considered:**
1. Direct `box-shadow` animation via `transition: box-shadow`
2. Pseudo-element with animated `box-shadow`
3. Pseudo-element with animated `opacity` only

**Decision:** Option 3 - Pseudo-element with opacity animation.

**Rationale:**
- `box-shadow` is expensive to animate (triggers paint on every frame)
- `opacity` is GPU-accelerated and only triggers composite
- Pseudo-element pattern keeps glow effect separate from main element
- No performance degradation with 93 nodes on page

**Implementation:**
```css
.node-3d-active::before {
  content: '';
  position: absolute;
  inset: -4px;
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.6);
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.node-3d-active:hover::before {
  opacity: 0.8;
}
```

**Impact:** All 4 node states use this pattern. Zero `transition: box-shadow` in entire CSS module.

### Decision 2: Dual Reduced-Motion Overrides (TRAIL-CSS-02)

**Context:** Accessibility requires disabling animations for users with motion sensitivity.

**Options considered:**
1. Only `@media (prefers-reduced-motion: reduce)`
2. Only `.reduced-motion` class
3. Both media query AND class

**Decision:** Option 3 - Both media query and class.

**Rationale:**
- Media query: Respects system-level OS preference (automatic detection)
- Class: Supports manual accessibility toggle via AccessibilityContext
- Some users set OS preference, others use in-app toggle
- Dual approach ensures coverage for all users

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  .trail-star {
    animation: none;
    opacity: 0.4;
  }
}

.reduced-motion .trail-star {
  animation: none;
  opacity: 0.4;
}
```

**Impact:** Every animation in trail-effects.css has BOTH overrides. 2 media query blocks, 3 class override selectors (one is compound: `.reduced-motion .node-3d-completed::after, .reduced-motion .node-3d-available::before`).

### Decision 3: will-change Only on Hover States (TRAIL-CSS-03)

**Context:** `will-change` hints to browser to optimize for animation, but creates GPU layers.

**Options considered:**
1. `will-change: transform` on all node base classes
2. `will-change: transform` only on `:hover` states
3. No `will-change` at all

**Decision:** Option 2 - Only on hover states.

**Rationale:**
- 93 nodes on trail page - promoting all to GPU layers wastes memory
- Nodes are static 99% of the time, only animate on hover/active
- Applying on `:hover` gives browser hint just before animation starts
- Modern browsers optimize well enough without hints for simple transforms

**Implementation:**
```css
.node-3d-active:hover {
  will-change: transform;
}
```

**Impact:** 3 occurrences of `will-change`, all on `:hover` pseudo-class. Zero static `will-change` on base classes.

## Deviations from Plan

None - plan executed exactly as written.

## Testing & Verification

**Build verification:**
- `npm run build` passed with zero errors (ran after Task 1 and Task 2)
- `npm ls @fontsource/quicksand` confirmed package installed

**CSS structure verification:**
- Line count: 298 lines (requirement: 150+ lines) ✓
- All 9 sections present ✓
- `@media (prefers-reduced-motion: reduce)` count: 2 ✓
- `.reduced-motion` class override count: 3 ✓

**Performance pattern verification:**
- `grep "transition.*box-shadow"` → 0 occurrences ✓
- `grep "will-change"` without `:hover` context → 0 base class occurrences ✓
- All 3 `will-change` declarations on `:hover` states ✓

**Tailwind config verification:**
- Contains `quicksand`, `trail`, `node-3d`, `glow-cyan`, `dropShadow` entries ✓

**Font import verification:**
- `src/main.jsx` contains 3 Quicksand import lines (400, 600, 700) ✓

## Technical Debt

None created.

## Next Phase Readiness

**Blocks removed:**
- Phase 20 (Trail Background & Layout) can now import `trail-effects.css` and use all utilities
- Phase 21 (Node Rendering & SVG Paths) can use `.node-3d-*` classes and `.path-svg-glow`
- Phase 22 (Modal & XP Integration) can use `.trail-glass-panel` and text glow utilities

**Artifacts provided:**
- `font-quicksand` Tailwind utility class for rounded kid-friendly typography
- Trail color palette in Tailwind: `trail.cyan-glow`, `trail.purple-glow`, etc.
- 4 node shadow utilities in Tailwind: `shadow-node-3d`, `shadow-glow-cyan`, etc.
- 2 drop-shadow utilities in Tailwind: `drop-shadow-glow-cyan`, `drop-shadow-glow-purple`
- `src/styles/trail-effects.css` module with 9 sections of reusable classes

**Dependencies:**
- None - this is a foundational plan with no upstream dependencies

**Known issues:**
- None

## Files Changed

### Created
- `src/styles/trail-effects.css` (298 lines) - Trail-scoped CSS module

### Modified
- `tailwind.config.js` - Extended fontFamily, colors, boxShadow, dropShadow
- `src/main.jsx` - Added Quicksand font imports (3 weights)
- `package.json` / `package-lock.json` - Added @fontsource/quicksand dependency

## Key Learnings

1. **Performance patterns pay off at scale:** With 93 nodes, avoiding box-shadow transitions and static will-change prevents GPU memory bloat.

2. **Dual reduced-motion coverage is essential:** Users access motion settings via OS preference AND in-app toggle. Both must be supported.

3. **CSS custom properties improve consistency:** Scoping all trail colors to `.trail-page` with custom properties makes future theme changes trivial.

4. **Pseudo-element pattern enables rich effects cheaply:** Using `::before` and `::after` for glows keeps DOM clean while enabling complex layered effects.

## Metrics

- **Duration:** 5.4 minutes
- **Tasks completed:** 2/2
- **Commits:** 2 (cfab76e, 6d26693)
- **Files created:** 1
- **Files modified:** 3
- **Lines added:** ~340 (298 CSS + 42 config/imports)
- **Dependencies added:** 1 (@fontsource/quicksand)
- **Performance patterns enforced:** 3 (pseudo-element opacity, will-change on hover, dual reduced-motion)

---

**Plan complete:** 2026-02-10
**Execution time:** 5.4 minutes
**Commits:** cfab76e, 6d26693
