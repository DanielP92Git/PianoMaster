# Phase 14: Node Type Visual Distinction - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Add visual identity to distinguish 8 node types (3 categories × standard/boss variations) across 93 trail nodes. Children need to recognize what kind of practice each node offers at a glance.

This phase adds icons and color-coding to the existing trail system. Does NOT add new node types or change trail navigation.

</domain>

<decisions>
## Implementation Decisions

### Icon Selection & Personality
- **Icon approach**: Activity-focused icons (what the child does), not abstract musical symbols
- **Primary activity**: All three categories (treble, bass, rhythm) involve "reading notes on staff"
- **Specific icons**: Use actual clef symbols for clarity despite activity focus
  - Treble nodes: Treble clef icon
  - Bass nodes: Bass clef icon
  - Rhythm nodes: Rhythm/metronome icon
- **Icon style**: Outlined (line art) style, not filled
- **Icon placement**: Center of node circle (main visual element, node name below)

### Color Palette & Accessibility
- **Category colors**: Claude's discretion — choose accessible, child-friendly palette
- **Boss visual differentiation**: Claude's discretion — balance prominence with consistency (gold accent, darker shade, or gradient)
- **Color placement**: Claude's discretion — determine where color appears (background, border, or badge) based on state visibility needs
- **Colorblind accessibility**: Follow best practices for colorblind accessibility (never rely on color alone)

### Boss Node Visual Prominence
- **Prominence level**: Claude's discretion — balance excitement with trail readability (subtle to dramatic)
- **Animation effects**: Claude's discretion — choose based on accessibility patterns from Phase 13 (must respect reducedMotion)
- **Crown placement**: Claude's discretion — determine best visual hierarchy (top, center, or badge)
- **Locked boss treatment**: Claude's discretion — balance motivation/surprise (same locked style vs preview vs mystery)

### State Hierarchy & Readability
- **Locked nodes**: Gray out completely — locked nodes lose category color, icon faint, state dominates
- **Available nodes**: Pulsing highlight — subtle animation to draw attention (must respect reducedMotion from Phase 13)
- **Mastered nodes**: Star display — show earned stars (1-3) prominently on the node
- **Visual priority**: Available nodes should stand out most at a glance (eye drawn to what's playable now)
- **Modal consistency**: Claude's discretion — ensure TrailNodeModal color treatment consistent without overwhelming

### Icon State Variations
- **Icon size by state**: Claude's discretion — choose based on UI consistency (opacity, size variation, or constant)

### Claude's Discretion
Areas where Claude has flexibility during research and planning:
- Exact color values for category palette (must be accessible, child-friendly)
- Boss node gold accent intensity and application (border, glow, gradient, darker shade)
- Color placement method (background fill, border/ring, or badge)
- Colorblind accessibility pattern (icon + color, pattern/texture, or trust color + state)
- Boss prominence level (subtle 10-15% larger vs clearly special 25-30% vs dramatically different)
- Boss animation type (pulse/glow, particles, or static only)
- Crown icon placement on boss nodes (top, center with clef, or small badge)
- Locked boss preview approach (same treatment, silhouette, or mystery box)
- Icon size variation by state (opacity-only, size change, or constant)
- TrailNodeModal color intensity (exact match, lighter version, or neutral)

</decisions>

<specifics>
## Specific Ideas

- Nodes use **lucide-react icon library** (per ROADMAP requirements)
- Available nodes must **pulse to draw attention** — this is a key motivation mechanism for 8-year-olds
- Locked nodes **completely gray out** — clear visual language that "you can't play this yet"
- Stars show progress on mastered nodes — children should feel pride seeing their completed nodes
- All animations must **respect reducedMotion setting** from Phase 13's accessibility foundation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-node-type-visual-distinction*
*Context gathered: 2026-02-05*
