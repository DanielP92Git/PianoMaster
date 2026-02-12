# Phase 16: Dashboard XP Prominence - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the XP system visible and motivating throughout the app. This includes a dashboard XP card with progress bar, level display, XP-to-next-level indicator, level-up celebrations, and VictoryScreen XP gain animation. No new XP mechanics or level thresholds are being changed — this is purely the presentation layer for the existing XP system.

</domain>

<decisions>
## Implementation Decisions

### XP Display Layout
- Dedicated XP card on the dashboard (same visual weight as Daily Goals and Continue Learning)
- Horizontal fill bar (left-to-right progress, Duolingo-style)
- Standard info density: level name above bar, "450 / 700 XP" below bar, "250 XP to Level 4" as subtext
- Also appears as compact XP summary in the trail map header (so kids see progress while navigating nodes)
- Card position on dashboard: Claude's discretion based on current layout

### Level Identity
- Music-themed level names across 10 levels (e.g., Beginner, Novice, Apprentice... Maestro, Legend)
- Color-coded same icon (one icon shape that changes color/style as levels progress, e.g., bronze to gold)
- Color palette: Claude's discretion — pick a progression that works with existing design system and is colorblind-safe
- Level name is the headline — large text, identity-focused ("Apprentice" prominent, XP numbers secondary)
- The child should think of themselves as their level title

### Level-up Moment
- Full celebration on VictoryScreen when XP crosses level threshold
- Quick acknowledgment on Dashboard: animated badge update (XP card's level badge pulses/animates on load)
- VictoryScreen celebration drama level: Claude's discretion based on existing celebration tier system
- Show once per level — track celebrated levels in localStorage, never repeat the same level-up celebration

### VictoryScreen XP Animation
- Number rolling up AND mini progress bar filling simultaneously — maximum visual feedback
- "+75 XP" counts from 0 to total over ~1 second, while a mini XP bar fills showing before/after progress
- Just the total XP gained — no itemized breakdown (keep it simple for 8-year-olds)
- Post-XP level context: Claude's discretion — decide based on what best motivates and boosts kid enthusiasm
- Mini XP bar persists on VictoryScreen (not a transient animation)

### Claude's Discretion
- XP card position among existing dashboard cards
- Level color palette (colorblind-safe, works with design system)
- Level-up celebration drama level on VictoryScreen (fit within existing celebration tier system)
- Whether to show remaining XP to next level on VictoryScreen (motivational judgment call)
- Music-themed level name choices (age-appropriate for 8-year-olds)
- Compact trail header XP summary design (just bar, or also level name)

</decisions>

<specifics>
## Specific Ideas

- Horizontal fill bar like Duolingo's XP bar — simple and universally understood
- Level name should be the child's identity ("I'm an Apprentice!") — headline treatment, not afterthought
- Color-coded progression (same icon, different colors per tier) rather than unique icons per level
- Count-up animation is classic RPG feel — number rolling from 0 to earned amount
- Dashboard badge pulse is subtle but noticeable — the child discovers their new level

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-dashboard-xp-prominence*
*Context gathered: 2026-02-09*
