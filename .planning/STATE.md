---
gsd_state_version: 1.0
milestone: v1.9
milestone_name: Engagement & Retention
status: completed
stopped_at: Completed 23-03-PLAN.md
last_updated: "2026-03-06T21:15:38.674Z"
last_activity: 2026-03-06 — Phase 23 Plan 03 (level badge refactor, Fireflies AccessibilityContext)
progress:
  total_phases: 24
  completed_phases: 20
  total_plans: 55
  completed_plans: 51
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Phase 23 Kid-Friendly Dashboard Redesign — all 3 plans complete

## Current Position

Phase: 23 (Kid-Friendly Dashboard Redesign)
Plan: 03 of 03 (complete)
Status: Phase 23 complete — gap closure: level badge pill layout + Fireflies a11y
Last activity: 2026-03-06 — Phase 23 Plan 03 (level badge refactor, Fireflies AccessibilityContext)

```
v1.9 Progress: [######----] 60% (3/5 phases)
Phase 17 █ Phase 18 █ Phase 19 █ Phase 20 ░ Phase 21 ░
```

## Performance Metrics

**Velocity:**
- Total plans completed: 94 (1 skipped: Plan 10-02 AudioWorklet, profiling gate PASS)
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
| Phase 17 P01 | 2 | 2 tasks | 3 files |
| Phase 17 P02 | 4 | 2 tasks | 9 files |
| Phase 18 P01 | 3m 11s | 2 tasks | 2 files |
| Phase 18 P02 | 3m 46s | 2 tasks | 7 files |
| Phase 18-streak-protection P03 | 15 | 2 tasks | 6 files |
| Phase 19 P01 | 6m | 2 tasks | 5 files |
| Phase 19 P02 | 8m | 2 tasks | 2 files |

**Phase 23 execution:**
| Phase-Plan | Duration | Tasks | Files | Date |
|------------|----------|-------|-------|------|
| 23-01 | 3m | 2 tasks | 3 files | 2026-03-06 |
| Phase 23 P03 | 2 | 2 tasks | 2 files |

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

**v1.9 context (known before planning):**
- Push notifications require a separate COPPA consent flow from the existing parental consent email — do not reuse or merge with account verification
- NOTIF-03 (1/day max) must be enforced server-side (Edge Function or cron), not just client-side
- Streak logic lives in the dashboard and streak service — STRK-03 (36-hour grace) changes the streak evaluation logic, not just display
- STRK-01 streak freeze is a consumable item — needs a new column or table for inventory
- Notes Recognition game component: src/components/games/notes-master-games/NotesRecognitionGame.jsx — add combo/lives/speed bonus without breaking existing trail session flow or exercise_progress saving
- PROG-01/02/03: extend src/utils/xpSystem.js XP_LEVELS array (currently 15 entries) — level-up celebration modal in VictoryScreen and Dashboard must handle new tiers
- PROG-07 parent email: use existing Brevo Edge Function pattern from v1.1 (consent email) — weekly cron trigger, same branding
- [Phase 17]: verify_jwt = false for send-daily-push; security via x-cron-secret header checked inside function — pg_cron sends no JWT
- [Phase 17]: Single Edge Function file (no lib/ subdirectory) — linear logic, splitting adds indirection without benefit
- [Phase 17]: UNIQUE constraint on student_id in push_subscriptions — one subscription per student; Plan 02 upserts on re-subscribe
- [Phase 17]: Expired subscription (410 Gone) sets subscription = null AND is_enabled = false — prevents retry loop; client must re-subscribe
- [Phase 17]: consent_skip state: parent_consent_granted=true but is_enabled=false allows re-enable without math gate — consent is permanent once granted
- [Phase 17]: PushOptInCard DISMISSED_KEY not user-scoped — per-device UX nudge, different users dismiss independently
- [Phase 18]: Column on current_streak (not new table) for freeze inventory — avoids joins and matches existing upsert pattern
- [Phase 18]: All streak logic in JS service layer — no new Postgres functions, consistent with existing patterns and testable without DB
- [Phase 18]: getStreakState() fetches current_streak + last_practiced_date in parallel with Promise.all — minimizes latency for UI consumers
- [Phase 18]: StreakDisplay switches from getStreak() to getStreakState() — single query gets all state for UI consumption
- [Phase 18]: comebackMultiplier defaults to 1 in calculateSessionXP — zero breaking change to existing callers
- [Phase 18]: VictoryScreen fetches streak-state independently via useQuery — can't rely on parent data in isolated mount
- [Phase 18-streak-protection]: Phase 18-03: ParentGateMath reused for weekend pass — parent_consent_granted on push_subscriptions serves dual COPPA purpose
- [Phase 18-streak-protection]: Phase 18-03: Shield terminology replaces Freeze in UI/i18n for child-friendliness; internal code keeps freeze for DB consistency
- [Phase 18-streak-protection]: Phase 18-03: StreakDisplay text colors changed from -500 to -300/-400 variants for glassmorphism dark-bg readability
- [Phase 19]: COMBO_TIERS constants at module level to avoid useCallback dep churn in NotesRecognitionGame
- [Phase 19]: scoreOverride in useGameProgress.handleAnswer defaults to +10 — backward compatible with all other game modes
- [Phase 19]: isGameEndingRef.current=true set immediately on livesRef<=0 inside handleAnswerSelect to prevent next-note flash before 50ms timeout
- [Phase 19-02]: playFireSound uses standalone Web Audio oscillator (not useSounds) — avoids mutual-pause conflict with game sounds
- [Phase 19-02]: isOnFireRef mirrors isOnFire state for stale-closure-safe reads inside handleAnswerSelect
- [Phase 19-02]: sessionExtraNotesRef read inside getRandomNote (avoids stale closure), sessionExtraNotes state in availableNotes useMemo (triggers re-render)
- [Phase 19-02]: getNextPedagogicalNote searches up to 10 subsequent nodes — adjacent nodes often share notePool
- [Phase 19-02]: On-fire glow 28%/14% opacity with h-2.5 particles — original 12%/6% too pale against purple gradient
- [Phase 19-02]: Dual reduced-motion check: framer-motion useReducedMotion (OS) AND AccessibilityContext.reducedMotion (app)

**Phase 23 decisions:**
- [Phase 23-01]: XPRing uses SVG foreignObject for GoldStar center placement inside SVG
- [Phase 23-01]: PlayNextButton injects CSS @keyframes via inline style tag for glow animation — component-specific, avoids Tailwind config changes
- [Phase 23-01]: UnifiedStatsCard gradient border uses wrapper div with p-[2px] and bg-gradient-to-r — better rounded corner support than border-image
- [Phase 23-01]: UnifiedStatsCard conditionally wraps in motion.div only when reducedMotion is false — avoids unnecessary wrapper
- [Phase 23]: Level pill uses i18n key dashboard.header.level with uppercase tracking-wider for LEVEL X display
- [Phase 23]: Fireflies renders plain div (not motion.div) when reducedMotion is true to eliminate animation loop entirely
- [Phase 23]: Shared fireflyStyle/fireflyClassName helpers extracted to avoid duplication between static and animated branches

### Roadmap Evolution

- Phase 23 added: Kid-Friendly Dashboard Redesign

### Pending Todos

- /gsd:plan-phase 20 — Extended Progression System (PROG-01 through PROG-07)

### Blockers/Concerns

**Outstanding items (non-blocking, pre-existing):**
- Pre-existing lint: 24 errors, 415 warnings (all pre-v1.4)
- syncPracticeSessions() stub in sw.js (zero runtime impact)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Fix Sight Reading feedback panel spacing and width to match notation card | 2026-03-06 | 54a19b4 | [1-fix-sight-reading-feedback-panel-spacing](./quick/1-fix-sight-reading-feedback-panel-spacing/) |

## Session Continuity

Last session: 2026-03-06T21:10:34.329Z
Stopped at: Completed 23-03-PLAN.md

**Next action:**
- Execute Phase 23 Plan 02 — Dashboard.jsx rewrite to integrate new sub-components

---
*State initialized: 2026-01-31*
*Last updated: 2026-03-06 — Phase 23 Plan 01 complete (dashboard sub-components)*
