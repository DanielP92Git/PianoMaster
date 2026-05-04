---
phase: 33-rhythm-issues-cleanup
plan: 09
status: complete
date: 2026-05-04
---

# Plan 33-09 — Cumulative Speed-Pool Tags

## Outcome

Speed Round nodes for Units 2–8 now carry cumulative `patternTags` from prior units (D-19), with `patternTagMode: "any"` so the tag-based resolver from Plan 33-06 can pull from the expanded pool. Per-node duration vocabulary unchanged (kept narrow per plan note).

## Task 1 — Decision (user-resolved before execution)

User explicitly approved firing Plan 33-09 inline. All three contingent gates met:

1. UAT Issue 12 confirmed-bug
2. Plan 33-06 (Stash Chunk A salvage) shipped (commit `8aba835`)
3. User explicit approval

## Task 2 — Edits to U2–U5 Speed Rounds

| Node         | Pre-plan tags                                    | Post-plan tags                                                             | Mode  |
| ------------ | ------------------------------------------------ | -------------------------------------------------------------------------- | ----- |
| `rhythm_2_6` | `["quarter-half","quarter-half-whole"]`          | U1+U2 cumulative (3 tags)                                                  | `any` |
| `rhythm_3_6` | `["quarter-eighth","quarter-half-whole-eighth"]` | U1+U3 cumulative (5 tags)                                                  | `any` |
| `rhythm_4_6` | `["quarter-rest","half-rest","whole-rest"]`      | U1+U4 cumulative (8 tags)                                                  | `any` |
| `rhythm_5_6` | `["dotted-half","dotted-quarter"]`               | U1+U5 cumulative (9 tags, `whole-rest` pruned — no `wr` in node durations) | `any` |

## Task 3 — Edits to U6–U8 Speed Rounds + U7 exception

| Node         | Pre-plan tags                          | Post-plan tags                                                                                                                                | Mode      |
| ------------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `rhythm_6_6` | `["sixteenth","quarter-eighth"]`       | U1+U6 cumulative (8 tags, `half-rest`/`whole-rest`/`dotted-quarter` pruned — incompatible with `[q,h,8,16]`)                                  | `any`     |
| `rhythm_7_6` | `["six-eight"]`                        | **UNCHANGED** — comment-only addition documenting deliberate non-cumulative status (6/8 standalone pool)                                      | unchanged |
| `rhythm_8_6` | `["syncopation","dotted-syncopation"]` | U1+U6+U8 cumulative (9 tags, U7 six-eight excluded; `half-rest`/`whole-rest`/`dotted-half`/`sixteenth` pruned — incompatible with `[qd,8,q]`) | `any`     |

## D-19 Tag-Pruning Rule (deviation Rule 2)

Initial cumulative-list following the plan caused `validateTrail` to fail with 7 errors of the form: `"Node X tag Y has no matching patterns that can render with durations [...]"` — the validator's D-09 safety check rejects tags whose entire pattern pool requires durations not in the node's vocabulary.

Resolution: prune any cumulative tag from a node's list when ALL of that tag's patterns require durations the node lacks. The runtime D-09 filter (Plan 33-06) would discard those patterns at request time anyway; the validator just enforces the same invariant statically. Specific prunes documented in tables above.

This preserves the plan's intent ("durations stay narrow per the speed node's own vocabulary") while satisfying the validator. No node loses meaningful variety — the pruned tags would have produced zero patterns at runtime regardless.

## rhythm_1_6 Intrinsic Limit (acknowledged)

Per RESEARCH §3 Unit 1 + plan note: `rhythm_1_6` (Speed Challenge in U1) cannot benefit from cumulative pull because it has no prior unit. Intrinsic pool ceiling (~7 distinct binaries) accepted; no edit applied.

## Verification Gates

| Gate                                                       | Result                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| `npm run verify:trail`                                     | PASS (warnings only)                                   |
| `grep -c 'patternTagMode: "any"' rhythmUnit2Redesigned.js` | ≥1 ✓ (rhythm_2_6 tagged; boss_rhythm_2 already had it) |
| `grep -c 'patternTagMode: "any"' rhythmUnit3Redesigned.js` | ≥1 ✓                                                   |
| `grep -c 'patternTagMode: "any"' rhythmUnit4Redesigned.js` | ≥1 ✓                                                   |
| `grep -c 'patternTagMode: "any"' rhythmUnit5Redesigned.js` | ≥1 ✓                                                   |
| `grep -c 'patternTagMode: "any"' rhythmUnit6Redesigned.js` | ≥1 ✓                                                   |
| `grep -c 'D-19' rhythmUnit7Redesigned.js`                  | ≥1 ✓ (exception comment)                               |
| `grep -c 'patternTagMode: "any"' rhythmUnit8Redesigned.js` | ≥1 ✓                                                   |
| `npx vitest run src/data/units/`                           | 91 pass / 0 fail ✓                                     |
| Lint on touched files                                      | clean ✓                                                |

## Execution Mode (deviation note)

Plan ran **inline** (not via worktree subagent) by user request to avoid the stale-base risk that hit Plan 33-08. No worktree, no merge, no cherry-pick — direct edits on main.

## UAT Resolution

| Issue                        | Pre-plan      | Post-plan                                                           |
| ---------------------------- | ------------- | ------------------------------------------------------------------- |
| 12 (Speed Challenge variety) | confirmed-bug | resolved-by-deploy (pending user retest on rhythm_3_6 / rhythm_5_6) |

## Files Modified

- `src/data/units/rhythmUnit2Redesigned.js`
- `src/data/units/rhythmUnit3Redesigned.js`
- `src/data/units/rhythmUnit4Redesigned.js`
- `src/data/units/rhythmUnit5Redesigned.js`
- `src/data/units/rhythmUnit6Redesigned.js`
- `src/data/units/rhythmUnit7Redesigned.js` (comment-only)
- `src/data/units/rhythmUnit8Redesigned.js`

## Backlog / Follow-ups

- **33-10 final UAT pass**: user replays rhythm_3_6 + rhythm_5_6 + (ideally) rhythm_8_6 to subjectively rate variety improvement. If rating improves, mark Issue 12 `[x] resolved-by-deploy`. If U1 rhythm_1_6 still feels stale, accept per documented intrinsic limit or open a new backlog item to author more U1-pool patterns.
- **PLAY-02** can now be marked complete (Plan 33-06 added the runtime machinery; Plan 33-09 supplied the data).
