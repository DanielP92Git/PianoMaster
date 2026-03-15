# Phase 1: Add Forgot Password Recovery on Login - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a "Forgot password?" recovery flow to the existing login page. Users can request a password reset email and set a new password via a dedicated page. "Forgot username" is dropped — login uses email, there is no username to recover.

</domain>

<decisions>
## Implementation Decisions

### Password reset flow
- Inline expand within existing login card — no page navigation for the reset request
- Login form fields are **replaced** with the reset email input + "Send reset link" button (smooth transition)
- Back arrow/button returns to the login form
- After submission: inline success state replaces the form — green checkmark + "Check your email for a reset link" + "Back to login" button
- 60-second cooldown on the send button with countdown timer after sending
- Uses Supabase `resetPasswordForEmail` API (built-in)

### Reset password page
- Dedicated `/reset-password` route with same glass card style (purple gradient background)
- Shows "New password" + "Confirm password" fields
- Password visibility toggle (Eye/EyeOff) matching the login form pattern
- Minimum length validation only (Supabase default: 6 chars) — no strength indicator
- After success: redirect to login with a success message

### Username/email recovery
- **Dropped entirely** — login uses email, there is no username to forget
- Phase scope reduced to password reset only

### Link placement & styling
- "Forgot password?" link appears directly under the password input field, right-aligned
- Subtle text styling: muted color (text-white/60 or text-white/70) with brighter hover state
- Less prominent than the "Sign up" link — secondary action

### COPPA & child safety
- Reset email goes to the account email only (standard Supabase flow)
- No custom routing to parent email — keeps implementation simple and uses built-in Supabase reset
- Standard but simple messaging tone: clear, short sentences, no corporate jargon, no overly playful language
- Works for both kids and parents helping their children

### Claude's Discretion
- Exact transition animation between login form and reset form
- Success/error icon and color choices within the glass design system
- Exact spacing and responsive breakpoints for the reset form
- Error messaging for invalid email or expired reset links
- How to handle the Supabase auth token detection on the /reset-password page

</decisions>

<specifics>
## Specific Ideas

- The inline expand should feel like a natural part of the existing login card, not a jarring swap
- Keep the same glass card aesthetic — `bg-white/10 backdrop-blur-md border border-white/20`
- The `/reset-password` page should visually match the login page (same background, same card style)
- Reuse the Eye/EyeOff toggle component pattern from LoginForm.jsx

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LoginForm.jsx` — Contains the glass card layout, Eye/EyeOff toggle pattern, form styling
- `useLogin.js` — TanStack Query mutation pattern to follow for reset password hook
- `SocialLogin.jsx` — Google auth alternative (users with Google login don't need password reset)
- `lucide-react` — Already imported for Eye/EyeOff icons, Loader2 spinner
- `react-hot-toast` — Available for error notifications
- `useTranslation` / i18next — EN + HE translations required

### Established Patterns
- Auth hooks live in `src/features/authentication/` (useLogin, useLogout, useSignup, useSocialAuth)
- API calls live in `src/services/apiAuth.js` (login, signup functions)
- Form styling: `bg-white/15 border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500` pattern
- Button styling: `bg-indigo-600 hover:bg-indigo-700 rounded-lg` for primary actions
- Glass card: `bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20`
- RTL support via `useTranslation` and `i18n.dir()`

### Integration Points
- `LoginForm.jsx` — Add "Forgot password?" link and inline reset state
- `App.jsx` — Add `/reset-password` route (public, no auth required)
- `src/services/apiAuth.js` — Add `resetPassword()` and `updatePassword()` API functions
- `src/features/authentication/` — Add `useResetPassword.js` and `useUpdatePassword.js` hooks
- `src/locales/en/common.json` + `src/locales/he/common.json` — Add recovery translation keys

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-add-forgot-username-password-recovery-buttons-on-login*
*Context gathered: 2026-03-09*
