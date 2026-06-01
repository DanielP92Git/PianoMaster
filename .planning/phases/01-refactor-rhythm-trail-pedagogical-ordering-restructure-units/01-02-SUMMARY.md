---
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
plan: 02
subsystem: trail-data
tags:
  [rename, hidden-unit, syncopation, rhythm-trail, namespace-free, hidden-v1]

# Dependency graph
requires:
  - phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
    provides: D-10 (hidden Unit 8 rename to rhythm_synco_*) from CONTEXT.md; 01-01 Wave 0 validation layer (validateTrail.mjs lint rules; rhythmUnit8Redesigned.test.js / rhythmUnits.difficulty.test.js still load symbol-based imports)
provides:
  - Renamed hidden Syncopation unit node IDs (rhythm_synco_1..6 + boss_rhythm_synco) — frees rhythm_8_* / boss_rhythm_8 numeric namespace for new U8 (3/4 Meter) in Wave 2
  - Updated HIDDEN-V1 marker comments in src/data/expandedNodes.js with 4-step re-enable checklist (references new IDs + Plan 08 RHYTHM_SYNCO UNITS entry)
  - Renamed unit8Nodes locale keys in trail.json (EN + HE) to rhythm_synco_*
affects: [01-05, 01-06, 01-07, 01-08] # Wave 2 U8 (3/4 Meter) author plans can now claim rhythm_8_* / boss_rhythm_8 IDs without collision; Plan 08 will pre-author the RHYTHM_SYNCO UNITS entry referenced in the HIDDEN-V1 re-enable comment

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hidden-unit rename pattern: rename internal IDs only, preserve file path + symbolic export name (rhythmUnit8Nodes) + structural HIDDEN-V1 markers. Re-enable workflow remains a 4-step uncomment + UNITS entry checklist."
    - "Pattern IDs (focusPattern.id 'qhq', 'synsyn') are distinct from node IDs and live in RHYTHM_PATTERNS namespace — never rename these alongside node-ID renames."
    - "Locale ID-keyed blocks (e.g., unit8Nodes) follow the source-of-truth ID; rename in lockstep with data file."

key-files:
  created: []
  modified:
    - src/data/units/rhythmUnit8Redesigned.js
    - src/data/units/rhythmUnit8Redesigned.test.js
    - src/data/expandedNodes.js
    - src/locales/en/trail.json
    - src/locales/he/trail.json

key-decisions:
  - "Top-of-file rename history comment in rhythmUnit8Redesigned.js — surfaces the rhythm_8_* → rhythm_synco_* rename + the freed-for-U8-meter rationale to anyone reading the hidden-unit source"
  - "HIDDEN-V1 marker comment expanded to 4-step re-enable checklist instead of single-line note — captures the operational steps and the Plan 08 dependency for RHYTHM_SYNCO UNITS entry"
  - "trail.json ID-keyed unit8Nodes block renamed (vs left orphaned) — the keys are direct rhythm_8_* references, not display-name strings, so they collide with new U8 namespace if left in place"
  - "Describe label intentionally retains 'renamed from rhythm_8_*' prose — surfaces rename history at test-output time and is a documentation string, not a code-path ID reference"

patterns-established:
  - "Hidden-unit rename: source file + sibling test + ID-keyed locale block all change in lockstep; file paths and symbolic exports stay constant; HIDDEN-V1 markers are documentation-only edits"

requirements-completed: [REQ-05]

# Metrics
duration: 3min
completed: 2026-06-01
---

# Phase 01 Plan 02: Hidden Unit 8 Syncopation Rename Summary

**Renamed hidden Syncopation unit node IDs from rhythm*8*_/boss*rhythm_8 to rhythm_synco*_/boss*rhythm_synco per D-10, freeing the rhythm_8*\* numeric namespace for new U8 (3/4 Meter) in Wave 2 — file path, symbolic export, HIDDEN-V1 markers, and re-enable workflow all preserved.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-01T18:54:43Z
- **Completed:** 2026-06-01T18:58:23Z
- **Tasks:** 2 (both TDD: RED → GREEN)
- **Files modified:** 5

## Accomplishments

- Renamed all 7 node IDs in `src/data/units/rhythmUnit8Redesigned.js` (`rhythm_8_1..6` → `rhythm_synco_1..6`, `boss_rhythm_8` → `boss_rhythm_synco`) plus matching `prerequisites:` chain updates. External chain-link `prerequisites: ["boss_rhythm_7"]` on node 1 preserved (re-enable chain into trail unchanged).
- Preserved: `UNIT_ID = 8`, `UNIT_NAME = "Syncopation"`, `CATEGORY`, `START_ORDER = 144`, all `focusPattern.id` pattern strings (`"qhq"`, `"synsyn"`), all `name`/`description`/`unitName` display copy, all `rhythmConfig` / `exercises` / `xpReward` / `nodeType` values, all `skills` array entries, all 4 NODE_5_COMPOSE_TILES.
- Added rename history comment at top of source file documenting the rhythm*8*_ → rhythm*synco*_ migration + Phase 1 v3.5 D-10 source decision.
- Updated `src/data/units/rhythmUnit8Redesigned.test.js`:
  - `expectedIds` array → `rhythm_synco_1..6` + `boss_rhythm_synco`
  - Node 5/6/boss explicit ID assertions
  - Describe label rewritten to "Rhythm Unit Syncopation (HIDDEN, renamed from rhythm*8*\*)" to make the rename visible in test output
  - Prereq-chain structural assertion left untouched (it walks `rhythmUnit8Nodes[i-1].id` symbolically and went green automatically once source IDs were renamed)
- Updated `src/data/expandedNodes.js` HIDDEN-V1 markers:
  - Lead comment rewritten to reference renamed IDs and document a 4-step re-enable checklist (uncomment import, uncomment both spreads, add RHYTHM_SYNCO UNITS entry pre-authored by Plan 08, update CLAUDE.md node counts)
  - Both spread placeholder comments appended with `(rhythm_synco_*)` annotation
  - Import line and both spread lines remain commented out — unit stays HIDDEN
- Renamed `unit8Nodes` block keys in `src/locales/en/trail.json` and `src/locales/he/trail.json` from `rhythm_8_*`/`boss_rhythm_8` to `rhythm_synco_*`/`boss_rhythm_synco`.
- Final namespace audit: `grep -rn "rhythm_8_\|boss_rhythm_8" src/ scripts/ supabase/ public/` returns only two documentation references (the source file's rename-history top-of-file comment and the test's describe label "renamed from rhythm*8*_"). No code-path ID references remain. The `rhythm*8*_` namespace is free for Wave 2 to author new U8 (3/4 Meter) without collision.

## Task Commits

1. **Task 1 RED: assert rhythm*synco*\* IDs in rhythmUnit8Redesigned.test.js** — `84f73a5` (test) — expectedIds + node 5/6/boss + describe label updated; 4 tests intentionally failing against unchanged source
2. **Task 1 GREEN: rename hidden Syncopation unit IDs in rhythmUnit8Redesigned.js** — `a132a18` (refactor) — 7 `id:` fields + 6 `prerequisites:` entries renamed; pattern IDs `qhq`/`synsyn` preserved; top-of-file rename-history comment added; both target tests green (32/32)
3. **Task 2: update HIDDEN-V1 markers + locale keys** — `7ea7b31` (refactor) — expandedNodes.js 3 HIDDEN-V1 marker blocks updated; trail.json EN+HE unit8Nodes blocks renamed; import + spreads stay commented; verify:trail introduces no new failures

_Plan metadata commit will follow this SUMMARY._

## Files Created/Modified

- `src/data/units/rhythmUnit8Redesigned.js` — 7 node IDs renamed, 6 prerequisites entries updated, top-of-file rename-history comment added
- `src/data/units/rhythmUnit8Redesigned.test.js` — expectedIds array, 3 explicit ID assertions, describe label updated (12 line edits)
- `src/data/expandedNodes.js` — HIDDEN-V1 lead comment expanded to 4-step re-enable checklist; both spread placeholders annotated `(rhythm_synco_*)`
- `src/locales/en/trail.json` — 7 unit8Nodes keys renamed (rhythm_synco_1..6, boss_rhythm_synco)
- `src/locales/he/trail.json` — same EN rename, HE parity preserved (string values unchanged; were already English-only — pre-existing translation gap, not in plan scope)

## Decisions Made

- **Top-of-file rename history comment.** Added a one-line comment above the existing license/header block in `rhythmUnit8Redesigned.js` documenting the rhythm*8*_ → rhythm*synco*_ migration. Anyone reading the hidden-unit source gets immediate context for why the IDs don't follow the `rhythm_<unit>_<order>` numeric convention.
- **HIDDEN-V1 lead comment as 4-step re-enable checklist.** The lead HIDDEN-V1 comment is the primary documentation surface for the re-enable workflow. Expanding it from a single sentence to a numbered 4-step checklist (uncomment import → uncomment both spreads → add RHYTHM_SYNCO UNITS entry pre-authored by Plan 08 → update CLAUDE.md node counts) makes the operation mechanical for whoever revives this unit in a future release. The Plan 08 dependency is explicit so future readers don't try to author the UNITS entry from scratch.
- **trail.json ID-keyed unit8Nodes block: rename, not remove.** Both EN and HE trail.json contain a `unit8Nodes` block keyed by the literal `rhythm_8_*` IDs. These are direct ID references (not display-name keys), so leaving them in place would collide with new U8 (3/4 Meter) node IDs when Wave 2 lands. Renamed keys in lockstep with the source rename; string values preserved (pre-existing HE translation gap unchanged — the HE block already contained English strings from the original quick-task author and is outside this plan's scope).
- **Describe label keeps "renamed from rhythm*8*\*" prose.** The plan action explicitly asks for this — the rename should be visible at test-output time so future devs see the history. This is documentation text inside a string, not an ID reference; verify:trail and any namespace-collision check would correctly ignore it.

## Deviations from Plan

**None.** All 2 tasks executed exactly as specified. TDD RED → GREEN cycle ran cleanly on Task 1 with the predicted 4 failing tests, then all 32 tests green after the source rename.

## Issues Encountered

- **None blocking.** `npm run verify:trail` exits non-zero with the 3 pre-existing concept-per-unit violations (Wave 0 RED signal from Plan 01-01: U1, U4, U5) and 3 pre-existing orphan-tag warnings (`syncopation-heavy`, `dotted-syncopation`, `syncopation` — these tags exist in `RhythmPatternGenerator.js` only for the hidden unit and have been orphan since the unit was hidden in v3.4-era). This plan introduces zero new validator failures and zero new orphan tags.

## Expected Test State After This Plan

| Check                                                                 | Status                                                                   | Why                                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `npx vitest run src/data/units/rhythmUnit8Redesigned.test.js`         | GREEN (23/23)                                                            | Hidden-unit structural tests now assert new IDs                                                   |
| `npx vitest run src/data/units/rhythmUnits.difficulty.test.js`        | GREEN (9/9)                                                              | Symbol-based import (`rhythmUnit8Nodes`); no ID assertions to update                              |
| `npm run verify:trail`                                                | RED (3 pre-existing concept-per-unit violations + 3 orphan-tag warnings) | Unchanged from Plan 01-01 Wave 0 state; this plan introduces no new failures                      |
| `grep -rn "rhythm_8_\|boss_rhythm_8" src/ scripts/ supabase/ public/` | 2 doc references only                                                    | Source file's rename-history comment + test's describe label — both prose, not ID code references |

## Threat Flags

None — no new network surface, auth path, file access pattern, or trust-boundary changes. Pure data rename (IDs are local module symbols).

## Self-Check: PASSED

Verified all modified files exist and all task commits are reachable in git log:

- FOUND: `src/data/units/rhythmUnit8Redesigned.js` (modified, 7 IDs + 6 prereqs renamed, header comment added)
- FOUND: `src/data/units/rhythmUnit8Redesigned.test.js` (modified, expectedIds + describe label + 3 explicit assertions updated)
- FOUND: `src/data/expandedNodes.js` (modified, 4 HIDDEN-V1 markers preserved, 3 references to rhythm*synco*\*)
- FOUND: `src/locales/en/trail.json` (modified, unit8Nodes block renamed)
- FOUND: `src/locales/he/trail.json` (modified, unit8Nodes block renamed)
- FOUND: `.planning/phases/01-refactor-rhythm-trail-pedagogical-ordering-restructure-units/01-02-SUMMARY.md` (this file)
- FOUND commit: `84f73a5` (Task 1 RED — test assertions for new IDs)
- FOUND commit: `a132a18` (Task 1 GREEN — source ID rename)
- FOUND commit: `7ea7b31` (Task 2 — HIDDEN-V1 markers + locale keys)

## Next Phase Readiness

**For Wave 2 (Plans 01-05 through 01-08 — data file restructure):**

- The `rhythm_8_*` and `boss_rhythm_8` numeric namespace is now FREE. New U8 (3/4 Meter) author plans can claim these IDs without collision risk.
- The HIDDEN-V1 marker block in `expandedNodes.js` now references `rhythm_synco_*` IDs in its re-enable checklist — when Plan 08 pre-authors the `RHYTHM_SYNCO` UNITS entry per the marker comment, the re-enable workflow becomes a 3-step uncomment operation.

**For Plan 01-08 specifically:**

- The HIDDEN-V1 lead comment explicitly names Plan 08 as the pre-author of the RHYTHM_SYNCO UNITS map entry. Plan 08 should add a `RHYTHM_SYNCO` entry alongside `RHYTHM_8` (new 3/4 Meter unit) in `src/data/skillTrail.js` so future re-enable doesn't require new metadata authoring.

**For CLAUDE.md (deferred to milestone-close):**

- The CLAUDE.md `Hidden Content: Rhythm Unit 8` section still references `rhythm_8_*` / `boss_rhythm_8`. Per D-10 / 01-CONTEXT canonical refs, this should be updated to `rhythm_synco_*` / `boss_rhythm_synco` at milestone-close (the section's grep marker `HIDDEN-V1` still works, but the ID examples and node-count math should be refreshed). Logged here for milestone-close audit; not required for plan completion.

**No blockers.** Wave 1 Plan 02 deliverables are in place and committed.

---

_Phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units_
_Completed: 2026-06-01_
