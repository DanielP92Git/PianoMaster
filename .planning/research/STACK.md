# Stack Research

**Domain:** Piano learning PWA — v2.5 Launch Prep
**Researched:** 2026-03-19
**Confidence:** HIGH (all claims verified against installed packages and codebase)

> This is an **additive** research document. The existing validated stack (React 18, Vite 6,
> Supabase, VexFlow v5, pitchy, Tailwind, i18next, Sentry, Brevo) is unchanged.
> This file answers only: **what is needed for v2.5 hard delete Edge Function, ESLint cleanup,
> production QA framework, and legal documentation packaging?**

---

## Summary Answer: Zero New Runtime Dependencies

All four v2.5 feature areas require no new npm packages. Each maps cleanly to existing
infrastructure with configuration adjustments or plain authoring:

| Feature | Approach | New Dependency? |
|---|---|---|
| Hard delete Edge Function | Deno + existing `@supabase/supabase-js@2` (already used in other functions) | No |
| ESLint warnings cleanup | Fix globals config + vitest env override in existing `eslint.config.js` | No |
| `verify:patterns` fix | Add `.js` extension to one bare import in `keySignatureUtils.js` | No |
| Production testing checklist | Static markdown document, no tooling | No |
| Legal documentation package | Copy existing pages + export to PDF | No |

---

## Recommended Stack

### Core Technologies (existing — no changes)

| Technology | Version | Purpose | v2.5 Impact |
|---|---|---|---|
| `@supabase/supabase-js` | 2.48.1 | Admin client in Edge Functions | Hard delete function uses `createClient` with `service_role` key — identical pattern to `lemon-squeezy-webhook` |
| Deno (Supabase Edge runtime) | Supabase-managed | Server-side TypeScript execution | Hard delete is a new `Deno.serve()` function following existing patterns |
| ESLint | 9.9.1 | JS linting | Config changes only — no upgrade needed |
| `eslint-plugin-react-hooks` | 5.1.0-rc.0 | React hooks rules | Already installed; stable RC is fine for warnings-only cleanup |
| Vitest | 3.2.4 | Test runner | Globals fix targets Vitest's `environment` config, not version |

### No New Supporting Libraries

The ESLint warnings break down as follows (574 total, verified by running `npm run lint`):

| Warning Rule | Count | Root Cause | Fix Approach |
|---|---|---|---|
| `no-undef` | 330 | Test globals (`vi`, `expect`, `it`, `describe`, `afterEach`) not in scope + `process`/`module` in CJS config files | Add `vitest` globals to ESLint config for test files; add `node` env for config files |
| `no-unused-vars` | 183 | Legitimate unused variables in production code | Case-by-case: remove, rename to `_prefix`, or add `// eslint-disable-next-line` for intentional stubs |
| `react-hooks/exhaustive-deps` | 41 | Missing/extra deps in `useEffect`/`useCallback` arrays | Case-by-case: stabilize with `useRef`/`useCallback` wrappers or disable with justification comment |
| `react-refresh/only-export-components` | 18 | Non-component exports in component files | Move constants to separate files OR disable for files that intentionally export utilities |

The largest bucket (330 `no-undef` warnings) is a **config fix**, not code changes:

```js
// eslint.config.js — add vitest env to test files
import { defineConfig } from 'vitest/config'; // NOT needed in eslint.config.js — see below

// In eslint.config.js, add a second config block:
{
  files: ['**/*.test.{js,jsx}', '**/test/**/*.{js,jsx}', 'src/test/**'],
  languageOptions: {
    globals: {
      ...globals.browser,
      vi: 'readonly',
      expect: 'readonly',
      it: 'readonly',
      test: 'readonly',
      describe: 'readonly',
      afterEach: 'readonly',
      beforeEach: 'readonly',
    },
  },
},
// For CJS config files (tailwind.config.js, vite.config.js):
{
  files: ['tailwind.config.js', 'vite.config.js', 'postcss.config.js', 'scripts/**'],
  languageOptions: {
    globals: { ...globals.node, process: 'readonly', module: 'readonly', require: 'readonly' },
  },
},
```

This one config change eliminates ~330 of 574 warnings (57%) instantly without touching any source files.

### Development Tools

| Tool | Purpose | v2.5 Notes |
|---|---|---|
| `eslint . --fix` | Auto-fixes 2 warnings flagged as fixable | Run first; safe, zero manual review needed |
| `npm run lint 2>&1 \| grep "warning" \| sort` | Warning triage | Run after config fix to see remaining ~244 warnings categorized |

---

## Feature-Specific Integration Points

### 1. Hard Delete Edge Function

**Pattern to follow:** `supabase/functions/cancel-subscription/index.ts`

The hard delete function needs `service_role` key access to delete from `auth.users` (which bypasses RLS). This is the same pattern already used in `lemon-squeezy-webhook`.

**Database schema already supports this** (from `20260201000001_coppa_schema.sql`):
- `students.deletion_requested_at` — set when parent requests deletion
- `students.deletion_scheduled_at` — 30 days after request
- `students.account_status = 'suspended_deletion'` — blocks login during grace period

**Function trigger:** Supabase cron (same mechanism as `send-daily-push` and `send-weekly-report`).
- Cron expression: `0 2 * * *` (daily 02:00 UTC — low traffic window)
- Query: `SELECT * FROM students WHERE deletion_scheduled_at <= NOW() AND account_status = 'suspended_deletion'`

**Deletion sequence** (must be this order to respect foreign keys):
1. Delete from `push_subscriptions` (FK to students)
2. Delete from `parental_consent_log` (FK to students, ON DELETE CASCADE handles this)
3. Delete from `parental_consent_tokens` (FK to students, ON DELETE CASCADE handles this)
4. Delete from `student_skill_progress` (FK to students)
5. Delete from `student_daily_goals` (FK to students)
6. Delete from `parent_subscriptions` (FK to students)
7. Delete from `students` row
8. Call `supabase.auth.admin.deleteUser(student_id)` — removes from `auth.users`

Steps 2-3 are covered by `ON DELETE CASCADE` already in the schema. Verify all other FKs for cascade behavior before coding.

**Environment variables needed** (same as other cron functions):
- `SUPABASE_URL` — already set
- `SUPABASE_SERVICE_ROLE_KEY` — already set (used by webhook function)
- `CRON_SECRET` — already set (used by push/weekly-report functions)

**Security model:**
```typescript
// Verify cron secret to prevent unauthorized invocation
const cronSecret = req.headers.get('x-cron-secret');
if (cronSecret !== Deno.env.get('CRON_SECRET')) {
  return new Response('Unauthorized', { status: 401 });
}

// Use service_role for auth.admin access
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

**Import** (identical to cancel-subscription):
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
```

### 2. verify:patterns Fix

**Root cause confirmed:** `keySignatureUtils.js` line 1 imports `"../constants/keySignatureConfig"` (no `.js` extension). Vite resolves this fine. Node ESM (`patternVerifier.mjs` uses `node --experimental-vm-modules`) requires explicit `.js` extension.

**Fix:** One-line change in `src/components/games/sight-reading-game/utils/keySignatureUtils.js`:
```js
// Before:
import { KEY_NOTE_LETTERS } from "../constants/keySignatureConfig";
// After:
import { KEY_NOTE_LETTERS } from "../constants/keySignatureConfig.js";
```

Same fix needed in `keySignatureUtils.test.js` line 1 (same bare import).

Verify with `npm run verify:patterns` after applying.

### 3. ESLint Warnings Cleanup

**Cleanup order for least disruption:**

1. **Config fix first** (eliminates ~330 warnings, zero source code changes):
   - Add `vitest` globals block for test files in `eslint.config.js`
   - Add `node` globals block for config files in `eslint.config.js`

2. **Auto-fix** (eliminates 2 more):
   - `npm run lint:fix` handles only 2 auto-fixable warnings

3. **Mechanical removals** (~183 `no-unused-vars` in production code):
   - Destructured but unused variables: rename to `_varName` or remove
   - Unused imports: remove the import
   - Assigned-but-never-read vars: remove the assignment
   - Dead `const` at module scope: remove
   - Exception: `// eslint-disable-next-line no-unused-vars` for intentional stubs with comments

4. **Hook dependency warnings** (~41 `react-hooks/exhaustive-deps`):
   - Missing stable deps: wrap with `useCallback` or `useRef` as appropriate
   - Functions created inside components causing churn: either move inside callback or stabilize with `useCallback`
   - Genuinely intentional omissions (e.g. `queryClient` ref): disable with `// eslint-disable-next-line react-hooks/exhaustive-deps` and a comment explaining why
   - Do NOT add all deps blindly — several (e.g. `audioEngine`) cause infinite re-render loops if added

5. **react-refresh violations** (~18 warnings):
   - Files exporting both a component and constants/utilities: either split into two files OR add `/* eslint-disable react-refresh/only-export-components */` at top with a justification comment

**Target:** 0 errors, 0 warnings. Achievable without any logic changes.

### 4. Production Testing Checklist

No tooling needed. A structured markdown document covering:

- Authentication flows (signup, login, logout, password reset, session timeout)
- COPPA flows (age gate, consent email, consent verify, data export, deletion request)
- Subscription flows (paywall, checkout, cancel, webhook, subscription gate enforcement)
- All 4 game modes in all input modes (keyboard, mic) with trail and free play
- Trail system (unlock progression, star updates, XP award, prestige calculation)
- Dashboard (daily goals, streak, XP ring, push opt-in)
- Streak protection (grace window, freeze consumption, weekend pass, comeback bonus)
- i18n (EN/HE switch, RTL layout on trail and dashboard)
- PWA (install, offline behavior, service worker cache)
- Mobile (rotate prompt iOS, landscape lock Android, touch targets)
- Accessibility (keyboard nav, reduced motion, high contrast)

This document belongs in `.planning/milestones/v2.5-phases/` not in the codebase.

### 5. Legal Documentation Package

**Existing assets:**
- `src/pages/PrivacyPolicyPage.jsx` — COPPA-compliant privacy policy (live at `/legal/privacy`)
- `src/pages/TermsOfServicePage.jsx` — Terms of service (live at `/legal/terms`)
- `supabase/migrations/20260201000001_coppa_schema.sql` — Data architecture documentation
- `supabase/functions/send-consent-email/index.ts` — Consent email content

**Package assembly approach** (no new tools needed):
- Print `/legal/privacy` and `/legal/terms` from browser to PDF (Chrome print → Save as PDF)
- Export consent email HTML from `send-consent-email/index.ts` for review
- Summarize data flows: what is collected, where stored, retention periods, deletion mechanics
- Reference `SECURITY_GUIDELINES.md` for attorney context on COPPA implementation

**No PDF generation library needed** — the attorney needs to review content, not the app. Browser print-to-PDF produces a clean readable document.

---

## Installation

```bash
# No new dependencies required for v2.5.
# All changes are: configuration, one import path fix, new Edge Function (Deno/TypeScript), and documentation.
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|---|---|---|
| ESLint config globals block for test files | `eslint-plugin-vitest` (separate plugin) | Plugin adds 30+ vitest-specific rules that are not needed — the problem is purely missing globals, not rule coverage. Config-only fix eliminates the warnings without adding a dependency. |
| Supabase cron for hard delete trigger | Client-side scheduled check on login | Client cannot be trusted for COPPA deletion (user could never log in). Server-side cron is authoritative. Same pattern already used by `send-daily-push`. |
| `service_role` key in Edge Function for `auth.admin.deleteUser` | Postgres trigger via `pg_cron` | pg_cron cannot call `auth.users` deletions. Only the Admin API (via service_role) can delete from `auth.users`. Edge Function is the correct layer. |
| Manually add `.js` extension to fix `verify:patterns` | Replace `patternVerifier.mjs` with a Vite-aware test | Vite test would require running the full dev server. The one-line import fix is the minimal correct solution. |
| Browser print-to-PDF for legal docs | `puppeteer` or `playwright` for PDF generation | Attorney review needs the content, not automation. The pages are already styled correctly. No engineering value in adding a headless browser dependency. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| `eslint-plugin-vitest` | Solves a problem that is purely a globals config issue; adds 30+ rules and a dependency | Add `vitest` globals to `eslint.config.js` test file block |
| `@supabase/supabase-js` client in hard delete function | Anon/user-level client cannot call `auth.admin.deleteUser` | `createClient` with `SUPABASE_SERVICE_ROLE_KEY` — already the pattern in `lemon-squeezy-webhook` |
| Batch `eslint --fix` with `--rule` overrides to suppress all warnings | Suppression masks real bugs; `no-unused-vars` warnings often reveal dead code worth removing | Fix root causes: config for test globals, code cleanup for unused vars, `useCallback` stabilization for hook deps |
| New migration to add `deleted_at` soft-delete column | Schema already has `deletion_scheduled_at` and `account_status = 'suspended_deletion'` — the 30-day grace is already modeled | Use existing columns; hard delete function queries `deletion_scheduled_at <= NOW()` |
| `pg_cron` extension for deletion scheduling | Cannot delete from `auth.users` (requires Admin API, not SQL); also adds Supabase extension management complexity | Supabase Edge Function with `CRON_SECRET` — already established pattern in this codebase |

---

## Stack Patterns by Variant

**Hard delete Edge Function structure:**
- Uses `Deno.serve()` — same as all existing functions
- Authenticated via `x-cron-secret` header check (no JWT needed — cron jobs don't have user JWTs)
- Uses `service_role` Supabase client — same as `lemon-squeezy-webhook`
- Returns `{ deleted: N, errors: M }` for monitoring/logging
- Logs each deletion attempt to console for Supabase Edge Function logs (no separate audit table needed — `parental_consent_log` already records the deletion request event)

**ESLint config file structure after fix:**
```js
// eslint.config.js — three targeted blocks
export default [
  { ignores: ["dist"] },
  // 1. Production source files
  { files: ["src/**/*.{js,jsx}"], /* existing rules */ },
  // 2. Test files — add vitest globals
  { files: ["**/*.test.{js,jsx}", "src/test/**"], languageOptions: { globals: vitestGlobals } },
  // 3. Node config files
  { files: ["*.config.js", "scripts/**"], languageOptions: { globals: globals.node } },
];
```

---

## Version Compatibility

| Package | Compatible With | Notes |
|---|---|---|
| `@supabase/supabase-js@2` (via esm.sh) | Deno Edge runtime | Pattern already used by `cancel-subscription`, `lemon-squeezy-webhook` — confirmed working |
| `eslint@9.9.1` | Flat config format (used by this project) | Globals config approach is the flat config pattern; no `env` property (that's legacy config format) |
| `vitest@3.2.4` | Requires explicit globals config in ESLint | Vitest does NOT inject globals into ESLint scope automatically; must declare manually |

---

## Sources

- `C:/Development/PianoApp2/package.json` — Installed versions confirmed (HIGH confidence)
- `C:/Development/PianoApp2/eslint.config.js` — Current config structure; globals approach derived from ESLint flat config documentation (HIGH confidence)
- `npm run lint` output — 574 warnings categorized by rule: `no-undef` 330, `no-unused-vars` 183, `react-hooks/exhaustive-deps` 41, `react-refresh/only-export-components` 18 (HIGH confidence — direct measurement)
- `supabase/functions/cancel-subscription/index.ts` — service_role pattern, CORS structure, Deno.serve pattern (HIGH confidence)
- `supabase/functions/send-daily-push/index.ts` — cron secret pattern, cron scheduling (HIGH confidence)
- `supabase/migrations/20260201000001_coppa_schema.sql` — deletion_scheduled_at, account_status schema (HIGH confidence)
- `src/components/games/sight-reading-game/utils/keySignatureUtils.js` line 1 — bare import confirmed as root cause of verify:patterns breakage (HIGH confidence — reproduction confirmed via `npm run verify:patterns`)
- `src/components/games/sight-reading-game/constants/keySignatureConfig.js` — file EXISTS, confirming the issue is the missing `.js` extension, not a missing file (HIGH confidence)

---
*Stack research for: v2.5 Launch Prep — hard delete, ESLint cleanup, QA framework, legal docs*
*Researched: 2026-03-19*
