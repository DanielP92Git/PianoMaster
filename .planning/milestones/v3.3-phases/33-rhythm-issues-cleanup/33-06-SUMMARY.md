---
phase: 33-rhythm-issues-cleanup
plan: 06
subsystem: rhythm-games
tags:
  [
    rhythm,
    pattern-resolution,
    arcade-rhythm,
    tag-resolver,
    duration-filter,
    variety-rule,
  ]

# Dependency graph
requires:
  - phase: 33-rhythm-issues-cleanup-02
    provides: Plan 33-02 wave-1 baseline (validateTrail green, no upstream blockers for D-09)
  - phase: 32-game-design-differentiation
    provides: TOTAL_PATTERNS=8 (D-01), lastPatternRef no-consecutive-identical dedup (D-02), cumulative patternTags + patternTagMode "any" on boss nodes
  - phase: 25-mixed-lesson-engine
    provides: resolveByTags / resolveByAnyTag tag-based pattern resolution path (proven in MixedLessonGame)
provides:
  - D-09 central duration filter applied inside resolveByTags AND resolveByAnyTag (vex output ⊆ node.durations)
  - ArcadeRhythmGame migrated to tag-based resolver (resolveByTags primary path; getPattern fallback retained when patternTags empty)
  - D-10 per-session duration coverage rule (seenDurationsRef + patternIndexRef force re-roll for missing duration coverage near end of session)
  - Plan 33-09 (D-19 cumulative speed-pool tags) unblocked — OLD getPattern path no longer prevents tag-based resolution from taking effect for ArcadeRhythmGame
affects: [33-07, 33-08, 33-09, future-rhythm-games]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Resolver-layer duration filter: vex.every((d) => durations.includes(d)) — single source of truth for tag-vs-duration drift detection"
    - "Per-session ref-based coverage: seenDurationsRef Set tracks vexDurations across pattern picks; patternIndexRef tracks slot index"
    - "Additive migration: new tag-based path runs alongside legacy getPattern; selection by patternTags.length > 0; both mocked separately in tests"

key-files:
  created: []
  modified:
    - src/data/patterns/RhythmPatternGenerator.js
    - src/components/games/rhythm-games/ArcadeRhythmGame.jsx
    - src/components/games/rhythm-games/ArcadeRhythmGame.test.js

key-decisions:
  - "Stash apply approach: Option A (reference-only fresh edit). Stash@{0} preserved intact — all 5 chunks (A/B/C/D/E) remain stashed; only Chunk A semantics were re-implemented as a fresh edit per user approval."
  - "D-09 filter inserted inside both resolvers (NOT wrapping them) — mirrors the existing rest-filter precedent at the same insertion point in each resolver."
  - "D-10 implementation chose rejection-sample-then-fill: per-session refs accumulate vexDurations; force re-roll only when remainingSlots <= missing.length AND candidate.vexDurations doesn't cover any missing duration. Bounded by MAX_VARIETY_RETRIES (3)."
  - "D-10 only active when result.vexDurations is available (tag-based path). The getPattern fallback returns vexDurations: null and the coverage check is skipped — preserves legacy behavior for free-play / untagged nodes."
  - "OLD getPattern import retained as fallback for backward compatibility when nodeConfig has no patternTags (free-play, legacy non-trail nodes). This is additive, not destructive — Stash Chunk A salvage."
  - "binaryToVexDurations is invoked twice per match (once in D-09 filter, once when constructing return object). No caching added per PATTERNS §4 guidance ('Acceptable — pure function, small inputs')."

patterns-established:
  - "Central resolver-layer duration filter (D-09): protects pulse, dictation, reading, and tap simultaneously by catching tag-vs-duration drift at the resolution layer rather than per-game."
  - "Session-level ref-based coverage (D-10): seenDurationsRef + patternIndexRef pattern extends ArcadeRhythmGame's existing lastPatternRef D-02 dedup topology with per-duration coverage. Reusable for future variety rules."
  - "Additive resolver migration: keep legacy resolver as fallback when new resolver's prerequisites (e.g., patternTags) are absent. Avoids hard-cut migration risk; both paths covered in tests."

requirements-completed: [DATA-04, PLAY-02]

# Metrics
duration: ~25min
completed: 2026-05-03
---

# Phase 33 Plan 06: Tag-Resolver Migration + D-09/D-10 Filters Summary

**ArcadeRhythmGame now resolves patterns via resolveByTags/resolveByAnyTag with D-09 central duration filter and D-10 per-session coverage rule; OLD getPattern retained as fallback. Stash Chunk A salvaged as fresh edit; stash@{0} preserved.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-03T21:34:00Z (approximate — agent spawn)
- **Completed:** 2026-05-03T21:59:35Z
- **Tasks:** 3 (Task 1 auto-resolved by user before agent spawn; Tasks 2 + 3 executed)
- **Files modified:** 3

## Accomplishments

- **D-09 central duration filter** added to BOTH `resolveByTags` and `resolveByAnyTag` in `src/data/patterns/RhythmPatternGenerator.js`. Filter chain is now: tag-match → time-signature → rest-filter → **D-09 duration-filter** → random-pick. Catches tag-vs-duration drift at the resolution layer for ALL consumers (MixedLessonGame, RhythmReadingQuestion, future tag-based callers).
- **ArcadeRhythmGame migrated to tag-based resolution** via Stash Chunk A salvage. New imports `{ resolveByTags, resolveByAnyTag }` from `src/data/patterns/RhythmPatternGenerator`; new derived state `{ patternTags, patternTagMode, nodeDurations }`; rewritten `fetchNewPattern` selects resolver based on `patternTagMode` and falls back to OLD `getPattern` when `patternTags` is empty.
- **D-10 per-session duration coverage rule** implemented via `seenDurationsRef` (Set) + `patternIndexRef` (Number). When the remaining session slots equal the missing-duration count, the resolver forces a re-roll until a candidate covers a missing duration (bounded by `MAX_VARIETY_RETRIES = 3`). Only active on the tag-based path (gated on `result.vexDurations` truthiness).
- **D-02 dedup, lastPatternRef, TOTAL_PATTERNS preserved verbatim.** Backward compatibility intact for free-play / legacy paths.
- **All tests green:** 12 ArcadeRhythmGame tests pass, 899 pattern-generator tests pass, validateTrail.mjs green, production build green.
- **Plan 33-09 unblocked.** With ArcadeRhythmGame now on the tag-based path, the cumulative speed-pool tags planned for Plan 33-09 (D-19) will actually take effect (the OLD `getPattern` path ignored `patternTags` entirely).

## Task Commits

Each task was committed atomically:

1. **Task 1: User approval of stash apply approach** — Resolved before agent spawn (Option A: reference-only fresh edit). No commit.
2. **Task 2: Add D-09 central duration filter to resolveByTags + resolveByAnyTag** — `f1f85b2` (fix)
3. **Task 3: Migrate ArcadeRhythmGame.fetchNewPattern to tag-based resolver + D-10 coverage rule** — `8aba835` (fix)

**Plan metadata:** (this commit) — `docs(33-06): complete tag-resolver migration plan`

## Files Created/Modified

- `src/data/patterns/RhythmPatternGenerator.js` — Added 19 lines: D-09 duration-filter block inside `resolveByTags` (between rest-filter and selection) and identical block inside `resolveByAnyTag`. Each block invokes `binaryToVexDurations` for each candidate and rejects any whose vex output contains a duration code outside the node's allowed set.
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — Added 107 lines, removed 19. New imports for `resolveByTags`/`resolveByAnyTag`; new `useMemo` deriving `{ patternTags, patternTagMode, nodeDurations }` from node's `rhythmConfig`; new `seenDurationsRef`/`patternIndexRef` declarations; reset of new refs in `startGame` AND in the `nodeId` change effect; rewritten `fetchNewPattern` with tag-based primary path, getPattern fallback, D-02 dedup, D-10 coverage check.
- `src/components/games/rhythm-games/ArcadeRhythmGame.test.js` — Added `vi.mock` for `../../../data/patterns/RhythmPatternGenerator` exposing `resolveByTags` and `resolveByAnyTag` stubs that return `{ binary: [1,1,1,1], vexDurations: ["q","q","q","q"] }`. Existing `getPattern` mock retained.

## Decisions Made

- **Option A (reference-only fresh edit) selected for Stash Chunk A salvage.** User approved before agent spawn. Stash@{0} preserved intact (verified post-execution: `stash@{0}: On main: phase-33-WIP: arcade hold-notes + tag-patterns + boss_7 flip (review during triage)`). All Chunks B (hold-notes), C (tile-height refactor), D (boss_7 flip), E (test pairs for B/D) remain in the stash and out of Phase 33 scope.
- **D-09 filter placement:** inside both resolvers (not wrapping). Mirrors the existing rest-filter precedent and keeps the resolver self-contained. Two calls to `binaryToVexDurations` per candidate accepted per PATTERNS §4 guidance.
- **D-10 algorithm:** rejection-sample-then-fill via `MAX_VARIETY_RETRIES`. Active only when `vexDurations` is available (tag-based path). The fallback `getPattern` path returns `vexDurations: null` and skips the coverage check — preserves legacy free-play behavior unchanged.
- **OLD getPattern import retained.** Phase 33 keeps Stash Chunk A purely additive — the legacy free-play path is unaffected, and any future migration of free-play to tag-based is out of this plan's scope.

## Deviations from Plan

None — plan executed exactly as written. Tasks 2 and 3 followed PATTERNS §4 (D-09 insertion code) and PATTERNS §5/§6 (Stash Chunk A migration shape + D-10 variety rule) verbatim. No auto-fix rules triggered. No architectural changes required (Rule 4 not invoked).

The single piece of judgment exercised: `getNodeById` was already imported at line 21 of ArcadeRhythmGame.jsx (from prior work), so no duplicate import was added per Step 3.1 caveat in the plan.

## Issues Encountered

None.

The pre-existing ESLint warnings flagged by lint runs (e.g., `binaryToVexDurations` unused `timeSignature` arg at line 48 of RhythmPatternGenerator.js, three `react-hooks/exhaustive-deps` warnings in ArcadeRhythmGame.jsx, two unused-var warnings in the test file) were all already present before this plan and are out of scope per the SCOPE BOUNDARY rule.

## TDD Gate Compliance

Plan was `type: execute` (not `type: tdd`), so no RED/GREEN/REFACTOR gate sequence required. Existing tests provide the safety net; new test mocks added to cover the new tag-based path.

## UAT Issues Pending

Per plan acceptance_criteria, the following UAT marks are ready for `[x] resolved-by-deploy` upon user retest at deploy time:

- **UAT issue 8 (pulse on rhythm_1_1)** — NOT-A-BUG-IN-CURRENT-CODE per RESEARCH §1. PulseQuestion uses hardcoded 4-quarter pulse; the user's complaint likely conflated pulse with arcade rhythm. Task 3's migration resolves the underlying ArcadeRhythmGame pool-drift complaint that motivated the perception. Mark `[x] resolved-by-deploy` if user confirms pulse circles still all quarters AND the arcade rhythm pool now stays within `nodeDurations`.
- **UAT issue 10 (combined-values variety on combined-values nodes that use ArcadeRhythmGame)** — Verify across 3 sessions on a combined-values node (e.g., `rhythm_1_4` if it routes through ArcadeRhythmGame, or another `EXERCISE_TYPES.ARCADE_RHYTHM` node with multi-duration `nodeDurations`): each session should show ≥1 pattern containing each declared duration. Mark `[x] resolved-by-deploy` upon user confirmation.

## Plan 33-09 Unblocking Note

Plan 33-09 (D-19 cumulative speed-pool tags) was previously a no-op for ArcadeRhythmGame because the OLD `getPattern` path ignored `patternTags` entirely (RESEARCH §6 D-19 implementation detail). This plan's Task 3 migration removes that block — speed-challenge nodes that adopt cumulative tags via Plan 33-09 will now actually pull patterns from the cumulative pool when ArcadeRhythmGame mounts them. **Recommendation:** mark PLAY-02 partially complete here (variety machinery is in place; cumulative tag _data_ still pending in 33-09) — the data side belongs to 33-09.

## Self-Check: PASSED

Verified post-execution:

- `src/data/patterns/RhythmPatternGenerator.js` — modified, contains "D-09" comment block ×2, "vex.every" ×2 (acceptance criteria for Task 2 ✓)
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — modified, contains "resolveByTags" ×4, "getPattern" ×9, "seenDurationsRef" ×5, "patternTagMode" ×4 (acceptance criteria for Task 3 ✓)
- `src/components/games/rhythm-games/ArcadeRhythmGame.test.js` — modified, contains new `vi.mock` for `../../../data/patterns/RhythmPatternGenerator` with `resolveByTags` and `resolveByAnyTag` stubs ✓
- Commit `f1f85b2`: present in `git log --oneline -5` ✓
- Commit `8aba835`: present in `git log --oneline -5` ✓
- Stash@{0} preserved: `stash@{0}: On main: phase-33-WIP: arcade hold-notes + tag-patterns + boss_7 flip (review during triage)` ✓
- `npx vitest run src/data/patterns/`: 899 tests pass ✓
- `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame`: 12 tests pass ✓
- `npm run verify:trail`: validation passed (with pre-existing warnings only) ✓
- `npm run build`: built in 25.68s ✓

## Next Phase Readiness

- Wave 3 of Phase 33 complete (33-03, 33-04, 33-05, 33-06 all shipped).
- Plan 33-09 (D-19 cumulative speed-pool tags) is unblocked and can proceed.
- D-09 central filter is now the single source of truth for tag-vs-duration drift across all tag-based consumers — future rhythm games adopting `resolveByTags` inherit this protection automatically.
- No follow-up tests broke as a result of the new D-09 filter restrictiveness — all 899 pattern-generator tests still pass.

---

_Phase: 33-rhythm-issues-cleanup_
_Completed: 2026-05-03_
