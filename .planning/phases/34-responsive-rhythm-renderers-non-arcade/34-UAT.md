# Phase 34 — Manual UAT Walkthrough

**Verified:** 2026-05-10 (pre-UAT scaffold; user fills in walkthrough results)
**Devices used:** iPhone SE (375×667) — DevTools emulator / real device; iPad (1024×768) — DevTools emulator / real device
**Methodology:** D-12 (manual UAT in dev), per RESEARCH § Validation Architecture

## Pre-UAT Gate

| Command                         | Status                                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:run`              | ✓ pass — 1676/1676 tests, 54.23s                                                                                                                                  |
| `npm run build`                 | ✓ pass — `built in 27.89s`                                                                                                                                        |
| `npm run lint` (Phase 34 scope) | ✓ pass — 0 errors, 53 pre-existing warnings; full-repo run blocked by stale worktree `dist/` assets at `.claude/worktrees/agent-a2e6e6b2/` (deferred — see below) |

## Success Criteria Walkthrough (ROADMAP Phase 34 SC #1-5)

### SC #1 — iPhone SE portrait: dictation shows staff + 3 cards in 2×2 grid (last card spans 2 columns) with no scroll

Devices: iPhone SE (375×667) physical OR Chrome DevTools at 375×667
Route: `/rhythm-mode/rhythm-dictation-game` (or trail entry to a Dictation node)

Steps:

1. Open the route on phone-portrait
2. Wait for first prompt to load
3. Visually confirm: 1 staff at top, 3 choice cards in a 2×2 grid below — first 2 cards in row 1, third card spans both columns in row 2 (`col-span-2`)
4. Confirm no vertical scroll required to see all 3 cards
5. Tap each card to confirm tappable (no hidden controls); the col-span-2 third card MUST be fully tappable across its width

| Field      | Value           |
| ---------- | --------------- |
| Result     | ☐ pass / ☐ fail |
| Notes      |                 |
| Screenshot | (optional path) |

### SC #2 — Phone-portrait: short patterns render inline; long patterns surface prompt

Devices: phone-portrait (iPhone SE)
Routes:

- Short pattern: `/rhythm-mode/rhythm-reading-game` 1-measure 4/4 exercise
- Long pattern: `/rhythm-mode/rhythm-reading-game` 4-measure 4/4 exercise

Steps:

1. Open short-pattern exercise → assert NO rotate prompt overlay
2. Open long-pattern exercise → assert rotate prompt overlay APPEARS
3. Repeat for `/rhythm-mode/rhythm-tap-game` and `/rhythm-mode/mixed-lesson` (latter contains a mix; flip between renderers and observe overlay correctly appearing/disappearing per renderer's content)

| Sub-test                                        | Result          | Notes |
| ----------------------------------------------- | --------------- | ----- |
| reading short → no prompt                       | ☐ pass / ☐ fail |       |
| reading long → prompt                           | ☐ pass / ☐ fail |       |
| tap short → no prompt                           | ☐ pass / ☐ fail |       |
| tap long → prompt                               | ☐ pass / ☐ fail |       |
| mixed-lesson swap (long→short) → prompt clears  | ☐ pass / ☐ fail |       |
| mixed-lesson swap (short→long) → prompt appears | ☐ pass / ☐ fail |       |

### SC #3 — Tablet (≥768): rotate prompt NEVER appears for any rhythm game

Devices: iPad (1024×768) physical OR DevTools at 768×1024 + 1024×768

Steps for each orientation (portrait + landscape):

1. Open every rhythm route: dictation, reading, tap (via reading), pulse (via mixed-lesson), syllable, visual-recognition, metronome, mixed-lesson, arcade (Phase 35 target — should still respect tablet≥768 even though arcade isn't migrated yet)
2. For routes that have long-pattern variants, deliberately load a long pattern
3. Assert: rotate overlay NEVER appears, in EITHER orientation

| Route                                | tablet-portrait | tablet-landscape |
| ------------------------------------ | --------------- | ---------------- |
| rhythm-dictation-game                | ☐ pass / ☐ fail | ☐ pass / ☐ fail  |
| rhythm-reading-game (short)          | ☐ pass / ☐ fail | ☐ pass / ☐ fail  |
| rhythm-reading-game (long)           | ☐ pass / ☐ fail | ☐ pass / ☐ fail  |
| rhythm-tap-game (long)               | ☐ pass / ☐ fail | ☐ pass / ☐ fail  |
| syllable-matching-game               | ☐ pass / ☐ fail | ☐ pass / ☐ fail  |
| visual-recognition-game              | ☐ pass / ☐ fail | ☐ pass / ☐ fail  |
| metronome-trainer                    | ☐ pass / ☐ fail | ☐ pass / ☐ fail  |
| mixed-lesson                         | ☐ pass / ☐ fail | ☐ pass / ☐ fail  |
| arcade-rhythm-game (Phase 35 target) | ☐ pass / ☐ fail | ☐ pass / ☐ fail  |

### SC #4 — Tablet-landscape: cards renderers fill width as real 2-col

Routes: rhythm-dictation, syllable-matching, visual-recognition

Steps:

1. iPad landscape (1024×768)
2. Open each route
3. Assert cards lay out as 2×2 grid spanning the FULL container width — NOT centered with side whitespace gutters

| Route              | Result          | Notes |
| ------------------ | --------------- | ----- |
| dictation          | ☐ pass / ☐ fail |       |
| syllable           | ☐ pass / ☐ fail |       |
| visual-recognition | ☐ pass / ☐ fail |       |

### SC #5 — Setup screens + 5 supporting overlays render & remain interactive at all 4 quadrants

Components (per D-09 + WRAPPER-02/03):

- RhythmGameSetup (entry to any rhythm game)
- RhythmGameSettings (Settings cog from any rhythm game; D-18 glass conversion check)
- CountdownOverlay (game start)
- BossIntroOverlay (boss entry — responsive sanity ONLY per D-11)
- FloatingFeedback (tap inputs)
- MetronomeDisplay (Metronome trainer)
- TapArea (tap-based games)

For each component × each quadrant:

| Component                       | phone-portrait | phone-landscape | tablet-portrait | tablet-landscape |
| ------------------------------- | -------------- | --------------- | --------------- | ---------------- |
| RhythmGameSetup                 | ☐ / ☐          | ☐ / ☐           | ☐ / ☐           | ☐ / ☐            |
| RhythmGameSettings (glass D-18) | ☐ / ☐          | ☐ / ☐           | ☐ / ☐           | ☐ / ☐            |
| CountdownOverlay                | ☐ / ☐          | ☐ / ☐           | ☐ / ☐           | ☐ / ☐            |
| BossIntroOverlay                | ☐ / ☐          | ☐ / ☐           | ☐ / ☐           | ☐ / ☐            |
| FloatingFeedback                | ☐ / ☐          | ☐ / ☐           | ☐ / ☐           | ☐ / ☐            |
| MetronomeDisplay                | ☐ / ☐          | ☐ / ☐           | ☐ / ☐           | ☐ / ☐            |
| TapArea                         | ☐ / ☐          | ☐ / ☐           | ☐ / ☐           | ☐ / ☐            |

(Cells: left ☐ = pass, right ☐ = fail)

## Regression Check — Notes-Master + Ear-Training Games

Per RESEARCH Pitfall 1: non-rhythm games MUST keep firing the rotate prompt on phone-portrait (no regression).

| Route                                     | phone-portrait expects prompt | Result          |
| ----------------------------------------- | ----------------------------- | --------------- |
| /notes-master-mode/notes-recognition-game | yes                           | ☐ pass / ☐ fail |
| /notes-master-mode/memory-game            | yes                           | ☐ pass / ☐ fail |
| /notes-master-mode/sight-reading-game     | yes                           | ☐ pass / ☐ fail |
| /notes-master-mode/note-speed-cards       | yes                           | ☐ pass / ☐ fail |
| /ear-training-mode/note-comparison-game   | yes                           | ☐ pass / ☐ fail |
| /ear-training-mode/interval-game          | yes                           | ☐ pass / ☐ fail |

## Deferred Items Discovered During UAT

(Issues observed but NOT in scope — log for future quick tasks)

- ESLint full-repo run blocked by stale worktree built assets at `.claude/worktrees/agent-a2e6e6b2/dist/`. Suggested fix: add `.claude/worktrees/` to ESLint ignore patterns. Phase 34 scope lint clean (0 errors).
- (add UAT-discovered items here as you walk)

## UAT Sign-Off

- [ ] All 5 ROADMAP Success Criteria pass
- [ ] All 13 components pass per-quadrant walkthrough
- [ ] Regression check: notes-master + ear-training games still show prompt on phone-portrait
- [ ] Pre-UAT gate (test:run, build, lint Phase 34 scope) all green
- [ ] Threshold of 9 beats validated against actual content (UAT confirmation per RESEARCH MEDIUM confidence)

Signed: ****\_\_\_\_**** on ****\_\_\_\_****
