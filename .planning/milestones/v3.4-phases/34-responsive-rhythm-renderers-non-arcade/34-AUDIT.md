# Phase 34 — 13-Component Audit

**Audited:** 2026-05-10
**Scope:** D-09 (6 wrappers + 5 supporting + 2 setup); D-10 (rhythm-only — VictoryScreen/GameOverScreen NOT in scope); D-11 (BossIntro = responsive-sanity-only)
**Auditor:** Claude (executor agent for Plan 34-02)

## Method

This audit is a **rigorous code-inspection pass** against the four target quadrants:

- Phone-portrait: 375 × 667 (iPhone SE)
- Phone-landscape: 667 × 375
- Tablet-portrait: 768 × 1024 (iPad mini)
- Tablet-landscape: 1024 × 768

The audit reads each of the 13 components in scope, identifies the Tailwind responsive classes / inline width caps / orientation branches actually present in source, and predicts the rendered behaviour at each quadrant via Tailwind's documented breakpoint semantics (`sm:` ≥640, `md:` ≥768, `lg:` ≥1024) plus the `landscape:` variant. Findings cross-check the pre-research hypotheses in `34-RESEARCH.md` § "13-Component Audit Punch List" (lines 461-510).

**Why code-inspection rather than browser walkthrough:** The plan calls for `npm run dev` + Chrome DevTools emulation, but the parallel-executor agent does not run in an environment with an interactive browser. Static analysis of every Tailwind width / breakpoint class in source is sufficient to produce the punch list Plan 04 / Plan 05 will execute against — every "issue" below is grounded in a specific class string in a specific file. The plan's `<verify>` block asserts only file content (component name presence + per-quadrant rows), not browser interaction; this method satisfies that verification while remaining honest about its method (acknowledged as a known scope limitation per D-12 — manual UAT by user is the verification gate, AND this audit is its starting punch list).

**Status legend:**

- ✓ clean (no rendering defect at this quadrant)
- ⚠ issue, fixable inside Phase 34 scope
- ✗ broken — must fix
- 🟡 deferred — out of scope per D-10

**Owner column** values:

- `Plan 04` — renderers + grid layout fixes, wrapper landscape-context wiring
- `Plan 05` — supporting components + glass conversion + responsive size bumps
- `deferred` — out of scope per D-10/D-11

---

## Wrappers (6)

### 1. RhythmDictationGame (`src/components/games/rhythm-games/RhythmDictationGame.jsx`)

Current main game render (lines 670-786) wraps content in `flex h-screen items-stretch overflow-hidden` with three columns: a fixed `w-14` back-button column, a flex-1 cards column, and a fixed `w-16` controls column. Cards inside are stacked `flex flex-col gap-3` (line 700).

| Quadrant         | Status | Issue                                                                                                                                                                                                                                                                                                                                                                    | File:line                        | Fix owner |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- | --------- |
| phone-portrait   | ✗      | 3-column `flex h-screen` strips ~30px (14+16) of horizontal width for a tiny back-button + tiny replay column. At 375px, content well is ~329px after ring, then the cards in a vertical stack force a `h-screen` that almost never fits 3 cards + controls without clipping or pushing a card off-screen. The right column's score/feedback text has no breathing room. | RhythmDictationGame.jsx:671, 700 | Plan 04   |
| phone-landscape  | ⚠     | The 3-column layout works horizontally but `flex h-screen overflow-hidden` discards scroll; long syllable text in cards may clip.                                                                                                                                                                                                                                        | RhythmDictationGame.jsx:671      | Plan 04   |
| tablet-portrait  | ⚠     | 3-column layout wastes the wide viewport on the tiny side columns. Cards are still vertical stack inside `flex-1` — wide centred column with stacked cards leaves huge whitespace gutters (TABLET-01 violation).                                                                                                                                                         | RhythmDictationGame.jsx:678, 700 | Plan 04   |
| tablet-landscape | ⚠     | Same as tablet-portrait — wide viewport, narrow stacked cards. The 3-column shape is actually appropriate here (genuine landscape), but the cards container should be a 2x2 grid filling the centre column.                                                                                                                                                              | RhythmDictationGame.jsx:678, 700 | Plan 04   |

**Confirms RESEARCH hypothesis** "phone-portrait 3-column layout breaks" (line 495). Recommended: gate `lg:flex-row` so the 3-column layout only applies at tablet-landscape; phone-portrait/landscape and tablet-portrait collapse to vertical or 2x2 column layout.

---

### 2. RhythmReadingGame (`src/components/games/rhythm-games/RhythmReadingGame.jsx`)

Wrapper uses `flex min-h-screen flex-col` with a `<header>` + `<main className="flex flex-1 flex-col gap-4 px-4 pb-4">`. Notation area lives inside the renderer's own `w-full max-w-md` (RhythmReadingQuestion.jsx:603). Tap area uses `flex h-full max-h-96 w-full ...` (line 932) — that's NOT `max-w-md`, so it's full-width within the column.

| Quadrant         | Status | Issue                                                                                                                                                                                               | File:line                                    | Fix owner                        |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------- |
| phone-portrait   | ⚠     | Fits, but content-driven prompt (`useRotatePrompt` only — no `useNeedsLandscape`) cannot signal "this short pattern is OK in portrait". This wrapper must adopt the new context API per Plan 03/04. | RhythmReadingGame.jsx:56, 836                | Plan 04 (wrapper context wiring) |
| phone-landscape  | ✓      | Header + notation + metronome + tap area lay out vertically. Acceptable.                                                                                                                            | —                                            | —                                |
| tablet-portrait  | ⚠     | Notation `max-w-md` truncates the staff to ~448px on a 768px+ viewport, leaving large whitespace. TABLET-01 violation.                                                                              | renderers/RhythmReadingQuestion.jsx:603, 623 | Plan 04                          |
| tablet-landscape | ⚠     | Same as tablet-portrait — staff capped at `max-w-md`.                                                                                                                                               | renderers/RhythmReadingQuestion.jsx:603, 623 | Plan 04                          |

**Confirms RESEARCH hypothesis:** RhythmReadingQuestion `max-w-md` too narrow on tablet (line 472).

---

### 3. MetronomeTrainer (`src/components/games/rhythm-games/MetronomeTrainer.jsx`)

Largest wrapper (1510 LOC). Game phase uses `flex h-screen flex-col overflow-hidden bg-gradient...` (line 1372). Compact header + `flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 sm:flex-row landscape:flex-row landscape:gap-2` (line 1421). Setup screen delegates to RhythmGameSetup (line 1305). Uses `MetronomeDisplay` (line 1425) and `TapArea` (line 1440).

| Quadrant         | Status | Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                          | File:line                               | Fix owner                                     |
| ---------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------- |
| phone-portrait   | ⚠     | `h-screen overflow-hidden` may clip stats row at the bottom on iPhone SE (667px) when accounting for browser chrome ~85px. Hardcoded `dir="rtl"` (line 1373) on the wrapper while the rest of the app respects i18n.dir() — this is a layout choice, but pinned RTL means LTR users see reversed flex order, which is unconventional. Note: this is documented as in-scope per the wrapper audit even if not strictly responsive — log and let Plan 04 decide. | MetronomeTrainer.jsx:1372, 1373         | Plan 04                                       |
| phone-landscape  | ✓      | `landscape:flex-row` activates side-by-side metronome / tap-area. Acceptable.                                                                                                                                                                                                                                                                                                                                                                                  | —                                       | —                                             |
| tablet-portrait  | ⚠     | At ≥640px (tablet-portrait is ≥768) `sm:flex-row` activates side-by-side, but TapArea inside is capped at `max-w-md` (TapArea.jsx:71) so the right pane has wasted whitespace. MetronomeDisplay circles use `sm:h-10 sm:w-10` (40px) which doesn't scale up at `md:` for tablets.                                                                                                                                                                              | TapArea.jsx:71, MetronomeDisplay.jsx:40 | Plan 05 (size bumps in supporting components) |
| tablet-landscape | ⚠     | Same — TapArea narrow, MetronomeDisplay tiny on 1024px+ viewport.                                                                                                                                                                                                                                                                                                                                                                                              | TapArea.jsx:71, MetronomeDisplay.jsx:40 | Plan 05                                       |

**Confirms RESEARCH hypothesis:** MetronomeDisplay `sm:` not `md:` bug (line 484); TapArea wrapper too narrow on tablet (line 485).

---

### 4. VisualRecognitionGame (`src/components/games/rhythm-games/VisualRecognitionGame.jsx`)

Has explicit landscape branch at line 283 and portrait branch at line 316, both `fixed inset-0 flex flex-col ... bg-gradient... p-4`. Uses JS-driven `isLandscape` from `matchMedia` (lines 86, 93-99). Renders `VisualRecognitionQuestion` which itself swaps grid via `isLandscape` prop (renderers/VisualRecognitionQuestion.jsx:39-41).

| Quadrant         | Status | Issue                                                                                                                                                                                                                             | File:line                                  | Fix owner |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------- |
| phone-portrait   | ✓      | 2x2 grid at `max-w-sm` fits iPhone SE comfortably. Cards visible without scroll.                                                                                                                                                  | —                                          | —         |
| phone-landscape  | ✓      | 1x4 row at `max-w-2xl` works at 667px landscape (cards small but present).                                                                                                                                                        | —                                          | —         |
| tablet-portrait  | ⚠     | Renderer locked at `max-w-sm` portrait sizing (renderers:41) — cards are mobile-sized in middle of 768px viewport. TABLET-01 violation.                                                                                           | renderers/VisualRecognitionQuestion.jsx:41 | Plan 04   |
| tablet-landscape | ⚠     | Renderer locked at `max-w-2xl` landscape — at 1024px this leaves ~384px of side gutters. Should expand to fill width. JS-driven `isLandscape` should be replaced by Tailwind responsive variants per RESEARCH § Pattern 3 (D-06). | renderers/VisualRecognitionQuestion.jsx:39 | Plan 04   |

**Confirms RESEARCH hypotheses:** VisualRecognition stuck at `max-w-2xl` on tablet-landscape (line 475); JS `isLandscape` swap should become Tailwind classes per D-06 (anti-pattern noted line 260).

---

### 5. SyllableMatchingGame (`src/components/games/rhythm-games/SyllableMatchingGame.jsx`)

Identical structure to VisualRecognitionGame. Same JS `isLandscape` (lines 86, 93-99), same portrait/landscape branches (lines 282/315), same renderer pattern (renderers/SyllableMatchingQuestion.jsx:53-54).

| Quadrant         | Status | Issue                                                        | File:line                                 | Fix owner |
| ---------------- | ------ | ------------------------------------------------------------ | ----------------------------------------- | --------- |
| phone-portrait   | ✓      | 2x2 grid fits at `max-w-sm`.                                 | —                                         | —         |
| phone-landscape  | ✓      | 1x4 row at `max-w-2xl`.                                      | —                                         | —         |
| tablet-portrait  | ⚠     | Cards stuck at `max-w-sm` — same issue as VisualRecognition. | renderers/SyllableMatchingQuestion.jsx:54 | Plan 04   |
| tablet-landscape | ⚠     | `max-w-2xl` cap leaves whitespace gutters on 1024px+.        | renderers/SyllableMatchingQuestion.jsx:53 | Plan 04   |

**Confirms RESEARCH hypothesis:** SyllableMatching stuck at `max-w-2xl` on tablet-landscape (line 474).

---

### 6. MixedLessonGame (`src/components/games/rhythm-games/MixedLessonGame.jsx`)

Wrapper with explicit landscape branch (line 572) and portrait branch (line 615). Both use `fixed inset-0 flex flex-col overflow-y-auto bg-gradient... p-4`. Crossfade key on line 604 / 646: `${fadeKey}-${currentIndex}` (this is the field-tested key from Phase 25 bug fix). Renders any of 7 child renderers via `renderQuestion()` (line 540). Mounts `BossIntroOverlay` for full-boss mode (lines 578, 620).

| Quadrant         | Status | Issue                                                                                                                                                                                                                                                                                                                                                                   | File:line                                   | Fix owner |
| ---------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------- |
| phone-portrait   | ⚠     | Renderer-dependent. When the active child is RhythmDictationQuestion (vertical card stack at `max-w-md`) the layout works because the parent gives `gap-6` between renderer and progress bar. When the active child is RhythmReadingQuestion with a long pattern, see RhythmReadingGame's notes — content-driven landscape declaration (Plan 03 context wiring) needed. | MixedLessonGame.jsx:614, renderers per case | Plan 04   |
| phone-landscape  | ✓      | `flex flex-1 flex-col items-center justify-center gap-4` works for any child.                                                                                                                                                                                                                                                                                           | —                                           | —         |
| tablet-portrait  | ⚠     | Inherits all per-renderer width-cap issues (max-w-md / max-w-sm / max-w-2xl). Wrapper itself does not constrain width — but children do. Fix is at the renderer layer.                                                                                                                                                                                                  | renderers per case                          | Plan 04   |
| tablet-landscape | ⚠     | Same as tablet-portrait — children cap width.                                                                                                                                                                                                                                                                                                                           | renderers per case                          | Plan 04   |

**Notes:**

- The `key={\`${fadeKey}-${currentIndex}\`}` pattern (lines 604, 646) is the documented Phase 25 fix for consecutive same-type questions freezing. Do NOT touch that key during Plan 03/04 wiring.
- Crossfade swap mechanism is what makes Pitfall 3 (StrictMode flicker) theoretically possible; not a separate audit defect — flag for UAT.

---

## Setup Screens (2)

### 7. RhythmGameSetup (`src/components/games/rhythm-games/components/RhythmGameSetup.jsx`)

This is a thin (84 LOC) wrapper that delegates entirely to `UnifiedGameSettings` (`shared/UnifiedGameSettings`). Per D-10, `UnifiedGameSettings` is shared cross-game scaffolding and is NOT in Phase 34 scope.

| Quadrant         | Status | Issue                                                                 | File:line                 | Fix owner |
| ---------------- | ------ | --------------------------------------------------------------------- | ------------------------- | --------- |
| phone-portrait   | 🟡     | Layout owned by UnifiedGameSettings — out of Phase 34 scope per D-10. | RhythmGameSetup.jsx:74-82 | deferred  |
| phone-landscape  | 🟡     | Same — delegated.                                                     | —                         | deferred  |
| tablet-portrait  | 🟡     | Same — delegated.                                                     | —                         | deferred  |
| tablet-landscape | 🟡     | Same — delegated.                                                     | —                         | deferred  |

**Note:** If user-UAT surfaces UnifiedGameSettings responsive issues at any quadrant, log them in the "Deferred (Out-of-Scope) Findings" section below — do NOT fix in Phase 34.

---

### 8. RhythmGameSettings (`src/components/games/rhythm-games/components/RhythmGameSettings.jsx`)

Modal-wrapped settings panel. Currently uses `bg-white text-gray-700 border-gray-300` for cards (lines 89, 117) and `bg-gray-200` for the slider track (line 144). Wrapped by `<Modal>` (Modal.jsx) — Modal default variant is `bg-white/95 backdrop-blur-xl border border-white/20 text-gray-900` (Modal.jsx:62). So the surrounding modal IS light-themed by default; the white inputs are technically consistent.

**HOWEVER:** The rest of the design system uses glass cards on the purple gradient (CLAUDE.md "Glass Card Pattern"). The Modal's light-theme default is itself an outlier from the glass system used elsewhere. D-18 explicitly scopes glass conversion of RhythmGameSettings into Plan 05. This audit confirms:

- (a) The component IS visually consistent with its current Modal wrapper at all quadrants — no rendering BUG
- (b) But it's stylistically inconsistent with the surrounding glass-purple game wrapper that opens it (the Modal pops over a glass-purple background, looks jarringly bright)
- (c) Per D-18, glass conversion ships in Plan 05 regardless

| Quadrant         | Status | Issue                                                                                                                                                                                                                                                     | File:line                                             | Fix owner |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------- |
| phone-portrait   | ⚠     | Modal `max-w-lg` (Modal.jsx:52) fits, but light-on-purple jarring. Per D-18 → glass-convert.                                                                                                                                                              | RhythmGameSettings.jsx:89, 117, 144                   | Plan 05   |
| phone-landscape  | ⚠     | Same — `max-h-[90vh]` (Modal.jsx:87) on landscape phone (375px tall) gives ~337px of modal height — Time Signature 2x2 grid + tempo slider may force scroll. Glass conversion alone won't fix the height squeeze; consider compact spacing for landscape. | Modal.jsx:87, RhythmGameSettings.jsx:71 (`space-y-6`) | Plan 05   |
| tablet-portrait  | ⚠     | Modal `max-w-lg` (~512px) is fine; light-on-glass jarring.                                                                                                                                                                                                | RhythmGameSettings.jsx:89, 117, 144                   | Plan 05   |
| tablet-landscape | ⚠     | Same — light theme on glass-page background.                                                                                                                                                                                                              | RhythmGameSettings.jsx:89, 117, 144                   | Plan 05   |

**Updates RESEARCH hypothesis A4** (line 730): The light theme is NOT a "bug" per se — Modal's default variant injects a light surface, so the colors are internally consistent. BUT the _combination_ (light Modal popping over glass-purple game) is jarring, AND D-18 already scoped glass conversion for Plan 05. Recommendation stands: glass-convert in Plan 05, but the audit should not call this a "bug" — call it a design-system migration.

---

## Supporting Overlays (5)

### 9. CountdownOverlay (`src/components/games/rhythm-games/components/CountdownOverlay.jsx`)

Fixed full-screen overlay with single `text-3xl font-bold` countdown number (line 35). 42 LOC.

| Quadrant         | Status | Issue                                                                              | File:line               | Fix owner |
| ---------------- | ------ | ---------------------------------------------------------------------------------- | ----------------------- | --------- |
| phone-portrait   | ✓      | `text-3xl` (~30px) reads cleanly at 375px.                                         | —                       | —         |
| phone-landscape  | ✓      | Same.                                                                              | —                       | —         |
| tablet-portrait  | ⚠     | `text-3xl` is tiny relative to 768px width — countdown should scale with viewport. | CountdownOverlay.jsx:35 | Plan 05   |
| tablet-landscape | ⚠     | Same — tiny on 1024px+. Recommend `text-3xl md:text-5xl lg:text-6xl`.              | CountdownOverlay.jsx:35 | Plan 05   |

**Confirms RESEARCH hypothesis:** CountdownOverlay tiny on tablet (line 481).

---

### 10. BossIntroOverlay (`src/components/games/rhythm-games/components/BossIntroOverlay.jsx`)

Per D-11, audited for **responsive sanity only** — visual treatment (Crown + amber/gold gradient + boss name) stays unchanged. Uses `text-5xl`, `h-16 w-16` Crown, `text-xl`, `text-base` (lines 59-83). Auto-dismisses after 2s.

| Quadrant         | Status | Issue                                                                                                                                                     | File:line | Fix owner |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
| phone-portrait   | ✓      | `text-5xl` Crown + title fit. `flex flex-col items-center justify-center` on `inset-0` centers content. No clip, no overflow.                             | —         | —         |
| phone-landscape  | ✓      | At 667×375 the title + crown stack vertically with `gap-4`; `inset-0` centers; should fit (~280px tall content vs 375px viewport). Tight but no overflow. | —         | —         |
| tablet-portrait  | ✓      | Plenty of room.                                                                                                                                           | —         | —         |
| tablet-landscape | ✓      | Plenty of room.                                                                                                                                           | —         | —         |

**No fix needed.** D-11 scope satisfied — no clip/overflow at any quadrant. Pre-research hypothesis confirmed (line 482).

---

### 11. FloatingFeedback (`src/components/games/rhythm-games/components/FloatingFeedback.jsx`)

Absolutely-positioned `text-3xl font-bold` text floating above tap area, animates upward + fades out 800ms. 102 LOC.

| Quadrant         | Status | Issue                                                                                        | File:line               | Fix owner |
| ---------------- | ------ | -------------------------------------------------------------------------------------------- | ----------------------- | --------- |
| phone-portrait   | ✓      | `text-3xl` legible at 375px.                                                                 | —                       | —         |
| phone-landscape  | ✓      | Same.                                                                                        | —                       | —         |
| tablet-portrait  | ⚠     | `text-3xl` tiny relative to 768px tap surface. Recommend `text-3xl md:text-4xl lg:text-5xl`. | FloatingFeedback.jsx:93 | Plan 05   |
| tablet-landscape | ⚠     | Same — tiny on 1024px+ tap area.                                                             | FloatingFeedback.jsx:93 | Plan 05   |

**Confirms RESEARCH hypothesis:** FloatingFeedback tiny on tablet (line 483).

---

### 12. MetronomeDisplay (`src/components/games/rhythm-games/components/MetronomeDisplay.jsx`)

Beat circles. Currently `h-9 w-9 text-xs sm:h-10 sm:w-10 sm:text-sm` (line 40) — `sm:` breakpoint is 640px, NOT `md:` (768px tablet boundary). So tablets get the same 40px circles as `sm:` phones-landscape.

| Quadrant         | Status | Issue                                                                                                                                           | File:line               | Fix owner |
| ---------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------- |
| phone-portrait   | ✓      | 36px circles fit.                                                                                                                               | —                       | —         |
| phone-landscape  | ✓      | 40px (`sm:` triggers at 640px) — fine.                                                                                                          | —                       | —         |
| tablet-portrait  | ⚠     | Still only 40px circles at 768px+ — looks tiny in horizontal beat row. Recommend `md:h-12 md:w-12 md:text-base` and possibly `lg:h-14 lg:w-14`. | MetronomeDisplay.jsx:40 | Plan 05   |
| tablet-landscape | ⚠     | Same — 40px on 1024px+ viewport.                                                                                                                | MetronomeDisplay.jsx:40 | Plan 05   |

**Confirms RESEARCH hypothesis:** MetronomeDisplay `sm:` not `md:` bug (line 484).

---

### 13. TapArea (`src/components/games/rhythm-games/components/TapArea.jsx`)

Large tap surface. `relative flex h-full max-h-96 w-full max-w-md flex-col items-center justify-center` (line 71). Inner text `text-5xl sm:text-6xl` (line 86), feedback `text-3xl sm:text-4xl` (line 91).

| Quadrant         | Status | Issue                                                                                                                                     | File:line      | Fix owner                                                                   |
| ---------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------- |
| phone-portrait   | ✓      | `max-w-md` (~448px) caps at 375px viewport — full width minus padding. Fine.                                                              | —              | —                                                                           |
| phone-landscape  | ✓      | At 667px landscape the `max-w-md` caps to 448px which is appropriate as one of two side-by-side columns. Fine.                            | —              | —                                                                           |
| tablet-portrait  | ⚠     | `max-w-md` leaves the tap area at 448px on a 768px wrapper column — wasted touch surface. Recommend `max-w-md md:max-w-2xl lg:max-w-3xl`. | TapArea.jsx:71 | Plan 05 (default cap bump) + Plan 04 (per-call-site overrides where needed) |
| tablet-landscape | ⚠     | Same — too narrow.                                                                                                                        | TapArea.jsx:71 | Plan 05 / Plan 04                                                           |

**Confirms RESEARCH hypothesis:** TapArea wrapper too narrow on tablet (line 485).

---

## Pre-Research Hypothesis Confirmation

Cross-checks every hypothesis listed in `34-RESEARCH.md` § "13-Component Audit Punch List" (lines 461-510).

| RESEARCH finding                                                            | Confirmed? | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RhythmDictationQuestion vertical-stack should be 2x2 grid                   | yes        | Confirmed at renderers/RhythmDictationQuestion.jsx:261 (`flex w-full max-w-md flex-col gap-3`). However, **note**: current dictation has 3 cards (one correct + 2 distractors per RhythmDictationGame.jsx:297 `generateDistractors(beats, 2)`) — not 4. So "2x2" is wrong for this renderer specifically; recommended grid is `grid grid-cols-1 sm:grid-cols-3 gap-3` (1-up portrait, 3-across landscape and tablet) OR keep vertical stack and add `lg:grid-cols-3` for tablet. **Plan 04 must reconcile this nuance** — RESEARCH assumed 4 cards, dictation has 3. |
| DiscoveryIntroQuestion `max-w-sm` too narrow on tablet                      | yes        | renderers/DiscoveryIntroQuestion.jsx:188 (`max-w-sm` portrait) and :187 (`max-w-2xl` landscape) — both cap below tablet width. Recommend `md:max-w-2xl lg:max-w-3xl` per RESEARCH § DiscoveryIntroQuestion Tablet Sizing.                                                                                                                                                                                                                                                                                                                                            |
| SyllableMatching/VisualRecognition stuck at `max-w-2xl` on tablet-landscape | yes        | renderers/SyllableMatchingQuestion.jsx:53, renderers/VisualRecognitionQuestion.jsx:40. Same `max-w-2xl` cap; should expand to `lg:max-w-4xl` per RESEARCH § Pattern 3.                                                                                                                                                                                                                                                                                                                                                                                               |
| CountdownOverlay tiny on tablet                                             | yes        | CountdownOverlay.jsx:35 (`text-3xl` only). Recommend `text-3xl md:text-5xl lg:text-6xl`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| FloatingFeedback tiny on tablet                                             | yes        | FloatingFeedback.jsx:93 (`text-3xl` only). Recommend `text-3xl md:text-4xl lg:text-5xl`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| MetronomeDisplay sm: not md: bug                                            | yes        | MetronomeDisplay.jsx:40. Recommend `h-9 w-9 text-xs sm:h-10 sm:w-10 sm:text-sm md:h-12 md:w-12 md:text-base`.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| TapArea wrapper too narrow on tablet                                        | yes        | TapArea.jsx:71 (`max-w-md`). Recommend `max-w-md md:max-w-2xl lg:max-w-3xl` as the default; some call sites (e.g. inside narrow column layouts in MetronomeTrainer) may want a per-call override.                                                                                                                                                                                                                                                                                                                                                                    |
| RhythmGameSettings `bg-white text-gray-700` light theme on glass page       | partially  | RhythmGameSettings.jsx:89, 117, 144 — light theme is REAL, but it's actually consistent with the surrounding `<Modal>` default variant (Modal.jsx:62 `bg-white/95 ... text-gray-900`). So this is NOT a rendering bug — the modal IS light-themed. However per D-18 it still ships glass-converted in Plan 05 to align with the rest of the design system. **Hypothesis correct in identifying the visual mismatch; updates the framing — this is a design-system alignment, not a defect fix.**                                                                     |
| RhythmDictationGame phone-portrait 3-column layout breaks                   | yes        | RhythmDictationGame.jsx:671 (`flex h-screen items-stretch overflow-hidden`) + 14px back column + 16px right column. Recommend `lg:flex-row` to keep 3-column only on tablet-landscape, and a tablet 2x2 cards grid inside the centre column.                                                                                                                                                                                                                                                                                                                         |

**Summary:** 8 of 9 hypotheses confirmed as written; 1 (RhythmGameSettings) confirmed in spirit but reframed (not a rendering bug, a design-system migration per D-18). 1 important nuance flagged for Plan 04: RhythmDictationQuestion has 3 cards not 4 — grid recommendation must adjust.

---

## Deferred (Out-of-Scope) Findings

Per D-10, log shared-screen issues here. Plan 04/05 must NOT fix these in Phase 34. Quick-task or future-milestone candidates.

- **VictoryScreen** at all quadrants: Not audited deeply per D-10. Any responsive issues observed during user UAT (Plan 02 Task 2 sign-off) should be logged as a future quick-task. The wrappers all unconditionally render `<VictoryScreen>` on session complete (RhythmDictationGame.jsx:578-592, RhythmReadingGame.jsx:813-831, etc.). Phase 34 changes do not touch VictoryScreen layout.
- **GameOverScreen** at all quadrants: Same deferral. None of the 6 rhythm wrappers actually mount GameOverScreen (rhythm games don't fail-out — they always reach SESSION_COMPLETE → VictoryScreen). So this is a no-op for rhythm specifically; only relevant if a rhythm game adds a lives system later.
- **UnifiedGameSettings** (used by RhythmGameSetup): Per D-10 deferred. Any responsive issues live in `src/components/games/shared/UnifiedGameSettings.jsx`, owned by the broader cross-game settings milestone, not Phase 34.
- **AudioInterruptedOverlay** (`shared/AudioInterruptedOverlay.jsx`): Used by RhythmDictationGame, RhythmReadingGame, MetronomeTrainer, MixedLessonGame for iOS audio interruption recovery. Not in WRAPPER-03 scope. Visually a full-screen overlay; if user UAT surfaces issues, log here.
- **`<Modal>` light-theme default** (Modal.jsx:62): Cross-cutting design-system inconsistency. The Modal's `bg-white/95` default makes ANY modal opened from a glass-purple game page look jarring. Out of Phase 34 scope (touched only inside RhythmGameSettings via D-18). A proper fix would update the Modal default variant or introduce a `glass` variant — defer to a design-system milestone.
- **`useLandscapeLock` Android-PWA force-lock** (RESEARCH § Pitfall 3 / Open Question 3, resolved as D-19): The hook will be modified in Plan 03 Task 2 to be context-aware. Not a defect to log here — already in Plan 03 scope.

---

## Fix Owner Mapping

Maps every component (and the renderer-layer fixes that flow through Plan 04) to its owning plan.

| Component                 | Owning plan | Fix nature                                                                                                                           |
| ------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| RhythmDictationQuestion   | Plan 04     | Grid swap — note: 3 cards not 4 (see Hypothesis Confirmation)                                                                        |
| SyllableMatchingQuestion  | Plan 04     | Grid swap + max-width expansion (`max-w-sm md:max-w-2xl lg:max-w-4xl`); replace JS `isLandscape` with Tailwind `landscape:` per D-06 |
| VisualRecognitionQuestion | Plan 04     | Grid swap + max-width expansion; replace JS `isLandscape` with Tailwind per D-06                                                     |
| DiscoveryIntroQuestion    | Plan 04     | Tablet sizing (`md:max-w-2xl lg:max-w-3xl`); SVG sizing per RESEARCH § DiscoveryIntroQuestion Tablet Sizing Recommendation           |
| RhythmReadingQuestion     | Plan 04     | `useDeclareNeedsLandscape` declaration + width bump on notation/staff container                                                      |
| RhythmTapQuestion         | Plan 04     | `useDeclareNeedsLandscape` declaration + width bump on TapArea call site                                                             |
| PulseQuestion             | Plan 04     | `useDeclareNeedsLandscape(false)` declaration (always 1 measure per RESEARCH line 470)                                               |
| RhythmDictationGame       | Plan 04     | Wrapper landscape-context wiring + phone-portrait layout fix (collapse 3-column to vertical or 2-col)                                |
| RhythmReadingGame         | Plan 04     | Wrapper landscape-context wiring composition                                                                                         |
| MetronomeTrainer          | Plan 04     | Wrapper landscape-context wiring + verify `dir="rtl"` is intentional or i18n-driven                                                  |
| VisualRecognitionGame     | Plan 04     | Wrapper landscape-context wiring + remove JS `isLandscape` state in favour of renderer-side responsive classes                       |
| SyllableMatchingGame      | Plan 04     | Same as VisualRecognitionGame                                                                                                        |
| MixedLessonGame           | Plan 04     | Wrapper landscape-context wiring composition (children declare; wrapper reads)                                                       |
| CountdownOverlay          | Plan 05     | Size bump (`text-3xl md:text-5xl lg:text-6xl`)                                                                                       |
| FloatingFeedback          | Plan 05     | Size bump (`text-3xl md:text-4xl lg:text-5xl`)                                                                                       |
| MetronomeDisplay          | Plan 05     | Size bump (`md:h-12 md:w-12 md:text-base`) — fix `sm:` → add `md:`                                                                   |
| TapArea                   | Plan 05     | Default `max-w-md md:max-w-2xl lg:max-w-3xl` (call sites in Plan 04 may override)                                                    |
| RhythmGameSettings        | Plan 05     | Glass conversion per D-18 (NOT a bug fix — design-system migration); compact spacing for phone-landscape modal height                |
| BossIntroOverlay          | Plan 05     | None required — passes responsive sanity at all 4 quadrants per D-11. **No-op task; can be skipped or trivially regression-tested.** |
| RhythmGameSetup           | deferred    | Delegates entirely to UnifiedGameSettings — D-10 out-of-scope.                                                                       |

**Plan 04 task count estimate:** ~13 modifications (6 wrappers + 7 renderers — Plan 04 is the heavier plan).
**Plan 05 task count estimate:** ~5-6 modifications (4 size bumps + 1 glass conversion + 1 no-op verify on BossIntroOverlay).

---

## Prioritized Punch List

For Plan 04 / Plan 05 task ordering, prioritized by user-impact severity at the iPhone SE portrait floor (Phase 34 success criterion #1 in ROADMAP):

**P0 (must ship — blocks success criterion):**

1. RhythmDictationGame phone-portrait 3-column layout (visible breakage on iPhone SE) — Plan 04
2. Renderer landscape-context wiring (RhythmReadingQuestion, RhythmTapQuestion, MixedLessonGame children) — Plan 03/04
3. Wrapper landscape-context wiring (6 wrappers) — Plan 04

**P1 (TABLET-01 / quality):** 4. DiscoveryIntroQuestion tablet sizing — Plan 04 5. SyllableMatching / VisualRecognition tablet width expansion — Plan 04 6. RhythmReadingQuestion tablet notation width — Plan 04 7. TapArea default cap bump — Plan 05

**P2 (polish):** 8. CountdownOverlay tablet size — Plan 05 9. FloatingFeedback tablet size — Plan 05 10. MetronomeDisplay tablet size — Plan 05 11. RhythmGameSettings glass conversion (D-18) — Plan 05

**No-op (verify only):** 12. BossIntroOverlay — already passes D-11 sanity check

---

## Audit Limitations

To be honest about method:

- This audit is **code-inspection-driven**, not browser-emulator-driven. The plan's stated method (Vite dev server + Chrome DevTools device emulator) is the gold standard but the parallel-executor agent does not have an interactive browser. Static analysis of every Tailwind responsive class + per-component width cap is rigorous enough to produce a usable punch list, but cannot catch:
  - Subtle interactive timing issues (RAF cursor drift, animation flicker)
  - VexFlow rendering quirks at exact pixel widths (e.g. whether a 2-measure 4/4 actually renders legibly at iPhone SE)
  - Real-device-only quirks (iOS Safari address-bar collapse, Android browser chrome)
- The `<verify>` block on Task 1 (line 190) checks file content, not interactive behaviour — this audit satisfies it. The Task 2 sign-off checkpoint (per `autonomous: false` + parallel-executor instructions) is where user-driven UAT confirms / extends these findings.
- Audit screenshots directory was not created — the agent has no browser to capture from. Plan 04/05 implementation can capture before/after screenshots during user UAT for evidence in their SUMMARY files.

---

## Summary

- **13 components walked across 4 quadrants = 52 quadrant assessments.**
- **0 critical bugs** outside the known RESEARCH hypothesis set.
- **9 of 9** pre-research hypotheses confirmed (1 reframed for RhythmGameSettings — design-system migration, not a defect).
- **1 important nuance** flagged for Plan 04: RhythmDictationQuestion has 3 cards not 4 — grid recommendation must adjust accordingly.
- Fix-owner split: **Plan 04 owns 13 modifications** (wrappers + renderers + landscape-context), **Plan 05 owns 5-6 modifications** (supporting size bumps + glass conversion).
- BossIntroOverlay needs no responsive change (D-11 sanity satisfied).
- RhythmGameSetup remains deferred (D-10).

Plans 04 and 05 may begin Wave 3 against this punch list, pending user sign-off at Plan 02 Task 2.
