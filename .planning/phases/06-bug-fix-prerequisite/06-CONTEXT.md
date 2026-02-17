# Phase 06: Bug Fix Prerequisite - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the mic-restart regression so "Try Again" works after a failed mic attempt, the test suite passes, and rapid start/stop sequences don't race. This phase fixes existing broken behavior only — no new mic features, no iOS-specific hardening (Phase 09), no performance work (Phase 10).

</domain>

<decisions>
## Implementation Decisions

### Failure Feedback
- Kid-friendly, encouraging tone for error messages (Claude drafts wording)
- Two distinct error messages: "permission denied" vs "mic stopped working"
  - Permission denied: primary action is "Back to Menu" (since retry won't help)
  - Mic stopped: primary action is "Try Again"
- Full overlay pauses the game — semi-transparent so game state is visible behind it
- Two buttons: "Try Again" (primary) and "Back to Menu" (secondary) — primary/secondary flips based on error type
- No sound or haptic feedback when overlay appears — avoid startling kids
- Both English and Hebrew translations for all error messages
- Same overlay shown on repeated failures — consistent, predictable experience for kids

### Retry Behavior
- No cooldown between retry attempts — immediate retry allowed
- Retry count hidden from user — avoid discouraging kids
- After exhausting retry limit: remove "Try Again", show only "Back to Menu" with helpful message
- Spinner/animation shown during reconnection attempt so kid knows something is happening

### Recovery Path
- Game resumes exactly where it stopped — same note/question on screen
- All scores and progress from before failure are preserved
- Brief "Mic is ready!" confirmation shown after successful retry (1-2 seconds)
  - Appears in the same overlay (transitions from error state to success state, then dismisses)
  - No countdown or mic test — keeps it fast
- Mic level indicator (volume meter bar) appears in top corner after recovery, fades after 3-5 seconds
- Game timer pauses during the error overlay (if applicable to the game mode)

### Claude's Discretion
- Retry limit number (how many attempts before fallback)
- Exact wording of kid-friendly error messages
- Level of detail in permission-denied recovery instructions
- Cooldown between retry and re-enablement of Try Again button (if technically needed)
- Exact spinner/loading animation design
- Volume meter bar styling and exact position within top corner

</decisions>

<specifics>
## Specific Ideas

- The overlay should feel safe and non-punishing — the kid didn't do anything wrong, the mic just stopped
- Permission-denied message should reference a grown-up: "Ask a grown-up to help enable the microphone"
- "Mic is ready!" success state in the same overlay creates a smooth narrative: problem -> trying -> fixed -> back to game

</specifics>

<deferred>
## Deferred Ideas

- iOS Safari-specific mic recovery and permission messaging — Phase 09
- Mic level indicator as a permanent game UI feature (currently only shown briefly after recovery) — could be its own enhancement
- AudioWorklet for off-main-thread processing — Phase 10 (profiling-gated)

</deferred>

---

*Phase: 06-bug-fix-prerequisite*
*Context gathered: 2026-02-17*
