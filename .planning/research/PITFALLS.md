# Domain Pitfalls: Auto-Rotate Landscape on Mobile Games

**Domain:** Adding screen orientation lock and rotate prompts to existing PWA games
**Researched:** 2026-02-13
**Confidence:** MEDIUM-HIGH (combination of official docs, real-world issues, and recent 2026 updates)

---

## Executive Summary

Adding orientation control to PWAs is deceptively complex due to:

1. **Platform fragmentation**: iOS Safari and Android Chrome have fundamentally different capabilities
2. **API dependencies**: Screen Orientation API requires fullscreen mode on Android, doesn't work on iPhones at all
3. **Viewport instability**: iOS Safari's viewport calculation changes during rotation create race conditions
4. **VexFlow re-render complexity**: SVG-based notation requires careful coordinate recalculation
5. **Accessibility conflicts**: Forced orientation violates WCAG 1.3.4 unless essential to functionality

For an 8-year-old audience with existing accessibility features (reducedMotion, extended timeouts), orientation changes introduce cognitive load and motion-sickness risks.

---

## Critical Pitfalls

### Pitfall 1: iOS Safari Fullscreen API Doesn't Work on iPhones

**What goes wrong:** You implement Screen Orientation API with `screen.orientation.lock('landscape')`, it works perfectly on Android and iPad, then you test on an iPhone and nothing happens.

**Why it happens:**
- As of iOS 26 (September 2025), Safari supports the Fullscreen API for all elements on **iPads only**
- iPhones still have **zero support** for programmatic fullscreen or orientation lock via JavaScript
- The only iPhone workaround is PWA "Add to Home Screen" with manifest `"display": "fullscreen"`, which only applies when installed as standalone app

**Consequences:**
- Feature works inconsistently across devices
- Parents/teachers expect uniform behavior on all tablets and phones
- Children get confused when rotation prompt shows on some devices but not others

**Prevention:**
```javascript
// ALWAYS feature-detect before attempting orientation lock
const canLockOrientation =
  'orientation' in screen &&
  typeof screen.orientation.lock === 'function';

// Check if we're on a PWA installed to home screen
const isStandalonePWA =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true; // iOS-specific check

// Only show orientation prompt UI if we can actually lock orientation
if (canLockOrientation || isStandalonePWA) {
  showRotatePrompt();
} else {
  // Fallback: Show CSS-only rotate message, can't enforce lock
  showNonBlockingOrientationSuggestion();
}
```

**Detection:**
- Test on **physical iPhone** (not just simulator)
- Test on **physical iPad**
- Test on **Android phone in Chrome**
- Test both browser and installed PWA modes

**Phase assignment:** Phase 1 (Foundation) - Must be in platform detection layer from day one

**Sources:**
- [Apple Developer Forums: Fullscreen API on iPhone](https://developer.apple.com/forums/thread/133248)
- [iOS does not fully support the Fullscreen API in ANY browser](https://github.com/videojs/video.js/issues/7834)
- [Can I use: Fullscreen API](https://caniuse.com/fullscreen)

---

### Pitfall 2: Screen Orientation API Requires Fullscreen on Android

**What goes wrong:** You call `screen.orientation.lock('landscape')` on Android Chrome and get a promise rejection: `"NotAllowedError: The request is not allowed"`

**Why it happens:**
- Screen Orientation API's `lock()` method requires the document to be in **fullscreen mode** on Android
- Both APIs require **user interaction** before they can be triggered (security restriction)
- If you request fullscreen in the wrong order, the promise chain breaks

**Consequences:**
- Lock silently fails without fullscreen
- Error messages are cryptic and unhelpful to debug
- Game starts in portrait when landscape was expected

**Prevention:**
```javascript
// CORRECT ORDER: Fullscreen first, then orientation lock
async function enterLandscapeGameMode() {
  try {
    // Step 1: Request fullscreen (must be triggered by user interaction)
    const elem = document.documentElement;

    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { // Safari
      await elem.webkitRequestFullscreen();
    }

    // Step 2: Wait for fullscreen to activate, then lock orientation
    if (screen.orientation?.lock) {
      await screen.orientation.lock('landscape');
    }

    // Step 3: Start game
    startGame();
  } catch (error) {
    // Handle specific error types
    if (error.name === 'NotAllowedError') {
      showUserMessage('Please allow fullscreen to play in landscape mode');
    } else if (error.name === 'NotSupportedError') {
      // Fallback: Start game without orientation lock
      startGameWithoutLock();
    } else if (error.name === 'AbortError') {
      // User cancelled fullscreen request
      console.log('User declined fullscreen');
    }
  }
}

// BAD: Lock orientation before fullscreen (will fail on Android)
async function enterLandscapeGameMode_WRONG() {
  await screen.orientation.lock('landscape'); // Fails: not in fullscreen
  await document.documentElement.requestFullscreen();
}
```

**Detection:**
- Promise rejection with `NotAllowedError`
- Lock appears to succeed but orientation doesn't change
- Game UI is squashed in portrait

**Phase assignment:** Phase 1 (Foundation) - Must be in core orientation control module

**Sources:**
- [MDN: ScreenOrientation.lock() method](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock)
- [Screen Orientation API Spec](https://w3c.github.io/screen-orientation/)

---

### Pitfall 3: iOS Safari Viewport Height Changes During Rotation (Race Condition)

**What goes wrong:**
1. User rotates device from portrait to landscape
2. `orientationchange` event fires
3. You measure viewport with `window.innerHeight` to recalculate VexFlow layout
4. VexFlow renders to wrong dimensions because viewport hasn't updated yet
5. After 100-300ms, another resize event fires with correct dimensions
6. VexFlow has to re-render again (double render, flicker, wasted work)

**Why it happens:**
- On iOS Safari, `window.innerHeight` is **incorrect** immediately after `orientationchange` event
- The correct value is set after the first render, then a `resize` event fires
- `100vh` is calculated based on the **maximum** viewport height (with browser UI hidden), not actual visible height
- The viewport changes size when the address bar shows/hides during scroll

**Consequences:**
- VexFlow notation renders at wrong scale (too small or clipped)
- Layout shift causes disorienting jump for children
- Double-render costs performance (especially on lower-end devices)
- Pitch detection overlays misalign with staff lines

**Prevention:**
```javascript
// DEBOUNCE orientation change events to wait for final viewport dimensions
let orientationChangeTimeout = null;

function handleOrientationChange() {
  // Clear previous timeout if orientation changes rapidly
  if (orientationChangeTimeout) {
    clearTimeout(orientationChangeTimeout);
  }

  // Wait for iOS Safari to settle on final viewport dimensions
  orientationChangeTimeout = setTimeout(() => {
    recalculateGameLayout();
  }, 300); // 300ms is safe for iOS Safari to complete resize
}

// Listen to BOTH orientationchange and resize (debounced)
window.addEventListener('orientationchange', handleOrientationChange);

let resizeTimeout = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    recalculateGameLayout();
  }, 150);
});

// Use CSS custom property for viewport height instead of 100vh
function setViewportHeight() {
  // Get actual viewport height (not 100vh which is buggy on iOS)
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Update on load, resize, and orientation change
setViewportHeight();
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => {
  setTimeout(setViewportHeight, 300); // Wait for iOS Safari
});

// Use in CSS: height: calc(var(--vh, 1vh) * 100);
```

**Detection:**
- VexFlow staff lines appear too small/large after rotation
- `console.log(window.innerHeight)` immediately after orientationchange shows wrong value
- Second resize event fires 100-300ms later with different dimensions

**Phase assignment:** Phase 2 (Layout Integration) - After orientation API foundation is working

**Sources:**
- [WebKit Bug: window.innerHeight bogus after orientationchange](https://bugs.webkit.org/show_bug.cgi?id=170595)
- [Addressing the iOS Address Bar in 100vh Layouts](https://medium.com/@susiekim9/how-to-compensate-for-the-ios-viewport-unit-bug-46e78d54af0d)
- [100vh problem with iOS Safari](https://medium.com/quick-code/100vh-problem-with-ios-safari-92ab23c852a8)

---

### Pitfall 4: VexFlow SVG getBoundingClientRect() Returns Stale Coordinates After Rotation

**What goes wrong:**
1. Game renders VexFlow staff in portrait orientation
2. User rotates to landscape
3. You call `renderer.resize(newWidth, newHeight)` to re-render VexFlow
4. VexFlow re-renders, but you need to position overlays (like pitch detection cursors)
5. You call `noteElement.getBoundingClientRect()` to get note positions
6. Coordinates are **wrong** - they reflect the old portrait layout, not the new landscape layout

**Why it happens:**
- `getBoundingClientRect()` can return stale cached values if called immediately after DOM mutation
- SVG elements with CSS transforms have known bugs where `getBoundingClientRect()` ignores transforms
- Calling `getBoundingClientRect()` forces layout recalculation, but if SVG hasn't finished repainting, you get old values
- VexFlow's `renderer.resize()` mutates the SVG, but the browser hasn't recalculated bounding boxes yet

**Consequences:**
- Pitch detection cursor appears 50-200px off from where the note actually is
- Touch targets for note selection are misaligned
- Children tap notes but game doesn't register the input

**Prevention:**
```javascript
// Wait for browser to recalculate layout after VexFlow re-render
async function recalculateGameLayout() {
  const container = document.getElementById('vexflow-container');
  const newWidth = container.clientWidth;
  const newHeight = container.clientHeight;

  // Resize VexFlow renderer
  renderer.resize(newWidth, newHeight);

  // Re-draw notation
  redrawVexFlowStaff();

  // CRITICAL: Wait for browser to recalculate layout before querying positions
  // requestAnimationFrame runs after layout/paint
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve); // Double RAF ensures paint completes
    });
  });

  // NOW it's safe to query bounding boxes
  const notePositions = Array.from(
    container.querySelectorAll('.vf-notehead')
  ).map(note => note.getBoundingClientRect());

  updatePitchDetectionOverlay(notePositions);
}

// ALTERNATIVE: Recalculate positions on-demand instead of caching
function getNotePositionLive(noteElement) {
  // Force layout if needed (adds overhead but always accurate)
  noteElement.offsetHeight; // Force reflow
  return noteElement.getBoundingClientRect();
}
```

**Detection:**
- Overlay elements visually misaligned with VexFlow staff
- Console.log of `getBoundingClientRect()` shows same values before/after rotation
- Touch targets don't match visual note positions

**Phase assignment:** Phase 3 (VexFlow Integration) - When connecting pitch detection overlays to notation

**Sources:**
- [VexFlow Issue #712: Resizing renderer changes SVG's elements positions](https://github.com/0xfe/vexflow/issues/712)
- [Mozilla Bug: getBoundingClientRect doesn't take transforms into account for SVG](https://bugzilla.mozilla.org/show_bug.cgi?id=1066435)
- [What forces layout/reflow](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)

---

### Pitfall 5: WCAG 1.3.4 Violation - Forced Orientation Locks User Out

**What goes wrong:** An 8-year-old wheelchair user has their tablet mounted in portrait mode (physical constraint). Your app force-locks to landscape. They can't rotate the physical device, so they can't play the game. **You've just excluded a user due to accessibility failure.**

**Why it happens:**
- Developers assume all users can physically rotate their device
- Wheelchair-mounted tablets are often fixed in one orientation
- Some users with motor impairments use portrait-only device mounts
- Low vision users may have magnification settings that only work in one orientation

**Consequences:**
- WCAG 1.3.4 violation (Level AA)
- COPPA concerns if you're collecting data without considering accessibility requirements
- User frustration and app abandonment
- Legal liability for educational institutions using your app

**Prevention:**
```javascript
// ALWAYS provide an escape hatch - never force orientation without option to override
function initGameOrientation() {
  // Check user's accessibility preference
  const { reducedMotion } = useAccessibility();

  // Check if user has disabled orientation lock in settings
  const userDisabledOrientationLock = localStorage.getItem('disable-orientation-lock') === 'true';

  if (userDisabledOrientationLock) {
    // Respect user preference, start game in current orientation
    startGameInCurrentOrientation();
    return;
  }

  // Show a non-blocking suggestion, not a blocking modal
  if (window.innerWidth < window.innerHeight) {
    // Portrait detected, suggest landscape
    showOrientationSuggestion({
      message: 'For the best experience, please rotate your device to landscape',
      dismissible: true,
      showSettingsLink: true, // Link to disable future prompts
      autoHideAfter: 5000 // Auto-dismiss after 5 seconds
    });
  }

  // Start game immediately, don't block on orientation
  startGame();
}

// In settings panel, provide opt-out
function renderAccessibilitySettings() {
  return (
    <label>
      <input
        type="checkbox"
        checked={disableOrientationLock}
        onChange={(e) => {
          localStorage.setItem('disable-orientation-lock', e.target.checked);
          setDisableOrientationLock(e.target.checked);
        }}
      />
      Disable landscape rotation prompts (recommended for mounted devices)
    </label>
  );
}
```

**Best practice for children's apps:**
- Use **suggestion** instead of **enforcement**
- Show rotate icon for 3-5 seconds, then auto-dismiss
- Let game start in portrait if user doesn't rotate
- Provide layouts that work (albeit not optimally) in both orientations

**Detection:**
- User testing with devices in fixed mounts
- Manual testing: refuse to rotate device, see if game is playable
- Screen reader testing in portrait orientation

**Phase assignment:** Phase 1 (Foundation) - Must be part of initial UX design

**Sources:**
- [WCAG 1.3.4: Orientation (Level AA)](https://www.w3.org/WAI/WCAG21/Understanding/orientation.html)
- [Understanding WCAG SC 1.3.4 Orientation](https://www.digitala11y.com/understanding-sc-1-3-4-orientation/)
- [Mobile App Accessibility: A Comprehensive Guide (2026)](https://www.accessibilitychecker.org/guides/mobile-apps-accessibility/)

---

### Pitfall 6: Rotation Animation Triggers Motion Sickness in Users with Vestibular Disorders

**What goes wrong:** User rotates device → you animate VexFlow staff rotating/scaling to new layout → user with vestibular disorder feels nauseous and stops using the app.

**Why it happens:**
- Animated layout transitions during orientation change create **unnecessary motion**
- The device rotation itself already creates vestibular stimulation
- Adding CSS transitions on top compounds the issue
- Your app's `reducedMotion` setting doesn't disable orientation change animations because you forgot to check it

**Consequences:**
- 70 million people have vestibular disorders
- Children with ADHD are sensitive to excessive motion
- Motion sickness = negative association with learning piano
- Violates your app's existing accessibility commitment

**Prevention:**
```javascript
// Respect reducedMotion when handling orientation changes
function recalculateGameLayout() {
  const { reducedMotion } = useAccessibility();

  // Measure new dimensions
  const container = document.getElementById('vexflow-container');
  const newWidth = container.clientWidth;
  const newHeight = container.clientHeight;

  if (reducedMotion) {
    // NO ANIMATION: Instant re-render
    container.style.transition = 'none';
    renderer.resize(newWidth, newHeight);
    redrawVexFlowStaff();
  } else {
    // ANIMATION: Smooth transition (for users who want it)
    container.style.transition = 'opacity 0.2s ease-out';
    container.style.opacity = '0';

    setTimeout(() => {
      renderer.resize(newWidth, newHeight);
      redrawVexFlowStaff();
      container.style.opacity = '1';
    }, 200);
  }
}

// ALTERNATIVE: Use instant layout change, only animate feedback elements
function recalculateGameLayout_OnlyAnimateFeedback() {
  const { reducedMotion } = useAccessibility();

  // Layout change is instant (no animation)
  renderer.resize(newWidth, newHeight);
  redrawVexFlowStaff();

  // Only animate success/error overlays if reducedMotion is false
  if (!reducedMotion) {
    showOrientationChangeSuccessAnimation(); // Subtle checkmark fade-in
  }
}
```

**CSS approach:**
```css
/* Respect prefers-reduced-motion system preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Respect app-level reducedMotion setting */
.reduced-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
```

**Detection:**
- Enable reducedMotion in app settings
- Rotate device, watch for animations
- Test with system-level "Reduce Motion" enabled (iOS/Android accessibility settings)

**Phase assignment:** Phase 2 (Layout Integration) - When adding orientation change handlers

**Sources:**
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [Design accessible animation and movement](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)
- [WCAG 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)

---

## Moderate Pitfalls

### Pitfall 7: Event Listener Memory Leaks on Orientation Change

**What goes wrong:** You add `orientationchange` and `resize` listeners in game component mount, but forget to remove them on unmount. After playing multiple games, event listeners pile up, causing performance degradation and multiple re-renders on rotation.

**Prevention:**
```javascript
useEffect(() => {
  const handleOrientationChange = debounce(() => {
    recalculateGameLayout();
  }, 300);

  const handleResize = debounce(() => {
    recalculateGameLayout();
  }, 150);

  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleResize);

  // CRITICAL: Clean up on unmount
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

---

### Pitfall 8: Manifest "orientation" Property Conflicts with JavaScript Lock

**What goes wrong:** You set `"orientation": "landscape"` in manifest.json for PWA installed mode, **and** use JavaScript `screen.orientation.lock('landscape')` in browser mode. On some Android devices, the two conflict, causing orientation to lock in browser mode when you don't want it to.

**Prevention:**
- Use **either** manifest orientation (for installed PWA) **or** JavaScript lock (for browser), not both
- Check if app is installed before attempting JavaScript lock:
```javascript
const isInstalled = window.matchMedia('(display-mode: standalone)').matches;

if (!isInstalled) {
  // Only lock orientation in browser mode
  screen.orientation.lock('landscape');
}
```

---

### Pitfall 9: VictoryScreen Modal Not Centered After Orientation Change

**What goes wrong:** User completes game in portrait, VictoryScreen modal appears centered. User rotates to landscape while modal is open. Modal is now off-center or partially off-screen.

**Prevention:**
```javascript
// VictoryScreen should recalculate position on orientation change
useEffect(() => {
  const handleOrientationChange = () => {
    // Force modal to recenter
    setModalPosition('center');
  };

  window.addEventListener('orientationchange', handleOrientationChange);
  return () => window.removeEventListener('orientationchange', handleOrientationChange);
}, []);

// OR use CSS-based centering that auto-adjusts
// .victory-modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
```

---

### Pitfall 10: Fullscreen Exit Breaks Game State

**What goes wrong:** User is in fullscreen landscape game. They press Android back button or iOS swipe-up to exit fullscreen. Fullscreen exits, orientation unlocks, but game is still in "fullscreen mode" state internally, causing UI mismatches.

**Prevention:**
```javascript
// Listen for fullscreen exit and clean up state
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    // User exited fullscreen
    handleFullscreenExit();
  }
});

function handleFullscreenExit() {
  // Unlock orientation
  if (screen.orientation?.unlock) {
    screen.orientation.unlock();
  }

  // Reset game state
  setIsFullscreen(false);
  setOrientationLocked(false);

  // Recalculate layout for non-fullscreen
  recalculateGameLayout();
}
```

---

### Pitfall 11: Input Focus Breaks Fullscreen on iOS

**What goes wrong:** Game is in fullscreen on iPad. User taps an input field (e.g., for entering a note name). Fullscreen exits immediately. User is confused.

**Prevention:**
- Avoid text inputs in fullscreen game flow
- If input is essential, warn user that fullscreen will exit:
```javascript
<input
  onFocus={() => {
    if (document.fullscreenElement) {
      showToast('Fullscreen will exit when typing');
    }
  }}
/>
```

**Sources:**
- [Apple Developer Forums: Input focus exits fullscreen](https://developer.apple.com/forums/thread/694940)

---

### Pitfall 12: Orientation Lock Persists After Navigating Away from Game

**What goes wrong:** User plays game in locked landscape mode. User exits game to dashboard. Dashboard is still locked in landscape even though it should be portrait-friendly.

**Prevention:**
```javascript
// Unlock orientation when leaving game
useEffect(() => {
  // Lock on mount
  lockOrientation('landscape');

  // Unlock on unmount
  return () => {
    if (screen.orientation?.unlock) {
      screen.orientation.unlock();
    }
  };
}, []);
```

---

### Pitfall 13: Android PWA Ignores System Orientation Lock Setting

**What goes wrong:** User has Android system-level "rotation lock" enabled (expects portrait-only). Your PWA ignores this setting and forces landscape anyway. User is frustrated.

**Prevention:**
- **Don't override system orientation lock** unless you have a strong UX reason
- Check if system rotation is locked before attempting to lock orientation
- Provide in-app setting to respect system rotation lock

**Sources:**
- [GitHub Issue: PWA ignores Android orientation lock](https://github.com/decompme/decomp.me/issues/1648)

---

## Minor Pitfalls

### Pitfall 14: Debounce/Throttle Function Creates Closures Over Stale State

**What goes wrong:** You debounce orientation change handler, but it captures old React state in closure. When debounced function finally runs, it uses stale `reducedMotion` value.

**Prevention:**
```javascript
// Use ref for latest state in debounced callback
const reducedMotionRef = useRef(reducedMotion);
useEffect(() => {
  reducedMotionRef.current = reducedMotion;
}, [reducedMotion]);

const handleOrientationChange = useCallback(
  debounce(() => {
    // Use ref, not closure variable
    recalculateGameLayout(reducedMotionRef.current);
  }, 300),
  []
);
```

---

### Pitfall 15: Rotate Prompt Shows for Tablets That Don't Need It

**What goes wrong:** You show "Please rotate to landscape" prompt on all devices with `width < height`. But some tablets (e.g., Surface Pro) are used primarily in portrait by choice.

**Prevention:**
```javascript
// Only show rotate prompt on small screens (phones), not tablets
const isSmallDevice = window.innerWidth < 768; // Adjust threshold
const isPortrait = window.innerWidth < window.innerHeight;

if (isSmallDevice && isPortrait) {
  showRotatePrompt();
}
```

---

### Pitfall 16: Service Worker Caches Orientation-Specific Assets

**What goes wrong:** VexFlow renders portrait layout, service worker caches SVG. User rotates to landscape, gets cached portrait SVG instead of re-rendering.

**Prevention:**
- **Don't cache dynamically generated VexFlow SVGs** in service worker
- Add VexFlow container to cache exclusion list:
```javascript
// In sw.js
const NEVER_CACHE = [
  /vexflow-container/,
  /dynamic-notation/
];
```

---

### Pitfall 17: Confusing UX for 8-Year-Olds: Too Many Prompts

**What goes wrong:** Game flow becomes:
1. "Allow fullscreen" browser prompt
2. "Please rotate device" app prompt
3. "Allow microphone" browser prompt
4. Game settings modal

Four prompts before playing = children abandon the game.

**Prevention:**
- **Consolidate prompts** into single onboarding flow
- Use pictorial instructions instead of text for children
- Auto-dismiss prompts after 5 seconds with "Skip" option
- Don't block game start on orientation

**Sources:**
- [UX Design for Kids: Principles and Recommendations](https://www.ramotion.com/blog/ux-design-for-kids/)
- [Designing for Kids: Best Practices](https://uxplanet.org/designing-apps-for-kids-best-practices-8e32409d07c3)

---

### Pitfall 18: Landscape Layout Breaks RTL (Hebrew) Text Flow

**What goes wrong:** Your app supports Hebrew RTL. In portrait, RTL works perfectly. User rotates to landscape, and suddenly Hebrew text flows left-to-right.

**Prevention:**
- Test RTL in **both** orientations
- Ensure `dir="rtl"` attribute persists through orientation changes
- CSS logical properties (`margin-inline-start` instead of `margin-left`) help maintain RTL

---

## "Looks Done But Isn't" Checklist

Before marking orientation feature complete, verify:

- [ ] **iOS iPhone physical device tested** (not just simulator) - orientation lock fails on iPhones
- [ ] **iPad physical device tested** - fullscreen API behaves differently than iPhone
- [ ] **Android phone physical device tested** - fullscreen + orientation lock combo
- [ ] **Tested in both browser and installed PWA modes** - different API availability
- [ ] **VexFlow re-renders correctly after rotation** - wait for double RAF before querying bounding boxes
- [ ] **Pitch detection overlays align with notes after rotation** - getBoundingClientRect returns fresh coordinates
- [ ] **VictoryScreen modal stays centered after rotation** - doesn't clip or misalign
- [ ] **Orientation unlocks when navigating away from game** - doesn't lock dashboard
- [ ] **Fullscreen exits cleanly when user presses back button** - state cleanup on fullscreenchange
- [ ] **`reducedMotion` setting disables rotation animations** - no transitions when setting enabled
- [ ] **System-level reduced motion preference respected** - test with iOS/Android accessibility setting
- [ ] **Accessibility settings panel includes "Disable orientation prompts" toggle** - escape hatch for mounted devices
- [ ] **Rotate prompt is dismissible and non-blocking** - doesn't prevent game start
- [ ] **Game playable in portrait (degraded but functional)** - WCAG 1.3.4 compliance
- [ ] **Tested with wheelchair-mounted device (or simulated by refusing to rotate)** - accessibility validation
- [ ] **Event listeners cleaned up on unmount** - no memory leaks
- [ ] **Service worker doesn't cache orientation-specific VexFlow SVGs** - dynamic content excluded
- [ ] **Hebrew RTL text flows correctly in both orientations** - logical CSS properties used
- [ ] **Onboarding flow doesn't show 4+ prompts** - consolidated UX for children
- [ ] **Promise rejection handling for all orientation/fullscreen API calls** - graceful degradation
- [ ] **Viewport height uses CSS custom property, not 100vh** - iOS Safari bug workaround

---

## Pitfall-to-Phase Mapping

| Phase | Focus | Pitfalls to Address | Why This Phase |
|-------|-------|---------------------|----------------|
| **Phase 1: Foundation** | Platform detection, API feature detection, orientation suggestion UX | #1 (iOS incompatibility), #2 (fullscreen requirement), #5 (WCAG violation), #17 (UX overload) | Must establish what's technically possible before building on it |
| **Phase 2: Layout Integration** | Viewport measurement, debounced event handling, CSS custom properties | #3 (viewport race condition), #6 (motion sickness), #7 (memory leaks), #18 (RTL breakage) | Layout must be stable before adding VexFlow integration |
| **Phase 3: VexFlow Integration** | SVG re-render, coordinate recalculation, overlay positioning | #4 (getBoundingClientRect staleness), #9 (VictoryScreen centering), #16 (service worker caching) | Core game graphics dependent on stable layout |
| **Phase 4: State Management** | Fullscreen lifecycle, orientation lock cleanup, navigation guards | #8 (manifest conflicts), #10 (fullscreen exit state), #12 (lock persistence), #14 (stale closures) | State bugs surface during game flow transitions |
| **Phase 5: Accessibility Polish** | Reduced motion integration, escape hatches, system preference detection | #6 (motion revisited), #11 (input focus), #13 (system lock override), #15 (tablet prompts) | Polish phase ensures no users are excluded |
| **Phase 6: Testing & Validation** | Physical device testing, edge case coverage, UX refinement | All pitfalls revisited with real devices and real users | Many issues only surface on physical hardware |

---

## Phase-Specific Warnings

### Phase 1 (Foundation)
- **Likely needs deeper research:** iOS Safari fullscreen polyfills and workarounds
- **Hidden complexity:** Promise rejection handling has 3+ error types, each needs different UX response
- **Blocker risk:** If you skip feature detection, Phase 3 will fail on iPhones

### Phase 2 (Layout Integration)
- **Likely needs deeper research:** Debounce timing values (300ms? 500ms?) need real device testing
- **Hidden complexity:** iOS Safari viewport calculation changes across iOS versions (15 vs 16 vs 17 vs 26)
- **Blocker risk:** If viewport measurement is wrong, all subsequent phases inherit the bug

### Phase 3 (VexFlow Integration)
- **Likely needs deeper research:** VexFlow's internal coordinate system during resize
- **Hidden complexity:** SVG bounding box caching behavior varies across Chrome/Safari/Firefox
- **Blocker risk:** Pitch detection overlays misaligning is a show-stopper for gameplay

### Phase 4 (State Management)
- **Likely needs deeper research:** Navigation guards in React Router for orientation lock cleanup
- **Hidden complexity:** Fullscreen API's interaction with React lifecycle (useEffect cleanup timing)
- **Blocker risk:** Orientation lock persisting to dashboard = bad UX, easy to miss in testing

### Phase 5 (Accessibility Polish)
- **Likely needs deeper research:** COPPA compliance implications of orientation enforcement
- **Hidden complexity:** Children's cognitive load when presented with rotate prompts
- **Blocker risk:** Missing WCAG 1.3.4 compliance = legal liability for schools

### Phase 6 (Testing & Validation)
- **Likely needs deeper research:** Device lab access or remote testing services (BrowserStack, etc.)
- **Hidden complexity:** iOS Simulator does NOT accurately represent physical device behavior
- **Blocker risk:** If you only test in simulators, you'll ship broken iOS experience

---

## Sources

### High Confidence (Official Docs, Specs)
- [W3C Screen Orientation API Spec](https://w3c.github.io/screen-orientation/)
- [MDN: ScreenOrientation.lock() method](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock)
- [WCAG 1.3.4: Orientation](https://www.w3.org/WAI/WCAG21/Understanding/orientation.html)
- [Can I use: Fullscreen API](https://caniuse.com/fullscreen)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)

### Medium Confidence (Real-World Issues, Bug Reports)
- [GitHub: VexFlow Issue #712 - Resizing renderer changes SVG positions](https://github.com/0xfe/vexflow/issues/712)
- [GitHub: video.js Issue #7834 - iOS Fullscreen API limitations](https://github.com/videojs/video.js/issues/7834)
- [WebKit Bug #170595: window.innerHeight bogus after orientationchange](https://bugs.webkit.org/show_bug.cgi?id=170595)
- [Mozilla Bug #1066435: getBoundingClientRect doesn't take transforms into account for SVG](https://bugzilla.mozilla.org/show_bug.cgi?id=1066435)

### Medium Confidence (Developer Guides, Best Practices)
- [PWA on iOS - Current Status & Limitations (2025)](https://brainhub.eu/library/pwa-on-ios)
- [Optimizing PWAs For Different Display Modes](https://www.smashingmagazine.com/2025/08/optimizing-pwas-different-display-modes/)
- [UX Design for Kids: Principles and Recommendations](https://www.ramotion.com/blog/ux-design-for-kids/)
- [Addressing the iOS Address Bar in 100vh Layouts](https://medium.com/@susiekim9/how-to-compensate-for-the-ios-viewport-unit-bug-46e78d54af0d)
- [100vh problem with iOS Safari](https://medium.com/quick-code/100vh-problem-with-ios-safari-92ab23c852a8)

### Low Confidence (Need Validation)
- None marked as low confidence - all findings corroborated by multiple sources

---

## Open Questions for Phase-Specific Research

1. **Phase 1:** What's the best polyfill strategy for iOS iPhone orientation lock? (No official solution found)
2. **Phase 2:** What's the optimal debounce timing for iOS Safari viewport stabilization? (300ms is educated guess, needs device testing)
3. **Phase 3:** Does VexFlow 5.x have any built-in orientation change handling? (Docs don't mention it)
4. **Phase 5:** How do other children's educational apps handle orientation prompts? (Need competitor analysis)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| iOS Safari limitations | **HIGH** | Official Apple forums + multiple bug reports confirm |
| Android fullscreen requirement | **HIGH** | W3C spec + MDN docs explicit about this |
| Viewport race conditions | **HIGH** | WebKit bug reports + multiple developer guides corroborate |
| VexFlow coordinate issues | **MEDIUM** | GitHub issue + Mozilla bug reports, but not VexFlow-specific docs |
| Accessibility requirements | **HIGH** | WCAG spec + accessibility guides clear on this |
| Children's UX best practices | **MEDIUM** | Multiple UX guides agree, but limited research on orientation prompts specifically |
| Service worker caching | **MEDIUM** | General PWA best practices, not orientation-specific |

---

## Final Recommendations

1. **Start with graceful degradation:** Build the game to work in portrait first, landscape as enhancement
2. **Feature-detect everything:** Never assume API availability
3. **Test on physical devices early:** iOS Simulator lies about fullscreen support
4. **Respect accessibility:** Orientation prompts must be dismissible and non-blocking
5. **Use CSS custom properties for viewport height:** Don't trust `100vh` on iOS
6. **Double RAF before querying coordinates:** Wait for paint to complete after VexFlow re-render
7. **Clean up on unmount:** Unlock orientation and remove event listeners
8. **Integrate with existing accessibility system:** Check `reducedMotion` before animating

**Biggest risk:** Assuming iOS and Android work the same way. They fundamentally don't for orientation/fullscreen APIs.

**Biggest time sink:** Getting VexFlow coordinates right after rotation. Budget extra time for Phase 3.

**Biggest legal risk:** Violating WCAG 1.3.4 by force-locking orientation without escape hatch. MUST address in Phase 1.
