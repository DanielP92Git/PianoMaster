# Production QA Checklist

**Date:** 2026-03-21
**Production URL:** https://testpianomaster.netlify.app
**Test Targets:** Desktop Chrome, Android Phone (Chrome/PWA), iOS Safari
**Bug Policy:** Blockers (must fix) vs Known Issues (document and ship) per D-01/D-02/D-03
**Tester:** _______________ **Sign-off Date:** _______________

## How to Use This Checklist

1. Work through sections top-to-bottom, one device at a time
2. Mark each item: replace `[ ]` with `[x]` (pass), `[F]` (fail), or `[S]` (skip)
3. For each FAIL: add a brief note below the checkbox with what you observed
4. After completing all sections, fill in the Results Summary table
5. Document all failures under "Blockers Found" or "Known Issues" per the bug policy

**Blocker policy (D-02):** auth broken, data loss/corruption, payment charging incorrectly, COPPA violation, game mode fully unplayable — these must be fixed before releasing to users.

**Known issue policy (D-03):** visual polish, edge-case glitches, "works but looks slightly off" on one browser — document and ship.

## Test Environment Setup

Before starting manual tests:
1. Open https://testpianomaster.netlify.app in Desktop Chrome
2. Open browser DevTools > Application > Service Workers — confirm SW is registered
3. Have two email inboxes available for COPPA consent and deletion confirmation tests
4. For Android: Chrome on physical Android device (not emulator) for PWA install + orientation lock
5. For iOS: Safari on physical iPhone/iPad (not Chrome iOS) for mic and audio interruption tests

## Pre-Flight Automated Checks

| Check | Command | Result | Notes |
|-------|---------|--------|-------|
| Production build | `npm run build` | PASS | 3518 modules transformed, 128 chunks, built in 31.51s. TrailValidation: 171 nodes OK (warnings: XP variance 22.1% between paths — non-blocking). Chunk size warnings (RotatePromptOverlay: 1249kB, index: 1741kB) — non-blocking. |
| ESLint | `npm run lint` | PASS | 0 errors, 0 warnings. Exit code 0. |
| Test suite | `npm run test:run` | PASS | 211 tests passed across 13 test files. 0 failures, 0 skipped. Duration: 10.55s. |
| Pattern validation | `npm run verify:patterns` | PASS | 9 pattern combinations verified (Beginner/Intermediate/Advanced x 4/4, 3/4, 2/4). All patterns verified. Exit code 0. |

---

## Section 1: Auth Flows (QA-01)

### Test Account Setup
- [ ] Create student account (age under 13) — triggers COPPA consent path (D-07)
- [ ] Create student account (age 13+) — non-COPPA path (D-07)

### Signup Flow
- [ ] [All] Signup with valid email/password succeeds
- [ ] [All] Under-13 signup shows "waiting for parent" state
- [ ] [All] Under-13: parent consent email received (check inbox)
- [ ] [All] Under-13: consent verification link works (public route /consent/verify)
- [ ] [All] Under-13: after consent, child account activates
- [ ] [All] Over-13 signup activates immediately (no consent needed)

### Login / Logout
- [ ] [All] Login with valid credentials succeeds, redirects to dashboard
- [ ] [All] Login with wrong password shows error (no email enumeration)
- [ ] [All] Logout clears session, redirects to login
- [ ] [All] After logout, back button does not return to authenticated content

### Password Reset
- [ ] [All] "Forgot password" link on login form shows inline reset flow
- [ ] [All] Reset email sent (generic success message regardless of email existence per anti-enumeration)
- [ ] [All] Reset link in email navigates to /reset-password page
- [ ] [All] New password set successfully, can login with new password

### Session Timeout
- [ ] [Desktop] Student account auto-logs out after 30 min inactivity
- [ ] [Desktop] Warning modal appears 5 min before timeout

---

## Section 2: Game Modes (QA-02)

Each game tested in trail mode (from trail node) AND free play (from /practice-modes or /notes-master-mode or /rhythm-mode). Both keyboard input and mic input where applicable (D-11).

### Note Recognition Game (/notes-master-mode/notes-recognition-game)
- [ ] [Desktop] Free play: starts, keyboard input works, correct/wrong feedback
- [ ] [Desktop] Free play: mic input works (pitch detected, note matched)
- [ ] [Desktop] Trail mode: auto-starts from trail node, progress saves on completion
- [ ] [Desktop] Lives system: 3 lives, game over screen on 0 lives
- [ ] [Desktop] Combo system: streak increments, on-fire mode triggers at threshold
- [ ] [Desktop] VictoryScreen shows after completing 10 exercises with stars + XP
- [ ] [Android] Free play with keyboard input works
- [ ] [iOS] Free play with mic input works (audio context handles interruptions)

### Sight Reading Game (/notes-master-mode/sight-reading-game)
- [ ] [Desktop] Free play: starts, notation renders (VexFlow SVG), mic detects pitch
- [ ] [Desktop] Trail mode: auto-starts, clef/key-sig from node config
- [ ] [Desktop] Keyboard input: notes register correctly
- [ ] [Desktop] VictoryScreen on session complete
- [ ] [Android] Landscape auto-locks, notation readable
- [ ] [iOS] Mic works, audio interruption overlay appears/recovers if interrupted

### Rhythm / Metronome Trainer (/rhythm-mode/metronome-trainer)
- [ ] [Desktop] Free play: starts, metronome ticks, tap input registers
- [ ] [Desktop] Trail mode: auto-starts with time signature from node config
- [ ] [Desktop] VictoryScreen on session complete
- [ ] [Android] Landscape layout, tap input works

### Memory Game (/notes-master-mode/memory-game)
- [ ] [Desktop] Free play: cards render, flip animation, match detection
- [ ] [Desktop] Trail mode: auto-starts, card pool from node config
- [ ] [Desktop] VictoryScreen on session complete
- [ ] [Android] Landscape grid layout (6-8 cols)

---

## Section 3: Payment / Content Gate (QA-03)

Gate behavior only — no actual checkout per D-09.

- [ ] [Desktop] Free trail nodes (treble_1_1 through treble_1_7, bass_1_1 through bass_1_6, rhythm_1_1 through rhythm_1_6, boss_treble_1, boss_bass_1, boss_rhythm_1) are accessible without subscription
- [ ] [Desktop] Locked trail nodes (any node NOT in FREE_NODE_IDS) show child paywall modal (no prices, no buy buttons per CHILD-01/02)
- [ ] [Desktop] /subscribe page loads pricing page
- [ ] [Desktop] /parent-portal page loads for authenticated user
- [ ] [Desktop] Non-trail games (free play) work without subscription (node_id: null always passes)

---

## Section 4: Trail System (QA-04)

- [ ] [Desktop] Trail page (/trail) loads with 3 tabs (Treble/Bass/Rhythm)
- [ ] [Desktop] Tab switching works, URL updates with query param
- [ ] [Desktop] Completed nodes show star ratings inside circles
- [ ] [Desktop] Locked nodes show gray state (prerequisite not met)
- [ ] [Desktop] Node modal opens on click, shows node info, "Start" button
- [ ] [Desktop] Completing a node awards XP (visible in header and dashboard)
- [ ] [Desktop] Star rating 1/2/3 based on score (60%/80%/95%)
- [ ] [Desktop] XP level progression: XP bar updates, level name shown
- [ ] [Desktop] Daily goals card shows 3 goals with progress bars
- [ ] [Desktop] Daily challenge card shows today's challenge
- [ ] [Desktop] Daily challenge completes correctly and awards bonus XP
- [ ] [Desktop] Nodes with multiple exercises: completing exercise advances to next, stars = min across all
- [ ] [Desktop] Boss node: unlocking shows boss unlock celebration modal (3-stage)

---

## Section 5: Push, Streak, PWA (QA-05)

### Push Notifications
- [ ] [Desktop] Settings page (/settings) shows notification permission card
- [ ] [Android] Push notification permission can be granted (after parent math gate)
- [ ] [Android] PWA receives push notification (may need to wait for cron or manual trigger)
- [ ] [iOS] Push notification card shows "install first" warning if not in standalone PWA mode

### Streak System
- [ ] [Desktop] Dashboard shows current streak count
- [ ] [Desktop] After practice session, streak increments
- [ ] [Desktop] Grace window: streak maintained within 36 hours of last practice
- [ ] [Desktop] Streak freeze: freeze shield consumed when grace expires (if available)
- [ ] [Desktop] Weekend pass: toggle in settings (behind parent gate), skips Fri/Sat

### PWA Behavior
- [ ] [Android] App install prompt appears, can install to home screen
- [ ] [Android] Installed PWA opens in standalone mode
- [ ] [Android] Games auto-lock to landscape orientation
- [ ] [iOS] Rotate prompt shows in portrait mode for games
- [ ] [All] Offline: app loads from cache when network unavailable (basic shell)
- [ ] [All] After deploy update: new version loads on refresh (sw cache bump)

---

## Section 6: i18n and RTL (QA-06)

- [ ] [Desktop] Language toggle accessible in settings
- [ ] [Desktop] Switching to Hebrew: UI text changes to Hebrew
- [ ] [Desktop] Hebrew mode: Dashboard layout is RTL (mirrored)
- [ ] [Desktop] Hebrew mode: Trail page is RTL (node positions mirror, tabs RTL)
- [ ] [Desktop] Hebrew mode: At least one game mode renders correctly in RTL
- [ ] [Desktop] Switching back to English: UI returns to LTR
- [ ] [Desktop] Accidental note names show Hebrew solfege terms in Hebrew mode

---

## Section 7: COPPA Deletion E2E (Cross-cutting)

Full pipeline test per D-08:

- [ ] [Desktop] Under-13 test account: navigate to Settings, request account deletion
- [ ] [Desktop] Deletion request shows 30-day grace period message
- [ ] [Desktop] Cancel deletion within grace period works
- [ ] [Desktop] Re-request deletion
- [ ] [Manual] Invoke process-account-deletions Edge Function against test account (set deletion_scheduled_at to past)
- [ ] [Manual] Verify: all student data rows deleted (scores, progress, goals, challenges, push_subscriptions, parent_subscriptions)
- [ ] [Manual] Verify: auth.users entry removed (login credentials no longer work)
- [ ] [Manual] Verify: parent receives confirmation email
- [ ] [Manual] Verify: re-running function on same account produces no errors (idempotent)

---

## Section 8: Results Summary

| Area | Total Cases | Pass | Fail | Skip | Notes |
|------|-------------|------|------|------|-------|
| Auth (QA-01) | 16 | | | | |
| Games (QA-02) | 24 | | | | |
| Payment (QA-03) | 5 | | | | |
| Trail (QA-04) | 13 | | | | |
| Push/Streak/PWA (QA-05) | 15 | | | | |
| i18n/RTL (QA-06) | 7 | | | | |
| COPPA E2E | 9 | | | | |
| **Total** | **89** | | | | |

### Blockers Found
<!-- Blockers per D-02: auth broken, data loss/corruption, payment charging incorrectly, COPPA violation, game mode fully unplayable -->
<!-- Format: B-01: [Section] [Device] Description | Repro steps -->

### Known Issues
<!-- Known issues per D-03: visual polish, edge-case glitches, "works but looks slightly off" -->
<!-- Format: KI-01: [Section] [Device] Description | Severity: Low/Medium -->

---

## Appendix: Free Node IDs Reference

The following trail node IDs are accessible without a subscription (from `src/config/subscriptionConfig.js`):

**Treble (7 nodes):** treble_1_1, treble_1_2, treble_1_3, treble_1_4, treble_1_5, treble_1_6, treble_1_7

**Bass (6 nodes):** bass_1_1, bass_1_2, bass_1_3, bass_1_4, bass_1_5, bass_1_6

**Rhythm (6 nodes):** rhythm_1_1, rhythm_1_2, rhythm_1_3, rhythm_1_4, rhythm_1_5, rhythm_1_6

**Boss (3 nodes):** boss_treble_1, boss_bass_1, boss_rhythm_1

**Total free nodes:** 22 of 171

All other nodes require an active subscription. When testing Section 3, pick any node with an ID not in this list to verify the paywall appears.

## Appendix: COPPA Deletion Manual Steps

To test the full COPPA hard-delete pipeline (Section 7, Manual items):

```sql
-- Step 1: Find the test account's student ID
SELECT id, email, created_at FROM auth.users WHERE email = 'your-test-account@example.com';

-- Step 2: Set deletion_scheduled_at to the past to bypass the 30-day wait
UPDATE students
SET deletion_requested_at = now() - INTERVAL '31 days',
    deletion_scheduled_at = now() - INTERVAL '1 day'
WHERE id = '<student-id-from-step-1>';

-- Step 3: Invoke the Edge Function via Supabase Dashboard > Edge Functions > process-account-deletions > Test
-- OR via CLI: supabase functions invoke process-account-deletions --data '{}'

-- Step 4: Verify deletion
SELECT * FROM auth.users WHERE email = 'your-test-account@example.com'; -- Should return 0 rows
SELECT * FROM students WHERE id = '<student-id>'; -- Should return 0 rows
SELECT * FROM students_score WHERE student_id = '<student-id>'; -- Should return 0 rows
SELECT * FROM student_skill_progress WHERE student_id = '<student-id>'; -- Should return 0 rows
SELECT * FROM push_subscriptions WHERE student_id = '<student-id>'; -- Should return 0 rows
```
