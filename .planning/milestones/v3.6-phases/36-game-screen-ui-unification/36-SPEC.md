# Phase 36: Game Screen UI Unification — Specification

**Created:** 2026-06-06
**Status:** Draft seed (from UI audit) — to be refined by `/gsd-discuss-phase 36`
**Milestone:** v3.6 Game Screen UI Unification
**Requirements:** 7 (seeded — confirm/adjust in discuss-phase)

## Goal

Bring the other game screens up to the polished UI standard set by **NotesRecognitionGame** by
**extracting its inline HUD/shell into reusable shared components** (under
`src/components/games/shared/`) and **adopting them across the other games where they fit** —
without forcing an identical shell onto games whose mechanics are fundamentally different
(staff-based, tile/card-based, simple fixed-length ear-training sessions).

The unifying principle, validated by the audit: **component-based reuse, not game-based
uniformity.** NotesRecognition is the gold standard; other games adopt the subset of HUD pieces
that suit their interaction model.

## Background

A read-only audit (2026-06-06) compared NotesRecognitionGame's UI against every other game.

**NotesRecognitionGame** (`src/components/games/notes-master-games/NotesRecognitionGame.jsx`) is
the richest game screen, but nearly all of its HUD is **inline JSX, not reusable components**:

- Progress bar (X of N, with checkpoints) · back/exit nav · score pill (XP, combo-tinted)
- Lives (3 hearts, animated removal) · combo pill (⚡, shake/scale) · on-fire mode (badge + flame splash)
- Speed-bonus flash · tier-up popup (2x/3x flies to score) · new-note unlock banner (trail mode)
- Timer (timed mode) · rich answer feedback (red/green fill, shake/pop)
- Already-shared pieces it reuses: `VictoryScreen`, `GameOverScreen`, `UnifiedGameSettings`, `AudioInterruptedOverlay`

**Gap matrix (other games vs the shell):**

| Game                | Progress bar  | Score pill | Lives   | Combo   | On-fire | GameOver | Notes                                                  |
| ------------------- | ------------- | ---------- | ------- | ------- | ------- | -------- | ------------------------------------------------------ |
| ArcadeRhythmGame    | —             | own        | **own** | **own** | **own** | own      | Already has inline lives/combo/on-fire → de-dup target |
| MemoryGame          | lacks         | lacks      | lacks   | lacks   | lacks   | has      | Grid mechanics; light adoption                         |
| MetronomeTrainer    | lacks         | lacks      | lacks   | lacks   | lacks   | lacks    | Audio/metronome layout                                 |
| RhythmDictationGame | lacks         | per-Q      | lacks   | lacks   | lacks   | lacks    | VexFlow choice cards                                   |
| RhythmReadingGame   | pattern       | lacks      | lacks   | lacks   | lacks   | lacks    | Staff-driven                                           |
| MixedLessonGame     | **own style** | per-Q      | lacks   | lacks   | lacks   | lacks    | Has a divergent progress bar → unify style             |
| SightReadingGame    | staff pos     | inline     | lacks   | lacks   | lacks   | lacks    | Staff position = progress                              |
| NoteComparisonGame  | lacks         | counter    | lacks   | lacks   | lacks   | lacks    | Ear-training, 10-Q fixed                               |
| IntervalGame        | lacks         | counter    | lacks   | lacks   | lacks   | lacks    | Ear-training, 10-Q fixed                               |

**Clean extraction candidates** → `src/components/games/shared/`: `ProgressBar`, `ScorePill`,
`LivesDisplay`, `ComboPill`, `OnFireBadge`/`OnFireSplash`, `TimerDisplay`, `SpeedBonusFlash`,
`TierUpPopup`. **Game-type-specific (leave alone):** staff rendering, tile/card grids, mic
listen button, accidentals picker, settings modal (already shared).

## Requirements (seeded — confirm in discuss-phase)

1. **Extract the HUD into shared components.** NotesRecognitionGame's inline HUD elements are
   factored into reusable components under `src/components/games/shared/`, and
   NotesRecognitionGame is refactored to consume them with **zero visual/behavioral regression**.

2. **Per-game adoption matrix.** Each other game adopts the subset of HUD components that fit its
   mechanics, per an explicit matrix decided in discuss-phase. Mechanically-incompatible pieces
   (e.g. lives/combo on sight-reading or ear-training) are intentionally excluded with rationale.

3. **De-duplicate ArcadeRhythmGame.** Its existing inline lives + combo + on-fire are replaced by
   the shared components (single source of truth), preserving current behavior + landscape lock.

4. **Visual consistency.** All adopted HUD elements follow the project design system
   (glassmorphism on purple gradient — `docs/DESIGN_SYSTEM.md`). MixedLessonGame's divergent
   progress-bar style is unified with the shared `ProgressBar`.

5. **Consistent end-of-game coverage.** Games that gain a lives/score model also wire the shared
   `GameOverScreen`/`VictoryScreen` consistently; games where game-over does not apply are
   documented (not forced).

6. **No regressions.** All existing game tests pass; landscape-locked rhythm games still render;
   reduced-motion is respected for all HUD animations; Hebrew/RTL parity holds.

7. **i18n parity.** Any new user-facing strings introduced by shared components are keyed in both
   `src/locales/en` and `src/locales/he`.

## Boundaries

**In scope:**

- Extract NotesRecognition HUD → shared components in `src/components/games/shared/`
- Refactor NotesRecognitionGame to consume the extracted components (no regression)
- Adopt shared HUD in other games per the agreed adoption matrix
- De-duplicate ArcadeRhythmGame's inline lives/combo/on-fire
- Unify MixedLessonGame's progress-bar style with the shared component
- Visual/design-system consistency pass on adopted HUD elements

**Out of scope (confirm in discuss):**

- Game mechanics / scoring logic changes (HUD presentation only)
- VexFlow notation rendering internals; tile/card grid layouts; piano-keyboard reveals
- The mic "listen" button and accidentals picker (game-specific — not part of this unification)
- `UnifiedGameSettings` (already shared) and VictoryScreen/GameOverScreen internals (wiring only)
- New gameplay features, new game modes, or new engagement mechanics
- Non-game screens (dashboard, trail map, settings pages)

## Constraints

- **No visual regression on NotesRecognitionGame** — it is the reference; extraction must be
  behavior-preserving (verifiable by before/after walkthrough + existing tests).
- **All game tests pass:** `npm run test:run` green for all game components touched.
- **Reduced-motion respected:** every HUD animation honors `AccessibilityContext` reduced-motion.
- **RTL/Hebrew parity:** HUD layout renders correctly in RTL; new strings have `he` translations.
- **Landscape-locked games unaffected:** ArcadeRhythmGame + responsive rhythm renderers keep
  their landscape behavior after adopting shared components.

## Acceptance Criteria (seeded)

- [ ] Shared HUD components exist under `src/components/games/shared/` and are consumed by NotesRecognitionGame with no visual/behavioral regression
- [ ] Each game in the adoption matrix consumes its agreed subset of shared HUD components
- [ ] ArcadeRhythmGame uses the shared lives/combo/on-fire components (no duplicate inline implementations remain)
- [ ] MixedLessonGame uses the shared `ProgressBar`
- [ ] `npm run test:run` passes for all touched game components
- [ ] Reduced-motion path verified for HUD animations
- [ ] `src/locales/he` has translations for any new HUD strings
- [ ] Owner walkthrough: every restructured game screen looks consistent and behaves correctly (portrait + landscape where applicable)

## Open Decisions for `/gsd-discuss-phase 36`

1. **Adoption matrix** — exactly which games get which HUD pieces (the audit proposes a default;
   owner confirms, e.g. should rhythm games show a score pill? should ear-training stay minimal?).
2. **Extraction depth** — extract the full candidate set now, or phase it (HUD core first:
   ProgressBar/ScorePill/Lives/Combo; engagement effects later: OnFire/SpeedBonus/TierUp)?
3. **GameOver coverage** — which currently-GameOver-less games _should_ gain a game-over path
   (e.g. rhythm games if they adopt lives) vs. stay score-only?
4. **Naming/API** — component names and prop contracts for the shared HUD set.
5. **Sequencing vs v3.5** — v3.5 owner UAT is still pending; confirm this ships after or in
   parallel.

---

_Phase: 36-game-screen-ui-unification_
_Spec seeded: 2026-06-06 from read-only UI audit_
_Next step: `/gsd-discuss-phase 36` — lock the adoption matrix, extraction depth, and component API_
