# Project Milestones: PianoApp

## v2.8 Introductory Single-Note Game (Shipped: 2026-03-26)

**Phases completed:** 2 phases, 5 plans, 9 tasks

**Key accomplishments:**

- NOTE_CATCH exercise type wired end-to-end: constant, node data, TrailNodeModal routing, App.jsx route, i18n strings, and NoteSpeedCards stub with all pure functions tested (17/17 GREEN)
- Parent Zone added to desktop sidebar with ShieldCheck icon, ParentZoneEntryCard component created, and all 12 i18n keys added to en + he locales for the entire phase
- Gate-first ParentPortalPage with math gate on every visit, QuickStatsGrid 2x2 glass stats, and 4-section scrollable layout (Quick Stats, Practice Heatmap, Subscription Management, Parent Settings)
- Removed subscription section, streak/weekend-pass section, and NotificationPermissionCard from Settings; added ParentZoneEntryCard as mobile entry point to Parent Portal; eliminated all dead code from migrated features

---

## v2.7 Instrument Practice Tracking (Shipped: 2026-03-25)

**Delivered:** Daily instrument practice tracker with dedicated streak, push notification check-ins, parent calendar heatmap, and streak milestone celebrations — plus a signup flow redesign.

**Phases completed:** 1-5 (12 plans total)

**Key accomplishments:**

- Role-first signup wizard with 4-step student flow (role, birth-year, parent-email, credentials) and 2-step teacher flow, with back navigation and Google OAuth
- Daily instrument practice logging via dashboard card with FSM state (idle/logging/settled), dedicated practice streak counter, and 25 XP/day reward
- "Did you practice?" push notification check-in with priority branching in Edge Function, SW action buttons, iOS URL param fallback, and 1/day coordination
- 52-week practice calendar heatmap in parent portal with react-activity-calendar v3, emerald/gray binary coloring, RTL CSS mirror, and summary stats
- Practice streak milestone celebrations at 5/10/21/30 days with emerald-themed MilestoneCelebrationModal, confetti, auto-dismiss, and once-per-streak tracking

**Stats:**

- 185 files changed (+23,095 / -6,379)
- 5 phases, 12 plans, ~114 commits
- 3 days (2026-03-23 to 2026-03-25)
- 19/19 requirements satisfied, 0 gaps

**Tech debt carried:** syncPracticeSessions() stub in sw.js; showMonthLabels=false in RTL mode (PARENT-F02 deferred)

**What's next:** Next milestone planning via `/gsd:new-milestone`

---

## v2.6 User Feedback (Shipped: 2026-03-23)

**Delivered:** Parent-gated feedback form in Settings with COPPA-compliant anti-spam (honeypot, rate limiting, cooldown), Supabase Edge Function delivering plain-text email to dedicated support inbox via Brevo, and unified support Gmail sender for all transactional emails.

**Phases completed:** 16-17 (3 plans total)

**Key accomplishments:**

- send-feedback Edge Function with JWT auth, input validation (type enum + 10-1000 chars), DB rate limiting (3/hr per user), and Brevo plain-text delivery
- feedback_submissions table with INSERT-only RLS and service role COUNT for rate checks (message not stored in DB — COPPA-safe)
- Four-state FeedbackForm component (idle/gated/form/success) with ParentGateMath COPPA gate
- Honeypot anti-spam with silent rejection, 5-minute client cooldown timer, inline error banners for rate-limit/server/network errors
- Full EN/HE i18n (17 keys each) with RTL layout support
- Unified support Gmail sender for all transactional emails (consent, weekly report, account deletion, feedback)

**Stats:**

- 28 files changed (+4,737 / -57)
- 2 phases, 3 plans, 29 commits
- 2 days (2026-03-22 to 2026-03-23)
- 86,905 LOC JavaScript/JSX/CSS/JSON
- 15/15 requirements satisfied, 0 critical gaps
- 228 tests passing (17 new)

**Git range:** `843a5ed` to `328ef12`

**Tech debt carried:** Dead-code branch in FeedbackForm.jsx (unreachable data?.success check); SPAM-05 test label mismatch (tests min-length not cooldown)

**What's next:** Next milestone planning via `/gsd:new-milestone`

---

## v2.5 Launch Prep (Shipped: 2026-03-22)

**Delivered:** Build tooling fixes, ESLint zero-warning cleanup, COPPA hard-delete Edge Function for permanent account deletion after 30-day grace period, and 89-item production QA checklist execution.

**Phases completed:** 12-15 (11 plans total)

**Key accomplishments:**

- Fixed verify:patterns script (.js extension) and synchronized Supabase migration history
- All 574 ESLint warnings eliminated (config fixes, dead code removal, justified suppressions)
- COPPA hard-delete Edge Function: cron-triggered permanent deletion after 30-day grace, CASCADE across all tables, LS cancel, Brevo confirmation email, HMAC audit log
- 89-item production QA checklist executed, 3 blockers found and resolved (consent email, deletion UI, PWA offline)
- 20/20 requirements delivered, 11 plans across 4 phases

---

## v2.4 Content Expansion (Shipped: 2026-03-19)

**Delivered:** Extended the trail with 42 new nodes — 28 key signature nodes (14 treble + 14 bass covering G, D, A, F, Bb, Eb major) and 14 advanced rhythm nodes (6/8 compound meter + syncopation). Fixed 6/8 compound beat model and beam grouping. All nodes subscription-gated and fully translated EN/HE.

**Phases completed:** 07-11 (10 plans total)

**Key accomplishments:**

- VexFlow key signature glyph rendering with `stave.addKeySignature()` and `Accidental.applyAccidentals()` for in-key accidental suppression across all 4 rendering paths
- 28 key signature trail nodes across Units 6-7 for both treble and bass clefs (G, D, A, F, Bb, Eb major) with discovery scaffolding, memory mix-up, and boss challenges
- Fixed 6/8 compound beat model: `SIX_EIGHT.beats` changed from 6 to 2 with `subdivisions:6`, correct 3+3 beam grouping via `beamGroupsForTimeSignature` helper
- 14 advanced rhythm nodes across Units 7-8: 6/8 compound meter discovery and practice, 4/4 syncopation patterns, and dual-concept boss challenge (250 XP capstone)
- All 42 new nodes wired into trail via `expandedNodes.js`, default-deny subscription gate (no `FREE_NODE_IDS` additions), full EN/HE translations (28 node names, 8 unit names, 5 skills, 6 accessories)
- Compound-aware MetronomeTrainer: 4-beat count-in for 6/8, compound tap evaluation, 6 subdivision circles with beat 1/4 accents

**Stats:**

- 149 files changed (+19,969 / -1,567)
- 5 phases, 10 plans, 77 commits
- 2 days (2026-03-18 to 2026-03-19)
- 86,381 LOC JavaScript/JSX/CSS/JSON
- 26/26 requirements satisfied, 0 audit gaps

**Git range:** `e19debf` to `a8a4b09`

**Tech debt carried:** `verify:patterns` script broken (missing `.js` extension); Phase 10 files in wrong archive dir; Nyquist validation incomplete

**What's next:** Next milestone planning via `/gsd:new-milestone`

---

## v2.3 Launch Readiness (Shipped: 2026-03-17)

**Delivered:** Production readiness features: COPPA-compliant Privacy Policy and Terms of Service pages, all 23 ESLint errors fixed (0 remaining), React ErrorBoundary with Sentry integration, route-based code splitting (128 chunks), first-time onboarding tour (4 steps), and daily challenge system with bonus XP.

**Phases completed:** 01-06

**Key accomplishments:**

- Privacy Policy (`/privacy`) and Terms of Service (`/terms`) public pages with glassmorphism design, cross-linked from signup, settings, legal, and consent pages
- 23 ESLint errors resolved across 17 files (empty blocks, unescaped entities, conditional hooks, missing displayNames)
- React ErrorBoundary class component with kid-friendly fallback UI and Sentry.captureException
- Sentry error monitoring (production-only, COPPA-safe with sendDefaultPii: false) + source maps via @sentry/vite-plugin
- Route-based code splitting: 17+ page/game imports converted to React.lazy() with Suspense fallback
- 4-step onboarding tour for first-time students (Framer Motion, reduced-motion aware, localStorage persistence)
- Daily challenge system: DB table with RLS, deterministic date-seeded generation, DailyChallengeCard on dashboard, challenge mode in NotesRecognitionGame, bonus XP via VictoryScreen
- Full EN/HE i18n for all new features (privacy, legal, onboarding, dailyChallenge keys)

**Stats:**

- 44 files changed (+888 / -132), 10 new files
- 6 phases, 1 day (2026-03-17)
- 2 new npm dependencies (@sentry/react, @sentry/vite-plugin)
- 127 tests passing, 0 ESLint errors

**Git range:** `1c7a5e1` to (pending commit)

**What's next:** Next milestone planning via `/gsd:new-milestone`

---

## v2.2 Sharps & Flats (Shipped: 2026-03-17)

**Delivered:** Extended the trail with 36 new accidental nodes (18 treble + 18 bass) across sharps and flats for both clef paths, with bug fixes for accidental handling, MIDI enharmonic matching, full EN/HE i18n, subscription gating, and regex hardening.

**Phases completed:** 01-05 (9 plans total)

**Key accomplishments:**

- Fixed patternBuilder regex and ESM imports for accidental pitch handling in VexFlow sight reading
- Trail enableSharps/enableFlats flag derivation from notePool with auto-grow boundary guard preventing accidental injection into natural sessions
- 18 treble accidental nodes: F#4, C#4, G#4 sharps + Bb4, Eb4, Ab4, Db4 flats with accidentals boss challenge (15-note pool)
- 18 bass accidental nodes: F#3, C#3, G#3 sharps + Bb3, Eb3, Ab3, Db3 flats with accidentals master boss
- MIDI-based enharmonic matching in SightReadingGame anti-cheat and scoring + full EN/HE i18n with Unicode symbols and Hebrew solfege
- Anchored regex patterns at all 3 flat-detection sites preventing natural 'B' note from false flat detection

**Stats:**

- 66 files changed (+11,533 / -1,390)
- 5 phases, 9 plans
- 3 days (2026-03-15 to 2026-03-17)
- 77,199 LOC JavaScript/JSX/CSS

**Git range:** `0fb703b` to `8b8dd4d`

**What's next:** Next milestone planning via `/gsd:new-milestone`

---

## v2.1 Forgot Password Recovery (Shipped: 2026-03-10)

**Delivered:** Inline forgot password flow on the login page and a dedicated /reset-password page with Supabase PKCE password reset, anti-enumeration security, RTL support, and full EN/HE i18n.

**Phases completed:** 01 (2 plans total)

**Key accomplishments:**

- Supabase password reset API with anti-enumeration (generic error messages only)
- Three-state inline forgot password flow in LoginForm (login/forgotPassword/resetSent)
- Dedicated ResetPasswordPage with glass card UI, dual password fields, PKCE session detection
- Smart expired-link detection via URL hash param sniffing with 10s timeout fallback
- RTL-aware back arrow and 60-second cooldown timer
- Complete EN (23 keys) and HE (23 keys) translations

**Stats:**

- 11 files created/modified
- 675 lines added, 21 lines removed
- 1 phase, 2 plans
- 2 days (2026-03-09 to 2026-03-10)

**Git range:** `206ec97` to `b3d29d5`

**What's next:** Next milestone planning via `/gsd:new-milestone`

---

## v2.0 VictoryScreen & XP Unification (Shipped: 2026-03-08)

**Delivered:** Major refactor unifying the reward system from dual points/XP to XP-only across all views (student, teacher, database), and redesigning VictoryScreen with hook extraction and two-panel landscape layout.

**Phases completed:** 01-02 (6 plans total)

**Key accomplishments:**

- Extracted 792-line useVictoryState hook — VictoryScreen reduced from 1105 to 327 lines (70% reduction)
- Unified scoring from points to XP across all student and teacher views
- Free play XP via calculateFreePlayXP formula (10-50 XP range, less than trail nodes)
- Teacher analytics show "1,250 XP (Lv. 6)" format with calculateLevel()
- DB migration drops achievement_points, student_achievements.points, calculate_score_percentile
- Dead code removed: points.js, useTotalPoints.js, scoreComparisonService.js

**Stats:**

- 43 files created/modified
- 2,983 lines added, 1,531 lines removed
- 2 phases, 6 plans
- 1 day (2026-03-08)

**Git range:** `ed48905` to `7aaa7e3`

**What's next:** v2.1 Forgot Password Recovery

---

## v1.9 Engagement & Retention (Shipped: 2026-03-08)

**Delivered:** Daily return hooks, arcade-style game engagement, extended progression system, and kid-friendly UI redesign — push notifications with COPPA parent gate, streak protection with freeze shields and comeback bonus, combo/lives/speed mechanics for Notes Recognition, 30-level XP system with prestige tiers, weekly progress summaries with parent email reports, and visual redesign of TrailNodeModal and Dashboard for 8-year-old learners.

**Phases completed:** 17-23 (15 plans total)

**Key accomplishments:**

- COPPA-compliant push notifications with parent math gate, context-aware messages (streak/XP/goals), 1/day rate limit, service worker Web Push
- Streak protection: 36-hour grace window, consumable freeze shields (earned every 7-day streak), weekend pass toggle, 2x comeback XP bonus for 3 days
- Arcade-style Notes Recognition: combo counter with 2x/3x multipliers, speed bonus, 3-lives system, on-fire mode with glow/embers, auto-growing note pool
- Extended XP progression from 15 to 30 levels with prestige tiers (Maestro 1, 2, 3...), per-level themed names, golden prestige badge
- Weekly progress summaries, personal best badges on VictoryScreen, 12 rotating daily fun facts, parent weekly email via Brevo with HMAC unsubscribe
- Kid-friendly TrailNodeModal (centered glowing icon, 3D bubble note badges, golden XP card) and Dashboard (compact hero, XP ring, unified stats card, circular practice tools)

**Stats:**

- 124 files created/modified
- 15,188 lines added, 4,582 lines removed
- 7 phases, 15 plans
- 4 days (2026-03-04 to 2026-03-08)

**Git range:** `329642d` to `abc66d7`

**What's next:** v2.0 VictoryScreen & XP Unification

---

## v1.5 Trail Page Visual Redesign (Shipped: 2026-02-12)

**Delivered:** Immersive enchanted forest trail page with CSS-only backgrounds, 3D glowing nodes, responsive zigzag layout, tab-based path switching, glass-morphism cards, and WCAG 2.2 AA accessibility compliance. Pure UI redesign with zero database changes.

**Phases completed:** 19-22 (10 plans total)

**Key accomplishments:**

- Enchanted forest CSS-only background with starfield animation, glow orbs, and Quicksand font integration
- 3D node buttons with radial gradients, state-based glow effects (cyan active, green completed, dark locked), and press animations
- Tab-based path switching (Treble/Bass/Rhythm) with URL query param persistence and ARIA keyboard navigation
- Responsive zigzag trail layout with SVG Bezier S-curve path connectors and glass-morphism unit progress cards
- Trail header redesign with shield level badge, XP progress bar, and Free Practice navigation
- WCAG 2.2 AA compliance: 48px touch targets, RTL mirroring for Hebrew, focus-visible indicators, service worker cache v4

**Stats:**

- 45 files created/modified
- 8,015 lines added, 605 lines removed
- 4 phases, 10 plans
- 3 days (2026-02-10 to 2026-02-12)

**Git range:** `cfab76e` to `49d7e44`

**What's next:** Next milestone planning via `/gsd:new-milestone`

---

## v1.4 UI Polish & Celebrations (Shipped: 2026-02-09)

**Delivered:** Rewarding celebration system for the 93-node trail with tiered VictoryScreen celebrations, boss unlock 3-stage modals, node type visual distinction with 8 unique icons, dashboard XP prominence with level-up animations, and codebase cleanup removing 37 dead files.

**Phases completed:** 13-18 (13 plans total)

**Key accomplishments:**

- Accessibility-first celebration foundation with reducedMotion support and skippable animations
- Node type visual distinction system with 8 unique icons, colorblind-safe palette, and custom musical SVGs
- Tiered VictoryScreen celebrations (minimal/standard/full/epic) with confetti, node-type messages, and XP breakdown
- Dashboard XP prominence with progress bar, level badges, count-up animation, and level-up celebrations
- Boss unlock 3-stage modal (celebration, unlock, preview) with musical confetti and Web Audio fanfare
- Codebase cleanup: 37 dead files (~8,000 lines) and 5 unused dependencies removed

**Stats:**

- 127 files created/modified
- 13,566 lines added, 8,517 lines removed
- 6 phases, 13 plans
- 5 days (2026-02-05 to 2026-02-09)

**Git range:** `384386e` to `122f90e`

**What's next:** Next milestone planning via `/gsd:new-milestone`

---

## v1.3 Trail System Redesign (Shipped: 2026-02-05)

**Delivered:** Professional game-like learning progression for 8-year-olds with 93 nodes across three parallel learning paths (Treble, Bass, Rhythm), consistent pedagogy following Discovery -> Practice -> Mix-Up -> Speed -> Boss pattern, and build-time validation infrastructure.

**Phases completed:** 8-12 (14 plans total)

**Key accomplishments:**

- Build-time validation infrastructure with DFS cycle detection, node type validation, XP economy auditing
- 22 redesigned bass clef nodes across 3 units (C4 -> C3) mirroring treble pedagogy
- 36 redesigned rhythm nodes across 6 units from quarter notes to sixteenths with proper pedagogical scaffolding
- 93-node unified trail system with atomic cutover, progress reset, and XP preservation
- 600+ lines of legacy code removed (LEGACY_NODES array, nodeGenerator.js dependency)
- E2E verification passed for all three paths with human testing

**Stats:**

- 88 files created/modified
- 17,003 lines added, 5,571 lines removed
- 5 phases, 14 plans
- 3 days (2026-02-03 -> 2026-02-05)

**Git range:** `144487b` -> `fe4732f`

**What's next:** VictoryScreen node-type celebrations, UI enhancements, production deployment to app stores

---

## v1.2 Trail System Stabilization (Shipped: 2026-02-03)

**Delivered:** Committed and validated 26-node trail redesign with Memory Game integration, 8 node types for engagement variety, and comprehensive bug fixes for score calculation and navigation.

**Phases completed:** 6-7 (4 plans total)

**Key accomplishments:**

- Committed 26-node trail redesign across Units 1-3 (C4 through C5 progression)
- Integrated Memory Game with trail auto-start and correct configuration parsing
- Fixed critical score calculation bug (pairs not cards) that caused 0 stars
- Added VictoryScreen improvements (loading states, Back to Trail button)
- Completed tech debt cleanup (Phase 05 docs, i18n, code deduplication)
- Removed 7 temporary documentation/debug files from repo root

**Stats:**

- 31 files created/modified
- 4,698 lines added, 349 lines removed
- 2 phases, 4 plans
- 1 day (2026-02-03)

**Git range:** `aec1e0f` -> `a5aff93`

**What's next:** VictoryScreen node-type celebrations, Unit 4 (eighth notes), production deployment

---

## v1.1 Parental Consent Email Service (Shipped: 2026-02-02)

**Delivered:** Working parental consent email flow enabling under-13 children to complete COPPA-required verification via parent email confirmation.

**Phases completed:** 5 (2 plans total)

**Key accomplishments:**

- Supabase Edge Function sends consent emails via Brevo API (300/day free tier)
- Child-friendly HTML email template with purple gradient branding
- End-to-end consent flow: signup -> parent email -> click link -> account activated
- Fixed 406 console errors with .maybeSingle() pattern for optional queries
- Session conflict resolution for clean new user signup
- Comprehensive error handling for expired/invalid/network errors

**Stats:**

- 15 files created/modified
- 1,687 lines added, 41 lines removed
- 1 phase, 2 plans
- 1 day (2026-02-02)

**Git range:** `dbb4708` to `44c7bdb`

**What's next:** Hard delete Edge Function for expired accounts, production deployment to app stores

---

## v1.0 Security Hardening (Shipped: 2026-02-01)

**Delivered:** Complete security hardening and COPPA compliance for the piano learning PWA, protecting children's data and enabling safe operation on shared devices.

**Phases completed:** 1-4 (15 plans total)

**Key accomplishments:**

- Authorization hardened at 3 layers (RLS policies, SECURITY DEFINER functions, client-side services)
- COPPA compliance achieved (age gate, parental consent, data export/deletion, username anonymization)
- Production safeguards active (rate limiting 10/5min, session timeout 30min/2hr)
- Shared device protection (secure logout, service worker auth exclusion)
- Third-party data collection eliminated (self-hosted fonts via @fontsource)
- Child-friendly error messages in English and Hebrew

**Stats:**

- 177 files created/modified
- 31,659 lines added, 1,560 lines removed
- 4 phases, 15 plans
- 2 days from start to ship (2026-01-31 to 2026-02-01)

**Git range:** `feat(01-01)` to `docs(04)`

**What's next:** Production deployment preparation, beta testing with human verification checklist

---

## v1.6 Auto-Rotate Landscape for Games (Shipped: 2026-02-17)

**Delivered:** Automatic landscape orientation handling for all 4 game modes on mobile, with API-based lock on Android PWA, playful animated rotate prompt on iOS, landscape-optimized CSS layouts, and full accessibility/i18n integration.

**Phases completed:** 01-05 (10 plans total)

**Key accomplishments:**

- Reactive orientation detection with animated rotate prompt overlay for iOS mobile portrait users
- Landscape-optimized CSS layouts for all 4 game modes via Tailwind orientation modifiers
- Debounced VexFlow resize for smooth notation re-rendering on orientation change
- Android PWA automatic landscape lock via Screen Orientation + Fullscreen APIs
- VictoryScreen and settings modals optimized for landscape orientation
- Full a11y integration (reduced motion, ARIA live regions) + EN/HE translations with RTL support

**Stats:**

- 42 files created/modified
- 5,128 lines added, 132 lines removed
- 5 phases, 10 plans
- 4 days (2026-02-13 to 2026-02-16)

**Git range:** `1d6219d` to `ca0b42b`

**What's next:** Next milestone planning via `/gsd:new-milestone`

---

## v1.7 Mic Pitch Detection Overhaul (Shipped: 2026-03-04)

**Delivered:** Complete refactor of the pitch detection pipeline for accurate mic input across all game modes, replacing naive autocorrelation with McLeod Pitch Method, unifying three AudioContext instances into a shared provider, adding iOS Safari interruption recovery, and validating performance on mid-range Android.

**Phases completed:** 06-10 (12 plans total, 1 skipped)

**Key accomplishments:**

- Fixed mic-restart regression with sync ref guard and MicErrorOverlay with i18n
- Single shared AudioContextProvider replaces 3 separate AudioContext instances across game modes
- McLeod Pitch Method (pitchy 4.1.0) eliminates octave errors on piano harmonics
- Raw piano signal: echoCancellation/noiseSuppression/autoGainControl disabled, smoothing=0, fftSize=4096
- BPM-adaptive onset/note-off timing with formal IDLE/ARMED/ACTIVE FSM state machine
- Full piano frequency map covering C3-C6 including bass clef notes A2/B2
- Per-note dedup in game scoring layer prevents double-scoring
- iOS Safari AudioContext interruption recovery (phone calls, app switches, device lock)
- AudioContext resume() called synchronously within user gesture for iOS compliance
- CPU profiling PASS on Pixel 6: 85-95fps during active mic detection, AudioWorklet not needed

**Stats:**

- ~30 files created/modified
- 5 phases, 12 plans (1 skipped: AudioWorklet migration — profiling gate PASS)
- 15 days (2026-02-17 to 2026-03-04)

**Git range:** v1.6 tag to `0b651dc`

**What's next:** v1.9 Engagement & Retention milestone scoping

---

## v1.8 App Monetization (Shipped: 2026-03-01)

**Delivered:** Freemium monetization with Lemon Squeezy payment processor, COPPA-safe child paywall (no prices visible to children), dual-market pricing (ILS/USD), database-layer content gating, webhook-driven subscription lifecycle, parent portal with checkout and cancel flow, and Supabase Realtime subscription status propagation.

**Phases completed:** 11-16 (13 plans total)

**Key accomplishments:**

- Lemon Squeezy selected as payment processor (Israel bank payout support, sandbox verified)
- Subscription database with RLS: client SELECT-only, webhook service_role writes only
- Dual-layer content gate: React UI (isFreeNode) + database RLS (is_free_node + has_active_subscription)
- Webhook Edge Function with cryptographic signature verification and idempotent UPSERT
- Service worker excludes subscription/REST API endpoints from cache (pianomaster-v6)
- SubscriptionContext provides global isPremium with staleTime:0, Supabase Realtime push invalidation
- Gold lock overlay for subscription-locked nodes (distinct from gray prerequisite lock)
- Child-appropriate paywall modal: no prices, no buy buttons, "Ask a parent" nudge
- Pricing page with ILS/USD auto-detection, Lemon Squeezy checkout overlay
- Subscription success page with webhook polling (up to 10s)
- Parent portal with cancel flow, access preserved until billing period end
- Consent email updated to disclose payment processor, no child PII sent to Lemon Squeezy

**Stats:**

- ~40 files created/modified
- 6 phases, 13 plans
- 4 days (2026-02-25 to 2026-03-01)

**Git range:** post-v1.7 to `monetization merge`

**What's next:** v1.9 Engagement & Retention milestone scoping

---

## v1.9 Engagement & Retention (Shipped: 2026-03-08)

**Delivered:** Daily return hooks, arcade-style game engagement, extended progression system, and kid-friendly UI redesign — push notifications with COPPA parent gate, streak protection with freeze shields and comeback bonus, combo/lives/speed mechanics for Notes Recognition, 30-level XP system with prestige tiers, weekly progress summaries with parent email reports, and visual redesign of TrailNodeModal and Dashboard for 8-year-old learners.

**Phases completed:** 17-23 (15 plans total)

**Key accomplishments:**

- COPPA-compliant push notifications with parent math gate, context-aware messages (streak/XP/goals), 1/day rate limit, service worker Web Push
- Streak protection: 36-hour grace window, consumable freeze shields (earned every 7-day streak), weekend pass toggle, 2x comeback XP bonus for 3 days
- Arcade-style Notes Recognition: combo counter with 2x/3x multipliers, speed bonus, 3-lives system, on-fire mode with glow/embers, auto-growing note pool
- Extended XP progression from 15 to 30 levels with prestige tiers (Maestro 1, 2, 3...), per-level themed names, golden prestige badge
- Weekly progress summaries, personal best badges on VictoryScreen, 12 rotating daily fun facts, parent weekly email via Brevo with HMAC unsubscribe
- Kid-friendly TrailNodeModal (centered glowing icon, 3D bubble note badges, golden XP card) and Dashboard (compact hero, XP ring, unified stats card, circular practice tools)

**Stats:**

- 124 files created/modified
- 15,188 lines added, 4,582 lines removed
- 7 phases, 15 plans
- 4 days (2026-03-04 to 2026-03-08)

**Git range:** `329642d` to `abc66d7`

**What's next:** Next milestone planning via `/gsd:new-milestone`

---

*Last updated: 2026-03-15*
