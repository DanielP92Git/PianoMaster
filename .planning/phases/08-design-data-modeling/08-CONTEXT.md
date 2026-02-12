# Phase 8: Design & Data Modeling - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish validation infrastructure and document pedagogy decisions before implementing bass/rhythm nodes. This phase creates the foundation that Phases 9-12 build upon — no actual node implementation happens here.

</domain>

<decisions>
## Implementation Decisions

### Validation Behavior
- Validation runs automatically as part of `npm run build` — can't be skipped
- Validates: prerequisite chains, node types, XP totals, and exercise configs
- Comprehensive validation catches issues before deploy

### Progress Reset Strategy
- **All trail progress can be reset** — no complex migration needed
- **XP totals reset to zero** for all users alongside trail progress
- This is a fresh start: simplifies cutover significantly
- No legacy ID mapping migration script required

### XP Economy
- **Equal total XP per path** — treble, bass, rhythm each offer the same total XP
- **Boss nodes award 2-3x more XP** than regular nodes — major milestone celebration
- XP distribution designed so completing all three paths reaches high levels

### Pedagogy Documentation
- Document **node type purposes**: what Discovery, Practice, Mix-Up, Speed, Boss nodes each accomplish
- Document **note introduction order**: rationale for why notes appear in specific sequence
- **Rhythm progression**: Quarter → Half → Whole → Eighth (start with beat, expand to longer/shorter)
- **Bass clef mirrors treble exactly**: same pedagogical sequence (C4→B3→A3→G3→F3→E3→D3→C3)

### Claude's Discretion
- Validation error verbosity and formatting
- Whether validation fails build or warns (decide what's most suitable)
- Pedagogy documentation location (`.planning/`, `src/data/`, or `docs/`)
- Specific XP totals per path given level thresholds
- Legacy ID mapping approach (in-node field vs separate file) — simplified by reset decision

</decisions>

<specifics>
## Specific Ideas

- Validation should feel helpful to developers, not obstructive
- Pedagogy docs serve both Claude agents (for research/planning) and human developers (for understanding design rationale)
- The "fresh start" approach was chosen deliberately — simplifies technical complexity significantly

</specifics>

<deferred>
## Deferred Ideas

- **XP vs Points consolidation** — Currently both concepts exist in the app which may confuse users. This is a UX change that belongs in its own phase after v1.3 trail redesign is complete.

</deferred>

---

*Phase: 08-design-data-modeling*
*Context gathered: 2026-02-03*
