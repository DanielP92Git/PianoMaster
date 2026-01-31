# Technology Stack

**Analysis Date:** 2026-01-31

## Languages

**Primary:**
- JavaScript (ES2020+) - React components, services, hooks
- JSX/TSX - React component syntax

## Runtime

**Environment:**
- Node.js v22+ (confirmed running)
- Browser API (Web Audio API, Web Workers, Service Workers)

**Package Manager:**
- npm v11.7.0+
- Lockfile: `package-lock.json` present

## Frameworks

**Core Framework:**
- React 18.3.1 - UI component framework
- React Router 7.1.5 - Client-side routing with protected routes via `ProtectedRoute` component at `src/ui/ProtectedRoute.jsx`
- React DOM 18.3.1 - DOM rendering

**State Management:**
- Redux Toolkit 2.6.1 - Minimal usage for rhythm composition state only (see `src/reducers/rhythmReducer.jsx`)
- React Context API - Feature-scoped providers in `src/contexts/` (Accessibility, Settings, SightReadingSession, Rhythm)
- TanStack React Query 5.66.0 - Server state management with 5-min stale time and 10-min garbage collection
- Redux 5.0.1 - Core Redux library
- React Redux 9.2.0 - React bindings for Redux

**Music & Audio:**
- VexFlow 5.0.0 - SVG-based sheet music notation rendering at `src/components/games/sight-reading-game/utils/vexflowHelpers.js`
- Klavier 2.0.1 - Piano keyboard input handling at `src/components/games/sight-reading-game/components/KlavierKeyboard.jsx`
- Web Audio API - Native browser audio context for pitch detection and playback

**Internationalization:**
- i18next 25.7.0 - Translation framework
- react-i18next 16.3.5 - React binding for i18next
- i18next-browser-languagedetector 8.2.0 - Automatic language detection (localStorage, navigator, HTML tag)
- Supported languages: English (en), Hebrew (he, RTL)
- Language files at `src/locales/en/` and `src/locales/he/`

**Animation & Motion:**
- Framer Motion 12.23.26 - Advanced animations for UI elements at `src/components/ui/Fireflies.jsx`, `src/components/ui/WelcomeText.jsx`
- React Confetti 6.2.3 - Celebration animations for game victories

**UI Components & Icons:**
- Lucide React 0.344.0 - Icon library
- React Icons 5.5.0 - Additional icon sets
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- Material Icons Round - Google Material Design icons via Google Fonts
- Custom design system in `docs/DESIGN_SYSTEM.md` with card classes, text colors, borders

**Data Visualization:**
- Recharts 3.0.0 - React charting library for analytics at `src/components/charts/`

**Notifications & Toast:**
- React Hot Toast 2.5.1 - Lightweight toast notifications

**Build & Development:**
- Vite 6.3.5 - Fast build tool and dev server
- @vitejs/plugin-react 4.3.1 - React JSX transformation plugin
- vite-plugin-svgr 4.5.0 - SVG import as React components
- vite-plugin-static-copy 3.1.4 - Static file copying during build

**Styling & CSS:**
- Tailwind CSS 3.4.1 - Utility CSS framework
- PostCSS 8.4.35 - CSS transformation tool
- Autoprefixer 10.4.18 - Vendor prefix handling
- prettier-plugin-tailwindcss 0.7.2 - Tailwind class sorting in Prettier
- tailwindcss-animate 1.0.7 - Tailwind animation utilities

**Utilities:**
- clsx 2.1.1 - Conditional className merging

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.48.1 - Backend, authentication, database, real-time subscriptions
  - Authentication via OAuth/PKCE flow
  - Real-time PostgreSQL changes via WebSocket channels at `src/hooks/useRealTimeSubscriptions.js`
  - Database queries with RLS policies

**Infrastructure:**
- react-router-dom 7.1.5 - SPA routing with nested routes
- @tanstack/react-query 5.66.0 - Data fetching with caching and background sync
- @tanstack/react-query-devtools 5.66.0 - Query debugging interface

## Configuration

**Environment:**
- Vite environment variables via `import.meta.env.VITE_*`
- Required variables (set in `.env`):
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key for client-side access
  - `VITE_VAPID_KEY` - Web Push VAPID key (optional, for push notifications)
  - `VITE_DEBUG_MIC_LOGS` - Enable mic input logging to debug endpoint (development only)
- Environment detection: `process.env.NODE_ENV` (development vs production)
- Deployment target URL configured in `src/services/supabase.js`:
  - Development: `http://localhost:5174`
  - Production: `https://piano-master-nine.vercel.app`

**Build:**
- `vite.config.js` - React plugin, SVG-as-React plugin, dev server on port 5174
- `vitest.config.js` - Test environment (jsdom), globals enabled, setup file at `src/test/setupTests.js`
- `tailwind.config.js` - Custom fonts (Outfit, Comic Neue, Nunito, Fredoka One, Dancing Script, Heebo, Assistant, Noto Sans Hebrew), responsive screens, animations
- `postcss.config.js` - Tailwind CSS processing
- `eslint.config.js` - React + Hooks linting rules
- `.prettierrc` - Code formatting (80-char line width, 2-space tabs, trailing commas, semicolons, Tailwind plugin)

**Service Worker:**
- `public/sw.js` - PWA offline support with cache-first strategy for static assets
- Cache versioning: `pianomaster-v2`, `pianomaster-accessories-v2`
- Auth endpoints excluded from caching to prevent session persistence on shared devices
- Security: See CLAUDE.md Security Hardening Guidelines section for auth endpoint exclusion patterns

**PWA Configuration:**
- `public/manifest.json` - Web app manifest with app name, icons, shortcuts, theme color #581c87
- `index.html` - Preconnect to Google Fonts, PWA meta tags, iOS support, Apple touch icons
- Offline fallback at `public/offline.html`

**Supabase Configuration:**
- `supabase/config.toml` - Local development setup (PostgreSQL v17, API on port 54321, Realtime enabled)
- Migration files in `supabase/migrations/` (87 migrations tracked)
- Real-time subscriptions configured with 10 events/second limit

## Platform Requirements

**Development:**
- Node.js v22+ (confirmed)
- npm v11+
- For Supabase local: Docker (runs PostgreSQL, API, Studio, Realtime)
- Browser with modern JavaScript support (ES2020+)

**Production:**
- Deployment target: Vercel (primary, see `vercel.json`) or Netlify (see `netlify.toml`)
- Vercel: SPA rewrites to `/index.html`, auto-deployments on push
- Netlify: Build command `npm run build`, publish to `dist/`, SPA redirects
- Service Worker registered on page load for offline support
- Web Push support for notifications (requires VAPID key)

---

*Stack analysis: 2026-01-31*
