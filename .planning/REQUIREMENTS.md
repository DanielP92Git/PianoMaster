# Requirements — v4.0 Parent-First Account Architecture (COPPA)

**Milestone goal:** Every top-level account belongs to an adult. Children become login-less profile rows owned by a parent, carrying no personally identifiable information. The audio recording feature is removed entirely so no child voice data is collected at all.

**Source PRD:** `COPPA_REFACTOR_PRD.md` (repo root)
**Research:** `.planning/research/SUMMARY.md`
**Defined:** 2026-07-21

---

## Owner Decisions (recorded 2026-07-21)

These were open questions all four researchers surfaced independently. They are settled and must not be re-litigated during planning:

| #    | Decision                                                                                                                                                                                                                                             | Consequence                                                                                                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | **Supersedes the counsel hold.** The earlier plan waited on whether teacher access counts as "disclosure to a third party." That question is set aside — removing recordings takes children's voice data off the table, which is what made it sharp. | Teacher access to _progress_ data continues.                                                                                                                                        |
| D-02 | **Teachers stay**, re-pointed at `child_profiles` via `teacher_student_connections`.                                                                                                                                                                 | No teacher feature is deleted.                                                                                                                                                      |
| D-03 | **Under-18 self-signup is blocked** (not just under-13).                                                                                                                                                                                             | One account-creation path, one data model. Also satisfies Google Play Families. Costs 13–17 self-signup, which COPPA does not require blocking.                                     |
| D-04 | **Existing accounts auto-migrate** to a parent owning one child profile.                                                                                                                                                                             | Preserves logins and the 3 active subscriptions. Requires a blocking re-consent screen where a child's own email owns the account.                                                  |
| D-05 | **Subscriptions become parent-scoped** (family-wide).                                                                                                                                                                                                | One subscription covers every child. Needs a webhook compatibility shim for the 3 existing subscriptions whose Lemon Squeezy metadata says `student_id` permanently.                |
| D-06 | **The 5 auth-less, teacher-created students stay teacher-owned** with no parent.                                                                                                                                                                     | Reuses the shipped placeholder-student pattern. `child_profiles.parent_id` must be nullable. No synthetic adult accounts are invented.                                              |
| D-07 | **Sibling profile switching is not gated** — avatar picker only.                                                                                                                                                                                     | Both children are already visible to the same parent `auth.uid()`, so it leaks nothing new. A gate on every switch would punish the shared-tablet case the feature exists to serve. |
| D-08 | **`teacher_feedback` is repurposed** onto practice progress rather than deleted.                                                                                                                                                                     | Keeps the teacher→student channel and the existing student badge alive, with no voice data involved.                                                                                |

**Anchor decision (from research, not a preference):** migrated `child_profiles.id` reuses the existing `students.id` UUID values. `students.id` never had an FK to `auth.users`, so all 30 downstream FK columns keep their values unchanged — only the target table and the RLS predicate change. This converts a 26-table _data_ migration into a 26-table _schema_ migration.

---

## v4.0 Requirements

### Identity Schema (IDENT)

- [ ] **IDENT-01**: A `parents` table exists whose PK is the `auth.users` id, mirroring the shape of the existing `teachers` table
- [ ] **IDENT-02**: A `child_profiles` table exists holding only nickname, preset avatar reference, and optional birth year — no email, phone, real name, photo, or location column
- [ ] **IDENT-03**: `child_profiles.parent_id` is nullable, so teacher-created profiles with no parent remain valid (D-06)
- [ ] **IDENT-04**: Every migrated child profile reuses its legacy `students.id` UUID, so no downstream FK value changes
- [ ] **IDENT-05**: All 30 identity-bearing FK columns across the 26 downstream tables resolve to `child_profiles`, verified against one authoritative `information_schema` checklist rather than table-by-table review

### Access Control (RLS)

- [ ] **RLS-01**: A single `SECURITY DEFINER STABLE` ownership helper function is the one source of truth for "does this parent own this child profile", designed and tested before any policy is rewritten
- [ ] **RLS-02**: Every policy that previously read `student_id = auth.uid()` authorizes by ownership instead, using a non-correlated `IN` subquery Postgres can cache as an initPlan
- [ ] **RLS-03**: Every rewritten INSERT and UPDATE policy declares `WITH CHECK` explicitly, verified by querying `pg_policies` across all 32 tables rather than by reading diffs
- [ ] **RLS-04**: No policy chain produces recursion (`42P17`) once teacher → connection → child profile → parent is in place
- [ ] **RLS-05**: Rewritten policies are measured against real row counts and show no per-row performance regression
- [ ] **RLS-06**: A child profile is unreachable by any authenticated user who does not own it, proven by an adversarial test rather than inspection

### Signup & Age Gate (SIGNUP)

- [ ] **SIGNUP-01**: A neutral, open-field date-of-birth entry gates account creation — not a knowledge question, which the FTC has rejected as an age gate
- [ ] **SIGNUP-02**: Users under 18 cannot create an account and are shown guidance to ask a parent or guardian
- [ ] **SIGNUP-03**: The age gate fronts _every_ signup entry point, including the OAuth button in `useSocialAuth.js`, not only the email/password form
- [ ] **SIGNUP-04**: Registration collects parent email, password or OAuth token, and optionally the parent's name — and never collects data about the child at this step
- [ ] **SIGNUP-05**: A direct link to the Privacy Policy is visible on the registration screen and in parent settings

### Child Profiles (PROFILE)

- [ ] **PROFILE-01**: A parent can create, rename, and delete child profiles from within their account
- [ ] **PROFILE-02**: Child avatars are selected from a preset system set; custom image upload is not possible
- [ ] **PROFILE-03**: The nickname field carries visible guidance not to use the child's full name
- [ ] **PROFILE-04**: A child can switch to another of the family's profiles without a gate or password (D-07)
- [ ] **PROFILE-05**: Switching profiles fully clears the previous child's cached data, proven by a multi-child device test
- [ ] **PROFILE-06**: Active-child state survives reload and is never trusted as an authorization signal

### Parent Rights & Gating (COPPA)

- [ ] **COPPA-01**: Account settings, subscription, billing, and child-profile management sit behind the parental gate
- [ ] **COPPA-02**: The parental gate cannot be bypassed by direct URL or back-button navigation, and does not stay open for the next person to pick up the device
- [ ] **COPPA-03**: A parent can review all data held about each of their children
- [ ] **COPPA-04**: A parent can export their children's data
- [ ] **COPPA-05**: A parent can delete a child's data
- [ ] **COPPA-06**: A parent can stop further collection for one child — deactivating that profile without deleting the family account (§312.6(a)(1), absent from the PRD)

### Recording Removal (RECORD)

- [ ] **RECORD-01**: Every object in the `practice-recordings` storage bucket is enumerated and deleted, before any code is removed
- [ ] **RECORD-02**: The deletion is audit-logged with object count, bytes, and affected profile ids, reusing the existing `account_deletion_log` pattern, as evidence of compliance
- [ ] **RECORD-03**: All recording UI is removed — capture, playback, the student sessions page, and the teacher review screen
- [ ] **RECORD-04**: All recording services and their now-orphaned dependencies are removed
- [ ] **RECORD-05**: Achievement progress does not regress when recording rows disappear (`achievementService.js:234` counts practice sessions with no `has_recording` filter)
- [ ] **RECORD-06**: Teacher feedback is repurposed onto practice progress so the teacher→student channel and the student badge keep working (D-08)
- [ ] **RECORD-07**: All recording-related translation keys are removed from both locales with no orphans and no over-deletion, enforced by a check rather than by review

### Live Migration (MIGRATE)

- [ ] **MIGRATE-01**: Each of the 15 existing auth accounts becomes a parent owning one child profile, preserving login
- [ ] **MIGRATE-02**: Accounts where a child's own email owns the account are flagged and shown a blocking re-consent screen at next login — not a dismissible banner
- [ ] **MIGRATE-03**: The 5 teacher-created, auth-less student rows survive as parent-less child profiles (D-06)
- [ ] **MIGRATE-04**: Subscriptions become parent-scoped and all 3 live subscriptions keep working, including when a real Lemon Squeezy webhook fires against legacy metadata (D-05)
- [ ] **MIGRATE-05**: The identity work is reversible until the final contract step, and the irreversible recording deletion deploys separately from it
- [ ] **MIGRATE-06**: No user is locked out at any point during the rollout

---

## Future Requirements (deferred, not this milestone)

- Per-child progress tile shown on the profile switcher
- Multi-child parent dashboard comparing siblings
- An email-plus confirmation step reinforcing parent verification beyond account creation
- Parent-set practice limits or schedules

## Out of Scope (explicit exclusions)

| Excluded                                                                                 | Reason                                                                                          |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Custom or uploaded child avatar photos                                                   | A photograph is the same PII category as the voice recordings this milestone exists to remove   |
| A child email or phone reused as a login credential                                      | Reintroduces exactly the identifying-credential coupling being removed                          |
| Per-child PIN or password                                                                | Children do not authenticate at all in this model                                               |
| Math-problem age gate at signup                                                          | FTC-rejected as an age gate; `ParentGateMath` stays correct for post-authentication gating only |
| A separate `parents` table duplicating email from `auth.users`                           | Drift the moment a parent changes email                                                         |
| Advertising-ID stripping, Firebase/PostHog/Mixpanel restricted-processing modes (PRD §5) | None exist in this stack — it is a PWA on Supabase, Umami, and Sentry. PRD §5 is boilerplate    |
| Native mobile wrappers / Play Store submission                                           | Not part of this milestone                                                                      |

---

## Traceability

_Filled by the roadmapper._
