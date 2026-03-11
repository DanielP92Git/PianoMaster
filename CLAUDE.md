# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server on port 5174
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format all files
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run
npm run verify:patterns  # Validate pattern definitions
```

**Testing a single file:** `npx vitest run src/path/to/file.test.js`

## Architecture Overview

This is a **piano learning PWA** built with React 18 + Vite for 8-year-old learners. Features multiple music education games, user progression tracking, and teacher/student role differentiation.

### Tech Stack
- **Frontend:** React 18, Vite 6, React Router v7
- **State:** Redux Toolkit (minimal — rhythm only), React Context (feature-scoped), TanStack React Query v5
- **Backend:** Supabase (auth, database, real-time subscriptions)
- **Music Notation:** VexFlow v5 for SVG-based sheet music rendering
- **Audio:** Klavier library for keyboard input, Web Audio API for pitch detection
- **Styling:** Tailwind CSS with custom design system (see `docs/DESIGN_SYSTEM.md`)
- **i18n:** i18next with English and Hebrew (RTL) support

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
│   ├── settings/                 # NotificationPermissionCard, ParentGateMath
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
- `/parent-portal` — Subscription management
- `/settings` — App settings (notifications, subscription, accessibility, weekend pass)
- `/legal` — Privacy/legal page
- `/consent/verify` — **Public route** (no auth). Parent email verification for COPPA consent

### Layout Patterns
- **Full-viewport overlays** (Trail Map): `fixed inset-0 overflow-y-auto`, AppLayout hides sidebar/header
- **Game routes** (`/notes-master-mode/*`, `/rhythm-mode/*`): Also hide sidebar/header for distraction-free gameplay

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
- `src/services/skillProgressService.js` — CRUD for student progress: `getStudentProgress()`, `getNodeProgress()`, `updateNodeProgress()`, `getNextRecommendedNode()`, `getCompletedNodeIds()`, `checkNodeUnlocked()`, `getExerciseProgress()`, `getNextExerciseIndex()`, `updateExerciseProgress()`, `isExerciseCompleted()`
- `src/services/dailyGoalsService.js` — `getTodaysGoals()`, `getDailyGoalsWithProgress()`, `calculateDailyProgress()`
- `src/utils/xpSystem.js` — `XP_LEVELS` (30 levels), `MAX_STATIC_LEVEL`, `PRESTIGE_XP_PER_TIER` (3000), `calculateLevel()`, `calculateXPReward()`, `awardXP()`

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

### Database Tables

```sql
student_skill_progress (student_id UUID, node_id TEXT, stars INT 0-3, best_score INT 0-100,
  exercises_completed INT, last_practiced TIMESTAMP, exercise_progress JSONB DEFAULT '[]')

student_daily_goals (student_id UUID, goal_date DATE, goals JSONB, completed_goals JSONB)

students.total_xp INTEGER, students.current_level INTEGER (1-30+)

subscription_plans (id TEXT PK, name, billing_period, currency, amount_cents, lemon_squeezy_variant_id, is_active)

parent_subscriptions (student_id UUID FK, ls_subscription_id, ls_customer_id, ls_variant_id,
  plan_id FK, status TEXT, current_period_end TIMESTAMP, parent_email TEXT)
-- status: on_trial|active|paused|past_due|unpaid|cancelled|expired

students_score.node_id TEXT  -- NULL for non-trail games (always allowed)
```

### Postgres Helper Functions
- `is_free_node(p_node_id TEXT) → BOOLEAN` — IMMUTABLE, mirrors `FREE_NODE_IDS` in subscriptionConfig
- `has_active_subscription(p_student_id UUID) → BOOLEAN` — STABLE, SECURITY DEFINER, with grace periods
- `award_xp(p_student_id UUID, p_xp_amount INTEGER)` — SECURITY DEFINER with `auth.uid()` check, handles 30 levels + prestige

## Push Notifications

Web Push notifications to encourage daily practice. COPPA-compliant with parent gate.

- **Dashboard**: `PushOptInCard` shown after 7 days → navigates to `/settings`
- **Settings**: `NotificationPermissionCard` manages 6-state machine: `loading | unsupported | denied | enabled | consent_skip | default`
- **COPPA gate**: `ParentGateMath` — two-digit addition problem, hint after 3 failures, `parent_consent_granted = true` in DB
- **iOS PWA**: Detects non-standalone mode, shows "install first" warning

### Key Files
| File | Role |
|---|---|
| `src/services/notificationService.js` | Client-side push helpers |
| `src/components/settings/NotificationPermissionCard.jsx` | Settings toggle with state machine |
| `src/components/settings/ParentGateMath.jsx` | COPPA math gate overlay |
| `supabase/functions/send-daily-push/index.ts` | Edge Function (cron 14:00 UTC, context-aware messages) |

### Database
```sql
push_subscriptions (id UUID PK, student_id UUID UNIQUE FK, subscription JSONB,
  is_enabled BOOLEAN, parent_consent_granted BOOLEAN, parent_consent_at TIMESTAMPTZ,
  last_notified_at TIMESTAMPTZ, weekly_report_opted_out BOOLEAN, last_weekly_report_at TIMESTAMPTZ)
```

Required env: `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, client needs `VITE_VAPID_PUBLIC_KEY`

## Weekly Parent Progress Reports

HTML-formatted weekly emails summarizing student progress, sent Mondays at 08:00 UTC.

### Key Files
| File | Role |
|---|---|
| `supabase/functions/send-weekly-report/index.ts` | Generates and sends weekly report emails via Brevo |
| `supabase/functions/unsubscribe-weekly-report/index.ts` | HMAC-SHA256 signed unsubscribe handler |

### Features
- 7-day stats: days practiced, streak count, nodes completed, current level
- Parent-gated opt-in with parental consent requirement
- HMAC-SHA256 signed unsubscribe links (tamper-proof)
- Brevo transactional email API
- 6-day dedup guard via `last_weekly_report_at` column
- Branded HTML email matching consent email template (purple gradient header)

Required env: `CRON_SECRET`, `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`, `WEEKLY_REPORT_HMAC_SECRET`

## Streak Protection System

Prevents frustrating streak loss with grace windows, freezes, weekend pass, and comeback bonuses.

### Architecture
- **Grace Window**: 36 hours from last practice (not midnight cutoff)
- **Streak Freezes**: 0-3 inventory, earned every 7-day milestone, auto-consumed when grace expires
- **Weekend Pass**: Parent-gated toggle in Settings; skips Friday/Saturday (Israeli Shabbat)
- **Comeback Bonus**: When streak breaks, 2x XP multiplier for 3 days

### Key Files
| File | Role |
|---|---|
| `src/services/streakService.js` | Full streak protection logic |
| `src/components/streak/StreakDisplay.jsx` | Streak UI with freeze/grace/comeback states |
| `supabase/migrations/20260305000001_streak_protection.sql` | DB schema |

### Service API
- `getStreak()` — Streak count (backward-compatible)
- `getStreakState()` — Full state object (React Query key: `["streak-state", userId]`)
- `recordPractice()` — Updates streak on practice completion
- `toggleWeekendPass(enabled)` — Parent-gated toggle

### Constants
`GRACE_WINDOW_HOURS = 36`, `MAX_FREEZE_COUNT = 3`, `FREEZE_EARN_INTERVAL = 7`, `COMEBACK_BONUS_DAYS = 3`

## Notes Recognition Engagement

Arcade-style mechanics for `NotesRecognitionGame.jsx`:
- **Combo System**: Correct answers increment combo; wrong answer resets with shake
- **Lives System**: 3 lives per session; 0 lives triggers `GameOverScreen`
- **On-Fire Mode**: Triggered at combo threshold; fire icon + glow effect; respects reduced-motion
- **Auto-Grow Note Pool**: Trail mode combo milestones expand note pool using `getNextNodeInCategory()`; banner notification for new notes

## Achievements System

### Key Files
- `src/pages/Achievements.jsx` — Thin wrapper importing `AchievementsRedesign`
- `src/pages/AchievementsRedesign.jsx` — Animated redesign with Framer Motion, category grouping, neon glow rings for recent unlocks, relative timestamps
- `src/pages/AchievementsLegacy.jsx` — Original display (retained for rollback)
- `src/services/achievementService.js` — Achievement data + icon mappings

## Dashboard Components

- `DailyGoalsCard.jsx` — 3 daily goals with progress bars (refetch every 60s)
- `WeeklySummaryCard.jsx` — Rolling 7-day summary (days practiced, nodes, exercises); golden border for perfect weeks
- `DailyMessageBanner.jsx` — Rotating pool of 12 music fun facts; no repeat from previous day; dismissible via localStorage
- `PlayNextButton.jsx` — "Continue Learning" with next recommended node
- `PushOptInCard.jsx` — Soft notification prompt (7-day delay)
- `XPProgressCard.jsx` + `XPRing.jsx` — XP level display with ring visualization
- `UnifiedStatsCard.jsx` — Combined stats display

## Session Timeout

Automatic inactivity logout for child safety on shared devices.
- `src/contexts/SessionTimeoutContext.jsx` — Provider with `pauseTimer`/`resumeTimer` for games
- `src/hooks/useInactivityTimeout.js` — Core timeout logic with role-based durations
- `src/components/ui/InactivityWarningModal.jsx` — Warning 5 minutes before logout
- Games call `pauseTimer()` during gameplay, `resumeTimer()` when idle

## Orientation & Landscape Lock

- `src/hooks/useLandscapeLock.js` — Android PWA: fullscreen + landscape lock; no-op on iOS/desktop
- `src/hooks/useRotatePrompt.js` — Shows rotate prompt on mobile portrait; permanent dismiss via localStorage
- `src/components/orientation/RotatePromptOverlay.jsx` — Visual overlay
- `src/utils/pwaDetection.js` — `isAndroidDevice()`, `isInStandaloneMode()`

## Audio Infrastructure

- `src/contexts/AudioContextProvider.jsx` — Central `AudioContext` management; iOS Safari interruption detection; provides `useAudioContext()` hook
- `src/hooks/useMicNoteInput.js` — Pitch detection + note-on/off state machine for mic input
- `src/hooks/usePitchDetection.js` — McLeod Pitch Method via `pitchy`; clarity gate 0.9; range A2-C6
- `src/hooks/micInputPresets.js` — Named presets (`sightReading`, `notesRecognition`) + `calcMicTimingFromBpm()`
- `src/components/games/sight-reading-game/hooks/useTimingAnalysis.js` — BPM-adaptive timing windows
- `src/utils/useMotionTokens.js` — Reduced-motion-aware animation tokens for framer-motion

### iOS Safari Hardening
- `src/utils/isIOSSafari.js` — iPad/iPhone detection (excludes Chrome/Firefox/Edge iOS)
- `src/components/games/sight-reading-game/components/MicErrorOverlay.jsx` — Mic error overlay with iOS-specific re-enable guide
- `src/components/games/shared/AudioInterruptedOverlay.jsx` — iOS audio context interruption recovery

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

Vitest with JSDOM. Setup: `src/test/setupTests.js`. Key test files:
- `src/components/games/sight-reading-game/utils/patternBuilder.test.js`
- `src/components/games/sight-reading-game/utils/rhythmGenerator.test.js`

## Security

See `docs/SECURITY_GUIDELINES.md` for comprehensive security patterns including:
- Authorization patterns (user ID verification, relationship-based access)
- Database security (RLS policies, SECURITY DEFINER functions)
- Authentication & JWT handling (DB-based roles, secure logout)
- Service worker security (auth endpoint exclusion)
- Child data protection (COPPA/GDPR-K, PII minimization)
- Defense in depth patterns
- Security implementation checklist

### Key Security Files
- `public/sw.js` — Auth exclusion patterns
- `src/services/authService.js` — Secure logout with localStorage cleanup
- `src/services/scoreService.js` — Authorization checks
- `src/services/teacherService.js` — Relationship verification
- `src/config/subscriptionConfig.js` — Free tier boundary (syncs with Postgres `is_free_node()`)
