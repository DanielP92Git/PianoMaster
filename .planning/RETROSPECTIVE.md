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

### Top Lessons (Verified Across Milestones)

1. Service-layer logic (not Postgres functions) is more testable and maintainable for complex business rules
2. Reusable UI patterns (glass cards, parent gate, celebration tiers) compound across milestones
3. Phase numbering needs clear milestone scoping to avoid directory collisions
4. Always scope work to a milestone version from the start — "standalone" phases create archival debt
5. Complete milestone archival immediately after shipping — deferred archival requires retroactive reconstruction
6. Bug-first phases prevent cascading silent failures in content-heavy milestones
7. Milestone audits catch real bugs — Phase 05 gap closure was audit-driven and prevented a false-positive ship
