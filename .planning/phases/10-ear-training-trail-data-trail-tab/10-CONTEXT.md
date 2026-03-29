# Phase 10: Ear Training Trail Data + Trail Tab - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

The Ear Training learning path goes live on the trail with 13 progressive nodes across 2 units, a distinct Ear tab (cyan/teal palette already configured), correct subscription gating (JS + Postgres), and 2 boss challenges.

Requirements covered: EAR-01 through EAR-05.

Not in scope: Game components (built in Phase 9), tab rendering logic (data-driven from Phase 7), ArcadeRhythmGame (Phase 11), rhythm node remapping (Phase 11).

</domain>

<decisions>
## Implementation Decisions

### Node Progression
- **D-01:** Path starts with pitch comparison (higher/lower) before introducing intervals (step/skip/leap). Direction before distance — mirrors music pedagogy sequencing.
- **D-02:** Note range starts in C4 neighborhood (C3-C5), expanding outward to full sampler range (C3-B5) in later nodes. Familiar territory for kids who played treble/bass games.
- **D-03:** Pitch comparison difficulty increases by shrinking intervals: early nodes use wide intervals (octave+/7th/6th), middle nodes use 4ths/5ths, later nodes use 2nds/3rds. Each NODE locks a difficulty tier (not tiered within a session).
- **D-04:** Interval exercises build incrementally: first interval node has steps only, next adds skips, later nodes include all three (step/skip/leap). Scaffolded learning — master one category before the next appears.

### Unit Structure
- **D-05:** Unit 1: "Sound Direction" — 6 pitch comparison nodes. Unit 2: "Interval Explorer" — 7 interval nodes (including some mixed review). 13 nodes total.
- **D-06:** Split by game type, not difficulty tier. Clean conceptual boundary matching the progression sequence (pitch comparison first, then intervals).

### Free Tier Boundary
- **D-07:** All of Unit 1 is free (6 nodes). Unit 2 is premium. Consistent with treble/bass/rhythm where unit 1 is the free tier.
- **D-08:** All boss nodes paywalled — added to `PAYWALL_BOSS_NODE_IDS`. Consistent with existing convention across all categories.
- **D-09:** New Supabase migration updates `is_free_node()` to include the new ear training free node IDs. Clean, auditable, follows existing migration pattern.

### Boss Node Design
- **D-10:** 2 boss nodes — one per unit. IDs: `boss_ear_1` (end of Unit 1), `boss_ear_2` (end of Unit 2). Matches treble/bass pattern.
- **D-11:** Multi-exercise boss sessions combining unit skills. Unit 1 boss: 2 pitch comparison exercises (wide + narrow). Unit 2 boss: 1 interval exercise + 1 mixed pitch+interval exercise. Harder versions of what was learned.

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Trail Data Structure
- `src/data/constants.js` — NODE_CATEGORIES (EAR_TRAINING), EXERCISE_TYPES (PITCH_COMPARISON, INTERVAL_ID), TRAIL_TAB_CONFIGS (ear_training entry with cyan colors, bossPrefix: 'boss_ear')
- `src/data/units/trebleUnit1Redesigned.js` — Reference node data structure pattern (node shape, fields, exercise config format)
- `src/data/units/bassUnit1Redesigned.js` — Boss node pattern reference (isBoss, nodeType, multi-exercise, higher XP)
- `src/data/expandedNodes.js` — Aggregation point for all unit files (new ear training units must be imported here)
- `src/data/skillTrail.js` — SKILL_NODES array, getNodeById(), isNodeUnlocked() — ear nodes will be added to this

### Subscription Gating
- `src/config/subscriptionConfig.js` — FREE_NODE_IDS Set, FREE_*_NODE_IDS arrays, PAYWALL_BOSS_NODE_IDS, isFreeNode()
- `supabase/migrations/` — Existing is_free_node() Postgres function (new migration must sync ear training free IDs)

### Build Validation
- `scripts/validateTrail.mjs` — Validates prerequisites, cycles, duplicate IDs, exercise types, XP — all new nodes auto-validated

### Game Components (already built)
- `src/components/games/ear-training/NoteComparisonGame.jsx` — Pitch comparison game (Phase 9)
- `src/components/games/ear-training/IntervalGame.jsx` — Interval identification game (Phase 9)

### Design System
- `docs/DESIGN_SYSTEM.md` — Glass card patterns, color conventions
- `src/utils/nodeTypeStyles.js` — Node color palette per category (ear_training: cyan/teal already defined)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TRAIL_TAB_CONFIGS` in constants.js: Ear training tab entry already exists with cyan colors, Ear icon, and `bossPrefix: 'boss_ear'` — zero tab code changes needed
- `NODE_CATEGORIES.EAR_TRAINING`: Category constant already registered
- `EXERCISE_TYPES.PITCH_COMPARISON` and `EXERCISE_TYPES.INTERVAL_ID`: Both registered and routed
- `validateTrail.mjs`: Auto-validates new nodes on build — no script changes needed
- Existing unit file pattern: Copy trebleUnit1Redesigned.js structure, swap category/exercises

### Established Patterns
- Node ID convention: `{category}_{unit}_{orderInUnit}` (e.g., `treble_1_1`)
- Boss ID convention: `boss_{category}_{unit}` (e.g., `boss_bass_1`)
- Free tier: Category-specific `FREE_*_NODE_IDS` array + added to `FREE_NODE_IDS` Set
- Unit files export an array of node objects, imported in expandedNodes.js
- `nodesWithBossByTab` useMemo in TrailMap merges boss nodes into tab by `bossPrefix`

### Integration Points
- `src/data/units/` — Create `earTrainingUnit1.js` and `earTrainingUnit2.js`
- `src/data/expandedNodes.js` — Import and spread new ear training unit arrays
- `src/config/subscriptionConfig.js` — Add `FREE_EAR_TRAINING_NODE_IDS` array and `boss_ear_*` to paywall list
- `supabase/migrations/` — New migration to update `is_free_node()` with ear training IDs

</code_context>

<specifics>
## Specific Ideas

No specific external references or "I want it like X" moments — decisions are clear and self-contained.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-ear-training-trail-data-trail-tab*
*Context gathered: 2026-03-29*
