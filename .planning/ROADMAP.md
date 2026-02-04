# Roadmap: PianoApp v1.3 Trail System Redesign

## Overview

This milestone redesigns the trail data layer with consistent pedagogy across all three paths (Treble, Bass, Rhythm). Starting with data modeling and validation infrastructure, we then implement 26 Bass Clef nodes mirroring the treble pedagogy, followed by 42 Rhythm nodes with duration-based progression across 6 units. Finally, we perform atomic cutover and validation to ensure existing user progress is preserved.

## Milestones

- ✅ **v1.0 Security Hardening** - Phases 1-4 (shipped 2026-02-01)
- ✅ **v1.1 Parental Consent Email** - Phase 5 (shipped 2026-02-02)
- ✅ **v1.2 Trail System Stabilization** - Phases 6-7 (shipped 2026-02-03)
- ✅ **v1.3 Trail System Redesign** - Phases 8-12 (shipped 2026-02-05)

## Phases

**Phase Numbering:**
- Continues from v1.2 (ended at Phase 7)
- Integer phases (8, 9, 10...): Planned milestone work
- Decimal phases (8.1, 8.2): Urgent insertions if needed

- [x] **Phase 8: Design & Data Modeling** - Validation infrastructure and pedagogy decisions
- [x] **Phase 9: Bass Clef Implementation** - 22 nodes across 3 units (C4 to C3)
- [x] **Phase 10: Rhythm Implementation** - 36 nodes across 6 units (quarter to sixteenth)
- [x] **Phase 11: Integration & Cutover** - Atomic switch with progress preservation
- [x] **Phase 12: Validation & Cleanup** - Test with production data, remove legacy code

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
**Goal**: 25 bass clef nodes following treble pedagogy pattern (Discovery, Practice, Mix-Up, Speed, Boss)
**Depends on**: Phase 8 (needs validation infrastructure)
**Requirements**: BASS1-01 to BASS1-08, BASS2-01 to BASS2-08, BASS3-01 to BASS3-10
**Success Criteria** (what must be TRUE):
  1. User can practice bass clef C4 through C3 (full octave progression)
  2. Each bass unit has 6-10 nodes with minimum 3 node types for engagement variety
  3. Bass Unit 1 introduces 1 new note per Discovery node (C4, B3, A3)
  4. Bass Unit 2 completes five-finger position (G3, F3)
  5. Bass Unit 3 completes full octave (E3, D3, C3) with Boss node
**Plans**: 4 plans (Wave 1: 3 parallel, Wave 2: 1 sequential)

Plans:
- [x] 09-01-PLAN.md — Bass Unit 1: Middle C Position (7 nodes: C4, B3, A3)
- [x] 09-02-PLAN.md — Bass Unit 2: Five Finger Low (8 nodes: adds G3, F3)
- [x] 09-03-PLAN.md — Bass Unit 3: The Full Octave (10 nodes: adds E3, D3, C3)
- [x] 09-04-PLAN.md — Integration into expandedNodes.js + validation

### Phase 10: Rhythm Implementation
**Goal**: 42 rhythm nodes (6 units x 7 nodes) with duration-based progression from quarter notes to sixteenths
**Depends on**: Phase 8 (needs validation infrastructure)
**Requirements**: RHY1-01 to RHY1-08, RHY2-01 to RHY2-06, RHY3-01 to RHY3-07, RHY4-01 to RHY4-06, RHY5-01 to RHY5-08, RHY6-01 to RHY6-08
**Success Criteria** (what must be TRUE):
  1. User can learn rhythms from quarter notes through sixteenth notes progressively
  2. No eighth notes introduced until Unit 3 (appropriate difficulty for 8-year-olds)
  3. No sixteenth notes until Unit 6 (proper progression)
  4. Each rhythm unit has proper node type variety (Discovery, Practice, Mix-Up, Speed, Boss)
  5. Dotted note concepts introduced with proper pedagogical scaffolding (Unit 5)
  6. 3/4 time signature introduced in Unit 5 with dedicated nodes
  7. Dedicated rests unit (Unit 4) treats silence as a distinct skill
**Plans**: 4 plans (Wave 1: 3 parallel, Wave 2: 1 sequential)

Plans:
- [x] 10-01-PLAN.md — Units 1-2: Basic Beats (quarter+half) and Complete Basics (add whole)
- [x] 10-02-PLAN.md — Units 3-4: Running Notes (eighths) and Sound of Silence (rests)
- [x] 10-03-PLAN.md — Units 5-6: Dotted Notes (3/4 time) and Sixteenths (final unit)
- [x] 10-04-PLAN.md — Integration into expandedNodes.js + validation

### Phase 11: Integration & Cutover
**Goal**: Atomic switch from legacy nodes to new structure with progress reset (XP preserved)
**Depends on**: Phases 9 and 10 (need all unit files complete)
**Requirements**: DATA-04, INT-01, INT-02, INT-03, INT-04
**Success Criteria** (what must be TRUE):
  1. Single expandedNodes.js import combines all unit files (treble + bass + rhythm)
  2. User XP totals preserved (progress reset per PEDAGOGY.md, but XP reflects effort)
  3. Database triggers work with new node ID format
  4. LEGACY_NODES array marked deprecated (not spread into SKILL_NODES)
  5. Build passes with 87 validated nodes
**Plans**: 2 plans (Wave 1: 1, Wave 2: 1)

Plans:
- [x] 11-01-PLAN.md — Core cutover (migration + skillTrail.js update)
- [x] 11-02-PLAN.md — Build verification + smoke test

### Phase 12: Validation & Cleanup
**Goal**: Verify trail works with production data and remove all legacy code
**Depends on**: Phase 11 (cutover must be complete)
**Requirements**: INT-05
**Success Criteria** (what must be TRUE):
  1. Production data snapshot test shows no orphaned progress records
  2. All trail paths (treble, bass, rhythm) playable end-to-end
  3. nodeGenerator.js dependency removed for main trail paths
  4. Build-time validation passes with 0 errors
**Plans**: 2 plans (Wave 1: 1, Wave 2: 1)

Plans:
- [x] 12-01-PLAN.md — Delete LEGACY_NODES and audit dead code
- [x] 12-02-PLAN.md — E2E verification and documentation update

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10 → 11 → 12
Note: Phases 9 and 10 could potentially run in parallel (both depend only on Phase 8).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 8. Design & Data Modeling | v1.3 | 2/2 | Complete | 2026-02-03 |
| 9. Bass Clef Implementation | v1.3 | 4/4 | Complete | 2026-02-04 |
| 10. Rhythm Implementation | v1.3 | 4/4 | Complete | 2026-02-04 |
| 11. Integration & Cutover | v1.3 | 2/2 | Complete | 2026-02-04 |
| 12. Validation & Cleanup | v1.3 | 2/2 | Complete | 2026-02-05 |

---
*Roadmap created: 2026-02-03*
*Last updated: 2026-02-05 — v1.3 SHIPPED: 93-node trail system with consistent pedagogy*
