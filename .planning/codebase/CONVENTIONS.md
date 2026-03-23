# Coding Conventions

**Analysis Date:** 2026-03-23

## Language & File Extensions

**Primary:** JavaScript (ES2020+) with JSX -- `.js` for utilities/services/hooks, `.jsx` for React components.

No TypeScript is used. The project name references TypeScript (`vite-react-typescript-starter`) but the codebase is pure JavaScript.

## Naming Patterns

**Files:**
- React components: PascalCase `.jsx` -- `VictoryScreen.jsx`, `TrailNode.jsx`, `GameOverScreen.jsx`
- Hooks: camelCase with `use` prefix -- `useAudioEngine.js`, `usePitchDetection.js`, `useRotatePrompt.js`
- Services: camelCase with `api` or descriptive prefix -- `apiScores.js`, `apiAuth.js`, `streakService.js`, `subscriptionService.js`
- Utilities: camelCase -- `xpSystem.js`, `pwaDetection.js`, `isIOSSafari.js`
- Contexts: PascalCase with `Context` suffix -- `AccessibilityContext.jsx`, `SubscriptionContext.jsx`
- Constants/data: camelCase -- `skillTrail.js`, `constants.js`, `expandedNodes.js`, `nodeTypes.js`
- Trail unit data files: camelCase with unit + category + `Redesigned` suffix -- `trebleUnit1Redesigned.js`, `rhythmUnit7Redesigned.js`
- Test files: `{name}.test.{js,jsx}` co-located or in `__tests__/` directories
- Locale files: lowercase `common.json`, `trail.json` inside `locales/{lang}/`

**Functions:**
- React components: PascalCase -- `function Dashboard()`, `function TrailNode()`
- Hooks: camelCase with `use` prefix -- `useUser()`, `useAudioEngine()`, `useMicNoteInput()`
- Service functions: camelCase, verb-first -- `getStudentScores()`, `updateStudentScore()`, `fetchSubscriptionStatus()`
- Helpers/utilities: camelCase -- `getCalendarDate()`, `hoursSince()`, `computeValidSignature()`
- Event handlers: camelCase with `handle` prefix -- `handleClick()`, `handleExit()`, `handlePlayAgain()`
- Private/internal helpers: underscore prefix -- `_calculateStarsFromPercentage()`

**Variables:**
- camelCase for all local variables and state: `const [isOpen, setIsOpen]`, `const nodeState`, `const bestScore`
- Boolean state: `is` prefix -- `isLoading`, `isPlaying`, `isInitialized`, `isPremium`, `isRTL`
- Refs: camelCase with `Ref` suffix -- `audioContextRef`, `gainNodeRef`, `hasAutoStartedRef`
- Constants (module-level): SCREAMING_SNAKE_CASE -- `GRACE_WINDOW_HOURS`, `MAX_FREEZE_COUNT`, `FETCH_COOLDOWN_MS`
- Unused variables from destructuring: underscore prefix -- `const { reducedMotion: _reducedMotion } = useAccessibility()`

**Constants Objects:**
- Enum-like objects: SCREAMING_SNAKE_CASE keys inside SCREAMING_SNAKE_CASE object:
  ```javascript
  export const NODE_CATEGORIES = {
    TREBLE_CLEF: 'treble_clef',
    BASS_CLEF: 'bass_clef',
    RHYTHM: 'rhythm',
    BOSS: 'boss'
  };
  ```

**React Query Keys:**
- Kebab-case strings in arrays: `["subscription", userId]`, `["streak-state", userId]`, `["scores"]`, `["user"]`

## Export Patterns

**Pages:** Use `export default` -- either inline (`export default function PracticeModes()`) or at bottom (`export default AppSettings;`). Mixed patterns exist but default exports are universal for pages. Lazy-loaded in `src/App.jsx`.

**Components:** Mixed pattern -- some use named export (`export function GameModeGrid()`), some use both named + default:
```javascript
export function SettingsSection({ ... }) { }
export default SettingsSection;
```
Game components tend to use named exports: `export function NotesRecognitionGame()`, `export function MemoryGame()`. These are imported in `App.jsx` via `.then(m => ({ default: m.NamedExport }))` for lazy loading.

**Services:** Two patterns coexist:
1. Named exports for individual functions (most common): `export async function fetchSubscriptionStatus()`, `export async function getStudentScores()`
2. Object-as-default for service modules: `export const streakService = { ... }`

**Hooks:** Always named exports: `export function useUser()`, `export const useAudioEngine = () => { }`

**Contexts:** Named exports for Provider and hook: `export function SubscriptionProvider()`, `export function useAccessibility()`

**Preferred pattern for new code:**
- Pages: `export default function PageName()`
- Components: Named export `export function ComponentName()` (add `export default` only if needed for lazy loading)
- Services: Named exports for functions
- Hooks: Named exports

## Code Style

**Formatting (Prettier):**
- Config: `.prettierrc`
- Semicolons: **yes** (`"semi": true`)
- Quotes: **double** (`"singleQuote": false`)
- Trailing commas: **ES5** (`"trailingComma": "es5"`)
- Print width: **80**
- Tab width: **2 spaces**
- Arrow parens: **always** (`"arrowParens": "always"`)
- End of line: **LF**
- Plugin: `prettier-plugin-tailwindcss` (auto-sorts Tailwind classes)

**Linting (ESLint):**
- Config: `eslint.config.js` (flat config, ESLint 9)
- Plugins: `react`, `react-hooks`, `react-refresh`
- Key rules:
  - `react/react-in-jsx-scope`: off (React 18 auto-import)
  - `react/prop-types`: off (no PropTypes used)
  - `no-unused-vars`: warn (with `argsIgnorePattern: "^_"`, `varsIgnorePattern: "^_"`)
  - `no-undef`: warn
  - `react-refresh/only-export-components`: warn (with `allowConstantExport: true`)
- Special file overrides:
  - Test files: vitest + node globals enabled
  - Config files: node globals enabled
  - Specific src files using `process.env`: `process` declared as readonly global
  - `public/sw.js`: serviceworker globals enabled

**Pre-commit hooks (Husky + lint-staged):**
- `*.{js,jsx,ts,tsx}`: eslint --fix + prettier --write
- `*.{json,css,md}`: prettier --write

## Import Organization

**Order (observed convention, not enforced by tool):**
1. React core (`react`, `react-dom`)
2. React ecosystem (`react-router-dom`, `react-i18next`, `@tanstack/react-query`)
3. Third-party libraries (`framer-motion`, `lucide-react`, `react-hot-toast`)
4. Internal services/utilities (`../../services/`, `../../utils/`)
5. Internal hooks (`../../hooks/`, `../../features/`)
6. Internal contexts (`../../contexts/`)
7. Internal components (`../../components/`, `../`)
8. Internal data (`../../data/`)
9. Assets (`../../assets/`)
10. CSS (only in `main.jsx`)

**Path Aliases:** None configured. All imports use relative paths (`../../services/apiAuth`, `../../../hooks/usePitchDetection`).

**SVG imports:** Two patterns depending on usage:
- As React component (inline SVG): `import FlameIcon from '../../assets/icons/fire.svg?react'` -- the `?react` suffix is required (via vite-plugin-svgr)
- As URL string (for `<img src>` or CSS): `import metronomeSvg from '../../../assets/icons/metronome.svg'` -- no suffix

**Example from `Dashboard.jsx`:**
```javascript
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useScores } from "../../features/userData/useScores";
import { useUser } from "../../features/authentication/useUser";
import { useQuery } from "@tanstack/react-query";
import { streakService } from "../../services/streakService";
import { Bell, X, Mic, Piano } from "lucide-react";
import DailyGoalsCard from "../dashboard/DailyGoalsCard";
```

## Component Patterns

**Functional components only.** The sole class component is `ErrorBoundary` (`src/components/ErrorBoundary.jsx`) which requires the `componentDidCatch` lifecycle method. All other components are functional.

**Props destructuring:** Always destructure in function signature:
```javascript
const TrailNode = ({ node, progress, isUnlocked, isCompleted, isCurrent, onClick }) => {
```

**Default props:** Use default parameter values, not `defaultProps`:
```javascript
const VictoryScreen = ({ score, nodeId = null, exerciseIndex = null, onNextExercise = null }) => {
```

**Component declaration styles:**
- Arrow functions: `const TrailNode = ({ ... }) => { }` (common for internal components)
- Function declarations: `function Dashboard() { }` (common for pages and top-level components)
- Both are acceptable; be consistent within a file.

**Hooks at top of component body.** State hooks, then derived hooks, then effects:
```javascript
function Dashboard() {
  const { user, isTeacher, isStudent } = useUser();
  const { isPremium } = useSubscription();
  const { t, i18n } = useTranslation(["common", "trail"]);
  const isRTL = i18n.dir() === "rtl";
  const { reducedMotion } = useAccessibility();
  // ...effects below
}
```

**Lazy loading pattern:** Pages and game components are lazy-loaded in `src/App.jsx`:
```javascript
const TrailMapPage = React.lazy(() => import("./pages/TrailMapPage"));
// For named exports:
const SightReadingGame = React.lazy(() =>
  import("./components/games/sight-reading-game/SightReadingGame")
    .then(m => ({ default: m.SightReadingGame }))
);
```

**Auto-start pattern for trail games:** All four game components use a `hasAutoStartedRef` to auto-start when entered from the trail:
```javascript
const hasAutoStartedRef = useRef(false);
useEffect(() => {
  if (location.state?.nodeId && !hasAutoStartedRef.current) {
    hasAutoStartedRef.current = true;
    // auto-start game with trail config
  }
}, [location.state]);
```

## State Management Patterns

**React Query (TanStack Query v5) for server state:**
- Wrap Supabase calls in service functions (`src/services/`)
- Create feature hooks in `src/features/` that use `useQuery`/`useMutation`
- Standard `staleTime`: 5 minutes for auth, 0 for subscriptions (Realtime handles push)
- `refetchOnWindowFocus: false` for subscriptions (Realtime channel handles invalidation)
- Invalidate related queries on mutation success:
  ```javascript
  onSuccess: async () => {
    await Promise.all([
      queryClient.invalidateQueries(["scores"]),
      queryClient.invalidateQueries(["point-balance", studentId]),
    ]);
  }
  ```
- Custom retry logic for network resilience:
  ```javascript
  retry: (failureCount, error) => {
    if (isNetworkError) return false;
    return failureCount < 1;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  ```

**React Context for feature-scoped state:**
- Pattern: Create context + reducer/state + provider + hook in one file
- Export both `Provider` and `useXyz()` hook
- Contexts in `src/contexts/`:
  - `AccessibilityContext.jsx` -- useReducer with action constants
  - `SubscriptionContext.jsx` -- React Query + Realtime subscription
  - `SettingsContext.jsx` -- useState + Supabase persistence
  - `AudioContextProvider.jsx` -- shared AudioContext + AnalyserNode
  - `SightReadingSessionContext.jsx` -- game session state
  - `SessionTimeoutContext.jsx` -- inactivity logout
  - `ModalContext.jsx` -- global modal management

**Redux Toolkit:** Only for `rhythmReducer` via `src/store.js`. Do not add new Redux slices; prefer Context or React Query.

**localStorage for persistence:**
- User preferences: `sightReadingInputMode`, `rotatePromptDismissed`, `accessibility-settings`
- Migration flags: `xp_migration_complete`
- Always namespaced per user where security matters

## Error Handling

**Services:** Try-catch with console.error, then re-throw with user-friendly message:
```javascript
export async function getStudentScores(studentId) {
  await verifyStudentDataAccess(studentId);  // Authorization first
  try {
    const { data, error } = await supabase.from("students_score").select("*")...;
    if (error) throw error;
    return { scores: data || [] };
  } catch (error) {
    console.error("Error fetching scores:", error);
    throw new Error("Failed to fetch scores");
  }
}
```

**Supabase calls:** Always check `error` from Supabase response before using `data`:
```javascript
const { data, error } = await supabase.from("table").select("*");
if (error) throw error;
return data || [];
```

**React Query error handling:** Use `onError` callback with `toast.error()`:
```javascript
onError: (error) => {
  console.error(error);
  toast.error("Failed to update score");
}
```

**Graceful degradation:** Services return safe defaults on error rather than crashing:
```javascript
if (error || !data) return { isPremium: false };  // Safe default
```

**Network resilience:** Services implement cooldown/dedup for Supabase calls to prevent hammering DB on network errors:
```javascript
const FETCH_COOLDOWN_MS = 60 * 1000;
let lastFetchFailed = false;
let lastFailureTS = 0;
```

**ErrorBoundary:** Wraps the app in `src/components/ErrorBoundary.jsx`. Uses Sentry for error capture:
```javascript
componentDidCatch(error, errorInfo) {
  Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } });
}
```

**Sentry integration:** `src/services/sentryService.js` -- production-only, no PII (`sendDefaultPii: false`), low sample rate (0.1). Export `{ Sentry }` for explicit `captureException` calls.

## Authorization Pattern (Defense in Depth)

**Always verify data access before Supabase calls:**
```javascript
import { verifyStudentDataAccess } from './authorizationUtils';

export async function getStudentScores(studentId) {
  await verifyStudentDataAccess(studentId);  // Throws if unauthorized
  // ... Supabase query
}
```

Use `verifyStudentDataAccess(studentId)` from `src/services/authorizationUtils.js` for student-scoped data. This supplements RLS policies. Verifies:
- Students can only access their own data (`user.id === studentId`)
- Teachers can access connected students' data (via `teacher_student_connections`)

**Rate limiting:** `src/services/rateLimitService.js` wraps a DB function (`check_rate_limit`) to prevent XP farming. Called before score submissions with trail `nodeId`.

## i18n Conventions

**Framework:** i18next + react-i18next
**Config:** `src/i18n/index.js`
**Languages:** English (`en`), Hebrew (`he`)
**Namespaces:** `common` (default), `trail`
**Locale files:** `src/locales/{lang}/{namespace}.json`

**Usage in components:**
```javascript
const { t, i18n } = useTranslation("common");  // Single namespace
const { t, i18n } = useTranslation(["common", "trail"]);  // Multiple namespaces
const isRTL = i18n.dir() === "rtl";
```

**RTL handling:**
- Compute direction: `const isRTL = i18n.dir() === "rtl"`
- Flip arrow icons: `const Arrow = isRTL ? ArrowRight : ArrowLeft`
- Hebrew uses `font-hebrew` (Heebo, Assistant) font family from `tailwind.config.js`
- Separators change in RTL: ampersands replaced with commas (see `src/utils/translateNodeName.js`)

**Key naming:** Dot-separated, camelCase segments:
```
"games.gameOver.livesLost"
"dailyGoals.goals.completeExercises.name"
"pages.settings.feedback.sendFeedback"
"sightReading.startPlaying"
```

**Node name translation:** `src/utils/translateNodeName.js` translates trail node names with fallback chain: full node translation -> note-by-note translation -> original name.

**i18n detection order:** localStorage -> navigator -> htmlTag (caches to localStorage).

## Tailwind CSS Conventions

**Glassmorphism card pattern (primary for all pages on purple gradient background):**
```jsx
<div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg">
```

**Background gradient (set in AppLayout):**
```
bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900
```

**Nested elements:** Use `bg-white/5 border-white/10` or `bg-white/10 border-white/20`

**Text colors on glass backgrounds:**
- Primary: `text-white`
- Secondary: `text-white/70`
- Tertiary: `text-white/60`
- Accent values: `-300` variants (`text-indigo-300`, `text-green-300`)

**Responsive:** Mobile-first (`sm:`, `md:`, `lg:` breakpoints). Common pattern: `p-3 sm:p-4` or `text-lg sm:text-xl`.

**Custom design system tokens:** CSS custom properties defined in `src/index.css` and consumed via `tailwind.config.js`:
- Colors: `--color-primary-*`, `--color-surface-*`, `--glass-bg`, `--glass-border`
- Spacing: `--spacing-xs` through `--spacing-3xl`
- Radii: `--radius-xs` through `--radius-full`
- Shadows: `--shadow-sm` through `--shadow-2xl`
- Z-indices: `--z-dropdown`, `--z-modal`, `--z-toast`

**Animation utilities:** Custom keyframes in `tailwind.config.js` (`celebration`, `floatUp`, `shimmer`, `fadeIn`, `wiggle`). Use framer-motion for complex animations, Tailwind utilities for simple ones.

**Accessibility:** `min-h-touch` (44px) / `min-w-touch` for touch targets. Use `aria-label`, `aria-expanded` on interactive elements.

**Legacy card classes (in `src/index.css`):**
- `.card` = `bg-white/80 border-gray-200` -- avoid on purple bg pages
- `.card-glass-legacy` = `bg-white/10 backdrop-blur-md border-white/20` -- matches glass pattern

## Logging

**Framework:** `console.error`, `console.warn`, `console.log` (native console)
- `console.error`: For caught errors in services
- `console.warn`: For non-critical warnings (e.g., missing migration, failed settings load)
- Debug logging gated by module-level constants or `process.env.NODE_ENV === "development"`

**User-facing notifications:** `react-hot-toast` via `toast.error()`, `toast.success()`

## Comments

**JSDoc on exported service functions:**
```javascript
/**
 * Calculate stars based on score percentage
 * @param {number} percentage - Score percentage (0-100)
 * @returns {number} Stars earned (0-3)
 */
```

**Section separators in large service files:**
```javascript
// ============================================================
// Constants
// ============================================================
```

**Architecture decision references:** Inline references to design doc identifiers:
```javascript
// Phase 09 (IOS-01): onstatechange on AudioContext detects 'interrupted' state
// AUDIO-01: getUserMedia disables echoCancellation, noiseSuppression
// ALGO-02: Minimum McLeod clarity score
```

**Component docblocks:** Brief description at top of file:
```javascript
/**
 * TrailNode Component
 * Displays a single node on the skill trail map with game-like visual styling
 * States: locked, available, in-progress, completed
 */
```

**Unit data files:** Educational context in header comments:
```javascript
/**
 * Rhythm Unit 7: "Big Beats" (Redesigned)
 * - Introduces: 6/8 compound meter (two big beats per bar)
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 7 nodes: Discovery -> Practice -> Discovery -> Practice -> Mix-Up -> Speed -> Mini-Boss
 * Duration: 25-30 minutes (3-4 min per node)
 */
```

## Module Design

**Services:** One file per domain (e.g., `streakService.js`, `subscriptionService.js`, `dailyGoalsService.js`). Export individual functions or a service object. All live in `src/services/`.

**Hooks:** One hook per file. Prefix `use`. Keep in `src/hooks/` for app-wide hooks, in `src/features/{feature}/hooks/` for feature-scoped hooks (e.g., `src/features/games/hooks/useGameSettings.js`).

**Contexts:** One context per file in `src/contexts/`. Contains provider + consumer hook. Names: `{Feature}Context.jsx`.

**Data/Constants:** Static trail definitions in `src/data/`. Unit files in `src/data/units/`. Configuration in `src/config/`. Node type enums in `src/data/nodeTypes.js`, exercise type enums in `src/data/constants.js`.

**No barrel files.** Each import points to the specific file. No `index.js` re-exports anywhere in `src/`.

## Supabase Client Pattern

**Single client instance:** `src/services/supabase.js` creates and exports one `supabase` client. All services import it:
```javascript
import supabase from "./supabase";
```

**Query pattern:** Chain `.from().select().eq()...` with destructured `{ data, error }`:
```javascript
const { data, error } = await supabase
  .from('student_skill_progress')
  .select('*')
  .eq('student_id', studentId)
  .eq('node_id', nodeId)
  .maybeSingle();
if (error) throw error;
return data || null;
```

**Realtime subscriptions:** Used in context providers for live updates:
```javascript
const channel = supabase
  .channel(`subscription-changes-${userId}`)
  .on("postgres_changes", { event: "*", schema: "public", table: "parent_subscriptions", filter: `student_id=eq.${userId}` }, () => {
    queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
  })
  .subscribe();
```

**Environment variables:** Access via `import.meta.env.VITE_*` (Vite convention). Never use `process.env` in client code except for `NODE_ENV` checks.

## VexFlow Usage

**Import:** `import { Renderer, Stave, StaveNote, Beam, Formatter } from "vexflow"`
- One `Stave` per measure (bar)
- SVG backend: `new Renderer(div, Renderer.Backends.SVG)`
- Automatic beaming: `Beam.generateBeams(notes)` with custom beam groups for compound meters
- Key strings: `"pitch/octave"` format (e.g., `'c/4'`, `'eb/4'`)
- Duration codes: `'w'`, `'h'`, `'q'`, `'8'`, `'16'`, `'qr'` (r = rest)

## Game Session Flow Pattern

All games follow this session model:
1. **Pre-game setup:** `UnifiedGameSettings` component or game-specific setup
2. **Session state:** `idle` -> `in-progress` -> `complete`
3. **Exercise tracking:** configurable exercises per session with scoring
4. **Feedback:** Real-time pitch/rhythm accuracy via mic or keyboard
5. **Result:** `VictoryScreen` (stars + XP + trail progress) or `GameOverScreen` (lives/time/score variants)

**Trail integration via location.state:**
```javascript
const { nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType } = location.state || {};
```

---

*Convention analysis: 2026-03-23*
