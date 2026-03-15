# Phase 03: Bass Accidentals Content - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Author bass clef accidental content: a sharps unit (F#3, C#3, G#3), a flats unit (Bb3, Eb3, Ab3, Db3), and a boss challenge node mixing all 7 bass accidentals. Also rework treble Units 4+5 to follow the same "different accidental each node" approach — delete trebleUnit4Redesigned.js and trebleUnit5Redesigned.js, re-author with 3 sharps (F#4, C#4, G#4) and 4 flats (Bb4, Eb4, Ab4, Db4).

</domain>

<decisions>
## Implementation Decisions

### Pedagogical approach (all accidental units)
- Each node introduces a **different** accidental — NOT the same 2 notes across the whole unit
- One accidental per discovery node, with nearest-neighbor naturals as context
- Start from small note pools (3 notes), slow build to full range
- Separate sharps and flats units (not mixed)

### Bass sharps unit
- 3 sharps: F#3, C#3, G#3
- Starting pool: BCA (B3, C4, A3), expand gradually — 3 notes + 1 sharp → 5 notes + 1 sharp → 5 notes + 2nd sharp → etc.
- SIGHT_READING is safe for sharps (mic outputs F#3/C#3/G#3 matching exactly)
- All 4 game modes: Note Recognition, Sight Reading, Memory Game, Speed Round

### Bass flats unit
- 4 flats: Bb3, Eb3, Ab3, Db3 (circle-of-fifths flat progression)
- Starting pool: BCA (B3, C4, A3), same slow expansion pace as sharps
- SIGHT_READING **NOT safe** for regular practice nodes — mic outputs G#3 not Ab3, C#3 not Db3, A#3 not Bb3, D#3 not Eb3
- Regular nodes use NOTE_RECOGNITION only (same constraint as treble flats in Phase 02)
- Boss nodes may include SIGHT_READING — inert until Phase 04 wires them into expandedNodes.js

### Bass boss node
- Mixes all 7 bass accidentals (F#3, C#3, G#3, Bb3, Eb3, Ab3, Db3) + full natural range
- 2 exercises: Note Recognition + Sight Reading (inert until Phase 04)
- category: 'boss', isBoss: true

### Treble rework (added to Phase 03 scope)
- Delete existing trebleUnit4Redesigned.js and trebleUnit5Redesigned.js
- Re-author with same "different accidental each node" approach:
  - Treble sharps unit: F#4, C#4, G#4 (3 sharps)
  - Treble flats unit: Bb4, Eb4, Ab4, Db4 (4 flats)
  - Starting pool: CDE (C4, D4, E4), same slow build
  - Same SIGHT_READING constraints (safe for sharps, NOT for flats regular nodes)
- Treble boss: mixes all 7 treble accidentals + full C4-C5 natural octave

### Claude's Discretion
- Exact node count per unit (6-9 range, flats may need more for 4 accidentals at slow pace)
- Node type sequence (Discovery, Practice, Mix-Up, Speed, Boss)
- Which accidental appears on which node
- XP reward values per node (existing range: 45-70 per node, 150-200 for boss)
- Note pool composition at each expansion step
- rhythmConfig settings per node
- questionCount per exercise
- Kid-friendly unit and node naming

</decisions>

<specifics>
## Specific Ideas

- Starting pool for bass is BCA (B3, C4, A3) — chosen by user as central bass range notes
- Starting pool for treble is CDE (C4, D4, E4) — first notes learned on treble trail
- "Each exercise will have a sharp on a random note" — variety is the goal, not drilling fixed pairs
- Slow build pacing: 3 notes → add 1 accidental → expand → add next accidental → expand

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bassUnit3Redesigned.js`: Template for bass unit structure. START_ORDER=66, 10 nodes (order 66-75). Bass Unit 4 starts at 76.
- `trebleUnit4Redesigned.js` / `trebleUnit5Redesigned.js`: Will be **deleted and re-authored** — not used as templates
- `trebleUnit3Redesigned.js`: Reference for treble unit structure. Ends at order 26. Treble Unit 4 starts at 27 (same as current).
- `nodeTypes.js`: NODE_TYPES (DISCOVERY, PRACTICE, MIX_UP, SPEED_ROUND, CHALLENGE, BOSS), RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES
- `constants.js`: EXERCISE_TYPES (NOTE_RECOGNITION, SIGHT_READING, MEMORY_GAME, BOSS_CHALLENGE)

### Established Patterns
- Boss nodes use `category: 'boss'` string literal, `isBoss: true`
- Boss nodes have multi-exercise arrays (NR + SR)
- noteConfig includes `accidentals: true` for accidental units
- Prerequisites chain linearly within a unit; boss prerequisite is the last regular node
- Unit 3 boss (`boss_bass_3`) is the prerequisite for the first node of Unit 4
- Unit 3 boss (`boss_treble_3`) is the prerequisite for treble Unit 4 (unchanged)

### Integration Points
- New bass unit files: `src/data/units/bassUnit4Redesigned.js`, `bassUnit5Redesigned.js`
- Reworked treble files: `src/data/units/trebleUnit4Redesigned.js`, `trebleUnit5Redesigned.js`
- expandedNodes.js aggregation and subscription gate: Phase 04

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Treble rework was folded into this phase by explicit user decision.

</deferred>

---

*Phase: 03-bass-accidentals-content*
*Context gathered: 2026-03-15*
