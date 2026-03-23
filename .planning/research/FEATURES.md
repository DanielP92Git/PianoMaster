# Feature Research

**Domain:** Daily instrument practice tracking for a children's piano education PWA
**Researched:** 2026-03-23
**Confidence:** MEDIUM-HIGH (competitor analysis from public sources; push notification platform
limits verified against MDN and Apple Developer forums; child psychology from peer-reviewed
research; iOS action-button gap confirmed from caniuse.com and Apple forums)

---

## Context: What This Research Answers

This replaces the v2.5 FEATURES.md. Scope is v2.7: adding **instrument practice tracking**
(yes/no daily logging, dedicated streak, XP rewards, interactive push notifications, parent
calendar heatmap, practice summary in weekly email) to an existing app that already has:
app-usage streaks, XP system, push notifications with COPPA parent gate, and weekly parent
email via Brevo.

The question is: among all possible practice-tracking features, which are table stakes, which
are differentiators, and which are anti-features — specifically for **8-year-old piano learners**
with **parents as the secondary audience**?

---

## Competitor Landscape

### What Modacity does (adult-focused practice journaling)
Modacity tracks cumulative practice minutes, consecutive practice days, session recordings, and
provides a "practice counter" showing total practice days and minutes. Premium tier exposes
full history log and statistics. Designed for adult/conservatory musicians. No parent-facing
features. No notification action buttons. Time-based logging (not yes/no).

### What Tonara does (teacher-student practice management)
Tonara listens via microphone, awards points for length and consistency of actual instrument
sound. Teacher assigns homework, app detects practice using audio pattern recognition. Streak
tracking with leaderboards. Designed for studio management — requires teacher subscription.
Too complex and costly for single-family piano apps.

### What Simply Piano does
Simply Piano detects note accuracy in real-time and tracks session completion. No explicit
daily yes/no logging — practice is inferred from game session completion. Parent visibility
is limited to in-app progress.

### What Duolingo does (the reference design for this app)
Duolingo's streak is the gold standard. Key behaviors:
- Single daily goal (any lesson counts)
- Streak freeze as loss-aversion protection
- 36-hour grace window (not midnight reset)
- Streak repair option (buy back missed day with gems)
- Separation between "streak" and "league XP" — two distinct progress axes
- Notification framing: "Your streak is in danger!" (loss aversion) not "Come practice!" (guilt)

**Key insight:** Duolingo does NOT distinguish between "used the app" and "actually learned."
This app has an opportunity to differentiate by tracking **real instrument practice** (away from
the app) separately from **app usage** — closing the loop that Duolingo leaves open.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features without which the v2.7 milestone feels incomplete or the product feels like it
missed the point.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Daily yes/no practice log (dashboard) | Practice tracking is the core promise of this milestone. Without a dashboard button, there is no way to log practice when notification is dismissed or not received. | LOW | Single `practice_logs` table row per student per day. Button shows today's status: unpracticed / practiced. Already have `ParentGateMath` and `useQuery` patterns to follow. |
| Dedicated practice streak counter | App-usage streak (from v1.9) tracks in-app activity. Practice streak tracks instrument practice — a distinct, more meaningful metric. Users need to see both clearly differentiated. | LOW | Separate `practice_streak` and `practice_streak_updated_at` columns on `students` or a dedicated `practice_streak_state` table. Same grace-window logic as existing streak service, but driven by `practice_logs` inserts rather than game sessions. |
| XP reward for logging practice | XP is the sole reward currency. Every meaningful action earns XP. Logging practice is a high-intent action that must be rewarded to signal its importance. | LOW | Call existing `award_xp()` Postgres function. Award once per day. Amount should be modest (25-30 XP) — meaningful but less than completing a trail node (50-150 XP), which prevents logging gaming. |
| "Did you practice today?" push notification | Separate from the existing "practice reminder" timer notification. This one arrives after practice time, asks for confirmation. Daily cadence, separate rate limit slot from existing notification. | MEDIUM | New `push_type: 'practice_checkin'` in push service. Separate scheduling logic. Must not conflict with existing 1/day `practice_reminder` rate limit — these are different intent categories. Send after expected practice time (configurable, default 18:00 local time). |
| Parent calendar heatmap | Parents are the paying customers. A GitHub-style heatmap showing 90 days of practice days vs. missed days is the primary parent-facing deliverable. Without it, parents cannot see the value. | MEDIUM | SVG-based React component. Green = practiced, gray = missed, no data = empty. Rolling 90-day window (not calendar-year). Mobile-friendly square grid. Data fetched from `practice_logs` table, aggregated by date. No library dependency needed — simple SVG grid is ~60 lines. |
| Weekend freeze (Shabbat pass) for practice streak | App streak already has weekend pass toggle (v1.9). Practice streak must respect the same setting. Inconsistent behavior between two streak systems will confuse parents. | LOW | Reuse `weekend_pass_enabled` flag from students table. Same Saturday skip logic already in `streakService.js`. Practice streak service mirrors existing streak service pattern exactly. |
| Practice summary in weekly parent email | Parents receive a weekly email already. Not adding practice data to it would make the email feel incomplete after v2.7. The Brevo integration already exists. | LOW | Add `days_practiced` (count of practice_logs this week) and a simple "practiced X of 7 days" sentence to the existing `send-weekly-report` Edge Function payload. No new email template — extend the existing one. |

### Differentiators (Competitive Advantage)

Features that set this practice tracker apart from generic habit apps and from Duolingo's
limited "used the app = practiced" model.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Interactive push notification action buttons ("Yes" / "No, skip today") | Instead of tapping the notification to open the app and then tapping a button, user can log directly from the notification shade. One-tap logging. This is what makes the "Did you practice?" push *interactive* rather than just informational. | HIGH | **Platform caveat (CRITICAL):** Chrome/Android supports `actions` in `showNotification()` via service worker. iOS Safari does NOT support custom notification actions — only a "View" button appears. `Notification.maxActions` is `undefined` on Safari/iOS per caniuse.com. Must implement graceful fallback: action buttons for Chrome/Android, tap-to-open-app for iOS. Service worker `notificationclick` handler must check `event.action` for 'yes'/'skip' and call Supabase directly from SW context, OR open app with `?log_practice=yes` URL param for iOS path. |
| Retroactive logging for yesterday only | Children miss logging after a busy day. A "did you practice yesterday?" backdating window (24-48 hours back, same-day-only-if-missed, no further back) prevents streak loss from forgetfulness without enabling gaming. | MEDIUM | Retroactive window: allow logging for yesterday if yesterday has no log entry AND today is within the 36-hour grace window already used by the app streak. Only show "Log yesterday" UI when the condition is true. This prevents players from logging back 7 days to manufacture streaks — a well-known gamification abuse pattern. |
| Milestone celebrations for practice streak (5, 10, 21, 30, 50 days) | The XP ring and level-up system celebrate in-app progress. Practice streaks deserve equivalent celebration — but separate and distinct, so they feel earned. 21 days is the "habit formation" milestone. 30 days is a month. | LOW | Reuse existing tiered celebration system (VictoryScreen is already milestone-aware). Check practice streak value after each log; if it matches a milestone, trigger standard celebration. Child-appropriate milestones (5, 10, 21, 30 days) differ from adult milestone conventions. |
| Practice card on dashboard with streak flame | Dashboard already shows app-usage streak and XP. A dedicated "Piano Practice" card showing today's status (practiced / not yet) and the current practice streak number + flame icon gives 8-year-olds an immediately visible daily goal. | LOW | New `PracticeCard` component following existing `DailyGoals`/`StreakDisplay` glassmorphism pattern. Shows: flame icon, streak count, "practiced today" checkmark or "not yet" prompt, "Log Practice" button if not logged. |
| Child-appropriate heatmap coloring (not GitHub green) | GitHub's gray-to-green scheme is designed for developers, not children. For 8-year-olds, the heatmap should use the app's purple/indigo palette with gold/star indicators for milestones. Empty days should be neutral gray (not red/pink, which implies failure). | LOW | CSS-only change to heatmap component. Use `bg-indigo-300` for practice days, `bg-white/10` for non-practice days, `bg-yellow-400` for milestone streak days. No library needed. |
| Practice heatmap accessible in parent portal | Parent portal already exists for subscription management. Adding a "Practice History" tab gives parents a natural place to check the heatmap without navigating through child game flows. | LOW | Add tab or section to existing `/parent-portal` page. Reuse heatmap component built for the parent-facing view. Data fetched server-side from `practice_logs` filtered by `student_id`. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Mic-verified practice detection (like Tonara) | "Prove they practiced" — parents want accountability | Requires always-on microphone access, raises COPPA privacy concerns (what is being recorded?), breaks on headphones/MIDI. Tonara requires teacher subscription and dedicated setup. For a yes/no checkbox, the trust model is sufficient. Teachers verify at lessons. | Honor system yes/no log. The XP reward is modest enough that gaming it provides little advantage. Parent heatmap creates social accountability. |
| Practice duration logging (how many minutes) | More data seems more useful | 8-year-olds cannot reliably self-report duration. Adds friction to logging ("Did you practice? Yes. How long? ...uh...") which reduces log completion. Modacity found duration logging is a premium/adult feature with high drop-off for younger users. | Simple yes/no is more honest and more reliable. Duration can be estimated later from teacher-assigned practice time. |
| Practice quality rating (1-5 stars) | "Good practice vs bad practice" | Even harder for 8-year-olds than duration. Introduces self-judgment at a developmental age where negative self-evaluation of practice quality is counterproductive. Reduces the positive habit loop. | Streak + XP reward positive completion regardless of quality. Teacher evaluates quality at lessons. |
| Push notification reply text input ("I practiced for 20 minutes") | Richer data collection via notification | Text input in push notifications requires `type: 'text'` in notification actions — even less supported than action buttons. Not supported on iOS at all. Creates a data moderation burden (free-text input from children). | Action buttons only (yes/no), with app fallback for iOS. |
| Notification frequency escalation (2x if they haven't practiced by 7pm) | Higher recall rate | Re-notifying users is aggressive and annoying for children and parents. Existing 1/day rate limit was set deliberately in v1.9. Multiple notifications = uninstall trigger for parents managing shared devices. | Single daily check-in notification at the configured time. Parent can see the heatmap to know if the child practiced. |
| Social practice streak leaderboard ("top practicers this week") | Competitive motivation | COPPA prohibits social comparison without verifiable parental consent. Shaming children who don't practice (because they're sick, traveling, etc.) is psychologically harmful. Tonara's global leaderboard is designed for consenting adult studios, not COPPA-protected children. | Private streaks + milestone celebrations. Teachers can see all students' data and create class accountability through their own dashboards. |
| Streak repair / buy-back with XP | Removes loss-aversion frustration | XP is not currently spendable anywhere in the app. Introducing spendable XP just for streak repair creates an unbalanced economy. It also rewards inactivity (save XP, then use it when you miss days). Existing freeze shield model is sufficient. | Practice streak freezes via weekend pass + retroactive yesterday-only logging window covers the legitimate "I forgot to log" cases. |
| Streak reset mercy (never actually reset) | Kids get upset when streak resets | Removes the meaningful signal that drives behavior. Duolingo research explicitly shows that streaks that can never break have no motivating power. The protection must have limits to have value. | Grace window + weekend pass + retroactive logging = three protective layers. Comeback XP bonus when streak breaks. These are proportionate without removing consequence. |

---

## Feature Dependencies

```
Practice Log (yes/no)
    └──requires──> practice_logs DB table (NEW)
    └──requires──> RLS policies: student writes own rows, parent reads child's rows (NEW)
    └──feeds──> Practice Streak calculation
    └──feeds──> XP award (via award_xp())
    └──feeds──> Parent calendar heatmap data
    └──feeds──> Weekly email practice summary

Practice Streak
    └──requires──> Practice Log exists
    └──requires──> weekend_pass_enabled flag (EXISTS in students table from v1.9)
    └──mirrors──> existing streakService.js pattern (36-hour grace, freeze shields)
    └──distinct from──> App-usage streak (separate columns/service, not same metric)

Interactive Push Notification Action Buttons
    └──requires──> Practice Log API callable from service worker (must be stateless HTTP call)
    └──requires──> Notification.maxActions platform detection (Chrome: 2, iOS Safari: 0)
    └──fallback──> Open app with ?log_practice=yes query param (iOS path)
    └──extends──> existing sw.js notificationclick handler

Parent Calendar Heatmap
    └──requires──> practice_logs data (90-day window)
    └──lives in──> /parent-portal page (tab addition, no new route)
    └──reuses──> existing glassmorphism card pattern

Retroactive Yesterday Logging
    └──requires──> Practice Log exists (for checking yesterday's row)
    └──requires──> grace window logic (mirrors existing streakService.js)
    └──conflicts with──> unlimited backdating (intentionally blocked at service layer)

Weekly Email Practice Summary
    └──requires──> practice_logs table (to aggregate this-week count)
    └──extends──> send-weekly-report Edge Function (add practice section to payload)
    └──reuses──> existing Brevo email template (add rows, not new template)

XP Reward for Practice Logging
    └──requires──> Practice Log (triggers award)
    └──calls──> existing award_xp() Postgres function
    └──constraint──> once-per-day guard (same practice_logs row insert triggers it)
    └──distinct from──> trail node XP (different source, same currency)
```

### Dependency Notes

- **Practice log is the root dependency.** All other features (streak, XP, heatmap, notifications, email) depend on `practice_logs` table existing with correct RLS. Build this first.
- **Push notification action buttons require platform detection** and a graceful iOS fallback. Do not build the interactive path without first confirming Chrome behavior and iOS fallback both work. iOS represents a significant share of this app's target users (PWA on iOS was specifically mentioned in PROJECT.md).
- **Practice streak is a new streak, not the existing streak.** The v1.9 app-usage streak should remain unchanged. The practice streak is a separate counter. Both must be visible on the dashboard but clearly labeled.
- **XP award must be idempotent.** The `practice_logs` table insert should be the trigger for XP award. If a second insert is attempted for the same student+day, the RLS UNIQUE constraint prevents double-awarding without needing application-level guards.

---

## MVP Definition

### Launch With (v2.7 core)

Minimum viable feature set that makes the milestone meaningful:

- [ ] `practice_logs` table with RLS (student writes own, parent reads) — all other features depend on it
- [ ] Practice log button on dashboard (today's status: "not yet" or "practiced") — primary logging surface
- [ ] Dedicated practice streak counter on dashboard, labeled distinctly from app-usage streak
- [ ] XP reward for daily practice log (25-30 XP, once per day)
- [ ] Weekend freeze (reuse `weekend_pass_enabled` flag from existing streak system)
- [ ] Parent calendar heatmap in parent portal (90-day rolling window, indigo/gray color scheme)
- [ ] Practice summary in weekly parent email (extend existing `send-weekly-report`)
- [ ] "Did you practice today?" push notification (separate notification type, configurable send time)

### Add After Validation (v2.7.x)

Once core logging and streak are working:

- [ ] Interactive notification action buttons (Chrome/Android only) — add after confirming core notification flow works first
- [ ] Retroactive yesterday-only logging — add as a grace feature once the UI flow is established
- [ ] Milestone celebrations (5, 10, 21, 30 days) — easy add-on to existing celebration system

### Future Consideration (v3+)

- [ ] Teacher view of all students' practice heatmaps — requires teacher dashboard expansion
- [ ] Duration logging (optional, adult path) — only if research shows meaningful engagement gain
- [ ] SMS summary for parents without push (Brevo SMS tier) — requires phone number collection

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `practice_logs` DB table + RLS | HIGH (foundation) | LOW | P1 |
| Practice log button on dashboard | HIGH (daily action surface) | LOW | P1 |
| Practice streak counter (dashboard) | HIGH (habit visibility) | LOW | P1 |
| XP reward for logging | HIGH (reward loop closure) | LOW | P1 |
| Weekend freeze for practice streak | MEDIUM (consistency with existing streak) | LOW | P1 |
| Parent calendar heatmap | HIGH (parent retention value) | MEDIUM | P1 |
| Practice summary in weekly email | MEDIUM (parent context) | LOW | P1 |
| "Did you practice?" push notification | HIGH (daily habit trigger) | MEDIUM | P1 |
| Interactive push action buttons | MEDIUM (convenience, Chrome only) | HIGH | P2 |
| Retroactive yesterday logging | MEDIUM (reduces streak anxiety) | MEDIUM | P2 |
| Practice milestone celebrations | LOW (delight feature) | LOW | P2 |
| Practice card with streak flame (dashboard) | HIGH (visual habit anchor) | LOW | P1 |

**Priority key:**
- P1: Required for v2.7 to feel complete
- P2: Meaningful improvement, add when core is stable
- P3: Nice to have, future consideration

---

## Child Psychology Considerations

These are not optional — they directly affect whether the feature succeeds with 8-year-olds.

**Positive reinforcement only.** The heatmap must NOT use red/orange for missed days. For
8-year-olds, red = bad grade = shame. Use neutral gray for missed days (not yet logged) and
indigo/green for practiced. This is backed by Dweck's growth mindset research: framing missed
days as "not yet" rather than "failure" preserves motivation.

**Loss aversion works, but proportionately.** Duolingo's research confirms streaks work for
children. However, for 8-year-olds, the distress from streak loss is disproportionate compared
to adults. The grace window + weekend pass + retroactive logging provides three protective
layers that reduce anxiety without eliminating the streak's motivating signal.

**Instant visual feedback is more motivating than statistics.** Children cannot interpret
"you practiced 23% more this month than last month." A streak number (8 days!) and a filled
heatmap square are cognitively immediate. The calendar heatmap is a visual narrative: each
green square is a daily win, and rows of green squares tell a story the child can point to.

**The notification must feel caring, not nagging.** Message framing matters enormously for
children. "Did you practice today? Tap to let us know!" is inviting. "You haven't practiced
yet today!" is guilt-inducing. The push notification copy must be framed as a positive check-in,
not a reminder of failure. This aligns with how the existing app-usage streak notification was
designed in v1.9.

**8-year-olds do not self-report accurately.** The honor system (yes/no) is appropriate for
their age because: (a) they are not motivated to cheat — the reward (25-30 XP) is modest, (b)
parents see the heatmap and verify at music lessons, (c) requiring proof (mic detection) adds
friction that kills habit formation at this age.

**Milestones at 5/10/21/30 days, not 7/30/60.** Adult habit trackers use weekly and monthly
milestones. For 8-year-olds, 5 days is achievable fast (first week of school) and 21 days aligns
with the popular "21 days to form a habit" concept that children encounter in school settings.
These feel reachable and special, unlike 30/60/90 which feel far away.

---

## Push Notification Action Buttons: Technical Reality

This feature is marked P2 (not P1) because of significant platform fragmentation:

| Platform | Action Button Support | Behavior |
|----------|-----------------------|----------|
| Chrome (desktop) | YES — up to 2 buttons | `event.action` in `notificationclick` works reliably |
| Chrome for Android | YES — up to 2 buttons | `event.action` works; app may be in background |
| Firefox desktop | YES (restored in v151+) | Intermittent historical support; now works |
| Safari macOS | NO | No `actions` support confirmed by MDN |
| Safari iOS (PWA) | NO | Only "View" button shown; custom actions silently dropped |
| Samsung Internet | YES | Partial, similar to Chrome |

**For this app:** The target audience uses iPhones and Android tablets. iOS is a first-class
platform here (the app has explicit iOS PWA handling in multiple components). Notification action
buttons will NOT work for iOS users. The fallback (tap notification body → opens app →
shows log dialog) must be the primary flow with action buttons as a Chrome/Android enhancement.

**Implementation pattern:**
```javascript
// In sw.js notificationclick handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.notification.data?.practiceCheckin;
  if (action && event.action === 'yes') {
    // Chrome/Android path: log directly from SW via fetch()
    event.waitUntil(
      fetch('/api/practice-log', { method: 'POST', ... })
    );
  } else {
    // iOS path / body tap: open app with log param
    event.waitUntil(
      clients.openWindow('/?log_practice=yes')
    );
  }
});
```

The service worker cannot use Supabase client directly. It must call a Supabase Edge Function
or use the Supabase REST API directly with the user's JWT (which must be embedded in the push
payload data). Security: the JWT approach requires careful handling — store the access token
in the push notification `data` object only if it's fresh (< 1 hour old), otherwise force the
app-open path.

---

## Competitor Feature Analysis

| Feature | Modacity | Tonara | Duolingo | Our v2.7 Approach |
|---------|----------|--------|----------|------------------|
| Daily practice logging | Time-based (minutes tracked) | Mic-detected session | App-usage only (not instrument) | Yes/no honor system — fastest to log, works offline |
| Practice streak | Consecutive days counter (premium) | Points + leaderboard | Daily streak (universal) | Separate practice streak, distinct from app-usage streak |
| Parent visibility | None | Teacher only (not parent) | None | Calendar heatmap in parent portal + weekly email |
| Push notification | Reminders only (no action) | Not documented | "Your streak is in danger!" (loss aversion) | "Did you practice?" + yes/no action buttons (Chrome), tap-to-open (iOS) |
| Weekend handling | None | None | Streak freeze (purchasable) | Weekend pass (toggle, reuses v1.9 Shabbat feature) |
| Child-specific design | No (adult tool) | No (teacher tool) | Partially (Kid mode) | Yes — 8-year-old milestone days, positive framing, no red coloring |
| XP reward | No (different reward model) | Points (separate system) | XP (same model) | 25-30 XP via existing award_xp(), consistent with existing economy |

---

## Sources

- [Modacity features review (ensembleschools.com)](https://www.ensembleschools.com/blog/apps-for-musicians/)
- [Modacity Ultimate Guide (akbradley.com)](https://akbradley.com/2023/03/08/how-to-practice-piano-with-modacity-the-ultimate-guide/)
- [Tonara music practice features](https://www.tonara.com/homepage/)
- [Tonara in piano studios (topmusic.co)](https://topmusic.co/6-ways-to-save-time-with-tonara-in-your-piano-studio/)
- [Notification.actions — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Notification/actions)
- [Notification.maxActions caniuse.com](https://caniuse.com/mdn-api_notification_maxactions_static) — confirms no Safari/iOS support
- [Apple Developer Forums: Does Web Push Notification Actions work on iOS 16.4](https://developer.apple.com/forums/thread/726793) — confirms iOS action buttons unsupported
- [Notification Actions in Chrome 48 — Chrome Developers](https://developer.chrome.com/blog/notification-actions)
- [Notification behavior — web.dev](https://web.dev/articles/push-notifications-notification-behaviour)
- [PWA on iOS limitations 2025 (brainhub.eu)](https://brainhub.eu/library/pwa-on-ios)
- [Duolingo streak builds habit — Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)
- [Psychology of Duolingo streak system (Medium)](https://medium.com/@patricia-smith/the-psychology-behind-duolingos-addictive-learning-streak-system-ce29c5374d36)
- [Habit formation and learning in young children (moneyadviceservice 2013)](https://altorwealth.com/wp-content/uploads/2024/04/the-money-advice-service-habit-formation-and-learning-in-young-children-may2013.pdf)
- [Progress bars and visual rewards psychology (cohorty.app)](https://blog.cohorty.app/progress-bars-and-visual-rewards-psychology/)
- [react-calendar-heatmap — npm](https://www.npmjs.com/package/react-calendar-heatmap) — SVG implementation reference
- [Digital Behavior Change Intervention Designs for Habit Formation — JMIR 2024](https://www.jmir.org/2024/1/e54375)

---
*Feature research for: v2.7 Instrument Practice Tracking — daily logging, practice streak, XP rewards, interactive push, parent heatmap*
*Researched: 2026-03-23*
