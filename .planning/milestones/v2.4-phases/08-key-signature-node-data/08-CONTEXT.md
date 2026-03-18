# Phase 08: Key Signature Node Data - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Players can practice reading music in all 6 key signatures (G, D, A major; F, Bb, Eb major) on both treble and bass clef trails. Adds ~28 new trail nodes across 4 new unit files (trebleUnit6, trebleUnit7, bassUnit6, bassUnit7). Discovery nodes introduce each key, practice nodes drill reading in that key, and a boss challenge tests all 6 keys.

Game-layer changes, rhythm nodes, and integration/i18n are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Node structure per key
- 2 nodes per key: 1 Discovery + 1 Practice
- Unit 6: G major + D major = 4 nodes (no extras)
- Unit 7: A major + F major + Bb major + Eb major + 1 Memory Mix-Up + 1 Boss = 10 nodes
- Total per clef path: 14 nodes (~28 total across treble + bass)

### Exercise types
- Primary: Sight reading (key sigs are a staff-level visual concept)
- Memory game included as Mix-Up variety node in Unit 7 (before boss)
- Note Recognition explicitly excluded per requirements (key sig = staff concept, not individual note ID)

### Discovery nodes
- One per key (6 per clef path): "Meet G Major", "Meet D Major", "Meet A Major", "Meet F Major", "Meet Bb Major", "Meet Eb Major"
- Exercise: short sight reading — 8 patterns, 1 measure each, quarter notes only, full in-key octave
- `newContent: NEW_CONTENT_TYPES.NOTE` with `newContentDescription: 'Key of G Major (1♯)'` etc. (Unicode symbols)
- `nodeType: NODE_TYPES.DISCOVERY`

### Practice nodes
- One per key (6 per clef path): "G Major Practice", "D Major Practice", etc.
- Exercise: sight reading — 10 patterns, 1-2 measures, quarters + halves (MEDIUM rhythm)
- `nodeType: NODE_TYPES.PRACTICE`

### Note pools
- Full in-key octave for all nodes — treble: C4-C5 filtered to key, bass: C3-C4 filtered to key
- `filterNotesToKey()` from Phase 07 handles filtering automatically
- Each exercise config includes `keySignature: 'G'` (etc.) field

### Difficulty progression
- Rhythm: SIMPLE for Discovery, MEDIUM for Practice, VARIED for Boss
- Tempo: 60-70 bpm Discovery, 65-80 bpm Practice
- Same parameters per role regardless of key — the key signature itself IS the difficulty increase (more accidentals = harder to read)
- No double-stacking tempo/rhythm increases on top of harder keys

### Boss challenge
- Multi-exercise boss with 3 exercises: (1) sharp keys mixed (G+D+A), (2) flat keys mixed (F+Bb+Eb), (3) all 6 keys mixed
- 2 measures per pattern (matches existing boss conventions)
- 150 XP reward (matches boss_treble_5 / boss_bass_5)
- Bass boss mirrors treble boss structure exactly with C3-C4 range

### Unit metadata
- Treble Unit 6: "Key Signatures: Sharps" — G major, D major
- Treble Unit 7: "Key Signatures: Mixed" — A major, F major, Bb major, Eb major + memory + boss
- Bass Unit 6/7 mirror treble naming with bass clef range
- All nodes are premium-only (no additions to FREE_NODE_IDS)

### Bass clef mirroring
- Bass units mirror treble units exactly in structure, naming, node types, difficulty params
- Only difference: clef = 'bass', note pools use C3-C4 range instead of C4-C5
- Boss prerequisite chain mirrors treble

### Claude's Discretion
- Exact `order` and `START_ORDER` values for new units (must follow existing numbering)
- Prerequisite chain details (which boss unlocks Unit 6)
- Memory game note pool composition and grid size
- How the "mixed keys" boss exercises handle per-exercise key signature assignment
- Whether memory game needs key signature glyph support on cards (may be out of scope)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Key signature infrastructure (Phase 07)
- `src/components/games/sight-reading-game/constants/keySignatureConfig.js` — KEY_NOTE_LETTERS map and KEY_SIGNATURE_OPTIONS for all 7 keys
- `src/components/games/sight-reading-game/utils/keySignatureUtils.js` — `filterNotesToKey()` and `mapNoteToKey()` used by patternBuilder
- `src/components/games/sight-reading-game/utils/patternBuilder.js` — Pattern generation with `keySignature` parameter support
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` — Key signature glyph rendering and accidental suppression

### Trail node patterns (existing units)
- `src/data/units/trebleUnit5Redesigned.js` — Latest treble unit (flats); use as template for node structure, field names, comment style
- `src/data/units/bassUnit5Redesigned.js` — Latest bass unit (flats); use as bass clef template
- `src/data/nodeTypes.js` — NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES enums
- `src/data/constants.js` — NODE_CATEGORIES, EXERCISE_TYPES enums
- `src/data/expandedNodes.js` — Import aggregation (Phase 11 wires new units here)

### Trail pipeline
- `src/components/trail/TrailNodeModal.jsx` — `navigateToExercise()` passes `keySignature` in nav state
- `src/components/games/sight-reading-game/SightReadingGame.jsx` — Reads `keySignature` from trail settings

### Validation
- `scripts/validateTrail.mjs` — Build-time validation (checks prerequisites, node types, IDs, XP economy). Does NOT validate noteConfig/keySignature fields.

### Requirements
- `.planning/REQUIREMENTS.md` — TREB-01 through TREB-07, BASS-01 through BASS-07

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `filterNotesToKey()` in keySignatureUtils.js: Filters any note array to in-key pitches — use for constructing note pools
- `KEY_NOTE_LETTERS` map: Defines in-key notes for all 6 supported keys — source of truth for note pools
- `NODE_TYPES`, `RHYTHM_COMPLEXITY`, `NEW_CONTENT_TYPES`: Existing enums used in all unit files
- Treble Unit 5 / Bass Unit 5: Direct templates for file structure, comment style, field ordering

### Established Patterns
- Unit files export a named array (e.g., `trebleUnit5Nodes`) and a default export
- Each file has a header comment explaining the unit's purpose, constraints, duration, and prerequisite
- `START_ORDER` calculated from previous unit's last order + 1
- Boss nodes use `category: 'boss'` (not the path category) with `isBoss: true`
- Discovery nodes use `focusNotes` array to highlight new content
- `exercises` array contains exercise config objects with `type` and `config` fields

### Integration Points
- `expandedNodes.js`: Phase 11 will add `import trebleUnit6Nodes` etc. and spread into arrays
- `skillTrail.js` UNITS metadata: Phase 11 will add TREBLE_6, TREBLE_7, BASS_6, BASS_7 entries
- `subscriptionConfig.js` FREE_NODE_IDS: No additions needed (default-deny for new nodes)
- `validateTrail.mjs`: Will automatically validate new nodes on build (prerequisite chains, node types, IDs, XP)

</code_context>

<specifics>
## Specific Ideas

- Key ordering follows circle of fifths: G(1#) → D(2#) → A(3#) for sharps, F(1b) → Bb(2b) → Eb(3b) for flats
- Unit 6 covers the "easy" keys (1-2 accidentals: G, D); Unit 7 covers the "harder" keys (3 accidentals: A + all flats: F, Bb, Eb)
- Memory game in Unit 7 acts as a fun variety break before the boss challenge
- Discovery nodes use 'Meet [Key] Major' naming consistent with 'Meet B Flat' etc. from accidental units
- `newContentDescription` uses Unicode symbols: 'Key of G Major (1♯)', 'Key of F Major (1♭)', etc.

</specifics>

<deferred>
## Deferred Ideas

- **Key signature in Note Recognition game** — Explicitly out of scope per requirements (key sig is staff-level concept)
- **Minor key signatures** — Explicitly out of scope; major keys sufficient for beginner level
- **Memory game key signature glyph on cards** — May need investigation; if not feasible, memory node uses note pools without key sig display
- **Out-of-key naturals in exercises** — Natural signs when deviating from key; can be added in future phases

</deferred>

---

*Phase: 08-key-signature-node-data*
*Context gathered: 2026-03-18*
