# Requirements: PianoApp

**Defined:** 2026-03-15
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v2.2 Requirements

Requirements for Sharps & Flats content expansion. Each maps to roadmap phases.

### Bug Fixes

- [x] **FIX-01**: Trail auto-start passes correct `enableSharps`/`enableFlats` flags derived from node's notePool
- [x] **FIX-02**: patternBuilder regex handles accidental pitches (F#4, Bb4) instead of silently dropping them

### Treble Clef Content

- [x] **TREB-01**: Treble sharps unit introduces F#4 and C#4 with discovery, practice, and mixed nodes
- [x] **TREB-02**: Treble flats unit introduces Bb4 and Eb4 with discovery, practice, and mixed nodes
- [x] **TREB-03**: Treble accidentals boss challenge node covering all 4 accidentals

### Bass Clef Content

- [x] **BASS-01**: Bass flats unit introduces Bb3 and Eb3 with discovery, practice, and mixed nodes
- [x] **BASS-02**: Bass sharps unit introduces F#3, C#3, G#3 with discovery, practice, and mixed nodes
- [x] **BASS-03**: Bass accidentals boss challenge node covering all 7 bass accidentals (F#3, C#3, G#3, Bb3, Eb3, Ab3, Db3)

### Integration

- [ ] **INTG-01**: New unit files wired into expandedNodes.js with build validator passing
- [ ] **INTG-02**: New nodes confirmed premium at both React UI (isFreeNode) and database RLS layers
- [ ] **INTG-03**: Mic input enharmonic matching verified for sight reading exercises with flats

### i18n

- [x] **I18N-01**: All new accidental note names have correct EN and HE translations

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Expansion

- **CONT-01**: Trail Section 5 — Key Signatures (~15 nodes)
- **CONT-02**: Trail Section 6 — Two-Hand Basics (~20 nodes)
- **CONT-03**: Trail Section 7 — Simple Melodies (~15 nodes, public domain songs)
- **CONT-04**: Trail Section 8 — Advanced Rhythm (~15 nodes, syncopation/compound meters)

### Engagement

- **ENGMT-01**: Enharmonic equivalence exercises (F#=Gb teaching mode)
- **ENGMT-02**: Auto-grow arcade filter for accidental-awareness

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Enharmonic equivalence exercises | Adds new exercise type complexity; defer to future milestone |
| New game modes (Interval Training) | Scope creep; existing 4 modes work well for accidentals |
| Auto-grow accidental filter | Low priority; natural-notes nodes getting occasional accidentals is acceptable |
| Database schema changes | No new tables or columns needed for content nodes |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIX-01 | Phase 01 | Complete |
| FIX-02 | Phase 01 | Complete |
| TREB-01 | Phase 02 | Complete |
| TREB-02 | Phase 02 | Complete |
| TREB-03 | Phase 02 | Complete |
| BASS-01 | Phase 03 | Complete |
| BASS-02 | Phase 03 | Complete |
| BASS-03 | Phase 03 | Complete |
| INTG-01 | Phase 04 | Pending |
| INTG-02 | Phase 04 | Pending |
| INTG-03 | Phase 04 | Pending |
| I18N-01 | Phase 04 | Complete |

**Coverage:**
- v2.2 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 — traceability complete (roadmap created)*
