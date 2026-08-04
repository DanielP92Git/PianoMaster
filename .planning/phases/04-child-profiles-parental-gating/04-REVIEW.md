---
phase: 04-child-profiles-parental-gating
reviewed: 2026-08-04T00:00:00Z
depth: standard
files_reviewed: 53
files_reviewed_list:
  - src/App.jsx
  - src/components/auth/ParentGateProtectedRoute.jsx
  - src/components/auth/ParentGateProtectedRoute.test.jsx
  - src/components/children/ChildProfileForm.jsx
  - src/components/children/ChildProfileForm.test.jsx
  - src/components/children/ChildProfilePanel.jsx
  - src/components/children/ChildProfilePanel.test.jsx
  - src/components/children/DeleteChildModal.jsx
  - src/components/children/ManageChildrenScreen.jsx
  - src/components/children/ManageChildrenScreen.test.jsx
  - src/components/dashboard/DailyChallengeCard.jsx
  - src/components/dashboard/PracticeLogCard.jsx
  - src/components/dashboard/PracticeLogCard.test.jsx
  - src/components/dashboard/XPProgressCard.jsx
  - src/components/games/sight-reading-game/__tests__/SightReadingGame.mastery.test.jsx
  - src/components/layout/Header.jsx
  - src/components/parent/PracticeHeatmapCard.jsx
  - src/components/settings/NotificationPermissionCard.gate.test.jsx
  - src/components/settings/NotificationPermissionCard.jsx
  - src/components/settings/ParentGateMath.jsx
  - src/components/streak/StreakDisplay.jsx
  - src/components/switcher/WhoIsPlayingOverlay.jsx
  - src/components/switcher/WhoIsPlayingOverlay.test.jsx
  - src/contexts/ActiveChildContext.bleed.test.jsx
  - src/contexts/ActiveChildContext.jsx
  - src/contexts/ParentGateContext.jsx
  - src/features/userData/useScores.js
  - src/features/userData/useScores.test.js
  - src/hooks/useAccessories.js
  - src/hooks/useActiveChildId.js
  - src/hooks/useActiveChildId.test.js
  - src/hooks/useChildProfiles.js
  - src/hooks/useStreakWithAchievements.js
  - src/hooks/useUserProfile.js
  - src/hooks/useVictoryState.js
  - src/hooks/useVictoryState.test.js
  - src/locales/__tests__/phase4-parity.test.js
  - src/locales/en/common.json
  - src/locales/he/common.json
  - src/pages/AchievementsRedesign.jsx
  - src/pages/ParentPortalPage.jsx
  - src/pages/ParentPortalPage.test.jsx
  - src/pages/PracticeModes.jsx
  - src/pages/PracticeSessions.jsx
  - src/pages/TrailMapPage.jsx
  - src/services/accountDeletionService.js
  - src/services/accountDeletionService.test.js
  - src/services/achievementService.js
  - src/services/apiAuth.js
  - src/services/apiChildProfiles.js
  - src/services/apiChildProfiles.test.js
  - src/services/authorizationUtils.js
  - src/services/authorizationUtils.test.js
  - src/services/dataExportService.js
  - src/services/dataExportService.test.js
  - src/services/notificationService.js
  - src/services/practiceLogService.js
  - src/services/practiceLogService.test.js
  - src/services/practiceStreakService.js
  - src/services/practiceStreakService.test.js
  - src/services/streakService.js
  - src/services/streakService.test.js
  - src/utils/nicknameHeuristic.js
  - src/utils/nicknameHeuristic.test.js
  - src/utils/xpSystem.js
findings:
  critical: 4
  warning: 5
  info: 2
  total: 11
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-08-04
**Depth:** standard
**Files Reviewed:** 53 (+ cross-referenced non-listed files: `src/components/Avatars.jsx`, `src/services/apiAccessories.js`, `src/hooks/useBossUnlockTracking.js`, `src/utils/levelUpTracking.js`, `src/components/layout/Sidebar.jsx`, `supabase/functions/send-daily-push/index.ts`, `src/pages/AppSettings.jsx`, `src/pages/ParentPlaceholder.jsx`, `src/utils/avatarAssets.js` — needed to confirm/deny the deferred-gap claims in the task brief and to trace call sites for hooks in the reviewed list)

**Status:** issues_found

## Summary

This phase rescopes almost every previously `user.id`-scoped query/mutation onto an explicit `childId` (via `useActiveChildId()` / `ActiveChildContext`) and adds a shared, auto-closing parental math gate (`ParentGateContext`). The core rescoping work is solid and well-tested: `useScores`, `useVictoryState`, `streakService`, `practiceLogService`, `practiceStreakService`, `PracticeHeatmapCard`, `XPProgressCard`, `TrailMapPage`, `DailyChallengeCard`, and `PracticeLogCard` all correctly key their queries/mutations/localStorage on `childId`, and the `ActiveChildContext.switchChild()` no-bleed guarantee (cache clear + localStorage purge + streakService singleton reset) is real and tested.

However, tracing call sites beyond the files' own boundaries surfaces four BLOCKER-level regressions that the phase's own tests don't catch because they test each hook/component in isolation rather than at its actual call site:

1. `NotificationPermissionCard` is still wired to the parent's own `user.id` instead of `childId` in `ParentPortalPage.jsx` — a direct sibling of the already-fixed `streakService.setWeekendPass` bug in the same file, in the same diff, that was missed.
2. The `useAccessories.js` mutation hooks' `userId` fallback is not merely "dead code" as characterized in project notes — `Avatars.jsx` (the hooks' only caller) explicitly passes the parent's own `user.id` on every purchase/equip/unequip call, which breaks the entire avatar shop for every parent-role session post-migration.
3. `Header.jsx`'s avatar/switcher button — the only mount point for `WhoIsPlayingOverlay` anywhere in the codebase — is hidden whenever there is no active child, which is true for every brand-new parent account by design, creating a dead end with no discoverable path to create a first child.
4. `ParentGateContext`'s `CHILD_SURFACE_ROUTES` allowlist that closes the shared gate is incomplete (`/avatars`, `/settings` are reachable, un-gated, and not recognized as "child surfaces"), undermining the documented COPPA-02 "no linger" guarantee for those paths.

The two deferred/documented gaps called out in the task brief (`useBossUnlockTracking`/`levelUpTracking` keyed on `user.id`, and the accessory-mutation `userId` override) were verified against their actual call sites; the boss/level-up one is accurately described as a soft, session-scoped bleed, but the accessory one is materially worse than documented (see CR-02).

## Critical Issues

### CR-01: NotificationPermissionCard is keyed to the parent's own id, not the active child — breaks per-child push reminders and silently drops rows from the daily-push cron

**File:** `src/pages/ParentPortalPage.jsx:575` (`<NotificationPermissionCard ... studentId={user?.id} ... />`)
**Issue:**
This is the same class of bug as the already-fixed `streakService.setWeekendPass(newValue)` → `setWeekendPass(childId, newValue)` fix documented in this same file's diff, but it was missed for `NotificationPermissionCard`. Everywhere else in this file (`PracticeHeatmapCard`, `student-xp`, `student-progress`, `streak-state` queries) was correctly migrated from `user?.id` to `childId`; this one line was not (confirmed via `git diff c4fb1676..HEAD -- src/pages/ParentPortalPage.jsx`, which shows the `PracticeHeatmapCard` prop was changed from `user?.id` → `childId` in the same commit, while the `NotificationPermissionCard` prop, a few lines below in the same file, was left as `user?.id`).

`savePushSubscription`/`removePushSubscription`/`getPushSubscriptionStatus` in `src/services/notificationService.js` all document their `studentId` param as "self or an owned child" and write to `push_subscriptions.student_id`. Passing the parent's own `user.id` here means:

- The subscription row gets `student_id = <parent's auth uid>`, which is not a `students`/`child_profiles` row.
- `supabase/functions/send-daily-push/index.ts` selects `push_subscriptions` with `students!inner(...)` — an **inner join** against `students`. A row whose `student_id` is the parent's own auth id has no matching `students` row, so it is silently excluded from every cron run. The daily practice-reminder push notification feature is effectively broken for every post-v4.0 parent account that enables it through this screen.
- `verifyStudentDataAccess(studentId)` in `authorizationUtils.js` trivially "passes" this because `user.id === studentId` hits the self-access branch — so this doesn't throw, it just silently persists the wrong id.

**Fix:**

```jsx
// src/pages/ParentPortalPage.jsx (~line 575), inside the Notification Preferences section
<NotificationPermissionCard
  isRTL={isRTL}
  studentId={childId}
  onPermissionChange={() => {}}
/>
```

### CR-02: Avatar shop (purchase/equip/unequip) is wired to the parent's own id, not the active child — breaks the entire feature for parent-role sessions

**File:** `src/hooks/useAccessories.js:58-152` (`usePurchaseAccessory`, `useEquipAccessory`, `useUnequipAccessory`, `useUpdateAccessoryMetadata` — `userId = user?.id` default), called from `src/components/Avatars.jsx:513-542` with an **explicit** `userId: user.id` override on every call.
**Issue:**
The project notes characterize this as "a dead-code-path, not a live bug" because the caller passes an explicit override. That characterization is inaccurate — the override itself is the bug: `Avatars.jsx` passes `userId: user.id` (the parent's own auth id), not the active child's id, on `purchaseAccessoryMutation.mutate`, `equipAccessoryMutation.mutate`, and `unequipAccessoryMutation.mutate`. Meanwhile the **read side** of the same screen (`useOwnedAccessories` → `useUserAccessories`, `usePointBalance`) correctly resolves `childId` via `useActiveChildId()`.

Tracing into `src/services/apiAccessories.js`:

- `getUserPointBalance(userId)` does `.from("students").select("total_xp").eq("id", userId).single()`. For a parent-role session, `userId` here is the parent's own auth id, which has no row in `students` (children live under `child_profiles`/`students` keyed by the child's own id per the v4.0 migration). `.single()` on zero rows returns a Postgres error, so `getUserPointBalance` **throws** `"Failed to load student XP"`.
- `purchaseAccessory()` calls `getUserPointBalance(userId)` internally and will throw for every parent-role purchase attempt before ever reaching the insert. `equipAccessory`/`unequipAccessory` will similarly write/query `user_accessories` rows keyed to the parent's own id, which will never match anything the read side (`childId`-scoped) can see.

Net effect: for every parent-role account (i.e., every account created after this migration), the avatar shop's purchase/equip/unequip flow is broken — purchases throw, and even if they somehow succeeded they'd be invisible to the child whose progress paid for them.

**Fix:** Either (a) have `Avatars.jsx` resolve and pass `childId` via `useActiveChildId()` instead of `user.id`, or (b) remove the `userId` override parameter entirely and have the hooks in `useAccessories.js` resolve `childId` internally via `useActiveChildId()` (matching `useUserAccessories`/`usePointBalance` in the same file), consistent with how the read-side hooks already work:

```js
// src/hooks/useAccessories.js
export function usePurchaseAccessory(options = {}) {
  const { childId } = useActiveChildId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accessoryId, slotOverride }) => {
      if (!childId) throw new Error("No active child to purchase for");
      return purchaseAccessory({ accessoryId, slotOverride, userId: childId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user-accessories", childId]);
      queryClient.invalidateQueries(["point-balance", childId]);
      queryClient.invalidateQueries(["point-transactions", childId]);
      options.onSuccess?.();
    },
    onError: options.onError,
  });
}
// (mirror for useEquipAccessory / useUnequipAccessory / useUpdateAccessoryMetadata,
//  and remove the `userId: user.id` overrides from Avatars.jsx's mutate() calls)
```

### CR-03: Header's avatar/switcher button — the sole entry point to "Who's playing?" — is hidden exactly when a parent has zero/no active children, blocking first-child creation

**File:** `src/components/layout/Header.jsx:68-97` (`avatarUrl ? <button onClick={() => setSwitcherOpen(true)}>...</button> : null`)
**Issue:**
`WhoIsPlayingOverlay` (the switcher that surfaces the "Add a child" tile → `/manage-children?add=1`) is mounted **only** from `Header.jsx` — confirmed via `grep -r WhoIsPlayingOverlay src` returning just `Header.jsx` and its own test/source. The button that opens it is only rendered when `avatarUrl` is truthy:

```js
const avatarUrl =
  getAvatarImageSource(activeChildAvatar) ||
  getAvatarImageSource(
    profileData?.avatars || profileData?.avatar_url,
    profileData?.avatar_url
  );
```

- `activeChildAvatar` is `null` whenever `activeChildId` is `null` (no active child).
- `profileData` comes from `useUserProfile()`, which for a parent role is gated on `childId` (`enabled: ready && !!childId`) — so it's also `undefined`/`null` with no active child.
- `getAvatarImageSource(undefined, undefined)` returns `null` (verified in `src/utils/avatarAssets.js`).

So `avatarUrl` is falsy and the entire avatar/switcher button — and therefore the only reachable path to "Who's playing?" and `/manage-children` — disappears whenever `activeChildId` is `null`. This is precisely the state every brand-new parent account is in: `src/pages/ParentPlaceholder.jsx`'s own comment says it is "Rendered when a signed-in parent (isParent, no child profile yet — Phase 3 intentionally seeds none) reaches `/`" and explicitly has "no add-child CTA (Phase 4 scope)". Nothing in this phase's reviewed files closes that loop: `TeacherRedirect` in `App.jsx` (unmodified by this phase) still always renders `ParentPlaceholder` for `isParent` regardless of child count, and no Sidebar/Dashboard entry point to `/manage-children` exists in this phase's file set (`grep -rn "manage-children" src` returns only `ManageChildrenScreen.jsx`/`.test.jsx`, `ChildProfilePanel.jsx`, `App.jsx`, `WhoIsPlayingOverlay.jsx`/`.test.jsx`, `ParentGateContext.jsx`).

The same dead end recurs any time `activeChildId` becomes `null` again post-onboarding — e.g., after deleting the currently-active child (see WR-01) — since nothing else in the reviewed surface re-selects a fallback child or otherwise surfaces the switcher.

**Fix:** Render the switcher-opening control unconditionally (or with a distinct "add your first child" empty-state affordance) instead of gating it behind `avatarUrl`, e.g.:

```jsx
{
  isLoading ? (
    <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
  ) : (
    <button
      type="button"
      onClick={() => setSwitcherOpen(true)}
      aria-label={activeChild?.nickname || t("switcher.title")}
    >
      <div className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-full ring-2 ring-white/20 transition-all hover:ring-white">
        {avatarUrl ? (
          <img
            className="h-full w-full object-cover"
            src={avatarUrl}
            alt="User avatar"
            loading="eager"
          />
        ) : (
          <UserPlus className="h-full w-full p-2 text-white/60" /> // placeholder when no active child yet
        )}
      </div>
    </button>
  );
}
```

and/or add an explicit "Add your first child" CTA to `ParentPlaceholder.jsx` that routes to `/manage-children?add=1` directly (bypassing the header entirely for the zero-children case).

### CR-04: `CHILD_SURFACE_ROUTES` allowlist is incomplete — `/avatars` and `/settings` don't close the shared parental gate, undermining the documented COPPA-02 "no linger" guarantee

**File:** `src/contexts/ParentGateContext.jsx:18-35` (`CHILD_SURFACE_ROUTES`)
**Issue:**
The file's own header comment claims: _"The gated (parent-only) surfaces are /parent-portal, /manage-children, /settings, /subscribe, /legal. Every OTHER post-auth surface is a child surface; navigating to one closes the shared window (D-05 trigger 4)."_ Neither half of that claim holds:

- Only `/manage-children` is actually wrapped in `ParentGateProtectedRoute` in `App.jsx` — `/settings`, `/subscribe`, `/legal` render directly, unguarded, contradicting "gated (parent-only)".
- `CHILD_SURFACE_ROUTES` is `["/", "/dashboard", "/trail", "/notes-master-mode", "/rhythm-mode", "/ear-training-mode", "/practice-modes", "/practice-sessions", "/achievements", "/assignments"]` — it does **not** include `/avatars` or `/settings`, both of which are real, freely-navigable, child-reachable routes (`src/pages/AppSettings.jsx` links to `/avatars`; `src/components/layout/Dashboard.jsx` also links to `/avatars`).

Concretely: a parent solves the math gate on `/parent-portal` to manage a subscription or notifications, then leaves the shared device without navigating back through a route that's in the allowlist. If whoever picks up the device next navigates `/parent-portal → /avatars → /parent-portal` (or `→ /settings → /parent-portal`) within the 3-minute window, none of those hops fire trigger 4, so `passed` is still `true` and the subscription/notification management sections render fully unlocked with no re-solve — the exact scenario D-05/D-06/COPPA-02 were designed to prevent for `/trail`, `/dashboard`, etc.

**Fix:** Either invert the allowlist to a denylist of genuinely gated-parent-only routes (safer default — anything not explicitly parent-only closes the gate), or add the missing routes:

```js
const CHILD_SURFACE_ROUTES = [
  "/",
  "/dashboard",
  "/trail",
  "/notes-master-mode",
  "/rhythm-mode",
  "/ear-training-mode",
  "/practice-modes",
  "/practice-sessions",
  "/achievements",
  "/assignments",
  "/avatars",
  "/settings", // add: both are unguarded, child-reachable surfaces
];
```

and update the misleading header comment to reflect that only `/manage-children` is actually wrapped in `ParentGateProtectedRoute` today.

## Warnings

### WR-01: Deleting the active child doesn't clear/reassign `activeChildId`, and (combined with CR-03) leaves the app in a dead end

**File:** `src/components/children/ChildProfilePanel.jsx:102-106` (`handleDeleted`), `src/services/accountDeletionService.js:127-157` (`deleteChildProfile`)
**Issue:** When a parent deletes the currently-active child via `DeleteChildModal` → `deleteChildProfile`, `handleDeleted` only invalidates `["child-profiles", user?.id]` and closes the panel — it never calls `switchChild()` to select a remaining child. `ActiveChildContext`'s validation effect will eventually null out `activeChildId` once the invalidated `ownedChildren` list refetches and no longer contains the stored id, but nothing in the reviewed surface then prompts the parent to pick a new active child. Per CR-03, once `activeChildId` is `null` there is no way to reopen the switcher from the header, so a parent who deletes their only/active child lands in the same dead end as a brand-new account.
**Fix:** After a successful delete, if the deleted child was the active one, either auto-`switchChild()` to another remaining owned child (if any) or explicitly route the parent to `/manage-children` (already correct) while also fixing CR-03 so the switcher remains reachable for the zero-children case.

### WR-02: Level-up and boss-unlock celebration dedup keyed on the parent's own id, not the active child — confirmed as described but worth calling out precisely

**File:** `src/hooks/useVictoryState.js:112-113,584-594` (`useBossUnlockTracking(user?.id, nodeId)`, `hasLevelBeenCelebrated(user.id, ...)`, `markLevelCelebrated(user.id, ...)`)
**Issue:** Verified against `src/hooks/useBossUnlockTracking.js` and `src/utils/levelUpTracking.js`: both build a localStorage key from the id passed in (`boss-unlocked-${userId}-${nodeId}`, `celebrated-levels-${userId}-v1`). Since `useVictoryState` passes `user?.id` (the parent) rather than `childId`, two siblings hitting the same boss node or the same level threshold will share one dedup key — the second child's genuine first-time celebration is silently suppressed because the first child already "used up" the flag. This matches the task brief's description of it as a known, deferred, soft cross-child bleed (not a hard failure), and it's correctly out of scope for any of this phase's plans — flagging here only to confirm the description is accurate and to note one additional wrinkle: these keys don't match any of the prefixes/patterns `purgeChildScopedLocalStorage()` in `src/services/apiAuth.js` removes (`boss-unlocked-` and `celebrated-levels-` don't start with a preserved/removed prefix and aren't themselves bare UUIDs), so they persist indefinitely across child switches and logout, unlike the `shown-accessory-unlocks-` keys which were explicitly re-keyed and are covered by the purge matcher.
**Fix (for the eventual follow-up, not required this phase per the deferral):** pass `childId` instead of `user?.id` into both trackers, and add `boss-unlocked-` / `celebrated-levels-` to `purgeChildScopedLocalStorage()`'s removable prefixes.

### WR-03: `PracticeLogCard` invalidates a React Query key (`["xp"]`) that no query anywhere uses — XP display doesn't refresh after logging practice

**File:** `src/components/dashboard/PracticeLogCard.jsx:100`
**Issue:** `queryClient.invalidateQueries({ queryKey: ["xp"] }); // refresh XP display` — this is pre-existing (unchanged by this phase's diff, confirmed via `git diff`), but every actual XP query in the reviewed codebase (`XPProgressCard.jsx`, `TrailMapPage.jsx`, `ParentPortalPage.jsx`) uses `["student-xp", childId]`. `["xp"]` matches nothing (`grep -rn 'queryKey:\s*\["xp"\]' src` returns only this one invalidation call, no matching `useQuery`). After a practice log awards 25 XP, the XP progress bar/trail header won't reflect it until the next natural refetch interval, which is now more noticeable since XP display is correctly `childId`-scoped elsewhere in this phase.
**Fix:**

```js
queryClient.invalidateQueries({ queryKey: ["student-xp", childId] });
```

### WR-04: Dead `studentId` prop passed to `PracticeHeatmapCard`, which no longer accepts one

**File:** `src/pages/ParentPortalPage.jsx:357` (`<PracticeHeatmapCard studentId={childId} />`)
**Issue:** `PracticeHeatmapCard` (`src/components/parent/PracticeHeatmapCard.jsx`) was refactored this phase to resolve `childId` internally via `useActiveChildId()` and no longer declares any props (`export default function PracticeHeatmapCard()`). The `studentId={childId}` prop passed from `ParentPortalPage.jsx` is now silently ignored — harmless today, but it's a leftover from the pre-refactor call site that should be cleaned up to avoid confusing future readers into thinking the child id flows in via props.
**Fix:** `<PracticeHeatmapCard />`

### WR-05: `apiChildProfiles.js` mutations have no client-side ownership check, inconsistent with this phase's other services

**File:** `src/services/apiChildProfiles.js:49-110` (`renameChildProfile`, `updateChildAvatar`, `setChildActive`)
**Issue:** Unlike every other service touched in this phase (`notificationService`, `dataExportService`, `accountDeletionService`, `xpSystem.awardXP/getStudentXP`), which call `verifyStudentDataAccess(studentId)` before mutating, these three functions only check `supabase.auth.getUser()` for authentication and rely entirely on RLS (`child_profiles_all_parent_owner`) for authorization — no `.eq("parent_id", user.id)` and no defense-in-depth check. The file's own docstring explains this is intentional ("mirrors src/services/apiTeacher.js's addStudentToTeacher ... owner-scoped mutation pattern"), so this is not necessarily a bug, but it is an inconsistent pattern within the same phase that's worth a second look — if the RLS policy for `child_profiles` is ever accidentally loosened or misapplied (e.g., during the concurrent Phase 2 RLS rewrite noted in project memory), there is no client-side backstop here the way there is for every other child-scoped mutation in this phase.
**Fix:** Consider adding the same `verifyStudentDataAccess(childId)` defense-in-depth call used elsewhere, or at minimum leave a cross-reference comment noting which RLS migration this depends on so a future RLS change doesn't silently reopen this gap.

## Info

### IN-01: `ManageChildrenScreen`/`ChildProfileForm` have no error-state UI for the `useChildProfiles`/`getAvatar` queries

**File:** `src/components/children/ManageChildrenScreen.jsx:46-50`, `src/components/children/ChildProfileForm.jsx:39-42`
**Issue:** Both screens destructure only `data`/`isLoading` (or `isPending`) from their `useQuery` calls; there's no `isError`/`error` handling, so a failed fetch just silently renders an empty list/avatar grid with no explanation to the parent.
**Fix:** Add a minimal error state (e.g., "Couldn't load your children — try again") consistent with other screens in the app (e.g., `PracticeSessions.jsx`'s error branch).

### IN-02: `getAccountsReadyForDeletion()` guards on `process.env.NODE_ENV` in client bundle code

**File:** `src/services/accountDeletionService.js:258-266`
**Issue:** Not introduced by this phase, but flagged for completeness since the file was in scope: `process.env.NODE_ENV` is a Node convention; this is a Vite app where the idiomatic equivalent is `import.meta.env.DEV`/`MODE` (used correctly everywhere else in the reviewed files, e.g. `apiAuth.js`'s `import.meta.env.DEV`). Depending on the build's `define` config this check may always evaluate falsy/truthy in production bundles rather than behaving as intended.
**Fix:** `if (!import.meta.env.DEV) { ... }` for consistency with the rest of the codebase.

---

_Reviewed: 2026-08-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
