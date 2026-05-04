# Requirements: PianoApp — v3.3 Rhythm Trail Fix & Polish

**Defined:** 2026-04-13
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v3.3 Requirements

Requirements for rhythm trail bug fixes, gameplay tuning, and polish. Each maps to roadmap phases.

### Audio & Playback

- [x] **AUDIO-01**: First play of quarter/eighth note presentations plays without audio trimming (audio context pre-warmed) _[verified at Phase 33 retest — Issue 1 marked resolved-by-deploy in 33-UAT.md]_
- [x] **AUDIO-02**: Dictation game 'listen' button plays the pattern on first click (not only on 'replay')
- [x] **AUDIO-03**: Eighths discovery presentation plays 4 pairs of beamed eighth notes in sequence _[verified at Phase 33 retest — Issue 4 marked resolved-by-deploy in 33-UAT.md]_

### Data & Curriculum

- [x] **DATA-01**: Node 1_3 patterns contain only note values already introduced (no unlearned rests)
- [ ] **DATA-02**: Pulse game in quarter-only nodes generates only quarter-note patterns (no halves) _[deferred to next milestone — vacuously satisfied via patternNeedsRests filter, but PulseQuestion uses hardcoded PULSE_BEATS and never calls resolveByTags so the filter is structurally untested for the pulse path]_
- [x] **DATA-03**: Section titles accurately match the content and skills of their contained nodes
- [x] **DATA-04**: Combined values practice nodes use all expected duration values in shuffled/random order

### Gameplay & UX

- [x] **PLAY-01**: Half/whole notes in listen&tap require sustained long press matching note duration (piano-like feel) _[narrowed at v3.3 milestone close 2026-05-04 — original text included pulse, but no trail node delivers long-duration beats to PulseQuestion; pulse hold infrastructure is in place for future curriculum nodes that need it. Listen&tap path verified end-to-end via RhythmTapQuestion → holdScoringUtils → HoldRing → scoreHold]_
- [x] **PLAY-02**: Speed Challenge generates varied patterns with appropriate exercise count for kids
- [x] **PLAY-03**: Boss nodes deliver a distinctly different, more challenging experience than regular nodes
- [x] **PLAY-04**: Rhythm pattern nodes are differentiated from practice nodes (unique content or replaced) _[Phase 32-02 D-11 removed all 6 Mix-Up nodes; rhythm_\*_5 IDs absent from unit data and FREE_RHYTHM_NODE_IDS — structural resolution]_

### Code Quality

- [x] **CODE-01**: handleRhythmTapComplete in MixedLessonGame reads current state (not stale closure)
- [x] **CODE-02**: ArcadeRhythmGame scoredRef excludes rest tiles — score cannot exceed 100%
- [x] **CODE-03**: MixedLessonGame safely handles empty generated array without crashing

## Future Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Gameplay Expansion

- **PLAY-F01**: Adaptive difficulty system (algorithm-based within sessions)
- **PLAY-F02**: Adaptive tempo nudge (+-5 BPM per consecutive correct/wrong)
- **PLAY-F03**: focusDuration highlight for newly introduced note values

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                      | Reason                                               |
| ---------------------------- | ---------------------------------------------------- |
| New rhythm game types        | This milestone is fix/tune, not new features         |
| Node reordering across units | Risk to live user progress; needs migration strategy |
| 3/4 meter or triplets        | Advanced content for future milestone                |
| Celebration sound effects    | Requires classroom A/B testing                       |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase                                                   | Status   |
| ----------- | ------------------------------------------------------- | -------- |
| AUDIO-01    | 30, 33 (verified at Phase 33 retest)                    | Complete |
| AUDIO-02    | 30, 33                                                  | Complete |
| AUDIO-03    | 30, 33 (verified at Phase 33 retest)                    | Complete |
| DATA-01     | 29, 33                                                  | Complete |
| DATA-02     | 29, 33 (cannot-reproduce — re-triage in next milestone) | Deferred |
| DATA-03     | 29, 33                                                  | Complete |
| DATA-04     | 29, 33                                                  | Complete |
| PLAY-01     | 31 (narrowed to listen&tap-only)                        | Complete |
| PLAY-02     | 32, 33                                                  | Complete |
| PLAY-03     | 32, 33                                                  | Complete |
| PLAY-04     | 32                                                      | Complete |
| CODE-01     | 29                                                      | Complete |
| CODE-02     | 29                                                      | Complete |
| CODE-03     | 29                                                      | Complete |

**Coverage:**

- v3.3 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---

_Requirements defined: 2026-04-13_
_Last updated: 2026-05-04 — milestone audit close-out: PLAY-01 narrowed to listen&tap-only, PLAY-04/CODE-01/CODE-02/CODE-03 checkboxes ticked from VERIFICATION.md evidence, DATA-02 deferred_
