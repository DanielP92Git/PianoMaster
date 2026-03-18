# Project Research Summary

**Project:** PianoApp2 — v2.4 Key Signatures & Advanced Rhythm
**Domain:** Piano learning PWA content expansion — 8-year-old learners
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

This is a content expansion milestone, not a new product build. The existing stack (React 18, Vite 6, Supabase, VexFlow v5, pitchy, Tailwind, i18next) requires zero new dependencies. All APIs needed for key signatures, compound time, and syncopation are present in the already-installed `vexflow@5.0.0` package — confirmed by direct inspection of `node_modules/vexflow/build/cjs/vexflow.js`. The work divides cleanly into two independent learning tracks: Key Signatures (treble + bass trails) and Advanced Rhythm (rhythm trail), plus a shared rendering layer that must be modified before any content can be authored.

The recommended approach is to treat rendering infrastructure as Phase 1 prerequisites that gate all content authoring. Two VexFlow changes are the highest-risk items: (1) key signature rendering in `VexFlowStaffDisplay.jsx` requires branching the accidental-handling logic to avoid doubled glyphs when `Accidental.applyAccidentals()` runs alongside the existing manual accidental modifiers; and (2) 6/8 compound beaming requires passing `Beam.generateBeams(notes, { groups: [new Fraction(3, 8)] })` rather than the current default. Both are targeted surgical modifications to a single large component. All remaining work — six new unit data files, two generator extensions, trail wiring — is additive and follows established patterns from v2.2.

The primary risks are pedagogical, not technical. Research firmly recommends beginning key signature instruction only after explicit scaffolding that explains the paradigm shift from individual accidentals (v2.2 model) to key-context accidentals. The first Discovery node must communicate: "The sharp here means every F is sharp automatically — no symbol needed on the note." Skipping this causes systematic misreading. Similarly, 6/8 requires a "feel the two big beats" framing before any performance exercises begin. Minor keys, triplets, grand-staff key signatures, and keys with 4+ sharps/flats are explicitly deferred to v2.5+.

---

## Key Findings

### Recommended Stack

No new dependencies are needed. The installed `vexflow@5.0.0` contains all required APIs: `KeySignature`, `Fraction`, `Tuplet`, `Accidental.applyAccidentals`, `Stave.addKeySignature`, and `Beam.getDefaultBeamGroups`. Three VexFlow imports not yet in `VexFlowStaffDisplay.jsx` must be added: `KeySignature`, `Fraction`, and `Tuplet`. i18next needs additive translation keys for key names in Hebrew (e.g. `"G major"`, `"מי מינור"`). No Supabase schema changes are needed — `node_id TEXT` already accommodates new node IDs, and the default-deny subscription gate pattern means new premium nodes require no `subscriptionConfig.js` changes unless a free-tier extension is explicitly planned.

**Core technologies (all existing — zero new dependencies):**
- `vexflow@5.0.0`: SVG music notation — all v2.4 APIs confirmed present in installed build; `KeySignature`, `Fraction`, `Tuplet` are the three not-yet-imported classes needed
- `React 18 / Vite 6`: No changes — game component architecture unchanged
- `i18next@25.7.0`: Add `keySignature.*` translation namespace — additive only
- `pitchy@4.1.0`: Pitch detection — unchanged; key signatures are display-only; McLeod detects absolute chromatic pitch regardless of key context
- `@supabase/supabase-js@2.48.1`: No schema changes; new nodes use existing `student_skill_progress` table with `node_id TEXT`

### Expected Features

**Must have (table stakes — required for v2.4 launch):**
- Key signature glyphs displayed at staff start via `Stave.addKeySignature(key)`
- Notes rendered without redundant accidentals when covered by active key signature (`Accidental.applyAccidentals`)
- Natural sign rendered when a key-signature note is played natural (e.g. F♮ in G major)
- Circle of Fifths ordering: G major before D major; F major before Bb major — pedagogically non-negotiable per ABRSM/RCM/Faber consensus
- 6/8 as the first compound meter — infrastructure exists; trail wiring and beat model fix are the work
- Syncopation in 4/4 via `COMPLEX_EXAMPLE_PATTERNS.eighthQuarterEighth` — exposed via trail config
- Boss nodes at end of each new unit — required by trail celebration system
- All new nodes premium by default (absent from `FREE_NODE_IDS`)

**Should have (add after core v2.4 if time allows):**
- Natural sign tutorial node — dedicated "Meet the Natural Sign" discovery node (F♯ vs F♮ side-by-side)
- Key signature recognition memory game — card-flip mechanic reusing MemoryGame infrastructure
- A major and Eb major keys — extends sharp/flat families beyond the 4-key minimum
- Compound feel audio demo — 2-second Web Audio demonstration before 6/8 exercises

**Defer to v2.5+:**
- Triplets — requires non-integer grid or VexFlow tuplet API; existing generator uses integer sixteenth-unit math exclusively; cannot be added without generator refactor
- Minor key signatures — requires "relative key" pedagogy; cognitively premature at this stage
- Remaining major keys (E, B, Ab, Db, Gb, Cb) — after 6 core keys are mastered
- Grand staff key signature exercises — cross-clef reading is a separate future section
- 9/8 and 12/8 compound meters — after 6/8 mastery is demonstrated

### Architecture Approach

The architecture follows a strict layered dependency: trail data files feed into `expandedNodes.js`, which feeds `skillTrail.js`, which gates rendering via `SightReadingGame.jsx` (key signatures) and `MetronomeTrainer.jsx` (advanced rhythm). Both game components already accept `keySignature` and `timeSignature` from trail node config via `location.state`; the gap is that `VexFlowStaffDisplay.jsx` and `rhythmGenerator.js` do not yet act on those values. Six new unit files are the content layer; five existing files need targeted modification. Confirmed unchanged: pitch detection, `NotesRecognitionGame`, `MemoryGame`, subscription gate, Supabase tables.

**Major components and their v2.4 change status:**
1. `VexFlowStaffDisplay.jsx` (MODIFIED) — add `stave.addKeySignature()`, `Accidental.applyAccidentals()`, and conditional 6/8 beam grouping; add `omitAccidentals` flag to `buildStaveNote()` to prevent doubled glyphs; call `stave.draw()` before `Formatter.format()` to get correct post-modifier `noteStartX`
2. `patternBuilder.js` (MODIFIED) — accept and return `keySignature` param with backward-compatible `'C'` default; no existing behavior changed
3. `RhythmPatternGenerator.js` (MODIFIED) — fix `SIX_EIGHT.beats` from `6` to `2` (compound beat model); `unitsPerBeat` becomes `6`
4. `rhythmPatterns.js` (MODIFIED) — add compound 6/8 syncopation patterns to `COMPLEX_EXAMPLE_PATTERNS`
5. `expandedNodes.js` (MODIFIED) — 6 new import statements and array spreads
6. New unit files `trebleUnit6-7`, `bassUnit6-7`, `rhythmUnit7-8` (NEW) — pure data; zero risk to existing 129 nodes

### Critical Pitfalls

1. **Doubled accidental glyphs when key signature is active** — The existing `buildStaveNote()` in `VexFlowStaffDisplay.jsx` manually adds `Accidental` modifiers for any pitch containing `#` or `b`. When `Accidental.applyAccidentals()` is also called for key signature mode, both run and produce doubled glyphs. Prevention: add an `omitAccidentals` flag to `buildStaveNote()` that skips manual modifiers when a key signature is set; let `Accidental.applyAccidentals()` be the sole accidental manager for key-sig nodes.

2. **Key signature glyph width breaks VexFlow layout** — `stave.getNoteStartX()` returns a pre-modifier value if fetched before `stave.draw()` is called. The existing fixed `baseWidth = 500` does not account for 20-80px of key signature horizontal space (grows with accidental count). Prevention: call `stave.draw()` first, then re-fetch `stave.getNoteStartX()` before calling `Formatter.format()`.

3. **6/8 modeled as 6 simple beats instead of 2 compound beats** — `RhythmPatternGenerator.js` defines `SIX_EIGHT.beats = 6`, producing `unitsPerBeat = 2`. The correct compound model is `beats: 2, unitsPerBeat: 6`. Getting this wrong breaks timing window math and syncopation detection for all compound meter work. Prevention: fix this constant before writing any 6/8 node data — it is a one-line change with broad downstream impact.

4. **Beam grouping in 6/8 defaults to 4/4 notation (2+2+2 instead of 3+3)** — `Beam.generateBeams()` without a `groups` parameter uses quarter-note grouping, which is musically incorrect for compound time and visually misleads learners about beat structure. Prevention: pass `{ groups: Beam.getDefaultBeamGroups('6/8') }` or `{ groups: [new Fraction(3, 8)] }` when rendering compound time.

5. **Key signature paradigm shift not scaffolded for 8-year-olds** — Children trained by v2.2 to see explicit `#` symbols on notes will read F in G major as F natural because the `#` is absent from the note head. This is the highest recovery-cost pitfall (requires node redesign, not code change). Prevention: first Discovery nodes must include explicit callout text — "The # here means every F is sharp all through the song" — and must use `NOTE_RECOGNITION` (not `SIGHT_READING`) for initial key signature exposure.

---

## Implications for Roadmap

Based on combined research, the recommended phase structure for v2.4:

### Phase 1: VexFlow Key Signature Rendering Infrastructure
**Rationale:** This is the single blocking dependency for all key signature content. No key signature node data can be authored until the rendering layer is verified. FEATURES.md and ARCHITECTURE.md identify this as the gating item; PITFALLS.md flags two critical pitfalls (layout overlap, doubled accidentals) that must be eliminated before content begins.
**Delivers:** `VexFlowStaffDisplay.jsx` with `keySignature` prop support; `patternBuilder.js` returning `keySignature`; `stave.addKeySignature()` and `Accidental.applyAccidentals()` integrated; `omitAccidentals` flag in `buildStaveNote()`; post-draw `noteStartX` fetch for correct layout; visual verification in free-play sight reading mode with manually-set G major key.
**Addresses:** Table stakes — key signature display, accidental suppression, natural sign rendering.
**Avoids:** Pitfall 1 (doubled accidentals), Pitfall 2 (layout overlap).
**Research flag:** None needed — VexFlow APIs fully verified against installed package with exact code in ARCHITECTURE.md. Spike and verify before writing any node data.

### Phase 2: Key Signature Node Data (Treble + Bass)
**Rationale:** Once rendering is proven, node authoring is low-risk additive data work following the exact v2.2 unit file pattern. The pedagogical scaffolding requirements from Pitfall 6 (cognitive overload) must be written into Discovery node descriptions. FEATURES.md specifies the Circle of Fifths sequence and the NOTE_RECOGNITION-first exercise type progression.
**Delivers:** `trebleUnit6Redesigned.js` (G major, D major — ~7 nodes), `trebleUnit7Redesigned.js` (A major, F major, Bb major + boss — ~8 nodes), `bassUnit6-7Redesigned.js` (mirrors treble), wired into `expandedNodes.js`; `npm run verify:patterns` passes; all new nodes premium-only.
**Addresses:** ~14-16 treble nodes, ~14-16 bass nodes, 2 boss nodes; prerequisite chains from v2.2 accidental units enforced.
**Avoids:** Pitfall 5 (cognitive overload) — Discovery nodes require explicit key-signature explanation text; Pitfall 8 (subscription gate) — no `FREE_NODE_IDS` additions needed.
**Research flag:** Standard pattern — no additional research needed. Note: key sig nodes must use natural pitch names in `notePool` (e.g. `'F4'` not `'F#4'`) — the key signature handles the accidental. This is the opposite of v2.2 accidental nodes.

### Phase 3: Advanced Rhythm Generator Fix + 6/8 Rendering
**Rationale:** The 6/8 beat model bug (`SIX_EIGHT.beats = 6`) must be fixed before any compound meter content is authored — it affects timing windows, beat-boundary detection, and beam grouping simultaneously. PITFALLS.md rates this as a one-line constant change with the highest downstream impact of any v2.4 change. Compound beaming fix in `VexFlowStaffDisplay.jsx` is bundled here since both changes are verifiable with a single 6/8 test case.
**Delivers:** `RhythmPatternGenerator.js` with `SIX_EIGHT.beats = 2, unitsPerBeat = 6`; unit test asserting 6/8 produces 12 total sixteenth units felt as 2 compound beats; `Beam.generateBeams` with `groups: [new Fraction(3, 8)]` in `VexFlowStaffDisplay.jsx` for compound time; MetronomeTrainer 6/8 trail config forwarding verified.
**Addresses:** Table stakes for compound meter — visual notation accuracy, timing window correctness.
**Avoids:** Pitfall 3 (6/8 beat model), Pitfall 4 (beam grouping), Pitfall 5 (timing windows in compound time).
**Research flag:** One verification needed before declaring complete — trace whether MetronomeTrainer's trail auto-start block forwards `rhythmConfig.timeSignature` to `generateRhythmEvents()`. FEATURES.md flags this as MEDIUM-risk unknown (same class as the v2.2 `enableFlats` hardcode bug). If a hardcoded `'4/4'` is found, fix is a one-line change.

### Phase 4: Advanced Rhythm Node Data (Compound Meter + Syncopation)
**Rationale:** Dependent on Phase 3 generator fix and MetronomeTrainer wiring confirmation. FEATURES.md identifies `enabledComplexPatterns` trail wiring as the one integration point requiring explicit verification before syncopation nodes are written. PITFALLS.md (Pitfall 7) flags that syncopation tap detection may use beat-boundary windows rather than event-level windows — must be confirmed before authoring.
**Delivers:** `rhythmUnit7Redesigned.js` (~7-8 nodes: 6/8 introduction, dotted-quarter + eighth, mixed 6/8, boss), `rhythmUnit8Redesigned.js` (~7-8 nodes: syncopation in 4/4, eighth-quarter-eighth, mixed patterns, boss), wired into `expandedNodes.js`; MetronomeTrainer syncopation tap windows verified.
**Addresses:** ~15-16 rhythm nodes, 2 boss nodes; compound meter and syncopation as independent teachable concepts.
**Avoids:** Pitfall 7 (syncopation tap detection) — verify MetronomeTrainer uses event-level `startTime` windows before authoring syncopation; Pitfall 8 (subscription gate).
**Research flag:** Verify MetronomeTrainer tap evaluation uses event-level windows for off-beat events before writing syncopation nodes. Manual test with existing `COMPLEX_EXAMPLE_PATTERNS.eighthQuarterEighth` is the fastest check.

### Phase 5: i18n, Polish, and Regression
**Rationale:** i18next translation keys for key names must be present before shipping — the app has Hebrew (RTL) support as a core requirement. Full regression across representative existing nodes confirms `VexFlowStaffDisplay.jsx` and `rhythmGenerator.js` changes did not regress the existing 129 nodes.
**Delivers:** `src/locales/en/common.json` and `src/locales/he/common.json` updated with key signature names; trail node short names using text form ("Key of G") not Unicode symbols; `npm run build` passes; manual regression of 3-5 representative existing nodes per game type.
**Addresses:** i18n completeness for all new node names and descriptions.
**Research flag:** None — established project i18n pattern; additive translation keys only.

### Phase Ordering Rationale

- Phases 1 and 3 are infrastructure prerequisites that gate their respective content phases. Authoring content before the rendering layer is verified causes node data that cannot be tested end-to-end — same lesson as v2.2 Phase 0 pre-flight fixes.
- Phases 2 and 4 are intentionally independent so the rhythm generator fix does not block key signature content authoring. They can run in parallel with distinct owners if needed.
- Key Signatures (Phases 1-2) and Advanced Rhythm (Phases 3-4) share only `VexFlowStaffDisplay.jsx`. Phase 1 adds key signature support; Phase 3 adds compound beaming. Both changes are scoped to distinct code paths and do not conflict.
- Phase 5 is last because i18n translation of node names requires node names to exist first, and regression testing requires all content to be in place.

### Research Flags

Phases requiring targeted verification before authoring (not full research-phase — 1-2 hour traces):
- **Phase 3 (MetronomeTrainer 6/8 wiring):** Trace MetronomeTrainer auto-start block to confirm `rhythmConfig.timeSignature` reaches `generateRhythmEvents()`. If hardcoded `'4/4'` found (same pattern as v2.2 `enableFlats` bug), fix is one line. FEATURES.md rates this MEDIUM risk.
- **Phase 4 (syncopation tap windows):** Confirm MetronomeTrainer tap evaluator uses event-level `startTime` windows (not beat-boundary clamping) for off-beat events. Manual test with existing complex pattern is fastest verification. PITFALLS.md Pitfall 7.
- **Phase 2 (verify:patterns schema):** Check whether `validateTrail.mjs` rejects unknown fields in `noteConfig`. If so, add `keySignature` to allowlist. Build failure on first `npm run build` will surface this immediately.

Phases with standard established patterns (no additional research needed):
- **Phase 1:** VexFlow APIs fully verified against installed package; integration pattern documented in ARCHITECTURE.md with exact working code.
- **Phase 2:** Node data authoring follows v2.2 unit file pattern; Circle of Fifths sequence is established pedagogy with HIGH confidence from multiple sources.
- **Phase 5:** i18n is additive translation keys; established project pattern.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All VexFlow APIs verified by direct inspection of `node_modules/vexflow/build/cjs/vexflow.js` and type definitions. No inference from docs — actual installed code confirmed. |
| Features | HIGH | Table stakes derived from codebase audit + ABRSM/RCM/Faber Piano Adventures consensus (multiple independent pedagogy sources agree on sequencing). Competitor analysis (Simply Piano, Yousician) from MEDIUM-confidence secondary sources confirms positioning. |
| Architecture | HIGH | Based entirely on direct codebase inspection of all files being modified. Data flow diagrams reflect actual code paths traced to function level. One unknown (MetronomeTrainer trail config wiring) is explicitly flagged. |
| Pitfalls | HIGH | Pitfalls 1-5 derived from VexFlow GitHub issues confirmed against current codebase (the anti-patterns exist in the live code). Pitfall 6 from converging piano pedagogy teacher sources. Pitfalls 7-8 from direct code review with specific function names. |

**Overall confidence:** HIGH

### Gaps to Address

- **MetronomeTrainer 6/8 trail config wiring (Phase 3):** Whether `rhythmConfig.timeSignature` reaches `generateRhythmEvents()` via the trail auto-start block is unconfirmed. Trace `MetronomeTrainer.jsx` auto-start section before writing any rhythm node data. If hardcoded `'4/4'` is found, fix is one line — but it must be found before assuming it works.

- **MetronomeTrainer syncopation tap window (Phase 4):** Whether the rhythm game's tap evaluator uses event-level timing windows vs. beat-boundary clamping for off-beat events is unconfirmed. Manual test with an existing `COMPLEX_EXAMPLE_PATTERNS.eighthQuarterEighth` exercise is the fastest check. Pitfall 7 describes the exact failure mode.

- **`verify:patterns` schema validation scope (Phase 2):** Whether `validateTrail.mjs` rejects unknown fields in `noteConfig` is unconfirmed. Low risk — `npm run build` failure will surface this on the first build after adding a node with `keySignature` set.

- **Natural sign rendering in key context (Phase 1):** `Accidental.applyAccidentals()` is documented to handle natural sign insertion automatically. HIGH confidence from API docs and type definitions, but this code path has never been exercised in this codebase. Phase 1 spike must include an explicit test case with an F♮ note in a G major key signature pattern.

---

## Sources

### Primary (HIGH confidence — direct codebase and installed package inspection)
- `node_modules/vexflow/build/cjs/vexflow.js` (installed) — `KeySignature`, `Fraction`, `Tuplet`, `Accidental.applyAccidentals`, `Stave.addKeySignature`, `Beam.getDefaultBeamGroups` all confirmed present
- `node_modules/vexflow/build/types/src/stave.d.ts` — `addKeySignature(keySpec, cancelKeySpec?, position?)` signature verified
- `node_modules/vexflow/build/types/src/accidental.d.ts` — `Accidental.applyAccidentals(voices, keySignature)` signature verified
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` — existing rendering architecture, Dot/Beam/StaveTie imports, manual Accidental modifier pattern confirmed
- `src/components/games/sight-reading-game/constants/durationConstants.js` — `SIX_EIGHT` with `isCompound: true`, `buildTimeSignatureGrid()` behavior confirmed
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — `SIX_EIGHT.beats = 6` latent bug confirmed
- `src/components/games/sight-reading-game/utils/rhythmPatterns.js` — `COMPLEX_EXAMPLE_PATTERNS` with `eighthQuarterEighth` confirmed
- `src/data/units/rhythmUnit6Redesigned.js` — Pattern for new unit file structure confirmed
- `src/config/subscriptionConfig.js` — Default-deny gate pattern confirmed; no migration needed for premium-only new nodes
- Piano pedagogy consensus (Faber Piano Adventures, Alfred's Basic Piano Library, RCM): accidentals before key signatures, G before D, F before Bb — confirmed from multiple independent sources

### Secondary (MEDIUM confidence)
- VexFlow GitHub issue #340 — Key signature width and `noteStartX` positioning
- VexFlow GitHub issue #164 — Auto-beaming not time-signature aware
- VexFlow GitHub issue #108 — Beaming of eighth notes in 6/8
- [Major Key Signatures — Puget Sound](https://musictheory.pugetsound.edu/mt21c/MajorKeySignatures.html) — circle of fifths order (academic music theory)
- [Teach Piano Today — key signatures for young students](https://www.teachpianotoday.com/2015/12/09/what-to-do-if-key-signatures-are-scary-for-your-piano-students/) — scaffolding approach for children
- [Magic of Music Ed — How to teach key signatures (2025)](https://magicofmusiced.com/2025/03/02/how-to-teach-key-signatures/) — discovery-first approach
- [Open Music Theory — Compound meters](https://viva.pressbooks.pub/openmusictheory/chapter/compound-meters-and-time-signatures/) — 6/8 felt beat pedagogy
- [Simply Piano curriculum review](https://pianoens.com/simply-piano-review-the-honest-truth-about-learning-piano-with-an-app/) — Pre-Advanced I introduces D major, F major
- [Yousician piano review](https://www.pianodreamers.com/yousician-piano-review/) — key signatures taught in song context

### Tertiary (LOW confidence)
- [Yellow Brick Road blog — Teaching Syncopation](https://yellowbrickroadblog.com/teaching-syncopation-part-one/) — verbal encoding before notation for children
- [Cooper Piano — 5 Syncopation Exercises](https://cooperpiano.com/5-syncopation-exercises-for-piano-beginners/) — beginner syncopation approach

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
