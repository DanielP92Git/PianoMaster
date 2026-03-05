# Phase 19: Notes Recognition Engagement - Context

**Gathered:** 2026-03-05
**Updated:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the Notes Recognition game from a straightforward drill into an arcade-feel experience. Adds a visible combo counter with tiered multiplier, speed bonus for fast answers, a 3-heart lives system, an "on fire" visual mode after 5 consecutive correct answers, and session-scoped auto-growing note pool. Does not change other game modes, trail node definitions, XP level structure, or VictoryScreen architecture.

</domain>

<decisions>
## Implementation Decisions

### Combo Counter & Multiplier
- Prominent animated counter displayed during play — central to the game feel
- Display: streak count (e.g., "x7") with a small multiplier badge (e.g., "2x") when a tier is active
- On wrong answer: counter shakes briefly, resets to 0 — quick feedback, get back to building immediately
- Combo counter visible at all times during gameplay (not only at end)

### Multiplier Tiers
- Claude's discretion on exact tier thresholds and multiplier values — design for 8-year-old comprehension (simple, not too many numbers)
- Speed bonus stacks with combo multiplier — fast + high combo = peak scoring moments

### Speed Bonus
- Fixed 3-second threshold — answering correctly within 3s triggers speed bonus
- Visual indicator shown briefly when speed bonus triggers (e.g., "FAST!" flash)
- Threshold does not adapt per node — same 3s everywhere for consistency

### Lives System
- 3 heart icons displayed in the HUD area
- Lives always active — both trail mode and free practice
- No invincibility window — every wrong answer costs a life immediately
- No earn-back — 3 lives is the budget for the session, no restoration
- Game ends when all 3 hearts are lost OR the question limit is reached, whichever comes first
- Works alongside the existing timed mode and question limit — three possible end conditions: lives, question limit, timer
- Game-over tone: encouraging — "Great try! You got X right!" focusing on what they achieved, not the failure
- Uses existing GameOverScreen with a lives-specific encouraging message

### On-Fire Mode
- Activates after 5 consecutive correct answers
- Subtle warm glow — background shifts slightly warmer, gentle particle drift. Noticeable but not distracting from the note
- Visual only — no gameplay bonus (combo multiplier already rewards streaks)
- Persists until a wrong answer
- On break: flame-out animation (~500ms) as fire fades away — polished transition, not instant cut
- Sound cue: brief whoosh/chime sound when fire mode activates
- Reduced motion: static warm glow border + "ON FIRE" text badge (no particles)
- Respects existing AccessibilityContext reducedMotion setting

### Auto-Grow Note Pool
- Trail mode only — free practice uses whatever notes the student configured
- After every 5 correct answers in a streak, 1 note silently added to the session pool
- Consistent cadence — always every 5 streak, no acceleration
- New notes follow trail pedagogy — next note from the next trail node's pool (e.g., after C,D,E add F because that's what the next node teaches)
- In-game banner notification (not system toast) — brief banner across the game area saying "New note unlocked!" integrated with gameplay feel
- Session-scoped only — pool resets when game restarts, each session starts with node's original pool
- New notes also appear as answer button options when added

### Claude's Discretion
- Multiplier tier thresholds and exact multiplier values (design for 8-year-old comprehension)
- Base score per correct answer with multiplier applied
- Auto-grow note pool cap (how many extra notes max per session, based on typical node pool sizes)
- Combo counter animation style and positioning within the glass-morphism HUD
- Speed bonus visual indicator design
- Heart icon animation on life loss (shatter/fade)
- Fire mode whoosh/chime sound implementation
- How score is reported to VictoryScreen (whether combo/speed bonuses are broken down or just shown as total)

</decisions>

<specifics>
## Specific Ideas

- Combo counter should feel prominent — a core motivator during play, not a subtle afterthought
- Quick shake on combo break (not fade-out or lingering message) — get back to building immediately
- On-fire particles similar to the trail's enchanted forest CSS effects (ember/star floating) but subtle
- Hearts are the universally-understood kid-friendly life icon choice
- In-game banner for "New note unlocked!" makes it feel like a gameplay reward, not a system notification
- Game-over should feel encouraging — 8-year-olds need positive reinforcement even on failure
- Fire mode flame-out animation gives closure to the streak rather than abrupt cut

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/games/hooks/useGameProgress.js`: Current scoring with `handleAnswer()` (+10 per correct), `progress.score`, `progress.correctAnswers` — combo/speed multiplier integrates here
- `src/features/games/hooks/useSounds.js`: `playCorrectSound`, `playWrongSound` — fire mode whoosh/chime sound adds here
- `src/components/animations/Firework.jsx`: Existing particle animation component — may inform fire particle approach
- `src/utils/useMotionTokens.js`: Motion token system for reduced motion — fire mode uses this
- `src/contexts/AccessibilityContext`: `reducedMotion` setting — particles gated on this
- `framer-motion` (AnimatePresence, motion): Already used in NotesRecognitionGame for note flash and feedback — combo counter and fire mode animations use same library

### Established Patterns
- Glass-morphism HUD: `bg-white/10 backdrop-blur-md border-white/20` — combo counter and hearts use this
- Answer feedback: 800ms delay with green/red button highlight — speed bonus indicator fits this timing
- Timer display: `TimerDisplay` component with progress bar — lives display follows similar HUD pattern
- `react-hot-toast`: Used throughout app but NOT for in-game banner — banner is a custom game-area element

### Integration Points
- `NotesRecognitionGame.jsx` `handleAnswerSelect()`: Core answer flow — combo tracking, lives deduction, speed timing, and auto-grow all hook in here
- `useGameProgress.handleAnswer()`: Currently returns `isCorrect` boolean — may need to accept combo/speed data for score calculation
- `getRandomNote()`: Current note selection from filtered pool — auto-grow expands this pool mid-session (trail mode only)
- `handleGameOver()`: Currently checks `scorePercentage < 50 || timeRanOut` — add `livesRemaining <= 0` condition
- `VictoryScreen.jsx`: Receives score data — needs to display combo stats and handle lives-depletion game-over variant
- `startGame()`: Initializes session — needs to reset combo, lives, and pool to defaults
- Trail node data (`src/data/units/`): Auto-grow reads next node's note pool for pedagogical note progression

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-notes-recognition-engagement*
*Context gathered: 2026-03-05*
