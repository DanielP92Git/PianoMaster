# Architecture Integration for Trail Visual Redesign

**Project:** Trail Page UI Redesign
**Researched:** 2026-02-09
**Target Scope:** Vertical zigzag mobile layout, horizontal desktop layout, enchanted forest theme

## Executive Summary

The trail redesign requires **selective component rewrites** rather than a full rebuild. The existing data layer (`skillTrail.js`, progress services) is robust and untouched. The UI layer needs a **new responsive layout system** with **enhanced CSS effects**. Core changes:

1. **TrailMap.jsx** → Major rewrite (layout logic from 3-row stacking to vertical/horizontal responsive)
2. **TrailNode.jsx** → CSS enhancement (3D glowing buttons, radial gradients)
3. **TrailMapPage.jsx** → Minor modification (add tab switcher, update header)
4. **PathConnector** → Moderate rewrite (glowing animated SVG paths)
5. **UnitSection** → Remove/replace (unit cards become per-node indicators)
6. **New: TabSwitcher.jsx** → Path navigation component
7. **New: trail-effects.css** → Enchanted forest CSS module

The redesign maintains all existing data flow and navigation patterns. No changes to:
- `skillProgressService.js`
- `dailyGoalsService.js`
- `skillTrail.js` node definitions
- `TrailNodeModal.jsx` (unchanged functionality)

---

## Component Analysis

### 1. TrailMapPage.jsx (MINOR MODIFICATION)

**Current State:**
- `fixed inset-0` full-viewport container
- Dark gradient background (`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900`)
- Simple navigation bar with level badge + free practice link
- Renders `<TrailMap />` directly

**Required Changes:**
```diff
+ Add TabSwitcher component above TrailMap
+ Replace background with forest-themed container (CSS class)
+ Update header to show "Learning Paths" title
+ Add Quicksand font family
- Remove subtle star accent (replaced by forest effects)
```

**Complexity:** Low (primarily markup + CSS class changes)

**Build Order:** Phase 2 (after CSS module, before layout rewrite)

---

### 2. TrailMap.jsx (MAJOR REWRITE)

**Current State:**
- Renders 3 `<TrailSection>` components (Treble, Bass, Rhythm)
- Each section visible simultaneously (vertical scroll)
- `UnitSection` → collapsible unit cards with horizontal node layout
- Uses SVG `<foreignObject>` for node positioning
- Container width measured via `useRef` + `useEffect`

**Required Changes:**

#### Phase 1: Tab-Based Path Switching
```javascript
// Replace parallel rendering with single active path
const [activeCategory, setActiveCategory] = useState('treble_clef')

// Filter nodes by active category
const activeNodes = getNodesByCategory(activeCategory)

// Pass to single TrailSection (or new TrailPath component)
<TrailPath
  nodes={activeNodes}
  category={activeCategory}
  // ... progress props
/>
```

#### Phase 2: Responsive Layout Logic
```javascript
// Desktop: Horizontal wavy path (current logic preserved)
// Mobile: Vertical zigzag path (new layout)

const isMobile = useMediaQuery('(max-width: 768px)')

if (isMobile) {
  return <VerticalZigzagLayout nodes={activeNodes} />
} else {
  return <HorizontalWavyLayout nodes={activeNodes} />
}
```

**Vertical Zigzag Layout:**
- Stack nodes vertically (40-60px spacing)
- Alternate left/right positioning (20-30% horizontal offset)
- PathConnector draws S-curves between offset nodes
- No SVG container width measurement needed (fixed column layout)

**Horizontal Wavy Layout:**
- Keep existing `containerWidth` measurement
- Keep existing sine wave `verticalWobble` calculation
- Enhance PathConnector glow effects

#### Phase 3: Remove UnitSection Logic
```diff
- Collapsible unit cards with header
- Unit progress aggregation
- Expanded/collapsed state management
+ Show all nodes in selected path
+ Unit indicators per-node (small badge above node)
```

**Complexity:** High (layout rewrite, responsive breakpoints, state refactor)

**Build Order:** Phase 3-4 (core milestone work)

---

### 3. TrailNode.jsx (CSS ENHANCEMENT)

**Current State:**
- Flat circular/rounded buttons (`rounded-xl`)
- Simple gradient backgrounds (via `getCategoryColors()`)
- 2D shadow effects (`shadow-[0_0_15px_rgba(...)]`)
- Stars displayed above node (3 slots)
- Icon from `getNodeStateConfig()` utility

**Required Changes:**
```diff
+ Add 3D depth via layered shadows (3-4 shadow layers)
+ Replace simple gradients with radial gradients (center glow)
+ Add CSS transform for pseudo-3D effect (translateZ + perspective)
+ Enhance glow with animated pulse (CSS keyframes)
- Keep existing state logic (locked/available/completed/mastered)
- Keep existing icon system
- Keep existing star display
```

**CSS Pattern:**
```css
.trail-node-3d {
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.3),
    var(--category-color) 50%,
    var(--category-color-dark) 100%
  );
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.1),          /* Base shadow */
    0 4px 8px rgba(0, 0, 0, 0.15),         /* Mid shadow */
    0 8px 16px rgba(0, 0, 0, 0.2),         /* Deep shadow */
    0 0 20px var(--glow-color);            /* Category glow */
  transform: translateZ(0); /* GPU acceleration */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.trail-node-3d:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 16px 32px rgba(0, 0, 0, 0.25),
    0 0 30px var(--glow-color);
}
```

**Complexity:** Low-Medium (CSS-focused, minimal JSX changes)

**Build Order:** Phase 2 (parallel with CSS module creation)

---

### 4. PathConnector Component (MODERATE REWRITE)

**Current State:**
```javascript
// Simple curved SVG path with optional glow for completed paths
<g>
  {isCompleted && <path /* blur glow */ />}
  <path d={curvedPath} stroke={color} strokeDasharray={...} />
</g>
```

**Required Changes:**

#### Animated Glowing Paths
```javascript
// Add animated gradient definitions
<defs>
  <linearGradient id="path-glow-${id}">
    <stop offset="0%" stopColor="var(--glow-start)">
      <animate attributeName="stop-color"
        values="var(--glow-start);var(--glow-mid);var(--glow-start)"
        dur="2s" repeatCount="indefinite" />
    </stop>
    <stop offset="100%" stopColor="var(--glow-end)" />
  </linearGradient>
</defs>

<g>
  {/* Outer glow layer */}
  <path d={path} stroke="url(#path-glow-${id})" strokeWidth="16"
    opacity="0.4" filter="blur(8px)" />

  {/* Inner glow layer */}
  <path d={path} stroke="var(--glow-core)" strokeWidth="8"
    opacity="0.7" filter="blur(4px)" />

  {/* Main path */}
  <path d={path} stroke="var(--path-color)" strokeWidth="4" />

  {/* Animated sparkles (for completed paths) */}
  {isCompleted && <AnimatedSparkles path={path} />}
</g>
```

#### Responsive Path Calculation
```javascript
// Mobile: Vertical S-curves
// Desktop: Horizontal waves (keep existing logic)

const getPathData = (startX, startY, endX, endY, isMobile) => {
  if (isMobile) {
    // S-curve for vertical zigzag
    const midY = (startY + endY) / 2
    return `M ${startX} ${startY}
            C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`
  } else {
    // Keep existing horizontal curve logic
    // ...
  }
}
```

**Complexity:** Medium (SVG filters, gradient animation, responsive logic)

**Build Order:** Phase 3 (after layout rewrite confirms node positions)

---

### 5. UnitSection Component (REMOVE/REPLACE)

**Current State:**
- Collapsible card wrapper (`rounded-2xl bg-white/5`)
- Unit header with icon, name, progress stats
- Horizontal node layout in SVG
- Expand/collapse state management

**Required Changes:**
```diff
- Remove entire component
+ Replace with per-node unit indicator badges
+ Move progress stats to header summary (per-path)
```

**New Pattern:**
```javascript
// In TrailNode.jsx
{node.unit && (
  <div className="absolute -top-8 left-1/2 -translate-x-1/2">
    <span className="text-xs text-white/60 font-semibold">
      Unit {node.unit}
    </span>
  </div>
)}
```

**Complexity:** Low (deletion + small badge addition)

**Build Order:** Phase 3 (during layout rewrite)

---

### 6. TrailNodeModal.jsx (NO CHANGES)

**Current State:**
- Modal overlay with node details
- Exercise list with completion status
- "Start Practice" navigation button
- Multi-exercise support with sequential progression

**Required Changes:** None

**Rationale:** Modal functionality is independent of trail layout. The visual redesign affects the trail page, not the modal interaction flow.

**Build Order:** N/A (not modified)

---

## New Components

### 1. TabSwitcher.jsx (NEW)

**Purpose:** Navigate between Treble, Bass, Rhythm paths

**Design:**
```javascript
<div className="flex gap-2 justify-center mb-6">
  {paths.map(path => (
    <button
      key={path.id}
      onClick={() => setActiveCategory(path.id)}
      className={`
        px-6 py-3 rounded-full font-semibold
        transition-all duration-300
        ${activeCategory === path.id
          ? 'bg-white text-indigo-900 shadow-lg scale-105'
          : 'bg-white/10 text-white hover:bg-white/20'}
      `}
    >
      {path.icon} {path.name}
    </button>
  ))}
</div>
```

**Props:**
- `activeCategory: string` - Currently selected path ID
- `onCategoryChange: (id: string) => void` - Selection callback
- `paths: Array<{ id, name, icon }>` - Path metadata

**Responsive:**
- Mobile: Full-width buttons, stacked if needed
- Desktop: Horizontal row, centered

**Complexity:** Low (simple button group)

**Build Order:** Phase 2 (before layout rewrite)

---

### 2. trail-effects.css (NEW CSS MODULE)

**Purpose:** Enchanted forest CSS effects (backgrounds, animations, glows)

**Key Styles:**

#### Forest Background
```css
.trail-forest-bg {
  background: linear-gradient(
    180deg,
    #0f172a 0%,      /* Deep night blue */
    #1e293b 30%,     /* Slate */
    #334155 60%,     /* Lighter slate */
    #475569 100%     /* Horizon glow */
  );
  position: relative;
  overflow: hidden;
}

.trail-forest-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 20% 30%, white, transparent),
    radial-gradient(2px 2px at 60% 70%, white, transparent),
    radial-gradient(1px 1px at 50% 50%, white, transparent);
  background-size: 200px 200px, 300px 300px, 150px 150px;
  animation: starfield 60s linear infinite;
  opacity: 0.4;
}

@keyframes starfield {
  0% { transform: translateY(0); }
  100% { transform: translateY(-200px); }
}
```

#### Node Glow Effects
```css
.node-glow-treble {
  --glow-color: rgba(59, 130, 246, 0.6);      /* Blue */
  --glow-start: #3b82f6;
  --glow-mid: #60a5fa;
}

.node-glow-bass {
  --glow-color: rgba(168, 85, 247, 0.6);      /* Purple */
  --glow-start: #a855f7;
  --glow-mid: #c084fc;
}

.node-glow-rhythm {
  --glow-color: rgba(16, 185, 129, 0.6);      /* Green */
  --glow-start: #10b981;
  --glow-mid: #34d399;
}
```

#### Path Glow Animation
```css
@keyframes path-pulse {
  0%, 100% {
    filter: brightness(1) drop-shadow(0 0 8px var(--glow-color));
  }
  50% {
    filter: brightness(1.3) drop-shadow(0 0 16px var(--glow-color));
  }
}

.path-animated {
  animation: path-pulse 2s ease-in-out infinite;
}
```

#### Quicksand Font Import
```css
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');

.trail-text {
  font-family: 'Quicksand', sans-serif;
}
```

**Build Order:** Phase 1 (foundation before component work)

---

## CSS Architecture

### Where Do Forest Styles Live?

**Recommended Approach:** Dedicated CSS module + Tailwind utilities

```
src/
├── components/trail/
│   ├── trail-effects.css     ← NEW: Forest theme styles
│   ├── TrailMap.jsx           (imports trail-effects.css)
│   ├── TrailNode.jsx
│   └── PathConnector.jsx
└── index.css                  (existing global styles, no changes)
```

### Import Pattern
```javascript
// TrailMapPage.jsx
import './trail/trail-effects.css'

// Component usage
<div className="trail-forest-bg fixed inset-0 overflow-y-auto">
  <TrailMap />
</div>
```

### Why Not Global CSS?

1. **Scoped styles** - Forest effects only apply to trail page
2. **Performance** - CSS module not loaded on other pages
3. **Maintainability** - Trail redesign CSS isolated from design system
4. **Clean rollback** - Remove single file to revert styles

### Tailwind Integration

**Use Tailwind for:**
- Layout utilities (flex, grid, spacing)
- Responsive breakpoints (md:, lg:)
- Interactive states (hover:, focus:)

**Use trail-effects.css for:**
- Complex gradients (radial, multi-stop)
- Keyframe animations (starfield, pulse, glow)
- CSS custom properties (--glow-color)
- Pseudo-elements (::before, ::after for effects)

---

## Responsive Strategy

### Breakpoint System

```javascript
// Use Tailwind breakpoints for consistency
const breakpoints = {
  mobile: '(max-width: 767px)',    // md: breakpoint
  desktop: '(min-width: 768px)'
}

// React hook
const isMobile = useMediaQuery('(max-width: 767px)')
```

### Layout Switch Logic

```javascript
// TrailMap.jsx
const TrailMap = () => {
  const isMobile = useMediaQuery('(max-width: 767px)')

  return (
    <div className="trail-container">
      {isMobile ? (
        <VerticalZigzagLayout nodes={activeNodes} />
      ) : (
        <HorizontalWavyLayout nodes={activeNodes} />
      )}
    </div>
  )
}
```

### Vertical Zigzag Layout (Mobile)

**Container:**
```css
.vertical-zigzag-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  position: relative;
}
```

**Node Positioning:**
```javascript
// Alternate left/right
const getZigzagPosition = (index) => {
  const isLeft = index % 2 === 0
  return {
    x: isLeft ? '25%' : '75%',  // 25% offset from edges
    y: index * 100,              // 100px vertical spacing
    transform: `translateX(${isLeft ? -50 : 50}px)`
  }
}
```

**SVG Path:**
```javascript
// S-curve between vertically stacked nodes
const midY = (startY + endY) / 2
const path = `
  M ${startX} ${startY}
  C ${startX} ${midY},
    ${endX} ${midY},
    ${endX} ${endY}
`
```

### Horizontal Wavy Layout (Desktop)

**Keep Existing Logic:**
- Container width measurement via `useRef`
- Sine wave vertical offset (`Math.sin(index * 0.7) * WAVE_AMPLITUDE`)
- Horizontal spacing (`availableWidth / (numNodes - 1)`)

**Enhance:**
- Smoother curves via increased `cpOffset` control points
- Larger `NODE_SIZE` (80px vs 70px for desktop)
- Increased glow intensity

---

## Data Flow

### Unchanged Flow (Preserved)

```
User → Dashboard "Continue Learning"
     → TrailMapPage
     → TrailMap
     → Node Click
     → TrailNodeModal
     → "Start Practice"
     → Game Component

Progress saved → VictoryScreen
              → updateNodeProgress()
              → Re-fetch progress
              → Trail updates node state
```

### New Flow (Tab Navigation)

```
User → TrailMapPage
     → TabSwitcher
     → setActiveCategory(category)
     → TrailMap re-renders with filtered nodes
     → Single path displayed (Treble OR Bass OR Rhythm)
```

**State Management:**
```javascript
// TrailMapPage.jsx
const [activeCategory, setActiveCategory] = useState('treble_clef')

// Pass down
<TabSwitcher
  activeCategory={activeCategory}
  onCategoryChange={setActiveCategory}
/>

<TrailMap activeCategory={activeCategory} />
```

**TrailMap receives category, filters nodes:**
```javascript
// TrailMap.jsx
const TrailMap = ({ activeCategory }) => {
  const activeNodes = getNodesByCategory(activeCategory)
  // Render single path
}
```

### Progress Data Flow (Unchanged)

```javascript
// Existing hooks and services preserved
const { data: progress } = useQuery({
  queryKey: ['student-progress', user.id],
  queryFn: () => getStudentProgress(user.id)
})

const completedNodeIds = getCompletedNodeIds(user.id)
const unlockedNodes = calculateUnlockedNodes(progress, completedNodeIds)

// Node state determined client-side (no service changes)
const isUnlocked = unlockedNodes.has(node.id)
const isCompleted = completedNodeIds.includes(node.id)
```

---

## Integration Points

### TrailMapPage ↔ TrailMap
- **Prop:** `activeCategory: string` (new)
- **Data:** Progress fetching stays in TrailMap (React Query)
- **Layout:** TrailMapPage adds TabSwitcher, passes category selection

### TrailMap ↔ TrailNode
- **Prop:** `node: object` (unchanged)
- **Prop:** `progress: object` (unchanged)
- **Prop:** `isUnlocked: boolean` (unchanged)
- **Prop:** `onClick: function` (unchanged)
- **CSS:** TrailNode receives new CSS classes for 3D effects

### TrailMap ↔ PathConnector
- **Prop:** `startX, startY, endX, endY` (unchanged positions)
- **Prop:** `isCompleted: boolean` (unchanged)
- **Prop:** `isMobile: boolean` (NEW - responsive path calculation)
- **Prop:** `category: string` (NEW - glow color selection)

### TrailNode ↔ TrailNodeModal
- **Prop:** `node: object` (unchanged)
- **Unchanged:** Modal functionality, exercise list, navigation

---

## Component Dependency Graph

```
TrailMapPage.jsx (minor changes)
├── TabSwitcher.jsx (NEW)
│   └── setActiveCategory callback → TrailMapPage state
└── TrailMap.jsx (major rewrite)
    ├── getNodesByCategory(activeCategory) → filtered nodes
    ├── VerticalZigzagLayout (NEW for mobile)
    │   ├── TrailNode.jsx (CSS enhancement)
    │   └── PathConnector (rewrite)
    └── HorizontalWavyLayout (existing, enhanced)
        ├── TrailNode.jsx (CSS enhancement)
        └── PathConnector (rewrite)

TrailNode.jsx (CSS changes)
├── nodeTypeStyles.js (unchanged utility)
└── TrailNodeModal.jsx (unchanged, triggered by onClick)

trail-effects.css (NEW)
├── .trail-forest-bg
├── .node-glow-* variants
└── @keyframes animations
```

---

## Build Order (Phase Dependencies)

### Phase 1: Foundation (No Component Dependencies)
1. **Create `trail-effects.css`**
   - Forest background gradients
   - Node glow CSS custom properties
   - Keyframe animations (starfield, pulse)
   - Quicksand font import

2. **Create `TabSwitcher.jsx`**
   - Simple button group component
   - No dependencies on TrailMap
   - Can be built and styled independently

**Deliverable:** CSS module + tab component ready for integration

---

### Phase 2: Page-Level Integration (Depends on Phase 1)
1. **Modify `TrailMapPage.jsx`**
   - Import `trail-effects.css`
   - Add `<TabSwitcher />` component
   - Add `activeCategory` state
   - Replace background className with `.trail-forest-bg`
   - Update header title and font to Quicksand

2. **Enhance `TrailNode.jsx` CSS**
   - Add 3D shadow layers
   - Replace flat gradients with radial gradients
   - Add `.node-glow-*` classes
   - Test node appearance with new styles

**Deliverable:** Visual theme applied, tab switcher functional, nodes look 3D

---

### Phase 3: Layout Rewrite (Depends on Phase 2)
1. **Add responsive layout logic to `TrailMap.jsx`**
   - Add `useMediaQuery` hook
   - Create `VerticalZigzagLayout` component (mobile)
   - Create `HorizontalWavyLayout` component (desktop, wraps existing)
   - Implement category filtering (`activeCategory` prop)
   - Remove `UnitSection` rendering

2. **Rewrite `PathConnector` component**
   - Add `isMobile` prop for path calculation
   - Add `category` prop for glow color
   - Implement animated gradient SVG
   - Add multi-layer glow effect

**Deliverable:** Responsive layout functional, single path displayed at a time

---

### Phase 4: Polish & Animation (Depends on Phase 3)
1. **Enhance PathConnector animations**
   - Add animated sparkles for completed paths
   - Fine-tune glow intensity
   - Add hover effects

2. **Add unit indicator badges**
   - Small "Unit X" labels above nodes
   - Positioned via absolute positioning

3. **Responsive testing**
   - Test breakpoint transitions (768px)
   - Test node spacing on various screen sizes
   - Test path rendering edge cases (first/last node)

**Deliverable:** Fully polished, production-ready trail page

---

## Testing Strategy

### Visual Regression Testing
```bash
# Capture screenshots at key breakpoints
- Mobile: 375px, 414px (iPhone sizes)
- Tablet: 768px (breakpoint)
- Desktop: 1024px, 1440px

# Test states
- Empty trail (new user)
- Partial progress (some nodes completed)
- Full completion (all nodes mastered)
```

### Component Testing
```javascript
// TrailMap.test.jsx
describe('TrailMap responsive layout', () => {
  it('renders vertical zigzag on mobile', () => {
    mockMediaQuery('(max-width: 767px)')
    render(<TrailMap activeCategory="treble_clef" />)
    expect(screen.getByTestId('vertical-layout')).toBeInTheDocument()
  })

  it('renders horizontal wavy on desktop', () => {
    mockMediaQuery('(min-width: 768px)')
    render(<TrailMap activeCategory="treble_clef" />)
    expect(screen.getByTestId('horizontal-layout')).toBeInTheDocument()
  })
})
```

### Integration Testing
```javascript
// User flow: tab switching
it('switches between paths via tabs', async () => {
  render(<TrailMapPage />)

  // Start on Treble
  expect(screen.getByText('Treble Clef')).toBeInTheDocument()

  // Click Bass tab
  fireEvent.click(screen.getByText('Bass'))

  // Verify Bass nodes displayed
  await waitFor(() => {
    expect(screen.getByText('Middle C Position')).toBeInTheDocument()
  })
})
```

---

## Performance Considerations

### SVG Rendering
- **Problem:** Large SVG canvases can cause jank on mobile
- **Solution:** Limit visible nodes per path (use virtualization if needed)
- **Target:** 60fps scroll on iPhone 8+

### CSS Animations
- **Problem:** Multiple animated gradients + glows can tax GPU
- **Solution:**
  - Use `will-change: transform` sparingly
  - Prefer `transform` over `top/left` for animations
  - Reduce animation complexity on older devices

### Media Query Handling
- **Problem:** Layout thrashing on window resize
- **Solution:** Debounce `useMediaQuery` checks (150ms)

```javascript
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const handler = debounce(() => setMatches(media.matches), 150)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [query])

  return matches
}
```

---

## Rollback Strategy

If redesign issues arise in production:

### Quick Rollback (CSS-Only)
```bash
# Remove trail-effects.css import
# Revert TrailMapPage background to original gradient
# Nodes revert to flat appearance (existing Tailwind classes)
```

### Full Rollback (Layout)
```bash
# Revert TrailMap.jsx to commit before layout rewrite
# Remove TabSwitcher component
# Restore UnitSection rendering
# All data layer unchanged, so no database issues
```

**Risk Mitigation:** The data layer and services are untouched, so rollback only affects UI rendering. No migration scripts or database changes required.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Data Layer | **HIGH** | No changes to services or node definitions |
| Component Separation | **HIGH** | Clear boundaries: TrailMap layout, TrailNode styling, PathConnector effects |
| Responsive Strategy | **MEDIUM** | Media query + conditional rendering tested, but edge cases may arise |
| CSS Effects | **MEDIUM** | Radial gradients + SVG filters work cross-browser, but performance varies on older devices |
| Build Order | **HIGH** | Phased approach isolates risk: CSS foundation → integration → layout → polish |

---

## Open Questions

1. **Node spacing:** What's the optimal vertical spacing for mobile zigzag? (40px, 60px, 80px?)
   - **Resolution:** Prototype with 60px, adjust after user testing

2. **Path glow intensity:** How strong should the animated glow be without overwhelming the design?
   - **Resolution:** Start conservative (opacity: 0.4), increase if feedback requests more "magic"

3. **Tab persistence:** Should active tab persist in localStorage or URL query params?
   - **Resolution:** URL query params (`?path=bass`) for shareable links + browser back button support

4. **Unit indicator placement:** Above node (as suggested) or inline with node name?
   - **Resolution:** Above node to avoid cluttering the name label

---

## Success Criteria

Redesign is complete when:
- ✅ Mobile users see vertical zigzag layout with alternating node positions
- ✅ Desktop users see horizontal wavy layout (enhanced from existing)
- ✅ Glowing animated paths connect nodes with category-specific colors
- ✅ Nodes have 3D appearance with radial gradients and layered shadows
- ✅ Background shows enchanted forest gradient with subtle star animation
- ✅ Tab switcher allows toggling between Treble, Bass, Rhythm paths
- ✅ All existing functionality preserved (progress tracking, modal, navigation)
- ✅ No regressions in VictoryScreen → trail update flow
- ✅ 60fps on iPhone 12 and above (target device)
