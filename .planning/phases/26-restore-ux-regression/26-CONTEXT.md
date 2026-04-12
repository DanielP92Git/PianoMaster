# Phase 26: Restore Phase 23 UX Regression - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Re-implement all 5 Phase 23 UX improvements (UX-01 through UX-05) that were reverted by commit `13cff54`, plus fix 3 integration gaps identified by the v3.2 milestone audit: PAT-04 (resolveByTags import), PAT-06 (validateMeasureCountPolicy), and pulse exercise i18n for Hebrew.

This is a gap-closure phase — all design decisions were locked in Phase 23's CONTEXT.md (D-01 through D-20). This phase re-implements those decisions on top of the current codebase (which now includes Phase 24 and Phase 25 changes).

</domain>

<decisions>
## Implementation Decisions

### Restoration approach

- **D-01:** Re-implement from Phase 23 CONTEXT.md decisions (D-01 through D-20) as the spec — do NOT cherry-pick or git-diff extract from old commits
- **D-02:** Plan structure is Claude's discretion — optimize for the current codebase state, not necessarily mirroring Phase 23's 3-plan structure

### Timing forgiveness (UX-01) — from Phase 23 D-01/D-02/D-03

- **D-03:** Two-tier threshold system: "easy" nodes (Discovery, Practice, MIX_UP, REVIEW) get PERFECT=100ms base; "hard" nodes (CHALLENGE, SPEED_ROUND, MINI_BOSS, BOSS) keep PERFECT=50ms
- **D-04:** `EASY_NODE_TYPES` set and `BASE_TIMING_THRESHOLDS_EASY` constants in `rhythmTimingUtils.js`; `scoreTap()` accepts `nodeType` param
- **D-05:** Remove MetronomeTrainer's local threshold duplicate (`BASE_TIMING_THRESHOLDS` at line 37)

### Game rename (UX-02) — from Phase 23 D-04/D-05/D-06

- **D-06:** MetronomeTrainer UI name: "Listen & Tap" (EN) / "חזור אחריי" (HE) in i18n
- **D-07:** Internal component filename `MetronomeTrainer.jsx` stays unchanged
- **D-08:** `useDocumentTitle` default updated to match new name

### Feedback text (UX-03) — from Phase 23 D-07/D-08/D-09

- **D-09:** "MISS" → "Almost!" (EN) / Hebrew equivalent with Nikud (HE) in all rhythm game UI
- **D-10:** Internal code enum values remain "MISS" — only user-visible text changes
- **D-11:** Affected i18n keys: all `accuracy.miss` keys across rhythm game components

### Progressive measure length (UX-04) — from Phase 23 D-10/D-11/D-12

- **D-12:** Node-type-to-measure-count mapping: Discovery=1, Practice=2, MIX_UP=1, REVIEW=2, CHALLENGE=2, SPEED_ROUND=4, MINI_BOSS=4, BOSS=4
- **D-13:** `RhythmStaffDisplay` accepts `measures` prop for multi-stave rendering
- **D-14:** `RhythmReadingGame` passes `trailMeasureCount` to multi-measure fetch path
- **D-15:** `validateMeasureCountPolicy()` restored in `validateTrail.mjs` (also covers PAT-06)

### Kodaly syllable rendering (UX-05) — from Phase 23 D-13 through D-20

- **D-16:** `beatsToVexNotes` accepts `showSyllables` and `language` params with VexFlow Annotation imports
- **D-17:** `RhythmStaffDisplay` accepts syllable props (`showSyllables`, `language`)
- **D-18:** Syllable toggle in RhythmReadingGame and RhythmDictationGame settings bar
- **D-19:** Enforced (always-on, toggle hidden) on Discovery nodes
- **D-20:** Toggle state persists in localStorage
- **D-21:** English syllables: quarter=ta, eighth pair=ti-ti, half=ta-a, whole=ta-a-a-a, rest=sh
- **D-22:** Hebrew syllables with Nikud (user-confirmed, do NOT change): quarter=טָה, eighth pair=טָה-טֶה, half=טָה-אָה, whole=טָה-אָה-אָה-אָה, rest=הָס

### Integration gap: PAT-04

- **D-23:** Restore `resolveByTags` import from `RhythmPatternGenerator` in `RhythmReadingGame.jsx` — trail-mode rhythm reading must use curated patterns, not legacy `getPattern()`

### Integration gap: Pulse i18n

- **D-24:** Add Hebrew i18n key for pulse exercise type: "דופק" (dopek)

### Test strategy

- **D-25:** Write fresh tests based on current code + decisions — do not extract old Phase 23 tests
- **D-26:** Test placement is Claude's discretion (alongside features or separate plan)

### Claude's Discretion

- Plan structure and wave assignment
- Test file placement (co-located or separate plan)
- Exact animation/styling of syllable toggle button
- Font size and positioning offset for syllable annotations in VexFlow
- "Almost!" Hebrew equivalent (standard encouraging feedback translation)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 23 original decisions (source of truth)

- `.planning/phases/23-ux-polish/23-CONTEXT.md` — Original D-01 through D-20 decisions being re-implemented

### Milestone audit (gap identification)

- `.planning/v3.2-MILESTONE-AUDIT.md` — Identifies all gaps, integration issues, and broken E2E flows

### Rhythm timing and scoring

- `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` — Shared timing thresholds (add EASY_NODE_TYPES, BASE_TIMING_THRESHOLDS_EASY)
- `src/components/games/rhythm-games/utils/rhythmScoringUtils.js` — Scoring logic that calls calculateTimingThresholds

### Rhythm game components

- `src/components/games/rhythm-games/RhythmReadingGame.jsx` — Needs resolveByTags import, trailMeasureCount, syllable toggle
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` — Needs syllable toggle
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — Remove local threshold duplicate, rename i18n
- `src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx` — Add measures prop, syllable props
- `src/components/games/rhythm-games/components/FloatingFeedback.jsx` — MISS feedback text
- `src/components/games/rhythm-games/components/TapArea.jsx` — MISS i18n key
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — MISS feedback text

### VexFlow helpers

- `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js` — beatsToVexNotes (add syllable params, Annotation imports, SYLLABLE_MAP)

### i18n

- `src/locales/en/common.json` — English translations (miss keys, Listen & Tap, pulse)
- `src/locales/he/common.json` — Hebrew translations (miss keys, חזור אחריי, pulse דופק)

### Trail data and validation

- `src/data/units/` — Rhythm unit files (measureCount updates)
- `scripts/validateTrail.mjs` — Add validateMeasureCountPolicy()

### Pattern library

- `src/data/patterns/rhythmPatterns.js` — Curated patterns used by resolveByTags
- `src/components/games/rhythm-games/utils/RhythmPatternGenerator.js` — resolveByTags export

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `rhythmTimingUtils.js`: Has `calculateTimingThresholds(tempo)` — extend with nodeType parameter
- `FloatingFeedback.jsx`: Already uses i18n for accuracy labels — change i18n values only
- `RhythmStaffDisplay.jsx`: VexFlow rendering component — extend with measures and syllable props
- `RhythmPatternGenerator.js`: Has `resolveByTags()` export — just needs import restored in RhythmReadingGame
- Phase 24/25 added `VisualRecognitionGame`, `SyllableMatchingGame`, `MixedLessonGame` — these are new and unaffected

### Established Patterns

- i18n: All user-facing text uses `t()` from `useTranslation`
- VexFlow: `RhythmStaffDisplay.jsx` creates Stave + StaveNote objects
- localStorage: Used for UI preferences throughout the app
- Trail node config: Exercise configs in `src/data/units/` define `measureCount`

### Integration Points

- `calculateTimingThresholds()` called by `rhythmScoringUtils.js` and `MetronomeTrainer.jsx`
- `resolveByTags` exported by `RhythmPatternGenerator.js`, needs importing in `RhythmReadingGame.jsx`
- `validateTrail.mjs` runs as prebuild hook — `validateMeasureCountPolicy()` enforces measure count policy at build time

</code_context>

<specifics>
## Specific Ideas

- Hebrew syllable Nikud strings are user-confirmed and MUST NOT be changed: טָה, טָה-טֶה, טָה-אָה, טָה-אָה-אָה-אָה, הָס
- English eighth pair is "ti-ti" (standard Kodaly), NOT "ta-te" like Hebrew
- Pulse exercise Hebrew label is "דופק" (dopek, meaning heartbeat/pulse)
- "Listen & Tap" (EN) / "חזור אחריי" (HE) game name — non-negotiable

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 26-restore-ux-regression_
_Context gathered: 2026-04-12_
