# Architecture Research

**Domain:** Piano learning PWA — launch prep (v2.5)
**Researched:** 2026-03-19
**Confidence:** HIGH (all findings from direct codebase inspection, no training-data assertions)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    React 18 + Vite 6 (PWA)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  Game UI   │  │  Dashboard │  │ Trail Map  │  │  Settings │ │
│  │ (4 modes)  │  │  (cards)   │  │ (overlay)  │  │  /Legal   │ │
│  └─────┬──────┘  └──────┬─────┘  └──────┬─────┘  └─────┬─────┘ │
│        │                │               │              │        │
│  ┌─────┴────────────────┴───────────────┴──────────────┴──────┐ │
│  │          React Query v5 + Context (feature-scoped)         │ │
│  └─────────────────────────────┬───────────────────────────── ┘ │
└────────────────────────────────│────────────────────────────────┘
                                 │ supabase-js client
┌────────────────────────────────▼────────────────────────────────┐
│                         Supabase Platform                        │
│  ┌────────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Auth (JWT)    │  │  PostgREST   │  │  Realtime (WS)        │ │
│  └────────────────┘  └──────┬───────┘  └────────────────────── ┘ │
│                             │ RLS on every table                  │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │                    PostgreSQL (17)                           │ │
│  │  students · students_score · student_skill_progress         │ │
│  │  student_daily_goals · student_daily_challenges             │ │
│  │  push_subscriptions · parent_subscriptions                  │ │
│  │  parental_consent_log · parental_consent_tokens             │ │
│  │  current_streak · teacher_student_connections               │ │
│  └──────────────────────────────────────────────────────────── ┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │          Edge Functions (Deno, TypeScript)                   │ │
│  │  send-daily-push  send-weekly-report  verify-consent        │ │
│  │  create-checkout  cancel-subscription  lemon-squeezy-webhook │ │
│  │  unsubscribe-weekly-report  send-consent-email              │ │
│  │  [NEW] hard-delete-accounts  (pg_cron daily trigger)        │ │
│  └──────────────────────────────────────────────────────────── ┘ │
│  ┌──────────────────┐                                            │
│  │  Storage         │  Bucket: practice-recordings              │
│  │  (audio blobs)   │  Files at: {student_id}/{timestamp}.ext   │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Edge Function (cron) | Server-side scheduled jobs needing service_role | `verify_jwt = false`, `x-cron-secret` header, `SUPABASE_SERVICE_ROLE_KEY` |
| Edge Function (user-triggered) | Privileged ops a user can trigger (checkout, cancel) | `verify_jwt = true`, anon key on client side |
| RLS policies | Ground-truth data access control | `auth.uid()` checks, SECURITY DEFINER functions for cross-table |
| React Query | Client-side data cache + invalidation | `staleTime`, invalidation via Realtime subscriptions |
| accountDeletionService.js | Soft delete (client-side) | Sets `account_status = 'suspended_deletion'`, `deletion_scheduled_at = NOW() + 30d` |

---

## v2.5 Feature Integration Points

### Feature 1: Hard Delete Edge Function

**What it does:** Daily cron job that permanently erases student accounts where
`account_status = 'suspended_deletion'` AND `deletion_scheduled_at < NOW()`.

**Integration surface (NEW vs MODIFIED):**

| Artifact | New or Modified | Notes |
|---|---|---|
| `supabase/functions/hard-delete-accounts/index.ts` | NEW | Full Edge Function implementation |
| `supabase/config.toml` | MODIFIED | Add `[functions.hard-delete-accounts]` block with `verify_jwt = false` |
| pg_cron schedule (SQL Editor manual step) | NEW | `cron.schedule()` call, per existing pattern from `send-daily-push` |

**Delete cascade order (CRITICAL — do NOT rely solely on Postgres CASCADE):**

The function must handle two layers of deletion:

```
Layer 1 — Storage (no CASCADE, must be explicit):
  supabase.storage.from('practice-recordings').list(student_id + '/')
  supabase.storage.from('practice-recordings').remove(all files)

Layer 2 — Database CASCADE (automatic once students row is deleted):
  students row DELETE triggers cascade to:
    student_skill_progress          ON DELETE CASCADE (confirmed in migrations)
    student_daily_goals             ON DELETE CASCADE (confirmed)
    student_daily_challenges        ON DELETE CASCADE (confirmed)
    push_subscriptions              ON DELETE CASCADE (confirmed)
    parental_consent_log            ON DELETE CASCADE (confirmed)
    parental_consent_tokens         ON DELETE CASCADE (confirmed)
    teacher_student_connections     ON DELETE CASCADE (confirmed)
    rate_limit_violations           ON DELETE CASCADE (20260201000002)
    unit_tracking                   ON DELETE CASCADE (20260129000002)

Layer 3 — Auth (no CASCADE to auth.users, must be explicit):
  supabase.auth.admin.deleteUser(student_id)
```

**parent_subscriptions caveat:** This table's FK definition was not found in the local migration
files (likely exists only in remote schema). Before implementing, run this query in the Supabase
SQL Editor to confirm whether `parent_subscriptions.student_id` has `ON DELETE CASCADE`:

```sql
SELECT pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
WHERE t.relname = 'parent_subscriptions'
  AND c.contype = 'f';
```

If no CASCADE exists, delete it explicitly before deleting the `students` row.

**Implementation pattern (mirrors send-daily-push):**

```typescript
// Security: CRON_SECRET header, verify_jwt = false in config.toml
// Client: service_role key (bypasses RLS)
// Schedule: daily at 02:00 UTC (off-peak)

const { data: targets } = await supabase
  .from('students')
  .select('id')
  .eq('account_status', 'suspended_deletion')
  .lt('deletion_scheduled_at', new Date().toISOString());

for (const student of targets) {
  try {
    // 1. Delete storage files (no CASCADE)
    const { data: files } = await supabase.storage
      .from('practice-recordings')
      .list(student.id);
    if (files?.length) {
      await supabase.storage
        .from('practice-recordings')
        .remove(files.map(f => `${student.id}/${f.name}`));
    }

    // 2. Delete parent_subscriptions explicitly (confirm CASCADE first)
    await supabase.from('parent_subscriptions').delete().eq('student_id', student.id);

    // 3. Delete students row (triggers CASCADE for all child tables)
    await supabase.from('students').delete().eq('id', student.id);

    // 4. Delete auth.users (no CASCADE from students to auth)
    await supabaseAdmin.auth.admin.deleteUser(student.id);

    deleted++;
  } catch (err) {
    console.error(`hard-delete-accounts: failed for ${student.id}:`, err);
    failed++;
  }
}
```

**pg_cron schedule setup (manual SQL Editor step — do NOT put in migration file):**

```sql
SELECT cron.schedule(
  'hard-delete-accounts',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/hard-delete-accounts',
    headers := '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}',
    body := '{}'::jsonb
  );
  $$
);
```

**Env vars required:**
- `CRON_SECRET` (already exists — reuse from send-daily-push)
- `SUPABASE_URL` (auto-injected)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injected)

---

### Feature 2: verify:patterns Fix (ESM Import Extension)

**Root cause:** `patternVerifier.mjs` imports `patternBuilder.js` which imports `keySignatureUtils.js`
which imports `../constants/keySignatureConfig` without the `.js` extension. Node 22 ESM resolver
requires explicit `.js` extensions for relative imports. Vite's bundler resolves them automatically
(why it works in browser but fails with `node`).

**The broken import chain:**

```
scripts/patternVerifier.mjs
  imports patternBuilder.js                    (.js present — OK)
    imports keySignatureUtils.js               (.js present — OK)
      imports ../constants/keySignatureConfig  <- MISSING .js extension
```

**File to modify:**

| File | Change | Type |
|------|--------|------|
| `src/components/games/sight-reading-game/utils/keySignatureUtils.js` | Add `.js` to import on line 1 | MODIFIED |

**The fix (line 1):**

```js
// Before:
import { KEY_NOTE_LETTERS } from "../constants/keySignatureConfig";

// After:
import { KEY_NOTE_LETTERS } from "../constants/keySignatureConfig.js";
```

**Verification:** `npm run verify:patterns` must exit 0 after the fix.

**Risk:** Zero. Vite ignores the `.js` extension in browser context; Node requires it. The extension
is valid for both environments.

---

### Feature 3: ESLint Warnings Cleanup (~576 warnings across 97 files)

**Warning inventory (from codebase inspection, 2026-03-19):**

| Rule | Count | Root Cause |
|------|-------|------------|
| `no-undef` (vitest globals) | ~320 | Test files not recognized as vitest environment; `expect`, `vi`, `describe`, `it`, `test`, `afterEach`, `beforeEach` reported undefined |
| `no-unused-vars` | ~183 | Unused imports, dead variables, destructured-but-ignored params |
| `react-hooks/exhaustive-deps` | ~43 | Missing hook deps; some intentional, some genuine bugs |
| `react-refresh/only-export-components` | ~18 | Constants co-exported from component files |
| `no-undef` (process, module, require) | ~10 | Config files use Node.js globals but ESLint treats them as browser context |

**Recommended batch fix order (highest yield, lowest risk first):**

**Step 1 — ESLint config: add test file override** (fixes ~320 warnings in one change):

```js
// eslint.config.js — add after existing base config object
{
  files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', '**/__tests__/**/*.{js,jsx}'],
  languageOptions: {
    globals: {
      ...globals.browser,
      describe: 'readonly',
      it: 'readonly',
      test: 'readonly',
      expect: 'readonly',
      vi: 'readonly',
      beforeEach: 'readonly',
      afterEach: 'readonly',
      beforeAll: 'readonly',
      afterAll: 'readonly',
    },
  },
},
```

Note: `globals.vitest` may not exist in the installed `globals` package version — declare each
global explicitly as shown above to be safe.

**Step 2 — ESLint config: add node globals override for config/scripts** (fixes ~10 warnings):

```js
{
  files: ['*.config.{js,mjs}', 'scripts/**/*.{js,mjs}'],
  languageOptions: {
    globals: { ...globals.node },
  },
},
```

This covers `process` in `vite.config.js`, `module` in `tailwind.config.js`, and `require` in
`scripts/`.

**Step 3 — Run `npm run lint:fix`** — auto-fixes trivially auto-fixable issues (whitespace, some
unused vars that ESLint can detect as removable).

**Step 4 — Manual pass on `no-unused-vars`** (~183 after Step 3). High-density files to
prioritize: `SightReadingGame.jsx`, `MetronomeTrainer.jsx`, `NotesRecognitionGame.jsx`,
`VictoryScreen.jsx`. Pattern: either remove the unused variable or rename to `_varName` convention
to indicate intentional non-use.

**Step 5 — Manual pass on `react-hooks/exhaustive-deps`** (~43). Each case requires judgment:
- Stable refs (e.g., `audioEngine` is a ref) — can safely add to deps or suppress with comment
- Intentional omissions (e.g., `debugLog` is a stable function) — add `// eslint-disable-next-line react-hooks/exhaustive-deps` with a comment explaining why

**Step 6 — Manual pass on `react-refresh/only-export-components`** (~18). Either:
- Move constants to a sibling `constants.js` file (preferred)
- Or suppress with `// eslint-disable-next-line react-refresh/only-export-components`

**Files to modify:**

| File | Change Type |
|------|------------|
| `eslint.config.js` | MODIFIED — add test override block + config file override |
| ~97 source files | MODIFIED — remove unused vars, fix or suppress hook deps |

No new files required for ESLint cleanup.

---

### Feature 4: Pending DB Migration (daily_challenges.sql)

**What:** `supabase/migrations/20260317000001_daily_challenges.sql` creates the
`student_daily_challenges` table with RLS. Already written; never applied to remote Supabase.

**Integration:**

| Artifact | New or Modified | Action |
|---|---|---|
| Remote Supabase database | MODIFIED | Apply via `supabase db push` or paste into SQL Editor |
| Nothing in `src/` | — | Table already wired in `dailyChallengeService.js` and `DailyChallengeCard.jsx` |

**Risk:** Zero. The app already queries this table — until migrated, all daily challenge queries
return empty results silently. Migration is additive (no existing rows, no schema conflicts).

---

### Feature 5: Production QA Strategy

**Scope:** Structured test checklist across all flows before promoting to real users. No code
changes — produces a signed-off QA document.

**Integration boundaries that must be covered:**

```
Auth flows:
  signup → COPPA consent email → parent verifies → account active
  login → role detection → dashboard
  forgot password → reset email → /reset-password (PKCE) → new password set

Game flows (4 modes, trail + free play):
  trail: nodeId in location.state → auto-start → game → VictoryScreen
         → updateExerciseProgress() / updateNodeProgress()
  free play: no nodeId → VictoryScreen → calculateFreePlayXP() → awardXP()

Payment flow:
  locked node tapped → child paywall modal (no prices) → parent portal
  → Lemon Squeezy overlay checkout → payment complete → webhook POST
  → parent_subscriptions UPSERT → Realtime invalidates SubscriptionContext
  → locked node becomes accessible

COPPA deletion flow:
  request deletion → account_status = 'suspended_deletion' → sign out
  → 30-day grace → hard delete Edge Function runs (new in v2.5)

Streak / push notification:
  practice recorded → streak updated → push notification skipped (practiced today)
```

**Test matrix dimensions:**

| Dimension | Values |
|---|---|
| Device | iOS Safari PWA, Android Chrome PWA, Desktop Chrome |
| Language | English (LTR), Hebrew (RTL) |
| Account type | Student (free tier), Student (subscribed), Teacher |
| Game mode | NotesRecognition, SightReading (mic + keyboard), MetronomeTrainer, MemoryGame |
| Input method | Keyboard (Klavier), Microphone |

---

## Architectural Patterns

### Pattern 1: CRON Edge Function (extend for hard-delete)

**What:** Scheduled Edge Function invoked by pg_cron via HTTP POST with `x-cron-secret` header.
Uses service_role client (bypasses RLS). Returns summary JSON.

**When to use:** Any scheduled background job requiring DB writes without a user JWT.

**Example structure:**

```typescript
// config.toml: verify_jwt = false
// Env: CRON_SECRET (manual), SUPABASE_SERVICE_ROLE_KEY (auto-injected)

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  // ... do work ...
  return new Response(JSON.stringify({ processed, failed }), { status: 200 });
});
```

**Trade-offs:** Simple, no OAuth token management. Secret must match between Supabase Vault (used
by pg_cron) and Edge Function secrets (set via `supabase secrets set`).

---

### Pattern 2: Defense-in-Depth Deletion

**What:** Three-layer deletion sequence for complete student data removal.

**Sequence:**

```
1. Storage files     (no Postgres FK — must be explicit)
2. Tables without CASCADE (parent_subscriptions — confirm FK)
3. students row      (triggers ON DELETE CASCADE for all child tables)
4. auth.users        (admin API — no FK cascade from students to auth)
```

**Why this order matters:** Postgres `ON DELETE CASCADE` only fires when the FK parent row is
deleted. `students.id` is the parent, so it must be deleted last among DB tables. Storage and
`auth.users` are entirely outside the Postgres FK graph.

---

### Pattern 3: ESLint Flat Config Layering (ESLint v9)

**What:** Multiple config objects in the `eslint.config.js` array. Later objects override earlier
ones for matching file patterns.

**When to use:** Applying different rule sets to test files vs. source files vs. config files.

**Example:**

```js
export default [
  { ignores: ['dist'] },
  { files: ['**/*.{js,jsx}'], /* base rules */ },
  { files: ['**/*.test.{js,jsx}', '**/__tests__/**'], languageOptions: { globals: { ...vitestGlobals } } },
  { files: ['*.config.{js,mjs}', 'scripts/**'], languageOptions: { globals: globals.node } },
];
```

**Trade-offs:** Single point of configuration change rather than per-file suppressions. The
`globals.vitest` named set may not exist in the installed `globals` version — fall back to manual
declaration (shown in Feature 3 section).

---

## Data Flow

### Hard Delete Flow

```
pg_cron (02:00 UTC daily)
    |
    | POST /functions/v1/hard-delete-accounts
    | x-cron-secret header
    v
Edge Function: hard-delete-accounts
    |
    | service_role client
    v
SELECT students
  WHERE account_status = 'suspended_deletion'
    AND deletion_scheduled_at < NOW()
    |
    | for each student:
    v
  1. storage.list(student_id) + storage.remove(files)
  2. from('parent_subscriptions').delete()  [if no CASCADE]
  3. from('students').delete()  --> CASCADE fires for child tables
  4. auth.admin.deleteUser(id)
    |
    v
return { deleted, failed, skipped }
```

### verify:patterns Fix Flow

```
npm run verify:patterns
    |
    v
node scripts/patternVerifier.mjs
    |
    v
import patternBuilder.js (ESM, Node 22)
    |
    v
patternBuilder.js imports keySignatureUtils.js
    |
    v
keySignatureUtils.js imports keySignatureConfig.js  <- .js extension added
    |
    v
pattern generation runs, stats printed, exits 0
```

### ESLint Fix Flow

```
eslint.config.js (modified)
    |
    +-- test file override: vitest globals declared  --> fixes ~320 no-undef
    +-- config file override: node globals declared  --> fixes ~10 no-undef (process, module)
    |
npm run lint:fix  --> auto-fixes trivial issues
    |
manual no-unused-vars sweep (~183 remaining)
    |
manual react-hooks/exhaustive-deps sweep (~43)
    |
target: 0 warnings
```

---

## Integration Summary: New vs Modified

### New Artifacts

| Artifact | Purpose |
|---|---|
| `supabase/functions/hard-delete-accounts/index.ts` | COPPA hard delete cron job |
| pg_cron schedule SQL (manual SQL Editor step, not a migration) | Triggers hard-delete daily at 02:00 UTC |

### Modified Artifacts

| Artifact | Change |
|---|---|
| `supabase/config.toml` | Add `[functions.hard-delete-accounts]` block with `verify_jwt = false` |
| `src/components/games/sight-reading-game/utils/keySignatureUtils.js` | Add `.js` extension to `keySignatureConfig` import on line 1 |
| `eslint.config.js` | Add test file globals override + config file globals override |
| ~97 source files | Remove unused vars, fix or suppress hook deps (ESLint cleanup) |

### Applied (not code changes)

| Artifact | Action |
|---|---|
| `supabase/migrations/20260317000001_daily_challenges.sql` | Apply to remote via `supabase db push` or SQL Editor |

---

## Build Order Recommendation

Dependencies between features determine this order:

```
1. DB migration (daily_challenges.sql) [zero code change, lowest risk]
   Prerequisite for valid QA of DailyChallengeCard. Apply first.

2. verify:patterns fix (1-line change)
   Isolated, zero risk. Restores broken build validation.
   Run: npm run verify:patterns to confirm.

3. ESLint config fix (eslint.config.js change)
   Fixes ~330 warnings in one commit before touching source files.
   Run: npm run lint to confirm warning count drops.

4. ESLint source file cleanup (~97 files, can be split into commits)
   No functional impact. Safe to do in parallel with hard delete work.

5. Hard delete Edge Function
   Requires:
     a. FK audit on parent_subscriptions (SQL Editor query)
     b. New function file + config.toml entry
     c. Deploy: supabase functions deploy hard-delete-accounts
     d. pg_cron schedule (manual SQL Editor step for production only)
     e. Test with a dummy suspended account before enabling cron

6. Production QA (final step)
   Validates all of 1-5 plus all existing features.
   Test matrix: 3 devices x 2 languages x 3 account types x 4 game modes.
```

---

## Scaling Considerations

| Scale | Architecture Impact |
|-------|---------------------|
| Current (beta, <100 users) | Hard delete cron is O(n) per student; no batching needed |
| 1k users | Fine — hard delete targets only accounts past 30-day grace, which is rare |
| 10k+ users | Add batch size cap in hard-delete loop; add delay between `auth.admin.deleteUser()` calls to avoid rate-limiting Supabase admin API |

---

## Anti-Patterns

### Anti-Pattern 1: Relying Solely on Postgres CASCADE for Hard Delete

**What people do:** DELETE from `students` and assume all user data is gone.

**Why it's wrong:** Supabase Storage files (`practice-recordings` bucket) are not in Postgres and
have no FK — they will not cascade. `auth.users` also requires an explicit admin API call.
Orphaned storage files and auth records persist indefinitely.

**Do this instead:** Explicit three-layer sequence: storage files, then students row (triggers
cascade), then `auth.admin.deleteUser()`.

---

### Anti-Pattern 2: Using eslint-disable to Silence Warning Volume

**What people do:** Add `// eslint-disable-next-line no-undef` to every test file to silence
vitest globals.

**Why it's wrong:** 300+ inline suppressions are noise, obscure real problems, and do not survive
adding new test files.

**Do this instead:** Add a single test file override in `eslint.config.js` that declares vitest
globals once for all `*.test.*` files.

---

### Anti-Pattern 3: Putting pg_cron Schedule in a Migration File

**What people do:** Add `SELECT cron.schedule(...)` directly to a migration SQL file.

**Why it's wrong:** Migration files run on every `supabase db push`. If the cron job already
exists, the schedule call fails or creates duplicate jobs. The existing project pattern
(send-daily-push, send-weekly-report) explicitly puts cron schedules as commented-out instructions
in migration file comments, to be run once manually in the SQL Editor.

**Do this instead:** Document the `cron.schedule()` call in a comment block in the migration or
function header (per existing project pattern), and execute it once manually in the Supabase SQL
Editor for production. Never automate the schedule creation in a migration.

---

## Sources

- Direct codebase inspection (all HIGH confidence):
  - `supabase/migrations/` (full history — CASCADE relationships confirmed)
  - `supabase/functions/send-daily-push/index.ts` (CRON pattern reference)
  - `supabase/config.toml` (function registration pattern)
  - `src/services/accountDeletionService.js` (soft delete contract)
  - `src/services/practiceService.js` (storage bucket name: `practice-recordings`)
  - `scripts/patternVerifier.mjs` + `src/.../utils/keySignatureUtils.js` (import chain)
  - `eslint.config.js` + live ESLint run (warning breakdown)
  - `package.json` (script definitions)

---
*Architecture research for: PianoApp2 v2.5 Launch Prep*
*Researched: 2026-03-19*
