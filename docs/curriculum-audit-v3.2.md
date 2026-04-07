# Rhythm Trail Curriculum Audit — v3.2

**Date:** 2026-04-06
**Scope:** All 48 rhythm nodes + 8 boss nodes across 8 unit files
**Purpose:** Lock game-type policy and one-concept compliance before Phase 22 implementation
**Status:** Reference document — no source files modified

---

## Game-Type Policy

Per decisions D-04 through D-11 from CONTEXT.md, each node type has a required exercise type and game component:

| Node Type   | Required Exercise Type         | Game Component                           | Policy Source |
| ----------- | ------------------------------ | ---------------------------------------- | ------------- |
| DISCOVERY   | RHYTHM_TAP or RHYTHM_DICTATION | RhythmReadingGame or RhythmDictationGame | D-04          |
| PRACTICE    | RHYTHM_TAP                     | MetronomeTrainer (echo mode)             | D-05          |
| MIX_UP      | RHYTHM_DICTATION               | RhythmDictationGame                      | D-06          |
| REVIEW      | RHYTHM_TAP                     | MetronomeTrainer                         | D-07          |
| CHALLENGE   | RHYTHM_TAP                     | MetronomeTrainer (harder)                | D-08          |
| SPEED_ROUND | ARCADE_RHYTHM                  | ArcadeRhythmGame                         | D-09          |
| MINI_BOSS   | RHYTHM_TAP                     | RhythmReadingGame                        | D-10          |
| BOSS        | ARCADE_RHYTHM                  | ArcadeRhythmGame                         | D-11          |

> **Open Question:** RHYTHM_TAP may map to either MetronomeTrainer (echo mode) or RhythmReadingGame (notation-showing). Phase 22 must verify the exercise-type-to-component binding. The policy above specifies the intended game behavior; the correct EXERCISE_TYPES constant will be confirmed during implementation.

---

## One-Concept Rule

Definitions per decisions D-12 through D-14:

- **D-12:** One concept = one new duration value. Each duration (quarter, half, eighth, etc.) is its own concept.
- **D-13:** Time signature changes (e.g. 4/4 to 3/4) count as their own concept and cannot pair with a new duration introduction.
- **D-14:** Any node introducing two or more new elements (duration + duration, or duration + time signature) is a CURR-01 violation.

---

## Kodaly Ordering

Per decisions D-15 through D-17:

**Expected Kodaly order:** quarter (q) → half (h) → whole (w) → eighth (8) → rests (qr, hr, wr) → dotted (hd, qd) → sixteenth (16) → compound (6/8)

Violations are flagged in the unit tables below but are **NOT** included in the remediation list (D-17). Kodaly resequencing is deferred to future milestone CURR-F01. Node `order` values are immutable for nodes with live user progress.

---

## Unit 1: Rhythm Starters (rhythmUnit1Redesigned.js)

Unit header: quarter notes (q) then half notes (h). START_ORDER = 100. Unit 1 introduces the two most fundamental durations — one per Discovery node — then moves through practice, mix, and speed phases.

| Node ID       | Name                         | Node Type   | Current Game     | Introduced Concept           | Violations                                                         | Kodaly Order Flag        |
| ------------- | ---------------------------- | ----------- | ---------------- | ---------------------------- | ------------------------------------------------------------------ | ------------------------ |
| rhythm_1_1    | Meet Quarter Notes           | DISCOVERY   | RHYTHM (legacy)  | q — Quarter notes            | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION                    | OK (first concept)       |
| rhythm_1_2    | Practice Quarter Notes       | PRACTICE    | RHYTHM (legacy)  | none (focusDurations: [])    | WRONG: bare RHYTHM; should be RHYTHM_TAP (MetronomeTrainer)        | N/A                      |
| rhythm_1_3    | Meet Half Notes              | DISCOVERY   | RHYTHM_TAP       | h — Half notes               | CORRECT                                                            | OK (quarter before half) |
| rhythm_1_4    | Practice Quarters and Halves | PRACTICE    | RHYTHM_DICTATION | none                         | WRONG: D-05 requires RHYTHM_TAP; RHYTHM_DICTATION is MIX_UP policy | N/A                      |
| rhythm_1_5    | Rhythm Patterns              | MIX_UP      | RHYTHM_TAP       | none (exercise type variety) | WRONG: D-06 requires RHYTHM_DICTATION for MIX_UP                   | N/A                      |
| rhythm_1_6    | Speed Challenge              | SPEED_ROUND | RHYTHM (legacy)  | none                         | WRONG: D-09 requires ARCADE_RHYTHM                                 | N/A                      |
| boss_rhythm_1 | Basic Beats Master           | MINI_BOSS   | ARCADE_RHYTHM    | none                         | WRONG: D-10 requires RHYTHM_TAP (RhythmReadingGame) for MINI_BOSS  | N/A                      |

**Unit 1 summary:** 6 of 7 nodes have game-type violations. rhythm_1_3 is the only correctly-assigned node. The unit correctly introduces one concept per Discovery node (q then h, separate nodes). No CURR-01 concept violations.

---

## Unit 2: Beat Builders (rhythmUnit2Redesigned.js)

Unit header: whole notes (w). START_ORDER = 107. This unit introduces the whole note, then practices it in combination with previously learned durations.

| Node ID       | Name                 | Node Type   | Current Game     | Introduced Concept                                     | Violations                                                         | Kodaly Order Flag                        |
| ------------- | -------------------- | ----------- | ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------- |
| rhythm_2_1    | Meet Whole Notes     | DISCOVERY   | RHYTHM (legacy)  | w — Whole notes                                        | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION                    | OK (whole after half per D-16)           |
| rhythm_2_2    | Practice Whole Notes | PRACTICE    | RHYTHM (legacy)  | none                                                   | WRONG: bare RHYTHM; should be RHYTHM_TAP (MetronomeTrainer)        | N/A                                      |
| rhythm_2_3    | Long and Short       | DISCOVERY   | RHYTHM_TAP       | none (focusDurations: [], contrasting known durations) | CORRECT (Discovery + RHYTHM_TAP)                                   | N/A — no new duration; contrast exercise |
| rhythm_2_4    | All Basic Durations  | PRACTICE    | RHYTHM_DICTATION | none                                                   | WRONG: D-05 requires RHYTHM_TAP; RHYTHM_DICTATION is MIX_UP policy | N/A                                      |
| rhythm_2_5    | Duration Mix         | MIX_UP      | RHYTHM_TAP       | none                                                   | WRONG: D-06 requires RHYTHM_DICTATION for MIX_UP                   | N/A                                      |
| rhythm_2_6    | Speed Basics         | SPEED_ROUND | RHYTHM (legacy)  | none                                                   | WRONG: D-09 requires ARCADE_RHYTHM                                 | N/A                                      |
| boss_rhythm_2 | Duration Master      | MINI_BOSS   | ARCADE_RHYTHM    | none                                                   | WRONG: D-10 requires RHYTHM_TAP for MINI_BOSS                      | N/A                                      |

**Unit 2 summary:** 5 of 7 nodes have game-type violations (rhythm_2_1 uses bare RHYTHM — wrong; rhythm_2_3 correct). No CURR-01 concept violations — whole note introduced alone in its own Discovery node.

---

## Unit 3: Fast Note Friends (rhythmUnit3Redesigned.js)

Unit header: eighth notes (8). START_ORDER = 114. This unit introduces eighth notes — the first subdivision faster than the beat.

| Node ID       | Name                  | Node Type   | Current Game     | Introduced Concept                           | Violations                                                                    | Kodaly Order Flag                |
| ------------- | --------------------- | ----------- | ---------------- | -------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------- |
| rhythm_3_1    | Meet Eighth Notes     | DISCOVERY   | RHYTHM (legacy)  | 8 — Eighth notes                             | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION                               | OK (eighth after whole per D-16) |
| rhythm_3_2    | Practice Eighth Notes | PRACTICE    | RHYTHM (legacy)  | none                                         | WRONG: bare RHYTHM; should be RHYTHM_TAP (MetronomeTrainer)                   | N/A                              |
| rhythm_3_3    | Running and Walking   | DISCOVERY   | RHYTHM_TAP       | none (focusDurations: [], contrast exercise) | CORRECT                                                                       | N/A — no new duration            |
| rhythm_3_4    | Mix It Up             | PRACTICE    | RHYTHM_DICTATION | none                                         | WRONG: D-05 Practice should use RHYTHM_TAP; RHYTHM_DICTATION is MIX_UP policy | N/A                              |
| rhythm_3_5    | Rhythm Variety        | MIX_UP      | RHYTHM_TAP       | none                                         | WRONG: D-06 MIX_UP should use RHYTHM_DICTATION                                | N/A                              |
| rhythm_3_6    | Speed Running         | SPEED_ROUND | RHYTHM (legacy)  | none                                         | WRONG: D-09 requires ARCADE_RHYTHM                                            | N/A                              |
| boss_rhythm_3 | Running Notes Master  | MINI_BOSS   | ARCADE_RHYTHM    | none                                         | WRONG: D-10 requires RHYTHM_TAP for MINI_BOSS                                 | N/A                              |

**Unit 3 summary:** 5 of 7 nodes have game-type violations. No CURR-01 concept violations.

---

## Unit 4: Quiet Moments (rhythmUnit4Redesigned.js)

Unit header: rests (qr, hr, wr). START_ORDER = 121. Three Discovery nodes — one for each rest type — are a notable strength of this unit's curriculum design.

| Node ID       | Name                   | Node Type   | Current Game     | Introduced Concept | Violations                                                  | Kodaly Order Flag                 |
| ------------- | ---------------------- | ----------- | ---------------- | ------------------ | ----------------------------------------------------------- | --------------------------------- |
| rhythm_4_1    | Meet Quarter Rest      | DISCOVERY   | RHYTHM (legacy)  | qr — Quarter rest  | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION             | OK (rests after eighth per D-16)  |
| rhythm_4_2    | Practice Quarter Rests | PRACTICE    | RHYTHM (legacy)  | none               | WRONG: bare RHYTHM; should be RHYTHM_TAP (MetronomeTrainer) | N/A                               |
| rhythm_4_3    | Meet Half Rest         | DISCOVERY   | RHYTHM_TAP       | hr — Half rest     | CORRECT                                                     | OK (half rest after quarter rest) |
| rhythm_4_4    | Practice Rests         | PRACTICE    | RHYTHM_DICTATION | none               | WRONG: D-05 Practice should use RHYTHM_TAP                  | N/A                               |
| rhythm_4_5    | Meet Whole Rest        | DISCOVERY   | RHYTHM_TAP       | wr — Whole rest    | CORRECT                                                     | OK (whole rest after half rest)   |
| rhythm_4_6    | Speed Silence          | SPEED_ROUND | RHYTHM (legacy)  | none               | WRONG: D-09 requires ARCADE_RHYTHM                          | N/A                               |
| boss_rhythm_4 | Silence Master         | MINI_BOSS   | ARCADE_RHYTHM    | none               | WRONG: D-10 requires RHYTHM_TAP for MINI_BOSS               | N/A                               |

**Unit 4 summary:** 4 of 7 nodes have game-type violations. No CURR-01 concept violations — each rest introduced as its own Discovery node.

---

## Unit 5: Magic Dots (rhythmUnit5Redesigned.js)

Unit header: dotted notes (hd, qd) and 3/4 time. START_ORDER = 128. Also introduces 3/4 time signature as a separate concept node (rhythm_5_3).

| Node ID       | Name                      | Node Type   | Current Game       | Introduced Concept                      | Violations                                                                                                                          | Kodaly Order Flag                                                         |
| ------------- | ------------------------- | ----------- | ------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| rhythm_5_1    | Meet Dotted Half Notes    | DISCOVERY   | RHYTHM (legacy)    | hd — Dotted half                        | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION                                                                                     | OK (dotted after rests per D-16)                                          |
| rhythm_5_2    | Practice Dotted Halves    | PRACTICE    | RHYTHM (legacy)    | none                                    | WRONG: bare RHYTHM; should be RHYTHM_TAP (MetronomeTrainer)                                                                         | N/A                                                                       |
| rhythm_5_3    | Waltz Time (3/4)          | DISCOVERY   | RHYTHM_TAP         | 3/4 time signature (focusDurations: []) | CORRECT                                                                                                                             | NEW-SIG: 3/4 introduced alone — correct per D-13; sits mid-unit (flagged) |
| rhythm_5_4    | Meet Dotted Quarter Notes | DISCOVERY   | RHYTHM_DICTATION   | qd — Dotted quarter                     | CORRECT (RHYTHM_DICTATION is allowed for Discovery per D-04)                                                                        | OK (second dotted duration in own node)                                   |
| rhythm_5_5    | Practice All Dotted Notes | PRACTICE    | RHYTHM_TAP         | none                                    | WRONG: D-05 Practice should use MetronomeTrainer (echo mode), not RHYTHM_TAP as notation-showing; Conditional — see Open Question 1 | N/A                                                                       |
| rhythm_5_6    | Speed Dots                | SPEED_ROUND | RHYTHM (legacy)    | none                                    | WRONG: D-09 requires ARCADE_RHYTHM                                                                                                  | N/A                                                                       |
| boss_rhythm_5 | Dotted Notes Master       | MINI_BOSS   | ARCADE_RHYTHM (×2) | none                                    | WRONG: D-10 requires RHYTHM_TAP for MINI_BOSS; also has 2 exercises — both must be updated                                          | N/A                                                                       |

**Unit 5 summary:** 4 of 7 nodes have game-type violations. No CURR-01 violations — time signature change (rhythm_5_3) is correctly isolated in its own Discovery node with focusDurations: [].

---

## Unit 6: Speed Champions (rhythmUnit6Redesigned.js)

Unit header: sixteenth notes (16). START_ORDER = 135. Contains the first true BOSS node (boss_rhythm_6) which correctly uses ARCADE_RHYTHM.

| Node ID       | Name                     | Node Type   | Current Game     | Introduced Concept                                | Violations                                                  | Kodaly Order Flag                    |
| ------------- | ------------------------ | ----------- | ---------------- | ------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------ |
| rhythm_6_1    | Meet Sixteenth Notes     | DISCOVERY   | RHYTHM (legacy)  | 16 — Sixteenth notes                              | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION             | OK (sixteenth after dotted per D-16) |
| rhythm_6_2    | Practice Sixteenth Notes | PRACTICE    | RHYTHM (legacy)  | none                                              | WRONG: bare RHYTHM; should be RHYTHM_TAP (MetronomeTrainer) | N/A                                  |
| rhythm_6_3    | Sixteenths and Eighths   | DISCOVERY   | RHYTHM_TAP       | none (focusDurations: [], mixing known durations) | CORRECT                                                     | N/A — no new duration                |
| rhythm_6_4    | Fast and Faster          | PRACTICE    | RHYTHM_DICTATION | none                                              | WRONG: D-05 Practice should use RHYTHM_TAP                  | N/A                                  |
| rhythm_6_5    | All Rhythms              | MIX_UP      | RHYTHM_TAP       | none                                              | WRONG: D-06 MIX_UP should use RHYTHM_DICTATION              | N/A                                  |
| rhythm_6_6    | Speed Master             | SPEED_ROUND | RHYTHM (legacy)  | none                                              | WRONG: D-09 requires ARCADE_RHYTHM                          | N/A                                  |
| boss_rhythm_6 | Rhythm Champion          | BOSS        | ARCADE_RHYTHM    | none                                              | CORRECT (D-11: BOSS uses ArcadeRhythmGame)                  | N/A                                  |

**Unit 6 summary:** 5 of 7 nodes have game-type violations. boss_rhythm_6 is the only BOSS node in Units 1-6 and is correctly assigned. No CURR-01 concept violations.

---

## Unit 7: Big Beats (rhythmUnit7Redesigned.js)

Unit header: 6/8 compound meter. START_ORDER = 142. This unit introduces compound meter and has the most violations — including 3 CURR-01 concept violations.

| Node ID       | Name               | Node Type   | Current Game     | Introduced Concept                            | Violations                                                                                                                                                             | Kodaly Order Flag                                                                                                                               |
| ------------- | ------------------ | ----------- | ---------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| rhythm_7_1    | Two Big Beats      | DISCOVERY   | RHYTHM (legacy)  | focusDurations: ['qd'] + timeSignature: '6/8' | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION; CURR-01: SIG+DUR — 6/8 time signature AND qd listed as new concepts together                                          | **SIG+DUR VIOLATION**: 6/8 is new time sig AND qd is listed as new duration — two concepts per D-13/D-14                                        |
| rhythm_7_2    | Feel the Pulse     | PRACTICE    | RHYTHM (legacy)  | none                                          | WRONG: bare RHYTHM; should be RHYTHM_TAP (MetronomeTrainer)                                                                                                            | N/A                                                                                                                                             |
| rhythm_7_3    | Adding Quarters    | DISCOVERY   | RHYTHM_TAP       | focusDurations: ['q']                         | CORRECT (game type); CURR-01: REPEATED — q (quarter) was introduced in Unit 1; cannot claim it as a new concept                                                        | **REPEATED**: q introduced in Unit 1; actual new concept is "quarter note behaviour within 6/8 context"                                         |
| rhythm_7_4    | Mixing It Up       | PRACTICE    | RHYTHM_DICTATION | focusDurations: ['8']                         | WRONG: D-05 Practice should use RHYTHM_TAP; CURR-01: REPEATED + WRONG-NODE-TYPE — 8 (eighth) was introduced in Unit 3; Practice node should not introduce new concepts | **REPEATED + WRONG NODE TYPE FOR INTRODUCTION**: 8 introduced in Unit 3; this Practice node introduces a concept, which violates D-12 semantics |
| rhythm_7_5    | Compound Cocktail  | MIX_UP      | RHYTHM_TAP       | none                                          | WRONG: D-06 MIX_UP should use RHYTHM_DICTATION                                                                                                                         | N/A                                                                                                                                             |
| rhythm_7_6    | Quick Beats        | SPEED_ROUND | RHYTHM (legacy)  | none                                          | WRONG: D-09 requires ARCADE_RHYTHM                                                                                                                                     | N/A                                                                                                                                             |
| boss_rhythm_7 | Compound Commander | MINI_BOSS   | ARCADE_RHYTHM    | none                                          | WRONG: D-10 requires RHYTHM_TAP for MINI_BOSS                                                                                                                          | N/A                                                                                                                                             |

**Unit 7 summary:** 5 of 7 game-type violations. 3 CURR-01 violations: rhythm_7_1 (SIG+DUR), rhythm_7_3 (repeated quarter framed as new), rhythm_7_4 (repeated eighth framed as new on a Practice node). Unit 7 needs the most remediation work.

---

## Unit 8: Off-Beat Magic (rhythmUnit8Redesigned.js)

Unit header: syncopation patterns. START_ORDER = 149. Contains the true BOSS capstone node (boss_rhythm_8). Unit 8 introduces syncopation as a rhythmic technique, but two nodes incorrectly list previously-learned durations in focusDurations.

| Node ID       | Name                | Node Type   | Current Game       | Introduced Concept     | Violations                                                                                                                 | Kodaly Order Flag                                                                                                   |
| ------------- | ------------------- | ----------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| rhythm_8_1    | Off-Beat Surprise   | DISCOVERY   | RHYTHM (legacy)    | focusDurations: ['8']  | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION; CURR-01: REPEATED — '8' introduced in Unit 3; real concept is syncopation | **REPEATED**: '8' introduced in Unit 3; real concept is "syncopation technique" — focusDurations should be []       |
| rhythm_8_2    | Between the Beats   | PRACTICE    | RHYTHM (legacy)    | none                   | WRONG: bare RHYTHM; should be RHYTHM_TAP (MetronomeTrainer)                                                                | N/A                                                                                                                 |
| rhythm_8_3    | Dotted Groove       | DISCOVERY   | RHYTHM_TAP         | focusDurations: ['qd'] | CORRECT (game type); CURR-01: REPEATED — qd introduced in Unit 5; real concept is "dotted-quarter syncopation pattern"     | **REPEATED**: qd introduced in Unit 5; focusDurations misleading — concept is syncopation pattern, not new duration |
| rhythm_8_4    | Swing and Sway      | PRACTICE    | RHYTHM_DICTATION   | none                   | WRONG: D-05 Practice should use RHYTHM_TAP                                                                                 | N/A                                                                                                                 |
| rhythm_8_5    | Syncopation Shuffle | MIX_UP      | RHYTHM_TAP         | none                   | WRONG: D-06 MIX_UP should use RHYTHM_DICTATION                                                                             | N/A                                                                                                                 |
| rhythm_8_6    | Rapid Syncopation   | SPEED_ROUND | RHYTHM (legacy)    | none                   | WRONG: D-09 requires ARCADE_RHYTHM                                                                                         | N/A                                                                                                                 |
| boss_rhythm_8 | Rhythm Master       | BOSS        | ARCADE_RHYTHM (×3) | none                   | CORRECT (D-11: BOSS uses ArcadeRhythmGame; 3 exercises — type is correct on all)                                           | N/A                                                                                                                 |

**Unit 8 summary:** 5 of 7 game-type violations. 2 CURR-01 violations: rhythm_8_1 and rhythm_8_3 list already-learned durations in focusDurations; the true new concept is the syncopation pattern, not a new duration value. boss_rhythm_8 correctly uses ARCADE_RHYTHM.

---

## Violation Summary Statistics

### Game-Type Violations by Unit

| Unit      | Total Nodes | Game-Type Violations | Correct Nodes                                              |
| --------- | ----------- | -------------------- | ---------------------------------------------------------- |
| Unit 1    | 7           | 6                    | 1 (rhythm_1_3)                                             |
| Unit 2    | 7           | 5                    | 2 (rhythm_2_3; rhythm_2_1 is bare RHYTHM = wrong)          |
| Unit 3    | 7           | 5                    | 2 (rhythm_3_3; rhythm_3_2 is bare RHYTHM = wrong)          |
| Unit 4    | 7           | 4                    | 3 (rhythm_4_3, rhythm_4_5 correct; rhythm_4_2 bare RHYTHM) |
| Unit 5    | 7           | 4                    | 3 (rhythm_5_3, rhythm_5_4 correct; rhythm_5_2 bare RHYTHM) |
| Unit 6    | 7           | 5                    | 2 (rhythm_6_3, boss_rhythm_6 correct)                      |
| Unit 7    | 7           | 5                    | 2 (rhythm_7_3 correct game type; no true BOSS in Unit 7)   |
| Unit 8    | 7           | 5                    | 2 (rhythm_8_3 correct game type; boss_rhythm_8 correct)    |
| **Total** | **56**      | **39**               | **17**                                                     |

> Note: G-26 (rhythm_5_5) is conditional — see Open Question 1. The table above counts it as a violation pending clarification.

### CURR-01 (One-Concept) Violations

| Node ID    | Violation Type        | Description                                                                  |
| ---------- | --------------------- | ---------------------------------------------------------------------------- |
| rhythm_7_1 | SIG+DUR               | 6/8 time signature + qd dotted-quarter listed simultaneously as new concepts |
| rhythm_7_3 | REPEATED              | focusDurations: ['q'] but q was introduced in Unit 1                         |
| rhythm_7_4 | REPEATED + WRONG-NODE | focusDurations: ['8'] on Practice node; 8 was introduced in Unit 3           |
| rhythm_8_1 | REPEATED              | focusDurations: ['8'] but 8 was introduced in Unit 3                         |
| rhythm_8_3 | REPEATED              | focusDurations: ['qd'] but qd was introduced in Unit 5                       |

**Total CURR-01 violations: 5**

### Kodaly Order Violations (flag only — not remediated per D-17)

Per D-16 (custom project order): quarter → half → whole → eighth → rests → dotted → sixteenth → compound

| Node ID    | Flag                       | Reason                                                                                                         |
| ---------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| rhythm_5_3 | NEW-SIG within dotted unit | 3/4 time introduced between dotted-half and dotted-quarter nodes; sequencing anomaly, not a duration violation |
| rhythm_7_1 | SIG+DUR                    | 6/8 introduces compound meter (correct position) but pairs with qd duration — the SIG+DUR CURR-01 flag applies |

No duration-order violations detected: the custom project sequence (q→h→w→8→rests→dotted→16→compound) is respected across Units 1-8.

---

## Remediation List

The following sections list every actionable fix for Phase 22. Kodaly resequencing is excluded per D-17.

### Game-Type Fixes

| #    | Node ID       | Node Type   | Current Game       | Required Game                 | Phase 22 Action                                                                         |
| ---- | ------------- | ----------- | ------------------ | ----------------------------- | --------------------------------------------------------------------------------------- |
| G-01 | rhythm_1_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-02 | rhythm_1_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-03 | rhythm_1_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-04 | rhythm_1_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                               |
| G-05 | rhythm_1_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                               |
| G-06 | boss_rhythm_1 | MINI_BOSS   | ARCADE_RHYTHM      | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-07 | rhythm_2_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-08 | rhythm_2_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-09 | rhythm_2_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-10 | rhythm_2_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                               |
| G-11 | rhythm_2_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                               |
| G-12 | boss_rhythm_2 | MINI_BOSS   | ARCADE_RHYTHM      | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-13 | rhythm_3_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-14 | rhythm_3_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-15 | rhythm_3_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-16 | rhythm_3_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                               |
| G-17 | rhythm_3_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                               |
| G-18 | boss_rhythm_3 | MINI_BOSS   | ARCADE_RHYTHM      | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-19 | rhythm_4_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-20 | rhythm_4_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-21 | rhythm_4_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-22 | rhythm_4_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                               |
| G-23 | boss_rhythm_4 | MINI_BOSS   | ARCADE_RHYTHM      | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-24 | rhythm_5_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-25 | rhythm_5_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-26 | rhythm_5_5    | PRACTICE    | RHYTHM_TAP         | RHYTHM_TAP (MetronomeTrainer) | Conditional — see Open Question 1; keep if RHYTHM_TAP IS the MetronomeTrainer echo mode |
| G-27 | rhythm_5_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                               |
| G-28 | boss_rhythm_5 | MINI_BOSS   | ARCADE_RHYTHM (x2) | RHYTHM_TAP (x2)               | Replace both exercises[].type                                                           |
| G-29 | rhythm_6_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-30 | rhythm_6_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-31 | rhythm_6_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-32 | rhythm_6_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                               |
| G-33 | rhythm_6_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                               |
| G-34 | rhythm_7_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-35 | rhythm_7_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-36 | rhythm_7_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-37 | rhythm_7_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                               |
| G-38 | rhythm_7_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                               |
| G-39 | boss_rhythm_7 | MINI_BOSS   | ARCADE_RHYTHM      | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-40 | rhythm_8_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                               |
| G-41 | rhythm_8_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-42 | rhythm_8_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                               |
| G-43 | rhythm_8_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                               |
| G-44 | rhythm_8_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                               |

**Total game-type remediations: 44** (G-26 is conditional — see Open Question 1)

### Concept (CURR-01) Fixes

| #    | Node ID    | Violation                                                       | Required Change                                                                                                                                                                                                            |
| ---- | ---------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-01 | rhythm_7_1 | SIG+DUR: 6/8 time + qd duration introduced together             | Keep as one node, set focusDurations: [] and newContentDescription: '6/8 Compound Meter (Two Big Beats)', remove qd from focusDurations since the metre is the new concept. Alternatively: split into two Discovery nodes. |
| C-02 | rhythm_7_3 | REPEATED: q already introduced in Unit 1                        | Set focusDurations: [] and newContentDescription: 'Quarter Notes within 6/8 Context'. The node teaches 6/8 feel with a known duration — valid but must not claim to introduce a new duration.                              |
| C-03 | rhythm_7_4 | REPEATED: 8 already introduced in Unit 3; also on Practice node | Set focusDurations: [] and newContentDescription: 'Eighth Notes within 6/8 Context'. Consider whether nodeType should change to DISCOVERY since it introduces a contextual technique.                                      |
| C-04 | rhythm_8_1 | REPEATED: 8 already introduced in Unit 3                        | Set focusDurations: [] and newContentDescription: 'Syncopation: Eighth-Quarter-Eighth Pattern'. The concept is syncopation, not the duration.                                                                              |
| C-05 | rhythm_8_3 | REPEATED: qd already introduced in Unit 5                       | Set focusDurations: [] and newContentDescription: 'Dotted Quarter-Eighth Syncopation Pattern'. Same fix as C-04.                                                                                                           |

**Total concept remediations: 5**

---

## Open Questions

1. **RHYTHM_TAP = MetronomeTrainer (echo) OR RhythmReadingGame (notation)?** — Phase 22 must verify the exercise-type-to-component binding. The audit specifies intended game behavior per policy; the correct EXERCISE_TYPES constant will be confirmed during implementation. Impact on G-26: if RHYTHM_TAP maps to RhythmReadingGame (notation-showing) exclusively, then rhythm_5_5 (PRACTICE) using RHYTHM_TAP is a violation — Practice should use MetronomeTrainer, not RhythmReadingGame. G-26 remains a violation until this is resolved.

2. **Should rhythm_7_3 and rhythm_7_4 concept remediations also change the node type to DISCOVERY?** — The audit flags this as "OPTIONAL: consider changing nodeType to DISCOVERY" — Phase 22 planner decides. rhythm_7_4 is PRACTICE but introduces a contextual concept (eighths in 6/8); D-12 implies concepts belong on Discovery nodes.

---

## Assumptions

| #   | Claim                                                                                                                          | Risk if Wrong                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| A1  | EXERCISE_TYPES.RHYTHM maps to MetronomeTrainer in the current runtime and is not a synonym for any of the three new game types | If RHYTHM already routes to a specific new game, some "violations" may be false positives                     |
| A2  | EXERCISE_TYPES.RHYTHM_TAP is the exercise type consumed by MetronomeTrainer in echo mode (D-05)                                | If RHYTHM_TAP maps to RhythmReadingGame (notation-showing) exclusively, then Practice node corrections differ |
| A3  | rhythm_5_3 correctly isolates 3/4 time (no CURR-01 violation) because focusDurations is []                                     | Confirmed by file read; very low risk                                                                         |
| A4  | boss_rhythm_7 has isBoss: false (set explicitly in file) — it is a MINI_BOSS, not a true BOSS                                  | Confirmed by file read; very low risk                                                                         |
