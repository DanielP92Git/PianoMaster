# Phase 20: Curriculum Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 20-Curriculum Audit
**Areas discussed:** Audit output format, Game-type policy gaps, "One concept" definition, Kodaly ordering flags

---

## Audit Output Format

| Option                        | Description                                            | Selected |
| ----------------------------- | ------------------------------------------------------ | -------- |
| Node table + remediation list | Markdown table per unit + separate remediation section | ✓        |
| Structured JSON               | Machine-readable JSON per node                         |          |
| Narrative with inline tables  | Unit-by-unit narrative with embedded tables            |          |

**User's choice:** Node table + remediation list
**Notes:** None

| Option               | Description                              | Selected |
| -------------------- | ---------------------------------------- | -------- |
| By unit (8 sections) | Maps directly to the 8 unit source files | ✓        |
| One flat table       | Single table of all 48 nodes             |          |

**User's choice:** By unit
**Notes:** None

---

## Game-Type Policy Gaps

### MIX_UP nodes

| Option              | Description                                       | Selected |
| ------------------- | ------------------------------------------------- | -------- |
| RhythmDictationGame | "Hear it, write it" — variety from visual reading | ✓        |
| ArcadeRhythmGame    | Gamified scrolling — overlaps with Speed/Boss     |          |
| Keep current game   | Flag individually in audit                        |          |

**User's choice:** RhythmDictationGame
**Notes:** None

### REVIEW and CHALLENGE nodes

| Option                                          | Description                                            | Selected |
| ----------------------------------------------- | ------------------------------------------------------ | -------- |
| Same as Practice — MetronomeTrainer             | Echo game for both, differentiated by difficulty knobs | ✓        |
| RhythmReadingGame for both                      | Visual reading — distinct from Practice                |          |
| Review=MetronomeTrainer, Challenge=ArcadeRhythm | Split approach                                         |          |

**User's choice:** MetronomeTrainer for both
**Notes:** None

### MINI_BOSS nodes

| Option                               | Description                                    | Selected |
| ------------------------------------ | ---------------------------------------------- | -------- |
| ArcadeRhythmGame                     | Same as Speed/Boss                             |          |
| RhythmReadingGame                    | Visual reading checkpoint — distinct from Boss | ✓        |
| MetronomeTrainer with strict scoring | Echo game with tighter thresholds              |          |

**User's choice:** RhythmReadingGame
**Notes:** Differentiates MINI_BOSS from full BOSS experience

---

## "One Concept" Definition

| Option                      | Description                                          | Selected |
| --------------------------- | ---------------------------------------------------- | -------- |
| One new duration value only | Strictest: each duration/rest/dot is its own concept | ✓        |
| One new "family" of content | Moderate: related sub-elements grouped               |          |
| One new visual element      | Loosest: similar-looking elements grouped            |          |

**User's choice:** One new duration value only (strictest)
**Notes:** None

### Time signature as concept

| Option                   | Description                                            | Selected |
| ------------------------ | ------------------------------------------------------ | -------- |
| Own concept              | 3/4 is a separate Discovery node with no new durations | ✓        |
| Can pair with a duration | Time sig + simple duration together                    |          |

**User's choice:** Own concept
**Notes:** Research had flagged Unit 5 for introducing dotted notes AND 3/4 simultaneously

---

## Kodaly Ordering Flags

| Option                          | Description                                                                      | Selected |
| ------------------------------- | -------------------------------------------------------------------------------- | -------- |
| Flag but don't remediate        | Audit table gets Kodaly violation column, remediation list excludes resequencing | ✓        |
| Don't flag at all               | Strictly scoped to CURR-01 through CURR-04                                       |          |
| Flag and include in remediation | Full remediation including resequencing                                          |          |

**User's choice:** Flag but don't remediate
**Notes:** None

### Expected Kodaly order

| Option         | Description                                                             | Selected |
| -------------- | ----------------------------------------------------------------------- | -------- |
| Research order | quarter → eighth → half → whole → rests → dotted → sixteenth → compound |          |
| Custom order   | User-specified                                                          | ✓        |

**User's choice:** Custom order: quarter → half → whole → eighth → rests → dotted → sixteenth → compound
**Notes:** User moved half and whole before eighth compared to standard Kodaly order

---

## Claude's Discretion

- Exact markdown formatting and column widths
- Violation description phrasing
- Summary statistics inclusion
- Unit-level summary content

## Deferred Ideas

- CURR-F01 Kodaly duration reorder — future milestone
- Node order immutability and progress migration — out of scope for v3.2
