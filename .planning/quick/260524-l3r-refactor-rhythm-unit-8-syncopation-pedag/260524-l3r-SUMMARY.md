# Quick Task 260524-l3r: Refactor Rhythm Unit 8 — Summary

**Executed:** 2026-05-24
**Branch:** `worktree-unit8-syncopation-rethink-260524`
**Status:** Complete — all 8 tasks shipped, all final gates green.

## One-Liner

Unit 8 syncopation refactored end-to-end to 7 monomodal nodes (down from
8), with q-h-q correctly reframed as "Hold Across the Beat," a new
`compose_rhythm` tile-composer question type, and a strict boss pool
that draws ~73% syncopated bars.

## Commits

| #   | Hash      | Task                                                             |
| --- | --------- | ---------------------------------------------------------------- |
| 1   | `012cebe` | Task 1 — curate `syncopation-heavy` tag; drop `long-syncopation` |
| 2   | `536e9e1` | Task 2 — register `compose_rhythm` in `validateTrail.mjs`        |
| 3   | `d62f7a5` | Task 3 — `ComposeRhythmQuestion.jsx` renderer + 6-test suite     |
| 4   | `cd090c1` | Task 4 — wire `compose_rhythm` into `MixedLessonGame` dispatch   |
| 5   | `293172b` | Task 5 — rewrite Unit 8 data (7 nodes per PEDAGOGY-REVIEW)       |
| 6   | `9603ede` | Task 6 — rewrite Unit 8 test suite (23 tests, DATA-04 intact)    |
| 7   | `4968dab` | Task 7 — EN+HE i18n: trail labels + compose UI strings           |

(Task 8 was verification-only — no commit.)

## Files Touched

| Path                                                                                   | Change                                 |
| -------------------------------------------------------------------------------------- | -------------------------------------- |
| `src/data/patterns/rhythmPatterns.js`                                                  | Edit — tag curation                    |
| `src/data/patterns/rhythmPatterns.test.js`                                             | Edit — VALID_TAGS updated              |
| `scripts/validateTrail.mjs`                                                            | Edit — 3 surgical updates              |
| `src/components/games/rhythm-games/renderers/ComposeRhythmQuestion.jsx`                | NEW                                    |
| `src/components/games/rhythm-games/renderers/__tests__/ComposeRhythmQuestion.test.jsx` | NEW                                    |
| `src/components/games/rhythm-games/MixedLessonGame.jsx`                                | Edit — import + 2 dispatch hooks       |
| `src/data/units/rhythmUnit8Redesigned.js`                                              | Full rewrite                           |
| `src/data/units/rhythmUnit8Redesigned.test.js`                                         | Full rewrite (DATA-04 preserved)       |
| `src/locales/en/trail.json`                                                            | Edit — nodes, descriptions, unit8Nodes |
| `src/locales/he/trail.json`                                                            | Edit — nodes, descriptions, unit8Nodes |
| `src/locales/en/common.json`                                                           | Edit — new `compose.*` block           |
| `src/locales/he/common.json`                                                           | Edit — new `compose.*` block           |

12 files (1 more than the plan's surface estimate, because
`rhythmPatterns.test.js` needed its `VALID_TAGS` set updated to stay
consistent with the catalog).

## Final Gate Results

| Command                   | Result                                                                                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`            | PASS — 0 errors, 124 warnings (pre-existing)                                                                                                                                      |
| `npm run verify:trail`    | PASS with warnings (pre-existing low-variety multi-angle warnings for many rhythm units, plus 2 question-count warnings for Nodes 3+4 which are intentional under the new design) |
| `npm run verify:patterns` | PASS                                                                                                                                                                              |
| `npm run test:run`        | 1716 passed / 13 todo / 2 failed (pre-existing, unrelated — see Deferred Issues)                                                                                                  |
| `npm run build`           | PASS — built in 36.52s                                                                                                                                                            |

## Design Decisions Applied

- **Decision A (terminology):** "syncopation" / "סינ-קו-פה" reserved for
  Node 2 (Surprise Beat), Node 5 (Build a Syncopation), and Boss. Node 1
  q-h-q labeled "Hold-Across Warm-Up" — neither EN nor HE child copy
  uses the syncopation word/Kodaly syllable for it.
- **Decision B (monomodal nodes):** Each node specializes (discovery
  warm-up / listen-first discovery / pure reading + detective / pulse +
  tap split / creative compose / arcade speed / mixed boss).
- **Decision C (creative milestone):** `compose_rhythm` shipped as a
  full renderer with 6 vitest assertions covering render, fill, empty,
  Play, Done (one-shot), and the disabled prop. Tile interaction is
  tap-only (no drag) per MVP scope. Always reports onComplete(2,2) —
  informational success, mirroring DiscoveryIntroQuestion.
- **Decision D (boss scope):** Boss strict to `[q,h,8]` and
  `['syncopation-heavy']`. Pool: 16 syncopated patterns + 6 non-syncopated
  contrast bars = 22 total, 73% syncopated. Drops `dotted-half`,
  `whole-rest`, `sixteenth`, `dotted-quarter`, `68_compound_meter`
  skill, and the "all-rhythm finale" framing.
- **Body-split visual pulse (Node 4 stretch):** DEFERRED per CONTEXT.md
  guidance. Ships as plain `pulse` → `rhythm_tap × 4` → `visual_recognition`.
  Renderer addition flagged for a follow-up plan.
- **XP arc:** 60 / 80 / 85 / 85 / 100 / 90 / 250 — deliberate Node 5
  spike preserves the creative reward.

## Notable Findings During Execution

- **Plan-checker flag #1 caught a real binary-format mismatch.** The
  plan authored tile binaries as 8-cell arrays (`[1,0,1,0,0,0,1,0]`)
  but the project's `binaryPatternToBeats` consumes 16-cell arrays
  (one sixteenth per cell for 4/4). The 4 Node-5 compose tiles were
  re-authored with correct 16-cell binaries (verified: every tile sums
  to 16 units and is unique within the catalog).
- **Pattern test had to update VALID_TAGS.** `rhythmPatterns.test.js`
  enumerated `long-syncopation` as a valid tag and asserted every tag
  was used by some pattern. Removing `long-syncopation` from the catalog
  required dropping it from VALID_TAGS and adding `syncopation-heavy`.
  This is a hidden 12th-file change not in the plan's surface estimate.
- **`syncopation-heavy` contrast bars use existing patterns, not new ones.**
  The plan suggested adding 4-6 new pattern entries, but every "simple
  on-the-beat" shape I could author already existed (and the catalog's
  `rhythmPatterns.test.js` enforces unique binaries per time signature).
  Solution: added `syncopation-heavy` to 6 existing non-syncopated
  patterns instead (q_44_001, q_44_002, q_44_004, qh_44_001, qe_44_003,
  qe_44_005). Effect on the boss pool ratio is identical.

## Deviations from Plan

### Rule 1 / 2 fixes — auto-applied

**1. [Rule 1 - Bug] Tile binaries lengthened from 8 → 16 cells.**

- **Found during:** Task 5
- **Issue:** Plan's authored binary arrays were 8 cells (half-bar), but
  `binaryPatternToBeats` expects 16-cell arrays for 4/4. Plan-checker
  flag #1 also raised this risk explicitly.
- **Fix:** Re-derived each of the 4 tile binaries as 16-cell arrays
  summing to 16 sixteenth-units (1 bar of 4/4): `tile_qqqq`, `tile_qhq`,
  `tile_8q8qq`, `tile_q8q8q`.
- **Files modified:** `src/data/units/rhythmUnit8Redesigned.js` (NODE_5_COMPOSE_TILES)
- **Commit:** `293172b`

**2. [Rule 1 - Bug] `VALID_TAGS` Set in pattern test was stale.**

- **Found during:** Task 1
- **Issue:** Dropping `long-syncopation` from the catalog broke the
  test asserting "every VALID_TAGS entry is used by ≥1 pattern."
- **Fix:** Removed `long-syncopation` from `VALID_TAGS`, added
  `syncopation-heavy`, updated the test description to "all valid tags".
- **Files modified:** `src/data/patterns/rhythmPatterns.test.js`
- **Commit:** `012cebe`

**3. [Rule 2 - Critical missing functionality] `syncopation-heavy` boss
pool needed contrast bars without duplicating binaries.**

- **Found during:** Task 1 first attempt
- **Issue:** The plan said add 4-6 NEW patterns. First attempt at this
  produced binaries that collided with existing patterns
  (`rhythmPatterns.test.js` enforces unique binaries per time signature
  via a dedicated assertion).
- **Fix:** Reused 6 existing non-syncopated patterns (added the new tag
  to their `tags` arrays) — same effect on the boss draw ratio without
  introducing duplicates.
- **Files modified:** `src/data/patterns/rhythmPatterns.js`
- **Commit:** `012cebe`

### Architectural decisions — none requiring user input.

## Deferred Issues

- **QuickStatsGrid.test.jsx — 2 pre-existing test failures.**
  Failure reproduces against `main` (commit `6a30405`) and is unrelated
  to Unit 8 work. Logged in `.planning/phases/deferred-items.md` for a
  follow-up quick task.

## Known Stubs

None. All renderer wiring, validator updates, i18n keys, and data
references resolve end-to-end. The Node 4 visual-pulse enhancement is
explicitly deferred per CONTEXT decision D — current behavior (plain
`pulse` + `rhythm_tap`) ships as the graceful fallback the plan
allowed.

## UAT Hand-Off Notes

1. **Compose tile RTL handling.** ComposeRhythmQuestion lays out
   tiles+slots with `flex-wrap` and centers them. For Hebrew users the
   palette will display right-to-left at the wrapper level; tile
   contents (the mini-staff + label) stay LTR since music notation is
   directional. Worth a quick UAT smoke in HE.
2. **Body-split visual pulse (Node 4).** Currently ships as plain
   `pulse` → `rhythm_tap`. If UAT feedback says the kinaesthetic
   pulse-vs-rhythm split isn't landing, a follow-up plan can add
   `showPulseIndicator` to `RhythmTapQuestion` per RESEARCH §3.
3. **Hebrew copy review.** The new HE node names and descriptions are
   drafted — the user should review final wording before next release.
   The Kodaly form `סינ-קו-פה` (hyphenated, no nikud — per memory) is
   used only on Node 2, Node 5, and Boss. Other nodes use neutral
   Hebrew ("החזקה מעל הפעמה," "פיצול גוף," "לא-בפעמה" descriptors).
4. **Boss bar-count sample.** Recommend running 5 boss attempts and
   eyeballing — pool ratio is 16/22 ≈ 73% syncopated, but uniform random
   selection means individual runs may sample low. If a child reports
   "I don't see syncopation in the boss" we may need to bump the
   contrast-bar pool down to 3-4 or weight the generator.

## Self-Check: PASSED

All commit hashes verified present in `git log --oneline 6a30405..HEAD`:

- `012cebe`, `536e9e1`, `d62f7a5`, `cd090c1`, `293172b`, `9603ede`, `4968dab`

All created files verified on disk:

- `src/components/games/rhythm-games/renderers/ComposeRhythmQuestion.jsx`
- `src/components/games/rhythm-games/renderers/__tests__/ComposeRhythmQuestion.test.jsx`
- `.planning/quick/260524-l3r-refactor-rhythm-unit-8-syncopation-pedag/260524-l3r-SUMMARY.md`
- `.planning/phases/deferred-items.md`
