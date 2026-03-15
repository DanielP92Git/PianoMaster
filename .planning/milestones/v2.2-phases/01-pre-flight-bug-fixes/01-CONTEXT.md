# Phase 01: Pre-Flight Bug Fixes - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix two code bugs (FIX-01, FIX-02) that silently corrupt accidentals so all subsequent content phases can be tested accurately. No new features, no content authoring — pure bug fixes with a codebase-wide regex sweep.

</domain>

<decisions>
## Implementation Decisions

### Auto-grow boundary behavior
- Auto-grow STOPS when current node has NO accidentals but the next node DOES — no accidentals injected into natural-notes sessions
- Per-note filtering: if a mixed node has [C4, D4, F#4], a natural-only session gets C4 and D4 but skips F#4
- Accidental nodes CAN grow freely into further accidental nodes (sharps node can pull from flats node)
- Accidental nodes CAN also grow into natural-only nodes (naturals are already learned, adds variety)
- Rule summary: the ONLY blocked direction is natural → accidental

### Flag derivation
- Derive enableSharps/enableFlats by scanning the node's notePool at navigation time
- Scanning logic lives in TrailNodeModal.jsx (in `navigateToExercise()`) — not a separate utility
- `notePool.some(n => n.includes('#'))` for sharps, `notePool.some(n => n.includes('b'))` for flats
- Trail sessions override user game settings — trail flags come from notePool, free play uses user settings
- Both NotesRecognitionGame AND SightReadingGame receive and use these flags from trail state

### Accidental format scope
- Regex pattern: `/^([A-G][#b]?)(\d+)$/` — supports single sharp (#) and single flat (b) only
- No double-sharp, double-flat, or explicit natural support needed (YAGNI)
- Sweep entire codebase for the broken `/^([A-G])(\d+)$/` pattern and fix all instances, not just patternBuilder.js
- VexFlow conversion: F#4 → `f#/4` + `new Accidental('#')`, Bb4 → `bb/4` + `new Accidental('b')` — standard VexFlow v5 approach

### Claude's Discretion
- Exact implementation of the per-note accidental filter in auto-grow logic
- How to detect "is this note an accidental" in the auto-grow code (regex vs string check)
- Test file organization and test case selection
- Any additional regex instances found during the codebase sweep

</decisions>

<specifics>
## Specific Ideas

No specific requirements — the bugs and success criteria are precisely defined in the roadmap. Implementation follows standard patterns.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TrailNodeModal.jsx` (line ~158): `navigateToExercise()` — where enableSharps/enableFlats flags should be derived and passed
- `patternBuilder.js` (lines 29, 60): Two regexes that need the `[#b]?` fix
- `NotesRecognitionGame.jsx` (lines 413-419): Settings initialization where trail flags should override defaults
- `NotesRecognitionGame.jsx` (lines 872-901): `getNextPedagogicalNote()` — auto-grow logic needing the accidental boundary guard
- `skillTrail.js` (lines 277-284): `getNextNodeInCategory()` — used by auto-grow to walk forward through nodes

### Established Patterns
- Trail → game navigation passes config via `location.state` (nodeId, nodeConfig, exerciseIndex, etc.)
- Game settings use `enableSharps: false, enableFlats: false` as defaults
- VexFlow key strings use `"pitch/octave"` format (e.g., `'c/4'`, `'eb/4'`)
- Auto-grow triggers at combo intervals (`GROW_INTERVAL = 5`) and calls `getNextPedagogicalNote()`

### Integration Points
- `TrailNodeModal.jsx` → game routes via React Router navigate with state
- `patternBuilder.js` → used by SightReadingGame for note generation and VexFlow rendering
- Auto-grow in NotesRecognitionGame reads from skillTrail node definitions

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-pre-flight-bug-fixes*
*Context gathered: 2026-03-15*
