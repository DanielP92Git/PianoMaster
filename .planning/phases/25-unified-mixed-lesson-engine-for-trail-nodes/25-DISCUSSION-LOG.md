# Phase 25: Unified Mixed Lesson Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 25-unified-mixed-lesson-engine-for-trail-nodes
**Areas discussed:** Renderer extraction, Lesson sequence schema, Session UX & transitions, Standalone coexistence

---

## Renderer Extraction

| Option                | Description                                                                   | Selected |
| --------------------- | ----------------------------------------------------------------------------- | -------- |
| Extract from existing | Pull quiz UI into stateless renderers. Standalone games become thin wrappers. | ✓        |
| Build new renderers   | Write fresh renderers, standalone games untouched. More duplication.          |          |
| Replace entirely      | Delete standalone games, only mixed engine exists.                            |          |

**User's choice:** Extract from existing
**Notes:** Preferred the architecture preview showing MixedLessonGame → renderers → DurationCard, with standalone games as thin wrappers.

### Follow-up: File location

| Option                   | Description                                                          | Selected |
| ------------------------ | -------------------------------------------------------------------- | -------- |
| rhythm-games/renderers/  | New subdirectory alongside components/ and utils/. Clear separation. | ✓        |
| rhythm-games/components/ | Alongside DurationCard, TapArea, etc. Fewer dirs but mixed concerns. |          |
| You decide               | Claude picks.                                                        |          |

**User's choice:** rhythm-games/renderers/

---

## Lesson Sequence Schema

| Option                          | Description                                                                | Selected |
| ------------------------------- | -------------------------------------------------------------------------- | -------- |
| Inline in exercises array       | New 'mixed_lesson' type with questions[] config. Co-located in unit files. | ✓        |
| Separate lesson config file     | src/data/lessons/ directory with lesson templates referenced by ID.        |          |
| Auto-generated from node skills | Engine generates sequence from duration pool + template.                   |          |

**User's choice:** Inline in exercises array
**Notes:** Liked the preview showing mixed_lesson as another exercise in the exercises[] array.

### Follow-up: Duration inheritance

| Option                         | Description                                                    | Selected |
| ------------------------------ | -------------------------------------------------------------- | -------- |
| Always inherit                 | Questions inherit node's rhythmConfig durations. No overrides. | ✓        |
| Inherit with optional override | Default to node's durations, allow per-question narrowing.     |          |

**User's choice:** Always inherit

### Follow-up: Question count

| Option                | Description                        | Selected |
| --------------------- | ---------------------------------- | -------- |
| 5 questions           | Same as standalone.                |          |
| 8-10 questions        | More Duolingo-like session length. | ✓        |
| Configurable per node | Array length IS the count.         |          |

**User's choice:** 8-10 questions

---

## Session UX & Transitions

### Progress indicator

| Option        | Description                                                       | Selected |
| ------------- | ----------------------------------------------------------------- | -------- |
| Progress bar  | Horizontal bar at top, Duolingo-style. Green fill, fraction text. | ✓        |
| Dot progress  | Row of dots, green/red per answer. Consistent with Phase 24.      |          |
| Segmented bar | Bar divided by question type. Visual cue for upcoming types.      |          |

**User's choice:** Progress bar

### Transitions

| Option           | Description                                                 | Selected |
| ---------------- | ----------------------------------------------------------- | -------- |
| Smooth crossfade | ~300ms fade out/in between questions. Feedback flash first. | ✓        |
| Type label flash | Brief label ("Visual Recognition") before new type.         |          |
| No transition    | Instant swap after feedback. Simplest.                      |          |

**User's choice:** Smooth crossfade

### Scoring

| Option                  | Description                                      | Selected |
| ----------------------- | ------------------------------------------------ | -------- |
| Single score across all | correct / total → percentage → stars (60/80/95). | ✓        |
| Weighted by type        | Different weights per question type.             |          |
| You decide              | Claude picks.                                    |          |

**User's choice:** Single score across all questions

---

## Standalone Coexistence

| Option                   | Description                                                     | Selected |
| ------------------------ | --------------------------------------------------------------- | -------- |
| Keep both, nodes choose  | Both standalone and mixed types work. Gradual migration.        | ✓        |
| Replace all with mixed   | All nodes switch to mixed_lesson. Standalone becomes dead code. |          |
| Remove standalone routes | Delete standalone game components entirely.                     |          |

**User's choice:** Keep both, nodes choose
**Notes:** Liked the preview showing Node A with standalone exercises and Node B with mixed_lesson.

### Follow-up: Migration scope

| Option                                   | Description                                      | Selected |
| ---------------------------------------- | ------------------------------------------------ | -------- |
| Build engine + convert low-variety nodes | Build + convert the ~8-12 Phase 24 target nodes. |          |
| Build engine only, migrate later         | Build component and route, no node changes.      |          |
| Build + convert all rhythm nodes         | Build + give every rhythm node a mixed_lesson.   |          |

**User's choice:** Other — "Decide what's the cleanest and best approach, so the code builds clean"
**Notes:** Delegated to Claude's discretion. Priority is a clean build.

---

## Claude's Discretion

- Migration scope (which nodes to convert, if any)
- MixedLessonGame internal state machine
- Whether to extract shared quiz engine hook
- Crossfade animation implementation
- Test structure and coverage
- Build validator extensions for mixed_lesson

## Deferred Ideas

- Rhythm tap as a renderer (for mixed lessons with tap-along questions)
- Treble/Bass mixed lessons (note_recognition/sight_reading renderers)
- Adaptive difficulty mid-lesson
- Free practice mixed lessons
