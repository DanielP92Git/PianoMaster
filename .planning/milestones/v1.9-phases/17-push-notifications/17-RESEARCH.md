# Phase 17: Push Notifications - Research

**Researched:** 2026-03-04
**Domain:** Web Push API, VAPID, Supabase Edge Functions, pg_cron, COPPA consent gates
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- In-app parent gate (not a separate email flow): math problem verification ("Solve 47 + 28 to confirm you're a parent")
- Consent stored in database on first successful verification — subsequent toggles do not require re-consent
- Gate uses COPPA "knowledge-based" standard (similar to YouTube Kids pattern)
- Re-enabling after disable does NOT require parent re-consent — DB flag persists
- Primary opt-in surface: Settings > Notifications — upgrade existing NotificationPermissionCard with parent gate
- Secondary: one-time dismissible dashboard card shown after first week of use, linking to settings
- No aggressive or repeated prompting — discoverable, not pushy
- Supabase pg_cron triggers a daily scheduled function (no external scheduler)
- Fixed afternoon send time (e.g., 4-5pm in student's timezone) — after school, before dinner window
- Skip students who already practiced today (check students_score for today's entries)
- 1/day rate limit enforced via `last_notified_at` timestamp column on push subscription table
- pg_cron calls an Edge Function that queries eligible students and sends Web Push via web-push library
- Messages written for the child (age 8), not the parent — fun, encouraging, 8-year-old-friendly
- Musical emojis used in titles and bodies for engagement
- 3-4 trigger types with 2-3 message variants each (~10-12 total messages): streak at risk (highest priority), XP near level-up, daily goals waiting, generic encouragement (fallback)
- Priority order: streak > XP > goals > generic — only one notification sent
- Random variant selected within the winning trigger type
- Toggle off in settings immediately unsubscribes the Web Push subscription AND updates DB flag
- Simple on/off — no "pause for X days" option
- Re-enabling re-subscribes and re-registers push subscription
- Tapping notification opens the app to the trail page
- Existing service worker notificationclick handler extended with new notification type

### Claude's Discretion
- VAPID key generation and storage approach
- Exact pg_cron schedule expression and timezone handling
- Edge Function architecture (single function vs. separate query + send)
- Push subscription database table schema details
- Dashboard opt-in card design and dismissal persistence
- Math problem difficulty and randomization

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTIF-01 | Parent can opt-in to push notifications for their child with COPPA-compliant consent | Math problem parent gate in Settings; DB consent flag persists; separate from account verification flow |
| NOTIF-02 | App requests Web Push API permission and registers service worker subscription | Existing notificationService.js has full subscribeToPushNotifications(); existing sw.js push handler ready |
| NOTIF-03 | Student receives max 1 push notification per day | last_notified_at column + Edge Function check before send; pg_cron one trigger per day |
| NOTIF-04 | Notifications include context-aware messages (streak at risk, XP near level-up, daily goals waiting) | Edge Function queries students table for streak/XP data; priority ordering logic; message variants table |
| NOTIF-05 | Student or parent can disable notifications from settings | Toggle in AppSettings.jsx calls unsubscribeFromPushNotifications() + DB flag update |
</phase_requirements>

## Summary

Phase 17 implements server-driven Web Push notifications for the PianoApp. The browser-side infrastructure is substantially complete: `notificationService.js` has subscribe/unsubscribe/VAPID functions and `sw.js` has a push event listener and notificationclick handler. The main implementation work is (1) a new `push_subscriptions` database table, (2) a COPPA parent gate wrapping the existing `NotificationPermissionCard`, (3) a Supabase Edge Function (`send-daily-push`) that queries eligible students and sends Web Push via `@negrel/webpush`, and (4) a pg_cron job that invokes the Edge Function daily at a fixed UTC time.

The stack is well-understood with HIGH confidence: `@negrel/webpush` is the correct Deno-native library (avoids Node.js shims), VAPID keys are stored as Supabase environment secrets, and pg_cron + pg_net is the established pattern for scheduling Edge Function calls. iOS requires the PWA to be installed on the home screen for push to work — this is an important UX caveat to communicate but is not a blocker.

A critical COPPA finding: the FTC's 2025 COPPA final rule clarifies that a math problem alone is NOT an acceptable "age gate" for screening children from a service. However, the math problem in this phase is NOT an age gate — it is a "parent identity gate" for notification consent, analogous to YouTube Kids' parent PIN. This distinction matters. The math problem identifies the consenting person as the parent (because a child would not solve it spontaneously to enable notifications for themselves), not as a COPPA age-screening mechanism. The existing account creation flow handles COPPA age verification separately. The math problem consent approach remains acceptable under this reading.

**Primary recommendation:** Use `jsr:@negrel/webpush` in the Deno Edge Function, store VAPID keys as Supabase project secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`), schedule with pg_cron at `0 14 * * *` UTC (4pm Israel time / 2pm UK / 9am Eastern — close to the "after school" window for the likely audience), and use `verify_jwt = false` for the cron-invoked Edge Function since pg_cron calls it without a user JWT.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@negrel/webpush` (JSR) | 0.5.0 | Send Web Push with VAPID from Deno | Implements RFC 8291/8292, Web API only (no Node crypto shims), works in Supabase Edge Functions |
| Web Push API (browser) | Native | Subscribe/unsubscribe in browser | Already implemented in notificationService.js |
| pg_cron | 1.6 (Supabase managed) | Schedule daily cron job | Established Supabase pattern, no external scheduler needed |
| pg_net | Supabase managed | HTTP calls from Postgres/cron | Used in project already (subscription webhook pattern) |
| Supabase Vault | Managed | Store VAPID private key securely | Established project pattern (see lemon-squeezy-webhook) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jsr:@std/encoding` | Deno std | Base64 URL encoding for VAPID keys | Included via @negrel/webpush deps |
| Supabase service role client | In Edge Function | Query students + push_subscriptions | Edge Function already uses this pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@negrel/webpush` | `npm:web-push` via esm.sh | web-push requires Node crypto shims not available in Deno natively; avoid |
| `@negrel/webpush` | `web-push-browser` (npm) | web-push-browser is zero-dep but less actively maintained; @negrel/webpush is Deno-first |
| pg_cron + pg_net | External cron (GitHub Actions, etc.) | External scheduler adds a dependency and operational complexity; pg_cron is already available |
| verify_jwt = false | Passing service_role JWT from Vault | verify_jwt = false is simpler for cron-invoked functions; add a shared secret header instead for security |

**Installation (Edge Function):**
```typescript
import * as webpush from "jsr:@negrel/webpush";
```

**VAPID Key Generation (run once, then store as project secrets):**
```bash
deno run https://raw.githubusercontent.com/negrel/webpush/master/cmd/generate-vapid-keys.ts
# Output: {"publicKey": "...", "privateKey": "..."}
# Store in Supabase project secrets:
# VAPID_PUBLIC_KEY = <publicKey>
# VAPID_PRIVATE_KEY = <privateKey>
# VAPID_SUBJECT = "mailto:admin@pianomaster.app"
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/
├── functions/
│   └── send-daily-push/      # New Edge Function
│       └── index.ts
├── migrations/
│   └── 20260304000001_add_push_subscriptions.sql  # New table
config.toml                   # Add [functions.send-daily-push] with verify_jwt = false

src/
├── components/settings/
│   ├── NotificationPermissionCard.jsx   # Upgrade: add parent gate wrapper
│   └── ParentGateMath.jsx               # New: math problem gate component
├── services/
│   └── notificationService.js          # Upgrade: add savePushSubscription(), removePushSubscription()
├── pages/
│   └── AppSettings.jsx                 # Upgrade: push toggle + parent gate flow
└── components/dashboard/
    └── PushOptInCard.jsx               # New: one-time dashboard prompt card
```

### Pattern 1: Web Push Subscribe Flow (browser side)
**What:** User clicks enable in Settings, parent gate shows, math problem solved, browser permission requested, subscription registered, saved to DB.
**When to use:** First-time opt-in only.

```typescript
// In notificationService.js - new function to add
export async function savePushSubscription(studentId, subscriptionJSON) {
  // Defense in depth: verify current user === studentId
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== studentId) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      student_id: studentId,
      subscription: subscriptionJSON,  // Full PushSubscription JSON
      is_enabled: true,
      parent_consent_granted: true,
      parent_consent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id' });

  if (error) throw error;
}

export async function removePushSubscription(studentId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== studentId) throw new Error('Unauthorized');

  // Unsubscribe from browser push manager first
  await unsubscribeFromPushNotifications();

  // Update DB flag (keep row for consent history)
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_enabled: false, subscription: null, updated_at: new Date().toISOString() })
    .eq('student_id', studentId);

  if (error) throw error;
}
```

### Pattern 2: Parent Gate Component
**What:** Math problem gate that shows before browser push permission request. Solved once; consent stored in DB. Not re-shown on subsequent enable/disable cycles.
**When to use:** First time user tries to enable push notifications.

```jsx
// ParentGateMath.jsx — new component
// Shows: "Are you a grown-up? Solve this to continue: 47 + 28 = ?"
// On correct answer: calls onConsent() which proceeds to requestNotificationPermission()
// Math problems should use 2-digit addition/subtraction — simple for adults, non-trivial for age 8

function ParentGateMath({ onConsent, onCancel }) {
  const [problem, setProblem] = useState(() => generateMathProblem());
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (parseInt(answer) === problem.answer) {
      onConsent();
    } else {
      setError(true);
      setProblem(generateMathProblem()); // New problem on wrong answer
      setAnswer('');
    }
  };
  // ...
}

function generateMathProblem() {
  // Two-digit addition: a (20-60) + b (15-40)
  const a = Math.floor(Math.random() * 41) + 20; // 20-60
  const b = Math.floor(Math.random() * 26) + 15; // 15-40
  return { expression: `${a} + ${b}`, answer: a + b };
}
```

### Pattern 3: Edge Function — send-daily-push
**What:** Queries students with active push subscriptions who have not practiced today, determines message type by priority, sends one Web Push per student.
**When to use:** Invoked daily by pg_cron.

```typescript
// supabase/functions/send-daily-push/index.ts
import * as webpush from "jsr:@negrel/webpush";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// NO verify_jwt - called by pg_cron, not browser
// Add CRON_SECRET header check for security instead
const CRON_SECRET = Deno.env.get('CRON_SECRET');

Deno.serve(async (req) => {
  // Security: verify cron secret header
  const secret = req.headers.get('x-cron-secret');
  if (secret !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Load VAPID keys from environment secrets
  const vapidKeys = await webpush.importVapidKeys({
    publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
    privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
  });

  const appServer = await webpush.ApplicationServer.new({
    contactInformation: Deno.env.get('VAPID_SUBJECT')!,
    vapidKeys,
  });

  // Query eligible students (active sub, not practiced today, last_notified_at != today)
  const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const { data: eligibleStudents } = await supabase
    .from('push_subscriptions')
    .select('student_id, subscription, last_notified_at, students(total_xp, current_level)')
    .eq('is_enabled', true)
    .or(`last_notified_at.is.null,last_notified_at.lt.${today}T00:00:00Z`)
    // Check not practiced today via subquery handled separately

  let sent = 0, failed = 0;

  for (const row of eligibleStudents ?? []) {
    // Check if practiced today
    const { count } = await supabase
      .from('students_score')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', row.student_id)
      .gte('created_at', `${today}T00:00:00Z`);

    if ((count ?? 0) > 0) continue; // Already practiced today

    const notification = selectNotification(row); // Streak > XP > Goals > Generic

    try {
      const subscriber = appServer.subscribe(row.subscription);
      await subscriber.pushTextMessage(JSON.stringify({
        title: notification.title,
        body: notification.body,
        tag: 'daily-practice',
        data: { url: '/trail', type: 'daily-practice' }
      }), {});

      // Update last_notified_at
      await supabase
        .from('push_subscriptions')
        .update({ last_notified_at: new Date().toISOString() })
        .eq('student_id', row.student_id);
      sent++;
    } catch (err) {
      // 410 Gone = subscription expired, disable it
      if (err.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .update({ is_enabled: false, subscription: null })
          .eq('student_id', row.student_id);
      }
      failed++;
    }
  }

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Pattern 4: pg_cron Schedule

```sql
-- Store secrets in Vault (run once)
SELECT vault.create_secret('https://[project-ref].supabase.co', 'project_url');
SELECT vault.create_secret('[your-service-role-key]', 'service_role_key');
SELECT vault.create_secret('[your-cron-secret]', 'cron_secret');

-- Schedule: 14:00 UTC = 4pm Israel (IST=UTC+2 winter, IDT=UTC+3 summer)
-- For after-school: 14:00 UTC covers 4pm Israel winter / 5pm Israel summer
-- This is a reasonable fixed time; timezone-personalized send is out of scope
SELECT cron.schedule(
  'send-daily-push-notifications',
  '0 14 * * *',  -- 2:00pm UTC every day
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/send-daily-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Pattern 5: notificationclick Handler Extension (sw.js)
**What:** Add `daily-practice` type to the existing notificationclick switch.

```javascript
// In public/sw.js — add to existing notificationclick handler
// after existing type checks, before "Default behavior" section:

if (notificationType === 'daily-practice') {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const urlToOpen = new URL('/trail', self.location.origin).href;
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if ('focus' in client) {
          await client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })()
  );
  return;
}
```

### Anti-Patterns to Avoid
- **Using `npm:web-push` via esm.sh:** The web-push Node.js library requires Node.js crypto APIs (`crypto.createHmac`, etc.) that are not natively available in Deno's Web Crypto API surface. Use `jsr:@negrel/webpush` instead.
- **Storing VAPID private key in the database:** VAPID private key must be a Supabase project secret (environment variable), not in Vault or the database. The private key never leaves the Edge Function runtime.
- **`verify_jwt = true` for cron-invoked Edge Functions:** pg_cron calls Edge Functions without a user JWT. Use `verify_jwt = false` and instead validate a shared `x-cron-secret` header.
- **Querying practices inside the main subscription query:** The `students_score` check (practiced today?) must be done per-student, not as a JOIN, to avoid missing time-zone edge cases. Keep it as a separate count query.
- **Re-prompting for parent consent on every re-enable:** Check DB flag first; only show the math gate when `parent_consent_granted = false`.
- **Sending notifications to iOS users who haven't installed PWA:** iOS Web Push only works when the app is installed on the Home Screen. The subscription will simply not exist for non-installed iOS — this is fine, handle gracefully if subscribe() fails.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Web Push VAPID signing | Custom JWT generation + encryption | `jsr:@negrel/webpush` | VAPID signing involves ECDSA P-256 key generation, JWT creation with exp, and RFC 8291 payload encryption — multiple crypto primitives, protocol-level complexity |
| Push delivery | Direct HTTP to push service endpoints | `jsr:@negrel/webpush` subscriber.pushTextMessage() | Must handle per-push-service endpoint quirks, TTL, topic headers, 410 expiry codes |
| VAPID key conversion | Custom base64url↔Uint8Array | Existing `urlBase64ToUint8Array()` in notificationService.js already works | Already implemented and tested |
| Cron scheduling | External cron service | pg_cron built into Supabase | External scheduler is an additional infrastructure dependency |

**Key insight:** Web Push requires multi-layer crypto (ECDH key agreement + symmetric AES-GCM encryption + VAPID JWT signing). This is non-trivial and protocol-specific. Always use a library.

## Common Pitfalls

### Pitfall 1: iOS PWA Requirement
**What goes wrong:** Push subscription silently fails on iOS if the app is not installed on the Home Screen. Users see the permission prompt in the browser, grant it, but no subscription is created.
**Why it happens:** Apple's Web Push implementation for iOS requires the app to be in standalone mode (installed as PWA). The Push API is disabled in the browser context on iOS.
**How to avoid:** Before calling `subscribeToPushNotifications()`, check `window.matchMedia('(display-mode: standalone)').matches`. If not standalone and iOS, show a message guiding user to install the app first.
**Warning signs:** `registration.pushManager.subscribe()` throws or returns null on iOS in browser mode.

### Pitfall 2: VAPID Public Key Mismatch
**What goes wrong:** Browser subscription created with one VAPID public key, Edge Function tries to send with a different private key → 401 Unauthorized from push service.
**Why it happens:** VAPID public/private key must be a matched pair. If env secrets are set incorrectly or updated without re-subscribing browsers, subscriptions are invalid.
**How to avoid:** Generate keys once, store both. The `VAPID_PUBLIC_KEY` exposed to the browser (for subscription) must match the `VAPID_PRIVATE_KEY` used server-side for signing.
**Warning signs:** Push service returns 401 or 403 on send.

### Pitfall 3: 410 Gone Subscription Expiry
**What goes wrong:** Edge Function tries to send to an expired or unsubscribed push endpoint, push service returns 410 Gone, function throws, student never gets cleaned up.
**Why it happens:** Users clear browser data, reinstall browser, or the push service expires long-inactive subscriptions.
**How to avoid:** In the Edge Function send loop, catch errors and check for 410/404 status codes from the push service. On 410, set `is_enabled = false, subscription = null` in `push_subscriptions`.
**Warning signs:** Growing list of failed sends for the same student_ids.

### Pitfall 4: pg_cron Timezone Confusion
**What goes wrong:** Cron runs at UTC midnight (for 14:00 UTC schedule), but database queries for "today" use server clock which is also UTC — this is consistent. However, "practiced today" check uses UTC midnight as day boundary, which might miss late-night sessions in other timezones.
**Why it happens:** All Supabase databases run UTC. The day boundary for "practiced today" and "last_notified_at" is UTC midnight, not the student's local midnight.
**How to avoid:** Accept UTC day boundaries as the design constraint (consistent, simple). The CONTEXT.md specifies this is acceptable. Document that "today" means UTC today.
**Warning signs:** Students receiving notifications shortly after practicing (if they practice just before midnight UTC).

### Pitfall 5: Math Problem Gate Re-Shown After Re-Enable
**What goes wrong:** User disables notifications, then re-enables. App shows math gate again, requiring parent re-verification.
**Why it happens:** UI state not checking DB `parent_consent_granted` flag before showing gate.
**How to avoid:** On settings page load, read `push_subscriptions` row for current student. If `parent_consent_granted = true`, skip the math gate on re-enable — go directly to `subscribeToPushNotifications()`.
**Warning signs:** Parent reports having to solve math problems every time they toggle notifications.

### Pitfall 6: Supabase Edge Function Cold Start Latency
**What goes wrong:** Daily cron fires, Edge Function cold-starts, initial database query times out.
**Why it happens:** Edge Functions have cold start times; if student list is large, iteration with per-student queries can be slow.
**How to avoid:** Use a single JOIN query to get all eligible students with their streak/XP data. Only fallback to per-student queries for the practiced-today check (which requires count query). Consider adding a short timeout and logging `sent/failed` counts for monitoring.
**Warning signs:** pg_cron job history shows long durations or timeouts.

## Code Examples

Verified patterns from official sources:

### Subscribing to Push Notifications (browser)
```typescript
// Already exists in src/services/notificationService.js
// subscribeToPushNotifications(vapidPublicKey) — returns PushSubscription JSON
// Usage: pass VITE_VAPID_PUBLIC_KEY from env
const subscription = await subscribeToPushNotifications(
  import.meta.env.VITE_VAPID_PUBLIC_KEY
);
await savePushSubscription(studentId, subscription);
```

### Import VAPID keys in Edge Function
```typescript
// Source: jsr.io/@negrel/webpush docs + negrel.dev blog
import * as webpush from "jsr:@negrel/webpush";

const vapidKeys = await webpush.importVapidKeys({
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
});

const appServer = await webpush.ApplicationServer.new({
  contactInformation: `mailto:${Deno.env.get('VAPID_SUBJECT')}`,
  vapidKeys,
});
```

### Send a push message
```typescript
// Source: negrel/webpush README + blog
const subscriber = appServer.subscribe(subscriptionJSON);
await subscriber.pushTextMessage(JSON.stringify({
  title: "🎹 Time to practice!",
  body: "Your streak is at risk! Play one song today.",
  tag: 'daily-practice',
  data: { url: '/trail', type: 'daily-practice' }
}), {
  // Optional: TTL in seconds (default: push service max)
  // topic: 'daily-practice', // Replaces previous undelivered notification with same topic
});
```

### Schedule pg_cron job
```sql
-- Source: supabase.com/docs/guides/functions/schedule-functions
SELECT cron.schedule(
  'send-daily-push-notifications',
  '0 14 * * *',
  $$ SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/send-daily-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  ) AS request_id; $$
);
```

### Check iOS PWA install status before subscribing
```javascript
// In NotificationPermissionCard.jsx or parent wrapper
function canSubscribeToPush() {
  if (!isPushNotificationSupported()) return false;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    // iOS requires standalone (installed PWA) mode
    return window.matchMedia('(display-mode: standalone)').matches;
  }
  return true; // Android/desktop — works in browser too
}
```

### Select notification message (priority logic)
```typescript
// In Edge Function — pure function, no external deps
function selectNotification(student: StudentData): NotificationMessage {
  const { streak, total_xp, current_level, xp_to_next_level, has_daily_goals } = student;

  // Priority 1: Streak at risk (streak > 0 means they have one to lose)
  if (streak > 0) {
    const variants = [
      { title: "🔥 Don't break your streak!", body: `You've practiced ${streak} days in a row! Keep it going! 🎹` },
      { title: "🔥 Streak alert!", body: `${streak} days strong! Today's the day to practice! 🎵` },
    ];
    return randomVariant(variants);
  }

  // Priority 2: XP near level-up (within 50 XP of next level)
  if (xp_to_next_level !== null && xp_to_next_level <= 50) {
    const variants = [
      { title: "⭐ Almost there!", body: `Just ${xp_to_next_level} XP to level up! Play a song! 🎶` },
      { title: "✨ Level up loading...", body: `${xp_to_next_level} XP left to your next level! Can you do it? 🎹` },
    ];
    return randomVariant(variants);
  }

  // Priority 3: Daily goals waiting
  if (has_daily_goals) {
    const variants = [
      { title: "🎯 Goals are waiting!", body: "Your daily music goals need you! Let's practice! 🎵" },
      { title: "🌟 Daily challenge!", body: "Ready for your daily music mission? 🎹 Let's go!" },
    ];
    return randomVariant(variants);
  }

  // Priority 4: Generic encouragement
  const variants = [
    { title: "🎹 Practice time!", body: "Your piano is waiting for you! Let's make music! 🎵" },
    { title: "🎵 Let's play!", body: "5 minutes of piano makes your brain happy! Ready? 🎶" },
    { title: "🌟 Music time!", body: "Time to show those notes who's boss! 🎹" },
  ];
  return randomVariant(variants);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `npm:web-push` in Edge Functions | `jsr:@negrel/webpush` (Deno-native) | 2024 | No Node crypto shim hacks needed |
| External scheduler (cron services) | pg_cron + pg_net inside Supabase | 2023-2024 | No additional infrastructure |
| Hardcoded service role key in cron SQL | Supabase Vault + `decrypted_secrets` | 2024 | Secrets not exposed in cron.job table |
| iOS Web Push not supported | iOS 16.4+ PWA web push supported | April 2023 | Must still be installed as PWA (not browser tab) |
| COPPA verification only at signup | COPPA consent for each new data collection type | 2025 FTC rule | Push notification consent must be separate from account consent |

**Deprecated/outdated:**
- `pgjwt` extension: deprecated in Postgres 17 (our version). Do not use for JWT generation in cron → Edge Function auth. Use shared secret header instead.
- Static service_role_key in SQL: Should be stored in Vault, not in migration files or config.

## COPPA Compliance Note

The math problem gate in this phase is NOT a COPPA age-screening mechanism — it is a "parent identity gate" to ensure the consenting person at that moment is a parent/guardian, not the child. This distinction is important:

- **Age gate (for COPPA screening):** "Are you 13 or older?" — math problem as age gate is NOT acceptable per FTC 2025 rule
- **Parent identity gate (for consent):** "Prove you're the grown-up by solving this" — analogous to YouTube Kids parent PIN; acceptable as a practical parent-identification mechanism

The phase's approach satisfies COPPA because:
1. Push notification consent is separate from the existing parental consent email flow (already verified at account creation)
2. Consent is stored with a timestamp for audit trail
3. The app's existing `parental_consent_log` table can be extended to record notification consent

## Open Questions

1. **Streak data source for Edge Function**
   - What we know: `students` table has `total_xp`, `current_level`. Streak data is computed in dashboard from `students_score`.
   - What's unclear: Is there a `current_streak` column on `students`, or does the Edge Function need to compute streak from `students_score` rows?
   - Recommendation: Planner should check if `current_streak` column exists. If not, the Edge Function can compute it as: count consecutive days with at least one `students_score` entry going back from yesterday.

2. **XP to next level in Edge Function**
   - What we know: `XP_LEVELS` array is in `src/utils/xpSystem.js` (client-side only).
   - What's unclear: Does the Edge Function need to replicate this array server-side, or query a DB function?
   - Recommendation: Inline the XP threshold logic in the Edge Function as a TypeScript array — it's 15 entries, small and stable.

3. **Daily goals "has goals" check**
   - What we know: `student_daily_goals` table exists with `goals` JSONB and `completed_goals` JSONB.
   - What's unclear: How to determine "has uncompleted daily goals" efficiently.
   - Recommendation: Query `student_daily_goals` for today's date where `goal_date = current_date` AND `completed_goals` array length < goals array length.

4. **Dashboard opt-in card timing ("first week")**
   - What we know: CONTEXT.md says show after "first week of use".
   - What's unclear: What column to use for "account age" — `created_at` on `students` table or first `students_score` entry.
   - Recommendation: Use `students.created_at` — simpler, no dependency on whether they've scored yet.

5. **VAPID public key in browser env**
   - What we know: The `VAPID_PUBLIC_KEY` must be available client-side for `subscribeToPushNotifications()`.
   - What's unclear: Where to expose it (VITE env var or fetched from Edge Function).
   - Recommendation: Use `VITE_VAPID_PUBLIC_KEY` in `.env` files — it is safe to be public (VAPID design intent), and simpler than a round-trip to an Edge Function to retrieve it.

## Validation Architecture

> Skipped — `workflow.nyquist_validation` is not set to true in `.planning/config.json`.

## Sources

### Primary (HIGH confidence)
- `jsr:@negrel/webpush` v0.5.0 — JSR registry, negrel/webpush GitHub, negrel.dev blog — library API, VAPID key generation, send pattern
- MDN Web APIs: PushSubscription, PushManager.subscribe(), notificationclick — Web Push API browser behavior
- Supabase docs: schedule-functions, pg_cron extension — cron + Edge Function invocation pattern
- Existing codebase: `src/services/notificationService.js`, `public/sw.js` lines 328–539, `src/components/settings/NotificationPermissionCard.jsx` — verified existing implementation

### Secondary (MEDIUM confidence)
- WebSearch + FTC.gov: COPPA 2025 amendments re: math problems as age gates vs parent identity gates — critical COPPA compliance finding
- SuperAwesome blog + Inside Privacy: COPPA push notification requirements, multiple-contact exception
- pushpad.xyz: iOS PWA requirement for Web Push — confirmed multiple sources
- Supabase GitHub discussions: pg_cron → Edge Function auth pattern with Vault secrets

### Tertiary (LOW confidence)
- Streak data source (students table vs computed): assumed from codebase patterns — verify during planning
- Dashboard card timing via `students.created_at`: reasonable assumption, verify column existence

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified @negrel/webpush at JSR, confirmed Deno-native, existing notificationService.js already uses correct browser APIs
- Architecture: HIGH — pg_cron + pg_net is established Supabase pattern; Edge Function structure follows existing v1.8 patterns
- COPPA compliance: MEDIUM — research is clear that math problem is NOT an age gate; the application to a "parent identity gate" for notification consent is a reasonable interpretation but not explicitly FTC-approved
- iOS pitfall: HIGH — confirmed by multiple sources (Apple docs, Pushpad, MobileLoud)
- Pitfalls: HIGH — 410 expiry, VAPID mismatch, cron timezone are well-documented production issues

**Research date:** 2026-03-04
**Valid until:** 2026-09-04 (6 months — Web Push APIs are stable; COPPA rules have April 2026 compliance deadline)
