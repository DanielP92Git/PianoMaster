# Phase 9: Bass Clef Implementation - Research

**Researched:** 2026-02-04
**Domain:** Trail Node Design, VexFlow Bass Clef Notation, Music Education for Children
**Confidence:** HIGH

## Summary

Phase 9 implements 26 bass clef trail nodes following the proven treble pedagogy pattern established in Units 1-3. The existing codebase provides a complete template: node type system (Discovery, Practice, Mix-Up, Speed Round, Review, Challenge, Mini-Boss), VexFlow notation rendering with bass clef support, and game components that already handle both clefs via configuration.

The implementation is a **configuration and data task**, not a code refactoring task. All required infrastructure exists:
- Node type system with 8 types and psychological metadata
- VexFlow bass clef rendering (change `clef: 'treble'` to `clef: 'bass'`)
- Game components accept clef via config (NotesRecognitionGame, SightReadingGame, MemoryGame)
- Sequential exercise system for multi-exercise nodes
- Progress tracking with star calculation (60%/80%/95%)

The CONTEXT.md decisions lock in the note progression (C4→B3→A3→G3,F3→E3,D3,C3), clef-only units (no treble mixing), and flexible node distribution (6-8 nodes per unit with minimum 3 types). This research focuses on **how to structure the 26 nodes** across 3 units to maximize learning effectiveness for 8-year-olds.

**Primary recommendation:** Create three unit files (`bassUnit1Redesigned.js`, `bassUnit2Redesigned.js`, `bassUnit3Redesigned.js`) mirroring the treble unit structure with bass-specific note pools and cumulative practice. Use existing node types, rhythm configs, and exercise types without modification.

## Standard Stack

The bass clef implementation uses the existing stack without additions.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| VexFlow | v5 | Music notation rendering | Already renders bass clef via `clef: 'bass'`, no changes needed |
| React | 18 | UI components | Game components accept clef config via props |
| Supabase | Latest | Progress storage | `student_skill_progress` table stores any node_id |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| NODE_TYPES | Internal | Node variety classification | 8 types provide pedagogical variation |
| EXERCISE_TYPES | Internal | Exercise configurations | NOTE_RECOGNITION, SIGHT_READING, MEMORY_GAME work with bass |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Redesigned units | Legacy generator (`generateUnit`) | Generator exists but lacks pedagogical design (no Review nodes, fixed sequence) |
| New game components | Extend existing | Existing games accept `clef: 'bass'` - no duplication needed |
| Custom node types | 8 existing types | Current types cover all bass pedagogy needs |

**Installation:**
```bash
# No new packages required - all infrastructure exists
```

## Architecture Patterns

### Recommended Project Structure
```
src/data/units/
├── trebleUnit1Redesigned.js  # Template reference
├── trebleUnit2Redesigned.js  # Template reference
├── trebleUnit3Redesigned.js  # Template reference
├── bassUnit1Redesigned.js    # NEW: C4, B3, A3
├── bassUnit2Redesigned.js    # NEW: C4-F3 (five-finger)
└── bassUnit3Redesigned.js    # NEW: C4-C3 (full octave)
```

### Pattern 1: Node Type Distribution (Psychological Variety)

**What:** Each unit uses 5+ different node types to prevent monotony for 8-year-old learners.

**When to use:** Every unit. Mix types so no two consecutive nodes are the same.

**Example from Treble Unit 2:**
```javascript
// Source: trebleUnit2Redesigned.js lines 27-483
export const trebleUnit2Nodes = [
  { nodeType: NODE_TYPES.REVIEW },      // 1. Spaced repetition
  { nodeType: NODE_TYPES.DISCOVERY },   // 2. New note (F)
  { nodeType: NODE_TYPES.PRACTICE },    // 3. Apply F
  { nodeType: NODE_TYPES.DISCOVERY },   // 4. New note (G)
  { nodeType: NODE_TYPES.MIX_UP },      // 5. Memory game
  { nodeType: NODE_TYPES.PRACTICE },    // 6. Melodies
  { nodeType: NODE_TYPES.CHALLENGE },   // 7. Interleaving
  { nodeType: NODE_TYPES.MINI_BOSS }    // 8. Unit checkpoint
];
```

**Bass Unit 1 application:**
- Node 1: DISCOVERY (C4, B3)
- Node 2: PRACTICE (sight reading C4-B3)
- Node 3: DISCOVERY (add A3)
- Node 4: MIX_UP (memory game)
- Node 5: PRACTICE (three-note songs)
- Node 6: SPEED_ROUND (timed recognition)
- Node 7: MINI_BOSS (unit checkpoint)

**Critical rule:** Units 2 and 3 MUST start with REVIEW node (spaced repetition of previous unit).

### Pattern 2: Cumulative Note Pools (No Forgetting)

**What:** Each node includes ALL previously learned notes, never isolating new notes alone after discovery.

**When to use:** Every Practice, Challenge, and Boss node. Discovery nodes introduce 1-2 new notes but include context.

**Example from Treble Unit 1:**
```javascript
// Source: trebleUnit1Redesigned.js lines 86-141
// NODE 2: Introduces D4 but includes C4 as context
{
  id: 'treble_1_2',
  name: 'C and D',
  noteConfig: {
    notePool: ['C4', 'D4'],       // ALL learned notes
    focusNotes: ['D4'],           // What's NEW
    contextNotes: ['C4']          // What's KNOWN
  }
}

// NODE 6: Practice uses all three notes learned so far
{
  id: 'treble_1_6',
  name: 'Three Note Songs',
  noteConfig: {
    notePool: ['C4', 'D4', 'E4'], // ALL learned notes
    focusNotes: [],                // No new notes
    contextNotes: ['C4', 'D4', 'E4']
  }
}
```

**Bass Unit 2 application:**
```javascript
// Node 1 (Review): ['C4', 'B3', 'A3']  // All Unit 1 notes
// Node 2 (Discovery G3): ['C4', 'B3', 'A3', 'G3']  // Add G3
// Node 3 (Discovery F3): ['C4', 'B3', 'A3', 'G3', 'F3']  // Add F3
// Node 4 (Practice): ['C4', 'B3', 'A3', 'G3', 'F3']  // All 5 notes
// Boss: ['C4', 'B3', 'A3', 'G3', 'F3']  // Test full range
```

### Pattern 3: Rhythm as Reward (Quarters → Halves)

**What:** Discovery nodes use simple rhythms (quarters only). Practice nodes unlock half notes as a reward for mastering the new note.

**When to use:**
- Discovery nodes: `RHYTHM_COMPLEXITY.SIMPLE` (quarters only)
- Practice nodes: `RHYTHM_COMPLEXITY.MEDIUM` (quarters + halves)
- Boss nodes: `RHYTHM_COMPLEXITY.MEDIUM` (quarters + halves)

**Example from Treble Unit 1:**
```javascript
// Source: trebleUnit1Redesigned.js lines 55-62, 335-340
// Discovery node (learning E4): Simple rhythm
{
  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    allowedDurations: ['q'],       // Quarters only
    patterns: ['quarter'],
    tempo: { min: 60, max: 70, default: 65 }
  }
}

// Practice node: Reward with half notes
{
  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.MEDIUM,
    allowedDurations: ['q', 'h'],  // Quarters + halves
    patterns: ['quarter', 'half'],
    tempo: { min: 60, max: 75, default: 70 }
  }
}
```

**Why effective:** Cognitive load theory - learning pitch is hard enough. Add rhythm complexity only after pitch mastery.

### Pattern 4: Sequential Exercises (Multi-Exercise Nodes)

**What:** Boss nodes combine note recognition + sight reading to test multiple skills. Progress only counts when BOTH exercises complete.

**When to use:** Mini-Boss nodes (end of unit). Optional for Challenge nodes.

**Example from Treble Unit 1:**
```javascript
// Source: trebleUnit1Redesigned.js lines 456-478
{
  id: 'boss_treble_1',
  nodeType: NODE_TYPES.MINI_BOSS,
  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: {
        notePool: ['C4', 'D4', 'E4'],
        questionCount: 10,
        clef: 'treble'
      }
    },
    {
      type: EXERCISE_TYPES.SIGHT_READING,
      config: {
        notePool: ['C4', 'D4', 'E4'],
        measuresPerPattern: 2,
        clef: 'treble'
      }
    }
  ]
}
```

**VictoryScreen integration:**
- Shows "Exercise 1 of 2" progress
- "Next Exercise (1 left)" button between exercises
- Only awards stars and XP when ALL exercises complete
- Node stars = minimum stars across all exercises

### Pattern 5: Boss Prerequisites (3-Star Gating)

**What:** Boss nodes are category='boss' and require 3 stars to unlock next unit.

**When to use:** Last node of every unit.

**Example from Treble Unit 2:**
```javascript
// Source: trebleUnit2Redesigned.js lines 422-483
{
  id: 'boss_treble_2',
  name: 'Five Finger Master',
  category: 'boss',               // Not 'treble_clef' - separate category
  unit: 2,
  prerequisites: ['treble_2_7'],  // Previous node in sequence
  isBoss: true,
  xpReward: 100,                  // Higher XP than regular nodes (40-60)
  accessoryUnlock: 'five_finger_badge'
}
```

**Next unit linkage:**
```javascript
// Source: trebleUnit3Redesigned.js (Unit 3 first node)
{
  id: 'treble_3_1',
  name: 'Remember C-G',
  prerequisites: ['boss_treble_2']  // Requires Unit 2 boss completion
}
```

### Pattern 6: Note Introduction Pacing (One at a Time)

**What:** Introduce 1-2 notes per Discovery node. Never dump 3+ new notes at once.

**When to use:** Discovery nodes. Exception: First node of a unit can introduce 2 notes if they're simple (e.g., C4+B3).

**Example progression:**
```javascript
// Bass Unit 1
// Node 1: C4 + B3 (first two notes together)
// Node 3: Add A3 (now have C4, B3, A3)

// Bass Unit 2
// Node 2: Add G3 (now have C4, B3, A3, G3)
// Node 4: Add F3 (now have C4, B3, A3, G3, F3)

// Bass Unit 3
// Node 2: Add E3
// Node 4: Add D3
// Node 6: Add C3 (octave complete!)
```

**CONTEXT.md Decision Override:**
The user specified:
- Discovery 1: C4 + B3 together ✓
- Discovery 2: Add A3 ✓
- Discovery 3: Add G3 + F3 together ✓
- Discovery 4: Add E3, D3, C3 together ✗ **TOO MANY**

**Recommendation:** Split Discovery 4 into three separate Discovery nodes (E3, then D3, then C3).

### Anti-Patterns to Avoid

- **Isolating new notes:** Don't create nodes with only the new note (e.g., just A3). Always include context notes.
- **Fixed sequences:** Don't use the same node type pattern for every unit (e.g., always Discovery→Practice→Mix-Up). Vary the sequence.
- **Skipping Review:** Units 2+ MUST start with a Review node. This implements spaced repetition.
- **Early eighth notes:** CONTEXT.md decision - NO eighth notes in Units 1-3. Only quarters and halves.
- **Boss as standalone:** Boss nodes should have 2 exercises (recognition + sight reading) to test comprehensive mastery.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Note data structure | Custom bass note objects | Existing NOTE_TYPES, reuse treble pattern | VexFlow uses same format ('C4', 'B3', etc.) for all clefs |
| Bass clef rendering | New VexFlow component | Change `clef: 'bass'` in config | VexFlow handles bass automatically, including ledger lines |
| Bass-specific game logic | Fork NotesRecognitionGame | Pass `clef: 'bass'` in nodeConfig | Games are clef-agnostic - they read `noteConfig.clef` |
| Progress tracking | Separate bass progress table | Existing `student_skill_progress` | Table stores any node_id, no schema changes needed |
| Node type variety | Invent new types for bass | Use 8 existing NODE_TYPES | Discovery, Practice, Mix-Up, etc. work for any clef |
| XP calculation | Custom bass XP formula | Existing `xpReward` values (40-60 regular, 100 boss) | XP rewards are consistent across all clefs |

**Key insight:** Bass clef is a data transformation, not a code change. The existing trail system is **clef-agnostic by design**. All components accept clef via configuration rather than hardcoding treble assumptions.

## Common Pitfalls

### Pitfall 1: Creating Clef-Specific Game Components

**What goes wrong:** Developer creates `BassNotesRecognitionGame.jsx` as a separate component from `NotesRecognitionGame.jsx`.

**Why it happens:** Assumption that different clefs need different game logic.

**How to avoid:**
- Read existing game component code - they already accept `clef` prop
- Check `NotesRecognitionGame.jsx` line 288-310 - note pools are clef-agnostic
- VexFlow handles clef rendering via `config.clef`

**Warning signs:**
- Creating new files in `src/components/games/` for bass
- Duplicating game logic
- Modifying game components to add clef-specific code

**Correct approach:**
```javascript
// Node configuration in bassUnit1Redesigned.js
{
  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: {
        notePool: ['C4', 'B3', 'A3'],
        clef: 'bass',  // ← ONLY change needed
        questionCount: 10
      }
    }
  ]
}
```

### Pitfall 2: Forgetting Review Nodes

**What goes wrong:** Units 2 and 3 start with Discovery nodes instead of Review, causing forgetting curve to steepen.

**Why it happens:** Copying Unit 1 structure (which doesn't have Review because there's nothing to review yet).

**How to avoid:**
- Unit 1: No Review (nothing to review)
- Unit 2: MUST start with Review node reviewing Unit 1 notes
- Unit 3: MUST start with Review node reviewing Unit 2 notes

**Warning signs:**
```javascript
// WRONG - Unit 2 starting with Discovery
export const bassUnit2Nodes = [
  { id: 'bass_2_1', nodeType: NODE_TYPES.DISCOVERY, ... }
];

// CORRECT - Unit 2 starting with Review
export const bassUnit2Nodes = [
  {
    id: 'bass_2_1',
    nodeType: NODE_TYPES.REVIEW,
    isReview: true,
    reviewsUnits: [1],
    noteConfig: { notePool: ['C4', 'B3', 'A3'] }  // All Unit 1 notes
  }
];
```

**Psychological reason:** Spaced repetition is proven to combat forgetting. Review nodes implement the "expanding intervals" technique from Ebbinghaus's forgetting curve research.

### Pitfall 3: Non-Cumulative Note Pools

**What goes wrong:** A Practice node in Unit 3 only uses the two most recently learned notes instead of all 8 notes.

**Why it happens:** Trying to reduce difficulty by limiting note count.

**How to avoid:**
- Discovery nodes can focus on new notes + immediate context
- ALL other nodes (Practice, Challenge, Boss) use full note pool learned so far
- Check treble units - every Practice node includes all prior notes

**Warning signs:**
```javascript
// WRONG - Unit 3 Practice isolating just E3-D3
{
  id: 'bass_3_5',
  nodeType: NODE_TYPES.PRACTICE,
  noteConfig: {
    notePool: ['E3', 'D3']  // ✗ Missing C4, B3, A3, G3, F3
  }
}

// CORRECT - Include all learned notes
{
  id: 'bass_3_5',
  nodeType: NODE_TYPES.PRACTICE,
  noteConfig: {
    notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3']  // ✓ Cumulative
  }
}
```

**Cognitive reason:** Interleaving (mixing old + new content) is more effective than blocked practice (only practicing the newest item). Source: Bjork's "desirable difficulties" research.

### Pitfall 4: Incorrect Boss Category

**What goes wrong:** Boss node has `category: 'bass_clef'` instead of `category: 'boss'`.

**Why it happens:** Copying node structure without understanding boss nodes are a special category.

**How to avoid:**
- Boss nodes ALWAYS have `category: 'boss'`
- Boss nodes ALWAYS have `isBoss: true`
- Boss nodes belong to a unit via `unit: X` but display separately on trail

**Warning signs:**
```javascript
// WRONG - Boss in bass_clef category
{
  id: 'boss_bass_1',
  category: 'bass_clef',  // ✗ Wrong category
  isBoss: true
}

// CORRECT - Boss in boss category
{
  id: 'boss_bass_1',
  category: 'boss',  // ✓ Correct category
  unit: 1,           // Links to Bass Unit 1
  isBoss: true
}
```

**Technical reason:** The trail map filtering uses `node.category === 'boss'` to position boss nodes differently than regular category nodes.

### Pitfall 5: Missing Prerequisites Chain

**What goes wrong:** Node 5 has `prerequisites: ['bass_1_1']` instead of `prerequisites: ['bass_1_4']`, breaking the sequential unlock.

**Why it happens:** Copy-paste errors or misunderstanding that each node unlocks the NEXT node, not all future nodes.

**How to avoid:**
- Each node's prerequisite is the PREVIOUS node (order - 1)
- First node of Unit 1 has `prerequisites: []`
- First node of Unit 2+ has `prerequisites: ['boss_bass_X']` where X is previous unit

**Warning signs:**
```javascript
// WRONG - Skipping nodes in prerequisites
{
  id: 'bass_1_5',
  prerequisites: ['bass_1_2']  // ✗ Skips nodes 3 and 4
}

// CORRECT - Sequential prerequisites
{
  id: 'bass_1_5',
  prerequisites: ['bass_1_4']  // ✓ Previous node
}
```

**Technical reason:** `isNodeUnlocked()` function checks if ALL prerequisites are completed. Skipping nodes breaks the intended progression path.

## Code Examples

Verified patterns from codebase:

### Creating a Discovery Node (Introduces New Note)

```javascript
// Source: trebleUnit1Redesigned.js lines 86-141
{
  id: 'bass_1_2',  // Convention: {clef}_{unit}_{order}
  name: 'C and B',
  description: 'Learn your first two bass clef notes',
  category: 'bass_clef',
  unit: 1,
  unitName: 'Middle C Position',
  order: 51,  // After treble units (1-50)
  orderInUnit: 2,
  prerequisites: ['bass_1_1'],

  nodeType: NODE_TYPES.DISCOVERY,

  noteConfig: {
    notePool: ['C4', 'B3'],
    focusNotes: ['B3'],        // What's NEW
    contextNotes: ['C4'],      // What's KNOWN
    clef: 'bass',              // ← Critical config
    ledgerLines: false,
    accidentals: false
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    allowedDurations: ['q'],    // Quarters only for discovery
    patterns: ['quarter'],
    tempo: { min: 60, max: 70, default: 65 }
  },

  newContent: NEW_CONTENT_TYPES.NOTE,
  newContentDescription: 'Note B',

  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: {
        notePool: ['C4', 'B3'],
        questionCount: 8,
        clef: 'bass',
        timeLimit: null
      }
    }
  ],

  skills: ['C4', 'B3'],
  xpReward: 45,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Creating a Practice Node (Sight Reading)

```javascript
// Source: trebleUnit2Redesigned.js lines 138-193
{
  id: 'bass_2_3',
  name: 'Five Finger Songs',
  description: 'Practice reading all five bass notes',
  category: 'bass_clef',
  unit: 2,
  unitName: 'Five Finger Low',
  order: 60,
  orderInUnit: 3,
  prerequisites: ['bass_2_2'],

  nodeType: NODE_TYPES.PRACTICE,

  noteConfig: {
    notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],  // ALL learned notes
    focusNotes: [],
    contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3'],
    clef: 'bass',
    ledgerLines: false,
    accidentals: false
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.MEDIUM,  // Reward: Add halves
    allowedDurations: ['q', 'h'],
    patterns: ['quarter', 'half'],
    tempo: { min: 60, max: 75, default: 70 }
  },

  newContent: NEW_CONTENT_TYPES.NONE,
  newContentDescription: 'Five-finger practice',

  exercises: [
    {
      type: EXERCISE_TYPES.SIGHT_READING,
      config: {
        notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
        measuresPerPattern: 2,
        clef: 'bass',
        timeSignature: '4/4',
        rhythmPatterns: ['quarter', 'half'],
        tempo: 70
      }
    }
  ],

  skills: ['C4', 'B3', 'A3', 'G3', 'F3'],
  xpReward: 50,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Creating a Review Node (Spaced Repetition)

```javascript
// Source: trebleUnit2Redesigned.js lines 27-81
{
  id: 'bass_2_1',
  name: 'Remember Unit 1',
  description: 'Review what you learned in the first unit',
  category: 'bass_clef',
  unit: 2,
  unitName: 'Five Finger Low',
  order: 58,
  orderInUnit: 1,
  prerequisites: ['boss_bass_1'],  // Requires Unit 1 boss completion

  nodeType: NODE_TYPES.REVIEW,

  noteConfig: {
    notePool: ['C4', 'B3', 'A3'],  // All Unit 1 notes
    focusNotes: [],
    contextNotes: ['C4', 'B3', 'A3'],
    clef: 'bass',
    ledgerLines: false,
    accidentals: false
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.MEDIUM,
    allowedDurations: ['q', 'h'],
    patterns: ['quarter', 'half'],
    tempo: { min: 60, max: 75, default: 70 }
  },

  newContent: NEW_CONTENT_TYPES.NONE,
  newContentDescription: 'Spaced Repetition',

  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: {
        notePool: ['C4', 'B3', 'A3'],
        questionCount: 8,
        clef: 'bass',
        timeLimit: null
      }
    }
  ],

  skills: ['C4', 'B3', 'A3'],
  xpReward: 40,
  accessoryUnlock: null,
  isBoss: false,
  isReview: true,       // ← Mark as review node
  reviewsUnits: [1]     // ← Which units it reviews
}
```

### Creating a Mini-Boss Node (Unit Checkpoint)

```javascript
// Source: trebleUnit1Redesigned.js lines 422-486
{
  id: 'boss_bass_1',
  name: 'Bass Unit 1 Challenge',
  description: 'Complete your first bass clef unit!',
  category: 'boss',  // ← Boss category, not bass_clef
  unit: 1,
  unitName: 'Middle C Position',
  order: 57,
  orderInUnit: 7,
  prerequisites: ['bass_1_6'],

  nodeType: NODE_TYPES.MINI_BOSS,

  noteConfig: {
    notePool: ['C4', 'B3', 'A3'],
    focusNotes: [],
    contextNotes: ['C4', 'B3', 'A3'],
    clef: 'bass',
    ledgerLines: false,
    accidentals: false
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.MEDIUM,
    allowedDurations: ['q', 'h'],
    patterns: ['quarter', 'half'],
    tempo: { min: 60, max: 75, default: 70 }
  },

  newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
  newContentDescription: 'Unit Complete',

  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: {
        notePool: ['C4', 'B3', 'A3'],
        questionCount: 10,
        clef: 'bass',
        timeLimit: null
      }
    },
    {
      type: EXERCISE_TYPES.SIGHT_READING,
      config: {
        notePool: ['C4', 'B3', 'A3'],
        measuresPerPattern: 2,
        clef: 'bass',
        timeSignature: '4/4',
        rhythmPatterns: ['quarter', 'half'],
        tempo: 70
      }
    }
  ],

  skills: ['C4', 'B3', 'A3'],
  xpReward: 100,                // Higher XP for boss
  accessoryUnlock: 'bass_sprout_badge',
  isBoss: true,
  isReview: false,
  reviewsUnits: []
}
```

### Linking Units in expandedNodes.js

```javascript
// Source: expandedNodes.js lines 86-132
import bassUnit1Nodes from './units/bassUnit1Redesigned.js';
import bassUnit2Nodes from './units/bassUnit2Redesigned.js';
import bassUnit3Nodes from './units/bassUnit3Redesigned.js';

export const EXPANDED_NODES = [
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes,
  ...bassUnit1Nodes,   // NEW
  ...bassUnit2Nodes,   // NEW
  ...bassUnit3Nodes,   // NEW
  ...rhythmUnit1,
  ...rhythmUnit2
];

// Update prerequisites are already set in unit files
// Boss prerequisites link automatically:
// bassUnit2Nodes[0].prerequisites = ['boss_bass_1']
// bassUnit3Nodes[0].prerequisites = ['boss_bass_2']
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed 5-node sequence (Discovery→Practice→Mix-Up→Speed→Boss) | Flexible node distribution with minimum 3 types | Jan 2026 redesign | Psychological variety prevents monotony |
| Isolated note practice (only new notes) | Cumulative note pools (all learned notes) | Jan 2026 redesign | Interleaving improves retention |
| Random node ordering | Node type metadata with psychological purpose | Jan 2026 redesign | Intentional variety based on child cognition |
| Single exercise per node | Sequential exercise system | Jan 2025 | Boss nodes test multiple skills |
| No rhythm constraints | NO eighth notes in Units 1-3 | Jan 2026 pedagogy | Reduces cognitive load during pitch learning |
| Legacy generator `generateUnit()` | Hand-crafted unit files with pedagogy | Jan 2026 redesign | Each node designed for specific purpose |

**Deprecated/outdated:**
- `generateUnit()` function in `src/data/utils/nodeGenerator.js`: Still works but doesn't implement educational psychology principles (no Review nodes, no rhythm-as-reward, fixed sequence). Use only for placeholder content.
- LEGACY_NODES in `skillTrail.js`: Old simplified nodes kept for backward compatibility. New bass units should use redesigned pattern.

## Open Questions

1. **Bass Unit 1 node count: 7 or 8?**
   - What we know: CONTEXT.md says 6-8 nodes per unit, minimum 3 types
   - What's unclear: Treble Unit 1 has 8 nodes. Should Bass Unit 1 match exactly or have flexibility?
   - Recommendation: Use 7-8 nodes to mirror treble pattern. 7 nodes works if combining steps (e.g., Discovery nodes can introduce 2 notes if they're close).

2. **Discovery 3 grouping: G3+F3 together or separate?**
   - What we know: CONTEXT.md says "Discovery 3: Adds G3 + F3 (completes five-finger position)"
   - What's unclear: Treble introduces F4 and G4 in separate Discovery nodes (Unit 2 nodes 2 and 4)
   - Recommendation: Follow treble pattern - separate Discovery nodes for G3 and F3. Introduce G3 in one node, practice, then introduce F3. This is more consistent with "one new element per node" pedagogy.

3. **Discovery 4 split: How to distribute E3, D3, C3?**
   - What we know: CONTEXT.md says "Discovery 4: Adds E3, D3, C3" but this violates one-at-a-time principle
   - What's unclear: How many Discovery nodes needed? Which Practice nodes between them?
   - Recommendation: Three separate Discovery nodes with Practice/Mix-Up nodes interspersed:
     - Discovery (E3) → Practice → Discovery (D3) → Practice → Discovery (C3) → Practice → Boss
     - Total: 10 nodes for Unit 3 (within 6-10 range per CONTEXT.md)

4. **Speed Round placement: One per unit or optional?**
   - What we know: Treble Unit 1 has Speed Round (node 7). Unit 2 doesn't have Speed Round.
   - What's unclear: Is Speed Round required in every unit or just when thematically appropriate?
   - Recommendation: Use Speed Round in Units 1 and 3 (first and last). Skip in Unit 2 to provide variety. Speed Round tests automaticity, which is most important at unit start (retention check) and unit end (mastery check).

5. **Memory Game grid size: How many pairs per note count?**
   - What we know: Treble Unit 1 uses 2x4 grid (4 pairs) for 2 notes. Unit 2 uses 3x4 grid (6 pairs) for 5 notes.
   - What's unclear: Formula for grid size vs note count
   - Recommendation:
     - 2-3 notes: 2x4 grid (4 pairs = 8 cards)
     - 4-5 notes: 3x4 grid (6 pairs = 12 cards)
     - 6-8 notes: 4x4 grid (8 pairs = 16 cards)
     - Time limit scales: 90s for 8 cards, 120s for 12 cards, 150s for 16 cards

## Sources

### Primary (HIGH confidence)
- `src/data/units/trebleUnit1Redesigned.js` - Complete node structure template
- `src/data/units/trebleUnit2Redesigned.js` - Review node pattern, inter-unit prerequisites
- `src/data/units/trebleUnit3Redesigned.js` - Full octave completion pattern
- `src/data/nodeTypes.js` - 8 node types with psychological metadata
- `src/data/constants.js` - EXERCISE_TYPES definitions
- `docs/vexflow-notation/vexflow-guidelines.md` - Bass clef rendering (`clef: 'bass'`)
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` - Clef config handling
- `CLAUDE.md` - Sequential exercise system documentation
- `.planning/phases/09-bass-clef-implementation/09-CONTEXT.md` - User decisions

### Secondary (MEDIUM confidence)
- Educational psychology principles (spaced repetition, interleaving, cognitive load) - Standard pedagogy patterns implemented in treble units
- Note introduction pacing (one at a time) - Derived from treble unit analysis, consistent with beginner music education

### Tertiary (LOW confidence)
- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All infrastructure exists, verified in codebase
- Architecture: HIGH - Treble units provide complete template
- Node type patterns: HIGH - Documented in nodeTypes.js with examples
- Pedagogy principles: HIGH - Implemented in existing treble units
- Pitfalls: HIGH - Derived from code structure analysis

**Research date:** 2026-02-04
**Valid until:** 60 days (stable - trail system established, no rapid changes expected)
