---
phase: 01-identity-schema-expand
verified: 2026-07-30T00:00:00Z
status: passed
score: 11/11 must-haves verified (1 roadmap SC-clause deferred to Phase 8)
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
deferred:
  - truth: "SC#5 literal — 'zero unaccounted-for references to students(id)' remain"
    addressed_in: "Phase 8 (Contract — Legacy Cleanup & Final Verification)"
    evidence: "Phase 8 goal: 'legacy identity policies are provably unused and removed, closing the expand/contract cycle cleanly.' Phase 1 is the additive/expand half (D-02 keeps the legacy students(id) FK, adds a SECOND FK to child_profiles); the contract/removal half is Phase 8 by design."
---

# Phase 1: Identity Schema Expand — Verification Report

**Phase Goal:** The database has an additive, reversible foundation for parent-owned child identity — new tables and FK columns exist alongside the legacy schema with zero client-visible change.
**Verified:** 2026-07-30
**Status:** PASSED
**Re-verification:** No — initial verification.

## Goal Achievement

The phase goal is a zero-client-visible, additive, reversible, COPPA-aligned identity substrate. Verified against the committed migration source (the deterministic source of truth), the owner-signed scope artifacts, the committed assertion suite, and the recorded production apply/verify evidence in `01-apply-log.md`. The migration file is git-tracked (`d4ce32e8 feat(01-04)`), the down-migration reverses every created object, and the recorded production run reported "applied — no errors" with 12/12 structural checks PASS and an identical Vitest suite (2160 passed / 0 failed) pre- and post-apply.

### Observable Truths

| #   | Truth                                                                                                                                            | Status                                     | Evidence                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `parents` table exists, PK = `auth.users(id)`, mirrors `teachers` shape; exactly 5 cols incl. `requires_reconsent` (IDENT-01, SC#1)              | ✓ VERIFIED                                 | Migration §1 (`id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`) is byte-identical PK shape to `teachers` (20250625120001_add_teacher_schema.sql:6). Cols: id, created_at, updated_at, display_name, requires_reconsent. Assertion suite lines 16-38 gate the exact set.                                                             |
| 2   | `child_profiles` exists holding only nickname/avatar/birth_year — zero PII, exactly 8 cols (IDENT-02, SC#2)                                      | ✓ VERIFIED                                 | Migration §2: id, parent_id, nickname, avatar_id, birth_year, is_active, created_at, updated_at. No email/phone/real-name/photo/location column. Assertion lines 42-51 gate the exact 8-col set (fail on more/less).                                                                                                                                 |
| 3   | `child_profiles.parent_id` is nullable (teacher-created profiles stay valid) (IDENT-03)                                                          | ✓ VERIFIED                                 | Migration §2: `parent_id UUID REFERENCES parents(id) ON DELETE SET NULL` — no NOT NULL. Assertion lines 59-61 gate `is_nullable`.                                                                                                                                                                                                                    |
| 4   | 15 auth-having students backfilled with matching `id` and resolving `parent_id` (SC#3)                                                           | ✓ VERIFIED (source + recorded prod verify) | Migration §6 inserts 15 parents (14 FALSE + 1 TRUE re-consent); §7 backfills via `s.id` + LEFT JOIN auth.users. Assertion line 152 gates 15 real parent matches. Apply-log 3a: "parents rowcount == 15" PASS, "IDENT-03 15 real matching parents" via assertions.                                                                                    |
| 5   | 5 teacher-created auth-less students get `child_profiles` rows with `parent_id = NULL` (SC#4)                                                    | ✓ VERIFIED (source + recorded prod verify) | LEFT JOIN au.id yields NULL for the 5 auth-less rows. Assertion line 63 gates exactly 5 NULL. Apply-log 3a: "exactly 5 parent-less children" PASS.                                                                                                                                                                                                   |
| 6   | UUID reuse: `child_profiles.id` == `students.id` (no downstream FK value changes) (IDENT-04)                                                     | ✓ VERIFIED                                 | Backfill `SELECT s.id`. Assertion line 72 gates join count == 20. Apply-log 3a: "every child maps to a student" + "child_profiles rowcount == students rowcount" PASS.                                                                                                                                                                               |
| 7   | Every non-carved-out identity FK ALSO gets a second FK to `child_profiles(id)` — 16 dual FKs, ADD-only, legacy kept (IDENT-05 reframed per D-02) | ✓ VERIFIED                                 | Migration §9: exactly 16 `ADD CONSTRAINT ..._child_profiles_fkey ... ON DELETE CASCADE` (grep count = 16), one per owner-signed child-scoped row in 01-fk-checklist.md; sole carve-out `parent_subscriptions` (D-06). Apply-log 3a: 16 FKs PASS + legacy FKs still present PASS.                                                                     |
| 8   | Reversible: committed down-migration reverses every object the up-migration creates (D-27)                                                       | ✓ VERIFIED                                 | `.down.sql` drops cascade/sync/updated_at triggers + functions, all 16 child_profiles FKs (grep count = 16, matches up), both tables CASCADE; IF EXISTS everywhere (idempotent). Touches no legacy `_fkey`. Dry-run rehearsed apply→rollback→re-apply green (apply-log §1).                                                                          |
| 9   | Forward + reverse sync + deletion-cascade triggers exist, loop-guarded, SECURITY DEFINER (D-19/20/21/24/25)                                      | ✓ VERIFIED                                 | Migration §8a/8b/8c: all three functions `LANGUAGE plpgsql SECURITY DEFINER SET search_path = public`, `pg_trigger_depth() > 1` guard; reverse writes shadow row nickname+avatar only (no PII). Apply-log 3b confirms presence + SECURITY DEFINER; pre-existing students triggers untouched. Assertions lines 170-200 exercise round-trip + cascade. |
| 10  | RLS deny-all on both new tables (D-16) — access granted in Phase 2                                                                               | ✓ VERIFIED                                 | Migration §4 enables RLS, creates zero policies. Assertions lines 125-128 gate rowsecurity ON + zero policies. Apply-log 3a: RLS enabled + zero policies PASS.                                                                                                                                                                                       |
| 11  | Zero client-visible change (D-29)                                                                                                                | ✓ VERIFIED (recorded evidence)             | Vitest identical pre/post apply (112 files, 2160 passed, 0 failed — apply-log §2/§4); owner smoke test PASS on a real student account (dashboard, trail, exercise XP/stars, streak) — apply-log §5. Additive-only DDL: no drops/alters of existing columns or client-read paths.                                                                     |

**Score:** 11/11 truths verified.

### Deferred Items

| #   | Item                                                                             | Addressed In | Evidence                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Roadmap SC#5 literal clause: "zero unaccounted-for references to `students(id)`" | Phase 8      | This is the _contract_ half of an expand/contract cycle. D-02 deliberately KEEPS the legacy `students(id)` FK in Phase 1 and adds a second FK to `child_profiles`. Phase 8 goal ("legacy identity policies provably unused and removed") owns the removal. Not a Phase 1 gap. The migration header (lines 19-21) and 01-fk-checklist.md §"IDENT-05 semantics" both document this reframing. |

### Required Artifacts

| Artifact                                                                | Expected                                                                           | Status     | Details                                                                                                                                      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` | Atomic up-migration (tables + backfill + 16 dual-FK adds + sync/deletion triggers) | ✓ VERIFIED | 253 lines, single BEGIN/COMMIT, git-tracked (d4ce32e8). Contains `CREATE TABLE IF NOT EXISTS child_profiles`; all required patterns present. |
| `...20260722120000_..._add_parents_and_child_profiles.down.sql`         | Committed rollback (D-27)                                                          | ✓ VERIFIED | 51 lines, reverse object order, idempotent, git-tracked. Drops only phase-created objects (no legacy FK touched).                            |
| `01-fk-checklist.md`                                                    | Owner-signed live-query FK enumeration + scope classification                      | ✓ VERIFIED | 17 live FK rows, 16 child-scoped + 1 carve-out, OWNER SIGN-OFF block (2026-07-22). Documents pg_constraint verifier deviation.               |
| `01-account-segmentation.md`                                            | Owner-reviewable 15-row segmentation + re-consent flags                            | ✓ VERIFIED | Present; 15 ids, 1 re-consent flag (hallellu@gmail.com) transcribed as migration literal (§6 line 91).                                       |
| `01-db-assertions.sql`                                                  | BEGIN…ASSERT…ROLLBACK suite for IDENT-01..05 + trigger round-trips + cascade       | ✓ VERIFIED | 11k, covers all IDENT reqs, requires_reconsent literal, forward/reverse round-trip, deletion cascade.                                        |
| `01-apply-log.md`                                                       | Record of rehearsal + production apply + verifier results                          | ✓ VERIFIED | Dry-run green (harness-only cast fix), production "no errors", 12/12 structural PASS, identical Vitest, owner smoke PASS.                    |

### Key Link Verification

| From                                               | To                              | Via                                                     | Status  | Details                                                                                         |
| -------------------------------------------------- | ------------------------------- | ------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `sync_student_to_child_profile()`                  | `child_profiles`                | AFTER INSERT/UPDATE on students, pg_trigger_depth guard | ✓ WIRED | Migration §8a lines 119-165; separate INSERT + column-scoped UPDATE triggers.                   |
| `cascade_delete_child_profile_on_student_delete()` | `child_profiles`                | AFTER DELETE ON students                                | ✓ WIRED | Migration §8c lines 213-228; closes hollow-profile hazard behind Edge Function hard-delete.     |
| each swept downstream table                        | `child_profiles(id)`            | ADD CONSTRAINT `<table>_<col>_child_profiles_fkey`      | ✓ WIRED | 16/16 present, one per owner-signed checklist row; verifiable via pg_constraint IDENT-05 query. |
| 01-account-segmentation.md id list                 | parents/child_profiles backfill | reviewed ids consumed as migration literals             | ✓ WIRED | 15 parent literals (§6) + LEFT JOIN backfill (§7) match segmentation.                           |

### Requirements Coverage

| Requirement | Source Plan         | Description                                           | Status                                                 | Evidence              |
| ----------- | ------------------- | ----------------------------------------------------- | ------------------------------------------------------ | --------------------- |
| IDENT-01    | 01-04, 01-05        | parents table, PK=auth.users id, mirrors teachers     | ✓ SATISFIED                                            | Truth 1               |
| IDENT-02    | 01-04               | child_profiles exact 8-col zero-PII                   | ✓ SATISFIED                                            | Truth 2               |
| IDENT-03    | 01-02, 01-03, 01-04 | parent_id nullable, 5 parent-less                     | ✓ SATISFIED                                            | Truths 3, 5           |
| IDENT-04    | 01-02, 01-04        | UUID reuse child_profiles.id == students.id           | ✓ SATISFIED                                            | Truth 6               |
| IDENT-05    | 01-01, 01-03, 01-05 | Dual child_profiles FKs added; legacy retained (D-02) | ✓ SATISFIED (expand half); removal deferred to Phase 8 | Truth 7 + Deferred #1 |

No orphaned requirements — all five IDENT-0x IDs mapped to Phase 1 appear in plan frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact                                                                                                                                                                                                                                                     |
| ---- | ---- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —    | —    | none    | —        | Migration is additive DDL; no stubs, TODO gates, or empty returns in the delivered SQL. (Two forward-looking DOC-DEBT notes exist in-file: DATA_CATEGORIES_REMOVED does not yet list child_profiles — explicitly scoped to Phase 7/8, not this DDL phase.) |

### Behavioral Spot-Checks

Step 7b SKIPPED for live-DB assertions — this environment exposes no Supabase MCP/DB tool (only Read/Write/Bash/Grep/Glob) and the task constrains to read-only with no DDL. Static spot-checks performed instead:

| Behavior                                    | Command                                        | Result                                                                   | Status |
| ------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| Up adds exactly 16 child_profiles FKs       | `grep -c ADD CONSTRAINT.*child_profiles_fkey`  | 16                                                                       | ✓ PASS |
| Down reverses exactly 16 child_profiles FKs | `grep -c DROP CONSTRAINT.*child_profiles_fkey` | 16                                                                       | ✓ PASS |
| Both migration files git-tracked            | `git ls-files`                                 | both present (d4ce32e8)                                                  | ✓ PASS |
| parents PK shape == teachers                | source diff                                    | identical `UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | ✓ PASS |

### Human Verification Required

None outstanding. Live production row-state (20 child_profiles / 15 parents / 5 NULL / 16 live FKs) was verified by the executing agent via Supabase MCP (apply-log §3a, 12/12 PASS) and confirmed by the owner smoke test (§5). Independent re-query from this verification environment is not possible (no DB tool available), but the underlying DDL is deterministic and the recorded production verification is corroborated by an identical Vitest suite and owner sign-off.

### Gaps Summary

No blocking gaps. The phase goal — an additive, reversible, zero-client-visible, COPPA-aligned identity substrate — is genuinely achieved in the committed codebase:

- Additive: only CREATE/INSERT/ADD CONSTRAINT; no drops or alters of existing client-read paths (Truth 11).
- Reversible: committed idempotent down-migration reverses every created object, rehearsed apply→rollback→re-apply green (Truth 8).
- Zero-PII: child_profiles is exactly the 8 non-PII columns, assertion-gated on the exact set (Truth 2).
- Zero client-visible change: identical test suite + owner smoke test (Truth 11).

**Notes / risks (non-blocking):**

1. **Roadmap/REQUIREMENTS wording lag.** IDENT-05 / SC#5 in ROADMAP.md and REQUIREMENTS.md still read "all 30 identity-bearing FK columns across the 26 downstream tables ... verified against one authoritative `information_schema` checklist." The live query found **17** FK constraints (16 swept + 1 carve-out), and `information_schema` returns `[]` under Supabase's non-owner role — so the verifier was moved to `pg_catalog.pg_constraint` (owner-signed, Plan 03 gate). Both deviations are documented and owner-approved; the substance (every live identity FK swept except the intentional D-06 carve-out) is met. Recommend updating the SC#5 wording in ROADMAP/REQUIREMENTS to the reconciled 16/17 + pg_constraint mechanism to prevent future drift, but this is documentation hygiene, not a functional gap.
2. **Legacy-FK removal deferred to Phase 8** (D-02) — expected and roadmap-backed; listed under Deferred Items, not a gap.
3. **Live re-query limitation** — see Human Verification section; mitigated by recorded MCP verification + owner smoke test + identical Vitest counts.

---

_Verified: 2026-07-30_
_Verifier: Claude (gsd-verifier)_
