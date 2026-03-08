# Phase 15: Trail Content Gating UI - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Students see a clearly gated trail where subscription-locked nodes look visually distinct from prerequisite-locked nodes, and tapping a locked premium node shows a child-appropriate message with no pricing, no buy buttons, and no payment UI reachable by students. Students with active subscriptions see all nodes as available (subject to prerequisite unlock).

Requirements covered: GATE-01, GATE-02, CHILD-01, CHILD-02.

</domain>

<decisions>
## Implementation Decisions

### Premium Lock Node Appearance
- Gold-tinted node: amber gradient background (`from-amber-400 to-yellow-600` style), gold lock glow shadow, visually distinct from gray prerequisite lock
- **Star/Sparkles icon** instead of Lock icon for premium nodes — kids see "special" rather than "blocked"
- Node name visible underneath in warm gold tint (e.g., `text-amber-400/60`) — builds anticipation for what they'll unlock
- Tapping a premium-locked node opens the paywall modal **directly** (no tooltip like prerequisite locks)
- New CSS class needed: `node-3d-premium-locked` (gold gradient, distinct from `node-3d-locked` gray)

### Premium Lock Priority (Double Lock)
- If a node is premium-locked, it **always shows gold** regardless of prerequisite status
- Subscription gate takes visual priority over prerequisite gate for free users
- Rationale: even if they subscribed, they'd still need prerequisites — gold signals the primary blocker

### Paywall Modal
- **State variation within existing TrailNodeModal** — not a separate component
- Add `isPremiumLocked` branch to TrailNodeModal: same modal shell, header, skills list, XP reward — but the action section shows the paywall message instead of "Start Practice"
- Tone: encouraging + redirect to parent: "This lesson is part of the full adventure! Ask a grown-up to unlock all the lessons."
- Shows node details (name, skills, XP) to build excitement
- Dismiss button text: **"Got it!"** (positive, kid-friendly)
- No pricing, no buy buttons, no links to payment pages

### Free-to-Premium Boundary on Trail
- **No visual separator** between Unit 1 (free) and Unit 2+ (premium) — gold nodes speak for themselves
- Path connector lines stay the same color throughout (no gold fade)

### Premium User Experience
- Subscribed users see **all nodes identical to free nodes** — normal category colors (blue/purple/green), no premium badge or sparkle
- Seamless experience — like premium content was always there

### Subscription State Loading & Errors
- While subscription status loads: premium nodes default to **gold-locked** (isPremium=false during loading) — prevents flash of unlocked content
- On subscription fetch error: stay gold-locked **silently** — no error toast or indicator for kids. They see normal free experience.
- Refresh/retry happens naturally on next app load

### Component Architecture
- **TrailMap pre-computes** `isPremiumLocked` for each node: `!isFreeNode(node.id) && !isPremium`
- Calls `useSubscription()` once in TrailMap, passes `isPremiumLocked` as prop to each TrailNode
- Single subscription read, clean data flow (not 93 individual hook calls)

### Dashboard "Continue Learning"
- `getNextRecommendedNode()` skips premium-locked nodes for free users
- "Continue Learning" always points to a playable node or shows nothing if all free nodes are complete

### Claude's Discretion
- Exact gold gradient values and glow intensity
- Star vs Sparkles icon choice (whichever looks better at 18px)
- Exact wording of the paywall message (captures the tone above)
- Animation/transition when subscription resolves and nodes switch from gold to category colors

</decisions>

<specifics>
## Specific Ideas

- Premium lock should feel "special" not "blocked" — star/sparkle icon instead of padlock reinforces this
- The paywall message should direct to "a grown-up" not "your parent" — inclusive of teachers, guardians, etc.
- TrailNodeModal already has the full node detail layout (skills, XP, exercises) — reuse that structure and just swap the action section

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TrailNode.jsx` — Has `nodeState` logic (`locked`/`available`/`current`/`completed`/`mastered`). Needs a new `premium_locked` state.
- `TrailNodeModal.jsx` — Full node detail modal with skills, XP, exercises. Add `isPremiumLocked` branch.
- `nodeTypeStyles.js` — `getCategoryColors()` already handles `locked` state → gray. Needs a new `premium_locked` state → gold.
- `getNodeStateConfig()` — Returns `{ IconComponent, colors, sizeClass }`. Needs to return Sparkles icon for premium lock.
- `SubscriptionContext.jsx` — Already provides `{ isPremium, isLoading }` via `useSubscription()` hook.
- `Lock`, `Crown`, `Star`, `Sparkles` icons from lucide-react (already a dependency).

### Established Patterns
- Node state is determined by `useMemo` in TrailNode based on `isUnlocked`, `isCompleted`, `isCurrent` props
- Colors and icons are centralized in `nodeTypeStyles.js` — all visual changes go through this system
- TrailMap passes computed props to TrailNode (follows existing pattern of pre-computing state)
- i18n keys in `trail` namespace — new strings need entries in `en/trail.json` and `he/trail.json`

### Integration Points
- `TrailMap.jsx` — Add `useSubscription()` hook call, compute `isPremiumLocked` per node
- `TrailNode.jsx` — Accept `isPremiumLocked` prop, add to `nodeState` logic
- `TrailNodeModal.jsx` — Accept `isPremiumLocked` prop, add paywall message branch
- `nodeTypeStyles.js` — Add `premium_locked` state to `getCategoryColors()` and `getNodeStateConfig()`
- `src/config/subscriptionConfig.js` — Needs to be created with `FREE_NODE_IDS` Set and `isFreeNode()` function (may already exist from Phase 14 dependency)
- `skillProgressService.js` → `getNextRecommendedNode()` — Add premium-node skipping for free users
- `src/locales/en/trail.json` and `he/trail.json` — New i18n keys for paywall message

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-trail-content-gating-ui*
*Context gathered: 2026-03-01*
