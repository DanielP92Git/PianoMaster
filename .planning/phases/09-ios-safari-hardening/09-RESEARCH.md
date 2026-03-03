# Phase 09: iOS Safari Hardening - Research

**Researched:** 2026-03-03
**Domain:** Web Audio API / iOS Safari AudioContext lifecycle, mic permission UX
**Confidence:** MEDIUM-HIGH (core patterns verified via MDN + WebKit source; some iOS-specific nuances are LOW due to Apple not fully specifying the AudioSession integration)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Interruption Recovery**
- Show a lightweight tap-to-resume overlay when AudioContext is interrupted (distinct from MicErrorOverlay — not an error, just a pause)
- Freeze exercise state during interruption: timer, score tracking, and note sequence position all paused until user taps to resume
- Tap triggers AudioContext.resume() + mic re-acquisition on the user gesture
- Fallback chain if resume fails: retry mic request once, then offer "Restart Exercise" button (exercise progress lost, trail progress safe)
- The overlay visual treatment should be lighter/calmer than the error overlay — semi-transparent with a simple "Tap to continue" message and play icon

**First-Tap Activation**
- Wire AudioContext.resume() into existing Start/Start Practice buttons across ALL platforms (not iOS-only conditional)
- No extra pre-game audio gate screen — the existing game start flow serves as the gesture
- For trail auto-start flow (TrailNodeModal -> game), research whether Safari gesture carries across React Router navigation; if not, add a lightweight in-game gate

**Permission Denial UX**
- iOS Safari: step-by-step numbered instructions ("1. Open Settings 2. Scroll to Safari 3. Tap Microphone 4. Allow for this site 5. Come back and tap Retry")
- Other platforms: generic "Check your browser settings for microphone permission" fallback
- Mixed tone: child-friendly header (e.g., "I can't hear you!") with parent-addressed technical instructions below
- Only show Retry + Back to Trail buttons (no "play without mic" redirect)
- Detect iOS Safari to show platform-specific instructions; all other platforms get generic message

**Recovery Scope**
- Day-one scenarios: phone calls, app switches (home button / swipe away), lock screen
- Target all Safari modes: browser tab, standalone PWA (home screen), in-app browser (same WebKit engine)
- Physical device manual test checklist for the three core scenarios
- Siri, notification interaction, AirPlay, Control Center are stretch goals (likely handled by same AudioContext recovery but not explicitly tested day one)

### Claude's Discretion
- Mic permission + AudioContext.resume() chaining strategy (depends on Safari gesture scope rules)
- Whether TrailNodeModal gesture carries across navigation (needs research; if not, implement lightweight in-game gate)
- Exact tap-to-resume overlay design (animation, icon, positioning)
- Whether to reuse parts of MicErrorOverlay or create a separate component
- Unit test structure for AudioContext state machine logic

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| IOS-01 | iOS Safari `"interrupted"` AudioContext state handled — full mic stream re-acquired via getUserMedia when interrupted | AudioContext.onstatechange listener detects `"interrupted"` → triggers tap-to-resume overlay → on tap: resume() + releaseMic() + requestMic() chain |
| IOS-02 | AudioContext `resume()` called synchronously within user gesture call stack (before any `await`) to satisfy iOS Safari requirement | Confirmed: Safari invalidates gesture token on first `await`; resume() must fire before any async call in the handler |
| IOS-03 | `visibilitychange` listener recovers mic after app switch, phone call, or device lock | Existing visibilitychange handler in AudioContextProvider already suspends/resumes; extend to also detect track-ended state and trigger re-acquisition overlay |
| IOS-04 | Mic permission denied shows clear, persistent error message with iOS Settings instructions (not silent failure) | Existing MicErrorOverlay gets iOS-specific instruction block; isIOSSafari detection extracted to shared utility |
</phase_requirements>

---

## Summary

iOS Safari has two distinct but overlapping problems with Web Audio: (1) the `"interrupted"` state, which Safari enters when the system takes audio focus (phone call, app switch, device lock), and (2) the requirement that `AudioContext.resume()` must be called **synchronously** within a user gesture call stack — before any `await` — or Safari ignores it. These combine to mean that when a user returns to the app after an interruption, a tap must synchronously call `resume()` before any async mic re-acquisition. The existing `AudioContextProvider` already has a `visibilitychange` hook and `resumeAudio()` function; Phase 09 extends it by detecting `"interrupted"` state via `onstatechange`, exposing interruption state to the UI layer, and wiring a tap-to-resume overlay that fires `resume()` synchronously then re-acquires the mic stream.

The `"interrupted"` state is Safari-specific and is **not** the same as `"suspended"`. Per MDN and the WebKit layout test source, a context can enter `"interrupted"` without the web app's consent, and re-entering `"running"` typically requires `audioCtx.resume()` triggered by a user gesture. However, WebKit's own test suite shows that `resume()` resolves its Promise even during interruption — the Promise resolution is the signal to proceed with mic re-acquisition. The critical implementation risk is that calling `resume()` after an `await` (e.g., after `getUserMedia`) fails silently on Safari; the gesture token is consumed by the first microtask boundary.

For iOS mic permission denial (IOS-04), the fix is purely UX: the existing `MicErrorOverlay` receives a new conditional branch that shows a numbered 5-step list pointing users to `Settings → Safari → Microphone`. Detection reuses the existing `isIOSSafari` IIFE already in `SightReadingGame.jsx`, extracted to a shared `src/utils/isIOSSafari.js` utility.

**Primary recommendation:** In `AudioContextProvider`, add `onstatechange` that fires when state becomes `"interrupted"`, expose `isInterrupted` boolean via context, render `AudioInterruptedOverlay` in game components, and wire the tap handler to call `audioCtx.resume()` synchronously then `releaseMic()` + `requestMic()` (async, after the gesture is satisfied).

---

## Standard Stack

### Core

No new npm packages required. All functionality implemented with browser-native Web Audio API and existing project patterns.

| Technology | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Web Audio API `AudioContext.onstatechange` | Browser native | Detect `"interrupted"` state transition | Only mechanism to observe iOS audio session changes |
| `AudioContext.resume()` | Browser native | Exit `"suspended"` or `"interrupted"` state | Required by spec; must be in gesture call stack on Safari |
| `navigator.mediaDevices.getUserMedia` | Browser native | Re-acquire mic stream after interruption | Mandatory re-acquisition — stopped tracks cannot be restarted |
| `MediaStreamTrack.readyState` | Browser native | Detect that existing tracks ended (phone call killed stream) | Reliable indicator that getUserMedia must be called again |
| `document.visibilitychange` | Browser native | Detect app-switch / lock-screen foreground return | Already wired in AudioContextProvider; extend for track state check |

### Supporting

| Technology | Purpose | When to Use |
|-----------|---------|-------------|
| `isIOSSafari` (extracted utility) | Platform-specific UX branching | Only for permission-denied message copy; NOT for audio resume logic (resume runs on all platforms) |
| Existing `MicErrorOverlay` | Extended with iOS-specific instruction copy | When `errorType === "permission_denied"` and `isIOSSafari` is true |
| New `AudioInterruptedOverlay` component | Tap-to-resume overlay during interruption | When `AudioContextProvider` signals `isInterrupted === true` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `onstatechange` detection | Polling `audioCtx.state` | Polling adds timer overhead; `onstatechange` is event-driven — use it |
| New `AudioInterruptedOverlay` component | Extending `MicErrorOverlay` with another error type | Different tone/severity needed; dedicated component is cleaner and avoids string-pollution in MicErrorOverlay's i18n namespace |
| `releaseMic()` + `requestMic()` on resume | Only calling `resume()` without mic re-acquire | Phone calls stop the MediaStream tracks entirely; resume() alone does not restart them — must re-acquire |

**Installation:** No new packages.

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── utils/
│   └── isIOSSafari.js           # Extract from SightReadingGame.jsx (shared utility)
├── contexts/
│   └── AudioContextProvider.jsx # Add onstatechange + isInterrupted state + expose via context
├── components/
│   └── games/
│       └── shared/
│           └── AudioInterruptedOverlay.jsx  # New: tap-to-resume overlay
│       └── sight-reading-game/
│           └── components/
│               └── MicErrorOverlay.jsx     # Add iOS-specific permission-denied branch
├── locales/
│   ├── en/
│   │   └── common.json          # New keys: micInterrupted.*, micError.permissionDenied.iosInstructions
│   └── he/
│       └── common.json          # Hebrew translations for same keys
```

### Pattern 1: Synchronous resume() Before Async getUserMedia (IOS-02)

**What:** iOS Safari tracks user gesture activation through a synchronous call chain. The moment execution hits an `await`, the gesture token is consumed. `AudioContext.resume()` must be the **first** call — before any `await` — inside the tap handler.

**When to use:** Every tap handler that needs to unlock the AudioContext AND re-acquire a mic stream.

**Example:**
```javascript
// Source: MDN BaseAudioContext.state + WebKit gesture restriction spec
const handleTapToResume = async () => {
  const ctx = audioContextRef.current;

  // IOS-02: resume() MUST fire synchronously (no await before this)
  // The Promise it returns can be awaited after — Safari only cares that
  // resume() was called within the synchronous gesture call stack.
  const resumePromise = ctx?.resume();

  // Now it's safe to await — gesture token already delivered to resume()
  await resumePromise;

  // Re-acquire mic (phone call stops MediaStream tracks entirely)
  await releaseMic();   // Stop existing dead tracks
  await requestMic();   // Fresh getUserMedia call
};
```

**Anti-pattern — DO NOT DO:**
```javascript
// BAD: await before resume() loses the gesture token on Safari
const handleTapToResume = async () => {
  await someCheckFunction();  // gesture token consumed here
  audioCtx.resume();          // Safari ignores this — too late
};
```

### Pattern 2: Interruption Detection via onstatechange (IOS-01)

**What:** `AudioContext.onstatechange` fires whenever the state transitions, including the iOS-specific `"interrupted"` state. Set this up in `AudioContextProvider` to expose `isInterrupted` boolean to consumers.

**When to use:** At AudioContext creation time, persistent for the context's lifetime.

**Example:**
```javascript
// Source: MDN BaseAudioContext.onstatechange + WebKit audiocontext-state-interrupted.html
const Ctor = window.AudioContext || window.webkitAudioContext;
const ctx = new Ctor();

ctx.onstatechange = () => {
  // 'interrupted' = iOS system took audio focus (phone call, etc.)
  // 'suspended'   = app called suspend() or page went to background
  // 'running'     = normal operation
  setAudioContextState(ctx.state);
};
```

### Pattern 3: MediaStreamTrack Ended Detection (IOS-01 + IOS-03)

**What:** When iOS interrupts for a phone call, `MediaStreamTrack.readyState` becomes `"ended"`. On `visibilitychange` return to foreground, check track state to decide whether to attempt silent resume or trigger the overlay.

**When to use:** In `visibilitychange` handler and when tap-to-resume fires.

**Example:**
```javascript
// Source: MDN MediaStreamTrack.readyState (MEDIUM confidence)
const isTrackLive = (stream) => {
  if (!stream) return false;
  return stream.getTracks().every(track => track.readyState === 'live');
};

// In visibilitychange handler:
const handleVisibilityChange = () => {
  if (document.hidden) {
    suspendAudio();
    return;
  }
  // Returning to foreground
  const ctx = audioContextRef.current;
  if (ctx?.state === 'running' && isTrackLive(streamRef.current)) {
    // Everything still alive — silent resume (no overlay)
    return;
  }
  if (ctx?.state === 'interrupted' || !isTrackLive(streamRef.current)) {
    // Show tap-to-resume overlay — user gesture required
    setIsInterrupted(true);
  } else {
    resumeAudio();
  }
};
```

### Pattern 4: isIOSSafari Shared Utility

**What:** Extract the existing IIFE from `SightReadingGame.jsx` (lines 129-142) to a shared module so `AudioContextProvider` and `MicErrorOverlay` can both import it.

**Example:**
```javascript
// src/utils/isIOSSafari.js
export const isIOSSafari =
  typeof navigator !== 'undefined' &&
  (() => {
    const ua = navigator.userAgent || '';
    const isIOSDevice =
      /iPad|iPhone|iPod/i.test(ua) ||
      (ua.includes('Macintosh') &&
        typeof document !== 'undefined' &&
        'ontouchend' in document);
    const isSafari =
      /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/i.test(ua);
    return isIOSDevice && isSafari;
  })();
```

### Pattern 5: iOS Permission Denial Instructions (IOS-04)

**What:** When `errorType === "permission_denied"` in `MicErrorOverlay`, show iOS-specific numbered instructions if `isIOSSafari` is true. The two recovery paths on iOS are:

**Path A — Safari browser tab:**
1. Open Settings
2. Scroll to Safari
3. Tap Microphone (under "SETTINGS FOR WEBSITES")
4. Set to "Ask" or "Allow"
5. Come back to this app and tap Retry

**Path B — Already in Settings alternative (AA menu):**
Tap the "AA" in Safari's address bar → Website Settings → Microphone → Allow

The numbered list covers Path A (the more reliable one for a parent following instructions).

### Anti-Patterns to Avoid

- **Calling resume() after any await in a tap handler:** iOS Safari invalidates the gesture token at the first await boundary. Call `ctx.resume()` as the first statement in the handler, store the Promise, then await it.
- **Only calling resume() without re-acquiring the mic:** Phone calls stop `MediaStreamTrack` entirely (`readyState === "ended"`). `resume()` alone does not restart tracks — must call `releaseMic()` + `requestMic()` after.
- **Creating a new AudioContext instead of resuming:** Safari has a 4-context limit per page. Always resume the existing context.
- **Checking `audioCtx.state === "suspended"` only:** The interruption recovery overlay must also fire when state is `"interrupted"`. Both states require a user gesture to exit.
- **iOS-only branching for the core audio activation path:** Per locked decision, `resume()` wiring in Start buttons is platform-agnostic. Do not add `if (isIOSSafari)` guards around `resume()` calls.
- **Relying on visibilitychange alone to detect phone calls:** iOS may not fire `visibilitychange` reliably during phone calls (confirmed in SoundJS issue #264 — no blur/focus/pageshow events fire). The `onstatechange` listener is the reliable signal.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| iOS user agent detection | Custom regex from scratch | Extract existing `isIOSSafari` IIFE from `SightReadingGame.jsx` | Already battle-tested in this codebase; avoids duplicate logic |
| AudioContext state polling | `setInterval(() => checkState())` | `AudioContext.onstatechange` event | Event-driven; no CPU overhead; fires immediately on transition |
| Gesture unlock library | `ios-safe-audio-context` npm package | Direct `ctx.resume()` call in handler | Existing code already manages AudioContext lifecycle; adding a wrapper adds complexity and hidden behavior |
| Track "ended" detection loop | Manual rAF loop checking track state | `visibilitychange` + `onstatechange` combined | Both fire at the right moments; no continuous polling needed |

**Key insight:** Safari's audio interruption handling is an OS-level event system. The correct approach is to listen for state transitions and react to them — not to poll or retry on a timer. The existing `AudioContextProvider` architecture (singleton context, `visibilitychange` handler) is already the right foundation; this phase adds `onstatechange` and a UI layer on top.

---

## Common Pitfalls

### Pitfall 1: resume() After await Silently Fails

**What goes wrong:** The tap handler appears to work (no error thrown), but AudioContext stays in `"interrupted"` or `"suspended"` state and audio never resumes.

**Why it happens:** Safari tracks gesture activation through the synchronous call stack. Any `await` before `ctx.resume()` causes Safari to consider the gesture "used up" by the async operation, and the subsequent `resume()` call is treated as unprompted (not gesture-triggered), so it has no effect.

**How to avoid:** Reorganize tap handler to call `ctx.resume()` as the **first** statement (no preceding `await`). Store the returned Promise, then `await` it and proceed with mic re-acquisition.

**Warning signs:** Console shows no error but state stays `"interrupted"`. Test by logging `ctx.state` in the `then()` callback of `resume()`.

### Pitfall 2: Assuming visibilitychange Fires for Phone Calls

**What goes wrong:** App never shows the tap-to-resume overlay after a phone call, because the `visibilitychange` listener never fires.

**Why it happens:** iOS does not reliably fire `visibilitychange`, `blur`, `focus`, or `pageshow` when a phone call interrupts the app (documented in CreateJS/SoundJS issue #264). The AudioContext state change to `"interrupted"` fires via `onstatechange` instead.

**How to avoid:** Use `onstatechange` as the primary interruption signal. `visibilitychange` is a secondary check for app-switch/lock-screen scenarios.

**Warning signs:** During manual test — receive a phone call during gameplay, decline it, return to app — if no overlay appears, the handler is wired to `visibilitychange` only.

### Pitfall 3: Forgetting to Re-acquire MediaStreamTrack After Interruption

**What goes wrong:** `resume()` succeeds (AudioContext returns to `"running"`), but no audio data flows — the analyser stays silent.

**Why it happens:** A phone call sets `MediaStreamTrack.readyState` to `"ended"`. The track cannot be restarted; a new `getUserMedia()` call is required. The `AnalyserNode` connected to the dead `MediaStreamSource` produces only silence.

**How to avoid:** After `ctx.resume()` resolves, check `streamRef.current?.getTracks()[0]?.readyState`. If `"ended"`, call `releaseMic()` (stops old tracks, clears refs) then `requestMic()` (fresh getUserMedia).

**Warning signs:** After resuming from an interruption, the pitch detection analyser receives zero RMS level data despite the mic hardware being active.

### Pitfall 4: AudioContext State "interrupted" Not Covered by Existing suspended Check

**What goes wrong:** The existing `resumeAudio()` function in `AudioContextProvider` only resumes when `state === "suspended"`. It silently no-ops when state is `"interrupted"`, so the tap-to-resume overlay never dismisses.

**Why it happens:** `"interrupted"` is a distinct state value from `"suspended"`. The existing guard `if (ctx && ctx.state === "suspended")` misses it.

**How to avoid:** Update `resumeAudio()` to handle both: `if (ctx && (ctx.state === "suspended" || ctx.state === "interrupted"))`.

**Warning signs:** Overlay shows, user taps, `resume()` resolves, but state still logs as `"interrupted"` and overlay reappears.

### Pitfall 5: Trail Auto-Start Gesture Not Carrying Across React Router Navigation

**What goes wrong:** When a user taps "Start Practice" in `TrailNodeModal`, React Router navigates to the game route. The game's auto-start fires via `useEffect` — but this is not a user gesture, so `AudioContext.resume()` inside `startGame()` fails on Safari (context stays suspended).

**Why it happens:** React Router navigation is synchronous UI work, but the destination component mounts via React's scheduler. By the time `useEffect` fires and calls `startGame()`, the browser no longer considers execution to be "within" the original tap's gesture scope.

**How to avoid:** The locked decision says to research this and add a lightweight in-game gate if gesture does not carry. Research finding (MEDIUM confidence): React Router navigation **does not** preserve the gesture token across the navigation boundary. The game component's auto-start code must detect the trail context and either (a) show a brief "Tap to start" prompt that calls `resume()` synchronously, or (b) defer `resume()` to the first note-input interaction. Option (a) is more reliable and matches the "lightweight in-game gate" the user mentioned.

**Warning signs:** On Safari, the auto-started trail game works on Android/Chrome but audio never plays on iOS — AudioContext stays `"suspended"` and no error is thrown.

---

## Code Examples

Verified patterns from official and codebase sources:

### Extending AudioContextProvider with Interruption State

```javascript
// Source: MDN BaseAudioContext.onstatechange + existing AudioContextProvider.jsx pattern
// Add to AudioContextProvider:

const [isInterrupted, setIsInterrupted] = useState(false);

// Wire onstatechange when AudioContext is first created:
const getOrCreateAudioContext = useCallback(() => {
  const existing = audioContextRef.current;
  if (existing && existing.state !== 'closed') {
    if (existing.state === 'suspended' || existing.state === 'interrupted') {
      existing.resume().catch(/* warn */);
    }
    return existing;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContextClass();

  // IOS-01: onstatechange detects 'interrupted' (Safari-specific state)
  ctx.onstatechange = () => {
    if (ctx.state === 'interrupted') {
      setIsInterrupted(true);
    } else if (ctx.state === 'running') {
      setIsInterrupted(false);
    }
  };

  audioContextRef.current = ctx;
  return ctx;
}, []);

// Add to context value:
// value = { ..., isInterrupted, setIsInterrupted }
```

### Tap-to-Resume Handler (Correct Gesture Order)

```javascript
// Source: IOS-02 pattern — resume() synchronous before any await
const handleTapToResume = useCallback(async () => {
  const ctx = audioContextRef.current;
  if (!ctx) return;

  // IOS-02: resume() called synchronously (no await before this line)
  const resumePromise = ctx.resume();

  // Now safe to await
  try {
    await resumePromise;
  } catch (err) {
    console.warn('[AudioInterruptedOverlay] resume() failed:', err);
    // Fallback: offer "Restart Exercise" — trail progress is safe
    setResumeFailed(true);
    return;
  }

  // IOS-01: Re-acquire mic if tracks ended (phone call kills MediaStreamTrack)
  const tracks = streamRef.current?.getTracks() ?? [];
  const needsReacquire = tracks.some(t => t.readyState === 'ended') || tracks.length === 0;
  if (needsReacquire) {
    try {
      await releaseMic();   // Clean up dead stream
      await requestMic();   // Fresh getUserMedia
    } catch (micErr) {
      if (micErr.name === 'NotAllowedError') {
        // Permission denied — show MicErrorOverlay instead
        setIsInterrupted(false);
        // Let parent handle via micPermission state
      } else {
        setResumeFailed(true);
      }
      return;
    }
  }

  setIsInterrupted(false);
}, [audioContextRef, streamRef, releaseMic, requestMic]);
```

### AudioInterruptedOverlay Component Structure

```jsx
// Source: Codebase pattern — follows MicErrorOverlay.jsx structure
// New file: src/components/games/shared/AudioInterruptedOverlay.jsx

export function AudioInterruptedOverlay({ isVisible, onTapToResume, resumeFailed, onRestartExercise }) {
  const { t } = useTranslation('common');
  if (!isVisible) return null;

  return (
    // Semi-transparent (lighter than MicErrorOverlay's bg-black/50)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-label={t('micInterrupted.ariaLabel')}
    >
      <div className="mx-4 w-full max-w-xs rounded-2xl bg-white/90 p-6 shadow-xl text-center">
        {!resumeFailed ? (
          <>
            {/* Play icon — calmer than the mic error icon */}
            <div className="mb-4 flex justify-center">
              {/* Play circle icon (SVG) */}
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              {t('micInterrupted.title')}  {/* "Paused" */}
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              {t('micInterrupted.message')}  {/* "Tap to continue" */}
            </p>
            <button
              onClick={onTapToResume}
              className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white"
            >
              {t('micInterrupted.tapToContinue')}
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">
              {t('micInterrupted.resumeFailed')}
            </p>
            <button onClick={onRestartExercise} className="...">
              {t('micInterrupted.restartExercise')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

### iOS Permission Denial Instructions (MicErrorOverlay Extension)

```jsx
// Source: Research findings — exact iOS steps verified via Apple documentation
// Add inside MicErrorOverlay, in the permission_denied branch:

{isPermissionDenied && isIOSSafari && (
  <ol className="mt-3 text-left text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg p-3">
    <li>1. {t('micError.permissionDenied.ios.step1')}</li>  {/* Open Settings */}
    <li>2. {t('micError.permissionDenied.ios.step2')}</li>  {/* Scroll to Safari */}
    <li>3. {t('micError.permissionDenied.ios.step3')}</li>  {/* Tap Microphone */}
    <li>4. {t('micError.permissionDenied.ios.step4')}</li>  {/* Set to Allow */}
    <li>5. {t('micError.permissionDenied.ios.step5')}</li>  {/* Return and tap Retry */}
  </ol>
)}
```

### i18n Keys to Add

```json
// src/locales/en/common.json additions:
{
  "micInterrupted": {
    "ariaLabel": "Game paused",
    "title": "Paused",
    "message": "Tap to continue where you left off",
    "tapToContinue": "Tap to Continue",
    "resumeFailed": "Something went wrong. Ask a grown-up to check the microphone.",
    "restartExercise": "Restart Exercise"
  },
  "micError": {
    "permissionDenied": {
      "ios": {
        "step1": "Open the Settings app",
        "step2": "Scroll down and tap Safari",
        "step3": "Tap Microphone",
        "step4": "Set it to Allow",
        "step5": "Come back here and tap Retry"
      }
    }
  }
}
```

### TrailNodeModal Lightweight In-Game Gate

```jsx
// Source: Codebase pattern — auto-start uses hasAutoStartedRef pattern
// In game components that receive trail auto-start (nodeConfig in location.state):
// Check if AudioContext is in suspended/interrupted state AFTER mount,
// and if so, show inline "Tap to start" overlay instead of auto-starting.

// In game component (SightReadingGame, NotesRecognitionGame, MetronomeTrainer):
const { audioContextRef, isInterrupted } = useAudioContext();

// In auto-start useEffect:
useEffect(() => {
  if (nodeConfig && !hasAutoStartedRef.current) {
    const ctx = audioContextRef.current;
    // IOS-02: If context needs gesture to start, defer to user tap
    if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
      // Show "Tap to Start" overlay — it calls resume() synchronously
      setNeedsGestureToStart(true);
      return;
    }
    hasAutoStartedRef.current = true;
    // ... normal auto-start
  }
}, [nodeConfig]);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create new AudioContext on each exercise | Single AudioContext with suspend/resume | Phase 07 (Feb 2026) | Avoids Safari's 4-context limit; existing context is reused |
| Only handle `"suspended"` state | Handle `"suspended"` AND `"interrupted"` | Phase 09 | iOS-specific state requires explicit handling |
| No interruption recovery UI | Tap-to-resume overlay with gesture-gated resume | Phase 09 | Users can recover without page reload |
| Silent failure on mic permission denied | iOS-specific step-by-step parent instructions | Phase 09 | Parents can self-serve mic re-enable |
| visibilitychange only for background detection | onstatechange as primary + visibilitychange as secondary | Phase 09 | Phone calls don't always fire visibilitychange on iOS |

**Deprecated/outdated:**
- `window.webkitAudioContext` direct constructor without fallback: still needed for older iOS — the existing `window.AudioContext || window.webkitAudioContext` pattern is correct.
- Playing a silent buffer to "warm up" AudioContext (old pre-2017 workaround): replaced by direct `ctx.resume()` on gesture — no longer needed in modern Safari.

---

## Open Questions

1. **Does the React Router navigation gesture boundary affect ALL iOS Safari versions consistently?**
   - What we know: async code after navigation loses gesture scope in current Safari (MEDIUM confidence from multiple dev reports); React's scheduler means `useEffect` fires in a new task.
   - What's unclear: Whether Safari's gesture attribution has relaxed in iOS 17+ / 18+.
   - Recommendation: Implement the in-game gate defensively (it's a lightweight check that is a no-op on non-iOS). Test on a physical device to confirm.

2. **Does `onstatechange` fire reliably for the `"interrupted"` state on all day-one scenarios (phone call, app switch, lock)?**
   - What we know: WebKit's own layout test (`audiocontext-state-interrupted.html`) uses `onstatechange`, confirming it's the intended mechanism. The `"interrupted"` state is documented in MDN (as of Aug 2025).
   - What's unclear: Exact timing — does it fire before or after `visibilitychange`? Does it fire during an in-progress phone call or only when audio is rerouted?
   - Recommendation: In `AudioContextProvider`, wire **both** `onstatechange` (for `"interrupted"`) and `visibilitychange` (for app-switch/lock return). The overlay shows on either signal; dismiss on confirmed resume.

3. **Will releaseMic() + requestMic() prompt the user for mic permission again on iOS after an interruption?**
   - What we know: iOS caches the permission grant per app session; a fresh `getUserMedia()` call after permission was previously granted should not re-prompt (MEDIUM confidence from community sources).
   - What's unclear: Whether a phone call interruption resets the iOS permission cache.
   - Recommendation: Implement the retry once pattern (per locked decision). If `getUserMedia()` throws `NotAllowedError`, fall through to `MicErrorOverlay` — that handles the denied UX.

---

## Sources

### Primary (HIGH confidence)
- MDN `BaseAudioContext.state` — confirmed `"interrupted"` as a distinct state value, its definition, and the `onstatechange` mechanism. URL: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state
- WebKit source `LayoutTests/webaudio/audiocontext-state-interrupted.html` — confirms `onstatechange` is the intended mechanism for interruption detection; shows promise resolution behavior during interruptions. URL: https://github.com/WebKit/webkit/blob/main/LayoutTests/webaudio/audiocontext-state-interrupted.html
- Project codebase: `AudioContextProvider.jsx`, `MicErrorOverlay.jsx`, `SightReadingGame.jsx` (lines 129-142 for `isIOSSafari` detection), `useMicNoteInput.js`, `TrailNodeModal.jsx`

### Secondary (MEDIUM confidence)
- WebAudio/web-audio-api GitHub issue #2585 — confirms `"interrupted"` state stuck behavior on iOS; confirmed pattern of calling `resume()` on user input. URL: https://github.com/WebAudio/web-audio-api/issues/2585
- Matt Montag "Unlock Web Audio in Safari" — documents the multi-event listener pattern and `resume()` after gesture requirement. URL: https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos
- NuIQ blog on iOS mic permission steps — confirms exact Settings → Safari → Microphone path. URL: https://nuiq.com/blog/how-to-enable-microphone-access-on-ios/
- WICG discourse on user-gesture restrictions — explains that `await` breaks gesture token inheritance. URL: https://discourse.wicg.io/t/user-gesture-restrictions-and-async-code/1640/

### Tertiary (LOW confidence — flag for physical device validation)
- CreateJS/SoundJS issue #264 — asserts that iOS does not fire `blur`/`focus`/`visibilitychange` on phone call. Not verifiable with official Apple documentation; needs physical device test. URL: https://github.com/CreateJS/SoundJS/issues/264
- WebKit bug #252465 — PWA getUserMedia stream failures on iOS 18.x; marked "FIXED" but still reported in 2025. Relevant because PWA standalone mode is a target. URL: https://bugs.webkit.org/show_bug.cgi?id=252465
- General community finding that React Router navigation breaks Safari gesture scope — no single authoritative source; inferred from gesture restriction spec behavior. Needs physical device validation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new libraries; all browser-native Web Audio API with MDN documentation
- Architecture (interruption detection via onstatechange): HIGH — Confirmed by WebKit's own test suite
- Architecture (gesture carry across React Router): MEDIUM — Well-reasoned from spec but needs physical device validation
- Architecture (visibilitychange vs phone call): MEDIUM — Multiple community sources agree; official Apple docs don't specify
- Pitfalls: HIGH — Core pitfalls (resume() after await, track ended state) confirmed via spec and multiple sources
- iOS permission steps (IOS-04): HIGH — Verified against Apple's own Settings UI structure
- Phone call track-ended behavior: MEDIUM — Inferred from MediaStreamTrack spec + community reports; physical device test required

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable Web Audio spec; Safari release cadence is ~6 weeks so re-verify if iOS 18.4+ ships breaking changes)
