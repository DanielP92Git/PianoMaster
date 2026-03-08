# Coding Conventions

**Analysis Date:** 2026-03-08

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
- Constants/data: camelCase -- `skillTrail.js`, `constants.js`, `expandedNodes.js`
- Test files: `{name}.test.{js,jsx}` co-located or in `__tests__/` directories
- Locale files: lowercase `common.json`, `trail.json` inside `locales/{lang}/`

**Functions:**
- React components: PascalCase -- `function Dashboard()`, `function TrailNode()`
- Hooks: camelCase with `use` prefix -- `useUser()`, `useAudioEngine()`, `useMicNoteInput()`
- Service functions: camelCase, verb-first -- `getStudentScores()`, `updateStudentScore()`, `fetchSubscriptionStatus()`
- Helpers/utilities: camelCase -- `getCalendarDate()`, `hoursSince()`, `computeValidSignature()`
- Event handlers: camelCase with `handle` prefix -- `handleClick()`, `handleExit()`, `handlePlayAgain()`

**Variables:**
- camelCase for all local variables and state: `const [isOpen, setIsOpen]`, `const nodeState`, `const bestScore`
- Boolean state: `is` prefix -- `isLoading`, `isPlaying`, `isInitialized`, `isPremium`, `isRTL`
- Refs: camelCase with `Ref` suffix -- `audioContextRef`, `gainNodeRef`, `hasAutoStartedRef`
- Constants (module-level): SCREAMING_SNAKE_CASE -- `GRACE_WINDOW_HOURS`, `MAX_FREEZE_COUNT`, `FETCH_COOLDOWN_MS`

**Constants Objects:**
- Enum-like objects: SCREAMING_SNAKE_CASE keys inside SCREAMING_SNAKE_CASE object:
  ```javascript
  export const GOAL_TYPES = {
    COMPLETE_EXERCISES: 'complete_exercises',
    EARN_THREE_STARS: 'earn_three_stars',
  };
  ```

**React Query Keys:**
- Kebab-case strings in arrays: `["subscription", userId]`, `["streak-state", userId]`, `["scores"]`, `["user"]`

## Export Patterns

**Pages:** Use `export default` -- either inline (`export default function PracticeModes()`) or at bottom (`export default AppSettings;`). Mixed patterns exist but default exports are universal for pages.

**Components:** Mixed pattern -- some use named export (`export function GameModeGrid()`), some use both named + default:
```javascript
export function SettingsSection({ ... }) { }
export default SettingsSection;
```
Game components tend to use named exports: `export function NotesRecognitionGame()`, `export function MemoryGame()`.

**Services:** Two patterns coexist:
1. Named exports for individual functions (most common): `export async function fetchSubscriptionStatus()`, `export async function getStudentScores()`
2. Object-as-default for service modules: `export const streakService = { ... }`, `export default { fetchSubscriptionStatus, ... }`

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
  - `no-unused-vars`: warn
  - `no-undef`: warn
  - `react-refresh/only-export-components`: warn

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

**Example from `Dashboard.jsx`:**
```javascript
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useScores } from "../../features/userData/useScores";
import { useUser } from "../../features/authentication/useUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { streakService } from "../../services/streakService";
import { Bell, X, Mic, Piano } from "lucide-react";
import DailyGoalsCard from "../dashboard/DailyGoalsCard";
```

## Component Patterns

**Functional components only.** No class components anywhere.

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
  // ...effects below
}
```

## State Management Patterns

**React Query for server state:**
- Wrap Supabase calls in service functions (`src/services/`)
- Create feature hooks in `src/features/` that use `useQuery`/`useMutation`
- Standard `staleTime`: 5 minutes for auth, 3 minutes for scores, 0 for subscriptions
- Invalidate related queries on mutation success:
  ```javascript
  onSuccess: async () => {
    await Promise.all([
      queryClient.invalidateQueries(["scores"]),
      queryClient.invalidateQueries(["point-balance", studentId]),
    ]);
  }
  ```

**React Context for feature-scoped state:**
- Pattern: Create context + reducer + provider + hook in one file
- Export both `Provider` and `useXyz()` hook
- Example: `AccessibilityContext.jsx`, `SubscriptionContext.jsx`

**Redux Toolkit:** Only for `rhythmReducer.jsx`. Do not add new Redux slices; prefer Context or React Query.

**localStorage for persistence:**
- User preferences: `sightReadingInputMode`, `rotatePromptDismissed`
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
if (error || !data) return fallbackValue;
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

**Network resilience:** Services implement cooldown/dedup for Supabase calls:
```javascript
const FETCH_COOLDOWN_MS = 60 * 1000;
let lastFetchFailed = false;
let lastFailureTS = 0;
```

## Authorization Pattern (Defense in Depth)

**Always verify data access before Supabase calls:**
```javascript
import { verifyStudentDataAccess } from './authorizationUtils';

export async function getStudentScores(studentId) {
  await verifyStudentDataAccess(studentId);  // Throws if unauthorized
  // ... Supabase query
}
```

Use `verifyStudentDataAccess(studentId)` from `src/services/authorizationUtils.js` for student-scoped data. This supplements RLS policies.

## i18n Conventions

**Framework:** i18next + react-i18next
**Config:** `src/i18n/index.js`
**Languages:** English (`en`), Hebrew (`he`)
**Namespaces:** `common` (default), `trail`
**Locale files:** `src/locales/{lang}/{namespace}.json`

**Usage in components:**
```javascript
const { t, i18n } = useTranslation("common");  // or useTranslation(["common", "trail"])
const isRTL = i18n.dir() === "rtl";
```

**RTL handling:** Components accept `isRTL` prop or compute it from `i18n.dir()`. Flex direction flips with `flex-row-reverse` conditionally.

**Key naming:** Dot-separated, camelCase segments: `"games.gameOver.livesLost"`, `"dailyGoals.goals.completeExercises.name"`

## Tailwind CSS Conventions

**Glassmorphism card pattern (primary for all inner pages):**
```jsx
<div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg">
```

**Nested elements:** Use `bg-white/5 border-white/10` or `bg-white/10 border-white/20`

**Text colors on glass backgrounds:**
- Primary: `text-white`
- Secondary: `text-white/70`
- Tertiary: `text-white/60`
- Accent values: `-300` variants (`text-indigo-300`, `text-green-300`)

**Responsive:** Mobile-first (`sm:`, `md:`, `lg:` breakpoints). Many components use `p-3 sm:p-4` or `text-lg sm:text-xl` pattern.

**Animation utilities:** Custom keyframes in `tailwind.config.js` (`celebration`, `floatUp`, `shimmer`, `fadeIn`, `wiggle`). Use framer-motion for complex animations, Tailwind utilities for simple ones.

**Accessibility:** `min-h-touch` (44px) / `min-w-touch` for touch targets. Use `aria-label`, `aria-expanded` on interactive elements.

## Logging

**Framework:** `console.error`, `console.warn`, `console.log` (native console)
- `console.error`: For caught errors in services
- `console.warn`: For non-critical warnings (e.g., failed sign-out after token error)
- Debug logging gated by module-level constants: `const METRONOME_TIMING_DEBUG = false;`

**User-facing notifications:** `react-hot-toast` via `toast.error()`, `toast.success()`

## Comments

**JSDoc on exported service functions:**
```javascript
/**
 * Fetch subscription status for the authenticated student.
 * @param {string|null} studentId - The UUID of the authenticated student
 * @returns {Promise<{ isPremium: boolean }>}
 */
```

**Section separators in large service files:**
```javascript
// ============================================================
// Constants
// ============================================================
```

**Inline comments for non-obvious logic:**
```javascript
// Active OR (cancelled + period not ended) OR (past_due + 3-day grace)
```

**Component docblocks:** Brief description at top of file:
```javascript
/**
 * TrailNode Component
 * Displays a single node on the skill trail map with game-like visual styling
 * States: locked, available, in-progress, completed
 */
```

## Module Design

**Services:** One file per domain (e.g., `streakService.js`, `subscriptionService.js`, `dailyGoalsService.js`). Export individual functions or a service object.

**Hooks:** One hook per file. Prefix `use`. Keep in `src/hooks/` for app-wide hooks, in `src/features/{feature}/hooks/` for feature-scoped hooks.

**Contexts:** One context per file in `src/contexts/`. Contains provider + consumer hook. Names: `{Feature}Context.jsx`.

**Data/Constants:** Static definitions in `src/data/`. Configuration in `src/config/`.

**No barrel files.** Each import points to the specific file. No `index.js` re-exports.

---

*Convention analysis: 2026-03-08*
