# UI Review — Phase 23: UX Polish

**Audited:** 2026-04-09
**Baseline:** 23-UI-SPEC.md (approved design contract)
**Screenshots:** Not captured (Playwright not available). Code-only audit.
**Overall Score: 19/24**

---

## Pillar Scores

| Pillar               | Score | Key Finding                                                                                                                                         |
| -------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Copywriting       | 4/4   | All spec strings implemented exactly; D-06 enforced; blocked HE strings confirmed by user                                                           |
| 2. Visuals           | 3/4   | Toggle correctly positioned and conditionally rendered; syllable annotation color diverges from spec (solid white vs spec's rgba(255,255,255,0.75)) |
| 3. Color             | 3/4   | Accent usage correct on all 4 reserved elements; hardcoded hex/rgb in VexFlow-rendering paths is expected/appropriate                               |
| 4. Typography        | 2/4   | `font-medium` (500) used in RhythmReadingGame header bar and MetronomeTrainer; spec explicitly bans this weight                                     |
| 5. Spacing           | 4/4   | Spacing tokens consistent with scale; arbitrary `min-h-[44px]` and `min-h-[96px]` values are spec-mandated touch targets                            |
| 6. Experience Design | 3/4   | Syllable toggle missing `active:scale-95` reducedMotion guard in RhythmDictationGame; null pattern error path is silent                             |

---

## Top 3 Priority Fixes

1. **`font-medium` in RhythmReadingGame header bar** — Spec declares only two weights: 400 (normal) and 700 (bold). `font-medium` (500) at `RhythmReadingGame.jsx` line 921 and `MetronomeTrainer.jsx` line 1549 violates this contract. Fix: change `font-medium` to `font-normal`.

2. **RhythmDictationGame syllable toggle missing reducedMotion guard** — `RhythmReadingGame.jsx` conditionally adds `active:scale-95` based on `!reducedMotion`, but `RhythmDictationGame.jsx` line 704 has no such conditional. The two games have asymmetric behavior. Fix: import `useSafeAccessibility` in `RhythmDictationGame.jsx` and apply the same `${!reducedMotion ? "active:scale-95" : ""}` conditional.

3. **Silent failure when `fetchNewPattern` returns null** — Spec declares error state: "Could not load rhythm. Try again." When `fetchNewPattern()` returns null, `fetchAndStartNextExercise` silently does nothing — staff stays blank, game is stuck with no feedback. Fix: add error state UI in the staff area.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

- **Game rename (D-04/D-06):** "Listen & Tap" appears 3 times in `en/common.json`; D-06 enforced — no "Metronome Rhythm Trainer" or "Metronome Trainer" remains. `useDocumentTitle.js` defaultValue is "Listen & Tap".
- **MISS -> "Almost!" (D-07/D-08):** Both keys updated in EN ("Almost!") and HE ("!"). Internal scoring constant `'MISS'` unchanged per D-09.
- **Syllable toggle label:** EN "Syllables" and HE "" with `aria-label` "Toggle rhythm syllables" matching spec exactly.
- **Error state copy:** "Could not load rhythm. Try again." is in spec but NOT implemented in any component. See Pillar 6.
- **RTL note (minor):** Spec specifies HE button label as " ". Code renders icon-first in DOM order. Since rhythm game containers use `dir="ltr"`, visual order is always icon-first. Zero impact.

### Pillar 2: Visuals (3/4)

- **Syllable toggle button:** Correctly placed in header bar above staff. Hidden on Discovery nodes (replaced by spacer div). Present in both RhythmReadingGame and RhythmDictationGame. ON/OFF states visually differentiated per spec.
- **VexFlow syllable annotation color (divergence):** Spec declares `rgba(255,255,255,0.75)`. Implementation sets solid `"white"` via `RhythmStaffDisplay.jsx` lines 185-187. Accepted in 23-03-SUMMARY.md. Visual impact minimal but diverges from design intent.
- **FloatingFeedback visual:** `text-3xl font-bold` preserved. Color mapping correct: PERFECT=green-400, GOOD=yellow-400, MISS=red-400.
- **Staff container glass card:** `rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md` matches spec's secondary glass card pattern exactly.

### Pillar 3: Color (3/4)

- **60/30/10 distribution:** Dominant purple gradient, secondary glass cards, accent indigo-500 — all correct.
- **Accent reserved-element compliance:** All 4 spec-reserved accent uses correct: primary buttons, cursor sweep line, syllable toggle ON state, beat indicator dots.
- **Hardcoded VexFlow colors (acceptable):** `RhythmStaffDisplay.jsx` uses hardcoded hex for tap result colorization. Values map exactly to Tailwind palette (green-400, yellow-400, red-400). Necessary because Tailwind classes cannot target SVG child elements.
- **Pre-existing concern:** `ArcadeRhythmGame.jsx` uses hardcoded `#f97316` (orange-500) for "on fire" state — outside spec accent palette but outside Phase 23 scope.

### Pillar 4: Typography (2/4)

**Violations found:**

- `RhythmReadingGame.jsx` line 921: `text-sm font-medium` — weight 500, spec allows only 400/700
- `MetronomeTrainer.jsx` line 1549: `text-lg font-medium text-white/80` — weight 500
- `RhythmGameSettings.jsx` line 92: `font-semibold` — weight 600, also outside two-weight system

**Font size distribution:** 9 distinct sizes across rhythm game files. Spec declares 4 roles (base/sm/lg/3xl). Sizes xs, 2xl, 4xl, 5xl are undeclared but likely belong to pre-existing components outside Phase 23.

**New Phase 23 components** (toggle buttons) correctly use `text-sm font-normal`.

### Pillar 5: Spacing (4/4)

- All new Phase 23 spacing maps to standard Tailwind 4px multiples
- Toggle button: `px-3 py-2` (12/8px), container: `px-4 gap-4` (16px)
- Touch targets enforced: `min-h-[44px]` on both toggle buttons (spec-mandated)
- `DictationChoiceCard`: `min-h-[96px]` — appropriate for VexFlow notation cards
- No non-spec arbitrary spacing in Phase 23 new code

### Pillar 6: Experience Design (3/4)

**Working correctly:**

- `isDiscovery` gate forces syllables on and hides toggle in both games
- `localStorage` persistence of `pianomaster_kodaly_syllables` with try/catch guard
- `aria-pressed` on toggle buttons in both games
- `reducedMotion` integrated in RhythmReadingGame toggle
- Loading states exist for MetronomeTrainer and RhythmDictationGame

**Issues:**

- **Issue A — Missing reducedMotion guard:** RhythmDictationGame syllable toggle has no `active:scale-95` at all, diverging from spec and from RhythmReadingGame parity
- **Issue B — Silent null pattern error:** When `fetchNewPattern()` returns null, game freezes with blank staff and no user feedback. Spec error copy not implemented.
- **Issue C — Shared i18n key (minor):** RhythmDictationGame uses `games.rhythmReading.syllableToggle` key instead of its own namespace. Maintainability concern only.

---

## Files Audited

**Primary:**

- `src/components/games/rhythm-games/RhythmReadingGame.jsx`
- `src/components/games/rhythm-games/RhythmDictationGame.jsx`
- `src/components/games/rhythm-games/MetronomeTrainer.jsx`
- `src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx`
- `src/components/games/rhythm-games/components/FloatingFeedback.jsx`
- `src/components/games/rhythm-games/components/DictationChoiceCard.jsx`
- `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js`
- `src/locales/en/common.json`
- `src/locales/he/common.json`
- `src/hooks/useDocumentTitle.js`

**Supporting:**

- `.planning/phases/23-ux-polish/23-UI-SPEC.md`
- `.planning/phases/23-ux-polish/23-CONTEXT.md`
- `.planning/phases/23-ux-polish/23-01-SUMMARY.md`, `23-02-SUMMARY.md`, `23-03-SUMMARY.md`
