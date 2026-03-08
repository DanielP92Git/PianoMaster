---
phase: 09-ios-safari-hardening
verified: 2026-03-03T15:00:00Z
status: gaps_found
score: 12/13 must-haves verified
gaps:
  - truth: "REQUIREMENTS.md tracks IOS-04 as complete (checkbox checked)"
    status: failed
    reason: "IOS-04 implementation exists in MicErrorOverlay.jsx (iOS 5-step instructions + generic hint both verified), but REQUIREMENTS.md still shows '- [ ]' (unchecked) for IOS-04. The tracking table also marks IOS-04 as 'Pending'. This is a documentation gap, not a code gap."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "Line 49 shows '- [ ] **IOS-04**' (unchecked) and table row shows 'Pending' despite full implementation being committed in 338553d"
    missing:
      - "Mark IOS-04 as complete in REQUIREMENTS.md: change '- [ ]' to '- [x]' on line 49"
      - "Update tracking table row for IOS-04 from 'Pending' to 'Complete'"
human_verification:
  - test: "On a physical iOS device (iPhone/iPad), start a mic-enabled game from the trail, receive or simulate a phone call, then return to the app"
    expected: "Tap-to-resume overlay appears; tapping 'Tap to Continue' resumes the game with working mic detection — no page reload required"
    why_human: "The 'interrupted' AudioContext state only occurs on real iOS hardware. Cannot simulate onstatechange with 'interrupted' value in desktop browsers or JSDOM."
  - test: "On a physical iOS device, start a mic-enabled game, switch to another app for 3+ seconds, then return"
    expected: "Tap-to-resume overlay appears; tapping resumes audio correctly. If mic tracks ended, fresh getUserMedia is called silently."
    why_human: "App-switch behavior and track liveness after visibilitychange requires real Safari on a real iOS device."
  - test: "On a physical iOS device, deny mic permission when prompted, then trigger MicErrorOverlay"
    expected: "Numbered 5-step iOS Settings instructions appear (Settings -> Safari -> Microphone -> Allow). On non-iOS, only the generic browser settings hint appears."
    why_human: "isIOSSafari evaluates to false on all desktop browsers, so only the non-iOS path can be tested without a physical device."
  - test: "Start a game via the trail ('Start Practice' in TrailNodeModal) on a physical iOS device"
    expected: "If AudioContext is in 'suspended' or 'interrupted' state, the in-game gesture gate overlay appears instead of silently failing; tapping it starts the game correctly."
    why_human: "React Router navigation gesture boundary behavior requires real Safari on iOS to validate."
---

# Phase 09: iOS Safari Hardening Verification Report

**Phase Goal:** Mic input works reliably in Safari PWA on physical iOS devices — the app recovers from AudioContext interruption caused by phone calls, app switches, and device lock; permission denial shows a clear message with recovery instructions
**Verified:** 2026-03-03T15:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | AudioContextProvider detects 'interrupted' state via onstatechange and exposes isInterrupted boolean | VERIFIED | `onstatechange` wired in mount-time `useEffect` (line 67-78) + in `getOrCreateAudioContext` (line 102-108); `isInterrupted` state exported in context value (line 332) |
| 2 | resumeAudio handles both 'suspended' and 'interrupted' states | VERIFIED | `resumeAudio` guards `ctx.state === "suspended" \|\| ctx.state === "interrupted"` (line 224) |
| 3 | visibilitychange handler checks MediaStreamTrack.readyState and triggers isInterrupted when tracks are ended | VERIFIED | Handler at line 280-307 checks `tracksLive` and calls `setIsInterrupted(true)` when ctx is interrupted or tracks are dead |
| 4 | AudioInterruptedOverlay component renders a tap-to-resume UI that calls resume() synchronously before any await | VERIFIED | Component file exists with `role="dialog"`, `aria-modal`, retry-once fallback, bg-black/30; `handleTapToResume` in provider stores `ctx.resume()` into `resumePromise` before any await (line 248) |
| 5 | isIOSSafari detection is available as a shared utility importable from src/utils/isIOSSafari.js | VERIFIED | File exists, exports `isIOSSafari` boolean with identical IIFE logic to the original SightReadingGame.jsx |
| 6 | i18n keys for interrupted overlay and iOS permission instructions exist in both en and he locales | VERIFIED | `micInterrupted.*` (6 keys), `micError.permissionDenied.ios.*` (5 step keys + title), and `genericHint` all confirmed present in both `en/common.json` and `he/common.json` |
| 7 | Returning to the app after a phone call shows tap-to-resume overlay; tapping resumes mic without page reload | UNCERTAIN | Code path is correct but requires physical iOS device to confirm end-to-end behavior |
| 8 | Switching to another app and back shows tap-to-resume overlay; tapping resumes audio correctly | UNCERTAIN | visibilitychange handler correctly distinguishes live vs dead tracks; physical device needed |
| 9 | Start button calls AudioContext.resume() synchronously on all platforms | VERIFIED | `startListeningSync` in SightReadingGame.jsx (line 913): `audioContextRef.current?.resume()` before `await requestMic()`. `startAudioInput` in NotesRecognitionGame.jsx (line 1748): same pattern. MetronomeTrainer uses AudioEngine (no mic), gesture gate calls `ctx.resume()` synchronously (line 751). |
| 10 | Trail auto-start detects suspended/interrupted AudioContext and shows tap-to-start prompt instead of auto-starting silently | VERIFIED | All 3 game components check `ctx.state === 'suspended' \|\| ctx.state === 'interrupted'` in the auto-start useEffect and call `setNeedsGestureToStart(true)` before returning early |
| 11 | Denying mic permission on iOS Safari shows numbered step-by-step instructions for re-enabling in Settings | VERIFIED (code) / UNCERTAIN (device) | MicErrorOverlay.jsx lines 117-130 render 5-step ordered list when `isPermissionDenied && isIOSSafari`. Physical iOS device needed to confirm `isIOSSafari` evaluates true and renders correctly |
| 12 | Denying mic permission on non-iOS browsers shows a generic hint about browser settings | VERIFIED | MicErrorOverlay.jsx lines 133-137 render `micError.permissionDenied.genericHint` when `isPermissionDenied && !isIOSSafari` |
| 13 | REQUIREMENTS.md tracks IOS-04 as complete | FAILED | REQUIREMENTS.md line 49 shows `- [ ] **IOS-04**` (unchecked checkbox); tracking table shows 'Pending'. The implementation exists in code (338553d) but the requirements document was not updated to reflect completion. |

**Score:** 12/13 truths verified (1 failed — documentation gap only, not code gap)

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/utils/isIOSSafari.js` | Shared iOS Safari UA detection, exports `isIOSSafari` | VERIFIED | 29 lines; exports `isIOSSafari` boolean with full IIFE detection (iPad/iPhone/iPod + Macintosh+touch + Safari-not-Chrome guard) |
| `src/contexts/AudioContextProvider.jsx` | Interruption detection, isInterrupted state, handleTapToResume, streamRef exposure | VERIFIED | 360 lines; all four fields present in context value; `onstatechange` wired on mount AND in `getOrCreateAudioContext` |
| `src/components/games/shared/AudioInterruptedOverlay.jsx` | Tap-to-resume overlay UI for interrupted AudioContext | VERIFIED | 122 lines; two-state UI (tap-to-resume + resume-failed); retry-once; ARIA attributes; bg-black/30 as specified |
| `src/locales/en/common.json` | English i18n keys for micInterrupted and iOS permission steps | VERIFIED | `micInterrupted` (6 keys), `micError.permissionDenied.ios` (6 keys), `genericHint` all present |
| `src/locales/he/common.json` | Hebrew i18n keys for micInterrupted and iOS permission steps | VERIFIED | Same structure with Hebrew translations confirmed at lines 1119-1141 |

### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/games/sight-reading-game/SightReadingGame.jsx` | AudioInterruptedOverlay wired, Start button resume(), trail gesture gate, isIOSSafari replaced with import | VERIFIED | Import on line 48-49; `isInterrupted`+`handleTapToResume` destructured (line 175); `needsGestureToStart` state (line 176); resume() in `startListeningSync` (line 913); timer freeze useEffect (line 3104-3110); gesture gate and overlay rendered (lines 3671-3684) |
| `src/components/games/notes-master-games/NotesRecognitionGame.jsx` | AudioInterruptedOverlay wired, Start button resume(), trail gesture gate | VERIFIED | Import on line 30; all context fields destructured (line 627-628); resume() in `startAudioInput` (line 1748); gesture gate (lines 543-550); overlay rendered (lines 2277-2289); timer pause useEffect (lines 1080-1085) — note: only pauses, does not auto-resume on un-interrupt (user must tap overlay) |
| `src/components/games/rhythm-games/MetronomeTrainer.jsx` | AudioInterruptedOverlay wired, Start button resume(), trail gesture gate | VERIFIED | Import on line 21; fields destructured (line 117-118); gesture gate (lines 197-204); `handleGestureStart` calls resume() synchronously (line 751); overlay rendered (lines 1305-1309); no explicit timer-freeze useEffect — acceptable per plan spec: "AudioContext suspension stops the AudioWorklet clock" so freeze is implicit |
| `src/components/games/sight-reading-game/components/MicErrorOverlay.jsx` | iOS-specific permission denial instructions with numbered steps | VERIFIED | Import of `isIOSSafari` on line 3; iOS steps rendered lines 117-130; generic hint rendered lines 133-137; both branches gated on `isPermissionDenied` |
| `.planning/REQUIREMENTS.md` | IOS-04 marked complete | FAILED | IOS-01, IOS-02, IOS-03 are checked `[x]`; IOS-04 is unchecked `[ ]` despite implementation being committed |

---

## Key Link Verification

### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `AudioContextProvider.jsx` | `AudioContext.onstatechange` | event listener on context creation | WIRED | Mount-time `useEffect` (lines 67-78) wires `onstatechange` on eagerly-created ctx; `getOrCreateAudioContext` wires it on newly created contexts (lines 102-108) |
| `AudioContextProvider.jsx` | `MediaStreamTrack.readyState` | visibilitychange handler checks track liveness | WIRED | `streamRef.current?.getTracks().every(t => t.readyState === "live")` in `handleVisibilityChange` (lines 288-292) |
| `AudioInterruptedOverlay.jsx` | `AudioContextProvider.jsx` | `handleTapToResume` prop from context | WIRED | Overlay receives `onTapToResume` prop; all game components pass `handleTapToResume` from `useAudioContext()` as that prop |

### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SightReadingGame.jsx` | `AudioContextProvider (isInterrupted)` | `useAudioContext()` destructuring | WIRED | `isInterrupted` and `handleTapToResume` destructured line 175; `isVisible={isInterrupted}` at line 3673 |
| `NotesRecognitionGame.jsx` | `AudioContextProvider (isInterrupted)` | `useAudioContext()` destructuring | WIRED | Destructured line 627; `isVisible={isInterrupted}` at line 2278 |
| `MetronomeTrainer.jsx` | `AudioContextProvider (isInterrupted)` | `useAudioContext()` destructuring | WIRED | Destructured line 117; `isVisible={isInterrupted}` at line 1306 |
| `MicErrorOverlay.jsx` | `src/utils/isIOSSafari.js` | `import { isIOSSafari }` | WIRED | Line 3: `import { isIOSSafari } from "../../../../utils/isIOSSafari.js"` |
| `SightReadingGame.jsx (Start button)` | `AudioContext.resume()` | synchronous call in `startListeningSync` | WIRED | Line 913: `audioContextRef.current?.resume()` before `await requestMic()` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| IOS-01 | 09-01, 09-02 | iOS Safari "interrupted" AudioContext state handled — full mic stream re-acquired via getUserMedia when interrupted | SATISFIED | `onstatechange` detects "interrupted" → `isInterrupted` set true → `AudioInterruptedOverlay` rendered → tap calls `handleTapToResume` which calls `resume()` synchronously then re-acquires mic via `releaseMic()` + `requestMic()` if tracks ended |
| IOS-02 | 09-01, 09-02 | AudioContext `resume()` called synchronously within user gesture call stack (before any `await`) | SATISFIED | `handleTapToResume` stores `ctx.resume()` into `resumePromise` before any `await` (AudioContextProvider line 248); `startListeningSync`, `startAudioInput`, and `handleGestureStart` all call `resume()` before any `await` |
| IOS-03 | 09-01, 09-02 | `visibilitychange` listener recovers mic after app switch, phone call, or device lock | SATISFIED | `handleVisibilityChange` distinguishes 3 cases: interrupted/dead tracks → `setIsInterrupted(true)`; running+live → no-op; other → `resumeAudio()` |
| IOS-04 | 09-02 | Mic permission denied shows clear, persistent error message with iOS Settings instructions (not silent failure) | SATISFIED IN CODE / PENDING IN DOCS | `MicErrorOverlay.jsx` implements iOS 5-step instructions (`isPermissionDenied && isIOSSafari`) and generic hint (`isPermissionDenied && !isIOSSafari`). **However, REQUIREMENTS.md still marks IOS-04 as `[ ]` unchecked.** |

**Orphaned requirements:** None. All four IOS-* requirements declared in plan frontmatter are accounted for.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/REQUIREMENTS.md` | 49, 113 | IOS-04 marked `[ ]` (unchecked) + 'Pending' in tracking table despite implementation being complete | Warning | Documentation drift — does not affect runtime behavior but misrepresents project completion state |
| `NotesRecognitionGame.jsx` | 1080-1085 | Timer-freeze useEffect only pauses on `isInterrupted` but does not resume when `isInterrupted` becomes false — user MUST tap the overlay to resume | Info | Per plan intent: "Note: we don't auto-resume since the user must tap the overlay to resume" — this is intentional design, not a stub |

No blocker anti-patterns found. No TODO/FIXME/placeholder patterns in phase artifacts. No empty implementations or console-log-only stubs.

---

## Human Verification Required

### 1. Phone Call Interruption Recovery

**Test:** On a physical iPhone or iPad, open the app as a PWA (home screen icon) or Safari tab, start a mic-enabled game (e.g., Notes Recognition from the trail), then during gameplay have someone call the phone (or use Do Not Disturb toggle as a simulation).
**Expected:** Tap-to-resume overlay appears when returning to the app. Tapping "Tap to Continue" resumes the game with working pitch detection — no page reload needed.
**Why human:** The "interrupted" AudioContext state (`onstatechange` firing with `state === "interrupted"`) is an iOS Safari-only event that cannot be simulated in desktop browsers or test environments.

### 2. App Switch Track Liveness Check

**Test:** On a physical iOS device, start a mic-enabled game, press the Home button (or swipe up) to switch away for 3+ seconds, then return.
**Expected:** Tap-to-resume overlay appears. After tapping, if mic tracks ended, fresh `getUserMedia` is called. Game resumes with active pitch detection.
**Why human:** `MediaStreamTrack.readyState === "ended"` behavior after app-switch requires real Safari on iOS to validate. Desktop Chrome keeps tracks live across tab switches.

### 3. iOS Permission Denial Instructions Display

**Test:** On a physical iOS device, deny mic permission when prompted by a mic-enabled game. Alternatively block mic in Safari settings before launching.
**Expected:** MicErrorOverlay appears with the numbered 5-step iOS Settings instructions ("1. Open the Settings app, 2. Scroll down and tap Safari, ..."), not the generic browser hint.
**Why human:** `isIOSSafari` evaluates to `false` on all desktop browsers (no iOS UA), so the iOS branch cannot be tested without a physical device.

### 4. Trail Auto-Start Gesture Gate on iOS

**Test:** On a physical iOS device, navigate to the trail map, tap a node, and tap "Start Practice" in the TrailNodeModal.
**Expected:** If AudioContext requires a gesture (suspended/interrupted), the in-game gate overlay appears immediately after the game component mounts. Tapping it resumes the AudioContext synchronously and starts the exercise.
**Why human:** The gesture token boundary across React Router navigation is a Safari-specific behavior. Whether the gate triggers depends on iOS's actual gesture attribution state, which varies by iOS version.

---

## Gaps Summary

Only one gap was found, and it is a documentation discrepancy rather than a code defect:

**IOS-04 in REQUIREMENTS.md:** The implementation is fully present in `MicErrorOverlay.jsx` (committed in `338553d`), but `REQUIREMENTS.md` still shows `- [ ] **IOS-04**` (unchecked) on line 49 and the tracking table on line 113 shows 'Pending'. This is a 2-line fix to the requirements document.

All four phase requirements (IOS-01 through IOS-04) are implemented in the codebase. The 4 commits (`cc8ba36`, `e48e297`, `2327366`, `338553d`) are all present and verified. The code is substantive and correctly wired across all components.

The human verification items are genuine uncertainties about iOS-specific runtime behavior that cannot be validated programmatically — they are not code gaps.

---

_Verified: 2026-03-03T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
