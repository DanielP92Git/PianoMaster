# Phase 20: Curriculum Audit - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit all 56 rhythm nodes (8 units x 7 nodes) and produce a reference document that locks all pedagogical decisions before any code is modified. The output is a node-by-node remediation table that Phase 22 implementation follows exactly.

</domain>

<decisions>
## Implementation Decisions

### Audit Output Format

- **D-01:** Node-by-node table with 56 rows. Columns: Node ID, Name, nodeType, Current Exercises, Concept Introduced, Violations, Remediation.
- **D-02:** The audit document is committed as a reference that Phase 22 follows exactly — it is the single source of truth for what changes.

### Game-Type Policy (Node Type → Exercise Type)

- **D-03:** Discovery → `mixed_lesson` (notation-weighted: more rhythm_dictation cards, fewer visual_recognition/syllable_matching)
- **D-04:** Practice → `mixed_lesson`
- **D-05:** MIX_UP → `mixed_lesson`
- **D-06:** REVIEW → `mixed_lesson`
- **D-07:** CHALLENGE → `arcade_rhythm`
- **D-08:** SPEED_ROUND → `arcade_rhythm`
- **D-09:** MINI_BOSS → `mixed_lesson` (longer session covering all unit concepts)
- **D-10:** BOSS → `arcade_rhythm`
- **D-11:** Summary: mixed_lesson for Discovery/Practice/MIX_UP/REVIEW/MINI_BOSS. arcade_rhythm for CHALLENGE/SPEED_ROUND/BOSS.

### Mixed Lesson Scope

- **D-12:** Expand mixed_lesson to ALL eligible node types (Discovery, Practice, MIX_UP, REVIEW, MINI_BOSS). Not limited to current Unit 1 nodes.
- **D-13:** Only SPEED_ROUND, CHALLENGE, and BOSS nodes stay as single-game arcade_rhythm exercises.
- **D-14:** Discovery nodes use mixed_lesson weighted toward notation-showing questions (rhythm_dictation cards), but still include visual_recognition and syllable_matching for variety.

### One-Concept Rule

- **D-15:** Musical concept = new duration value OR new time signature. Only musical concepts count.
- **D-16:** Game mode changes do NOT count as a concept. Introducing a child to arcade mode on the same node as a new duration is acceptable.
- **D-17:** Strict enforcement on musical concepts: a node that introduces both "half note" and "quarter rest" is a violation.

### Claude's Discretion

- The specific question mix ratios within mixed_lesson nodes (e.g., 60% notation, 20% visual, 20% syllable for Discovery) — Claude can determine appropriate weights per node during the audit.
- Whether to include brief narrative notes per unit explaining the pedagogical flow alongside the table.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rhythm Node Data

- `src/data/units/rhythmUnit1Redesigned.js` through `rhythmUnit8Redesigned.js` — All 56 rhythm node definitions with current exercise configs
- `src/data/nodeTypes.js` — NODE_TYPES enum (DISCOVERY, PRACTICE, MIX_UP, SPEED_ROUND, REVIEW, CHALLENGE, MINI_BOSS, BOSS) and metadata
- `src/data/constants.js` — EXERCISE_TYPES enum (rhythm, rhythm_tap, rhythm_dictation, arcade_rhythm, visual_recognition, syllable_matching, mixed_lesson)

### Requirements

- `.planning/REQUIREMENTS.md` — CURR-01 through CURR-04 define the audit's acceptance criteria
- `.planning/ROADMAP.md` — Phase 20 success criteria (4 criteria that must be TRUE)

### Phase 25 Reference (Mixed Lesson Engine)

- `src/components/games/rhythm-games/MixedLessonGame.jsx` — The mixed lesson engine implementation
- `src/components/games/rhythm-games/renderers/` — Available question type renderers (RhythmTapQuestion, VisualRecognitionQuestion, SyllableMatchingQuestion)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Mixed lesson engine (Phase 25) is production-ready and handles interleaved question types
- Three renderers available: RhythmTapQuestion, VisualRecognitionQuestion, SyllableMatchingQuestion
- ArcadeRhythmGame exists for speed/challenge/boss nodes

### Established Patterns

- Each unit file exports an array of 7 node objects with `exercises` arrays
- Nodes use `nodeType` from NODE_TYPES and `exercises[].type` from EXERCISE_TYPES
- Phase 25 already converted rhythm_1_1 through rhythm_1_3 to mixed_lesson format

### Integration Points

- Build validator (`scripts/validateTrail.mjs`) checks exercise types at build time
- TrailNodeModal reads exercise type to route to correct game component
- The audit output will drive changes to all 8 rhythmUnit files in Phase 22

</code_context>

<specifics>
## Specific Ideas

- Discovery mixed lessons should be notation-weighted (more rhythm_dictation-style questions than visual/syllable)
- MINI_BOSS as mixed_lesson (not arcade) — user prefers the "covering all unit concepts" review style over arcade pressure for unit checkpoints

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 20-curriculum-audit_
_Context gathered: 2026-04-11_
