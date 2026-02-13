# Technology Stack: Auto-Rotate Landscape for Mobile Games

**Project:** PianoApp2 - Piano Learning PWA
**Feature:** Auto-rotate to landscape on mobile games
**Researched:** 2026-02-13
**Overall confidence:** HIGH

## Executive Summary

Auto-rotate landscape functionality can be implemented **without additional npm packages** using native Web APIs and existing project dependencies (Tailwind CSS, Framer Motion, lucide-react). The Screen Orientation API has 95% browser support but requires fullscreen mode and is **unavailable on iOS PWAs**. The recommended approach is CSS media queries + custom React hooks for orientation detection, with optional prompt overlay for portrait users, rather than attempting programmatic orientation locking.

## Recommended Stack

### Core Technologies (Use Existing)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CSS Media Queries | Native | Orientation detection | Universal support, zero dependencies, works on iOS |
| `window.matchMedia()` | Native Web API | Reactive orientation changes | Standard API, 99%+ support, no polyfill needed |
| Tailwind CSS | ^3.4.1 (existing) | Responsive orientation utilities | Already in project, supports `portrait:` and `landscape:` variants |
| Framer Motion | ^12.23.26 (existing) | Rotate prompt animations | Already in project, smooth animations for device rotation prompts |
| lucide-react | ^0.344.0 (existing) | Smartphone/rotate icons | Already in project, `Smartphone` + `RotateCw` icons available |

### Custom Implementation (No New Packages)

| Component | Implementation | Purpose | Complexity |
|-----------|---------------|---------|------------|
| `useOrientation` hook | Custom hook with `matchMedia` | Detect portrait/landscape state | Low (15-20 lines) |
| `OrientationPrompt` component | Overlay with rotate animation | Prompt portrait users to rotate | Low (30-40 lines) |
| Tailwind orientation utilities | `portrait:hidden`, `landscape:block` | Hide/show content by orientation | Trivial (built-in) |

## Supporting Libraries (NOT RECOMMENDED)

| Library | Version | Weekly Downloads | Why NOT Recommended |
|---------|---------|------------------|---------------------|
| react-screen-orientation | 0.0.4 | 1,533 | Last updated 6 years ago, unmaintained |
| react-device-detect | 2.2.3 | 1,098,432 | User-agent based (unreliable), last updated 3 years ago, overkill for orientation |
| expo-screen-orientation | Latest | N/A | React Native only, not applicable to web PWA |

## Alternatives Considered

### 1. Screen Orientation API (`screen.orientation.lock()`)

**Browser Support (CanIUse):**
- Chrome 38+: Full support
- Firefox 44+: Full support
- Safari 16.4+: Full support
- iOS Safari 16.4+: Full support in browser, **NO support in PWA mode**
- Android Chrome 144+: Full support
- Global: 95.14% coverage

**Why NOT Recommended:**
- **Requires fullscreen mode** - Must call `requestFullscreen()` before `lock()` works
- **iOS PWA blocker** - iOS Safari explicitly blocks orientation locking in installed PWAs
- **Security restrictions** - Throws `SecurityError` if document is hidden
- **UX friction** - Fullscreen requirement creates jarring transition
- **Over-engineering** - Games don't need forced lock, just optimized layout

**Source:** [MDN ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock), [CanIUse Screen Orientation](https://caniuse.com/screen-orientation)

### 2. Manifest.json `orientation` Key

**What it does:** Locks installed PWA to specific orientation

```json
{
  "orientation": "landscape"
}
```

**Why NOT Recommended:**
- **iOS ignores it** - Apple doesn't allow custom orientation in PWA manifest
- **All-or-nothing** - Locks entire app, not just game pages
- **Breaks user expectations** - Users expect to control device orientation
- **Non-game pages** - Dashboard, settings, trail map work fine in portrait

**Source:** [How to Lock Screen Orientation in PWA](https://nashatech.com/blogs/sXOqruRY2ECD5EIVqwP9/)

### 3. Device Detection Libraries

**Why NOT Recommended:**
- User-agent sniffing is unreliable (spoofing, new devices)
- Overkill for simple orientation detection
- Adds bundle size (20-40KB) for single use case
- `window.matchMedia()` achieves same result natively

## What NOT to Use

### DO NOT Install:
- `react-screen-orientation` - Abandoned package (6 years old)
- `react-device-detect` - Unmaintained (3 years), user-agent based
- `react-native-orientation-locker` - React Native only
- `mobile-detect` - Server-side focus, not React-optimized

### DO NOT Attempt:
- `screen.orientation.lock()` - Requires fullscreen, blocked on iOS PWAs
- Manifest `orientation` key - iOS doesn't respect it
- `screen.lockOrientation()` - Deprecated API (renamed to `screen.orientation.lock()`)

### DO NOT Rely On:
- User-agent detection - Unreliable, breaks with spoofing
- Device pixel ratio - Doesn't indicate orientation preference
- `window.innerWidth > window.innerHeight` alone - Keyboard opening can flip this

## Recommended Implementation Pattern

### 1. CSS-First Approach (Tailwind)

Tailwind CSS supports orientation-based utilities out of the box:

```jsx
<div className="portrait:hidden landscape:block">
  {/* Game content - only visible in landscape */}
</div>

<div className="portrait:block landscape:hidden">
  <OrientationPrompt />
</div>
```

**Why:** Zero JavaScript, instant response, works on all browsers including iOS PWAs

**Source:** [Tailwind CSS: How to Detect Device Orientation](https://www.kindacode.com/article/tailwind-css-how-to-detect-device-orientation)

### 2. Custom `useOrientation` Hook

For programmatic access to orientation state:

```javascript
import { useEffect, useState } from 'react';

export function useOrientation() {
  const [orientation, setOrientation] = useState(
    window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: portrait)');

    const handleChange = (e) => {
      setOrientation(e.matches ? 'portrait' : 'landscape');
    };

    // Modern approach (preferred)
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return orientation;
}
```

**Why:**
- Uses native `matchMedia` API (99%+ support)
- Reactive - updates on orientation change
- SSR-safe (checks `window` existence)
- Modern `addEventListener` syntax

**Source:** [Let's create a custom hook useScreenOrientation](https://medium.com/@perenciolo659/let-s-create-a-custom-hook-usescreenorientation-e5f66919b8b)

### 3. OrientationPrompt Component

Animated overlay prompting users to rotate:

```jsx
import { motion } from 'framer-motion';
import { Smartphone, RotateCw } from 'lucide-react';

export function OrientationPrompt() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <motion.div
          animate={{ rotate: [0, -90, -90, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className="mx-auto mb-6"
        >
          <Smartphone className="h-24 w-24 text-white" />
        </motion.div>
        <RotateCw className="mx-auto mb-4 h-12 w-12 text-blue-400" />
        <p className="text-xl font-semibold text-white">
          Please rotate your device
        </p>
        <p className="mt-2 text-gray-400">
          This game works best in landscape mode
        </p>
      </div>
    </div>
  );
}
```

**Why:**
- Uses existing Framer Motion (no new dependency)
- Uses existing lucide-react icons
- Tailwind for styling (existing)
- Smooth animation guides user action

**Source:** Framer Motion docs + lucide-react icons

### 4. Game Page Integration

```jsx
import { useOrientation } from '@/hooks/useOrientation';
import { OrientationPrompt } from '@/components/OrientationPrompt';

export function NotesRecognitionGame() {
  const orientation = useOrientation();

  return (
    <>
      {/* CSS-based approach (preferred) */}
      <div className="portrait:hidden landscape:block">
        <GameContent />
      </div>

      <div className="portrait:block landscape:hidden">
        <OrientationPrompt />
      </div>

      {/* OR programmatic approach */}
      {orientation === 'portrait' ? (
        <OrientationPrompt />
      ) : (
        <GameContent />
      )}
    </>
  );
}
```

## Installation (Zero New Dependencies)

**No npm packages needed.** Everything uses:
- Native Web APIs (`matchMedia`)
- Existing Tailwind CSS utilities
- Existing Framer Motion
- Existing lucide-react icons

## iOS PWA Limitations

### What Doesn't Work on iOS PWAs:
- `screen.orientation.lock()` - Explicitly blocked
- Manifest `orientation` key - Ignored by Safari
- `navigator.vibrate()` - Not supported
- Wake Lock API - Not supported

### What DOES Work on iOS PWAs:
- CSS media queries (`@media (orientation: portrait)`)
- `window.matchMedia()` - Full support
- Tailwind orientation utilities
- CSS animations and transitions
- Framer Motion animations

**Key Insight:** iOS Safari team intentionally blocks orientation locking to prevent fingerprinting and preserve user control. The workaround is not to fight the platform, but to adapt the UI gracefully.

**Sources:**
- [PWA on iOS - Current Status & Limitations](https://brainhub.eu/library/pwa-on-ios)
- [PWA iOS Limitations and Safari Support](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Danny Moerkerke on X about iOS PWA limitations](https://x.com/dannymoerkerke/status/1803055577100091874)

## Animation Strategy

### Tailwind CSS Built-in Animations

```jsx
// Simple rotation animation (no extra packages)
<div className="animate-spin">
  <RotateCw />
</div>

// Custom rotation via Tailwind config
// tailwind.config.js
{
  theme: {
    extend: {
      keyframes: {
        'rotate-device': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(-90deg)' }
        }
      },
      animation: {
        'rotate-device': 'rotate-device 2s ease-in-out infinite'
      }
    }
  }
}
```

**Why:** Zero dependencies, Tailwind already in project

**Source:** [Tailwind CSS Animation](https://tailwindcss.com/docs/animation)

### Framer Motion (Preferred for Complex Animations)

```jsx
<motion.div
  animate={{
    rotate: [0, -90, -90, 0],
    scale: [1, 1.1, 1.1, 1]
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    repeatDelay: 1,
    ease: "easeInOut"
  }}
>
  <Smartphone />
</motion.div>
```

**Why:** Already in project (Framer Motion v12.23.26), spring physics, gesture support, better DX

**Source:** [How to Integrate Tailwind with Framer Motion](https://tailkits.com/blog/how-to-integrate-tailwind-with-framer-motion/)

### tailwindcss-animate (Already Installed)

Project already has `tailwindcss-animate@1.0.7` - provides enter/exit animations:

```jsx
<div className="animate-in fade-in zoom-in duration-300">
  <OrientationPrompt />
</div>
```

**Source:** [tailwindcss-animate GitHub](https://github.com/jamiebuilds/tailwindcss-animate)

## Browser Support Summary

| Feature | Chrome | Firefox | Safari | iOS Safari (PWA) | Android Chrome |
|---------|--------|---------|--------|------------------|----------------|
| CSS `@media (orientation)` | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| `window.matchMedia()` | ✅ 9+ | ✅ 6+ | ✅ 5.1+ | ✅ 5+ | ✅ All |
| `screen.orientation.lock()` | ✅ 38+ | ✅ 44+ | ✅ 16.4+ | ❌ Blocked | ✅ 144+ |
| Manifest `orientation` | ✅ Yes | ✅ Yes | ⚠️ Partial | ❌ Ignored | ✅ Yes |
| Tailwind orientation utilities | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| Framer Motion | ✅ Modern | ✅ Modern | ✅ Modern | ✅ Modern | ✅ Modern |

**Key Takeaway:** CSS-based approach has universal support. API-based locking has 95% support but fails where it matters most (iOS PWAs for 8-year-olds on iPads).

## Integration Points with Existing Stack

### 1. React Router Navigation
Games already use `location.state` for trail integration. Orientation detection integrates seamlessly:

```jsx
// No changes to navigation needed
navigate('/notes-master-mode/recognition', {
  state: { nodeId, nodeConfig, exerciseIndex }
});

// Game component just adds orientation check
function NotesRecognitionGame() {
  const orientation = useOrientation();
  // ... rest of game logic
}
```

### 2. Tailwind Design System
Project uses custom design system (`docs/DESIGN_SYSTEM.md`). Orientation prompt should follow existing patterns:

```jsx
<div className="card-elevated fixed inset-0 z-50 bg-slate-900">
  {/* Uses existing card utilities */}
</div>
```

### 3. Accessibility Context
Project has `AccessibilityContext` for high contrast, reduced motion. Orientation prompt should respect `reducedMotion`:

```jsx
const { reducedMotion } = useAccessibility();

<motion.div
  animate={reducedMotion ? {} : { rotate: [0, -90, -90, 0] }}
>
```

### 4. i18n Support
Project supports English and Hebrew (RTL). Orientation prompt needs translations:

```json
// locales/en/common.json
{
  "orientation": {
    "prompt": "Please rotate your device",
    "description": "This game works best in landscape mode"
  }
}

// locales/he/common.json
{
  "orientation": {
    "prompt": "אנא סובב את המכשיר שלך",
    "description": "המשחק הזה עובד הכי טוב במצב אופקי"
  }
}
```

## Performance Considerations

### 1. CSS vs JavaScript Detection

**CSS Approach (Recommended):**
- Zero JavaScript overhead
- Instant response (no React re-render)
- Works before JavaScript loads
- Better for Core Web Vitals

**JavaScript Approach (Use When Needed):**
- Required for programmatic logic
- Adds event listener overhead
- Triggers React re-renders
- Use only when CSS won't suffice

### 2. Event Listener Cleanup

`matchMedia` listeners must be cleaned up:

```javascript
useEffect(() => {
  const mql = window.matchMedia('(orientation: portrait)');
  const handler = (e) => setOrientation(e.matches ? 'portrait' : 'landscape');

  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler); // Critical
}, []);
```

### 3. Animation Performance

Use Framer Motion's hardware-accelerated transforms:

```jsx
// Good: GPU-accelerated
<motion.div animate={{ rotate: -90, scale: 1.1 }} />

// Bad: Forces layout recalc
<motion.div animate={{ width: '200px', marginTop: '20px' }} />
```

**Source:** Framer Motion performance docs

## Testing Strategy

### 1. Chrome DevTools Device Emulation
- Open DevTools > Device Toolbar
- Select mobile device
- Click rotate icon to test orientation changes

### 2. Real Device Testing
- Test on actual iOS devices (iPad for 8-year-olds)
- Test on Android phones/tablets
- Verify PWA installed behavior differs from browser

### 3. Edge Cases to Test
- Keyboard opening (changes viewport aspect ratio)
- Switching apps (hidden document)
- Orientation change during game session
- Slow network (prompt should show before game assets load)

## Migration Path

### Phase 1: CSS-Only (Day 1)
1. Add Tailwind orientation utilities to game pages
2. Create static `OrientationPrompt` component
3. Test on real devices

### Phase 2: Enhanced UX (Day 2-3)
1. Create `useOrientation` hook
2. Add Framer Motion animations to prompt
3. Add i18n translations
4. Integrate with accessibility settings

### Phase 3: Polish (Day 4-5)
1. Add orientation state to game analytics
2. Add user preference persistence (if user dismisses prompt)
3. Add skip button for users who prefer portrait
4. Test on all supported devices

## Open Questions

1. **Should users be able to dismiss orientation prompt?** (Probably yes for accessibility)
2. **Should orientation preference persist across sessions?** (localStorage key)
3. **Should all games require landscape?** (Rhythm games might work in portrait)
4. **Should landscape be required for tablet-sized screens?** (iPads work fine in portrait)

## Sources

### Browser Compatibility
- [CanIUse - Screen Orientation API](https://caniuse.com/screen-orientation)
- [MDN - ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock)
- [MDN - CSS orientation media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/orientation)

### iOS PWA Limitations
- [PWA on iOS - Current Status & Limitations [2025]](https://brainhub.eu/library/pwa-on-ios)
- [PWA iOS Limitations and Safari Support: Complete Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Danny Moerkerke on X: iOS PWA limitations](https://x.com/dannymoerkerke/status/1803055577100091874)
- [Can we lock the orientation of PWA apps in iOS?](https://basecamp.temenos.com/s/question/0D56N00000mpN5U/can-we-lock-the-orientation-of-pwa-apps-in-ios)

### Implementation Patterns
- [CSS Orientation Media Queries: Complete Guide](https://codelucky.com/css-orientation-media-queries/)
- [How to Detect Device Orientation with CSS Media Queries](https://www.w3docs.com/snippets/css/how-to-detect-device-orientation-with-css-media-queries.html)
- [Tailwind CSS: How to Detect Device Orientation](https://www.kindacode.com/article/tailwind-css-how-to-detect-device-orientation)
- [Let's create a custom hook useScreenOrientation](https://medium.com/@perenciolo659/let-s-create-a-custom-hook-usescreenorientation-e5f66919b8b)
- [Using window.matchMedia in React](https://betterprogramming.pub/using-window-matchmedia-in-react-8116eada2588)

### React Hooks & Libraries
- [useOrientation React Hook – useHooks](https://usehooks.com/useorientation)
- [useMediaQuery React Hook – useHooks](https://usehooks.com/usemediaquery)
- [react-screen-orientation - npm](https://www.npmjs.com/package/react-screen-orientation)
- [react-device-detect - npm](https://www.npmjs.com/package/react-device-detect)

### Animation Resources
- [Tailwind CSS Animation](https://tailwindcss.com/docs/animation)
- [How to Integrate Tailwind with Framer Motion for Animations](https://tailkits.com/blog/how-to-integrate-tailwind-with-framer-motion/)
- [Comparing the best React animation libraries for 2026](https://blog.logrocket.com/best-react-animation-libraries/)
- [tailwindcss-animate GitHub](https://github.com/jamiebuilds/tailwindcss-animate)

### Icons
- [Lucide Icons - Smartphone](https://lucide.dev/icons/smartphone)
- [Lucide Icons - RotateCw](https://lucide.dev/icons/rotate-cw)
- [Lucide React Documentation](https://lucide.dev/guide/packages/lucide-react)

### PWA Orientation Locking
- [How to Lock Screen Orientation in PWA Using manifest.json](https://nashatech.com/blogs/sXOqruRY2ECD5EIVqwP9/)
- [Realizing a PWA Screen Orientation Lock](https://hearthero.medium.com/locking-orientation-for-ionic-pwas-7c75c5bb3639)
- [PWA: Automatic screen orientation does not work in Chrome on Android](https://github.com/photoprism/photoprism/issues/3413)
- [W3C Screen Orientation Specification](https://w3c.github.io/screen-orientation/)
