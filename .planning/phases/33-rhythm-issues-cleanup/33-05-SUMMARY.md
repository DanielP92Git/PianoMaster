---
phase: 33-rhythm-issues-cleanup
plan: 05
status: complete
date: 2026-05-04
---

# Plan 33-05 — Rate-Limit Migration Deploy

## Outcome

Migration `20260201000002_add_rate_limiting.sql` hardened with idempotency guards and applied to the remote Supabase production project (`hdltcvgqrtxuxgjdvzzu`). UAT issue 6 marked resolved-by-deploy pending console retest in Plan 33-10.

## Task 1 — Hardening (auto)

Added 3 `DROP POLICY IF EXISTS` statements before each `CREATE POLICY` in the migration file, plus a header note documenting the change. No behavior change. Table DDL, function body, and GRANT statements were already idempotent.

**Diff summary:**

- 3 × `DROP POLICY IF EXISTS "<policy name>" ON rate_limits;`
- 1 × header comment block dating the hardening + RESEARCH §7 reference

**Verification:**

- `grep -c "DROP POLICY IF EXISTS"`: 3 ✓
- `grep -c "CREATE POLICY"`: 3 ✓ (unchanged — no CREATE removed)

**Commit:** `2510659` — fix(33-05): add DROP POLICY IF EXISTS guards to rate-limit migration

## Task 2 — Remote Deploy (human-action)

**Path taken:** Supabase Dashboard SQL Editor (Option A from triage). CLI path was blocked by repeated 401s on access token despite fresh tokens; Docker Desktop unavailable for `supabase start` local dry-run; MCP server lacked authenticated context at time of execution.

**Deploy:** User pasted full migration file contents into Dashboard SQL Editor at https://supabase.com/dashboard/project/hdltcvgqrtxuxgjdvzzu/sql/new and ran. User confirmed "all passed" — no policy collision errors (DROP IF EXISTS guards prevented them as designed).

**Date:** 2026-05-04
**Project ref:** hdltcvgqrtxuxgjdvzzu

**Dashboard verification (per plan Task 2.C):** Pending user spot-check — deferred to 33-10 final UAT pass.

**Frontend console retest (per plan Task 2.D — UAT issue 6):** Deferred to 33-10 final UAT pass against deployed Netlify build. UAT entry pre-marked `[x] resolved-by-deploy` with deploy provenance noted; will be reverted if 33-10 retest still shows the warning.

## Deviations

- **Local dry-run via `supabase db reset` skipped.** Plan Task 2.A required local Docker stack; Docker Desktop wasn't running. Risk mitigated by: (1) hardened DROP POLICY IF EXISTS guards making re-apply safe, (2) RESEARCH §7 prior code review of migration design, (3) IF NOT EXISTS / CREATE OR REPLACE on table/function. User accepted via deploy-method choice.
- **CLI deploy path abandoned.** `npx supabase login` returned success but `projects list` and `db push` both 401'd even with fresh personal access tokens. Likely OS-keyring or token-scope issue not worth deep-diagnosing mid-phase. SQL Editor path is functionally equivalent.
- **MCP path attempted, blocked.** Token added to `.mcp.json` mid-session but Claude Code didn't hot-reload the MCP server context. Not retried (would have required session restart).

## UAT Resolution

| Issue                                | Pre-plan      | Post-plan                                 |
| ------------------------------------ | ------------- | ----------------------------------------- |
| 6 (console 404 + rate-limit warning) | confirmed-bug | resolved-by-deploy (pending 33-10 retest) |

## Files Modified

- `supabase/migrations/20260201000002_add_rate_limiting.sql` — hardened
- `.planning/phases/33-rhythm-issues-cleanup/33-UAT.md` — Issue 6 mark flipped

## Backlog / Follow-ups

- **33-10 final pass:** Frontend console verification — load deployed app, sign in as student, complete trail node, confirm no "Rate limit function not found" warning. If warning persists, re-open Issue 6 and investigate RPC call site.
- **CLI auth investigation (out of scope):** Supabase CLI 401 on valid tokens is a developer-environment issue worth a separate triage if CLI is needed for future migrations. Workaround: SQL Editor or MCP.
