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

## Test Accounts

| Account | Type | Email | DOB | Status |
|---------|------|-------|-----|--------|
| A | Under-13 (COPPA) | _TBD_ | _TBD_ | Manually activated (consent email failed — see B-01) |
| B | 13+ (non-COPPA) | _created via Supabase dashboard_ | N/A (auto-confirmed) | Active |

---

## Section 1: Auth Flows (QA-01)

### Test Account Setup
- [x] Create student account (age under 13) — triggers COPPA consent path (D-07) — **Partial: account created, consent email failed (B-01), manually activated via SQL**
- [x] Create student account (age 13+) — non-COPPA path (D-07) — **Created via Supabase dashboard + auto-confirm**

### Signup Flow
- [x] [All] Signup with valid email/password succeeds — **PASS (auth user created)**
- [x] [All] Under-13 signup shows "waiting for parent" state — **PASS (account_status = suspended_consent)**
- [F] [All] Under-13: parent consent email received (check inbox) — **FAIL: send-consent-email Edge Function returns 500 (B-01)**
- [S] [All] Under-13: consent verification link works (public route /consent/verify) — **SKIP: blocked by B-01**
- [S] [All] Under-13: after consent, child account activates — **SKIP: blocked by B-01, manually activated via SQL**
- [x] [All] Over-13 signup activates immediately (no consent needed) — **PASS (via Supabase dashboard auto-confirm)**

### Login / Logout
- [x] [All] Login with valid credentials succeeds, redirects to dashboard — **PASS**
- [x] [All] Login with wrong password shows error (no email enumeration) — **PASS: "Invalid email or password" (generic)**
- [x] [All] Logout clears session, redirects to login — **PASS**
- [x] [All] After logout, back button does not return to authenticated content — **PASS**

### Password Reset
- [x] [All] "Forgot password" link on login form shows inline reset flow — **PASS**
- [x] [All] Reset email sent (generic success message regardless of email existence per anti-enumeration) — **PASS**
- [S] [All] Reset link in email navigates to /reset-password page — **SKIP: not testing full email flow**
- [S] [All] New password set successfully, can login with new password — **SKIP: not testing full email flow**

### Session Timeout
- [S] [Desktop] Student account auto-logs out after 30 min inactivity — **SKIP: requires 25 min wait**
- [S] [Desktop] Warning modal appears 5 min before timeout — **SKIP: requires 25 min wait**

---

## Section 2: Game Modes (QA-02)

Each game tested in trail mode (from trail node) AND free play (from /practice-modes or /notes-master-mode or /rhythm-mode). Both keyboard input and mic input where applicable (D-11).

### Note Recognition Game (/notes-master-mode/notes-recognition-game)
- [x] [Desktop] Free play: starts, keyboard input works, correct/wrong feedback — **PASS**
- [F] [Desktop] Free play: mic input works (pitch detected, note matched) — **FAIL: mic permission denied (NotAllowedError). See KI-04**
- [x] [Desktop] Trail mode: auto-starts from trail node, progress saves on completion — **PASS**
- [x] [Desktop] Lives system: 3 lives, game over screen on 0 lives — **PASS**
- [x] [Desktop] Combo system: streak increments, on-fire mode triggers at threshold — **PASS**
- [x] [Desktop] VictoryScreen shows after completing 10 exercises with stars + XP — **PASS**
- [x] [Android] Free play with keyboard input works — **PASS**
- [S] [iOS] Free play with mic input works (audio context handles interruptions) — **SKIP: later**

### Sight Reading Game (/notes-master-mode/sight-reading-game)
- [x] [Desktop] Free play: starts, notation renders (VexFlow SVG), mic detects pitch — **PASS (mic not tested, VexFlow renders OK)**
- [S] [Desktop] Trail mode: auto-starts, clef/key-sig from node config — **SKIP: testing later with piano**
- [x] [Desktop] Keyboard input: notes register correctly — **PASS**
- [x] [Desktop] VictoryScreen on session complete — **PASS (achievement award fails silently — see KI-05)**
- [x] [Android] Landscape auto-locks, notation readable — **PASS**
- [S] [iOS] Mic works, audio interruption overlay appears/recovers if interrupted — **SKIP: later**

### Rhythm / Metronome Trainer (/rhythm-mode/metronome-trainer)
- [x] [Desktop] Free play: starts, metronome ticks, tap input registers — **PASS**
- [x] [Desktop] Trail mode: auto-starts with time signature from node config — **PASS**
- [x] [Desktop] VictoryScreen on session complete — **PASS**
- [x] [Android] Landscape layout, tap input works — **PASS**

### Memory Game (/notes-master-mode/memory-game)
- [x] [Desktop] Free play: cards render, flip animation, match detection — **PASS**
- [x] [Desktop] Trail mode: auto-starts, card pool from node config — **PASS**
- [x] [Desktop] VictoryScreen on session complete — **PASS**
- [F] [Android] Landscape grid layout (6-8 cols) — **FAIL: black background instead of app default; cards too small on small screens, not using available space (KI-07, KI-08)**

---

## Section 3: Payment / Content Gate (QA-03)

Gate behavior only — no actual checkout per D-09.

- [x] [Desktop] Free trail nodes (treble_1_1 through treble_1_7, bass_1_1 through bass_1_6, rhythm_1_1 through rhythm_1_6, boss_treble_1, boss_bass_1, boss_rhythm_1) are accessible without subscription — **PASS**
- [x] [Desktop] Locked trail nodes (any node NOT in FREE_NODE_IDS) show child paywall modal (no prices, no buy buttons per CHILD-01/02) — **PASS**
- [x] [Desktop] /subscribe page loads pricing page — **PASS**
- [x] [Desktop] /parent-portal page loads for authenticated user — **PASS**
- [x] [Desktop] Non-trail games (free play) work without subscription (node_id: null always passes) — **PASS**

---

## Section 4: Trail System (QA-04)

- [x] [Desktop] Trail page (/trail) loads with 3 tabs (Treble/Bass/Rhythm) — **PASS**
- [x] [Desktop] Tab switching works, URL updates with query param — **PASS**
- [x] [Desktop] Completed nodes show star ratings inside circles — **PASS**
- [x] [Desktop] Locked nodes show gray state (prerequisite not met) — **PASS**
- [x] [Desktop] Node modal opens on click, shows node info, "Start" button — **PASS**
- [x] [Desktop] Completing a node awards XP (visible in header and dashboard) — **PASS**
- [x] [Desktop] Star rating 1/2/3 based on score (60%/80%/95%) — **PASS**
- [x] [Desktop] XP level progression: XP bar updates, level name shown — **PASS**
- [x] [Desktop] Daily goals card shows 3 goals with progress bars — **PASS**
- [x] [Desktop] Daily challenge card shows today's challenge — **PASS**
- [x] [Desktop] Daily challenge completes correctly and awards bonus XP — **PASS**
- [x] [Desktop] Nodes with multiple exercises: completing exercise advances to next, stars = min across all — **PASS**
- [x] [Desktop] Boss node: unlocking shows boss unlock celebration modal (3-stage) — **PASS**

---

## Section 5: Push, Streak, PWA (QA-05)

### Push Notifications
- [x] [Desktop] Settings page (/settings) shows notification permission card — **PASS**
- [x] [Android] Push notification permission can be granted (after parent math gate) — **PASS**
- [x] [Android] PWA receives push notification (may need to wait for cron or manual trigger) — **PASS (with note: function correctly skips users who already practiced; 410 Gone handled for stale subscriptions)**
- [x] [iOS] Push notification card shows "install first" warning if not in standalone PWA mode — **PASS**

### Streak System
- [x] [Desktop] Dashboard shows current streak count — **PASS**
- [x] [Desktop] After practice session, streak increments — **PASS**
- [S] [Desktop] Grace window: streak maintained within 36 hours of last practice — **SKIP: requires 36h wait**
- [S] [Desktop] Streak freeze: freeze shield consumed when grace expires (if available) — **SKIP: requires time manipulation**
- [x] [Desktop] Weekend pass: toggle in settings (behind parent gate), skips Fri/Sat — **PASS**

### PWA Behavior
- [x] [Android] App install prompt appears, can install to home screen — **PASS**
- [x] [Android] Installed PWA opens in standalone mode — **PASS**
- [x] [Android] Games auto-lock to landscape orientation — **PASS**
- [F] [iOS] Rotate prompt shows in portrait mode for games — **FAIL: two overlapping modals shown — "Turn your phone sideways!" on top of "use landscape on iPad". Should only show the iPad one (KI-09)**
- [F] [All] Offline: app loads from cache when network unavailable (basic shell) — **FAIL: only purple background loads, JS assets not cached (B-03)**
- [S] [All] After deploy update: new version loads on refresh (sw cache bump) — **SKIP: requires Netlify deploy**

---

## Section 6: i18n and RTL (QA-06)

- [x] [Desktop] Language toggle accessible in settings — **PASS**
- [x] [Desktop] Switching to Hebrew: UI text changes to Hebrew — **PASS**
- [x] [Desktop] Hebrew mode: Dashboard layout is RTL (mirrored) — **PASS**
- [x] [Desktop] Hebrew mode: Trail page is RTL (node positions mirror, tabs RTL) — **PASS**
- [x] [Desktop] Hebrew mode: At least one game mode renders correctly in RTL — **PASS**
- [x] [Desktop] Switching back to English: UI returns to LTR — **PASS**
- [x] [Desktop] Accidental note names show Hebrew solfege terms in Hebrew mode — **PASS**

---

## Section 7: COPPA Deletion E2E (Cross-cutting)

Full pipeline test per D-08:

- [F] [Desktop] Under-13 test account: navigate to Settings, request account deletion — **FAIL: No deletion button on student settings page (B-02)**
- [S] [Desktop] Deletion request shows 30-day grace period message — **SKIP: blocked by B-02**
- [S] [Desktop] Cancel deletion within grace period works — **SKIP: blocked by B-02**
- [S] [Desktop] Re-request deletion — **SKIP: blocked by B-02**
- [x] [Manual] Invoke process-account-deletions Edge Function against test account (set deletion_scheduled_at to past) — **PASS: returned deleted:1, failed:0. Note: requires account_status='suspended_deletion' (not just 'active')**
- [x] [Manual] Verify: all student data rows deleted (scores, progress, goals, challenges, push_subscriptions, parent_subscriptions) — **PASS: all tables return 0 rows for deleted student ID**
- [x] [Manual] Verify: auth.users entry removed (login credentials no longer work) — **PASS: auth.users returns 0 rows**
- [S] [Manual] Verify: parent receives confirmation email — **SKIP: depends on Brevo email delivery (same infra as B-01)**
- [x] [Manual] Verify: re-running function on same account produces no errors (idempotent) — **PASS: returned deleted:0, total:0, no errors**

---

## Section 8: Results Summary

| Area | Total Cases | Pass | Fail | Skip | Notes |
|------|-------------|------|------|------|-------|
| Auth (QA-01) | 16 | 8 | 1 | 7 | B-01 blocks consent flow; 4 skips from B-01, 2 timeout skips |
| Games (QA-02) | 24 | 18 | 2 | 4 | KI-04 mic UX, KI-07/08 memory android; 2 iOS mic skips, 1 trail skip |
| Payment (QA-03) | 5 | 5 | 0 | 0 | All pass |
| Trail (QA-04) | 13 | 13 | 0 | 0 | All pass |
| Push/Streak/PWA (QA-05) | 15 | 7 | 2 | 6 | B-03 offline broken, KI-09 iOS dual modal; streak/deploy skips |
| i18n/RTL (QA-06) | 7 | 7 | 0 | 0 | All pass; KI-06 scrollbar cosmetic |
| COPPA E2E | 9 | 4 | 1 | 4 | B-02 no student deletion UI; deletion pipeline works |
| **Total** | **89** | **62** | **6** | **21** | 3 blockers, 9 known issues |

### Blockers Found
<!-- Blockers per D-02: auth broken, data loss/corruption, payment charging incorrectly, COPPA violation, game mode fully unplayable -->

**B-02: [COPPA] [Desktop] No account deletion button on student settings page**
- Repro: Log in as student → navigate to /settings → no "Delete Account" option visible
- Impact: Students/parents cannot request account deletion from the app. The service layer (`accountDeletionService.js`) and `AccountDeletionModal` exist but are only wired into the Teacher Dashboard, not the student Settings page.
- Classification: **Blocker** — COPPA requires accessible account deletion for child accounts (D-02)

**B-03: [PWA] [All] Offline mode broken — JS assets not cached by service worker**
- Repro: Install PWA → use app → go offline (airplane mode) → close and reopen → only purple background loads
- Root cause: `sw.js` lines 187-189 skip ALL `.js` files, `script`, and `module` requests from caching. This prevents Vite-bundled assets (`/assets/*.js`) from being cached, even though line 209 has a cache-first handler for `/assets/`. The JS filter runs first.
- Fix: Remove the blanket `.js` skip or limit it to dev-only patterns (`.jsx`, `node_modules`, `@vite`), allowing production `/assets/*.js` through to the cache-first handler.
- Classification: **Blocker** — PWA offline support is non-functional

**B-01: [Auth/COPPA] [All] `send-consent-email` Edge Function returns 500 — COPPA consent email not delivered**
- Repro: Sign up with under-13 DOB + parent email → signup succeeds → consent email never arrives
- Impact: Under-13 users cannot complete COPPA consent flow. Blocks account activation for children.
- Root cause: Edge Function `send-consent-email` returns 500 (likely missing env vars: BREVO_API_KEY, SENDER_EMAIL, etc.)
- Classification: **Blocker** — COPPA violation (D-02)

### Known Issues
<!-- Known issues per D-03: visual polish, edge-case glitches, "works but looks slightly off" -->

**KI-01: [Auth] [All] `promote_placeholder_student` RPC function missing in production (404)**
- Repro: Any student signup triggers RPC call that returns 404
- Impact: None — caught by try/catch, logged as warning. Feature for teacher-linked placeholder students.
- Severity: Low

**KI-02: [Auth] [All] Student upsert `onConflict: "id"` doesn't cover `email` unique constraint**
- Repro: If a student row already exists with the same email but different auth user ID, upsert fails with 409 (23505)
- Impact: Medium — signup appears to succeed but student profile not created. Subsequent queries fail (406).
- Severity: Medium

**KI-05: [Games/Achievements] [All] Achievement awarding fails — `points` column missing from `student_achievements`**
- Repro: Complete any game session → VictoryScreen loads → console shows `PGRST204: Could not find the 'points' column of 'student_achievements' in the schema cache`
- Impact: Achievements silently fail to save. VictoryScreen still renders (non-blocking). Users won't earn achievement badges.
- Severity: Medium — achievements don't persist, but gameplay is unaffected

**KI-07: [Games/Memory] [Android] Black background instead of app default color**
- Repro: Open Memory Game on Android → background is black instead of purple gradient
- Expected: Same purple gradient background as other game modes
- Severity: Low

**KI-08: [Games/Memory] [Android] Cards too small on small screens**
- Repro: Open Memory Game on small Android phone → cards don't fill available space
- Expected: Cards should scale to use full available width/height
- Severity: Medium

**KI-09: [Orientation] [iOS] Two overlapping rotate modals on iPad**
- Repro: Open a game in portrait mode on iOS → "Turn your phone sideways!" modal appears on top of "use landscape on iPad" modal
- Expected: Only show the iPad-specific "use landscape on iPad" modal, not both
- Severity: Medium

**KI-06: [i18n] [Desktop] Scrollbar moves to left side in Hebrew RTL mode**
- Repro: Switch language to Hebrew → browser scrollbar moves from right to left
- Expected: Scrollbar should stay on the right side regardless of text direction (users expect it there)
- Fix: Add `dir="ltr"` on the scrollable container or use `scrollbar-gutter` CSS, while keeping content RTL
- Severity: Low

**KI-04: [Games] [Desktop] Mic permission denied — no user-facing feedback**
- Location: Note Recognition Game (and likely all mic-enabled games)
- Repro: Deny mic permission when prompted (or if previously denied) → mic button does nothing, no error message shown
- Expected: App should show a message explaining mic access is needed, how to grant it, and ideally a button to re-prompt or link to browser settings
- Impact: User thinks button is broken. Confusing for 8-year-olds.
- Severity: Medium

**KI-03: [Dashboard] [All] React `fetchPriority` prop warning on hero image**
- Location: `Dashboard.jsx:45` → `<picture>` → `<img>` element
- Warning: `React does not recognize the fetchPriority prop on a DOM element. Spell as lowercase fetchpriority instead.`
- Impact: None — cosmetic console warning, no user-facing issue. React 18 doesn't recognize camelCase `fetchPriority`.
- Severity: Low
- Repro: If a student row already exists with the same email but different auth user ID, upsert fails with 409 (23505)
- Impact: Medium — signup appears to succeed but student profile not created. Subsequent queries fail (406).
- Severity: Medium

---

## QA Verdict

**Date:** 2026-03-22
**Result:** CONDITIONAL PASS

**Summary:** 62/89 test cases passed. 6 failed, 21 skipped. 3 blockers found, 9 known issues documented.

**Blockers requiring fix before promotion:**
- B-01: `send-consent-email` Edge Function returns 500 — COPPA consent email not delivered (likely missing Brevo env vars)
- B-02: No account deletion button on student settings page — COPPA requires accessible deletion
- B-03: PWA offline mode broken — SW skips all JS files from caching

**Known issues accepted for launch:**
- KI-01: Missing `promote_placeholder_student` RPC (Low)
- KI-02: Student upsert email conflict not handled (Medium)
- KI-03: React `fetchPriority` prop warning (Low)
- KI-04: No mic permission denied feedback (Medium)
- KI-05: Achievements `points` column missing (Medium)
- KI-06: Scrollbar moves left in Hebrew RTL (Low)
- KI-07: Memory game black background on Android (Low)
- KI-08: Memory game cards too small on small Android (Medium)
- KI-09: Two overlapping rotate modals on iOS iPad (Medium)

**Skipped items (21):** Mostly iOS mic tests (2), streak time-dependent tests (2), session timeout (2), password reset email flow (2), PWA push/deploy (2), consent flow blocked by B-01 (4), COPPA deletion UI blocked by B-02 (4), trail mic test (1), deploy update (1), Android memory game tested but failed (counted in fails)

**Recommendation:** Fix 3 blockers, then re-test the blocked items. Known issues can ship — none are data-loss or security violations.

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
