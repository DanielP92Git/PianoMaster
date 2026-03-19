# Requirements: PianoApp v2.4 Content Expansion

**Defined:** 2026-03-18
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v2.4 Requirements

Requirements for Key Signatures (6 keys, treble + bass) and Advanced Rhythm (6/8 compound meter + syncopation).

### Rendering Infrastructure

- [x] **RENDER-01**: VexFlow renders key signature glyphs on staff via `stave.addKeySignature()`
- [x] **RENDER-02**: Accidentals suppressed for notes covered by active key signature via `Accidental.applyAccidentals()`
- [x] **RENDER-03**: Key signature config passes through trail node → game component pipeline

### Treble Key Signatures

- [x] **TREB-01**: G major (1 sharp) treble nodes with discovery scaffolding explaining key signature concept
- [x] **TREB-02**: D major (2 sharps) treble nodes
- [x] **TREB-03**: A major (3 sharps) treble nodes
- [x] **TREB-04**: F major (1 flat) treble nodes
- [x] **TREB-05**: Bb major (2 flats) treble nodes
- [x] **TREB-06**: Eb major (3 flats) treble nodes
- [x] **TREB-07**: Treble key signatures boss challenge (all 6 keys mixed)

### Bass Key Signatures

- [x] **BASS-01**: G major (1 sharp) bass nodes
- [x] **BASS-02**: D major (2 sharps) bass nodes
- [x] **BASS-03**: A major (3 sharps) bass nodes
- [x] **BASS-04**: F major (1 flat) bass nodes
- [x] **BASS-05**: Bb major (2 flats) bass nodes
- [x] **BASS-06**: Eb major (3 flats) bass nodes
- [x] **BASS-07**: Bass key signatures boss challenge (all 6 keys mixed)

### Rhythm Infrastructure

- [x] **RFIX-01**: Fix 6/8 beat model (beats:6 → beats:2 compound grouping)
- [x] **RFIX-02**: Compound beaming uses correct 3+3 eighth-note grouping for 6/8

### Advanced Rhythm

- [x] **RADV-01**: 6/8 compound meter discovery nodes with scaffolding
- [x] **RADV-02**: 6/8 compound meter practice nodes (basic → intermediate → advanced)
- [x] **RADV-03**: Syncopation pattern nodes (eighth-quarter-eighth, dotted quarter-eighth)
- [x] **RADV-04**: Advanced rhythm boss challenge (6/8 + syncopation mixed)

### Integration

- [x] **INTG-01**: All new unit files wired in expandedNodes.js with build-time validation passing
- [x] **INTG-02**: New nodes use default-deny subscription gate (no additions to FREE_NODE_IDS)
- [ ] **INTG-03**: Full EN/HE i18n translations for all new node names, descriptions, and UI text

## Future Requirements

Deferred to future milestones. See `.planning/FUTURE_MILESTONES.md` for full backlog.

### Content Expansion (continued)

- **CONTENT-01**: Two-Hand Basics (~20 nodes, grand staff UI)
- **CONTENT-02**: Simple Melodies (~15 nodes, public domain songs)
- **CONTENT-03**: Procedural "Endless Practice" mode

### Retention Mechanics

- **RETAIN-01**: Spaced repetition "Rusty Skills" system
- **RETAIN-02**: Weekly bonus events (Double XP, Focus weeks)

### Game Variety

- **GAME-01**: New mini-game types (Note Catcher, Melody Puzzle, Interval Training)
- **GAME-02**: Adaptive difficulty within sessions

### Narrative

- **NARR-01**: Story campaign wrapper
- **NARR-02**: Seasonal events with themed content

## Out of Scope

Explicitly excluded from v2.4.

| Feature | Reason |
|---------|--------|
| Triplets (tuplets) | Requires new generator path; integer math invariant in rhythmGenerator |
| Minor key signatures | Major keys sufficient for beginner level; minor adds cognitive load |
| Key signature in Note Recognition game | Key sig is a staff-level concept; sight reading only |
| 3/4 waltz-feel nodes | Not selected for this milestone; can add later |
| Grand Staff (two-hand) | Separate milestone — needs new UI and input model |
| Free node additions | Default-deny; all new nodes are premium |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RENDER-01 | Phase 07 | Complete |
| RENDER-02 | Phase 07 | Complete |
| RENDER-03 | Phase 07 | Complete |
| TREB-01 | Phase 08 | Complete |
| TREB-02 | Phase 08 | Complete |
| TREB-03 | Phase 08 | Complete |
| TREB-04 | Phase 08 | Complete |
| TREB-05 | Phase 08 | Complete |
| TREB-06 | Phase 08 | Complete |
| TREB-07 | Phase 08 | Complete |
| BASS-01 | Phase 08 | Complete |
| BASS-02 | Phase 08 | Complete |
| BASS-03 | Phase 08 | Complete |
| BASS-04 | Phase 08 | Complete |
| BASS-05 | Phase 08 | Complete |
| BASS-06 | Phase 08 | Complete |
| BASS-07 | Phase 08 | Complete |
| RFIX-01 | Phase 09 | Complete |
| RFIX-02 | Phase 09 | Complete |
| RADV-01 | Phase 10 | Complete |
| RADV-02 | Phase 10 | Complete |
| RADV-03 | Phase 10 | Complete |
| RADV-04 | Phase 10 | Complete |
| INTG-01 | Phase 11 | Complete |
| INTG-02 | Phase 11 | Complete |
| INTG-03 | Phase 11 | Pending |

**Coverage:**
- v2.4 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 — traceability filled after roadmap creation*
