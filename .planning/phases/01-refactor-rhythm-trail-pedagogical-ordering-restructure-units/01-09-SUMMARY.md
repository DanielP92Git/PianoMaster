---
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
plan: 09
subsystem: ui
tags:
  [
    scaffolding,
    renderer,
    pagination,
    discovery-intro,
    multi-card,
    react,
    i18n,
    tdd,
  ]

# Dependency graph
requires:
  - phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units/03
    provides: "EN+HE game.discovery.cards.* i18n tree (89 paths each, 12 concepts)"
  - phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units/08
    provides: "rhythm unit data (U1-U10) that emits discovery_intro questions with focusDuration / cards inputs"
provides:
  - "Multi-card pagination renderer (DiscoveryIntroQuestion.jsx) supporting 2-4 swipable cards per discovery_intro question"
  - "CONCEPT_CARDS default map for all 12 D-08 concepts (q, qr, h, hr, w, wr, 8_pair, 16, hd, qd, 3_4, 6_8)"
  - "Inline question.cards override mechanism for ad-hoc card sequencing"
  - "Pagination state reset on question prop change (focusDuration / focusPattern.id)"
  - "Pattern-mode preservation (focusPattern.id = qhq/synsyn) — single-card legacy behavior intact for hidden Unit 8 syncopation"
  - "Card progress indicator (pill + dots) with aria-labeled progress for multi-card flows"
affects:
  - "01-10 (paywall + migration plan — cache bump may interact with new pagination UX)"
  - "future v3.5+ milestones that may add new discovery concepts (extend CONCEPT_CARDS map)"
  - "future planned re-enable of hidden Unit 8 Syncopation (rhythm_synco_* + qhq/synsyn pattern intros)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-card pagination inside a single question (one discovery_intro question = many cards)"
    - "Conditional sub-renders by currentKind ('meet'/'sound'/'music'/'ready')"
    - "Inline question.* override → fallback map → safe fallback resolution priority"
    - "REQ-04 inline traceability comments per REQ-07 (every new code block annotated)"

key-files:
  created: []
  modified:
    - "src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx"
    - "src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx"

key-decisions:
  - "Listen button gated on (pattern mode OR currentKind === 'sound') — pattern mode keeps single-card Listen visible for legacy qhq/synsyn"
  - "Pattern mode forces cardKinds = ['meet'] so isLastCard=true from start — matches today's handleGotIt(1,1) contract"
  - "Final-card primary CTA reuses legacy game.discovery.gotIt i18n key (not a new finalButton key) for translation continuity across EN+HE — only the non-final 'Next' is a new key"
  - "Existing test fixtures pinned to single 'sound' card override (cards: [{kind:'sound'}]) instead of letting CONCEPT_CARDS default expand them — keeps the 6 pre-existing audio-scheduling tests landing directly on Listen card without rewriting their assertions"
  - "Mock t() extended to resolve {defaultValue: '…'} options object (Pattern B) alongside existing positional fallback (Pattern A) — supports both i18n-call shapes used in the renderer"
  - "DURATION_INFO test mock gained 'h' entry — needed by the cardIndex-reset test that re-renders with focusDuration='h' to verify state reset"
  - "hasCompletedRef.current = false in the useEffect reset — prevents stuck-completed state when MixedLessonGame swaps to a new question within the same renderer mount"

patterns-established:
  - "Renderer-internal pagination: outer MixedLessonGame contract unchanged; pagination state lives in the renderer keyed by question identity"
  - "Inline override > concept-map default > safe fallback: question.cards?.map(c=>c.kind) || CONCEPT_CARDS[focusDuration] || ['meet']"
  - "REQ-tag traceability: every new code block carries an inline // REQ-04 comment per REQ-07 boundary discipline"

requirements-completed: [REQ-04, REQ-07]

# Metrics
duration: 23min
completed: 2026-06-02
---

# Phase 01 Plan 09: DiscoveryIntroQuestion Multi-Card Pagination Summary

**Multi-card swipable Duolingo-style scaffolding (2-4 cards per concept) lives inside one `discovery_intro` question; MixedLessonGame contract unchanged.**

## Performance

- **Duration:** ~23 min
- **Started:** 2026-06-01T23:58:00Z
- **Completed:** 2026-06-02T00:02:00Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 2

## Accomplishments

- `CONCEPT_CARDS` module-top map (12 concepts × 2-4 cards) wired into `DiscoveryIntroQuestion.jsx`
- Pagination state (`cardIndex`, `setCardIndex`, `useEffect` reset on `focusDuration` / `focusPattern.id` change) added without disturbing pattern-mode legacy
- Unified `handleNext` handler: advances cardIndex on non-final cards, completes on final card; `hasCompletedRef` re-entry guard preserved
- Listen button conditional on `currentKind === 'sound'` OR pattern mode (Unit 8 syncopation single-card path preserved)
- Primary CTA label flips `Next` (non-final) → `Got it!` (final) via legacy `game.discovery.gotIt` key
- Card progress indicator (pill + dots) with aria-progress label for multi-card flows
- All 9 new code blocks annotated `// REQ-04` per REQ-07 traceability discipline
- 5 new pagination test cases added (RED-then-GREEN TDD); 6 pre-existing audio-scheduling tests preserved via fixture pin (`cards: [{kind:'sound'}]`)
- Test mock `t()` extended to resolve `{defaultValue: '…'}` opts (Pattern B) alongside positional fallback (Pattern A)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write 5 new pagination test cases (RED)** — `a96b9d6` (test)
2. **Task 2: Extend DiscoveryIntroQuestion.jsx with multi-card pagination (GREEN)** — `0b27385` (feat)

_TDD cycle: RED (4 of 5 new failing — by design) → GREEN (11/11 passing)._

## Files Created/Modified

- `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` — multi-card pagination extension (CONCEPT_CARDS map, cardIndex state, useEffect reset, handleNext handler, conditional Listen button, label flip, progress indicator); pattern-mode (focusPattern.id) preserved verbatim per D-PATTERNS §2 preserve-list
- `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx` — 5 new pagination tests under `describe('pagination (Phase 1 v3.5 — REQ-04)')`; pre-existing fixtures pinned to `cards: [{kind:'sound'}]`; mock `t()` extended to handle `{defaultValue}` opts; DURATION_INFO mock gained `h` entry

## Decisions Made

- **Listen button gating:** rendered when `focusPatternId || currentKind === 'sound'`. Pattern mode (qhq/synsyn) MUST still show Listen on its single 'meet' card because the legacy Unit 8 syncopation tests click Listen. Honoring D-PATTERNS §2 preserve-list cleanly.
- **Final button label reuses legacy `game.discovery.gotIt` key** (not a new `game.discovery.cards.finalButton` key). Phase 03 already authored EN+HE translations for `gotIt` — no new locale work needed; only the non-final `Next` is a fresh key (`game.discovery.cards.nextButton`).
- **`hasCompletedRef.current = false` inside the useEffect reset** — without this, MixedLessonGame re-renders with a new question would inherit the previous question's completed state and prevent further pagination. Subtle but necessary safety.
- **Existing-tests fixture pin** (`make8PairQuestion = () => ({ focusDuration: '8_pair', cards: [{ kind: 'sound' }] })`). The cleanest way to preserve 6 audio-scheduling tests under the new pagination model: pin them to a single 'sound' card so they land directly on Listen. Alternatives considered (advance via clicks, mock CONCEPT_CARDS) were noisier and less semantically clear.
- **Test mock `t()` Pattern B extension** — added `if (fallback && typeof fallback === 'object' && fallback.defaultValue) return fallback.defaultValue;` so the new renderer code using `t('…', { defaultValue: 'Next' })` resolves to readable text in tests. Pattern A (`t('…', 'fallback')`) still works for legacy call sites.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] `hasCompletedRef.current = false` in pagination-reset effect**

- **Found during:** Task 2 (renderer extension)
- **Issue:** Plan's reset useEffect only reset `cardIndex` to 0 on question change. Without also clearing `hasCompletedRef.current`, a previously-completed question (e.g. final 'ready' card clicked) would leave the ref true, and the next `handleNext` call on the new question would immediately return early — pagination silently broken after the first completion in the same renderer mount.
- **Fix:** Added `hasCompletedRef.current = false;` to the reset useEffect alongside `setCardIndex(0);`.
- **Files modified:** `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx`
- **Verification:** All 11 tests pass (existing + 5 new). The cardIndex-reset test (Test 5) specifically exercises the re-render path and would have caught silent breakage.
- **Committed in:** `0b27385` (Task 2 GREEN commit)

**2. [Rule 3 - Blocking] Test mock `t()` extended to handle `{defaultValue}` opts**

- **Found during:** Task 1 (RED tests authoring)
- **Issue:** Existing mock `t: (key, fallback, _opts) => { if (typeof fallback === 'string') return fallback; return key; }` returns the i18n key as-is when fallback is the options object. New renderer calls `t('game.discovery.cards.nextButton', { defaultValue: 'Next' })` — under the existing mock that resolves to `"game.discovery.cards.nextButton"`. The regex `/next/i` happens to match that key (contains "next"), but `/got it/i` would NOT match the legacy `game.discovery.gotIt` key. Need stable, semantic test resolution.
- **Fix:** Added Pattern B branch to the mock: `if (fallback && typeof fallback === 'object' && fallback.defaultValue) return fallback.defaultValue;`. Now `t('…', { defaultValue: 'Next' })` resolves to `"Next"` and `t('game.discovery.gotIt', 'Got it!')` resolves to `"Got it!"` (Pattern A). All button-label regex assertions are now semantic, not key-matching.
- **Files modified:** `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx`
- **Verification:** All 11 tests pass.
- **Committed in:** `a96b9d6` (Task 1 RED commit)

**3. [Rule 3 - Blocking] DURATION_INFO test mock gained `h` entry**

- **Found during:** Task 1 (RED tests authoring — Test 5 "resets cardIndex when focusDuration changes")
- **Issue:** Test 5 re-renders the component with `focusDuration: 'h'`. The component looks up `DURATION_INFO['h']` to compute `info.durationUnits`, etc. The existing mock only had `8_pair`, `q`, `quarter` — `'h'` lookup returned undefined, causing the renderer's early-return guard (`if (!patternBeats && (!info || !SvgIcon)) return null;`) to fire. Test 5 would observe no rendered button at all (looking for the `next` button → throws).
- **Fix:** Added `h: { durationUnits: 8, isRest: false, i18nKey: 'rhythm.duration.half' }` and a stub `h` entry to the SVG_COMPONENTS mock.
- **Files modified:** `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx`
- **Verification:** Test 5 passes.
- **Committed in:** `a96b9d6` (Task 1 RED commit)

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 blocking)
**Impact on plan:** All three are correctness-required additions to make the planned behavior actually work end-to-end. No scope creep; engine change boundary (REQ-07) preserved — every fix is inside the planned 2 files.

## Issues Encountered

None substantive. The TDD cycle landed cleanly: RED phase confirmed 4 of 5 new tests failing as designed (Test 4 "double-fire guards" passed in RED because the existing `hasCompletedRef` guard already covered that semantics — its assertion was non-incremental); GREEN phase produced 11/11 passing in one renderer-edit pass once the three deviations above were applied.

The only minor friction was the pre-existing test mock not handling `{defaultValue}` opts (Deviation 2 above) — extending it was a one-line fix.

## TDD Gate Compliance

This plan executed the renderer change under task-level TDD per `tdd="true"` on both tasks:

- **RED gate:** `a96b9d6` — `test(01-09): add failing pagination tests for DiscoveryIntroQuestion (RED)` (5 new tests, 4 failing by design)
- **GREEN gate:** `0b27385` — `feat(01-09): extend DiscoveryIntroQuestion with multi-card pagination (GREEN)` (11/11 passing)
- **REFACTOR gate:** N/A — code landed clean in GREEN, no additional cleanup pass needed.

Plan-level `type: execute` (not `type: tdd`), but per-task TDD gates are visible in git history as a permanent audit trail.

## User Setup Required

None — pure UI renderer extension. No environment variables, no database changes, no external services.

## Next Phase Readiness

- **Plan 01-10 (paywall + migration deploy):** unblocked. The renderer ready for the unit-data plans (01-05..01-08) to emit `discovery_intro` questions with `focusDuration` matching `CONCEPT_CARDS` keys; pagination will auto-engage.
- **Hidden Unit 8 syncopation re-enable path:** preserved. Pattern mode (focusPattern.id = `qhq`/`synsyn`) still single-card. Re-enable per HIDDEN-V1 markers in `src/data/expandedNodes.js` will work without renderer changes.
- **No concerns / blockers** for Wave 3 wrap-up.

## Self-Check: PASSED

**Files verified to exist:**

- FOUND: `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx`
- FOUND: `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx`
- FOUND: `.planning/phases/01-refactor-rhythm-trail-pedagogical-ordering-restructure-units/01-09-SUMMARY.md`

**Commits verified in git log:**

- FOUND: `a96b9d6` (Task 1 RED)
- FOUND: `0b27385` (Task 2 GREEN)

**Acceptance criteria verified via grep:**

- `grep -c "const CONCEPT_CARDS" DiscoveryIntroQuestion.jsx` = 1 (≥1 ✓)
- `grep -c "cardIndex" DiscoveryIntroQuestion.jsx` = 8 (≥3 ✓)
- `grep -c "setCardIndex" DiscoveryIntroQuestion.jsx` = 3 (≥1 ✓)
- `grep -c "REQ-04" DiscoveryIntroQuestion.jsx` = 9 (≥5 ✓)
- `grep -c "focusPattern" DiscoveryIntroQuestion.jsx` = 15 (≥2 ✓)

**Test verification:**

- `npx vitest run …/DiscoveryIntroQuestion.test.jsx` → 11/11 passing (6 pre-existing + 5 new)
- `npx vitest run …/MixedLessonGame.test.jsx` (regression guard) → 10/10 passing

---

_Phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units_
_Plan: 09_
_Completed: 2026-06-02_
