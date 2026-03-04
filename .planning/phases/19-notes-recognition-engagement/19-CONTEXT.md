# Phase 19: Notes Recognition Engagement - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the Notes Recognition game from a straightforward drill into an arcade-feel experience. Adds a visible combo counter with tiered multiplier, speed bonus for fast answers, a 3-heart lives system, an "on fire" visual mode after 5 consecutive correct answers, and session-scoped auto-growing note pool. Does not change other game modes, trail node definitions, XP level structure, or VictoryScreen architecture.

</domain>

<decisions>
## Implementation Decisions

### Combo Counter & Multiplier
- Prominent animated counter displayed during play — central to the game feel, like Guitar Hero's combo display
- Tiered multiplier: 1x base, 1.5x at 3 correct, 2x at 5 correct, 3x at 10 correct
- On wrong answer: counter shakes briefly, resets to 0 — quick feedback without dwelling on the miss
- Combo counter visible at all times during gameplay (not only at end)

### Speed Bonus
- Answering correctly within 3 seconds triggers a speed bonus
- Speed bonus stacks with combo multiplier — fast + high combo = peak scoring moments
- Visual indicator shown briefly when speed bonus triggers (e.g., "FAST!" flash)

### Lives System
- 3 heart icons displayed in the HUD area
- Lives always active — both trail mode and free practice
- Lost heart: classic shatter/fade animation on the heart icon
- Game ends when all 3 hearts are lost OR the question limit is reached, whichever comes first
- Lives depletion uses the existing VictoryScreen/GameOverScreen with a lives-specific message (e.g., "All hearts gone!")
- Works alongside the existing timed mode and question limit — three possible end conditions: lives, question limit, timer

### On-Fire Mode
- Activates after 5 consecutive correct answers
- Background color shift to warm tones + floating ember/star particles
- Visual only — no gameplay bonus (combo multiplier already rewards streaks)
- Persists until a wrong answer
- Reduced motion: static warm glow border + "ON FIRE" text badge (no particles)
- Respects existing AccessibilityContext reducedMotion setting

### Auto-Grow Note Pool
- After 5 correct answers in a streak, 1 note silently added to the session pool
- New notes come from the next note in the scale (musical progression, not random)
- Subtle non-blocking toast: "New note unlocked!" when pool expands
- Session-scoped only — pool resets when game restarts, each session starts with node's original pool
- New notes also appear as answer button options when added

### Claude's Discretion
- Fire mode audio cue (whether a 'whoosh' sound plays on activation)
- Auto-grow note pool cap (how many extra notes max per session, based on typical node pool sizes)
- Exact tiered multiplier point values (base score per correct answer with multiplier applied)
- Combo counter animation style and positioning within the glass-morphism HUD
- Speed bonus visual indicator design
- Heart icon animation on life loss
- How score is reported to VictoryScreen (whether combo/speed bonuses are broken down or just shown as total)

</decisions>

<specifics>
## Specific Ideas

- Combo counter should feel prominent — a core motivator during play, not a subtle afterthought
- Quick shake on combo break (not fade-out or lingering message) — get back to building immediately
- On-fire particles similar to the trail's enchanted forest CSS effects (ember/star floating)
- Hearts are the universally-understood kid-friendly life icon choice
- "New note unlocked!" toast makes the auto-grow feel like a reward, not a difficulty spike

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/games/hooks/useGameProgress.js`: Current scoring with `handleAnswer()` (+10 per correct), `progress.score`, `progress.correctAnswers` — combo/speed multiplier integrates here
- `src/features/games/hooks/useSounds.js`: `playCorrectSound`, `playWrongSound` — fire mode audio cue would add here
- `src/components/animations/Firework.jsx`: Existing particle animation component — may inform fire particle approach
- `src/utils/useMotionTokens.js`: Motion token system for reduced motion — fire mode uses this
- `src/contexts/AccessibilityContext`: `reducedMotion` setting — particles gated on this
- `framer-motion` (AnimatePresence, motion): Already used in NotesRecognitionGame for note flash and feedback — combo counter and fire mode animations use same library

### Established Patterns
- Glass-morphism HUD: `bg-white/10 backdrop-blur-md border-white/20` — combo counter and hearts use this
- Answer feedback: 800ms delay with green/red button highlight — speed bonus indicator fits this timing
- Timer display: `TimerDisplay` component with progress bar — lives display follows similar HUD pattern
- `react-hot-toast`: Used throughout app — "New note unlocked!" toast uses this

### Integration Points
- `NotesRecognitionGame.jsx` `handleAnswerSelect()`: Core answer flow — combo tracking, lives deduction, speed timing, and auto-grow all hook in here
- `useGameProgress.handleAnswer()`: Currently returns `isCorrect` boolean — may need to accept combo/speed data for score calculation
- `getRandomNote()`: Current note selection from filtered pool — auto-grow expands this pool mid-session
- `handleGameOver()`: Currently checks `scorePercentage < 50 || timeRanOut` — add `livesRemaining <= 0` condition
- `VictoryScreen.jsx`: Receives score data — needs to display combo stats and handle lives-depletion game-over variant
- `startGame()`: Initializes session — needs to reset combo, lives, and pool to defaults

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-notes-recognition-engagement*
*Context gathered: 2026-03-05*
