# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev              # Start dev server on port 5174
npm run build            # Production build (runs trail validation as prebuild hook)
npm run lint             # ESLint check
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier format all files
npm run format:check     # Prettier check (no write)
npm run preview          # Preview production build locally
npm run test             # Vitest in watch mode
npm run test:run         # Vitest single run
npm run verify:patterns  # Validate sight-reading pattern definitions
npm run verify:trail     # Validate trail node data (prereqs, cycles, XP, types)
```

**Testing a single file:** `npx vitest run src/path/to/file.test.js`

### Pre-commit & Build Hooks
- **Husky + lint-staged**: Pre-commit hook runs ESLint + Prettier on staged files
- **prebuild**: `npm run build` automatically runs `scripts/validateTrail.mjs` first — build fails if trail data has errors (broken prereqs, cycles, duplicate IDs, invalid XP)

## Architecture Overview

This is a **piano learning PWA** built with React 18 + Vite for 8-year-old learners. Features multiple music education games, user progression tracking, and teacher/student role differentiation.

### Tech Stack
- **Frontend:** React 18, Vite 6, React Router v7
- **State:** Redux Toolkit (minimal — rhythm only), React Context (feature-scoped), TanStack React Query v5
- **Backend:** Supabase (auth, database, real-time subscriptions)
- **Music Notation:** VexFlow v5 for SVG-based sheet music rendering
- **Audio:** Klavier library for keyboard input, Web Audio API for pitch detection
- **Styling:** Tailwind CSS 3 with custom design system (see `docs/DESIGN_SYSTEM.md`)
- **i18n:** i18next with English and Hebrew (RTL) support
- **Monitoring:** Sentry (error tracking), Umami (analytics)

### Build Conventions
- **SVG imports:** Use `import Icon from './icon.svg?react'` (via vite-plugin-svgr) — the `?react` suffix is required
- **App version:** `__APP_VERSION__` global is injected from package.json at build time via Vite `define`
- **Source maps:** Enabled in production builds (for Sentry)

### Key Directory Structure
```
src/
├── components/
│   ├── games/                    # Game implementations
│   │   ├── sight-reading-game/   # VexFlow-based notation reading
│   │   ├── notes-master-games/   # NotesRecognition, MemoryGame
│   │   ├── rhythm-games/         # Rhythm/metronome training
│   │   ├── shared/               # UnifiedGameSettings, AudioInterruptedOverlay
│   │   ├── VictoryScreen.jsx     # Post-game results + XP + trail progress
│   │   └── GameOverScreen.jsx    # Game over (lives/time/score variants)
│   ├── dashboard/                # Dashboard cards (DailyGoals, WeeklySummary, PushOptIn, XPProgress, DailyMessage, PlayNext, UnifiedStats)
│   ├── trail/                    # TrailMap, TrailNode, TrailNodeModal, UnitProgressCard
│   ├── streak/                   # StreakDisplay with freeze/grace/comeback UI
│   ├── orientation/              # RotatePromptOverlay for mobile landscape
│   ├── settings/                 # NotificationPermissionCard, ParentGateMath, ParentZoneEntryCard
│   └── layout/                   # Dashboard, AppLayout, Sidebar
├── pages/                        # Routed page components (Achievements, AchievementsRedesign, AchievementsLegacy, AppSettings, TrailMapPage, etc.)
├── features/                     # Feature hooks (auth, games, userData)
├── contexts/                     # Providers (Accessibility, Settings, AudioContext, SessionTimeout, SightReadingSession, Rhythm)
├── hooks/                        # Custom hooks (audio, pitch detection, mic presets, landscape lock)
├── services/                     # API calls and business logic
├── data/                         # Trail node definitions (constants, skillTrail, units/)
├── utils/                        # Shared utilities (xpSystem, isIOSSafari, pwaDetection, useMotionTokens, progressMigration)
├── config/                       # subscriptionConfig (free tier boundary)
└── locales/                      # i18n files (en, he)
supabase/
├── functions/                    # Edge Functions
│   ├── send-daily-push/          # Daily practice reminder (cron-triggered)
│   ├── send-weekly-report/       # Weekly parent progress email (cron-triggered)
│   ├── send-consent-email/       # COPPA parent consent email
│   ├── unsubscribe-weekly-report/ # HMAC-signed unsubscribe handler
│   ├── create-checkout/          # Lemon Squeezy checkout URL
│   ├── cancel-subscription/      # Cancel subscription via LS API
│   └── lemon-squeezy-webhook/    # Subscription lifecycle (lib/ for modular handlers)
└── migrations/                   # Database migrations with RLS policies
```

## VexFlow Implementation

VexFlow renders music notation as SVG. Key guidelines:
- **One measure per Stave** — each `Stave` represents one bar
- **Use SVG backend:** `new Renderer(div, Renderer.Backends.SVG)`
- **Automatic beaming:** Use `Beam.generateBeams(notes, config?)` instead of manual beams
- **Stem directions:** For rhythm-only displays, force `Stem.UP`; for pitch-based, let VexFlow calculate
- **Key strings:** `"pitch/octave"` (e.g., `'c/4'`, `'eb/4'`)
- **Duration codes:** `'w'`, `'h'`, `'q'`, `'8'`, `'16'`, `'qr'` (r = rest)

See `docs/vexflow-notation/vexflow-guidelines.md` for detailed patterns.

## Design System

The app uses **glassmorphism** on a purple gradient background (`bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900` in AppLayout.jsx).

### Glass Card Pattern (primary)
- **Container:** `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg`
- **Nested elements:** `bg-white/5 border-white/10` or `bg-white/10 border-white/20`
- **Text colors:** `text-white` (primary), `text-white/70` (secondary), `text-white/60` (tertiary)
- **Accent numbers:** `-300` variants (e.g., `text-indigo-300`, `text-green-300`)
- **Progress bars:** Track `bg-white/15`, fill `bg-indigo-400`
- **Hover states:** `hover:bg-white/5` or `hover:bg-white/10`

### CSS Card Classes (legacy — in index.css)
- `.card` = `bg-white/80 border-gray-200` — avoid on purple bg pages
- `.card-glass-legacy` = `bg-white/10 backdrop-blur-md border-white/20` — matches glass pattern

See `docs/DESIGN_SYSTEM.md` for additional patterns.

## Routing

Protected routes require authentication. Teachers auto-redirect to `/teacher`. Key routes:
- `/` — Dashboard (role-specific)
- `/trail` — Skill progression trail (full-viewport overlay)
- `/notes-master-mode/*` — Note learning games
- `/rhythm-mode/*` — Rhythm training games
- `/practice-modes` — Free practice mode selection
- `/practice-sessions` — Recording and playback
- `/achievements` — Achievement badges (AchievementsRedesign wrapper)
- `/subscribe` — Subscription purchase (Lemon Squeezy overlay checkout)
- `/subscribe/success` — Post-purchase confirmation
- `/parent-portal` — Parent Zone (math-gated: stats, heatmap, subscription, notifications, account deletion, legal)
- `/settings` — App settings (profile, accessibility, audio, install instructions)
- `/legal` — Privacy/legal page
- `/consent/verify` — **Public route** (no auth). Parent email verification for COPPA consent

### Layout Patterns
- **Full-viewport overlays** (Trail Map): `fixed inset-0 overflow-y-auto`, AppLayout hides sidebar/header
- **Game routes** (`/notes-master-mode/*`, `/rhythm-mode/*`, `/ear-training-mode/*`): Hide sidebar/header for distraction-free gameplay
- **CRITICAL: When adding a new game route**, add it to BOTH arrays: `LANDSCAPE_ROUTES` in `App.jsx` AND `gameRoutes` in `AppLayout.jsx`. Missing either causes sidebar/header to show during gameplay or landscape lock to fail.

## Teacher Dashboard

The teacher dashboard (`/teacher/*`) provides class management across four tabs. All tabs use the glassmorphism design system.

### Tabs & Components
- **Students** (`TeacherDashboard.jsx`): Collapsible student cards (closed by default), stat summary grid (2x2 mobile, 4-across desktop), search/sort/filter toolbar
- **Analytics** (`AnalyticsDashboard.jsx`): Class performance charts, top performers, practice activity timeline, performance distribution
- **Recordings** (`RecordingsReview.jsx`): Two-level collapsible — grouped by student (Level 1), each recording expandable (Level 2) with audio player + review
- **Assignments** (`AssignmentManagement.jsx`): Compact cards with inline metadata, CRUD with modal forms
- **Notifications** (`NotificationCenter.jsx`): **Currently disabled** — tab and route commented out. Search `TODO: re-enable when ready` in `TeacherDashboard.jsx` to restore

### UI Patterns
- **Collapsible cards**: `expandedX` Set state + `toggleExpanded(id)` pattern (used in students, recordings)
- **Select All / Delete**: Consistent text-style buttons across all tabs (not `Button` component)
- **Action buttons**: Icon-only (`p-1 text-white/40 hover:bg-blue-500/20`) matching student card pattern
- **Glass-styled filters**: `bg-white/10 border-white/20 text-white` inputs, `appearance-none` selects with `ChevronDown` overlay
- **Dropdown options**: Global CSS rule (`select option { background-color: #1e1b4b; color: #fff; }`) in `index.css`

### Audio Player (`AudioPlayer.jsx`)
- Play/pause only (no skip/stop buttons)
- `knownDuration` prop for DB-sourced duration (webm files often lack metadata duration)
- `PracticeSessionPlayer` passes `session?.duration_seconds || session?.duration` to handle both field names

### Key Services
- `src/services/apiTeacher.js` — All teacher API functions (CRUD students, recordings, assignments, notifications)
- `useAccountStatus` hook skips query for teachers (`{ enabled: isStudent }`) to avoid 406 errors

## Game Session Flow

Games follow a consistent session model:
1. **Pre-game setup:** Configure settings (clef, time signature, difficulty)
2. **Session state:** `idle` → `in-progress` → `complete`
3. **Exercise tracking:** 10 exercises per session with scoring
4. **Feedback:** Real-time pitch/rhythm accuracy via mic or keyboard input
5. **Result:** VictoryScreen (stars + XP) or GameOverScreen (lives/time/score variants)

## Gamification Trail System

A Duolingo-style skill progression with 93 nodes across three parallel learning paths.

### Core Concepts
- **Skill Nodes**: 93 units (Treble: 23, Bass: 22, Rhythm: 36, Boss: 12)
- **Star Rating**: 0-3 stars (60%=1, 80%=2, 95%=3)
- **XP System**: 30 static levels (Beginner → Transcendent) + infinite prestige tiers (3000 XP each beyond level 30)
- **Daily Goals**: 3 random goals per day (complete_exercises, earn_three_stars, practice_new_node, perfect_score, maintain_streak)
- **Prerequisites**: Nodes unlock progressively
- **Sequential Exercises**: Nodes can have multiple exercises completed in order; node stars = minimum across all

### Data Layer
- `src/data/constants.js` — `NODE_CATEGORIES` (TREBLE_CLEF, BASS_CLEF, RHYTHM, BOSS), `EXERCISE_TYPES` (NOTE_RECOGNITION, SIGHT_READING, RHYTHM, MEMORY_GAME, BOSS_CHALLENGE)
- `src/data/skillTrail.js` — `SKILL_NODES` array (93 nodes), `getNodeById()`, `getNodesByCategory()`, `getBossNodes()`, `getNextNodeInCategory()`, `isNodeUnlocked()`, `getUnlockedNodes()`
- `src/data/expandedNodes.js` — Aggregates unit files from `src/data/units/`
- `src/data/units/` — trebleUnit1-3Redesigned.js, bassUnit1-3Redesigned.js, rhythmUnit1-6Redesigned.js

### Services
- `src/services/skillProgressService.js` — CRUD for student node/exercise progress, unlock checks, recommendations
- `src/services/dailyGoalsService.js` — Daily goal generation and progress calculation
- `src/utils/xpSystem.js` — XP levels (30 static + infinite prestige tiers at 3000 XP each), level calculation, XP awards

### Config
- `src/config/subscriptionConfig.js` — `FREE_NODE_IDS` Set (19 IDs), `isFreeNode()`, must sync with Postgres `is_free_node()`

### Content Gate (Defense in Depth)
1. **React UI** — `isFreeNode()` from subscriptionConfig (fast UX, shows paywall)
2. **Database RLS** — `is_free_node(node_id) OR has_active_subscription(auth.uid())` (ground truth)

Non-trail games pass `node_id: null` which always passes.

### Trail Node Structure
```javascript
{
  id: 'treble_c_e', name: 'C, D, E', category: 'treble_clef', order: 2,
  prerequisites: ['treble_c_d'], skills: ['C4', 'D4', 'E4'],
  exercises: [{ type: 'note_recognition', config: { notePool: ['C4', 'D4', 'E4'], questionCount: 10, clef: 'treble' } }],
  xpReward: 50, isBoss: false
}
```

### Navigation State for Trail Games
Pass via `location.state`: `{ nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType }`

### Game Component Integration
All four game components accept trail state and auto-start via `hasAutoStartedRef` pattern:
- `NotesRecognitionGame.jsx` — `handleNextExercise` callback
- `SightReadingGame.jsx` — `handleNextTrailExercise` callback
- `MetronomeTrainer.jsx` — `handleNextExercise` callback
- `MemoryGame.jsx` — `handleNextExercise` callback (exercise type: `memory_game`)

### VictoryScreen Trail Behavior
- Calls `updateExerciseProgress()` when `exerciseIndex` provided (else `updateNodeProgress()`)
- Shows "Next Exercise (X left)" when `exercisesRemaining > 0`
- Shows "Back to Trail" when node is complete
- Only awards XP when entire node is complete
- Applies comeback multiplier when streak bonus is active

### Key Database Concepts
- **`student_skill_progress`**: Per-node stars (0-3), best score, `exercise_progress` JSONB array
- **`parent_subscriptions`**: Status enum: `on_trial|active|paused|past_due|unpaid|cancelled|expired`
- **`students_score.node_id`**: `NULL` for non-trail games (always allowed by RLS)
- **Postgres helpers**: `is_free_node()` (mirrors JS `FREE_NODE_IDS`), `has_active_subscription()` (with grace periods), `award_xp()` (30 levels + prestige)
- Full schemas in `supabase/migrations/`

## Push Notifications

Web Push notifications to encourage daily practice. COPPA-compliant with parent gate.

- **Dashboard**: `PushOptInCard` shown after 7 days → navigates to `/settings`
- **Parent Portal**: `NotificationPermissionCard` manages 6-state machine: `loading | unsupported | denied | enabled | consent_skip | default`. Platform-specific unblock instructions when denied.
- **COPPA gate**: `ParentGateMath` — two-digit addition problem, hint after 3 failures, `parent_consent_granted = true` in DB
- **iOS PWA**: Detects non-standalone mode, shows "install first" warning

### Environment Variables
- **Edge Functions**: `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- **Client**: `VITE_VAPID_PUBLIC_KEY`

## Weekly Parent Progress Reports

HTML-formatted weekly emails via Brevo, sent Mondays at 08:00 UTC. HMAC-SHA256 signed unsubscribe links. 6-day dedup guard.

Required env: `CRON_SECRET`, `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`, `WEEKLY_REPORT_HMAC_SECRET`

## Streak Protection System

Prevents frustrating streak loss with grace windows, freezes, weekend pass, and comeback bonuses.

### Architecture
- **Grace Window**: 36 hours from last practice (not midnight cutoff)
- **Streak Freezes**: 0-3 inventory, earned every 7-day milestone, auto-consumed when grace expires
- **Weekend Pass**: Parent-gated toggle in Settings; skips Friday/Saturday (Israeli Shabbat)
- **Comeback Bonus**: When streak breaks, 2x XP multiplier for 3 days
- **Core logic**: `src/services/streakService.js` — React Query key: `["streak-state", userId]`

## Notes Recognition Engagement

Arcade-style mechanics for `NotesRecognitionGame.jsx`:
- **Combo System**: Correct answers increment combo; wrong answer resets with shake
- **Lives System**: 3 lives per session; 0 lives triggers `GameOverScreen`
- **On-Fire Mode**: Triggered at combo threshold; fire icon + glow effect; respects reduced-motion
- **Auto-Grow Note Pool**: Trail mode combo milestones expand note pool using `getNextNodeInCategory()`; banner notification for new notes

## Session Timeout

Automatic inactivity logout for child safety on shared devices. Games must call `pauseTimer()` during gameplay and `resumeTimer()` when idle (from `SessionTimeoutContext`). Role-based durations (students shorter than teachers).

## Audio Infrastructure

- Central `AudioContext` via `AudioContextProvider` — all audio goes through `useAudioContext()` hook
- Pitch detection: McLeod Pitch Method via `pitchy` (clarity gate 0.9, range A2-C6)
- Mic input: `useMicNoteInput.js` state machine with named presets in `micInputPresets.js`
- **iOS Safari**: Requires special handling for audio context interruptions (`AudioInterruptedOverlay`), mic errors, and standalone PWA detection. See `src/utils/isIOSSafari.js`

## PWA & Service Worker

### Service Worker (`public/sw.js`)
- **Cache version**: `pianomaster-v7` (bump to force refresh)
- **Static assets** (`/assets/*`): Cache-first (safe due to Vite content-hashing)
- **Navigation**: Network-first with cache fallback (ensures latest `index.html` after deploy), offline page as last resort
- **API calls**: Network-first with cache fallback
- **Supabase REST API** (`/rest/`): Never cached (prevents stale subscription-gate state)
- **Auth endpoints**: Never cached (security — see `docs/SECURITY_GUIDELINES.md`)
- **Push notifications**: Handles `push` and `notificationclick` events

### Image Optimization
Hero images use `<picture>` with WebP format + preload hints in `index.html`.

## Accessibility

Via `AccessibilityContext`: high contrast, reduced motion, screen reader optimization, RTL (Hebrew), extended timeouts.

## Testing

Vitest with JSDOM. Setup: `src/test/setupTests.js`.

### Conventions
- Test files live either as `*.test.{js,jsx}` siblings or in `__tests__/` directories next to source
- Uses `@testing-library/react` + `@testing-library/jest-dom` for component tests
- Utility/service tests are plain Vitest (no DOM needed)

## Security

See `docs/SECURITY_GUIDELINES.md` for comprehensive security patterns. Key principles:
- **COPPA/GDPR-K**: PII minimization, parent consent gate for notifications/emails
- **RLS everywhere**: All Supabase tables use Row Level Security; `auth.uid()` verification in service functions
- **Defense in depth**: Content gates enforced in both React UI (`isFreeNode()`) and database RLS
- **Service worker**: Auth endpoints and Supabase REST API are never cached (`public/sw.js`)
- **Roles**: DB-based (not JWT claims) — teacher/student differentiation via `students.role`
