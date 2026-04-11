# Rhythm Trail Curriculum Audit

**Phase:** 20-curriculum-audit
**Date:** 2026-04-11
**Status:** LOCKED -- Phase 22 implementation must follow this document exactly

**Scope:** 56 rhythm nodes across 8 units (7 nodes per unit)

---

## Game-Type Policy

The following table maps each `NODE_TYPE` to its required exercise type. This policy governs all 56 rhythm nodes.

| Node Type   | Required Exercise Type | Rationale                                                                                                                                               |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DISCOVERY   | `mixed_lesson`         | Notation-weighted: heavier on `rhythm_tap` (notation-showing) questions, with `visual_recognition` and `syllable_matching` for variety (per D-03, D-14) |
| PRACTICE    | `mixed_lesson`         | Balanced mix of all question types for reinforcement (per D-04)                                                                                         |
| MIX_UP      | `mixed_lesson`         | Varied question types keep engagement high (per D-05)                                                                                                   |
| REVIEW      | `mixed_lesson`         | Spaced repetition across multiple question formats (per D-06)                                                                                           |
| MINI_BOSS   | `mixed_lesson`         | Longer session covering all unit concepts (per D-09)                                                                                                    |
| CHALLENGE   | `arcade_rhythm`        | Pressure-based engagement challenge (per D-07)                                                                                                          |
| SPEED_ROUND | `arcade_rhythm`        | Timed arcade challenge at elevated tempo (per D-08)                                                                                                     |
| BOSS        | `arcade_rhythm`        | Ultimate mastery test in arcade format (per D-10)                                                                                                       |

Nodes with types DISCOVERY, PRACTICE, MIX_UP, REVIEW, and MINI_BOSS use `mixed_lesson`. Nodes with types CHALLENGE, SPEED_ROUND, and BOSS use `arcade_rhythm`. Per D-11, D-12, D-13.

---

## One-Concept Rule

A "musical concept" is defined as: a new duration value (e.g., quarter note, half note, eighth note, quarter rest, dotted half, sixteenth note) OR a new time signature (e.g., 3/4, 6/8). Only musical concepts count. (per D-15)

- Game mode changes (e.g., first time encountering arcade mode, first time doing rhythm_tap) do NOT count as a concept introduction. (per D-16)
- A node that introduces two or more musical concepts is a VIOLATION. Example: introducing both "half note" and "quarter rest" on the same node. (per D-17)
- How to identify what a node introduces: check `focusDurations` array (non-empty = new duration), `newContentDescription` field (mentions new duration/time sig), and whether `timeSignature` differs from all prior nodes.

### Concept Introduction Order (cumulative)

| Unit | Node       | Concept Introduced              | Cumulative Duration Vocabulary          |
| ---- | ---------- | ------------------------------- | --------------------------------------- |
| 1    | rhythm_1_1 | Quarter note (`q`)              | q                                       |
| 1    | rhythm_1_3 | Half note (`h`)                 | q, h                                    |
| 2    | rhythm_2_1 | Whole note (`w`)                | q, h, w                                 |
| 3    | rhythm_3_1 | Eighth note (`8`)               | q, h, w, 8                              |
| 4    | rhythm_4_1 | Quarter rest (`qr`)             | q, h, w, 8, qr                          |
| 4    | rhythm_4_3 | Half rest (`hr`)                | q, h, w, 8, qr, hr                      |
| 4    | rhythm_4_5 | Whole rest (`wr`)               | q, h, w, 8, qr, hr, wr                  |
| 5    | rhythm_5_1 | Dotted half note (`hd`)         | q, h, w, 8, qr, hr, wr, hd              |
| 5    | rhythm_5_3 | 3/4 time signature              | + 3/4 time sig                          |
| 5    | rhythm_5_4 | Dotted quarter note (`qd`)      | q, h, w, 8, qr, hr, wr, hd, qd          |
| 6    | rhythm_6_1 | Sixteenth note (`16`)           | q, h, w, 8, qr, hr, wr, hd, qd, 16      |
| 7    | rhythm_7_1 | 6/8 time signature              | + 6/8 time sig                          |
| 7    | rhythm_7_3 | Quarter notes in 6/8 context    | (context application, not new duration) |
| 8    | rhythm_8_1 | Syncopation pattern (8th-q-8th) | (context application)                   |
| 8    | rhythm_8_3 | Dotted quarter syncopation      | (context application in 4/4)            |

---

## Node-by-Node Audit

### Unit 1: Rhythm Starters

| Node ID       | Name                         | nodeType    | Current Exercises                                                                                    | Concept Introduced   | Violations                                                                             | Remediation                                                                               |
| ------------- | ---------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| rhythm_1_1    | Meet Quarter Notes           | discovery   | `mixed_lesson` (1 exercise, 8 questions: 2x rhythm_tap, 3x visual_recognition, 3x syllable_matching) | Quarter note (`q`)   | None                                                                                   | None needed                                                                               |
| rhythm_1_2    | Practice Quarter Notes       | practice    | `mixed_lesson` (1 exercise, 8 questions: 2x rhythm_tap, 3x visual_recognition, 3x syllable_matching) | None (reinforcement) | None                                                                                   | None needed                                                                               |
| rhythm_1_3    | Meet Half Notes              | discovery   | `mixed_lesson` (1 exercise, 8 questions: 2x rhythm_tap, 3x visual_recognition, 3x syllable_matching) | Half note (`h`)      | None                                                                                   | None needed                                                                               |
| rhythm_1_4    | Practice Quarters and Halves | practice    | `rhythm_dictation`, `visual_recognition`, `syllable_matching` (3 separate exercises)                 | None (reinforcement) | Exercise type: has 3 separate exercises instead of single `mixed_lesson`               | Collapse into single `mixed_lesson` with interleaved question sequence                    |
| rhythm_1_5    | Rhythm Patterns              | mix_up      | `rhythm_tap`, `visual_recognition`, `syllable_matching` (3 separate exercises)                       | None (reinforcement) | Exercise type: has 3 separate exercises instead of single `mixed_lesson`               | Collapse into single `mixed_lesson` with interleaved question sequence                    |
| rhythm_1_6    | Speed Challenge              | speed_round | `rhythm`, `visual_recognition`, `syllable_matching` (3 separate exercises)                           | None (reinforcement) | Exercise type: should be `arcade_rhythm`, currently has `rhythm` + 2 multi-angle games | Change to single `arcade_rhythm` exercise                                                 |
| boss_rhythm_1 | Basic Beats Master           | mini_boss   | `arcade_rhythm` (1 exercise)                                                                         | None (reinforcement) | Exercise type: uses `arcade_rhythm` but MINI_BOSS requires `mixed_lesson` (per D-09)   | Change from `arcade_rhythm` to `mixed_lesson` (longer session covering all unit concepts) |

### Unit 2: Beat Builders

| Node ID       | Name                 | nodeType    | Current Exercises                                                              | Concept Introduced                                  | Violations                                                                           | Remediation                                                                               |
| ------------- | -------------------- | ----------- | ------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| rhythm_2_1    | Meet Whole Notes     | discovery   | `rhythm` (1 exercise)                                                          | Whole note (`w`)                                    | Exercise type: uses `rhythm` instead of `mixed_lesson`                               | Change to single `mixed_lesson` with notation-weighted question sequence                  |
| rhythm_2_2    | Practice Whole Notes | practice    | `rhythm` (1 exercise)                                                          | None (reinforcement)                                | Exercise type: uses `rhythm` instead of `mixed_lesson`                               | Change to single `mixed_lesson` with balanced question sequence                           |
| rhythm_2_3    | Long and Short       | discovery   | `rhythm_tap`, `visual_recognition`, `syllable_matching` (3 separate exercises) | None (reinforcement -- contrast of known durations) | Exercise type: has 3 separate exercises instead of single `mixed_lesson`             | Collapse into single `mixed_lesson` with interleaved question sequence                    |
| rhythm_2_4    | All Basic Durations  | practice    | `rhythm_dictation` (1 exercise)                                                | None (reinforcement)                                | Exercise type: uses `rhythm_dictation` instead of `mixed_lesson`                     | Change to single `mixed_lesson` with balanced question sequence                           |
| rhythm_2_5    | Duration Mix         | mix_up      | `rhythm_tap` (1 exercise)                                                      | None (reinforcement)                                | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`                           | Change to single `mixed_lesson` with varied question sequence                             |
| rhythm_2_6    | Speed Basics         | speed_round | `rhythm` (1 exercise)                                                          | None (reinforcement)                                | Exercise type: uses `rhythm` instead of `arcade_rhythm`                              | Change to single `arcade_rhythm` exercise                                                 |
| boss_rhythm_2 | Duration Master      | mini_boss   | `arcade_rhythm` (1 exercise)                                                   | None (reinforcement)                                | Exercise type: uses `arcade_rhythm` but MINI_BOSS requires `mixed_lesson` (per D-09) | Change from `arcade_rhythm` to `mixed_lesson` (longer session covering all unit concepts) |

### Unit 3: Fast Note Friends

| Node ID       | Name                  | nodeType    | Current Exercises               | Concept Introduced                                  | Violations                                                                           | Remediation                                                                               |
| ------------- | --------------------- | ----------- | ------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| rhythm_3_1    | Meet Eighth Notes     | discovery   | `rhythm` (1 exercise)           | Eighth note (`8`)                                   | Exercise type: uses `rhythm` instead of `mixed_lesson`                               | Change to single `mixed_lesson` with notation-weighted question sequence                  |
| rhythm_3_2    | Practice Eighth Notes | practice    | `rhythm` (1 exercise)           | None (reinforcement)                                | Exercise type: uses `rhythm` instead of `mixed_lesson`                               | Change to single `mixed_lesson` with balanced question sequence                           |
| rhythm_3_3    | Running and Walking   | discovery   | `rhythm_tap` (1 exercise)       | None (reinforcement -- contrast of known durations) | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`                           | Change to single `mixed_lesson` with notation-weighted question sequence                  |
| rhythm_3_4    | Mix It Up             | practice    | `rhythm_dictation` (1 exercise) | None (reinforcement)                                | Exercise type: uses `rhythm_dictation` instead of `mixed_lesson`                     | Change to single `mixed_lesson` with balanced question sequence                           |
| rhythm_3_5    | Rhythm Variety        | mix_up      | `rhythm_tap` (1 exercise)       | None (reinforcement)                                | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`                           | Change to single `mixed_lesson` with varied question sequence                             |
| rhythm_3_6    | Speed Running         | speed_round | `rhythm` (1 exercise)           | None (reinforcement)                                | Exercise type: uses `rhythm` instead of `arcade_rhythm`                              | Change to single `arcade_rhythm` exercise                                                 |
| boss_rhythm_3 | Running Notes Master  | mini_boss   | `arcade_rhythm` (1 exercise)    | None (reinforcement)                                | Exercise type: uses `arcade_rhythm` but MINI_BOSS requires `mixed_lesson` (per D-09) | Change from `arcade_rhythm` to `mixed_lesson` (longer session covering all unit concepts) |

### Unit 4: Quiet Moments

| Node ID       | Name                   | nodeType    | Current Exercises               | Concept Introduced   | Violations                                                                           | Remediation                                                                               |
| ------------- | ---------------------- | ----------- | ------------------------------- | -------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| rhythm_4_1    | Meet Quarter Rest      | discovery   | `rhythm` (1 exercise)           | Quarter rest (`qr`)  | Exercise type: uses `rhythm` instead of `mixed_lesson`                               | Change to single `mixed_lesson` with notation-weighted question sequence                  |
| rhythm_4_2    | Practice Quarter Rests | practice    | `rhythm` (1 exercise)           | None (reinforcement) | Exercise type: uses `rhythm` instead of `mixed_lesson`                               | Change to single `mixed_lesson` with balanced question sequence                           |
| rhythm_4_3    | Meet Half Rest         | discovery   | `rhythm_tap` (1 exercise)       | Half rest (`hr`)     | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`                           | Change to single `mixed_lesson` with notation-weighted question sequence                  |
| rhythm_4_4    | Practice Rests         | practice    | `rhythm_dictation` (1 exercise) | None (reinforcement) | Exercise type: uses `rhythm_dictation` instead of `mixed_lesson`                     | Change to single `mixed_lesson` with balanced question sequence                           |
| rhythm_4_5    | Meet Whole Rest        | discovery   | `rhythm_tap` (1 exercise)       | Whole rest (`wr`)    | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`                           | Change to single `mixed_lesson` with notation-weighted question sequence                  |
| rhythm_4_6    | Speed Silence          | speed_round | `rhythm` (1 exercise)           | None (reinforcement) | Exercise type: uses `rhythm` instead of `arcade_rhythm`                              | Change to single `arcade_rhythm` exercise                                                 |
| boss_rhythm_4 | Silence Master         | mini_boss   | `arcade_rhythm` (1 exercise)    | None (reinforcement) | Exercise type: uses `arcade_rhythm` but MINI_BOSS requires `mixed_lesson` (per D-09) | Change from `arcade_rhythm` to `mixed_lesson` (longer session covering all unit concepts) |

### Unit 5: Magic Dots

| Node ID       | Name                      | nodeType    | Current Exercises                           | Concept Introduced                | Violations                                                                                                           | Remediation                                                                                                        |
| ------------- | ------------------------- | ----------- | ------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| rhythm_5_1    | Meet Dotted Half Notes    | discovery   | `rhythm` (1 exercise)                       | Dotted half note (`hd`)           | Exercise type: uses `rhythm` instead of `mixed_lesson`                                                               | Change to single `mixed_lesson` with notation-weighted question sequence                                           |
| rhythm_5_2    | Practice Dotted Halves    | practice    | `rhythm` (1 exercise)                       | None (reinforcement)              | Exercise type: uses `rhythm` instead of `mixed_lesson`                                                               | Change to single `mixed_lesson` with balanced question sequence                                                    |
| rhythm_5_3    | Waltz Time (3/4)          | discovery   | `rhythm_tap` (1 exercise)                   | 3/4 time signature (new time sig) | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`                                                           | Change to single `mixed_lesson` with notation-weighted question sequence                                           |
| rhythm_5_4    | Meet Dotted Quarter Notes | discovery   | `rhythm_dictation` (1 exercise)             | Dotted quarter note (`qd`)        | Exercise type: uses `rhythm_dictation` instead of `mixed_lesson`                                                     | Change to single `mixed_lesson` with notation-weighted question sequence                                           |
| rhythm_5_5    | Practice All Dotted Notes | practice    | `rhythm_tap` (1 exercise)                   | None (reinforcement)              | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`                                                           | Change to single `mixed_lesson` with balanced question sequence                                                    |
| rhythm_5_6    | Speed Dots                | speed_round | `rhythm` (1 exercise)                       | None (reinforcement)              | Exercise type: uses `rhythm` instead of `arcade_rhythm`                                                              | Change to single `arcade_rhythm` exercise                                                                          |
| boss_rhythm_5 | Dotted Notes Master       | mini_boss   | `arcade_rhythm` x2 (2 exercises: 4/4 + 3/4) | None (reinforcement)              | Exercise type: uses `arcade_rhythm` but MINI_BOSS requires `mixed_lesson` (per D-09). Also has 2 separate exercises. | Change from 2x `arcade_rhythm` to single `mixed_lesson` (longer session covering dotted notes + 3/4 time concepts) |

### Unit 6: Speed Champions

| Node ID       | Name                     | nodeType    | Current Exercises               | Concept Introduced                             | Violations                                                       | Remediation                                                              |
| ------------- | ------------------------ | ----------- | ------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| rhythm_6_1    | Meet Sixteenth Notes     | discovery   | `rhythm` (1 exercise)           | Sixteenth note (`16`)                          | Exercise type: uses `rhythm` instead of `mixed_lesson`           | Change to single `mixed_lesson` with notation-weighted question sequence |
| rhythm_6_2    | Practice Sixteenth Notes | practice    | `rhythm` (1 exercise)           | None (reinforcement)                           | Exercise type: uses `rhythm` instead of `mixed_lesson`           | Change to single `mixed_lesson` with balanced question sequence          |
| rhythm_6_3    | Sixteenths and Eighths   | discovery   | `rhythm_tap` (1 exercise)       | None (reinforcement -- mixing known durations) | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`       | Change to single `mixed_lesson` with notation-weighted question sequence |
| rhythm_6_4    | Fast and Faster          | practice    | `rhythm_dictation` (1 exercise) | None (reinforcement)                           | Exercise type: uses `rhythm_dictation` instead of `mixed_lesson` | Change to single `mixed_lesson` with balanced question sequence          |
| rhythm_6_5    | All Rhythms              | mix_up      | `rhythm_tap` (1 exercise)       | None (reinforcement)                           | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`       | Change to single `mixed_lesson` with varied question sequence            |
| rhythm_6_6    | Speed Master             | speed_round | `rhythm` (1 exercise)           | None (reinforcement)                           | Exercise type: uses `rhythm` instead of `arcade_rhythm`          | Change to single `arcade_rhythm` exercise                                |
| boss_rhythm_6 | Rhythm Champion          | boss        | `arcade_rhythm` (1 exercise)    | None (reinforcement)                           | None                                                             | None needed                                                              |

### Unit 7: Big Beats

| Node ID       | Name               | nodeType    | Current Exercises               | Concept Introduced                                                                                                                                                                                                                                                                           | Violations                                                                                                                             | Remediation                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | ------------------ | ----------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rhythm_7_1    | Two Big Beats      | discovery   | `rhythm` (1 exercise)           | 6/8 time signature (new time sig). Note: `focusDurations: ['qd']` but dotted quarter was already introduced in Unit 5 Node 4. The new concept is the 6/8 compound meter, not the dotted quarter itself. No violation -- single concept (6/8 time sig).                                       | Exercise type: uses `rhythm` instead of `mixed_lesson`                                                                                 | Change to single `mixed_lesson` with notation-weighted question sequence                                                                                                                                                                                                                                                                                                                       |
| rhythm_7_2    | Feel the Pulse     | practice    | `rhythm` (1 exercise)           | None (reinforcement)                                                                                                                                                                                                                                                                         | Exercise type: uses `rhythm` instead of `mixed_lesson`                                                                                 | Change to single `mixed_lesson` with balanced question sequence                                                                                                                                                                                                                                                                                                                                |
| rhythm_7_3    | Adding Quarters    | discovery   | `rhythm_tap` (1 exercise)       | Quarter notes in 6/8 context (`focusDurations: ['q']`). Note: quarter notes were introduced in Unit 1 -- this is applying them in a new time-signature context. Not a new musical concept per D-15 (not a new duration value or time signature).                                             | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`                                                                             | Change to single `mixed_lesson` with notation-weighted question sequence                                                                                                                                                                                                                                                                                                                       |
| rhythm_7_4    | Mixing It Up       | practice    | `rhythm_dictation` (1 exercise) | VIOLATION: `focusDurations: ['8']` but nodeType is `practice`. Eighth notes were introduced in Unit 3 -- this is their first appearance in 6/8 context. However, practice nodes should reinforce, not introduce new concepts. `focusDurations` being non-empty signals concept introduction. | Exercise type: uses `rhythm_dictation` instead of `mixed_lesson`. One-concept violation: practice node has non-empty `focusDurations`. | Change to single `mixed_lesson` with balanced question sequence. Additionally: either (a) remove `'8'` from `focusDurations` and move to `contextDurations` (treating 8th notes in 6/8 as reinforcement of a known duration), OR (b) change nodeType to `discovery`. Recommended: option (a) -- eighth notes are already known from Unit 3; their use in 6/8 is contextual, not a new concept. |
| rhythm_7_5    | Compound Cocktail  | mix_up      | `rhythm_tap` (1 exercise)       | None (reinforcement)                                                                                                                                                                                                                                                                         | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`                                                                             | Change to single `mixed_lesson` with varied question sequence                                                                                                                                                                                                                                                                                                                                  |
| rhythm_7_6    | Quick Beats        | speed_round | `rhythm` (1 exercise)           | None (reinforcement)                                                                                                                                                                                                                                                                         | Exercise type: uses `rhythm` instead of `arcade_rhythm`                                                                                | Change to single `arcade_rhythm` exercise                                                                                                                                                                                                                                                                                                                                                      |
| boss_rhythm_7 | Compound Commander | mini_boss   | `arcade_rhythm` (1 exercise)    | None (reinforcement)                                                                                                                                                                                                                                                                         | Exercise type: uses `arcade_rhythm` but MINI_BOSS requires `mixed_lesson` (per D-09)                                                   | Change from `arcade_rhythm` to `mixed_lesson` (longer session covering all 6/8 concepts)                                                                                                                                                                                                                                                                                                       |

### Unit 8: Off-Beat Magic

| Node ID       | Name                | nodeType    | Current Exercises                                                                 | Concept Introduced                                                                                                                                                                                               | Violations                                                       | Remediation                                                                                                                                  |
| ------------- | ------------------- | ----------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| rhythm_8_1    | Off-Beat Surprise   | discovery   | `rhythm` (1 exercise)                                                             | Syncopation pattern (eighth-quarter-eighth in 4/4). `focusDurations: ['8']` but eighth notes are already known -- the newness is the syncopation context. Single concept: syncopation pattern.                   | Exercise type: uses `rhythm` instead of `mixed_lesson`           | Change to single `mixed_lesson` with notation-weighted question sequence                                                                     |
| rhythm_8_2    | Between the Beats   | practice    | `rhythm` (1 exercise)                                                             | None (reinforcement)                                                                                                                                                                                             | Exercise type: uses `rhythm` instead of `mixed_lesson`           | Change to single `mixed_lesson` with balanced question sequence                                                                              |
| rhythm_8_3    | Dotted Groove       | discovery   | `rhythm_tap` (1 exercise)                                                         | Dotted quarter-eighth syncopation pattern. `focusDurations: ['qd']` but dotted quarter was introduced in Unit 5. The newness is the syncopation application. Single concept: dotted quarter syncopation pattern. | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`       | Change to single `mixed_lesson` with notation-weighted question sequence                                                                     |
| rhythm_8_4    | Swing and Sway      | practice    | `rhythm_dictation` (1 exercise)                                                   | None (reinforcement)                                                                                                                                                                                             | Exercise type: uses `rhythm_dictation` instead of `mixed_lesson` | Change to single `mixed_lesson` with balanced question sequence                                                                              |
| rhythm_8_5    | Syncopation Shuffle | mix_up      | `rhythm_tap` (1 exercise)                                                         | None (reinforcement)                                                                                                                                                                                             | Exercise type: uses `rhythm_tap` instead of `mixed_lesson`       | Change to single `mixed_lesson` with varied question sequence                                                                                |
| rhythm_8_6    | Rapid Syncopation   | speed_round | `rhythm` (1 exercise)                                                             | None (reinforcement)                                                                                                                                                                                             | Exercise type: uses `rhythm` instead of `arcade_rhythm`          | Change to single `arcade_rhythm` exercise                                                                                                    |
| boss_rhythm_8 | Rhythm Master       | boss        | `arcade_rhythm` x3 (3 exercises: 6/8 review, 4/4 syncopation, combined challenge) | None (reinforcement)                                                                                                                                                                                             | None                                                             | None needed (BOSS node correctly uses `arcade_rhythm`). Note: has 3 sequential exercises which is the intended design for the capstone boss. |

---

## Remediation Summary

- **Total nodes:** 56
- **Nodes with exercise type violations:** 51
- **Nodes with one-concept violations:** 1 (rhythm_7_4 -- also counted in exercise type violations)
- **Nodes with no violations:** 5

### Nodes Requiring No Changes (5)

- `rhythm_1_1` -- discovery, already `mixed_lesson`
- `rhythm_1_2` -- practice, already `mixed_lesson`
- `rhythm_1_3` -- discovery, already `mixed_lesson`
- `boss_rhythm_6` -- boss, already `arcade_rhythm`
- `boss_rhythm_8` -- boss, already `arcade_rhythm` (3 exercises, intended design)

Note: While rhythm_1_1, rhythm_1_2, and rhythm_1_3 have correct exercise types, their question sequences may benefit from review during Phase 22 (they currently have 2x rhythm_tap, 3x visual_recognition, 3x syllable_matching -- discovery nodes should be notation-weighted with more rhythm_tap).

### Exercise Type Remediations

**Change to `mixed_lesson`:** (43 nodes)

- Unit 1: `rhythm_1_4`, `rhythm_1_5`
- Unit 2: `rhythm_2_1`, `rhythm_2_2`, `rhythm_2_3`, `rhythm_2_4`, `rhythm_2_5`
- Unit 3: `rhythm_3_1`, `rhythm_3_2`, `rhythm_3_3`, `rhythm_3_4`, `rhythm_3_5`
- Unit 4: `rhythm_4_1`, `rhythm_4_2`, `rhythm_4_3`, `rhythm_4_4`, `rhythm_4_5`
- Unit 5: `rhythm_5_1`, `rhythm_5_2`, `rhythm_5_3`, `rhythm_5_4`, `rhythm_5_5`
- Unit 6: `rhythm_6_1`, `rhythm_6_2`, `rhythm_6_3`, `rhythm_6_4`, `rhythm_6_5`
- Unit 7: `rhythm_7_1`, `rhythm_7_2`, `rhythm_7_3`, `rhythm_7_4`, `rhythm_7_5`
- Unit 8: `rhythm_8_1`, `rhythm_8_2`, `rhythm_8_3`, `rhythm_8_4`, `rhythm_8_5`
- Mini-bosses (currently `arcade_rhythm` -> `mixed_lesson`): `boss_rhythm_1`, `boss_rhythm_2`, `boss_rhythm_3`, `boss_rhythm_4`, `boss_rhythm_5`, `boss_rhythm_7`

**Change to `arcade_rhythm`:** (8 nodes -- all SPEED_ROUND nodes currently using `rhythm`)

- Unit 1: `rhythm_1_6`
- Unit 2: `rhythm_2_6`
- Unit 3: `rhythm_3_6`
- Unit 4: `rhythm_4_6`
- Unit 5: `rhythm_5_6`
- Unit 6: `rhythm_6_6`
- Unit 7: `rhythm_7_6`
- Unit 8: `rhythm_8_6`

### One-Concept Remediations

**1 node with concept violation:**

- `rhythm_7_4` (Mixing It Up) -- Practice node has `focusDurations: ['8']` which signals concept introduction. Eighth notes are already known from Unit 3; their use in 6/8 is contextual reinforcement. **Remediation:** Move `'8'` from `focusDurations` to `contextDurations` (i.e., set `focusDurations: []`). This correctly marks eighth notes in 6/8 as reinforcement of a known duration, not a new concept.

### Multi-Exercise Consolidation

The following nodes currently have multiple separate exercises that should be consolidated into a single exercise:

**Collapse to single `mixed_lesson`:** (3 nodes)

- `rhythm_1_4` -- currently: `rhythm_dictation` + `visual_recognition` + `syllable_matching` (3 exercises) -> single `mixed_lesson`
- `rhythm_1_5` -- currently: `rhythm_tap` + `visual_recognition` + `syllable_matching` (3 exercises) -> single `mixed_lesson`
- `rhythm_2_3` -- currently: `rhythm_tap` + `visual_recognition` + `syllable_matching` (3 exercises) -> single `mixed_lesson`

**Collapse to single `arcade_rhythm`:** (1 node)

- `rhythm_1_6` -- currently: `rhythm` + `visual_recognition` + `syllable_matching` (3 exercises) -> single `arcade_rhythm`

**Collapse multiple same-type to single `mixed_lesson`:** (1 node)

- `boss_rhythm_5` -- currently: 2x `arcade_rhythm` (4/4 and 3/4) -> single `mixed_lesson` (covering both time signatures in interleaved questions)

**Keep multi-exercise as-is:** (1 node)

- `boss_rhythm_8` -- 3x `arcade_rhythm` is the intended design for the capstone boss (sequential exercises testing different aspects)

---

## Question Mix Guidelines

Recommended question distributions for `mixed_lesson` nodes by nodeType:

| nodeType  | rhythm_tap | visual_recognition | syllable_matching | Total Questions |
| --------- | ---------- | ------------------ | ----------------- | --------------- |
| DISCOVERY | 3-4        | 2                  | 2                 | 7-8             |
| PRACTICE  | 2-3        | 2-3                | 2-3               | 8               |
| MIX_UP    | 2          | 3                  | 3                 | 8               |
| MINI_BOSS | 3-4        | 3-4                | 3-4               | 10-12           |

Discovery nodes are notation-weighted per D-14 -- more `rhythm_tap` (which shows notation) questions. Practice/MIX_UP nodes have balanced distribution. MINI_BOSS nodes have longer sessions covering all unit concepts per D-09.

### Example Question Sequences

**DISCOVERY (notation-weighted, 8 questions):**

```
rhythm_tap, visual_recognition, syllable_matching, rhythm_tap, rhythm_tap, visual_recognition, syllable_matching, rhythm_tap
```

**PRACTICE (balanced, 8 questions):**

```
rhythm_tap, visual_recognition, syllable_matching, rhythm_tap, visual_recognition, syllable_matching, rhythm_tap, visual_recognition
```

**MIX_UP (variety-focused, 8 questions):**

```
visual_recognition, rhythm_tap, syllable_matching, visual_recognition, syllable_matching, rhythm_tap, visual_recognition, syllable_matching
```

**MINI_BOSS (comprehensive, 12 questions):**

```
rhythm_tap, visual_recognition, syllable_matching, rhythm_tap, visual_recognition, syllable_matching, rhythm_tap, visual_recognition, syllable_matching, rhythm_tap, visual_recognition, syllable_matching
```

---

## Unit Narrative Notes

### Unit 1: Rhythm Starters

Introduces the two foundational note values -- quarter notes (1 beat) and half notes (2 beats) -- in 4/4 time. The unit begins with discovery of quarter notes, then adds half notes as a contrast. All subsequent nodes reinforce these two durations through varied game types before the mini-boss assessment. This is the only unit where nodes 1-3 already use `mixed_lesson` format (from Phase 25).

### Unit 2: Beat Builders

Completes the basic duration vocabulary by introducing whole notes (4 beats). The pedagogical arc emphasizes contrast between the shortest (quarter) and longest (whole) known durations. Node 3 is a contrast node that pairs these extremes. All basic durations (1, 2, 4 beats) are mastered before moving to faster subdivisions.

### Unit 3: Fast Note Friends

Introduces eighth notes (1/2 beat), the first subdivision below the beat. The metaphor of "walking vs running" makes the speed difference tangible for young learners. The contrast node (Node 3) mixes eighth notes with quarters and halves to build fluency across all simple durations before the unit boss.

### Unit 4: Quiet Moments

A dedicated rests unit with three Discovery nodes -- one for each rest type (quarter rest, half rest, whole rest). This unit teaches that silence is intentional and counted, not merely absence of sound. The pedagogical sequence introduces progressively longer silences, building comfort with counting empty beats.

### Unit 5: Magic Dots

Introduces dotted notes and the 3/4 time signature. This is the most concept-dense unit with 4 Discovery nodes: dotted half (3 beats), 3/4 time, and dotted quarter (1.5 beats). The dotted half note naturally leads to 3/4 time (where it fills a complete measure), creating a logical connection. The dotted quarter pairs with eighth notes for the classic long-short rhythm.

### Unit 6: Speed Champions

Introduces sixteenth notes (1/4 beat) -- the fastest subdivision in the curriculum. This is the first unit to end with a true BOSS node rather than a MINI_BOSS, marking it as a major trail milestone. The unit builds from isolated sixteenth notes to mixing them with all previously learned durations for a comprehensive rhythm vocabulary review.

### Unit 7: Big Beats

Introduces 6/8 compound meter -- a fundamentally different way of feeling rhythm (two big beats per bar instead of four). The dotted quarter serves as the natural beat unit of 6/8. Quarter notes and eighth notes are recontextualized within compound meter. This unit builds the rhythmic foundation needed for the syncopation patterns in Unit 8.

### Unit 8: Off-Beat Magic

The capstone unit introduces syncopation -- playing between the beats -- in both eighth-quarter-eighth and dotted quarter-eighth patterns. This is the most musically sophisticated concept in the rhythm trail. The true BOSS node is a three-exercise epic challenge covering both 6/8 compound meter (from Unit 7) and 4/4 syncopation, serving as the ultimate rhythm mastery test.

---

## Appendix: Current vs Target State Summary

| Metric                                          | Current                                                           | Target                                          |
| ----------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| Nodes using `mixed_lesson`                      | 3 (rhythm_1_1, rhythm_1_2, rhythm_1_3)                            | 46 (all discovery, practice, mix_up, mini_boss) |
| Nodes using `arcade_rhythm`                     | 8 (6 mini_bosses + 2 bosses)                                      | 10 (8 speed_rounds + 2 bosses)                  |
| Nodes using `rhythm` (sole exercise)            | 21                                                                | 0                                               |
| Nodes using `rhythm_tap` (sole exercise)        | 13                                                                | 0                                               |
| Nodes using `rhythm_dictation` (sole exercise)  | 7                                                                 | 0                                               |
| Nodes with multi-exercise (needs consolidation) | 5 (rhythm_1_4, rhythm_1_5, rhythm_1_6, rhythm_2_3, boss_rhythm_5) | 1 (boss_rhythm_8 intentional)                   |
| One-concept violations                          | 1 (rhythm_7_4)                                                    | 0                                               |
