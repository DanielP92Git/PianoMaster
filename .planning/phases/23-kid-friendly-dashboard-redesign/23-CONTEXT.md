# Phase 23: Kid-Friendly Dashboard Redesign - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning
**Source:** User-provided design screenshot + discussion

<domain>
## Phase Boundary

Redesign the student Dashboard from a data-heavy analytics layout into a visually engaging, kid-friendly home screen for 8-year-old learners. This is a UI/layout overhaul of `Dashboard.jsx` and its sub-components (`XPProgressCard`, `DailyGoalsCard`). All existing data fetching, routing, and business logic must be preserved. The teacher dashboard section is out of scope for visual changes.

**Current state:** 1,083-line Dashboard with large photo hero, centered welcome greeting, separate Continue Learning card, XP progress bar card, DailyGoalsCard, 4 floating-icon stat cards (streak/points/time/level), My Progress panel (streak prompt + assignments), and Practice Tools list panel.

**Target state:** Compact hero with centered avatar + level badge, large "Play Next" gradient pill overlapping hero, single unified stats card with circular XP ring, refreshed DailyGoalsCard, 3 circular glowing Practice Tools buttons. Significantly simplified and more visually playful.

</domain>

<decisions>
## Implementation Decisions

### Hero & Welcome Area
- Keep existing dashboard hero images (WebP/PNG), restyle to be more compact
- Avatar moved to top-center (currently top-left) with a "LEVEL X" pill badge beside it
- Small app name text above the centered avatar
- Compact greeting "Hi, [Name]!" below app name (replaces large "Welcome back, [Name]!" heading)
- Fireflies component kept
- Dark gradient overlay stays but adjusted for compact height
- No large centered welcome text block — hero is primarily visual

### Play Next Button
- Large centered gradient pill button (blue-to-purple gradient) overlapping the hero bottom edge
- "PLAY NEXT" in large bold text + node name as subtitle below
- Replaces the current full-width "Continue Learning" card
- This is the primary CTA — most prominent interactive element on the page
- Positioned to overlap hero/content boundary (negative margin or absolute positioning)

### Unified Stats Card
- Single card replacing the current 4 separate stat cards with floating icon images
- CSS gradient border: blue (left side) transitioning to orange/amber (right side) — implemented via border-image or pseudo-element gradient + padding trick
- Card contents:
  - Level name as card title (e.g., "Harmony Hero") — top-left
  - Circular XP progress ring (left side): SVG stroke-dasharray or CSS conic-gradient, star icon in center, "X/Y XP" text below ring
  - Daily Streak (right side): large number + fire emoji, "Daily Streak" label
  - Daily Goals summary (right side, below streak): "X/3" count + progress bar
- Replaces: 4 stat cards (streak, points, practice time, level) AND the XPProgressCard component

### DailyGoalsCard
- Always visible as a separate section below the unified stats card
- Visual refresh to match new kid-friendly design language:
  - Glow ring icons for each goal (similar to Practice Tools circles)
  - More playful typography
  - Updated colors/borders to feel cohesive with the unified stats card
- The stats card's daily goals summary is a quick glance; this card shows full detail
- Existing goal structure preserved (icon, name, description, progress count, progress bar)

### Practice Tools
- 3 circular glowing icon buttons in a horizontal row (replaces current list-style cards with descriptions)
  - Reminder (bell icon) — amber/warm glow ring
  - Record Session (microphone icon) — green glow ring
  - Practice History (piano keys icon) — blue/purple glow ring
- Each button has its label text below the circle
- Tap feedback: press scale-down + glow pulse animation, then navigate/open modal
- "Practice Tools" heading centered above the row

### Removed Sections
- 4 separate stat cards with floating icon images (streak, points, practice time, level) — consolidated into unified stats card
- "My Progress" bottom panel (streak prompt + assignments cards)
- Assignments section entirely removed from dashboard

### Animations & Interactions
- Rich animations, all gated behind reducedMotion (AccessibilityContext + useMotionTokens)
- XP ring: animated fill on initial load (stroke-dashoffset transition)
- Play Next button: subtle pulse/glow animation to draw attention
- Stats card and sections: fade-in entrance animation on mount
- Practice Tools circles: press scale + glow pulse on tap
- Fireflies component stays
- Reduced motion fallback: static states, no entrance animations, instant transitions

### Claude's Discretion
- Conditional banners placement (PushOptInCard, Comeback Bonus, streak freeze count) — integrate as badges/indicators within the unified stats card or as compact banners, whichever fits the layout best
- Whether to include total points and practice time as small secondary text in the stats card or drop them entirely
- Desktop/tablet responsive layout adaptation (current dashboard uses grid that expands to 4 columns — new layout needs responsive treatment)
- Teacher dashboard section styling (keep as-is or lightly update to not clash)
- Exact hero height reduction and overlap positioning math
- Loading skeleton design for the new layout

</decisions>

<specifics>
## Specific Ideas

- Reference screenshot shows an enchanted garden scene with a grand piano — while we keep existing images, the compact hero + overlay + fireflies should evoke a similar magical feel
- The unified stats card's gradient border (blue-to-orange) creates a warm, inviting frame — this is a signature visual element
- Practice Tools circles should feel like the Phase 22 node modal's 3D bubble badges — glowing rings with depth
- The "PLAY NEXT" pill button should feel like the most exciting thing on the page — a big candy-like button that says "tap me!"
- The circular XP ring with star center matches common kid-app patterns (Duolingo-style progress rings)
- Overall feel should be: less text, more visual, immediate action (Play Next), quick stats glance, then tools

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/layout/Dashboard.jsx` (1,083 lines): Main component with all data fetching hooks — restructure JSX, preserve hooks
- `src/components/dashboard/XPProgressCard.jsx`: Current horizontal XP bar — will be replaced by circular ring in unified stats card
- `src/components/dashboard/DailyGoalsCard.jsx`: Goal list with icons/progress — refresh styling, keep structure
- `src/components/dashboard/PushOptInCard.jsx`: Conditional opt-in card — reposition into new layout
- `src/components/ui/Fireflies.jsx`: Particle effect overlay — keep as-is in hero
- `src/components/ui/GoldStar.jsx`: Gold star component — may be useful for XP ring center
- `src/utils/useMotionTokens.js`: Motion tokens for reduced-motion-aware animations
- `src/contexts/AccessibilityContext`: reducedMotion setting for animation gating
- Existing hero images: `/images/dashboard-hero.webp`, `/images/desktop-dashboard-hero.webp` (+ PNG fallbacks)
- Icon assets: `src/assets/icons/flame.png`, `star.png`, `clock.png`, `crown.png` — currently used by stat cards, may be reused or dropped

### Established Patterns
- Glass card: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl` — used throughout app
- Glow effects: CSS drop-shadow filters on icon images (current stat cards), pseudo-element glow (trail page)
- RTL support: `isRTL` boolean with conditional `flex-row-reverse` and `text-right` — must be preserved in new layout
- framer-motion: AnimatePresence/motion used in games — available for dashboard entrance animations
- Tailwind responsive: `sm:`, `md:`, `lg:` breakpoints for grid adaptation

### Integration Points
- Data hooks stay unchanged: useQuery for streak, streakState, totalPoints, scoresData, nextNode, dailyGoals, xpData
- `useSubscription()` for isPremium (affects nextNode recommendation)
- `openReminderModal()` and `openRecordModal()` functions — rewire to new circular buttons
- Teacher panel conditional (`isTeacher`) — keep separate from student redesign
- `Link to="/trail"` for Play Next navigation — preserve state passing

</code_context>

<deferred>
## Deferred Ideas

- Bottom navigation redesign — already exists on mobile, no changes needed this phase
- Teacher dashboard visual refresh — separate phase if needed
- Animated character/mascot in hero (Beethoven illustration) — would require new image assets
- Desktop-specific layout with sidebar integration — could be its own polish phase

</deferred>

---

*Phase: 23-kid-friendly-dashboard-redesign*
*Context gathered: 2026-03-06*
