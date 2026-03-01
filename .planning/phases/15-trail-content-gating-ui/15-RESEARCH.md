# Phase 15: Trail Content Gating UI - Research

**Researched:** 2026-03-01
**Domain:** React UI — trail node visual states, modal branching, subscription context integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Premium Lock Node Appearance**
- Gold-tinted node: amber gradient background (`from-amber-400 to-yellow-600` style), gold lock glow shadow, visually distinct from gray prerequisite lock
- **Star/Sparkles icon** instead of Lock icon for premium nodes — kids see "special" rather than "blocked"
- Node name visible underneath in warm gold tint (e.g., `text-amber-400/60`) — builds anticipation for what they'll unlock
- Tapping a premium-locked node opens the paywall modal **directly** (no tooltip like prerequisite locks)
- New CSS class needed: `node-3d-premium-locked` (gold gradient, distinct from `node-3d-locked` gray)

**Premium Lock Priority (Double Lock)**
- If a node is premium-locked, it **always shows gold** regardless of prerequisite status
- Subscription gate takes visual priority over prerequisite gate for free users
- Rationale: even if they subscribed, they'd still need prerequisites — gold signals the primary blocker

**Paywall Modal**
- **State variation within existing TrailNodeModal** — not a separate component
- Add `isPremiumLocked` branch to TrailNodeModal: same modal shell, header, skills list, XP reward — but the action section shows the paywall message instead of "Start Practice"
- Tone: encouraging + redirect to parent: "This lesson is part of the full adventure! Ask a grown-up to unlock all the lessons."
- Shows node details (name, skills, XP) to build excitement
- Dismiss button text: **"Got it!"** (positive, kid-friendly)
- No pricing, no buy buttons, no links to payment pages

**Free-to-Premium Boundary on Trail**
- **No visual separator** between Unit 1 (free) and Unit 2+ (premium) — gold nodes speak for themselves
- Path connector lines stay the same color throughout (no gold fade)

**Premium User Experience**
- Subscribed users see **all nodes identical to free nodes** — normal category colors (blue/purple/green), no premium badge or sparkle
- Seamless experience — like premium content was always there

**Subscription State Loading & Errors**
- While subscription status loads: premium nodes default to **gold-locked** (isPremium=false during loading) — prevents flash of unlocked content
- On subscription fetch error: stay gold-locked **silently** — no error toast or indicator for kids. They see normal free experience.
- Refresh/retry happens naturally on next app load

**Component Architecture**
- **TrailMap pre-computes** `isPremiumLocked` for each node: `!isFreeNode(node.id) && !isPremium`
- Calls `useSubscription()` once in TrailMap, passes `isPremiumLocked` as prop to each TrailNode
- Single subscription read, clean data flow (not 93 individual hook calls)

**Dashboard "Continue Learning"**
- `getNextRecommendedNode()` skips premium-locked nodes for free users
- "Continue Learning" always points to a playable node or shows nothing if all free nodes are complete

### Claude's Discretion

- Exact gold gradient values and glow intensity
- Star vs Sparkles icon choice (whichever looks better at 18px)
- Exact wording of the paywall message (captures the tone above)
- Animation/transition when subscription resolves and nodes switch from gold to category colors

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GATE-01 | Trail nodes beyond Unit 1 in each path show as locked for free-tier users | Verified: `isFreeNode()` from `src/config/subscriptionConfig.js` (on monetization branch) provides O(1) lookup. TrailMap pre-computes per-node `isPremiumLocked`. |
| GATE-02 | Two visually distinct lock states exist: prerequisite lock (gray) vs subscription lock (gold) | Verified: `node-3d-locked` (gray, CSS class in `trail-effects.css`) is established. New `node-3d-premium-locked` class with amber gradient implements the gold state. `getNodeStateConfig()` in `nodeTypeStyles.js` is the dispatch point. |
| CHILD-01 | Tapping a subscription-locked node shows a friendly modal with zero pricing and zero buy buttons | Verified: TrailNodeModal has a single action section (lines 401-434 in current code) that can be branched on `isPremiumLocked`. No price data flows into TrailNodeModal today; branch shows only node details + paywall message. |
| CHILD-02 | No purchase interface, pricing, or payment form is reachable from any screen a logged-in student can access | Verified: Parent checkout pages will live on routes NOT in student app tree (Phase 16). Modal decision to use `isPremiumLocked` branch (no links out) satisfies this. Route guard verification is part of the plan's verification tasks. |
</phase_requirements>

---

## Summary

Phase 15 is a pure React UI layer change. The backend infrastructure (subscription tables, RLS, webhook, SubscriptionContext) is all complete from Phases 12-14. This phase adds a visual "premium lock" state to the trail node system, branches the TrailNodeModal for a kid-safe paywall message, and filters the Dashboard "Continue Learning" recommendation to skip premium nodes for free users.

The scope is tightly bounded: five files need modification (`TrailMap.jsx`, `TrailNode.jsx`, `TrailNodeModal.jsx`, `nodeTypeStyles.js`, `trail-effects.css`), one file needs creation (`src/config/subscriptionConfig.js` — it was built on the monetization branch but is absent from main), and two i18n files need new keys. The `getNextRecommendedNode()` function in `skillProgressService.js` needs a free-tier filter. No database changes, no new dependencies, no new components.

The primary planning risk is the dependency gap: `src/config/subscriptionConfig.js` exists on the `monetization` branch but is not on `main`. The first task in Phase 15 must either cherry-pick that file or recreate it. All other dependencies (`useSubscription()`, `SubscriptionProvider`, `isFreeNode()` logic in Postgres) are already live.

**Primary recommendation:** Implement in two plans — Plan 01 brings the subscriptionConfig.js dependency to main and wires premium-locked state into the node styling system; Plan 02 branches TrailNodeModal and filters Dashboard recommendations.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | Component rendering, useMemo for state derivation | Already in use throughout app |
| Tailwind CSS | 3.x | Utility classes for gold gradient node name text | Already in use |
| lucide-react | Current | Star or Sparkles icon for premium-locked nodes | Already a dependency; Lock, Crown, Star, Sparkles all imported |
| i18next | Current | Paywall message strings in en/he locales | Already in use, `trail` namespace established |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | v5 | `useSubscription()` is backed by React Query | Already wired; no new usage needed |
| src/contexts/SubscriptionContext | Phase 14 | `useSubscription()` hook returning `{ isPremium, isLoading }` | Call once in TrailMap only |
| src/config/subscriptionConfig.js | Phase 11 | `isFreeNode(nodeId)` gate function | Already defined on monetization branch; needs cherry-pick to main |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pre-computing `isPremiumLocked` in TrailMap | Calling `useSubscription()` in each TrailNode | 93 hook calls vs 1; pre-compute is cleaner, matches existing prop-passing pattern |
| `state variation` in TrailNodeModal | Separate `PremiumPaywallModal` component | Separate component would duplicate modal shell, header, skills list. State branch re-uses existing structure correctly. |
| Static gold gradient in CSS class | Dynamic Tailwind inline style | CSS class in `trail-effects.css` follows the established `node-3d-*` pattern; Tailwind arbitrary values would lose the pattern consistency |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

The changes slot entirely into existing files. No new directories needed:

```
src/
├── config/
│   └── subscriptionConfig.js   ← BRING FROM monetization branch (cherry-pick or recreate)
├── components/trail/
│   ├── TrailMap.jsx             ← Add useSubscription(), compute isPremiumLocked per node
│   ├── TrailNode.jsx            ← Accept isPremiumLocked prop, add to nodeState logic
│   └── TrailNodeModal.jsx       ← Accept isPremiumLocked prop, add paywall branch in action section
├── utils/
│   └── nodeTypeStyles.js        ← Add 'premium_locked' state to getCategoryColors() + getNodeStateConfig()
├── styles/
│   └── trail-effects.css        ← Add .node-3d-premium-locked CSS class
├── services/
│   └── skillProgressService.js  ← Filter premium nodes in getNextRecommendedNode()
└── locales/
    ├── en/trail.json            ← Add paywall message keys
    └── he/trail.json            ← Add Hebrew paywall message keys
```

### Pattern 1: Pre-compute `isPremiumLocked` in TrailMap (upstream data flow)

**What:** TrailMap calls `useSubscription()` once, derives a `Set<nodeId>` of premium-locked nodes, passes `isPremiumLocked` boolean down to each TrailNode via existing prop chain.

**When to use:** Whenever a single data source drives many child components. 93 TrailNode instances — one hook call is correct.

**Example:**
```jsx
// TrailMap.jsx
import { useSubscription } from '../../contexts/SubscriptionContext';
import { isFreeNode } from '../../config/subscriptionConfig';

const TrailMap = () => {
  const { isPremium, isLoading: isSubLoading } = useSubscription();

  // While loading, isPremium=false → premium nodes show gold (safe default)
  // On error, isPremium=false (SubscriptionContext already defaults to false)

  // Pre-compute isPremiumLocked per node. Called in ZigzagTrailLayout render,
  // so wrap in callback or pass isPremium down and compute at render point.
  const getIsPremiumLocked = (nodeId) => !isFreeNode(nodeId) && !isPremium;

  // Pass getIsPremiumLocked (or isPremium + isFreeNode) to ZigzagTrailLayout
  // ZigzagTrailLayout forwards isPremiumLocked to TrailNode
};
```

**Note on prop threading:** TrailMap → ZigzagTrailLayout → TrailNode requires adding `isPremiumLocked` to ZigzagTrailLayout's props and the node render call. This is one extra file to touch but keeps the data flow clean.

### Pattern 2: `premium_locked` as a first-class node state in nodeTypeStyles.js

**What:** Add `premium_locked` to the state hierarchy in `getCategoryColors()` and `getNodeStateConfig()`. Treat it the same way `locked` is treated — a state override that applies regardless of category.

**When to use:** All visual state decisions flow through `getNodeStateConfig()`. Adding `premium_locked` here means TrailNode's `nodeCssClass` and `IconComponent` will pick it up automatically.

**Example:**
```javascript
// nodeTypeStyles.js — getCategoryColors()
if (state === 'premium_locked') {
  return {
    bg: 'bg-gradient-to-br from-amber-400 to-yellow-600',
    border: 'border-amber-400',
    text: 'text-amber-900',
    icon: 'opacity-100',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.6)]'
  };
}
```

```javascript
// nodeTypeStyles.js — getNodeStateConfig()
// Return Sparkles (or Star) icon for premium_locked
if (state === 'premium_locked') {
  return {
    IconComponent: Sparkles, // from lucide-react
    colors: getCategoryColors(category, 'premium_locked'),
    sizeClass: isBoss ? 'h-14 w-14' : 'h-12 w-12',
    pulseClass: '',
    crownVisible: false
  };
}
```

### Pattern 3: `nodeState` hierarchy in TrailNode — premium_locked takes priority

**What:** In TrailNode's `nodeState` useMemo, add `premium_locked` as the first check, before the existing `locked` check. If `isPremiumLocked` prop is true, return `'premium_locked'` unconditionally.

**When to use:** This enforces the "gold takes priority over gray" rule from the decisions. Even if a node would also be prerequisite-locked, the gold state shows.

**Example:**
```jsx
// TrailNode.jsx — nodeState useMemo
const nodeState = useMemo(() => {
  if (isPremiumLocked) return 'premium_locked';  // FIRST — gold wins
  if (!isUnlocked) return 'locked';              // Gray prerequisite lock
  if (isCompleted && progress?.stars === 3) return 'mastered';
  if (isCompleted) return 'completed';
  if (isCurrent) return 'current';
  return 'available';
}, [isPremiumLocked, isUnlocked, isCompleted, isCurrent, progress]);
```

**Click behavior for premium_locked:** bypass the tooltip logic entirely and call `onClick(node)` directly. The modal will branch on `isPremiumLocked`. No tooltip shown.

```jsx
// TrailNode.jsx — handleClick
const handleClick = () => {
  if (isPremiumLocked) {
    onClick(node);  // Open modal → paywall branch
    return;
  }
  if (!isUnlocked && !isBoss) {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
    return;
  }
  if (isUnlocked || isBoss) {
    onClick(node);
  }
};
```

### Pattern 4: State branch in TrailNodeModal for paywall content

**What:** TrailNodeModal accepts `isPremiumLocked` prop. In the action section (currently lines 401-434), conditionally render either the paywall message OR the normal start/practice buttons.

**When to use:** Same modal shell, header, skills list, XP reward remain visible for both branches. Only the action section changes.

**Key structural point:** The `progress section` and `exercise list` sections in TrailNodeModal are gated on `isUnlocked`. Since a premium-locked node is effectively not unlocked to the student, those sections will naturally be hidden — no special handling needed. The paywall branch only needs to replace the action buttons.

**Example:**
```jsx
// TrailNodeModal.jsx — action section replacement
{isPremiumLocked ? (
  <div className="mb-3 rounded-xl bg-amber-400/10 border border-amber-400/30 p-4 text-center">
    <p className="text-sm font-medium text-amber-300">
      {t('modal.premiumMessage')}
    </p>
  </div>
) : (
  /* existing prerequisites section */
)}

{/* Action buttons */}
<div className={`flex gap-2 sm:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
  {isPremiumLocked ? (
    <button
      onClick={onClose}
      className="flex-1 rounded-xl bg-gradient-to-b from-amber-400 to-yellow-500 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-amber-900 transition-transform hover:scale-[1.02]"
    >
      {t('modal.button.gotIt')}
    </button>
  ) : (
    <>
      {/* existing cancel + start buttons */}
    </>
  )}
</div>
```

### Pattern 5: `node-3d-premium-locked` CSS class

**What:** Add to `trail-effects.css` following the existing `node-3d-*` class pattern. Use amber radial gradient with a gold glow shadow (mimicking the `node-3d-active` structure but with amber colors instead of cyan).

**Example:**
```css
/* trail-effects.css — add after .node-3d-locked-boss */
.node-3d-premium-locked {
  position: relative;
  background: radial-gradient(circle at 30% 30%, #fbbf24 0%, #d97706 100%);
  border: 2px solid rgba(251, 191, 36, 0.7);
  box-shadow:
    0 0 0 2px rgba(251, 191, 36, 0.4),
    0 4px 0 rgba(120, 60, 0, 0.6),
    0 6px 16px rgba(251, 191, 36, 0.3);
  cursor: pointer;
}

.node-3d-premium-locked::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
  opacity: 0;
  transition: opacity 200ms ease-out;
  pointer-events: none;
  z-index: -1;
}

.node-3d-premium-locked:hover::before {
  opacity: 0.7;
}

.node-3d-premium-locked:active {
  transform: translateY(2px);
}
```

Also add `node-3d-premium-locked` to the `touch-action: manipulation` rule group (line 136-142 in current `trail-effects.css`).

### Pattern 6: `getNextRecommendedNode()` premium filter

**What:** Add a free-tier filter to `getNextRecommendedNode()` in `skillProgressService.js`. The function accepts an optional `isPremium` flag; when false, filter out premium nodes from the candidate list.

**When to use:** Dashboard calls `getNextRecommendedNode(user.id)` via React Query. Pass `isPremium` from `useSubscription()` in Dashboard.

**Signature change:**
```javascript
// skillProgressService.js
import { isFreeNode } from '../config/subscriptionConfig';

export const getNextRecommendedNode = async (studentId, isPremium = false) => {
  await verifyStudentDataAccess(studentId);
  try {
    let availableNodes = await getAvailableNodes(studentId);

    // Filter out premium-locked nodes for free-tier users
    if (!isPremium) {
      availableNodes = availableNodes.filter(node => isFreeNode(node.id));
    }

    if (availableNodes.length === 0) return null;
    // ... rest of existing logic unchanged ...
  }
};
```

```jsx
// Dashboard.jsx — pass isPremium to queryFn
const { isPremium } = useSubscription();

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

Note: `isPremium` added to `queryKey` ensures the cache invalidates when subscription status changes — a subscribed user gets a fresh recommendation that may include premium nodes.

### Anti-Patterns to Avoid

- **Calling `useSubscription()` in TrailNode:** 93 hook calls instead of 1. Pre-compute in TrailMap and pass `isPremiumLocked` as a prop.
- **Creating a separate PremiumPaywallModal component:** Duplicates modal shell and structure. The state branch pattern re-uses the existing TrailNodeModal.
- **Rendering a paywall `<Link>` to `/subscribe` inside the modal:** CHILD-02 violation. The modal must contain zero navigation to payment pages. Only a dismiss button.
- **Showing a "Locked" badge on the node name text:** Adds redundant text UI. The gold node speaks for itself. CONTEXT.md says only the node name in warm gold tint (e.g., `text-amber-400/60`).
- **Filtering premium nodes out of the trail render:** Don't hide premium nodes — they should show in the trail as gold nodes. Only filter them from `getNextRecommendedNode()`.
- **Using `isPremium` as an `isLoading` gate before rendering nodes:** CONTEXT.md says: during loading, default to gold-locked (i.e., `isPremium=false` during load is the correct safe default — no special loading guard needed).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Free-node lookup | Custom filter in TrailMap | `isFreeNode()` from `subscriptionConfig.js` | Single source of truth; already synced with Postgres `is_free_node()` |
| Subscription status | Direct Supabase query in TrailMap | `useSubscription()` from SubscriptionContext | Already wraps React Query + Realtime; no duplicate query |
| Gold gradient values | Custom inline styles | `node-3d-premium-locked` CSS class in trail-effects.css | Follows established `node-3d-*` pattern; performance-safe |
| Icon at 18px | Custom SVG | `Sparkles` or `Star` from lucide-react | Already imported; consistent with existing icon system |

**Key insight:** All infrastructure is already built. Phase 15 is assembly work — connecting existing pieces (SubscriptionContext, subscriptionConfig, nodeTypeStyles pattern) rather than building anything new.

---

## Common Pitfalls

### Pitfall 1: subscriptionConfig.js Missing from main Branch

**What goes wrong:** `isFreeNode()` import in TrailMap/skillProgressService fails at build time with "Module not found" error.

**Why it happens:** `src/config/subscriptionConfig.js` was created in Phase 11 on the `monetization` branch but has not been merged to `main`. The current `main` branch does not have a `src/config/` directory at all.

**How to avoid:** Plan 01 Task 1 must cherry-pick commit `6bc69fa` (the Phase 11 Plan 01 feat commit that created subscriptionConfig.js) OR recreate the file from scratch. Verify with `git log --all --oneline | grep 6bc69fa` and `git show 6bc69fa:src/config/subscriptionConfig.js`.

**Warning signs:** Import error at dev server start. `ls src/config/` returns empty on main branch.

### Pitfall 2: Flash of Unlocked Content (FOUC)

**What goes wrong:** On initial render, `isLoading=true` and `isPremium=undefined/false` — but there's a brief window where the query hasn't resolved yet. If the default is to show nodes as unlocked, premium nodes flash open then re-lock.

**Why it happens:** React Query fetches asynchronously. Default values matter.

**How to avoid:** `SubscriptionContext` already defaults `isPremium` to `data?.isPremium ?? false` — so during loading, `isPremium=false`. This means `isPremiumLocked = !isFreeNode(id) && !false = true` for premium nodes. No flash. This is the CONTEXT.md decision: "defaults to gold-locked during loading." No extra guard needed.

**Warning signs:** Trail flickers from normal colors to gold on page load.

### Pitfall 3: nodeCssClass Switch Misses premium_locked

**What goes wrong:** TrailNode's `nodeCssClass` useMemo doesn't map `'premium_locked'` to `'node-3d-premium-locked'`, falling through to `'node-3d-available'` and showing the node in its category color.

**Why it happens:** The switch is a manual mapping. Adding a new state requires updating the mapping.

**How to avoid:** Add the case explicitly:
```jsx
if (nodeState === 'premium_locked') return 'node-3d-premium-locked';
```
Place it before `if (nodeState === 'locked')` in the mapping.

**Warning signs:** Premium nodes show in blue/purple/green instead of gold.

### Pitfall 4: Modal Receives Wrong Props (isPremiumLocked Not Passed)

**What goes wrong:** TrailNodeModal doesn't receive `isPremiumLocked`, so it shows the normal "Start Practice" button for premium-locked nodes.

**Why it happens:** TrailMap renders `<TrailNodeModal>` without the new prop (prop added to interface but not passed at call site).

**How to avoid:** TrailMap pre-computes `isPremiumLocked` for the selected node in its `handleNodeClick` or at render. Pass it to `<TrailNodeModal isPremiumLocked={...}>`. Also, TrailMap selects a node by `setSelectedNode(node)` — `isPremiumLocked` must be derivable from the selected node at render time (not at click time, because `isPremium` may change).

**Correct pattern:**
```jsx
// TrailMap.jsx — in the modal render
{selectedNode && (
  <TrailNodeModal
    node={selectedNode}
    progress={getNodeProgress(selectedNode.id)}
    isUnlocked={unlockedNodes.has(selectedNode.id)}
    isPremiumLocked={!isFreeNode(selectedNode.id) && !isPremium}
    prerequisites={selectedNode.prerequisites}
    onClose={() => setSelectedNode(null)}
  />
)}
```

### Pitfall 5: queryKey Missing isPremium in Dashboard

**What goes wrong:** Dashboard's `getNextRecommendedNode` React Query uses `["next-recommended-node", user?.id]` as the key. When `isPremium` changes (subscription purchased), the cache is NOT invalidated — Dashboard continues showing null or a stale free-node recommendation.

**Why it happens:** React Query serves cached results for the same key. Subscription state change doesn't invalidate the node recommendation key.

**How to avoid:** Include `isPremium` in the `queryKey`:
```javascript
queryKey: ["next-recommended-node", user?.id, isPremium]
```
When `isPremium` flips true, the key changes and a fresh fetch runs.

### Pitfall 6: i18n Keys Missing in Hebrew

**What goes wrong:** Paywall message shows raw key string (`trail:modal.premiumMessage`) instead of Hebrew text in Hebrew locale.

**Why it happens:** New keys added to `en/trail.json` but not `he/trail.json`.

**How to avoid:** Always add new trail i18n keys to BOTH files simultaneously. The Hebrew modal strings must be translated — use the established tone: encouraging, directed at "grown-up" (not "parent"), no pricing.

---

## Code Examples

Verified patterns from existing codebase:

### useSubscription() in a component (from SubscriptionContext.jsx Phase 14)

```jsx
// Source: src/contexts/SubscriptionContext.jsx (Phase 14)
import { useSubscription } from '../../contexts/SubscriptionContext';

const { isPremium, isLoading } = useSubscription();
// isPremium: boolean — false during loading, false on error, true for active subscriptions
// isLoading: boolean — true while React Query fetches
```

### isFreeNode() usage (from subscriptionConfig.js, Phase 11, monetization branch)

```javascript
// Source: 6bc69fa — src/config/subscriptionConfig.js
import { isFreeNode } from '../config/subscriptionConfig';

isFreeNode('treble_1_1')   // → true  (Unit 1 treble, free)
isFreeNode('treble_2_1')   // → false (Unit 2 treble, premium)
isFreeNode('boss_treble_1')// → false (boss node, premium)
isFreeNode(null)           // → false (null is not in the Set)
```

### Existing getCategoryColors dispatch (from src/utils/nodeTypeStyles.js)

```javascript
// Source: src/utils/nodeTypeStyles.js (existing code)
export const getCategoryColors = (category, state) => {
  if (state === 'locked') { /* gray */ }
  if (category === NODE_CATEGORIES.BOSS) { /* gold */ }
  const colorMap = { ... };  // category-specific
  return colorMap[category] || colorMap[NODE_CATEGORIES.TREBLE_CLEF];
};
// Phase 15 adds:
// if (state === 'premium_locked') { /* amber gold */ }  ← INSERT BEFORE boss check
```

### Existing node-3d-locked CSS (from src/styles/trail-effects.css)

```css
/* Source: src/styles/trail-effects.css lines 185-193 */
.node-3d-locked {
  position: relative;
  background: radial-gradient(circle at 30% 30%, var(--trail-node-locked-start) 0%, var(--trail-node-locked-end) 100%);
  border: 2px solid rgba(100, 80, 150, 0.5);
  box-shadow:
    0 4px 0 rgba(40, 30, 60, 0.8),
    0 6px 12px rgba(0, 0, 0, 0.4);
  cursor: not-allowed;
}
/* node-3d-premium-locked follows same structure but amber colors + cursor: pointer */
```

### Existing getNodeStateConfig return shape (from src/utils/nodeTypeStyles.js)

```javascript
// Source: src/utils/nodeTypeStyles.js lines 133-144
export const getNodeStateConfig = (nodeType, category, state, isBoss = false) => {
  const IconComponent = getNodeTypeIcon(nodeType, category);
  const colors = getCategoryColors(isBoss ? NODE_CATEGORIES.BOSS : category, state);
  return {
    IconComponent,   // ← Phase 15 returns Sparkles for premium_locked
    colors,
    sizeClass: isBoss ? 'h-14 w-14' : 'h-12 w-12',
    pulseClass: (state === 'current' || state === 'available') ? 'animate-pulse-subtle' : '',
    crownVisible: isBoss && state !== 'locked'  // ← also exclude 'premium_locked'
  };
};
```

### Trail i18n key structure (from src/locales/en/trail.json)

New keys to add:
```json
// en/trail.json — add to "modal" object:
"premiumMessage": "This lesson is part of the full adventure! Ask a grown-up to unlock all the lessons.",
"button": {
  "gotIt": "Got it!"
}
```

```json
// he/trail.json — add to "modal" object:
"premiumMessage": "השיעור הזה הוא חלק מהרפתקה המלאה! בקש מגדול לפתוח את כל השיעורים.",
"button": {
  "gotIt": "הבנתי!"
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No subscription state | `useSubscription()` hook (SubscriptionContext) | Phase 14 (2026-02-28) | TrailMap can now read isPremium without DB call |
| No free-tier config | `src/config/subscriptionConfig.js` with `isFreeNode()` | Phase 11 (2026-02-25) | Single source of truth, O(1) lookup |
| `node-3d-locked` only (gray) | Need `node-3d-premium-locked` (gold) | Phase 15 (this phase) | Two visually distinct lock states |
| `getNextRecommendedNode()` includes all nodes | Filter premium nodes for free tier | Phase 15 (this phase) | Dashboard shows only playable content |

**Deprecated/outdated:**
- Nothing deprecated by this phase — pure addition.

---

## Open Questions

1. **ZigzagTrailLayout prop threading depth**
   - What we know: TrailMap → ZigzagTrailLayout → TrailNode. `isPremiumLocked` boolean must flow through ZigzagTrailLayout to TrailNode.
   - What's unclear: Whether to pass `isPremiumLocked` as a callback `(nodeId) => boolean` to ZigzagTrailLayout, or pass `isPremium` + compute per node inside ZigzagTrailLayout, or pre-compute a Set and pass it.
   - Recommendation: Pass a pre-computed Set `premiumLockedNodeIds` to ZigzagTrailLayout, which passes `isPremiumLocked={premiumLockedNodeIds.has(node.id)}` to each TrailNode. This avoids passing the full isFreeNode import into ZigzagTrailLayout and keeps TrailMap as the single computation site.

2. **Hebrew paywall message wording**
   - What we know: Hebrew locale is required (i18n support is established, he/trail.json exists).
   - What's unclear: Exact Hebrew phrasing that matches the "grown-up" (not "parent") inclusive tone.
   - Recommendation: Use a placeholder Hebrew translation in Plan 01 and flag for native-speaker review. The app already has Hebrew content, so the placeholder should still be functionally correct if mechanically translated.

3. **Icon choice: Sparkles vs Star**
   - What we know: CONTEXT.md lists both as candidates at Claude's discretion; both are in lucide-react.
   - What's unclear: Which renders better at 18px on the amber gradient background.
   - Recommendation: Use `Sparkles` — it has more visual complexity at small sizes and reads more distinctly as "special" vs the plain star which could be confused with the star rating system elsewhere in the trail.

---

## Dependency Gap: subscriptionConfig.js

This is the only non-obvious dependency. All other Phase 14 deliverables are on main and confirmed working.

**File:** `src/config/subscriptionConfig.js`
**Status on main:** Does NOT exist (no `src/config/` directory on main branch)
**Status on monetization branch:** Exists (commit `6bc69fa`, confirmed `2026-02-25`)
**Contents:** `FREE_NODE_IDS` Set (19 IDs), `isFreeNode()` function, `FREE_TIER_SUMMARY` metadata

**Plan 01 first task** must bring this file to main:

Option A — Cherry-pick:
```bash
git cherry-pick 6bc69fa
```

Option B — Recreate (if cherry-pick has conflicts):
Create `src/config/subscriptionConfig.js` with the exact content from commit `6bc69fa` (19 free node IDs: treble_1_1 through treble_1_7, bass_1_1 through bass_1_6, rhythm_1_1 through rhythm_1_6).

The Postgres `is_free_node()` function in the database already mirrors these 19 IDs exactly (verified in Phase 12 SUMMARY: "is_free_node(treble_1_1)=true confirmed live").

---

## Sources

### Primary (HIGH confidence)

- `src/components/trail/TrailNode.jsx` — current nodeState logic, click handling, CSS class mapping, icon rendering (read directly from working tree)
- `src/components/trail/TrailNodeModal.jsx` — full modal structure, action section layout, isUnlocked branching (read directly)
- `src/components/trail/TrailMap.jsx` — ZigzagTrailLayout prop interface, modal render, useUser/useQueryClient usage (read directly)
- `src/utils/nodeTypeStyles.js` — getCategoryColors(), getNodeStateConfig() signatures and state hierarchy (read directly)
- `src/styles/trail-effects.css` — existing node-3d-* CSS class patterns and structure (read directly)
- `src/contexts/SubscriptionContext.jsx` — useSubscription() hook API, isPremium default behavior (read directly, Phase 14 complete)
- `src/locales/en/trail.json` — existing key structure for modal and node sections (read directly)
- `.planning/phases/14-subscription-context-service-layer/14-VERIFICATION.md` — confirms Phase 14 complete, SVC-01/02/03 satisfied
- `.planning/phases/11-legal-gate-design-and-processor-setup/11-01-SUMMARY.md` — confirms subscriptionConfig.js created on monetization branch, commit 6bc69fa
- `.planning/phases/12-database-schema-and-rls/12-01-SUMMARY.md` — confirms Postgres is_free_node() live with 19 free node IDs

### Secondary (MEDIUM confidence)

- `git show 6bc69fa:src/config/subscriptionConfig.js` — retrieved full file content from git history; confirmed FREE_NODE_IDS Set, isFreeNode() function signature, 19 free nodes

### Tertiary (LOW confidence)

- None — all claims verified against source files.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries already in use
- Architecture: HIGH — patterns follow established codebase conventions (nodeTypeStyles, trail-effects.css, prop threading)
- Pitfalls: HIGH — derived from actual code inspection of TrailNode, TrailMap, TrailNodeModal, and SubscriptionContext
- Dependency gap: HIGH — verified by direct git inspection (subscriptionConfig.js absent from main, present on monetization branch)

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable codebase, no external API changes)
