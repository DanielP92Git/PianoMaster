# Pitfalls Research: v4.0 Parent-First Account Architecture (COPPA)

**Domain:** Live-data identity restructure (auth-user-is-student → parent-owns-child-profiles) + full deletion of a storage-backed feature (audio recordings), on a production React 18 + Supabase PWA with paying subscribers.
**Researched:** 2026-07-21
**Confidence:** HIGH (grounded directly in this repo's migrations, services, and PROJECT.md-measured surface area — not generic advice)

## Grounding facts used below

- `students.id` has no FK to `auth.users(id)` — deliberately dropped (`20250115000005`). Login-less profile rows already exist in production for teacher-created students. This is the proven pattern the milestone re-points at parents.
- **This exact codebase has already shipped the FK-target-drift bug once**: `20250625120001_add_teacher_schema.sql` pointed `assignment_submissions.student_id`, `notifications.recipient_id/sender_id` at `auth.users(id)`; three later migrations (`20250708191942`, `20250708191946`, `20260327000002_fix_teacher_fk_references.sql`) had to retroactively repoint them at `students(id)`. That is direct historical evidence the FK-repointing pitfall (#2 below) is not hypothetical here.
- `parent_subscriptions` RLS is `USING (student_id = (SELECT auth.uid()))` and `has_active_subscription(p_student_id UUID)` — subscription ownership is currently identical to auth identity. Confirmed in `20260404000001_ensure_subscription_rls.sql`.
- 30 identity-bearing FK columns across 26 tables reference `students(id)` (mostly `ON DELETE CASCADE`); 62 of 80 RLS policies use `auth.uid()` across 32 tables (measured, per PROJECT.md).
- `practice_sessions.has_recording` boolean already exists and is filtered correctly in `getRecordings()` (`practiceService.js`), but `achievementService.js`'s stats aggregation counts `practice_sessions` rows without that filter (per PROJECT.md, verified coupling) — deleting recording rows regresses achievement progress bars.
- Storage deletion in this codebase today is _manual and code-driven_: `practiceService.js` calls `supabase.storage.from("practice-recordings").remove([...])` only inside `deleteRecording()`/`deleteAllRecordings()`. Nothing else ever removes storage objects. The bucket itself and its storage policies exist only in the remote Supabase project — **no migration file creates them**, so `supabase db reset` / a fresh environment cannot reproduce or audit them.
- No i18n parity/orphan-key validation script exists in `scripts/` (only `validateTrail.mjs` and `patternVerifier.mjs`). EN/HE parity has historically been tracked manually per milestone (e.g. "89/89 EN↔HE" in v3.5). There is no build-time guard against a missing or orphaned translation key.
- `FREE_NODE_IDS` (JS) must stay hand-synced with Postgres `is_free_node()` — an established, already-fragile dual-source-of-truth pattern in this codebase that the new ownership model will add a second instance of (parent-vs-child gating).
- 34 files consume `useUser()` (42 call sites), 151 `user?.id` references in `src/`, 47 auth-id resolution call sites in services (`apiTeacher.js` alone has 25) — this is the blast radius for "current user id" no longer meaning "the student."

---

## Critical Pitfalls

### Pitfall 1: RLS ownership subquery has USING but not WITH CHECK (or vice versa) on UPDATE

**What goes wrong:**
Converting `student_id = auth.uid()` to something like `student_id IN (SELECT id FROM child_profiles WHERE parent_id = auth.uid())` is usually written once and pasted onto `FOR UPDATE` policies, which silently defaults `WITH CHECK` to the same expression as `USING` **only if you don't specify one explicitly**. Developers who only write `USING (...)` on an `UPDATE` policy get away with it in manual testing (because they're testing with their own child), but the row-level check governing what the _new_ row values may look like ends up unconstrained, or a copy-paste error means `WITH CHECK` still reads `student_id = auth.uid()` from before the refactor while `USING` was updated — meaning a parent can read/select rows for their own children (USING passes) but silently succeed in writing a `child_profile_id` for a **different family's child** on UPDATE (WITH CHECK evaluates against the same subquery it should, but only if actually rewritten). The dangerous version: `USING` is the ownership subquery, `WITH CHECK` is left as `true` or omitted, which turns "update your own child's data" into "update your own child's data, but repoint it to anyone's `child_profile_id`."

**Why it happens:**
Postgres has this exact footgun: `FOR UPDATE` without an explicit `WITH CHECK` reuses `USING`, so it "seems fine" — but this repo's own `20260127000003_optimize_rls_auth_plan.sql` shows every UPDATE policy already explicitly repeats both clauses (good precedent). The risk isn't that the team doesn't know the pattern — it's that with 62 policies to rewrite, at least one gets rewritten with the subquery only in `USING` under time pressure, and nothing in CI catches it (no automated RLS test suite exists in this repo today beyond ad hoc migrations).

**How to avoid:**

- Every rewritten `FOR UPDATE` and `FOR INSERT` policy must have **both** `USING` and `WITH CHECK` written out explicitly, even when identical, exactly as the `20260127000003` migration already does for `user_preferences`.
- Write a one-time SQL query against `pg_policies` that flags any `cmd = 'UPDATE'` policy where `with_check IS NULL` or `with_check <> qual` unexpectedly, across all 32 affected tables, and run it as a gate before merging the RLS migration.
- Add a regression test (can be a Node script using the Supabase service-role + two seeded parent/child fixtures) that attempts a cross-family UPDATE and asserts it is rejected — this is cheap and this codebase already has precedent for audit-style migrations (`20260131000001_audit_rls_policies.sql`).

**Warning signs:** A migration diff where an `UPDATE` policy's `WITH CHECK` block is missing, or is textually identical to a pre-refactor `student_id = auth.uid()` expression while `USING` was changed.

**Phase to address:** The RLS-rewrite phase, with its own verification step (this project already has a `/gsd-secure-phase` pattern used for the `note_mastery` JSONB column and can be reused here).

---

### Pitfall 2: FK target drift during re-pointing (already happened once in this codebase)

**What goes wrong:**
30 FK columns across 26 tables need to move from `student_id → students(id)` to `child_profile_id → child_profiles(id)` (or owner columns distinguishing parent-level vs child-level data). Because this is done table-by-table across many migration files (this repo's history shows RLS/FK fixes routinely spread across 2-3 follow-up migrations), it's easy to repoint some tables and miss others, leaving a mixed state where some FKs point at the old `students(id)`, some at the new `child_profiles(id)`, and some are still typed `UUID` with no FK constraint at all (which this repo has: `students.id` itself has zero FK to `auth.users`, "deliberately dropped").

**Why it happens:**
This is not hypothetical — it is the exact bug class already fixed three times in this repo (`20250708191942`, `20250708191946`, `20260327000002_fix_teacher_fk_references.sql`, all retroactively repointing FKs originally aimed at `auth.users(id)` back to `students(id)`). The team has direct precedent that "repoint identity FK, do it live, iterate" produces multi-migration drift. With 26 tables this time (vs. 3-4 before), the risk is proportionally larger, and unlike the earlier case there is a paying-subscriber population who will notice broken progress/billing immediately.

**How to avoid:**

- Before writing any migration, generate the full authoritative list of all 30 FK columns (a single SQL query against `information_schema.table_constraints`/`key_column_usage` filtered to `students(id)` as the target) and treat it as a checklist — do not rely on memory or grep across the codebase.
- Repoint FKs in **one migration transaction** where feasible (or a tightly sequenced set applied same-day), not spread across a milestone, specifically because this repo's history shows "spread across weeks" is when drift slipped through unnoticed.
- After the migration, re-run the same `information_schema` query and diff against the checklist — assert zero remaining `students(id)` references outside of tables intentionally kept parent/teacher-scoped (e.g. `teacher_student_connections` may legitimately still reference something teacher-facing).

**Warning signs:** Any table where writes succeed via the client but reads silently return zero rows (classic RLS-vs-wrong-FK symptom — no error, just missing data) — exactly how the original `assignment_submissions`/`notifications` bug likely first manifested.

**Phase to address:** Schema/migration phase, first thing, before any RLS rewrite (RLS policies depend on the FK columns existing and being correctly targeted).

---

### Pitfall 3: Recursive/self-referential RLS policy errors from the ownership subquery

**What goes wrong:**
`child_profiles` policies need to check "does this parent own this child" (`parent_id = auth.uid()`), which is a direct check. But every _other_ table (progress, achievements, subscriptions) needs "does this row's `child_profile_id` belong to a child owned by me," which requires an `EXISTS`/`IN` subquery against `child_profiles`. If `child_profiles` itself has RLS enabled (it should) and its own SELECT policy is written naively, nested policy evaluation can produce `ERROR: infinite recursion detected in policy` — especially if a later convenience view or function tries to also check `teacher_student_connections` (teachers need to see child progress too, per the milestone's "Teachers stay, re-pointed at child_profiles" decision), creating a two-hop or three-hop policy chain (teacher → connection → child_profiles → parent).

**Why it happens:**
Postgres RLS policies are themselves subject to RLS when referenced in a subquery, unless the referenced table's policy is `SECURITY DEFINER`-bypassed or the subquery explicitly targets a `SECURITY DEFINER` helper function. This repo already solved an equivalent problem for teacher access (`teacher_student_connections`) — but that pattern needs to be re-derived for the new three-way parent/child/teacher relationship, not copy-pasted, because the previous model was two-way (teacher→student directly).

**How to avoid:**

- Wrap the ownership check in a `SECURITY DEFINER` SQL function (e.g. `is_owner_of_child(child_id UUID) RETURNS BOOLEAN`) the same way `has_active_subscription()` and `is_free_node()` already exist as helper functions in this codebase — call the function from policies instead of inlining a subquery against a RLS-protected table. This sidesteps recursion and centralizes the ownership logic in one testable place instead of 26 duplicated subqueries.
- For the teacher path, chain through the same helper pattern used for `teacher_student_connections` today, verified against a child rather than a student.

**Warning signs:** `42P17: infinite recursion detected in policy for relation "child_profiles"` in Supabase logs (`get_advisors`/`get_logs` via Supabase MCP) the first time any query touches a downstream table under the new policies.

**Phase to address:** RLS-rewrite phase — design the `is_owner_of_child()` helper function _before_ writing the 62 policy rewrites, not after hitting the recursion error.

---

### Pitfall 4: Ownership-subquery RLS performance cliff on 26 tables

**What goes wrong:**
A direct equality check (`student_id = auth.uid()`) is index-friendly and evaluated once. An ownership subquery (`child_profile_id IN (SELECT id FROM child_profiles WHERE parent_id = auth.uid())`), if not wrapped correctly, gets re-evaluated **per row** by the Postgres planner — this repo already had to fix exactly this class of problem once, for the simpler `auth.uid()` case, in `20260127000003_optimize_rls_auth_plan.sql` (wrapping every bare `auth.uid()` in `(SELECT auth.uid())` to force single evaluation). The ownership-subquery version is a strictly harder version of the same problem: even with `(SELECT auth.uid())` wrapped, the _inner_ `child_profiles` lookup itself may not be cached/indexed correctly, and `IN (subquery)` predicates are more expensive than `= scalar`.

**Why it happens:**
The team has already paid down this exact tech debt once for a simpler predicate shape, which means it's a known risk class here — but the ownership-subquery rewrite reintroduces a harder version of the same problem across a larger surface (26 tables vs. the handful fixed previously), with real paying users (3 subscriptions) who will notice latency regressions on dashboard/trail loads.

**How to avoid:**

- Prefer the `SECURITY DEFINER` helper-function approach from Pitfall 3 (`is_owner_of_child(child_id)`), and mark it `STABLE` so Postgres can cache repeated calls within a statement.
- Add an index on `child_profiles(parent_id)` (and keep the existing `child_profile_id` FK indexes on downstream tables) before rollout — this repo already has a dedicated `20260129000001_optimize_indexes.sql` precedent showing the team tracks this as a distinct concern.
- Benchmark the trail/dashboard load query paths (the highest-read tables: `student_skill_progress`, `student_achievements`, `daily_goals`) before and after the RLS rewrite using `EXPLAIN ANALYZE`, not just "it loads fine for one test account" — the existing 20 live students plus test fixtures should be used to simulate realistic row counts.

**Warning signs:** Trail/dashboard queries that were fast in dev (1-2 test rows) but slow in staging/production once run against the 20 real students' full progress history.

**Phase to address:** RLS-rewrite phase, with a dedicated performance-verification step before the phase is marked done (this project already treats performance profiling as a distinct gate — see prior `PERF-01` requirements in earlier milestones).

---

### Pitfall 5: Live migration leaves users locked out silently, not with an error

**What goes wrong:**
Once `child_profiles.id` diverges from `auth.uid()`, any client code path that still does the old comparison (`user.id === studentId`, or queries filtered by `user.id` directly against a table now keyed by `child_profile_id`) does **not throw an error** — RLS just returns zero rows, or the client-side guard (`SEC-03: Client-side services verify user.id matches studentId`, already a shipped security feature in this codebase) actively _rejects_ the legitimate parent because their `auth.uid()` no longer equals the child's row id. This is a "quietly broken" failure mode, not a crash, so it survives casual smoke testing — the app loads, shows an empty dashboard, and looks like a data problem rather than an identity-model bug.

**Why it happens:**
This codebase deliberately hardened exactly this kind of check as a security feature in v1.0 (`SEC-03`), which means the fix for the _old_ model (client verifies `user.id === studentId`) is now an active landmine for the _new_ model — the same code that used to prevent impersonation will prevent legitimate parent access unless every one of the 47 auth-id resolution call sites in services (25 in `apiTeacher.js` alone) is updated to resolve "the currently selected child profile" rather than "the auth user."

**How to avoid:**

- Grep and enumerate every `user.id === ` / `user?.id ===` comparison against a `student_id`/progress-table id before writing the migration — treat `SEC-03`-style checks as a checklist, not incidental risk, precisely because they were built to be strict.
- Introduce an explicit "active child profile" concept (context/hook) as the _only_ source of the id used against child-scoped tables, and audit that the 34 files/42 call sites of `useUser()` are triaged into "needs parent id" vs "needs active child id" — do not let call sites default to `user.id` out of inertia.
- Roll the identity migration behind a feature flag or staged rollout (e.g. dual-write / shadow-read) rather than a single atomic cutover, given 15 live auth accounts with real subscriptions — this project has precedent for atomic cutovers (`v1.3` trail redesign: "Atomic cutover with progress reset and XP preservation") but that was for content data, not identity/auth, which has a much higher cost of getting wrong.

**Warning signs:** Post-migration, any of the 20 real students loading a dashboard with zero XP/streak/progress shown despite data existing in the DB — verify via Supabase SQL directly (bypassing RLS as service role) before assuming data loss.

**Phase to address:** Migration-execution phase; the verification step must explicitly log into (or simulate) each of the 15 real auth accounts post-migration and confirm non-empty progress, not just check row counts server-side.

---

### Pitfall 6: "Child registered with own email → becomes a parent account" silent reparenting

**What goes wrong:**
The owner decision already flags this: some of the 15 real auth accounts belong to children who signed up directly (pre-COPPA-refactor). Auto-migrating them to "own a parent account which owns one child profile" is _technically_ consistent with the new schema, but legally and UX-wise it means a child's account silently becomes the adult-controlled account with billing/settings access — with no adult having agreed to that role. If the migration script does this unconditionally (because it's the path of least resistance for "preserve logins and 3 active subscriptions"), it ships a COPPA problem baked directly into the fix for a COPPA problem.

**Why it happens:**
Under time/deadline pressure (COPPA deadline April 22, 2026 per PROJECT.md constraints — though that date is in the past relative to "today," meaning the project may already be operating past its original compliance target, raising the urgency), the simplest migration script treats all pre-existing accounts uniformly. The owner decision text already explicitly calls this out as needing "a re-consent prompt, not a silent conversion" — the risk is the _implementation_ skipping that nuance under time pressure, not the plan lacking awareness of it.

**How to avoid:**

- Segment the 15 auth accounts explicitly during migration planning: which were created via the "child self-registers" path (role-first signup wizard, birth year collected) vs. teacher-created placeholder rows. Only accounts flagged as self-registered-by-a-minor need the re-consent gate; accounts already known to be adults (teachers, or parents who registered via the existing "optional parent email" field from `v2.7`) can migrate silently.
- Build the re-consent prompt as a **blocking** first-login screen post-migration for the flagged accounts specifically — "confirm you are 18+ to continue managing this account" — not a dismissible banner, and log the consent event with a timestamp (same audit-log discipline as the existing COPPA hard-delete Edge Function).
- Do not ship this silently even if it's a small number of accounts — this is the single highest legal-risk item in the whole migration, since it's converting a minor's account into an "I am an adult" attestation without ever asking.

**Warning signs:** None will surface functionally — this pitfall causes no bugs, no errors, no test failures. It is purely a compliance/legal risk that must be caught by explicit design review, not QA.

**Legal dimension:** COPPA-relevant. Converting a child-registered account into the account-of-record for parental consent/billing without an explicit adult attestation could itself be read as circumventing COPPA's verifiable-parental-consent requirement, defeating the purpose of the milestone.

**Phase to address:** Migration-planning phase, before any migration script is written — needs an explicit segmentation query against the 15 accounts and sign-off on the re-consent UX before implementation.

---

### Pitfall 7: Deleting the recording feature's code/table does not delete the storage objects

**What goes wrong:**
The `practice-recordings` bucket exists **only in the remote Supabase project** with no migration creating it. The only code paths that ever call `supabase.storage.from("practice-recordings").remove(...)` are inside `practiceService.js`'s `deleteRecording()`/`deleteAllRecordings()` functions. If the deletion work drops the `practice_sessions` table (or the columns `recording_url`/`has_recording`) and deletes the UI/service files without **first** running an explicit bulk-remove of every object in the bucket, every uploaded recording remains in storage indefinitely — orphaned, unreferenced by any DB row, un-deletable through any remaining UI (because the UI is gone), and still billed for storage. Since children's voices are the entire reason this feature is being removed, this is the single worst possible outcome: the feature is "deleted" from the app while the sensitive data it collected is still sitting in a bucket nobody can see or manage anymore.

**Why it happens:**
"Delete the feature" naturally reads as "delete the code," and the storage bucket is invisible in the local dev environment (no migration represents it, `supabase db reset` never shows it) — it's easy for someone doing the deletion work to never even see the bucket exists unless they specifically check the remote dashboard or use the Supabase MCP's storage tools.

**How to avoid:**

- Before deleting any code, enumerate every object currently in `practice-recordings` (via Supabase MCP or the dashboard) and export/log the count and total size — this becomes the evidence record for the legal requirement below.
- Write a one-time cleanup script/Edge Function that bulk-deletes all objects in the bucket, run and confirmed **before** the code deletion PR merges, not after — do it while the code that can enumerate `recording_url` values (for cross-referencing/logging) still exists.
- After objects are deleted, delete the bucket itself and its storage policies (not just empty it) via the Supabase dashboard/MCP, and — since nothing in the repo represents the bucket today — add a migration or `supabase/config.toml` note recording that the bucket was deleted, so this doesn't look like an oversight to a future engineer (or auditor) reading the migration history.

**Warning signs:** After the "deletion" ships, storage usage in the Supabase dashboard does not drop to zero.

**Legal dimension:** COPPA. Retaining children's voice recordings — audio is explicitly called out as personal information under the 2013 COPPA amendment, which is the stated reason for removing this feature at all — after the feature is nominally "removed" is the exact failure mode the milestone exists to prevent. This is not a technical debt item; it is the core compliance risk of Phase 2.

**Phase to address:** The feature-deletion phase, and it must be sequenced **first** within that phase (storage cleanup before code deletion), not last.

---

### Pitfall 8: No audit trail / evidence of deletion for storage objects

**What goes wrong:**
Even after Pitfall 7 is correctly avoided and the bucket is emptied, a bare `storage.remove([...])` bulk call produces no durable record of _what_ was deleted, _when_, or _for which students_ — no count, no manifest, no confirmation log. If a parent, regulator, or Google Play Families reviewer later asks "prove you deleted the audio you collected from my child," there is nothing to produce beyond "we believe we ran a script once."

**Why it happens:**
This codebase already solved this exact problem for account-level COPPA hard-deletion — `20260321000001_account_deletion_log.sql` plus the cron-triggered hard-delete Edge Function that writes an HMAC-signed audit log entry per deletion. It's easy to treat the storage-bucket cleanup as a one-off maintenance task rather than routing it through the same audited-deletion discipline the team already built and trusts for the harder case (full account erasure).

**How to avoid:**

- Reuse the existing `account_deletion_log` pattern (or a sibling table) to record: object count deleted, total bytes, which `student_id`s/`child_profile_id`s were affected, a timestamp, and the operator/script identity — mirroring the audit rigor already applied to `v2.5`'s COPPA hard-delete work (DEL-01-07).
- Keep this log itself PII-minimal (student ids, not names; no need to log recording content or filenames beyond what's needed for the count).

**Warning signs:** None technical — this is purely a "can we answer an audit question" gap, which won't surface until someone asks.

**Legal dimension:** COPPA/GDPR-K data-deletion evidence requirement — "we deleted it" needs to be demonstrable, not just true.

**Phase to address:** Same phase as Pitfall 7 (storage cleanup), same script.

---

### Pitfall 9: Deleting `practice_sessions` rows regresses achievements silently (known coupling, must be sequenced correctly)

**What goes wrong:**
This coupling is already identified: `achievementService.js`'s stats aggregation counts `practice_sessions` rows without filtering on `has_recording`. If the recording-deletion work deletes rows where `has_recording = true` (or drops the whole table), any achievement whose condition depends on total practice-session counts will regress for real students — a student who legitimately earned an achievement based on a mix of recorded and non-recorded sessions could see it un-earn (if achievement state is recalculated, not just cached) or the progress bar shown on next load could look wrong even if the earned-achievement row itself persists.

**Why it happens:**
`practice_sessions` currently serves two purposes: recorded practice logging (with audio) and lightweight per-game session logging (`has_recording: false`, used by `saveGameSession`-style calls). Removing "the recording feature" conceptually should only remove the _audio_ half, but if the deletion work treats `practice_sessions` as _the_ recordings table and drops/truncates it wholesale, the non-recording rows (which power streaks, achievement counts, and possibly teacher analytics via `apiTeacher.js`'s 6+ query sites) go with it.

**How to avoid:**

- Do not drop or truncate `practice_sessions`. Only remove rows/columns specific to the audio path: `recording_url`, storage-bucket references, and rows where `has_recording = true` (after confirming, via the achievement stats query, whether those rows should be preserved as session history with the audio link nulled rather than the row deleted outright — preserving history avoids the regression entirely).
- Fix `achievementService.js`'s stats query to be explicit about what it's counting regardless of the recording deletion (add the missing scoping) — this is a pre-existing bug independent of this milestone, but it becomes user-visible the moment recording rows disappear, so it must be fixed in the same phase, not left for later.
- Grep every consumer of `practice_sessions` (14 files/33+ call sites found in this repo, including `apiTeacher.js`, `apiDatabase.js`, `dataExportService.js`, `useTeacherRecordingNotifications.js`, `useStudentFeedbackNotifications.js`) before deciding row-delete vs. column-null, since teacher notification hooks and the data-export (COPPA data export) flow both key off this table too.

**Warning signs:** A student's achievement progress bar (e.g. "practice X sessions") drops after the recording-deletion migration runs, or `dataExportService.js`'s COPPA data-export output changes shape/count for existing users.

**Phase to address:** Feature-deletion phase; needs its own sub-step distinct from the storage-bucket cleanup (Pitfall 7/8), because this is a data-modeling decision (null the column vs. delete the row) that has to be made before any bulk delete runs.

---

### Pitfall 10: `teacher_feedback` badge dies silently (known coupling)

**What goes wrong:**
`teacher_feedback` is written exclusively by the `RecordingsReview` screen (teacher reviewing a student's recording). Removing the recordings feature removes the only writer of this table, but the _reader_ — the student-facing "you have feedback" notification badge (`useStudentFeedbackNotifications.js`) — still queries it. The badge doesn't error; it just permanently shows nothing, and any existing unread-feedback state for students becomes unreachable UI dead weight (rows exist, nothing surfaces them, nothing tells the student they existed).

**Why it happens:**
The feedback mechanism was built as a side effect of the recording-review workflow specifically, not as a standalone teacher→student messaging feature, so removing the parent workflow silently orphans the child workflow — a common "feature deletion" trap where two features share a table but only one is being deleted.

**How to avoid:**

- Explicitly decide, as part of scoping the deletion phase, whether `teacher_feedback` is in scope for removal too (likely yes, since it has no other writer) or whether it should be preserved as a hook point for a future non-recording-based teacher feedback mechanism.
- If removing: also remove/hide `useStudentFeedbackNotifications.js` and its badge UI, and check `AssignmentManagement.jsx` (which references `submission.practice_sessions`) for any indirect display of feedback state.
- If preserving: explicitly note this as a known future gap (a teacher-feedback writer needs to be rebuilt independent of recordings) rather than leaving it ambiguous.

**Warning signs:** A teacher-facing "leave feedback" UI element with no student-facing surface for it post-deletion (dead one-way data).

**Phase to address:** Feature-deletion phase, decided explicitly rather than left as an accidental side effect.

---

### Pitfall 11: Child escapes to the parent surface (parental gate is a route guard, not a data guard)

**What goes wrong:**
The existing `ParentGateMath` pattern (already used for Parent Portal/settings/billing) is explicitly a client-side math-problem gate on specific _routes_. In a profile-switcher model, a child using the shared device only needs to navigate directly to a parent-only URL (or trigger a component that's supposed to be gated but isn't wired to check gate-state on mount, only on the entry button) to reach billing/subscription-cancel/child-profile-delete screens. An 8-year-old defeating a two-digit-addition gate is trivial (guess-and-check, or asking a sibling), and the milestone's own PRD explicitly plans this exact mechanism (`8 x 7 = ?`) as _the_ security guard for account settings/subscription/billing.

**Why it happens:**
This app is a PWA with client-side routing; "gate the button that navigates to the route" is much easier to implement than "gate the route itself regardless of entry point," and it's easy to gate the obvious entry point (profile-switcher's "Parent Zone" button) while missing direct URL access, browser back-button/forward-cache bypass, or a deep link from a push notification.

**How to avoid:**

- Gate at the route level (a wrapper component checked on every mount of parent-scoped routes, re-verifying gate-passed state, not just a one-time click-through) — this repo already has `ProtectedRoute` precedent for auth; extend the same pattern for a `ParentGateProtectedRoute`.
- Treat the gate state as short-lived (re-prompt after N minutes of inactivity or on route re-entry) rather than a permanent "gate passed" flag stored for the session — otherwise the first child to pass the gate leaves it open for whichever sibling picks up the device next.
- Explicitly test the "type the URL directly" and "browser back button after gate-pass, then forward" paths, not just the primary click-through flow, during QA for this phase.

**Warning signs:** None will show up in a straight-line manual test — this specifically requires an adversarial test pass (try to reach `/parent-portal` or subscription-cancel without clicking the gated entry point).

**Phase to address:** The child-profile/parental-gate phase, with an explicit adversarial-testing checklist item (not just the happy-path gate demo).

---

### Pitfall 12: Profile switch doesn't rescope cached state — sibling data bleed

**What goes wrong:**
This app already uses React Query with per-user keys (e.g. `["streak-state", userId]`, per this repo's `streakService.js` convention) plus various Context providers (`SessionTimeoutContext`, audio, settings) that are instantiated once per app session. Under the old model, "session" and "student" were the same thing, so query keys scoped to `userId` were correct. Under the new model, one auth session (`userId` = parent) serves N children; if query keys stay scoped to `userId` instead of the _active child profile id_, switching from Child A to Child B will either (a) show Child A's cached XP/streak/HUD state briefly or persistently, or (b) worse, allow a write (e.g. saving a game score) to land against the wrong child if the "current student id" resolution lags the profile-switch UI state.

**Why it happens:**
This is the same blast-radius problem as Pitfall 5 but for client-side cache/state rather than server-side RLS — every one of the 34 files/42 `useUser()` call sites and every React Query key built from `userId` needs to be re-audited to use "active child profile id" instead, and it's easy to fix the obvious top-level state but miss a memoized hook or a component that grabbed `userId` once on mount and never re-reads it on switch.

**How to avoid:**

- Introduce a single `activeChildProfileId` piece of state (Context) that is the _only_ thing passed down for child-scoped data fetching, and make the profile-switcher action explicitly invalidate/clear all React Query caches keyed by the old child id (`queryClient.removeQueries` or a full `queryClient.clear()` on switch is safer than trying to enumerate every key).
- Force full component remount on switch (e.g. a `key={activeChildProfileId}` on the top-level authenticated app shell) rather than relying on every consumer to correctly react to a context change — this is a blunter but much safer instrument given the size of the call-site surface.
- Specifically re-test session-timeout behavior (`SessionTimeoutContext`) across a profile switch — the existing 30min/2hr role-based timers were built around "session = one student," and need to be re-verified to reset (not silently carry over) on switch.

**Warning signs:** Combo/streak/XP numbers that flash the wrong child's values for a frame after switching, or (far worse, needs explicit test) a game score save landing on the wrong `child_profile_id` immediately after a fast profile switch.

**Phase to address:** Profile-switcher implementation phase; needs a dedicated multi-child device test (create 2+ child profiles, switch rapidly, verify no bleed) as an explicit acceptance criterion, not just a demo of the switch UI itself.

---

### Pitfall 13: Lemon Squeezy subscription ownership doesn't map cleanly onto child profiles

**What goes wrong:**
`parent_subscriptions.student_id` is currently `= auth.uid()` — i.e., the subscribing identity and the gated identity are the same row. The LS webhook handler (`lib/upsertSubscription.ts`) writes `student_id: payload.student_id` directly from checkout custom data. Once identity splits into parent (auth.uid()) vs. child_profile (a separate row a parent may have several of), there are two very different possible models — "subscription gates one specific child" vs. "subscription gates the whole family/parent account" — and the PRD/milestone text doesn't specify which. If the webhook keeps writing to a `student_id`-shaped column without an explicit decision, one of two silent failures happens: (a) the subscription re-attaches to whichever child happened to be "active" during the original checkout flow and doesn't extend to siblings the parent reasonably expects to also be covered, or (b) the checkout custom-data payload still encodes an old `student_id` value (from before migration) that no longer resolves to any live `child_profile_id`, and the webhook silently upserts an orphaned subscription row that never gates anything.

**Why it happens:**
Billing/subscription code paths are the least likely to be touched during a UI-focused profile-switcher redesign, and Lemon Squeezy's checkout custom-data is opaque until a webhook fires — a mismatch here won't be caught by any local testing, only by a real webhook event against production, exactly where the 3 live paying subscriptions are.

**How to avoid:**

- Explicitly decide during design (not implementation): does a subscription attach to `parent_id` (family-wide access, all current and future children of that parent gated identically) or to a specific `child_profile_id` (per-child paywall, requiring re-purchase per sibling)? Given this is a piano-learning app likely used by siblings in one household, family-wide (`parent_id`-scoped) is very likely the intended and expected model — but this must be an explicit decision recorded in the roadmap, not inferred from old code.
- If moving to `parent_id`-scoped, migrate the 3 live `parent_subscriptions` rows explicitly (map each existing `student_id` to its new owning `parent_id`) as a dedicated, verified migration step — do not let this happen implicitly via a generic FK repoint that wasn't designed with billing semantics in mind.
- Update `has_active_subscription()` and the LS webhook's `upsertSubscription.ts` together, in the same phase, and test against LS's sandbox/test-mode webhook before touching the 3 live subscriptions — a broken webhook silently failing to grant/renew access on a real paying customer is a support/refund incident, not just a bug.

**Warning signs:** A real subscription renewal webhook firing post-migration and either erroring (visible in Edge Function logs) or succeeding but not actually unlocking content for the correct child (much harder to notice — needs an explicit post-migration manual check against all 3 live subscriptions).

**Phase to address:** Needs its own explicit sub-phase or at minimum a dedicated verification step gated on real LS sandbox testing before the identity-migration phase touches `parent_subscriptions` — billing correctness for 3 live paying customers is a distinct risk class from general data correctness.

---

### Pitfall 14: Bulk i18n key deletion fails silently, both ways

**What goes wrong:**
i18next's default behavior on a missing key is to fall back to the key string itself or a configured default — it does not throw, and this repo has no automated i18n validation script (`scripts/` only has `validateTrail.mjs` and `patternVerifier.mjs`, nothing for locales). Bulk-deleting ~70 recording-related keys × 2 locales (EN/HE) has two independent silent-failure modes: (1) a key gets deleted from `en.json` but a stray `t("recordings.xyz")` call survives somewhere non-obvious (e.g. inside `AssignmentManagement.jsx`'s reference to `submission.practice_sessions`, or a shared component that also handles other session types) and now renders the raw key string or a blank to real users; (2) a key gets deleted from `en.json` but not `he.json` (or vice versa), silently breaking the EN/HE parity this project has otherwise maintained rigorously per-milestone (manually, e.g. "89/89 EN↔HE" tracked in v3.5) — and nothing catches it because that parity check has always been a manual, milestone-specific effort, never an automated gate.

**Why it happens:**
i18next is designed to degrade gracefully in production (better a visible-but-ugly fallback string than a crash), which is exactly what makes over-deletion and under-deletion both invisible without deliberate tooling — the graceful-degradation feature that protects against typos in normal development actively works against catching a large deliberate deletion correctly.

**How to avoid:**

- Before deleting any locale keys, run a repo-wide search for every `t("...")`/`i18n.t("...")` call whose key namespace touches recordings/practice-session-audio, cross-reference against the ~70 keys planned for deletion, and confirm zero remaining call sites reference them (this is a mechanical, scriptable check — worth writing even as a one-off script, following this repo's existing precedent of writing verification scripts for structural invariants like `validateTrail.mjs`).
- Delete keys from EN and HE in the **same commit**, and diff the two locale files' key sets before/after to confirm they still match exactly (a simple `Object.keys` set-diff script) — do not rely on manual side-by-side review for ~140 key removals.
- Consider this the moment to add a lightweight automated i18n-parity script to `scripts/` (mirroring `validateTrail.mjs`'s role as a build-time invariant checker) given this milestone is deleting at a scale (~70×2) well beyond what manual per-milestone tracking has handled before — this closes a pre-existing gap that this specific deletion makes newly risky.

**Warning signs:** Post-deletion, a raw i18n key string (e.g. `recordings.title`) visibly rendered in the UI anywhere, or a `console.warn` from i18next about missing keys (if `saveMissing`/debug logging is enabled) that's currently being ignored.

**Phase to address:** Feature-deletion phase, as a dedicated verification step run before the phase is marked complete — should be one of the last things checked (after code/route/component deletion) since new orphaned references can only be found once the deletion is otherwise finished.

---

## Technical Debt Patterns

| Shortcut                                                                                   | Immediate Benefit                                                     | Long-term Cost                                                                                                                      | When Acceptable                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repointing FKs table-by-table across several small migrations instead of one audited batch | Easier to review each diff                                            | Exactly the drift bug this repo already shipped once (`auth.users` vs `students`)                                                   | Never for this milestone — batch it, given the precedent                                                                                                    |
| Client-side-only parental gate (no server-side re-check on sensitive mutations)            | Fast to ship, matches PRD's literal wording ("math problem like 8×7") | An 8-year-old or a compromised client can bypass client-only gates entirely for billing/settings mutations                          | Acceptable only for pure-UI reveal (e.g. showing/hiding a menu item), never for actual mutation authorization — those must also be RLS/service-role checked |
| Nulling `recording_url` instead of deleting `practice_sessions` rows                       | Preserves achievement/streak history, avoids Pitfall 9                | Leaves a `has_recording`/`recording_url` vestige in the schema that has to be explained later                                       | Acceptable and recommended as the actual approach here — the "cost" is just a documented deprecated column, not a data-integrity risk                       |
| Treating `teacher_feedback` cleanup as out of scope ("nobody will notice")                 | Less work in this milestone                                           | A dead one-way UI element (badge with nothing behind it) ships to production and looks like a bug to any future engineer or QA pass | Never — explicitly decide keep-and-repurpose vs. remove (Pitfall 10)                                                                                        |

## Integration Gotchas

| Integration            | Common Mistake                                                                                                                | Correct Approach                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase RLS           | Rewriting `USING` without also rewriting `WITH CHECK` on UPDATE/INSERT policies                                               | Always write both explicitly for every rewritten policy; verify via `pg_policies` query (Pitfall 1)                                                                          |
| Supabase Storage       | Assuming a bucket that only exists in the remote project is safe to ignore during code deletion                               | Enumerate and bulk-delete bucket contents as an explicit, logged step before or alongside code deletion (Pitfall 7/8)                                                        |
| Lemon Squeezy webhooks | Leaving `upsertSubscription.ts` writing to a `student_id`-shaped column without redefining what identity it should now target | Explicitly decide parent-scoped vs. child-scoped billing and update the webhook handler + `has_active_subscription()` together, tested against LS sandbox first (Pitfall 13) |
| i18next                | Assuming a missing/orphaned key will surface as a visible error during QA                                                     | It degrades silently; requires an explicit key-usage cross-reference script, not manual QA (Pitfall 14)                                                                      |

## Performance Traps

| Trap                                                                                         | Symptoms                                                                                      | Prevention                                                                                                                                                   | When It Breaks                                                                                             |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Ownership subquery evaluated per-row instead of once per statement                           | Dashboard/trail load times regress after RLS rewrite, not before                              | Use a `STABLE SECURITY DEFINER` helper function + index on `child_profiles(parent_id)`; benchmark with `EXPLAIN ANALYZE` against real row counts (Pitfall 4) | Noticeable once the 20 live students' full progress history is queried, not with 1-2 dev fixtures          |
| `queryClient.clear()`-free profile switching leaves stale cached queries around indefinitely | Memory growth / stale-data flashes accumulate the more profile switches happen in one session | Invalidate or clear query cache explicitly on every profile switch (Pitfall 12)                                                                              | Multi-child households doing several switches per session — will not show up in single-child test accounts |

## Security Mistakes

| Mistake                                                                                                      | Risk                                                                                                                                        | Prevention                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Route-only parental gate with no re-verification on direct navigation or route re-entry                      | Child reaches billing/subscription-cancel/account-delete surfaces                                                                           | Gate at the route-wrapper level, re-checked per mount, short-lived gate-passed state (Pitfall 11)                                   |
| RLS policy rewritten with recursive self-reference across `child_profiles` ↔ `teacher_student_connections`  | Query-time `infinite recursion` errors in production, or (worse) a recursion workaround that over-broadly grants access to bypass the error | Use `SECURITY DEFINER` helper functions for ownership checks, not inline subqueries against RLS-protected tables (Pitfall 3)        |
| Assuming code-level deletion of the recordings feature also deletes the underlying storage data              | Continued unauthorized retention of children's voice recordings — the exact harm the milestone exists to eliminate                          | Enumerate + bulk-delete + log bucket contents as its own explicit, verified step (Pitfall 7/8) — legal/COPPA risk, not just cleanup |
| Silent reinterpretation of a child's pre-existing account as an adult "parent" account during auto-migration | Bypasses the verifiable-parental-consent purpose of the whole milestone                                                                     | Segment accounts, blocking re-consent prompt for flagged ones (Pitfall 6) — legal/COPPA risk                                        |

## UX Pitfalls

| Pitfall                                                                             | User Impact                                                                                                           | Better Approach                                                                                                           |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Sibling data bleed on profile switch (stale cache)                                  | A child briefly or persistently sees another child's XP/streak/HUD, or (worst case) a save lands on the wrong sibling | Full remount + query-cache clear on switch, explicit multi-child device test (Pitfall 12)                                 |
| Achievement progress bars regress after recording rows disappear                    | Real students perceive their earned progress as lost/reset, eroding trust in a gamified retention app                 | Fix the `achievementService.js` stats query scoping in the same phase as the deletion, not as an afterthought (Pitfall 9) |
| A teacher-facing "give feedback" affordance persists with no student-facing outcome | Teacher effort is wasted invisibly                                                                                    | Explicitly remove or repurpose `teacher_feedback` alongside the deletion, not left dangling (Pitfall 10)                  |

## "Looks Done But Isn't" Checklist

- [ ] **RLS policies rewritten:** Often missing an explicit `WITH CHECK` on UPDATE/INSERT that matches the new `USING` clause — verify via a direct `pg_policies` query across all 32 affected tables, not just a visual diff review.
- [ ] **FK columns repointed to `child_profiles(id)`:** Often incomplete across the full 26-table/30-column surface — verify via a fresh `information_schema` query confirming zero unintended remaining references to `students(id)`.
- [ ] **Recordings feature "removed":** Often means code/UI removed only — verify the `practice-recordings` Storage bucket is actually empty (or deleted) in the Supabase dashboard, not just that no route reaches it anymore.
- [ ] **Achievement/streak/teacher-notification counts unaffected by recording deletion:** Often assumed fine because it "wasn't touched" — verify `achievementService.js`'s practice-session counting logic explicitly, since it already has the known `has_recording`-filter gap.
- [ ] **EN/HE i18n parity after bulk key deletion:** Often verified by spot-checking a few screens — verify via an actual key-set diff between `en` and `he` locale files, and a repo-wide search confirming zero remaining `t()` references to deleted keys.
- [ ] **Lemon Squeezy subscriptions still functional for the 3 live paying customers:** Often assumed fine because the webhook code "still runs" — verify against LS sandbox test-mode first, then confirm all 3 real subscriptions still correctly gate content post-migration.
- [ ] **Parental gate blocks all paths to a protected surface, not just the button that links to it:** Often demoed via the happy-path entry point only — verify direct URL navigation and browser back/forward are also gated.

## Recovery Strategies

| Pitfall                                                                                  | Recovery Cost                                                    | Recovery Steps                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FK target drift discovered post-deploy                                                   | MEDIUM                                                           | Follow this repo's own precedent (three prior "fix\_\*\_fk_references" migrations) — write a corrective migration repointing the specific drifted columns; low risk since the pattern is proven to work here                                |
| Orphaned storage objects discovered after the fact                                       | LOW-MEDIUM (technical), HIGH (legal exposure window)             | Run the bulk-delete + audit-log script late rather than never — technically simple, but the legal exposure (retained children's data) existed for however long the gap lasted, which should be disclosed/documented, not just quietly fixed |
| Sibling data bleed reported by a real family                                             | MEDIUM                                                           | Force `queryClient.clear()` + full remount on switch as a hotfix; audit which specific cached queries caused the bleed and add them to a regression test                                                                                    |
| A real LS subscription silently stopped gating content post-migration                    | HIGH (support/trust cost even though technically low-effort fix) | Manually verify and correct the specific `parent_subscriptions` row for the affected customer; proactively reach out rather than waiting for a support ticket, given only 3 customers total — each one matters disproportionately           |
| Child-registered account silently converted to "parent" without consent, discovered late | HIGH (legal)                                                     | Retroactively surface the blocking re-consent prompt to the affected account(s) on next login; document the gap and remediation for compliance record-keeping                                                                               |

## Pitfall-to-Phase Mapping

| Pitfall                             | Prevention Phase                                                 | Verification                                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1. USING/WITH CHECK mismatch        | RLS-rewrite phase                                                | `pg_policies` query across all 32 tables confirms explicit, correct `WITH CHECK` on every UPDATE/INSERT policy            |
| 2. FK target drift                  | Schema/migration phase (first)                                   | `information_schema` diff against the authoritative 30-column checklist, zero unintended `students(id)` references remain |
| 3. Recursive RLS                    | RLS-rewrite phase (design step)                                  | `SECURITY DEFINER` helper function exists and is used; no `42P17` errors in Supabase logs after rollout                   |
| 4. RLS performance cliff            | RLS-rewrite phase (perf gate)                                    | `EXPLAIN ANALYZE` on trail/dashboard queries against real (20-student) row counts before phase sign-off                   |
| 5. Silent lockout mid-migration     | Migration-execution phase                                        | Manual post-migration check of all 15 real auth accounts' dashboard non-emptiness, not just row-count checks              |
| 6. Silent child→parent reparenting  | Migration-planning phase (before implementation)                 | Explicit account segmentation query + signed-off re-consent UX design before any migration script is written              |
| 7. Orphaned storage objects         | Feature-deletion phase (sequenced first)                         | Bucket object count = 0 (or bucket deleted) confirmed via Supabase dashboard/MCP before code-deletion PR merges           |
| 8. No deletion audit trail          | Feature-deletion phase (same step as #7)                         | Audit-log table has a row recording the bulk deletion event (count, timestamp, affected ids)                              |
| 9. Achievement regression           | Feature-deletion phase (own sub-step)                            | Achievement progress bars for existing students unchanged before/after, spot-checked against real accounts                |
| 10. `teacher_feedback` dead badge   | Feature-deletion phase (explicit decision)                       | Either the badge UI is removed alongside the table, or a decision to preserve it is documented with a follow-up plan      |
| 11. Parental gate bypass            | Child-profile/gate phase                                         | Adversarial test: direct URL nav and back/forward-cache both blocked, not just the primary entry button                   |
| 12. Sibling data bleed              | Profile-switcher phase                                           | Multi-child device test: create 2+ profiles, rapid-switch, confirm zero stale/cross-child data or writes                  |
| 13. Billing ownership mismatch      | Dedicated billing sub-phase (before touching live subscriptions) | LS sandbox webhook test passes; all 3 real subscriptions manually confirmed still gating correctly post-migration         |
| 14. Silent i18n over/under-deletion | Feature-deletion phase (final verification step)                 | Key-set diff EN vs HE matches exactly; zero repo-wide `t()` references to deleted keys remain                             |

## Sources

- Direct repository evidence: `supabase/migrations/20250625120001_add_teacher_schema.sql`, `20250708191942_fix_notifications_foreign_keys.sql`, `20250708191946_fix_assignment_foreign_keys.sql`, `20260327000002_fix_teacher_fk_references.sql` (proof of prior FK-drift bug in this exact codebase)
- `supabase/migrations/20260127000003_optimize_rls_auth_plan.sql` (proof of prior RLS performance fix pattern, `(SELECT auth.uid())` wrapping)
- `supabase/migrations/20260404000001_ensure_subscription_rls.sql` (current `parent_subscriptions` ownership model, `student_id = auth.uid()`)
- `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` (webhook writes `student_id` directly from checkout payload)
- `src/services/practiceService.js` (only code paths that touch the `practice-recordings` Storage bucket)
- `src/services/achievementService.js`, `src/services/apiDatabase.js`, `src/services/apiTeacher.js`, `src/services/dataExportService.js`, `src/hooks/useTeacherRecordingNotifications.js`, `src/hooks/useStudentFeedbackNotifications.js` (practice_sessions/teacher_feedback consumer surface)
- `src/config/subscriptionConfig.js` (existing dual-source-of-truth pattern between JS `FREE_NODE_IDS` and Postgres `is_free_node()`, precedent for the parent/child gating equivalent)
- `scripts/` directory contents (absence of an i18n parity/validation script, confirming Pitfall 14's "no build-time guard" claim)
- `.planning/PROJECT.md` (measured migration surface: 30 FK columns/26 tables, 62/80 RLS policies/32 tables, 34 files/42 `useUser()` call sites, 151 `user?.id` references, 47 service-layer auth-id call sites, 20 students/15 auth accounts/3 subscriptions, known `achievementService.js:234` and `teacher_feedback` couplings)
- `COPPA_REFACTOR_PRD.md` (target schema and parental-gate requirements this milestone implements)

---

_Pitfalls research for: Parent-first identity restructure + audio-recording feature deletion on a live COPPA-driven Supabase PWA_
_Researched: 2026-07-21_
