# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Two parallel streams active (see below)

## Parallel Streams

Two milestones are active simultaneously on separate feature branches:

| Stream | Branch | Worktree | Status |
|--------|--------|----------|--------|
| v1.7 Mic Pitch Detection | `feature/v1.7-mic-fix` | `.cursor/worktrees/PianoApp2/mic-fix` | Phase 09 next |
| v1.8 Monetization | `feature/v1.8-monetization` | `.cursor/worktrees/PianoApp2/monetization` | Milestone planning |

**Ownership rules:** `main` owns shared GSD docs (ROADMAP, STATE, PROJECT). Feature branches own their phase directories only. Sync after each phase/plan completion.

## Current Position — v1.7 Mic Pitch Detection

Phase: 08 of 10 (v1.7) — Detection Pipeline — Complete
Plan: 2 of 2 complete (08-01 done, 08-02 done)
Status: Phase 08 complete — PIPE-01 through PIPE-06 delivered
Last activity: 2026-02-22 — Phase 08 Plan 02 complete (BPM timing wiring + per-note dedup in both game components)
Next: Phase 09 — iOS Safari Hardening

Progress: [██████░░░░] 60%+ (v1.7) — 9 plans complete (6-01, 6-02, 7-01, 7-02, 7-03, 7-04, 7-05, 8-01, 8-02)

## Current Position — v1.8 Monetization

Phase: Not started
Status: Milestone scaffolding added to ROADMAP.md — run `/gsd:new-milestone` from monetization worktree to define requirements and phases
Next: Define milestone requirements and create roadmap phases

## Performance Metrics

**Velocity:**
- Total plans completed: 73 (across 27 phases in 7 shipped milestones + v1.7 phases 06-08)
- 7 milestones shipped in 18 days (2026-01-31 to 2026-02-17)
- ~68,298 lines JavaScript/JSX/CSS

**Recent execution (v1.7):**
| Phase-Plan | Duration | Tasks | Files | Date |
|------------|----------|-------|-------|------|
| 06-01 | 6 min | 2 | 2 | 2026-02-17 |
| 06-02 | 5 min | 2 | 4 | 2026-02-17 |
| 07-01 | 3 min | 2 | 3 | 2026-02-17 |
| 07-02 | 3 min | 1 | 1 | 2026-02-17 |
| 07-03 | 3 min | 2 | 2 | 2026-02-17 |
| 07-04 | 4 min | 1 | 1 | 2026-02-17 |
| 07-05 | 7 min | 2 | 4 | 2026-02-17 |
| 08-01 | 3 min | 2 | 3 | 2026-02-22 |
| 08-02 | 2 min | 2 | 2 | 2026-02-22 |

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
- Phase 07-05: SightReadingGame requestMic() called in startListeningSync at call time — follows Plan 04 NotesRecognitionGame pattern to avoid async mic init race
- Phase 07-05: MetronomeTrainer only uses audioContextRef (no requestMic) — rhythm game has no mic input path
- Phase 07-05: __dbgFrames/__dbgLastLogAt removed with __micLog — debug-only state had no remaining consumers
- Phase 07-05: METRONOME_TIMING_DEBUG flag preserved but set to false — developers can enable locally without touching logic
- Phase 07-04: stopAudioInput added to nodeId-change effect deps — ensures mic releases when navigating between trail nodes before auto-start fires
- Phase 07-04: isListening from hook replaces isListeningRef.current in playSound guard — hook provides stable boolean, no ref needed
- Phase 07-04: waitingForRelease detection via useEffect watching audioLevel — replaces rAF-loop level check; semantically identical, React-idiomatic
- Phase 07-04: NOTE_FREQUENCIES removed — was exclusively used by frequencyToNote which is now replaced by useMicNoteInput
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
- [Phase 08-design-data-modeling]: calcMicTimingFromBpm uses 16.7ms/frame (60fps) — consistent with existing onFrames semantics
- [Phase 08-design-data-modeling]: MIN_MIDI lowered from 48 (C3) to 45 (A2) — smallest change needed to unblock bass trail notes A2/B2
- [Phase 08-design-data-modeling]: FSM ARMED->IDLE on silence emits no noteOff — noteOn was never sent from ARMED so no paired event needed
- [Phase 08-design-data-modeling]: SightReadingGame uses MIC_INPUT_PRESETS.sightReading as explicit fallback when gameSettings.tempo absent (PIPE-05)
- [Phase 08-design-data-modeling]: NotesRecognitionGame uses settings.tempo || settings.bpm || 90 — always computes from BPM, no preset fallback (PIPE-05)
- [Phase 08-design-data-modeling]: Dedup window is minInterOnMs*2 — blocks held-note re-triggers without blocking legitimate repeated melody notes (PIPE-06)

### Pending Todos

None — Phase 08 fully complete (all 2 plans including game component BPM wiring 08-02).

### Blockers/Concerns

**Outstanding items (non-blocking, pre-existing):**
- RESOLVED: Pre-existing test failure: SightReadingGame.micRestart.test.jsx — fixed in Phase 06 Plan 01
- Pre-existing lint: 24 errors, 415 warnings (all pre-v1.4)
- syncPracticeSessions() stub in sw.js (zero runtime impact)

**v1.7 Phase 10 gate:**
- PERF-02 and PERF-03 are conditional on PERF-01 profiling result — if no frame drop observed, Phase 10 closes with only PERF-01 delivered

## Session Continuity

Last session: 2026-02-25
Stopped at: Set up parallel worktree workflow for v1.7 + v1.8

**Next actions:**
- **v1.7 stream (mic-fix worktree):** Begin Phase 09 — iOS Safari Hardening
- **v1.8 stream (monetization worktree):** Run `/gsd:new-milestone` to define monetization requirements and phases

---
*State initialized: 2026-01-31*
*Last updated: 2026-02-25 — Parallel worktree workflow established (v1.7 + v1.8)*
