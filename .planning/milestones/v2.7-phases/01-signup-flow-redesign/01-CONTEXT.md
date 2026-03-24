# Phase 1: Signup Flow Redesign - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Reorder the signup flow to role-first, simplify age collection to birth year only, remove account suspension for under-13 users (accounts immediately active), make parent email optional for notifications/reports. Teacher path skips age gate entirely. Back navigation between all steps. Google OAuth shown on credentials step.

</domain>

<decisions>
## Implementation Decisions

### Step Sequence & Layout
- **D-01:** Multi-step wizard with 4 steps maximum. Step dots progress indicator at top.
- **D-02:** Student path: Role Selection -> Birth Year -> Parent Email (optional, under-13 only) -> Credentials/Name
- **D-03:** Teacher path: Role Selection -> Credentials/Name (skips birth year and parent email entirely)
- **D-04:** Back buttons on every step after the first. Each step is its own screen/view within the wizard.

### Parent Email Purpose
- **D-05:** Remove consent email flow entirely. No more verification emails for parent consent.
- **D-06:** Parent email is purely for weekly progress reports and push notification opt-in reminders.
- **D-07:** Parent email step only appears for under-13 students. It has a "Skip" button alongside "Continue".

### Google OAuth Placement
- **D-08:** Google OAuth button appears on the credentials step (Step 4 for students, Step 2 for teachers) as alternative to email/password. Same placement as current design.
- **D-09:** Role is already known from Step 1 and passed to `SocialLogin` component via `role` prop (existing pattern).

### DB & Consent Cleanup
- **D-10:** Store birth year as `DATE` using January 1st convention (e.g., 2018 -> '2018-01-01'). No schema change needed. Existing `is_under_13` trigger works as-is.
- **D-11:** Remove client-side consent code: `sendParentalConsentEmail` calls, `ParentalConsentPending` component, consent service imports in signup hook. Keep DB tables/functions in place (harmless, have existing data).
- **D-12:** Write migration to activate all existing suspended users: `UPDATE students SET account_status = 'active' WHERE account_status = 'suspended_consent'`.
- **D-13:** New signups always set `account_status = 'active'` regardless of age.

### Claude's Discretion
- **D-14:** Parent email step messaging/copy — Claude picks the best tone based on the app's existing kid-friendly style.
- **D-15:** Google OAuth birth year handling — Claude decides the best approach for collecting birth year from Google OAuth student users (pre-redirect vs post-callback vs skip).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Signup Flow
- `src/components/auth/SignupForm.jsx` — Current signup wizard (age -> parent email -> details)
- `src/components/auth/AgeGate.jsx` — Current full DOB collection (needs simplification to year-only)
- `src/components/auth/ParentEmailStep.jsx` — Current required parent email step (needs optional messaging)
- `src/components/auth/RoleSelection.jsx` — Standalone role picker (used post-OAuth, can inform Step 1 design)
- `src/components/auth/SocialLogin.jsx` — Google OAuth button (already accepts `role` prop)
- `src/features/authentication/useSignup.js` — Signup mutation hook (needs consent removal, status change)

### Auth Infrastructure
- `src/services/consentService.js` — Consent email sending (to be removed from signup flow)
- `src/components/auth/ParentalConsentPending.jsx` — Consent pending UI (dead code after this phase)

### Database
- `supabase/migrations/20260201000001_coppa_schema.sql` — COPPA schema: account_status constraint, is_under_13 trigger, consent tables/functions

### Design System
- `docs/DESIGN_SYSTEM.md` — Glass card pattern, text colors, button styles

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RoleSelection.jsx` — Has Student/Teacher card selection UI with icons. Can be adapted for Step 1.
- `SocialLogin.jsx` — Google OAuth button already parameterized with `mode` and `role` props.
- `AgeGate.jsx` — Dropdown-based input pattern. Simplify from 3 dropdowns (month/day/year) to 1 (year only).
- `ParentEmailStep.jsx` — Email input with validation. Remove "required" framing, add "Skip" button.

### Established Patterns
- Step state managed via `useState("step-name")` in `SignupForm.jsx` — same pattern for expanded wizard.
- `useMutation` from TanStack React Query for signup submission.
- Glass card styling: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`.
- Gradient text for headings: `bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent`.

### Integration Points
- `useSignup.js` — Mutation hook needs: remove `sendParentalConsentEmail` call, always set `account_status: 'active'`, accept birth year instead of full DOB.
- `LoginForm.jsx` — `onBackToLogin` callback pattern for navigation back to login.
- Router: No route changes needed (signup is a component within the auth page, not a routed page).

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-signup-flow-redesign*
*Context gathered: 2026-03-23*
