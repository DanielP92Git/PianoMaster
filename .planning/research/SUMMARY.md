# Research Summary: v3.2 Rhythm Trail Rework

**Researched:** 2026-04-06
**Confidence:** HIGH

## Executive Summary

The v3.2 milestone is a content and wiring rework, not a feature build. Zero new npm dependencies needed. The existing codebase has every technical primitive required. The gap is that trail nodes use random-generative patterns (constrained by duration allowlists) rather than hand-crafted pedagogically sequenced patterns, and the duration progression contradicts established Kodaly/Orff pedagogy.

## Stack Additions

None. The single architectural change is moving curated patterns from runtime-fetched JSON to a Vite-bundled synchronous JS module (`src/data/patterns/rhythmPatterns.js`).

## Feature Table Stakes

**Must have (P1):**

- Correct Kodaly duration order: quarter → eighth → half → whole → rests → dotted → sixteenth → compound (current app places whole before eighth)
- One new note value per unit enforced by design rule
- Curated pattern library expanded from ~20 to ~120+ patterns organized by duration-set tier
- Echo game (MetronomeTrainer) as first exercise for all Discovery nodes
- Pulse exercise in Unit 1 Node 1 before notation appears
- Timing thresholds widened: PERFECT 100ms (not 50ms) for Discovery/Practice nodes
- Patterns graded by duration set: children only see durations already learned

**Should have (P2):**

- Kodaly syllables (ta/ti-ti/ta-a) below VexFlow notation
- focusDuration highlight for new elements
- Child-friendly game names (i18n only)
- Adaptive tempo nudge (±5 BPM)
- Progressive measure length (1-bar → 2-bar → 4-bar)
- "Almost!" replaces "MISS" text

## Architecture Approach

One new file. Five categories of existing files modified. No DB changes.

1. `src/data/patterns/rhythmPatterns.js` (NEW) — Central curated library; tagged, scored, Vite-bundled
2. `RhythmPatternGenerator.js` (MODIFIED) — Add `resolveByTags()`, `resolveByIds()`; backward compatible
3. `rhythmUnit1-8Redesigned.js` x8 (MODIFIED) — Replace `rhythmPatterns` with `patternTags`; Kodaly resequencing
4. 4 game components (MODIFIED) — ~3 lines each
5. `validateTrail.mjs` (MODIFIED) — Pattern ID existence checks, complexity bounds

## Watch Out For

1. **Node order values are immutable for nodes with live progress** — query prod DB before restructuring
2. **Curated JSON path has never been exercised in trail context** — all 50 nodes bypass it via non-null `rhythmPatterns`
3. **Unit 5 introduces dotted notes AND 3/4 time simultaneously** — dual cognitive demand, must separate
4. **MetronomeTrainer on Discovery nodes = children never see notation** — wrong game for learning stage
5. **50ms PERFECT threshold is twice as strict as appropriate for 8-year-olds** — widen to 100ms
6. **`FREE_NODE_IDS` desync** — new free nodes must be added to JS AND Postgres in same PR

## Suggested Phase Structure

1. **Curriculum Audit & Policy** — Lock decisions before touching files
2. **Pattern Library Construction** — Author ~120+ tagged patterns (pure addition)
3. **Service Layer & Unit File Wiring** — Generator + unit files + game components + validator (coordinated)
4. **P2 Enhancements & Polish** — Syllables, highlights, naming, adaptive tempo (independent)

---

_Research completed: 2026-04-06_
