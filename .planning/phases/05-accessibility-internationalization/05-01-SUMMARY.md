---
phase: 05-accessibility-internationalization
plan: 01
subsystem: orientation-prompt
tags: [accessibility, i18n, rtl, aria, reduced-motion]
dependency_graph:
  requires:
    - AccessibilityContext (reducedMotion state)
    - i18next (translation hooks, RTL detection)
    - locale files (en/common.json, he/common.json)
  provides:
    - Fully accessible rotate prompt overlay
    - Translated rotate prompt (EN/HE)
    - RTL-aware rotate prompt layout
  affects:
    - All game routes that display rotate prompt
    - Users with reduced motion preference
    - Hebrew-language users
tech_stack:
  added: []
  patterns:
    - ARIA live regions for screen reader announcements
    - Conditional rendering based on accessibility preferences
    - RTL layout with dir attribute from i18n.dir()
    - useTranslation hook for all UI text
key_files:
  created: []
  modified:
    - src/locales/en/common.json
    - src/locales/he/common.json
    - src/components/orientation/RotatePromptOverlay.jsx
decisions:
  - Kept useMotionTokens for overlay fade transition (already respects reduced motion)
  - Used AccessibilityContext.reducedMotion for conditional phone icon rendering (static vs animated)
  - Placed ARIA live region as first child for immediate screen reader monitoring
  - Used sr-only class (Tailwind utility) for visually hidden screen reader content
metrics:
  duration_minutes: 2
  tasks_completed: 2
  files_modified: 3
  lines_changed: 92
  completed_at: 2026-02-16T17:23:58Z
---

# Phase 05 Plan 01: Accessible & Translated Rotate Prompt Summary

**One-liner:** Integrated RotatePromptOverlay with AccessibilityContext, i18next, and RTL support—all text translated (EN/HE), ARIA live regions for screen readers, and conditional animation based on reducedMotion preference.

## Tasks Completed

### Task 1: Add rotatePrompt translation keys to EN and HE locale files
- **Commit:** `71039f7`
- **Duration:** ~1 min
- **Changes:**
  - Added `rotatePrompt` object to `src/locales/en/common.json`
  - Added `rotatePrompt` object to `src/locales/he/common.json`
  - Keys: `title`, `description`, `dismissButton`, `screenReaderAnnouncement`
- **Verification:** JSON parsed successfully, all keys confirmed present
- **Files:** `src/locales/en/common.json`, `src/locales/he/common.json`

### Task 2: Update RotatePromptOverlay with reducedMotion, ARIA, i18n, and RTL support
- **Commit:** `1050d8b`
- **Duration:** ~1 min
- **Changes:**
  - Added `useAccessibility()` hook import and usage
  - Added `useTranslation()` hook import and usage
  - Added `const isRTL = i18n.dir() === "rtl"` for RTL detection
  - Added `dir={isRTL ? "rtl" : "ltr"}` to outermost motion.div
  - Added ARIA live region as first child: `<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">`
  - Replaced hardcoded English strings with `t()` calls:
    - `"Turn Your Phone Sideways!"` → `{t("rotatePrompt.title")}`
    - `"Games work best when your phone is sideways"` → `{t("rotatePrompt.description")}`
    - `"Play anyway"` → `{t("rotatePrompt.dismissButton")}`
  - Added conditional rendering for phone icon animation:
    - `reducedMotion = true` → static `<Smartphone>` icon (no motion.div wrapper)
    - `reducedMotion = false` → animated `<motion.div>` with rotate keyframes
  - Added `aria-label={t("rotatePrompt.dismissButton")}` to dismiss button
  - Kept `useMotionTokens()` for overlay fade transition (already respects reduced motion internally)
- **Verification:**
  - Build passed (31.86s)
  - 8 pattern matches found (useAccessibility, useTranslation, aria-live, reducedMotion, i18n.dir)
  - No new lint errors
- **Files:** `src/components/orientation/RotatePromptOverlay.jsx`

## Requirements Satisfied

All Phase 05 requirements (A11Y-01 through A11Y-05) are now satisfied for the RotatePromptOverlay component:

- **A11Y-01 (Reduced Motion):** Phone icon animation is gated by `reducedMotion` preference—shows static icon when enabled, animated when disabled.
- **A11Y-02 (ARIA Live Regions):** ARIA live region with `role="status"` and `aria-live="polite"` announces rotate prompt to screen readers immediately on mount.
- **A11Y-03 (WCAG 1.3.4 Escape Hatch):** "Play anyway" button (now translated) allows users to dismiss prompt and play in portrait mode.
- **A11Y-04 (Internationalization):** All user-facing text comes from `t()` function with keys in both `en/common.json` and `he/common.json`.
- **A11Y-05 (RTL Support):** Overlay has `dir` attribute set based on `i18n.dir()`, enabling proper RTL layout for Hebrew.

## Deviations from Plan

**None** — Plan executed exactly as written.

## Technical Details

### Accessibility Integration
- **reducedMotion preference:** Sourced from `AccessibilityContext.reducedMotion`
- **Conditional rendering pattern:** `{reducedMotion ? <StaticIcon /> : <AnimatedIcon />}`
- **Screen reader support:** ARIA live region with `sr-only` class (Tailwind utility for visually hidden content)
- **Live region placement:** First child in overlay to ensure screen readers monitor it immediately on mount

### Internationalization Integration
- **Translation hook:** `const { t, i18n } = useTranslation("common")`
- **RTL detection:** `const isRTL = i18n.dir() === "rtl"`
- **dir attribute:** Applied to outermost `motion.div` container
- **Translation keys:** `rotatePrompt.title`, `rotatePrompt.description`, `rotatePrompt.dismissButton`, `rotatePrompt.screenReaderAnnouncement`

### Motion Token Usage
- **Overlay fade:** Uses `useMotionTokens().fade` for entrance/exit transition
- **Fade token behavior:** Automatically returns `{ duration: 0 }` when `reducedMotion` is true (handled internally by useMotionTokens)
- **Phone icon animation:** Separate conditional rendering based on `AccessibilityContext.reducedMotion` for finer control

## Testing Verification

- ✅ Build passed without errors
- ✅ JSON locale files parse correctly
- ✅ All translation keys present in both EN and HE files
- ✅ Component contains all required patterns (8 matches)
- ✅ No new lint errors introduced
- ✅ Pre-existing lint warnings unchanged

## Next Steps

Phase 05 Plan 01 is complete. The RotatePromptOverlay is now fully integrated with:
- Accessibility system (reduced motion preference)
- Screen reader support (ARIA live regions)
- Internationalization (English/Hebrew translations)
- RTL layout mirroring (Hebrew)
- WCAG 1.3.4 compliance (escape hatch button)

All Phase 05 requirements for the rotate prompt overlay are satisfied. The component is ready for milestone v1.6 ship.

## Self-Check: PASSED

### Created Files
All translation keys and component modifications verified:
```bash
✓ FOUND: src/locales/en/common.json (rotatePrompt keys present)
✓ FOUND: src/locales/he/common.json (rotatePrompt keys present)
✓ FOUND: src/components/orientation/RotatePromptOverlay.jsx (all integrations present)
```

### Commits
```bash
✓ FOUND: 71039f7 (feat(05-01): add rotatePrompt translation keys to EN and HE locales)
✓ FOUND: 1050d8b (feat(05-01): integrate a11y, i18n, and RTL support in RotatePromptOverlay)
```

### Pattern Verification
```bash
✓ FOUND: useAccessibility (2 occurrences)
✓ FOUND: useTranslation (2 occurrences)
✓ FOUND: aria-live (1 occurrence)
✓ FOUND: reducedMotion (3 occurrences)
✓ FOUND: i18n.dir (1 occurrence)
```

### Build Verification
```bash
✓ npm run build: PASSED (31.86s)
✓ JSON validation: PASSED (both locale files)
✓ Translation keys: VERIFIED (all 4 keys present in EN and HE)
```

All artifacts verified. Plan execution complete.
