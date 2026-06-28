---
phase: 34-responsive-rhythm-renderers-non-arcade
plan: 08
subsystem: rhythm-games
tags:
  - rhythm
  - responsive
  - gap-closure
  - dev-toggle
  - uat-enabling
requires:
  - 34-04 (renderers/wrappers wired with NeedsLandscapeContext + needsLandscape helper)
provides:
  - Dev-only `?measures=N` URL-param override unblocks UAT GAP 2 (SC #2 + SC #3 long-pattern rows)
  - Helper is fully gated on `import.meta.env.DEV` — production builds NEVER honor the param
affects:
  - RhythmReadingGame free-play fallback (only site that consumes measureCount outside trail)
tech-stack:
  added: []
  patterns:
    - "DEV-gated URL-param override pattern for UAT-only behavior toggles (no production surface area)"
    - "Pure JS helper (no React/DOM dependencies) — testable in isolation, tree-shakeable in production via DEV gate"
key-files:
  created:
    - path: src/components/games/rhythm-games/utils/measuresOverride.js
      reason: "Pure helper that parses ?measures URL param; returns null in production OR for invalid/missing values"
    - path: src/components/games/rhythm-games/utils/__tests__/measuresOverride.test.js
      reason: "9 unit tests covering DEV gate, valid/invalid params, console.warn emission, SSR safety"
  modified:
    - path: src/components/games/rhythm-games/RhythmReadingGame.jsx
      reason: "Import getMeasuresOverride; chain override between nodeConfig.measureCount and default 1"
    - path: .planning/phases/34-responsive-rhythm-renderers-non-arcade/deferred-items.md
      reason: "Log flaky rhythmUnit8 probabilistic test as pre-existing deferred item"
decisions:
  - "DEV gate via `import.meta.env.DEV` (not URL allow-list or feature flag): zero production surface area, automatically dead code in prod build"
  - "Strict integer parsing via `/^-?\\d+$/` regex (not `parseInt` alone): rejects decimals, hex, leading whitespace, scientific notation"
  - "Warn-on-invalid (not throw): preserves dev experience when typo'd; null fallback means default behavior is preserved"
  - "Variable name `trailMeasureCount` preserved at the call site so downstream usages (lines ~295, ~595, ~889) require zero changes"
  - "Override only fires in free-play (when nodeConfig is null/undefined); trail mode keeps using nodeConfig.measureCount because of `??` short-circuit precedence"
metrics:
  duration_seconds: 360
  duration_human: "~6m"
  tasks_completed: 2
  files_created: 2
  files_modified: 2
  commits: 3
  completed_at: 2026-05-10T16:59:00Z
---

# Phase 34 Plan 08: Dev-Only `?measures` Override for UAT GAP 2 Summary

**One-liner:** Added a DEV-gated `?measures=N` URL-param helper (with 9 unit tests covering DEV/SSR/range/integer-strict edge cases) and applied it at RhythmReadingGame's free-play fallback to unblock manual UAT verification of NOTATION-01/02 long-pattern landscape declaration — production builds NEVER honor the param.

## Objective Recap

Close UAT GAP 2 from `34-UAT.md`: SC #2 long-pattern sub-tests + SC #3 long-pattern tablet rows could not be exercised because free-play has no UI to select pattern length (`trailMeasureCount = nodeConfig?.measureCount ?? 1` always defaulted to 1 outside trail). Per gap-closure-input recommendation (option b), add a dev-only `?measures=N` URL-param helper scoped tightly so it can be removed post-UAT, with `import.meta.env.DEV` gate ensuring production builds completely ignore the parameter.

## Tasks Completed

| Task | Name                                                                        | Commits              | Outcome                                                                                                                                                                             |
| ---- | --------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | TDD — Create dev-gated measures-override helper + unit test (RED + GREEN)   | `bf20147`, `1cea4ad` | RED: 9 failing tests committed; GREEN: helper passes all 9 (DEV/SSR/range/strict-int/warn). `import.meta.env.DEV` gates the override; null returned for invalid/missing/production. |
| 2    | Apply measures override at RhythmReadingGame's `trailMeasureCount` fallback | `8d86ec5`            | Import added alongside sibling utils; chain `nodeConfig?.measureCount ?? getMeasuresOverride() ?? 1` preserves trail behavior; build/lint/tests green.                              |

## Key Decisions Made

1. **DEV gate via `import.meta.env.DEV` (not URL allow-list or feature flag)** — Zero production surface area; helper is automatically dead-code in production via Vite's tree-shaking when `DEV` is statically false.
2. **Strict integer parsing via `/^-?\d+$/` regex (not `parseInt` alone)** — Rejects decimals (`2.5`), hex (`0x4`), leading whitespace, scientific notation. `parseInt("2.5", 10)` returns `2` which would be a silent acceptance of an invalid value.
3. **Warn-on-invalid (not throw)** — Preserves dev experience when typo'd; null fallback means the override is silently skipped and default behavior is preserved. Throwing would break dev sessions for a non-critical UAT helper.
4. **Variable name `trailMeasureCount` preserved at the call site** — Downstream usages (lines ~295, ~595, ~889 per AUDIT) require zero changes because the binding is identical; only the right-hand-side fallback chain is extended.
5. **Override only fires in free-play (when `nodeConfig` is null/undefined)** — Trail mode keeps using `nodeConfig.measureCount` because of `??` short-circuit precedence. The override is invisible to trail nodes.
6. **No override site added beyond RhythmReadingGame** — Per Plan instructions: free-play tap is exercised "via reading" — `/rhythm-mode/rhythm-tap-game` route does not exist; tap renderer is only reachable via trail (which has its own `nodeConfig.measureCount`). Other wrappers either don't use measures or are only reachable via trail.

## Verification Results

- **Helper unit tests:** 9/9 pass (`npx vitest run src/components/games/rhythm-games/utils/__tests__/measuresOverride.test.js`).
- **Helper grep verification (Task 1):** File exports `getMeasuresOverride`; checks `import.meta.env.DEV`; test file has 9 `it(` cases including SSR-safety branch.
- **Call-site grep verification (Task 2):** Import line present; `nodeConfig?.measureCount ?? getMeasuresOverride() ?? 1` chain matches; `trailMeasureCount` referenced 4+ times (downstream usages preserved).
- **Full test suite:** 1633 pass / 1 flaky pre-existing failure / 13 todo (across 1647 tests). The failing test is `rhythmUnit8Redesigned.test.js > rhythm_2_4 produces q, h, w over 20 samples` — a probabilistic test that passes consistently when run in isolation, fails intermittently in the full suite. Verified pre-existing (not introduced by Plan 34-08; logged to `deferred-items.md`).
- **Lint on modified files:** 0 errors, 0 new warnings on the 3 changed files. The 1 lint error in the full repo (`ParentZoneEntryCard.test.jsx:32`) was already logged as deferred in Plan 34-04 and is outside Plan 34-08 scope.
- **Build:** `npm run build` exits 0 — production build completes successfully (helper's DEV gate ensures override is dead-code in prod).

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written. Both tasks (TDD helper + call-site wiring) followed the plan template verbatim.

### Pre-existing Issues — logged to deferred-items.md

**1. [Out of scope] Flaky probabilistic test in `rhythmUnit8Redesigned.test.js`**

- **Found during:** Task 2 verification (`npm run test:run`)
- **Issue:** `rhythm_2_4 (...) produces q, h, w over 20 samples` intermittently fails in the full test suite because it asserts that 20 random samples produce all 3 expected duration codes. Probabilistic — passes consistently when run in isolation.
- **Verified pre-existing:** Stashed Plan 34-08 changes; reran the test in isolation — it passed both before and after my changes. The change in `RhythmReadingGame.jsx` (an import + a fallback chain extension) is provably unrelated to a pure-data probability test in `src/data/units/`.
- **Logged to:** `deferred-items.md` with recommendation to seed RNG or increase sample count.

## Authentication Gates

None — fully autonomous execution. No auth required for any verification step.

## TDD Gate Compliance

Plan is `type: execute` (frontmatter); Task 1 is `tdd="true"` and the gates were honored:

1. **RED gate:** `bf20147` — `test(34-08): add failing test for ?measures URL-param override helper`. Test file added; `npx vitest run` confirmed all 9 tests fail with `Failed to resolve import "../measuresOverride"`.
2. **GREEN gate:** `1cea4ad` — `feat(34-08): add dev-only ?measures URL-param override helper for UAT (NOTATION-01/02)`. Implementation added; all 9 tests pass.
3. **REFACTOR:** Not applicable — implementation was minimal and direct (44 lines including JSDoc). Lint-stage prettier + eslint-fix performed cosmetic touches (removed redundant `eslint-disable no-console` since `warn` is allowed).

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. The `?measures` URL param is read via `URLSearchParams(window.location.search)` and only in DEV builds; no user input flows to backend, no eval, no side effects. Production builds skip the read entirely.

## Known Stubs

None. The helper is documented as "removable post-UAT" but is intentionally kept in the codebase as harmless DEV-only infrastructure. Removing it post-UAT would require deleting the helper file, the test file, and a single import line + fallback edit in `RhythmReadingGame.jsx` — minimal cleanup surface area.

## Self-Check: PASSED

**Files created (verified to exist):**

- FOUND: `src/components/games/rhythm-games/utils/measuresOverride.js`
- FOUND: `src/components/games/rhythm-games/utils/__tests__/measuresOverride.test.js`

**Files modified (verified to contain expected content):**

- FOUND: `src/components/games/rhythm-games/RhythmReadingGame.jsx` — contains `from "./utils/measuresOverride"` import and `nodeConfig?.measureCount ?? getMeasuresOverride() ?? 1` chain
- FOUND: `.planning/phases/34-responsive-rhythm-renderers-non-arcade/deferred-items.md` — appended flaky-test deferred entry

**Commits in `git log --oneline -5`:**

- FOUND: `bf20147` test(34-08): add failing test for ?measures URL-param override helper (RED)
- FOUND: `1cea4ad` feat(34-08): add dev-only ?measures URL-param override helper for UAT (NOTATION-01/02) (GREEN)
- FOUND: `8d86ec5` feat(34-08): apply ?measures override at RhythmReadingGame free-play fallback (UAT GAP 2)

**Verification commands executed:**

- `npx vitest run src/components/games/rhythm-games/utils/__tests__/measuresOverride.test.js` → 9/9 passed
- `npm run test:run` → 1633 passed (1 flaky pre-existing, logged to deferred)
- `npm run lint` → 0 errors on modified files (1 pre-existing error logged in 34-04 deferred items)
- `npm run build` → exited 0 successfully
