---
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
wave: 2
status: gaps_found
generated: 2026-06-01
source: post-merge `npm run verify:trail`
---

# Wave 2 Post-Merge Integration Gaps

Wave 2 plans (01-05, 01-06, 01-07, 01-08) all completed their own contracts and merged
cleanly with no file deletions or shared-orchestrator conflicts. However, **`npm run verify:trail`
fails** because the cross-plan integration surfaced gaps that no single plan could see in isolation:

- Plan 01-07 authored U8 with `focusDurations: ["3_4"]` (and flagged the METER_ALLOWED whitelist
  issue as deferred in its SUMMARY).
- Plan 01-08 authored U9 with `focusDurations: ["6_8"]` and invented new tag names
  (`six-eight-basic`, `six-eight-qd-eighths`) without adding the corresponding patterns to the
  library; it also attached 3/4 and 6/8 tags to `boss_rhythm_10` which is configured in 4/4
  (flagged in its SUMMARY's "Key notes" section).

ROADMAP/STATE tracking was intentionally NOT updated for plans 05-08 per the workflow's
"only mark complete when tests pass" guard. Plans remain `in_progress` until verify:trail goes green.

## Error Inventory

### Class A — Validator METER_ALLOWED whitelist gap (2 errors, trivial fix)

The `validateConceptPerUnit` check in `scripts/validateTrail.mjs` was written before
meter-as-concept units existed. It currently restricts meter units to
`focusDurations: ['q','qd','8']`.

| Unit                        | Reported as                        | What it needs                    |
| --------------------------- | ---------------------------------- | -------------------------------- |
| U8 (rhythm*8*\*, 3/4 meter) | `non-pulse focusDurations ["3_4"]` | METER_ALLOWED to include `'3_4'` |
| U9 (rhythm*9*\*, 6/8 meter) | `non-pulse focusDurations ["6_8"]` | METER_ALLOWED to include `'6_8'` |

**Fix vector:** Edit `scripts/validateTrail.mjs::validateConceptPerUnit`'s METER_ALLOWED Set
to include `'3_4'` and `'6_8'`. ~2 lines, no tests.

### Class B — Pattern library missing 6/8 + 3/4 sub-tags (13 errors, real content authoring)

`src/data/patterns/RhythmPatternGenerator.js` provides a valid tag set including the bare
`six-eight` and `three-four` tags, but Wave 2's U9/U10 authors invented finer-grained
sub-tags that aren't in the library.

**Existing valid tags** (from validator output):
`dotted-half, dotted-quarter, dotted-syncopation, half-rest, quarter-eighth, quarter-half,
quarter-half-whole, quarter-half-whole-eighth, quarter-only, quarter-rest, six-eight,
sixteenth, syncopation, syncopation-heavy, three-four, whole-rest`

**Missing sub-tags referenced by Wave 2 nodes:**

| Tag                           | Referenced by                                                                 | Renders in                  | Required durations |
| ----------------------------- | ----------------------------------------------------------------------------- | --------------------------- | ------------------ |
| `six-eight-basic`             | rhythm_9_1, rhythm_9_2, rhythm_9_4, rhythm_9_5, boss_rhythm_9, boss_rhythm_10 | 6/8                         | qd, q, 8           |
| `six-eight-qd-eighths`        | rhythm_9_3, rhythm_9_4, rhythm_9_5, boss_rhythm_9, boss_rhythm_10             | 6/8                         | qd, q, 8           |
| `three-four-basic`            | boss_rhythm_10                                                                | 3/4 (NOT 4/4 — see Class C) | q, h, hd, qd, 8    |
| `three-four-with-dotted-half` | boss_rhythm_10                                                                | 3/4                         | q, h, hd, qd, 8    |

**Fix vector options:**

- **Option B1 (cheapest):** rename Wave 2 references to use the existing bare `six-eight` and
  `three-four` tags. Loses pedagogical granularity inside U9 (no progression from "basic" → "qd-eighths").
- **Option B2 (recommended):** add the 4 missing pattern definitions to RhythmPatternGenerator.js.
  Each needs ~3–6 patterns covering common cells (e.g., for `six-eight-basic`: `qd qd | qd qd | q-8 qd | qd q-8`).
  This matches the pedagogical arc U9 was designed for.

### Class C — `boss_rhythm_10` cross-meter design decision (4 errors, needs scoping)

`boss_rhythm_10` is the "Rhythm Review BOSS" — a review across all rhythm content. Plan 01-08
attached pattern tags from 4/4 (the unit's configured time signature) plus 3/4 (U8) and
6/8 (U9). The validator rejects this because patterns can't render in a foreign meter.

The plan's "Key notes" already flagged this: "U10's patternTags list was assembled from the
OLD boss_rhythm_6 tag inventory plus Plan 07-hinted U8 tags ... plus the U9 tags I authored.
If parallel agents author different tag names, Plan 09 can reconcile."

**Fix vector options:**

- **Option C1:** Strip 3/4 and 6/8 tags from boss_rhythm_10, leave it as a 4/4-only review.
  Simplest, but the "Rhythm Review BOSS" no longer reviews 3/4 or 6/8 content from U8/U9.
- **Option C2:** Split boss_rhythm_10 into three boss nodes (`boss_rhythm_10_4_4`,
  `boss_rhythm_10_3_4`, `boss_rhythm_10_6_8`). Cleanest data, but adds 2 more boss nodes
  and a sub-progression UX question (one boss → three boss completion gate?).
- **Option C3:** Extend boss node schema with per-exercise `timeSig` (so one boss can dispatch
  multi-meter exercises). Significant validator + game-engine + skill-progress-tracking change.
  Most flexible, highest cost.

**Recommendation:** C1 ships fastest; surface C2/C3 as v3.6+ work if multi-meter boss reviews
become a pedagogical requirement.

## Suggested Next Actions

1. **Decide** on Class C boss handling (C1/C2/C3) — design call, not a code fix.
2. **Author** a small gap-closure plan (01-08.1 or scope into 01-09) covering:
   - validateTrail METER_ALLOWED whitelist patch (Class A)
   - pattern library additions for the 4 missing sub-tags (Class B, option B2)
   - boss_rhythm_10 reconciliation per Class C decision
3. **Re-run** `npm run verify:trail` until green.
4. **Re-run** `/gsd-execute-phase 01 --wave 2` (no-op for completed plans — picks up only the
   incomplete tracking update once verify:trail passes).
5. **Then** proceed with `/gsd-execute-phase 01 --wave 3` for plans 01-09 and 01-10.

## What's on Disk Right Now

- ✓ 30 new files (rhythmUnit1.js..rhythmUnit10.js + tests + 4 SUMMARY.md)
- ✓ 2 modified files (expandedNodes.js wires U1-U10, skillTrail.js UNITS map updated)
- ✓ 19 commits across the 4 plans + 3 merge commits
- ✗ ROADMAP plan-progress NOT marked complete for 05/06/07/08
- ✗ `npm run verify:trail` fails with 15 errors (counted as Class A=2 + Class B=13)
- ✗ Class C is _implicit_ in Class B's 4 boss_rhythm_10 lines

Both unit-level vitest suites pass in isolation:

- U1/U2/U3: 63/63
- U4/U5: 45/45
- U6/U7/U8: 51/51
- U9 isolated: 9/9; U10 isolated: 7/7
