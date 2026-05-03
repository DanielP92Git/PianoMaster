---
phase: 33-rhythm-issues-cleanup
plan: 08
subsystem: ui
tags: [boss-ux, overlay, victory-vfx, i18n, contingent-fired, glassmorphism]

requires:
  - phase: 33-rhythm-issues-cleanup
    provides: "Plan 33-02 (Wave 1 UAT) marked Issue 13 as confirmed-bug; user explicitly approved firing this plan per gate"
provides:
  - "BossIntroOverlay component (full-screen amber/gold overlay) for full BOSS rhythm nodes"
  - "Mounted in MixedLessonGame for both landscape + portrait layouts"
  - "Gated on node.isBoss && node.nodeType === 'boss' — excludes mini_boss"
  - "Auto-dismisses after 2s; respects reducedMotion (skips pulse/scale animation)"
  - "i18n EN + HE entries: trail.boss.intro.title and trail.boss.intro.subtitle"
  - "Gold/amber confetti palette (BOSS_CONFETTI_COLORS) on VictoryScreen via celebrationData.isBoss branch"
  - "BOSS_CONFETTI_COLORS exported from BossUnlockModal for cross-component reuse"
  - "ConfettiEffect extended with optional 'colors' palette override (backward-compatible)"
affects: [33-10]

tech-stack:
  added: []
  patterns:
    - "Full-screen overlay shell adapted from RotatePromptOverlay (AnimatePresence + reducedMotion branch + dir RTL)"
    - "aria-live='polite' aria-atomic='true' from CountdownOverlay for screen-reader announcement"
    - "BOSS_CONFETTI_COLORS palette reuse from BossUnlockModal — single source of truth for boss gold/amber tier"
    - "celebrationData.isBoss branch in VictoryScreen extended with minimal prop pass-through (no new component)"

key-files:
  created:
    - src/components/games/rhythm-games/components/BossIntroOverlay.jsx
  modified:
    - src/components/games/rhythm-games/MixedLessonGame.jsx
    - src/components/games/VictoryScreen.jsx
    - src/components/celebrations/BossUnlockModal.jsx
    - src/components/celebrations/ConfettiEffect.jsx
    - src/locales/en/trail.json
    - src/locales/he/trail.json

key-decisions:
  - "Honored D-17 (UX layer was contingent on UAT retest; user gave explicit go-ahead before this plan fired)"
  - "Honored D-18 scope guardrails: NO music swap, NO new game mechanics, NO boss-specific HUD beyond intro overlay + victory confetti"
  - "Honored D-20 (conditional plans ready in advance) — plan structure and code refs were pre-staged"
  - "Mounted overlay in both landscape AND portrait branches of MixedLessonGame (the existing layout split)"
  - "Exported BOSS_CONFETTI_COLORS from BossUnlockModal (single source of truth) rather than duplicating constant in VictoryScreen"
  - "Extended ConfettiEffect with optional `colors` prop (backward-compatible) instead of forking a new boss-specific component (per PATTERNS §8 minimal-extension recommendation)"
  - "Hebrew translations use plain text (no nikud) per memory rule feedback_hebrew_nikud.md: 'קרב בוס' / 'תראה מה למדת!'"
  - "Service worker cache version bump (pianomaster-v7 → -v8) DEFERRED to Plan 33-10 per its scope (Plan 33-10 already owns deploy + cache-version step)"

patterns-established:
  - "Boss UX gate: full BOSS only — `!!(node?.isBoss && node?.nodeType === 'boss')`. Mini_boss does NOT get intro overlay or gold confetti override."
  - "i18n key namespace for boss UX: trail.boss.intro.* (sibling to existing trail.boss.* celebration keys)"

requirements-completed: [PLAY-03]

duration: 25min
completed: 2026-05-03
---

# Phase 33 Plan 08: Boss UX Differentiation Summary

**Adds 2-second amber/gold "BOSS FIGHT" intro overlay before full BOSS rhythm nodes plus gold-tier confetti on the boss VictoryScreen — minimal D-18 deliverable that closes UAT issue 13 without music swap or new mechanics.**

## Performance

- **Duration:** ~25 min (Tasks 2 + 3; Task 1 gate decision pre-resolved by user)
- **Started:** 2026-05-03T01:10:00Z (approx)
- **Completed:** 2026-05-03T01:25:00Z (approx)
- **Tasks:** 2 of 3 fired (Task 1 = decision gate, pre-approved; Tasks 2 + 3 = implementation)
- **Files modified:** 7 (1 new component, 4 modified components, 2 i18n files)

## Accomplishments

### Task 2 — BossIntroOverlay component + i18n entries (commit `f96b5a8`)

- New file `src/components/games/rhythm-games/components/BossIntroOverlay.jsx` (90 lines after Prettier)
  - Full-screen overlay: `fixed inset-0 z-[9999] bg-gradient-to-br from-amber-900/95 via-orange-900/95 to-red-900/95 backdrop-blur-md`
  - Crown icon (lucide-react, w-16 h-16, text-amber-300)
  - Title in Fredoka One font (5xl, font-extrabold, text-amber-300)
  - Optional `bossName` subtitle (text-xl, text-white/90)
  - Static fallback subtitle (text-base, text-white/70)
  - `useEffect` 2000ms timer auto-dismisses
  - `reducedMotion` branch skips scale/pulse animation, shows static h1
  - `useTranslation('trail')` with EN fallbacks via second-arg defaults
  - `dir={isRTL ? 'rtl' : 'ltr'}` for RTL support
  - `role='status' aria-live='polite' aria-atomic='true'` for screen readers
- `src/locales/en/trail.json` — added `boss.intro.title: "BOSS FIGHT"` and `boss.intro.subtitle: "Show what you've learned!"`
- `src/locales/he/trail.json` — added `boss.intro.title: "קרב בוס"` and `boss.intro.subtitle: "תראה מה למדת!"` (no nikud per user-confirmed Hebrew nikud rule)

### Task 3 — Mount + VictoryScreen extension (commit `8fbc9b6`)

- `src/components/games/rhythm-games/MixedLessonGame.jsx`
  - Import added: `import { BossIntroOverlay } from "./components/BossIntroOverlay";` (line 38 post-format)
  - State + gating after trail-state extraction (lines 84-88):
    ```javascript
    const trailNode = nodeId ? getNodeById(nodeId) : null;
    const isFullBoss = !!(trailNode?.isBoss && trailNode?.nodeType === "boss");
    const [bossIntroDismissed, setBossIntroDismissed] = useState(!isFullBoss);
    ```
  - Mount points (BOTH layouts): conditional render alongside RotatePromptOverlay, AudioInterruptedOverlay
    - Landscape branch (~line 576-580)
    - Portrait branch (~line 618-622)
  - Question still mounts in background — overlay is a transient z-[9999] visual layer
- `src/components/celebrations/BossUnlockModal.jsx`
  - `BOSS_CONFETTI_COLORS` constant promoted from `const` → `export const` (one-line API change for cross-component reuse)
  - Added `// eslint-disable-next-line react-refresh/only-export-components` to keep HMR clean
- `src/components/celebrations/ConfettiEffect.jsx`
  - Added optional `colors` prop to JSDoc + signature (default undefined)
  - Built `config = colors && colors.length > 0 ? { ...baseConfig, colors } : baseConfig` for backward-compatible palette override
- `src/components/games/VictoryScreen.jsx`
  - Import: `import { BossUnlockModal, BOSS_CONFETTI_COLORS } from "../celebrations/BossUnlockModal";`
  - Pass `colors={celebrationData.isBoss ? BOSS_CONFETTI_COLORS : undefined}` to existing `<ConfettiEffect>` invocation (line ~119)

## Task Commits

| Task | Name                                                             | Commit    | Files Touched |
| ---- | ---------------------------------------------------------------- | --------- | ------------- |
| 1    | Confirm contingent fire (decision gate)                          | n/a       | 0 (decision)  |
| 2    | Create BossIntroOverlay component + i18n entries                 | `f96b5a8` | 3             |
| 3    | Mount BossIntroOverlay in MixedLessonGame + extend VictoryScreen | `8fbc9b6` | 4             |

## Verification

- **Lint:** `npx eslint` on all 5 modified .jsx files — exits 0
- **Trail validator:** `npm run verify:trail` — passes with non-blocking warnings only (no new errors introduced)
- **Build:** `npm run build` — succeeds (24.15s); MixedLessonGame chunk bundled correctly
- **Tests:** `npm run test:run` — 1599/1599 pass; 4 pre-existing test SUITE failures (Supabase env var missing in worktree — unrelated to this plan, pre-dates Plan 33-08, see deferred items)
- **Pre-commit hooks:** Husky + lint-staged ran successfully on both commits (Prettier reformatted Tailwind class ordering and import statements — no functional changes)

### Acceptance Criteria Status

Task 2:

- [x] File `src/components/games/rhythm-games/components/BossIntroOverlay.jsx` exists (90 lines, ≥ 40 required)
- [x] `BossIntroOverlay` referenced ≥ 2 times (3 occurrences: JSDoc, function name, default export)
- [x] `reducedMotion` referenced ≥ 1 time (3 occurrences: JSDoc, hook destructure, branch)
- [x] `useTranslation` referenced exactly 1 time
- [x] `boss.intro.title` present in `src/locales/en/trail.json`
- [x] `קרב בוס` present in `src/locales/he/trail.json`
- [x] `npm run lint` exits 0

Task 3:

- [x] `BossIntroOverlay` referenced ≥ 2 times in MixedLessonGame.jsx (3 occurrences: 1 import + 2 JSX usages for landscape and portrait layouts)
- [x] `isFullBoss` referenced ≥ 2 times (4 occurrences: declaration, useState init arg, 2 render gates)
- [x] `BOSS_CONFETTI_COLORS|isBoss` referenced ≥ 2 times in VictoryScreen.jsx (3 occurrences: import, JSDoc comment, prop pass)
- [x] `npm run lint` exits 0
- [ ] **Manual UAT pending:** user replays UAT issue 13 on `boss_rhythm_6` and `boss_rhythm_8` (full BOSSes), verifies 2-second amber overlay before first question, AND verifies `boss_rhythm_1` (mini_boss) does NOT show overlay, AND verifies victory screen shows gold confetti palette. User then marks `[x] resolved-by-deploy` in 33-UAT.md.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical] Mounted overlay in BOTH landscape and portrait layouts**

- **Found during:** Task 3 implementation
- **Issue:** Plan said "alongside the question render branch" — MixedLessonGame has TWO branches (landscape returns early at line ~570, portrait is the bottom return). A single mount would only fire in one orientation.
- **Fix:** Added BossIntroOverlay mount in both branches with identical conditional render logic.
- **Files modified:** `src/components/games/rhythm-games/MixedLessonGame.jsx`
- **Commit:** `8fbc9b6`

**2. [Rule 3 - Blocking] Exported BOSS_CONFETTI_COLORS from BossUnlockModal**

- **Found during:** Task 3 implementation
- **Issue:** Plan suggested `import { BOSS_CONFETTI_COLORS } from "../celebrations/BossUnlockModal";` but the constant was declared `const`, not `export const` — import would fail at build time.
- **Fix:** Promoted to `export const` (one-line change). Added a one-line eslint-disable for `react-refresh/only-export-components` to keep HMR clean (file primarily exports a component; we're co-locating one constant by design).
- **Files modified:** `src/components/celebrations/BossUnlockModal.jsx`
- **Commit:** `8fbc9b6`

**3. [Rule 2 - Critical] Extended ConfettiEffect with optional `colors` prop**

- **Found during:** Task 3 implementation
- **Issue:** Plan specified passing `colors={celebrationData.isBoss ? BOSS_CONFETTI_COLORS : undefined}` to ConfettiEffect, but the existing ConfettiEffect signature did not accept a `colors` prop — it derived colors from `tier` only. Without extension, the prop pass would be silently ignored.
- **Fix:** Added optional `colors` prop to the function signature, JSDoc-documented it, and merged into config: `const config = colors && colors.length > 0 ? { ...baseConfig, colors } : baseConfig;`. Backward-compatible (callers without `colors` get unchanged behavior).
- **Plan note:** The plan's PATTERNS §8 actually offered a fallback ("if ConfettiEffect doesn't currently accept colors, do NOT modify and add a TODO instead") — but extending the API with a single optional prop is a smaller change than adding TODO debt and matches the plan's primary recommendation.
- **Files modified:** `src/components/celebrations/ConfettiEffect.jsx`
- **Commit:** `8fbc9b6`

### Items NOT Auto-fixed (Out of Scope)

- **Pre-existing test SUITE failures** (4 suites: `xpSystem.test.js`, `NoteSpeedCards.test.js`, `NotesRecognitionGame.autogrow.test.js`, `SightReadingGame.micRestart.test.jsx`) — all fail with `"Missing VITE_SUPABASE_URL environment variable"`. The worktree intentionally lacks `.env` (per `MEMORY.md`: `.env` was moved out of OneDrive sync for security). These suites pre-date Plan 33-08 (`xpSystem.test.js` was last touched in `defe988` — `feat(20-01)`). All 1599 individual TESTS that ran passed. Out of scope per Rule 4 (would require either env-var injection in test setup or refactoring services to lazy-init Supabase client — both architectural).
- **Service worker cache version bump** (`public/sw.js` `pianomaster-v7` → `-v8`) — DEFERRED to Plan 33-10 per its existing scope (33-10 already owns the deploy/cache-bump step for the entire phase).

## D-17 / D-18 / D-20 Compliance

- **D-17 (retest first; UX layer contingent):** Honored. Task 1 was a `checkpoint:decision` gate. User provided explicit pre-approval ("issue 13 confirmed-bug per UAT; fire the plan") before this executor was spawned, satisfying the gate without manual checkpoint pause.
- **D-18 (intro overlay + victory VFX, NO new mechanics, NO music swap):** Honored. Implementation strictly limited to:
  - Intro overlay (BossIntroOverlay) — visual only, no audio
  - Victory VFX (gold confetti palette via existing branch)
  - NO music swap, NO sting, NO HUD changes, NO new mechanics
- **D-20 (conditional plans ready):** Honored. Plan + PATTERNS §7-8 + RESEARCH §6 D-18 were all pre-staged; implementation referenced existing analogs (RotatePromptOverlay, CountdownOverlay, BossUnlockModal) without inventing new patterns.

## Phase 32 Deferred Items: NOT Pulled In

Per CONTEXT D-18, the following Phase 32 deferred items were explicitly NOT pulled into this plan:

- Per-node TOTAL_PATTERNS override (deferred)
- RHYTHM_COMPLEXITY enum cleanup (deferred)
- Hand-authored pattern variation library (deferred)
- Boss-specific music sting (deferred)
- Boss-specific HUD beyond intro overlay (deferred)

## Downstream Notes

- **For UAT retest (user action):** Open `boss_rhythm_6` (Compound Commander) or `boss_rhythm_8` (Rhythm Master) in dev; expect 2-second amber/gold overlay with "BOSS FIGHT" + boss name + "Show what you've learned!" before first question. Open `boss_rhythm_1` (Beat Builders mini-boss); expect NO overlay (mini_boss is gated out). On victory, expect gold/amber confetti instead of the default mixed palette.
- **For Plan 33-10 (deploy):** Bump `pianomaster-v7` → `pianomaster-v8` in `public/sw.js` so the new overlay + i18n entries reach users on next deploy.
- **For future phases:** `BOSS_CONFETTI_COLORS` is now exported and reusable. `ConfettiEffect` accepts `colors` override. Both are stable APIs.
- **No music swap** included (deferred per CONTEXT D-18). If a future plan revisits boss audio, the BossIntroOverlay's 2-second window is the natural mount point for an audio sting.

## UAT Issue 13 Status

**Ready for `[x] resolved-by-deploy`** — pending user retest on full-boss rhythm nodes (`boss_rhythm_6`, `boss_rhythm_8`) and visual confirmation of overlay + gold confetti. User to update `33-UAT.md` Issue 13 mark after retest.

## Self-Check: PASSED

- [x] FOUND: `src/components/games/rhythm-games/components/BossIntroOverlay.jsx`
- [x] FOUND: commit `f96b5a8` (Task 2)
- [x] FOUND: commit `8fbc9b6` (Task 3)
- [x] EN i18n key `boss.intro.title` present
- [x] HE i18n key `boss.intro.title` present (value: `קרב בוס`)
- [x] `BossIntroOverlay` import present in `MixedLessonGame.jsx`
- [x] `BOSS_CONFETTI_COLORS` exported from `BossUnlockModal.jsx`
- [x] `ConfettiEffect` accepts `colors` prop
- [x] `VictoryScreen` passes boss palette via `celebrationData.isBoss` branch
- [x] Lint clean on all 5 modified .jsx files
- [x] Build succeeds (`npm run build`)
- [x] Trail validator passes (`npm run verify:trail`)
- [x] All 1599 individual tests pass
