# Phase 9: iOS Safari Hardening - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Mic input works reliably in Safari PWA on physical iOS devices. The app recovers from AudioContext interruption caused by phone calls, app switches, and device lock. Permission denial shows a clear message with iOS-specific recovery instructions. Changes ship as default behavior for all platforms (no iOS-only feature flag).

</domain>

<decisions>
## Implementation Decisions

### Interruption Recovery
- Show a lightweight tap-to-resume overlay when AudioContext is interrupted (distinct from MicErrorOverlay — not an error, just a pause)
- Freeze exercise state during interruption: timer, score tracking, and note sequence position all paused until user taps to resume
- Tap triggers AudioContext.resume() + mic re-acquisition on the user gesture
- Fallback chain if resume fails: retry mic request once, then offer "Restart Exercise" button (exercise progress lost, trail progress safe)
- The overlay visual treatment should be lighter/calmer than the error overlay — semi-transparent with a simple "Tap to continue" message and play icon

### First-Tap Activation
- Wire AudioContext.resume() into existing Start/Start Practice buttons across ALL platforms (not iOS-only conditional)
- No extra pre-game audio gate screen — the existing game start flow serves as the gesture
- For trail auto-start flow (TrailNodeModal -> game), research whether Safari gesture carries across React Router navigation; if not, add a lightweight in-game gate

### Permission Denial UX
- iOS Safari: step-by-step numbered instructions ("1. Open Settings 2. Scroll to Safari 3. Tap Microphone 4. Allow for this site 5. Come back and tap Retry")
- Other platforms: generic "Check your browser settings for microphone permission" fallback
- Mixed tone: child-friendly header (e.g., "I can't hear you!") with parent-addressed technical instructions below
- Only show Retry + Back to Trail buttons (no "play without mic" redirect)
- Detect iOS Safari to show platform-specific instructions; all other platforms get generic message

### Recovery Scope
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

</decisions>

<specifics>
## Specific Ideas

- The tap-to-resume overlay should feel like a natural pause, not a crash recovery — kids shouldn't be alarmed
- Parents are the ones who will resolve permission issues — the denied UX must be readable by adults while not scaring the child
- All gesture/resume changes benefit all platforms, so no platform detection branching for the core audio activation path

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AudioContextProvider.jsx`: Singleton AudioContext with webkitAudioContext fallback, visibility-based suspend/resume, requestMic/releaseMic API — needs interruption state handling added
- `MicErrorOverlay.jsx`: Existing overlay for permission denied + mic stopped states with i18n, accessibility (role=alertdialog) — can inform the new tap-to-resume overlay pattern
- `isIOSSafari` detection logic in `SightReadingGame.jsx` (lines 129-142) — can be extracted to a shared utility
- `usePitchDetection.js`: Two modes (shared analyser vs self-created) — interruption recovery must work with Mode A (shared analyser from AudioContextProvider)
- `useMicNoteInput.js`: FSM state machine (IDLE -> ARMED -> ACTIVE) — needs interruption-aware state transitions

### Established Patterns
- AudioContextProvider uses `visibilitychange` event for suspend/resume — extend this to handle iOS "interrupted" state
- MicErrorOverlay uses i18n keys under `common.micError` namespace — new overlay/messages should follow same pattern
- Game components use `location.state` for trail config — no AudioContext state passed this way
- Auto-start pattern uses `hasAutoStartedRef` — gesture activation must happen before or during this ref check

### Integration Points
- `AudioContextProvider.jsx` — primary target for interruption recovery and gesture-gated resume
- `SightReadingGame.jsx`, `NotesRecognitionGame.jsx`, `MetronomeTrainer.jsx` — all three game components need Start button wired to AudioContext.resume()
- `TrailNodeModal.jsx` — "Start Practice" button may need resume() call for gesture carry-through
- `MicErrorOverlay.jsx` — iOS-specific instructions added to existing denied state
- `src/locales/en/` and `src/locales/he/` — new i18n keys for interruption overlay and iOS instructions

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-ios-safari-hardening*
*Context gathered: 2026-03-02*
