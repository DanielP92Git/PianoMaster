# Requirements: PianoApp v1.2

**Defined:** 2026-02-03
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v1.2 Requirements

Requirements for trail system stabilization. Commits and validates existing uncommitted work.

### Trail Foundation

- [ ] **TRAIL-01**: Commit trail redesign Phase 1 files (constants, nodeTypes, sections, units 1-3)
- [ ] **TRAIL-02**: Commit trail redesign Phase 2 files (MemoryGame integration, navigation updates)
- [ ] **TRAIL-03**: All 26 treble clef nodes load without circular dependency errors
- [ ] **TRAIL-04**: No eighth notes appear in Units 1-3 node definitions (pedagogical requirement)

### Memory Game Integration

- [ ] **MEM-01**: Memory game auto-starts when navigated from trail node
- [ ] **MEM-02**: Memory game uses correct note pool from node configuration
- [ ] **MEM-03**: Grid size parsed correctly from nodeConfig (e.g., "2x4", "3x4")
- [ ] **MEM-04**: VictoryScreen shows correct stars and XP after memory game completion
- [ ] **MEM-05**: Progress saved to student_skill_progress table after completion

### Navigation

- [ ] **NAV-01**: "Start Practice" from TrailNodeModal navigates to correct game type
- [ ] **NAV-02**: "Next Exercise" button appears for multi-exercise nodes
- [ ] **NAV-03**: Navigation between different exercise types works (note_recognition → memory_game → sight_reading)
- [ ] **NAV-04**: "Back to Trail" returns to trail map after final exercise

### Cleanup

- [ ] **CLEAN-01**: Remove temporary documentation files from repo root (IMPLEMENTATION_STATUS.md, PHASE2_COMPLETE.md, REDESIGN_COMPLETE.md, TEST_PLAN.md)
- [ ] **CLEAN-02**: Remove debug files (verify-redesign.mjs, unlock-nodes-test.sql)

## v1.3+ Requirements

Deferred to future milestones.

### Trail Enhancements

- **ENH-01**: VictoryScreen node-type-specific celebrations
- **ENH-02**: Unlock event modal after Unit 3 Boss completion
- **ENH-03**: Node type icons and colors in TrailNode.jsx
- **ENH-04**: "What's New" badges in TrailNodeModal.jsx
- **ENH-05**: Unit 4 with eighth notes introduction

### Production Deployment

- **PROD-01**: Hard delete Edge Function for expired accounts
- **PROD-02**: App store deployment to Google Play
- **PROD-03**: App store deployment to Apple App Store
- **PROD-04**: Beta testing with human verification checklist

## Out of Scope

Explicitly excluded from v1.2.

| Feature | Reason |
|---------|--------|
| VictoryScreen enhancements | Requires Phase 3 design work, deferred to v1.3 |
| Unlock Event Modal | Depends on VictoryScreen work |
| Node type UI polish | Polish after core functionality stable |
| Unit 4 (eighth notes) | Requires Phases 3-5 first |
| Production deployment | Trail must be stable first |
| Performance optimization | Not security-critical, separate project |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TRAIL-01 | Phase 6 | Pending |
| TRAIL-02 | Phase 6 | Pending |
| TRAIL-03 | Phase 6 | Pending |
| TRAIL-04 | Phase 6 | Pending |
| MEM-01 | Phase 6 | Pending |
| MEM-02 | Phase 6 | Pending |
| MEM-03 | Phase 6 | Pending |
| MEM-04 | Phase 6 | Pending |
| MEM-05 | Phase 6 | Pending |
| NAV-01 | Phase 6 | Pending |
| NAV-02 | Phase 6 | Pending |
| NAV-03 | Phase 6 | Pending |
| NAV-04 | Phase 6 | Pending |
| CLEAN-01 | Phase 6 | Pending |
| CLEAN-02 | Phase 6 | Pending |

**Coverage:**
- v1.2 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-03 after initial definition*
