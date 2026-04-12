---
phase: 23-ux-polish
plan: "03"
subsystem: rhythm-games
tags: [kodaly, syllables, i18n, vexflow, annotation, discovery, localStorage]
dependency_graph:
  requires:
    - 23-01
    - 23-02
  provides:
    - kodaly-syllable-annotations
    - syllable-toggle-localStorage
    - discovery-enforced-syllables
  affects:
    - src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js
    - src/components/games/rhythm-games/utils/rhythmVexflowHelpers.test.js
    - src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx
    - src/components/games/rhythm-games/components/DictationChoiceCard.jsx
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
    - src/components/games/rhythm-games/RhythmDictationGame.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
tech_stack:
  added: []
  patterns:
    - VexFlow Annotation API with AnnotationVerticalJustify.BOTTOM for below-note syllables
    - localStorage-persisted UI preference (pianomaster_kodaly_syllables key)
    - Discovery-node enforced-on pattern (isDiscovery check bypasses toggle)
key_files:
  created: []
  modified:
    - src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js
    - src/components/games/rhythm-games/utils/rhythmVexflowHelpers.test.js
    - src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx
    - src/components/games/rhythm-games/components/DictationChoiceCard.jsx
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
    - src/components/games/rhythm-games/RhythmDictationGame.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
decisions:
  - SYLLABLE_MAP_HE uses corrected Nikud per user review — eighth/sixteenth are "טָה-טֶה" (ta-te) not "טִי" (ti)
  - REST_SYLLABLE_HE is "הָס" (Kamatz under heh) not "הֶס" (Segol) — user confirmed
  - Solid white annotation color accepted (VexFlow SVG text loop sets all text to white; small 10px font ensures syllables are subordinate)
  - DictationChoiceCard updated to accept showSyllables/language (syllables on choice cards help learning in dictation mode)
  - No reducedMotion guard on toggle button animation in DictationGame (simpler button style used, no scale-95 transform)
metrics:
  duration: ~60 minutes
  completed: 2026-04-07
  tasks_completed: 2
  tasks_total: 2
  files_modified: 8
---

# Phase 23 Plan 03: Kodaly Rhythm Syllable Annotations Summary

**One-liner:** Kodaly syllable annotations (ta/ti/ta-a/sh and Hebrew equivalents with corrected Nikud) rendered below VexFlow note heads via Annotation API, with Discovery-nodes always-on and a localStorage-persisted toggle for all other node types.

## What Was Built

### Task 1: Syllable mapping constants and beatsToVexNotes annotation support (TDD)

Extended `rhythmVexflowHelpers.js` with exported syllable maps and annotation support:

**New exports:**

| Export             | Value                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `SYLLABLE_MAP_EN`  | `{16:"ta-a-a-a", 12:"ta-a-a", 8:"ta-a", 6:"ta-a", 4:"ta", 3:"ta", 2:"ti", 1:"ti"}`                               |
| `SYLLABLE_MAP_HE`  | `{16:"טָה-אָה-אָה-אָה", 12:"טָה-אָה-אָה", 8:"טָה-אָה", 6:"טָה-אָה", 4:"טָה", 3:"טָה", 2:"טָה-טֶה", 1:"טָה-טֶה"}` |
| `REST_SYLLABLE_EN` | `"sh"`                                                                                                           |
| `REST_SYLLABLE_HE` | `"הָס"` (Kamatz under heh — corrected from Segol)                                                                |

**beatsToVexNotes signature extended:**

```javascript
export function beatsToVexNotes(beats, { showSyllables = false, language = 'en' } = {}) {
```

When `showSyllables: true`, an `Annotation` is created per note:

- `annotation.setVerticalJustification(AnnotationVerticalJustify.BOTTOM)` — below note head
- `annotation.setFont({ family: "sans-serif", size: 10, weight: "normal" })` — small, subordinate
- `note.addModifier(annotation, 0)` — attached BEFORE formatter runs (Pitfall 1 avoidance)

**Tests:** 31 tests pass (18 pre-existing + 13 new syllable tests). Mock updated to include `Annotation` and `AnnotationVerticalJustify` with `getModifiers()` support on `MockStaveNote`.

### Task 2: Syllable toggle wired into games and Discovery enforced-on mode

**RhythmStaffDisplay.jsx:**

- Added `showSyllables = false` and `language = "en"` props
- Passes `{ showSyllables, language }` to `beatsToVexNotes(measureBeats, ...)` in the multi-stave render loop
- `useEffect` dependency array updated to include `showSyllables, language`

**DictationChoiceCard.jsx:**

- Added `showSyllables = false` and `language = "en"` props
- Passes `{ showSyllables, language }` to `beatsToVexNotes(beats, ...)`
- `useEffect` dependency array updated

**RhythmReadingGame.jsx:**

- `useTranslation` extended to include `i18n` for language detection
- Added `SYLLABLE_TOGGLE_KEY = "pianomaster_kodaly_syllables"`
- `isDiscovery = nodeType === "discovery"` (nodeType already extracted by Plan 01)
- `syllablesEnabled` state: initializes to `true` for Discovery, reads localStorage for others
- `showSyllableToggle = !isDiscovery` — hides toggle on Discovery nodes
- `handleSyllableToggle` callback: toggles state and writes to localStorage
- `currentLanguage = i18n.language?.startsWith("he") ? "he" : "en"`
- Toggle button in header bar: glassmorphism style, `aria-pressed`, `active:scale-95` on non-reducedMotion, `♩ Syllables` label with Unicode quarter note symbol
- `RhythmStaffDisplay` receives `showSyllables={syllablesEnabled}` and `language={currentLanguage}`

**RhythmDictationGame.jsx:**

- Same pattern: `nodeType` extraction, `isDiscovery`, `syllablesEnabled` state, `handleSyllableToggle`, `currentLanguage`
- Toggle button placed above choice cards in center column
- `DictationChoiceCard` receives `showSyllables={syllablesEnabled}` and `language={currentLanguage}`

**i18n keys added (`games.rhythmReading.syllableToggle`):**

| Locale | `label`       | `ariaLabel`                 |
| ------ | ------------- | --------------------------- |
| EN     | `"Syllables"` | `"Toggle rhythm syllables"` |
| HE     | `"הברות"`     | `"הצג הברות קצב"`           |

## Deviations from Plan

### [Rule 3 - Blocking] Restored accidentally deleted files from wave 1

**Found during:** Task 2 build verification

**Issue:** When the worktree branch was rebased onto `2890e29` via `git reset --soft`, the Task 1 commit accidentally included staged deletions of wave 1 files (`RhythmPatternGenerator.test.js`, `src/data/patterns/rhythmPatterns.js`, `rhythmPatterns.test.js`, `rhythmUnit1Redesigned.test.js`). Build failed with `Could not resolve "../../../data/patterns/rhythmPatterns.js"`.

**Fix:** Restored all deleted files from `2890e29` commit using `git checkout 2890e29 -- <file>`. Included in Task 2 commit.

**Files restored:** `RhythmPatternGenerator.test.js`, `rhythmPatterns.js`, `rhythmPatterns.test.js`, `rhythmUnit1Redesigned.test.js`

## Verification

- `npx vitest run src/components/games/rhythm-games/utils/rhythmVexflowHelpers.test.js` — 31 tests pass
- `npx vitest run src/components/games/rhythm-games/utils/ src/.../RhythmReadingGame.test.js src/.../RhythmDictationGame.test.js` — 58 tests pass
- `npm run build` — succeeds (validation warnings are pre-existing XP variance, unrelated)
- ArcadeRhythmGame.test.js failures are pre-existing (AudioContext mock issue, unrelated to Plan 03)

## Known Stubs

None. Syllable annotations are fully wired: `beatsToVexNotes` → `RhythmStaffDisplay` → `RhythmReadingGame`/`RhythmDictationGame`. Toggle persists to localStorage. Discovery node enforcement is active.

## Threat Flags

None. Syllable toggle uses localStorage for a UI preference (no PII). VexFlow SVG text exposes only educational content (syllable labels). Matches T-23-05 and T-23-06 dispositions (both: accept).

## Commits

| Task                                                             | Commit    | Files                                                                                                                                               |
| ---------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 1: Syllable maps + beatsToVexNotes annotation support       | `ff4f218` | rhythmVexflowHelpers.js, rhythmVexflowHelpers.test.js                                                                                               |
| Task 2: Syllable toggle wired into games + restore deleted files | `42041f7` | RhythmStaffDisplay.jsx, DictationChoiceCard.jsx, RhythmReadingGame.jsx, RhythmDictationGame.jsx, en/common.json, he/common.json, + 4 restored files |

## Self-Check: PASSED

Verified below.
