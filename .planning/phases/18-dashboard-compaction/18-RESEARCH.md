# Phase 18: Dashboard Compaction - Research

**Researched:** 2026-04-05
**Domain:** React component editing, Tailwind CSS layout, i18n key management, Supabase Edge Function URL update
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Remove the entire hero section (background image, dark gradient overlay, Fireflies animation, `<picture>` element)
- **D-02:** Replace hero with a **glass card greeting bar** (`bg-white/10 backdrop-blur-md border border-white/20`) containing avatar + name + level pill
- **D-03:** Greeting bar shows: avatar (linked to /avatars), "Hi, {name}!" greeting, and the existing level pill with gradient border effect
- **D-04:** Remove PlayNextButton from the dashboard entirely (DASH-02). Delete the `nextNode` query and the PlayNextButton render block. The component file itself can remain (may be useful elsewhere) but is no longer imported in Dashboard.jsx.
- **D-05:** Keep single-column layout (`max-w-2xl`)
- **D-06:** Reduce card gaps from `space-y-12` (48px) to `space-y-4` or `space-y-6` (16-24px)
- **D-07:** All existing cards retained: DailyMessageBanner, UnifiedStatsCard, PracticeLogCard, Practice Tools, PushOptInCard, DailyChallengeCard, DailyGoalsCard, WeeklySummaryCard
- **D-08:** Card ordering stays the same as current
- **D-09:** Practice Tools section stays as a standalone section (3 circular buttons with heading)
- **D-10:** Rename "History" button label to "Recordings"
- **D-11:** Change the History/Recordings button icon from Piano to a more representative icon (Mic, Headphones, or similar)
- **D-12:** The existing Practice Tools "Recordings" button (formerly "History") linking to `/practice-sessions` is sufficient for mobile recordings access. No additional card or link needed.
- **D-13:** Update the loading skeleton to match the new compact layout (remove hero skeleton, add greeting bar skeleton)
- **D-14:** Remove OnboardingTour from Dashboard.jsx
- **D-15:** Keep DailyMessageBanner as-is — no styling changes needed
- **D-16:** Update push notification URL from `/?practice_checkin=1` to `/dashboard?practice_checkin=1` in the Edge Function (`send-daily-push`)
- **D-17:** Update `window.history.replaceState` in Dashboard.jsx to clean URL to `/dashboard` instead of `/`

### Claude's Discretion

- Loading skeleton design: Claude matches it to the final compact layout
- Onboarding Tour relocation: Claude decides whether to move OnboardingTour to TrailMapPage in this phase or defer to a future phase
- Exact gap size (`space-y-4` vs `space-y-6`): Claude picks what looks best
- Recordings icon choice: Claude picks between Mic, Headphones, or other Lucide icon

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                        | Research Support                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| DASH-01 | Dashboard is redesigned as a compact stats/overview hub (not the primary destination)                              | Hero removal + greeting bar replaces it; gap reduction tightens layout       |
| DASH-02 | PlayNextButton ("Continue/Begin Journey") hero CTA is removed from the dashboard                                   | D-04 is a precise surgical removal; query + import + render block identified |
| DASH-03 | Existing dashboard cards (streak, XP, daily goals, practice log, daily message) are retained in the compact layout | D-07/D-08 confirm full card retention with identical ordering                |

</phase_requirements>

## Summary

Phase 18 is a surgical UI edit to a single React component — `Dashboard.jsx` (849 lines) — plus one Supabase Edge Function URL string and two i18n files. The phase is well-specified: the UI-SPEC and CONTEXT.md together describe every pixel and string change. No new components need to be created. No new dependencies are required. All referenced icons (`Headphones`) are confirmed present in the installed `lucide-react@^0.344.0`.

The dominant concern for a planner is edit correctness rather than architectural discovery. The file is large (849 lines) with multiple interdependent changes. The recommended approach is to sequence changes within Dashboard.jsx in a single focused task (not split across tasks) to avoid half-edited states. The Edge Function and i18n changes are independent and can be planned as a separate, minimal task.

**Primary recommendation:** Plan two tasks — (1) all Dashboard.jsx edits in one pass (hero removal, greeting bar insertion, PlayNextButton removal, OnboardingTour removal, skeleton update, gap reduction, Practice Tools icon/label update, URL replaceState fix), and (2) independent i18n + Edge Function string updates.

## Standard Stack

### Core (already installed — no new installs needed)

| Library        | Version   | Purpose                                      | Why Standard                                           |
| -------------- | --------- | -------------------------------------------- | ------------------------------------------------------ |
| React          | ^18.3.1   | Component rendering                          | Project standard                                       |
| lucide-react   | ^0.344.0  | Icon set                                     | Project standard — `Headphones` icon confirmed present |
| framer-motion  | ^12.23.26 | Motion wrapper (`MotionOrDiv` pattern)       | Already used in Dashboard.jsx                          |
| Tailwind CSS 3 | 3.x       | Utility classes for layout and glass pattern | Project design system                                  |
| i18next        | in use    | Translation string management                | Project i18n standard                                  |

### No New Dependencies

This phase requires zero new npm installs. All required icons, motion utilities, and styling primitives are already in place.

**Installation:** None required.

**Version verification:** Verified by reading `package.json` directly on 2026-04-05.

## Architecture Patterns

### Recommended Project Structure

No structural changes. All edits are within existing files:

```
src/
├── components/layout/Dashboard.jsx   — primary edit target (849 lines)
├── locales/en/common.json            — rename history key → recordings key
├── locales/he/common.json            — rename history key → recordings key (Hebrew)
supabase/
└── functions/send-daily-push/index.ts — update URL string
```

### Pattern 1: Glass Card Greeting Bar

**What:** A compact horizontal strip replacing the 220-260px hero header. Uses the project's standard glass card pattern.

**When to use:** Anywhere a compact identity display is needed at the top of a glass-background page.

**Classes (from UI-SPEC):**

```jsx
// Source: 18-UI-SPEC.md Component Inventory — New: Greeting Bar
<div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg px-4 py-3 mx-auto max-w-2xl flex items-center gap-3">
  {/* Avatar — 48px (h-12 w-12), downsized from hero's 64px */}
  <Link to="/avatars" className="relative z-10 shrink-0">
    <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-sky-300/50 shadow-[0_2px_12px_rgba(56,189,248,0.4)] hover:border-sky-300/80 hover:shadow-[0_2px_16px_rgba(56,189,248,0.6)] focus-visible:ring-2 focus-visible:ring-white/50">
      <img className="h-full w-full object-cover" src={avatarUrl} alt={t("avatars.title")} loading="eager" />
      {/* layeredAccessories map — same logic as removed hero */}
    </div>
  </Link>

  {/* Greeting text */}
  <span className="flex-1 text-base font-semibold text-white">
    {t("dashboard.header.greeting", { name: firstName })}
  </span>

  {/* Level pill — reuse lines 654-676 from current Dashboard.jsx verbatim */}
  <div className="-ml-7 flex h-6 items-center rounded-full border-2 border-transparent pl-5 pr-2" style={{ background: isPrestige ? /* amber */ : /* indigo-orange */ }}>
    <span className="ml-3 text-xs font-bold uppercase tracking-wider text-white">
      {isPrestige ? t("xpLevels.prestigeTitle", { tier: levelData.prestigeTier }) : t("dashboard.header.level", { level })}
    </span>
  </div>
</div>
```

**RTL:** Wrap the greeting bar flex row in `flex-row-reverse` when `isRTL`.

### Pattern 2: MotionOrDiv Wrapper for Gap Reduction

**What:** The main content `div` uses `MotionOrDiv` (framer-motion or plain div based on `reducedMotion`). Gap is reduced from `space-y-12` to `space-y-4`.

**Current (line 707):**

```jsx
<MotionOrDiv className="mx-auto max-w-2xl space-y-12 px-4 pt-6 md:px-6" ...>
```

**Target:**

```jsx
<MotionOrDiv className="mx-auto max-w-2xl space-y-4 px-4 pt-4 md:px-6" ...>
```

The greeting bar is inserted as the first child of this wrapper, above `DailyMessageBanner`.

### Pattern 3: Compact Loading Skeleton

**What:** Replace the current hero+play-button skeleton (lines 504-531) with a greeting-bar-first skeleton that matches the new layout.

**Target (from UI-SPEC):**

```jsx
// Source: 18-UI-SPEC.md — Updated: Loading Skeleton
<div className="min-h-screen">
  <div className="mx-auto max-w-2xl animate-pulse space-y-4 px-4 pt-4 md:px-6">
    {/* Greeting bar skeleton */}
    <div className="h-14 rounded-xl bg-white/10" />
    {/* Stats card skeleton */}
    <div className="h-40 rounded-2xl bg-white/10" />
    {/* Goals skeleton */}
    <div className="h-48 rounded-3xl bg-white/10" />
    {/* Practice tools skeleton */}
    <div className="flex justify-center gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-full bg-white/10" />
          <div className="h-3 w-12 rounded bg-white/10" />
        </div>
      ))}
    </div>
  </div>
</div>
```

Do NOT use `bg-gray-200` — the purple gradient background requires `bg-white/10 animate-pulse` for skeleton states.

### Pattern 4: Practice Tools Icon Swap

**What:** Replace the `Piano` icon with `Headphones` for the "history/recordings" tool. Update the i18n key from `history.short` to `recordings.short`.

**Current (Dashboard.jsx line 567-573):**

```jsx
icon: <Piano className="h-7 w-7 text-blue-300" />,
label: t("dashboard.practiceTools.cards.history.short", { defaultValue: "History" }),
```

**Target:**

```jsx
icon: <Headphones className="h-7 w-7 text-blue-300" />,
label: t("dashboard.practiceTools.cards.recordings.short", { defaultValue: "Recordings" }),
```

Also update the import line: remove `Piano` from the lucide-react import, add `Headphones`.

### Anti-Patterns to Avoid

- **Do not split Dashboard.jsx edits across multiple tasks.** The hero removal and greeting bar insertion are tightly coupled to the same section of JSX. An intermediate state with the hero removed but no greeting bar breaks the visual layout.
- **Do not use `bg-gray-200` for skeletons on the dashboard.** The purple gradient background requires `bg-white/10` glass-system skeletons. `bg-gray-200` is only for white-card pages.
- **Do not move OnboardingTour in this phase.** D-14 says remove without relocation. Moving it introduces scope creep and risks onboarding regression.
- **Do not remove the `PlayNextButton` component file.** D-04 explicitly says only the import in Dashboard.jsx is removed. The file may be reused elsewhere.
- **Do not touch Fireflies beyond the Dashboard.jsx import.** `TeacherDashboard.jsx` also imports Fireflies — do not remove the Fireflies component file, only the `import Fireflies` line in Dashboard.jsx.

## Don't Hand-Roll

| Problem                         | Don't Build          | Use Instead                                                  | Why                                                                      |
| ------------------------------- | -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Avatar with layered accessories | New avatar component | Reuse lines 622-653 from current Dashboard.jsx hero          | Logic already handles accessories, fallback emoji, link wrapper          |
| Level pill with gradient border | New pill component   | Reuse lines 654-676 from current Dashboard.jsx hero verbatim | Already handles normal vs. prestige gradient, both inline style branches |
| Loading pulse animation         | Custom CSS keyframes | `animate-pulse` Tailwind utility on `bg-white/10` wrappers   | Already the established pattern elsewhere in Dashboard.jsx               |

**Key insight:** All the complex UI primitives for the greeting bar already exist in the hero section being removed. The task is relocation + resizing (avatar 64px → 48px), not reconstruction.

## Common Pitfalls

### Pitfall 1: Orphaned Imports After Removal

**What goes wrong:** After removing the hero, PlayNextButton, and OnboardingTour render blocks, their imports remain. ESLint pre-commit hook will fail on unused imports.

**Why it happens:** Large multi-section components accumulate imports; removal of render blocks doesn't auto-remove imports.

**How to avoid:** After removing each render block, search for and remove corresponding imports:

- Remove: `import Fireflies from "../ui/Fireflies"` (only used in Dashboard.jsx, not TeacherDashboard.jsx — confirmed)
- Remove: `import PlayNextButton from "../dashboard/PlayNextButton"`
- Remove: `import OnboardingTour from "../onboarding/OnboardingTour"`
- Remove: `import { useOnboarding } from "../../hooks/useOnboarding"`
- Remove: `import { getNextRecommendedNode } from "../../services/skillProgressService"` — ONLY if no other usage in Dashboard.jsx remains
- Remove the `nextNode` query block (lines 146-154) — only used for PlayNextButton

Also remove unused destructuring from the `useOnboarding()` call: `shouldShowOnboarding`, `completeOnboarding`.

**Warning signs:** Pre-commit ESLint failure with "X is defined but never used."

### Pitfall 2: i18n Key Mismatch — New Key Not Added

**What goes wrong:** Dashboard.jsx references `dashboard.practiceTools.cards.recordings.short` but the JSON files still only have `dashboard.practiceTools.cards.history.short`. The label falls back to the `defaultValue` string "Recordings" in English, and shows the key string in Hebrew (no defaultValue fallback for missing keys in production).

**Why it happens:** The code edit and the i18n file edit are in different files; easy to do one and forget the other.

**How to avoid:** Plan the i18n file update as a paired requirement with the Dashboard.jsx icon/label change. The new key must be added (or the existing key renamed) in BOTH `src/locales/en/common.json` and `src/locales/he/common.json` under `dashboard.practiceTools.cards`.

**Current state (confirmed by reading locale files):**

- `en/common.json`: has `dashboard.practiceTools.cards.history.short = "History"` — needs `recordings.short = "Recordings"` added (or key renamed)
- `he/common.json`: has `dashboard.practiceTools.cards.history.short = "היסטוריה"` — needs `recordings.short = "הקלטות"` (note: `"הקלטות"` already exists at the top-level `recordings` key in Hebrew, so the translation is known)

### Pitfall 3: URL replaceState Not Updated — Push Notification Loop

**What goes wrong:** If `window.history.replaceState({}, "", "/")` is not updated to `"/dashboard"`, users who tap a push notification with the new URL `/dashboard?practice_checkin=1` will have the URL cleaned to `/` after auto-logging. This can cause confusion if routing logic treats `/` as a redirect target (the trail now, per Phase 17 decisions).

**Why it happens:** The replaceState call (line 115) is inside a useEffect that runs BEFORE async practice logging. It's easy to see and update the Edge Function URL but miss the mirror replaceState in the component.

**How to avoid:** Treat D-16 (Edge Function) and D-17 (replaceState) as a paired change. Both must reference `/dashboard`.

**Confirmed locations:**

- Dashboard.jsx line 115: `window.history.replaceState({}, "", "/")` → change to `"/dashboard"`
- `supabase/functions/send-daily-push/index.ts` line 309: `url: '/?practice_checkin=1'` → change to `'/dashboard?practice_checkin=1'`

### Pitfall 4: Avatar Size Inconsistency

**What goes wrong:** The hero avatar is 64px (`h-16 w-16`). The UI-SPEC specifies 48px (`h-12 w-12`) for the greeting bar strip. If the hero code is copy-pasted without resizing, the avatar will be too large for the compact strip.

**Why it happens:** The code is being relocated, and size classes are easy to overlook when copying.

**How to avoid:** When relocating avatar code from the hero to the greeting bar, explicitly change `h-16 w-16` to `h-12 w-12` in both the outer container and any inner img elements.

### Pitfall 5: `pt-6` → `pt-4` Not Matched by Skeleton

**What goes wrong:** The main content wrapper changes from `pt-6` to `pt-4`. If the skeleton doesn't match (`pt-6` remains in the skeleton), there will be a layout shift between loading and loaded states.

**Why it happens:** Skeleton and live layout are separate code blocks; it's easy to update one and forget the other.

**How to avoid:** The UI-SPEC skeleton uses `pt-4` — match both the skeleton wrapper and the live content wrapper.

## Code Examples

### Remove: nextNode Query Block (Dashboard.jsx lines 146-154)

```jsx
// Source: Dashboard.jsx lines 146-154 — REMOVE this entire block
const { data: nextNode } = useQuery({
  queryKey: ["next-recommended-node", user?.id, isPremium],
  queryFn: () => {
    if (!user?.id || !isStudent) return null;
    return getNextRecommendedNode(user.id, isPremium);
  },
  enabled: !!user?.id && isStudent,
  staleTime: 1 * 60 * 1000,
});
```

### Remove: PlayNextButton Render Block (Dashboard.jsx lines 695-703)

```jsx
// Source: Dashboard.jsx lines 695-703 — REMOVE this entire block
{
  isStudent && nextNode && (
    <PlayNextButton
      to="/trail"
      highlightNodeId={nextNode.id}
      hasStarted={!!(nextNode.progress || nextNode.prerequisites?.length)}
      isRTL={isRTL}
    />
  );
}
```

### Remove: OnboardingTour Render Block (Dashboard.jsx lines 690-693)

```jsx
// Source: Dashboard.jsx lines 690-693 — REMOVE this entire block
{
  shouldShowOnboarding && <OnboardingTour onComplete={completeOnboarding} />;
}
```

### Update: Edge Function Practice Check-in URL

```typescript
// Source: supabase/functions/send-daily-push/index.ts line 309
// BEFORE:
data: { url: '/?practice_checkin=1', type: 'practice-checkin' },
// AFTER:
data: { url: '/dashboard?practice_checkin=1', type: 'practice-checkin' },
```

### Update: i18n Key Addition (en/common.json)

```json
// Source: src/locales/en/common.json around line 988
// BEFORE:
"history": {
  "title": "View Practice History",
  "description": "Review your progress and sessions",
  "short": "History"
}
// AFTER: (add recordings key alongside history, or rename — planner's choice)
"recordings": {
  "title": "View Recordings",
  "description": "Review your progress and sessions",
  "short": "Recordings"
}
```

```json
// Source: src/locales/he/common.json around line 988
// BEFORE:
"history": {
  "title": "צפו בתרגולים הקודמים שלכם",
  "description": "עקבו אחר ההתקדמות שלכם",
  "short": "היסטוריה"
}
// AFTER:
"recordings": {
  "title": "צפו בהקלטות",
  "description": "עקבו אחר ההתקדמות שלכם",
  "short": "הקלטות"
}
```

Note: The Hebrew translation "הקלטות" is already confirmed — it appears at the top-level `recordings` key in `he/common.json`.

## State of the Art

This phase has no evolving library choices. All patterns are stable project conventions.

| Old Approach                            | Current Approach                | When Changed | Impact                                      |
| --------------------------------------- | ------------------------------- | ------------ | ------------------------------------------- |
| `space-y-12` card gaps                  | `space-y-4` card gaps           | Phase 18     | Tighter stats-hub feel                      |
| Hero image (220-260px) as dashboard top | Glass card greeting bar (~96px) | Phase 18     | Dashboard is no longer the app's front door |
| PlayNextButton as hero CTA              | Trail is primary CTA (via nav)  | Phase 17-18  | Trail is now the primary destination        |

## Open Questions

1. **i18n key: rename or add?**
   - What we know: The existing `history` key is referenced in Dashboard.jsx as `dashboard.practiceTools.cards.history.short`. The new code references `dashboard.practiceTools.cards.recordings.short`.
   - What's unclear: Whether the planner should rename the `history` key in place (simpler, but breaks any other reference to the old key) or add a new `recordings` key and leave `history` in place (safer, avoids hidden references).
   - Recommendation: Search for any other references to `dashboard.practiceTools.cards.history` before deciding. Given no other component files reference this specific key (only Dashboard.jsx uses practiceTools data), renaming is safe. The planner should verify with a grep step.

2. **OnboardingTour relocation deferred — does it need a state guard?**
   - What we know: `useOnboarding` and `OnboardingTour` imports will be removed from Dashboard.jsx per D-14.
   - What's unclear: Without Dashboard rendering OnboardingTour, new users will never see the tour in this phase. REQUIREMENTS.md Out of Scope says "First-time student onboarding changes: Existing onboarding tour stays as-is" — which is technically contradicted by D-14 removing it without relocation.
   - Recommendation: D-14 is authoritative for this phase. The tour is deferred; flag this as a known gap for the post-game phase or a dedicated future phase. No code change needed beyond removal.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies beyond existing Supabase Edge Function, which is already deployed and functional — the only change is a string value in an existing function's source code).

## Validation Architecture

### Test Framework

| Property           | Value                                                   |
| ------------------ | ------------------------------------------------------- |
| Framework          | Vitest 3.2.4                                            |
| Config file        | `vitest.config.js` (project root)                       |
| Quick run command  | `npx vitest run src/components/layout/Dashboard.test.*` |
| Full suite command | `npm run test:run`                                      |

### Phase Requirements → Test Map

| Req ID  | Behavior                                              | Test Type           | Automated Command                       | File Exists? |
| ------- | ----------------------------------------------------- | ------------------- | --------------------------------------- | ------------ |
| DASH-01 | Dashboard renders compact layout without hero section | smoke (render test) | `npx vitest run src/components/layout/` | ❌ Wave 0    |
| DASH-02 | PlayNextButton is not rendered in Dashboard           | unit                | `npx vitest run src/components/layout/` | ❌ Wave 0    |
| DASH-03 | All existing dashboard cards still render             | unit                | `npx vitest run src/components/layout/` | ❌ Wave 0    |
| DASH-02 | i18n key `recordings.short` exists in en + he locales | unit                | `npx vitest run src/locales/`           | ❌ Wave 0    |

Note: `Dashboard.jsx` has no existing test file (`src/components/layout/Dashboard.test.*` does not exist). The existing test at `src/__tests__/App.test.jsx` tests routing but does not render Dashboard content. Given the surgical nature of these edits (removals and CSS class changes), manual smoke-testing in the browser is the most practical verification gate. The planner may opt to treat visual verification as the phase gate rather than adding a new test file.

### Sampling Rate

- **Per task commit:** Manual browser check — dashboard loads without hero, greeting bar visible, no PlayNextButton
- **Per wave merge:** `npm run test:run` (full suite)
- **Phase gate:** Full suite green + visual confirmation before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/layout/Dashboard.test.jsx` — render test confirming hero absence, greeting bar presence, card list intact (DASH-01, DASH-02, DASH-03). **Optional** — planner may defer given the surgical, visual nature of these changes.

_(If planner elects to skip the Dashboard render test, document the decision explicitly. The existing test infrastructure covers all non-Dashboard requirements.)_

## Project Constraints (from CLAUDE.md)

The following CLAUDE.md directives are relevant to this phase and must not be violated:

| Directive                                                                                      | Applies To                                                     |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| SVG imports must use `?react` suffix                                                           | Not applicable — no new SVG imports in this phase              |
| Glass card pattern: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg` | Greeting bar must use this exact pattern                       |
| Text colors on purple bg: `text-white`, `text-white/70`, `text-white/60`                       | Greeting bar text — no gray text allowed                       |
| Skeleton: `bg-white/10 animate-pulse` (NOT `bg-gray-200`)                                      | Loading skeleton pattern                                       |
| Pre-commit hook: ESLint + Prettier run on staged files                                         | All removed imports must be cleaned up or ESLint fails         |
| `npm run build` runs trail validation as prebuild                                              | Build will still pass — no trail data is touched in this phase |
| When adding new game routes: add to BOTH `LANDSCAPE_ROUTES` and `gameRoutes`                   | Not applicable — no new routes in this phase                   |
| `__APP_VERSION__` global injected at build time                                                | Not applicable                                                 |

## Sources

### Primary (HIGH confidence)

- `src/components/layout/Dashboard.jsx` — direct file read, current implementation verified
- `src/locales/en/common.json` and `src/locales/he/common.json` — direct file read, i18n key structure confirmed
- `supabase/functions/send-daily-push/index.ts` — direct file read, practice_checkin URL confirmed at line 309
- `package.json` — direct file read, dependency versions verified
- `.planning/phases/18-dashboard-compaction/18-CONTEXT.md` — decisions are authoritative
- `.planning/phases/18-dashboard-compaction/18-UI-SPEC.md` — visual contract is authoritative
- `node_modules/lucide-react` — `Headphones` icon presence confirmed via Node.js require

### Secondary (MEDIUM confidence)

- `src/components/dashboard/PracticeLogCard.test.jsx` — confirms test pattern used in dashboard folder
- `vitest.config.js` — test configuration confirmed

### Tertiary (LOW confidence)

None — all findings verified against source files directly.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all packages verified in package.json and node_modules
- Architecture: HIGH — Dashboard.jsx read in full, all line numbers verified
- Pitfalls: HIGH — based on direct code inspection, not assumptions
- i18n changes: HIGH — locale file structure read directly, Hebrew translation confirmed

**Research date:** 2026-04-05
**Valid until:** This research is tied to the current Dashboard.jsx state. Valid as long as Dashboard.jsx has not been modified since 2026-04-05. Re-verify line numbers if any other changes have been made to Dashboard.jsx before executing.
