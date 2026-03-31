# Phase 14: Console Logging Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 14-console-logging-cleanup
**Areas discussed:** Cleanup strategy, Warn/error scope, Regression prevention

---

## Cleanup Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Remove most, keep a few gated | Delete stale debug logs, gate genuinely useful ones behind inline `import.meta.env.DEV` | ~selected via conversation~ |
| Create shared dev-logger utility | `src/utils/devLog.js` wrapping console.log with DEV check, tree-shaken in prod | |
| Gate all inline | Keep every log but wrap each in `if (import.meta.env.DEV)` | |

**User's choice:** Remove most, keep a few gated (accepted Claude's recommendation)
**Notes:** With only 25 calls, a shared utility was deemed over-engineering. Inline guards match existing apiAuth.js pattern.

---

## Warn/Error Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Leave all warn/error untouched | Only clean up console.log and console.debug (25 calls). Warn and error are intentional. | :white_check_mark: |
| Quick audit of warns | Scan 95 warns for obvious debug noise, remove/gate those, keep legitimate warnings | |
| Full audit warn+error | Review all 350 warn+error calls for appropriateness. Much larger scope. | |

**User's choice:** Leave all warn/error untouched
**Notes:** None

---

## Regression Prevention

| Option | Description | Selected |
|--------|-------------|----------|
| Add no-console ESLint rule | Configure no-console to warn/error on console.log/debug, allow warn/error. Catches regressions via husky+lint-staged. | :white_check_mark: |
| Skip ESLint rule | Just do the cleanup. Rely on code review. | |

**User's choice:** Add no-console ESLint rule

### Follow-up: ESLint Severity

| Option | Description | Selected |
|--------|-------------|----------|
| error (blocks commit) | Hard enforcement — no unguarded console.log/debug can be committed | |
| warn (advisory only) | Soft enforcement — highlights in editor but doesn't block commits | |

**User's choice:** "You decide" — deferred to Claude's discretion
**Notes:** None

---

## Claude's Discretion

- ESLint no-console severity (warn vs error)
- Which specific log/debug calls to keep vs remove
- How to structure DEV-gated logs to coexist with the ESLint rule

## Deferred Ideas

None — discussion stayed within phase scope.
