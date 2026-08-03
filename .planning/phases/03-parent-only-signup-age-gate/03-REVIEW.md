---
phase: 03-parent-only-signup-age-gate
reviewed: 2026-08-03T00:00:00Z
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
  warning: 5
  info: 6
  total: 11
status: issues_found
---

# Phase 3: Code Review Report (Re-review after 03-09 gap closure)

**Reviewed:** 2026-08-03T00:00:00Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

Re-reviewed the same 20-file scope as the prior full-phase review, after plan `03-09` landed to close **WR-01** (the under-18 block-screen race condition in `RoleSelection.jsx`).

**WR-01 verified fixed.** `handleUnder18` (`RoleSelection.jsx:139-149`) is now a pure `setBlocked(true)` with no `logout()` call, so `AuthenticatedWrapper`'s `user && !profile && !userRole` guard (`App.jsx:202`) keeps matching and `RoleSelection`/`AgeBlockScreen` stays mounted. `logout()` is deferred to the explicit "Back to login" click (`handleBackToLogin`, lines 156-163), so the `SIGNED_OUT` → `["user"]` invalidation → unmount/redirect chain can no longer race the block screen off-page before the user reads the guidance. `RoleSelection.test.jsx` now directly asserts the ordering (block screen renders with `logoutMock` uncalled, then a distinct click causes exactly one `logout()` call). This matches the intended fix shape from the prior review's recommendation ("defer the `logout()` call until the user actually clicks 'Back to login'").

The four previously-reported issues that `03-09` did **not** target (WR-02, WR-03, WR-04, and all four Info items) remain present and unchanged in the current code — they are carried forward below. This pass also found two new issues introduced or newly-surfaced by inspecting the deferred-logout code path and the pre-existing signup error classification, plus two additional Info-level observations.

No Critical/Blocker issues found: no minor ever gets a profile row or logged DOB in either flow, no child data is collected on the parent path, the age-verification insert is genuinely gated behind the DOB check in both `SignupForm` and `RoleSelection`, and there is no XSS/injection/hardcoded-secret exposure in the reviewed files.

## Warnings

### WR-01 (carried, unchanged): DOB day-of-month is never bounds-checked, so invalid dates silently roll over into a different (accepted) date

**File:** `src/utils/ageUtils.js:54-79`, `src/components/auth/AgeGate.jsx:80-97`

**Issue:** `dobPartsToDate` builds the date with the native `Date` constructor, which silently rolls over out-of-range days (e.g. `new Date(2000, 1, 30)` for "Feb 30, 2000" becomes March 1, 2000):

```js
export function dobPartsToDate({ month, day, year }) {
  return new Date(year, month - 1, day);
}
```

`isValidDOB` never checks that the constructed date's month/day still match the input, and the `Day`/`Year` fields in `AgeGate.jsx` are plain `type="number"` inputs with no `min`/`max` attributes (unlike `Month`, which is constrained via a `<select>`). A user can type day `32`, `0`, or a negative number and have it silently accepted as a _different_ date than what they typed, with no error shown — the resulting age check runs against the rolled-over date, not the value the user entered.

**Fix:**

```js
export function isValidDOB({ month, day, year }) {
  if (!month || !day || !year) return false;
  const date = dobPartsToDate({ month, day, year });
  if (date.getMonth() !== month - 1 || date.getDate() !== Number(day))
    return false; // catches rollover
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

### WR-02 (carried, unchanged): Profile-row insert failures are silently swallowed in useSignup.js, leaving the user in an inconsistent "success" state

**File:** `src/features/authentication/useSignup.js:76-118`

**Issue:** Both the teacher and parent branches deliberately don't propagate DB errors:

```js
if (teacherError) {
  // Don't throw here - let the user complete signup even if profile creation fails
}
...
if (parentError) {
  // Don't throw here - let the user complete signup even if profile creation fails
  console.warn("Parent record creation warning:", parentError);
}
```

If either upsert fails (RLS misconfiguration, network blip, constraint violation), `mutationFn` still resolves successfully, `onSuccess` fires (success toast, `navigate("/")`), but no `parents`/`teachers` row exists. `getCurrentUser()` then resolves `userRole: null`, and `AuthenticatedWrapper` bounces the freshly-"successful" user straight back into `RoleSelection` with no explanation. For the parent branch specifically, this means the row this phase's migration exists to populate (`age_verified_at`) can silently fail to be written while the UI reports success.

**Fix:** At minimum, report to error monitoring (e.g. Sentry) in both branches, and consider a distinguishable warning toast rather than the unconditional success toast.

### WR-03 (carried, unchanged): Age-gate error copy is stale — still references "birth year" from the old year-only picker, not the new M/D/Y fields

**File:** `src/components/auth/AgeGate.jsx:38-39`, `src/locales/en/common.json:123`, `src/locales/he/common.json:123`

**Issue:** The validation-failure branch shows `t("auth.signup.ageGate.errorInvalid")`, which resolves to `"Please select a valid birth year"` (Hebrew equivalent). This is a holdover from the previous year-only `<select>` DOB gate. The new open-field gate can fail validation for reasons unrelated to the year (an out-of-range day per WR-01 above, a future date caused by a wrong day/month, etc.), yet the message always blames "birth year," confusing a user who mistyped day or month. (`AgeGate.test.jsx:89-91` currently locks in this exact stale string as expected behavior, so fixing the copy requires updating the test too.)

**Fix:** Add a dedicated `dobGate.errorInvalid` key ("Please enter a valid date of birth") and switch `AgeGate.jsx` to use it; remove the now-dead `ageGate.question`/`.label`/`.selectYear`/`.errorRequired` keys.

### WR-04 (new): `handleBackToLogin`'s `await logout()` has no error handling — a rejected sign-out leaves the blocked user stuck with no feedback

**File:** `src/components/auth/RoleSelection.jsx:156-163`

**Issue:** The deferred sign-out introduced by the WR-01 fix is:

```js
const handleBackToLogin = async () => {
  await logout();
};
```

`apiAuth.js`'s `logout()` is explicitly documented to `@throws {Error} If Supabase signOut fails`. `handleBackToLogin` is wired directly as `AgeBlockScreen`'s `onBackToLogin` → `AuthCta`'s `onClick`, with no `try`/`catch`. If `supabase.auth.signOut()` fails (network blip, revoked session, etc.), the rejection is unhandled — it surfaces only as an unhandled-promise-rejection console error, `queryClient.invalidateQueries` for `["user"]` never fires from this path, and the user is left staring at the same block screen with no error message and no way to tell whether the click did anything. There's also no button-level pending/disabled state, so a slow or failing `logout()` invites repeated clicks.

**Fix:** Wrap in try/catch and surface a toast/error state on failure, and/or disable the button while the call is in flight:

```js
const handleBackToLogin = async () => {
  try {
    await logout();
  } catch (err) {
    console.error("Sign-out failed:", err);
    toast.error(t("auth.errors.generic"));
  }
};
```

### WR-05 (new): `useSignup.js` misclassifies _any_ 400-status signUp error as "account already exists," masking real validation failures

**File:** `src/features/authentication/useSignup.js:56-67`

**Issue:**

```js
if (authError) {
  if (
    authError.message?.toLowerCase().includes("already exists") ||
    authError.message?.toLowerCase().includes("already registered") ||
    authError.status === 400
  ) {
    throw new Error(
      "An account with this email already exists. Please log in instead."
    );
  }
  throw new Error(authError.message);
}
```

Supabase's `auth.signUp` returns HTTP 400 for a wide range of validation failures that have nothing to do with an existing account — e.g. "Password should be at least 6 characters," "Unable to validate email address: invalid format," disposable-domain rejection, etc. The bare `authError.status === 400` clause catches all of these and rewrites them to the fixed English string `"An account with this email already exists. Please log in instead."`. That string is then fed into `authErrorKey()` (`src/features/authentication/authErrorKey.js:23-28`), which matches `"already exists"` and maps it to `auth.errors.accountExists` — so a user who typed a too-short password sees "an account already exists," is told to log in instead, and never learns the real reason their signup failed. This is a pre-existing pattern (not introduced by this phase's DOB-gate work) but sits directly in the parent/teacher signup path this phase modified and is worth flagging while the file is in scope.

**Fix:** Match on the message text only, not the generic status code:

```js
if (
  authError.message?.toLowerCase().includes("already exists") ||
  authError.message?.toLowerCase().includes("already registered")
) {
  throw new Error(
    "An account with this email already exists. Please log in instead."
  );
}
throw new Error(authError.message);
```

## Info

### IN-01 (carried, unchanged): Dead locale keys left over from the previous year-only AgeGate

**File:** `src/locales/en/common.json:117-123`, `src/locales/he/common.json:117-123`

**Issue:** `auth.signup.ageGate.question`, `.label`, `.selectYear`, and `.errorRequired` are no longer referenced anywhere in `AgeGate.jsx` (only `.continue` and `.errorInvalid` are still used — see WR-03). Leftover from the old birth-year-dropdown implementation.

**Fix:** Remove the unused keys, or fold `.continue`/`.errorInvalid` into the `dobGate` namespace and delete `ageGate` entirely.

### IN-02 (carried, unchanged): OAuth `signup_mode`/`role` query params sent to Google are never read back on callback

**File:** `src/services/apiAuth.js:337-338`

**Issue:** `socialAuth()` forwards `signup_mode: true` and `role` as `queryParams` to Google's OAuth consent screen when `mode === "signup"`. No code in the reviewed set reads these values back after redirect — role assignment for new OAuth users is decided entirely inside `RoleSelection.jsx` post-login, which is good for the age-gate's integrity, but the sent-and-discarded params are confusing dead code.

**Fix:** Remove the unused params, or add a comment noting they're currently inert.

### IN-03 (carried, unchanged): `age_verified_at` marker is persisted only for parents, not teachers, despite both roles passing the same DOB gate

**File:** `supabase/migrations/20260803120000_add_parent_age_verified.sql`, `src/features/authentication/useSignup.js:76-97`, `src/components/auth/RoleSelection.jsx:78-94`

**Issue:** Both `SignupForm.jsx` and `RoleSelection.jsx` route teacher signups through the same `AgeGate` (D-01: "every role goes through the DOB gate"), but the migration only adds `age_verified_at` to `parents`; `teachers` has no equivalent column, and neither write site persists one for the teacher branch.

**Fix:** Confirm with the phase owner whether this asymmetry is intentional (parents are the COPPA-relevant party) or whether `teachers` should get a matching column.

### IN-04 (carried, unchanged): `age_verified_at` is set from client clock rather than a DB-generated timestamp

**File:** `src/features/authentication/useSignup.js:107`, `src/components/auth/RoleSelection.jsx:106`

**Issue:** Both write sites use `new Date().toISOString()` computed client-side rather than a Postgres `now()` default/trigger. Low-impact since DOB itself is already self-attested, but a client-supplied timestamp is a weaker audit trail than a DB-stamped one.

**Fix:** Consider `age_verified_at TIMESTAMPTZ NOT NULL DEFAULT now()` set via a dedicated RPC/trigger rather than accepted verbatim from the client payload.

### IN-05 (new): `PARENT_STEPS`/`TEACHER_STEPS` in `SignupForm.jsx` are identical arrays — the role-based branch is dead differentiation

**File:** `src/components/auth/SignupForm.jsx:18-19, 31-33`

**Issue:**

```js
const PARENT_STEPS = ["role", "dob-gate", "credentials"];
const TEACHER_STEPS = ["role", "dob-gate", "credentials"];
...
function StepDots({ step, role, className = "" }) {
  const steps = role === "teacher" ? TEACHER_STEPS : PARENT_STEPS;
```

Since D-01 put both roles through the identical `role → dob-gate → credentials` sequence, the two arrays are duplicates and the `role === "teacher" ? ... : ...` branch in `StepDots` always resolves to the same array either way. Harmless today, but it reads as if the two roles have (or might diverge into) different step counts, which is misleading for a future maintainer and easy to get subtly wrong if one array is edited without the other.

**Fix:** Collapse to a single `STEPS` array (mirroring `RoleSelection.jsx`'s own `STEPS` constant) and drop the now-pointless `role` prop from `StepDots`.

### IN-06 (new): Under-18 OAuth session now persists indefinitely until the user explicitly clicks "Back to login"

**File:** `src/components/auth/RoleSelection.jsx:139-163`

**Issue:** This is the expected trade-off of the WR-01 fix (deferring `logout()` off the render path), not a regression, but worth recording as a residual consideration: an under-18 user who reaches the block screen and then simply closes the tab, navigates away in-browser, or leaves it idle keeps a live, profile-less OAuth session (no automatic sign-out, no idle timer tied to this screen) until the token naturally expires or they return and click "Back to login." Since `AuthenticatedWrapper`'s guard (`App.jsx:202`) forces any authenticated-but-profile-less user back into `RoleSelection` regardless of the URL they navigate to, they can't reach any protected app surface with that session — but the session itself is not proactively terminated.

**Fix:** No action required unless product/security wants a stricter guarantee (e.g., a `beforeunload`/visibility-based sign-out, or a short-lived idle timeout specific to the blocked state). Documenting here so it's a conscious trade-off rather than an unnoticed side effect.

---

_Reviewed: 2026-08-03T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
