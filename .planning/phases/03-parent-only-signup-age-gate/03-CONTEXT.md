# Phase 3: Parent-Only Signup & Age Gate - Context

**Gathered:** 2026-08-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure the account-creation flow so **every new account belongs to an adult**, fronted by a
**neutral under-18 date-of-birth gate that covers every entry point** — the email/password form and
the Google OAuth button (on both the login and signup screens). Registration collects **only parent
data** (parent email, password/OAuth token, optionally the parent's name), never child data, and a
Privacy Policy link is visible on the registration screen. New self-signups route into the Phase 1
`parents` schema.

Delivers SIGNUP-01…SIGNUP-05.

**Not in this phase:** child profile CRUD / avatar picker / profile switcher (Phase 4 — a Phase 3
signup ends at a bare parent account with no child), the parental math-gate on settings/billing
(Phase 4), subscription re-pointing (Phase 5), live migration of the 15 existing accounts + the
blocking re-consent screen for self-registered minors (Phase 6), recording removal (Phase 7),
dropping legacy identity policies (Phase 8). The parent-settings placement of the Privacy Policy
link (second half of SIGNUP-05) rides along with Phase 4's settings surface.

</domain>

<decisions>
## Implementation Decisions

### Wizard Restructure

- **D-01:** **Role-first order kept:** `role → DOB → credentials`. The DOB age gate sits after the
  role pick, so it is reached on **both** the Parent and the Teacher branch — a minor cannot select
  "Teacher" to dodge the gate. (User chose this over the DOB-first alternative; the OAuth-bypass
  concern that DOB-first would have covered is instead closed at the callback — see D-05.)
- **D-02:** **Role cards become Parent vs Teacher.** The current "Student" card becomes "I'm a
  parent" (setting this up for my child); the "Teacher" card stays (milestone D-02 keeps teachers).
  The Parent branch writes a `parents` row; the Teacher branch is unchanged (writes `teachers`).
  Reuses the existing `RoleCard` component and two-branch wizard.
- **D-03:** **Phase 3 ends at a bare parent account.** Signup creates only the `parents` row — **no
  child profile is seeded** (child CRUD is Phase 4). Honors SIGNUP-04 (zero child data at signup).
  Safe because no live user reaches this state until Phase 6 cutover, and Phase 4 ships "add a child"
  before then. Post-signup lands on a simple placeholder (exact landing is Claude's discretion; see
  below).
- **D-04:** **The old under-13 "parent-email" wizard step is removed entirely.** With no child at
  signup there is no child's parent-email to collect. The new flow is strictly
  `role → DOB → credentials`. Consequence: `ParentEmailStep.jsx` becomes dead code for the signup
  path (leave/remove at planner's discretion). The credentials step now collects **parent email +
  password + optional parent name** (→ `parents.display_name`); it must stop collecting a child's
  first/last name. Parent name is **optional** per SIGNUP-04.

### OAuth Gating (roadmap's named pitfall)

- **D-05:** **Gate at the post-OAuth callback, not the button.** After Google returns, check DB
  profile presence: a **returning** user (has a `parents`/`teachers`/`students` row) proceeds
  straight in with no DOB prompt; a **brand-new** user (no profile row) is forced into a mandatory
  **DOB + role completion screen before any `parents` row is created**. This covers the login-screen
  Google button and the signup Google button uniformly (positioning in the wizard cannot protect the
  login-screen button, and the redirect round-trip wipes any DOB collected pre-redirect). Extends the
  existing "authenticated but no profile → select role" path already present in `apiAuth.js` (~line
  160). Stop relying on the OAuth `role`/`signup_mode` query params to determine role — determine
  new-vs-returning by profile presence and collect role in the completion screen.
- **D-06:** **The OAuth completion screen collects DOB + role (Parent/Teacher)**, mirroring the email
  path. Teachers use the Google button too (it renders on the login screen today), so assuming Parent
  would misfile a teacher.
- **D-07:** **A blocked under-18 OAuth user is signed out and shown the block screen.** The
  `auth.users` row created by Google remains **profile-less and inert** — RLS denies everything to a
  user with no profile row, so they can never reach app data. No service-role/admin delete plumbing
  is added in Phase 3. (Hard-delete of these inert rows is a deferred idea.)

### DOB Format & Retention

- **D-08:** **Full open-field month/day/year DOB input.** Rewrite/replace the year-only `AgeGate`
  dropdown with three open fields using the **existing** `ageUtils.js` helpers (`isValidDOB`,
  `dobPartsToDate`, `calculateAge`). Matches SIGNUP-01's exact wording ("neutral, open-field
  date-of-birth") and is the most defensible FTC-style neutral gate. The gate checks **under 18**
  (milestone D-03), not under 13.
- **D-09:** **Discard the DOB; keep only a minimal age-verified marker on `parents`.** The birth date
  is the _parent's_ and is used only to compute 18+. After the check, throw it away — persist just a
  boolean/timestamp "age-verified" marker on the `parents` row (following the existing
  `consent_verified_at` naming pattern), never the birth date. Phase 3 adds this column, consistent
  with Phase 1 D-08 ("consent/legal columns are added by whichever phase actually writes them").
  Aligns with the app's data-minimization core value.

### Under-18 Block UX

- **D-10:** **Friendly dead-end with guidance.** A kind screen ("Ask a parent or guardian to set up
  an account for you"), no account created and no data collected, honoring SIGNUP-02. Includes a
  Back/try-again path so a legit adult who mistyped their DOB can correct it, plus a route back to
  login. No "invite a parent" flow (that would be scope creep and would collect a parent email _from_
  a minor — the exact child-sourced collection this milestone avoids).
- **D-11:** **The block event is not logged** — no analytics event, no record. Keeps the app's
  conservative posture of building no tracking around minors. (Reality noted: a self-attested DOB
  gate is neutral, not identity verification — a determined minor can re-enter a fake adult date;
  the FTC neutral-gate standard accepts this. The goal is a gate that does not _encourage_
  under-agers, not an unbeatable one.)

### Privacy Policy Link (SIGNUP-05)

- **D-12:** **Surface the Privacy Policy link on the registration entry screen** (in addition to the
  existing Terms/Privacy links at the bottom of the credentials step — `SignupForm.jsx:414-432`). The
  **parent-settings** placement (the second half of SIGNUP-05) is deferred to Phase 4's settings
  surface. Recorded as a default the user accepted rather than a discussed topic.

### Claude's Discretion

Resolve these during planning without returning to the user:

- The exact **post-signup landing screen** for a bare parent account (a minimal "no children yet /
  coming soon" placeholder vs the existing dashboard rendering empty). No live user hits it before
  Phase 6, so keep it minimal.
- Whether to **delete or retain** `ParentEmailStep.jsx` (dead for signup after D-04).
- Whether the open-field DOB is three inputs, a segmented control, or a native date picker — as long
  as it is open-field per D-08 and neutral.
- Exact column name/type for the age-verified marker (D-09) and the migration file naming, following
  existing migration style.
- Copy/wording and i18n keys (EN + HE parity required, per project convention) for the DOB gate,
  block screen, OAuth completion screen, and the renamed role cards.
- Detection mechanics for returning-vs-new in the OAuth callback (which table(s) to probe, ordering),
  building on the existing role-from-DB-presence logic.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope & locked decisions

- `.planning/ROADMAP.md` §"Phase 3: Parent-Only Signup & Age Gate" — goal, 5 success criteria, and
  the OAuth-bypass pitfall ("gate at the router/page level before any signup CTA renders").
- `.planning/REQUIREMENTS.md` — SIGNUP-01…SIGNUP-05 (this phase); Owner Decision **D-03** (under-18
  self-signup blocked), **D-02** (teachers stay), **D-06** (`child_profiles.parent_id` nullable);
  the Out-of-Scope table (esp. "Math-problem age gate — FTC-rejected; `ParentGateMath` stays correct
  for post-authentication gating only").
- `COPPA_REFACTOR_PRD.md` (repo root) — source PRD for the parent-only signup UX.

### Prior-phase context

- `.planning/phases/01-identity-schema-expand/01-CONTEXT.md` — **D-08** (`parents` table minimal
  schema; consent/legal columns added by the phase that writes them — governs D-09's marker column),
  **D-11** (a `parents` row is created on demand the first time an account acts as a parent; one
  `auth.uid()` may hold both a `teachers` and a `parents` row — no mutual exclusion).

### Research

- `.planning/research/SUMMARY.md` — milestone research overview and the account-model rationale.
- `.planning/research/PITFALLS.md` — the OAuth-bypass gap this phase must defend against.

### Existing code to modify (verified during scout)

- `src/components/auth/SignupForm.jsx` — the role-first wizard
  (`STUDENT_STEPS`/`TEACHER_STEPS`, step state machine, credentials form, Terms/Privacy links).
- `src/components/auth/AgeGate.jsx` — the year-only dropdown to be replaced with open-field M/D/Y.
- `src/components/auth/ParentEmailStep.jsx` — the under-13 step being removed from the signup path.
- `src/components/auth/SocialLogin.jsx` — the Google button (`mode="login"|"signup"`, `role`).
- `src/features/authentication/useSocialAuth.js` — OAuth mutation (navigates to `/` on success).
- `src/features/authentication/useSignup.js` — email signup; currently writes a `students` row +
  `promote_placeholder_student`; must branch to write a `parents` row for the Parent role.
- `src/services/apiAuth.js` — `socialAuth()` (~line 287) and the "authenticated but no profile →
  select role" path (~line 160) that D-05 extends; role-from-DB-presence logic (~line 90).
- `src/utils/ageUtils.js` — full open-field DOB helpers already present (`isValidDOB`,
  `dobPartsToDate`, `calculateAge`, `isUnder13` — the last needs an 18+ sibling per D-08).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`ageUtils.js`** already ships the full open-field DOB machinery (`isValidDOB`, `dobPartsToDate`,
  `calculateAge`) — currently unused by the year-only `AgeGate`. D-08 adopts it; only an 18+ check
  (sibling to `isUnder13`) needs adding.
- **`RoleCard` + the two-branch wizard** in `SignupForm.jsx` — the Parent/Teacher restructure (D-02)
  is a relabel + branch retarget, not a rebuild.
- **`AuthShell` / `AuthCta` / `AuthInput` / `AuthSelect`** — the auth design-system primitives;
  the DOB gate, block screen, and OAuth completion screen should be built from these.
- **The role-from-DB-presence pattern** (`apiAuth.js` ~line 90) and the **profile-less "select role"
  path** (~line 160) — the exact seam D-05's callback gate extends.
- **`consent_verified_at` naming pattern** — precedent for D-09's age-verified marker column.
- **`teachers`-style fan-out identity table keyed on `auth.users(id)`** — the `parents` table
  (from Phase 1) that the Parent branch writes to.

### Established Patterns

- **Role determined ONLY from DB table presence, never JWT/metadata** (a hard project security rule,
  `apiAuth.js:90`). D-05's returning-vs-new detection must key off profile-row presence, consistent
  with this.
- **EN + HE i18n parity, RTL-aware** — every new string (DOB gate, block screen, completion screen,
  role cards) needs both locales, per project convention.
- **`i18n.language?.startsWith("he")`** — never strict `=== "he"` (breaks for `he-IL`); already used
  in `SignupForm.jsx:54`.

### Integration Points

- **`useSignup.js` role branch** — Parent role must insert a `parents` row (id, `display_name`,
  age-verified marker), replacing the current `students` insert + `promote_placeholder_student` call
  for self-signup; Teacher branch unchanged.
- **The OAuth return/callback** — where new users are routed into DOB+role completion before a
  `parents` row exists, and under-18s are signed out (D-05/D-06/D-07).
- **Phase 1 `parents` table** — gains the age-verified marker column via a Phase 3 migration (D-09).
- **`parent_email` / child-data fields** in the current `students` insert path — must not be
  populated by the new parent signup (SIGNUP-04).

</code_context>

<specifics>
## Specific Ideas

- **The age gate must be _neutral and non-encouraging_, not unbeatable** — self-attested DOB, no
  identity verification. This framing (accepted by the FTC neutral-gate standard) is why D-10 allows
  a Back/try-again path and D-11 avoids any tracking: we are not building a fraud-proof gate, we are
  building one that does not solicit under-agers.
- **The organizing insight of the OAuth decision:** because the redirect round-trip wipes client
  state _and_ the login screen offers an ungated Google path, the gate cannot live on the button — it
  must live at the callback, keyed on profile presence (D-05). This turns "gate every entry point"
  into a single enforcement point.

</specifics>

<deferred>
## Deferred Ideas

- **Hard-delete of inert profile-less `auth.users` rows** left by blocked under-18 OAuth attempts (a
  service-role Edge Function). Phase 3 leaves them inert (D-07); cleanup is optional future work.
- **Anonymous aggregate count of block events** (a PII-free Umami event). Considered and declined for
  Phase 3 (D-11); available as a safe later add if product wants the metric.
- **Parent-settings placement of the Privacy Policy link** (second half of SIGNUP-05) — rides with
  Phase 4's settings surface (D-12).
- **"Invite a parent" hand-off from the block screen** — declined as scope creep + child-sourced data
  collection (D-10).

None — discussion stayed within phase scope otherwise.

</deferred>

---

_Phase: 3-Parent-Only Signup & Age Gate_
_Context gathered: 2026-08-03_
