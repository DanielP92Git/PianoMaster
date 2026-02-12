# Phase 12: Validation & Cleanup - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify the new 93-node trail system works with production data and remove all legacy code. This is the final phase of v1.3 Trail System Redesign - no new features, only validation and cleanup.

</domain>

<decisions>
## Implementation Decisions

### Legacy Code Removal
- Delete LEGACY_NODES entirely (git history preserves if needed)
- Delete nodeGenerator.js completely - all nodes are now static
- Claude audits for ALL dead code related to old trail system (unused imports, dead functions, orphaned files)
- Fix all confirmed dead code found during audit - no report-only

### Progress Data Handling
- Silent deletion of orphaned progress records (XP already preserved per Phase 11)
- Cleanup via one-time migration at deploy (not scheduled job)
- Migration logs count of deleted records for audit trail
- No special handling for mid-session users - page refresh gets new system

### E2E Verification Scope
- Claude decides testing approach (manual, automated, or smoke script)
- Full regression testing: XP, levels, boss nodes, prerequisites, daily goals, all trail features
- Use production data snapshot to verify real user scenarios
- Stop on any failure - must fix before proceeding, no "acceptable" failures

### Deployment Approach
- Prepare git revert commit for rollback (manual trigger if needed)
- Manual check-in for first 24-48 hours post-deploy
- Update documentation (README, CLAUDE.md) to reflect new 93-node trail system
- Claude determines appropriate "shipped" criteria

### Claude's Discretion
- Specific testing approach (manual walkthrough vs automated tests vs smoke script)
- Ship timing criteria (immediate vs soak period)
- Which documentation sections need updates

</decisions>

<specifics>
## Specific Ideas

- Clean break philosophy: delete legacy code entirely rather than commenting/deprecating
- Production snapshot testing catches edge cases that synthetic data misses
- Logging deletion counts provides audit trail without complicating cleanup

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 12-validation-cleanup*
*Context gathered: 2026-02-04*
