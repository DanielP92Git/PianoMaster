# Phase 04: Platform-Specific Android Enhancement - Research

**Researched:** 2026-02-15
**Domain:** Platform detection, Screen Orientation API, Fullscreen API
**Confidence:** HIGH

## Summary

Phase 04 implements automatic landscape orientation locking on Android PWAs using the Screen Orientation API combined with the Fullscreen API. Research reveals that iOS blocks the Screen Orientation API entirely, requiring CSS-only fallback (already implemented in Phase 02-03). Android PWAs support orientation locking, but only when in fullscreen mode and when triggered by user interaction.

The standard approach uses platform detection via `navigator.userAgent` to branch between Android (API-based lock) and iOS (rotate prompt only), the Fullscreen API to enable orientation locking capabilities on Android, and React Router navigation guards to clean up fullscreen/orientation state when users exit games. The existing codebase already has platform detection utilities (`src/utils/pwaDetection.js`), orientation hooks (`useOrientation.js`), and rotate prompt infrastructure from Phase 02.

**Primary recommendation:** Create a custom `useLandscapeLock` hook for Android that combines fullscreen + orientation lock on mount, unlocks + exits fullscreen on unmount, and uses existing `isAndroidDevice()` from `pwaDetection.js` for platform branching. iOS users continue seeing the rotate prompt (Phase 02 implementation) with no API-based locking.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Screen Orientation API | Browser native | Lock orientation on Android | W3C specification, supported in Chrome/Firefox/Edge (not Safari) |
| Fullscreen API | Browser native | Enable orientation locking on Android | Required prerequisite for orientation lock, broad browser support |
| navigator.userAgent | Browser native | Platform detection (Android vs iOS) | Existing in codebase via `pwaDetection.js`, proven pattern |
| React Router | 7.1.5 (existing) | Navigation cleanup triggers | Already in use for routing, provides `useNavigate` and `useLocation` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| matchMedia API | Browser native | Orientation detection (CSS-based) | Already used in `useOrientation.js` for iOS fallback |
| useEffect cleanup | React 18.3.1 (existing) | Unlock on component unmount | Standard React pattern for cleanup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| navigator.userAgent | Feature detection (`screen.orientation?.lock`) | Feature detection is more robust, but Phase 02 already uses userAgent pattern consistently |
| Custom fullscreen hook | Inline requestFullscreen | Custom hook would abstract complexity, but Phase 04 scope is minimal (3 games), inline is simpler |
| manifest.json orientation | API-based lock | Manifest locks entire app, not game-specific; API gives per-route control |

**Installation:**
```bash
# No new packages needed - all browser native APIs
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   ├── useOrientation.js         # Existing - CSS-based detection
│   ├── useRotatePrompt.js        # Existing - iOS rotate prompt logic
│   ├── useIsMobile.js            # Existing - Mobile detection
│   └── useLandscapeLock.js       # NEW - Android fullscreen + orientation lock
├── utils/
│   └── pwaDetection.js           # Existing - isAndroidDevice(), isIOSDevice()
└── components/games/
    ├── notes-master-games/NotesRecognitionGame.jsx  # Add useLandscapeLock
    ├── notes-master-games/MemoryGame.jsx            # Add useLandscapeLock
    └── rhythm-games/MetronomeTrainer.jsx            # Add useLandscapeLock
```

### Pattern 1: Platform-Specific Orientation Lock Hook
**What:** Custom React hook that locks to landscape on Android PWAs using fullscreen + orientation APIs
**When to use:** In all three game components that need landscape mode (NotesRecognitionGame, MemoryGame, MetronomeTrainer)
**Example:**
```javascript
// src/hooks/useLandscapeLock.js
import { useEffect } from "react";
import { isAndroidDevice, isInStandaloneMode } from "../utils/pwaDetection";

export function useLandscapeLock() {
  useEffect(() => {
    // Only lock on Android PWAs (iOS continues using rotate prompt)
    const shouldLock = isAndroidDevice() && isInStandaloneMode();
    if (!shouldLock) return;

    // Check API support (safety check)
    if (!document.documentElement.requestFullscreen || !screen.orientation?.lock) {
      console.warn("Fullscreen or Orientation API not supported");
      return;
    }

    let isFullscreen = false;

    async function lockOrientation() {
      try {
        // Step 1: Enter fullscreen (required for orientation lock on Android)
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
        isFullscreen = true;

        // Step 2: Lock to landscape orientation
        await screen.orientation.lock("landscape");
        console.log("Locked to landscape");
      } catch (err) {
        console.error("Orientation lock failed:", err.message);
      }
    }

    // Must be triggered by user interaction (game start button satisfies this)
    lockOrientation();

    // Cleanup: unlock orientation and exit fullscreen when leaving game
    return () => {
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
      if (isFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.error("Exit fullscreen failed:", err.message);
        });
      }
    };
  }, []);
}
```

### Pattern 2: Navigation-Based Cleanup
**What:** Use React Router navigation to trigger cleanup when user clicks "Back to Trail" or BackButton
**When to use:** In VictoryScreen and game components with BackButton navigation
**Example:**
```javascript
// VictoryScreen.jsx - "Back to Trail" button
function handleBackToTrail() {
  // Cleanup happens automatically via useEffect cleanup in game component
  navigate("/trail");
}

// Game component cleanup order:
// 1. User clicks "Back to Trail"
// 2. navigate("/trail") triggers React Router navigation
// 3. Game component unmounts
// 4. useLandscapeLock cleanup runs → unlocks orientation → exits fullscreen
```

### Pattern 3: Fullscreen Event Listener for Escape Key Handling
**What:** Listen for `fullscreenchange` event to detect when user presses Escape key to exit fullscreen
**When to use:** Optional - if we want to unlock orientation when user manually exits fullscreen mid-game
**Example:**
```javascript
// Optional enhancement for Phase 04 (not required for MVP)
useEffect(() => {
  function handleFullscreenChange() {
    if (!document.fullscreenElement && screen.orientation?.unlock) {
      // User pressed Escape to exit fullscreen - unlock orientation
      screen.orientation.unlock();
    }
  }

  document.addEventListener("fullscreenchange", handleFullscreenChange);
  return () => {
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
  };
}, []);
```

### Anti-Patterns to Avoid
- **Locking without fullscreen on Android:** Screen Orientation API requires fullscreen mode on Android; calling `lock()` before `requestFullscreen()` will throw `SecurityError`
- **Calling lock() on iOS:** iOS Safari doesn't support Screen Orientation API; always check `screen.orientation?.lock` before calling
- **Forgetting cleanup:** Always unlock orientation and exit fullscreen in `useEffect` cleanup to prevent state leaking to other pages
- **Blocking user Escape key:** Don't prevent default on Escape key - users must be able to exit fullscreen per WCAG 1.3.4 escape hatch requirement
- **Locking on desktop:** Check `isInStandaloneMode()` to avoid locking on desktop browsers where fullscreen is disruptive

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Platform detection | Custom userAgent parsing | Existing `isAndroidDevice()` in `pwaDetection.js` | Already handles iPad desktop mode, Android detection, proven in production |
| Orientation detection | Custom window resize listener | Existing `useOrientation()` hook with matchMedia | Already handles Safari fallback, synchronous init, no flash on mount |
| Fullscreen state tracking | Custom state variable | `document.fullscreenElement` property | Browser-managed property, automatically updated on Escape key |
| Cleanup on navigation | Manual navigation listener | React Router + useEffect cleanup | React Router unmount triggers cleanup automatically, no manual tracking needed |

**Key insight:** Phase 02-03 already implemented CSS-based orientation detection and iOS rotate prompt. Phase 04 only adds Android-specific API enhancement, reusing existing infrastructure. Don't rebuild platform detection or orientation hooks - extend existing patterns.

## Common Pitfalls

### Pitfall 1: Orientation Lock Before Fullscreen
**What goes wrong:** Calling `screen.orientation.lock()` before entering fullscreen throws `SecurityError` on Android
**Why it happens:** Screen Orientation API requires fullscreen mode as security prerequisite on mobile browsers
**How to avoid:** Always `await requestFullscreen()` before calling `lock()`, check `isFullscreen` state before locking
**Warning signs:** Console error "SecurityError: The document is not fully active" or "Failed to execute 'lock' on 'ScreenOrientation'"

### Pitfall 2: iOS Orientation Lock Attempt
**What goes wrong:** Calling `screen.orientation.lock()` on iOS fails silently or throws error
**Why it happens:** Safari doesn't support Screen Orientation API at all (as of 2026)
**How to avoid:** Platform detection via `isAndroidDevice()` before attempting lock; iOS uses rotate prompt only (Phase 02)
**Warning signs:** No effect on iOS devices, console errors in Safari

### Pitfall 3: Missing Cleanup on Navigation
**What goes wrong:** User navigates to dashboard, but device stays in landscape + fullscreen mode
**Why it happens:** Forgot to unlock orientation and exit fullscreen in `useEffect` cleanup
**How to avoid:** Always return cleanup function from `useEffect`, call `unlock()` and `exitFullscreen()` on unmount
**Warning signs:** User reports "stuck in landscape" after leaving game, fullscreen persists on trail page

### Pitfall 4: Calling Lock Without User Interaction
**What goes wrong:** `requestFullscreen()` throws error "Failed to execute 'requestFullscreen': API can only be initiated by a user gesture"
**Why it happens:** Fullscreen API requires transient user activation (click, keydown, touch)
**How to avoid:** Hook runs on component mount, but user already clicked "Start Game" button (satisfies activation), ensure hook runs after user interaction
**Warning signs:** Fullscreen doesn't activate on game load, console error about user gesture

### Pitfall 5: Race Condition Between Fullscreen and Lock
**What goes wrong:** Calling `lock()` immediately after `requestFullscreen()` fails because fullscreen transition hasn't completed
**Why it happens:** `requestFullscreen()` is async, but developer didn't `await` it before calling `lock()`
**How to avoid:** Always `await requestFullscreen()` before calling `lock()`, use try-catch for error handling
**Warning signs:** Intermittent orientation lock failures, works on slower devices but fails on fast devices

### Pitfall 6: Desktop Fullscreen Lock
**What goes wrong:** Desktop users get fullscreen + orientation lock, which is disruptive on monitors
**Why it happens:** Didn't check `isInStandaloneMode()` or mobile detection before locking
**How to avoid:** Combine `isAndroidDevice() && isInStandaloneMode()` check before attempting lock
**Warning signs:** User reports unexpected fullscreen on desktop Chrome, desktop testing shows fullscreen

## Code Examples

Verified patterns from official sources:

### Fullscreen + Orientation Lock Sequence (Android PWA)
```javascript
// Source: MDN Web Docs (requestFullscreen + ScreenOrientation.lock)
// https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
// https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock

async function enterGameMode() {
  try {
    // Step 1: Request fullscreen (required for orientation lock on Android)
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    console.log("Entered fullscreen");

    // Step 2: Lock to landscape orientation
    await screen.orientation.lock("landscape");
    console.log("Locked to landscape");
  } catch (err) {
    // Handle errors gracefully (user denial, API unavailable, etc.)
    console.error("Failed to enter game mode:", err.name, err.message);
  }
}

function exitGameMode() {
  // Unlock orientation first
  if (screen.orientation?.unlock) {
    screen.orientation.unlock();
    console.log("Unlocked orientation");
  }

  // Exit fullscreen second
  if (document.fullscreenElement) {
    document.exitFullscreen().catch((err) => {
      console.error("Exit fullscreen failed:", err.message);
    });
  }
}
```

### Platform Detection for Conditional Lock
```javascript
// Source: Existing codebase - src/utils/pwaDetection.js
import { isAndroidDevice, isInStandaloneMode } from "../utils/pwaDetection";

function shouldEnableLandscapeLock() {
  // Android PWA only (iOS uses rotate prompt)
  const isAndroidPWA = isAndroidDevice() && isInStandaloneMode();

  // Check API support
  const hasFullscreenAPI = typeof document.documentElement.requestFullscreen === "function";
  const hasOrientationAPI = screen.orientation?.lock !== undefined;

  return isAndroidPWA && hasFullscreenAPI && hasOrientationAPI;
}

// Usage in game component
if (shouldEnableLandscapeLock()) {
  await enterGameMode();
}
```

### React Hook Integration with Cleanup
```javascript
// src/hooks/useLandscapeLock.js
import { useEffect } from "react";
import { isAndroidDevice, isInStandaloneMode } from "../utils/pwaDetection";

export function useLandscapeLock() {
  useEffect(() => {
    // Platform check
    const shouldLock = isAndroidDevice() && isInStandaloneMode();
    if (!shouldLock) return;

    // API support check
    const hasAPIs =
      document.documentElement.requestFullscreen &&
      screen.orientation?.lock;
    if (!hasAPIs) {
      console.warn("Fullscreen or Orientation API not supported");
      return;
    }

    let didEnterFullscreen = false;

    async function lockToLandscape() {
      try {
        // Enter fullscreen
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
        didEnterFullscreen = true;

        // Lock orientation
        await screen.orientation.lock("landscape");
      } catch (err) {
        console.error("Lock failed:", err.message);
      }
    }

    lockToLandscape();

    // Cleanup on unmount (navigation away from game)
    return () => {
      // Unlock orientation
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }

      // Exit fullscreen
      if (didEnterFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.error("Exit fullscreen cleanup failed:", err.message);
        });
      }
    };
  }, []); // Empty deps - run once on mount, cleanup on unmount
}
```

### Game Component Integration
```javascript
// NotesRecognitionGame.jsx
import { useLandscapeLock } from "../../../hooks/useLandscapeLock";
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";

export function NotesRecognitionGame() {
  // Android: Fullscreen + orientation lock
  useLandscapeLock();

  // iOS: Rotate prompt overlay (Phase 02 implementation)
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();

  return (
    <div className="game-container">
      {/* Rotate prompt for iOS (Phase 02) */}
      {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}

      {/* Game content */}
      <BackButton onClick={() => navigate("/trail")} />
      {/* ... rest of game ... */}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| manifest.json `orientation: "landscape"` | JavaScript Screen Orientation API | 2023+ | Manifest locks entire app; API gives per-page control for game-specific locking |
| CSS `@media (orientation: portrait)` only | CSS + API hybrid | Phase 02-04 (2026) | CSS for iOS (no API), API for Android (better UX), graceful degradation |
| `screen.lockOrientation()` (deprecated) | `screen.orientation.lock()` | 2016+ W3C spec | Modern API returns Promise, supports more orientations, better error handling |
| Inline fullscreen + lock code | Custom React hook | Phase 04 design | Encapsulates complexity, reusable across 3 games, automatic cleanup |

**Deprecated/outdated:**
- **`screen.lockOrientation()`**: Deprecated in favor of `screen.orientation.lock()` (W3C Screen Orientation API)
- **`window.screen.orientation` (read-only)**: Use `screen.orientation.type` instead for current orientation
- **manifest.json `orientation` for games**: Still valid for entire-app locking, but API gives per-route control

## Open Questions

Things that couldn't be fully resolved:

1. **User Pressing Escape During Game**
   - What we know: Escape key exits fullscreen and fires `fullscreenchange` event, but doesn't auto-unlock orientation
   - What's unclear: Should we automatically unlock orientation when user presses Escape mid-game? Or leave in landscape until navigation?
   - Recommendation: Add `fullscreenchange` listener to unlock orientation when fullscreen exits (handles Escape key gracefully)

2. **Orientation Lock on VictoryScreen**
   - What we know: VictoryScreen is part of game component, so landscape lock persists
   - What's unclear: Should VictoryScreen stay locked, or unlock to allow portrait reading?
   - Recommendation: Keep locked (VictoryScreen has "Next Exercise" and "Back to Trail" buttons, landscape is fine for tapping)

3. **Settings Modal Orientation**
   - What we know: Phase 03 made settings modal landscape-optimized
   - What's unclear: Should orientation lock start at settings modal open, or at "Start Game" button click?
   - Recommendation: Lock at component mount (after user clicks game route), settings modal already landscape-ready (Phase 03)

4. **Fullscreen Navigation UI on Android**
   - What we know: `navigationUI: "hide"` hides browser navigation, `"show"` keeps it visible
   - What's unclear: Should Android PWA hide all navigation, or keep minimal back button visible?
   - Recommendation: Use `"hide"` for immersive game experience (users can still Escape or use BackButton component)

## Sources

### Primary (HIGH confidence)
- [MDN: ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock) - Syntax, parameters, browser compatibility
- [MDN: ScreenOrientation.unlock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/unlock) - Cleanup best practices
- [MDN: Element.requestFullscreen()](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) - Fullscreen API usage
- [MDN: Document.exitFullscreen()](https://developer.mozilla.org/en-US/docs/Web/API/Document/exitFullscreen) - Exit and cleanup patterns
- [W3C Screen Orientation Specification](https://w3c.github.io/screen-orientation/) - Official W3C spec for lock/unlock behavior
- Existing codebase: `src/utils/pwaDetection.js`, `src/hooks/useOrientation.js` - Platform detection patterns

### Secondary (MEDIUM confidence)
- [Using the Fullscreen API with React (Aha.io)](https://www.aha.io/engineering/articles/using-the-fullscreen-api-with-react) - React integration patterns
- [Managing screen orientation (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation) - Orientation management guide
- [Can I Use: Screen Orientation API](https://caniuse.com/screen-orientation) - Browser support matrix
- [LogRocket: React useEffect cleanup](https://blog.logrocket.com/understanding-react-useeffect-cleanup-function/) - Cleanup patterns

### Tertiary (LOW confidence)
- [GitHub photoprism/photoprism #3413](https://github.com/photoprism/photoprism/issues/3413) - PWA orientation issues on Android Chrome
- [Medium: Locking orientation for Ionic PWAs](https://hearthero.medium.com/locking-orientation-for-ionic-pwas-7c75c5bb3639) - Community experiences
- [OutSystems Forum: orientation lock in PWA](https://www.outsystems.com/forums/discussion/64798/orientation-lock-in-pwa/) - Community discussion on PWA orientation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All browser native APIs with MDN documentation and existing codebase utilities
- Architecture: HIGH - React hook pattern proven in Phase 02-03, cleanup via useEffect is standard React
- Pitfalls: HIGH - Based on MDN security requirements (fullscreen prerequisite, user activation), common developer errors documented

**Research date:** 2026-02-15
**Valid until:** 90 days (browser APIs stable, W3C spec established, unlikely to change)
