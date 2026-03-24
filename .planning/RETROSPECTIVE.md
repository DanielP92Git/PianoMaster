# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 4 | 15 | Security hardening — established RLS and auth patterns |
| v1.1 | 1 | 2 | Edge Function + Brevo email pattern |
| v1.2 | 2 | 4 | Trail system stabilization |
| v1.3 | 5 | 14 | Redesign with build-time validation |
| v1.4 | 6 | 13 | Celebration system + codebase cleanup |
| v1.5 | 4 | 10 | Visual redesign — CSS-only backgrounds |
| v1.6 | 5 | 10 | Orientation handling — platform-specific |
| v1.7 | 5 | 12 | Audio architecture overhaul |
| v1.8 | 6 | 13 | Monetization — Lemon Squeezy + content gate |
| v1.9 | 7 | 15 | Engagement features — parallel execution |
| v2.0 | 2 | 6 | XP unification — sequential dependency chain |
| v2.1 | 1 | 2 | Password recovery — smallest milestone |
| v2.2 | 5 | 9 | Sharps & Flats content — audit-driven gap closure |
| v2.3 | 6 | 6 | Launch readiness — production features in 1 day |
| v2.4 | 5 | 10 | Content expansion — dual-track infrastructure + content |
| v2.5 | 4 | 11 | Launch prep — ESLint zero-warning, COPPA hard-delete, QA checklist |
| v2.6 | 2 | 3 | User feedback — backend-first, pattern reuse, 2-day turnaround |
| v2.7 | 5 | 12 | Practice tracking — parallel worktree, TDD services, Edge Function extension |

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
