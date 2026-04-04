# Phase 18: Dashboard Compaction - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Dashboard is redesigned as a compact stats/overview hub rather than the app's front door. The large hero image and PlayNextButton CTA are removed, replaced with a compact greeting bar. Card spacing is tightened. All existing dashboard cards are retained and functional.

Requirements covered: DASH-01, DASH-02, DASH-03

</domain>

<decisions>
## Implementation Decisions

### Hero Removal & Greeting Bar

- **D-01:** Remove the entire hero section (background image, dark gradient overlay, Fireflies animation, `<picture>` element)
- **D-02:** Replace hero with a **glass card greeting bar** (`bg-white/10 backdrop-blur-md border border-white/20`) containing avatar + name + level pill
- **D-03:** Greeting bar shows: avatar (linked to /avatars), "Hi, {name}!" greeting, and the existing level pill with gradient border effect

### PlayNextButton Removal

- **D-04:** Remove PlayNextButton from the dashboard entirely (DASH-02). Delete the `nextNode` query and the PlayNextButton render block. The component file itself can remain (may be useful elsewhere) but is no longer imported in Dashboard.jsx.

### Card Layout & Density

- **D-05:** Keep single-column layout (`max-w-2xl`)
- **D-06:** Reduce card gaps from `space-y-12` (48px) to `space-y-4` or `space-y-6` (16-24px)
- **D-07:** All existing cards retained: DailyMessageBanner, UnifiedStatsCard, PracticeLogCard, Practice Tools, PushOptInCard, DailyChallengeCard, DailyGoalsCard, WeeklySummaryCard
- **D-08:** Card ordering stays the same as current

### Practice Tools

- **D-09:** Practice Tools section stays as a standalone section (3 circular buttons with heading)
- **D-10:** Rename "History" button label to "Recordings"
- **D-11:** Change the History/Recordings button icon from Piano to a more representative icon (Mic, Headphones, or similar)

### Recordings Access

- **D-12:** The existing Practice Tools "Recordings" button (formerly "History") linking to `/practice-sessions` is sufficient for mobile recordings access. No additional card or link needed.

### Loading Skeleton

- **D-13:** Update the loading skeleton to match the new compact layout (remove hero skeleton, add greeting bar skeleton)

### Onboarding Tour

- **D-14:** Remove OnboardingTour from Dashboard.jsx

### DailyMessageBanner

- **D-15:** Keep DailyMessageBanner as-is — no styling changes needed

### Practice Check-in URL

- **D-16:** Update push notification URL from `/?practice_checkin=1` to `/dashboard?practice_checkin=1` in the Edge Function (`send-daily-push`)
- **D-17:** Update `window.history.replaceState` in Dashboard.jsx to clean URL to `/dashboard` instead of `/`

### Claude's Discretion

- Loading skeleton design: Claude matches it to the final compact layout
- Onboarding Tour relocation: Claude decides whether to move OnboardingTour to TrailMapPage in this phase or defer to a future phase
- Exact gap size (`space-y-4` vs `space-y-6`): Claude picks what looks best
- Recordings icon choice: Claude picks between Mic, Headphones, or other Lucide icon

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dashboard Components

- `src/components/layout/Dashboard.jsx` — Main dashboard component (849 lines), hero section, PlayNextButton render, card composition, practice check-in URL handler
- `src/components/dashboard/PlayNextButton.jsx` — Hero CTA being removed from dashboard
- `src/components/dashboard/UnifiedStatsCard.jsx` — Stats card (XP ring, streak, goals)
- `src/components/dashboard/DailyMessageBanner.jsx` — Daily fun fact banner
- `src/components/dashboard/PracticeLogCard.jsx` — Practice log card
- `src/components/dashboard/DailyChallengeCard.jsx` — Daily challenge card
- `src/components/dashboard/DailyGoalsCard.jsx` — Daily goals card
- `src/components/dashboard/WeeklySummaryCard.jsx` — Weekly summary card
- `src/components/dashboard/PushOptInCard.jsx` — Push notification opt-in card
- `src/components/dashboard/XPRing.jsx` — XP progress ring (used by UnifiedStatsCard)

### Onboarding

- `src/components/onboarding/OnboardingTour.jsx` — Onboarding tour component (currently rendered in Dashboard.jsx)
- `src/hooks/useOnboarding.js` — Onboarding state hook

### Push Notifications

- `supabase/functions/send-daily-push/index.ts` — Edge Function that generates push notification URLs (practice_checkin param)

### Design System

- `docs/DESIGN_SYSTEM.md` — Glassmorphism patterns, glass card pattern

### Phase 17 Context (predecessor)

- `.planning/phases/17-navigation-restructuring/17-CONTEXT.md` — Nav restructuring decisions (trail as home, dashboard at /dashboard)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Glass card pattern: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl` — used across dashboard cards, apply to greeting bar
- Level pill with gradient border: Already exists in Dashboard.jsx hero section (lines 654-676) — extract and reuse in greeting bar
- Avatar + accessories rendering: Already exists in hero (lines 622-653) — move to greeting bar
- Lucide icons: `Headphones` or `ListMusic` available as alternatives to `Piano` for the recordings button

### Established Patterns

- All dashboard cards are already individual components in `src/components/dashboard/`
- Practice Tools section uses staggered motion animation with `reducedMotion` respect
- All student-specific sections are gated with `{isStudent && ...}`

### Integration Points

- `Dashboard.jsx` hero section (lines 581-688): Remove entirely, replace with greeting bar
- `Dashboard.jsx` PlayNextButton (lines 695-703): Remove render block and `nextNode` query (lines 146-154)
- `Dashboard.jsx` skeleton (lines 504-531): Update to match compact layout
- `Dashboard.jsx` Practice Tools data (lines 534-574): Update "history" tool label and icon
- `Dashboard.jsx` practice_checkin handler (line 115): Change `replaceState` URL from `/` to `/dashboard`
- `supabase/functions/send-daily-push/index.ts`: Update notification click URL

</code_context>

<specifics>
## Specific Ideas

- The greeting bar glass card should feel like a thin strip, not a full card — compact horizontal layout with avatar on the left, name/greeting center-left, level pill right
- The level pill code from the current hero can be directly reused — it already has the gradient border effect with prestige support

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 18-dashboard-compaction_
_Context gathered: 2026-04-05_
