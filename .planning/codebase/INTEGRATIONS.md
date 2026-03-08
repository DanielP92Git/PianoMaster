# External Integrations

**Analysis Date:** 2026-03-08

## APIs & External Services

### Supabase (Primary Backend)

**Purpose:** Authentication, database, realtime subscriptions, edge functions, file storage
- SDK: `@supabase/supabase-js` `^2.48.1`
- Client singleton: `src/services/supabase.js`
- Auth: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars
- Auth flow: PKCE (`flowType: "pkce"`)
- Production URL hardcoded in redirect: `https://piano-master-nine.vercel.app`

**Supabase Features Used:**
- **Auth** - Email/password login (`signInWithPassword`), Google OAuth (`signInWithOAuth`), session management, token refresh
- **Database** - PostgreSQL via PostgREST (tables: `students`, `teachers`, `students_score`, `student_skill_progress`, `student_daily_goals`, `practice_sessions`, `student_achievements`, `assignment_submissions`, `push_subscriptions`, `parent_subscriptions`, `subscription_plans`, `avatars`, `current_streak`, `user_accessories`, `parental_consent_log`, `student_point_transactions`, `teacher_student_connections`)
- **RLS Policies** - Row-level security on all tables; 99 migration files enforce access control
- **Realtime** - Postgres Changes channel for subscription status updates (`src/contexts/SubscriptionContext.jsx`)
- **Edge Functions** - 7 server-side functions (see Edge Functions section below)
- **RPC** - Database functions called via `supabase.rpc()` (e.g., `check_rate_limit`, `is_free_node`, `has_active_subscription`, `award_xp`)

**Key Postgres Functions:**
- `is_free_node(p_node_id TEXT)` - Returns whether a trail node is in the free tier (IMMUTABLE)
- `has_active_subscription(p_student_id UUID)` - Checks active subscription with grace periods (STABLE, SECURITY DEFINER)
- `check_rate_limit(p_student_id, p_node_id, p_max_requests, p_window_ms)` - Rate limiting for score submissions
- `award_xp(p_student_id, p_xp_amount)` - Awards XP with auth check (SECURITY DEFINER)

### Lemon Squeezy (Payment Processor)

**Purpose:** Subscription payments for premium content
- No client SDK - all interactions via Edge Functions (API key never reaches browser)
- REST API: `https://api.lemonsqueezy.com/v1/`
- Auth: `LS_API_KEY` (server-side only, in Edge Function secrets)

**Integration Points:**
- `supabase/functions/create-checkout/index.ts` - Creates checkout URL via POST to `/v1/checkouts`
  - Embeds `student_id` in `checkout_data.custom` for webhook correlation
  - Returns `checkoutUrl` for Lemon Squeezy overlay checkout in browser
  - Requires: `LS_API_KEY`, `LS_STORE_ID`
- `supabase/functions/cancel-subscription/index.ts` - Cancels subscription via DELETE to `/v1/subscriptions/{id}`
  - Uses `ls_subscription_id` from `parent_subscriptions` table
  - Returns `{ ok: true, endsAt }` for UI display
- `supabase/functions/lemon-squeezy-webhook/index.ts` - Receives webhook events from Lemon Squeezy
  - HMAC-SHA256 signature verification via `X-Signature` header
  - Handles: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
  - Upserts to `parent_subscriptions` table via service role client
  - Requires: `LS_SIGNING_SECRET`

**Client-side subscription flow:**
- `src/services/subscriptionService.js` - Fetches subscription status and plans from Supabase DB
- `src/contexts/SubscriptionContext.jsx` - Global `isPremium` state via React Query + Realtime
- `src/pages/SubscribePage.jsx` - Triggers checkout via Edge Function
- `src/pages/ParentPortalPage.jsx` - Subscription management (cancel, view plan)

### Brevo (Transactional Email)

**Purpose:** COPPA-compliant parental consent emails and weekly progress reports
- No client SDK - HTTP API called from Edge Functions
- API endpoint: `https://api.brevo.com/v3/smtp/email` (inferred from Edge Function code)
- Auth: `BREVO_API_KEY` (server-side only)

**Integration Points:**
- `supabase/functions/send-consent-email/index.ts` - Sends parental consent verification emails
  - HTML email with child-friendly branding, table-based layout for Outlook compatibility
  - Contains secure consent verification URL with token
  - Requires: `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`
- `supabase/functions/send-weekly-report/index.ts` - Sends weekly progress summary emails to parents
  - Branded HTML email with 7-day stats (days practiced, streak, nodes completed, level)
  - Includes HMAC-signed unsubscribe link
  - Requires: `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`, `WEEKLY_REPORT_HMAC_SECRET`

### Google OAuth

**Purpose:** Social login (sign in with Google)
- Via Supabase Auth (`supabase.auth.signInWithOAuth`)
- Provider: `"google"`
- Options: `access_type: "offline"`, `prompt: "consent"`
- Configured in: `src/services/apiAuth.js` (`socialAuth` function)

## Data Storage

### PostgreSQL (via Supabase)

**Primary Database:**
- Connection: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- Client: `@supabase/supabase-js` PostgREST client (no ORM)
- Schema: `public` (configured in `src/services/supabase.js`)
- 99 migration files in `supabase/migrations/`

**Key Tables:**
| Table | Purpose | Key Service File |
|-------|---------|-----------------|
| `students` | Student profiles (total_xp, current_level, avatar_id, account_status) | `src/services/apiAuth.js` |
| `teachers` | Teacher profiles | `src/services/apiAuth.js` |
| `students_score` | Game scores with node_id for content gate | `src/services/apiScores.js` |
| `student_skill_progress` | Trail node progress (stars, best_score, exercise_progress JSONB) | `src/services/skillProgressService.js` |
| `student_daily_goals` | Daily goals with JSONB goals array | `src/services/dailyGoalsService.js` |
| `current_streak` | Streak data with freezes, weekend pass, comeback bonus | `src/services/streakService.js` |
| `practice_sessions` | Audio practice recordings | `src/services/practiceService.js` |
| `student_achievements` | Achievement unlocks | `src/services/achievementService.js` |
| `parent_subscriptions` | Lemon Squeezy subscription state | `src/services/subscriptionService.js` |
| `subscription_plans` | Plan definitions (ILS/USD, monthly/yearly) | `src/services/subscriptionService.js` |
| `push_subscriptions` | Web Push subscription JSON + consent flags | `src/services/notificationService.js` |
| `teacher_student_connections` | Teacher-student relationships | `src/services/apiTeacher.js` |
| `parental_consent_log` | COPPA audit trail | `src/services/consentService.js` |
| `avatars` | Avatar definitions | `src/services/apiAvatars.js` |
| `user_accessories` | Unlocked accessory items | `src/services/apiAccessories.js` |
| `assignment_submissions` | Student assignment responses | `src/services/apiTeacher.js` |

**File Storage:**
- Supabase Storage (inferred from practice session recordings)
- Audio compression via `src/services/audioCompressionService.js`
- LRU audio cache via `src/services/audioCacheService.js` (50 items, 30-min TTL)

**Caching:**
- React Query in-memory cache (5-min staleTime, 10-min gcTime)
- Service worker cache (`pianomaster-v6` for static assets, `pianomaster-accessories-v2` for accessory images)
- Client-side LRU cache for audio recordings (`src/services/audioCacheService.js`)
- localStorage for migration flags, preferences, reminder state

## Authentication & Identity

**Auth Provider:** Supabase Auth
- Email/password login: `src/services/apiAuth.js` (`login()`)
- Google OAuth: `src/services/apiAuth.js` (`socialAuth()`)
- PKCE flow for enhanced security
- Session persistence in localStorage (auto-refresh enabled)
- Role determination: Database table presence (`students` or `teachers` table), NOT `user_metadata`
- User hook: `src/features/authentication/useUser.js` (React Query-based)

**Role System:**
- Two roles: `student` and `teacher`
- Verified from database table existence (security hardened, metadata used only as query optimization hint)
- Role selection flow: `src/components/auth/RoleSelection.jsx` for new users without a profile
- Teacher auto-redirect to `/teacher` route

**COPPA Compliance:**
- Parental consent flow: `src/services/consentService.js`
  - Token-based verification with SHA-256 hashing and 7-day expiry
  - Consent emails via Brevo Edge Function
  - Consent verification page: `src/pages/ConsentVerifyPage.jsx` (public route, no auth required)
  - Audit logging in `parental_consent_log` table
- Account suspension for pending consent: `src/components/auth/ParentalConsentPending.jsx`
- Account deletion with 30-day grace: `src/services/accountDeletionService.js`
- Data export (right to access): `src/services/dataExportService.js`
- Parent gate math challenge: `src/components/settings/ParentGateMath.jsx`

**Session Management:**
- Inactivity timeout: `src/contexts/SessionTimeoutContext.jsx` with role-based durations
- Secure logout clears user-specific localStorage keys: `src/services/apiAuth.js` (`logout()`)
- Token refresh failure handling: auto-signout on `TOKEN_REFRESH_FAILED` event

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Bugsnag, or similar integration detected)
- `console.error` / `console.warn` used throughout services

**Logs:**
- Browser console logging (development-only guards in many places via `process.env.NODE_ENV`)
- Edge Function console logging (available in Supabase dashboard)
- Performance marks in pitch detection (`getAudioData`, `findPitch`) via browser User Timing API

**Analytics:**
- None detected (no GA, Mixpanel, Amplitude, etc.)

## CI/CD & Deployment

**Hosting:**
- Vercel - Static site hosting
- Production URL: `https://piano-master-nine.vercel.app`
- SPA routing: `vercel.json` rewrites all routes to `/index.html`
- Build: `vite build` (with `prebuild` trail validation step)

**Supabase Edge Functions:**
- Deployed to Supabase's hosted Deno runtime
- 7 functions:
  1. `create-checkout` - JWT-verified, creates Lemon Squeezy checkout URL
  2. `cancel-subscription` - JWT-verified, cancels Lemon Squeezy subscription
  3. `lemon-squeezy-webhook` - No JWT (server-to-server), HMAC-verified webhook handler
  4. `send-consent-email` - Sends COPPA consent verification email via Brevo
  5. `send-daily-push` - Cron-triggered (14:00 UTC), sends web push reminders
  6. `send-weekly-report` - Cron-triggered (Monday 08:00 UTC), sends weekly progress emails
  7. `unsubscribe-weekly-report` - No JWT, HMAC-verified unsubscribe link handler

**CI Pipeline:**
- No CI config files detected (no `.github/workflows/`, no `Jenkinsfile`, no `.circleci/`)
- Pre-commit: Husky `^9.1.7` + lint-staged `^16.1.2` (ESLint fix + Prettier on staged `*.{js,jsx,ts,tsx}`)
- Pre-build: Trail validation script (`scripts/validateTrail.mjs`)

## Environment Configuration

**Required Client-Side Env Vars:**
- `VITE_SUPABASE_URL` - Supabase project URL (throws on missing)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (throws on missing)
- `VITE_VAPID_PUBLIC_KEY` - VAPID public key for push notification subscription

**Required Edge Function Secrets (stored in Supabase Vault):**
- `CRON_SECRET` - Authenticates pg_cron HTTP calls to edge functions
- `LS_API_KEY` - Lemon Squeezy API key for checkout/cancel operations
- `LS_STORE_ID` - Lemon Squeezy store identifier
- `LS_SIGNING_SECRET` - Lemon Squeezy webhook signature verification
- `BREVO_API_KEY` - Brevo transactional email API key
- `SENDER_EMAIL` - Verified sender email
- `SENDER_NAME` - Sender display name
- `VAPID_KEYS_JSON` - VAPID key pair (JWK format) for web push
- `VAPID_SUBJECT` - VAPID subject (e.g., `mailto:admin@pianomaster.app`)
- `WEEKLY_REPORT_HMAC_SECRET` - HMAC secret for unsubscribe link tokens

**Auto-Injected (Supabase):**
- `SUPABASE_URL` - Available in all Edge Functions
- `SUPABASE_ANON_KEY` - Available in all Edge Functions
- `SUPABASE_SERVICE_ROLE_KEY` - Available in all Edge Functions (bypasses RLS)

## Web APIs Used

**Audio:**
- Web Audio API - `AudioContext` management via `src/contexts/AudioContextProvider.jsx`
- `AnalyserNode` - Pitch detection frequency analysis
- `getUserMedia` - Microphone access for pitch detection and practice recordings
- MediaRecorder API - Audio recording for practice sessions

**PWA:**
- Service Worker API - Offline support, caching, push event handling (`public/sw.js`)
- Push API (`PushManager`) - Web push notification subscription
- Notification API - Permission requests, local notifications
- Cache API - Static asset and accessory image caching
- Web App Manifest - PWA install prompts (`public/manifest.json`)

**Device:**
- Screen Orientation API - Landscape lock for games (`src/hooks/useLandscapeLock.js`)
- Fullscreen API - Immersive game mode (`src/hooks/useGlobalFullscreenOnFirstTap.js`)
- Web Crypto API - SHA-256 hashing for consent tokens, HMAC for unsubscribe links

**Storage:**
- localStorage - User preferences, migration flags, reminder scheduling, i18n language
- sessionStorage - Logout reason tracking (`logoutReason: 'inactivity'`)

## Webhooks & Callbacks

**Incoming (server receives):**
- `supabase/functions/lemon-squeezy-webhook/index.ts` - Lemon Squeezy subscription lifecycle events
  - Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
  - Security: HMAC-SHA256 via `X-Signature` header, `verify_jwt = false`
- `supabase/functions/unsubscribe-weekly-report/index.ts` - Parent email unsubscribe link clicks
  - Security: HMAC token in URL query params, `verify_jwt = false`

**Outgoing (server sends):**
- Lemon Squeezy REST API calls from `create-checkout` and `cancel-subscription` Edge Functions
- Brevo email API calls from `send-consent-email` and `send-weekly-report` Edge Functions
- Web Push notifications from `send-daily-push` Edge Function (via `@negrel/webpush`)

**Scheduled (Cron):**
- `send-daily-push` - Daily at 14:00 UTC via `pg_cron` + `pg_net`
- `send-weekly-report` - Weekly on Monday at 08:00 UTC via `pg_cron` + `pg_net`

## Content Gate (Defense in Depth)

Premium content is gated at two layers:

1. **Client-side (React UI):**
   - `src/config/subscriptionConfig.js` - `isFreeNode(nodeId)` check against 19 free node IDs
   - `src/contexts/SubscriptionContext.jsx` - `useSubscription()` provides global `isPremium`
   - Shows paywall UI for non-free nodes when not premium

2. **Server-side (Database RLS):**
   - `students_score_insert_gate` RLS policy: `is_free_node(node_id) OR has_active_subscription(auth.uid())`
   - `student_skill_progress_insert_gate` RLS policy: same logic
   - Non-trail games pass `node_id: null` which always passes (`is_free_node(NULL) = true`)

## Rate Limiting

- Client-side rate limit check: `src/services/rateLimitService.js`
- Database function: `check_rate_limit()` via `supabase.rpc()`
- Limit: 10 score submissions per 5 minutes per student per node
- Purpose: Prevents XP farming

---

*Integration audit: 2026-03-08*
