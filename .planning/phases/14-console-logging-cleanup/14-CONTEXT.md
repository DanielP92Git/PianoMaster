# Phase 14: Console Logging Cleanup - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Gate all debug logging behind DEV flag so production builds have a clean browser console. Covers QUAL-06: reduce unguarded console.log/debug calls to <50 (currently 25 — all need gating or removal). Does not touch console.warn or console.error.

Not in scope: warn/error audit, new logging infrastructure, god component refactoring, or any feature work.

</domain>

<decisions>
## Implementation Decisions

### Cleanup Strategy
- **D-01:** Remove most console.log/debug calls entirely — they are stale debug artifacts. Gate the few that provide genuine development value behind inline `if (import.meta.env.DEV)` checks (same pattern as `apiAuth.js:241`).
- **D-02:** No shared dev-logger utility. With only 25 calls, a wrapper is over-engineering. Inline DEV guards are sufficient.

### Scope Boundary
- **D-03:** Only `console.log` (10) and `console.debug` (15) are in scope. All 95 `console.warn` and 255 `console.error` calls are considered intentional production logging and are left untouched.

### Regression Prevention
- **D-04:** Add ESLint `no-console` rule targeting `console.log` and `console.debug` (allow `warn`, `error`, `info`). Integrates with existing husky + lint-staged pre-commit hook to prevent future unguarded debug logs from being committed.

### Claude's Discretion
- ESLint rule severity (`"warn"` vs `"error"`) — pick whichever best balances DX with enforcement
- Which specific console.log/debug calls to keep (gated) vs remove entirely — judge by whether the log provides useful development context
- Whether to use `// eslint-disable-next-line no-console` for intentionally gated DEV logs or structure the code so the rule doesn't trigger

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing DEV-guard Patterns
- `src/components/games/sight-reading-game/SightReadingGame.jsx:53` — `__srLog` helper pattern (DEV-gated logging function)
- `src/services/apiAuth.js:241` — inline `if (import.meta.env.DEV)` guard pattern
- `src/services/apiAuth.js:378` — DEV-gated function export pattern

### ESLint Configuration
- `.eslintrc.cjs` or `eslint.config.js` — existing ESLint config where `no-console` rule will be added

### Top Files by console.log/debug Count
- `src/services/apiTeacher.js` — 31 total console calls (highest)
- `src/components/games/sight-reading-game/SightReadingGame.jsx` — 19 total (most already DEV-gated via `__srLog`)
- `src/services/skillProgressService.js` — 17 total
- `src/hooks/useAudioEngine.js` — 16 total
- `src/services/practiceService.js` — 13 total

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `__srLog` pattern in SightReadingGame.jsx: `const __srLog = import.meta.env.DEV ? (...args) => console.log(...args) : () => {}` — can be referenced but not mandated as a project-wide pattern
- Existing `import.meta.env.DEV` inline guards in apiAuth.js — the preferred simple pattern

### Established Patterns
- Vite's `import.meta.env.DEV` is the standard build-time flag (tree-shaken in production)
- husky + lint-staged runs ESLint on staged files at pre-commit — new rule will be enforced automatically

### Integration Points
- ESLint config file — add `no-console` rule
- Pre-commit hook — already wired via husky + lint-staged, no changes needed

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard cleanup approach with inline DEV guards and ESLint regression prevention.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-console-logging-cleanup*
*Context gathered: 2026-03-31*
