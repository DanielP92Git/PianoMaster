# Feature Research: Key Signatures & Advanced Rhythm (v2.4)

**Domain:** Beginner-to-intermediate piano pedagogy — key signature context reading and advanced rhythm patterns for 8-year-old learners
**Researched:** 2026-03-18
**Confidence:** HIGH (codebase audit of all rhythm infrastructure + VexFlow API verification + established piano pedagogy cross-referenced against Simply Piano / Yousician / ABRSM / RCM / Faber curriculum)

---

## Context: What Already Exists

This is a content expansion milestone. The infrastructure for both areas is partially in place.

### Key Signatures Infrastructure

| Asset | Status | Notes |
|-------|--------|-------|
| VexFlow KeySignature class | **COMPLETE** | Documented in VexFlow API: `new KeySignature("G")` places F# on staff; supports all major/minor keys; clef-aware accidental placement |
| SightReadingGame VexFlow rendering pipeline | **COMPLETE** | `patternBuilder.js` already converts pitch strings to VexFlow key strings (`f#/4`, `bb/4`). No key signature object is rendered yet but notes already display correctly as accidentals. |
| Pitch detection (all 12 chromatic notes) | **COMPLETE** | `usePitchDetection.js` NOTE_NAMES covers all chromatic pitches; mic matches F#4, Bb4, etc. |
| Existing accidental node infrastructure | **COMPLETE** | v2.2 delivered trebleUnit4/5 + bassUnit4/5 covering F#, C#, G#, Bb, Eb, Ab, Db as individual accidentals |
| MIDI enharmonic matching | **COMPLETE** | `noteToMidi()` in SightReadingGame resolves A#4 === Bb4 at MIDI level |

**Key signature gap:** The SightReadingGame currently renders accidentals as explicit `♯`/`♭` symbols on individual notes. A key signature would instead display the accidentals at the clef, with notes rendered on their natural staff position — requiring the patternBuilder to suppress per-note accidental symbols when a key signature is active. This is a **targeted new feature** in the rendering layer.

### Advanced Rhythm Infrastructure

| Asset | Status | Notes |
|-------|--------|-------|
| 6/8 time signature definition | **COMPLETE** | `TIME_SIGNATURES.SIX_EIGHT` defined in `RhythmPatternGenerator.js` with `isCompound: true`, `strongBeats: [0, 3]`, `measureLength: 12` |
| 6/8 pattern database | **COMPLETE** | `public/data/6-8.json` exists with beginner/intermediate/advanced patterns |
| Syncopation patterns (COMPLEX mode) | **PARTIAL** | `COMPLEX_EXAMPLE_PATTERNS` in `rhythmPatterns.js` includes `eighthQuarterEighth` (syncopated) and `dottedQuarterEighth`. These are defined but whether MetronomeTrainer exposes them as trail config is untested. |
| Triplet duration constants | **DEFINED, INCOMPLETE** | `DURATION_CONSTANTS.QUARTER_TRIPLET = 8/3` exists in `RhythmPatternGenerator.js` — this is a floating-point value. The `generateRhythmEvents()` function uses integer sixteenth-unit math exclusively. Triplets would require a new non-integer grid or tuplet rendering in VexFlow. |
| `isCompound` flag in `TIME_SIGNATURE_GRID` | **COMPLETE** | `durationConstants.js` `buildTimeSignatureGrid()` passes `isCompound` through to the grid. Consumer code (rhythm game) can read this flag. |
| Dotted-quarter + eighth pattern | **COMPLETE** | Both `rhythmPatterns.js` and the 6/8 JSON database include dotted-quarter/eighth patterns — the primary 6/8 rhythmic building block |

**Advanced rhythm gap:** Triplets require a floating-point grid (or a dedicated integer-only triplet representation like `3 notes = 1 beat`). The current `generateRhythmEvents` sixteenth-unit system treats 1 beat = 4 units exactly; introducing 3-in-the-space-of-4 breaks this invariant. This is a **medium-complexity new feature** requiring either a new generator path or VexFlow tuplet notation.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that define "Key Signatures and Advanced Rhythm work as designed." Missing any of these means the new sections feel broken or pedagogically unsound.

#### Key Signatures

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Key signature displayed at clef on staff** | Standard music notation: learners see `♯` or `♭` at the beginning of each line before any notes. Without it, "key signature" is just an abstract concept. | MEDIUM | VexFlow `KeySignature` class renders this. `SightReadingGame` must instantiate it on the Stave. The `patternBuilder.js` must suppress per-note accidental symbols for notes that are already covered by the key signature. |
| **Notes rendered without explicit accidentals in the key** | In G major, every F displays as `F` (not `F♯`) because the key signature handles it. Showing `F♯` with a `♯` symbol in G major key is notation that contradicts the key signature — it would confuse children and be technically incorrect. | MEDIUM | Requires `patternBuilder.js` to know the active key signature and skip the Accidental modifier for notes that fall in the key. VexFlow's `Accidental.applyAccidentalForAllNotes()` auto-handles this when a key is set. |
| **Natural sign shown when key note is played as natural** | In G major, if an `F♮` appears (natural F), the natural sign must display explicitly. This is standard notation and learners must recognize it. | MEDIUM | VexFlow Accidental modifier with `'n'` type. Requires patternBuilder to emit natural accidentals when pitch is the natural form of a key-signature note. |
| **Correct pedagogical key sequence (Circle of Fifths order)** | Piano pedagogy (ABRSM, RCM, Faber, Alfred) universally introduces G major (1 sharp) before D major (2 sharps), and F major (1 flat) before Bb major (2 flats). Introducing D major before G major violates established learning progressions. | LOW | Node ordering must follow Circle of Fifths: C major → G major → D major (sharps), C major → F major → Bb major (flats). This is data work only. |
| **Key signature awareness in note pool generation** | When a trail node specifies key `G major`, the note pool (F#4, G4, A4, B4, C5, D5, E5) must use sharp-form pitches (`F#4`) for the game logic to match mic input correctly, even though the staff displays them without explicit `♯` symbols. | MEDIUM | Requires separation between "display representation" (natural letter name on staff) and "audio/logic representation" (F#4 in game state). The MIDI matching layer already handles this; the node config must be consistent. |
| **Build-time validation passes with new key signature nodes** | `npm run verify:patterns` must pass. New nodes must use valid node schema. | LOW | New nodes follow same structure as existing units; `keySignature` field needs to be added to schema validation if it validates node config structure. |
| **Boss node for each key signature unit** | Every existing unit ends with a Boss. The key signature section needs boss nodes for the trail celebration system. | LOW | 2 boss nodes (one sharp-keys boss, one flat-keys boss or one combined). Pattern established. |

#### Advanced Rhythm

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **6/8 time signature as first advanced content** | 6/8 is the standard "next step" after 4/4 and 3/4 for children. ABRSM Grade 3, Simply Piano Pre-Advanced I both use 6/8. The infrastructure already exists. | LOW | 6/8 patterns exist in `public/data/6-8.json`. MetronomeTrainer nodes just need to pass `timeSignature: '6/8'` in config. This is primarily data work. |
| **Syncopation as explicit teachable concept** | Children at this level (after mastering 4/4 through sixteenth notes) can handle syncopation if introduced as "accent on the weak beat." Durations exist (`eighthQuarterEighth` pattern). | MEDIUM | `COMPLEX_EXAMPLE_PATTERNS` in `rhythmPatterns.js` includes the syncopated `eighthQuarterEighth` pattern. MetronomeTrainer must expose this via trail config. Needs verification that the trail `rhythmConfig` can target specific complex patterns. |
| **Dotted-quarter + eighth grouping in 6/8** | The defining rhythm of 6/8 is the dotted-quarter/eighth combination. Children must learn to feel two groups of three, not six singles. | LOW | `dottedQuarterEighth` pattern exists in `COMPLEX_EXAMPLE_PATTERNS`. 6/8 JSON database includes this pattern at beginner level. |
| **Tempo range appropriate for compound feel** | 6/8 is typically conducted "in two" (2 dotted-quarter beats per measure), which at 60–80 BPM feels different from 4/4 at the same number. Children need slower tempos to feel the compound grouping (feel = "ONE-and-a TWO-and-a"). | LOW | Trail node `rhythmConfig.tempo` must be set lower (60–75 BPM) for early 6/8 nodes. Data work. |
| **Visual distinction between 4/4 and 6/8 in notation display** | The MetronomeTrainer must visually show the 6/8 time signature on the staff. Children need to read "6/8" as a signal before playing. | LOW | MetronomeTrainer's `RhythmNotationRenderer` already draws time signatures via `drawTimeSignature()` in Canvas. Passing `timeSignature: '6/8'` should work. Verify display behavior before shipping. |

---

### Standard Pedagogical Sequences (HIGH confidence)

These sequences are derived from ABRSM/RCM syllabi, Faber Piano Adventures, Alfred's Basic Piano Library, and Simply Piano's curriculum ordering. The sequences are not optional — they are cognitively determined.

#### Key Signature Learning Sequence for 8-Year-Olds

**Why the Circle of Fifths order matters:**
- G major (1 sharp: F#) and F major (1 flat: Bb) use accidentals the children already know from v2.2
- Introducing G major first means children immediately recognize "F# is the note I learned in the accidentals unit — now I see it in the key signature"
- Each new key adds exactly one new accidental, matching the one-new-concept-per-node rule

**Recommended Key Signature Sequence (~15 nodes across 2 sub-units):**

| Sub-Unit | Key | Accidentals | Notes |
|----------|-----|-------------|-------|
| Sharp Keys Unit (Unit 7) | G major | F# | Connect to existing F#4 knowledge from v2.2 |
| Sharp Keys Unit (Unit 7) | D major | F#, C# | Connect to existing C#4 knowledge |
| Sharp Keys Unit (Unit 7) | A major | F#, C#, G# | Connect to existing G#4 knowledge |
| Sharp Keys Boss | Boss | G/D/A major mixed | First milestone |
| Flat Keys Unit (Unit 8) | F major | Bb | Connect to existing Bb4 knowledge |
| Flat Keys Unit (Unit 8) | Bb major | Bb, Eb | Connect to existing Eb4 knowledge |
| Flat Keys Unit (Unit 8) | Eb major | Bb, Eb, Ab | Connect to existing Ab4 knowledge |
| Flat Keys Boss | Boss | F/Bb/Eb major mixed | Second milestone |

**Node structure per key (3-4 nodes per key, ~9-12 nodes per sub-unit):**
1. **Discovery**: "Meet G Major Key Signature" — staff shows key sig, notes are entirely within key
2. **Practice**: Sight reading in G major, two exercises (mic input)
3. **Challenge**: Mix of key notes + natural signs (F♮ in G major context)
4. (If room) **Memory Game**: Note name recognition within the key context

#### Advanced Rhythm Sequence for 8-Year-Olds

**Prerequisite:** Children must have completed Rhythm Unit 6 (sixteenth notes, 4/4 mastery). This is the current end of the Rhythm trail.

**Why this order:**
- 6/8 introduces compound meter gradually using durations already known (dotted-quarter, eighth)
- Syncopation in 4/4 uses familiar time signature, adding only accent displacement
- Off-beat patterns (eighth rest + quarter) are the most common syncopation in beginner/intermediate pieces

**Recommended Advanced Rhythm Sequence (~15 nodes across 2 sub-units):**

| Sub-Unit | Content | New Concept | Existing Infrastructure |
|----------|---------|-------------|------------------------|
| Compound Meter Unit (Unit 7) | 6/8 feel: "ONE-and-a TWO-and-a" | Compound beat grouping | 6/8 TIME_SIGNATURES, 6/8 JSON patterns |
| Compound Meter Unit (Unit 7) | Dotted-quarter + eighth in 6/8 | Primary 6/8 pattern | `dottedQuarterEighth` in COMPLEX_EXAMPLE_PATTERNS |
| Compound Meter Unit (Unit 7) | Eighth-note groups of 3 in 6/8 | Three-feel subdivision | 6/8 JSON intermediate patterns |
| Compound Meter Unit (Unit 7) | Mixed 6/8 patterns + rests | Compound rest placement | 6/8 JSON advanced patterns |
| Compound Meter Boss | Boss | 6/8 mastery | Combine all 6/8 patterns |
| Syncopation Unit (Unit 8) | Eighth rest + quarter (off-beat start) | Silence on strong beat | `COMPLEX_EXAMPLE_PATTERNS.eighthThenTwoSixteenths` |
| Syncopation Unit (Unit 8) | Eighth-quarter-eighth tie pattern | Accent across barline | `eighthQuarterEighth` syncopated pattern |
| Syncopation Unit (Unit 8) | Dotted-quarter emphasis in 4/4 | Long-short feel | `dottedQuarterEighth` in 4/4 context |
| Syncopation Unit (Unit 8) | Mixed syncopation in 4/4 | Multiple off-beat types | New complex patterns |
| Syncopation Boss | Boss | Combined compound + syncopation | Boss challenge |

---

### Differentiators (Competitive Advantage)

Features that make this content stand out pedagogically vs. Simply Piano / Yousician.

#### Key Signatures

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"You already know this note" connection** | When introducing G major, the UI explicitly says "F sharp is in this key — you learned it in Sharps & Flats!" Connecting new learning to existing knowledge reduces anxiety. Most apps introduce key signatures without referencing prior accidental learning. | LOW | Text/i18n change only. Add to Discovery node description and VictoryScreen celebration message. |
| **Key-colored staff highlighting** | When a note is in the key signature (e.g., F in G major), its staff position could be subtly tinted to reinforce which notes are "different." Not standard notation — purely a learning aid. | HIGH | Requires custom SVG layer over VexFlow output. Medium educational value for the complexity cost. Defer unless parent/teacher feedback requests it. |
| **Natural sign explicit tutorial** | A dedicated "Meet the Natural Sign" node that shows F♯ (from key sig) versus F♮ (explicit natural) side-by-side. Natural signs are a genuine cognitive hurdle. Yousician skips this for children; Simply Piano introduces it only in Pre-Advanced I. | MEDIUM | New node type content only. VexFlow already supports natural sign rendering. Accidental modifier `'n'` type. |
| **Key signature recognition quiz** | A dedicated exercise where the child sees a key signature and identifies it by name (e.g., "This key has 1 sharp — which key is it?"). This is theory, not performance. | MEDIUM | Requires a new exercise type or leveraging the Memory Game for key-name matching. Could reuse MemoryGame card-flip mechanic: clef card with key sig ↔ key name card. |

#### Advanced Rhythm

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Compound feel audio demonstration** | Before tapping in 6/8, the child hears a short 4-beat audio example that demonstrates "ONE-and-a TWO-and-a." The ear model before the notation. Yousician uses video; Simply Piano uses notation-only. | MEDIUM | Web Audio API synthesis already used for fanfare (v1.4). A 2-second compound-beat audio demo is achievable. Risk: requires UX for play/replay trigger before game starts. |
| **Syncopation "feel it first" verbal cue** | Before the notation tap game, show the pattern as a verbal phrase (e.g., "ta REST ta-ta" for eighth-quarter-eighth). Research shows verbal encoding helps children internalize syncopation before counting. | LOW | Text-only change to the pattern display area. No new systems. |
| **Off-beat visual indicator** | When a syncopated pattern places a note on a weak beat, a subtle visual indicator (like a colored beat marker below the staff) helps children see the "between beats" placement. | MEDIUM | Canvas-based beat grid already drawn by RhythmNotationRenderer. Adding a highlighted weak-beat marker is a Canvas drawing addition. |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Teaching key signatures without prior accidental mastery** | Feels like the natural theory progression after note reading | Children who cannot already recognize F# and Bb as individual notes will be overwhelmed seeing them appear "automatically" from a key signature they cannot relate to prior knowledge | The v2.2 accidentals units must be completed before key signatures unlock — prerequisite chain must enforce this |
| **Introducing triplets in the Advanced Rhythm unit** | Triplets feel like a natural next step after sixteenth notes | The `generateRhythmEvents()` system uses integer sixteenth-unit math (1 beat = 4 units exactly). Triplets require 3 events in 4 units (non-integer). The existing generator cannot produce valid triplet notation without a new grid or VexFlow tuplet API integration | Defer triplets to a v2.5 or later milestone after dedicated engineering investigation. Advanced Rhythm v2.4 should use 6/8 (which feels like triplets via compound grouping) without requiring actual tuplet notation |
| **Minor key signatures alongside major** | Seems complete and educational | Minor keys require understanding relative keys (A minor = same as C major). For 8-year-olds who just learned major keys, mixing minor creates "but why does C major have an A minor version?" confusion without resolution | Teach major keys only in v2.4. Minor keys belong in a dedicated v2.5 milestone with explicit "same notes, different feel" pedagogy |
| **Grand Staff (treble + bass) key signature exercises** | "Real piano reading requires both clefs" | The app currently teaches treble and bass as parallel independent trails. Grand staff reading requires simultaneous attention to two clefs — a significant cognitive jump. This is a separate milestone concern (listed in PROJECT.md as deferred). | Keep key signatures on separate treble and bass trails initially. Grand Staff is a future Section 6 milestone. |
| **Key signature in rhythm-only exercises** | "Real music has key signatures" | The rhythm trail uses single pitch C4. Introducing a key signature in a rhythm context adds visual noise without pedagogical value — the child is focusing on beat, not pitch reading | Rhythm trail nodes remain single-pitch C4. Key signature nodes live on treble and bass trails only. |
| **All 12 major key signatures at once** | "Cover everything systematically" | 12 keys at once = 12 new concepts with no connection to prior learning. ABRSM/RCM standard: cover 3-4 keys per grade level, building gradually. 8-year-olds need a success cycle of approximately 3 nodes per new concept. | Cover 6 major keys (G, D, A for sharps; F, Bb, Eb for flats) in v2.4. Remaining keys (E major, B major, etc.) belong in v2.5 or v2.6 content expansion. |
| **Tie notation in advanced rhythm** | Ties extend notes across bar lines — "important for real music" | Tie notation requires cross-measure state in the rhythm generator. The current `generateRhythmEvents()` is measure-scoped. Ties would require multi-measure pattern awareness, which is a significant generator change. | Dotted notes accomplish the same feel (longer sustained notes) without cross-measure complexity. Use dotted-quarter + eighth as the compound meter teaching device instead of ties. |

---

## Feature Dependencies

```
Key Signatures (Trail Section 5 — treble + bass tabs):
    Prerequisite: boss_treble_5 (accidentals unit complete)
        └──requires──> trebleUnit4/5 data (COMPLETE — shipped in v2.2)
    Prerequisite: boss_bass_5 (accidentals unit complete)
        └──requires──> bassUnit4/5 data (COMPLETE — shipped in v2.2)

    Key Signatures — Sharp Keys Unit (new trebleUnit6 + bassUnit6)
        └──requires──> VexFlow KeySignature rendering in SightReadingGame
                           └──requires──> patternBuilder.js: suppress per-note accidentals
                                          when note falls within active key signature
                           └──requires──> patternBuilder.js: emit natural sign for
                                          naturalized key-signature notes
        └──requires──> noteConfig.keySignature field added to node schema
        └──requires──> SightReadingGame passes keySignature to patternBuilder

    Key Signatures — Flat Keys Unit (new trebleUnit7 + bassUnit7)
        └──requires──> Same rendering changes as Sharp Keys Unit

    Boss nodes (boss_treble_6, boss_bass_6, etc.)
        └──requires──> All Sharp/Flat Key units complete in that path

Advanced Rhythm (Trail Section 8 — Rhythm tab):
    Prerequisite: boss_rhythm_6 (sixteenth notes complete)
        └──requires──> rhythmUnit6 (COMPLETE — shipped in v1.3 / redesigned)

    Compound Meter Unit (new rhythmUnit7)
        └──requires──> MetronomeTrainer supports timeSignature: '6/8' via trail config
                           └──6/8 TIME_SIGNATURES: COMPLETE
                           └──6/8 pattern JSON: COMPLETE
                           └──MetronomeTrainer trail config wiring: NEEDS VERIFICATION
        └──requires──> RhythmNotationRenderer displays 6/8 time sig correctly

    Syncopation Unit (new rhythmUnit8)
        └──requires──> MetronomeTrainer can select specific COMPLEX_EXAMPLE_PATTERNS
                           via trail config (enabledComplexPatterns field)
                           └──generateRhythmEvents() already accepts enabledComplexPatterns: null = all
                           └──NEEDS: trail config must pass specific pattern IDs

    No triplets (see anti-features) — keeps dependencies self-contained

Subscription gate:
    └──All new node IDs must be absent from FREE_NODE_IDS (default-deny)
    └──Postgres is_free_node() function must be in sync
    └──Both are LOW complexity, same as v2.2 approach

Build-time validation:
    └──verify:patterns must accept new keySignature field in nodeConfig schema
    └──New node IDs must not conflict with existing ORDER values
```

### Dependency Notes

- **Key signature rendering requires patternBuilder changes:** This is the single highest-risk item for the key signatures unit. The existing `toVexFlowNote()` function does not suppress accidentals based on key context. VexFlow's `Accidental.applyAccidentalForAllNotes(notes, keySignature)` static method exists and handles this automatically — it needs to be called in the rendering pipeline. Confidence: MEDIUM (VexFlow docs confirm the API exists; integration in patternBuilder not yet prototyped).

- **Syncopation requires enabledComplexPatterns wiring:** The `generateRhythmEvents()` function already accepts `enabledComplexPatterns` array (null = allow all). Trail node `rhythmConfig` must pass specific pattern IDs. This requires adding `enabledComplexPatterns` to the trail node schema and the MetronomeTrainer's auto-start trail config builder. Complexity: LOW once the field is identified.

- **6/8 MetronomeTrainer wiring has unknown risk:** The MetronomeTrainer's trail auto-start block builds `trailSettings` from `rhythmConfig`. Whether it forwards `timeSignature: '6/8'` to `generateRhythmEvents` needs verification. The 6/8 infrastructure exists but the trail-to-game wiring path must be traced before writing nodes.

---

## MVP Definition

### Key Signatures MVP (v2.4 Launch)

Minimum content that delivers a usable key signature learning section.

- [ ] **patternBuilder.js: key signature rendering** — VexFlow KeySignature on Stave; suppress per-note accidentals for key notes; emit natural signs for naturalized notes. Spike this first — it is the gating item.
- [ ] **nodeConfig schema: `keySignature` field** — e.g., `keySignature: 'G'` in noteConfig. SightReadingGame passes it to patternBuilder.
- [ ] **treble key signatures unit** — G major (3-4 nodes), D major (3-4 nodes), F major (3-4 nodes), Bb major (3-4 nodes), Boss node (~14-16 nodes total)
- [ ] **bass key signatures unit** — Same 4 keys, same structure (~14-16 nodes)
- [ ] **expandedNodes.js updated** — New unit files imported
- [ ] **subscriptionConfig.js + Postgres sync** — All new node IDs premium-only
- [ ] **Build-time validation passes**

### Advanced Rhythm MVP (v2.4 Launch)

- [ ] **MetronomeTrainer wiring verification** — Confirm `timeSignature: '6/8'` in `rhythmConfig` reaches `generateRhythmEvents()` via trail auto-start. If wiring gap found, fix it.
- [ ] **rhythmUnit7 (Compound Meter)** — Meet 6/8 (3-4 nodes), dotted-quarter/eighth (2-3 nodes), mixed 6/8 (2-3 nodes), Boss (~8-10 nodes)
- [ ] **enabledComplexPatterns trail wiring** — MetronomeTrainer auto-start passes `enabledComplexPatterns` from `rhythmConfig` to generator
- [ ] **rhythmUnit8 (Syncopation)** — Eighth rest + quarter (2-3 nodes), eighthQuarterEighth (2-3 nodes), mixed syncopation (2-3 nodes), Boss (~8-10 nodes)
- [ ] **expandedNodes.js updated** — rhythmUnit7 + rhythmUnit8 imported
- [ ] **subscriptionConfig.js + Postgres sync** — All new rhythm node IDs premium-only

### Add After Validation (v2.4.x)

- [ ] **Natural sign tutorial node** — Dedicated "Meet the Natural Sign" discovery node (MEDIUM complexity, HIGH educational value)
- [ ] **Key signature recognition memory game** — Card-flip mechanic: key signature card ↔ key name card. Reuses MemoryGame infrastructure.
- [ ] **Compound feel audio demo** — 2-second Web Audio demonstration before 6/8 exercises begin
- [ ] **A major key signature** — Third sharp key (F#, C#, G#) — extends the sharp unit if 3 keys prove insufficient
- [ ] **Eb major key signature** — Third flat key — extends the flat unit

### Future Consideration (v2.5+)

- [ ] **Triplet notation** — Requires generator refactor for non-integer grid or VexFlow tuplet API. Defer.
- [ ] **Minor key signatures** — Relative minor concept. Requires "same notes, different feel" pedagogy. Defer.
- [ ] **Remaining major keys** (E major, B major, Ab major, Db major) — After 6 core keys are mastered
- [ ] **Grand Staff key signature exercises** — Cross-clef reading. Part of Two-Hand Basics section (Section 6 in PROJECT.md)
- [ ] **12/8 time signature** — Slowest compound feel. Pedagogically after 6/8 mastery.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| patternBuilder.js key signature rendering spike | HIGH | MEDIUM | P1 — gating item, must be done first |
| 6/8 MetronomeTrainer wiring verification | HIGH | LOW | P1 — gating item for rhythm section |
| Key signature node data (G, D, F, Bb major) | HIGH | LOW (once spike passes) | P1 |
| rhythmUnit7 (Compound Meter 6/8) | HIGH | LOW (once wiring confirmed) | P1 |
| enabledComplexPatterns trail wiring | HIGH | LOW | P1 |
| rhythmUnit8 (Syncopation) | HIGH | LOW (once wiring confirmed) | P1 |
| Boss nodes for each new unit | MEDIUM | LOW | P1 |
| subscriptionConfig + Postgres sync | HIGH | LOW | P1 |
| Natural sign tutorial node | MEDIUM | MEDIUM | P2 |
| Key signature recognition Memory Game | MEDIUM | MEDIUM | P2 |
| Compound feel audio demo | LOW | MEDIUM | P3 |
| A major + Eb major additional keys | LOW | LOW | P3 |

**Priority key:**
- P1: Required for v2.4 milestone completion
- P2: Add if time allows after P1 is complete
- P3: Defer to v2.4.x patch or v2.5

---

## Existing Code Integration Points

The following integration points need verification or targeted modification before writing node data. Verification should happen before any node data is written to avoid data that cannot be exercised by games.

### Key Signatures

| Integration Point | Required Change | Risk |
|-------------------|----------------|------|
| `patternBuilder.js` `toVexFlowNote()` | Must suppress Accidental modifier for notes covered by active key signature | MEDIUM — must call `Accidental.applyAccidentalForAllNotes(notes, keySpec)` in the render pipeline after notes are built |
| `SightReadingGame.jsx` Stave creation | Must add `KeySignature(keySpec).addToStave(stave)` call when `noteConfig.keySignature` is present | LOW — VexFlow API is documented; locating the Stave creation call in SightReadingGame is the main task |
| `SightReadingGame.jsx` note pool generation | When `keySignature` is active, note pool must use accidental-form pitches (`F#4` not `F4` for G major) for mic matching, even though staff displays `F` without a `♯` symbol | MEDIUM — logic separation: staff display vs. game state pitch representation |
| Trail node schema (`verify:patterns`) | If validation script checks for unknown fields in `noteConfig`, `keySignature: 'G'` must be listed as a known field | LOW — add to validation allowlist |
| `NotesRecognitionGame.jsx` (key sig nodes?) | Key signature context is only relevant for sight reading (staff rendering). Note recognition game shows isolated notes, not staff with key sig. Key signature nodes should use SIGHT_READING type, not NOTE_RECOGNITION. | LOW — architectural decision, not a code change |

### Advanced Rhythm

| Integration Point | Required Change | Risk |
|-------------------|----------------|------|
| MetronomeTrainer trail auto-start block | Trace whether `rhythmConfig.timeSignature` is forwarded to `generateRhythmEvents()`. If the auto-start block hardcodes `'4/4'`, 6/8 nodes will silently use wrong time signature. | MEDIUM — same class of bug as v2.2 `enableSharps` hardcode pitfall |
| MetronomeTrainer trail auto-start block | Trace whether `rhythmConfig.enabledComplexPatterns` (or equivalent) is forwarded. Currently the trail auto-start may pass `enabledComplexPatterns: null` (all patterns), which would include syncopation in non-syncopation nodes. | MEDIUM — needs explicit per-node pattern whitelisting |
| `generateRhythmEvents()` complex pattern selection | Currently `enabledComplexPatterns: null` means all patterns. For 6/8 nodes, complex patterns designed for 4/4 must be excluded. Need a `timeSignature`-aware filter or explicit pattern ID lists per node. | LOW — data-level solution: pass explicit pattern IDs in each rhythm node config |
| `RhythmNotationRenderer.jsx` 6/8 display | Canvas-based renderer already calls `drawTimeSignature()`. Verify it renders "6" over "8" correctly (not just "4" over "4"). Inspect render at 6/8 config. | LOW — likely already works; visual verification required |

---

## Competitor Feature Analysis

| Feature | Simply Piano | Yousician | Our Approach |
|---------|--------------|-----------|--------------|
| Key signature introduction timing | Pre-Advanced I (near end of 2-year curriculum) | Embedded in songs when encountered | After accidentals mastery (~6 months into trail) — earlier than Simply Piano, supported by prior accidental knowledge |
| Keys covered at beginner level | D major, F major (2 keys only) | Encountered in song context (variable) | G, D, F, Bb major (4 keys) — complete one-sharp and one-flat families |
| Natural sign teaching | Implicit in song context | Implicit | Explicit tutorial node (differentiator) |
| 6/8 time introduction | Pre-Advanced I (late curriculum) | Intermediate level | After sixteenth note mastery — earns "advanced" label appropriately |
| Syncopation teaching | Song-embedded | Song-embedded | Dedicated progressive unit with verbal cue support |
| Triplets | Pre-Advanced curriculum | Intermediate+ | Deferred — infrastructure cost too high for v2.4 |

---

## Sources

- Existing codebase: `src/components/games/rhythm-games/RhythmPatternGenerator.js` — confirms TIME_SIGNATURES.SIX_EIGHT, DURATION_CONSTANTS.QUARTER_TRIPLET, DIFFICULTY_LEVELS
- Existing codebase: `public/data/6-8.json` — confirms 6/8 pattern database with beginner/intermediate/advanced patterns
- Existing codebase: `src/components/games/sight-reading-game/utils/rhythmPatterns.js` — confirms COMPLEX_EXAMPLE_PATTERNS includes syncopated `eighthQuarterEighth` and `dottedQuarterEighth`
- Existing codebase: `src/components/games/sight-reading-game/constants/durationConstants.js` — confirms `isCompound` flag propagated through TIME_SIGNATURE_GRID
- VexFlow API docs (keysignature.js): `KeySignature` class, clef-aware accidental placement, `Accidental.applyAccidentalForAllNotes()` — MEDIUM confidence (official API docs, version alignment unverified)
- [Simply Piano review — course structure](https://pianoers.com/simply-piano-review-the-honest-truth-about-learning-piano-with-an-app/) — confirms Pre-Advanced I introduces key signatures (D major, F major) — MEDIUM confidence
- [Yousician piano review — key signatures in curriculum](https://www.pianodreamers.com/yousician-piano-review/) — confirms Yousician teaches key signatures in song context — MEDIUM confidence
- [Major Key Signatures — Puget Sound](https://musictheory.pugetsound.edu/mt21c/MajorKeySignatures.html) — order of sharps/flats, circle of fifths progression — HIGH confidence (academic music theory source)
- [Key Signature Chart — hoffmanacademy.com](https://www.hoffmanacademy.com/store/learning-and-teaching-resources/key-signature-chart) — pedagogical sequencing confirmation — MEDIUM confidence
- [Teaching Syncopation — Yellow Brick Road blog](https://yellowbrickroadblog.com/teaching-syncopation-part-one/) — "feel before notation" approach for children — MEDIUM confidence (experienced piano teacher)
- [6/8 Time Signature explanation — muted.io](https://muted.io/6-8-time-signature/) — compound meter beat grouping explanation — MEDIUM confidence
- [5 Syncopation Exercises for Piano Beginners — Cooper Piano](https://cooperpiano.com/5-syncopation-exercises-for-piano-beginners/) — beginner syncopation teaching approach — MEDIUM confidence
- [Cognitive load in piano reading — Medium/Wurmsdobler](https://peter-wurmsdobler.medium.com/reducing-the-cognitive-load-in-reading-piano-sheet-music-a513aba01304) — key signature vs individual accidentals cognitive load — MEDIUM confidence
- [All About Grade 3 Piano — PianoTV.net](https://www.pianotv.net/2017/02/all-about-grade-3-piano-rcm-and-abrsm/) — ABRSM/RCM Grade 3 introduces compound meter — MEDIUM confidence
- Piano pedagogy consensus (Faber Piano Adventures, Alfred's Basic Piano Library, Royal Conservatory): accidentals before key signatures, G major before D major, F major before Bb major — HIGH confidence (multiple independent sources agree)

---

*Feature research for: Key Signatures and Advanced Rhythm content expansion, piano learning PWA for 8-year-olds*
*Researched: 2026-03-18*
