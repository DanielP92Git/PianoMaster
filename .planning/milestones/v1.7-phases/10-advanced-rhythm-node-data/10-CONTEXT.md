# Phase 10: Advanced Rhythm Node Data - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Create trail node data files for two new rhythm units: Rhythm Unit 7 (6/8 compound meter) and Rhythm Unit 8 (syncopation in 4/4). This is node data authoring only — no game engine changes, no UI changes, no integration wiring (Phase 11 handles expandedNodes.js, gate, and i18n).

Phase 09 already fixed the 6/8 beat model (`SIX_EIGHT.beats=2, subdivisions:6`) and compound beam grouping (`beamGroupsForTimeSignature`). The rhythm generator and MetronomeTrainer support `timeSignature: '6/8'`. This phase authors the node definitions that use that infrastructure.

</domain>

<decisions>
## Implementation Decisions

### 6/8 Unit Structure (Rhythm Unit 7)
- 7 nodes following the standard pattern: Discovery → Practice → Discovery (mix) → Practice → Mix-Up → Speed → Mini-Boss
- Mini-Boss (not true Boss) at end of Unit 7 — the true Boss is saved for Unit 8's combined challenge
- Gradual duration progression: dotted-quarter only → add quarters → add eighths → all 6/8 durations mixed
- Tempo range: slow start at 60-70 BPM, ramp to 80-90 BPM by Mini-Boss
- Unit starts after `boss_rhythm_6` (order 142+), prerequisite: `boss_rhythm_6`

### Syncopation Unit Structure (Rhythm Unit 8)
- 7 nodes following the same standard pattern, ending with the TRUE Boss (trail milestone)
- All syncopation nodes in 4/4 time signature
- Two syncopation patterns: eighth-quarter-eighth and dotted quarter-eighth
- One pattern per discovery node: Node 1 introduces eighth-quarter-eighth, Node 3 introduces dotted quarter-eighth
- Tempo range: slower start 65-85 BPM (syncopation is cognitively harder even in 4/4)
- True Boss at end is the capstone of the entire advanced rhythm section

### Discovery Node Teaching
- 6/8 discovery node uses slower intro exercise: very slow tempo (55-60 BPM), only dotted-quarter notes, 1 measure per pattern — child physically feels "two big beats" before adding complexity
- 6/8 newContentDescription: "6/8 Time: Two big beats per bar"
- Syncopation discovery newContentDescription: "Syncopation: Tap between the beats!"
- No new UI or tutorial overlay needed — existing discovery node mechanics + newContentDescription text are sufficient

### Boss Challenge Design
- Final boss mixes 6/8 compound AND 4/4 syncopation — Claude's discretion on exercise sequence design (multi-exercise boss with separate 6/8 and syncopation exercises, or a 3-exercise format)
- 15 questions total (hardest boss, matching boss_rhythm_6 length)
- 250 XP reward (new highest in rhythm path — capstone of ALL rhythm content)
- `accessoryUnlock: 'advanced_rhythm_badge'` or similar

### Claude's Discretion
- Boss exercise sequence design (how to split 6/8 vs syncopation exercises)
- Exact duration combinations at each node
- Node names and descriptions (age-appropriate, encouraging for 8-year-olds)
- `focusDurations` vs `contextDurations` splits at each node
- `patterns` array values at each node
- Whether to include a Review node type in either unit
- XP rewards for non-boss nodes (follow existing 75-90 range)
- `measuresPerPattern` at each node

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Trail node authoring pattern
- `src/data/units/rhythmUnit6Redesigned.js` — Most recent rhythm unit; follow this exact structure for field names, imports, and node shape
- `src/data/nodeTypes.js` — NODE_TYPES (DISCOVERY, PRACTICE, MIX_UP, SPEED_ROUND, MINI_BOSS, BOSS), RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES
- `src/data/constants.js` — EXERCISE_TYPES.RHYTHM, NODE_CATEGORIES

### Rhythm generator & time signature support
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — TIME_SIGNATURES.SIX_EIGHT definition (beats:2, subdivisions:6), difficulty levels with maxSyncopation, duration vocabularies
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — Consumes rhythmConfig from node data; supports `timeSignature: '6/8'`

### Integration context (Phase 11, not this phase)
- `src/data/expandedNodes.js` — Where new unit files will be wired in (Phase 11)
- `src/data/skillTrail.js` — UNITS metadata that needs RHYTHM_7 and RHYTHM_8 entries (Phase 11)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `rhythmUnit6Redesigned.js`: Template for node structure — all fields, imports, patterns, XP values
- `NODE_TYPES` from `nodeTypes.js`: DISCOVERY, PRACTICE, MIX_UP, SPEED_ROUND, CHALLENGE, MINI_BOSS, BOSS
- `RHYTHM_COMPLEXITY` levels: SIMPLE, MEDIUM, VARIED, ALL
- `NEW_CONTENT_TYPES`: RHYTHM, EXERCISE_TYPE, CHALLENGE_TYPE, NONE

### Established Patterns
- Each rhythm unit file exports a named array (e.g., `rhythmUnit7Nodes`) and a default export
- Node IDs follow `rhythm_{unit}_{orderInUnit}` pattern, boss IDs follow `boss_rhythm_{unit}`
- `rhythmConfig` contains: complexity, durations, focusDurations, contextDurations, patterns, tempo, pitch, timeSignature
- All rhythm nodes use `pitch: 'C4'` (single pitch for pure rhythm focus)
- `START_ORDER` calculated from previous unit's end position

### Integration Points
- Unit 7 prerequisite: `boss_rhythm_6` (last node of Unit 6, order 141)
- Unit 8 prerequisite: `boss_rhythm_7` (last node of Unit 7)
- Unit 7 START_ORDER = 142 (after Unit 6's 7 nodes: 135+6=141)
- Unit 8 START_ORDER = 149 (after Unit 7's 7 nodes: 142+6=148)

</code_context>

<specifics>
## Specific Ideas

- 6/8 discovery should be very gentle — slow tempo, only dotted-quarter notes, 1 measure per pattern, so the child physically feels the "1-2-3, 1-2-3" compound beat
- Syncopation patterns should feel surprising and fun — "Tap between the beats!" captures the playful spirit
- Final boss is the capstone of the ENTIRE rhythm learning journey (Units 1-8) — should feel epic with 250 XP and 15 questions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-advanced-rhythm-node-data*
*Context gathered: 2026-03-19*
