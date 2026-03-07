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

### Top Lessons (Verified Across Milestones)

1. Service-layer logic (not Postgres functions) is more testable and maintainable for complex business rules
2. Reusable UI patterns (glass cards, parent gate, celebration tiers) compound across milestones
3. Phase numbering needs clear milestone scoping to avoid directory collisions
