---
phase: 02-foundation-orientation-detection-prompt
plan: 01
subsystem: orientation-detection
tags: [hooks, ui-components, framer-motion, responsive]
dependency_graph:
  requires: [useIsMobile, useMotionTokens, framer-motion, lucide-react]
  provides: [useOrientation, useRotatePrompt, RotatePromptOverlay]
  affects: []
tech_stack:
  added: []
  patterns: [matchMedia-listener, localStorage-persistence, function-initializer-useState]
key_files:
  created:
    - src/hooks/useOrientation.js
    - src/hooks/useRotatePrompt.js
    - src/components/orientation/RotatePromptOverlay.jsx
  modified: []
decisions:
  - decision: "Use function initializer in useState for synchronous orientation detection"
    rationale: "Avoids flash of incorrect state on first render (SSR-safe pattern from useIsMobile.js)"
  - decision: "Tilting phone animation (-15deg to 80deg) for playfulness"
    rationale: "Engaging for 8-year-old target audience, visually demonstrates the rotation action"
  - decision: "Text-only dismiss button (no X icon)"
    rationale: "Per user decision: simple 'Play anyway' button, WCAG 1.3.4 escape hatch requirement"
  - decision: "localStorage key 'pianoapp-rotate-dismissed' for permanent dismiss"
    rationale: "Matches existing app naming convention (pianoapp- prefix)"
metrics:
  duration: 139s
  tasks_completed: 2
  files_created: 3
  commits: 2
  completed_date: 2026-02-13
---

# Phase 02 Plan 01: Orientation Detection Hooks & Rotate Prompt Summary

**One-liner:** Reactive orientation detection via matchMedia with full-screen animated rotate prompt overlay (tilting phone icon with mini piano keys, playful 8-year-old text, permanent dismiss via localStorage).

## Objective Achieved

Created three foundation files for orientation detection and rotate prompt:
1. **useOrientation hook** - Reactive orientation state with synchronous first-render value
2. **useRotatePrompt hook** - Encapsulates visibility logic (permanent dismiss, auto-dismiss on landscape, re-show-once)
3. **RotatePromptOverlay component** - Full-screen blocking overlay with animated tilting phone and "Play anyway" button

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create useOrientation and useRotatePrompt hooks | e592d8a | useOrientation.js, useRotatePrompt.js |
| 2 | Build RotatePromptOverlay with animated phone icon | bad64ab | RotatePromptOverlay.jsx |

## Implementation Details

### useOrientation Hook
- **Pattern:** Follows useIsMobile.js exactly - matchMedia listener with Safari fallback
- **SSR-safe:** Returns "portrait" when window is undefined
- **Synchronous init:** Uses `useState(() => getOrientation())` function initializer to read orientation on first render (no flash)
- **Exports:** `{ orientation, isPortrait, isLandscape }`

### useRotatePrompt Hook
- **Permanent dismiss:** Reads/writes `localStorage.getItem("pianoapp-rotate-dismissed")`
- **Auto-dismiss:** When `isPortrait` transitions false (landscape rotation), sets `hasAutoDismissed` flag
- **Re-show once:** After first auto-dismiss, allows ONE more show when user rotates back to portrait (tracked via `reshowUsed` ref)
- **Desktop filter:** Never shows on desktop (`!isMobile`)
- **Logic chain:**
  1. If permanentlyDismissed → false
  2. If !isMobile → false
  3. If !isPortrait → false (auto-dismissed)
  4. If hasAutoDismissed AND reshowUsed → false
  5. Otherwise → true
- **Exports:** `{ shouldShowPrompt, dismissPrompt }`

### RotatePromptOverlay Component
- **Full-screen blocking:** `fixed inset-0 z-[9999]` with dark gradient overlay (`from-slate-900/95 via-slate-800/95 to-slate-900/95`)
- **Animated phone icon:**
  - Tilting animation: `rotate: [-15, 80]` (portrait to landscape) with 1.5s duration, infinite reverse loop
  - Lucide `Smartphone` icon (size 120, text-blue-400)
  - Mini piano keys overlay: 5-key pattern (white-black-white-black-white) using absolute positioning with scale-[0.35]
  - Music note emoji (🎵) for playfulness
- **Text (playful for 8-year-olds):**
  - Heading: "Turn Your Phone Sideways!" (text-3xl font-bold)
  - Subtext: "Games work best when your phone is sideways" (text-lg text-white/80)
- **Dismiss button:** Text-only "Play anyway" button (text-white/60 hover:text-white) - no X icon per user decision
- **Animations:** Smooth fade in/out via framer-motion with `useMotionTokens().fade` duration
- **Phase 05 TODO:** Comment added for gating animation with AccessibilityContext reducedMotion

## Technical Patterns

### Function Initializer useState (No Flash Pattern)
```javascript
// Synchronous first-render value
const [orientation, setOrientation] = useState(() => getOrientation());
```
This pattern ensures orientation state is correct on first render, avoiding a flash of incorrect state.

### Safari Fallback for matchMedia Listeners
```javascript
if (typeof mq.addEventListener === "function") {
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
// Safari fallback
mq.addListener(onChange);
return () => mq.removeListener(onChange);
```

### Re-show Once Logic
Uses `useRef` (not state) to track reshow status and avoid extra renders:
```javascript
const reshowUsed = useRef(false);
const previousIsPortrait = useRef(isPortrait);

useEffect(() => {
  if (previousIsPortrait.current === false && isPortrait === true && hasAutoDismissed && !reshowUsed.current) {
    reshowUsed.current = true; // Only happens once
  }
  previousIsPortrait.current = isPortrait;
}, [isPortrait, hasAutoDismissed, permanentlyDismissed, isMobile]);
```

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points for Next Plan (02-02)

These files are ready for game integration:
- Game components will import `useRotatePrompt` and `RotatePromptOverlay`
- Pattern: `const { shouldShowPrompt, dismissPrompt } = useRotatePrompt()`
- Render overlay conditionally: `{shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}`
- Games to integrate: SightReadingGame, NotesRecognitionGame, MetronomeTrainer

## Verification Results

- ✅ All three files created with correct exports
- ✅ Build succeeds with no import errors (`npm run build`)
- ✅ useOrientation follows useIsMobile.js pattern (matchMedia, Safari fallback, function initializer)
- ✅ useRotatePrompt handles all visibility logic (permanent dismiss, auto-dismiss, re-show once, desktop filter)
- ✅ RotatePromptOverlay matches all locked user decisions:
  - Tilting phone animation ✓
  - Illustrated phone with mini piano keys ✓
  - Playful text for 8-year-olds ✓
  - Dark semi-transparent overlay ✓
  - "Play anyway" text button only (no X icon) ✓
  - Phase 05 TODO comment for reducedMotion ✓

## Self-Check: PASSED

**Files created:**
- ✓ FOUND: src/hooks/useOrientation.js
- ✓ FOUND: src/hooks/useRotatePrompt.js
- ✓ FOUND: src/components/orientation/RotatePromptOverlay.jsx

**Commits:**
- ✓ FOUND: e592d8a (Task 1 - hooks)
- ✓ FOUND: bad64ab (Task 2 - component)

**Build status:**
- ✓ PASSED: npm run build (no import errors, dist generated)
