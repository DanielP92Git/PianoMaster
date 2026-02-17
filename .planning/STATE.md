# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** v1.7 Mic Pitch Detection Overhaul — Phase 07 (Audio Architecture & Core Algorithm)

## Current Position

Phase: 07 of 10 (v1.7) — Audio Architecture and Core Algorithm
Plan: 03 of 4 complete
Status: Phase 07 in progress — Plans 01-03 complete, Plan 04 remaining
Last activity: 2026-02-17 — Phase 07 Plan 03 complete (useAudioEngine shared context + useMicNoteInput analyser passthrough)

Progress: [████░░░░░░] 40% (v1.7) — 5 plans complete (6-01, 6-02, 7-01, 7-02*, 7-03)

## Performance Metrics

**Velocity:**
- Total plans completed: 70 (across 27 phases in 7 shipped milestones + v1.7 phases 06-07)
- 7 milestones shipped in 18 days (2026-01-31 to 2026-02-17)
- ~68,298 lines JavaScript/JSX/CSS

**Recent execution (v1.7):**
| Phase-Plan | Duration | Tasks | Files | Date |
|------------|----------|-------|-------|------|
| 06-01 | 6 min | 2 | 2 | 2026-02-17 |
| 06-02 | 5 min | 2 | 4 | 2026-02-17 |
| 07-01 | 3 min | 2 | 3 | 2026-02-17 |
| 07-03 | 3 min | 2 | 2 | 2026-02-17 |

**Recent execution (v1.6):**
| Phase-Plan | Duration | Tasks | Files | Date |
|------------|----------|-------|-------|------|
| 01-01 | 2 min | 2 | 2 | 2026-02-13 |
| 01-02 | 2 min | 2 | 2 | 2026-02-13 |
| 02-01 | 2 min | 2 | 3 | 2026-02-13 |
| 02-02 | 5 min | 2 | 5 | 2026-02-13 |
| 03-01 | 6 min | 2 | 5 | 2026-02-15 |
| 03-02 | 4 min | 2 | 1 | 2026-02-15 |
| 03-03 | ~30 min | 3 | 3 | 2026-02-15 |
| 04-01 | 2 min | 2 | 2 | 2026-02-15 |
| 04-02 | 35 min | 2 | 4 | 2026-02-16 |
| 05-01 | 2 min | 2 | 3 | 2026-02-16 |

## Accumulated Context

### Decisions

All v1.6 decisions archived in PROJECT.md Key Decisions table (234+ entries across 7 milestones).

Recent decisions affecting v1.7:
- Phase 07-03: isOwnedContextRef (useRef, not state) tracks AudioContext ownership — no re-render, stable throughout hook lifetime
- Phase 07-03: cleanup nulls audioContextRef.current in both owned/shared paths — prevents stale ref after cleanup
- Phase 07-03: clarityThreshold forwarded through useMicNoteInput now, before usePitchDetection supports it — avoids another refactor when Plan 02 lands
- Phase 07-03: startListeningWrapped(overrides={}) passes overrides object directly to inner startListening — thin wrapper, no parsing
- Phase 07-01: AudioContextProvider mounts per game route (not app root) — mic permission never requested on non-game pages
- Phase 07-01: getUserMedia disables echoCancellation, noiseSuppression, autoGainControl for raw signal (AUDIO-01)
- Phase 07-01: fftSize=4096 for ~10.8 Hz resolution at 44.1 kHz sample rate (AUDIO-03)
- Phase 07-01: smoothingTimeConstant=0.0 — no frame averaging for accurate per-frame pitch detection (AUDIO-02)
- Phase 07-01: suspend/resume instead of close/create between exercises (ARCH-05)
- Phase 07-01: visibilitychange suspends on hidden, resumes on visible — Phase 09 adds iOS-specific recovery
- Phase 07: pitchy 4.1.0 chosen for McLeod Pitch Method — 5KB, ESM-compatible, zero CDN fetch (COPPA-compliant)
- Phase 10: AudioWorklet is profiling-gated — do not build speculatively; Phase 09 must ship first
- Phase 06-01: Sync ref wrappers (startListeningSync/stopListeningSync) chosen over useEffect sync — eliminates render-cycle delay in phase-enforcement guard
- Phase 06-01: useLocation mocked in test in addition to MemoryRouter wrapper — prevents trail auto-start logic interference
- Phase 06-01: stopListeningRef updated to hold stopListeningSync so abortPerformanceForPenalty also updates micIsListeningRef
- [Phase 06]: MicErrorOverlay returns to GAME_PHASES.SETUP on back action (not full navigation away) to preserve all session data
- [Phase 06]: pauseTimer/resumeTimer called on mic error/recovery to prevent session timeout while kid reads error overlay
- [Phase 07]: detectPitch kept as function shim (not null) to pass backward-compat test; pitchy handles all real detection internally
- [Phase 07]: startListening call-time analyserNode arg takes priority over hook-level prop — handles async mic init race where hook prop is null at render time

### Pending Todos

None — Phase 07 Plan 03 complete.

### Blockers/Concerns

**Outstanding items (non-blocking, pre-existing):**
- RESOLVED: Pre-existing test failure: SightReadingGame.micRestart.test.jsx — fixed in Phase 06 Plan 01
- Pre-existing lint: 24 errors, 415 warnings (all pre-v1.4)
- syncPracticeSessions() stub in sw.js (zero runtime impact)

**v1.7 Phase 10 gate:**
- PERF-02 and PERF-03 are conditional on PERF-01 profiling result — if no frame drop observed, Phase 10 closes with only PERF-01 delivered

## Session Continuity

Last session: 2026-02-17
Stopped at: Completed 07-03-PLAN.md
Resume file: .planning/phases/07-audio-architecture-core-algorithm/07-04-PLAN.md

**Next action:** Execute Phase 07 Plan 04 (NotesRecognitionGame integration with shared AudioContext)

---
*State initialized: 2026-01-31*
*Last updated: 2026-02-17 — Phase 07 Plan 03 complete (useAudioEngine shared context + useMicNoteInput analyser passthrough)*
