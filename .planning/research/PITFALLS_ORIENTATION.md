# Domain Pitfalls: Mobile Landscape Orientation

**Domain:** Mobile web game orientation management
**Researched:** 2026-02-13

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Assuming iOS Supports Orientation Lock

**What goes wrong:** Developer builds entire orientation system around `screen.orientation.lock()` API. Works perfectly in Android testing. Ships to production. iOS users report app doesn't work.

**Why it happens:**
- Documentation for Screen Orientation API exists → assumption it works everywhere
- Developer tests only on Android (easier to test)
- iOS PWA limitations not well-publicized

**Consequences:**
- Complete rewrite required to support iOS
- Wasted 2-3 days building fullscreen + lock flow
- User complaints from 40-50% of user base (iOS market share)

**Prevention:**
1. **Start with feature detection:**
   ```javascript
   const lockSupported = screen.orientation?.lock !== undefined;
   ```
2. **Build CSS-first approach (Phase 1)** that works everywhere
3. **Treat orientation lock as Android-only enhancement (Phase 2)**
4. **Test on iPhone early** - don't wait until QA phase

**Detection warning signs:**
- Code has `screen.orientation.lock()` but no feature detection
- No fallback path for when lock fails
- Testing plan only includes Android devices

### Pitfall 2: Fullscreen API Without User Gesture

**What goes wrong:** Developer calls `requestFullscreen()` in `useEffect` on component mount. Works in development (localhost exceptions). Fails silently in production.

**Why it happens:**
- Browser security requires user gesture (click, tap) to trigger fullscreen
- Localhost often bypasses this requirement during development
- Error is caught silently (Promise rejection with no visible indication)

**Consequences:**
- Feature appears to work during development
- Breaks in production
- Orientation lock never activates (requires fullscreen first)
- Users see no error, just "broken" behavior

**Prevention:**
```javascript
// WRONG - triggers on mount without user gesture
useEffect(() => {
  document.documentElement.requestFullscreen(); // Fails silently!
}, []);

// CORRECT - triggered from button click handler
function handleStartGame() {
  // Has user gesture context
  document.documentElement.requestFullscreen()
    .then(() => screen.orientation.lock('landscape'))
    .catch(err => {
      console.warn('Fullscreen denied:', err);
      // Fallback: continue without fullscreen
      startGameWithoutFullscreen();
    });
}
```

**Detection warning signs:**
- requestFullscreen() called in useEffect with no event trigger
- No try/catch or .catch() for Promise rejection
- Works on localhost but fails on deployed site

### Pitfall 3: Memory Leak from Uncleaned Event Listeners

**What goes wrong:** Developer adds `matchMedia` event listener but forgets cleanup function. Every time component remounts (navigation, state changes), another listener added. After 10-20 game sessions, app becomes sluggish.

**Why it happens:**
- Developer unfamiliar with useEffect cleanup pattern
- Component appears to work fine initially
- Performance degradation gradual and hard to trace

**Consequences:**
- Memory leak grows over time
- Event listeners fire multiple times per orientation change
- setState called multiple times → unnecessary re-renders
- Performance degrades (stuttering, lag)
- Hard to debug (no error messages)

**Prevention:**
```javascript
useEffect(() => {
  const mediaQuery = window.matchMedia('(orientation: portrait)');

  const handleChange = (e) => {
    setOrientation(e.matches ? 'portrait' : 'landscape');
  };

  mediaQuery.addEventListener('change', handleChange);

  // CRITICAL: Cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}, []); // Empty deps - setup once, cleanup on unmount
```

**Detection warning signs:**
- useEffect with event listener but no return statement
- Performance degradation after multiple navigation cycles
- React DevTools shows multiple renders on single orientation change

### Pitfall 4: Blocking Prompt for Users Who Can't Rotate

**What goes wrong:** Prompt covers entire screen with no dismiss option. User's device rotation is locked (accessibility settings, wheelchair mount, broken accelerometer). User can't access app.

**Why it happens:**
- Developer assumes all users can rotate their device
- "Just rotate your phone" seems like simple requirement
- Accessibility concerns not considered

**Consequences:**
- **WCAG violation** (accessibility failure)
- Users with disabilities can't use app
- Shared devices with forced orientation (classroom tablets) broken
- Bad reviews: "App won't let me play"
- Potential legal exposure (ADA, AODA compliance)

**Prevention:**
```jsx
// WRONG - no escape
function OrientationPrompt() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <p>Please rotate your device to continue</p>
    </div>
  );
}

// CORRECT - allow dismissal
function OrientationPrompt({ onDismiss }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <p>For the best experience, rotate your device</p>
      <button onClick={onDismiss}>Continue anyway</button>
    </div>
  );
}
```

**Detection warning signs:**
- Prompt has no dismiss button
- Can't interact with app when device rotation locked
- Testing plan doesn't include "rotation lock enabled" scenario

## Moderate Pitfalls

### Pitfall 5: Flash of Wrong Orientation on Mount

**What goes wrong:** Component renders with default "portrait" state, then useEffect runs and detects actual orientation "landscape". User sees brief flash of prompt then immediate disappearance.

**Why it happens:**
- Developer initializes state with string literal: `useState('portrait')`
- useEffect runs after initial render (React lifecycle)

**Prevention:**
```javascript
// WRONG - default state, then async update
const [orientation, setOrientation] = useState('portrait');

useEffect(() => {
  const mediaQuery = window.matchMedia('(orientation: portrait)');
  setOrientation(mediaQuery.matches ? 'portrait' : 'landscape');
}, []);

// CORRECT - synchronous initial state
const [orientation, setOrientation] = useState(() => {
  // Runs synchronously during first render
  if (typeof window === 'undefined') return 'portrait'; // SSR guard

  return window.matchMedia('(orientation: portrait)').matches
    ? 'portrait'
    : 'landscape';
});
```

**Detection:** User sees prompt flash briefly even when already in landscape.

### Pitfall 6: Forgetting to Unlock Orientation on Unmount

**What goes wrong:** Game component locks orientation to landscape. User exits game. Rest of app (dashboard, settings) stuck in landscape mode.

**Why it happens:**
- Developer locks orientation in useEffect but no cleanup
- Testing focused on game component, not navigation away from game

**Prevention:**
```javascript
// WRONG - no cleanup
useEffect(() => {
  screen.orientation.lock('landscape');
}, []);

// CORRECT - unlock on unmount
useEffect(() => {
  screen.orientation.lock('landscape');

  return () => {
    screen.orientation.unlock();
  };
}, []);
```

**Detection:** Navigate away from game → dashboard is sideways.

### Pitfall 7: Using Deprecated orientationchange Event

**What goes wrong:** Developer uses `window.addEventListener('orientationchange')` and `window.orientation` property. Works in some browsers but deprecated. Console filled with warnings. May break in future browser versions.

**Why it happens:**
- Old Stack Overflow answers (pre-2020) use this pattern
- Developer doesn't check deprecation status

**Prevention:**
```javascript
// WRONG - deprecated API
window.addEventListener('orientationchange', () => {
  if (window.orientation === 0 || window.orientation === 180) {
    // Portrait
  } else {
    // Landscape
  }
});

// CORRECT - modern API
const mediaQuery = window.matchMedia('(orientation: portrait)');
mediaQuery.addEventListener('change', (e) => {
  if (e.matches) {
    // Portrait
  } else {
    // Landscape
  }
});
```

**Detection:** Browser console shows deprecation warnings.

### Pitfall 8: Over-Engineering with Global State

**What goes wrong:** Developer creates OrientationContext, OrientationProvider, Redux slice for orientation state. Orientation changes dispatch actions. 200+ lines of code for simple feature.

**Why it happens:**
- Assumption that orientation is "global app state"
- Over-application of state management patterns

**Prevention:**
```javascript
// WRONG - over-engineered
const OrientationContext = createContext();

function OrientationProvider({ children }) {
  const [orientation, setOrientation] = useState('portrait');
  // ... 50 lines of logic
  return (
    <OrientationContext.Provider value={orientation}>
      {children}
    </OrientationContext.Provider>
  );
}

// CORRECT - local hook
function useOrientation() {
  const [orientation, setOrientation] = useState(() =>
    window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'
  );
  // ... 10 lines of logic
  return { orientation };
}

// Usage: Just call hook in component that needs it
```

**Detection:** Multiple files import orientation context. Only game components actually use it.

## Minor Pitfalls

### Pitfall 9: Prompt Shows on Desktop

**What goes wrong:** Orientation prompt appears on desktop browsers when window resized to portrait aspect ratio (narrow window). Confusing for mouse/keyboard users.

**Why it happens:**
- CSS `@media (orientation: portrait)` matches ANY portrait viewport (including desktop)

**Prevention:**
```javascript
function useOrientation() {
  const [orientation, setOrientation] = useState('portrait');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mobile detection
    setIsMobile(/iPhone|iPad|Android/i.test(navigator.userAgent));

    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const handleChange = (e) => {
      setOrientation(e.matches ? 'portrait' : 'landscape');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    shouldShowPrompt: isMobile && orientation === 'portrait'
  };
}
```

**Detection:** Resize desktop browser to narrow window → prompt appears.

### Pitfall 10: Landscape Layout Breaks VexFlow Rendering

**What goes wrong:** VexFlow staves configured for portrait dimensions. Switch to landscape → staves squished or clipped.

**Why it happens:**
- VexFlow renderer initialized with hardcoded width
- Developer doesn't test VexFlow rendering in both orientations

**Prevention:**
```javascript
// WRONG - hardcoded width
const renderer = new Renderer(div, Renderer.Backends.SVG);
renderer.resize(500, 200); // Fixed size

// CORRECT - responsive width
const renderer = new Renderer(div, Renderer.Backends.SVG);
const containerWidth = div.clientWidth;
renderer.resize(containerWidth, 200);

// Re-render on orientation change
useEffect(() => {
  const handleResize = () => {
    const newWidth = div.clientWidth;
    renderer.resize(newWidth, 200);
    context.draw();
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

**Detection:** VexFlow notation looks wrong in landscape (cut off, squished, misaligned).

### Pitfall 11: Tailwind Orientation Classes Not Working

**What goes wrong:** Developer uses `landscape:flex-row` but nothing happens.

**Why it happens:**
- Tailwind JIT compiler hasn't seen `landscape:` variant used yet
- Or Tailwind config has variants disabled

**Prevention:**
```javascript
// tailwind.config.js - ensure variants enabled (default in Tailwind 3+)
module.exports = {
  theme: {
    extend: {},
  },
  // No configuration needed for Tailwind 3+
  // Orientation variants work out of the box
}
```

**Detection:** Tailwind class doesn't apply in landscape; inspecting element shows class not in stylesheet.

### Pitfall 12: Dismissal Preference Not Persisted

**What goes wrong:** User dismisses prompt ("I prefer portrait"). Navigates to different game. Prompt shows again.

**Why it happens:**
- Dismissal state only in component state (lost on unmount)
- No localStorage to remember preference

**Prevention:**
```javascript
function OrientationPrompt({ onDismiss }) {
  const handleDismiss = () => {
    // Persist preference
    localStorage.setItem('orientation-prompt-dismissed', 'true');
    onDismiss();
  };

  return (
    <div>
      <p>Rotate device for best experience</p>
      <button onClick={handleDismiss}>Don't show again</button>
    </div>
  );
}

// Check before showing
function useOrientationPrompt() {
  const dismissed = localStorage.getItem('orientation-prompt-dismissed') === 'true';
  const { isPortrait } = useOrientation();

  return {
    shouldShowPrompt: isPortrait && !dismissed
  };
}
```

**Detection:** User must dismiss prompt every game session.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Phase 1: CSS Detection** | Flash of wrong orientation on mount | Use synchronous initial state in useState |
| **Phase 1: Prompt Overlay** | Blocking users who can't rotate | Always provide dismiss button |
| **Phase 1: Event Listeners** | Memory leak from uncleaned listeners | Return cleanup function in useEffect |
| **Phase 2: Fullscreen API** | User gesture requirement not met | Trigger from button click, not useEffect |
| **Phase 2: Orientation Lock** | Assuming iOS support | Feature detection + Android-only enhancement |
| **Phase 2: Cleanup** | Orientation stuck after exit | Unlock + exit fullscreen in cleanup |
| **Phase 3: Animation** | Bundle size bloat | Use CSS, not Lottie (26KB saved) |
| **Phase 3: Dismissal** | Preference not persisted | localStorage with session/permanent flag |

## Pre-Implementation Checklist

Before writing code, verify:

**Architecture:**
- [ ] Using CSS media queries for layout (not JavaScript inline styles)
- [ ] Using matchMedia API (not deprecated orientationchange)
- [ ] Local component state (not global context/Redux)
- [ ] Orientation lock is Android-only enhancement (Phase 2), not requirement

**UX:**
- [ ] Prompt has dismiss button (accessibility)
- [ ] Prompt uses simple language for 8-year-olds ("Turn sideways" not "Rotate to landscape")
- [ ] Settings modal stays portrait-friendly
- [ ] VictoryScreen works in both orientations

**Performance:**
- [ ] Synchronous initial state (no flash)
- [ ] Event listener cleanup in useEffect return
- [ ] CSS-first approach (JavaScript only for conditional rendering)

**iOS Compatibility:**
- [ ] No hard dependency on screen.orientation.lock()
- [ ] Feature detection before using Fullscreen API
- [ ] Graceful degradation for iOS users

**Testing Plan:**
- [ ] Test on iPhone (not just Android)
- [ ] Test with device rotation locked
- [ ] Test navigation away from game (cleanup verification)
- [ ] Test VexFlow rendering in both orientations

## Common Error Messages & Solutions

### Error: "requestFullscreen() can only be initiated by a user gesture"

**Cause:** Calling requestFullscreen() in useEffect or setTimeout

**Solution:** Move call to button click handler
```javascript
// In button onClick
function handleStart() {
  document.documentElement.requestFullscreen()
    .then(() => startGame());
}
```

### Error: "orientation.lock() is not a function"

**Cause:** iOS browser doesn't support API

**Solution:** Feature detection before use
```javascript
if (screen.orientation?.lock) {
  screen.orientation.lock('landscape');
}
```

### Warning: "orientationchange event is deprecated"

**Cause:** Using old API

**Solution:** Switch to matchMedia
```javascript
// Old
window.addEventListener('orientationchange', handler);

// New
window.matchMedia('(orientation: portrait)')
  .addEventListener('change', handler);
```

### Issue: Prompt shows on desktop

**Cause:** No mobile detection

**Solution:** Check user agent
```javascript
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
if (isMobile && isPortrait) {
  showPrompt();
}
```

## Red Flags During Code Review

Watch for these patterns that indicate problems:

1. **`screen.orientation.lock()` with no try/catch** → Will crash on iOS
2. **`useEffect` with listener, no cleanup return** → Memory leak
3. **Fullscreen in useEffect, not click handler** → Won't work
4. **`useState('portrait')` with literal, no function** → Flash of wrong state
5. **OrientationContext wrapping entire app** → Over-engineering
6. **Prompt with no dismiss button** → Accessibility violation
7. **`window.orientation` property used** → Deprecated API
8. **Inline styles for landscape layout** → Should use CSS media query

## Testing Scenarios That Expose Pitfalls

| Scenario | What It Tests | Pitfall Exposed |
|----------|--------------|-----------------|
| Start app in landscape on iPhone | iOS support | "Orientation lock not working" complaint |
| Device rotation locked in settings | Accessibility | Blocking prompt with no escape |
| Navigate: game → dashboard → game | Cleanup | Orientation stuck, memory leak |
| Resize desktop browser to portrait | Desktop handling | Prompt showing on non-mobile |
| Complete 10 games without refreshing | Memory | Performance degradation from listener leak |
| Start game on Android, press back | Fullscreen cleanup | Stuck in fullscreen after exit |

## Sources

- [Managing screen orientation - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation)
- [iOS PWA Compatibility － firt.dev](https://firt.dev/notes/pwa-ios/)
- [Using the Fullscreen API without gestures | ChromeOS.dev](https://chromeos.dev/en/posts/using-the-fullscreen-api-without-gestures)
- [User Gesture Restricted Web APIs](https://plainenglish.io/blog/user-gesture-restricted-web-apis)
- [useEffect Cleanup Function Examples](https://react.wiki/hooks/use-effect-cleanup/)
- [Window: orientationchange event - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/orientationchange_event) (deprecated)
- [Mobile UX - orientation](https://openinclusion.com/blog/mobile-ux-orientation/)
