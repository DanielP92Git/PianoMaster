# Phase 06: Dedicated Parent Portal with Math Gate - Research

**Researched:** 2026-03-25
**Domain:** React UI refactor — navigation consolidation, data aggregation, COPPA-compliant parent gate
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Desktop sidebar gets a "Parent Zone" entry with ShieldCheck icon (lucide), placed between Achievements and Settings in `appNavigationConfig.js`
- **D-02:** Mobile does NOT get a bottom nav entry. A prominent card/button at the TOP of the Settings page is the mobile entry point
- **D-03:** Tapping either entry point navigates to `/parent-portal` which immediately shows the math gate overlay
- **D-04:** Math gate appears on EVERY visit to `/parent-portal` — no session caching, no timed access
- **D-05:** Gate renders as a full-screen overlay (reuse existing `ParentGateMath` component pattern)
- **D-06:** Gate state is local to the ParentPortalPage component (`useState` boolean, not persisted)
- **D-07:** Portal contains 4 sections: Quick Stats Cards, Practice Heatmap, Subscription Management, Parent Settings
- **D-08:** Quick stats cards are simple glass cards with numbers — no charts, no per-path breakdown
- **D-09:** Portal layout is a single scrollable page with sections, matching the existing glassmorphism design system
- **D-10:** Weekend pass toggle moves FROM Settings INTO the parent portal
- **D-11:** Push notification consent (NotificationPermissionCard) moves FROM Settings INTO the parent portal
- **D-12:** Subscription section in Settings is replaced by a simple "Parent Zone" entry card (not the full subscription status UI)
- **D-13:** Individual ParentGateMath gates on weekend pass and notification toggles are removed — the portal-level gate covers them
- **D-14:** The feedback form stays in Settings (not parent-gated)

### Claude's Discretion

- Exact card layout and spacing within the portal
- Order of sections within the portal (D-07 order is a preference, not a hard requirement)
- BackButton destination (likely "/" or "/settings" depending on entry point)
- Animation/transition when gate is solved

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

---

<phase_requirements>
## Phase Requirements

Derived from CONTEXT.md decisions (no REQUIREMENTS.md file found at expected path):

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-01 | Add "Parent Zone" sidebar nav entry (desktop only) with ShieldCheck icon between Achievements and Settings | appNavigationConfig.js structure confirmed; pattern requires new entry in `APP_NAV_ITEMS.student` array and i18n key `navigation.links.parentZone` |
| REQ-02 | Add `ParentZoneEntryCard` at top of AppSettings (mobile entry point) | AppSettings.jsx structure confirmed; card renders before all SettingsSection blocks |
| REQ-03 | Refactor ParentPortalPage to show math gate on every visit via local `useState` | ParentGateMath component confirmed reusable; `onConsent`/`onCancel` props already exist |
| REQ-04 | Add QuickStatsGrid component showing level/XP, total stars, nodes completed (N/93), streak days | Data sources confirmed: `getStudentXP` (xpSystem), `getStudentProgress` (skillProgressService), `getStreakState` (streakService) |
| REQ-05 | Move NotificationPermissionCard from AppSettings Notification section into portal (Section 4) | Component is self-contained and portable; internal gate must be suppressed since portal gate covers it |
| REQ-06 | Move weekend pass ToggleSetting from AppSettings Streak section into portal (Section 4) | Toggle and handler pattern confirmed; requires carrying the streak query + setWeekendPass logic |
| REQ-07 | Replace Subscription section in AppSettings with a simple "Parent Zone" entry card | Current subscription section (lines 314-351 in AppSettings.jsx) removed; replaced with ParentZoneEntryCard link |
| REQ-08 | Remove individual ParentGateMath gates from weekend pass and notification flows in AppSettings | `showParentGate` state, `handleParentConsentGranted`, `handleWeekendPassToggle` logic in AppSettings can be removed |
| REQ-09 | Add AppLayout title mapping for `/parent-portal` route | `getPageTitleKey()` in AppLayout.jsx currently has no case for `/parent-portal` |
| REQ-10 | Add i18n keys for new copywriting (parentZone title, entry card subtitle, quick stats labels) | New keys needed in both `en/common.json` and `he/common.json` |

</phase_requirements>

---

## Summary

This phase is a focused UI refactor — no new backend, no new routes, no new data sources. The primary work is three things: (1) consolidating navigation entry points, (2) refactoring `ParentPortalPage` into a gated multi-section shell, and (3) transplanting two components (`NotificationPermissionCard`, weekend pass `ToggleSetting`) from `AppSettings` into the portal with their gate logic removed.

All data sources for the new Quick Stats Grid already exist in the codebase. `getStudentXP` from `xpSystem.js` gives level + total XP. `getStudentProgress` from `skillProgressService.js` gives per-node stars for summing totals and counting completed nodes. `getStreakState` from `streakService.js` gives `streakCount`. These three React Query queries can be parallelized.

The primary implementation risk is the `NotificationPermissionCard` internal gate. The component has its own `ParentGateMath` overlay for first-time enablement. Since the portal-level gate already verified the parent, the portal rendering context means the internal gate is still triggered on first notification enable (because `parent_consent_granted` is not yet true in the DB until the notification flow runs). This is the correct behavior — the portal gate verifies "is this a parent," the notification gate separately records `parent_consent_granted` in `push_subscriptions`. These are independent consent records. No suppression is needed; the component works as-is.

**Primary recommendation:** Treat this as a component transplant with a new shell, not a rewrite. Read each source file before modifying; most changes are deletions from `AppSettings.jsx` and additions to `ParentPortalPage.jsx`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^18.3.1 | Component rendering | Project baseline |
| TanStack React Query | ^5.66.0 | Data fetching with `useQuery` | Used by all data-fetching pages in this project |
| react-i18next | ^16.3.5 | Translation | Project i18n standard |
| lucide-react | ^0.344.0 | Icons (ShieldCheck, ChevronRight) | Project icon library; `ShieldCheck` already in lucide-react v0.344 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hot-toast | existing | Toast feedback for cancel/error | Existing project standard for all toasts |
| react-router-dom | ^7.1.5 | `useNavigate`, `Link` | Routing within Settings and portal |

### No New Dependencies

This phase requires zero new npm packages. Everything needed is already installed.

---

## Architecture Patterns

### Recommended Project Structure

No new directories needed. All files fit existing structure:

```
src/
├── pages/
│   └── ParentPortalPage.jsx         # Refactored (primary change)
├── components/
│   ├── parent/
│   │   └── QuickStatsGrid.jsx       # New component
│   ├── settings/
│   │   └── ParentZoneEntryCard.jsx  # New component
│   └── layout/
│       └── appNavigationConfig.js   # Modified (add Parent Zone)
├── locales/
│   ├── en/common.json               # Modified (new keys)
│   └── he/common.json               # Modified (new keys)
└── pages/
    └── AppSettings.jsx              # Modified (remove sections, add card)
```

### Pattern 1: Gate-First Page Shell

**What:** `ParentPortalPage` renders `ParentGateMath` overlay by default (`gateOpen: true` initial state). Content renders only after `setGateOpen(false)`.

**When to use:** Every-visit authentication without persistence.

**Example:**
```jsx
// Source: Derived from existing ParentGateMath + AppSettings gate pattern
export default function ParentPortalPage() {
  const [gateOpen, setGateOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {gateOpen && (
        <ParentGateMath
          onConsent={() => setGateOpen(false)}
          onCancel={() => navigate(-1)}
          isRTL={isRTL}
        />
      )}
      {!gateOpen && (
        <div className="animate-fadeIn motion-reduce:animate-none max-w-lg mx-auto px-4 sm:px-6 py-6 pb-16">
          {/* portal content */}
        </div>
      )}
    </div>
  );
}
```

**Critical detail:** The existing `ParentGateMath` component uses named export AND default export:
```js
export function ParentGateMath(...) { ... }
export default ParentGateMath;
```
Import with: `import ParentGateMath from '../settings/ParentGateMath'` (default import works).

### Pattern 2: Parallel React Query Data Fetching for Quick Stats

**What:** Three independent `useQuery` calls for XP, progress, and streak. Each can fail independently; stats card shows `—` on error per UI-SPEC.

**Example:**
```jsx
// Source: Existing patterns from AppSettings.jsx and ParentPortalPage.jsx
const { data: xpData } = useQuery({
  queryKey: ['student-xp', user?.id],
  queryFn: () => getStudentXP(user.id),
  enabled: !!user?.id,
  staleTime: 5 * 60 * 1000,
});

const { data: progressData } = useQuery({
  queryKey: ['student-progress', user?.id],
  queryFn: () => getStudentProgress(user.id),
  enabled: !!user?.id,
  staleTime: 5 * 60 * 1000,
});

const { data: streakState } = useQuery({
  queryKey: ['streak-state', user?.id],
  queryFn: () => streakService.getStreakState(),
  enabled: !!user?.id,
  staleTime: 60 * 1000,  // existing staleTime from AppSettings
});
```

**Deriving stats from data:**
- **Level + XP:** `xpData?.levelData?.level` and `xpData?.totalXP`
- **Total stars:** `progressData?.reduce((sum, p) => sum + (p.stars || 0), 0) ?? 0`
- **Nodes completed:** `progressData?.filter(p => p.stars > 0).length ?? 0` (out of 93)
- **Streak days:** `streakState?.streakCount ?? 0`

### Pattern 3: appNavigationConfig Sidebar Entry

**What:** Add a new nav item to `APP_NAV_ITEMS.student` array. The sidebar automatically renders it. The `MobileTabsNav` uses an explicit `tabIds` allowlist — Parent Zone does NOT go in `tabIds`, so it will only appear in the desktop sidebar.

**Example:**
```js
// Source: src/components/layout/appNavigationConfig.js
import { ShieldCheck } from "lucide-react";

// In APP_NAV_ITEMS.student array, after achievements:
{
  id: "parentZone",
  to: "/parent-portal",
  icon: ShieldCheck,
  labelKey: "navigation.links.parentZone",
  theme: "indigo",
},
```

**MobileTabsNav exclusion:** The `tabIds` array in `MobileTabsNav.jsx` is hardcoded:
```js
const tabIds = isStudent
  ? ["studentDashboard", "practiceGames", "recordings", "achievements", "settings"]
  : ...
```
`"parentZone"` is NOT in this list → it won't appear in mobile tabs. No change needed to `MobileTabsNav.jsx`.

### Pattern 4: animate-fadeIn with Reduced Motion

**What:** The `animate-fadeIn` CSS class is defined in `src/index.css` as `animation: fadeIn 0.3s ease-out`. The `motion-reduce:animate-none` Tailwind utility respects `prefers-reduced-motion`.

**Example:**
```jsx
// Source: src/components/settings/FeedbackForm.jsx (existing usage)
<div className="animate-fadeIn motion-reduce:animate-none">
  {/* portal content */}
</div>
```

### Pattern 5: Weekend Pass Toggle Without Local Gate

**What:** In `AppSettings`, the weekend pass toggle checks `parentConsentGranted` before deciding whether to show a gate. In the portal, since the portal-level gate already ran, the toggle can call `streakService.setWeekendPass()` directly every time — no consent check needed, no local `ParentGateMath`.

**Example:**
```jsx
// Simplified handler for portal context (no gate needed)
const handleWeekendPassToggle = async (newValue) => {
  try {
    await streakService.setWeekendPass(newValue);
    queryClient.invalidateQueries({ queryKey: ['streak-state', user?.id] });
  } catch {
    toast.error(t('common.saving'));
  }
};
```

### Anti-Patterns to Avoid

- **Do not reuse `SettingsSection` for portal sections:** The portal sections per UI-SPEC are plain headings + content, not collapsible accordions. `SettingsSection` is collapsible with icon headers — wrong pattern for the portal.
- **Do not add `parentZone` to MobileTabsNav tabIds:** D-02 explicitly prohibits this. The mobile entry is via Settings only.
- **Do not cache gate state in sessionStorage or localStorage:** D-04 requires every-visit gating. `useState` only.
- **Do not suppress NotificationPermissionCard's internal gate:** The portal gate verifies parenthood for the portal visit. The notification gate separately records `parent_consent_granted` in the DB. They serve different purposes.
- **Do not create a new route:** `/parent-portal` route already exists in `App.jsx` (line 320). No change needed to `App.jsx`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Math gate overlay | Custom gate component | Existing `ParentGateMath` | Full RTL support, attempt counter, hint after 3 failures, correct UX patterns already tested |
| Streak data fetching | Custom DB query | `streakService.getStreakState()` | Handles dedup, in-flight, cooldown, grace window calculation |
| XP + level calculation | Custom level math | `getStudentXP()` + `calculateLevel()` | 30 static levels + prestige tiers, complex math already handled |
| Progress aggregation | Custom Supabase query | `getStudentProgress()` | Handles RLS, authorization, error propagation |
| Toast notifications | Custom toast | `react-hot-toast` (already imported in ParentPortalPage) | Standard across the app |
| Back navigation | Custom back button | `BackButton` component | Already in ParentPortalPage; handles `to` prop |

---

## Common Pitfalls

### Pitfall 1: NotificationPermissionCard Double-Gating Concern

**What goes wrong:** Developer assumes the internal `ParentGateMath` inside `NotificationPermissionCard` is redundant and removes it, breaking the `parent_consent_granted` DB write.
**Why it happens:** The portal gate and the notification gate look identical from a UX perspective, but they record consent to different systems (portal = one-time visit auth; notification gate = writes `parent_consent_granted = true` to `push_subscriptions` table).
**How to avoid:** Leave `NotificationPermissionCard` completely unchanged. It handles its own DB consent record. The component will render in the portal just as it does in Settings.
**Warning signs:** If a developer creates a `suppressGate` prop or wraps the component to prevent its internal gate — stop and re-read this note.

### Pitfall 2: Sidebar Shows Parent Zone on Mobile

**What goes wrong:** Adding `parentZone` to `APP_NAV_ITEMS.student` causes it to appear in the mobile bottom nav (violating D-02).
**Why it happens:** The sidebar renders all `student` items, but so does `MobileTabsNav` unless explicitly excluded. `MobileTabsNav` filters by `tabIds` allowlist — as long as `"parentZone"` is NOT in that array, it won't appear in the bottom nav.
**How to avoid:** Do not add `"parentZone"` to the `tabIds` array in `MobileTabsNav.jsx`.
**Warning signs:** Parent Zone appearing in the mobile tab bar after implementation.

### Pitfall 3: Stale Subscription Data After Gate

**What goes wrong:** The subscription query in `ParentPortalPage` uses `staleTime: 0` — it re-fetches on every mount. The gate shows before content, so there is a moment where subscription data is loading while portal content is visible. The existing loading spinner (or skeleton) handles this, but if the loading check is moved above the gate, the gate never shows until data loads.
**Why it happens:** Developer moves the `if (isLoading) { return <Loader2 /> }` guard before the gate-open check, blocking gate rendering while data loads.
**How to avoid:** Gate renders immediately on mount regardless of loading state. Loading state applies only to portal content (subscription cards, stats). The existing `isLoading` guard should be scoped to subscription section only, not the whole page.

### Pitfall 4: AppSettings State Cleanup

**What goes wrong:** Removing the notification and weekend pass sections from AppSettings without removing their associated state variables, handlers, and queries causes dead code that may still import and run.
**Why it happens:** `AppSettings.jsx` has interleaved state for both sections: `showParentGate`, `pendingToggleValue`, `handleWeekendPassToggle`, `handleParentConsentGranted`, `handleParentGateCancel`, the `pushStatus` query, and `parentConsentGranted` — all of which support the two moved sections.
**How to avoid:** After moving sections, do a pass to remove: the `showParentGate` state, `pendingToggleValue` state, `handleWeekendPassToggle`, `handleParentConsentGranted`, `handleParentGateCancel`, the `pushStatus` query, `parentConsentGranted` derived value, the `ParentGateMath` import (if no longer used), and the two gate JSX blocks at the top of the return.
**Warning signs:** Lint warnings about unused variables in AppSettings after the move.

### Pitfall 5: Missing i18n Keys Cause Runtime Errors

**What goes wrong:** New i18n keys referenced in JSX but not added to both `en/common.json` and `he/common.json` cause i18next to return the key string as the display value in production.
**Why it happens:** Developers add English keys but forget Hebrew.
**How to avoid:** Add all new keys to both locale files in the same task/commit. New keys needed:
- `navigation.links.parentZone` — "Parent Zone" / "אזור הורים"
- `parentPortal.parentZoneTitle` — "Parent Zone" (page heading)
- `parentPortal.entryCardSubtitle` — "Manage subscription, settings & progress"
- `parentPortal.quickStatsHeading` — "Your Child's Progress"
- `parentPortal.parentSettingsHeading` — "Parent Settings"
- `parentPortal.statLevel` — "Level" (card label)
- `parentPortal.statStars` — "Stars Earned" (card label)
- `parentPortal.statNodes` — "Nodes Done" (card label)
- `parentPortal.statStreak` — "Day Streak" (card label)
- `parentPortal.noSubscriptionHeading` — "No active subscription"
- `parentPortal.noSubscriptionBody` — "Unlock the full trail to keep the learning going."

**Existing keys that do NOT need to change:**
- All existing `parentPortal.*` keys (title, status*, plan, monthly, yearly, cancel*, resubscribe, unlockAccess, etc.)
- All `parentGate.*` keys (title, subtitle, submit, cancel, wrong, hint)

### Pitfall 6: BackButton Destination Logic

**What goes wrong:** `BackButton` always goes to `/settings`, but desktop users entered the portal from `/` (sidebar). Going to `/settings` is disorienting for desktop users.
**Why it happens:** Single destination hardcoded.
**How to avoid:** Use `useNavigate` with `navigate(-1)` (or `useLocation` to check `location.state?.from`) to navigate back to wherever the parent came from. The gate's cancel button should also call `navigate(-1)` not hard-navigate.
**Per UI-SPEC:** "Cancel (X or cancel link): Navigates back (BackButton destination: history.back() or `/`)". Using `navigate(-1)` is the clean implementation.

---

## Code Examples

### QuickStatsGrid Loading Skeleton

```jsx
// Source: Pattern from UI-SPEC + existing glass card pattern
function StatCardSkeleton() {
  return <div className="animate-pulse bg-white/10 rounded-xl h-20" />;
}

function QuickStatsGrid({ xpData, progressData, streakState, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
      </div>
    );
  }
  const totalStars = progressData?.reduce((sum, p) => sum + (p.stars || 0), 0) ?? null;
  const nodesCompleted = progressData?.filter(p => p.stars > 0).length ?? null;
  const level = xpData?.levelData?.level ?? null;
  const streak = streakState?.streakCount ?? null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard label={t('parentPortal.statLevel')} value={level} />
      <StatCard label={t('parentPortal.statStars')} value={totalStars} />
      <StatCard label={t('parentPortal.statNodes')} value={nodesCompleted !== null ? `${nodesCompleted}/93` : null} />
      <StatCard label={t('parentPortal.statStreak')} value={streak} />
    </div>
  );
}
```

### ParentZoneEntryCard (Settings mobile entry)

```jsx
// Source: UI-SPEC Layout Contract + existing glass card pattern
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function ParentZoneEntryCard({ isRTL }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/parent-portal')}
      className={`w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6 flex items-center gap-4 hover:bg-white/15 transition-colors cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
    >
      <ShieldCheck size={24} className="text-amber-400 flex-shrink-0" />
      <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
        <p className="text-base font-bold text-white">{t('navigation.links.parentZone')}</p>
        <p className="text-sm text-white/60">{t('parentPortal.entryCardSubtitle')}</p>
      </div>
      <ChevronRight size={16} className={`text-white/40 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
    </button>
  );
}
```

### AppSettings Subscription Section Replacement (D-12)

The current subscription `SettingsSection` block (AppSettings.jsx lines 314-351) is replaced with `ParentZoneEntryCard` rendered at the top of the page, before all `SettingsSection` components. The subscription section is deleted entirely — its information is now in the portal.

---

## Runtime State Inventory

This section is SKIPPED — Phase 06 is a frontend UI refactor. No data renames, no stored keys, no migration required. The `/parent-portal` route string is already the canonical URL in the codebase.

---

## Environment Availability

All dependencies are the project's own codebase (no external services, CLIs, or databases beyond what already exists). No new tools required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm scripts, dev server | Yes | v22.15.0 | — |
| npm | Package management | Yes | 11.7.0 | — |
| Vitest | Test runner | Yes | ^3.2.4 | — |
| lucide-react (ShieldCheck) | Sidebar nav icon, entry card | Yes | ^0.344.0 | — |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react 16.3.0 |
| Config file | `vitest.config.js` (project root) |
| Quick run command | `npx vitest run src/components/parent/QuickStatsGrid.test.jsx` |
| Full suite command | `npm run test:run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | Sidebar nav includes parentZone entry for students | unit | `npx vitest run src/components/layout/appNavigationConfig.test.js` | No — Wave 0 |
| REQ-03 | Gate shown on every portal visit; dismisses on correct answer | unit | `npx vitest run src/pages/ParentPortalPage.test.jsx` | No — Wave 0 |
| REQ-04 | QuickStatsGrid shows loading skeletons then data | unit | `npx vitest run src/components/parent/QuickStatsGrid.test.jsx` | No — Wave 0 |
| REQ-04 | QuickStatsGrid shows em dashes when data unavailable | unit | Same file | No — Wave 0 |
| REQ-05 | NotificationPermissionCard renders in portal | smoke | manual verify in browser | N/A |
| REQ-06 | Weekend pass toggle calls streakService.setWeekendPass without gate | unit | `npx vitest run src/pages/ParentPortalPage.test.jsx` | No — Wave 0 |
| REQ-08 | AppSettings no longer renders ParentGateMath for weekend pass flow | unit | `npx vitest run src/pages/AppSettings.test.jsx` | No — Wave 0 |
| REQ-10 | All new i18n keys present in en and he locale files | unit | `npx vitest run src/locales/i18nKeys.test.js` | No — optional |

### Sampling Rate

- **Per task commit:** `npx vitest run [file-under-test]`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** `npm run test:run` green + `npm run lint` clean before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/pages/ParentPortalPage.test.jsx` — covers REQ-03, REQ-06
- [ ] `src/components/parent/QuickStatsGrid.test.jsx` — covers REQ-04
- [ ] `src/components/layout/appNavigationConfig.test.js` — covers REQ-01

Mock patterns from `src/components/settings/FeedbackForm.test.jsx` apply here:
- Mock `../../services/supabase` with `{ default: { ... } }`
- Mock `react-i18next` with `{ useTranslation: () => ({ t: k => k, i18n: { dir: () => 'ltr' } }) }`
- Mock `ParentGateMath` as `data-testid="parent-gate"` stub (already shown in FeedbackForm.test.jsx)

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase |
|-----------|----------------|
| SVG imports require `?react` suffix | Not applicable — no new SVG imports in this phase |
| Glassmorphism design system: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg` | All new cards (`QuickStatsGrid`, `ParentZoneEntryCard`) MUST use this pattern |
| RTL support: `i18n.dir() === 'rtl'` with flex-row-reverse | All new components need `isRTL` prop and `dir` attribute |
| React Query: `useQuery`/`queryKey` pattern with TanStack v5 | QuickStatsGrid data fetching must use v5 API (no `onSuccess` callback — use derived state) |
| Pre-commit hooks: ESLint + Prettier | All new files must pass lint/format before commit |
| `__APP_VERSION__` global | Not applicable |
| Trail validation runs as prebuild hook | Not applicable — no trail data changes |
| Defense in depth: content gates in both React UI and DB RLS | Not applicable — portal is subscription management, not content gating |
| COPPA compliance | Gate on every visit (D-04) satisfies COPPA requirement — no persistent bypass |

---

## Sources

### Primary (HIGH confidence)

- Direct read of `src/pages/ParentPortalPage.jsx` — current subscription management implementation, existing query keys and patterns
- Direct read of `src/components/settings/ParentGateMath.jsx` — gate component API confirmed: `onConsent`, `onCancel`, `isRTL` props; default + named export
- Direct read of `src/components/settings/NotificationPermissionCard.jsx` — 6-state machine confirmed, internal gate renders own `ParentGateMath` for first-time enable
- Direct read of `src/pages/AppSettings.jsx` — confirmed which state variables and handlers are tied to the sections being moved
- Direct read of `src/components/layout/appNavigationConfig.js` — `APP_NAV_ITEMS.student` array structure, `getSidebarNavItems` function
- Direct read of `src/components/layout/MobileTabsNav.jsx` — `tabIds` allowlist confirmed; Parent Zone will NOT appear in mobile tabs if not added to allowlist
- Direct read of `src/utils/xpSystem.js` — `getStudentXP` return shape confirmed: `{ totalXP, currentLevel, levelData, progress }`
- Direct read of `src/services/skillProgressService.js` — `getStudentProgress` returns array of `{ node_id, stars, best_score, ... }`
- Direct read of `src/services/streakService.js` — `getStreakState` return shape confirmed: `{ streakCount, freezeCount, weekendPassEnabled, inGraceWindow, comebackBonus }`
- Direct read of `src/index.css` — `animate-fadeIn` class confirmed at line 1091: `animation: fadeIn 0.3s ease-out`
- Direct read of `src/locales/en/common.json` — existing `parentPortal.*` and `parentGate.*` keys confirmed, `navigation.links.*` keys confirmed
- Direct read of `src/components/layout/AppLayout.jsx` — `getPageTitleKey()` has no `/parent-portal` case; needs adding
- Direct read of `vitest.config.js` and `src/components/settings/FeedbackForm.test.jsx` — test patterns confirmed

### Secondary (MEDIUM confidence)

None required — all findings from direct source inspection.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all packages verified from package.json directly
- Architecture: HIGH — all patterns verified from existing codebase source code
- Pitfalls: HIGH — identified from direct code reading, not speculation
- i18n keys: HIGH — verified against both locale files
- Test gaps: HIGH — confirmed no test files exist for affected components

**Research date:** 2026-03-25
**Valid until:** This research covers stable framework code — valid until library major upgrades or project restructuring. Recommend re-reading source files before implementing (not re-running research).
