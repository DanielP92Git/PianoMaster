# Phase 13: ESLint Cleanup - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate all ~574 ESLint warnings (0 errors) so that `npm run lint` reports 0 warnings and 0 errors. Every intentionally suppressed warning must have an `eslint-disable-next-line` comment with a written rationale. Tests and build must pass after all changes.

Warning breakdown:
- `no-undef`: 330 (~320 test globals, ~10 config globals)
- `no-unused-vars`: 183 (dead imports, unused assigned variables)
- `react-hooks/exhaustive-deps`: 41 (missing dependency arrays)
- `react-refresh/only-export-components`: 18 (non-component exports)

</domain>

<decisions>
## Implementation Decisions

### Test File Globals (LINT-01)
- Add a test file override in `eslint.config.js` with vitest globals (`vi`, `expect`, `it`, `test`, `describe`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`)
- Target pattern: `**/*.test.{js,jsx}` and `**/*.spec.{js,jsx}` and `src/test/**/*.{js,jsx}`
- This single config change eliminates ~320 `no-undef` warnings

### Config File Globals
- Add a separate override for `*.config.js` files with `globals.node` (handles `process`, `module`)
- Only affects `vite.config.js` and `tailwind.config.js`

### Unused Variables (LINT-02)
- Remove all unused imports and variables — do not leave dead code
- Configure `no-unused-vars` with `argsIgnorePattern: '^_'` and `varsIgnorePattern: '^_'` for intentional unused params
- For catch blocks and destructured rest patterns, prefix with underscore (`_error`, `_unused`) instead of suppressing
- For truly intentional unused variables that can't use underscore convention, remove them

### Hook Dependencies (LINT-03)
- Fix dependency arrays where safe (add missing deps)
- For intentionally omitted deps (one-time mount effects, stable refs), suppress with `eslint-disable-next-line react-hooks/exhaustive-deps` and a written reason
- Justification format: `// eslint-disable-next-line react-hooks/exhaustive-deps -- [specific reason]`
- Example: `// eslint-disable-next-line react-hooks/exhaustive-deps -- one-time mount effect, deps intentionally empty`
- Run tests after each batch of hook dep fixes to catch behavior changes

### Suppression Policy (LINT-04)
- `react-refresh/only-export-components`: Suppress with justification (these are dev-only HMR hints, not worth restructuring)
- No hard cap on suppression count, but every single `eslint-disable` must have a written rationale
- Suppression format: `// eslint-disable-next-line <rule> -- <reason>`
- No block-level `/* eslint-disable */` — only line-level suppressions

### Claude's Discretion
- Order of file processing within each warning category
- Whether to batch files by directory or by warning type
- Exact wording of suppression justifications (as long as they explain WHY)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### ESLint Configuration
- `eslint.config.js` — Current flat config with rules and plugin setup
- `package.json` — Vitest and ESLint dependency versions

### Test Setup
- `src/test/setupTests.js` — Vitest test setup file (confirms vitest is the test runner)

### Build Verification
- `vite.config.js` — Vite build config (one of the files needing node globals)
- `tailwind.config.js` — Tailwind config (one of the files needing node globals)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- ESLint flat config format already in use — no migration needed
- `globals` package already imported in config — just needs additional entries

### Established Patterns
- All rules currently set to "warn" level (no errors)
- Test files follow `*.test.js` / `*.test.jsx` naming convention
- Config files at project root use CommonJS (`module.exports`) or ESM patterns

### Integration Points
- `npm run lint` is the verification command
- `npm run test:run` must pass after all source file changes
- `npm run build` must pass after all lint fixes

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard ESLint cleanup approach with the decisions captured above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-eslint-cleanup*
*Context gathered: 2026-03-20*
