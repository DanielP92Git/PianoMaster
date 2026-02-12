### Sight-Reading Rhythm Settings – Implementation Plan

This document outlines how to extend the **Sight Reading** game so that, in the pre‑game settings flow, step 4/5 lets the user configure **rhythmic patterns** in addition to the existing **time‑signature** selection. The goal is to support:

- Selecting which **note values** may appear: whole, half, quarter, eighth, sixteenth.
- Enabling/disabling **rests**, and if enabled, which **rest values** may appear.
- Ensuring the **generated rhythmic patterns** and **VexFlow rendering** faithfully reflect these settings.

All references to VexFlow APIs and idioms should be cross‑checked with the existing docs in:

- `docs/vexflow-notation/vexflow-guidelines.md`
- `docs/vexflow-notation/vexflow-tutorial.md`
- `docs/vexflow-notation/vexflow-examples.md`

Key game logic lives in:

- `src/components/games/sight-reading-game/SightReadingGame.jsx`

---

### Phase 1 – Requirements & Data Model Design

1. **Clarify UX Requirements**
   - In step **4/5** of the settings wizard (time‑signature step today), add rhythmic options:
     - **Allowed note values** (multi‑select):
       - Whole, Half, Quarter, Eighth, Sixteenth.
     - **Rests toggle**:
       - Option A: _No rests_.
       - Option B: _Allow rests_, with multi‑select of rest durations (whole, half, quarter, eighth, sixteenth).
   - Defaults (to confirm with UX, propose):
     - Note values: Quarter + Eighth enabled by default.
     - Rests: off by default.

2. **Define Settings Shape**
   - Extend the unified game settings model (sight‑reading only) with a `rhythmSettings` structure, for example:
     - In JS/TS terms:
       ```js
       rhythmSettings: {
         allowedNoteDurations: string[]; // e.g. ["w", "h", "q", "8", "16"]
         allowRests: boolean;
         allowedRestDurations: string[]; // same duration codes as notes
       }
       ```
   - Duration codes should align with **VexFlow duration strings** per the VexFlow docs:
     - See `vexflow-tutorial.md` for supported durations (`"w"`, `"h"`, `"q"`, `"8"`, `"16"`, dotted variants etc.).
   - Decide where these live:
     - As part of the **sight‑reading settings** persisted in the same store/API as existing sight‑reading settings.
     - Backwards‑compatible defaults: if `rhythmSettings` is absent, fall back to the current behavior.

3. **Map Settings to Game Logic Responsibilities**
   - Identify how the sight‑reading game currently builds rhythmic patterns in `SightReadingGame.jsx`:
     - Which functions already control **time signature**, **pattern length**, and **note durations**?
     - Where VexFlow note durations are decided (e.g. `"q"`, `"8"`, etc.).
   - Decide how the new `rhythmSettings` will influence:
     - **Pattern generation** (which note/rest durations can be chosen for each beat).
     - **Validation/scoring** (if rhythm accuracy is involved).
     - **VexFlow rendering** (noteheads, beams, and rest glyphs).

---

### Phase 2 – Settings UI Integration (UnifiedGameSettings)

1. **Locate the Time‑Signature Step**
   - Open `src/components/games/shared/UnifiedGameSettings.jsx`.
   - Find the **TimeSignatureSelection** step in the `steps` array configured by:
     - `src/components/games/sight-reading-game/components/PreGameSetup.jsx`
   - Step 4/5 today corresponds to this **time signature** step for sight‑reading.

2. **Extend Step Configuration**
   - In `PreGameSetup.jsx`, augment the time‑signature step’s `config` for sight‑reading to indicate rhythmic options are needed, for example:
     ```js
     {
       id: "timeSignature",
       title: "gameSettings.steps.labels.timeSignature",
       component: "TimeSignatureSelection",
       config: {
         timeSignatures: [/* existing list */],
         showRhythmOptions: true, // NEW: used only by sight-reading
       },
     }
     ```

3. **Update TimeSignatureSelection UI**
   - In `UnifiedGameSettings.jsx`, in the `TimeSignatureSelection` component:
     - Read the new `config.showRhythmOptions` flag.
     - If `true`, render an additional **“Rhythm Settings”** subsection below the time‑signature grid:
       - **Note values multi‑select**:
         - Implement as a small grid of pill buttons (Whole, Half, Quarter, Eighth, Sixteenth).
         - Toggling a pill updates `settings.rhythmSettings.allowedNoteDurations`.
         - Store durations in VexFlow duration form (`"w"`, `"h"`, `"q"`, `"8"`, `"16"`).
       - **Rests toggle + rest values multi‑select**:
         - A switch or checkbox: “Allow rests”.
         - When on, show the rest duration pills (same durations) wired to `allowedRestDurations`.
       - Lightweight validation:
         - Prevent “no note values selected” (show inline message or disable Next).
         - If rests are enabled but no rest durations are selected, fall back to using note durations or show warning.
     - Use the existing `updateSetting` helper to mutate `settings.rhythmSettings`.

4. **Internationalization & Labels**
   - Add new i18n keys in `locales/he/common.json` (and other locales as needed) for:
     - `gameSettings.rhythmSettings.title`
     - `gameSettings.rhythmSettings.noteValuesLabel`
     - `gameSettings.rhythmSettings.restsToggleLabel`
     - `gameSettings.rhythmSettings.restValuesLabel`
   - Keep button labels short (e.g. “1/4”, “1/8”) where appropriate to avoid layout issues.

5. **Persist Rhythm Settings Through the Wizard**
   - Ensure `UnifiedGameSettings` includes `rhythmSettings` in the `settings` state and passes it back via `onStart`.
   - In `PreGameSetup.jsx`, when preparing `preparedSettings`, ensure `rhythmSettings` is **untouched** or initialized with defaults if undefined.

---

### Phase 3 – Wiring Rhythm Settings into SightReadingGame Logic

1. **Identify Rhythm Generation Points**
   - In `src/components/games/sight-reading-game/SightReadingGame.jsx`:
     - Find where **patterns** are created for each exercise:
       - Look for functions that:
         - Build `pattern.notes` or a similar structure.
         - Reference durations (`"q"`, `"8"`, etc.).
         - Use time‑signature info to determine measure length.
   - Document:
     - The current **default durations** used.
     - How many beats/measures per pattern.

2. **Inject Rhythm Settings into Game State**
   - Ensure the loaded sight‑reading `gameSettings` includes `rhythmSettings` from the setup flow.
   - Add a helper in `SightReadingGame.jsx`:
     ```js
     const getActiveRhythmSettings = (gameSettings) => ({
       allowedNoteDurations: gameSettings.rhythmSettings
         ?.allowedNoteDurations || ["q", "8"],
       allowRests: !!gameSettings.rhythmSettings?.allowRests,
       allowedRestDurations:
         gameSettings.rhythmSettings?.allowedRestDurations || [],
     });
     ```
   - Use this helper wherever patterns are generated.

3. **Adapt Pattern Generation**
   - Create or update a utility (inside `SightReadingGame.jsx` or a helper module) to generate rhythmic sequences given:
     - Time signature (beats and beat value).
     - Total beats per pattern (e.g., 1–2 measures).
     - `allowedNoteDurations` and `allowedRestDurations`.
     - `allowRests`.
   - Algorithm sketch:
     - Convert selected durations to **beat lengths**:
       - For 4/4:
         - `"w" = 4`, `"h" = 2`, `"q" = 1`, `"8" = 0.5`, `"16" = 0.25`.
       - For non‑4/4 signatures, adjust per VexFlow & music theory (see `vexflow-guidelines.md` and `vexflow-tutorial.md` for examples).
     - Randomly pick durations that sum to the target beat count:
       - Use a simple backtracking or “fill remaining beats” loop, ensuring no overrun.
     - When `allowRests` is true:
       - Choose between **note** vs **rest** placements with a tunable probability (e.g. 70% notes / 30% rests).
       - Rests must use durations from `allowedRestDurations` only.

4. **Integrate with VexFlow Note Creation**
   - In `VexFlowStaffDisplay.jsx` and any sight‑reading note factory functions, ensure:
     - Note durations from the pattern map cleanly to `StaveNote` duration strings.
     - Rests use the `"qr"`, `"8r"`, etc. duration syntax (see `vexflow-tutorial.md` and `vexflow-examples.md`).
     - Beam groups and ties still behave correctly with mixed durations (consult `vexflow-guidelines.md` for best practices on beaming eighths/sixteenths).
   - If the current pattern representation already includes a `duration` field compatible with VexFlow, reuse it; otherwise, map your new internal durations into VexFlow duration strings during rendering.

5. **Edge Cases**
   - If the combination of selected durations makes it **impossible** to fill a measure exactly (e.g., only sixteenths allowed in 3/4 with certain pattern constraints), handle gracefully:
     - Fallback to a simpler set of durations (e.g., quarters) for that pattern.
     - Or slightly relax the pattern length requirement (cap at nearest valid beat sum) while keeping measure boundaries visually consistent.

---

### Phase 4 – Validation, Testing, and UX Polish

1. **Validation Rules in Settings**
   - Enforce at least **one note duration** selected before allowing “Next”.
   - If `allowRests` is true but `allowedRestDurations` is empty:
     - Either auto‑populate rest durations from note durations.
     - Or show a small warning and prevent advancing.

2. **Visual QA**
   - Test the settings UX across breakpoints:
     - iPhone SE / small landscape (buttons fit, no truncation).
     - Tablet and desktop (buttons not oversized, labels readable).
   - Verify that:
     - Rhythm settings are preserved when navigating back and forth between steps.
     - “Exit Game” & Next/Back buttons layout remains intact.

3. **End‑to‑End Rhythm Behavior Tests**
   - For a few representative configurations, run through one or more exercises and confirm:
     - **Only allowed note values** appear in the staff.
     - **Rests** appear only when enabled and with the chosen durations.
     - Bar lengths respect the chosen time signature and sum to the correct number of beats.
   - Recommended test cases:
     - 4/4 with quarters only, no rests.
     - 4/4 with quarters + eighths, rests allowed (quarter + eighth rests).
     - 3/4 with halves + quarters, no rests.
     - 6/8 with eighth + sixteenth patterns (consult `vexflow-examples.md` for proper beaming and grouping).

4. **Code Quality & Documentation**
   - Keep rhythm logic clearly separated (e.g., helper functions with doc comments).
   - Add brief inline comments referencing the relevant VexFlow docs sections when using less obvious APIs (e.g., rest syntax or complex beaming).
   - If useful, add a short “Rhythm settings overview” section to `docs/sight-reading-ui-reimplementation-plan.md` with a link to this file.

---

### Phase 5 – Future Enhancements (Optional)

These are not required for the initial implementation but are worth documenting:

1. **Difficulty Presets**
   - Offer presets like _Beginner_ / _Intermediate_ / _Advanced_ rhythm sets:
     - Beginner: quarters + halves, no sixteenths, few rests.
     - Intermediate: quarters + eighths + some rests.
     - Advanced: all durations incl. sixteenths + rests.

2. **Pattern Complexity Controls**
   - Add sliders or toggles to control:
     - Maximum number of different durations per pattern.
     - Maximum number of rests per measure.
     - Whether syncopation is allowed.

3. **Preview Staff in Settings**
   - Render a small VexFlow preview staff directly in the time‑signature step:
     - When rhythm options change, regenerate a 1–2‑measure preview using the same generator used in the game.
     - Use the same VexFlow patterns documented in `vexflow-examples.md`.
