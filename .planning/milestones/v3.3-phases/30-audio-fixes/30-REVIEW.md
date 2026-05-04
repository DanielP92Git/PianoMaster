---
phase: 30-audio-fixes
reviewed: 2026-04-13T12:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx
  - src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx
  - src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx
  - src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 30: Code Review Report

**Reviewed:** 2026-04-13T12:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed two new MixedLessonGame renderer components (DiscoveryIntroQuestion and RhythmDictationQuestion) and their test suites. Both components follow established project patterns well -- glassmorphism styling, audio engine integration, and the `onComplete(score, total)` contract. No security issues found. Three warnings identified: a wrong mock path in one test file that could cause test fragility, hardcoded array lengths that assume exactly 3 choices, and an unused import. Two minor info-level items around code clarity.

## Warnings

### WR-01: Incorrect vi.mock path for useMotionTokens in RhythmDictation test

**File:** `src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx:54`
**Issue:** The mock path `"../../../../utils/useMotionTokens"` resolves from `__tests__/` to `src/components/utils/useMotionTokens`, which is incorrect. The actual module is at `src/utils/useMotionTokens`. The sibling test for DiscoveryIntroQuestion correctly uses `"../../../../../utils/useMotionTokens"` (5 levels, not 4). If Vitest fails to intercept the real module, the test could break in environments where `useMotionTokens` accesses browser-only APIs (e.g., `window.matchMedia`).
**Fix:**

```javascript
// Line 54: change from
vi.mock("../../../../utils/useMotionTokens", () => ({
// to
vi.mock("../../../../../utils/useMotionTokens", () => ({
```

### WR-02: Hardcoded 3-element cardStates array assumes exactly 3 choices

**File:** `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx:69`
**Issue:** `cardStates` is initialized as `["default", "default", "default"]` and feedback logic (lines 154, 165) creates `["dimmed", "dimmed", "dimmed"]`. However, `choices` comes from `question?.choices || []` and could have any number of elements. If a question ever has 2 or 4+ choices, card states will be misaligned -- extra choices would have `undefined` state, and fewer choices would waste array slots. The `DictationChoiceCard` receives `cardStates[idx]` which would be `undefined` for out-of-bounds indices.
**Fix:**

```javascript
// Line 69: derive length from choices
const [cardStates, setCardStates] = useState(() =>
  Array(choices.length || 3).fill("default")
);

// Lines 154 and 165: use dynamic length
const newStates = Array(choices.length).fill("dimmed");
```

### WR-03: Unused import and variable -- useMotionTokens / reducedMotion

**File:** `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx:19,41`
**Issue:** `useMotionTokens` is imported (line 19) and destructured to `reducedMotion` (line 41), but `reducedMotion` is never referenced anywhere in the component's JSX or logic. This is dead code that adds an unnecessary hook call on every render.
**Fix:**

```javascript
// Remove line 19:
// import { useMotionTokens } from "../../../../utils/useMotionTokens";

// Remove line 41:
// const { reduce: reducedMotion } = useMotionTokens();
```

Also remove the corresponding `vi.mock` for `useMotionTokens` in the test file (line 54-58) if the import is removed from the source.

## Info

### IN-01: Redundant i18nKey transformation in DiscoveryIntroQuestion

**File:** `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx:37`
**Issue:** The expression ``t(`rhythm.duration.${info.i18nKey?.split(".").pop()}`, info.i18nKey)`` splits the i18nKey on "." to get the last segment, then re-prepends `rhythm.duration.` -- reconstructing the exact same key. For example, `info.i18nKey = "rhythm.duration.quarter"` produces `.pop()` = `"quarter"`, then the template builds `"rhythm.duration.quarter"`. This is functionally correct but unnecessarily complex.
**Fix:**

```javascript
const durationName = info ? t(info.i18nKey) : "";
```

### IN-02: Test uses array index as key for DictationChoiceCard rendering

**File:** `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx:235`
**Issue:** `key={idx}` uses the array index as the React key for `DictationChoiceCard` elements. Since the choices array is stable per question (not reordered), this is acceptable and will not cause rendering issues. However, if choices were ever shuffled or reordered between renders, this could lead to stale state in child components.
**Fix:** No action needed for current usage. If choice reordering is added later, consider a content-based key.

---

_Reviewed: 2026-04-13T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
