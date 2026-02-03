# Technology Stack: Trail Data Structure Patterns

**Project:** PianoApp v1.3 Trail System Redesign
**Researched:** 2026-02-03
**Scope:** Data structure patterns for skill progression nodes

## Executive Summary

This research addresses four specific questions for the trail data layer redesign:
1. **Defining skill progression nodes with consistent pedagogy** - Use explicit node definition objects with structured configs
2. **Managing three parallel learning paths** - Separate files per path with shared constants
3. **Enabling flexible prerequisite chains** - String-based ID references with runtime validation
4. **Supporting node type classification** - Enumerated types with metadata objects

**Recommendation:** Adopt the "explicit definition" pattern already emerging in redesigned treble units, extend it to bass and rhythm, eliminate code generation, and add build-time validation.

---

## Data Structure Patterns

### Pattern 1: Explicit Node Definitions (RECOMMENDED)

**What:** Each node is a complete, explicit object with all configuration inline.

**Example (from existing trebleUnit1Redesigned.js):**
```javascript
{
  id: 'treble_1_2',
  name: 'C and D',
  description: 'Add note D to your collection',
  category: CATEGORY,
  unit: UNIT_ID,
  unitName: UNIT_NAME,
  order: START_ORDER + 1,
  orderInUnit: 2,
  prerequisites: ['treble_1_1'],

  nodeType: NODE_TYPES.DISCOVERY,

  noteConfig: {
    notePool: ['C4', 'D4'],
    focusNotes: ['D4'],        // NEW note being introduced
    contextNotes: ['C4'],      // Previously learned notes
    clef: 'treble',
    ledgerLines: false,
    accidentals: false
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    allowedDurations: ['q'],
    patterns: ['quarter'],
    tempo: { min: 60, max: 70, default: 65 }
  },

  newContent: NEW_CONTENT_TYPES.NOTE,
  newContentDescription: 'Note D',

  exercises: [/* explicit exercise configs */],

  skills: ['C4', 'D4'],
  xpReward: 45,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

**Why recommended:**
- Each node is self-documenting and auditable
- Pedagogy decisions are visible (focusNotes vs contextNotes)
- No hidden logic from generators
- Easy to spot inconsistencies in code review
- Matches what Duolingo and professional educational games use

**When to use:** Always. This is the primary pattern.

### Pattern 2: Code-Generated Nodes (DO NOT USE)

**What:** Use functions like `generateUnit()` to programmatically create nodes.

**Example (existing nodeGenerator.js):**
```javascript
const bassUnit1 = generateUnit({
  category: NODE_CATEGORIES.BASS_CLEF,
  unitNumber: 1,
  baseNotePool: ['C4', 'B3', 'A3'],
  clef: 'bass',
  rhythmTiers: [1, 2, 3, 4],
});
```

**Why NOT recommended:**
- Hides pedagogy decisions inside generator logic
- Inconsistent node types (rhythm tiers != engagement node types)
- Difficult to override specific nodes
- Creates "auto-generated" feel rather than crafted curriculum
- The treble redesign explicitly moved away from this

**Exception:** Utility functions for exercise config generation within explicit nodes are acceptable.

### Pattern 3: Shared Constants with Enums (RECOMMENDED)

**What:** Central constants file with enumerated types and metadata.

**Current implementation (constants.js + nodeTypes.js):**
```javascript
// constants.js - Pure enums, no logic
export const NODE_CATEGORIES = {
  TREBLE_CLEF: 'treble_clef',
  BASS_CLEF: 'bass_clef',
  RHYTHM: 'rhythm',
  BOSS: 'boss'
};

export const EXERCISE_TYPES = {
  NOTE_RECOGNITION: 'note_recognition',
  SIGHT_READING: 'sight_reading',
  RHYTHM: 'rhythm',
  MEMORY_GAME: 'memory_game',
  BOSS_CHALLENGE: 'boss_challenge'
};

// nodeTypes.js - Node type classification with metadata
export const NODE_TYPES = {
  DISCOVERY: 'discovery',
  PRACTICE: 'practice',
  MIX_UP: 'mix_up',
  SPEED_ROUND: 'speed_round',
  REVIEW: 'review',
  CHALLENGE: 'challenge',
  MINI_BOSS: 'mini_boss',
  BOSS: 'boss'
};

export const NODE_TYPE_METADATA = {
  [NODE_TYPES.DISCOVERY]: {
    icon: 'magnifying-glass',
    color: 'blue',
    label: 'Learn',
    duration: '3-4 min',
    purpose: 'Introduce new notes',
    childThinks: 'Ooh, something NEW!'
  },
  // ... etc
};
```

**Why recommended:**
- Single source of truth for valid values
- Metadata collocated with enum
- Easy to validate at build time
- UI can derive display properties from metadata

---

## File Organization

### Recommended Structure

```
src/data/
  constants.js          # Pure enums (NODE_CATEGORIES, EXERCISE_TYPES)
  nodeTypes.js          # Node type enum + metadata

  units/
    treble/
      unit1.js          # First Steps (C, D, E)
      unit2.js          # Growing Range (F, G)
      unit3.js          # Full Octave (A, B, C5)
      index.js          # Combines & exports all treble nodes

    bass/
      unit1.js          # Middle C Position (C4, B3, A3)
      unit2.js          # Five Finger Low (G3, F3)
      unit3.js          # Full Octave (E3, D3, C3)
      index.js          # Combines & exports all bass nodes

    rhythm/
      unit1.js          # Basic beats (whole, half, quarter)
      unit2.js          # + Dotted half
      unit3.js          # + Eighth notes
      unit4.js          # + Dotted quarter
      unit5.js          # + Sixteenth notes
      index.js          # Combines & exports all rhythm nodes

  skillTrail.js         # Main entry point, combines all paths

  validation/
    nodeValidator.js    # Build-time validation functions
    validateAll.mjs     # npm script for CI validation
```

### File Responsibilities

| File | Responsibility | Imports | Exports |
|------|---------------|---------|---------|
| constants.js | Pure enums | Nothing | NODE_CATEGORIES, EXERCISE_TYPES |
| nodeTypes.js | Node type system | Nothing | NODE_TYPES, NODE_TYPE_METADATA, helper functions |
| units/{path}/unit{N}.js | One unit definition | constants, nodeTypes | Array of node objects |
| units/{path}/index.js | Combine units | unit files | TREBLE_NODES, BASS_NODES, etc. |
| skillTrail.js | Main API | unit indexes | SKILL_NODES, getter functions |
| nodeValidator.js | Validation | constants, nodeTypes | validateNode, validatePrerequisites, etc. |

### Why This Organization

1. **One file per unit:** Easy to find, easy to diff, easy to review pedagogy
2. **Path-specific index files:** Allows path-specific helper functions if needed
3. **Central skillTrail.js:** Single entry point for consumers (services, components)
4. **Separate validation:** Can run at build time without runtime overhead

### What NOT to do

- **Single giant file:** Don't put all 90+ nodes in one file
- **Generated content mixed with explicit:** Don't have some units generated, some explicit
- **Circular imports:** Don't import skillTrail.js from unit files
- **Runtime validation only:** Don't skip build-time validation

---

## Prerequisite Chain Pattern

### Recommended: String-based IDs with Build-time Validation

**Node definition:**
```javascript
{
  id: 'treble_2_2',
  prerequisites: ['treble_2_1'],  // String reference
  // ...
}
```

**Validation function (run at build time):**
```javascript
export function validatePrerequisites(allNodes) {
  const nodeIds = new Set(allNodes.map(n => n.id));
  const errors = [];

  for (const node of allNodes) {
    for (const prereq of node.prerequisites) {
      if (!nodeIds.has(prereq)) {
        errors.push(`Node ${node.id} has invalid prerequisite: ${prereq}`);
      }
    }
  }

  // Check for cycles
  const visited = new Set();
  const recursionStack = new Set();

  function hasCycle(nodeId) {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = allNodes.find(n => n.id === nodeId);
    if (node) {
      for (const prereq of node.prerequisites) {
        if (hasCycle(prereq)) {
          errors.push(`Cycle detected involving: ${nodeId}`);
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of allNodes) {
    hasCycle(node.id);
  }

  return errors;
}
```

**Why string-based:**
- Simple to understand
- Easy to serialize (database, JSON export)
- Allows cross-file references
- Avoids import order issues

**Why build-time validation:**
- Catches typos immediately
- Catches circular dependencies
- Catches orphaned nodes (no path to them)
- Zero runtime cost

### Alternative: Typed References (NOT RECOMMENDED)

```javascript
// This creates import complexity
import { treble_1_1 } from './treble/unit1';

export const treble_2_1 = {
  id: 'treble_2_1',
  prerequisites: [treble_1_1],  // Object reference
};
```

**Why not recommended:**
- Requires exporting individual nodes
- Creates complex import graphs
- Harder to validate
- No benefit over string + validation

---

## Node Type Classification Pattern

### Current Implementation (GOOD)

The existing `nodeTypes.js` is well-designed. Extend it, don't replace it.

```javascript
// Node type enum
export const NODE_TYPES = {
  DISCOVERY: 'discovery',
  PRACTICE: 'practice',
  MIX_UP: 'mix_up',
  SPEED_ROUND: 'speed_round',
  REVIEW: 'review',
  CHALLENGE: 'challenge',
  MINI_BOSS: 'mini_boss',
  BOSS: 'boss'
};

// Metadata for each type
export const NODE_TYPE_METADATA = {
  [NODE_TYPES.DISCOVERY]: {
    icon: 'magnifying-glass',
    color: 'blue',
    label: 'Learn',
    duration: '3-4 min',
    purpose: 'Introduce new notes',
    childThinks: 'Ooh, something NEW!'
  },
  // ...
};

// Helper functions
export function getNodeTypeStyle(nodeType) {
  return NODE_TYPE_METADATA[nodeType] || NODE_TYPE_METADATA[NODE_TYPES.PRACTICE];
}
```

### Pattern Extension for Rhythm Path

Rhythm nodes need additional metadata since they don't have `noteConfig`:

```javascript
// rhythmComplexity.js (new file or extend nodeTypes.js)
export const RHYTHM_COMPLEXITY = {
  SIMPLE: 'simple',       // Whole, half, quarter only
  MEDIUM: 'medium',       // + Dotted half
  VARIED: 'varied',       // + Eighth notes
  ADVANCED: 'advanced',   // + Dotted quarter
  EXPERT: 'expert'        // + Sixteenth notes
};

export const RHYTHM_COMPLEXITY_METADATA = {
  [RHYTHM_COMPLEXITY.SIMPLE]: {
    allowedDurations: ['w', 'h', 'q'],
    description: 'Whole, half, and quarter notes',
    minTempo: 60,
    maxTempo: 80
  },
  // ...
};
```

### Node Definition with Type Classification

```javascript
{
  id: 'rhythm_1_2',
  name: 'Quarter Notes',
  nodeType: NODE_TYPES.PRACTICE,  // From NODE_TYPES enum

  // For rhythm nodes: rhythmConfig instead of noteConfig
  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    focusRhythm: 'quarter',           // What's being introduced
    contextRhythms: ['whole', 'half'], // Already known
    allowedDurations: ['w', 'h', 'q'],
    tempo: { min: 60, max: 80, default: 70 }
  },

  // ...
}
```

---

## Validation Approach

### Build-time Validation Script

Create `scripts/validateTrail.mjs`:

```javascript
#!/usr/bin/env node
import { SKILL_NODES } from '../src/data/skillTrail.js';
import { NODE_TYPES } from '../src/data/nodeTypes.js';
import { NODE_CATEGORIES, EXERCISE_TYPES } from '../src/data/constants.js';

const errors = [];
const warnings = [];

// 1. Validate each node has required fields
function validateNodeStructure(node) {
  const required = ['id', 'name', 'category', 'prerequisites', 'exercises'];
  for (const field of required) {
    if (node[field] === undefined) {
      errors.push(`Node ${node.id || 'UNNAMED'}: missing required field '${field}'`);
    }
  }

  // Validate category
  if (!Object.values(NODE_CATEGORIES).includes(node.category)) {
    errors.push(`Node ${node.id}: invalid category '${node.category}'`);
  }

  // Validate nodeType if present
  if (node.nodeType && !Object.values(NODE_TYPES).includes(node.nodeType)) {
    errors.push(`Node ${node.id}: invalid nodeType '${node.nodeType}'`);
  }

  // Validate exercises
  for (const ex of node.exercises || []) {
    if (!Object.values(EXERCISE_TYPES).includes(ex.type)) {
      errors.push(`Node ${node.id}: invalid exercise type '${ex.type}'`);
    }
  }
}

// 2. Validate prerequisites exist and no cycles
function validatePrerequisites(nodes) {
  const nodeIds = new Set(nodes.map(n => n.id));

  for (const node of nodes) {
    for (const prereq of node.prerequisites || []) {
      if (!nodeIds.has(prereq)) {
        errors.push(`Node ${node.id}: prerequisite '${prereq}' does not exist`);
      }
    }
  }

  // Cycle detection
  const visited = new Set();
  const stack = new Set();

  function dfs(nodeId, path = []) {
    if (stack.has(nodeId)) {
      errors.push(`Cycle detected: ${[...path, nodeId].join(' -> ')}`);
      return;
    }
    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    stack.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      for (const prereq of node.prerequisites || []) {
        dfs(prereq, [...path, nodeId]);
      }
    }

    stack.delete(nodeId);
  }

  for (const node of nodes) {
    dfs(node.id);
  }
}

// 3. Validate pedagogy consistency
function validatePedagogy(nodes) {
  // Group by category
  const byCategory = {};
  for (const node of nodes) {
    if (!byCategory[node.category]) byCategory[node.category] = [];
    byCategory[node.category].push(node);
  }

  // Check treble and bass have similar structure
  const trebleCount = (byCategory['treble_clef'] || []).length;
  const bassCount = (byCategory['bass_clef'] || []).length;

  if (Math.abs(trebleCount - bassCount) > 5) {
    warnings.push(`Treble (${trebleCount}) and bass (${bassCount}) have very different node counts`);
  }

  // Check node types are distributed in each category
  for (const [category, catNodes] of Object.entries(byCategory)) {
    const types = new Set(catNodes.map(n => n.nodeType).filter(Boolean));
    if (types.size < 3 && catNodes.length > 5) {
      warnings.push(`Category '${category}' has limited node type variety (${types.size} types)`);
    }
  }
}

// 4. Check for duplicate IDs
function validateUniqueIds(nodes) {
  const seen = new Set();
  for (const node of nodes) {
    if (seen.has(node.id)) {
      errors.push(`Duplicate node ID: '${node.id}'`);
    }
    seen.add(node.id);
  }
}

// Run all validations
console.log(`Validating ${SKILL_NODES.length} nodes...\n`);

for (const node of SKILL_NODES) {
  validateNodeStructure(node);
}
validatePrerequisites(SKILL_NODES);
validatePedagogy(SKILL_NODES);
validateUniqueIds(SKILL_NODES);

// Report results
if (warnings.length > 0) {
  console.log('WARNINGS:');
  warnings.forEach(w => console.log(`  - ${w}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('ERRORS:');
  errors.forEach(e => console.log(`  - ${e}`));
  console.log('');
  process.exit(1);
} else {
  console.log('All validations passed!');
  process.exit(0);
}
```

### Add to package.json

```json
{
  "scripts": {
    "validate:trail": "node scripts/validateTrail.mjs"
  }
}
```

### Integration with CI/Build

Run `npm run validate:trail` in:
- Pre-commit hook (via husky)
- CI pipeline
- Build process

---

## Integration with Existing Node Types

The existing `nodeTypes.js` defines 8 node types with excellent metadata. Each unit should follow this pattern:

### Unit Structure Template (8 nodes per unit)

| Node # | Node Type | Purpose | Notes |
|--------|-----------|---------|-------|
| 1 | DISCOVERY | Introduce first new concept | Single new note or rhythm |
| 2 | DISCOVERY | Introduce second new concept | Builds on first |
| 3 | PRACTICE | Drill both new concepts | Sight reading focus |
| 4 | MIX_UP | Fun variation (Memory Game) | Engagement break |
| 5 | DISCOVERY (optional) | Third concept if needed | OR additional PRACTICE |
| 6 | PRACTICE | Consolidate all concepts | Longer exercises |
| 7 | SPEED_ROUND | Timed challenge | Builds fluency |
| 8 | MINI_BOSS | Unit checkpoint | All concepts, earns badge |

### Rhythm Path Exception

Rhythm units may have different structure since they focus on duration types rather than pitches:

| Node # | Node Type | Purpose | Notes |
|--------|-----------|---------|-------|
| 1 | DISCOVERY | New duration (e.g., eighth notes) | Audio + visual intro |
| 2 | PRACTICE | Count the new rhythm | Metronome exercises |
| 3 | MIX_UP | Rhythm matching game | Engagement break |
| 4 | PRACTICE | Mix new + known rhythms | Interleaving |
| 5 | CHALLENGE | Complex patterns | Higher difficulty |
| 6 | MINI_BOSS | Unit test | All rhythms learned |

---

## Recommendations Summary

### DO

1. **Use explicit node definitions** - Every node is a complete object
2. **Organize by path and unit** - `src/data/units/{path}/unit{N}.js`
3. **Use string-based prerequisites** - Simple, serializable, validatable
4. **Add build-time validation** - `npm run validate:trail` catches errors early
5. **Follow node type pattern per unit** - Consistent pedagogical journey
6. **Keep constants separate** - `constants.js` has no logic or imports

### DO NOT

1. **Generate nodes programmatically** - Hides pedagogy, creates inconsistency
2. **Put all nodes in one file** - Unmanageable, hard to review
3. **Skip validation** - Typos in prerequisites cause runtime errors
4. **Mix generated and explicit nodes** - Creates two systems
5. **Import skillTrail from unit files** - Creates circular dependencies

---

## Migration Path

### Step 1: Create bass unit files

Create `src/data/units/bass/unit1.js`, etc. using treble units as template.

### Step 2: Create rhythm unit files

Create `src/data/units/rhythm/unit1.js`, etc. following rhythm-specific template.

### Step 3: Update skillTrail.js

Import from new unit index files, remove LEGACY_NODES.

### Step 4: Add validation script

Create `scripts/validateTrail.mjs`, add to package.json and pre-commit hook.

### Step 5: Delete nodeGenerator.js

Remove generator after all units are explicit.

### Step 6: Test with existing services

Ensure skillProgressService.js works with new structure (it should - same API).

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Explicit definitions pattern | HIGH | Already proven in treble redesign |
| File organization | HIGH | Standard JS module patterns |
| Prerequisite validation | HIGH | Simple graph algorithms |
| Node type integration | HIGH | Existing nodeTypes.js is well-designed |
| Rhythm path structure | MEDIUM | May need iteration based on game requirements |

---

## Sources

- Existing codebase: `src/data/skillTrail.js`, `src/data/nodeTypes.js`
- Existing redesigned units: `src/data/units/trebleUnit1Redesigned.js`
- Existing generator (anti-pattern): `src/utils/nodeGenerator.js`
- Existing validation pattern: `scripts/patternVerifier.mjs`
