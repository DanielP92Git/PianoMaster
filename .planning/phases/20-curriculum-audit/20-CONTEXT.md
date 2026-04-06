# Phase 20: Curriculum Audit - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit all 48 rhythm nodes across 8 unit files and lock game-type policy before any source files are modified. Output is a committed reference document that Phase 22 implementation follows exactly. No code changes in this phase.

</domain>

<decisions>
## Implementation Decisions

### Audit output format

- **D-01:** Markdown document organized by unit (8 sections matching the 8 unit files), each section containing a node table with one row per node
- **D-02:** Node table columns: Node ID, Name, Node Type, Current Game, Introduced Concept, Violations (concept/game-type), Kodaly Order Flag
- **D-03:** Separate remediation section listing every fix needed — covers game-type and concept violations only (not Kodaly resequencing)

### Game-type policy (complete mapping)

- **D-04:** Discovery nodes → RhythmReadingGame or RhythmDictationGame (notation-showing game) [CURR-02]
- **D-05:** Practice nodes → MetronomeTrainer (echo/call-response game) [CURR-03]
- **D-06:** MIX_UP nodes → RhythmDictationGame ("hear it, write it" — variety from visual reading)
- **D-07:** REVIEW nodes → MetronomeTrainer (reinforce with echo game, differentiated by difficulty knobs)
- **D-08:** CHALLENGE nodes → MetronomeTrainer (harder echo game — tempo/pattern length increase)
- **D-09:** SPEED_ROUND nodes → ArcadeRhythmGame [CURR-04]
- **D-10:** MINI_BOSS nodes → RhythmReadingGame (visual reading checkpoint — distinct from full Boss)
- **D-11:** BOSS nodes → ArcadeRhythmGame [CURR-04]

### "One concept" definition

- **D-12:** One concept = one new duration value (e.g. half note, eighth note, quarter rest). Each is its own concept.
- **D-13:** Time signature changes (e.g. 4/4 → 3/4) count as their own concept — cannot pair with a new duration introduction
- **D-14:** Any node introducing two or more new elements (duration + duration, duration + time signature) is a violation of CURR-01

### Kodaly ordering flags

- **D-15:** Audit table includes a Kodaly order violation column — flags nodes that introduce durations out of the expected pedagogical sequence
- **D-16:** Expected Kodaly order: quarter → half → whole → eighth → rests → dotted → sixteenth → compound
- **D-17:** Kodaly ordering violations are flagged for visibility only — the remediation list does NOT include resequencing fixes (CURR-F01 is deferred to future milestone)

### Claude's Discretion

- Exact markdown formatting and column widths of the audit tables
- How to phrase violation descriptions (brief codes vs prose)
- Whether to include a summary statistics section (total violations by type)
- Unit-level summary paragraph content

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rhythm trail data

- `src/data/units/rhythmUnit1Redesigned.js` — Unit 1 node definitions (6 nodes)
- `src/data/units/rhythmUnit2Redesigned.js` — Unit 2 node definitions (6 nodes)
- `src/data/units/rhythmUnit3Redesigned.js` — Unit 3 node definitions (6 nodes)
- `src/data/units/rhythmUnit4Redesigned.js` — Unit 4 node definitions (6 nodes)
- `src/data/units/rhythmUnit5Redesigned.js` — Unit 5 node definitions (6 nodes)
- `src/data/units/rhythmUnit6Redesigned.js` — Unit 6 node definitions (6 nodes)
- `src/data/units/rhythmUnit7Redesigned.js` — Unit 7 node definitions (6 nodes)
- `src/data/units/rhythmUnit8Redesigned.js` — Unit 8 node definitions (6 nodes)

### Node type system

- `src/data/nodeTypes.js` — NODE_TYPES enum and NODE_TYPE_METADATA (8 types)
- `src/data/constants.js` — EXERCISE_TYPES enum (maps to game components)

### Game components (for verifying current game-type assignments)

- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — Echo/tap game
- `src/components/games/rhythm-games/RhythmReadingGame.jsx` — Notation reading game
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` — Hear-and-tap-back game
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — Scrolling arcade game

### Milestone research

- `.planning/research/SUMMARY.md` — v3.2 research summary with architecture approach and pitfalls

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `RhythmPatternGenerator.js`: Current pattern generation logic — audit should note which nodes rely on `rhythmPatterns` duration allowlists vs any other config
- `scripts/validateTrail.mjs`: Build-time validator — understands node structure, could inform audit tooling

### Established Patterns

- Each unit file exports a named array (e.g. `rhythmUnit1Nodes`) with consistent node object structure
- Every node has `nodeType`, `rhythmConfig.durations`, `rhythmConfig.focusDurations`, `exercises[].type`, and `exercises[].config.rhythmPatterns`
- `focusDurations` indicates newly introduced durations; `contextDurations` indicates previously learned ones

### Integration Points

- Audit output feeds directly into Phase 22 (Service Layer & Trail Wiring) as the implementation blueprint
- Node `order` values are immutable for nodes with live user progress — audit must document current values without changing them

</code_context>

<specifics>
## Specific Ideas

- Custom Kodaly order differs from standard: quarter → half → whole → eighth (not quarter → eighth → half → whole). Half and whole come before eighth notes.
- The "50 nodes" figure in the roadmap is approximate — actual count is 48 (6 per unit x 8 units)

</specifics>

<deferred>
## Deferred Ideas

- **CURR-F01 Kodaly duration reorder** — Full node resequencing to match Kodaly order. Deferred to future milestone. Phase 20 flags violations but does not remediate.
- **Node order immutability** — If resequencing is ever done, need progress migration strategy first. Out of scope for v3.2.

</deferred>

---

_Phase: 20-curriculum-audit_
_Context gathered: 2026-04-06_
