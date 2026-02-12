---
phase: 20-component-integration-tab-navigation
plan: 03
subsystem: trail-interface
tags: [ui, trail, header, level-badge, xp-bar, quicksand-font]

dependency_graph:
  requires: [phase-19-quicksand-font]
  provides: [trail-header-v2, shield-level-badge, xp-progress-bar]
  affects: [TrailMapPage]

tech_stack:
  added: [lucide-react-shield-icon]
  patterns: [2-row-header-layout, shield-badge-design, progress-bar-visualization]

key_files:
  created: []
  modified:
    - src/pages/TrailMapPage.jsx

decisions:
  - decision: Shield-style level badge with number inside
    rationale: Visual metaphor of achievement/protection, kid-friendly design that communicates progress
    alternatives: [Circle badge, star badge, plain text]
    locked: true
  - decision: 2-row header layout (nav + title + practice | badge + XP bar)
    rationale: Separates navigation from progress visualization, provides clear hierarchy
    alternatives: [Single row, 3-row layout]
    locked: true
  - decision: Quicksand font for "Learning Trail" title
    rationale: Rounded, friendly font matching kid-focused design from Phase 19
    alternatives: [Default font, system font]
    locked: true
  - decision: Subtle "Free Practice" link (text-white/50)
    rationale: Secondary action shouldn't compete with primary trail interaction
    alternatives: [Button style, same prominence as back link]
    locked: true

metrics:
  duration_seconds: 191
  duration_display: "3.2 minutes"
  tasks_completed: 1
  files_modified: 1
  commits: 1
  completed_date: 2026-02-10
---

# Phase 20 Plan 03: Trail Header Redesign Summary

**One-liner:** Shield-style level badge with XP progress bar in 2-row trail header layout

## Objective

Replace the compact XP display in the trail header with a prominent, motivating design featuring a shield-style level badge (number + name), XP progress bar, Quicksand title, and subtle "Free Practice" link. Keep level progress visible while browsing the trail to encourage continued engagement.

## What Was Built

### 1. Shield-Style Level Badge (Task 1)
- Added lucide-react Shield icon import
- Shield displays with yellow-400 color and semi-transparent fill (rgba 0.15)
- Level number centered inside shield using absolute positioning
- Level name displayed beside shield (e.g., "Beginner", "Melody Maker")
- XP counter shows "X / Y XP" format below level name
- All values have fallback defaults for loading state

### 2. XP Progress Bar (Task 1)
- Horizontal progress bar spanning remaining header width (flex-1)
- Yellow-to-amber gradient (from-yellow-400 to-amber-500)
- Width dynamically set via progressPercentage from xpSystem.js
- Smooth transitions (duration-500) for visual feedback
- White/10 background for subtle contrast

### 3. Two-Row Header Layout (Task 1)
- **Row 1:** Back to Dashboard link | "Learning Trail" title (Quicksand font) | Free Practice link
- **Row 2:** Shield badge + level info | XP progress bar
- Header container: max-w-6xl, space-y-2.5 spacing
- RTL support maintained via isRTL checks and Unicode arrow switching

### 4. Visual Design Polish
- Free Practice: text-white/50 (subtle/ghost style) instead of button
- Dashboard link: text-sm for smaller size
- Title: font-quicksand for kid-friendly look
- All hover states preserved with smooth transitions
- Loading state handled with fallback values (level 1, "Beginner")

## Architecture Integration

### Data Flow
```
xpData (from useQuery) → getStudentXP(userId)
  ↓
Returns: { levelData, progress, totalXP }
  ↓
levelData.level → Shield number
levelData.title → Level name
progress.xpInCurrentLevel → XP counter numerator
progress.nextLevelXP - currentLevel.xpRequired → XP counter denominator
progress.progressPercentage → Progress bar width
```

### Component Structure
```jsx
TrailMapPage
├─ Navigation bar (2-row header)
│  ├─ Row 1: Dashboard link | Title | Free Practice
│  └─ Row 2: Shield badge | XP bar
├─ Enchanted starfield (unchanged)
├─ Ambient glow orbs (unchanged)
└─ TrailMap (unchanged)
```

## Deviations from Plan

None - plan executed exactly as written.

## Testing Results

### Build Verification
- `npm run build` completed successfully
- No TypeScript/ESLint errors introduced
- Trail validation passed (93 nodes, 0 issues)

### Expected User Experience
1. Navigate to /trail → Header shows 2-row layout
2. Shield icon contains level number (e.g., 4 inside shield)
3. Level name beside shield (e.g., "Melody Maker")
4. XP counter shows "50 / 250 XP" format
5. Progress bar width reflects percentage (e.g., 20% = 50/250)
6. Title uses Quicksand font (rounded, kid-friendly)
7. Free Practice link is subtle (low opacity)
8. Background effects (stars, glows) remain unchanged

## Files Modified

### src/pages/TrailMapPage.jsx
- **Added:** Shield icon import from lucide-react
- **Replaced:** Single-row header with 2-row layout
- **Changed:** Compact XP display → Shield badge + progress bar
- **Changed:** Title font from default to font-quicksand
- **Changed:** Free Practice from button style to text link
- **Preserved:** RTL support, accessibility, background effects

## Key Decisions

All decisions were locked in the plan:
1. **Shield badge design:** Communicates achievement/progress in kid-friendly way
2. **2-row layout:** Separates navigation from progress visualization
3. **Quicksand title:** Matches Phase 19 font selection for trail page
4. **Subtle Free Practice:** Secondary action doesn't compete with trail

## Performance Impact

**Positive:**
- Removed bg-white/10 button container (1 fewer DOM element)
- Progress bar uses CSS transform (GPU-accelerated)

**Neutral:**
- Added Shield SVG icon (negligible render cost)
- Added 1 extra div for 2-row layout

## Success Criteria Met

- [x] Shield icon with level number centered inside it
- [x] Level name displayed prominently beside shield
- [x] XP progress bar visible in header with gradient
- [x] Quicksand font on "Learning Trail" title
- [x] Subtle Free Practice link (text-white/50)
- [x] No regression in page layout or background effects
- [x] Build completes without errors
- [x] RTL support maintained

## Next Steps

Phase 20 continues with:
- Plan 04: Tab navigation for path switching (mobile optimization)
- Plan 05: Responsive node layout (vertical zigzag mobile, horizontal desktop)

## Commits

- `1394720` - feat(20-03): redesign trail header with shield badge and XP bar

## Self-Check: PASSED

Verification of created/modified files:
```bash
[✓] src/pages/TrailMapPage.jsx exists and modified
[✓] Commit 1394720 exists in git log
[✓] Shield import added
[✓] 2-row header layout implemented
[✓] XP progress bar added with gradient
[✓] Quicksand font applied to title
[✓] Free Practice link is text-white/50
```

All claims verified.
