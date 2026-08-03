# Phase 3: Parent-Only Signup & Age Gate - Pattern Map

**Mapped:** 2026-08-03
**Files analyzed:** 19 (13 modify/replace, 3 new, 3 delete-or-retain/test-rewrite)
**Analogs found:** 19 / 19 (every file has an in-repo self-analog — this phase is a refactor of existing auth code, not new architecture)

## File Classification

| New/Modified File                                                                                     | Role                            | Data Flow                                 | Closest Analog                                                                                               | Match Quality |
| ----------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------- |
| `src/utils/ageUtils.js` (MODIFY — add `isUnder18`)                                                    | utility                         | transform                                 | itself (`isUnder13`, same file)                                                                              | exact         |
| `src/components/auth/AgeGate.jsx` (REWRITE)                                                           | component (wizard step)         | request-response (client-only validation) | itself (current year-dropdown version) + `ParentEmailStep.jsx` (info-banner/error pattern)                   | exact         |
| `src/components/auth/AgeBlockScreen.jsx` (NEW)                                                        | component                       | request-response (no persistence)         | `ParentEmailStep.jsx` (info banner) + `RoleSelection.jsx` (`AuthShell` full-screen usage)                    | role-match    |
| `src/components/auth/SignupForm.jsx` (MODIFY)                                                         | component (wizard orchestrator) | request-response                          | itself (current step machine)                                                                                | exact         |
| `src/components/auth/RoleSelection.jsx` (MODIFY → OAuth DOB+role completion)                          | component                       | request-response + CRUD (profile insert)  | itself (current role-only version) + `SignupForm.jsx` (step-machine pattern to mirror)                       | exact         |
| `src/components/auth/ParentEmailStep.jsx` (DELETE or leave inert)                                     | component                       | request-response                          | n/a — being retired, not replaced                                                                            | n/a           |
| `src/components/auth/SocialLogin.jsx` (likely unchanged)                                              | component                       | request-response                          | itself                                                                                                       | exact         |
| `src/components/auth/RoleCard.jsx` (unchanged, relabel only at call sites)                            | component                       | —                                         | itself                                                                                                       | exact         |
| `src/features/authentication/useSignup.js` (MODIFY — branch to `parents` insert)                      | hook (mutation)                 | CRUD                                      | itself (current `students`/`teachers` branch)                                                                | exact         |
| `src/features/authentication/useSocialAuth.js` (likely unchanged)                                     | hook (mutation)                 | request-response                          | itself                                                                                                       | exact         |
| `src/features/authentication/useUser.js` (MODIFY — expose `isParent`)                                 | hook (query)                    | CRUD (read)                               | itself                                                                                                       | exact         |
| `src/services/apiAuth.js` — `getCurrentUser()` (MODIFY — add `parents` probe)                         | service                         | CRUD (read)                               | itself (current `teachers`/`students` two-branch probe)                                                      | exact         |
| `src/App.jsx` — `AuthenticatedWrapper`/`TeacherRedirect` (MODIFY)                                     | route guard/component           | request-response                          | itself                                                                                                       | exact         |
| `[new] src/pages/ParentPlaceholder.jsx`-equivalent (post-signup bare-parent landing, D-03 discretion) | component (page)                | request-response                          | any glassmorphism dashboard card page, e.g. `src/pages/AppSettings.jsx`-style shell                          | role-match    |
| `supabase/migrations/YYYYMMDDHHMMSS_add_parent_age_verified.sql` (+ `.down.sql`)                      | migration                       | batch (DDL)                               | `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` (+ `.down.sql`)                      | exact         |
| `src/components/auth/AgeGate.test.jsx` (REWRITE)                                                      | test                            | —                                         | itself (current 2-test file)                                                                                 | exact         |
| `src/components/auth/RoleSelection.test.jsx` (REWRITE)                                                | test                            | —                                         | itself (current 6-test file, Supabase-mock pattern)                                                          | exact         |
| `src/features/authentication/useSignup.test.js` (FILL IN — currently `it.todo()` stubs)               | test                            | —                                         | `RoleSelection.test.jsx`'s Supabase-mock-and-assert-table pattern                                            | role-match    |
| `src/utils/ageUtils.test.js` (NEW — no existing file)                                                 | test                            | —                                         | `AgeGate.test.jsx` (closest sibling testing the same date logic, though it tests the component not the util) | partial       |
| `src/services/apiAuth.test.js` (NEW/confirm — Wave 0 gap)                                             | test                            | —                                         | `RoleSelection.test.jsx`'s `vi.mock("../../services/supabase", …)` pattern                                   | partial       |
| `src/locales/en/common.json` / `src/locales/he/common.json` (MODIFY — new/renamed keys)               | config (i18n)                   | —                                         | itself (existing `auth.signup.*` / `auth.roleSelection.*` blocks)                                            | exact         |

## Pattern Assignments

### `src/utils/ageUtils.js` (utility, transform)

**Analog:** itself — `isUnder13` is the direct template for the new `isUnder18`.

**Existing pattern to copy (full current file content, lines 1-69):**

```javascript
export function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

export function isUnder13(birthDate) {
  return calculateAge(birthDate) < 13;
}
```

**New sibling to add (same file, same doc-comment style):**

```javascript
/**
 * Check if a person is under 18 years old.
 * Used by the Phase 3 signup/OAuth age gate (D-08) — the gate checks 18+,
 * not COPPA's 13, because every new account belongs to an adult.
 * @param {Date} birthDate - The date of birth
 * @returns {boolean} True if under 18
 */
export function isUnder18(birthDate) {
  return calculateAge(birthDate) < 18;
}
```

`dobPartsToDate` and `isValidDOB` (lines 43-68) are already correct and unused elsewhere — call them as-is from the new `AgeGate.jsx`, do not duplicate their logic inline.

---

### `src/components/auth/AgeGate.jsx` (component, request-response)

**Analog:** itself (current file) for the outer form/error/CTA shell; `ParentEmailStep.jsx` for the two-affordance action row when a block path is needed.

**Imports pattern to copy (adapt select→3 fields):**

```javascript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AuthSelect from "./AuthSelect";
import AuthInput from "./AuthInput"; // NEW import — Day/Year become AuthInput type="number" per UI-SPEC
import AuthCta from "./AuthCta";
import { isValidDOB, dobPartsToDate, isUnder18 } from "../../utils/ageUtils";
```

**Core validation pattern (current lines 24-44, same shape to reuse — swap year-only checks for `isValidDOB`/`isUnder18`):**

```javascript
export function AgeGate({ onSubmit, onUnder18, disabled = false }) {
  const { t } = useTranslation("common");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const dob = { month: Number(month), day: Number(day), year: Number(year) };
    if (!isValidDOB(dob)) {
      setError(t("auth.signup.dobGate.errorInvalid"));
      return;
    }

    const birthDate = dobPartsToDate(dob);
    if (isUnder18(birthDate)) {
      onUnder18(); // D-10: routes to AgeBlockScreen, no data persisted
      return;
    }

    onSubmit(dob); // D-09: caller (SignupForm) discards DOB after this point
  };
  // ...
}
```

**Layout pattern (UI-SPEC "DOB gate layout" — `grid grid-cols-3 gap-3`, mirrors `SignupForm.jsx`'s existing `firstName`/`lastName` `grid-cols-2 gap-3` block at lines 322-346):**

```javascript
<div className="grid grid-cols-3 gap-3">
  <AuthSelect
    id="signup-dob-month"
    label={t("auth.signup.dobGate.month")}
    value={month}
    onChange={(e) => setMonth(e.target.value)}
    disabled={disabled}
    required
  >
    <option value="">{t("auth.signup.dobGate.selectMonth")}</option>
    {/* 1-12 options */}
  </AuthSelect>
  <AuthInput
    id="signup-dob-day"
    type="number"
    label={t("auth.signup.dobGate.day")}
    value={day}
    onChange={(e) => setDay(e.target.value)}
    disabled={disabled}
    required
  />
  <AuthInput
    id="signup-dob-year"
    type="number"
    label={t("auth.signup.dobGate.year")}
    value={year}
    onChange={(e) => setYear(e.target.value)}
    disabled={disabled}
    required
  />
</div>
```

**Error banner pattern (identical across every auth step — copy verbatim, current lines 52-56):**

```javascript
{
  error && (
    <div className="rounded-[14px] border border-red-300/25 bg-red-500/15 p-3 text-[13px] text-red-100">
      {error}
    </div>
  );
}
```

---

### `src/components/auth/AgeBlockScreen.jsx` (NEW component, request-response)

**Analog:** `ParentEmailStep.jsx`'s info-banner block (lines 46-61) for the blue "informational, not error" tone; `RoleSelection.jsx`'s `AuthShell` wrapper usage for full-screen-step rendering conventions.

**Info-banner pattern to copy (source: `ParentEmailStep.jsx:46-61`, swap icon color per UI-SPEC's `#93c5fd`/`rgba(37,99,235,0.22)` "informational" tokens, NOT the red error treatment):**

```javascript
<div className="rounded-[14px] border border-[rgba(96,165,250,0.35)] bg-[rgba(37,99,235,0.22)] p-3">
  <div className="flex gap-2.5">
    <Info
      className="mt-0.5 h-4 w-4 shrink-0 text-[#93c5fd]"
      aria-hidden="true"
    />
    <div className="text-[13px]">
      <p className="mb-1 font-semibold text-white">
        {t("auth.signup.ageBlock.title")}
      </p>
      <p className="leading-[1.5] text-white/70">
        {t("auth.signup.ageBlock.body")}
      </p>
    </div>
  </div>
</div>
```

**Two ghost-CTA action row pattern (source: `ParentEmailStep.jsx:82-89` skip/continue row — reuse shape, both actions become ghost per UI-SPEC "no destructive styling"):**

```javascript
<div className="flex gap-3">
  <AuthCta variant="ghost" onClick={onTryAgain}>
    {t("auth.signup.ageBlock.tryAgain")}
  </AuthCta>
  <AuthCta variant="ghost" onClick={onBackToLogin}>
    {t("auth.signup.ageBlock.backToLogin")}
  </AuthCta>
</div>
```

D-11: no `onError`/analytics call anywhere in this component — it renders, nothing is logged, nothing is persisted (contrast with `RoleSelection.jsx`'s `useMutation`, which this screen deliberately has none of).

---

### `src/components/auth/SignupForm.jsx` (component, request-response — orchestrator)

**Analog:** itself. This is a modification, not a replacement — the step-machine shape stays identical; only the step names/sequence (D-01/D-04) and role branch (D-02) change.

**Step-sequence constants to modify (current lines 15-17):**

```javascript
// BEFORE
const STUDENT_STEPS = ["role", "birth-year", "parent-email", "credentials"];
const TEACHER_STEPS = ["role", "credentials"];

// AFTER (D-01: role → DOB → credentials for BOTH branches; D-04 removes parent-email)
const PARENT_STEPS = ["role", "dob-gate", "credentials"];
const TEACHER_STEPS = ["role", "dob-gate", "credentials"];
```

**Role-select handler pattern to copy verbatim (current lines 84-98 — same shape, new branch target since DOB now follows role on BOTH branches):**

```javascript
const handleRoleSelect = (selectedRole) => {
  setRole(selectedRole);
  setDob(null); // reset downstream state on role change (existing pitfall-1 guard, same principle)
};

const handleRoleContinue = () => {
  if (!role) return;
  setStep("dob-gate"); // D-01: every role now goes through the DOB gate
};
```

**Block-screen wiring pattern (new — mirrors the existing `parent-email` step wiring at lines 111-120, replacing "skip" with "try again"/"back to login"):**

```javascript
const [step, setStep] = useState("role"); // add "age-block" as a reachable step value

const handleDobSubmit = (dob) => {
  setStep("credentials"); // D-09: dob itself is NOT stored in state beyond this call
};
const handleUnder18 = () => setStep("age-block");
const handleTryAgain = () => setStep("dob-gate");
```

**Credentials submit → role branch (current lines 142-160 — MODIFY to drop `firstName`/child fields for the parent path, keep for teacher; add `ageVerified` marker):**

```javascript
// BEFORE (writes firstName/lastName/birthYear/parentEmail regardless of role)
await signup({
  email,
  password,
  firstName,
  lastName: lastName || "",
  role: role || "student",
  birthYear,
  parentEmail: parentEmail || null,
});

// AFTER (D-04: parent path drops child-name fields; parentName optional per SIGNUP-04)
await signup({
  email,
  password,
  role, // "parent" | "teacher"
  parentName: role === "parent" ? parentName || null : null,
  firstName: role === "teacher" ? firstName : null,
  lastName: role === "teacher" ? lastName || "" : null,
  ageVerified: true, // gate already passed by this point
});
```

**Entry-screen Privacy link addition (D-12 — new placement; copy the EXACT link markup/classes from the existing credentials-step block, current lines 425-432, onto the role step below the Continue button):**

```javascript
<a
  href="/privacy"
  target="_blank"
  rel="noopener noreferrer"
  className="text-white/75 underline transition-colors hover:text-white"
>
  {t("auth.signup.terms.privacyLink")}
</a>
```

**Role card relabel (D-02 — current lines 271-286, only `label`/`description`/i18n key + `handleRoleSelect` argument change, `RoleCard` component itself untouched):**

```javascript
<RoleCard
  selected={role === "parent"}
  onClick={() => handleRoleSelect("parent")}
  tileClassName="from-[#4f46e5] to-[#3b82f6]"
  emoji="🎹"
  label={t("auth.signup.role.parent")}
  description={t("auth.signup.role.parentDesc")}
/>
```

---

### `src/components/auth/RoleSelection.jsx` → OAuth DOB+role completion screen (component, request-response + CRUD)

**Analog:** itself (current file) for the `AuthShell`/`useMutation`/toast wiring; `SignupForm.jsx`'s step-machine for the two-step (role→DOB) internal state this screen must grow into (RESEARCH.md Open Question 2 recommends this internal-step approach).

**Current mutation pattern to preserve the shape of (lines 29-84 — extend with a `parents` branch and gate on age BEFORE calling `createProfile`):**

```javascript
const { mutate: createProfile, isPending } = useMutation({
  mutationFn: async ({ role }) => {
    const firstName =
      user.user_metadata?.full_name?.split(" ")[0] ||
      user.email?.split("@")[0] ||
      "";
    const lastName =
      user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "";

    if (role === "teacher") {
      const { data, error } = await supabase
        .from("teachers")
        .insert([
          {
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            email: user.email,
            is_active: true,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      // NEW: parent branch replaces the old students-insert branch (D-06)
      const { data, error } = await supabase
        .from("parents")
        .insert([
          {
            id: user.id,
            display_name: firstName || null,
            age_verified_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },
  onSuccess: () => {
    toast.success(t("auth.roleSelection.successMessage"));
    queryClient.invalidateQueries({ queryKey: ["user"] });
    onRoleSelected && onRoleSelected();
  },
  onError: (error) => {
    toast.error(t("auth.roleSelection.errorGeneric"));
    console.error("Profile creation error:", error);
  },
});
```

**Under-18 sign-out branch (D-07 — new, no existing analog in this file; use the project's `logout()` wrapper for the localStorage-cleanup side effect, per RESEARCH.md's V3 Session Management note):**

```javascript
import { logout } from "../../services/apiAuth"; // reuse over raw supabase.auth.signOut() — clears user-scoped localStorage too

const handleUnder18 = async () => {
  await logout();
  setBlocked(true); // render AgeBlockScreen locally; no navigation needed (App.jsx re-renders to /login once session clears)
};
```

**`AuthShell`/heading wiring to keep unchanged (lines 92-136) — only the form body (lines 140-167) grows a DOB step before the existing RoleCard step**, mirroring `SignupForm`'s `StepDots`/step-key pattern rather than inventing a new progress affordance (UI-SPEC: "must visually read as one continuous step-flow ... using the same StepDots-style progress affordance").

---

### `src/features/authentication/useSignup.js` (hook, CRUD)

**Analog:** itself (current file) — the `mutationFn`'s try/catch/upsert shape stays; only the branch body for the non-teacher role changes.

**Imports pattern (unchanged, current lines 1-6):**

```javascript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import supabase from "../../services/supabase";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authErrorKey } from "./authErrorKey";
```

**Current teacher branch to copy AS THE TEMPLATE for the new parent branch (lines 76-97 — same upsert/onConflict/non-throwing-error shape):**

```javascript
if (role === "teacher") {
  const { error: teacherError } = await supabase
    .from("teachers")
    .upsert(
      [
        {
          id: userId,
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          email: normalizedEmail,
          is_active: true,
        },
      ],
      { onConflict: "id" }
    );
  if (teacherError) {
    /* don't throw — profile can be created later */
  }
}
```

**New parent branch (replaces current lines 98-145's `students` upsert + `promote_placeholder_student` call — D-04/SIGNUP-04, zero child data):**

```javascript
else if (role === "parent") {
  const { error: parentError } = await supabase.from("parents").upsert(
    [{ id: userId, display_name: normalizedParentName || null, age_verified_at: new Date().toISOString() }],
    { onConflict: "id" }
  );
  if (parentError) {
    console.warn("Parent record creation warning:", parentError);
  }
  // NO students insert, NO promote_placeholder_student call — D-03/D-04
}
```

**`onSuccess` toast/navigate pattern to extend (current lines 153-164 — add a `parent` case alongside `teacher`):**

```javascript
onSuccess: (data, variables) => {
  const { role } = variables;
  queryClient.invalidateQueries({ queryKey: ["user"] });
  toast.success(t(
    role === "teacher" ? "auth.signup.successTeacher" :
    role === "parent"  ? "auth.signup.successParent"  :  // NEW key
    "auth.signup.successStudent" // legacy fallback, should become unreachable post-Phase-3
  ));
  navigate("/");
},
```

**Error-handling wrapper (unchanged, copy verbatim — current lines 165-169, project-standard `authErrorKey` pattern):**

```javascript
onError: (error) => {
  toast.error(t(authErrorKey(error, "auth.errors.signupFailed")));
},
```

---

### `src/services/apiAuth.js` — `getCurrentUser()` (service, CRUD read)

**Analog:** itself — the exact two-branch (`teachers`/`students`) probe (lines 96-154) is the direct template for adding a third `parents` branch.

**Current two-branch probe to extend (verbatim structure, lines 100-154):**

```javascript
const metadataHint = user.user_metadata?.role;
const checkTeacherFirst = metadataHint === "teacher";

if (checkTeacherFirst) {
  const { data: teacherData } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (teacherData) {
    userRole = "teacher";
    profile = teacherData;
  } else {
    const { data: studentData } = await supabase
      .from("students")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (studentData) {
      userRole = "student";
      profile = studentData;
    }
  }
} else {
  const { data: studentData } = await supabase
    .from("students")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (studentData) {
    userRole = "student";
    profile = studentData;
  } else {
    const { data: teacherData } = await supabase
      .from("teachers")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (teacherData) {
      userRole = "teacher";
      profile = teacherData;
    }
  }
}
```

**New third branch to add (checked last in every hint-ordering, since parent is the new/most-common path but the metadata hint only distinguishes teacher-vs-not today — add a `parents` probe as the final fallback in both branches):**

```javascript
// After the existing teacher/student checks fail in EITHER branch above:
if (!userRole) {
  const { data: parentData, error: parentError } = await supabase
    .from("parents")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (parentData && !parentError) {
    userRole = "parent";
    profile = parentData;
  }
}
```

**Return-shape pattern to extend (current lines 159-179 — add `isParent`):**

```javascript
if (!userRole) {
  return {
    ...user,
    userRole: null,
    profile: null,
    isTeacher: false,
    isStudent: false,
    isParent: false,
    needsRoleSelection: true,
  };
}
return {
  ...user,
  userRole,
  profile,
  isTeacher: userRole === "teacher",
  isStudent: userRole === "student",
  isParent: userRole === "parent",
};
```

**`useUser()` to extend correspondingly (`src/features/authentication/useUser.js`, current lines 33-42 — add `isParent`):**

```javascript
return {
  user,
  isAuthenticated: user?.role === "authenticated",
  isTeacher: user?.isTeacher || false,
  isStudent: user?.isStudent || false,
  isParent: user?.isParent || false, // NEW
  userRole: user?.userRole,
  profile: user?.profile,
  isLoading,
};
```

**Hard project rule to preserve verbatim (comment at line 90 — do not violate when adding the parent branch):**

```javascript
// SECURITY: Determine user role ONLY from database table presence.
// user_metadata is NOT trusted for authorization decisions.
```

---

### `src/App.jsx` — `AuthenticatedWrapper` / `TeacherRedirect` (route guard, request-response)

**Analog:** itself — both are small, targeted branch additions to existing conditionals.

**`AuthenticatedWrapper`'s no-profile branch (current line 199-201) is unchanged in shape** — it still renders the (now DOB+role-aware) `RoleSelection`; no new branch needed here since D-05/D-06 live inside `RoleSelection` itself.

**`TeacherRedirect` to extend (current lines 240-248 — add an `isParent` branch per Pitfall 2, before the `TrailMapPage` fallback):**

```javascript
export function TeacherRedirect() {
  const { isTeacher, isParent } = useUser();

  if (isTeacher) {
    return <Navigate to="/teacher" replace />;
  }
  if (isParent) {
    return <ParentPlaceholder />; // D-03 discretion — minimal glassmorphism "coming soon" page
  }

  return <TrailMapPage />;
}
```

---

### `[new] ParentPlaceholder` page (D-03 discretion — post-signup bare-parent landing)

**Analog:** No direct page-level analog was read in full (out of this phase's read budget), but `CLAUDE.md`'s documented "Glass Card Pattern" is the mandatory template, and UI-SPEC explicitly names it:

> "reuse the app's standard glassmorphism page shell (`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`) on the existing purple-gradient `AppLayout` background, NOT the auth wizard's `AuthShell`. This is a post-login app screen, not an auth screen."

```javascript
// Pattern from CLAUDE.md's Glass Card Pattern (primary) — apply directly:
<div className="rounded-xl border border-white/20 bg-white/10 p-6 text-center shadow-lg backdrop-blur-md">
  <h1 className="text-2xl font-semibold text-white">
    {t("parentPlaceholder.heading")}
  </h1>
  <p className="mt-2 text-white/70">{t("parentPlaceholder.body")}</p>
</div>
```

Copy per UI-SPEC's Copywriting Contract: heading "You're all set!", body "Child profiles are on their way — check back soon to add your child and start their piano journey together."

---

### `supabase/migrations/YYYYMMDDHHMMSS_add_parent_age_verified.sql` (migration, batch DDL)

**Analog:** `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` (header/comment style) + the `consent_verified_at` precedent in `20260201000001_coppa_schema.sql:43-44,448-449`.

**Header/comment convention to copy (source: `20260722120000_add_parents_and_child_profiles.sql:1-17`):**

```sql
-- =============================================================================
-- Migration:   YYYYMMDDHHMMSS_add_parent_age_verified
-- Date:        2026-08-XX
-- Milestone:   v4.0 — Parent-First Account Architecture (COPPA), Phase 3
-- Description: Adds a minimal age-verified marker to `parents` (D-09) — the
--              DOB itself is discarded after the 18+ check; only a
--              boolean/timestamp marker persists, following the existing
--              `consent_verified_at` naming pattern.
-- Predecessors: 20260722120000_add_parents_and_child_profiles.sql (parents table)
-- Rollback:     YYYYMMDDHHMMSS_add_parent_age_verified.down.sql
-- =============================================================================

BEGIN;
```

**`consent_verified_at` naming precedent to follow exactly (source: `20260201000001_coppa_schema.sql:43-44,448-449`):**

```sql
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS consent_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN students.consent_verified_at IS
  'Timestamp when parental consent was verified';
```

**New column for `parents` (mirrors the pattern above, applied to `parents` per D-09):**

```sql
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN parents.age_verified_at IS
  'Timestamp when the account owner''s 18+ self-attested DOB check passed. The birth date itself is never stored (D-09) — only this marker.';

COMMIT;
```

**Down-migration pattern to copy (source: `20260722120000_add_parents_and_child_profiles.down.sql:1-9`, idempotent `IF EXISTS`):**

```sql
-- =============================================================================
-- Down-migration: reverses YYYYMMDDHHMMSS_add_parent_age_verified.sql
-- =============================================================================
BEGIN;
ALTER TABLE parents DROP COLUMN IF EXISTS age_verified_at;
COMMIT;
```

Migration file naming convention (verified, last 2 migrations): `YYYYMMDDHHMMSS_snake_case_description.sql`, always paired with a `.down.sql` sibling.

---

### Test files

**`AgeGate.test.jsx` (REWRITE) — analog: itself.** Current file (23 lines, full content shown above) asserts a single `<select>` labeled "Birth year" — every assertion must change to three fields plus the `isUnder18` branch. Copy the `render`/`fireEvent`/`screen.getByLabelText` shape, not the assertions.

**`RoleSelection.test.jsx` (REWRITE) — analog: itself.** Current file (118 lines, full content shown above) has a reusable Supabase-mock scaffold worth copying verbatim:

```javascript
const inserted = vi.hoisted(() => ({ table: null, rows: null }));
vi.mock("../../services/supabase", () => ({
  default: {
    from: (table) => {
      inserted.table = table;
      return { insert: (rows) => { inserted.rows = rows; return { select: () => ({ single: () => Promise.resolve({ data: { id: "u1" }, error: null }) }) }; } },
    },
  },
}));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
```

New assertions needed: DOB step gates role-insert; under-18 signs out (mock `supabase.auth.signOut`) and never calls `.from("parents")`/`.from("teachers")`.

**`useSignup.test.js` (FILL IN `it.todo()` stubs) — analog: `RoleSelection.test.jsx`'s mock-and-assert-table pattern**, adapted to the existing mock scaffold already in this file (lines 1-33, `vi.mock("../../services/supabase", …)` with `upsert`/`rpc` stubs) — extend those mocks' assertions to verify a `parent` role only ever calls `.from("parents")`, never `.from("students")` or `promote_placeholder_student`.

**`ageUtils.test.js` (NEW) — analog: `AgeGate.test.jsx`'s plain assertion style**, but as a pure Vitest unit test (no DOM/render needed — per CLAUDE.md's "Utility/service tests are plain Vitest"):

```javascript
import { describe, it, expect } from "vitest";
import {
  calculateAge,
  isUnder13,
  isUnder18,
  isValidDOB,
  dobPartsToDate,
} from "./ageUtils";

describe("isUnder18", () => {
  it("returns true for someone exactly 17 years, 364 days old", () => {
    /* ... */
  });
  it("returns false for someone exactly 18 years old today", () => {
    /* ... */
  });
});
```

**`apiAuth.test.js` (NEW/confirm) — analog: `RoleSelection.test.jsx`'s `vi.mock("../../services/supabase", …)` scaffold**, adapted to mock `.from("parents").select().eq().maybeSingle()` returning a row and asserting `getCurrentUser()` returns `{ userRole: "parent", isParent: true }`.

---

## Shared Patterns

### Error banner (form validation failures)

**Source:** `AgeGate.jsx:52-56`, repeated identically in `SignupForm.jsx:262-266` and `ParentEmailStep.jsx:64-68`
**Apply to:** DOB gate, credentials step — never the under-18 block screen (that uses the blue info-banner tone instead, per D-10/UI-SPEC).

```javascript
{
  error && (
    <div className="rounded-[14px] border border-red-300/25 bg-red-500/15 p-3 text-[13px] text-red-100">
      {error}
    </div>
  );
}
```

### Info banner (guidance, not error)

**Source:** `ParentEmailStep.jsx:46-61`
**Apply to:** `AgeBlockScreen.jsx` (D-10's "friendly dead-end" tone)

```javascript
<div className="rounded-[14px] border border-[rgba(96,165,250,0.35)] bg-[rgba(37,99,235,0.22)] p-3">
  <div className="flex gap-2.5">
    <Info
      className="mt-0.5 h-4 w-4 shrink-0 text-[#93c5fd]"
      aria-hidden="true"
    />
    <div className="text-[13px]">{/* title + body */}</div>
  </div>
</div>
```

### Auth-wizard design-system primitives (locked, D-13/D-14 exception)

**Source:** `AuthInput.jsx`, `AuthSelect.jsx`, `AuthCta.jsx` (full contents read above)
**Apply to:** every new/modified auth screen in this phase (DOB gate, block screen, OAuth completion)

- `AuthInput`/`AuthSelect`: `h-[52px]`, `rounded-[14px]`, `border-2 border-white/[0.18] bg-white/[0.12]`, label `text-[13px] font-medium text-white/85` (the D-14 locked 500-weight), `ltr:`/`rtl:` mirrored padding — never physical `left`/`right`.
- `AuthCta`: `h-[52px] w-full rounded-[14px]`, `variant="secondary"` (`bg-[#c026d3]`) for every step-forward Continue button per UI-SPEC's color table — never `variant="primary"` (`#2563eb`) for these.

### `i18n.language?.startsWith("he")` (never `=== "he"`)

**Source:** `SignupForm.jsx:54`, `RoleSelection.jsx:24`, `AuthShell.jsx:40`
**Apply to:** any new component computing `isHebrew`/heading font — copy verbatim:

```javascript
const isHebrew = i18n.language?.startsWith("he");
const headingFont = isHebrew ? "font-hebrew font-extrabold" : "font-playful";
```

### Role-from-DB-presence (hard security rule)

**Source:** `apiAuth.js:90-92` (comment) + lines 96-154 (implementation)
**Apply to:** `getCurrentUser()` extension (this phase's highest-risk change) — never re-derive role from `user.user_metadata`/`user.app_metadata`/OAuth query params.

### `authErrorKey` error-toast wrapper

**Source:** `useSignup.js:165-169`, `useSocialAuth.js:19-28`
**Apply to:** any new/modified mutation's `onError` — keep English internal-signal messages inside `mutationFn` throws, translate only at the `onError` boundary via `authErrorKey(error, fallbackKey)`.

### `logout()` over raw `supabase.auth.signOut()`

**Source:** `apiAuth.js:199-251` (full function, doc comment at 187-198 explains the localStorage-cleanup rationale)
**Apply to:** D-07's under-18 OAuth sign-out — use `import { logout } from "../../services/apiAuth"` rather than calling `supabase.auth.signOut()` directly, so a blocked user's session leaves no trace on a shared device (matches RESEARCH.md's V3 Session Management note).

## No Analog Found

| File                                     | Role             | Data Flow        | Reason                                                                                                                                                                                                                                                           |
| ---------------------------------------- | ---------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[new] ParentPlaceholder` page component | component (page) | request-response | No existing "empty state / coming soon" page was read this session; CLAUDE.md's documented Glass Card Pattern is the concrete substitute contract (see above) — planner should treat this as a new-but-trivial page, not search further for a page-level analog. |

## Metadata

**Analog search scope:** `src/components/auth/`, `src/features/authentication/`, `src/services/apiAuth.js`, `src/utils/ageUtils.js`, `src/App.jsx`, `supabase/migrations/`, `src/locales/{en,he}/common.json`
**Files scanned (full reads):** `SignupForm.jsx`, `AgeGate.jsx`, `ParentEmailStep.jsx`, `RoleSelection.jsx`, `SocialLogin.jsx`, `RoleCard.jsx`, `useSignup.js`, `useSocialAuth.js`, `useUser.js`, `ageUtils.js`, `apiAuth.js` (full), `App.jsx` (targeted `AuthenticatedWrapper`/`TeacherRedirect` region), `AuthInput.jsx`, `AuthSelect.jsx`, `AuthCta.jsx`, `AuthShell.jsx` (partial), `AgeGate.test.jsx`, `RoleSelection.test.jsx`, `useSignup.test.js`, migration files (`20260722120000_add_parents_and_child_profiles.sql` + `.down.sql`, `20260201000001_coppa_schema.sql` excerpt), `en/common.json` (auth.signup/roleSelection excerpt)
**Pattern extraction date:** 2026-08-03
