# Phase 01: Signup Flow Redesign - Research

**Researched:** 2026-03-23
**Domain:** React multi-step wizard, auth UX, COPPA cleanup, Supabase data migration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Multi-step wizard with 4 steps maximum. Step dots progress indicator at top.
- **D-02:** Student path: Role Selection -> Birth Year -> Parent Email (optional, under-13 only) -> Credentials/Name
- **D-03:** Teacher path: Role Selection -> Credentials/Name (skips birth year and parent email entirely)
- **D-04:** Back buttons on every step after the first. Each step is its own screen/view within the wizard.
- **D-05:** Remove consent email flow entirely. No more verification emails for parent consent.
- **D-06:** Parent email is purely for weekly progress reports and push notification opt-in reminders.
- **D-07:** Parent email step only appears for under-13 students. It has a "Skip" button alongside "Continue".
- **D-08:** Google OAuth button appears on the credentials step (Step 4 for students, Step 2 for teachers) as alternative to email/password. Same placement as current design.
- **D-09:** Role is already known from Step 1 and passed to `SocialLogin` component via `role` prop (existing pattern).
- **D-10:** Store birth year as `DATE` using January 1st convention (e.g., 2018 -> '2018-01-01'). No schema change needed. Existing `is_under_13` trigger works as-is.
- **D-11:** Remove client-side consent code: `sendParentalConsentEmail` calls, `ParentalConsentPending` component, consent service imports in signup hook. Keep DB tables/functions in place (harmless, have existing data).
- **D-12:** Write migration to activate all existing suspended users: `UPDATE students SET account_status = 'active' WHERE account_status = 'suspended_consent'`.
- **D-13:** New signups always set `account_status = 'active'` regardless of age.

### Claude's Discretion

- **D-14:** Parent email step messaging/copy — Claude picks the best tone based on the app's existing kid-friendly style.
- **D-15:** Google OAuth birth year handling — Claude decides the best approach for collecting birth year from Google OAuth student users (pre-redirect vs post-callback vs skip).

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

This phase restructures the existing `SignupForm.jsx` multi-step flow by adding role selection as Step 1, moving age/birth-year collection to Step 2 (students only), making parent email optional at Step 3 (under-13 students only), and consolidating credentials/name as the final step. The current wizard uses `useState("step-name")` already — expanding it follows the exact same pattern with additional step values and a `role` state variable hoisted to Step 1.

The most significant change is the COPPA consent removal: three touch-points must be cleaned up together — `useSignup.js` (stop calling `sendParentalConsentEmail`, stop setting `account_status: 'suspended_consent'`), `App.jsx` (remove `ParentalConsentPending` render path in `AuthenticatedWrapper`), and a new Supabase migration to unlock existing suspended accounts. No schema changes are needed because `date_of_birth DATE` already exists and the `is_under_13` trigger fires on any `date_of_birth` value including January 1st of a year.

**Primary recommendation:** Modify `SignupForm.jsx` in-place — add `role` and `birthYear` state, expand step enum from 3 values to 4, reuse existing sub-components with minimal surgery on each.

---

## Standard Stack

All dependencies are already installed. No new packages required.

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18 | Component rendering + state | Project standard |
| TanStack React Query | v5 | `useMutation` for signup | Already used in `useSignup.js` |
| Supabase JS | current | Auth + DB | Project backend |
| Tailwind CSS | 3 | Styling | Project design system |
| lucide-react | current | Icons (Users, GraduationCap, ArrowLeft) | Already imported in auth components |

### No New Dependencies Needed
All required UI patterns, icons, and state tools are already present in the codebase.

---

## Architecture Patterns

### Step Enum Expansion Pattern

The current wizard uses `useState("step-name")`. The new wizard expands this with the same idiom:

```jsx
// Current
const [step, setStep] = useState("age");
// 'age' | 'parent-email' | 'details'

// New
const [step, setStep] = useState("role");
// 'role' | 'birth-year' | 'parent-email' | 'credentials'
```

State to hoist into `SignupForm` parent:
```jsx
const [role, setRole] = useState(null);        // 'student' | 'teacher'
const [birthYear, setBirthYear] = useState(null); // integer e.g. 2014
const [parentEmail, setParentEmail] = useState(null); // string | null
```

The `role` state moves from Step 3 (credentials) to Step 1 — it is then passed as a prop to `SocialLogin` and used to branch the step sequence.

### Step Routing Logic

```jsx
// After role selection (Step 1)
const handleRoleSubmit = (selectedRole) => {
  setRole(selectedRole);
  if (selectedRole === 'teacher') {
    setStep('credentials'); // teachers skip birth year + parent email
  } else {
    setStep('birth-year');
  }
};

// After birth year (Step 2, students only)
const handleBirthYearSubmit = (year) => {
  setBirthYear(year);
  const isUnder13 = (new Date().getFullYear() - year) < 13;
  if (isUnder13) {
    setStep('parent-email');
  } else {
    setStep('credentials');
  }
};

// After parent email (Step 3, under-13 students only)
const handleParentEmailSubmit = (email) => {
  setParentEmail(email); // null if skipped
  setStep('credentials');
};
```

### Back Navigation Map

| Current step | Back navigates to |
|---|---|
| 'birth-year' | 'role' |
| 'parent-email' | 'birth-year' |
| 'credentials' (student) | 'parent-email' if under-13, else 'birth-year' |
| 'credentials' (teacher) | 'role' |

To implement "credentials" back for students correctly, `SignupForm` must track whether the user went through parent-email step. This is deducible from `birthYear` and the under-13 threshold: if `new Date().getFullYear() - birthYear < 13`, back goes to `parent-email`; otherwise back goes to `birth-year`.

### Step Dots Progress Indicator

Step counts differ by role:
- Students: 4 steps (Role, Birth Year, Parent Email or skip, Credentials)
- Teachers: 2 steps (Role, Credentials)

Render step dots based on the derived step sequence:

```jsx
const steps = role === 'teacher'
  ? ['role', 'credentials']
  : ['role', 'birth-year', 'parent-email', 'credentials'];
const currentIndex = steps.indexOf(step);
```

For students before role is known (still on 'role' step), show 4 dots (optimistic for the common student path). After role is selected, re-derive.

A simple dot indicator:
```jsx
<div className="flex justify-center gap-2 mb-4">
  {steps.map((s, i) => (
    <div
      key={s}
      className={`w-2 h-2 rounded-full transition-all ${
        i === currentIndex
          ? 'bg-indigo-400 scale-125'
          : i < currentIndex
          ? 'bg-indigo-400/60'
          : 'bg-white/20'
      }`}
    />
  ))}
</div>
```

### Birth Year Step (AgeGate Simplification)

`AgeGate.jsx` currently renders three dropdowns (month, day, year). The new `BirthYearStep` renders only a year dropdown, calls back with an integer year (not a Date), and the `isUnder13` calculation happens in `SignupForm` state logic.

`ageUtils.js` currently exports `isUnder13(birthDate)` which takes a `Date`. A year-only check is simpler: `(new Date().getFullYear() - year) < 13`. This is slightly conservative (treats birthday as January 1st) which is fine — worst case a kid born in December 2013 sees the parent email step unnecessarily. This matches D-10's January 1st convention.

Option A: Keep `AgeGate.jsx`, reduce to year-only dropdown, rename file to `BirthYearStep.jsx`.
Option B: Create new `BirthYearStep.jsx` and leave `AgeGate.jsx` as dead code (safe — no other imports).

Verdict: Option A is simpler. Simplify `AgeGate.jsx` in-place (it is only imported by `SignupForm`).

### Parent Email Step Changes

`ParentEmailStep.jsx` currently:
- Has an "confirm email" second field (required)
- Calls `onSubmit(email)` with validated email
- Has no skip path

New behavior:
- Remove "confirm email" field (optional step needs minimal friction)
- Add "Skip for now" button that calls `onSubmit(null)` (or a separate `onSkip` prop)
- Update info banner copy from "required for account creation" to purpose-driven: weekly progress reports and push notification reminders (D-14 discretion)

### useSignup.js Changes

Three changes:
1. Accept `birthYear` (integer) instead of `dateOfBirth` (Date). Build the ISO date string as `${birthYear}-01-01`.
2. Remove `sendParentalConsentEmail` call and its import.
3. Always set `account_status: 'active'`.

```js
// Before
date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
account_status: isUnder13 ? 'suspended_consent' : 'active',

// After
date_of_birth: birthYear ? `${birthYear}-01-01` : null,
account_status: 'active',
```

The `calculateIsUnder13` function and the `onSuccess` toast branching on `isUnder13` also need updating. After this phase, the `isUnder13` value is no longer used in `useSignup.js` at all — the only consumer of birth year data is the DB trigger `calculate_is_under_13`.

### App.jsx Changes (consent path removal)

`AuthenticatedWrapper` in `App.jsx` renders `ParentalConsentPending` when `isSuspended && suspensionReason === 'consent'`. After D-11/D-12/D-13, no student will ever be `suspended_consent` going forward (existing suspended accounts are migrated active by the migration), so this render path becomes dead code.

Remove from `App.jsx`:
- `import ParentalConsentPending from "./components/auth/ParentalConsentPending"`
- The `useAccountStatus` hook (or keep it — it still serves the `suspended_deletion` path)
- The `isSuspended && suspensionReason === 'consent'` conditional block

Note: `useAccountStatus` is still needed for the `suspended_deletion` path. Only the `consent` branch and the `ParentalConsentPending` import are removed.

### Supabase Migration

New migration file: `supabase/migrations/20260323000001_activate_suspended_consent.sql`

```sql
-- Migration: Activate all accounts suspended pending parental consent
-- Date: 2026-03-23
-- Context: Signup flow redesign removes consent requirement.
--          Existing suspended_consent accounts are immediately activated.
UPDATE students
  SET account_status = 'active'
  WHERE account_status = 'suspended_consent';
```

No schema changes, no rollback complexity. The `suspended_consent` status value remains valid in the check constraint (harmless).

### Google OAuth Birth Year Handling (D-15 Discretion)

When a student signs up via Google OAuth, the flow redirects to Google and returns — there is no multi-step wizard intercept. The existing `RoleSelection` component handles the post-OAuth profile creation case (user is authenticated but has no profile row). The question is whether to collect birth year from Google OAuth students.

**Analysis of options:**
1. **Pre-redirect (not feasible):** Supabase OAuth redirects immediately; cannot inject wizard steps before the redirect.
2. **Post-callback wizard:** After OAuth returns and `needsRoleSelection` is true, show a role + birth year wizard before creating the profile. Most correct but requires `RoleSelection.jsx` to become a multi-step flow.
3. **Skip for Google OAuth students:** Set `date_of_birth = NULL`, `is_under_13 = false` for Google OAuth students. Parent email features are unavailable to them.

**Recommendation:** Option 3 — skip birth year collection for Google OAuth signups for this phase. Rationale: Google OAuth students are typically not 8-year-olds (children don't manage Google accounts for school apps in this way). The parent email feature is optional and its absence for OAuth users is acceptable. The COPPA risk is low: if a child uses a parent's Google account, the parent already controls that account. This can be revisited in a future phase if needed.

If Option 2 is preferred later, `RoleSelection.jsx` needs its own birth year step — but that is out of scope for this phase per D-03 (teacher path) and the bounded scope of this work.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Step progress dots | Custom animation system | Simple inline Tailwind dot divs | Sufficient for 2-4 dots, consistent with existing glass UI |
| Birth year validation | Custom date math | `new Date().getFullYear() - year < 13` | One-liner, no edge cases |
| Email validation | Custom regex | Existing regex in `ParentEmailStep.jsx` | Already correct |
| Form state machine | XState or Zustand | `useState` + step string enum | Existing pattern, works, no library needed |

---

## Common Pitfalls

### Pitfall 1: Back Navigation Goes to Wrong Step for Credentials
**What goes wrong:** When a student lands on 'credentials' via the teacher shortcut (no birth year collected), pressing Back should go to 'role', not 'parent-email'. But if the logic checks `birthYear !== null` to decide where to go back, it fails when a user who had birth year data navigated forward as teacher.
**Why it happens:** `role` was set in Step 1; but if `role` changes later (user goes back and picks teacher), stale `birthYear` state may remain.
**How to avoid:** When role changes in Step 1, reset `birthYear` and `parentEmail` to null. The back-from-credentials logic should be: `role === 'teacher' ? 'role' : (wasUnder13 ? 'parent-email' : 'birth-year')`, where `wasUnder13` is derived live from `birthYear` state.
**Warning signs:** Test the sequence: student -> birth year 2014 -> parent email -> credentials -> back (should go to parent-email) and also teacher -> credentials -> back (should go to role).

### Pitfall 2: `is_under_13` Trigger and January 1st Conservative Rounding
**What goes wrong:** A student born in December 2013 submits birth year 2013. The stored date is 2013-01-01. The DB trigger calculates `2013-01-01 > CURRENT_DATE - INTERVAL '13 years'`. On 2026-03-23, that is `2013-01-01 > 2013-03-23` = FALSE — so the trigger sets `is_under_13 = false` even though the student is technically 12.
**Why it happens:** January 1st convention undercounts by up to 11 months. A student born December 2013 is 12 until December 2026.
**How to avoid:** This is an accepted tradeoff (D-10) — birth year only collection is less precise than full DOB. The implication: the UI correctly shows the parent email step (because client-side check is `year >= currentYear - 13`), but the DB may set `is_under_13 = false` for late-year under-13 birthdays. Since consent is no longer enforced, the `is_under_13` DB column is informational only. The parent email is still stored from the UI step. This mismatch is acceptable for the new, relaxed model.
**Warning signs:** None — this is documented behavior. Do not add workarounds.

### Pitfall 3: Stale `suspended_consent` Status After Migration
**What goes wrong:** The DB migration activates all suspended accounts. But a user with a cached React Query result for `["user"]` or `useAccountStatus` may still see the `ParentalConsentPending` screen after deploy.
**Why it happens:** React Query caches `account_status` in memory. The `AuthenticatedWrapper` re-reads status via `useAccountStatus`, but its query cache may be stale.
**How to avoid:** The migration runs before deploy. After deploy, all new sessions fetch fresh `account_status = 'active'`. The `ParentalConsentPending` UI is also being removed, so there is no path to show it. Existing sessions where a user was on the consent screen will refresh to the normal dashboard on next load.
**Warning signs:** If removing `ParentalConsentPending` is done before the migration runs in production, briefly suspended users could be logged in but stuck. Run migration first.

### Pitfall 4: `ParentalConsentPending` Import Removal May Cause Runtime Error
**What goes wrong:** `App.jsx` imports `ParentalConsentPending` and renders it conditionally. If the import is removed but the conditional render block is not, or vice versa, the build fails.
**Why it happens:** Two separate locations in `App.jsx` need editing: the import line and the JSX render block.
**How to avoid:** Remove both the import and the `isSuspended && suspensionReason === 'consent'` block in a single plan task.

### Pitfall 5: `useSignup.js` Toast Message References `isUnder13`
**What goes wrong:** The `onSuccess` handler in `useSignup.js` has a special toast when `isUnder13 && parentEmail`. After this phase, `isUnder13` is still calculated from `dateOfBirth` which is no longer passed. If the variable is simply removed, the toast logic crashes.
**Why it happens:** The toast checks `variables.dateOfBirth` via `calculateIsUnder13(dateOfBirth)` in `onSuccess`.
**How to avoid:** In `onSuccess`, replace the under-13 branching toast with a single success toast: `"[Role] account created successfully! Please check your email to confirm your account."`. The masked parent email toast is no longer needed (parent email is optional, no consent email sent).

---

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Supabase `students` table: rows with `account_status = 'suspended_consent'` (unknown count, could be 0-N existing users) | SQL migration: `UPDATE students SET account_status = 'active' WHERE account_status = 'suspended_consent'` |
| Live service config | None — no external service uses `suspended_consent` as a filter | None |
| OS-registered state | None | None |
| Secrets/env vars | `VITE_VAPID_PUBLIC_KEY`, `CRON_SECRET`, `BREVO_API_KEY` for push/email — unchanged, no rename | None |
| Build artifacts | None — TypeScript/Vite rebuild handles all | None |

**Nothing found in other categories** — verified by grepping for `suspended_consent` references: only `consentService.js`, `apiAuth.js`, `accountDeletionService.js`, `useAccountStatus.js`, `useSignup.js`. DB tables `parental_consent_tokens` and `parental_consent_log` are left in place (D-11: harmless).

---

## Code Examples

### Verified: Step Dot Indicator Pattern (glass system)

```jsx
// Source: inferred from existing SignupForm.jsx + CLAUDE.md glass pattern
const STUDENT_STEPS = ['role', 'birth-year', 'parent-email', 'credentials'];
const TEACHER_STEPS = ['role', 'credentials'];

function StepDots({ step, role }) {
  const steps = role === 'teacher' ? TEACHER_STEPS : STUDENT_STEPS;
  const currentIndex = steps.indexOf(step);
  return (
    <div className="flex justify-center gap-2 mb-4">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i === currentIndex
              ? 'bg-indigo-400 scale-125'
              : i < currentIndex
              ? 'bg-indigo-400/50'
              : 'bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}
```

### Verified: Birth Year Store as DATE (January 1st convention)

```js
// Source: D-10, verified against COPPA schema trigger
// AgeGate simplified to single year dropdown
// SignupForm passes year integer to useSignup

// In useSignup.js mutationFn signature change:
// Before: { email, password, firstName, lastName, role, dateOfBirth, parentEmail }
// After:  { email, password, firstName, lastName, role, birthYear, parentEmail }

// DB write:
date_of_birth: birthYear ? `${birthYear}-01-01` : null,
```

### Verified: Consent Code Removal in useSignup.js

```js
// REMOVE this import:
// import { sendParentalConsentEmail } from "../../services/consentService";

// REMOVE this block:
// if (isUnder13 && parentEmail) {
//   try { await sendParentalConsentEmail(userId, parentEmail); } catch (consentError) { ... }
// }

// CHANGE account_status:
// Before: account_status: isUnder13 ? 'suspended_consent' : 'active',
// After:  account_status: 'active',

// SIMPLIFY onSuccess toast:
// Before: branched on isUnder13 && parentEmail -> masked email toast
// After:  single toast: `${role === "teacher" ? "Teacher" : "Student"} account created! Please check your email to confirm.`
```

### Verified: App.jsx Consent Path Removal

```jsx
// REMOVE import:
// import ParentalConsentPending from "./components/auth/ParentalConsentPending";

// In AuthenticatedWrapper, REMOVE this block:
// if (user && isStudent && isSuspended && suspensionReason === 'consent' && !isPublicRoute) {
//   return <ParentalConsentPending ... />;
// }

// KEEP the suspended_deletion block (still needed)
// KEEP useAccountStatus (still needed for deletion suspension path)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full DOB (month/day/year) for COPPA | Birth year only | This phase | DB trigger still fires; `is_under_13` computed from Jan 1st convention |
| `account_status = 'suspended_consent'` for under-13 | `account_status = 'active'` for all new signups | This phase | Removes consent blocking gate |
| Parental consent email required for account activation | Parent email optional, no activation gating | This phase | Removes `send-consent-email` Edge Function call path |
| Role selection embedded in last step of signup | Role selection is Step 1 | This phase | Teacher path becomes 2-step |

---

## Open Questions

1. **`ParentalConsentPending.jsx` file status**
   - What we know: D-11 says to remove the import and calls from signup flow
   - What's unclear: Should the file be deleted or left as orphaned dead code?
   - Recommendation: Leave the file in place but unused — deleting it is low value and could create merge conflicts. If the team wants cleanup, it can be a follow-up. The file is not imported anywhere after App.jsx is updated.

2. **`consentService.js` cleanup scope**
   - What we know: `sendParentalConsentEmail` is removed from signup; other functions (`verifyParentalConsent`, `resendConsentEmail`, `revokeConsent`, `getConsentStatus`) are referenced from `ParentalConsentPending.jsx` and `ConsentVerifyPage`
   - What's unclear: Is `ConsentVerifyPage` still needed?
   - Recommendation: Out of scope for this phase. `consentService.js` is not touched beyond removing its import from `useSignup.js`. The `consent/verify` route and `ConsentVerifyPage` remain for any existing consent links already in parents' inboxes.

3. **Step count on 'role' step before role is known**
   - What we know: Dots need a count before role is selected
   - What's unclear: Show 4 dots (student default) or 2 dots (teacher)?
   - Recommendation: Show 4 dots on the role step (most common path is student). After role is selected and steps change, the dots update. This is the lowest cognitive friction approach.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code/config changes + one SQL migration. No new external dependencies are introduced. The Supabase CLI for running migrations locally (`npx supabase db push`) is standard project tooling already in use.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react 16.3.1 |
| Config file | `vitest.config.js` (project root) |
| Quick run command | `npx vitest run src/components/auth/` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

There are no formal REQ IDs for this phase (TBD at planning time). The behaviors to test are derived from the decisions:

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| Role selection navigates student to birth year step | unit | `npx vitest run src/components/auth/SignupForm.test.jsx` | Wave 0 |
| Role selection navigates teacher directly to credentials step | unit | `npx vitest run src/components/auth/SignupForm.test.jsx` | Wave 0 |
| Birth year under-13 navigates to parent email step | unit | `npx vitest run src/components/auth/SignupForm.test.jsx` | Wave 0 |
| Birth year 13+ skips parent email, goes to credentials | unit | `npx vitest run src/components/auth/SignupForm.test.jsx` | Wave 0 |
| Parent email "Skip" calls onSubmit with null | unit | `npx vitest run src/components/auth/ParentEmailStep.test.jsx` | Wave 0 |
| Back button on birth-year returns to role | unit | `npx vitest run src/components/auth/SignupForm.test.jsx` | Wave 0 |
| useSignup sets account_status = 'active' regardless of age | unit | `npx vitest run src/features/authentication/useSignup.test.js` | Wave 0 |
| useSignup does NOT call sendParentalConsentEmail | unit | `npx vitest run src/features/authentication/useSignup.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/auth/`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/auth/SignupForm.test.jsx` — covers step navigation for student and teacher paths
- [ ] `src/components/auth/ParentEmailStep.test.jsx` — covers skip button behavior
- [ ] `src/features/authentication/useSignup.test.js` — covers account_status and consent removal

*(No existing auth component tests were found in the codebase. All three test files are new.)*

---

## Project Constraints (from CLAUDE.md)

- **Build:** `npm run build` triggers `scripts/validateTrail.mjs` — trail validation must pass (this phase does not touch trail data, so no risk)
- **Pre-commit:** Husky + lint-staged runs ESLint + Prettier on staged files — all new/edited files must pass
- **SVG imports:** Use `?react` suffix — not applicable to this phase (no SVGs added)
- **i18n:** App uses i18next (en + he RTL). New UI copy added to step components should be plain string literals in JSX for now, consistent with existing `SignupForm.jsx` (which does not use i18n keys for its inline copy)
- **Security:** Role determined from DB table presence, not metadata — `useSignup.js` writes role to `user_metadata` as a hint only (optimization). This pattern is unchanged.
- **Testing:** Test files as `*.test.{js,jsx}` siblings or in `__tests__/` next to source
- **Glass card pattern (required for auth UI):** `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl` — existing `SignupForm.jsx` already uses this

---

## Sources

### Primary (HIGH confidence)
- Direct code reading: `src/components/auth/SignupForm.jsx` — current step enum, state shape, handler pattern
- Direct code reading: `src/components/auth/AgeGate.jsx` — dropdown structure to simplify
- Direct code reading: `src/components/auth/ParentEmailStep.jsx` — form structure to modify
- Direct code reading: `src/features/authentication/useSignup.js` — mutation, consent call location, account_status logic
- Direct code reading: `src/App.jsx` — `AuthenticatedWrapper` consent render path
- Direct code reading: `supabase/migrations/20260201000001_coppa_schema.sql` — `date_of_birth DATE` column, `is_under_13` trigger logic
- Direct code reading: `src/hooks/useAccountStatus.js` — `suspended_consent` check still used for deletion path
- `.planning/phases/01-signup-flow-redesign/01-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- `CLAUDE.md` — design system glass card pattern, auth security conventions
- Vitest docs (training data, verified against installed version 3.2.4)

### Tertiary (LOW confidence)
- None — all findings are grounded in direct code inspection.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; verified existing installs
- Architecture: HIGH — all patterns derived directly from existing code
- Pitfalls: HIGH — identified from actual code paths that will change
- Migration: HIGH — single UPDATE, no schema change, confirmed trigger compatibility

**Research date:** 2026-03-23
**Valid until:** 2026-04-22 (COPPA deadline) — stable codebase, low churn risk
