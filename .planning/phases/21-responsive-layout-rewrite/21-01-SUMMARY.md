---
phase: 21-responsive-layout-rewrite
plan: 01
subsystem: trail-primitives
tags: [svg, bezier, glass-morphism, viewport-optimization, shared-components]
requires:
  - "trail-effects.css"
  - "translateUnitName utility"
provides:
  - "PathConnector: SVG S-curve path renderer"
  - "UnitProgressCard: Glass-morphism unit progress display"
  - "useVisibleNodes: Intersection Observer hook"
affects:
  - "src/components/trail/" (future layout components will import these)
  - "src/hooks/" (new viewport detection hook)
tech-stack:
  added:
    - "Intersection Observer API for viewport detection"
    - "Cubic Bezier path calculations for smooth curves"
  patterns:
    - "Viewport-optimized rendering (conditional glow effects)"
    - "Glass-morphism with WCAG-compliant contrast overlay"
    - "Standalone primitive components for responsive layouts"
key-files:
  created:
    - "src/hooks/useVisibleNodes.js"
    - "src/components/trail/PathConnector.jsx"
    - "src/components/trail/UnitProgressCard.jsx"
  modified:
    - "src/styles/trail-effects.css"
decisions:
  - "40% Bezier control point offset produces ideal winding river curves"
  - "10px backdrop blur for glass effect (within 8-12px user range)"
  - "Conditional glow rendering only when visible improves performance"
  - "Semi-opaque bg-slate-900/40 overlay ensures WCAG 4.5:1 contrast"
metrics:
  duration: 7
  completed: 2026-02-11
---

# Phase 21 Plan 01: Shared Primitive Components Summary

**One-liner:** Created three foundational components for responsive trail layouts: PathConnector with smooth Bezier S-curves and viewport-optimized cyan glow, UnitProgressCard with WCAG-compliant glass-morphism, and useVisibleNodes Intersection Observer hook.

## What Was Built

### 1. useVisibleNodes Hook (`src/hooks/useVisibleNodes.js`)
Custom React hook using Intersection Observer to track element visibility in the viewport.

**Features:**
- Returns boolean `isVisible` state for a single element ref
- `rootMargin: '50px'` for early detection (starts 50px before element enters viewport)
- `threshold: 0.1` triggers at 10% visibility
- Automatic cleanup on unmount
- Simple API: `const isVisible = useVisibleNodes(elementRef);`

**Purpose:** Enables performance optimization by conditionally rendering expensive CSS effects (blur, glow) only when elements are visible.

### 2. PathConnector Component (`src/components/trail/PathConnector.jsx`)
Standalone SVG component rendering smooth Bezier S-curve paths between trail nodes.

**Features:**
- **Dual orientation support:** Automatically detects vertical (zigzag mobile) vs horizontal (desktop) connections based on delta ratios
- **Cubic Bezier calculation:** 40% control point offset produces gentle flowing curves
  - Vertical: Control points offset horizontally at `startY + dy * 0.4` and `endY - dy * 0.4`
  - Horizontal: Control points offset vertically at `startX + dx * 0.4` and `endX - dx * 0.4`
- **Viewport-optimized glow:** Background glow path only renders when `isVisible && isCompleted`
  - Glow: `stroke: rgba(0, 242, 255, 0.3)`, `strokeWidth: 8`, `filter: blur(3px)`
  - Main path: `#00FFFF` (cyan) for completed, `rgba(255, 255, 255, 0.15)` for locked
- **Locked state:** Dashed gray stroke (`strokeDasharray: '12 8'`) for upcoming sections
- **Thin strokes:** 2px width for subtle, non-competing appearance

**Accepts pixel coordinates from parent layouts** (no `window.innerWidth` dependency).

### 3. UnitProgressCard Component (`src/components/trail/UnitProgressCard.jsx`)
Glass-morphism card component displaying unit metadata as a visual chapter break.

**Features:**
- **Frosted glass effect:** 10px backdrop blur with gradient overlay (`rgba(255,255,255,0.12)` to `rgba(255,255,255,0.04)`)
- **WCAG 4.5:1 contrast:** Semi-opaque `bg-slate-900/40` overlay ensures white text meets accessibility standards
- **Content display:**
  - Unit theme icon (emoji)
  - Unit name (translated via `translateUnitName`)
  - Completion count: "4/6 complete"
  - Star progress: "10/18 ⭐"
- **Completed unit glow:** Subtle green border and shadow when `isUnitComplete` is true
  - Border: `1.5px solid rgba(74, 222, 128, 0.5)`
  - Shadow: `0 0 10px rgba(74, 222, 128, 0.3)` + inset glow
- **Purely informational:** No onClick/onTap handlers (per user decision)
- **i18n support:** Uses `useTranslation` hook with 'trail' namespace

### 4. CSS Updates (`src/styles/trail-effects.css`)
Added fallback styles and glow classes.

**Changes:**
- `.trail-unit-card-fallback` with `@supports not (backdrop-filter: blur(10px))` fallback to solid background
- `.path-connector-glow` class for future use (drop-shadow utility)
- Maintains compatibility with browsers lacking backdrop-filter support

## Task Breakdown

| Task | Description | Files | Commit |
|------|-------------|-------|--------|
| 1 | Create useVisibleNodes hook and PathConnector with S-curve Bezier logic | `src/hooks/useVisibleNodes.js`<br>`src/components/trail/PathConnector.jsx` | `43f6d40` |
| 2 | Create UnitProgressCard glass-morphism component | `src/components/trail/UnitProgressCard.jsx`<br>`src/styles/trail-effects.css` | `14343f6` |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

### Bezier Control Point Calculation
- **Decision:** Use 40% offset for control points (`dy * 0.4`, `dx * 0.4`)
- **Rationale:** Produces gentle "winding river" curves matching user's vision (not sharp zigzag turns)
- **Alternative considered:** 30% offset was too subtle, 50% created overly exaggerated curves

### Viewport Detection Strategy
- **Decision:** Single-element ref API (`useVisibleNodes(elementRef)`) returning boolean
- **Rationale:** Simpler than array-based API, sufficient for per-path-connector tracking
- **Performance:** Intersection Observer is more efficient than scroll listeners

### Glass-morphism Contrast Overlay
- **Decision:** Add `bg-slate-900/40` semi-opaque layer in addition to glass background
- **Rationale:** Ensures WCAG 4.5:1 contrast for white text against forest background regardless of backdrop image
- **Trade-off:** Slightly reduces transparency "see-through" effect, but guarantees accessibility

### Conditional Glow Rendering
- **Decision:** Only render blur filter when `isVisible && isCompleted`
- **Rationale:** Blur filters are GPU-intensive; applying them to 93 off-screen paths would harm 60fps target on Chromebooks
- **Verification:** Will be tested on Intel Celeron device in Phase 22

## Integration Notes

### For Plan 02 (Layout Components)
Both `ZigzagTrailLayout` (mobile) and `HorizontalTrailLayout` (desktop) will:
1. Import `PathConnector` and `UnitProgressCard` as primitives
2. Pass pixel coordinates to PathConnector (calculated via layout-specific logic)
3. Pass unit metadata to UnitProgressCard (calculated from node groupings)

### Component Signatures
```jsx
// PathConnector
<PathConnector
  startX={number}
  startY={number}
  endX={number}
  endY={number}
  isCompleted={boolean}
  isLocked={boolean}
/>

// UnitProgressCard
<UnitProgressCard
  unit={object}           // From UNITS in skillTrail.js
  completedCount={number}
  totalCount={number}
  totalStars={number}
  maxStars={number}
  isUnitComplete={boolean}
/>

// useVisibleNodes
const isVisible = useVisibleNodes(elementRef);
```

## Verification

- [x] `npm run build` succeeds with zero new errors
- [x] PathConnector.jsx exports default React component
- [x] useVisibleNodes.js exports named `useVisibleNodes` function
- [x] PathConnector uses cubic Bezier `C` command (not straight lines or quadratic `Q`)
- [x] Glow path only renders when `isVisible && isCompleted`
- [x] UnitProgressCard has `bg-slate-900/40` overlay for contrast
- [x] trail-effects.css has `@supports not` backdrop-filter fallback
- [x] No `window.innerWidth` or `Math.random()` in any new file

## Success Criteria Met

All three shared primitive components built and build-verified:

1. **PathConnector** renders smooth S-curve Bezier paths with viewport-optimized cyan glow for completed sections and dashed gray for locked sections
2. **UnitProgressCard** renders as a WCAG-compliant glass panel with unit metadata
3. **useVisibleNodes** provides Intersection Observer boolean detection

All components ready for consumption by layout components in Plan 02.

## Self-Check: PASSED

**Files created:**
- [x] `src/hooks/useVisibleNodes.js` exists
- [x] `src/components/trail/PathConnector.jsx` exists
- [x] `src/components/trail/UnitProgressCard.jsx` exists

**Files modified:**
- [x] `src/styles/trail-effects.css` has new CSS sections

**Commits verified:**
- [x] `43f6d40` exists (useVisibleNodes + PathConnector)
- [x] `14343f6` exists (UnitProgressCard + CSS)

All artifacts confirmed present on disk and in git history.

## Performance Notes

- Intersection Observer API has excellent browser support (96%+ compatibility)
- Conditional glow rendering reduces GPU load for off-screen elements
- PathConnector calculations are O(1) string operations (no memoization overhead needed)
- Glass-morphism with backdrop-filter has solid fallback for older browsers

## Next Steps

**Plan 02** will create:
- `ZigzagTrailLayout.jsx` (mobile: vertical zigzag with 20-30% / 70-80% horizontal variation)
- `HorizontalTrailLayout.jsx` (desktop: horizontal wavy layout)
- Responsive breakpoint logic (768px threshold)

Both layouts will import and compose these three primitives.
