# PianoApp

## What This Is

A piano learning PWA for 8-year-old learners with a Duolingo-style skill progression trail featuring 129 nodes across 3 parallel learning paths (Treble, Bass, Rhythm) including sharps and flats accidentals, 8 node types for engagement variety, and 4 game modes (note recognition, sight reading, rhythm, memory). The trail features an immersive enchanted forest theme with 3D glowing nodes, responsive zigzag layout, tab-based path switching, glass-morphism cards, and tiered celebrations with boss unlock events. Games auto-rotate to landscape on Android PWA with a playful rotate prompt on iOS, landscape-optimized layouts, and full accessibility/i18n support. XP is the sole reward currency across all views (student and teacher), with a streamlined VictoryScreen and 30-level progression with prestige tiers. Security hardened with COPPA compliance, protecting children's data through layered authorization, parental consent flows with working email delivery, shared device safeguards, and password recovery. Production-ready with Sentry error monitoring, route-based code splitting, React ErrorBoundary, first-time onboarding tour, daily challenge system with bonus XP, and COPPA-compliant Privacy Policy and Terms of Service pages.

## Core Value

**Children's data must be protected and inaccessible to unauthorized users.** Every feature prioritizes preventing unauthorized access to child data, ensuring safe logout on shared devices, and preventing abuse of the XP/progression system.

## Requirements

### Validated

These capabilities exist, are working, and have been shipped:

**v1.5 Trail Page Visual Redesign (shipped 2026-02-12):**
- Enchanted forest CSS-only background with starfield, glow orbs, and multi-layer gradients
- 3D node buttons with radial gradients, state-based glow effects, and press animations
- Tab-based path switching (Treble/Bass/Rhythm) with URL persistence and ARIA keyboard navigation
- Responsive zigzag trail layout with SVG Bezier S-curve path connectors
- Glass-morphism unit progress cards with WCAG 4.5:1 contrast compliance
- Trail header with shield level badge, XP progress bar, and Free Practice button
- Quicksand font integration scoped to trail page (self-hosted, COPPA compliant)
- Star ratings displayed inside completed nodes
- WCAG 2.2 AA: 48px touch targets, RTL mirroring, focus-visible indicators, color-independent states
- Service worker cache bumped to v4 for deployment
- 59/59 requirements delivered with zero database changes

**v1.4 UI Polish & Celebrations (shipped 2026-02-09):**
- Tiered VictoryScreen celebrations (minimal/standard/full/epic) with confetti and node-type-specific messaging
- Boss unlock 3-stage modal (celebration, unlock animation, next unit preview) with musical confetti and Web Audio fanfare
- Node type visual distinction: 8 unique lucide-react icons, colorblind-safe palette, boss crown/gold
- Dashboard XP progress bar with level badges, "X XP to next level", count-up animation, level-up celebrations
- All celebrations respect reducedMotion, are always skippable, and deduplicate (boss show-once, level-up show-once)
- Codebase cleanup: 37 dead files removed, 5 unused dependencies removed, bundle visualizer added

**v1.3 Trail System Redesign (shipped 2026-02-05):**
- 93-node trail system with consistent pedagogy across Treble (23), Bass (22), and Rhythm (36) paths
- Build-time validation script catches prerequisite cycles and invalid node types before deploy
- 22 bass clef nodes following treble pedagogy (C4 -> C3 octave progression)
- 36 rhythm nodes with duration-based progression (quarter -> sixteenth notes)
- Atomic cutover with progress reset and XP preservation
- All 70 v1.3 requirements delivered (4 data + 26 bass + 35 rhythm + 5 integration)

**v1.2 Trail System Stabilization (shipped 2026-02-03):**
- TRAIL-01-04: 26 treble clef nodes across Units 1-3 (C4 through C5 progression)
- MEM-01-05: Memory Game integrated with trail auto-start, correct config parsing, progress saving
- NAV-01-04: Cross-exercise navigation works (note_recognition, memory_game, sight_reading, rhythm)
- CLEAN-01-02: Temporary docs and debug files removed from repo root
- DEBT-01-04: Tech debt resolved (docs gap, i18n, code deduplication, debug removal)

**v1.1 Parental Consent Email Service (shipped 2026-02-02):**
- EMAIL-01: Edge Function sends consent verification email via Brevo API
- EMAIL-02: Email contains child-friendly branding and clear CTA for parent
- EMAIL-03: Consent URL in email works end-to-end (verify -> activate account)
- FIX-01: Eliminated 406 console errors during role detection (.maybeSingle())
- FIX-02: Handle edge cases (resend, expired tokens, invalid links)

**v1.0 Security Hardening (shipped 2026-02-01):**
- SEC-01: RLS policies use database state (not user_metadata) for authorization
- SEC-02: All SECURITY DEFINER functions have auth.uid() checks
- SEC-03: Client-side services verify user.id matches studentId
- SEC-04: Logout clears all user-specific localStorage keys
- SESS-01: Students auto-logout after 30min inactivity
- SESS-02: Teachers auto-logout after 2hr inactivity
- SESS-03: Inactivity timer resets on user interaction
- RATE-01: Score submissions limited to 10 per 5min per node
- RATE-02: Rate limiting enforced at database level
- RATE-03: Rate limit violations return clear error message
- COPPA-01: Data export returns all student data as JSON
- COPPA-02: Data deletion removes all student data with 30-day grace
- COPPA-03: Student usernames anonymized in shared features
- COPPA-04: Neutral age gate collects DOB (not checkbox)
- COPPA-05: Parental consent blocks data collection until verified
- COPPA-06: No third-party data collection (self-hosted fonts)

**Pre-existing:**
- Supabase authentication (email/password)
- Student/teacher role differentiation
- Trail gamification system with XP and levels
- Daily goals generation and tracking
- Multiple game modes (sight reading, notes recognition, rhythm, memory)

**v1.6 Auto-Rotate Landscape for Games (shipped 2026-02-17):**
- ORIENT-01 through ORIENT-05: Playful animated rotate prompt on mobile portrait with auto-dismiss, permanent dismiss, all 4 game modes
- LAYOUT-01 through LAYOUT-04: Landscape-optimized CSS layouts for all 4 games, settings modals, VictoryScreen, portrait playable (WCAG 1.3.4)
- PLAT-01 through PLAT-04: Android PWA auto-locks landscape via Screen Orientation API, unlocks on navigation away, iOS fallback to rotate prompt
- A11Y-01 through A11Y-05: Reduced motion support, ARIA live regions, WCAG 1.3.4 escape hatch, EN/HE translations, RTL layout
- 18/18 requirements delivered with zero database changes

**v1.7 Mic Pitch Detection Overhaul (shipped 2026-03-04):**
- FIX-01/02: Mic-restart regression fixed with sync ref guard
- AUDIO-01/02/03: Raw piano signal (no browser DSP), zero smoothing, 4096 fftSize for bass resolution
- ALGO-01/02/03: McLeod Pitch Method via pitchy library — octave errors eliminated, confidence gating
- ARCH-01-05: Single shared AudioContextProvider replaces 3 separate instances, suspend/resume between exercises
- PIPE-01-06: BPM-adaptive onset/note-off timing, FSM state machine, full bass frequency map, per-note dedup
- IOS-01-04: AudioContext interruption recovery, user-gesture-first resume, visibilitychange listener, mic error overlay with iOS instructions
- PERF-01: CPU profiling PASS (85-95fps on Pixel 6) — AudioWorklet not needed
- 24/24 requirements delivered (2 conditional N/A), 12 plans across 5 phases

**v1.8 App Monetization (shipped 2026-03-01):**
- SUB-01-04: Subscription database with RLS (client SELECT-only, webhook service_role writes)
- PAY-01-04: Lemon Squeezy integration with webhook signature verification, idempotent UPSERT
- GATE-01-03: Dual-layer content gate (React UI + database RLS), gold lock vs gray prerequisite lock
- CHILD-01/02: Child-appropriate paywall modal (no prices, no buy buttons)
- PARENT-01-05: Pricing page (ILS/USD), Lemon Squeezy checkout overlay, subscription confirmation, cancel from parent portal
- SVC-01-03: SubscriptionContext with staleTime:0, Supabase Realtime invalidation
- COMP-01-04: Service worker cache exclusion for subscription APIs, consent email updated
- 25/25 requirements delivered, 13 plans across 6 phases

**v1.9 Engagement & Retention (shipped 2026-03-08):**
- NOTIF-01-05: COPPA-compliant push notifications with parent math gate, context-aware messages, 1/day rate limit
- STRK-01-05: Streak protection with 36-hour grace, freeze shields, weekend pass, 2x comeback bonus
- GAME-01-05: Notes Recognition arcade mode — combo/lives/speed bonus, on-fire mode, auto-grow note pool
- PROG-01-03: Extended XP from 15 to 30 levels with prestige tiers (Maestro 1, 2, 3...)
- PROG-04-07: Weekly summaries, personal best badges, daily fun facts, parent weekly email via Brevo
- UI-01-05: Kid-friendly TrailNodeModal with 3D bubble badges, glowing icon, XP card
- DASH-01-09: Kid-friendly Dashboard with compact hero, XP ring, unified stats, circular practice tools
- 36/36 requirements delivered, 15 plans across 7 phases

**v2.0 VictoryScreen & XP Unification (shipped 2026-03-08):**
- VS-EXTRACT/LAYOUT/CONTENT/BUTTONS/FREEPLAY: VictoryScreen hook extraction (70% line reduction) + two-panel landscape layout
- XP-SERVICE/ACHIEVE/DEAD-CODE: Points replaced with XP as sole reward currency, dead code deleted
- XP-FREEPLAY/VICTORY/DASHBOARD/HOOKS: Free play XP awarding, unified display, query cleanup
- XP-AVATARS/ACHIEVEMENTS/I18N: All UI + i18n migrated from points to XP
- XP-TEACHER/DB-CLEANUP: Teacher analytics + DB migration dropping points columns
- 17/17 requirements delivered, 6 plans across 2 phases

**v2.1 Forgot Password Recovery (shipped 2026-03-10):**
- PWD-RESET-API: Supabase password reset API with anti-enumeration security
- PWD-RESET-I18N: Complete EN/HE translations (23 keys each)
- PWD-RESET-LOGIN-UI: Inline three-state forgot password flow in LoginForm
- PWD-RESET-PAGE: Dedicated /reset-password page with PKCE session detection
- PWD-RESET-ROUTE: Public route outside ProtectedRoute
- 5/5 requirements delivered, 2 plans across 1 phase

**v2.2 Sharps & Flats (shipped 2026-03-17):**
- FIX-01/02: patternBuilder regex + trail flag derivation for accidental pitches
- TREB-01/02/03: 18 treble accidental nodes (F#4, C#4, G#4 sharps + Bb4, Eb4, Ab4, Db4 flats + boss)
- BASS-01/02/03: 18 bass accidental nodes (F#3, C#3, G#3 sharps + Bb3, Eb3, Ab3, Db3 flats + boss)
- INTG-01/02/03: expandedNodes wiring, subscription gate default-deny, MIDI enharmonic matching
- I18N-01: Full EN/HE translations with Unicode symbols and Hebrew solfege terms
- 12/12 requirements delivered, 9 plans across 5 phases

**v2.5 Launch Prep (shipped 2026-03-22):**
- BUILD-01/02: Fixed verify:patterns (.js extension), synchronized Supabase migration history
- LINT-01-04: All 574 ESLint warnings eliminated (config fixes, dead code removal, justified suppressions)
- DEL-01-07: COPPA hard-delete Edge Function — cron-triggered permanent deletion after 30-day grace, CASCADE across all tables, LS cancel, Brevo confirmation email, HMAC audit log
- QA-01-07: 89-item production QA checklist executed, 3 blockers found and resolved (consent email, deletion UI, PWA offline)
- 20/20 requirements delivered, 11 plans across 4 phases

**v2.4 Content Expansion (shipped 2026-03-19):**
- RENDER-01/02/03: VexFlow key signature glyph rendering, accidental suppression, config pipeline threading
- TREB-01-07: 14 treble key signature nodes (G, D, A, F, Bb, Eb major + memory + boss)
- BASS-01-07: 14 bass key signature nodes mirroring treble with C3-C4 range
- RFIX-01/02: Fixed 6/8 compound beat model (beats:2 not 6), correct 3+3 beam grouping
- RADV-01-04: 14 advanced rhythm nodes (6/8 compound meter + syncopation + dual-concept boss)
- INTG-01/02/03: expandedNodes wiring, default-deny subscription gate, full EN/HE i18n
- 26/26 requirements delivered, 10 plans across 5 phases

**v2.3 Launch Readiness (shipped 2026-03-17):**
- LEGAL-01/07: Privacy Policy and Terms of Service public pages with glassmorphism, cross-linked from signup/settings/legal/consent
- QUAL-01/03: All 23 ESLint errors fixed (0 remaining), React ErrorBoundary with Sentry integration
- OBS-01/04: Sentry error monitoring (COPPA-safe, prod-only), source maps, analytics placeholder
- PERF-01/04: Route-based code splitting (17+ lazy imports, 128 chunks), error toasts with kid-friendly messages
- ONBD-01/05: 4-step onboarding tour for first-time students (Framer Motion, reduced-motion, localStorage persistence)
- CHAL-01/07: Daily challenge system with DB table, deterministic generation, dashboard card, game integration, bonus XP
- 30/30 requirements delivered, 6 phases in 1 day

### Active

(No active milestone — v2.5 shipped, next milestone TBD via `/gsd:new-milestone`)

**Future candidates:**
- Production deployment to Google Play / Apple App Store
- Celebration sound effects with volume control (requires classroom A/B testing)
- Streak/unit/path completion celebrations
- i18n for celebration messages
- Grand Staff integration (cross-clef learning)
- Adaptive difficulty system (algorithm research needed)

**Future candidates — Engagement & Retention (researched 2026-02-25):**
See `.planning/research/ENGAGEMENT_RETENTION.md` for full analysis and `.planning/research/PITFALLS_ENGAGEMENT.md` for pitfalls.

*Content Expansion (extends trail from 2-3 months → 12+ months):*
- Trail Section 5: Key Signatures (~15 nodes)
- Trail Section 6: Two-Hand Basics (~20 nodes)
- Trail Section 7: Simple Melodies (~15 nodes, public domain songs)
- Trail Section 8: Advanced Rhythm (~15 nodes, syncopation/compound meters)
- Procedural "Endless Practice" mode (infinite post-trail content)
- Real Song Library (public domain first, licensed later)

*Daily Return Hooks:*
- Daily challenge system (rotating unique challenges with bonus XP)
- Weekly bonus events (Double XP, Bass Week, Speed Week, Review Week)

*Progression Plateau Solutions:*
- Prestige / mastery star tiers (Gold 4th, Diamond 5th beyond current 3-star max)
- Spaced repetition "Rusty Skills" system (accuracy decay + review incentives)

*Game Variety:*
- New mini-game types: Note Catcher (Guitar Hero style), Melody Puzzle, Rhythm Battle, Interval Training
- Adaptive difficulty within sessions (flow zone management)

*Narrative & Emotional:*
- Story campaign wrapper ("Help Beethoven restore his musical powers")
- Seasonal events (quarterly themed content with exclusive cosmetics)
- Accessory system expansion (avatar in gameplay, themed sets, rare items)

*Social & Competitive (COPPA-safe):*
- Classroom challenges (teacher-set, anonymous collective progress)
- Classroom leaderboard with consent (first names, weekly reset, "most improved")

### Out of Scope

Explicitly excluded:

| Feature | Reason |
|---------|--------|
| Real song integration (licensed) | Licensing complexity ($500-5000/song); start with public domain only |
| Path branching logic | Current linear progression works; complexity not justified |
| Multi-language consent emails | English only for now, Hebrew later |
| Social network features (chat, friend lists) | COPPA prohibits without verifiable parental consent; classroom-level features preferred |
| Daily login rewards (open-and-close) | Manipulative pattern; reward meaningful activity instead |
| Virtual currency purchasable with money | COPPA dark pattern risk; earn-only accessories tied to achievements |

**Revisited decisions (2026-02-25 engagement research):**

| Previously Excluded | New Status | Rationale |
|---|---|---|
| Avatar customization / unlockable items | **Moved to future candidate** | Engagement research shows cosmetic rewards critical for 12-month retention; balance with intrinsic motivation per SDT theory |
| Social comparison / leaderboard celebrations | **Moved to future candidate (COPPA-safe variant)** | Anonymous classroom challenges and teacher-set goals are COPPA-compliant and add social accountability |
| REVIEW node automation (spaced repetition) | **Moved to future candidate** | Critical for post-trail retention; "rusty skills" system prevents content exhaustion |

## Context

**Current State (after v2.5 shipped 2026-03-22):**
- 171-node trail system (93 original + 36 accidental + 42 content expansion nodes) with enchanted forest theme, 3D nodes, zigzag layout, and tab navigation
- Kid-friendly Dashboard with compact hero, XP ring, unified stats card, circular practice tools
- Kid-friendly TrailNodeModal with centered glowing icon, 3D bubble note badges, golden XP card
- Push notifications: COPPA parent gate, context-aware messages, 1/day rate limit
- Streak protection: 36-hour grace, freeze shields, weekend pass, 2x comeback bonus
- Notes Recognition arcade mode: combo/lives/speed bonus, on-fire mode, auto-grow note pool
- XP is sole reward currency: 30-level system with prestige tiers, no more "points"
- VictoryScreen redesigned with useVictoryState hook extraction and two-panel landscape layout
- Free play awards XP via calculateFreePlayXP (10-50 XP range)
- Teacher analytics display "X XP (Lv. Y)" format
- Weekly progress summaries, personal best badges, daily fun facts
- Parent weekly email reports via Brevo with HMAC unsubscribe
- Tiered celebration system (4 tiers) with accessibility-first design
- Boss unlock events with 3-stage modal and musical confetti
- 8 node types with unique icons and colorblind-safe colors
- Build-time validation ensures node integrity on every build
- WCAG 2.2 AA compliant trail page with RTL support
- ESLint: 0 warnings, 0 errors (574 eliminated in v2.5 Phase 13)
- COPPA hard-delete: cron-triggered Edge Function permanently deletes accounts past 30-day grace period (v2.5 Phase 14)
- Production QA: 89-item checklist executed, all critical flows pass (v2.5 Phase 15)
- PWA offline: service worker v8 caches production JS bundles (v2.5 Phase 15)
- Student account deletion UI: Delete Account button in settings behind parent gate (v2.5 Phase 15)
- Games auto-rotate to landscape on Android PWA, playful rotate prompt on iOS
- App hardened with 3-layer authorization (RLS, SECURITY DEFINER, client-side)
- COPPA consent flow fully operational with Brevo email delivery
- COPPA hard-delete Edge Function: cron-triggered permanent deletion after 30-day grace period (Phase 14, completed 2026-03-21)
- Password recovery: inline forgot password flow + /reset-password page with PKCE
- McLeod Pitch Method (pitchy) for accurate mic detection across all game modes
- Single shared AudioContextProvider with iOS Safari interruption recovery
- BPM-adaptive detection pipeline with FSM state machine and per-note dedup
- Freemium monetization with Lemon Squeezy (dual-market ILS/USD, COPPA-safe child paywall)
- Dual-layer content gate: React UI + database RLS enforcement
- Parent portal with subscription management and cancel flow
- Accidental note handling: MIDI-based enharmonic matching in sight reading, anchored regex for flat detection
- Full EN/HE translations for all accidental note names using Unicode symbols and Hebrew solfege
- VexFlow key signature glyph rendering with accidental suppression for 7 keys (C, G, D, A, F, Bb, Eb major)
- Fixed 6/8 compound beat model with correct 3+3 beam grouping and compound-aware MetronomeTrainer
- 28 key signature trail nodes (14 treble + 14 bass) and 14 advanced rhythm nodes (6/8 + syncopation)
- ~86,381 lines JavaScript/JSX/CSS/JSON across src/
- v1.0: 177 files | v1.1: 15 files | v1.2: 31 files | v1.3: 88 files | v1.4: 127 files | v1.5: 45 files | v1.6: 42 files | v1.7: ~30 files | v1.8: ~40 files | v1.9: 124 files | v2.0: 43 files | v2.1: 11 files | v2.2: 66 files | v2.4: 149 files

**Tech Stack:**
- Frontend: React 18, Vite 6, React Router v7
- State: Redux Toolkit (minimal), React Context (feature-scoped), TanStack Query v5
- Backend: Supabase (auth, database, real-time, Edge Functions)
- Email: Brevo API (300/day free tier)
- Music: VexFlow v5 for notation, Klavier for keyboard input
- Styling: Tailwind CSS with custom design system + trail-effects.css
- Icons: lucide-react
- Audio: Web Audio API (synthesized fanfare)
- Font: @fontsource/quicksand (trail page only)

**User Demographics:**
- Primary users: 8-year-old children learning piano
- Secondary users: Teachers managing students, parents overseeing progress
- COPPA compliance required for children under 13

**Known Issues (non-blocking):**
- Parental consent verification method needs legal review
- Privacy policy language requires attorney review
- State age verification laws may require Play Age Signals API
- syncPracticeSessions() stub in sw.js (zero runtime impact)
- Sentry env vars need configuration on Netlify
- 9 QA known issues accepted for launch (documented in QA-CHECKLIST.md)

## Constraints

- **Backend**: Supabase (auth, database, real-time) -- no changes to this choice
- **Compatibility**: Must not break existing beta user data or progress
- **Compliance**: Must meet Google Play and Apple App Store security requirements
- **COPPA**: Must comply with children's data protection regulations (under 13)
- **COPPA Deadline**: April 22, 2026 for full compliance

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| is_admin() function for admin checks | user_metadata is user-modifiable via supabase.auth.updateUser() | Good |
| Defense-in-depth in triggers | Verify auth.uid() even when RLS should prevent access | Good |
| Trigger-based is_under_13 column | GENERATED ALWAYS AS doesn't support date functions | Good |
| Neutral DOB collection | COPPA requires dropdown menus not leading questions | Good |
| Fixed window rate limiting | Simpler than sliding window, reset after 5 min of inactivity | Good |
| 30min student / 2hr teacher timeout | Balance security on shared devices vs. not interrupting practice | Good |
| crossTab with leaderElection | One tab coordinates timeout across all tabs | Good |
| Fontsource packages for fonts | npm versioning, Vite bundling, no manual font management | Good |
| No separate staging environment | Beta phase with few users; adds maintenance burden | Good |
| Switch from Resend to Brevo | Resend free tier domain limitation; Brevo offers 300/day | Good |
| .maybeSingle() for optional queries | Prevents 406 errors when no rows found | Good |
| SignOut before SignUp | Prevents session conflicts from previous users | Good |
| Public route bypass for consent verify | Parents complete verification regardless of child status | Good |
| Table-based HTML email layout | Maximum email client compatibility (Outlook uses Word engine) | Good |
| 8 node types for engagement variety | Psychological variety improves learning retention | Good |
| 26 nodes in Units 1-3 vs 18 original | Gradual progression appropriate for 8-year-old learners | Good |
| Score calc uses pairs: (cards/2)*10 | Cards count double-counts; pairs is correct game mechanic | Good |
| Use shared verifyStudentDataAccess | Robustness (.maybeSingle), code deduplication | Good |
| Validation runs at prebuild | Catches prerequisite cycles and invalid types before deploy | Good |
| START_ORDER = 51 for bass, 100 for rhythm | Clear separation between clef and rhythm paths | Good |
| Single pitch C4 for all rhythm nodes | Pure rhythm focus, no pitch confusion for learners | Good |
| Silent progress reset, XP preserved | Maintains motivation despite trail restructure | Good |
| 93 nodes final count | Actual count after implementation (was 87 estimate) | Good |
| Celebration duration tiers (500ms/1000ms/3000ms) | Based on 8-year-old attention span research | Good |
| Extended timeouts 1.5x multiplier | Balances cognitive accessibility with engagement | Good |
| Boss icons override category icons | Trophy/crown more recognizable for special nodes | Good |
| Blue/purple/green colorblind-safe palette | Maximally distinguishable in all colorblindness types | Good |
| Hardcoded English for celebrations | i18n deferred; English primary for learners | Good |
| Epic tier requires boss + stars | Boss nodes only epic when player earns at least 1 star | Good |
| Web Audio API fanfare (not bundled file) | 0kb bundle cost vs 20-50kb; synthesis quality sufficient | Good |
| Singleton AudioContext pattern | Prevents browser "too many contexts" error | Good |
| 3-stage boss modal | Matches Duolingo celebration patterns for milestone gravitas | Good |
| Bundle visualizer as permanent tool | Ongoing monitoring vs one-time audit | Good |
| Knip for dead code detection | JSX/TSX support, comprehensive analysis | Good |
| Conservative dead code removal | Detection -> verification -> test -> atomic commit | Good |
| Quicksand font for trail page | Rounded, kid-friendly feel; matches Stitch design | Good |
| CSS-only forest background | No image dependency, better performance, easier maintenance | Good |
| Tab-based path switching | Mobile screen too narrow for 3 simultaneous paths | Good |
| Vertical zigzag trail (mobile/desktop) | Unified layout matches natural scrolling; user preferred over horizontal | Good |
| Pseudo-element + opacity for glow effects | Avoids box-shadow transitions that cause paint storms | Good |
| URL query param as tab state source | Single source of truth; no useState duplication; supports browser back | Good |
| Boss nodes merged into category tabs | ID prefix matching (boss_treble_, boss_bass_, boss_rhythm_) | Good |
| Stars inside completed node circles | More cohesive than floating elements; absolute overlay positioning | Good |
| 2px press depth (not 4px) | Gentler tactile feedback appropriate for 8-year-olds | Good |
| RTL mirrors x-axis (100 - xPercent) | Natural right-to-left flow for Hebrew users | Good |
| White 3px outline for focus-visible | Consistent keyboard navigation indicator across all node states | Good |
| Flat solid background (not gradient) | Gradient caused visible banding artifact on trail page | Good |
| will-change only on hover states | Avoids GPU layer promotion for all 93 nodes simultaneously | Good |
| Semi-opaque bg-slate-900/40 overlay | Ensures WCAG 4.5:1 contrast on glass panels | Good |
| 40% Bezier control point offset | Creates winding river S-curves (not sharp zigzags) | Good |
| Function initializer useState for orientation | Synchronous first-render value avoids flash of incorrect state | Good |
| Text-only "Play anyway" dismiss (no X icon) | WCAG 1.3.4 escape hatch, simple and clear for 8-year-olds | Good |
| localStorage permanent dismiss for rotate prompt | Matches pianoapp- naming convention, persists across sessions | Good |
| Rotate-pause-reset animation cycle | User feedback: phone rotates to landscape, pauses, snaps back | Good |
| Tailwind raw media queries for orientation | No aspect-ratio guards needed (games have no text inputs) | Good |
| Portrait-first design philosophy | WCAG 1.3.4: portrait as baseline, landscape as CSS-only enhancement | Good |
| MemoryGame landscape grid 6-8 cols | Better horizontal space utilization in landscape orientation | Good |
| Fullscreen before orientation lock | Android API requirement: requestFullscreen then screen.orientation.lock | Good |
| fullscreenchange listener for Escape key | Auto-unlocks orientation when user exits fullscreen manually | Good |
| Platform guard: Android PWA only | iOS/desktop/browser get rotate prompt or no-op, not API lock | Good |
| useLandscapeLock before useRotatePrompt | Consistent mount order in all game components | Good |
| ARIA live region as first child | Immediate screen reader monitoring with sr-only visual hiding | Good |
| useMotionTokens for fade, AccessibilityContext for icon | Kept existing fade (already respects motion), added explicit control for phone icon | Good |
| Separate COPPA consent for push notifications | Push consent separate from account verification to avoid confusion | Good |
| Parent math gate for push + weekend pass | ParentGateMath reused for dual COPPA purpose | Good |
| 36-hour grace window (not midnight cutoff) | Accommodates varied practice schedules for children | Good |
| All streak logic in JS service layer | No new Postgres functions, consistent with patterns, testable | Good |
| Combo tiers as module-level constants | Avoids useCallback dep churn in NotesRecognitionGame | Good |
| Fire sound via standalone Web Audio oscillator | Avoids mutual-pause conflict with game sounds | Good |
| Arabic numerals for prestige (Maestro 1, not I) | Simpler for 8-year-olds than Roman numerals | Good |
| PRESTIGE_XP_PER_TIER = 3000 | Matches late-level XP gaps, keeps prestige achievable | Good |
| HMAC-SHA256 for email unsubscribe tokens | Stateless, no parent login needed for one-click unsubscribe | Good |
| XPRing uses SVG foreignObject for center icon | Clean SVG composition for gold star placement | Good |
| UnifiedStatsCard gradient border via wrapper div | Better rounded corner support than border-image | Good |
| Fireflies plain div when reducedMotion | Eliminates animation loop entirely for accessibility | Good |
| Free play XP: 10 + floor(score% * 0.4) | Less than trail nodes (10-50 vs 50-150+), keeps trail incentive | Good |
| Hook extraction: useVictoryState | Clean separation of 792 lines business logic from render | Good |
| Teacher XP: "X XP (Lv. Y)" format | Meaningful context for teachers instead of raw numbers | Good |
| Inline forgot password (not modal) | Keeps UX within login card, simpler than separate page | Good |
| Smart expired-link detection via URL params | Immediate error for missing params, 10s timeout for real links | Good |
| Anti-enumeration: generic errors only on reset | Prevents email harvesting via password reset endpoint | Good |
| Flag derivation from notePool in TrailNodeModal | Curriculum authority in one place, games consume flags | Good |
| Auto-grow skips accidentals nodes for natural sessions | Prevents confusing mixed-context note injection | Good |
| SIGHT_READING excluded from flat practice nodes | Mic outputs sharp-form (A#4 not Bb4); boss nodes include as inert placeholder | Good |
| MIDI comparison (noteToMidi) for enharmonic matching | Eliminates string equality bugs for A#4=Bb4 equivalence | Good |
| Anchored regex `/^[A-G]b\d/` for flat detection | Prevents natural 'B' note from triggering false flat mode | Good |
| Unicode symbols for accidental display (not ASCII) | Proper musical notation: F♯ not F#, B♭ not Bb | Good |
| Hebrew solfege terms for accidentals | Culture-appropriate: דיאז (sharp) and במול (flat) | Good |
| 36 new nodes all premium (default-deny) | No new IDs in FREE_NODE_IDS; subscription gate by exclusion | Good |
| Separate sharps/flats units (not mixed) | Avoids enharmonic confusion; mic outputs sharp-form only | Good |
| filterNotesToKey static KEY_NOTE_LETTERS map | Not VexFlow KeyManager; testable and deterministic | Good |
| skipManualAccidental flag on buildStaveNote | Prevents double accidental when applyAccidentals active | Good |
| SIX_EIGHT.beats = 2 with subdivisions: 6 | Compound time modeled as 2 dotted-quarter beats, not 6 eighths | Good |
| beamGroupsForTimeSignature returns null for simple time | beamConfig = {} leaves VexFlow defaults fully intact | Good |
| Mini-boss nodes: isBoss:false, category:'boss' | Distinct from true BOSS nodes; boss naming convention preserved | Good |
| Default-deny gate for 42 new nodes | subscriptionConfig.js untouched; new nodes premium by default | Good |
| RHYTHM_5/6 backfilled to UNITS object | Closed metadata gap between RHYTHM_4 and new RHYTHM_7/8 | Good |

---

*Last updated: 2026-03-22 after v2.5 Launch Prep milestone*
