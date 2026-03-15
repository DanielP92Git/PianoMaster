# Phase 02: Treble Accidentals Content - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Author treble clef accidental content: a sharps unit (F#4, C#4), a flats unit (Bb4, Eb4), and a boss challenge node covering all 4 treble accidentals. Pure content authoring following established unit file patterns — no new game mechanics, no new exercise types, no UI changes.

</domain>

<decisions>
## Implementation Decisions

### Node count & structure
- Medium unit size (6-7 nodes per unit) — enough variety without dragging out 2 new notes; Claude picks exact count based on reward psychology and forward momentum
- One Discovery node per new note (not both together) — one concept at a time for 8-year-olds encountering accidentals for the first time
- All 4 game modes used: Note Recognition, Sight Reading, Memory Game, Speed Round — same engagement variety as natural-note units
- Boss node has 2 exercises: Note Recognition + Sight Reading — matches existing boss_treble_3 pattern

### Context note pairing
- Discovery nodes use nearest neighbor naturals as context (F#4 with F4+G4; C#4 with C4+D4; Bb4 with A4+B4; Eb4 with D4+E4)
- Gradual pool expansion after discovery: first practice just the 2 new accidentals together, then add 3-4 naturals, then full octave + accidentals in final nodes
- Flats unit does NOT reference sharps — keeps learning independent, no mixing sharps and flats while learning
- Boss node mixes all 4 accidentals (F#4, C#4, Bb4, Eb4) with the full C4-C5 natural octave (~12 note pool)

### Claude's Discretion
- Exact node count per unit (6 or 7) based on pedagogical flow
- Node type sequence (which node types in which order — Discovery, Practice, Mix-Up, Speed, Challenge)
- XP reward values per node (existing range: 45-70 per node, 150 for boss)
- Unit and node naming (kid-friendly names for 8-year-olds)
- Exact note pool composition at each gradual expansion step
- rhythmConfig settings per node (complexity, durations, tempo)
- questionCount per exercise

</decisions>

<specifics>
## Specific Ideas

No specific requirements — follow established trebleUnit1-3 patterns for structure, naming conventions, and config shape. The roadmap success criteria define the expected output precisely.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `trebleUnit3Redesigned.js`: Template for unit file structure — copy and adapt for trebleUnit4 (sharps) and trebleUnit5 (flats)
- `nodeTypes.js`: NODE_TYPES (DISCOVERY, PRACTICE, MIX_UP, SPEED_ROUND, CHALLENGE, BOSS), RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES
- `constants.js`: EXERCISE_TYPES (NOTE_RECOGNITION, SIGHT_READING, MEMORY_GAME, BOSS_CHALLENGE)
- `expandedNodes.js`: Aggregator that imports all unit files — new units must be added here (Phase 04)

### Established Patterns
- START_ORDER: Unit 3 starts at 17 with 10 nodes (ending at order 26). Unit 4 should start at 27.
- Boss nodes use `category: 'boss'` (not `treble_clef`), `id: 'boss_treble_N'`
- Boss nodes use `isBoss: true` and have multi-exercise arrays
- noteConfig includes `accidentals: false` for natural units — new units need `accidentals: true`
- Prerequisites chain linearly within a unit; boss prerequisite is the last regular node
- Unit 3 boss (`boss_treble_3`) is the prerequisite for the first node of Unit 4

### Integration Points
- New unit files created in `src/data/units/` (trebleUnit4Redesigned.js, trebleUnit5Redesigned.js)
- Boss node for flats unit is prerequisite for the treble accidentals boss challenge node
- Integration into expandedNodes.js and subscription gate happens in Phase 04

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-treble-accidentals-content*
*Context gathered: 2026-03-15*
