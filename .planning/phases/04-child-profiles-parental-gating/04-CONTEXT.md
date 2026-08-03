# Phase 4: Child Profiles & Parental Gating - Context

**Gathered:** 2026-08-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Give a parent everything needed to run a family of child profiles on a shared device:

- **Child profile CRUD** — create, rename, delete child profiles; preset-avatar selection only (no
  uploads); visible guidance against using the child's full name (PROFILE-01/02/03).
- **Sibling switching** — a net-new parent-side "active child" concept (none exists today; the app
  currently assumes `auth.uid() == studentId` everywhere). Frictionless, ungated switching that
  survives reload but is **never** trusted as an authorization signal, and that fully clears the
  previous child's cached data on switch (PROFILE-04/05/06).
- **Parental gate** — a short-lived, mount-checked math gate that fronts every parent-only surface
  (profile CRUD, account settings, subscription/billing, data rights) and cannot be reached by
  direct URL or back-button, and does not stay open for the next person on the device (COPPA-01/02).
- **Data rights** — per-child review, export, delete, and deactivate-without-deleting, reusing the
  existing account-deletion / data-export plumbing rescoped per child (COPPA-03/04/05/06).

Delivers PROFILE-01…PROFILE-06 and COPPA-01…COPPA-06 (12 requirements).

**Not in this phase:** parent-only signup / age gate (Phase 3, done), subscription re-pointing to
parent scope (Phase 5), live migration of the 15 existing accounts + blocking re-consent (Phase 6),
audio recording removal (Phase 7), dropping legacy `student_id = auth.uid()` policies (Phase 8).
Accessory layering on avatars (a gameplay-reward system) is out of scope — the create/edit picker is
preset avatars only. Custom/uploaded avatars, child email/phone/PIN are milestone-level out-of-scope.

**Client-side refactor note (in scope, sized by planner — not a user decision):** correct per-child
reads/writes and cache-clearing require rescoping ~15 `user.id`-keyed React Query shapes to the
active-child id, teaching the `auth.uid()`-internal services (streak, practice-log, practice-streak,
notifications) to accept an explicit child id, and adding a parent→child ownership branch to
`verifyStudentDataAccess`. This is the largest surface in the phase; it is mechanics, deliberately
left to research/planning, but it IS Phase-4 scope because PROFILE-05 and per-child data rights
depend on it.

</domain>

<decisions>
## Implementation Decisions

### Switcher Entry Model (PROFILE-04, PROFILE-06)

- **D-01: Resume last active child on launch; switcher always one tap away.** The app remembers the
  last active child in `localStorage` and drops them straight into the dashboard — single-child
  families never see a picker. A visible switcher is always available. Matches D-07's low-friction
  intent. (No parent-side switcher exists today; this is net-new.)
- **D-02: The in-app switcher is the active-child avatar in the header/top bar.** Tapping it opens a
  "Who's playing?" overlay (siblings + "Add"). Discoverable and kid-friendly; reuses the avatar
  already shown. Games hide the header, so switching happens from the dashboard — acceptable.
- **D-03: A zero-child parent (fresh Phase-3 signup) sees an "Add your first child" CTA** in an empty
  picker; tapping it passes the parental gate into the create-profile flow. Gets a bare parent
  account to a playable child quickly without dumping them straight into a form.
- **D-04: The active-child id must be read from `localStorage` on mount BEFORE any student-scoped
  query fires** — otherwise first render queries with an undefined/wrong child. Active-child state is
  UI/UX convenience only and is **never** an authorization signal (authorization is RLS/ownership,
  Phase 2). (PROFILE-06.)

### Parental Gate — Lifetime, Scope, Switch-Away (COPPA-01, COPPA-02; Open Question 3)

- **D-05: Short auto-closing shared window (~3 minutes).** Solving the gate once opens a shared
  gate-passed state so a parent can move across Settings → Billing → Manage Children without
  re-solving. It auto-closes on: **timeout, profile-switch, app backgrounded/blurred, and navigating
  back to any child surface.** Every gated route still **re-checks gate state on mount**, so a direct
  URL or back-button into a gated route with no open window re-prompts. Satisfies COPPA-02 in both
  directions (no URL bypass; doesn't linger for the next person). Exact window length is Claude's
  discretion (~2–5 min).
- **D-06: The gate needs a shared gate context/provider.** Today three independent copies of
  `ParentGateMath` exist (portal, notifications, feedback), each mount-local and non-persistent.
  D-05's shared window requires lifting gate-passed state into a short-lived in-memory context (never
  persisted to storage). The math-gate **mechanism** stays (`ParentGateMath` — locked by the
  Out-of-Scope table; no PIN/password).
- **D-07 (resolves roadmap Open Question 3): Switching AWAY from a child is NOT gated — switching is
  free in both directions.** Consistent with milestone D-07 and its rationale ("a gate on every
  switch would punish the shared-tablet case the feature exists to serve"). Residual, explicitly
  accepted: a sibling can pick another sibling's profile and play as them — the same trust model as
  Netflix kids profiles; RLS already exposes all siblings to the one parent session, so it leaks
  nothing new. (Roadmap flagged this LOW-confidence either way; decided explicitly here, not
  assumed.)
- **D-08: Gated surfaces = child profile CRUD (create/rename/delete/avatar), account settings +
  subscription/billing, and data rights (review/export/delete/deactivate).** Ungated = the switcher,
  gameplay/dashboard, and **read-only child stat viewing.** This splits today's fully-gated
  `/parent-portal`: a child may view their own progress/stats without the gate, but every _action_
  requires it. Planner must decouple the portal's read-only stats from its gated actions.

### Data Rights Surface (COPPA-03, COPPA-04, COPPA-05, COPPA-06)

- **D-09: A new gated "Manage Children" screen is the home for per-child management.** A list of the
  parent's children; each row drills into a per-child panel: rename, avatar, review data, export,
  deactivate, delete. This screen also hosts CRUD (Area 4). The existing Parent Portal keeps
  account-wide items (subscription, notifications, whole-account deletion). Clean per-child vs
  account-level separation, and avoids the portal's current parent-id-as-studentId confusion.
- **D-10: "Deactivate" = freeze & hide, reversible, data retained** (COPPA-06 / §312.6(a)(1)). Sets
  `child_profiles.is_active = false`: the child disappears from the "Who's playing?" switcher (can't
  be selected → no new data collected), all existing data is **retained**, and the parent can
  reactivate anytime. Uses the existing (currently unwired) `is_active` column. This is deliberately
  distinct from delete.
- **D-11: Export = in-browser JSON download**, reusing `dataExportService.exportStudentData()` /
  `downloadStudentDataJSON()`. **Planner must first complete `STUDENT_DATA_TABLES`** — the scout
  found it omits several child-scoped tables (e.g. `student_unit_progress`,
  `student_daily_challenges`, `notifications`, `rate_limits`), so export is currently incomplete
  relative to the schema.
- **D-12: Delete = permanent, immediate, name-confirmed, parent stays logged in.** Deleting one child
  removes that child's data for good; guarded by the gate **and** typing the child's nickname.
  Crucially it must **NOT** sign the parent out — `accountDeletionService.requestAccountDeletion()`
  calls `supabase.auth.signOut()` today (correct for whole-account deletion, wrong for one child), so
  a per-child branch is required. Deactivate (D-10) already covers the reversible case, so delete is
  the real, permanent thing (no 30-day grace for a single profile).

### Child Profile CRUD & Avatars (PROFILE-01, PROFILE-02, PROFILE-03)

- **D-13: Build a compact inline preset-avatar grid** for the create/edit form, writing
  `child_profiles.avatar_id` and reading the same DB `avatars` set. Do **not** reuse `Avatars.jsx`
  (a heavy full-page account+accessory editor bound to the logged-in user that can't target a sibling
  id). Accessory layering stays out of scope for the picker.
- **D-14: Nickname guidance = inline helper text PLUS a soft, non-blocking full-name heuristic.**
  Always show helper copy ("Use a first name or nickname — please don't use your child's full name").
  Additionally, warn (do not block) if the entry looks like a full name (e.g. two capitalized words).
  The warning must be **non-blocking** (parent can still save), localized EN+HE, and tuned
  conservatively to minimize false positives (hyphenated names, legit two-word nicknames). (User
  chose this over helper-text-only.)
- **D-15: After creating a child, auto-switch into that child and land on their dashboard.** Natural
  for the first-child empty-state flow (parent → gate → create → child is playing) and for handing
  the device to a newly added sibling mid-session.

### Claude's Discretion

Resolve during planning without returning to the user:

- Exact gate window length (D-05, ~2–5 min) and the precise list of "close" triggers' implementation
  (visibilitychange/blur, route-change listener, switch handler).
- Cache-clear mechanism on switch — the scout recommends mirroring logout's
  `queryClient.removeQueries()` (`useLogout.js:11`) + the `localStorage` purge routine in
  `apiAuth.js:227-280` (minus `signOut`), rather than surgically re-keying ~15 query shapes. Whether
  to also force a full remount is planner's call (PROFILE-05 must be provable by multi-child device
  test).
- The `localStorage` key name for active-child (e.g. `active_child_id`) and how it slots into the
  existing logout purge (the purge already matches UUID-suffixed keys).
- Switch-transition UX (brief loading vs full remount) — not separately discussed; keep it simple and
  bleed-free.
- Cap (if any) on number of children per parent; "review data" presentation (rich summary screen vs
  the raw JSON from export) — both minor, planner's discretion.
- Which preset avatars populate the grid (source set from the `avatars` table) and copy/i18n keys
  (EN+HE parity required) for all new screens.
- Edge case: deleting/deactivating the _last_ child leaves a bare parent account (allowed — same
  state as a fresh Phase-3 signup, D-03).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope & locked decisions

- `.planning/ROADMAP.md` §"Phase 4: Child Profiles & Parental Gating" — goal, 5 success criteria,
  named Pitfalls 11 (route-only gate bypass) & 12 (sibling cache bleed), and the Open Question 3 flag
  (switch-away gate — resolved here as D-07).
- `.planning/REQUIREMENTS.md` — PROFILE-01…06, COPPA-01…06 (this phase); Owner Decisions **D-07**
  (sibling switching not gated — avatar picker only), **D-06** (`child_profiles.parent_id` nullable,
  teacher-owned children exist), **D-05** (subscriptions parent-scoped — Phase 5, but informs why a
  deleted child doesn't touch billing); the Out-of-Scope table (no custom avatars, no child
  email/phone/PIN, math gate stays correct for post-auth gating only).
- `COPPA_REFACTOR_PRD.md` (repo root) §3 Step 3 (child profile allowed/forbidden fields) & Step 4
  (profile switcher + parental gate), §4 (target schema).

### Research

- `.planning/research/PITFALLS.md` — Pitfall 11 (child escapes to parent surface — gate the
  route-wrapper per mount, short-lived pass), Pitfall 12 (profile switch doesn't rescope cached state
  — sibling data bleed), plus the Security/UX pitfall tables and the pitfall-to-phase verification
  rows (multi-child device test).
- `.planning/research/SUMMARY.md` — account-model rationale (one parent auth session serves N
  children).

### Prior-phase context

- `.planning/phases/03-parent-only-signup-age-gate/03-CONTEXT.md` — D-12 (Privacy Policy link's
  parent-settings placement rides with Phase 4's settings surface — pick up SIGNUP-05's second half
  here), the `parents`-table shape, and the role-from-DB-presence security rule.
- `.planning/phases/01-identity-schema-expand/01-CONTEXT.md` — `child_profiles` minimal schema
  (nickname/avatar/birth_year only), `parent_id` nullable, UUID-reuse anchor.

### Existing code to modify / reuse (verified during scout)

- `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` — the already-applied
  `parents`/`child_profiles` tables, `is_active` column (§L46, deactivation lever), `avatar_id` FK
  (§L44), dual FKs on 16 child-scoped tables, and the students↔child_profiles sync + cascade-delete
  triggers. **Read before touching any child data.**
- `src/features/authentication/useUser.js` + `src/services/apiAuth.js` (`getCurrentUser`
  ~L48-212; `updateUserAvatar` ~L356-404; the logout localStorage purge ~L227-280) — the single
  source of the current `user.id == studentId` assumption and the switch/purge template.
- `src/App.jsx` (QueryClient ~L164-174; routes ~L414-423) and `src/features/authentication/useLogout.js`
  (`queryClient.removeQueries()` ~L11) — the cache-clear template for profile-switch.
- `src/components/settings/ParentGateMath.jsx`, `src/pages/ParentPortalPage.jsx` (mount-local
  `gateOpen` ~L133, gated child queries `enabled: !gateOpen`), `src/components/settings/ParentZoneEntryCard.jsx`
  — the gate to lift into a shared context (D-06) and the portal to split (D-08).
- `src/services/dataExportService.js` (`exportStudentData`/`downloadStudentDataJSON`;
  `STUDENT_DATA_TABLES` ~L20 — incomplete, complete it per D-11) and
  `src/services/accountDeletionService.js` (`requestAccountDeletion` signs out ~L94 — branch per D-12).
- `src/services/authorizationUtils.js` (`verifyStudentDataAccess` ~L19-46 — hard-requires
  `user.id === studentId`; needs a parent→child ownership branch or every per-child read/write/export/delete
  throws).
- `src/components/Avatars.jsx` + `src/services/apiAvatars.js` — the DB `avatars` set to read for the
  new compact picker (D-13); do not reuse the page itself.
- ⚠️ `src/services/streakService.js` (module-scoped in-flight/cooldown singletons ~L9-20; internal
  `auth.getSession()` ~L170,238,348), `src/services/practiceLogService.js`, `practiceStreakService.js`,
  `notificationService.js` — the `auth.uid()`-internal services that can't be rescoped by argument;
  biggest refactor surface for correct per-child writes.
- ⚠️ Unkeyed queries `["streak-state"]` (`StreakDisplay.jsx:112`) and `["scores"]`
  (`useScores.js:17`), and `shown-accessory-unlocks-${user.id}` localStorage (`useVictoryState.js`) —
  will bleed across children unless removed/re-scoped on switch (Pitfall 12).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Logout as the switch template:** `queryClient.removeQueries()` (`useLogout.js:11`) + the
  UUID/`_student_`/`_user_`-matching localStorage purge (`apiAuth.js:227-280`) together are exactly
  the "clear the previous child on switch" routine — minus `supabase.auth.signOut()`.
- **`dataExportService` + `accountDeletionService`** — full per-`studentId` export and soft/hard
  delete flows; rescope to child ids for COPPA-03/04/05, with the two behavior branches noted (D-11
  export completeness; D-12 no-signout delete).
- **`child_profiles.is_active`** — the ready deactivation column (D-10), plus the push-consent
  deactivation upsert pattern in `ParentPortalPage.jsx:259-267` as a UI precedent.
- **`ParentGateMath`** — the gate mechanism (locked); lift its pass-state into a shared short-lived
  context (D-06). `AccountDeletionModal` (name-confirm) is the precedent for D-12's delete guard.
- **DB `avatars` set** (`apiAvatars.js`, `["avatars"]` query) — source for the compact preset picker.

### Established Patterns

- **`user.id == studentId` is assumed in ~40 files / ~15 React-Query key shapes.** The new
  active-child id must replace `user.id` in every student-scoped read/write/localStorage key. This is
  the core mechanical work of the phase (Pitfall 12 blast radius).
- **Role/ownership from DB table presence, never JWT/metadata** — active-child stays UI-only, never
  an authz signal (D-04); authorization remains RLS ownership from Phase 2.
- **EN + HE i18n parity, RTL-aware, `i18n.language?.startsWith("he")`** — every new string (switcher,
  gate copy, Manage Children, data-rights, nickname guidance) needs both locales.
- **Glassmorphism on purple gradient** design system (per CLAUDE.md) for all new screens.

### Integration Points

- **New `localStorage` active-child key**, read on mount before the first student-scoped query fires
  (D-04), slotted into the existing logout purge.
- **Shared gate context/provider** wrapping gated routes; gate re-checked on mount + closed on
  switch/blur/timeout/leave (D-05/D-06).
- **`verifyStudentDataAccess` parent→child ownership branch** — unblocks all per-child data rights.
- **The `auth.uid()`-internal services** (streak/practice/notifications) gain explicit child-id
  params + RLS that lets a parent act on behalf of an owned child.
- **Parent Portal split** — read-only stats ungated, actions gated (D-08); SIGNUP-05's parent-settings
  Privacy Policy link lands here (from Phase 3 D-12).

</code_context>

<specifics>
## Specific Ideas

- **The organizing security insight:** the gate protects _parent surfaces_, not _child-to-child_
  switching. Switching is deliberately frictionless both ways (D-07); the gate is a short-lived,
  mount-checked window on the four action surfaces (D-05/D-08). "Un-bypassable" means re-checked per
  mount with no persisted pass — not "re-solved on every screen."
- **Deactivate vs delete are two distinct levers by design:** deactivate = reversible, data-retained,
  "stop collecting" (the COPPA-06 requirement the PRD omitted); delete = permanent, name-confirmed,
  parent-stays-logged-in. Keeping them separate is what makes COPPA-06 real rather than a rename of
  delete.
- **Trust model for siblings is explicitly Netflix-kids-profiles** — a child playing as a sibling is
  accepted, not a bug, because both are already the same parent's data under one RLS session.

</specifics>

<deferred>
## Deferred Ideas

- **Per-child progress tile on the profile switcher** and a **multi-child comparison dashboard** —
  already listed in REQUIREMENTS.md "Future Requirements"; not this phase.
- **Gating switch-away / per-child PIN** — declined (D-07); reopening would contradict milestone D-07.
- **Rich "review data" summary screen** (vs the raw export JSON) — nice-to-have; left to planner's
  discretion or a future polish pass.
- **Accessory layering in the create/edit avatar picker** — out of scope; the picker is preset
  avatars only (D-13).

None — discussion stayed within phase scope otherwise.

</deferred>

---

_Phase: 4-Child Profiles & Parental Gating_
_Context gathered: 2026-08-04_
