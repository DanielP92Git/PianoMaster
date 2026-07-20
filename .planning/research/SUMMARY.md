# Project Research Summary

**Project:** PianoApp2 — v4.0 Parent-First Account Architecture (COPPA)
**Domain:** Live-data identity migration (Supabase/Postgres RLS + React SPA) for a children's edtech PWA, plus full removal of a storage-backed audio feature
**Researched:** 2026-07-21
**Confidence:** HIGH on stack/architecture/pitfalls (grounded in this repo's own migrations and measured surface area); MEDIUM-HIGH on features (COPPA statute verified, competitor UX from secondary sources)

---

## OPEN QUESTIONS — need an owner decision before planning can proceed

These block phase planning. Do not let implementation default-answer them.

1. **Who owns the 5 auth-less, teacher-created student rows?** 15 of the 20 existing students have an `auth.users` row and can become `parents.id` directly (UUID reuse). The remaining **5 have no auth account at all** — a `parents` row requires a backing `auth.users` entry, so there is no natural adult owner today. PRD does not address this. Two options on the table (from ARCHITECTURE.md): (a) leave `child_profiles.parent_id = NULL` until a parent later "claims" the row (needs nullable FK + claim flow; child is inert/inaccessible under strict RLS until claimed), or (b) temporarily attribute to the connected teacher's auth id as a placeholder owner with a forced re-consent/claim prompt. **Needs sign-off before Phase 1's backfill can complete.**

2. **Does `parent_subscriptions` become parent-scoped or stay child-scoped?** Currently `student_id = auth.uid()` — subscriber and gated identity are the same row. Once identity splits, the model must be chosen explicitly: (a) `parent_id`-scoped = family-wide access, all current/future children of that parent gated identically, or (b) `child_profile_id`-scoped = per-child paywall requiring re-purchase per sibling. STACK.md, ARCHITECTURE.md (Q4), and PITFALLS.md (Pitfall 13) all independently flag this as undecided. Given siblings likely share one household subscription, **`parent_id`-scoped is the strong default recommendation** — but must be a recorded decision, not an inferred one, before the billing re-pointing sub-phase starts. This affects 3 live paying customers.

3. **Does sibling profile-switching sit behind the parental gate?** ARCHITECTURE.md's own conclusion: switching _into_ a different one of a parent's own children is not a cross-tenant leak (RLS already grants the parent's `auth.uid()` access to all their children) and should be a low-friction picker, NOT gated. But it explicitly flags an unresolved sub-question: should switching _away_ from a child mid-session require the gate (so Kid A can't casually reassign Kid B's practice session to themselves)? PRD doesn't specify. **LOW confidence either way — surface as an explicit decision point in the profile-switcher phase, not an assumption.**

4. **Is `teacher_feedback` removed or repurposed?** It's written exclusively by `RecordingsReview` (the screen being deleted) but read by `useStudentFeedbackNotifications.js` (student-facing "you have feedback" badge). Deleting the writer without deciding the reader's fate ships a dead, silently-broken badge (Pitfall 10). Decide explicitly: remove both sides together, or preserve the table as a hook point for a future non-recording teacher-feedback mechanism.

**Minor but also unresolved:** whether "gate re-entry after gate-pass" needs a short-lived timeout (Pitfall 11 — first child to pass the gate should not leave it open for the next sibling who picks up the device).

---

## Executive Summary

This milestone converts the "authenticated user **is** the student" identity model into "an adult owns N login-less child profile rows," while separately deleting an audio-recording feature that stores children's voices with zero migration representation. Both problems are large in surface area (30 FK columns / 26 tables / 62 of 80 RLS policies / 32 tables / 47 service call sites) but **structurally low-risk if one architectural decision is made correctly**: giving every migrated `child_profiles.id` the _same UUID value_ as the existing `students.id`. Because `students.id` already has no FK constraint to `auth.users` (deliberately dropped in a prior migration for exactly this "login-less owned row" pattern, now proven in production for teacher-owned students), reusing that UUID space converts what looks like a 26-table **data** migration into a 26-table **schema + RLS** migration — no `UPDATE` sweep across student-generated content is ever required. This single decision is the biggest risk reducer in the whole milestone and should anchor the phase plan.

The recommended approach adds zero new npm dependencies: reuse `auth.users` as the parent identity (no redundant `parents` table duplicating email), add a `child_profiles` table shaped exactly like the existing `teachers`/`students` fan-out pattern, rewrite RLS with an **owner-first, non-correlated `IN` subquery** (`child_profile_id IN (SELECT id FROM child_profiles WHERE parent_id = (SELECT auth.uid()))`) wrapped in a `SECURITY DEFINER STABLE` helper function (`owns_child_profile()` / `is_owner_of_child()` — STACK.md and PITFALLS.md arrived at this independently, from two different angles: performance and recursion-avoidance), and add a new `ActiveChildContext` matching this app's existing Context conventions for "which child is active" as pure UX state, never a security boundary. Sequencing follows an additive expand/contract strategy: schema first, RLS dual-policy rollout table-cluster by table-cluster, then new signup/profile UI, then billing re-pointing, then the (separately deployed, irreversible) recording deletion last.

The key risks are: (1) a partial FK/RLS repoint leaving some tables silently unreachable — this exact bug class has already shipped once in this codebase and been fixed three times; (2) treating "delete the recording feature" as a code-only exercise when the `practice-recordings` storage bucket (holding actual children's voice data, the entire reason this milestone exists) has no migration representation and must be enumerated, bulk-deleted, and audit-logged _before_ any code deletion, not after; (3) COPPA's §312.6 "refuse further collection" duty — the ability to deactivate one child profile without deleting the whole family account — is a legal requirement entirely absent from the current PRD and must be added as a first-class P1 feature; and (4) an age gate that only fronts the email/password form while the OAuth signup button (`useSocialAuth.js`) remains reachable unguarded, which defeats the entire age-gate purpose for any user who signs up with Google.

---

## Key Findings

### Recommended Stack

No new libraries. `@supabase/supabase-js` stays pinned in the 2.x line (bump to `^2.110.0` only as routine maintenance, never adopt the `3.0.0-next.*` prerelease mid-migration). The entire feature is Postgres schema + RLS + a React Context, using patterns this codebase already runs in production.

**Core technologies:**

- `@supabase/supabase-js` (existing) — parent auth session + Postgres client — zero new library needed
- Postgres `SECURITY DEFINER STABLE` helper function (`owns_child_profile(p_child_id)` / `is_owner_of_child()`) — single source of truth for ownership, called by every rewritten policy instead of inlining the subquery 62 times — matches this repo's existing `is_free_node()`/`has_active_subscription()` convention. **Design this function before writing any of the 62 policy rewrites** — STACK.md and PITFALLS.md reached this same conclusion independently (performance-caching angle and recursion-avoidance angle respectively).
- React Context (`ActiveChildContext`, new) — "active child profile" client state — matches `SubscriptionContext`/`SessionTimeoutContext`/`AccessibilityContext` already in `src/contexts/`; explicitly NOT a Redux concern (CLAUDE.md scopes Redux to rhythm only) and explicitly NOT embedded in the JWT/Custom Access Token Hook (token claims are for slow-changing state; "active child" changes on every UI tap)

**What NOT to use (all independently flagged as anti-patterns):** Supabase Anonymous Auth per child (device-bound sessions, wrong shape entirely); a separate `parents` table duplicating `email`/`id` from `auth.users` (drift risk the moment a parent changes email); `user_metadata`/`raw_user_meta_data` as the authority for "is this a parent" (this project's own SEC-01 already establishes RLS must use database state, not client-editable metadata); an ORM (nothing here needs one, brownfield app with 62 live policies is the wrong place to introduce a second schema source of truth).

### Expected Features

**Must have (P1 — legal duty or structurally required):**

- Neutral, open-field DOB/year age gate blocking under-18 self-signup — must gate **every** signup entry point including the OAuth button (`useSocialAuth.js`), not just the email/password form. FTC has explicitly rejected math-problem-only age gates as insufficient — `ParentGateMath` is the wrong tool for this specific job (it's correct for gating settings/billing post-authentication, wrong for age-screening at signup).
- Parent registration (re-point of existing Supabase auth, not new infra) + `child_profiles` schema (nickname/avatar/optional birth year only, zero PII columns)
- Child profile CRUD + profile switcher (no login/PIN to switch among a family's own children)
- Parental gate (reuse existing `ParentGateMath`) widened to front Account Settings, Subscription, Billing, and Child Profile CRUD
- Data review/export and data deletion re-pointed to `child_profile_id` — both already shipped (`COPPA-01`/`COPPA-02` + 30-day-grace hard-delete cron), this is a re-point not a rebuild
- **"Refuse further collection" action (COPPA §312.6(a)(1))** — deactivate/pause one child profile independent of full parent-account deletion. **This is a legal duty that FEATURES.md found is entirely absent from the current PRD.** Must be explicitly designed, not assumed to be covered by full-account deletion.
- Migration path for the 20 existing students + re-consent interstitial for accounts where a child's own email currently owns the account

**Should have (P2, next milestone):** per-child progress tile at the profile switcher, multi-child parent dashboard, email-plus confirmation step reinforcing parent verification.

**Anti-features to actively reject:** custom/uploaded child avatar photos (photograph = PII, the exact risk category this milestone exists to eliminate), child email/phone reused as login credential (Prodigy's anti-pattern — re-introduces the coupling this milestone removes), math-problem-only age gate (FTC-rejected as sole gate), per-child PIN/password, third-party analytics tied to `child_profile_id` (moot — only Supabase/Umami/Sentry exist here, no Firebase/PostHog/Mixpanel as the PRD's boilerplate §5 assumes).

### Architecture Approach

**The single highest-leverage decision: UUID reuse.** `child_profiles.id` takes over the exact same UUID values as the legacy `students.id` for every migrated row, because `students.id` already has no FK to `auth.users` (deliberately dropped). This means all 30 FK columns across 26 downstream tables keep their existing values unchanged — only the target table and RLS predicate change. This converts what reads as a 26-table data migration into a 26-table **schema + RLS** migration, with correspondingly simpler rollback (Phases 1-2 are pure additive DDL; `DROP TABLE parents, child_profiles CASCADE` undoes them cleanly with zero data loss).

**Major components:**

1. `parents` — thin identity, PK = `auth.uid()`, structurally identical to the existing `teachers` table (copy that pattern, don't invent one)
2. `child_profiles` — nickname/avatar/birth_year only, `parent_id` FK, `id` reuses legacy `students.id` for migrated rows
3. `owns_child_profile()` / `is_owner_of_child()` — `SECURITY DEFINER STABLE` helper, single ownership source of truth for all 62 rewritten policies
4. `ActiveChildContext` + `useActiveChild()` — new, separate from `useUser()` (which keeps resolving the parent's auth session unchanged) — UX convenience only, never trusted as an authorization signal
5. `RequireActiveChild` route guard + widened `ParentGateMath` coverage — analogous to existing `ProtectedRoute`

**RLS rewrite shape:** owner-first, non-correlated `IN` subquery (`child_profile_id IN (SELECT id FROM child_profiles WHERE parent_id = (SELECT auth.uid()))`), never a correlated `EXISTS` referencing the outer row — the former can be cached as a Postgres initPlan (run once, reused per row), the latter is re-evaluated per row and is the exact anti-pattern this codebase already fixed once for bare `auth.uid()` calls (`20260127000003_optimize_rls_auth_plan.sql`). Sequencing: expand (additive schema) → dual-policy RLS rollout, cluster by cluster, lowest-risk (trail/progress) to highest-risk (billing) → new signup/gate UI → active-child client model → subscription re-pointing → re-consent flow → **audio recording removal, sequenced last and deployed independently** → contract (drop legacy policies).

### Critical Pitfalls

1. **RLS `USING`/`WITH CHECK` mismatch on UPDATE/INSERT** — Postgres silently reuses `USING` for `WITH CHECK` if not written explicitly; with 62 policies being rewritten, at least one is likely to be missed under time pressure, turning "update your own child's data" into "update your own child's data, but repoint it to anyone's `child_profile_id`." Verify via a direct `pg_policies` query across all 32 tables, not visual diff review.
2. **FK target drift** — this exact bug class has already shipped in this codebase three times (`assignment_submissions`/`notifications` pointed at `auth.users` instead of `students`, fixed retroactively across 3 migrations). With 26 tables this time instead of 3-4, repoint FKs from one authoritative `information_schema` checklist, in one tightly-sequenced pass, not spread across the milestone.
3. **Recursive RLS policy errors** — if `child_profiles`' own SELECT policy is naive and other tables reference it via subquery, expect `42P17: infinite recursion detected in policy`, especially once the teacher→connection→child_profiles→parent chain is added. The `SECURITY DEFINER` helper function sidesteps this by design — this is the same conclusion STACK.md reached from the performance angle.
4. **Deleting recording code does not delete recording storage.** The `practice-recordings` bucket exists **only in the remote Supabase project** — no migration creates it, so it's invisible in local dev and easy to never see. The only code paths that ever touch it are inside `deleteRecording()`/`deleteAllRecordings()`. If the deletion phase drops code/tables without first enumerating and bulk-deleting every object in the bucket, children's voice recordings — the exact data category this milestone exists to eliminate — remain in storage indefinitely, orphaned and unmanageable through any remaining UI. **Sequence storage cleanup first, with an audit-log entry recording object count/bytes/affected ids** (reuse the existing `account_deletion_log` pattern), not as an afterthought to code deletion.
5. **Silent child→parent reparenting without consent** — some of the 15 existing auth accounts belong to children who self-registered pre-refactor. Auto-migrating them into "owns a parent account with billing/settings access" without an explicit adult attestation defeats the entire purpose of the milestone and is itself a COPPA risk. Must be a blocking first-login re-consent screen for flagged accounts, not a dismissible banner — and this pitfall produces **no functional bugs or test failures**, only a compliance gap caught by design review, not QA.

---

## Implications for Roadmap

Based on combined research (architecture's Q3 sequencing + pitfalls' phase mapping + features' P1 list), suggested phase structure:

### Phase 1: Schema Expand (parents, child_profiles, additive FK columns)

**Rationale:** Everything downstream depends on this existing first; it's purely additive DDL (new tables, nullable new columns alongside existing ones), fully reversible with `DROP TABLE ... CASCADE`, zero client-visible change.
**Delivers:** `parents` table (mirrors `teachers` shape), `child_profiles` table with UUID-reuse backfill for the 15 auth-having students, nullable `child_profile_id` columns added alongside existing FK columns on the 26 downstream tables.
**Must resolve first:** Open Question 1 (the 5 auth-less students) — this blocks the backfill from completing cleanly.
**Avoids:** Pitfall 2 (FK target drift) by using one authoritative `information_schema` checklist before writing any migration.

### Phase 2: RLS Rewrite (dual-policy rollout, table cluster by table cluster)

**Rationale:** The largest, highest-risk surface (62 of 80 policies across 32 tables) — must be its own phase with its own verification gate, not folded into feature work.
**Delivers:** `owns_child_profile()`/`is_owner_of_child()` `SECURITY DEFINER STABLE` helper designed and tested first; new owner-first `IN`-subquery policies added alongside (not replacing) existing `student_id = auth.uid()` policies, rolled out cluster-by-cluster (trail/progress first, teacher-facing next, billing last as its own sub-phase).
**Avoids:** Pitfalls 1, 3, 4 (USING/WITH CHECK mismatch, recursive policies, performance cliff) — each needs its own explicit verification step (`pg_policies` query, Advisors check, `EXPLAIN ANALYZE` against real 20-student row counts) before the phase is marked done.
**Research flag:** Needs deeper research/verification during planning — this is the highest-stakes phase in the milestone.

### Phase 3: Parent-Only Signup + Age Gate + Child Profile CRUD

**Rationale:** Purely additive new code path; can be built and tested in parallel with Phases 1-2 but not routed live until Phase 1's schema exists.
**Delivers:** Neutral open-field DOB age gate in front of **every** signup entry point (email/password form AND the OAuth button in `useSocialAuth.js`), parent registration, child profile create/edit/delete with nickname + preset avatar + optional birth year only.
**Avoids:** the OAuth-bypass gap STACK.md flagged — gate at the router/page level before any signup CTA renders, not just in front of form fields.

### Phase 4: Active-Child Client Model + Profile Switcher + Widened Parental Gate

**Rationale:** Sequenced after the backend is already correct (Phase 1-2), so this can ship and be device-tested independently without backend risk. Because of UUID reuse, existing single-child households never notice this land.
**Delivers:** `ActiveChildContext`/`useActiveChild()` (separate from `useUser()`), `ChildProfileSwitcher` UI (deliberately not gated — see Open Question 3), `RequireActiveChild` route guard, `ParentGateMath` coverage widened to Account Settings/Subscription/Billing/Child Profile CRUD, and the **"refuse further collection" (deactivate one child) action — a legal duty currently missing from the PRD.**
**Must resolve first:** Open Question 3 (gate on switch-away?).
**Avoids:** Pitfall 11 (route-only gate bypassable via direct URL/back-button — needs a mount-checked wrapper, not a one-time click-through), Pitfall 12 (sibling data bleed from stale React Query cache — needs explicit cache invalidation or full remount on switch, plus a multi-child device test as an acceptance criterion).

### Phase 5: Subscription/Billing Re-Pointing

**Rationale:** Isolated as its own sub-sequence given 3 live paying customers and zero Lemon Squeezy-side action required (LS has no awareness of our internal id scheme — this is a database-only operation).
**Delivers:** `parent_subscriptions.parent_id` column + backfill (trivial due to UUID reuse), dual RLS policy, `cancel-subscription`/`create-checkout` Edge Function updates, and a compatibility shim in `upsertSubscription.ts` for the 3 legacy webhooks that will permanently carry `student_id` in LS-side `custom_data`.
**Must resolve first:** Open Question 2 (parent-scoped vs. child-scoped billing) — this is a design decision, not an implementation detail, and must be made before this phase starts.
**Avoids:** Pitfall 13 — test against LS sandbox before touching the 3 live subscriptions; a broken webhook silently failing to renew access on a real paying customer is a support/refund incident.

### Phase 6: Re-Consent Flow + Legacy Account Resolution

**Rationale:** Closes the two identity-integrity gaps that can't be resolved by schema alone.
**Delivers:** Blocking (not dismissible) first-login re-consent screen for accounts where a child's own email currently owns the account; resolution of the Open Question 1 placeholder-owner decision for the 5 auth-less students.
**Avoids:** Pitfall 6 (silent child→parent reparenting) — the single highest legal-risk item in the whole migration; produces no functional bugs, only caught by explicit design review.

### Phase 7: Audio Recording Removal (storage cleanup first, then code)

**Rationale:** Fully independent of the identity work (disjoint tables), and the _only_ irreversible step in the entire milestone — sequenced last, deployed separately, gated behind explicit owner confirmation, exactly like this project's precedent for irreversible operations (`note_mastery` column apply, v3.5 production migration).
**Delivers, in this order:** (1) enumerate + bulk-delete every object in `practice-recordings` bucket, with an audit log entry (count/bytes/affected ids) reusing the existing `account_deletion_log` pattern; (2) delete the bucket + its policies; (3) null `recording_url`/audio columns rather than dropping `practice_sessions` rows (preserves achievement/streak history — fixes the `achievementService.js` missing `has_recording` filter in the same pass); (4) resolve Open Question 4 (`teacher_feedback` remove vs. repurpose) and act on it; (5) bulk i18n key deletion (~70 keys × 2 locales) with an EN/HE key-set diff verification, not manual spot-check.
**Avoids:** Pitfalls 7, 8, 9, 10, 14 — all five are "looks done but isn't" traps specific to this phase; each needs its own explicit verification step, not a happy-path demo.

### Phase 8: Contract — Cleanup

**Rationale:** Only after verified zero traffic on legacy policies (via Advisors/logs).
**Delivers:** Drop old `student_id = auth.uid()` policies, retire `students` table identity semantics (keep if other non-identity data lives there), clean up the 47 service call sites / 151 `user?.id` references that assumed `auth.uid() === studentId`.

### Phase Ordering Rationale

- Schema before RLS before UI before billing before the irreversible deletion — each phase's rollback gets progressively harder, so risk is front-loaded into the cheapest-to-revert phases.
- The RLS rewrite (Phase 2) is deliberately its own phase, not folded into feature phases, because it is the largest blast-radius change (62 policies, 32 tables) and the design decision (`SECURITY DEFINER` helper function) must happen once, correctly, before being copied 62 times.
- Audio recording removal is isolated to its own late phase specifically because it is irreversible and touches disjoint tables from the identity work — bundling them risks entangling a reversible rollback with a step that already permanently deleted data.
- Billing re-pointing sits after the client-facing profile work because it needs the parent-vs-child-scoping decision (Open Question 2) settled first, and because it's lower risk to sequence after the core identity model is already verified correct.

### Research Flags

Phases likely needing deeper research/design-time attention during planning:

- **Phase 2 (RLS Rewrite):** Highest-stakes phase — needs a dedicated design pass for the `SECURITY DEFINER` helper function and per-cluster Advisors verification before proceeding.
- **Phase 5 (Billing Re-Pointing):** Needs LS sandbox verification against real webhook payloads before touching the 3 live subscriptions; the parent-vs-child-scoping decision (Open Question 2) should be resolved via `/gsd-discuss-phase` before implementation starts.
- **Phase 7 (Recording Removal):** Needs its own storage-inventory step (enumerate via Supabase MCP) before any planning is finalized, since the bucket has zero migration representation and its actual current size/scope is currently unmeasured.

Phases with standard, already-proven patterns (can move faster through planning):

- **Phase 1 (Schema Expand):** Directly copies the existing `teachers` table shape and the already-proven login-less-profile-row pattern (`students.id` no-FK precedent).
- **Phase 3 (Signup/CRUD):** Re-points existing Supabase auth infra; no new library or pattern.
- **Phase 4 (Profile Switcher):** Follows this app's established Context convention (`SubscriptionContext` et al.) and existing `ParentGateMath`/`ProtectedRoute` precedents.

---

## Confidence Assessment

| Area         | Confidence                                                                                                                                                                                                                                   | Notes                                                                                                                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH                                                                                                                                                                                                                                         | Core pattern verified against this repo's own production migrations, not generic advice; MEDIUM only on "what's new in Supabase 2026" (nothing material found)                                                                                              |
| Features     | MEDIUM-HIGH                                                                                                                                                                                                                                  | COPPA statutory text (16 CFR §312.6/312.7) verified against primary/official sources (Cornell LII, FTC); competitor UX patterns (Duolingo, Khan Academy Kids, Netflix, Prodigy, ABCmouse) verified via multiple secondary sources, not first-party API docs |
| Architecture | HIGH on migration mechanics (measured facts + current official Supabase RLS guidance); MEDIUM on client UX specifics (product decisions not yet made); LOW explicitly flagged on the 5-orphaned-student and 3-legacy-subscription edge cases |
| Pitfalls     | HIGH                                                                                                                                                                                                                                         | Grounded directly in this repo's own migration history (3 prior FK-drift fixes are direct historical evidence, not hypothetical), services, and PROJECT.md-measured surface area                                                                            |

**Overall confidence:** HIGH on the technical/architectural path; MEDIUM on the product/legal decisions that remain genuinely open (see Open Questions above) — these are not research gaps, they are decisions that need an owner, and all four researchers independently flagged the same ones.

### Gaps to Address

- **5 auth-less students (Open Question 1):** No PRD guidance exists. Needs explicit sign-off before Phase 1's backfill can complete — surfaced as its own small decision point, not resolved by assumption in code.
- **Subscription scoping (Open Question 2):** Recommend `parent_id`-scoped as the default given the product's likely sibling-household usage pattern, but this must be a recorded decision before Phase 5, not inferred from old code.
- **Gate-on-switch-away (Open Question 3):** LOW confidence either way per ARCHITECTURE.md — flag as a decision point in the Phase 4 discussion, not an assumption.
- **`teacher_feedback` fate (Open Question 4):** Needs an explicit remove-vs-repurpose decision during Phase 7 scoping, not a default outcome of deleting its only writer.
- **PRD §5 (third-party SDK audit):** Confirmed generic boilerplate (names Firebase/PostHog/Mixpanel/IDFA, none of which exist in this stack) — needs a rewrite scoped to the real stack (Supabase, Umami, Sentry) rather than implementation as written.
- **Legal review status:** PROJECT.md's "Known Issues" still lists "parental consent verification method needs legal review" and "privacy policy language requires attorney review" as open — this milestone's "implicit consent via account creation" model (PRD §2) is on solid ground for new signups but explicitly flagged as weaker than Duolingo/Khan Academy Kids' confirmation-email step; consider whether the email-plus reinforcement (P2 candidate) should be pulled forward if legal review requests it.

---

## Sources

### Primary (HIGH confidence)

- Direct repository evidence across all four research files: `supabase/migrations/20250115000005_remove_student_auth_fkey.sql`, `20260127000003_optimize_rls_auth_plan.sql`, `20260404000001_ensure_subscription_rls.sql`, `20250625120001_add_teacher_schema.sql` + 3 corrective FK-drift migrations, `supabase/functions/lemon-squeezy-webhook/lib/*.ts`, `create-checkout/index.ts`, `cancel-subscription/index.ts`, `src/features/authentication/useUser.js`, `src/features/authentication/useSocialAuth.js`, `src/ui/ProtectedRoute.jsx`, `src/services/practiceService.js`, `src/services/achievementService.js`
- [16 CFR §312.6 — Cornell LII](https://www.law.cornell.edu/cfr/text/16/312.6) — primary legal source for parent review/delete/refuse-collection duties
- [Supabase Docs — RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- `.planning/PROJECT.md` — measured migration surface (30 FK columns/26 tables, 62/80 RLS policies/32 tables, 34 files/42 `useUser()` call sites, 151 `user?.id` references, 20 students/15 auth accounts/3 subscriptions), owner decisions already recorded 2026-07-21
- `COPPA_REFACTOR_PRD.md` (repo root) — target schema and UX requirements

### Secondary (MEDIUM confidence)

- [FTC — Complying with COPPA: FAQs](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [Google Play Console — Families Policy Requirements](https://support.google.com/googleplay/android-developer/answer/9893335)
- Competitor UX analysis: Netflix Kids, Duolingo, Khan Academy Kids, Prodigy, ABCmouse (own help/support articles, cross-referenced across multiple secondary summaries)
- [GitHub — supabase/discussions#14576, RLS Performance and Best Practices](https://github.com/orgs/supabase/discussions/14576)

### Tertiary (LOW confidence, flagged for validation)

- The 5-orphaned-student and 3-legacy-subscription edge case resolutions — architecturally scoped but explicitly not resolved by research, need owner decisions (see Open Questions)
- Whether "email-plus" reinforcement is legally necessary vs. a nice-to-have — depends on outcome of the still-pending legal review noted in PROJECT.md

---

_Research completed: 2026-07-21_
_Ready for roadmap: yes, pending the four Open Questions being assigned an owner (not necessarily resolved before Phase 1 planning starts, but resolved before their respective phases begin implementation)_
