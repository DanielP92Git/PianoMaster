# Feature Research: Sharps & Flats Content Expansion (v2.2)

**Domain:** Beginner piano pedagogy — accidentals introduction for children
**Researched:** 2026-03-15
**Confidence:** HIGH (codebase audit + established piano pedagogy sources + existing partial implementation confirmed)

---

## Context: What Already Exists

This is a content expansion milestone, not a new feature area. Critical infrastructure is already in place:

| Asset | Status | Notes |
|-------|--------|-------|
| SVG note images (sharps + flats, treble + bass) | **COMPLETE** | All accidental images imported in `gameSettings.js` (Eb4, Db4, F#4, Bb4, Ab4, Gb4, etc.) |
| Audio samples for all accidentals | **COMPLETE** | Ab/Bb/Db/Eb/Gb .wav files in `src/assets/sounds/piano/` |
| `accidentals: false` flag in `noteConfig` | **EXISTS** (always false) | The toggle is already in all existing node definitions; enabling it is well-defined |
| Sharp/flat normalization in NotesRecognitionGame | **COMPLETE** | `normalizePitchKey`, `toFlatEnharmonic`, `isAccidentalPitch` helpers all operational |
| `SEMITONE_MAP` in SightReadingGame | **COMPLETE** | Covers all 12 chromatic notes including `Eb`, `Bb`, `C#`, `F#`, `G#`, `Ab`, `Db`, `Gb` |
| VexFlow accidental rendering | **COMPLETE** | `'b'` and `'#'` modifier support confirmed in `vexflow-guidelines.md`; `eb/4`, `f#/4` format works |
| TREBLE_5 + BASS_5 unit metadata in `skillTrail.js` | **COMPLETE** | Unit slots, names, descriptions, and badge IDs already defined |
| Pitch detection (`usePitchDetection.js`) | **COMPLETE** | NOTE_NAMES array includes all 12 chromatic notes (C, C#, D, D#, E, F, F#, G, G#, A, A#, B) |

**Conclusion:** This milestone is ~90% infrastructure, ~10% new code. The work is writing data files for the new nodes, not building new systems.

---

## Feature Landscape

### Table Stakes (Users Expect These)

These are the behaviors that define "accidentals content works as designed." Missing any of these means the new nodes feel broken compared to existing ones.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Correct standard accidental pedagogical sequence** | Piano method books (Faber, Alfred, Royal Conservatory) always introduce F#/C# before rarer accidentals; introducing Gb first would confuse learners | LOW | Use sharp-first sequence for treble (F#4, C#4, G#4, D#4), flat-first for bass (Bb3, Eb3, Ab3, Db3). See Pedagogy section below. |
| **One new accidental per Discovery node** | Cognitive load theory: 8-year-olds need single-concept introduction. Existing nodes all follow this pattern. | LOW | Each Discovery node introduces exactly 1 new accidental alongside its enharmonic neighbor (e.g., meet F#4 in context of F4 and G4) |
| **Natural + accidental contrast in early nodes** | Children must clearly distinguish natural from accidental version of the same letter name | MEDIUM | Discovery nodes should pair the new accidental with its natural (F4 + F#4), not just adjacent notes |
| **`accidentals: true` flag in noteConfig** | The flag already exists in all node definitions but is always `false`; game code may gate behavior on it | LOW | Verify what game code gates on `accidentals` flag; may just be documentation, or may control rendering behavior |
| **All 4 existing exercise types usable** | Note Recognition, Sight Reading, Memory Game, Boss Challenge already tested with accidentals (audio + visual infrastructure confirmed) | LOW | No new exercise types needed; use same 4 types in same pattern as existing units |
| **Subscription paywall enforcement** | All new nodes are premium-only per PROJECT.md requirement | LOW | Add new node IDs to `subscriptionConfig.js`; sync with Postgres `is_free_node()`. Existing dual-layer gate handles the rest. |
| **Build-time validation passes** | `npm run verify:patterns` must pass before deploy | LOW | New unit files must follow existing schema exactly. Validation script catches prerequisite cycles automatically. |
| **Boss nodes for each new unit** | Every existing unit ends with a Boss node; learners expect the celebration + badge. Treble Unit 5 boss and Bass Unit 5 boss are required. | LOW | Pattern established; reuse boss_treble_3 structure exactly |
| **`expandedNodes.js` updated** | New unit files must be imported and exported from the aggregation module | LOW | Pure data wiring — low risk, must not be forgotten |
| **`skillTrail.js` START_ORDER for new units** | Existing bass uses 51-75 range; new treble Unit 4/5 and bass Unit 4/5 need non-overlapping order values | LOW | Treble Units 4+5 continue from order 27; bass Units 4+5 continue from order 76. Research existing order values before assigning. |

---

### Standard Accidental Pedagogical Sequence (HIGH confidence)

This is derived from the circle of fifths order, Faber Piano Adventures, Alfred's Basic Piano Library, and Royal Conservatory pedagogy. This is not optional — the sequence exists for cognitive reasons.

**Why this specific order matters for children:**
- F# and Bb appear in the most commonly played keys (G major and F major)
- Children encounter these accidentals immediately in real beginner piano pieces
- Starting with rarer accidentals (Ab, Db, Gb) means children see notation they can't use yet

**Treble Clef Accidental Sequence (sharps-first approach — standard for treble):**

The treble clef path currently covers C4–C5. Accidentals should be introduced in the range the child already knows.

| Sub-unit | Notes to Add | Rationale |
|----------|--------------|-----------|
| Treble 4 (if not yet built) | Ledger lines beyond C4–C5 | Unit 4 is planned but not in scope for v2.2 — skip to Unit 5 |
| Treble Unit 5, Node 1–3 | F#4, then C#4 | F# first: appears in G major, most common sharp key; C# second: appears in D major |
| Treble Unit 5, Node 4–6 | G#4, then D#4/Eb4 | G# appears in A major; Eb introduces flat thinking alongside sharp context |
| Treble Unit 5, Node 7–9 | Bb4, then Ab4 | Bb appears in F major and Bb major; Ab in Eb major |
| Treble Unit 5, Boss | All 5–6 accidentals mixed | Full accidental challenge |

**Simplified recommended sequence for 8-year-olds (~10 nodes):**
Focus on 4–5 accidentals max to avoid cognitive overload. More content can go to a future Unit 6.

1. Meet F# (F#4, treble context of F4 and G4)
2. F# in context (F4, F#4, G4 sight reading)
3. Meet Bb (Bb4, treble context of A4 and B4)
4. Bb in context (A4, Bb4, B4 sight reading)
5. Sharps & Flats Together (F#4 + Bb4 mixed note recognition)
6. Meet C# (C#4, context of C4 and D4)
7. Meet Eb (Eb4, context of D4 and E4)
8. All Four Accidentals (F#4, Bb4, C#4, Eb4 mixed memory game)
9. Speed Round (all four, timed)
10. Boss: Accidental Master (all four, note recognition + sight reading)

**Bass Clef Accidental Sequence (flats-first approach — standard for bass):**

The bass clef path covers C4–C3. Accidentals should use the same range.

1. Meet Bb (Bb3, bass context of A3 and B3)
2. Bb in context (sight reading with Bb3 in range C4–C3)
3. Meet Eb (Eb3, context of D3 and E3)
4. Eb in context (sight reading with Eb3)
5. Flats Together (Bb3 + Eb3 mixed)
6. Meet Ab (Ab3, context of G3 and A3)
7. Meet Db (Db3/Db4, context)
8. All Four Bass Flats (Bb3, Eb3, Ab3, Db3/Db4 memory game)
9. Speed Round (all four bass flats, timed)
10. Boss: Bass Accidental Master (all four, dual exercise)

---

### Differentiators (Competitive Advantage)

Features that make this accidentals content stand out pedagogically.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Natural-vs-accidental visual contrast in Discovery node** | Showing F4 and F#4 side-by-side teaches the half-step visually (same staff position + different accidental symbol). Most apps show accidentals without the natural neighbor. | LOW | Pass `notePool: ['F4', 'F#4']` to a discovery node — the existing noteConfig structure supports this exactly |
| **Enharmonic awareness without theory overload** | After learning F#4 and Gb4 could be introduced as "the same black key, different name" — teaches dual identity concept without requiring children to understand why | MEDIUM | Optional: add an "Enharmonic Explorer" node (discovery type, F#4/Gb4 context). Child sees both names refer to the same piano key. Low risk, high curiosity value for 8-year-olds. |
| **Accidental in-measure carry rule** | In sight reading, if C#4 appears in measure 1, every C4 in that measure becomes C#4 automatically. This is standard music notation. The question is whether the sight reading generator supports this. | MEDIUM | Requires verification in `patternBuilder.js` — accidentals in generated patterns must follow the standard "carry rule." This may need a targeted fix. |
| **Black key labeling in note recognition feedback** | When a child gets an accidental wrong, showing "This is the black key between F and G" is more concrete than "F sharp" for an 8-year-old. | LOW | Text only, no new UI component needed. Can be added to the existing feedback display as a subtitle. |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Introducing all 10 accidentals at once in one unit** | Feels comprehensive and "complete" | Cognitive overload guaranteed. 8-year-olds need ~3 accidentals per unit max, with spaced repetition. Adding all 10 in one unit means no child reaches the boss node. | Introduce 4–5 accidentals in Unit 5, defer remaining to a future Unit 6 or key signature unit |
| **Sharps and flats simultaneously in first Discovery node** | Seems efficient | Sharp and flat are opposite concepts; introducing both in the same node means the child must learn "F#4 is up one half step" AND "Bb4 is down one half step" simultaneously — double cognitive load | Introduce one direction first (sharps OR flats), then the other after the first is secure. Treble: sharps first. Bass: flats first. |
| **Using enharmonic notation inconsistently** | G#4 and Ab4 are the same key; using both interchangeably sounds efficient | Confuses children and creates two representations of the same key in the note pool. NotesRecognitionGame has an existing `SHARP_TO_FLAT_MAP` that handles the normalization, but the game logic needs consistent input. | Pick one representation per accidental and stick to it. For treble sharps: use `F#4`, `C#4`, `G#4`. For bass flats: use `Bb3`, `Eb3`, `Ab3`. Avoid mixing for the same pitch in one node's notePool. |
| **Natural signs as a lesson topic** | "Children need to know the natural sign" | Natural signs are only relevant in the context of a key signature. Without key signatures (this app uses none currently), a natural sign is just a reset that children won't encounter in these exercises. | Natural signs can be introduced when key signatures are added (Trail Section 5, future milestone). They are out of scope for this unit which uses accidentals-as-chromatic-alterations only. |
| **Double sharps or double flats** | Musicologically complete | Never appropriate for beginner content. Children at this level have never seen them. | Defer indefinitely. |
| **Key signature nodes mixed into the accidentals unit** | Key signatures use the same sharps/flats | Key signatures are a different concept (accidentals that apply to the whole piece); mixing them with in-measure accidentals creates "why does this C have a sharp when I don't see the # symbol?" confusion | Key signatures belong in a dedicated future unit (Trail Section 5, deferred to later milestone) |

---

## Feature Dependencies

```
Existing infrastructure (COMPLETE — no changes needed):
    - SVG accidental note images (all accidentals, treble + bass)
    - Audio samples (Bb/Eb/Ab/Db/Gb .wav files)
    - Sharp/flat normalization in NotesRecognitionGame
    - SEMITONE_MAP in SightReadingGame
    - VexFlow accidental rendering (b, # modifiers)
    - Pitch detection NOTE_NAMES (all 12 chromatic notes)
    - TREBLE_5 + BASS_5 unit metadata stubs in skillTrail.js

New node data files (this milestone's primary work):
    trebleUnit5Redesigned.js
        └──requires──> TREBLE_4 boss node exists as prerequisite
        NOTE: If treble Unit 4 (ledger lines) is not built, must
              prerequisite off boss_treble_3 instead

    bassUnit5Redesigned.js
        └──requires──> BASS_4 boss node exists as prerequisite
        NOTE: Same concern — if bass Unit 4 not built, prerequisite
              off boss_bass_3

    expandedNodes.js update
        └──requires──> trebleUnit5Redesigned.js + bassUnit5Redesigned.js created

    subscriptionConfig.js update
        └──requires──> all new node IDs finalized

    Postgres is_free_node() update
        └──requires──> subscriptionConfig.js finalized
        └──must stay in sync with React-side FREE_NODE_IDS
```

### Prerequisite Resolution (CRITICAL)

The v2.2 scope says "~10 treble nodes, ~10 bass nodes." But Units 4 (ledger lines) for both paths are in `skillTrail.js` as planned but NOT YET BUILT (no unit files exist in `src/data/units/`). This creates a prerequisite gap:

- If Unit 4 is NOT built first: Unit 5 cannot prerequisite off `boss_treble_4` / `boss_bass_4`
- Options:
  1. **Build Unit 4 + Unit 5 in this milestone** — doubles scope but completes the pedagogical chain
  2. **Skip Unit 4, prerequisite Unit 5 directly off boss_treble_3 / boss_bass_3** — creates a pedagogical gap (jumping from octave naturals directly to accidentals, skipping ledger lines)
  3. **Build Unit 4 as placeholder stubs only** — not recommended; stub nodes with no real content undermine the trail

**Recommended:** Option 2 (prerequisite directly off existing boss nodes) for v2.2 scope control, with Unit 4 as a clearly documented future milestone. Pedagogically acceptable because accidentals within the C4–C5 range don't require ledger lines.

---

## MVP Definition

### Launch With (v2.2 — This Milestone)

The minimum viable content expansion that delivers value to subscribers without breaking existing functionality.

- [ ] **trebleUnit5Redesigned.js** — 10 nodes introducing F#4, Bb4, C#4, Eb4; boss unlocks "Accidental Master" badge (already defined in skillTrail.js as `accidental_master_badge`)
- [ ] **bassUnit5Redesigned.js** — 10 nodes introducing Bb3, Eb3, Ab3, Db3; boss unlocks "Bass Accidental" badge (already defined as `bass_accidental_badge`)
- [ ] **expandedNodes.js updated** — Imports and re-exports both new unit files
- [ ] **subscriptionConfig.js updated** — All 18 new node IDs (excluding bosses) listed as premium; boss nodes (boss_treble_5, boss_bass_5) added to PAYWALL_BOSS_NODE_IDS
- [ ] **Postgres migration** — `is_free_node()` function updated to match; no new columns needed
- [ ] **Build-time validation passes** — `npm run verify:patterns` green

### Add After Validation (v2.2.x)

- [ ] **Enharmonic Explorer node** — Optional "same key, two names" discovery node after F#/Gb are both known
- [ ] **Natural-vs-accidental sight reading** — Patterns that mix F4 and F#4 in the same measure to teach "in-measure accidental rule" (requires patternBuilder.js investigation first)
- [ ] **i18n for accidental names** — Hebrew translations for "sharp" (דיאז) and "flat" (במול) in victory/feedback screens

### Future Consideration (v2.3+)

- [ ] **Unit 4 (Ledger Lines)** — Treble and bass, fills the pedagogical gap between Unit 3 (octave) and Unit 5 (accidentals)
- [ ] **Key Signatures unit** — Natural signs, key context; requires separate research
- [ ] **Remaining accidentals** — Ab4, Db4, Gb4 in treble; and corresponding bass sharps if needed
- [ ] **Memory Game accidentals — larger pool** — Current memory game can handle accidental note pools; a unit 5 mix-up node using the 4 new accidentals works as a 2x4 grid

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| trebleUnit5Redesigned.js (data only) | HIGH | LOW | P1 |
| bassUnit5Redesigned.js (data only) | HIGH | LOW | P1 |
| expandedNodes.js wiring | HIGH | LOW | P1 |
| subscriptionConfig.js + Postgres sync | HIGH | LOW | P1 |
| Accidental in-measure carry verification | MEDIUM | MEDIUM | P2 — investigate before coding sight reading nodes |
| Enharmonic Explorer node | LOW | LOW | P2 — add if time allows |
| i18n for sharp/flat labels | LOW | LOW | P3 |
| Unit 4 Ledger Lines nodes | MEDIUM | MEDIUM | P3 — separate milestone |

**Priority key:**
- P1: Required for milestone completion
- P2: Add if investigation proves straightforward
- P3: Defer to future milestone

---

## Existing Code Integration Points

The following integration points need verification before writing node data — not because they need changes, but to confirm exact note naming format expected by each system:

| System | Note Format Required | Confirmed Working With Accidentals |
|--------|---------------------|-----------------------------------|
| `noteConfig.notePool` in unit files | `"F#4"`, `"Bb4"`, `"Eb4"` | Confirmed — `normalizePitchKey` handles `[A-G][#b]\d` format |
| VexFlow key strings in SightReadingGame | `'f#/4'`, `'bb/4'`, `'eb/4'` | Confirmed — vexflow-guidelines.md documents this format |
| Audio loader keys in NotesRecognitionGame | `"F#4"`, `"Bb4"` (or enharmonic flat) | Confirmed — `NOTE_AUDIO_LOADERS` has `Bb1-Bb7`, `Eb1-Eb7`, `Ab1-Ab7`, `Db1-Db7`, `Gb1-Gb7`; sharp variants auto-converted via `toFlatEnharmonic` |
| Pitch detection output | `"F#3"`, `"A#3"` (sharps only in NOTE_NAMES) | Confirmed — NOTE_NAMES uses sharps; SEMITONE_MAP in SightReadingGame handles both Eb/D# variants |
| Memory game cards | `"F#4"`, `"Bb4"` | Inferred confirmed — uses same notePool system |

**One open question:** Does `patternBuilder.js` for sight reading correctly carry accidentals within a measure (i.e., if a note F#4 appears, does the next F4 in the same measure auto-sharpen)? This is standard music notation behavior and must be verified before writing any sight reading exercise nodes with accidentals.

---

## Competitor Analysis: Accidentals Pedagogy

| Approach | Simply Piano | Yousician | Faber Piano Adventures | Our Recommended |
|----------|--------------|-----------|----------------------|-----------------|
| Order introduced | F#/Bb first (context-based) | Embedded in songs | F# in Level 1, Bb in Level 1 | F# first (treble), Bb first (bass) |
| Isolation vs. context | Context (song-embedded) | Context (song-embedded) | Isolated drills + context | Isolated discovery + context practice |
| Enharmonic teaching | Minimal (beginners) | Minimal | Not in Level 1 | Optional differentiator node |
| Natural sign | Taught when key sig introduced | Taught when key sig introduced | Taught with key sig | Defer (no key sigs yet) |
| Number of accidentals in beginner unit | 3–5 | 3–5 | 2–3 per level | 4 per unit (F#, Bb, C#, Eb) |

---

## Sources

- Existing codebase: `src/components/games/sight-reading-game/constants/gameSettings.js` (confirms accidental SVG + naming)
- Existing codebase: `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (confirms audio normalization)
- Existing codebase: `src/hooks/usePitchDetection.js` (confirms chromatic NOTE_NAMES)
- Existing codebase: `src/data/skillTrail.js` (confirms TREBLE_5/BASS_5 metadata stubs)
- Existing codebase: `src/data/PEDAGOGY.md` (confirms unit 5 = Accidentals in design docs)
- Existing codebase: `docs/vexflow-notation/vexflow-guidelines.md` (confirms `eb/4`, `f#/4` VexFlow notation)
- [The Order of Sharps and Flats: Ultimate Guide](https://littleredpiano.com/order-of-sharps-and-flats/) (circle of fifths pedagogical sequence) — MEDIUM confidence (web source)
- [Faber Piano Adventures Level 1 Q&A](https://pianoadventures.com/piano-books/accelerated-piano-adventures/level-1/accelerated-1-qa/) — F# introduced in Level 1 (MEDIUM confidence)
- Piano pedagogy standard: Alfred's Basic Piano Library uses accidentals to expose multiple keys before teaching key signatures formally — MEDIUM confidence (confirmed in web research)

---

*Feature research for: Sharps & Flats content expansion, piano learning PWA for 8-year-olds*
*Researched: 2026-03-15*
