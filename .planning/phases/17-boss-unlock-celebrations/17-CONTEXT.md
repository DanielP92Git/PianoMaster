# Phase 17: Boss Unlock Celebrations - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Create memorable milestone moments when players complete boss nodes. A 3-stage celebration modal sequence (celebration, unlock animation, next unit preview) that fires once per boss node, with musical-themed confetti and a short fanfare sound. This phase does NOT add new node types, change progression logic, or modify the trail structure.

</domain>

<decisions>
## Implementation Decisions

### 3-Stage Sequence Flow
- Stage 1 (Celebration): "Boss Defeated!" headline with confetti and effects — text + visual effects together
- Stage 2 (Unlock): Boss node transforms visually (crown glows, badge earned) — focused on what was conquered, not a gate opening
- Stage 3 (Preview): Announces next unit name + shows mini trail snippet of upcoming nodes
- Stages advance via **tap (Continue button)**, not auto-advance
- Modal placement: Claude's discretion on whether it layers after VictoryScreen or replaces it for boss nodes

### Musical Confetti Design
- Particles are **literal music symbols** (notes, treble clefs, sharps/flats) — recognizable music notation shapes
- Color scheme: **gold boss theme** (gold, amber, white) emphasizing "boss defeated" achievement
- Intensity: **slightly elevated** over standard 3-star confetti — same style but a bit more particles/duration
- Sound: **short fanfare** (1-2 seconds) when confetti bursts

### Next Unit Preview Content
- Preview depth: **just the unit name** — "Unit 3: E3 to G3 Unlocked!" — simple announcement, builds curiosity
- Visual: **mini trail snippet** showing the next few nodes on the path as a visual teaser
- CTA: **"Start next node"** — jumps directly into the first exercise of the newly unlocked unit
- Final boss edge case: **path complete message** — "You've mastered all Treble Clef notes!" (no redirect to another path)

### Dismissal & Pacing
- Tap target: **explicit Continue button** at bottom of each stage — clear, intentional advancement
- Button delay: **~1 second delay** before Continue button appears — prevents accidental double-taps, gives time to absorb
- Auto-dismiss fallback: **yes** — after timeout per stage, auto-advance to prevent getting stuck (for distracted children)
- Reduced motion: **collapse to single summary screen** — "Boss Cleared! Unit X Unlocked" with CTA button, no stages

### Claude's Discretion
- Whether boss modal layers after VictoryScreen or replaces it entirely
- Exact auto-dismiss timeout duration (reasonable for 8-year-old attention span)
- Fanfare sound implementation approach (bundled audio file vs Web Audio API)
- Mini trail snippet visual design and how many nodes to show
- Exact confetti particle count and duration calibration
- Boss node transformation animation specifics (crown glow, badge style)

</decisions>

<specifics>
## Specific Ideas

- Music symbol particles: literal note shapes (quarter note, eighth note, treble clef) not abstract shapes
- Gold/amber/white color palette for boss confetti — matches the crown/trophy boss icon theme from Phase 14
- "Boss Defeated!" style headline in Stage 1 — game-like, not educational-sounding
- Continue button with short delay prevents 8-year-olds from accidentally mashing through the celebration
- Mini trail snippet in preview gives a visual taste of what's coming without overwhelming detail
- Path complete message for final bosses celebrates the journey — "You've mastered all Treble Clef notes!"
- Reduced motion users get a single, clean summary instead of a watered-down 3-stage sequence

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-boss-unlock-celebrations*
*Context gathered: 2026-02-09*
