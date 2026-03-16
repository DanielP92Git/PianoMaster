---
phase: 04-integration-gate-and-i18n
plan: 03
subsystem: ui
tags: [react, i18n, trail, hebrew, rtl, accidentals]

# Dependency graph
requires:
  - phase: 04-02
    provides: Hebrew and English i18n translations for 21 new accidental nodes and 7 noteNames
provides:
  - TrailNodeModal skill bubbles show only focusNotes for Discovery nodes (not all context notes)
  - Dynamic text sizing in skill bubbles accommodates long Hebrew accidental labels
  - Unicode description fallback (sanitizeAccidentals) converts ASCII # and b to ♯ and ♭ symbols
affects: [trail, i18n, UAT]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "focusNotes-first bubble rendering: use node.noteConfig.focusNotes when non-empty, fall back to node.skills"
    - "Dynamic text sizing in fixed-size containers: compute textSizeClass from displaySkill.length before className"
    - "sanitizeAccidentals regex: ([A-G])# → ♯ and ([A-G])b(?![a-z]) → ♭ for i18n defaultValue fallback"

key-files:
  created: []
  modified:
    - src/components/trail/TrailNodeModal.jsx

key-decisions:
  - "focusNotes-first logic placed inline in the .map() call (ternary) rather than a separate computed variable — keeps the data source visible next to where it is used"
  - "textSizeClass threshold of >4 chars covers all Hebrew two-word accidental names (min 6 chars) while keeping single-letter and 2-char labels (C, F♯) at the large default size"
  - "sanitizeAccidentals uses negative lookahead (?![a-z]) so 'Bb' in compound words like 'Bubble' is never converted — only bare note-name patterns match"
  - "sanitizeAccidentals defined inside the component (not module scope) since it is used only in one JSX expression"

patterns-established:
  - "Unicode accidental safety: any string going into i18n defaultValue should pass through sanitizeAccidentals() to ensure symbols render correctly regardless of i18n lookup outcome"

requirements-completed: [I18N-01]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 04 Plan 03: Trail Node Modal Gap Closure Summary

**TrailNodeModal patched with focusNotes-aware skill source, dynamic text scaling for Hebrew accidentals, and Unicode-safe description fallback — closes two UAT-reported failures.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-16T21:22:00Z
- **Completed:** 2026-03-16T21:30:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Discovery nodes (e.g., "Meet F Sharp") now show only the new focus note as a skill bubble (F♯) instead of all context notes (F, F#, G) — UAT Test 3 issue resolved
- Hebrew two-word accidental names (e.g., "פה דיאז", 7 chars) render at `text-xs sm:text-sm` inside the fixed 56px bubble without overflow — UAT Test 4 issue resolved
- Description subtitle now uses Unicode ♯/♭ even if i18n lookup falls through to the ASCII `node.description` defaultValue

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix skill bubble source, text scaling, and description fallback** - `fff18d9` (fix)

## Files Created/Modified

- `src/components/trail/TrailNodeModal.jsx` - focusNotes-first bubble rendering, dynamic textSizeClass, sanitizeAccidentals utility and description defaultValue update

## Decisions Made

- focusNotes-first logic placed inline in the `.map()` call (ternary) rather than a separate computed variable — keeps the data source visible next to where it is used
- textSizeClass threshold of `>4` chars covers all Hebrew two-word accidental names (min 6 chars) while keeping single-letter and 2-char labels at the large default size
- `sanitizeAccidentals` uses negative lookahead `(?![a-z])` to avoid converting compound words like "Bubble" — only bare note-name patterns match
- Helper defined inside the component (not module scope) since it is used only in one JSX expression

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four Phase 04 plans are now complete: Integration bugs (01), i18n translations (02), and Modal gap closure (03)
- v2.2 Sharps & Flats milestone is complete
- UAT tests 3 and 4 are resolved; full UAT re-run recommended to confirm all 7 tests pass

---
*Phase: 04-integration-gate-and-i18n*
*Completed: 2026-03-16*
