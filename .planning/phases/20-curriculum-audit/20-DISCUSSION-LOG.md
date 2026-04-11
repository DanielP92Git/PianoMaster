# Phase 20: Curriculum Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 20-curriculum-audit
**Areas discussed:** Audit output format, Game-type policy rules, Mixed lesson scope, One-concept rule enforcement

---

## Audit Output Format

| Option                 | Description                                                                                                    | Selected |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Node-by-node table     | One row per node (56 rows): ID, name, nodeType, current exercises, introduced concept, violations, remediation | ✓        |
| Grouped by violation   | Group nodes by violation type (wrong game, multi-concept, missing concept)                                     |          |
| Unit-by-unit narrative | Prose description per unit explaining the pedagogical flow                                                     |          |

**User's choice:** Node-by-node table
**Notes:** Easy to scan and use as a checklist during Phase 22 implementation.

---

## Game-Type Policy Rules

### MIX_UP Nodes

| Option                  | Description                                                    | Selected |
| ----------------------- | -------------------------------------------------------------- | -------- |
| Mixed lesson            | Interleave visual_recognition + syllable_matching + rhythm_tap | ✓        |
| Visual Recognition only | Single-game mode                                               |          |
| You decide              | Claude picks                                                   |          |

**User's choice:** Mixed lesson

### REVIEW Nodes

| Option                        | Description                            | Selected |
| ----------------------------- | -------------------------------------- | -------- |
| Mixed lesson                  | Reviews via interleaved question types | ✓        |
| Same as Practice (rhythm_tap) | Echo/tap practice for review material  |          |
| You decide                    | Claude picks                           |          |

**User's choice:** Mixed lesson

### CHALLENGE Nodes

| Option                          | Description                                 | Selected |
| ------------------------------- | ------------------------------------------- | -------- |
| Arcade rhythm                   | Challenges with tighter timing, arcade mode | ✓        |
| Mixed lesson with harder config | Same engine, faster tempo or more questions |          |
| You decide                      | Claude picks                                |          |

**User's choice:** Arcade rhythm

### MINI_BOSS Nodes

| Option        | Description                                       | Selected |
| ------------- | ------------------------------------------------- | -------- |
| Arcade rhythm | Unit checkpoint with arcade 'epic challenge' feel |          |
| Mixed lesson  | A longer mixed lesson covering all unit concepts  | ✓        |
| You decide    | Claude picks                                      |          |

**User's choice:** Mixed lesson (not arcade — prefers comprehensive review over pressure)

---

## Mixed Lesson Scope

### Expansion Policy

| Option                 | Description                                                         | Selected |
| ---------------------- | ------------------------------------------------------------------- | -------- |
| Expand to all eligible | Discovery, Practice, MIX_UP, REVIEW, MINI_BOSS all get mixed_lesson | ✓        |
| Only MIX_UP and REVIEW | Keep Discovery as rhythm_dictation, Practice as rhythm_tap          |          |
| Keep current scope     | Only Unit 1 nodes 1-3 stay as mixed_lesson                          |          |

**User's choice:** Expand to all eligible

### Discovery Nodes Specifically

| Option                           | Description                                                            | Selected |
| -------------------------------- | ---------------------------------------------------------------------- | -------- |
| Mixed lesson with notation focus | Weight toward notation-showing questions, include some visual/syllable | ✓        |
| Rhythm dictation only            | Pure notation-showing game per CURR-02                                 |          |
| You decide                       | Claude picks                                                           |          |

**User's choice:** Mixed lesson with notation focus

---

## One-Concept Rule Enforcement

### Game Mode as Concept

| Option                       | Description                                                  | Selected |
| ---------------------------- | ------------------------------------------------------------ | -------- |
| No, game mode doesn't count  | Only musical concepts count; game mode is a pedagogical tool | ✓        |
| Yes, new game mode = concept | Strict: new note + new game = two concepts                   |          |
| Soft violation               | Flag but don't require remediation                           |          |

**User's choice:** Game mode doesn't count

### Concept Definition

| Option                     | Description                                         | Selected |
| -------------------------- | --------------------------------------------------- | -------- |
| Duration values only       | New durations/rests only                            |          |
| Duration + time signature  | Durations plus time signature changes               | ✓        |
| Broad: any musical element | Durations, time signatures, articulations, dynamics |          |

**User's choice:** Duration + time signature

---

## Claude's Discretion

- Question mix ratios within mixed_lesson nodes (notation vs visual vs syllable weights)
- Whether to include brief narrative notes per unit alongside the table

## Deferred Ideas

None
