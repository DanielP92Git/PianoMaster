# Domain Pitfalls: Trail System Redesign

**Domain:** Skill progression system redesign for piano learning PWA
**Target Age:** 8-year-old learners
**Researched:** 2026-02-03
**Context:** Existing users with progress in `student_skill_progress` table (node_id TEXT references)

---

## Critical Pitfalls

These mistakes cause data loss, major rewrites, or irreparable user experience damage.

---

### Pitfall 1: Orphaned Progress Records (Breaking Node ID Changes)

**What goes wrong:**
Changing node IDs without a proper mapping strategy leaves existing user progress orphaned in the database. The `student_skill_progress` table stores `node_id` as TEXT, meaning if you rename `bass_1_1` to `bass_unit1_cb` (or similar), users lose their stars, XP history, and completion status for that node.

**Why it happens:**
- Developers focus on the "new and improved" system without considering existing data
- ID naming conventions change mid-project ("this new scheme is better")
- The impact isn't visible until users complain about missing progress

**Consequences:**
- Users lose earned stars and feel punished for early adoption
- XP totals become inconsistent (XP was awarded for nodes that no longer exist)
- Daily goals referencing old node IDs break
- Teacher dashboards show inaccurate student progress
- Trust erosion: "The app deleted my work"

**Warning Signs (How to detect early):**
- Node IDs in new design don't match pattern in `LEGACY_TO_NEW_NODE_MAPPING`
- New node IDs exist without corresponding migration mapping
- Discussion of "cleaner naming" without migration plan
- Unit tests pass but integration tests with real user data fail

**Prevention Strategy:**
1. **Phase 1 (Design):** Document ALL existing node IDs before starting
2. **Phase 1 (Design):** Create migration mapping BEFORE finalizing new IDs
3. **Phase 2 (Implementation):** Extend `LEGACY_TO_NEW_NODE_MAPPING` in `progressMigration.js`
4. **Phase 2 (Implementation):** Add database migration script to copy/transform records
5. **Phase 3 (Testing):** Test with snapshot of production data
6. **Phase 4 (Rollout):** Keep old node definitions in `LEGACY_NODES` array for backward compat

**Relevant Phase:** Phase 1 (Design/Data Modeling) - This must be addressed FIRST before any node ID decisions are finalized.

**Code Reference:**
```javascript
// Current mapping in src/utils/progressMigration.js
const LEGACY_TO_NEW_NODE_MAPPING = {
  'bass_c_b': 'bass_1_1',  // Must update this for each new ID
  // ... etc
};
```

---

### Pitfall 2: Prerequisite Chain Breaking (Unreachable Nodes)

**What goes wrong:**
Adding new nodes between existing nodes or changing prerequisites creates situations where:
- Users who completed old nodes don't have the new prerequisites met
- New users face a longer path than existing users
- Some nodes become permanently locked despite user having demonstrated mastery

**Why it happens:**
- Pedagogical improvements require adding "foundation" content
- New nodes inserted without considering existing user state
- Prerequisite logic checks for exact node IDs, not skill equivalence

**Consequences:**
- Users stuck at a node they can't unlock (prerequisites changed)
- Perceived unfairness ("I already proved I know this!")
- Support tickets from frustrated parents
- Kids lose motivation when progress is blocked

**Warning Signs:**
- New nodes have prerequisites that existing users never completed
- `isNodeUnlocked()` returns false for users who completed subsequent nodes
- Different unlock paths for old vs. new users

**Prevention Strategy:**
1. **Phase 1:** Map existing user progress to SKILLS, not just node IDs
2. **Phase 2:** Implement "skill equivalence" checking: if user has 3 stars on `bass_master`, they have demonstrated knowledge of C2-C4, so unlock nodes requiring those skills
3. **Phase 2:** Add "grandfather" logic: users with progress past a point auto-unlock inserted prerequisites
4. **Phase 3:** Test with users at EVERY stage of progression (beginning, middle, advanced)

**Relevant Phase:** Phase 1 (Design) and Phase 2 (Implementation) - Prerequisite changes need careful planning AND migration logic.

---

### Pitfall 3: XP Economy Inflation/Deflation

**What goes wrong:**
Redesigned nodes have different XP rewards than old nodes, causing:
- Users who completed old trail are suddenly at different levels than expected
- New users progress faster/slower than existing users at same skill level
- Leaderboards become meaningless (old vs. new trail users)

**Why it happens:**
- XP values chosen without considering historical awards
- More nodes = more total XP available
- No audit of `students.total_xp` before/after migration

**Consequences:**
- Level 5 user suddenly becomes Level 3 (or vice versa)
- Daily goals for "earn X XP" become trivially easy or impossible
- Teacher comparisons between students become invalid

**Warning Signs:**
- Total possible XP from new trail differs significantly from old trail
- Migration awards bonus XP without considering new baseline
- Level thresholds in `XP_LEVELS` array don't align with new total

**Prevention Strategy:**
1. **Phase 1:** Calculate total XP available in old vs. new trail
2. **Phase 1:** Decide policy: maintain parity, or reset with bonus?
3. **Phase 2:** Adjust XP rewards OR level thresholds to maintain consistency
4. **Phase 2:** Consider "legacy bonus" for early adopters vs. pure parity

**Relevant Phase:** Phase 1 (Design) - XP economy affects user motivation and must be planned upfront.

---

## Moderate Pitfalls

These mistakes cause delays, technical debt, or degraded user experience.

---

### Pitfall 4: Exercise Type Mismatch (Routing Failures)

**What goes wrong:**
New nodes define exercise types that don't have corresponding game component routing, or existing routing logic uses hardcoded exercise types that don't match new definitions.

**Why it happens:**
- `EXERCISE_TYPES` constants extended without updating VictoryScreen/navigation
- Switch statements in game components don't handle new exercise types
- Copy-paste of node definitions with wrong exercise type strings

**Consequences:**
- "Next Exercise" button navigates to wrong game or crashes
- VictoryScreen shows wrong XP calculation
- Multi-exercise nodes get stuck after first exercise

**Warning Signs:**
- Console errors about unhandled exercise types
- `handleNextExercise` navigating to undefined routes
- Exercise progress saved with type mismatch

**Prevention Strategy:**
1. **Phase 2:** Add TypeScript-style validation for exercise types (or JSDoc types)
2. **Phase 2:** Exhaustive switch statements with default error throws
3. **Phase 3:** E2E test that completes every node type through all exercises

**Relevant Phase:** Phase 2 (Implementation) - Must validate all exercise types route correctly.

**Code Reference:**
```javascript
// src/data/constants.js - ensure all types are handled
export const EXERCISE_TYPES = {
  NOTE_RECOGNITION: 'note_recognition',
  SIGHT_READING: 'sight_reading',
  RHYTHM: 'rhythm',
  MEMORY_GAME: 'memory_game',  // Added in treble redesign
  BOSS_CHALLENGE: 'boss_challenge'
};
```

---

### Pitfall 5: Unit/Category Trigger Assumptions

**What goes wrong:**
Database trigger `trigger_update_unit_progress` parses `node_id` prefix to determine category (`treble_`, `bass_`, `rhythm_`, `boss_`). New node IDs that don't follow this convention break unit progress tracking.

**Why it happens:**
- Trigger logic hardcoded in SQL migration (easy to forget)
- Node ID naming changed without updating trigger
- Developers test with fresh DB without trigger

**Consequences:**
- `unit_id` column not populated correctly
- `student_unit_progress` table has missing/wrong entries
- Unit completion badges not awarded
- Teacher reports show incomplete unit data

**Warning Signs:**
- `student_skill_progress.unit_id` is NULL for new nodes
- Unit progress queries return empty results
- Boss nodes not triggering unit completion rewards

**Prevention Strategy:**
1. **Phase 1:** Document node ID naming convention as STRICT requirement
2. **Phase 2:** If naming must change, update trigger in migration file
3. **Phase 3:** Test trigger with new node IDs BEFORE deploying

**Relevant Phase:** Phase 2 (Implementation) - Database trigger update must accompany node changes.

**Code Reference (SQL trigger):**
```sql
-- From 20260131000002_audit_security_definer.sql
IF NEW.node_id LIKE 'treble_%' THEN
  v_category := 'treble_clef';
ELSIF NEW.node_id LIKE 'bass_%' THEN
  v_category := 'bass_clef';
-- etc.
```

---

### Pitfall 6: Tempo/Difficulty Cliff for Kids

**What goes wrong:**
Pedagogically, new nodes increase difficulty too quickly, causing 8-year-olds to hit a "wall" where they fail repeatedly and lose motivation.

**Why it happens:**
- Adult designers underestimate difficulty for children
- Note pool grows too fast (2 notes -> 5 notes in one jump)
- Tempo increases without sufficient practice
- New rhythm complexity (eighth notes) introduced before mastery of quarters/halves

**Consequences:**
- High abandonment rate at specific nodes
- Kids feel "dumb" and stop practicing
- Parents complain the app is "too hard"
- Daily goals become unachievable

**Warning Signs:**
- Analytics show high failure rate at specific nodes
- Node has >4 new notes compared to prerequisite
- Tempo jumps more than 15 BPM between nodes
- Eighth notes appear before Unit 4 (violates current design)

**Prevention Strategy:**
1. **Phase 1:** Follow existing pattern: NO eighth notes until Unit 4
2. **Phase 1:** Maximum 1-2 new notes per node
3. **Phase 1:** Tempo increases of max 10 BPM between nodes
4. **Phase 3:** User test with actual 8-year-olds (not just adults)
5. **Phase 4:** Monitor analytics for difficulty cliffs post-launch

**Relevant Phase:** Phase 1 (Design) - Pedagogy decisions must be made during node design.

**Research Backing:**
- "You have to move gradually from the simple to the more complicated" - established pedagogical principle
- Children's attention span averages 8-12 minutes; frustration breaks engagement faster
- Existing treble redesign correctly limits Unit 1-3 to quarters and halves only

---

### Pitfall 7: Sight Reading Config Incompatibility

**What goes wrong:**
Sight reading exercises in new nodes have `rhythmConfig` that doesn't match what the VexFlow renderer or rhythm generator can handle, causing visual glitches or crashes.

**Why it happens:**
- Node config uses rhythm patterns not supported by `rhythmGenerator.js`
- Time signature in config doesn't match pattern possibilities
- Measures per pattern creates mathematically impossible patterns

**Consequences:**
- VexFlow crashes with "cannot fit notes in measure"
- Visual notation looks wrong (notes overflow bar)
- Sight reading exercises display error instead of notes

**Warning Signs:**
- Console errors from `rhythmGenerator` or `patternBuilder`
- Notes overlapping or extending past barlines in VexFlow
- White/blank notation display area

**Prevention Strategy:**
1. **Phase 2:** Run `npm run verify:patterns` after adding new nodes
2. **Phase 2:** Ensure all `rhythmPatterns` in config exist in tier definitions
3. **Phase 3:** Visual test every sight reading node configuration

**Relevant Phase:** Phase 2 (Implementation) - Pattern verification must be part of build process.

---

## Minor Pitfalls

These mistakes cause annoyance but are easily fixable.

---

### Pitfall 8: Missing Accessory Unlocks

**What goes wrong:**
Boss nodes promise accessory unlocks (`accessoryUnlock: 'bass_sprout_badge'`) but the accessory doesn't exist in the accessories table or has a different ID.

**Why it happens:**
- Accessory naming not coordinated between trail design and accessories table
- Accessories added after initial design but ID not updated
- Copy-paste from treble to bass nodes without changing accessory

**Consequences:**
- User completes boss, no accessory appears
- Error logged but user just sees nothing
- Kids disappointed by missing reward

**Prevention Strategy:**
1. **Phase 2:** Validate all `accessoryUnlock` IDs exist in `accessories` table
2. **Phase 2:** Add pre-commit validation script for accessory references

**Relevant Phase:** Phase 2 (Implementation) - Accessory validation can be automated.

---

### Pitfall 9: Inconsistent Node Ordering

**What goes wrong:**
`order` and `orderInUnit` values have gaps or duplicates, causing TrailMap to render nodes in wrong positions or with broken path connectors.

**Why it happens:**
- Manual order assignment during node definition
- Nodes added/removed without updating subsequent orders
- Multiple developers working on different units

**Consequences:**
- TrailMap shows nodes in wrong visual order
- Path connectors point to wrong nodes
- "Next recommended node" algorithm returns unexpected results

**Prevention Strategy:**
1. **Phase 2:** Auto-generate `order` values from array index
2. **Phase 2:** Add build-time validation for order uniqueness

**Relevant Phase:** Phase 2 (Implementation) - Can be caught with validation.

---

### Pitfall 10: localStorage Migration Key Collisions

**What goes wrong:**
The migration tracking uses localStorage key `trail_migration_v2_${studentId}`. If a second migration is needed, the key pattern must be updated, but if forgotten, users who already migrated won't get the new migration.

**Why it happens:**
- Migration key version not bumped
- Multiple migrations over time with overlapping patterns
- localStorage keys not documented

**Consequences:**
- Returning users don't get migration applied
- Partial progress state (some old, some new)
- Debugging nightmare

**Prevention Strategy:**
1. **Phase 2:** Bump version to `v3` for this redesign
2. **Phase 2:** Consider database-based migration tracking instead of localStorage
3. **Phase 2:** Document all migration keys in CLAUDE.md

**Relevant Phase:** Phase 2 (Implementation) - Migration key management.

---

## Domain-Specific Pitfalls for Kids Music Learning

These are specific to teaching piano/music to 8-year-olds.

---

### Pitfall 11: Too Many Notes Too Fast

**What goes wrong:**
Adding more than 1-2 new notes per node overwhelms children's working memory. Research shows 4-6 year olds should work with notes as "graphical structure" and build slowly.

**Why it happens:**
- Adults can handle 8-note pools easily, so assume kids can too
- Pressure to "cover more content"
- Comparing to methods designed for older students

**Consequences:**
- Children guess randomly instead of recognizing patterns
- Frustration and tears
- "I hate piano" syndrome

**Prevention Strategy:**
- Current treble redesign is correct: C, then C+D, then C+D+E over 5 nodes
- Apply same pattern to bass and rhythm redesign
- Maximum 3 notes in any note pool for first 3 units

**Relevant Phase:** Phase 1 (Design) - Pedagogical constraint.

**Research Backing:**
- "Start with treble C through G, then adding Bass C through G" - progressive approach
- "Initially this can be restricted to 3 notes, then expanded to 5, 6, 7 and then a full octave"
- Treble Unit 1 correctly limits to C4, D4, E4 (3 notes)

---

### Pitfall 12: Rhythm Before Reading Confidence

**What goes wrong:**
Introducing complex rhythms (eighth notes, syncopation) before children can confidently read the notes adds too many cognitive demands simultaneously.

**Why it happens:**
- Rhythm is "exciting" and designers want to add variety
- Methods for older students mix rhythm complexity earlier
- "Quarter notes are boring"

**Consequences:**
- Children confuse note recognition with rhythm counting
- Neither skill is properly learned
- Kids can't tell if they got the note wrong or the rhythm wrong

**Prevention Strategy:**
- Current design rule: NO eighth notes until Unit 4
- Units 1-3 use only quarters and halves
- Bass and rhythm redesign MUST follow same principle

**Relevant Phase:** Phase 1 (Design) - This is a HARD constraint.

---

### Pitfall 13: Insufficient Immediate Feedback

**What goes wrong:**
Children expect quick reactions - visual animations, sounds, or haptic feedback. Delayed or missing feedback makes them uncertain if their input was registered.

**Why it happens:**
- Server-side validation adds latency
- Animation/sound disabled for "clean" design
- Focus on correctness over experience

**Consequences:**
- Kids tap repeatedly (double-submissions)
- Confusion about whether answer was right
- Reduced engagement

**Prevention Strategy:**
- Maintain immediate visual feedback for all inputs
- Sound effects for correct/incorrect (already implemented)
- Loading states visible but not blocking

**Relevant Phase:** Phase 2 (Implementation) - UX consideration.

---

### Pitfall 14: Text-Heavy Instructions

**What goes wrong:**
8-year-olds respond better to visuals and voice cues than reading text. Instructions that require reading comprehension fail.

**Why it happens:**
- Instructions written by adults for adults
- Localization easier with text than audio
- Faster to implement text than visual tutorials

**Consequences:**
- Kids skip instructions and get lost
- Parents have to read instructions to kids
- Confusion about what to do

**Prevention Strategy:**
- Keep node descriptions SHORT (current max ~50 chars is good)
- Use icons and visual cues over text
- Consider adding audio instructions for new game types

**Relevant Phase:** Phase 2 (Implementation) - UX/Content.

---

### Pitfall 15: Middle C Position Myopia (Bass Clef)

**What goes wrong:**
Staying too long in "Middle C position" for bass clef creates students who can only read notes near middle C, unable to read bass clef notes in their natural register.

**Why it happens:**
- Easier to teach bass from middle C (shared reference with treble)
- Methods optimized for "both hands at middle C" approach
- Avoiding ledger lines delays real bass reading

**Consequences:**
- Students can't read bass notes below F3
- Artificial limitation that must be unlearned later
- "Why are bass clef songs so hard?" syndrome

**Prevention Strategy:**
- Current bass Unit 1 uses C4, B3, A3 (near middle C) - acceptable
- Bass Unit 2+ MUST expand downward (G3, F3, E3, D3, C3)
- Include ledger line notes (B2, A2, G2) by Unit 3
- Don't avoid F clef's natural register

**Relevant Phase:** Phase 1 (Design) - Bass clef curriculum planning.

**Current State:**
The existing `bassUnit2` generator uses C4-F3 pool - this is correct direction but should be verified in redesign.

---

## Phase-Specific Warning Matrix

| Phase | Pitfall Numbers | Priority Actions |
|-------|-----------------|------------------|
| Phase 1 (Design) | 1, 2, 3, 6, 11, 12, 15 | Finalize node IDs, XP economy, and pedagogy BEFORE coding |
| Phase 2 (Implementation) | 1, 4, 5, 7, 8, 9, 10, 13, 14 | Migration mapping, exercise routing, database triggers |
| Phase 3 (Testing) | 1, 2, 4, 5, 6, 7 | Test with real user data snapshots and actual kids |
| Phase 4 (Rollout) | 3, 6 | Monitor analytics for difficulty cliffs and XP anomalies |

---

## Quick Reference Checklist

Before finalizing redesign:

- [ ] All new node IDs have entries in `LEGACY_TO_NEW_NODE_MAPPING`
- [ ] Users with advanced progress auto-unlock prerequisite nodes
- [ ] Total XP from new trail documented and compared to old
- [ ] All exercise types have routing in game components
- [ ] Database trigger handles new node ID prefixes
- [ ] No node adds more than 2 new notes vs. prerequisite
- [ ] No eighth notes before Unit 4
- [ ] Tempo changes < 15 BPM between nodes
- [ ] All `accessoryUnlock` IDs exist in database
- [ ] `order` values are sequential without gaps
- [ ] Migration key version bumped (v3)
- [ ] Node descriptions under 60 characters

---

## Sources

- [Music Education Approaches](https://milnepublishing.geneseo.edu/music-and-the-child/chapter/chapter-4/)
- [Gamification in Education](https://edtecharchives.org/journal/1269/15625)
- [UI/UX Design for Children](https://www.aufaitux.com/blog/ui-ux-designing-for-children/)
- [Piano Teaching Methods](https://volzpiano.com/methods-of-teaching-piano-a-comprehensive-guide-for-kids-and-parents/)
- [Note Reading Pedagogy](https://www.music-for-music-teachers.com/reading-piano-music.html)
- [Teaching Piano to Children](https://topmusic.co/6-mistakes-i-made-when-i-started-teaching-piano/)
- [Educational Apps Research](https://research.com/software/best-educational-apps-for-kids)
- [Database Migration Best Practices](https://medium.com/@laurentmn/%EF%B8%8F-your-database-migration-broke-production-again-heres-how-to-fix-that-forever-52242b27c12b)
- Internal codebase analysis: `progressMigration.js`, `skillTrail.js`, `skillProgressService.js`
