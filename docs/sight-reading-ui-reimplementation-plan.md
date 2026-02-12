## Overview

This document describes a **from-scratch re‑implementation of the sight‑reading game UI layout**, while **reusing all existing game logic, hooks, and components** (audio, mic, pattern generation, scoring, etc.).

The goal is to:

- **Eliminate recurring layout/overflow bugs** (missing keyboard, hidden Start Playing button, double scrollbars, blank white areas).
- **Provide a native‑app feel on desktop**: no outer/page scrolling at common resolutions, no nested scrollbars.
- **Keep mobile behavior predictable**: minimal scrolling, with at most a single vertical scrollbar when absolutely necessary.

The plan is organized into phases. Each phase should be completed and tested before moving on.

---

## Phase 0 – Principles and Constraints

- **Do NOT touch game logic**:
  - Reuse `usePatternGeneration`, `useRhythmPlayback`, `useTimingAnalysis`, mic input, scoring, and session context as‑is.
  - Reuse `VexFlowStaffDisplay`, `KlavierKeyboard`, `FeedbackSummary`, and audio-related components.
- **All work in this plan is about layout and presentation only.**
- **Single source of truth for layout**:
  - One dedicated layout component is responsible for arranging:
    - Header (back button, exercise info, controls).
    - Staff region.
    - Guidance / Start Playing button.
    - Keyboard region.
  - No scattered layout decisions in multiple places.
- **One scrolling strategy per breakpoint**:
  - Desktop (≥ `md`): no page scroll in the game route; everything fits into a single `h-screen` layout.
  - Mobile (< `md`): allow page scroll **once** if needed (no nested scroll containers).

---

## Phase 1 – Extract Layout Responsibilities

### 1.1 Identify layout vs. logic in `SightReadingGame`

- Open `[src/components/games/sight-reading-game/SightReadingGame.jsx]`.
- Conceptually split the file into:
  - **Logic & state**:
    - Imports, hooks (`useState`, `useEffect`, `useMemo`, `useRef`).
    - Game phase management (`GAME_PHASES`).
    - Mic & audio handling.
    - Session context usage.
    - Pattern generation, scoring, feedback.
  - **Layout & JSX for rendering**:
    - The `return (...)` block from roughly:
      - The main `div` with `h-screen` and gradient background.
      - Header / top bar.
      - Count‑in overlay.
      - Main content section (staff, Start Playing guidance, keyboard, feedback).

### 1.2 Define a dedicated layout component

- Plan to create a new presentational component, for example:
  - `SightReadingLayout` in `[src/components/games/sight-reading-game/components/SightReadingLayout.jsx]`.
- High‑level responsibilities:
  - Accept **render props** for the main regions, without knowing game logic:
    - `headerControls` (BPM pill, mic/keyboard toggle, metronome, settings).
    - `staff` (the `VexFlowStaffDisplay` wrapper).
    - `guidance` (Start Playing button or small text).
    - `keyboard` (on‑screen keyboard or empty placeholder).
    - `feedbackPanel` (visible in feedback phase).
  - Handle all flex/grid/overflow logic for:
    - Desktop vs. mobile.
    - Staff / guidance / keyboard stacking.
  - Expose a minimal set of props:
    - `phase` (e.g. `"setup" | "display" | "count-in" | "performance" | "feedback"`).
    - `hasKeyboard` (boolean).
    - `isFeedbackPhase` (boolean).
    - `isCompactLandscape` (optional layout hint, already computed in `SightReadingGame`).

> **Key rule**: `SightReadingLayout` must be “dumb” – it knows nothing about audio, timing, or scoring; it only arranges views.

---

## Phase 2 – Implement `SightReadingLayout` with Dummy Content

### 2.1 Create the new file

- Create `[src/components/games/sight-reading-game/components/SightReadingLayout.jsx]`.
- Initial skeleton:

```jsx
export function SightReadingLayout({
  phase,
  hasKeyboard,
  isFeedbackPhase,
  isCompactLandscape,
  headerControls,
  staff,
  guidance,
  keyboard,
  feedbackPanel,
}) {
  // Temporary: render simple boxes instead of real content
  return (
    <div className="relative flex h-screen flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      {/* header */}
      {/* main area */}
    </div>
  );
}
```

### 2.2 Implement desktop grid/flex layout with placeholders

- Inside `SightReadingLayout`, implement layout using either:
  - **Option A:** Flexbox with column directions and fixed region heights.
  - **Option B:** CSS Grid with explicit row tracks.
- Suggested simple flex approach:
  - Root: `h-screen flex flex-col`.
  - Header: fixed height (`64px`–`72px`) using `flex-shrink-0`.
  - Main: `flex-1 flex flex-col` with:
    - White card centered horizontally (`max-w-5xl w-full`).
    - Inside the card:
      - Staff region: `flex-1 min-h-[120px]`.
      - Guidance: `flex-shrink-0 py-2`.
      - Keyboard: `flex-shrink-0 h-[clamp(120px,18vh,180px)]`.
- For now, ignore mobile; aim to make **desktop at 1080p** look perfect with placeholder divs.

### 2.3 Add mobile behavior

- For `< md` breakpoints:
  - Allow page scroll:
    - Root: `overflow-y-auto md:overflow-hidden`.
  - Optionally reduce keyboard and staff minimum heights:
    - `sm:h-[clamp(120px, 22vh, 180px)]` (tune after testing).
  - Ensure there is exactly **one** scrolling container on mobile (the root or the browser page), not nested scroll regions.

### 2.4 Test with placeholders

Manually validate using dummy colored boxes (no game integration yet):

- Desktop fullscreen @100% zoom:
  - All three bands (staff, guidance, keyboard) visible at once, no scrollbars.
- Desktop windowed (slightly shorter height):
  - If content exceeds height, exactly **one** vertical scrollbar appears (root/page).
  - Guidance and keyboard remain accessible.
- Mobile portrait & landscape (DevTools):
  - Staff, Start button, and keyboard either fit or require a single vertical scroll; no nested scrollbars.

Only move on when the layout works in isolation.

---

## Phase 3 – Wire `SightReadingLayout` into `SightReadingGame`

### 3.1 Replace inline layout in `SightReadingGame`

- In `SightReadingGame`, within the main `return` block:
  - Replace the large JSX hierarchy that includes:
    - The gradient `div` with `h-screen`.
    - Header, main content, staff wrapper, guidance, keyboard.
  - With a single `SightReadingLayout` usage:

```jsx
return (
  <SightReadingLayout
    phase={gamePhase}
    hasKeyboard={shouldShowKeyboard}
    isFeedbackPhase={isFeedbackPhase}
    isCompactLandscape={isCompactLandscape}
    headerControls={/* mic/BPM/metronome/settings buttons */}
    staff={/* VexFlowStaffDisplay wrapper */}
    guidance={/* Start button / phase text derived from gamePhase */}
    keyboard={/* KlavierKeyboard wrapper or null when not shown */}
    feedbackPanel={/* FeedbackSummary when isFeedbackPhase */}
  />
);
```

### 3.2 Map existing logic to render props

- **Staff (`staff` prop)**:
  - Reuse the current `<VexFlowStaffDisplay ... />` invocation.
  - Wrap it minimally to match the expectations of `SightReadingLayout` (e.g., no extra padding/margins inside).

- **Guidance (`guidance` prop)**:
  - For `DISPLAY` phase:
    - Render the Start Playing button that calls `beginPerformanceWithPattern`.
  - For `COUNT_IN` and `PERFORMANCE`:
    - Render small text labels (no button).
  - For other phases:
    - Optionally render nothing.

- **Keyboard (`keyboard` prop)**:
  - Render `<KlavierKeyboard />` when:
    - `shouldShowKeyboard === true` (derived from `inputMode`, clef, and phase).
  - Otherwise pass `null` or an empty fragment.

- **Feedback panel (`feedbackPanel` prop)**:
  - Render the existing `FeedbackSummary` card when in feedback phase.
  - Leave `null` for other phases.

- **Header controls (`headerControls` prop)**:
  - Move the mic/keyboard toggle, BPM pill, metronome toggle, and settings button into a small header component that can be passed in as JSX.

> **Important:** Do not move logic out of `SightReadingGame`. Only extract the JSX fragments into props passed to `SightReadingLayout`.

---

## Phase 4 – Clean Up Old Layout Code

Once `SightReadingLayout` is working and wired up:

- Remove obsolete layout-specific Tailwind classes from `SightReadingGame`:
  - Any lingering `min-h-0 flex-1` combos that are no longer needed.
  - Any `overflow-y-auto` within the main content that was part of the old layout.
- Ensure no direct references to `.sightreading-staff-wrapper` or `.sightreading-keyboard-wrapper` remain in JSX other than what `SightReadingLayout` expects.

---

## Phase 5 – Align CSS (`index.css`) with New Layout

Review the relevant rules in `[src/index.css]`:

- `.sightreading-staff-wrapper`:
  - Keep `overflow: visible` and orientation-based `min-height` values.
  - Consider tuning `min-height` slightly (e.g., 130–140px) based on real measurements with the new layout.

- `.sightreading-keyboard-wrapper`:
  - Keep `overflow: visible` and `transition: height 0.3s ease`.
  - Ensure the height logic is consistent with the new `h-[clamp(...)]` utilities in `SightReadingLayout`:
    - Avoid conflicting `!important` heights unless strictly needed for mobile landscape.

- Ensure there are **no** global styles that forcibly set `overflow: hidden` on the `body` except in very specific cases (e.g., penalty modal), and confirm those are correctly cleaned up after use.

---

## Phase 6 – Testing Matrix

### 6.1 Desktop

- **1080p @100% zoom, full window:**
  - No vertical or horizontal scrollbar for the game route.
  - Staff, Start Playing button, and keyboard all visible simultaneously.

- **Shorter window (e.g., dev tools docked):**
  - Exactly **one** vertical scrollbar (page or root).
  - Keyboard and Start button remain reachable without hidden nested scroll.

### 6.2 Mobile / tablet (DevTools + real device if possible)

- **Portrait:**
  - Staff at top of card.
  - Start button directly under staff.
  - Keyboard visible or reachable with a single vertical scroll.

- **Landscape:**
  - Same as portrait; accept that more scrolling may be needed, but ensure:
    - No nested scrollbars.
    - Start button never “disappears” because it’s in an unscrollable region.

### 6.3 Functional checks

- Verify that:
  - Mic input, audio engine, and timing are unaffected.
  - Game phase transitions still drive guidance content and keyboard visibility correctly.
  - Penalty modal, victory screen, and encouragement screen still cover the full viewport and restore scroll behavior when closed.

---

## Phase 7 – Optional Enhancements

- Add a dedicated **layout story / harness**:
  - E.g., Storybook story or a temporary `/debug/sight-reading-layout` route that renders `SightReadingLayout` with mock props.
  - This allows rapid regression testing of layout changes without running the full game.

- Encapsulate constants:
  - Extract layout‑related constants (header height, keyboard min/max heights) into a small config module so they aren’t scattered across JSX and CSS.

- Document decisions:
  - Keep this plan updated with any deviations you make during implementation.
  - Add comments in `SightReadingLayout` explaining the reasoning behind each region’s height and overflow behavior.

With this plan, the re‑implementation focuses strictly on **clarifying responsibilities and simplifying height/overflow interactions**, which should eliminate the recurring UI bugs while preserving all existing game logic.
