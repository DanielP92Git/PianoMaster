---
phase: 1
slug: identity-schema-expand
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-22
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **database/DDL phase with no test framework** (D-28 — pgTAP explicitly
> rejected). Validation is a committed SQL-assertion script run against a Supabase
> rehearsal branch, PLUS the existing Vitest suite (proves zero client-visible
> regression, D-29), PLUS an owner production smoke test.

---

## Test Infrastructure

| Property               | Value                                                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | None for DDL — SQL assertion script (`01-db-assertions.sql`). Vitest 3 covers the client-regression proof only.                                                                       |
| **Config file**        | none — `01-db-assertions.sql` is a plain script run against a Supabase branch                                                                                                         |
| **Quick run command**  | `npx supabase db execute --file .planning/phases/01-identity-schema-expand/01-db-assertions.sql` (or paste into Supabase SQL Editor / MCP `execute_sql`) against the rehearsal branch |
| **Full suite command** | SQL assertions above **+** `npm run test:run` (existing Vitest, proves zero client-visible regression) **+** owner manual production smoke test                                       |
| **Estimated runtime**  | SQL assertions ~5s on branch; `npm run test:run` per existing suite; smoke test manual                                                                                                |

---

## Sampling Rate

- **After every task commit:** Re-run the relevant assertion block from `01-db-assertions.sql` against the rehearsal branch after each DDL statement is added.
- **After every plan wave:** Full `01-db-assertions.sql` + `npm run test:run` against the branch.
- **Before `/gsd-verify-work`:** Full apply→rollback→re-apply rehearsal (D-27) green, all SQL assertions green, Vitest suite green, owner production smoke test signed off.
- **Max feedback latency:** SQL assertions < 10s against branch.

---

## Per-Task Verification Map

| Task ID    | Plan | Wave | Requirement        | Threat Ref                  | Secure Behavior                                                                                                                  | Test Type                                                      | Automated Command                                                                      | File Exists             | Status     |
| ---------- | ---- | ---- | ------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------- | ---------- |
| (Wave 0)   | 00   | 0    | IDENT-05 prereq    | —                           | FK checklist generated from live query, not grep                                                                                 | SQL generation                                                 | `information_schema` FK-enumeration query (Q1)                                         | ❌ W0                   | ⬜ pending |
| (Wave 0)   | 00   | 0    | IDENT-03/04 prereq | —                           | Segmentation table reflects true account state                                                                                   | SQL generation                                                 | Q4 segmentation query                                                                  | ❌ W0                   | ⬜ pending |
| (IDENT-01) | —    | —    | IDENT-01           | —                           | `parents` PK shape == `teachers`                                                                                                 | SQL assertion                                                  | `information_schema.columns` diff `parents` vs `teachers`                              | ❌ W0                   | ⬜ pending |
| (IDENT-02) | —    | —    | IDENT-02           | RLS deny-all                | `child_profiles` column set == `{id,parent_id,nickname,avatar_id,birth_year,is_active,created_at,updated_at}` exactly (zero PII) | SQL assertion                                                  | `SELECT column_name FROM information_schema.columns WHERE table_name='child_profiles'` | ❌ W0                   | ⬜ pending |
| (IDENT-03) | —    | —    | IDENT-03           | —                           | `parent_id` nullable; exactly 5 rows `parent_id IS NULL`                                                                         | SQL assertion                                                  | `SELECT count(*) FROM child_profiles WHERE parent_id IS NULL` → expect 5               | ❌ W0                   | ⬜ pending |
| (IDENT-04) | —    | —    | IDENT-04           | —                           | Every `child_profiles.id` == its `students.id` (UUID reuse)                                                                      | SQL assertion                                                  | `SELECT count(*) FROM child_profiles cp JOIN students s ON cp.id=s.id` → expect 20     | ❌ W0                   | ⬜ pending |
| (IDENT-05) | —    | —    | IDENT-05           | FK target drift (Pitfall 2) | Every non-carved-out checklist column has a `child_profiles` FK                                                                  | SQL assertion (diff of committed generation vs verifier query) | Q1 generation (pre) vs verifier (post), diff `(table,column)` sets                     | ❌ W0                   | ⬜ pending |
| (D-21)     | —    | —    | D-19/20/21         | Trigger loop / EoP          | Forward + reverse sync + deletion cascade round-trip                                                                             | SQL assertion (BEGIN…ROLLBACK)                                 | 3-part transactional round-trip script (Q6)                                            | ❌ W0                   | ⬜ pending |
| (D-24/25)  | —    | —    | D-24/D-25          | Silent data loss            | Deleting a `students` row also removes its `child_profiles` row                                                                  | SQL assertion (BEGIN…ROLLBACK)                                 | delete-cascade assertion in `01-db-assertions.sql`                                     | ❌ W0                   | ⬜ pending |
| (D-29)     | —    | —    | D-29               | —                           | Existing app behavior unchanged                                                                                                  | existing suite + manual                                        | `npm run test:run` + owner smoke test                                                  | ✅ suite / manual smoke | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Wave 0 for this phase produces the committed **query artifacts** the migration is written FROM and verified AGAINST (D-04, D-23, D-10, D-26/D-28):

- [ ] `.planning/phases/01-identity-schema-expand/01-fk-checklist.md` — generated from Q1's live `information_schema` query; carries `(table, column, constraint, on_delete)` **plus a scope column** (child-scoped vs parent-scoped, D-07) and carve-out reasons (`parent_subscriptions` excluded, D-06). Owner-reviewed/signed before the migration runs.
- [ ] `.planning/phases/01-identity-schema-expand/01-account-segmentation.md` — 15-row table from Q4's live query (DOB<18 at signup, `parent_email` null-or-equal-to-account-email, no `consent_verified_at`). Owner-reviewed/signed (D-10 owner gate) before backfill.
- [ ] `.planning/phases/01-identity-schema-expand/01-function-inventory.md` — from Q7's `pg_proc` search: every function/trigger referencing `students(id)` (for Phases 2 & 8). Committed artifact.
- [ ] `.planning/phases/01-identity-schema-expand/01-db-assertions.sql` — the SQL assertion suite covering IDENT-01…05, the D-21 trigger round-trip, and the D-24/D-25 deletion-cascade check.
- [ ] **Rehearsal environment confirmed** — MCP is `--read-only` (apply_migration/branch-mutation likely disabled); confirm whether the CLI fallback (`npx supabase`, v2.109.1 verified) or a relaxed MCP flag will be used before Wave 0 is considered closed (Pitfall R-3 / Assumption A4).

_No test framework is installed or needed — SQL assertions run manually against the branch (D-28)._

---

## Manual-Only Verifications

| Behavior                              | Requirement        | Why Manual                                                                                                                                                       | Test Instructions                                                                                                                  |
| ------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Owner production smoke test           | D-29               | Vitest runs against mocks; an FK repointed at the wrong table breaks nothing a mock notices — only a live per-account check catches it                           | On a real production student account post-migration: trail progress, XP, streak, and dashboard render identically to pre-migration |
| FK checklist scope sign-off           | IDENT-05 / D-07    | Child-scoped vs parent-scoped classification is a human judgment (a wrongly-scoped table yields a valid-looking Phase 2 policy that authorizes the wrong person) | Owner reviews `01-fk-checklist.md` scope column + carve-out reasons and signs off before migration                                 |
| Account-segmentation sign-off         | IDENT-03/04 / D-10 | Silent child→parent reparenting produces no test failure; 15 rows is small enough to be certain by eye                                                           | Owner reviews `01-account-segmentation.md`, confirms the re-consent flag assignments, signs off before backfill                    |
| apply → rollback → re-apply rehearsal | D-27               | Proves rollback restores cleanly — the FK swap is the part most likely not to restore; cannot be asserted, must be exercised on a branch                         | Run up-migration, run down-migration, re-run up on a Supabase branch; confirm schema identical each cycle                          |

---

## Validation Sign-Off

- [ ] All tasks have an SQL-assertion verify or a Wave 0 artifact dependency
- [ ] Sampling continuity: every DDL statement has a matching assertion block; no 3 consecutive tasks without a verify
- [ ] Wave 0 covers all MISSING references (4 artifacts + rehearsal env confirmation)
- [ ] No watch-mode flags (SQL scripts are one-shot)
- [ ] Feedback latency < 10s (SQL assertions on branch)
- [x] `nyquist_compliant: true` set in frontmatter once plans wire every IDENT-0x to an assertion

_(`wave_0_complete` stays `false` until execution — the 4 Wave 0 artifacts are produced by Plans 01/02 at run time, not authored now.)_

**Approval:** approved 2026-07-22 (every IDENT-01…05 wired to an SQL assertion or Wave 0 artifact dependency; plan-checker verified)
