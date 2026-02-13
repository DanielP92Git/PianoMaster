# Phase 03: Game Layout Optimization - Research

**Researched:** 2026-02-14
**Domain:** Responsive layout design, orientation handling, VexFlow SVG rendering
**Confidence:** HIGH

## Summary

This phase optimizes game layouts for landscape orientation while maintaining portrait functionality per WCAG 1.3.4 requirements. The core technical challenge is managing VexFlow SVG re-rendering on orientation changes without performance degradation, combined with responsive CSS layouts that adapt to both orientations.

The codebase already has solid foundation infrastructure from Phase 02 (useOrientation hook, RotatePromptOverlay component). This phase focuses on CSS layout optimization and VexFlow responsiveness.

**Primary recommendation:** Use Tailwind's custom orientation modifiers (`landscape:` and `portrait:`) with CSS Grid/Flexbox for layout adaptation, debounced ResizeObserver for VexFlow re-rendering, and establish a "landscape-first, portrait-functional" design pattern.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 3.x | Responsive utility-first CSS | Already in project, supports custom media queries |
| ResizeObserver API | Native | Container dimension tracking | Built-in browser API, no external dependencies |
| matchMedia API | Native | Orientation detection | Already used in useOrientation hook |
| VexFlow | v5 | Music notation rendering | Already integrated for sight reading game |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lodash.debounce | 4.x (optional) | Debounce resize callbacks | If native debouncing becomes complex |
| framer-motion | Already in project | Smooth layout transitions | Already used for animations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom orientation modifiers | react-responsive library | Library adds dependency; custom modifiers leverage existing Tailwind config |
| ResizeObserver | window.resize listener | ResizeObserver more accurate for container-based sizing; resize fires on window only |
| Debounced re-render | requestAnimationFrame throttle | Debounce waits for user to finish; rAF fires continuously (60fps) |

**Installation:**
```bash
# No new packages required - all using existing stack
# Optional: if native debouncing becomes unwieldy
npm install lodash.debounce
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   ├── useOrientation.js          # Already exists - orientation detection
│   ├── useRotatePrompt.js         # Already exists - prompt visibility logic
│   └── useVexFlowResize.js        # NEW - VexFlow re-render with debouncing
├── components/
│   ├── orientation/
│   │   └── RotatePromptOverlay.jsx  # Already exists
│   ├── games/
│   │   ├── VictoryScreen.jsx        # Needs landscape layout optimization
│   │   ├── shared/
│   │   │   └── UnifiedGameSettings.jsx  # Needs landscape modal optimization
│   │   └── sight-reading-game/
│   │       └── components/
│   │           └── VexFlowStaffDisplay.jsx  # Needs debounced resize
└── tailwind.config.js              # Extend with orientation modifiers
```

### Pattern 1: Tailwind Custom Orientation Modifiers
**What:** Add `portrait` and `landscape` custom screen modifiers to Tailwind config
**When to use:** All game layouts that differ between orientations
**Example:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      screens: {
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape': { 'raw': '(orientation: landscape)' }
      }
    }
  }
}
```

Usage in components:
```jsx
// Landscape: horizontal flexbox, Portrait: vertical stack
<div className="flex flex-col portrait:flex-col landscape:flex-row landscape:gap-6">
  <VexFlowStaffDisplay />
  <GameControls />
</div>
```

**Source:** [Tailwind CSS Discussions #2397](https://github.com/tailwindlabs/tailwindcss/discussions/2397), [How to Use Viewport Orientations in Tailwind](https://linuxhint.com/how-to-use-viewport-orientations-in-tailwind/)

### Pattern 2: Debounced ResizeObserver for VexFlow
**What:** Wrap ResizeObserver callback in debounce to prevent excessive VexFlow re-renders
**When to use:** VexFlowStaffDisplay component when orientation changes
**Example:**
```javascript
// Source: Verified pattern from research
import { useEffect, useRef, useCallback } from 'react';

export function useVexFlowResize(containerRef, onResize, debounceMs = 150) {
  const debounceTimerRef = useRef(null);

  const debouncedCallback = useCallback((entries) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      onResize({ width: Math.round(width), height: Math.round(height) });
    }, debounceMs);
  }, [onResize, debounceMs]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(debouncedCallback);
    observer.observe(element);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      observer.disconnect();
    };
  }, [containerRef, debouncedCallback]);
}
```

**Source:** [Best Practices for Resize Observer React](https://www.dhiwise.com/post/mastering-resize-observer-react-best-practices), [ResizeObserver with debounce JSFiddle](https://jsfiddle.net/rudiedirkx/p0ckdcnv/)

### Pattern 3: VexFlow Responsive SVG Setup
**What:** Configure VexFlow SVG with viewBox for responsive scaling
**When to use:** VexFlowStaffDisplay initialization and re-render
**Example:**
```javascript
// Current implementation already has this pattern in VexFlowStaffDisplay.jsx
// Lines 279-306: makeSvgResponsive callback

const makeSvgResponsive = useCallback((svgWidth, svgHeight, totalBars = 1) => {
  if (!vexContainerRef.current) return;
  const svg = vexContainerRef.current.querySelector("svg");
  if (!svg) return;

  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

  if (totalBars > 1) {
    // Multi-bar: use pixel width for horizontal scroll
    svg.setAttribute("preserveAspectRatio", "xMinYMid meet");
    svg.style.width = `${svgWidth}px`;
    svg.style.maxWidth = "none";
  } else {
    // Single bar: fit to container
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.width = "100%";
    svg.style.maxWidth = "100%";
  }
  svg.style.height = "auto";
  svg.style.display = "block";
  svg.style.overflow = "visible";
}, []);
```

**Note:** Current implementation already uses ResizeObserver (lines 161-204). Need to ADD debouncing to existing pattern.

**Source:** VexFlowStaffDisplay.jsx (existing codebase), [VexFlow Issue #590](https://github.com/0xfe/vexflow/issues/590)

### Pattern 4: Modal Layout Responsiveness
**What:** Modals adjust layout structure between landscape (wider, shorter) and portrait (taller, narrower)
**When to use:** UnifiedGameSettings, VictoryScreen
**Example:**
```jsx
// VictoryScreen: Landscape uses two-column grid, Portrait uses single column
<div className="
  portrait:max-w-md portrait:flex-col
  landscape:max-w-4xl landscape:grid landscape:grid-cols-2 landscape:gap-6
">
  <div className="landscape:col-span-1">
    {/* Left column: score, stars, XP */}
  </div>
  <div className="landscape:col-span-1">
    {/* Right column: feedback, buttons */}
  </div>
</div>
```

**Source:** [React Modal Best Practices 2026](https://blog.croct.com/post/best-react-modal-dialog-libraries), [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)

### Anti-Patterns to Avoid

- **Anti-pattern: Locking orientation programmatically**
  - Why it's bad: Violates WCAG 1.3.4 (AA requirement)
  - What to do instead: Always keep both orientations functional; optimize for landscape but don't force it

- **Anti-pattern: Re-rendering VexFlow on every resize event**
  - Why it's bad: Resize events fire rapidly (100+ times during drag), causes performance issues
  - What to do instead: Debounce with 100-150ms delay; only re-render when user stops resizing

- **Anti-pattern: Using fixed pixel dimensions for game containers**
  - Why it's bad: Breaks responsiveness, causes overflow on smaller screens
  - What to do instead: Use percentage/viewport units with max-width constraints

- **Anti-pattern: Separate codebases for landscape/portrait**
  - Why it's bad: Maintenance nightmare, code duplication
  - What to do instead: Single codebase with responsive CSS modifiers

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debouncing | Custom setTimeout management | lodash.debounce OR built-in pattern with useRef | Edge cases (cleanup, leading/trailing, cancellation) already handled |
| Orientation detection | Custom window.matchMedia wrapper | Existing useOrientation hook | Already implemented and tested in Phase 02 |
| ResizeObserver polyfill | Custom resize listener fallback | Native ResizeObserver with graceful degradation | Modern browsers support it; fallback to window.resize acceptable |
| Responsive breakpoints | Manual media query listeners | Tailwind custom screens config | Declarative, SSR-safe, works with existing design system |

**Key insight:** Responsive layout problems have well-established solutions. Custom implementations introduce bugs (memory leaks, race conditions, SSR issues). Leverage existing patterns from Tailwind and browser APIs.

## Common Pitfalls

### Pitfall 1: Keyboard Triggering Landscape Styles in Portrait
**What goes wrong:** On mobile devices, opening the soft keyboard in portrait mode makes viewport wider than tall, triggering `(orientation: landscape)` media query
**Why it happens:** Media queries check viewport dimensions, not physical device orientation
**How to avoid:** Use `aspect-ratio` media queries instead of `orientation` when keyboard interference is likely
**Warning signs:** Layout suddenly switches to landscape mode when user taps input field in portrait

**Example:**
```css
/* Vulnerable */
@media (orientation: landscape) { /* Triggers when keyboard opens */ }

/* Better */
@media screen and (min-aspect-ratio: 13/9) { /* More stable threshold */ }
```

**Source:** [MDN: Managing screen orientation](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation), [W3Schools CSS @media](https://www.w3schools.com/cssref/css3_pr_mediaquery.php)

### Pitfall 2: ResizeObserver Loop Errors
**What goes wrong:** Console error: "ResizeObserver loop completed with undelivered notifications"
**Why it happens:** ResizeObserver callback modifies DOM in a way that triggers another resize, creating infinite loop
**How to avoid:** Debounce callbacks, use requestAnimationFrame for DOM modifications, avoid synchronous DOM updates in callback
**Warning signs:** Browser console shows ResizeObserver errors (usually harmless but indicates inefficiency)

**Example:**
```javascript
// Vulnerable: synchronous DOM update in callback
const observer = new ResizeObserver((entries) => {
  element.style.width = entries[0].contentRect.width + 'px'; // Triggers another resize
});

// Better: debounced, async update
const observer = new ResizeObserver(debounce((entries) => {
  requestAnimationFrame(() => {
    element.style.width = entries[0].contentRect.width + 'px';
  });
}, 100));
```

**Source:** [Understanding ResizeObserver in React](https://www.dhiwise.com/blog/design-converter/resolving-resizeobserver-loop-completed-with), [ResizeObserver Efficiency](https://infinitejs.com/posts/boost-react-app-resize-observer-efficiency/)

### Pitfall 3: VexFlow Re-render Losing State
**What goes wrong:** Clearing and re-rendering VexFlow SVG during orientation change loses scroll position, highlighted notes, or animation state
**Why it happens:** Naive re-render destroys existing DOM and creates new elements
**How to avoid:** Store game state (currentNoteIndex, scroll position) in refs/state before re-render, restore after; or use CSS transforms for layout changes without re-rendering
**Warning signs:** User rotates device mid-game, loses progress or sees notation jump to beginning

**Example:**
```javascript
// VexFlowStaffDisplay already handles this correctly with refs:
// - notesRef.current preserves note references
// - maxScrollRef.current preserves scroll state
// - Pattern at lines 131-149 with containerSize state

const handleOrientationChange = useCallback(() => {
  const currentScroll = containerRef.current?.scrollLeft || 0;
  const currentNote = currentNoteIndex;

  // Re-render VexFlow
  renderStaff();

  // Restore state after render completes
  requestAnimationFrame(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = currentScroll;
    }
    highlightNote(currentNote);
  });
}, [currentNoteIndex, renderStaff, highlightNote]);
```

**Source:** Existing VexFlowStaffDisplay.jsx implementation (lines 1565-1670 handle scroll state preservation)

### Pitfall 4: WCAG 1.3.4 Violation
**What goes wrong:** Forcing users into landscape-only mode via orientation lock or showing "rotate to continue" without escape
**Why it happens:** Developers optimize for one orientation and forget accessibility requirements
**How to avoid:** Always provide functional (though possibly degraded) experience in portrait; never use CSS/JS orientation locks; make rotate prompt dismissible
**Warning signs:** App shows permanent "rotate your device" message with no way to dismiss

**Compliance requirement:** Content must NOT restrict view/operation to single orientation unless essential (e.g., piano keyboard simulation). Educational games are NOT considered essential orientation use cases.

**Example:**
```jsx
// Compliant: Rotate prompt is dismissible (Phase 02 implementation)
<RotatePromptOverlay onDismiss={dismissPrompt} />
// User can click "Play anyway" button

// Portrait mode remains functional (degraded but usable)
<div className="portrait:flex-col portrait:space-y-2 landscape:flex-row landscape:space-x-4">
  {/* Layout adapts but both work */}
</div>
```

**Source:** [WCAG 1.3.4: Orientation](https://www.w3.org/WAI/WCAG21/Understanding/orientation.html), [WCAG Orientation Explained](https://www.getstark.co/wcag-explained/perceivable/adaptable/orientation/)

### Pitfall 5: Fixed Height/Width Breaking VexFlow
**What goes wrong:** VexFlow notation gets clipped, cut off, or distorted when container has fixed dimensions
**Why it happens:** VexFlow calculates layout based on available space; fixed containers don't communicate actual available space
**How to avoid:** Use percentage-based heights, min/max constraints instead of fixed px; let VexFlow SVG scale via viewBox
**Warning signs:** Notation appears cropped, ledger lines cut off, barlines missing

**Example:**
```css
/* Vulnerable */
.vexflow-container {
  height: 200px; /* Fixed height clips notation */
  width: 800px;
}

/* Better */
.vexflow-container {
  height: 100%; /* Flex/grid parent defines height */
  max-height: 320px;
  width: 100%;
  max-width: 1400px;
}
```

**Source:** [VexFlow Issue #617](https://github.com/0xfe/vexflow/issues/617), [VexFlow Responsive Docs](https://www.spiano.dev/responsiveVexFlow/)

## Code Examples

Verified patterns from official sources and existing codebase:

### Tailwind Orientation Modifiers Setup
```javascript
// tailwind.config.js - Add to theme.extend.screens
module.exports = {
  theme: {
    extend: {
      screens: {
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape': { 'raw': '(orientation: landscape)' },
        // Optional: aspect ratio guards against keyboard issue
        'landscape-stable': { 'raw': '(min-aspect-ratio: 13/9)' }
      }
    }
  }
}
```

**Source:** [Tailwind Discussions #2397](https://github.com/tailwindlabs/tailwindcss/discussions/2397)

### Game Layout Adaptive Container
```jsx
// Pattern for all 4 game modes: NotesRecognitionGame, SightReadingGame, MetronomeTrainer, MemoryGame
<div className="
  flex flex-col gap-4
  portrait:h-screen portrait:py-4
  landscape:h-screen landscape:flex-row landscape:py-2 landscape:px-6
">
  {/* Notation/Question Display */}
  <div className="
    portrait:flex-1 portrait:max-h-[40vh]
    landscape:flex-[2] landscape:h-full
  ">
    <VexFlowStaffDisplay />
  </div>

  {/* Controls/Feedback */}
  <div className="
    portrait:flex-1
    landscape:flex-[1] landscape:h-full landscape:overflow-y-auto
  ">
    <GameControls />
  </div>
</div>
```

**Source:** Derived from [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design), [CSS Grid Flexbox Guide](https://visualmodo.com/ultimate-guide-to-css-grid-flexbox-building-responsive-layouts/)

### VictoryScreen Two-Column Landscape Layout
```jsx
// VictoryScreen.jsx - Optimize for landscape
<div className="
  portrait:max-w-md portrait:space-y-2
  landscape:max-w-4xl landscape:grid landscape:grid-cols-2 landscape:gap-6 landscape:items-start
">
  {/* Left column: Stars, Score, XP breakdown */}
  <div className="landscape:col-span-1 landscape:space-y-3">
    <div className="flex items-center justify-center gap-1">
      {/* Star rating */}
    </div>
    <div className="relative">
      {/* XP breakdown card */}
    </div>
  </div>

  {/* Right column: Feedback, Buttons */}
  <div className="landscape:col-span-1 landscape:space-y-3">
    <div>
      {/* Accuracy, streak info */}
    </div>
    <div className="flex flex-col gap-2">
      {/* Action buttons */}
    </div>
  </div>
</div>
```

**Source:** Existing VictoryScreen.jsx structure (lines 706-918), adapted with Grid layout

### UnifiedGameSettings Modal Landscape Optimization
```jsx
// UnifiedGameSettings.jsx - Two-column settings in landscape
<div className={`
  ${isModal ? 'fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900/95 to-slate-800/95' : ''}
  portrait:p-4
  landscape:p-6 landscape:flex landscape:items-center landscape:justify-center
`}>
  <div className="
    portrait:max-w-md portrait:mx-auto
    landscape:max-w-5xl landscape:w-full landscape:max-h-[85vh]
  ">
    {/* Settings content grid */}
    <div className="
      portrait:space-y-4
      landscape:grid landscape:grid-cols-2 landscape:gap-8
    ">
      {/* Settings options split across columns in landscape */}
    </div>
  </div>
</div>
```

**Source:** [React Modal Best Practices](https://blog.croct.com/post/best-react-modal-dialog-libraries)

### Debounced VexFlow Resize Hook
```javascript
// NEW: src/hooks/useVexFlowResize.js
import { useEffect, useRef, useCallback } from 'react';

/**
 * Debounced ResizeObserver hook for VexFlow re-rendering
 * @param {React.RefObject} containerRef - Container element ref
 * @param {Function} onResize - Callback with {width, height}
 * @param {number} debounceMs - Debounce delay (default: 150ms)
 */
export function useVexFlowResize(containerRef, onResize, debounceMs = 150) {
  const debounceTimerRef = useRef(null);
  const observerRef = useRef(null);

  const debouncedCallback = useCallback((entries) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;

      // Only trigger if dimensions actually changed
      onResize({
        width: Math.round(width),
        height: Math.round(height)
      });
    }, debounceMs);
  }, [onResize, debounceMs]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Fallback for browsers without ResizeObserver
    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => {
        onResize({
          width: element.clientWidth,
          height: element.clientHeight
        });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    observerRef.current = new ResizeObserver(debouncedCallback);
    observerRef.current.observe(element);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef, debouncedCallback, onResize]);
}

// Usage in VexFlowStaffDisplay.jsx:
// const handleResize = useCallback(({ width, height }) => {
//   setContainerSize({ width, height });
// }, []);
//
// useVexFlowResize(containerRef, handleResize, 150);
```

**Source:** [Best Practices for Resize Observer React](https://www.dhiwise.com/post/mastering-resize-observer-react-best-practices)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS `orientation` media query only | `aspect-ratio` + `orientation` combined | 2024-2025 | Prevents keyboard-triggered orientation switch on mobile |
| Manual resize event listeners | ResizeObserver API | 2020+ (widespread support) | More accurate, container-specific, better performance |
| JavaScript orientation lock (screen.orientation.lock) | CSS-only responsive layouts | WCAG 2.1 (2018) | Accessibility compliance, better UX |
| Fixed viewport meta tag orientation | Responsive layouts without restrictions | WCAG 2.1 (2018) | Removed `<meta name="viewport" content="orientation=landscape">` anti-pattern |
| Separate mobile/desktop stylesheets | Single responsive stylesheet with breakpoints | ~2015+ | Maintenance reduction, better performance |

**Deprecated/outdated:**
- `screen.orientation.lock()` - Use only for essential cases (camera, video), violates WCAG for educational apps
- Fixed orientation meta tags - Removed from HTML5 spec, ignored by modern browsers
- window.onorientationchange - Replaced by matchMedia('(orientation: X)').addEventListener('change')

## Open Questions

1. **ResizeObserver polyfill necessity**
   - What we know: ResizeObserver supported in Chrome 64+, Firefox 69+, Safari 13.1+
   - What's unclear: Usage analytics for this app - what % of users on older browsers?
   - Recommendation: Check analytics first; if <1% on old browsers, skip polyfill. Current implementation has window.resize fallback (acceptable).

2. **Optimal debounce timing for VexFlow**
   - What we know: Research suggests 100-150ms for resize debouncing
   - What's unclear: VexFlow rendering time on low-end devices (chromebooks in schools)
   - Recommendation: Start with 150ms, add performance logging, adjust if users report lag. Consider device detection for adaptive timing.

3. **Grid vs Flexbox for game layouts**
   - What we know: Grid better for two-dimensional layouts (VictoryScreen), Flexbox for one-dimensional (game controls)
   - What's unclear: Performance difference on older mobile browsers
   - Recommendation: Use Grid for VictoryScreen (two-column landscape), Flexbox for game containers (single-axis responsive)

4. **Landscape-first vs Mobile-first design**
   - What we know: Tailwind is mobile-first by default; games optimized for landscape
   - What's unclear: Should we invert to landscape-first breakpoints?
   - Recommendation: Keep mobile-first Tailwind defaults, use `landscape:` modifiers for optimizations. Reasoning: portrait mode must remain functional (WCAG), so portrait = baseline, landscape = enhancement.

## Sources

### Primary (HIGH confidence)
- [WCAG 1.3.4: Orientation](https://www.w3.org/WAI/WCAG21/Understanding/orientation.html) - Official W3C accessibility guidelines
- [Tailwind CSS: Responsive Design](https://tailwindcss.com/docs/responsive-design) - Official Tailwind documentation
- [Tailwind CSS: Custom Screens](https://tailwindcss.com/docs/screens) - Breakpoint configuration
- [MDN: Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries) - CSS orientation detection
- [MDN: Managing screen orientation](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation) - Orientation API reference
- VexFlowStaffDisplay.jsx (existing codebase) - Current ResizeObserver implementation

### Secondary (MEDIUM confidence)
- [Best Practices for Resize Observer React](https://www.dhiwise.com/post/mastering-resize-observer-react-best-practices) - Debouncing patterns
- [ResizeObserver Efficiency](https://infinitejs.com/posts/boost-react-app-resize-observer-efficiency/) - Performance optimization
- [Tailwind GitHub Discussion #2397](https://github.com/tailwindlabs/tailwindcss/discussions/2397) - Orientation modifier pattern
- [How to Use Viewport Orientations in Tailwind](https://linuxhint.com/how-to-use-viewport-orientations-in-tailwind/) - Implementation guide
- [VexFlow Issue #590: Make SVG responsive](https://github.com/0xfe/vexflow/issues/590) - VexFlow SVG scaling
- [React Modal Best Practices 2026](https://blog.croct.com/post/best-react-modal-dialog-libraries) - Modal responsiveness
- [WCAG Orientation Explained](https://www.getstark.co/wcag-explained/perceivable/adaptable/orientation/) - Accessibility breakdown

### Tertiary (LOW confidence - for awareness)
- [CSS Grid vs Flexbox](https://blog.logrocket.com/css-flexbox-vs-css-grid/) - Layout comparison
- [Understanding ResizeObserver in React](https://www.dhiwise.com/blog/design-converter/resolving-resizeobserver-loop-completed-with) - Common errors
- [VexFlow Issue #617: How to increase size](https://github.com/0xfe/vexflow/issues/617) - Community solutions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All technologies already in project or native browser APIs
- Architecture: HIGH - Patterns verified in official docs and existing codebase
- Pitfalls: HIGH - Documented in WCAG spec, MDN, and community issue trackers
- VexFlow specifics: MEDIUM - Some patterns from community issues (not official docs)

**Research date:** 2026-02-14
**Valid until:** ~30 days (stable technologies, no breaking changes expected)

**Key risks:**
- None critical - all approaches use stable, well-supported APIs
- Minor: VexFlow v5 documentation is sparse; relying on community patterns + existing implementation

**Confidence in planning readiness:** HIGH - Clear patterns identified, existing infrastructure supports implementation, no unknown technical blockers.
