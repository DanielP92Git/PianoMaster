# Phase 5: Milestone Celebrations - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Students see a celebration moment when their instrument practice streak reaches a meaningful milestone (5, 10, 21, or 30 days). The celebration reuses existing celebration infrastructure (ConfettiEffect) but uses a lightweight modal overlay — NOT the full VictoryScreen (which is a page-level game-end component). Each milestone triggers at most once per streak.

</domain>

<decisions>
## Implementation Decisions

### Celebration Trigger
- **D-01:** Celebration triggers in PracticeLogCard after the logPractice mutation succeeds and updatePracticeStreak returns the new streak count. The check happens in the mutation's `onSuccess` callback — compare newStreakCount against milestone thresholds [5, 10, 21, 30].
- **D-02:** Celebration only fires when `newStreakCount` exactly equals a milestone threshold AND the milestone has not already been celebrated (prevents re-triggering on page reload or re-render).

### Presentation Style
- **D-03:** Lightweight modal overlay — NOT full VictoryScreen. VictoryScreen is a page-level game-end component (stars, XP breakdown, next exercise) — too heavy and contextually wrong for a dashboard interaction.
- **D-04:** Use existing `ConfettiEffect` component for visual flair on the overlay. Same confetti system used in VictoryScreen and BossUnlockModal.
- **D-05:** Modal is always skippable — tap anywhere or press Escape to dismiss. Auto-dismiss after 4 seconds. Respects reduced-motion (skip confetti, instant show/hide).

### Milestone Tracking (Once-Per-Streak)
- **D-06:** Add `last_milestone_celebrated` INTEGER column (default 0) to `instrument_practice_streak` table via migration. Stores the highest milestone already celebrated in the current streak.
- **D-07:** Celebration triggers when `streakCount >= milestone AND milestone > last_milestone_celebrated`. After showing, update `last_milestone_celebrated` to the new milestone value.
- **D-08:** When streak resets (breaks), `last_milestone_celebrated` resets to 0. This happens naturally — updatePracticeStreak already resets streak_count to 1 on a gap, and should also reset last_milestone_celebrated.

### Visual & Copy
- **D-09:** Emerald/green theme consistent with practice card accent (emerald-400 border, green confetti tint). NOT amber/orange (that's app-usage streak) or indigo/purple (that's XP).
- **D-10:** Modal content: milestone badge icon (trophy or star from lucide-react), streak count number prominently displayed, encouraging message text. Messages vary by milestone tier (5-day = encouraging, 30-day = epic).
- **D-11:** Full EN/HE translations for all celebration messages and milestone labels.

### Claude's Discretion
- **D-12:** Exact celebration message copy per milestone tier — Claude picks the best kid-friendly wording.
- **D-13:** Modal animation timing and easing — Claude picks appropriate values using existing `useMotionTokens` patterns.
- **D-14:** Whether `last_milestone_celebrated` update happens client-side (optimistic) or via a dedicated service call — Claude picks the cleanest approach.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Celebration Infrastructure
- `src/components/celebrations/ConfettiEffect.jsx` — Existing confetti component (reuse for milestone celebrations)
- `src/components/celebrations/BossUnlockModal.jsx` — Reference for modal overlay pattern with celebration effects
- `src/utils/celebrationTiers.js` — Tier determination logic (reference for celebration intensity levels)
- `src/utils/celebrationMessages.js` — Existing celebration message patterns

### Practice Card & Streak
- `src/components/dashboard/PracticeLogCard.jsx` — The card where celebrations are triggered from (mutation onSuccess callback)
- `src/services/practiceStreakService.js` — Practice streak service (updatePracticeStreak returns new streakCount)
- `src/services/practiceLogService.js` — Practice log service (logPractice mutation)

### Database
- `supabase/migrations/` — Migration naming convention and existing instrument_practice_streak table schema

### Accessibility & Motion
- `src/utils/useMotionTokens.js` — Reduced-motion tokens for skipping animations
- `src/contexts/AccessibilityContext.jsx` — Accessibility settings (high contrast, reduced motion)

### i18n
- `src/locales/en/common.json` — English translations (add under `practice.milestone.*` namespace)
- `src/locales/he/common.json` — Hebrew translations

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ConfettiEffect.jsx` — Drop-in confetti overlay, accepts `tier` prop for intensity. Already respects reduced-motion.
- `BossUnlockModal.jsx` — Pattern for modal overlay with celebration effects (3-stage modal with backdrop, z-[10000]). Good structural template.
- `useMotionTokens` hook — Animation duration/easing tokens with reduced-motion support.
- `PracticeLogCard.jsx` — Has mutation `onSuccess` callback where celebration trigger fits naturally.

### Established Patterns
- Celebration modals: fixed overlay with backdrop blur, centered content, auto-dismiss timer
- Dashboard card mutations: `useMutation` with `onSuccess` callback pattern, `queryClient.invalidateQueries` for cache refresh
- Streak service: `updatePracticeStreak(localDate, weekendPassEnabled)` returns `{ streakCount }` — add `lastMilestoneCelebrated` to return shape
- Migration naming: `YYYYMMDD000001_description.sql`

### Integration Points
- `PracticeLogCard.jsx` — Add milestone check in logPractice mutation's `onSuccess`, render celebration modal conditionally
- `practiceStreakService.js` — Extend `updatePracticeStreak` to read/write `last_milestone_celebrated`, include in return value
- `supabase/migrations/` — New migration adding `last_milestone_celebrated` column to `instrument_practice_streak`
- `locales/` — New keys under `practice.milestone.*`

</code_context>

<specifics>
## Specific Ideas

- Milestone thresholds: [5, 10, 21, 30] — same as roadmap success criteria
- 21-day milestone aligns with habit formation psychology (meaningful for parents too)
- 30-day milestone is the "epic" tier — biggest celebration, most effusive message
- Auto-dismiss keeps the flow lightweight — child taps "Yes I practiced" and gets a celebration without needing to navigate away or interact with a complex screen

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-milestone-celebrations*
*Context gathered: 2026-03-24*
