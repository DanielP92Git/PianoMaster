# PianoApp

## What This Is

A piano learning PWA for 8-year-old learners with a Duolingo-style skill progression trail featuring 93 nodes across 3 parallel learning paths (Treble, Bass, Rhythm), 8 node types for engagement variety, and 4 game modes (note recognition, sight reading, rhythm, memory). The trail features an immersive enchanted forest theme with 3D glowing nodes, responsive zigzag layout, tab-based path switching, glass-morphism cards, and tiered celebrations with boss unlock events. Security hardened with COPPA compliance, protecting children's data through layered authorization, parental consent flows with working email delivery, and shared device safeguards.

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

### Active

## Current Milestone: v1.6 Auto-Rotate Landscape for Games

**Goal:** Automatically rotate to landscape mode when entering games on mobile, with API lock on Android and a playful rotate prompt on iOS.

**Target features:**
- Screen Orientation API landscape lock on Android PWA
- Playful animated rotate prompt for iOS PWA (tilting phone icon, kid-friendly message)
- Full game lifecycle coverage (settings → gameplay → victory screen)
- Orientation unlock on navigation away from game

**Deferred (candidates for future milestones):**
- Hard delete Edge Function for accounts past 30-day grace period
- Production deployment to Google Play / Apple App Store
- Celebration sound effects with volume control (requires classroom A/B testing)
- Streak/unit/path completion celebrations
- i18n for celebration messages
- Grand Staff integration (cross-clef learning)
- Adaptive difficulty system (algorithm research needed)

### Out of Scope

Explicitly excluded:

| Feature | Reason |
|---------|--------|
| Real song integration | Licensing complexity; use generated patterns for now |
| Path branching logic | Current linear progression works; complexity not justified |
| REVIEW node automation | Manual review nodes for now; spaced repetition algorithm later |
| Multi-language consent emails | English only for now, Hebrew later |
| Avatar customization / unlockable items | Tangible rewards undermine intrinsic motivation for 8-year-olds |
| Social comparison / leaderboard celebrations | COPPA concerns, inappropriate social pressure for age group |

## Context

**Current State (after v1.5):**
- 93-node trail system with enchanted forest theme, 3D nodes, zigzag layout, and tab navigation
- Tiered celebration system (4 tiers) with accessibility-first design
- Boss unlock events with 3-stage modal and musical confetti
- 8 node types with unique icons and colorblind-safe colors
- Dashboard XP card with level progression, badges, and animations
- Build-time validation ensures node integrity on every build
- WCAG 2.2 AA compliant trail page with RTL support
- App hardened with 3-layer authorization (RLS, SECURITY DEFINER, client-side)
- COPPA consent flow fully operational with Brevo email delivery
- ~67,835 lines JavaScript/JSX/CSS across src/
- v1.0: 177 files | v1.1: 15 files | v1.2: 31 files | v1.3: 88 files | v1.4: 127 files | v1.5: 45 files

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
- Pre-existing test failure: SightReadingGame.micRestart.test.jsx (Router context)
- Pre-existing lint: 24 errors, 415 warnings (all pre-v1.4)
- syncPracticeSessions() stub in sw.js (zero runtime impact)

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

---

*Last updated: 2026-02-13 after v1.6 milestone start*
