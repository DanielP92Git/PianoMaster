# Phase 14: Console Logging Cleanup - Research

**Researched:** 2026-03-31
**Domain:** ESLint configuration, Vite DEV-flag tree-shaking, console.log/debug audit
**Confidence:** HIGH

## Summary

Phase 14 is a focused cleanup: guard or remove all `console.log` and `console.debug` calls in `src/` so production builds are silent. The codebase currently has exactly **24 unguarded console.log/debug hits** — the requirement target of "<50" is already within reach with a straightforward one-pass edit.

All 24 calls were individually inspected during research. They cluster into three action categories: (1) calls that already sit inside a `const DEBUG = false` / `RHYTHM_DEBUG = true` boolean gate that needs to be replaced with `import.meta.env.DEV`, (2) calls that are genuinely useful for development and should receive an inline `if (import.meta.env.DEV)` guard, and (3) calls that are pure debug noise that can be deleted outright. The work is mechanical, low-risk, and fits in a single plan.

The regression-prevention piece (D-04) is equally straightforward: add one `no-console` rule to the existing flat ESLint config (`eslint.config.js`) with `{ allow: ["warn", "error", "info"] }`. ESLint 9 flat config already uses `@eslint/js` and the built-in rules are available without extra packages. Husky + lint-staged already runs ESLint on staged files, so the rule enforces itself automatically going forward.

**Primary recommendation:** Audit-and-edit in a single plan. For each of the 24 unguarded calls, apply the correct fix (remove / inline DEV guard / upgrade boolean flag to DEV flag). Then add the `no-console` ESLint rule. No new utilities required.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Remove most console.log/debug calls entirely — they are stale debug artifacts. Gate the few that provide genuine development value behind inline `if (import.meta.env.DEV)` checks (same pattern as `apiAuth.js:241`).
- **D-02:** No shared dev-logger utility. With only 25 calls, a wrapper is over-engineering. Inline DEV guards are sufficient.
- **D-03:** Only `console.log` (10) and `console.debug` (15) are in scope. All 95 `console.warn` and 255 `console.error` calls are considered intentional production logging and are left untouched.
- **D-04:** Add ESLint `no-console` rule targeting `console.log` and `console.debug` (allow `warn`, `error`, `info`). Integrates with existing husky + lint-staged pre-commit hook to prevent future unguarded debug logs from being committed.

### Claude's Discretion

- ESLint rule severity (`"warn"` vs `"error"`) — pick whichever best balances DX with enforcement
- Which specific console.log/debug calls to keep (gated) vs remove entirely — judge by whether the log provides useful development context
- Whether to use `// eslint-disable-next-line no-console` for intentionally gated DEV logs or structure the code so the rule doesn't trigger

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                 | Research Support                                                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| QUAL-06 | console.log/debug calls gated behind `import.meta.env.DEV` or removed (366 -> target: <50 production calls) | Audit below shows exactly 24 unguarded calls; inline DEV guards and deletions bring count to 0 unguarded; ESLint rule prevents regression |

</phase_requirements>

## Standard Stack

### Core

| Library                    | Version                 | Purpose                               | Why Standard                                                         |
| -------------------------- | ----------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| ESLint (flat config)       | 9.9.1 (installed)       | Lint enforcement                      | Already in project; flat config format is the ESLint 9 standard      |
| `@eslint/js`               | (bundled with ESLint 9) | Built-in rules including `no-console` | No extra install needed                                              |
| Vite `import.meta.env.DEV` | Vite 6 (installed)      | Build-time dead-code elimination      | Tree-shaken to `false` in production builds; standard for this stack |

### Supporting

| Library             | Version     | Purpose                | When to Use                                                       |
| ------------------- | ----------- | ---------------------- | ----------------------------------------------------------------- |
| husky + lint-staged | (installed) | Pre-commit enforcement | Already wired; ESLint new rule runs automatically on staged files |

**Installation:** No new packages required. All tools are already installed.

## Architecture Patterns

### Pattern 1: Inline DEV Guard (canonical — from apiAuth.js:241)

**What:** Wrap a `console.log` or `console.debug` call with `if (import.meta.env.DEV)`. Vite replaces `import.meta.env.DEV` with `false` in production and the dead-code eliminator removes the block entirely.
**When to use:** When the log provides useful development context (e.g., realtime subscription status, navigation decisions, cache eviction counts).
**Example:**

```javascript
// Source: src/services/apiAuth.js:241 (existing canonical pattern)
if (import.meta.env.DEV) {
  console.log(
    `Logout: Cleared ${keysToRemove.length} user-specific localStorage keys`
  );
}
```

### Pattern 2: Boolean Debug Flag Upgrade

**What:** Some files use a module-level `const DEBUG = false` or `const RHYTHM_DEBUG = true` boolean. The correct fix is to replace the boolean literal with `import.meta.env.DEV` so the flag tree-shakes in production.
**When to use:** When a boolean flag already gates the call — just change the flag value, not the call site.
**Example:**

```javascript
// Before (leaks in production when set to true):
const RHYTHM_DEBUG = true;

// After (tree-shaken in production):
const RHYTHM_DEBUG = import.meta.env.DEV;
```

### Pattern 3: Delete Stale Debug Calls

**What:** Remove the console call and any surrounding debug-only logic entirely.
**When to use:** When the log is a stale artifact with no ongoing development value (e.g., navigation breadcrumb logs in useVictoryState, timer debug logs).

### Pattern 4: ESLint no-console Rule (flat config)

**What:** Add `no-console` to the main rule set with `allow: ["warn", "error", "info"]`. Use `"warn"` severity so CI doesn't hard-fail on gated DEV logs that use `eslint-disable`.
**Example:**

```javascript
// In eslint.config.js, inside the main { files: ["**/*.{js,jsx}"] } config object:
rules: {
  // ... existing rules ...
  "no-console": ["warn", { allow: ["warn", "error", "info"] }],
},
```

### Anti-Patterns to Avoid

- **`const DEBUG = false` boolean flag:** Does not tree-shake. Production bundle includes the console call string even if it never executes. Replace with `import.meta.env.DEV`.
- **`process.env.NODE_ENV === 'development'` guard:** Works (SubscriptionContext.jsx and consentService.js already use this), but `import.meta.env.DEV` is the Vite-native equivalent and more consistent. The existing `process.env` guards are functionally equivalent (Vite replaces both), so migrating them is optional, not required.
- **`eslint-disable-next-line no-console` on ungated calls:** Only use this directive when the call is inside an `if (import.meta.env.DEV)` block (then it is genuinely gated). Never use it to silence truly unguarded production-visible logs.

## Don't Hand-Roll

| Problem                          | Don't Build                   | Use Instead                               | Why                                                                    |
| -------------------------------- | ----------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| Log suppression in production    | Custom logger class / wrapper | `if (import.meta.env.DEV)` inline guard   | D-02 explicitly prohibits a wrapper; inline is sufficient for 24 calls |
| Preventing future unguarded logs | Manual PR review              | ESLint `no-console` + existing husky hook | Zero-overhead enforcement; runs on every staged file                   |

## Complete Audit: All 24 Unguarded Calls

This inventory was verified by source inspection on 2026-03-31. Every call not already behind `import.meta.env.DEV`, `__srLog`, or a DEV-env-sourced flag is listed here.

### Bucket A: Boolean flags that need to become `import.meta.env.DEV`

These files use a `const FLAG = true/false` pattern that does NOT tree-shake in production.

| File                                                                 | Line | Flag                              | Current Value                    | Fix                                                                                     |
| -------------------------------------------------------------------- | ---- | --------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| `src/components/games/sight-reading-game/hooks/useRhythmPlayback.js` | 3    | `RHYTHM_DEBUG`                    | `true` (leaks to prod!)          | Change to `import.meta.env.DEV`                                                         |
| `src/components/games/sight-reading-game/SightReadingGame.jsx`       | 135  | `AUDIO_OUTPUT_LATENCY_COMP_DEBUG` | `true` (leaks to prod!)          | Change to `import.meta.env.DEV`                                                         |
| `src/features/games/hooks/useGameTimer.js`                           | 4    | `DEBUG`                           | `false` (safe but wrong pattern) | Change to `import.meta.env.DEV`, or delete the `debugLog` helper and its two call sites |

Notes:

- `METRONOME_TIMING_DEBUG` in SightReadingGame.jsx (line 123) is already `import.meta.env?.VITE_DEBUG_METRONOME === "true"` — correct, no change needed.
- `FIRST_NOTE_DEBUG` in SightReadingGame.jsx (line 124) is already `import.meta.env?.VITE_DEBUG_FIRST_NOTE === "true"` — correct, no change needed.
- `METRONOME_TIMING_DEBUG` in useAudioEngine.js (line 3) is `false` — the guarded `console.debug` at line 268 is safe but should follow the same upgrade pattern.

### Bucket B: Inline calls needing a DEV guard

These calls are not behind any flag. They need either an `if (import.meta.env.DEV)` wrapper or deletion.

| File                                                                         | Line(s)                      | Content                                  | Recommendation                                                                                                                                           |
| ---------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` | 295, 304, 1324, 1491         | `[VexFlowStaffDisplay]` debug payloads   | Gate with `import.meta.env.DEV` — useful for rendering debugging                                                                                         |
| `src/components/games/sight-reading-game/SightReadingGame.jsx`               | 1507, 1524, 1689, 1778, 1825 | `[NoteDetection]` debug payloads         | Gate with `import.meta.env.DEV` — timing debug is valuable in dev                                                                                        |
| `src/components/games/sight-reading-game/SightReadingGame.jsx`               | 2299                         | `[ScoreSyncStatus]` debug payload        | Already gated by `if (METRONOME_TIMING_DEBUG)` which is `import.meta.env?.VITE_DEBUG_METRONOME === "true"` — actually CORRECT, no change needed          |
| `src/contexts/SubscriptionContext.jsx`                                       | 55                           | `[SubscriptionContext] Realtime status`  | Already gated by `process.env.NODE_ENV === "development"` — functionally correct, no change needed (or migrate to `import.meta.env.DEV` for consistency) |
| `src/hooks/useVictoryState.js`                                               | 544, 547, 570                | Navigation breadcrumb logs               | Delete — stale debug artifact, adds no dev value                                                                                                         |
| `src/services/audioCacheService.js`                                          | 236                          | `Audio cache: evicted X expired entries` | Gate with `import.meta.env.DEV` — marginally useful cache diagnostic                                                                                     |
| `src/services/consentService.js`                                             | 96                           | `[DEV] Consent verification URL`         | Already gated by `process.env.NODE_ENV === 'development'` — functionally correct, no change needed                                                       |
| `src/services/apiAuth.js`                                                    | 242                          | localStorage cleanup count               | Already gated by `if (import.meta.env.DEV)` — CORRECT, no change needed                                                                                  |
| `src/utils/pwa.js`                                                           | 256                          | `Fallback reload triggered`              | Delete — this fires in production (no guard); it's a simple operational event, not a dev diagnostic                                                      |

### Bucket C: Already correctly gated (no action needed)

These appeared in the grep but are already handled:

- `src/components/games/sight-reading-game/utils/patternBuilder.js:24` — inside `debugLog()` which checks `isDebugEnabled` (env-var sourced), correct
- `src/components/games/sight-reading-game/SightReadingGame.jsx` — all `__srLog()` calls go through the DEV+endpoint-gated helper, correct
- `src/services/apiAuth.js:242` — inside `if (import.meta.env.DEV)`, correct
- `src/services/consentService.js:96` — inside `if (process.env.NODE_ENV === 'development')`, correct
- `src/contexts/SubscriptionContext.jsx:55` — inside `if (process.env.NODE_ENV === "development")`, correct
- `src/components/games/sight-reading-game/SightReadingGame.jsx:2299` — inside `if (METRONOME_TIMING_DEBUG)` which is env-var sourced, correct
- `src/features/games/hooks/useGameTimer.js:10,12` — inside `debugLog()` which checks `if (DEBUG)` where `DEBUG = false` — safe in practice but wrong pattern; upgrade flag to `import.meta.env.DEV` or delete

**Final tally after research:**

- Calls requiring action: ~15 (upgrades + deletions)
- Calls already correctly gated: ~9
- Calls to delete outright: ~4-5 (useVictoryState x3, pwa.js x1)
- All 24 hits reducible to 0 production-visible calls

## Common Pitfalls

### Pitfall 1: Boolean Flags Don't Tree-Shake

**What goes wrong:** `const RHYTHM_DEBUG = true` looks like it could be toggled off, but even when set to `false`, the `console.debug(...)` string literals remain in the production bundle. Vite only eliminates dead branches when it can statically evaluate the condition to `false` at build time.
**Why it happens:** Vite's tree-shaking evaluates `import.meta.env.DEV` statically (`false` in production), but cannot evaluate a module-level `const` that was `true` at dev time — unless it was `const` AND assigned from a build-time expression.
**How to avoid:** Always source debug flags from `import.meta.env.*` rather than literal booleans.
**Warning signs:** `RHYTHM_DEBUG = true` in the codebase. Confirmed in `useRhythmPlayback.js:3` and `SightReadingGame.jsx:135`.

### Pitfall 2: `no-console` Rule Triggering on Intentionally Gated Calls

**What goes wrong:** After adding `no-console`, the linter warns on `console.log(...)` lines even inside `if (import.meta.env.DEV)` blocks — the rule doesn't understand build-time semantics, only AST structure.
**Why it happens:** ESLint sees `console.log` in the source regardless of the surrounding guard.
**How to avoid:** For any console call kept inside a DEV guard, add `// eslint-disable-next-line no-console` on the line above. This is the explicit, documented intent of the rule's disable mechanism. Alternatively, using `"warn"` severity means lint will not break the build; only `"error"` blocks commits via lint-staged.
**Warning signs:** Lint-staged blocking legitimate DEV-only logs.

### Pitfall 3: `process.env.NODE_ENV` vs `import.meta.env.DEV`

**What goes wrong:** Two files (`SubscriptionContext.jsx`, `consentService.js`) use `process.env.NODE_ENV === 'development'` which works (Vite replaces it), but the ESLint config has a special `process: "readonly"` global for those two files specifically — suggesting this was an intentional workaround.
**Why it happens:** Early Vite code or copy-paste from non-Vite projects.
**How to avoid:** These are already functionally guarded. Migrating them to `import.meta.env.DEV` is a consistency improvement but not required for QUAL-06.

### Pitfall 4: ESLint Flat Config Rule Placement

**What goes wrong:** Adding `no-console` to the wrong config object (e.g., the Vitest test file override) means it won't apply to `src/` files.
**Why it happens:** ESLint 9 flat config uses an array of config objects; rules must be in the object matching the target `files` glob.
**How to avoid:** Add `no-console` to the first main config object with `files: ["**/*.{js,jsx}"]`. This covers all source files automatically.

## Code Examples

### Adding `no-console` to `eslint.config.js`

```javascript
// Source: ESLint 9 docs (no-console rule, flat config format)
// Add to the main config object in eslint.config.js

rules: {
  ...js.configs.recommended.rules,
  ...react.configs.recommended.rules,
  ...reactHooks.configs.recommended.rules,
  // ... existing rules ...
  "no-console": ["warn", { allow: ["warn", "error", "info"] }],
},
```

Using `"warn"` (not `"error"`) so:

- CI does not hard-fail if a future PR contains a gated DEV log with a disable comment
- Developers see the warning and fix it before merging
- Husky lint-staged runs ESLint but does not fail commits on warnings by default (only on `--max-warnings 0` which is not configured here)

If stricter enforcement is desired, use `"error"` — this will block commits via lint-staged for any new unguarded console call.

### Upgrading a Boolean Flag

```javascript
// Before — leaks to production (string literals remain in bundle even when false):
const RHYTHM_DEBUG = true;

// After — fully tree-shaken in production builds:
const RHYTHM_DEBUG = import.meta.env.DEV;
```

### Inline DEV Guard (canonical pattern)

```javascript
// Source: src/services/apiAuth.js:241

if (import.meta.env.DEV) {
  console.debug("[VexFlowStaffDisplay]", { patternChanged, clefChanged });
}
```

### Disabling the Rule for a Gated Call

```javascript
// When keeping a console call inside a DEV guard:
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.debug("[NoteDetection]", { blocked: true, phase });
}
```

## State of the Art

| Old Approach                                   | Current Approach                          | When Changed               | Impact                                                     |
| ---------------------------------------------- | ----------------------------------------- | -------------------------- | ---------------------------------------------------------- |
| `process.env.NODE_ENV === 'development'` guard | `import.meta.env.DEV`                     | Vite adoption              | Both work in Vite; `import.meta.env.DEV` is more idiomatic |
| `const DEBUG = false` boolean gate             | `import.meta.env.DEV` flag                | N/A — project-specific fix | Enables actual tree-shaking rather than runtime check      |
| ESLint legacy config (`.eslintrc.cjs`)         | ESLint 9 flat config (`eslint.config.js`) | ESLint 9 (2024)            | Project already uses flat config — no migration needed     |

## Open Questions

1. **ESLint rule severity: `"warn"` vs `"error"`**
   - What we know: `"error"` would block commits via lint-staged; `"warn"` allows warning without blocking
   - What's unclear: Whether the user wants hard enforcement (no new console calls can be committed) vs soft guidance
   - Recommendation: Use `"warn"` for DX friendliness; if a stray `console.log` slips in, it will surface in the terminal, not break a commit. The user can upgrade to `"error"` later.

2. **`AUDIO_OUTPUT_LATENCY_COMP_DEBUG = true` in SightReadingGame.jsx:135**
   - What we know: This flag is `true` and gates a section that uses `__srLog` (the endpoint-based logger, already DEV-gated). The `if (AUDIO_OUTPUT_LATENCY_COMP_DEBUG)` block does not directly call `console.*` — it calls `__srLog`.
   - What's unclear: Whether changing this flag affects production behavior (it would prevent the `__srLog` call, but `__srLog` is already a no-op in production).
   - Recommendation: Change to `import.meta.env.DEV` for consistency. No functional production impact.

## Environment Availability

Step 2.6: SKIPPED — this phase is code/config-only changes (ESLint rule addition + inline edits). No external tools, services, or runtimes beyond the project's existing toolchain are required.

## Validation Architecture

### Test Framework

| Property           | Value                                     |
| ------------------ | ----------------------------------------- |
| Framework          | Vitest (installed)                        |
| Config file        | `vite.config.js` (Vitest config embedded) |
| Quick run command  | `npm run test:run`                        |
| Full suite command | `npm run test:run`                        |

### Phase Requirements → Test Map

| Req ID  | Behavior                                             | Test Type         | Automated Command                                                                                                    | File Exists?          |
| ------- | ---------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------- |
| QUAL-06 | Zero unguarded console.log/debug in src/ after edits | Lint (grep audit) | `grep -r "console.log\|console.debug" src/ \| grep -v "import.meta.env.DEV\|if.*DEBUG\|__srLog" \| wc -l` (expect 0) | Manual verification   |
| QUAL-06 | ESLint no-console rule present and warns             | Lint              | `npm run lint` (expect no new errors)                                                                                | ❌ Rule not yet added |
| QUAL-06 | Production build has no debug console output         | Smoke (manual)    | `npm run build && npm run preview`                                                                                   | Manual                |

The primary validation for this phase is a **grep audit** (the same command specified in the success criteria), not unit tests. Unit tests are not the right tool for "does this file contain an unguarded console call" — that is a static analysis / grep question.

### Sampling Rate

- **Per task commit:** `npm run lint` to verify no ESLint errors introduced
- **Per wave merge:** `npm run test:run` to confirm no regressions + grep audit
- **Phase gate:** `grep -r "console.log\|console.debug" src/ | grep -v "import.meta.env.DEV\|VITE_DEBUG\|__srLog\|if (DEBUG)\|isDebugEnabled" | wc -l` must equal 0

### Wave 0 Gaps

None — existing ESLint + test infrastructure covers all phase requirements. No new test files needed. The `no-console` rule is added to `eslint.config.js` as part of the implementation, not as a Wave 0 gap.

## Sources

### Primary (HIGH confidence)

- Source code audit of `C:/Development/PianoApp2/src/` — direct inspection of all 24 `console.log`/`console.debug` call sites
- `eslint.config.js` — verified existing flat config structure and ESLint 9 format
- `src/services/apiAuth.js:241` — canonical DEV guard pattern confirmed in project
- `src/components/games/sight-reading-game/SightReadingGame.jsx:53` — `__srLog` pattern confirmed
- `package.json` — ESLint version 9.9.1 confirmed

### Secondary (MEDIUM confidence)

- ESLint 9 `no-console` rule documentation — `allow` array option, flat config syntax. Rule is a core ESLint rule with no changes in ESLint 9.

### Tertiary (LOW confidence)

None.

## Project Constraints (from CLAUDE.md)

| Directive                                                  | How It Applies to This Phase                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| ESLint + Prettier via husky + lint-staged                  | New `no-console` rule integrates automatically; no hook changes needed |
| SVG imports use `?react` suffix                            | Not relevant to this phase                                             |
| `import.meta.env.DEV` is the standard Vite build-time flag | Confirms the correct guard pattern                                     |
| No `.eslintrc.cjs` — project uses flat `eslint.config.js`  | Rule must be added to `eslint.config.js`, not a legacy config file     |

## Metadata

**Confidence breakdown:**

- Call inventory: HIGH — verified by direct source inspection of all 24 call sites
- ESLint rule syntax: HIGH — ESLint 9 flat config `no-console` with `allow` array is stable and well-documented
- Tree-shaking behavior: HIGH — `import.meta.env.DEV` tree-shaking is a core Vite guarantee
- Severity recommendation (`"warn"` vs `"error"`): MEDIUM — depends on user preference (left to Claude's discretion per D-04)

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (stable tooling — no version churn expected)
