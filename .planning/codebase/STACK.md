# Technology Stack

**Analysis Date:** 2026-03-08

## Languages

**Primary:**
- JavaScript (ES2020+) - All application code (`.js`, `.jsx` files)
- JSX - React component syntax throughout `src/`

**Secondary:**
- TypeScript - Supabase Edge Functions only (`supabase/functions/**/*.ts`), runs on Deno
- SQL - Database migrations (`supabase/migrations/*.sql`), 99 migration files
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
- Redux Toolkit `^2.6.1` + React Redux `^9.2.0` - Minimal usage, only rhythm composition state (`src/store.js`, `src/reducers/rhythmReducer.jsx`)
- TanStack React Query `^5.66.0` - Server state, auth, caching (5-min staleTime default, 10-min gcTime)
- React Context - Feature-scoped providers in `src/contexts/` (7 context files)

**Styling:**
- Tailwind CSS `^3.4.1` - Utility-first CSS with extensive custom config
- PostCSS `^8.4.35` + Autoprefixer `^10.4.18` - CSS processing pipeline
- `tailwindcss-animate` `^1.0.7` - Animation utilities
- `prettier-plugin-tailwindcss` `^0.7.2` - Class sorting in Prettier

**Testing:**
- Vitest `^3.2.4` - Test runner (JSDOM environment)
- Testing Library React `^16.3.0` - Component testing utilities
- Testing Library Jest-DOM `^6.9.1` - DOM assertion matchers
- JSDOM `^26.1.0` - Browser environment simulation

**Build/Dev:**
- `@vitejs/plugin-react` `^4.3.1` - React Fast Refresh for Vite
- `vite-plugin-svgr` `^4.5.0` - SVG-to-React-component imports (`*.svg?react`)
- `rollup-plugin-visualizer` `^6.0.5` - Bundle analysis (output: `dist/bundle-stats.html`)
- `vite-plugin-static-copy` `^3.1.4` - Static asset copying during build

**Code Quality:**
- ESLint `^9.9.1` - Flat config format (`eslint.config.js`)
- Prettier `^3.6.0` - Code formatting
- Husky `^9.1.7` - Git hooks (pre-commit)
- lint-staged `^16.1.2` - Staged file linting/formatting

## Key Dependencies

**Critical (Core Functionality):**
- `@supabase/supabase-js` `^2.48.1` - Backend client (auth, database, realtime, edge functions)
- `vexflow` `^5.0.0` - Music notation rendering (SVG-based sheet music)
- `klavier` `^2.0.1` - Piano keyboard input handling
- `pitchy` `^4.1.0` - Pitch detection via McLeod Pitch Method (microphone input)

**UI & Animation:**
- `framer-motion` `^12.23.26` - Animations and transitions (reduced-motion-aware via `useMotionTokens`)
- `lucide-react` `^0.344.0` - Icon library (excluded from Vite optimizeDeps)
- `react-icons` `^5.5.0` - Additional icon sets
- `react-confetti` `^6.2.3` - Victory/celebration effects
- `react-hot-toast` `^2.5.1` - Toast notifications
- `recharts` `^3.0.0` - Charts/graphs (teacher dashboard, progress visualization)
- `react-countdown` `^2.3.6` - Timer displays in games

**i18n:**
- `i18next` `^25.7.0` - Internationalization framework
- `react-i18next` `^16.3.5` - React bindings for i18next
- `i18next-browser-languagedetector` `^8.2.0` - Auto-detect browser language

**Infrastructure:**
- `react-idle-timer` `^5.7.2` - Inactivity detection for session timeout
- `@negrel/webpush` (Deno, jsr import) - Web Push notifications in Edge Functions
- Brevo API (HTTP) - Transactional email sending (consent emails, weekly reports)

**Fonts (COPPA-06 compliance, self-hosted via @fontsource):**
- `@fontsource/outfit` - Primary sans-serif
- `@fontsource/comic-neue` - Playful/comic font
- `@fontsource/nunito` - Rounded sans-serif
- `@fontsource/fredoka-one` - Display font
- `@fontsource/dancing-script` - Signature/cursive font
- `@fontsource/heebo` - Hebrew/RTL font
- `@fontsource/assistant` - Hebrew/RTL font
- `@fontsource/quicksand` - Trail page font

## Configuration

**Environment Variables (`.env` file present):**
- `VITE_SUPABASE_URL` - Supabase project URL (required, validated at startup in `src/services/supabase.js`)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key (required, validated at startup)
- `VITE_VAPID_PUBLIC_KEY` - VAPID public key for push notifications

**Supabase Edge Function Secrets:**
- `CRON_SECRET` - Shared secret for pg_cron-triggered functions
- `VAPID_KEYS_JSON` - VAPID keys (JWK format) for web push
- `VAPID_SUBJECT` - VAPID subject identifier
- `LS_API_KEY` - Lemon Squeezy API key
- `LS_STORE_ID` - Lemon Squeezy store ID
- `LS_SIGNING_SECRET` - Lemon Squeezy webhook HMAC signing secret
- `BREVO_API_KEY` - Brevo transactional email API key
- `SENDER_EMAIL` - Verified sender email address
- `SENDER_NAME` - Sender display name
- `WEEKLY_REPORT_HMAC_SECRET` - HMAC secret for unsubscribe link tokens
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` - Auto-injected by Supabase

**Build Configuration:**
- `vite.config.js` - Vite config (React plugin, SVGR, bundle visualizer)
- `tailwind.config.js` - Extensive custom theme (colors, fonts, animations, spacing via CSS custom properties)
- `postcss.config.js` - Tailwind + Autoprefixer
- `eslint.config.js` - Flat config with React, React Hooks, React Refresh plugins
- `.prettierrc` - Semi, double quotes, trailing commas (es5), 80 char width, LF line endings
- `vercel.json` - SPA rewrite rule (all routes to `index.html`)

**Pre-build Validation:**
- `scripts/validateTrail.mjs` - Runs as `prebuild` hook, validates trail node definitions
- `scripts/patternVerifier.mjs` - Manual pattern validation (`npm run verify:patterns`)

**Supabase Auth Configuration (in `src/services/supabase.js`):**
- PKCE flow (`flowType: "pkce"`)
- Auto-refresh tokens enabled
- Session persistence enabled
- URL detection enabled
- Realtime events capped at 10/second

## Platform Requirements

**Development:**
- Node.js (version not pinned, no `.nvmrc` or `.node-version`)
- npm for package management
- Dev server runs on `http://0.0.0.0:5174` (strict port)

**Production:**
- Hosted on Vercel (`https://piano-master-nine.vercel.app`)
- SPA routing via `vercel.json` rewrite rules
- Supabase project for backend (managed cloud)
- PWA with service worker (`public/sw.js`, cache version `pianomaster-v6`)
- Requires HTTPS for PWA features (push notifications, service worker)

**Browser Support:**
- Modern browsers with Web Audio API
- iOS Safari with specific hardening (`src/utils/isIOSSafari.js`)
- Android Chrome/WebView for PWA install and landscape lock
- No IE11 support

**Mobile-Specific:**
- PWA manifest at `/manifest.json` (standalone display, theme color `#581c87`)
- iOS-specific meta tags for standalone mode
- Orientation control: landscape for games, portrait default
- Touch targets: minimum 44px (`minHeight.touch` in Tailwind config)

---

*Stack analysis: 2026-03-08*
