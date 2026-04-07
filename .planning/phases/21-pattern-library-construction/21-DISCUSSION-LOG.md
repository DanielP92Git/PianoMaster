# Phase 21: Pattern Library Construction - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 21-pattern-library-construction
**Areas discussed:** Pattern data structure, Tagging taxonomy, Content coverage strategy, Authoring approach

---

## Scope Decision

| Option                | Description                                            | Selected |
| --------------------- | ------------------------------------------------------ | -------- |
| Match corrected nodes | Write patterns anticipating Phase 22's fixes           | ✓        |
| Match current configs | Write patterns matching what's in the unit files today |          |

**User's choice:** Match corrected nodes
**Notes:** Patterns should be authored for the post-audit state, not the current (broken) state.

---

## Pattern Data Structure

### Internal format

| Option                              | Description                                      | Selected |
| ----------------------------------- | ------------------------------------------------ | -------- |
| VexFlow duration strings            | Array of VexFlow codes like ['q', 'q', 'q', 'q'] | ✓        |
| Note objects with duration + isRest | Array of {duration, isRest} objects              |          |
| Sixteenth-note grid (numeric)       | Array of numbers using DURATION_CONSTANTS        |          |

**User's choice:** VexFlow duration strings

### Rest representation

| Option               | Description                                          | Selected |
| -------------------- | ---------------------------------------------------- | -------- |
| VexFlow rest suffix  | 'qr' for quarter rest, 'hr' for half rest            | ✓        |
| Separate isRest flag | Keep duration strings clean, parallel flag for rests |          |

**User's choice:** VexFlow rest suffix

### Additional metadata

| Option            | Description                           | Selected |
| ----------------- | ------------------------------------- | -------- |
| difficulty level  | beginner/intermediate/advanced filter | ✓        |
| measureCount      | 1, 2, or 4 bars — needed for UX-04    | ✓        |
| description       | Human-readable name                   | ✓        |
| No extra metadata | Just id, beats, tags, timeSignature   |          |

**User's choice:** All three metadata fields included

### Multi-measure storage

| Option                | Description                                | Selected        |
| --------------------- | ------------------------------------------ | --------------- | --- |
| Nested by measure     | beats: [['q','q','q','q'], ['h','q','qr']] | ✓               |
| Flat with bar markers | beats: ['q','q','q','q','                  | ','h','q','qr'] |     |
| Flat derive measures  | Consumer splits by summing durations       |                 |

**User's choice:** Nested by measure

### Single-measure consistency

| Option                            | Description                                | Selected |
| --------------------------------- | ------------------------------------------ | -------- |
| Always nested                     | Even 1-measure: beats: [['q','q','q','q']] | ✓        |
| Flat for single, nested for multi | Mixed format                               |          |

**User's choice:** Always nested for uniform shape

### Difficulty field type

| Option      | Description                              | Selected |
| ----------- | ---------------------------------------- | -------- |
| String enum | 'beginner' / 'intermediate' / 'advanced' | ✓        |
| Numeric 1-5 | Finer granularity                        |          |

**User's choice:** String enum (matches existing DIFFICULTY_LEVELS)

### ID naming convention

| Option                  | Description                          | Selected |
| ----------------------- | ------------------------------------ | -------- |
| Tag prefix + sequential | 'quarter_only_01', 'quarter_half_03' | ✓        |
| Flat sequential         | 'pat_001', 'pat_002'                 |          |

**User's choice:** Tag prefix + sequential

### Time signature field

| Option               | Description                            | Selected |
| -------------------- | -------------------------------------- | -------- |
| Explicit per-pattern | Each pattern has its own timeSignature | ✓        |
| Derived from tag     | Tags imply time signature              |          |

**User's choice:** Explicit per-pattern

### durationSet field

| Option                          | Description                            | Selected |
| ------------------------------- | -------------------------------------- | -------- |
| Explicit durationSet array      | durationSet: ['q', 'h'] for validation | ✓        |
| Derive from beats at build time | Validator extracts unique durations    |          |

**User's choice:** Explicit durationSet array

### Tied notes

**User's choice:** Claude's discretion

### Pickup measures

**User's choice:** Not in Phase 21. Pickup measures are a separate rhythm trail topic for a future milestone. After learning pickups, boss nodes can use pickup patterns.

---

## Tagging Taxonomy

### Tag model (cumulative vs isolated)

| Option                | Description                                     | Selected |
| --------------------- | ----------------------------------------------- | -------- |
| Cumulative sets       | Tags represent what a child knows at that point | ✓        |
| Isolated concept tags | Tags by what's new in that unit                 |          |
| Hybrid                | Both cumulative and concept tags                |          |

**User's choice:** Cumulative sets

### Rest tag granularity

| Option                  | Description                                              | Selected |
| ----------------------- | -------------------------------------------------------- | -------- |
| Specific rest tags      | 'with-quarter-rest', 'with-half-rest', 'with-whole-rest' | ✓        |
| Single 'with-rests' tag | One tag for all rest patterns                            |          |

**User's choice:** Specific rest tags

### Compound/syncopation tags

| Option                 | Description                              | Selected |
| ---------------------- | ---------------------------------------- | -------- |
| Own category tags      | 'compound-basic', 'compound-mixed', etc. | ✓        |
| Same cumulative naming | Keep adding to cumulative chain          |          |

**User's choice:** Own category tags (different musical contexts)

### Multi-tag per pattern

| Option                | Description                        | Selected |
| --------------------- | ---------------------------------- | -------- |
| Multiple tags allowed | A pattern can serve multiple nodes | ✓        |
| Exactly one tag       | Each pattern belongs to one set    |          |

**User's choice:** Multiple tags allowed for reuse

### Tag naming length

| Option            | Description                   | Selected |
| ----------------- | ----------------------------- | -------- |
| Short descriptive | 'quarter-eighth' (what's NEW) | ✓        |
| Full chain        | 'quarter-half-whole-eighth'   |          |

**User's choice:** Short descriptive names

### PATTERN_TAGS constant

| Option              | Description               | Selected |
| ------------------- | ------------------------- | -------- |
| Export frozen array | For validator reference   | ✓        |
| No constant         | Discover tags by scanning |          |

**User's choice:** Export PATTERN_TAGS

### Difficulty encoding

| Option                | Description                | Selected |
| --------------------- | -------------------------- | -------- |
| Difficulty field only | Clean separation from tags | ✓        |
| Difficulty in tags    | 'quarter-half-easy' etc.   |          |

**User's choice:** Difficulty field only

---

## Content Coverage Strategy

### Distribution approach

| Option                     | Description               | Selected |
| -------------------------- | ------------------------- | -------- |
| Minimum per tag + weighted | 8 min, more for rich tags | ✓        |
| Equal distribution         | ~8 per tag flat           |          |

**User's choice:** Minimum per tag + weighted

### Difficulty spread

| Option                                 | Description                                  | Selected |
| -------------------------------------- | -------------------------------------------- | -------- |
| All three per tag                      | Every tag has beginner/intermediate/advanced | ✓        |
| Beginner + intermediate only for early | Skip advanced for narrow tags                |          |

**User's choice:** All three per tag

### Measure length coverage

| Option                    | Description                 | Selected |
| ------------------------- | --------------------------- | -------- |
| All three lengths per tag | 1-bar, 2-bar, 4-bar per tag | ✓        |
| 1-bar only, extend later  | Smaller Phase 21 scope      |          |

**User's choice:** All three lengths per tag

### Scope cap

| Option                  | Description                         | Selected |
| ----------------------- | ----------------------------------- | -------- |
| 120+ floor, not ceiling | Write as many as make musical sense | ✓        |
| Cap at ~150             | Hard upper bound                    |          |
| Strict ~120             | Keep tight                          |          |

**User's choice:** 120+ floor, not a ceiling

### Boss patterns

| Option                    | Description                       | Selected |
| ------------------------- | --------------------------------- | -------- |
| Regular advanced patterns | No special boss-specific patterns | ✓        |
| Dedicated boss patterns   | Separate boss challenge patterns  |          |

**User's choice:** Regular patterns at advanced difficulty

### Rest patterns

| Option                     | Description                          | Selected |
| -------------------------- | ------------------------------------ | -------- |
| Always mix notes and rests | Every rest pattern has sounded notes | ✓        |
| Include pure rest measures | Full rest measures for counting      |          |

**User's choice:** Always mix notes and rests

### Narrow tag minimum

| Option              | Description                | Selected |
| ------------------- | -------------------------- | -------- |
| 8 for safety margin | Extra headroom for variety | ✓        |
| 6 is enough         | Minimal for limited combos |          |

**User's choice:** 8 for safety margin

### Pre-rest tag behavior

| Option                      | Description                       | Selected |
| --------------------------- | --------------------------------- | -------- |
| No rests before Unit 4 tags | Sounded notes only for early tags | ✓        |
| Allow rests in any tag      | Rests can appear anywhere         |          |

**User's choice:** No rests before Unit 4 tags
**Notes:** User noted that quarter-only might be too easy/boring. CURR-05 pulse exercise handles Node 1. Consider creative variety through measure length and tempo.

### 3/4 tag exclusivity

| Option                     | Description                           | Selected |
| -------------------------- | ------------------------------------- | -------- |
| Exclusive 3/4 tag          | Not combined with cumulative 4/4 tags | ✓        |
| Also carry cumulative tags | Resolver filters by timeSignature     |          |

**User's choice:** Exclusive 3/4 tag

---

## Authoring Approach

### How patterns get written

| Option                          | Description                              | Selected |
| ------------------------------- | ---------------------------------------- | -------- |
| Claude authors all patterns     | Hand-crafted following locked decisions  | ✓        |
| Generate candidates then curate | Use existing generator as starting point |          |
| Template-based expansion        | Define templates, systematically vary    |          |

**User's choice:** Claude authors all patterns

### File organization

| Option             | Description                         | Selected |
| ------------------ | ----------------------------------- | -------- |
| Single file        | src/data/patterns/rhythmPatterns.js | ✓        |
| Split by tag group | Multiple files with index re-export |          |

**User's choice:** Single file (matches PAT-01 requirement)

### Helper functions

| Option          | Description                                                     | Selected |
| --------------- | --------------------------------------------------------------- | -------- |
| Include helpers | getPatternsByTag, getPatternById, getPatternsByTagAndDifficulty | ✓        |
| Raw array only  | Phase 22 builds own resolver                                    |          |

**User's choice:** Include helpers

### Validation timing

| Option                 | Description                            | Selected |
| ---------------------- | -------------------------------------- | -------- |
| Build time only        | validateTrail.mjs, no runtime overhead | ✓        |
| Both build and runtime | Object.freeze + assertions             |          |

**User's choice:** Build time only

### In-file documentation

| Option                         | Description                           | Selected |
| ------------------------------ | ------------------------------------- | -------- |
| Section headers with rationale | JSDoc comments per tag group          | ✓        |
| No comments                    | Self-documenting via tags/durationSet |          |

**User's choice:** Section headers with brief rationale

### Validator phase

| Option   | Description                                     | Selected |
| -------- | ----------------------------------------------- | -------- |
| Phase 21 | Add pattern validation to validateTrail.mjs now | ✓        |
| Phase 22 | Add alongside resolver                          |          |

**User's choice:** Phase 21 (catches authoring errors immediately)

### Musical principles

| Option                             | Description                               | Selected |
| ---------------------------------- | ----------------------------------------- | -------- |
| Strong beat emphasis for beginners | Notes on strong beats at beginner level   | ✓        |
| Gradual syncopation introduction   | Simple off-beats to complex anticipations | ✓        |
| Rhythmic variety over repetition   | Each pattern musically distinct           | ✓        |
| No specific rules                  | General music theory only                 |          |

**User's choice:** All three musical principles applied

---

## Claude's Discretion

- Tied note inclusion based on what unit files need
- Quarter-only pattern engagement strategies
- Exact pattern count per tag within guidelines
- Specific musical content of each pattern

## Deferred Ideas

- Pickup measures (anacrusis) as a rhythm trail topic — future milestone
- Adaptive difficulty system (CURR-F02) — future milestone
