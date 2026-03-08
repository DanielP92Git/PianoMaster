---
phase: 22-performance-optimization-deployment
plan: 01
subsystem: trail-accessibility-rtl
tags: [accessibility, rtl, wcag, service-worker, deployment]
completed: 2026-02-11

dependency-graph:
  requires: [21-03-visual-verification]
  provides: [trail-wcag-aa-compliant, rtl-support, sw-cache-v4]
  affects: [trail-map, trail-nodes, service-worker]

tech-stack:
  added: []
  patterns:
    - RTL-aware keyboard navigation (ArrowLeft/Right swap)
    - focus-visible outlines for accessibility
    - aria-roledescription for screen readers
    - Service worker cache versioning

key-files:
  created: []
  modified:
    - public/sw.js: Cache v3→v4, whitelist updated
    - src/components/trail/TrailMap.jsx: RTL navigation, 48px tabs, region ARIA
    - src/components/trail/ZigzagTrailLayout.jsx: RTL node mirroring
    - src/components/trail/TrailNode.jsx: Enhanced ARIA labels with stars
    - src/styles/trail-effects.css: Focus-visible outlines

decisions:
  - decision: "Bump service worker cache from v3 to v4"
    rationale: "Phases 19-21 redesigned trail system, v3 cache serves stale assets"
    impact: "Production users get new zigzag layout instead of cached horizontal layout"
    alternatives: []

  - decision: "RTL mode mirrors x-axis (100 - xPercent) instead of reversing node order"
    rationale: "Maintains visual zigzag pattern while respecting RTL reading direction"
    impact: "Hebrew users see mirrored trail path that reads right-to-left"
    alternatives: ["Reverse node array order (rejected - breaks progression flow)"]

  - decision: "White 3px outline for focus-visible on all node states"
    rationale: "High contrast against dark forest background, consistent across states"
    impact: "Keyboard users can clearly see focused nodes"
    alternatives: ["State-specific colors (rejected - consistency more important)"]

metrics:
  duration_minutes: 3.3
  tasks_completed: 1
  files_modified: 5
  commits: 1
  lines_changed: 43
  completed_date: 2026-02-11
---

# Phase 22 Plan 01: Service Worker Cache Bump + Accessibility & RTL Fixes

**One-liner:** Bumped service worker to v4, added WCAG AA touch targets (48px tabs), RTL-aware keyboard navigation, focus-visible outlines, and enhanced screen reader support for trail page deployment.

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Service worker cache bump + accessibility and RTL fixes | ✓ | b24f435 |

## Implementation Details

### Service Worker Cache Version (public/sw.js)
- **Changed:** `CACHE_NAME` from `"pianomaster-v3"` to `"pianomaster-v4"`
- **Updated:** `CACHE_WHITELIST` array to include `"pianomaster-v4"`
- **Reason:** Phases 19-21 redesigned the trail system (ZigzagTrailLayout, HorizontalTrailLayout, new trail-effects.css). The v3 cache still serves stale versions of these bundled assets. Bumping to v4 triggers the activate handler to delete v3 cache, forcing production users to receive the new responsive zigzag trail layout.

### WCAG Touch Targets (TrailMap.jsx)
- **Added:** `min-h-[48px]` to tab button className
- **Before:** `px-5 py-2.5` (approx 40-44px height)
- **After:** Guaranteed 48x48px minimum touch target per WCAG 2.2 AA (2.5.8 Target Size)

### RTL Keyboard Navigation (TrailMap.jsx)
- **Added:** `const isRTL = i18n.dir() === 'rtl';` using existing i18n instance
- **Changed:** `handleTabKeyDown` to swap ArrowLeft/ArrowRight behavior in RTL:
  ```javascript
  const nextKey = isRTL ? 'ArrowLeft' : 'ArrowRight';
  const prevKey = isRTL ? 'ArrowRight' : 'ArrowLeft';
  ```
- **Impact:** Hebrew users can navigate tabs intuitively (right arrow goes to previous tab in RTL)

### RTL Node Positioning (ZigzagTrailLayout.jsx)
- **Added:** `isRTL` prop (default `false`)
- **Changed:** Position calculation mirrors x-axis for RTL:
  ```javascript
  let xPercent = basePercent + variation;
  if (isRTL) {
    xPercent = 100 - xPercent;
  }
  ```
- **Impact:** Zigzag pattern mirrors for RTL users (nodes at 25%/75% become 75%/25%), maintaining visual flow

### Enhanced Screen Reader Labels (TrailNode.jsx)
- **Changed:** `aria-label` from `"Node Name - State"` to `"Node Name - State - N stars"` (when completed)
  - Example: `"C, D, E - completed - 3 stars"` vs `"C, D, E - completed"`
- **Added:** `aria-roledescription="skill node"` to button element
- **Impact:** Screen readers announce richer context (position, state, achievement)

### Focus-Visible Styles (trail-effects.css)
- **Added:** New Section 11 with focus-visible rules:
  ```css
  .node-3d-active:focus-visible,
  .node-3d-completed:focus-visible,
  .node-3d-available:focus-visible,
  .node-3d-locked:focus-visible,
  .node-3d-locked-boss:focus-visible {
    outline: 3px solid #fff;
    outline-offset: 3px;
  }
  ```
- **Reason:** White outline provides high contrast against dark forest background (WCAG 2.2 2.4.11 Focus Not Obscured)

### ARIA Region for Tab Panel (TrailMap.jsx)
- **Added:** `aria-label` to tab panel div for screen reader context
- **Before:** `<div id="treble-panel" role="tabpanel" aria-labelledby="treble-tab">`
- **After:** `<div ... aria-label="treble learning path">`
- **Impact:** Screen readers announce panel purpose on focus

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification checks passed:

```bash
# Build passes
npm run build
✓ Build completed successfully (3184 modules)

# Service worker cache bump
grep -n "pianomaster-v4" public/sw.js
4:const CACHE_NAME = "pianomaster-v4";

# RTL awareness in TrailMap
grep -n "isRTL" src/components/trail/TrailMap.jsx
187:  const isRTL = i18n.dir() === 'rtl';
226:    const nextKey = isRTL ? 'ArrowLeft' : 'ArrowRight';
227:    const prevKey = isRTL ? 'ArrowRight' : 'ArrowLeft';
423:          isRTL={isRTL}

# RTL mirroring in ZigzagTrailLayout
grep -n "isRTL" src/components/trail/ZigzagTrailLayout.jsx
25:  isRTL = false
122:        if (isRTL) {

# Focus-visible styles
grep -n "focus-visible" src/styles/trail-effects.css
353:.node-3d-active:focus-visible,
354:.node-3d-completed:focus-visible,
...

# Enhanced ARIA labels
grep -n "aria-roledescription" src/components/trail/TrailNode.jsx
103:        aria-roledescription="skill node"

# 48px touch targets
grep -n "min-h-\[48px\]" src/components/trail/TrailMap.jsx
391:                flex flex-col items-center px-5 py-2.5 min-h-[48px] rounded-full text-sm font-bold
```

## Known Issues

None.

## Self-Check: PASSED

**Files verified:**
- ✓ public/sw.js contains `pianomaster-v4`
- ✓ src/components/trail/TrailMap.jsx contains `isRTL`, `min-h-[48px]`, RTL keyboard logic
- ✓ src/components/trail/ZigzagTrailLayout.jsx contains RTL mirroring
- ✓ src/components/trail/TrailNode.jsx contains enhanced ARIA labels
- ✓ src/styles/trail-effects.css contains focus-visible outlines

**Commits verified:**
- ✓ b24f435: feat(22-01): bump service worker cache + accessibility and RTL fixes

**Build status:**
- ✓ npm run build completed without errors

## Next Steps

Plan 22-02: Final production deployment checks
- Lighthouse audit (performance, accessibility, best practices)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsiveness verification
- Pre-deployment checklist execution
