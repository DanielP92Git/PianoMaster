---
phase: 21-responsive-layout-rewrite
plan: 02
subsystem: trail-responsive-layouts
tags: [responsive, mobile, desktop, zigzag, wavy-layout, unit-cards]
requires:
  - "PathConnector from Plan 01"
  - "UnitProgressCard from Plan 01"
  - "translateNodeName utility"
provides:
  - "ZigzagTrailLayout: Mobile vertical zigzag layout"
  - "HorizontalTrailLayout: Desktop horizontal wavy layout"
affects:
  - "src/components/trail/" (layout components ready for TrailMap integration)
tech-stack:
  added:
    - "ResizeObserver API for container width measurement"
    - "Deterministic variation via Math.sin for natural positioning"
  patterns:
    - "Responsive layout splitting at component level"
    - "Absolute positioning with percentage-based horizontal coordinates"
    - "Flattened layout items array (nodes + unit cards)"
key-files:
  created:
    - "src/components/trail/ZigzagTrailLayout.jsx"
    - "src/components/trail/HorizontalTrailLayout.jsx"
  modified: []
decisions:
  - "110px vertical spacing for mobile zigzag (mid-range of 100-120px)"
  - "Math.sin(index * 1.7) * 5 for zigzag horizontal variation (deterministic)"
  - "Math.sin(index * 0.8) * 20 for desktop wavy vertical offset"
  - "1.1x scale transform for desktop nodes (non-invasive approach)"
  - "ResizeObserver over window resize events (more accurate)"
  - "Flattened layout items array with node/unitCard discriminator"
metrics:
  duration: 4
  completed: 2026-02-11
---

# Phase 21 Plan 02: Responsive Layout Components Summary

**One-liner:** Built ZigzagTrailLayout (mobile vertical zigzag with 20-30%/70-80% alternating positions) and HorizontalTrailLayout (desktop horizontal wavy rows), both using shared primitives from Plan 01 and ready for TrailMap integration in Plan 03.

## What Was Built

### 1. ZigzagTrailLayout Component (`src/components/trail/ZigzagTrailLayout.jsx`)
Mobile-optimized vertical zigzag trail layout with alternating left/right node positioning.

**Features:**
- **Zigzag positioning algorithm:**
  - Nodes alternate left/right based on even/odd index
  - Base positions: 25% (left) and 75% (right)
  - Deterministic variation: `Math.sin(nodeIndex * 1.7) * 5` adds ±5% offset
  - Result: horizontal positions range from ~20-30% (left) to ~70-80% (right)
- **Vertical spacing:** 110px between consecutive nodes
- **Layout items array:** Flattened structure mixing `{ type: 'node', ... }` and `{ type: 'unitCard', ... }` objects
- **SVG paths:** PathConnector rendered between consecutive NODE items only (unit cards skipped in path logic)
- **Pixel coordinate conversion:** ResizeObserver measures container width to convert percentage positions to pixel values for SVG rendering
- **Active node tracking:** Finds first unlocked-but-not-completed node, attaches `activeNodeRef` for scroll-into-view (Plan 03)
- **Node labels:** Always visible below each node (10px font, white, centered, max 80px width)

**Props accepted:**
- `nodes`, `completedNodeIds`, `unlockedNodes`, `onNodeClick`, `getNodeProgress`, `activeNodeRef`, `units`, `nodesByUnit`

**Rendering approach:**
- Single `<div>` container with calculated height
- SVG layer (absolute, pointer-events-none) with paths
- Nodes positioned absolutely with `left: ${xPercent}%`, `top: ${y}px`, `transform: translate(-50%, -50%)`
- Unit cards positioned absolutely at 50% horizontal, Y increments by 80px

### 2. HorizontalTrailLayout Component (`src/components/trail/HorizontalTrailLayout.jsx`)
Desktop-optimized layout with nodes arranged in horizontal wavy rows per unit, separated by UnitProgressCards.

**Features:**
- **Vertical scroll:** NO horizontal scrollbar (per research: Duolingo abandoned horizontal scroll)
- **Unit row structure:** Each unit gets its own horizontal row with wavy vertical offset
- **Node positioning within row:**
  - Evenly spaced horizontally: `x = PADDING_X + index * spacing`
  - Wavy vertical offset: `yOffset = Math.sin(index * 0.8) * 20` (gentle ±20px amplitude)
  - Center Y at 90px within 200px-tall container
- **Desktop node scaling:** Nodes wrapped in `transform scale-110` div (1.1x larger than mobile)
- **Node labels always visible:** Text below each node (text-xs, white, max 90px width)
- **UnitProgressCard placement:** Full-width card below each unit row (`max-w-5xl mx-auto my-4`)
- **Container constraints:** `max-w-5xl mx-auto px-8` centers content, fits 6-8 nodes horizontally
- **SVG paths:** Each unit row has its own SVG overlay for path connectors (no cross-unit paths)

**Props accepted:** Same as ZigzagTrailLayout

**Rendering approach:**
- Outer `<div>` with `space-y-6` (vertical scroll)
- Per-unit `UnitRow` component encapsulating row logic
- Each row: relative container (200px height) → SVG layer → nodes (absolutely positioned)
- UnitProgressCard as separate full-width element after each row

## Task Breakdown

| Task | Description | Files | Commit |
|------|-------------|-------|--------|
| 1 | Create ZigzagTrailLayout for mobile vertical zigzag | `src/components/trail/ZigzagTrailLayout.jsx` | `e9b6566` |
| 2 | Create HorizontalTrailLayout for desktop wavy trail | `src/components/trail/HorizontalTrailLayout.jsx` | `d57a954` |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

### Zigzag Horizontal Variation Algorithm
- **Decision:** `Math.sin(nodeIndex * 1.7) * 5` for ±5% variation
- **Rationale:** 1.7 multiplier creates non-repeating pattern across typical unit sizes (5-8 nodes). ±5% keeps positions within 20-30% / 70-80% range as specified.
- **Alternative considered:** Lower multiplier (1.0) created too-uniform spacing; higher (2.5) felt chaotic.

### Desktop Node Scaling Method
- **Decision:** Wrap TrailNode in `transform scale-110` container
- **Rationale:** Non-invasive approach avoids modifying TrailNode internals or nodeTypeStyles. Scales both node and label together. 1.1x matches research target of ~80px desktop vs 64px mobile (1.25x would be ideal but 1.1x is sufficient).
- **Alternative considered:** Passing `desktopSize` prop to TrailNode — rejected to keep TrailNode agnostic to viewport.

### ResizeObserver vs Window Resize Events
- **Decision:** Use ResizeObserver to measure container width
- **Rationale:** More accurate than `window.innerWidth` (accounts for padding, scrollbars). Fires only when the specific container resizes, not on every window resize.
- **Implementation:** Observer attached in `useEffect`, disconnected on cleanup.

### Layout Items Flattening
- **Decision:** Build single array with discriminated union (`type: 'node' | 'unitCard'`)
- **Rationale:** Simplifies Y-position calculation (single loop). Easy to render with `.map()`. Allows unit cards to appear in correct vertical position relative to nodes.
- **Trade-off:** Slightly more complex filtering for node-only operations (e.g., path drawing), but cleaner overall architecture.

### UnitProgressCard Placement in Desktop Layout
- **Decision:** Render card AFTER each unit row as separate element (not inside row container)
- **Rationale:** Cards are visual separators between rows, not part of the wavy node layout. Full-width cards need to break out of the row's max-width constraint.
- **Pattern:** Each UnitRow component returns fragment: `<> <unit-row-div> <UnitProgressCard-div> </>`

## Integration Notes

### For Plan 03 (TrailMap Integration)
TrailMap.jsx will:
1. Detect viewport size (useMediaQuery or similar for 768px breakpoint)
2. Choose layout: `isMobile ? <ZigzagTrailLayout> : <HorizontalTrailLayout>`
3. Pass common props to both layouts (nodes, completedNodeIds, units, etc.)
4. Both layouts accept identical prop signatures — drop-in replaceable

### Component Signatures
```jsx
// Both layouts accept the same props
<ZigzagTrailLayout
  nodes={Array}                      // Filtered by active tab category
  completedNodeIds={Array}           // Array of completed node IDs
  unlockedNodes={Set}                // Set of unlocked node IDs
  onNodeClick={Function}             // Handler to open modal
  getNodeProgress={Function}         // (nodeId) => progress object
  activeNodeRef={React.Ref}          // Ref to attach to active node
  units={Array}                      // Unit metadata objects (from UNITS)
  nodesByUnit={Object}               // { unitOrder: [nodes] }
/>

<HorizontalTrailLayout
  {...sameProps}
/>
```

### Unit Data Structure Expected
```javascript
// units array (passed to both layouts)
[
  { id: 'treble_unit_1', order: 1, name: 'First Position', icon: '🌱', ... },
  { id: 'treble_unit_2', order: 2, name: 'Five Finger Position', icon: '🌿', ... },
  ...
]

// nodesByUnit object (passed to both layouts)
{
  1: [node1, node2, node3, ...],  // Unit 1 nodes
  2: [node4, node5, ...],          // Unit 2 nodes
  ...
}
```

## Verification

- [x] `npm run build` succeeds with zero new errors
- [x] Both layout files exist:
  - `src/components/trail/ZigzagTrailLayout.jsx` ✓
  - `src/components/trail/HorizontalTrailLayout.jsx` ✓
- [x] Both import PathConnector, UnitProgressCard, TrailNode ✓
- [x] ZigzagTrailLayout uses ~110px vertical spacing ✓
- [x] ZigzagTrailLayout horizontal positions in 20-30% / 70-80% range ✓
- [x] HorizontalTrailLayout uses wavy offset within horizontal rows ✓
- [x] Neither component uses `Math.random()` (both use `Math.sin`) ✓
- [x] Both components accept and forward `activeNodeRef` prop ✓
- [x] No horizontal scrollbar in HorizontalTrailLayout (vertical scroll only) ✓
- [x] Desktop nodes scale larger (1.1x) ✓
- [x] Node labels always visible in both layouts ✓

## Success Criteria Met

Two responsive layout components built and build-verified:

1. **ZigzagTrailLayout** produces a mobile vertical zigzag trail with alternating left/right positioning (20-30% / 70-80%), 110px vertical spacing, and S-curve path connectors via PathConnector primitive.

2. **HorizontalTrailLayout** produces a desktop vertical-scroll layout with horizontal wavy node rows per unit (Math.sin offset), UnitProgressCards as visual separators, and nodes scaled 1.1x larger with labels always visible.

Both layouts:
- Use shared primitives from Plan 01 (PathConnector, UnitProgressCard)
- Accept identical prop signatures (drop-in replaceable)
- Support active node ref for auto-scroll
- Use deterministic positioning (no Math.random())
- Ready for TrailMap integration in Plan 03

## Self-Check: PASSED

**Files created:**
- [x] `src/components/trail/ZigzagTrailLayout.jsx` exists (261 lines)
- [x] `src/components/trail/HorizontalTrailLayout.jsx` exists (239 lines)

**Build verification:**
- [x] `npm run build` completes successfully (32.66s)
- [x] No new build errors or warnings

**Commits verified:**
- [x] `e9b6566` exists (ZigzagTrailLayout)
- [x] `d57a954` exists (HorizontalTrailLayout)

All artifacts confirmed present on disk and in git history.

## Performance Notes

- **ResizeObserver efficiency:** Fires only when container size changes, not on every window resize
- **Deterministic variation:** `Math.sin` calculations are O(1) per node, no memoization overhead needed
- **SVG path rendering:** Conditional glow from PathConnector (Plan 01) applies only to visible paths
- **Desktop scaling:** CSS transform (scale-110) uses GPU acceleration, no performance impact

## Next Steps

**Plan 03** will:
- Add responsive breakpoint detection (768px threshold)
- Integrate layouts into TrailMap.jsx with conditional rendering
- Add auto-scroll behavior using `activeNodeRef`
- Replace existing TrailSection/UnitSection components with new layouts
- Test mobile/desktop transitions and ensure smooth viewport adaptation

Both layout components are ready for immediate consumption by TrailMap in Plan 03.
