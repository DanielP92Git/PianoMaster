# Phase 9: Bass Clef Implementation - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

26 bass clef nodes across 3 units covering C4 through C3, following the treble pedagogy pattern (Discovery, Practice, Mix-Up, Speed, Boss). Each unit has 6-8 nodes with minimum 3 node types for engagement variety. Users must 3-star Boss nodes to unlock subsequent units.

</domain>

<decisions>
## Implementation Decisions

### Note Introduction Pacing
- Discovery 1: Introduces C4 + B3 together
- Discovery 2: Adds A3 (cumulative: C4, B3, A3)
- Discovery 3: Adds G3 + F3 (completes five-finger position)
- Discovery 4: Adds E3, D3, C3 (completes full octave)
- Practice nodes use ALL previously learned notes (cumulative review)
- Bass clef units use bass notes only (no treble mixing)
- Mix-Up nodes allow occasional repeated notes (same note twice in a row is fine)

### Visual/Audio Feedback
- Full keyboard visible during exercises, bass range highlighted
- Same visual style as treble exercises (only clef changes, no color distinction)
- Incorrect answers show correct note on BOTH staff AND keyboard
- Bass notes play at actual pitch (C3 plays as C3, not shifted up)

### Node Difficulty Curve
- Speed nodes increase tempo only (same note pool, faster response time)
- Boss nodes test all unit notes at faster tempo (cumulative mastery check)
- Star thresholds consistent everywhere: 60%/80%/95% for 1/2/3 stars
- 3 stars required on Boss nodes to unlock next unit

### Exercise Variety per Unit
- Flexible node distribution (not fixed 5-type sequence)
- Minimum 3 node types per unit (Discovery + Practice + at least one other)
- Every unit ends with a Boss node (consistent milestone markers)
- 6-8 nodes per unit (~30-45 min completion time)

### Claude's Discretion
- Exact node count per unit (within 6-8 range)
- Which node types beyond minimum 3 per unit
- Tempo values for Speed and Boss nodes
- Exercise count per node (10 is standard)

</decisions>

<specifics>
## Specific Ideas

- Note groupings mirror natural piano hand positions (five-finger position in Unit 2)
- Boss as cumulative speed test reinforces automaticity before progression
- Cumulative practice ensures no note is forgotten as learner advances

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-bass-clef-implementation*
*Context gathered: 2026-02-03*
