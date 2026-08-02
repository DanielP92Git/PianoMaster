# Roadmap: PianoApp

## Milestones

- 🚧 **v4.0 Parent-First Account Architecture (COPPA)** — Phases 1-8 (in progress)
- ✅ **v1.0 Security Hardening** — Phases 1-4 (shipped 2026-02-01)
- ✅ **v1.1 Parental Consent Email Service** — Phase 5 (shipped 2026-02-02)
- ✅ **v1.2 Trail System Stabilization** — Phases 6-7 (shipped 2026-02-03)
- ✅ **v1.3 Trail System Redesign** — Phases 8-12 (shipped 2026-02-05)
- ✅ **v1.4 UI Polish & Celebrations** — Phases 13-18 (shipped 2026-02-09)
- ✅ **v1.5 Trail Page Visual Redesign** — Phases 19-22 (shipped 2026-02-12)
- ✅ **v1.6 Auto-Rotate Landscape for Games** — Phases 01-05 (shipped 2026-02-17)
- ✅ **v1.7 Mic Pitch Detection Overhaul** — Phases 06-10 (shipped 2026-03-04)
- ✅ **v1.8 App Monetization** — Phases 11-16 (shipped 2026-03-01)
- ✅ **v1.9 Engagement & Retention** — Phases 17-23 (shipped 2026-03-08)
- ✅ **v2.0 VictoryScreen & XP Unification** — Phases 01-02 (shipped 2026-03-08)
- ✅ **v2.1 Forgot Password Recovery** — Phase 01 (shipped 2026-03-10)
- ✅ **v2.2 Sharps & Flats** — Phases 01-05 (shipped 2026-03-17)
- ✅ **v2.3 Launch Readiness** — Phases 01-06 (shipped 2026-03-17)
- ✅ **v2.4 Content Expansion** — Phases 07-11 (shipped 2026-03-19)
- ✅ **v2.5 Launch Prep** — Phases 12-15 (shipped 2026-03-22)
- ✅ **v2.6 User Feedback** — Phases 16-17 (shipped 2026-03-23)
- ✅ **v2.7 Instrument Practice Tracking** — Phases 1-5 (shipped 2026-03-25)
- ✅ **v2.8 Introductory Single-Note Game** — Phases 1, 6 (shipped 2026-03-26)
- ✅ **v2.9 Game Variety & Ear Training** — Phases 7-11 (shipped 2026-03-30)
- ✅ **v3.0 Cleanup & Polish** — Phases 12-16 (shipped 2026-04-03)
- ✅ **v3.1 Trail-First Navigation** — Phases 17-19 (shipped 2026-04-05)
- ✅ **v3.2 Rhythm Trail Rework** — Phases 20-28 (shipped 2026-04-13)
- ✅ **v3.3 Rhythm Trail Fix & Polish** — Phases 29-33 (shipped 2026-05-04)
- ✅ **v3.4 Rhythm Games Responsive UX** — Phases 34-35 (shipped 2026-05-12)
- ✅ **v3.6 Game Screen UI Unification** — Phase 36 (shipped 2026-06-14)
- ✅ **v3.5 Rhythm Pedagogy** — Phase 1 (shipped 2026-06-29)
- ✅ **v3.7 Sight-Reading Engagement & Pedagogy** — Phases 01-03 (shipped 2026-07-18)

See `.planning/milestones/` for archived details of each milestone.

## Phases

### 🚧 v4.0 Parent-First Account Architecture (COPPA) (In Progress)

**Milestone Goal:** Every top-level account belongs to an adult — children become login-less profile
rows owned by a parent, carrying no personally identifiable information — and the audio recording
feature is removed entirely so no child voice data is collected at all.

**Phase Numbering:** Milestone-scoped, restarts at 1 (v3.7 ran phases 01-03, archived to
`.planning/milestones/v3.7-phases/`). Integer phases (1, 2, 3) are planned work; decimal phases
(1.1, 1.2) would be urgent insertions.

**Sequencing (non-negotiable, from research + owner decisions):**

- Identity work is expand/contract: additive schema (Phase 1) → dual RLS policies old+new (Phase 2)
  → new UI/billing/migration (Phases 3-6) → contract by dropping legacy policies only after verified
  zero traffic (Phase 8). Reversible with `DROP TABLE ... CASCADE` until Phase 8.
- RLS rewrite (Phase 2) is its own phase with its own verification gate — not folded into feature
  work. The ownership helper function (RLS-01) is designed and tested before any of the 62 policies
  are rewritten.
- Recording removal (Phase 7) is the ONLY irreversible step in the milestone. Sequenced last,
  deployed independently. Storage-bucket deletion + audit log (RECORD-01/02) come before any code
  removal (RECORD-03+).
- Subscription re-pointing (Phase 5, MIGRATE-04) is the highest-blast-radius item touching live
  paying customers — late, isolated, sandbox-tested before any of the 3 live subscriptions are
  touched.

- [x] **Phase 1: Identity Schema Expand** - Additive `parents`/`child_profiles` schema with UUID-reuse backfill, fully reversible, zero client-visible change — APPLIED + VERIFIED 2026-07-30 (verifier PASS)
- [ ] **Phase 2: RLS Rewrite — Ownership-Based Access Control** - All 62 policies across 32 tables rewritten to authorize by parent ownership via a tested `SECURITY DEFINER` helper, rolled out dual-policy, own security-review gate
- [ ] **Phase 3: Parent-Only Signup & Age Gate** - Neutral DOB gate blocks under-18 self-signup through every entry point including OAuth; registration collects only parent data
- [ ] **Phase 4: Child Profiles & Parental Gating** - Parent-managed child profile CRUD, ungated sibling switching, and a route-level parental gate covering settings/billing/profile management/data rights
- [ ] **Phase 5: Subscription Re-Pointing** - `parent_subscriptions` becomes family-wide, sandbox-verified against Lemon Squeezy before the 3 live subscriptions are touched
- [ ] **Phase 6: Live Migration & Re-Consent** - All 15 existing auth accounts cut over with zero lockouts; flagged self-registered-minor accounts get a blocking re-consent screen
- [ ] **Phase 7: Audio Recording Removal** - `practice-recordings` storage bucket enumerated, deleted, and audit-logged before any code is removed; all recording UI/services deleted; achievement/feedback/i18n couplings closed
- [ ] **Phase 8: Contract — Legacy Cleanup & Final Verification** - Legacy `student_id = auth.uid()` policies dropped only after verified zero traffic, closing the expand/contract cycle

#### Phase 1: Identity Schema Expand

**Goal**: The database has an additive, reversible foundation for parent-owned child identity — new tables and FK columns exist alongside the legacy schema with zero client-visible change.
**Depends on**: Nothing (first phase)
**Requirements**: IDENT-01, IDENT-02, IDENT-03, IDENT-04, IDENT-05
**Success Criteria** (what must be TRUE):

1. A `parents` table exists and can be queried, with the same PK shape (`auth.users` id) as the existing `teachers` table
2. A `child_profiles` table exists holding only nickname/avatar/birth_year — schema inspection confirms zero PII columns (no email, phone, real name, photo, location)
3. Every one of the 15 auth-having students has a `child_profiles` row whose `id` exactly matches its legacy `students.id`, and `parent_id` resolves correctly
4. The 5 teacher-created, auth-less student rows have valid `child_profiles` rows with `parent_id = NULL`
5. A single authoritative `pg_constraint` query confirms every child-scoped identity-bearing FK column has a dual `child_profiles` FK added (17 in-scope FKs: 16 swept + `parent_subscriptions` carve-out per D-06). Legacy `students(id)` FKs are RETAINED here (D-02) — the "zero unaccounted-for references to `students(id)`" contract is the removal half, owned by Phase 8. **[DEVIATION, owner-signed Plan 03: original "30 FKs / 26 tables / information_schema" estimate → live-verified 17 FKs via `pg_constraint`; `information_schema` returns `[]` under Supabase's non-owner role.]**
   **Plans**: 5 plans across 4 waves
   - [x] 01-01-PLAN.md — Wave 1: generate FK checklist + function inventory + confirm rehearsal env
   - [x] 01-02-PLAN.md — Wave 1: account-segmentation table + SQL assertion suite
   - [x] 01-03-PLAN.md — Wave 2: owner gates (FK scope sign-off + segmentation sign-off)
   - [x] 01-04-PLAN.md — Wave 3: atomic up-migration + committed down-migration
   - [x] 01-05-PLAN.md — Wave 4: no-branch dry-run → owner apply + IDENT-05 verify (12/12) + D-29 smoke test
         **Pitfalls to avoid**: Pitfall 2 (FK target drift — this exact bug class has already shipped 3 times in this codebase; repoint from one authoritative checklist, not memory/grep). Open Question 1 (owner for the 5 auth-less students) must be resolved before backfill completes — resolved by D-06 (`parent_id` nullable, stays teacher-owned).
         **UI hint**: no

#### Phase 2: RLS Rewrite — Ownership-Based Access Control

**Goal**: Every policy that gates a child's data authorizes by parent ownership, not raw auth identity — verified safe, non-recursive, and performant before anything else depends on it.
**Depends on**: Phase 1
**Requirements**: RLS-01, RLS-02, RLS-03, RLS-04, RLS-05, RLS-06
**Success Criteria** (what must be TRUE):

1. A single `SECURITY DEFINER STABLE` ownership helper function exists and is unit-tested in isolation before any of the 62 policies reference it
2. Every one of the 62 rewritten policies is added alongside (not replacing) its legacy policy — Postgres OR's them — verified via a direct `pg_policies` query across all 32 tables
3. A `pg_policies` audit confirms every rewritten UPDATE/INSERT policy has an explicit, correct `WITH CHECK` clause (not silently inherited from `USING`, not stale)
4. An adversarial test proves a parent's session returns zero rows for another family's child profile or child-scoped data — proof, not inspection
5. Supabase Advisors/logs show no `42P17` recursion errors, and `EXPLAIN ANALYZE` against real 20-student row counts shows no measurable regression versus the legacy policies
   **Plans**: 5 plans across 4 waves
   - [x] 02-01-PLAN.md — Wave 1: committed policy inventory (~24 tables/~39 policies) + SQL-assertion suite + 2nd-family seed
   - [x] 02-02-PLAN.md — Wave 1: owned_child_ids() helper + EXPLAIN ANALYZE inlining verdict (RLS-01 gate)
   - [x] 02-03-PLAN.md — Wave 2: the atomic additive dual-policy migration + down-migration (helper + ~39 siblings + edge cases + award_xp/check_rate_limit re-point)
   - [ ] 02-04-PLAN.md — Wave 3: [BLOCKING] rehearsal-branch apply + RLS-01..RLS-06 verification (adversarial + EXPLAIN + test:run)
   - [ ] 02-05-PLAN.md — Wave 4: /gsd-secure-phase 2 + owner-gated production apply + D-29 smoke test + Phase 8 handoff (autonomous:no)
         **Pitfalls to avoid**: Pitfall 1 (USING/WITH CHECK mismatch on UPDATE/INSERT), Pitfall 3 (recursive RLS via the parent→child_profiles→teacher chain), Pitfall 4 (ownership-subquery performance cliff — use the owner-first non-correlated `IN` pattern, never a correlated `EXISTS`).
         **Research flag**: Highest-stakes phase in the milestone. Needs a dedicated `/gsd-secure-phase` pass — this project already ran one for v3.7's much smaller `note_mastery` JSONB column change; this phase is 62 policies across 32 tables and must not be folded into feature work.
         **UI hint**: no

#### Phase 3: Parent-Only Signup & Age Gate

**Goal**: Nobody under 18 can create an account through any entry point, and every new account belongs to an adult.
**Depends on**: Phase 1 (new signups must route into the new schema)
**Requirements**: SIGNUP-01, SIGNUP-02, SIGNUP-03, SIGNUP-04, SIGNUP-05
**Success Criteria** (what must be TRUE):

1. A neutral, open-field date-of-birth entry fronts account creation — no knowledge-question age gate is reachable anywhere in the signup flow
2. A user who enters a birth date under 18 sees guidance to ask a parent/guardian and cannot proceed to create an account
3. The OAuth signup button in `useSocialAuth.js` is gated by the same age check as the email/password form — no unguarded path to account creation exists
4. Completing registration collects only parent email, password or OAuth token, and optionally the parent's name — zero child data is requested at this step
5. A direct link to the Privacy Policy is visible on the registration screen and in parent settings
   **Plans**: TBD
   **Pitfalls to avoid**: The OAuth-bypass gap — gate at the router/page level before any signup CTA renders, not just in front of form fields.
   **UI hint**: yes

#### Phase 4: Child Profiles & Parental Gating

**Goal**: A parent can manage their family's child profiles and switch between them with no friction, while every sensitive parent-only surface stays behind a gate that cannot be bypassed.
**Depends on**: Phase 1 (schema), Phase 2 (RLS) — profile CRUD writes must be correctly authorized from day one
**Requirements**: PROFILE-01, PROFILE-02, PROFILE-03, PROFILE-04, PROFILE-05, PROFILE-06, COPPA-01, COPPA-02, COPPA-03, COPPA-04, COPPA-05, COPPA-06
**Success Criteria** (what must be TRUE):

1. A parent can create, rename, and delete a child profile, choosing only from a preset avatar set, with visible guidance against using the child's full name
2. A child can switch to a sibling's profile with a single tap and no gate or password, and the active child survives a page reload without ever being trusted as an authorization signal
3. Switching profiles clears all of the previous child's cached data — proven by a multi-child device test showing zero stale or cross-child data
4. Direct URL navigation and browser back/forward cannot reach Account Settings, Subscription, Billing, or Child Profile CRUD without passing the parental gate, and gate-passed state does not stay open for the next person who picks up the device
5. A parent can review all data held about each child, export it, delete it, and deactivate one child's profile (stopping further collection) without deleting the rest of the family account
   **Plans**: TBD
   **Pitfalls to avoid**: Pitfall 11 (route-only gate bypass via direct URL/back-button — needs a mount-checked wrapper, not a one-time click-through), Pitfall 12 (sibling data bleed from stale React Query cache — needs explicit cache invalidation or full remount on switch).
   **Research flag**: Open Question 3 (should switching _away_ from a child require the gate too, so a sibling can't reassign another's session?) needs an explicit decision during phase discussion — LOW confidence either way per research, do not assume an answer.
   **UI hint**: yes

#### Phase 5: Subscription Re-Pointing

**Goal**: Subscriptions gate the whole family, not one child, and every live paying customer keeps working through the change.
**Depends on**: Phase 1, Phase 2
**Requirements**: MIGRATE-04
**Success Criteria** (what must be TRUE):

1. `parent_subscriptions` carries a `parent_id` column and is gated by RLS on plain `parent_id = auth.uid()` equality — no child-profile indirection in the billing hot path
2. All 3 live subscriptions resolve to the correct owning parent after backfill, verified individually against each real customer, not by row count alone
3. A Lemon Squeezy sandbox webhook replaying legacy `student_id`-shaped `custom_data` is correctly resolved to the right parent via the compatibility shim, without any Lemon Squeezy-side changes
4. `cancel-subscription` and `create-checkout` Edge Functions operate on `parent_id` end-to-end against sandbox before any live subscription is touched
   **Plans**: TBD
   **Pitfalls to avoid**: Pitfall 13 (billing ownership mismatch — a broken webhook silently failing to renew access on a real paying customer is a support/refund incident, not just a bug).
   **Research flag**: Needs the parent-scoped-vs-child-scoped decision recorded before implementation (already decided as parent-scoped per owner decision D-05) and dedicated Lemon Squeezy sandbox verification before any of the 3 live subscriptions are touched.
   **UI hint**: no

#### Phase 6: Live Migration & Re-Consent

**Goal**: Every existing user keeps their login and their data after cutover, and nobody's account silently becomes something they didn't agree to.
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4, Phase 5 (billing must already be re-pointed before cutover completes)
**Requirements**: MIGRATE-01, MIGRATE-02, MIGRATE-03, MIGRATE-06
**Success Criteria** (what must be TRUE):

1. Each of the 15 existing auth accounts logs in successfully post-migration and sees its own non-empty progress/dashboard data — checked individually, not by aggregate row count
2. Accounts where a child's own email currently owns the account see a blocking, non-dismissible re-consent screen at next login rather than a silent conversion
3. The 5 teacher-created, auth-less student rows survive as parent-less child profiles, still reachable by their connected teacher
4. No user reports or exhibits a lockout at any point during the rollout
   **Plans**: TBD
   **Pitfalls to avoid**: Pitfall 5 (silent lockout from stale `user.id === studentId` checks — this codebase's own `SEC-03` hardening is now a landmine under the new model unless every one of the 47 auth-id resolution call sites is updated), Pitfall 6 (silent child→parent reparenting without consent — the single highest legal-risk item in the whole migration; produces no functional bugs, only caught by explicit design review).
   **Research flag**: Open Question 1's resolution (5 auth-less students, D-06) and the account-segmentation query (which of the 15 accounts are self-registered minors vs. already-adult) must be finalized before this phase's migration script is written, not defaulted in code.
   **UI hint**: yes (re-consent screen)

#### Phase 7: Audio Recording Removal

**Goal**: No child voice data exists anywhere in the system — storage, database, or UI — and nothing that depended on recordings quietly breaks.
**Depends on**: Phase 1 through 6 (deployed as a fully independent deploy from the identity work, but sequenced last because it is irreversible)
**Requirements**: RECORD-01, RECORD-02, RECORD-03, RECORD-04, RECORD-05, RECORD-06, RECORD-07
**Success Criteria** (what must be TRUE):

1. The `practice-recordings` Storage bucket is confirmed empty (object count zero) via the Supabase dashboard/MCP before any code is deleted
2. An audit log entry records the deletion (object count, bytes, affected profile ids), reusing the existing `account_deletion_log` pattern, as evidence of compliance
3. No recording capture, playback, sessions page, or teacher review UI remains reachable anywhere in the app, and all recording services and their now-orphaned dependencies are gone
4. A real student's achievement progress bar is unchanged before and after the deletion, verified against a real account rather than assumed
5. The teacher→student feedback badge still works, now driven by practice progress instead of recordings
6. A key-set diff between `en.json` and `he.json` shows no orphaned or missing recording-related keys, and a repo-wide search confirms zero remaining `t()` references to deleted keys
   **Plans**: TBD
   **Pitfalls to avoid**: Pitfall 7 (storage deletion ≠ code deletion — the bucket exists only in the remote project, invisible to local dev), Pitfall 8 (no audit trail for the deletion), Pitfall 9 (achievement regression from `achievementService.js`'s missing `has_recording` filter), Pitfall 10 (`teacher_feedback` dead badge — D-08 repurposes it, doesn't delete it), Pitfall 14 (silent i18n over/under-deletion — no automated parity guard exists today).
   **Research flag**: Needs its own storage-inventory step (enumerate via Supabase MCP) before planning is finalized — the bucket's actual size/scope is currently unmeasured. This is the ONLY irreversible step in the entire milestone; deploy independently from all identity work, gated behind explicit owner confirmation before running, matching this project's precedent for irreversible operations (`note_mastery` column apply, v3.5 production migration).
   **UI hint**: yes (removing UI)

#### Phase 8: Contract — Legacy Cleanup & Final Verification

**Goal**: The migration reaches its irreversible-safe final state — legacy identity policies are provably unused and removed, closing the expand/contract cycle cleanly and confirming the recording deletion shipped as a truly separate deploy.
**Depends on**: Phase 6 (all users migrated), Phase 7 (recording removal already shipped independently)
**Requirements**: MIGRATE-05
**Success Criteria** (what must be TRUE):

1. Supabase Advisors/logs show zero traffic against the legacy `student_id = auth.uid()` policies before they are dropped
2. Legacy RLS policies are dropped in their own migration, verifiably separate in the git/deploy history from the recording-deletion deploy
3. The 47 service call sites / 151 `user?.id` references that assumed `auth.uid() === studentId` are audited, and none incorrectly remain
4. The `students` table's identity semantics are formally retired (kept only if non-identity data still lives there), documented as the closing step of the expand/contract migration
   **Plans**: TBD
   **Pitfalls to avoid**: Anti-Pattern 3 (bundling the reversible identity work with the irreversible recording deletion) — this phase's own existence and its dependency on Phase 7 already having shipped independently is the proof they were kept separate.
   **UI hint**: no

<details>
<summary>✅ v3.7 Sight-Reading Engagement & Pedagogy (Phases 01-03) — SHIPPED 2026-07-18</summary>

- [x] Phase 01: Engagement HUD Parity (2/2 plans) — completed 2026-07-09
- [x] Phase 02: Practice Tooling (9/9 plans) — completed 2026-07-10
- [x] Phase 03: Adaptive Pedagogy (7/7 plans) — completed 2026-07-12

Turned the hardened sight-reading game (Phases A/B/C shipped on `main` as PRs #10/#11/#12) into an
elite learning experience: session-wide combo/on-fire HUD parity, practice tooling (replay,
Practice/Test grading mode, Review-mistakes drill), and adaptive per-note-mastery pedagogy
(in-session difficulty/tempo + cross-session `note_mastery` JSONB persistence under RLS). 10/12
requirements shipped; HUD-02 (lives/game-over) and PRAC-02 (comparison playback — built + device-
verified, hidden as too busy for 8-year-olds) deferred. Audit PASSED; secure-phase 03 closed 12/12
threats. Ships via PR #13.

Full details: `.planning/milestones/v3.7-ROADMAP.md` · Requirements: `.planning/milestones/v3.7-REQUIREMENTS.md` · Audit: `.planning/milestones/v3.7-MILESTONE-AUDIT.md`

</details>

<details>
<summary>v1.0 through v3.3 -- See milestones/ for archived details</summary>

See individual milestone archives in `.planning/milestones/` for full phase breakdowns.

</details>

<details>
<summary>✅ v3.4 Rhythm Games Responsive UX (Phases 34-35) -- SHIPPED 2026-05-12</summary>

- [x] Phase 34: Responsive Rhythm Renderers (Non-Arcade) (10/10 plans) -- completed 2026-05-10
- [x] Phase 35: ArcadeRhythmGame Portrait (4/4 plans) -- completed 2026-05-11

</details>

<details>
<summary>✅ v3.5 Rhythm Pedagogy (Phase 01) — SHIPPED 2026-06-29</summary>

- [x] Phase 01: Rhythm Trail Pedagogical Restructure (10/10 plans across 4 waves) — completed 2026-06-29

Rebuilt the 29-node rhythm trail into a pedagogically coherent 10-unit / 55-node order anchored by
three falsifiable principles — Pulse-first, Rests-woven, Concept-per-unit — encoded as
`scripts/validateTrail.mjs` lint rules (build-time enforcement). Added 12 Duolingo-style
intro/scaffolding card blocks (EN+HE) paginated by `DiscoveryIntroQuestion.jsx`. Atomic Supabase
migration wiped rhythm progress while preserving `total_xp` (applied to production 2026-06-28).
Hidden Syncopation renamed `rhythm_8_*` → `rhythm_synco_*` to free the namespace for the new 3/4
Meter unit. All 7 requirements satisfied; owner gates D-13 (migration) + SC-9 (device UAT) closed;
milestone audit PASSED.

Full details: `.planning/milestones/v3.5-ROADMAP.md` · Requirements: `.planning/milestones/v3.5-REQUIREMENTS.md` · Audit: `.planning/milestones/v3.5-MILESTONE-AUDIT.md`

</details>

<details>
<summary>✅ v3.6 Game Screen UI Unification (Phase 36) — SHIPPED 2026-06-14</summary>

- [x] Phase 36: Game Screen UI Unification (11/11 plans across 7 waves) — completed 2026-06-14

Extracted NotesRecognition's inline HUD/shell into reusable shared components
(`src/components/games/shared/hud/`: ProgressBar, ScorePill, LivesDisplay, ComboPill,
OnFireBadge, OnFireSplash, SpeedBonusFlash, TierUpPopup, TimerDisplay, GameActionButton,
StreakBrightnessOverlay) and adopted them across the other game screens (subset-per-mechanics).
De-duplicated ArcadeRhythmGame's inline lives/combo/on-fire and unified MixedLessonGame's
progress bar. Owner walkthrough of all 10 game screens APPROVED. HUD presentation only — no
game-mechanics changes.

Full details: `.planning/milestones/v3.6-ROADMAP.md` · Requirements: `.planning/milestones/v3.6-REQUIREMENTS.md`

</details>

## Progress

**Total: 28 milestones shipped, 114 phases, ~291 plans | v4.0 in progress (8 phases planned, 0 started)**

| Phase                                             | Milestone | Plans Complete | Status      | Completed |
| ------------------------------------------------- | --------- | -------------- | ----------- | --------- |
| 1. Identity Schema Expand                         | v4.0      | 0/TBD          | Not started | -         |
| 2. RLS Rewrite — Ownership-Based Access Control   | v4.0      | 0/5            | Not started | -         |
| 3. Parent-Only Signup & Age Gate                  | v4.0      | 0/TBD          | Not started | -         |
| 4. Child Profiles & Parental Gating               | v4.0      | 0/TBD          | Not started | -         |
| 5. Subscription Re-Pointing                       | v4.0      | 0/TBD          | Not started | -         |
| 6. Live Migration & Re-Consent                    | v4.0      | 0/TBD          | Not started | -         |
| 7. Audio Recording Removal                        | v4.0      | 0/TBD          | Not started | -         |
| 8. Contract — Legacy Cleanup & Final Verification | v4.0      | 0/TBD          | Not started | -         |

---

_Last updated: 2026-07-21 -- v4.0 Parent-First Account Architecture (COPPA) roadmap created (8 phases, 41/41 requirements mapped). Next: `/gsd-plan-phase 1`._
