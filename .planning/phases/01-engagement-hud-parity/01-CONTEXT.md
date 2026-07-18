# Phase 01: Engagement HUD Parity - Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Give sight-reading players **positive engagement feedback** on par with the sibling games,
by reusing the v6 (v3.6) shared HUD components (`src/components/games/shared/hud/`). Concretely:
a **live per-note combo counter** (`ComboPill`) and an **on-fire celebration** (`OnFireBadge` +
`OnFireSplash`) when the combo crosses the shared threshold. No new mechanics are invented — this
is parity, not new game design.

**Scope change from the roadmap (owner decision):** The **lives / game-over** half of the original
phase (HUD-02) is **dropped from this phase and deferred**. See D-01. Phase 01 now delivers
**HUD-01 (combo) + HUD-03 (on-fire) + I18N-01 (EN/HE parity)** only. HUD-02 is not implemented here.

**In scope:** session-wide combo state, live combo increment/reset, on-fire badge+splash, EN+HE
strings, wiring into the existing sight-reading session/feedback flow.

**Out of scope (this phase):** any lives indicator, any fail/game-over state, `GameOverScreen`
routing, replacing the existing encouragement screen, and all Phase 02/03 work (practice tooling,
adaptivity, persistence).

</domain>

<decisions>
## Implementation Decisions

### Lives / Game-Over — DROPPED & DEFERRED (the pivotal decision)

- **D-01:** **No lives system and no game-over screen in sight-reading for this phase.** Ship
  **positive reinforcement only** (combo + on-fire). Rationale, weighed across three lenses:
  - **Pedagogy:** Sight-reading is the highest-cognitive-load game in the app (real-time pitch +
    rhythm + motor output). Fail-states under high load raise anxiety, which degrades working
    memory and learning. Mastery framing ("you're on a streak") beats performance framing
    ("you died") for a hard skill at the edge of a child's competence. Many misses aren't fully in
    the child's control (mic latency, timing windows), so a lost life reads as _unfair_ → rage-quit.
  - **Entertainment:** Combo + on-fire already deliver the escalating-reward dopamine loop without
    loss-aversion downside. A `GameOverScreen` mid-session hard-stops a multi-exercise flow (momentum
    killer).
  - **Business:** Hearts/lives are fundamentally a _monetization_ mechanic (buy/refill hearts). This
    app monetizes via **subscription-gated content**, not an energy economy — there is nothing to
    sell against a depleted heart. Lives would carry the full pedagogical cost of punishment with
    zero business upside, plus a parent-trust risk ("my kid cried at GAME OVER").
- **D-02:** **HUD-02 is deferred, not permanently killed.** REQUIREMENTS.md must be amended to move
  HUD-02 to a deferred / "reconsider later" status with the D-01 rationale. If stakes are ever
  wanted later, the correct lever is _gentle streak/star pressure_, not hearts + game-over.
- **D-03:** **Keep the existing gentle "encouragement" screen** (shown at session end when
  `percentage < 0.7`). Do NOT add `GameOverScreen` to the sight-reading loss path.

### Combo behavior

- **D-04:** **Live, note-by-note.** Combo ticks up visibly as each correct note lands and resets the
  instant a wrong/missed note occurs (a miss = when its timing window closes). Chosen for maximum
  motivational "juice," which is the whole point of the phase. Accept the extra wiring cost:
  ref-mirrors for stale closures in the mic-detection callbacks (established pattern in
  `SightReadingGame.jsx` / `NotesRecognitionGame.jsx`), and window-close detection so a _silent_
  missed note breaks the combo live rather than only in the post-exercise sweep.
- **D-05:** **Combo is session-wide (spans exercises).** Combo accumulates across the whole
  multi-exercise session — a correct note anywhere keeps the streak alive; a miss resets it. Lift
  combo state into `SightReadingSessionContext` (not per-exercise local state). This makes on-fire
  reachable and rewards sustained focus. (Per-exercise reset was rejected: ~4–8 notes per exercise
  makes the on-fire threshold of 5 rarely hit and the streak feel too short.)

### On-fire + tuning + i18n

- **D-06:** **Reuse shared constants:** on-fire threshold = **5**, combo tiers at **3 / 8** (same as
  NotesRecognition). Only re-tune the threshold if session-wide scope makes 5 feel trivially easy in
  practice — planner's discretion, but default is reuse.
- **D-07:** **Reuse the shared `games.engagement` i18n keys** (`combo`, `onFire`, …) already present
  in EN + HE — maximum cross-game consistency, least new copy, free locale parity. Do NOT create a
  new `sightReading.engagement` block. Any genuinely sight-reading-specific string still ships EN+HE
  with RTL correctness (I18N-01).
- **D-08:** **Reduced-motion is handled inside the HUD components** (`OnFireBadge`/`OnFireSplash`/
  `ComboPill` self-consume `useMotionTokens().reduce` / `useAccessibility().reducedMotion`). Do NOT
  pass any reduced-motion prop from the game (the components' JSDoc forbids it). `OnFireSplash` must
  render at the **root of the game tree** (`fixed inset-0`), not inside a card/scroll container.

### Claude's Discretion

- On-fire threshold re-tuning (D-06) if 5 proves trivial under session-wide scope.
- Exact HUD placement on the sight-reading layout, and whether the combo/on-fire is echoed on the
  encouragement screen (not required).
- Whether to reuse NotesRecognition's on-fire sound trigger or stay silent — planner's call.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / phase docs

- `.planning/ROADMAP.md` §"Phase 01: Engagement HUD Parity" — goal + success criteria (NOTE: SC-2/
  HUD-02 lives criterion is superseded by D-01/D-02; update when amending).
- `.planning/REQUIREMENTS.md` — HUD-01/02/03, I18N-01. **Must be amended** to defer HUD-02 (D-02).
- `~/.claude/plans/analyze-the-entire-codebase-valiant-hejlsberg.md` (Phase D) — origin of this
  milestone's feature list.

### Reference implementation (the parity source)

- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — canonical combo/on-fire
  wiring: `comboRef`/`setCombo` increment-on-correct / reset-on-wrong; `ON_FIRE_THRESHOLD = 5`;
  `COMBO_TIERS` at 0/3/8; on-fire activation (fire sound + 1500ms splash); ref-mirror pattern for
  mic-callback stale closures.

### Shared HUD components (reuse, do not fork)

- `src/components/games/shared/hud/ComboPill.jsx` — `ComboPill({ combo, isOnFire })`, self-animates.
- `src/components/games/shared/hud/OnFireBadge.jsx` — `OnFireBadge({ active })`, dual-source reduced-motion.
- `src/components/games/shared/hud/OnFireSplash.jsx` — `OnFireSplash({ show })`, root-level `fixed inset-0`.

### Sight-reading integration surface

- `src/components/games/sight-reading-game/SightReadingGame.jsx` — result-push sites (correct notes
  and the late "missed" reconciliation sweep), input modes (mic + keyboard), current end-of-session
  flow (VictoryScreen vs inline encouragement).
- `src/contexts/SightReadingSessionContext.jsx` — session aggregation; **target for session-wide
  combo state** (D-05); `isVictory`/`percentage` (0.7 threshold) that drives the encouragement screen.

### i18n

- `src/locales/en/common.json` + `src/locales/he/common.json` — `games.engagement.*` (reuse, D-07)
  and `sightReading.*` namespaces.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`ComboPill` / `OnFireBadge` / `OnFireSplash`** (`shared/hud/`): drop-in; reduced-motion + animation
  self-contained. Props: `ComboPill({combo, isOnFire})`, `OnFireBadge({active})`, `OnFireSplash({show})`.
- **NotesRecognitionGame combo/on-fire block**: copy the state/ref pattern and constants verbatim
  (`ON_FIRE_THRESHOLD=5`, `COMBO_TIERS` 0/3/8).
- **`games.engagement` EN+HE strings**: already translated — reuse gives free I18N-01 parity for
  `combo` / `onFire`.

### Established Patterns

- **Ref-mirror for mic callbacks:** combo state read inside the mic pitch-detection rAF loop MUST be
  mirrored into a ref (`comboRef`) — the loop holds stale closures. Both game files already do this.
- **Per-note result push:** correctness is recorded per `noteIndex` into `performanceResults[]` at
  multiple sites during the PERFORMANCE phase; **misses are reconciled late** in a post-exercise sweep.
  Live combo (D-04) must therefore detect a note's timing-window close to break the streak on a silent
  miss, not just wait for the sweep.

### Integration Points

- **Combo state → `SightReadingSessionContext`** (session-wide scope, D-05).
- **Combo increment/reset** wired at the correct-note push sites and at window-close/miss detection.
- **`ComboPill` + `OnFireBadge`** render in the in-game HUD; **`OnFireSplash`** at the game-tree root.
- **No change** to the loss/end path — encouragement screen stays; no `GameOverScreen`.

</code_context>

<specifics>
## Specific Ideas

- Owner's framing, verbatim intent: sight-reading can be a stressful mission for kids, so favor
  **motivation over punishment** — stars already cover the "how did I do" signal, so the HUD should
  reward streaks, never penalize misses with a fail state.

</specifics>

<deferred>
## Deferred Ideas

- **HUD-02 (lives + game-over routing)** — deferred out of this phase per D-01/D-02. Reconsider only
  as _gentle_ streak/star pressure, never hearts + `GameOverScreen`. Requires a REQUIREMENTS.md
  amendment moving HUD-02 to deferred status. Not assigned to a specific future phase.

</deferred>

---

_Phase: 01-engagement-hud-parity_
_Context gathered: 2026-07-09_
