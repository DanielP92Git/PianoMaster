# Pitfalls Research: Key Signatures & Advanced Rhythm (v2.4)

**Domain:** Adding Key Signatures (~15 nodes) and Advanced Rhythm (~15 nodes) to existing piano learning PWA
**Researched:** 2026-03-18
**Confidence:** HIGH (direct codebase review + VexFlow GitHub issues + music pedagogy sources)

---

## Context

This document covers common mistakes when **adding ~30 new trail nodes** (Key Signature section and
Advanced Rhythm section) to the existing 129-node skill trail. The codebase currently:

- Has no key signature rendering anywhere (`addKeySignature` never called in `VexFlowStaffDisplay`)
- Uses `sixteenth-note`-as-beat unit counting throughout `rhythmGenerator.js`
- Has `SIX_EIGHT` defined in `RhythmPatternGenerator.js` but no trail nodes use it
- Has `Beam.generateBeams()` called without a `groups` parameter (defaults to 4/4 grouping)
- Timing windows in `useTimingAnalysis` use absolute ms thresholds calibrated for simple-meter beats

Verified files at time of research:
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx`
- `src/components/games/sight-reading-game/utils/rhythmGenerator.js`
- `src/components/games/sight-reading-game/utils/patternBuilder.js`
- `src/components/games/sight-reading-game/constants/durationConstants.js`
- `src/components/games/rhythm-games/RhythmPatternGenerator.js`
- `src/data/units/rhythmUnit6Redesigned.js`
- `src/config/subscriptionConfig.js`

---

## Critical Pitfalls

### Pitfall 1: Key Signature Width Breaks VexFlow Layout Without Manual Compensation

**What goes wrong:**
`VexFlowStaffDisplay` currently calculates staff width and `noteStartX` without any key signature
modifier. When `stave.addKeySignature('G')` is called, the key signature glyph (one sharp) consumes
~20-30px of horizontal space. For keys with 4-5 sharps/flats (E major, Bb major), that grows to
~60-80px. The `Formatter.format()` call uses the stave's `noteStartX` as the origin; if that is
not updated to account for the key signature modifier width, notes will overlap the key signature
glyphs or be clipped on the left edge.

The existing code in `vexflowHelpers.js` uses a fixed `baseWidth = 500` and `pixelsPerBeat = 90`
that does not account for any extra left-margin introduced by a key signature.

**Why it happens:**
VexFlow's Stave tracks modifier widths separately from the rendering coordinate. `stave.getNoteStartX()`
returns the correct x-offset only after `stave.draw()` has been called. Developers who call
`Formatter.format(voice, width - noteStartX)` before `stave.draw()` get the pre-modifier value
and produce overlapping layout. The VexFlow maintainer's own recommended fix (GitHub issue #340)
is to use the `System` class, which handles cross-stave alignment automatically — but the existing
code uses manual `Stave` construction, not `System`.

**How to avoid:**
- After calling `stave.addKeySignature(keyName)` and before calling `Formatter.format()`, call
  `stave.draw()` first, then fetch `stave.getNoteStartX()` and use that as the offset.
- Alternatively, compute a per-key padding constant (C: 0px, G/F: +22px, D/Bb: +40px, A/Eb: +58px,
  E/Ab: +76px) and add it to `calculateOptimalWidth()` output.
- For multi-measure patterns with a key signature on only the first measure (correct notation
  practice), ensure subsequent stave instances receive `stave.setKeySignature('none')` or simply
  omit `addKeySignature` on bars 2+.

**Warning signs:**
- Key signature glyph and first note head visually overlap in SVG output.
- `vexContainerRef.current.querySelector('.vf-keysignature')` returns an element but notes appear
  to start at x=100 regardless of key width.
- Console warning from VexFlow: "Ticket context is unset" on formatter calls.

**Phase to address:** Key Signatures node data phase (before rendering). Implement key signature
rendering in `VexFlowStaffDisplay` with a `keySignature` prop; calculate layout after draw.

---

### Pitfall 2: Automatic Accidental Suppression Not Applied — Double-Marking Key Notes

**What goes wrong:**
In the key of G major, every F is automatically F#. If the sight-reading game displays an F# note
with an explicit `#` accidental symbol next to it (because the existing accidental-rendering code
from v2.2 always adds `#` when it sees `F#4` in the note pool), the notation is wrong. Standard
music notation never shows an explicit accidental for a note already covered by the active key
signature — only a natural sign would appear if you wanted to cancel it.

The current `VexFlowStaffDisplay` applies `Accidental` modifiers based on pitch name (e.g. always
renders `#` for any `F#4`). There is no `KeyManager` or `Accidental.applyAccidentals()` call in
the existing code that would suppress the redundant accidental when a key signature is active.

**Why it happens:**
The v2.2 accidentals implementation was designed for nodes with *no key signature* — sharps/flats
were taught as explicit one-note-at-a-time accidentals. Key Signatures are a different concept:
the key signature handles all occurrences of those notes implicitly. Reusing the v2.2 accidental
path unchanged produces redundant `#` symbols that confuse children and violate standard notation.

**How to avoid:**
- Pass a `keySignature` prop into `VexFlowStaffDisplay` alongside `pattern`.
- Before rendering accidentals on each `StaveNote`, check whether the note's accidental is implied
  by the active key signature. Use VexFlow's `Accidental.applyAccidentals(voices, keySignature)`
  static helper, which internally uses `KeyManager` to suppress redundant symbols.
- Key signature trail nodes should NOT include explicit `accidentals: true` in their `noteConfig`.
  They need a new `keySignature: 'G'` (or similar) field that is threaded through to the renderer.

**Warning signs:**
- F# notes in key-of-G exercises show an explicit `#` glyph beside the note head.
- C# notes in key-of-A show explicit `#` even when key signature already covers them.
- "Looks wrong" comparison: check any published piano sheet music in G major — F sharps have no
  accidental symbol.

**Phase to address:** Key Signature rendering phase. Must be the first thing tested before any
Key Signature node data is authored.

---

### Pitfall 3: Compound Meter Beat Unit Mismatch — 6/8 Counting as 6 Beats Instead of 2

**What goes wrong:**
The `rhythmGenerator.js` beat loop iterates one `beat` at a time: `while (beat < totalBeats)`.
For 6/8, `RhythmPatternGenerator.js` defines `beats: 6` and `measureLength: 12` (12 eighth-note
units). If this is imported into `durationConstants.js` (which it is — `resolveTimeSignature`
delegates to `RHYTHM_TIME_SIGNATURES`), then `totalBeats = 6` for a one-measure 6/8 pattern.

The generator would then fill 6 individual "beats" using `unitsPerBeat = 12/6 = 2` (2 eighth-note
units per beat), treating each eighth note as a beat. This is technically a valid implementation
of "fill 12 units" but it produces **6 independent eighth-note-sized beat slots** rather than
**2 dotted-quarter beats subdivided into 3 eighths each**. The beat-boundary logic for complex
patterns and syncopation checks will fire at wrong positions, and the measure-padding fallback
will produce wrong rest/note types.

The correct musical interpretation: 6/8 has **2 compound beats**, each subdivided into 3 eighths.
The `beats` value in the TIME_SIGNATURES definition should be 2 (the felt pulse count), with
`unitsPerBeat = 6` (three eighth notes = one dotted quarter beat = 6 sixteenth units).

**Why it happens:**
`RhythmPatternGenerator.js` was defined with `beats: 6` for 6/8 (counting the printed numerator),
not `beats: 2` (counting the felt pulse). This was never exercised in trail nodes since all existing
rhythm nodes use 4/4, 3/4, or 2/4. The mismatch is latent until compound meter nodes are added.

**How to avoid:**
- Before authoring any 6/8 trail nodes, fix the `SIX_EIGHT` constant in `RhythmPatternGenerator.js`
  to `beats: 2, unitsPerBeat: 6, measureLength: 12`.
- Update `durationConstants.js`'s `buildTimeSignatureGrid()` accordingly, since it derives
  `unitsPerBeat` from `measureLength / beats`.
- Verify with the existing test: `generateRhythmEvents` for 6/8 should produce exactly 12 total
  sixteenth units per measure regardless of how many events.
- Add a unit test that generates 6/8 patterns and asserts: total sixteenth units = 12, and that
  at least some patterns group notes as 3+3 (dotted-quarter pairs).

**Warning signs:**
- 6/8 pattern generation produces 6 quarter rests where a whole-measure rest should be.
- Patterns look like "6 separate quarter notes" instead of "two triplet groups of three eighths."
- The `validateTrail.mjs` prebuild script passes but in-game the metronome click timing sounds
  like 6 equal clicks rather than a 2-beat compound feel.

**Phase to address:** Advanced Rhythm data/generator phase — fix before writing any 6/8 node files.

---

### Pitfall 4: Beam Grouping in 6/8 Defaults to 4/4 Grouping — Wrong Visual Notation

**What goes wrong:**
`VexFlowStaffDisplay` calls `Beam.generateBeams(notes)` without a `groups` parameter. VexFlow's
default beam grouping is quarter-note based (groups of 2 eighths per beat in 4/4). In 6/8 time,
the correct grouping is two beamed groups of three eighth notes per measure (3+3). Without passing
`groups: [new Fraction(3, 8)]` to `generateBeams`, VexFlow will beam the 6 eighth notes as 3 pairs
of 2 (the 4/4 default), which is musically incorrect for compound time and visually confuses the
learner about where the dotted-quarter beats are.

This is a confirmed historical VexFlow issue (GitHub issue #164: "Make auto beaming time-signature
aware") — the automatic grouping does not read the time signature of the stave.

**Why it happens:**
The current code path was built for 4/4, 3/4, and 2/4 where VexFlow's default beam groups happen
to be correct. The issue only surfaces when compound time is added.

**How to avoid:**
- Pass the resolved time signature into `VexFlowStaffDisplay` and use it to compute the `groups`
  parameter for `Beam.generateBeams()`:
  - 4/4, 2/4: `[new Fraction(1, 4)]` (one quarter note per beam group) — current default, correct
  - 3/4: `[new Fraction(1, 4)]` — same, correct
  - 6/8: `[new Fraction(3, 8)]` — two groups of three eighths
  - 9/8: `[new Fraction(3, 8)]` — three groups of three eighths
- Use `Beam.getDefaultBeamGroups(timeSig)` which returns the correct Fraction array for common
  time signatures including compound meters.

**Warning signs:**
- 6/8 exercises show eighth notes beamed in pairs (2+2+2) instead of triplet groups (3+3).
- The visual grouping suggests 4/4 feel even though the time signature shown is 6/8.
- Students tap along in 4/4 because the visual beaming implies quarter-note beats.

**Phase to address:** Advanced Rhythm rendering phase — same phase as beam grouping fix. Affects
`VexFlowStaffDisplay` which is shared by Key Signatures too (use `timeSignature` prop already
present in pattern data).

---

### Pitfall 5: Timing Windows Calibrated for Simple-Meter Beats Break in Compound Time

**What goes wrong:**
`useTimingAnalysis` uses `beatDurationMs = (60 / bpm) * 1000` where `bpm` is the user-facing
tempo. For 4/4 at 80 BPM, a beat = 750ms. The timing tolerance is `NOTE_LATE_MS = 300ms` and
`earlyAllowance` scales to `durationMs * 0.5`.

In 6/8 at the same "80 BPM" setting, the intent is usually 80 dotted-quarter beats per minute.
One dotted quarter = 1.5 beat durations. If the generator fills `beats: 2` compound beats but
the tempo store says `bpm: 80`, the beat duration will be correct. However, if the compound beats
are accidentally modeled as 6 simple beats at 80 BPM (see Pitfall 3), each "beat" window is
(60/80)*1000 = 750ms, but the actual eighth notes at 240 BPM subdivision are only 250ms each.
The late window (300ms) would span >1 note duration, causing the FSM to accept notes that are
an entire subdivision late.

Even with Pitfall 3 fixed, the onset-detection pipeline (`useMicNoteInput` FSM) uses a debounce
calibrated to `shortestNoteDurationMsRef` from the pattern. In 6/8 at 60 BPM, the shortest note
(an eighth) is 333ms. The BPM-adaptive debounce should handle this, but only if `shortestNoteDurationMsRef`
is correctly computed from the compound-time pattern.

**Why it happens:**
The timing system was designed and tested exclusively with simple meters. The `resolveTimeSignature`
output's `beats` and `unitsPerBeat` values feed directly into timing window construction, so fixing
Pitfall 3 is a precondition for correct timing behavior. If Pitfall 3 is unfixed, timing bugs in
compound meter will be impossible to debug independently.

**How to avoid:**
- Fix Pitfall 3 first (correct beat model for 6/8).
- After fixing, run the sight-reading game with 6/8 patterns at various tempos (50-80 BPM) and
  verify the acceptance window makes musical sense: a student should be able to play an eighth
  note on the correct subdivision and get "Perfect" or "Good", not "Late".
- Add a test in `rhythmGenerator.test.js` asserting that 6/8 pattern `startTime`/`endTime` values
  correspond to correct note durations for a given BPM.
- For syncopation specifically (off-beat note placement), the timing window must be wide enough
  that notes played on weak beats are still detected but not so wide they accept wrong-beat hits.
  The existing `durationMs * 0.5` early window should remain correct for this.

**Warning signs:**
- In 6/8 mode, correct notes played on beat 2 (dotted quarter 2) are scored as "Early."
- The combo counter resets unexpectedly when playing correct off-beat notes.
- `shortestNoteDurationMsRef` shows 750ms for a 6/8 pattern where the shortest note is an eighth.

**Phase to address:** Advanced Rhythm integration phase — after generator fix, before trail node
data is authored for 6/8 nodes.

---

### Pitfall 6: Key Signature Nodes Teach Rules Before Context — 8-Year-Old Cognitive Overload

**What goes wrong:**
An 8-year-old who has learned individual sharps/flats (F#4, C#4 etc. from v2.2) has a mental model
of "sharp = explicit symbol on the note." When Key Signatures are introduced, the paradigm inverts:
the symbol moves to the beginning of the staff and applies silently to all occurrences. If the
first Key Signature node immediately presents F# notes *without* an explicit `#` symbol and without
pedagogical scaffolding, the child will see an "F" on line 1 of the treble staff and read it as F
natural — because that's what they've been trained to do since v2.2.

This is the most common failure mode identified in piano pedagogy research for this age group:
introducing key signatures too early relative to accumulated sharp/flat experience, or presenting
key signature exercises identically to accidental exercises with just the visual changed.

**Why it happens:**
It is tempting to author key signature nodes as "same note pool as accidental nodes, just add
`keySignature: 'G'` to the config." This misses the conceptual bridge: the child needs to learn
what the key signature symbol *means* before they can play exercises that rely on understanding it.

**How to avoid:**
- The first Key Signature nodes must be Discovery-type nodes (not Practice) with explicit explanation
  text: "The # at the start means every F is F# all through the song."
- Use only 1-sharp keys (G major) and 1-flat keys (F major) in the first unit. Do not introduce
  2+ accidental key signatures until mastery of single-accidental keys is demonstrated.
- Consider a "hybrid" approach: first few exercises show both the key signature AND a highlight
  indicator on the affected note, gradually withdrawing the reminder over subsequent nodes.
- The TrailNodeModal's "newContentDescription" field should explicitly state the mental model shift:
  "Key Signature: plays F# every time — no # symbol needed!"
- Do not sequence key signature nodes as prerequisites of advanced rhythm nodes. Keep the two
  sections parallel and unlinked. An 8-year-old struggling with 6/8 does not need to also manage
  key signature context simultaneously.

**Warning signs:**
- Playtest: child plays F natural on F-line notes in key-of-G exercises → systematic key signature
  misunderstanding.
- Low completion rate (< 40%) on first key signature node despite child having mastered F#4 in v2.2.
- Child asks "where did the sharp go?" — means the Discovery scaffolding is insufficient.

**Phase to address:** Key Signature pedagogy design phase — before authoring any node data. The
learning sequence within the Key Signatures section must be explicitly reviewed for pedagogical order.

---

### Pitfall 7: Syncopation Exercises Break Tap-Rhythm Detection — Off-Beat Events Not Registered

**What goes wrong:**
The `MetronomeTrainer` tap detection uses the metronome clock as the reference for beat windows.
Syncopated patterns place note attacks on weak beats or between beats (e.g. the 8-q-8 "Charleston"
pattern from `COMPLEX_EXAMPLE_PATTERNS`). If the tap window logic aligns windows strictly to
beat boundaries, an off-beat tap (on the "and" of beat 2) may fall between two windows and be
rejected. The current FSM state machine in `useMicNoteInput` has a `NOTE_LATE_MS = 300ms` late
window and the `earlyAllowance` from `useTimingAnalysis`, but these were validated only for
on-beat note attacks.

For syncopation-specific nodes in the rhythm trail (where tapping is the input, not pitch), the
question is whether the timing windows in `buildTimingWindows` correctly produce a window centered
on each event's `startTime` (including off-beat events) or whether they are clamped to beat
boundaries. Reviewing `patternBuilder.js`: each event gets `startTime = currentSixteenth * secondsPerSixteenth`
which is correct for off-beat positions. The window is `[startMs - earlyAllowance, endMs + scaledLate]`.
This should handle off-beat events correctly for sight-reading.

However, the `MetronomeTrainer` rhythm game uses its own tap-comparison logic that may not directly
use `useTimingAnalysis`. This must be verified before authoring syncopation nodes for the rhythm path.

**Why it happens:**
Syncopation was added to the *sight-reading* game's complex mode as a visual/audio display feature,
but it has never been used as the target rhythm for the *MetronomeTrainer* tap exercise. The two
game modes have independent timing paths.

**How to avoid:**
- Before authoring syncopation trail nodes for the rhythm path, verify that `MetronomeTrainer`'s
  tap evaluation function uses event-level timing windows (not beat-boundary windows).
- If `MetronomeTrainer` uses beat-boundary comparison, add event-level window comparison as a
  fallback for off-beat events.
- Add a test: generate a syncopated 8-q-8 pattern, simulate a tap at the off-beat position, and
  verify the score evaluator returns "Perfect" or "Good."

**Warning signs:**
- Tapping the "and" of beat 1 in an 8-q-8 pattern always scores "Miss" even when the timing is correct.
- The rhythm game progress bar never advances on syncopation exercises.
- Students completing syncopation sight-reading nodes (no issues) but failing rhythm tap nodes.

**Phase to address:** Advanced Rhythm integration phase — verify MetronomeTrainer timing before
authoring syncopation rhythm nodes.

---

### Pitfall 8: Subscription Gate Requires Manual Sync After New Nodes — Easy to Miss

**What goes wrong:**
All new Key Signature and Advanced Rhythm nodes will be premium by default (as established in v2.2:
"36 new nodes all premium — default-deny"). But `subscriptionConfig.js` states explicitly: "Changing
the free tier boundary requires editing ONLY this file." If the free tier is ever extended to include
introductory Key Signature or Advanced Rhythm nodes (e.g. first 2 nodes free), both `FREE_NODE_IDS`
in `subscriptionConfig.js` AND the Postgres `is_free_node()` function must be updated atomically.

The risk is not that new nodes are incorrectly gated (they will be premium by default since they
won't appear in `FREE_NODE_IDS`), but rather that if a business decision is made to make some new
nodes free *after initial release*, only one of the two sync points gets updated.

**Why it happens:**
The dual-layer gate design (React UI + DB RLS) is intentional security-in-depth, but it creates
a two-location sync obligation. v2.2's "default-deny by exclusion" approach means adding nodes
without touching `subscriptionConfig.js` is safe for *premium* nodes. But it means the config
file's comment ("Verification date: 2026-02-25") will become outdated, and future developers may
assume it's still the complete record.

**How to avoid:**
- Document in the phase plan: "All v2.4 nodes are premium by default. No changes to
  `subscriptionConfig.js` are required unless a free-tier extension is explicitly planned."
- After authoring all new node IDs, run `npm run build` to confirm `validateTrail.mjs` passes
  (catches missing prerequisites, duplicate IDs, invalid node types).
- If free nodes are later added, update both `FREE_NODE_IDS` and the Postgres migration atomically.
  Never update one without the other.

**Warning signs:**
- `FREE_TIER_SUMMARY.total` doesn't match manual count of `FREE_NODE_IDS`.
- UI shows content gate on a node that the Postgres `is_free_node()` returns true for (or vice versa).
- Build passes but in-game a free node shows a locked paywall state.

**Phase to address:** Node data authoring phase — include a verification checklist item: "New node
IDs not in FREE_NODE_IDS → all premium. Verify gate parity if any are added to free tier."

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode key signature width offset (e.g. +22px for G major) | Avoids complex layout refactor | Wrong layout for keys with 3-5 accidentals; brittle if VexFlow version changes | Never — compute from `stave.getNoteStartX()` after draw |
| Reuse v2.2 accidental rendering path for key sig nodes | Zero renderer changes | Notes in key signature always show explicit `#`/`b` symbols → pedagogically wrong | Never |
| Model 6/8 as `beats: 6` in TIME_SIGNATURES | Matches printed time sig numerator | Produces 6 simple beats instead of 2 compound beats; timing pipeline misbehaves | Never |
| Skip `Beam.generateBeams groups` param for 6/8 | No code change needed | 6/8 eighth notes beamed as 4/4 pairs (wrong notation) | Never |
| Put key signature and compound meter in same trail unit | Fewer units to design | Cognitive overload for 8-year-olds; each is a separate conceptual shift | Never |
| Author syncopation nodes without MetronomeTrainer timing verification | Faster node authoring | Syncopation tap exercises impossible to complete correctly | Never |
| Use same `notePool` arrays for key-sig nodes as accidental nodes | Reuses existing data | Key-sig nodes must use natural note names (F not F#); the key handles the accidental | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `VexFlowStaffDisplay` + key signature | Call `addKeySignature` but forget to re-fetch `noteStartX` after draw | Call `stave.draw()` first; use `stave.getNoteStartX()` for formatter width |
| `Accidental.applyAccidentals` | Calling it without passing the key signature string | Pass `keySignature` argument: `Accidental.applyAccidentals([voice], keySignature)` |
| `Beam.generateBeams` in 6/8 | No `groups` parameter → defaults to 4/4 beaming | Pass `{ groups: Beam.getDefaultBeamGroups('6/8') }` |
| `resolveTimeSignature('6/8')` | Returns `unitsPerBeat: 2` if `beats: 6` in source constant | Fix source constant: `beats: 2, measureLength: 12` gives `unitsPerBeat: 6` |
| Trail node `notePool` in key-sig context | Using `['F#4', 'G4', 'A4']` — F# explicit | Use `['F4', 'G4', 'A4']` with `keySignature: 'G'` — key handles the sharp |
| `validateTrail.mjs` prebuild | New node IDs with typos pass JS syntax but fail prerequisite check | Run `npm run build` after every batch of new node files; fix before committing |
| `patternBuilder.js` with key signature | `inferClefForPitch` may misread natural note names (F4 vs F#4) | Key-sig nodes should use natural pitch strings; no change needed in clef inference |
| `subscriptionConfig.js` + DB `is_free_node()` | Updating config but not Postgres function | Any free-tier boundary change requires both: config update + migration |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering VexFlow SVG on every key signature change | Jank during exercise transitions | Pattern object is memoized by identity; only re-render when `pattern` ref changes | Already handled by `prevPatternRef` guard in `VexFlowStaffDisplay` |
| Key signature glyph forces SVG reflow on every measure | Layout shifts in multi-bar patterns | Batch all stave modifiers before calling `stave.draw()`; call `fitSvgViewBoxToContent` once after all staves drawn | At 4+ measures per pattern with key signature |
| Generating 6/8 patterns generates 50% more events than 4/4 for same measure count | Pattern generation is slower | 6/8 at 2 beats/measure has fewer beat iterations than 4/4 at 4 beats — actually faster | Not a real trap; document correctly |
| Adding 30 new nodes increases `SKILL_NODES` array to ~159 nodes | `validateTrail.mjs` DFS takes longer | DFS is O(N+E) — 159 nodes is trivial; no performance risk | Never at this scale |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Show key signature in new exercise without explanation | Child sees unfamiliar `#` glyphs at staff start, doesn't know what they mean | Discovery node must include a callout: "The # here means every F is F# — no symbol needed!" |
| Introduce both key sig AND compound meter in same session | Child overwhelmed, abandons both | Keep Key Signatures section and Advanced Rhythm section as independent trail tabs; no cross-prerequisites |
| Show 6/8 exercises without explaining the "1-2-3, 1-2-3" feel | Child counts 6 separate beats and taps too fast | First 6/8 node should have a "listen and feel" exercise before any performance mode |
| Use the same "3 stars on this note pool" goal for key-sig nodes as accidental nodes | Key-sig nodes have harder cognitive load (implicit accidentals) than explicit accidental nodes | Reduce exercise count per node for the first 2 key-sig nodes (7 exercises instead of 10) |
| Require mic input for key-sig nodes at the same note pool size as C-major nodes | Key-sig context adds cognitive load on top of pitch identification | Start key-sig nodes with keyboard input only; mic mode unlocked at practice nodes, not discovery nodes |
| Display sharp/flat Unicode symbols in node names for key-sig nodes (e.g. "G♯ Major") | Unicode glyph too small at 8px trail node label size | Use text: "Key of G" not "G Major (1♯)" in trail node short names |

---

## "Looks Done But Isn't" Checklist

- [ ] **Key signature rendering:** VexFlow displays correct key signature AND notes are uncluttered
  (no explicit `#`/`b` on notes covered by key sig) — verify with `Accidental.applyAccidentals`.
- [ ] **Beam grouping in 6/8:** Six consecutive eighth notes in 6/8 beam as `3+3`, not `2+2+2`
  — check SVG output visually and confirm `Beam.getDefaultBeamGroups` is called.
- [ ] **6/8 total units:** `generateRhythmEvents` for 1-measure 6/8 produces exactly 12 total
  sixteenth units — verify with existing `actualTotal !== expectedTotal` guard log.
- [ ] **Timing windows in 6/8:** Correct note played on beat 2 (offset 6 sixteenth units) scores
  "Good" or better — not "Miss" or "Early."
- [ ] **MetronomeTrainer syncopation:** Tapping on the "and" of beat 1 in an 8-q-8 pattern at
  80 BPM scores as a hit — confirm `MetronomeTrainer` tap window uses event-level startTime.
- [ ] **Subscription gate:** All new v2.4 node IDs are absent from `FREE_NODE_IDS` — run
  `src/config/subscriptionConfig.js` grep to confirm zero new IDs listed there.
- [ ] **validateTrail.mjs passes:** `npm run build` exits 0 after all new unit files are wired
  into `expandedNodes.js` and `skillTrail.js`.
- [ ] **notePool uses natural names:** Key-sig nodes use `['F4', 'G4', 'A4']` (not `['F#4']`)
  — key signature handles the accidental implicitly.
- [ ] **RhythmNotationRenderer (Canvas):** The canvas-based rhythm display in `MetronomeTrainer`
  uses its own drawing code — it does not call `VexFlowStaffDisplay` and must be separately updated
  to display 6/8 time signatures and compound beam groups if used for advanced rhythm nodes.
- [ ] **i18n keys added:** All new node names and descriptions have Hebrew translations in
  `src/locales/he/common.json` if they appear in i18n-translated surfaces.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Key sig width breaks layout (Pitfall 1) | MEDIUM | Add `keySignature` prop to `VexFlowStaffDisplay`; call `stave.draw()` before formatter; update `calculateOptimalWidth` to accept `keySignature` param |
| Double-marked accidentals (Pitfall 2) | LOW | Add `Accidental.applyAccidentals([voice], keySignature)` call after voice creation; remove manual accidental application on key-sig note pools |
| 6/8 beat model wrong (Pitfall 3) | LOW (1 constant change) | Change `RhythmPatternGenerator.js SIX_EIGHT.beats` from 6 to 2; re-run tests; verify `unitsPerBeat: 6` flows through to generator |
| Wrong beam grouping (Pitfall 4) | LOW | Pass `{ groups: Beam.getDefaultBeamGroups(timeSig) }` to `Beam.generateBeams()` in VexFlowStaffDisplay |
| Timing window mismatch in 6/8 (Pitfall 5) | LOW (depends on Pitfall 3 fix) | Fix Pitfall 3 first; retest timing at 50/60/70/80 BPM in 6/8 |
| Pedagogical failure (Pitfall 6) | HIGH (requires node redesign) | Redesign first 2-3 key-sig nodes with explicit scaffolding; add callout text to TrailNodeModal for Discovery nodes |
| Syncopation tap detection broken (Pitfall 7) | MEDIUM | Audit `MetronomeTrainer` tap comparison path; add event-level window support if missing |
| Subscription gate sync missed (Pitfall 8) | LOW | Update `subscriptionConfig.js` + apply DB migration atomically; run build to confirm |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Pitfall 1: Key sig width layout | Key Signatures rendering (Phase 1) | Visual inspection: no note/key-sig overlap in SVG |
| Pitfall 2: Double-marked accidentals | Key Signatures rendering (Phase 1) | Notes in key-sig nodes show no explicit `#`/`b` symbols |
| Pitfall 3: 6/8 beat model | Advanced Rhythm generator (Phase 3) | Unit test: 6/8 produces 12 units, felt as 2 beats |
| Pitfall 4: Wrong beam grouping | Advanced Rhythm rendering (Phase 3) | Visual check: 6 eighths beam as 3+3 in 6/8 |
| Pitfall 5: Compound meter timing | Advanced Rhythm integration (Phase 3) | Timing test: correct off-beat hit scores "Good" |
| Pitfall 6: Cognitive overload 8-yr-olds | Key Signatures pedagogy design (Phase 2) | Playtest: first discovery node has explicit scaffolding; completion rate > 60% |
| Pitfall 7: Syncopation tap detection | Advanced Rhythm tap verification (Phase 4) | Manual test: 8-q-8 tap at correct off-beat → hit |
| Pitfall 8: Subscription gate sync | Node data wiring (all phases) | Build passes + DB `is_free_node()` agrees with config |

---

## Sources

- VexFlow GitHub issue #340 — Key signature width and noteStartX positioning: https://github.com/0xfe/vexflow/issues/340
- VexFlow GitHub issue #164 — Make auto beaming time-signature aware: https://github.com/0xfe/vexflow/issues/164
- VexFlow GitHub issue #108 — Beaming of eighth notes in 6/8 time: https://github.com/0xfe/vexflow/issues/108
- VexFlow Development Gotchas wiki: https://github.com/0xfe/vexflow/wiki/Development-Gotchas
- VexFlow Automatic Beaming wiki: https://github.com/0xfe/vexflow/wiki/Automatic-Beaming
- VexFlow accidental.js docs: http://www.vexflow.com/build/docs/accidental.html
- VexFlow keysignature.js docs: http://www.vexflow.com/build/docs/keysignature.html
- Teach Piano Today — Key signatures for young students: https://www.teachpianotoday.com/2015/12/09/what-to-do-if-key-signatures-are-scary-for-your-piano-students/
- Magic of Music Ed — How to teach key signatures (2025): https://magicofmusiced.com/2025/03/02/how-to-teach-key-signatures/
- Open Music Theory — Compound meters and time signatures: https://viva.pressbooks.pub/openmusictheory/chapter/compound-meters-and-time-signatures/
- Direct codebase review: `VexFlowStaffDisplay.jsx`, `rhythmGenerator.js`, `patternBuilder.js`, `durationConstants.js`, `RhythmPatternGenerator.js`, `useTimingAnalysis.js`

---

*Pitfalls research for: Key Signatures & Advanced Rhythm content expansion (v2.4)*
*Researched: 2026-03-18*
