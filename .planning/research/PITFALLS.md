# Pitfalls Research: Sharps & Flats Content Expansion (v2.2)

**Domain:** Adding accidentals (sharps & flats) trail nodes to existing piano learning PWA
**Researched:** 2026-03-15
**Confidence:** HIGH (based on direct codebase review of all affected files + VexFlow v5 documented API)

---

## Context

This document covers common mistakes when **adding ~20 sharps/flats trail nodes** (treble Units 4-5,
bass Units 4-5, plus boss nodes) to the existing 93-node skill trail system. The codebase already
ships full SVG note-image assets for accidentals, partial audio support for sharps/flats in
`NotesRecognitionGame`, and VexFlow `Accidental` modifier usage in `VexFlowStaffDisplay`. However,
none of those systems have been exercised through the **trail routing layer** with accidental note
pools — all existing trail nodes have `accidentals: false` in their `noteConfig`.

Verified files:
- `src/data/units/trebleUnit3Redesigned.js` — last treble unit, all natural notes
- `src/data/units/bassUnit3Redesigned.js` — last bass unit, all natural notes
- `src/data/expandedNodes.js` — aggregator, no accidental units imported yet
- `src/data/skillTrail.js` — `UNITS.TREBLE_5` and `UNITS.BASS_5` already defined as stubs
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — `enableSharps: false`,
  `enableFlats: false` are hardcoded when auto-starting from trail (line 524-525)
- `src/components/games/sight-reading-game/utils/patternBuilder.js` — `toVexFlowNote` strips
  accidentals silently (line 60-73: only matches `/^([A-G])(\d+)$/`, no `#` or `b`)
- `src/config/subscriptionConfig.js` — explicit ID list, new nodes will be behind paywall by
  default (not added to `FREE_NODE_IDS`), which is correct for v2.2

---

## Critical Pitfalls

### Pitfall 1: Trail Auto-Start Hardcodes `enableSharps: false, enableFlats: false`

**What goes wrong:**
A new accidentals trail node navigates to `NotesRecognitionGame` with `nodeConfig.notePool` containing
e.g. `['F4', 'F#4', 'G4', 'Ab4']`. The auto-start effect on lines 518-536 builds `trailSettings`
with `enableSharps: false, enableFlats: false`. The `normalizeSelectedNotes` call then filters out
all accidental pitches — the game silently runs on natural notes only. The child gets an exercise
containing only F4 and G4, which looks like a different (easier) game than intended.

**Why it happens:**
The `enableSharps` / `enableFlats` flags were designed for the free-play settings panel. When the
trail drives the game, there is no settings panel, so those flags stay false. The auto-start block
that constructs `trailSettings` was written before accidentals nodes existed and never had a case
for them.

**How to avoid:**
In the auto-start effect, derive `enableSharps` and `enableFlats` from the `nodeConfig.notePool`
itself rather than hardcoding `false`:
```js
const hasSharps = (nodeConfig.notePool || []).some(p => p.includes('#'));
const hasFlats  = (nodeConfig.notePool || []).some(p => p.includes('b') && p.length > 2);
const trailSettings = {
  clef: nodeConfig.clef || 'treble',
  selectedNotes: nodeConfig.notePool || [],
  enableSharps: hasSharps,
  enableFlats:  hasFlats,
  timedMode: ...,
  timeLimit: ...,
};
```

**Warning signs:**
- Trail accidentals node launches but the note pool in the game UI only shows natural buttons.
- `console.debug("[PatternBuilder] ✗ Filtered out invalid pitch: F#4")` appears in dev console.
- 8-year-old completes the node easily because it only shows natural notes.

**Phase to address:** Data layer / trail node definitions phase (before any gameplay testing).

---

### Pitfall 2: `patternBuilder.toVexFlowNote` Strips Accidentals — Sight Reading Shows Wrong Pitches

**What goes wrong:**
`patternBuilder.js` line 60 matches pitch with `/^([A-G])(\d+)$/` — no accidental character.
`F#4` fails this regex and falls through to the fallback `{ keys: ["c/4"], duration: vexDuration }`.
The sight reading game renders random C4 notes instead of the correct sharp/flat pitches. Score
calculation then compares the player's detected pitch against C4 instead of F#4, making every
correct answer count as wrong.

**Why it happens:**
The pattern builder was written when all trail nodes had `accidentals: false`. The regex was
intentionally simple. There is a separate `parsePitchForVexflow` function in `VexFlowStaffDisplay`
that correctly handles accidentals (line 446-456), but `patternBuilder.toVexFlowNote` (the function
that constructs the `easyscoreString` and `vexflowNotes` array upstream) was never updated to match.

**How to avoid:**
Update `toVexFlowNote` in `patternBuilder.js` to match accidentals:
```js
const pitchMatch = obj.pitch.match(/^([A-G][#b]?)(\d+)$/);
if (pitchMatch) {
  const [, noteWithAcc, octave] = pitchMatch;
  return { keys: [`${noteWithAcc.toLowerCase()}/${octave}`], duration: vexDuration };
}
```
The VexFlow key format accepts `f#/4` and `ab/4` — no separate `Accidental` modifier is needed
in the EasyScore path; the modifier is only needed for the lower-level `StaveNote` path (already
correctly handled in `buildStaveNote` via `parsePitchForVexflow`).

**Warning signs:**
- Sight reading game shows all C4 notes during an accidentals trail node.
- Accuracy score is 0% even when player plays F# correctly.
- `[PatternBuilder] Warning: Invalid pitch format: F#4` appears in dev console.

**Phase to address:** Must be fixed before or during the sight reading integration phase. Run
`npm run test:run` after the fix — `patternBuilder.test.js` exercises pitch parsing.

---

### Pitfall 3: Pitch Detection Returns Sharp Equivalents — Matching Fails for Flat Note Pools

**What goes wrong:**
`usePitchDetection.js` uses `NOTE_NAMES = ["C", "C#", "D", "D#", ...]` — sharps only. When a
student plays Db4 (same frequency as C#4), the detector returns `"C#4"`. If the trail node's
`notePool` contains `["Db4", "Eb4", "Ab4"]` (flat spellings), the comparison `detectedNote === currentNote` fails for every correct answer.

**Why it happens:**
Chromatic pitch classes are represented with sharps in the detection layer. The game's answer
comparison (in `useMicNoteInput.js` and the note-matching logic) must do enharmonic normalization.
`NotesRecognitionGame` already has a `SHARP_TO_FLAT_MAP` and `toFlatEnharmonic` for audio lookup,
but the primary note-matching path may not apply this map before comparing against the displayed
question.

**How to avoid:**
Decide on one canonical spelling per pitch class for the trail node pool and stick to it. The
existing system uses flat spellings for audio (Db4, Eb4, etc.) because the piano sound files are
named that way. Use the same flat convention in accidentals node `notePool` entries. Additionally,
verify that the mic-input comparison path normalizes `#` spellings to flat before comparing.

**Warning signs:**
- Mic input always marked wrong even when the pitch meter shows the right frequency.
- In dev tools: `detectedNote = "C#4"`, `currentNote.pitch = "Db4"` logged in the same frame.
- Free-play with `enableFlats: true` + mic works fine because the free-play path normalizes; trail
  path fails because it uses raw node pool pitches.

**Phase to address:** Audio / pitch detection integration phase, before QA.

---

### Pitfall 4: Auto-Grow Note Pool Finds Accidental Notes and Injects Them Without Enabling the Flag

**What goes wrong:**
`NotesRecognitionGame` has an arcade-mode auto-grow feature: at every `GROW_INTERVAL` (5) streak,
it walks forward from the current node via `getNextNodeInCategory()` looking for a pitch not yet in
the pool (lines 885-898). When sharps/flats nodes exist, a player in a late natural-notes node
(e.g., `treble_3_9`) at a 5-combo streak will have `"F#4"` injected from `treble_4_2` as an extra
note. That pitch then gets shown as a question. But `settings.enableSharps` is still `false`, so
the answer buttons in the UI may not include F#, making it impossible to answer correctly.

**Why it happens:**
`getNextNodeInCategory` returns any node in the same category, including upcoming accidentals nodes.
The auto-grow logic only checks whether the candidate pitch is absent from `alreadyKnown` — it does
not check whether the pitch is a type of accidental the current node is supposed to support.

**How to avoid:**
In the auto-grow candidate search, filter out accidental pitches when `enableSharps` and `enableFlats`
are both false:
```js
const candidatePitch = nextNode.noteConfig.notePool.find(p => {
  if (alreadyKnown.has(p)) return false;
  if (!settings.enableSharps && p.includes('#')) return false;
  if (!settings.enableFlats && p.includes('b') && p.length > 2) return false;
  return true;
});
```

**Warning signs:**
- During arcade play on a natural-notes treble node, a sharp note button appears in the UI after a 5-combo.
- The child cannot answer and loses a life, which is extremely frustrating and confusing.

**Phase to address:** Node data phase (as soon as new unit files are added to `expandedNodes.js`).

---

### Pitfall 5: VexFlow Accidental Glyph Crammed or Invisible Due to Insufficient Stave Width

**What goes wrong:**
VexFlow's `Formatter` calculates minimum width requirements based on tickable modifiers. An
`Accidental` modifier on a `StaveNote` adds approximately 20-30px to the note's minimum spacing.
The current `FIXED_STAVE_WIDTH_PER_BAR = 240` in `VexFlowStaffDisplay` was calibrated for natural
notes only. When a measure contains 4 quarter notes all with sharp/flat accidentals, the formatter
may either:
(a) throw a `VF.RangeError: Auto sizing voice does not have enough room` in some VexFlow builds, or
(b) silently squish the accidental glyph so it overlaps the preceding note.

**Why it happens:**
Accidentals are rendered left of the notehead. In close spacing (4 quarter notes per bar), two
adjacent accidentals need extra horizontal separation to avoid collision. VexFlow's automatic spacing
handles this via `Formatter.format()` but only if enough width is allocated.

**How to avoid:**
Increase `FIXED_STAVE_WIDTH_PER_BAR` or add an accidental-density calculation: count accidental
modifiers in the pattern notes and add ~15px per accidental when determining stave width. The
`buildStaveNote` function in `VexFlowStaffDisplay` already adds `Accidental` modifiers correctly;
the width budget is the only gap.

**Warning signs:**
- Notation renders with a sharp/flat symbol visually overlapping the note stem of the previous note.
- Console logs `VF.Formatter: Could not format due to width constraints`.
- Only visible with 3+ accidentals per measure; single accidentals look fine.

**Phase to address:** VexFlow rendering phase. Test with patterns containing 4 quarter notes each
with a flat modifier (e.g. Db4 Eb4 Gb4 Ab4 in 4/4).

---

### Pitfall 6: Hebrew Note Labels Are Ambiguous for Accidentals

**What goes wrong:**
The i18n system displays solfege names in Hebrew (דו for C, רה for D, etc.). For accidentals the
display is `${note.note}♭` or `${note.note}♯` (e.g., `דו♯`). For an 8-year-old Hebrew speaker
learning accidentals, seeing `דו♯` without a corresponding guide on what "sharp" and "flat" mean
creates confusion. More practically: the answer buttons in `NotesRecognitionGame` sort accidentals
after naturals using `accidentalRank()`, which means Db4 (ranked 1) appears before C#4 (ranked 2),
but solfege labels give no visual distinction between different accidentals on the same scale degree.

**Why it happens:**
Solfege (do-re-mi) is a diatonic system and does not naturally accommodate chromatic alterations.
The current label convention appends a Unicode glyph, which is technically correct but requires
musical literacy to interpret — above the expected level of an 8-year-old in early accidentals
lessons.

**How to avoid:**
For accidentals nodes, prefer English note names (e.g. "F#" / "Gb") or a consistent graphic
(a note name plus a drawn sharp/flat symbol) rather than solfege + Unicode glyph. This is a
pedagogical decision that should be made in the design phase. If Hebrew solfege is required,
add short inline labels like `"חֲצִי-טוֹן"` (semitone) or the accepted Israeli pedagogy terms.

**Warning signs:**
- QA sessions with actual 8-year-olds show confusion about which button to press when two buttons
  show `דו♯` and `רה♭` (which are enharmonic equivalents of each other).
- Button labels are identical for enharmonic pairs shown in the same session.

**Phase to address:** UX / pedagogical content phase. Decide before building any UI.

---

### Pitfall 7: `subscriptionConfig` Not Updated — New Nodes Silently Become Free-Tier

**What goes wrong:**
`subscriptionConfig.js` uses an explicit `FREE_NODE_IDS` Set. Any new node ID that happens to match
a free ID is accessible without a subscription. More importantly: if the new accidentals node IDs
are accidentally added to the free list (e.g., by copy-paste from the treble_1 unit), paying
subscribers and free users get the same content — the paywall is bypassed silently.

The inverse risk: if the database-side `is_free_node()` Postgres function is not updated to match
the new node IDs, the RLS policy rejects premium subscribers trying to submit scores for the new
premium nodes.

**Why it happens:**
The comment in `subscriptionConfig.js` says "Changing the free tier boundary requires editing ONLY
this file." But that comment is only half right: the Postgres `is_free_node()` function is a second,
independent source of truth that must stay in sync. When new nodes are all-premium (as intended for
v2.2), they do not need to be in `FREE_NODE_IDS` but they also do not need to be in `is_free_node()`
— as long as the DB function returns `FALSE` for any unknown node ID. Verify this is the case.

**How to avoid:**
- Do not add any new accidentals node ID to `FREE_NODE_IDS`.
- Verify the Postgres `is_free_node()` function returns `FALSE` for unknown node IDs (audit the
  migration file).
- Add a build-time test: for each new node ID, assert `isFreeNode(id) === false`.

**Warning signs:**
- Free users can access `treble_5_1` without subscribing.
- Paid users get an RLS error ("new row violates row-level security policy") when submitting scores
  for new nodes.

**Phase to address:** Data layer phase, immediately when node IDs are finalized.

---

### Pitfall 8: `expandedNodes.js` Aggregator Not Updated — New Nodes Invisible to Trail

**What goes wrong:**
`expandedNodes.js` imports unit files explicitly. Adding `trebleUnit4Redesigned.js` and
`trebleUnit5Redesigned.js` without adding the corresponding import lines leaves the new nodes
completely absent from `EXPANDED_NODES`. The trail renders as before — 93 nodes. No error is thrown.
`getNodeById('treble_5_1')` returns `undefined`. The skill trail appears unchanged.

**Why it happens:**
This is a manual aggregation pattern with no auto-discovery. It matches how all previous units were
added (treble/bass/rhythmUnit1-3 are each individually imported). The pattern is correct but easy to
forget when focused on data authoring.

**How to avoid:**
The build-time validation script (`npm run verify:patterns`) should be extended to assert that every
node file in `src/data/units/` is imported by `expandedNodes.js`. This catches the "file exists but
not imported" case. Add this assertion to the validator alongside the existing prerequisite-cycle check.

**Warning signs:**
- `npm run verify:patterns` passes but new node IDs do not appear in the trail.
- `getNodeById('treble_5_1')` returns `undefined` in browser devtools.
- Trail tab shows 0 nodes for Unit 5.

**Phase to address:** Data layer phase, immediately when new unit files are created.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Use only flat spellings in notePool (Db not C#) | Consistent with audio file naming | Confusing for learners who learn sharps first in key signature order | Acceptable for v2.2; revisit before key-signature unit |
| Reuse existing note SVG images without dedicated accidental-in-context images | No new asset work | Same SVG shows the note in isolation — may not match staff position in sight reading | Acceptable only if NoteImageDisplay is not shown during sight reading |
| Skip enharmonic explanation in UI | Simpler lesson design | Children who learn F# here will encounter Gb later and not recognize it as the same key | Acceptable for v2.2 (isolated accidentals); add disambiguation before key-signature unit |
| Hardcode `accidentals: true` in noteConfig without validating the boolean in the validator | Fast data authoring | Validator never checks whether `accidentals: true` nodes have accidental pitches in notePool | Never — validator should cross-check |
| Copy-paste a Unit 3 node file as the base for Unit 4 | Fast start | Inherits `START_ORDER` constant — if not updated, causes duplicate `order` values silently | Never — always verify order values are unique |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| VexFlow `Accidental` modifier | Adding modifier to `StaveNote` using `addModifier(new Accidental('b'), 0)` where `'b'` is the VexFlow code for flat — but accidentally passing `'b'` for sharp or `'#'` for flat | Sharp = `'#'`, Flat = `'b'` in VexFlow — test with both before shipping |
| Supabase RLS on `student_skill_progress` | Submitting progress for a new premium node when `is_free_node()` returns false and `has_active_subscription()` also returns false (e.g., expired subscription) results in a 403 with no UI feedback | Catch the RLS error in `skillProgressService.updateNodeProgress()` and surface a subscription-expired message |
| `NOTE_AUDIO_LOADERS` in `NotesRecognitionGame` | Adding a node with `Gb3` in notePool — `NOTE_AUDIO_LOADERS['Gb3']` exists — but `Fb3` does not. If a theoretical accidentals node included `Fb3`, the audio would silently fail | Audit every pitch in every new notePool against `NOTE_AUDIO_LOADERS` keys before merging |
| `getNextNodeInCategory` in auto-grow | Returns `boss_treble_5` which has `noteConfig.notePool` containing the full accidentals set — injecting a boss node's pool note into a regular node's arcade session | Auto-grow should skip boss nodes (`isBoss: true`) as note pool sources |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Importing all accidental SVG assets at module load | `gameSettings.js` already imports ~80 accidental SVGs at top level; adding more octave variants increases initial JS parse time | Do not add new SVG imports unless the specific pitch is in scope for v2.2 trail nodes | Noticeable above ~100 static SVG imports (currently at ~80) |
| Large `notePool` arrays in boss challenge config | Boss node with all 20 accidentals notes generates a very large answer button grid in `NotesRecognitionGame`; layout breaks below 375px width | Cap boss notePool at 10-12 notes; use a curated subset, not all notes at once | Any device narrower than 390px with 15+ answer buttons |
| Duplicate node IDs across treble accidentals and extended-range nodes | Two nodes with the same `id` cause `getNodeById` to return the first match silently; second node is unreachable | Run `verify:patterns` which catches duplicate IDs | Always — deduplication is a correctness issue not a performance issue |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| New accidentals node IDs accidentally added to `FREE_NODE_IDS` | Free users access premium content; revenue lost | Build-time test asserting no accidentals node IDs are in `FREE_NODE_IDS` |
| `is_free_node()` Postgres function not audited after adding new nodes | If it uses a whitelist, unknown IDs could default to `TRUE`; paid subscribers blocked or free tier expanded | Read the current migration to confirm unknown IDs return `FALSE`; add a DB integration test |
| Score submission for new nodes bypasses rate limiting | If the new node IDs are not in the `students_score` table's rate-limit path, a bot could farm XP by spamming new node IDs | Verify the rate-limit trigger covers `node_id` values not previously seen |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Introducing F# and Gb in the same node lesson | 8-year-olds see two different button labels for what sounds identical on the keyboard; they think they are wrong when they play the right key | Separate sharp nodes from flat nodes pedagogically: teach sharps first (black keys going right), then flats (black keys going left) in a later node |
| Showing all 5 black-key accidentals in a single Discovery node | Cognitive overload; forgetting rate spikes | Introduce at most 1-2 new accidentals per Discovery node, mirroring how naturals were introduced one at a time |
| No visual distinction between the sharp symbol (♯) and natural symbol (♮) in small button text | Children misread flat as natural or sharp as natural at small font sizes | Use the SVG note images (which already include the accidental symbol clearly drawn on a staff) rather than text-label buttons for accidentals questions |
| Awarding 3 stars too easily on accidentals nodes | Dilutes the star achievement that was hard-won for naturals | Keep the same 95% threshold for 3 stars; consider adding a "first time seeing accidentals" difficulty adjustment via slightly lower tempo default |
| Boss node requiring all 10 accidentals at 95% accuracy | Too difficult for 8-year-olds who just learned accidentals | Boss should test a focused subset (e.g., 5 most-practiced accidentals) at 80% for full stars |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Trail auto-start:** New accidentals node loads and game starts — verify `enableSharps` or `enableFlats` is `true` in the running settings, not just in `nodeConfig`. Check via React DevTools or a `console.log` in `startGame`.
- [ ] **VexFlow rendering:** Staff displays a note with a flat/sharp symbol — verify the accidental glyph does not overlap adjacent noteheads by zooming in on mobile viewport (375px wide).
- [ ] **Pitch detection match:** Mic input matches Db4 correctly — verify by playing Db4 on a real piano (not just clicking the listen button) and checking the detected note in dev overlay.
- [ ] **Auto-grow isolation:** Playing arcade mode on a natural-notes node at 10-combo does not inject accidental notes from the next unit — test with a node that is immediately before `treble_5_1` in order.
- [ ] **Subscription gate:** Free user attempting to access `treble_5_1` sees the paywall modal, not the game — verify on a real free-tier account.
- [ ] **Existing progress intact:** After deploying new unit files, users who completed `boss_treble_3` still show as completed — verify `EXPANDED_NODES` aggregation does not shift array indices that affect `getNodeById` lookups (it uses `find`, not array position, so this should be fine — but verify).
- [ ] **Validator passes:** `npm run verify:patterns` passes with new unit files added and no new prerequisite cycles.
- [ ] **Hebrew labels readable:** Answer buttons for Db4 and C#4 shown in a Hebrew-language session are distinguishable — test in the `he` locale.
- [ ] **Boss unlock event fires:** Completing `boss_treble_5` triggers the 3-stage boss modal (boss unlock events are keyed on `isBoss: true` in VictoryScreen) — verify by navigating to the boss node and completing it.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Trail auto-start strips accidentals from pool | LOW | Hotfix: add 3 lines to derive `enableSharps`/`enableFlats` from notePool in the auto-start effect. No DB migration needed. |
| `patternBuilder.toVexFlowNote` silently renders C4 | LOW | Hotfix: update one regex in `patternBuilder.js`. Update corresponding tests. |
| Pitch detection enharmonic mismatch | MEDIUM | Requires auditing all note-comparison paths in the mic pipeline; may affect free-play as well as trail mode |
| New node IDs accidentally free-tier | LOW | Hotfix in `subscriptionConfig.js`; deploy. No user data loss. |
| `expandedNodes.js` not updated | LOW | Add 2 import lines; `npm run build` catches it immediately if verify:patterns is run as prebuild |
| Duplicate `order` values in unit files | MEDIUM | Renumber all affected nodes; test that trail renders in correct visual order; verify no progress is lost (progress is keyed on `id`, not `order`) |
| VexFlow accidental glyph collision | MEDIUM | Increase `FIXED_STAVE_WIDTH_PER_BAR`; re-test all existing multi-bar sight reading patterns to confirm no regression |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Trail auto-start strips accidentals (Pitfall 1) | Phase 1: Data + Trail integration | Start an accidentals node from trail; confirm enableSharps=true in running state |
| patternBuilder drops accidental pitches (Pitfall 2) | Phase 1: Data + Trail integration | Run `patternBuilder.test.js`; add a test case for `F#4` |
| Enharmonic mismatch in pitch detection (Pitfall 3) | Phase 2: Game mode integration | Manual QA with real piano mic input on a flat-spelling node |
| Auto-grow injects accidentals into natural-notes session (Pitfall 4) | Phase 1: Data + Trail integration | Trigger 5-combo in treble_3_9 arcade; confirm no accidental injected |
| VexFlow accidental glyph collisions (Pitfall 5) | Phase 2: Game mode integration | Render a 4/4 measure of all-accidental quarter notes on a 375px viewport |
| Hebrew label ambiguity (Pitfall 6) | Phase 0: Design / content spec | Prototype answer buttons in Hebrew locale; get feedback from target age group |
| subscriptionConfig not updated (Pitfall 7) | Phase 1: Data + Trail integration | Assert `isFreeNode('treble_5_1') === false` in unit test |
| expandedNodes.js aggregator not updated (Pitfall 8) | Phase 1: Data + Trail integration | `getNodeById('treble_5_1')` returns the node object in browser console |

---

## Sources

- Direct codebase review: `src/data/units/trebleUnit3Redesigned.js`, `src/data/units/bassUnit3Redesigned.js`
- Direct codebase review: `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (lines 518-536, 875-900)
- Direct codebase review: `src/components/games/sight-reading-game/utils/patternBuilder.js` (lines 60-73)
- Direct codebase review: `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` (lines 446-485, 408)
- Direct codebase review: `src/hooks/usePitchDetection.js` (NOTE_NAMES constant, lines 25-38)
- Direct codebase review: `src/components/games/sight-reading-game/constants/noteDefinitions.js`
- Direct codebase review: `src/components/games/sight-reading-game/constants/gameSettings.js` (TREBLE_IMAGE_MAP accidental entries)
- Direct codebase review: `src/config/subscriptionConfig.js`
- Direct codebase review: `src/data/expandedNodes.js`
- Direct codebase review: `src/data/skillTrail.js` (UNITS.TREBLE_5, UNITS.BASS_5 stubs)
- VexFlow v5 API: `Accidental`, `StaveNote.addModifier()`, `Formatter` width constraints — HIGH confidence (same API already used in VexFlowStaffDisplay)
- McLeod Pitch Method sharp/flat detection — covered in existing `PITFALLS.md` (mic overhaul research); enharmonic behavior is verified in `frequencyToNote()` (NOTE_NAMES is sharps-only)

---
*Pitfalls research for: Sharps & Flats content expansion (v2.2)*
*Researched: 2026-03-15*
