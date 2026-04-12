# Phase 22: Service Layer & Trail Wiring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 22-service-layer-trail-wiring
**Areas discussed:** Pulse exercise design, Binary-to-notation rendering, Node config migration scope, Validator rules

---

## Pulse Exercise Design

| Option                | Description                                                                                             | Selected |
| --------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| New exercise type     | Add PULSE as new EXERCISE_TYPE. Dedicated minimal screen, no staff/notes. Cleanest separation.          | ✓        |
| MetronomeTrainer mode | Add 'pulse mode' flag to existing MetronomeTrainer. Less new code but couples simplest to most complex. |          |

**User's choice:** New exercise type
**Notes:** Clean separation preferred over code reuse with MetronomeTrainer.

### Visual Design

| Option          | Description                                                                                  | Selected |
| --------------- | -------------------------------------------------------------------------------------------- | -------- |
| Pulsing circle  | Large centered circle that scales/glows on each beat. Minimal, calming, intuitive.           | ✓        |
| Bouncing dot    | Dot bounces left-to-right across 4 positions. More spatial but could confuse young children. |          |
| Countdown beats | Numbers 1-2-3-4 appearing large. Very explicit but less playful.                             |          |

**User's choice:** Pulsing circle
**Notes:** None

### Session Length

| Option             | Description                                                 | Selected |
| ------------------ | ----------------------------------------------------------- | -------- |
| 8 bars (32 beats)  | ~30 seconds. Feels like a real activity.                    |          |
| 4 bars (16 beats)  | ~15 seconds. Quick check.                                   | ✓        |
| 16 bars (64 beats) | Longer session. May be tedious for single-concept exercise. |          |

**User's choice:** 4 bars (16 beats) quick check
**Notes:** None

### Routing

| Option                   | Description                                                                  | Selected |
| ------------------------ | ---------------------------------------------------------------------------- | -------- |
| MixedLessonGame renderer | PulseQuestion renderer inside mixed_lesson. No new route needed.             | ✓        |
| Standalone route         | Separate /rhythm-mode/pulse-exercise route. More isolated but adds overhead. |          |

**User's choice:** MixedLessonGame renderer
**Notes:** Consistent with mixed_lesson architecture.

---

## Binary-to-Notation Rendering

| Option                           | Description                                                                                 | Selected |
| -------------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| Node durations control rendering | Node's `durations` array defines available VexFlow durations. Renderer picks longest match. | ✓        |
| Pattern stores explicit VexFlow  | Each pattern has a `vexflow` array. Unambiguous but 122 sequences to maintain.              |          |
| Tag-based rendering rules        | Each tag has a rendering ruleset. Flexible but indirect.                                    |          |

**User's choice:** Node durations control rendering
**Notes:** Simple, deterministic, tag-aligned.

### Ambiguity Resolution

| Option                   | Description                                                              | Selected |
| ------------------------ | ------------------------------------------------------------------------ | -------- |
| Prefer sustain over rest | Default to longest sustaining note. Rests only when gap < minimum note.  | ✓        |
| Random per-play          | Random rest/sustain each play. Adds variety but inconsistent scoring.    |          |
| Pattern metadata decides | Optional 'preferRests' boolean per pattern. Explicit but more to author. |          |

**User's choice:** Prefer sustain over rest
**Notes:** Produces more musical patterns. Simpler rule.

### Rendering Logic Location

| Option                           | Description                                                | Selected |
| -------------------------------- | ---------------------------------------------------------- | -------- |
| Inside RhythmPatternGenerator    | resolveByTags() returns binary + VexFlow in one call.      | ✓        |
| Separate renderPattern() utility | Two calls required. More modular but more context passing. |          |

**User's choice:** Inside RhythmPatternGenerator
**Notes:** None

### API Style

| Option                | Description                                                               | Selected |
| --------------------- | ------------------------------------------------------------------------- | -------- |
| Module with functions | resolveByTags(tags, durations, options) and resolveByIds(ids, durations). | ✓        |
| Class-based           | new RhythmPatternGenerator(durations). Less common in this codebase.      |          |

**User's choice:** Module with functions
**Notes:** Matches existing codebase style.

---

## Node Config Migration Scope

| Option                | Description                                                                    | Selected |
| --------------------- | ------------------------------------------------------------------------------ | -------- |
| Template per nodeType | Standard question sequence per nodeType. Consistent pedagogy, less authoring.  | ✓        |
| Custom per node       | Hand-author each node's sequence. Maximum control, 40+ sequences.              |          |
| Template + overrides  | Templates as default, specific nodes can override. Best of both, more complex. |          |

**User's choice:** Template per nodeType
**Notes:** None

### Config Field Strategy

| Option                         | Description                                                          | Selected |
| ------------------------------ | -------------------------------------------------------------------- | -------- |
| Replace patterns entirely      | Remove rhythmConfig.patterns, replace with patternTags. Clean break. | ✓        |
| Add alongside, deprecate later | Keep patterns for backward compat. Safer but leaves dead code.       |          |

**User's choice:** Replace patterns entirely
**Notes:** None

### Arcade Pattern Consumption

| Option                           | Description                                          | Selected |
| -------------------------------- | ---------------------------------------------------- | -------- |
| patternTags same as mixed_lesson | Consistent API across all node types.                | ✓        |
| patternIds for boss nodes        | Specific IDs for boss challenges. Two config styles. |          |
| You decide                       | Claude's discretion.                                 |          |

**User's choice:** patternTags same as mixed_lesson
**Notes:** None

### Exercise-Level rhythmPatterns Cleanup

| Option              | Description                                                                                 | Selected |
| ------------------- | ------------------------------------------------------------------------------------------- | -------- |
| Remove both         | Delete rhythmConfig.patterns AND exercises[].config.rhythmPatterns. Single source of truth. | ✓        |
| Keep exercise-level | Only replace rhythmConfig.patterns. Two pattern systems coexist.                            |          |

**User's choice:** Remove both
**Notes:** None

---

## Validator Rules

| Option                        | Description                                                        | Selected |
| ----------------------------- | ------------------------------------------------------------------ | -------- |
| Existence + coverage + safety | Tag existence, orphan tag detection, duration safety check.        | ✓        |
| Existence only                | Just check tags/IDs exist. Simpler but misses pedagogy violations. |          |
| Existence + coverage          | Tags exist AND all used. Skip duration safety.                     |          |

**User's choice:** Existence + coverage + safety
**Notes:** None

### Game-Type Policy Enforcement

| Option                     | Description                                                                | Selected |
| -------------------------- | -------------------------------------------------------------------------- | -------- |
| Yes, enforce at build time | Validator checks nodeType → exerciseType mapping. Build fails on mismatch. | ✓        |
| No, trust the code         | Policy enforced by code review only. Keeps validator narrow.               |          |

**User's choice:** Yes, enforce at build time
**Notes:** None

### Duration Safety Check Method

| Option                         | Description                                                                            | Selected |
| ------------------------------ | -------------------------------------------------------------------------------------- | -------- |
| Against node's durations array | Check patterns only need durations from node's rhythmConfig.durations. Direct.         | ✓        |
| Against tag definition         | Define allowed durations per tag. More centralized but another definition to maintain. |          |
| You decide                     | Claude picks best approach.                                                            |          |

**User's choice:** Against node's durations array
**Notes:** Uses same data the renderer uses.

### Script Integration

| Option                            | Description                                                                          | Selected |
| --------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Integrated into verify:trail only | All checks in npm run verify:trail / prebuild. verify:patterns stays Phase 21 scope. | ✓        |
| Both scripts                      | Redundant but allows pattern checks without full trail validation.                   |          |

**User's choice:** Integrated into verify:trail only
**Notes:** None

---

## Claude's Discretion

- Exact question sequence templates per nodeType (question type counts and ordering)
- Discovery template weighting toward notation questions
- MINI_BOSS session length and distribution
- Binary-to-VexFlow rendering algorithm internals
- resolveByTags random selection strategy
- Test structure and coverage approach
- Whether pulse questions appear beyond Unit 1 Node 1

## Deferred Ideas

None — discussion stayed within phase scope
