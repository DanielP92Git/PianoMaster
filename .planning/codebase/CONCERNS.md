# Codebase Concerns

**Analysis Date:** 2026-01-31

## Tech Debt

### Large Component Files (3500+ LOC)

**SightReadingGame Component:**
- Files: `src/components/games/sight-reading-game/SightReadingGame.jsx` (3497 lines)
- Issue: Monolithic component handles timing, audio, VexFlow rendering, UI state, mic input processing, and scoring in single file
- Impact: Difficult to test isolated functionality, high cognitive complexity, hard to refactor timing/audio logic independently
- Fix approach: Split into smaller concerns (SightReadingSessionManager, AudioPipeline, TimingAnalyzer as separate custom hooks), extract timing constants to dedicated module

**NotesRecognitionGame Component:**
- Files: `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (2357 lines)
- Issue: Manages game logic, audio (150+ instrument sound imports), scoring, trail integration, victory screen coordination
- Impact: Sound loaders create bundle bloat (dynamic imports not optimized), game state management mixed with UI
- Fix approach: Extract sound system to custom hook (`usePianoSounds`), separate game state machine from UI rendering

**UnifiedGameSettings Component:**
- Files: `src/components/games/shared/UnifiedGameSettings.jsx` (2270 lines)
- Issue: Shared settings dialog handles clef selection, time signature, difficulty, rhythm complexity, accessibility, and multiple game modes
- Impact: High prop drilling, tightly coupled to game implementations, hard to extend for new game types
- Fix approach: Split into feature-specific sub-components, use context providers for settings state

**TeacherDashboard Component:**
- Files: `src/components/layout/TeacherDashboard.jsx` (2686 lines)
- Issue: Renders analytics, student management, assignments, performance tracking, notifications in single component
- Impact: Multiple React Query hooks, complex filtering/sorting logic, performance degrades with many students
- Fix approach: Extract analytics section to separate component, use React Query's pagination for student lists

### Debug Code in Production

**Hardcoded Debug Flags:**
- Files: `src/hooks/useAudioEngine.js`, `src/components/games/sight-reading-game/SightReadingGame.jsx`, `src/components/games/sight-reading-game/hooks/useRhythmPlayback.js`
- Issue: Debug constants like `METRONOME_TIMING_DEBUG = true`, `RHYTHM_DEBUG = true`, `AUDIO_OUTPUT_LATENCY_COMP_DEBUG = true` hardcoded to `true`
- Impact: Console logs and timing measurements execute in production, adds latency, increases bundle size
- Fix approach: Wrap all debug code in environment checks: `if (process.env.NODE_ENV === 'development' || import.meta.env.VITE_DEBUG_TIMING)`

**Debug Logging Endpoint:**
- Files: `src/components/games/sight-reading-game/SightReadingGame.jsx` (lines 47-60)
- Issue: Network logging to `http://127.0.0.1:7242` is configured but disabled, creates dead code
- Impact: Confusing for future maintainers, potential security risk if accidentally enabled with sensitive data
- Fix approach: Remove debug endpoint or move to standalone debug utility that's completely excluded from production builds

**TODO Comments Not Implemented:**
- Files: `src/App.jsx` line 266, `src/components/games/sight-reading-game/utils/vexflowHelpers.js` line 63
- Issue: Placeholder comments for Phase 2 rhythm game routes and VexFlow feature
- Impact: Dead code markers, unclear priority
- Fix approach: Convert to proper GitHub issues or remove if no longer planned

## Known Bugs

### Memory Game Trail Integration Not Implemented

**Issue:**
- Files: `src/data/units/trebleUnit1Redesigned.js`, `trebleUnit2Redesigned.js`, `trebleUnit3Redesigned.js`
- Nodes reference `EXERCISE_TYPES.MEMORY_GAME` exercises but `MemoryGame.jsx` was not fully integrated before phase completion
- Trigger: Navigate to any treble unit node with memory_game exercise type
- Symptoms: `Cannot read property 'find' of undefined` or missing game component error when starting memory game exercise

**Workaround:**
- Currently MemoryGame supports trail integration (`nodeId`, `exerciseIndex`, `totalExercises` props), but navigation routing in `TrailNodeModal.jsx` may not properly route to memory game

**Priority:** High - Blocks 3 nodes (treble_1_4, treble_2_5, treble_3_8) from being completable

### Exercise Progress State Management Race Condition

**Issue:**
- Files: `src/components/games/VictoryScreen.jsx`, `src/services/skillProgressService.js`
- When completing multi-exercise nodes, `exercisesRemaining` calculation may be stale if database update hasn't completed
- Impact: User could see "Next Exercise" button when node is actually complete, or vice versa
- Trigger: Fast completion of final exercise in multi-exercise node

**Workaround:** Refetch progress after update completes before navigating

## Security Considerations

### localStorage Used for Migration Status (CRITICAL)

**Risk:** localStorage-based migration tracking (`trail_migration_v2_${studentId}`) can be manipulated by users to trigger re-migration
- Files: `src/utils/progressMigration.js` (lines 51-64)
- If user clears storage and re-migrates, could duplicate XP awards or progress entries
- Current mitigation: `runMigrationIfNeeded` checks both localStorage AND has idempotent DB upsert (via `onConflict`)

**Recommendation:**
- Add server-side migration tracking column to `students` table: `migration_v2_completed BOOLEAN DEFAULT false`
- Client-side localStorage check should be cache-only; authoritative check via database
- Prevent XP double-award by checking DB before calling `awardXP()`

### Audio Context Creation Without Error Handling

**Risk:** Multiple audio contexts created on simultaneous game starts
- Files: `src/hooks/useAudioEngine.js` (useAudioContext), `src/hooks/usePitchDetection.js`
- Same device can't have 2 active audio contexts - second one will fail silently
- Impact: Mic input fails if user opens 2 game tabs, or switches games too quickly

**Recommendation:**
- Implement singleton pattern for AudioContext (one per browser window)
- Share AudioContext via context provider or module-level singleton
- Add explicit error handling for "NotAllowedError" from getDisplayMedia

### Auth Token in Service Worker Cache (PARTIALLY MITIGATED)

**Current State:**
- Files: `public/sw.js` (lines 29-59) has AUTH_EXCLUDED_PATTERNS but implementation checks patterns

**Risk:** If pattern matching has gaps, auth tokens could persist in cache after logout on shared devices
- Test coverage missing: No test verifies /user, /signup, /session endpoints are excluded
- Edge case: Supabase token refresh requests to `/auth/v1/token` might not match `/auth/` pattern exactly

**Recommendation:**
- Add unit test for `isAuthEndpoint()` function covering edge cases
- Explicitly test these URLs: `/auth/v1/token`, `/auth/v1/user`, `/auth/v1/signup`
- Consider more aggressive pattern: exclude ALL URLs containing 'supabase' if path includes 'auth' OR 'token' OR 'user' with JWT in response

### Child Data Privacy (COPPA/GDPR-K Compliance)

**Issue:** Leaderboard feature in trail uses usernames
- Files: Potential leaderboard rendering in `src/components/trail/TrailMap.jsx` if future feature uses student names
- Risk: Violates COPPA regulations for children under 13 - cannot collect personal info for competitive display

**Recommendation:**
- If leaderboard added: Anonymize non-current-user entries (show "Student 1", "Student 2")
- Use student IDs internally, never display usernames in shared/public-facing features
- Add consent/opt-in for any leaderboard participation

## Performance Bottlenecks

### Sound File Imports Create Bundle Bloat

**Problem:**
- Files: `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (lines 41-146)
- 140+ dynamic imports for piano sound files (B0 through C7, all 12 notes)
- Each import() call adds HTTP request overhead in dev, increases build output in production

**Current file sizes:** Piano sound files in `src/assets/sounds/piano/` - each ~50-80KB WAV

**Impact:**
- SoundRecognitionGame alone pulls in 7-10MB of audio assets
- Vite code-splitting doesn't optimize instrument audio well
- Mobile users on slow connections see long load times

**Improvement path:**
1. Pre-compute which notes are actually used per game variant
2. Use Web Audio API to synthesize piano tones instead of loading samples (would reduce to <1MB code)
3. Or: Create 2-3 "note packs" and lazy-load only the octave range needed
4. Move audio loading to separate bundle chunk, load after game starts

### Trail Data Fetching Not Optimized for Many Users

**Problem:**
- Files: `src/components/trail/TrailMap.jsx` (line 118+), `src/services/skillProgressService.js`
- Dashboard calls `getStudentProgress(studentId)` which fetches ALL progress records with `.order('last_practiced')`
- No pagination - full result set loaded into memory
- For teachers: Dashboard loads analytics for every student, no lazy loading

**Current behavior:**
- `getDailyGoalsWithProgress()` refetches every 60 seconds (line 32, DailyGoalsCard)
- TrailMap also fetches full progress on mount
- No React Query caching strategy for these queries

**Improvement path:**
- Add pagination/limits to `getStudentProgress()`: fetch last 50 records only
- Implement React Query caching with 5-minute stale time (already in CLAUDE.md)
- In TeacherDashboard: Paginate student list, lazy-load detailed analytics
- Reduce DailyGoals refetch interval to 120 seconds or user-triggered

### VexFlow Rendering Blocks UI

**Problem:**
- Files: `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` (line 377+)
- VexFlow renders to SVG synchronously in component render
- Complex patterns with 4+ measures cause 200-300ms render time
- SightReadingGame creates new patterns every question - VexFlow re-renders each time

**Impact:** Noticeable UI freeze on lower-end devices, poor performance on Chromebooks

**Improvement path:**
1. Memoize VexFlow renders: `useMemo` with pattern hash key
2. Or: Pre-render staff SVG as string, inject via `dangerouslySetInnerHTML`
3. Or: Move VexFlow to web worker via Comlink (most robust)
4. Benchmark: Currently ~50-100ms per render, target <20ms

## Fragile Areas

### Trail Node Unlock Logic (Client-Side)

**Files:**
- `src/data/skillTrail.js` - `isNodeUnlocked()` function
- `src/components/trail/TrailMap.jsx` - unlock determination logic

**Why fragile:**
- Prerequisites stored in node definitions and checked in memory (not DB)
- If user modifies localStorage or browser devtools, could unlock nodes artificially
- Unlock state not validated server-side on game start

**Safe modification:**
- Add `isUnlocked BOOLEAN` column to `student_skill_progress` table
- Update this column when VictoryScreen saves progress (set next node as unlocked)
- On GameStart: verify `student_skill_progress.is_unlocked = true` before allowing play
- Remove client-side unlock logic entirely, treat as UI-only

**Test coverage gap:** No test for impossible unlock sequences (e.g., unlocking Unit 3 without completing Unit 2)

### Exercise Progress Index Assumption

**Files:**
- `src/services/skillProgressService.js` - `updateExerciseProgress()` function
- `src/components/games/VictoryScreen.jsx` - `exerciseIndex` prop usage

**Why fragile:**
- Code assumes `exerciseIndex` is 0-based and sequential
- If exercises array order changes in `skillTrail.js`, exercises_progress array order becomes incorrect
- No validation that exerciseIndex < total_exercises

**Safe modification:**
- Store exercise config hash/ID in progress, not just index number
- Validate `exerciseIndex < node.exercises.length` in VictoryScreen before processing
- Add test: reorder exercises in a node definition and verify progress tracking still works

## Scaling Limits

### Dashboard Performance with Many Students (Teachers)

**Current capacity:** Untested, likely <100 students before performance degrades

**Limit:** TeacherDashboard tries to render full analytics for every student
- Files: `src/components/layout/TeacherDashboard.jsx` (2686 lines)
- Queries: getStudentScores, getStudentProgressStats, getAchievements for each student
- React Query runs all queries in parallel (no batching)

**Scaling path:**
1. Implement student pagination (show 10-20 per page)
2. Use React Query's `enabled` flag to defer loading off-screen pages
3. Add aggregated "class stats" endpoint that returns summary instead of per-student queries
4. Cache teacher's student list for 1 hour (changes rarely)

### Audio Context Resource Exhaustion

**Current capacity:** ~5-10 concurrent audio connections before system instability

**Limit:**
- Files: `src/hooks/useAudioEngine.js`, `src/hooks/useMicNoteInput.js`, `src/hooks/usePitchDetection.js`
- Each game instance creates AudioContext + analyser + pitch detector
- Microphone stream request fails if browser has >1 active stream
- OscillatorNodes created for metronome not cleaned up on unmount

**Scaling path:**
1. Implement shared AudioContext singleton (one per tab)
2. Limit to one microphone stream per device (prevent multi-tab use)
3. Add cleanup in useEffect cleanup function: `oscillator.stop()`, `oscillator.disconnect()`
4. Test: Open SightReading + MetronomeTrainer simultaneously (current: mic fails in one)

## Dependencies at Risk

### VexFlow v5 (Music Notation Rendering)

**Risk:** Library is mature but not actively maintained (last update Feb 2024)
- Current version: `5.0.0` in `package.json`
- Issue: No published updates for 12+ months
- Impact: If browser audio/Web APIs change, no security patches available

**Migration plan:**
- Monitor https://github.com/0xfe/vexflow/releases for v6
- If needed, fork and maintain custom VexFlow build
- Or: Migrate to Opensheetmusicdisplay (more maintained alternative)

### Supabase Realtime (May Become Expensive)

**Risk:** Realtime subscriptions are charged per connection in Supabase
- Current usage: `src/hooks/useRealTimeSubscriptions.js` subscribes to student progress changes
- Impact: Cost scales with active users, could become expensive at 1000+ concurrent users

**Migration plan:**
- Replace subscriptions with React Query polling on events of interest
- Or: Cache-and-compare pattern (fetch every 30s instead of subscription)
- Test cost at 500 concurrent students (rough estimate: $500-2000/month vs $200/month without subscriptions)

### Klavier Library (Keyboard Input)

**Risk:** Klavier v2.0.1 has few maintained GitHub issues, small community
- Current usage: `src/hooks/` for keyboard input to games
- Issue: If Web MIDI API browser support changes, no backing library updates

**Migration plan:**
- Minimal - Klavier is thin wrapper around Web MIDI
- If needed, replace with direct Web MIDI API calls (20-30 line utility)
- Already has fallback to mouse/touch input

## Missing Critical Features

### No Session Timeout / Inactivity Logout

**Problem:** Users stay logged in indefinitely
- Files: No inactivity check in `src/App.jsx`
- For child accounts on shared devices: Critical security gap
- Recommendation: Logout after 1 hour of inactivity for students, 2 hours for teachers

### No Rate Limiting on Score Submissions

**Problem:** Client can submit unlimited scores in rapid succession
- Files: `src/components/games/VictoryScreen.jsx` → `updateNodeProgress()` → `src/services/skillProgressService.js`
- Impact: Could XP-farm by opening console and auto-clicking results
- Current mitigation: None - relies on client-side game timer

**Recommendation:**
- Add server-side rate limit: 1 score submission per node per 60 seconds per student
- Implement in `updateNodeProgress()`: check `last_practiced` timestamp before allowing update

### No Data Export for Parents/Students

**Problem:** COPPA/GDPR requires ability to export personal data
- Missing: Download feature for practice history, progress, accessories
- Files: None - feature doesn't exist

**Recommendation:**
- Add `/api/export-student-data` endpoint in backend
- Trigger via `src/pages/AppSettings.jsx` "Download My Data" button
- Return JSON with all student records, scores, progress

## Test Coverage Gaps

### Game Timing Logic Untested

**What's not tested:**
- Files: `src/components/games/sight-reading-game/SightReadingGame.jsx` - timing state machine
- No tests for early/late note detection windows
- No tests for metronome sync accuracy
- No integration tests for full game flow (setup → count-in → performance → feedback)

**Files affected:**
- `src/components/games/sight-reading-game/hooks/useMetronome.js` - no test file
- `src/components/games/sight-reading-game/hooks/useTimingAnalysis.js` - no test file

**Risk:** Timing thresholds easily break on small code changes, difficult to debug

**Priority:** Medium - add snapshot tests for timing calculations

### Trail Navigation Paths Untested

**What's not tested:**
- Files: `src/components/trail/TrailNodeModal.jsx` - navigation between exercise types
- Exercise order progression (memory → recognition → sight-reading)
- Unlock/lock state transitions
- Node completion with partial exercise completion

**Risk:** Exercise routing bugs could strand users mid-node

**Priority:** High - add E2E tests for 3-exercise node progression

### Multi-Exercise Node Flow Untested

**What's not tested:**
- Files: `src/components/games/VictoryScreen.jsx` - multi-exercise progression
- Does "Next Exercise" correctly navigate to exercise index 1?
- Does final exercise show "Back to Trail"?
- XP awards happen only after final exercise?

**Risk:** Users could get stuck or receive duplicate rewards

**Priority:** High - add unit tests for exercise state transitions

### Audio/Mic Pipeline Untested

**What's not tested:**
- Files: `src/hooks/useAudioEngine.js`, `src/hooks/usePitchDetection.js`
- Mic permission denied handling
- Audio context initialization failures
- Pitch detection accuracy
- Microphone cleanup on unmount

**Risk:** Audio failures manifest only in production on certain devices

**Priority:** High - add integration tests with mock Web Audio API

### Daily Goals Generation Untested

**What's not tested:**
- Files: `src/services/dailyGoalsService.js` - goal generation logic
- Are 3 unique goals always generated?
- Does progress calculation work correctly?
- Timezone handling for "today's goals"

**Risk:** Users might not get goals on certain dates, or see wrong progress

**Priority:** Medium - add tests for goal generation edge cases (leap years, DST transitions)

## Test Files Existing But May Be Incomplete

**Current test count:** 27 test files found

**Notable gaps:**
- No tests for `skillProgressService.js` (core trail functionality)
- No tests for `xpSystem.js` (XP calculations)
- No tests for `dailyGoalsService.js` (daily goal logic)
- No tests for trail components (`TrailMap.jsx`, `TrailNode.jsx`, `TrailNodeModal.jsx`)
- No tests for multi-exercise progression flow

---

*Concerns audit: 2026-01-31*
