# Technology Stack Research: Trail Page Visual Redesign

**Project:** PianoApp2 - Trail Page Enchanted Forest Redesign
**Researched:** 2026-02-09
**Overall Confidence:** HIGH

## Executive Summary

The trail page visual redesign requires **zero new dependencies**. All visual effects (3D nodes, glowing paths, glass-morphism, forest background, responsive layout) can be achieved with **existing Tailwind CSS 3.4.1** + **native CSS custom properties** + **inline SVG**. The only addition needed is **@fontsource/quicksand** for the Quicksand font.

**Key Finding:** Modern CSS (2026) provides all necessary capabilities for the enchanted forest aesthetic without JavaScript libraries for visual effects. Tailwind's utility-first approach combined with custom CSS classes will deliver the design efficiently.

---

## Recommended Stack Additions

### Font Loading: Quicksand via Fontsource

| Package | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| `@fontsource/quicksand` | ^5.2.x | Quicksand font for trail page | Self-hosted (COPPA-06 compliance), consistent with existing font strategy |

**Installation:**
```bash
npm install @fontsource/quicksand
```

**Integration:** (in `src/main.jsx`)
```javascript
// Add after existing font imports
import '@fontsource/quicksand/400.css';
import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/600.css';
import '@fontsource/quicksand/700.css';
```

**Tailwind Config:** (add to `tailwind.config.js`)
```javascript
fontFamily: {
  // ... existing fonts
  quicksand: ['Quicksand', 'sans-serif'],
}
```

**Why Fontsource over Google Fonts:**
- Already used for 6 other fonts in the project (`@fontsource/outfit`, etc.)
- COPPA compliance: No external CDN tracking of 8-year-old users
- Vite bundles fonts efficiently, preloading critical weights
- Consistent with existing architecture pattern

**Why NOT alternatives:**
- ❌ Google Fonts CDN: Privacy concerns for child users, external dependency
- ❌ Self-hosted manual: More work, already have Fontsource infrastructure
- ❌ System fonts: Design requires specific Quicksand rounded aesthetic

---

## Existing Stack Leverage

### Tailwind CSS 3.4.1 (Already Installed)

**Capabilities for Redesign:**

1. **Backdrop-Filter Support** (Glass-morphism)
   - Built-in utilities: `backdrop-blur-sm`, `backdrop-blur-md`, `backdrop-blur-lg`, `backdrop-blur-xl`
   - Custom values via arbitrary syntax: `backdrop-blur-[12px]`
   - Browser support: 92% as of 2026 (Chrome 76+, Safari 18+, Firefox 103+)
   - **Confidence:** HIGH (verified with [Tailwind docs](https://tailwindcss.com/docs/backdrop-filter-blur) and [Can I Use](https://caniuse.com/css-backdrop-filter))

2. **Radial Gradients** (3D Node Buttons)
   - Use arbitrary values: `bg-[radial-gradient(circle_at_50%_30%,#4facfe_0%,#00f2fe_100%)]`
   - Supported in all modern browsers
   - **Pattern from reference HTML:**
   ```css
   background: radial-gradient(circle at 50% 30%, #4facfe 0%, #00f2fe 100%);
   ```

3. **Box Shadow Layering** (3D Depth)
   - Multiple shadow syntax: `shadow-[0_6px_0_#009eb3,0_10px_20px_rgba(0,242,255,0.4)]`
   - Inset shadows for highlights: `shadow-[inset_0_2px_5px_rgba(255,255,255,0.5)]`
   - Active state push: `active:translate-y-1` with adjusted shadows

4. **Text Shadow** (Glow Effects)
   - Custom utility: `text-shadow-[0_0_10px_rgba(0,242,255,0.6)]`
   - Already in use for dashboard hero (line 1180 of index.css)

5. **Responsive Design**
   - Tailwind's `sm:`, `md:`, `lg:`, `xl:` breakpoints
   - Custom breakpoints via config if needed
   - Container queries available via `@container` (if needed)

**What Tailwind CANNOT do (requires custom CSS):**
- Complex multi-stop gradients (more than 3 stops)
- Keyframe animations for glow pulses
- Pseudo-element ::before/::after for background decorations
- SVG filter effects (drop-shadow on paths)

---

### Framer Motion 12.23.26 (Already Installed)

**Capabilities for Trail:**
- Node entrance animations (stagger effect as user scrolls)
- Tab switching transitions (path fade/slide)
- Modal open/close animations (TrailNodeModal)
- Reduced motion support via `useReducedMotion()` hook

**Integration Points:**
```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: index * 0.1 }}
>
  {/* Trail node */}
</motion.div>
```

**Why NOT add alternatives:**
- ❌ GSAP: Overkill for simple animations, adds 50KB
- ❌ CSS animations only: Lose dynamic stagger, reduced motion detection
- ✅ Framer Motion: Already in bundle, great DX, accessibility built-in

---

### Inline SVG for Path Connections (No Library Needed)

**Approach:** Render SVG paths directly in JSX, styled with CSS
```jsx
<svg className="absolute inset-0 pointer-events-none" preserveAspectRatio="none">
  <path
    d="M200,80 C200,150 100,150 100,220..."
    fill="none"
    stroke="#00FFFF"
    strokeWidth="6"
    className="drop-shadow-[0_0_8px_#00FFFF]"
  />
</svg>
```

**CSS Glow via Filter:**
```css
.path-glow {
  filter: drop-shadow(0 0 4px var(--color-primary-glow));
}
```

**Performance Note:** SVG filters are hardware-accelerated in modern browsers (2026). Safari bug with drop-shadow() on SVG was resolved in Safari 18+. **Confidence:** MEDIUM (verified with [CSS-Tricks](https://css-tricks.com/adding-shadows-to-svg-icons-with-css-and-svg-filters/) and [Kirupa](https://www.kirupa.com/animations/animating_drop_shadows.htm))

**Why NOT alternatives:**
- ❌ Canvas: Harder to style, accessibility issues, no CSS integration
- ❌ SVG.js: 96KB library for basic path rendering
- ❌ D3.js: 250KB+ for simple curved lines
- ✅ Native SVG: Zero dependencies, CSS-styleable, accessible

---

### CSS Custom Properties (Already in Use)

**Extend for Trail Theme:**
```css
:root {
  /* Enchanted forest colors */
  --color-primary-glow: #00f2ff;
  --color-secondary-glow: #aa00ff;
  --color-glass-bg: rgba(255, 255, 255, 0.1);
  --color-glass-border: rgba(255, 255, 255, 0.2);

  /* Node states */
  --node-active-start: #4facfe;
  --node-active-end: #00f2fe;
  --node-locked-start: rgba(100, 80, 150, 0.6);
  --node-locked-end: rgba(50, 40, 80, 0.8);
}
```

**Why Custom Properties:**
- Theme consistency across components
- Easy to override for high-contrast mode
- Reduce repeated color values in Tailwind arbitrary classes

---

## Integration Points with Existing Stack

### 1. Tailwind Config Extensions

**Add to `tailwind.config.js`:**
```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        quicksand: ['Quicksand', 'sans-serif'],
      },
      colors: {
        'cyan-glow': '#00f2ff',
        'purple-glow': '#aa00ff',
      },
      boxShadow: {
        'node-3d': '0 6px 0 #009eb3, 0 10px 20px rgba(0, 242, 255, 0.4)',
        'node-3d-pressed': '0 2px 0 #009eb3, 0 5px 10px rgba(0, 242, 255, 0.4)',
        'glow-cyan': '0 0 20px rgba(0, 242, 255, 0.6)',
        'glow-purple': '0 0 15px rgba(147, 51, 234, 0.5)',
      },
      dropShadow: {
        'glow-cyan': '0 0 8px #00FFFF',
        'glow-purple': '0 0 6px #aa00ff',
      },
    },
  },
}
```

### 2. Custom CSS in `index.css`

**Add Trail-Specific Utility Classes:**
```css
@layer components {
  /* Glass-morphism panel */
  .glass-panel {
    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--color-glass-border);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  }

  /* Text glow effect */
  .text-glow-cyan {
    text-shadow: 0 0 10px rgba(0, 242, 255, 0.6);
  }

  /* 3D Node Button - Active */
  .node-3d-active {
    background: radial-gradient(circle at 50% 30%, #4facfe 0%, #00f2fe 100%);
    box-shadow:
      0 6px 0 #009eb3,
      0 10px 20px rgba(0, 242, 255, 0.4),
      inset 0 2px 5px rgba(255,255,255,0.5);
    border: 2px solid #aefeff;
    transition: transform 0.1s, box-shadow 0.1s;
  }

  .node-3d-active:active {
    transform: translateY(4px);
    box-shadow:
      0 2px 0 #009eb3,
      0 5px 10px rgba(0, 242, 255, 0.4);
  }

  /* 3D Node Button - Locked */
  .node-3d-locked {
    background: radial-gradient(circle at 50% 30%, rgba(100, 80, 150, 0.6) 0%, rgba(50, 40, 80, 0.8) 100%);
    box-shadow:
      0 6px 0 rgba(40, 30, 60, 0.8),
      0 8px 15px rgba(0,0,0,0.3),
      inset 0 1px 3px rgba(255,255,255,0.1);
    border: 2px solid rgba(150, 130, 200, 0.3);
  }

  /* SVG Path Glow */
  .path-svg-glow {
    filter: drop-shadow(0 0 4px var(--color-primary-glow));
  }
}
```

**Rationale for Custom Classes:**
- These are reusable patterns specific to trail nodes
- Tailwind arbitrary values would be too verbose (7+ utilities per node)
- Easier to maintain hover/active states as a single class
- Consistent with existing `.card`, `.btn-primary` pattern in codebase

### 3. Accessibility Context Integration

**Respect `reducedMotion` from AccessibilityContext:**
```jsx
import { useAccessibility } from '@/contexts/AccessibilityContext';

const TrailMap = () => {
  const { reducedMotion } = useAccessibility();

  return (
    <motion.div
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.5 }}
    >
      {/* Trail content */}
    </motion.div>
  );
};
```

**CSS Reduced Motion:**
```css
/* Already in index.css line 1876-1879 */
@media (prefers-reduced-motion: reduce) {
  .animate-pulse-subtle {
    animation: none;
  }
}
```

### 4. Responsive Layout Strategy

**Mobile-First Approach (Already Used in Project):**
```jsx
<div className="
  /* Mobile: Vertical zigzag */
  flex flex-col space-y-8

  /* Desktop: Horizontal scroll */
  lg:flex-row lg:space-y-0 lg:space-x-12 lg:overflow-x-auto
">
  {/* Trail nodes */}
</div>
```

**SVG Path Responsive Scaling:**
- Use `preserveAspectRatio="none"` to stretch path with container
- Recalculate path `d` attribute for mobile vs desktop layouts
- Alternative: Two separate SVG paths with `hidden lg:block` / `lg:hidden`

---

## What NOT to Add

### ❌ CSS Animation Libraries (Animate.css, Animista, etc.)

**Why Avoid:**
- Framer Motion provides superior DX with JS-controlled animations
- Tailwind + custom keyframes cover remaining needs
- Bundle size: Animate.css is 90KB minified
- **Decision:** Use `@keyframes` in index.css for simple glows, Framer Motion for complex sequences

### ❌ SVG Animation Libraries (GSAP, Anime.js, Lottie)

**Why Avoid:**
- Path glow is static (no complex path morphing)
- SVG filters (drop-shadow) provide glow effect without JS
- GSAP is 50KB, Anime.js is 40KB, Lottie is 150KB
- **Decision:** Native SVG with CSS filters

### ❌ CSS-in-JS Libraries (styled-components, emotion)

**Why Avoid:**
- Project uses Tailwind utility-first approach
- Adding CSS-in-JS creates two styling paradigms
- Tailwind arbitrary values cover edge cases: `bg-[radial-gradient(...)]`
- **Decision:** Stick with Tailwind + custom CSS classes in index.css

### ❌ UI Component Libraries (shadcn/ui, Headless UI for tabs)

**Why Avoid:**
- Trail has custom tab design (not standard tab bar)
- Path selection tabs are 3-4 buttons with custom styling
- shadcn/ui adds 5-10 files per component
- **Decision:** Build custom tab component with Tailwind

### ❌ Image Optimization Libraries for Background

**Why Avoid:**
- Reference design uses CSS gradients for forest background (no images)
- CSS gradients: `bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900`
- Decorative blur elements: positioned `div` with `blur-[50px]`
- **Decision:** Pure CSS background, zero images

### ❌ Scroll Animation Libraries (AOS, ScrollReveal)

**Why Avoid:**
- Framer Motion's `whileInView` provides scroll-triggered animations
- Trail page is relatively short (93 nodes in scrollable container)
- AOS is 25KB, adds dependency
- **Decision:** Framer Motion `whileInView` for node reveals

---

## CSS Techniques Comparison

### Glass-morphism: Tailwind vs Custom CSS

**Tailwind Approach:**
```jsx
<div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl">
```

**Custom CSS Approach:**
```jsx
<div className="glass-panel rounded-2xl">
```

**Recommendation:** **Custom CSS class** (`.glass-panel`)
- Used in 10+ places (progress card, unit headers, modal backgrounds)
- Easier to maintain gradient + blur + border as single class
- Matches existing `.card`, `.card-glass` pattern in index.css

### 3D Node Buttons: Inline Arbitrary Values vs Custom Classes

**Tailwind Arbitrary Approach:**
```jsx
<button className="
  bg-[radial-gradient(circle_at_50%_30%,#4facfe_0%,#00f2fe_100%)]
  shadow-[0_6px_0_#009eb3,0_10px_20px_rgba(0,242,255,0.4),inset_0_2px_5px_rgba(255,255,255,0.5)]
  border-2 border-[#aefeff]
  active:translate-y-1
  active:shadow-[0_2px_0_#009eb3,0_5px_10px_rgba(0,242,255,0.4)]
">
```

**Custom Class Approach:**
```jsx
<button className="node-3d-active w-24 h-24 rounded-full">
```

**Recommendation:** **Custom CSS classes** (`.node-3d-active`, `.node-3d-locked`)
- 93 nodes in trail, each needs identical styling
- Active state pseudo-class easier in CSS than conditional Tailwind
- 4 node states (locked, available, in-progress, mastered)
- Reduces JSX clutter, improves maintainability

### SVG Path Glow: Filter vs Shadow

**CSS Filter Approach:**
```css
.path-svg-glow {
  filter: drop-shadow(0 0 4px #00FFFF);
}
```

**Box Shadow Approach (doesn't work on SVG paths):**
```css
/* ❌ Box-shadow doesn't apply to SVG stroke */
path {
  box-shadow: 0 0 4px #00FFFF; /* Has no effect */
}
```

**Recommendation:** **CSS `filter: drop-shadow()`**
- Only way to add glow to SVG paths
- Hardware-accelerated in modern browsers (2026)
- **Browser support:** Chrome 76+, Safari 18+, Firefox 103+ ([Can I Use](https://caniuse.com/css-filters))

---

## Font Loading Strategy

### Fontsource vs Google Fonts CDN

| Aspect | Fontsource | Google Fonts CDN |
|--------|------------|------------------|
| **Privacy** | ✅ No external tracking | ❌ Google tracks requests (COPPA concern) |
| **Performance** | ✅ Bundled with Vite, preloaded | ⚠️ External DNS lookup + CDN |
| **Offline (PWA)** | ✅ Works offline | ❌ Requires network |
| **Consistency** | ✅ Matches 6 other fonts in project | ❌ Different loading pattern |
| **Bundle Size** | ⚠️ +30KB per weight | ✅ Streamed from CDN |
| **Cache Control** | ✅ Long-term Vite cache | ⚠️ CDN cache (user dependent) |

**Decision:** **Fontsource** for COPPA compliance and consistency

### Quicksand Variable Font vs Static Weights

**Variable Font (`@fontsource-variable/quicksand`):**
- Single file, all weights 300-700
- ~45KB for full range
- Modern browsers only (2020+)

**Static Weights (`@fontsource/quicksand`):**
- 4 files (400, 500, 600, 700)
- ~30KB total (Vite tree-shakes unused weights)
- Universal browser support

**Recommendation:** **Static weights**
- Trail page only uses 3 weights (400, 600, 700)
- Better browser support (IE11+ if needed)
- Smaller bundle (30KB vs 45KB)
- Consistent with other Fontsource fonts in project

### Preloading Strategy

**Current Pattern in Project:** Fonts imported in `main.jsx` before React
```javascript
// Fonts load before React tree, blocking render (intentional)
import '@fontsource/quicksand/400.css';
import '@fontsource/quicksand/600.css';
import '@fontsource/quicksand/700.css';
```

**Alternative (Preload in index.html):**
```html
<link rel="preload" href="/fonts/quicksand-400.woff2" as="font" type="font/woff2" crossorigin>
```

**Recommendation:** **Keep existing pattern** (import in main.jsx)
- Vite automatically preloads critical fonts
- No manual preload links needed
- Consistent with 6 other fonts

**Apply font only on trail page:**
```jsx
// TrailMapPage.jsx
<div className="font-quicksand">
  {/* Trail content */}
</div>
```

**Rationale:** Scope font to trail page, don't override global sans-serif

---

## Responsive Layout Patterns

### Mobile (Vertical Zigzag) vs Desktop (Horizontal Scroll)

**Reference HTML Approach:**
- Fixed container width (`max-w-[400px]`) for mobile simulation
- Absolute positioning for nodes
- SVG path coordinates hardcoded for vertical layout

**Recommended Approach for Production:**

1. **Detect Viewport Size:**
```jsx
const isMobile = useMediaQuery('(max-width: 1023px)');
```

2. **Conditional SVG Path:**
```jsx
{isMobile ? (
  <svg className="absolute inset-0 w-full h-full">
    <path d="M200,80 C200,150 100,150 100,220..." />
  </svg>
) : (
  <svg className="absolute inset-0 w-full h-[200px]">
    <path d="M80,100 C200,100 200,100 350,100..." />
  </svg>
)}
```

3. **Node Positioning:**
```jsx
{/* Mobile: Stacked vertically with zigzag */}
<div className="relative h-[2000px] lg:h-[200px] lg:w-full">
  {nodes.map((node, i) => (
    <div
      key={node.id}
      className={`absolute ${
        isMobile
          ? `left-${i % 2 === 0 ? '1/4' : '3/4'} top-[${i * 200}px]`
          : `top-1/2 left-[${i * 150}px]`
      }`}
    >
      {/* Node content */}
    </div>
  ))}
</div>
```

**Alternative (Simpler):** Single flexible layout with CSS Grid
```css
.trail-container {
  display: grid;
  grid-auto-flow: row; /* Mobile: vertical */
  gap: 2rem;
}

@media (min-width: 1024px) {
  .trail-container {
    grid-auto-flow: column; /* Desktop: horizontal */
    overflow-x: auto;
  }
}
```

**Recommendation:** **CSS Grid with auto-flow** (simpler, more maintainable)

---

## Performance Considerations

### Backdrop-Filter Performance

**Issue:** `backdrop-filter: blur()` can cause repaints on scroll
**Impact:** Glass-morphism cards on 93 nodes
**Mitigation:**
1. Use `will-change: backdrop-filter` on glass elements
2. Limit blur amount (12px max, reference uses 12px)
3. Apply glass effect only to fixed elements (header, modals), not scrolling nodes

**Recommendation:**
- Unit header cards: ✅ Use glass-morphism (fixed position)
- Individual nodes: ❌ Avoid backdrop-blur (use solid bg with transparency)
- Modals: ✅ Use glass-morphism (overlay, not scrolling)

### SVG Filter Drop-Shadow Performance

**Issue:** SVG filters can be CPU-intensive
**Impact:** Path connections with glow effect
**Mitigation:**
1. Use `filter: drop-shadow()` instead of SVG `<feDropShadow>` (faster)
2. Limit blur radius (4-8px max)
3. Consider removing glow on low-end devices (optional enhancement)

**Recommendation:**
- Apply glow to path SVG only (1 element per section)
- Use CSS filter, not inline SVG filter definitions
- **Test:** Verify 60fps scroll on iPhone SE (lowest target device)

### Font Loading Impact

**Quicksand Bundle Size:**
- 400 weight: ~10KB woff2
- 600 weight: ~11KB woff2
- 700 weight: ~12KB woff2
- **Total:** ~33KB

**Impact:** +33KB to initial bundle
**First Paint:** Fonts block render until loaded (FOIT - Flash of Invisible Text)

**Mitigation:**
```css
@font-face {
  font-family: 'Quicksand';
  src: url('...') format('woff2');
  font-display: swap; /* Show fallback immediately */
}
```

**Recommendation:**
- Use `font-display: swap` (Fontsource default)
- Fallback: `font-quicksand: ['Quicksand', 'Nunito', 'sans-serif']`
- Nunito (already loaded) has similar rounded aesthetic

---

## Implementation Roadmap

### Phase 1: Foundation (No Visual Changes)
1. Install `@fontsource/quicksand`
2. Add Quicksand imports to `main.jsx`
3. Add `fontFamily.quicksand` to `tailwind.config.js`
4. Add custom colors (`cyan-glow`, `purple-glow`) to Tailwind config
5. Add CSS custom properties to `:root` in `index.css`

### Phase 2: CSS Utilities (Reusable Styles)
1. Add `.glass-panel` component class
2. Add `.node-3d-active` and `.node-3d-locked` classes
3. Add `.text-glow-cyan` utility
4. Add `.path-svg-glow` utility
5. Test classes in isolation (Storybook or test page)

### Phase 3: Layout Structure (No Styling)
1. Update `TrailMapPage.jsx` with `font-quicksand`
2. Implement responsive container (vertical mobile, horizontal desktop)
3. Add SVG path element (no styling yet)
4. Position nodes with absolute/grid layout

### Phase 4: Visual Polish
1. Apply glass-morphism to unit header cards
2. Apply 3D styles to node buttons
3. Add SVG path glow effect
4. Add Framer Motion animations
5. Test reduced motion fallbacks

### Phase 5: Optimization
1. Performance audit (Lighthouse)
2. Verify 60fps scroll on target devices
3. Test with backdrop-filter disabled (fallback)
4. Verify font loading (FOIT/FOUT behavior)

---

## Success Metrics

**Visual Fidelity:**
- ✅ Match reference HTML design (stitch-trail-v2.html)
- ✅ 3D depth on nodes (radial gradient + shadow)
- ✅ Glowing path connections (drop-shadow)
- ✅ Glass-morphism cards (backdrop-blur)

**Performance:**
- ✅ 60fps scroll on iPhone SE (2022)
- ✅ First Contentful Paint < 1.5s
- ✅ Lighthouse Performance > 90

**Accessibility:**
- ✅ Reduced motion removes animations
- ✅ High contrast mode works with glow effects
- ✅ Keyboard navigation functional
- ✅ Screen reader announces node states

**Bundle Impact:**
- ✅ Quicksand fonts: +33KB
- ✅ No JavaScript libraries added
- ✅ CSS classes: +2KB (minified)
- ✅ Total impact: +35KB (~1% of typical bundle)

---

## Open Questions for Phase-Specific Research

1. **SVG Path Calculation:** Algorithm for generating smooth Bezier curves between node positions (desktop horizontal layout)?
2. **Node State Icons:** Use lucide-react (already installed) or custom SVG sprites?
3. **Unit Header Images:** Current design has decorative images; keep or replace with CSS gradients?
4. **Touch Feedback:** iOS-specific haptic feedback on node tap (requires native API research)?
5. **Scroll Restoration:** Trail scroll position preservation on navigation (browser default vs manual)?

**Note:** These are implementation details, not stack decisions. Research during roadmap creation.

---

## Sources

**Tailwind CSS Documentation:**
- [Backdrop Filter](https://tailwindcss.com/docs/backdrop-filter)
- [Backdrop Blur](https://tailwindcss.com/docs/backdrop-filter-blur)

**Browser Compatibility:**
- [CSS Backdrop Filter - Can I Use](https://caniuse.com/css-backdrop-filter)
- [CSS Filters - Can I Use](https://caniuse.com/css-filters)

**Font Loading:**
- [@fontsource/quicksand - npm](https://www.npmjs.com/package/@fontsource/quicksand)
- [Quicksand Font - Fontsource](https://fontsource.org/fonts/quicksand/install)

**CSS Techniques:**
- [Adding Shadows to SVG Icons - CSS-Tricks](https://css-tricks.com/adding-shadows-to-svg-icons-with-css-and-svg-filters/)
- [Animating Drop Shadows - Kirupa](https://www.kirupa.com/animations/animating_drop_shadows.htm)
- [CSS 3D Buttons - Slider Revolution](https://www.sliderrevolution.com/resources/css-3d-buttons/)
- [Radial Gradient - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/radial-gradient)

**Performance:**
- [Drop Shadow Filter - CSS IRL](https://css-irl.info/drop-shadow-the-underrated-css-filter/)
