# Phase 4: Child Profiles & Parental Gating - Research

**Researched:** 2026-08-04
**Domain:** Client-side identity rescoping (auth.uid()→active-child) + short-lived route-level parental gate + per-child data-rights reuse, on a live React 18 + Supabase PWA
**Confidence:** HIGH (grounded in this repo's applied migrations, services, and query keys — verified in-session, not generic advice)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Switcher entry model (PROFILE-04, PROFILE-06)**

- **D-01:** Resume last active child on launch; switcher always one tap away. Single-child families never see a picker. Remembers last active child in `localStorage`.
- **D-02:** The in-app switcher is the active-child avatar in the header/top bar; tapping opens a "Who's playing?" overlay (siblings + "Add"). Games hide the header, so switching happens from the dashboard.
- **D-03:** A zero-child parent sees an "Add your first child" CTA in an empty picker; tapping passes the parental gate into the create-profile flow.
- **D-04:** The active-child id MUST be read from `localStorage` on mount BEFORE any student-scoped query fires. Active-child state is UI/UX convenience only and is **never** an authorization signal (authz is RLS/ownership, Phase 2).

**Parental gate — lifetime, scope, switch-away (COPPA-01, COPPA-02)**

- **D-05:** Short auto-closing shared window (~3 min, Claude's discretion 2–5). Solving once opens a shared gate-passed state across Settings → Billing → Manage Children. Auto-closes on: **timeout, profile-switch, app backgrounded/blurred, and navigating back to any child surface.** Every gated route **re-checks gate state on mount** — direct URL / back-button into a gated route with no open window re-prompts.
- **D-06:** The gate needs a shared gate context/provider. Today three independent copies of `ParentGateMath` exist (portal, notifications, feedback), each mount-local. Lift gate-passed state into a short-lived in-memory context (**never persisted to storage**). The math-gate mechanism stays (`ParentGateMath` — locked; no PIN/password).
- **D-07:** Switching AWAY from a child is NOT gated — switching is free in both directions. Residual accepted: a sibling can pick another sibling's profile and play as them (Netflix-kids trust model; RLS already exposes all siblings to the one parent session).
- **D-08:** Gated surfaces = child profile CRUD, account settings + subscription/billing, data rights. Ungated = the switcher, gameplay/dashboard, and **read-only child stat viewing.** Split today's fully-gated `/parent-portal`: read-only stats ungated, every _action_ gated.

**Data rights (COPPA-03/04/05/06)**

- **D-09:** A new gated "Manage Children" screen is the home for per-child management (list → per-child panel: rename, avatar, review data, export, deactivate, delete). Also hosts CRUD. Parent Portal keeps account-wide items (subscription, notifications, whole-account deletion).
- **D-10:** "Deactivate" = freeze & hide, reversible, data retained (COPPA-06 / §312.6(a)(1)). Sets `child_profiles.is_active = false`; child disappears from switcher; data retained; reactivatable.
- **D-11:** Export = in-browser JSON download, reusing `dataExportService.exportStudentData()` / `downloadStudentDataJSON()`. **Planner must first complete `STUDENT_DATA_TABLES`** — it omits several child-scoped tables.
- **D-12:** Delete = permanent, immediate, name-confirmed, parent stays logged in. Guarded by the gate AND typing the child's nickname. Must NOT sign the parent out — `accountDeletionService.requestAccountDeletion()` calls `supabase.auth.signOut()` today; a per-child branch is required.

**Child profile CRUD & avatars (PROFILE-01/02/03)**

- **D-13:** Build a compact inline preset-avatar grid for the create/edit form, writing `child_profiles.avatar_id`, reading the DB `avatars` set. Do **not** reuse `Avatars.jsx`. Accessory layering out of scope.
- **D-14:** Nickname guidance = inline helper text PLUS a soft, non-blocking full-name heuristic (warn on e.g. two capitalized words; parent can still save; localized EN+HE; tuned conservatively).
- **D-15:** After creating a child, auto-switch into that child and land on their dashboard.

### Claude's Discretion

- Exact gate window length (~2–5 min) and the precise "close" trigger implementation (visibilitychange/blur, route-change listener, switch handler).
- Cache-clear mechanism on switch — scout recommends mirroring logout's `queryClient.removeQueries()` + the `apiAuth.js` localStorage purge (minus `signOut`) rather than surgically re-keying ~15 query shapes. Whether to also force a full remount is planner's call (PROFILE-05 must be provable by multi-child device test).
- The `localStorage` key name for active-child (e.g. `active_child_id`) and how it slots into the logout purge.
- Switch-transition UX (brief loading vs full remount) — keep it simple and bleed-free.
- Cap (if any) on children per parent; "review data" presentation (rich summary vs raw JSON).
- Which preset avatars populate the grid; copy/i18n keys (EN+HE parity) for all new screens.
- Edge case: deleting/deactivating the _last_ child leaves a bare parent account (allowed — same as fresh Phase-3 signup).

### Deferred Ideas (OUT OF SCOPE)

- Per-child progress tile on the profile switcher; multi-child comparison dashboard (REQUIREMENTS "Future").
- Gating switch-away / per-child PIN — declined (D-07).
- Rich "review data" summary screen (vs raw export JSON) — future polish.
- Accessory layering in the create/edit avatar picker — out of scope (D-13).
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID         | Description                                                             | Research Support                                                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PROFILE-01 | Parent can create, rename, delete child profiles                        | Insert/update/delete `child_profiles` (RLS `child_profiles_all_parent_owner` USING+WITH CHECK `parent_id = auth.uid()`, already applied). New service `apiChildProfiles.js`. Delete path = D-12 per-child branch. |
| PROFILE-02 | Avatars from preset set; no custom upload                               | `child_profiles.avatar_id` FK → `avatars` (structural). Compact grid reads `getAvatar()` (`apiAvatars.js`), writes `avatar_id`. D-13.                                                                             |
| PROFILE-03 | Nickname carries full-name guidance                                     | Inline helper + non-blocking heuristic (D-14). Writes `child_profiles.nickname`.                                                                                                                                  |
| PROFILE-04 | Child can switch profiles without gate/password                         | Ungated "Who's playing?" overlay (D-02/D-07). Sets active-child.                                                                                                                                                  |
| PROFILE-05 | Switching fully clears previous child's cache — multi-child device test | `queryClient.removeQueries()` + localStorage purge on switch (reuse logout template). ⚠️ Unkeyed `["streak-state"]`/`["scores"]` + `shown-accessory-unlocks-${user.id}` are the bleed vectors (Pitfall 12).       |
| PROFILE-06 | Active-child survives reload, never an authz signal                     | `localStorage` active-child key read on mount (D-04); authz stays RLS-ownership.                                                                                                                                  |
| COPPA-01   | Settings/subscription/billing/child-mgmt behind the gate                | Route-level `ParentGateProtectedRoute` wrapper + shared gate context (D-05/D-06).                                                                                                                                 |
| COPPA-02   | Gate un-bypassable by URL/back-button; doesn't linger                   | Mount re-check on every gated route; short-lived in-memory pass; close on blur/visibilitychange (Pitfall 11).                                                                                                     |
| COPPA-03   | Parent can review all data per child                                    | `exportStudentData(childId)` in-memory (D-11) rendered as review; needs `verifyStudentDataAccess` parent→child branch.                                                                                            |
| COPPA-04   | Parent can export children's data                                       | `downloadStudentDataJSON(childId)`; complete `STUDENT_DATA_TABLES` (D-11).                                                                                                                                        |
| COPPA-05   | Parent can delete a child's data                                        | Per-child hard delete (`students.delete().eq('id', childId)` → cascades via Phase-1 trigger), no signOut (D-12).                                                                                                  |
| COPPA-06   | Stop collection for one child without deleting the account              | `child_profiles.is_active = false` (D-10); switcher filters `is_active`.                                                                                                                                          |

</phase_requirements>

## Summary

This phase is **~85% client-side React work and ~0% new database work.** The single largest task is teaching a codebase that hard-assumes `auth.uid() == studentId` (43 files reference `user.id`, 34 reference `studentId`, ~17 child-scoped React Query key shapes, 4 `auth.uid()`-internal services) to instead read/write against an **active-child id** that the parent selects.

The critical, load-bearing finding: **the database is already fully ready.** Phase 2's RLS rewrite (`20260801120000_rls_ownership_rewrite.sql`, applied) shipped a `..._parent_owner` policy on every child-scoped table authorizing `<id_col> IN (SELECT public.owned_child_ids())`, and re-pointed `award_xp` / `check_rate_limit` to the same ownership check. A parent, authenticated as themselves, can already read and write any owned child's rows **provided the client sends the child's id.** Phase 4 needs **no new migration** for the core rescoping — it is purely a client contract change plus the parental-gate UI. `[VERIFIED: 20260801120000_rls_ownership_rewrite.sql read in-session]`

Two non-obvious realities shape the plan. **(1) Role duality.** `getCurrentUser` (`apiAuth.js:48`) resolves the 15 legacy/migrated accounts as `student` (they're still in `students`, and `user.id == their single child_profile.id` by UUID-reuse), while fresh Phase-3 signups resolve as `parent` (distinct child ids). Child-scoped queries today are gated `enabled: ...isStudent` (e.g. `useScores.js:19`), so **for a parent-role account the entire student-data layer is currently inert.** The active-child abstraction must therefore replace _both_ `user.id` → `activeChildId` _and_ the `isStudent` enable-gate → `hasActiveChild`, while keeping legacy student accounts working unchanged. **(2) SEC-03 landmines.** Client-side self-checks like `notificationService.savePushSubscription`'s `if (user.id !== studentId) throw "Unauthorized"` (`:224`) and `verifyStudentDataAccess`'s `user.id === studentId` branch actively _reject_ a legitimate parent acting on an owned child — each must gain a parent→child ownership branch (Pitfall 5).

**Primary recommendation:** Introduce one `ActiveChildProvider` context + `useActiveChildId()` hook as the _single_ source of the id used for all child-scoped reads/writes. Resolve it as: legacy `student` role → `user.id`; `parent` role → validated `localStorage` active-child (D-04). Rescope child-scoped query keys to include `activeChildId`, teach the 4 auth-internal services an explicit `childId` param, and clear cache + purge child-suffixed localStorage on every switch by reusing the logout routine (minus `signOut`). Front the four action surfaces with a `ParentGateProtectedRoute` wrapper backed by a short-lived in-memory `ParentGateContext`. Do **not** touch RLS, `parent_subscriptions`, or add a migration.

## Architectural Responsibility Map

| Capability                                     | Primary Tier                                                        | Secondary Tier                                           | Rationale                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Active-child selection & persistence           | Browser / Client (Context + localStorage)                           | —                                                        | UI convenience only; D-04 forbids it as an authz signal                                                        |
| Child-scoped read/write authorization          | Database (RLS `_parent_owner` policies)                             | Client defense-in-depth (`verifyStudentDataAccess`)      | Ground truth is `owned_child_ids()`; client checks only improve error messages (SEC-03)                        |
| Cache isolation between siblings               | Browser / Client (React Query + localStorage)                       | —                                                        | Pitfall 12 is a client-cache problem, not a server one                                                         |
| Parental gate (reveal control)                 | Browser / Client (route wrapper + in-memory context)                | Database (RLS still enforces on any mutation)            | Gate is a client reveal guard; mutations are _additionally_ RLS-authorized (never gate-only)                   |
| Child profile CRUD                             | Client (form) → Database (`child_profiles`)                         | Trigger (shadow `students` row via Phase-1 reverse sync) | `child_profiles_all_parent_owner` already authorizes; reverse trigger keeps dual-FK satisfiable                |
| Per-child data export/review/delete/deactivate | Client (Manage Children UI) → Database (existing services rescoped) | —                                                        | Reuse `dataExportService` / `accountDeletionService` with child id                                             |
| XP / rate-limit on child writes                | Database (`award_xp`, `check_rate_limit` SECURITY DEFINER)          | Client passes `childId`                                  | Functions already re-pointed to `owned_child_ids()` (D-23) — callers must pass child id, not `session.user.id` |

## Standard Stack

No new libraries. This phase composes the existing stack. `[VERIFIED: package.json read in-session]`

### Core

| Library                 | Version           | Purpose                                                                                          | Why Standard                                                     |
| ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| @tanstack/react-query   | ^5.66.0           | Child-scoped data cache; `queryClient.removeQueries()` is the switch-clear primitive             | Already the app's server-state layer                             |
| react                   | ^18.3.1           | `ActiveChildProvider` / `ParentGateContext` providers; `key={activeChildId}` remount option      | Existing context pattern (Accessibility, Settings, Subscription) |
| react-router-dom        | ^7.1.5            | `ParentGateProtectedRoute` wrapper mirrors existing `ProtectedRoute`; route-change close trigger | Existing routing; `ProtectedRoute` precedent                     |
| @supabase/supabase-js   | ^2.48.1           | Child-scoped CRUD; RLS enforces ownership                                                        | Existing backend                                                 |
| i18next / react-i18next | ^25.7.0 / ^16.3.5 | EN+HE parity for all new copy                                                                    | Project convention (`i18n.language?.startsWith("he")`)           |

### Supporting (existing internal modules to reuse — NOT rebuild)

| Module                                                                          | Purpose                                          | When to Use                                             |
| ------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| `apiAvatars.getAvatar()`                                                        | Reads the DB `avatars` set (`["avatars"]` query) | D-13 compact preset grid                                |
| `dataExportService.exportStudentData` / `downloadStudentDataJSON`               | COPPA export/review                              | D-11/COPPA-03/04 (complete `STUDENT_DATA_TABLES` first) |
| `accountDeletionService`                                                        | Delete/soft-delete plumbing                      | D-12 per-child branch (drop the `signOut`)              |
| `useLogout` `queryClient.removeQueries()` + `apiAuth.logout` localStorage purge | The switch-clear routine                         | PROFILE-05 (minus `signOut`)                            |
| `ParentGateMath`                                                                | The math-gate mechanism (locked)                 | D-06 (lift its pass-state into shared context)          |
| `AccountDeletionModal`                                                          | Name-confirm precedent                           | D-12 delete guard                                       |

### Alternatives Considered

| Instead of                         | Could Use                                                                    | Tradeoff                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Surgically re-key ~17 query shapes | `queryClient.removeQueries()` + `key={activeChildId}` full remount on switch | Blunt remount is far safer given the call-site surface; scout + Pitfall 12 both recommend it. `[CITED: PITFALLS.md Pitfall 12]` |
| New `active_child_id` DB column    | `localStorage` only (D-04)                                                   | Active-child is UI state, not authz — DB column would imply trust it must not have                                              |
| Redux for active-child             | React Context                                                                | Redux is "rhythm only" per CLAUDE.md; Context matches existing feature-scoped state                                             |

**Installation:** none — no packages added. `[VERIFIED: no new deps needed]`

## Architecture Patterns

### System Data Flow

```
                         ┌─────────────────────────────────────┐
   app mount ───────────▶│ getCurrentUser() (apiAuth.js:48)    │
                         │  → role: student | parent | teacher │
                         └──────────────┬──────────────────────┘
                                        │
                   ┌────────────────────┴─────────────────────┐
       role=student│ (legacy/migrated)          role=parent   │(fresh signup)
                   ▼                                           ▼
        activeChildId = user.id            ActiveChildProvider reads
        hasActiveChild = true              localStorage["active_child_id"]
                   │                        → validate ∈ owned children
                   │                        → if none: "Who's playing?" empty state
                   └───────────────┬───────────────────────────┘
                                   ▼
                    useActiveChildId() ── single source of the id
                                   │
      ┌────────────────────────────┼───────────────────────────────┐
      ▼                            ▼                                ▼
 child-scoped React Query    auth-internal services         localStorage keys
 keys: [..., activeChildId]  streak/practiceLog/            shown-accessory-unlocks-
 (rescope ~17 shapes)        practiceStreak/notification    <activeChildId>
      │                      (add childId param)                    │
      └────────────┬─────────────────┴─────────────────────────────┘
                   ▼
        Supabase — RLS: <id_col> IN (SELECT owned_child_ids())   ← already applied (Phase 2)
                   │
      SWITCH child ▼
   queryClient.removeQueries() + localStorage purge (logout routine minus signOut)
      + reset streakService module singletons  →  set new active_child_id  →  (optional) remount

   ── Parent-only surfaces (Settings / Billing / Manage Children / Data Rights) ──
   <ParentGateProtectedRoute> ── on mount: is gate-passed in ParentGateContext?
        pass → render        no → <ParentGateMath/> ── solve → set in-memory pass (~3min)
   close triggers: timeout · profile-switch · blur/visibilitychange · route→child-surface
   (pass state NEVER persisted to storage)
```

### Recommended Structure (new/changed files — planner sizes waves)

```
src/
├── contexts/
│   ├── ActiveChildContext.jsx      # NEW — active-child id, switch(), owned children list
│   └── ParentGateContext.jsx       # NEW — short-lived in-memory gate-passed state (D-06)
├── hooks/
│   ├── useActiveChildId.js         # NEW — the single id source (student→user.id, parent→localStorage)
│   └── useChildProfiles.js         # NEW — owned children query (["child-profiles", parentId])
├── services/
│   ├── apiChildProfiles.js         # NEW — CRUD on child_profiles (create/rename/avatar/deactivate/delete)
│   ├── dataExportService.js        # EDIT — complete STUDENT_DATA_TABLES (D-11)
│   ├── accountDeletionService.js   # EDIT — per-child no-signout delete branch (D-12)
│   ├── authorizationUtils.js       # EDIT — verifyStudentDataAccess parent→child branch
│   ├── streakService.js            # EDIT — childId param + reset module singletons on switch
│   ├── practiceLogService.js       # EDIT — childId param
│   ├── practiceStreakService.js    # EDIT — childId param
│   └── notificationService.js      # EDIT — replace user.id===studentId self-check w/ ownership
├── components/
│   ├── switcher/WhoIsPlayingOverlay.jsx  # NEW — D-02 overlay + avatar switcher
│   ├── children/ManageChildrenScreen.jsx # NEW — gated D-09 home
│   ├── children/ChildProfileForm.jsx     # NEW — create/edit + compact avatar grid (D-13/14)
│   └── auth/ParentGateProtectedRoute.jsx # NEW — route wrapper (mirror ProtectedRoute)
└── pages/ParentPortalPage.jsx      # EDIT — split read-only stats (ungated) from actions (gated) D-08
```

### Pattern 1: Single active-child id source (`useActiveChildId`)

**What:** One hook returns the child id for every child-scoped read/write, plus a readiness boolean.
**When to use:** Everywhere `user.id`/`studentId` currently feeds a child-scoped query or service call.

```javascript
// Conceptual — resolves role duality so legacy students are unaffected
function useActiveChildId() {
  const { user, isStudent, isParent } = useUser();
  const { activeChildId } = useContext(ActiveChildContext); // localStorage-backed, validated ∈ owned
  if (isStudent) return { childId: user.id, ready: !!user.id }; // legacy/migrated
  if (isParent) return { childId: activeChildId, ready: !!activeChildId }; // fresh signup
  return { childId: null, ready: false };
}
```

**Why:** Child-scoped queries today gate on `isStudent` (e.g. `useScores.js:19`), so a parent session fetches nothing. Swapping the gate to `ready` and the id to `childId` is the one seam that fixes both. `[VERIFIED: useScores.js:19, useUser.js:33-42]`

### Pattern 2: Switch = clear, don't re-key surgically

**What:** On switch, `queryClient.removeQueries()` + run the logout localStorage purge (minus `signOut`) + reset streakService module singletons + write new `active_child_id`.
**When to use:** The switch handler in `ActiveChildContext.switch()`.

```javascript
// Reuses the proven logout template (apiAuth.js:227-280 UUID/_student_/_user_ purge)
async function switchChild(nextChildId) {
  queryClient.removeQueries(); // useLogout.js:11 pattern
  purgeChildScopedLocalStorage(); // apiAuth.js:230-266 minus signOut
  resetStreakServiceSingletons(); // clear in-flight/cooldown (see Pitfall below)
  localStorage.setItem("active_child_id", nextChildId);
  // optional: bump a key={activeChildId} on the app shell to force remount
}
```

**Why:** Enumerating every key risks missing one (Pitfall 12). `[CITED: PITFALLS.md Pitfall 12]`

### Pattern 3: Route-level gate wrapper (mirror `ProtectedRoute`)

**What:** `<ParentGateProtectedRoute>` checks `ParentGateContext.passed` on **every mount**; if not passed, render `ParentGateMath`.
**When to use:** Wrap `/settings` actions, `/subscribe` mgmt, `/parent-portal` actions, and the new Manage Children route.
**Why:** Gating the _button_ leaves direct-URL / back-button open (Pitfall 11). `[CITED: PITFALLS.md Pitfall 11]`

### Anti-Patterns to Avoid

- **Persisting gate-passed state to `localStorage`/`sessionStorage`** — D-06 requires in-memory only; a stored pass lingers for the next person (defeats COPPA-02).
- **Gate as the _only_ guard on a mutation** — always additionally RLS-authorized; the math gate is child-defeatable. `[CITED: PITFALLS.md tech-debt table]`
- **Rescoping `subscription`/`user` queries to child id** — those are parent/account-scoped; keep on `user.id`.
- **Reusing `Avatars.jsx`** — bound to the logged-in user, can't target a sibling (D-13).
- **Trusting active-child for authz** — it's UI state (D-04).

## Don't Hand-Roll

| Problem                                | Don't Build                              | Use Instead                                                             | Why                                                                    |
| -------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Clear previous child's cache on switch | Manual per-key invalidation of 17 shapes | `queryClient.removeQueries()` + logout localStorage purge               | Missed keys = silent bleed (Pitfall 12)                                |
| Child-scoped localStorage cleanup      | New key registry                         | Existing `apiAuth.js:230-266` purge (UUID/`_student_`/`_user_` matcher) | Already handles UUID-suffixed keys (D "slots into the existing purge") |
| Parent→child authorization             | New ownership SQL                        | `owned_child_ids()` RLS (applied) + `verifyStudentDataAccess` branch    | Ground truth already shipped in Phase 2                                |
| Per-child data export                  | New export query set                     | `dataExportService.exportStudentData(childId)`                          | Complete the table list, don't rewrite                                 |
| Math parental gate                     | New gate component                       | `ParentGateMath` (locked)                                               | Mechanism is fixed by Out-of-Scope table                               |
| Name-confirm delete guard              | New modal                                | `AccountDeletionModal` precedent                                        | Established pattern                                                    |
| Preset avatar enforcement              | Validation logic                         | `child_profiles.avatar_id` FK → `avatars`                               | Structural — no column an arbitrary URL can occupy                     |

**Key insight:** Nearly every "new" capability in this phase already exists as a `studentId`-parameterized function whose only defect is that its callers pass `session.user.id`. The work is threading the active-child id, not building mechanisms.

## Runtime State Inventory

> This is a client rescoping phase, not a data migration. "State" here = client caches/keys, not server data.

| Category                 | Items Found                                                                                                                                                   | Action Required                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Stored data (client)     | `localStorage`: NEW `active_child_id` key (D-04); `shown-accessory-unlocks-${user.id}` (`useVictoryState.js:127`) keyed on parent id → bleeds across children | Add active-child key to logout purge; re-key accessory-unlock key to `activeChildId` |
| Live service config      | None — no external service holds child-switch state. `[VERIFIED: no push/cron config keyed on active-child]`                                                  | None                                                                                 |
| OS-registered state      | None. `[VERIFIED: no OS registration involved]`                                                                                                               | None                                                                                 |
| Secrets/env vars         | None new. `[VERIFIED: no new env vars — VAPID/CRON untouched]`                                                                                                | None                                                                                 |
| Build artifacts          | None. Pure source changes.                                                                                                                                    | None                                                                                 |
| React Query cache        | ~17 child-scoped key shapes keyed on `user.id`; **2 unkeyed** (`["streak-state"]` StreakDisplay:112, `["scores"]` useScores:17) that cannot self-isolate      | Rescope keys to include `activeChildId`; clear all on switch                         |
| Module-scoped singletons | `streakService.js:9-20` in-flight/cooldown vars are process-global (not per-child)                                                                            | Reset on switch or key by childId (Pitfall below)                                    |

**Server-side runtime state:** Nothing in this phase changes stored DB data. New children INSERT rows; delete/deactivate operate through existing cascade/column mechanisms. `[VERIFIED: RLS + cascade trigger already applied]`

## React Query Key Inventory (concrete — sizes the rescoping wave)

`[VERIFIED: grep of src in-session]`

**Child-scoped — MUST rescope to `activeChildId`:**
| Query key (today) | File(s) | queryFn |
|---|---|---|
| `["earned-achievements", user?.id]` | AchievementsRedesign:113, useVictoryState:149 | `getEarnedAchievements` |
| `["achievements-with-progress", user?.id]` | AchievementsRedesign:121 | `getAchievementsWithProgress` |
| `["student-xp", user?.id]` | TrailMapPage:24, ParentPortalPage:151, XPProgressCard:21, useVictoryState:454/514/537 | `getStudentXP` |
| `["student-progress", user?.id]` | ParentPortalPage:158 | `getStudentProgress` |
| `["streak-state", user?.id]` | ParentPortalPage:165, useVictoryState:116 | `streakService.getStreakState()` |
| **`["streak-state"]` (UNKEYED)** ⚠️ | StreakDisplay:112 | `streakService.getStreakState()` |
| `["practice-sessions", user?.id]` | PracticeSessions:40 | `practiceService.getPracticeSessions` |
| **`["scores"]` (UNKEYED)** ⚠️ | useScores:17 | `getStudentScores(studentId)` |
| `["student-scores", user.id]` | useVictoryState:147 | (invalidation) |
| `["user-accessories", user?.id]` | useAccessories:28, useVictoryState:181/656 | `getUserAccessories` |
| `["point-balance", user?.id]` | useAccessories:39 | `getUserPointBalance` |
| `["point-transactions", user?.id, limit]` | useAccessories:51 | `getUserPointTransactions` |
| `["user-profile", user?.id]` | useUserProfile:9 | student profile |
| `["practice-log-today", user?.id, localDate]` | PracticeLogCard:50 | `practiceLogService.getTodayStatus` |
| `["practice-streak", user?.id]` | PracticeLogCard:58, PracticeHeatmapCard:89 | `practiceStreakService.getPracticeStreak()` |
| `["practice-history", studentId]` | PracticeHeatmapCard:81 | `practiceLogService.getHistoricalLogs` |
| `["daily-challenge", user?.id, dateString]` | DailyChallengeCard:22 | `getTodaysChallenge` |

**Account/parent-scoped — DO NOT rescope (keep `user.id`):** `["user"]` (useUser), `["subscription", userId]` / `["subscription-detail", user?.id]` / `["subscription-plans", currency]` (Phase-5 parent-scoped), `["push-subscription-status", user?.id]` (planner's call — push_subscriptions FK is child-scoped, but consent is parent-level).

**Global/catalog (no id — unaffected):** `["avatars"]`, `["accessories", filters]`, `["games-categories"]`, `["gamesPlayed"]`, `["achievements"]`.

**Teacher-scoped (unaffected):** `["teacher-*"]`, `["teacherNotifications"]`, `["teacherAssignments"]`.

## auth.uid()-Internal Services (cannot be rescoped by argument today)

`[VERIFIED: grep + file reads in-session]` Each derives the id internally from `supabase.auth.getSession()`/`getUser()` and writes `student_id = session.user.id`. Under multi-child this writes to the wrong child (or, for a fresh parent, throws in `award_xp` because the parent's uid ∉ `owned_child_ids()`).

| Service / method                                                                                     | Current signature | Internal id source                                                            | Fix                                                                                           |
| ---------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `streakService.getStreakState()` / `getStreak()` / and 4 more                                        | `()`              | `session.user.id` (`:170,238,348,427,638,670`)                                | Add `childId` param; thread from callers. ⚠️ Also reset module singletons (`:9-20`) on switch |
| `practiceLogService.logPractice(localDate)` / `getTodayStatus(localDate)` / `getHistoricalLogs(...)` | no id             | `session.user.id` (`:34,82,115`)                                              | Add `childId` param                                                                           |
| `practiceStreakService.getPracticeStreak()` / …                                                      | `()`              | `session.user.id` (`:120,155,236`)                                            | Add `childId` param                                                                           |
| `notificationService.savePushSubscription(studentId, …)` / `removePushSubscription(studentId)`       | takes `studentId` | **but guards `if (user.id !== studentId) throw "Unauthorized"`** (`:224,254`) | Replace self-check with parent→child ownership check (SEC-03 landmine, Pitfall 5)             |
| `award_xp(p_student_id, …)` RPC                                                                      | takes `studentId` | callers pass `session.user.id` (e.g. `practiceLogService.js:61`)              | Callers must pass `activeChildId`. Function already authorizes `owned_child_ids()` (D-23) ✅  |

**Recommended mechanism (cleanest):** give each method an explicit `childId` parameter and pass `useActiveChildId().childId` at every call site. Rationale: the internal `getSession()` returns the _parent's_ auth, which is the correct authenticated principal for RLS — only the _target row id_ must change. Do **not** try to have services read active-child from context (services are non-React). Keep the auth principal from the session; inject the child id as data.

## verifyStudentDataAccess — parent→child ownership branch

`authorizationUtils.js:19-46` today: returns owner if `user.id === studentId`, else checks teacher connection, else throws. `[VERIFIED: file read]` This throws for a legitimate parent acting on an owned child. Add a branch between the owner check and the teacher check:

```javascript
// After the user.id === studentId branch, before the teacher-connection check:
const { data: owned } = await supabase
  .from("child_profiles")
  .select("id")
  .eq("id", studentId)
  .eq("parent_id", user.id) // RLS child_profiles_all_parent_owner already scopes this
  .maybeSingle();
if (owned)
  return { userId: user.id, isOwner: true, isTeacher: false, isParent: true };
```

This unblocks `dataExportService` (D-11) and `accountDeletionService` (D-12), both of which call `verifyStudentDataAccess` first. `[VERIFIED: dataExportService.js:66, accountDeletionService.js:113]`

## Common Pitfalls

### Pitfall 1: Sibling cache bleed via unkeyed queries (PITFALLS.md #12)

**What goes wrong:** `["streak-state"]` (StreakDisplay:112) and `["scores"]` (useScores:17) have **no id in the key**, so after a switch they serve the previous child's cached value until refetch — and a fast switch can land a game-score write on the wrong child.
**How to avoid:** Rescope both to include `activeChildId`; additionally `queryClient.removeQueries()` on switch. Prove with the multi-child device test.
**Warning signs:** XP/streak flashing the previous child's numbers after switch.

### Pitfall 2: streakService module singletons resolve cross-child

**What goes wrong:** `streakStateFetchInFlight`, `streakFetchInFlight`, cooldown timestamps (`streakService.js:9-20`) are process-global. An in-flight promise started for Child A can be returned to Child B's post-switch query (dedup returns the stale promise).
**How to avoid:** Export a `resetStreakServiceCaches()` and call it in the switch handler; or key the in-flight/cooldown state by `childId`. (Not covered by `removeQueries()` — this is module state, not React Query cache.)
**Warning signs:** First streak read after a rapid switch returns the prior child's value or a stale cooldown 0.

### Pitfall 3: Parental gate route-only bypass (PITFALLS.md #11)

**What goes wrong:** Gating the entry button leaves `/parent-portal`, subscription-cancel, and delete reachable by typed URL or back/forward cache.
**How to avoid:** `ParentGateProtectedRoute` re-checks `ParentGateContext.passed` on every mount; pass state is in-memory + short-lived (D-05). Adversarially test typed-URL and back-then-forward.
**Warning signs:** None in happy-path testing — requires an explicit adversarial pass.

### Pitfall 4: SEC-03 self-check rejects the parent (PITFALLS.md #5)

**What goes wrong:** `notificationService`'s `user.id !== studentId → throw`, `verifyStudentDataAccess`'s `user.id === studentId` — both reject a parent acting on a distinct child id. No RLS error; a hard client throw.
**How to avoid:** Add the parent→child ownership branch to every such self-check before the phase ships per-child actions.
**Warning signs:** "Unauthorized" thrown on export/delete/push for a freshly-created (non-UUID-reuse) child.

### Pitfall 5: Role duality — parent-role queries never fire

**What goes wrong:** Child-scoped queries gate on `isStudent` (useScores:19; also common in dashboard hooks). A parent-role account (fresh signup) has `isStudent=false`, so the whole data layer is inert; a naive `user.id → childId` swap without also fixing the enable-gate yields blank dashboards.
**How to avoid:** Replace `enabled: isStudent && !!user.id` with `enabled: ready && !!childId` from `useActiveChildId`.
**Warning signs:** New child lands on a blank dashboard despite data being written.

### Pitfall 6: `STUDENT_DATA_TABLES` incompleteness silently truncates export (D-11)

**What goes wrong:** `dataExportService.js:20` lists **10** tables; the Phase-1 child-scoped FK sweep covers **16** + Group B. Export/review omits real data → COPPA-03/04 incomplete.
**Missing vs the applied FK list** `[VERIFIED: cross-ref migration 20260722120000 §9 + Phase-2 Group B]`: `instrument_practice_logs`, `instrument_practice_streak`, `notifications`, `parental_consent_tokens`, `push_subscriptions`, `rate_limits`, `student_daily_challenges`, `student_unit_progress`, and (Group B) `current_streak`, `highest_streak`, `last_practiced_date`, `student_profiles`, `class_enrollments`. Planner must reconcile which belong in a parent-facing export (e.g. `rate_limits` is operational, arguably excluded).
**How to avoid:** Rebuild `STUDENT_DATA_TABLES` from the FK checklist; add a test asserting parity with the child-scoped FK set.

## Code Examples

### Per-child delete without signing the parent out (D-12)

```javascript
// accountDeletionService.js — NEW branch. Do NOT call supabase.auth.signOut().
// child_profiles row is removed by the Phase-1 cascade trigger when the students
// shadow row is deleted (trigger_cascade_delete_child_profile). Deleting students
// cascades all downstream child data (ON DELETE CASCADE FKs). VERIFIED: migration 20260722120000 §8c/§9.
export async function deleteChildProfile(childId, confirmationNickname) {
  const { isOwner } = await verifyStudentDataAccess(childId); // parent→child branch
  if (!isOwner) throw new Error("Unauthorized");
  const { data: child } = await supabase
    .from("child_profiles")
    .select("nickname")
    .eq("id", childId)
    .single();
  if (
    confirmationNickname.toLowerCase().trim() !== child.nickname.toLowerCase()
  )
    throw new Error("Name does not match");
  // Permanent, immediate (no 30-day grace — deactivate covers reversible, D-10/D-12)
  const { error } = await supabase.from("students").delete().eq("id", childId);
  if (error) throw error;
  // NO signOut — parent stays logged in.
}
```

### Deactivate (D-10)

```javascript
// child_profiles_all_parent_owner authorizes this UPDATE. Switcher must filter is_active=true.
await supabase
  .from("child_profiles")
  .update({ is_active: false })
  .eq("id", childId);
```

### Compact preset avatar grid source (D-13)

```javascript
// Reuse the existing catalog query; render inline, write avatar_id on the child row.
const { data: avatars } = useQuery({
  queryKey: ["avatars"],
  queryFn: getAvatar,
});
// on select: supabase.from('child_profiles').update({ avatar_id }).eq('id', childId)
```

## State of the Art

| Old Approach                          | Current Approach                                                       | When Changed                 | Impact                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `auth.uid() == studentId` everywhere  | Parent owns N children; active-child id decouples session from student | v4.0 (this milestone)        | The entire rescoping rationale                                          |
| RLS `student_id = auth.uid()`         | Dual: legacy + `student_id IN (SELECT owned_child_ids())`              | Phase 2 (applied 2026-08-02) | **Parent-on-behalf-of-child already authorized — no Phase-4 migration** |
| 3 independent `ParentGateMath` copies | One shared short-lived `ParentGateContext`                             | This phase (D-06)            | Consolidation                                                           |
| Fully-gated `/parent-portal`          | Split: read-only stats ungated, actions gated                          | This phase (D-08)            | Portal refactor                                                         |

**Deprecated/outdated for this phase:** the assumption (from the original PITFALLS.md, written 2026-07-21) that Phase 4 needs new RLS or a `SECURITY DEFINER is_owner_of_child()` — that helper shipped as `owned_child_ids()` in Phase 2. `[VERIFIED: 20260801120000]`

## Assumptions Log

| #   | Claim                                                                                                                               | Section            | Risk if Wrong                                                                                                                                                                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Migrated/legacy accounts still resolve as `student` role (in `students` table) and thus keep working with `activeChildId = user.id` | Summary, Pattern 1 | If a migrated account already resolves as `parent`, its dashboard would go inert until active-child is set. Planner should verify role resolution for a real migrated account before the switch wave. `[VERIFIED: apiAuth.js:140-177 checks students before parents — but which table a given live account is in is data, not verified here]` |
| A2  | `award_xp(childId)` succeeds for a freshly-created child (child ∈ owned_child_ids)                                                  | Services table     | Low — RLS/function verified; only data-dependent                                                                                                                                                                                                                                                                                              |
| A3  | `push-subscription-status` should stay parent-scoped                                                                                | Key inventory      | Push consent semantics are parent-level per COPPA; if product wants per-child push, this rescopes too                                                                                                                                                                                                                                         |
| A4  | The `apiAuth.js:230-266` purge's UUID/`_student_`/`_user_` matcher already catches all child-suffixed keys                          | Pattern 2          | A child-scoped key with a non-UUID, non-`_student_` name would survive the purge and bleed. Planner should audit key names against the matcher.                                                                                                                                                                                               |
| A5  | No new migration is required for the entire phase                                                                                   | Summary            | If a data-rights action needs a column not yet present (none found), a migration would be needed. All D-10/11/12 levers use existing columns/services. `[VERIFIED: is_active exists; cascade exists; RLS exists]`                                                                                                                             |

## Open Questions

> **Resolution status (recorded during planning, 2026-08-04):** OQ1 → delegated to Claude's discretion per
> 04-CONTEXT.md (default full remount + `removeQueries()`; measure in device test). OQ2 → **RESOLVED** by D-11 /
> Plan 04-03 (include progress/practice/achievement/notification tables; exclude operational `rate_limits`,
> `parental_consent_tokens`). OQ3 → **RESOLVED**: the SessionTimeout-reset-on-switch assertion is now part of the
> 04-VALIDATION.md multi-child device test.

1. **Full remount vs context-reaction on switch (Claude's discretion, D "switch-transition UX").**
   - Known: `key={activeChildId}` on the authenticated shell is the safest bleed-proof instrument (Pitfall 12 recommends it).
   - Unclear: remount cost on lower-end tablets (the target device).
   - Recommendation: default to full remount + `removeQueries()`; measure switch latency in the multi-child device test; downgrade to context-reaction only if remount is visibly slow.

2. **Which of the missing export tables are parent-facing (D-11).**
   - Known: 13 child-scoped tables absent from `STUDENT_DATA_TABLES`.
   - Unclear: `rate_limits`, `parental_consent_tokens` are operational/security, not "data about my child" in the COPPA-review sense.
   - Recommendation: include progress/practice/achievement/notification tables; exclude operational (`rate_limits`); record the include/exclude decision as a comment + test.

3. **SessionTimeout across a switch (from Pitfall 12 tail).**
   - Known: `SessionTimeoutContext` timers were built around "session = one student."
   - Unclear: whether they must reset on switch.
   - Recommendation: verify timers reset (not carry over) on switch during the device test; likely a no-op since the parent session is unchanged, but assert it.

## Environment Availability

> No external dependencies beyond the existing Supabase project and the applied migrations. Skipping tool-probe table.

| Dependency                                     | Required By               | Available | Notes                                  |
| ---------------------------------------------- | ------------------------- | --------- | -------------------------------------- |
| `child_profiles` + `parents` tables            | all PROFILE/COPPA reqs    | ✓         | `20260722120000` applied               |
| `owned_child_ids()` + `_parent_owner` policies | child-scoped writes/reads | ✓         | `20260801120000` applied               |
| `is_active` column                             | COPPA-06 (D-10)           | ✓         | shipped Phase 1 (D-15)                 |
| cascade-delete trigger                         | COPPA-05 (D-12)           | ✓         | `trigger_cascade_delete_child_profile` |
| `avatars` table                                | PROFILE-02 (D-13)         | ✓         | pre-existing catalog                   |

**No missing dependencies.** No new migration, env var, or package required.

## Validation Architecture

> nyquist_validation not disabled in config (`workflow` has no `nyquist_validation` key → enabled). `[VERIFIED: .planning/config.json]`

### Test Framework

| Property           | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| Framework          | Vitest ^3.2.4 + JSDOM + @testing-library/react               |
| Config file        | `vitest.config.js` (globals, setup `src/test/setupTests.js`) |
| Quick run command  | `npx vitest run src/<path>/<file>.test.jsx`                  |
| Full suite command | `npm run test:run`                                           |

Existing test coverage in-scope: `ParentPortalPage.test.jsx`, `AppSettings.cleanup.test.jsx`, `FeedbackForm.test.jsx` (all exercise `ParentGateMath`), `practiceLogService.test.js`, `practiceStreakService.test.js` (mock `supabase.auth.getSession`). 114 test files total. `[VERIFIED: find + grep in-session]`

### Phase Requirements → Test Map

| Req            | Behavior                                                 | Test Type                 | Automated Command                                                               | File Exists? |
| -------------- | -------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------- | ------------ |
| PROFILE-01     | create/rename/delete child writes `child_profiles`       | unit                      | `npx vitest run src/services/apiChildProfiles.test.js`                          | ❌ Wave 0    |
| PROFILE-02     | avatar select writes `avatar_id`, no upload path         | component                 | `npx vitest run src/components/children/ChildProfileForm.test.jsx`              | ❌ Wave 0    |
| PROFILE-03/14  | full-name heuristic warns, never blocks save             | unit                      | `npx vitest run src/utils/nicknameHeuristic.test.js`                            | ❌ Wave 0    |
| PROFILE-04     | switch sets active-child, no gate shown                  | component                 | `npx vitest run src/components/switcher/WhoIsPlayingOverlay.test.jsx`           | ❌ Wave 0    |
| **PROFILE-05** | **switch clears prior child's cache — no bleed**         | integration (multi-child) | `npx vitest run src/contexts/ActiveChildContext.bleed.test.jsx`                 | ❌ Wave 0    |
| PROFILE-06     | active-child survives reload; not used for authz         | unit                      | `npx vitest run src/hooks/useActiveChildId.test.js`                             | ❌ Wave 0    |
| COPPA-01       | gated routes render gate when not passed                 | component                 | `npx vitest run src/components/auth/ParentGateProtectedRoute.test.jsx`          | ❌ Wave 0    |
| **COPPA-02**   | **typed-URL / back-forward into gated route re-prompts** | component (adversarial)   | same file, dedicated cases                                                      | ❌ Wave 0    |
| COPPA-03/04    | export includes all child-scoped tables                  | unit                      | `npx vitest run src/services/dataExportService.test.js` (add table-parity case) | ⚠️ extend    |
| COPPA-05       | per-child delete: no signOut, name-confirm required      | unit                      | `npx vitest run src/services/accountDeletionService.test.js` (add child branch) | ⚠️ extend    |
| COPPA-06       | deactivate sets is_active=false, hides from switcher     | unit + component          | `npx vitest run src/services/apiChildProfiles.test.js`                          | ❌ Wave 0    |

### Two named acceptance tests (from PITFALLS.md pitfall→phase map)

- **Multi-child no-bleed (PROFILE-05):** create ≥2 children, populate distinct cached XP/streak/scores, switch, assert the new child's queries never return the prior child's values and no write lands on the wrong `child_profile_id`. Cover the two **unkeyed** queries explicitly. Use the same-origin **iframe** geometry harness if any UI assertion is needed (per project memory: `resize_window` is a no-op). `[CITED: PITFALLS.md Pitfall 12; MEMORY feedback_mobile_width_verification]`
- **Gate bypass (COPPA-02):** render a gated route directly (typed URL) with no open gate window → assert `ParentGateMath` shown; solve, navigate to a child surface, hit back → assert gate re-prompts (in-memory pass was cleared). `[CITED: PITFALLS.md Pitfall 11]`

### Sampling Rate

- **Per task commit:** the touched file's quick run command.
- **Per wave merge:** `npm run test:run`.
- **Phase gate:** full suite green + the two named acceptance tests + a manual owner smoke test on a real multi-child parent account (per this repo's precedent that per-account checks catch what mocks miss).

### Wave 0 Gaps

- [ ] `src/hooks/useActiveChildId.test.js` — role-duality resolution (student→user.id, parent→localStorage), reload persistence (PROFILE-06)
- [ ] `src/contexts/ActiveChildContext.bleed.test.jsx` — switch clears cache incl. unkeyed queries + module singletons (PROFILE-05)
- [ ] `src/components/auth/ParentGateProtectedRoute.test.jsx` — mount re-check + adversarial URL/back (COPPA-01/02)
- [ ] `src/services/apiChildProfiles.test.js` — CRUD + deactivate (PROFILE-01/02/06, COPPA-06)
- [ ] `src/utils/nicknameHeuristic.test.js` — non-blocking warn, false-positive tuning (PROFILE-03/14)
- [ ] Extend `dataExportService.test.js` — assert `STUDENT_DATA_TABLES` parity with child-scoped FK set (COPPA-03/04)
- [ ] Extend `accountDeletionService.test.js` — per-child no-signout branch + name-confirm (COPPA-05)
- [ ] `src/services/streakService` — add a `reset()`-on-switch test (Pitfall 2)
- [ ] No framework install needed (Vitest present)

## Security Domain

> `security_enforcement` not present in config → treat as enabled.

### Applicable ASVS Categories

| ASVS Category         | Applies           | Standard Control                                                                                                              |
| --------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| V1 Architecture       | yes               | Active-child is UI-only; authorization is server-side RLS ownership (D-04)                                                    |
| V4 Access Control     | **yes (central)** | `owned_child_ids()` RLS on every child table (applied); `verifyStudentDataAccess` parent→child branch (defense-in-depth)      |
| V5 Input Validation   | yes               | Nickname heuristic (D-14) is UX only; RLS/type constraints are the guard. Delete name-confirm is case-insensitive exact match |
| V3 Session Management | yes               | Gate-passed state in-memory + short-lived; **never** persisted (D-06); closes on blur/timeout/switch (COPPA-02)               |
| V6 Cryptography       | no                | None introduced this phase                                                                                                    |
| V7 Errors/Logging     | yes               | Per Phase-3 posture: do not log child-switch or gate events as analytics around minors                                        |

### Known Threat Patterns

| Pattern                                                               | STRIDE                             | Standard Mitigation                                                                                                  |
| --------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Child navigates directly to a parent-only URL                         | Elevation of Privilege             | Route-level gate re-checked per mount (Pitfall 11)                                                                   |
| Gate pass lingers for the next person on shared device                | Elevation of Privilege             | In-memory, short-lived, closes on blur/switch/timeout (COPPA-02)                                                     |
| Sibling data write lands on wrong child after fast switch             | Tampering                          | Clear cache + reset singletons on switch; rescope keys (Pitfall 12)                                                  |
| Client self-check (`user.id===studentId`) blocks legit parent         | Denial of Service (self-inflicted) | Parent→child ownership branch (SEC-03 landmine, Pitfall 5)                                                           |
| Active-child spoofed in localStorage to access another family's child | Elevation of Privilege             | Harmless — RLS `owned_child_ids()` rejects any id not owned by the authenticated parent (authz is server-side, D-04) |

## Project Constraints (from CLAUDE.md)

- **Redux is rhythm-only** — use React Context for active-child/gate state (matches Accessibility/Settings/Subscription providers).
- **i18n EN+HE parity, RTL-aware; `i18n.language?.startsWith("he")`** — every new string (switcher, gate, Manage Children, data-rights, nickname guidance) in both locales; never strict `=== "he"`.
- **Glassmorphism on purple gradient** — all new screens (`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`); `ParentGateMath` already conforms.
- **Supabase RLS defense-in-depth** — client checks supplement, never replace, RLS. Content gate (`isFreeNode()`) unaffected by this phase (non-trail passes `node_id: null`).
- **Dual game-route arrays** — not triggered unless a new _game_ route is added (this phase adds no game routes); Manage Children is a normal protected route.
- **No `.claude/skills/` directory exists** — the "trail-validator skill" is `scripts/validateTrail.mjs`, a prebuild data validator unrelated to this phase. `[VERIFIED: find -iname SKILL.md returned nothing]` No skill patterns apply.
- **Pre-commit:** Husky + lint-staged run ESLint + Prettier on staged files.

## Sources

### Primary (HIGH confidence — read in-session)

- `supabase/migrations/20260801120000_rls_ownership_rewrite.sql` — `owned_child_ids()`, 51 `_parent_owner` policies, `award_xp`/`check_rate_limit` re-point (the "DB already ready" finding)
- `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` — `child_profiles`/`parents`, `is_active`, `avatar_id` FK, dual FKs (16 tables), cascade + sync triggers
- `src/services/{streakService,practiceLogService,practiceStreakService,notificationService,dataExportService,accountDeletionService,authorizationUtils,apiAuth,apiAvatars}.js` — signatures, auth-internal id sources, SEC-03 self-checks, purge routine
- `src/features/authentication/{useUser,useLogout}.js`, `src/features/userData/useScores.js`, `src/hooks/useVictoryState.js`, `src/pages/ParentPortalPage.jsx`, `src/components/settings/ParentGateMath.jsx` — query keys, gate structure, role duality, localStorage bleed
- Grep inventory of `queryKey`, `user.id`, `studentId`, `auth.getSession/getUser` across `src/`
- `.planning/config.json`, `package.json`, `vitest.config.js` — validation + version facts

### Secondary (planning docs — locked inputs)

- `.planning/phases/04-child-profiles-parental-gating/04-CONTEXT.md` (D-01…D-15)
- `.planning/REQUIREMENTS.md`, `.planning/research/PITFALLS.md` (Pitfalls 5, 11, 12), phase 01/03 CONTEXT.md, ROADMAP.md

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new deps; all reuse targets read in-session
- Architecture (RLS-ready, active-child seam, gate wrapper): HIGH — grounded in applied migrations + actual code
- Rescoping inventory (keys, services): HIGH — direct grep, enumerated
- Role-duality behavior for a _specific live migrated account_: MEDIUM — mechanism verified (A1), per-account data not queried in-session
- Export table completeness decision: MEDIUM — missing tables enumerated, include/exclude is a product call (Open Q2)

**Research date:** 2026-08-04
**Valid until:** 2026-09-03 (stable — internal codebase, no fast-moving external deps)
