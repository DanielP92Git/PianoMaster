---
phase: quick-260326-wo7
plan: "01"
subsystem: trail
tags: [trail, modal, discovery-nodes, note-preview, keyboard, i18n]
dependency_graph:
  requires: []
  provides: [NotePreview, MiniKeyboard]
  affects: [TrailNodeModal]
tech_stack:
  added: []
  patterns: [lazy-dynamic-import, static-css-keyboard, self-gating-component]
key_files:
  created:
    - src/components/trail/NotePreview.jsx
    - src/components/trail/MiniKeyboard.jsx
  modified:
    - src/components/trail/TrailNodeModal.jsx
    - src/locales/en/trail.json
    - src/locales/he/trail.json
decisions:
  - "Staff SVGs loaded lazily via dynamic import() to avoid bundling gameSettings into trail chunk"
  - "MiniKeyboard forces dir=ltr to prevent RTL layout inversion in Hebrew mode"
  - "NotePreview self-gates (returns null) when focusNotes is empty — no conditional wrapper needed in TrailNodeModal"
  - "Flat enharmonics normalised to sharp equivalents for keyboard key matching (Bb→A#, etc.)"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-03-26T21:42:22Z"
  tasks_completed: 2
  tasks_total: 3
  files_created: 2
  files_modified: 3
---

# Quick Task 260326-wo7: Add Note Staff Image and Mini Keyboard to TrailNodeModal — Summary

**One-liner:** Static CSS mini piano keyboard + lazy-loaded staff SVGs rendered in TrailNodeModal for Discovery nodes, using focusNotes from noteConfig.

## What Was Built

Two new React components integrated into the Trail modal experience:

**`MiniKeyboard.jsx`** — A purely visual, static CSS piano keyboard spanning one octave (C through next C, 8 white keys + 5 black keys). Focus note keys are highlighted in category-aware colors (blue-400 for treble, purple-400 for bass). Black key positions are computed geometrically from gap indices. Flat pitches are normalised to sharp equivalents for key matching. The container forces `dir="ltr"` so the keyboard reads correctly in Hebrew (RTL) mode.

**`NotePreview.jsx`** — Wraps the staff SVG images and MiniKeyboard into a single preview card. Uses a `useEffect` + dynamic `import()` to lazily load `gameSettings.js` only when a Discovery node modal opens. Finds the matching `ImageComponent` for each pitch in `focusNotes` from the `TREBLE_NOTES`/`BASS_NOTES` arrays. Shows a loading placeholder (animated pulse) while the chunk loads. Returns `null` when `focusNotes` is empty, making it safe to render unconditionally.

**`TrailNodeModal.jsx`** — Adds `import NotePreview from './NotePreview'` and renders `<NotePreview node={node} />` between the skills bubble badges section and the loading skeleton. No conditional wrapper needed in the modal itself.

**i18n keys added:**
- `trail:modal.notePreview` → "On the Staff" / "על החמשה"
- `trail:modal.keyboardPreview` → "On the Piano" / "על הפסנתר"

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired. The `ImageComponent` for a given pitch may be `null` if no SVG exists in `TREBLE_IMAGE_MAP`/`BASS_IMAGE_MAP` (e.g., an unusual pitch); in that case NotePreview shows a labelled placeholder div. This is intentional graceful degradation, not a stub.

## Self-Check: PASSED

- `src/components/trail/NotePreview.jsx` — created, 110 lines
- `src/components/trail/MiniKeyboard.jsx` — created, 193 lines
- `src/components/trail/TrailNodeModal.jsx` — modified (NotePreview import + render)
- `src/locales/en/trail.json` — modal.notePreview + modal.keyboardPreview added
- `src/locales/he/trail.json` — Hebrew equivalents added
- Commits: b471c44 (Task 1), 4c8bf2d (Task 2)
- Build: passes (`npm run build` — no errors, gameSettings in separate lazy chunk)
- Tests: 365 passed, 0 failed
