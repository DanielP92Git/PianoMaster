---
phase: 19-notes-recognition-engagement
plan: "02"
subsystem: game-engagement
tags: [on-fire, auto-grow, note-pool, particles, web-audio, reduced-motion, notes-recognition]
dependency_graph:
  requires:
    - phase: 19-01
      provides: combo/lives/speed-bonus state, ref-plus-state pattern, engagement constants
  provides: [on-fire-visual-mode, auto-grow-note-pool, fire-sound, getNextNodeInCategory-helper]
  affects: [NotesRecognitionGame, skillTrail]
tech_stack:
  added: []
  patterns: [web-audio-oscillator-sound, multi-node-search-for-auto-grow, dual-reduced-motion-check]
key_files:
  created: []
  modified:
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx
    - src/data/skillTrail.js
decisions:
  - "playFireSound uses standalone Web Audio oscillator (not useSounds) to avoid mutual-pause conflict with existing game sounds"
  - "isOnFireRef mirrors isOnFire state for stale-closure-safe reads inside handleAnswerSelect (same ref-plus-state pattern as comboRef/livesRef)"
  - "sessionExtraNotesRef read inside getRandomNote (avoids stale closure), sessionExtraNotes state used in availableNotes useMemo (triggers re-render for answer buttons)"
  - "getNextPedagogicalNote searches up to 10 subsequent nodes (not just immediate next) because adjacent nodes often share the same notePool"
  - "On-fire glow uses increased opacity (28%/14%) and larger particles (h-2.5, 70% peak) for clear visibility against purple gradient background"
  - "Reduced motion detection checks both OS-level (framer-motion useReducedMotion) AND app-level (AccessibilityContext.reducedMotion) for complete coverage"
patterns_established:
  - "Web Audio oscillator for ephemeral UI sounds: create AudioContext per play, close after ~500ms, no caching needed"
  - "Multi-node pedagogical search: iterate subsequent trail nodes to find genuinely new notes, not just the immediate next"
requirements_completed: [GAME-04, GAME-05]
metrics:
  duration: "~8 minutes"
  completed: "2026-03-05"
  tasks: 2
  files: 2
---

# Phase 19 Plan 02: On-Fire Mode and Auto-Grow Note Pool Summary

**On-fire visual overlay with warm amber glow and floating ember particles after 5 correct answers, synthesized chime via Web Audio oscillator, auto-growing note pool from next trail node every 5 streak (max 3 extras per session), and "New note unlocked!" in-game banner**

## Performance

- **Duration:** ~8 minutes (including checkpoint verification and 3 post-verification fixes)
- **Started:** 2026-03-05T02:57:57Z
- **Completed:** 2026-03-05
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 2

## Accomplishments

- On-fire mode provides visceral reward for sustained streaks: warm amber radial-gradient glow + 6 floating ember particles animate upward with staggered delays
- Reduced motion alternative: static amber border ring + "ON FIRE" text badge (no particles, no animation)
- Auto-grow challenges engaged students by silently expanding the note pool from the next trail node every 5 correct answers in a streak
- Fire activation sound via standalone Web Audio oscillator avoids conflict with useSounds mutual-pause pattern
- Complete arcade engagement system verified end-to-end across Plans 01 and 02

## Task Commits

Each task was committed atomically:

1. **Task 1: Add on-fire visual mode, fire sound, auto-grow note pool, and new-note banner** - `41fcabf` (feat)
2. **Task 2: Human verification with 3 fixes** - `00fff6f` (fix)

## Files Created/Modified

- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` - On-fire overlay with particles, flame-out exit animation, auto-grow note pool logic, new-note banner, fire sound, reduced motion alternative
- `src/data/skillTrail.js` - Added `getNextNodeInCategory` helper for pedagogical note lookup

## Decisions Made

- **Web Audio oscillator for fire sound:** Each activation creates a fresh AudioContext with a sine oscillator ramping 880Hz to 1760Hz over 150ms, gain fading from 0.3 to 0.01 over 300ms. Context closed after 500ms. Zero external dependencies, works offline.
- **Ref-plus-state for isOnFire:** `isOnFireRef.current` read inside `handleAnswerSelect` for stale-closure safety in mic mode; `isOnFire` state drives the overlay render via AnimatePresence.
- **Dual ref/state for sessionExtraNotes:** `sessionExtraNotesRef` read inside `getRandomNote` (avoids stale closure in mic callback chain); `sessionExtraNotes` state used in `availableNotes` useMemo dependency array (triggers re-render for answer button display).
- **Multi-node search (post-verification fix):** `getNextPedagogicalNote` iterates up to 10 subsequent nodes instead of only the immediate next, because adjacent trail nodes often share the same notePool and would yield no new notes.
- **Increased glow opacity (post-verification fix):** Radial gradient opacity increased from 12%/6% to 28%/14%, particles enlarged from h-1.5 to h-2.5 with 70% peak opacity, for clear visibility against the purple gradient background.
- **Dual reduced motion check (post-verification fix):** Uses both `useReducedMotion()` from framer-motion (OS-level prefers-reduced-motion) AND `reducedMotion` from AccessibilityContext (app-level setting) for complete coverage.

## Deviations from Plan

### Auto-fixed Issues (post-verification)

**1. [Rule 1 - Bug] On-fire glow too pale against purple background**
- **Found during:** Task 2 (human verification)
- **Issue:** Original 12%/6% opacity glow and tiny 1.5px particles were nearly invisible on the dark purple gradient background
- **Fix:** Increased glow to 28%/14% opacity, enlarged particles to h-2.5 w-2.5 with 70% peak opacity, repositioned vertical range to visible mid-zone (70% to 10%)
- **Files modified:** `NotesRecognitionGame.jsx`
- **Commit:** 00fff6f

**2. [Rule 1 - Bug] Reduced motion not hiding particles**
- **Found during:** Task 2 (human verification)
- **Issue:** Only checked framer-motion's `useReducedMotion()` (OS-level), missed the app's own AccessibilityContext `reducedMotion` setting
- **Fix:** Combined both checks: `const shouldReduceMotion = reduce || reducedMotion` using both `useReducedMotion()` and `useContext(AccessibilityContext).reducedMotion`
- **Files modified:** `NotesRecognitionGame.jsx`
- **Commit:** 00fff6f

**3. [Rule 1 - Bug] Auto-grow banner never appearing**
- **Found during:** Task 2 (human verification)
- **Issue:** `getNextPedagogicalNote` only checked the immediate next node, which often had the same notePool as the current node (no new notes to add)
- **Fix:** Changed to search up to 10 subsequent nodes in the same category until finding one with genuinely new notes
- **Files modified:** `NotesRecognitionGame.jsx`
- **Commit:** 00fff6f

---

**Total deviations:** 3 auto-fixed (3 bugs found during human verification)
**Impact on plan:** All fixes necessary for correct visual/functional behavior. No scope creep.

## Issues Encountered

None beyond the 3 items caught during human verification (documented above as deviations).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 19 (Notes Recognition Engagement) is now fully complete with all 5 GAME requirements delivered
- Phase 20 (Extended Progression System) can proceed when planned
- No blockers or concerns

## Self-Check

Files exist:
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` -- modified
- `src/data/skillTrail.js` -- modified

Commits:
- 41fcabf: feat(19-02): add on-fire mode, fire sound, auto-grow note pool, and new-note banner
- 00fff6f: fix(19-02): stronger on-fire glow, respect app reduced-motion, fix auto-grow search

Build: `npx vite build --mode production` -- passed (no errors, only pre-existing chunk size warning)

---
*Phase: 19-notes-recognition-engagement*
*Completed: 2026-03-05*
