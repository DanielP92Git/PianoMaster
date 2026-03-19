# Pitfalls Research: Launch Prep (v2.5)

**Domain:** Launch-prep features on a COPPA-regulated children's piano learning PWA with real beta users
**Researched:** 2026-03-19
**Confidence:** HIGH (direct codebase review; code paths, schema, and warning inventory verified)

---

## Context

This document covers common mistakes when adding these five capabilities to the existing 86K LOC
codebase that has real beta users with existing data:

1. **Hard delete Edge Function** — permanently deleting child data after 30-day grace (COPPA)
2. **ESLint warnings cleanup** — bulk-fixing ~574 warnings across 86K LOC without regressions
3. **Production testing** — QA checklist for children's ed app with payment, auth, games, trail, COPPA
4. **Legal documentation** — COPPA/privacy materials prepared for attorney review
5. **DB migration application** — running `20260317000001_daily_challenges.sql` on production with live users

Verified files at time of research:
- `src/services/accountDeletionService.js` — soft-delete logic; references Edge Function for hard delete
- `src/services/dataExportService.js` — STUDENT_DATA_TABLES list (used for both export AND delete scope)
- `supabase/migrations/20260201000001_coppa_schema.sql` — account_status states, cascade structure
- `supabase/migrations/20260317000001_daily_challenges.sql` — pending migration to apply
- `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` — parent_subscriptions table
- `eslint.config.js` — current ESLint config
- `npm run lint` output — 574 warnings: ~270 test `no-undef`, ~43 `react-hooks/exhaustive-deps`, ~17 `react-refresh/only-export-components`, ~200 `no-unused-vars`

---

## Critical Pitfalls

### Pitfall 1: Hard Delete Misses auth.users — Student Row Deleted But Login Still Works

**What goes wrong:**
The hard delete Edge Function deletes the student from the `students` table (CASCADE handles all
child rows), but never calls `supabase.auth.admin.deleteUser(studentId)` to remove the user from
`auth.users`. The student's login credentials remain valid. The child's authentication session
is revoked, but a parent could still attempt to log back in and receive a "credentials invalid"
message instead of "account deleted." Worse, if the student re-registers with the same email,
Supabase Auth will recognize the email as taken — even though there is no student record.

**Why it happens:**
`accountDeletionService.js` comments explicitly describe a two-step delete: "1. Delete from
students table (CASCADE handles related data) 2. Delete from auth.users using admin API." The
two-step pattern requires two different API surfaces: the Supabase Data API for the `students`
row and the Supabase Admin Auth API for `auth.users`. It is easy to implement step 1 and consider
the job done. The admin auth delete requires `SUPABASE_SERVICE_ROLE_KEY` and a different client
instantiation (`createClient` with `auth: { autoRefreshToken: false, persistSession: false }`).

**How to avoid:**
- In the Edge Function, delete from `students` first, then immediately call
  `supabase.auth.admin.deleteUser(studentId)` using a service-role admin client.
- Wrap both operations in a try/catch: if `auth.users` delete fails, log the student ID for
  manual cleanup — do not leave the `students` row deleted with auth intact.
- Add a test: after Edge Function runs, verify that the student UUID is absent from both
  `students` (via service role query) AND that a login attempt with the old credentials returns
  an auth error, not a missing-student error.

**Warning signs:**
- Post-deletion login attempt produces "Invalid login credentials" (expected: no such account).
- Supabase Auth dashboard shows user with no corresponding `students` row.
- New registration with deleted email produces "email already taken" error.

**Phase to address:** Hard Delete Edge Function implementation phase — make the two-step pattern
explicit in the phase plan as the primary success criterion.

---

### Pitfall 2: Hard Delete Misses parent_subscriptions — Lemon Squeezy Orphan Record

**What goes wrong:**
`parent_subscriptions` uses `student_id` as a foreign key to `students`, but based on the schema
inspection the FK may not have `ON DELETE CASCADE`. The `upsertSubscription.ts` function creates
rows in `parent_subscriptions` with `student_id` pointing to `students(id)`, and the Lemon Squeezy
webhook uses `ls_subscription_id` as its own conflict target — not `student_id`. If the `students`
row is hard-deleted without the FK having CASCADE, the `parent_subscriptions` row becomes an orphan.
This is not just a data hygiene issue: the Lemon Squeezy subscription remains active and billing
continues. The parent is charged for a deleted account.

**Why it happens:**
`parent_subscriptions` was introduced in v1.8 (monetization) and the cascade deletion behavior
was not in scope during the COPPA deletion design (v1.0). The `dataExportService.js`
`STUDENT_DATA_TABLES` list does NOT include `parent_subscriptions`, which means neither the
export nor any documented deletion sequence covers it.

**How to avoid:**
- Before writing the Edge Function, audit the production schema: run
  `SELECT conname, confdeltype FROM pg_constraint WHERE confrelid = 'students'::regclass`
  to verify all FKs from `parent_subscriptions` to `students` have `CASCADE` (confdeltype = 'a').
- If the FK is missing or is `RESTRICT`/`NO ACTION`, add a migration:
  `ALTER TABLE parent_subscriptions ADD CONSTRAINT ... REFERENCES students(id) ON DELETE CASCADE;`
- Cancel the Lemon Squeezy subscription via their API *before* deleting the `students` row.
  This prevents continued billing and puts the record in `cancelled` status. Then allow CASCADE
  to clean up the DB row.
- Add `parent_subscriptions` to `STUDENT_DATA_TABLES` in `dataExportService.js` regardless —
  that list represents the COPPA "right to access" scope and should be complete.

**Warning signs:**
- `STUDENT_DATA_TABLES` in `dataExportService.js` does not include `parent_subscriptions` — it does not.
- After deleting a paying student, the parent receives a next-month invoice from Lemon Squeezy.
- Production Supabase shows `parent_subscriptions` rows with no matching `students` row.

**Phase to address:** Hard Delete Edge Function phase — the first pre-implementation step should
be a schema CASCADE audit for every table that references `students`.

---

### Pitfall 3: Hard Delete Runs Against Active Grace-Period Accounts — Silent Data Loss

**What goes wrong:**
The Edge Function query is:
```sql
SELECT id FROM students
WHERE account_status = 'suspended_deletion'
  AND deletion_scheduled_at < NOW()
```
If the cron schedule or time zone handling is misconfigured, `deletion_scheduled_at < NOW()` could
match accounts still inside their 30-day grace window. `deletion_scheduled_at` is set in client JS
as `new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)`, which is correct, but if the Edge Function
runs in a different time zone context than expected, or if the Supabase `now()` function reflects
an unexpected offset, records could be processed prematurely.

Children's data deleted before the grace window expires is a COPPA violation: the regulation
requires the parent to have a reasonable recovery window.

**Why it happens:**
JavaScript `new Date()` timestamps are UTC; Supabase `now()` is also UTC; this should be safe.
The trap is when a developer tests the function locally by manually setting `deletion_scheduled_at`
to 1 minute from now, then deploys without resetting — or when a cron misconfiguration causes
the job to run multiple times in rapid succession, hitting records that were just added.

**How to avoid:**
- Add a 1-hour buffer to the query: `deletion_scheduled_at < NOW() - INTERVAL '1 hour'`
  to prevent edge-case race conditions.
- Add a `MAX_BATCH_SIZE` guard (e.g., `LIMIT 50`) so a runaway cron cannot delete hundreds
  of accounts in a single invocation.
- Log every deleted account ID to an audit table or Supabase log before deleting it.
- Test the function with `DRY_RUN=true` mode that logs who *would* be deleted without acting.
- Require `X-Admin-Authorization` header (in addition to `x-cron-secret`) for the Edge Function
  to prevent accidental invocation from non-cron callers.

**Warning signs:**
- Edge Function invocation logs show more than ~5 deletions per day (unexpected volume).
- A student who cancelled deletion and restored their account still gets deleted.
- `deletion_scheduled_at` timestamps in `students` table are less than 30 days old.

**Phase to address:** Hard Delete Edge Function phase — include a dry-run mode as a required
feature before deploying the live-deletion version.

---

### Pitfall 4: ESLint `react-hooks/exhaustive-deps` Auto-Fix Creates Infinite Render Loops

**What goes wrong:**
There are 43 `react-hooks/exhaustive-deps` warnings in the codebase. The `--fix` flag does NOT
auto-fix these — ESLint reports them as needing manual intervention. If a developer adds the
missing dependency to the array without verifying the dependency is stable (memoized or a ref),
the hook will now run on every render because the dependency is a new object/function reference
each time. This is particularly dangerous in the audio pipeline where hooks like
`useCallback` in `SightReadingGame.jsx` have `audioEngine`, `startGame`, and `updateSettings`
as known missing deps — these are likely intentionally omitted because they are not stable.

**Why it happens:**
The lint tool says "add X to the dependency array." It does not say "also wrap X in useCallback
first." A developer fixing 43 warnings in bulk will add all missing deps mechanically. The game
will appear to work initially but will exhibit subtle infinite re-render loops at runtime that
are hard to bisect back to a specific ESLint fix.

**How to avoid:**
- Fix `exhaustive-deps` warnings one file at a time, never in bulk. For each warning:
  1. Check if the missing dep is stable (ref, useState setter, or wrapped in useCallback/useMemo).
  2. If not stable: wrap it first, then add to deps. If wrapping creates a new warning, fix that first.
  3. Run the specific game/component after each file fix to confirm no regression.
- The correct fix for `audioEngine` warnings is likely `eslint-disable-next-line` with a comment
  explaining *why* it is intentionally omitted (AudioContext singleton, stable reference).
- Never add `// eslint-disable-line react-hooks/exhaustive-deps` as a bulk suppression sweep
  without understanding each case — this hides real bugs.

**Warning signs:**
- Component re-renders continuously (React DevTools profiler shows "hot" component with no
  user interaction).
- AudioContext warning: "The AudioContext was not allowed to start" fires on every render.
- After ESLint fix, the combo system in `NotesRecognitionGame` resets on every correct answer.

**Phase to address:** ESLint cleanup phase — process `exhaustive-deps` warnings in a dedicated
pass, separately from the mechanical `no-unused-vars` and `no-undef` passes.

---

### Pitfall 5: Fixing `no-unused-vars` Removes Variables That Are Actually Used as Side Effects

**What goes wrong:**
Several `no-unused-vars` warnings flag variables that are destructured from hook returns where
only the side-effect matters. For example:
- `practiceService.js:52` — `uploadResult` is assigned but unused — but the upload itself is the
  intended behavior; removing the assignment does not remove the upload call.
- `streakService.js:464` — `existingComebackStart` is assigned but unused — but the database query
  that sets it may contain side effects the developer intends.

The dangerous pattern: `const [data, error] = await supabase.from(...).select(...)` where `data`
is flagged as unused. If the developer deletes the destructure and writes
`await supabase.from(...).select(...)`, the behavior is identical — no regression. But if they
write `const { error } = ...` without the leading `data`, they introduce a TypeScript-style error
in plain JS that is silently valid.

The actual risk: `no-unused-vars` on import statements. If a service file imports `getNodeById`
(currently flagged in `skillProgressService.js`) and a developer removes the import as an unused
variable, any code path that happens to call `getNodeById` at runtime via a dynamic import or
other indirection will break silently.

**Why it happens:**
Bulk ESLint fixes treat all `no-unused-vars` identically. Import-level unused vars are the
dangerous class; local unused vars are mostly safe to remove or prefix with `_`.

**How to avoid:**
- For unused **imports**: verify with a code search that the export is unused across the entire
  codebase before removing it. Use `grep` or IDE references.
- For unused **local variables** that are assignments from async calls: prefer prefixing with `_`
  (`_uploadResult`) to suppress the warning without removing the call.
- For `EXERCISE_TYPES` in `skillProgressService.js`: search all consumers before removing the import.
- Process files in service layer and utility layer separately from component layer — different risk profiles.

**Warning signs:**
- After ESLint fix, `npm run build` succeeds but `npm run test:run` shows new test failures.
- Runtime error: "getNodeById is not a function" in a code path that was not in the changed file.
- A component silently stops rendering because an import it depended on was removed from a service.

**Phase to address:** ESLint cleanup phase — separate import removals from local variable removals.
Run `npm run test:run` after each file batch.

---

### Pitfall 6: Applying `daily_challenges.sql` Migration Fails Silently If Table Already Partially Exists

**What goes wrong:**
`20260317000001_daily_challenges.sql` uses `CREATE TABLE student_daily_challenges` (not
`CREATE TABLE IF NOT EXISTS`). If a developer ran partial setup manually in the Supabase SQL
editor (a common pattern during development), the table already exists in production. Applying
the migration via `supabase db push` will error out at the `CREATE TABLE` line, but `supabase db push`
may report the migration as applied (adding it to `supabase_migrations`) even though the table
creation failed and the RLS policies were never created. The result: the `student_daily_challenges`
table exists but has no RLS and no index — data is exposed to all authenticated users.

**Why it happens:**
The migration was written without `IF NOT EXISTS` guards for either the table or the index. This
is fine for a clean production database that has never had manual intervention, but the project
has a history of manual SQL editor usage during development.

**How to avoid:**
- Before applying the migration, check production: `SELECT to_regclass('public.student_daily_challenges')`
  — if it returns non-null, the table exists. Check its RLS status:
  `SELECT relrowsecurity FROM pg_class WHERE relname = 'student_daily_challenges'`.
- If the table exists but has no RLS, apply only the `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  and `CREATE POLICY` statements manually.
- After migration: verify the index exists via
  `SELECT indexname FROM pg_indexes WHERE tablename = 'student_daily_challenges'`.
- For future migrations: use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` guards
  to make all migrations idempotent.

**Warning signs:**
- `supabase db push` logs show the migration timestamp as applied but the push output includes an error.
- `dailyChallengeService.js` `getTodaysChallenge()` returns rows for students other than the caller
  (RLS not active).
- The Supabase dashboard does not show RLS as "enabled" for `student_daily_challenges`.

**Phase to address:** DB migration application phase — treat this as a manual verification task,
not a blind `supabase db push` command.

---

### Pitfall 7: Production Testing Skips COPPA Flows — Legal Risk Identified Post-Launch

**What goes wrong:**
A production QA checklist that covers game modes, auth, and payment but skips COPPA-specific
flows will pass. The COPPA flows (consent email delivery, consent verification link,
parental consent math gate for push notifications, account deletion request, and the
cancel-deletion recovery) are low-traffic but high-consequence. A broken consent email
in production means a child's account is blocked indefinitely with no recovery path.
A broken deletion flow means a parent cannot exercise COPPA rights — this is a legal violation.

**Why it happens:**
QA checklists are typically written by developers who spend most of their time on the
happy path (game flows, subscriptions). COPPA edge cases require creating test child
accounts, real email delivery to a test inbox, and timed grace-period state transitions —
none of which are in a typical "can I play a game and earn XP" manual test pass.

**How to avoid:**
- Include dedicated COPPA test scenarios as non-optional checklist items:
  1. Create under-13 student account → verify consent email arrives in test inbox
  2. Click consent link → verify account becomes active
  3. Request account deletion → verify `account_status = 'suspended_deletion'` in DB
  4. Cancel deletion within grace → verify `account_status = 'active'` restored
  5. Enable push notifications → verify parent math gate blocks without solution
  6. Solve math gate → verify `parent_consent_granted = true` in DB
- Use a dedicated test email address (e.g., a gmail alias with `+coppa-test`) for
  consent email testing to avoid interference with real users.
- The legal documentation reviewer (attorney) should receive the QA results for COPPA
  flows specifically — not just the legal text.

**Warning signs:**
- Production QA checklist has "Auth flows: PASS" but no sub-items for consent email,
  consent verification, or deletion flows.
- No Brevo email delivery test was performed in production environment.
- The attorney review only covers the privacy policy text, not the actual consent flow behavior.

**Phase to address:** Production testing phase — COPPA flows must be a first-class checklist
section, not an afterthought.

---

### Pitfall 8: `verify:patterns` Fix Introduces Import Path Divergence Between Node ESM and Vite

**What goes wrong:**
`npm run verify:patterns` fails because `keySignatureUtils.js` imports from
`../constants/keySignatureConfig` without a `.js` extension. Node ESM requires explicit
extensions; Vite resolves extensionless imports via its resolver. The file
`src/components/games/sight-reading-game/constants/keySignatureConfig.js` exists, so the
fix is to add `.js` to the import. But if the developer fixes this by changing the import
in `keySignatureUtils.js` and then `keySignatureConfig.js` itself has an import that also
lacks the `.js` extension, the same error re-emerges one level deeper.

The risk of a hasty fix: the developer may change `keySignatureConfig` to use a `.mjs`
extension (to signal ESM compatibility) or add a `type: "module"` to a local `package.json`.
Both changes break the Vite build, which handles extensions transparently but does not
expect `.mjs` files in `src/`.

**Why it happens:**
The codebase uses Vite's resolver for all browser-facing code. The `verify:patterns` script
runs in Node ESM directly, bypassing Vite. This dual-resolver environment means any import
written for Vite's tolerant resolver will fail in strict Node ESM. The script worked before
`keySignatureConfig.js` was added (a v2.4 artifact) because the pre-existing imports in
`patternBuilder.js` happened to be either relative paths with extensions or package imports.

**How to avoid:**
- The correct fix: add `.js` extension to the failing import in `keySignatureUtils.js`
  *and* scan all imports within `keySignatureConfig.js` for the same pattern.
- Do NOT use `.mjs` extensions or add `type: "module"` to local directories.
- After the fix, run both `npm run verify:patterns` AND `npm run build` to confirm both
  the Node script and the Vite build still pass.
- Consider adding `verify:patterns` to the CI pre-build step (alongside `validateTrail.mjs`)
  so this class of regression is caught automatically on every commit.

**Warning signs:**
- `npm run verify:patterns` error message references a second missing module after the first fix.
- `npm run build` fails after adding `.js` extensions (this should not happen — if it does, a
  `.mjs` extension was introduced somewhere).
- The Vite dev server hot-reload stops working for `keySignatureUtils.js` after the fix.

**Phase to address:** Build tooling fix phase — isolate from ESLint cleanup; run both scripts
to confirm before moving to test phases.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Delete `students` row without cancelling Lemon Squeezy subscription first | Simpler Edge Function code | Parent continues to be billed after child data is deleted | Never |
| Suppress all `exhaustive-deps` warnings with `eslint-disable` comments | 43 warnings disappear immediately | Real infinite-loop bugs hidden; future developers cannot trust the lint | Never |
| Apply `daily_challenges.sql` with blind `supabase db push` without pre-check | One command instead of manual verification | Table may exist with no RLS — child data exposed | Never |
| Skip `auth.users` delete in hard-delete function | Simpler function, avoid Admin API | Credentials remain valid; email is blocked from re-registration; COPPA non-compliance | Never |
| Fix `no-unused-vars` in bulk with search-replace `const _` prefix | Fast 200-warning reduction | Masking a real unused-import issue that should be removed vs. a true side-effect variable | Only for local vars confirmed to be side-effect-only; never for imports |
| Add `.js` extensions only to the first failing import in patternVerifier chain | Passes first error | A second (or third) import in the chain fails — fix takes multiple iterations | Acceptable if each iteration is verified with a test run |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Admin Auth API | Using the anon client for `deleteUser` | Create a separate service-role admin client; `admin.deleteUser()` requires `SUPABASE_SERVICE_ROLE_KEY` |
| Lemon Squeezy API in Edge Function | Forgetting that cancel-before-delete requires `ls_subscription_id` from `parent_subscriptions` | Fetch `ls_subscription_id` first; if absent (no subscription), skip LS cancel and proceed with DB delete |
| Supabase `db push` on production | Assuming idempotency for migrations not written with `IF NOT EXISTS` | Manually pre-check table existence; apply only missing statements if partial state detected |
| ESLint `--fix` flag | Expecting it to fix `react-hooks/exhaustive-deps` | `--fix` only auto-repairs 2 of 574 warnings; the rest require manual edits |
| Node ESM vs Vite import resolution | Writing extensionless imports that work in Vite but fail in `node --experimental-vm-modules` | Always use `.js` extension for local relative imports in files run by Node scripts directly |
| Brevo email delivery in production | Testing only in dev against Supabase local (which mocks emails) | Must test actual Brevo API call from production environment; check Brevo dashboard for delivery receipt |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Hard delete Edge Function processes all expired accounts in one invocation | Single invocation deletes 500 accounts simultaneously; Lemon Squeezy API rate-limits at 120 req/min | Add `LIMIT 50` to the batch query and schedule the cron to run multiple times per day | At >120 expired accounts on same day (unlikely in beta but should be designed for) |
| `dailyChallengeService.generateChallenge` called concurrently for the same student | Two simultaneous calls both find no challenge and attempt insert; second insert violates `UNIQUE(student_id, challenge_date)` | Table has `UNIQUE` constraint — this is already handled; second insert returns a conflict error; handle gracefully with `onConflict: 'ignore'` | During high-concurrency periods (e.g., morning rush of students opening the app) |
| ESLint cleanup adds `useCallback` wrapping to fix `exhaustive-deps` without profiling | Components that previously rendered once per interaction now re-render 3x due to new `useCallback` deps | Profile before and after any `useCallback` wrapping additions with React DevTools | In audio-heavy game components where even one extra render triggers AudioContext state changes |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Hard delete Edge Function callable without auth header | Anyone can trigger mass deletion by POSTing to the function URL | Require `x-cron-secret` header validation as the first check; return 401 before any database operation |
| Logging deleted student PII (name, email) in Edge Function console | PII visible in Supabase function logs, which are not COPPA-compliant storage | Log only the student UUID and deletion timestamp; never log names, emails, or DOB |
| `STUDENT_DATA_TABLES` in `dataExportService.js` incomplete | COPPA data export omits some student data (e.g., `parent_subscriptions`, `push_subscriptions`) — non-compliance on right-to-access requests | Audit every table with a `student_id` FK before the legal documentation review; add all missing tables |
| Attorney receives draft privacy policy without reviewing actual consent flow behavior | Attorney approves text that doesn't match implementation; consent flow is legally inaccurate | Provide attorney with both the policy text AND a screen recording of the consent flow + deletion flow |
| ESLint cleanup removes an authorization check that was "unused" in a particular code path | A RLS bypass or permission check is silently removed | Before removing any variable in `authorizationUtils.js`, `consentService.js`, or `accountDeletionService.js`, manually trace all call paths |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Production QA checklist written only for happy path | Broken consent recovery or deletion cancellation discovered by real users | Include explicit "cancel deletion within grace window" and "expired consent token" test scenarios |
| Legal documentation pages not linked from account deletion confirmation screen | Parent who just requested deletion cannot find the privacy policy or their rights | Verify that the deletion confirmation screen links to `/legal` and explains the grace period and right-to-access |
| ESLint cleanup silently removes i18n key strings that were "unused variables" | Hebrew users see English fallback strings or missing translation keys | Never remove string values from `locales/` files as part of an ESLint pass; ESLint does not understand i18n key usage |
| Hard delete sends no confirmation communication to parent | Parent who requested deletion does not know it occurred | Edge Function should trigger an email (via Brevo) to the parent's email address confirming permanent deletion, with a record-keeping timestamp |

---

## "Looks Done But Isn't" Checklist

- [ ] **Hard delete:** `auth.users` entry is absent after deletion — verify with Admin Auth API query,
  not just `students` table absence.
- [ ] **Hard delete:** `parent_subscriptions` FK has `ON DELETE CASCADE` — verify with `pg_constraint`
  query before writing the Edge Function.
- [ ] **Hard delete:** Lemon Squeezy subscription is cancelled before DB delete — verify in LS
  dashboard that subscription status is `cancelled` for test account.
- [ ] **Hard delete:** Audit log entry exists for every deletion — check that the Edge Function
  writes a timestamped record (student UUID, deletion timestamp) before deleting.
- [ ] **Daily challenges migration:** RLS is enabled on `student_daily_challenges` — verify
  `relrowsecurity = true` in `pg_class` after migration.
- [ ] **Daily challenges migration:** Index `idx_daily_challenges_student_date` exists — verify
  in `pg_indexes`.
- [ ] **ESLint cleanup:** `npm run test:run` passes after each batch of fixes — 0 test regressions.
- [ ] **ESLint cleanup:** `npm run build` passes after all fixes — 0 Vite build errors.
- [ ] **ESLint cleanup:** `react-hooks/exhaustive-deps` fixes were individually reviewed (not
  bulk-suppressed) — check git diff for `eslint-disable` comment count.
- [ ] **verify:patterns fix:** `npm run verify:patterns` exits 0 AND `npm run build` still passes.
- [ ] **STUDENT_DATA_TABLES completeness:** Every table with a `student_id` FK appears in
  `dataExportService.js` — compare against `pg_constraint` output.
- [ ] **Production COPPA test:** Consent email delivered to test inbox AND verification link works
  end-to-end in production environment (not dev/local).
- [ ] **Legal docs attorney review:** Attorney reviewed both the document text AND the live
  consent + deletion flows (not just text in isolation).

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| auth.users not deleted (Pitfall 1) | LOW | Run `supabase.auth.admin.deleteUser(id)` manually via Supabase dashboard for affected accounts |
| parent_subscriptions orphan after delete (Pitfall 2) | MEDIUM | Query LS API for active subscriptions with no matching student; cancel via LS admin panel; add missing CASCADE migration |
| Grace-period account deleted early (Pitfall 3) | HIGH | No data recovery possible; notify affected parent immediately; issue refund if subscription was active; document for FTC compliance |
| Infinite render loop from exhaustive-deps fix (Pitfall 4) | MEDIUM | `git revert` the specific file; re-fix with `eslint-disable` comment and reasoning; re-test |
| Broken import removed by no-unused-vars fix (Pitfall 5) | LOW | `git revert` the specific file; re-fix with `_` prefix on local vars; keep the import |
| Migration partial state — no RLS (Pitfall 6) | LOW | Manually apply `ALTER TABLE student_daily_challenges ENABLE ROW LEVEL SECURITY` and the two `CREATE POLICY` statements in Supabase SQL editor |
| COPPA flow broken in production (Pitfall 7) | HIGH | Hotfix the specific broken function; send notification to affected parents; document incident for attorney |
| verify:patterns fix breaks Vite build (Pitfall 8) | LOW | `git revert`; re-apply only the `.js` extension fix without any other file changes |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Pitfall 1: auth.users not deleted | Hard Delete Edge Function | Post-delete: admin query confirms UUID absent from auth.users |
| Pitfall 2: parent_subscriptions orphan | Hard Delete Edge Function (pre-implementation schema audit) | `pg_constraint` audit shows CASCADE on all student FKs; LS subscription cancelled before DB delete |
| Pitfall 3: Grace-period deletion | Hard Delete Edge Function (dry-run mode) | Dry-run log for a test account shows correct 30-day boundary; 1-hour buffer in query |
| Pitfall 4: Infinite render from exhaustive-deps | ESLint cleanup — exhaustive-deps pass | React DevTools profiler shows no unexpected re-renders after fixes |
| Pitfall 5: import removed as unused-var | ESLint cleanup — no-unused-vars pass | `npm run test:run` passes; import search confirms removed import has zero other consumers |
| Pitfall 6: Migration partial state | DB migration application | `relrowsecurity = true` in `pg_class`; index present in `pg_indexes` |
| Pitfall 7: COPPA flows untested | Production testing checklist | All 6 COPPA sub-scenarios explicitly marked PASS in checklist |
| Pitfall 8: verify:patterns fix breaks Vite | Build tooling fix | `npm run verify:patterns && npm run build` both exit 0 |

---

## Sources

- Direct codebase review:
  - `src/services/accountDeletionService.js` — two-step hard delete intent documented in comments
  - `src/services/dataExportService.js` — STUDENT_DATA_TABLES completeness gap identified
  - `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` — parent_subscriptions FK structure
  - `supabase/migrations/20260201000001_coppa_schema.sql` — CASCADE audit baseline
  - `supabase/migrations/20260317000001_daily_challenges.sql` — no IF NOT EXISTS guards
  - `eslint.config.js` — confirms no test environment globals (root cause of ~270 no-undef warnings)
  - `npm run lint` output — 574 warnings: categories and file-level counts verified
  - `npm run verify:patterns` output — exact error message and missing module path confirmed
- `scripts/patternVerifier.mjs` — imports confirmed; keySignatureUtils.js is the chain entry point
- Supabase documentation — Admin Auth API `deleteUser` requirement for user removal
- Lemon Squeezy API documentation — subscription cancellation endpoint and rate limits
- COPPA regulation 16 CFR Part 312 — right to deletion, required response window, record-keeping
- FTC COPPA guidance — requirement to confirm deletion to requesting parent

---

*Pitfalls research for: v2.5 Launch Prep — hard delete, ESLint cleanup, production testing, legal docs, DB migration*
*Researched: 2026-03-19*
