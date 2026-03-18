# Phase 07: Key Signature Rendering Infrastructure - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

VexFlow renders key signature glyphs and suppresses redundant accidentals so key-signature-mode sight reading is visually correct. Adds a key selection dropdown to free-play settings and passes `keySignature` config through the trail node pipeline. Existing non-key-signature exercises render identically to before.

Game-layer scoring changes, discovery nodes, key signature node data, and Note Recognition game changes are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Free-play key selection UI
- New "Key" dropdown in UnifiedGameSettings alongside clef, time signature, and tempo
- Default to C major (no key signature)
- Available keys: C major (none), G major (1#), D major (2#), A major (3#), F major (1b), Bb major (2b), Eb major (3b) — matches curriculum
- Always visible in sight reading free-play settings (no unlock gating)
- When a key is selected, auto-filter note pool to in-key notes; player can still manually adjust after

### Accidental display rules
- Standard music notation conventions: suppress accidentals covered by key signature, show natural signs when deviating from key
- Courtesy (reminder) accidentals: yes — if a natural was used earlier in the measure, show the key-sig accidental as a reminder on subsequent occurrences
- Generated patterns use only in-key notes for Phase 07 infrastructure; out-of-key notes (naturals) deferred to Phase 08 node data
- VexFlow's `Accidental.applyAccidentals()` handles the logic

### Config pipeline behavior
- New `keySignature` field in trail node exercise config (e.g., `keySignature: 'G'`)
- Uses VexFlow key string format directly: 'G', 'D', 'A', 'F', 'Bb', 'Eb' — no translation layer
- When `keySignature` is set, it takes precedence over `enableSharps`/`enableFlats` flags
- When `keySignature` is null/absent, existing per-note accidental behavior unchanged (zero behavior change for v2.2 nodes)
- Pipeline: trail node config → TrailNodeModal → navigation state → SightReadingGame → patternBuilder → VexFlowStaffDisplay

### Notation visual appearance
- Standard VexFlow rendering for key signature glyphs — no custom styling, no enlarged glyphs
- Stave width auto-adjusts to accommodate key signature glyphs (VexFlow handles spacing naturally)
- Key signature appears on first bar only in multi-bar patterns (standard music convention)

### Claude's Discretion
- Exact stave width adjustment calculation
- How `Accidental.applyAccidentals()` is integrated with existing `buildStaveNote()` function
- Internal note pool filtering implementation for key-based auto-selection
- How the key dropdown interacts with the existing settings state management

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### VexFlow notation
- `docs/vexflow-notation/vexflow-guidelines.md` — VexFlow patterns, accidental handling, beam generation rules
- `docs/vexflow-notation/vexflow-tutorial.md` — VexFlow API usage reference
- `docs/vexflow-notation/vexflow-examples.md` — VexFlow code examples

### Requirements
- `.planning/REQUIREMENTS.md` — RENDER-01, RENDER-02, RENDER-03 requirements for this phase

### Design system
- `docs/DESIGN_SYSTEM.md` — Glassmorphism patterns for any new UI elements (key dropdown)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VexFlowStaffDisplay.jsx:566-591` — Stave creation with `addClef()` and `addTimeSignature()` on first bar; `addKeySignature()` slots between them
- `VexFlowStaffDisplay.jsx:446-497` — `parsePitchForVexflow()` and `buildStaveNote()` handle individual accidentals; key sig mode replaces per-note accidentals with `Accidental.applyAccidentals()`
- `VexFlowStaffDisplay.jsx:22` — `Accidental` already imported from vexflow
- `UnifiedGameSettings` component — Existing settings UI; key dropdown follows same pattern as clef/time signature dropdowns
- `TrailNodeModal.jsx:159-184` — `navigateToExercise()` builds nav state; add `keySignature` field passthrough

### Established Patterns
- Config pipeline: node def → TrailNodeModal → nav state → SightReadingGame → patternBuilder → VexFlowStaffDisplay
- Accidental flags derived from notePool in TrailNodeModal (anchored regex `^[A-G]b\d` for flats)
- `DEFAULT_SETTINGS` in SightReadingGame for free-play defaults
- `patternBuilder.js:47-74` — `toVexFlowNote()` converts pitch strings to VexFlow format with accidental parsing

### Integration Points
- `SightReadingGame.jsx:286-317` — Auto-configure from trail node; add `keySignature` to `trailSettings`
- `patternBuilder.js:92` — `generatePatternData()` accepts config; needs `keySignature` parameter for note pool filtering
- `VexFlowStaffDisplay.jsx` — Stave creation loop needs conditional `addKeySignature()` call
- `src/data/units/` — Future Phase 08 will add `keySignature` field to new node definitions

</code_context>

<specifics>
## Specific Ideas

- Key selection should feel like choosing a clef or time signature — same UI pattern, same settings section
- "C major" in the dropdown means "no key signature" — the default, matching current behavior
- Auto-filtering note pool when key is selected is the primary convenience — prevents kids from accidentally generating out-of-key notes in free play

</specifics>

<deferred>
## Deferred Ideas

- **Discovery nodes** — Phase 08 will add discovery nodes that teach the key signature concept before exercises
- **Out-of-key notes / natural signs in exercises** — Phase 08 node data will decide when naturals appear pedagogically
- **Key signature in Note Recognition game** — Explicitly out of scope per REQUIREMENTS
- **Minor key signatures** — Explicitly out of scope per REQUIREMENTS; major keys sufficient for beginner level

</deferred>

---

*Phase: 07-key-signature-rendering-infrastructure*
*Context gathered: 2026-03-18*
