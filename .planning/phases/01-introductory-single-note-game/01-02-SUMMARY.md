---
phase: 01-introductory-single-note-game
plan: 02
subsystem: ui
tags: [react, game, animation, trail, vitest]

# Dependency graph
requires:
  - NOTE_CATCH exercise type (from 01-01)
  - TrailNodeModal routing (from 01-01)
  - App.jsx lazy route (from 01-01)
  - i18n strings (from 01-01)
provides:
  - NoteSpeedCards game component (624+ lines)
  - Complete speed card game playable from trail
---

## What Was Built

Complete NoteSpeedCards game component — a speed card game where note cards slide across the screen and the child taps to catch the target note (Middle C). Replaces the trivially-easy note_recognition exercise on first treble and bass nodes.

## Key Features

- **Conveyor animation**: Cards slide right-to-left (RTL-aware) using framer-motion AnimatePresence
- **3-lives system**: Wrong taps cost hearts, 0 lives = GameOverScreen
- **3-2-1 countdown**: Animated countdown before cards start
- **4-tier speed ramp**: 2500→2000→1700→1400ms across 30 cards, with -50ms/correct catch bonus (floor 1000ms)
- **Combo system**: Increments on correct, resets on wrong tap
- **Feedback flashes**: Green (correct), red (wrong), amber (missed target)
- **Trail auto-start**: hasAutoStartedRef pattern, reads nodeConfig from location.state
- **VictoryScreen integration**: Shows catch count subtitle, score as percentage
- **GameOverScreen integration**: Full-screen with purple gradient background
- **Desktop support**: Spacebar triggers tap action
- **Accessibility**: aria-live announcements, high contrast mode, reduced motion
- **Mobile**: useLandscapeLock, rotate prompt overlay, touch-manipulation
- **RTL**: Card slide direction reverses for Hebrew

## Key Files

- `src/components/games/notes-master-games/NoteSpeedCards.jsx` — Main game component
- `src/components/games/notes-master-games/NoteSpeedCards.test.js` — 12 tests for pure functions
- `src/components/games/VictoryScreen.jsx` — Added subtitle prop
- `src/components/games/GameOverScreen.jsx` — Added full-screen bg + z-index

## Deviations from Plan

- Added 3-lives system (not in original plan — discovered during verification that no-punishment allowed spam-tapping)
- Added 3-2-1 countdown (added during verification for better game feel)
- Speed tiers significantly slowed down from original plan values
- Bonus speed reduction halved (-50ms instead of -100ms, floor 1000ms instead of 700ms)
- Added spacebar support for desktop play
- Dynamic note name in all i18n strings (headline, subheadline, tapHint)

## Self-Check: PASSED

- [x] NoteSpeedCards.jsx exists with named export (624+ lines)
- [x] All 12 pure function tests GREEN
- [x] Trail auto-start works from both treble_1_1 and bass_1_1
- [x] VictoryScreen shows with catch count after completing all cards
- [x] GameOverScreen shows after 3 wrong taps
- [x] Build passes
- [x] Trail validator passes
