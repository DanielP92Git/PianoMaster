# Phase 20: Component Integration & Tab Navigation - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply Phase 19's CSS foundation to trail components: 3D node styling with visual state distinction, tab-based path switching (Treble/Bass/Rhythm), trail header redesign with level badge and XP, and node interaction feedback. TrailNodeModal functionality unchanged. Pure visual + interaction work — no new capabilities or data model changes.

</domain>

<decisions>
## Implementation Decisions

### Node Visual States
- Subtle raised 3D effect — gentle shadow and slight gradient, nodes feel slightly elevated off the enchanted forest background (not bold orbs)
- Completed nodes show stars rendered inside the node circle itself (replacing/overlaying the icon)
- Active/current node has a static cyan glow ring — no pulse animation
- Locked nodes display as silhouettes with a lock icon — content hidden until unlocked, gamified mystery feel

### Tab Switcher Design
- Filled pill/button style — active tab is a filled rounded button (glass-morphism style), inactive tabs are outlined/ghost
- Tabs show path name + progress count (e.g., "Treble (12/23)" or small progress indicator under name)
- Tab placement: Claude's discretion — pick based on mobile UX and existing layout patterns
- Tab transition animation: Claude's discretion — pick based on Chromebook performance constraints

### Trail Header Layout
- Level badge uses shield/emblem style — level number inside a small shield or crest icon
- Show both level number AND level name (e.g., "Level 4 — Adventurer") — kids connect with titles
- Free Practice button is secondary/subtle — text link or ghost button, doesn't compete with trail for attention
- XP progress bar included in the header — small bar showing progress to next level, constant motivation

### Node Interaction Feel
- Gentle press-down dip on tap — small translateY (~2px) with slightly reduced shadow, subtle and polished
- Locked nodes are interactive — tapping shows a brief tooltip (e.g., "Complete X first") to help kids understand progression
- Desktop hover: scale up ~10% with enhanced glow — clear clickable affordance
- Boss nodes interact the same as regular nodes — consistent behavior, visual distinction already handled by Phase 14

### Claude's Discretion
- Tab bar placement (top below header vs bottom of screen)
- Tab switch transition (instant vs fade crossfade) — consider Chromebook 60fps target
- Exact shadow values and gradient colors for the subtle 3D node effect
- Star rendering style inside completed nodes (filled stars, gold color, exact sizing)
- XP bar exact styling and position within header

</decisions>

<specifics>
## Specific Ideas

- Locked nodes as silhouettes creates a "what's behind the curtain" mystery that should motivate 8-year-olds to progress
- Level names alongside numbers (not just "Level 4") add personality — kids identify with titles like "Adventurer"
- XP bar in header keeps motivation visible while browsing the trail, not just on the dashboard
- Glass-morphism pill tabs tie into the enchanted forest theme established in Phase 19

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-component-integration-tab-navigation*
*Context gathered: 2026-02-10*
