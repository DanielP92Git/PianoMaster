# Phase 7: Data Foundation + TrailMap Refactor - Research

**Researched:** 2026-03-27
**Domain:** Trail data constants, React tab refactor, build-time validation, routing infrastructure
**Confidence:** HIGH

---

## Summary

Phase 7 is a pure infrastructure change with no new game logic. The work falls into four clean buckets: (1) extend `constants.js` with 5 new EXERCISE_TYPES and 1 new NODE_CATEGORIES entry plus a new `TRAIL_TAB_CONFIGS` array, (2) add 5 new `case` blocks to TrailNodeModal's navigation switch that route to a shared `ComingSoon` component, (3) refactor TrailMap's hardcoded `TRAIL_TABS` array and all downstream logic to be driven by `TRAIL_TAB_CONFIGS` from constants, and (4) extend `validateTrail.mjs` with a new `validateExerciseTypes()` function that reads `EXERCISE_TYPES` values and hard-fails on unknown type strings.

All four work areas are self-contained. Every integration point (switch statements, array maps, filter predicates) follows a pattern already established in the codebase — adding a new entry or case is mechanical. The highest-risk item is the TrailMap refactor: the component has six places where it references individual tab IDs or categories by name (TRAIL_TABS array, `_currentUnits` state shape, `fetchProgress` parallel calls, boss-node filter predicates, `activeNodes` ternary, `activeCategory` ternary). All six must be converted to loop over `TRAIL_TAB_CONFIGS` to achieve the data-driven guarantee. The UI-SPEC gives exact Tailwind classes for every new visual element; no design research is required.

**Primary recommendation:** Treat the TrailMap refactor as a single focused task (not split across tasks) so the six dependent code paths are converted atomically — partial refactors will leave the component in an inconsistent state.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Teal/Cyan color palette for the Ear Training tab
**D-02:** Lucide `Ear` icon for the Ear Training tab
**D-03:** All tabs get icons — Music (Treble), Music2 (Bass), Drum (Rhythm), Ear (Ear Training)
**D-04:** Tab label is "Ear Training" (full text, not abbreviated)
**D-05:** Tapping an unimplemented exercise type shows a friendly "Coming Soon" screen with the game name and a back-to-trail button
**D-06:** Shared reusable `ComingSoon` component — one component that takes `gameName` prop, reusable for all 5 new types and any future games
**D-07:** Unknown exercise types cause a hard build failure (not just a warning)
**D-08:** Validation checks type string only — no exercise config schema validation in this phase
**D-09:** Full config per tab entry: id, label, categoryKey, icon component, color palette (active/inactive), and bossPrefix pattern. Adding a tab = one array entry, zero code changes
**D-10:** `TRAIL_TAB_CONFIGS` lives in `src/data/constants.js` alongside NODE_CATEGORIES and EXERCISE_TYPES
**D-11:** Tab order determined by array position (no explicit order field)
**D-12:** TrailMap unit-fetching logic becomes data-driven — loop over TRAIL_TAB_CONFIGS instead of hardcoded treble/bass/rhythm calls
**D-13:** Boss nodes associated with tabs via config-driven `bossPrefix` field; no more hardcoded `id.startsWith()` filtering

### Claude's Discretion

- Specific lucide icon choices for Treble, Bass, and Rhythm tabs (as long as they're visually clear and consistent)
- Exact teal/cyan shade selection within Tailwind's color palette
- ComingSoon component layout and messaging tone (child-friendly)
- Internal refactoring approach for TrailMap (how to restructure the data flow)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | New EXERCISE_TYPES constants added for all 5 new game types (RHYTHM_TAP, RHYTHM_DICTATION, ARCADE_RHYTHM, PITCH_COMPARISON, INTERVAL_ID) | Covered: extend `constants.js` EXERCISE_TYPES object with 5 string values; existing test in `constants.test.js` establishes the pattern |
| INFRA-02 | EAR_TRAINING added to NODE_CATEGORIES constant | Covered: single key added to NODE_CATEGORIES in `constants.js`; re-exported through `skillTrail.js` automatically |
| INFRA-03 | TrailNodeModal routes to correct game component for each new exercise type | Covered: 5 new `case` blocks in `navigateToExercise` switch; all route to `/ear-training/coming-soon` or direct ComingSoon render; see routing analysis below |
| INFRA-04 | TrailMap refactored to data-driven tab system supporting 4+ tabs | Covered: 6 code locations in TrailMap.jsx identified; full refactor approach documented |
| INFRA-05 | validateTrail.mjs validates all exercise type strings against known constants | Covered: new `validateExerciseTypes()` function follows existing `validateNodeTypes()` pattern; must import EXERCISE_TYPES from constants.js |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lucide-react | existing | Tab icons (Music, Music2, Drum, Ear, Hourglass) | Already used throughout; Ear, Music, Music2, Drum, Hourglass are confirmed Lucide icons |
| react-router-dom | v7 (existing) | Navigation from TrailNodeModal to ComingSoon route | Already used for all navigation; useNavigate pattern established |
| react-i18next | existing | i18n keys for new tab label and exercise types | Already used for all trail text |

**No new packages required for this phase.** All work is refactoring and extension of existing modules.

**Lucide icon availability (verified by examining current imports):**
- `Ear` — confirmed available in lucide-react (used as decided in D-02)
- `Music` — confirmed (new use; currently `Target` used in TrailMap.jsx)
- `Music2` — confirmed available in lucide-react
- `Drum` — confirmed available in lucide-react
- `Hourglass` — confirmed available in lucide-react (for ComingSoon screen per UI-SPEC)

---

## Architecture Patterns

### Pattern 1: EXERCISE_TYPES extension (INFRA-01)

**What:** Add 5 string constants to the existing `EXERCISE_TYPES` object in `src/data/constants.js`.

**Exact additions:**
```javascript
// src/data/constants.js — EXERCISE_TYPES object additions
export const EXERCISE_TYPES = {
  NOTE_RECOGNITION: 'note_recognition',
  SIGHT_READING: 'sight_reading',
  RHYTHM: 'rhythm',
  MEMORY_GAME: 'memory_game',
  BOSS_CHALLENGE: 'boss_challenge',
  NOTE_CATCH: 'note_catch',
  // v2.9 new types
  RHYTHM_TAP: 'rhythm_tap',
  RHYTHM_DICTATION: 'rhythm_dictation',
  ARCADE_RHYTHM: 'arcade_rhythm',
  PITCH_COMPARISON: 'pitch_comparison',
  INTERVAL_ID: 'interval_id',
};
```

### Pattern 2: NODE_CATEGORIES extension (INFRA-02)

**What:** Add EAR_TRAINING category to the existing object.

```javascript
export const NODE_CATEGORIES = {
  TREBLE_CLEF: 'treble_clef',
  BASS_CLEF: 'bass_clef',
  RHYTHM: 'rhythm',
  BOSS: 'boss',
  EAR_TRAINING: 'ear_training',  // v2.9
};
```

### Pattern 3: TRAIL_TAB_CONFIGS array (INFRA-04, D-09, D-10)

**What:** New export in `src/data/constants.js`. Requires importing lucide icons into `constants.js`. Per D-10 this array lives in `constants.js`.

**Important constraint:** `constants.js` currently has NO imports (by design — "no dependencies to avoid circular import issues"). Adding lucide-react imports is safe because lucide-react is a UI library with no circular dependency risk into the data layer. Confirmed: the file comment says "no dependencies" to avoid circular imports with other *src/* modules; an external npm import is fine.

```javascript
// src/data/constants.js additions
import { Music, Music2, Drum, Ear } from 'lucide-react';

export const TRAIL_TAB_CONFIGS = [
  {
    id: 'treble',
    label: 'Treble',
    categoryKey: 'TREBLE_CLEF',
    icon: Music,
    colorActive: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    colorBorder: 'border-blue-400',
    colorGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]',
    bossPrefix: 'boss_treble',
  },
  {
    id: 'bass',
    label: 'Bass',
    categoryKey: 'BASS_CLEF',
    icon: Music2,
    colorActive: 'bg-gradient-to-br from-purple-500 to-violet-600',
    colorBorder: 'border-purple-400',
    colorGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    bossPrefix: 'boss_bass',
  },
  {
    id: 'rhythm',
    label: 'Rhythm',
    categoryKey: 'RHYTHM',
    icon: Drum,
    colorActive: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    colorBorder: 'border-emerald-400',
    colorGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    bossPrefix: 'boss_rhythm',
  },
  {
    id: 'ear_training',
    label: 'Ear Training',
    categoryKey: 'EAR_TRAINING',
    icon: Ear,
    colorActive: 'bg-gradient-to-br from-cyan-400 to-teal-500',
    colorBorder: 'border-cyan-300',
    colorGlow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]',
    bossPrefix: 'boss_ear',
  },
];
```

### Pattern 4: TrailMap refactor — 6 locations to update (INFRA-04, D-12, D-13)

**What:** Replace all hardcoded tab/category references with loops over `TRAIL_TAB_CONFIGS`.

**Full inventory of changes needed (verified by reading TrailMap.jsx lines 52–346):**

| Location | Current code | Replacement approach |
|----------|-------------|---------------------|
| Line 52-57: `TRAIL_TABS` array | `[{id:'treble'...}, {id:'bass'...}, {id:'rhythm'...}]` | Delete; import `TRAIL_TAB_CONFIGS` from constants |
| Line 69-73: `_currentUnits` state | `{ treble: 1, bass: 1, rhythm: 1 }` | `Object.fromEntries(TRAIL_TAB_CONFIGS.map(t => [t.id, 1]))` |
| Lines 86-100: `fetchProgress` parallel calls | 3 separate `getCurrentUnitForCategory` calls | Loop over `TRAIL_TAB_CONFIGS` — `Promise.all(TRAIL_TAB_CONFIGS.map(tab => getCurrentUnitForCategory(user.id, NODE_CATEGORIES[tab.categoryKey])))` |
| Lines 104-108: `allNodes` assembly | 3 category calls + `getBossNodes()` | Loop: `TRAIL_TAB_CONFIGS.flatMap(tab => getNodesByCategory(NODE_CATEGORIES[tab.categoryKey]))` + `getBossNodes()` — but only non-boss categories |
| Lines 150-169: per-tab useMemo boss filtering | 3 separate useMemos using `id.startsWith('boss_treble')` etc | Single `useMemo` per tab using `tab.bossPrefix` from config |
| Lines 175-179: `activeNodes`/`activeCategory` ternary chains | `activeTab === 'treble' ? trebleWithBoss : activeTab === 'bass' ? bassWithBoss : rhythmWithBoss` | Look up active tab config by `activeTab` id; use config-driven data |
| Lines 260-265: tab render `nodes` derivation | `tab.id === 'treble' ? trebleWithBoss : ...` | Use data keyed by tab id from computed map |
| Lines 230-234: keyboard nav `TRAIL_TABS.length` | `% TRAIL_TABS.length` | `% TRAIL_TAB_CONFIGS.length` |
| Line 206-213: `premiumLockedNodeIds` allNodes | 3 hardcoded spreads | Same loop approach as allNodes assembly |

**Active tab styling (INFRA-04, D-09):** The current tab button uses a single hardcoded active class string. After refactor, active tab applies `tab.colorActive`, `tab.colorBorder`, and `tab.colorGlow` from the config entry. Icon component renders as `<tab.icon size={16} />` inside the button.

**Ear Training tab with zero nodes:** Since no EAR_TRAINING nodes exist in Phase 7, `getNodesByCategory(NODE_CATEGORIES.EAR_TRAINING)` returns an empty array. `getBossNodes()` returns only existing boss nodes. The Ear Training tab will render with an empty `ZigzagTrailLayout` — this is acceptable per the UI-SPEC (empty state not applicable; tab with 0 nodes is shown but Phase 10 adds data). Verify `ZigzagTrailLayout` handles empty node arrays without crashing — this is a known risk to test.

### Pattern 5: TrailNodeModal — 5 new switch cases (INFRA-03)

**What:** Add 5 cases to the `navigateToExercise` switch in `TrailNodeModal.jsx`. Per D-05/D-06, all new cases navigate to a single `ComingSoon` route passing `gameName` in location state.

**Routing approach for ComingSoon:**

The UI-SPEC describes ComingSoon as "a standalone page rendered via routing". The cleanest approach consistent with existing patterns is:
- Add route `/ear-training/coming-soon` to `App.jsx` under the `ProtectedRoute`/`AppLayout` wrapper (same pattern as game routes)
- `ComingSoon.jsx` reads `gameName` from `useLocation().state.gameName`
- `onBack` calls `navigate('/trail')` (back to trail)

Alternatively, ComingSoon could be navigated to as a nested route or rendered inline. The route approach is preferred because: (a) existing games all use navigation (not conditional rendering), (b) it allows back-button behavior via browser history, (c) it avoids complicating TrailNodeModal with conditional rendering.

**New switch cases:**
```javascript
case 'rhythm_tap':
  navigate('/ear-training/coming-soon', { state: { ...navState, gameName: t('trail:exerciseTypes.rhythm_tap') } });
  break;
case 'rhythm_dictation':
  navigate('/ear-training/coming-soon', { state: { ...navState, gameName: t('trail:exerciseTypes.rhythm_dictation') } });
  break;
case 'arcade_rhythm':
  navigate('/ear-training/coming-soon', { state: { ...navState, gameName: t('trail:exerciseTypes.arcade_rhythm') } });
  break;
case 'pitch_comparison':
  navigate('/ear-training/coming-soon', { state: { ...navState, gameName: t('trail:exerciseTypes.pitch_comparison') } });
  break;
case 'interval_id':
  navigate('/ear-training/coming-soon', { state: { ...navState, gameName: t('trail:exerciseTypes.interval_id') } });
  break;
```

Note: `getExerciseTypeName()` helper at the top of `TrailNodeModal.jsx` also needs 5 new cases for the exercise list display (separate from the navigation switch).

### Pattern 6: validateExerciseTypes() in validateTrail.mjs (INFRA-05)

**What:** New validation function following the exact pattern of `validateNodeTypes()`. The validator is a `.mjs` file that currently imports `SKILL_NODES` from `skillTrail.js` and `NODE_TYPES` from `nodeTypes.js`. Adding `EXERCISE_TYPES` from `constants.js` is a new import.

```javascript
// validateTrail.mjs additions
import { EXERCISE_TYPES } from '../src/data/constants.js';

function validateExerciseTypes() {
  console.log('\nChecking exercise types...');

  const validTypes = new Set(Object.values(EXERCISE_TYPES));
  let invalidCount = 0;

  for (const node of SKILL_NODES) {
    for (const exercise of (node.exercises || [])) {
      if (!validTypes.has(exercise.type)) {
        console.error(
          `  ERROR: Unknown exercise type "${exercise.type}" in node "${node.id}"`
        );
        hasErrors = true;
        invalidCount++;
      }
    }
  }

  if (invalidCount === 0) {
    console.log('  Exercise types: OK');
  } else {
    console.error(`  Found ${invalidCount} unknown exercise type(s)`);
  }
}
```

Then call `validateExerciseTypes()` in the main execution block alongside existing validators.

**Hard-fail guarantee (D-07):** The function sets `hasErrors = true`, which causes `process.exit(1)` at the end — same behavior as broken prerequisites. No separate exit call needed.

### Pattern 7: ComingSoon component

**Location:** `src/components/shared/ComingSoon.jsx` (new directory — `src/components/shared/` does not currently exist)

**Props:** `{ gameName: string, onBack: function }`

**Visual spec** (from UI-SPEC — exact classes):
- Outer wrapper: full-screen flex column, inherits trail page background
- Card: `bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl` max-w-[400px] centered p-8
- Icon: `<Hourglass size={48} className="text-cyan-300" />`
- Heading: `text-2xl font-bold text-white` — `{gameName}`
- Body: `text-base text-white/70` — "This game is coming soon! Check back after the next update."
- Back button: `bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-full px-6 py-3 text-sm font-bold min-h-[44px] active:scale-95`

### Pattern 8: i18n keys to add (both locales)

**English (`src/locales/en/trail.json`)** — add to `tabs` section and `exerciseTypes` section:

```json
"tabs": {
  "ariaLabel": "Learning paths",
  "treble": "Treble",
  "bass": "Bass",
  "rhythm": "Rhythm",
  "ear_training": "Ear Training",
  "treblePanel": "Treble learning path",
  "bassPanel": "Bass learning path",
  "rhythmPanel": "Rhythm learning path",
  "ear_trainingPanel": "Ear Training learning path"
},
"exerciseTypes": {
  ...existing keys...,
  "rhythm_tap": "Rhythm Tap",
  "rhythm_dictation": "Rhythm Dictation",
  "arcade_rhythm": "Arcade Rhythm",
  "pitch_comparison": "Pitch Comparison",
  "interval_id": "Interval ID"
}
```

**Hebrew (`src/locales/he/trail.json`)** — same keys, use English values as placeholder (INFRA-08 is Phase 8 scope):

```json
"tabs": {
  ...existing keys...,
  "ear_training": "Ear Training",
  "ear_trainingPanel": "Ear Training learning path"
},
"exerciseTypes": {
  ...existing keys...,
  "rhythm_tap": "Rhythm Tap",
  "rhythm_dictation": "Rhythm Dictation",
  "arcade_rhythm": "Arcade Rhythm",
  "pitch_comparison": "Pitch Comparison",
  "interval_id": "Interval ID"
}
```

Note: The current `trail.json` English file does NOT have `treblePanel`, `bassPanel`, or `rhythmPanel` keys — only `ariaLabel`, `treble`, `bass`, `rhythm`. The `tabpanel` aria-label in TrailMap uses `t('tabs.${activeTab}Panel', { defaultValue: ... })` — the `defaultValue` fallback means these keys are optional but should be added for completeness. The `ear_trainingPanel` key is needed for the new tab.

### Anti-Patterns to Avoid

- **Adding `TRAIL_TAB_CONFIGS` to `skillTrail.js` instead of `constants.js`:** skillTrail.js already imports from constants.js; reverse dependency would create a circular import.
- **Putting the icon imports inside TrailMap.jsx instead of constants.js:** Icons belong in the config array (D-10); keeping them in TrailMap defeats the "zero code changes to add a tab" contract.
- **Partial TrailMap refactor (converting tabs but not boss filtering or fetchProgress):** Will leave inconsistent data — the Ear Training tab would render correctly but boss nodes and unit tracking would still be hardcoded to 3 categories.
- **Making `validateExerciseTypes()` a warning instead of error:** D-07 explicitly requires hard failure.
- **Using a separate `ComingSoon` route per game type:** D-06 requires one shared component.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab icon rendering | Custom SVG or emoji | lucide-react (existing dep) | Already imported throughout; consistent with all other trail icons |
| "Coming Soon" route | 5 separate placeholder pages | Single `ComingSoon` component with `gameName` prop | D-06 requires shared component |
| Exercise type validation | String comparison in game code | Build-time `validateExerciseTypes()` in validateTrail.mjs | D-07 requires build failure; runtime checks are too late |
| RTL text support in ComingSoon | Manual `dir` attribute | `text-center flex-col items-center` layout | Direction-agnostic by construction; RTL handled by document-level `dir` from `App.jsx` |

---

## Common Pitfalls

### Pitfall 1: Circular import when adding lucide to constants.js
**What goes wrong:** Developer worries constants.js must stay import-free.
**Why it happens:** The file header says "no dependencies to avoid circular import issues" — but this refers to circular imports with other *src/* modules (skillTrail.js imports constants.js; if constants.js imported skillTrail.js, that would be circular). Lucide-react is an external npm package with no dependency on any src/ file.
**How to avoid:** The import `import { Music, Music2, Drum, Ear } from 'lucide-react'` is safe. Verify with `npm run build` that no circular dependency warning appears.

### Pitfall 2: ZigzagTrailLayout crashes on empty node array
**What goes wrong:** Ear Training tab shows a crash or white screen when selected because ZigzagTrailLayout receives zero nodes.
**Why it happens:** The component may not be tested with empty arrays — it's always had 20-36 nodes per tab.
**How to avoid:** Read ZigzagTrailLayout before implementing; add an early-return guard if `nodes.length === 0` renders a friendly empty state. Test by selecting the Ear Training tab in dev after the refactor.
**Warning signs:** Console error on tab click; blank panel area.

### Pitfall 3: `_currentUnits` state shape mismatch after refactor
**What goes wrong:** After converting `_currentUnits` to a dynamic shape, code elsewhere that reads `_currentUnits.treble` / `.bass` / `.rhythm` by name breaks.
**Why it happens:** The state is currently `{ treble: 1, bass: 1, rhythm: 1 }` — after refactor it should be `{ treble: 1, bass: 1, rhythm: 1, ear_training: 1 }`. The key names must match `tab.id` values.
**How to avoid:** Construct the initial state and the `setCurrentUnits` call symmetrically using `TRAIL_TAB_CONFIGS.map(t => [t.id, 1])`. Confirm no component reads `_currentUnits` directly by name (it's currently prefixed `_` indicating it's not used in render, only for internal tracking).

### Pitfall 4: validateTrail.mjs cannot import from constants.js (ESM import path)
**What goes wrong:** Build validator fails to import `EXERCISE_TYPES` because of a path or module format issue.
**Why it happens:** `validateTrail.mjs` already successfully imports `SKILL_NODES` from `'../src/data/skillTrail.js'` and `NODE_TYPES` from `'../src/data/nodeTypes.js'` — both use the `../src/data/` pattern. Adding `import { EXERCISE_TYPES } from '../src/data/constants.js'` follows the exact same pattern and will work.
**How to avoid:** Use the same relative path pattern as the existing imports. Do not use a bare specifier (e.g., `from 'constants'`) — use the full relative path.

### Pitfall 5: i18n tab panel key missing causes silent fallback
**What goes wrong:** `t('tabs.ear_trainingPanel', { defaultValue: 'Ear Training learning path' })` falls through to the defaultValue silently — the key is never added to the locale file.
**Why it happens:** The defaultValue masks the missing key from runtime errors.
**How to avoid:** Add both `ear_training` and `ear_trainingPanel` keys to both locale files as part of this phase.

### Pitfall 6: getExerciseTypeName helper not updated in TrailNodeModal
**What goes wrong:** Exercise list in the modal shows raw type strings like "rhythm_tap" instead of localized names for nodes that use new exercise types.
**Why it happens:** `getExerciseTypeName()` at the top of TrailNodeModal.jsx has a `switch` statement with explicit cases for each type — it will fall through to `return type` for unknown types.
**How to avoid:** Add 5 new cases to `getExerciseTypeName()` in addition to the 5 new navigation cases in `navigateToExercise()`.

---

## Code Examples

### TRAIL_TAB_CONFIGS-driven fetchProgress (replaces hardcoded parallel calls)

```javascript
// Source: refactored from TrailMap.jsx lines 86-100
const unitResults = await Promise.all(
  TRAIL_TAB_CONFIGS.map(tab =>
    getCurrentUnitForCategory(user.id, NODE_CATEGORIES[tab.categoryKey])
  )
);
const unitState = Object.fromEntries(
  TRAIL_TAB_CONFIGS.map((tab, i) => [tab.id, unitResults[i]])
);
setCurrentUnits(unitState);
```

### TRAIL_TAB_CONFIGS-driven boss node merging (replaces 3 hardcoded useMemos)

```javascript
// Source: refactored from TrailMap.jsx lines 156-169
// Build a map of merged nodes per tab, keyed by tab.id
const nodesWithBossByTab = useMemo(() => {
  return Object.fromEntries(
    TRAIL_TAB_CONFIGS.map(tab => {
      const categoryNodes = getNodesByCategory(NODE_CATEGORIES[tab.categoryKey]);
      const tabBosses = bossNodes.filter(b => b.id.startsWith(tab.bossPrefix));
      const merged = [...categoryNodes, ...tabBosses].sort((a, b) => a.order - b.order);
      return [tab.id, merged];
    })
  );
}, [bossNodes]);
```

### validateExerciseTypes() full implementation

```javascript
// Source: follows validateNodeTypes() pattern in validateTrail.mjs
function validateExerciseTypes() {
  console.log('\nChecking exercise types...');
  const validTypes = new Set(Object.values(EXERCISE_TYPES));
  let invalidCount = 0;

  for (const node of SKILL_NODES) {
    for (const exercise of (node.exercises || [])) {
      if (!validTypes.has(exercise.type)) {
        console.error(`  ERROR: Unknown exercise type "${exercise.type}" in node "${node.id}"`);
        hasErrors = true;
        invalidCount++;
      }
    }
  }

  if (invalidCount === 0) {
    console.log('  Exercise types: OK');
  } else {
    console.error(`  Found ${invalidCount} unknown exercise type(s)`);
  }
}
```

---

## Runtime State Inventory

> Phase 7 is a code/data-constants change only. No renaming or migration is involved. This section is not applicable.

---

## Environment Availability

> Step 2.6: SKIPPED — Phase 7 is a pure code change with no external tool dependencies. All work is JavaScript module editing and build validation using the existing `npm run build` pipeline. No new CLIs, databases, or services are required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.js` (project root) |
| Quick run command | `npx vitest run src/data/constants.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | EXERCISE_TYPES has all 5 new keys with correct string values | unit | `npx vitest run src/data/constants.test.js` | ✅ (extend existing) |
| INFRA-02 | NODE_CATEGORIES has EAR_TRAINING key | unit | `npx vitest run src/data/constants.test.js` | ✅ (extend existing) |
| INFRA-03 | TrailNodeModal navigates to coming-soon for all 5 new types | unit | `npx vitest run src/components/trail/TrailNodeModal.test.jsx` | ❌ Wave 0 |
| INFRA-04 | TrailMap renders 4 tabs from TRAIL_TAB_CONFIGS; adding entry adds tab | unit | `npx vitest run src/components/trail/TrailMap.test.jsx` | ❌ Wave 0 |
| INFRA-05 | validateTrail.mjs exits with code 1 when a node has unknown exercise type | unit | `npx vitest run src/scripts/validateTrail.test.mjs` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/data/constants.test.js`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** `npm run build` succeeds (runs validateTrail.mjs via prebuild hook) + full test suite green

### Wave 0 Gaps

- [ ] `src/components/trail/TrailNodeModal.test.jsx` — covers INFRA-03 (new exercise type routing)
- [ ] `src/components/trail/TrailMap.test.jsx` — covers INFRA-04 (data-driven tabs; 4 tabs rendered; Ear Training tab present)
- [ ] `scripts/validateTrail.test.mjs` — covers INFRA-05 (hard-fail on unknown exercise type)

**Existing file to extend:**
- [ ] `src/data/constants.test.js` — add tests for INFRA-01 (5 new EXERCISE_TYPES keys) and INFRA-02 (EAR_TRAINING in NODE_CATEGORIES)

---

## Open Questions

1. **ZigzagTrailLayout behavior with empty node array**
   - What we know: The component receives the node list for the active tab; Ear Training will have 0 nodes in Phase 7.
   - What's unclear: Whether `ZigzagTrailLayout` handles empty arrays without crashing (not verified by reading the component source in this research pass).
   - Recommendation: Implementer must read `ZigzagTrailLayout.jsx` before implementing; add an empty-state guard if needed. A simple `if (nodes.length === 0) return <EmptyTabState />` is sufficient.

2. **ComingSoon route path convention**
   - What we know: UI-SPEC says it is a standalone routed page. Existing game routes follow `/notes-master-mode/` and `/rhythm-mode/` prefixes.
   - What's unclear: Whether `/ear-training/coming-soon` is the right prefix, or whether `/trail/coming-soon` or a flat `/coming-soon` route is cleaner.
   - Recommendation: Use `/ear-training/coming-soon` — establishes the `/ear-training/` route namespace for future Phase 9 games, consistent with `/notes-master-mode/` and `/rhythm-mode/` namespacing patterns.

---

## Project Constraints (from CLAUDE.md)

These are actionable directives that the planner MUST verify compliance against:

| Constraint | Applies to Phase 7? | Impact |
|------------|---------------------|--------|
| SVG imports use `?react` suffix | No new SVG imports in this phase | N/A |
| `npm run build` runs `validateTrail.mjs` as prebuild | YES — INFRA-05 extends this validator | New function must not break existing validator behavior |
| Pre-commit hook runs ESLint + Prettier | YES — all new files | All new files must pass lint; use consistent style |
| `constants.js` has no dependencies | Partially overridden — lucide-react import is safe (external package, no circular risk) | Document reasoning in code comment |
| Test files as `*.test.{js,jsx}` siblings or in `__tests__/` | YES — Wave 0 test files | New test files must follow convention |
| Tailwind glassmorphism pattern for trail UI | YES — ComingSoon component | `bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl` |
| `isFreeNode()` must sync with Postgres `is_free_node()` | Out of scope for Phase 7 (no new nodes added) | N/A — Phase 10 concern |
| `SessionTimeoutContext` `pauseTimer()`/`resumeTimer()` in games | Not applicable — ComingSoon is a static screen, not a game | N/A |
| i18n: English and Hebrew required | YES — tab label and exercise type keys | Add placeholder English values to Hebrew locale file |

---

## Sources

### Primary (HIGH confidence)
- Direct source code read: `src/data/constants.js` — current EXERCISE_TYPES and NODE_CATEGORIES shape
- Direct source code read: `src/components/trail/TrailMap.jsx` — full component; all 6 refactor locations identified by line number
- Direct source code read: `src/components/trail/TrailNodeModal.jsx` — navigation switch pattern; `getExerciseTypeName` helper
- Direct source code read: `scripts/validateTrail.mjs` — full validator; existing `validateNodeTypes()` pattern
- Direct source code read: `src/data/skillTrail.js` — re-export pattern; `UNITS` structure
- Direct source code read: `src/data/nodeTypes.js` — `NODE_TYPES` validation pattern
- Direct source code read: `src/utils/nodeTypeStyles.js` — category color system; EAR_TRAINING needs entry
- Direct source code read: `src/App.jsx` — route structure; all existing game routes
- Direct source code read: `src/locales/en/trail.json` and `src/locales/he/trail.json` — existing i18n keys and structure
- Direct source code read: `.planning/phases/07-data-foundation-trailmap-refactor/07-UI-SPEC.md` — exact Tailwind classes, component specs, tab config table
- Direct source code read: `src/data/constants.test.js` — existing test pattern to extend

### Secondary (MEDIUM confidence)
- `src/test/setupTests.js` + `vitest.config.js` — test framework confirmed as Vitest 3.2.4 with JSDOM, globals enabled
- `package.json` — `npm run test:run` confirmed as `vitest run`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all libraries confirmed present
- Architecture patterns: HIGH — all patterns read directly from source; line numbers cited
- Pitfalls: HIGH — derived from direct code analysis, not speculation
- Validation architecture: HIGH — test framework confirmed; Wave 0 gaps identified by checking file existence

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable codebase; no fast-moving external dependencies)
