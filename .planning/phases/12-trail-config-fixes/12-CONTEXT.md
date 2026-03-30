# Phase 12: Trail Config Fixes - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Rhythm games correctly read and apply trail node configuration so difficulty and pattern constraints work as designed. Three fixes: (1) wire `rhythmPatterns` constraint through pattern generator, (2) align difficulty terminology in data files, (3) update stale test expectations.

Requirements covered: TCFG-01, TCFG-02, TCFG-03.

Not in scope: New rhythm game types, node data structure changes, trail UI changes, units 1-6 test updates.

</domain>

<decisions>
## Implementation Decisions

### Difficulty Value Alignment (TCFG-02)
- **D-01:** Fix the data files, not the code. Change `'easy'`→`'beginner'`, `'medium'`→`'intermediate'`, `'hard'`→`'advanced'` in all rhythm unit exercise configs (units 1-2 affected). No mapping layer — the generator already uses `beginner`/`intermediate`/`advanced` natively.

### Pattern Constraint Wiring (TCFG-01)
- **D-02:** Add optional 3rd parameter to `getPattern(timeSig, difficulty, allowedPatterns)`. When `allowedPatterns` is provided, the generator constrains output to only include specified durations. When omitted (free-play mode), behavior is unchanged.
- **D-03:** All 4 rhythm games (MetronomeTrainer, RhythmReadingGame, RhythmDictationGame, ArcadeRhythmGame) pass `rhythmPatterns` and `difficulty` from trail node config when in trail mode. RhythmDictationGame currently hardcodes `DEFAULT_DIFFICULTY` — update it to read from `nodeConfig` like the other 3 games.

### Test Expectations (TCFG-03)
- **D-04:** Unit 7/8 test files get exact per-node exercise type assertions matching the D-12 distribution (3x RHYTHM + 2x RHYTHM_TAP + 1x RHYTHM_DICTATION + 1x ARCADE_RHYTHM for regular nodes, ARCADE_RHYTHM for boss). Not ratio checks — exact per-node type verification.
- **D-05:** Only unit 7/8 tests are updated per success criteria. Units 1-6 test updates deferred.
- **D-06:** Add a regression test that validates all rhythm unit exercise configs use only `['beginner', 'intermediate', 'advanced']` for difficulty values. Prevents the easy/beginner mismatch from recurring.

### Build-Time Validation
- **D-07:** Enhance `scripts/validateTrail.mjs` to check: (1) all exercise config `difficulty` values are in `['beginner', 'intermediate', 'advanced']`, (2) all `rhythmPatterns` arrays use recognized duration names. Build fails on violation, same pattern as existing prereq/XP validation.

### Claude's Discretion
- Internal implementation of pattern filtering in `getPattern()` (filter during generation vs post-filter)
- How `allowedPatterns` string names (e.g., `'quarter'`, `'dotted-quarter'`) map to generator internals
- Whether to use `GENERATION_RULES[difficulty].allowedSubdivisions` intersection with `allowedPatterns` or override

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pattern Generator (primary target)
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — `getPattern()` function, `DIFFICULTY_LEVELS`, `GENERATION_RULES`, `HybridPatternService` class. This is the core file being modified for TCFG-01.

### Rhythm Games (all 4 need config wiring)
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — Lines 88, 171-199, 801-810: `nodeConfig` extraction and `getPattern()` calls
- `src/components/games/rhythm-games/RhythmReadingGame.jsx` — Lines 65, 96-98, 259: `nodeConfig` extraction and `getPattern()` call
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` — Lines 219: hardcoded `DEFAULT_DIFFICULTY`, needs `nodeConfig` integration
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — Lines 107, 122-124: `nodeConfig` extraction

### Trail Node Data (difficulty fix targets)
- `src/data/units/rhythmUnit1Redesigned.js` — Uses `difficulty: 'easy'` (needs → `'beginner'`)
- `src/data/units/rhythmUnit2Redesigned.js` — Uses `difficulty: 'easy'` (needs → `'beginner'`)
- `src/data/units/rhythmUnit7Redesigned.js` — Already uses `beginner`/`intermediate`/`advanced`; has D-12 mixed types
- `src/data/units/rhythmUnit8Redesigned.js` — Already uses `beginner`/`intermediate`/`advanced`; has D-12 mixed types

### Test Files (update targets)
- `src/data/units/rhythmUnit7Redesigned.test.js` — Line 81-83: asserts "all exercises use RHYTHM type" (stale)
- `src/data/units/rhythmUnit8Redesigned.test.js` — Line 80-83: asserts "all exercises use RHYTHM type" (stale)

### Build Validator (enhancement target)
- `scripts/validateTrail.mjs` — Currently validates prereqs, cycles, XP, IDs. Needs difficulty + rhythmPatterns checks.

### Phase 11 Context (prior decisions)
- `.planning/milestones/v2.9-phases/11-arcade-rhythm-game-rhythm-node-remapping/11-CONTEXT.md` — D-12 distribution decision and D-13 boss node rule

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DIFFICULTY_LEVELS` enum in RhythmPatternGenerator.js: Already defines `BEGINNER`, `INTERMEDIATE`, `ADVANCED` strings
- `GENERATION_RULES` in RhythmPatternGenerator.js: Per-difficulty `allowedSubdivisions` arrays — natural place to intersect with `rhythmPatterns`
- Trail node exercise config structure: `{ type, config: { rhythmPatterns, tempo, difficulty, timeSignature } }` — already has the fields, just not read by games

### Established Patterns
- All 4 rhythm games extract `nodeConfig` from `location.state` using `location.state?.nodeConfig`
- `getPattern(timeSig, difficulty)` is the single entry point for pattern generation across all games
- `hasAutoStartedRef` pattern for trail auto-start is consistent across all games

### Integration Points
- `getPattern()` signature change affects 4 game files + any free-play callers
- Difficulty data fix touches rhythm unit files 1-2 (10 occurrences of `'easy'`)
- `validateTrail.mjs` already iterates all nodes — adding checks is additive

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions captured above.

</specifics>

<deferred>
## Deferred Ideas

- Units 1-6 test updates for D-12 distribution — not required by TCFG-03, can be done in a future pass

</deferred>

---

*Phase: 12-trail-config-fixes*
*Context gathered: 2026-03-30*
