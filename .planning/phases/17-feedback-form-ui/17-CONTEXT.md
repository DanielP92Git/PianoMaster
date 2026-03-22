# Phase 17: Feedback Form UI - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Parents can discover, complete, and submit the feedback form from within the Settings page, with the full anti-spam client layer (honeypot, cooldown) and both EN/HE languages working. The Edge Function already exists from Phase 16.

</domain>

<decisions>
## Implementation Decisions

### Parent gate integration
- **D-01:** Fresh math problem every time — parent must solve ParentGateMath on every attempt to access the feedback form, regardless of prior consent for push notifications, weekend pass, or account deletion
- **D-02:** Per-session gate only — consent is not persisted for the feedback form. If the user navigates away and returns, they must solve the gate again
- **D-03:** The form trigger is a "Send Feedback" button that opens the parent gate on click, then reveals the form inline after the gate is passed

### Form placement and visual design
- **D-04:** Standalone centered button below the Logout section — at the very bottom of the Settings page, easy to find and visually distinct from collapsible SettingsSection components
- **D-05:** `MessageSquare` icon from lucide-react (covers bugs + suggestions, not bug-specific)
- **D-06:** Button style is centered and distinct from the rest of the page — not a collapsible section, not a full-width card link

### Form fields (locked from Phase 16 / milestone decisions)
- **D-07:** Dropdown with 3 options: Bug / Suggestion / Other (maps to `bug`, `suggestion`, `other` enum sent to Edge Function)
- **D-08:** Free-text message field: required, max 1000 chars, min 10 chars (server-enforced, client shows character count)
- **D-09:** Honeypot hidden field — silently included in form, if filled by bot the submission is silently "accepted" (200-like) but not sent

### Success and cooldown UX
- **D-10:** After successful submission, form is replaced entirely with a success state: checkmark icon + "Thank you" message + cooldown countdown timer
- **D-11:** During 5-minute cooldown, the submit button is visually disabled and shows the remaining time on the button itself (e.g., "Wait 4:32")
- **D-12:** When cooldown expires, the form returns to its initial state (pre-gate — user sees the "Send Feedback" button again)

### Error UX
- **D-13:** All errors (rate limit 429, server error 5xx, network failure) displayed as inline red banner above or below the form — persistent until dismissed or next attempt
- **D-14:** Network failure errors include a retry button within the error banner
- **D-15:** Rate limit errors show a user-friendly message (not the raw error code)

### Client-side cooldown
- **D-16:** 5-minute cooldown timer starts on successful submission — tracked in component state (not localStorage, since per-session)
- **D-17:** Cooldown is a UX guard, not a security measure — server-side rate limiting (3/hour) is the real protection

### Claude's Discretion
- Whether to use session state or React state for the per-session gate flag
- Exact honeypot field name and CSS hiding strategy
- Character counter design (below textarea, color change near limit)
- Form animation (fade-in after gate, or instant reveal)
- Exact button styling for the standalone "Send Feedback" trigger
- App version sourcing strategy (import from package.json or Vite define)

</decisions>

<specifics>
## Specific Ideas

- Feedback button should feel distinct and inviting at the bottom of Settings — not buried, not aggressive
- Success state should feel rewarding (checkmark + warm message), matching the app's kid-friendly but parent-facing tone
- Error banners should be clear but not alarming — parent-appropriate language

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 16 backend (dependency)
- `.planning/phases/16-backend-email-infrastructure/16-CONTEXT.md` — Edge Function contract: POST body shape, error codes (400/401/429/500), `rate_limit` string in 429 response
- `supabase/functions/send-feedback/index.ts` — Actual Edge Function implementation to call from frontend

### Settings page (integration target)
- `src/pages/AppSettings.jsx` — Settings page structure, parent gate pattern, existing sections order
- `src/components/settings/ParentGateMath.jsx` — Parent gate component (reuse directly)
- `src/components/settings/SettingsSection.jsx` — Collapsible section component (for reference, form does NOT use this)

### Anti-spam
- `.planning/REQUIREMENTS.md` — SPAM-03 (honeypot), SPAM-05 (cooldown) requirements

### i18n
- `src/locales/en/common.json` — English translations structure
- `src/locales/he/common.json` — Hebrew translations structure

### Design system
- `docs/DESIGN_SYSTEM.md` — Glass card pattern, text colors, button styles

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ParentGateMath` component: accepts `onConsent`, `onCancel`, `isRTL` — can be used directly with no modification
- `SettingsSection` component: NOT used for the form itself, but useful as reference for glass card styling
- `supabase` client from `src/services/supabase.js`: for calling the Edge Function
- `useUser` hook: provides `user.id` for authenticated requests
- `useTranslation` from react-i18next: for all text content
- `MessageSquare` from lucide-react: section icon
- `Loader2` from lucide-react: submit loading spinner
- `CheckCircle` from lucide-react: success state icon

### Established Patterns
- Parent gate pattern in AppSettings: `showParentGate` state + `handleParentConsentGranted` callback — feedback form follows similar pattern but without persisting consent
- Edge Function invocation pattern: `supabase.functions.invoke('send-feedback', { body: {...} })` — returns `{ data, error }`
- RTL support: `isRTL` prop threading, `dir` attribute, flex-row-reverse classes
- Toast notifications via `react-hot-toast` — NOT used for form errors (inline banners instead), but available if needed

### Integration Points
- `AppSettings.jsx` — New feedback button + form component added below the Logout section
- `src/locales/en/common.json` — New translation keys under `pages.settings.feedback.*`
- `src/locales/he/common.json` — Hebrew translations for all feedback form text

</code_context>

<deferred>
## Deferred Ideas

- In-app feedback history / status tracking — future enhancement if DB storage is added
- File/screenshot attachment — out of scope for v1
- Auto-reply confirmation email — explicitly excluded
- Feedback form accessible to teachers (different gate or no gate) — not in scope

</deferred>

---

*Phase: 17-feedback-form-ui*
*Context gathered: 2026-03-23*
