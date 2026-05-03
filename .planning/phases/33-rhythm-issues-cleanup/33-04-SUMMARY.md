---
phase: 33-rhythm-issues-cleanup
plan: 04
subsystem: rhythm-data
tags: [data-audit, rhythm, pattern-cleanup, D-08, D-11, D-12]
requires:
  - 33-RESEARCH §3 (data audit findings)
  - 33-PATTERNS §9 (rhythm unit data file template)
provides:
  - rhythm_4_6 with whole notes in durations (matches whole-rest tag + prereq vocabulary)
  - rhythm_2_3 without inappropriate discovery_intro question
  - rhythm_6_4 renamed "Mixed Speeds" with accurate description
  - quarter-half tag pool cleaned of patterns that need rests in [q,h] context (UAT issue 2/9)
affects:
  - rhythm_1_3 (no longer at risk of receiving rest-bearing patterns from quarter-half pool — runtime + data layer guards)
  - rhythm_2_4 (DATA-04 variety preserved — qhw_44_001 retained for whole-note coverage)
  - All consumers of quarter-half tag (q_44_006, q_44_007, qh_44_002, qh_44_003 no longer in pool)
tech-stack:
  added: []
  patterns:
    - "Belt-and-suspenders cleanup at data layer + runtime patternNeedsRests filter"
    - "Inline audit comments documenting D-08/D-11/D-12 rationale"
key-files:
  created: []
  modified:
    - src/data/units/rhythmUnit2Redesigned.js
    - src/data/units/rhythmUnit4Redesigned.js
    - src/data/units/rhythmUnit6Redesigned.js
    - src/data/patterns/rhythmPatterns.js
decisions:
  - "Adopted plan's recommended SAFER edit for rhythm_6_4: rename + description update (no structural fields changed)"
  - "Reverted quarter-half tag removal on qhw_44_001 after Rule 1 bug discovery — runtime patternNeedsRests filter is the safety net for rhythm_1_3, while rhythm_2_4 needs this pattern for DATA-04 whole-note variety"
  - "Did NOT edit rhythmUnit8Redesigned.js per plan instructions — rhythm_8_1 focusDurations drift deferred to Plan 33-07 contingent on UAT issue 4"
  - "Did NOT address UAT issue 5 section/unit-name issue ('Eighth Notes' section name vs 'Meet Whole Notes' first node) — RESEARCH §3 did not schedule unit-level section name edits in this plan; logged as backlog for 33-10 follow-up"
metrics:
  duration: ~9 minutes
  completed: 2026-05-03T20:59:39Z
  task_count: 2
  file_count: 4
---

# Phase 33 Plan 33-04: Rhythm Unit Data Audit + Quarter-Half Rest-Pool Cleanup Summary

Executed the four data audit edits from RESEARCH §3 (Data Audit Findings): added missing whole-note duration to rhythm_4_6, removed inappropriate discovery_intro question from rhythm_2_3, renamed rhythm_6_4 to "Mixed Speeds", and cleaned the quarter-half tag pool of patterns that need rests in [q,h] context.

## What Was Built

### Task 1 — Unit data drifts (commit `fcbf853`)

**Edit 1.A — `src/data/units/rhythmUnit4Redesigned.js`, node `rhythm_4_6`:**

- Changed `durations: ["q", "h", "qr", "hr", "wr"]` → `["q", "h", "w", "qr", "hr", "wr"]`
- Added inline D-08 audit comment explaining whole-note coverage from rhythm_4_5 prereq
- Did NOT modify contextDurations (per plan: "No other field in this node changes")

**Edit 1.B — `src/data/units/rhythmUnit2Redesigned.js`, node `rhythm_2_3`:**

- Removed `{ type: "discovery_intro", focusDuration: "q" }` from MIXED_LESSON questions array
- Added D-08 audit comment explaining the rationale (contrast node, not intro)
- Question count: 9 → 8

**Edit 1.C — `src/data/units/rhythmUnit6Redesigned.js`, node `rhythm_6_4`:**

- Changed `name: "Fast and Faster"` → `"Mixed Speeds"`
- Updated description: `"Practice mixing fast and slow rhythms"` → `"Practice patterns that mix quarter, half, eighth, and sixteenth notes"`
- Added D-11 audit comment
- No structural fields (durations, patternTags, etc.) changed

### Task 2 — D-12 rest-pool cleanup (commits `aa220c9`, `72e4ab7`)

**`src/data/patterns/rhythmPatterns.js` audit comment:**
Added D-12 block comment to file header documenting the cleanup, audit date, and the deferred backlog item.

**Quarter-half tag removed from 4 patterns** (commit `aa220c9`):

| Pattern ID  | Binary onsets | Why rest-needs in [q,h]                              | Tag retained for                                                       |
| ----------- | ------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `q_44_006`  | 1, 13         | Gap=12 ∉ {4,8}                                       | quarter-only, quarter-half-whole, quarter-rest, half-rest, dotted-half |
| `q_44_007`  | 5, 13         | Leading rest (first onset at slot 4, not 0)          | quarter-only, quarter-half-whole, quarter-rest                         |
| `qh_44_002` | 5, 9          | Leading rest (first onset at slot 4, not 0)          | whole-rest                                                             |
| `qh_44_003` | 1, 5          | Trailing rest (gap from onset 4 to end = 12 ∉ {4,8}) | half-rest, dotted-half                                                 |

**Quarter-half tag RETAINED on `qhw_44_001`** (commit `72e4ab7`, Rule 1 auto-fix):

`qhw_44_001` (single onset at slot 0) was initially included in the removal batch. Doing so broke the existing `rhythmUnit8Redesigned.test.js > Combined-values node variety (DATA-04) > rhythm_2_4` test, because rhythm_2_4 uses tags `["quarter-half", "quarter-half-whole"]` (AND mode) with durations `["q", "h", "w"]`, where `qhw_44_001` is the only pattern that produces a whole note (single onset → gap=16=w, REST-FREE in [q,h,w] context). Restored the tag with an inline comment explaining: in [q,h] context (rhythm_1_3) the runtime `patternNeedsRests` filter still correctly blocks it from emitting rests; in [q,h,w] context (rhythm_2_4) it is rest-free and required for whole-note variety. Belt-and-suspenders cleanup does not apply to this specific entry — runtime filter is the safety net.

## Quarter-Half Pool Status After Cleanup

- **Total patterns with `quarter-half` tag:** 6 (`q_44_001`, `q_44_002`, `q_44_003`, `q_44_004`, `qh_44_001`, `qhw_44_001`)
- **Patterns reachable for `[q,h]` context (rhythm_1_3) after runtime filter:** 5 (`qhw_44_001` is filtered as rest-needing)
- **Above R8 threshold of ≥4 patterns:** YES — no follow-up authoring needed
- **Runtime validation (500 trials of `resolveByTags(['quarter-half'], ['q','h'])`):** No rest-pattern leaks observed; only `q_44_001`–`004` and `qh_44_001` returned

## Verification

| Gate                                                    | Result                                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `npm run verify:trail`                                  | ✅ PASS (validation passed with warnings — pre-existing low-variety warnings unchanged) |
| `npm run lint` (touched files)                          | ✅ PASS (eslint exit 0 + lint-staged auto-format applied on commit)                     |
| `npm run test:run` (full suite)                         | ✅ PASS (1650 passed, 2 skipped, 13 todo, 0 failed)                                     |
| `npm run build`                                         | ✅ PASS (built in 38.44s; prebuild validateTrail green)                                 |
| `npm run verify:patterns`                               | ✅ PASS (no warnings)                                                                   |
| Runtime simulation: rhythm_1_3 `[q,h]` rest-free        | ✅ PASS (500 trials, 0 leaks)                                                           |
| Runtime simulation: rhythm_2_4 `[q,h,w]` produces q+h+w | ✅ PASS (q, h, w all observed)                                                          |

## Acceptance Criteria

| Criterion                                                                                 | Status |
| ----------------------------------------------------------------------------------------- | ------ |
| rhythm_4_6 durations `['q','h','w','qr','hr','wr']`                                       | ✅     |
| rhythm_2_3 discovery_intro removed                                                        | ✅     |
| rhythm_6_4 named "Mixed Speeds" with updated description                                  | ✅     |
| `name: "Fast and Faster"` count = 0 in rhythmUnit6Redesigned.js                           | ✅     |
| Quarter-half tag pool no longer yields rest patterns to rhythm_1_3 (runtime + data layer) | ✅     |
| Comment block "D-12 (Phase 33 Plan 33-04)" present at top of rhythmPatterns.js            | ✅     |
| quarter-only tag pool NOT audited in this plan (deferred to backlog)                      | ✅     |
| `npm run verify:trail` exits 0                                                            | ✅     |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored `quarter-half` tag on `qhw_44_001`**

- **Found during:** Task 2 verification (`npm run test:run`)
- **Issue:** Removing `quarter-half` from `qhw_44_001` broke the DATA-04 variety test for rhythm_2_4 (which needs this single-onset pattern to emit whole notes in [q,h,w] context)
- **Fix:** Restored the tag with an inline comment explaining the runtime filter is the safety net for rhythm_1_3
- **Files modified:** `src/data/patterns/rhythmPatterns.js`
- **Commit:** `72e4ab7`
- **Notes:** Confirmed via 500-trial runtime simulation that `[q,h]` context still produces 0 rest-pattern leaks (`qhw_44_001` filtered by `patternNeedsRests`), while `[q,h,w]` produces all three durations including whole notes.

### Out-of-Scope Items Logged for Follow-Up

- **rhythm_8_1 focusDurations drift** — Per plan instructions and RESEARCH Open Question 4, `rhythmUnit8Redesigned.js` was NOT modified. The drift (focusDuration `"8"` plays plain eighths rather than pairs) is deferred to Plan 33-07, contingent on UAT issue 4 marked confirmed-bug for 8_1 specifically.
- **UAT issue 5 section/unit-name mismatches** — User note ("section 2 name is still 'Eighth Notes' while the 1st node is 'Meet Whole Notes'") was reviewed against RESEARCH §3 audit. The four specific node-level drifts identified by RESEARCH (rhythm_2_3, rhythm_4_6, rhythm_6_4, rhythm_8_1) were addressed (3 of 4 here, 1 deferred). The broader `unit.name` vs first-node mismatch (e.g., Unit 2 named "Sustain & Whole" but first node "Meet Whole Notes" — needs cross-checking) was NOT scheduled by RESEARCH §3. **Backlog: Phase 33-10 (or follow-up triage) should audit `UNIT_NAME` constants in each unit file against the first node's `name` to surface and resolve the section-name drift.**
- **Quarter-only rest-pool audit** — Explicitly deferred per Task 2 Step 2.4 scope rule. Runtime `resolveByTags` `patternNeedsRests` filter provides system-wide coverage. Re-triage if UAT issue 2/9 retest shows rests in any node beyond rhythm_1_3.

### Authentication Gates

None.

## Commits

| Commit    | Type       | Description                                                           |
| --------- | ---------- | --------------------------------------------------------------------- |
| `fcbf853` | fix(33-04) | rhythm unit data drifts (rhythm_4_6, rhythm_2_3, rhythm_6_4)          |
| `aa220c9` | fix(33-04) | D-12 remove rest-bearing patterns from quarter-half tag pool          |
| `72e4ab7` | fix(33-04) | restore quarter-half tag on qhw_44_001 to preserve rhythm_2_4 variety |

## UAT Resolution Status (pending user retest at deploy time)

- **Issue 2/9** (rhythm_1_3 receives rest patterns) — READY for `[x] resolved-by-deploy` mark. Belt-and-suspenders cleanup at data layer + runtime filter both confirmed effective.
- **Issue 5** (section/content title) — PARTIALLY READY. The 3 RESEARCH-flagged drifts (rhythm_2_3 question removal contributes to its section coherence, rhythm_4_6 durations match name, rhythm_6_4 renamed) addressed. rhythm_8_1 deferred to Plan 33-07. Broader unit-name audit logged for backlog.

## Self-Check: PASSED

**Files verified to exist:**

- `src/data/units/rhythmUnit2Redesigned.js` ✅
- `src/data/units/rhythmUnit4Redesigned.js` ✅
- `src/data/units/rhythmUnit6Redesigned.js` ✅
- `src/data/patterns/rhythmPatterns.js` ✅
- `.planning/phases/33-rhythm-issues-cleanup/33-04-SUMMARY.md` ✅ (this file)

**Commits verified to exist:**

- `fcbf853` ✅
- `aa220c9` ✅
- `72e4ab7` ✅
