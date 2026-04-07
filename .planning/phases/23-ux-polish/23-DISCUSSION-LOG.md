# Phase 23: UX Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 23-ux-polish
**Areas discussed:** Timing forgiveness model, Game rename, Measure length for middle node types, Kodaly syllable rendering

---

## Timing Forgiveness Model

### Q1: How should timing thresholds vary by node type?

| Option                 | Description                                                                                         | Selected           |
| ---------------------- | --------------------------------------------------------------------------------------------------- | ------------------ |
| Two-tier: easy vs hard | Discovery/Practice/MIX_UP/REVIEW get 100ms PERFECT. CHALLENGE/SPEED_ROUND/MINI_BOSS/BOSS keep 50ms. | :heavy_check_mark: |
| Graduated 3-tier       | Discovery/Practice=100ms, MIX_UP/REVIEW/CHALLENGE=75ms, SPEED/BOSS=50ms.                            |                    |
| You decide             | Claude picks.                                                                                       |                    |

**User's choice:** Two-tier: easy vs hard (Recommended)
**Notes:** None

### Q2: Where should the threshold override live?

| Option                   | Description                                                                            | Selected           |
| ------------------------ | -------------------------------------------------------------------------------------- | ------------------ |
| Shared rhythmTimingUtils | Add nodeType param to calculateTimingThresholds(). Remove MetronomeTrainer local copy. | :heavy_check_mark: |
| Per-game component       | Each game checks nodeType independently.                                               |                    |
| You decide               | Claude picks.                                                                          |                    |

**User's choice:** Shared rhythmTimingUtils (Recommended)
**Notes:** None

### Q3: Should tempo-scaling behavior change?

| Option                              | Description                                                     | Selected           |
| ----------------------------------- | --------------------------------------------------------------- | ------------------ |
| Keep tempo-scaling, raise base only | Easy nodes: base 50->100ms, tempo-scaling still applies on top. | :heavy_check_mark: |
| Flat threshold, no scaling for easy | Easy nodes always get exactly 100ms regardless of tempo.        |                    |
| You decide                          | Claude picks.                                                   |                    |

**User's choice:** Keep tempo-scaling, raise base only (Recommended)
**Notes:** None

---

## Game Rename

### Q1: What child-friendly name replaces 'MetronomeTrainer'?

| Option             | Description                              | Selected           |
| ------------------ | ---------------------------------------- | ------------------ |
| Rhythm Echo        | Describes call-and-response mechanic.    |                    |
| Beat Buddy         | Playful, character-like name.            |                    |
| Tap Along          | Action-oriented, tells child what to do. |                    |
| Other (user input) | User provided custom name.               | :heavy_check_mark: |

**User's choice:** "Listen & Tap" (EN) / "חזור אחריי" (HE)
**Notes:** User provided their own name, bypassing all suggested options.

---

## Measure Length for Middle Node Types

### Q1: What measure length for MIX_UP, REVIEW, CHALLENGE, MINI_BOSS?

| Option                   | Description                                  | Selected           |
| ------------------------ | -------------------------------------------- | ------------------ |
| Graduate by difficulty   | MIX_UP=1, REVIEW=2, CHALLENGE=2, MINI_BOSS=4 | :heavy_check_mark: |
| All middle types = 2-bar | Simple rule: intro=1, middle=2, capstone=4.  |                    |
| You decide               | Claude picks.                                |                    |

**User's choice:** Graduate by difficulty (Recommended)
**Notes:** None

### Q2: Where should measureCount be enforced?

| Option                    | Description                                    | Selected           |
| ------------------------- | ---------------------------------------------- | ------------------ |
| Data layer - node configs | Update all 48 nodes. Build validator enforces. | :heavy_check_mark: |
| Runtime - game components | Game component overrides at render time.       |                    |
| You decide                | Claude picks.                                  |                    |

**User's choice:** Data layer - node configs (Recommended)
**Notes:** None

---

## Kodaly Syllable Rendering

### Q1: Which games show Kodaly syllables?

| Option                      | Description                                                       | Selected           |
| --------------------------- | ----------------------------------------------------------------- | ------------------ |
| Notation-showing games only | RhythmReadingGame + RhythmDictationGame.                          |                    |
| All rhythm games            | Add syllables to all games.                                       |                    |
| Other (user input)          | Toggle button on all notation games, enforced on Discovery nodes. | :heavy_check_mark: |

**User's choice:** Add a syllable toggle button to all games. Enforce syllables on Discovery/introductory nodes when kids learn new rhythm topics.
**Notes:** Enforced = always-on with toggle hidden on Discovery nodes. Other nodes show toggle.

### Q2: Should syllables appear on all nodes?

| Option              | Description                                       | Selected           |
| ------------------- | ------------------------------------------------- | ------------------ |
| All nodes           | Syllables always shown.                           |                    |
| Learning nodes only | Discovery, Practice, MIX_UP, REVIEW only.         |                    |
| Other (user input)  | Enforced on Discovery, toggle on everything else. | :heavy_check_mark: |

**User's choice:** Enforce on new topics and 1st nodes of trail, then rely on syllable toggle button.
**Notes:** Same as Q1 answer — enforced on introductory nodes, optional everywhere else.

### Q3: Where should toggle button appear?

| Option                        | Description                                | Selected           |
| ----------------------------- | ------------------------------------------ | ------------------ |
| Settings bar above the staff  | Small icon button in game's top toolbar.   | :heavy_check_mark: |
| Floating button on staff area | Semi-transparent overlay on notation area. |                    |
| You decide                    | Claude picks.                              |                    |

**User's choice:** Settings bar above the staff (Recommended)
**Notes:** None

### Q4: How should syllables render in VexFlow?

| Option                       | Description                                      | Selected           |
| ---------------------------- | ------------------------------------------------ | ------------------ |
| VexFlow TextNote annotations | Attach text below each note via annotation API.  | :heavy_check_mark: |
| HTML overlay via SVG coords  | Position HTML spans based on SVG note positions. |                    |
| You decide                   | Claude picks.                                    |                    |

**User's choice:** VexFlow TextNote annotations (Recommended)
**Notes:** None

### Q5: Should rests show a syllable?

| Option               | Description                         | Selected           |
| -------------------- | ----------------------------------- | ------------------ |
| No syllable on rests | Rests show nothing below.           |                    |
| Show 'sh' on rests   | 'sh' (EN) / Hebrew equivalent (HE). | :heavy_check_mark: |

**User's choice:** Yes — 'sh' (EN) / 'הס' with Nikud (HE). User to provide exact Nikud version.
**Notes:** User specified they need to provide the Hebrew version with proper Nikud diacritics.

### Q6: Should toggle state persist?

| Option                  | Description                        | Selected           |
| ----------------------- | ---------------------------------- | ------------------ |
| Persist in localStorage | Stays across sessions.             | :heavy_check_mark: |
| Reset each game         | Toggle resets to off each session. |                    |

**User's choice:** Persist in localStorage (Recommended)
**Notes:** None

---

## Claude's Discretion

- Syllable toggle button animation/styling
- Font size and positioning for VexFlow annotations
- Implementation order across the 5 requirements
- Test structure and coverage
- Handling of non-VexFlow games (MetronomeTrainer pulse mode, ArcadeRhythmGame)

## Deferred Ideas

None — discussion stayed within phase scope.
