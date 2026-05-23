---
quick_id: 260523-ugm
description: Insert q-h-q syncopation as gentler intro to Rhythm Unit 8
status: complete
date: 2026-05-23
---

# Quick Task 260523-ugm: Summary

## Outcome

Rhythm Unit 8 now opens with **q-h-q (quarter-half-quarter)** syncopation as a gentler on-ramp before introducing the faster **8-q-8** shape. Unit grew from 6 to 8 nodes, with the pedagogical ramp:

1. `rhythm_8_1` — q-h-q Discovery (NEW)
2. `rhythm_8_2` — q-h-q Practice (NEW)
3. `rhythm_8_3` — 8-q-8 Discovery (was `rhythm_8_1`)
4. `rhythm_8_4` — 8-q-8 Practice (was `rhythm_8_2`)
5. `rhythm_8_5` — Dotted-quarter Discovery (was `rhythm_8_3`, fills the prior `_5` gap)
6. `rhythm_8_6` — Mixed practice (was `rhythm_8_4`)
7. `rhythm_8_7` — Speed round (was `rhythm_8_6`)
8. `boss_rhythm_8` — Final boss (unchanged id)

## How the new content is selected

- New tag **`long-syncopation`** added to `VALID_TAGS` taxonomy.
- Tagged onto the 5 existing q+h patterns that match the unit's pattern vocabulary (instead of creating duplicate patterns — the binary onsets already existed):
  - `q_44_001` (q q q q), `q_44_002` (h q q), `q_44_003` (q h q — canonical syncopation), `q_44_004` (q q h), `qh_44_001` (h h).
- The new nodes use `patternTags: ["long-syncopation"]` with default AND-mode resolution.
- `long-syncopation` was also added to the speed (`rhythm_8_7`) and boss (`boss_rhythm_8`) cumulative pools (`patternTagMode: "any"`); D-09's duration-subset filter handles compatibility at runtime.

## Why the canonical q-h-q wasn't also tagged `"syncopation"`

Patterns tagged `"syncopation"` are intended to be the short-value 8-q-8 family. Adding the tag to `q_44_003` would have been a no-op (it's filtered out by `patternNeedsRests` in `[8, q]`-only nodes), but it muddied the data model. Kept the tags semantically distinct: `long-syncopation` = long-value, `syncopation` = short-value, `dotted-syncopation` = dotted family.

## Files changed

| File                                            | Change                                                                                                                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/units/rhythmUnit8Redesigned.js`       | 6 → 8 nodes; renumbered; tempo ramp 62→83; new skill `syncopation_long_value`; `long-syncopation` added to speed + boss `patternTags`                                                                           |
| `src/data/patterns/rhythmPatterns.js`           | Added `long-syncopation` tag to 5 existing q+h patterns                                                                                                                                                         |
| `src/data/patterns/rhythmPatterns.test.js`      | Added `long-syncopation` to `VALID_TAGS`; "15 tags" → "16 tags"                                                                                                                                                 |
| `src/data/units/rhythmUnit8Redesigned.test.js`  | Length 6→8, ID list, orders 144-151, regular-node slice(0,7), first-node assertions updated to q-h-q content, "third node = dotted" → "fifth node = dotted", tempo assertion uses `[length-2]`, xpReward min 70 |
| `src/components/parent/QuickStatsGrid.test.jsx` | Trail total 178 → 180                                                                                                                                                                                           |

## Test results

- `npm run test:run`: **1712 passed, 13 todo, 2 skipped** (no failures)
- `npm run verify:trail`: **passed with warnings** (low-variety warning for the two new nodes — same family of warnings existing nodes already produce; not a regression)
- `npm run verify:patterns`: **passed**

## Combinatorics note

User spec asked for 8-12 new patterns. With strict `[q, h]` durations in 4/4, only **5 unique onset patterns** exist (q-q-q-q, h-h, h-q-q, q-q-h, q-h-q). Rather than fabricate near-duplicate variants or pull in eighth notes (which would defeat the gentle-intro pedagogy), reused the existing 5 patterns with a tag addition. Documented in PLAN.md.

## must_haves traceability

- ✅ truth-1: Unit 8 exports 8 nodes (test: "exports exactly 8 nodes")
- ✅ truth-2: First node `durations: ["q","h"]`, `patternTags` includes `"long-syncopation"` (test: "first node is long-value syncopation discovery")
- ✅ truth-3: Boss `patternTags` includes `"long-syncopation"` (test: "boss patternTags includes long-syncopation")
- ✅ truth-4: All 3 verify scripts pass
- ✅ truth-5, truth-6: All test files green
- ✅ truth-7: Chain `boss_rhythm_7 → rhythm_8_1 → … → rhythm_8_7 → boss_rhythm_8` (test: "prerequisite chain is valid")
