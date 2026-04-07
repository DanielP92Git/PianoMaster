# Phase 22: Service Layer & Trail Wiring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 22-service-layer-trail-wiring
**Areas discussed:** Pulse exercise mechanism, Pattern resolution API, Node config migration shape, Game-type remediation scope

---

## Pulse Exercise Mechanism

| Option                                | Description                                                                                            | Selected |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| MetronomeTrainer flag                 | Add pulseOnly: true config flag. Skip VexFlow, show pulsing visual + tap target. Reuses tap detection. | ✓        |
| New exercise type + component         | Create EXERCISE_TYPES.PULSE and new PulseExercise component. Clean separation but more to maintain.    |          |
| MetronomeTrainer with hidden notation | CSS-hide notation area. Simplest but awkward blank space.                                              |          |

**User's choice:** MetronomeTrainer flag (Recommended)
**Notes:** Minimal code change, reuses existing tap detection logic

### Follow-up: Pulse Visual

| Option                      | Description                                                    | Selected |
| --------------------------- | -------------------------------------------------------------- | -------- |
| Pulsing circle + tap target | Large animated circle that pulses on each beat, tap area below | ✓        |
| Bouncing ball on beats      | Ball bounces at each beat position across screen               |          |
| You decide                  | Claude picks based on existing patterns                        |          |

**User's choice:** Pulsing circle + tap target

### Follow-up: Scoring

| Option                           | Description                                                                      | Selected |
| -------------------------------- | -------------------------------------------------------------------------------- | -------- |
| Same scoring as MetronomeTrainer | PERFECT/GOOD/MISS per tap, star rating at end. Consistent with other games.      | ✓        |
| Simplified pass/fail             | Just track whether child tapped near each beat. More forgiving but inconsistent. |          |

**User's choice:** Same scoring (Recommended)

### Follow-up: Beat Count

| Option                | Description                                               | Selected |
| --------------------- | --------------------------------------------------------- | -------- |
| 8 beats (2 measures)  | ~7 seconds at 65 BPM. Short and sweet for first exercise. | ✓        |
| 16 beats (4 measures) | ~15 seconds. More practice but longer first experience.   |          |
| You decide            | Claude picks based on first-node context                  |          |

**User's choice:** 8 beats (2 measures)

### Follow-up: Count-in

| Option              | Description                                                               | Selected |
| ------------------- | ------------------------------------------------------------------------- | -------- |
| Yes, 1-bar count-in | 4 metronome clicks with visual beat numbers. Standard in music education. | ✓        |
| No count-in         | Start immediately. Child figures out tempo from pulsing circle.           |          |
| You decide          | Claude decides based on MetronomeTrainer's existing behavior              |          |

**User's choice:** Yes, 1-bar count-in (Recommended)

### Follow-up: Beat Audio

| Option                   | Description                                                             | Selected |
| ------------------------ | ----------------------------------------------------------------------- | -------- |
| Existing metronome click | Same click as later exercises. Consistent audio.                        |          |
| Piano note (C4)          | Play node's pitch on each beat. More musical, connects rhythm to piano. | ✓        |
| You decide               | Claude picks based on audio infrastructure                              |          |

**User's choice:** Piano note (C4)

---

## Pattern Resolution API

| Option                           | Description                                                                               | Selected |
| -------------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| Extend RhythmPatternGenerator.js | Add resolveByTags()/resolveByIds() as new exports. Already owns pattern logic.            | ✓        |
| New dedicated module             | Create src/services/rhythmPatternResolver.js. Clean separation but new import everywhere. |          |
| Functions in rhythmPatterns.js   | Co-locate data with access. Mixes data and service layers.                                |          |

**User's choice:** Extend RhythmPatternGenerator.js (Recommended)

### Follow-up: Game Consumption

| Option               | Description                                                             | Selected |
| -------------------- | ----------------------------------------------------------------------- | -------- |
| Full pattern objects | Game gets objects with beats, tags, difficulty, etc. ready for VexFlow. | ✓        |
| Beats arrays only    | Stripped metadata. Simpler but loses pattern ID for analytics.          |          |
| You decide           | Claude designs based on game component needs                            |          |

**User's choice:** Full pattern objects (Recommended)

### Follow-up: Old Generation Logic

| Option           | Description                                                                   | Selected |
| ---------------- | ----------------------------------------------------------------------------- | -------- |
| Keep as fallback | Leave in place, non-trail games may use it. Remove in future cleanup.         | ✓        |
| Remove it now    | Delete random generation. Cleaner but riskier if free practice depends on it. |          |
| You decide       | Claude checks usage and decides                                               |          |

**User's choice:** Keep as fallback (Recommended)

### Follow-up: Return Strategy

| Option                       | Description                                                                                             | Selected |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| Return full pool, game picks | All matching patterns returned. Game randomly selects per session. Filtered by difficulty/measureCount. | ✓        |
| Return exactly N patterns    | Resolver takes count parameter, returns random subset.                                                  |          |

**User's choice:** Return full pool, game picks (Recommended)

---

## Node Config Migration Shape

| Option                         | Description                                             | Selected |
| ------------------------------ | ------------------------------------------------------- | -------- |
| Remove rhythmPatterns entirely | Clean break. Validator catches leftovers. No ambiguity. | ✓        |
| Keep alongside for transition  | Add new fields but keep old. Dual-field confusing.      |          |
| You decide                     | Claude checks impact                                    |          |

**User's choice:** Remove entirely (Recommended)

### Follow-up: Duration Fields

| Option                     | Description                                                                          | Selected |
| -------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Keep all three             | durations/focusDurations/contextDurations serve different purpose (knowledge state). | ✓        |
| Replace with tag inference | Derive from patternTags. Loses focus/context distinction.                            |          |
| You decide                 | Claude analyzes field usage                                                          |          |

**User's choice:** Keep all three (Recommended)

### Follow-up: Boss Config

| Option                          | Description                                                               | Selected |
| ------------------------------- | ------------------------------------------------------------------------- | -------- |
| patternTags + difficulty filter | Same shape as regular nodes. Boss challenge from advanced + measureCount. | ✓        |
| patternIds for hand-picked      | Specific IDs for curated boss encounters. Manual management.              |          |
| You decide                      | Claude decides                                                            |          |

**User's choice:** patternTags + difficulty filter (Recommended)

### Follow-up: Validator Old Field Check

| Option                  | Description                                                             | Selected |
| ----------------------- | ----------------------------------------------------------------------- | -------- |
| Yes, error on old field | Build fails with clear migration message. Catches incomplete migration. | ✓        |
| Warn but don't fail     | Print warning, allow build. Risks partial migration.                    |          |

**User's choice:** Yes, error on old field (Recommended)

### Follow-up: Config Depth

| Option               | Description                                                      | Selected |
| -------------------- | ---------------------------------------------------------------- | -------- |
| Explicit in config   | Each exercise has difficulty and measureCount. Self-documenting. | ✓        |
| Infer from node type | Mapping is implicit. Less config but harder to override.         |          |
| You decide           | Claude decides based on variation                                |          |

**User's choice:** Explicit in config (Recommended)

---

## Game-type Remediation Scope

| Option              | Description                                                              | Selected |
| ------------------- | ------------------------------------------------------------------------ | -------- |
| Fix game types too  | Rewrite exercise types alongside pattern wiring. One coordinated change. | ✓        |
| Pattern wiring only | Separate pass for game-type fixes. Touches files twice.                  |          |
| You decide          | Claude checks violation count                                            |          |

**User's choice:** Fix game types too (Recommended)

### Follow-up: Validator Game-Type Enforcement

| Option                   | Description                                                               | Selected |
| ------------------------ | ------------------------------------------------------------------------- | -------- |
| Yes, validate game types | Validator enforces nodeType → exercise type mapping. Prevents regression. | ✓        |
| No, trust the config     | One-time migration verified by review only.                               |          |
| You decide               | Claude decides based on complexity                                        |          |

**User's choice:** Yes, validate game types (Recommended)

### Follow-up: Navigation Switch

| Option                                   | Description                                                                   | Selected |
| ---------------------------------------- | ----------------------------------------------------------------------------- | -------- |
| Verify existing mapping covers all types | Check switch handles all exercise types after remediation. Add missing cases. | ✓        |
| No change needed                         | Assume existing switch is complete.                                           |          |

**User's choice:** Verify existing mapping covers all types (Recommended)

---

## Claude's Discretion

- Pulsing circle animation design (size, color, glow, reduced-motion)
- Internal resolver structure (filtering, caching)
- Unit file migration order
- Game component adaptation for curated vs legacy patterns

## Deferred Ideas

- Old generator removal — future cleanup when free practice modes verified
- Pattern analytics — track which patterns children struggle with (enabled by full pattern objects but not built in Phase 22)
