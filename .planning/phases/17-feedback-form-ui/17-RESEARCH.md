# Phase 17: Feedback Form UI - Research

**Researched:** 2026-03-23
**Domain:** React form UI, parent gate integration, i18n, anti-spam (honeypot + cooldown), Supabase Edge Function invocation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Parent gate integration**
- D-01: Fresh math problem every time — parent must solve ParentGateMath on every attempt to access the feedback form, regardless of prior consent for push notifications, weekend pass, or account deletion
- D-02: Per-session gate only — consent is not persisted for the feedback form. If the user navigates away and returns, they must solve the gate again
- D-03: The form trigger is a "Send Feedback" button that opens the parent gate on click, then reveals the form inline after the gate is passed

**Form placement and visual design**
- D-04: Standalone centered button below the Logout section — at the very bottom of the Settings page, easy to find and visually distinct from collapsible SettingsSection components
- D-05: `MessageSquare` icon from lucide-react (covers bugs + suggestions, not bug-specific)
- D-06: Button style is centered and distinct from the rest of the page — not a collapsible section, not a full-width card link

**Form fields**
- D-07: Dropdown with 3 options: Bug / Suggestion / Other (maps to `bug`, `suggestion`, `other` enum sent to Edge Function)
- D-08: Free-text message field: required, max 1000 chars, min 10 chars (server-enforced, client shows character count)
- D-09: Honeypot hidden field — silently included in form, if filled by bot the submission is silently "accepted" (200-like) but not sent

**Success and cooldown UX**
- D-10: After successful submission, form is replaced entirely with a success state: checkmark icon + "Thank you" message + cooldown countdown timer
- D-11: During 5-minute cooldown, the submit button is visually disabled and shows the remaining time on the button itself (e.g., "Wait 4:32")
- D-12: When cooldown expires, the form returns to its initial state (pre-gate — user sees the "Send Feedback" button again)

**Error UX**
- D-13: All errors (rate limit 429, server error 5xx, network failure) displayed as inline red banner above or below the form — persistent until dismissed or next attempt
- D-14: Network failure errors include a retry button within the error banner
- D-15: Rate limit errors show a user-friendly message (not the raw error code)

**Client-side cooldown**
- D-16: 5-minute cooldown timer starts on successful submission — tracked in component state (not localStorage, since per-session)
- D-17: Cooldown is a UX guard, not a security measure — server-side rate limiting (3/hour) is the real protection

### Claude's Discretion
- Whether to use session state or React state for the per-session gate flag
- Exact honeypot field name and CSS hiding strategy
- Character counter design (below textarea, color change near limit)
- Form animation (fade-in after gate, or instant reveal)
- Exact button styling for the standalone "Send Feedback" trigger
- App version sourcing strategy (import from package.json or Vite define)

### Deferred Ideas (OUT OF SCOPE)
- In-app feedback history / status tracking
- File/screenshot attachment
- Auto-reply confirmation email
- Feedback form accessible to teachers
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FORM-01 | Parent can access feedback form from Settings page (behind ParentGateMath) | ParentGateMath component verified — accepts `onConsent`, `onCancel`, `isRTL`; AppSettings pattern verified |
| FORM-02 | Parent can select feedback type: Bug / Suggestion / Other | Dropdown field maps to `bug`/`suggestion`/`other` — verified against Edge Function enum validation |
| FORM-03 | Parent can enter a free-text message (required, max 1000 chars) | Textarea with char counter; Edge Function enforces min 10 / max 1000 |
| FORM-04 | Form shows success confirmation after submission with cooldown timer | `useState` countdown + `setInterval` pattern; form state machine: idle → gated → form → success |
| FORM-05 | Form shows error state if submission fails (rate limit, network, server) | Error codes 429/5xx identified in Edge Function; inline banner pattern from design system |
| SPAM-03 | Honeypot hidden field rejects bot submissions silently | Client-side: visually hidden field; if filled, skip Edge Function call and show fake success |
| SPAM-05 | Cooldown enforced client-side (disable form for 5 min after successful submission) | Component state cooldown timer; no localStorage needed (per-session per D-16) |
| I18N-01 | Full EN/HE translations for all form labels, placeholders, success/error/rate-limit messages | Translation keys under `pages.settings.feedback.*`; RTL via `isRTL` prop and `dir` attribute |
</phase_requirements>

---

## Summary

Phase 17 is a self-contained React UI task. The backend (Edge Function `send-feedback`) was shipped in Phase 16 and is fully operational. The work here is: (1) a `FeedbackForm` component that handles the full parent-gate → form → success/error state machine, (2) integration of that component into `AppSettings.jsx` below the Logout section, and (3) translation keys in both locale files.

The component's state machine has four states: `idle` (shows the "Send Feedback" trigger button), `gated` (ParentGateMath overlay is visible), `form` (feedback form is visible after gate passes), and `success` (checkmark + cooldown countdown). Error state is orthogonal — an inline banner that appears within `form` state without changing the overall state. The cooldown countdown that runs post-success drives the transition back to `idle` when it expires (D-12).

All existing patterns are well-established in the codebase. `ParentGateMath` is used directly without modification. The Edge Function contract is fully documented. Honeypot is a hidden field with CSS positioning — if filled, the submission is silently swallowed client-side (no server call, fake success shown per D-09). The `__APP_VERSION__` global is already injected by Vite (confirmed in `vite.config.js` line 11), so `version` field in the POST body is ready.

**Primary recommendation:** Build `FeedbackForm.jsx` as a standalone component in `src/components/settings/` with a four-state internal state machine. Wire it into `AppSettings.jsx` after the Logout div. Add translation keys under `pages.settings.feedback.*` in both locale files.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (useState, useEffect, useRef) | 18 (project) | State machine, countdown timer, honeypot ref | Already in use |
| react-i18next (`useTranslation`) | project version | All user-visible text | Established i18n pattern |
| supabase client (`supabase.functions.invoke`) | project version | Call Edge Function with auth | Established pattern in AppSettings |
| lucide-react | project version | `MessageSquare`, `CheckCircle`, `Loader2`, `AlertTriangle`, `X` | Design system icons |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useUser` hook | internal | Provides `user.id` for auth context | Needed to verify user before Edge Function call |
| `ParentGateMath` | internal | COPPA math gate | Reuse directly — no modification |

### No New Dependencies
This phase installs no new npm packages. Every piece of the stack exists in the project.

---

## Architecture Patterns

### Recommended File Layout
```
src/
└── components/
    └── settings/
        ├── FeedbackForm.jsx          # NEW — full state machine component
        ├── ParentGateMath.jsx        # existing — reused unchanged
        └── SettingsSection.jsx       # existing — NOT used by form (reference only)
src/
└── locales/
    ├── en/
    │   └── common.json               # Add pages.settings.feedback.* keys
    └── he/
        └── common.json               # Add matching Hebrew keys
src/
└── pages/
    └── AppSettings.jsx               # Add FeedbackForm below Logout div
```

### Pattern 1: Four-State Component State Machine

The `FeedbackForm` component manages its own full lifecycle with a single `status` string and supporting state:

```jsx
// Status values: 'idle' | 'gated' | 'form' | 'success'
const [status, setStatus] = useState('idle');
const [feedbackType, setFeedbackType] = useState('bug');
const [message, setMessage] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState(null);          // null | { type: 'rate_limit' | 'server' | 'network', msg: string }
const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);
const honeypotRef = useRef(null);
```

**State transitions:**
- `idle` → `gated`: user clicks "Send Feedback" button
- `gated` → `form`: `ParentGateMath.onConsent` fires (gate solved)
- `gated` → `idle`: `ParentGateMath.onCancel` fires
- `form` → `success`: Edge Function returns 200
- `form` → `form` (with error banner): Edge Function returns 429/5xx or network fails
- `success` → `idle`: cooldown countdown reaches 0

### Pattern 2: Parent Gate Integration (per D-01, D-02, D-03)

Feedback form NEVER checks `parentConsentGranted` from the push subscription status. It always shows the gate:

```jsx
// In FeedbackForm.jsx
const handleSendFeedbackClick = () => {
  setStatus('gated');
};

const handleGateConsent = () => {
  setStatus('form');
  // No persistence — per-session only (D-02)
};

const handleGateCancel = () => {
  setStatus('idle');
};
```

The ParentGateMath overlay renders portaled over the page when `status === 'gated'`. This is the same pattern used by `showParentGate` in `AppSettings.jsx` but managed inside the `FeedbackForm` component.

### Pattern 3: Honeypot Field (SPAM-03)

```jsx
// Visually hidden, not display:none (bots fill display:none fields too)
const honeypotRef = useRef(null);

// In JSX — hidden via absolute positioning and opacity:0
<input
  ref={honeypotRef}
  type="text"
  name="website"            // generic bot-attractive field name
  tabIndex={-1}
  aria-hidden="true"
  autoComplete="off"
  style={{
    position: 'absolute',
    width: '1px',
    height: '1px',
    opacity: 0,
    pointerEvents: 'none',
  }}
/>
```

**Honeypot check in submit handler:**

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  // SPAM-03: if honeypot filled, silently fake success
  if (honeypotRef.current?.value) {
    setStatus('success');
    startCooldown();
    return; // no Edge Function call
  }
  // ... real submission
};
```

### Pattern 4: Edge Function Invocation (established pattern)

```jsx
// Source: supabase/functions/send-feedback/index.ts contract
const { data, error } = await supabase.functions.invoke('send-feedback', {
  body: {
    type: feedbackType,      // 'bug' | 'suggestion' | 'other'
    message: message.trim(),
    version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown',
  },
});
```

**`__APP_VERSION__` is already injected** by `vite.config.js` (line 11: `__APP_VERSION__: JSON.stringify(pkg.version)`). No additional Vite config work needed.

**Error handling map:**

| HTTP Status | `error.context?.status` | User-facing behavior |
|-------------|-------------------------|----------------------|
| 429 with `error: 'rate_limit'` | 429 | Rate limit banner (D-15) |
| 5xx | 500/504 | Server error banner (D-13) |
| Network failure | undefined (fetch throws) | Network error banner + retry button (D-14) |
| 200 | — | Success state + cooldown (D-10) |

**Note:** `supabase.functions.invoke` throws on network failure and returns `{ error }` for HTTP errors. The `error` object from invoke has a `context` property with response details when the function returns a non-2xx status.

### Pattern 5: Cooldown Timer (D-11, D-12, SPAM-05)

```jsx
const COOLDOWN_SECONDS = 5 * 60; // 300 seconds

const startCooldown = () => {
  setCooldownSecondsLeft(COOLDOWN_SECONDS);
};

useEffect(() => {
  if (cooldownSecondsLeft <= 0) {
    if (status === 'success') setStatus('idle'); // D-12: reset to idle when cooldown expires
    return;
  }
  const timer = setTimeout(() => {
    setCooldownSecondsLeft((s) => s - 1);
  }, 1000);
  return () => clearTimeout(timer);
}, [cooldownSecondsLeft, status]);

// Format for button label (D-11): "Wait 4:32"
const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};
```

### Pattern 6: RTL Support

Follow established AppSettings pattern:

```jsx
// In FeedbackForm.jsx — accept isRTL as prop from AppSettings
export function FeedbackForm({ isRTL = false }) {
  // ...
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Pass isRTL to ParentGateMath */}
      {status === 'gated' && (
        <ParentGateMath
          onConsent={handleGateConsent}
          onCancel={handleGateCancel}
          isRTL={isRTL}
        />
      )}
      {/* Flex rows use flex-row-reverse for RTL */}
    </div>
  );
}
```

### Pattern 7: AppSettings Integration

Add `FeedbackForm` after the Logout div (which ends at line 846 in current `AppSettings.jsx`):

```jsx
// After <div className="mt-auto pt-12 pb-8 border-t border-white/20">...</div>

{/* Feedback Form */}
<FeedbackForm isRTL={isRTL} />
```

Import at top of AppSettings.jsx:
```jsx
import FeedbackForm from "../components/settings/FeedbackForm";
import { MessageSquare } from "lucide-react"; // if not already imported
```

`MessageSquare` is not currently imported in AppSettings.jsx — it must be added. All other referenced icons (`Loader2`, `CheckCircle`) should live inside `FeedbackForm.jsx`.

### Anti-Patterns to Avoid

- **Do NOT check `parentConsentGranted`** from push subscription status for the feedback gate — per D-01, the gate always fires fresh
- **Do NOT use localStorage** for cooldown state — per D-16, it is per-session React state only
- **Do NOT use `SettingsSection`** wrapper for the form — per D-04/D-06, it is a standalone centered element
- **Do NOT show raw error codes** (`rate_limit`, `429`) to the user — per D-15, translate to friendly messages
- **Do NOT dispatch toast notifications** for form errors — per D-13, inline banners only

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parent COPPA gate | Custom math challenge | `ParentGateMath` (existing) | Already tested, RTL-aware, matches design system |
| Edge Function auth | Manual JWT handling | `supabase.functions.invoke` | Auto-attaches auth header from current session |
| Countdown display | Custom Date math | Simple `setInterval`/`setTimeout` decrement | Simpler, no timezone issues for a 5-min counter |
| Form state | Redux or React Query | Local `useState` | No async server state to cache; ephemeral per-session |

**Key insight:** Every primitive needed for this form already exists in the project. The task is composition, not invention.

---

## Common Pitfalls

### Pitfall 1: `supabase.functions.invoke` error shape
**What goes wrong:** Assuming the error object has a `status` field at the top level — it doesn't. The HTTP status is nested inside `error.context?.status` (or `error.context?.statusCode` depending on Supabase JS version).
**Why it happens:** Supabase JS wraps non-2xx responses into a `FunctionsHttpError` that has the response in `context`.
**How to avoid:** Check `data?.success === false` first (the Edge Function always returns `{ success: false, error: ... }` in the body), then inspect `data?.error === 'rate_limit'` to distinguish rate-limit from server error. Network failures throw, so catch those separately.
**Warning signs:** Error type always shows as "server" even for 429 responses.

**Recommended error detection pattern:**
```jsx
try {
  const { data, error } = await supabase.functions.invoke('send-feedback', { body: {...} });
  if (error) throw error; // network or non-2xx
  if (data?.success) {
    // success path
  } else {
    // data.error contains the string from Edge Function body
    if (data?.error === 'rate_limit') {
      setError({ type: 'rate_limit' });
    } else {
      setError({ type: 'server' });
    }
  }
} catch (err) {
  // FunctionsHttpError or network failure
  const status = err?.context?.status;
  if (status === 429) {
    setError({ type: 'rate_limit' });
  } else if (status >= 500) {
    setError({ type: 'server' });
  } else {
    setError({ type: 'network' }); // show retry button per D-14
  }
}
```

### Pitfall 2: Honeypot field visible to screen readers
**What goes wrong:** Using `display: none` or `visibility: hidden` — some bot detectors fill those anyway, and screen readers skip `aria-hidden` inconsistently.
**Why it happens:** Choosing the wrong CSS hiding strategy.
**How to avoid:** Use the absolute-position + opacity:0 + pointer-events:none strategy shown above, combined with `aria-hidden="true"` and `tabIndex={-1}`. This ensures keyboard users and screen reader users cannot interact with it, but simple bots do fill it.

### Pitfall 3: Countdown effect cleanup on unmount
**What goes wrong:** If the user navigates away during the cooldown, the `setTimeout` fires after unmount and attempts a `setState` on an unmounted component (React warning in dev, stale closure in prod).
**Why it happens:** `useEffect` cleanup not handling the timeout ID.
**How to avoid:** Always return the cleanup function from the `useEffect`:
```jsx
return () => clearTimeout(timer);
```
(Already shown in Pattern 5 above.)

### Pitfall 4: Character count off-by-one with trim
**What goes wrong:** Showing the character count of the raw textarea value, but the Edge Function counts trimmed length — so a message with leading/trailing whitespace might appear valid client-side but fail server validation.
**Why it happens:** Using `message.length` instead of `message.trim().length` for the counter.
**How to avoid:** Display `message.trim().length` in the character counter, and use the trimmed value for the min-10 client-side validation hint (though server enforces).

### Pitfall 5: RTL dropdown direction
**What goes wrong:** Native `<select>` elements don't inherit `dir` from parent in all browsers — options may appear LTR even inside an RTL container.
**Why it happens:** Browser inconsistency with `<select>` and RTL.
**How to avoid:** Add `dir={isRTL ? 'rtl' : 'ltr'}` directly to the `<select>` element, not just the container.

### Pitfall 6: ParentGateMath z-index stacking
**What goes wrong:** Two ParentGateMath overlays potentially rendering simultaneously if the feedback gate and another gate (delete account, weekend pass) are triggered at the same time.
**Why it happens:** AppSettings uses separate state booleans per gate; the feedback gate is now also triggering the overlay.
**How to avoid:** The feedback gate state lives inside `FeedbackForm` (not AppSettings), so no shared state conflict exists. The overlays use `z-50` which stacks correctly. Just ensure only one trigger path leads to the feedback gate.

---

## Code Examples

### Trigger Button (standalone centered, below Logout)
```jsx
// Source: CONTEXT.md D-04, D-05, D-06
{status === 'idle' && (
  <div className="pt-6 pb-8 flex justify-center">
    <button
      onClick={handleSendFeedbackClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200 text-sm font-medium"
    >
      <MessageSquare className="w-4 h-4" />
      {t('pages.settings.feedback.sendFeedback')}
    </button>
  </div>
)}
```

### Inline Error Banner (D-13, D-14, D-15)
```jsx
// Source: CONTEXT.md D-13, D-14, D-15
{error && (
  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-3">
    <AlertTriangle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
    <div className="flex-1 text-sm text-red-200">
      {error.type === 'rate_limit'
        ? t('pages.settings.feedback.errorRateLimit')
        : error.type === 'network'
        ? t('pages.settings.feedback.errorNetwork')
        : t('pages.settings.feedback.errorServer')}
      {error.type === 'network' && (
        <button
          onClick={handleSubmit}
          className="ml-2 underline hover:no-underline text-red-300"
        >
          {t('pages.settings.feedback.retry')}
        </button>
      )}
    </div>
    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
      <X className="w-4 h-4" />
    </button>
  </div>
)}
```

### Success State with Countdown (D-10, D-11)
```jsx
// Source: CONTEXT.md D-10, D-11, D-12
{status === 'success' && (
  <div className="text-center space-y-3 py-6">
    <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
    <p className="text-white font-semibold">{t('pages.settings.feedback.successTitle')}</p>
    <p className="text-white/60 text-sm">{t('pages.settings.feedback.successSubtitle')}</p>
    {cooldownSecondsLeft > 0 && (
      <p className="text-white/40 text-xs">
        {t('pages.settings.feedback.cooldownMessage', { time: formatCountdown(cooldownSecondsLeft) })}
      </p>
    )}
  </div>
)}
```

### Submit Button with Cooldown (D-11)
```jsx
// During form state — button shows remaining time when in cooldown
// Note: success state replaces the form entirely; this is for re-submissions
<button
  type="submit"
  disabled={isSubmitting || cooldownSecondsLeft > 0}
  className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
>
  {isSubmitting ? (
    <><Loader2 className="w-4 h-4 animate-spin" /> {t('pages.settings.feedback.submitting')}</>
  ) : cooldownSecondsLeft > 0 ? (
    t('pages.settings.feedback.waitCooldown', { time: formatCountdown(cooldownSecondsLeft) })
  ) : (
    t('pages.settings.feedback.submit')
  )}
</button>
```

---

## i18n Translation Keys

The following keys must be added under `pages.settings.feedback` in both `src/locales/en/common.json` and `src/locales/he/common.json`.

### English (`en/common.json`)

```json
"feedback": {
  "sendFeedback": "Send Feedback",
  "sectionTitle": "Share Your Feedback",
  "sectionSubtitle": "Let us know how we can improve PianoMaster",
  "typeLabel": "Feedback Type",
  "typePlaceholder": "Select a type",
  "typeBug": "Bug Report",
  "typeSuggestion": "Suggestion",
  "typeOther": "Other",
  "messageLabel": "Your Message",
  "messagePlaceholder": "Describe the bug, suggestion, or question... (min 10 characters)",
  "charCount": "{{count}} / 1000",
  "submit": "Submit Feedback",
  "submitting": "Sending...",
  "waitCooldown": "Wait {{time}}",
  "successTitle": "Thank you for your feedback!",
  "successSubtitle": "We read every message and use it to improve the app.",
  "cooldownMessage": "You can send another message in {{time}}",
  "errorRateLimit": "You've sent several messages recently. Please wait a little before trying again.",
  "errorServer": "Something went wrong on our end. Please try again in a few minutes.",
  "errorNetwork": "Couldn't reach the server. Check your connection and try again.",
  "retry": "Retry",
  "dismiss": "Dismiss"
}
```

### Hebrew (`he/common.json`)

```json
"feedback": {
  "sendFeedback": "שלח משוב",
  "sectionTitle": "שתף אותנו",
  "sectionSubtitle": "ספר לנו כיצד נוכל לשפר את PianoMaster",
  "typeLabel": "סוג משוב",
  "typePlaceholder": "בחר סוג",
  "typeBug": "דיווח על תקלה",
  "typeSuggestion": "הצעה לשיפור",
  "typeOther": "אחר",
  "messageLabel": "ההודעה שלך",
  "messagePlaceholder": "תאר את התקלה, ההצעה, או השאלה... (לפחות 10 תווים)",
  "charCount": "{{count}} / 1000",
  "submit": "שלח משוב",
  "submitting": "שולח...",
  "waitCooldown": "המתן {{time}}",
  "successTitle": "תודה על המשוב!",
  "successSubtitle": "אנחנו קוראים כל הודעה ומשתמשים בה לשיפור האפליקציה.",
  "cooldownMessage": "תוכל לשלוח הודעה נוספת בעוד {{time}}",
  "errorRateLimit": "שלחת כמה הודעות לאחרונה. אנא המתן זמן קצר לפני שתנסה שוב.",
  "errorServer": "משהו השתבש אצלנו. נסה שוב בעוד מספר דקות.",
  "errorNetwork": "לא ניתן להגיע לשרת. בדוק את החיבור ונסה שוב.",
  "retry": "נסה שוב",
  "dismiss": "סגור"
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| localStorage for gate consent | React state only (per-session) | Gate fires fresh on every visit — COPPA-compliant, no persistence |
| Single `showParentGate` in AppSettings | Self-contained gate state inside `FeedbackForm` | No AppSettings state changes needed for the feedback gate |

---

## Open Questions

1. **`supabase.functions.invoke` error shape for 429**
   - What we know: Edge Function returns `{ success: false, error: 'rate_limit' }` with HTTP 429
   - What's unclear: Whether `data` is populated alongside `error` when invoke gets a non-2xx, or if we must parse `error.context`
   - Recommendation: Defensively check both `data?.error === 'rate_limit'` and `err?.context?.status === 429` in the catch block. The dual-check pattern in Pitfall 1 above covers both shapes.

2. **`__APP_VERSION__` TypeScript/ESLint global declaration**
   - What we know: `vite.config.js` injects `__APP_VERSION__` — it works in JSX files
   - What's unclear: Whether ESLint flags it as `no-undef` in the feedback component
   - Recommendation: Use the `typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown'` guard pattern which avoids the undef lint error. This is already the established pattern from Phase 16 research.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react 16.3.0 |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run src/components/settings/FeedbackForm.test.jsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FORM-01 | ParentGateMath shows when "Send Feedback" clicked | unit | `npx vitest run src/components/settings/FeedbackForm.test.jsx` | ❌ Wave 0 |
| FORM-01 | Gate consent transitions to form state | unit | same | ❌ Wave 0 |
| FORM-01 | Gate cancel returns to idle | unit | same | ❌ Wave 0 |
| FORM-02 | Dropdown renders Bug/Suggestion/Other options | unit | same | ❌ Wave 0 |
| FORM-03 | Character counter shows trimmed length | unit | same | ❌ Wave 0 |
| FORM-03 | Submit disabled when message < 10 trimmed chars | unit | same | ❌ Wave 0 |
| FORM-04 | Success state shown after mock 200 response | unit | same | ❌ Wave 0 |
| FORM-04 | Cooldown timer decrements and resets to idle | unit | same | ❌ Wave 0 |
| FORM-05 | Rate limit banner shown for 429 response | unit | same | ❌ Wave 0 |
| FORM-05 | Server error banner shown for 500 response | unit | same | ❌ Wave 0 |
| FORM-05 | Network error banner + retry button shown on throw | unit | same | ❌ Wave 0 |
| SPAM-03 | Honeypot fill skips Edge Function, shows success | unit | same | ❌ Wave 0 |
| SPAM-05 | Submit button disabled + shows "Wait X:XX" during cooldown | unit | same | ❌ Wave 0 |
| I18N-01 | Translation keys exist in en/common.json | manual/smoke | `npm run lint` or manual check | ❌ Wave 0 |
| I18N-01 | RTL layout dir attribute set correctly | unit | same | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/settings/FeedbackForm.test.jsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/settings/FeedbackForm.test.jsx` — covers all FORM-*, SPAM-03, SPAM-05, I18N-01 unit tests
- [ ] Mock for `supabase.functions.invoke` in test file (vi.mock pattern)
- [ ] Mock for `useUser` hook returning `{ user: { id: 'test-id' } }`

---

## Sources

### Primary (HIGH confidence)
- `supabase/functions/send-feedback/index.ts` — Edge Function contract: POST body shape, error codes (400/401/429/500/504), `rate_limit` string value in 429 body
- `src/components/settings/ParentGateMath.jsx` — Component API: `onConsent`, `onCancel`, `isRTL` props, renders fixed overlay at z-50
- `src/pages/AppSettings.jsx` — Integration target: Logout div location (line 842-846), existing gate pattern, `isRTL` threading, `useUser`, `supabase` import
- `vite.config.js` line 11 — `__APP_VERSION__` already injected, no new Vite config needed
- `src/locales/en/common.json` — Existing translation structure; `pages.settings` path confirmed, no `feedback` key yet
- `.planning/phases/17-feedback-form-ui/17-CONTEXT.md` — All locked decisions D-01 through D-17

### Secondary (MEDIUM confidence)
- `src/components/settings/SettingsSection.jsx` — Glass card CSS pattern (`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`) confirmed for reference
- `CLAUDE.md` design system section — Glass card pattern confirmed matches SettingsSection source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries verified in use
- Architecture: HIGH — all patterns verified against existing source files
- i18n keys: HIGH — structure verified against `en/common.json`, Hebrew translations are author-provided
- Pitfalls: HIGH — error shape pitfall is domain-specific Supabase JS behavior; others are React/HTML fundamentals
- Edge Function contract: HIGH — read from actual shipped implementation

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain; 30-day validity)
