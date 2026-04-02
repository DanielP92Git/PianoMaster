# Phase 13: Code Quality Quick Wins - Research

**Researched:** 2026-03-31
**Domain:** Code deduplication, dead code removal, React lazy loading, i18n string updates
**Confidence:** HIGH (all findings verified by direct source code inspection)

## Summary

This phase consists of seven discrete cleanup tasks across two planned plans. All tasks are independent and low-risk. The primary complexity is in QUAL-01 (noteNameToMidi consolidation) where the two existing implementations differ in flat-note handling, meaning the canonical implementation must use the more capable VexFlowStaffDisplay version. All other tasks are straightforward: export an existing function, delete a local copy and add an import, delete files, swap one eager import for a lazy import, and change locale string values.

QUAL-03 (verifyStudentDataAccess dedup) has no circular dependency — apiDatabase.js does not import from authorizationUtils.js, confirming the simple strategy: delete the local copy and add one import line. The two implementations differ in return value (local returns `true`, canonical returns `{userId, isOwner, isTeacher}`), but all 6 callers in apiDatabase.js use `await verifyStudentDataAccess(...)` without capturing the return value, so the richer return value from the canonical is safe.

The TeacherDashboard lazy load (QUAL-07) is a one-line change: replace the eager `import` at App.jsx line 29 with `lazyWithRetry(() => import(...))`. A `Suspense` boundary at App.jsx line 309 already wraps all routes including the `/teacher/*` route, so no new Suspense wrapper is needed.

**Primary recommendation:** Execute Plan 13-01 (utility deduplication) before Plan 13-02 (deletions + config), as the utility work requires careful import rewiring. Both plans are fully independent of each other and can execute in any order.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `noteNameToMidi` gets a new canonical home at `src/utils/noteUtils.js`. Both copies (VexFlowStaffDisplay.jsx:45 and KlavierKeyboard.jsx:22) are replaced with imports from the new util.
- **D-02:** `calculateStars` stays in `skillProgressService.js` (currently `_calculateStarsFromPercentage` at line 19). Export it and have `useVictoryState.js` import from there. Stars logic stays with progression.
- **D-03:** Researcher should investigate whether `apiDatabase.js` has a circular dependency with `authorizationUtils.js` before committing to a strategy. If no circular dependency, delete the local copy (line 14) and import from `authorizationUtils.js`. If circular dependency exists, researcher recommends alternative approach.
- **D-04:** Delete `src/pages/AchievementsLegacy.jsx` AND remove the stale rollback comment in `src/pages/Achievements.jsx` (line 2: "To rollback: swap this import to AchievementsLegacy").
- **D-05:** Delete 3 non-migration files from `supabase/migrations/`: `DEBUG_check_teacher_status.sql`, `README_USER_PREFERENCES.md`, `TEST_direct_insert.sql`.
- **D-06:** Just `React.lazy()` the main import in `App.jsx` (line 29). No sub-tab splitting — the whole 2538-line component loads as one lazy chunk. Students never download it. Use existing `src/utils/lazyWithRetry.js` if available.
- **D-07:** JS teacher code already uses `total_xp` — no JS changes needed. Update locale strings in both EN and HE files: change remaining "Total Points" / "total points" references to "Total XP" / "total XP". ~5 occurrences across `en/common.json` and `he/common.json`.
- **D-08:** Split into 2 plans:
  - **Plan 13-01:** Utility deduplication (QUAL-01, QUAL-02, QUAL-03) — import rewiring with careful dependency checks
  - **Plan 13-02:** Dead code removal + lazy load + XP locale (QUAL-04, QUAL-05, QUAL-07, XP-01) — independent deletions and config changes

### Claude's Discretion

- Internal implementation of `noteNameToMidi` in the new util file (whether to use a lookup table or formula)
- Whether `lazyWithRetry.js` is suitable for the TeacherDashboard lazy import or if plain `React.lazy` suffices
- Exact locale key changes (whether to rename keys like `pointsEarnedDescription` or just change values)

### Deferred Ideas (OUT OF SCOPE)

- TeacherDashboard sub-tab splitting (Analytics, Recordings, Assignments into separate files/chunks) — future refactoring milestone
- Locale key renaming (e.g., `pointsEarnedDescription` → `xpEarnedDescription`) — future i18n audit
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                       | Research Support                                                                                                                                                                                                                                                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QUAL-01 | `noteNameToMidi` consolidated to single utility (currently 3 implementations)                     | Two implementations found (VexFlowStaffDisplay:45, KlavierKeyboard:22). Canonical goes in `src/utils/noteUtils.js`. Implementation must use the VexFlowStaffDisplay version as it handles flat notes (`b` accidentals).                                                                                                                      |
| QUAL-02 | `calculateStars` consolidated to single utility (currently 2 implementations)                     | Two implementations confirmed identical (skillProgressService:19 and useVictoryState:66). Export from skillProgressService as named export `calculateStarsFromPercentage`, import in useVictoryState.                                                                                                                                        |
| QUAL-03 | `verifyStudentDataAccess` duplicate in apiDatabase.js removed, imports from authorizationUtils.js | No circular dependency confirmed. Local copy at apiDatabase.js:14 returns `true`, canonical at authorizationUtils.js:19 returns `{userId, isOwner, isTeacher}`. All 6 callers use `await verify...` without capturing return value — safe to swap.                                                                                           |
| QUAL-04 | AchievementsLegacy.jsx deleted (dead code, never imported)                                        | Confirmed: `AchievementsLegacy` only appears in its own file + the comment at Achievements.jsx:2. Zero real imports.                                                                                                                                                                                                                         |
| QUAL-05 | Non-migration files removed from supabase/migrations/ (DEBUG*, TEST*, README\_)                   | Confirmed: `DEBUG_check_teacher_status.sql`, `README_USER_PREFERENCES.md`, `TEST_direct_insert.sql` all exist.                                                                                                                                                                                                                               |
| QUAL-07 | TeacherDashboard converted to React.lazy() (currently eager-loaded for all users)                 | Eager import at App.jsx:29. `lazyWithRetry` utility at `src/utils/lazyWithRetry.js` is the project-standard wrapper. Suspense boundary at App.jsx:309 already wraps the `/teacher/*` route.                                                                                                                                                  |
| XP-01   | TeacherDashboard `total_points` references migrated to XP terminology (~20 occurrences)           | TeacherDashboard JS already uses `total_xp` everywhere (4 occurrences). Changes are locale-only: `en/common.json:188` and `he/common.json:188` (achievements.points), `en/common.json:551,557` and `he/common.json:550,556` (accessories.pointsEarned\* values — dead keys, no JS references). Total: 6 locale string values across 2 files. |

</phase_requirements>

## Standard Stack

This phase uses no new libraries. All patterns are from the existing project stack.

### Core (existing project utilities)

| Library/Utility                        | Purpose                                         | Notes                                          |
| -------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| `src/utils/lazyWithRetry.js`           | React.lazy wrapper with stale-chunk auto-reload | Project-standard for all lazy imports          |
| `src/services/authorizationUtils.js`   | Canonical `verifyStudentDataAccess`             | Already used by 7 other services               |
| `src/services/skillProgressService.js` | Canonical `_calculateStarsFromPercentage`       | Private function, needs `export` keyword added |

### New File

| File                     | Purpose                                 |
| ------------------------ | --------------------------------------- |
| `src/utils/noteUtils.js` | New canonical home for `noteNameToMidi` |

**No npm installs required.** This phase is pure refactoring.

## Architecture Patterns

### Recommended Project Structure (unchanged)

```
src/
├── utils/
│   ├── noteUtils.js         # NEW — canonical noteNameToMidi
│   ├── lazyWithRetry.js     # existing — used for TeacherDashboard lazy
│   └── [other utils]
├── services/
│   ├── skillProgressService.js  # calculateStars exported from here
│   └── authorizationUtils.js    # verifyStudentDataAccess canonical
└── locales/
    ├── en/common.json
    └── he/common.json
```

### Pattern 1: noteUtils.js — Which Implementation to Use

The two existing `noteNameToMidi` implementations are NOT equivalent:

**KlavierKeyboard version (simpler — does NOT support flats):**

```javascript
// Only matches sharps: /^([A-G])(#?)(\d)$/i
// Input "Eb4" → null (no match for 'b' accidental)
```

**VexFlowStaffDisplay version (full — supports both sharps and flats):**

```javascript
// Matches both: /^([A-Ga-g])([#b]?)(\d)$/
// Input "Eb4" → resolves via flatMap to D#4 → correct MIDI
// Also handles lowercase note names (a-g)
```

**Use the VexFlowStaffDisplay implementation** as the canonical. It is a strict superset of the KlavierKeyboard version — all inputs the KlavierKeyboard version accepts are handled identically.

The new file should export the function and its dependency:

```javascript
// src/utils/noteUtils.js

const NOTE_TO_SEMITONE = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

/**
 * Convert a note name (e.g. "C4", "Eb4", "F#3") to MIDI number.
 * Handles sharps and flats, case-insensitive note letter.
 * @param {string} pitch
 * @returns {number|null}
 */
export const noteNameToMidi = (pitch) => {
  if (!pitch) return null;
  const match = pitch.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;
  // ... (VexFlowStaffDisplay implementation body)
};
```

**Call sites after migration:**

- `VexFlowStaffDisplay.jsx`: Remove local `NOTE_TO_SEMITONE` const + local `noteNameToMidi` function. Add `import { noteNameToMidi } from '../../../../utils/noteUtils'`. Keep `STEM_REFERENCE_MIDI` (uses `noteNameToMidi` at module level — ensure import is hoisted above it).
- `KlavierKeyboard.jsx`: Remove local `NOTE_NAMES` array + local `noteNameToMidi` function. Add `import { noteNameToMidi } from '../../../../utils/noteUtils'`. The `midiToNoteName` function in KlavierKeyboard uses its own `NOTE_NAMES` — keep that local array (it serves `midiToNoteName`, not `noteNameToMidi`).

### Pattern 2: calculateStars Export

```javascript
// In skillProgressService.js — change private to exported:
// Before: const _calculateStarsFromPercentage = (percentage) => {
// After:  export const calculateStarsFromPercentage = (percentage) => {
```

```javascript
// In useVictoryState.js — replace local function with import:
// Remove lines 61-71 (the local calculateStars function)
// Add to imports:
import { calculateStarsFromPercentage } from "../services/skillProgressService";
// Replace all 2 call sites: calculateStars(...) → calculateStarsFromPercentage(...)
```

**Note on naming:** The canonical is named `_calculateStarsFromPercentage` (private). Exporting it as `calculateStarsFromPercentage` (removing underscore prefix) follows JS convention. The local in useVictoryState.js is named `calculateStars` — the call sites must be updated to use the new name.

### Pattern 3: verifyStudentDataAccess Migration

No circular dependency exists. `apiDatabase.js` imports only `supabase`. `authorizationUtils.js` imports only `supabase`. Adding an import from `authorizationUtils.js` into `apiDatabase.js` is safe.

```javascript
// apiDatabase.js — Add one import, remove the local copy:
import supabase from "./supabase";
import { verifyStudentDataAccess } from "./authorizationUtils"; // ADD

// Delete lines 3-39 (the local verifyStudentDataAccess function + its comment block)
```

**Return value compatibility:** The local version returns `true` on success; the canonical returns `{ userId, isOwner, isTeacher }`. All 6 callers use the pattern `await verifyStudentDataAccess(studentId)` without capturing the return value — they only care about whether it throws. The richer return value is ignored, making this a safe drop-in replacement.

**The 6 internal callers in apiDatabase.js:**

- Line 57: `getStudentById`
- Line 180: (unnamed — needs verification of exact function)
- Line 388, 407, 420: (needs verification)
- Line 642: (needs verification)

### Pattern 4: TeacherDashboard Lazy Load

```javascript
// App.jsx — Change line 29:
// Before:
import TeacherDashboard from "./components/layout/TeacherDashboard";
// After:
const TeacherDashboard = lazyWithRetry(
  () => import("./components/layout/TeacherDashboard")
);
```

`lazyWithRetry` is already imported at line 43 and is the project-standard pattern for all other lazy-loaded pages and game components. The `Suspense` fallback is already present at line 309 wrapping all routes. No prefetch needed (teacher routes are teacher-only, not worth eager-prefetching for all users).

**Why `lazyWithRetry` over plain `React.lazy`:** The project already uses `lazyWithRetry` everywhere. It adds stale-chunk auto-reload behavior after Netlify deploys. Use it for consistency.

### Pattern 5: XP Locale Updates

CONTEXT.md D-07 says "~5 occurrences". Actual verification found:

**en/common.json — strings to change:**
| Line | Key | Current Value | New Value |
|------|-----|--------------|-----------|
| 188 | `pages.achievements.achievements.points` | `"Total Points"` | `"Total XP"` |
| 190 | `pages.achievements.achievements.pointsBreakdown` | `"{{gameplay}} game + {{achievements}} badge points"` | `"{{gameplay}} game + {{achievements}} badge XP"` |
| 551 | `avatars.unlockModal.pointsEarnedDescription` | `"Earn {{amount}} total points (lifetime)"` | `"Earn {{amount}} total XP (lifetime)"` |
| 557 | `avatars.unlockModal.pointsEarnedCompleted` | `"You've earned {{amount}} total points! ✨"` | `"You've earned {{amount}} total XP! ✨"` |

**Note:** `pointsEarnedDescription` and `pointsEarnedCompleted` locale keys have NO JS references (confirmed by grep). They are dead locale strings. However, since D-07 says to update "Total Points / total points" → "Total XP / total XP" in locale files, and the CONTEXT says NOT to rename keys (deferred), update the string values only.

**he/common.json — strings to change:**
| Line | Key | Current Hebrew Value | New Value |
|------|-----|---------------------|-----------|
| 188 | `pages.achievements.achievements.points` | `"סך כל הנקודות"` | `"סך כל ה-XP"` |
| 550 | `avatars.unlockModal.pointsEarnedDescription` | Hebrew "total points" | Hebrew "total XP" |
| 556 | `avatars.unlockModal.pointsEarnedCompleted` | Hebrew "total points" | Hebrew "total XP" |

**Key insight:** `en/common.json:927` (`teacherStats.totalPoints: "Total XP"`) is already correct. `he/common.json:927` (`"סה\"כ XP"`) is already correct. Only the achievements namespace and the dead accessory keys need updating.

### Anti-Patterns to Avoid

- **Do not use `NOTE_NAMES.findIndex()`** in the canonical noteUtils.js — use the `NOTE_TO_SEMITONE` lookup table (VexFlowStaffDisplay pattern). It is faster and handles flats.
- **Do not rename locale keys** — CONTEXT.md explicitly defers key renaming to future i18n audit. Only change string values.
- **Do not add a Suspense boundary** around TeacherDashboard — one already exists at the AppRoutes level (App.jsx:309).
- **Do not prefetch TeacherDashboard** — unlike TrailMapPage, teacher routes are role-gated and not worth prefetching for student users.

## Don't Hand-Roll

| Problem                                | Don't Build              | Use Instead                                          | Why                                                |
| -------------------------------------- | ------------------------ | ---------------------------------------------------- | -------------------------------------------------- |
| Lazy loading with stale-chunk recovery | Custom wrapper           | `lazyWithRetry` (src/utils/lazyWithRetry.js)         | Already exists, handles Netlify 404 on old chunks  |
| Authorization verification             | Copy-paste               | `verifyStudentDataAccess` from authorizationUtils.js | Canonical, used by 7+ services                     |
| MIDI conversion with flat support      | Partial reimplementation | VexFlowStaffDisplay version in noteUtils.js          | Handles all accidentals including enharmonic flats |

## Common Pitfalls

### Pitfall 1: Using the Wrong noteNameToMidi Implementation

**What goes wrong:** The KlavierKeyboard version does not handle flat notes (`b` accidental). Using it as the canonical would silently return `null` for inputs like `"Eb4"`, `"Bb3"`.
**Why it happens:** Both versions look similar at a glance. The KlavierKeyboard version regex is `/^([A-G])(#?)(\d)$/` — the `(#?)` only matches optional sharp, never flat.
**How to avoid:** Use the VexFlowStaffDisplay version. Its regex is `/^([A-Ga-g])([#b]?)(\d)$/` and it has a `flatMap` for enharmonic resolution.
**Warning signs:** If `noteNameToMidi("Eb4")` returns `null` in tests, you used the wrong version.

### Pitfall 2: noteNameToMidi is Used at Module Level in VexFlowStaffDisplay

**What goes wrong:** `STEM_REFERENCE_MIDI` at VexFlowStaffDisplay.jsx:76-79 calls `noteNameToMidi("B4")` and `noteNameToMidi("D3")` at module initialization time. If the import is missing or hoisted incorrectly, this will throw on module load.
**Why it happens:** ES module imports are hoisted, so `noteNameToMidi` from `import` is available before any code runs. Named import from noteUtils.js will behave correctly.
**How to avoid:** Ensure the import line is added before the file is modified. After replacing, `STEM_REFERENCE_MIDI` calls the imported function — no code change needed to that const.

### Pitfall 3: calculateStars Rename Breaking Call Sites

**What goes wrong:** The local in `useVictoryState.js` is `calculateStars`. The canonical being exported is `_calculateStarsFromPercentage` (renamed to `calculateStarsFromPercentage`). Forgetting to update both call sites in useVictoryState.js (lines 205, 335) leaves the old name causing a ReferenceError.
**Why it happens:** The function is called in two separate `useEffect`/`useMemo` closures in a 600+ line file.
**How to avoid:** Grep for `calculateStars(` in `useVictoryState.js` — must find 0 results after migration.

### Pitfall 4: verifyStudentDataAccess Return Value Assumption

**What goes wrong:** Future code in apiDatabase.js reads the return value of `verifyStudentDataAccess(studentId)` expecting `true`. After migration, it returns `{userId, isOwner, isTeacher}`, which is also truthy, but destructuring `const { isOwner } = await verify...` on the old `return true` would break.
**Why it happens:** The two implementations have different return types.
**How to avoid:** The current 6 callers all ignore the return value. Only concern is new code added after migration — use the canonical's return type.

### Pitfall 5: LazyWithRetry Session Storage Key Collision

**What goes wrong:** The `lazyWithRetry` wrapper uses a single session storage key `"chunk-reload"`. If multiple lazy imports fail simultaneously, only the first reload is attempted. This is existing behavior — not new to TeacherDashboard.
**How to avoid:** No action required. Existing behavior is acceptable and consistent with all other lazy-loaded pages.

## Code Examples

Verified patterns from direct source inspection:

### noteUtils.js — Full Implementation (from VexFlowStaffDisplay.jsx)

```javascript
// src/utils/noteUtils.js
// Source: VexFlowStaffDisplay.jsx:30-74

const NOTE_TO_SEMITONE = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

/**
 * Convert a note name to MIDI number.
 * Supports sharps (#), flats (b), and case-insensitive note letters.
 * @param {string} pitch - e.g. "C4", "Eb4", "F#3", "c4"
 * @returns {number|null} MIDI number or null if invalid
 */
export const noteNameToMidi = (pitch) => {
  if (!pitch) return null;
  const match = pitch.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;

  const [, letter, accidental, octaveStr] = match;
  const baseLetter = letter.toUpperCase();
  const noteKey =
    accidental === "b"
      ? (() => {
          const flatMap = {
            CB: "B",
            DB: "C#",
            EB: "D#",
            FB: "E",
            GB: "F#",
            AB: "G#",
            BB: "A#",
          };
          return flatMap[`${baseLetter}B`] || baseLetter;
        })()
      : `${baseLetter}${accidental === "#" ? "#" : ""}`;
  const semitone = NOTE_TO_SEMITONE[noteKey];
  if (semitone === undefined) return null;

  const octave = parseInt(octaveStr, 10);
  if (Number.isNaN(octave)) return null;

  return (octave + 1) * 12 + semitone;
};
```

### TeacherDashboard Lazy Import (pattern from App.jsx)

```javascript
// App.jsx line 29 — before:
import TeacherDashboard from "./components/layout/TeacherDashboard";

// App.jsx line 29 — after (matches existing pattern at lines 50-65):
const TeacherDashboard = lazyWithRetry(
  () => import("./components/layout/TeacherDashboard")
);
```

### skillProgressService.js export addition

```javascript
// Before (line 19):
const _calculateStarsFromPercentage = (percentage) => {

// After:
export const calculateStarsFromPercentage = (percentage) => {
```

### useVictoryState.js import replacement

```javascript
// Add to imports section:
import { calculateStarsFromPercentage } from "../services/skillProgressService";

// Remove lines 61-71 (local calculateStars function).
// Replace both call sites:
// calculateStars(scorePercentage)  →  calculateStarsFromPercentage(scorePercentage)
```

## State of the Art

No state-of-the-art changes relevant to this phase. All patterns (React.lazy, named exports, i18n value updates) are stable and well-established.

## Open Questions

1. **KlavierKeyboard `NOTE_NAMES` array after migration**
   - What we know: `NOTE_NAMES` in KlavierKeyboard.jsx is used by both `noteNameToMidi` (being removed) and `midiToNoteName` (staying local).
   - What's unclear: After removing `noteNameToMidi`, does `NOTE_NAMES` become an orphan? Verify `midiToNoteName` at line 34 still references it.
   - Recommendation: Keep `NOTE_NAMES` in KlavierKeyboard.jsx — `midiToNoteName` uses it. Do not extract `midiToNoteName` to noteUtils.js (out of scope, D-01 only covers `noteNameToMidi`).

2. **Exact line numbers for apiDatabase.js callers at lines 388, 407, 420, 642**
   - What we know: Grep confirmed 6 callers. Lines 57 and 180 correspond to `getStudentById` and another function.
   - What's unclear: Function names at lines 388-642.
   - Recommendation: Planner should instruct implementer to verify with Read tool before modifying. The strategy is still the same regardless.

3. **pointsBreakdown locale key (en/common.json:190)**
   - What we know: `"pointsBreakdown": "{{gameplay}} game + {{achievements}} badge points"` — uses "badge points" which contains "points"
   - What's unclear: Is `pointsBreakdown` a live key referenced in JS (AchievementsRedesign.jsx) or a dead key only referenced from the deleted AchievementsLegacy.jsx?
   - Recommendation: Grep for `pointsBreakdown` in JS files. If only referenced in AchievementsLegacy.jsx (which is being deleted in QUAL-04), the value change is irrelevant. If live, update "badge points" → "badge XP".

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code/config changes with no external dependencies beyond the existing project.

## Validation Architecture

### Test Framework

| Property           | Value                                        |
| ------------------ | -------------------------------------------- |
| Framework          | Vitest 3.2.4                                 |
| Config file        | vite.config.js (inferred)                    |
| Quick run command  | `npx vitest run src/utils/noteUtils.test.js` |
| Full suite command | `npm run test:run`                           |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                                 | Test Type | Automated Command                                          | File Exists? |
| ------- | ---------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------- | ------------ |
| QUAL-01 | `noteNameToMidi` in noteUtils.js converts correctly for sharps, flats, edge cases        | unit      | `npx vitest run src/utils/noteUtils.test.js`               | ❌ Wave 0    |
| QUAL-02 | `calculateStarsFromPercentage` exported from skillProgressService, returns correct stars | unit      | `npx vitest run src/services/skillProgressService.test.js` | ❌ Wave 0    |
| QUAL-03 | No test needed — import swap only; covered by integration behavior                       | manual    | `npm run build` (no import errors)                         | —            |
| QUAL-04 | AchievementsLegacy.jsx deleted, Achievements.jsx renders AchievementsRedesign            | smoke     | `npm run build` (no broken imports)                        | —            |
| QUAL-05 | Non-migration files deleted                                                              | manual    | `ls supabase/migrations/`                                  | —            |
| QUAL-07 | TeacherDashboard loads as lazy chunk (not in main bundle)                                | smoke     | `npm run build` (check chunk output)                       | —            |
| XP-01   | Locale files contain no "total points" / "Total Points" in teacher/achievement sections  | manual    | grep locale files                                          | —            |

### Sampling Rate

- **Per task commit:** `npm run build` (validates no broken imports)
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/utils/noteUtils.test.js` — covers QUAL-01: tests sharp notes, flat notes, lowercase input, invalid input, null input
- [ ] `src/services/skillProgressService.test.js` — covers QUAL-02: tests 0%, 59%, 60%, 79%, 80%, 94%, 95%, 100% thresholds

_(AchievementsLegacy, migration file deletions, lazy load, and locale changes do not require new test files — verified by build and grep)_

## Sources

### Primary (HIGH confidence)

- Direct source code inspection: `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` — noteNameToMidi implementation
- Direct source code inspection: `src/components/games/sight-reading-game/components/KlavierKeyboard.jsx` — noteNameToMidi copy
- Direct source code inspection: `src/services/skillProgressService.js` — \_calculateStarsFromPercentage
- Direct source code inspection: `src/hooks/useVictoryState.js` — calculateStars duplicate + call sites
- Direct source code inspection: `src/services/apiDatabase.js` — local verifyStudentDataAccess
- Direct source code inspection: `src/services/authorizationUtils.js` — canonical verifyStudentDataAccess
- Direct source code inspection: `src/App.jsx` — TeacherDashboard import (line 29), lazyWithRetry (line 43), Suspense (line 309)
- Direct source code inspection: `src/utils/lazyWithRetry.js` — implementation
- Direct source code inspection: `src/locales/en/common.json` and `src/locales/he/common.json` — XP/points strings
- Grep results: All call sites for `noteNameToMidi`, `calculateStars`, `verifyStudentDataAccess`, `pointsEarned*`

### Secondary (MEDIUM confidence)

- None required — all findings from direct code inspection.

## Metadata

**Confidence breakdown:**

- QUAL-01 (noteNameToMidi): HIGH — both implementations inspected, call sites counted, canonical implementation identified
- QUAL-02 (calculateStars): HIGH — both implementations identical confirmed, export strategy clear
- QUAL-03 (verifyStudentDataAccess): HIGH — no circular dependency confirmed, return value difference documented, all 6 callers verified to ignore return value
- QUAL-04 (AchievementsLegacy): HIGH — zero imports confirmed, comment location confirmed
- QUAL-05 (migration files): HIGH — all 3 files confirmed present
- QUAL-07 (lazy load): HIGH — existing Suspense boundary confirmed, lazyWithRetry pattern confirmed
- XP-01 (locale): HIGH — exact lines and current values documented, JS non-references confirmed

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable codebase — changes only during active development)
