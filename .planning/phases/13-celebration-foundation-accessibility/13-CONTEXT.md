# Phase 13: Celebration Foundation & Accessibility - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish accessibility-first animation patterns before implementing any celebrations. This phase creates the foundation (wrapper component, duration standards, accessibility integration) that all future celebration features (Phases 15, 17) will use.

New celebration types or visual effects beyond this foundation belong in separate phases.

</domain>

<decisions>
## Implementation Decisions

### Animation Behavior Patterns
- **reducedMotion handling:** Claude's discretion on approach (skip entirely, instant completion, or subtle alternatives)
- **AccessibilityContext integration:** Check if reducedMotion exists, add if needed
- **Wrapper API design:** Claude decides between hook, component wrapper, or both
- **System preference detection:** Claude decides whether to auto-detect prefers-reduced-motion or use manual setting only
- **Extended Timeouts integration:** **When Extended Timeouts is enabled, celebration animations last longer** (exact extension amount is Claude's discretion)
- **Per-effect handling:** Claude decides if different celebration types (confetti, stars, text) need separate reducedMotion treatment

### Skip/Dismiss Interaction
- **Skip methods:** Users can skip by:
  - **Click anywhere** on screen
  - **Clicking specific button** (e.g., "Continue")
  - **Keyboard shortcuts** (ESC or Enter) for accessibility
- **Skip behavior:** Claude decides between instant completion, jump to end screen, or fast-forward
- **Visual indicator:** Claude decides if "Click to continue" hint is helpful for 8-year-olds

### Duration Standards
- **Three duration tiers:**
  - Standard celebration: Claude decides (400-800ms range from research)
  - Level-up celebration: 1 second (middle tier)
  - **Boss celebration: 3 seconds** (significant milestone moment)
- **Extended Timeouts scaling:** Claude decides appropriate extension (50% longer, 2x, or fixed amount)

### Service Worker Strategy
- **Celebration component caching:** Claude decides between exclude from cache, network-first, or cache-first
- **Accessibility wrapper caching:** Claude decides if wrapper component should always be fresh or use normal caching
- **Offline behavior:** Claude decides how celebrations degrade when offline
- **Cache version:** Claude decides if service worker version bump is needed

### Claude's Discretion
- Logging level for animation modifications (always, dev-only, or never)
- Animation preset API (named presets like 'celebration' vs raw duration values)
- Specific reducedMotion approach (skip, instant, or subtle alternatives)
- System preference detection vs manual setting
- Per-effect reducedMotion handling
- Skip behavior implementation
- Visual skip indicator design
- Standard celebration duration within 400-800ms range
- Extended Timeouts extension amount
- Service worker caching strategy for celebration code
- Cache version bump necessity
- Offline celebration experience

</decisions>

<specifics>
## Specific Ideas

- Research suggests 400-800ms celebration duration is appropriate for 8-year-old learners
- Boss celebrations should feel like significant milestones (3 seconds chosen)
- Level-up celebrations warrant their own tier between standard and boss
- Extended Timeouts accessibility setting should affect celebration duration for cognitive accessibility
- Keyboard shortcuts (ESC/Enter) are important for accessibility, not just click interaction

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-celebration-foundation-accessibility*
*Context gathered: 2026-02-05*
