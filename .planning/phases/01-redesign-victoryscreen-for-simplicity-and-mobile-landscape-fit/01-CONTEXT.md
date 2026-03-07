# Phase 1: Redesign VictoryScreen for Simplicity and Mobile-Landscape Fit - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Simplify VictoryScreen content and restructure layout to fit mobile landscape viewports (280-400px height). Internal refactor only — no props interface changes, all 4 game component integrations preserved. Covers both trail mode and free play mode.

</domain>

<decisions>
## Implementation Decisions

### Content to keep vs remove
- **Keep:** Mozart avatar, celebration title/subtitle, star rating (1-3 stars), single XP line with count-up animation, personal best badge (when earned), action buttons
- **Keep:** Comeback bonus "2x" amber pill badge next to XP line (when active)
- **Keep:** Level-up as inline badge under XP line (not a separate bouncing card)
- **Remove:** Score text ("85/100") — stars already communicate performance level
- **Remove:** XP breakdown card (base XP, first time bonus, perfect bonus, 3-star bonus line items)
- **Remove:** XP level progress bar entirely (visible on Dashboard and Trail page instead)
- **Remove:** Points earned/total card (the white card with "+120 / Total: 3,450")
- **Remove:** Percentile comparison message ("Better than 75% of players")
- **Remove:** Timed mode info (time used display)
- **Preserve as overlays (no change):** Boss unlock modal, Accessory unlock modal, Confetti effect
- **Preserve:** Rate limit banner (rare edge case, keep as-is)

### Landscape layout structure
- Two-panel horizontal layout in landscape using `landscape:flex-row`
- Left panel: avatar + star rating
- Right panel: celebration title, XP line (with comeback pill), personal best badge, action buttons
- Portrait mode: single vertical column (simplified content, not two-panel)
- Portrait has enough height — the issue was content volume, not layout direction

### XP display density
- Single bold "+75 XP" line with existing count-up animation — no card, no breakdown
- Comeback "2x" pill shown inline when active
- Level-up shown as small inline badge below XP line (not bouncing gradient card)
- No progress bar at all (removed for both level-up and non-level-up states)

### Free play mode
- Same simplified visual treatment as trail mode — avatar, celebration title, stars, buttons
- Show "+X points" line in the same position as XP for trail (points are the only reward signal in free play)
- 2 buttons: "Play Again" (primary) + "Exit" (secondary, navigates to /practice-modes)

### Action buttons (trail mode)
- Primary button: "Next Exercise (X left)" or "Continue to [Node Name]" or "Back to Trail" depending on state
- Secondary row: "Play Again" + "Exit" (navigates to /trail)
- Context-aware exit: trail mode exits to /trail, free play exits to /practice-modes
- 3 buttons max with clear visual hierarchy (primary full-width, secondary row side-by-side)

### Claude's Discretion
- Background treatment (transparent overlay vs dark backdrop vs glass card) — decide based on UI/UX best practices and app design consistency
- Exact spacing, typography sizes, and padding in both orientations
- Avatar sizing in landscape vs portrait
- Button gradient colors and hover states
- How to handle the exercise indicator ("Exercise 1 of 3") — keep or integrate into title

</decisions>

<specifics>
## Specific Ideas

- Personal best badge should remain as a small text indicator, not a prominent card
- The two-panel layout is already proven in NotesRecognitionGame.jsx — follow that pattern
- Stars should use the existing bouncing animation (respecting reducedMotion)
- Free play gets a "+X points" line where trail would show "+X XP"

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCountUp` hook (already in VictoryScreen.jsx) — reuse for XP/points animation
- `celebrationTiers.js` + `celebrationMessages.js` — keep for title/subtitle generation
- `ConfettiEffect` component — stays as overlay, no changes needed
- `BossUnlockModal` component — stays as overlay, no changes needed
- `AccessoryUnlockModal` — stays as overlay, no changes needed
- `RateLimitBanner` — keep for rare edge case

### Established Patterns
- `landscape:flex-row` Tailwind variant used in NotesRecognitionGame for two-panel layout
- `landscape:` variants for responsive sizing (avatar, padding, gaps)
- Glass card pattern: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`
- Portrait-first design philosophy (WCAG 1.3.4)

### Integration Points
- Props interface stays identical — all 4 game components (NotesRecognitionGame, SightReadingGame, MetronomeTrainer, MemoryGame) pass same pattern
- `updateExerciseProgress()` and `updateNodeProgress()` calls unchanged
- `awardXP()` call unchanged
- `navigateToNextNode()` logic unchanged
- `useBossUnlockTracking` hook unchanged
- Business logic (725 lines of hooks/effects) should be extracted into `useVictoryState` custom hook — zero behavior change

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-redesign-victoryscreen-for-simplicity-and-mobile-landscape-fit*
*Context gathered: 2026-03-08*
