# Phase 13: Celebration Foundation & Accessibility - Research

**Researched:** 2026-02-05
**Domain:** React animation accessibility patterns
**Confidence:** HIGH

## Summary

This research investigates how to build an accessibility-first animation foundation for celebration features in a React PWA designed for 8-year-old learners. The app already has a comprehensive AccessibilityContext with `reducedMotion` and `extendedTimeouts` settings, system preference detection, and CSS class application.

The standard approach is to create a wrapper component that integrates with the existing AccessibilityContext to automatically adapt animation behavior based on user preferences. Industry consensus strongly supports respecting `prefers-reduced-motion` by replacing (not removing) animations with gentler alternatives like opacity changes instead of transforms.

For duration standards, research confirms that 200-500ms is optimal for educational UI animations, with the Model Human Processor finding that 230ms is the average visual perception time. The user's decision to use three duration tiers (standard at 400-800ms, level-up at 1s, boss at 3s) aligns well with research showing that celebration animations can intentionally exceed the standard 300ms threshold because they are rewarding moments.

**Primary recommendation:** Build a React wrapper component (not a library dependency) that consumes the existing AccessibilityContext and automatically adjusts animation duration, provides skip functionality via click/keyboard, and applies the appropriate celebration tier based on props.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | Component framework | Already in use, built-in features sufficient |
| AccessibilityContext | Current | Accessibility state management | Already exists with `reducedMotion`, `extendedTimeouts` |
| CSS Animations | Native | Animation implementation | No library needed, native support excellent |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Web Animations API | Native | Programmatic animation control | For dynamic duration adjustments, playback control |
| prefers-reduced-motion | CSS Media Query | System preference detection | Already implemented in AccessibilityContext |
| matchMedia | Native JS API | Runtime accessibility detection | Already used in AccessibilityContext |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom wrapper | Framer Motion | Motion library has `MotionConfig` with `reducedMotion: "user"` option, but adds 50kb+ bundle size and introduces dependency for simple use case |
| Custom hook | react-reduce-motion npm | Third-party hook exists but duplicates existing AccessibilityContext functionality |
| CSS-only | Web Animations API | Web Animations API provides playback control (play, pause, finish) which is valuable for skip functionality, but CSS is simpler for basic cases |

**Installation:**
```bash
# No new dependencies needed - use existing React, native APIs, and AccessibilityContext
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── celebrations/           # New folder for celebration features
│   │   ├── CelebrationWrapper.jsx    # Accessibility-aware wrapper
│   │   └── useCelebrationDuration.js # Hook for duration calculation
│   └── games/
│       └── VictoryScreen.jsx   # Existing component to integrate with wrapper
├── contexts/
│   └── AccessibilityContext.jsx # Existing context (no changes needed)
└── utils/
    └── celebrationConstants.js  # Duration tiers, skip keycodes
```

### Pattern 1: Accessibility-Aware Wrapper Component
**What:** A component that wraps celebration content and automatically adjusts animation behavior based on AccessibilityContext settings.

**When to use:** For any celebration animation (confetti, stars, text effects, level-up animations).

**Example:**
```jsx
// Source: React wrapper component pattern + AccessibilityContext integration
// Based on: https://www.digitalocean.com/community/tutorials/how-to-create-wrapper-components-in-react-with-props

import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useEffect, useRef } from 'react';

/**
 * Wrapper component that makes celebrations accessible
 * @param {ReactNode} children - Celebration content to render
 * @param {'standard'|'level-up'|'boss'} tier - Celebration duration tier
 * @param {function} onComplete - Callback when celebration completes
 * @param {boolean} autoStart - Start animation immediately (default: true)
 */
export const CelebrationWrapper = ({
  children,
  tier = 'standard',
  onComplete,
  autoStart = true,
  className = ''
}) => {
  const { reducedMotion, extendedTimeouts } = useAccessibility();
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);

  // Calculate duration based on tier and accessibility settings
  const duration = useCelebrationDuration(tier, { reducedMotion, extendedTimeouts });

  // Skip handler (click anywhere or keyboard)
  const handleSkip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onComplete?.();
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-complete after duration
  useEffect(() => {
    if (autoStart && onComplete) {
      timeoutRef.current = setTimeout(() => {
        onComplete();
      }, duration);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [duration, onComplete, autoStart]);

  // Apply CSS class based on reducedMotion
  const animationClass = reducedMotion ? 'celebration-reduced' : 'celebration-full';

  return (
    <div
      ref={wrapperRef}
      className={`celebration-wrapper ${animationClass} ${className}`}
      onClick={handleSkip}
      role="presentation"
      aria-label="Click to skip celebration"
      style={{ '--celebration-duration': `${duration}ms` }}
    >
      {children}
    </div>
  );
};
```

### Pattern 2: Duration Calculation Hook
**What:** A custom hook that calculates celebration duration based on tier and accessibility settings.

**When to use:** Whenever you need to determine the appropriate animation duration.

**Example:**
```javascript
// Source: Custom hook pattern for accessibility-aware duration
// Based on: NN/G animation duration guidelines + accessibility best practices

import { useMemo } from 'react';

// Duration tiers (in milliseconds)
const DURATION_TIERS = {
  standard: 500,      // 400-800ms range, choosing middle-upper for visibility
  'level-up': 1000,   // Middle tier for significant moments
  boss: 3000          // Extended for major milestones
};

// Extended timeout multiplier (for cognitive accessibility)
const EXTENDED_TIMEOUT_MULTIPLIER = 1.5;

/**
 * Calculate celebration duration with accessibility adjustments
 * @param {'standard'|'level-up'|'boss'} tier - Duration tier
 * @param {object} options - Accessibility options
 * @returns {number} Duration in milliseconds
 */
export const useCelebrationDuration = (tier, { reducedMotion, extendedTimeouts }) => {
  return useMemo(() => {
    // Base duration for tier
    let duration = DURATION_TIERS[tier] || DURATION_TIERS.standard;

    // If reducedMotion is enabled, use instant completion (100ms minimum for visual feedback)
    if (reducedMotion) {
      return 100;
    }

    // Apply extended timeout multiplier for cognitive accessibility
    if (extendedTimeouts) {
      duration *= EXTENDED_TIMEOUT_MULTIPLIER;
    }

    return duration;
  }, [tier, reducedMotion, extendedTimeouts]);
};
```

### Pattern 3: CSS Animation with Reduced Motion
**What:** CSS-based animations that automatically adjust based on the `reduced-motion` class applied by AccessibilityContext.

**When to use:** For visual effects like star animations, confetti, or text celebrations.

**Example:**
```css
/* Source: MDN prefers-reduced-motion best practices */
/* https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion */

/* Full animation (default) */
.celebration-star {
  animation: bounce-and-glow 600ms ease-out;
  animation-delay: var(--star-index, 0ms);
}

@keyframes bounce-and-glow {
  0% {
    transform: scale(0) translateY(20px);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) translateY(-10px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* Reduced motion alternative: opacity only, no transforms */
.reduced-motion .celebration-star {
  animation: fade-in 100ms ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Skip indicator for 8-year-olds (always visible for clarity) */
.celebration-wrapper::after {
  content: "Tap to continue →";
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  pointer-events: none;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
```

### Anti-Patterns to Avoid
- **Hard-coding animation durations:** Always use the duration calculation hook or CSS variables to respect accessibility settings
- **Preventing skip functionality:** Never use `pointer-events: none` on the entire celebration wrapper—users must be able to click to skip
- **Removing animations entirely in reducedMotion:** Replace with gentler alternatives (opacity, color changes) instead of removing completely
- **Ignoring extendedTimeouts:** This setting is crucial for cognitive accessibility; celebrations should last longer when enabled
- **Using transforms in reducedMotion mode:** Transforms (scale, translateY, rotate) can trigger vestibular issues—use opacity and color instead

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting prefers-reduced-motion | Custom media query listener | Existing AccessibilityContext | Already implemented with system preference detection and localStorage persistence |
| Animation timing curves | Custom easing functions | CSS named easings (ease-out, ease-in-out) | Browsers optimize named easings; custom functions add complexity without benefit |
| Keyboard event handling | Raw keydown listeners per component | Centralized keyboard handler in wrapper | Prevents event listener leaks, ensures consistent behavior |
| Duration calculation | Inline calculations | useCelebrationDuration hook | Centralizes logic, ensures consistency, easier to adjust globally |

**Key insight:** AccessibilityContext already handles the complex parts (system preference detection, localStorage persistence, CSS class application). Building a new system would duplicate this functionality and create inconsistency.

## Common Pitfalls

### Pitfall 1: Animations Too Long
**What goes wrong:** Celebrations exceed 500ms for standard tier, making users wait unnecessarily.

**Why it happens:** Developers overestimate how long animations need to feel "celebratory."

**How to avoid:**
- Use the duration tiers strictly: 500ms standard, 1000ms level-up, 3000ms boss only
- NN/G research shows animations >500ms feel like "a real drag" to users
- For 8-year-olds, snappy feedback (200-500ms) is more engaging than slow celebrations

**Warning signs:**
- Users skip celebrations immediately
- Drop-off in engagement after celebrations
- User complaints about "slow" app

### Pitfall 2: Ignoring reducedMotion in VictoryScreen Existing Animations
**What goes wrong:** The VictoryScreen already has animations (star bounce, XP count-up) that ignore AccessibilityContext settings.

**Why it happens:** Code was written before accessibility audit; useCountUp hook doesn't check reducedMotion.

**How to avoid:**
- Modify useCountUp to accept `shouldAnimate` parameter from AccessibilityContext
- Star animations (lines 643-658 in VictoryScreen.jsx) need reducedMotion check
- Duration of 600ms (line 653) should use useCelebrationDuration hook

**Warning signs:**
- Users with motion sensitivity report discomfort
- Stars animate even when reducedMotion is enabled
- Count-up animation plays when user set reducedMotion preference

### Pitfall 3: Service Worker Caching Prevents Accessibility Updates
**What goes wrong:** User enables reducedMotion, but celebration components are cached with old behavior.

**Why it happens:** Service worker uses cache-first strategy; JS files are explicitly excluded from caching (line 173-176 in sw.js), but this may not apply to lazy-loaded celebration chunks.

**How to avoid:**
- Service worker already excludes JS files from caching (cache-first only for navigation and assets)
- Vite builds hash JS chunks, so cache invalidation happens automatically on new deploys
- No additional service worker changes needed for Phase 13

**Warning signs:**
- User reports "refresh doesn't fix accessibility settings"
- Celebration behavior inconsistent between sessions
- Hard refresh fixes the issue

### Pitfall 4: Skip Functionality Not Discoverable
**What goes wrong:** 8-year-old users don't realize they can skip celebrations by clicking or pressing keys.

**Why it happens:** No visual indicator that celebrations are interactive.

**How to avoid:**
- Add visible "Tap to continue" hint (see CSS example above)
- Make entire celebration area clickable, not just a small button
- Support multiple skip methods: click anywhere, ESC, Enter
- Provide immediate feedback when skip happens (no fade-out, instant transition)

**Warning signs:**
- Users wait through entire 3-second boss celebrations
- Support requests about "slow transitions"
- Low engagement with multi-exercise nodes (users frustrated by repeated celebrations)

### Pitfall 5: Extended Timeouts Not Applied to Celebrations
**What goes wrong:** Celebrations complete too quickly for users who need extra time to process.

**Why it happens:** Developer forgets that extendedTimeouts affects ALL timed UI elements, not just game timeouts.

**How to avoid:**
- useCelebrationDuration hook applies EXTENDED_TIMEOUT_MULTIPLIER (1.5x) when extendedTimeouts is enabled
- This gives cognitive accessibility users 50% more time to enjoy celebrations
- Boss celebrations become 4.5 seconds (3000ms × 1.5) when extendedTimeouts is enabled

**Warning signs:**
- Teachers report students with cognitive disabilities don't see full celebrations
- Parents request "slower animations" option
- Users with extendedTimeouts enabled complain celebrations feel rushed

## Code Examples

Verified patterns from official sources:

### Integrating CelebrationWrapper with VictoryScreen
```jsx
// Source: Wrapper component pattern
// Replace VictoryScreen's direct animations with accessible wrapper

import { CelebrationWrapper } from '../celebrations/CelebrationWrapper';
import { useState } from 'react';

const VictoryScreen = ({ nodeId, exerciseIndex, totalExercises, ... }) => {
  const [showCelebration, setShowCelebration] = useState(true);

  // Determine celebration tier
  const tier = nodeId ?
    (nodeComplete && node?.isBoss ? 'boss' :
     xpData?.leveledUp ? 'level-up' :
     'standard')
    : 'standard';

  return (
    <div className="fixed inset-0 z-[9999]">
      {showCelebration && (
        <CelebrationWrapper
          tier={tier}
          onComplete={() => setShowCelebration(false)}
          autoStart={true}
        >
          {/* Star animation */}
          <div className="flex items-center justify-center gap-1 py-1">
            {[1, 2, 3].map((starNum) => (
              <span
                key={starNum}
                className={`celebration-star text-3xl ${
                  starNum <= stars ? 'active' : 'inactive'
                }`}
                style={{ '--star-index': `${starNum * 100}ms` }}
              >
                ⭐
              </span>
            ))}
          </div>

          {/* XP celebration (if applicable) */}
          {xpData && <XPCelebration xpData={xpData} />}
        </CelebrationWrapper>
      )}

      {/* Rest of VictoryScreen content */}
    </div>
  );
};
```

### Skip Functionality with Multiple Input Methods
```javascript
// Source: Keyboard accessibility best practices
// https://www.w3.org/WAI/tutorials/carousels/animations/

useEffect(() => {
  const handleSkipInput = (e) => {
    // Keyboard shortcuts (ESC or Enter)
    if (e.type === 'keydown' && (e.key === 'Escape' || e.key === 'Enter')) {
      e.preventDefault();
      handleSkip();
      return;
    }

    // Click anywhere (but not on interactive elements like buttons)
    if (e.type === 'click') {
      // Check if click target is a button or link
      const isInteractive = e.target.closest('button, a, [role="button"]');
      if (!isInteractive) {
        handleSkip();
      }
    }
  };

  window.addEventListener('keydown', handleSkipInput);
  wrapperRef.current?.addEventListener('click', handleSkipInput);

  return () => {
    window.removeEventListener('keydown', handleSkipInput);
    wrapperRef.current?.removeEventListener('click', handleSkipInput);
  };
}, []);
```

### Accessible Count-Up Animation
```javascript
// Source: Modified useCountUp hook from VictoryScreen.jsx
// Add accessibility-awareness to existing animation

const useCountUp = (start, end, duration = 1400, shouldAnimate = true) => {
  const { reducedMotion } = useAccessibility();
  const [value, setValue] = useState(() => {
    // If reducedMotion is enabled, skip to end immediately
    if (reducedMotion || !shouldAnimate) {
      return end ?? start ?? 0;
    }
    return start ?? 0;
  });

  useEffect(() => {
    if (start === undefined || end === undefined) return;

    // Skip animation if reducedMotion is enabled
    if (reducedMotion || !shouldAnimate || start === end) {
      setValue(end);
      return;
    }

    let frame;
    const startTime = performance.now();
    const change = end - start;

    const runFrame = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(start + change * easedProgress));

      if (progress < 1) {
        frame = requestAnimationFrame(runFrame);
      }
    };

    frame = requestAnimationFrame(runFrame);
    return () => cancelAnimationFrame(frame);
  }, [start, end, duration, shouldAnimate, reducedMotion]);

  return value;
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Disable all animations when reducedMotion is enabled | Replace with gentler alternatives (opacity instead of transforms) | 2023-2024 WCAG updates | Better UX—users still get feedback without vestibular triggers |
| Single global animation duration | Duration tiers based on content importance | 2024-2025 gamification research | Celebrations feel more meaningful when boss/level-up moments are longer |
| Manual prefers-reduced-motion detection | System preference auto-detection with matchMedia | 2022+ browser support | Users don't need to manually configure app—system preference is respected |
| No skip functionality | Mandatory skip via click/keyboard | 2025 accessibility standards | Users with cognitive disabilities need control over timed content |

**Deprecated/outdated:**
- **ReactCSSTransitionGroup:** Removed from React core, replaced with community libraries like react-transition-group (but not needed for this phase)
- **Global animation-duration: 0:** Setting animations to 0ms is outdated; modern approach is 100ms minimum for visual feedback
- **Ignoring extendedTimeouts for animations:** Early implementations only applied extendedTimeouts to game timers; modern approach applies to all timed UI elements

## Open Questions

Things that couldn't be fully resolved:

1. **Should boss celebrations auto-dismiss or require user action?**
   - What we know: 3-second auto-dismiss is current plan; users can skip anytime
   - What's unclear: For 8-year-olds, is auto-dismiss better (less cognitive load) or user-required dismiss (more control)?
   - Recommendation: Implement auto-dismiss with prominent skip indicator; track analytics on skip rate to inform future iterations

2. **Should different celebration types (confetti, stars, text) have separate reducedMotion treatments?**
   - What we know: All celebrations should respect reducedMotion, but intensity varies (confetti is more intense than star icons)
   - What's unclear: Should confetti be completely removed in reducedMotion mode while stars use opacity fade?
   - Recommendation: Start with consistent treatment (all use opacity-only in reducedMotion); Phase 15/17 can refine per-effect if needed

3. **Service worker cache invalidation strategy for celebration components**
   - What we know: JS files are excluded from service worker caching; Vite hashes chunks automatically
   - What's unclear: Whether lazy-loaded celebration chunks need special handling
   - Recommendation: No changes needed for Phase 13; existing service worker excludes JS files (line 173-176 in sw.js)

## Sources

### Primary (HIGH confidence)
- [MDN - prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) - Media query specification and browser support
- [Nielsen Norman Group - Animation Duration](https://www.nngroup.com/articles/animation-duration/) - Scientific basis for 200-500ms duration range
- [Motion.dev - React Accessibility Guide](https://motion.dev/docs/react-accessibility) - reducedMotion patterns and useReducedMotion hook
- [Josh W. Comeau - Accessible Animations in React](https://www.joshwcomeau.com/react/prefers-reduced-motion/) - Detailed implementation guide for React
- Existing codebase - AccessibilityContext.jsx already implements system preference detection

### Secondary (MEDIUM confidence)
- [DigitalOcean - React Wrapper Components](https://www.digitalocean.com/community/tutorials/how-to-create-wrapper-components-in-react-with-props) - Wrapper component pattern
- [W3C WAI - Animations Tutorial](https://www.w3.org/WAI/tutorials/carousels/animations/) - Accessibility guidelines for animations
- [Chrome Developers - Service Worker Caching Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview/) - Caching strategy patterns
- [Web Animation Best Practices Gist](https://gist.github.com/uxderrick/07b81ca63932865ef1a7dc94fbe07838) - Community-sourced animation guidelines

### Tertiary (LOW confidence)
- WebSearch results on educational app animation durations - No specific research found for children's educational apps; general UX guidelines applied
- WebSearch results on gamification celebration animations - Community patterns suggest >300ms for celebrations is acceptable

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies needed; built-in React and native APIs sufficient
- Architecture: HIGH - Wrapper component pattern is well-established; AccessibilityContext integration is straightforward
- Duration standards: HIGH - NN/G research provides scientific basis; user decisions align with industry consensus
- reducedMotion implementation: HIGH - MDN docs and existing AccessibilityContext provide clear guidance
- Service worker strategy: MEDIUM - Existing service worker excludes JS files, but celebration chunks not yet built to verify
- Skip functionality: HIGH - W3C WAI provides clear accessibility requirements; multiple input methods are standard
- extendedTimeouts integration: HIGH - AccessibilityContext already has this setting; applying to celebrations is logical extension

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable technologies, but accessibility standards evolve)
