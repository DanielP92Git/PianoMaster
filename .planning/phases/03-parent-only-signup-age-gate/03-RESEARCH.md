# Phase 3: Parent-Only Signup & Age Gate - Research

**Researched:** 2026-08-03
**Domain:** React auth wizard restructure + Supabase profile-presence gating (no new libraries — pure refactor of existing in-repo code)
**Confidence:** HIGH (all findings verified by direct file reads against the live repo, not training-data guesses)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Wizard Restructure**

- **D-01:** Role-first order kept: `role → DOB → credentials`. The DOB age gate sits after the role pick, so it is reached on both the Parent and the Teacher branch — a minor cannot select "Teacher" to dodge the gate.
- **D-02:** Role cards become Parent vs Teacher. The current "Student" card becomes "I'm a parent"; the Teacher card stays. The Parent branch writes a `parents` row; the Teacher branch is unchanged (writes `teachers`).
- **D-03:** Phase 3 ends at a bare parent account. Signup creates only the `parents` row — no child profile is seeded (child CRUD is Phase 4). Post-signup lands on a simple placeholder (exact landing is Claude's discretion).
- **D-04:** The old under-13 "parent-email" wizard step is removed entirely. New flow is strictly `role → DOB → credentials`. `ParentEmailStep.jsx` becomes dead code for the signup path (leave/remove at planner's discretion). The credentials step now collects parent email + password + optional parent name (→ `parents.display_name`); must stop collecting a child's first/last name. Parent name is optional per SIGNUP-04.

**OAuth Gating (roadmap's named pitfall)**

- **D-05:** Gate at the post-OAuth callback, not the button. After Google returns, check DB profile presence: a returning user (has a `parents`/`teachers`/`students` row) proceeds straight in with no DOB prompt; a brand-new user (no profile row) is forced into a mandatory DOB + role completion screen before any `parents` row is created. Extends the existing "authenticated but no profile → select role" path already present in `apiAuth.js` (~line 160). Stop relying on the OAuth `role`/`signup_mode` query params to determine role — determine new-vs-returning by profile presence and collect role in the completion screen.
- **D-06:** The OAuth completion screen collects DOB + role (Parent/Teacher), mirroring the email path. Teachers use the Google button too (it renders on the login screen today), so assuming Parent would misfile a teacher.
- **D-07:** A blocked under-18 OAuth user is signed out and shown the block screen. The `auth.users` row created by Google remains profile-less and inert — RLS denies everything to a user with no profile row, so they can never reach app data. No service-role/admin delete plumbing is added in Phase 3.

**DOB Format & Retention**

- **D-08:** Full open-field month/day/year DOB input. Rewrite/replace the year-only `AgeGate` dropdown with three open fields using the existing `ageUtils.js` helpers (`isValidDOB`, `dobPartsToDate`, `calculateAge`). The gate checks under 18 (milestone D-03), not under 13.
- **D-09:** Discard the DOB; keep only a minimal age-verified marker on `parents`. The birth date is the parent's and is used only to compute 18+. After the check, throw it away — persist just a boolean/timestamp "age-verified" marker on the `parents` row (following the existing `consent_verified_at` naming pattern), never the birth date. Phase 3 adds this column, consistent with Phase 1 D-08.

**Under-18 Block UX**

- **D-10:** Friendly dead-end with guidance ("Ask a parent or guardian to set up an account for you"), no account created and no data collected. Includes a Back/try-again path plus a route back to login. No "invite a parent" flow.
- **D-11:** The block event is not logged — no analytics event, no record.

**Privacy Policy Link (SIGNUP-05)**

- **D-12:** Surface the Privacy Policy link on the registration entry screen (in addition to the existing Terms/Privacy links at the bottom of the credentials step — `SignupForm.jsx:414-432`). The parent-settings placement (second half of SIGNUP-05) is deferred to Phase 4's settings surface.

### Claude's Discretion

- The exact post-signup landing screen for a bare parent account (minimal "no children yet / coming soon" placeholder vs the existing dashboard rendering empty). No live user hits it before Phase 6, so keep it minimal.
- Whether to delete or retain `ParentEmailStep.jsx` (dead for signup after D-04).
- Whether the open-field DOB is three inputs, a segmented control, or a native date picker — as long as it is open-field per D-08 and neutral.
- Exact column name/type for the age-verified marker (D-09) and the migration file naming, following existing migration style.
- Copy/wording and i18n keys (EN + HE parity required) for the DOB gate, block screen, OAuth completion screen, and the renamed role cards.
- Detection mechanics for returning-vs-new in the OAuth callback (which table(s) to probe, ordering), building on the existing role-from-DB-presence logic.

### Deferred Ideas (OUT OF SCOPE)

- Hard-delete of inert profile-less `auth.users` rows left by blocked under-18 OAuth attempts (a service-role Edge Function). Phase 3 leaves them inert (D-07); cleanup is optional future work.
- Anonymous aggregate count of block events (a PII-free Umami event). Considered and declined for Phase 3 (D-11).
- Parent-settings placement of the Privacy Policy link (second half of SIGNUP-05) — rides with Phase 4's settings surface (D-12).
- "Invite a parent" hand-off from the block screen — declined as scope creep + child-sourced data collection (D-10).

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                              | Research Support                                                                                                                                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SIGNUP-01 | A neutral, open-field DOB entry gates account creation                   | `ageUtils.js` already ships `isValidDOB`/`dobPartsToDate`/`calculateAge` unused by the current year-only `AgeGate.jsx` — see Code Examples. Only an 18+ sibling to `isUnder13` is missing.                                                                                                                                              |
| SIGNUP-02 | Users under 18 cannot create an account and are shown guidance           | No existing block screen exists today — `AgeGate.jsx`'s under-13 branch routes to `ParentEmailStep`, it never blocks. A new component is needed; `AuthShell`/`AuthCta` primitives are reusable.                                                                                                                                         |
| SIGNUP-03 | The gate fronts every entry point, including OAuth in `useSocialAuth.js` | **Critical verified gap:** `RoleSelection.jsx` (the current OAuth-no-profile landing screen, wired into `App.jsx`'s `AuthenticatedWrapper` at line 200) performs **zero age check today** — it inserts a `students`/`teachers` row directly from two role cards. This is the literal OAuth-bypass hole the roadmap names. See Pitfalls. |
| SIGNUP-04 | Registration collects only parent data, never child data                 | `useSignup.js`'s non-teacher branch currently writes `first_name`/`last_name`/`date_of_birth`/`parent_email` into `students` — all of this must be replaced with a `parents` insert (`id`, `display_name`, age-verified marker) for the parent role.                                                                                    |
| SIGNUP-05 | A Privacy Policy link is visible on the registration screen              | `SignupForm.jsx:414-432` already renders Terms + Privacy links, but only on the **last** (credentials) step. D-12 requires it also on the **entry** (role) screen.                                                                                                                                                                      |

</phase_requirements>

## Summary

This phase is a pure refactor of existing, already-well-structured auth code — no new libraries, no new architecture. The codebase already contains almost everything needed: `ageUtils.js` has full open-field DOB math sitting unused; `AuthShell`/`AuthCta`/`AuthInput`/`AuthSelect`/`RoleCard` are a mature design-system layer that every new screen (DOB gate, block screen, OAuth completion) can be built from without inventing new primitives; and the `parents` table (Phase 1) already exists in production with the exact `consent_verified_at`-style naming precedent D-09 asks for.

The single most important verified finding is that **the OAuth path has no age check of any kind today**. `RoleSelection.jsx` — rendered by `App.jsx`'s `AuthenticatedWrapper` (line 200) whenever a signed-in user has no `students`/`teachers` row — lets the user pick a role and immediately inserts a profile row with no DOB collection whatsoever. This is exactly the gap the roadmap's pitfall warns about, and it is the natural site for D-05/D-06/D-07's mandatory DOB+role completion screen. A second verified gap, not previously called out in CONTEXT.md: `apiAuth.js`'s `getCurrentUser()` (the role-from-DB-presence function powering `useUser()`, and therefore all of `App.jsx`'s routing) only ever queries `teachers` and `students` — it has **no knowledge of `parents` at all**. Wiring a self-signed-up parent account through without extending this function will cause every login to loop back into "no profile → select role," because a `parents`-only row is invisible to it today.

**Primary recommendation:** Extend `apiAuth.js`'s `getCurrentUser()` to also probe `parents` (new `isParent`/`userRole: 'parent'` outputs), retarget the OAuth-no-profile screen (`RoleSelection.jsx`, reachable only through `AuthenticatedWrapper`) into a DOB-first completion flow per D-06, and branch `useSignup.js`'s student-role insert into a `parents` insert while renaming the signup wizard's role semantics (`STUDENT_STEPS` → parent path) end-to-end rather than leaving the internal `role === "student"` string as a leftover naming mismatch.

## Architectural Responsibility Map

| Capability                                     | Primary Tier                                 | Secondary Tier                               | Rationale                                                                                                                                                                                                                           |
| ---------------------------------------------- | -------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOB open-field entry + client-side 18+ check   | Browser / Client                             | —                                            | Pure UI + `ageUtils.js` math, no network round-trip needed to reject an obviously-under-18 date                                                                                                                                     |
| Under-18 block screen (no account, no data)    | Browser / Client                             | —                                            | Nothing is persisted (D-11); purely presentational                                                                                                                                                                                  |
| Email/password signup → `parents` row write    | API / Backend (Supabase client SDK)          | Database                                     | `useSignup.js` calls `supabase.auth.signUp()` + `.from('parents').upsert()` directly from the client (existing pattern — no separate backend layer in this stack)                                                                   |
| OAuth signup / role-from-DB-presence detection | API / Backend (Supabase Auth + `apiAuth.js`) | Browser / Client (renders completion screen) | `getCurrentUser()` is the single source of truth for "does this session have a profile"; the UI (`RoleSelection`/`AuthenticatedWrapper`) is a pure consumer of its verdict — must not re-derive role from OAuth query params (D-05) |
| Age-verified marker persistence                | Database                                     | —                                            | New column on `parents` (Postgres), migration-owned per D-09                                                                                                                                                                        |
| Privacy Policy link visibility                 | Browser / Client                             | —                                            | Static route link (`/privacy`), no backend involvement                                                                                                                                                                              |
| RLS enforcement of inert profile-less rows     | Database                                     | —                                            | Already deny-all by default (no policy references a session with no `parents`/`teachers`/`students` row) — Phase 3 relies on, does not modify, Phase 1/2's RLS work                                                                 |

## Standard Stack

No new libraries are introduced in this phase. Every dependency needed already exists in the installed stack.

### Core (existing, reused)

| Library                    | Version          | Purpose                                                                       | Why Standard                                                              |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| React 18 + Vite 6          | (project pinned) | UI, build                                                                     | Existing stack, no change                                                 |
| `@tanstack/react-query` v5 | (project pinned) | `useMutation` for signup/OAuth mutations, `["user"]` query cache invalidation | Already the pattern in `useSignup.js`/`useSocialAuth.js`/`useUser.js`     |
| `@supabase/supabase-js`    | (project pinned) | `auth.signUp`, `auth.signInWithOAuth`, `auth.signOut`, table reads/writes     | Existing client, `src/services/supabase.js`                               |
| `react-i18next`            | (project pinned) | EN/HE translation, RTL                                                        | Existing convention; `i18n.language?.startsWith("he")` (never `=== "he"`) |
| `lucide-react`             | (project pinned) | Icons (`Info`, `ArrowLeft`, etc.) used across auth components                 | Existing convention                                                       |

### Supporting (existing, reused)

| Component/Util                                                               | Location                                     | Purpose                                                     | When to Use                                                                                                                    |
| ---------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `ageUtils.js`                                                                | `src/utils/ageUtils.js`                      | `isValidDOB`, `dobPartsToDate`, `calculateAge`, `isUnder13` | DOB gate math — add an `isUnder18` (or generalize `isUnder13` to accept a threshold) here, don't hand-roll date math elsewhere |
| `AuthShell`/`AuthInput`/`AuthSelect`/`AuthCta`/`CircleIconButton`/`RoleCard` | `src/components/auth/`                       | Design-system primitives                                    | Build the new DOB gate, block screen, and OAuth completion screen from these — do not invent new styling                       |
| `AuthLanguageToggle`                                                         | `src/components/auth/AuthLanguageToggle.jsx` | Language switcher shown on every auth screen                | Include on new screens for consistency                                                                                         |

### Alternatives Considered

| Instead of                     | Could Use                                                                           | Tradeoff                                                                                                                                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reusing `AgeGate.jsx` in place | A brand-new `DOBGate.jsx` component                                                 | CONTEXT.md D-08 says "rewrite/replace" — the existing file's props signature (`onSubmit(year)`) is a single-integer contract that doesn't fit three open fields; a clean replacement avoids threading three extra props through a component built around one |
| Client-only under-18 check     | Server-side/Edge Function re-validation of DOB before allowing the `parents` insert | Not needed per D-11's "neutral, not unbeatable" framing — self-attested DOB is explicitly accepted as gameable by the FTC standard; adding a server round-trip only for this would be scope creep with no compliance benefit                                 |

**Installation:** None — no new packages.

**Version verification:** Not applicable — no new dependency versions to verify.

## Architecture Patterns

### System Architecture Diagram

```
EMAIL/PASSWORD PATH
────────────────────
LoginForm ("Create account")
   │
   ▼
SignupForm  [step: role]
   │  (RoleCard: "I'm a parent" | "Teacher")
   ▼
SignupForm  [step: DOB-gate]  ◄── ageUtils.isValidDOB / calculateAge
   │
   ├─ under 18 ──────────────► Block screen (D-10) ─► Back / → Login
   │
   ▼ 18+
SignupForm  [step: credentials]
   │  (parent email + password + optional name; Privacy link visible
   │   both here AND on the role-entry screen per D-12)
   ▼
useSignup() mutationFn
   │
   ├─ role === teacher ──► supabase.auth.signUp() ─► teachers upsert (unchanged)
   │
   └─ role === parent  ──► supabase.auth.signUp() ─► parents upsert
                              (id, display_name, age_verified_at)
                              — NO students insert, NO promote_placeholder_student


OAUTH PATH (both /login's SocialLogin AND SignupForm's SocialLogin)
────────────────────────────────────────────────────────────────────
SocialLogin ("Sign in/up with Google")
   │
   ▼
useSocialAuth() ─► apiAuth.socialAuth() ─► supabase.auth.signInWithOAuth()
   │                                        (Google consent screen)
   ▼ (full-page redirect back to siteUrl)
App.jsx: onAuthStateChange fires ─► ["user"] query invalidated
   │
   ▼
apiAuth.getCurrentUser()  ◄── THE SINGLE DECISION POINT (role-from-DB-presence)
   │   checks: teachers? students? [MUST ADD: parents?]
   │
   ├─ profile found (returning user) ──────────────► proceed into app, no DOB prompt
   │
   └─ NO profile found (brand-new OAuth user)
          │
          ▼
     App.jsx AuthenticatedWrapper renders completion screen
     (today: RoleSelection.jsx, unconditionally, no age check)
          │
          ▼ [NEW: must collect DOB + role here, per D-06]
     DOB + role completion screen
          │
          ├─ under 18 ──► supabase.auth.signOut() ─► Block screen (D-07)
          │                (auth.users row stays; profile-less; RLS deny-all)
          │
          └─ 18+
               ├─ role = parent  ──► parents upsert
               └─ role = teacher ──► teachers upsert (unchanged)
```

### Recommended Project Structure

No new directories — all changes live inside `src/components/auth/`, `src/features/authentication/`, `src/services/apiAuth.js`, `src/utils/ageUtils.js`, and one new migration in `supabase/migrations/`.

```
src/components/auth/
├── SignupForm.jsx        # MODIFY: role labels/branch, step sequence, DOB step swap, entry-screen Privacy link
├── AgeGate.jsx            # REPLACE/REWRITE: year dropdown → open-field M/D/Y using ageUtils
├── ParentEmailStep.jsx    # DEAD CODE for signup path post D-04 — delete or leave inert (discretion)
├── RoleSelection.jsx      # MODIFY: becomes (or is wrapped by) the OAuth DOB+role completion screen (D-06)
├── [new] AgeBlockScreen.jsx (or similar)  # NEW: D-10 friendly dead-end, reused by both entry points
├── SocialLogin.jsx        # Likely UNCHANGED — mode/role props become vestigial per D-05, cleanup optional
└── RoleCard.jsx            # UNCHANGED — reused, only label/emoji props change at call sites

src/features/authentication/
├── useSignup.js           # MODIFY: parent branch inserts into `parents`, not `students`
├── useSocialAuth.js        # Likely UNCHANGED — the gating happens downstream in getCurrentUser/AuthenticatedWrapper, not in the mutation itself
└── useUser.js              # MODIFY: expose `isParent` derived from new `userRole === 'parent'`

src/services/apiAuth.js
└── getCurrentUser()        # MODIFY: add a `parents` table probe alongside teachers/students (see Pitfalls — this is NOT already handled)

src/App.jsx
└── AuthenticatedWrapper     # MODIFY: route a bare parent (isParent, no children — Phase 4 concern) to a placeholder instead of TeacherRedirect → TrailMapPage

supabase/migrations/
└── [new] YYYYMMDDHHMMSS_add_parent_age_verified.sql  # ADD age-verified marker column to `parents`
```

### Pattern 1: Existing open-field DOB math (ready to use, currently dead code)

**What:** `ageUtils.js` already implements everything D-08 needs except the 18+ threshold.
**When to use:** The new DOB gate component's submit handler.
**Example:**

```javascript
// Source: src/utils/ageUtils.js (verified current file, lines 1-68)
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
// NEEDS a sibling, e.g.:
// export function isUnder18(birthDate) { return calculateAge(birthDate) < 18; }

export function dobPartsToDate({ month, day, year }) {
  return new Date(year, month - 1, day); // month is 1-12 in input
}

export function isValidDOB({ month, day, year }) {
  if (!month || !day || !year) return false;
  const date = dobPartsToDate({ month, day, year });
  const today = new Date();
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    date < today &&
    date.getFullYear() > today.getFullYear() - 120
  );
}
```

### Pattern 2: Role-from-DB-presence (the seam D-05 extends — verified exact current shape)

**What:** `apiAuth.js`'s `getCurrentUser()` is the ONLY place role is determined; it is a hard project security rule that this stays DB-driven, never JWT/metadata-driven.
**When to use:** Any new "is this a returning vs brand-new user" check must call through this function, not re-derive from OAuth query params.
**Example (current code, verified, lines 90-184):**

```javascript
// Source: src/services/apiAuth.js:90-184 (current, BEFORE this phase's edit)
// SECURITY: Determine user role ONLY from database table presence.
let userRole = null;
let profile = null;
const metadataHint = user.user_metadata?.role;
const checkTeacherFirst = metadataHint === "teacher";
if (checkTeacherFirst) {
  // ...checks teachers, then students...
} else {
  // ...checks students, then teachers...
}
// If user has no profile in either table, they need to complete registration
if (!userRole) {
  return {
    ...user,
    userRole: null,
    profile: null,
    isTeacher: false,
    isStudent: false,
    needsRoleSelection: true,
  };
}
```

**Gap this phase must close:** there is no `parents` branch anywhere in this function. A self-registered parent (email/password OR OAuth) is currently invisible to `getCurrentUser()` and will always resolve to `needsRoleSelection: true`, even after a successful `parents` row insert.

### Pattern 3: The exact OAuth-bypass gap (verified — no age check exists today)

**What:** `RoleSelection.jsx` is rendered by `App.jsx`'s `AuthenticatedWrapper` (line 200: `if (user && !isLoading && !profile && !userRole) return <RoleSelection user={user} />;`) for ANY authenticated session with no profile row — which today includes every brand-new OAuth signup, with zero regard for age.
**Example (current code, verified):**

```javascript
// Source: src/components/auth/RoleSelection.jsx:29-72 (current, BEFORE this phase's edit)
const { mutate: createProfile } = useMutation({
  mutationFn: async (role) => {
    // ... derives firstName/lastName from user_metadata ...
    if (role === "teacher") {
      return supabase.from("teachers").insert([{ id: user.id, ... }]).select().single();
    } else {
      // NO AGE CHECK ANYWHERE IN THIS FILE
      return supabase.from("students").insert([{ id: user.id, ... }]).select().single();
    }
  },
});
```

This confirms the roadmap's "OAuth-bypass gap" pitfall is real and currently unmitigated — a 10-year-old signing in with Google today reaches this screen and can create a `students` row with no DOB collected. D-05/D-06/D-07 must retarget this exact component (or insert a new step ahead of it) to collect DOB first, block under-18, and only then let role selection proceed to a `parents`/`teachers` insert.

### Pattern 4: OAuth query params are already-dead weight (confirms D-05's "stop relying on them")

**What:** `apiAuth.js`'s `socialAuth()` passes `role`/`signup_mode` as `queryParams` to Google's OAuth `signInWithOAuth()` call, but nothing anywhere in the codebase reads them back after the redirect — `RoleSelection.jsx` derives everything from `user.id`/`user.email`/`user_metadata`, never from a URL search param.
**Example (current code, verified):**

```javascript
// Source: src/services/apiAuth.js:300-312
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: siteUrl,
    queryParams: {
      access_type: "offline",
      prompt: "consent",
      ...(mode === "signup" && { signup_mode: true, role: role }),
    },
  },
});
```

**Confidence:** HIGH — verified by reading every file that imports `useSocialAuth`/`SocialLogin` and finding no query-string parsing anywhere in the OAuth return path. D-05's instruction to "stop relying" on these params is already effectively true in the JS layer; the params are vestigial and can be left as-is (harmless, ignored by Google) or removed as cleanup — planner's discretion, low risk either way.

### Anti-Patterns to Avoid

- **Trusting OAuth `queryParams` for role/mode on return:** confirmed dead already (Pattern 4) — do not build new logic that starts reading them.
- **Re-deriving role from `user.user_metadata` or `user.app_metadata`:** the project's hard security rule (`apiAuth.js:90` comment) — role must come from table presence only.
- **Skipping the `getCurrentUser()` extension:** without adding a `parents` probe, the entire parent signup path silently loops back to "select role" forever — this is not optional plumbing, it is required for SIGNUP-04 to actually complete.
- **Leaving `TeacherRedirect`/`/` index route pointed at `TrailMapPage` for a bare parent:** `TeacherRedirect` (App.jsx:240-248) renders `<TrailMapPage />` for any non-teacher today — a parent with no `students` row hitting this would be an integration bug, not a Phase 4 concern deferred cleanly. The landing placeholder (Claude's discretion per D-03) must be wired into this routing decision now, even if its content is minimal.

## Don't Hand-Roll

| Problem                                           | Don't Build                                                                                                                           | Use Instead                                                       | Why                                                                                                                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Age-in-years calculation from a birth date        | A new date-math function inline in the new DOB gate component                                                                         | `ageUtils.calculateAge()` (existing)                              | Already handles the "birthday hasn't occurred yet this year" edge case correctly; duplicating it risks a subtly different (wrong) leap-year/month-boundary result                                                               |
| DOB field validity checks                         | Ad-hoc `if (year && month && day)` checks scattered in the new component                                                              | `ageUtils.isValidDOB()` (existing)                                | Already checks NaN dates, future dates, and the 120-year sanity bound                                                                                                                                                           |
| "Is this session a returning or brand-new user"   | A new helper function checking `user.created_at` timestamp freshness, or checking for the presence of a specific `user_metadata` flag | Extend `apiAuth.getCurrentUser()`'s existing table-presence check | This is the codebase's one enforced pattern (hard security rule) for role/identity resolution — a second, parallel detection mechanism would create two sources of truth that can disagree                                      |
| Identity/age verification beyond self-attestation | Any ID-upload, credit-card-check, or knowledge-question age-verification flow                                                         | Self-attested open-field DOB (D-08)                               | Explicitly rejected scope — the FTC's own guidance treats knowledge-question gates as invalid and does not require unbeatable verification; D-11's "not unbeatable, just non-encouraging" framing is the accepted legal posture |

**Key insight:** every "hard part" of this phase (date math, role determination, design-system primitives) already exists correctly in the codebase. The actual engineering work is wiring — extending one function (`getCurrentUser`), inserting one new gate ahead of one existing screen (`RoleSelection`), and branching one insert (`useSignup`) — not building anything new from scratch.

## Common Pitfalls

### Pitfall 1: `getCurrentUser()` has no `parents` awareness (verified, not previously named in CONTEXT.md)

**What goes wrong:** A parent completes signup (email/password OR OAuth), a `parents` row is written, but `apiAuth.getCurrentUser()` still only queries `teachers` and `students`. The user is immediately routed back into "needs role selection" on next load/refresh, in an infinite loop.
**Why it happens:** The function predates the `parents` table (it was written when only `students`/`teachers` existed) and Phase 1/2 did not touch `apiAuth.js` (those phases were pure schema/RLS work).
**How to avoid:** Add a third branch (probe `parents`) to `getCurrentUser()`, return `isParent`/`userRole: 'parent'`, and update `useUser()` (`src/features/authentication/useUser.js`) to expose `isParent`.
**Warning signs:** Manual test — sign up as a parent, refresh the page; if it re-shows a role-selection screen, this pitfall has been hit.

### Pitfall 2: `TeacherRedirect` sends a bare parent into `TrailMapPage`

**What goes wrong:** `App.jsx`'s index route renders `<TeacherRedirect />`, which renders `<TrailMapPage />` for any non-teacher. `TrailMapPage` expects a student's trail/progress data; a parent account with no child profile (D-03: Phase 3 intentionally creates none) will hit this and likely render broken or empty in a confusing way, not the "simple placeholder" D-03 asks for.
**Why it happens:** `TeacherRedirect`'s binary is/isn't-teacher branch predates the parent role entirely.
**How to avoid:** Add an `isParent` branch to this component (or its replacement) that renders the discretion-owned placeholder instead of `TrailMapPage`.
**Warning signs:** A newly-signed-up parent account, on landing at `/`, sees trail/game UI instead of a parent-appropriate screen.

### Pitfall 3: Internal `role === "student"` string left as a naming mismatch after D-02's relabel

**What goes wrong:** D-02 only says the card's visible label changes from "Student" to "I'm a parent" and the branch writes `parents` instead of `students`. If the internal `role` value stays the literal string `"student"` (as it is today: `handleRoleSelect("student")`, `STUDENT_STEPS`, `role === "teacher"` else-branches, i18n keys `role.student`/`submitStudent`), every future reader of this code has to remember "`student` means `parent` now" — a Phase-8-style renaming debt created inside Phase 3 itself, not carried over from an earlier phase.
**Why it happens:** The path of least resistance is to touch only the JSX label and the DB table name, leaving the variable/string plumbing (`STUDENT_STEPS`, `role.student` i18n keys, `submitStudent`) untouched.
**How to avoid:** Decide explicitly during planning whether to rename `role: "student"` → `role: "parent"` end-to-end (including `STUDENT_STEPS` → e.g. `PARENT_STEPS`, i18n key renames) or to explicitly document the string-vs-label divergence as accepted debt. Either is viable; leaving it undecided is not — flagged here as an Open Question below.
**Warning signs:** A future grep for "student" turns up parent-signup code with no comment explaining why.

### Pitfall 4: `RoleSelection.test.jsx` and `AgeGate.test.jsx` assert the CURRENT (pre-Phase-3) behavior

**What goes wrong:** `RoleSelection.test.jsx` (6 tests) asserts that clicking "Student"/"Teacher" immediately inserts into `students`/`teachers` with no DOB step — this is the exact behavior D-05/D-06 replace. `AgeGate.test.jsx` (2 tests) asserts a single year `<select>` — this is exactly what D-08 replaces with three open fields.
**Why it happens:** Both files test today's shipped behavior, which this phase intentionally changes.
**How to avoid:** Plan must include rewriting both test files (not just source), or the suite will show real regressions (not false positives) after this phase's changes land.
**Warning signs:** `npm run test:run` failing on these exact files post-implementation is _expected_ and must be resolved by updating the tests to match the new flow, not by reverting the source change.

### Pitfall 5: `ParentEmailStep.test.jsx` already has `it.todo()` stubs anticipating a DIFFERENT plan than this phase's D-04

**What goes wrong:** The existing test file has `it.todo()` stubs referencing "Post Plan-02 behavior... D-07 — Skip button" — this refers to the _milestone's_ now-superseded v2.7 numbering, not this phase's D-04 (full removal from the signup path). If left as-is, these `it.todo()`s could mislead a future reader into thinking the file still needs work when D-04 says the whole component is dead code for signup.
**Why it happens:** Test stub predates the v4.0 milestone's decision to remove the step entirely rather than refine it.
**How to avoid:** If `ParentEmailStep.jsx` is deleted per discretion, delete its test file too. If retained inert, add a comment noting D-04 supersedes the file's own `it.todo()` roadmap.
**Warning signs:** None functionally (todos don't fail CI) — this is a documentation-hygiene pitfall, not a runtime one.

### Pitfall 6: `useAccountStatus`'s "non-students default to active" masking

**What goes wrong:** `useAccountStatus.js` queries `students` unconditionally when `enabled` is true, and its `enabled` gate is `isStudent` from `useUser()`. Since a parent account will have `isStudent: false` (once `getCurrentUser` is correctly extended per Pitfall 1), this hook is correctly skipped for parents — **verified safe, not a pitfall in practice** — but only _if_ Pitfall 1 is fixed first. If `getCurrentUser()` is left unextended, a parent might transiently be misclassified and this hook's silent "row not found → default active" fallback would mask the misclassification rather than surface it.
**Why it happens:** Order-of-operations risk — this hook's safety depends on Pitfall 1 being closed first.
**How to avoid:** Sequence the `getCurrentUser()` extension (Pitfall 1) before/alongside any other routing change; verify via manual parent-account smoke test, not just unit tests (which mock `getCurrentUser`).

## Code Examples

### Current `parents` table schema (verified via migration file, Phase 1 output — already in production)

```sql
-- Source: supabase/migrations/20260722120000_add_parents_and_child_profiles.sql:29-35
CREATE TABLE IF NOT EXISTS parents (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  display_name       TEXT,
  requires_reconsent BOOLEAN NOT NULL DEFAULT FALSE   -- D-09 (Phase 1): Phase 6 re-consent flag
);
```

This confirms: no `email` column (lives in `auth.users`, per Phase 1 D-08), no age-verified marker yet — this phase's D-09 must add one, e.g. `age_verified_at TIMESTAMPTZ` (naming precedent: `students.consent_verified_at TIMESTAMPTZ`, verified in `supabase/migrations/20260201000001_coppa_schema.sql`).

### Existing `consent_verified_at` naming precedent (verified, for D-09's marker column)

```sql
-- Source: supabase/migrations/20260201000001_coppa_schema.sql:44, 448
ALTER TABLE students ADD COLUMN IF NOT EXISTS consent_verified_at TIMESTAMPTZ;
COMMENT ON COLUMN students.consent_verified_at IS '...';
```

### Migration file naming convention (verified from most recent 2 migrations)

```
20260722120000_add_parents_and_child_profiles.sql   (+ .down.sql sibling)
20260801120000_rls_ownership_rewrite.sql             (+ .down.sql sibling)
```

Pattern: `YYYYMMDDHHMMSS_snake_case_description.sql`, always paired with a `.down.sql` rollback file (project convention across the last several migrations, not just this milestone).

## State of the Art

| Old Approach (current code)                                                           | New Approach (this phase)                                                             | When Changed                                                                         | Impact                                                                                                                                |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `AgeGate.jsx` — single year `<select>` dropdown, under-13 threshold only              | Open-field month/day/year inputs, under-18 threshold, using existing `ageUtils.js`    | This phase (D-08)                                                                    | Matches SIGNUP-01's literal wording and the FTC neutral-gate standard                                                                 |
| `RoleSelection.jsx` — instant role pick → instant profile insert, zero age check      | Mandatory DOB + role completion screen before any profile insert                      | This phase (D-05/D-06)                                                               | Closes the OAuth-bypass pitfall named in the roadmap — currently the single biggest compliance gap in the codebase for this milestone |
| `useSignup.js` non-teacher branch → `students` upsert + `promote_placeholder_student` | Parent-role branch → `parents` upsert (no `students` touch, no placeholder promotion) | This phase (D-04)                                                                    | Delivers SIGNUP-04's "zero child data at signup"                                                                                      |
| `getCurrentUser()` — checks `teachers`/`students` only                                | Adds a `parents` probe, returns `isParent`                                            | This phase (required, not previously named as a decision but structurally necessary) | Without this, self-registered parents can never successfully "arrive" in the app                                                      |

**Deprecated/outdated:**

- `ParentEmailStep.jsx`'s role in the signup path: dead once D-04 lands (may be retained inert per discretion, but no longer reachable from `SignupForm`).
- The `role`/`signup_mode` OAuth `queryParams` in `apiAuth.socialAuth()`: already functionally dead (Pattern 4) — formally superseded by D-05's profile-presence detection.

## Assumptions Log

| #   | Claim                                                                                                                               | Section                       | Risk if Wrong                                                                                                                                                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | The age-verified marker column should be named following the `consent_verified_at` pattern (e.g. `age_verified_at TIMESTAMPTZ`)     | Code Examples, Standard Stack | Low — D-09 explicitly leaves exact naming to planner discretion; this is a suggestion, not a claim requiring correction                                                                                                                           |
| A2  | `TeacherRedirect`/index-route landing for a bare parent needs an explicit new branch rather than being fully deferrable to Phase 4  | Pitfall 2                     | Medium — if the planner disagrees and defers this entirely to Phase 4, a freshly-signed-up parent could see a broken/empty `TrailMapPage` between Phase 3 and Phase 4 ship dates; worth an explicit planning decision rather than silent deferral |
| A3  | Renaming internal `role: "student"` → `role: "parent"` (Pitfall 3) is in-scope for this phase rather than acceptable long-term debt | Pitfall 3                     | Low-Medium — either choice is defensible; flagged so it's a deliberate planning decision, not an oversight                                                                                                                                        |

**If this table is empty:** N/A — see above; all three are low-risk framing/scope suggestions, not factual claims about external systems.

## Open Questions (RESOLVED)

> **All three resolved during planning (Phase 3, 2026-08-03); threaded through 03-PATTERNS.md and the plans.**
>
> - **Q1 — RESOLVED:** Rename the internal role end-to-end `"student"` → `"parent"` (Plans 03-05 and 03-07 rename `STUDENT_STEPS`, `role === "student"` checks, and the `role.*`/`submit*` i18n keys in both locales).
> - **Q2 — RESOLVED:** Retrofit `RoleSelection.jsx` as a two-step internal state machine (role → DOB), mirroring the email path's step order — not a new split component (Plan 03-08).
> - **Q3 — RESOLVED:** The block screen is local component state with no router navigation ("Back to login" is a state reset; losing the session naturally routes to `/login`) — email path in Plans 03-04/03-07, OAuth path in Plan 03-08.

1. **Does the internal `role` value get renamed from `"student"` to `"parent"`, or does the string stay `"student"` while only the UI label changes?**
   - What we know: D-02 only decides the card's visible label and which table the branch writes to.
   - What's unclear: Whether `STUDENT_STEPS`, `role === "student"` checks, and the `role.student`/`submitStudent` i18n keys get renamed too.
   - Recommendation: Decide explicitly in planning — renaming end-to-end is cleaner long-term but touches more call sites (`SignupForm.jsx`, i18n keys in both locales, `RoleSelection.jsx` if merged); keeping "student" as an internal-only legacy string is lower-diff but adds a "student actually means parent here" landmine for future readers. Either is acceptable; silence is not.

2. **Should the OAuth completion screen (D-06) be a rewrite of `RoleSelection.jsx`, or a new component inserted ahead of it?**
   - What we know: D-06 says the completion screen collects DOB + role, mirroring the email path; `RoleSelection.jsx` today collects only role.
   - What's unclear: Whether to add a DOB step to `RoleSelection.jsx` itself (two-step internal state, mirroring `SignupForm`'s step machine) or split into two components (a new DOB gate + the existing `RoleSelection` retained for role-only, run in sequence from `AuthenticatedWrapper`).
   - Recommendation: A two-step internal state machine inside a renamed/restructured `RoleSelection.jsx` most closely mirrors the email path's `role → DOB` step order (D-01) and reuses one component's existing mutation/toast wiring; a split-component approach also works but needs `AuthenticatedWrapper` to track which step it's on. Low risk either way — implementation detail, not a design decision.

3. **Exact wording/route for the block screen's "route back to login" (D-10) — does it use React Router `navigate`, or does the block screen live outside the router (like `RoleSelection` does)?**
   - What we know: `RoleSelection.jsx`'s own doc comment says it is "rendered by `AuthenticatedWrapper` ahead of the router, so it has no route of its own" — the OAuth block screen (for an under-18 who was signed out) will similarly render pre-router or post-signout, since by definition the user has no session when they see it.
   - What's unclear: Whether the block screen renders as a state inside `SignupForm`'s wizard (email path, no session yet) reusing existing patterns cleanly, versus needing new state in `AuthenticatedWrapper`/`App.jsx` for the OAuth path (post-signout, pre-redirect-to-login).
   - Recommendation: For the email path, this is straightforward (just another wizard step, same as `AgeGate`'s existing under-13 branch today). For the OAuth path, after `supabase.auth.signOut()`, the user has no session — the natural place is to render the block screen as local state in whatever component currently shows `RoleSelection`/the completion screen (i.e., `AuthenticatedWrapper` or its replacement), with a "Back to login" button that's just a state reset (no navigation needed, since losing the session will naturally route to `/login` on next render once `AuthenticatedWrapper`'s `user` becomes null).

## Validation Architecture

### Test Framework

| Property           | Value                                                 |
| ------------------ | ----------------------------------------------------- |
| Framework          | Vitest (JSDOM environment) + `@testing-library/react` |
| Config file        | `vitest.config.js` (repo root)                        |
| Quick run command  | `npx vitest run src/components/auth/<File>.test.jsx`  |
| Full suite command | `npm run test:run`                                    |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                                                               | Test Type        | Automated Command                                                                                                       | File Exists?                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| SIGNUP-01 | New DOB gate accepts valid open-field M/D/Y and rejects invalid/future dates                                           | unit + component | `npx vitest run src/utils/ageUtils.test.js` (new) and the DOB gate's own `.test.jsx`                                    | ❌ Wave 0 — `ageUtils.js` has no existing test file at all (verified: no `ageUtils.test.js` found in repo) |
| SIGNUP-01 | `isUnder18` (or equivalent) correctly classifies boundary dates (exactly 18 today, 17 years 364 days, 18 years 0 days) | unit             | `npx vitest run src/utils/ageUtils.test.js` (new)                                                                       | ❌ Wave 0                                                                                                  |
| SIGNUP-02 | Under-18 DOB in signup wizard shows block screen, creates no account                                                   | component        | `npx vitest run src/components/auth/SignupForm.test.jsx`                                                                | ✅ file exists, needs new test cases added                                                                 |
| SIGNUP-02 | Block screen has a working "try again" path back to DOB entry                                                          | component        | same file as above, or a new dedicated block-screen `.test.jsx`                                                         | ❌ Wave 0 if split into its own component                                                                  |
| SIGNUP-03 | OAuth completion screen (post-redirect, no profile) blocks under-18 and signs the user out                             | component        | `npx vitest run src/components/auth/RoleSelection.test.jsx` (rewritten)                                                 | ✅ file exists, needs substantial rewrite (see Pitfall 4)                                                  |
| SIGNUP-03 | `getCurrentUser()` correctly detects a `parents` row as "has profile"                                                  | unit             | new test in `src/services/apiAuth.test.js` (if it doesn't exist — verify during Wave 0)                                 | ❌ Wave 0 — confirm whether `apiAuth.test.js` exists; if not, create one covering the 3-table branch       |
| SIGNUP-04 | Parent signup writes only to `parents`, never `students`                                                               | unit             | `npx vitest run src/features/authentication/useSignup.test.js` (currently mostly `it.todo()` stubs — see verified file) | ✅ file exists but is nearly empty (3 `it.todo()`s) — must be filled in, not just left as stubs            |
| SIGNUP-05 | Privacy Policy link is present and points to `/privacy` on the role-entry screen                                       | component        | `npx vitest run src/components/auth/SignupForm.test.jsx`                                                                | ✅ file exists, needs new assertion for the entry-screen link (D-12)                                       |

### Sampling Rate

- **Per task commit:** `npx vitest run <changed test file(s)>`
- **Per wave merge:** `npm run test:run` (full suite — 2160+ tests as of Phase 2's close; watch for the intentional `RoleSelection.test.jsx`/`AgeGate.test.jsx` behavior changes described in Pitfall 4)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/utils/ageUtils.test.js` — does not exist today (verified: no matching file found); needed to cover the new `isUnder18` sibling and boundary-date correctness for SIGNUP-01/02
- [ ] Confirm existence of `src/services/apiAuth.test.js` before planning assumes it exists — the `getCurrentUser()` extension (Pitfall 1) is the highest-risk single change in this phase and needs direct unit coverage, not just component-level mocking
- [ ] `RoleSelection.test.jsx` and `AgeGate.test.jsx` — both need substantial rewrites (not additions) since their current assertions describe the exact behavior this phase replaces (Pitfall 4)
- [ ] `useSignup.test.js` — currently 3 `it.todo()` stubs with zero real assertions; needs to become a real test file covering the parent-vs-teacher branch

_(No EN/HE i18n key-parity automated check exists anywhere in the repo today — verified by search. If new auth strings are added without a parity script, verification will need to be a manual side-by-side diff of `en/common.json` vs `he/common.json`, consistent with how the project has handled i18n additions in every prior phase.)_

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies                         | Standard Control                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | Yes                             | Unchanged — Supabase Auth (`auth.signUp`/`auth.signInWithOAuth`/`auth.signOut`) continues to own credential handling; this phase only gates what happens _after_ successful auth, never re-implements auth itself                                                                           |
| V3 Session Management | Yes                             | D-07's "sign out a blocked under-18" must use `supabase.auth.signOut()` (or the existing `apiAuth.logout()` wrapper, which additionally clears user-scoped `localStorage` keys — safe and arguably preferable here since a blocked user's session should leave no trace on a shared device) |
| V4 Access Control     | Yes (relied upon, not modified) | Phase 1/2's RLS deny-all-by-default already makes a profile-less `auth.users` row inert — this phase must not add any code path that queries app data before a profile row exists, or it would need its own RLS policy (out of scope)                                                       |
| V5 Input Validation   | Yes                             | DOB open fields: validate via existing `ageUtils.isValidDOB()` (already handles NaN/future-date/120-year-bound); parent email/password/name fields reuse existing `AuthInput` validation patterns already in `SignupForm.jsx`                                                               |
| V6 Cryptography       | No                              | Not touched by this phase — no new crypto, no new secrets                                                                                                                                                                                                                                   |

### Known Threat Patterns for this stack

| Pattern                                                                                                  | STRIDE                                                  | Standard Mitigation                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Self-attested DOB spoofing (a minor enters a fake adult birth date)                                      | Spoofing                                                | Accepted risk per D-11/FTC neutral-gate standard — explicitly not mitigated further; do not add friction (ID checks, etc.) beyond the open-field gate                                                                                                               |
| Client trusting OAuth `queryParams` (`role`/`signup_mode`) as an authorization signal                    | Tampering                                               | Already not relied upon in practice (Pattern 4) — D-05 formalizes this; do not introduce new code that reads these params for authorization                                                                                                                         |
| Profile-less `auth.users` row retained after a blocked under-18 attempt being reachable via a future bug | Elevation of Privilege                                  | Mitigated structurally by Phase 1/2's RLS deny-all-by-default (verified: no policy anywhere grants access absent a `parents`/`teachers`/`students` row) — this phase must not weaken that by, e.g., adding a fallback "default role" anywhere in `getCurrentUser()` |
| A parent account silently never resolving (Pitfall 1) causing repeated `auth.signUp`/insert retries      | Denial of Service (self-inflicted, not attacker-driven) | Fix at the source — extend `getCurrentUser()` correctly; do not paper over with client-side retry loops                                                                                                                                                             |

## Sources

### Primary (HIGH confidence — direct file reads of this repo, verified this session)

- `src/components/auth/SignupForm.jsx` (441 lines, full file read)
- `src/components/auth/AgeGate.jsx` (82 lines, full file read)
- `src/components/auth/ParentEmailStep.jsx` (96 lines, full file read)
- `src/components/auth/SocialLogin.jsx` (25 lines, full file read)
- `src/components/auth/RoleSelection.jsx` (171 lines, full file read)
- `src/components/auth/LoginForm.jsx` (368 lines, full file read)
- `src/features/authentication/useSocialAuth.js`, `useSignup.js`, `useUser.js` (full file reads)
- `src/services/apiAuth.js` (469 lines, full file read)
- `src/utils/ageUtils.js` (69 lines, full file read)
- `src/App.jsx` (652 lines, full file read — `AuthenticatedWrapper`, `TeacherRedirect`, `AppRoutes`)
- `src/ui/ProtectedRoute.jsx`, `src/hooks/useAccountStatus.js` (full file reads)
- `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` (parents/child_profiles DDL, verified via grep + direct read of matching lines)
- `supabase/migrations/20260201000001_coppa_schema.sql` (`consent_verified_at` precedent, verified via grep)
- `supabase/migrations/` directory listing (migration file naming convention, verified via `ls`)
- `src/locales/en/common.json`, `src/locales/he/common.json` (`auth.signup.*`, `auth.roleSelection.*` key structures, verified via Node require + diff)
- `src/components/auth/AgeGate.test.jsx`, `RoleSelection.test.jsx`, `ParentEmailStep.test.jsx`, `src/features/authentication/useSignup.test.js` (all full file reads)
- `.planning/phases/03-parent-only-signup-age-gate/03-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/phases/01-identity-schema-expand/01-CONTEXT.md`, `.planning/ROADMAP.md`, `COPPA_REFACTOR_PRD.md` (all fully read)

### Secondary (MEDIUM confidence)

- None — no web/external sources were needed for this phase; it is a pure in-repo refactor with no new third-party integration.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new libraries; every referenced util/component verified present in the repo by direct read
- Architecture: HIGH — every file/line reference in this document was independently re-verified this session (several CONTEXT.md line-number citations were confirmed accurate: `apiAuth.js` socialAuth ~287 ✅ exact; role-from-DB-presence ~90 ✅ exact comment location; "no profile" path ~160 ✅ within 1-10 lines)
- Pitfalls: HIGH — Pitfalls 1–3 are newly-discovered structural gaps (not previously documented in CONTEXT.md), found by tracing actual call sites (`getCurrentUser()`, `TeacherRedirect`, the `role` string) rather than inferred from training data

**Research date:** 2026-08-03
**Valid until:** No expiry driver — this is a pure in-repo refactor with no external dependency versions to go stale; re-verify only if Phase 1/2 code is touched again before Phase 3 executes (unlikely, both are marked complete/applied)
