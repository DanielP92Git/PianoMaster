# Phase 11: Integration, Gate, and i18n - Research

**Researched:** 2026-03-19
**Domain:** Trail wiring, subscription gating, i18n (EN + HE)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Hebrew key signature terminology:** "Major" = מז'ור (Mazhor). Key names use solfège: סול מז'ור (G Major), רה מז'ור (D Major), לה מז'ור (A Major), פה מז'ור (F Major), סי♭ מז'ור (Bb Major), מי♭ מז'ור (Eb Major)
- **Discovery node Hebrew:** הכירו את סול מז'ור (Meet G Major), etc.
- **Practice node Hebrew:** תרגול סול מז'ור (G Major Practice), etc.
- **Hebrew rhythm terminology:** Formal terms — משקל מורכב (mishkal murkav = compound meter), סינקופה (synkopa = syncopation)
- **Subscription gate:** Default-deny — NO changes to FREE_NODE_IDS or subscriptionConfig.js. All new nodes are automatically premium. No Postgres migration needed.
- **Unit metadata (UNITS object in skillTrail.js):** Backfill RHYTHM_5 and RHYTHM_6. Add TREBLE_6, TREBLE_7, BASS_6, BASS_7, RHYTHM_7, RHYTHM_8. Drop icon field from all new entries.
- **Unit names:** TREBLE_6 = 'Key Signatures: Sharps', TREBLE_7 = 'Key Signatures: Mixed', BASS_6/7 mirror treble. RHYTHM_5 = 'Dotted Notes', RHYTHM_6 = 'Rhythm Combos', RHYTHM_7 = 'Six-Eight Time', RHYTHM_8 = 'Off-Beat Magic'
- **Translation scope:** Node names (~42 entries), unit names (8), skill names (~8 new), accessory/badge names (8) — all in trail.json nodes/units.names/skillNames/accessories sections
- **newContentDescription:** SKIP — not rendered by any React component
- **expandedNodes.js import order:** treble → bass → rhythm, matching existing pattern

### Claude's Discretion

- Whether key sig nodes need a dedicated keyNames i18n section or if existing noteNames + node names are sufficient for TrailNodeModal display
- Exact Hebrew translations for rhythm node names (Two Big Beats, Off-Beat Surprise, Compound Cocktail, etc.)
- Exact reward badge IDs and display names for new units
- RHYTHM_5/6 backfill: descriptions, themes, reward badge names (derive from existing unit file headers)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTG-01 | All new unit files wired in expandedNodes.js with build-time validation passing | expandedNodes.js import + spread pattern documented; validateTrail.mjs auto-validates prerequisite chains and ordering; `npm run build` runs validateTrail.mjs as prebuild hook |
| INTG-02 | New nodes use default-deny subscription gate (no additions to FREE_NODE_IDS) | subscriptionConfig.js confirmed: FREE_NODE_IDS contains only Unit 1 IDs (19 total); isFreeNode() returns false for any ID not in the Set; all new IDs absent by design |
| INTG-03 | Full EN/HE i18n translations for all new node names, descriptions, and UI text | trail.json structure confirmed with nodes/units.names/skillNames/accessories sections; Hebrew solfège terminology pattern established from v2.2 accidentals phase |
</phase_requirements>

## Summary

Phase 11 is a wiring and translation phase — no new game logic or UI components. All six new unit files already exist as complete, tested modules. The work is: (1) add 6 imports + 6 spreads in expandedNodes.js, (2) add 8 UNITS entries (6 new + 2 backfill) in skillTrail.js, (3) add ~42 node name entries + 8 unit names + ~8 skill names + 8 accessory names across the EN and HE trail.json files.

The integration pattern is identical to v2.2 Phase 04 (accidentals integration). The subscription gate is already enforced via default-deny — no code changes required for INTG-02. The only non-trivial work in this phase is authoring the Hebrew translations for key signature and rhythm node names, which require applying the solfège conventions decided in 11-CONTEXT.md.

**Primary recommendation:** Execute in three sequential tasks — (1) wire expandedNodes.js, (2) wire UNITS metadata in skillTrail.js, (3) write EN/HE trail.json translations — then run `npm run build` as the integration gate check.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node ES modules | n/a | expandedNodes.js import/export | Existing pattern; all unit files use named + default exports |
| i18next | project-installed | Translation key lookup for trail display | Already wired; trail.json is the resource file |
| Vitest | project-installed | Test runner for unit file tests | rhythmUnit7 and rhythmUnit8 tests exist and pass |

### Build Validation

| Script | Command | What It Checks |
|--------|---------|---------------|
| `npm run build` | runs validateTrail.mjs as prebuild | Prerequisite chains, duplicate IDs, node ordering |
| `npm run verify:trail` | `node scripts/validateTrail.mjs` | Same as above, standalone |
| `npm run verify:patterns` | `node scripts/patternVerifier.mjs` | Rhythm pattern definitions |
| `npm test` | Vitest (watch) | Unit-level node structure tests |
| `npm run test:run` | Vitest (single run) | Same, non-interactive |

## Architecture Patterns

### expandedNodes.js Import + Spread Pattern

The file has three sections: treble imports, bass imports, rhythm imports — each with a comment header. New imports append to the bottom of each section. Each unit provides a named export (e.g., `trebleUnit6Nodes`) AND a default export.

```javascript
// Source: src/data/expandedNodes.js (existing pattern)

// Key signature treble units
import trebleUnit6Nodes from './units/trebleUnit6Redesigned.js';
import trebleUnit7Nodes from './units/trebleUnit7Redesigned.js';

// Key signature bass units
import bassUnit6Nodes from './units/bassUnit6Redesigned.js';
import bassUnit7Nodes from './units/bassUnit7Redesigned.js';

// Advanced rhythm units
import rhythmUnit7Nodes from './units/rhythmUnit7Redesigned.js';
import rhythmUnit8Nodes from './units/rhythmUnit8Redesigned.js';
```

Four arrays must be updated:
- `EXPANDED_NODES` — the main combined array
- `EXPANDED_TREBLE_NODES` — treble-only category export
- `EXPANDED_BASS_NODES` — bass-only category export
- `EXPANDED_RHYTHM_NODES` — rhythm-only category export

### UNITS Object Pattern in skillTrail.js

New entries follow the same shape as existing entries. Icon field is **dropped** for all new entries (UnitProgressCard does not render it). The UNITS object currently ends at RHYTHM_4; RHYTHM_5 and RHYTHM_6 are missing (backfill needed).

```javascript
// Source: src/data/skillTrail.js (existing shape, with icon dropped for new entries)
TREBLE_6: {
  id: 'treble_unit_6',
  category: NODE_CATEGORIES.TREBLE_CLEF,
  name: 'Key Signatures: Sharps',
  description: 'Read music in G major and D major',
  order: 6,
  theme: 'Sharp Keys',
  reward: {
    type: 'accessory',
    id: 'treble_keysig_sharps_badge',
    name: 'Sharp Keys Badge'
  }
},
```

Existing entries with icon field: TREBLE_1 through BASS_5, RHYTHM_1 through RHYTHM_4. New entries (RHYTHM_5, RHYTHM_6, TREBLE_6, TREBLE_7, BASS_6, BASS_7, RHYTHM_7, RHYTHM_8) omit icon.

### trail.json Translation Structure

Both `src/locales/en/trail.json` and `src/locales/he/trail.json` have four sections that need new entries:

1. **`units.names`** — keyed by the English unit name string (e.g., `"Key Signatures: Sharps"`)
2. **`nodes`** — keyed by the English node name string (e.g., `"Meet G Major"`)
3. **`skillNames`** — keyed by skill ID string (e.g., `"68_compound_meter"`)
4. **`accessories`** — keyed by accessory ID string (e.g., `"compound_badge"`)

The EN trail.json entries are identity mappings (value = key) with Unicode music symbols where applicable (♯ not #, ♭ not b). The HE trail.json entries use Hebrew solfège.

**Critical: Key lookup mechanism.** The `translateNodeName.js` and `translateUnitName.js` utilities look up by English name string as the key. This means the EN trail.json `nodes` and `units.names` keys must exactly match the `name` field in the unit JS files.

### Hebrew Translation Pattern (Established in v2.2)

From the existing HE trail.json pattern:
- "Meet X" → "הכירו את X" (plural friendly imperative)
- "Practice X" → "תרגול X" (noun form, not imperative)
- Key names use solfège + מז'ור: G Major → סול מז'ור, D Major → רה מז'ור
- Rhythm formal terms: compound meter → משקל מורכב, syncopation → סינקופה

## Complete Node Inventory

### Nodes to translate (42 entries — derived from source files)

**trebleUnit6 (4 nodes):** Meet G Major, G Major Practice, Meet D Major, D Major Practice

**trebleUnit7 (10 nodes):** Meet A Major, A Major Practice, Meet F Major, F Major Practice, Meet Bb Major, Bb Major Practice, Meet Eb Major, Eb Major Practice, Key Sig Memory Mix-Up, Key Signature Master

**bassUnit6 (4 nodes):** Meet G Major, Meet D Major, G Major Practice, D Major Practice
  — NOTE: These are shared names with treble unit 6. Only ONE entry needed per name in trail.json (translations apply across both clefs).

**bassUnit7 (10 nodes):** Meet A Major, A Major Practice, Meet F Major, F Major Practice, Meet Bb Major, Bb Major Practice, Meet Eb Major, Eb Major Practice, Key Sig Memory Mix-Up, Key Signature Master
  — NOTE: All 10 names are identical to trebleUnit7. No new entries needed for bassUnit7 node names in trail.json.

**rhythmUnit7 (7 nodes):** Two Big Beats, Feel the Pulse, Adding Quarters, Mixing It Up, Compound Cocktail, Quick Beats, Compound Commander

**rhythmUnit8 (7 nodes):** Off-Beat Surprise, Between the Beats, Dotted Groove, Swing and Sway, Syncopation Shuffle, Rapid Syncopation, Rhythm Master

**Effective new node name entries:** trebleUnit6 (4) + trebleUnit7 (10) + rhythmUnit7 (7) + rhythmUnit8 (7) = 28 unique new names. (Bass unit names overlap treble — already covered.)

### Unit names to add (8 entries)

| UNITS Key | name string | Description (for UNITS object) |
|-----------|-------------|-------------------------------|
| RHYTHM_5 | 'Magic Dots' | Dotted notes and 3/4 time (from rhythmUnit5 source file header) |
| RHYTHM_6 | 'Speed Champions' | Sixteenth notes, capstone of basic rhythm |
| TREBLE_6 | 'Key Signatures: Sharps' | G major and D major sight reading |
| TREBLE_7 | 'Key Signatures: Mixed' | A major plus flat key signatures |
| BASS_6 | 'Key Signatures: Sharps' | G major and D major in bass clef |
| BASS_7 | 'Key Signatures: Mixed' | A major plus flat key signatures in bass clef |
| RHYTHM_7 | 'Six-Eight Time' | 6/8 compound meter (CONTEXT.md renamed from 'Big Beats') |
| RHYTHM_8 | 'Off-Beat Magic' | Syncopation patterns |

NOTE: rhythmUnit5Redesigned.js uses `UNIT_NAME = 'Magic Dots'` and rhythmUnit6Redesigned.js uses `UNIT_NAME = 'Speed Champions'`. The UNITS backfill entries must use these exact strings to match the unitName fields in the existing node objects.

NOTE: rhythmUnit7Redesigned.js uses `UNIT_NAME = 'Big Beats'` (the old name). The CONTEXT.md decision renames RHYTHM_7 to 'Six-Eight Time' for the UNITS metadata display name — but the `unitName` field in the node objects says 'Big Beats'. The UNITS metadata `name` field does NOT have to match node.unitName exactly; it is used for display in UnitProgressCard. This discrepancy is intentional and acceptable.

### Skill names to add (new IDs from unit files)

From rhythmUnit7: `68_compound_meter`, `quarter_note_68`, `eighth_note_68`
From rhythmUnit8: `syncopation_eighth_quarter`, `syncopation_dotted_quarter`

These 5 new skill IDs need entries in both EN and HE `skillNames` sections.

### Accessory IDs to add

From rhythmUnit7: `compound_badge` (accessoryUnlock on boss_rhythm_7)
From rhythmUnit8: `advanced_rhythm_badge` (accessoryUnlock on boss_rhythm_8)
From trebleUnit7: `boss_treble_keysig` has `accessoryUnlock: null` — no accessory
From bassUnit7: `boss_bass_keysig` has `accessoryUnlock: null` — no accessory

For the 8 new UNITS entries, reward.id values need to be chosen (Claude's discretion). Existing rhythm badges use pattern `rhythm_badge_N`. New suggestions:
- RHYTHM_5: `rhythm_badge_5` (already in EN trail.json as "Rhythm Badge V")
- RHYTHM_6: `rhythm_champion_badge` (already in EN trail.json as "Rhythm Champion Badge")
- TREBLE_6: `treble_keysig_sharps_badge`
- TREBLE_7: `treble_keysig_master_badge`
- BASS_6: `bass_keysig_sharps_badge`
- BASS_7: `bass_keysig_master_badge`
- RHYTHM_7: `compound_badge` (also the node accessory — the UNITS reward.id echoes it)
- RHYTHM_8: `advanced_rhythm_badge` (also the node accessory)

This means `rhythm_badge_5` and `rhythm_champion_badge` are already in the accessories section of trail.json and just need UNITS entries pointing to them. The key sig and rhythm 7/8 badge IDs will need new accessories entries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Subscription gating of new nodes | Adding IDs to FREE_NODE_IDS | Default-deny (do nothing) | isFreeNode() returns false for any ID not in the Set — the gate already works |
| Prerequisite validation | Manual chain checking | `npm run verify:trail` | validateTrail.mjs runs DFS cycle detection on all 93+ nodes |
| Build-time correctness | Custom validation | `npm run build` (prebuild hook) | validateTrail.mjs is a prebuild hook — build fails on invalid trail data |
| Translation lookup | Custom translation functions | Existing translateNodeName.js / i18next | Utilities already resolve from trail.json by English key |

## Common Pitfalls

### Pitfall 1: Missing spread in category-specific exports

**What goes wrong:** Adding to `EXPANDED_NODES` but forgetting to add to `EXPANDED_TREBLE_NODES`, `EXPANDED_BASS_NODES`, or `EXPANDED_RHYTHM_NODES`. The build passes but `getNodesByCategory()` returns wrong counts.

**Why it happens:** expandedNodes.js has 4 separate arrays. All 4 must be updated in parallel.

**How to avoid:** Add all 6 spreads at once — update all 4 arrays in a single edit, not one at a time.

**Warning signs:** Trail UI shows correct total node count but category tabs show wrong counts. `getNodesByCategory('treble_clef').length` differs from expected.

### Pitfall 2: Trail.json key mismatch with node name field

**What goes wrong:** A trail.json node entry key doesn't exactly match the `name` field in the unit JS file. The translateNodeName utility falls back to the English node name (not a crash), but the Hebrew translation silently fails — the node shows English in the HE locale.

**Why it happens:** Copy-paste errors, or using the unitName instead of the node name as the key.

**How to avoid:** Copy node `name` values directly from the unit source files. Cross-check `"Meet G Major"` matches exactly.

**Warning signs:** Hebrew locale shows English text for specific nodes while other nodes translate correctly.

### Pitfall 3: Shared node names between treble and bass

**What goes wrong:** Realizing that treble and bass unit 6 both have a node named "Meet G Major". This is NOT a problem — trail.json uses a flat key namespace, so one entry covers both. But adding duplicate keys would cause a JSON parsing failure or silent override.

**Why it happens:** Assuming each unit needs its own translation entries regardless of name overlap.

**How to avoid:** Check that trebleUnit6 and trebleUnit7 names cover all bassUnit6 and bassUnit7 names. They do — bass unit names are identical to treble unit names. Add each name only once.

### Pitfall 4: UNITS entry name mismatch with node.unitName

**What goes wrong:** UNITS.RHYTHM_7.name = 'Six-Eight Time' but rhythmUnit7Redesigned.js nodes have `unitName: 'Big Beats'`. If any consumer tries to look up by `node.unitName`, it won't find the UNITS entry.

**Why it happens:** CONTEXT.md renamed the display name but the source file wasn't changed.

**How to avoid:** Understand that UNITS metadata `name` is used for display in UnitProgressCard — the lookup is by UNITS key (e.g., `UNITS.RHYTHM_7`), not by `node.unitName`. The mismatch is harmless for the current rendering path.

**Warning signs:** Would only matter if a future component traverses UNITS by name string. For now, no impact.

### Pitfall 5: Forgetting skillNames section causes TrailNodeModal bubble failure

**What goes wrong:** New skill IDs (`68_compound_meter`, `syncopation_eighth_quarter`, etc.) appear in node.skills arrays. TrailNodeModal renders skill bubbles by looking up `skillNames[skillId]`. Missing entries cause the bubble to show the raw ID string instead of a human-readable label.

**Why it happens:** Node skills arrays are added in unit files but trail.json skillNames requires separate update.

**How to avoid:** Add all 5 new skill IDs to skillNames in both EN and HE trail.json as part of the i18n task.

### Pitfall 6: Accessory ID in unit file doesn't match trail.json accessories

**What goes wrong:** boss_rhythm_7 uses `accessoryUnlock: 'compound_badge'` and boss_rhythm_8 uses `accessoryUnlock: 'advanced_rhythm_badge'`. If these IDs aren't in the `accessories` section of trail.json, the VictoryScreen or TrailNodeModal shows a raw ID string instead of the badge name.

**Why it happens:** Unit files define the accessory ID; trail.json must mirror it.

**How to avoid:** Add `compound_badge` and `advanced_rhythm_badge` entries to accessories in both EN and HE trail.json.

## Code Examples

### expandedNodes.js — complete updated structure

```javascript
// Source: src/data/expandedNodes.js — full file after update

import trebleUnit1Nodes from './units/trebleUnit1Redesigned.js';
import trebleUnit2Nodes from './units/trebleUnit2Redesigned.js';
import trebleUnit3Nodes from './units/trebleUnit3Redesigned.js';
import trebleUnit4Nodes from './units/trebleUnit4Redesigned.js';
import trebleUnit5Nodes from './units/trebleUnit5Redesigned.js';
// Key signature treble units
import trebleUnit6Nodes from './units/trebleUnit6Redesigned.js';
import trebleUnit7Nodes from './units/trebleUnit7Redesigned.js';

import bassUnit1Nodes from './units/bassUnit1Redesigned.js';
import bassUnit2Nodes from './units/bassUnit2Redesigned.js';
import bassUnit3Nodes from './units/bassUnit3Redesigned.js';
import bassUnit4Nodes from './units/bassUnit4Redesigned.js';
import bassUnit5Nodes from './units/bassUnit5Redesigned.js';
// Key signature bass units
import bassUnit6Nodes from './units/bassUnit6Redesigned.js';
import bassUnit7Nodes from './units/bassUnit7Redesigned.js';

import rhythmUnit1Nodes from './units/rhythmUnit1Redesigned.js';
import rhythmUnit2Nodes from './units/rhythmUnit2Redesigned.js';
import rhythmUnit3Nodes from './units/rhythmUnit3Redesigned.js';
import rhythmUnit4Nodes from './units/rhythmUnit4Redesigned.js';
import rhythmUnit5Nodes from './units/rhythmUnit5Redesigned.js';
import rhythmUnit6Nodes from './units/rhythmUnit6Redesigned.js';
// Advanced rhythm units
import rhythmUnit7Nodes from './units/rhythmUnit7Redesigned.js';
import rhythmUnit8Nodes from './units/rhythmUnit8Redesigned.js';

export const EXPANDED_NODES = [
  ...trebleUnit1Nodes, ...trebleUnit2Nodes, ...trebleUnit3Nodes,
  ...trebleUnit4Nodes, ...trebleUnit5Nodes,
  ...trebleUnit6Nodes, ...trebleUnit7Nodes,    // Key signature units
  ...bassUnit1Nodes, ...bassUnit2Nodes, ...bassUnit3Nodes,
  ...bassUnit4Nodes, ...bassUnit5Nodes,
  ...bassUnit6Nodes, ...bassUnit7Nodes,        // Bass key signature units
  ...rhythmUnit1Nodes, ...rhythmUnit2Nodes, ...rhythmUnit3Nodes,
  ...rhythmUnit4Nodes, ...rhythmUnit5Nodes, ...rhythmUnit6Nodes,
  ...rhythmUnit7Nodes, ...rhythmUnit8Nodes,    // Advanced rhythm units
];

export const EXPANDED_TREBLE_NODES = [
  ...trebleUnit1Nodes, ...trebleUnit2Nodes, ...trebleUnit3Nodes,
  ...trebleUnit4Nodes, ...trebleUnit5Nodes,
  ...trebleUnit6Nodes, ...trebleUnit7Nodes,
];
export const EXPANDED_BASS_NODES = [
  ...bassUnit1Nodes, ...bassUnit2Nodes, ...bassUnit3Nodes,
  ...bassUnit4Nodes, ...bassUnit5Nodes,
  ...bassUnit6Nodes, ...bassUnit7Nodes,
];
export const EXPANDED_RHYTHM_NODES = [
  ...rhythmUnit1Nodes, ...rhythmUnit2Nodes, ...rhythmUnit3Nodes,
  ...rhythmUnit4Nodes, ...rhythmUnit5Nodes, ...rhythmUnit6Nodes,
  ...rhythmUnit7Nodes, ...rhythmUnit8Nodes,
];
```

### UNITS backfill entries for skillTrail.js

```javascript
// Source: derived from rhythmUnit5Redesigned.js and rhythmUnit6Redesigned.js source files
// These go in the RHYTHM UNITS section of the UNITS object

RHYTHM_5: {
  id: 'rhythm_unit_5',
  category: NODE_CATEGORIES.RHYTHM,
  name: 'Magic Dots',          // Must match UNIT_NAME in rhythmUnit5Redesigned.js
  description: 'Dotted notes and 3/4 time',
  order: 5,
  theme: 'The Power of the Dot',
  reward: {
    type: 'accessory',
    id: 'rhythm_badge_5',
    name: 'Rhythm Badge V'
  }
},
RHYTHM_6: {
  id: 'rhythm_unit_6',
  category: NODE_CATEGORIES.RHYTHM,
  name: 'Speed Champions',     // Must match UNIT_NAME in rhythmUnit6Redesigned.js
  description: 'Master sixteenth notes — the fastest duration',
  order: 6,
  theme: 'Speed Mastery',
  reward: {
    type: 'accessory',
    id: 'rhythm_champion_badge',
    name: 'Rhythm Champion Badge'
  }
},
```

### Hebrew trail.json — key signature node names pattern

```json
// Source: 11-CONTEXT.md decisions + existing Hebrew solfège pattern from trail.json
// Pattern: Discovery = "הכירו את [key-in-solfège]", Practice = "תרגול [key-in-solfège]"
{
  "nodes": {
    "Meet G Major": "הכירו את סול מז'ור",
    "G Major Practice": "תרגול סול מז'ור",
    "Meet D Major": "הכירו את רה מז'ור",
    "D Major Practice": "תרגול רה מז'ור",
    "Meet A Major": "הכירו את לה מז'ור",
    "A Major Practice": "תרגול לה מז'ור",
    "Meet F Major": "הכירו את פה מז'ור",
    "F Major Practice": "תרגול פה מז'ור",
    "Meet Bb Major": "הכירו את סי♭ מז'ור",
    "Bb Major Practice": "תרגול סי♭ מז'ור",
    "Meet Eb Major": "הכירו את מי♭ מז'ור",
    "Eb Major Practice": "תרגול מי♭ מז'ור",
    "Key Sig Memory Mix-Up": "זיכרון מפתחות",
    "Key Signature Master": "מאסטר סימני המפתח"
  }
}
```

### Hebrew trail.json — rhythm node names (Claude's discretion)

```json
// Recommended translations applying formal Hebrew music terms
{
  "nodes": {
    "Two Big Beats": "שתי פעימות גדולות",
    "Feel the Pulse": "הרגישו את הדופק",
    "Adding Quarters": "מוסיפים רבעים",
    "Mixing It Up": "מעורבבים",
    "Compound Cocktail": "קוקטייל משקל מורכב",
    "Quick Beats": "פעימות מהירות",
    "Compound Commander": "מפקד המשקל המורכב",
    "Off-Beat Surprise": "הפתעת הסינקופה",
    "Between the Beats": "בין הפעימות",
    "Dotted Groove": "גרוב מנוקד",
    "Swing and Sway": "נדנוד וסינקופה",
    "Syncopation Shuffle": "ערבוב סינקופות",
    "Rapid Syncopation": "סינקופה מהירה",
    "Rhythm Master": "מאסטר הקצב"
  }
}
```

### Hebrew skill names

```json
{
  "skillNames": {
    "68_compound_meter": "משקל מורכב 6/8",
    "quarter_note_68": "רבע ב-6/8",
    "eighth_note_68": "שמינית ב-6/8",
    "syncopation_eighth_quarter": "סינקופה: שמינית-רבע-שמינית",
    "syncopation_dotted_quarter": "סינקופה: רבע מנוקד"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| UNITS object had 4 rhythm entries | Now needs 8 rhythm entries | v2.4 milestone | Backfill RHYTHM_5/6, add RHYTHM_7/8 |
| expandedNodes.js covered Units 1-5 treble/bass, 1-6 rhythm | Needs Units 6-7 treble/bass, 7-8 rhythm | Phase 11 | 6 new imports + spreads |
| rhythmUnit7 file used UNIT_NAME = 'Big Beats' | CONTEXT.md renames display as 'Six-Eight Time' in UNITS | Phase 11 CONTEXT.md | UNITS entry uses renamed value; source file unchanged |

## Open Questions

1. **keyNames i18n section (Claude's discretion)**
   - What we know: TrailNodeModal shows key signatures via node names and skill bubbles. No dedicated `keyNames` section exists in trail.json.
   - What's unclear: Whether any component renders a standalone key name (e.g., "G Major") outside of a node name context.
   - Recommendation: No new keyNames section needed. Key signature concepts are surfaced through node names (already covered) and skill bubbles (covered by noteNames in trail.json). The existing noteNames section covers solfège note letters. The node translation entries cover "Meet G Major" / "G Major Practice" patterns.

2. **RHYTHM_5/6 reward badge assignments**
   - What we know: rhythm_badge_5 and rhythm_champion_badge are already in the accessories section of trail.json (confirmed from source). The UNITS object currently doesn't reference them.
   - What's unclear: Whether RHYTHM_5 should use rhythm_badge_5 or a new ID.
   - Recommendation: Use rhythm_badge_5 for RHYTHM_5 and rhythm_champion_badge for RHYTHM_6 — they already exist in trail.json and align semantically.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vite.config.js` (vitest configured via `test` key) |
| Quick run command | `npx vitest run src/data/units/` |
| Full suite command | `npm run test:run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTG-01 | expandedNodes.js imports and spreads all 6 new units; build passes | build | `npm run build` (prebuild runs validateTrail.mjs) | ✅ validateTrail.mjs exists |
| INTG-01 | Unit node counts are correct post-wiring | unit | `npx vitest run src/data/units/rhythmUnit7Redesigned.test.js` | ✅ exists |
| INTG-01 | Prerequisite chain validates (boss_rhythm_7 → rhythm_8_1, boss_treble_accidentals → treble_6_1) | build | `npm run verify:trail` | ✅ exists |
| INTG-02 | isFreeNode() returns false for all new node IDs | manual | Inspect FREE_NODE_IDS set — new IDs not present | ✅ subscriptionConfig.js (no change needed) |
| INTG-03 | EN trail.json has entries for all new node names | unit | None automated — visual inspection during review | ❌ Wave 0 gap: no trail.json translation test |
| INTG-03 | HE trail.json has entries for all new node names | unit | None automated — visual inspection during review | ❌ Wave 0 gap |

### Sampling Rate

- **Per task commit:** `npm run verify:trail` (fast, no bundling)
- **Per wave merge:** `npm run build` (full prebuild validation)
- **Phase gate:** Full `npm run build` green + manual smoke test of HE locale before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No automated test for trail.json completeness — verify manually that all node names from the 6 unit files have entries in both EN and HE trail.json

*(Existing test infrastructure covers INTG-01 structurally via validateTrail.mjs. INTG-03 remains manual-only — acceptable for a data authoring task.)*

## Sources

### Primary (HIGH confidence)

- `src/data/expandedNodes.js` — Confirmed import/spread pattern; 4 arrays requiring update
- `src/data/skillTrail.js` — Confirmed UNITS object structure; confirmed RHYTHM_5/6 missing
- `src/config/subscriptionConfig.js` — Confirmed FREE_NODE_IDS contains only 19 Unit-1 IDs; default-deny already active
- `src/locales/en/trail.json` — Confirmed sections: units.names, nodes, skillNames, accessories; confirmed rhythm_badge_5 and rhythm_champion_badge already present
- `src/locales/he/trail.json` — Confirmed Hebrew solfège pattern: דיאז/במול, הכירו את / תרגול pattern
- `src/data/units/trebleUnit6Redesigned.js` — 4 nodes, IDs treble_6_1 through treble_6_4, orders 45-48
- `src/data/units/trebleUnit7Redesigned.js` — 10 nodes, IDs treble_7_1 through treble_7_9 + boss_treble_keysig, orders 49-58
- `src/data/units/bassUnit6Redesigned.js` — 4 nodes, IDs bass_6_1 through bass_6_4, orders 94-97
- `src/data/units/bassUnit7Redesigned.js` — 10 nodes, IDs bass_7_1 through bass_7_9 + boss_bass_keysig, orders 98-107
- `src/data/units/rhythmUnit7Redesigned.js` — 7 nodes, IDs rhythm_7_1 through rhythm_7_6 + boss_rhythm_7, orders 142-148
- `src/data/units/rhythmUnit8Redesigned.js` — 7 nodes, IDs rhythm_8_1 through rhythm_8_6 + boss_rhythm_8, orders 149-155
- `src/data/units/rhythmUnit5Redesigned.js` — UNIT_NAME = 'Magic Dots', orders 128-134
- `src/data/units/rhythmUnit6Redesigned.js` — UNIT_NAME = 'Speed Champions', orders 135-141
- `scripts/validateTrail.mjs` — Confirmed prebuild hook in package.json; validates prerequisite chains via DFS
- `.planning/milestones/v2.4-phases/11-integration-gate-and-i18n/11-CONTEXT.md` — Locked implementation decisions

### Secondary (MEDIUM confidence)

- `.planning/milestones/v2.2-phases/04-integration-gate-and-i18n/04-CONTEXT.md` — Precedent integration phase; same pattern for accidentals

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all files read directly; no external library research needed
- Architecture: HIGH — patterns extracted from existing source code
- Pitfalls: HIGH — derived from direct reading of all affected files and CONTEXT.md decisions
- Hebrew translations: MEDIUM — key signature terms verified from CONTEXT.md; rhythm node name translations are Claude's discretion (not yet confirmed by native speaker)

**Research date:** 2026-03-19
**Valid until:** Stable — this is a wiring phase against already-complete unit files. No external dependencies or fast-moving libraries involved.
