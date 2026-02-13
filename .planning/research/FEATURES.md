# Feature Landscape: Mobile Landscape Orientation for Games

**Domain:** Mobile web game orientation management
**Researched:** 2026-02-13
**Confidence:** MEDIUM (WebSearch + official MDN docs, no iOS-specific PWA testing available)

## Executive Summary

Mobile landscape orientation for web games involves **detecting device orientation**, **prompting users to rotate**, and optionally **locking orientation** (Android only). Educational apps like Duolingo support landscape but don't force it. Music notation apps (Symphony Pro, OKTAV) offer landscape mode because wide staves require horizontal space. The key UX pattern is graceful degradation: detect portrait → show rotate prompt → hide prompt when user complies.

**Critical iOS limitation:** Screen Orientation Lock API is **not supported on iPhone** (only iPad). Must rely on CSS-only detection + prompts.

**Platform split:**
- **Android PWA:** Full support for `screen.orientation.lock('landscape')` (requires fullscreen)
- **iOS PWA:** No lock support; CSS media queries + rotate prompts only

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Platform | Notes |
|---------|--------------|------------|----------|-------|
| **Orientation detection** | Must know if device is portrait/landscape | Low | iOS + Android | CSS `@media (orientation)` or `window.matchMedia()` |
| **Rotate prompt overlay** | Games show "Please rotate" when wrong orientation | Low | iOS + Android | Standard UX pattern; conditional render based on orientation |
| **Hide prompt on rotate** | Overlay disappears when user complies | Low | iOS + Android | Listen to orientation change, re-render |
| **Landscape-optimized layout** | VexFlow staves, settings, victory screen fit landscape | Medium | iOS + Android | Responsive design with `@media (orientation: landscape)` |
| **Graceful portrait fallback** | If user refuses to rotate, game still playable (degraded) | Medium | iOS + Android | Smaller staves, scrollable content |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Platform | Notes |
|---------|-------------------|------------|----------|-------|
| **Orientation lock (Android)** | Prevents accidental rotation during gameplay | High | Android only | Requires fullscreen API + user gesture; iOS not supported |
| **Animated rotate icon** | Cute phone rotation animation in prompt | Low | iOS + Android | Improves child UX (target audience: 8-year-olds) |
| **Auto-fullscreen on game start** | Immersive experience, hides browser chrome | Medium | Android (reliable), iOS (limited) | Requires user gesture; iOS doesn't support on iPhone |
| **Remember orientation preference** | If user dismissed prompt, don't nag again | Low | iOS + Android | localStorage flag per session |
| **Orientation-aware trail map** | Trail map works in both orientations | Medium | iOS + Android | Differentiator: other games force landscape, this adapts |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Force landscape on app launch** | Not supported on iOS; violates PWA principles | Show prompt overlay, let user choose |
| **Block gameplay in portrait** | Frustrating; accessibility issue (some users can't rotate device) | Allow degraded portrait experience with prominent rotate suggestion |
| **Auto-lock on all routes** | Dashboard, settings, profile don't need landscape | Only suggest landscape for game routes (`/notes-master-mode/*`, `/rhythm-mode/*`, `/sight-reading/*`) |
| **Persistent nag prompts** | Annoying if user dismissed once | Respect dismissal; show prompt max once per session |
| **Hard dependency on Fullscreen API** | Not supported on iPhone; breaks iOS UX | Make fullscreen optional enhancement (Android only) |
| **Complex orientation state management** | Over-engineering for simple show/hide logic | Use CSS media queries where possible; React state only for prompt visibility |

## Feature Dependencies

### Dependency Graph

```
Orientation Detection (CSS @media)
  ↓
Rotate Prompt Overlay Component
  ↓
├─→ Orientation Change Listener (React hook)
├─→ Dismiss Logic (localStorage + state)
└─→ Animated Icon (optional)

Fullscreen API (Android only)
  ↓
Orientation Lock API
  ↓
Auto-unlock on game exit
```

### Existing Codebase Dependencies

| New Feature | Depends On (Existing) | Integration Point |
|-------------|----------------------|-------------------|
| Rotate prompt overlay | Game lifecycle (settings → gameplay → victory) | Wrap game components; hide when landscape detected |
| Orientation detection hook | None (browser API) | Custom hook `useOrientation()` |
| Landscape CSS layout | Existing responsive design | Extend Tailwind breakpoints with orientation queries |
| Fullscreen toggle | User gesture (Start Game button) | `UnifiedGameSettings` → trigger fullscreen on game start |
| Auto-unlock orientation | Game exit/unmount | `useEffect` cleanup in game components |

## MVP Recommendation

### Phase 1: CSS Detection + Prompt (Table Stakes)
**Complexity:** Low | **Platforms:** iOS + Android

**Must have:**
1. CSS media query orientation detection
2. `<OrientationPrompt>` component (overlay with rotate icon + message)
3. Custom hook `useOrientation()` returning `{ isPortrait, isLandscape }`
4. Conditional render: show prompt if portrait, hide if landscape
5. Landscape-optimized CSS for game components

**Implementation:**
```jsx
// Pseudo-code
function SightReadingGame() {
  const { isPortrait } = useOrientation();

  if (isPortrait) {
    return <OrientationPrompt message="Rotate your device for the best experience" />;
  }

  return <GameContent />;
}
```

**Why this order:**
- Works on **both iOS and Android** (no API restrictions)
- Solves core UX problem: music notation needs horizontal space
- Minimal code: CSS + one component + one hook
- No fullscreen/lock complexity

**Defer:** Fullscreen API, orientation lock, auto-rotate (requires platform detection, higher complexity)

### Phase 2: Optional Enhancements (Differentiators)
**Complexity:** Medium | **Platform:** Android only

**Nice to have:**
1. Fullscreen API integration on game start (Android)
2. Orientation lock after entering fullscreen (Android)
3. Auto-unlock on game exit
4. Platform detection to show fullscreen button only on Android

**Why defer:**
- iOS doesn't support these features
- Fullscreen requires user gesture (can't auto-trigger)
- Adds significant complexity (error handling, platform detection, state management)
- Phase 1 already solves 80% of the problem

### Phase 3: Polish (If Time Permits)
**Complexity:** Low

1. Animated rotate icon (Lottie or CSS animation)
2. Remember dismissal preference (localStorage)
3. i18n for rotate prompt message (English + Hebrew)
4. Accessibility: screen reader announcement when orientation changes

## Feature Prioritization Matrix

| Feature | Impact | Effort | Priority | Phase |
|---------|--------|--------|----------|-------|
| Orientation detection (CSS) | High | Low | P0 | MVP |
| Rotate prompt overlay | High | Low | P0 | MVP |
| `useOrientation()` hook | High | Low | P0 | MVP |
| Landscape CSS layout | High | Medium | P0 | MVP |
| Portrait fallback (degraded) | Medium | Medium | P1 | MVP |
| Fullscreen API (Android) | Medium | High | P2 | Phase 2 |
| Orientation lock (Android) | Low | High | P3 | Phase 2 |
| Animated icon | Low | Low | P4 | Phase 3 |
| Remember dismissal | Low | Low | P4 | Phase 3 |
| Auto-fullscreen | Low | High | P5 | Deferred |

## Platform-Specific Behavior Matrix

| Feature | iOS (iPhone) | iOS (iPad) | Android PWA | Web (Desktop) |
|---------|--------------|------------|-------------|---------------|
| CSS orientation detection | ✓ | ✓ | ✓ | ✓ |
| Rotate prompt overlay | ✓ | ✓ | ✓ | N/A (skip) |
| `screen.orientation` API | ✗ | ✓ (partial) | ✓ | ✓ |
| Orientation lock | ✗ | ✓ | ✓ | ✓ |
| Fullscreen API | ✗ (iPhone) | ✓ | ✓ | ✓ |
| PWA manifest `orientation` | Ignored | Ignored | ✓ | N/A |

**Key takeaway:** Build for lowest common denominator (iOS iPhone) = CSS + prompts. Enhance for Android with lock/fullscreen.

## UX Patterns from Research

### Pattern 1: Non-Blocking Prompt (Recommended)
**Used by:** Most mobile games, Symphony Pro, OKTAV

**Behavior:**
1. User starts game in portrait
2. Overlay appears: "For the best experience, rotate your device 📱→🔄"
3. User can dismiss or rotate
4. If rotated, overlay disappears; game continues
5. If dismissed, game continues in degraded portrait mode

**Why recommended:**
- Accessible (doesn't block users who can't rotate)
- Educational (explains *why* landscape is better)
- Respects user choice

### Pattern 2: Blocking Prompt (Anti-pattern for PWA)
**Used by:** Some native games

**Behavior:**
1. User starts game in portrait
2. Overlay blocks all interaction: "Please rotate to continue"
3. Game unplayable until rotated

**Why avoid:**
- Accessibility violation (users with locked orientation settings)
- Frustrating on shared devices (e.g., classroom tablets with forced portrait)
- Not suitable for 8-year-olds (may not understand how to rotate)

### Pattern 3: Auto-Rotate + Lock (Android Native Apps)
**Used by:** Racing games, AR apps

**Behavior:**
1. App manifest declares `orientation: landscape`
2. OS forces landscape on app launch
3. Orientation locked during gameplay

**Why not applicable:**
- iOS PWA ignores manifest `orientation` field
- Requires native app capabilities
- Overly restrictive for educational app (users browse in portrait, play in landscape)

## Recommended User Flow

### Entry Points
1. **Dashboard (portrait)** → User taps "Continue Learning"
2. **Trail map (any orientation)** → User taps node → Modal → "Start Practice"
3. **Game mode grid (portrait)** → User taps game card

### Game Lifecycle with Orientation

```
┌─────────────────────────────────────────────────────┐
│ 1. Settings Modal (works in both orientations)     │
│    User configures clef, difficulty, etc.          │
│    [Start Game] button clicked                     │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 2. Orientation Check                                │
│    If portrait → Show rotate prompt overlay         │
│    If landscape → Start game immediately            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 3. Gameplay (landscape optimized)                   │
│    VexFlow staves render full width                 │
│    Keyboard/tap area below staves                   │
│    Listen for orientation change                    │
│    If user rotates back to portrait → show prompt  │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 4. Victory Screen (works in both orientations)      │
│    Stats, stars, XP earned                          │
│    Buttons: "Play Again" / "Back to Trail"          │
└─────────────────────────────────────────────────────┘
```

### Key Decision: When to Show Prompt?

**Option A:** Before game start (during settings modal)
- ✓ User rotates before gameplay starts
- ✓ No interruption once playing
- ✗ Settings modal harder to use in landscape (text fields, dropdowns)

**Option B:** After clicking "Start Game" (before first exercise)
- ✓ Settings modal stays portrait-friendly
- ✓ Prompt appears when landscape is most needed
- ✓ User can rotate just before playing
- ✗ Slight delay between "Start" and actual gameplay

**Recommendation:** Option B (prompt after clicking "Start Game", before rendering first exercise)

**Rationale:**
- Settings modal has text inputs, dropdowns, toggles → easier in portrait
- VexFlow staves need landscape → prompt right before rendering
- Existing codebase has clear separation: `UnifiedGameSettings` → game components
- Integration point: Add `<OrientationGate>` wrapper in game components

## Accessibility Considerations

### For 8-Year-Old Audience

| Consideration | Implementation |
|---------------|----------------|
| **Simple language** | "Turn your device sideways" (not "rotate to landscape orientation") |
| **Visual cues** | Animated phone icon showing rotation direction |
| **Non-blocking** | Allow portrait play even if degraded (some kids use phones with cases that block rotation) |
| **No time pressure** | Don't auto-dismiss prompt; let child ask adult for help if needed |

### General Accessibility

| Consideration | Implementation |
|---------------|----------------|
| **Screen readers** | Announce orientation change: "Device rotated to landscape" |
| **Motor impairments** | Large dismiss button (48px minimum touch target) |
| **Reduced motion** | Respect `prefers-reduced-motion` for animated icon |
| **Locked orientation** | Respect device settings; don't force if OS prevents rotation |

## Technical Implementation Notes

### CSS Media Query Approach

**Pros:**
- Zero JavaScript required
- Works on all platforms
- No event listeners to clean up
- Instant re-render on orientation change

**Cons:**
- Can't programmatically lock orientation
- Can't detect specific angles (only portrait/landscape)

**Example:**
```css
/* Hide rotate prompt in landscape */
@media (orientation: landscape) {
  .rotate-prompt {
    display: none;
  }
}

/* Optimize game layout for landscape */
@media (orientation: landscape) {
  .game-container {
    flex-direction: row; /* Staves left, controls right */
  }
}
```

### JavaScript API Approach

**Pros:**
- Can lock orientation (Android)
- Can detect specific angles (0°, 90°, 180°, 270°)
- Can trigger fullscreen

**Cons:**
- Requires event listener setup/cleanup
- iOS support limited
- Must handle browser compatibility

**Example:**
```javascript
// Modern API (not supported on iOS iPhone)
screen.orientation.addEventListener('change', () => {
  console.log(screen.orientation.type); // "portrait-primary", "landscape-primary", etc.
});

// Lock to landscape (Android + user gesture required)
async function lockLandscape() {
  try {
    await screen.orientation.lock('landscape');
  } catch (err) {
    // iOS or permission denied
    console.warn('Orientation lock not supported');
  }
}
```

### React Hook Pattern

**Recommended implementation:**
```javascript
// Custom hook: useOrientation.js
import { useEffect, useState } from 'react';

export function useOrientation() {
  const [orientation, setOrientation] = useState(() => {
    // Initial state from matchMedia
    return window.matchMedia('(orientation: portrait)').matches
      ? 'portrait'
      : 'landscape';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: portrait)');

    const handleChange = (e) => {
      setOrientation(e.matches ? 'portrait' : 'landscape');
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
}
```

**Why this pattern:**
- Uses `matchMedia` (better browser support than `screen.orientation`)
- Works on iOS + Android
- Proper cleanup prevents memory leaks
- Synchronous initial state (no flash of wrong orientation)

## Open Questions & Research Gaps

### Unverified Assumptions (Need Testing)

1. **iOS PWA behavior:** Does installed PWA on iOS Home Screen behave differently than Safari? (Research didn't find definitive answer)
2. **Fullscreen + orientation lock interaction:** Does entering fullscreen automatically trigger orientation lock on Android? (Conflicting sources)
3. **Trail map orientation:** Should trail map also suggest landscape, or only game routes? (No precedent found in research)
4. **Settings modal orientation:** Is landscape settings modal unusable, or just suboptimal? (Need UX testing)

### Phase-Specific Research Needed

- **Phase 2 (Fullscreen API):** Deep dive into error handling, permission prompts, iOS fallback behavior
- **Phase 3 (Animation):** Performance testing of Lottie vs CSS animations on low-end Android devices
- **Post-MVP:** A/B testing of prompt copy ("Rotate device" vs "Turn sideways" vs icon-only)

## Confidence Assessment

| Area | Confidence | Evidence |
|------|------------|----------|
| **CSS orientation detection** | HIGH | MDN official docs, widespread use |
| **iOS limitations** | HIGH | Multiple sources confirm no iPhone support for lock API |
| **Android fullscreen + lock** | MEDIUM | Documented in MDN, but user gesture requirement varies by browser |
| **UX patterns (prompt overlay)** | MEDIUM | Common in games, but no formal design system documentation found |
| **Kids app precedent** | LOW | Duolingo/Khan Academy research inconclusive (no detailed orientation docs) |
| **Music notation apps** | MEDIUM | Symphony Pro/OKTAV confirmed landscape support, but implementation details sparse |

## Summary: What Users Expect

### For 8-Year-Olds Learning Piano

1. **Simple prompt:** "Turn your phone sideways" with visual icon
2. **Non-blocking:** Can still play in portrait if they want (or can't rotate)
3. **No complex interactions:** No buttons, settings, or choices in the prompt
4. **Immediate feedback:** Prompt disappears as soon as they rotate

### For Educational Apps (Duolingo, Khan Academy Model)

1. **Support both orientations:** App adapts, doesn't force
2. **Optimize for landscape where needed:** Games, videos, wide content
3. **Portrait-first navigation:** Menus, settings, text-heavy screens stay portrait

### For Music Notation Apps (Symphony Pro, OKTAV Model)

1. **Landscape mode available:** Users can choose when editing/viewing scores
2. **Toggle in settings:** Not forced on app launch
3. **Persistent preference:** Remember user's choice

### For Mobile Web Games (General Pattern)

1. **Detect orientation:** Show prompt if wrong orientation for game
2. **Allow dismissal:** Don't block gameplay entirely
3. **Auto-hide prompt:** Remove when user complies
4. **Landscape-optimized UI:** Controls, HUD, content arranged for horizontal view

## Final Recommendation

**Build Phase 1 (CSS + Prompt) for MVP.** This solves the core problem (VexFlow staves need horizontal space) without platform-specific complexity. Works on iOS + Android. Low risk, high value.

**Defer Phase 2 (Fullscreen + Lock) until post-MVP.** Nice-to-have for Android users, but not critical. iOS users won't benefit. Focus on table stakes first.

**Skip Phase 3 (Advanced Features) unless user feedback demands it.** Animated icons, dismissal memory, etc. are polish. Validate that Phase 1 works before investing in enhancements.

## Sources

### Mobile Game Orientation Best Practices
- [Guide to Screen Orientation: Optimize Your App Experience](https://www.devzery.com/post/guide-to-screen-orientation-optimize-your-app-experience)
- [Managing screen orientation - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation)
- [Should you Lock your App's Orientation?](https://webtoapp.design/blog/device-app-orientation)
- [3 Ways to Lock Screen Orientation With CSS & JS](https://code-boxx.com/lock-screen-orientation/)

### PWA Orientation API Compatibility
- [PWA on iOS - Current Status & Limitations for Users [2025]](https://brainhub.eu/library/pwa-on-ios)
- [iOS PWA Compatibility － firt.dev](https://firt.dev/notes/pwa-ios/)
- [How to Lock Screen Orientation in Your Progressive Web App (PWA) Using manifest.json](https://nashatech.com/blogs/sXOqruRY2ECD5EIVqwP9/)
- [Realizing a PWA Screen Orientation Lock](https://hearthero.medium.com/locking-orientation-for-ionic-pwas-7c75c5bb3639)

### Music Notation Apps
- [Learn Piano – OKTAV App](https://apps.apple.com/us/app/learn-piano-oktav/id6466106363)
- [Symphony Pro for iPad](https://symphonypro.net/static/SP3/index.html)
- [Music Tutor (Sight-reading) App](https://apps.apple.com/ca/app/music-tutor-sight-reading/id514363426)

### Educational Game UX Patterns
- [Educational Game Development Best Practices: Animation and Voiceover](https://www.filamentgames.com/blog/educational-game-development-best-practices-animation-and-voiceover/)
- [Prompting readers to rotate their phones — Joshua Bartz](https://www.jshbrtz.com/posts/desktop-screenshots-on-mobile/)
- [Mobile UX - orientation](https://openinclusion.com/blog/mobile-ux-orientation/)

### Fullscreen API & User Gestures
- [Using the Fullscreen API without gestures | ChromeOS.dev](https://chromeos.dev/en/posts/using-the-fullscreen-api-without-gestures)
- [User Gesture Restricted Web APIs](https://plainenglish.io/blog/user-gesture-restricted-web-apis)
- [App design | web.dev](https://web.dev/learn/pwa/app-design)
- [PWAs Power Tips － firt.dev](https://firt.dev/pwa-design-tips/)

### CSS Media Queries & Orientation Detection
- [orientation - CSS | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/orientation)
- [How to Detect Device Orientation with CSS Media Queries](https://www.w3docs.com/snippets/css/how-to-detect-device-orientation-with-css-media-queries.html)
- [CSS Orientation Media Queries: Complete Guide](https://codelucky.com/css-orientation-media-queries/)

### React Hooks for Orientation
- [Using React Hooks for Device Orientation | UXPin](https://www.uxpin.com/studio/blog/using-react-hooks-for-device-orientation/)
- [useOrientation React Hook – useHooks](https://usehooks.com/useorientation)
- [ReactJS useOrientation Custom Hook | GeeksforGeeks](https://www.geeksforgeeks.org/reactjs-useorientation-custom-hook/)
- [Let`s create a custom hook useScreenOrientation](https://medium.com/@perenciolo659/let-s-create-a-custom-hook-usescreenorientation-e5f66919b8b)
- [GitHub - bence-toth/react-hook-screen-orientation](https://github.com/bence-toth/react-hook-screen-orientation)

### Screen Orientation API
- [Window: orientationchange event - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/orientationchange_event)
- [ScreenOrientation: change event - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/change_event)
- [Screen Orientation](https://w3c.github.io/screen-orientation/)
- [ScreenOrientation - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation)
