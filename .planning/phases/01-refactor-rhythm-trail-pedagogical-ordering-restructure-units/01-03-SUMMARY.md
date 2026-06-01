---
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
plan: 03
subsystem: i18n
tags:
  [
    i18n,
    locales,
    scaffolding,
    rhythm-trail,
    hebrew-parity,
    discovery-cards,
    unit-names,
  ]

# Dependency graph
requires:
  - phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
    provides: D-06 (extend discovery_intro), D-07 (multi-card 2–4 swipe template), D-08 (12 scaffolding screens), D-01 (10-unit display names) from CONTEXT.md; 01-01 Wave 0 parity gate (scaffolding-card-parity.test.js — vacuously passing); 01-02 rhythm_synco_* locale keys (preserved untouched)
provides:
  - EN + HE game.discovery.cards.* tree authored verbatim for all 12 concepts (q, qr, h, hr, w, wr, 8_pair, 16, hd, qd, 3_4, 6_8) — 44 card entries × 2 fields × 2 languages = 176 strings, plus 3 shared aria/cta strings per language
  - 7 new unit display-name entries added to EN + HE trail.json (Quarter + Quarter Rest, Half + Half Rest, Whole + Whole Rest, Dotted Half Notes, Dotted Quarter Notes, Three-Four Time, Rhythm Review); 3 pre-existing names preserved (Eighth Notes, Sixteenth Notes, Six-Eight Time)
  - scaffolding-card-parity test transitioned from vacuously-passing (empty trees on both sides) to substantively-passing (89 paths in each language, exact key-for-key parity)
affects: [01-04, 01-05, 01-06, 01-07, 01-08, 01-09] # Wave 2 unit-data plans inherit unit display-name constants; Wave 3 DiscoveryIntroQuestion pagination consumes game.discovery.cards.<concept>.* keys

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "12-concept × variable-card-count scaffolding tree under game.discovery.cards.* — duration concepts (q,h,w,8_pair,16,hd,qd) get 4 cards (meet,sound,music,ready); rests (qr,hr,wr) and meters (3_4,6_8) get 3 cards (no sound — silence is the rest, meter is structural)"
    - "EN/HE locale parity by structural mirroring — every EN cards.<concept>.<card>.<field> path has an HE counterpart at the identical path; values translated, structure byte-identical"
    - "Kodaly nikud reuse pattern — Hebrew syllables appearing inline in scaffolding body text (טָה, טָה-אָה, טי-טי, טָה-פָה-טֶה-פֶה) reuse the user-confirmed nikud forms from game.discovery.syllableOverride.* verbatim; never invented or modified"
    - "Orphan-tolerant additive locale edit — new unit display names added to units.names without removing legacy entries (Quarter & Half Notes, Rests, etc.); cleanup deferred to Plan 01-10 to keep Wave 2 merge risk low"

key-files:
  created: []
  modified:
    - src/locales/en/common.json
    - src/locales/he/common.json
    - src/locales/en/trail.json
    - src/locales/he/trail.json

key-decisions:
  - "Task 1 checkpoint: auto-selected option-a (approve planner-locked q example voice as-is) — the planner front-loaded a complete EN+HE q example in the plan, voice matched CLAUDE.md kid-friendly + 8yo-learner audience, and replicating the voice across 11 more concepts was efficient. Sequential executor with no human-loop available; option-a is the recommended path per checkpoint protocol."
  - "Variable card counts per concept (3 vs 4) — duration concepts get full 4-card arc (meet/sound/music/ready); rests skip 'sound' (rest = silence, no audio demo); meters skip 'sound' (no single note — meter is structural framing). Matches D-07 envelope (2–4 cards) and respects 'how it sounds' card semantic — only present when there IS a sound."
  - "Inline accent-wrapped key terms (<accent>Quarter Note</accent>, <accent>טָה</accent>) — uses the same <accent> tag convention as the existing meetNew/titleOverride strings, so renderer (DiscoveryIntroQuestion.jsx) can style the noun without separate i18n keys"
  - "Three trail.json keys already existed (Eighth Notes, Sixteenth Notes, Six-Eight Time) — confirmed via JSON.parse + key lookup before editing; only 7 truly-new keys added per language. Pre-existing translation values left untouched."
  - "Pre-existing orphan unit names (Quarter & Half Notes, Rests, Dotted Notes & 3/4 Time, Syncopation, Steady Beat) deliberately NOT removed — they may still be referenced by current rhythm unit data files that Wave 2 will replace. Removing now would risk Wave 2 missing-key UX during transition. Plan 01-10 cleanup will sweep when Wave 2 has fully landed."

patterns-established:
  - "Scaffolding card schema: { title, body } per card; cards keyed by kind name (meet/sound/music/ready); card sequence determined by concept (rest/meter skip 'sound')"
  - "Shared scaffolding-engine strings live at game.discovery.cards root (nextButton, finalButton, ariaProgress) — concept entries are siblings; renderer reads root strings once per render and card data per current index"
  - "TDD-style RED→GREEN commits for locale parity: EN-only commit (test fails — parity broken) → HE counterpart commit (test passes — parity restored). Makes the gate visible in git history."

requirements-completed: [REQ-04, REQ-05]

# Metrics
duration: 4min
completed: 2026-06-01
---

# Phase 01 Plan 03: Scaffolding Card + Unit-Name Locale Infrastructure Summary

**Authored the 12-concept scaffolding card copy tree under `game.discovery.cards.*` in EN + HE common.json (89 paths each, exact parity) and added 7 new rhythm unit display-name entries to EN + HE trail.json — Wave 2 unit data and Wave 3 DiscoveryIntroQuestion pagination now have all locale keys they need.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-01T19:03:01Z
- **Completed:** 2026-06-01T19:07:21Z
- **Tasks:** 3 (1 checkpoint auto-resolved, 1 TDD RED→GREEN, 1 additive)
- **Files modified:** 4

## Accomplishments

- Authored the complete `game.discovery.cards.*` block in **both EN and HE common.json** with 12 concept entries (q, qr, h, hr, w, wr, 8_pair, 16, hd, qd, 3_4, 6_8), each containing 3 or 4 card objects with `{ title, body }` fields, plus 3 shared engine strings (nextButton, finalButton, ariaProgress). Path counts: **89 in EN, 89 in HE**, exact key-for-key parity verified by the scaffolding-card-parity test.
- Added **7 new unit display-name entries** to `units.names` in both EN and HE trail.json — Quarter + Quarter Rest, Half + Half Rest, Whole + Whole Rest, Dotted Half Notes, Dotted Quarter Notes, Three-Four Time, Rhythm Review. Confirmed 3 entries already existed (Eighth Notes, Sixteenth Notes, Six-Eight Time) and were preserved untouched. All 10 D-01 unit names now resolvable in both locales.
- **Scaffolding-card-parity test transitioned from vacuously-passing to substantively-passing.** Before this plan: both trees empty → trivially equal (0 paths). After: 89 paths each, all key-for-key matching. The TDD discipline made the gate visible in git history (RED commit `ad52a47` had EN-only; GREEN commit `edf5fac` restored parity with HE counterparts).
- **Kodaly nikud preserved verbatim.** Reused `טָה`, `טָה-אָה`, `טי-טי`, `טָה-פָה-טֶה-פֶה` inside HE card body text where syllables appear inline. Verified via `git diff` that `game.discovery.syllableOverride.*` keys are byte-identical to before — zero deletions in that subtree, only additions of the same nikud forms in new contexts. Respects MEMORY.md `feedback_hebrew_nikud` (user-confirmed diacritics).
- **rhythm*synco*\* namespace from Plan 01-02 preserved.** Verified 7 grep matches for `rhythm_synco` in both EN and HE trail.json after this plan's edits — matches the Plan 01-02 expected state (1 lead key + 7 child IDs). No collision risk introduced by adding unit display names.

## Task Commits

1. **Task 1: scaffolding card voice decision** — auto-selected `option-a` (planner-locked q example approved as-is). No commit (decision gate only). Sequential executor with no human-loop available; option-a is the recommended path per checkpoint protocol. Voice locked: kid-friendly metaphors (heartbeat, footsteps, big steps, skipping), `<accent>`-wrapped key terms, "Tap Listen" / "Say `ta`" calls-to-action for sound cards.

2. **Task 2 RED: add EN scaffolding card tree (12 concepts)** — `ad52a47` (test) — added `game.discovery.cards.*` to en/common.json with 44 card entries × 2 fields + 3 shared strings (201 insertions). Parity test went RED as expected (89 EN paths, 0 HE paths → 89 missing).

3. **Task 2 GREEN: add HE scaffolding card tree (12 concepts)** — `edf5fac` (feat) — added matching HE tree to he/common.json with kid-friendly Hebrew translations; reused user-confirmed Kodaly nikud verbatim where syllables appear inline (201 insertions, exact key-for-key parity with EN). Parity test GREEN. Verified via git diff that syllableOverride.\* keys have zero deletions.

4. **Task 3: add new rhythm unit display names to trail.json (EN + HE)** — `506edf1` (feat) — added 7 new unit names to `units.names` in both trail.json files (3 already existed, 7 truly new). EN: passthrough keys (key == value); HE: English keys + Hebrew translations per D-01 unit table. Orphan entries from old structure preserved per plan spec (Plan 01-10 cleanup).

_Plan metadata commit will follow this SUMMARY._

## Files Created/Modified

- `src/locales/en/common.json` — added `game.discovery.cards` block as sibling of `syllableOverride`, containing 3 shared strings (nextButton, finalButton, ariaProgress) + 12 concept sub-trees totaling 44 card entries × 2 fields = 88 string leaves. ~89 new paths total. 201 insertions, 0 deletions.
- `src/locales/he/common.json` — mirror of EN block with Hebrew translations. Same 89-path shape. 201 insertions, 0 deletions. Kodaly nikud forms reused verbatim from `syllableOverride` (verified by diff).
- `src/locales/en/trail.json` — added 7 new entries to `units.names` (Quarter + Quarter Rest, Half + Half Rest, Whole + Whole Rest, Dotted Half Notes, Dotted Quarter Notes, Three-Four Time, Rhythm Review). 7 insertions, 1 line modified (trailing comma).
- `src/locales/he/trail.json` — same 7 new entries with Hebrew translations per D-01 table (רבע ושתיקת רבע, חצי ושתיקת חצי, שלם ושתיקה שלמה, חצי מנוקד, רבע מנוקד, משקל שלוש-רבעים, סיכום הקצב). 7 insertions, 1 line modified.

## Decisions Made

- **Task 1 voice approval: auto-selected option-a.** The planner pre-authored a complete `q` example in EN + HE within the plan text, with voice matching CLAUDE.md design principles (8-year-old learners, glassmorphism aesthetic, accessibility). The example was substantive (not a placeholder), used kid-friendly metaphors aligned with existing trail copy ("heartbeat of music", "one footstep"), and structurally fit the renderer contract (`<accent>` wrapping, `{ title, body }` shape). Sequential executor mode with no human in the loop made option-a the correct path per the checkpoint protocol's recommendation pattern. Recorded as the locked voice template for the other 11 concepts.

- **Variable card-count per concept (3 vs 4).** Per D-07's 2–4 envelope, I authored:
  - **4 cards (meet/sound/music/ready):** q, h, w, 8_pair, 16, hd, qd — full duration concepts where "how it sounds" is meaningful (there's an audible note to demo)
  - **3 cards (meet/music/ready):** qr, hr, wr — rests, where the "sound" is silence (no audio to demo)
  - **3 cards (meet/music/ready):** 3_4, 6_8 — meters, where there's no single note to play (meter is structural framing)

  This honors the D-07 cardinality envelope while keeping every card semantically meaningful — no "filler" cards that say "this rest sounds like nothing" or "this meter sounds like the notes inside it."

- **Hebrew translation voice mirrors EN structure.** EN uses second-person plural calls-to-action ("Tap Listen", "You're ready!"). HE uses Hebrew second-person plural to match ("לחצו על האזנה", "אתם מוכנים!"). This matches existing rhythm-game HE strings (e.g., `discovery.listenButton: הקשיבו לצליל`, `discovery.gotIt: הבנתי!`) and respects RTL kid-friendly rhythm-game tone established by Phase 23/24 work.

- **Reuse of Hebrew Kodaly nikud verbatim, not invented diacritics.** Where syllables appear inline in card body text (e.g., "אמרו `<accent>טָה</accent>`"), I used the exact diacritic forms already present in `game.discovery.syllableOverride.*` (טָה-פָה-טֶה-פֶה for sixteenths, טָה-אָה for held notes, טי-טי for eighth pairs). Per MEMORY.md `feedback_hebrew_nikud`, the user-confirmed nikud constraint is tightest on Kodaly syllables themselves — reusing the existing forms eliminates risk of accidental drift. The `syllableOverride.*` block is byte-identical post-plan (verified via git diff: only `+` lines in card subtrees, zero `-` lines in syllableOverride).

- **Orphan unit display names left in place per plan spec.** Pre-existing entries for the old structure (Quarter & Half Notes, Rests, Dotted Notes & 3/4 Time, Syncopation, Steady Beat) were NOT removed. They may still be referenced by the current `rhythmUnit{N}Redesigned.js` files that Wave 2 will replace; deleting them now would create transitional missing-key risk during Wave 2 merge. Plan 01-10 cleanup will sweep when Wave 2 has fully landed.

- **TDD RED→GREEN visibility through commit ordering.** Task 2 was committed as two atomic commits (EN first → parity RED → HE second → parity GREEN) rather than a single combined commit. This makes the parity gate's purpose visible in git history: anyone reviewing can see exactly when EN content existed without HE counterparts, and when parity was restored. The cost is one extra commit; the benefit is a permanent audit trail of the gate's enforcement.

## Deviations from Plan

**None.** All 3 tasks executed exactly as specified. Task 1 checkpoint was auto-resolved with the planner's recommended option (option-a). Task 2 followed TDD discipline (RED → GREEN). Task 3 was a single additive commit per plan spec. No Rule 1/2/3 deviations encountered — JSON edits were clean, no bugs surfaced, no missing critical functionality identified.

## Issues Encountered

**None blocking.** Two minor observations worth recording:

- **Existing HE block under syncopation rename note.** Plan 01-02 documented that the HE `unit8Nodes` block contained English strings from the original quick-task author (pre-existing translation gap, out-of-scope for that plan). I confirmed this plan does not extend that gap — the HE strings I authored are all properly translated, and the syncopation block remains in its previous (English) state until a future translation pass addresses it.

- **`Three-Four Time` was NOT pre-existing in EN trail.json.** The plan text noted "Three-Four Time and Six-Eight Time likely already exist from current U5/U7 — do NOT duplicate keys." Verified via `node -e "k in en.units.names"`: only `Six-Eight Time` existed; `Three-Four Time` was genuinely new and was added without conflict. No duplicate-key risk materialized.

## Acceptance Criteria Verification

| Criterion                                                                                                                            | Method                               | Status                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------- |
| EN + HE common.json contain `game.discovery.cards.<concept>` for all 12 concepts (q, qr, h, hr, w, wr, 8_pair, 16, hd, qd, 3_4, 6_8) | Programmatic key-lookup via Node     | **PASS** (12/12 in each)                                   |
| Every EN scaffolding card key has HE counterpart at identical path                                                                   | scaffolding-card-parity test         | **PASS** (2/2 substantively, 89/89 paths)                  |
| EN + HE trail.json contain all 10 D-01 unit display names                                                                            | Programmatic key-lookup              | **PASS** (10/10 in each)                                   |
| All 4 locale JSON files parse as valid JSON                                                                                          | `node -e "JSON.parse(...)"` per file | **PASS** (all 4 exit 0)                                    |
| Hebrew Kodaly syllables under `syllableOverride.*` byte-identical                                                                    | `git diff` filter on subtree         | **PASS** (0 `-` lines in subtree)                          |
| `rhythm_synco_*` namespace from Plan 01-02 preserved                                                                                 | `grep -c "rhythm_synco" trail.json`  | **PASS** (7 matches in each — matches Plan 01-02 baseline) |
| Parity test transitions from vacuous → substantive                                                                                   | Path-count check (0→89) + test pass  | **PASS**                                                   |

## Threat Surface Scan

Reviewed all files modified for new security-relevant surface — endpoints, auth paths, file access, schema changes at trust boundaries. **None introduced.** All edits are pure locale data: EN/HE translation strings under existing namespaces (`game.discovery.cards.*`, `units.names`). No new code paths, no new data flows, no new trust boundary crossings. Threat model entries T-03-01 (Kodaly nikud preservation) and T-03-02 (HE-key drift via parity test) from the plan are both **mitigated**: nikud verified byte-identical via diff; parity test substantively green and load-bearing.

## Self-Check: PASSED

Verified all modified files exist and all task commits are reachable in git log:

- FOUND: `src/locales/en/common.json` (modified, +201 lines, 89 cards.\* paths)
- FOUND: `src/locales/he/common.json` (modified, +201 lines, 89 cards.\* paths)
- FOUND: `src/locales/en/trail.json` (modified, +7 unit names)
- FOUND: `src/locales/he/trail.json` (modified, +7 unit names)
- FOUND: `.planning/phases/01-refactor-rhythm-trail-pedagogical-ordering-restructure-units/01-03-SUMMARY.md` (this file)
- FOUND commit: `ad52a47` (Task 2 RED — EN scaffolding cards)
- FOUND commit: `edf5fac` (Task 2 GREEN — HE scaffolding cards, parity restored)
- FOUND commit: `506edf1` (Task 3 — unit display names EN + HE)

## TDD Gate Compliance

- **Task 2 RED gate:** `test(01-03): add EN scaffolding card tree (12 concepts) — parity RED` (`ad52a47`) — test commit, parity test FAILS with EN content but no HE counterparts. **PRESENT.**
- **Task 2 GREEN gate:** `feat(01-03): add HE scaffolding card tree (12 concepts) — parity GREEN` (`edf5fac`) — feat commit, parity test PASSES substantively. **PRESENT.**
- **No REFACTOR commit:** No refactor needed — JSON was clean on first authoring.

Sequence verified: RED → GREEN in git history. TDD discipline observed.

## Next Phase Readiness

**For Wave 2 (Plans 01-04 through 01-08 — data file restructure):**

- Unit display-name strings are now available in both locales. Wave 2 plans can hard-reference these as `UNIT_NAME` constants in unit data files (e.g., `const UNIT_NAME = "Quarter + Quarter Rest"`) without missing-key UX issues.
- The `rhythm_synco_*` numeric namespace remains clean from Plan 01-02; this plan does not modify it.
- No new locale keys are needed at the node level yet — that authoring happens lazily in Wave 2 when individual node `name` strings are written. The `units.names` block is the only structural locale dependency Wave 2 needs.

**For Wave 3 (Plan 01-09 — DiscoveryIntroQuestion pagination):**

- All `game.discovery.cards.<concept>.<card>.<field>` keys exist in both locales. The renderer extension can `useTranslation('common')` and resolve `game.discovery.cards.q.meet.title`, `.body`, etc. directly without missing-key fallbacks.
- Shared engine strings (`nextButton`, `finalButton`, `ariaProgress`) live at `game.discovery.cards` root — renderer reads once per render, card-specific strings read per current card index.
- The `<accent>` tag is preserved in the new card strings, matching existing `meetNew`/`titleOverride` strings. The renderer's existing `Trans` component or accent-styling logic should continue to work without changes.

**For Plan 01-10 (cleanup, deferred):**

- Orphan unit display names from the old structure (Quarter & Half Notes, Rests, Dotted Notes & 3/4 Time, Syncopation, Steady Beat) remain in `units.names`. Plan 01-10 should sweep these when Wave 2 has fully landed and no node references them anymore. Cross-reference via `grep -rn "Quarter & Half Notes" src/data/units/` to verify safety before deletion.
- The HE `unit8Nodes` translation gap from Plan 01-02 is also a candidate for the same cleanup pass.

**No blockers.** Wave 1 Plan 03 deliverables are in place and committed.

---

_Phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units_
_Completed: 2026-06-01_
