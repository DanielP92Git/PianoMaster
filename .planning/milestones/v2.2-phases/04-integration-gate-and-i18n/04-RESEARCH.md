# Phase 04: Integration, Gate, and i18n - Research

**Researched:** 2026-03-16
**Domain:** Trail integration, subscription gating, enharmonic pitch matching, i18n
**Confidence:** HIGH

## Summary

Phase 04 is a pure integration and correction phase. All four unit files (trebleUnit4Redesigned.js, trebleUnit5Redesigned.js, bassUnit4Redesigned.js, bassUnit5Redesigned.js) already exist with correct export names. The work is entirely mechanical wiring, targeted bug-fixing, and translation data entry — no structural decisions remain open.

The subscription gate requires zero code changes. New node IDs are absent from `FREE_NODE_IDS` by construction (default-deny), and the React UI gate in `TrailMap.jsx` iterates all nodes through `isFreeNode()` at render time. The database RLS enforces ownership-only for `student_skill_progress` writes — there is no `is_free_node()` Postgres function in the codebase; the DB does not enforce subscription gating on writes. INTG-02 verification is therefore a React UI smoke test only, not a DB 403 test.

The enharmonic bug is localized to two strict string comparisons in `SightReadingGame.jsx`. The `SEMITONE_MAP` at line 94 already has all enharmonic pairs. A helper reusing that map can normalize both the "is this pitch in the pattern" check (line 1607-1608) and the scoring check (line 1682) to MIDI values, fixing all five enharmonic pairs globally as decided.

The i18n work splits into two independent areas: (1) `noteNames` keys in `trail.json` for skill bubble lookup in `TrailNodeModal`, and (2) `nodes.*` entries for full node name translation used by `translateNodeName()`. The `translateNodeName()` fallback path does letter-by-letter replacement, but it does not handle multi-character keys like `F#` before `F` — this ordering risk is real only if the fallback path is hit, which it won't be for new nodes that have explicit `nodes.*` entries.

**Primary recommendation:** Work in four small, independent tasks: (1) wire expandedNodes.js, (2) smoke-test the gate, (3) patch enharmonic matching in SightReadingGame.jsx, (4) add i18n entries to both trail.json files.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Hebrew accidental naming
- Trail UI (node names, skill bubbles, VictoryScreen): use full Hebrew music terms - דיאז (diez) for sharp, במול (bemol) for flat
- Examples: F# -> פה דיאז, Bb -> סי במול, C# -> דו דיאז, Eb -> מי במול, Ab -> לה במול, Db -> רה במול, G# -> סול דיאז
- Game answer buttons: keep existing compact style with Unicode symbols (פה♯, סי♭) — no change to noteDefinitions.js
- VictoryScreen follows trail convention (פה דיאז / סי במול)

#### English accidental display
- Trail UI (node names, skill bubbles, VictoryScreen): use Unicode music symbols — F♯, B♭ (not keyboard chars F#, Bb)
- This applies to trail.json noteNames, translateNodeName output, and any trail-facing display

#### Enharmonic matching
- Fix ALL enharmonic pairs globally (C#=Db, D#=Eb, F#=Gb, G#=Ab, A#=Bb) — not just current flats in scope
- Fix applies to the pitch comparison in SightReadingGame.jsx where `detectedNote === matchingEvent.pitch`
- Regular flats nodes stay NOTE_RECOGNITION-only for now — no exercise changes
- Boss SIGHT_READING exercises with flats become active once nodes are wired in (this is intended behavior)

#### Subscription gate
- Trust default-deny: new node IDs are NOT in FREE_NODE_IDS (subscriptionConfig.js) or is_free_node() (Postgres) — automatically premium
- No migration needed for RLS — existing is_free_node() hardcoded array excludes new nodes by design
- No changes to subscriptionConfig.js — free tier boundary is Unit 1 only, unchanged
- Verification: manual test instruction in the plan (Supabase dashboard or curl to test INSERT rejection)

### Claude's Discretion
- Where to place the enharmonic mapping utility (new file vs inline in SightReadingGame)
- How translateNodeName.js handles two-char accidental patterns (must match "F#" before "F")
- Trail.json key naming for accidentals (e.g., "F#" vs "Fsharp")
- Build validation approach for expandedNodes.js integration
- How to update TrailNodeModal skill bubble lookups for accidental note keys

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTG-01 | New unit files wired into expandedNodes.js with build validator passing | Export names confirmed: trebleUnit4Nodes, trebleUnit5Nodes, bassUnit4Nodes, bassUnit5Nodes. expandedNodes.js pattern is 2 lines per unit (import + spread). validateTrail.mjs runs as prebuild via SKILL_NODES which consumes expandedNodes default export. |
| INTG-02 | New nodes confirmed premium at both React UI (isFreeNode) and database RLS layers | React UI: TrailMap.jsx iterates all nodes through isFreeNode() — new IDs not in FREE_NODE_IDS → automatically gold-locked. DB: existing RLS only enforces student_id = auth.uid() ownership, no is_free_node() enforcement on writes. Verification is a UI smoke test. |
| INTG-03 | Mic input enharmonic matching verified for sight reading exercises with flats | Two comparison points in SightReadingGame.jsx: line 1607-1608 (isExpectedPitch) and line 1682 (scoring). SEMITONE_MAP at line 94 already has all pairs. Fix: normalize both comparisons to MIDI via noteToMidi(). |
| I18N-01 | All new accidental note names have correct EN and HE translations | Two files need changes: src/locales/en/trail.json and src/locales/he/trail.json. Two sections per file: noteNames (7 accidental keys for skill bubbles) and nodes (all new node names). Node names use existing words — no new phrase translations needed beyond the accidental term pattern. |
</phase_requirements>

---

## Standard Stack

### Core (no new dependencies)
| Asset | Current State | Phase 04 Role |
|-------|--------------|---------------|
| `src/data/expandedNodes.js` | Imports Units 1-3 treble/bass, Units 1-6 rhythm | Add 4 imports + 4 spreads |
| `src/config/subscriptionConfig.js` | FREE_NODE_IDS Set (19 IDs, Unit 1 only) | No changes — default-deny already works |
| `src/components/games/sight-reading-game/SightReadingGame.jsx` | Strict string comparison at line 1682 | Add enharmonic normalization |
| `src/locales/en/trail.json` | noteNames: C-B only; nodes: no accidentals | Add 7 noteNames + ~18 node entries |
| `src/locales/he/trail.json` | noteNames: דו-סי only; nodes: no accidentals | Add 7 noteNames + ~18 node entries |

### Supporting
| Asset | Purpose | Notes |
|-------|---------|-------|
| `scripts/validateTrail.mjs` | Checks prerequisite chains, duplicate IDs | Runs as `npm run verify:trail` and as `prebuild`; will catch missing prereq errors if new units wire incorrectly |
| `src/utils/translateNodeName.js` | Translates note letters in node names via `nodes.*` lookup | New node names ("Meet F Sharp", etc.) contain no raw note letters in `noteNames` key format — they use words. Full `nodes.*` entries eliminate fallback path risk. |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Pattern 1: expandedNodes.js Unit Integration

The file follows a strict two-step pattern per unit: one `import` statement at the top, one spread in `EXPANDED_NODES`. The category-grouped exports (`EXPANDED_TREBLE_NODES`, `EXPANDED_BASS_NODES`) must also include new unit spreads.

```javascript
// Source: src/data/expandedNodes.js (existing pattern)

// Add imports alongside existing treble imports:
import trebleUnit4Nodes from './units/trebleUnit4Redesigned.js';
import trebleUnit5Nodes from './units/trebleUnit5Redesigned.js';
import bassUnit4Nodes from './units/bassUnit4Redesigned.js';
import bassUnit5Nodes from './units/bassUnit5Redesigned.js';

// Add spreads in EXPANDED_NODES:
export const EXPANDED_NODES = [
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes,
  ...trebleUnit4Nodes,   // ADD
  ...trebleUnit5Nodes,   // ADD
  ...bassUnit1Nodes,
  ...bassUnit2Nodes,
  ...bassUnit3Nodes,
  ...bassUnit4Nodes,     // ADD
  ...bassUnit5Nodes,     // ADD
  ...rhythmUnit1Nodes,
  // ... rest unchanged
];

// Also update category exports:
export const EXPANDED_TREBLE_NODES = [
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes,
  ...trebleUnit4Nodes,   // ADD
  ...trebleUnit5Nodes,   // ADD
];
export const EXPANDED_BASS_NODES = [
  ...bassUnit1Nodes,
  ...bassUnit2Nodes,
  ...bassUnit3Nodes,
  ...bassUnit4Nodes,     // ADD
  ...bassUnit5Nodes,     // ADD
];
```

### Pattern 2: Enharmonic Normalization in SightReadingGame

The `SEMITONE_MAP` and `noteToMidi()` already exist at the top of `SightReadingGame.jsx` (lines 94-101). The fix is to use MIDI equivalence in both comparison points rather than string equality. The planner can choose between inlining or extracting a helper — both work.

**Comparison point 1 — "is this pitch in the pattern at all" (anti-cheat, line 1607-1608):**
```javascript
// Source: SightReadingGame.jsx lines 1607-1608 (existing, strict equality)
const isExpectedPitch = pattern?.notes?.some(
  (n) => n.pitch === detectedNote
);

// Fix: use MIDI equivalence (noteToMidi already defined at line 95)
const detectedMidi = noteToMidi(detectedNote);
const isExpectedPitch = pattern?.notes?.some(
  (n) => noteToMidi(n.pitch) === detectedMidi
);
```

**Comparison point 2 — scoring (line 1682):**
```javascript
// Source: SightReadingGame.jsx line 1682 (existing, strict equality)
if (detectedNote === matchingEvent.pitch) {

// Fix: use MIDI equivalence
if (noteToMidi(detectedNote) === noteToMidi(matchingEvent.pitch)) {
```

**Coverage:** This covers C#=Db, D#=Eb, F#=Gb, G#=Ab, A#=Bb as required. `SEMITONE_MAP` at line 94 already maps all five pairs to the same semitone number.

**Null safety:** `noteToMidi` returns `null` for unparseable input. The condition `noteToMidi(a) === noteToMidi(b)` evaluates to `false` when either is `null` (since `null === null` would be `true` but `noteToMidi` returns `null` only for invalid input, not valid notes). However, to be safe, guard: `const dm = noteToMidi(detectedNote); dm != null && dm === noteToMidi(matchingEvent.pitch)`.

### Pattern 3: trail.json noteNames for Skill Bubbles

`TrailNodeModal.jsx` line 315-317 extracts the note letter+accidental from skill entries via regex `/^([A-Ga-g][b#]?)(\d)$/`, uppercases group 1, then looks up `trail:noteNames.{KEY}`. Current keys are single letters (`C`-`B`). New keys must be the uppercase accidental form as it appears in the skills array.

Skills arrays in new unit files use the notation: `'F#4'`, `'C#4'`, `'G#4'`, `'Bb4'`, `'Eb4'`, `'Ab4'`, `'Db4'`, `'F#3'`, `'C#3'`, `'G#3'`, `'Bb3'`, `'Eb3'`, `'Ab3'`, `'Db3'`.

The regex captures `F#` from `F#4`, then `.toUpperCase()` gives `F#`. So the noteNames key for sharp F is `"F#"`. For flats, `Bb4` captures `Bb` which uppercased is `BB` — but `Bb`.toUpperCase() in JavaScript gives `"BB"`, not `"Bb"`.

**CRITICAL FINDING:** `'Bb'.toUpperCase()` === `"BB"` in JavaScript. The noteNames key for flat B will be looked up as `"BB"`, not `"Bb"`. The trail.json keys must match exactly what `.toUpperCase()` produces. Therefore flat accidental keys in trail.json must be uppercase: `"BB"`, `"EB"`, `"AB"`, `"DB"`.

Verification:
```
'Bb'.toUpperCase() === 'BB'   // true
'Eb'.toUpperCase() === 'EB'   // true
'Ab'.toUpperCase() === 'AB'   // true
'Db'.toUpperCase() === 'DB'   // true
'F#'.toUpperCase() === 'F#'   // true (# is not a letter)
'C#'.toUpperCase() === 'C#'   // true
'G#'.toUpperCase() === 'G#'   // true
```

So the noteNames section keys must be: `"F#"`, `"C#"`, `"G#"`, `"BB"`, `"EB"`, `"AB"`, `"DB"`.

### Pattern 4: trail.json nodes entries

`translateNodeName()` first checks `nodes.{nodeName}` for a full translation. If found, it returns it directly — the note-by-note fallback is never reached. All new node names must therefore have entries in both `en/trail.json` and `he/trail.json` under the `nodes` key.

New node names requiring entries (confirmed from unit files):

**Treble Unit 4 (sharps):** Meet F Sharp, Meet C Sharp, Meet G Sharp, Sharps Together, Sharps and Friends, Sharp Memory, Sharp Speed, Sharp Star

**Treble Unit 5 (flats):** Meet B Flat, Meet E Flat, Meet A Flat, Meet D Flat, Flats Together, Flats and Friends, Flat Memory, Flat Speed, Flat Star, Accidentals Master

**Bass Unit 4 (sharps):** Meet F Sharp (same as treble — reuses), Meet C Sharp, Meet G Sharp, Sharps Together, Sharps in Context, Sharp Memory, Sharp Speed, Sharp Star

**Bass Unit 5 (flats):** Meet B Flat, Meet E Flat, Meet A Flat, Meet D Flat, Flats Together, Flats in Context, Flat Memory, Flat Speed, Flat Master, Accidentals Master

Bass and treble share many node names. The `nodes` section is a flat key-value map, so a single entry covers all nodes with that name regardless of clef.

**Unique node names across all 4 units (deduped):**
Meet F Sharp, Meet C Sharp, Meet G Sharp, Sharps Together, Sharps and Friends, Sharp Memory, Sharp Speed, Sharp Star, Meet B Flat, Meet E Flat, Meet A Flat, Meet D Flat, Flats Together, Flats and Friends, Flat Memory, Flat Speed, Flat Star, Flat Master, Sharps in Context, Flats in Context, Accidentals Master

That is **21 unique node name keys** needed.

The `descriptions` section in trail.json is used for node descriptions (`t('descriptions.{nodeName}')`). These too need entries for each new node name.

### Pattern 5: English display — Unicode symbols in trail.json

Per the locked decision, English trail UI uses Unicode `♯` and `♭` (not `#` and `b`). This applies to:
- `noteNames` values (skill bubbles): `"F♯"`, `"C♯"`, `"G♯"`, `"B♭"`, `"E♭"`, `"A♭"`, `"D♭"`
- `nodes` values (node name translations): English translations are the same as the key since the keys use ASCII, but the values must substitute `♯`/`♭`

Since English `nodes.*` values are the same as the English node names (i.e., key = value for English), the only place the Unicode symbol substitution matters is the `noteNames` values. The node names "Meet F Sharp" and "Meet B Flat" use words, not symbols, so no substitution is needed in `nodes.*` values.

### Anti-Patterns to Avoid

- **Modifying subscriptionConfig.js**: No changes needed. New IDs are absent from `FREE_NODE_IDS` by construction.
- **Adding is_free_node() as a DB enforcement layer**: The existing RLS does not have this and CONTEXT.md explicitly says no DB migration needed for new nodes.
- **Putting accidental keys as `"Bb"` in trail.json**: `.toUpperCase()` converts `Bb` → `BB`. Keys must be `"BB"` to match the TrailNodeModal lookup.
- **Only fixing line 1682 in SightReadingGame**: Line 1607-1608's `isExpectedPitch` also uses strict equality and must be fixed or flat notes played correctly will increment anti-cheat counters.
- **Adding `translateNodeName` fallback logic for accidentals**: The fallback path is only reached when a `nodes.*` entry is missing. The correct fix is to add all `nodes.*` entries, not to extend the fallback.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MIDI number for enharmonic comparison | Custom enharmonic lookup table | `noteToMidi()` + `SEMITONE_MAP` already in SightReadingGame.jsx | Already handles all enharmonic pairs correctly |
| Flat→sharp conversion for mic output | New normalization utility | Fix at comparison site using MIDI values | MIDI is pitch-class agnostic; simpler and covers all pairs |
| Dynamic subscription gate | Node ID filtering logic | Existing `isFreeNode()` in subscriptionConfig.js | Static set, O(1) lookup, already wired into TrailMap.jsx |

---

## Common Pitfalls

### Pitfall 1: Flat Accidental Key Case in trail.json

**What goes wrong:** `TrailNodeModal.jsx` calls `.toUpperCase()` on the captured note+accidental. `'Bb'.toUpperCase()` returns `'BB'`. If trail.json has key `"Bb"` instead of `"BB"`, the skill bubble shows the raw key string as the default value.

**Why it happens:** Developers naturally use `"Bb"` as it looks correct. JavaScript `toUpperCase()` uppercases all letters including `b` in `b`.

**How to avoid:** Use all-caps keys for flat accidentals in noteNames: `"BB"`, `"EB"`, `"AB"`, `"DB"`.

**Warning signs:** Skill bubbles showing `"Bb"` or `"BB"` text instead of a Hebrew/English note name.

### Pitfall 2: Forgetting Both Comparison Points in SightReadingGame

**What goes wrong:** Fix line 1682 (scoring) but not line 1607-1608 (anti-cheat check). Playing Db4 when Db4 is in the note pool still correctly scores, but each correctly-played flat note increments the anti-cheat counter because `isExpectedPitch` returns false with strict string comparison (`detectedNote` is `'C#4'` from mic, pattern has `'Db4'`). After 5 such events in 1500ms, the game could lock the player out.

**Why it happens:** Line 1607 is a separate code path from the main scoring branch at 1682.

**How to avoid:** Fix both comparison points atomically in the same edit.

### Pitfall 3: EXPANDED_TREBLE_NODES / EXPANDED_BASS_NODES Category Exports Omission

**What goes wrong:** Adding new units to `EXPANDED_NODES` but forgetting to add them to `EXPANDED_TREBLE_NODES` and `EXPANDED_BASS_NODES`. Any code that imports these category-specific exports would miss the new nodes.

**Why it happens:** expandedNodes.js has three separate arrays to update, not just one.

**How to avoid:** Add spreads to all three locations (EXPANDED_NODES, EXPANDED_TREBLE_NODES, EXPANDED_BASS_NODES) in one edit.

### Pitfall 4: Missing descriptions entries alongside nodes entries

**What goes wrong:** Adding a `nodes.{name}` entry but forgetting `descriptions.{name}`. TrailNodeModal renders the description as `t('descriptions.{nodeName}', { defaultValue: node.description })` — it has a fallback to the node's own `description` field, so this won't crash. But the description will show the English in-code description even in Hebrew UI.

**How to avoid:** Add both `nodes` and `descriptions` entries for each new node name in both locale files.

### Pitfall 5: validateTrail.mjs vs verify:patterns confusion

**What goes wrong:** Running `npm run verify:patterns` (patternVerifier.mjs) to validate trail integration. This script tests `generatePatternData()` from patternBuilder — it does NOT validate trail node prerequisites or schema.

**How to avoid:** Run `npm run verify:trail` (validateTrail.mjs) to check prerequisite chains and duplicate IDs after wiring expandedNodes.js.

---

## Code Examples

### Enharmonic-safe pitch comparison

```javascript
// Source: SightReadingGame.jsx lines 94-101 (existing SEMITONE_MAP + noteToMidi)
// The fix uses these already-defined helpers

// At line 1607 — anti-cheat "is this pitch expected":
const detectedMidi = noteToMidi(detectedNote);
const isExpectedPitch = detectedMidi != null && pattern?.notes?.some(
  (n) => noteToMidi(n.pitch) === detectedMidi
);

// At line 1682 — scoring "did the player hit the right note":
const detectedMidi = noteToMidi(detectedNote);
const expectedMidi = noteToMidi(matchingEvent.pitch);
if (detectedMidi != null && expectedMidi != null && detectedMidi === expectedMidi) {
  // correct pitch — existing success branch unchanged
```

### trail.json noteNames entries (English)

```json
// Source: src/locales/en/trail.json — extend existing noteNames section
"noteNames": {
  "C": "C",
  "D": "D",
  "E": "E",
  "F": "F",
  "G": "G",
  "A": "A",
  "B": "B",
  "F#": "F♯",
  "C#": "C♯",
  "G#": "G♯",
  "BB": "B♭",
  "EB": "E♭",
  "AB": "A♭",
  "DB": "D♭"
}
```

### trail.json noteNames entries (Hebrew)

```json
// Source: src/locales/he/trail.json — extend existing noteNames section
"noteNames": {
  "C": "דו",
  "D": "רה",
  "E": "מי",
  "F": "פה",
  "G": "סול",
  "A": "לה",
  "B": "סי",
  "F#": "פה דיאז",
  "C#": "דו דיאז",
  "G#": "סול דיאז",
  "BB": "סי במול",
  "EB": "מי במול",
  "AB": "לה במול",
  "DB": "רה במול"
}
```

### Subscription gate verification (manual test)

The React UI gate is automatic once nodes appear in EXPANDED_NODES. Verification steps for INTG-02:

1. Open the trail as a free user (no active subscription)
2. Navigate to any new accidentals node (e.g., treble_4_1 "Meet F Sharp")
3. Confirm the node renders with gold color (isPremiumLocked state)
4. Tap the node — confirm TrailNodeModal shows premium paywall message (t('trail:modal.premiumMessage'))
5. Confirm the Start/Continue button is replaced by "Ask a parent to unlock!"

No Supabase RLS test is needed because the RLS INSERT policy only enforces `student_id = auth.uid()` — it does not block premium node writes from authenticated free users. The subscription enforcement is entirely at the React UI layer.

---

## Integration Points Detail

### expandedNodes.js wiring — complete change surface

File: `src/data/expandedNodes.js`

Changes needed:
1. Add 4 import lines (trebleUnit4Nodes, trebleUnit5Nodes, bassUnit4Nodes, bassUnit5Nodes)
2. Add 2 spreads to `EXPANDED_NODES` array (treble4 after treble3, bass4+5 after bass3)
3. Add 2 spreads to `EXPANDED_TREBLE_NODES` array
4. Add 2 spreads to `EXPANDED_BASS_NODES` array
5. Update file-header comment to reflect Units 1-5 for treble and bass

After wiring: run `npm run verify:trail` — expects 0 errors. The new units have prerequisites set correctly (treble_4_1 → boss_treble_3, treble_5_1 → boss_treble_4, bass_4_1 → boss_bass_3, bass_5_1 → boss_bass_4). These boss nodes are already in the trail via Units 3 (treble and bass), so the prerequisite chain will resolve.

### i18n — complete list of keys needed

**nodes section (same keys for both en and he, different values):**
```
Meet F Sharp, Meet C Sharp, Meet G Sharp,
Sharps Together, Sharps and Friends, Sharps in Context,
Sharp Memory, Sharp Speed, Sharp Star,
Meet B Flat, Meet E Flat, Meet A Flat, Meet D Flat,
Flats Together, Flats and Friends, Flats in Context,
Flat Memory, Flat Speed, Flat Star, Flat Master,
Accidentals Master
```

That is 21 unique keys. Both `en/trail.json` and `he/trail.json` need entries under `nodes` and `descriptions` for each.

**unlockHints section:** Boss nodes that have `unlockHint` fields in unit files also need `unlockHints.{nodeName}` entries. From the unit files: `Sharp Star` and `Flat Star` (treble units) and `Sharp Star`, `Flat Master`, `Accidentals Master` (bass units). Verify against unit file `unlockHint` fields during implementation.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual prerequisite linking via `linkUnitPrerequisites()` | Prerequisites set in unit files directly; `linkUnitPrerequisites` is a no-op pass-through | No runtime linking needed — just import and spread |
| String comparison for pitch matching | MIDI-based comparison (to be added) | Fixes all 5 enharmonic pairs atomically |

---

## Open Questions

1. **unlockHints entries needed?**
   - What we know: Boss nodes have `unlockHint` text in unit files; `TrailNodeModal.jsx` line 494 shows `t('trail:unlockHints.{nodeName}')` with no explicit fallback visible
   - What's unclear: Whether `unlockHint` text from unit files is used directly or only via i18n key
   - Recommendation: During implementation, grep for `unlockHint` usage in TrailNodeModal to confirm if i18n entries are needed or if the component reads `node.unlockHint` directly

2. **Null safety for double-null MIDI comparison**
   - What we know: `noteToMidi()` returns `null` for invalid input. `null === null` is `true` in JavaScript.
   - What's unclear: Can `matchingEvent.pitch` ever be null/undefined in production?
   - Recommendation: Guard both sides with `!= null` check as shown in Code Examples above

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.js |
| Quick run command | `npx vitest run` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTG-01 | expandedNodes.js includes all new units and trail validates | smoke | `npm run verify:trail` | ✅ scripts/validateTrail.mjs |
| INTG-02 | Free user sees paywall for new nodes | manual | n/a — UI smoke test | n/a |
| INTG-03 | Mic enharmonic matching: Db4 scores correct when Db4 is in pool | unit | `npx vitest run` (no test file yet for this) | ❌ Wave 0 |
| I18N-01 | Accidental note names display correctly in EN and HE | manual | n/a — visual verification | n/a |

### Sampling Rate
- **Per task commit:** `npm run verify:trail` (fast — validates prerequisite chains)
- **Per wave merge:** `npm run test:run`
- **Phase gate:** `npm run verify:trail` green + `npm run test:run` green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Test for enharmonic normalization in SightReadingGame — covers INTG-03. Since `handleNoteDetected` is deeply embedded in the component, consider unit-testing the extracted helper or the `noteToMidi` comparison logic directly.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/data/expandedNodes.js` — import/spread pattern
- Direct code inspection: `src/config/subscriptionConfig.js` — default-deny gate mechanism
- Direct code inspection: `src/components/trail/TrailMap.jsx` — isFreeNode() wiring and premiumLockedNodeIds computation
- Direct code inspection: `src/components/trail/TrailNodeModal.jsx` lines 314-317 — skill bubble noteNames lookup with `.toUpperCase()`
- Direct code inspection: `src/components/games/sight-reading-game/SightReadingGame.jsx` lines 94-101, 1607-1608, 1682 — SEMITONE_MAP, noteToMidi, comparison points
- Direct code inspection: `src/utils/translateNodeName.js` — full translation function
- Direct code inspection: `src/locales/en/trail.json` and `src/locales/he/trail.json` — current state
- Direct code inspection: `src/data/units/trebleUnit4Redesigned.js`, `trebleUnit5Redesigned.js`, `bassUnit4Redesigned.js`, `bassUnit5Redesigned.js` — export names, node names, skills arrays

### Secondary (MEDIUM confidence)
- JavaScript `.toUpperCase()` behavior for mixed-case accidental strings — verified by logic (`'Bb'.toUpperCase() === 'BB'`)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- INTG-01 (expandedNodes wiring): HIGH — export names confirmed, pattern is mechanical
- INTG-02 (subscription gate): HIGH — confirmed default-deny behavior; note that DB does NOT enforce subscription for writes (only ownership)
- INTG-03 (enharmonic fix): HIGH — both comparison points identified, SEMITONE_MAP already correct
- I18N-01 (translations): HIGH — 21 node name keys enumerated, flat key format (BB/EB/AB/DB) verified

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable codebase — no external dependencies changing)
