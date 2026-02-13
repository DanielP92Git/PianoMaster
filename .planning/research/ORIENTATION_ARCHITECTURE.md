# Architecture: Auto-Rotate Landscape for Mobile Games

**Project:** PianoApp2 - Auto-Rotate Landscape Integration
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

Auto-rotate landscape functionality should integrate at the **route level** using a custom React hook that leverages the Screen Orientation API. The architecture follows existing patterns in the codebase (feature-scoped contexts, route-based conditional rendering in AppLayout) while introducing a new orientation management layer that activates only for game routes.

**Key architectural decision:** Component-level implementation via custom hook rather than global Context provider, because orientation locking is route-specific behavior that should mount/unmount with game components.

---

## System Overview

### Integration Points with Existing Architecture

The existing architecture already has game-route awareness:
- **AppLayout.jsx** (lines 18-27): Defines `gameRoutes` array and `isGameRoute` boolean that conditionally hides sidebar/header
- **Game components**: NotesRecognitionGame, SightReadingGame, MetronomeTrainer, MemoryGame
- **Full-viewport pattern**: TrailMapPage uses `fixed inset-0 overflow-y-auto` for full-screen coverage
- **AccessibilityContext**: Provides `reducedMotion` flag (relevant for rotation prompt animations)

### New Components Required

1. **`useOrientationLock` hook** (`src/hooks/useOrientationLock.js`)
   - Handles Screen Orientation API calls
   - Manages lock/unlock lifecycle
   - Returns current orientation state and loading status

2. **`RotatePromptOverlay` component** (`src/components/ui/RotatePromptOverlay.jsx`)
   - Fixed overlay shown when device is in portrait during landscape-locked games
   - Uses CSS transform pattern for iOS Safari compatibility
   - Respects `reducedMotion` from AccessibilityContext

3. **`DeviceDetection` utility** (`src/utils/deviceDetection.js`)
   - Platform detection (iOS vs Android)
   - Standalone PWA detection
   - Capabilities detection (Screen Orientation API support)

---

## Component Responsibilities

### New Components

#### `useOrientationLock(targetOrientation, options)`
**Location:** `src/hooks/useOrientationLock.js`
**Responsibility:** Manage orientation locking lifecycle for game components
**Returns:** `{ orientation, isLocked, isSupported, isLoading, error }`

**Lifecycle:**
```javascript
useEffect(() => {
  // On mount: Lock to targetOrientation
  // On unmount: Unlock orientation
  return () => { screen.orientation.unlock() }
}, [targetOrientation])
```

**Platform handling:**
- Detects Screen Orientation API support
- Falls back gracefully on iOS Safari (no-op, shows prompt overlay only)
- Uses `screen.orientation.lock('landscape')` on supported devices (Android Chrome, Desktop)
- Listens to `orientationchange` event via `window.matchMedia` for state updates

**Integration with accessibility:**
```javascript
const { reducedMotion } = useAccessibility()
// Pass to RotatePromptOverlay for animation control
```

#### `RotatePromptOverlay({ isVisible, reducedMotion })`
**Location:** `src/components/ui/RotatePromptOverlay.jsx`
**Responsibility:** Display "rotate device" message when in portrait during landscape game
**Shows when:** `isVisible && orientation === 'portrait'`

**Implementation pattern:**
```jsx
<AnimatePresence>
  {isVisible && (
    <motion.div
      className="fixed inset-0 z-[10000] bg-slate-900/95 flex items-center justify-center"
      initial={reducedMotion ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Phone rotation icon (SVG or Unicode) */}
      {/* "Please rotate your device" message */}
      {/* i18n support via useTranslation */}
    </motion.div>
  )}
</AnimatePresence>
```

**CSS fallback for iOS (no Screen Orientation API):**
Uses `window.matchMedia('(orientation: portrait)')` listener to detect orientation changes and conditionally renders overlay.

#### `deviceDetection.js`
**Location:** `src/utils/deviceDetection.js`
**Exports:**
```javascript
export const PLATFORM = {
  IOS: 'ios',
  ANDROID: 'android',
  DESKTOP: 'desktop',
  UNKNOWN: 'unknown'
}

export function detectPlatform() {
  const UA = navigator.userAgent
  if (UA.match(/iPhone|iPad|iPod/)) return PLATFORM.IOS
  if (UA.match(/Android/)) return PLATFORM.ANDROID
  return PLATFORM.DESKTOP
}

export function isPWAStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true
}

export function supportsOrientationLock() {
  return 'orientation' in screen && 'lock' in screen.orientation
}
```

### Modified Components

#### Game Components (NotesRecognitionGame, SightReadingGame, MetronomeTrainer, MemoryGame)
**Change:** Add orientation lock at component level

**Pattern (add to each game component):**
```javascript
import { useOrientationLock } from '../../../hooks/useOrientationLock'
import { useAccessibility } from '../../../contexts/AccessibilityContext'
import { RotatePromptOverlay } from '../../ui/RotatePromptOverlay'

function NotesRecognitionGame() {
  const { reducedMotion } = useAccessibility()
  const { orientation, isSupported } = useOrientationLock('landscape', {
    enabled: true // Always attempt lock for games
  })

  const showRotatePrompt = orientation === 'portrait'

  return (
    <>
      <RotatePromptOverlay isVisible={showRotatePrompt} reducedMotion={reducedMotion} />
      {/* Existing game UI */}
    </>
  )
}
```

**Auto-start behavior with trail nodes:**
Existing pattern (NotesRecognitionGame.jsx uses `hasAutoStartedRef` to prevent double-start) remains unchanged. Orientation lock happens independently via hook.

#### VictoryScreen
**Change:** None required (already uses `fixed inset-0` which works in any orientation)

**Consideration:** VictoryScreen should **not** show rotate prompt. Unlock happens when game component unmounts, so VictoryScreen renders in unlocked state.

#### AppLayout.jsx
**Change:** None required (already has game route awareness)

**Existing behavior preserved:**
```javascript
const isGameRoute = gameRoutes.includes(location.pathname)
// Hides sidebar/header when isGameRoute === true
```

Game routes automatically get full-viewport treatment. Orientation lock is additional layer at component level.

---

## Architectural Patterns

### Pattern 1: Route-Level Orientation Lock via Custom Hook

**What:** Use `useOrientationLock` hook in game components instead of route-level HOC or Context provider

**When:** Game components mount (via React Router navigation)

**Why this approach:**
- **Separation of concerns:** Orientation is game-specific behavior, not app-wide state
- **Automatic cleanup:** React's `useEffect` cleanup function handles unlock on unmount
- **No route file modifications:** Existing route structure unchanged, logic lives in components
- **Testable:** Hook can be unit tested independently

**Example:**
```javascript
// Game component lifecycle:
// 1. Mount → useOrientationLock runs → calls screen.orientation.lock('landscape')
// 2. Render → Shows game + RotatePromptOverlay if portrait
// 3. Unmount → useEffect cleanup → calls screen.orientation.unlock()
```

### Pattern 2: Progressive Enhancement with Feature Detection

**What:** Graceful degradation for platforms without Screen Orientation API support

**Implementation:**
```javascript
export function useOrientationLock(targetOrientation, options = {}) {
  const [isSupported] = useState(() => supportsOrientationLock())
  const [orientation, setOrientation] = useState('unknown')

  useEffect(() => {
    if (!isSupported) {
      // Fallback: Use matchMedia listener only
      const mediaQuery = window.matchMedia('(orientation: landscape)')
      const handler = (e) => setOrientation(e.matches ? 'landscape' : 'portrait')
      mediaQuery.addEventListener('change', handler)
      handler({ matches: mediaQuery.matches }) // Initial state
      return () => mediaQuery.removeEventListener('change', handler)
    }

    // Supported: Use Screen Orientation API
    screen.orientation.lock(targetOrientation).catch(err => {
      console.warn('Orientation lock failed:', err)
    })

    const handler = () => setOrientation(screen.orientation.type.split('-')[0])
    screen.orientation.addEventListener('change', handler)
    handler() // Initial state

    return () => {
      screen.orientation.removeEventListener('change', handler)
      screen.orientation.unlock()
    }
  }, [targetOrientation, isSupported])

  return { orientation, isSupported, isLocked: isSupported }
}
```

**Platforms:**
- **Android Chrome/PWA:** Full Screen Orientation API support (lock works)
- **iOS Safari/PWA:** No Screen Orientation API (fallback to matchMedia + overlay prompt)
- **Desktop browsers:** API supported but may not lock (overlay shows as fallback)

### Pattern 3: Overlay-Based User Guidance

**What:** Fixed overlay with rotation prompt instead of forcing rotation via CSS transform

**Why not CSS transform approach:**
- Accessibility concerns: W3C ACT Rule b33eff warns against restricting orientation via CSS transforms
- User agency: Users should control device orientation, app guides but doesn't force
- Simpler implementation: No complex transform calculations or viewport manipulation

**Implementation:**
```jsx
// Overlay shows when:
// - Game is active (component mounted)
// - Device is in portrait orientation
// - User hasn't rotated yet

// Overlay hides when:
// - User rotates to landscape
// - Game ends (component unmounts)
```

### Pattern 4: Event Listener Management with matchMedia

**What:** Use `window.matchMedia` instead of `resize` event for performance

**Why:**
- Fires only on orientation breakpoint changes, not every pixel resize
- 150% faster than resize event listeners
- Aligns with existing AccessibilityContext pattern (already uses matchMedia for `prefers-reduced-motion`)

**Example:**
```javascript
useEffect(() => {
  const mediaQuery = window.matchMedia('(orientation: landscape)')

  const handleOrientationChange = (e) => {
    setIsLandscape(e.matches)
  }

  // addEventListener polyfill for older browsers (if needed):
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleOrientationChange)
  } else {
    mediaQuery.addListener(handleOrientationChange) // Deprecated but fallback
  }

  // Initial state
  handleOrientationChange(mediaQuery)

  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleOrientationChange)
    } else {
      mediaQuery.removeListener(handleOrientationChange)
    }
  }
}, [])
```

---

## Data Flow

### Orientation Lock Lifecycle

```
1. User navigates to game route
   → React Router mounts game component

2. Game component renders
   → useOrientationLock hook executes
   → useEffect runs:
      - Detects platform via deviceDetection.js
      - Calls screen.orientation.lock('landscape') if supported
      - Sets up matchMedia listener for orientation changes
      - Returns cleanup function

3. User plays game in landscape
   → Orientation state: 'landscape'
   → RotatePromptOverlay: isVisible={false}

4. User rotates to portrait (mid-game)
   → matchMedia listener fires
   → Orientation state: 'portrait'
   → RotatePromptOverlay: isVisible={true}
   → Game remains playable (no functional blocking, only visual prompt)

5. User rotates back to landscape
   → matchMedia listener fires
   → Orientation state: 'landscape'
   → RotatePromptOverlay: isVisible={false}

6. Game ends, VictoryScreen shows
   → Game component still mounted (VictoryScreen is child component)
   → Orientation lock still active

7. User clicks "Back to Trail"
   → Navigate away from game route
   → Game component unmounts
   → useEffect cleanup runs
   → screen.orientation.unlock() called
   → User can use device in any orientation
```

### State Dependencies

```
DeviceDetection (utility)
  ↓
useOrientationLock (hook)
  ↓ (provides orientation state)
  ↓
Game Component
  ↓ (passes state to overlay)
  ↓
RotatePromptOverlay
  ↑ (reads reducedMotion)
  ↑
AccessibilityContext
```

**No new global state required.** Orientation is ephemeral component-level state.

---

## Integration Points

### 1. Existing Route Structure (No Changes)

**File:** `src/App.jsx` (routes definition)

Game routes already defined:
```javascript
<Route path="/notes-master-mode/notes-recognition-game" element={<NotesRecognitionGame />} />
<Route path="/notes-master-mode/sight-reading-game" element={<SightReadingGame />} />
<Route path="/notes-master-mode/memory-game" element={<MemoryGame />} />
<Route path="/rhythm-mode/metronome-trainer" element={<MetronomeTrainer />} />
```

**Integration:** Orientation lock activates via hook inside each game component. No route-level wrapper needed.

### 2. AppLayout Conditional Rendering (No Changes)

**File:** `src/components/layout/AppLayout.jsx`

Existing game route detection:
```javascript
const gameRoutes = [
  "/notes-master-mode/notes-recognition-game",
  "/notes-master-mode/memory-game",
  "/notes-master-mode/sight-reading-game",
  "/rhythm-mode/metronome-trainer",
]
const isGameRoute = gameRoutes.includes(location.pathname)
```

**Integration:** Sidebar/header already hidden for games. Orientation lock is independent additional behavior.

### 3. AccessibilityContext Integration (Read-Only)

**File:** `src/contexts/AccessibilityContext.jsx`

**Usage in orientation components:**
```javascript
// In RotatePromptOverlay.jsx
const { reducedMotion } = useAccessibility()

// Disable rotation animation if reducedMotion is true
<motion.div
  initial={reducedMotion ? { opacity: 1 } : { opacity: 0, rotate: -90 }}
  animate={{ opacity: 1, rotate: 0 }}
  transition={reducedMotion ? { duration: 0 } : { duration: 0.5 }}
>
```

**No modifications to AccessibilityContext required.** Read-only consumer relationship.

### 4. Trail Node Auto-Start Flow (No Changes)

**Files:**
- `NotesRecognitionGame.jsx` (lines 1-100, uses `hasAutoStartedRef`)
- `SightReadingGame.jsx` (similar pattern)
- `MetronomeTrainer.jsx` (similar pattern)

**Existing pattern:**
```javascript
const hasAutoStartedRef = useRef(false)
useEffect(() => {
  if (nodeConfig && !hasAutoStartedRef.current) {
    hasAutoStartedRef.current = true
    // Build settings from nodeConfig
    // Start game automatically
  }
}, [nodeConfig])
```

**Integration:** Orientation lock happens independently. Timeline:
1. Game component mounts
2. `useOrientationLock` runs (locks orientation)
3. Auto-start effect runs (starts game)
4. Both are independent, no coordination needed

### 5. VictoryScreen Display (No Changes)

**File:** `src/components/games/VictoryScreen.jsx`

VictoryScreen already uses:
```jsx
<div className="fixed inset-0 z-[9999] flex justify-center overflow-y-auto p-2 sm:p-4">
```

**Works in any orientation.** When game component unmounts and orientation unlocks, VictoryScreen can display in portrait or landscape naturally.

### 6. i18n Translation Keys (New Additions)

**File:** `src/locales/en/common.json` (and `he/common.json`)

**New keys needed:**
```json
{
  "orientation": {
    "rotatePrompt": "Please rotate your device to landscape",
    "rotatePromptSubtitle": "This game works best in landscape mode",
    "rotateIcon": "📱➡️📱"
  }
}
```

**Integration:** RotatePromptOverlay uses `useTranslation('common')` to display localized messages.

---

## Build Order (Dependency-Aware)

### Phase 1: Foundation (No Dependencies)
1. **Create `deviceDetection.js` utility**
   - Platform detection functions
   - PWA standalone detection
   - Screen Orientation API capability check
   - Unit tests

### Phase 2: Hook Implementation (Depends on Phase 1)
2. **Create `useOrientationLock` hook**
   - Uses `deviceDetection.js`
   - Screen Orientation API integration
   - matchMedia fallback
   - Event listener cleanup
   - Unit tests with mock Screen Orientation API

### Phase 3: UI Component (Depends on Phase 1, 2)
3. **Create `RotatePromptOverlay` component**
   - Fixed overlay with z-index 10000
   - Rotation icon (SVG or Unicode)
   - i18n support (add translation keys first)
   - Framer Motion animations
   - Respects `reducedMotion` from AccessibilityContext
   - Component tests

### Phase 4: Integration (Depends on Phase 1-3)
4. **Integrate into first game component (NotesRecognitionGame)**
   - Import `useOrientationLock`
   - Import `RotatePromptOverlay`
   - Add hook call at component top level
   - Add overlay component to JSX
   - Manual testing on Android/iOS

5. **Integrate into remaining game components**
   - SightReadingGame
   - MetronomeTrainer
   - MemoryGame
   - Copy pattern from NotesRecognitionGame (consistent implementation)

### Phase 5: Testing & Refinement
6. **Cross-platform testing**
   - Android Chrome (PWA installed): Verify lock works
   - Android Chrome (browser): Verify lock works
   - iOS Safari (PWA installed): Verify prompt shows (no lock)
   - iOS Safari (browser): Verify prompt shows (no lock)
   - Desktop Chrome: Verify graceful handling
   - Tablet devices: Test both orientations

7. **Edge case handling**
   - Rapid orientation changes
   - Lock/unlock during component transitions
   - VictoryScreen display in both orientations
   - Trail auto-start flow with orientation lock

---

## Platform-Specific Considerations

### Android (Full Support)
- **Screen Orientation API:** Fully supported in Chrome, PWA, WebView
- **Lock behavior:** `screen.orientation.lock('landscape')` works reliably
- **User experience:** Orientation locks immediately on game mount
- **Prompt overlay:** Rarely shown (only if lock fails or user force-rotates)

### iOS (Limited Support, Workaround Required)
- **Screen Orientation API:** Not supported in Safari/PWA (even in fullscreen)
- **Fullscreen API:** Only works on iPad, not iPhone
- **Lock behavior:** Cannot programmatically lock orientation
- **User experience:** Relies entirely on RotatePromptOverlay to guide user
- **Implementation:** `useOrientationLock` returns `isSupported: false`, overlay shows when portrait detected

**iOS-specific code path:**
```javascript
// In useOrientationLock hook:
if (!supportsOrientationLock()) {
  // iOS fallback: matchMedia listener only, no lock attempt
  const mediaQuery = window.matchMedia('(orientation: landscape)')
  // ... set up listener
  return { orientation, isSupported: false, isLocked: false }
}
```

### Desktop Browsers (Partial Support)
- **Screen Orientation API:** Supported but may not enforce lock (no physical rotation)
- **Lock behavior:** `lock()` may succeed but has no effect (device doesn't rotate)
- **User experience:** Overlay can guide if browser window is in portrait aspect ratio
- **Implementation:** Hook attempts lock, overlay shows based on window aspect ratio via matchMedia

---

## Performance Considerations

### Event Listener Efficiency
- **matchMedia vs resize:** matchMedia fires only on breakpoint changes (150% faster)
- **Cleanup:** All listeners removed on unmount (no memory leaks)
- **Throttling:** Not needed (matchMedia already debounced by browser)

### Component Rendering
- **RotatePromptOverlay:** Only renders when `isVisible={true}` via AnimatePresence
- **Re-renders:** Orientation state change triggers only affected components (hook consumers)
- **Animation performance:** Framer Motion uses GPU-accelerated transforms

### API Call Overhead
- **Lock/unlock:** Called once per game session (on mount/unmount)
- **Error handling:** Lock failures caught and logged, don't block gameplay
- **No polling:** Event-driven orientation detection (no continuous checking)

---

## Error Handling & Fallbacks

### Screen Orientation API Failure
```javascript
try {
  await screen.orientation.lock('landscape')
} catch (error) {
  // Possible reasons:
  // - Not in fullscreen (some browsers require this)
  // - Permission denied
  // - API not supported
  console.warn('Orientation lock failed:', error.message)
  // Fallback: Show prompt overlay, continue game
}
```

### Orientation Detection Failure
```javascript
// If matchMedia not supported (very old browsers):
if (!window.matchMedia) {
  // Ultra-fallback: Assume landscape, no prompt
  return { orientation: 'landscape', isSupported: false }
}
```

### Component Mount/Unmount Race Conditions
```javascript
useEffect(() => {
  let isMounted = true

  async function lockOrientation() {
    try {
      await screen.orientation.lock('landscape')
      if (isMounted) {
        setIsLocked(true)
      }
    } catch (error) {
      if (isMounted) {
        setError(error)
      }
    }
  }

  lockOrientation()

  return () => {
    isMounted = false
    screen.orientation.unlock()
  }
}, [])
```

---

## Testing Strategy

### Unit Tests

**`deviceDetection.test.js`:**
- Mock `navigator.userAgent` for iOS/Android/Desktop
- Verify `detectPlatform()` returns correct platform
- Verify `supportsOrientationLock()` with/without API

**`useOrientationLock.test.js`:**
- Mock `screen.orientation` API
- Verify lock called on mount with correct orientation
- Verify unlock called on unmount
- Verify matchMedia fallback when API unavailable
- Verify orientation state updates on change events

**`RotatePromptOverlay.test.jsx`:**
- Render with `isVisible={true}` and verify overlay present
- Render with `isVisible={false}` and verify no overlay
- Verify `reducedMotion` prop disables animations
- Verify i18n message renders correctly

### Integration Tests

**Game component with orientation lock:**
- Mount game component
- Verify `useOrientationLock` hook called
- Simulate portrait orientation change
- Verify RotatePromptOverlay appears
- Simulate landscape orientation change
- Verify RotatePromptOverlay disappears
- Unmount component
- Verify `screen.orientation.unlock()` called

### Manual Testing Checklist

- [ ] Android Chrome (browser): Game locks to landscape
- [ ] Android Chrome (PWA): Game locks to landscape
- [ ] iOS Safari (browser): Prompt shows in portrait, hides in landscape
- [ ] iOS Safari (PWA): Prompt shows in portrait, hides in landscape
- [ ] iPad Safari: Test fullscreen behavior
- [ ] Desktop Chrome: Graceful handling (no errors)
- [ ] Rotate during game: Prompt appears/disappears smoothly
- [ ] Navigate away mid-game: Orientation unlocks properly
- [ ] VictoryScreen: Displays correctly in any orientation
- [ ] Trail auto-start: Works with orientation lock active
- [ ] Reduced motion: Prompt animations disabled

---

## Source Attribution

### Screen Orientation API
- [MDN: ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock)
- [MDN: Managing screen orientation](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation)
- [Expo ScreenOrientation Documentation](https://docs.expo.dev/versions/latest/sdk/screen-orientation/)

### Platform Detection
- [web.dev: PWA Detection](https://web.dev/learn/pwa/detection)
- [Detecting if PWA is installed - GitHub Gist](https://gist.github.com/IvoPereira/5a5106cdf9819af385fad55925f96190)

### iOS Limitations
- [PWA iOS Limitations and Safari Support](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [OutSystems: Orientation lock in PWA](https://www.outsystems.com/forums/discussion/64798/orientation-lock-in-pwa/)
- [Brainhub: PWA on iOS Current Status & Limitations](https://brainhub.eu/library/pwa-on-ios)
- [Medium: Realizing a PWA Screen Orientation Lock](https://hearthero.medium.com/locking-orientation-for-ionic-pwas-7c75c5bb3639)

### React Patterns
- [UXPin: Using React Hooks for Device Orientation](https://www.uxpin.com/studio/blog/using-react-hooks-for-device-orientation/)
- [useHooks: useOrientation](https://usehooks.com/useorientation)
- [LogRocket: Managing orientation changes in React Native](https://blog.logrocket.com/managing-orientation-changes-react-native-apps/)
- [Better Programming: Using window.matchMedia in React](https://betterprogramming.pub/using-window-matchmedia-in-react-8116eada2588)

### CSS Rotation Fallback
- [CSS-Tricks: Orientation Lock](https://css-tricks.com/snippets/css/orientation-lock/)
- [Code Boxx: 3 Ways to Lock Screen Orientation](https://code-boxx.com/lock-screen-orientation/)
- [W3C ACT Rule: Orientation restriction with CSS transforms](https://www.w3.org/WAI/standards-guidelines/act/rules/b33eff/)

### UI Patterns
- [Joshua Bartz: Prompting readers to rotate their phones](https://www.jshbrtz.com/posts/desktop-screenshots-on-mobile/)
- [Smashing Magazine: Designing For Device Orientation](https://www.smashingmagazine.com/2012/08/designing-device-orientation-portrait-landscape/)

### State Management
- [Nucamp: State Management in 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns)
- [TheLinuxCode: State Management in React 2026](https://thelinuxcode.com/state-management-in-react-2026-hooks-context-api-and-redux-in-practice/)
- [Feature-Sliced Design: React Context API Guide](https://feature-sliced.design/blog/react-context-api-guide)

### Component Lifecycle
- [Medium: React Component Lifecycle in 2025](https://medium.com/@a1guy/react-component-lifecycle-in-2025-mount-update-unmount-explained-visually-692d9fe5b0f2)
- [Medium: React Router and Component Lifecycle](https://medium.com/swlh/exploring-react-part-1-a6e9368c9d81)
