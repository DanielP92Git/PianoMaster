# Technology Stack

**Analysis Date:** 2026-03-23

## Languages

**Primary:**
- JavaScript (ES2020+) - All application code (`.js`, `.jsx` files)
- JSX - React component syntax throughout `src/`

**Secondary:**
- TypeScript - Supabase Edge Functions only (`supabase/functions/**/*.ts`), runs on Deno
- SQL - Database migrations (`supabase/migrations/*.sql`), 100+ migration files
- JSON - i18n translation files (`src/locales/en/`, `src/locales/he/`)
- CSS - Tailwind with custom properties (`src/index.css`)

## Runtime

**Frontend:**
- Node.js (development) - Vite dev server, build tooling
- Browser - Production runtime (PWA, supports iOS Safari, Chrome, Android WebView)

**Backend (Edge Functions):**
- Deno - Supabase Edge Functions runtime (`supabase/functions/`)
- Imports via `https://esm.sh/` and `jsr:` URL imports (Deno conventions)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present
- `"type": "module"` in `package.json` (ES modules)

## Frameworks

**Core:**
- React `^18.3.1` - UI framework
- React DOM `^18.3.1` - DOM rendering
- React Router DOM `^7.1.5` - Client-side routing (v7 with `BrowserRouter`)
- Vite `^6.3.5` - Build tool and dev server (port 5174)

**State Management:**
- Redux Toolkit `^2.6.1` + React Redux `^9.2.0` - Minimal usage, rhythm composition state only (`src/store.js`, `src/reducers/rhythmReducer.jsx`)
- TanStack React Query `^5.66.0` - Server state, auth, caching. Primary state management for all server data.
- React Context - Feature-scoped providers in `src/contexts/` (7 contexts: Accessibility, AudioContext, Modal, SessionTimeout, Settings, SightReadingSession, Subscription)

**Styling:**
- Tailwind CSS `^3.4.1` - Utility-first CSS with extensive custom config (`tailwind.config.js`)
- PostCSS `^8.4.35` + Autoprefixer `^10.4.18` - CSS processing pipeline (`postcss.config.js`)
- `tailwindcss-animate` `^1.0.7` - Animation utilities
- `prettier-plugin-tailwindcss` `^0.7.2` - Automatic class sorting in Prettier

**Testing:**
- Vitest `^3.2.4` - Test runner (JSDOM environment, config: `vitest.config.js`)
- Testing Library React `^16.3.0` - Component testing utilities
- Testing Library Jest-DOM `^6.9.1` - DOM assertion matchers
- JSDOM `^26.1.0` - Browser environment simulation
- Setup file: `src/test/setupTests.js`

**Build/Dev:**
- `@vitejs/plugin-react` `^4.3.1` - React Fast Refresh for Vite
- `vite-plugin-svgr` `^4.5.0` - SVG-to-React-component imports (`*.svg?react` suffix required)
- `rollup-plugin-visualizer` `^6.0.5` - Bundle analysis (output: `dist/bundle-stats.html`)
- `vite-plugin-static-copy` `^3.1.4` - Static asset copying during build

**Code Quality:**
- ESLint `^9.9.1` - Flat config format (`eslint.config.js`)
  - Plugins: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
  - Key rules: `react/prop-types: off`, `react/react-in-jsx-scope: off`, `no-unused-vars: warn` (with `_` prefix ignore)
  - Separate globals for test files (vitest + node), config files (node), service worker (serviceworker)
- Prettier `^3.6.0` - Code formatting (`.prettierrc`)
  - Double quotes, semicolons, trailing commas (es5), 80 char width, LF line endings, 2-space tabs
- Husky `^9.1.7` - Git hooks (pre-commit)
- lint-staged `^16.1.2` - Staged file linting/formatting
  - `*.{js,jsx,ts,tsx}` -> ESLint fix + Prettier
  - `*.{json,css,md}` -> Prettier only

## Key Dependencies

**Critical (Core Functionality):**
- `@supabase/supabase-js` `^2.48.1` - Backend client (auth, database, realtime, edge functions)
- `vexflow` `^5.0.0` - Music notation rendering (SVG-based sheet music)
- `klavier` `^2.0.1` - Piano keyboard input handling
- `pitchy` `^4.1.0` - Pitch detection via McLeod Pitch Method (clarity gate 0.9, range A2-C6)

**UI & Animation:**
- `framer-motion` `^12.23.26` - Animations and transitions (reduced-motion-aware via `useMotionTokens`)
- `lucide-react` `^0.344.0` - Icon library (excluded from Vite `optimizeDeps`)
- `react-icons` `^5.5.0` - Additional icon sets
- `react-confetti` `^6.2.3` - Victory/celebration effects
- `react-hot-toast` `^2.5.1` - Toast notifications
- `recharts` `^3.0.0` - Charts/graphs (teacher dashboard, progress visualization)
- `react-countdown` `^2.3.6` - Timer displays in games

**i18n:**
- `i18next` `^25.7.0` - Internationalization framework
- `react-i18next` `^16.3.5` - React bindings for i18next
- `i18next-browser-languagedetector` `^8.2.0` - Auto-detect browser language (order: localStorage, navigator, htmlTag)

**Infrastructure:**
- `react-idle-timer` `^5.7.2` - Inactivity detection for session timeout
- `@negrel/webpush` (Deno, jsr import) - Web Push notifications in Edge Functions
- Brevo API (HTTP) - Transactional email sending (consent emails, weekly reports, feedback)

**Fonts (COPPA-06 compliance, self-hosted via @fontsource):**
- `@fontsource/outfit` - Primary sans-serif (`font-outfit`)
- `@fontsource/comic-neue` - Playful/comic font (`font-comic`)
- `@fontsource/nunito` - Rounded sans-serif (`font-rounded`)
- `@fontsource/fredoka-one` - Display font (`font-playful`)
- `@fontsource/dancing-script` - Signature/cursive font (`font-signature`)
- `@fontsource/heebo` - Hebrew/RTL font (`font-hebrew`)
- `@fontsource/assistant` - Hebrew/RTL font (`font-hebrew`)
- `@fontsource/quicksand` - Trail page font (`font-quicksand`)

## Configuration

**Vite Build Configuration (`vite.config.js`):**
- `__APP_VERSION__` global injected from `package.json` version
- Source maps enabled in production (for Sentry)
- Dev server: port 5174, host `0.0.0.0`, strict port
- Sentry source map upload: conditional on `SENTRY_AUTH_TOKEN` env var
- SVGR plugin: files matching `**/*.svg?react`
- Bundle visualizer: treemap at `dist/bundle-stats.html`

**Tailwind Configuration (`tailwind.config.js`):**
- Dark mode: class-based
- Content scan: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`
- Custom font families: outfit, comic, rounded, playful, signature, hebrew, quicksand
- Custom colors via CSS custom properties: primary, secondary, accent, success, warning, error, gray, surface, text, border, glass
- Legacy hardcoded color scales: kidsPrimary, kidsSecondary, kidsAccent, kidsSuccess, kidsWarning, kidsError, highContrast
- Trail-specific colors: cyan-glow, purple-glow, forest-base, forest-mid, forest-accent
- Custom animations: celebration, floatUp, shimmer, fadeIn, bounce, wiggle, pulse
- Custom shadows: node-3d, node-3d-pressed, glow-cyan, glow-purple
- Touch targets: `minHeight.touch: 44px`, `minWidth.touch: 44px`
- Container: centered, 2rem padding, max 1400px

**Environment Variables (`.env` file present):**
- `VITE_SUPABASE_URL` - Supabase project URL (required, validated at startup in `src/services/supabase.js`)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key (required, validated at startup)
- `VITE_VAPID_PUBLIC_KEY` - VAPID public key for push notifications
- `VITE_SENTRY_DSN` - Sentry error tracking DSN (optional, production only)
- `VITE_SITE_URL` - Site URL for auth redirects (defaults to `http://localhost:5174`)

**Sentry Build Env Vars (Netlify-side, for source map upload):**
- `SENTRY_AUTH_TOKEN` - Sentry API token
- `SENTRY_ORG` - Sentry organization slug
- `SENTRY_PROJECT` - Sentry project slug

**Supabase Edge Function Secrets (stored in Supabase Vault):**
- `CRON_SECRET` - Shared secret for pg_cron-triggered functions
- `VAPID_KEYS_JSON` - VAPID keys (JWK format) for web push
- `VAPID_SUBJECT` - VAPID subject identifier (e.g., `mailto:admin@pianomaster.app`)
- `LS_API_KEY` - Lemon Squeezy API key
- `LS_STORE_ID` - Lemon Squeezy store ID
- `LS_SIGNING_SECRET` - Lemon Squeezy webhook HMAC signing secret
- `BREVO_API_KEY` - Brevo transactional email API key
- `SENDER_EMAIL` - Verified sender email address
- `SENDER_NAME` - Sender display name
- `WEEKLY_REPORT_HMAC_SECRET` - HMAC secret for unsubscribe link tokens
- `AUDIT_HMAC_SECRET` - HMAC secret for hashing student IDs in account deletion audit log
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` - Auto-injected by Supabase

**Pre-build Validation:**
- `scripts/validateTrail.mjs` - Runs as `prebuild` hook, validates trail node definitions (prereqs, cycles, XP, types)
- `scripts/patternVerifier.mjs` - Manual pattern validation (`npm run verify:patterns`)

**i18n Configuration (`src/i18n/index.js`):**
- Supported languages: English (`en`), Hebrew (`he`)
- Fallback language: English
- Namespaces: `common` (default), `trail`
- Resource files: `src/locales/en/common.json`, `src/locales/en/trail.json`, `src/locales/he/common.json`, `src/locales/he/trail.json`
- Detection order: localStorage -> navigator -> htmlTag
- Suspense disabled (`useSuspense: false`)

**Supabase Client Configuration (`src/services/supabase.js`):**
- Auth flow: PKCE (`flowType: "pkce"`)
- Auto-refresh tokens enabled
- Session persistence enabled
- URL detection enabled
- Redirect URL: `VITE_SITE_URL` or `http://localhost:5174`
- Custom header: `X-Client-Info: piano-app@1.0.0`
- Realtime events capped at 10/second
- Schema: `public`

## Platform Requirements

**Development:**
- Node.js (version not pinned, no `.nvmrc` or `.node-version`)
- npm for package management
- Dev server runs on `http://0.0.0.0:5174` (strict port)

**Production:**
- Hosted on **Netlify** (`https://testpianomaster.netlify.app`)
- SPA routing via `netlify.toml` redirects and `public/_redirects`
- Netlify cache headers: immutable for icons/audio/sounds/avatars, no-cache for HTML/SW/manifest
- Supabase project for backend (managed cloud)
- PWA with service worker (`public/sw.js`, cache version `pianomaster-v8`)
- Requires HTTPS for PWA features (push notifications, service worker)

**Browser Support:**
- Modern browsers with Web Audio API
- iOS Safari with specific hardening (`src/utils/isIOSSafari.js`, `AudioInterruptedOverlay`)
- Android Chrome/WebView for PWA install and landscape lock
- No IE11 support

**Mobile-Specific:**
- PWA manifest at `/manifest.json` (standalone display, theme color `#581c87`)
- iOS-specific meta tags for standalone mode in `index.html`
- Orientation control: landscape for games, portrait default
- Touch targets: minimum 44px (`minHeight.touch` in Tailwind config)
- Install prompts: `src/components/pwa/PWAInstallPrompt.jsx`, `src/components/pwa/IOSInstallPrompt.jsx`
- Update notification: `src/components/pwa/PWAUpdateNotification.jsx`
- Network status indicator: `src/components/pwa/NetworkStatus.jsx`

**Monitoring:**
- Sentry `@sentry/react` `^10.44.0` - Error tracking (production only, `src/services/sentryService.js`)
  - `sendDefaultPii: false` (COPPA compliance)
  - `tracesSampleRate: 0.1` (10% of transactions)
  - Session/error replays disabled
  - Source maps uploaded via `@sentry/vite-plugin` `^5.1.1`
- Umami analytics - COPPA-safe, cookie-free analytics loaded via script tag in `index.html`
  - Website ID: `7101503f-b466-4f1e-acaa-d190d9862302`
  - Cloud instance: `https://cloud.umami.is/script.js`

---

*Stack analysis: 2026-03-23*
