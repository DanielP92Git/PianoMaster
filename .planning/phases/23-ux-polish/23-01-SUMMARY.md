---
phase: 23-ux-polish
plan: "01"
subsystem: rhythm-games
tags: [timing, i18n, ux, child-friendly, dedup]
dependency_graph:
  requires: []
  provides:
    - two-tier-timing-thresholds
    - metronome-trainer-rename
    - almost-miss-text
  affects:
    - src/components/games/rhythm-games/MetronomeTrainer.jsx
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
tech_stack:
  added: []
  patterns:
    - Two-tier timing threshold selection via EASY_NODE_TYPES Set
    - nodeType parameter threading from component to scoring utils
key_files:
  created: []
  modified:
    - src/components/games/rhythm-games/utils/rhythmTimingUtils.js
    - src/components/games/rhythm-games/utils/rhythmTimingUtils.test.js
    - src/components/games/rhythm-games/utils/rhythmScoringUtils.js
    - src/components/games/rhythm-games/MetronomeTrainer.jsx
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
    - src/hooks/useDocumentTitle.js
decisions:
  - Easy-tier base thresholds set to 2x hard-tier (100/150/250ms vs 50/75/125ms) for child-friendly learning nodes
  - EASY_NODE_TYPES = {discovery, practice, mix_up, review}; all others default to hard tier
  - JSON i18n key names kept unchanged (D-05); only string values updated
  - Scoring logic internal MISS constant unchanged (D-09); only display strings updated
  - Hebrew "Almost!" confirmed as "כמעט!" (not "כמעט!" with segol — user confirmed Kamatz variant)
  - Hebrew rest syllable "הָס" (Kamatz under heh) noted for Plan 03 — not implemented here
  - Plan 03 eighth note syllables: use "טָה-טֶה" (ta-te) instead of "טִי" (ti)
metrics:
  duration: ~25 minutes
  completed: 2026-04-07T15:15:00Z
  tasks_completed: 2
  tasks_total: 2
  files_modified: 8
---

# Phase 23 Plan 01: Child-Friendly Rhythm UX — Timing, Rename & MISS Text

**One-liner:** Two-tier timing thresholds (100ms easy / 50ms hard at 120 BPM) with MetronomeTrainer renamed to "Listen & Tap" / "חזור אחריי" and MISS feedback replaced with "Almost!" / "כמעט!" across EN and HE locales.

## What Was Built

### Task 2: Two-Tier Timing Thresholds + MetronomeTrainer Dedup (D-01, D-02, D-03)

Extended `calculateTimingThresholds(tempo, nodeType)` in `rhythmTimingUtils.js` with a two-tier system:

- **Easy tier** (`EASY_NODE_TYPES = {discovery, practice, mix_up, review}`): `PERFECT=100ms, GOOD=150ms, FAIR=250ms` at 120 BPM
- **Hard tier** (all others, including `null`): `PERFECT=50ms, GOOD=75ms, FAIR=125ms` at 120 BPM

Tempo scaling (exponent 0.3) applies on top of both tiers — slow tempos get even wider windows.

`nodeType` parameter threaded through:
- `rhythmScoringUtils.scoreTap()` gains 5th param `nodeType = null`
- `RhythmReadingGame.jsx` extracts `nodeType` from `getNodeById(nodeId)?.nodeType` and passes to both `scoreTap` calls
- `MetronomeTrainer.jsx` local duplicate `BASE_TIMING_THRESHOLDS` and `calculateTimingThresholds` deleted; replaced with import from `rhythmTimingUtils`; both call sites pass `nodeType`

**TDD:** 8 new tests written (RED then GREEN). All 18 tests pass.

### Task 3: MetronomeTrainer Rename + MISS Text (D-04 to D-09)

**Rename to "Listen & Tap" / "חזור אחריי":**

| Key path | EN before | EN after | HE before | HE after |
|----------|-----------|----------|-----------|----------|
| `games.cards.metronomeTrainer.name` | "Metronome Rhythm Trainer" | "Listen & Tap" | "תרגול קצב עם מטרונום" | "חזור אחריי" |
| `games.metronomeTrainer.headerTitle` | "Metronome Rhythm Trainer" | "Listen & Tap" | "מאמן המטרונום" | "חזור אחריי" |
| `gameSettings.titles.metronomeTrainer` | "Metronome Rhythm Trainer" | "Listen & Tap" | "מאמן קצב עם מטרונום" | "חזור אחריי" |

`useDocumentTitle.js` defaultValue changed from `"Metronome Trainer"` to `"Listen & Tap"`.

**MISS → Almost!:**

| Key path | EN before | EN after | HE before | HE after |
|----------|-----------|----------|-----------|----------|
| `games.metronomeTrainer.tapArea.accuracy.miss` | "Miss" | "Almost!" | "פספוס" | "כמעט!" |
| `games.rhythmReading.tapArea.accuracy.miss` | "MISS" | "Almost!" | "פספסת" | "כמעט!" |

No component code changes needed — `FloatingFeedback.jsx` and `TapArea.jsx` already read these i18n keys. Internal scoring constant `'MISS'` unchanged (D-09).

## Deviations from Plan

### Auto-corrected Key Path

**Found during:** Task 3

**Issue:** Plan specified `games.practiceModes.metronomeTrainer.name` as a key to update, but the actual JSON structure uses `games.cards.metronomeTrainer.name` (under `games.cards`, not `games.practiceModes`). The `games.practiceModes` object exists but does not contain a `metronomeTrainer` sub-key.

**Fix:** Updated `games.cards.metronomeTrainer.name` instead (the key that actually contained the string "Metronome Rhythm Trainer"). Result is correct — 3 EN keys and 3 HE keys updated as intended by the plan.

**Files modified:** `src/locales/en/common.json`, `src/locales/he/common.json`

## Notes for Plan 03

Per checkpoint resolution:
- Hebrew rest syllable: "הָס" (Kamatz under heh) — confirmed by user
- Hebrew eighth note syllables: use "טָה-טֶה" (ta-te) instead of "טִי" (ti)

## Known Stubs

None. All i18n string changes are fully wired — `FloatingFeedback.jsx` and `TapArea.jsx` read the keys dynamically.

## Threat Flags

None. This plan changes only timing math, i18n strings, and component imports — no auth, network, or data storage changes. (Matches T-23-01, T-23-02 disposition: accept.)

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 2: Two-tier timing + dedup | `57d7cd0` | rhythmTimingUtils.js, rhythmTimingUtils.test.js, rhythmScoringUtils.js, MetronomeTrainer.jsx, RhythmReadingGame.jsx |
| Task 3: Rename + MISS text | `4266ba7` | en/common.json, he/common.json, useDocumentTitle.js |

## Self-Check: PASSED

All files exist. Both task commits verified in git log. Key structural checks:
- `EASY_NODE_TYPES` present in rhythmTimingUtils.js
- `BASE_TIMING_THRESHOLDS_EASY` present in rhythmTimingUtils.js
- Zero local `BASE_TIMING_THRESHOLDS` copies in MetronomeTrainer.jsx
- 3x "Listen & Tap" in en/common.json, 3x "חזור אחריי" in he/common.json
- 2x "Almost!" in en/common.json, 2x "כמעט!" in he/common.json
- useDocumentTitle.js defaultValue updated to "Listen & Tap"
