# Phase 11: Integration & Cutover - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Atomic switch from legacy nodes to new structure with full progress preservation. This phase:
- Updates SKILL_NODES to use only expandedNodes (stop spreading LEGACY_NODES)
- Resets user trail progress via database migration
- Ensures database triggers work with new node IDs
- Validates the cutover with build + manual smoke test

Legacy code removal (LEGACY_NODES array deletion, nodeGenerator.js removal) belongs to Phase 12.

</domain>

<decisions>
## Implementation Decisions

### Progress Preservation Strategy
- Full progress reset with v1.3 (as documented in PEDAGOGY.md)
- Silent reset — no in-app modal or email notification
- Keep user XP totals — XP represents overall effort and should persist
- Clear daily goals — start fresh with goals that reference new node system
- Delete both `student_skill_progress` AND exercise-level progress
- Reset via database migration (Supabase migration script at deploy time)
- Reset all accounts uniformly (including test/demo accounts)

### Cutover Atomicity
- Verification: Build passes (`npm run build`) + manual smoke test of trail navigation
- SKILL_NODES updated to only spread expandedNodes (core cutover change)

### Rollback Plan
- Take manual database backup before running migration
- Keep rollback option available for 1 week after cutover
- Backup allows restore if major issues surface

### Legacy Code Handling
- LEGACY_NODES array stays in skillTrail.js but is NOT spread into SKILL_NODES
- Add deprecation comment to LEGACY_NODES marking it for Phase 12 removal
- nodeGenerator.js kept for now — cleanup deferred to Phase 12

### Claude's Discretion
- Deployment approach (single PR vs staged rollout vs feature flag)
- Maintenance window during cutover (if any)
- Database trigger updates (this phase vs Phase 12)
- Rollback strategy details (git revert + restore vs fix forward)

</decisions>

<specifics>
## Specific Ideas

- Progress reset is already documented in PEDAGOGY.md — this aligns with that decision
- XP preservation maintains user motivation despite trail reset
- 1-week rollback window gives time to catch edge cases without indefinite complexity

</specifics>

<deferred>
## Deferred Ideas

- LEGACY_NODES array deletion — Phase 12
- nodeGenerator.js removal — Phase 12
- Production data snapshot testing — Phase 12

</deferred>

---

*Phase: 11-integration-cutover*
*Context gathered: 2026-02-04*
