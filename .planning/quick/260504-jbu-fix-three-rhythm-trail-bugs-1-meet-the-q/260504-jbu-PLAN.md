---
phase: 260504-jbu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx
  - src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx
  - src/components/games/rhythm-games/utils/durationInfo.js
  - src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx
  - src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx
autonomous: true
requirements:
  - BUG-1 (mobile-landscape "Meet the X" intro card overflow)
  - BUG-2 (syllable-matching renders two "ta" cards on q-correct quizzes)
  - BUG-3 (notation tap metronome silent + visual beat stuck on 1)

must_haves:
  truths:
    - "On a landscape-locked mobile viewport (≤740px wide, ≤420px tall), the entire 'Meet the Quarter Note' card is visible — title, SVG, name, syllable, Listen button, Got it button — without vertical scroll or content cut-off."
    - "When a syllable-matching question's correct answer is a quarter note ('q'), no two cards display the same syllable text — '8_pair' distractors render as 'ti-ti' (English) and the Hebrew equivalent (or fallback) instead of 'ta'."
    - "In RhythmTapQuestion (notation tap game), the count-in metronome clicks are audible AND the MetronomeDisplay beat indicator advances 1 → 2 → 3 → 4 in time with the audio."
    - "In RhythmTapQuestion, during pattern playback and user-tap phases, the metronome continues to tick audibly and the beat indicator continues to advance."
  artifacts:
    - path: "src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx"
      provides: "Responsive layout that uses isLandscape (no longer aliased _isLandscape) — landscape compresses paddings/gaps and shrinks SVG so the card fits ≤420px tall viewports."
    - path: "src/components/games/rhythm-games/utils/durationInfo.js"
      provides: "getSyllable(code, language) accepts an optional language ('en'|'he'), checks info.syllable / info.syllableHe override, then falls back to SYLLABLE_BY_UNITS / SYLLABLE_BY_UNITS_HE. Hebrew rest returns 'הָס'."
      contains: "export function getSyllable"
    - path: "src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx"
      provides: "Imports getSyllable from utils/durationInfo (single source of truth). No longer maintains an inline syllable lookup that ignores info.syllable."
    - path: "src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx"
      provides: "Metronome flow mirrors MetronomeTrainer: waits for audioEngine.isReady() before scheduling, defers the visual beat loop until startTime arrives (firstBeatDelay setTimeout), and uses a 50ms scheduling cadence with a clamped non-negative timeSinceStart."
    - path: "src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx"
      provides: "Regression test asserting that when correct='q' and choices include '8_pair', the rendered card text for '8_pair' is 'ti-ti' (not 'ta')."
  key_links:
    - from: "DiscoveryIntroQuestion.jsx"
      to: "isLandscape prop from MixedLessonGame"
      via: "renderer receives isLandscape and applies a landscape-specific Tailwind class set"
      pattern: "isLandscape\\s*\\?"
    - from: "SyllableMatchingQuestion.jsx"
      to: "utils/durationInfo.getSyllable"
      via: 'import { getSyllable } from "../utils/durationInfo"'
      pattern: "from\\s+\"\\.\\./utils/durationInfo\""
    - from: "RhythmTapQuestion.startContinuousMetronome"
      to: "audioEngine.isReady() / audioContext state"
      via: "guard: schedule first beat only after isReady; visual setInterval is gated by setTimeout(firstBeatDelay)"
      pattern: "audioEngine\\.isReady|firstBeatDelay"
---

<objective>
Fix three rhythm-trail UX bugs:

1. **Bug 1 — "Meet the X" intro card overflow on mobile landscape.** `DiscoveryIntroQuestion` renders a tall vertical stack inside `max-w-sm px-8 py-10 gap-5` with a 160px-tall SVG. On landscape-locked mobile (≤420px tall) the bottom of the card (syllable + Listen + Got it) is clipped. Make the layout landscape-aware using the existing (currently ignored) `isLandscape` prop.

2. **Bug 2 — Two identical "ta" cards in syllable matching.** Two divergent `getSyllable` implementations: `durationInfo.getSyllable()` honors the `syllable: "ti-ti"` field on `8_pair`, but `SyllableMatchingQuestion`'s inline `getSyllable` ignores it and uses only `SYLLABLE_MAP_EN/HE[durationUnits]`. When `correct="q"` (units=4 → "ta"), `dedupSyllables` correctly excludes other units=4 entries — but `8_pair` (units=4, syllable="ti-ti") survives and the renderer then displays it as `SYLLABLE_MAP_EN[4]` = "ta". Result: two "ta" cards. Fix by making `durationInfo.getSyllable` the single source of truth.

3. **Bug 3 — Notation tap metronome silent + visual beat stuck on 1.** `RhythmTapQuestion.startContinuousMetronome` starts its visual `setInterval` immediately while `metronomeStartTimeRef.current = audioCtx.currentTime + 0.3`. For ~300ms `timeSinceStart` is negative; `Math.floor(-x)` is `-1`, JS `(-1 % 4)` is `-1`, so `beatInMeasure = 0` — display renders no highlighted circle. Concurrently, `createClickSound` checks `audioEngine.audioContextRef?.current && audioEngine.gainNodeRef?.current` — but `useAudioEngine.initializeAudioContext` runs asynchronously, so the first scheduled beats can be silently dropped. The working `MetronomeTrainer.jsx` mirrors the same pattern but defers the visual loop with `setTimeout((startTime - currentTime) * 1000, …)` and uses a 50ms scheduling cadence. Mirror that.

Purpose: All three bugs degrade core trail-mode rhythm UX — Bug 1 makes lessons unplayable on phones, Bug 2 looks like a quiz error, Bug 3 makes the notation tap node silently broken. All three are localized fixes with no new dependencies.

Output: One PLAN, three tasks, one regression test added, all rhythm-trail games functional on mobile landscape with audible metronome and unique syllable cards.
</objective>

<execution_context>
@C:/Users/pagis/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/pagis/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

<!-- Bug 1 reference renderers -->

@src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx
@src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx

<!-- Bug 2 supporting files -->

@src/components/games/rhythm-games/utils/durationInfo.js
@src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js

<!-- Bug 3 — broken renderer + working reference -->

@src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx
@src/components/games/rhythm-games/MetronomeTrainer.jsx
@src/hooks/useAudioEngine.js
@src/contexts/AudioContextProvider.jsx
@src/components/games/rhythm-games/components/MetronomeDisplay.jsx

<interfaces>
<!-- Key contracts the executor needs. Extracted from codebase. -->

From src/components/games/rhythm-games/utils/durationInfo.js (current shape):

```js
// DURATION_INFO entries: { svgFilename, i18nKey, durationUnits, isRest, syllable? }
// The "8_pair" entry has: { durationUnits: 4, isRest: false, syllable: "ti-ti" }
export function getSyllable(code) {
  /* returns English-only syllable */
}
export function generateQuestions(
  durationPool,
  distractorPool,
  questionCount,
  { dedupSyllables }
) {
  /* ... */
}
```

From src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js:

```js
// Hebrew syllables include Nikud — DO NOT change without user approval (memory.md)
export const SYLLABLE_MAP_HE = { 16: "טָה-אָה-...", 4: "טָה", 2: "טִי", 1: "טִי-כָּה", ... };
export const REST_SYLLABLE_HE = "הָס";
// NOTE: there is currently no Hebrew variant of "ti-ti" because the old code never reached that code path.
```

From src/hooks/useAudioEngine.js (returned API):

```js
{
  isReady, getCurrentTime, initializeAudioContext, resumeAudioContext,
  createMetronomeClick, createPianoSound, audioContextRef, gainNodeRef, ...
}
// isReady() returns true ONLY when audioContextRef.current.state === "running" AND gainNodeRef.current is set.
// audioContextRef from AudioContextProvider is created eagerly on mount (provider line 41–46),
// so the shared-context path in useAudioEngine binds correctly on first render.
```

From src/components/games/rhythm-games/MetronomeTrainer.jsx (working metronome — lines 359–516):

```js
// Visual loop is deferred until startTime arrives:
const startUnifiedVisualMetronome = () => {
  const firstBeatDelay = (startTime - audioEngine.getCurrentTime()) * 1000;
  setTimeout(
    () => {
      const updateVisualBeat = () => {
        const currentTime = audioEngine.getCurrentTime();
        const timeSinceStart = currentTime - startTime; // now >= 0
        const totalBeatsCompleted = Math.floor(timeSinceStart / beatDur);
        setCurrentBeat((totalBeatsCompleted % beatsPerMeasure) + 1);
      };
      updateVisualBeat();
      visualMetronomeRef.current = setInterval(updateVisualBeat, 50);
    },
    Math.max(0, firstBeatDelay)
  );
};
// Audio scheduling polls every 50ms (not 200ms):
continuousMetronomeRef.current = setInterval(
  () => scheduleMetronomeBeats(audioEngine.getCurrentTime()),
  50
);
// Count-in start time is +0.1s (not +0.3s):
const countInStartTime = audioEngine.getCurrentTime() + 0.1;
```

From src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx (broken — lines 181–224, 678):

```js
// IMMEDIATE setInterval (no firstBeatDelay deferral):
visualMetronomeRef.current = setInterval(() => {
  const timeSinceStart = audioEngine.getCurrentTime() - startTime;  // negative early!
  const currentBeatFloat = timeSinceStart / beatDur;
  const beatInMeasure = (Math.floor(currentBeatFloat) % beatsPerMeasure) + 1;
  setCurrentBeat(beatInMeasure);  // -1+1 = 0 for first ~300ms
}, 50);
// Audio scheduling polls every 200ms:
continuousMetronomeRef.current = setInterval(() => scheduleBeats(...), 200);
// Count-in start = +0.3s:
const countInStartTime = audioEngine.getCurrentTime() + 0.3;
```

</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Make "Meet the X" intro card landscape-aware (Bug 1)</name>
  <files>src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx</files>
  <action>
The renderer currently aliases its `isLandscape` prop to `_isLandscape` (ignored). Use the prop to render a compact layout when in landscape so the card fits within the ~420px-tall mobile-landscape viewport without clipping.

Specific changes inside `DiscoveryIntroQuestion.jsx`:

1. Rename `isLandscape: _isLandscape` → `isLandscape` in the destructured props (line ~23).

2. Replace the single hardcoded card classes with conditional ones based on `isLandscape`. Match the existing glassmorphism pattern (`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg`); only adjust paddings, gaps, max-width, and SVG size.
   - Outer wrapper (`flex w-full flex-col items-center gap-6`): in landscape, drop the wrapper gap to `gap-2` and remove the unused vertical breathing room.
   - Card container: in **portrait**, keep the current vertical stack (`max-w-sm px-8 py-10 gap-5`) — the existing layout works on tall viewports.
   - Card container: in **landscape**, switch to a **horizontal split** — icon column on the left (LTR), text + buttons column on the right. Use:
     ```
     flex w-full max-w-2xl flex-row items-center gap-6 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 shadow-lg backdrop-blur-md
     ```
     The left column wraps the SVG icon `dir="ltr"` block. The right column wraps title + name + syllable + Listen + Got it as a vertical stack with `flex flex-col gap-2 flex-1`.
   - SVG sizing: in landscape, change `<SvgIcon className="h-40 w-28" … />` to `<SvgIcon className="h-24 w-16" … />`. In portrait, leave at `h-40 w-28`.
   - Title (`text-xl`): in landscape, downgrade to `text-lg`. Title alignment in landscape: `text-left` (no longer centered). Portrait: keep `text-center text-xl`.
   - Duration name (`text-2xl`): in landscape, downgrade to `text-xl`. Alignment in landscape: `text-left`.
   - Syllable line (`text-lg`): in landscape, downgrade to `text-base`. Alignment in landscape: `text-left`.
   - Listen button: in landscape, drop `px-5 py-3` to `px-4 py-2` and the icon/text size stays the same. Self-align: `self-start` so it doesn't stretch full-width.
   - Got it button: in landscape, drop `mt-2 w-full py-4 text-lg` to `mt-1 w-full py-2.5 text-base` to save vertical space. Keep the full-width green gradient — landscape just shrinks vertical padding.

3. Do **not** change any logic — keep all hooks (`useState`, `useCallback`, `useRef`), `playDemo`, `handleGotIt`, the audio engine setup, `info`/`SvgIcon`/`syllable`/`durationName` derivations, the `if (!info || !SvgIcon) return null` guard, the `aria-label` and `role="main"` wrapper, and `t()` calls. Only the JSX structure / Tailwind classes change.

4. Pattern hint: build the conditional class strings with template literals — for readability, extract two small const objects at the top of the function body, e.g.

   ```jsx
   const card = isLandscape
     ? "flex w-full max-w-2xl flex-row items-center gap-6 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 shadow-lg backdrop-blur-md"
     : "flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-white/20 bg-white/10 px-8 py-10 shadow-lg backdrop-blur-md";
   ```

   Do not introduce a new external component or split the renderer in two — one component, two layout modes.

5. Accessibility: keep the title `<h2>` first in DOM order even in the horizontal layout (place inside the right column ahead of the name and syllable) so screen reader order remains sensible.

Do NOT touch:

- The audio demo logic (`playDemo`, `enginePlayNote`, `schedulePatternPlayback`).
- The `useAudioEngine`/`useAudioContext` hook usage.
- The `hasCompletedRef` early-exit guard in `handleGotIt`.
- `useMotionTokens` / `reducedMotion` SVG fade-in animation (still wraps the SVG block).
  </action>
  <verify>
  <automated>npx vitest run src/components/games/rhythm-games/renderers/**tests**/DiscoveryIntroQuestion.test.jsx</automated>
  <manual> 1. `npm run dev` and visit a discovery node in the trail (e.g., the first time the "Quarter Note" intro appears in a rhythm unit). 2. On a phone OR DevTools mobile-landscape preset (e.g., iPhone SE landscape, 667x375), confirm: title visible, SVG visible, duration name visible, syllable line visible, Listen button visible, Got it button visible — all without scrolling and without any content clipped at the bottom edge. 3. Tap Listen — audio still plays. 4. Tap Got it — proceeds to next question. 5. Switch to portrait (or DevTools 375x667) — original tall card layout still renders correctly.
  </manual>
  </verify>
  <done>
  On landscape-locked mobile (≤420px tall), the entire intro card fits the viewport without scrolling or clipping. Listen and Got it buttons remain clickable and functional. Portrait layout unchanged. Existing DiscoveryIntroQuestion.test.jsx still passes (the test does not assert exact class strings, only behavior).
  </done>
  </task>

<task type="auto" tdd="true">
  <name>Task 2: Unify syllable lookup so 8_pair never collides with ta (Bug 2)</name>
  <files>src/components/games/rhythm-games/utils/durationInfo.js, src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx, src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx</files>
  <behavior>
    - When `correct = "q"` and one of the choices is `"8_pair"`, the rendered card text for the `"8_pair"` slot is `"ti-ti"` (English) — NOT `"ta"`.
    - When `correct = "q"` and choices include `"8_pair"`, the four rendered cards have **four distinct syllable strings** (no duplicates).
    - When language is `"he"`, `8_pair` falls back to the English `"ti-ti"` (a follow-up can fill in the Hebrew Nikud after user approval per memory.md). It must NOT render as `"טָה"` (Hebrew "ta"), which would be the same as the correct answer.
    - When `correct = "h"` (durationUnits=8 → "ta-a"), distractors with `units=8` are dedup'd by `generateQuestions`; the renderer continues to display `"ta-a"` for the half-note slot. (Regression check: existing behavior preserved.)
    - Rest distractors continue to render as `"sh"` (English) / `"הָס"` (Hebrew). (Regression check.)
  </behavior>
  <action>
**Step A — durationInfo.js: extend `getSyllable` with a language parameter and a Hebrew unit map.**

In `src/components/games/rhythm-games/utils/durationInfo.js`:

1. Add a Hebrew syllable-by-units map alongside `SYLLABLE_BY_UNITS`. Copy values from `rhythmVexflowHelpers.SYLLABLE_MAP_HE` exactly (do NOT alter Nikud per memory.md):

   ```js
   const SYLLABLE_BY_UNITS_HE = {
     16: "טָה-אָה-אָה-אָה",
     12: "טָה-אָה-אָה",
     8: "טָה-אָה",
     6: "טָה-אָה",
     4: "טָה",
     2: "טִי",
     1: "טִי-כָּה",
   };
   const REST_HE = "הָס"; // הָס
   const REST_EN = "sh";
   ```

   These must be defined inline (NOT imported from `rhythmVexflowHelpers.js`) — that file imports VexFlow which is browser-only, and `durationInfo.js` must remain Node-safe (used by `scripts/validateTrail.mjs`). Re-declaring the constants is acceptable; both files will have identical Hebrew strings.

2. Change the `getSyllable` signature to `getSyllable(code, language = "en")`:

   ```js
   export function getSyllable(code, language = "en") {
     const info = DURATION_INFO[code];
     if (!info) return "";
     const isHe = language === "he";
     if (info.isRest) return isHe ? REST_HE : REST_EN;
     // Override field wins (e.g., "8_pair" has syllable: "ti-ti").
     // syllableHe is optional — when absent for non-English, fall back to English override.
     if (info.syllable) {
       return isHe && info.syllableHe ? info.syllableHe : info.syllable;
     }
     const map = isHe ? SYLLABLE_BY_UNITS_HE : SYLLABLE_BY_UNITS;
     return map[info.durationUnits] || "";
   }
   ```

3. Inside `generateQuestions`, the existing `dedupSyllables` call uses `getSyllable(correct)` and `getSyllable(c)` (no language). That's fine — dedup is performed against a stable English key, which is correct: dedup is a _uniqueness_ check, not a _display_ check. Do NOT change the `generateQuestions` signature. Existing callers continue to work unchanged.

4. (Optional, leave a comment) Above `DURATION_INFO`, add a comment line above the `"8_pair"` entry: `// syllable override: "ti-ti" — see getSyllable(). syllableHe TBD pending user-confirmed Nikud.`

**Step B — SyllableMatchingQuestion.jsx: replace inline syllable lookup with the unified helper.**

In `src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx`:

1. Add `getSyllable` to the existing `DURATION_INFO` import:

   ```js
   import {
     DURATION_INFO,
     getSyllable as getDurationSyllable,
   } from "../utils/durationInfo";
   ```

   (Aliased to avoid shadowing the local `useCallback` of the same name.)

2. Replace the body of the local `getSyllable` `useCallback` with a thin wrapper that delegates to the unified helper, threading `i18n.language`:

   ```js
   const getSyllable = useCallback(
     (code) => getDurationSyllable(code, i18n.language),
     [i18n.language]
   );
   ```

3. Remove the now-unused imports of `SYLLABLE_MAP_EN`, `SYLLABLE_MAP_HE`, `REST_SYLLABLE_EN`, `REST_SYLLABLE_HE` from `rhythmVexflowHelpers`. The `DURATION_INFO` import stays (still used to look up `info.i18nKey` for the SVG aria-label).

4. No other JSX changes. The `getSyllable(choice)` call inside `question.choices.map(...)` continues to produce the card text.

**Step C — Regression test for the dedup → render path.**

In `src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx`, add a new `describe` block (or `it` inside an existing one) that asserts the bug-fix behavior:

```js
it("renders '8_pair' distractor as 'ti-ti' (not 'ta') when correct is 'q' (regression: bug-2)", () => {
  // Force a question where the bug previously surfaced
  const question = {
    correct: "q",
    choices: ["q", "8_pair", "h", "w"],
  };
  const cardStates = ["default", "default", "default", "default"];

  render(
    <SyllableMatchingQuestion
      question={question}
      cardStates={cardStates}
      isLandscape={false}
      onSelect={() => {}}
      disabled={false}
    />
  );

  // Card 0 ("q") → "ta"; card 1 ("8_pair") → "ti-ti"
  expect(screen.getByTestId("duration-card-0")).toHaveAttribute(
    "data-text",
    "ta"
  );
  expect(screen.getByTestId("duration-card-1")).toHaveAttribute(
    "data-text",
    "ti-ti"
  );

  // No two cards share the same text
  const texts = [0, 1, 2, 3].map((i) =>
    screen.getByTestId(`duration-card-${i}`).getAttribute("data-text")
  );
  expect(new Set(texts).size).toBe(4);
});
```

(The existing test file already mocks `react-i18next` to return `language: "en"` and mocks `DurationCard` to expose `data-text`. No additional mocks needed.)

If the existing test file has any test that asserts a card with text `"ta"` for `"8_pair"`, update it to expect `"ti-ti"` instead.

Do NOT modify:

- `rhythmVexflowHelpers.js` (the `SYLLABLE_MAP_HE` constants live there for VexFlow-coupled callers; we re-declare in `durationInfo.js` for Node-safety).
- `generateQuestions` signature or its dedup logic.
- `VisualRecognitionQuestion.jsx` or any other renderer (they use different keys).
- Hebrew Nikud strings — copy verbatim only.
  </action>
  <verify>
  <automated>npx vitest run src/components/games/rhythm-games/renderers/**tests**/SyllableMatchingQuestion.test.jsx src/components/games/rhythm-games/**tests**/SyllableMatchingGame.test.jsx</automated>
  <manual> 1. `npm run dev` and play a syllable-matching question in a trail node where `8_pair` is in the distractor pool and `q` (quarter note) is a possible correct answer. 2. Re-roll the question several times (replay) until quarter is the correct answer. 3. Confirm: the four cards show four distinct texts; specifically, the `8_pair` card shows `"ti-ti"`, not `"ta"`. 4. Switch language to Hebrew (in app settings); replay. The `8_pair` card shows `"ti-ti"` (English fallback) — NOT `"טָה"` (Hebrew "ta"). All four cards are still visually distinct.
  </manual>
  </verify>
  <done>
  `SyllableMatchingQuestion.jsx` imports `getSyllable` from `utils/durationInfo` and no longer keys card text on `SYLLABLE_MAP_*[durationUnits]`. `getSyllable("8_pair", "en")` returns `"ti-ti"`. `getSyllable("8_pair", "he")` returns `"ti-ti"` (the English override; Hebrew Nikud is a follow-up). The new regression test passes. All existing rhythm-renderer tests pass. `npm run build` (which runs `validateTrail.mjs`) still succeeds — `durationInfo.js` remains Node-safe (no VexFlow imports).
  </done>
  </task>

<task type="auto">
  <name>Task 3: Mirror MetronomeTrainer's metronome flow in RhythmTapQuestion (Bug 3)</name>
  <files>src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx</files>
  <action>
The notation tap game's metronome currently fails on two axes: (a) the visual beat is stuck on `1` for the entire count-in because the visual `setInterval` runs while `timeSinceStart` is negative, and (b) early scheduled clicks can be silently dropped because `createClickSound` early-returns when `audioEngine.audioContextRef.current` / `gainNodeRef.current` are not yet set up.

The fix is to mirror the **working** pattern from `MetronomeTrainer.startContinuousMetronome` (lines 359–516):

- Defer the visual loop with `setTimeout(firstBeatDelay)` so `timeSinceStart` is non-negative when the loop runs.
- Use a 50ms scheduling cadence (not 200ms).
- Wait for the audio engine to actually be ready before kicking off `startContinuousMetronome`.

Specific changes inside `src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx`:

1. **Defensive audio init in `startFlow` (around line 616).** Before calling `startContinuousMetronome(countInStartTime)`:
   - Already calls `await audioEngine.resumeAudioContext()`. Keep that.
   - Add: `await audioEngine.initializeAudioContext?.();` immediately before `await audioEngine.resumeAudioContext();` if `initializeAudioContext` is exposed (it is — see `useAudioEngine.js` return). This is idempotent (the hook checks `audioContextRef.current` first) but guarantees `gainNodeRef.current` is set before any clicks are scheduled.
   - After the `try/catch` around resume, **poll briefly** (max ~10 iterations × 20ms) for `audioEngine.isReady()` to return `true`. Use `Promise`-based delay:
     ```js
     for (let i = 0; i < 10 && !audioEngine.isReady(); i++) {
       await new Promise((r) => setTimeout(r, 20));
     }
     if (!audioEngine.isReady()) {
       // Fail soft — report 0 score and exit; do not let the lesson silently hang.
       onComplete(0, 1);
       return;
     }
     ```
     Place this guard **after** the warmup oscillator block and **before** computing `countInStartTime`.

2. **Reduce count-in headroom (line 678).** Change `const countInStartTime = audioEngine.getCurrentTime() + 0.3;` to `const countInStartTime = audioEngine.getCurrentTime() + 0.1;`. This matches `MetronomeTrainer` (line 764). The 0.3s margin was excessive and made the negative-`timeSinceStart` window even larger.

3. **Rewrite `startContinuousMetronome` (lines 181–224).** Keep the same external contract (takes `startTime`, sets `metronomeStartTimeRef`, schedules clicks + visual updates, exposes refs for `stopContinuousMetronome` to clear). Internal changes:

   a. **Audio scheduling cadence: 50ms (not 200ms).** Replace:

   ```js
   continuousMetronomeRef.current = setInterval(
     () => scheduleBeats(audioEngine.getCurrentTime()),
     200
   );
   ```

   with:

   ```js
   continuousMetronomeRef.current = setInterval(
     () => scheduleBeats(audioEngine.getCurrentTime()),
     50
   );
   ```

   b. **Defer the visual loop until `startTime` arrives.** Replace the current immediate `setInterval`:

   ```js
   visualMetronomeRef.current = setInterval(() => {
     const currentTime = audioEngine.getCurrentTime();
     const timeSinceStart = currentTime - startTime;
     const currentBeatFloat = timeSinceStart / beatDur;
     const beatInMeasure = (Math.floor(currentBeatFloat) % beatsPerMeasure) + 1;
     setCurrentBeat(beatInMeasure);
   }, 50);
   ```

   with the deferred pattern from `MetronomeTrainer`:

   ```js
   const firstBeatDelay = (startTime - audioEngine.getCurrentTime()) * 1000;
   const updateVisualBeat = () => {
     const currentTime = audioEngine.getCurrentTime();
     const timeSinceStart = Math.max(0, currentTime - startTime); // clamp belt-and-braces
     const totalBeatsCompleted = Math.floor(timeSinceStart / beatDur);
     const beatInMeasure = (totalBeatsCompleted % beatsPerMeasure) + 1;
     setCurrentBeat(beatInMeasure);
   };
   setTimeout(
     () => {
       updateVisualBeat(); // initial frame at startTime
       visualMetronomeRef.current = setInterval(updateVisualBeat, 50);
     },
     Math.max(0, firstBeatDelay)
   );
   ```

   The `Math.max(0, …)` clamp on `timeSinceStart` is a defensive guard so even if `setTimeout` fires a hair early, `Math.floor(0/beatDur) = 0`, `(0 % N) + 1 = 1` — beat 1 displayed correctly, never beat 0.

   c. **Initial scheduling unchanged otherwise.** Keep `scheduleBeats(audioEngine.getCurrentTime())` called immediately so the first cluster of beats is queued ahead of `startTime`. The 50ms-cadence `setInterval` then keeps the queue topped up.

   d. **Dependency array for the `useCallback`.** Keep `[audioEngine, beatsPerMeasure, createClickSound]` — no new dependencies introduced.

4. **Confirm cleanup still works.** `stopContinuousMetronome` already clears both `continuousMetronomeRef` and `visualMetronomeRef`. The setTimeout that _creates_ the visual interval is fire-and-forget — if cleanup runs before it fires, `visualMetronomeRef.current` will simply remain `null` and there is nothing to clear. Add a tiny safety:
   - Inside the `setTimeout` callback, before assigning `visualMetronomeRef.current = setInterval(...)`, check `if (continuousMetronomeRef.current === null) return;` (i.e., if the audio scheduler has already been stopped, don't start a stray visual loop). This prevents leaks when the user backs out of the question during count-in.

5. **Do NOT change:** `createClickSound`, `evaluatePerformance`, `handleTap`, `handlePressStart`, `handlePressEnd`, `registerFirstOnset`, the hold-mechanic logic, the pattern-playback piano scheduling in `startFlow`, or the JSX render block. Only `startFlow`'s init-guard / countInStartTime and `startContinuousMetronome`'s body.

6. **Sanity grep before committing:**
   ```
   grep -n "+ 0.3"  src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx   # should match nothing
   grep -n ", 200)" src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx   # should match nothing in startContinuousMetronome
   grep -n "firstBeatDelay" src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx  # should match
   ```
     </action>
     <verify>
       <automated>npx vitest run src/components/games/rhythm-games/renderers</automated>
       <manual>
         1. `npm run dev`. Visit a trail node that uses `RhythmTapQuestion` (notation tap — any rhythm node with a tap-the-pattern exercise; e.g., a quarter-note rhythm exercise).
         2. Watch + listen during the **count-in**: clicks must be **audible** (downbeat 700Hz, off-beats 550Hz) AND the `MetronomeDisplay` circles must advance 1 → 2 → 3 → 4 (yellow during count-in, blue during user phase) in time with the audio. The yellow/blue scaled-150% indicator must move every beat — not stay stuck on circle 1.
         3. During **pattern playback**: piano notes are audible at the correct positions; metronome continues.
         4. During the **user-tap phase**: indicator continues to advance 1→2→3→4 while the user taps. Tapping still scores correctly (PERFECT/GOOD/MISS feedback shown).
         5. Repeat on a slow tempo (e.g., 60 BPM) and a fast tempo (e.g., 100 BPM) to confirm the fix isn't tempo-specific.
         6. Open Chrome DevTools → Console. There should be no `Audio context not initialized` warnings during the count-in. (One-time warmup logs are OK.)
       </manual>
     </verify>
     <done>
       Count-in clicks are audible from the very first beat. The MetronomeDisplay beat indicator advances 1 → 2 → 3 → 4 in sync with the audio, throughout count-in, pattern playback, and user-tap phases. The fix is a non-invasive port of `MetronomeTrainer`'s working pattern. No existing rhythm-renderer tests regress.
     </done>
   </task>

</tasks>

<verification>
Run automated test suites:

```bash
npx vitest run src/components/games/rhythm-games/renderers
npx vitest run src/components/games/rhythm-games/__tests__/SyllableMatchingGame.test.jsx
npx vitest run src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx
npm run lint
npm run build   # also runs validateTrail.mjs as prebuild — ensures durationInfo.js stayed Node-safe
```

All must pass before manual UAT.

Manual UAT (single phone-emulated landscape session):

- Open `npm run dev`, switch DevTools to a mobile-landscape preset (iPhone SE landscape, 667x375).
- Navigate to a rhythm trail unit that contains: (1) a discovery-intro question, (2) a syllable-matching question with `8_pair` in the pool, (3) a notation tap question.
- Verify Bug 1: intro card fits the viewport without clipping, Listen + Got it both work.
- Verify Bug 2: no two syllable cards display the same text.
- Verify Bug 3: count-in clicks audible, beat indicator advances 1→2→3→4.
  </verification>

<success_criteria>

- All three bugs fixed and observable as described in `must_haves.truths`.
- New regression test in `SyllableMatchingQuestion.test.jsx` passes.
- All existing rhythm-renderer tests still pass.
- `npm run build` succeeds (validateTrail.mjs still imports `durationInfo.js` cleanly — no VexFlow leak).
- No new dependencies added.
- Glassmorphism design system preserved (nothing introduces `bg-white/80` legacy styles or breaks the purple gradient context).
- `RhythmTapQuestion.jsx` no longer contains the `+ 0.3` or 200ms-cadence patterns; it does contain `firstBeatDelay`.
  </success_criteria>

<output>
After completion, create `.planning/quick/260504-jbu-fix-three-rhythm-trail-bugs-1-meet-the-q/260504-jbu-01-SUMMARY.md` summarizing the three fixes, files changed, and any nuances discovered during execution (e.g., if Hebrew "ti-ti" needs follow-up Nikud from the user).
</output>
