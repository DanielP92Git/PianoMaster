# Roadmap: PianoApp v1.3 Trail System Redesign

## Overview

This milestone redesigns the trail data layer with consistent pedagogy across all three paths (Treble, Bass, Rhythm). Starting with data modeling and validation infrastructure, we then implement 26 Bass Clef nodes mirroring the treble pedagogy, followed by 35 Rhythm nodes with duration-based progression. Finally, we perform atomic cutover and validation to ensure existing user progress is preserved.

## Milestones

- ✅ **v1.0 Security Hardening** - Phases 1-4 (shipped 2026-02-01)
- ✅ **v1.1 Parental Consent Email** - Phase 5 (shipped 2026-02-02)
- ✅ **v1.2 Trail System Stabilization** - Phases 6-7 (shipped 2026-02-03)
- 🚧 **v1.3 Trail System Redesign** - Phases 8-12 (in progress)

## Phases

**Phase Numbering:**
- Continues from v1.2 (ended at Phase 7)
- Integer phases (8, 9, 10...): Planned milestone work
- Decimal phases (8.1, 8.2): Urgent insertions if needed

- [x] **Phase 8: Design & Data Modeling** - Validation infrastructure and pedagogy decisions
- [ ] **Phase 9: Bass Clef Implementation** - 26 nodes across 3 units (C4 to C3)
- [ ] **Phase 10: Rhythm Implementation** - 35 nodes across 5 units (quarter to sixteenth)
- [ ] **Phase 11: Integration & Cutover** - Atomic switch with progress preservation
- [ ] **Phase 12: Validation & Cleanup** - Test with production data, remove legacy code

## Phase Details

### Phase 8: Design & Data Modeling
**Goal**: Establish validation infrastructure and document pedagogy decisions before implementation
**Depends on**: Nothing (first phase of v1.3)
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. Build-time validation script catches invalid prerequisite chains before deploy
  2. Build-time validation script verifies all node types are valid NODE_TYPES
  3. Legacy node IDs documented with mapping to new structure (for progress preservation)
  4. XP economy audit shows parity between old and new trail totals
**Plans**: 2 plans (Wave 1 parallel)

Plans:
- [x] 08-01-PLAN.md — Build-time validation script + npm integration
- [x] 08-02-PLAN.md — Pedagogy documentation (PEDAGOGY.md)

### Phase 9: Bass Clef Implementation
**Goal**: 26 bass clef nodes following treble pedagogy pattern (Discovery, Practice, Mix-Up, Speed, Boss)
**Depends on**: Phase 8 (needs validation infrastructure)
**Requirements**: BASS1-01 to BASS1-08, BASS2-01 to BASS2-08, BASS3-01 to BASS3-10
**Success Criteria** (what must be TRUE):
  1. User can practice bass clef C4 through C3 (full octave progression)
  2. Each bass unit has 6-10 nodes with minimum 3 node types for engagement variety
  3. Bass Unit 1 introduces 1 new note per Discovery node (C4, B3, A3)
  4. Bass Unit 2 completes five-finger position (G3, F3)
  5. Bass Unit 3 completes full octave (E3, D3, C3) with Boss node
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Rhythm Implementation
**Goal**: 35 rhythm nodes with duration-based progression from quarter notes to sixteenths
**Depends on**: Phase 8 (needs validation infrastructure)
**Requirements**: RHY1-01 to RHY1-08, RHY2-01 to RHY2-06, RHY3-01 to RHY3-07, RHY4-01 to RHY4-06, RHY5-01 to RHY5-08
**Success Criteria** (what must be TRUE):
  1. User can learn rhythms from quarter notes through sixteenth notes progressively
  2. No eighth notes introduced until Unit 3 (appropriate difficulty for 8-year-olds)
  3. No sixteenth notes until Unit 5 (proper progression)
  4. Each rhythm unit has proper node type variety (Discovery, Practice, Mix-Up, Speed, Boss)
  5. Dotted note concepts introduced with proper pedagogical scaffolding
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

### Phase 11: Integration & Cutover
**Goal**: Atomic switch from legacy nodes to new structure with full progress preservation
**Depends on**: Phases 9 and 10 (need all unit files complete)
**Requirements**: DATA-04, INT-01, INT-02, INT-03, INT-04
**Success Criteria** (what must be TRUE):
  1. Single expandedNodes.js import combines all unit files (treble + bass + rhythm)
  2. Existing user progress on bass/rhythm Units 1-2 preserved (node IDs unchanged or mapped)
  3. XP economy maintains parity (users don't lose or gain unfair XP)
  4. Database triggers work with new node ID format
  5. LEGACY_NODES array removed from skillTrail.js
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

### Phase 12: Validation & Cleanup
**Goal**: Verify trail works with production data and remove all legacy code
**Depends on**: Phase 11 (cutover must be complete)
**Requirements**: INT-05
**Success Criteria** (what must be TRUE):
  1. Production data snapshot test shows no orphaned progress records
  2. All trail paths (treble, bass, rhythm) playable end-to-end
  3. nodeGenerator.js dependency removed for main trail paths
  4. Build-time validation passes with 0 errors
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10 → 11 → 12
Note: Phases 9 and 10 could potentially run in parallel (both depend only on Phase 8).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 8. Design & Data Modeling | v1.3 | 2/2 | Complete | 2026-02-03 |
| 9. Bass Clef Implementation | v1.3 | 0/TBD | Not started | - |
| 10. Rhythm Implementation | v1.3 | 0/TBD | Not started | - |
| 11. Integration & Cutover | v1.3 | 0/TBD | Not started | - |
| 12. Validation & Cleanup | v1.3 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-03*
*Last updated: 2026-02-03 — Phase 8 complete*
