---
gsd_state_version: 1.0
milestone: v1.7
milestone_name: Mic Pitch Detection Overhaul
status: in_progress
last_updated: "2026-03-04"
progress:
  total_phases: 38
  completed_phases: 37
  total_plans: 92
  completed_plans: 92
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** v1.7 Mic Pitch Detection Overhaul — Phase 10 Performance (Profiling-Gated) NOT STARTED. v1.8 App Monetization SHIPPED.

## Current Position

Phase: 10 (v1.7) — Performance (Profiling-Gated) — NOT STARTED
Previous: Phase 09 (v1.7) — iOS Safari Hardening — COMPLETE (2026-03-03)
v1.8 status: All 6 phases (11-16) SHIPPED (2026-02-26 to 2026-03-01)
Last activity: 2026-03-03 — Phase 09 complete (iOS Safari hardening with AudioContext interruption recovery)

Progress: v1.7 [████████░░] 4/5 phases complete (Phase 10 pending) | v1.8 [██████████] 6/6 phases SHIPPED

## Performance Metrics

**Velocity:**
- Total plans completed: 92 (across 37 phases in 7 shipped milestones + v1.7 phases 06-09 + v1.8 phases 11-16)
- 8 milestones shipped in 30 days (2026-01-31 to 2026-03-01)
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
- [Phase 13-payment-webhook-service-worker]: Cache version bumped from pianomaster-v5 to pianomaster-v6 — forces cache refresh for all PWA users on monetization deploy
- [Phase 13-payment-webhook-service-worker]: isRestApiEndpoint() added to sw.js — REST API responses never cached, prevents stale subscription data; mirrors auth endpoint exclusion pattern
- [Phase 13-payment-webhook-service-worker]: Offline 503 for REST API fallback — React layer (SubscriptionContext/React Query in-memory) handles graceful offline UX, not service worker
- [Phase 13-payment-webhook-service-worker]: Unknown student_id returns HTTP 200 (not 400/500) — LS retries can't fix missing student_id; 200 stops wasteful retries
- [Phase 13-payment-webhook-service-worker]: verifySignature.ts imports timingSafeEqual from pinned deno.land/std@0.224.0 — avoids version ambiguity
- [Phase 13-payment-webhook-service-worker]: upsertSubscription takes injected supabase client (not createClient internally) — enables testability without Deno runtime
- [Phase 13-payment-webhook-service-worker]: plan_id left NULL in parent_subscriptions upsert — Phase 16 will map ls_variant_id to plan_id
- [Phase 14-subscription-context-service-layer]: vi.hoisted() used for Vitest mock variables — vi.mock factory hoisted before const declarations
- [Phase 14-subscription-context-service-layer]: Toast shown only in useEffect watching query data, not in Realtime callback — prevents duplicate toasts on reconnect
- [Phase 14-subscription-context-service-layer]: staleTime: 0 with refetchOnWindowFocus: false — Realtime push handles isPremium freshness; polling is redundant
- [Phase 14-subscription-context-service-layer]: maybeSingle() used in subscriptionService: unsubscribed students have no parent_subscriptions row; single() would throw
- [Phase 15-trail-content-gating-ui]: subscriptionConfig.js uses explicit static node ID lists — prevents accidental paywall expansion if unit files grow
- [Phase 15-trail-content-gating-ui]: premiumLockedNodeIds computed once at TrailMap level via useMemo — single subscription check, no per-node hook calls
- [Phase 15-trail-content-gating-ui]: isPremium defaults to false during loading → non-free nodes show gold (no flash of unlocked content)
- [Phase 15-trail-content-gating-ui]: premium_locked is highest priority in nodeState useMemo — subscription gate overrides prerequisite-locked state
- [Phase 15-trail-content-gating-ui]: isPremiumLocked defaults to false in TrailNodeModal — safe default, wrong direction fails open to normal modal
- [Phase 15-trail-content-gating-ui]: getNextRecommendedNode isPremium defaults to false — free-tier filter is always active unless explicitly unlocked
- [Phase 15-trail-content-gating-ui]: isPremium included in Dashboard queryKey — React Query re-fetches automatically when subscription flips, no manual invalidation needed
- [Phase 16]: create-checkout uses service role client for plan lookup (RLS: subscription_plans_select_public = USING(true)) — consistent with webhook pattern
- [Phase 16]: cancel-subscription returns endsAt with fallback to current_period_end from DB if LS DELETE response lacks ends_at field — prevents null return to client for optimistic UI
- [Phase 16]: verify_jwt = true in config.toml for create-checkout and cancel-subscription + manual auth.getUser() check — defense-in-depth per security guidelines
- [Phase 16]: upsertSubscription.ts plan_id lookup: maybeSingle() + plan?.id ?? null — null fallback if no matching plan found for unknown variant IDs
- [Phase 16]: Option B chosen for App.jsx: /subscribe and /subscribe/success only; /parent-portal deferred to Plan 03 to avoid forward-reference build error
- [Phase 16]: lemonSetupRef (useRef) guards LemonSqueezy.Setup() against StrictMode double-invocation in SubscribePage
- [Phase 16-03]: ParentPortalPage staleTime:0 for subscription-detail — matches SubscriptionContext, never shows stale data
- [Phase 16-03]: Optimistic cancel state via setOptimisticCancel merges on fetched detail — avoids refetch delay while keeping real data as source of truth
- [Phase 16-03]: AppSettings Subscription section defaultOpen:true — high-priority info for parents visiting settings
- [Phase 16-03]: TrailNodeModal paywall: Got it (gray secondary) + Ask a parent (amber primary) — reverses priority to nudge upgrade without removing dismiss
- [Phase 09-ios-safari-hardening]: onstatechange wired in mount-time useEffect so setIsInterrupted is in scope (not ref initializer block)
- [Phase 09-ios-safari-hardening]: handleTapToResume calls ctx.resume() synchronously before any await - satisfies iOS user-gesture requirement (IOS-02)
- [Phase 09-ios-safari-hardening]: AudioInterruptedOverlay uses bg-black/30 (calmer than MicErrorOverlay bg-black/50) - interruptions are less alarming than errors

### Pending Todos

- Review engagement research for v1.9+ milestone planning (see `.planning/research/ENGAGEMENT_RETENTION.md`)
- Trail content expansion needs scoping: 5 new sections (~85 nodes) identified, requires content authoring effort estimate

### Blockers/Concerns

**Outstanding items (non-blocking, pre-existing):**
- RESOLVED: Pre-existing test failure: SightReadingGame.micRestart.test.jsx — fixed in Phase 06 Plan 01
- Pre-existing lint: 24 errors, 415 warnings (all pre-v1.4)
- syncPracticeSessions() stub in sw.js (zero runtime impact)

**v1.7 Phase 10 gate:**
- PERF-02 and PERF-03 are conditional on PERF-01 profiling result — if no frame drop observed, Phase 10 closes with only PERF-01 delivered

## Session Continuity

Last session: 2026-03-03
Stopped at: Phase 09 iOS Safari Hardening COMPLETE (both plans shipped, verification done). v1.8 fully shipped (all 6 phases).

**Next action:**
- v1.7 Phase 10: Performance profiling on mid-range Android (profiling-gated — may close quickly if no issues found)
- v1.7 open items: Phase 07 needs human verification (real piano testing), Phase 08 UAT blocker (count-in stall) needs investigation
- After v1.7: Review engagement research for v1.9 milestone planning (see `.planning/research/ENGAGEMENT_RETENTION.md`)

---
*State initialized: 2026-01-31*
*Last updated: 2026-03-04 — State corrected: v1.8 marked shipped, all phase statuses synchronized with actual completion*
