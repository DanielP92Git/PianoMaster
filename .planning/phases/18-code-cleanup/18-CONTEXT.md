# Phase 18: Code Cleanup - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove orphaned code, dead dependencies, and unused assets from the codebase after completing all v1.4 feature phases (13-17). Optimize service worker cache strategy. Validate bundle health with before/after metrics.

</domain>

<decisions>
## Implementation Decisions

### Dead code scope
- Deep audit across the entire codebase — not just known items
- Remove `progressMigration.js` (175 lines, explicitly documented as dead)
- Scan for unused exports, components, hooks, utilities, services, and CSS classes
- Audit translation keys in en.json and he.json — remove keys not referenced in any component
- Claude's discretion on single-use abstractions: inline where it simplifies, leave where the abstraction adds clarity

### Dependency audit
- Claude decides scope: remove unused packages, and consider lighter alternatives if heavy bloat is found
- Focus on production dependencies only — devDependencies are out of scope
- Add bundle visualization tooling (e.g., rollup-plugin-visualizer) as a permanent dev dependency
- No specific suspects — let the audit discover what's unused

### Service worker cache strategy
- Include SW cache optimization in this phase (no longer deferred)
- No known user-facing issues — this is preventive cleanup and optimization
- Re-enable caching for celebration components (were excluded in Phase 13 for accessibility iteration; celebrations are now stable)
- Offline functionality is important — kids may practice with spotty wifi, so caching should be robust
- Review overall cache strategy for correctness and completeness

### Verification strategy
- Test suite has good coverage — passing tests is primary confidence signal
- Each removal should be its own atomic commit for easy individual revert
- Run full production build AND lint after cleanup to catch issues
- Document before/after bundle size comparison in commit messages

</decisions>

<specifics>
## Specific Ideas

- Before/after bundle size metrics should be recorded and included in final commit or PR summary
- Bundle visualizer should persist as dev tooling for future maintenance
- Atomic commits mean each logical removal (one file, one package, one set of translation keys) gets its own commit

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-code-cleanup*
*Context gathered: 2026-02-09*
