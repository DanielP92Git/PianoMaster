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

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| CURR-01     | —     | Pending |
| CURR-02     | —     | Pending |
| CURR-03     | —     | Pending |
| CURR-04     | —     | Pending |
| CURR-05     | —     | Pending |
| PAT-01      | —     | Pending |
| PAT-02      | —     | Pending |
| PAT-03      | —     | Pending |
| PAT-04      | —     | Pending |
| PAT-05      | —     | Pending |
| PAT-06      | —     | Pending |
| UX-01       | —     | Pending |
| UX-02       | —     | Pending |
| UX-03       | —     | Pending |
| UX-04       | —     | Pending |
| UX-05       | —     | Pending |

**Coverage:**

- v3.2 requirements: 16 total
- Mapped to phases: 0
- Unmapped: 16 ⚠️

---

_Requirements defined: 2026-04-06_
_Last updated: 2026-04-06 after initial definition_
