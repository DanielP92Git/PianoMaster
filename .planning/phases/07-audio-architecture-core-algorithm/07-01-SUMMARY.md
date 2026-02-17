---
phase: 07-audio-architecture-core-algorithm
plan: 01
subsystem: audio
tags: [audio-context, pitch-detection, react-context, safari-compat]
dependency_graph:
  requires: []
  provides: [AudioContextProvider, useAudioContext, pitchy-installed]
  affects: [src/App.jsx, src/contexts/AudioContextProvider.jsx]
tech_stack:
  added: [pitchy@4.1.0]
  patterns: [React Context provider, single AudioContext singleton, suspend/resume lifecycle]
key_files:
  created:
    - src/contexts/AudioContextProvider.jsx
  modified:
    - src/App.jsx
    - package.json
decisions:
  - "AudioContextProvider mounts per game route (not app root) — mic permission never requested on non-game pages"
  - "getUserMedia disables echoCancellation, noiseSuppression, autoGainControl for raw signal"
  - "fftSize=4096 for ~10.8 Hz resolution at 44.1 kHz sample rate"
  - "smoothingTimeConstant=0.0 — no frame averaging for accurate per-frame pitch detection"
  - "suspend/resume instead of close/create between exercises (ARCH-05)"
  - "visibilitychange suspends on hidden, resumes on visible — Phase 09 adds iOS-specific recovery"
metrics:
  duration: "3 minutes"
  completed: "2026-02-17"
  tasks: 2
  files: 3
---

# Phase 07 Plan 01: AudioContextProvider Foundation Summary

**One-liner:** Single shared AudioContextProvider with DSP-disabled mic, fftSize 4096, suspend/resume lifecycle, and pitchy 4.1.0 installed for McLeod Pitch Method.

## What Was Built

A React Context provider (`AudioContextProvider`) that establishes the single AudioContext foundation for all game components. This eliminates Safari's 4-context limit risk and centralizes the audio chain configuration. pitchy 4.1.0 was installed as the pitch detection library to be used in Plan 02.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Install pitchy 4.1.0 and create AudioContextProvider | def3810 | src/contexts/AudioContextProvider.jsx, package.json, package-lock.json |
| 2 | Wrap game routes with AudioContextProvider in App.jsx | 402f766 | src/App.jsx |

## Key Implementation Details

### AudioContextProvider.jsx

- `getOrCreateAudioContext()` — creates a single AudioContext, resuming if suspended rather than creating a new one
- `requestMic()` — calls `getUserMedia` with `{ echoCancellation: false, noiseSuppression: false, autoGainControl: false }`, creates AnalyserNode with `fftSize=4096` and `smoothingTimeConstant=0.0`, connects source to analyser
- `releaseMic()` — stops all MediaStream tracks and nulls chain refs, does NOT close AudioContext
- `suspendAudio()` / `resumeAudio()` — ARCH-05 lifecycle callbacks using AudioContext state checks
- `visibilitychange` listener — suspends on hidden, resumes on visible
- Cleanup effect on unmount — calls `releaseMic()` then closes AudioContext

### App.jsx Game Route Wrapping

Three mic-using game routes wrapped with `AudioContextProvider`:
- `/notes-master-mode/notes-recognition-game` → `<AudioContextProvider><NotesRecognitionGame /></AudioContextProvider>`
- `/notes-master-mode/sight-reading-game` → `<AudioContextProvider><SightReadingGame /></AudioContextProvider>`
- `/rhythm-mode/metronome-trainer` → `<AudioContextProvider><MetronomeTrainer /></AudioContextProvider>`

Non-game routes (dashboard, trail, settings, menus) are NOT wrapped — no audio overhead on non-game pages.

## Verification Results

- `npm ls pitchy` confirms pitchy@4.1.0 installed
- `npm run build` succeeds with no errors (chunk size warning is pre-existing)
- AudioContextProvider.jsx exports `AudioContextProvider` and `useAudioContext`
- App.jsx wraps exactly the three mic-using game routes
- getUserMedia constraints disable all browser DSP
- AnalyserNode configured with fftSize 4096, smoothingTimeConstant 0.0

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- [x] `src/contexts/AudioContextProvider.jsx` exists
- [x] Commit def3810 exists (Task 1)
- [x] Commit 402f766 exists (Task 2)
- [x] Build succeeds
- [x] pitchy@4.1.0 confirmed installed
