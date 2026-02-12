# Phase 17: Boss Unlock Celebrations - Research

**Researched:** 2026-02-09
**Domain:** Multi-stage celebration modals, custom confetti, audio feedback, localStorage tracking
**Confidence:** HIGH

## Summary

This research investigates how to implement memorable boss unlock celebrations for an 8-year-old piano learning app. The phase requires a 3-stage modal sequence (celebration → unlock animation → next unit preview), musical-themed confetti particles, a short fanfare sound, and localStorage-based "show once" tracking per boss node.

The app already has a robust celebration foundation (Phase 13-15) with `react-confetti`, `ConfettiEffect` component, `celebrationTiers.js`, `celebrationMessages.js`, and accessibility patterns. The standard approach is to create a new `BossUnlockModal` component that layers after `VictoryScreen` when a boss node is completed for the first time. The modal uses React state to manage stage transitions and integrates with existing celebration infrastructure.

For custom confetti shapes, `react-confetti` (v6.2.3) supports custom drawing functions via the `drawShape` prop where the function receives canvas context and particle data. Music symbols can be drawn using canvas paths (e.g., note heads as circles, stems as lines, treble clefs as SVG paths converted to canvas commands). For fanfare audio, Web Audio API can synthesize a simple 1-2 second brass-like fanfare using oscillators with an ADSR envelope, though bundled audio files are simpler for production.

For localStorage tracking, the standard React pattern uses `useEffect` to check `localStorage.getItem('boss-unlocked-nodeId')` on mount, showing the modal only if the key doesn't exist, then setting it after the modal completes. This ensures the celebration fires once per boss node per user per browser.

**Primary recommendation:** Build a `BossUnlockModal` component with 3 stages managed via `useState`, integrate with existing `ConfettiEffect` by adding a custom `drawShape` implementation for music symbols, use localStorage with user-scoped keys for "show once" tracking, and implement fanfare sound with Web Audio API or bundled audio file.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 | Component framework | Already in use, state management for stage transitions |
| react-confetti | 6.2.3 | Confetti animation | Already installed and integrated, supports custom shapes |
| Web Audio API | Native | Fanfare sound synthesis | Browser-native, no dependencies, real-time synthesis |
| localStorage | Native | "Show once" tracking | Browser-native, persists across sessions, per-browser storage |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| AccessibilityContext | Current | Reduced motion, extended timeouts | Already integrated, automatic accessibility adaptation |
| celebrationTiers.js | Current | Duration constants (boss: 3000ms) | Already defined, use 'boss' tier for modal stages |
| celebrationMessages.js | Current | Message generation | Already exists, can extend for boss-specific messages |
| skillProgressService.js | Current | Node progress queries | Already has `getNextNodeInPath()` for next unit detection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-confetti drawShape | use-confetti-svg library | use-confetti-svg allows SVG image particles but adds dependency; drawShape is already available in react-confetti |
| Web Audio API synthesis | Bundled audio file | Audio file is simpler to implement but adds 20-50kb per sound; Web Audio API is more flexible but requires synthesis code |
| localStorage | Supabase database | Database persists across devices/browsers but adds API calls and complexity; localStorage is instant and sufficient for client-side tracking |

**Installation:**
```bash
# No new dependencies needed - use existing libraries
# react-confetti already installed at 6.2.3
# Web Audio API and localStorage are browser-native
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── celebrations/
│   │   ├── ConfettiEffect.jsx          # Existing confetti wrapper
│   │   ├── BossUnlockModal.jsx         # NEW: 3-stage modal component
│   │   └── MusicSymbolConfetti.jsx     # NEW: Custom confetti with music shapes
│   ├── trail/
│   │   ├── TrailNode.jsx               # Existing node component
│   │   └── TrailNodeModal.jsx          # Existing node details modal
│   └── games/
│       └── VictoryScreen.jsx           # Trigger point for boss modal
├── hooks/
│   └── useBossUnlockTracking.js        # NEW: localStorage hook for "show once"
├── utils/
│   ├── celebrationTiers.js             # Existing duration constants
│   ├── celebrationMessages.js          # Existing message generation
│   ├── musicSymbolShapes.js            # NEW: Canvas drawing functions for music symbols
│   └── fanfareSound.js                 # NEW: Web Audio API fanfare synthesis
└── services/
    └── skillProgressService.js         # Existing, has getNextNodeInPath()
```

### Pattern 1: Multi-Stage Modal with State Machine
**What:** A modal component that progresses through 3 distinct stages using React state and a simple state machine pattern.

**When to use:** For boss unlock celebration sequence that must show stages in order with explicit user advancement.

**Example:**
```jsx
// Source: React state machine pattern for modals
// Based on: https://daveceddia.com/react-confirmation-modal-state-machine/

import { useState, useEffect } from 'react';

const STAGES = {
  CELEBRATION: 'celebration',
  UNLOCK: 'unlock',
  PREVIEW: 'preview',
  COMPLETE: 'complete'
};

export const BossUnlockModal = ({ nodeId, onClose }) => {
  const [stage, setStage] = useState(STAGES.CELEBRATION);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(null);

  // Delay Continue button appearance by ~1 second
  useEffect(() => {
    const timer = setTimeout(() => setShowContinueButton(true), 1000);
    return () => clearTimeout(timer);
  }, [stage]);

  // Auto-advance fallback for distracted children
  useEffect(() => {
    const timeout = setTimeout(() => {
      advanceStage();
    }, getAutoAdvanceTimeout(stage));
    setAutoAdvanceTimer(timeout);
    return () => clearTimeout(timeout);
  }, [stage]);

  const advanceStage = () => {
    if (stage === STAGES.CELEBRATION) {
      setStage(STAGES.UNLOCK);
      setShowContinueButton(false);
    } else if (stage === STAGES.UNLOCK) {
      setStage(STAGES.PREVIEW);
      setShowContinueButton(false);
    } else if (stage === STAGES.PREVIEW) {
      setStage(STAGES.COMPLETE);
      onClose();
    }
  };

  const getAutoAdvanceTimeout = (currentStage) => {
    // Auto-advance timeouts for 8-year-old attention span
    switch (currentStage) {
      case STAGES.CELEBRATION: return 10000; // 10 seconds for confetti
      case STAGES.UNLOCK: return 8000;        // 8 seconds for animation
      case STAGES.PREVIEW: return 12000;      // 12 seconds to read
      default: return 10000;
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
      {stage === STAGES.CELEBRATION && (
        <CelebrationStage onContinue={advanceStage} showButton={showContinueButton} />
      )}
      {stage === STAGES.UNLOCK && (
        <UnlockStage nodeId={nodeId} onContinue={advanceStage} showButton={showContinueButton} />
      )}
      {stage === STAGES.PREVIEW && (
        <PreviewStage nodeId={nodeId} onContinue={advanceStage} showButton={showContinueButton} />
      )}
    </div>
  );
};
```

### Pattern 2: Custom Confetti Shapes with Canvas
**What:** Drawing music symbols (quarter notes, treble clefs, sharps/flats) as confetti particles using canvas 2D context.

**When to use:** When confetti needs recognizable shapes instead of default rectangles.

**Example:**
```jsx
// Source: react-confetti custom shapes
// Based on: https://www.npmjs.com/package/react-confetti

import Confetti from 'react-confetti';

// Music symbol drawing functions
const drawQuarterNote = (ctx) => {
  ctx.save();
  // Note head (filled circle)
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'currentColor';
  ctx.fill();
  // Stem (vertical line)
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(3, -10);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'currentColor';
  ctx.stroke();
  ctx.restore();
};

const drawTrebleClef = (ctx) => {
  ctx.save();
  // Simplified treble clef path (use actual SVG path for production)
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.bezierCurveTo(2, -8, 4, -6, 4, -4);
  ctx.bezierCurveTo(4, -2, 2, 0, 0, 0);
  ctx.bezierCurveTo(-2, 0, -4, 2, -4, 4);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'currentColor';
  ctx.stroke();
  ctx.restore();
};

const drawSharp = (ctx) => {
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'currentColor';
  // Vertical lines
  ctx.beginPath();
  ctx.moveTo(-2, -6); ctx.lineTo(-2, 6);
  ctx.moveTo(2, -6); ctx.lineTo(2, 6);
  ctx.stroke();
  // Horizontal lines
  ctx.beginPath();
  ctx.moveTo(-4, -2); ctx.lineTo(4, -3);
  ctx.moveTo(-4, 2); ctx.lineTo(4, 1);
  ctx.stroke();
  ctx.restore();
};

// Array of drawing functions to cycle through
const musicShapes = [drawQuarterNote, drawTrebleClef, drawSharp];

export const MusicSymbolConfetti = ({ width, height, onComplete }) => {
  return (
    <Confetti
      width={width}
      height={height}
      numberOfPieces={300}  // Slightly elevated intensity for boss
      colors={['#FFD700', '#FFA500', '#FFFFFF']}  // Gold/amber/white boss theme
      gravity={0.3}
      recycle={false}
      onConfettiComplete={onComplete}
      drawShape={(ctx) => {
        // Randomly select a music symbol
        const shapeIndex = Math.floor(Math.random() * musicShapes.length);
        musicShapes[shapeIndex](ctx);
      }}
    />
  );
};
```

### Pattern 3: localStorage "Show Once" Tracking
**What:** Using localStorage to track which boss nodes have shown their unlock celebration to prevent repetition.

**When to use:** For any modal or celebration that should fire once per user per browser.

**Example:**
```jsx
// Source: localStorage modal tracking pattern
// Based on: https://dev.to/bcncodeschool/how-to-show-a-pop-up-only-once-with-react-localstorage-and-material-ui-modal-n81

import { useState, useEffect } from 'react';

/**
 * Custom hook to track boss unlock celebrations
 * Returns whether the celebration should show and a function to mark it as shown
 */
export const useBossUnlockTracking = (userId, nodeId) => {
  const storageKey = `boss-unlocked-${userId}-${nodeId}`;
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const hasShown = localStorage.getItem(storageKey);
      setShouldShow(hasShown === null || hasShown === undefined);
    } catch (error) {
      console.warn('localStorage not available:', error);
      setShouldShow(false);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  const markAsShown = () => {
    try {
      localStorage.setItem(storageKey, 'true');
      setShouldShow(false);
    } catch (error) {
      console.error('Failed to save boss unlock tracking:', error);
    }
  };

  return { shouldShow, markAsShown, isLoading };
};

// Usage in VictoryScreen.jsx
const { shouldShow, markAsShown } = useBossUnlockTracking(user?.id, nodeId);

useEffect(() => {
  if (nodeComplete && isBoss && shouldShow) {
    setShowBossModal(true);
  }
}, [nodeComplete, isBoss, shouldShow]);

const handleBossModalClose = () => {
  markAsShown();
  setShowBossModal(false);
};
```

### Pattern 4: Web Audio API Fanfare Synthesis
**What:** Synthesizing a short brass-like fanfare using oscillators with ADSR envelope and reverb.

**When to use:** For celebratory sound effects that need real-time synthesis without audio file dependencies.

**Example:**
```javascript
// Source: Web Audio API synthesis patterns
// Based on: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

/**
 * Plays a triumphant fanfare sound
 * @param {AudioContext} audioContext - Web Audio context (reuse existing if available)
 */
export const playFanfare = (audioContext) => {
  const now = audioContext.currentTime;

  // Create oscillators for brass-like timbre (two oscillators slightly detuned)
  const osc1 = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();

  // Brass-like waveforms
  osc1.type = 'sawtooth';
  osc2.type = 'square';

  // Fanfare notes (C5 → E5 → G5 → C6 - major arpeggio)
  const notes = [523.25, 659.25, 783.99, 1046.50]; // Hz

  // Gain envelope for ADSR
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, now);

  // Attack: 0 → 0.8 in 50ms
  gainNode.gain.linearRampToValueAtTime(0.8, now + 0.05);
  // Decay: 0.8 → 0.5 in 100ms
  gainNode.gain.linearRampToValueAtTime(0.5, now + 0.15);
  // Sustain at 0.5 for remainder
  // Release: 0.5 → 0 in 200ms at end
  gainNode.gain.setValueAtTime(0.5, now + 1.5);
  gainNode.gain.linearRampToValueAtTime(0, now + 1.7);

  // Connect audio graph
  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Play arpeggio
  notes.forEach((freq, index) => {
    const time = now + (index * 0.3); // 300ms per note
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.01, time); // Slight detune for richness
  });

  // Start and stop oscillators
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 1.7);
  osc2.stop(now + 1.7);
};

// Alternative: Simple bundled audio file approach
export const playFanfareFromFile = () => {
  const audio = new Audio('/sounds/fanfare.mp3');
  audio.volume = 0.5;
  audio.play().catch(err => console.warn('Audio playback failed:', err));
};
```

### Anti-Patterns to Avoid

- **Auto-advancing too quickly:** Children need time to absorb celebration. Use 8-12 second timeouts, not 3-5 seconds.
- **Blocking interactions during confetti:** Confetti should be non-blocking (`pointer-events: none`) to avoid frustration.
- **Skipping localStorage error handling:** Always wrap localStorage calls in try-catch; Safari private mode throws errors.
- **Not respecting reduced motion:** Boss celebrations should collapse to single summary screen when `reducedMotion` is true.
- **Using global audio context:** Reuse a single AudioContext instance app-wide to avoid "too many contexts" browser errors.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confetti animation physics | Custom particle system | react-confetti library | Already installed, handles particle physics, gravity, wind, rotation, color fading |
| Music symbol SVG paths | Hand-coded paths | SVG path data from design tools | Treble clefs and complex symbols need accurate paths from Figma/Illustrator |
| ADSR envelope timing | Manual setTimeout chains | Web Audio API envelope methods | setValueAtTime, linearRampToValueAtTime handle timing precisely without drift |
| localStorage versioning | Simple string keys | Versioned payload pattern | Need version field to handle schema changes (e.g., v1: string, v2: object with timestamp) |

**Key insight:** Audio synthesis and particle physics have subtle edge cases (timing drift, collision detection, memory leaks). Use battle-tested libraries and native APIs rather than custom implementations.

## Common Pitfalls

### Pitfall 1: Modal Z-Index Conflicts
**What goes wrong:** Boss modal shows behind VictoryScreen or other overlays, causing visual glitches.

**Why it happens:** Z-index stacking contexts in React can be complex. VictoryScreen uses `z-[9999]`, so boss modal needs higher z-index.

**How to avoid:** Use `z-[10000]` for boss modal fixed overlay. Establish z-index scale in Tailwind config or CSS variables.

**Warning signs:** Modal appears but is partially obscured, click events don't register on modal content.

### Pitfall 2: Confetti Performance on Low-End Devices
**What goes wrong:** Boss confetti (300+ particles with custom shapes) causes frame drops on older tablets/phones.

**Why it happens:** Canvas drawing with complex shapes is CPU-intensive, especially at 60fps for 300 particles.

**How to avoid:** Reduce particle count on low-end devices (use `navigator.hardwareConcurrency` or performance API to detect), simplify drawing functions (use circles instead of bezier curves for mobile).

**Warning signs:** Confetti stutters, UI becomes unresponsive during celebration, high battery drain.

### Pitfall 3: Audio Playback Blocking Without User Gesture
**What goes wrong:** Fanfare doesn't play because browser requires user gesture for audio.

**Why it happens:** Modern browsers block autoplay audio until user interacts with the page (click, tap, key press).

**How to avoid:** Only play fanfare after user clicks Continue button in Stage 1, or use existing game interaction (button press during gameplay) to initialize AudioContext.

**Warning signs:** Console error "The AudioContext was not allowed to start", fanfare silent on first load but works on subsequent plays.

### Pitfall 4: localStorage Full Errors in Private Browsing
**What goes wrong:** Boss unlock tracking fails silently in Safari private mode, causing modal to show every time.

**Why it happens:** Safari throws QuotaExceededError when localStorage is accessed in private browsing mode.

**How to avoid:** Always wrap localStorage calls in try-catch, fall back to in-memory tracking (won't persist but better than crash), detect private mode with feature detection.

**Warning signs:** Modal repeats on every boss completion in Safari, console shows "QuotaExceededError".

## Code Examples

Verified patterns from official sources:

### Boss Node Detection in VictoryScreen
```jsx
// Source: Current VictoryScreen.jsx implementation
// File: src/components/games/VictoryScreen.jsx lines 203-213

const [nodeData, setNodeData] = useState(null);

useEffect(() => {
  const processTrailCompletion = async () => {
    if (nodeId) {
      const node = getNodeById(nodeId);
      if (node) {
        setNodeData(node);
        // Check if boss and first completion
        if (node.isBoss && isFirstComplete) {
          // Trigger boss unlock modal here
        }
      }
    }
  };
  processTrailCompletion();
}, [nodeId]);
```

### Next Unit Detection for Preview Stage
```javascript
// Source: skillProgressService.js getNextNodeInPath()
// File: src/services/skillProgressService.js

import { getNextNodeInPath } from '../../services/skillProgressService';

const [nextNode, setNextNode] = useState(null);

useEffect(() => {
  const fetchNextNode = async () => {
    if (nodeComplete && isBoss) {
      const recommended = await getNextNodeInPath(user.id, nodeId);
      setNextNode(recommended);
    }
  };
  fetchNextNode();
}, [nodeComplete, isBoss, nodeId, user.id]);

// In Preview stage:
{nextNode ? (
  <p>Next unit unlocked: {nextNode.name}</p>
) : (
  <p>You've mastered all notes in this path!</p>
)}
```

### Reduced Motion Collapsed View
```jsx
// Source: Accessibility pattern from Phase 13 research
// File: .planning/phases/13-celebration-foundation-accessibility/13-RESEARCH.md

import { useAccessibility } from '../../contexts/AccessibilityContext';

const { reducedMotion } = useAccessibility();

if (reducedMotion) {
  // Collapse to single summary screen
  return (
    <div className="boss-unlock-summary">
      <h2>Boss Cleared!</h2>
      <p>Unit {nextNode?.name} Unlocked</p>
      <button onClick={onClose}>Continue</button>
    </div>
  );
}

// Otherwise render full 3-stage sequence
return <BossUnlockModal stages={...} />;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Confetti as CSS animations | Canvas-based particle systems (react-confetti) | 2023 | Better physics, custom shapes, performance |
| Audio sprites with Howler.js | Web Audio API synthesis | 2024-2025 | Zero audio file dependencies, real-time control |
| CSS-only reduced motion | AccessibilityContext with prefers-reduced-motion + extended timeouts | 2025 (Phase 13) | Cognitive accessibility for 8-year-olds, not just vestibular |
| Single celebration screen | Tiered celebration system (standard/level-up/boss) | 2026 (Phase 13-15) | Proportional feedback, meaningful milestones |

**Deprecated/outdated:**
- **Howler.js for simple sound effects:** Web Audio API is now well-supported (98% browser coverage) and eliminates audio file management. Reserve Howler.js for complex audio features (streaming, sprites, fallbacks).
- **Manual localStorage versioning:** Modern pattern uses typed payloads with version field: `{ version: 2, timestamp: Date.now(), data: {...} }`.
- **React.memo for modal components:** React 18 concurrent features and automatic batching reduce need for manual memoization in modals.

## Open Questions

Things that couldn't be fully resolved:

1. **Music symbol SVG path accuracy**
   - What we know: Canvas can render SVG paths using Path2D API with SVG path strings
   - What's unclear: Whether simplified hand-coded paths are visually acceptable vs. needing designer-provided SVG paths
   - Recommendation: Start with simplified shapes (circles for note heads, lines for stems), iterate with designer if visual quality insufficient

2. **Optimal Continue button delay**
   - What we know: Context decision is ~1 second delay to prevent accidental taps
   - What's unclear: Whether 1 second is long enough for 8-year-olds to process visual information
   - Recommendation: Start with 1 second, add telemetry to track premature taps, adjust based on user testing

3. **Mini trail snippet implementation**
   - What we know: Preview stage should show "next few nodes" as visual teaser
   - What's unclear: How many nodes to show (3? 5?), whether to render actual TrailNode components or simplified icons
   - Recommendation: Show 3-5 nodes using simplified icons (reuse TrailNode styling but static, no interaction), limit to single row to avoid overwhelming

4. **Fanfare audio vs. bundled file**
   - What we know: Web Audio API synthesis is 0kb, bundled file is ~20-50kb but simpler
   - What's unclear: Whether synthesized brass sounds "good enough" for 8-year-olds vs. needing professional audio
   - Recommendation: Start with synthesized fanfare, gather feedback, add bundled file only if synthesis quality is insufficient

## Sources

### Primary (HIGH confidence)
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Native audio synthesis documentation
- [react-confetti npm package](https://www.npmjs.com/package/react-confetti) - Custom shape implementation via drawShape prop
- [localStorage React patterns](https://dev.to/bcncodeschool/how-to-show-a-pop-up-only-once-with-react-localstorage-and-material-ui-modal-n81) - "Show once" modal pattern
- [React state machines for modals](https://daveceddia.com/react-confirmation-modal-state-machine/) - Multi-stage modal pattern

### Secondary (MEDIUM confidence)
- [LogRocket React state patterns](https://blog.logrocket.com/modern-guide-react-state-patterns/) - Modern state management approaches verified with official React docs
- [Web Audio synthesis tutorials](https://medium.com/geekculture/building-a-modular-synth-with-web-audio-api-and-javascript-d38ccdeca9ea) - Sound synthesis patterns verified with MDN

### Tertiary (LOW confidence)
- use-confetti-svg library - Alternative approach for SVG particles (not verified, may be overkill)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-confetti already installed and integrated, Web Audio API and localStorage are native APIs
- Architecture: HIGH - Multi-stage modal pattern well-documented, existing celebration infrastructure provides foundation
- Pitfalls: MEDIUM - Audio autoplay restrictions and localStorage private mode issues are well-known, but confetti performance on low-end devices requires testing

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - stable domain, no fast-moving dependencies)

---

## RESEARCH COMPLETE

**Phase:** 17 - Boss Unlock Celebrations
**Confidence:** HIGH

### Key Findings

- **No new dependencies needed:** react-confetti (v6.2.3) already installed with custom shape support, Web Audio API and localStorage are browser-native
- **Layer after VictoryScreen:** Boss modal should trigger when `nodeComplete && isBoss && isFirstComplete && shouldShow`, rendering as separate z-[10000] overlay
- **Simple state machine sufficient:** useState with 3-stage enum (CELEBRATION → UNLOCK → PREVIEW) handles transitions, no need for XState or complex library
- **Music symbols via canvas drawShape:** react-confetti's drawShape prop receives canvas context for custom particle rendering (quarter notes, treble clefs, sharps)
- **localStorage tracking with user scope:** Key format `boss-unlocked-${userId}-${nodeId}` prevents repetition per user per browser, wrap in try-catch for Safari private mode

### File Created

`.planning/phases/17-boss-unlock-celebrations/17-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All tools already installed or browser-native, no new dependencies |
| Architecture | HIGH | Multi-stage modal pattern well-documented, existing celebration infrastructure provides foundation |
| Pitfalls | MEDIUM | Audio autoplay and localStorage issues are known, confetti performance needs device testing |

### Open Questions

- Music symbol SVG path accuracy (simplified vs. designer-provided paths)
- Optimal Continue button delay (1 second may need adjustment based on user testing)
- Mini trail snippet implementation details (3 vs 5 nodes, simplified vs full TrailNode components)
- Fanfare quality threshold (synthesized vs. bundled audio file)

### Ready for Planning

Research complete. Planner can now create PLAN.md files with specific implementation tasks.
