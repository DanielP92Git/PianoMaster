# Research Summary: Mobile Landscape Orientation for Games

**Domain:** Mobile web game orientation management for PWA
**Researched:** 2026-02-13
**Overall confidence:** MEDIUM (WebSearch + MDN official docs; iOS PWA behavior not testable without device)

## Executive Summary

Adding landscape orientation support for mobile games requires **three layers**: detection (CSS + JavaScript), user prompting (overlay component), and optional locking (Android only). The research reveals a critical platform divide: iOS iPhone doesn't support the Screen Orientation Lock API, limiting the solution to CSS-based detection and non-blocking prompts.

The recommended approach follows the **graceful degradation pattern** used by music notation apps (Symphony Pro, OKTAV): detect orientation → suggest rotation → optimize layout for landscape → allow portrait fallback. Educational apps like Duolingo support landscape but don't force it, respecting user choice and accessibility.

**Key insight:** 80% of the value comes from Phase 1 (CSS detection + prompt overlay), which works universally. The remaining 20% (fullscreen + orientation lock) only works on Android and requires significant complexity for minimal gain.

**Platform compatibility summary:**
- **Android PWA:** Full support (detection, prompts, locking, fullscreen)
- **iOS PWA:** Partial support (detection, prompts only; no locking or fullscreen on iPhone)
- **Desktop:** N/A (orientation prompts not needed)

## Key Findings

**Stack:** React custom hook (`useOrientation`) + CSS media queries + conditional rendering (no external dependencies needed)

**Architecture:** Lightweight wrapper component (`<OrientationGate>`) around game components; prompt shows on mount if portrait, hides when user rotates

**Critical pitfall:** Fullscreen API + Orientation Lock API require user gestures and aren't supported on iOS iPhone. Building a hard dependency on these features breaks the iOS experience. Must treat as progressive enhancement for Android only.

## Implications for Roadmap

Based on research, suggested phase structure:

### 1. Phase 1: MVP - CSS Detection + Prompt Overlay (P0) - 2-3 days
   - Addresses: Table stakes features (detection, prompting, landscape layout)
   - Avoids: iOS incompatibility pitfall (no lock API usage)
   - Complexity: Low
   - **Rationale:** Works on all platforms, solves core UX problem (VexFlow staves need width), minimal code
   - **Components:**
     - Custom hook: `src/hooks/useOrientation.js`
     - Prompt component: `src/components/orientation/OrientationPrompt.jsx`
     - CSS utilities: Tailwind orientation-based responsive classes
     - Integration: Wrap game components with orientation check

### 2. Phase 2: Android Enhancements (Optional) - 3-4 days
   - Addresses: Differentiator features (fullscreen, orientation lock)
   - Avoids: Forcing features that don't work on iOS
   - Complexity: Medium-High
   - **Rationale:** Nice-to-have for Android users; immersive gameplay without accidental rotation
   - **Components:**
     - Platform detection utility
     - Fullscreen trigger in game start flow
     - Orientation lock after fullscreen
     - Cleanup on game exit
   - **Risk:** User gesture requirement may conflict with auto-start from trail; needs careful testing

### 3. Phase 3: Polish (If Time Permits) - 1-2 days
   - Addresses: UX improvements (animations, i18n, accessibility)
   - Avoids: Over-engineering before validating Phase 1
   - Complexity: Low
   - **Rationale:** Validate that Phase 1 meets user needs before adding polish
   - **Components:**
     - Animated rotate icon (CSS or Lottie)
     - Dismissal preference (localStorage)
     - i18n strings (English + Hebrew)
     - Screen reader announcements

### Phase ordering rationale:
- **Phase 1 first** because it's universally compatible and solves the core problem
- **Phase 2 deferred** because it only benefits Android users and requires platform detection complexity
- **Phase 3 deferred** because polish should come after validating core functionality

### Research flags for phases:
- **Phase 1:** Unlikely to need additional research (standard patterns, well-documented APIs)
- **Phase 2:** Likely needs deeper research on:
  - Fullscreen API interaction with trail auto-start flow (user gesture timing)
  - Android Chrome vs Samsung Internet vs Firefox behavior differences
  - Error handling when lock fails (permissions, device settings)
- **Phase 3:** Standard implementation patterns; no additional research needed

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack (React hook + CSS)** | HIGH | Standard pattern, well-documented in MDN + React community |
| **Features (table stakes)** | HIGH | Common UX pattern in mobile games; clear user expectations |
| **Architecture (wrapper component)** | HIGH | Fits existing game lifecycle (settings → gameplay → victory) |
| **Pitfalls (iOS limitations)** | HIGH | Multiple sources confirm iPhone lacks lock API support |
| **Android fullscreen + lock** | MEDIUM | Documented in MDN, but user gesture timing may vary by browser |
| **Educational app precedent** | LOW | Duolingo/Khan Academy research inconclusive (no detailed orientation docs found) |

## Gaps to Address

### Areas where research was inconclusive:

1. **iOS PWA vs Safari behavior:** Does installed PWA on iOS home screen behave differently than in-browser Safari? (No definitive 2026 docs found)
   - **Mitigation:** Test on actual iPhone during Phase 1 implementation

2. **Fullscreen + auto-start conflict:** Trail nodes auto-start games without explicit user gesture. Does this break fullscreen API requirement?
   - **Mitigation:** Phase 2 research task; may need to add intermediate "Ready? Tap to start" screen

3. **Settings modal in landscape:** Is landscape orientation usable for dropdowns, text inputs, toggles?
   - **Mitigation:** Phase 1 UX testing; if unusable, show prompt *after* settings modal closes

4. **Trail map orientation:** Should trail map also suggest landscape, or only game routes?
   - **Mitigation:** Post-MVP decision based on user feedback; research found no clear precedent

### Topics needing phase-specific research later:

**For Phase 2 (if pursued):**
- Fullscreen API error handling (permissions denied, not supported, user cancels)
- Platform detection reliability (user agent vs feature detection)
- Orientation lock fallback strategies when lock fails
- Android browser testing matrix (Chrome, Samsung Internet, Firefox, Brave)

**For Phase 3 (if pursued):**
- Animation performance on low-end Android devices (CSS vs Lottie vs canvas)
- A/B testing of prompt copy ("Rotate device" vs "Turn sideways" vs icon-only)
- Optimal dismissal behavior (session-based vs permanent localStorage flag)

## Critical Decision: Integration Point

**Where in the game lifecycle should orientation checking happen?**

**Research finding:** Settings modal should stay portrait-friendly (text inputs, dropdowns easier in portrait). Prompt should appear **after** user clicks "Start Game" but **before** first exercise renders.

**Integration strategy:**
```jsx
// Current flow
UnifiedGameSettings → [Start Game] → SightReadingGame component

// New flow with orientation gate
UnifiedGameSettings → [Start Game] →
  <OrientationGate>
    <SightReadingGame />
  </OrientationGate>
```

**Why this works:**
- Settings modal remains usable in portrait
- Prompt appears when landscape is truly needed (VexFlow rendering)
- Existing game lifecycle unchanged (wrapping only)
- No refactoring of game state management

## Implementation Complexity Assessment

| Task | Complexity | Risk | Time Estimate |
|------|------------|------|---------------|
| **Phase 1: CSS + Prompt** | Low | Low | 2-3 days |
| - `useOrientation()` hook | Low | None | 2-3 hours |
| - `OrientationPrompt` component | Low | None | 3-4 hours |
| - CSS landscape layout | Medium | Low | 4-6 hours (testing VexFlow responsiveness) |
| - Game component integration | Low | None | 2-3 hours |
| - i18n for prompts | Low | None | 1 hour |
| **Phase 2: Android Fullscreen** | High | Medium | 3-4 days |
| - Platform detection | Low | Low | 2 hours |
| - Fullscreen API integration | Medium | Medium | 6-8 hours (user gesture timing) |
| - Orientation lock | Medium | Medium | 4-6 hours (error handling) |
| - Cleanup on exit | Low | Low | 2-3 hours |
| - Testing matrix | High | High | 1-2 days (multiple browsers/devices) |
| **Phase 3: Polish** | Low | Low | 1-2 days |
| - Animated icon | Low | None | 3-4 hours |
| - Dismissal preference | Low | None | 2 hours |
| - Accessibility enhancements | Low | None | 2-3 hours |

**Total for MVP (Phase 1 only):** 2-3 days
**Total for full implementation:** 6-9 days

## Recommendation for Milestone Planning

**For this milestone (MVP):**
- Implement **Phase 1 only** (CSS detection + prompt overlay)
- Test on iOS + Android devices
- Validate that VexFlow staves render properly in landscape
- Validate that settings modal remains usable in portrait
- Defer Phase 2 (fullscreen/lock) to future milestone if user feedback demands it

**Success criteria for Phase 1:**
- [ ] Orientation prompt shows on mobile devices in portrait
- [ ] Prompt hides immediately when device rotated to landscape
- [ ] VexFlow staves render full-width in landscape mode
- [ ] Settings modal remains usable in both orientations
- [ ] No console errors on iOS iPhone (graceful handling of missing APIs)
- [ ] i18n works for English + Hebrew prompt text
- [ ] Accessibility: screen reader announces orientation change

**Defer to future milestone:**
- Fullscreen API integration (Android only)
- Orientation lock (Android only)
- Animated rotate icon
- Dismissal preference storage

**Why this phasing:**
- Phase 1 solves 80% of the problem with 20% of the complexity
- Phase 2 only benefits subset of users (Android) with high implementation cost
- Unknown if Phase 2 features will even work with trail auto-start flow
- Better to validate Phase 1 meets needs before investing in enhancements

## Key Sources Referenced

**High confidence (official documentation):**
- [Managing screen orientation - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation)
- [orientation - CSS | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/orientation)
- [ScreenOrientation: change event - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/change_event)
- [Screen Orientation - W3C](https://w3c.github.io/screen-orientation/)

**Medium confidence (third-party analysis):**
- [iOS PWA Compatibility － firt.dev](https://firt.dev/notes/pwa-ios/)
- [Guide to Screen Orientation: Optimize Your App Experience](https://www.devzery.com/post/guide-to-screen-orientation-optimize-your-app-experience)
- [Using React Hooks for Device Orientation | UXPin](https://www.uxpin.com/studio/blog/using-react-hooks-for-device-orientation/)

**Low confidence (anecdotal/forum):**
- User reports of Duolingo landscape support (Twitter/forums, not official docs)
- Music app screenshots showing landscape mode (not implementation details)

Full source list available in FEATURES.md.
