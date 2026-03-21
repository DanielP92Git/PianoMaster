# Phase 15: Production QA - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Execute a documented pass/fail QA checklist across all critical user flows on the production deployment (testpianomaster.netlify.app). Every flow must have an explicit result — nothing assumed working. This is verification, not new feature work.

</domain>

<decisions>
## Implementation Decisions

### Bug Handling Policy
- **D-01:** Two-tier system: **Blockers** (must fix before promoting to real users) and **Known Issues** (document and ship)
- **D-02:** Blockers = auth broken, data loss/corruption, payment charging incorrectly, COPPA violation, any game mode fully unplayable
- **D-03:** Known Issues = visual polish, edge-case glitches, "works but looks slightly off" on one browser — documented with severity but not gate-blocking

### Device & Browser Matrix
- **D-04:** 3 test targets: Desktop Chrome, Android phone (Chrome/PWA), iOS Safari
- **D-05:** No Firefox/Edge testing required — React + Tailwind handles cross-browser; risky platform-specific APIs (orientation lock, audio context, push) are covered by the 3 targets
- **D-06:** Android tests landscape lock, PWA install, push notifications; iOS tests audio interruption recovery, mic handling, rotate prompt

### Test Account Strategy
- **D-07:** Create 2 fresh test accounts — one student under 13 (COPPA path) and one student over 13 (non-COPPA path)
- **D-08:** COPPA E2E: use the under-13 account, request deletion, then manually invoke the hard-delete Edge Function to verify the full pipeline
- **D-09:** Payment: verify gate behavior only (locked nodes show paywall, free nodes accessible) — skip actual Lemon Squeezy checkout; webhook + subscription flow already tested in v1.8

### Checklist Scope (from requirements)
- **D-10:** QA-01: Auth flows — signup, login, logout, password reset, COPPA consent
- **D-11:** QA-02: All 4 game modes (note recognition, sight reading, rhythm, memory) in trail mode AND free play, with keyboard AND mic input
- **D-12:** QA-03: Payment — content gate enforcement on locked vs free nodes, child paywall modal
- **D-13:** QA-04: Trail — progression, node unlocking, XP awarding, star ratings, daily goals, daily challenge
- **D-14:** QA-05: Push notifications, streak system (grace/freeze/weekend pass), PWA behavior (install, offline fallback, orientation)
- **D-15:** QA-06: i18n — English + Hebrew toggle, RTL layout on dashboard, trail, and at least one game mode
- **D-16:** QA-07: All critical-path items pass on production deployment

### Claude's Discretion
- Checklist document format and organization (grouping, ordering)
- Exact granularity of test cases within each QA area
- How to structure pass/fail recording (checkboxes, table, etc.)
- Order of testing across devices

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Success Criteria
- `.planning/REQUIREMENTS.md` — QA-01 through QA-07 define acceptance criteria
- `.planning/ROADMAP.md` §Phase 15 — 5 success criteria that must all be TRUE

### Auth & COPPA Flows
- `src/services/authService.js` — Signup, login, logout, password reset
- `src/services/accountDeletionService.js` — Soft-delete request flow (request, cancel, status)
- `supabase/functions/process-account-deletions/index.ts` — Hard-delete Edge Function (Phase 14)
- `supabase/functions/send-consent-email/index.ts` — COPPA consent email

### Game Modes
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — Note recognition
- `src/components/games/sight-reading-game/SightReadingGame.jsx` — Sight reading
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — Rhythm training
- `src/components/games/notes-master-games/MemoryGame.jsx` — Memory game

### Trail & Progression
- `src/data/skillTrail.js` — 93 base nodes + expanded nodes
- `src/services/skillProgressService.js` — Progress CRUD
- `src/services/dailyGoalsService.js` — Daily goals
- `src/services/dailyChallengeService.js` — Daily challenge
- `src/utils/xpSystem.js` — XP levels and awarding

### Payment & Subscription
- `src/config/subscriptionConfig.js` — FREE_NODE_IDS, isFreeNode()
- `src/components/trail/TrailNodeModal.jsx` — Paywall display for locked nodes

### Push, Streak, PWA
- `src/services/notificationService.js` — Push notification client
- `src/services/streakService.js` — Streak protection logic
- `public/sw.js` — Service worker (cache, offline, push)
- `src/hooks/useLandscapeLock.js` — Android landscape lock
- `src/hooks/useRotatePrompt.js` — iOS rotate prompt

### i18n
- `src/locales/en/` — English translations
- `src/locales/he/` — Hebrew translations

### Deployment
- Production URL: `https://testpianomaster.netlify.app`

</canonical_refs>

<specifics>
## Specific Ideas

- Test the full COPPA deletion pipeline end-to-end: create under-13 account -> parent consent -> request deletion -> invoke hard-delete function -> verify auth credentials no longer work -> verify confirmation email received
- Hebrew RTL must be verified on dashboard, trail page, and at least one game mode (success criterion 5)
- All 4 game modes must be tested with both keyboard and mic input (success criterion 4)
- Android PWA-specific: test install prompt, landscape auto-lock in games, push notification receipt
- iOS Safari-specific: test audio context interruption recovery, mic error overlay, rotate prompt

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-production-qa*
*Context gathered: 2026-03-21*
