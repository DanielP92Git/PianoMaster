# Requirements: PianoApp v1.3 Trail System Redesign

**Defined:** 2026-02-03
**Core Value:** Professional game-like learning progression for 8-year-olds with consistent pedagogy across all paths

## v1.3 Requirements

Requirements for trail system redesign. Each maps to roadmap phases.

### Data Layer Cleanup

- [ ] **DATA-01**: Remove LEGACY_NODES array from skillTrail.js (eliminate duplicates)
- [ ] **DATA-02**: Remove nodeGenerator.js dependency for bass/rhythm main paths
- [ ] **DATA-03**: Create build-time validation script for trail nodes (prerequisite chains, node type validity)
- [ ] **DATA-04**: Single expandedNodes.js import combining all unit files

### Bass Clef Unit 1: First Steps (C4, B3, A3)

- [ ] **BASS1-01**: Discovery node for C4 (Middle C in bass clef)
- [ ] **BASS1-02**: Discovery node for B3 (introduce second note)
- [ ] **BASS1-03**: Practice node for C4-B3 (sight reading)
- [ ] **BASS1-04**: Mix-Up node (memory game with C4-B3)
- [ ] **BASS1-05**: Discovery node for A3 (third note)
- [ ] **BASS1-06**: Practice node for C4-B3-A3 (three note songs)
- [ ] **BASS1-07**: Speed Round node (timed note recognition)
- [ ] **BASS1-08**: Mini-Boss node (unit completion challenge)

### Bass Clef Unit 2: Five Finger Low (G3, F3)

- [ ] **BASS2-01**: Review node for Unit 1 (spaced repetition)
- [ ] **BASS2-02**: Discovery node for G3 (fourth note)
- [ ] **BASS2-03**: Practice node for C4-A3-G3 range
- [ ] **BASS2-04**: Discovery node for F3 (five-finger complete)
- [ ] **BASS2-05**: Mix-Up node (memory game with all 5 notes)
- [ ] **BASS2-06**: Practice node for five-finger bass songs
- [ ] **BASS2-07**: Challenge node (interleaving Units 1+2)
- [ ] **BASS2-08**: Mini-Boss node (five-finger mastery)

### Bass Clef Unit 3: Full Octave (E3, D3, C3)

- [ ] **BASS3-01**: Review node for Unit 2 (spaced repetition)
- [ ] **BASS3-02**: Discovery node for E3
- [ ] **BASS3-03**: Practice node for F3-E3 range
- [ ] **BASS3-04**: Discovery node for D3
- [ ] **BASS3-05**: Practice node for E3-D3 range
- [ ] **BASS3-06**: Discovery node for C3 (octave complete!)
- [ ] **BASS3-07**: Practice node for full octave songs
- [ ] **BASS3-08**: Mix-Up node (memory game with all 8 notes)
- [ ] **BASS3-09**: Speed Round node (timed full octave)
- [ ] **BASS3-10**: Boss node (bass octave mastery, unlocks next section)

### Rhythm Unit 1: Basic Beats (Whole, Half, Quarter)

- [ ] **RHY1-01**: Discovery node for Quarter notes (steady beat)
- [ ] **RHY1-02**: Practice node for Quarter notes
- [ ] **RHY1-03**: Discovery node for Half notes (2 beats)
- [ ] **RHY1-04**: Practice node for Quarter + Half
- [ ] **RHY1-05**: Discovery node for Whole notes (4 beats)
- [ ] **RHY1-06**: Practice node for all three durations
- [ ] **RHY1-07**: Speed Round node (rhythm recognition)
- [ ] **RHY1-08**: Mini-Boss node (basic rhythm mastery)

### Rhythm Unit 2: Dotted Half Notes

- [ ] **RHY2-01**: Review node for Unit 1
- [ ] **RHY2-02**: Discovery node for Dotted Half (3 beats concept)
- [ ] **RHY2-03**: Practice node for Dotted Half patterns
- [ ] **RHY2-04**: Mix-Up node (rhythm memory game)
- [ ] **RHY2-05**: Practice node combining all learned rhythms
- [ ] **RHY2-06**: Mini-Boss node (dotted half mastery)

### Rhythm Unit 3: Eighth Notes

- [ ] **RHY3-01**: Review node for Unit 2
- [ ] **RHY3-02**: Discovery node for Eighth notes (half-beat)
- [ ] **RHY3-03**: Practice node for Eighth note pairs
- [ ] **RHY3-04**: Practice node for Eighth + Quarter combinations
- [ ] **RHY3-05**: Mix-Up node (rhythm variety game)
- [ ] **RHY3-06**: Speed Round node (eighth note patterns)
- [ ] **RHY3-07**: Mini-Boss node (eighth note mastery)

### Rhythm Unit 4: Dotted Quarter Notes

- [ ] **RHY4-01**: Review node for Unit 3
- [ ] **RHY4-02**: Discovery node for Dotted Quarter (1.5 beats)
- [ ] **RHY4-03**: Practice node for Dotted Quarter + Eighth patterns
- [ ] **RHY4-04**: Practice node combining all rhythms
- [ ] **RHY4-05**: Challenge node (syncopation introduction)
- [ ] **RHY4-06**: Mini-Boss node (dotted quarter mastery)

### Rhythm Unit 5: Sixteenth Notes

- [ ] **RHY5-01**: Review node for Unit 4
- [ ] **RHY5-02**: Discovery node for Sixteenth notes (quarter-beat)
- [ ] **RHY5-03**: Practice node for Sixteenth note groups
- [ ] **RHY5-04**: Practice node for Sixteenth + Eighth combinations
- [ ] **RHY5-05**: Mix-Up node (advanced rhythm game)
- [ ] **RHY5-06**: Speed Round node (fast rhythm patterns)
- [ ] **RHY5-07**: Challenge node (all rhythms combined)
- [ ] **RHY5-08**: Boss node (rhythm master, unlocks advanced content)

### Integration & Validation

- [ ] **INT-01**: Atomic cutover in expandedNodes.js (all new files at once)
- [ ] **INT-02**: Preserve existing node IDs for bass/rhythm Units 1-2 (user progress)
- [ ] **INT-03**: XP economy audit (maintain parity with old trail)
- [ ] **INT-04**: Database trigger compatibility verification
- [ ] **INT-05**: Test with production data snapshot (progress preservation)

## Future Requirements (v1.4+)

Deferred to future release. Tracked but not in current roadmap.

### UI Enhancements

- **UI-01**: VictoryScreen node-type-specific celebrations
- **UI-02**: Unlock Event Modal after Boss completion
- **UI-03**: Node type icons and colors in TrailNode.jsx
- **UI-04**: "What's New" badges in TrailNodeModal.jsx
- **UI-05**: Three-column trail map layout for parallel paths

### Extended Content

- **EXT-01**: Bass Unit 4+ (ledger lines, extended range)
- **EXT-02**: Treble Unit 4+ (eighth notes, extended range)
- **EXT-03**: REVIEW node type for automated spaced repetition
- **EXT-04**: Song/Applied Practice nodes with real music excerpts

### Production

- **PROD-01**: Hard delete Edge Function for accounts past 30-day grace period
- **PROD-02**: Production deployment to Google Play / Apple App Store
- **PROD-03**: Beta testing with human verification checklist

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Trail map UI redesign | Focus on data layer first; UI works with any node structure |
| Grand Staff integration | Complex cross-clef learning; defer to future |
| Adaptive difficulty system | Requires algorithm research; start with fixed difficulty |
| Real song integration | Licensing complexity; use generated patterns for now |
| Path branching logic | Current linear progression works; complexity not justified |
| REVIEW node automation | Manual review nodes for now; spaced repetition algorithm later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 8 | Pending |
| DATA-02 | Phase 12 | Pending |
| DATA-03 | Phase 8 | Complete |
| DATA-04 | Phase 11 | Complete |
| BASS1-01 | Phase 9 | Pending |
| BASS1-02 | Phase 9 | Pending |
| BASS1-03 | Phase 9 | Pending |
| BASS1-04 | Phase 9 | Pending |
| BASS1-05 | Phase 9 | Pending |
| BASS1-06 | Phase 9 | Pending |
| BASS1-07 | Phase 9 | Pending |
| BASS1-08 | Phase 9 | Pending |
| BASS2-01 | Phase 9 | Pending |
| BASS2-02 | Phase 9 | Pending |
| BASS2-03 | Phase 9 | Pending |
| BASS2-04 | Phase 9 | Pending |
| BASS2-05 | Phase 9 | Pending |
| BASS2-06 | Phase 9 | Pending |
| BASS2-07 | Phase 9 | Pending |
| BASS2-08 | Phase 9 | Pending |
| BASS3-01 | Phase 9 | Pending |
| BASS3-02 | Phase 9 | Pending |
| BASS3-03 | Phase 9 | Pending |
| BASS3-04 | Phase 9 | Pending |
| BASS3-05 | Phase 9 | Pending |
| BASS3-06 | Phase 9 | Pending |
| BASS3-07 | Phase 9 | Pending |
| BASS3-08 | Phase 9 | Pending |
| BASS3-09 | Phase 9 | Pending |
| BASS3-10 | Phase 9 | Pending |
| RHY1-01 | Phase 10 | Pending |
| RHY1-02 | Phase 10 | Pending |
| RHY1-03 | Phase 10 | Pending |
| RHY1-04 | Phase 10 | Pending |
| RHY1-05 | Phase 10 | Pending |
| RHY1-06 | Phase 10 | Pending |
| RHY1-07 | Phase 10 | Pending |
| RHY1-08 | Phase 10 | Pending |
| RHY2-01 | Phase 10 | Pending |
| RHY2-02 | Phase 10 | Pending |
| RHY2-03 | Phase 10 | Pending |
| RHY2-04 | Phase 10 | Pending |
| RHY2-05 | Phase 10 | Pending |
| RHY2-06 | Phase 10 | Pending |
| RHY3-01 | Phase 10 | Pending |
| RHY3-02 | Phase 10 | Pending |
| RHY3-03 | Phase 10 | Pending |
| RHY3-04 | Phase 10 | Pending |
| RHY3-05 | Phase 10 | Pending |
| RHY3-06 | Phase 10 | Pending |
| RHY3-07 | Phase 10 | Pending |
| RHY4-01 | Phase 10 | Pending |
| RHY4-02 | Phase 10 | Pending |
| RHY4-03 | Phase 10 | Pending |
| RHY4-04 | Phase 10 | Pending |
| RHY4-05 | Phase 10 | Pending |
| RHY4-06 | Phase 10 | Pending |
| RHY5-01 | Phase 10 | Pending |
| RHY5-02 | Phase 10 | Pending |
| RHY5-03 | Phase 10 | Pending |
| RHY5-04 | Phase 10 | Pending |
| RHY5-05 | Phase 10 | Pending |
| RHY5-06 | Phase 10 | Pending |
| RHY5-07 | Phase 10 | Pending |
| RHY5-08 | Phase 10 | Pending |
| INT-01 | Phase 11 | Complete |
| INT-02 | Phase 11 | Complete |
| INT-03 | Phase 11 | Complete |
| INT-04 | Phase 11 | Complete |
| INT-05 | Phase 12 | Pending |

**Coverage:**
- v1.3 requirements: 70 total (4 data + 26 bass + 35 rhythm + 5 integration)
- Mapped to phases: 70
- Unmapped: 0

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-04 — Phase 11 requirements marked Complete (DATA-04, INT-01 to INT-04)*
