# Phase 21: Celebration & Reporting Upgrades - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Give students a richer view of their weekly accomplishments via a dashboard summary card, surface personal pride moments on VictoryScreen when they beat their own records, add daily variety through rotating music fun-fact greetings, and give parents a weekly email summary through existing Brevo infrastructure. No new game mechanics, no new trail content, no new celebrations system — this phase adds reporting and variety to existing surfaces.

</domain>

<decisions>
## Implementation Decisions

### Weekly Summary Card (PROG-04)
- Rolling 7-day window (not Monday-to-Sunday) — always shows last 7 days from today
- Primary stat: days practiced (count of distinct days with at least one score)
- Additional stats: Claude's discretion — pick 1-2 more meaningful stats from available data (XP earned, nodes completed, stars earned)
- Card placement: below DailyGoalsCard on Dashboard
- Simple milestone highlight when all 7 days practiced (e.g., golden border or celebratory message)
- Follow existing glass card pattern (bg-white/10 backdrop-blur-md)

### Personal Bests (PROG-05)
- Trigger: best score percentage on the same trail node (compare current score vs previous best)
- Trail nodes only — no personal best tracking for free practice games
- Only triggers when a previous record is beaten — first completion does NOT show personal best (it already has star reveal + XP celebration)
- Display: inline badge near the score display on VictoryScreen — visible but doesn't overshadow stars/XP
- Data source: compare against `students_score` table entries for the same node_id

### Varied Login Messages (PROG-06)
- Tone: music fun facts ("Did you know? Beethoven practiced 4 hours a day!")
- At least 10 distinct messages per the PROG-06 spec
- Placement: below the hero/avatar area on Dashboard, above PLAY NEXT button
- Rotation: random selection from pool, store yesterday's message index in localStorage to prevent same-day repeat
- i18n: English + Hebrew translations for all messages

### Parent Weekly Email (PROG-07)
- Opt-in: reuse push notification parent consent (`push_subscriptions.parent_consent_granted = true`)
- Parent email source: `students.parent_email` (set during COPPA consent flow)
- Data included: days practiced, current streak, plus Claude's discretion for additional stats (new nodes completed, current level)
- Tone: warm & encouraging, positive framing celebrating effort
- Email branding: match existing consent email template (same purple gradient header, PianoMaster branding, table-based HTML layout)
- Unsubscribe link in every email — needs a mechanism to opt out (new column or token-based unsubscribe endpoint)
- Trigger: weekly cron job (Monday morning) via pg_cron, similar to send-daily-push pattern
- New Edge Function: `send-weekly-report` using Brevo API (same pattern as `send-consent-email`)
- Security: verify_jwt = false, x-cron-secret header authentication (same as send-daily-push)

### Claude's Discretion
- Exact weekly summary card layout and which 1-2 additional stats to include
- Personal best badge visual design (animation, icon, colors)
- Email content layout and which additional stats beyond days practiced + streak
- How to implement unsubscribe mechanism (token-based link vs. new DB column)
- Number of fun fact messages (minimum 10, can go higher if natural)

</decisions>

<specifics>
## Specific Ideas

- PROG-06 spec reference: "Did you know? Beethoven practiced 4 hours a day!" as example message
- Weekly email should feel like a proud parent moment — "Great week for your child!" not "Your child's metrics"
- Personal best badge should be subtle enough to not compete with existing VictoryScreen celebrations (star reveal, XP animation, level-up, boss unlock)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `send-consent-email/index.ts`: Brevo API Edge Function with HTML email template, CORS headers, table-based layout — direct pattern for weekly report email
- `send-daily-push/index.ts`: Cron-triggered Edge Function with x-cron-secret auth — direct pattern for weekly cron job
- `DailyGoalsCard.jsx`: Glass card component on Dashboard — weekly card should match this pattern
- `UnifiedStatsCard.jsx`: Stats card with gradient border — could inform weekly summary visual style
- `celebrationMessages.js` + `celebrationTiers.js`: Existing celebration system in VictoryScreen — personal best badge integrates alongside these

### Established Patterns
- Dashboard queries: useQuery with staleTime, refetchInterval — weekly card follows same pattern
- Glass card: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl` — universal for inner pages
- i18n: `useTranslation(['common', 'trail'])` with EN/HE locale files
- Edge Functions: Deno runtime, service role Supabase client, CORS headers
- localStorage for UI state: existing pattern for push opt-in dismiss, rotate prompt dismiss

### Integration Points
- Dashboard.jsx: Add weekly summary card below DailyGoalsCard, add greeting message below hero
- VictoryScreen.jsx: Add personal best detection and badge display near score section
- `students_score` table: Query for best_score comparison (MAX(score) WHERE node_id = X)
- `students.parent_email`: Source for weekly email recipient
- `push_subscriptions.parent_consent_granted`: Opt-in gate for weekly email
- `supabase/functions/`: New `send-weekly-report` Edge Function directory
- `src/locales/en/common.json` + `src/locales/he/common.json`: New i18n keys for fun facts and weekly card

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-celebration-reporting-upgrades*
*Context gathered: 2026-03-07*
