# Requirements: PianoApp v2.9

**Defined:** 2026-03-26
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v2.9 Requirements

Requirements for Game Variety & Ear Training milestone. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: New EXERCISE_TYPES constants added for all 5 new game types (RHYTHM_TAP, RHYTHM_DICTATION, ARCADE_RHYTHM, PITCH_COMPARISON, INTERVAL_ID)
- [x] **INFRA-02**: EAR_TRAINING added to NODE_CATEGORIES constant
- [x] **INFRA-03**: TrailNodeModal routes to correct game component for each new exercise type
- [x] **INFRA-04**: TrailMap refactored to data-driven tab system supporting 4+ tabs
- [x] **INFRA-05**: validateTrail.mjs validates all exercise type strings against known constants
- [ ] **INFRA-06**: usePianoSampler hook plays piano notes via runtime-fetched AudioBuffers from shared AudioContext
- [x] **INFRA-07**: Service worker cache version bumped for new audio assets
- [x] **INFRA-08**: i18n keys added for all new exercise types and game UI in EN and HE

### Rhythm Reading

- [ ] **RTAP-01**: User sees VexFlow notation and taps screen in time with the rhythm
- [ ] **RTAP-02**: Visual scrolling cursor advances through notation synced to tempo
- [ ] **RTAP-03**: Count-in plays before pattern starts (1-2 bars)
- [ ] **RTAP-04**: Each tap scored PERFECT/GOOD/MISS using audioContext.currentTime
- [x] **RTAP-05**: Session completes through VictoryScreen with star rating and XP

### Rhythm Dictation

- [ ] **RDICT-01**: User hears a rhythm pattern played audio-only
- [ ] **RDICT-02**: User can replay the rhythm before answering
- [ ] **RDICT-03**: User picks correct notation from 2-4 VexFlow multiple-choice cards
- [ ] **RDICT-04**: Wrong answer distractors differ by at least one audible duration element
- [ ] **RDICT-05**: Correct/wrong feedback with reveal animation and optional notation replay
- [x] **RDICT-06**: Session completes through VictoryScreen with star rating and XP

### Arcade Rhythm

- [ ] **ARCR-01**: Falling tiles descend synced to beat schedule using requestAnimationFrame
- [ ] **ARCR-02**: Hit zone at bottom with PERFECT/GOOD/MISS judgment display
- [ ] **ARCR-03**: 3-lives system (miss = lose life, 0 lives = GameOverScreen)
- [ ] **ARCR-04**: Combo counter and on-fire mode for consecutive hits
- [ ] **ARCR-05**: Session completes through VictoryScreen with star rating and XP

### Note Comparison

- [ ] **PITCH-01**: User hears two piano notes played sequentially via usePianoSampler
- [ ] **PITCH-02**: User taps HIGHER or LOWER to identify the second note's relation
- [x] **PITCH-03**: Interval distance narrows progressively through the session (wide to close)
- [ ] **PITCH-04**: Animated direction reveal after each answer
- [ ] **PITCH-05**: Session completes through VictoryScreen with star rating and XP

### Interval Identification

- [ ] **INTV-01**: User hears a melodic interval (two notes) played via usePianoSampler
- [x] **INTV-02**: User identifies as Step, Skip, or Leap (age-appropriate vocabulary)
- [x] **INTV-03**: Ascending intervals before descending in progression
- [x] **INTV-04**: Piano keyboard SVG reveals played notes after answer
- [ ] **INTV-05**: Session completes through VictoryScreen with star rating and XP

### Ear Training Trail

- [ ] **EAR-01**: 12-15 ear training nodes across 2 units with progressive difficulty
- [ ] **EAR-02**: Ear Training tab visible on TrailMap with distinct color palette
- [ ] **EAR-03**: Nodes use PITCH_COMPARISON and INTERVAL_ID exercise types
- [ ] **EAR-04**: Free tier ear training nodes defined in subscriptionConfig.js and synced with Postgres is_free_node()
- [ ] **EAR-05**: Boss node(s) combining ear training skills

### Rhythm Remapping

- [ ] **RMAP-01**: Existing 36 rhythm nodes remapped to mixed exercise types (~40% MetronomeTrainer, ~30% Rhythm Reading, ~20% Dictation, ~10% Arcade)
- [ ] **RMAP-02**: DB migration resets exercise_progress for remapped nodes before data changes deploy
- [ ] **RMAP-03**: All remapped nodes playable end-to-end through VictoryScreen

## Future Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Instrument Recognition

- **INST-01**: User hears an instrument audio clip and identifies the instrument from illustrated choices
- **INST-02**: Real sampled audio (not synthesis) for 4-6 instruments (piano, violin, trumpet, drum, flute, cello)
- **INST-03**: Instrument recognition trail nodes integrated into ear training path

### Dashboard

- **DASH-01**: Skill path progress card showing 2-3 weakest/suggested paths on dashboard

### Music Discovery

- **DISC-01**: Card-based composer/history/instrument learning with collector system
- **DISC-02**: Learn-then-prove cycle (3-4 discovery cards followed by quiz)
- **DISC-03**: Collector card rewards for completing lessons

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Microphone-based ear training (sing back intervals) | COPPA voice recording compliance adds significant complexity |
| Song-based gameplay with licensed music | Licensing complexity ($500-5000/song) |
| Latency calibration UI | Children cannot use calibration tools; pre-tune via useAudioEngine |
| Music Theory Master game type | Deferred to future milestone with Music Discovery |
| Classical compositions recognition | Deferred to future milestone with Music Discovery |
| Teacher view of ear training progress | Future milestone scope |
| Instrument Recognition game | Unresolved external dependency on audio clip sourcing; deferred to next milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 7 | Complete |
| INFRA-02 | Phase 7 | Complete |
| INFRA-03 | Phase 7 | Complete |
| INFRA-04 | Phase 7 | Complete |
| INFRA-05 | Phase 7 | Complete |
| INFRA-06 | Phase 8 | Pending |
| INFRA-07 | Phase 8 | Complete |
| INFRA-08 | Phase 8 | Complete |
| RTAP-01 | Phase 8 | Pending |
| RTAP-02 | Phase 8 | Pending |
| RTAP-03 | Phase 8 | Pending |
| RTAP-04 | Phase 8 | Pending |
| RTAP-05 | Phase 8 | Complete |
| RDICT-01 | Phase 8 | Pending |
| RDICT-02 | Phase 8 | Pending |
| RDICT-03 | Phase 8 | Pending |
| RDICT-04 | Phase 8 | Pending |
| RDICT-05 | Phase 8 | Pending |
| RDICT-06 | Phase 8 | Complete |
| ARCR-01 | Phase 11 | Pending |
| ARCR-02 | Phase 11 | Pending |
| ARCR-03 | Phase 11 | Pending |
| ARCR-04 | Phase 11 | Pending |
| ARCR-05 | Phase 11 | Pending |
| PITCH-01 | Phase 9 | Pending |
| PITCH-02 | Phase 9 | Pending |
| PITCH-03 | Phase 9 | Complete |
| PITCH-04 | Phase 9 | Pending |
| PITCH-05 | Phase 9 | Pending |
| INTV-01 | Phase 9 | Pending |
| INTV-02 | Phase 9 | Complete |
| INTV-03 | Phase 9 | Complete |
| INTV-04 | Phase 9 | Complete |
| INTV-05 | Phase 9 | Pending |
| EAR-01 | Phase 10 | Pending |
| EAR-02 | Phase 10 | Pending |
| EAR-03 | Phase 10 | Pending |
| EAR-04 | Phase 10 | Pending |
| EAR-05 | Phase 10 | Pending |
| RMAP-01 | Phase 11 | Pending |
| RMAP-02 | Phase 11 | Pending |
| RMAP-03 | Phase 11 | Pending |

**Coverage:**
- v2.9 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 — traceability updated after roadmap creation*
