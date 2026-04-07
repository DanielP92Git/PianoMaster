# Phase 23: UX Polish - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the rhythm trail child-friendly and appropriately calibrated: widen timing forgiveness for learning nodes, replace harsh "MISS" feedback with encouraging "Almost!" text, enforce progressive measure lengths per node type, rename MetronomeTrainer to a child-friendly name, and add Kodaly rhythm syllables below VexFlow note heads with an enforced/toggle model.

</domain>

<decisions>
## Implementation Decisions

### Timing forgiveness model (UX-01)

- **D-01:** Two-tier threshold system — "easy" nodes (Discovery, Practice, MIX_UP, REVIEW) get PERFECT=100ms base; "hard" nodes (CHALLENGE, SPEED_ROUND, MINI_BOSS, BOSS) keep current PERFECT=50ms base
- **D-02:** Threshold logic lives in the shared `rhythmTimingUtils.js` — add a `nodeType` parameter to `calculateTimingThresholds()`. MetronomeTrainer's local duplicate (`BASE_TIMING_THRESHOLDS` at line 37) gets removed (dedup)
- **D-03:** Tempo-scaling is preserved on top of the new base — at 65 BPM a Discovery node would get ~140ms PERFECT window (100ms \* tempo scaling factor). Very forgiving for 8-year-olds on early content

### Game rename (UX-02)

- **D-04:** MetronomeTrainer's user-facing name becomes "Listen & Tap" (EN) / "חזור אחריי" (HE)
- **D-05:** Internal component filename `MetronomeTrainer.jsx` stays unchanged — only i18n labels and page titles change
- **D-06:** The string "MetronomeTrainer" must not appear in any visible UI label after this phase

### Feedback text (UX-03)

- **D-07:** "MISS" feedback text replaced with "Almost!" (EN) / Hebrew equivalent with Nikud (HE) in all rhythm games
- **D-08:** Affected i18n keys: `games.metronomeTrainer.tapArea.accuracy.miss` and `games.rhythmReading.tapArea.accuracy.miss` (and any other miss-related keys across rhythm game components)
- **D-09:** Internal code constants (`"MISS"` as enum values in scoring logic) remain unchanged — only user-visible text changes

### Progressive measure length (UX-04)

- **D-10:** Node-type-to-measure-count mapping: Discovery=1-bar, Practice=2-bar, MIX_UP=1-bar, REVIEW=2-bar, CHALLENGE=2-bar, SPEED_ROUND=4-bar, MINI_BOSS=4-bar, BOSS=4-bar
- **D-11:** Enforced in data layer — each node's exercise config `measureCount` field is updated to match the policy. Game components read the config value directly.
- **D-12:** Build validator (`validateTrail.mjs`) enforces the nodeType-to-measureCount mapping — prevents future drift

### Kodaly syllable rendering (UX-05)

- **D-13:** Syllable toggle button added to ALL rhythm games that render notation (RhythmReadingGame, RhythmDictationGame, and any future notation-showing game). Toggle button sits in the settings bar above the staff.
- **D-14:** Syllables are **enforced** (always-on, toggle hidden) on Discovery nodes — these introduce new durations and kids must learn the syllable association from the start
- **D-15:** All other node types show the toggle button, defaulting to the user's persisted preference
- **D-16:** Toggle state persists in localStorage across sessions
- **D-17:** Rendering uses VexFlow's annotation API (TextNote annotations) attached below each note head — stays aligned automatically
- **D-18:** Duration-to-syllable mapping (EN): quarter=ta, eighth pair=ti-ti, half=ta-a, whole=ta-a-a-a. Hebrew equivalents with Nikud: quarter=טָה, eighth pair=טִי-טִי, half=טָה-אָה, whole=טָה-אָה-אָה-אָה (user to confirm exact Nikud)
- **D-19:** Rests show syllable: 'sh' (EN) / 'הס' with Nikud (HE) — user to provide exact Nikud version
- **D-20:** Syllable font/size: Claude's discretion, should be readable but not dominate the notation

### Claude's Discretion

- Exact animation/styling of the syllable toggle button
- Font size and positioning offset for syllable annotations in VexFlow
- Order of implementation across the 5 requirements
- Test structure and coverage approach
- How games that don't render VexFlow notation (MetronomeTrainer pulse mode, ArcadeRhythmGame falling tiles) handle the toggle — likely hidden/disabled since there are no note heads to annotate

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rhythm timing and scoring

- `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` — Shared timing thresholds (the file to modify for UX-01)
- `src/components/games/rhythm-games/utils/rhythmScoringUtils.js` — Scoring logic that calls calculateTimingThresholds
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` lines 37-64 — Local threshold duplicate to remove

### Rhythm game components

- `src/components/games/rhythm-games/RhythmReadingGame.jsx` — Notation-showing game (Kodaly syllables target)
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` — Notation-showing game (Kodaly syllables target)
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — Has "MISS" feedback text to replace
- `src/components/games/rhythm-games/components/FloatingFeedback.jsx` — Renders PERFECT/GOOD/MISS text
- `src/components/games/rhythm-games/components/TapArea.jsx` — Has miss i18n key
- `src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx` — VexFlow rendering (Kodaly annotation target)

### i18n

- `src/locales/en/common.json` — English translations (miss keys at lines ~762, ~781)
- `src/locales/he/common.json` — Hebrew translations (miss keys at lines ~762, ~781)

### Trail data and validation

- `src/data/units/` — All rhythm unit files (measureCount updates for UX-04)
- `src/data/constants.js` — NODE_CATEGORIES and EXERCISE_TYPES
- `scripts/validateTrail.mjs` — Build validator (add nodeType-to-measureCount enforcement)

### Pattern library

- `src/data/patterns/rhythmPatterns.js` — Curated patterns with measureCount field
- `src/data/PEDAGOGY.md` — Kodaly syllable reference

### Prior phase context

- `.planning/phases/20-curriculum-audit/20-CONTEXT.md` — Game-type policy (D-04 through D-11)
- `.planning/phases/21-pattern-library-construction/21-CONTEXT.md` — Pattern structure with measureCount
- `.planning/phases/22-service-layer-trail-wiring/22-CONTEXT.md` — Pattern resolution API

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `rhythmTimingUtils.js`: Shared `calculateTimingThresholds(tempo)` — extend with nodeType parameter
- `FloatingFeedback.jsx`: Already uses i18n for PERFECT/GOOD/MISS labels — just change the i18n values
- `TapArea.jsx`: Also uses i18n for accuracy labels
- `RhythmStaffDisplay.jsx`: VexFlow rendering component — extend with syllable annotations
- `RhythmPatternGenerator.js` `resolveByTags()`: Already supports `measureCount` filter

### Established Patterns

- Timing thresholds: Duplicated in MetronomeTrainer (local) and rhythmTimingUtils (shared) — Phase 23 deduplicates by removing the local copy
- i18n pattern: All user-facing text uses `t()` from `useTranslation` — consistent replacement path
- VexFlow rendering: `RhythmStaffDisplay.jsx` already creates Stave + StaveNote objects — syllable annotations attach to existing notes
- localStorage: Used throughout the app for UI preferences (theme, language, onboarding state)

### Integration Points

- `calculateTimingThresholds()` is called by `rhythmScoringUtils.js` and `MetronomeTrainer.jsx` — both need the nodeType parameter passed through
- Node exercise configs in `src/data/units/` define `measureCount` — bulk update needed for all 48 rhythm nodes
- `validateTrail.mjs` already validates node configs — add measureCount policy check

</code_context>

<specifics>
## Specific Ideas

- User specified exact game name: "Listen & Tap" (EN) / "חזור אחריי" (HE) — not negotiable
- User wants Kodaly syllables with full Hebrew Nikud (diacritics) — exact Nikud strings to be confirmed by user before implementation
- Rest syllable: 'sh' (EN) / 'הס' with Nikud (HE) — user will provide the Nikud version
- Syllables enforced on Discovery nodes specifically because that's where new duration concepts are introduced — pedagogical decision, not just UX

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 23-ux-polish_
_Context gathered: 2026-04-07_
