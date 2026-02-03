# Architecture: Trail System Redesign Integration

**Project:** Trail System Redesign
**Researched:** 2026-02-03
**Focus:** Integration strategy for redesigned bass/rhythm units into existing codebase

## Executive Summary

The current trail system uses a dual-source architecture: manually redesigned treble units (Unit 1-3) combined with legacy-generated bass/rhythm nodes via `nodeGenerator.js`. The goal is to complete the transition to 100% manually designed nodes while maintaining backward compatibility with existing student progress data.

**Key insight:** The database stores progress by `node_id` (string), not by node definition. This means we can safely change node definitions as long as IDs remain stable. Progress data only needs migration if node IDs change.

## Current Architecture

### Data Flow

```
                    +-----------------------+
                    |   src/data/skillTrail.js   |
                    |   (UNITS, helper functions) |
                    +-----------------------+
                              |
                              | imports
                              v
                    +-----------------------+
                    |  src/data/expandedNodes.js |
                    |  (combines all node sources)|
                    +-----------------------+
                         /    |    \
                        /     |     \
                       v      v      v
            +--------+  +---------+  +----------+
            |Treble  |  |Bass     |  |Rhythm    |
            |Units   |  |Units    |  |Units     |
            |1-3     |  |1-2      |  |1-2       |
            |(manual)|  |(legacy) |  |(legacy)  |
            +--------+  +---------+  +----------+
                            |            |
                            v            v
                    +-----------------------+
                    | src/utils/nodeGenerator.js |
                    |   (generateUnit,           |
                    |    generateRhythmUnit)     |
                    +-----------------------+
```

### File Responsibilities

| File | Current Role | After Redesign |
|------|--------------|----------------|
| `src/data/skillTrail.js` | Exports UNITS, SKILL_NODES, helper functions + LEGACY_NODES | No change to interface, LEGACY_NODES becomes empty |
| `src/data/expandedNodes.js` | Combines treble + legacy bass/rhythm | Combines all manual units, no legacy imports |
| `src/data/units/trebleUnit*.js` | Manually designed treble nodes | No change |
| `src/data/units/bassUnit*.js` | Does not exist yet | NEW: Manual bass node definitions |
| `src/data/units/rhythmUnit*.js` | Does not exist yet | NEW: Manual rhythm node definitions |
| `src/utils/nodeGenerator.js` | Generates bass/rhythm nodes | KEEP but unused by main paths |
| `src/data/constants.js` | NODE_CATEGORIES, EXERCISE_TYPES | No change |
| `src/data/nodeTypes.js` | NODE_TYPES, RHYTHM_COMPLEXITY | No change |

## Recommended Integration Strategy

### Strategy: Parallel Creation with Clean Cutover

Instead of incremental migration, create all new unit files in parallel, then do a single clean cutover in `expandedNodes.js`.

**Rationale:**
1. No risk of breaking existing functionality during development
2. Can test new units in isolation before integration
3. Single atomic commit for the cutover
4. Easy rollback if issues discovered

### Phase 1: Create New Unit Files (No Integration)

Create these files following the existing treble unit structure:

```
src/data/units/
  bassUnit1Redesigned.js     # C4, B3, A3 (mirrors treble Unit 1 pedagogy)
  bassUnit2Redesigned.js     # Add G3, F3 (five-finger position)
  bassUnit3Redesigned.js     # Complete octave down to C3
  rhythmUnit1Redesigned.js   # Steady beat (quarters only)
  rhythmUnit2Redesigned.js   # Add half notes
  rhythmUnit3Redesigned.js   # Add whole notes + rests
  rhythmUnit4Redesigned.js   # Add eighth notes (unlocked after Unit 3)
  rhythmUnit5Redesigned.js   # Mixed/advanced rhythms
```

### Phase 2: Update expandedNodes.js (Clean Cutover)

Replace legacy imports with new manual imports:

```javascript
// BEFORE (current)
import trebleUnit1Nodes from './units/trebleUnit1Redesigned.js';
import trebleUnit2Nodes from './units/trebleUnit2Redesigned.js';
import trebleUnit3Nodes from './units/trebleUnit3Redesigned.js';
import { generateUnit, generateRhythmUnit } from '../utils/nodeGenerator.js';
// ... legacy generation code

// AFTER (redesigned)
import trebleUnit1Nodes from './units/trebleUnit1Redesigned.js';
import trebleUnit2Nodes from './units/trebleUnit2Redesigned.js';
import trebleUnit3Nodes from './units/trebleUnit3Redesigned.js';
import bassUnit1Nodes from './units/bassUnit1Redesigned.js';
import bassUnit2Nodes from './units/bassUnit2Redesigned.js';
import bassUnit3Nodes from './units/bassUnit3Redesigned.js';
import rhythmUnit1Nodes from './units/rhythmUnit1Redesigned.js';
import rhythmUnit2Nodes from './units/rhythmUnit2Redesigned.js';
import rhythmUnit3Nodes from './units/rhythmUnit3Redesigned.js';
import rhythmUnit4Nodes from './units/rhythmUnit4Redesigned.js';
import rhythmUnit5Nodes from './units/rhythmUnit5Redesigned.js';

export const EXPANDED_NODES = [
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes,
  ...bassUnit1Nodes,
  ...bassUnit2Nodes,
  ...bassUnit3Nodes,
  ...rhythmUnit1Nodes,
  ...rhythmUnit2Nodes,
  ...rhythmUnit3Nodes,
  ...rhythmUnit4Nodes,
  ...rhythmUnit5Nodes
];
```

### Phase 3: Clean Up Legacy Code

After cutover is verified working:

1. **Remove from skillTrail.js:** Empty the `LEGACY_NODES` array
2. **Keep nodeGenerator.js:** May be useful for future testing/prototyping
3. **Remove legacy unit generation:** Delete generateUnit/generateRhythmUnit calls from expandedNodes.js

## File Changes Summary

### Files to CREATE

| File | Purpose | Node Count (estimated) |
|------|---------|------------------------|
| `src/data/units/bassUnit1Redesigned.js` | Bass Unit 1: Middle C Position | 8 nodes |
| `src/data/units/bassUnit2Redesigned.js` | Bass Unit 2: Five Finger Low | 8 nodes |
| `src/data/units/bassUnit3Redesigned.js` | Bass Unit 3: Full Octave Down | 10 nodes |
| `src/data/units/rhythmUnit1Redesigned.js` | Rhythm Unit 1: Steady Beat | 6 nodes |
| `src/data/units/rhythmUnit2Redesigned.js` | Rhythm Unit 2: Half Notes | 6 nodes |
| `src/data/units/rhythmUnit3Redesigned.js` | Rhythm Unit 3: Whole Notes & Rests | 6 nodes |
| `src/data/units/rhythmUnit4Redesigned.js` | Rhythm Unit 4: Eighth Notes | 6 nodes |
| `src/data/units/rhythmUnit5Redesigned.js` | Rhythm Unit 5: Syncopation & Mixed | 8 nodes |

### Files to MODIFY

| File | Changes |
|------|---------|
| `src/data/expandedNodes.js` | Replace legacy generation with manual imports |
| `src/data/skillTrail.js` | Empty LEGACY_NODES array, update UNITS metadata for new units |

### Files to KEEP (no changes)

| File | Reason |
|------|--------|
| `src/utils/nodeGenerator.js` | Keep for potential future use, no active imports |
| `src/data/constants.js` | Shared constants, no changes needed |
| `src/data/nodeTypes.js` | Node types system, no changes needed |
| `src/services/skillProgressService.js` | Progress service works with any node_id |
| `src/components/trail/*` | Components work with node objects generically |

### Files to potentially DELETE (Phase 3)

| File | Condition |
|------|-----------|
| `src/utils/nodeGenerator.js` | Only if confirmed never needed again |

## Database Considerations

### No Migration Required IF:

Node IDs follow this pattern matching existing legacy IDs:
- Legacy bass IDs: `bass_1_1`, `bass_1_2`, ... `boss_bass_1`, etc.
- Legacy rhythm IDs: `rhythm_1_1`, `rhythm_1_2`, ... `boss_rhythm_1`, etc.

**The current legacy generator uses this exact pattern**, so new manual files should maintain ID consistency:

```javascript
// Bass Unit 1 IDs (must match legacy)
'bass_1_1', 'bass_1_2', 'bass_1_3', 'bass_1_4', 'bass_1_5', 'boss_bass_1'

// Rhythm Unit 1 IDs (must match legacy)
'rhythm_1_1', 'rhythm_1_2', 'rhythm_1_3', 'boss_rhythm_1'
```

### Migration Required IF:

1. **Node IDs change:** Would need to update `student_skill_progress.node_id`
2. **Exercise count changes:** May affect `exercise_progress` JSONB field

### Recommended Approach: ID Preservation

Design new node files with **exact ID matches** to legacy nodes:

```javascript
// bassUnit1Redesigned.js
export const bassUnit1Nodes = [
  { id: 'bass_1_1', ... },  // EXACT match to legacy
  { id: 'bass_1_2', ... },
  // ...
  { id: 'boss_bass_1', ... }
];
```

### Exercise Progress Consideration

Legacy nodes have 2 exercises per node. If redesigned nodes have different exercise counts:

| Scenario | Impact | Solution |
|----------|--------|----------|
| Same exercise count | No impact | None needed |
| Fewer exercises | Progress shows "extra" | Clear exercise_progress for affected nodes |
| More exercises | Missing exercise slots | Progress auto-fills on completion |

**Recommendation:** Match exercise counts where possible. If changing, document which nodes are affected.

## Component Integration Points

### TrailMap.jsx (lines 460-463)

```javascript
const trebleNodes = getNodesByCategory(NODE_CATEGORIES.TREBLE_CLEF);
const bassNodes = getNodesByCategory(NODE_CATEGORIES.BASS_CLEF);
const rhythmNodes = getNodesByCategory(NODE_CATEGORIES.RHYTHM);
const bossNodes = getBossNodes();
```

**No changes needed.** These functions work with whatever nodes are in SKILL_NODES.

### TrailNodeModal.jsx (lines 106-127)

```javascript
switch (exercise.type) {
  case 'note_recognition':
    navigate('/notes-master-mode/notes-recognition-game', { state: navState });
    break;
  case 'sight_reading':
    navigate('/notes-master-mode/sight-reading-game', { state: navState });
    break;
  case 'memory_game':
    navigate('/notes-master-mode/memory-game', { state: navState });
    break;
  case 'rhythm':
    navigate('/rhythm-mode/metronome-trainer', { state: navState });
    break;
  // ...
}
```

**No changes needed.** Exercise types are already defined in constants.js and game components handle them.

### Game Components

All game components accept trail state via `location.state`:

- `NotesRecognitionGame.jsx` - Handles `notePool`, `clef`, `questionCount`
- `SightReadingGame.jsx` - Handles `notePool`, `clef`, `rhythmPatterns`, `tempo`
- `MetronomeTrainer.jsx` - Handles `rhythmPatterns`, `tempo`, `measuresPerPattern`
- `MemoryGame.jsx` - Handles `notePool`, `clef`, `gridSize`

**No changes needed** as long as new node configs use the same property names.

### skillProgressService.js

Service functions work with generic node_id strings:

```javascript
export const updateNodeProgress = async (studentId, nodeId, stars, score, options = {}) => { ... }
export const updateExerciseProgress = async (studentId, nodeId, exerciseIndex, ...) => { ... }
```

**No changes needed.** Service layer is node-agnostic.

## Node ID Registry (Critical)

To ensure no ID conflicts, here is the complete ID registry:

### Treble Clef (existing - DO NOT CHANGE)

| Unit | Node IDs |
|------|----------|
| Unit 1 | `treble_1_1` through `treble_1_7`, `boss_treble_1` |
| Unit 2 | `treble_2_1` through `treble_2_7`, `boss_treble_2` |
| Unit 3 | `treble_3_1` through `treble_3_9`, `boss_treble_3` |

### Bass Clef (to create)

| Unit | Node IDs | Notes |
|------|----------|-------|
| Unit 1 | `bass_1_1` through `bass_1_7`, `boss_bass_1` | Match legacy generator output |
| Unit 2 | `bass_2_1` through `bass_2_7`, `boss_bass_2` | Match legacy generator output |
| Unit 3 | `bass_3_1` through `bass_3_9`, `boss_bass_3` | New - no legacy equivalent |

### Rhythm (to create)

| Unit | Node IDs | Notes |
|------|----------|-------|
| Unit 1 | `rhythm_1_1` through `rhythm_1_5`, `boss_rhythm_1` | Match legacy generator output |
| Unit 2 | `rhythm_2_1` through `rhythm_2_5`, `boss_rhythm_2` | Match legacy generator output |
| Unit 3 | `rhythm_3_1` through `rhythm_3_5`, `boss_rhythm_3` | New - no legacy equivalent |
| Unit 4 | `rhythm_4_1` through `rhythm_4_5`, `boss_rhythm_4` | New - no legacy equivalent |
| Unit 5 | `rhythm_5_1` through `rhythm_5_7`, `boss_rhythm_5` | New - no legacy equivalent |

### Legacy Nodes to Deprecate

These IDs exist in LEGACY_NODES array in skillTrail.js and should NOT be used by new nodes:

```
treble_c_d, treble_c_e, treble_five_finger, treble_c_a, treble_almost_there, treble_full_octave
bass_c_b, bass_c_a, bass_c_g, bass_c_f, bass_almost_there, bass_master
rhythm_intro, rhythm_quarter_notes, rhythm_half_notes, rhythm_eighth_notes, rhythm_mixed
boss_treble_warrior, boss_bass_master, boss_rhythm_master
```

**These legacy IDs remain available for potential backward compatibility** but should not be actively used.

## Migration Sequence (Safe Order)

### Step 1: Create Files (Safe)
- Create all new unit files in `src/data/units/`
- No imports yet - files exist but are not used
- Can test in isolation

### Step 2: Update UNITS in skillTrail.js (Safe)
- Add new unit metadata if needed (BASS_4, BASS_5, RHYTHM_3, etc.)
- Does not affect SKILL_NODES until expandedNodes.js changes

### Step 3: Update expandedNodes.js (Cutover)
- Single commit that:
  1. Adds imports for new manual unit files
  2. Removes legacy generation calls
  3. Updates EXPANDED_NODES array

### Step 4: Empty LEGACY_NODES (Cleanup)
- Remove contents of LEGACY_NODES array in skillTrail.js
- Verify no references remain

### Step 5: Verify (Testing)
- Run existing tests
- Test trail progression manually
- Verify student progress loads correctly

## Risk Areas and Mitigation

### Risk 1: Node ID Mismatch

**Impact:** Students lose progress on mismatched nodes
**Mitigation:** Use exact ID matching to legacy generator output
**Detection:** Compare generated IDs with new file IDs before cutover

### Risk 2: Exercise Count Mismatch

**Impact:** exercise_progress JSONB has wrong number of entries
**Mitigation:** Match exercise counts or document differences
**Detection:** Test with existing progress data

### Risk 3: Prerequisite Chain Breaks

**Impact:** Nodes become unlockable
**Mitigation:** Verify prerequisite IDs exist after cutover
**Detection:** Test unlock logic with unit tests

### Risk 4: Order Conflicts

**Impact:** Nodes display in wrong order in TrailMap
**Mitigation:** Review `order` values across all units
**Detection:** Visual inspection after cutover

## Testing Checklist

Before cutover:
- [ ] All new unit files created with correct structure
- [ ] Node IDs match legacy where applicable
- [ ] Prerequisites reference valid node IDs
- [ ] Order values are sequential and non-conflicting
- [ ] UNITS metadata includes all new units

After cutover:
- [ ] TrailMap renders all categories correctly
- [ ] Node unlock logic works (prerequisite chains)
- [ ] Clicking nodes navigates to correct games
- [ ] Existing student progress loads correctly
- [ ] New students can start fresh
- [ ] Boss nodes appear in Boss section

## Appendix: Unit File Template

Reference template for creating new unit files:

```javascript
/**
 * [Category] Unit [N]: "[Name]" (Redesigned)
 *
 * [Description of pedagogical approach]
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = [N];
const UNIT_NAME = '[Name]';
const CATEGORY = '[category]';  // 'treble_clef', 'bass_clef', or 'rhythm'
const START_ORDER = [calculated based on previous units];

export const [category]Unit[N]Nodes = [
  {
    id: '[category]_[N]_1',  // MUST match legacy if replacing existing
    name: '[Node Name]',
    description: '[Description]',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['[previous_boss_id]'],  // Empty for Unit 1 start nodes

    nodeType: NODE_TYPES.[TYPE],

    noteConfig: {
      notePool: ['...'],
      focusNotes: ['...'],
      contextNotes: ['...'],
      clef: '[clef]',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.[LEVEL],
      allowedDurations: ['q', 'h'],
      patterns: ['quarter', 'half'],
      tempo: { min: 60, max: 75, default: 70 }
    },

    newContent: NEW_CONTENT_TYPES.[TYPE],
    newContentDescription: '[What is new]',

    exercises: [
      {
        type: EXERCISE_TYPES.[TYPE],
        config: { ... }
      }
    ],

    skills: ['...'],
    xpReward: [value],
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },
  // ... more nodes
];

export default [category]Unit[N]Nodes;
```

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| File structure | HIGH | Based on existing codebase analysis |
| Node ID strategy | HIGH | Verified against legacy generator |
| Database impact | HIGH | Schema uses string IDs, no structure changes |
| Component compatibility | HIGH | Generic interfaces verified |
| Migration sequence | MEDIUM | Depends on careful execution |
| Exercise count impact | MEDIUM | May need case-by-case analysis |

## Summary

The integration strategy is straightforward:
1. Create new unit files following established patterns
2. Maintain node ID compatibility with legacy generator
3. Single clean cutover in expandedNodes.js
4. No database migration needed if IDs match
5. Cleanup legacy code after verification

Total estimated work:
- 8 new unit files to create (11 total units in final system)
- 1 file to modify significantly (expandedNodes.js)
- 1 file to clean up (skillTrail.js LEGACY_NODES)
- 58+ new nodes total (estimated)
