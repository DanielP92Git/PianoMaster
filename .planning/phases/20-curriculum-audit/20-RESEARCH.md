# Phase 20: Curriculum Audit - Research

**Researched:** 2026-04-06
**Domain:** Rhythm trail pedagogy — node data, exercise-type policy, one-concept rule, Kodaly order
**Confidence:** HIGH (all findings verified by direct read of source files)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Audit output is a Markdown document organized by unit (8 sections matching the 8 unit files), each section containing a node table with one row per node
- **D-02:** Node table columns: Node ID, Name, Node Type, Current Game, Introduced Concept, Violations (concept/game-type), Kodaly Order Flag
- **D-03:** Separate remediation section listing every fix needed — covers game-type and concept violations only (not Kodaly resequencing)
- **D-04:** Discovery nodes → RhythmReadingGame or RhythmDictationGame (notation-showing game)
- **D-05:** Practice nodes → MetronomeTrainer (echo/call-response game)
- **D-06:** MIX_UP nodes → RhythmDictationGame ("hear it, write it")
- **D-07:** REVIEW nodes → MetronomeTrainer (reinforce with echo game)
- **D-08:** CHALLENGE nodes → MetronomeTrainer (harder echo game)
- **D-09:** SPEED_ROUND nodes → ArcadeRhythmGame
- **D-10:** MINI_BOSS nodes → RhythmReadingGame (visual reading checkpoint)
- **D-11:** BOSS nodes → ArcadeRhythmGame
- **D-12:** One concept = one new duration value; each is its own concept
- **D-13:** Time signature changes count as their own concept; cannot pair with a new duration
- **D-14:** Any node introducing two or more new elements is a violation of CURR-01
- **D-15:** Audit table includes a Kodaly order violation column
- **D-16:** Expected Kodaly order: quarter → half → whole → eighth → rests → dotted → sixteenth → compound
- **D-17:** Kodaly ordering violations are flagged only — remediation list does NOT include resequencing

### Claude's Discretion

- Exact markdown formatting and column widths of the audit tables
- How to phrase violation descriptions (brief codes vs prose)
- Whether to include a summary statistics section (total violations by type)
- Unit-level summary paragraph content

### Deferred Ideas (OUT OF SCOPE)

- **CURR-F01 Kodaly duration reorder** — Full node resequencing deferred to future milestone. Phase 20 flags violations but does not remediate.
- **Node order immutability** — If resequencing is ever done, need progress migration strategy first.
  </user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                | Research Support                                                                          |
| ------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| CURR-01 | Each rhythm node introduces at most one new musical concept (audit all nodes, fix violations)              | Full node-by-node audit completed; violations catalogued in section "Complete Node Audit" |
| CURR-02 | Discovery nodes use notation-showing game (RhythmReadingGame or RhythmDictationGame), not MetronomeTrainer | All Discovery node exercise types read and classified; violations listed                  |
| CURR-03 | Practice nodes use echo game (MetronomeTrainer) for call-and-response reinforcement                        | All Practice node exercise types read and classified; violations listed                   |
| CURR-04 | Speed/Boss nodes use ArcadeRhythmGame for engagement challenge                                             | All Speed/Boss node exercise types read and classified; violations listed                 |

</phase_requirements>

---

## Summary

Phase 20 is a documentation-only audit. No source files are modified. The output is a committed Markdown reference document consumed by Phase 22.

All 48 rhythm nodes across 8 unit files have been read in full during this research session. The exercise type strings, focusDurations arrays, node types, and time signatures are factually captured. Violations are identified by cross-referencing the game-type policy (D-04 through D-11) and one-concept rule (D-12 through D-14).

**Primary finding:** The game-type policy is violated pervasively. Every unit has at least one node using the wrong exercise type — primarily SPEED_ROUND nodes using bare `RHYTHM` instead of `ARCADE_RHYTHM`, and MINI_BOSS nodes using `ARCADE_RHYTHM` instead of `RHYTHM_TAP`. Discovery nodes in Units 1, 2, and 6 also use bare `RHYTHM` instead of a notation-showing game. The one-concept violations are fewer but significant: Units 7 and 8 have nodes that either pair a new time signature with a new duration, or re-introduce a duration that was already taught.

**Primary recommendation:** The planner should structure tasks as (1) write the audit document shell with the table schema, then (2) populate each unit's table row by row in sequence from the node data already captured in this research, then (3) write the remediation section as a derived output.

---

## Standard Stack

This phase produces no code. The "stack" is the data schema the audit document must reflect.

### Node Object Structure (verified by reading all 8 unit files)

Every rhythm node contains these fields relevant to the audit:

| Field                         | Location        | Audit Relevance                                     |
| ----------------------------- | --------------- | --------------------------------------------------- |
| `id`                          | top-level       | Node ID column                                      |
| `name`                        | top-level       | Name column                                         |
| `nodeType`                    | top-level       | Node Type column (from NODE_TYPES enum)             |
| `exercises[0].type`           | exercises array | Current Game column (EXERCISE_TYPES enum value)     |
| `rhythmConfig.focusDurations` | rhythmConfig    | Introduced Concept column                           |
| `rhythmConfig.timeSignature`  | rhythmConfig    | Used to detect time-signature concept introductions |
| `newContentDescription`       | top-level       | Human-readable description of what's new            |
| `order`                       | top-level       | Immutable — for reference only                      |
| `unit`                        | top-level       | Identifies which unit file                          |

[VERIFIED: direct read of all 8 unit files]

### Exercise Type → Game Component Mapping

| EXERCISE_TYPES value              | Game Component                        | Policy Role                        |
| --------------------------------- | ------------------------------------- | ---------------------------------- |
| `EXERCISE_TYPES.RHYTHM`           | MetronomeTrainer (current) OR unknown | Used inconsistently — see pitfalls |
| `EXERCISE_TYPES.RHYTHM_TAP`       | RhythmReadingGame                     | Notation-showing                   |
| `EXERCISE_TYPES.RHYTHM_DICTATION` | RhythmDictationGame                   | Hear-and-write                     |
| `EXERCISE_TYPES.ARCADE_RHYTHM`    | ArcadeRhythmGame                      | Arcade/speed challenge             |

[VERIFIED: constants.js, CONTEXT.md D-04 through D-11]

**Critical note on `EXERCISE_TYPES.RHYTHM`:** The bare `RHYTHM` type predates the redesign. It is not mapped to a specific new-architecture game. Its presence on any redesigned node is a game-type violation by default — it should be replaced by one of the three typed alternatives.

---

## Complete Node Audit

This section is the primary artifact of Phase 20 research. It captures the actual state of every node as read from source files. The planner will transform this into the audit document format.

### Exercise Type Classification Key

For the "Game-Type Violation?" column:

- **CORRECT** — exercise type matches policy for node type
- **WRONG-TYPE** — exercise type violates D-04 through D-11; correct type noted
- **LEGACY** — uses bare `RHYTHM` type (always a violation in redesigned nodes)

### Kodaly Order Key (D-16)

Expected sequence: `q` (quarter) → `h` (half) → `w` (whole) → `8` (eighth) → `qr/hr/wr` (rests) → `hd`/`qd` (dotted) → `16` (sixteenth) → `6/8` (compound)

- **OK** — duration introduced at or after expected position in Kodaly sequence
- **EARLY** — duration introduced before expected position
- **MULTI** — multiple new durations introduced simultaneously (CURR-01 violation)
- **REPEATED** — duration was already introduced in an earlier unit (CURR-01 violation — concept is not new)
- **NEW-SIG** — new time signature introduced alone (correct per D-13)
- **SIG+DUR** — new time signature AND new duration introduced together (CURR-01 violation per D-13)
- **TECHNIQUE** — no new duration; teaches a rhythmic technique (syncopation). Whether this is a single valid concept is a judgment call flagged here.
- **N/A** — no new concept; practice/review/speed/boss node with focusDurations: []

---

### Unit 1: Rhythm Starters (rhythmUnit1Redesigned.js)

Unit header: quarter notes (q) then half notes (h). START_ORDER = 100.

| Node ID       | Name                         | Node Type   | Current Game (exercises[0].type) | Introduced Concept (focusDurations / newContentDescription) | Game-Type Violation?                                                                                                                                                    | Kodaly Order Flag        |
| ------------- | ---------------------------- | ----------- | -------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| rhythm_1_1    | Meet Quarter Notes           | DISCOVERY   | RHYTHM (legacy)                  | q — Quarter notes                                           | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION                                                                                                                         | OK (first concept)       |
| rhythm_1_2    | Practice Quarter Notes       | PRACTICE    | RHYTHM (legacy)                  | none (focusDurations: [])                                   | WRONG: RHYTHM is ambiguous; should be RHYTHM_TAP (MetronomeTrainer maps to RHYTHM per policy D-05 but current type is bare RHYTHM — needs clarification; see Pitfall 1) | N/A                      |
| rhythm_1_3    | Meet Half Notes              | DISCOVERY   | RHYTHM_TAP                       | h — Half notes                                              | CORRECT                                                                                                                                                                 | OK (quarter before half) |
| rhythm_1_4    | Practice Quarters and Halves | PRACTICE    | RHYTHM_DICTATION                 | none                                                        | WRONG: D-05 requires MetronomeTrainer (RHYTHM_TAP echo); RHYTHM_DICTATION is MIX_UP policy                                                                              | N/A                      |
| rhythm_1_5    | Rhythm Patterns              | MIX_UP      | RHYTHM_TAP                       | none (exercise type variety)                                | WRONG: D-06 requires RHYTHM_DICTATION for MIX_UP                                                                                                                        | N/A                      |
| rhythm_1_6    | Speed Challenge              | SPEED_ROUND | RHYTHM (legacy)                  | none                                                        | WRONG: D-09 requires ARCADE_RHYTHM                                                                                                                                      | N/A                      |
| boss_rhythm_1 | Basic Beats Master           | MINI_BOSS   | ARCADE_RHYTHM                    | none                                                        | WRONG: D-10 requires RHYTHM_TAP (RhythmReadingGame) for MINI_BOSS                                                                                                       | N/A                      |

**Unit 1 summary:** 6 of 7 nodes have game-type violations. rhythm_1_3 is the only correctly-assigned node. The unit correctly introduces one concept per Discovery node (q then h, separate nodes). No CURR-01 concept violations.

---

### Unit 2: Beat Builders (rhythmUnit2Redesigned.js)

Unit header: whole notes (w). START_ORDER = 107.

| Node ID       | Name                 | Node Type   | Current Game (exercises[0].type) | Introduced Concept (focusDurations / newContentDescription) | Game-Type Violation?                                                         | Kodaly Order Flag                                                              |
| ------------- | -------------------- | ----------- | -------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| rhythm_2_1    | Meet Whole Notes     | DISCOVERY   | RHYTHM (legacy)                  | w — Whole notes                                             | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION                              | OK (whole after half per D-16)                                                 |
| rhythm_2_2    | Practice Whole Notes | PRACTICE    | RHYTHM (legacy)                  | none                                                        | WRONG: bare RHYTHM; should be explicit MetronomeTrainer type (see Pitfall 1) | N/A                                                                            |
| rhythm_2_3    | Long and Short       | DISCOVERY   | RHYTHM_TAP                       | none (focusDurations: [], contrasting known durations)      | CORRECT (Discovery + RHYTHM_TAP)                                             | N/A — no new duration; exercise-type variety as concept is valid per D-12 note |
| rhythm_2_4    | All Basic Durations  | PRACTICE    | RHYTHM_DICTATION                 | none                                                        | WRONG: D-05 requires MetronomeTrainer; RHYTHM_DICTATION is MIX_UP policy     | N/A                                                                            |
| rhythm_2_5    | Duration Mix         | MIX_UP      | RHYTHM_TAP                       | none                                                        | WRONG: D-06 requires RHYTHM_DICTATION for MIX_UP                             | N/A                                                                            |
| rhythm_2_6    | Speed Basics         | SPEED_ROUND | RHYTHM (legacy)                  | none                                                        | WRONG: D-09 requires ARCADE_RHYTHM                                           | N/A                                                                            |
| boss_rhythm_2 | Duration Master      | MINI_BOSS   | ARCADE_RHYTHM                    | none                                                        | WRONG: D-10 requires RHYTHM_TAP for MINI_BOSS                                | N/A                                                                            |

**Unit 2 summary:** 5 of 7 nodes have game-type violations (rhythm_2_3 and arguably rhythm_2_1 — RHYTHM_TAP is the correct policy but rhythm_2_1 uses bare RHYTHM, so 5 violations). No CURR-01 concept violations — whole note introduced alone.

---

### Unit 3: Fast Note Friends (rhythmUnit3Redesigned.js)

Unit header: eighth notes (8). START_ORDER = 114.

| Node ID       | Name                  | Node Type   | Current Game (exercises[0].type) | Introduced Concept (focusDurations / newContentDescription) | Game-Type Violation?                                                                | Kodaly Order Flag                |
| ------------- | --------------------- | ----------- | -------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------- |
| rhythm_3_1    | Meet Eighth Notes     | DISCOVERY   | RHYTHM (legacy)                  | 8 — Eighth notes                                            | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION                                     | OK (eighth after whole per D-16) |
| rhythm_3_2    | Practice Eighth Notes | PRACTICE    | RHYTHM (legacy)                  | none                                                        | WRONG: bare RHYTHM; see Pitfall 1                                                   | N/A                              |
| rhythm_3_3    | Running and Walking   | DISCOVERY   | RHYTHM_TAP                       | none (focusDurations: [], contrast exercise)                | CORRECT                                                                             | N/A — no new duration            |
| rhythm_3_4    | Mix It Up             | PRACTICE    | RHYTHM_DICTATION                 | none                                                        | WRONG: D-05 Practice should use MetronomeTrainer; RHYTHM_DICTATION is MIX_UP policy | N/A                              |
| rhythm_3_5    | Rhythm Variety        | MIX_UP      | RHYTHM_TAP                       | none                                                        | WRONG: D-06 MIX_UP should use RHYTHM_DICTATION                                      | N/A                              |
| rhythm_3_6    | Speed Running         | SPEED_ROUND | RHYTHM (legacy)                  | none                                                        | WRONG: D-09 requires ARCADE_RHYTHM                                                  | N/A                              |
| boss_rhythm_3 | Running Notes Master  | MINI_BOSS   | ARCADE_RHYTHM                    | none                                                        | WRONG: D-10 requires RHYTHM_TAP for MINI_BOSS                                       | N/A                              |

**Unit 3 summary:** 5 of 7 nodes have game-type violations. No CURR-01 concept violations.

---

### Unit 4: Quiet Moments (rhythmUnit4Redesigned.js)

Unit header: rests (qr, hr, wr). START_ORDER = 121. 3 Discovery nodes — one for each rest type.

| Node ID       | Name                   | Node Type   | Current Game (exercises[0].type) | Introduced Concept (focusDurations / newContentDescription) | Game-Type Violation?                             | Kodaly Order Flag                 |
| ------------- | ---------------------- | ----------- | -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ | --------------------------------- |
| rhythm_4_1    | Meet Quarter Rest      | DISCOVERY   | RHYTHM (legacy)                  | qr — Quarter rest                                           | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION  | OK (rests after eighth per D-16)  |
| rhythm_4_2    | Practice Quarter Rests | PRACTICE    | RHYTHM (legacy)                  | none                                                        | WRONG: bare RHYTHM; see Pitfall 1                | N/A                               |
| rhythm_4_3    | Meet Half Rest         | DISCOVERY   | RHYTHM_TAP                       | hr — Half rest                                              | CORRECT                                          | OK (half rest after quarter rest) |
| rhythm_4_4    | Practice Rests         | PRACTICE    | RHYTHM_DICTATION                 | none                                                        | WRONG: D-05 Practice should use MetronomeTrainer | N/A                               |
| rhythm_4_5    | Meet Whole Rest        | DISCOVERY   | RHYTHM_TAP                       | wr — Whole rest                                             | CORRECT                                          | OK (whole rest after half rest)   |
| rhythm_4_6    | Speed Silence          | SPEED_ROUND | RHYTHM (legacy)                  | none                                                        | WRONG: D-09 requires ARCADE_RHYTHM               | N/A                               |
| boss_rhythm_4 | Silence Master         | MINI_BOSS   | ARCADE_RHYTHM                    | none                                                        | WRONG: D-10 requires RHYTHM_TAP for MINI_BOSS    | N/A                               |

**Unit 4 summary:** 4 of 7 nodes have game-type violations. No CURR-01 concept violations — each rest introduced as its own Discovery node.

---

### Unit 5: Magic Dots (rhythmUnit5Redesigned.js)

Unit header: dotted notes (hd, qd) and 3/4 time. START_ORDER = 128.

| Node ID       | Name                      | Node Type   | Current Game (exercises[0].type) | Introduced Concept (focusDurations / newContentDescription) | Game-Type Violation?                                                                        | Kodaly Order Flag                                |
| ------------- | ------------------------- | ----------- | -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| rhythm_5_1    | Meet Dotted Half Notes    | DISCOVERY   | RHYTHM (legacy)                  | hd — Dotted half                                            | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION                                             | OK (dotted after rests per D-16)                 |
| rhythm_5_2    | Practice Dotted Halves    | PRACTICE    | RHYTHM (legacy)                  | none                                                        | WRONG: bare RHYTHM; see Pitfall 1                                                           | N/A                                              |
| rhythm_5_3    | Waltz Time (3/4)          | DISCOVERY   | RHYTHM_TAP                       | 3/4 time signature (focusDurations: [])                     | CORRECT                                                                                     | NEW-SIG: 3/4 introduced alone — correct per D-13 |
| rhythm_5_4    | Meet Dotted Quarter Notes | DISCOVERY   | RHYTHM_DICTATION                 | qd — Dotted quarter                                         | CORRECT (RHYTHM_DICTATION is allowed for Discovery per D-04)                                | OK (second dotted duration in own node)          |
| rhythm_5_5    | Practice All Dotted Notes | PRACTICE    | RHYTHM_TAP                       | none                                                        | WRONG: D-05 Practice should use MetronomeTrainer (echo), not RHYTHM_TAP                     | N/A                                              |
| rhythm_5_6    | Speed Dots                | SPEED_ROUND | RHYTHM (legacy)                  | none                                                        | WRONG: D-09 requires ARCADE_RHYTHM                                                          | N/A                                              |
| boss_rhythm_5 | Dotted Notes Master       | MINI_BOSS   | ARCADE_RHYTHM (2 exercises)      | none                                                        | WRONG: D-10 requires RHYTHM_TAP for MINI_BOSS; also has 2 exercises (unusual for MINI_BOSS) | N/A                                              |

**Unit 5 summary:** 4 of 7 nodes have game-type violations. No CURR-01 violations — time signature change (rhythm*5_3) is correctly isolated in its own Discovery node with focusDurations: []. However note rhythm_5_3 introduces 3/4 in the \_middle* of a dotted-notes unit — the Kodaly order flag should note that 3/4 is a concept insertion, not strictly a duration (sequencing issue flagged only, not remediated per D-17).

---

### Unit 6: Speed Champions (rhythmUnit6Redesigned.js)

Unit header: sixteenth notes (16). START_ORDER = 135. Contains the true BOSS node (not Mini-Boss).

| Node ID       | Name                     | Node Type   | Current Game (exercises[0].type) | Introduced Concept (focusDurations / newContentDescription) | Game-Type Violation?                             | Kodaly Order Flag                    |
| ------------- | ------------------------ | ----------- | -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ | ------------------------------------ |
| rhythm_6_1    | Meet Sixteenth Notes     | DISCOVERY   | RHYTHM (legacy)                  | 16 — Sixteenth notes                                        | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION  | OK (sixteenth after dotted per D-16) |
| rhythm_6_2    | Practice Sixteenth Notes | PRACTICE    | RHYTHM (legacy)                  | none                                                        | WRONG: bare RHYTHM; see Pitfall 1                | N/A                                  |
| rhythm_6_3    | Sixteenths and Eighths   | DISCOVERY   | RHYTHM_TAP                       | none (focusDurations: [], mixing known durations)           | CORRECT                                          | N/A — no new duration                |
| rhythm_6_4    | Fast and Faster          | PRACTICE    | RHYTHM_DICTATION                 | none                                                        | WRONG: D-05 Practice should use MetronomeTrainer | N/A                                  |
| rhythm_6_5    | All Rhythms              | MIX_UP      | RHYTHM_TAP                       | none                                                        | WRONG: D-06 MIX_UP should use RHYTHM_DICTATION   | N/A                                  |
| rhythm_6_6    | Speed Master             | SPEED_ROUND | RHYTHM (legacy)                  | none                                                        | WRONG: D-09 requires ARCADE_RHYTHM               | N/A                                  |
| boss_rhythm_6 | Rhythm Champion          | BOSS        | ARCADE_RHYTHM                    | none                                                        | CORRECT (D-11: BOSS → ArcadeRhythmGame)          | N/A                                  |

**Unit 6 summary:** 5 of 7 nodes have game-type violations. boss_rhythm_6 is the only BOSS node in Units 1-6 and is correctly assigned. No CURR-01 concept violations.

---

### Unit 7: Big Beats (rhythmUnit7Redesigned.js)

Unit header: 6/8 compound meter. START_ORDER = 142.

| Node ID       | Name               | Node Type   | Current Game (exercises[0].type) | Introduced Concept (focusDurations / newContentDescription) | Game-Type Violation?                             | Kodaly Order Flag                                                                                                                                                                                                                                         |
| ------------- | ------------------ | ----------- | -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rhythm_7_1    | Two Big Beats      | DISCOVERY   | RHYTHM (legacy)                  | focusDurations: ['qd'] + timeSignature: '6/8'               | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION  | **SIG+DUR VIOLATION**: 6/8 is a new time signature AND qd is listed as a new duration — two concepts per D-13/D-14                                                                                                                                        |
| rhythm_7_2    | Feel the Pulse     | PRACTICE    | RHYTHM (legacy)                  | none                                                        | WRONG: bare RHYTHM; see Pitfall 1                | N/A                                                                                                                                                                                                                                                       |
| rhythm_7_3    | Adding Quarters    | DISCOVERY   | RHYTHM_TAP                       | focusDurations: ['q']                                       | CORRECT (game type)                              | **REPEATED**: q (quarter note) was fully introduced in Unit 1 Node 1; it cannot be a "new concept" here. The actual new concept is "quarter note behaviour within 6/8". CURR-01 violation per D-12 — the node description conflates context with concept. |
| rhythm_7_4    | Mixing It Up       | PRACTICE    | RHYTHM_DICTATION                 | focusDurations: ['8']                                       | WRONG: D-05 Practice should use MetronomeTrainer | **REPEATED + WRONG NODE TYPE FOR INTRODUCTION**: 8 (eighth note) was introduced in Unit 3. This Practice node introduces a new concept (eighths in 6/8), violating the rule that only Discovery nodes introduce concepts.                                 |
| rhythm_7_5    | Compound Cocktail  | MIX_UP      | RHYTHM_TAP                       | none                                                        | WRONG: D-06 MIX_UP should use RHYTHM_DICTATION   | N/A                                                                                                                                                                                                                                                       |
| rhythm_7_6    | Quick Beats        | SPEED_ROUND | RHYTHM (legacy)                  | none                                                        | WRONG: D-09 requires ARCADE_RHYTHM               | N/A                                                                                                                                                                                                                                                       |
| boss_rhythm_7 | Compound Commander | MINI_BOSS   | ARCADE_RHYTHM                    | none                                                        | WRONG: D-10 requires RHYTHM_TAP for MINI_BOSS    | N/A                                                                                                                                                                                                                                                       |

**Unit 7 summary:** 5 of 7 game-type violations. 3 CURR-01 violations: rhythm_7_1 (SIG+DUR), rhythm_7_3 (repeated quarter framed as new), rhythm_7_4 (repeated eighth framed as new on a Practice node). Unit 7 needs the most remediation work.

---

### Unit 8: Off-Beat Magic (rhythmUnit8Redesigned.js)

Unit header: syncopation patterns. START_ORDER = 149. Contains the true BOSS capstone node.

| Node ID       | Name                | Node Type   | Current Game (exercises[0].type) | Introduced Concept (focusDurations / newContentDescription) | Game-Type Violation?                             | Kodaly Order Flag                                                                                                                                                                                                              |
| ------------- | ------------------- | ----------- | -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| rhythm_8_1    | Off-Beat Surprise   | DISCOVERY   | RHYTHM (legacy)                  | focusDurations: ['8']                                       | WRONG: should be RHYTHM_TAP or RHYTHM_DICTATION  | **REPEATED**: '8' (eighth note) was introduced in Unit 3. The real concept is "syncopation technique" — focusDurations should be [] and newContentDescription should describe syncopation, not duration. Requires remediation. |
| rhythm_8_2    | Between the Beats   | PRACTICE    | RHYTHM (legacy)                  | none                                                        | WRONG: bare RHYTHM; see Pitfall 1                | N/A                                                                                                                                                                                                                            |
| rhythm_8_3    | Dotted Groove       | DISCOVERY   | RHYTHM_TAP                       | focusDurations: ['qd']                                      | CORRECT (game type)                              | **REPEATED**: qd (dotted quarter) was introduced in Unit 5 Node 4. Same issue as rhythm_8_1 — the real concept is "dotted-quarter syncopation pattern", not a new duration. focusDurations is misleading.                      |
| rhythm_8_4    | Swing and Sway      | PRACTICE    | RHYTHM_DICTATION                 | none                                                        | WRONG: D-05 Practice should use MetronomeTrainer | N/A                                                                                                                                                                                                                            |
| rhythm_8_5    | Syncopation Shuffle | MIX_UP      | RHYTHM_TAP                       | none                                                        | WRONG: D-06 MIX_UP should use RHYTHM_DICTATION   | N/A                                                                                                                                                                                                                            |
| rhythm_8_6    | Rapid Syncopation   | SPEED_ROUND | RHYTHM (legacy)                  | none                                                        | WRONG: D-09 requires ARCADE_RHYTHM               | N/A                                                                                                                                                                                                                            |
| boss_rhythm_8 | Rhythm Master       | BOSS        | ARCADE_RHYTHM (3 exercises)      | none                                                        | CORRECT (D-11: BOSS → ArcadeRhythmGame)          | N/A                                                                                                                                                                                                                            |

**Unit 8 summary:** 5 of 7 game-type violations. 2 CURR-01 violations: rhythm*8_1 and rhythm_8_3 list already-learned durations in focusDurations; the true new concept is the syncopation \_pattern*, not a new duration value. boss_rhythm_8 correctly uses ARCADE_RHYTHM.

---

## Architecture Patterns

### Audit Document Structure

The audit output (the deliverable) is a single `.md` file committed to the repo. Based on CONTEXT.md D-01 through D-03, the structure is:

```
docs/curriculum-audit-v3.2.md
├── Header (date, scope, policy summary)
├── Game-Type Policy (D-04 through D-11 in table form)
├── One-Concept Rule (D-12 through D-14)
├── Kodaly Order (D-15 through D-17)
├── Unit 1 table (7 rows)
├── Unit 2 table (7 rows)
├── Unit 3 table (7 rows)
├── Unit 4 table (7 rows)
├── Unit 5 table (7 rows)
├── Unit 6 table (7 rows)
├── Unit 7 table (7 rows)
├── Unit 8 table (7 rows)
└── Remediation List (one entry per violation)
```

The node data needed to populate all 8 tables is fully captured in the "Complete Node Audit" section above.

### Remediation List Format (D-03)

Each entry covers one actionable fix. Format:

```
[NODE-ID] [Node Name]
  Violation: [game-type | concept]
  Current: [current exercise type / current focusDurations]
  Required: [correct exercise type / correct focusDurations and description]
  Phase 22 action: [what the implementer must change]
```

---

## Don't Hand-Roll

| Problem              | Don't Build                | Use Instead                              | Why                                                           |
| -------------------- | -------------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| Node data extraction | Script to parse unit files | Direct file read during task execution   | 8 files, 48 nodes, all already read; no tooling needed        |
| Violation detection  | Automated linter           | Manual cross-reference with policy table | Phase 20 is documentation; Phase 22 adds automated validation |
| Audit format         | Custom schema              | Plain Markdown table (D-01)              | Consumed by human + Phase 22 implementer; simplicity wins     |

---

## Common Pitfalls

### Pitfall 1: The `RHYTHM` exercise type ambiguity

**What goes wrong:** Many nodes use `EXERCISE_TYPES.RHYTHM` (bare, legacy). It is unclear which game component this maps to in the redesigned architecture. The research summary notes "MetronomeTrainer" but this is the PRE-redesign mapping.

**Why it happens:** The redesign added `RHYTHM_TAP`, `RHYTHM_DICTATION`, and `ARCADE_RHYTHM` in v2.9. Existing nodes were not all updated. Bare `RHYTHM` predates the new game type system.

**How to handle in the audit:** Treat bare `RHYTHM` on ANY redesigned node as a violation requiring replacement with one of the three typed alternatives. The correct replacement is determined by the node's `nodeType` (D-04 through D-11).

**In remediation list:** Document both the current type (`RHYTHM`) and the required type based on node type.

[VERIFIED: constants.js shows all four types; unit files show mixed usage]

### Pitfall 2: focusDurations as "new concept" proxy — unreliable in Units 7 and 8

**What goes wrong:** The audit must identify what concept is being introduced. `focusDurations` is the primary field, but in Units 7 and 8, it contains duration values that were already taught in earlier units (q in Unit 7 node 3, 8 in Unit 7 node 4, 8 in Unit 8 node 1, qd in Unit 8 node 3).

**Why it happens:** Units 7 and 8 introduce "duration-in-new-context" (e.g., quarter notes _within 6/8 time_, eighth notes _as syncopation_). The unit authors placed the duration in `focusDurations` even though the duration itself is not new — the new concept is the rhythmic technique or meter.

**How to handle in the audit:** Cross-check `focusDurations` against all earlier units. If a duration appears in `focusDurations` of a later node but was already in `focusDurations` of an earlier node, flag as REPEATED violation. In the remediation list, specify that `focusDurations` should be set to `[]` and `newContentDescription` should describe the technique, not the duration.

[VERIFIED: direct comparison of all unit files]

### Pitfall 3: MINI_BOSS vs BOSS policy distinction

**What goes wrong:** MINI_BOSS → RHYTHM_TAP (D-10), BOSS → ARCADE_RHYTHM (D-11). They are different. All MINI_BOSS nodes currently use ARCADE_RHYTHM (wrong). Both true BOSS nodes (boss_rhythm_6, boss_rhythm_8) correctly use ARCADE_RHYTHM.

**Why it matters:** The planner must list MINI_BOSS violations separately from BOSS violations in the remediation list, with different required types.

[VERIFIED: all unit files — 5 MINI_BOSS nodes each use ARCADE_RHYTHM; 2 BOSS nodes use ARCADE_RHYTHM correctly]

### Pitfall 4: rhythm_5_3 (Waltz Time) — correct isolation but edge case

**What goes wrong:** rhythm*5_3 introduces 3/4 time with `focusDurations: []` — correctly isolated per D-13. However, it sits in the \_middle* of the dotted-notes unit (between two dotted-duration Discovery nodes), which is a sequencing anomaly.

**How to handle:** This is a Kodaly order flag only (flag as "context insertion within dotted unit"), NOT a CURR-01 violation. D-17 prohibits remediating sequencing issues. The audit table should note it as "NEW-SIG: correctly isolated; position within unit flagged only."

[VERIFIED: rhythmUnit5Redesigned.js lines 139-185]

### Pitfall 5: boss_rhythm_5 has 2 exercises

**What goes wrong:** boss*rhythm_5 has two exercises (one in 4/4, one in 3/4). This is structurally unusual but not a policy violation — the policy governs exercise \_type*, not count. Both exercises correctly use ARCADE_RHYTHM if MINI_BOSS policy is updated... except MINI_BOSS policy requires RHYTHM_TAP (D-10), so the violation is the type, not the count.

**How to handle:** Remediation entry for boss_rhythm_5 should note both exercises must change from ARCADE_RHYTHM to RHYTHM_TAP.

[VERIFIED: rhythmUnit5Redesigned.js lines 372-400]

---

## Violation Summary Statistics

### Game-Type Violations by Unit

| Unit      | Total Nodes | Game-Type Violations | Correct                                                                    |
| --------- | ----------- | -------------------- | -------------------------------------------------------------------------- |
| Unit 1    | 7           | 6                    | 1 (rhythm_1_3)                                                             |
| Unit 2    | 7           | 5                    | 2 (rhythm_2_2 bare-RHYTHM is wrong but policy unclear; rhythm_2_3 correct) |
| Unit 3    | 7           | 5                    | 2 (rhythm_3_2 bare-RHYTHM; rhythm_3_3 correct)                             |
| Unit 4    | 7           | 4                    | 3 (rhythm_4_3, rhythm_4_5 correct; rhythm_4_2 bare-RHYTHM)                 |
| Unit 5    | 7           | 4                    | 3 (rhythm_5_3, rhythm_5_4 correct; rhythm_5_2 bare-RHYTHM)                 |
| Unit 6    | 7           | 5                    | 2 (rhythm_6_3 correct; boss_rhythm_6 correct)                              |
| Unit 7    | 7           | 5                    | 2 (rhythm_7_3 correct game type; boss — no true boss in Unit 7)            |
| Unit 8    | 7           | 5                    | 2 (rhythm_8_3 correct game type; boss_rhythm_8 correct)                    |
| **Total** | **56\***    | **~39**              | **~17**                                                                    |

\*56 = 48 nodes + nodes with 2 exercises counted as 1 violation target. Bare `RHYTHM` on Practice nodes treated as violations.

### CURR-01 (One-Concept) Violations

| Node ID    | Violation Type        | Description                                                                  |
| ---------- | --------------------- | ---------------------------------------------------------------------------- |
| rhythm_7_1 | SIG+DUR               | 6/8 time signature + qd dotted-quarter listed simultaneously as new concepts |
| rhythm_7_3 | REPEATED              | focusDurations: ['q'] but q was introduced in Unit 1                         |
| rhythm_7_4 | REPEATED + WRONG-NODE | focusDurations: ['8'] on Practice node; 8 was introduced in Unit 3           |
| rhythm_8_1 | REPEATED              | focusDurations: ['8'] but 8 was introduced in Unit 3                         |
| rhythm_8_3 | REPEATED              | focusDurations: ['qd'] but qd was introduced in Unit 5                       |

**Total CURR-01 violations: 5**

### Kodaly Order Violations (flag only — not remediated)

Per D-16 (custom project order): quarter → half → whole → eighth → rests → dotted → sixteenth → compound

| Node ID    | Flag                       | Reason                                                                                                                                          |
| ---------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| rhythm_5_3 | NEW-SIG within dotted unit | 3/4 time introduced between dotted-half and dotted-quarter nodes; sequencing anomaly, not a duration order violation                            |
| rhythm_7_1 | SIG+DUR                    | 6/8 introduces compound meter as expected (after sixteenth) but pairs it with qd duration — the SIG+DUR CURR-01 flag also covers Kodaly concern |

No duration-order violations detected: the custom project sequence (q→h→w→8→rests→dotted→16→compound) is respected across Units 1-8.

---

## Remediation List (complete — for Phase 22 reference)

This is the complete list of actionable fixes. Game-type fixes = exercise type changes in unit files. Concept fixes = focusDurations and newContentDescription changes.

### Game-Type Fixes

| #    | Node ID       | Node Type   | Current Game       | Required Game                 | Change                                                                                                                                               |
| ---- | ------------- | ----------- | ------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-01 | rhythm_1_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-02 | rhythm_1_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-03 | rhythm_1_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-04 | rhythm_1_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                                                                                            |
| G-05 | rhythm_1_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                                                                                            |
| G-06 | boss_rhythm_1 | MINI_BOSS   | ARCADE_RHYTHM      | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-07 | rhythm_2_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-08 | rhythm_2_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-09 | rhythm_2_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-10 | rhythm_2_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                                                                                            |
| G-11 | rhythm_2_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                                                                                            |
| G-12 | boss_rhythm_2 | MINI_BOSS   | ARCADE_RHYTHM      | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-13 | rhythm_3_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-14 | rhythm_3_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-15 | rhythm_3_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-16 | rhythm_3_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                                                                                            |
| G-17 | rhythm_3_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                                                                                            |
| G-18 | boss_rhythm_3 | MINI_BOSS   | ARCADE_RHYTHM      | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-19 | rhythm_4_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-20 | rhythm_4_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-21 | rhythm_4_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-22 | rhythm_4_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                                                                                            |
| G-23 | boss_rhythm_4 | MINI_BOSS   | ARCADE_RHYTHM      | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-24 | rhythm_5_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-25 | rhythm_5_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-26 | rhythm_5_5    | PRACTICE    | RHYTHM_TAP         | RHYTHM_TAP (MetronomeTrainer) | Type correct but echoed for clarity; MetronomeTrainer is echo-mode; keep as-is if RHYTHM_TAP IS the MetronomeTrainer echo mode — see Open Question 1 |
| G-27 | rhythm_5_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                                                                                            |
| G-28 | boss_rhythm_5 | MINI_BOSS   | ARCADE_RHYTHM (×2) | RHYTHM_TAP (×2)               | Replace both exercises[].type                                                                                                                        |
| G-29 | rhythm_6_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-30 | rhythm_6_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-31 | rhythm_6_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-32 | rhythm_6_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                                                                                            |
| G-33 | rhythm_6_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                                                                                            |
| G-34 | rhythm_7_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-35 | rhythm_7_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-36 | rhythm_7_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-37 | rhythm_7_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                                                                                            |
| G-38 | rhythm_7_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                                                                                            |
| G-39 | boss_rhythm_7 | MINI_BOSS   | ARCADE_RHYTHM      | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-40 | rhythm_8_1    | DISCOVERY   | RHYTHM             | RHYTHM_TAP                    | Replace exercises[0].type                                                                                                                            |
| G-41 | rhythm_8_2    | PRACTICE    | RHYTHM             | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-42 | rhythm_8_4    | PRACTICE    | RHYTHM_DICTATION   | RHYTHM_TAP (MetronomeTrainer) | Replace exercises[0].type                                                                                                                            |
| G-43 | rhythm_8_5    | MIX_UP      | RHYTHM_TAP         | RHYTHM_DICTATION              | Replace exercises[0].type                                                                                                                            |
| G-44 | rhythm_8_6    | SPEED_ROUND | RHYTHM             | ARCADE_RHYTHM                 | Replace exercises[0].type                                                                                                                            |

**Total game-type remediations: 44** (G-26 is conditional — see Open Question 1)

### Concept (CURR-01) Fixes

| #    | Node ID    | Violation                                                       | Required Change                                                                                                                                                                                                                                                                                                                            |
| ---- | ---------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C-01 | rhythm_7_1 | SIG+DUR: 6/8 time + qd duration introduced together             | Split into two Discovery nodes: one for 6/8 time (focusDurations: [], newContentDescription: '6/8 Compound Meter'), one for qd role within 6/8. Alternatively: keep as one node, set focusDurations: [] and newContentDescription: '6/8 Compound Meter (Two Big Beats)', remove qd from focusDurations since the metre is the new concept. |
| C-02 | rhythm_7_3 | REPEATED: q already introduced in Unit 1                        | Set focusDurations: [] and newContentDescription: 'Quarter Notes within 6/8 Context'. The node teaches 6/8 feel with a known duration — that is valid but must not claim to introduce a new duration.                                                                                                                                      |
| C-03 | rhythm_7_4 | REPEATED: 8 already introduced in Unit 3; also on Practice node | Set focusDurations: [] and newContentDescription: 'Eighth Notes within 6/8 Context'. Consider whether this should be a Discovery node given it introduces a contextual technique.                                                                                                                                                          |
| C-04 | rhythm_8_1 | REPEATED: 8 already introduced in Unit 3                        | Set focusDurations: [] and newContentDescription: 'Syncopation: Eighth-Quarter-Eighth Pattern'. The concept is syncopation, not the duration.                                                                                                                                                                                              |
| C-05 | rhythm_8_3 | REPEATED: qd already introduced in Unit 5                       | Set focusDurations: [] and newContentDescription: 'Dotted Quarter-Eighth Syncopation Pattern'. Same fix as C-04.                                                                                                                                                                                                                           |

**Total concept remediations: 5**

---

## State of the Art

| Old Approach                                | Current Approach                                  | When Changed | Impact                                                                                       |
| ------------------------------------------- | ------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| Bare `RHYTHM` exercise type                 | `RHYTHM_TAP`, `RHYTHM_DICTATION`, `ARCADE_RHYTHM` | v2.9         | Nodes authored before v2.9 still use legacy type                                             |
| No MIX_UP/SPEED_ROUND/MINI_BOSS distinction | Explicit nodeType enum with 8 values              | Current      | Policy violations exist because exercise types were not updated when node types were refined |

---

## Assumptions Log

| #   | Claim                                                                                                                            | Section                                 | Risk if Wrong                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A1  | `EXERCISE_TYPES.RHYTHM` maps to MetronomeTrainer in the current runtime and is not a synonym for any of the three new game types | Pitfall 1, Remediation                  | If RHYTHM already routes to a specific new game, some "violations" may be false positives                     |
| A2  | `EXERCISE_TYPES.RHYTHM_TAP` is the exercise type consumed by MetronomeTrainer in echo mode (D-05)                                | Game-type policy application throughout | If RHYTHM_TAP maps to RhythmReadingGame (notation-showing) exclusively, then Practice node corrections differ |
| A3  | rhythm_5_3 correctly isolates 3/4 time (no CURR-01 violation) because focusDurations is []                                       | Unit 5 analysis                         | Confirmed by file read; very low risk                                                                         |
| A4  | boss_rhythm_7 has isBoss: false (set explicitly in file) — it is a MINI_BOSS, not a true BOSS                                    | Unit 7 boss analysis                    | Confirmed by file read line 393; very low risk                                                                |

---

## Open Questions

1. **RHYTHM_TAP = MetronomeTrainer (echo) OR RhythmReadingGame (notation)?**
   - What we know: D-04 says Discovery → "notation-showing game (RhythmReadingGame or RhythmDictationGame)". D-05 says Practice → "MetronomeTrainer (echo/call-response)". CONTEXT.md does not explicitly state which EXERCISE_TYPE string maps to MetronomeTrainer.
   - What's unclear: Is `RHYTHM_TAP` the exercise type used by MetronomeTrainer, or by RhythmReadingGame? The constants show RHYTHM_TAP and RHYTHM_DICTATION as distinct — one likely maps to each game.
   - Recommendation: The audit document should note this as requiring Phase 22 clarification. The planner should not block audit completion on this — the remediation list correctly specifies which policy applies; Phase 22 resolves the type-to-component binding. **The audit is policy, not implementation.**
   - Impact on G-26: If RHYTHM_TAP = RhythmReadingGame (notation-showing), then rhythm_5_5 (PRACTICE) using RHYTHM_TAP IS a violation — Practice should use MetronomeTrainer, not RhythmReadingGame. G-26 stays as a violation.

2. **Should rhythm_7_3 and rhythm_7_4 concept remediations also change the node type to DISCOVERY?**
   - What we know: rhythm_7_4 is PRACTICE but introduces a concept (eighths in 6/8 context). D-12 implies concepts belong on Discovery nodes.
   - What's unclear: The phase boundary says "audit only, no source changes". But if the remediation list is the implementation blueprint, the planner needs to decide whether node type changes are in scope for Phase 22.
   - Recommendation: The audit document should flag node-type changes as separate from game-type changes. Include them in the remediation list as "OPTIONAL: consider changing nodeType to DISCOVERY" — let the Phase 22 planner decide.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 20 is documentation-only; no external dependencies.

---

## Validation Architecture

`workflow.nyquist_validation` is not set to `false` in config.json, so this section is included. However, Phase 20 produces only a Markdown document — it has no code or executable output.

### Test Framework

| Property           | Value                                              |
| ------------------ | -------------------------------------------------- |
| Framework          | Vitest (project-wide)                              |
| Config file        | vitest.config.js (implied by package.json scripts) |
| Quick run command  | `npm run test:run`                                 |
| Full suite command | `npm run test:run`                                 |

### Phase Requirements → Test Map

| Req ID  | Behavior                                             | Test Type   | Automated Command           | File Exists? |
| ------- | ---------------------------------------------------- | ----------- | --------------------------- | ------------ |
| CURR-01 | Each node has at most one new concept documented     | manual-only | N/A — audit is human review | N/A          |
| CURR-02 | Discovery nodes use notation-showing game documented | manual-only | N/A                         | N/A          |
| CURR-03 | Practice nodes use echo game documented              | manual-only | N/A                         | N/A          |
| CURR-04 | Speed/Boss nodes use ArcadeRhythmGame documented     | manual-only | N/A                         | N/A          |

**Note:** All four requirements are satisfied by the _existence and content_ of the audit document, not by test execution. The planner should not schedule test tasks for this phase. The gate is: audit document committed and peer-reviewed.

### Wave 0 Gaps

None — no test files needed for a documentation phase.

---

## Security Domain

`security_enforcement` is not set to `false` in config.json.

This phase produces only a Markdown document committed to the repository. No authentication, user data, network calls, or cryptography is involved. No ASVS categories apply.

---

## Sources

### Primary (HIGH confidence)

- `src/data/units/rhythmUnit1Redesigned.js` — direct file read, all 7 nodes
- `src/data/units/rhythmUnit2Redesigned.js` — direct file read, all 7 nodes
- `src/data/units/rhythmUnit3Redesigned.js` — direct file read, all 7 nodes
- `src/data/units/rhythmUnit4Redesigned.js` — direct file read, all 7 nodes
- `src/data/units/rhythmUnit5Redesigned.js` — direct file read, all 7 nodes
- `src/data/units/rhythmUnit6Redesigned.js` — direct file read, all 7 nodes
- `src/data/units/rhythmUnit7Redesigned.js` — direct file read, all 7 nodes
- `src/data/units/rhythmUnit8Redesigned.js` — direct file read, all 7 nodes
- `src/data/nodeTypes.js` — NODE_TYPES enum (8 types verified)
- `src/data/constants.js` — EXERCISE_TYPES enum (all 11 values verified)
- `.planning/phases/20-curriculum-audit/20-CONTEXT.md` — locked decisions D-01 through D-17

### Secondary (MEDIUM confidence)

- `.planning/research/SUMMARY.md` — v3.2 research summary; architecture and pitfall context

---

## Metadata

**Confidence breakdown:**

- Node data (IDs, types, exercise types, focusDurations): HIGH — read directly from source
- Violation detection: HIGH — direct cross-reference of policy (CONTEXT.md) against source data
- Open questions (RHYTHM_TAP mapping): LOW — not verified in game component source; deferred to Phase 22
- Kodaly order analysis: HIGH — custom project order from CONTEXT.md D-16; applied mechanically

**Research date:** 2026-04-06
**Valid until:** Until any unit file is modified (file hashes not tracked; re-audit if unit files change before Phase 22 ships)
