---
phase: 15-production-qa
plan: 02
status: complete
started: 2026-03-22
completed: 2026-03-22
---

## Summary

Executed 89-item QA checklist against production deployment (https://testpianomaster.netlify.app) across Desktop Chrome, Android PWA, and iOS Safari. 62 passed, 6 failed, 21 skipped.

## Verdict: CONDITIONAL PASS

3 blockers must be fixed before promoting to real users.

## Key Results

### Blockers (3)

| ID | Area | Description |
|----|------|-------------|
| B-01 | Auth/COPPA | `send-consent-email` Edge Function returns 500 — consent email not delivered |
| B-02 | COPPA | No account deletion button on student settings page |
| B-03 | PWA | Offline mode broken — SW skips all JS files from caching |

### Known Issues (9)

| ID | Severity | Description |
|----|----------|-------------|
| KI-01 | Low | Missing `promote_placeholder_student` RPC in production |
| KI-02 | Medium | Student upsert `onConflict: "id"` doesn't cover email unique constraint |
| KI-03 | Low | React `fetchPriority` prop warning on Dashboard hero image |
| KI-04 | Medium | No user-facing feedback when mic permission denied |
| KI-05 | Medium | Achievements `points` column missing from `student_achievements` table |
| KI-06 | Low | Scrollbar moves to left side in Hebrew RTL mode |
| KI-07 | Low | Memory game black background on Android |
| KI-08 | Medium | Memory game cards too small on small Android screens |
| KI-09 | Medium | Two overlapping rotate modals on iOS iPad |

### Sections Passed Clean

- Payment / Content Gate (QA-03): 5/5
- Trail System (QA-04): 13/13
- i18n and RTL (QA-06): 7/7

### Skipped Items (21)

- iOS mic input (2) — hardware not available during test
- Streak grace/freeze (2) — requires time manipulation
- Session timeout (2) — requires 25 min wait
- Password reset email flow (2) — skipped full email round-trip
- Consent flow items (4) — blocked by B-01
- COPPA deletion UI items (4) — blocked by B-02
- Deploy update (1) — requires Netlify deploy
- Other (4) — Android push receipt, trail mic test

## Deviations

- Account B (13+) created via Supabase Dashboard auto-confirm instead of normal signup flow
- Account A (under-13) manually activated via SQL after consent email failed (B-01)
- COPPA deletion tested via SQL + Edge Function invocation (student deletion UI missing — B-02)
- Push notification tested but subscription was stale (410 Gone) — function logic verified correct

## Key Files

### Modified
- `.planning/milestones/v2.5-phases/15-production-qa/QA-CHECKLIST.md` — full results

### Referenced
- `public/sw.js` — offline caching bug (B-03)
- `src/features/authentication/useSignup.js` — signup flow issues (KI-01, KI-02)
- `src/services/consentService.js` — consent email flow (B-01)
- `src/services/accountDeletionService.js` — deletion service exists but no student UI (B-02)
