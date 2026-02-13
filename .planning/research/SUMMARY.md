# Project Research Summary

**Project:** Auto-rotate to landscape orientation for mobile game optimization
**Domain:** Mobile PWA orientation management
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

Adding landscape orientation optimization to this piano learning PWA can be achieved **without installing any new npm packages**. The app already has all necessary dependencies (Tailwind CSS, Framer Motion, lucide-react). The recommended approach uses CSS media queries + custom React hooks for universal orientation detection, with an optional prompt overlay for portrait users, rather than attempting programmatic orientation locking.

The key technical constraint is platform fragmentation: iOS Safari blocks the Screen Orientation Lock API on iPhones entirely, and on Android it requires fullscreen mode. The Screen Orientation API has 95% browser support but is unavailable where it matters most - iOS PWAs on iPads in children's classrooms. The solution is graceful degradation: detect orientation via CSS, show a non-blocking prompt suggesting rotation, and optimize the layout for landscape without forcing it.

Critical risks include: iOS Safari's viewport height calculation changing during rotation (causing VexFlow coordinate misalignment), WCAG 1.3.4 violations if orientation is enforced without escape hatches, and motion sickness in users with vestibular disorders if rotation transitions are animated. All risks are mitigable with proper debouncing, accessibility checks, and feature detection.

## Key Findings

### Recommended Stack

**Zero new npm packages required.** All functionality achievable with existing project dependencies and native Web APIs.

**Core technologies:**
- **CSS Media Queries** (`@media (orientation: portrait)`) - Universal support, works on iOS PWAs, zero dependencies
- **window.matchMedia()** - Native Web API for reactive orientation detection (99%+ browser support, no polyfill needed)
- **Tailwind CSS** (existing v3.4.1) - Built-in `portrait:` and `landscape:` utilities for responsive orientation styling
- **Framer Motion** (existing v12.23.26) - Smooth animations for device rotation prompts (already in project)
- **lucide-react** (existing v0.344.0) - `Smartphone` + `RotateCw` icons for orientation prompt overlay

**Libraries NOT to install:**
- react-screen-orientation (abandoned, last updated 6 years ago)
- react-device-detect (unmaintained, user-agent based, unreliable)
- Any Screen Orientation API polyfills (don't work on iOS, add complexity)

### Expected Features

**Must have (table stakes):**
- **Orientation detection** - Know if device is portrait/landscape via CSS or matchMedia
- **Rotate prompt overlay** - Show "Please rotate your device" message when in portrait
- **Hide prompt on rotate** - Overlay disappears automatically when user rotates to landscape
- **Landscape-optimized layout** - VexFlow staves, settings, victory screen use full horizontal space
- **Graceful portrait fallback** - If user refuses to rotate, game still playable (degraded UX but functional)

**Should have (competitive):**
- **Animated rotate icon** - Cute phone rotation animation in prompt (child-friendly, uses existing Framer Motion)
- **Remember orientation preference** - If user dismissed prompt, don't nag again (localStorage flag per session)
- **Orientation-aware trail map** - Trail map works in both orientations (differentiator: most games force landscape)

**Defer (v2+):**
- **Orientation lock (Android only)** - Prevents accidental rotation during gameplay, requires fullscreen API + user gesture
- **Auto-fullscreen on game start** - Immersive experience, requires user gesture, iOS iPhone has no support
- **Hard dependency on fullscreen** - Not supported on iPhone, breaks iOS UX entirely

**Anti-features (explicitly avoid):**
- **Force landscape on app launch** - Not supported on iOS, violates PWA principles
- **Block gameplay in portrait** - Accessibility violation (WCAG 1.3.4), some users can't rotate device
- **Auto-lock on all routes** - Dashboard, settings don't need landscape, only game routes
- **Persistent nag prompts** - Annoying if user dismissed once, respect dismissal

### Architecture Approach

Implement a **CSS-first, JavaScript-enhanced** pattern with two new components and one custom hook. TrailMap and game components remain structurally unchanged, with orientation detection wrapped around them. The pattern: detect portrait → conditionally render `<OrientationPrompt>` overlay → hide prompt when user rotates to landscape.

**Major components:**
1. **useOrientation hook** - Custom hook using `window.matchMedia('(orientation: portrait)')` for reactive state (15-20 lines)
2. **OrientationPrompt component** - Overlay with animated phone icon + rotate instruction (30-40 lines, uses existing Framer Motion + lucide-react)
3. **Tailwind orientation utilities** - `portrait:hidden`, `landscape:block` classes for layout toggling (built-in, zero code)

**Integration points:**
- Game components (SightReadingGame, NotesRecognitionGame, MetronomeTrainer) wrap game content with orientation check
- Settings modal stays portrait-friendly (text inputs, dropdowns easier in portrait)
- Prompt appears after clicking "Start Game", before rendering first exercise
- Existing VexFlow layout logic remains unchanged, just adapts to container dimensions

### Critical Pitfalls

1. **iOS Safari Fullscreen API doesn't work on iPhones** - Screen Orientation Lock API has zero support on iPhones (only iPads). Must feature-detect and provide CSS fallback instead of assuming lock works everywhere.

2. **Screen Orientation Lock requires fullscreen on Android** - Calling `screen.orientation.lock('landscape')` fails with `NotAllowedError` unless document is in fullscreen mode. Must request fullscreen first, then lock orientation in correct order.

3. **iOS Safari viewport height changes during rotation (race condition)** - `window.innerHeight` is incorrect immediately after `orientationchange` event. Correct value set after first render (100-300ms later). VexFlow renders to wrong dimensions if measured too early. Must debounce orientation change events 300ms and use CSS custom property `--vh` instead of `100vh`.

4. **VexFlow SVG getBoundingClientRect() returns stale coordinates after rotation** - Calling `getBoundingClientRect()` immediately after VexFlow re-render returns old portrait coordinates. Must wait for browser to recalculate layout using double `requestAnimationFrame` before querying positions.

5. **WCAG 1.3.4 violation - forced orientation locks user out** - Wheelchair-mounted tablets or users with motor impairments can't rotate device. Forcing landscape blocks gameplay entirely. Must provide dismissible prompt and allow degraded portrait experience with prominent rotate suggestion.

6. **Rotation animation triggers motion sickness in users with vestibular disorders** - Animating VexFlow staff rotating/scaling during orientation change causes nausea. App already has `reducedMotion` setting from AccessibilityContext. Must respect it when handling orientation changes, use instant re-render instead of transitions.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: CSS Detection + Prompt (Foundation)
**Rationale:** Works on both iOS and Android without any API restrictions. Solves core UX problem (VexFlow notation needs horizontal space) with minimal code. Establishes graceful degradation pattern before attempting platform-specific enhancements.

**Delivers:**
- Orientation detection hook (`useOrientation`)
- Prompt overlay component (`OrientationPrompt`)
- Landscape-optimized CSS for game components
- Conditional rendering pattern for games

**Addresses:**
- Table stakes: orientation detection, rotate prompt, hide on rotate
- WCAG 1.3.4 compliance: non-blocking prompt, portrait fallback
- iOS iPhone compatibility: CSS works everywhere

**Avoids:**
- Pitfall #1 (iOS limitations) via feature detection
- Pitfall #5 (WCAG violation) via dismissible prompt
- Pitfall #6 (motion sickness) via instant layout changes

**Complexity:** Low
**Research needed:** No - CSS patterns well-documented

---

### Phase 2: Accessibility Integration (Polish)
**Rationale:** App already has comprehensive accessibility features (reducedMotion, high contrast, extended timeouts). Orientation changes must integrate seamlessly with existing system before adding animations or enhancements.

**Delivers:**
- Framer Motion animation for rotate prompt icon
- i18n translations (English + Hebrew RTL)
- Integration with `AccessibilityContext` (respect `reducedMotion`)
- Dismissal preference persistence (localStorage)

**Uses:**
- Framer Motion (existing) for phone rotation animation
- lucide-react (existing) for icons
- i18next (existing) for translations

**Implements:**
- AnimatedPrompt component enhancement
- Translation keys in `locales/en/common.json` and `locales/he/common.json`

**Addresses:**
- Should-have: animated rotate icon, remember preference
- Accessibility: screen reader announcements, reduced motion support
- RTL support: Hebrew text flow in both orientations

**Avoids:**
- Pitfall #6 (motion sickness) via reducedMotion check

**Complexity:** Low-Medium
**Research needed:** No - existing patterns in codebase

---

### Phase 3: VexFlow Re-render Handling (Critical Integration)
**Rationale:** VexFlow SVG coordinate calculations are error-prone during orientation changes. Must solve viewport race conditions and stale coordinate issues before any advanced features work reliably. This phase has highest technical risk.

**Delivers:**
- Debounced orientation change handler (300ms for iOS Safari)
- CSS custom property for viewport height (`--vh`)
- Double RAF pattern before querying VexFlow coordinates
- VictoryScreen modal re-centering on orientation change

**Implements:**
- Layout recalculation logic in game components
- Event listener cleanup on unmount (prevent memory leaks)
- Service worker exclusion for VexFlow SVG (no caching dynamic content)

**Addresses:**
- VexFlow notation renders correctly after rotation
- Pitch detection overlays align with staff lines
- Victory screen stays centered

**Avoids:**
- Pitfall #3 (iOS viewport race) via debouncing + CSS custom property
- Pitfall #4 (stale coordinates) via double RAF before getBoundingClientRect
- Pitfall #7 (memory leaks) via event listener cleanup
- Pitfall #9 (VictoryScreen misalignment) via orientation listener

**Complexity:** High
**Research needed:** **YES - VexFlow re-render behavior during orientation changes**
- VexFlow 5.x internal coordinate system during resize
- SVG bounding box caching across browsers (Chrome/Safari/Firefox)
- Integration with existing pitch detection overlays

---

### Phase 4: Fullscreen + Lock (Optional Android Enhancement)
**Rationale:** Phase 1-3 solve the problem for all platforms. This phase adds optional enhancements for Android users only (fullscreen + orientation lock). iOS users won't benefit, so defer until post-MVP.

**Delivers:**
- Platform detection (Android vs iOS)
- Fullscreen API integration on game start (Android)
- Orientation lock after entering fullscreen (Android)
- Auto-unlock on game exit or navigation away

**Implements:**
- Fullscreen entry/exit state management
- Promise rejection handling (NotAllowedError, AbortError)
- Cleanup on `fullscreenchange` event

**Addresses:**
- Should-have: orientation lock (Android), auto-fullscreen

**Avoids:**
- Pitfall #2 (fullscreen requirement) via correct ordering
- Pitfall #8 (manifest conflicts) via installed PWA detection
- Pitfall #10 (fullscreen exit breaks state) via fullscreenchange listener
- Pitfall #12 (lock persists) via cleanup on unmount

**Complexity:** High
**Research needed:** **YES - Fullscreen API edge cases**
- Promise rejection types and user-facing error messages
- Navigation guards in React Router for orientation lock cleanup
- Fullscreen + React lifecycle interaction (useEffect cleanup timing)

---

### Phase Ordering Rationale

**CSS-first approach (Phase 1) must come first:**
- Works on all platforms (iOS + Android)
- Establishes graceful degradation pattern
- No API dependencies or feature detection complexity
- Solves 80% of the problem with 20% of the code

**Accessibility integration (Phase 2) before VexFlow work:**
- Existing `AccessibilityContext` must be integrated early
- Motion sickness risks apply to any VexFlow transitions
- Easier to test animations independently of coordinate calculations

**VexFlow integration (Phase 3) is highest-risk phase:**
- SVG coordinate bugs only surface during rotation
- Must solve viewport race conditions before overlays work
- Debouncing timing values need real device testing
- Requires physical device testing (iOS Simulator lies about viewport behavior)

**Fullscreen + lock (Phase 4) is optional enhancement:**
- iOS iPhone has no support (50% of mobile users excluded)
- Fullscreen requires user gesture (can't auto-trigger)
- Adds significant complexity (error handling, platform detection, state management)
- Phase 1-3 already provide good UX without lock

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 3 (VexFlow Integration):** Complex integration with SVG coordinate system. Research needed on:
  - VexFlow 5.x internal behavior during `renderer.resize()`
  - Cross-browser SVG `getBoundingClientRect()` caching
  - Existing pitch detection overlay coordinate calculation patterns
  - Debounce timing values (300ms educated guess, needs device testing)

- **Phase 4 (Fullscreen + Lock):** Platform-specific API edge cases. Research needed on:
  - Fullscreen API promise rejection types (NotAllowedError, AbortError, NotSupportedError)
  - React Router navigation guards for orientation lock cleanup
  - Fullscreen + React lifecycle interaction timing
  - User-facing error messages for each failure scenario

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (CSS Detection):** CSS media queries and matchMedia well-documented. MDN official docs + Tailwind docs provide complete implementation patterns.

- **Phase 2 (Accessibility):** Existing codebase patterns for `AccessibilityContext`, i18n, and Framer Motion. No external research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All dependencies already in project. CSS media queries + matchMedia are standard, well-documented Web APIs with 99%+ support. |
| Features | **MEDIUM** | UX patterns (rotate prompts) common in games, but no formal design system docs for educational apps. Kids app precedent inconclusive (Duolingo/Khan Academy don't document orientation implementation). |
| Architecture | **HIGH** | Component separation clear. CSS-first approach proven pattern. Integration points well-defined (game components, settings modal, VictoryScreen). |
| Pitfalls | **HIGH** | iOS Safari limitations confirmed by multiple sources (Apple forums, WebKit bugs, PWA docs). VexFlow coordinate issues corroborated by GitHub issues + Mozilla bug reports. WCAG requirements explicit in spec. |

**Overall confidence:** HIGH

### Gaps to Address

**iOS Safari viewport timing:**
- 300ms debounce is educated guess from WebKit bug reports and developer guides
- Optimal timing may vary across iOS versions (15 vs 16 vs 17 vs 26)
- **Resolution:** Test on physical devices during Phase 3, adjust timing if needed

**VexFlow coordinate recalculation:**
- Double RAF pattern is general browser workaround, not VexFlow-specific
- VexFlow 5.x docs don't mention orientation change handling
- **Resolution:** Prototype during Phase 3 research, may need VexFlow maintainer consultation

**Children's UX for orientation prompts:**
- Limited research on optimal prompt copy for 8-year-olds ("Rotate device" vs "Turn sideways" vs icon-only)
- No A/B testing data for dismissal behavior
- **Resolution:** Start with simple language + visual icon, iterate based on user testing feedback

**Fullscreen API edge cases (Phase 4):**
- User gesture requirements vary by browser version
- Input focus exits fullscreen on iOS (undocumented behavior)
- **Resolution:** Deep research during Phase 4 planning, may require BrowserStack testing

**COPPA compliance for orientation enforcement:**
- Forced orientation may have legal implications for children's apps
- Relationship between WCAG 1.3.4 and COPPA unclear
- **Resolution:** Consult legal during Phase 1 design, ensure escape hatches meet both requirements

## Sources

### Primary (HIGH confidence)
- [MDN - CSS orientation media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/orientation)
- [MDN - ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock)
- [W3C Screen Orientation API Spec](https://w3c.github.io/screen-orientation/)
- [WCAG 1.3.4: Orientation (Level AA)](https://www.w3.org/WAI/WCAG21/Understanding/orientation.html)
- [CanIUse - Screen Orientation API](https://caniuse.com/screen-orientation)
- [CanIUse - Fullscreen API](https://caniuse.com/fullscreen)
- [Tailwind CSS: orientation utilities](https://tailwindcss.com/docs/hover-focus-and-other-states#viewport-orientation)
- [Framer Motion animation docs](https://www.framer.com/motion/)

### Secondary (MEDIUM confidence)
- [PWA on iOS - Current Status & Limitations [2025]](https://brainhub.eu/library/pwa-on-ios)
- [PWA iOS Limitations and Safari Support: Complete Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [WebKit Bug #170595: window.innerHeight bogus after orientationchange](https://bugs.webkit.org/show_bug.cgi?id=170595)
- [VexFlow Issue #712: Resizing renderer changes SVG positions](https://github.com/0xfe/vexflow/issues/712)
- [Mozilla Bug #1066435: getBoundingClientRect and SVG transforms](https://bugzilla.mozilla.org/show_bug.cgi?id=1066435)
- [Addressing the iOS Address Bar in 100vh Layouts](https://medium.com/@susiekim9/how-to-compensate-for-the-ios-viewport-unit-bug-46e78d54af0d)
- [100vh problem with iOS Safari](https://medium.com/quick-code/100vh-problem-with-ios-safari-92ab23c852a8)
- [Using React Hooks for Device Orientation | UXPin](https://www.uxpin.com/studio/blog/using-react-hooks-for-device-orientation/)
- [Let's create a custom hook useScreenOrientation](https://medium.com/@perenciolo659/let-s-create-a-custom-hook-usescreenorientation-e5f66919b8b)

### Tertiary (LOW confidence - needs validation)
- [Educational Game Development Best Practices](https://www.filamentgames.com/blog/educational-game-development-best-practices-animation-and-voiceover/) - Animation patterns for kids, but not orientation-specific
- [UX Design for Kids: Principles and Recommendations](https://www.ramotion.com/blog/ux-design-for-kids/) - General kids UX, no orientation prompt guidance

---
*Research completed: 2026-02-13*
*Ready for roadmap: yes*
