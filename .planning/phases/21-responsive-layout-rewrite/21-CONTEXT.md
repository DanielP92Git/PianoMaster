# Phase 21: Responsive Layout Rewrite - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the trail layout into a responsive system: vertical zigzag on mobile (<768px), horizontal/wavy layout on desktop (>=768px), with SVG Bezier path connectors between nodes and glass-morphism unit progress cards between units. Zero new features — purely layout and visual presentation of the existing 93-node trail.

</domain>

<decisions>
## Implementation Decisions

### Zigzag Layout (Mobile)
- Moderate vertical spacing between nodes (100-120px)
- Slight variation in horizontal position (20-30% / 70-80%) rather than exact 25/75 — gives a natural, winding forest path feel
- Auto-scroll to center the current active node in viewport on page load
- Glass card separators sit between units, breaking the trail into visually distinct sections

### SVG Path Connectors
- Thin lines (2-3px stroke width) — subtle, doesn't compete with node styling
- Completed sections: subtle ambient cyan glow (2-4px blur) — forest-firefly feel, not neon
- Locked/upcoming sections: dashed gray line (classic dash-array in muted gray)
- Gentle, flowing S-curves for Bezier paths — feels like a winding river, not sharp zigzag turns

### Desktop Horizontal Layout
- Claude's discretion on scroll direction and overall layout pattern (horizontal scroll vs vertical with wider layout vs snaking rows) — pick what works best based on research of similar game trail layouts
- 6-8 nodes visible without scrolling — spacious, generous screen real estate
- Nodes scale larger on desktop — take advantage of available screen space
- Node names always visible on desktop (labels below/beside each node) — mobile shows names only on tap

### Glass-morphism Unit Cards
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

</decisions>

<specifics>
## Specific Ideas

- Zigzag should feel like a winding forest path with natural variation, not a rigid grid
- SVG connectors should evoke firefly trails in the enchanted forest — subtle ambient glow, not neon
- Desktop should feel spacious with node names visible at a glance, not requiring hover/tap
- Unit cards act as chapter breaks in the trail journey — boss node is the climax, card is the summary

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-responsive-layout-rewrite*
*Context gathered: 2026-02-11*
