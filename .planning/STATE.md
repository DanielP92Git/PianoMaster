---
gsd_state_version: 1.0
milestone: v2.9
milestone_name: Game Variety & Ear Training
status: planning
stopped_at: Phase 7 context gathered
last_updated: "2026-03-27T13:57:02.076Z"
last_activity: 2026-03-26 — v2.9 roadmap created (5 phases, 38 requirements mapped)
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-26)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Milestone v2.9 — Game Variety & Ear Training

## Current Position

Phase: Phase 7 — Data Foundation + TrailMap Refactor (Not started)
Plan: —
Status: Roadmap created, ready to plan Phase 7
Last activity: 2026-03-26 — v2.9 roadmap created (5 phases, 38 requirements mapped)

```
v2.9 Progress: [__________] 0/5 phases
```

## Performance Metrics

**Velocity:**

- Total plans completed: ~179 (across all shipped milestones)
- 19 milestones shipped in 54 days (2026-01-31 to 2026-03-26)

## Accumulated Context

### Decisions

**v2.9 Architecture decisions (from research):**

- `usePianoSampler` hook fetches runtime WAVs from `public/sounds/piano-samples/` — no smplr dependency needed for piano notes
- Arcade rhythm game uses `requestAnimationFrame` + `ref.style.transform` (not framer-motion) for GPU compositor animation
- `audioContext.currentTime` (not `Date.now()`) is the mandatory tap capture clock for all timing games
- TrailMap must be refactored to data-driven `TRAIL_TAB_CONFIGS` array before any EAR_TRAINING nodes are authored
- Instrument Recognition deferred to next milestone (unresolved audio clip sourcing dependency)
- Rhythm node remapping DB migration must run before data file changes deploy — hard deploy constraint

**v2.8 decisions archived in `.planning/milestones/v2.8-ROADMAP.md`.**

### Roadmap Evolution

- v2.9 (Game Variety & Ear Training): 5 phases, 38 requirements, roadmap created 2026-03-26
  - Phase 7 (7): Data Foundation + TrailMap Refactor — INFRA-01 through INFRA-05
  - Phase 8 (8): Audio Infrastructure + Rhythm Games — INFRA-06, INFRA-07, INFRA-08, RTAP-01-05, RDICT-01-06
  - Phase 9 (9): Ear Training Games — PITCH-01-05, INTV-01-05
  - Phase 10 (10): Ear Training Trail Data + Trail Tab — EAR-01-05
  - Phase 11 (11): Arcade Rhythm + Rhythm Remapping — ARCR-01-05, RMAP-01-03

### Blockers/Concerns

**COPPA deadline:** April 22, 2026

**Research flags requiring attention before phases ship:**

- Phase 8: iOS physical device testing required (silent switch + AudioContext onstatechange not replicable in simulator)
- Phase 9: Audit `dailyGoalsService.js` for hardcoded category arrays before ear training games ship
- Phase 11: Explicit deploy sequencing plan required — confirm Netlify runs Supabase migration before serving updated JS

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260326-mrm | Add Install App button to settings install card for PWA install prompt | 2026-03-26 | 3ecd77c | [260326-mrm-add-install-app-button-to-settings-insta](./quick/260326-mrm-add-install-app-button-to-settings-insta/) |
| 260326-s6x | Fix sight-reading pattern generation for sharp practice nodes | 2026-03-26 | 7ab6fe0 | [260326-s6x-fix-sight-reading-pattern-generation-for](./quick/260326-s6x-fix-sight-reading-pattern-generation-for/) |
| 260326-td5 | Add keySignature 'A' to Unit 4 SIGHT_READING exercises (key sig pipeline for sharps) | 2026-03-26 | 1eb3814 | [260326-td5-fix-sight-reading-sharp-pattern-generati](./quick/260326-td5-fix-sight-reading-sharp-pattern-generati/) |
| 260326-wo7 | Add note staff image and mini keyboard to TrailNodeModal for Discovery nodes | 2026-03-26 | 4c8bf2d | [260326-wo7-add-note-staff-image-and-mini-keyboard-i](./quick/260326-wo7-add-note-staff-image-and-mini-keyboard-i/) |

### Additional Fixes (2026-03-26/27)

| Description | Date | Commit |
|-------------|------|--------|
| Revert keySignature 'A' approach — render sharps as accidentals next to notes (beginner-appropriate), fix note pools, enable bar-level accidental carry-through in VexFlowStaffDisplay | 2026-03-26 | 0b3e908 |
| Fix NotesRecognitionGame showing unlearned accidentals (G#/D#) in trail Discovery nodes — add trailNotePoolSet guard | 2026-03-26 | 0b3e908 |
| Hebrew note names on MiniKeyboard highlighted keys (פה♯ → ♯פה RTL order) | 2026-03-27 | fbe77a2 |

## Session Continuity

Last session: 2026-03-27T13:57:02.069Z
Stopped at: Phase 7 context gathered
Resume file: .planning/phases/07-data-foundation-trailmap-refactor/07-CONTEXT.md

**Next action:**

- Run `/gsd:plan-phase 7` to plan Phase 7: Data Foundation + TrailMap Refactor

---
*State initialized: 2026-01-31*
*Last updated: 2026-03-26 — v2.9 roadmap created, 38 requirements mapped across 5 phases*
