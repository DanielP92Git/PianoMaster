---
phase: 04-integration-gate-and-i18n
plan: 02
subsystem: ui
tags: [i18n, i18next, react, trail, hebrew, translations]

# Dependency graph
requires: []
provides:
  - "English translations for 7 accidental noteNames using Unicode ♯/♭ symbols in en/trail.json"
  - "Hebrew translations for 7 accidental noteNames using דיאז/במול terms in he/trail.json"
  - "21 new node name entries in both en/trail.json and he/trail.json"
  - "21 new description entries in both en/trail.json and he/trail.json"
  - "4 boss unlockHint entries in both en/trail.json and he/trail.json"
affects: [TrailNodeModal, translateNodeName.js]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Flat noteNames keys use uppercase format (BB/EB/AB/DB) to match JavaScript .toUpperCase() behavior in TrailNodeModal"
    - "English accidentals use Unicode music symbols ♯ and ♭ (not keyboard chars # and b)"
    - "Hebrew accidentals use French solfege music terms: דיאז (diez) for sharp, במול (bemol) for flat"

key-files:
  created: []
  modified:
    - src/locales/en/trail.json
    - src/locales/he/trail.json

key-decisions:
  - "Flat noteNames keys are uppercase (BB, EB, AB, DB) because TrailNodeModal calls .toUpperCase() on regex capture group"
  - "English uses Unicode ♯/♭ symbols per user locked decision — not keyboard chars"
  - "Hebrew uses French solfege terms (דיאז/במול) per user locked decision — not symbols"

patterns-established:
  - "Accidental note translations: EN uses Unicode symbols, HE uses full music terms"
  - "unlockHints keys match node.name exactly (same key used in t() call in TrailNodeModal)"

requirements-completed: [I18N-01]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 04 Plan 02: i18n Accidental Translations Summary

**i18n complete for v2.2: 7 accidental noteNames + 21 node names/descriptions + 4 boss unlockHints added to both en/trail.json and he/trail.json using Unicode ♯/♭ (EN) and דיאז/במול (HE) conventions**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-16T16:28:53Z
- **Completed:** 2026-03-16T16:31:55Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added 7 accidental noteNames to en/trail.json with Unicode ♯/♭ symbols (F♯, C♯, G♯, B♭, E♭, A♭, D♭) — flat keys uppercase (BB/EB/AB/DB) to match JS .toUpperCase() behavior
- Added 7 accidental noteNames to he/trail.json with Hebrew music terms (פה דיאז, דו דיאז, סול דיאז, סי במול, מי במול, לה במול, רה במול)
- Added 21 node name + 21 description entries to both locales covering all new accidental nodes (sharps: Meet F/C/G Sharp, Sharps Together/Friends/Context/Memory/Speed/Star; flats: Meet B/E/A/D Flat, Flats Together/Friends/Context/Memory/Speed/Star, Flat Master, Accidentals Master)
- Added 4 boss unlockHints to both locales (Sharp Star, Flat Star, Flat Master, Accidentals Master)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add accidental translations to en/trail.json** - `56b98ff` (feat)
2. **Task 2: Add accidental translations to he/trail.json** - `a28fabf` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/locales/en/trail.json` - Added 7 accidental noteNames, 21 node names, 21 descriptions, 4 unlockHints (57 new entries)
- `src/locales/he/trail.json` - Added 7 accidental noteNames in Hebrew, 21 Hebrew node names, 21 Hebrew descriptions, 4 Hebrew unlockHints (57 new entries)

## Decisions Made
- Flat noteNames keys must be uppercase (BB, EB, AB, DB) — `TrailNodeModal.jsx` calls `.toUpperCase()` on the regex capture group before the `t()` lookup, so lowercase 'Bb' would never match
- English values use Unicode ♯/♭ (per user locked decision) — consistent with the must_have truth "F♯ not F#"
- Hebrew values use full French-origin solfege terms: דיאז (sharp) and במול (flat) — per user locked decision

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- i18n requirement I18N-01 fully complete — all 21 new accidental nodes have Hebrew translations
- Skill bubbles in TrailNodeModal will show correct note names for all 7 accidentals in both EN and HE
- Node names, descriptions, and boss unlock hints all render in Hebrew for Hebrew users
- Phase 04 is now fully complete (Plan 01 wired units into expandedNodes.js + subscription gate; Plan 02 completed i18n)
- v2.2 milestone (Sharps & Flats) ready for final review

## Self-Check: PASSED

- FOUND: src/locales/en/trail.json
- FOUND: src/locales/he/trail.json
- FOUND: .planning/milestones/v2.2-phases/04-integration-gate-and-i18n/04-02-SUMMARY.md
- FOUND commit: 56b98ff (Task 1 — en/trail.json)
- FOUND commit: a28fabf (Task 2 — he/trail.json)

---
*Phase: 04-integration-gate-and-i18n*
*Completed: 2026-03-16*
