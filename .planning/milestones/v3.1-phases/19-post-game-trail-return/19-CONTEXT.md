# Phase 19: Post-Game Trail Return - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

After completing a game, students are guided back to the trail as the natural next step. VictoryScreen and GameOverScreen navigation is streamlined to follow a Duolingo-style flow: trail games return to the trail map, free play games return to the games menu. No mixed navigation choices — each mode has a clear, single destination.

Requirements covered: POST-01, POST-02

</domain>

<decisions>
## Implementation Decisions

### Trail Mode VictoryScreen (POST-01)

- **D-01:** Single CTA button labeled **"Next Adventure"** — navigates back to the trail map. No "Play Again", no "Continue to [Node Name]", no secondary button row.
- **D-02:** Remove the "Continue to [Node Name]" direct-jump-to-next-node flow. After completing a node, always return to the trail map so the kid sees their progress visually, then taps the next node themselves.
- **D-03:** Mid-node "Next Exercise" stepping is preserved. Within a single node with multiple exercises, step through all exercises sequentially. Only return to trail when the full node is done.
- **D-04:** Results/XP/stars/celebration display on VictoryScreen remains unchanged — only the action buttons change.

### Free Play VictoryScreen (POST-02)

- **D-05:** Two buttons: **"Play Again"** (primary) + **"Back to Games"** (secondary). No trail option.
- **D-06:** "Back to Games" replaces the current "To Games Mode" label (same destination, clearer wording).

### Challenge Mode VictoryScreen

- **D-07:** Daily challenge VictoryScreen navigates **back to trail** instead of dashboard. Trail is home now (Phase 17 decision).

### GameOverScreen

- **D-08:** GameOverScreen follows the same routing pattern: trail games show "Try Again" + "Back to Trail", free play shows "Try Again" + "Back to Games".
- **D-09:** Fix the hardcoded `window.location.href = "/notes-master-mode"` exit — replace with context-aware navigation (trail or games menu depending on origin).
- **D-10:** GameOverScreen needs to receive `nodeId` (or equivalent) prop to know whether the game was launched from trail or free play.

### Claude's Discretion

- Button styling for "Next Adventure" (color, gradient) — should feel celebratory and forward-moving
- GameOverScreen prop threading approach — how to pass trail context through to GameOverScreen
- Translation key naming for new labels ("Next Adventure", "Back to Games", "Back to Trail" on GameOverScreen)
- Whether "Back to Trail" on GameOverScreen uses the smart tab routing (`getTrailTabForNode`) or just navigates to `/trail`

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### VictoryScreen & Game Flow

- `src/components/games/VictoryScreen.jsx` — Main victory screen component with trail/free-play/challenge button logic (lines 288-363)
- `src/hooks/useVictoryState.js` — Victory state hook: `handleNavigateToTrail`, `handleExit`, `navigateToNextNode`, `handlePlayAgain` handlers
- `src/components/games/GameOverScreen.jsx` — Game over screen with hardcoded `/notes-master-mode` exit (line 73)

### Trail Navigation

- `src/data/skillTrail.js` — `getTrailTabForNode()` used by `handleNavigateToTrail` for smart tab routing
- `src/services/skillProgressService.js` — `getNextNodeInPath()` used for next-node detection (to be removed from victory flow)

### Game Components (pass trail context through)

- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — `handleNextExercise` callback, passes `nodeId` to VictoryScreen
- `src/components/games/sight-reading-game/SightReadingGame.jsx` — `handleNextTrailExercise` callback
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — `handleNextExercise` callback
- `src/components/games/notes-master-games/MemoryGame.jsx` — `handleNextExercise` callback

### i18n

- `src/locales/en/common.json` — English translations (`victory.*`, `common.toGamesMode`, `games.gameOver.*`)
- `src/locales/he/common.json` — Hebrew translations (same keys)

### Phase 17 Context (predecessor)

- `.planning/phases/17-navigation-restructuring/17-CONTEXT.md` — Trail is home (`/`), dashboard at `/dashboard`

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `handleNavigateToTrail` in `useVictoryState.js` — already navigates to trail with smart tab routing via `getTrailTabForNode(nodeId)`. Reuse for the "Next Adventure" button.
- `handleExit` in `useVictoryState.js` — calls `onExit` prop or falls back to `/practice-modes`. Can be adapted for "Back to Games".
- Button gradient styles already established in VictoryScreen — emerald for trail actions, indigo for play-related actions.

### Established Patterns

- VictoryScreen uses `nodeId` presence to branch between trail mode and free play mode (line 290: `{nodeId ? ...}`)
- GameOverScreen receives `onReset` for retry but has no `nodeId` or trail-awareness props — needs new props added
- All four game components already pass `nodeId`, `exerciseIndex`, `totalExercises`, `exerciseType` to VictoryScreen via `location.state` — same pattern can thread through to GameOverScreen

### Integration Points

- VictoryScreen line 290-363: Complete rewrite of the action buttons section
- VictoryScreen line 307-313: Remove `navigateToNextNode` flow and `nextNode`/`fetchingNextNode` state
- `useVictoryState.js`: Remove or simplify `getNextNodeInPath` query and `navigateToNextNode` handler
- GameOverScreen line 6: Add `nodeId` and/or `onExit` props
- GameOverScreen line 73: Replace hardcoded URL with context-aware navigation
- Each game component's GameOverScreen render: Thread `nodeId` through

</code_context>

<specifics>
## Specific Ideas

- Duolingo-style flow: victory screen is a celebration moment, single forward action, no decision paralysis for 8-year-olds
- "Next Adventure" label should feel exciting and age-appropriate
- Always returning to trail after node completion lets kids see their progress visually (nodes lighting up, stars appearing) which reinforces the sense of achievement

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 19-post-game-trail-return_
_Context gathered: 2026-04-05_
