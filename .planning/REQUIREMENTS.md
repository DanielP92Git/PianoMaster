# Requirements: PianoApp — v3.3 Rhythm Trail Fix & Polish

**Defined:** 2026-04-13
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v3.3 Requirements

Requirements for rhythm trail bug fixes, gameplay tuning, and polish. Each maps to roadmap phases.

### Audio & Playback

- [ ] **AUDIO-01**: First play of quarter/eighth note presentations plays without audio trimming (audio context pre-warmed)
- [ ] **AUDIO-02**: Dictation game 'listen' button plays the pattern on first click (not only on 'replay')
- [ ] **AUDIO-03**: Eighths discovery presentation plays 4 pairs of beamed eighth notes in sequence

### Data & Curriculum

- [ ] **DATA-01**: Node 1_3 patterns contain only note values already introduced (no unlearned rests)
- [ ] **DATA-02**: Pulse game in quarter-only nodes generates only quarter-note patterns (no halves)
- [ ] **DATA-03**: Section titles accurately match the content and skills of their contained nodes
- [ ] **DATA-04**: Combined values practice nodes use all expected duration values in shuffled/random order

### Gameplay & UX

- [ ] **PLAY-01**: Half/whole notes in listen&tap and pulse require sustained long press matching note duration (piano-like feel)
- [ ] **PLAY-02**: Speed Challenge generates varied patterns with appropriate exercise count for kids
- [ ] **PLAY-03**: Boss nodes deliver a distinctly different, more challenging experience than regular nodes
- [ ] **PLAY-04**: Rhythm pattern nodes are differentiated from practice nodes (unique content or replaced)

### Code Quality

- [ ] **CODE-01**: handleRhythmTapComplete in MixedLessonGame reads current state (not stale closure)
- [ ] **CODE-02**: ArcadeRhythmGame scoredRef excludes rest tiles — score cannot exceed 100%
- [ ] **CODE-03**: MixedLessonGame safely handles empty generated array without crashing

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

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| AUDIO-01    | 30    | Pending |
| AUDIO-02    | 30    | Pending |
| AUDIO-03    | 30    | Pending |
| DATA-01     | 29    | Pending |
| DATA-02     | 29    | Pending |
| DATA-03     | 29    | Pending |
| DATA-04     | 29    | Pending |
| PLAY-01     | 31    | Pending |
| PLAY-02     | 32    | Pending |
| PLAY-03     | 32    | Pending |
| PLAY-04     | 32    | Pending |
| CODE-01     | 29    | Pending |
| CODE-02     | 29    | Pending |
| CODE-03     | 29    | Pending |

**Coverage:**

- v3.3 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---

_Requirements defined: 2026-04-13_
_Last updated: 2026-04-13 — traceability filled after roadmap creation_
