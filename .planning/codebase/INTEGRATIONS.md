# External Integrations

**Analysis Date:** 2026-01-31

## APIs & External Services

**Music & Education:**
- VexFlow API - Sheet music rendering (no external API, client-side library)
- Klavier API - Piano keyboard simulation (no external API, client-side library)

**Font Services:**
- Google Fonts - Typography over HTTPS
  - Preload domains: `fonts.googleapis.com`, `fonts.gstatic.com` (see `index.html`)
  - Fonts: Outfit, Comic Neue, Nunito, Fredoka One, Dancing Script, Heebo, Assistant, Material Icons Round
  - Service Worker caches with long TTL (31536000 seconds for immutable assets)

**Audio Services:**
- None external - uses only Web Audio API and native browser audio context

## Data Storage

**Primary Database:**
- Supabase PostgreSQL
  - Connection via `@supabase/supabase-js` client
  - Schema: `public` (default), `graphql_public` (GraphQL endpoint)
  - Max rows per request: 1000 (rate limiting)
  - Real-time subscriptions enabled with 10 events/second limit
  - Authentication: JWT-based PKCE flow
  - Row-level security (RLS) policies enforce user/role-based access
  - 87 migration files track schema evolution

**Key Tables:**
- `students` - Student profiles, XP, level, total_xp, current_level
- `teachers` - Teacher profiles with is_admin flag
- `teacher_student` - Many-to-many relationships for classroom management
- `students_score` - Practice session scores and results
- `student_achievements` - Unlocked achievements and badges
- `student_skill_progress` - Trail node progress, stars, best_score, exercises_completed, exercise_progress (JSONB array)
- `student_daily_goals` - Daily goal tracking with completed_goals JSONB array
- `practice_sessions` - Recording and playback data
- `student_notifications` - Notification queue for feedback

**File Storage:**
- Supabase Storage buckets (not explicitly configured in code)
- Public assets in `public/` directory (icons, audio, avatars, sounds, images)
- Service Worker caches audio/images with immutable long TTL

**Caching:**
- TanStack React Query - Client-side memory cache with 5-min stale time, 10-min GC
- Service Worker cache - Offline-first caching for static assets, Google Fonts
- Browser localStorage - Language preference, user flags, migration status

## Authentication & Identity

**Auth Provider:**
- Supabase Authentication (PostgreSQL-backed)
  - PKCE OAuth flow via browser
  - Session management with auto-refresh (enabled in `src/services/supabase.js`)
  - Sign-in methods: Email/password
  - JWT tokens stored in browser session storage
  - Automatic session persistence across page reloads
  - Detection of session in URL (for OAuth redirects)

**Role System:**
- Roles verified from database tables (NOT user_metadata, for security):
  - `teachers` table presence = teacher role
  - `students` table presence = student role
  - `is_admin` flag in teachers table for super-admin access
  - Query pattern at `src/features/authentication/useUser.js`

**Logout Cleanup:**
- Clears auth session via `supabase.auth.signOut()`
- Clears localStorage keys containing user data
- Removes migration flags and cached data
- See `src/services/apiAuth.js` for implementation pattern

**JWT Configuration:**
- Client header: `X-Client-Info: piano-app@1.0.0`
- PKCE flow with browser redirect to deployment URL
- Auth endpoint URLs excluded from Service Worker cache to prevent token persistence

## Monitoring & Observability

**Error Tracking:**
- Console logging for development (can be gated behind `NODE_ENV === 'development'`)
- React Query devtools in dev mode (`@tanstack/react-query-devtools`)
- Toast notifications for user-facing errors via `react-hot-toast`

**Logs:**
- Console.log/error throughout codebase
- Mic input debug logging: sends to `http://127.0.0.1:7242/ingest/...` when `VITE_DEBUG_MIC_LOGS=true` (see `src/hooks/useMicNoteInput.js`)
- Service Worker logs installation and cache events

**Application Monitoring:**
- No Sentry, DataDog, or commercial APM detected
- Basic console-based debugging with optional mic input telemetry

## CI/CD & Deployment

**Hosting:**
- Primary: Vercel - Full PWA deployment with serverless functions support
  - Config: `vercel.json` - SPA rewrites all routes to `/index.html`
  - Auto-deployments on git push to main/feature branches
- Secondary: Netlify - Alternative deployment target
  - Config: `netlify.toml` - Build command `npm run build`, publish from `dist/`
  - SPA redirects all 404s to `/index.html` with 200 status
  - Cache headers configured: service worker (no cache), manifest (no cache), static assets (immutable long TTL)

**CI Pipeline:**
- GitHub Actions (`.github/` directory present) - Likely for lint/test on PRs
- Husky 9.1.7 - Git hooks for pre-commit/pre-push
- lint-staged 16.1.2 - Stage-specific linting before commit
  - JS/JSX/TS/TSX files: `eslint --fix` + `prettier --write`
  - JSON/CSS/MD files: `prettier --write`

**Build Process:**
- `npm run build` → Vite production bundle to `dist/`
- Output: Static SPA ready for CDN/serverless hosting
- Source maps included for error debugging

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL (required, throws error if missing)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (required, throws error if missing)
- `VITE_VAPID_KEY` - Web Push VAPID key (optional, for Web Push notifications)
- `VITE_DEBUG_MIC_LOGS` - Enable debug logging to local collector (optional, development only)

**Optional env vars:**
- `NODE_ENV` - Set to "development" or "production" for conditional logic

**Secrets location:**
- Development: `.env` file (git-ignored, not committed)
- Production (Vercel): Environment variables in Vercel dashboard per deployment
- Production (Netlify): Environment variables in Netlify site settings

**Example `.env`:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_VAPID_KEY=BCxyz...
```

## Webhooks & Callbacks

**Incoming:**
- Supabase auth redirects to `siteUrl` parameter (set in supabase.js):
  - Development: `http://localhost:5174`
  - Production: `https://piano-master-nine.vercel.app`
- Service Worker `install` and `activate` events for cache management
- Real-time PostgreSQL change events via WebSocket channels (see `src/hooks/useRealTimeSubscriptions.js`)

**Outgoing:**
- None detected - app is read-only for external services
- Mic debug logging sends POST to debug collector (optional)
- Service Worker fetch events can cache/transform responses

## Real-Time Communication

**WebSocket Subscriptions:**
- Supabase Realtime channels for PostgreSQL changes
  - Channel naming: `student_data_{userId}`
  - Event types: INSERT, UPDATE, DELETE on specific tables
  - Tables: student_achievements, student_skill_progress, practice_sessions
  - Filters: `student_id=eq.{userId}`, `teacher_id=eq.{userId}`
  - Queryvalidation refetch on message receive (via `invalidateQueries`)
  - Global subscription state to prevent duplicate subscriptions in React StrictMode
  - Cleanup on component unmount

**Automatic Queries:**
- Background sync every 30 seconds for feedback notifications
- Refetch on network reconnect (via React Query config)
- Interval refetch for daily goals (60 seconds)

## Third-Party Integrations Summary

| Service | Purpose | SDK/Client | Auth Method |
|---------|---------|-----------|-------------|
| Supabase | Auth, database, real-time | @supabase/supabase-js | PKCE JWT |
| Google Fonts | Typography | HTTPS link tag | Public |
| Web Audio API | Audio capture/playback | Native browser | Microphone permission |
| Service Worker | Offline support | Native browser | N/A |
| Vercel | Deployment | Git push | GitHub OAuth |
| Netlify | Alt deployment | Git push | GitHub OAuth |

---

*Integration audit: 2026-01-31*
