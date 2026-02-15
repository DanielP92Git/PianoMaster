---
phase: 04-platform-specific-android-enhancement
plan: 01
subsystem: hooks/orientation
tags: [android, pwa, landscape-lock, orientation-api, fullscreen]
dependency-graph:
  requires: [pwaDetection, useOrientation]
  provides: [useLandscapeLock, Android PWA landscape lock]
  affects: [useRotatePrompt, game components]
tech-stack:
  added: []
  patterns: [Screen Orientation API, Fullscreen API, platform detection guards]
key-files:
  created: [src/hooks/useLandscapeLock.js]
  modified: [src/hooks/useRotatePrompt.js]
decisions:
  - "Fullscreen entered before orientation lock (Android API requirement)"
  - "fullscreenchange listener handles Escape key edge case (auto-unlocks orientation)"
  - "Platform guard: Android PWA only (iOS/desktop/browser get no-op)"
  - "API support guard: checks for requestFullscreen and screen.orientation.lock"
  - "Empty dependency array for run-once-on-mount effect hook"
  - "useState function initializer for isAndroidPWA (synchronous detection, same pattern as permanentlyDismissed)"
metrics:
  duration: 112
  tasks-completed: 2
  commits: 2
  files-created: 1
  files-modified: 1
  completed: 2026-02-15
---

# Phase 04 Plan 01: Android PWA Landscape Lock Hooks Summary

Android PWA users get API-based landscape lock (fullscreen + orientation lock) instead of CSS-based rotate prompt.

## Objective

Create the `useLandscapeLock` hook for Android PWA orientation locking and update `useRotatePrompt` to suppress the rotate prompt when landscape lock is available.

## What Was Built

### 1. useLandscapeLock Hook (`src/hooks/useLandscapeLock.js`)

New hook that provides API-based landscape orientation locking for Android PWA users.

**Key features:**
- **Platform guard**: Only runs on Android PWA (checks `isAndroidDevice()` AND `isInStandaloneMode()`)
- **API support guard**: Verifies `document.documentElement.requestFullscreen` and `screen.orientation.lock` exist
- **Lock sequence**: Enters fullscreen BEFORE locking orientation (Android API requirement)
- **Escape key handling**: `fullscreenchange` event listener unlocks orientation when user exits fullscreen manually
- **Cleanup**: Removes listener, unlocks orientation, exits fullscreen on unmount
- **Fire-and-forget**: Empty dependency array `[]` for run-once-on-mount behavior

**Lock sequence:**
1. `requestFullscreen({ navigationUI: "hide" })` - enter fullscreen
2. Set `didEnterFullscreen` flag to true
3. `screen.orientation.lock("landscape")` - lock orientation
4. Wrapped in try/catch with error logging

**Edge case handling:**
- User exits fullscreen via Escape key → `fullscreenchange` fires → orientation unlocked automatically
- Component unmounts → listener removed, orientation unlocked, fullscreen exited (if still active)

### 2. useRotatePrompt Update (`src/hooks/useRotatePrompt.js`)

Updated to suppress the rotate prompt on Android PWA (where API-based lock is available).

**Changes:**
- Import `isAndroidDevice` and `isInStandaloneMode` from pwaDetection
- Compute `isAndroidPWA` state using function initializer (same pattern as `permanentlyDismissed`)
- Add `!isAndroidPWA` to `shouldShowPrompt` condition (placed first for early short-circuit)

**Result:**
- Android PWA users NEVER see the rotate prompt (they get `useLandscapeLock` instead)
- iOS, desktop, and non-PWA users continue seeing the CSS-based rotate prompt as before

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation

### Platform Detection Pattern

Both hooks use the same platform detection guard pattern:

```javascript
// useLandscapeLock.js
if (!isAndroidDevice() || !isInStandaloneMode()) {
  return; // Early return for iOS/desktop/browser
}

// useRotatePrompt.js
const [isAndroidPWA] = useState(() => isAndroidDevice() && isInStandaloneMode());
```

This ensures:
- Android PWA → API-based landscape lock via `useLandscapeLock`
- iOS/desktop/browser → CSS-based rotate prompt via `useRotatePrompt`
- No double prompting (rotate prompt suppressed when API lock available)

### Fullscreen Prerequisite

The Android Screen Orientation API requires fullscreen mode before orientation can be locked:

```javascript
// Step 1: Enter fullscreen first
await document.documentElement.requestFullscreen({ navigationUI: "hide" });

// Step 2: Lock orientation after fullscreen
await screen.orientation.lock("landscape");
```

This sequence is documented in the plan and enforced by the hook implementation.

### Escape Key Edge Case

Users can exit fullscreen by pressing Escape (browser default behavior). Without handling, the device would stay locked in landscape even after exiting fullscreen.

**Solution:**
```javascript
const handleFullscreenChange = () => {
  if (!document.fullscreenElement && screen.orientation?.unlock) {
    screen.orientation.unlock();
  }
};

document.addEventListener("fullscreenchange", handleFullscreenChange);
```

This ensures orientation unlocks automatically when fullscreen is exited via Escape key.

## Files Modified

### Created
- `src/hooks/useLandscapeLock.js` - Android PWA landscape lock hook (73 lines)

### Modified
- `src/hooks/useRotatePrompt.js` - Suppress prompt on Android PWA (5 lines added)

## Integration Points

These hooks are ready for game component integration in Plan 04-02:
- `useLandscapeLock()` will be called at the top of game components
- `useRotatePrompt()` already integrated in all games (now with Android PWA suppression)

**Game components to integrate in 04-02:**
- SightReadingGame
- NotesRecognitionGame
- MemoryGame
- MatchingGame
- MetronomeTrainer

## Testing

**Test results:** 29 passed, 1 failed (pre-existing)

The single failing test (`SightReadingGame.micRestart.test.jsx`) is a pre-existing Router context issue documented in STATE.md. No new test failures were introduced.

## Success Criteria

- [x] useLandscapeLock hook created with fullscreen + orientation lock sequence for Android PWA
- [x] useRotatePrompt updated to suppress prompt on Android PWA
- [x] No existing tests broken (only pre-existing failure)
- [x] Both hooks ready for game component integration in Plan 04-02

## Self-Check: PASSED

**Created files exist:**
- FOUND: src/hooks/useLandscapeLock.js

**Modified files exist:**
- FOUND: src/hooks/useRotatePrompt.js

**Commits exist:**
- FOUND: 32cc628 (feat(04-01): create useLandscapeLock hook for Android PWA)
- FOUND: f19c498 (feat(04-01): suppress rotate prompt on Android PWA)

**Hook implementation verified:**
- useLandscapeLock imports isAndroidDevice and isInStandaloneMode ✓
- useLandscapeLock exports useLandscapeLock function ✓
- requestFullscreen called BEFORE screen.orientation.lock ✓
- fullscreenchange event listener added ✓
- Cleanup calls unlock() and exitFullscreen() ✓
- Empty dependency array [] present ✓

**useRotatePrompt verified:**
- Import of isAndroidDevice and isInStandaloneMode added ✓
- isAndroidPWA state computed with function initializer ✓
- shouldShowPrompt includes !isAndroidPWA condition ✓
- All other existing logic unchanged ✓

All verification criteria met.

## Next Steps

Plan 04-02 will integrate these hooks into the five game components, completing the Android PWA landscape lock feature.
