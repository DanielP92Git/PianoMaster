# Phase 36: Game Screen UI Unification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08
**Phase:** 36-game-screen-ui-unification
**Areas discussed:** Adoption matrix, Extraction sequencing, Lives & GameOver, Component API & naming

---

## Adoption matrix — Engagement layer reach

| Option                     | Description                                                                                                                    | Selected |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Fast-recall games only     | Engagement layer (lives/combo/on-fire/speed-bonus/tier-up) → ear-training + ArcadeRhythm; slow/staff games get base shell only | ✓        |
| Everywhere it's possible   | Every game with discrete right/wrong answers gets the full arcade layer                                                        |          |
| Base shell only this phase | Nobody new gets engagement; extract it but defer rollout to a follow-up phase                                                  |          |

**User's choice:** Fast-recall games only
**Notes:** Combo/lives feel right on fast quiz pacing, not on slow staff reading or a metronome tool.

## Adoption matrix — Base shell reach

| Option                        | Description                                                                                                            | Selected |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| All exercise-based games      | Full base shell (progress/score/nav/feedback) on every fixed-length-session game incl. Metronome (trail mode) + Memory | ✓        |
| All except Metronome & Memory | Exclude the two mechanically-different screens                                                                         |          |
| Per-game custom               | Specify game-by-game                                                                                                   |          |

**User's choice:** All exercise-based games
**Notes:** Maximum "looks like NotesRecognition" consistency. MixedLesson's divergent bar gets unified (locked REQ-04).

## Extraction sequencing

| Option                 | Description                                                                                                                                 | Selected |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Layer-by-layer         | W1 extract base shell + refactor NotesRecognition (zero-regression); W2 roll base shell; W3 engagement layer + Arcade de-dup + ear-training | ✓        |
| Component-by-component | Extract one component fully across all consumers before the next                                                                            |          |
| All-at-once then adopt | One big extraction + reference refactor, then adopt per-game                                                                                |          |

**User's choice:** Layer-by-layer
**Notes:** Smallest blast radius per step; base shell delivers most of the value early, proven on the gold standard first.

## Lives & GameOver — ear-training

| Option                  | Description                                                                                                           | Selected |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| Combo/on-fire, NO lives | Ear-training gains combo + on-fire but always finishes all questions → VictoryScreen; no life loss, no early GameOver | ✓        |
| Full lives + GameOver   | 3 lives, wrong answers cost a life, 0 → GameOverScreen like NotesRecognition                                          |          |
| You decide per game     | Judge per game during planning                                                                                        |          |

**User's choice:** Combo/on-fire, NO lives
**Notes:** Audio-discrimination drills are hard; ending a short session early on a miss is more punishing than motivating. Net result: no new GameOver paths this phase — only NotesRecognition + ArcadeRhythm keep lives→GameOver.

## Component API — animation/state ownership

| Option                              | Description                                                                                                 | Selected |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| Hybrid: value-in, anim encapsulated | Parent passes plain values; component runs its own transient animations and reads reduced-motion internally | ✓        |
| Pure presentational                 | Props-only incl. animation flags; parent orchestrates every animation                                       |          |
| Self-contained stateful             | Components own score/combo/lives state, expose imperative methods                                           |          |

**User's choice:** Hybrid: value-in, animation encapsulated
**Notes:** Cleanest reuse across different game state shapes; parents never manage animation timers.

## Component API — score pill semantics

| Option                     | Description                                                                                            | Selected |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| Configurable value + label | One ScorePill takes value + optional label/unit + optional combo-tint; each game passes what it tracks | ✓        |
| Always running XP          | Every game's pill shows session XP                                                                     |          |
| You decide                 | Pick per game during planning                                                                          |          |

**User's choice:** Configurable value + label
**Notes:** No game forced to compute per-question XP it doesn't already track; combo-tint only where the engagement layer is present.

## Component API — naming & placement

| Option                      | Description                                                                                 | Selected |
| --------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| hud/ subfolder, clean names | src/components/games/shared/hud/ with ProgressBar, ScorePill, LivesDisplay, ComboPill, etc. | ✓        |
| GameHud\* prefix, flat      | Flat in shared/ with verbose prefixes                                                       |          |
| You decide                  | Planner picks                                                                               |          |

**User's choice:** hud/ subfolder, clean names
**Notes:** Folder namespaces them (collision-safe by path), no prefix noise.

---

## Claude's Discretion

- Exact prop names/signatures within the hybrid contract (following existing component conventions).
- Whether `TimerDisplay` is extracted (single consumer) or left inline in NotesRecognitionGame.
- Whether on-fire ships as one component or `OnFireBadge` + `OnFireSplash` split.
- How finely Wave 2 is split into plans (per-game vs per-cluster).
- Per-game wiring of the configurable `ScorePill` label/value.

## Deferred Ideas

- Engagement layer on slow/staff games (SightReading, RhythmReading, RhythmDictation, MixedLesson, Memory) — excluded this phase.
- Lives→GameOver for ear-training — considered and rejected; revisit only if owner testing wants the stakes.
- Trail-mode new-note unlock banner as a shared component — stays NotesRecognition-specific for now.
