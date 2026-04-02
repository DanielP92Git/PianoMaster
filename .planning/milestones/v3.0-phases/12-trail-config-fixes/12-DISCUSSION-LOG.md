# Phase 12: Trail Config Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 12-trail-config-fixes
**Areas discussed:** Difficulty value alignment, Pattern constraint wiring, Test expectations scope, RhythmDictation pattern constraint, Build-time validation, Node data updates scope

---

## Difficulty Value Alignment

| Option              | Description                                                                    | Selected |
| ------------------- | ------------------------------------------------------------------------------ | -------- |
| Fix the data files  | Change 'easy'→'beginner' etc. in unit files. One-time fix, no runtime mapping. | ✓        |
| Add a mapping layer | Keep data as easy/medium/hard, add normalizeDifficulty() function.             |          |
| You decide          | Claude picks                                                                   |          |

**User's choice:** Fix the data files (Recommended)
**Notes:** No mapping layer needed. Generator already uses beginner/intermediate/advanced natively.

---

## Pattern Constraint Wiring

| Option                        | Description                                                         | Selected |
| ----------------------------- | ------------------------------------------------------------------- | -------- |
| Add parameter to getPattern() | Add optional 3rd param for allowedPatterns. All games pass through. | ✓        |
| Filter after generation       | Keep getPattern() unchanged, filter results.                        |          |
| You decide                    | Claude picks                                                        |          |

**User's choice:** Add parameter to getPattern() (Recommended)
**Notes:** Clean approach — extend existing API rather than post-processing.

---

## Test Expectations Scope

| Option                    | Description                                                        | Selected |
| ------------------------- | ------------------------------------------------------------------ | -------- |
| Exact per-node type check | Assert each node's exercise type matches expected D-12 assignment. | ✓        |
| Ratio check only          | Count types across unit and assert proportions.                    |          |
| Both exact and ratio      | Belt-and-suspenders.                                               |          |

**User's choice:** Exact per-node type check (Recommended)

### Follow-up: Test scope for units 1-6

| Option                   | Description             | Selected |
| ------------------------ | ----------------------- | -------- |
| Only unit 7/8            | Match success criteria. | ✓        |
| All 8 units              | Full coverage.          |          |
| Unit 7/8 plus spot-check | Sanity check.           |          |

**User's choice:** Only unit 7/8 (match success criteria)

### Follow-up: Difficulty validation test

| Option                   | Description                                        | Selected |
| ------------------------ | -------------------------------------------------- | -------- |
| Yes, add validation test | Grep-style test asserting valid difficulty values. | ✓        |
| No, trust the data fix   | Rely on code review.                               |          |

**User's choice:** Yes, add validation test (Recommended)

---

## RhythmDictation Pattern Constraint

| Option                              | Description                                                                          | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| All 4 rhythm games                  | MetronomeTrainer, RhythmReading, RhythmDictation, ArcadeRhythm all honor nodeConfig. | ✓        |
| Only 3 that already read nodeConfig | Leave RhythmDictation's DEFAULT_DIFFICULTY alone.                                    |          |

**User's choice:** Yes, all 4 rhythm games (Recommended)
**Notes:** Consistent behavior across all trail rhythm exercises.

---

## Build-Time Validation

| Option               | Description                                                     | Selected |
| -------------------- | --------------------------------------------------------------- | -------- |
| Yes, add both checks | Validate difficulty values + rhythmPatterns in trail validator. | ✓        |
| Skip for this phase  | Let regression tests handle it.                                 |          |

**User's choice:** Yes, add both checks (Recommended)
**Notes:** Same pattern as existing prereq/XP validation.

---

## Node Data Updates Scope

Codebase investigation revealed all 8 rhythm units already have D-12 mixed exercise types from Phase 11. Only test expectations are stale.

**Conclusion:** Data files are correct. Phase 12 only updates test assertions.

---

## Claude's Discretion

- Internal implementation of pattern filtering in getPattern()
- How allowedPatterns string names map to generator internals
- GENERATION_RULES intersection strategy

## Deferred Ideas

- Units 1-6 test updates for D-12 distribution
