# Codebase Concerns

**Analysis Date:** 2026-03-23

## Tech Debt

**God Components (SightReadingGame, NotesRecognitionGame, TeacherDashboard):**
- Issue: Multiple components exceed 1,500 lines with excessive hook usage. `SightReadingGame.jsx` has 24 `useState`, 39 `useRef`, 46 `useCallback`, and 27 `useEffect` calls in a single component. `NotesRecognitionGame.jsx` has 26 `useState`, 19 `useRef`, and 20 `useEffect` calls.
- Files:
  - `src/components/games/sight-reading-game/SightReadingGame.jsx` (3,748 lines)
  - `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (2,828 lines)
  - `src/components/layout/TeacherDashboard.jsx` (2,700 lines)
  - `src/components/games/shared/UnifiedGameSettings.jsx` (2,289 lines)
  - `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` (1,772 lines)
  - `src/components/games/rhythm-games/MetronomeTrainer.jsx` (~1,400 lines)
- Impact: Extremely difficult to maintain, test, or review. The 41+ `exhaustive-deps` warnings indicate stale closures may already exist. Implicit state machines (setup -> playing -> feedback -> victory) are scattered across dozens of hooks with no centralized state transition logic.
- Fix approach: Extract custom hooks for each game phase (setup, gameplay, scoring, feedback). Move state machines into dedicated hooks or use a state machine library (e.g., XState). Each game component should ideally be under 500 lines orchestrating extracted hooks. The `useVictoryState` hook (713 lines at `src/hooks/useVictoryState.js`) was successfully extracted from VictoryScreen and serves as a pattern for similar extractions.

**Massive Piano Sound Assets in Source Tree:**
- Issue: ~90 WAV files totaling ~433 MB are committed to git under `src/assets/sounds/piano/`. These are imported via dynamic `import()` in `NotesRecognitionGame.jsx` (lines 42-80+) creating ~90 tiny wrapper JS chunks in the build output.
- Files: `src/assets/sounds/piano/*.wav`, `src/components/games/notes-master-games/NotesRecognitionGame.jsx`
- Impact: Git clone is enormous. Build output is inflated. Deployment bandwidth is wasted.
- Fix approach: Move WAV files to Supabase Storage or a CDN. Convert WAV to OGG/MP3 for 5-10x size reduction. Lazy-load only the octave range needed for each exercise.

**Duplicate `noteNameToMidi` Function:**
- Issue: The `noteNameToMidi` function (converts note name like "C4" to MIDI number) is implemented independently in three files with slightly different signatures:
  - `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` (line 45): accepts `pitch` string, uses local `NOTE_TO_SEMITONE` map
  - `src/components/games/sight-reading-game/components/KlavierKeyboard.jsx` (line 22): accepts `note` string, uses inline semitone map
  - `src/hooks/useAudioEngine.js` (line 448): uses `SEMITONE_MAP` inside `useCallback`
- Impact: Bug fixes or enhancements to note parsing must be applied in three places. Inconsistencies between implementations could cause subtle pitch detection bugs.
- Fix approach: Create a single `noteNameToMidi` utility in `src/utils/musicUtils.js` and import in all three locations.

**Duplicate `verifyStudentDataAccess` Function:**
- Issue: The authorization helper function is implemented in two files: the canonical version in `authorizationUtils.js` and a duplicate local copy in `apiDatabase.js`.
- Files:
  - `src/services/authorizationUtils.js` (line 19): Exported, returns `{ userId, isOwner, isTeacher }`, uses `.maybeSingle()`
  - `src/services/apiDatabase.js` (line 14): Local/private, returns `true`, uses `.single()` (will throw on no match instead of returning null)
- Impact: The `apiDatabase.js` version has subtly different error behavior (uses `.single()` which throws `PGRST116` vs `.maybeSingle()` which returns null). Six other service files correctly import from `authorizationUtils.js`.
- Fix approach: Delete the duplicate in `apiDatabase.js` and import from `authorizationUtils.js` instead.

**Duplicate Star Calculation Functions:**
- Issue: The `calculateStars(percentage)` function (95%=3, 80%=2, 60%=1, 0=0) is duplicated with identical logic.
- Files:
  - `src/hooks/useVictoryState.js` (as `calculateStars`)
  - `src/services/skillProgressService.js` (line 19, as `_calculateStarsFromPercentage`)
- Impact: If star thresholds change, both must be updated.
- Fix approach: Create a single `calculateStars` utility in `src/utils/` and import in both locations.

**TeacherDashboard Eagerly Imported:**
- Issue: `TeacherDashboard` (2,700 lines) is statically imported in `src/App.jsx` (line 30) instead of using `React.lazy()`. This loads the entire teacher UI for all users, including students who never see it.
- Files: `src/App.jsx` (line 30)
- Impact: Adds significant weight to the initial bundle for student users. All other heavy components (games, pages) have already been converted to `React.lazy()`.
- Fix approach: Convert to `const TeacherDashboard = React.lazy(() => import("./components/layout/TeacherDashboard"))`.

**Legacy CSS Card Classes:**
- Issue: Both inline Tailwind glass card patterns and CSS utility classes coexist. The `index.css` defines `.card` (white/opaque, for light backgrounds), `.card-glass` (white/opaque), `.card-glass-legacy` (glassmorphism), `.card-compact`, and their hover variants. Most components use inline Tailwind classes like `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl` instead of these CSS classes. The `.card` and `.card-glass` classes use opaque white backgrounds inappropriate for the app's purple gradient background.
- Files:
  - `src/index.css` (lines 387-418): CSS class definitions
  - `src/components/streak/StreakDisplay.jsx` (lines 141, 217): Uses `card-compact`
  - `src/components/layout/Dashboard.jsx` (lines 811, 828): Uses `card-hover`
- Impact: Confusion about which pattern to use. Only 4 usages of CSS card classes vs. hundreds of inline Tailwind classes.
- Fix approach: Either migrate all inline patterns to CSS classes, or remove the legacy CSS classes and standardize on inline Tailwind. The glass card pattern (`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg`) is the correct pattern for the purple gradient background.

**AchievementsLegacy Dead Code:**
- Issue: `src/pages/AchievementsLegacy.jsx` is no longer imported by any file. The `Achievements.jsx` wrapper unconditionally renders `AchievementsRedesign` with a comment "To rollback: swap this import to AchievementsLegacy".
- Files: `src/pages/AchievementsLegacy.jsx` (~350 lines), `src/pages/Achievements.jsx` (5 lines)
- Impact: Dead code in the bundle. The rollback comment suggests it should have been deleted after the redesign was confirmed stable.
- Fix approach: Delete `AchievementsLegacy.jsx` and remove the rollback comment.

**Debug Instrumentation in SightReadingGame:**
- Issue: `SightReadingGame.jsx` contains a `__srLog` system (23 call sites) sending JSON payloads to an endpoint, plus `console.debug` calls (11 occurrences) for `[NoteDetection]`, `[MetronomeTiming]`, and `[ScoreSyncStatus]`. The `__srLog` system is correctly gated behind `import.meta.env.DEV` (tree-shaken in production). However, the `console.debug` calls are NOT behind env guards and ship to production.
- Files: `src/components/games/sight-reading-game/SightReadingGame.jsx` (lines 123-148 for debug constants, 23 `__srLog` calls, 11 `console.debug` calls)
- Impact: Production users see debug output in browser console. Minor performance overhead from debug logging during gameplay.
- Fix approach: Gate the `console.debug` calls behind the same env-var pattern, or replace with a no-op logger in production.

**Excessive `console.*` Statements:**
- Issue: 366 `console.log/error/warn/debug` calls across 90 source files. While some are appropriate error logging, many are development-time debug statements that shipped to production.
- Files: Spread across the codebase (see Grep results). Top offenders: `src/services/apiTeacher.js` (30), `src/components/games/sight-reading-game/SightReadingGame.jsx` (19), `src/services/skillProgressService.js` (17), `src/hooks/useAudioEngine.js` (16), `src/services/practiceService.js` (13)
- Impact: Noisy browser console in production. Potential information leakage (error details, internal state).
- Fix approach: Introduce a structured logger utility (or use Sentry breadcrumbs) that is silent in production. Replace `console.*` calls with the logger. Keep `console.error` only for truly unexpected errors.

**Overly Broad Supabase Queries (`select('*')`):**
- Issue: 36 instances of `.select('*')` across 14 service files. This fetches all columns from database tables even when only 1-2 columns are needed.
- Files: `src/services/apiDatabase.js` (11 occurrences), `src/services/apiAuth.js` (5), `src/services/apiTeacher.js` (4), `src/services/apiAccessories.js` (3), plus 10 other service files
- Impact: Increased network transfer, slower query execution, and unnecessary data exposure. Particularly impactful for tables with JSONB columns or large text fields.
- Fix approach: Replace `select('*')` with explicit column lists (e.g., `.select('id, student_name, total_xp')`). Start with high-traffic queries like `getStudentProgress`, `getStudentScores`.

## Known Bugs

**Failing Test: SightReadingGame.micRestart.test.jsx:**
- Symptoms: Test suite has 1 failing test. Error: "useAudioContext must be used inside AudioContextProvider".
- Files: `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx`
- Trigger: The test renders `SightReadingGame` without wrapping it in `AudioContextProvider`.
- Workaround: None -- this test fails on every run.
- Fix: Add `AudioContextProvider` to the test's render wrapper, or mock `useAudioContext`.

**TODO Stub: `convertToEasyScoreFormat`:**
- Symptoms: Function returns empty string, marked "TODO: Implement in Phase 2".
- Files: `src/components/games/sight-reading-game/utils/vexflowHelpers.js` (line 63)
- Trigger: If called, returns `''` instead of a valid EasyScore format string.
- Workaround: The function is not currently called in production paths -- the VexFlow rendering uses direct StaveNote construction instead.

## Security Considerations

**syncPracticeSessions Stub in Service Worker:**
- Risk: The `sync` event handler in `public/sw.js` calls `syncPracticeSessions()` which is a no-op stub. Practice data accumulated offline is silently lost.
- Files: `public/sw.js`
- Current mitigation: Background sync is rarely triggered since the app primarily works online.
- Recommendations: Either implement proper offline sync with IndexedDB queueing, or remove the sync event listener to avoid false expectations.

**Non-Migration Files in Migrations Directory:**
- Risk: Debug, test, and documentation files are committed to `supabase/migrations/`:
  - `DEBUG_check_teacher_status.sql` -- contains diagnostic queries
  - `TEST_direct_insert.sql` -- contains test INSERT statements
  - `README_USER_PREFERENCES.md` -- markdown documentation
- Files: `supabase/migrations/DEBUG_check_teacher_status.sql`, `supabase/migrations/TEST_direct_insert.sql`, `supabase/migrations/README_USER_PREFERENCES.md`
- Current mitigation: Non-timestamped files are skipped by Supabase CLI.
- Recommendations: Move or delete these files. They could confuse automated migration tooling.

**Achievement Definitions Not i18n-ized:**
- Risk: Achievement titles and descriptions in `src/services/achievementService.js` are hardcoded in English. Hebrew-language users see English text for achievements.
- Files: `src/services/achievementService.js`
- Current mitigation: None.
- Recommendations: Replace string literals with i18n keys, similar to how `dailyGoalsService.js` uses `nameKey`/`descriptionKey`.

**TeacherDashboard Entirely in English:**
- Risk: The entire `TeacherDashboard.jsx` (2,700 lines) has zero `useTranslation` calls. All UI text is hardcoded in English. Teacher users who set Hebrew as their language still see an English dashboard.
- Files: `src/components/layout/TeacherDashboard.jsx` (61+ hardcoded English strings)
- Current mitigation: Teachers are assumed to be English-speaking, but this breaks the app's i18n contract.
- Recommendations: Add `useTranslation` and move all strings to locale files.

**Hardcoded Hebrew in NotesRecognitionGame:**
- Risk: Three Hebrew string literals are embedded directly in JSX instead of using the i18n system:
  - Line 1543: `בחר ${group.baseLabel}, ${group.baseLabel} דיאז או ${group.baseLabel} במול` (accessibility label)
  - Line 2473: `מאזין לנגינה` ("Listening to playing" -- microphone status)
  - Line 2686: `בחר גרסה עבור ${variantModal.baseLabel}` (variant picker label)
- Files: `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (lines 1543, 2473, 2686)
- Current mitigation: These are aria-labels and status text, so visual impact is limited.
- Recommendations: Move to i18n keys for proper localization.

**Hardcoded English in SightReadingGame UI Elements:**
- Risk: Several SightReadingGame UI strings bypass the i18n system:
  - Line 3617: "Choose Input Mode" modal title
  - Line 3619: "Select how you want to play the notes:"
  - Line 3725: "No Cheating, Maestro!" anti-cheat modal
  - Line 3728: "Rapid key presses were detected..."
- Files: `src/components/games/sight-reading-game/SightReadingGame.jsx` (lines 3617-3740)
- Recommendations: Move to i18n keys.

**Sentry sendDefaultPii: false (Good):**
- PII is not sent to Sentry. The initialization at `src/services/sentryService.js` correctly sets `sendDefaultPii: false`. Only 4 files use `Sentry.captureException`: `src/services/skillProgressService.js`, `src/utils/xpSystem.js`, `src/utils/errorNotification.js`, `src/components/ErrorBoundary.jsx`. Error reporting is production-only and COPPA-conscious.

## Performance Bottlenecks

**Piano Sound Assets Bundled via Vite:**
- Problem: ~90 WAV piano sound files inflate the build output. Each WAV file gets a tiny JS wrapper chunk. No compression, no CDN.
- Files: `src/assets/sounds/piano/` (~90 WAV files), `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (dynamic imports)
- Cause: WAV files are imported via `import()` which Vite processes as assets.
- Improvement path: Host audio files externally (Supabase Storage, CDN). Convert WAV to OGG/MP3 for 5-10x size reduction. Lazy-load only the octave range needed for each exercise.

**TeacherDashboard in Main Bundle:**
- Problem: `TeacherDashboard` (2,700 lines, with recharts and heavy teacher-only imports) is eagerly imported in `App.jsx`, adding to the initial bundle for all users including students.
- Files: `src/App.jsx` (line 30)
- Cause: Was not included in the code-splitting migration that converted game components and pages to `React.lazy()`.
- Improvement path: Convert to `React.lazy()`.

**100+ Database Migrations:**
- Problem: The `supabase/migrations/` directory contains 100+ SQL files. Many are iterative fixes (e.g., 5 files on the same day fixing teacher-student RLS, files named `nuclear_security_fix.sql`, `ultimate_security_fix.sql`). Machine-name suffixes appear in filenames (e.g., `DESKTOP-8I4D76J`).
- Files: `supabase/migrations/` (100+ files)
- Cause: Rapid iterative development with fix-on-fix migration pattern.
- Improvement path: Consolidate migrations into a squashed baseline migration for production. Keep individual files for development history only.

**Multiple Polling Intervals:**
- Problem: 16 different `refetchInterval` configurations across the app, ranging from 30 seconds to 5 minutes. Components on the dashboard poll at different rates creating a steady stream of network requests.
- Files:
  - `src/components/teacher/NotificationCenter.jsx`: 30 seconds
  - `src/components/teacher/AssignmentManagement.jsx`: 30 seconds
  - `src/components/dashboard/XPProgressCard.jsx`: 1 minute
  - `src/components/layout/Dashboard.jsx`: 1 minute and 5 minutes (multiple queries)
  - `src/components/layout/TeacherDashboard.jsx`: 2 minutes
  - `src/components/teacher/RecordingsReview.jsx`: 3 minutes
  - Various: 5 minutes
- Cause: Each component independently chose its polling interval without coordination.
- Improvement path: Standardize on 2-3 polling tiers (real-time: 30s for notifications; active: 2min for dashboards; background: 5min for scores). Consider Supabase real-time subscriptions for teacher notifications instead of polling.

## Fragile Areas

**Game Component State Machines:**
- Files:
  - `src/components/games/sight-reading-game/SightReadingGame.jsx` (3,748 lines)
  - `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (2,828 lines)
  - `src/components/games/rhythm-games/MetronomeTrainer.jsx` (~1,400 lines)
- Why fragile: Each game has an implicit state machine (setup -> playing -> feedback -> victory) managed by 20-40 `useState`/`useRef` variables. State transitions are scattered across multiple `useEffect` and `useCallback` hooks. Adding new features (e.g., a new game phase) requires modifying deeply nested callback chains.
- Safe modification: For any game change, verify the complete lifecycle: trail entry -> auto-start -> play -> victory -> next exercise -> back to trail. Test both timed and untimed modes, both keyboard and mic input.
- Test coverage: `SightReadingGame.micRestart.test.jsx` exists but fails. `NotesRecognitionGame.autogrow.test.js` tests auto-grow note pool only. No tests for game state transitions, scoring logic, or exercise progression.

**VictoryScreen + useVictoryState Chain:**
- Files: `src/hooks/useVictoryState.js` (713 lines), `src/components/games/VictoryScreen.jsx`
- Why fragile: The victory flow involves streak updates, achievement checks, XP awards, exercise progress updates, boss unlock detection, and node completion -- all in sequence. Failure in any step can leave data inconsistent (e.g., XP awarded but progress not saved).
- Safe modification: Add error boundaries around individual save operations. Ensure idempotency of `updateExerciseProgress` and `awardXP`.
- Test coverage: No tests for `useVictoryState`.

**Streak Service Module-Level State:**
- Files: `src/services/streakService.js` (lines 9-20)
- Why fragile: Uses 9 module-level mutable variables (`lastPracticeFetchInFlight`, `streakFetchFailed`, `streakFetchInFlight`, etc.) for deduplication/cooldown. These persist across component re-renders but reset on page reload. If a fetch fails, the 60-second cooldown can cause streak data to show 0 for a full minute.
- Safe modification: Any change to fetch logic must account for the cooldown/dedup state. Consider moving to React Query's built-in retry/dedup.
- Test coverage: No tests.

**Audio Infrastructure (iOS Safari):**
- Files: `src/contexts/AudioContextProvider.jsx`, `src/hooks/useAudioEngine.js` (480+ lines), `src/hooks/useMicNoteInput.js`, `src/hooks/micInputPresets.js`, `src/utils/isIOSSafari.js`
- Why fragile: iOS Safari requires special handling for AudioContext resumption, microphone access in standalone PWA mode, and audio interruption recovery. The `AudioInterruptedOverlay` component handles mid-session iOS audio context suspension. Multiple `.catch(() => {})` swallow errors in audio paths (`src/components/games/sight-reading-game/SightReadingGame.jsx` line 62, 2927; `src/utils/fanfareSound.js` line 71).
- Safe modification: Never modify audio initialization without testing on an actual iOS device in both Safari and standalone PWA mode.

## Scaling Limits

**Supabase RLS Policy Complexity:**
- Current capacity: 100+ migrations, many with overlapping/superseding RLS policies.
- Limit: RLS policy evaluation becomes slower as more policies are added. Complex `has_active_subscription()` calls on every INSERT add latency.
- Scaling path: Audit and consolidate RLS policies. Use composite indexes for commonly-queried patterns.

## Dependencies at Risk

**Dual Icon Libraries (lucide-react + react-icons):**
- Risk: Two icon libraries are bundled. `lucide-react` is used extensively, `react-icons` in only ~4 import sites (`FaMicrophone`, `FaMicrophoneSlash`, etc.).
- Impact: `react-icons` adds bundle weight for minimal usage.
- Migration plan: Replace the 4 `react-icons` imports with Lucide equivalents and remove `react-icons` from `package.json`.

**VexFlow v5 (Large Library):**
- Risk: VexFlow is a substantial library (~400 KB) used only in sight-reading game components. It is now lazy-loaded via `React.lazy()` (was previously eager).
- Impact: No longer affects initial bundle for non-sight-reading users. Still a large dependency for sight-reading routes.
- Migration plan: Already mitigated by code splitting. Further optimization: dynamic import of VexFlow at the component level rather than at the route level.

## Missing Critical Features

**No Offline Data Persistence:**
- Problem: The `syncPracticeSessions()` stub means practice data created offline is lost. The service worker caches navigation/assets but not user-generated data.
- Blocks: True offline-first PWA experience. Students on unreliable connections (school WiFi) may lose progress.

**No Bundle Analysis CI Gate:**
- Problem: No automated check prevents the bundle from growing. Code splitting was added but no budget enforcement exists.
- Blocks: Performance budget enforcement.

## Test Coverage Gaps

**Game Components (Critical Gap):**
- What's not tested: All 4 game components have minimal or broken test coverage. The sole integration test (`SightReadingGame.micRestart.test.jsx`) fails due to missing provider wrapper.
- Files: `src/components/games/sight-reading-game/SightReadingGame.jsx`, `src/components/games/notes-master-games/NotesRecognitionGame.jsx`, `src/components/games/rhythm-games/MetronomeTrainer.jsx`, `src/components/games/notes-master-games/MemoryGame.jsx`
- Risk: Game logic changes (scoring, timing, exercise flow) cannot be validated automatically. Regressions are only caught by manual testing.
- Priority: High

**Services Layer:**
- What's not tested: Most service files have no tests. Only `subscriptionService` and `webhookLogic` have test files.
- Files: `src/services/streakService.js`, `src/services/skillProgressService.js`, `src/services/dailyGoalsService.js`, `src/services/achievementService.js`, `src/services/practiceService.js`, `src/services/rateLimitService.js`
- Risk: Business logic changes (streak calculation, XP awards, rate limiting) are untested. The streak service has complex calendar math (grace windows, weekend pass, freeze logic) that is particularly error-prone.
- Priority: High

**VictoryScreen Flow:**
- What's not tested: The entire victory/completion flow including XP awards, streak updates, achievement checks, exercise progress.
- Files: `src/hooks/useVictoryState.js` (713 lines), `src/components/games/VictoryScreen.jsx`
- Risk: Data consistency issues between XP, progress, and achievement systems.
- Priority: Medium

**Overall Coverage Stats:**
- 14 test files covering ~254 source files (5.5% file coverage) -- improved from 7 test files at last audit
- New test files since last audit: `beamGroupUtils.test.js`, `patternBuilder.test.js`, `keySignatureUtils.test.js`, `rhythmGenerator.test.js`, `rhythmUnit7Redesigned.test.js`, `rhythmUnit8Redesigned.test.js`, `FeedbackForm.test.jsx`
- 1 failing test (SightReadingGame.micRestart.test.jsx)
- No coverage reporting configured (no `coverage` script or threshold)
- Priority: Medium -- add coverage reporting before adding tests so progress is measurable

---

*Concerns audit: 2026-03-23*
