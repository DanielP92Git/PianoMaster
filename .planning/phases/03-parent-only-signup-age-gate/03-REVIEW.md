---
phase: 03-parent-only-signup-age-gate
reviewed: 2026-08-03T18:40:22Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - src/App.jsx
  - src/components/auth/AgeBlockScreen.jsx
  - src/components/auth/AgeGate.jsx
  - src/components/auth/AgeGate.test.jsx
  - src/components/auth/RoleSelection.jsx
  - src/components/auth/RoleSelection.test.jsx
  - src/components/auth/SignupForm.jsx
  - src/components/auth/SignupForm.test.jsx
  - src/features/authentication/useSignup.js
  - src/features/authentication/useSignup.test.js
  - src/features/authentication/useUser.js
  - src/locales/en/common.json
  - src/locales/he/common.json
  - src/pages/ParentPlaceholder.jsx
  - src/services/apiAuth.js
  - src/services/apiAuth.test.js
  - src/utils/ageUtils.js
  - src/utils/ageUtils.test.js
  - supabase/migrations/20260803120000_add_parent_age_verified.down.sql
  - supabase/migrations/20260803120000_add_parent_age_verified.sql
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-08-03T18:40:22Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

Reviewed the parent-only signup + 18+ age-gate implementation across both new-account entry points (`SignupForm.jsx`, the email/password wizard) and the returning-OAuth-user completion flow (`RoleSelection.jsx`), plus the supporting hook (`useSignup.js`), utility (`ageUtils.js`), service (`apiAuth.js`), and migration.

Answers to the three specific review questions:

1. **Does the under-18 block path ever write a profile row or log DOB?** No, in both flows. `SignupForm.jsx`'s `handleUnder18` only calls `setStep("age-block")` — no Supabase call of any kind, since the DOB is discarded inside `AgeGate` itself (`isUnder18` check runs before `onSubmit`/`onUnder18` fire, and only one of the two is ever called). `RoleSelection.jsx`'s `handleUnder18` calls `logout()` (clearing the already-existing OAuth session) and never calls `createProfile`. Neither path serializes the DOB into a Supabase insert, a toast, or a `console.log`.
2. **Do the parent signup/OAuth branches ever collect or write child data?** No. The parent credentials step (`SignupForm.jsx`) renders only an optional `parentName` field; `useSignup.js`'s parent branch upserts only `{ id, display_name, age_verified_at }` into `parents` — no `students` insert, no RPC call (confirmed by `useSignup.test.js`). `RoleSelection.jsx`'s parent branch is identical in shape.
3. **Is the age-verification insert genuinely gated behind DOB verification, not reachable earlier in the step machine?** Yes, in both flows. `SignupForm`'s `credentials` step (where `useSignup`'s Supabase calls happen) is only reachable via `handleDobSubmit`, itself only invoked by `AgeGate`'s `onSubmit`, itself only called when `!isUnder18(birthDate)`. `RoleSelection`'s `createProfile` mutation is likewise only invoked from `handleDobSubmit`, reached the same way. Neither wizard is URL/route-driven, so there's no deep-link or back/forward path that skips the gate.

Beyond those three questions, this review found no critical/blocker-level issues (no data written for minors, no XSS, no injection, no hardcoded secrets). It did find one cross-file bug that undermines the reliability of the under-18 messaging itself, a date-validation gap in `ageUtils.js`/`AgeGate.jsx`, silent error-swallowing in `useSignup.js`, and a stale error-copy mismatch left over from the previous year-only DOB gate design.

## Warnings

### WR-01: Under-18 block screen can be unmounted by its own logout() call before the user sees it (race condition)

**File:** `src/components/auth/RoleSelection.jsx:137-145` (cross-referenced with `src/App.jsx:202-204` and `src/ui/ProtectedRoute.jsx:10-14`)

**Issue:** In the OAuth (`RoleSelection`) flow, `handleUnder18` does:

```js
const handleUnder18 = async () => {
  await logout();
  setBlocked(true);
};
```

`logout()` calls `supabase.auth.signOut()`, which fires the `SIGNED_OUT` event on the `supabase.auth.onAuthStateChange` listener registered in `App.jsx`:

```js
supabase.auth.onAuthStateChange(async (event) => {
  ...
  queryClient.invalidateQueries({ queryKey: ["user"] });
});
```

This invalidates and refetches the `["user"]` query that `useUser()` (and thus `AuthenticatedWrapper`) depends on. `getCurrentUser()` short-circuits to `null` almost immediately once the session is gone (`getSession()` returns no session, so the function returns before ever hitting a network call). Once `user` becomes `null`, `AuthenticatedWrapper`'s render guard:

```js
if (user && !isLoading && !profile && !userRole) {
  return <RoleSelection user={user} />;
}
```

no longer matches, so `RoleSelection` — and its local `blocked` state — is unmounted, and `children` (the routed app, wrapped in `ProtectedRoute`) renders instead. `ProtectedRoute` immediately `navigate("/login")`s once `isAuthenticated` is false.

Because `setBlocked(true)` and the query-invalidation-driven refetch race each other on essentially the same microtask window, the friendly `AgeBlockScreen` (with its "Try a different date" / "Back to login" CTAs) may flicker briefly or never render at all before the user is yanked to `/login`. This directly contradicts the flow's own doc comment ("An under-18 user is signed out via logout() and shown the block screen") and the `AgeBlockScreen.jsx` docblock's promise of a "friendly under-18 dead-end." Even in the case where it does render momentarily, the "Try a different date" button leads to a doomed resubmission — the session is already gone, so a subsequent `createProfile` insert would fail RLS with no session, not because of the wizard's own validation.

This gap isn't caught by the existing tests because `RoleSelection.test.jsx` mocks `supabase`/`logout` directly and never renders through `App.jsx`'s `AuthenticatedWrapper` + `onAuthStateChange` + React Query wiring, so the unmount race can't manifest in that test harness.

**Fix:** Decouple the block-screen's visibility from the `user`-gated render guard, e.g. lift a `blockedUnder18` flag to `AuthenticatedWrapper` (or a ref/sessionStorage flag set before `logout()` resolves) and check it _before_ the `user && ...` guard so the screen stays mounted regardless of the query-invalidation-driven redirect:

```js
// AuthenticatedWrapper
if (under18Blocked) return <AgeBlockScreenRoute />; // independent of `user`
if (user && !isLoading && !profile && !userRole) {
  return <RoleSelection user={user} />;
}
```

Alternatively, defer the `logout()` call until the user actually clicks "Back to login" on the block screen, and simply stop the mutation flow without signing out immediately — showing the block screen first, signing out only on explicit dismissal.

### WR-02: DOB day-of-month is never bounds-checked, so invalid dates silently roll over into a different (accepted) date

**File:** `src/utils/ageUtils.js:54-79`, `src/components/auth/AgeGate.jsx:80-97`

**Issue:** `dobPartsToDate` builds the date with the native `Date` constructor:

```js
export function dobPartsToDate({ month, day, year }) {
  return new Date(year, month - 1, day);
}
```

JS `Date` silently rolls over out-of-range days/months (e.g. `new Date(2000, 1, 30)` for "Feb 30, 2000" becomes March 1, 2000). `isValidDOB` never checks that the constructed date's month/day still match the input:

```js
return (
  date instanceof Date &&
  !isNaN(date.getTime()) &&
  date < today &&
  date.getFullYear() > today.getFullYear() - 120
);
```

Combined with the `Day` field in `AgeGate.jsx` being a plain `type="number"` input with no `min`/`max` attributes (unlike `Month`, which is constrained to 1–12 via a `<select>`), a user can type e.g. day `32`, `0`, or a negative number and have it silently accepted as a _different_ date than what they entered, with no error shown. Because the resulting age calculation is based on the rolled-over date rather than the value the user actually typed, the DOB gate's accuracy — thin as it already is for a self-attested check — is further degraded by silent data corruption rather than a validation error.

**Fix:** Validate that the round-tripped date matches the input before accepting it, and add HTML bounds to the Day field:

```js
export function isValidDOB({ month, day, year }) {
  if (!month || !day || !year) return false;
  const date = dobPartsToDate({ month, day, year });
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return false; // catches rollover
  const today = new Date();
  return (
    !isNaN(date.getTime()) &&
    date < today &&
    date.getFullYear() > today.getFullYear() - 120
  );
}
```

```jsx
<AuthInput id="signup-dob-day" type="number" min="1" max="31" ... />
```

### WR-03: Profile-row insert failures are silently swallowed in useSignup.js, leaving the user in an inconsistent "success" state

**File:** `src/features/authentication/useSignup.js:76-118`

**Issue:** Both the teacher and parent branches deliberately don't propagate DB errors:

```js
if (teacherError) {
  // Don't throw here - let the user complete signup even if profile creation fails
  // The profile can be created later when they try to access teacher features
}
...
if (parentError) {
  // Don't throw here - let the user complete signup even if profile creation fails
  // The profile can be created later when they try to access parent features
  console.warn("Parent record creation warning:", parentError);
}
```

If either upsert fails (RLS misconfiguration, network blip, constraint violation), `mutationFn` still resolves successfully, `onSuccess` fires (`toast.success("Account created!")`, `navigate("/")`), but no `parents`/`teachers` row exists. `getCurrentUser()` will then resolve `userRole: null`, and `AuthenticatedWrapper` will bounce the freshly-"successful" user straight into `RoleSelection` again — with no explanation of what happened, and no error report reaching Sentry/monitoring (the teacher branch doesn't even `console.warn`). For the parent branch specifically, this means the very row this phase's migration exists to populate (`age_verified_at`) can silently fail to be written, with the UI reporting success regardless.

**Fix:** At minimum, log to error monitoring (e.g. `Sentry.captureException`) in both branches so failures are observable, and consider surfacing a distinguishable warning toast ("Account created, but we couldn't finish setting up your profile — please try again") rather than the unconditional success toast.

### WR-04: Age-gate error copy is stale — still references "birth year" from the old year-only picker, not the new M/D/Y fields

**File:** `src/components/auth/AgeGate.jsx:38-39`, `src/locales/en/common.json:123`, `src/locales/he/common.json:123`

**Issue:** `AgeGate.jsx`'s validation-failure branch shows:

```js
if (!isValidDOB(dob)) {
  setError(t("auth.signup.ageGate.errorInvalid"));
  return;
}
```

`auth.signup.ageGate.errorInvalid` resolves to `"Please select a valid birth year"` (Hebrew: `"אנא בחרו שנת לידה תקינה"`). This copy is a holdover from the previous year-only `<select>` DOB gate (see the `ageGate.question`/`ageGate.label`/`ageGate.selectYear` keys still sitting alongside it, all now dead/unused by the new open-field M/D/Y component). The new gate can fail validation for reasons that have nothing to do with the year field specifically — an out-of-range day (once WR-02 is fixed), a future date caused by a wrong day/month, etc. — yet the message always blames "birth year," which will confuse a user who mistyped their day or month instead.

**Fix:** Add a dedicated key under `dobGate` (e.g. `dobGate.errorInvalid`: "Please enter a valid date of birth") and update `AgeGate.jsx` to use it; remove the now-dead `ageGate.question`/`label`/`selectYear`/`errorRequired` keys in both locale files.

## Info

### IN-01: Dead locale keys left over from the previous year-only AgeGate

**File:** `src/locales/en/common.json:117-123`, `src/locales/he/common.json:117-123`

**Issue:** `auth.signup.ageGate.question`, `.label`, `.selectYear`, and `.errorRequired` are no longer referenced anywhere in `AgeGate.jsx` (only `.continue` and `.errorInvalid` are still used — see WR-04). They're leftover from the old birth-year-dropdown implementation.

**Fix:** Remove the unused keys, or fold `.continue`/`.errorInvalid` into the `dobGate` namespace and delete `ageGate` entirely for clarity.

### IN-02: OAuth `signup_mode`/`role` query params sent to Google are never read back on callback

**File:** `src/services/apiAuth.js:329-341`

**Issue:** `socialAuth()` forwards `signup_mode: true` and `role` as `queryParams` to Google's OAuth consent screen when `mode === "signup"`. No code in the reviewed set (or found via a repo-wide search for `signup_mode`/URL-param role parsing) reads these values back after the redirect completes. Role assignment for new OAuth users is — correctly — decided entirely inside `RoleSelection.jsx` post-login, which is good for the age-gate's integrity (it means there's no query-param-driven shortcut that could skip the DOB gate), but the `role`/`signup_mode` params being sent and silently discarded is confusing dead code that could mislead a future maintainer into thinking role is influenced by the OAuth request.

**Fix:** Either remove the unused params from `socialAuth()`, or add a short comment noting they're currently inert and role is decided solely by `RoleSelection` after redirect.

### IN-03: `age_verified_at` marker is persisted only for parents, not teachers, despite both roles passing the same DOB gate

**File:** `supabase/migrations/20260803120000_add_parent_age_verified.sql`, `src/features/authentication/useSignup.js:76-97`, `src/components/auth/RoleSelection.jsx:76-113`

**Issue:** Both `SignupForm.jsx` and `RoleSelection.jsx` route teacher signups through the same `AgeGate` (per the explicit `D-01` comment: "every role goes through the DOB gate — a minor cannot pick Teacher to dodge the age check"), but the migration only adds `age_verified_at` to `parents`; the `teachers` table has no equivalent column, and neither `useSignup.js` nor `RoleSelection.jsx` attempts to write one for the teacher branch. If there's ever a need to audit "this teacher account passed the 18+ gate," there's currently no persisted evidence for teachers — only for parents.

**Fix:** Confirm with the phase owner whether this asymmetry is intentional (e.g., only parent accounts need the compliance-audit marker because they're the COPPA-relevant party) or whether `teachers` should get an equivalent column for consistency.

### IN-04: `age_verified_at` is set from client clock rather than a DB-generated timestamp

**File:** `src/features/authentication/useSignup.js:107`, `src/components/auth/RoleSelection.jsx:104`

**Issue:** Both write sites use `new Date().toISOString()` computed client-side rather than a Postgres `now()` default/trigger. Since a client can already lie about the DOB itself (self-attestation), this is low-impact, but for consistency/tamper-resistance of an audit-style timestamp it would be more robust to let the database stamp it (e.g. `DEFAULT now()` combined with omitting the column from the client insert, or a trigger that overwrites any client-supplied value on insert).

**Fix:** Consider a column default (`age_verified_at TIMESTAMPTZ NOT NULL DEFAULT now()`) set only via a dedicated RPC/trigger rather than accepted verbatim from the client payload.

---

_Reviewed: 2026-08-03T18:40:22Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
