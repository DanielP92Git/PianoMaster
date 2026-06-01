# Phase 1: Rhythm Trail Pedagogical Restructure — Pattern Map

**Mapped:** 2026-06-01
**Files analyzed:** 24 (10 new unit data files, 1 renamed unit, 1 aggregator, 1 UNITS map, 1 renderer, 4 locale files, 1 config, 1 validator, 1 migration, 1 SW, 4 test files)
**Analogs found:** 24 / 24 (100% — every file has a strong analog in the existing codebase; this phase is restructure + extension, not greenfield)

## File Classification

### Data layer (unit files + aggregator + UNITS map)

| New/Modified File                                                                | Role   | Data Flow   | Closest Analog                                                | Match Quality |
| -------------------------------------------------------------------------------- | ------ | ----------- | ------------------------------------------------------------- | ------------- |
| `src/data/units/rhythmUnit1.js` (Quarter + qr)                                   | model  | data-export | `src/data/units/rhythmUnit1Redesigned.js`                     | exact         |
| `src/data/units/rhythmUnit2.js` (Half + hr)                                      | model  | data-export | `src/data/units/rhythmUnit1Redesigned.js`                     | exact         |
| `src/data/units/rhythmUnit3.js` (Whole + wr)                                     | model  | data-export | `src/data/units/rhythmUnit1Redesigned.js`                     | exact         |
| `src/data/units/rhythmUnit4.js` (Eighths)                                        | model  | data-export | `src/data/units/rhythmUnit1Redesigned.js`                     | exact         |
| `src/data/units/rhythmUnit5.js` (Sixteenths)                                     | model  | data-export | `src/data/units/rhythmUnit1Redesigned.js`                     | exact         |
| `src/data/units/rhythmUnit6.js` (Dotted Half)                                    | model  | data-export | `src/data/units/rhythmUnit1Redesigned.js`                     | exact         |
| `src/data/units/rhythmUnit7.js` (Dotted Quarter)                                 | model  | data-export | `src/data/units/rhythmUnit1Redesigned.js`                     | exact         |
| `src/data/units/rhythmUnit8.js` (3/4 Meter — NEW NUMERIC NAMESPACE)              | model  | data-export | `src/data/units/rhythmUnit1Redesigned.js`                     | exact         |
| `src/data/units/rhythmUnit9.js` (6/8 Meter — today's U7 content, repositioned)   | model  | data-export | `src/data/units/rhythmUnit1Redesigned.js`                     | exact         |
| `src/data/units/rhythmUnit10.js` (Rhythm Review Boss only)                       | model  | data-export | `src/data/units/rhythmUnit8Redesigned.js` (boss node section) | role-match    |
| `src/data/units/rhythmUnit8Redesigned.js` (RENAMED IDs `rhythm_synco_*`, hidden) | model  | data-export | itself (modify in place)                                      | self          |
| `src/data/expandedNodes.js`                                                      | config | aggregator  | itself (current shape)                                        | self          |
| `src/data/skillTrail.js` (UNITS map: RHYTHM_8/9/10 new, RHYTHM_SYNCO add)        | config | data-export | `RHYTHM_7` / `RHYTHM_8` entries in same file                  | exact         |

### UI / Engine (extend, do not replace)

| New/Modified File                                                                                | Role      | Data Flow    | Closest Analog                               | Match Quality |
| ------------------------------------------------------------------------------------------------ | --------- | ------------ | -------------------------------------------- | ------------- |
| `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` (multi-card pagination) | component | event-driven | itself (single-card current shape)           | self          |
| `src/components/games/rhythm-games/MixedLessonGame.jsx` (no change — verify nav contract intact) | component | event-driven | itself (lines 90–98 location.state contract) | self          |

### Validator

| New/Modified File                              | Role    | Data Flow      | Closest Analog                                          | Match Quality |
| ---------------------------------------------- | ------- | -------------- | ------------------------------------------------------- | ------------- |
| `scripts/validateTrail.mjs` (4 new lint rules) | utility | batch-validate | `validateGameTypePolicy()` in same file (lines 571–602) | exact         |

### Locales

| New/Modified File                                                          | Role   | Data Flow   | Closest Analog                                  | Match Quality |
| -------------------------------------------------------------------------- | ------ | ----------- | ----------------------------------------------- | ------------- |
| `src/locales/en/common.json` (`game.discovery.cards.<concept>.*` keys)     | config | i18n-lookup | existing `game.discovery.titleOverride.*` block | role-match    |
| `src/locales/he/common.json` (parity)                                      | config | i18n-lookup | existing `game.discovery.titleOverride.*` block | role-match    |
| `src/locales/en/trail.json` (`units.names.*`, `nodes.*`, `descriptions.*`) | config | i18n-lookup | existing `units.names` block                    | exact         |
| `src/locales/he/trail.json` (parity)                                       | config | i18n-lookup | existing `units.names` block                    | exact         |

### Subscription / Migration / PWA

| New/Modified File                                                | Role      | Data Flow   | Closest Analog                                                                                                  | Match Quality |
| ---------------------------------------------------------------- | --------- | ----------- | --------------------------------------------------------------------------------------------------------------- | ------------- |
| `src/config/subscriptionConfig.js` (update FREE_RHYTHM_NODE_IDS) | config    | data-export | itself (current FREE_RHYTHM_NODE_IDS)                                                                           | self          |
| `supabase/migrations/2026MMDD000001_phase1_rhythm_pedagogy.sql`  | migration | SQL-batch   | `20260204000001_reset_trail_progress_v13.sql` + `20260329000001_add_ear_training_free_nodes.sql` (compose both) | role-match    |
| `public/sw.js` (cache bump v11 → v12)                            | config    | constant    | itself (line 6 `const CACHE_NAME = "pianomaster-v11"`)                                                          | self          |

### Tests

| New/Modified File                                                                                          | Role | Data Flow | Closest Analog                                 | Match Quality |
| ---------------------------------------------------------------------------------------------------------- | ---- | --------- | ---------------------------------------------- | ------------- |
| `src/data/units/rhythmUnit{1..10}.test.js` (10 new files)                                                  | test | unit      | `src/data/units/rhythmUnit8Redesigned.test.js` | exact         |
| `src/data/units/rhythmUnits.difficulty.test.js` (update imports)                                           | test | unit      | itself                                         | self          |
| `src/data/units/rhythmUnit8Redesigned.test.js` (rename expected IDs to `rhythm_synco_*`)                   | test | unit      | itself                                         | self          |
| `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx` (pagination tests) | test | component | itself (existing tests)                        | self          |
| `src/locales/__tests__/scaffolding-card-parity.test.js` (NEW)                                              | test | unit      | NEW — no existing locale parity test in repo   | none          |
| `src/config/__tests__/freeNodes.parity.test.js` (NEW)                                                      | test | unit      | NEW — no existing SQL-mirror test in repo      | none          |

---

## Pattern Assignments

### 1. New rhythm unit data files (`src/data/units/rhythmUnit{1..9}.js`)

**Analog:** `src/data/units/rhythmUnit1Redesigned.js` (lines 16–317)

**Imports + module header pattern** (lines 16–26):

```javascript
import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 1;
const UNIT_NAME = "Quarter & Half Notes";
const CATEGORY = "rhythm";
const START_ORDER = 100;
```

**Canonical node shape (discovery + scaffolding)** — lines 36–92:

```javascript
{
  id: "rhythm_1_1",
  name: "Quarter Notes",
  description: "Discover and practice steady quarter notes",
  category: CATEGORY,
  unit: UNIT_ID,
  unitName: UNIT_NAME,
  order: START_ORDER,
  orderInUnit: 1,
  prerequisites: [],

  nodeType: NODE_TYPES.DISCOVERY,

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    durations: ["q"],
    focusDurations: ["q"],         // ← Used by validator's new lint rules (D-14)
    contextDurations: [],
    patternTags: ["quarter-only"],
    tempo: { min: 60, max: 75, default: 68 },
    pitch: "C4",
    timeSignature: "4/4",
  },

  newContent: NEW_CONTENT_TYPES.RHYTHM,
  newContentDescription: "Quarter Notes (1 beat)",

  exercises: [
    {
      type: EXERCISE_TYPES.MIXED_LESSON,
      config: {
        questions: [
          { type: "discovery_intro", focusDuration: "q" }, // ← FIRST question slot for scaffolding
          { type: "syllable_matching" },
          { type: "visual_recognition" },
          { type: "rhythm_tap" },
          { type: "rhythm_reading" },
          { type: "rhythm_dictation" },
          { type: "rhythm_tap" },
          { type: "visual_recognition" },
        ],
      },
    },
  ],

  skills: ["quarter_note"],
  xpReward: 45,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: [],
},
```

**Mini-Boss pattern (boss_rhythm_N with `category: "boss"` + `patternTagMode: "any"`)** — lines 256–315:

```javascript
{
  id: "boss_rhythm_1",
  name: "Quarter & Half Boss",
  description: "Master quarter and half notes!",
  unlockHint: "Complete all rhythm lessons above to unlock this challenge!",
  category: "boss",
  unit: UNIT_ID,
  unitName: UNIT_NAME,
  order: START_ORDER + 4,
  orderInUnit: 5,
  prerequisites: ["rhythm_1_6"],

  nodeType: NODE_TYPES.MINI_BOSS,

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.MEDIUM,
    durations: ["q", "h"],
    focusDurations: [],
    contextDurations: ["q", "h"],
    patternTags: ["quarter-only", "quarter-half"],
    patternTagMode: "any",       // ← OR-mode for cumulative boss patterns
    tempo: { min: 70, max: 80, default: 75 },
    pitch: "C4",
    timeSignature: "4/4",
  },
  // ...
  isBoss: true,
}
```

**Delta from analog:**

- **Preserve:** module-header `UNIT_ID`/`UNIT_NAME`/`CATEGORY`/`START_ORDER` constant block; node-object shape; `MIXED_LESSON` for discovery/practice/mini_boss; `ARCADE_RHYTHM` for speed_round; `patternTagMode: "any"` on boss; default export.
- **Change:** add a **second** discovery node per duration unit for the rest (e.g. `rhythm_1_3` discovery `focusDurations: ["qr"]`). Use sequential `orderInUnit` 1..6 within the unit. Re-baseline `START_ORDER` so unit ranges don't overlap (suggested: U1=100, U2=110, U3=120, …, U9=180, U10=190). For non-duration units (U4–U9), follow the 6-node arc per D-02: Intro → Practice → Discovery (mixed contrast) → Practice → Speed → Mini-Boss. Meter units (U8/U9) set `timeSignature: "3/4"` / `"6/8"`. U10 has a single `boss_rhythm_10` node with `nodeType: NODE_TYPES.BOSS`, `measureCount: 4`, `patternTagMode: "any"`, and `patternTags` enumerating every U1–U9 tag.

---

### 2. Scaffolding multi-card extension (`DiscoveryIntroQuestion.jsx`)

**Analog:** `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` (lines 32–381)

**Imports + setup pattern** (lines 11–23):

```javascript
import { useState, useCallback, useRef } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Volume2 } from "lucide-react";
import { useAudioEngine } from "../../../../hooks/useAudioEngine";
import { useAudioContext } from "../../../../contexts/AudioContextProvider";
import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
import { SVG_COMPONENTS } from "../components/DurationCard";
import { DURATION_INFO, getSyllable } from "../utils/durationInfo";
import { schedulePatternPlayback } from "../utils/rhythmTimingUtils";
import { binaryPatternToBeats } from "../utils/rhythmVexflowHelpers";
import { RhythmStaffDisplay } from "../components/RhythmStaffDisplay";
import BeamedSixteenthsIcon from "../../../../assets/musicSymbols/beamed-sixteenths.svg?react";
```

**Acknowledgement + onComplete pattern** (lines 45, 229–233):

```javascript
const hasCompletedRef = useRef(false);
// ...
const handleGotIt = useCallback(() => {
  if (hasCompletedRef.current || disabled) return;
  hasCompletedRef.current = true;
  onComplete(1, 1); // ← Informational, always "correct"
}, [onComplete, disabled]);
```

**i18n title override pattern** (lines 60–67, 271–289):

```javascript
const overrideKey = focusPattern?.id || focusDuration;
const titleOverrideKey = `game.discovery.titleOverride.${overrideKey}`;
const hasTitleOverride = i18n.exists(titleOverrideKey, { ns: "common" });
// ...
{
  hasTitleOverride ? (
    <Trans
      t={t}
      i18nKey={titleOverrideKey}
      components={{ accent: <span className="text-indigo-300" /> }}
    />
  ) : (
    <Trans
      t={t}
      i18nKey="game.discovery.meetNew"
      defaults="Meet the <accent>{{name}}</accent>!"
      values={{ name: durationName }}
      components={{ accent: <span className="text-indigo-300" /> }}
    />
  );
}
```

**Pattern-mode (focusPattern) vs single-duration branch** (lines 76–80, 306–320):

```javascript
const patternBeats = focusPattern
  ? binaryPatternToBeats(focusPattern.binary)
  : null;
// ...
{
  patternBeats ? (
    <div
      className={isLandscape ? "w-72 md:w-80 lg:w-96" : "w-72 md:w-80 lg:w-96"}
      aria-hidden="true"
    >
      <RhythmStaffDisplay
        beats={patternBeats}
        timeSignature={patternTimeSignature}
      />
    </div>
  ) : (
    <SvgIcon className={svgClass} aria-hidden="true" />
  );
}
```

**Glass card wrapper (preserve verbatim — design system match)** (lines 243–245):

```javascript
const cardClass = isLandscape
  ? "flex w-full max-w-2xl flex-row items-center gap-6 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 shadow-lg backdrop-blur-md md:max-w-3xl lg:max-w-4xl"
  : "flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-white/20 bg-white/10 px-8 py-10 shadow-lg backdrop-blur-md md:max-w-md lg:max-w-lg";
```

**Delta from analog:**

- **Preserve:** all imports; `hasCompletedRef` guard; `onComplete(1,1)` contract; `useDeclareNeedsLandscape(false)`; `useAudioContext` + `useAudioEngine` plumbing; pattern-mode branch (Unit 8 syncopation uses this — `focusPattern.id` = `qhq`/`synsyn`); glass-card classes; `<Trans>` with `accent` slot; rest-vs-tone audio branch (lines 146–164).
- **Add:** (a) `cardKinds` array derived from `question.cards` OR fallback `CONCEPT_CARDS[focusDuration]` lookup; (b) `useState(0)` for `cardIndex`; (c) `useEffect` to reset on `focusDuration`/`focusPattern.id` change; (d) `isLastCard` flag — only call `onComplete(1,1)` on last card; (e) per-card render branches (`meet`/`sound`/`music`/`ready`); (f) button label switches between "Next" (non-final) and "Got it!" (final).
- **Boundary:** all changes traceable to REQ-04 (intro/scaffolding). Inline `// REQ-04` comments per REQ-07.

---

### 3. Hidden Unit 8 rename (`rhythm_8_*` → `rhythm_synco_*`)

#### 3a. Rename inside `rhythmUnit8Redesigned.js`

**Analog:** `src/data/units/rhythmUnit8Redesigned.js` (lines 37–40, 80–82, 462)

**Current header constants** (lines 37–40):

```javascript
const UNIT_ID = 8;
const UNIT_NAME = "Syncopation";
const CATEGORY = "rhythm";
const START_ORDER = 144; // After Unit 7's 6 nodes (138-143)
```

**Current node IDs** (lines 81, 152, 223, 285, 347, 411, 462):

```
"rhythm_8_1", "rhythm_8_2", "rhythm_8_3", "rhythm_8_4",
"rhythm_8_5", "rhythm_8_6", "boss_rhythm_8"
```

**Current internal prereq chain** (lines 90, 161, 231, 293, 355, 419, 471):

```javascript
prerequisites: ["boss_rhythm_7"],   // node 1
prerequisites: ["rhythm_8_1"],      // node 2
// ... chained
prerequisites: ["rhythm_8_6"],      // boss
```

**Delta from analog:**

- **Preserve:** file path (`rhythmUnit8Redesigned.js`); `UNIT_NAME = "Syncopation"`; node-object shapes; `focusPattern.id` strings `qhq` / `synsyn` (these are pattern IDs, not node IDs — keep verbatim per RESEARCH §"Hidden Unit 8 rename impact"); test file path (`rhythmUnit8Redesigned.test.js`); HIDDEN-V1 marker comments in `expandedNodes.js`.
- **Change:** rename every `rhythm_8_N` → `rhythm_synco_N` (7 IDs); rename `boss_rhythm_8` → `boss_rhythm_synco`; update internal prereq chain to use new IDs; node 1's prereq stays `boss_rhythm_7` (chain into trail unchanged in case of re-enable). `UNIT_ID` may stay `8` numerically (semantic-only) — planner's call. `START_ORDER` need not change since unit is HIDDEN.

#### 3b. Update `expandedNodes.js` HIDDEN-V1 marker

**Analog:** `src/data/expandedNodes.js` (lines 51–52, 89, 123)

**Current marker pattern** (lines 51–52):

```javascript
// HIDDEN-V1: Unit 8 (syncopation, "Off-Beat Magic") temporarily disabled — re-enable for next release
// import rhythmUnit8Nodes from './units/rhythmUnit8Redesigned.js';
```

**Current spread placeholders** (lines 89, 123):

```javascript
// In EXPANDED_NODES (line 89):
// HIDDEN-V1: ...rhythmUnit8Nodes,
// In EXPANDED_RHYTHM_NODES (line 123):
// HIDDEN-V1: ...rhythmUnit8Nodes,
```

**Delta from analog:**

- **Preserve:** comment markers; commented-out import + spreads; structure of `EXPANDED_RHYTHM_NODES`.
- **Change:** comment text updates from "Unit 8" to "syncopation hidden unit (renamed `rhythm_synco_*` ids)"; add new `import rhythmUnit{1..10}` lines (the 10 new rhythm files) replacing today's `rhythmUnit{1..7}Redesigned` imports; update both spread blocks (`EXPANDED_NODES` + `EXPANDED_RHYTHM_NODES`) accordingly. Keep the HIDDEN-V1 comment-line for `rhythmUnit8Redesigned`.

#### 3c. Update `skillTrail.js` UNITS map

**Analog:** `src/data/skillTrail.js` (lines 315–340)

**Current `RHYTHM_7` + `RHYTHM_8` entries** (lines 315–340):

```javascript
RHYTHM_7: {
  id: "rhythm_unit_7",
  category: NODE_CATEGORIES.RHYTHM,
  name: "Six-Eight Time",
  description: "Feel two big beats — each worth three eighth notes",
  order: 7,
  theme: "Compound Meter",
  reward: { type: "accessory", id: "compound_badge", name: "Compound Meter Badge" },
},
RHYTHM_8: {
  id: "rhythm_unit_8",
  category: NODE_CATEGORIES.RHYTHM,
  name: "Off-Beat Magic",          // ← TODAY: syncopation
  description: "Master syncopation and off-beat patterns",
  order: 8,
  theme: "Syncopation",
  reward: { type: "accessory", id: "advanced_rhythm_badge", name: "Advanced Rhythm Badge" },
},
```

**Delta from analog:**

- **Preserve:** map-entry shape (`id`, `category`, `name`, `description`, `order`, `theme`, `reward`); `NODE_CATEGORIES.RHYTHM`; reward sub-object.
- **Change:** Replace `RHYTHM_8` content with **3/4 Meter** (per D-01). Replace `RHYTHM_7` content with **Dotted Quarter** (per D-01). Update `RHYTHM_1..6` to new concept assignments. Add `RHYTHM_9` (6/8 Meter) and `RHYTHM_10` (Rhythm Review) entries. Add `RHYTHM_SYNCO` entry (per RESEARCH "Pitfall 5") with `id: "rhythm_unit_synco"`, `name: "Off-Beat Magic"`, `description: "Master syncopation and off-beat patterns"` — preserves re-enable path mechanical.

---

### 4. Validator lint rules (`scripts/validateTrail.mjs`)

**Analog:** `scripts/validateTrail.mjs` `validateGameTypePolicy()` (lines 571–602)

**Existing rule function signature + error format** (lines 571–602):

```javascript
function validateGameTypePolicy() {
  console.log("\nChecking game-type policy...");
  const MIXED_LESSON_TYPES = new Set([
    NODE_TYPES.DISCOVERY,
    NODE_TYPES.PRACTICE,
    NODE_TYPES.MIX_UP,
    NODE_TYPES.REVIEW,
    NODE_TYPES.MINI_BOSS,
  ]);
  const ARCADE_TYPES = new Set([
    NODE_TYPES.CHALLENGE,
    NODE_TYPES.SPEED_ROUND,
    NODE_TYPES.BOSS,
  ]);

  let errorCount = 0;
  for (const node of SKILL_NODES) {
    if (node.category !== "rhythm") continue;
    if (!node.exercises || node.exercises.length === 0) continue;

    const nodeType = node.nodeType;
    for (const exercise of node.exercises) {
      if (
        MIXED_LESSON_TYPES.has(nodeType) &&
        exercise.type !== EXERCISE_TYPES.MIXED_LESSON
      ) {
        console.error(
          `  ERROR: Node "${node.id}" (${nodeType}) uses exercise type "${exercise.type}" but policy requires "mixed_lesson"`
        );
        hasErrors = true;
        errorCount++;
      }
      // ...
    }
  }
  if (errorCount === 0) console.log("  Game-type policy: OK");
  else console.error(`  Found ${errorCount} game-type policy violation(s)`);
}
```

**Main-block invocation pattern** (lines 677–690):

```javascript
validatePrerequisiteChains();
validateNodeTypes();
validateDuplicateIds();
validateXPEconomy();
// ...
validateGameTypePolicy();
validateMeasureCountPolicy();
```

**Delta from analog:**

- **Preserve:** function-per-rule shape; `console.log('\nChecking ...')` header line; `errorCount` accumulator; `hasErrors = true` global flag; `console.error(` ERROR: ...`)` two-space indent format; `console.log('  X: OK')` success line; main-block invocation after existing rules.
- **Add:** four new rule functions (RESEARCH §"New rules required by D-14"):
  1. `validatePulseFirst()` — first rhythm-category node by `order` must have `focusDurations` including `'q'`.
  2. `validateRestsWoven()` — uses `REST_TO_DURATION = { qr: 'q', hr: 'h', wr: 'w' }`; walks backward to find matching duration introduction.
  3. `validateConceptPerUnit()` — uses `CONCEPT_FAMILIES` constant map (`q_qr`, `h_hr`, `w_wr`, `eighths`, `sixteenths`, `dotted_half`, `dotted_quarter`); identifies meter units via `timeSignature`. Exempts U10 review boss.
  4. (Optional) Stricter `measureCount` "must be set" rule per Pitfall 4 — extend `validateMeasureCountPolicy()`.
- **Slot location:** append after `validateGameTypePolicy()` (line ~602) and before `validateMeasureCountPolicy()` (line ~613). Add invocations in main block between `validateGameTypePolicy();` (line 689) and `validateMeasureCountPolicy();` (line 690).

---

### 5. Locale files

#### 5a. Scaffolding card copy in `src/locales/{en,he}/common.json`

**Analog:** `src/locales/en/common.json` lines 1859–1877 (`game.discovery` block)

**Existing block** (lines 1859–1877):

```json
"discovery": {
  "meetNew": "Meet the <accent>{{name}}</accent>!",
  "ariaLabel": "Meet a new rhythm",
  "syllable": "Say: \"{{syllable}}\"",
  "listenButton": "Listen to the sound",
  "playing": "Playing...",
  "listen": "Listen",
  "gotIt": "Got it!",
  "titleOverride": {
    "16": "Meet the <accent>four sixteenth notes</accent> rhythm",
    "qhq": "Meet the <accent>hold-across</accent> rhythm!",
    "synsyn": "Meet the <accent>off-beat</accent> rhythm!"
  },
  "syllableOverride": {
    "16": "ta-fa-te-fe",
    "qhq": "ta — ta-a — ta",
    "synsyn": "and-a-TA  and-a-TA"
  }
}
```

**Delta from analog:**

- **Preserve:** existing `meetNew`, `ariaLabel`, `syllable`, `listen`, `playing`, `gotIt`, `titleOverride.*`, `syllableOverride.*` keys (Unit 8 syncopation overrides `qhq`/`synsyn` stay even though unit is hidden — pattern IDs not node IDs).
- **Add:** new sibling `cards` sub-tree under `discovery`:
  ```json
  "cards": {
    "q":  { "meet": { "title": "...", "body": "..." }, "sound": {...}, "music": {...}, "ready": {...} },
    "qr": { "meet": {...}, "music": {...}, "ready": {...} },
    "h":  { ... },  "hr": { ... },
    "w":  { ... },  "wr": { ... },
    "8_pair": { ... }, "16": { ... },
    "hd": { ... }, "qd": { ... },
    "3_4": { ... }, "6_8": { ... }
  }
  ```
- **HE parity:** identical key tree in `src/locales/he/common.json`. Kodaly syllables in `syllableOverride` stay user-confirmed nikud (do not re-author).

#### 5b. Unit/node display strings in `src/locales/{en,he}/trail.json`

**Analog:** `src/locales/en/trail.json::units.names`, `nodes`, `descriptions` (string-key style, NOT node-ID-key style — verified RESEARCH §"Locale-Key Pattern").

**Delta from analog:**

- **Preserve:** string-key-by-display-name convention.
- **Change:** Add new entries under `units.names`: `"Quarter + Quarter Rest"`, `"Half + Half Rest"`, `"Whole + Whole Rest"`, `"Eighth Notes"`, `"Sixteenth Notes"`, `"Dotted Half Notes"`, `"Dotted Quarter Notes"`, `"Three-Four Time"`, `"Six-Eight Time"` (reused if same as today), `"Rhythm Review"`. Add new `nodes` entries for any new node `name` values introduced across U1–U10. Add `descriptions` entries to match. Remove orphan keys whose source string no longer appears in any node (per Pitfall 3).

---

### 6. Subscription paywall config (`src/config/subscriptionConfig.js`)

**Analog:** `src/config/subscriptionConfig.js` (lines 46–54)

**Existing free-rhythm export** (lines 46–54):

```javascript
/** Rhythm Unit 1 — 4 free nodes (rhythm_1_5 removed Phase 32; rhythm_1_2 merged into rhythm_1_1) */
// NOTE: The Postgres is_free_node() mirror still listing rhythm_1_2 is harmless
// and intentionally left alone per the no-migration decision for this merge.
export const FREE_RHYTHM_NODE_IDS = [
  "rhythm_1_1",
  "rhythm_1_3",
  "rhythm_1_4",
  "rhythm_1_6",
];
```

**Delta from analog:**

- **Preserve:** `FREE_RHYTHM_NODE_IDS` named export; comment header pattern; downstream `FREE_NODE_IDS` Set composition (lines 86–91); `FREE_TIER_SUMMARY` shape (lines 99–106).
- **Change:** per D-12, set to 5 content IDs + `boss_rhythm_1`. Update comment to "Rhythm Unit 1 — 6 free nodes (Phase 1 v3.5 restructure, synced with Postgres `is_free_node()`)". Update `FREE_TIER_SUMMARY.rhythm.count` from 4 to 6 (treble stays 7, bass 6, ear 6 → `total: 25`):
  ```javascript
  export const FREE_RHYTHM_NODE_IDS = [
    "rhythm_1_1",
    "rhythm_1_2",
    "rhythm_1_3",
    "rhythm_1_4",
    "rhythm_1_5",
  ];
  // boss_rhythm_1 included via PAYWALL_BOSS_NODE_IDS-style addition or moved into FREE_NODE_IDS Set
  ```
  Decision (planner's call): keep `boss_rhythm_1` in `PAYWALL_BOSS_NODE_IDS` per current shape — or move it into `FREE_NODE_IDS` since D-12 says "all 6 of U1 are free." Recommend moving since D-12 explicitly lists `boss_rhythm_1`.

---

### 7. Supabase migration (wipe + `is_free_node()`)

**Analog 1 — wipe shape:** `supabase/migrations/20260204000001_reset_trail_progress_v13.sql` (lines 1–74)

**Header + transaction wrapper** (lines 1–14):

```sql
-- Migration: Reset Trail Progress for v1.3 Redesigned System
-- Date: 2026-02-04
-- Description: Atomic reset of trail-specific progress while preserving XP totals
--
-- v1.3 introduces 87 redesigned nodes (treble 1-3, bass 1-3, rhythm 1-6) replacing
-- the legacy 18-node system. Progress reset is necessary because:
-- 1. Node IDs have changed (old progress references invalid nodes)
-- 2. Pedagogy has been redesigned for 8-year-old learners
-- 3. Clean start ensures consistent learning experience
--
-- XP totals are preserved to maintain user motivation.

BEGIN;
```

**Pre-flight log block + conditional `student_unit_progress`** (lines 17–58):

```sql
DO $$
DECLARE
  v_total_students INTEGER;
  v_total_progress INTEGER;
  v_total_xp BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total_students FROM students;
  SELECT COUNT(*) INTO v_total_progress FROM student_skill_progress;
  SELECT COALESCE(SUM(total_xp), 0) INTO v_total_xp FROM students;
  RAISE NOTICE 'Pre-migration state:';
  RAISE NOTICE '  Skill progress records: %', v_total_progress;
  RAISE NOTICE '  Total XP (preserved): %', v_total_xp;
END $$;

DELETE FROM student_skill_progress;
DELETE FROM student_daily_goals;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_unit_progress') THEN
    DELETE FROM student_unit_progress;
    RAISE NOTICE 'Deleted student_unit_progress records';
  END IF;
END $$;
```

**Post-flight verify + metadata comment + commit** (lines 60–73):

```sql
DO $$
DECLARE v_total_xp_after BIGINT;
BEGIN
  SELECT COALESCE(SUM(total_xp), 0) INTO v_total_xp_after FROM students;
  RAISE NOTICE 'Post-migration: Total XP preserved: %', v_total_xp_after;
END $$;

COMMENT ON TABLE student_skill_progress IS
  'Trail progress reset 2026-02-04 for v1.3 redesigned system (87 nodes). XP totals preserved.';

COMMIT;
```

**Analog 2 — surgical rhythm DELETE:** `supabase/migrations/20260330000001_reset_rhythm_node_progress.sql` (lines 1–13)

```sql
-- Phase 11: Reset exercise_progress and stars for all remapped rhythm nodes
-- DEPLOY CONSTRAINT: This migration MUST run before updated rhythmUnit*.js files deploy to production.

UPDATE public.student_skill_progress
SET exercise_progress = '[]'::jsonb, stars = 0, best_score = NULL
WHERE node_id LIKE 'rhythm_%'
   OR node_id LIKE 'boss_rhythm_%';
```

**Analog 3 — `is_free_node()` REPLACE:** `supabase/migrations/20260329000001_add_ear_training_free_nodes.sql` (lines 1–32)

```sql
CREATE OR REPLACE FUNCTION public.is_free_node(node_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN node_id = ANY(ARRAY[
    'treble_1_1', 'treble_1_2', 'treble_1_3', 'treble_1_4',
    'treble_1_5', 'treble_1_6', 'treble_1_7',
    'bass_1_1', 'bass_1_2', 'bass_1_3', 'bass_1_4',
    'bass_1_5', 'bass_1_6',
    'rhythm_1_1', 'rhythm_1_2', 'rhythm_1_3', 'rhythm_1_4',
    'rhythm_1_5', 'rhythm_1_6',
    'ear_1_1', 'ear_1_2', 'ear_1_3', 'ear_1_4',
    'ear_1_5', 'ear_1_6'
  ]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_free_node(TEXT) TO authenticated;
COMMENT ON FUNCTION public.is_free_node IS
  'Returns true for free-tier accessible trail nodes. Synced with JS subscriptionConfig.js FREE_NODE_IDS. Updated in Phase 10 to include ear training Unit 1.';
```

**Delta from analogs (compose all three):**

- **Preserve:** `BEGIN; ... COMMIT;` wrapper; `DO $$ ... END $$` pre/post-flight log blocks; `RAISE NOTICE` lines; `IF EXISTS (SELECT 1 FROM information_schema.tables...)` conditional for `student_unit_progress`; `COMMENT ON TABLE` metadata; `CREATE OR REPLACE FUNCTION` + `SECURITY DEFINER` + `GRANT EXECUTE` + `COMMENT ON FUNCTION` block; deploy-ordering header comment from analog 2.
- **Change:** scope DELETE to rhythm-only via `WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'` (analog 2 pattern); replace `is_free_node()` body to drop obsolete `rhythm_1_5` + `rhythm_1_2` references and re-add the 6 new free IDs `rhythm_1_1..5` + `boss_rhythm_1`; update header comment to "Phase 1 (v3.5): Rhythm trail pedagogical restructure — wipes rhythm progress + re-syncs `is_free_node()` whitelist. MUST run before Netlify code deploy. `students_score.total_xp` NEVER touched."; ASSUMED: optionally `DELETE FROM student_daily_goals WHERE ...` if schema supports a `node_id` reference (planner should verify column exists before committing).

---

### 8. Service worker cache bump (`public/sw.js`)

**Analog:** `public/sw.js` line 6

**Current line:**

```javascript
const CACHE_NAME = "pianomaster-v11";
```

**Delta from analog:**

- **Change:** bump to `"pianomaster-v12"` (research said v7→v8 because CLAUDE.md is stale — actual current is **v11**, so bump to v12). No other SW changes needed.

---

### 9. Tests — per-unit + parity + pagination

#### 9a. Per-unit tests (`src/data/units/rhythmUnit{1..10}.test.js`)

**Analog:** `src/data/units/rhythmUnit8Redesigned.test.js` (lines 1–167)

**Imports + describe block** (lines 1–12):

```javascript
import { describe, it, expect } from "vitest";
import { rhythmUnit8Nodes } from "./rhythmUnit8Redesigned.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

describe("Rhythm Unit 8 — Syncopation (v2, 7-node monomodal)", () => {
  it("exports exactly 7 nodes", () => {
    expect(rhythmUnit8Nodes).toHaveLength(7);
  });
  // ...
});
```

**ID assertion pattern** (lines 22–33):

```javascript
it("node IDs match the locked design", () => {
  const expectedIds = [
    "rhythm_8_1",
    "rhythm_8_2",
    "rhythm_8_3",
    "rhythm_8_4",
    "rhythm_8_5",
    "rhythm_8_6",
    "boss_rhythm_8",
  ];
  expect(rhythmUnit8Nodes.map((n) => n.id)).toEqual(expectedIds);
});
```

**Prereq-chain assertion** (lines 41–48):

```javascript
it("prerequisite chain walks boss_rhythm_7 → rhythm_8_1 → ... → boss_rhythm_8", () => {
  expect(rhythmUnit8Nodes[0].prerequisites).toEqual(["boss_rhythm_7"]);
  for (let i = 1; i < rhythmUnit8Nodes.length; i++) {
    expect(rhythmUnit8Nodes[i].prerequisites).toEqual([
      rhythmUnit8Nodes[i - 1].id,
    ]);
  }
});
```

**Time-signature + pitch invariants** (lines 50–60):

```javascript
it("all 7 nodes use timeSignature 4/4", () => {
  rhythmUnit8Nodes.forEach((node) => {
    expect(node.rhythmConfig.timeSignature).toBe("4/4");
  });
});
```

**Delta from analog:**

- **Preserve:** describe-block shape; `vitest` imports; `toHaveLength`/`toEqual`/`toMatch` assertions; per-unit invariant tests (timeSignature, pitch, category-vs-boss); XP arc verification; prerequisite chain walk.
- **Change:** per-unit expected ID list (6 IDs per content unit + 1 boss = 7 per file for U1–U9; 1 boss for U10). Update `timeSignature` invariant to `"3/4"` for U8 file, `"6/8"` for U9 file (or `not.toBe("4/4")` since meter unit changes ts). Update XP arc per spec.

#### 9b. Rename existing Unit 8 test

**Analog:** `src/data/units/rhythmUnit8Redesigned.test.js` (entire file, in-place rename)

**Delta from analog:**

- **Preserve:** file path; describe/it structure; assertion shapes.
- **Change:** every `"rhythm_8_N"` → `"rhythm_synco_N"`, `"boss_rhythm_8"` → `"boss_rhythm_synco"`. Update describe label from "Rhythm Unit 8" to "Rhythm Unit Syncopation (hidden)". `rhythmUnits.difficulty.test.js` line 9 import stays (symbol-based not ID-based, per RESEARCH).

#### 9c. NEW locale parity test

**Analog:** none in repo (search returned 0 matches for `**/__tests__/**parity**` and `**/__tests__/**locale**`).

**Template (no existing analog — author from scratch per RESEARCH §"Locale-Key Pattern"):**

```javascript
// src/locales/__tests__/scaffolding-card-parity.test.js
import { describe, it, expect } from "vitest";
import enCommon from "../en/common.json";
import heCommon from "../he/common.json";

function collectPaths(obj, prefix = "") {
  const paths = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") {
      for (const p of collectPaths(v, key)) paths.add(p);
    } else paths.add(key);
  }
  return paths;
}

describe("Scaffolding card EN ↔ HE locale parity", () => {
  it("every EN scaffolding card key has a HE counterpart", () => {
    const enPaths = collectPaths(enCommon.game?.discovery?.cards || {});
    const hePaths = collectPaths(heCommon.game?.discovery?.cards || {});
    const missing = [...enPaths].filter((p) => !hePaths.has(p));
    expect(missing).toEqual([]);
  });
});
```

**Delta:** NEW file — no existing analog. Use Vitest defaults consistent with other tests in the repo.

#### 9d. NEW FREE_NODE_IDS parity test

**Analog:** none in repo (no existing SQL-mirror test).

**Template (author from scratch per RESEARCH §"Paywall Sync"):**

```javascript
// src/config/__tests__/freeNodes.parity.test.js
import { describe, it, expect } from "vitest";
import { FREE_RHYTHM_NODE_IDS, FREE_NODE_IDS } from "../subscriptionConfig.js";

describe("FREE_NODE_IDS ↔ Postgres is_free_node() parity (documented array)", () => {
  // Mirror of supabase/migrations/2026MMDD000001_phase1_rhythm_pedagogy.sql is_free_node() body
  const EXPECTED_RHYTHM_FREE = [
    "rhythm_1_1",
    "rhythm_1_2",
    "rhythm_1_3",
    "rhythm_1_4",
    "rhythm_1_5",
    "boss_rhythm_1",
  ];
  it("FREE_RHYTHM_NODE_IDS + boss_rhythm_1 matches the SQL whitelist", () => {
    const jsSet = new Set([...FREE_RHYTHM_NODE_IDS, "boss_rhythm_1"]);
    for (const id of EXPECTED_RHYTHM_FREE) expect(jsSet.has(id)).toBe(true);
    expect(jsSet.size).toBe(EXPECTED_RHYTHM_FREE.length);
  });
});
```

**Delta:** NEW file — no existing analog. Hand-mirror SQL whitelist as a JS constant.

#### 9e. Extend DiscoveryIntroQuestion test

**Analog:** `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx` (existing — extend with pagination cases).

**Delta:** add cases — (1) renders single card when `cards` prop omitted, (2) renders N cards when `cards: [{kind: "meet"}, {kind: "sound"}, {kind: "music"}, {kind: "ready"}]`, (3) Next click advances `cardIndex`, (4) `onComplete(1,1)` called only after last card, (5) EN + HE title overrides resolve when `focusDuration` matches a `cards.<concept>` key.

---

### 10. VictoryScreen / navigation contract (no change required — verify only)

**Analog:** `src/components/games/rhythm-games/MixedLessonGame.jsx` (lines 90–98, 469)

**Navigation contract** (lines 90–94):

```javascript
const nodeConfig = location.state?.nodeConfig || null;
const nodeId = location.state?.nodeId || null;
const trailExerciseIndex = location.state?.exerciseIndex ?? null;
const trailTotalExercises = location.state?.totalExercises ?? null;
const trailExerciseType = location.state?.exerciseType ?? null;
```

**Trail-return after victory** (line 469):

```javascript
navigate("/trail");
```

**Delta from analog:**

- **Preserve everything** — multi-card pagination is INSIDE the `discovery_intro` question (one question = many cards). Outer `location.state` contract is untouched. `currentIndex` at MixedLessonGame level advances per question, not per card. No `TrailMap.jsx` / `TrailNode.jsx` / `TrailNodeModal.jsx` / `VictoryScreen.jsx` / `UnitProgressCard.jsx` changes needed (verified in RESEARCH §"Auto-Start / Navigation").
- **One subtle requirement:** pagination state inside `DiscoveryIntroQuestion` must reset on question prop change. Use `useEffect` keyed on `focusDuration` / `focusPattern?.id` (see Section 2 above).

---

## Shared Patterns

### Glassmorphism design system

**Source:** `DiscoveryIntroQuestion.jsx` lines 243–245 (verified consistent with CLAUDE.md §"Design System")
**Apply to:** all new card render branches (`meet`/`sound`/`music`/`ready`)

```javascript
"flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-white/20 bg-white/10 px-8 py-10 shadow-lg backdrop-blur-md md:max-w-md lg:max-w-lg";
```

### Hebrew RTL parity (Kodaly nikud constraint)

**Source:** `src/components/games/rhythm-games/utils/durationInfo.js::getSyllable(code, lang)`
**Apply to:** every scaffolding card that displays a Kodaly syllable
**Rule (from MEMORY.md `feedback_hebrew_nikud`):** Reuse `getSyllable(focusDuration, 'he')` — do NOT author new diacritics inline.

### Audio playback (iOS-safe prewarm)

**Source:** `DiscoveryIntroQuestion.jsx` lines 84–86, 103–127
**Apply to:** every scaffolding "sound" card

```javascript
const audioEngine = useAudioEngine(patternTempo, {
  sharedAudioContext: audioContextRef.current,
});
// ... await audioEngine.initializeAudioContext(); await audioEngine.resumeAudioContext();
// ... if (ctx.state !== "running") await ctx.resume();
```

### Landscape declaration

**Source:** `DiscoveryIntroQuestion.jsx` line 40
**Apply to:** scaffolding renderer (preserve)

```javascript
useDeclareNeedsLandscape(false); // single intro card always fits portrait
```

### `<Trans>` with accent slot (i18n with inline styling)

**Source:** `DiscoveryIntroQuestion.jsx` lines 274–287
**Apply to:** scaffolding card titles

```jsx
<Trans
  t={t}
  i18nKey={titleOverrideKey}
  components={{ accent: <span className="text-indigo-300" /> }}
/>
```

### Validator rule shape

**Source:** `scripts/validateTrail.mjs::validateGameTypePolicy()` lines 571–602
**Apply to:** all 4 new validator rules — function-per-rule + `errorCount` + `hasErrors = true` + two-space-indented `console.error` + main-block invocation.

### Migration deploy-ordering header

**Source:** `supabase/migrations/20260330000001_reset_rhythm_node_progress.sql` lines 1–5
**Apply to:** this phase's migration

```sql
-- Phase 1 (v3.5): Rhythm trail pedagogical restructure
-- DEPLOY CONSTRAINT: MUST run before updated rhythm unit files deploy to production.
-- students_score.total_xp is NEVER touched.
```

---

## No Analog Found

| File                                                    | Role | Data Flow | Reason                                                                                                   |
| ------------------------------------------------------- | ---- | --------- | -------------------------------------------------------------------------------------------------------- |
| `src/locales/__tests__/scaffolding-card-parity.test.js` | test | unit      | No existing locale parity test (verified via Glob — 0 matches). Author from scratch per template above.  |
| `src/config/__tests__/freeNodes.parity.test.js`         | test | unit      | No existing JS↔SQL mirror test (verified via Glob — 0 matches). Author from scratch per template above. |

Both have **template scaffolds** in §9c and §9d using Vitest defaults consistent with the rest of the repo. Planner should treat these as NEW but well-specified.

---

## Metadata

**Analog search scope:**

- `src/data/units/` (all rhythm unit files + their tests)
- `src/data/expandedNodes.js`, `src/data/skillTrail.js`
- `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx`
- `src/components/games/rhythm-games/MixedLessonGame.jsx`
- `scripts/validateTrail.mjs` (read in full)
- `src/config/subscriptionConfig.js`
- `supabase/migrations/*.sql` (the 3 most directly relevant: v13 reset, rhythm reset, ear training free nodes)
- `public/sw.js`
- `src/locales/{en,he}/{common,trail}.json` (key blocks only — `game.discovery.*`)

**Files scanned:** 24 (12 source, 6 SQL/config, 6 tests/locales)
**Pattern extraction date:** 2026-06-01
**Codebase verification:** every excerpt cited has a verified line range; no patterns invented.

---

## PATTERN MAPPING COMPLETE

- **Primary data analog:** `src/data/units/rhythmUnit1Redesigned.js` is the canonical shape for every new content unit (U1–U9). One file, one analog, copied 9 times with delta. Boss-only U10 borrows the boss-node section pattern from `rhythmUnit8Redesigned.js` (lines 461–520) since boss_rhythm_8 uses `nodeType: BOSS` with `measureCount: 4` and `patternTagMode: "any"` — the exact shape U10 needs.
- **Primary UI analog:** `DiscoveryIntroQuestion.jsx` extends itself in place. The `focusPattern` branch (lines 76–80, 306–320) is the precedent for "the renderer already supports more than single-duration content" — multi-card pagination slots in as a third mode alongside single-duration and single-pattern, with the same `onComplete(1,1)` exit contract.
- **Primary validator analog:** `scripts/validateTrail.mjs::validateGameTypePolicy()` (lines 571–602) is the precedent for all 4 new lint rules — function-per-rule + `errorCount` accumulator + standardized error format. New rules slot in between lines 689 and 690.
- **Primary migration analog:** Compose three existing migrations — `20260204000001` (BEGIN/COMMIT + DO-block logging + COMMENT ON TABLE), `20260330000001` (rhythm-scoped WHERE clause + deploy-ordering header), `20260329000001` (CREATE OR REPLACE FUNCTION + GRANT EXECUTE + COMMENT ON FUNCTION) — into a single atomic Phase 1 migration.
