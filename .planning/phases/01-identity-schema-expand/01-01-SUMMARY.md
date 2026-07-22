---
phase: 01-identity-schema-expand
plan: 01
wave: 1
status: complete
requirements-completed: [IDENT-05]
commit: a9995c76
---

# 01-01 Summary — FK checklist, function inventory, rehearsal env

## What was built

Three source-of-truth artifacts, all generated from **live read-only queries** against production
`hdltcvgqrtxuxgjdvzzu` (2026-07-22 14:17 UTC) — the migration (Plan 04) is written FROM these:

- **`01-fk-checklist.md`** — 17 FK constraints target `students(id)` (all reference `id`, all `ON DELETE CASCADE`), with D-06/D-07 scope/carve-out columns.
- **`01-function-inventory.md`** — 7 functions literally reference `students`; merged with RESEARCH's seed list; one Phase-1 change path identified (deletion cascade).
- **`01-rehearsal-env.md`** — rehearsal path confirmed: `npx supabase` CLI 2.109.1 (MCP is `--read-only`).

## Key files

- created: `.planning/phases/01-identity-schema-expand/01-fk-checklist.md`
- created: `.planning/phases/01-identity-schema-expand/01-function-inventory.md`
- created: `.planning/phases/01-identity-schema-expand/01-rehearsal-env.md`

## Deviations

- **CRITICAL — verifier mechanism changed (`information_schema` → `pg_constraint`).** The D-04 /
  RESEARCH §Q1 `information_schema` triple-join returns `[]` live, because
  `information_schema.constraint_column_usage` only exposes constraints the connection role owns and
  Supabase's query role is not the table owner. The same query is D-04's IDENT-05 verifier, so it would
  false-fail post-migration. Checklist + verifier rebuilt on `pg_catalog.pg_constraint`. **Requires
  owner sign-off at the Plan 03 gate** (changes the committed IDENT-05 mechanism).
- **FK count: 17** (not RESEARCH's ~14 grep estimate, not the roadmap's ~30). Authoritative via catalog.
- **Function inventory surfaced 3 functions RESEARCH's manual list missed** —
  `promote_placeholder_student`, `teacher_link_student`, `teacher_get_student_points`. Several
  seed-list entries (trigger fns, `has_active_subscription`, `is_free_node`) don't contain the literal
  `students` and are correctly absent from the live search; retained in the table with explanations.

## Notes

- `.mcp.json` left unmodified (verified `git diff --quiet`). No production writes issued (read-only only).
- Supabase branches are a billed feature — flagged for the owner at the Wave 4 gate.

## Self-Check: PASSED

All three automated verify blocks returned OK; `.mcp.json` clean.
