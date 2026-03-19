# Phase 11: Integration, Gate, and i18n - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire all new key signature nodes (trebleUnit6, trebleUnit7, bassUnit6, bassUnit7) and advanced rhythm nodes (rhythmUnit7, rhythmUnit8) into the trail via expandedNodes.js, verify subscription gating via default-deny, backfill missing UNITS metadata (RHYTHM_5/6), add new UNITS entries (TREBLE_6/7, BASS_6/7, RHYTHM_7/8), and add full EN/HE translations for all new node names, unit names, skill names, and accessory names.

</domain>

<decisions>
## Implementation Decisions

### Hebrew key signature terminology
- "Major" translated as מז'ור (Mazhor) — standard Israeli music education term from French solfège tradition
- Key names use Hebrew solfège: סול מז'ור (G Major), רה מז'ור (D Major), לה מז'ור (A Major), פה מז'ור (F Major), סי♭ מז'ור (Bb Major), מי♭ מז'ור (Eb Major)
- Discovery node names: הכירו את סול מז'ור (Meet G Major), etc.
- Practice node names: תרגול סול מז'ור (G Major Practice), etc.

### Hebrew rhythm terminology
- Use formal music terms, not kid-friendly simplifications
- Compound meter: משקל מורכב (mishkal murkav)
- Syncopation: סינקופה (synkopa)
- Node names translated with formal terminology basis

### Subscription gate
- Default-deny: no changes to FREE_NODE_IDS or subscriptionConfig.js — all new nodes are automatically premium
- No Postgres migration needed — existing is_free_node() excludes new IDs by design
- Verification: manual test instruction in plan (attempt to play new node without subscription)

### Unit metadata (UNITS object in skillTrail.js)
- Backfill missing RHYTHM_5 and RHYTHM_6 entries
- Add TREBLE_6, TREBLE_7, BASS_6, BASS_7, RHYTHM_7, RHYTHM_8
- Drop icon field from all new entries (not rendered by UnitProgressCard)
- Key signature unit names: TREBLE_6 = 'Key Signatures: Sharps', TREBLE_7 = 'Key Signatures: Mixed', BASS_6/7 mirror treble
- Rhythm unit names: RHYTHM_5 = 'Dotted Notes', RHYTHM_6 = 'Rhythm Combos', RHYTHM_7 = 'Six-Eight Time', RHYTHM_8 = 'Off-Beat Magic'

### Translation scope
- Node names (~42): full EN/HE entries in trail.json nodes section
- Unit names (8): EN/HE entries in trail.json units.names section
- Skill names (~8 new): 68_compound_meter, syncopation_eighth_quarter, syncopation_dotted_quarter, quarter_note_68, eighth_note_68 in trail.json skillNames
- Accessory/badge names (8): EN/HE in trail.json accessories section
- newContentDescription: SKIP — field is not rendered by any React component (unused metadata)

### Claude's Discretion
- Whether key sig nodes need a dedicated keyNames i18n section or if existing noteNames + node names are sufficient for TrailNodeModal display
- Exact Hebrew translations for rhythm node names (Two Big Beats, Off-Beat Surprise, Compound Cocktail, etc.)
- Exact reward badge IDs and display names for new units
- RHYTHM_5/6 backfill: descriptions, themes, reward badge names (derive from existing unit file headers)
- Order of imports in expandedNodes.js (treble → bass → rhythm, matching existing pattern)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Integration pattern (v2.2 precedent)
- `.planning/milestones/v2.2-phases/04-integration-gate-and-i18n/04-CONTEXT.md` — Previous integration phase; same pattern for accidentals. Use as implementation template.

### Node data files (to be wired)
- `src/data/units/trebleUnit6Redesigned.js` — Key Signatures: Sharps (G, D major)
- `src/data/units/trebleUnit7Redesigned.js` — Key Signatures: Mixed (A, F, Bb, Eb + memory + boss)
- `src/data/units/bassUnit6Redesigned.js` — Bass Key Sigs: Sharps
- `src/data/units/bassUnit7Redesigned.js` — Bass Key Sigs: Mixed
- `src/data/units/rhythmUnit7Redesigned.js` — Six-Eight Time (6/8 compound meter)
- `src/data/units/rhythmUnit8Redesigned.js` — Off-Beat Magic (syncopation)

### Trail infrastructure
- `src/data/expandedNodes.js` — Import aggregation; add 6 new unit imports + spreads
- `src/data/skillTrail.js` — UNITS metadata object; add 8 entries (6 new + 2 backfill)
- `src/config/subscriptionConfig.js` — FREE_NODE_IDS; NO changes needed (default-deny)
- `scripts/validateTrail.mjs` — Build-time validation; will auto-validate new nodes

### i18n files
- `src/locales/en/trail.json` — English translations: nodes, units.names, skillNames, accessories
- `src/locales/he/trail.json` — Hebrew translations: same sections with solfège key names and formal music terms

### Requirements
- `.planning/REQUIREMENTS.md` — INTG-01, INTG-02, INTG-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `expandedNodes.js`: Well-established import + spread pattern. Currently has treble 1-5, bass 1-5, rhythm 1-6. Needs 6 more imports.
- `skillTrail.js` UNITS object: Currently TREBLE_1-5, BASS_1-5, RHYTHM_1-4. Missing RHYTHM_5/6 (backfill needed).
- `translateNodeName.js` / `translateUnitName.js`: Existing translation utilities for trail display
- `trail.json` (en/he): Established sections for nodes, units.names, noteNames, skillNames, accessories

### Established Patterns
- v2.2 Phase 04 did the identical integration for accidentals — same expandedNodes wiring, same i18n sections, same gate verification
- Unit files export named arrays (e.g., `trebleUnit6Nodes`) and default export
- EXPANDED_NODES combines all units; category-specific exports (EXPANDED_TREBLE_NODES etc.) need updating too
- Hebrew uses solfège note names (דו, רה, מי, פה, סול, לה, סי) with דיאז/במול for accidentals
- UnitProgressCard renders unit number badge + name — icon field is not used

### Integration Points
- `expandedNodes.js`: 6 new imports, 6 new spreads in EXPANDED_NODES + category exports
- `skillTrail.js`: 8 UNITS entries (TREBLE_6/7, BASS_6/7, RHYTHM_5/6/7/8)
- `trail.json` (en): ~42 node names, 8 unit names, ~8 skill names, 8 accessory names
- `trail.json` (he): Same counts with Hebrew solfège + formal music terms
- `npm run build` / `npm run verify:patterns`: Must pass after wiring

</code_context>

<specifics>
## Specific Ideas

- Hebrew key names follow Israeli music education convention: סול מז'ור, not G מז'ור (solfège, not letter names)
- מז'ור borrowed from French "majeur" — same tradition as דיאז/במול from v2.2
- Discovery nodes: הכירו את (get to know / meet) — friendly imperative plural
- Formal rhythm terms chosen over kid-friendly alternatives: משקל מורכב (compound meter), סינקופה (syncopation)
- RHYTHM_7 renamed from 'Big Beats' to 'Six-Eight Time' for clarity
- icon field dropped from new UNITS entries since UnitProgressCard doesn't render it

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-integration-gate-and-i18n*
*Context gathered: 2026-03-19*
