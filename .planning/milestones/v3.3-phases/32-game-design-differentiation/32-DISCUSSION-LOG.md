# Phase 32: Game Design Differentiation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 32-game-design-differentiation
**Areas discussed:** Speed Challenge tuning, Boss difficulty levers, Pattern-node identity (Mix-Up), Shared difficulty vocabulary

---

## Area Selection

| Option                         | Description                                                    | Selected |
| ------------------------------ | -------------------------------------------------------------- | -------- |
| Speed Challenge tuning         | Exercise count, variety rules, tempo scaling, pool size        | ✓        |
| Boss difficulty levers         | What makes bosses distinctly harder beyond current tempo+count | ✓        |
| Pattern-node identity (Mix-Up) | How Mix-Up nodes differ from practice                          | ✓        |
| Shared difficulty vocabulary   | Consistent lever vocabulary for future content                 | ✓        |

**User's choice:** All four areas

---

## Speed Challenge Tuning

### Q1: How many patterns per Speed Challenge session?

| Option                     | Description                            | Selected |
| -------------------------- | -------------------------------------- | -------- |
| 8 patterns (Recommended)   | Matches 2-3 min target for 8-year-olds | ✓        |
| 10 patterns (keep current) | Current hardcoded value                |          |
| Variable per unit          | 6-12 scaling per unit                  |          |

**User's choice:** 8 patterns

### Q2: Pattern variety rule within a session?

| Option                                     | Description                           | Selected |
| ------------------------------------------ | ------------------------------------- | -------- |
| No two consecutive identical (Recommended) | Matches success criterion 1 literally | ✓        |
| No repeats at all                          | Pure but depends on pool size         |          |
| Weighted shuffle with cooldown             | Balanced but more complex             |          |

**User's choice:** No two consecutive identical

### Q3: Within-session tempo behaviour?

| Option                                | Description                                 | Selected |
| ------------------------------------- | ------------------------------------------- | -------- |
| Fixed tempo from config (Recommended) | Predictable, current behavior               | ✓        |
| Ramp up across session                | More intense, risks punishing strugglers    |          |
| Ramp on success, hold on failure      | Adaptive but belongs in PLAY-F02 (deferred) |          |

**User's choice:** Fixed tempo from config

### Q4: Pattern pool scope?

| Option                                           | Description                             | Selected |
| ------------------------------------------------ | --------------------------------------- | -------- |
| Same scope as unit's practice node (Recommended) | Variety comes from shuffle, not content | ✓        |
| Wider — include earlier units                    | Blurs pedagogy                          |          |
| Curated 'speed-friendly' subset                  | New pattern authoring in scope          |          |

**User's choice:** Same scope as unit's practice node

---

## Boss Difficulty Levers

### Q1: Primary levers (multi-select, pick 2-3)

| Option                           | Description                                    | Selected |
| -------------------------------- | ---------------------------------------------- | -------- |
| Wider duration set (Recommended) | Cumulative prior units — 'everything you know' | ✓        |
| Longer patterns (more measures)  | 4 bars vs 1-2                                  | ✓        |
| Reduced timing forgiveness       | Remove from EASY_NODE_TYPES                    | ✓        |
| Harder question type mix         | Emphasize dictation + reading                  | ✓        |

**User's choice:** All 4 levers

### Q2: Apply to MINI_BOSS + BOSS or scale by type?

| Option                             | Description                  | Selected |
| ---------------------------------- | ---------------------------- | -------- |
| Scale by boss type (Recommended)   | MINI_BOSS subset, BOSS all 4 | ✓        |
| Apply all levers to both           | Simpler but no gradient      |          |
| Apply all levers to full BOSS only | MINI_BOSS stays current      |          |

**User's choice:** Scale by boss type

### Q3: Wider duration set scope?

| Option                               | Description             | Selected |
| ------------------------------------ | ----------------------- | -------- |
| Cumulative prior units (Recommended) | Unit N pulls from 1..N  | ✓        |
| Current + immediately prior unit     | Smaller review scope    |          |
| Current unit only, harder patterns   | Purer current-unit test |          |

**User's choice:** Cumulative prior units

### Q4: Timing forgiveness tier?

| Option                                       | Description                             | Selected |
| -------------------------------------------- | --------------------------------------- | -------- |
| Use existing 'hard' thresholds (Recommended) | Remove boss from EASY_NODE_TYPES        | ✓        |
| New 'boss' threshold tier                    | Stricter than default; more maintenance |          |
| Keep easy thresholds                         | Don't pull this lever                   |          |

**User's choice:** Existing default (non-easy) thresholds

### Q5: Full BOSS pattern length?

| Option                    | Description                           | Selected |
| ------------------------- | ------------------------------------- | -------- |
| 4 bars (Recommended)      | Matches Phase 23 measure-count policy | ✓        |
| 2 bars (same as practice) | Don't pull this lever                 |          |
| Variable 2-4 per question | Unpredictable, inconsistent feel      |          |

**User's choice:** 4 bars

### Q6: Special boss completion feedback?

| Option                                    | Description                  | Selected |
| ----------------------------------------- | ---------------------------- | -------- |
| Keep standard VictoryScreen (Recommended) | No new UI work               | ✓        |
| Add boss-only celebration VFX/sound       | New capability, out of scope |          |

**User's choice:** Keep standard VictoryScreen

### Q7: Stricter pass threshold?

| Option                              | Description                     | Selected |
| ----------------------------------- | ------------------------------- | -------- |
| Keep current 60/80/95 (Recommended) | Hardness in content, not gate   | ✓        |
| Raise to 70/85/95 for bosses        | Stricter star gates             |          |
| Raise only for full BOSS            | Minimal change, max finale feel |          |

**User's choice:** Keep current 60/80/95

---

## Pattern-node identity (Mix-Up)

### Q1 (initial): What makes Mix-Up distinct?

User asked: _"are you sure this node is required in the trail flow? or is it too much, even if we refactor it?"_

Claude surfaced: only 6 rhythm Mix-Up nodes exist (not 8); they use identical `patternTags` + tempo as the preceding practice node; REQUIREMENTS.md PLAY-04 explicitly allows "unique content **or replaced**"; treble/bass Mix-Up uses Memory Game but rhythm Mix-Up never got a distinct game.

### Q1 (reformulated): Refactor or remove?

| Option                                  | Description                                                                 | Selected |
| --------------------------------------- | --------------------------------------------------------------------------- | -------- |
| Remove the 6 Mix-Up nodes (Recommended) | Delete from unit files, re-wire prerequisites, accept orphaned student rows | ✓        |
| Refactor with signature-pattern tag     | Author 30-50 new curated patterns                                           |          |
| Convert to rhythm Memory Game           | Pedagogically aligned but new game type — out of scope                      |          |
| Keep as-is                              | Fails PLAY-04                                                               |          |

**User's choice:** Remove the 6 Mix-Up nodes
**Notes:** User raised the valid product question of whether refactor was even worth it. REQUIREMENTS.md "or replaced" wording confirmed removal is a valid resolution.

### Q2: How to handle orphaned student progress rows?

| Option                                  | Description                                             | Selected |
| --------------------------------------- | ------------------------------------------------------- | -------- |
| Leave orphaned rows in DB (Recommended) | Pre-launch, minimal risk, getNodeById returns undefined | ✓        |
| Supabase migration to delete rows       | Cleaner but more risk                                   |          |
| Migrate stars to prior practice node    | Most complex, risk of double-counting                   |          |

**User's choice:** Leave orphaned rows

### Q3: Unit structure after removal?

| Option                          | Description                                                | Selected |
| ------------------------------- | ---------------------------------------------------------- | -------- |
| Shrink to 6 nodes (Recommended) | Discovery → Practice → Discovery → Practice → Speed → Boss | ✓        |
| Add Review or second Speed node | Keeps count at 7, new authoring                            |          |

**User's choice:** Shrink to 6 nodes

### Q4: Preserve IDs or fully delete?

| Option                        | Description              | Selected |
| ----------------------------- | ------------------------ | -------- |
| Fully delete (Recommended)    | Clean, final             | ✓        |
| Keep ID reserved in a comment | Low-cost archaeology aid |          |

**User's choice:** Fully delete

---

## Shared Difficulty Vocabulary

### Q1: Formalize vocabulary or apply ad-hoc?

| Option                                         | Description                                              | Selected |
| ---------------------------------------------- | -------------------------------------------------------- | -------- |
| Document 4 levers in PEDAGOGY.md (Recommended) | Pool scope / Pattern length / Timing tier / Question mix | ✓        |
| Inline JSDoc on nodeTypes.js                   | Less discoverable                                        |          |
| Skip — let code speak for itself               | No formal doc                                            |          |

**User's choice:** Document in PEDAGOGY.md

### Q2: Refactor `rhythmConfig.complexity` field?

| Option                        | Description              | Selected |
| ----------------------------- | ------------------------ | -------- |
| Leave untouched (Recommended) | Flag as deferred cleanup | ✓        |
| Remove as redundant           | Scope creep              |          |
| Make it authoritative         | Invasive refactor        |          |

**User's choice:** Leave untouched

---

## Claude's Discretion

- Exact algorithm for "no two consecutive identical" pattern selection
- How to identify pattern "identity" for dedup (pattern `id`, binary signature, beat structure)
- Whether `TOTAL_PATTERNS` stays module-level or becomes per-node config
- How to represent "cumulative prior units' durations" in node config (new field vs. derived from unit number)
- Exact ordering of boss question types for harder mix
- Exact migration approach for unit file edits (one file at a time vs. single commit)
- Exact text of the PEDAGOGY.md "4 levers" section
- Whether variety rule in Speed Challenge applies to rest tiles

## Deferred Ideas

- Rhythm Memory Game variant for future Mix-Up node type (future milestone)
- Adaptive tempo escalation on success (tracked as PLAY-F02)
- `RHYTHM_COMPLEXITY` enum cleanup (flagged for future code-quality phase)
- Boss-only celebration VFX/sound (future polish phase)
- New "boss" timing threshold tier stricter than default (rejected for Phase 32)
- Per-node `TOTAL_PATTERNS` override (defer until a unit needs it)
