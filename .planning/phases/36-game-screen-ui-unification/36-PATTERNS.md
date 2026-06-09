# Phase 36: Game Screen UI Unification — Pattern Map

**Mapped:** 2026-06-10
**Files analyzed:** 19 (9 new, 10 modified)
**Analogs found:** 19 / 19

---

## File Classification

| New / Modified File                                                | Role      | Data Flow        | Closest Analog                                              | Match Quality                      |
| ------------------------------------------------------------------ | --------- | ---------------- | ----------------------------------------------------------- | ---------------------------------- |
| `src/components/games/shared/hud/ProgressBar.jsx`                  | component | request-response | `NotesRecognitionGame.jsx` lines 320–371 (inline component) | exact lift                         |
| `src/components/games/shared/hud/ScorePill.jsx`                    | component | request-response | `NotesRecognitionGame.jsx` lines 2357–2412 (inline JSX)     | exact lift                         |
| `src/components/games/shared/hud/LivesDisplay.jsx`                 | component | request-response | `NotesRecognitionGame.jsx` lines 2479–2509 (inline JSX)     | exact lift                         |
| `src/components/games/shared/hud/ComboPill.jsx`                    | component | request-response | `NotesRecognitionGame.jsx` lines 2435–2469 (inline JSX)     | exact lift + internalize animation |
| `src/components/games/shared/hud/OnFireBadge.jsx`                  | component | request-response | `NotesRecognitionGame.jsx` lines 2415–2432 (inline JSX)     | exact lift + internalize           |
| `src/components/games/shared/hud/OnFireSplash.jsx`                 | component | request-response | `NotesRecognitionGame.jsx` lines 2228–2247 (inline JSX)     | exact lift                         |
| `src/components/games/shared/hud/SpeedBonusFlash.jsx`              | component | request-response | `NotesRecognitionGame.jsx` lines 2535–2550 (inline JSX)     | exact lift                         |
| `src/components/games/shared/hud/TierUpPopup.jsx`                  | component | request-response | `NotesRecognitionGame.jsx` lines 2571–2610 (inline JSX)     | exact lift                         |
| `src/components/games/shared/hud/TimerDisplay.jsx`                 | component | request-response | `NotesRecognitionGame.jsx` lines 295–308 (inline component) | exact lift                         |
| `src/components/games/shared/hud/ProgressBar.test.jsx`             | test      | —                | `ArcadeRhythmGame.test.js` (mock pattern)                   | role-match                         |
| `src/components/games/shared/hud/ScorePill.test.jsx`               | test      | —                | `ArcadeRhythmGame.test.js` (mock pattern)                   | role-match                         |
| `src/components/games/shared/hud/LivesDisplay.test.jsx`            | test      | —                | `ArcadeRhythmGame.test.js` (mock pattern)                   | role-match                         |
| `src/components/games/shared/hud/ComboPill.test.jsx`               | test      | —                | `ArcadeRhythmGame.test.js` (mock pattern)                   | role-match                         |
| `src/components/games/notes-master-games/NotesRecognitionGame.jsx` | component | request-response | itself (inline → imported swap)                             | exact                              |
| `src/components/games/sight-reading-game/SightReadingGame.jsx`     | component | request-response | `NotesRecognitionGame.jsx` (Wave 1 output)                  | role-match                         |
| `src/components/games/rhythm-games/RhythmReadingGame.jsx`          | component | request-response | `NotesRecognitionGame.jsx` (Wave 1 output)                  | role-match                         |
| `src/components/games/rhythm-games/RhythmDictationGame.jsx`        | component | request-response | `NotesRecognitionGame.jsx` (Wave 1 output)                  | role-match                         |
| `src/components/games/rhythm-games/MixedLessonGame.jsx`            | component | request-response | `NotesRecognitionGame.jsx` (Wave 1 output)                  | role-match                         |
| `src/components/games/rhythm-games/MetronomeTrainer.jsx`           | component | request-response | `NotesRecognitionGame.jsx` (Wave 1 output)                  | role-match                         |
| `src/components/games/notes-master-games/MemoryGame.jsx`           | component | request-response | `NotesRecognitionGame.jsx` (Wave 1 output)                  | role-match                         |
| `src/components/games/ear-training-games/NoteComparisonGame.jsx`   | component | request-response | `NotesRecognitionGame.jsx` + `ArcadeRhythmGame.jsx`         | role-match                         |
| `src/components/games/ear-training-games/IntervalGame.jsx`         | component | request-response | `NotesRecognitionGame.jsx` + `ArcadeRhythmGame.jsx`         | role-match                         |
| `src/components/games/rhythm-games/ArcadeRhythmGame.jsx`           | component | request-response | `NotesRecognitionGame.jsx` (Wave 1 output)                  | role-match (de-dup)                |

---

## Pattern Assignments

### `src/components/games/shared/hud/ProgressBar.jsx` (component, request-response)

**Analog:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 320–371

**Export and file header pattern** (copy from `AudioInterruptedOverlay.jsx`):

```jsx
// Named export — no default export. JSDoc header before the function.
/**
 * ProgressBar
 *
 * X-of-N progress bar with gradient fill, Framer Motion spring animation,
 * and checkpoint dots at 0/25/50/75/100%. Reads reduced-motion internally.
 *
 * Props:
 * @param {number} props.current - Number of questions answered (0-indexed count)
 * @param {number} props.total   - Total questions in the session
 */
export function ProgressBar({ current, total }) {
```

**Imports pattern** (for `hud/` depth — 4 levels up to `src/`):

```jsx
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
```

**Core pattern** (verbatim from `NotesRecognitionGame.jsx` lines 320–371):

```jsx
export function ProgressBar({ current, total }) {
  const { t } = useTranslation("common");
  const { soft } = useMotionTokens();
  const progressPercent = Math.min(100, (current / total) * 100);
  return (
    <div className="w-full">
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/10" />
        <motion.div
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 shadow-[0_4px_16px_rgba(99,102,241,0.2)]"
          animate={{ scaleX: progressPercent / 100 }}
          initial={false}
          transition={soft}
          style={{ willChange: "transform" }}
        />
        {[0, 25, 50, 75, 100].map((p) => {
          const isStart = p === 0;
          const isEnd = p === 100;
          const xClass = isStart
            ? "translate-x-0"
            : isEnd
              ? "-translate-x-full"
              : "-translate-x-1/2";
          return (
            <span
              key={p}
              className={`absolute top-1/2 h-2.5 w-2.5 ${xClass} -translate-y-1/2 rounded-full border ${
                progressPercent >= p
                  ? "border-white/40 bg-white/80"
                  : "border-white/20 bg-white/10"
              }`}
              style={{ left: isStart ? "0%" : isEnd ? "100%" : `${p}%` }}
            />
          );
        })}
      </div>
      <div className="mt-2 text-xs font-semibold text-white/75">
        <span>
          {t("noteRecognition.questionProgress", {
            current: Math.min(total, Math.max(1, current + 1)),
            total,
          })}
        </span>
      </div>
    </div>
  );
}
```

**Note:** `soft` from `useMotionTokens()` already encapsulates reduced-motion (returns `{ duration: 0 }` when `reduce` is true). No additional reduced-motion guard needed for the spring animation.

---

### `src/components/games/shared/hud/ScorePill.jsx` (component, request-response)

**Analog:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 2357–2412

**Imports pattern:**

```jsx
import { AnimatePresence, motion } from "framer-motion";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
```

**Prop contract (D-11):**

```jsx
/**
 * ScorePill
 *
 * Configurable score display pill. Combo-tints the glass border/bg
 * when the engagement layer is active. Supports a floating +score animation.
 *
 * @param {number}  props.value      - Current score value to display
 * @param {string}  [props.label]    - Label string, e.g. "XP", "Score", "Correct"
 * @param {0|1|2}   [props.comboTint] - 0=default glass, 1=amber tint, 2=yellow tint
 * @param {number|null} [props.floatingScore] - Value to show in +N float animation
 * @param {number}  [props.floatingScoreKey]  - Key to force remount on new float
 * @param {React.Ref} [ref]          - Forwarded ref for TierUpPopup fly-to targeting
 */
export const ScorePill = React.forwardRef(function ScorePill(
  { value, label = "XP", comboTint = 0, floatingScore = null, floatingScoreKey = 0 },
  ref
) {
```

**Core pattern** (extracted from `NotesRecognitionGame.jsx` lines 2357–2412):

```jsx
// Tint mapping for comboTint prop (0|1|2):
const TINT = [
  { border: "border-white/20", bg: "bg-white/10", text: "" },
  {
    border: "border-amber-400/30",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
  },
  {
    border: "border-yellow-400/40",
    bg: "bg-yellow-500/20",
    text: "text-yellow-300",
  },
];

// Inside component:
const { reduce } = useMotionTokens();
const { border, bg } = TINT[comboTint] ?? TINT[0];

return (
  <div ref={ref} className="relative">
    <div
      className={`flex items-center gap-2 rounded-full border ${border} ${bg} px-3 py-1.5 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md transition-colors duration-300 motion-reduce:transition-none`}
    >
      <span className="text-xs font-semibold text-white/80 sm:text-sm">
        {label}
      </span>
      <span className="font-mono text-sm font-bold tracking-wide sm:text-base">
        {value}
      </span>
    </div>
    <AnimatePresence>
      {floatingScore !== null && (
        <motion.span
          key={floatingScoreKey}
          initial={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          animate={reduce ? { opacity: 0 } : { opacity: 0, y: -28 }}
          transition={{ duration: 0.55 }}
          className={`pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 font-mono font-bold drop-shadow-md ${
            comboTint >= 2
              ? "text-base text-yellow-300 sm:text-lg"
              : comboTint >= 1
                ? "text-sm text-amber-300 sm:text-base"
                : "text-sm text-white sm:text-base"
          }`}
        >
          +{floatingScore}
        </motion.span>
      )}
    </AnimatePresence>
  </div>
);
```

**Critical:** `React.forwardRef` is required so the parent can attach `scorePillRef` which `TierUpPopup` uses for its fly-to position calculation. Without this, `TierUpPopup` breaks (see Pitfall 1 in RESEARCH.md).

---

### `src/components/games/shared/hud/LivesDisplay.jsx` (component, request-response)

**Analog:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 2479–2509

**Imports pattern:**

```jsx
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
```

**Prop contract:**

```jsx
/**
 * @param {number} props.lives       - Current lives remaining
 * @param {number} props.totalLives  - Total lives (renders this many hearts)
 */
export function LivesDisplay({ lives, totalLives = 3 }) {
```

**Core pattern** (verbatim from `NotesRecognitionGame.jsx` lines 2479–2509):

```jsx
const { reduce } = useMotionTokens();

return (
  <div
    className="flex items-center gap-0.5"
    aria-label={`${lives} lives remaining`}
    role="group"
  >
    {Array.from({ length: totalLives }).map((_, i) => (
      <AnimatePresence key={i} mode="wait">
        {i < lives ? (
          <motion.div
            key={`heart-${i}-alive`}
            initial={false}
            exit={
              reduce ? undefined : { scale: [1, 1.4, 0], opacity: [1, 1, 0] }
            }
            transition={{ duration: 0.3 }}
          >
            <Heart
              className="h-5 w-5 fill-red-400 text-red-400 sm:h-6 sm:w-6"
              aria-hidden="true"
            />
          </motion.div>
        ) : (
          <motion.div
            key={`heart-${i}-dead`}
            initial={reduce ? undefined : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 0.2 }}
          >
            <Heart
              className="h-5 w-5 text-white/30 sm:h-6 sm:w-6"
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    ))}
  </div>
);
```

---

### `src/components/games/shared/hud/ComboPill.jsx` (component, request-response + internal animation state)

**Analog:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 2435–2469

**Imports pattern:**

```jsx
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Flame } from "lucide-react";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
```

**Prop contract (D-10 hybrid — animation encapsulated, no `comboShake` passed from parent):**

```jsx
/**
 * @param {number}  props.combo    - Current combo count
 * @param {boolean} [props.isOnFire] - When true, shows Flame icon instead of Zap (ArcadeRhythm style)
 */
export function ComboPill({ combo, isOnFire = false }) {
```

**Core pattern** — internalize shake detection (Pattern 3 from RESEARCH.md):

```jsx
const { reduce } = useMotionTokens();
const prevComboRef = useRef(combo);
const [shaking, setShaking] = useState(false);
const [scaling, setScaling] = useState(false);

useEffect(() => {
  if (combo < prevComboRef.current) {
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 300);
    prevComboRef.current = combo;
    return () => clearTimeout(t);
  }
  if (combo > prevComboRef.current) {
    setScaling(true);
    const t = setTimeout(() => setScaling(false), 300);
    prevComboRef.current = combo;
    return () => clearTimeout(t);
  }
  prevComboRef.current = combo;
}, [combo]);

return (
  <motion.div
    animate={
      shaking
        ? { x: [0, -6, 6, -4, 4, 0] }
        : scaling
          ? { scale: [1, 1.18, 1] }
          : undefined
    }
    transition={
      reduce ? undefined : { type: "tween", duration: 0.22, ease: "easeInOut" }
    }
    className={`flex items-center gap-1 rounded-full border px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md transition-colors duration-300 motion-reduce:transition-none ${
      combo >= 8
        ? "border-yellow-400/40 bg-yellow-500/20"
        : combo >= 3
          ? "border-amber-400/30 bg-amber-500/15"
          : "border-white/20 bg-white/10"
    }`}
  >
    {isOnFire ? (
      <Flame
        className={`h-4 w-4 ${combo >= 8 ? "text-orange-300" : "text-orange-400"}`}
      />
    ) : (
      <Zap
        className={`h-4 w-4 ${combo >= 8 ? "fill-yellow-300 text-yellow-300" : combo >= 3 ? "fill-amber-300 text-amber-300" : "text-white/70"}`}
      />
    )}
    <span className="font-mono text-sm font-bold tracking-wide text-white sm:text-base">
      {combo}
    </span>
  </motion.div>
);
```

**Critical:** The `comboShake` boolean state in `NotesRecognitionGame` is deleted from the parent after this extraction. The parent no longer calls `setComboShake(true)` or sets a timer to clear it. This is the D-10 "animation encapsulated" contract.

---

### `src/components/games/shared/hud/OnFireBadge.jsx` (component, request-response)

**Analog:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 2415–2432

**Imports pattern:**

```jsx
import { AnimatePresence, motion } from "framer-motion";
import flameIcon from "../../../../assets/icons/flame.png";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
import { useAccessibility } from "../../../../contexts/AccessibilityContext";
```

**Reduced-motion dual-source pattern** (RESEARCH.md "Reduced-Motion Dual-Source Pitfall"):

```jsx
// BOTH hooks required — they can differ (OS pref vs in-app toggle):
const { reduce } = useMotionTokens(); // for Framer animate props
const { reducedMotion } = useAccessibility(); // for CSS animate-pulse guard
```

**Core pattern** (verbatim from `NotesRecognitionGame.jsx` lines 2415–2432):

```jsx
export function OnFireBadge({ active }) {
  const { reduce } = useMotionTokens();
  const { reducedMotion } = useAccessibility();

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="fire-badge"
          initial={reduce ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className={reduce || reducedMotion ? "" : "animate-pulse"}
        >
          <img src={flameIcon} alt="" className="h-10 w-10" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Note on asset path:** From `src/components/games/shared/hud/`, the flame PNG is at `../../../../assets/icons/flame.png`. Verify with the existing import in `NotesRecognitionGame.jsx` line 4: `import flameIcon from "../../../assets/icons/flame.png"` (3 levels from `notes-master-games/`; `hud/` is one level deeper → 4 levels).

---

### `src/components/games/shared/hud/OnFireSplash.jsx` (component, request-response)

**Analog:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 2228–2247

**Imports pattern:**

```jsx
import { AnimatePresence, motion } from "framer-motion";
import flameIcon from "../../../../assets/icons/flame.png";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
```

**Core pattern** (verbatim from `NotesRecognitionGame.jsx` lines 2228–2247):

```jsx
export function OnFireSplash({ show }) {
  const { reduce } = useMotionTokens();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="fire-splash"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
          animate={
            reduce ? { opacity: 1 } : { opacity: 1, scale: [1, 1.15, 1] }
          }
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
        >
          <img
            src={flameIcon}
            alt=""
            className="h-24 w-24 drop-shadow-[0_0_16px_rgba(251,146,60,0.6)] sm:h-28 sm:w-28"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Note:** This renders as a `fixed inset-0 z-[70]` overlay — it must be placed at the root of the game's render tree (not nested inside a `StageCard` or scrollable container) to avoid clipping.

---

### `src/components/games/shared/hud/SpeedBonusFlash.jsx` (component, request-response)

**Analog:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 2535–2550

**Imports pattern:**

```jsx
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
```

**Core pattern** (verbatim from `NotesRecognitionGame.jsx` lines 2535–2550):

```jsx
/**
 * @param {boolean} props.show        - Whether to show the flash
 * @param {number}  [props.flashKey]  - Increment to force remount for repeated triggers
 *                                      (see Pitfall 5 in RESEARCH.md)
 */
export function SpeedBonusFlash({ show, flashKey = 0 }) {
  const { t } = useTranslation("common");

  return (
    <div className="pointer-events-none flex h-7 items-center justify-center">
      <AnimatePresence>
        {show && (
          <motion.span
            key={flashKey}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.35 }}
            className="rounded-full bg-amber-400/20 px-4 py-1 text-sm font-bold text-amber-300 backdrop-blur-sm sm:text-base"
          >
            {t("games.engagement.fast")}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Critical:** The parent passes both `show={showSpeedBonus}` AND `flashKey={speedBonusKey}` (where `speedBonusKey` increments on each trigger). The `h-7` container is part of this component to reserve layout space — do not omit it.

---

### `src/components/games/shared/hud/TierUpPopup.jsx` (component, request-response)

**Analog:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 2571–2610

**Imports pattern:**

```jsx
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
```

**Core pattern** (verbatim from `NotesRecognitionGame.jsx` lines 2571–2610):

```jsx
/**
 * @param {2|3|null} props.multiplier  - Current tier multiplier; null = hidden
 * @param {{x: number, y: number}} [props.target] - Fly-to coordinates from
 *   scorePillRef.current.getBoundingClientRect() — computed in parent
 */
export function TierUpPopup({ multiplier, target = { x: 0, y: 0 } }) {
  const { t } = useTranslation("common");
  const { reduce } = useMotionTokens();

  return (
    <AnimatePresence>
      {multiplier && (
        <motion.div
          key={`tier-${multiplier}`}
          initial={
            reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5, x: 0, y: 0 }
          }
          animate={
            reduce
              ? { opacity: [1, 1, 0] }
              : {
                  opacity: [0, 1, 1, 1],
                  scale: [0.5, 1, 1, 0.3],
                  x: [0, 0, 0, target.x],
                  y: [0, 0, 0, target.y],
                }
          }
          transition={
            reduce
              ? { duration: 1.2 }
              : { duration: 1.2, times: [0, 0.15, 0.6, 1], ease: "easeInOut" }
          }
          className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
        >
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/90 to-yellow-500/90 px-8 py-5 text-center shadow-2xl shadow-amber-500/30 backdrop-blur-sm">
            <div className="text-3xl font-black text-white drop-shadow-lg sm:text-4xl">
              {multiplier >= 3
                ? t("games.engagement.triplePoints")
                : t("games.engagement.doublePoints")}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Critical:** `target` is computed in the parent via `scorePillRef.current.getBoundingClientRect()`. The parent is responsible for computing the `{x, y}` delta and passing it as `target`. This is why `ScorePill` uses `React.forwardRef` — the parent holds `scorePillRef` and passes it to both `ScorePill` (via ref) and `TierUpPopup` (via `target` prop computed from the ref's rect).

---

### `src/components/games/shared/hud/TimerDisplay.jsx` (component, request-response)

**Analog:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 295–308

**Core pattern** (verbatim lift):

```jsx
import { useTranslation } from "react-i18next";
import { Clock3 } from "lucide-react";

/**
 * @param {string} props.formattedTime - Pre-formatted "MM:SS" string from parent timer logic
 */
export function TimerDisplay({ formattedTime }) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <Clock3 className="h-4 w-4 text-white/80" />
      <span className="text-xs font-semibold text-white/80 sm:text-sm">
        {t("games.time")}
      </span>
      <span className="font-mono text-sm font-bold tracking-wide sm:text-base">
        {formattedTime || "00:00"}
      </span>
    </div>
  );
}
```

---

### `src/components/games/shared/hud/ProgressBar.test.jsx` (test)

**Analog:** `src/components/games/rhythm-games/ArcadeRhythmGame.test.js` (lines 1–60)

**Test file pattern** (mock structure to copy):

```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock all context hooks used internally by the component under test
vi.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (k, opts) => (opts ? `${opts.current}/${opts.total}` : k),
  })),
}));

describe("ProgressBar", () => {
  it("renders fill at correct percentage", () => {
    /* ... */
  });
  it("marks checkpoint dots active up to current progress", () => {
    /* ... */
  });
  it("shows question counter text", () => {
    /* ... */
  });
});
```

**Same mock structure applies to `ScorePill.test.jsx`, `LivesDisplay.test.jsx`, `ComboPill.test.jsx`.**

For `LivesDisplay.test.jsx` add mock for `../../../../contexts/AccessibilityContext` (not needed by ProgressBar/ScorePill/ComboPill):

```jsx
vi.mock("../../../../contexts/AccessibilityContext", () => ({
  useAccessibility: vi.fn(() => ({ reducedMotion: false })),
}));
```

---

### `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (Wave 1 reference refactor)

**Pattern:** Delete inline component declarations (lines 295–371 for `TimerDisplay`, `StageCard`, `ProgressBar`). Replace with imports. Delete all inline HUD JSX blocks for engagement components and replace with the extracted component tags.

**Import additions after extraction:**

```jsx
import { ProgressBar } from "../shared/hud/ProgressBar";
import { ScorePill } from "../shared/hud/ScorePill";
import { LivesDisplay } from "../shared/hud/LivesDisplay";
import { ComboPill } from "../shared/hud/ComboPill";
import { OnFireBadge } from "../shared/hud/OnFireBadge";
import { OnFireSplash } from "../shared/hud/OnFireSplash";
import { SpeedBonusFlash } from "../shared/hud/SpeedBonusFlash";
import { TierUpPopup } from "../shared/hud/TierUpPopup";
import { TimerDisplay } from "../shared/hud/TimerDisplay";
```

**State removals after extraction (D-10):**

- `comboShake` state + its `setComboShake(true)` call in `handleAnswerSelect` — delete entirely; `ComboPill` detects the combo decrease internally.
- `speedBonusKey` / `floatingScoreKey` management stays in parent (they are remount-key patterns that remain the parent's responsibility per Pitfall 5 in RESEARCH.md).

**Props wiring at call sites:**

```jsx
// ScorePill — attach ref for TierUpPopup fly-to:
const comboTier = combo >= 8 ? 2 : combo >= 3 ? 1 : 0;
<ScorePill
  ref={scorePillRef}
  value={progress.score}
  label="XP"
  comboTint={comboTier}
  floatingScore={floatingScore}
  floatingScoreKey={floatingScoreKey}
/>

// OnFireSplash — at root of render, before StageCard:
<OnFireSplash show={showFireSplash} />

// OnFireBadge:
<OnFireBadge active={isOnFire} />

// ComboPill:
<ComboPill combo={combo} />

// LivesDisplay:
<LivesDisplay lives={lives} totalLives={INITIAL_LIVES} />

// SpeedBonusFlash — preserve h-7 wrapper, now inside component:
<SpeedBonusFlash show={showSpeedBonus} flashKey={speedBonusKey} />

// TierUpPopup:
<TierUpPopup multiplier={tierUpMultiplier} target={tierUpTarget} />

// TimerDisplay (unchanged, timed mode only):
{settings.timedMode ? <TimerDisplay formattedTime={formattedTime} /> : null}

// ProgressBar (unchanged):
<ProgressBar current={progress.totalQuestions} total={settings.timedMode ? 10 : 20} />
```

---

### Wave 2 Adoption Targets (base shell only — SightReadingGame, RhythmReadingGame, RhythmDictationGame, MixedLessonGame, MetronomeTrainer, MemoryGame)

**Common pattern for all Wave 2 games:**

**Import additions:**

```jsx
import { ProgressBar } from "../shared/hud/ProgressBar"; // adjust relative path per game dir
import { ScorePill } from "../shared/hud/ScorePill";
```

**State wiring per game** (from RESEARCH.md Per-Game Adoption State Map):

| Game                | ProgressBar `current`              | ProgressBar `total`               | ScorePill `value`                        | ScorePill `label`                 |
| ------------------- | ---------------------------------- | --------------------------------- | ---------------------------------------- | --------------------------------- |
| SightReadingGame    | `currentExerciseNumber`            | `sessionTotalExercises`           | `sessionTotalScore`                      | `"Score"` (or `t("games.score")`) |
| RhythmReadingGame   | `currentExercise`                  | `TOTAL_EXERCISES` constant        | aggregated from `exerciseScores`         | `"Score"`                         |
| RhythmDictationGame | `currentQuestion + 1`              | `TOTAL_QUESTIONS` (= 10)          | `questionScores.filter(s=>s===1).length` | `"Score"`                         |
| MixedLessonGame     | `currentIndex`                     | `questions.length`                | `results.filter(Boolean).length`         | `"Score"`                         |
| MetronomeTrainer    | `exerciseProgress.currentExercise` | `exerciseProgress.totalExercises` | `exerciseProgress.totalScore`            | `"Score"`                         |
| MemoryGame          | `matchedIndexes.length / 2`        | `cards.length / 2`                | `score`                                  | `"XP"`                            |

**MixedLessonGame — additionally delete `renderProgressBar()`** (RESEARCH.md lines 656–675):

```jsx
// DELETE this function entirely from MixedLessonGame:
const renderProgressBar = () => (
  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15" role="progressbar" ...>
    <div className={`h-full rounded-full bg-green-400${...}`} style={{ width: `...` }} />
  </div>
  <span>{currentIndex}/{questions.length}</span>
);

// Replace call site with:
<ProgressBar current={currentIndex} total={questions.length} />
```

---

### Wave 3 Adoption Targets (engagement layer — NoteComparisonGame, IntervalGame, ArcadeRhythmGame)

#### NoteComparisonGame and IntervalGame

**New state to add** (both files, identical pattern):

```jsx
const [combo, setCombo] = useState(0);
const [isOnFire, setIsOnFire] = useState(false);

// In answer-correct handler:
setCombo((prev) => {
  const next = prev + 1;
  if (next >= ON_FIRE_THRESHOLD && !isOnFire) setIsOnFire(true);
  return next;
});

// In answer-wrong handler:
setCombo(0);
// No lives deducted per D-08 — wrong answer costs no life
```

**Import additions:**

```jsx
import { ProgressBar } from "../../shared/hud/ProgressBar"; // adjust path per game dir
import { ScorePill } from "../../shared/hud/ScorePill";
import { ComboPill } from "../../shared/hud/ComboPill";
import { OnFireBadge } from "../../shared/hud/OnFireBadge";
```

**State wiring:**

- NoteComparisonGame: `<ProgressBar current={currentQuestion} total={TOTAL_QUESTIONS} />`, `<ScorePill value={correctCount} label={t("games.score")} comboTint={combo >= 8 ? 2 : combo >= 3 ? 1 : 0} />`
- IntervalGame: same pattern with `questionScores.length` as `current` and `correctCount` as `value`

#### ArcadeRhythmGame (de-dup)

**Delete inline HUD JSX** (`ArcadeRhythmGame.jsx` lines 1157–1186) and replace:

```jsx
// Existing inline combo badge (lines 1157–1169) → replace with:
{
  combo >= 2 && <ComboPill combo={combo} isOnFire={isOnFire} />;
}

// Existing inline lives (lines 1171–1186) → replace with:
<LivesDisplay lives={lives} totalLives={INITIAL_LIVES} />;
```

**Import additions:**

```jsx
import { ComboPill } from "../shared/hud/ComboPill";
import { LivesDisplay } from "../shared/hud/LivesDisplay";
```

**Sacred line — must remain untouched:**

```jsx
// ArcadeRhythmGame.jsx line 141 — DO NOT MOVE OR REMOVE:
useDeclareNeedsLandscape(isPhoneViewport);
```

**Behavioral preservation (D-09):**

- `{combo >= 2 && <ComboPill ... />}` — the `combo >= 2` guard stays in the parent (not inside `ComboPill`)
- `isOnFire` prop routes to `ComboPill`'s `isOnFire` flag (shows `Flame` icon) rather than a separate `OnFireBadge`
- `INITIAL_LIVES`, `ON_FIRE_THRESHOLD`, `GAME_PHASES` stay exported from `ArcadeRhythmGame.jsx` (tests import them)

---

## Shared Patterns

### Glass Pill Pattern (all HUD components)

**Source:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 2377–2384
**Apply to:** All `hud/` components that render pill-shaped containers

```jsx
// The canonical glass pill class set:
className =
  "flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md transition-colors duration-300 motion-reduce:transition-none";
// Accent text: text-white/80 (labels), font-mono font-bold tracking-wide (values)
// Tinted variant (amber): border-amber-400/30 bg-amber-500/15
// Tinted variant (yellow): border-yellow-400/40 bg-yellow-500/20
```

### Reduced-Motion Dual-Source Pattern

**Source:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 415–416
**Apply to:** `OnFireBadge.jsx` (needs both), all others need only `useMotionTokens().reduce`

```jsx
// Components that use CSS animate-pulse (OnFireBadge only) need BOTH:
const { reduce } = useMotionTokens(); // Framer Motion props
const { reducedMotion } = useAccessibility(); // CSS class guard: className={reduce || reducedMotion ? "" : "animate-pulse"}

// All other HUD components: useMotionTokens().reduce only
const { reduce } = useMotionTokens();
// Pass to Framer props: animate={reduce ? {...} : {...}}
```

**Source for imports:**

```jsx
import { useMotionTokens } from "../../../../utils/useMotionTokens"; // from hud/ depth
import { useAccessibility } from "../../../../contexts/AccessibilityContext";
```

### Named Export Convention

**Source:** `src/components/games/shared/AudioInterruptedOverlay.jsx` line 26
**Apply to:** All new `hud/` components

```jsx
// Named export — no default export. One component per file.
export function ComponentName({ ...props }) { ... }
// Exception: ScorePill uses React.forwardRef — still named, not default:
export const ScorePill = React.forwardRef(function ScorePill({ ... }, ref) { ... });
```

### Test Mock Scaffolding

**Source:** `src/components/games/rhythm-games/ArcadeRhythmGame.test.js` lines 1–100
**Apply to:** All `hud/*.test.jsx` files

```jsx
// Minimum required mocks for any hud/ component test:
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...rest }) => (
      <div className={className}>{children}</div>
    ),
    span: ({ children, className, ...rest }) => (
      <span className={className}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (k, opts) => (opts ? JSON.stringify(opts) : k),
  })),
}));

// Add only if the component calls useAccessibility():
vi.mock("../../../../contexts/AccessibilityContext", () => ({
  useAccessibility: vi.fn(() => ({ reducedMotion: false })),
}));
```

---

## No Analog Found

All new HUD components have direct inline-code analogs in `NotesRecognitionGame.jsx`. No files lack a match.

| File                               | Note                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StageCard` (local wrapper in NRG) | Research confirms this is a local layout wrapper — planner decides if it belongs in `hud/` or stays inline. It reads nothing from scope and has no animation logic, so leaving it local is valid. |

---

## Metadata

**Analog search scope:** `src/components/games/`, `src/utils/`, `src/contexts/`
**Files scanned:** 11 source files + 3 context/utility files
**Pattern extraction date:** 2026-06-10
