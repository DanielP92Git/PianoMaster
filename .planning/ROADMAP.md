# Roadmap: PianoApp

## Milestones

- ✅ **v1.0 Security Hardening** — Phases 1-4 (shipped 2026-02-01)
- ✅ **v1.1 Parental Consent Email Service** — Phase 5 (shipped 2026-02-02)
- ✅ **v1.2 Trail System Stabilization** — Phases 6-7 (shipped 2026-02-03)
- ✅ **v1.3 Trail System Redesign** — Phases 8-12 (shipped 2026-02-05)
- ✅ **v1.4 UI Polish & Celebrations** — Phases 13-18 (shipped 2026-02-09)
- ✅ **v1.5 Trail Page Visual Redesign** — Phases 19-22 (shipped 2026-02-12)
- ✅ **v1.6 Auto-Rotate Landscape for Games** — Phases 01-05 (shipped 2026-02-17)
- 🚧 **v1.7 Mic Pitch Detection Overhaul** — Phases 06-10 (in progress)
- ✅ **v1.8 App Monetization** — Phases 11-16 (shipped 2026-03-01)
- 💡 **v1.9 Engagement & Retention** — Not yet scoped (research complete)

See `.planning/milestones/` for archived details of each milestone.
See `.planning/research/ENGAGEMENT_RETENTION.md` for v1.9 research findings.

## Phases

<details>
<summary>✅ v1.0 Security Hardening (Phases 1-4) — SHIPPED 2026-02-01</summary>

- [x] Phase 1: Authorization Hardening (4/4 plans) — completed 2026-02-01
- [x] Phase 2: COPPA Compliance Foundation (4/4 plans) — completed 2026-02-01
- [x] Phase 3: Production Safeguards (4/4 plans) — completed 2026-02-01
- [x] Phase 4: Privacy Foundation (3/3 plans) — completed 2026-02-01

</details>

<details>
<summary>✅ v1.1 Parental Consent Email Service (Phase 5) — SHIPPED 2026-02-02</summary>

- [x] Phase 5: Consent Email Service (2/2 plans) — completed 2026-02-02

</details>

<details>
<summary>✅ v1.2 Trail System Stabilization (Phases 6-7) — SHIPPED 2026-02-03</summary>

- [x] Phase 6: Trail Commitment (2/2 plans) — completed 2026-02-03
- [x] Phase 7: Tech Debt Cleanup (2/2 plans) — completed 2026-02-03

</details>

<details>
<summary>✅ v1.3 Trail System Redesign (Phases 8-12) — SHIPPED 2026-02-05</summary>

- [x] Phase 8: Validation Infrastructure (3/3 plans) — completed 2026-02-05
- [x] Phase 9: Bass Clef Redesign (3/3 plans) — completed 2026-02-05
- [x] Phase 10: Rhythm Redesign (4/4 plans) — completed 2026-02-05
- [x] Phase 11: Trail System Integration (3/3 plans) — completed 2026-02-05
- [x] Phase 12: E2E Verification (1/1 plan) — completed 2026-02-05

</details>

<details>
<summary>✅ v1.4 UI Polish & Celebrations (Phases 13-18) — SHIPPED 2026-02-09</summary>

- [x] Phase 13: Celebration Foundation & Accessibility (2/2 plans) — completed 2026-02-05
- [x] Phase 14: Node Type Visual Distinction (2/2 plans) — completed 2026-02-08
- [x] Phase 15: VictoryScreen Celebration System (3/3 plans) — completed 2026-02-09
- [x] Phase 16: Dashboard XP Prominence (2/2 plans) — completed 2026-02-09
- [x] Phase 17: Boss Unlock Celebrations (2/2 plans) — completed 2026-02-09
- [x] Phase 18: Code Cleanup (2/2 plans) — completed 2026-02-09

</details>

<details>
<summary>✅ v1.5 Trail Page Visual Redesign (Phases 19-22) — SHIPPED 2026-02-12</summary>

- [x] Phase 19: CSS Foundation & Font Setup (2/2 plans) — completed 2026-02-10
- [x] Phase 20: Component Integration & Tab Navigation (3/3 plans) — completed 2026-02-10
- [x] Phase 21: Responsive Layout Rewrite (3/3 plans) — completed 2026-02-11
- [x] Phase 22: Performance Optimization & Deployment (2/2 plans) — completed 2026-02-11

</details>

<details>
<summary>✅ v1.6 Auto-Rotate Landscape for Games (Phases 01-05) — SHIPPED 2026-02-17</summary>

- [x] Phase 01: Hebrew Translations (2/2 plans) — completed 2026-02-13
- [x] Phase 02: Foundation - Orientation Detection & Prompt (2/2 plans) — completed 2026-02-13
- [x] Phase 03: Game Layout Optimization (3/3 plans) — completed 2026-02-15
- [x] Phase 04: Platform-Specific Android Enhancement (2/2 plans) — completed 2026-02-16
- [x] Phase 05: Accessibility & Internationalization (1/1 plan) — completed 2026-02-16

</details>

### v1.7 Mic Pitch Detection Overhaul (In Progress)

**Milestone Goal:** Refactor the pitch detection pipeline for pro-level accuracy across all game modes that use mic input — eliminating wrong notes, missed notes, and latency on all note durations from quarter through sixteenth.

- [x] **Phase 06: Bug Fix Prerequisite** - Fix mic-restart regression so the test suite is a reliable baseline for all subsequent work (completed 2026-02-17)
- [x] **Phase 07: Audio Architecture and Core Algorithm** - Replace naive autocorrelation with McLeod Pitch Method, consolidate three AudioContext instances into one shared provider, and fix audio chain configuration (completed 2026-02-17, human verification needed)
- [x] **Phase 08: Detection Pipeline** - Implement dynamic timing, formal state machine, full frequency map, and game-layer debouncing so all note durations and tempos are detected reliably (completed 2026-02-22, UAT blocker: count-in stall)
- [x] **Phase 09: iOS Safari Hardening** - Handle interrupted AudioContext state, synchronous gesture requirement, visibility recovery, and denied-permission messaging for reliable mic input on iOS (completed 2026-03-03)
- [x] **Phase 10: Performance (Profiling-Gated)** - Profile audio processing on mid-range Android; migrate to AudioWorklet only if profiling shows measurable frame drop (completed 2026-03-04)

<details>
<summary>✅ v1.8 App Monetization (Phases 11-16) — SHIPPED 2026-03-01</summary>

- [x] Phase 11: Legal, Gate Design, and Processor Setup (3/3 plans) — completed 2026-02-26
- [x] Phase 12: Database Schema and RLS (2/2 plans) — completed 2026-02-26
- [x] Phase 13: Payment Webhook and Service Worker (2/2 plans) — completed 2026-02-26
- [x] Phase 14: Subscription Context and Service Layer (1/1 plan) — completed 2026-02-28
- [x] Phase 15: Trail Content Gating UI (2/2 plans) — completed 2026-03-01
- [x] Phase 16: Parent-Facing Pages and Checkout (3/3 plans) — completed 2026-03-01

</details>

## Phase Details

### Phase 06: Bug Fix Prerequisite
**Goal**: The mic-restart flow works correctly on second attempt and the test suite provides a reliable baseline for all subsequent v1.7 work
**Depends on**: Phase 05 (v1.6 complete)
**Requirements**: FIX-01, FIX-02
**Success Criteria** (what must be TRUE):
  1. Tapping "Try Again" after a failed mic attempt successfully reactivates the mic — the game does not silently stay stuck with no audio input
  2. SightReadingGame.micRestart.test.jsx passes in CI — the pre-existing test failure is resolved
  3. The mic listening guard uses a synchronous ref so rapid start/stop sequences do not race
**Plans**: 2 plans
- [x] 06-01-PLAN.md -- Fix test infrastructure, runtime mic-restart bug, and sync ref guard
- [x] 06-02-PLAN.md -- Build MicErrorOverlay component with i18n and integrate into SightReadingGame

### Phase 07: Audio Architecture and Core Algorithm
**Goal**: Piano notes are identified at the correct pitch without octave errors, all three AudioContext instances are unified into one shared provider, and the audio chain is configured to pass the raw piano signal without browser DSP corruption
**Depends on**: Phase 06
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, AUDIO-01, AUDIO-02, AUDIO-03, ALGO-01, ALGO-02, ALGO-03
**Success Criteria** (what must be TRUE):
  1. Playing a C4 on the piano registers as C4 in the game — not C3 or C5 — across quarter through sixteenth note durations
  2. All three game modes (sight reading, notes recognition, any other mic-enabled game) share one AudioContext — the browser console shows no "too many AudioContext" warnings
  3. Detection latency for a quarter note is perceptibly faster compared to before (smoothing eliminated, fftSize increased for bass resolution)
  4. Notes below E4 (bass clef notes including B2, A2) are classified correctly — bass trail nodes detect the right note
  5. Only notes with sufficient clarity reach the game scoring layer — random background noise does not trigger false note registrations
**Plans**: 5 plans
- [x] 07-01-PLAN.md -- Install pitchy, create AudioContextProvider, wrap game routes
- [x] 07-02-PLAN.md -- Replace autocorrelation with McLeod Pitch Method (pitchy) in usePitchDetection
- [x] 07-03-PLAN.md -- Refactor useAudioEngine for shared context, update useMicNoteInput passthrough
- [x] 07-04-PLAN.md -- Remove NotesRecognitionGame inline detection, replace with useMicNoteInput
- [x] 07-05-PLAN.md -- Gap closure: Wire SightReadingGame and MetronomeTrainer to shared AudioContext

### Phase 08: Detection Pipeline
**Goal**: All note durations from quarter through sixteenth are detected reliably at 60-120 BPM — onset and note-off timing scale dynamically with the playing tempo and duration, the detection state machine prevents pitch flicker, and the game scoring layer never double-scores one played note
**Depends on**: Phase 07
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06
**Success Criteria** (what must be TRUE):
  1. Playing eighth notes at 120 BPM registers each note individually — notes are not merged or skipped due to fixed timing windows
  2. Playing quarter notes at 60 BPM registers each note cleanly — long notes do not trigger multiple scoring events for a single physical key press
  3. Rapid alternation between two adjacent notes (e.g., C4 then D4) registers both correctly — pitch flicker at the note boundary does not produce phantom detections
  4. Bass clef trail nodes (including nodes requiring B2 and A2) detect all required notes — the frequency map covers the full trail note pool
  5. BPM and note duration context flows from the game settings into the detection hooks without requiring manual wiring in each game component
**Plans**: 2 plans
- [x] 08-01-PLAN.md -- BPM-adaptive timing utility, FSM refactor of useMicNoteInput, MIN_MIDI fix for bass notes
- [x] 08-02-PLAN.md -- Wire BPM timing into game components + per-note scoring dedup

### Phase 09: iOS Safari Hardening
**Goal**: Mic input works reliably in Safari PWA on physical iOS devices — the app recovers from AudioContext interruption caused by phone calls, app switches, and device lock; permission denial shows a clear message with recovery instructions
**Depends on**: Phase 08
**Requirements**: IOS-01, IOS-02, IOS-03, IOS-04
**Success Criteria** (what must be TRUE):
  1. Receiving a phone call mid-game and then returning to the app resumes mic detection without requiring a page reload on iOS Safari
  2. Switching to another app and back (e.g., checking a message) resumes mic detection correctly on iOS Safari
  3. Starting a mic-enabled game responds correctly on first tap — the AudioContext does not stay permanently suspended on iOS Safari
  4. Denying mic permission shows a persistent, parent-readable error message with instructions for re-enabling in iOS Settings — the app does not silently stop working with no explanation
**Plans**: 2 plans
- [x] 09-01-PLAN.md -- isIOSSafari utility, AudioContextProvider interruption detection, AudioInterruptedOverlay component, i18n keys
- [x] 09-02-PLAN.md -- Wire overlay into game components, Start button resume(), trail gesture gate, MicErrorOverlay iOS instructions

### Phase 10: Performance (Profiling-Gated)
**Goal**: Audio processing does not cause measurable frame drop on mid-range Android devices; if profiling reveals a problem, pitch detection is moved off the main thread via AudioWorklet
**Depends on**: Phase 09
**Requirements**: PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. A Chrome DevTools CPU profile from a mid-range Android device (2019-era class) is collected and reviewed — the decision to build AudioWorklet is data-driven, not speculative
  2. If profiling shows audio processing causes more than 5% frame drop: pitch detection runs in an AudioWorklet and the main thread frame rate is measurably improved during active mic detection
  3. If AudioWorklet is built: bass clef notes (below E4) are detected correctly — the ring buffer accumulates 128-frame quanta to at least 2048 samples before running detection
**Plans**: 2 plans
- [ ] 10-01-PLAN.md — Profiling instrumentation, Android device CPU profile, pass/fail decision (PERF-01)
- [ ] 10-02-PLAN.md — AudioWorklet migration with ring buffer (PERF-02, PERF-03) — conditional on Plan 01 FAIL result

### Phase 11: Legal, Gate Design, and Processor Setup
**Goal**: All pre-code decisions are locked — payment processor is selected and verified for Israel support, the free tier boundary is validated against actual unit files, the parental consent email names the payment processor, and no child PII flows to the billing system
**Depends on**: Phase 10 (v1.7 complete) or parallel with v1.7 wrap-up
**Requirements**: PAY-01, COMP-03, COMP-04
**Status**: Complete
**Success Criteria** (what must be TRUE):
  1. Payment processor account is registered with sandbox active and payout path to an Israeli bank confirmed
  2. The parental consent email shown to parents names the payment processor explicitly
  3. No child personal data (name, age, grade) is included in any payment processor API call — only the parent's email address is transmitted
  4. The free tier boundary (Unit 1 per path) is verified against unit files — the exact count of free nodes is documented
**Plans**: 3 plans
- [x] 11-01-PLAN.md -- Subscription config and consent modal
- [x] 11-02-PLAN.md -- Processor placeholder (TBD documented)
- [x] 11-03-PLAN.md -- Lemon Squeezy processor confirmation

### Phase 12: Database Schema and RLS
**Goal**: The subscription database foundation exists — tables are created with correct RLS so the client can only read subscription state, all writes are restricted to the webhook service role, the pricing data is seeded, and the content gate is enforced at the database layer
**Depends on**: Phase 11
**Requirements**: SUB-01, SUB-02, SUB-03, SUB-04, GATE-03
**Status**: Complete
**Success Criteria** (what must be TRUE):
  1. A logged-in student calling the Supabase client directly cannot INSERT or UPDATE rows in `parent_subscriptions` — only the webhook service role key can write
  2. The `subscription_plans` table contains monthly and yearly rows for both ILS and USD
  3. `src/config/subscriptionConfig.js` exists with an `isFreeNode(node)` function
  4. A student who bypasses React's `isPremium` check and attempts to save a score on a premium node is blocked at the database level
**Plans**: 2 plans
- [x] 12-01-PLAN.md -- Database schema and RLS
- [x] 12-02-PLAN.md -- Content gate RLS

### Phase 13: Payment Webhook and Service Worker
**Goal**: Subscription lifecycle events from the payment processor are received, verified, and applied to the database — the webhook is idempotent and handles duplicate delivery, the service worker never caches subscription state, and the cache version is bumped for the monetization deploy
**Depends on**: Phase 12
**Requirements**: PAY-02, PAY-03, PAY-04, COMP-01, COMP-02
**Status**: Complete
**Success Criteria** (what must be TRUE):
  1. Sending a `subscription.created` test event via the payment processor's sandbox sets `status = 'active'` in `parent_subscriptions`
  2. Sending the same event twice produces one row in `parent_subscriptions`, not two — the webhook handler is idempotent
  3. A webhook request with an invalid or missing signature header returns a 400 error and no database write occurs
  4. Subscription status API responses are never served from the service worker cache
**Plans**: 2 plans
- [x] 13-01-PLAN.md -- Webhook Edge Function with signature verification, payload extraction, UPSERT idempotency, and Vitest tests
- [x] 13-02-PLAN.md -- Service worker REST API cache exclusion, cache version bump, and DEPLOY.md checklist

### Phase 14: Subscription Context and Service Layer
**Goal**: React components can read subscription status globally — `SubscriptionContext` provides `isPremium` with staleTime: 0, a Supabase Realtime channel invalidates the query the moment the webhook writes an update
**Depends on**: Phase 13
**Requirements**: SVC-01, SVC-02, SVC-03
**Status**: Complete
**Success Criteria** (what must be TRUE):
  1. Any component can call `useSubscription()` and receive the current `isPremium` boolean — no prop drilling
  2. After a parent completes checkout and the webhook delivers, the child's trail view unlocks within seconds without refreshing
  3. Opening the app after a period offline and reconnecting re-fetches subscription status immediately
**Plans**: 1 plan
- [x] 14-01-PLAN.md -- subscriptionService, SubscriptionContext with Realtime, App.jsx wiring, and unit tests

### Phase 15: Trail Content Gating UI
**Goal**: Students see a clearly gated trail where subscription-locked nodes look different from prerequisite-locked nodes, and tapping a locked premium node shows a child-appropriate message with no pricing
**Depends on**: Phase 14
**Requirements**: GATE-01, GATE-02, CHILD-01, CHILD-02
**Status**: Complete
**Success Criteria** (what must be TRUE):
  1. A student on a free account sees nodes beyond Unit 1 with a distinct gold lock overlay — visually different from the gray prerequisite lock
  2. Tapping a subscription-locked node shows a modal with no prices, no "buy" buttons, no payment form — only a friendly message
  3. No navigation path reachable by a student leads to a pricing page or payment interface
  4. A student with an active subscription sees all trail nodes as available (subject to prerequisite unlock)
**Plans**: 2 plans
- [x] 15-01-PLAN.md -- Subscription config, premium node detection, TrailNode gold lock overlay, TrailNodeModal paywall
- [x] 15-02-PLAN.md -- Dashboard gating, getNextRecommendedNode premium filter, i18n

### Phase 16: Parent-Facing Pages and Checkout
**Goal**: A parent can view pricing in their local currency, initiate checkout via the payment processor without leaving the PWA, confirm activation, and cancel within the app
**Depends on**: Phase 15
**Requirements**: PARENT-01, PARENT-02, PARENT-03, PARENT-04, PARENT-05
**Status**: Complete
**Success Criteria** (what must be TRUE):
  1. A parent visiting `/subscribe` sees prices in ILS or USD based on their account association
  2. Clicking a plan opens the payment processor's checkout — payment completes without leaving the PWA
  3. After checkout, the success page confirms subscription activation (polls up to 10 seconds for webhook)
  4. A parent can cancel from `/parent-portal` without leaving the PWA
  5. After cancellation, the child retains access until the current billing period ends
**Plans**: 3 plans
- [x] 16-01-PLAN.md -- SubscribePage with Lemon Squeezy checkout overlay
- [x] 16-02-PLAN.md -- SubscribeSuccessPage with webhook polling, App.jsx routes
- [x] 16-03-PLAN.md -- ParentPortalPage with cancel flow, TrailNodeModal paywall upgrade, AppSettings subscription section

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Authorization Hardening | v1.0 | 4/4 | Complete | 2026-02-01 |
| 2. COPPA Compliance Foundation | v1.0 | 4/4 | Complete | 2026-02-01 |
| 3. Production Safeguards | v1.0 | 4/4 | Complete | 2026-02-01 |
| 4. Privacy Foundation | v1.0 | 3/3 | Complete | 2026-02-01 |
| 5. Consent Email Service | v1.1 | 2/2 | Complete | 2026-02-02 |
| 6. Trail Commitment | v1.2 | 2/2 | Complete | 2026-02-03 |
| 7. Tech Debt Cleanup | v1.2 | 2/2 | Complete | 2026-02-03 |
| 8. Validation Infrastructure | v1.3 | 3/3 | Complete | 2026-02-05 |
| 9. Bass Clef Redesign | v1.3 | 3/3 | Complete | 2026-02-05 |
| 10. Rhythm Redesign | 1/2 | Complete    | 2026-03-04 | 2026-02-05 |
| 11. Trail System Integration | v1.3 | 3/3 | Complete | 2026-02-05 |
| 12. E2E Verification | v1.3 | 1/1 | Complete | 2026-02-05 |
| 13. Celebration Foundation & Accessibility | v1.4 | 2/2 | Complete | 2026-02-05 |
| 14. Node Type Visual Distinction | v1.4 | 2/2 | Complete | 2026-02-08 |
| 15. VictoryScreen Celebration System | v1.4 | 3/3 | Complete | 2026-02-09 |
| 16. Dashboard XP Prominence | v1.4 | 2/2 | Complete | 2026-02-09 |
| 17. Boss Unlock Celebrations | v1.4 | 2/2 | Complete | 2026-02-09 |
| 18. Code Cleanup | v1.4 | 2/2 | Complete | 2026-02-09 |
| 19. CSS Foundation & Font Setup | v1.5 | 2/2 | Complete | 2026-02-10 |
| 20. Component Integration & Tab Navigation | v1.5 | 3/3 | Complete | 2026-02-10 |
| 21. Responsive Layout Rewrite | v1.5 | 3/3 | Complete | 2026-02-11 |
| 22. Performance Optimization & Deployment | v1.5 | 2/2 | Complete | 2026-02-11 |
| 01. Hebrew Translations | v1.6 | 2/2 | Complete | 2026-02-13 |
| 02. Foundation - Orientation Detection & Prompt | v1.6 | 2/2 | Complete | 2026-02-13 |
| 03. Game Layout Optimization | v1.6 | 3/3 | Complete | 2026-02-15 |
| 04. Platform-Specific Android Enhancement | v1.6 | 2/2 | Complete | 2026-02-16 |
| 05. Accessibility & Internationalization | v1.6 | 1/1 | Complete | 2026-02-16 |
| 06. Bug Fix Prerequisite | v1.7 | 2/2 | Complete | 2026-02-17 |
| 07. Audio Architecture and Core Algorithm | v1.7 | 5/5 | Complete (human verification needed) | 2026-02-17 |
| 08. Detection Pipeline | v1.7 | 2/2 | Complete (UAT blocker: count-in stall) | 2026-02-22 |
| 09. iOS Safari Hardening | v1.7 | 2/2 | Complete | 2026-03-03 |
| 10. Performance (Profiling-Gated) | v1.7 | 0/2 | Not started | - |
| 11. Legal, Gate Design, and Processor Setup | v1.8 | 3/3 | Complete | 2026-02-26 |
| 12. Database Schema and RLS | v1.8 | 2/2 | Complete | 2026-02-26 |
| 13. Payment Webhook and Service Worker | v1.8 | 2/2 | Complete | 2026-02-26 |
| 14. Subscription Context and Service Layer | v1.8 | 1/1 | Complete | 2026-02-28 |
| 15. Trail Content Gating UI | v1.8 | 2/2 | Complete | 2026-03-01 |
| 16. Parent-Facing Pages and Checkout | v1.8 | 3/3 | Complete | 2026-03-01 |

**Total: 38 phases across 9 milestones (27 shipped in v1.0-v1.6, 4 of 5 v1.7 complete, 6 v1.8 shipped)**

---
*Last updated: 2026-03-04 — Phase 10 plans created (2 plans, Plan 02 conditional on Plan 01 profiling result)*
