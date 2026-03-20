# Phase 12: Build Tooling Fixes - Research

**Researched:** 2026-03-20
**Domain:** Node.js ESM module resolution, Supabase CLI migration management
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BUILD-01 | `verify:patterns` script runs successfully with correct `.js` extension on keySignatureConfig import | Root cause confirmed via `npm run verify:patterns` — single line fix in `keySignatureUtils.js` |
| BUILD-02 | `daily_challenges.sql` migration applied to production Supabase | Migration exists locally but is absent from remote; migration history table out of sync — repair required before push |
</phase_requirements>

---

## Summary

Phase 12 has two completely independent tasks with verified root causes.

**BUILD-01** is a single-line bug: `keySignatureUtils.js` imports `keySignatureConfig` without the `.js` extension. In Node.js ESM (strict mode, `"type": "module"` in `package.json`), file extensions are required. Vite's build succeeds because Vite has its own resolver that tolerates extension-free imports — but `node scripts/patternVerifier.mjs` runs under raw Node ESM where the strict rule applies. The fix is adding `.js` to that one import. Three files import `keySignatureConfig` without `.js`; only `keySignatureUtils.js` is in the execution path of the verifier script.

**BUILD-02** is a Supabase migration sync problem. The migration `20260317000001_daily_challenges.sql` exists locally but has never been applied to the production database. Additionally, the local migration history table is out of sync with remote (6 remote-only entries, 5 local-only entries beyond the daily_challenges one). The `supabase db push --dry-run` command confirms the history divergence and recommends `migration repair` before push. The daily_challenges migration contains no `IF NOT EXISTS` guard, so the pre-check from STATE.md (checking with `SELECT to_regclass('public.student_daily_challenges')`) is mandatory to avoid a duplicate-table error.

**Primary recommendation:** Fix BUILD-01 with a one-line edit to `keySignatureUtils.js`. Fix BUILD-02 by repairing the migration history table, confirming the table does not already exist in production, then running `supabase db push`.

---

## Standard Stack

### Core Tools Involved

| Tool | Version | Purpose | Role in This Phase |
|------|---------|---------|-------------------|
| Node.js | 22.15.0 (confirmed) | ESM module resolution | Strict extension requirement causes BUILD-01 |
| Supabase CLI | 2.82.0 (confirmed) | Migration management | `db push` applies BUILD-02 migration |
| Vite | 6.3.5 | Build bundler | NOT affected — has own resolver, builds pass |
| Vitest | 3.2.4 | Test runner | NOT affected — also uses Vite resolver |

### Key Distinction: Node ESM vs Vite Resolver

| Execution Context | Extension Required? | How Imports Work |
|-------------------|--------------------|--------------------|
| `node script.mjs` | YES — mandatory | Strict Node ESM: no extension = `ERR_MODULE_NOT_FOUND` |
| `vite build` | NO — optional | Vite resolves `.js`, `.jsx`, `.ts`, bare names |
| `vitest run` | NO — optional | Uses Vite's resolver internally |

This is why the build passes and tests pass, but `verify:patterns` fails — it is the only script that runs under raw Node ESM.

---

## Architecture Patterns

### BUILD-01: The Broken Import Chain

```
patternVerifier.mjs (scripts/)
  └── patternBuilder.js          (import has .js -- CORRECT)
        └── keySignatureUtils.js (import has .js -- CORRECT)
              └── keySignatureConfig  <-- MISSING .js extension -- BROKEN
```

The verifier loads `patternBuilder.js` correctly (has `.js`). `patternBuilder.js` loads `keySignatureUtils.js` correctly (has `.js`). But `keySignatureUtils.js` line 1 imports `keySignatureConfig` without `.js`. Node ESM cannot resolve it.

The two other files that import `keySignatureConfig` without `.js` are:
- `KeySignatureSelection.jsx` — never runs under Node ESM (React component, Vite only)
- `keySignatureUtils.test.js` — runs under Vitest, which uses Vite resolver (not affected)

These two do NOT need fixing for the verifier to pass. However, fixing all three is cleaner and prevents future confusion.

### BUILD-02: Migration History State

```
Local migrations   |  Remote (production)
---                |  ---
20260304000001     |  (absent)
20260305000001     |  (absent)
20260307000001     |  (absent)
20260307000002     |  (absent)
20260308000001     |  (absent)
20260317000001     |  (absent) <-- the daily_challenges migration
                   |  20260127000004  (remote-only)
                   |  20260226000001  (remote-only)
                   |  20260226000002  (remote-only)
                   |  20260226000003  (remote-only)
                   |  20260304222919  (remote-only)
                   |  20260308120037  (remote-only)
```

The remote-only entries are migrations applied directly via the Supabase dashboard or worktree workflow in prior milestones. The `supabase db push` command refuses to run because it detects these orphaned remote entries.

**Repair command (confirmed from `--dry-run` output):**
```bash
npx supabase migration repair --status reverted 20260127000004 20260226000001 20260226000002 20260226000003 20260304222919 20260308120037
```

After repair, the local-only migrations (including `20260317000001`) can be pushed to remote.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Applying migration to production | Manual SQL in Supabase dashboard | `supabase db push` | CLI tracks migration history in `supabase_migrations` table; manual execution bypasses tracking and causes future sync errors |
| Resolving ESM extensions | Alias plugins or loader hooks | Add `.js` extension directly | Explicit extensions are the ESM spec — aliases add complexity with no benefit here |

---

## Common Pitfalls

### Pitfall 1: Fixing Only the Verifier-Path File
**What goes wrong:** Developer adds `.js` to `keySignatureUtils.js` only and ignores `KeySignatureSelection.jsx`. Verifier passes, but `.jsx` file remains inconsistent.
**Why it happens:** The `.jsx` import doesn't cause a runtime error currently, so it feels safe to ignore.
**How to avoid:** Fix all three files importing `keySignatureConfig` without `.js` extension in a single commit. Keeps the codebase consistent.
**Warning signs:** Any future script that imports from a `.jsx` file's dependency chain under raw Node ESM will break.

### Pitfall 2: Running `supabase db push` Without Repair First
**What goes wrong:** `db push` exits with error about remote migration versions not found locally.
**Why it happens:** The migration history table (`supabase_migrations`) on the remote has entries that don't correspond to local files.
**How to avoid:** Always run `supabase migration list` first to check sync state. Run `migration repair --status reverted` for any remote-only orphans before pushing.
**Warning signs:** `supabase db push --dry-run` exits with exit code 1 and mentions "Remote migration versions not found in local migrations directory."

### Pitfall 3: Applying Migration When Table Already Exists
**What goes wrong:** If `student_daily_challenges` was previously created via the dashboard outside migration tracking, `db push` will error on the `CREATE TABLE` statement (no `IF NOT EXISTS`).
**Why it happens:** The migration SQL has no guard clause.
**How to avoid:** Run `SELECT to_regclass('public.student_daily_challenges')` in the Supabase SQL editor before pushing. If it returns a non-null value, the table exists and must be handled (either the migration already ran, or it was created manually).
**Warning signs:** `db push` error: `relation "student_daily_challenges" already exists`.

### Pitfall 4: Push Applies All 6 Local-Only Migrations, Not Just daily_challenges
**What goes wrong:** After repair, `db push` will attempt to apply ALL 6 local-only migrations (20260304000001 through 20260317000001), not just the daily_challenges one.
**Why it happens:** `db push` applies all migrations whose timestamps are absent from the remote history.
**How to avoid:** Verify the content of all 6 migrations before running. The pre-checks in STATE.md only call out `student_daily_challenges` — confirm the other 5 are also safe to apply (they likely already have been applied manually, which is why they are remote-only orphans in reverse).
**Correction:** The orphaned remote entries need to be marked reverted in the migration tracking table. The local-only entries (03-04 through 03-17) will then be applied. Review migration content for each before pushing.

---

## Code Examples

### BUILD-01: The One-Line Fix

Current broken state in `keySignatureUtils.js`:
```javascript
// Source: verified by reading file at src/components/games/sight-reading-game/utils/keySignatureUtils.js
import { KEY_NOTE_LETTERS } from "../constants/keySignatureConfig";  // BROKEN in Node ESM
```

Fixed state:
```javascript
import { KEY_NOTE_LETTERS } from "../constants/keySignatureConfig.js";  // CORRECT
```

### BUILD-02: Full Repair and Push Sequence

```bash
# Step 1: Verify table does not already exist in production
# (Run in Supabase SQL Editor)
SELECT to_regclass('public.student_daily_challenges');
# NULL = safe to push. Non-null = table exists, investigate.

# Step 2: Repair migration history (mark remote-only orphans as reverted)
npx supabase migration repair --status reverted \
  20260127000004 20260226000001 20260226000002 \
  20260226000003 20260304222919 20260308120037

# Step 3: Verify repair worked (all local migrations should now show in both columns)
npx supabase migration list

# Step 4: Dry run to confirm what will be applied
npx supabase db push --dry-run

# Step 5: Apply migrations to production
npx supabase db push
```

### Verify RLS Is Active After Push

```sql
-- Source: Supabase docs — pg_tables has rowsecurity column
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'student_daily_challenges';
-- rowsecurity should be TRUE
```

### Verify DailyChallengeCard Returns Data

The component queries `student_daily_challenges` via `getTodaysChallenge(userId)` in `dailyChallengeService.js`. If the table does not exist, Supabase returns a `PostgrestError` and the service returns `null`. The card renders the skeleton/loading state indefinitely when `challenge === null`.

After migration push, a logged-in student visiting the dashboard will trigger `getTodaysChallenge` which will:
1. Query for today's challenge → finds none (first time)
2. Call `generateChallenge` → inserts a row → returns it
3. Card renders with challenge data

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vite extension-free imports everywhere | Node ESM requires `.js` extensions | Node.js v12+ (ESM strict mode) | Scripts running under raw Node must use explicit extensions |
| Manual SQL in Supabase dashboard | `supabase db push` with migration history tracking | Supabase CLI v1+ | Manual SQL bypasses history tracking, causing sync divergence |

**Deprecated/outdated:**
- Assuming Vite dev behavior matches Node ESM behavior: Vite's resolver is more permissive. Any `.mjs` script outside Vite must use explicit `.js` extensions.

---

## Open Questions

1. **Are the other 5 local-only migrations (20260304000001 through 20260308000001) safe to re-apply?**
   - What we know: They exist locally but are absent from the remote migration history table. The corresponding remote-only entries (applied via dashboard) suggest the schema changes were already applied manually.
   - What's unclear: Whether applying them again will cause duplicate-object errors (e.g., `CREATE INDEX IF NOT EXISTS` vs plain `CREATE INDEX`).
   - Recommendation: Read each migration file before pushing. If any lack `IF NOT EXISTS` guards on objects that already exist, use `migration repair --status applied` to mark them as already applied instead of re-running them.

2. **Does the migration history divergence affect ongoing Supabase CLI usage?**
   - What we know: `migration list` shows 6 remote-only and 6 local-only orphans. CLI refuses to push without repair.
   - What's unclear: Whether this is from the parallel worktree workflow applying migrations in multiple branches.
   - Recommendation: After phase 12, establish a policy that all schema changes go through `supabase migration new` + `db push` only. No more dashboard SQL for schema changes.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vitest.config.js (or vite.config.js with test block) |
| Quick run command | `npx vitest run src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUILD-01 | `npm run verify:patterns` exits 0 | smoke | `npm run verify:patterns` | N/A — script run |
| BUILD-01 | keySignatureUtils imports resolve correctly | unit | `npx vitest run src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` | YES |
| BUILD-02 | `student_daily_challenges` table exists with RLS | manual | SQL Editor check | N/A — DB verification |
| BUILD-02 | DailyChallengeCard renders real data (not skeleton) | manual smoke | Visual browser check | N/A — prod only |

### Sampling Rate
- **Per task commit:** `npm run verify:patterns` (exit code check)
- **Per wave merge:** `npm run test:run` (full 211-test suite)
- **Phase gate:** `npm run verify:patterns` exits 0 AND `npm run build` succeeds AND Supabase SQL confirms table + RLS

### Wave 0 Gaps
None — existing test infrastructure covers the unit-testable parts. The `keySignatureUtils.test.js` file exists and runs 211 tests total. `verify:patterns` itself is the acceptance test for BUILD-01.

---

## Sources

### Primary (HIGH confidence)
- Direct execution: `npm run verify:patterns` — confirmed `ERR_MODULE_NOT_FOUND` on `keySignatureConfig` in `keySignatureUtils.js` line 1
- Direct execution: `npx supabase migration list` — confirmed `20260317000001` absent from remote column
- Direct execution: `npx supabase db push --dry-run` — confirmed repair command needed, listed 6 remote-only orphans
- Direct file read: `src/components/games/sight-reading-game/utils/keySignatureUtils.js` — single import line, root cause confirmed
- Direct file read: `supabase/migrations/20260317000001_daily_challenges.sql` — no `IF NOT EXISTS` guard confirmed
- Direct execution: `npm run build` — confirmed build passes (Vite resolver tolerates extension-free imports)
- Direct execution: `npm run test:run` — confirmed 13 test files, 211 tests all pass

### Secondary (MEDIUM confidence)
- Node.js docs: In ESM mode (`"type": "module"`), relative imports require explicit file extensions. This is the spec behavior, not a quirk.
- Supabase CLI docs: `migration repair --status reverted` marks remote-only entries as not-applied so `db push` can proceed.

### Tertiary (LOW confidence)
None — all findings are directly verified.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed from running tools and package.json
- Architecture: HIGH — root causes confirmed by running the failing commands directly
- Pitfalls: HIGH — derived from confirmed behavior and direct observation

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable tooling domain)
