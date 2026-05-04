# Project Retrospective

_A living document updated after each milestone. Lessons feed forward into future planning._

## Milestone: v1.9 — Engagement & Retention

**Shipped:** 2026-03-08
**Phases:** 7 | **Plans:** 15

### What Was Built

- COPPA-compliant push notifications with parent math gate and context-aware daily reminders
- Streak protection system (grace window, freeze shields, weekend pass, comeback bonus)
- Arcade-style Notes Recognition (combo, lives, speed bonus, on-fire mode, auto-grow)
- Extended XP system from 15 to 30 levels with infinite prestige tiers
- Weekly progress summaries, personal best badges, daily fun facts, parent email reports
- Kid-friendly UI redesign of TrailNodeModal and Dashboard

### What Worked

- Parallel phase execution: Phases 19-23 had minimal dependencies and could be planned/executed in any order
- Reusable patterns: ParentGateMath served dual purpose (push consent + weekend pass), Brevo email pattern reused from v1.1
- Service-layer streak logic: Keeping all streak computation in JS (no Postgres functions) made it testable and maintainable
- Glassmorphism design system: Established card patterns made kid-friendly UI redesign straightforward

### What Was Inefficient

- Phase 20 docs stored in wrong directory (`20-component-integration-tab-navigation` instead of `20-extended-progression-system`) — caused by directory name collision between v1.5 and v1.9 phase numbering
- REQUIREMENTS.md checkboxes not updated for UI-01-05 and DASH-05-09 despite work being complete — stale traceability
- No milestone audit run before completion — skipped pre-flight check

### Patterns Established

- Parent gate math component as reusable COPPA verification for any parent-only feature
- Context-aware notification messages (streak > XP > goals > generic priority)
- Module-level constants for game tier thresholds to avoid useCallback dependency churn
- Standalone Web Audio oscillator for sound effects that don't conflict with game audio
- SVG foreignObject for composite icon placement inside progress rings

### Key Lessons

1. Phase numbering across milestones can collide when directory names share the same prefix — consider milestone-prefixed directories
2. Requirements traceability should be updated as part of plan completion, not deferred to milestone archival
3. Kid-friendly UI redesign benefits from having sub-components built first (XPRing, PlayNextButton) before the layout rewrite

### Cost Observations

- Model mix: ~80% opus, ~20% sonnet
- Notable: 7 phases in 4 days — fastest milestone relative to feature count

---

## Milestone: v2.0 — VictoryScreen & XP Unification

**Shipped:** 2026-03-08
**Phases:** 2 | **Plans:** 6

### What Was Built

- useVictoryState hook extraction (792 lines of business logic separated from render)
- VictoryScreen two-panel landscape layout (1105 lines reduced to 327)
- XP as sole reward currency across all student and teacher views
- Free play XP formula: calculateFreePlayXP (10-50 XP range)
- DB migration to drop unused points columns and functions
- Dead code removal: points.js, useTotalPoints.js, scoreComparisonService.js

### What Worked

- Sequential 5-plan XP unification: service layer first, then hooks, then UI, then teacher, then gap closure — clean dependency chain
- Hook extraction pattern: separating business logic from render made VictoryScreen maintainable
- Direct total_xp query pattern: reading from students table instead of aggregating scores was simpler and faster
- Backward-compatible case handling: xp_earned/points_earned dual case prevented DB migration breakage

### What Was Inefficient

- v2.0 archival was incomplete — phases moved to milestones/ but no ROADMAP/REQUIREMENTS archive files created until v2.1 completion
- No formal REQUIREMENTS.md was created for v2.0 — requirements tracked only in ROADMAP and SUMMARY files

### Patterns Established

- Hook extraction for complex components (useVictoryState)
- student-xp query key as standard for all XP cache invalidation
- Teacher XP display: "X XP (Lv. Y)" using calculateLevel()
- calculateFreePlayXP for non-trail XP rewards

### Key Lessons

1. Major refactors (points → XP) benefit from a clear 5-step plan: service → hooks → UI → teacher → gap closure
2. Always create formal REQUIREMENTS.md even for small milestones — retroactive reconstruction is tedious
3. Complete milestone archival immediately after shipping, not deferred

### Cost Observations

- Model mix: ~85% opus, ~15% sonnet
- Notable: 6 plans completed in single day — small focused milestone

---

## Milestone: v2.1 — Forgot Password Recovery

**Shipped:** 2026-03-10
**Phases:** 1 | **Plans:** 2

### What Was Built

- Supabase password reset API with anti-enumeration security
- Inline three-state forgot password flow in LoginForm
- Dedicated /reset-password page with PKCE session detection
- Full EN/HE i18n with RTL support

### What Worked

- Two-plan structure: API+translations first, then UI — clean dependency
- Reusing established patterns: glass card styling, TanStack Query hooks, i18n key namespacing
- Smart session detection via URL param sniffing eliminated unnecessary timeout waits

### What Was Inefficient

- Initially labeled as "standalone" in ROADMAP instead of being scoped to a milestone from the start

### Patterns Established

- Glass card page pattern for standalone auth pages
- Three-state view pattern within a single component (login/forgotPassword/resetSent)
- Cooldown timer pattern for rate-limiting UI actions

### Key Lessons

1. Even single-phase work should be scoped to a milestone version from the start for clean archival
2. URL parameter sniffing is more responsive than timeout-based session detection

### Cost Observations

- Model mix: ~90% opus, ~10% sonnet
- Notable: 2 plans in 2 days — smallest milestone, clean execution

---

## Milestone: v2.2 — Sharps & Flats

**Shipped:** 2026-03-17
**Phases:** 5 | **Plans:** 9

### What Was Built

- patternBuilder regex and ESM import fixes for accidental pitch handling in VexFlow
- Trail enableSharps/enableFlats flag derivation from notePool with auto-grow boundary guard
- 18 treble accidental nodes (F#4, C#4, G#4 sharps + Bb4, Eb4, Ab4, Db4 flats + 2 boss nodes)
- 18 bass accidental nodes (F#3, C#3, G#3 sharps + Bb3, Eb3, Ab3, Db3 flats + 3 boss nodes)
- MIDI-based enharmonic matching in SightReadingGame + subscription gate confirmation
- Full EN/HE i18n with Unicode symbols and Hebrew solfege, skill bubble improvements
- Anchored regex for flat detection preventing natural 'B' false-positive

### What Worked

- Bug-first Phase 01: Fixing silent accidental corruption before authoring content ensured all testing was trustworthy from day one
- Content-then-integration ordering: Writing unit data files (Phases 02-03) before wiring (Phase 04) meant clean separation of data authoring from integration concerns
- Audit-driven gap closure: The milestone audit caught the enableFlats regex false-positive, which became Phase 05 — the audit process prevented a bug from shipping
- TDD for enharmonic matching: Writing failing tests first for noteToMidi revealed the bug was at usage sites, not in the conversion function itself
- Separate sharps/flats units avoided enharmonic confusion with mic pitch detection (mic outputs sharp-form only)

### What Was Inefficient

- Phase 01-04 directories were archived to milestones/v2.2-phases/ before milestone completion — the CLI `roadmap analyze` only counted 1 phase on disk
- SUMMARY frontmatter missing `requirements-completed` for Phases 02 and 03 (metadata-only gap, verified by VERIFICATION.md independently)
- ROADMAP progress table got out of sync with actual phase status (showed "Not started" for completed phases)

### Patterns Established

- Anchored regex pattern (`/^[A-G]b\d/`) as standard for flat-note detection (not `includes('b')`)
- noteToMidi MIDI comparison for enharmonic equivalence at all pitch comparison sites
- focusNotes-first logic in TrailNodeModal for Discovery node skill bubbles
- Dynamic text sizing in skill bubbles for Hebrew accidental labels (>4 char threshold)
- sanitizeAccidentals with negative lookahead for safe ASCII-to-Unicode conversion

### Key Lessons

1. Run milestone audit before archiving phases — Phase 05 gap closure was critical and would have shipped as a bug without the audit
2. Keep phase directories in `.planning/phases/` until milestone completion — early archival breaks CLI tools
3. Content authoring milestones benefit from a strict data→integration→i18n→verification pipeline
4. Mic enharmonic limitations (sharp-form only) should be documented as a constraint early — it shaped the entire unit structure

### Cost Observations

- Model mix: ~85% opus, ~15% sonnet
- Sessions: ~6
- Notable: 36 new nodes (exceeding ~20 target) in 3 days — high content velocity from established patterns

---

## Milestone: v2.3 — Launch Readiness

**Shipped:** 2026-03-17
**Phases:** 6 | **Plans:** 6

### What Was Built

- COPPA-compliant Privacy Policy and Terms of Service pages with glassmorphism
- ESLint errors reduced to 0, React ErrorBoundary with Sentry integration
- Route-based code splitting (17+ lazy imports, 128 chunks)
- First-time onboarding tour (4 steps, Framer Motion, reduced-motion)
- Daily challenge system with deterministic generation and bonus XP

### What Worked

- Single-day execution of 6 phases — small, focused phases with minimal dependencies
- Established patterns (glass cards, i18n, lazy imports) made each phase quick
- Daily challenge system reused existing game infrastructure (NotesRecognitionGame challenge mode)

### What Was Inefficient

- Sentry and Plausible env vars not configured on Netlify — monitoring partially active
- DB migration for daily challenges not auto-applied — manual step still pending

### Patterns Established

- React.lazy() with Suspense for all page-level components
- ErrorBoundary class component pattern with kid-friendly fallback
- Date-seeded deterministic daily content generation

### Key Lessons

1. Production readiness features (monitoring, splitting, legal pages) can ship in a single focused day
2. Daily challenge generation using date seed + modular arithmetic provides deterministic variety without storage

### Cost Observations

- Model mix: ~85% opus, ~15% sonnet
- Notable: 6 phases in 1 day — fastest milestone by phase count

---

## Milestone: v2.4 — Content Expansion

**Shipped:** 2026-03-19
**Phases:** 5 | **Plans:** 10

### What Was Built

- VexFlow key signature glyph rendering with accidental suppression across 4 rendering paths
- 28 key signature trail nodes (14 treble + 14 bass) covering 6 major keys
- Fixed 6/8 compound beat model and correct 3+3 beam grouping
- 14 advanced rhythm nodes (6/8 compound meter + syncopation + dual-concept boss)
- All 42 new nodes wired, subscription-gated, fully translated EN/HE

### What Worked

- Dual-track parallelism: key sig (07-08) and rhythm (09-10) tracks were independent, enabling fast execution
- Infrastructure-first ordering: rendering/generator fixes (07, 09) before content authoring (08, 10) prevented data-before-infrastructure bugs
- Default-deny gate pattern: zero code changes to subscriptionConfig.js — all new nodes are premium by exclusion
- Milestone audit caught tech debt items (verify:patterns bug, directory mislocation) before archival

### What Was Inefficient

- Phase 10 files committed to wrong archive directory (v1.7-phases instead of v2.4-phases) — CLI tools couldn't find them
- SUMMARY.md files missing `one_liner` field — summary-extract tool returned null for all 10 files
- roadmap analyze reported 0 phases/plans because dirs were already in milestones/ before milestone completion

### Patterns Established

- Key signature config pipeline: trail node config → navState → game component → VexFlow rendering
- beamGroupsForTimeSignature null-return for simple time (VexFlow defaults preserved)
- Compound time model: beats=2, subdivisions=6 instead of beats=6
- UNITS metadata backfilling for naming gaps in skillTrail.js
- Hebrew music terminology conventions: מז'ור, משקל מורכב, סינקופה

### Key Lessons

1. Keep phase directories in `.planning/phases/` (not milestones/) until milestone completion — early archival breaks CLI phase counting
2. SUMMARY.md should include `one_liner` field for automated accomplishment extraction
3. Content-heavy milestones (42 nodes) benefit from infrastructure→content→integration pipeline per track
4. Compound time modeling should use musical reality (2 compound beats) not notation shorthand (6 eighth notes)

### Cost Observations

- Model mix: ~80% opus, ~20% sonnet
- Sessions: ~4
- Notable: 42 new trail nodes + infrastructure fixes in 2 days — highest content velocity milestone

---

## Milestone: v2.5 — Launch Prep

**Shipped:** 2026-03-22
**Phases:** 4 | **Plans:** 11

### What Was Built

- Fixed verify:patterns script (.js extension) and synchronized Supabase migration history
- All 574 ESLint warnings eliminated (config fixes, dead code removal, justified suppressions)
- COPPA hard-delete Edge Function: cron-triggered permanent deletion after 30-day grace, CASCADE across all tables
- 89-item production QA checklist executed, 3 blockers found and resolved

### What Worked

- ESLint cleanup used systematic approach: fix configs, then auto-fixable, then manual, then justified suppressions
- Hard-delete function reused established Edge Function patterns (cron secret, service role, Brevo email)
- Production QA checklist caught real issues (consent email, deletion UI, PWA offline) before launch

### What Was Inefficient

- Missing MILESTONES.md entry for v2.5 — CLI created placeholder with 0 phases/plans
- Build tooling fixes should have been caught earlier by CI

### Patterns Established

- Systematic ESLint approach: config > auto-fix > manual > suppress with justification
- Production QA checklist as formal gate before milestone close
- Hard-delete cron with HMAC audit log for COPPA compliance

### Key Lessons

1. Production QA checklists catch issues that automated tests miss (e.g., PWA offline caching)
2. ESLint zero-warning policy is achievable with a systematic 3-day approach
3. COPPA hard-delete needs end-to-end testing with real account lifecycle

### Cost Observations

- Model mix: ~80% opus, ~20% sonnet
- Notable: 11 plans in 3 days — production hardening milestone

---

## Milestone: v2.6 — User Feedback

**Shipped:** 2026-03-23
**Phases:** 2 | **Plans:** 3

### What Was Built

- send-feedback Edge Function with JWT auth, input validation, DB rate limiting (3/hr), Brevo plain-text delivery
- feedback_submissions table with INSERT-only RLS (no SELECT for authenticated users)
- Four-state FeedbackForm component (idle/gated/form/success) with ParentGateMath COPPA gate
- Honeypot anti-spam with silent rejection, 5-minute client cooldown, inline error banners
- Full EN/HE i18n (17 keys each) with RTL layout support
- Unified support Gmail sender for all transactional emails

### What Worked

- Backend-first phase ordering: Edge Function existed and was smoke-tested before UI work began
- Reusing established patterns: ParentGateMath (from v1.9), Edge Function patterns (from v1.8/v2.5), Brevo email (from v1.1)
- Four-state machine design: clean state transitions with no intermediate bugs
- Honeypot + rate limiting + parent gate + JWT = no CAPTCHA needed (simpler UX)
- Human UAT cycle caught RTL alignment issues that automated tests missed

### What Was Inefficient

- MAIL-01/MAIL-02 needed human confirmation (Brevo dashboard + live email) — audit flagged as "partial" until manually verified
- Dead-code branch in FeedbackForm (data?.success check) shipped — unreachable due to Supabase client throwing on non-2xx
- SPAM-05 test case was mislabeled (tested min-length, not cooldown) — actual cooldown covered by FORM-04 tests

### Patterns Established

- INSERT-only RLS + service role COUNT for rate limiting tables (no SELECT policy needed)
- Silent honeypot rejection (fake 200 response to avoid tipping off bots)
- onClick handler on submit button (not form onSubmit) for retry button compatibility
- Recursive setTimeout cooldown with cleanup on unmount

### Key Lessons

1. External service verification (Brevo sender, email delivery) should be marked as human-checkpoint from the start, not discovered during audit
2. Supabase functions-js client throws FunctionsHttpError for non-2xx — data?.success response parsing is unreachable dead code
3. 2-phase milestones ship fast when patterns are well-established — 28 files in 2 days

### Cost Observations

- Model mix: ~80% opus, ~20% sonnet
- Sessions: ~3
- Notable: Smallest content milestone (2 phases, 3 plans) — fast turnaround from established patterns

---

## Milestone: v2.7 — Instrument Practice Tracking

**Shipped:** 2026-03-25
**Phases:** 5 | **Plans:** 12

### What Was Built

- Role-first signup wizard with 4-step student / 2-step teacher flow, birth year simplification, optional parent email
- Daily instrument practice logging via dashboard PracticeLogCard with FSM state machine, dedicated practice streak, 25 XP/day
- "Did you practice?" push notification check-in with priority branching in Edge Function, SW action buttons, iOS URL param fallback
- 52-week practice calendar heatmap in parent portal using react-activity-calendar v3, emerald/gray binary coloring, RTL CSS mirror
- Practice streak milestone celebrations at 5/10/21/30 days with emerald MilestoneCelebrationModal and confetti

### What Worked

- Signup flow redesign in parallel worktree: zero merge conflicts, shipped alongside practice tracking
- TDD for service layers: practiceLogService, practiceStreakService, and dateUtils all had tests before UI work
- Extending existing Edge Function (send-daily-push) instead of creating a new one — simpler cron management
- react-activity-calendar v3 over bespoke SVG — saved significant time on date math and mobile responsiveness
- UI-SPEC + RESEARCH phase before implementation prevented several API mismatches (v2 vs v3 prop names)

### What Was Inefficient

- CLI `roadmap analyze` only counted Phase 1 because Phases 2-5 used a different ROADMAP heading format — required manual archive fixup
- Phase 4 initial implementation used react-activity-calendar heatmap which was later replaced with a monthly calendar grid — re-work cost
- one_liner fields empty in some SUMMARY.md files — automated extraction returned blank

### Patterns Established

- FSM logState (idle/logging/settled) for dashboard action cards with optimistic cache updates
- Practice check-in priority branching in push notification cron (instrument practice > app-usage)
- Monthly calendar heatmap pattern with CSS scaleX(-1) for RTL support
- Module-level MILESTONES constant to avoid useCallback dependency churn in celebration modals
- fire-and-forget DB write-back for non-critical metadata (milestone celebrated tracking)

### Key Lessons

1. Research phase saves implementation time: v3 prop name corrections from RESEARCH.md prevented API misuse
2. Extending existing Edge Functions (instead of creating new ones) simplifies cron management and dedup
3. RTL heatmap/calendar support needs RTL-specific testing — CSS mirror approach works but needs label suppression
4. Parallel worktree workflow continues to prove reliable for isolated features shipping alongside main work

### Cost Observations

- Model mix: ~75% opus, ~25% sonnet (more sonnet for routine coding tasks)
- Sessions: ~4
- Notable: 5 phases in 3 days with signup redesign running in parallel — efficient execution from established patterns

---

## Milestone: v2.8 — Introductory Single-Note Game

**Shipped:** 2026-03-26
**Phases:** 2 | **Plans:** 5

### What Was Built

- NoteSpeedCards speed card game for single-note trail nodes with conveyor animation, 3-lives, combo, 4-tier speed ramp
- NOTE_CATCH exercise type wired end-to-end (constant, node data, TrailNodeModal routing, App.jsx, i18n)
- Dedicated Parent Portal with gate-first architecture, math gate on every visit, QuickStatsGrid, 4 content sections
- Desktop sidebar + mobile Settings card entry points for Parent Zone
- AppSettings cleanup: subscription/streak/notification sections migrated to Parent Portal

### What Worked

- Gate-first architecture for Parent Portal — math gate on every visit eliminates session-based COPPA workarounds
- Reusing established exercise type wiring pattern from v2.9 for NOTE_CATCH integration
- Migrating parent-only features from Settings to Parent Portal simplified both pages

### What Was Inefficient

- Parent Portal was scope-added mid-milestone (originally just the speed card game) — increased milestone size but correct decision

### Key Lessons

1. Gate-first architecture for parent features is simpler than session-based gates
2. Parent-only features belong in Parent Portal, not scattered across Settings

### Cost Observations

- Model mix: ~80% opus, ~20% sonnet
- Notable: 2 phases, 5 plans in 1 day — small focused milestone

---

## Milestone: v2.9 — Game Variety & Ear Training

**Shipped:** 2026-03-30
**Phases:** 5 | **Plans:** 15

### What Was Built

- Data foundation refactor: EXERCISE_TYPES enum, validateExerciseTypes, TRAIL_TAB_CONFIGS, ComingSoon pattern
- RhythmReadingGame (tap-along) with VexFlow staff, sweeping cursor, PERFECT/GOOD/MISS feedback
- RhythmDictationGame (hear-and-pick) with multi-step playback, 3-card distractor choices
- NoteComparisonGame with usePianoSampler, higher/lower comparison, tier-band narrowing
- IntervalGame with step/skip/leap identification, ascending-first progression, PianoKeyboardReveal
- 14 ear training trail nodes (Sound Direction + Interval Explorer), Ear Training tab on TrailMap
- ArcadeRhythmGame falling-tile arcade with rAF animation, 3-lives, combo/on-fire mode
- 36 rhythm nodes remapped to mixed exercise types (MetronomeTrainer/RhythmReading/Dictation/Arcade)

### What Worked

- Infrastructure-first Phase 7: EXERCISE_TYPES enum + TRAIL_TAB_CONFIGS made all subsequent phases trivially wire-able
- Shared utility pattern: earTrainingUtils.js (8 exports) powered both ear training games from one module
- Parallel worktree execution for independent game implementations
- ComingSoon placeholder pattern for future exercise types — zero broken routes
- Service worker version bump (v9) as explicit deployment step

### What Was Inefficient

- RhythmReadingGame cursor alignment issues discovered only during UAT — cursor bounds should have been tested visually earlier
- RhythmDictationGame pacing issues (auto-advance too fast, wrong-answer timing) required gap closure plans in v3.0
- iOS gesture gate missing from both rhythm games — discovered in v3.0 Phase 15 UAT

### Patterns Established

- TRAIL_TAB_CONFIGS data-driven tab rendering (zero hardcoded category references in TrailMap)
- usePianoSampler hook for runtime WAV loading with iOS AudioContext resume guard
- scoreTap extracted as separate utility module for binary rhythm scoring
- ComingSoon placeholder component for unreleased exercise types
- Two-unit ear training structure: Unit 1 (Sound Direction) → Unit 2 (Interval Explorer)

### Key Lessons

1. New game components need visual/device UAT before milestone close — cursor and pacing bugs slipped through
2. iOS gesture gate should be a checklist item for any component using AudioContext
3. Data-driven tab configs (TRAIL_TAB_CONFIGS) scale much better than hardcoded category references
4. Shared utility modules (earTrainingUtils) save significant time when building similar game variants

### Cost Observations

- Model mix: ~75% opus, ~25% sonnet
- Sessions: ~5
- Notable: 5 phases, 15 plans, 8 new game/exercise types in 4 days — highest game variety per milestone

---

## Milestone: v3.0 — Cleanup & Polish

**Shipped:** 2026-04-03
**Phases:** 5 | **Plans:** 11

### What Was Built

- Trail rhythm config fixes: difficulty mapping (easy→beginner), allowedPatterns wired through all 4 rhythm games
- Utility consolidation: noteNameToMidi, calculateStarsFromPercentage, verifyStudentDataAccess to canonical locations
- Console logging cleanup: zero unguarded console.log/debug in production, ESLint no-console regression guard
- TeacherDashboard lazy-loaded (434 kB chunk), dead code removed, XP locale string migration
- Daily goals verified for all 11 exercise types, deploy sequencing documented
- Phase 08 UAT completed on real devices (rhythm games, piano tone, PWA cache)
- RhythmReadingGame bug fixes: cursor alignment, back button, iOS gesture gate
- RhythmDictationGame UX: READY phase gate, replay-callback advance, G4.mp3 sound unification
- ESLint comment placement fixed, build pipeline verified, all audit tech debt closed

### What Worked

- Milestone audit before completion: caught ESLint comment misplacement and ROADMAP inaccuracies that became Phase 16
- Independent phases: 12-14 could execute in any order, only Phase 15 had dependencies
- UAT-driven gap closure: Phase 15 plans 03-05 were created from real-device testing results — fixed real user-facing bugs
- Phase 16 as dedicated cleanup phase: closed all audit debt items in one focused plan

### What Was Inefficient

- Phase 15 grew from 2 planned tasks to 5 plans after UAT revealed rhythm game bugs — scope expansion was necessary but unpredictable
- npm run verify:trail still fails (SVG import incompatibility) — pre-existing from v2.9 Phase 7, build uses vite build directly

### Patterns Established

- allowedPatterns=null (free-play) vs array (trail-constrained) in getPattern() for rhythm generation
- READY phase FSM gate for user-controlled pacing before auto-play sequences
- Replay-callback advance (onComplete instead of hardcoded timeout) for timing-safe auto-advance
- iOS gesture gate as checklist item for all AudioContext-dependent game components
- eslint-disable-line as inline trailing comment on same line as suppressed statement

### Key Lessons

1. Cleanup milestones should budget for UAT-discovered bugs — Phase 15 tripled in scope from real-device testing
2. Milestone audit process works: Phase 16 gap closure caught and fixed issues that would have been carried as permanent debt
3. Pre-existing build tool issues (SVG imports in Node.js) should be fixed rather than worked around — the workaround persists across milestones
4. iOS gesture gate is now a recurring pattern — should be part of any new game component template

### Cost Observations

- Model mix: ~80% opus, ~20% sonnet
- Sessions: ~5
- Notable: 125 commits over 5 days — most commits due to UAT bug-fix cycle in Phase 15

---

## Milestone: v3.1 — Trail-First Navigation

**Shipped:** 2026-04-05
**Phases:** 3 | **Plans:** 5

### What Was Built

- Trail wired as primary nav destination (first in sidebar/tabs), index route renders TrailMapPage, dashboard moved to /dashboard
- NavLink end prop threaded through config, sidebar, and bottom navigation for correct active states
- TrailMapPage converted from fixed overlay to AppLayout child, FAB repositioned for mobile tabs
- Dashboard compacted: hero removed, glass greeting bar (avatar + name + level pill), tighter card spacing
- VictoryScreen simplified to Duolingo-style single-destination flow (trail/challenge/free play)
- GameOverScreen hardcoded redirect replaced with React Router navigation and smart trail tab routing

### What Worked

- Small focused milestone: 3 phases, 5 plans, 2 days — clean execution with clear dependency chain
- Phase 17 → 18/19 dependency structure: nav restructuring first, then dashboard and post-game independently
- Parallel worktree execution for Phase 19 plans: both plans (VictoryScreen + GameOverScreen) ran simultaneously with clean locale file merges
- Leveraging existing patterns: getTrailTabForNode, handleNavigateToTrail, NavLink end prop were already in codebase — just needed wiring
- CONTEXT.md + DISCUSSION-LOG.md before planning caught the "remove Continue to Node" simplification early

### What Was Inefficient

- REQUIREMENTS.md traceability not updated for Phases 17 and 18 — NAV-01-04 and DASH-01-04 showed as "Pending" despite being complete
- Phase 18 plan checkbox in ROADMAP.md not ticked (showed `[ ]` instead of `[x]`) despite summary existing
- STATE.md accumulated decisions from all 3 phases but wasn't cleaned during phase transitions

### Patterns Established

- NavLink `end` prop threading for accurate active states in nested route structures
- Three-mode button pattern in VictoryScreen: trail (single CTA), challenge (trail), free play (dual buttons)
- nodeId prop threading to GameOverScreen for context-aware exit navigation
- backgroundClass prop in AppLayout for route-specific body backgrounds

### Key Lessons

1. Requirements traceability should be updated during plan execution (not just at milestone boundary) — 8/10 requirements were stale
2. Small navigation milestones (3 phases) ship fast when they build on existing infrastructure
3. Parallel worktree execution works well even when plans touch shared files (locale JSONs) — different JSON sections merge cleanly
4. "Continue to Next Node" removal (D-02) was the right call — simpler single-CTA matches Duolingo's proven pattern

### Cost Observations

- Model mix: ~70% opus, ~30% sonnet (executors ran as sonnet)
- Sessions: ~3
- Notable: 3 phases, 5 plans in 2 days — fast navigation-focused milestone

---

## Milestone: v3.2 — Rhythm Trail Rework

**Shipped:** 2026-04-13
**Phases:** 7 active (20-26) + 2 skipped (27, 28) | **Plans:** 16

### What Was Built

- Curriculum audit of all 56 rhythm nodes with one-concept policy and locked game-type assignment
- 130+ hand-crafted tagged rhythm patterns in synchronous JS module (replaced random generative approach)
- RhythmPatternGenerator service with resolveByTags/resolveByIds; all 56 nodes migrated to patternTags/patternIds
- PULSE exercise type for tap-with-the-beat metronome-only practice (Unit 1 Node 1)
- Build validator extended: tag existence, coverage, duration safety, game-type policy enforcement
- UX polish: 100ms timing forgiveness, game rename (Listen & Tap), "Almost!" feedback, progressive measures, Kodaly syllables
- Multi-angle rhythm games: VisualRecognitionRenderer + SyllableMatchingRenderer
- MixedLessonGame engine with interleaved question types and crossfade transitions
- Phase 26 restored 12 source files reverted by worktree collateral damage (commit 13cff54)

### What Worked

- Audit-first phase ordering: Phase 20 curriculum audit produced a reference document that Phase 22 implementation followed exactly — eliminated mid-implementation pedagogical debate
- Synchronous JS pattern module: simple Vite-bundled import, zero async/JSON loading complexity, fast tests
- Build validator as ground truth: validateTrail catches duration safety + tag existence + coverage on every commit
- Restored regression in a single dedicated phase (26) with diff-based recovery rather than re-implementing

### What Was Inefficient

- Worktree collateral damage at commit 13cff54 deleted Phase 23/24/25 files; required Phase 26 to restore
- Phases 27 and 28 skipped without ceremony (verification docs + tech debt) — CODE-01/02/03 carried as v3.3 work
- No formal milestone audit run before close (caught structural issues only at v3.3 audit time)
- SUMMARY.md `requirements-completed` frontmatter missing across many plans — REQUIREMENTS.md and VERIFICATION.md became sole load-bearing sources

### Patterns Established

- Tag-based pattern resolution as preferred curriculum-control mechanism (replaces duration allowlists)
- One-concept-per-node policy: every pedagogical concept introduced in exactly one Discovery node
- Build-time pattern coverage validator: catches missing patterns before runtime fallback
- Crossfade key pattern for MixedLessonGame: must include currentIndex (not just fadeKey) or consecutive same-type questions freeze
- Worktree diff-check after merging branches to catch unexpected deletions

### Key Lessons

1. Always diff-check the working tree after merging worktree branches — collateral deletions are silent
2. Skipping verification phases creates load-bearing dependency on REQUIREMENTS.md alone, which drifts from VERIFICATION.md evidence
3. Audit-first phase pattern (lock decisions before code) works well for content-heavy refactors
4. Curated patterns + tags scale better than random generation for pedagogical control

### Cost Observations

- Model mix: ~75% opus, ~25% sonnet
- Sessions: ~6
- Notable: 9-phase milestone with mid-stream rework (Phase 26 restoration) — net 16 plans across 7 active phases

---

## Milestone: v3.3 — Rhythm Trail Fix & Polish

**Shipped:** 2026-05-04
**Phases:** 5 (29-33) | **Plans:** 20 (1 skipped per UAT)
**Stats:** 102 commits, 135 files changed, +20,147 / -1,868 LOC, 22 days

### What Was Built

- Code-quality fixes: stale-closure ref pattern (currentIndexRef), rest-aware score filter (no >100% scores), empty-pool guard
- Data/curriculum fixes: rest-aware pattern filtering (allowRests/patternNeedsRests with exact-gap matching), section titles corrected for all 8 rhythm units in EN+HE, combined-values duration variety
- useEnsureAudioReady shared hook (extracted from PulseQuestion's proven prewarm sequence) eliminating dictation listen-button gainNodeRef race
- Eighths discovery plays all 4 beamed pairs with pitch alternation via local wrapper inside playDemo
- holdScoringUtils + HoldRing + TapArea hold mode wired into RhythmTapQuestion (sustained piano audio, 3-tier scoring); PulseQuestion structurally wired but dormant pending curriculum hookup
- Speed challenge: TOTAL_PATTERNS=8 + lastPatternRef no-consecutive dedup + cumulative speed-pool tags (U2-U8 with per-node validator-driven pruning)
- Boss differentiation: cumulative duration tags + measureCount=4 + dictation-heavy mix + strict timing for boss_rhythm_6/8; 2-second amber/gold "BOSS FIGHT" intro overlay + gold confetti; PEDAGOGY.md authored
- 6 Mix-Up nodes removed entirely with cascade renumbering and subscriptionConfig FREE_RHYTHM_NODE_IDS in sync
- ArcadeRhythmGame migrated to tag-based resolveByTags/resolveByAnyTag with D-09 central duration filter and D-10 per-session coverage rule
- Phase 33 verify-first manual UAT triaged 13 reported issues; rate-limit migration deployed via Dashboard SQL Editor; two post-deploy survivors fixed (SKILL_UNITS, achievements points)

### What Worked

- Verify-first triage in Phase 33: only fix confirmed survivors after retest — Plan 33-07 skipped per D-16 (Issues 1+4 resolved-by-deploy) saved a wave of unneeded work
- Wave-gated execution: Wave 0 audit + Wave 1 manual UAT gate Wave 2 fixes; Wave 3 contingent fires only if user retest demands it
- Stash preservation pattern: Chunk A salvaged via reference-only fresh edit; stash@{0} preserved intact for future Chunks B-E
- Shared prewarm hook (useEnsureAudioReady) extracted from a proven path (PulseQuestion) and ported to broken path (RhythmDictationQuestion) — minimum-risk refactor
- Tag-based resolver migration in ArcadeRhythmGame ran behind a fallback to OLD getPattern, allowing safe atomic cutover
- Milestone audit caught 2 blockers + 3 warnings before close; close-out commits closed BLOCKER-1 and WARNING-2 same day

### What Was Inefficient

- Worktree base-staleness hit Plan 33-08 (forked off pre-Wave-3 main); resolved via cherry-pick of 33-08 commits — flagged as recurring concern
- Two post-deploy survivors (SKILL_UNITS labels, student_achievements.points insert) caught only because user retested — a pre-deploy gate would have caught both
- No VERIFICATION.md created for Phases 31 or 32 (Phase 33 intentional per CONTEXT D-06; 31/32 were quality risk)
- Phase 30 VERIFICATION frontmatter `passed` conflicts with body `gaps_found` — file not re-run end-to-end after fix commit 4792b39
- DATA-02 vacuously satisfied: PulseQuestion uses hardcoded PULSE_BEATS and never calls resolveByTags, so the rest-aware filter is structurally untested for the pulse path — re-triage carried to next milestone
- PLAY-01 narrowed at close (pulse hold path dormant) rather than extending buildRhythmTapConfig to derive beats from patternTags

### Patterns Established

- useEnsureAudioReady shared hook for AudioContext-dependent components — extract proven prewarm sequence, port to broken paths
- Verify-first manual UAT pattern: only fix what survives a retest; mark resolved-by-deploy items closed without code changes
- Wave-gated phase execution: Wave 1 manual UAT gates Wave 2 fixes; Wave 3 contingent layers fire only if retest still reports issues
- Tag-based resolver with central duration filter (D-09) + per-session coverage rule (D-10) for arcade-style games
- BossIntroOverlay gating on isBoss only (not MINI_BOSS) — preserves visual differentiation between full and mini boss
- Stash preservation via fresh-edit reference (Option A): salvage chunks individually, leave stash intact

### Key Lessons

1. Verify-first triage saves wasted work: not every reported issue is a code bug — many resolve via deploy or environment
2. Pre-deploy UAT gate would catch survivors that post-deploy retest catches — add to launch-readiness checklist
3. Worktree base-staleness is a recurring concern: rebase or cherry-pick before assuming a worktree branch's base is current
4. Vacuously-satisfied requirements (filter present but never exercised on intended path) are a documentation trap — explicit traceability note required
5. Boss UX needs both content levers (cumulative tags, timing tier) AND ceremony (intro overlay, gold confetti) to feel distinct
6. Cumulative tags pattern scales: applied retroactively across U2-U8 with validator-driven pruning ensures no node violates duration safety

### Cost Observations

- Model mix: ~70% opus, ~30% sonnet (executors largely sonnet)
- Sessions: ~8
- Notable: 22-day milestone with 102 commits — extended timeline due to manual UAT cycle and Wave 3 contingent re-fire after retest

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change                                                                               |
| --------- | ------ | ----- | ---------------------------------------------------------------------------------------- |
| v1.0      | 4      | 15    | Security hardening — established RLS and auth patterns                                   |
| v1.1      | 1      | 2     | Edge Function + Brevo email pattern                                                      |
| v1.2      | 2      | 4     | Trail system stabilization                                                               |
| v1.3      | 5      | 14    | Redesign with build-time validation                                                      |
| v1.4      | 6      | 13    | Celebration system + codebase cleanup                                                    |
| v1.5      | 4      | 10    | Visual redesign — CSS-only backgrounds                                                   |
| v1.6      | 5      | 10    | Orientation handling — platform-specific                                                 |
| v1.7      | 5      | 12    | Audio architecture overhaul                                                              |
| v1.8      | 6      | 13    | Monetization — Lemon Squeezy + content gate                                              |
| v1.9      | 7      | 15    | Engagement features — parallel execution                                                 |
| v2.0      | 2      | 6     | XP unification — sequential dependency chain                                             |
| v2.1      | 1      | 2     | Password recovery — smallest milestone                                                   |
| v2.2      | 5      | 9     | Sharps & Flats content — audit-driven gap closure                                        |
| v2.3      | 6      | 6     | Launch readiness — production features in 1 day                                          |
| v2.4      | 5      | 10    | Content expansion — dual-track infrastructure + content                                  |
| v2.5      | 4      | 11    | Launch prep — ESLint zero-warning, COPPA hard-delete, QA checklist                       |
| v2.6      | 2      | 3     | User feedback — backend-first, pattern reuse, 2-day turnaround                           |
| v2.7      | 5      | 12    | Practice tracking — parallel worktree, TDD services, Edge Function extension             |
| v2.8      | 2      | 5     | Single-note game + Parent Portal gate-first architecture                                 |
| v2.9      | 5      | 15    | Game variety — 8 new exercise types, data-driven trail tabs                              |
| v3.0      | 5      | 11    | Cleanup & polish — utility consolidation, UAT-driven bug fixes, audit debt closure       |
| v3.1      | 3      | 5     | Trail-first navigation — trail as primary destination, compact dashboard, post-game flow |
| v3.2      | 7      | 16    | Rhythm trail rework — curated patterns, MixedLessonGame engine, multi-angle games        |
| v3.3      | 5      | 20    | Rhythm trail fix & polish — manual UAT triage, hold sustain, boss differentiation        |

### Top Lessons (Verified Across Milestones)

1. Service-layer logic (not Postgres functions) is more testable and maintainable for complex business rules
2. Reusable UI patterns (glass cards, parent gate, celebration tiers) compound across milestones
3. Phase numbering needs clear milestone scoping to avoid directory collisions
4. Always scope work to a milestone version from the start — "standalone" phases create archival debt
5. Complete milestone archival immediately after shipping — deferred archival requires retroactive reconstruction
6. Bug-first phases prevent cascading silent failures in content-heavy milestones
7. Milestone audits catch real bugs — Phase 05 gap closure was audit-driven and prevented a false-positive ship
8. Infrastructure-first ordering (rendering/generator fixes before content) prevents data-before-infrastructure bugs
9. Keep phase directories in .planning/phases/ until milestone completion — early archival breaks CLI tools
10. External service verification (email delivery, sender changes) should be explicit human-checkpoint tasks from planning, not discovered during audit
11. Cleanup milestones should budget for UAT-discovered scope expansion — real-device testing reveals bugs that unit tests miss
12. iOS gesture gate is a recurring requirement for AudioContext-dependent components — treat as checklist item in game component templates
13. Verify-first manual UAT (only fix confirmed survivors after retest) saves wasted work in fix-and-polish milestones
14. Worktree base-staleness is a recurring concern — rebase or cherry-pick before assuming a branch's base is current
15. Vacuously-satisfied requirements (filter present but unreached) require explicit traceability documentation
16. Pre-deploy UAT gate catches survivors that post-deploy retest catches — should be a launch-readiness checklist item
