---
gsd_state_version: 1.0
milestone: v2.2
milestone_name: Sharps & Flats
status: completed
stopped_at: Completed 04-03-PLAN.md (Phase 04 Plan 03 — TrailNodeModal gap closure)
last_updated: "2026-03-16T19:29:39.381Z"
last_activity: 2026-03-16 — Phase 04 Plan 03 complete
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-15)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** v2.2 Sharps & Flats — Phase 04: Integration, Gate, and i18n — COMPLETE

## Current Position

Phase: 04 of 04 (Integration, Gate, and i18n)
Plan: 03 of 03 (COMPLETE — all Phase 04 plans done)
Status: Phase 04 Plan 03 complete — TrailNodeModal gap closure: focusNotes-aware bubbles, Hebrew text scaling, Unicode description fallback
Last activity: 2026-03-16 — Phase 04 Plan 03 complete

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: ~118 (across all milestones)
- 12 milestones shipped in 38 days (2026-01-31 to 2026-03-10)
- ~73,754 lines JavaScript/JSX/CSS

## Accumulated Context

### Decisions

All prior decisions archived in PROJECT.md Key Decisions table.

**v2.2 key constraints:**
- Phase 01 is non-negotiable first: both bugs produce silent failures that make all subsequent testing misleading
- Sharps and flats in separate units (not mixed) to avoid enharmonic confusion — mic outputs sharp-form only
- Bass `START_ORDER` must be read from `bassUnit3Redesigned.js` before authoring Phase 03

**Phase 01 decisions (2026-03-15):**
- Flag derivation from notePool in TrailNodeModal (not inside games) keeps curriculum authority in one place
- trailEnableSharps/trailEnableFlats default to false via ?? so free-play mode is unaffected
- filterAutoGrowCandidates exported from module scope for pure-function testability
- Auto-grow skips entire accidentals nodes for natural sessions rather than picking arbitrary note
- inferClefForPitch exported from patternBuilder.js to fix accidental pitch handling in sight reading
- ESM bare-Node imports require .js extensions — rhythmGenerator.js and durationConstants.js both fixed
- AudioContextProvider mock in JSX tests must include requestMic returning {analyser, audioContext} object
- react-i18next mock maps i18n keys to English for testing-library role queries

**Phase 02 decisions (2026-03-15):**
- SIGHT_READING excluded from flats regular practice nodes (INTG-03): mic outputs A#4/D#4 not Bb4/Eb4
- Boss nodes in Unit 5 may include SIGHT_READING because they are inert until Phase 04 wires them into expandedNodes.js
- boss_treble_accidentals is the only node in flats file with sharps in notePool (cross-unit challenge)
- Unit 4 and 5 boss nodes use category: 'boss' string literal (not CATEGORY constant)

**Phase 03 decisions (2026-03-15):**
- SIGHT_READING safe for bass sharps (F#3/C#3/G#3) — used in bass_4_4, bass_4_5, and boss_bass_4
- SIGHT_READING excluded from regular bass flats nodes (bass_5_1 through bass_5_8) — mic outputs A#3/D#3/G#3/C#3 not Bb3/Eb3/Ab3/Db3
- Boss nodes in bassUnit5 (boss_bass_5, boss_bass_accidentals) include SIGHT_READING as inert placeholder
- boss_bass_accidentals placed in bassUnit5Redesigned.js with unitName:'Accidentals Master' override
- FULL_SHARP_POOL and FULL_FLAT_POOL as module-scope constants (C3-C4 octave + accidentals) for consistency
- Treble Unit 4 expanded from 7 to 8 nodes: G#4 Discovery added, START_ORDER stays 27, ends at 34
- Treble Unit 5 expanded from 8 to 10 nodes: Ab4/Db4 Discovery nodes added, START_ORDER 34→35 (after Unit 4 expansion)
- boss_treble_accidentals pool expanded from 12 to 15 notes: G#4, Ab4, Db4 added to cover all 7 treble accidentals

**Phase 04 Plan 01 decisions (2026-03-16):**
- MIDI comparison (noteToMidi) used at both anti-cheat and scoring sites in SightReadingGame.jsx — both must be fixed atomically or false cheat detection remains
- Subscription gate confirmed default-deny: no new accidental node IDs added to FREE_NODE_IDS; all 36 new nodes are premium-only
- SEMITONE_MAP/noteToMidi duplicated in test file (not exported from game) — tests the pure logic independently
- TDD RED phase passed immediately: noteToMidi was already correct; the bug was at usage sites (string equality not MIDI comparison)

**Phase 04 Plan 02 decisions (2026-03-16):**
- Flat noteNames keys must be uppercase (BB/EB/AB/DB) — TrailNodeModal calls .toUpperCase() on regex capture before t() lookup
- English accidental display uses Unicode ♯/♭ symbols (not keyboard chars # and b)
- Hebrew accidental display uses French solfege terms: דיאז (sharp) and במול (flat)

**Phase 04 Plan 03 decisions (2026-03-16):**
- focusNotes-first logic placed inline in the .map() ternary — keeps data source visible next to usage
- textSizeClass threshold >4 chars covers all Hebrew two-word accidental names (min 6 chars) without affecting single-letter labels
- sanitizeAccidentals negative lookahead (?![a-z]) prevents converting compound words like "Bubble" — only note-name patterns match
- sanitizeAccidentals defined inside component (not module scope) since used in only one JSX expression

### Research Flags (act on during implementation)

- **Phase 04**: Verify `calculatePitchAccuracy()` in `scoreCalculator.js` handles enharmonic equivalence before adding SIGHT_READING exercises — if strict string comparison found, fix is localized to that function
- **Phase 03**: Read `bassUnit3Redesigned.js` last order value before setting `bassUnit4Redesigned.js` START_ORDER (RESOLVED — confirmed order 75 is last bass_3 node, START_ORDER=76 correct)

### Blockers/Concerns

**Outstanding items (non-blocking, pre-existing):**
- Pre-existing lint: 24 errors, 415 warnings (all pre-v1.4)
- syncPracticeSessions() stub in sw.js (zero runtime impact)
- DB migration 20260308000001_drop_points_columns.sql created but needs manual application

## Session Continuity

Last session: 2026-03-16T21:30:00Z
Stopped at: Completed 04-03-PLAN.md (Phase 04 Plan 03 — TrailNodeModal gap closure)
Resume file: .planning/milestones/v2.2-phases/04-integration-gate-and-i18n/04-03-SUMMARY.md

**Next action:**
- v2.2 milestone (Sharps & Flats) is COMPLETE. All 4 phases + gap closure plan done. Run `/gsd:progress` to review final milestone status. Recommend full UAT re-run to verify all 7 UAT tests pass.

---
*State initialized: 2026-01-31*
*Last updated: 2026-03-16 — Phase 04 Plan 03 complete (TrailNodeModal gap closure — UAT tests 3 and 4 resolved)*
