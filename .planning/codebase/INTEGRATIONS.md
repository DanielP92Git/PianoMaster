# External Integrations

**Analysis Date:** 2026-03-23

## APIs & External Services

### Supabase (Primary Backend)

**Purpose:** Authentication, database, realtime subscriptions, edge functions, file storage
- SDK: `@supabase/supabase-js` `^2.48.1`
- Client singleton: `src/services/supabase.js`
- Auth env vars: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (both required, throw on missing)
- Auth flow: PKCE (`flowType: "pkce"`)
- Redirect URL: `VITE_SITE_URL` (defaults to `http://localhost:5174`)
- Production URL: `https://testpianomaster.netlify.app`

**Supabase Features Used:**

1. **Auth** - Email/password login (`signInWithPassword`), Google OAuth (`signInWithOAuth`), session management, token refresh, password reset
   - Key files: `src/services/apiAuth.js`, `src/features/authentication/useUser.js`, `src/features/authentication/useLogin.js`, `src/features/authentication/useSignup.js`, `src/features/authentication/useSocialAuth.js`
   - Session persistence in localStorage with auto-refresh
   - Token refresh failure triggers auto-signout on `TOKEN_REFRESH_FAILED` event

2. **Database** - PostgreSQL via PostgREST (no ORM)
   - Schema: `public`
   - 100+ migration files in `supabase/migrations/`
   - All tables use Row-Level Security (RLS)

3. **RLS Policies** - Defense-in-depth security
   - Content gate: `is_free_node(node_id) OR has_active_subscription(auth.uid())`
   - All service files verify `auth.uid()` before operations
   - Score submissions rate-limited via `check_rate_limit()` RPC

4. **Realtime** - Postgres Changes channel
   - Subscription status updates: `src/contexts/SubscriptionContext.jsx` listens on `parent_subscriptions` table
   - Events per second capped at 10

5. **Edge Functions** - 10 server-side Deno functions (see Edge Functions section below)

6. **RPC** - Database functions called via `supabase.rpc()`:
   - `is_free_node(p_node_id TEXT)` - Free tier check (IMMUTABLE)
   - `has_active_subscription(p_student_id UUID)` - Subscription check with grace periods (STABLE, SECURITY DEFINER)
   - `check_rate_limit(p_student_id, p_node_id, p_max_requests, p_window_ms)` - Score submission rate limiting
   - `award_xp(p_student_id, p_xp_amount)` - XP awards with auth check (SECURITY DEFINER)
   - `request_parental_consent(p_student_id, p_parent_email, p_token_hash, p_expires_hours)` - COPPA consent token creation
   - `verify_parental_consent()` - Consent verification (SECURITY DEFINER)
   - `get_score_percentile()` - Score ranking

**Key Database Tables:**

| Table | Purpose | Key Service File |
|-------|---------|-----------------|
| `students` | Student profiles (total_xp, current_level, avatar_id, account_status, consent fields) | `src/services/apiAuth.js`, `src/services/profileService.js` |
| `teachers` | Teacher profiles | `src/services/apiAuth.js`, `src/services/apiTeacher.js` |
| `students_score` | Game scores with node_id for content gate | `src/services/apiScores.js` |
| `student_skill_progress` | Trail node progress (stars, best_score, exercise_progress JSONB) | `src/services/skillProgressService.js` |
| `student_daily_goals` | Daily goals with JSONB goals/completed_goals arrays | `src/services/dailyGoalsService.js` |
| `current_streak` | Streak data with freezes, weekend pass, comeback bonus | `src/services/streakService.js` |
| `practice_sessions` | Audio practice recordings | `src/services/practiceService.js` |
| `student_achievements` | Achievement unlocks | `src/services/achievementService.js` |
| `parent_subscriptions` | Lemon Squeezy subscription state (status, ls_subscription_id, plan_id, current_period_end) | `src/services/subscriptionService.js` |
| `subscription_plans` | Plan definitions (ILS/USD, monthly/yearly, lemon_squeezy_variant_id) | `src/services/subscriptionService.js` |
| `push_subscriptions` | Web Push subscription JSON, consent flags, last_notified_at, weekly_report_opted_out | `src/services/notificationService.js` |
| `teacher_student_connections` | Teacher-student relationships | `src/services/apiTeacher.js` |
| `parental_consent_tokens` | COPPA consent tokens (SHA-256 hashed, 7-day expiry) | `src/services/consentService.js` |
| `parental_consent_log` | COPPA audit trail (action: requested, verified, revoked) | `src/services/consentService.js` |
| `avatars` | Avatar definitions | `src/services/apiAvatars.js` |
| `user_accessories` | Unlocked accessory items | `src/services/apiAccessories.js` |
| `assignment_submissions` | Student assignment responses | `src/services/apiTeacher.js` |
| `student_point_transactions` | XP transaction history | (via `award_xp` RPC) |
| `account_deletion_log` | COPPA deletion audit records | `supabase/functions/process-account-deletions/index.ts` |

**Quirks:**
- Role determination uses database table presence (`students` or `teachers`), NOT JWT `user_metadata` (security hardened)
- `students_score.node_id` is `NULL` for non-trail games, which always passes the content gate RLS
- `has_active_subscription()` includes grace periods: cancelled (until period end), past_due (3-day grace)
- Realtime channel naming: `subscription-changes-${userId}` in `SubscriptionContext`

### Lemon Squeezy (Payment Processor)

**Purpose:** Subscription payments for premium trail content
- No client SDK - all interactions through Supabase Edge Functions (API key never reaches browser)
- REST API: `https://api.lemonsqueezy.com/v1/`
- Auth: `LS_API_KEY` (Bearer token, server-side only)

**Integration Points:**

1. **Create Checkout** (`supabase/functions/create-checkout/index.ts`)
   - JWT-verified (`verify_jwt = true`)
   - Defense-in-depth: verifies `studentId === auth.uid()` from JWT
   - Calls POST `/v1/checkouts` with `embed: true` and `student_id` in `checkout_data.custom`
   - Returns `{ checkoutUrl }` for Lemon Squeezy overlay checkout in browser
   - Env vars: `LS_API_KEY`, `LS_STORE_ID`

2. **Cancel Subscription** (`supabase/functions/cancel-subscription/index.ts`)
   - JWT-verified (`verify_jwt = true`)
   - Reads `ls_subscription_id` from `parent_subscriptions` for auth.uid()
   - Calls DELETE `/v1/subscriptions/{id}`
   - Returns `{ ok: true, endsAt }` for optimistic UI display
   - Env vars: `LS_API_KEY`

3. **Webhook Handler** (`supabase/functions/lemon-squeezy-webhook/index.ts`)
   - No JWT (`verify_jwt = false`, server-to-server)
   - HMAC-SHA256 signature verification via `X-Signature` header
   - Modular: `lib/verifySignature.ts`, `lib/extractPayload.ts`, `lib/upsertSubscription.ts`
   - Handles 4 events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
   - All other events return 200 silently (prevents LS retry)
   - Upserts to `parent_subscriptions` via service role client
   - Env vars: `LS_SIGNING_SECRET`

**Client-side subscription flow:**
- `src/services/subscriptionService.js` - Fetches status/plans from Supabase DB (mirrors `has_active_subscription()` logic)
- `src/contexts/SubscriptionContext.jsx` - Global `isPremium` via React Query + Realtime channel
- `src/config/subscriptionConfig.js` - `isFreeNode(nodeId)` against 19 free node IDs (client-side fast check)
- `src/pages/SubscribePage.jsx` - Triggers checkout via Edge Function (lazy-loaded)
- `src/pages/ParentPortalPage.jsx` - Subscription management (cancel, view plan details)

**Quirks:**
- No CORS headers on webhook handler (server-to-server POST from LS, not browser)
- Parent email logged in redacted format for COPPA compliance (`p***@example.com`)
- LS sends `subscription_cancelled` webhook after cancel API call; Realtime channel auto-invalidates React Query cache

### Brevo (Transactional Email)

**Purpose:** COPPA-compliant parental consent emails, weekly progress reports, user feedback relay
- No client SDK - HTTP API called from Edge Functions
- API endpoint: `https://api.brevo.com/v3/smtp/email`
- Auth: `BREVO_API_KEY` header (server-side only)

**Integration Points:**

1. **Consent Email** (`supabase/functions/send-consent-email/index.ts`)
   - HTML email with child-friendly branding, table-based layout for Outlook compatibility
   - Contains secure consent verification URL with token
   - Invoked from client via `supabase.functions.invoke('send-consent-email', ...)`
   - Env vars: `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`

2. **Weekly Progress Report** (`supabase/functions/send-weekly-report/index.ts`)
   - Cron-triggered: Monday 08:00 UTC via `pg_cron`
   - Branded HTML email with 7-day stats (days practiced, streak, nodes completed, level)
   - Includes HMAC-SHA256 signed unsubscribe link
   - 6-day dedup guard (`last_weekly_report_at`)
   - Skips opted-out parents (`weekly_report_opted_out = true`)
   - Env vars: `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`, `WEEKLY_REPORT_HMAC_SECRET`

3. **User Feedback** (`supabase/functions/send-feedback/index.ts`)
   - JWT-verified, sends plain-text email to support inbox
   - Rate-limited: 3 per hour per user
   - Input validation: type (bug/suggestion/other), message (10-1000 chars)
   - Env vars: `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`

4. **Account Deletion Confirmation** (`supabase/functions/process-account-deletions/index.ts`)
   - Sends confirmation email to parent after account deletion
   - Env vars: `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`

**Quirks:**
- Email failure in consent flow does not block token creation (token already stored in DB)
- Sender defaults: `noreply@pianomaster.app` / `PianoMaster` if env vars unset

### Google OAuth

**Purpose:** Social login (sign in with Google)
- Via Supabase Auth (`supabase.auth.signInWithOAuth`)
- Provider: `"google"`
- Options: `access_type: "offline"`, `prompt: "consent"`
- Configured in: `src/services/apiAuth.js` (`socialAuth` function)
- Also used by: `src/features/authentication/useSocialAuth.js`

## Web Push Notifications

**Purpose:** Daily practice reminders to encourage streak maintenance

**Architecture:**
- Client subscribes via browser Push API (`src/services/notificationService.js`)
- VAPID keys for server-to-browser push authentication
- Subscription stored in `push_subscriptions` table with consent flags

**Key Files:**
- `src/services/notificationService.js` - Client-side push subscription management (subscribe, unsubscribe, permission handling)
- `src/components/settings/NotificationPermissionCard.jsx` - 6-state permission UI
- `src/components/settings/ParentGateMath.jsx` - COPPA parent gate (two-digit addition)
- `src/components/dashboard/PushOptInCard.jsx` - Dashboard prompt (shown after 7 days)
- `supabase/functions/send-daily-push/index.ts` - Server-side push sender
- `public/sw.js` - Service worker handles `push` and `notificationclick` events

**Server-Side Push (`send-daily-push`):**
- Cron-triggered: daily at 14:00 UTC (~4-5pm Israel time)
- Uses `@negrel/webpush` (jsr import) for VAPID-based Web Push
- Context-aware messages by priority: streak at risk > XP near level-up > daily goals > generic
- Rate-limited: skips students already notified today (`last_notified_at`)
- Skips students who already practiced today (checks `students_score`)
- Disables expired subscriptions (410 Gone responses)
- Auth: `x-cron-secret` header (no JWT, pg_cron caller)
- Env vars: `CRON_SECRET`, `VAPID_KEYS_JSON`, `VAPID_SUBJECT`

**Client Env Vars:**
- `VITE_VAPID_PUBLIC_KEY` - VAPID public key for browser subscription

**Quirks:**
- VAPID keys stored as JSON string (JWK format) in `VAPID_KEYS_JSON` env var
- JWK coordinates may have whitespace from Supabase Vault storage; sanitized at runtime
- iOS PWA requires standalone mode for push support; non-standalone shows "install first" warning

## Sentry (Error Tracking)

**Purpose:** Production error monitoring (COPPA-compliant, no PII)

**Configuration (`src/services/sentryService.js`):**
- SDK: `@sentry/react` `^10.44.0`
- Production only (`import.meta.env.PROD` check)
- DSN: `VITE_SENTRY_DSN` env var (optional, silently skips if missing)
- `sendDefaultPii: false` (COPPA compliance)
- `tracesSampleRate: 0.1` (10% of transactions)
- Session replays disabled (`replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 0`)
- Environment: `import.meta.env.MODE`

**Source Map Upload (`vite.config.js`):**
- `@sentry/vite-plugin` `^5.1.1`
- Conditional: only runs when `SENTRY_AUTH_TOKEN` is set (Netlify build env)
- Requires: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`

**Initialization:**
- Called in `src/main.jsx` before React render (`initSentry()`)

## Umami (Analytics)

**Purpose:** COPPA-safe, cookie-free privacy-respecting analytics

**Configuration (`index.html`):**
- Cloud instance: `https://cloud.umami.is/script.js`
- Website ID: `7101503f-b466-4f1e-acaa-d190d9862302`
- Loaded via `<script defer>` tag in `index.html`
- No client-side SDK or API calls; purely tag-based

**Quirks:**
- No custom events tracked from JavaScript (analytics is page-view only via script tag)
- COPPA-compliant: no cookies, no PII collection

## Data Storage

### PostgreSQL (via Supabase)

**Primary Database:**
- Connection: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- Client: `@supabase/supabase-js` PostgREST client (no ORM)
- Schema: `public` (configured in `src/services/supabase.js`)
- Migrations: `supabase/migrations/` (100+ files)
- Major version: 17 (per `supabase/config.toml`)

**File Storage:**
- Supabase Storage (practice session audio recordings)
- Audio compression: `src/services/audioCompressionService.js`
- LRU audio cache: `src/services/audioCacheService.js` (50 items, 30-min TTL)

**Client-Side Caching:**
- React Query in-memory cache (staleTime varies per query; subscription uses `staleTime: 0` with Realtime push invalidation)
- Service worker cache: `pianomaster-v8` for static assets, `pianomaster-accessories-v2` for accessory images
- Client-side LRU cache for audio recordings
- localStorage for migration flags, preferences, reminder state, i18n language

## Authentication & Identity

**Auth Provider:** Supabase Auth
- Email/password: `src/services/apiAuth.js` (`login()` with 15s timeout)
- Google OAuth: `src/services/apiAuth.js` (`socialAuth()`)
- Password reset: `src/features/authentication/useResetPassword.js`, `src/pages/ResetPasswordPage.jsx`
- PKCE flow for enhanced security
- Session persistence in localStorage (auto-refresh enabled)
- User hook: `src/features/authentication/useUser.js` (React Query-based)

**Role System:**
- Two roles: `student` and `teacher`
- Verified from database table existence (security hardened, `user_metadata` used only as query optimization hint)
- Role selection: `src/components/auth/RoleSelection.jsx` for new users without a profile
- Teacher auto-redirect to `/teacher` route

**COPPA Compliance:**
- Parental consent flow: `src/services/consentService.js`
  - Token-based verification with SHA-256 hashing (Web Crypto API) and 7-day expiry
  - Consent emails via `send-consent-email` Edge Function
  - Verification via `verify-consent` Edge Function (no auth required, token is proof)
  - Public verification page: `src/pages/ConsentVerifyPage.jsx` (`/consent/verify`)
  - Audit logging in `parental_consent_log` table
- Account suspension for pending consent: `src/components/auth/ParentalConsentPending.jsx`
- Account deletion: `src/services/accountDeletionService.js` (30-day grace period)
  - `process-account-deletions` Edge Function runs daily at 03:00 UTC via pg_cron
  - Cascading delete of all student data + Supabase auth user
  - Cancels active LS subscription before deletion
  - Sends confirmation email to parent
  - Writes audit record with HMAC-hashed student ID
- Data export (right to access): `src/services/dataExportService.js`
- Parent gate math challenge: `src/components/settings/ParentGateMath.jsx`

**Session Management:**
- Inactivity timeout: `src/contexts/SessionTimeoutContext.jsx` with role-based durations
- Secure logout clears user-specific localStorage keys
- Token refresh failure: auto-signout on `TOKEN_REFRESH_FAILED` event

## CI/CD & Deployment

**Hosting:**
- **Netlify** (`https://testpianomaster.netlify.app`)
- Configuration: `netlify.toml`
  - Build command: `npm run build`
  - Publish directory: `dist`
  - SPA redirect: `/* -> /index.html` (200)
  - Cache headers: immutable for static assets, no-cache for HTML/SW/manifest
- Backup SPA redirect: `public/_redirects` (`/* /index.html 200`)
- Netlify env var: `VITE_SITE_URL=https://testpianomaster.netlify.app`

**Supabase Edge Functions:**
- Deployed to Supabase's hosted Deno runtime
- 10 functions:

| Function | Auth | Trigger | Purpose |
|----------|------|---------|---------|
| `create-checkout` | JWT | User action | Creates Lemon Squeezy checkout URL |
| `cancel-subscription` | JWT | User action | Cancels Lemon Squeezy subscription |
| `lemon-squeezy-webhook` | HMAC | LS webhook | Subscription lifecycle events |
| `send-consent-email` | JWT | User action | COPPA consent verification email |
| `verify-consent` | None (token) | Parent click | Consent token verification |
| `send-daily-push` | Cron secret | pg_cron 14:00 UTC daily | Practice reminder push notifications |
| `send-weekly-report` | Cron secret | pg_cron Mon 08:00 UTC | Weekly parent progress email |
| `unsubscribe-weekly-report` | HMAC | Parent click | Opt-out from weekly emails |
| `process-account-deletions` | Cron secret | pg_cron 03:00 UTC daily | COPPA account deletion processing |
| `send-feedback` | JWT | User action | Forward user feedback via email |

**CORS Configuration (Edge Functions):**
- Allowed origins: `['https://testpianomaster.netlify.app', 'http://localhost:5174']`
- Pattern used by: `create-checkout`, `cancel-subscription`, `send-consent-email`, `verify-consent`, `send-feedback`
- No CORS on: `lemon-squeezy-webhook` (server-to-server), `send-daily-push` (cron), `send-weekly-report` (cron)

**CI Pipeline:**
- No CI config files (no GitHub Actions, Jenkins, CircleCI)
- Pre-commit: Husky `^9.1.7` + lint-staged `^16.1.2` (ESLint fix + Prettier on staged files)
- Pre-build: Trail validation script (`scripts/validateTrail.mjs`) — build fails if data has errors

## Web APIs Used

**Audio:**
- Web Audio API - `AudioContext` management via `src/contexts/AudioContextProvider.jsx`
- `AnalyserNode` - Pitch detection frequency analysis
- `getUserMedia` - Microphone access for pitch detection and practice recordings
- MediaRecorder API - Audio recording for practice sessions
- Pitch detection: McLeod Pitch Method via `pitchy` (clarity gate 0.9, range A2-C6)
- Mic presets: `src/hooks/micInputPresets.js`

**PWA (`public/sw.js`):**
- Service Worker API - Offline support, caching, push event handling
- Cache version: `pianomaster-v8` (bump to force refresh)
- Accessory cache: `pianomaster-accessories-v2`
- Static assets (`/assets/*`): Cache-first (safe due to Vite content-hashing)
- Navigation: Network-first with cache fallback + offline page
- Supabase REST API (`/rest/`): Never cached (prevents stale subscription data)
- Auth endpoints: Never cached (security)
- Push API (`PushManager`) - Web push notification subscription
- Notification API - Permission requests, local notifications
- Cache API - Static asset and accessory image caching
- Web App Manifest - PWA install prompts (`public/manifest.json`)

**Device:**
- Screen Orientation API - Landscape lock for games (`src/hooks/useLandscapeLock.js`)
- Fullscreen API - Immersive game mode (`src/hooks/useGlobalFullscreenOnFirstTap.js`, `src/utils/pwa.js`)
- Web Crypto API - SHA-256 hashing for consent tokens, HMAC for unsubscribe/audit links

**Storage:**
- localStorage - User preferences, migration flags, reminder scheduling, i18n language
- sessionStorage - Logout reason tracking (`logoutReason: 'inactivity'`)

## Webhooks & Callbacks

**Incoming (server receives):**
- `supabase/functions/lemon-squeezy-webhook/index.ts` - Lemon Squeezy subscription lifecycle events
  - Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
  - Security: HMAC-SHA256 via `X-Signature` header, `verify_jwt = false`
- `supabase/functions/unsubscribe-weekly-report/index.ts` - Parent email unsubscribe link clicks (GET)
  - Security: HMAC token in URL query params (`?sid=...&token=...`), `verify_jwt = false`

**Outgoing (server sends):**
- Lemon Squeezy REST API calls from `create-checkout` and `cancel-subscription`
- Brevo email API calls from `send-consent-email`, `send-weekly-report`, `send-feedback`, `process-account-deletions`
- Web Push notifications from `send-daily-push` (via `@negrel/webpush`)

**Scheduled (pg_cron):**
- `send-daily-push` - Daily at 14:00 UTC
- `send-weekly-report` - Weekly on Monday at 08:00 UTC
- `process-account-deletions` - Daily at 03:00 UTC

## Content Gate (Defense in Depth)

Premium content is gated at two layers:

1. **Client-side (React UI):**
   - `src/config/subscriptionConfig.js` - `isFreeNode(nodeId)` check against 19 free node IDs (O(1) Set lookup)
   - `src/contexts/SubscriptionContext.jsx` - `useSubscription()` provides global `isPremium` boolean
   - Shows paywall UI for non-free nodes when not premium

2. **Server-side (Database RLS):**
   - `students_score_insert_gate` RLS policy: `is_free_node(node_id) OR has_active_subscription(auth.uid())`
   - `student_skill_progress_insert_gate` RLS policy: same logic
   - Non-trail games pass `node_id: null` which always passes (`is_free_node(NULL) = true`)

**Free tier boundary (19 nodes total):**
- Treble Unit 1: 7 nodes (`treble_1_1` through `treble_1_7`)
- Bass Unit 1: 6 nodes (`bass_1_1` through `bass_1_6`)
- Rhythm Unit 1: 6 nodes (`rhythm_1_1` through `rhythm_1_6`)
- Boss nodes (`boss_treble_1`, `boss_bass_1`, `boss_rhythm_1`) are paywalled

## Rate Limiting

- Client-side rate limit check: `src/services/rateLimitService.js`
- Database function: `check_rate_limit()` via `supabase.rpc()`
- Limit: 10 score submissions per 5 minutes per student per node
- Purpose: Prevents XP farming
- Feedback rate limit: 3 per hour per user (enforced in `send-feedback` Edge Function)

---

*Integration audit: 2026-03-23*
