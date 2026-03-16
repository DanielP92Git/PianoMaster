# Phase 04: Integration, Gate, and i18n - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire all new accidental content nodes (treble Units 4-5, bass Units 4-5, boss nodes) into the trail via expandedNodes.js, verify subscription gating at both React UI and database RLS layers, fix mic enharmonic matching so sight reading scores flats correctly, and add all accidental note name translations in English and Hebrew.

</domain>

<decisions>
## Implementation Decisions

### Hebrew accidental naming
- Trail UI (node names, skill bubbles, VictoryScreen): use full Hebrew music terms - דיאז (diez) for sharp, במול (bemol) for flat
- Examples: F# → פה דיאז, Bb → סי במול, C# → דו דיאז, Eb → מי במול, Ab → לה במול, Db → רה במול, G# → סול דיאז
- Game answer buttons: keep existing compact style with Unicode symbols (פה♯, סי♭) — no change to noteDefinitions.js
- VictoryScreen follows trail convention (פה דיאז / סי במול)

### English accidental display
- Trail UI (node names, skill bubbles, VictoryScreen): use Unicode music symbols — F♯, B♭ (not keyboard chars F#, Bb)
- This applies to trail.json noteNames, translateNodeName output, and any trail-facing display

### Enharmonic matching
- Fix ALL enharmonic pairs globally (C#=Db, D#=Eb, F#=Gb, G#=Ab, A#=Bb) — not just current flats in scope
- Fix applies to the pitch comparison in SightReadingGame.jsx where `detectedNote === matchingEvent.pitch`
- Regular flats nodes stay NOTE_RECOGNITION-only for now — no exercise changes
- Boss SIGHT_READING exercises with flats become active once nodes are wired in (this is intended behavior)

### Subscription gate
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

</decisions>

<specifics>
## Specific Ideas

- Hebrew accidental terms are from French solfège tradition used in Israeli music education: דיאז = dièse, במול = bémol
- Game buttons already established the פה♯/סי♭ pattern in noteDefinitions.js — this stays for compactness on small buttons
- The existing aria-label in NotesRecognitionGame.jsx already uses "דיאז" and "במול" (line 1511) — trail naming is consistent with this

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `expandedNodes.js`: Aggregator that imports and spreads unit files — needs 4 new imports (trebleUnit4, trebleUnit5, bassUnit4, bassUnit5)
- `subscriptionConfig.js`: FREE_NODE_IDS Set — no changes needed (default-deny)
- `noteDefinitions.js`: withAccidentals() generates Hebrew accidental labels with ♯/♭ symbols — game buttons pattern
- `translateNodeName.js`: Translates note letters in node names — needs extension for accidental patterns
- `TrailNodeModal.jsx:315`: Skill bubble regex already handles `[b#]?` — but noteNames lookup needs accidental keys

### Established Patterns
- `noteNames` in trail.json has only C-B (7 natural notes) — needs F#, C#, G#, Bb, Eb, Ab, Db entries
- SightReadingGame pitch comparison: `detectedNote === matchingEvent.pitch` at line 1682 — strict string equality, no enharmonic awareness
- Postgres is_free_node(): hardcoded 19-ID array + NULL passthrough — default-deny for any unlisted node ID
- `formatNoteLabel` in NotesRecognitionGame: Hebrew returns `noteObj.note` (from noteDefinitions), English strips digits and uppercases pitch

### Integration Points
- New unit files in `src/data/units/`: trebleUnit4Redesigned.js, trebleUnit5Redesigned.js, bassUnit4Redesigned.js, bassUnit5Redesigned.js (already authored in Phases 02-03)
- `src/locales/en/trail.json` and `src/locales/he/trail.json`: noteNames section needs accidental entries
- SightReadingGame.jsx handleNoteDetected callback: pitch comparison point for enharmonic fix
- `npm run verify:patterns`: build validation for expandedNodes integration

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-integration-gate-and-i18n*
*Context gathered: 2026-03-16*
