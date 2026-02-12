# Phase 21: Responsive Layout Rewrite - Research

**Researched:** 2026-02-11
**Domain:** Responsive CSS layout, SVG path animation, glassmorphism UI
**Confidence:** HIGH

## Summary

This phase transforms the trail layout from desktop-only to fully responsive with mobile vertical zigzag (<768px) and desktop horizontal wavy paths (>=768px). The technical challenge centers on SVG Bezier curve connectors, CSS filter performance on low-end devices, and glassmorphism accessibility. Current codebase uses collapsible horizontal unit sections with basic path connectors. The rewrite requires coordinate calculation for zigzag positioning, smooth S-curve path generation, viewport-based rendering optimization (Intersection Observer), and WCAG-compliant glass cards.

Key constraint: Intel Celeron Chromebooks struggle with complex CSS animations and filters. Research indicates CSS `drop-shadow` and `backdrop-filter` can drop below 60fps on budget hardware. Solution: limit filter usage to visible elements only, use `will-change` for GPU acceleration, and leverage Intersection Observer to pause animations outside viewport.

**Primary recommendation:** Use CSS media queries with 768px breakpoint for mobile-first responsive design, cubic Bezier curves (C command) with reflected control points (S command) for smooth SVG path connectors, CSS filters with strict viewport visibility checks, and glassmorphism with semi-opaque text overlays for WCAG contrast.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Zigzag Layout (Mobile)
- Moderate vertical spacing between nodes (100-120px)
- Slight variation in horizontal position (20-30% / 70-80%) rather than exact 25/75 — gives a natural, winding forest path feel
- Auto-scroll to center the current active node in viewport on page load
- Glass card separators sit between units, breaking the trail into visually distinct sections

#### SVG Path Connectors
- Thin lines (2-3px stroke width) — subtle, doesn't compete with node styling
- Completed sections: subtle ambient cyan glow (2-4px blur) — forest-firefly feel, not neon
- Locked/upcoming sections: dashed gray line (classic dash-array in muted gray)
- Gentle, flowing S-curves for Bezier paths — feels like a winding river, not sharp zigzag turns

#### Desktop Horizontal Layout
- Claude's discretion on scroll direction and overall layout pattern (horizontal scroll vs vertical with wider layout vs snaking rows) — pick what works best based on research of similar game trail layouts
- 6-8 nodes visible without scrolling — spacious, generous screen real estate
- Nodes scale larger on desktop — take advantage of available screen space
- Node names always visible on desktop (labels below/beside each node) — mobile shows names only on tap

#### Glass-morphism Unit Cards
- Show unit name (e.g., "Unit 2: Sharps & Flats") and completion count ("4/6 nodes complete")
- Full trail width on mobile — strong visual separator
- Light frosted glass effect (8-12px blur, high transparency) — forest background softly visible through card
- Completed unit cards get a subtle cyan/green border glow to show mastery
- Purely informational — no tap/click interactivity
- Include a small theme icon matching the unit's musical domain (e.g., treble clef for note units)
- Cards appear immediately after the boss node — boss is the "gate," card is the unit summary

### Claude's Discretion
- Desktop layout direction (horizontal scroll vs vertical with wider layout vs snaking rows)
- Exact Bezier control point calculations for S-curves
- Node size scaling ratio between mobile and desktop
- Glass card text sizing and internal padding
- How glass cards integrate with the SVG connector flow (whether connectors pass through or stop at cards)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18 | Component rendering | Already in project |
| Tailwind CSS | Current | Responsive utilities | Mobile-first by default, 768px breakpoint built-in |
| SVG (native) | - | Path connectors | Browser-native, no dependencies, excellent performance |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Intersection Observer API | Native | Viewport visibility detection | Limit animations/filters to visible elements for 60fps |
| CSS Media Queries | Native | Responsive breakpoints | Standard `@media (min-width: 768px)` pattern |
| requestAnimationFrame | Native | Smooth scroll performance | Throttle scroll event handlers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native SVG | Canvas API | Canvas offers better performance for thousands of paths, but SVG is simpler for 93 nodes and easier to style with CSS |
| CSS filters | SVG filter elements | SVG filters offer more control but have worse performance (Firefox drops to 5fps vs Chrome 60fps) |
| Tailwind breakpoints | Custom media queries | Tailwind's built-in `md:` prefix uses 768px, matches requirement exactly |

**Installation:**
No new packages required — all native browser APIs.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/trail/
│   ├── TrailMap.jsx                    # Main container (already exists)
│   ├── TrailNode.jsx                   # Individual node (already exists)
│   ├── ResponsiveTrailSection.jsx      # NEW: Handles mobile/desktop layout switch
│   ├── ZigzagTrailLayout.jsx           # NEW: Mobile vertical zigzag
│   ├── HorizontalTrailLayout.jsx       # NEW: Desktop horizontal/wavy
│   ├── PathConnector.jsx               # EXISTS: Update with S-curve logic
│   └── UnitProgressCard.jsx            # NEW: Glass-morphism separator cards
├── hooks/
│   └── useVisibleNodes.js              # NEW: Intersection Observer hook
└── styles/
    └── trail-effects.css                # EXISTS: Add responsive breakpoints
```

### Pattern 1: Mobile-First Responsive Layout with CSS Media Queries

**What:** Use Tailwind's mobile-first approach with `md:` prefix for 768px+ screens
**When to use:** All layout changes between mobile/desktop
**Example:**
```jsx
// Mobile default, desktop override with md: prefix
<div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
  {/* Vertical zigzag on mobile, horizontal row on desktop */}
</div>

// Node size scaling
<TrailNode
  className="h-16 w-16 md:h-20 md:w-20"  // Larger on desktop
/>
```

**Source:** Tailwind CSS uses mobile-first breakpoints where `md:` applies at 768px and up ([Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design))

### Pattern 2: SVG Bezier S-Curve Path Generation

**What:** Use cubic Bezier with `C` command for initial curve, `S` command for smooth continuation
**When to use:** Generating path connectors between zigzag nodes
**Example:**
```javascript
// Smooth S-curve between two points
function generateSCurvePath(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;

  // Control points at 40% distance for smooth curve
  const cp1x = startX + dx * 0.4;
  const cp1y = startY + dy * 0.2; // Gentle rise

  const cp2x = startX + dx * 0.6;
  const cp2y = startY + dy * 0.8; // Gentle descent

  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
}

// For continuous smooth curves, use S command after first C
function generateMultiSegmentPath(points) {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  // First segment with explicit control points
  const cp1 = { x: points[0].x + (points[1].x - points[0].x) * 0.4, y: points[0].y };
  const cp2 = { x: points[1].x - (points[1].x - points[0].x) * 0.4, y: points[1].y };
  path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${points[1].x} ${points[1].y}`;

  // Subsequent segments use S command (reflects previous control point)
  for (let i = 2; i < points.length; i++) {
    const cp = { x: points[i].x - (points[i].x - points[i-1].x) * 0.4, y: points[i].y };
    path += ` S ${cp.x} ${cp.y}, ${points[i].x} ${points[i].y}`;
  }

  return path;
}
```

**Source:** [MDN SVG Paths - Bezier Curves](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths) and [SitePoint SVG Cubic Curves](https://www.sitepoint.com/html5-svg-cubic-curves/)

### Pattern 3: Viewport-Based Animation with Intersection Observer

**What:** Only animate path connectors and apply filters when visible in viewport
**When to use:** All glow effects, animations on trail paths
**Example:**
```javascript
// Custom hook for viewport visibility
import { useEffect, useState, useRef } from 'react';

export function useVisibleNodes(nodeRefs) {
  const [visibleNodes, setVisibleNodes] = useState(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const nodeId = entry.target.dataset.nodeId;
          setVisibleNodes(prev => {
            const next = new Set(prev);
            if (entry.isIntersecting) {
              next.add(nodeId);
            } else {
              next.delete(nodeId);
            }
            return next;
          });
        });
      },
      {
        root: null, // viewport
        rootMargin: '50px', // Start animating 50px before visible
        threshold: 0.1
      }
    );

    nodeRefs.forEach(ref => {
      if (ref.current) observerRef.current.observe(ref.current);
    });

    return () => observerRef.current?.disconnect();
  }, [nodeRefs]);

  return visibleNodes;
}

// Usage in component
function PathConnector({ nodeId, isCompleted, startX, startY, endX, endY }) {
  const pathRef = useRef(null);
  const isVisible = useVisibleNodes([pathRef]).has(nodeId);

  return (
    <path
      ref={pathRef}
      data-node-id={nodeId}
      d={generateSCurvePath(startX, startY, endX, endY)}
      className={`
        ${isVisible && isCompleted ? 'path-svg-glow--completed' : ''}
        ${!isVisible ? 'opacity-50' : ''}
      `}
      style={{
        filter: isVisible && isCompleted ? 'drop-shadow(0 0 4px #4ade80)' : 'none'
      }}
    />
  );
}
```

**Source:** [MDN Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) and [Mastering Intersection Observer 2026](https://future.forem.com/sherry_walker_bba406fb339/mastering-the-intersection-observer-api-2026-a-complete-guide-561k)

### Pattern 4: Glassmorphism with WCAG-Compliant Contrast

**What:** Frosted glass effect with semi-opaque overlay to ensure text contrast meets WCAG 4.5:1 ratio
**When to use:** Unit progress cards between trail sections
**Example:**
```jsx
function UnitProgressCard({ unit, completed, total, isCompleted }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden">
      {/* Glass background layer */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-white/15 to-white/5"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      />

      {/* Semi-opaque overlay for text contrast (WCAG compliance) */}
      <div className="absolute inset-0 bg-slate-900/40" />

      {/* Content layer with guaranteed contrast */}
      <div className="relative z-10 p-4 flex items-center gap-3">
        <div className="text-2xl">{unit.icon}</div>
        <div>
          <h3 className="text-white font-bold text-sm drop-shadow-lg">
            {unit.name}
          </h3>
          <p className="text-white/90 text-xs font-medium drop-shadow-md">
            {completed}/{total} complete
          </p>
        </div>
      </div>

      {/* Completed unit border glow */}
      {isCompleted && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: '2px solid rgba(74, 222, 128, 0.6)',
            boxShadow: '0 0 12px rgba(74, 222, 128, 0.4)'
          }}
        />
      )}
    </div>
  );
}
```

**Fallback for unsupported backdrop-filter:**
```css
@supports not (backdrop-filter: blur(12px)) {
  .glass-card {
    background: rgba(30, 20, 60, 0.95);
  }
}
```

**Source:** [Axess Lab - Glassmorphism Accessibility](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/) and [Glassmorphism 2025 Implementation Guide](https://playground.halfaccessible.com/blog/glassmorphism-design-trend-implementation-guide)

### Pattern 5: Auto-Scroll to Active Node on Load

**What:** Center the current/active node in viewport when page loads
**When to use:** TrailMap initial render when user has progress
**Example:**
```javascript
import { useEffect, useRef } from 'react';

function TrailMap() {
  const activeNodeRef = useRef(null);

  useEffect(() => {
    // Wait for layout to settle, then scroll to active node
    const timer = setTimeout(() => {
      if (activeNodeRef.current) {
        activeNodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }, 300); // Delay to ensure nodes are rendered

    return () => clearTimeout(timer);
  }, []); // Only on mount

  return (
    <div>
      {nodes.map(node => (
        <TrailNode
          key={node.id}
          ref={node.isCurrent ? activeNodeRef : null}
          node={node}
        />
      ))}
    </div>
  );
}
```

**Source:** [MDN scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) and [Smooth Scrolling Guide](https://hidde.blog/scroll-an-element-into-the-center-of-the-viewport/)

### Pattern 6: GPU-Accelerated Transforms for Performance

**What:** Use `will-change` and `transform: translate3d` to trigger GPU acceleration
**When to use:** Node hover states, active transforms on Chromebooks
**Example:**
```css
/* Existing trail-effects.css pattern to enhance */
.node-3d-active:hover {
  will-change: transform;
  transform: translate3d(0, 0, 0); /* Force GPU layer */
}

.node-3d-active:active {
  transform: translate3d(0, 2px, 0); /* Use translate3d, not translateY */
}

/* Apply containment for better performance */
.trail-node-container {
  contain: layout style paint;
}
```

**Source:** [CSS GPU Acceleration Guide](https://www.lexo.ch/blog/2025/01/boost-css-performance-with-will-change-and-transform-translate3d-why-gpu-acceleration-matters/) and [TestMu AI CSS GPU Acceleration](https://www.testmu.ai/blog/css-gpu-acceleration/)

### Anti-Patterns to Avoid

- **SVG filter elements for glow:** Use CSS `filter: drop-shadow()` instead. SVG filters drop to 5fps in Firefox, while CSS filters maintain 60fps in Chrome. ([SVG Shadows Bugzilla](https://bugzilla.mozilla.org/show_bug.cgi?id=1532300))
- **Scroll event listeners without throttling:** Attach scroll listeners directly causes hundreds of events per second. Use `requestAnimationFrame` throttling or Intersection Observer instead. ([React Scroll Performance](https://geoffroymounier.medium.com/react-hook-optimised-scrollevent-listener-13513649a64d))
- **Backdrop-filter everywhere:** Expensive operation. Apply only to visible glass cards using Intersection Observer. ([Glassmorphism Performance](https://playground.halfaccessible.com/blog/glassmorphism-design-trend-implementation-guide))
- **Exact 25%/75% positioning:** User wants "slight variation" (20-30% / 70-80%) for natural forest path feel, not rigid grid. ([CONTEXT.md locked decision](file:///C:/Users/pagis/OneDrive/WebDev/Projects/PianoApp2/.planning/phases/21-responsive-layout-rewrite/21-CONTEXT.md))

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Viewport visibility detection | Custom scroll position calculation | Intersection Observer API | Native API is async, doesn't block main thread, handles edge cases (iframe, CSS transforms) automatically |
| Bezier curve calculation | Manual cubic curve math | SVG path `C` and `S` commands | Browser-optimized, handles control point reflection, 20+ years of battle-testing |
| Responsive breakpoints | JavaScript window.innerWidth checks | Tailwind CSS `md:` prefix / CSS media queries | Declarative, SSR-safe, automatically debounced, works without JavaScript |
| Smooth scrolling | setInterval animation loops | `scrollIntoView({ behavior: 'smooth' })` | Native implementation respects user preferences (prefers-reduced-motion), optimized by browser |
| GPU acceleration hints | Z-index stacking tricks | `will-change` property | Explicit signal to browser, easier garbage collection when removed |

**Key insight:** Browser APIs for layout, scrolling, and animations are heavily optimized and battle-tested. Hand-rolling alternatives adds complexity, reduces performance, and breaks accessibility (e.g., custom smooth scroll ignores user motion preferences).

## Common Pitfalls

### Pitfall 1: Backdrop-Filter Accessibility Failure

**What goes wrong:** Glassmorphism cards with semi-transparent backgrounds fail WCAG 4.5:1 contrast ratio when text is placed directly on blurred background without overlay.

**Why it happens:** `backdrop-filter: blur(12px)` creates beautiful frosted glass effect, but color values behind the blur are unpredictable (forest background has dark purples, blues, greens). Text can blend into background depending on scroll position.

**How to avoid:**
1. Add semi-opaque overlay layer between glass and text: `bg-slate-900/40` (40% opacity)
2. Test with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) against darkest possible background
3. Add `text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8)` as additional contrast boost
4. Provide fallback for browsers without backdrop-filter support

**Warning signs:**
- Text appears washed out or hard to read in certain scroll positions
- Lighthouse accessibility audit flags contrast issues
- Users with low vision report difficulty reading unit names

**Source:** [Axess Lab Glassmorphism Accessibility](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/)

### Pitfall 2: Intel Celeron Performance Collapse with Filters

**What goes wrong:** Trail rendering drops below 30fps on budget Chromebooks when multiple `filter: drop-shadow()` effects are applied simultaneously to path connectors.

**Why it happens:** Intel Celeron processors lack powerful integrated graphics. CSS filters trigger GPU compositing, but budget GPUs can't handle 20+ filter effects at 60fps. Chromebook target device from requirement "trail scrolling maintains 60fps on Intel Celeron Chromebook."

**How to avoid:**
1. Use Intersection Observer to apply filters ONLY to visible paths (within viewport + 50px margin)
2. Remove `filter` style when path exits viewport
3. Add `will-change: filter` only when path is about to enter viewport
4. Limit filter blur radius to 2-4px (user specified "2-4px blur" for glow)
5. Test on actual target hardware, not developer MacBook Pro

**Warning signs:**
- Smooth scrolling becomes janky on Chromebook
- Chrome DevTools Performance tab shows long paint times (>16ms)
- requestAnimationFrame callbacks miss frames

**Source:** [CSS Drop-Shadow Performance](https://forum.boardgamearena.com/viewtopic.php?t=20663) and [Best CPU for Chromebook 2026](https://www.propelrc.com/best-cpu-for-chromebook/)

### Pitfall 3: Bezier Control Point Miscalculation Creates Sharp Corners

**What goes wrong:** S-curve paths have sharp angles or loops instead of smooth flowing curves when control points are calculated incorrectly.

**Why it happens:** Control points placed too close to start/end points create tight curves. Control points on wrong side of line create loops. User wants "gentle, flowing S-curves" not "sharp zigzag turns."

**How to avoid:**
1. Place control points at 40% distance between start and end (`dx * 0.4`, `dx * 0.6`)
2. Offset control points perpendicular to line direction for vertical zigzags
3. Use `S` command after first `C` to automatically reflect previous control point
4. Test with extreme cases: horizontal connections, vertical connections, diagonal connections

**Example of correct control point calculation:**
```javascript
// For vertical zigzag (dx large, dy small)
const dx = endX - startX;
const dy = endY - startY;

// Control points 40% along path
const cp1x = startX + dx * 0.4;
const cp1y = startY + dy * 0.3; // Slight vertical offset

const cp2x = endX - dx * 0.4;
const cp2y = endY - dy * 0.3; // Mirror offset
```

**Warning signs:**
- Path has visible corners at control points
- Path crosses over itself creating a loop
- Path doesn't match gentle "river" aesthetic from CONTEXT.md

**Source:** [JavaScript.info Bezier Curves](https://javascript.info/bezier-curve) and [Smooth Bezier Curve Article](https://medium.com/@demayous1/smooth-bezier-curve-b5c7e4a59c0d)

### Pitfall 4: Duolingo's Tree-to-Path Transition Ignored

**What goes wrong:** Attempting to implement old Duolingo skill tree structure instead of current single-path design, creating confusing UX.

**Why it happens:** Developer assumes Duolingo still uses tree structure from 2019. Current Duolingo (2024+) moved to single linear path with units, abandoning the flexible tree model.

**How to avoid:**
1. Research shows Duolingo now uses a single sequential path ("the path") instead of branching tree
2. User requirement specifies "trail" (linear progression) not "tree" (branching)
3. Current TrailMap.jsx already uses unit-based grouping with collapsible sections (correct pattern)
4. Don't add branching logic or parallel path choices

**Source:** [Duolingo Home Screen Redesign](https://blog.duolingo.com/new-duolingo-home-screen-design/) - "All Duolingo users now follow a single route called 'the path'"

### Pitfall 5: Responsive Layout Breaks Node Tap Targets on Mobile

**What goes wrong:** Nodes become too small to tap comfortably on mobile (<44px touch target), violating WCAG 2.5.5 guidelines.

**Why it happens:** Desktop node size (70px from current code) scales down for mobile to fit zigzag pattern, dropping below minimum touch target size.

**How to avoid:**
1. Maintain minimum 44px touch target on mobile (WCAG guideline)
2. Use `className="h-16 w-16 md:h-20 md:w-20"` (64px mobile, 80px desktop)
3. Add padding around tap target if visual node is smaller than 44px
4. Test with real fingers, not mouse cursor

**Warning signs:**
- Users tap wrong node frequently
- Accessibility audit flags touch target size
- Nodes feel cramped on mobile screen

**Source:** [Tailwind Min Touch Sizes](https://tailwindcss.com/docs/responsive-design) (project tailwind.config.js defines `minHeight.touch: "44px"`)

## Desktop Layout Recommendation (Claude's Discretion)

### Option Analysis

After researching game trail maps and Duolingo's design evolution, I recommend **vertical scroll with wavy horizontal layout** over horizontal scroll or snaking rows:

**Vertical Scroll with Wide Horizontal Layout (RECOMMENDED):**
- ✅ Natural scroll direction users expect (Duolingo abandoned horizontal scroll for vertical in 2023)
- ✅ 6-8 nodes fit horizontally in centered container (max-width: 1200px)
- ✅ Nodes form gentle waves left-to-right, similar to mobile zigzag but compressed
- ✅ Scroll position persists correctly (browsers handle vertical scroll state better)
- ✅ Unit cards span full width between units, creating clear chapters
- ✅ No horizontal scrollbar needed (entire width visible)

**Horizontal Scroll (NOT RECOMMENDED):**
- ❌ Duolingo research shows they moved away from this pattern
- ❌ Scroll position hard to persist (X coordinate reset on reload)
- ❌ Desktop users don't expect horizontal scroll (no scroll wheel support)
- ❌ RTL language support complex (Hebrew support is in project)

**Snaking Rows (NOT RECOMMENDED):**
- ❌ Difficult to maintain visual flow between rows
- ❌ Path connectors must wrap to next row (complex logic)
- ❌ Unit boundaries unclear when units span multiple rows

### Recommended Desktop Layout Pattern

```
Desktop (768px+):
┌─────────────────────────────────────────┐
│         [Unit 1 Glass Card]            │
├─────────────────────────────────────────┤
│    ●────●────●────●────●────👑          │  (6-8 nodes horizontally)
│     ↘  ↗  ↘  ↗  ↘  ↗  ↘                │
├─────────────────────────────────────────┤
│         [Unit 2 Glass Card]            │
├─────────────────────────────────────────┤
│    ●────●────●────●────●────👑          │
└─────────────────────────────────────────┘
      ↓ Vertical scroll
```

**Implementation approach:**
1. Container: `max-w-6xl mx-auto` (centered, ~1152px max)
2. Nodes: Horizontal spacing `space-x-8` to `space-x-12` (64-96px between)
3. Wave amplitude: ±20px vertical offset using sine wave (`Math.sin(index * 0.7) * 20`)
4. Node size: `h-20 w-20` (80px, larger than mobile 64px)
5. Labels: Always visible below node, `text-sm font-semibold`

**Source:** [Duolingo Design Evolution](https://blog.duolingo.com/new-duolingo-home-screen-design/) and user requirement "6-8 nodes visible without scrolling"

## Code Examples

### Example 1: Responsive Zigzag Layout Component

```jsx
// ZigzagTrailLayout.jsx
import { useMemo } from 'react';
import TrailNode from './TrailNode';
import PathConnector from './PathConnector';
import UnitProgressCard from './UnitProgressCard';

function ZigzagTrailLayout({ nodes, unitBoundaries, completedNodeIds }) {
  // Calculate zigzag positions with slight variation (20-30% / 70-80%)
  const nodePositions = useMemo(() => {
    const positions = [];
    let currentY = 100; // Start Y position

    nodes.forEach((node, index) => {
      const isLeft = index % 2 === 0;

      // Add random variation to horizontal position (CONTEXT.md requirement)
      const baseX = isLeft ? 25 : 75;
      const variation = (Math.random() * 10) - 5; // ±5% variation
      const x = Math.max(20, Math.min(80, baseX + variation)); // Clamp to 20-80%

      positions.push({
        node,
        x: `${x}%`,
        y: currentY,
        isLeft
      });

      currentY += 110; // 100-120px spacing (user specified)
    });

    return positions;
  }, [nodes]);

  return (
    <div className="relative w-full">
      {/* SVG layer for path connectors */}
      <svg
        className="absolute inset-0 w-full pointer-events-none"
        style={{ height: `${nodePositions[nodePositions.length - 1]?.y + 100}px` }}
      >
        {nodePositions.map((pos, index) => {
          if (index === 0) return null;
          const prevPos = nodePositions[index - 1];
          const isCompleted = completedNodeIds.includes(prevPos.node.id);

          return (
            <PathConnector
              key={`path-${pos.node.id}`}
              startX={prevPos.x}
              startY={prevPos.y}
              endX={pos.x}
              endY={pos.y}
              isCompleted={isCompleted}
              nodeId={pos.node.id}
            />
          );
        })}
      </svg>

      {/* Nodes layer */}
      {nodePositions.map((pos, index) => {
        const isUnitEnd = unitBoundaries.includes(pos.node.id);

        return (
          <div key={pos.node.id}>
            <div
              className="absolute"
              style={{
                left: pos.x,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <TrailNode
                node={pos.node}
                isCompleted={completedNodeIds.includes(pos.node.id)}
                className="h-16 w-16" // Mobile size
              />
            </div>

            {/* Unit card after boss node */}
            {isUnitEnd && (
              <div
                className="absolute w-full px-4"
                style={{ top: `${pos.y + 80}px` }}
              >
                <UnitProgressCard
                  unit={pos.node.unit}
                  completed={/* calculate */}
                  total={/* calculate */}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ZigzagTrailLayout;
```

### Example 2: S-Curve Path Connector with Viewport Optimization

```jsx
// PathConnector.jsx (enhanced version)
import { useRef, useState, useEffect } from 'react';

function PathConnector({ startX, startY, endX, endY, isCompleted, nodeId }) {
  const pathRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Convert percentage to pixels (for percentage-based positioning)
  const startXPx = typeof startX === 'string'
    ? parseFloat(startX) / 100 * window.innerWidth
    : startX;
  const endXPx = typeof endX === 'string'
    ? parseFloat(endX) / 100 * window.innerWidth
    : endX;

  // Calculate smooth S-curve path
  const pathData = useMemo(() => {
    const dx = endXPx - startXPx;
    const dy = endY - startY;

    // Control points for gentle flowing curve (CONTEXT.md: "flowing river")
    const cp1x = startXPx + dx * 0.4;
    const cp1y = startY + dy * 0.3;

    const cp2x = endXPx - dx * 0.4;
    const cp2y = endY - dy * 0.3;

    return `M ${startXPx} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endXPx} ${endY}`;
  }, [startXPx, startY, endXPx, endY]);

  // Intersection Observer for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '50px', threshold: 0.1 }
    );

    if (pathRef.current) {
      observer.observe(pathRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <g ref={pathRef} data-node-id={nodeId}>
      {/* Glow layer (only when visible and completed) */}
      {isVisible && isCompleted && (
        <path
          d={pathData}
          fill="none"
          stroke="rgba(0, 242, 255, 0.4)"
          strokeWidth="8"
          strokeLinecap="round"
          style={{
            filter: 'blur(4px)' // CONTEXT.md: "2-4px blur"
          }}
        />
      )}

      {/* Main path line */}
      <path
        d={pathData}
        fill="none"
        stroke={isCompleted ? '#00FFFF' : 'rgba(255, 255, 255, 0.2)'}
        strokeWidth={isCompleted ? 3 : 2} // CONTEXT.md: "2-3px stroke"
        strokeLinecap="round"
        strokeDasharray={isCompleted ? 'none' : '12 8'} // CONTEXT.md: dashed for locked
        className="transition-all duration-300"
      />
    </g>
  );
}

export default PathConnector;
```

### Example 3: WCAG-Compliant Glass Unit Card

```jsx
// UnitProgressCard.jsx
function UnitProgressCard({ unit, completed, total, isCompleted }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg">
      {/* Backdrop blur layer (8-12px per CONTEXT.md) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      />

      {/* Semi-opaque overlay for WCAG contrast */}
      <div className="absolute inset-0 bg-slate-900/40" />

      {/* Content with guaranteed contrast */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Theme icon (CONTEXT.md requirement) */}
          <div className="text-3xl drop-shadow-lg">
            {unit.icon}
          </div>

          <div>
            <h3 className="text-white font-bold text-base drop-shadow-md">
              {unit.name}
            </h3>
            <p className="text-white/90 text-sm font-medium drop-shadow-sm">
              {completed}/{total} complete
            </p>
          </div>
        </div>

        {/* Star rating display */}
        <div className="text-yellow-400 text-lg">
          {'⭐'.repeat(Math.floor((completed / total) * 3))}
        </div>
      </div>

      {/* Completed unit glow (CONTEXT.md: "subtle cyan/green border glow") */}
      {isCompleted && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: '2px solid rgba(74, 222, 128, 0.6)',
            boxShadow: '0 0 12px rgba(74, 222, 128, 0.4), inset 0 0 8px rgba(74, 222, 128, 0.2)'
          }}
        />
      )}

      {/* Fallback for browsers without backdrop-filter */}
      <style jsx>{`
        @supports not (backdrop-filter: blur(12px)) {
          .absolute.inset-0:first-child {
            background: rgba(30, 20, 60, 0.95);
          }
        }
      `}</style>
    </div>
  );
}

export default UnitProgressCard;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Duolingo skill tree | Linear path with units | 2023 | Simplified UX, better retention through spaced repetition |
| Horizontal scroll trails | Vertical scroll with horizontal layout | 2024 | Natural scroll direction, better scroll state persistence |
| SVG filter elements | CSS `filter: drop-shadow()` | 2020+ | Better performance (60fps in Chrome vs 5fps Firefox SVG filters) |
| Scroll event listeners | Intersection Observer API | 2019+ | Async, non-blocking, battery efficient |
| Box-shadow for glow | Drop-shadow filter | 2018+ | Follows element shape, not bounding box |

**Deprecated/outdated:**
- **Manual scroll throttling:** Intersection Observer handles viewport detection better
- **Canvas for simple paths:** SVG is easier to style and more accessible
- **User-metadata for JWT roles:** Security vulnerability, use database state (from CLAUDE.md Security Hardening)

## Open Questions

1. **Glass card position in SVG coordinate space**
   - What we know: Unit cards should appear after boss nodes as "chapter breaks"
   - What's unclear: Should SVG path connectors stop at the card, pass through it, or skip around it?
   - Recommendation: Stop paths at card top edge, resume at card bottom edge. Creates visual "gate" effect where boss closes one chapter, card summarizes it, next path begins new chapter.

2. **Node size scaling ratio mobile-to-desktop**
   - What we know: Desktop should be "larger," mobile minimum 44px touch target
   - What's unclear: Optimal ratio for "spacious" desktop feel
   - Recommendation: 64px mobile (h-16 w-16), 80px desktop (h-20 w-20) = 1.25x scaling. Feels substantial without overwhelming. User can adjust if too large/small.

3. **Horizontal variation consistency across reloads**
   - What we know: User wants "20-30% / 70-80%" variation, not exact 25/75
   - What's unclear: Should variation be randomized per render or deterministic per node?
   - Recommendation: Deterministic. Use `Math.sin(nodeIndex * 1.7) * 5` for variation so paths look consistent across page reloads. Random variation causes paths to "jump" on reload.

4. **Desktop path connector density**
   - What we know: 6-8 nodes visible horizontally
   - What's unclear: Should all 93 nodes be laid out horizontally (requiring very long scroll), or should layout wrap after each unit?
   - Recommendation: Horizontal within unit, vertical between units (similar to current collapsible unit design). Each unit is a horizontal row, glass card separates rows. Prevents insanely long horizontal trail.

## Sources

### Primary (HIGH confidence)
- [MDN Web Docs - Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - Viewport visibility detection patterns
- [MDN Web Docs - SVG Paths](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths) - Bezier curve syntax and commands
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design) - Mobile-first breakpoint system
- [MDN Web Docs - scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) - Auto-scroll API
- [MDN Web Docs - CSS filter](https://developer.mozilla.org/en-US/docs/Web/CSS/filter) - Drop-shadow performance characteristics

### Secondary (MEDIUM confidence)
- [BrowserStack Guide - Responsive Design Breakpoints](https://www.browserstack.com/guide/responsive-design-breakpoints) - Industry standard breakpoints including 768px
- [SitePoint - HTML5 SVG Cubic Curves](https://www.sitepoint.com/html5-svg-cubic-curves/) - Practical Bezier curve examples
- [Axess Lab - Glassmorphism Accessibility](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/) - WCAG contrast strategies
- [JavaScript.info - Bezier Curves](https://javascript.info/bezier-curve) - Mathematical foundation and control point calculation
- [Duolingo Blog - Home Screen Redesign](https://blog.duolingo.com/new-duolingo-home-screen-design/) - Current UX patterns for skill paths
- [CSS GPU Acceleration Guide](https://www.lexo.ch/blog/2025/01/boost-css-performance-with-will-change-and-transform-translate3d-why-gpu-acceleration-matters/) - will-change and transform3d best practices

### Tertiary (LOW confidence - requires validation)
- [Best CPU for Chromebook 2026](https://www.propelrc.com/best-cpu-for-chromebook/) - Intel Celeron performance characteristics (needs real device testing)
- [Board Game Arena Forum - Drop-Shadow Performance](https://forum.boardgamearena.com/viewtopic.php?t=20663) - Anecdotal CSS filter performance reports (not scientific benchmark)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All native browser APIs, no new dependencies
- Architecture patterns: HIGH - SVG Bezier curves well-documented, Intersection Observer widely used, glassmorphism patterns established
- Pitfalls: MEDIUM - Performance on Intel Celeron needs device validation, WCAG contrast requires testing with actual backgrounds

**Research date:** 2026-02-11
**Valid until:** 30 days (2026-03-13) - Stable technologies, no fast-moving framework dependencies
