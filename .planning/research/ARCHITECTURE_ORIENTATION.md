# Architecture Patterns: Mobile Landscape Orientation

**Domain:** Mobile web game orientation management
**Researched:** 2026-02-13

## Recommended Architecture

### Component Structure

```
src/
├── hooks/
│   └── useOrientation.js              # Custom hook for orientation detection
├── components/
│   └── orientation/
│       ├── OrientationPrompt.jsx       # Full-screen overlay with rotate message
│       └── OrientationGate.jsx         # Wrapper component for conditional rendering
└── utils/ (Phase 2 only)
    └── platformDetection.js            # Feature detection for fullscreen/lock APIs
```

### Data Flow (Phase 1: MVP)

```
┌──────────────────────────────────────────────────────────┐
│ Browser Window                                           │
│  ↓ Orientation change (physical device rotation)        │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ window.matchMedia('(orientation: portrait)')            │
│  ↓ Fires 'change' event                                 │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ useOrientation() hook                                    │
│  ├─ Listens to mediaQuery.addEventListener('change')    │
│  ├─ Updates state: setOrientation('portrait'|'landscape')│
│  └─ Returns: { orientation, isPortrait, isLandscape }   │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Game Component (e.g., SightReadingGame.jsx)             │
│  ├─ Calls: const { isPortrait } = useOrientation()      │
│  └─ Conditional render:                                 │
│      if (isPortrait) → <OrientationPrompt />            │
│      else → <GameContent />                             │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ OrientationPrompt.jsx                                    │
│  ├─ Full-screen fixed overlay (z-index: 9999)           │
│  ├─ Rotate icon + message                               │
│  ├─ CSS: @media (orientation: landscape) { display: none }│
│  └─ Auto-hides when user rotates to landscape           │
└──────────────────────────────────────────────────────────┘
```

### Data Flow (Phase 2: Android Fullscreen + Lock)

```
┌──────────────────────────────────────────────────────────┐
│ User clicks "Start Game" button                         │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Game Component (useEffect on mount)                     │
│  ├─ Check: isFullscreenSupported()                      │
│  ├─ If true (Android): requestFullscreen()              │
│  └─ Then: screen.orientation.lock('landscape')          │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ User plays game in fullscreen + locked orientation      │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Game exits (unmount or user clicks "Back")              │
│  ├─ useEffect cleanup function runs                     │
│  ├─ screen.orientation.unlock()                         │
│  └─ document.exitFullscreen()                           │
└──────────────────────────────────────────────────────────┘
```

## Component Boundaries

### Phase 1 Components

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **useOrientation** | Detect orientation via matchMedia; maintain orientation state | Browser API only (no other components) |
| **OrientationPrompt** | Display rotate message overlay; auto-hide in landscape | Receives props from parent (optional: message, dismissible) |
| **OrientationGate** (optional wrapper) | Conditionally render children based on orientation | useOrientation hook + child game components |
| **Game components** (SightReadingGame, NotesRecognitionGame, MetronomeTrainer) | Check orientation; show prompt if portrait; render game if landscape | useOrientation hook, OrientationPrompt |

### Phase 2 Components (Android Only)

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **platformDetection utility** | Feature detection for fullscreen/lock APIs | Browser APIs only |
| **Game components (enhanced)** | Request fullscreen on mount; lock orientation; cleanup on unmount | Browser Fullscreen API, Screen Orientation API |

### Component Communication Pattern

**No global state needed.** Orientation is local component concern.

```jsx
// Pattern 1: Direct hook usage in game component
function SightReadingGame() {
  const { isPortrait } = useOrientation();

  if (isPortrait) {
    return <OrientationPrompt message="Turn your device sideways for the best experience" />;
  }

  return <GameContent />;
}

// Pattern 2: Wrapper component (more reusable)
function OrientationGate({ children, promptMessage }) {
  const { isPortrait } = useOrientation();

  if (isPortrait) {
    return <OrientationPrompt message={promptMessage} />;
  }

  return children;
}

// Usage
function SightReadingGame() {
  return (
    <OrientationGate promptMessage="Turn your device sideways">
      <GameContent />
    </OrientationGate>
  );
}
```

**Recommendation:** Use Pattern 2 (OrientationGate wrapper) for consistency across game components.

## Patterns to Follow

### Pattern 1: Synchronous Initial State

**What:** Read orientation immediately on hook mount (before async useEffect runs)

**When:** Always - prevents flash of wrong state

**Example:**
```javascript
export function useOrientation() {
  const [orientation, setOrientation] = useState(() => {
    // Synchronous initial state
    if (typeof window === 'undefined') return 'portrait'; // SSR guard

    return window.matchMedia('(orientation: portrait)').matches
      ? 'portrait'
      : 'landscape';
  });

  // ... rest of hook
}
```

**Why:** Without synchronous initial state, component renders with default 'portrait', then re-renders when useEffect runs. Causes brief flash of prompt even in landscape.

### Pattern 2: Proper Event Listener Cleanup

**What:** Remove event listener in useEffect cleanup function

**When:** Always - prevents memory leaks

**Example:**
```javascript
useEffect(() => {
  const mediaQuery = window.matchMedia('(orientation: portrait)');

  const handleChange = (e) => {
    setOrientation(e.matches ? 'portrait' : 'landscape');
  };

  mediaQuery.addEventListener('change', handleChange);

  // CRITICAL: Cleanup function
  return () => mediaQuery.removeEventListener('change', handleChange);
}, []); // Empty deps - never re-run
```

**Why:** Without cleanup, listener persists after component unmounts. Multiple mounts = multiple listeners = memory leak.

### Pattern 3: CSS-First Layout Responsiveness

**What:** Use CSS media queries for layout changes, JavaScript only for conditional rendering

**When:** Whenever possible - performance benefit

**Example:**
```css
/* CSS handles layout responsiveness */
@media (orientation: landscape) {
  .game-container {
    flex-direction: row;
  }
}
```

```jsx
// JavaScript handles component visibility
function Game() {
  const { isPortrait } = useOrientation();

  // Only use JS for what CSS can't do (conditional component rendering)
  if (isPortrait) return <Prompt />;

  // CSS handles the rest
  return <div className="game-container">...</div>;
}
```

**Why:** CSS media queries trigger instant re-layout without JavaScript execution. Faster, smoother, less CPU.

### Pattern 4: Fullscreen as Progressive Enhancement (Phase 2)

**What:** Feature-detect fullscreen support; gracefully degrade if unavailable

**When:** Phase 2 implementation on Android

**Example:**
```javascript
function useFullscreenOrientation() {
  useEffect(() => {
    // Feature detection
    const fullscreenSupported =
      document.documentElement.requestFullscreen !== undefined;
    const orientationLockSupported =
      screen.orientation?.lock !== undefined;

    if (!fullscreenSupported || !orientationLockSupported) {
      // Graceful degradation - game still works without fullscreen
      console.log('Fullscreen/lock not supported, using CSS-only orientation');
      return;
    }

    // Only proceed if supported
    async function enterFullscreenLandscape() {
      try {
        await document.documentElement.requestFullscreen();
        await screen.orientation.lock('landscape');
      } catch (err) {
        // User denied or browser prevented
        console.warn('Fullscreen/lock failed:', err.message);
      }
    }

    enterFullscreenLandscape();

    // Cleanup
    return () => {
      if (document.fullscreenElement) {
        screen.orientation.unlock();
        document.exitFullscreen();
      }
    };
  }, []);
}
```

**Why:** iOS doesn't support these APIs. Making them required breaks iOS. Treat as enhancement for Android users only.

### Pattern 5: User Gesture Requirement

**What:** Only trigger fullscreen from click handler, not useEffect on mount

**When:** Phase 2 fullscreen implementation

**Example:**
```javascript
// WRONG - triggers on mount without user gesture
useEffect(() => {
  document.documentElement.requestFullscreen(); // Will fail!
}, []);

// CORRECT - triggered from button click
function handleStartGame() {
  // This has user gesture context
  document.documentElement.requestFullscreen()
    .then(() => screen.orientation.lock('landscape'))
    .catch(err => console.warn('Fullscreen denied:', err));

  // Then proceed with game start
  startGame();
}
```

**Why:** Browsers block fullscreen API unless called from user gesture (security feature). Attempting from useEffect fails silently.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using Deprecated orientationchange Event

**What goes wrong:** `window.orientationchange` event is deprecated

**Why it happens:** Old tutorials use this pattern

**Instead:**
```javascript
// WRONG - deprecated API
window.addEventListener('orientationchange', () => {
  console.log(window.orientation); // Also deprecated
});

// CORRECT - modern API
const mediaQuery = window.matchMedia('(orientation: portrait)');
mediaQuery.addEventListener('change', handleChange);
```

**Detection:** Check for deprecation warnings in console

### Anti-Pattern 2: Global State for Orientation

**What goes wrong:** Storing orientation in Redux or global Context

**Why it happens:** Developer thinks orientation is "global app state"

**Instead:**
```javascript
// WRONG - over-engineering
const OrientationContext = createContext();

// CORRECT - local hook
function GameComponent() {
  const { isPortrait } = useOrientation(); // Local to component
}
```

**Why bad:** Orientation is local component concern. Only game components care. No need for global state machinery.

**Detection:** If multiple files import orientation context, you've over-engineered.

### Anti-Pattern 3: Blocking Prompt Without Dismissal

**What goes wrong:** Overlay blocks all interaction with no escape

**Why it happens:** Developer wants to force landscape

**Instead:**
```javascript
// WRONG - no way to dismiss
function OrientationPrompt() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <p>Please rotate your device</p>
      {/* No dismiss button! User stuck if they can't rotate */}
    </div>
  );
}

// CORRECT - allow dismissal
function OrientationPrompt({ onDismiss }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <p>For the best experience, rotate your device</p>
      <button onClick={onDismiss}>Continue in portrait</button>
    </div>
  );
}
```

**Why bad:** Accessibility violation. Some users can't rotate device (wheelchair mount, accessibility settings, broken accelerometer).

**Detection:** Test with device rotation lock enabled - can you still use the app?

### Anti-Pattern 4: Locking Orientation on All Routes

**What goes wrong:** Dashboard, settings, profile forced to landscape

**Why it happens:** Developer calls orientation.lock() in App.jsx root component

**Instead:**
```javascript
// WRONG - affects entire app
function App() {
  useEffect(() => {
    screen.orientation.lock('landscape'); // Dashboard now sideways!
  }, []);
}

// CORRECT - only game routes
function SightReadingGame() {
  useEffect(() => {
    // Only lock for this game component
    screen.orientation.lock('landscape');

    return () => screen.orientation.unlock();
  }, []);
}
```

**Why bad:** Users browse app in portrait (natural phone holding). Only games need landscape.

**Detection:** Navigate to non-game routes - are they sideways? Bug.

### Anti-Pattern 5: Ignoring CSS for Layout Changes

**What goes wrong:** Detect orientation in JavaScript, manually adjust styles

**Why it happens:** Developer doesn't know CSS can detect orientation

**Instead:**
```javascript
// WRONG - manual style adjustments in JS
function GameComponent() {
  const { isLandscape } = useOrientation();

  return (
    <div style={{
      flexDirection: isLandscape ? 'row' : 'column'
    }}>
      ...
    </div>
  );
}

// CORRECT - CSS handles layout
function GameComponent() {
  return (
    <div className="flex flex-col landscape:flex-row">
      ...
    </div>
  );
}
```

**Why bad:** CSS is faster (no JavaScript execution). Inline styles harder to maintain. CSS can transition smoothly.

**Detection:** If you see orientation hook used only for styling, refactor to CSS.

## Integration with Existing Game Lifecycle

### Current Game Flow

```
User navigates to game → UnifiedGameSettings modal →
User clicks "Start Game" → Game component mounts →
Game renders exercises → User completes → VictoryScreen
```

### Enhanced Game Flow (Phase 1)

```
User navigates to game → UnifiedGameSettings modal (works in any orientation) →
User clicks "Start Game" → Game component mounts →
  ↓
  Check orientation:
  - If portrait → Show OrientationPrompt (user rotates or dismisses)
  - If landscape → Proceed immediately
  ↓
Game renders exercises (landscape-optimized CSS) →
User completes → VictoryScreen (works in any orientation)
```

### Integration Points

| Existing Component | Change Required | Reason |
|--------------------|----------------|--------|
| **UnifiedGameSettings** | None | Settings modal works fine in portrait |
| **SightReadingGame** | Add OrientationGate wrapper | Check orientation before rendering |
| **NotesRecognitionGame** | Add OrientationGate wrapper | Check orientation before rendering |
| **MetronomeTrainer** | Add OrientationGate wrapper | Check orientation before rendering |
| **VictoryScreen** | None | Stats screen works in any orientation |
| **AppLayout** | None | No global orientation logic needed |

**Key insight:** Minimal integration surface. Only game components affected. No changes to routing, state management, or modal systems.

## Scalability Considerations

### At 100 users (MVP)

| Concern | Approach |
|---------|----------|
| Performance | CSS-only approach; no performance impact |
| Browser support | matchMedia works on all modern browsers |
| Device testing | Test on 2-3 devices (iPhone, Android mid-range) |

### At 10K users

| Concern | Approach |
|---------|----------|
| Performance | Still CSS-only; scales infinitely |
| Browser support | May need polyfill for older Android (2% of users) |
| Device testing | Analytics on orientation prompt dismissal rate |

### At 1M users

| Concern | Approach |
|---------|----------|
| Performance | CSS-only approach scales to any size |
| Browser support | Drop support for ancient browsers (stats-driven) |
| Feature evolution | Consider Phase 2 (fullscreen) if Android user feedback demands it |

**Takeaway:** Orientation detection has no scalability concerns. No server load, no API calls, no database queries.

## Testing Strategy

### Unit Tests (useOrientation hook)

```javascript
// src/hooks/useOrientation.test.js
import { renderHook } from '@testing-library/react';
import { useOrientation } from './useOrientation';

describe('useOrientation', () => {
  it('returns portrait when matchMedia matches portrait', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(orientation: portrait)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useOrientation());

    expect(result.current.orientation).toBe('portrait');
    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isLandscape).toBe(false);
  });

  it('updates orientation when mediaQuery fires change event', () => {
    let changeHandler;
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: jest.fn((event, handler) => {
        changeHandler = handler;
      }),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useOrientation());

    // Simulate orientation change
    changeHandler({ matches: false });

    expect(result.current.orientation).toBe('landscape');
  });
});
```

### Integration Tests (OrientationPrompt)

```javascript
// src/components/orientation/OrientationPrompt.test.jsx
import { render, screen } from '@testing-library/react';
import OrientationPrompt from './OrientationPrompt';

describe('OrientationPrompt', () => {
  it('displays rotate message', () => {
    render(<OrientationPrompt message="Please rotate" />);
    expect(screen.getByText(/please rotate/i)).toBeInTheDocument();
  });

  it('has high z-index for overlay', () => {
    const { container } = render(<OrientationPrompt />);
    const overlay = container.firstChild;
    expect(overlay).toHaveStyle({ zIndex: 9999 });
  });
});
```

### Manual Testing Checklist

- [ ] iPhone: Rotate device from portrait → landscape → prompt disappears
- [ ] Android: Rotate device from portrait → landscape → prompt disappears
- [ ] iOS: Prompt doesn't show on iPad in landscape (tablet detection)
- [ ] Dismissal: Click dismiss button → game continues in portrait (degraded)
- [ ] Settings modal: Usable in both orientations
- [ ] VictoryScreen: Displays correctly in both orientations
- [ ] CSS layout: VexFlow staves expand to full width in landscape

## Sources

- [Managing screen orientation - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation)
- [Using React Hooks for Device Orientation | UXPin](https://www.uxpin.com/studio/blog/using-react-hooks-for-device-orientation/)
- [useEffect Cleanup Function Examples](https://react.wiki/hooks/use-effect-cleanup/)
- [How to Create a Portrait Mode Only Mobile First Web App](https://spin.atomicobject.com/portrait-mode-web-app/)
