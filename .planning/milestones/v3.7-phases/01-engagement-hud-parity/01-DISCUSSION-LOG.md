# Phase 01: Engagement HUD Parity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-09
**Phase:** 01-engagement-hud-parity
**Areas discussed:** Life-loss economy, Combo-break timing, Game-over vs encouragement, Tuning & i18n keys

---

## Life-loss economy → pivoted to "should lives exist at all?"

Initial question: what should cost a life (per failed exercise / session miss-budget / per wrong-missed note).

| Option                | Description                                                | Selected |
| --------------------- | ---------------------------------------------------------- | -------- |
| Per failed exercise   | Life lost when a whole exercise scores <70%                |          |
| Session miss-budget   | Hearts = pool of allowed wrong/missed notes across session |          |
| Per wrong/missed note | Mirror NotesRecognition (3 lives, 1 per wrong/missed note) |          |

**User's choice:** None of the above — challenged the premise. "Actually I'm not sure a life-based approach is a good one here? Sight reading might be a stressful mission for kids; the stars-based approach is enough meanwhile — concentrating on motivation rather than punishment."

**Notes:** Reframed as an owner scope decision touching HUD-02 (a locked v1 requirement). User then asked Claude to weigh the pedagogical + entertainment + business tradeoffs.

**Decision follow-up:**

| Option                              | Description                                                                                                | Selected |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| Yes — positive-only, defer HUD-02   | Ship combo + on-fire only; keep encouragement screen; amend REQUIREMENTS.md to defer HUD-02 with rationale | ✓        |
| Positive-only, drop HUD-02 entirely | Permanently remove lives from milestone                                                                    |          |
| Keep gentle lives after all         | Retain HUD-02 as soft per-failed-exercise screen                                                           |          |

**User's choice:** Yes — positive-only, defer HUD-02. Claude recommended this across three lenses (pedagogy: fail-states raise anxiety under high cognitive load; entertainment: combo/on-fire already give the reward loop, game-over kills multi-exercise momentum; business: hearts are a monetization mechanic with no upside under subscription-gated content). → CONTEXT D-01/D-02/D-03.

---

## Combo-break timing

| Option                            | Description                                                                             | Selected |
| --------------------------------- | --------------------------------------------------------------------------------------- | -------- |
| Live, note-by-note                | Combo ticks up per correct note, resets instantly on wrong/missed (miss = window close) | ✓        |
| Live for hits, misses at boundary | Live on correct + wrong-pitch, silent misses reconcile at exercise end                  |          |
| You decide (recommend live)       | Claude picks feel/effort balance                                                        |          |

**User's choice:** Live, note-by-note. → CONTEXT D-04.
**Notes:** Accepts the extra wiring cost (ref-mirrors for stale mic-callback closures + timing-window-close detection so a silent miss breaks the streak live).

---

## Game-over vs encouragement

**Resolved implicitly by the positive-only decision** — no `GameOverScreen` is added; the existing gentle encouragement screen (shown at session end when `percentage < 0.7`) is retained. → CONTEXT D-03.

---

## Tuning & i18n keys

**Q1 — Combo scope:**

| Option                         | Description                                                                      | Selected |
| ------------------------------ | -------------------------------------------------------------------------------- | -------- |
| Session-wide (spans exercises) | Combo accumulates across the whole session; lift into SightReadingSessionContext | ✓        |
| Per-exercise (resets each)     | Combo restarts each exercise; would need lower on-fire threshold                 |          |

**User's choice:** Session-wide. → CONTEXT D-05.

**Q2 — Reuse vs sight-reading-specific:**

| Option                     | Description                                                            | Selected |
| -------------------------- | ---------------------------------------------------------------------- | -------- |
| Reuse shared (recommended) | Reuse threshold=5, tiers 3/8, and shared `games.engagement` EN+HE keys | ✓        |
| Sight-reading-specific     | New constants + `sightReading.engagement` key block                    |          |

**User's choice:** Reuse shared. → CONTEXT D-06/D-07.

---

## Claude's Discretion

- Re-tune on-fire threshold (default 5) only if session-wide scope makes it trivially easy (D-06).
- Exact HUD placement on the sight-reading layout; whether combo/on-fire echoes on the encouragement screen.
- Whether to reuse NotesRecognition's on-fire sound trigger or stay silent.

## Deferred Ideas

- **HUD-02 (lives + game-over routing)** — deferred out of v3.7 (not assigned to a future phase). Reconsider only as gentle streak/star pressure, never hearts + `GameOverScreen`. REQUIREMENTS.md, ROADMAP.md Phase 01 success criteria, and traceability table amended accordingly on 2026-07-09.
