# Codebase Concerns

**Analysis Date:** 2026-03-08

## Tech Debt

**No Code Splitting (Critical Bundle Size):**
- Issue: The entire application is eagerly imported in `src/App.jsx` with zero `React.lazy()` or dynamic `import()` usage. All 30+ routes, all 4 game components, teacher dashboard, and all services are bundled into a single chunk.
- Files: `src/App.jsx` (lines 1-62, all static imports)
- Impact: Main JS bundle is **3,946 KB** (1,291 KB gzipped). Vite warns about chunks >500 KB. First-load performance is severely degraded, especially on mobile devices (the primary target: 8-year-olds on tablets).
- Fix approach: Add `React.lazy()` + `Suspense` for route-level code splitting. Minimum viable split:
  - Game components: `SightReadingGame`, `NotesRecognitionGame`, `MetronomeTrainer`, `MemoryGame`
  - Teacher dashboard: `TeacherDashboard`
  - Secondary pages: `Achievements`, `PracticeSessions`, `Avatars`, `SubscribePage`, `ParentPortalPage`
  - Trail page: `TrailMapPage`

**Massive Piano Sound Assets in Source Tree:**
- Issue: 90 WAV files totaling **433 MB** are committed to git under `src/assets/sounds/piano/`. Individual files range from 1-6 MB each. These are imported via dynamic `import()` in `NotesRecognitionGame.jsx` (lines 42-80+) which creates ~90 tiny wrapper JS chunks in the build output.
- Files: `src/assets/sounds/piano/*.wav` (90 files, 433 MB), `src/components/games/notes-master-games/NotesRecognitionGame.jsx`
- Impact: Git clone is enormous. Build output (`dist/`) is **275 MB**. Deployment bandwidth is wasted. Not gitignored.
- Fix approach: Move WAV files to Supabase Storage or a CDN. Load on demand via URL rather than bundling. Use compressed formats (OGG/MP3) instead of WAV.

**God Components (SightReadingGame, NotesRecognitionGame):**
- Issue: `SightReadingGame.jsx` is **3,737 lines** with 26 `useState` calls and 40 `useRef` calls. `NotesRecognitionGame.jsx` is **2,756 lines** with 91 hook calls. These files are extremely difficult to maintain, test, or review.
- Files:
  - `src/components/games/sight-reading-game/SightReadingGame.jsx` (3,737 lines)
  - `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (2,756 lines)
  - `src/components/layout/TeacherDashboard.jsx` (2,713 lines)
  - `src/components/games/shared/UnifiedGameSettings.jsx` (2,292 lines)
  - `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` (1,729 lines)
  - `src/components/games/rhythm-games/MetronomeTrainer.jsx` (1,437 lines)
- Impact: Hard to isolate bugs, high risk of regressions, contributes to 41 `react-hooks/exhaustive-deps` warnings. The `useVictoryState` hook (713 lines at `src/hooks/useVictoryState.js`) was extracted from VictoryScreen but similar extraction has not been done for game components.
- Fix approach: Extract custom hooks for each game phase (setup, gameplay, scoring, feedback). Move state machines into dedicated hooks. Each game component should ideally be <500 lines orchestrating extracted hooks.

**ESLint: 23 Errors + 442 Warnings (465 total):**
- Issue: Lint health has degraded from the known pre-v1.4 baseline (24 errors, 415 warnings) to 23 errors and 442 warnings. The warning count has increased by 27.
- Files: Spread across the codebase. Breakdown:
  - **177 `no-unused-vars`** warnings (unused imports, destructured variables) — across most files
  - **41 `react-hooks/exhaustive-deps`** warnings — concentrated in game components
  - **~150 `no-undef`** warnings in test files (`vi`, `expect`, `it`, `describe` not recognized — missing ESLint test environment config)
  - **17 `react-refresh/only-export-components`** — files mixing component and non-component exports
  - **5 `no-empty`** errors — empty catch/if blocks in `src/features/games/hooks/useGameTimer.js`, `src/hooks/useStreakWithAchievements.js`, `src/services/audioCacheService.js`, `src/services/practiceService.js`
- Impact: Real bugs hide among noise. The `exhaustive-deps` warnings in game components may cause stale closure bugs.
- Fix approach:
  1. Add Vitest globals to ESLint config to eliminate ~150 test `no-undef` warnings
  2. Run `eslint --fix` to auto-fix the 1 fixable error and 2 fixable warnings
  3. Batch-remove unused imports (177 warnings)
  4. Audit and fix `exhaustive-deps` warnings in game components (some are intentional suppression, some are real issues)

**Duplicate Star Calculation Functions:**
- Issue: The `calculateStars(percentage)` function (95%=3, 80%=2, 60%=1, 0=0) is duplicated in multiple files with identical logic.
- Files:
  - `src/hooks/useVictoryState.js` (line 66, as `calculateStars`)
  - `src/services/skillProgressService.js` (line 18, as `calculateStarsFromPercentage`)
- Impact: If star thresholds change, both must be updated. Easy to miss one.
- Fix approach: Create a single `calculateStars` utility in `src/utils/` and import it in both locations.

**Debug Instrumentation Left in Production Code:**
- Issue: `SightReadingGame.jsx` contains a debug logging system that sends data to a hardcoded localhost endpoint (`http://127.0.0.1:7242/ingest/636d1c48-b2ea-491c-896a-7ce448793071`). While gated behind `VITE_DEBUG_SR_LOGS`, the endpoint URL and UUID are baked into the production bundle.
- Files: `src/components/games/sight-reading-game/SightReadingGame.jsx` (lines 52-70)
- Impact: Leaks internal tooling details in production JS. The fetch calls silently fail but still execute.
- Fix approach: Wrap the entire debug block in `if (import.meta.env.DEV)` so it is tree-shaken from production builds.

**Empty Function Bodies in Error Handlers:**
- Issue: Several catch blocks and callbacks are empty, silently swallowing errors or leaving debug stubs.
- Files:
  - `src/features/games/hooks/useGameTimer.js` (lines 16-18): Empty `if`/`else` blocks in debug logger
  - `src/hooks/useStreakWithAchievements.js` (lines 34-41): Empty bodies in achievement notification callbacks (no toast shown despite comment "Optionally show toast")
  - `src/services/audioCacheService.js` (line 235): Empty catch block
  - `src/services/practiceService.js` (line 229): Empty catch block
- Impact: Errors are silently swallowed. Achievement notifications are not shown to users despite being fetched.
- Fix approach: Either implement the intended behavior or add explicit `// intentionally empty` comments. For `useStreakWithAchievements`, implement the toast notifications.

## Known Bugs

**React Hook Called Conditionally (TrailNodeModal):**
- Symptoms: ESLint `react-hooks/rules-of-hooks` error. The component has `if (!node) return null;` on line 117 followed by `useEffect` on line 122. This violates React's rules of hooks.
- Files: `src/components/trail/TrailNodeModal.jsx` (lines 117, 122)
- Trigger: When `node` prop is null/undefined, the early return skips the `useEffect` call, causing hooks to be called in different order across renders.
- Workaround: Currently works because the modal is typically only rendered when `node` is truthy, but this is a ticking time bomb.
- Fix: Move the early return below all hook calls, or guard inside the `useEffect` body instead.

**Failing Test: SightReadingGame.micRestart.test.jsx:**
- Symptoms: Test suite has 1 failing test (89/90 passing). Error: "useAudioContext must be used inside AudioContextProvider" at line 177 of `SightReadingGame.jsx`.
- Files: `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx`
- Trigger: The test renders `SightReadingGame` without wrapping it in `AudioContextProvider`.
- Workaround: None — this test fails on every run.
- Fix: Add `AudioContextProvider` to the test's render wrapper, or mock `useAudioContext`.

**fetchpriority Attribute Casing:**
- Symptoms: ESLint error: "Unknown property 'fetchpriority' found, use 'fetchPriority' instead".
- Files: `src/components/layout/Dashboard.jsx` (line 557)
- Trigger: React expects `fetchPriority` (camelCase) but the code uses lowercase `fetchpriority`.
- Fix: Change to `fetchPriority="high"`.

## Security Considerations

**syncPracticeSessions Stub in Service Worker:**
- Risk: The `sync` event handler at `public/sw.js` (line 320-326) calls `syncPracticeSessions()` which is a no-op stub (lines 580-588). If background sync is triggered, practice session data accumulated offline is lost.
- Files: `public/sw.js` (lines 320-326, 580-588)
- Current mitigation: Background sync is rarely triggered since the app primarily works online.
- Recommendations: Either implement proper offline sync with IndexedDB queueing, or remove the sync event listener to avoid false expectations.

**OrientationController Falls Back to user_metadata:**
- Risk: `src/App.jsx` `OrientationController` component (lines 186-192) falls through to `user?.user_metadata?.role` and `user?.app_metadata?.role` when deriving role. While this is only used for orientation locking (not authorization), it sets a bad pattern.
- Files: `src/App.jsx` (lines 186-192)
- Current mitigation: The derived role from `useUser()` is checked first and typically available. The metadata fallback is for edge cases during loading.
- Recommendations: Remove the metadata fallback chain. Rely only on `derivedRole` from `useUser()` which verifies role from database.

**Non-Migration Files in Migrations Directory:**
- Risk: Debug and test SQL files are committed to `supabase/migrations/`:
  - `DEBUG_check_teacher_status.sql`
  - `TEST_direct_insert.sql`
  - `README_USER_PREFERENCES.md`
- Files: `supabase/migrations/DEBUG_check_teacher_status.sql`, `supabase/migrations/TEST_direct_insert.sql`
- Current mitigation: These are not timestamped, so Supabase CLI may skip them.
- Recommendations: Move or delete these files. They could confuse automated migration tooling and may contain debug queries not suitable for production.

**Achievement Definitions Not i18n-ized:**
- Risk: Achievement titles and descriptions in `src/services/achievementService.js` (lines 9-101) are hardcoded in English (e.g., "First Steps", "Building Habits"). Hebrew-language users see English text for achievements.
- Files: `src/services/achievementService.js` (lines 9-101)
- Current mitigation: None — this is a gap.
- Recommendations: Replace string literals with i18n keys, similar to how `dailyGoalsService.js` uses `nameKey`/`descriptionKey`.

## Performance Bottlenecks

**Single-Chunk Bundle (No Code Splitting):**
- Problem: 3.9 MB single JS chunk means every user downloads all game code, teacher dashboard, subscription pages, etc. even if they only visit the dashboard.
- Files: `src/App.jsx` (all eager imports), `vite.config.js` (no `manualChunks` config)
- Cause: All routes are statically imported. No `React.lazy()`, no `manualChunks` in Vite config.
- Improvement path: Route-based code splitting with `React.lazy()`. Consider also vendor chunking (VexFlow ~400KB, recharts, framer-motion as separate chunks).

**433 MB WAV Files Bundled via Vite:**
- Problem: Piano sound assets inflate the build to 275 MB and each WAV file gets a tiny JS wrapper chunk. This creates ~90 extra chunk files in `dist/assets/`.
- Files: `src/assets/sounds/piano/` (90 WAV files), `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (dynamic imports)
- Cause: WAV files are imported via `import()` which Vite processes as assets. No compression, no CDN.
- Improvement path: Host audio files externally (Supabase Storage, CDN). Convert WAV to OGG/MP3 for 5-10x size reduction. Lazy-load only the octave range needed for each exercise.

**99 Database Migrations:**
- Problem: The `supabase/migrations/` directory contains 99 SQL files. Many are iterative fixes (e.g., 5 files on the same day fixing teacher-student RLS). This slows migration runs and makes schema history hard to follow.
- Files: `supabase/migrations/` (99 files)
- Cause: Rapid iterative development with fix-on-fix migration pattern.
- Improvement path: Consolidate migrations into a squashed baseline migration for production. Keep individual files for development history.

## Fragile Areas

**Game Component State Machines:**
- Files:
  - `src/components/games/sight-reading-game/SightReadingGame.jsx` (3,737 lines)
  - `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (2,756 lines)
  - `src/components/games/rhythm-games/MetronomeTrainer.jsx` (1,437 lines)
- Why fragile: Each game has an implicit state machine (setup -> playing -> feedback -> victory) managed by 20-40 `useState`/`useRef` variables. State transitions are scattered across multiple `useEffect` and `useCallback` hooks. The 41 `exhaustive-deps` warnings indicate stale closures may already exist. Adding new features (e.g., a new game phase) requires modifying deeply nested callback chains.
- Safe modification: For any game change, verify the complete lifecycle: trail entry -> auto-start -> play -> victory -> next exercise -> back to trail. Test both timed and untimed modes, both keyboard and mic input.
- Test coverage: Only `SightReadingGame.micRestart.test.jsx` exists for game components, and it fails. No unit tests for game state transitions, scoring logic, or exercise progression.

**TrailNodeModal Conditional Hook:**
- Files: `src/components/trail/TrailNodeModal.jsx` (lines 108-140)
- Why fragile: The `if (!node) return null` on line 117 before `useEffect` on line 122 violates React hooks rules. Any change to the hook ordering or addition of new hooks above line 117 can cause a crash.
- Safe modification: Move the guard inside effects, not before them.
- Test coverage: No tests exist for `TrailNodeModal`.

**VictoryScreen + useVictoryState Chain:**
- Files: `src/hooks/useVictoryState.js` (713 lines), `src/components/games/VictoryScreen.jsx`
- Why fragile: The victory flow involves streak updates, achievement checks, XP awards, exercise progress updates, boss unlock detection, and node completion — all in sequence. Failure in any step can leave data inconsistent (e.g., XP awarded but progress not saved).
- Safe modification: Add error boundaries around individual save operations. Ensure idempotency of `updateExerciseProgress` and `awardXP`.
- Test coverage: No tests for `useVictoryState`.

**Streak Service Module-Level State:**
- Files: `src/services/streakService.js` (lines 9-20)
- Why fragile: Uses module-level variables (`lastPracticeFetchInFlight`, `streakFetchFailed`, etc.) for deduplication/cooldown. These persist across component re-renders but reset on page reload. If a fetch fails, the 60-second cooldown can cause streak data to show 0 for a full minute.
- Safe modification: Any change to fetch logic must account for the cooldown/dedup state. Consider moving to React Query's built-in retry/dedup.
- Test coverage: No tests.

## Scaling Limits

**Single JS Bundle:**
- Current capacity: 3.9 MB (1.3 MB gzip), acceptable on broadband but slow on 3G mobile.
- Limit: As features are added, the bundle will continue growing linearly since nothing is split.
- Scaling path: Code splitting (see Performance section).

**Supabase RLS Policy Complexity:**
- Current capacity: 99 migrations, many with overlapping/superseding RLS policies.
- Limit: RLS policy evaluation becomes slower as more policies are added. Complex `has_active_subscription()` calls on every INSERT add latency.
- Scaling path: Audit and consolidate RLS policies. Use composite indexes for commonly-queried patterns.

## Dependencies at Risk

**Dual Icon Libraries (lucide-react + react-icons):**
- Risk: Two icon libraries are bundled. `lucide-react` is used in 85 import lines, `react-icons` in only 4.
- Impact: `react-icons` adds bundle weight for minimal usage (Google icon, microphone icons, clock/warning icons).
- Migration plan: Replace 4 `react-icons` imports with Lucide equivalents and remove `react-icons` from `package.json`.

**VexFlow v5 (Large Library):**
- Risk: VexFlow is a substantial library (~400 KB) used only in sight-reading game. It is loaded for every user regardless of whether they play sight-reading.
- Impact: Contributes significantly to the monolithic bundle size.
- Migration plan: Dynamically import VexFlow only when entering sight-reading routes.

## Missing Critical Features

**No Offline Data Persistence:**
- Problem: The `syncPracticeSessions()` stub means practice data created offline is lost. The service worker caches navigation/assets but not user-generated data.
- Blocks: True offline-first PWA experience. Students on unreliable connections (school WiFi) may lose progress.

**No Bundle Analysis CI Gate:**
- Problem: No automated check prevents the bundle from growing. The bundle grew from 0 to 3.9 MB with no alarm.
- Blocks: Performance budget enforcement.

## Test Coverage Gaps

**Game Components (Critical Gap):**
- What's not tested: All 4 game components have no meaningful test coverage. The sole test (`SightReadingGame.micRestart.test.jsx`) is broken.
- Files: `src/components/games/sight-reading-game/SightReadingGame.jsx`, `src/components/games/notes-master-games/NotesRecognitionGame.jsx`, `src/components/games/rhythm-games/MetronomeTrainer.jsx`, `src/components/games/notes-master-games/MemoryGame.jsx`
- Risk: Game logic changes (scoring, timing, exercise flow) cannot be validated automatically. Regressions are only caught by manual testing.
- Priority: High

**Services Layer:**
- What's not tested: Most service files have no tests. Only `subscriptionService` and `webhookLogic` have test files.
- Files: `src/services/streakService.js`, `src/services/skillProgressService.js`, `src/services/dailyGoalsService.js`, `src/services/achievementService.js`, `src/services/practiceService.js`, `src/services/rateLimitService.js`
- Risk: Business logic changes (streak calculation, XP awards, rate limiting) are untested. The streak service has complex calendar math (grace windows, weekend pass) that is particularly error-prone.
- Priority: High

**VictoryScreen Flow:**
- What's not tested: The entire victory/completion flow including XP awards, streak updates, achievement checks, exercise progress.
- Files: `src/hooks/useVictoryState.js` (713 lines), `src/components/games/VictoryScreen.jsx`
- Risk: Data consistency issues between XP, progress, and achievement systems.
- Priority: Medium

**Overall Coverage Stats:**
- 7 test files covering ~254 source files (2.7% file coverage)
- 89 passing tests, 1 failing
- No coverage reporting configured (no `coverage` script or threshold)
- Priority: Medium — add coverage reporting before adding tests so progress is measurable

---

*Concerns audit: 2026-03-08*
