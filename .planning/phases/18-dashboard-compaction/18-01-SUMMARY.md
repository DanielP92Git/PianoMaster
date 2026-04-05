---
phase: 18-dashboard-compaction
plan: 01
subsystem: ui
tags: [react, dashboard, glassmorphism, i18n, tailwind, lucide-react, supabase-edge-functions]

# Dependency graph
requires:
  - phase: 17-navigation-restructuring
    provides: Trail as primary landing page; PlayNextButton hero CTA decision
provides:
  - Glass greeting bar replacing hero image on student dashboard
  - Compact dashboard layout with space-y-4 card spacing
  - Recordings practice tool with Headphones icon
  - Practice check-in URL corrected to /dashboard path
affects: [dashboard, push-notifications, i18n, trail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Glass greeting bar strip: bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg with flex items-center gap-3"
    - "Compact skeleton: h-14 rounded-xl bg-white/10 for greeting bar placeholder"
    - "Level pill in flex row: px-3 symmetric padding (no negative margin needed when text separates avatar and pill)"

key-files:
  created: []
  modified:
    - src/components/layout/Dashboard.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
    - supabase/functions/send-daily-push/index.ts

key-decisions:
  - "Hero image section removed; greeting bar is a glass card strip (not full-width hero)"
  - "PlayNextButton, OnboardingTour, Fireflies removed from Dashboard.jsx (component files preserved)"
  - "Practice Tools third button renamed from History/Piano to Recordings/Headphones per D-10, D-11"
  - "Greeting bar level pill uses px-3 symmetric padding instead of -ml-7/pl-5 overlap (no adjacent avatar)"
  - "Card spacing reduced to space-y-4 (16px) from space-y-12 per D-06"
  - "Practice check-in URL updated to /dashboard in both Dashboard.jsx replaceState and Edge Function"

patterns-established:
  - "Glass greeting bar: 48px avatar + flex-1 greeting text + level pill — RTL via direction style on container"
  - "Compact skeleton: single h-14 strip for greeting, no hero skeleton blocks"

requirements-completed: [DASH-01, DASH-02, DASH-03]

# Metrics
duration: 5min
completed: 2026-04-05
---

# Phase 18 Plan 01: Dashboard Compaction Summary

**Hero section removed, replaced with compact glass greeting bar (avatar + name + level pill) with tighter card spacing and Recordings practice tool**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-05T00:22:00Z
- **Completed:** 2026-04-05T00:27:47Z
- **Tasks:** 1 of 2 complete (Task 2 is visual verification checkpoint)
- **Files modified:** 4

## Accomplishments
- Removed hero image section (220-260px), Fireflies, PlayNextButton, OnboardingTour from Dashboard.jsx
- Inserted glass greeting bar as first card: 48px avatar linked to /avatars, "Hi, {name}!" text, gradient level pill
- Tightened main content wrapper from `space-y-12 pt-6` to `space-y-4 pt-4`
- Replaced loading skeleton hero block with compact greeting bar strip (`h-14 rounded-xl bg-white/10`)
- Updated Practice Tools third entry from History/Piano to Recordings/Headphones icon
- Added `recordings` i18n key to en and he locales under `dashboard.practiceTools.cards`
- Fixed practice check-in URL: `replaceState({}, "", "/dashboard")` and Edge Function data URL
- Build passes cleanly; pre-existing test failures (env vars, AudioContext mock) confirmed unrelated

## Task Commits

1. **Task 1: Dashboard.jsx comprehensive compact redesign** - `b53ded0` (feat)
2. **Task 2: Visual verification** — awaiting human checkpoint

**Plan metadata:** pending (after checkpoint approval)

## Files Created/Modified
- `src/components/layout/Dashboard.jsx` - Hero removed, glass greeting bar added, compact skeleton, Recordings tool, URL fixes
- `src/locales/en/common.json` - Added `recordings` key under `dashboard.practiceTools.cards`
- `src/locales/he/common.json` - Added `recordings` Hebrew key under `dashboard.practiceTools.cards`
- `supabase/functions/send-daily-push/index.ts` - Updated push URL to `/dashboard?practice_checkin=1`

## Decisions Made
- Level pill uses `px-3` symmetric padding in the greeting bar flex row (avatar and pill are separated by greeting text, so the `-ml-7` overlap used in the hero is not needed)
- Kept `history` i18n key as backward safety fallback; added `recordings` key alongside it
- All removed component files (Fireflies.jsx, PlayNextButton.jsx, OnboardingTour.jsx) are preserved — only import/usage in Dashboard.jsx removed

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- Pre-existing test failures in 5 test files (VITE_SUPABASE_URL env var not set in test runner, AudioContext mock missing, AppSettings element not found) — all confirmed unrelated to dashboard changes, all were present before this work.

## Known Stubs
None — all dashboard cards are wired to real data sources. Greeting bar uses live XP/level data from `useQuery["student-xp"]` and profile data from `useUserProfile`.

## Next Phase Readiness
- Visual verification needed at `http://localhost:5174/dashboard` (Task 2 checkpoint)
- After approval, STATE.md and ROADMAP.md will be finalized
- No blockers for continuation

---
*Phase: 18-dashboard-compaction*
*Completed: 2026-04-05*
