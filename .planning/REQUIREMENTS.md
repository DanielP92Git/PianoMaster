# Requirements: PianoApp — v3.2 Rhythm Trail Rework

**Defined:** 2026-04-06
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v3.2 Requirements

Requirements for rhythm trail pedagogy rework. Each maps to roadmap phases.

### Curriculum

- [ ] **CURR-01**: Each rhythm node introduces at most one new musical concept (audit all 50 nodes, fix violations)
- [ ] **CURR-02**: Discovery nodes use notation-showing game (RhythmReadingGame or RhythmDictationGame), not MetronomeTrainer
- [ ] **CURR-03**: Practice nodes use echo game (MetronomeTrainer) for call-and-response reinforcement
- [ ] **CURR-04**: Speed/Boss nodes use ArcadeRhythmGame for engagement challenge
- [ ] **CURR-05**: Unit 1 Node 1 includes a pulse exercise ("tap with the beat", metronome only, no notation)

### Patterns

- [ ] **PAT-01**: Curated pattern library exists at `src/data/patterns/rhythmPatterns.js` with ~120+ hand-crafted patterns
- [ ] **PAT-02**: Each pattern is tagged by duration set (e.g. `quarter-only`, `quarter-half`, `quarter-eighth`)
- [ ] **PAT-03**: Node configs use `patternTags` (or `patternIds` for boss nodes) instead of `rhythmPatterns` duration allowlist
- [ ] **PAT-04**: `getPattern()` resolves curated patterns by tags/IDs via synchronous JS import (not async JSON fetch)
- [ ] **PAT-05**: Children only see patterns containing durations they have already learned (enforced by tag system)
- [ ] **PAT-06**: `validateTrail.mjs` checks pattern ID/tag existence, tag coverage, and complexity bounds at build time

### UX

- [ ] **UX-01**: Timing PERFECT threshold widened to 100ms for Discovery/Practice nodes (from 50ms)
- [ ] **UX-02**: MetronomeTrainer renamed to child-friendly name in UI (EN + HE i18n)
- [ ] **UX-03**: "MISS" feedback text replaced with "Almost!" throughout rhythm games (EN + HE)
- [ ] **UX-04**: Progressive measure length: Discovery 1-bar, Practice 2-bar, Speed/Boss 4-bar patterns
- [ ] **UX-05**: Rhythm syllables displayed below VexFlow note heads — EN: ta / ti-ti / ta-a / ta-a-a-a, HE: טָה / טָה-טָה / טָה-אָה / טָה-אָה-אָה-אָה (with Nikud)

### Mixed Lesson Engine

- [x] **MLE-01**: MixedLessonGame plays through a pre-authored sequence of interleaved question types in one session
- [x] **MLE-02**: Stateless renderers extracted from standalone games (VisualRecognitionRenderer, SyllableMatchingRenderer)
- [x] **MLE-03**: Standalone games refactored to thin wrappers around extracted renderers
- [x] **MLE-04**: MIXED_LESSON exercise type registered in constants, routes, TrailNodeModal, i18n, and validator
- [x] **MLE-05**: Progress bar shows current question / total with visual fill
- [x] **MLE-06**: ~300ms crossfade transition between question types
- [x] **MLE-07**: MixedLessonGame engine handles rhythm_tap, visual_recognition, syllable_matching, and pulse question types

## Future Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Curriculum Expansion

- **CURR-F01**: Kodaly duration reorder (quarter → eighth → half → whole → rests → dotted → sixteenth → compound)
- **CURR-F02**: Adaptive difficulty system (algorithm-based within sessions)
- **CURR-F03**: Adaptive tempo nudge (±5 BPM per consecutive correct/wrong)

### Polish

- **UX-F01**: focusDuration highlight for newly introduced note values
- **UX-F02**: Rest highlighting visual when cursor passes a rest position

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                      | Reason                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| Kodaly syllable overlay (English "ta/ti-ti") | Hebrew syllables with Nikud included; English Kodaly deferred              |
| 3/4 meter trail branch                       | Separate trail path; beyond rhythm rework scope                            |
| Triplet introduction                         | Advanced content; future milestone                                         |
| Student composition mode                     | New game type; not a rework item                                           |
| Euclidean procedural generation              | Future "Endless Practice" mode                                             |
| Node reordering across units                 | Risk to live user progress; defer until progress migration strategy exists |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Gap Closure | Status   |
| ----------- | ----- | ----------- | -------- |
| CURR-01     | 20    | 27          | Pending  |
| CURR-02     | 20    | 27          | Pending  |
| CURR-03     | 20    | 27          | Pending  |
| CURR-04     | 20    | 27          | Pending  |
| CURR-05     | 22    | —           | Complete |
| PAT-01      | 21    | 27          | Pending  |
| PAT-02      | 21    | 27          | Pending  |
| PAT-03      | 22    | 27          | Pending  |
| PAT-04      | 22    | 26          | Pending  |
| PAT-05      | 22    | 27          | Pending  |
| PAT-06      | 22    | 26, 27      | Pending  |
| UX-01       | 23    | 26          | Pending  |
| UX-02       | 23    | 26          | Pending  |
| UX-03       | 23    | 26          | Pending  |
| UX-04       | 23    | 26          | Pending  |
| UX-05       | 23    | 26          | Pending  |
| MLE-01      | 25    | —           | Complete |
| MLE-02      | 25    | —           | Complete |
| MLE-03      | 25    | —           | Complete |
| MLE-04      | 25    | —           | Complete |
| MLE-05      | 25    | —           | Complete |
| MLE-06      | 25    | —           | Complete |
| MLE-07      | 25    | —           | Complete |

**Coverage:**

- v3.2 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0
- Gap closure needed: 15 (Phase 26: 7, Phase 27: 10, overlap: 2)

---

_Requirements defined: 2026-04-06_
_Last updated: 2026-04-12 — gap closure phases 26-28 added after milestone audit_
