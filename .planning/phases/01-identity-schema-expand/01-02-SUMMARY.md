---
phase: 01-identity-schema-expand
plan: 02
wave: 1
status: complete
requirements-completed: [IDENT-03, IDENT-04]
commit: c5b8b5a9
---

# 01-02 Summary — account segmentation + SQL assertion suite

## What was built

- **`01-account-segmentation.md`** — owner-review gate (D-10). All 15 auth-having students segmented
  from a live read-only heuristic; the 5 auth-less (teacher-created) students confirmed. `owner_override`
  - `notes` columns for the Plan 03 sign-off.
- **`01-db-assertions.sql`** — committed D-28 verification suite (plain SQL, no framework) covering
  IDENT-01…05, RLS deny-all, D-21 forward/reverse trigger round-trips (+ loop-guard proof), and the
  D-24/D-25 deletion cascade. Synthetic-data blocks wrapped in `BEGIN…ROLLBACK`.

## Live findings (baseline for the migration)

- **15 auth-having + 5 auth-less = 20** — matches `students` row count. 5/15 split confirmed (IDENT-03).
- **Exactly 1 self-registered minor flagged** → `parents.requires_reconsent = true` count = **1**
  (`e79437b8…` / hallellu@gmail.com, DOB 2015, parent_email = self). This literal is hard-coded in the
  parents-fidelity assertion (Pitfall-6 guard) with a reconcile comment.
- Owner-review note recorded: 11/15 accounts have **no `date_of_birth`**, so the heuristic can't judge
  their age and defaults them to `false` — explicitly surfaced for the Plan 03 gate.
- Only auth-less row `7635a40a…` needs the `generate_musical_nickname()` nickname fallback.

## Key files

- created: `.planning/phases/01-identity-schema-expand/01-account-segmentation.md`
- created: `.planning/phases/01-identity-schema-expand/01-db-assertions.sql`

## Deviations

- IDENT-05 block in the assertion suite uses `pg_constraint` (not `information_schema`), consistent with
  the 01-01 verifier deviation. Includes an automatable lower-bound guard (the 12 firm child-scoped
  columns must have a `child_profiles` FK) plus the documented run+diff for the owner-signed carve-outs.

## Notes

- The segmentation table commits real user emails/DOBs into the repo — this is the plan's explicit design
  (an owner review gate needs identifying info) and the owner's own private repo/data. No production writes.

## Self-Check: PASSED

Both automated verify blocks returned OK; 8-column IDENT-02 set present verbatim.
