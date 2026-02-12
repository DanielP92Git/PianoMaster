# Phase 10: Rhythm Implementation - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

42 rhythm nodes (updated from 35) teaching duration-based progression from quarter notes through sixteenth notes, organized in 6 units (updated from 5 to accommodate dedicated rests unit). Uses existing MetronomeTrainer listen-and-repeat game. Does NOT include new game mechanics, UI changes to trail, or rhythm notation display.

</domain>

<decisions>
## Implementation Decisions

### Duration Progression
- Unit 1: Quarter notes + half notes (steady beat foundation)
- Unit 2: Add whole notes to complete basic durations
- Unit 3: Introduce eighth notes (after basic durations solidified)
- Unit 4: Dedicated rests unit (all rest types with learned durations)
- Unit 5: Add dotted notes (dotted half, dotted quarter) after whole/half/quarter established
- Unit 6: Sixteenth notes (most advanced, final unit)
- Ties deferred to future phase — not needed for listen-repeat game

### Pattern Complexity
- Pattern length: Start with 4 beats, grow to 8 beats in later units
- Duration mixing: Progressive — start with 2 types, later Mix-Up nodes can have 3+
- No syncopation — all beats on strong/predictable positions (too advanced for 8-year-olds)
- Speed nodes: Fixed fast tempo per unit (not progressive within node)
- Boss patterns: Both longer (8 beats) AND more duration mixing
- Pickup notes (anacrusis): Only in Units 5-6
- Pattern repetition allowed within nodes for reinforcement
- Patterns starting with rests: Only in Units 5-6
- Time signature: 4/4 throughout Units 1-4, introduce 3/4 in Units 5-6
- 3/4 time: Dedicated nodes (Discovery/Practice specifically for 3/4)
- Single pitch (Middle C / C4) for all rhythm patterns — pure rhythm focus

### Unit Structure
- 6 units total with 7 nodes each (42 nodes total)
- Same node type sequence as treble/bass: Discovery → Practice → Mix-Up → Speed → Boss
- XP rewards: Increasing per unit (later = harder = more reward)
- Rests unit placement: After eighths (Unit 4), before dotted notes

### Pedagogical Scaffolding
- Discovery nodes: Audio demonstration first, then child repeats
- Dotted notes: Introduced after whole/half/quarter are practiced (Unit 5)
- Error handling: Retry same difficulty (no adaptive scaffolding)

### Claude's Discretion
- Exact BPM ranges per unit for Speed nodes
- Specific pattern variations within constraints
- Node naming conventions
- Exercise count per node

</decisions>

<specifics>
## Specific Ideas

- Future rhythm notation game planned (visual patterns instead of listen-repeat) — current implementation should use data structures that can support visual rendering later
- Rests as dedicated learning unit rather than sprinkled throughout — treats silence as its own skill

</specifics>

<deferred>
## Deferred Ideas

- Rhythm notation display game (visual patterns) — future phase
- Ties (connecting notes) — future phase
- Syncopation patterns — future phase (too advanced for 8-year-olds)
- Compound time signatures beyond 3/4 — future phase

</deferred>

---

*Phase: 10-rhythm-implementation*
*Context gathered: 2026-02-04*
