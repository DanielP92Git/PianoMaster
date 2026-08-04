# Phase 4: Child Profiles & Parental Gating - Pattern Map

**Mapped:** 2026-08-04
**Files analyzed:** 24 (9 new, 15 modified)
**Analogs found:** 24 / 24

## File Classification

| New/Modified File                                                      | Role           | Data Flow        | Closest Analog                                                                                                               | Match Quality                                |
| ---------------------------------------------------------------------- | -------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `src/contexts/ActiveChildContext.jsx` (NEW)                            | provider       | event-driven     | `src/contexts/SettingsContext.jsx`                                                                                           | role-match                                   |
| `src/contexts/ParentGateContext.jsx` (NEW)                             | provider       | event-driven     | `src/contexts/SettingsContext.jsx` (structure) + `ParentGateMath.jsx` (mechanism)                                            | role-match                                   |
| `src/hooks/useActiveChildId.js` (NEW)                                  | hook           | request-response | `src/features/authentication/useUser.js`                                                                                     | role-match                                   |
| `src/hooks/useChildProfiles.js` (NEW)                                  | hook           | CRUD (read)      | `src/hooks/useAccessories.js` (React Query wrapper hook)                                                                     | role-match                                   |
| `src/services/apiChildProfiles.js` (NEW)                               | service        | CRUD             | `src/services/apiTeacher.js` (`addStudentToTeacher`/`removeStudentFromTeacher`/`updateStudentDetails`)                       | exact (owned-child CRUD by a different user) |
| `src/components/auth/ParentGateProtectedRoute.jsx` (NEW)               | route          | request-response | `src/ui/ProtectedRoute.jsx`                                                                                                  | exact                                        |
| `src/components/switcher/WhoIsPlayingOverlay.jsx` (NEW)                | component      | request-response | `src/components/settings/ParentGateMath.jsx` (scrim/card shell)                                                              | role-match                                   |
| `src/components/children/ManageChildrenScreen.jsx` (NEW)               | component      | CRUD             | `src/pages/ParentPortalPage.jsx` (page shell + gated sections)                                                               | role-match                                   |
| `src/components/children/ChildProfileForm.jsx` (NEW)                   | component      | CRUD             | `src/components/Avatars.jsx` (for the avatar grid `getAvatar()` fetch only — do NOT copy its account-binding) + a plain form | partial                                      |
| `src/components/layout/Header.jsx` (EDIT)                              | component      | request-response | itself (change one click target)                                                                                             | exact                                        |
| `src/App.jsx` (EDIT)                                                   | provider/route | request-response | itself (provider nesting + Route list)                                                                                       | exact                                        |
| `src/services/apiAuth.js` (EDIT — extract purge)                       | service        | CRUD             | itself (`logout()` purge routine ~L227-280)                                                                                  | exact                                        |
| `src/features/authentication/useLogout.js` (EDIT — reference only)     | hook           | event-driven     | itself                                                                                                                       | exact                                        |
| `src/services/dataExportService.js` (EDIT)                             | service        | file-I/O         | itself (`STUDENT_DATA_TABLES` ~L20)                                                                                          | exact                                        |
| `src/services/accountDeletionService.js` (EDIT — add per-child branch) | service        | CRUD             | itself (`requestAccountDeletion` ~L39-101)                                                                                   | exact                                        |
| `src/services/authorizationUtils.js` (EDIT)                            | service        | request-response | itself (`verifyStudentDataAccess` ~L19-46)                                                                                   | exact                                        |
| `src/services/streakService.js` (EDIT — add childId param)             | service        | CRUD             | itself (module singletons ~L9-20; `auth.getSession()` internal calls)                                                        | exact                                        |
| `src/services/practiceLogService.js` (EDIT — add childId param)        | service        | CRUD             | `streakService.js` (same fix shape)                                                                                          | exact                                        |
| `src/services/practiceStreakService.js` (EDIT — add childId param)     | service        | CRUD             | `streakService.js` (same fix shape)                                                                                          | exact                                        |
| `src/services/notificationService.js` (EDIT — replace self-check)      | service        | CRUD             | itself (`savePushSubscription`/`removePushSubscription` ~L220-260)                                                           | exact                                        |
| `src/pages/ParentPortalPage.jsx` (EDIT — split gate)                   | page           | request-response | itself (gate/query block ~L125-300)                                                                                          | exact                                        |
| ~17 React Query key call sites (EDIT)                                  | hook (various) | CRUD             | `src/features/userData/useScores.js` (unkeyed `["scores"]` + `isStudent`-gated `enabled`)                                    | exact                                        |
| `src/utils/nicknameHeuristic.js` (NEW)                                 | utility        | transform        | none in-repo (pure string heuristic) — see "No Analog Found"                                                                 | none                                         |
| `src/services/apiAvatars.js` (reference, unmodified)                   | service        | CRUD (read)      | itself — reused as-is by `ChildProfileForm.jsx`                                                                              | exact                                        |

## Pattern Assignments

### `src/contexts/ActiveChildContext.jsx` (provider, event-driven)

**Analog:** `src/contexts/SettingsContext.jsx` (full file read, 250 lines)

**Imports pattern** (lines 1-14):

```javascript
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useUser } from "../features/authentication/useUser";
import {
  getUserPreferences,
  updateUserPreferences,
} from "../services/apiSettings";
import { toast } from "react-hot-toast";
```

Swap `apiSettings` for the new `apiChildProfiles` and add `useQueryClient` from `@tanstack/react-query` (needed for the switch-clear routine).

**Provider/context shape** (lines 42-44, 218-235):

```javascript
const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const { user } = useUser();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  ...
  const value = { preferences, isLoading, isSaving, error, updatePreference, ... };
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- context provider and hook are co-located by design
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
};
```

`ActiveChildContext.jsx` follows this exact shape: `ActiveChildProvider` + co-located `useActiveChild()` hook, `createContext()` with the same "must be used within provider" guard, and the same eslint-disable comment (the codebase already has this exact pattern for provider+hook co-location).

**Load-before-first-query pattern (D-04):** `SettingsContext`'s `loadPreferences` runs in a `useEffect` gated on `user?.id` and sets `isLoading` — `ActiveChildContext` must do the equivalent: read `localStorage.getItem("active_child_id")`, validate it against the owned-children list (`apiChildProfiles.getChildProfiles()`), and only then flip a `ready` flag — mirroring `isLoading`/`setIsLoading(false)` in the `finally` block (lines 88-90).

**Switch handler (clear-then-set), derived from Pattern 2 in RESEARCH.md + `useLogout.js`:**

```javascript
// src/features/authentication/useLogout.js (full file, 18 lines) — the exact clear template
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: logout, isPending } = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.removeQueries();
      navigate("/login", { replace: true });
    },
  });
  return { logout, isPending };
}
```

`ActiveChildContext.switchChild(nextChildId)` reuses `queryClient.removeQueries()` verbatim, but must NOT call `navigate("/login")` or `logoutApi` — instead it calls a new `purgeChildScopedLocalStorage()` (extracted from `apiAuth.js` logout purge below) and then `localStorage.setItem("active_child_id", nextChildId)`.

---

### `src/contexts/ParentGateContext.jsx` (provider, event-driven)

**Analog:** `src/contexts/SettingsContext.jsx` structure (createContext/Provider/hook triad) + `src/components/settings/ParentGateMath.jsx` (the locked gate mechanism it wraps) + `src/pages/ParentPortalPage.jsx` gate usage (lines 133, 281-287).

**Current mount-local gate state to lift** (`ParentPortalPage.jsx` lines 132-133, 281-290):

```javascript
// Gate state — true means gate is visible, false means portal content is visible
const [gateOpen, setGateOpen] = useState(true);
...
{gateOpen && (
  <ParentGateMath
    onConsent={() => setGateOpen(false)}
    onCancel={() => navigate(-1)}
    isRTL={isRTL}
  />
)}
{!gateOpen && ( /* portal content */ )}
```

`ParentGateContext` replaces this per-page `useState(true)` with a shared `{ passed, pass(), closeGate() }` — `pass()` sets an in-memory timestamp (never `localStorage`/`sessionStorage`, per D-06) and starts a ~3-minute timer; `closeGate()` is called on `visibilitychange`/`blur`, on `ActiveChildContext.switchChild()`, and on route change into a listed "child surface" path. `passed` is computed as `Date.now() - passedAt < WINDOW_MS`.

**Gate mechanism (unchanged, locked)** — full file read, `src/components/settings/ParentGateMath.jsx` (134 lines): generates a two-digit addition problem (lines 10-14), glass modal shell (lines 51-56: `fixed inset-0 z-50 ... bg-black/60 backdrop-blur-sm` scrim + `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl` card), `onConsent`/`onCancel`/`isRTL` props (line 25), 3-attempt hint (lines 104-108). Its i18n keys (`pages.settings.notifications.parentGate.*`) must be generalized to a shared `parentGate.*` namespace per the UI-SPEC — this is a locale-key rename only, the component itself is untouched.

---

### `src/hooks/useActiveChildId.js` (hook, request-response)

**Analog:** `src/features/authentication/useUser.js` (full file, 44 lines)

**Query-hook shape to mirror:**

```javascript
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../../services/apiAuth";

export function useUser() {
  const { isLoading, data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
    ...
  });
  return {
    user,
    isAuthenticated: user?.role === "authenticated",
    isTeacher: user?.isTeacher || false,
    isStudent: user?.isStudent || false,
    isParent: user?.isParent || false,
    ...
  };
}
```

`useActiveChildId()` is a plain composing hook (not its own query) that reads `useUser()` for role duality and `useContext(ActiveChildContext)` for the localStorage-backed id, returning `{ childId, ready }` per RESEARCH.md Pattern 1. Role-duality branch (`isStudent` legacy vs `isParent` fresh signup) is copied directly from the `isTeacher`/`isStudent`/`isParent` flags this hook already exposes (lines 36-38).

---

### `src/hooks/useChildProfiles.js` (hook, CRUD-read)

**Analog:** `src/hooks/useAccessories.js` (React Query wrapper conventions — `["user-accessories", user?.id]` key shape) — use the same shape but rename to `["child-profiles", parentId]` per RESEARCH.md's Recommended Structure. Query fn is the new `apiChildProfiles.getChildProfiles(parentId)`.

---

### `src/services/apiChildProfiles.js` (service, CRUD)

**Analog:** `src/services/apiTeacher.js` — `addStudentToTeacher` (lines 260-314), `removeStudentFromTeacher` (lines 513-534), `updateStudentDetails` (lines 564-...). This is the strongest analog in the codebase: a service where one authenticated user (teacher) creates/updates/deletes rows scoped to a _different_ person (student), gated by an ownership check before the mutation.

**Auth-fetch + ownership-scoped mutation pattern** (lines 260-266, 513-527):

```javascript
export const addStudentToTeacher = async (studentData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    ...
```

```javascript
export const removeStudentFromTeacher = async (studentId) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error: connectionError } = await supabase
      .from("teacher_student_connections")
      .delete()
      .eq("teacher_id", user.id)
      .eq("student_id", studentId);

    if (connectionError) throw connectionError;
    return { success: true, message: "Student removed successfully" };
  } catch (error) {
    console.error("Error removing student from teacher:", error);
    throw error;
  }
};
```

`apiChildProfiles.js` mirrors this exactly, substituting `teacher_id` → `parent_id` and `teacher_student_connections` → `child_profiles`:

```javascript
export async function createChildProfile({ nickname, avatarId }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("child_profiles")
    .insert([
      { parent_id: user.id, nickname, avatar_id: avatarId, is_active: true },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameChildProfile(childId, nickname) {
  /* .update({ nickname }).eq('id', childId) */
}
export async function updateChildAvatar(childId, avatarId) {
  /* .update({ avatar_id: avatarId }).eq('id', childId) */
}
export async function setChildActive(childId, isActive) {
  /* .update({ is_active: isActive }).eq('id', childId) — D-10 */
}
export async function getChildProfiles(parentId) {
  /* .select('*').eq('parent_id', parentId) */
}
```

RLS (`child_profiles_all_parent_owner`, already applied) enforces `parent_id = auth.uid()` server-side — the client omits an extra ownership SELECT for the write path (unlike `updateStudentDetails`'s explicit pre-check, lines 571-581) because the DB-level `WITH CHECK` already rejects a mismatched `parent_id`. Follow `updateStudentDetails`'s explicit-check style only where the RESEARCH.md's `verifyStudentDataAccess` parent→child branch is the read gate (export/delete), not for direct `child_profiles` table writes.

---

### `src/components/auth/ParentGateProtectedRoute.jsx` (route, request-response)

**Analog:** `src/ui/ProtectedRoute.jsx` (full file, 31 lines) — this is the exact structural template named in RESEARCH.md ("mirror `ProtectedRoute`").

**Full pattern to mirror:**

```javascript
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../features/authentication/useUser";
import Spinner from "./Spinner";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <Spinner />
      </div>
    );
  }

  if (isAuthenticated) return children;
  return null;
}

export default ProtectedRoute;
```

`ParentGateProtectedRoute` swaps the `isAuthenticated`/`navigate("/login")` check for `ParentGateContext.passed` — but instead of redirecting, it **renders `<ParentGateMath onConsent={pass} onCancel={() => navigate(-1)} />` in place of `children`** when not passed (COPPA-01/02, Pitfall 3/11). Critically, the check must be a **mount-time re-check** (the `useEffect` re-runs on every mount because the component itself remounts per route, satisfying "no URL bypass"), not a value cached across renders.

---

### `src/components/switcher/WhoIsPlayingOverlay.jsx` (component, request-response)

**Analog:** `src/components/settings/ParentGateMath.jsx` for the scrim/card shell only (NOT the gate logic — this overlay is explicitly ungated per D-07).

**Scrim + card shell to copy** (lines 51-56):

```javascript
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
  <div
    className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6 space-y-5"
    dir={isRTL ? "rtl" : "ltr"}
  >
```

Widen to `max-w-lg`/grid layout per UI-SPEC (72px tiles). Header-avatar entry point to modify — `src/components/layout/Header.jsx` lines 48-56:

```jsx
{avatarUrl ? (
  <Link to="/avatars">
    <div className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-full ring-2 ring-white/20 transition-all hover:ring-white">
      <img className="h-full w-full object-cover" src={avatarUrl} alt="User avatar" loading="eager" />
      ...
```

Change `<Link to="/avatars">` to a button/`onClick` that opens `WhoIsPlayingOverlay` (D-02) — per UI-SPEC, do not resize or restyle this element, only its click target.

---

### `src/components/children/ManageChildrenScreen.jsx` (component, CRUD)

**Analog:** `src/pages/ParentPortalPage.jsx` page shell (lines 278-304) — `BackButton`, glass container, heading pattern:

```jsx
<div dir={isRTL ? "rtl" : "ltr"}>
  {gateOpen && <ParentGateMath ... />}
  {!gateOpen && (
    <div className="min-h-screen animate-fadeIn pb-8 motion-reduce:animate-none">
      <div className="mx-auto max-w-lg px-4 py-6 pb-16 sm:px-6">
        <BackButton styling="mb-6 md:hidden" />
        <h1 className="mb-6 text-2xl font-bold text-white">{t("parentPortal.parentZoneTitle")}</h1>
        <section> ... </section>
```

`ManageChildrenScreen` is wrapped by `ParentGateProtectedRoute` instead of holding its own `gateOpen` state — the page body itself keeps this exact shell/heading/section structure.

---

### `src/components/children/ChildProfileForm.jsx` (component, CRUD) — compact avatar grid (D-13)

**Analog for the avatar-fetch (do NOT copy the page, only the query):** `src/services/apiAvatars.js` (full file, 12 lines):

```javascript
import supabase from "./supabase";

export async function getAvatar() {
  const { data, error } = await supabase.from("avatars").select("*");
  if (error) {
    console.error(error.message);
    throw new Error("Games Library could not be fetched");
  }
  return data;
}
```

Reuse the existing `["avatars"]` query (already used elsewhere in the app) verbatim:

```javascript
const { data: avatars } = useQuery({
  queryKey: ["avatars"],
  queryFn: getAvatar,
});
```

Render as a 56px circular tile grid (UI-SPEC D-13); on tap call `apiChildProfiles.updateChildAvatar(childId, avatarId)`. Explicitly do **not** import from `src/components/Avatars.jsx` — it is bound to the logged-in user's own row and has accessory-layering logic out of scope for this picker (CONTEXT.md D-13).

---

### `src/App.jsx` (EDIT — provider nesting + route)

**Current provider nest** (lines 606-638):

```jsx
<QueryClientProvider client={queryClient}>
  <ErrorBoundary>
    <AccessibilityProvider>
      <SettingsProvider>
        <SessionTimeoutProvider>
          <ModalProvider>
            <RhythmProvider>
              <SightReadingSessionProvider>
                <SubscriptionProvider>
                  <div className="safe-area-app min-h-screen ...">
                    <AccessibleToaster />
                    <AppRoutes />
                    ...
```

Insert `ActiveChildProvider` and `ParentGateProvider` into this nest — `ActiveChildProvider` needs `useUser()` (already available once inside this tree) so it belongs after `SettingsProvider`/before `SubscriptionProvider` (subscription is parent-scoped and doesn't need active-child); `ParentGateProvider` can wrap immediately inside `ActiveChildProvider` since gate-closing on switch needs to observe active-child changes.

**Route list to extend** (lines 399-423, inside the existing `<ProtectedRoute>` wrapper):

```jsx
<Route path="/parent-portal" element={<ParentPortalPage />} />
<Route path="/avatars" element={<Avatars />} />
```

Add `<Route path="/manage-children" element={<ParentGateProtectedRoute><ManageChildrenScreen /></ParentGateProtectedRoute>} />` alongside these, at the same nesting level (inside the top-level `<ProtectedRoute><AppLayout /></ProtectedRoute>` route, not a new top-level route) — this phase does not touch `LANDSCAPE_ROUTES`/`gameRoutes` dual arrays (CLAUDE.md) since it adds no game route.

**QueryClient config** (lines 164-174) — unchanged; `removeQueries()` calls at switch-time use this existing `queryClient` instance, no config change needed.

---

### `src/services/apiAuth.js` (EDIT — extract purge for reuse)

**Analog:** itself — the `logout()` purge routine (lines 227-280) is the literal template to extract into a shared, exported `purgeChildScopedLocalStorage()` (minus the final `supabase.auth.signOut()` call at line 278):

```javascript
export async function logout() {
  if (typeof window !== "undefined") {
    const keysToRemove = [];
    const keysToPreserve = ["i18nextLng", "theme", "security_update_shown"];
    const prefixesToPreserve = ["accessibility_"];
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (keysToPreserve.includes(key)) continue;
      if (prefixesToPreserve.some((prefix) => key.startsWith(prefix))) continue;

      const shouldRemove =
        key.startsWith("migration_completed_") ||
        key.startsWith("trail_migration_") ||
        key.startsWith("dashboard_reminder_") ||
        key.includes("_student_") ||
        key.includes("_user_") ||
        key === "xp_migration_complete" ||
        key === "cached_user_progress" ||
        key.startsWith("sb-") ||
        uuidPattern.test(key);

      if (shouldRemove) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
```

Refactor: extract the `for` loop body into `export function purgeChildScopedLocalStorage() { ... }` (returns nothing, no `signOut`), have `logout()` call it, and have the new switch handler in `ActiveChildContext` call it too. Per A4 in RESEARCH.md, audit any new child-scoped key names (e.g. `shown-accessory-unlocks-${activeChildId}` after re-keying) against this exact matcher — UUID/`_student_`/`_user_` — and add the new `active_child_id` key itself to `keysToPreserve` (it must survive a _logout_, since it's a device-level "last active child" convenience, not per-session — confirm with planner; RESEARCH.md D-01 implies it should persist across logout/login of the same parent).

---

### `src/services/dataExportService.js` (EDIT — complete `STUDENT_DATA_TABLES`, D-11)

**Current incomplete table list** (lines 20-31):

```javascript
const STUDENT_DATA_TABLES = [
  { table: "students", idColumn: "id" },
  { table: "students_score", idColumn: "student_id" },
  { table: "student_skill_progress", idColumn: "student_id" },
  { table: "student_daily_goals", idColumn: "student_id" },
  { table: "practice_sessions", idColumn: "student_id" },
  { table: "student_achievements", idColumn: "student_id" },
  { table: "assignment_submissions", idColumn: "student_id" },
  { table: "parental_consent_log", idColumn: "student_id" },
  { table: "student_point_transactions", idColumn: "student_id" },
  { table: "user_accessories", idColumn: "user_id" },
];
```

Per RESEARCH.md Pitfall 6, add (at minimum, product-facing ones): `instrument_practice_logs`, `instrument_practice_streak`, `notifications`, `push_subscriptions`, `student_daily_challenges`, `student_unit_progress` — each following the exact `{ table, idColumn }` shape above, plus a `getTableDescription()` entry (lines 40-54) for each new table. Exclude `rate_limits`/`parental_consent_tokens` per Open Question 2 (operational, not "my child's data"). `exportStudentData`/`downloadStudentDataJSON`/`getDataSummary` (lines 64-183) are unchanged — they already iterate `STUDENT_DATA_TABLES` generically.

---

### `src/services/accountDeletionService.js` (EDIT — per-child no-signout branch, D-12)

**Current whole-account delete calls `signOut`** (lines 39-101, specifically line 94):

```javascript
export async function requestAccountDeletion(studentId, confirmationName) {
  await verifyStudentDataAccess(studentId);
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('first_name, last_name, username, account_status')
    .eq('id', studentId)
    .single();
  ...
  const normalizedInput = confirmationName.toLowerCase().trim();
  const normalizedExpected = expectedName.toLowerCase();
  if (normalizedInput !== normalizedExpected) {
    throw new Error(`Account name does not match. Please type "${expectedName}" exactly.`);
  }
  ...
  await supabase.auth.signOut();   // <-- correct for whole-account, wrong for per-child
  return { success: true, scheduledDeletion: deletionDate, message: ... };
}
```

Add a **new, separate** exported function (do not overload the existing one) — RESEARCH.md's Code Examples section already sketches it:

```javascript
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
  const { error } = await supabase.from("students").delete().eq("id", childId);
  if (error) throw error;
  // NO signOut — parent stays logged in.
}
```

Name-confirmation comparison style (`.toLowerCase().trim()` equality) is copied directly from `requestAccountDeletion`'s existing `normalizedInput !== normalizedExpected` check (line 74) — same idiom, new function.

---

### `src/services/authorizationUtils.js` (EDIT — parent→child ownership branch)

**Current function to extend** (full file, lines 19-46):

```javascript
export async function verifyStudentDataAccess(studentId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Students can access their own data
  if (user.id === studentId) {
    return { userId: user.id, isOwner: true, isTeacher: false };
  }

  // Check if user is a teacher connected to this student
  const { data: connection, error } = await supabase
    .from("teacher_student_connections")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("student_id", studentId)
    .eq("status", "accepted")
    .maybeSingle();

  if (error || !connection) {
    throw new Error("Unauthorized: No access to this student's data");
  }

  return { userId: user.id, isOwner: false, isTeacher: true };
}
```

Insert a new branch **between** the `user.id === studentId` check and the teacher-connection check (RESEARCH.md verbatim):

```javascript
// Check if user is a parent who owns this child profile
const { data: owned } = await supabase
  .from("child_profiles")
  .select("id")
  .eq("id", studentId)
  .eq("parent_id", user.id)
  .maybeSingle();
if (owned) {
  return { userId: user.id, isOwner: true, isTeacher: false, isParent: true };
}
```

This unblocks `dataExportService.exportStudentData`/`downloadStudentDataJSON` (call it at line 66) and `accountDeletionService.deleteChildProfile` (new function above) without changing either caller's contract.

---

### `src/services/streakService.js` / `practiceLogService.js` / `practiceStreakService.js` (EDIT — explicit `childId` param)

**Analog:** each other (identical fix shape across all three) — full `streakService.js` header read (lines 1-60) shows the module-scoped singleton pattern to reset on switch:

```javascript
const FETCH_COOLDOWN_MS = 60 * 1000;
let lastPracticeFetchInFlight = null;
let lastPracticeFetchFailed = false;
let lastPracticeFailureTS = 0;

const STREAK_FETCH_COOLDOWN_MS = 60 * 1000;
let streakFetchInFlight = null;
let streakFetchFailed = false;
let streakFailureTS = 0;

let streakStateFetchInFlight = null;
let streakStateFetchFailed = false;
let streakStateFailureTS = 0;
```

Each internal method currently derives its id from `supabase.auth.getSession()` (RESEARCH.md cites `streakService.js:170,238,348,427,638,670`). Fix pattern: add `childId` as the **first parameter** to every exported method (`getStreakState(childId)`, `getStreak(childId)`, etc.), keep the internal `getSession()` call only for the RLS-authorizing auth principal (do not remove it — it's still the correct authenticated caller), and use the passed `childId` for the `student_id = childId` write/read target instead of `session.user.id`. Additionally export `resetStreakServiceCaches()` that nulls the three `*FetchInFlight` singletons above and call it from `ActiveChildContext.switchChild()` (Pitfall 2 — this is module state, `removeQueries()` does not touch it).

---

### `src/services/notificationService.js` (EDIT — replace SEC-03 self-check)

**Current self-check that rejects a legitimate parent** (lines 220-224, 250-254):

```javascript
export async function savePushSubscription(studentId, subscriptionJSON) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== studentId) throw new Error("Unauthorized");
  ...
}

export async function removePushSubscription(studentId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== studentId) throw new Error("Unauthorized");
  ...
}
```

Replace `user.id !== studentId` with a call to the now-extended `verifyStudentDataAccess(studentId)` (throws its own "Unauthorized" if neither owner-self nor parent-owns-child nor teacher-connected) — this is the exact SEC-03 landmine called out in RESEARCH.md Pitfall 4, fixed by the same `authorizationUtils.js` branch used by `dataExportService`/`accountDeletionService`.

---

### `src/pages/ParentPortalPage.jsx` (EDIT — split D-08)

**Current fully-gated block to split** (lines 132-133, 149-169, 281-290):

```javascript
const [gateOpen, setGateOpen] = useState(true);
...
const { data: xpData, isLoading: xpLoading } = useQuery({
  queryKey: ["student-xp", user?.id],
  queryFn: () => getStudentXP(user.id),
  enabled: !!user?.id && !gateOpen,
  staleTime: 5 * 60 * 1000,
});
const { data: progressData, isLoading: progressLoading } = useQuery({
  queryKey: ["student-progress", user?.id],
  queryFn: () => getStudentProgress(user.id),
  enabled: !!user?.id && !gateOpen,
  staleTime: 5 * 60 * 1000,
});
const { data: streakState, isLoading: streakLoading } = useQuery({
  queryKey: ["streak-state", user?.id],
  queryFn: () => streakService.getStreakState(),
  enabled: !!user?.id && !gateOpen,
  staleTime: 60 * 1000,
});
...
{gateOpen && <ParentGateMath onConsent={() => setGateOpen(false)} onCancel={() => navigate(-1)} isRTL={isRTL} />}
{!gateOpen && ( /* everything, including Quick Stats */ )}
```

Per D-08/UI-SPEC note 7: remove `&& !gateOpen` from the three Quick Stats query `enabled` flags (they become always-visible reads, gated only by `!!user?.id`/readiness) — also rescope `user?.id` → `activeChildId` per the query-key inventory below. Replace the local `[gateOpen, setGateOpen]` `useState` with `ParentGateContext`'s shared `passed`/`ParentGateProtectedRoute` wrapping **only** the action sections (subscription cancel button, notification toggles, `handleDeleteAccountClick`). The push-consent-on-delete upsert pattern (lines 256-276) is the precedent D-10's "Pause Profile" deactivate action should follow — same `supabase.from(table).upsert(...)` + `queryClient.invalidateQueries` shape, applied to `child_profiles.is_active`.

---

### ~17 React Query key call sites (EDIT — rescope to `activeChildId`)

**Analog:** `src/features/userData/useScores.js` (full file read, relevant lines 8, 17-19, 36, 40-43) — this is simultaneously the clearest example of the bug (unkeyed query) AND the enable-gate landmine (Pitfall 5) in one file:

```javascript
const studentId = user?.id;
...
const { data: scores } = useQuery({
  queryKey: ["scores"],                              // ⚠️ UNKEYED — bleeds across children
  queryFn: () => getStudentScores(studentId),
  enabled: !!studentId && isStudent,                 // ⚠️ isStudent-gated — inert for parent role
});
...
mutationFn: (score, gameType) => updateStudentScore(studentId, score, gameType),
onSuccess: () => {
  queryClient.invalidateQueries(["student-scores", studentId]),
  queryClient.invalidateQueries(["point-balance", studentId]),
  ...
  queryClient.invalidateQueries(["earned-achievements", studentId]),
```

Fix per RESEARCH.md Pattern 1 + Pitfall 1/5, applied identically at every one of the ~17 sites enumerated in RESEARCH.md's "React Query Key Inventory" table:

1. `const { childId, ready } = useActiveChildId();` replaces `const studentId = user?.id;` (and drops the separate `isStudent` import where it was only used for the gate).
2. `queryKey: ["scores"]` → `queryKey: ["scores", childId]` (add the id to every unkeyed key).
3. `queryFn: () => getStudentScores(studentId)` → `queryFn: () => getStudentScores(childId)`.
4. `enabled: !!studentId && isStudent` → `enabled: ready && !!childId`.
5. Invalidation calls swap `studentId` → `childId` 1:1.

This same 5-step transform applies to every row in RESEARCH.md's inventory table (`AchievementsRedesign.jsx`, `TrailMapPage.jsx`, `XPProgressCard.jsx`, `useVictoryState.js`, `PracticeSessions.jsx`, `useAccessories.js`, `useUserProfile.js`, `PracticeLogCard.jsx`, `PracticeHeatmapCard.jsx`, `DailyChallengeCard.jsx`, `StreakDisplay.jsx`) — do not re-derive the pattern per file, apply this exact 5-step substitution.

---

## Shared Patterns

### Context + co-located hook (provider pattern)

**Source:** `src/contexts/SettingsContext.jsx` (full 250-line file)
**Apply to:** `ActiveChildContext.jsx`, `ParentGateContext.jsx`

```javascript
const XContext = createContext();
export const XProvider = ({ children }) => {
  const { user } = useUser();
  const [state, setState] = useState(DEFAULT);
  // load effect gated on user?.id, setIsLoading(false) in finally
  const value = { ...state, ...actions };
  return <XContext.Provider value={value}>{children}</XContext.Provider>;
};
// eslint-disable-next-line react-refresh/only-export-components -- context provider and hook are co-located by design
export const useX = () => {
  const context = useContext(XContext);
  if (!context) throw new Error("useX must be used within a XProvider");
  return context;
};
export default XContext;
```

### Cache-clear on identity change

**Source:** `src/features/authentication/useLogout.js` (full file) + `src/services/apiAuth.js:227-280`
**Apply to:** `ActiveChildContext.switchChild()`

```javascript
queryClient.removeQueries(); // useLogout.js:12
purgeChildScopedLocalStorage(); // extracted from apiAuth.js logout(), minus signOut
```

### Owner-scoped mutation on another person's row

**Source:** `src/services/apiTeacher.js` (`addStudentToTeacher`/`removeStudentFromTeacher`/`updateStudentDetails`)
**Apply to:** `apiChildProfiles.js` (all CRUD functions)

```javascript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("Not authenticated");
const { data, error } = await supabase.from(TABLE).{insert|update|delete}(...).eq(OWNER_COL, user.id)...;
if (error) throw error;
```

### Defense-in-depth authorization check

**Source:** `src/services/authorizationUtils.js:19-46` (`verifyStudentDataAccess`)
**Apply to:** `dataExportService.js`, `accountDeletionService.js`, `notificationService.js` — all call this one function before any per-child read/write/export/delete; do not duplicate its ownership logic inline.

### Route-level guard mirrors `ProtectedRoute`

**Source:** `src/ui/ProtectedRoute.jsx` (full 31-line file)
**Apply to:** `ParentGateProtectedRoute.jsx` — same `useEffect`-on-mount re-check shape, same loading-spinner branch, swap the redirect for an inline gate render.

### Name-confirmation destructive-action guard

**Source:** `src/components/teacher/AccountDeletionModal.jsx` (`isConfirmationValid`, lines 94-97) + `accountDeletionService.js:70-76` (`normalizedInput !== normalizedExpected`)
**Apply to:** the per-child "Delete Forever" modal (D-12) — same case-insensitive `.trim().toLowerCase()` equality, same disabled-until-match submit button pattern (`AccountDeletionModal.jsx` line 326: `disabled={isProcessing || !isConfirmationValid()}`).

## No Analog Found

| File                             | Role    | Data Flow | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | ------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/nicknameHeuristic.js` | utility | transform | No existing full-name-detection heuristic in the codebase; this is a small pure function (count capitalized words, exclude hyphenated/legit two-word patterns) — RESEARCH.md and CONTEXT.md D-14 specify behavior but no code precedent exists. Planner should treat this as a from-scratch pure-function utility with a co-located `.test.js` (Vitest, no DOM), following the file-organization convention of `src/utils/*.js` + `src/utils/*.test.js` siblings (e.g. `src/utils/isIOSSafari.js` pairing) rather than any specific logic analog. |

## Metadata

**Analog search scope:** `src/contexts/`, `src/hooks/`, `src/services/`, `src/features/authentication/`, `src/components/settings/`, `src/components/teacher/`, `src/components/layout/`, `src/pages/`, `src/ui/`, `src/App.jsx`
**Files scanned:** 24 target files against ~15 candidate analog files (all read in full or via targeted line ranges)
**Pattern extraction date:** 2026-08-04
