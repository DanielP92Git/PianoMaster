---
gsd_state_version: 1.0
milestone: between
milestone_name: All milestones v1.0-v1.8 shipped
status: complete
stopped_at: All milestones shipped — v1.9 not yet scoped
last_updated: "2026-03-04"
last_activity: 2026-03-04 — v1.7 Phase 10 complete (PERF-01 PASS, AudioWorklet skipped)
progress:
  total_phases: 38
  completed_phases: 38
  total_plans: 93
  completed_plans: 92
  skipped_plans: 1
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Between milestones. All v1.0-v1.8 shipped. v1.9 Engagement & Retention not yet scoped.

## Current Position

All milestones v1.0 through v1.8 are shipped.
Last milestone completed: v1.8 App Monetization (2026-03-01)
Last phase completed: Phase 10 Performance Profiling (v1.7) — 2026-03-04

Progress: [██████████] 38/38 phases complete across 9 milestones (v1.0-v1.8)

## Performance Metrics

**Velocity:**
- Total plans completed: 92 (1 skipped: Plan 10-02 AudioWorklet, profiling gate PASS)
- 9 milestones shipped in 33 days (2026-01-31 to 2026-03-04)
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
| 09-01 | 3 min | 2 | 5 | 2026-03-03 |
| 09-02 | — | — | — | 2026-03-03 |
| 10-01 | 30 min | 3 | 2 | 2026-03-04 |

**Recent execution (v1.8):**
| Phase-Plan | Duration | Tasks | Files | Date |
|------------|----------|-------|-------|------|
| 13-01 | 4 min | 2 | 6 | 2026-02-26 |
| 13-02 | 8 min | 2 | 2 | 2026-02-26 |
| 14-01 | 3 min | 2 | 4 | 2026-02-28 |
| 15-01 | 20 min | 2 | 8 | 2026-03-01 |
| 15-02 | 9 min | 1 | 3 | 2026-03-01 |
| 16-01 | 3 min | 2 | 6 | 2026-03-01 |
| 16-02 | 4 min | 2 | 5 | 2026-03-01 |
| 16-03 | — | — | — | 2026-03-01 |

## Accumulated Context

### Decisions

All v1.7 and v1.8 decisions archived below. See PROJECT.md Key Decisions table for v1.0-v1.6 (290+ entries).

**v1.7 decisions:**
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
- Phase 06-01: Sync ref wrappers (startListeningSync/stopListeningSync) chosen over useEffect sync — eliminates render-cycle delay in phase-enforcement guard
- Phase 06-01: useLocation mocked in test in addition to MemoryRouter wrapper — prevents trail auto-start logic interference
- Phase 06-01: stopListeningRef updated to hold stopListeningSync so abortPerformanceForPenalty also updates micIsListeningRef
- Phase 06: MicErrorOverlay returns to GAME_PHASES.SETUP on back action (not full navigation away) to preserve all session data
- Phase 06: pauseTimer/resumeTimer called on mic error/recovery to prevent session timeout while kid reads error overlay
- Phase 07: detectPitch kept as function shim (not null) to pass backward-compat test; pitchy handles all real detection internally
- Phase 07: startListening call-time analyserNode arg takes priority over hook-level prop — handles async mic init race where hook prop is null at render time
- Phase 08: calcMicTimingFromBpm uses 16.7ms/frame (60fps) — consistent with existing onFrames semantics
- Phase 08: MIN_MIDI lowered from 48 (C3) to 45 (A2) — smallest change needed to unblock bass trail notes A2/B2
- Phase 08: FSM ARMED->IDLE on silence emits no noteOff — noteOn was never sent from ARMED so no paired event needed
- Phase 08: SightReadingGame uses MIC_INPUT_PRESETS.sightReading as explicit fallback when gameSettings.tempo absent (PIPE-05)
- Phase 08: NotesRecognitionGame uses settings.tempo || settings.bpm || 90 — always computes from BPM, no preset fallback (PIPE-05)
- Phase 08: Dedup window is minInterOnMs*2 — blocks held-note re-triggers without blocking legitimate repeated melody notes (PIPE-06)
- Phase 09: onstatechange wired in mount-time useEffect so setIsInterrupted is in scope (not ref initializer block)
- Phase 09: handleTapToResume calls ctx.resume() synchronously before any await - satisfies iOS user-gesture requirement (IOS-02)
- Phase 09: AudioInterruptedOverlay uses bg-black/30 (calmer than MicErrorOverlay bg-black/50) - interruptions are less alarming than errors
- Phase 10: PERF-01 PASS: Pixel 6 (Tensor chip, Chrome 145) ran 85-95fps during active mic detection; scripting at 4.3% of frame budget — AudioWorklet migration skipped, Plan 10-02 not needed
- Phase 10: Phase 10 closes with only Plan 01 delivered — PERF-02, PERF-03 not applicable (no frame drop observed)

**v1.8 decisions:**
- Phase 13: Cache version bumped from pianomaster-v5 to pianomaster-v6 — forces cache refresh for all PWA users on monetization deploy
- Phase 13: isRestApiEndpoint() added to sw.js — REST API responses never cached, prevents stale subscription data
- Phase 13: Offline 503 for REST API fallback — React layer handles graceful offline UX, not service worker
- Phase 13: Unknown student_id returns HTTP 200 (not 400/500) — LS retries can't fix missing student_id; 200 stops wasteful retries
- Phase 13: verifySignature.ts imports timingSafeEqual from pinned deno.land/std@0.224.0 — avoids version ambiguity
- Phase 13: upsertSubscription takes injected supabase client (not createClient internally) — enables testability without Deno runtime
- Phase 13: plan_id left NULL in parent_subscriptions upsert — Phase 16 maps ls_variant_id to plan_id
- Phase 14: vi.hoisted() used for Vitest mock variables — vi.mock factory hoisted before const declarations
- Phase 14: Toast shown only in useEffect watching query data, not in Realtime callback — prevents duplicate toasts on reconnect
- Phase 14: staleTime: 0 with refetchOnWindowFocus: false — Realtime push handles isPremium freshness; polling is redundant
- Phase 14: maybeSingle() used in subscriptionService: unsubscribed students have no parent_subscriptions row; single() would throw
- Phase 15: subscriptionConfig.js uses explicit static node ID lists — prevents accidental paywall expansion if unit files grow
- Phase 15: premiumLockedNodeIds computed once at TrailMap level via useMemo — single subscription check, no per-node hook calls
- Phase 15: isPremium defaults to false during loading — non-free nodes show gold (no flash of unlocked content)
- Phase 15: premium_locked is highest priority in nodeState useMemo — subscription gate overrides prerequisite-locked state
- Phase 15: isPremiumLocked defaults to false in TrailNodeModal — safe default, wrong direction fails open to normal modal
- Phase 15: getNextRecommendedNode isPremium defaults to false — free-tier filter is always active unless explicitly unlocked
- Phase 15: isPremium included in Dashboard queryKey — React Query re-fetches automatically when subscription flips
- Phase 16: create-checkout uses service role client for plan lookup — consistent with webhook pattern
- Phase 16: cancel-subscription returns endsAt with fallback to current_period_end from DB if LS DELETE lacks ends_at
- Phase 16: verify_jwt = true in config.toml for create-checkout and cancel-subscription + manual auth.getUser() check
- Phase 16: upsertSubscription.ts plan_id lookup: maybeSingle() + plan?.id ?? null — null fallback for unknown variant IDs
- Phase 16: Option B chosen for App.jsx: /subscribe and /subscribe/success only; /parent-portal deferred to Plan 03
- Phase 16: lemonSetupRef (useRef) guards LemonSqueezy.Setup() against StrictMode double-invocation in SubscribePage
- Phase 16-03: ParentPortalPage staleTime:0 for subscription-detail — matches SubscriptionContext, never shows stale data
- Phase 16-03: Optimistic cancel state via setOptimisticCancel merges on fetched detail — avoids refetch delay
- Phase 16-03: AppSettings Subscription section defaultOpen:true — high-priority info for parents visiting settings
- Phase 16-03: TrailNodeModal paywall: Got it (gray secondary) + Ask a parent (amber primary) — reverses priority to nudge upgrade

### Pending Todos

- Review engagement research for v1.9+ milestone planning (see `.planning/research/ENGAGEMENT_RETENTION.md`)
- Trail content expansion needs scoping: 5 new sections (~85 nodes) identified, requires content authoring effort estimate

### Blockers/Concerns

**Outstanding items (non-blocking, pre-existing):**
- Pre-existing lint: 24 errors, 415 warnings (all pre-v1.4)
- syncPracticeSessions() stub in sw.js (zero runtime impact)

## Session Continuity

Last session: 2026-03-04
Stopped at: All milestones v1.0-v1.8 shipped

**Next action:**
- Scope v1.9 Engagement & Retention milestone (see `.planning/research/ENGAGEMENT_RETENTION.md`)
- Trail content expansion: 5 new sections (~85 nodes) need content authoring effort estimate

---
*State initialized: 2026-01-31*
*Last updated: 2026-03-04 — All milestones v1.0-v1.8 shipped, documentation housekeeping complete*
