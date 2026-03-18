---
phase: 07-key-signature-rendering-infrastructure
plan: 01
subsystem: ui
tags: [vexflow, react, i18n, music-theory, sight-reading]

# Dependency graph
requires: []
provides:
  - KEY_NOTE_LETTERS map for all 7 key signatures (C, G, D, A, F, Bb, Eb)
  - KEY_SIGNATURE_OPTIONS array (7 entries with VexFlow key strings, i18n label/badge keys)
  - filterNotesToKey utility (filters pitch arrays to in-key notes)
  - KeySignatureSelection step component (7-button glassmorphism UI with aria-pressed)
  - PreGameSetup key signature wizard step (after clef, before notes)
  - Auto-filter effect (key change filters selectedNotes to in-key pitches)
  - DEFAULT_SETTINGS with keySignature: null
  - EN + HE i18n keys for step label, 7 key names, 7 accidental badges
affects:
  - 07-02 (rendering plan: depends on KEY_NOTE_LETTERS, keySignatureConfig, filterNotesToKey)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "KEY_NOTE_LETTERS static map (not runtime KeyManager) for testable, deterministic in-key note filtering"
    - "filterNotesToKey regex /^([A-G][#b]?)\\d/ to extract note letter+accidental from pitch strings"
    - "KeySignatureSelection follows existing UnifiedGameSettings step component pattern (settings + updateSetting)"
    - "Auto-filter via useRef + useEffect watching settings.keySignature in PreGameSetup"

key-files:
  created:
    - src/components/games/sight-reading-game/constants/keySignatureConfig.js
    - src/components/games/sight-reading-game/utils/keySignatureUtils.js
    - src/components/games/sight-reading-game/utils/keySignatureUtils.test.js
    - src/components/games/sight-reading-game/components/KeySignatureSelection.jsx
  modified:
    - src/components/games/sight-reading-game/constants/gameSettings.js
    - src/components/games/sight-reading-game/components/PreGameSetup.jsx
    - src/components/games/shared/UnifiedGameSettings.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "KeySignatureSelection uses updateSetting(key, value) API matching all other UnifiedGameSettings step components (not onUpdateSettings as plan specified)"
  - "KeySignatureSelection imported from its own file and registered in UnifiedGameSettings renderStepComponent switch (consistent with being a domain-specific component)"
  - "Auto-filter only reduces existing selectedNotes (never replaces with full in-key set) — preserves user's prior selections where possible"

patterns-established:
  - "Step components for UnifiedGameSettings: defined in their own file, imported and registered in renderStepComponent switch, receive (settings, updateSetting) props"
  - "filterNotesToKey: pass VexFlow key string directly — same format as stave.addKeySignature()"

requirements-completed:
  - RENDER-03

# Metrics
duration: 6min
completed: 2026-03-18
---

# Phase 07 Plan 01: Key Signature Config, Utils, and UI Step Summary

**KEY_NOTE_LETTERS map, filterNotesToKey utility (20 passing tests), and KeySignatureSelection wizard step wired into PreGameSetup with EN/HE i18n**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-18T15:13:14Z
- **Completed:** 2026-03-18T15:19:00Z
- **Tasks:** 2
- **Files modified:** 9 (4 created, 5 modified)

## Accomplishments
- Frozen `KEY_NOTE_LETTERS` map for all 7 key signatures with exact in-key note letter sets verified by 20 unit tests
- `filterNotesToKey` utility correctly filters pitch arrays (e.g. `['F4', 'F#4']` in G major → `['F#4']`) using regex `/^([A-G][#b]?)\d/`
- `KeySignatureSelection` component renders 7 key options with glassmorphism styling (`bg-indigo-600/30 border-indigo-400` selected state, `aria-pressed`, `min-h-[44px]` touch targets)
- `PreGameSetup` wizard now has 6 steps: clef → key signature → notes → rhythm → bars → tempo
- Auto-filter effect: selecting a non-C key in free-play immediately removes out-of-key notes from `selectedNotes`
- Full EN and HE translations for step label, 7 key names (with Unicode flat symbols), and 7 accidental badge strings

## Task Commits

Each task was committed atomically:

1. **Task 1: Create key signature constants and note-filtering utility with tests** - `99b0864` (feat + test, TDD)
2. **Task 2: Create KeySignatureSelection component, wire into PreGameSetup, add i18n** - `e404f61` (feat)

## Files Created/Modified
- `src/components/games/sight-reading-game/constants/keySignatureConfig.js` - KEY_NOTE_LETTERS map and KEY_SIGNATURE_OPTIONS array (7 entries)
- `src/components/games/sight-reading-game/utils/keySignatureUtils.js` - filterNotesToKey utility
- `src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` - 20 unit tests (all 7 keys + edge cases)
- `src/components/games/sight-reading-game/components/KeySignatureSelection.jsx` - 7-button key selector with glassmorphism + a11y
- `src/components/games/sight-reading-game/constants/gameSettings.js` - Added `keySignature: null` to DEFAULT_SETTINGS
- `src/components/games/sight-reading-game/components/PreGameSetup.jsx` - Added keySignature step, filterNotesToKey import, auto-filter effect
- `src/components/games/shared/UnifiedGameSettings.jsx` - Imported KeySignatureSelection, added case to renderStepComponent switch
- `src/locales/en/common.json` - Added keySignature step label + 14 key/badge translation keys
- `src/locales/he/common.json` - Added Hebrew key/badge translation keys

## Decisions Made
- `KeySignatureSelection` uses `updateSetting(key, value)` API (matching all existing step components) rather than the `onUpdateSettings` prop pattern the plan specified — the codebase pattern is authoritative.
- `KeySignatureSelection` is imported from its own file and registered in `renderStepComponent` switch, consistent with it being a sight-reading-domain-specific component.
- Auto-filter only reduces existing `selectedNotes` (never replaces with the full in-key set) to preserve user's prior selections where possible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] KeySignatureSelection API matches codebase pattern (updateSetting, not onUpdateSettings)**
- **Found during:** Task 2 (creating KeySignatureSelection component)
- **Issue:** Plan specified `{ settings, onUpdateSettings }` props, but all existing UnifiedGameSettings step components use `{ settings, updateSetting }`. Using `onUpdateSettings` would have caused a runtime error (prop not provided).
- **Fix:** Used `updateSetting` prop to match the actual codebase contract.
- **Files modified:** `src/components/games/sight-reading-game/components/KeySignatureSelection.jsx`
- **Verification:** Build passes, consistent with ClefSelection and all other step components.
- **Committed in:** `e404f61` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - prop API mismatch)
**Impact on plan:** Necessary correction — plan spec was inconsistent with codebase API. No scope change.

## Issues Encountered
None — TDD RED/GREEN cycle worked cleanly. Build and lint had no new errors or warnings.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 can now import `KEY_SIGNATURE_OPTIONS`, `KEY_NOTE_LETTERS`, and `filterNotesToKey` from the established locations
- `DEFAULT_SETTINGS.keySignature` is `null` — existing sight-reading games are unaffected (zero regression)
- `KeySignatureSelection` is live in the PreGameSetup wizard and ready for end-to-end testing

---
*Phase: 07-key-signature-rendering-infrastructure*
*Completed: 2026-03-18*
