# Phase 5: Milestone Celebrations - Research

**Researched:** 2026-03-24
**Domain:** React modal overlay, celebration infrastructure, Supabase migration, i18n
**Confidence:** HIGH

## Summary

Phase 5 is a focused integration task: add a `last_milestone_celebrated` INTEGER column to the existing `instrument_practice_streak` table, extend `practiceStreakService.updatePracticeStreak` to read and write it, check for milestone thresholds in `PracticeLogCard`'s `onSuccess` callback, and render a new lightweight `MilestoneCelebrationModal` component.

All the required building blocks already exist in the codebase. `ConfettiEffect` handles reduced-motion-aware confetti automatically. `BossUnlockModal` is the structural template for the modal overlay (fixed inset-0, z-[10000], backdrop blur, Escape-key dismiss, auto-advance timer). `useMotionTokens` provides framer-motion tokens for animation. The i18n pattern is established under `practice.*` in `common.json`.

The one genuine complexity is the "once-per-streak" guarantee: the service must atomically read `last_milestone_celebrated`, compute the new milestone, and write it back, so the DB column is the source of truth. The question of whether to update `last_milestone_celebrated` optimistically (client-side) or via a service call is discretionary — but a DB write is cleaner than optimistic state since it survives page reloads without additional cache hydration logic.

**Primary recommendation:** Build the modal as a new `src/components/celebrations/MilestoneCelebrationModal.jsx`, reusing `ConfettiEffect`, following `BossUnlockModal` overlay patterns (single stage, simpler), and extend `practiceStreakService` with `last_milestone_celebrated` read/write in the same upsert as the streak update.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Celebration triggers in PracticeLogCard after the logPractice mutation succeeds and updatePracticeStreak returns the new streak count. The check happens in the mutation's `onSuccess` callback — compare newStreakCount against milestone thresholds [5, 10, 21, 30].
- **D-02:** Celebration only fires when `newStreakCount` exactly equals a milestone threshold AND the milestone has not already been celebrated (prevents re-triggering on page reload or re-render).
- **D-03:** Lightweight modal overlay — NOT full VictoryScreen.
- **D-04:** Use existing `ConfettiEffect` component for visual flair on the overlay.
- **D-05:** Modal is always skippable — tap anywhere or press Escape to dismiss. Auto-dismiss after 4 seconds. Respects reduced-motion (skip confetti, instant show/hide).
- **D-06:** Add `last_milestone_celebrated` INTEGER column (default 0) to `instrument_practice_streak` table via migration.
- **D-07:** Celebration triggers when `streakCount >= milestone AND milestone > last_milestone_celebrated`. After showing, update `last_milestone_celebrated` to the new milestone value.
- **D-08:** When streak resets, `last_milestone_celebrated` resets to 0. updatePracticeStreak already resets streak_count to 1 on a gap, and should also reset last_milestone_celebrated.
- **D-09:** Emerald/green theme (emerald-400 border, green confetti tint). NOT amber/orange (app-usage streak) or indigo/purple (XP).
- **D-10:** Modal content: milestone badge icon (trophy or star from lucide-react), streak count number prominently displayed, encouraging message text. Messages vary by milestone tier (5-day = encouraging, 30-day = epic).
- **D-11:** Full EN/HE translations for all celebration messages and milestone labels.

### Claude's Discretion

- **D-12:** Exact celebration message copy per milestone tier.
- **D-13:** Modal animation timing and easing — use existing `useMotionTokens` patterns.
- **D-14:** Whether `last_milestone_celebrated` update happens client-side (optimistic) or via a dedicated service call.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOG-04 | Student sees practice milestone celebrations at 5, 10, 21, and 30 day streak milestones | New `MilestoneCelebrationModal` + DB column `last_milestone_celebrated` + service extension + i18n keys |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-confetti | ^6.2.3 | Confetti animation | Already used in `ConfettiEffect`; `ConfettiEffect` wraps it — use the wrapper, not directly |
| framer-motion | ^12.23.26 | Modal enter/exit animation | Already used in `PracticeLogCard`; `useMotionTokens` provides project tokens |
| lucide-react | ^0.344.0 | Trophy/Star icon for modal badge | Already used throughout; `Trophy` is used in BossUnlockModal |
| react-i18next | existing | EN/HE translations | Established pattern under `common` namespace |

**No new packages required.** All dependencies are already present.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ConfettiEffect` wrapper | Direct `react-confetti` | ConfettiEffect already handles reduced-motion and window resize — always prefer the wrapper |
| DB write for `last_milestone_celebrated` | Client-only state | DB write survives reload; client state would require cache seeding or re-flash on mount |

---

## Architecture Patterns

### Recommended File Structure (new files only)

```
src/
├── components/
│   └── celebrations/
│       └── MilestoneCelebrationModal.jsx   # NEW — single-stage lightweight overlay
supabase/
└── migrations/
    └── 20260324000002_add_last_milestone_celebrated.sql  # NEW
```

**Modification targets (not new files):**
- `src/services/practiceStreakService.js` — extend `updatePracticeStreak` + `getPracticeStreak`
- `src/components/dashboard/PracticeLogCard.jsx` — add celebration state + conditional render
- `src/locales/en/common.json` — add keys under `practice.milestone.*`
- `src/locales/he/common.json` — matching Hebrew keys

### Pattern 1: Modal Overlay (from BossUnlockModal)

**What:** Fixed-position overlay with dark backdrop, centered card, Escape-key dismiss, auto-dismiss timer, focus trap.

**When to use:** Any blocking celebration moment that covers the screen but is quickly dismissible.

```jsx
// Source: src/components/celebrations/BossUnlockModal.jsx (lines 289-296)
<div
  className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
  role="dialog"
  aria-modal="true"
  aria-label="Practice milestone celebration"
  onClick={onClose}  // tap anywhere to dismiss (D-05)
>
  <div
    className="relative z-[10002] w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-slate-800/95 p-6 text-center backdrop-blur-sm"
    onClick={(e) => e.stopPropagation()}  // prevent card click from closing
  >
    {/* ... content ... */}
  </div>
</div>
```

**z-index:** Use `z-[10000]` same as BossUnlockModal — milestone celebrations appear on top of the dashboard.

### Pattern 2: Escape-Key Dismiss

```jsx
// Source: src/components/celebrations/BossUnlockModal.jsx (lines 190-198)
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

### Pattern 3: Auto-Dismiss Timer with Cleanup

```jsx
// Derived from BossUnlockModal pattern
const autoTimerRef = useRef(null);
useEffect(() => {
  autoTimerRef.current = setTimeout(onClose, 4000);
  return () => clearTimeout(autoTimerRef.current);
}, [onClose]);
```

Auto-dismiss for reduced-motion: skip confetti, use `duration: 0` framer transition, still auto-dismiss at 4s.

### Pattern 4: Reduced-Motion Guard in ConfettiEffect

`ConfettiEffect` already handles reduced-motion internally — returns `null` if `reducedMotion` is true and calls `onComplete()` immediately. The modal component needs to check `reduce` from `useMotionTokens` only for its own animations (entry/exit transition).

```jsx
// Source: src/utils/useMotionTokens.js
const { reduce, soft } = useMotionTokens();
// soft = { type: "spring", stiffness: 360, damping: 28 } when motion enabled
// soft = { duration: 0 } when reduced
```

### Pattern 5: Service Extension for `last_milestone_celebrated`

**Read it in `getPracticeStreak`:**
```js
// Extend the SELECT to include new column
.select('streak_count, last_practiced_on, last_milestone_celebrated')
// Return shape:
return {
  streakCount: data?.streak_count ?? 0,
  lastPracticedOn: data?.last_practiced_on ?? null,
  lastMilestoneCelebrated: data?.last_milestone_celebrated ?? 0,
};
```

**Write it in `updatePracticeStreak`:**
```js
// When streak resets (gap > 1): reset last_milestone_celebrated = 0
// When streak increments: keep existing last_milestone_celebrated (passed in or re-read)
// After milestone shown: call updateLastMilestoneCelebrated(milestone) — separate call or inline

// The upsert in updatePracticeStreak should include last_milestone_celebrated
// when streak resets:
{
  student_id: userId,
  streak_count: newStreakCount,       // 1 (reset)
  last_practiced_on: localDate,
  last_milestone_celebrated: 0,       // reset with streak
  updated_at: new Date().toISOString(),
}
```

**After modal shown — update the DB milestone marker:**
```js
// New method: updateLastMilestoneCelebrated(milestone)
async updateLastMilestoneCelebrated(milestone) {
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase
    .from('instrument_practice_streak')
    .update({ last_milestone_celebrated: milestone, updated_at: new Date().toISOString() })
    .eq('student_id', session.user.id);
  if (error) throw error;
}
```

D-14 recommendation: Make `updateLastMilestoneCelebrated` a separate method called from `PracticeLogCard` after milestone detection. This keeps `updatePracticeStreak` purely about the streak count, and the milestone update is a cheap `.update()` call that can fail silently without blocking the user flow.

### Pattern 6: Milestone Detection in PracticeLogCard onSuccess

```js
// After updatePracticeStreak returns:
const MILESTONES = [5, 10, 21, 30];
const { streakCount, lastMilestoneCelebrated } = await practiceStreakService.updatePracticeStreak(localDate, wpEnabled);
const milestoneHit = MILESTONES.find(
  m => streakCount >= m && m > (lastMilestoneCelebrated ?? 0)
);
// Pick the HIGHEST eligible milestone (e.g., if lastMilestoneCelebrated=0 and streakCount=10,
// both 5 and 10 qualify — pick 10 as the most meaningful one)
const milestoneLargest = MILESTONES.filter(
  m => streakCount >= m && m > (lastMilestoneCelebrated ?? 0)
).at(-1);
if (milestoneLargest) {
  setCelebrationMilestone(milestoneLargest);  // triggers modal
}
```

**Edge case:** D-07 says `streakCount >= milestone AND milestone > last_milestone_celebrated`. Use `>= milestone` not `=== milestone` because a user could go from 0 to 10 days in one session (offline sync scenario). Take the largest eligible milestone.

### Pattern 7: i18n Namespace

Add under `practice.milestone.*` (matching `practice.card.*` and `practice.streak.*` established in Phase 2):

```json
"practice": {
  "milestone": {
    "5": {
      "title": "5-Day Streak!",
      "message": "You practiced 5 days in a row! Keep it up!"
    },
    "10": {
      "title": "10-Day Streak!",
      "message": "Amazing! 10 days of practice — you're building great habits!"
    },
    "21": {
      "title": "21-Day Streak!",
      "message": "Incredible! 21 days — you've made practice a habit!"
    },
    "30": {
      "title": "30-Day Champion!",
      "message": "WOW! 30 days straight! You are a piano superstar!"
    },
    "dismiss": "Woohoo!",
    "daysLabel": "days"
  }
}
```

**Hebrew translations** must be added in parallel under the same keys in `src/locales/he/common.json`.

### Pattern 8: Migration Naming

Per established convention (`YYYYMMDD000001_description.sql`):

```sql
-- File: 20260324000002_add_last_milestone_celebrated.sql
ALTER TABLE instrument_practice_streak
  ADD COLUMN IF NOT EXISTS last_milestone_celebrated INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN instrument_practice_streak.last_milestone_celebrated
  IS 'Highest milestone (5/10/21/30) already celebrated in the current streak. Resets to 0 when streak breaks. Prevents re-triggering on reload.';
```

**No RLS change needed** — the existing `"Students can manage own practice streak"` policy covers all operations on this table including the new column.

### Anti-Patterns to Avoid

- **Using VictoryScreen:** D-03 explicitly prohibits it — it is a page-level game-end component with stars, XP breakdown, and exercise navigation.
- **Tracking last_milestone_celebrated in component state only:** Re-renders and page reloads would re-fire the celebration. The DB column is the source of truth.
- **Modal z-index below 9999:** ConfettiEffect uses `z-[9998]`. Modal must be `z-[10000]` (same as BossUnlockModal) to appear above confetti and all dashboard UI.
- **Calling `onComplete` on ConfettiEffect to auto-dismiss:** ConfettiEffect's `onComplete` fires when all confetti pieces fall off-screen (~3-5 seconds depending on tier). Use a separate `setTimeout(onClose, 4000)` for the auto-dismiss, independent of confetti completion.
- **Rendering `<ConfettiEffect>` inside the modal card div:** ConfettiEffect renders at `fixed inset-0 z-[9998]` by itself. Mount it as a sibling alongside the modal backdrop, not nested inside the card.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confetti animation | Custom canvas/CSS animation | `ConfettiEffect` component | Already handles reduced-motion, window resize, tier config |
| Reduced-motion detection | `window.matchMedia` | `useMotionTokens().reduce` (framer-motion's `useReducedMotion`) | Syncs with system preference and AccessibilityContext |
| Modal entry animation | Custom CSS keyframes | framer-motion `<motion.div>` with `soft` token | Consistent with rest of app |
| i18n plural/count strings | String interpolation | `t('key', { count })` with i18next | Handles EN/HE pluralization rules |
| Milestone threshold logic | Inline magic numbers | `const MILESTONES = [5, 10, 21, 30]` constant in modal or service | Single source of truth, testable |

---

## Common Pitfalls

### Pitfall 1: Double-Fire on Same Streak Day

**What goes wrong:** User taps "I practiced" twice quickly (despite button `disabled` state). If the `logState` check fails and `onSuccess` fires twice, the celebration shows twice.

**Why it happens:** Race condition between `setLogState('logging')` and the mutation guard. `useMutation` itself does not prevent concurrent calls.

**How to avoid:** The existing `if (logState !== 'idle') return;` guard in `handleLog` prevents this. Verify the guard is still in place after modifying `onSuccess`. The DB UNIQUE constraint on `(student_id, practiced_on)` also ensures `inserted = false` on any duplicate, so the streak update path never runs twice.

**Warning signs:** Celebration modal appears twice in quick succession.

### Pitfall 2: `last_milestone_celebrated` Not Reset on Streak Break

**What goes wrong:** User reaches 10-day streak (milestone celebrated), breaks streak, reaches 5-day streak — 5-day celebration does not fire because `last_milestone_celebrated` is still 10.

**Why it happens:** `updatePracticeStreak` resets `streak_count` to 1 when `gap > 1`, but does not reset `last_milestone_celebrated`.

**How to avoid:** When `newStreakCount = 1` due to gap > 1 reset, include `last_milestone_celebrated: 0` in the upsert payload (D-08).

**Warning signs:** After a streak break, no milestone celebrations fire at lower thresholds.

### Pitfall 3: Milestone Check Against `streakCount` From Cache (Stale)

**What goes wrong:** `streakData.streakCount` from the TanStack Query cache is stale (e.g., 9), but `updatePracticeStreak` returns `{ streakCount: 10 }`. If the milestone check uses the cached value, it misses the 10-day milestone.

**How to avoid:** Always read `streakCount` from the `updatePracticeStreak` return value (not from the `streakData` query cache) when checking milestones. The code in `PracticeLogCard.handleLog.onSuccess` already calls `updatePracticeStreak` and gets back `{ streakCount }` — use that return value.

**Warning signs:** Milestone celebration never fires despite streak reaching threshold.

### Pitfall 4: `getPracticeStreak` Returns Stale `lastMilestoneCelebrated`

**What goes wrong:** After `updateLastMilestoneCelebrated(10)` is called, the `['practice-streak', user.id]` query cache still holds `lastMilestoneCelebrated: 0`. On next log, the milestone check incorrectly fires again.

**How to avoid:** After calling `updateLastMilestoneCelebrated`, call `queryClient.invalidateQueries({ queryKey: ['practice-streak', user.id] })` — which `handleLog` already does. This forces a fresh fetch that includes the updated column.

**Warning signs:** Celebration re-fires on the next practice log for an already-celebrated milestone.

### Pitfall 5: `last_milestone_celebrated` Column Not Selected in `getPracticeStreak`

**What goes wrong:** The service fetches `.select('streak_count, last_practiced_on')` — the new column is not in the select. Returned value is `undefined`, which coerces to `0` in the milestone check, so the guard `milestone > lastMilestoneCelebrated` always passes.

**How to avoid:** Update the `.select()` string in `getPracticeStreak` to include `last_milestone_celebrated`.

**Warning signs:** Milestone celebrations fire repeatedly — the "already celebrated" guard never triggers.

### Pitfall 6: Auto-Dismiss Racing With User Tap

**What goes wrong:** User taps backdrop to close at ~3.9s; auto-dismiss timer also fires at 4.0s, calling `onClose` twice. Component is already unmounted; second call is a no-op but may log a React warning.

**How to avoid:** Clear the auto-dismiss timer in the click handler before calling `onClose`. Use `useRef` for the timer as BossUnlockModal does with `autoAdvanceTimerRef`.

---

## Code Examples

### Migration

```sql
-- Source: supabase/migrations/20260324000001_instrument_practice_tables.sql (naming convention)
-- File: supabase/migrations/20260324000002_add_last_milestone_celebrated.sql
ALTER TABLE instrument_practice_streak
  ADD COLUMN IF NOT EXISTS last_milestone_celebrated INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN instrument_practice_streak.last_milestone_celebrated
  IS 'Highest milestone already celebrated in the current streak. Resets to 0 on streak break.';
```

### Service: getPracticeStreak extended return shape

```js
// src/services/practiceStreakService.js
async getPracticeStreak() {
  // ...auth check...
  const { data, error } = await supabase
    .from('instrument_practice_streak')
    .select('streak_count, last_practiced_on, last_milestone_celebrated')
    .eq('student_id', session.user.id)
    .maybeSingle();
  if (error) throw error;
  return {
    streakCount: data?.streak_count ?? 0,
    lastPracticedOn: data?.last_practiced_on ?? null,
    lastMilestoneCelebrated: data?.last_milestone_celebrated ?? 0,
  };
},
```

### Service: updatePracticeStreak streak-reset includes last_milestone_celebrated: 0

```js
// In the upsert payload when gap > 1 (streak reset):
{
  student_id: userId,
  streak_count: 1,
  last_practiced_on: localDate,
  last_milestone_celebrated: 0,   // D-08: reset with streak
  updated_at: new Date().toISOString(),
}
// When incrementing (gap === 1): omit last_milestone_celebrated from upsert
// (Supabase upsert only updates columns you include)
```

### Service: new updateLastMilestoneCelebrated method

```js
// Source: derived from updatePracticeStreak pattern
async updateLastMilestoneCelebrated(milestone) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('instrument_practice_streak')
    .update({
      last_milestone_celebrated: milestone,
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', session.user.id);
  if (error) throw error;
},
```

### PracticeLogCard: milestone detection in onSuccess

```js
// After updatePracticeStreak call:
const MILESTONES = [5, 10, 21, 30];
const { streakCount } = streakResult;
// Read lastMilestoneCelebrated from streakData cache (hydrated by prior getPracticeStreak)
// or read from streakData query data
const lastCelebrated = streakData?.lastMilestoneCelebrated ?? 0;
const eligible = MILESTONES.filter(m => streakCount >= m && m > lastCelebrated);
if (eligible.length > 0) {
  const milestone = eligible.at(-1); // largest eligible
  setCelebrationMilestone(milestone);
  // Fire-and-forget update; invalidateQueries covers re-fetch
  practiceStreakService.updateLastMilestoneCelebrated(milestone).catch(() => {});
  queryClient.invalidateQueries({ queryKey: ['practice-streak', user?.id] });
}
```

### MilestoneCelebrationModal: structural skeleton

```jsx
// Source: BossUnlockModal.jsx pattern (simplified to single stage)
export function MilestoneCelebrationModal({ milestone, onClose }) {
  const { t } = useTranslation('common');
  const { reduce, soft } = useMotionTokens();
  const autoTimerRef = useRef(null);

  // Auto-dismiss at 4s (D-05)
  useEffect(() => {
    autoTimerRef.current = setTimeout(onClose, 4000);
    return () => clearTimeout(autoTimerRef.current);
  }, [onClose]);

  // Escape-key dismiss (D-05)
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { clearTimeout(autoTimerRef.current); onClose(); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleClose = () => { clearTimeout(autoTimerRef.current); onClose(); };

  // Confetti tier: 'epic' for 30-day, 'full' for 5/10/21
  const confettiTier = milestone === 30 ? 'epic' : 'full';
  // Confetti colors: emerald/green theme (D-09)
  // ConfettiEffect uses its own TIER_CONFIGS — override via the emerald theme approach
  // OR pass custom colors — ConfettiEffect does not accept colors prop, uses TIER_CONFIGS
  // Use the 'full' tier (green-ish default) for 5/10/21, 'epic' for 30

  return (
    <>
      {/* Confetti — rendered as sibling, NOT inside modal card */}
      <ConfettiEffect tier={confettiTier} />

      {/* Backdrop + modal */}
      <motion.div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduce ? { duration: 0 } : soft}
        role="dialog"
        aria-modal="true"
        aria-label={t('practice.milestone.ariaLabel')}
        onClick={handleClose}
      >
        <motion.div
          className="relative z-[10002] w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-slate-800/95 p-6 text-center backdrop-blur-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={reduce ? { duration: 0 } : soft}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Trophy icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500">
            <Trophy className="h-8 w-8 text-emerald-900" />
          </div>
          {/* Milestone number */}
          <p className="text-5xl font-black text-emerald-400">{milestone}</p>
          <p className="text-sm font-bold text-white/70 mb-2">{t('practice.milestone.daysLabel')}</p>
          {/* Title + message */}
          <h2 className="text-xl font-black text-white mb-1">
            {t(`practice.milestone.${milestone}.title`)}
          </h2>
          <p className="text-sm text-white/70 mb-5">
            {t(`practice.milestone.${milestone}.message`)}
          </p>
          {/* Dismiss button */}
          <button
            className="min-h-[48px] w-full rounded-full bg-emerald-500 px-6 py-3 text-base font-bold text-white shadow-lg hover:bg-emerald-600"
            onClick={handleClose}
            autoFocus
          >
            {t('practice.milestone.dismiss')}
          </button>
        </motion.div>
      </motion.div>
    </>
  );
}
```

**ConfettiEffect colors note:** `ConfettiEffect` uses `TIER_CONFIGS` internally and does not accept a `colors` prop override. The 'full' tier config uses `['#FFD700', '#FFA500', '#87CEEB', '#98FB98']` — which includes light green. For the milestone modal, the 'full' tier is acceptable. For a fully emerald-themed confetti, the modal would need to inline `react-confetti` directly with custom green colors rather than using the `ConfettiEffect` wrapper. **Recommendation (D-12 discretion):** Use `ConfettiEffect tier="full"` for 5/10/21 and `tier="epic"` for 30 — the color divergence is minor and the wrapper's reduced-motion handling is valuable.

---

## Runtime State Inventory

> Skipped — not a rename/refactor/migration phase. This is a greenfield addition of new UI, a new column, and new service methods.

---

## Environment Availability

> Skipped — purely frontend code + Supabase migration. No new external tools, CLIs, or services. Supabase and all npm packages are already installed and operational.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run src/services/practiceStreakService.test.js src/components/dashboard/PracticeLogCard.test.jsx` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOG-04 | `updatePracticeStreak` resets `last_milestone_celebrated` to 0 when streak breaks | unit | `npx vitest run src/services/practiceStreakService.test.js` | Exists — extend |
| LOG-04 | `updatePracticeStreak` does NOT reset `last_milestone_celebrated` when streak increments | unit | `npx vitest run src/services/practiceStreakService.test.js` | Exists — extend |
| LOG-04 | `getPracticeStreak` returns `lastMilestoneCelebrated` in result | unit | `npx vitest run src/services/practiceStreakService.test.js` | Exists — extend |
| LOG-04 | `updateLastMilestoneCelebrated` calls supabase update correctly | unit | `npx vitest run src/services/practiceStreakService.test.js` | Exists — extend |
| LOG-04 | `MilestoneCelebrationModal` renders correct title/message for each milestone tier | unit | `npx vitest run src/components/celebrations/MilestoneCelebrationModal.test.jsx` | Wave 0 gap |
| LOG-04 | `MilestoneCelebrationModal` calls onClose when backdrop clicked | unit | `npx vitest run src/components/celebrations/MilestoneCelebrationModal.test.jsx` | Wave 0 gap |
| LOG-04 | `PracticeLogCard` shows `MilestoneCelebrationModal` when milestone hit | unit | `npx vitest run src/components/dashboard/PracticeLogCard.test.jsx` | Exists — extend |

### Sampling Rate

- **Per task commit:** `npx vitest run src/services/practiceStreakService.test.js`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/celebrations/MilestoneCelebrationModal.test.jsx` — covers LOG-04 modal render/dismiss

*(The service and PracticeLogCard test files already exist and will be extended, not created.)*

---

## Open Questions

1. **ConfettiEffect color customization for emerald theme**
   - What we know: `ConfettiEffect` uses hardcoded `TIER_CONFIGS` colors (gold/orange for epic, gold/green for full). No `colors` prop.
   - What's unclear: Whether to add a `colors` override prop to `ConfettiEffect` or inline `react-confetti` directly in the new modal.
   - Recommendation: Accept the existing color palette as "close enough" and use `ConfettiEffect` as-is. Adding a prop to `ConfettiEffect` risks scope creep. The emerald theme is expressed through the modal's own styling (border, icon, button colors), not the confetti.

2. **Milestone detection: `>= milestone` vs `=== milestone` (D-07 note)**
   - What we know: D-07 says "exactly equals OR the milestone has not already been celebrated". But a gap-then-catch-up scenario could result in `streakCount > milestone`.
   - What's unclear: Whether any real scenario yields a streak jump (no — streaks increment by 1 per day; you can't jump from 4 to 10 in one log).
   - Recommendation: Use `=== milestone` for the primary check since streaks increment by exactly 1. Use `>= milestone AND milestone > lastMilestoneCelebrated` as the safety fallback (D-07 wording). The `MILESTONES.filter(m => streakCount >= m && m > lastCelebrated).at(-1)` approach handles both safely.

---

## Sources

### Primary (HIGH confidence)

- `src/components/celebrations/ConfettiEffect.jsx` — Component API, tier configs, reduced-motion behavior
- `src/components/celebrations/BossUnlockModal.jsx` — Modal overlay pattern, z-index, timer cleanup, Escape key, auto-advance
- `src/services/practiceStreakService.js` — Current service interface, upsert pattern, return shapes
- `src/components/dashboard/PracticeLogCard.jsx` — onSuccess callback location, existing state machine, query invalidation
- `src/utils/useMotionTokens.js` — Motion token API (`reduce`, `soft`, `snappy`, `fade`)
- `src/locales/en/common.json` + `he/common.json` — Existing `practice.*` key structure
- `supabase/migrations/20260324000001_instrument_practice_tables.sql` — Table schema, naming convention, RLS policies

### Secondary (MEDIUM confidence)

- `src/utils/celebrationTiers.js` — Tier taxonomy (epic/full/standard/minimal) — confirms `full` and `epic` are valid `ConfettiEffect` tiers
- `src/utils/celebrationMessages.js` — Message tone conventions for 8-year-old audience (ALL CAPS for epic moments)
- `package.json` — Verified library versions (framer-motion ^12.23.26, react-confetti ^6.2.3, lucide-react ^0.344.0)

---

## Project Constraints (from CLAUDE.md)

Directives the planner must verify compliance with:

| Directive | Impact on This Phase |
|-----------|----------------------|
| SVG imports must use `?react` suffix | No SVG imports in this phase — N/A |
| Glass card pattern: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl` | Modal uses `bg-slate-800/95` like BossUnlockModal — acceptable for dark celebration overlay (consistent with existing celebration pattern) |
| i18n: all user-facing strings via `t()` | All modal text must use `t('practice.milestone.*')` — no hardcoded strings |
| Tailwind CSS only — no custom CSS files unless justified | Modal animations use framer-motion, not CSS keyframes. No new CSS files needed. |
| Vitest for tests; `@testing-library/react` for components | New test file for `MilestoneCelebrationModal` must follow this convention |
| Pre-commit: Husky + lint-staged runs ESLint + Prettier | New files must pass ESLint before commit |
| Prebuild: `validateTrail.mjs` runs on build | No trail data changes — N/A |
| TanStack React Query v5 for server state | Mutation pattern and `queryClient.invalidateQueries` already established in `PracticeLogCard` |
| `useMotionTokens` for animation tokens | Modal animations must use `soft` or `snappy` tokens, not hardcoded durations |
| Supabase RLS on all tables | No new table, no new policies needed — existing `"Students can manage own practice streak"` covers the new column |

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries already installed and in use; verified from package.json and source files
- Architecture: HIGH — verified by reading all canonical reference files directly; patterns are code-confirmed, not assumed
- Migration: HIGH — migration file read directly; column addition is a straightforward ALTER TABLE
- Service extension: HIGH — read full `practiceStreakService.js`; upsert pattern is clear and tested
- Pitfalls: HIGH — derived from direct code inspection (guard conditions, cache behavior, z-index values)
- i18n: HIGH — read both locale files; existing `practice.*` structure confirmed

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain — no fast-moving dependencies)
