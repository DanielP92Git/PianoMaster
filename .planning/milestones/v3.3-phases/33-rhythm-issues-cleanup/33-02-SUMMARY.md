---
phase: 33-rhythm-issues-cleanup
plan: 02
status: complete
wave: 2
completed: 2026-05-03
build_sha_under_test: ba7412e
build_sha_pinned: 0546a82
---

# Plan 33-02 — Wave 1 Manual UAT Execution

## Summary

User executed manual UAT against the Netlify deploy of build SHA `ba7412e` (functionally equivalent to pinned `0546a82` — only docs commits between them). Marked all 10 active issues + acknowledged Issue 11 dropped. Sign-off complete.

## UAT Trigger Summary

| Issue | Mark               | Triggers Plan                       | Notes                                                                                                                                                                                                                                                                                 |
| ----- | ------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | resolved-by-deploy | (33-07 not triggered)               | Quarter-intro Listen first-tap fine on deploy                                                                                                                                                                                                                                         |
| 2/9   | resolved-by-deploy | 33-04 (unconditional)               | No rest in node 1_3 across replays                                                                                                                                                                                                                                                    |
| 4     | resolved-by-deploy | (33-07 not triggered)               | Both 3_1 and 8_1 audio fine                                                                                                                                                                                                                                                           |
| 5     | **confirmed-bug**  | 33-04 (unconditional)               | **SCOPE EXPANSION**: User reports section/unit _header_ names mismatch, e.g. "section 2 name is still 'Eighth Notes' while the 1st node is 'Meet Whole Notes'". RESEARCH §3 only captured node-level renames; Plan 33-04 must widen scope to unit/section headers across all 8 units. |
| 6     | **confirmed-bug**  | 33-05 (unconditional)               | Console rate-limit warning reproduces — fix is migration deploy                                                                                                                                                                                                                       |
| 7     | resolved-by-deploy | 33-03 (unconditional)               | Dictation Listen first-tap fine on deploy; structural fix still ships per D-03                                                                                                                                                                                                        |
| 8     | cannot-reproduce   | NOT-A-BUG-IN-CURRENT-CODE → backlog | **OBSERVATION**: User states "node never shows pulse game, only tap notation". Either UAT step pointed to wrong node OR pulse question is missing entirely from node 1_1. Worth follow-up investigation as Phase 33 backlog item or Wave 6 capture.                                   |
| 10    | resolved-by-deploy | 33-06 (unconditional)               | Variety rule passes UAT; structural fix (Stash Chunk A + D-09 + D-10) still ships per D-03                                                                                                                                                                                            |
| 12    | **confirmed-bug**  | **33-09 (FIRES)**                   | Speed Challenge variety perceived as stale at U1 — D-19 cumulative tags warranted                                                                                                                                                                                                     |
| 13    | **confirmed-bug**  | **33-08 (FIRES)**                   | Boss differentiation: boss_rhythm_1=1, boss_rhythm_6=3, boss_rhythm_8=3. MINI_BOSS especially flat. D-18 boss intro overlay + victory VFX warranted                                                                                                                                   |

## Wave 3 / Wave 4 / Wave 5 Plan Triggers

**Wave 3 (all unconditional, fire regardless of UAT):**

- 33-03 — audio prewarm hook (Issue 7 area, structural)
- 33-04 — data audit fixes (Issues 5, 2/9, 8 area) — **SCOPE NOTE: include section/unit header rename audit per Issue 5 user feedback**
- 33-05 — Supabase rate-limit migration deploy (Issue 6 confirmed)
- 33-06 — ArcadeRhythmGame tag-resolver migration + D-09 + D-10 (Issues 8/10 area, structural)

**Wave 4:**

- 33-07 — **SKIP** (Issue 1 + Issue 4 both resolved-by-deploy — D-14/D-15 audio buffer hardening not needed)
- 33-08 — **FIRE** (Issue 13 confirmed-bug — D-18 boss intro overlay + victory VFX)

**Wave 5:**

- 33-09 — **FIRE** (Issue 12 confirmed-bug — D-19 cumulative speed-pool tags, depends on Plan 33-06's Stash Chunk A salvage)

**Wave 6:**

- 33-10 — final UAT re-run + tracking + service worker bump

## Open Items / Follow-ups

1. **Issue 5 scope widening** (Plan 33-04): User's note targets _section/unit headers_, not just individual node renames. Plan 33-04's executor must read this SUMMARY's Issue 5 row and audit unit-level/section-level naming in addition to the node-level renames RESEARCH §3 listed.

2. **Issue 8 disambiguation** (backlog): User reports node 1_1 "never shows pulse game". Either the UAT step misidentified which node hosts pulse, or PulseQuestion is genuinely absent from node 1_1's MixedLessonGame question set on the deployed build. Phase 33 backlog candidate; Wave 6 (Plan 33-10) should re-check or document as known-resolved.

3. **MINI_BOSS flatness** (potential Plan 33-08 expansion): boss_rhythm_1 rated 1/5 (the strongest "feels like practice" signal). Plan 33-08 ships boss intro overlay + victory VFX for full BOSS nodes; consider whether MINI_BOSS should also receive intro overlay or a tier-down variant.

## Build Under Test

- **Pinned SHA:** `0546a82` (UAT scaffolded against this commit)
- **Actually tested SHA:** `ba7412e` (current Netlify Production)
- **Functional equivalence:** Yes — only docs commits and a one-file SVG-restoration commit (`ba7412e`) between pin and test. No `src/` or `supabase/` runtime change.
- **Test environment:** https://my-pianomaster.netlify.app (Netlify Production)

## Key Files Modified

- `.planning/phases/33-rhythm-issues-cleanup/33-UAT.md` — all 10 active issue sections marked, Sign-off complete

## Self-Check

- [x] All 10 active issues marked exactly once
- [x] Issue 11 dropped acknowledgment
- [x] Sign-off block fully ticked
- [x] Wave 3+ trigger subset unambiguous and recorded above
- [x] Free-form notes captured (Issue 5 section names, Issue 8 game-type observation, Issue 13 ratings)

## Self-Check: PASSED
