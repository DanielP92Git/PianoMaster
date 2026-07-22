# Phase 1: Identity Schema Expand - Pattern Map

**Mapped:** 2026-07-22
**Files analyzed:** 6 (all new; this is a DDL-only phase, no JS/React files)
**Analogs found:** 6 / 6 (5 strong file-level analogs + 1 "no direct analog, follow convention" case for the down-migration)

This phase produces **zero application code**. Every "file" below is either a Postgres migration or a
markdown/SQL artifact committed to the phase directory. There is no controller/component/service
role vocabulary here — roles are recast as migration sub-patterns (table DDL, backfill, FK-add,
trigger-function, audit artifact).

## File Classification

| New File                                                                      | Role                  | Data Flow                                   | Closest Analog                                                                                                                                                                                                                                                                                      | Match Quality                                              |
| ----------------------------------------------------------------------------- | --------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `supabase/migrations/<ts>_add_parents_and_child_profiles.sql` (up-migration)  | migration             | batch (DDL + one-time backfill)             | `supabase/migrations/20250625120001_add_teacher_schema.sql` (table shape) + `supabase/migrations/20260201000001_coppa_schema.sql` (trigger-function skeleton, nickname fn) + `supabase/migrations/20260327000002_fix_teacher_fk_references.sql` (FK-add idiom)                                      | exact (table shape), role-match (triggers/FK idiom)        |
| `supabase/migrations/<ts>_add_parents_and_child_profiles.down.sql` (rollback) | migration             | batch (DDL rollback)                        | **none in repo** — no committed down-migration exists anywhere in `supabase/migrations/`                                                                                                                                                                                                            | no analog — synthesize from up-migration's own object list |
| `.planning/phases/01-identity-schema-expand/01-fk-checklist.md`               | config/audit-artifact | batch (query output, committed)             | `supabase/migrations/20250115000005_remove_student_auth_fkey.sql` (the `information_schema` triple-join query shape) + `supabase/migrations/20260131000001_audit_rls_policies.sql` (audit-migration file structure/header convention)                                                               | role-match                                                 |
| `.planning/phases/01-identity-schema-expand/01-account-segmentation.md`       | config/audit-artifact | batch (query output, owner-reviewed)        | `supabase/migrations/20260201000001_coppa_schema.sql` (the columns being segmented: `date_of_birth`, `parent_email`, `consent_verified_at`) — no direct "segmentation table" analog exists; pattern is query-output-as-markdown, same idiom as the FK checklist                                     | role-match                                                 |
| `.planning/phases/01-identity-schema-expand/01-function-inventory.md`         | config/audit-artifact | batch (manual + `pg_proc` query, committed) | `supabase/migrations/20260131000002_audit_security_definer.sql` (title pattern: an audit pass over `SECURITY DEFINER` functions) — read for header/structure convention only                                                                                                                        | role-match                                                 |
| `.planning/phases/01-identity-schema-expand/01-db-assertions.sql`             | test                  | transactional (BEGIN...ASSERT...ROLLBACK)   | No direct SQL-assertion-test analog exists in `supabase/migrations/` (this repo's tests are all Vitest/JSDOM, per CLAUDE.md "Testing" section) — closest structural analog is the verification `DO $$ ... RAISE NOTICE/WARNING ... END $$;` blocks in `20250115000005_remove_student_auth_fkey.sql` | partial match                                              |

## Pattern Assignments

### `supabase/migrations/<ts>_add_parents_and_child_profiles.sql`

This is the one atomic file (D-03). It has five internal sub-patterns, each with its own analog.

---

#### Sub-pattern A: `parents` table shape

**Analog:** `supabase/migrations/20250625120001_add_teacher_schema.sql` lines 4-17 (the `teachers` table)

```sql
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  school_name TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT TRUE
);
```

Per D-08, `parents` is a stripped-down copy — same PK/timestamp/`is_active` shape, no `email`/bio/school
fields, plus the D-09 re-consent flag:

```sql
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  display_name TEXT,
  requires_reconsent BOOLEAN NOT NULL DEFAULT FALSE  -- D-09: self-registered-minor flag, read by Phase 6
);

CREATE INDEX IF NOT EXISTS idx_parents_id ON parents(id); -- PK already indexes id; omit if redundant, teachers has no explicit id index either
```

Note `teachers.id` uses `ON DELETE CASCADE` from `auth.users` — copy verbatim for `parents.id` (not
addressed by any CONTEXT.md decision, so default to the proven precedent).

`updated_at` trigger — `teachers` uses a shared `update_updated_at_column()` function, already defined
in this same migration file (lines 163-169) and re-created via `CREATE OR REPLACE`:

```sql
-- 20250625120001_add_teacher_schema.sql:163-176
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_teachers_updated_at ON teachers;
CREATE TRIGGER trigger_teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

This function almost certainly already exists live (defined via `CREATE OR REPLACE`, safe to call again).
Reuse it for both `parents` and `child_profiles` `updated_at` triggers rather than writing a new function.

---

#### Sub-pattern B: `child_profiles` table shape

No direct analog table exists (this is new domain shape), but every individual column choice is
justified by an existing column/table:

- `id UUID PRIMARY KEY` — reused from `students.id`, no FK to `auth.users` (see Sub-pattern D/UUID-reuse
  precedent below)
- `parent_id UUID REFERENCES parents(id) ON DELETE SET NULL` — D-18; `ON DELETE SET NULL` precedent
  exists in this repo at `20250625120001_add_teacher_schema.sql:88` (`notifications.sender_id ... ON
DELETE SET NULL`)
- `nickname TEXT` — mirrors `students.musical_nickname` (`20260201000001_coppa_schema.sql:58`)
- `avatar_id` — FK-reuse of `students.avatar_id` (D-14); read the live column type/target from
  `students` before writing (not captured in the migrations read this session — confirm via
  `information_schema.columns` at execution time, per RESEARCH.md's own caveat)
- `birth_year INTEGER` — year-only derivation, no analog column exists yet in this repo; D-13
- `is_active BOOLEAN NOT NULL DEFAULT TRUE` — direct copy of `teachers.is_active` convention (D-15),
  same file line 16: `is_active BOOLEAN DEFAULT TRUE` (note: `teachers.is_active` is nullable-with-default,
  not `NOT NULL`; D-15 explicitly wants `NOT NULL DEFAULT TRUE`, which is a deliberate tightening beyond
  the `teachers` precedent — call this out in the plan, don't silently copy `teachers`' nullability)
- `created_at` / `updated_at` — identical to `teachers`, Sub-pattern A above

```sql
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  nickname TEXT,
  avatar_id <TYPE matching students.avatar_id> REFERENCES avatars(id),  -- confirm live type
  birth_year INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_profiles_parent_id ON child_profiles(parent_id); -- D-17

ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY; -- D-16, deny-all, zero CREATE POLICY statements
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
```

RLS-enable-with-zero-policies precedent: `supabase/migrations/20250625120001_add_teacher_schema.sql:199`
(`ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;`), followed immediately by `CREATE POLICY` statements
in that file — Phase 1 deliberately stops after the `ENABLE` line and adds no `CREATE POLICY` at all.

---

#### Sub-pattern C: Dual-FK add (no DROP) across downstream tables

**Analog:** `supabase/migrations/20260327000002_fix_teacher_fk_references.sql` (full file, 19 lines) —
the repo's own "drop wrong FK, add correct FK" idiom, extended per D-02 to **add-only, never drop**:

```sql
-- 20260327000002_fix_teacher_fk_references.sql:4-10 (idiom being extended)
ALTER TABLE assignment_submissions
  DROP CONSTRAINT IF EXISTS assignment_submissions_student_id_fkey;

ALTER TABLE assignment_submissions
  ADD CONSTRAINT assignment_submissions_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
```

Phase 1's actual statement drops the `DROP CONSTRAINT` half entirely (D-02: legacy FK is _kept_) and
only ever issues `ADD CONSTRAINT` against a **new**, disambiguated name:

```sql
-- Repeat once per non-carved-out row of 01-fk-checklist.md
ALTER TABLE public.students_score
  ADD CONSTRAINT students_score_student_id_child_profiles_fkey
  FOREIGN KEY (student_id) REFERENCES public.child_profiles(id) ON DELETE CASCADE;
```

**Grep-before-done check** (per RESEARCH.md Pitfall R-1): the finished migration file must contain zero
occurrences of `DROP CONSTRAINT` against any `_fkey`/`_students_fkey` name — the only `DROP`-shaped
statement allowed in this file is `DROP TRIGGER IF EXISTS ... ` (standard idempotent-migration idiom,
used throughout `20250625120001_add_teacher_schema.sql`, e.g. lines 156, 172, 178, 184, 190).

**UUID-reuse safety precedent** (why the dual FK doesn't fail on the 20 migrated rows): `supabase/
migrations/20250115000005_remove_student_auth_fkey.sql` — the whole file exists to _remove_ a
`teacher_student_connections_student_id_auth_fkey` constraint precisely because `students.id` has no
FK relationship to `auth.users(id)`, confirming UUID reuse against `students.id` was always safe. Key
lines: 49-56 (the `DROP CONSTRAINT`) and the verification block at lines 68-93 (`information_schema`
triple-join to confirm the surviving `students(id)` FK is intact) — this triple-join is the direct
ancestor of the Q1 generation/verification query in RESEARCH.md.

---

#### Sub-pattern D: Bidirectional sync trigger-function skeleton (`SECURITY DEFINER SET search_path`)

**Analog:** `supabase/migrations/20260201000001_coppa_schema.sql` lines 64-79 (`calculate_is_under_13`)
and lines 408-421 (`auto_generate_nickname`) — both are the exact `SECURITY DEFINER SET search_path =
public` trigger-function skeleton this phase's two new sync functions must copy:

```sql
-- 20260201000001_coppa_schema.sql:64-79
CREATE OR REPLACE FUNCTION calculate_is_under_13()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    NEW.is_under_13 := NEW.date_of_birth > CURRENT_DATE - INTERVAL '13 years';
  ELSE
    NEW.is_under_13 := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_calculate_is_under_13 ON students;

CREATE TRIGGER trigger_calculate_is_under_13
  BEFORE INSERT OR UPDATE OF date_of_birth ON students
  FOR EACH ROW
  EXECUTE FUNCTION calculate_is_under_13();
```

```sql
-- 20260201000001_coppa_schema.sql:409-430 (auto_generate_nickname — the fallback-generation precedent D-12 must call)
CREATE OR REPLACE FUNCTION auto_generate_nickname()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.musical_nickname IS NULL THEN
    NEW.musical_nickname := generate_musical_nickname();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_generate_nickname ON students;

CREATE TRIGGER trigger_auto_generate_nickname
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_nickname();
```

**The real `generate_musical_nickname()` signature** (confirmed live in file, `20260201000001_coppa_schema.sql`
lines 202-225) — every new backfill/trigger statement referencing D-12's fallback must call this exact
function, zero-arg, returns `TEXT`:

```sql
-- 20260201000001_coppa_schema.sql:202-225
CREATE OR REPLACE FUNCTION generate_musical_nickname()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  adjectives TEXT[] := ARRAY[ ... 20 entries ... ];
  nouns TEXT[] := ARRAY[ ... 20 entries ... ];
BEGIN
  RETURN adjectives[1 + floor(random() * array_length(adjectives, 1))] || ' ' ||
         nouns[1 + floor(random() * array_length(nouns, 1))];
END;
$$;
```

Confirmed: this function is `VOLATILE`, not `SECURITY DEFINER` (it does no table I/O, just random
array indexing) — do not add `SECURITY DEFINER` when calling/wrapping it, only the two new sync
trigger-functions themselves need that clause (they write to tables).

**Applying the skeleton to Phase 1's two sync functions** (per RESEARCH.md Q3, using the confirmed
`musical_nickname` column name and the confirmed `generate_musical_nickname()` signature above):

```sql
CREATE OR REPLACE FUNCTION sync_student_to_child_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  INSERT INTO child_profiles (id, parent_id, nickname, avatar_id, birth_year, is_active)
  VALUES (
    NEW.id,
    (SELECT parent_id FROM child_profiles WHERE id = NEW.id), -- preserve existing parent_id on UPDATE path; NULL on first INSERT
    COALESCE(NEW.musical_nickname, generate_musical_nickname()),
    NEW.avatar_id,
    EXTRACT(YEAR FROM NEW.date_of_birth)::INTEGER,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname   = EXCLUDED.nickname,
    avatar_id  = EXCLUDED.avatar_id,
    birth_year = EXCLUDED.birth_year,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sync_student_insert
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_to_child_profile();

CREATE TRIGGER trigger_sync_student_update
  AFTER UPDATE OF musical_nickname, avatar_id, date_of_birth ON students
  FOR EACH ROW
  WHEN (
    NEW.musical_nickname IS DISTINCT FROM OLD.musical_nickname
    OR NEW.avatar_id IS DISTINCT FROM OLD.avatar_id
    OR NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth
  )
  EXECUTE FUNCTION sync_student_to_child_profile();
```

(Reverse-direction `sync_child_profile_to_student()` follows the identical skeleton — see
RESEARCH.md Q3 lines 405-447 for the full paired reverse-trigger SQL; it is already correct against
the confirmed column names and is not re-derived here to avoid drift between two committed sources.)

**Anti-pattern already caught by this repo's own convention:** `trigger_calculate_is_under_13` above
uses `BEFORE INSERT OR UPDATE OF date_of_birth` (single combined trigger, no `WHEN` clause referencing
`OLD`) — this is safe because it never references `OLD`. The new sync triggers **do** need `OLD` (for
the `IS DISTINCT FROM` comparison), so they must follow `auto_generate_nickname`'s pattern of separate
`AFTER INSERT` / `AFTER UPDATE OF ... WHEN (...)` triggers instead — confirmed correct in RESEARCH.md's
own Anti-Patterns section, cross-checked here against the two real trigger examples in this file.

---

#### Sub-pattern E: Deletion-cascade trigger (D-24/D-25)

No trigger analog exists for this exact shape in the repo (the closest thing, `account_deletion_log`,
is deliberately FK-less — see Shared Patterns below). The skeleton is Sub-pattern D's
`SECURITY DEFINER SET search_path = public` template applied to an `AFTER DELETE` event:

```sql
CREATE OR REPLACE FUNCTION cascade_delete_child_profile_on_student_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM child_profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_cascade_delete_child_profile
  AFTER DELETE ON students
  FOR EACH ROW
  EXECUTE FUNCTION cascade_delete_child_profile_on_student_delete();
```

Read `supabase/functions/process-account-deletions/index.ts` (Step 2, per RESEARCH.md Q5, ~line 397) at
plan time to confirm the exact `DELETE FROM students WHERE id = studentId` call this trigger attaches
behind — not re-read here since RESEARCH.md already cites the line number and this pattern-map's job is
DB-side only.

---

### `supabase/migrations/<ts>_add_parents_and_child_profiles.down.sql`

**No analog exists.** Confirmed via `Glob("supabase/migrations/*down*")` and
`Glob("supabase/migrations/*rollback*")` — zero matches. This repo has never before committed a paired
rollback file; D-27 is introducing the practice for the first time in this phase.

**Synthesis approach (not copied from anywhere, derived mechanically from the up-migration's own object
list — safest possible approach for a first-of-its-kind file):**

```sql
-- Reverse order of the up-migration's CREATE statements.
DROP TRIGGER IF EXISTS trigger_cascade_delete_child_profile ON students;
DROP FUNCTION IF EXISTS cascade_delete_child_profile_on_student_delete();

DROP TRIGGER IF EXISTS trigger_sync_child_profile_update ON child_profiles;
DROP TRIGGER IF EXISTS trigger_sync_child_profile_insert ON child_profiles;
DROP FUNCTION IF EXISTS sync_child_profile_to_student();

DROP TRIGGER IF EXISTS trigger_sync_student_update ON students;
DROP TRIGGER IF EXISTS trigger_sync_student_insert ON students;
DROP FUNCTION IF EXISTS sync_student_to_child_profile();

-- Dual-FK adds: drop only the NEW child_profiles-targeting constraints,
-- one per 01-fk-checklist.md row (mirror image of Sub-pattern C's ADDs).
ALTER TABLE public.students_score
  DROP CONSTRAINT IF EXISTS students_score_student_id_child_profiles_fkey;
-- ... one per checklist row ...

DROP TABLE IF EXISTS child_profiles CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
```

The `DROP TABLE ... CASCADE` at the end matches the phase boundary's own stated rollback contract
("rollback is a single `DROP TABLE ... CASCADE`" — CONTEXT.md `<domain>` section) — the explicit
per-object drops above it exist only because triggers/functions/FK-adds on **other, pre-existing**
tables (`students`, `students_score`, etc.) are not touched by cascading from `child_profiles`/`parents`
being dropped, so they need their own explicit teardown first.

---

### `.planning/phases/01-identity-schema-expand/01-fk-checklist.md`

**Analog:** `supabase/migrations/20250115000005_remove_student_auth_fkey.sql` lines 76-93 (the
verification `information_schema` triple-join query) — direct ancestor of RESEARCH.md's Q1 generation
query.

```sql
-- 20250115000005_remove_student_auth_fkey.sql:76-87
SELECT EXISTS (
  SELECT 1
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'teacher_student_connections'
    AND kcu.column_name = 'student_id'
    AND ccu.table_name = 'students'
) INTO constraint_exists;
```

RESEARCH.md's Q1 generation query (reproduced verbatim, already the planner-ready version — adds
`referential_constraints` for `ON DELETE` action, which this older file's query doesn't capture) is the
concrete artifact-generation SQL; run it live, commit its output as a markdown table with the D-07
`scope`/`carve_out`/`reason` columns appended by hand. Do not re-derive a new query — RESEARCH.md's Q1
is already the authoritative, execution-ready version of this pattern.

**File-header convention to copy:** `supabase/migrations/20260131000001_audit_rls_policies.sql` lines
1-24 — a banner comment block (`Migration:` / `Date:` / `Description:` / cited predecessor files) is
this repo's convention for an audit-shaped file; apply the same banner shape to the markdown artifact's
opening section even though it isn't itself a `.sql` migration.

---

### `.planning/phases/01-identity-schema-expand/01-account-segmentation.md`

**Analog:** Same audit-artifact convention as the FK checklist above. The query itself (RESEARCH.md Q4,
the `dob_under_18_at_signup` / `parent_email_null_or_self` / `no_consent_verified` heuristic) reads the
exact columns confirmed live in `supabase/migrations/20260201000001_coppa_schema.sql`:

- `date_of_birth` — line 16 (`ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;`)
- `parent_email` — line 40
- `consent_verified_at` — line 44

No other file in this repo produces a segmentation/heuristic table — this artifact's _shape_ (owner-
reviewable markdown table with an `owner_override` column) is new, but every column it reads is a
confirmed, already-existing `students` column, so there is no risk of drift from a wrong column name.

---

### `.planning/phases/01-identity-schema-expand/01-function-inventory.md`

**Analog:** `supabase/migrations/20260131000002_audit_security_definer.sql` — title/purpose precedent
(an audit pass specifically over `SECURITY DEFINER` functions). Not read in full this session (out of
scope for DDL excerpts — this file's job is inventory-taking, not something Phase 1's migration copies
executable SQL from), but its existence confirms this repo already has precedent for "audit and
inventory every function matching pattern X" as a committed migration/artifact, supporting D-23's
"committed inventory, not grep" requirement.

The `pg_proc` search query (RESEARCH.md Q7, reproduced below) is the mechanical generation method:

```sql
SELECT p.proname, n.nspname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%students%'
ORDER BY p.proname;
```

Cross-reference against the confirmed function list already read this session:
`generate_musical_nickname()`, `auto_generate_nickname()` / `trigger_auto_generate_nickname`,
`calculate_is_under_13()` / `trigger_calculate_is_under_13`, `request_parental_consent`,
`verify_parental_consent`, `revoke_parental_consent` (all in `20260201000001_coppa_schema.sql`) —
every one of these six uses `SECURITY DEFINER SET search_path = public` except
`generate_musical_nickname()` (`VOLATILE`, no table I/O, correctly omits `SECURITY DEFINER`).

---

### `.planning/phases/01-identity-schema-expand/01-db-assertions.sql`

**Partial analog:** `supabase/migrations/20250115000005_remove_student_auth_fkey.sql` — its `DO $$ ...
RAISE NOTICE / RAISE WARNING ... END $$;` verification blocks (lines 68-114) are the closest thing this
repo has to an inline SQL assertion, though they log rather than hard-fail. RESEARCH.md's Q6 upgrades
this to actual `ASSERT` statements (hard-fail, matching D-28's stronger "test" framing rather than this
older file's "notice" framing):

```sql
-- 20250115000005_remove_student_auth_fkey.sql:68-93 (RAISE-based precedent)
DO $$
DECLARE
  constraint_exists boolean;
BEGIN
  SELECT EXISTS ( ... ) INTO constraint_exists;
  IF constraint_exists THEN
    RAISE NOTICE '✓ Foreign key constraint student_id -> students(id) is intact';
  ELSE
    RAISE WARNING '✗ Foreign key constraint student_id -> students(id) is missing!';
  END IF;
END $$;
```

RESEARCH.md's Q6 `BEGIN ... DO $$ BEGIN ASSERT ... END $$; ... ROLLBACK;` template (already fully
written, IDENT-01 through IDENT-05 plus the D-21 trigger round-trip and D-24/D-25 deletion-cascade
assertion per the Phase Requirements → Test Map table in RESEARCH.md) is the execution-ready version —
copy it directly rather than re-deriving from this older `RAISE`-based file.

## Shared Patterns

### `SECURITY DEFINER SET search_path = public` (every new PL/pgSQL function in this migration)

**Source:** `supabase/migrations/20260201000001_coppa_schema.sql` lines 64-69, 244-247, 300-303,
363-366, 411-414 (five separate functions, all identical clause order)
**Apply to:** `sync_student_to_child_profile()`, `sync_child_profile_to_student()`,
`cascade_delete_child_profile_on_student_delete()` — every trigger function this migration defines.

```sql
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
...
$$;
```

This clause order (`LANGUAGE` → `SECURITY DEFINER` → `SET search_path`) pins the search path to prevent
search-path-hijacking — a documented Postgres `SECURITY DEFINER` footgun, per RESEARCH.md's Security
Domain section, and is this repo's uniform convention with zero exceptions found across the functions
read this session.

### Idempotent trigger creation (`DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER ...`)

**Source:** `supabase/migrations/20250625120001_add_teacher_schema.sql` lines 156-160, 172-176,
178-182, 184-188, 190-194; `supabase/migrations/20260201000001_coppa_schema.sql` lines 82-88, 424-430
**Apply to:** All five new triggers in this migration.

```sql
DROP TRIGGER IF EXISTS trigger_name ON table_name;
CREATE TRIGGER trigger_name
  AFTER|BEFORE INSERT|UPDATE OF col1, col2 ON table_name
  FOR EACH ROW
  [WHEN (...)]
  EXECUTE FUNCTION function_name();
```

Every trigger in this repo is created this way (never a bare `CREATE TRIGGER` with no preceding `DROP
... IF EXISTS`), making the migration safely re-runnable — important given D-27's apply→rollback→
re-apply rehearsal cycle.

### FK constraint naming: `<table>_<column>_fkey` (single), `<table>_<column>_<target>_fkey` (dual)

**Source:** `supabase/migrations/20260327000002_fix_teacher_fk_references.sql` lines 5-10, 13-18
(`assignment_submissions_student_id_fkey`, `notifications_recipient_id_fkey` — single-target naming);
`supabase/migrations/20250115000005_remove_student_auth_fkey.sql` line 52
(`teacher_student_connections_student_id_auth_fkey` — the disambiguated-by-target-table naming already
used once in this repo's history for exactly this "same column, second FK" situation)
**Apply to:** Every `ADD CONSTRAINT` statement in the up-migration (Sub-pattern C above).

```sql
ADD CONSTRAINT <table>_<column>_child_profiles_fkey
  FOREIGN KEY (<column>) REFERENCES public.child_profiles(id) ON DELETE <action-matching-legacy-row>;
```

### `ENABLE ROW LEVEL SECURITY` with zero `CREATE POLICY` (deny-all)

**Source:** `supabase/migrations/20250625120001_add_teacher_schema.sql` line 199 (isolated from its own
file's subsequent `CREATE POLICY` statements — Phase 1 stops here, does not add policies)
**Apply to:** `parents`, `child_profiles` — both enabled, neither gets a `CREATE POLICY` statement in
this phase (D-16). Verify via `pg_policies` returning 0 rows for both tables post-migration — no
existing `SELECT ... FROM pg_policies` audit query was found in this repo to copy verbatim; write one
ad hoc for `01-db-assertions.sql`:

```sql
SELECT count(*) FROM pg_policies WHERE tablename IN ('parents', 'child_profiles'); -- expect 0
```

### Migration file naming/timestamp convention

**Source:** directory listing of `supabase/migrations/2026*.sql` (39 files spanning 2026-01-24 through
2026-07-12); most recent: `20260712120000_add_note_mastery.sql`
**Format:** `YYYYMMDDHHMMSS_snake_case_description.sql` — 14-digit timestamp prefix, underscore, short
description. No colon, no dash inside the timestamp. Choose a timestamp later than
`20260712120000` and internally consistent for the paired down-migration (same timestamp + `.down.sql`
suffix per RESEARCH.md's Recommended Project Structure, since no repo precedent exists to contradict
that suffix choice).

## No Analog Found

| File                                                               | Role                 | Data Flow     | Reason                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------ | -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `supabase/migrations/<ts>_add_parents_and_child_profiles.down.sql` | migration (rollback) | batch         | Zero committed down-migrations exist anywhere in `supabase/migrations/` (confirmed via `Glob *down*` and `Glob *rollback*`, both zero matches). D-27 is the first time this repo commits a paired rollback file. Synthesized mechanically above from the up-migration's own object list — reverse-order `DROP`s ending in the `DROP TABLE ... CASCADE` the phase boundary itself promises. |
| `.planning/phases/01-identity-schema-expand/01-db-assertions.sql`  | test                 | transactional | No SQL-assertion test file exists in this repo (Vitest/JSDOM is the only test framework per CLAUDE.md). RESEARCH.md's Q6 already supplies an execution-ready `BEGIN...ASSERT...ROLLBACK` template — treat that as the de facto pattern source since no closer repo analog exists.                                                                                                          |

## Metadata

**Analog search scope:** `supabase/migrations/` (full directory listing + 8 files read in full or
targeted excerpt), `supabase/functions/process-account-deletions/` (cited, not re-read — line numbers
already confirmed by RESEARCH.md Q5), CLAUDE.md "Testing" section (confirms no SQL-test framework
exists in this repo).
**Files scanned:** 39 migration filenames listed; 8 read directly (`20250625120001_add_teacher_schema.sql`,
`20250115000005_remove_student_auth_fkey.sql`, `20260327000002_fix_teacher_fk_references.sql`,
`20260321000001_account_deletion_log.sql`, `20260201000001_coppa_schema.sql` (2 targeted ranges),
`20260131000001_audit_rls_policies.sql`); 2 more located and title-confirmed but not read in full
(`20260131000002_audit_security_definer.sql`) since RESEARCH.md already supersedes their content with
execution-ready SQL.
**Pattern extraction date:** 2026-07-22
