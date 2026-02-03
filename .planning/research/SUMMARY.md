# Project Research Summary

**Project:** PianoApp v1.3 Trail System Redesign
**Domain:** Educational gamification - piano learning for children
**Researched:** 2026-02-03
**Confidence:** HIGH

## Executive Summary

This research covers the redesign of the PianoApp trail system to fix inconsistent pedagogy between treble clef (already well-designed), bass clef (needs redesign), and rhythm (needs redesign) paths. The existing treble clef Units 1-3 use a well-structured "explicit node definition" pattern with 8 nodes per unit, pedagogically sound note progression, and proper node type variety. The bass and rhythm paths currently use a legacy code generator that produces inconsistent nodes and lacks the pedagogical intentionality of the treble redesign.

The recommended approach is a **parallel creation with clean cutover** strategy: create all new bass (3 units) and rhythm (5 units) unit files following the treble template, then do a single atomic switch in `expandedNodes.js`. The key constraint is **maintaining existing node IDs** to preserve user progress data in `student_skill_progress`. The database stores progress by `node_id` string, so node definitions can change as long as IDs remain stable.

Critical risks center on data integrity and child-appropriate pedagogy. Breaking node ID changes will orphan user progress and erode trust. Introducing difficulty too quickly (more than 1-2 new notes per node, eighth notes before Unit 4, tempo jumps greater than 15 BPM) will create frustration for 8-year-olds. The existing treble redesign provides a proven template - the work is extending that pattern consistently to bass and rhythm while preserving compatibility with existing progress data.

## Key Findings

### Recommended Stack/Patterns

The research confirms the existing architecture is sound. No new technologies are needed - this is a data structure and content redesign, not a technical rewrite.

**Core patterns to follow:**
- **Explicit node definitions**: Each node is a complete, self-documenting object with all configuration inline (not generated). This matches the treble redesign and is how Duolingo and professional educational games structure content.
- **String-based prerequisite IDs with build-time validation**: Simple, serializable, allows cross-file references without import complexity.
- **Enumerated node types with metadata**: The existing `NODE_TYPES` (Discovery, Practice, Mix-Up, Speed Round, Review, Challenge, Mini-Boss, Boss) and `NODE_TYPE_METADATA` in `nodeTypes.js` should be reused verbatim.
- **File-per-unit organization**: `src/data/units/{path}/unit{N}.js` pattern enables focused code review and clear diff history.

**Technologies unchanged:**
- React 18 + Vite 6 (frontend)
- Supabase (database, auth)
- VexFlow v5 (notation rendering)
- Existing component architecture (TrailMap, TrailNodeModal, game components)

### Expected Features

**Must have (table stakes - users expect these):**
- 6-10 nodes per unit (current 8 nodes is optimal)
- Progressive difficulty with stair-step pattern (each node slightly harder, recovery after challenges)
- Mastery thresholds at 60%/80%/95% for 1/2/3 stars (research-validated)
- Node type variety (minimum 3-4 types per unit for engagement)
- Immediate, clear feedback (correct/incorrect shown instantly, no harsh penalties)
- Visual progress indicators (trail map with star ratings on completed nodes)

**Should have (differentiators):**
- Spaced repetition integration via REVIEW node type (high research backing, not currently implemented)
- Adaptive difficulty hints after repeated mistakes
- Song/applied practice nodes (connect learning to real music after Unit 1)

**Defer to v2+:**
- Path branching/Grand Staff integration (complex, not essential for trail consistency fix)
- Complex recommendation algorithms
- Comprehensive adaptive difficulty system

### Architecture Approach

The integration strategy is straightforward due to the existing architecture's modularity. The `skillProgressService.js` works with generic `node_id` strings, game components accept node configs via `location.state`, and the TrailMap renders whatever nodes are in `SKILL_NODES`. No component changes are required - only data layer changes.

**Major components (unchanged):**
1. **Unit definition files** (`src/data/units/*.js`) - Manual node definitions following treble template
2. **expandedNodes.js** - Combines all unit imports into `EXPANDED_NODES` array (single point of change for cutover)
3. **skillTrail.js** - Exports `SKILL_NODES`, helper functions, `UNITS` metadata (empty `LEGACY_NODES` after migration)
4. **TrailMap/TrailNodeModal** - Generic rendering of node arrays (no changes needed)
5. **skillProgressService.js** - CRUD for `student_skill_progress` table (node-agnostic)

**Files to create:** 8 new unit files (bassUnit1-3, rhythmUnit1-5)
**Files to modify:** 2 (expandedNodes.js for imports, skillTrail.js for LEGACY_NODES cleanup)
**Files to keep unchanged:** All components, services, constants, nodeTypes

### Critical Pitfalls

1. **Orphaned Progress Records** - Changing node IDs without migration mapping breaks user progress. Prevention: Use exact ID matching to legacy generator output (`bass_1_1`, `rhythm_1_1`, etc.). If IDs must change, update `LEGACY_TO_NEW_NODE_MAPPING` in `progressMigration.js` first.

2. **Prerequisite Chain Breaking** - Adding new nodes with prerequisites existing users never completed creates permanently locked content. Prevention: Implement "grandfather" logic where users with progress past a point auto-unlock inserted prerequisites. Map progress to SKILLS, not just node IDs.

3. **XP Economy Inflation/Deflation** - Different XP rewards cause level inconsistencies between old and new users. Prevention: Calculate total XP available in old vs. new trail during design phase. Decide policy (maintain parity vs. reset with bonus) before implementation.

4. **Difficulty Cliff for Kids** - Adding too many notes too fast or complex rhythms too early causes high abandonment. Prevention: Maximum 1-2 new notes per node, NO eighth notes until Unit 4, tempo increases under 15 BPM between nodes. User test with actual 8-year-olds.

5. **Database Trigger Assumptions** - The `trigger_update_unit_progress` SQL trigger parses node_id prefixes (`treble_`, `bass_`, `rhythm_`). Prevention: Maintain consistent node ID naming conventions or update trigger if conventions change.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Design and Data Modeling
**Rationale:** Pitfalls 1, 2, and 3 (orphaned progress, prerequisite breaks, XP economy) must be addressed BEFORE any coding begins. Design decisions here are irreversible without data migration.
**Delivers:** Complete node ID mapping, pedagogical curriculum for bass/rhythm, XP audit document
**Addresses:** Table stakes (progressive difficulty, node variety), pedagogy constraints (1-2 notes per node, no eighth notes until Unit 4)
**Avoids:** Pitfall 1 (document all existing node IDs), Pitfall 3 (calculate total XP), Pitfall 6 (pedagogy constraints)

### Phase 2: Bass Clef Unit Implementation
**Rationale:** Bass clef has fewer units (3 vs 5 for rhythm) and follows closer to treble pattern. Lower complexity, validates the approach before tackling rhythm.
**Delivers:** bassUnit1Redesigned.js, bassUnit2Redesigned.js, bassUnit3Redesigned.js (26 nodes estimated)
**Uses:** Treble unit template, explicit node definition pattern
**Implements:** Note progression C4->B3->A3 (Unit 1), G3->F3 (Unit 2), E3->D3->C3 (Unit 3)
**Avoids:** Pitfall 15 (Middle C position myopia - must expand downward to natural bass register)

### Phase 3: Rhythm Unit Implementation
**Rationale:** Rhythm has unique considerations (no noteConfig, different exercise types) and more units (5). Benefits from lessons learned in Phase 2.
**Delivers:** rhythmUnit1-5Redesigned.js (32 nodes estimated)
**Uses:** RHYTHM_COMPLEXITY enum, rhythm-specific node template
**Implements:** Steady beat (Unit 1), half notes (Unit 2), whole notes/rests (Unit 3), eighth notes (Unit 4), mixed/advanced (Unit 5)
**Avoids:** Pitfall 12 (rhythm before reading confidence - no eighth notes until Unit 4)

### Phase 4: Integration and Cutover
**Rationale:** Single atomic switch minimizes risk. All files exist but unused until cutover commit.
**Delivers:** Updated expandedNodes.js, cleaned LEGACY_NODES, working trail system
**Implements:** Clean cutover pattern from ARCHITECTURE.md
**Avoids:** Pitfall 5 (database trigger compatibility verified before deploy)

### Phase 5: Validation and Cleanup
**Rationale:** Testing with real user data snapshots and actual 8-year-olds catches issues before production.
**Delivers:** Verified trail, removed legacy generator code, updated documentation
**Avoids:** Pitfall 4 (exercise type routing), Pitfall 7 (sight reading config compatibility)

### Phase Ordering Rationale

- **Design first**: Data modeling mistakes (wrong node IDs, broken prerequisites) are expensive to fix after users have progress
- **Bass before Rhythm**: Lower complexity validates approach; rhythm has unique considerations
- **Single cutover**: Atomic switch avoids partial states; easy rollback if issues discovered
- **Validation last**: Real user data testing requires complete system; can't test incrementally

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Rhythm):** Rhythm exercises have different game components (MetronomeTrainer) and config structure. May need research into rhythm-specific pedagogical patterns for 8-year-olds.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Bass):** Direct extension of treble pattern - well-documented in existing trebleUnit1Redesigned.js
- **Phase 4 (Integration):** Pure file organization change - no domain knowledge needed

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing patterns proven in treble redesign, no new tech needed |
| Features | HIGH | Multiple sources agree on 6-10 nodes, mastery thresholds, node variety |
| Architecture | HIGH | Verified against existing codebase; integration points confirmed |
| Pitfalls | HIGH | Based on internal codebase analysis + established migration patterns |

**Overall confidence:** HIGH

### Gaps to Address

- **REVIEW node type not implemented**: Research strongly supports spaced repetition. Consider adding during this redesign or flagging for immediate follow-up.
- **Song/applied practice nodes**: Research suggests real songs increase motivation. Current design is all abstract exercises. May require new game component.
- **Adaptive difficulty**: Research supports dynamic question counts and tempo adjustment. Not in current design - could be future enhancement.
- **Rhythm path pedagogy specifics**: Less established pattern than note reading. May need iteration based on user testing.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/data/skillTrail.js`, `src/data/nodeTypes.js`, `src/data/units/trebleUnit1Redesigned.js`
- Existing generator (anti-pattern): `src/utils/nodeGenerator.js`
- Database schema: `student_skill_progress`, `trigger_update_unit_progress`

### Secondary (MEDIUM confidence)
- [Frontiers in Education: Gamified Educational Applications](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1668260/full)
- [Mastery Learning - Education Endowment Foundation](https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/mastery-learning)
- [Spaced Repetition Learning Games](https://www.researchgate.net/publication/268130455_Spaced_repetition_learning_games_on_mobile_devices_Foundations_and_perspectives)
- [Flow Theory and Learning Experience Design](https://edtechbooks.org/ux/flow_theory_and_lxd)
- [Duolingo Path Structure](https://duolingoguides.com/how-many-sections-in-duolingo/)

### Tertiary (LOW confidence, needs validation)
- Music teaching methodology sources (varied quality, cross-referenced for consensus)
- Piano app reviews (Simply Piano, Yousician) - user feedback, not research

---
*Research completed: 2026-02-03*
*Ready for roadmap: yes*
