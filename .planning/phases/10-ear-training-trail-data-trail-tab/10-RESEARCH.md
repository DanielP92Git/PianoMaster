# Phase 10: Ear Training Trail Data + Trail Tab - Research

**Researched:** 2026-03-29
**Domain:** Trail data authoring, subscription gating, Supabase migration
**Confidence:** HIGH

## Summary

Phase 10 is a data-authoring phase. All game components (NoteComparisonGame, IntervalGame), all UI rendering (TrailMap, TrailNodeModal, ZigzagTrailLayout), and all visual identity (cyan/teal palette, `TRAIL_TAB_CONFIGS` entry for `ear_training`) were built in prior phases. The Ear Training tab already appears in the tab bar — it just has no nodes yet.

The executor's job is to author 13 trail nodes across 2 unit files, register them in `expandedNodes.js`, add the free-tier gate to `subscriptionConfig.js`, and write a Supabase migration that updates the `is_free_node()` Postgres function to cover the 6 new free ear training nodes.

Two critical findings for the planner: (1) `NoteComparisonGame` ignores `nodeConfig` entirely for gameplay generation — it uses hardcoded `COMPARISON_TIERS` (wide → medium → close) for all sessions. The config fields (`intervalRange`, `notePool`, etc.) are stored as metadata only. (2) `is_free_node()` does not yet exist as a Postgres function — the existing RLS layer uses `isFreeNode()` from JS only. The migration must CREATE this function from scratch (not ALTER an existing one).

**Primary recommendation:** Author `earTrainingUnit1.js` and `earTrainingUnit2.js` following the `trebleUnit1Redesigned.js` shape exactly, register in `expandedNodes.js`, update `subscriptionConfig.js`, write migration, and confirm `npm run build` passes validateTrail.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Node Progression**
- D-01: Path starts with pitch comparison (higher/lower) before introducing intervals (step/skip/leap). Direction before distance.
- D-02: Note range starts in C4 neighborhood (C3-C5), expanding outward to full sampler range (C3-B5) in later nodes.
- D-03: Pitch comparison difficulty increases by shrinking intervals: early nodes use wide intervals (octave+/7th/6th), middle nodes use 4ths/5ths, later nodes use 2nds/3rds. Each NODE locks a difficulty tier (not tiered within a session).
- D-04: Interval exercises build incrementally: first interval node has steps only, next adds skips, later nodes include all three (step/skip/leap).

**Unit Structure**
- D-05: Unit 1: "Sound Direction" — 6 pitch comparison nodes. Unit 2: "Interval Explorer" — 7 interval nodes (including some mixed review). 13 nodes total.
- D-06: Split by game type, not difficulty tier. Clean conceptual boundary matching the progression sequence.

**Free Tier Boundary**
- D-07: All of Unit 1 is free (6 nodes). Unit 2 is premium.
- D-08: All boss nodes paywalled — added to `PAYWALL_BOSS_NODE_IDS`.
- D-09: New Supabase migration updates `is_free_node()` to include the new ear training free node IDs.

**Boss Node Design**
- D-10: 2 boss nodes — one per unit. IDs: `boss_ear_1` (end of Unit 1), `boss_ear_2` (end of Unit 2).
- D-11: Multi-exercise boss sessions combining unit skills. Unit 1 boss: 2 pitch comparison exercises (wide + narrow). Unit 2 boss: 1 interval exercise + 1 mixed pitch+interval exercise.

### Claude's Discretion

- Exact node IDs and naming (following `ear_{unit}_{order}` convention)
- Node descriptions and display names
- Specific note ranges per node (within the C3→B5 expansion direction)
- Interval tier boundaries per node (which semitone distances qualify as "wide" vs "medium" vs "narrow")
- XP reward values per node (following existing 40-50 for regular, 100 for boss pattern)
- Exercise config parameters (questionCount, ascending ratio overrides, note pools)
- Prerequisite chain design (linear within unit, boss requires last non-boss node)
- accessoryUnlock assignments for boss nodes
- Unit header descriptions and ordering metadata

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EAR-01 | 12-15 ear training nodes across 2 units with progressive difficulty | D-05 locks 13 nodes (6+7); node shape, order numbering, and prerequisite chain patterns documented below |
| EAR-02 | Ear Training tab visible on TrailMap with distinct color palette | VERIFIED: `TRAIL_TAB_CONFIGS[3]` already contains the `ear_training` entry with cyan palette; zero UI code changes needed |
| EAR-03 | Nodes use PITCH_COMPARISON and INTERVAL_ID exercise types | VERIFIED: Both constants registered in `EXERCISE_TYPES`; `TrailNodeModal` routes them to correct game paths; `validateTrail.mjs` validates them |
| EAR-04 | Free tier ear training nodes defined in subscriptionConfig.js and synced with Postgres is_free_node() | Pattern: add `FREE_EAR_TRAINING_NODE_IDS` array (6 IDs) and two `boss_ear_*` entries to `PAYWALL_BOSS_NODE_IDS`; migration must CREATE `is_free_node()` function (doesn't exist yet) |
| EAR-05 | Boss node(s) combining ear training skills | D-10/D-11: `boss_ear_1` (2 pitch comparison exercises), `boss_ear_2` (1 interval + 1 mixed); boss shape verified from `bassUnit1Redesigned.js` |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | Component rendering | Project standard |
| Vite 6 | 6.x | Build + validation hooks | prebuild runs validateTrail.mjs |
| Supabase JS | project version | Database migration delivery | Project standard |
| Tailwind CSS 3 | 3.x | Styling (no new classes needed) | Project standard |

**No new npm packages.** The UI-SPEC explicitly states: "This phase adds no new npm packages."

### Existing Utilities Used

| Utility | File | Role |
|---------|------|------|
| NODE_TYPES | `src/data/nodeTypes.js` | node type constants (DISCOVERY, PRACTICE, etc.) |
| RHYTHM_COMPLEXITY | `src/data/nodeTypes.js` | rhythm config constants |
| NEW_CONTENT_TYPES | `src/data/nodeTypes.js` | UI hint constants |
| EXERCISE_TYPES | `src/data/constants.js` | PITCH_COMPARISON, INTERVAL_ID |
| FREE_TREBLE_NODE_IDS | `src/config/subscriptionConfig.js` | Pattern to follow for ear training |
| PAYWALL_BOSS_NODE_IDS | `src/config/subscriptionConfig.js` | Add boss_ear_1, boss_ear_2 here |
| validateTrail.mjs | `scripts/validateTrail.mjs` | Auto-runs on `npm run build` |

---

## Architecture Patterns

### Recommended File Structure

The planner creates exactly these files:

```
src/data/units/
├── earTrainingUnit1.js          # NEW: Unit 1 "Sound Direction" (6 nodes + boss_ear_1)
└── earTrainingUnit2.js          # NEW: Unit 2 "Interval Explorer" (6 nodes + boss_ear_2)

src/data/
└── expandedNodes.js             # EDIT: import + spread new ear training unit arrays

src/config/
└── subscriptionConfig.js        # EDIT: add FREE_EAR_TRAINING_NODE_IDS, update PAYWALL_BOSS_NODE_IDS

supabase/migrations/
└── 20260329000001_add_ear_training_free_nodes.sql  # NEW: CREATE is_free_node() Postgres function
```

No other files change. TrailMap, TrailNodeModal, nodeTypeStyles, constants.js, UNITS in skillTrail.js — all untouched.

### Pattern 1: Unit File Structure

```javascript
// Source: src/data/units/trebleUnit1Redesigned.js (verified)
import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 1;
const UNIT_NAME = 'Sound Direction';
const CATEGORY = 'ear_training';
const START_ORDER = 156;  // rhythmUnit8 ends at 155 (149 + 6 nodes)

export const earTrainingUnit1Nodes = [
  {
    id: 'ear_1_1',
    name: 'Hear the Jump',
    description: 'Two notes — which is higher?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,          // global order (156)
    orderInUnit: 1,
    prerequisites: [],           // first node — no prerequisites

    nodeType: NODE_TYPES.DISCOVERY,

    exercises: [
      {
        type: EXERCISE_TYPES.PITCH_COMPARISON,
        config: {
          notePool: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
          questionCount: 10,
          intervalRange: { min: 6, max: 12 }   // wide intervals (metadata only)
        }
      }
    ],

    skills: ['pitch_comparison_wide'],
    xpReward: 40,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },
  // ... nodes 2-6 ...
  {
    id: 'boss_ear_1',
    name: 'Sound Director',
    description: 'Boss: wide and close, both!',
    unlockHint: 'Complete all 6 Sound Direction lessons to unlock!',
    category: 'boss',            // boss nodes have category 'boss'
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['ear_1_6'],  // last non-boss node

    nodeType: NODE_TYPES.MINI_BOSS,

    exercises: [
      {
        type: EXERCISE_TYPES.PITCH_COMPARISON,
        config: {
          notePool: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'],
          questionCount: 10,
          intervalRange: { min: 6, max: 12 }   // exercise 1: wide
        }
      },
      {
        type: EXERCISE_TYPES.PITCH_COMPARISON,
        config: {
          notePool: ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3'],
          questionCount: 10,
          intervalRange: { min: 1, max: 3 }    // exercise 2: narrow
        }
      }
    ],

    skills: ['pitch_comparison_all'],
    xpReward: 100,
    accessoryUnlock: 'ear_sprout_badge',
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default earTrainingUnit1Nodes;
```

### Pattern 2: expandedNodes.js Integration

```javascript
// Source: src/data/expandedNodes.js (verified — follow existing import pattern)

// Add at end of existing imports:
import earTrainingUnit1Nodes from './units/earTrainingUnit1.js';
import earTrainingUnit2Nodes from './units/earTrainingUnit2.js';

// Add to EXPANDED_NODES array (after rhythm units):
export const EXPANDED_NODES = [
  ...trebleUnit1Nodes,
  // ... all existing units ...
  ...rhythmUnit8Nodes,
  ...earTrainingUnit1Nodes,   // NEW
  ...earTrainingUnit2Nodes,   // NEW
];

// Add category export (follows existing pattern):
export const EXPANDED_EAR_TRAINING_NODES = [
  ...earTrainingUnit1Nodes,
  ...earTrainingUnit2Nodes,
];
```

### Pattern 3: subscriptionConfig.js Update

```javascript
// Source: src/config/subscriptionConfig.js (verified)
// Follow exact pattern of FREE_TREBLE_NODE_IDS, FREE_BASS_NODE_IDS

/** Ear training Unit 1 — 6 free nodes (boss is paywalled per D-08) */
export const FREE_EAR_TRAINING_NODE_IDS = [
  'ear_1_1',
  'ear_1_2',
  'ear_1_3',
  'ear_1_4',
  'ear_1_5',
  'ear_1_6',
];

// Update PAYWALL_BOSS_NODE_IDS array:
export const PAYWALL_BOSS_NODE_IDS = [
  'boss_treble_1',
  'boss_bass_1',
  'boss_rhythm_1',
  'boss_ear_1',    // NEW: D-08
  'boss_ear_2',    // NEW: D-08
];

// Update FREE_NODE_IDS Set:
export const FREE_NODE_IDS = new Set([
  ...FREE_TREBLE_NODE_IDS,
  ...FREE_BASS_NODE_IDS,
  ...FREE_RHYTHM_NODE_IDS,
  ...FREE_EAR_TRAINING_NODE_IDS,  // NEW
]);

// Update FREE_TIER_SUMMARY:
export const FREE_TIER_SUMMARY = {
  treble: { count: 7 },
  bass: { count: 6 },
  rhythm: { count: 6 },
  ear_training: { count: 6 },   // NEW
  total: 25,                    // was 19, now 25
  bossNodeCount: 5,             // was 3, now 5
};
```

### Pattern 4: Supabase Migration

```sql
-- Source: pattern from existing migrations (is_free_node doesn't exist yet — CREATE not REPLACE)
-- File: supabase/migrations/20260329000001_add_ear_training_free_nodes.sql

CREATE OR REPLACE FUNCTION public.is_free_node(node_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN node_id = ANY(ARRAY[
    -- Treble clef Unit 1 (7 free nodes)
    'treble_1_1', 'treble_1_2', 'treble_1_3', 'treble_1_4',
    'treble_1_5', 'treble_1_6', 'treble_1_7',
    -- Bass clef Unit 1 (6 free nodes)
    'bass_1_1', 'bass_1_2', 'bass_1_3', 'bass_1_4',
    'bass_1_5', 'bass_1_6',
    -- Rhythm Unit 1 (6 free nodes)
    'rhythm_1_1', 'rhythm_1_2', 'rhythm_1_3', 'rhythm_1_4',
    'rhythm_1_5', 'rhythm_1_6',
    -- Ear training Unit 1 (6 free nodes) — D-07, D-09
    'ear_1_1', 'ear_1_2', 'ear_1_3', 'ear_1_4',
    'ear_1_5', 'ear_1_6'
  ]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_free_node(TEXT) TO authenticated;
COMMENT ON FUNCTION public.is_free_node IS
  'Returns true for free-tier accessible trail nodes. Synced with JS subscriptionConfig.js FREE_NODE_IDS. Updated in Phase 10 to include ear training Unit 1.';
```

**Critical note:** The function uses `CREATE OR REPLACE` so it safely handles both first-time creation (since no prior Postgres implementation exists) and future updates. The JS `isFreeNode()` in `skillProgressService.js` and `TrailMap.jsx` does the front-end gate; this Postgres function is the RLS defense-in-depth layer. The existing RLS on `student_skill_progress` does NOT currently call this function — the JS function is the operative gate. The migration creates the Postgres function for future RLS policies to call if needed, but does not change existing RLS policies.

### Pattern 5: Node Order Numbering

Global `order` values are non-overlapping across all categories. Current state:
- Treble: orders 1–52 (treble_1_1=1, boss_treble_7=52 approx)
- Bass: orders 51–104 (bass_1_1=51, last bass unit ends ~104)
- Rhythm: orders 100–155 (rhythm_1_1=100, rhythmUnit8 ends at 155)

Ear training starts at: **156**

| Unit | Nodes | Orders |
|------|-------|--------|
| earTrainingUnit1 | 7 (6 regular + boss_ear_1) | 156–162 |
| earTrainingUnit2 | 7 (6 regular + boss_ear_2) | 163–169 |

### Pattern 6: Node Content Plan

**Unit 1: "Sound Direction" — PITCH_COMPARISON** (following D-01, D-02, D-03)

| Node | ID | Name | Difficulty | intervalRange | order |
|------|----|------|-----------|---------------|-------|
| 1 | ear_1_1 | Hear the Jump | Very wide (6-12 semitones) | min:6, max:12 | 156 |
| 2 | ear_1_2 | Big Steps | Wide (5-8 semitones) | min:5, max:8 | 157 |
| 3 | ear_1_3 | Medium Hops | Medium (3-5 semitones) | min:3, max:5 | 158 |
| 4 | ear_1_4 | Small Steps | Narrow (2-3 semitones) | min:2, max:3 | 159 |
| 5 | ear_1_5 | Tricky Twins | Very narrow (1-2 semitones) | min:1, max:2 | 160 |
| 6 | ear_1_6 | Sound Champ | Mixed review | min:1, max:12 | 161 |
| boss | boss_ear_1 | Sound Director | Wide + narrow multi-exercise | 2 exercises | 162 |

**Unit 2: "Interval Explorer" — INTERVAL_ID** (following D-04, D-06)

| Node | ID | Name | allowedCategories | ascendingRatio | order |
|------|----|------|-------------------|----------------|-------|
| 1 | ear_2_1 | Step by Step | ['step'] | 0.8 | 163 |
| 2 | ear_2_2 | Little Skips | ['skip'] | 0.8 | 164 |
| 3 | ear_2_3 | Big Leaps | ['leap'] | 0.8 | 165 |
| 4 | ear_2_4 | Mix It Up | ['step', 'skip'] | 0.7 | 166 |
| 5 | ear_2_5 | All the Moves | ['step', 'skip', 'leap'] | 0.6 | 167 |
| 6 | ear_2_6 | Going Down | ['step', 'skip', 'leap'] | 0.2 | 168 |
| boss | boss_ear_2 | Interval Master | INTERVAL_ID all + PITCH_COMPARISON | 2 exercises | 169 |

Note: `allowedCategories` is stored in exercise config as metadata for documentation and future use. The current IntervalGame ignores `allowedCategories` — it distributes step/skip/leap evenly across all 10 questions regardless of config. The only nodeConfig field the IntervalGame actually reads is `ascendingRatio`. Config fields must still be included for documentation and future game extension.

### Anti-Patterns to Avoid

- **Wrong boss category:** Boss nodes must use `category: 'boss'` (not `category: 'ear_training'`). This is how `nodesWithBossByTab` useMemo in TrailMap includes them under the ear_training tab via `bossPrefix: 'boss_ear'`.
- **Order collision:** Do NOT start ear training orders at 100 or 150 — those ranges are occupied by rhythm units. Start at 156.
- **Wrong prerequisite for boss:** Boss node prerequisite must be `['ear_1_6']` for Unit 1 boss and `['ear_2_6']` for Unit 2 boss (the last regular node in each unit). Do not set `prerequisites: []`.
- **Missing `isBoss: true`:** Boss nodes require explicit `isBoss: true` field.
- **Using RHYTHM_COMPLEXITY fields:** Ear training nodes don't need `rhythmConfig` — the game doesn't use it. Include it as an empty object or omit entirely.
- **Adding UNITS entries to skillTrail.js:** The `UNITS` map in skillTrail.js is for UI display of unit headers. Check if TrailMap uses it for ear_training — if it does, add EAR_1 and EAR_2 entries. (See Open Questions #1.)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Prerequisite validation | Manual cycle check | `npm run build` → validateTrail.mjs | Already DFS-validates all prerequisites and cycles automatically |
| Free node gate logic | Custom check | `isFreeNode()` in subscriptionConfig.js | Static ID set, O(1) lookup, already used in TrailMap + skillProgressService |
| Tab rendering for ear training | New tab component | Nothing — zero code changes | TRAIL_TAB_CONFIGS already has the ear_training entry; TrailMap is data-driven |
| Node color styling | Custom CSS | Nothing — `getCategoryColors('ear_training', state)` already returns cyan palette | nodeTypeStyles.js has ear_training entry |
| Routing for pitch_comparison | New route handler | Nothing — TrailNodeModal already navigates to /ear-training-mode/note-comparison-game | Verified in TrailNodeModal.jsx line 241 |
| Routing for interval_id | New route handler | Nothing — TrailNodeModal already navigates to /ear-training-mode/interval-game | Verified in TrailNodeModal.jsx line 244 |

---

## Common Pitfalls

### Pitfall 1: is_free_node() Does Not Exist in Postgres

**What goes wrong:** Executor writes migration as `ALTER FUNCTION is_free_node(...)` assuming it already exists.
**Why it happens:** CONTEXT.md says "New Supabase migration updates `is_free_node()`" which implies it exists. It does NOT exist in any migration file (verified by grepping all `.sql` files).
**How to avoid:** Use `CREATE OR REPLACE FUNCTION public.is_free_node(node_id TEXT)` — this handles both cases safely.
**Warning signs:** Migration file uses `ALTER` or `REPLACE` without `CREATE`.

### Pitfall 2: NoteComparisonGame Ignores intervalRange Config

**What goes wrong:** Assuming that setting `intervalRange: { min: 6, max: 12 }` in node config actually constrains which intervals the game presents.
**Why it happens:** The exercise config shape in UI-SPEC includes this field, implying it works.
**How to avoid:** Understand that `COMPARISON_TIERS` in `earTrainingUtils.js` is hardcoded — it always uses wide/medium/close pattern regardless of nodeConfig. The `intervalRange` field is metadata only. The game will always do: Q0-2 wide (6-12), Q3-6 medium (3-5), Q7-9 close (1-2). Per decision D-03, node-level difficulty is locked — this matches the game's per-session tier progression behavior.
**Impact:** No functional issue, but plan must not include tasks to "configure difficulty per node via intervalRange."

### Pitfall 3: allowedCategories Config Not Consumed by IntervalGame

**What goes wrong:** Assuming `allowedCategories: ['step']` in exercise config makes the IntervalGame show only step intervals for that node.
**Why it happens:** D-04 describes scaffolded category introduction, config field appears purpose-built.
**How to avoid:** Understand that `generateIntervalQuestion()` in `earTrainingUtils.js` distributes step/skip/leap evenly across all 10 questions via `questionIndex % categories.length`. It does NOT read `allowedCategories` from config. The only config field IntervalGame reads is `ascendingRatio`. The `allowedCategories` field is documentation-only for now.
**Impact:** All interval nodes will present all three categories regardless of config. The progression differentiation in D-04 is expressed through `ascendingRatio` only. Plan must not include a task to "implement allowedCategories filtering in IntervalGame" — that is out of scope for Phase 10.

### Pitfall 4: Order Range Collision with Rhythm Units

**What goes wrong:** Starting ear training orders at a number already used by rhythm units.
**Why it happens:** Multiple parallel categories share a global order space; rhythm goes from 100 to 155.
**How to avoid:** Use `START_ORDER = 156` for earTrainingUnit1.js.
**Warning signs:** `npm run build` validateTrail.mjs will NOT catch duplicate orders (it only checks IDs and prerequisites), so order collisions would silently coexist. The TrailMap sorts nodes within a tab by `order` ascending — duplicate orders would cause undefined sort behavior for that category only (since tabs filter by category, collision with rhythm is harmless in practice).

### Pitfall 5: UNITS Map in skillTrail.js May Need EAR_TRAINING Entries

**What goes wrong:** TrailMap calls `getCurrentUnitForCategory(userId, category)` and expects to find a matching unit in `UNITS`. If EAR_TRAINING has no UNITS entries, the unit header display for the ear training tab could show nothing or throw.
**Why it happens:** UNITS in skillTrail.js has entries for TREBLE_1...7, BASS_1...7, RHYTHM_1...8 — no EAR_TRAINING entries.
**How to avoid:** Verify in TrailMap.jsx whether it reads `UNITS` for ear_training. If it does, add EAR_1 and EAR_2 entries to UNITS in skillTrail.js. (See Architecture Patterns — this is investigation step T0 for the executor.)
**Warning signs:** Ear training tab renders nodes without unit section headers, or throws a lookup error.

### Pitfall 6: dailyGoalsService.js Already Handles ear_training

**What goes wrong:** Forgetting to audit dailyGoalsService for hardcoded category arrays before shipping (referenced as a concern in STATE.md).
**Resolution:** Verified — dailyGoalsService.js has NO hardcoded category arrays. GOAL_TEMPLATES are category-agnostic (complete_exercises, earn_three_stars, etc.). No changes needed to daily goals service.

---

## Code Examples

### Regular Ear Training Node (PITCH_COMPARISON)

```javascript
// Source: trebleUnit1Redesigned.js pattern + CONTEXT.md decisions D-01/D-02/D-03
{
  id: 'ear_1_1',
  name: 'Hear the Jump',
  description: 'Two notes — which is higher?',
  category: 'ear_training',
  unit: 1,
  unitName: 'Sound Direction',
  order: 156,
  orderInUnit: 1,
  prerequisites: [],

  nodeType: NODE_TYPES.DISCOVERY,

  exercises: [
    {
      type: EXERCISE_TYPES.PITCH_COMPARISON,
      config: {
        notePool: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
        questionCount: 10,
        intervalRange: { min: 6, max: 12 }
        // Note: intervalRange is metadata only — game uses hardcoded COMPARISON_TIERS
      }
    }
  ],

  skills: ['pitch_comparison_wide'],
  xpReward: 40,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Boss Node (PITCH_COMPARISON multi-exercise)

```javascript
// Source: bassUnit1Redesigned.js boss pattern + CONTEXT.md D-10/D-11
{
  id: 'boss_ear_1',
  name: 'Sound Director',
  description: 'Boss: wide and close, both!',
  unlockHint: 'Complete all 6 Sound Direction lessons to unlock!',
  category: 'boss',             // IMPORTANT: 'boss', not 'ear_training'
  unit: 1,
  unitName: 'Sound Direction',
  order: 162,
  orderInUnit: 7,
  prerequisites: ['ear_1_6'],

  nodeType: NODE_TYPES.MINI_BOSS,

  exercises: [
    {
      type: EXERCISE_TYPES.PITCH_COMPARISON,
      config: {
        notePool: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'],
        questionCount: 10,
        intervalRange: { min: 6, max: 12 }
      }
    },
    {
      type: EXERCISE_TYPES.PITCH_COMPARISON,
      config: {
        notePool: ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3'],
        questionCount: 10,
        intervalRange: { min: 1, max: 3 }
      }
    }
  ],

  skills: ['pitch_comparison_all'],
  xpReward: 100,
  accessoryUnlock: 'ear_sprout_badge',
  isBoss: true,
  isReview: false,
  reviewsUnits: []
}
```

### IntervalGame Node (INTERVAL_ID with ascendingRatio)

```javascript
// Source: IntervalGame.jsx line 148-151 — only ascendingRatio is consumed from nodeConfig
{
  id: 'ear_2_6',
  name: 'Going Down',
  description: 'Descending intervals too',
  category: 'ear_training',
  unit: 2,
  unitName: 'Interval Explorer',
  order: 168,
  orderInUnit: 6,
  prerequisites: ['ear_2_5'],

  nodeType: NODE_TYPES.CHALLENGE,

  exercises: [
    {
      type: EXERCISE_TYPES.INTERVAL_ID,
      config: {
        notePool: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4'],
        questionCount: 10,
        allowedCategories: ['step', 'skip', 'leap'],  // metadata only
        ascendingRatio: 0.2    // FUNCTIONAL: overrides DEFAULT_ASCENDING_RATIO=0.6
      }
    }
  ],

  skills: ['interval_id_descending'],
  xpReward: 50,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Unit 2 Boss Node (INTERVAL_ID + PITCH_COMPARISON mix)

```javascript
// Source: CONTEXT.md D-11 — "1 interval exercise + 1 mixed pitch+interval exercise"
{
  id: 'boss_ear_2',
  name: 'Interval Master',
  description: 'Boss: all intervals, both ways',
  unlockHint: 'Complete all Interval Explorer lessons to unlock!',
  category: 'boss',
  unit: 2,
  unitName: 'Interval Explorer',
  order: 169,
  orderInUnit: 7,
  prerequisites: ['ear_2_6'],

  nodeType: NODE_TYPES.MINI_BOSS,

  exercises: [
    {
      type: EXERCISE_TYPES.INTERVAL_ID,
      config: {
        notePool: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'],
        questionCount: 10,
        allowedCategories: ['step', 'skip', 'leap'],
        ascendingRatio: 0.5
      }
    },
    {
      type: EXERCISE_TYPES.PITCH_COMPARISON,
      config: {
        notePool: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'],
        questionCount: 10,
        intervalRange: { min: 1, max: 12 }
      }
    }
  ],

  skills: ['interval_id_all', 'pitch_comparison_all'],
  xpReward: 100,
  accessoryUnlock: 'interval_master_badge',
  isBoss: true,
  isReview: false,
  reviewsUnits: []
}
```

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code/config/data changes with no new external dependencies. `supabase` CLI already configured; no new services required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (version from package.json) |
| Config file | vite.config.js (vitest config embedded) |
| Quick run command | `npx vitest run src/data/constants.test.js` |
| Full suite command | `npm run test:run` |
| Build validation | `npm run build` (runs validateTrail.mjs as prebuild) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EAR-01 | 12-15 ear training nodes with correct IDs, category, prerequisites | unit | `npm run build` (validateTrail) | N/A — build gate |
| EAR-01 | earTrainingUnit1 exports 7 nodes, earTrainingUnit2 exports 7 nodes | unit | `npx vitest run src/data/constants.test.js` | No — Wave 0 |
| EAR-02 | Ear Training tab is 4th tab in TRAIL_TAB_CONFIGS | unit | `npx vitest run src/data/constants.test.js` | Yes (test line 88) |
| EAR-03 | All ear training nodes use PITCH_COMPARISON or INTERVAL_ID type | unit | `npm run build` (validateTrail) | N/A — build gate |
| EAR-04 | FREE_EAR_TRAINING_NODE_IDS has exactly 6 IDs | unit | `npx vitest run src/config/subscriptionConfig.test.js` | No — Wave 0 |
| EAR-04 | PAYWALL_BOSS_NODE_IDS includes boss_ear_1 and boss_ear_2 | unit | `npx vitest run src/config/subscriptionConfig.test.js` | No — Wave 0 |
| EAR-04 | FREE_NODE_IDS Set contains all 6 ear training free nodes | unit | `npx vitest run src/config/subscriptionConfig.test.js` | No — Wave 0 |
| EAR-05 | boss_ear_1 has 2 exercises, boss_ear_2 has 2 exercises | unit | `npx vitest run src/data/constants.test.js` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run build` (validates trail data automatically)
- **Per wave merge:** `npm run test:run`
- **Phase gate:** `npm run build` succeeds + `npm run test:run` green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/data/earTraining.test.js` — covers EAR-01 (node count, IDs, categories, prerequisites), EAR-03 (exercise types), EAR-05 (boss node structure). New file needed.
- [ ] `src/config/subscriptionConfig.test.js` — covers EAR-04 (FREE_EAR_TRAINING_NODE_IDS, PAYWALL_BOSS_NODE_IDS updates, FREE_NODE_IDS Set membership). New file needed.

Existing `src/data/constants.test.js` already passes EAR-02 (line 88-93 verifies ear_training tab is 4th tab with correct properties).

---

## Runtime State Inventory

Phase 10 is a data-authoring phase — no rename, refactor, or migration of existing data. New nodes are additive.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `student_skill_progress` table — no existing ear_training rows (new nodes) | None — new nodes, no existing progress to migrate |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None | None |

**Migration safety:** The new Postgres `is_free_node()` function is a CREATE OR REPLACE — non-destructive. The migration does NOT modify `student_skill_progress` rows, RLS policies, or any existing data.

---

## Open Questions

1. **Does TrailMap read `UNITS` for ear_training unit headers?**
   - What we know: `UNITS` in skillTrail.js has entries for treble/bass/rhythm only. TrailMap calls `getCurrentUnitForCategory()` in Phase 8+ for the `_currentUnits` state.
   - What's unclear: Whether ZigzagTrailLayout renders unit header banners using `UNITS` data, and whether missing EAR_TRAINING entries would cause a visible bug vs. silent no-op.
   - Recommendation: Executor must check `ZigzagTrailLayout.jsx` for UNITS usage before starting. If unit headers are rendered, add `EAR_1` and `EAR_2` to `UNITS` in skillTrail.js (trivial addition). If not, skip.

2. **Should `EXPANDED_EAR_TRAINING_NODES` be exported from expandedNodes.js?**
   - What we know: `EXPANDED_TREBLE_NODES`, `EXPANDED_BASS_NODES`, `EXPANDED_RHYTHM_NODES` are all exported for "easy integration."
   - What's unclear: Whether any consumer currently imports these category-specific arrays.
   - Recommendation: Export `EXPANDED_EAR_TRAINING_NODES` to follow the established pattern; no consumer needs it today but consistency matters for future phases.

3. **Does the migration need to update existing RLS policies on student_skill_progress?**
   - What we know: Current RLS on `student_skill_progress` uses `student_id = auth.uid()` — no node-level subscription check. The JS `isFreeNode()` in `skillProgressService.js` handles the gate.
   - What's unclear: Whether a full defense-in-depth RLS policy (checking `is_free_node(node_id) OR has_active_subscription(auth.uid())`) was planned for this phase.
   - Recommendation: D-09 only says "update `is_free_node()`", not "update RLS policies." Create the Postgres function only. Defer RLS update to a security hardening phase if desired.

---

## Project Constraints (from CLAUDE.md)

- **SVG imports:** `import Icon from './icon.svg?react'` — no SVGs added in this phase.
- **No new npm packages:** Confirmed — Phase 10 adds no dependencies.
- **Pre-commit hook:** Husky + lint-staged runs ESLint + Prettier on staged files. All new JS files must pass lint.
- **prebuild hook:** `npm run build` runs `scripts/validateTrail.mjs` automatically — this IS the primary quality gate for node data.
- **Vitest conventions:** Test files as `*.test.{js,jsx}` siblings next to source, or in `__tests__/`. New test files for Wave 0 should be `src/data/earTraining.test.js` and `src/config/subscriptionConfig.test.js`.
- **Security:** No RLS changes required. New node data contains no PII. Migration is additive only.
- **i18n:** Trail exercise type keys for `pitch_comparison` and `interval_id` already registered per INFRA-08. Tab label `ear_training` already registered. No new i18n keys required.
- **Routing:** No new routes. All routing was established in Phase 9.

---

## Sources

### Primary (HIGH confidence)
- Verified by direct code reading of `src/data/units/trebleUnit1Redesigned.js` — node shape, required fields, boss pattern
- Verified by direct code reading of `src/data/units/bassUnit1Redesigned.js` — boss node pattern with multi-exercise
- Verified by direct code reading of `src/data/constants.js` — TRAIL_TAB_CONFIGS ear_training entry confirmed
- Verified by direct code reading of `src/config/subscriptionConfig.js` — FREE_NODE_IDS pattern confirmed
- Verified by direct code reading of `src/components/trail/TrailNodeModal.jsx` — routing for pitch_comparison and interval_id confirmed (lines 240-245)
- Verified by direct code reading of `src/components/games/ear-training-games/earTrainingUtils.js` — COMPARISON_TIERS hardcoded, ascendingRatio is only consumed nodeConfig field
- Verified by direct code reading of `src/utils/nodeTypeStyles.js` — EAR_TRAINING color palette (cyan/teal) confirmed
- Verified by `grep -r is_free_node supabase/` — function does NOT exist in any migration file
- Verified by `grep -n "START_ORDER" src/data/units/*.js` — rhythmUnit8 is last at 149, making ear training START_ORDER = 156
- Verified by direct code reading of `src/data/expandedNodes.js` — import/spread pattern to follow
- Verified by direct code reading of `scripts/validateTrail.mjs` — validates exercise types, prerequisites, cycles, IDs

### Secondary (MEDIUM confidence)
- `src/services/dailyGoalsService.js` read in full — confirmed no hardcoded category arrays (resolves STATE.md concern)
- `src/services/skillProgressService.js` — confirmed `isFreeNode()` usage for JS-layer gate

---

## Metadata

**Confidence breakdown:**
- Node data structure: HIGH — copied from verified treble/bass unit files
- Order numbering: HIGH — calculated from verified START_ORDER values across all unit files
- Subscription config pattern: HIGH — verified by reading existing FREE_TREBLE/BASS/RHYTHM arrays
- Postgres migration: HIGH — verified is_free_node() doesn't exist; CREATE OR REPLACE is safe
- Game config field consumption: HIGH — read NoteComparisonGame and IntervalGame source; only ascendingRatio consumed
- UNITS map gap: MEDIUM — ZigzagTrailLayout not read (Open Question #1)

**Research date:** 2026-03-29
**Valid until:** 2026-04-30 (stable codebase, no fast-moving dependencies)
