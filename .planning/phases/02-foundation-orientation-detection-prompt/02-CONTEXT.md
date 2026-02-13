# Phase 02: Foundation - Orientation Detection & Prompt - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Mobile users see a playful rotate prompt when entering any of the 4 game modes in portrait mode. Universal orientation detection via CSS media queries (no Screen Orientation API reliance) that works on both iOS and Android. This phase covers detection and the prompt overlay only — game layout optimization, Android orientation lock, and accessibility/i18n are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Prompt Visual Design
- Tilting phone animation — phone icon gently rocks from portrait to landscape position
- Illustrated/detailed phone icon — not a simple outline; include mini piano or music notes on the phone screen
- Playful & fun text tone — friendly language appropriate for 8-year-old learners (e.g., "Turn your phone sideways for the best experience!")
- Background matches game's dark theme but slightly brighter for attention — semi-transparent dark overlay with enough contrast to stand out as a system prompt

### Dismiss & Re-show Behavior
- Permanent dismiss — tapping "Play anyway" stores preference in localStorage, never shows again on this device
- No reset mechanism needed — if user dismissed, they know how to rotate
- Auto-dismiss on landscape rotation uses smooth fade-out animation
- Re-show once — if user rotates to landscape (auto-dismisses), then rotates back to portrait mid-game, prompt reappears one more time as a gentle reminder, then stops

### Timing & Trigger Logic
- Shows immediately on game entry — no delay, appears before the settings modal
- Triggers on all 4 game modes equally (sight reading, notes recognition, rhythm, boss challenges)
- No prompt when entering in landscape — silently skip, no confirmation feedback
- No prompt on desktop devices

### Overlay Presentation
- Full-screen overlay — covers everything, game not visible behind it
- Blocking interaction — user must either rotate device or tap dismiss to proceed (WCAG 1.3.4 escape hatch via dismiss)
- Dismiss via text button below the prompt animation — "Play anyway"
- No X icon in corner — text button is the sole dismiss mechanism

### Claude's Discretion
- Exact animation duration and easing for the tilting phone
- Specific illustration details for the phone icon (piano keys, music notes, etc.)
- Fade-out animation timing on auto-dismiss
- CSS implementation details for the overlay backdrop
- localStorage key naming for permanent dismiss preference

</decisions>

<specifics>
## Specific Ideas

- Phone icon should have mini piano or music notes on its screen — ties the prompt to the app's music theme
- "Play anyway" as dismiss text — short, casual, no judgment for staying in portrait
- The prompt should feel like a friendly suggestion, not a barrier — playful tone for young learners
- Fade-out on auto-dismiss should feel polished, not abrupt

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-foundation-orientation-detection-prompt*
*Context gathered: 2026-02-13*
