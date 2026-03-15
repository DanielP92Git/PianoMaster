# Project Milestones: PianoApp

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

