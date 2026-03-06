# Phase 22: Kid-Friendly Node Modal Redesign - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning
**Source:** User-provided design screenshot

<domain>
## Phase Boundary

Redesign the TrailNodeModal component to match a kid-friendly visual design. This is a pure UI/visual overhaul — all existing logic (navigation, exercise progress, premium locking, boss hints, prerequisites, RTL) must be preserved.

**Current state:** Text-heavy, left-aligned modal with small inline icon, flat skill pills, small XP text line, close X button.
**Target state:** Centered, visually rich modal with large glowing category icon, 3D bubble note badges, prominent XP card with star, gradient action buttons.

</domain>

<decisions>
## Implementation Decisions

### Layout
- Modal content is centered (not left-aligned)
- Large category icon at top in a glowing circular badge (treble clef / bass clef / rhythm icon)
- Node title centered below icon, large and bold
- Subtitle below title, smaller and lighter
- No close X button visible — "Cancel" button at bottom serves as close
- More spacious padding throughout

### Skills Section
- "Skills You'll Learn" heading
- Notes displayed as colorful 3D bubble/orb badges (not flat pills)
- Each note letter (C, D, E) centered inside a colored circle with sparkle/glow decorations
- Colors: blue, purple, pink gradient — category-aware coloring
- Larger than current skill pills

### XP Reward Section
- Dedicated card/section with dark background
- Large golden star icon on the left
- XP value (e.g., "55") in large bold text
- "XP Reward" label below the number
- Visually prominent — second-most important element after the icon

### Action Buttons
- Full-width row at bottom
- "Cancel" button: muted gray, rounded
- "Start Practice" button: vibrant blue-to-purple gradient, rounded, larger text
- No close X — Cancel is the dismiss action

### Preserved Functionality (Claude's Discretion on visual treatment)
- Exercise list for multi-exercise nodes (shown below skills or as expandable section)
- Progress section (stars, best score, exercise progress bar)
- Premium lock overlay and paywall message
- Boss unlock hints for locked boss nodes
- Prerequisite list for locked nodes
- RTL support (Hebrew)
- Accessory unlock hint
- All navigation logic unchanged

</decisions>

<specifics>
## Specific Ideas

- Category icon: Use existing `getNodeTypeIcon` but render at ~64-80px in a circular container with CSS glow/shadow matching the screenshot's blue glow ring
- Bubble notes: CSS-only with radial gradient backgrounds, box-shadow for 3D depth, and positioned sparkle pseudo-elements or small star SVGs
- Star icon: Either emoji star or a small SVG/CSS golden star with glow effect
- Background: Keep current `bg-slate-800/95 backdrop-blur-sm` dark glass card
- Color mapping for note bubbles:
  - Treble clef notes: blue -> purple -> pink gradient across the note pool
  - Bass clef notes: purple -> indigo -> violet gradient
  - Rhythm skills: green -> teal -> emerald gradient
- The modal should feel like opening a treasure box — exciting and inviting for 8-year-olds

</specifics>

<deferred>
## Deferred Ideas

- Animated entrance (slide up + scale) — could add in a future polish pass
- Sound effect on modal open — not in scope for this visual redesign
- 3D parallax effect on note bubbles — over-engineering for now

</deferred>

---

*Phase: 22-kid-friendly-node-modal*
*Context gathered: 2026-03-06 via user design screenshot*
