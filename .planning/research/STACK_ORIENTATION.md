# Technology Stack: Mobile Landscape Orientation

**Project:** Piano learning PWA - Mobile landscape orientation for games
**Researched:** 2026-02-13

## Recommended Stack

### Core APIs

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **CSS Media Queries** | CSS3 | Orientation detection | Zero JavaScript; instant re-render; works on all platforms including iOS |
| **Window.matchMedia API** | Browser native | JavaScript orientation detection | Better browser support than screen.orientation; works on iOS + Android |
| **React Hooks** | React 18 (existing) | State management for orientation | Already in use; useEffect + useState sufficient |

### Optional Enhancement APIs (Android Only)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Screen Orientation API** | Browser native | Orientation locking | Only for Phase 2 (Android enhancement); not supported on iOS iPhone |
| **Fullscreen API** | Browser native | Immersive mode | Required before orientation lock; Android/desktop only |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | - | - | Phase 1 needs no external dependencies |
| **canvas-confetti** (optional) | ^1.9.0 | Celebration animation | Only if adding animated rotate icon in Phase 3 |
| **Lottie React** (optional) | ^2.4.0 | Animated icons | Alternative to CSS for rotate animation; Phase 3 only |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Orientation detection | CSS `@media (orientation)` + matchMedia | screen.orientation API | screen.orientation not supported on iOS; matchMedia has better compatibility |
| State management | React useState in custom hook | React Context for orientation | Over-engineering; orientation is local component concern, not global state |
| Prompt component | Custom React component | Modal library (react-modal) | Unnecessary dependency; simple overlay is 20 lines of JSX |
| Animation | CSS transitions (Phase 3) | Lottie, Framer Motion | CSS performs better on low-end devices; simpler for rotate icon |
| Fullscreen trigger | Fullscreen API (Phase 2) | manifest.json `display: fullscreen` | Manifest display mode applies to all routes; games need fullscreen, dashboard doesn't |
| Orientation lock | screen.orientation.lock() (Phase 2) | manifest.json `orientation: landscape` | iOS ignores manifest orientation field; programmatic lock more flexible |

## Installation

### Phase 1 (MVP) - No External Dependencies

```bash
# No npm packages required!
# All functionality uses browser native APIs + React built-ins
```

### Phase 2 (Optional Android Enhancements) - No External Dependencies

```bash
# Still no npm packages required
# Fullscreen API and Screen Orientation API are browser native
```

### Phase 3 (Optional Polish) - Animation Library

```bash
# If choosing CSS animation (recommended)
# No installation needed

# If choosing Lottie animation (higher quality, larger bundle)
npm install lottie-react
# Bundle impact: +26KB gzipped

# If choosing canvas-confetti for celebration effect
npm install canvas-confetti
# Bundle impact: +8KB gzipped
```

**Recommendation:** Stick with CSS animations for Phase 3 to avoid bundle bloat.

## Browser API Compatibility

### Phase 1 APIs (Universal Support)

| API | iOS Safari | iOS PWA | Android Chrome | Android PWA | Desktop | Notes |
|-----|------------|---------|----------------|-------------|---------|-------|
| CSS `@media (orientation)` | ✓ | ✓ | ✓ | ✓ | ✓ | Universal support since CSS3 |
| window.matchMedia() | ✓ | ✓ | ✓ | ✓ | ✓ | Better than orientationchange event (deprecated) |
| MediaQueryList.addEventListener() | ✓ | ✓ | ✓ | ✓ | ✓ | Modern approach vs addListener (deprecated) |

### Phase 2 APIs (Android/Desktop Only)

| API | iOS Safari | iOS PWA | Android Chrome | Android PWA | Desktop | Notes |
|-----|------------|---------|----------------|-------------|---------|-------|
| document.documentElement.requestFullscreen() | ✗ (iPhone) | ✗ (iPhone) | ✓ | ✓ | ✓ | iPad supports, iPhone does not |
| screen.orientation.lock() | ✗ (iPhone) | ✗ (iPhone) | ✓ | ✓ | ✓ | Requires fullscreen mode |
| screen.orientation.unlock() | ✗ (iPhone) | ✗ (iPhone) | ✓ | ✓ | ✓ | Cleanup when exiting fullscreen |

**Key takeaway:** Phase 1 works everywhere. Phase 2 only benefits Android/desktop users.

## Technical Architecture

### Phase 1: CSS + React Hook Pattern

```
┌─────────────────────────────────────────────────────┐
│ Browser                                             │
│  ├─ CSS Media Query: @media (orientation)           │
│  └─ JavaScript API: window.matchMedia()             │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ src/hooks/useOrientation.js                         │
│  ├─ useState: tracks current orientation            │
│  ├─ useEffect: sets up matchMedia listener          │
│  └─ Returns: { orientation, isPortrait, isLandscape }│
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ src/components/orientation/OrientationPrompt.jsx   │
│  ├─ Conditional render based on isPortrait          │
│  ├─ Fixed overlay with rotate icon + message        │
│  └─ Auto-hides when orientation changes             │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Game Components                                     │
│  ├─ SightReadingGame.jsx                            │
│  ├─ NotesRecognitionGame.jsx                        │
│  └─ MetronomeTrainer.jsx                            │
│     Each wrapped with orientation check             │
└─────────────────────────────────────────────────────┘
```

### Phase 2: Fullscreen + Lock (Android Only)

```
┌─────────────────────────────────────────────────────┐
│ src/utils/platformDetection.js                      │
│  └─ isFullscreenSupported(): boolean                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Game Component (on mount)                           │
│  ├─ Check: isFullscreenSupported()                  │
│  ├─ If true: requestFullscreen() on start           │
│  ├─ Then: screen.orientation.lock('landscape')      │
│  └─ Cleanup: unlock + exit fullscreen on unmount    │
└─────────────────────────────────────────────────────┘
```

## CSS Strategy

### Orientation-Specific Layouts

```css
/* Default (portrait) - compact layout */
.game-container {
  flex-direction: column;
}

.vexflow-staff {
  width: 100%;
  max-width: 500px;
}

.controls {
  margin-top: 1rem;
}

/* Landscape - side-by-side layout */
@media (orientation: landscape) {
  .game-container {
    flex-direction: row;
    gap: 2rem;
  }

  .vexflow-staff {
    width: 60%;
    max-width: none;
  }

  .controls {
    width: 40%;
    margin-top: 0;
  }
}

/* Orientation prompt - hide in landscape */
.orientation-prompt {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);
}

@media (orientation: landscape) {
  .orientation-prompt {
    display: none;
  }
}
```

### Tailwind Utility Classes

Extend existing Tailwind config with orientation-based utilities:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      // No changes needed - Tailwind supports orientation by default
    }
  },
  // Use with max-* and portrait/landscape modifiers
}
```

**Usage examples:**
```jsx
// Hide in landscape
<div className="block portrait:block landscape:hidden">

// Different layouts
<div className="flex-col landscape:flex-row">

// Responsive sizing
<div className="w-full landscape:w-3/5">
```

## Hook Implementation Pattern

### Recommended: matchMedia Listener

**Why this pattern:**
- Synchronous initial state (no flash of wrong orientation)
- Proper cleanup prevents memory leaks
- Works on iOS + Android
- Doesn't require feature detection

```javascript
// src/hooks/useOrientation.js
import { useEffect, useState } from 'react';

export function useOrientation() {
  const [orientation, setOrientation] = useState(() => {
    // Server-side rendering guard
    if (typeof window === 'undefined') return 'portrait';

    // Initial state from matchMedia (synchronous)
    return window.matchMedia('(orientation: portrait)').matches
      ? 'portrait'
      : 'landscape';
  });

  useEffect(() => {
    // Server-side rendering guard
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(orientation: portrait)');

    const handleChange = (e) => {
      setOrientation(e.matches ? 'portrait' : 'landscape');
    };

    // Modern browsers use addEventListener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup function
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []); // Empty dependency array - set up once

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
}
```

### Alternative: screen.orientation API (Not Recommended)

**Why not recommended:**
- Doesn't work on iOS iPhone
- Requires feature detection
- More complex error handling
- No real benefit over matchMedia

```javascript
// NOT RECOMMENDED - for reference only
export function useOrientationAPI() {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    // Feature detection required
    if (!window.screen?.orientation) {
      console.warn('screen.orientation not supported');
      return;
    }

    const handleChange = () => {
      const type = screen.orientation.type;
      setOrientation(type.startsWith('portrait') ? 'portrait' : 'landscape');
    };

    screen.orientation.addEventListener('change', handleChange);

    return () => screen.orientation.removeEventListener('change', handleChange);
  }, []);

  return { orientation };
}
```

## Performance Considerations

### CSS Media Queries vs JavaScript

| Approach | Performance | Compatibility | Maintenance |
|----------|-------------|---------------|-------------|
| **CSS `@media (orientation)` only** | Fastest (no JS) | Universal | Requires duplicate styles |
| **matchMedia + React state** | Fast (minimal JS) | Universal | Centralized logic |
| **screen.orientation API** | Fast (minimal JS) | Android/desktop only | Requires fallback |

**Recommendation:** Use **CSS for layout changes** + **matchMedia for conditional rendering**. Best of both worlds.

### Bundle Impact

| Implementation | JavaScript | CSS | Total Impact |
|----------------|------------|-----|--------------|
| **Phase 1 (CSS + hook)** | +0.5KB | +1KB | +1.5KB (negligible) |
| **Phase 2 (fullscreen + lock)** | +2KB | 0 | +2KB (feature detection + error handling) |
| **Phase 3 (CSS animation)** | 0 | +0.5KB | +0.5KB |
| **Phase 3 (Lottie animation)** | +26KB | 0 | +26KB (not recommended) |

**Total for MVP (Phase 1):** ~1.5KB - negligible impact.

## Device Testing Matrix

### Required Testing (Phase 1)

| Device | Browser | Test Cases |
|--------|---------|------------|
| iPhone 12+ | Safari | Orientation detection, prompt display, landscape layout |
| iPhone 12+ (PWA) | Home screen | Same as Safari (should behave identically) |
| Android (mid-range) | Chrome | Orientation detection, prompt display, landscape layout |
| Android (PWA) | Home screen | Same as Chrome |
| iPad | Safari | Verify desktop-like behavior (no prompt needed) |

### Optional Testing (Phase 2)

| Device | Browser | Test Cases |
|--------|---------|------------|
| Android | Chrome | Fullscreen API, orientation lock, cleanup |
| Android | Samsung Internet | Same as Chrome (Samsung browser variations) |
| Android | Firefox | Same as Chrome (Firefox implementation differences) |
| Android (PWA) | Home screen | Installed PWA behavior |

**Note:** iOS testing for Phase 2 not needed (APIs not supported).

## Security & Privacy Considerations

### No Security Concerns

Orientation detection via CSS and matchMedia has no security implications:
- No user permission required
- No sensitive data access
- No cross-origin issues
- No storage of preferences (unless Phase 3 implemented)

### Fullscreen API (Phase 2) - User Consent Required

Fullscreen API requires user gesture (click, tap) to activate:
- Prevents malicious sites from hijacking screen
- Must be triggered from button click handler
- Browser may show permission prompt
- User can exit fullscreen at any time (ESC key, system gesture)

**Implementation note:** Fullscreen must be triggered after user clicks "Start Game" button. Cannot auto-trigger on page load.

## Sources

### Browser API Documentation
- [Managing screen orientation - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation)
- [window.matchMedia() - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia)
- [MediaQueryList - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList)
- [Fullscreen API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
- [Screen Orientation API - W3C](https://w3c.github.io/screen-orientation/)

### React Hook Patterns
- [Using React Hooks for Device Orientation | UXPin](https://www.uxpin.com/studio/blog/using-react-hooks-for-device-orientation/)
- [useOrientation React Hook – useHooks](https://usehooks.com/useorientation)
- [ReactJS useOrientation Custom Hook | GeeksforGeeks](https://www.geeksforgeeks.org/reactjs-useorientation-custom-hook/)

### CSS Orientation Queries
- [orientation - CSS | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/orientation)
- [CSS Orientation Media Queries: Complete Guide](https://codelucky.com/css-orientation-media-queries/)

### PWA Compatibility
- [iOS PWA Compatibility － firt.dev](https://firt.dev/notes/pwa-ios/)
- [PWA on iOS - Current Status & Limitations](https://brainhub.eu/library/pwa-on-ios)
