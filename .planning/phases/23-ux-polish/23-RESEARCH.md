# Phase 23: UX Polish - Research

**Researched:** 2026-04-07
**Domain:** Rhythm game UX — timing, i18n, VexFlow annotation, trail data
**Confidence:** HIGH

## Summary

Phase 23 makes the rhythm trail feel child-friendly across five concrete dimensions: wider timing tolerance for easy nodes, child-safe language (no "MISS", no "MetronomeTrainer"), correct progressive measure lengths in trail data, and Kodaly syllable rendering below VexFlow note heads. All five requirements have well-defined implementation paths with existing infrastructure already in place.

The most complex requirement is UX-05 (Kodaly syllables). VexFlow 5 ships an `Annotation` class with `addModifier(annotation, index)` on `StaveNote`, verified working in this codebase's installed VexFlow 5 package. `AnnotationVerticalJustify.BOTTOM` places text below the note head and stays auto-aligned when the formatter runs. The toggle state model (localStorage persist, enforced-on for Discovery nodes) fits the existing pattern established by accessibility preferences.

UX-04 (progressive measure length) requires the most data work: 30 exercise configs across 8 unit files need `measureCount` updated to match policy, and `RhythmStaffDisplay` currently renders one measure only — multi-stave support must be added before 2-bar and 4-bar patterns can display correctly.

**Primary recommendation:** Implement in dependency order — UX-01 (timing, no rendering dependency) → UX-02 and UX-03 (i18n only) → UX-04 (data + display) → UX-05 (VexFlow annotation, depends on display working correctly).

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Two-tier threshold system — "easy" nodes (Discovery, Practice, MIX_UP, REVIEW) get PERFECT=100ms base; "hard" nodes (CHALLENGE, SPEED_ROUND, MINI_BOSS, BOSS) keep current PERFECT=50ms base.

**D-02:** Threshold logic lives in the shared `rhythmTimingUtils.js` — add a `nodeType` parameter to `calculateTimingThresholds()`. MetronomeTrainer's local duplicate (`BASE_TIMING_THRESHOLDS` at line 37) gets removed (dedup).

**D-03:** Tempo-scaling is preserved on top of the new base — at 65 BPM a Discovery node would get ~140ms PERFECT window (100ms × tempo scaling factor).

**D-04:** MetronomeTrainer's user-facing name becomes "Listen & Tap" (EN) / "חזור אחריי" (HE).

**D-05:** Internal component filename `MetronomeTrainer.jsx` stays unchanged — only i18n labels and page titles change.

**D-06:** The string "MetronomeTrainer" must not appear in any visible UI label after this phase.

**D-07:** "MISS" feedback text replaced with "Almost!" (EN) / Hebrew equivalent with Nikud (HE) in all rhythm games.

**D-08:** Affected i18n keys: `games.metronomeTrainer.tapArea.accuracy.miss` and `games.rhythmReading.tapArea.accuracy.miss` (and any other miss-related keys across rhythm game components).

**D-09:** Internal code constants (`"MISS"` as enum values in scoring logic) remain unchanged — only user-visible text changes.

**D-10:** Node-type-to-measure-count mapping: Discovery=1-bar, Practice=2-bar, MIX_UP=1-bar, REVIEW=2-bar, CHALLENGE=2-bar, SPEED_ROUND=4-bar, MINI_BOSS=4-bar, BOSS=4-bar.

**D-11:** Enforced in data layer — each node's exercise config `measureCount` field is updated to match the policy. Game components read the config value directly.

**D-12:** Build validator (`validateTrail.mjs`) enforces the nodeType-to-measureCount mapping — prevents future drift.

**D-13:** Syllable toggle button added to ALL rhythm games that render notation (RhythmReadingGame, RhythmDictationGame, and any future notation-showing game). Toggle button sits in the settings bar above the staff.

**D-14:** Syllables are enforced (always-on, toggle hidden) on Discovery nodes — these introduce new durations.

**D-15:** All other node types show the toggle button, defaulting to the user's persisted preference.

**D-16:** Toggle state persists in localStorage across sessions.

**D-17:** Rendering uses VexFlow's annotation API (TextNote annotations) attached below each note head.

**D-18:** Duration-to-syllable mapping (EN): quarter=ta, eighth pair=ti-ti, half=ta-a, whole=ta-a-a-a. Hebrew equivalents with Nikud: quarter=טָה, eighth pair=טִי-טִי, half=טָה-אָה, whole=טָה-אָה-אָה-אָה (user to confirm exact Nikud).

**D-19:** Rests show syllable: 'sh' (EN) / 'הס' with Nikud (HE) — user to provide exact Nikud version.

**D-20:** Syllable font/size: Claude's discretion, should be readable but not dominate the notation.

### Claude's Discretion

- Exact animation/styling of the syllable toggle button
- Font size and positioning offset for syllable annotations in VexFlow
- Order of implementation across the 5 requirements
- Test structure and coverage approach
- How games that don't render VexFlow notation (MetronomeTrainer pulse mode, ArcadeRhythmGame falling tiles) handle the toggle — likely hidden/disabled since there are no note heads to annotate

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID    | Description                                                                    | Research Support                                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-01 | Timing PERFECT threshold widened to 100ms for Discovery/Practice nodes         | `calculateTimingThresholds()` in `rhythmTimingUtils.js` — add `nodeType` param; remove MetronomeTrainer duplicate                                                          |
| UX-02 | MetronomeTrainer renamed to child-friendly name in UI (EN + HE i18n)           | 5 i18n keys identified across EN + HE common.json; `useDocumentTitle.js` also needs update                                                                                 |
| UX-03 | "MISS" feedback text replaced with "Almost!" throughout rhythm games (EN + HE) | 2 i18n keys identified: `games.metronomeTrainer.tapArea.accuracy.miss` + `games.rhythmReading.tapArea.accuracy.miss`; `FloatingFeedback` and `TapArea` both use these keys |
| UX-04 | Progressive measure length: Discovery 1-bar, Practice 2-bar, Speed/Boss 4-bar  | 30 policy violations identified across 8 unit files; `RhythmStaffDisplay` is single-stave — multi-stave rendering needed for 2-bar/4-bar display                           |
| UX-05 | Kodaly syllables below VexFlow note heads                                      | VexFlow `Annotation` + `AnnotationVerticalJustify.BOTTOM` + `StaveNote.addModifier()` — verified working; toggle localStorage pattern defined                              |

</phase_requirements>

---

## Standard Stack

### Core (no new packages needed)

| Library       | Version       | Purpose                      | Why Standard                                             |
| ------------- | ------------- | ---------------------------- | -------------------------------------------------------- |
| vexflow       | ^5.0.0        | Music notation SVG rendering | Already installed; `Annotation` class confirmed exported |
| react-i18next | (existing)    | i18n for EN/HE text          | Already used throughout rhythm games                     |
| localStorage  | (browser API) | Toggle state persistence     | Established pattern for UI preferences                   |

**No new npm packages required for this phase.** [VERIFIED: codebase inspection]

### VexFlow Annotation API (verified)

```javascript
// Source: verified with node REPL against installed vexflow package
import { Annotation, AnnotationVerticalJustify } from "vexflow";

const annotation = new Annotation("ta");
annotation.setVerticalJustification(AnnotationVerticalJustify.BOTTOM);
annotation.setFont({ family: "Arial", size: 10 });

// Attach to a StaveNote (index 0 = first key position)
staveNote.addModifier(annotation, 0);
```

`AnnotationVerticalJustify` values: TOP=1, CENTER=2, BOTTOM=3, CENTER_STEM=4
`addModifier` is on `StaveNote` and accepts a `Modifier` subclass — `Annotation` extends `Modifier`. [VERIFIED: npm/node REPL against vexflow package]

---

## Architecture Patterns

### UX-01: Two-Tier Timing Threshold

**Current state:** `rhythmTimingUtils.js` has `calculateTimingThresholds(tempo)` — returns `{PERFECT: 50, GOOD: 75, FAIR: 125}` scaled by tempo. `MetronomeTrainer.jsx` (lines 37-64) has a **duplicate** copy of the same logic.

**Target state:** Single shared function with `nodeType` parameter. MetronomeTrainer imports from `rhythmTimingUtils.js` and deletes its local copy.

```javascript
// Source: rhythmTimingUtils.js (current signature to be extended)
export function calculateTimingThresholds(tempo, nodeType = null) {
  const easyNodes = new Set(["discovery", "practice", "mix_up", "review"]);
  const basePerfect = easyNodes.has(nodeType) ? 100 : 50;
  const baseGood = easyNodes.has(nodeType) ? 150 : 75;
  const baseFair = easyNodes.has(nodeType) ? 250 : 125;
  const scalingFactor = Math.pow(BASE_TEMPO / tempo, 0.3);
  return {
    PERFECT: Math.round(basePerfect * scalingFactor),
    GOOD: Math.round(baseGood * scalingFactor),
    FAIR: Math.round(baseFair * scalingFactor),
  };
}
```

**Callers that need updating:**

1. `rhythmScoringUtils.js` — `scoreTap()` calls `calculateTimingThresholds(tempo)` — needs `nodeType` threaded through
2. `MetronomeTrainer.jsx` — calls local `calculateTimingThresholds(tempo)` AND has local `BASE_TIMING_THRESHOLDS` constant — remove both, import from shared module

**How nodeType reaches the callers:**

- `MetronomeTrainer.jsx` already has `nodeId` from `location.state.nodeId` — call `getNodeById(nodeId)?.nodeType` to get the type
- `RhythmReadingGame.jsx` already has `nodeId` — same pattern
- `scoreTap()` is a pure function — add optional `nodeType` param, pass from callers

**Existing test impact:** `rhythmTimingUtils.test.js` line 30 asserts `baseline.PERFECT === 50`. This test will need updating — with `nodeType = null` (no node context, free practice), base stays 50. With `nodeType = 'discovery'`, base is 100. [VERIFIED: test file read]

### UX-02: MetronomeTrainer Rename (i18n only)

**i18n keys to update:**

| File                            | JSON path                                           | Old value                  | New value        |
| ------------------------------- | --------------------------------------------------- | -------------------------- | ---------------- |
| `src/locales/en/common.json`    | `games.practiceModes.metronomeTrainer.name`         | "Metronome Rhythm Trainer" | "Listen & Tap"   |
| `src/locales/en/common.json`    | `games.metronomeTrainer.headerTitle`                | "Metronome Rhythm Trainer" | "Listen & Tap"   |
| `src/locales/en/common.json`    | `gameSettings.titles.metronomeTrainer`              | "Metronome Rhythm Trainer" | "Listen & Tap"   |
| `src/locales/he/common.json`    | `games.practiceModes.metronomeTrainer.name`         | "תרגול קצב עם מטרונום"     | "חזור אחריי"     |
| `src/locales/he/common.json`    | `games.metronomeTrainer.headerTitle`                | "מאמן המטרונום"            | "חזור אחריי"     |
| `src/locales/he/common.json`    | `gameSettings.titles.metronomeTrainer`              | "מאמן קצב עם מטרונום"      | "חזור אחריי"     |
| `src/hooks/useDocumentTitle.js` | line 48 — `defaultValue` in metronome-trainer title | `"Metronome Trainer"`      | `"Listen & Tap"` |

Note: `games.metronomeTrainer.headerTitle` is what renders on screen (line 1550 of MetronomeTrainer.jsx). The JSON key name `metronomeTrainer` can stay — only the string value changes (D-05 decision). [VERIFIED: grep of MetronomeTrainer.jsx and i18n files]

**Internal i18n key names** like `games.metronomeTrainer.*` do NOT need to be renamed — only the translatable string values visible to the user.

### UX-03: MISS → "Almost!" Feedback

**Affected i18n keys:** [VERIFIED: grep of common.json files]

| Key                                            | EN old | EN new    | HE old  | HE new              |
| ---------------------------------------------- | ------ | --------- | ------- | ------------------- |
| `games.metronomeTrainer.tapArea.accuracy.miss` | "Miss" | "Almost!" | "פספוס" | [Nikud TBD by user] |
| `games.rhythmReading.tapArea.accuracy.miss`    | "MISS" | "Almost!" | "פספסת" | [Nikud TBD by user] |

**Components that render MISS text:**

- `FloatingFeedback.jsx` — uses `games.rhythmReading.tapArea.accuracy.miss` (used by RhythmReadingGame AND ArcadeRhythmGame via same component)
- `TapArea.jsx` — uses `games.metronomeTrainer.tapArea.accuracy.miss` (used by MetronomeTrainer)

**ArcadeRhythmGame MISS path:** Sets `latestFeedback = "MISS"` → passes to `<FloatingFeedback quality={latestFeedback}>` → FloatingFeedback reads `games.rhythmReading.tapArea.accuracy.miss`. Changing the i18n value covers ArcadeRhythmGame automatically. [VERIFIED: ArcadeRhythmGame.jsx and FloatingFeedback.jsx inspection]

**RhythmDictationGame:** Does not show MISS floating feedback (dictation game uses wrong/correct answer choices, not tap scoring). No change needed there.

### UX-04: Progressive Measure Length

**Policy (D-10):**

| nodeType    | Expected measureCount |
| ----------- | --------------------- |
| discovery   | 1                     |
| practice    | 2                     |
| mix_up      | 1                     |
| review      | 2                     |
| challenge   | 2                     |
| speed_round | 4                     |
| mini_boss   | 4                     |
| boss        | 4                     |

**Violations found (verified audit):**

| nodeType    | Violations | Current value → Target |
| ----------- | ---------- | ---------------------- |
| practice    | 15         | 1 → 2                  |
| speed_round | 8          | 2 → 4                  |
| mini_boss   | 7          | 2 → 4                  |

**Total: 30 exercise configs across 8 unit files need updating.** [VERIFIED: node script audit against all 8 unit files]

Files: `rhythmUnit1Redesigned.js` through `rhythmUnit8Redesigned.js`

**Rendering gap — multi-stave requirement:**

`RhythmStaffDisplay.jsx` currently renders a **single stave** from a flat `beats` array. The curated pattern library stores multi-measure patterns as `beats: [['q','q','q','q'], ['q','q','q','q']]` (array of arrays, one per measure). [VERIFIED: rhythmPatterns.js inspection]

`RhythmReadingGame.fetchNewPattern()` currently calls the old `getPattern()` generator (binary pattern format) not `resolveByTags`. For multi-measure to work, the game must:

1. Switch to `resolveByTags(patternTags, { measureCount })` to select curated multi-measure patterns
2. `RhythmStaffDisplay` must accept either a flat `beats` array (single measure, backward compat) OR a `measures` array (multi-measure, new)

**Multi-stave rendering pattern:** Iterate over measure arrays, create one `Stave` per measure, layout horizontally (or wrap to new row at `staveWidth` limit). Each stave is independent — format separately or join with multi-voice formatter. The cursor logic needs measure-awareness for 2/4-bar.

**Alternative (simpler) approach:** Pass a flat beats array for multi-measure patterns by flattening the curated pattern's `beats` array (all measures as one long voice). VexFlow can render all beats in one stave at reduced width. This breaks the one-measure-per-stave convention from CLAUDE.md. Not recommended.

**Recommended approach:** Add a `measures` prop to `RhythmStaffDisplay` that accepts `string[][]` (the curated pattern format), renders one stave per measure side-by-side or stacked.

**validateTrail.mjs extension (D-12):**

Add `validateMeasureCountPolicy()` function that:

1. Imports `NODE_TYPES` to get the policy map
2. For each rhythm/boss node with a `nodeType` field and non-pulse exercises, checks `exercise.config.measureCount === policy[node.nodeType]`
3. Errors on violation, called from the main execution block

Pattern mirrors existing `validateNodeTypeExerciseTypeMapping()`. [VERIFIED: validateTrail.mjs inspection]

### UX-05: Kodaly Syllable Rendering

**VexFlow Annotation flow (D-17):**

```javascript
// Source: verified against vexflow 5.0.0 installed package
import { Annotation, AnnotationVerticalJustify } from "vexflow";

function attachSyllable(staveNote, syllableText) {
  const ann = new Annotation(syllableText);
  ann.setVerticalJustification(AnnotationVerticalJustify.BOTTOM);
  ann.setFont({ family: "sans-serif", size: 10, weight: "normal" });
  staveNote.addModifier(ann, 0); // index 0 = below first key
  return ann;
}
```

This must be called BEFORE `formatter.joinVoices([voice]).format(...)` so the formatter can account for the annotation's height when spacing notes.

**Duration-to-syllable mapping (EN/HE):**

| durationUnits | VexFlow dur | EN syllable | HE syllable     |
| ------------- | ----------- | ----------- | --------------- |
| 16            | 'w'         | ta-a-a-a    | טָה-אָה-אָה-אָה |
| 8             | 'h'         | ta-a        | טָה-אָה         |
| 4             | 'q'         | ta          | טָה             |
| 2             | '8'         | ti          | טִי             |
| isRest (any)  | 'qr' etc    | sh          | הס (Nikud TBD)  |

Note: Eighth notes in pairs are "ti-ti" — but VexFlow renders each note separately. The syllable per individual eighth note is "ti", not "ti-ti". The "ti-ti" label from D-18 applies when viewing the pair as a rhythmic unit. For per-note annotation, each eighth note gets "ti". [ASSUMED — the distinction between per-note vs per-pair labeling; planner should confirm intent. The `durationUnits=2` → "ti" per note is the safer implementation.]

**Hebrew Nikud:** The exact Nikud strings for "Almost!" HE and rest syllables are user-confirmed TBD (flagged in D-18 and D-19). The planner should include a user-confirm step before implementing Hebrew strings.

**Toggle model:**

```javascript
// localStorage key (Claude's discretion)
const SYLLABLE_TOGGLE_KEY = "pianomaster_kodaly_syllables";

// Discovery nodes: always-on, toggle button hidden
const isDiscovery = nodeType === NODE_TYPES.DISCOVERY;
const syllablesEnabled =
  isDiscovery || localStorage.getItem(SYLLABLE_TOGGLE_KEY) === "true";
const showToggle = !isDiscovery;
```

**Where syllable logic lives:** Inside `beatsToVexNotes()` in `rhythmVexflowHelpers.js` OR as a post-render pass in the `RhythmStaffDisplay` `useEffect`. The annotation must be added before `formatter.format()` runs — so it must be part of the note-building step (during or just after `beatsToVexNotes()`).

**Recommended:** Add optional `syllableMap` parameter to `beatsToVexNotes()` that attaches annotations if provided. Game components compute the map from `beats` + current language + toggle state, pass it in.

**Syllable text direction:** Music notation is always `dir="ltr"` (CLAUDE.md convention, already enforced in `RhythmStaffDisplay`). Hebrew Nikud text within the annotation will still render correctly because VexFlow draws text directly via SVG `<text>` elements, not affected by CSS direction.

**Color conflict with tap results:** `RhythmStaffDisplay` currently re-colors note SVG paths on tap result. The annotation's `<text>` element is a sibling path — it will be re-colored too unless excluded. The existing colorization loop `noteEl.querySelectorAll("path, .vf-notehead path")` would not select `<text>` elements, so syllable text color should remain white unless explicitly changed. [VERIFIED: RhythmStaffDisplay.jsx lines 189-194]

---

## Don't Hand-Roll

| Problem                         | Don't Build                                       | Use Instead                                                   | Why                                                               |
| ------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| Below-note text in VexFlow      | Custom SVG text overlay with absolute positioning | `Annotation` + `AnnotationVerticalJustify.BOTTOM`             | Auto-aligned by VexFlow formatter, survives note repositioning    |
| localStorage toggle persistence | Custom storage abstraction                        | Direct `localStorage.getItem/setItem`                         | Established pattern in this codebase; no abstraction layer needed |
| Timing threshold per-node logic | Complex config system                             | Simple `Set` of easy nodeTypes in `calculateTimingThresholds` | Two tiers only; inline set is readable and testable               |

---

## Common Pitfalls

### Pitfall 1: Annotation Must Be Attached Before Format

**What goes wrong:** Adding `Annotation` after `formatter.format([voice], width)` causes annotations to be ignored in spacing calculations — notes bunch up and annotations collide.

**Why it happens:** VexFlow's `Formatter` pre-computes horizontal positions from modifiers. Post-format annotation attachment skips the spacing step.

**How to avoid:** Call `staveNote.addModifier(annotation, 0)` inside or immediately after `beatsToVexNotes()`, before `new Formatter().joinVoices([voice]).format([voice], width)` in `RhythmStaffDisplay.jsx`.

**Warning signs:** Syllable text overlapping note heads or running off the stave edge.

### Pitfall 2: MetronomeTrainer Local Threshold Duplicate Leaks nodeType

**What goes wrong:** MetronomeTrainer has its own `calculateTimingThresholds` (lines 47-64). If UX-01 only updates `rhythmTimingUtils.js` but forgets to remove the local copy, MetronomeTrainer silently uses the old 50ms threshold regardless of nodeType.

**How to avoid:** D-02 is explicit — remove `BASE_TIMING_THRESHOLDS` (line 37-43) and local `calculateTimingThresholds` (lines 47-64) from MetronomeTrainer.jsx and replace with import from `rhythmTimingUtils`.

**Warning signs:** UX-01 success criterion passes for RhythmReadingGame but not for MetronomeTrainer.

### Pitfall 3: FAIR tier missing in rhythmReading i18n key

**What goes wrong:** `games.rhythmReading.tapArea.accuracy` only has `perfect`, `good`, `miss` — no `fair` key. `games.metronomeTrainer.tapArea.accuracy` has all four. `FloatingFeedback.jsx` only renders PERFECT/GOOD/MISS (no FAIR). `TapArea.jsx` renders all four.

**How to avoid:** Only update the `miss` value in both namespaces. Do not add a `fair` key to `rhythmReading` (would be unused). Do not confuse the two separate i18n namespaces. [VERIFIED: common.json inspection]

### Pitfall 4: Multi-Measure Pattern Feed to RhythmStaffDisplay

**What goes wrong:** Unit configs with `measureCount: 2` or `measureCount: 4` will be passed to `resolveByTags()` which returns patterns with `beats: [['q','q'],['q','q']]` (array of arrays). `RhythmStaffDisplay` currently expects `beats` as a flat array of `{durationUnits, isRest}` objects. Passing nested arrays will silently produce no notes.

**How to avoid:** UX-04 must include a `RhythmStaffDisplay` extension for multi-stave rendering alongside the unit file data changes. These are the same plan/wave — data update and display update ship together.

### Pitfall 5: Existing rhythmTimingUtils Test Hardcodes 50ms Baseline

**What goes wrong:** `rhythmTimingUtils.test.js` line 29-30 asserts `baseline.PERFECT === 50` at 120 BPM. After adding `nodeType` param, calling `calculateTimingThresholds(120)` (no nodeType = null) should still return 50 for free-practice backward compat. But if the default is changed or the test isn't updated to pass `nodeType = 'discovery'` separately, CI breaks.

**How to avoid:** Keep `nodeType = null` default returning the original 50ms base. Add new test cases for `nodeType = 'discovery'` returning 100ms base.

### Pitfall 6: Hebrew Nikud Strings Not Yet Confirmed

**What goes wrong:** D-18 and D-19 explicitly flag that Hebrew syllable Nikud strings need user confirmation. Implementing placeholder Hebrew text that ships to production would show incorrect diacritics to Hebrew-speaking children.

**How to avoid:** Plan must include a user-confirm step for Hebrew strings before the Hebrew i18n keys are written. Wave 0 or Wave 1 task should surface this as a blocker.

---

## Code Examples

### UX-01: Extended calculateTimingThresholds

```javascript
// rhythmTimingUtils.js
const EASY_NODE_TYPES = new Set(["discovery", "practice", "mix_up", "review"]);
const BASE_TIMING_THRESHOLDS_EASY = { PERFECT: 100, GOOD: 150, FAIR: 250 };
const BASE_TIMING_THRESHOLDS_HARD = { PERFECT: 50, GOOD: 75, FAIR: 125 };

export function calculateTimingThresholds(tempo, nodeType = null) {
  const base = EASY_NODE_TYPES.has(nodeType)
    ? BASE_TIMING_THRESHOLDS_EASY
    : BASE_TIMING_THRESHOLDS_HARD;
  const scalingFactor = Math.pow(BASE_TEMPO / tempo, 0.3);
  return {
    PERFECT: Math.round(base.PERFECT * scalingFactor),
    GOOD: Math.round(base.GOOD * scalingFactor),
    FAIR: Math.round(base.FAIR * scalingFactor),
  };
}
```

### UX-04: validateMeasureCountPolicy (validateTrail.mjs addition)

```javascript
const MEASURE_COUNT_POLICY = {
  discovery: 1,
  practice: 2,
  mix_up: 1,
  review: 2,
  challenge: 2,
  speed_round: 4,
  mini_boss: 4,
  boss: 4,
};

function validateMeasureCountPolicy() {
  console.log("\nChecking measureCount policy...");
  let violations = 0;
  for (const node of SKILL_NODES) {
    const expected = MEASURE_COUNT_POLICY[node.nodeType];
    if (expected === undefined) continue;
    for (const exercise of node.exercises || []) {
      if (exercise.config?.pulseOnly === true) continue; // pulse exempt
      const mc = exercise.config?.measureCount;
      if (mc !== expected) {
        console.error(
          `  ERROR: "${node.id}" (${node.nodeType}) exercise has measureCount=${mc}, expected ${expected}`
        );
        hasErrors = true;
        violations++;
      }
    }
  }
  if (violations === 0) console.log("  MeasureCount policy: OK");
}
```

### UX-05: Annotation Attachment in beatsToVexNotes

```javascript
// rhythmVexflowHelpers.js — extend existing function
import {
  StaveNote,
  Stem,
  Dot,
  Annotation,
  AnnotationVerticalJustify,
} from "vexflow";

const SYLLABLE_MAP_EN = {
  16: "ta-a-a-a",
  12: "ta-a-a",
  8: "ta-a",
  4: "ta",
  2: "ti",
};
const SYLLABLE_MAP_HE = {
  16: "טָה-אָה-אָה-אָה",
  8: "טָה-אָה",
  4: "טָה",
  2: "טִי",
};

export function beatsToVexNotes(
  beats,
  { showSyllables = false, language = "en" } = {}
) {
  const syllableMap = language === "he" ? SYLLABLE_MAP_HE : SYLLABLE_MAP_EN;
  const restSyllable = language === "he" ? "הס" : "sh"; // HE Nikud TBD

  return beats.map((beat) => {
    const note = buildStaveNote(beat); // existing logic
    if (showSyllables) {
      const syllable = beat.isRest
        ? restSyllable
        : (syllableMap[beat.durationUnits] ?? "?");
      const ann = new Annotation(syllable);
      ann.setVerticalJustification(AnnotationVerticalJustify.BOTTOM);
      ann.setFont({ family: "sans-serif", size: 10, weight: "normal" });
      note.addModifier(ann, 0);
    }
    return note;
  });
}
```

---

## State of the Art

| Old Approach                                     | Current Approach                                          | When Changed | Impact                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------- |
| MetronomeTrainer had local timing threshold copy | Shared `rhythmTimingUtils.js` (Phase 22 refactor started) | Phase 22     | Phase 23 completes dedup — MetronomeTrainer must switch to import                       |
| Single-measure `RhythmStaffDisplay`              | Needs multi-measure extension                             | Phase 23     | Required for Practice (2-bar) and Speed/Boss (4-bar) display                            |
| `getPattern()` binary generator in games         | `resolveByTags()` curated patterns (Phase 22 wired)       | Phase 22     | Games should use curated API with `measureCount` filter to feed correct-length patterns |

---

## UX-04 Detailed Audit Results

All 30 exercises needing `measureCount` update, by node type:

**practice nodes (×15): measureCount 1 → 2**

- `rhythm_1_2`, `rhythm_1_4`, `rhythm_2_2`, `rhythm_2_4`, `rhythm_3_2`, `rhythm_3_4`, `rhythm_4_2`, `rhythm_4_4`, `rhythm_5_2`, `rhythm_5_5`, `rhythm_6_2`, `rhythm_6_4`, `rhythm_7_2`, `rhythm_8_2`, `rhythm_8_4`

**speed_round nodes (×8): measureCount 2 → 4**

- `rhythm_1_6`, `rhythm_2_6`, `rhythm_3_6`, `rhythm_4_6`, `rhythm_5_6`, `rhythm_6_6`, `rhythm_7_6`, `rhythm_8_6`

**mini_boss nodes (×7): measureCount 2 → 4**

- `boss_rhythm_1`, `boss_rhythm_2`, `boss_rhythm_3`, `boss_rhythm_4`, `boss_rhythm_5` (×2 due to two exercises), `boss_rhythm_7`

[VERIFIED: node script against all 8 unit files]

---

## UX-02 Complete i18n Key Inventory

All visible "MetronomeTrainer" strings to update:

**EN `src/locales/en/common.json`:**

- Line ~695: `games.practiceModes.metronomeTrainer.name` — "Metronome Rhythm Trainer"
- Line ~721: `games.metronomeTrainer.headerTitle` — "Metronome Rhythm Trainer"
- Line ~1222: `gameSettings.titles.metronomeTrainer` — "Metronome Rhythm Trainer"

**HE `src/locales/he/common.json`:**

- Line ~695: `games.practiceModes.metronomeTrainer.name` — "תרגול קצב עם מטרונום"
- Line ~721: `games.metronomeTrainer.headerTitle` — "מאמן המטרונום"
- Line ~1224: `gameSettings.titles.metronomeTrainer` — "מאמן קצב עם מטרונום"

**JS source (`src/hooks/useDocumentTitle.js`):**

- Line 48: `defaultValue: "Metronome Trainer"` in the metronome-trainer path title

**NOT needed:** The description strings (`games.practiceModes.metronomeTrainer.description`) may keep their wording or be updated for friendliness — not a success criterion for D-06.

[VERIFIED: grep of both locale files and useDocumentTitle.js]

---

## Assumptions Log

| #   | Claim                                                                                               | Section        | Risk if Wrong                                                                                                                        |
| --- | --------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | Individual eighth notes get syllable "ti" per note (not "ti-ti" per pair)                           | UX-05 patterns | If user expects "ti-ti" for each note position of a pair, annotation per note would show wrong syllable; confirm before implementing |
| A2  | Hebrew "Almost!" Nikud and rest syllable Nikud are not yet determined — user must supply            | UX-03, UX-05   | Wrong diacritics displayed to Hebrew users; must be confirmed before Hebrew i18n strings are written                                 |
| A3  | `RhythmDictationGame` does not use `FloatingFeedback` for MISS (dictation uses choice cards)        | UX-03          | If it does have a MISS feedback path, an extra i18n key change would be needed                                                       |
| A4  | GOOD and FAIR base threshold values for "easy" tier scale from 100ms PERFECT (100/150/250 proposed) | UX-01          | If proportional scaling produces unintuitive GOOD/FAIR windows, user may prefer explicit values                                      |

---

## Open Questions

1. **Hebrew "Almost!" exact string with Nikud**
   - What we know: D-07 requires Hebrew equivalent with Nikud; "פספוס" / "פספסת" are the current MISS strings
   - What's unclear: The exact Hebrew string for "Almost!" with proper Nikud diacritics
   - Recommendation: Add as Wave 0 blocker — planner should include a user-confirm task before the Hebrew i18n keys are finalized

2. **Rest syllable Hebrew Nikud**
   - What we know: D-19 specifies 'הס' with Nikud but defers exact form to user
   - What's unclear: Is it הֶס, הַס, הִס, or another vowel?
   - Recommendation: Same Wave 0 blocker — confirm alongside "Almost!" Hebrew

3. **Multi-measure cursor behavior (UX-04)**
   - What we know: `RhythmStaffDisplay` has a cursor that sweeps 0-1 across the stave
   - What's unclear: For 2-bar/4-bar patterns, should the cursor continue across staves or reset per stave?
   - Recommendation: Cursor sweeps the full duration (0 = start of measure 1, 1 = end of last measure); multi-stave layout places staves left-to-right within a scrollable container

4. **GOOD/FAIR threshold values for easy tier**
   - What we know: D-01 specifies PERFECT=100ms for easy nodes, with D-03 saying tempo-scaling preserved on top
   - What's unclear: D-01 only specifies PERFECT. Are GOOD/FAIR also scaled proportionally (50/100/125 → 100/150/250) or kept at their hard-tier values?
   - Recommendation: Scale proportionally (the ratio 50:75:125 → 100:150:250) — consistent with the mental model that "easy" tier is 2× forgiving at all levels

---

## Validation Architecture

### Test Framework

| Property           | Value                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| Framework          | Vitest (existing)                                                                  |
| Config file        | vite.config.js (vitest config inline)                                              |
| Quick run command  | `npx vitest run src/components/games/rhythm-games/utils/rhythmTimingUtils.test.js` |
| Full suite command | `npm run test:run`                                                                 |

### Phase Requirements → Test Map

| Req ID | Behavior                                                               | Test Type        | Automated Command                                                                     | File Exists?                            |
| ------ | ---------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- | --------------------------------------- |
| UX-01  | `calculateTimingThresholds(65, 'discovery')` returns PERFECT >= 100    | unit             | `npx vitest run src/components/games/rhythm-games/utils/rhythmTimingUtils.test.js`    | Partial (file exists, new cases needed) |
| UX-01  | `calculateTimingThresholds(65, 'boss')` returns PERFECT <= 60          | unit             | same                                                                                  | Wave 0 gap                              |
| UX-01  | MetronomeTrainer no longer has local BASE_TIMING_THRESHOLDS            | lint/manual      | `npm run lint` (no-longer-exported symbol would be unused import)                     | n/a                                     |
| UX-02  | "MetronomeTrainer" string absent from visible labels                   | unit/i18n        | Manual verify or grep                                                                 | n/a                                     |
| UX-03  | `games.rhythmReading.tapArea.accuracy.miss` !== "MISS"                 | i18n unit        | manual/grep                                                                           | n/a                                     |
| UX-04  | All rhythm nodes have correct measureCount per policy                  | unit (validator) | `npm run verify:trail`                                                                | Wave 0: add to validateTrail.mjs        |
| UX-05  | `beatsToVexNotes(beats, { showSyllables: true })` attaches annotations | unit             | `npx vitest run src/components/games/rhythm-games/utils/rhythmVexflowHelpers.test.js` | Partial (file exists, new cases needed) |

### Wave 0 Gaps

- [ ] `src/components/games/rhythm-games/utils/rhythmTimingUtils.test.js` — add cases for `nodeType='discovery'` (100ms base) and `nodeType='boss'` (50ms base)
- [ ] `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.test.js` — add cases for syllable annotation attachment when `showSyllables=true`
- [ ] `scripts/validateTrail.mjs` — add `validateMeasureCountPolicy()` function

_(Existing test infrastructure covers prerequisite chains, XP, node types, pattern library — no new frameworks needed)_

---

## Security Domain

This phase changes i18n strings, timing math, VexFlow annotations, and trail data values. No authentication, authorization, data storage, network calls, or cryptographic operations are added or changed.

ASVS: Not applicable to this phase — no security-relevant surface area is touched.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is code and config changes only. All dependencies (vexflow, react-i18next, Vitest) are already installed and verified by the existing test suite passing. No external services, CLI tools, or databases are required.

---

## Sources

### Primary (HIGH confidence)

- `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` — current threshold logic and signature
- `src/components/games/rhythm-games/utils/rhythmScoringUtils.js` — current `scoreTap` caller
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` lines 37-64 — local duplicate
- `src/components/games/rhythm-games/components/FloatingFeedback.jsx` — MISS i18n key used
- `src/components/games/rhythm-games/components/TapArea.jsx` — MISS i18n key used
- `src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx` — single-stave architecture
- `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js` — `beatsToVexNotes` (annotation target)
- `src/locales/en/common.json` lines 695, 720, 1222 — MetronomeTrainer i18n strings
- `src/locales/he/common.json` lines 695, 720, 1224 — Hebrew equivalents
- `src/data/units/rhythmUnit1-8Redesigned.js` — measureCount values (all 8 files audited)
- `src/data/nodeTypes.js` — NODE_TYPES enum values
- `scripts/validateTrail.mjs` — existing validator structure for extension
- VexFlow 5 package (node REPL) — `Annotation`, `AnnotationVerticalJustify`, `addModifier` confirmed

### Secondary (MEDIUM confidence)

- `src/data/patterns/rhythmPatterns.js` — multi-measure pattern format confirmed (`beats` as array-of-arrays)
- `src/data/PEDAGOGY.md` — Kodaly pedagogy rationale

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new libraries; VexFlow Annotation API verified in-process
- Architecture: HIGH — all canonical files read; function signatures confirmed
- Pitfalls: HIGH — derived from direct inspection of existing code paths
- Data audit: HIGH — automated audit of all 8 unit files confirmed 30 violations

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable codebase; VexFlow API unlikely to change)
