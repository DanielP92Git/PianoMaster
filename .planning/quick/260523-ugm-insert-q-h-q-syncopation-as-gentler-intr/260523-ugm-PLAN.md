---
quick_id: 260523-ugm
description: Insert q-h-q syncopation as gentler intro to Rhythm Unit 8
date: 2026-05-23
---

# Quick Task 260523-ugm: q-h-q Syncopation Intro

## Goal

Restructure Rhythm Unit 8 so the syncopation arc starts with **q-h-q** (quarter, half, quarter — half note crosses the strong beat 3) before introducing the faster **8-q-8** (eighth-quarter-eighth) shape. This gives 8-year-old learners a gentler on-ramp where the off-beat emphasis lives in slower note values they can already feel.

## Final Unit 8 shape (8 nodes)

| Index | id                   | order | nodeType    | Content                   | tempo.default |
| ----- | -------------------- | ----- | ----------- | ------------------------- | ------------- |
| 0     | rhythm_8_1 (NEW)     | 144   | DISCOVERY   | q-h-q syncopation intro   | 62            |
| 1     | rhythm_8_2 (NEW)     | 145   | PRACTICE    | q-h-q practice            | 70            |
| 2     | rhythm_8_3 (was \_1) | 146   | DISCOVERY   | 8-q-8 syncopation intro   | 67            |
| 3     | rhythm_8_4 (was \_2) | 147   | PRACTICE    | 8-q-8 practice            | 72            |
| 4     | rhythm_8_5 (was \_3) | 148   | DISCOVERY   | Dotted-quarter-eighth     | 70            |
| 5     | rhythm_8_6 (was \_4) | 149   | PRACTICE    | Mixed syncopation phrases | 75            |
| 6     | rhythm_8_7 (was \_6) | 150   | SPEED_ROUND | Cumulative speed          | 83            |
| 7     | boss_rhythm_8        | 151   | BOSS        | Final boss                | 80            |

## Tag strategy

New tag: **`long-syncopation`** — distinguishes q-h-q (long-value) syncopation from the fast `syncopation` (8-q-8) and `dotted-syncopation` patterns. Added to:

- `rhythmPatterns.test.js` `VALID_TAGS` taxonomy
- New rhythm_8_1 and rhythm_8_2 `patternTags`
- Speed node (rhythm_8_7) cumulative pool
- Boss node (boss_rhythm_8) cumulative pool

## Pattern combinatorics constraint

With pure `[q, h]` durations in 4/4 (16 sixteenth-cells per bar), only **5 unique onset patterns** exist:

| Shape     | Pattern                           | Syncopated?                              |
| --------- | --------------------------------- | ---------------------------------------- |
| q q q q   | [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] | no — baseline                            |
| h h       | [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0] | no — calm                                |
| h q q     | [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0] | no                                       |
| q q h     | [1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0] | no                                       |
| **q h q** | [1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0] | **yes** — half on beat 2 crossing beat 3 |

User spec asked for 8-12 patterns; combinatorics cap at 5. Shipping 5 — adding eighth notes or rests to expand the pool would defeat the "longer note values, gentler intro" pedagogy.

## Tasks

### Task 1 — Add patterns (`src/data/patterns/rhythmPatterns.js`)

- Insert 5 new patterns tagged `["long-syncopation"]` (the canonical q-h-q also gets `"syncopation"` since it IS syncopation; non-syncopated fillers do NOT get `"syncopation"` to avoid polluting old node 8_3's pool).
- IDs: `lsyn_44_001` through `lsyn_44_005`.

### Task 2 — Restructure Unit 8 nodes (`src/data/units/rhythmUnit8Redesigned.js`)

- Update JSDoc header (8 nodes; ramp described).
- Insert two new nodes at the top, then re-id existing nodes per the table above.
- Update each node's `order`, `orderInUnit`, `prerequisites`.
- Add `long-syncopation` to speed and boss `patternTags` pools.

### Task 3 — Tests

- File: `src/data/units/rhythmUnit8Redesigned.test.js`
  - `toHaveLength(6)` → `8`
  - Expected ID list shifts to include `_5`
  - Orders `[144..151]`
  - Regular-nodes slice `slice(0, 7)`
  - First-node assertion: q-h-q copy + durations include `"h"`
  - "third node introduces dotted" → "fifth node introduces dotted" (index 4)
  - Exercise-type policy array: 7 entries
  - xpReward range: relax min to 70 (new node 1 is 70 XP)
  - tempo-increases: compare `[0]` against `[length-2]`
- File: `src/data/patterns/rhythmPatterns.test.js`
  - Add `"long-syncopation"` to `VALID_TAGS`
  - Update "all 15 tags" → "all 16 tags"

### Task 4 — Verify

- `npm run test:run`
- `npm run verify:trail`
- `npm run verify:patterns`

## must_haves

- truth-1: Unit 8 exports exactly 8 nodes
- truth-2: First node uses durations `["q","h"]` with `patternTags` including `"long-syncopation"`
- truth-3: Boss `patternTags` includes `"long-syncopation"`
- truth-4: All 3 verify scripts pass
- truth-5: All Unit 8 tests pass
- truth-6: All pattern tests pass
- truth-7: Prerequisite chain unbroken: boss_rhythm_7 → 8_1 → … → 8_7 → boss_rhythm_8
